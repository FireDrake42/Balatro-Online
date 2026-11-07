/* Exp Interest: actual current-bank income, not a passive session or offline claim.
 * One guarded PROFILE write owns both the exact XP and this compact highwater.
 * No reload timestamp is ever converted into elapsed income. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('./progression'):root.BOProgress,root,typeof module==='object'&&module.exports?require('./interest-settings'):root.BOInterestSettings,typeof module==='object'&&module.exports?require('./late-level-rules'):root.BOLateLevels,typeof module==='object'&&module.exports?require('./interest-legacy'):root.BOInterestLegacy,typeof module==='object'&&module.exports?require('./compound-interest-proof'):root.BOCompoundProof);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.BOExpInterest=api;})(typeof window!=='undefined'?window:null,function(PG,root,IS,LL,Legacy,Proof){'use strict';
 const PROFILE='danis-table.profile.v1',INTERVAL_MS=1000,MAX_GAP_MS=2500,FENCE=PROFILE+'.exp-interest.committed.',LEASE=PROFILE+'.exp-interest.lease.v1';
 const copy=x=>JSON.parse(JSON.stringify(x)),record=x=>!!x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 const check=(ok,message)=>{if(!ok)throw new Error('Exp Interest: '+message)};
 function create(){return Legacy.create()}
 function normalize(value){return record(value)&&Object.getOwnPropertyDescriptor(value,'version')?.value===5?Proof.normalize(value):Legacy.normalize(value)}
 function validateProfile(profile){check(record(profile)&&record(profile.progression),'actual whole player profile unavailable.');const state=normalize(profile.expInterest);if(state.version===5)return Proof.validateProfile(profile);return true}
 function validateMirror(profile){check(record(profile)&&record(profile.progression),'partial Player mirror unavailable.');PG.costPolicy(profile.progression);const state=normalize(profile.expInterest);return state.version===5?Proof.validateMirror(profile):true}
 function rate(p,config){check(record(p)&&Number.isInteger(p.level)&&p.level>=1&&p.level<=100&&finite(p.xp),'invalid current player level or XP bank.');if(p.level<20||p.level>=100)return 0;const policy=IS.effective(p.level,config),amount=p.xp*policy.rateFraction*PG.jokerXpMultiplier(config)*PG.earnedXpMultiplier(p.level)*PG.pokerXpMultiplier(config);check(finite(amount)&&amount<=Number.MAX_SAFE_INTEGER,'XP overflow; no income was changed.');return amount}
 function intervalMs(level,config){check(Number.isInteger(level)&&level>=1&&level<=100,'invalid actual player level.');return IS.effective(level,config).intervalMs}
 function step(progression,ledger,at,config){
  const state=normalize(ledger),baseAmount=rate(progression,config),fromLevel=progression.level,interval=intervalMs(fromLevel,config);
  check(Number.isSafeInteger(at)&&at>=0,'invalid tick time.');const slot=at;
  const c=config||{},context=c.interestContext||{slot:c.costContext?.slot||{id:1,generation:'model-only'},run:null},whole=c.costContext?.beforeProfile,profile=whole?{...copy(whole),progression:copy(progression)}:{progression:copy(progression),...(c.potionState!==undefined?{potions:copy(c.potionState)}:{}),...(c.pokerEvents!==undefined?{emeraldPokerEvents:copy(c.pokerEvents)}:{})},now=c.now===undefined?slot:c.now;
  if(PG.costPolicy(progression))check(record(whole),'a typed cost source needs the actual original whole PROFILE, not omitted Poker/Slots projections.');
  profile.expInterest=state;
  if(state.version===5)validateProfile(profile);
  if(!baseAmount||slot<interval||slot-state.lastTickAt<interval)return {ok:true,unchanged:true,awardedXp:0,fromLevel,toLevel:fromLevel,state,progression:copy(progression)};
  const source=Proof.source(profile,c,context.run,now,'interest:'+(state.revision+1)),actual=Proof.terms(progression,source);
  // Numeric assertions are never source proof. Native Engine/Poker inputs must
  // reproduce the current formula exactly, in its original operation order.
  check(actual.base===baseAmount,'native interest sources do not match the actual rate.');
  const r=Proof.admit(profile,state,slot,{slot:context.slot,prefs:c,run:context.run,now});
  return {...r,ok:true,unchanged:false,fromLevel,toLevel:r.profile.progression.level,awardedXp:r.award,baseAwardedXp:r.base,criticalAwardedXp:r.critical?r.award:0,progression:r.profile.progression,state:r.state};
 }
 // The controller supplies ONLY captured foreground monotonic elapsed time.
 // One durable whole-PROFILE transaction may contain several real payments;
 // each compounds on the preceding native progression result and cap/interval.
 // The bounded remainder is presentation-session memory, never wall catch-up.
 function payEligible(progression,ledger,elapsedMs,at,config){
  check(finite(elapsedMs)&&elapsedMs<=MAX_GAP_MS,'invalid eligible interval; never claim an offline gap.');check(Number.isSafeInteger(at)&&at>=0,'invalid captured receipt time.');
  let next=copy(progression),state=normalize(ledger),consumedMs=0,awardedXp=0,baseAwardedXp=0,criticalAwardedXp=0,criticalPayments=0,payments=0,lastResult=null;
  if(state.version===5)validateMirror({progression:next,expInterest:state});
  while(true){
   const c=typeof config==='function'?config(next):config,interval=intervalMs(next.level,c);if(elapsedMs-consumedMs<interval||!rate(next,c))break;
   const grid=1,receiptAt=state.revision?state.lastTickAt+interval:Math.max(interval,Math.floor(at/grid)*grid);
   check(Number.isSafeInteger(receiptAt),'receipt clock overflow.');const r=step(next,state,receiptAt,c);check(!r.unchanged,'captured payment did not advance its receipt.');
   next=r.progression;state=r.state;consumedMs+=interval;awardedXp+=r.awardedXp;baseAwardedXp+=r.baseAwardedXp;criticalAwardedXp+=r.criticalAwardedXp;check(finite(awardedXp)&&awardedXp<=Number.MAX_SAFE_INTEGER&&finite(baseAwardedXp)&&finite(criticalAwardedXp),'batch total overflow; no income was changed.');criticalPayments+=r.critical?1:0;payments++;lastResult=r;
  }
  return {...(lastResult||{}),ok:true,unchanged:payments===0,fromLevel:progression.level,toLevel:next.level,progression:next,state,awardedXp,baseAwardedXp,critical:criticalPayments>0,criticalPayments,criticalAwardedXp,payments,consumedMs,remainderMs:elapsedMs-consumedMs};
 }
 // A synchronous gameplay API cannot await a browser-lock-manager query at
 // every write. Keep one live writer permit instead. Losing, already-loaded
 // game tabs are view-only forever; only a FRESH validated hosted-survey return
 // document may ask the owner to yield before it loads PROFILE/SAVE.
 function createWriterGuard(api={},env=root){/*R4:I:HELPER*/var __boR4WR=null,__boR4WC=null,__boR4WT=null,__boR4WN=0,__boR4WCB="",__boR4WQ=false;try{var __boR4WH=document.getElementById("bo-r4-hud"),__boR4WE=document.getElementById("bo-r4-writer"),__boR4WD=Object.getOwnPropertyDescriptor(window,"__BO_STARTUP_TRACE_R4__"),__boR4WHD=__boR4WH&&Object.getOwnPropertyDescriptor(__boR4WH,"__BO_STARTUP_TRACE_R4__"),__boR4WED=__boR4WE&&Object.getOwnPropertyDescriptor(__boR4WE,"__BO_STARTUP_TRACE_R4__");if(__boR4WH&&__boR4WE&&__boR4WD&&__boR4WD.value&&typeof __boR4WD.value==="object"&&!__boR4WD.writable&&!__boR4WD.configurable&&__boR4WHD&&__boR4WED&&__boR4WHD.value===__boR4WD.value&&__boR4WED.value===__boR4WD.value&&__boR4WH.getAttribute("data-r4-active")==="1"&&__boR4WH.contains(__boR4WE)){__boR4WR=__boR4WH;__boR4WC=__boR4WE;__boR4WT=__boR4WD.value}}catch(__boR4WI){}function __boR4Writer(id){try{var a=["MODE_NATIVE","MODE_LEASE","REQUEST_BEFORE","REQUEST_CHAIN_RETURNED","CALLBACK_ENTER","CALLBACK_NULL","CALLBACK_GRANTED","RETURN_QUEUE","LEASE_HANDOFF_WAIT","LEASE_HANDOFF_RESUMED","LEASE_CLAIM","LEASE_WAIT","LEASE_RESUMED","LEASE_READBACK_PATH","HANDOFF_WAIT","HANDOFF_RESUMED","HANDOFF_CONFIRMED"],i,ok=false,d,h,c,s;for(i=0;i<a.length;i++)if(id===a[i])ok=true;if(!ok||!__boR4WR||!__boR4WC||__boR4WN>=9999||document.getElementById("bo-r4-hud")!==__boR4WR||document.getElementById("bo-r4-writer")!==__boR4WC||__boR4WR.getAttribute("data-r4-active")!=="1"||!__boR4WR.contains(__boR4WC))return;d=Object.getOwnPropertyDescriptor(window,"__BO_STARTUP_TRACE_R4__");h=Object.getOwnPropertyDescriptor(__boR4WR,"__BO_STARTUP_TRACE_R4__");c=Object.getOwnPropertyDescriptor(__boR4WC,"__BO_STARTUP_TRACE_R4__");if(!d||!h||!c||d.value!==__boR4WT||h.value!==__boR4WT||c.value!==__boR4WT)return;if(id==="REQUEST_BEFORE")__boR4WCB="";if(id==="CALLBACK_ENTER")__boR4WCB="ENTER";if(id==="CALLBACK_NULL")__boR4WCB="NULL";if(id==="CALLBACK_GRANTED")__boR4WCB="GRANT";if(id==="MODE_NATIVE"||id==="MODE_LEASE")__boR4WQ=false;if(id==="RETURN_QUEUE")__boR4WQ=true;__boR4WN++;s="WRITER W"+__boR4WN+" "+id+(__boR4WCB?" CB="+__boR4WCB:"")+(__boR4WQ?" RETURN":"");if(s.length<=64)__boR4WC.textContent=s}catch(__boR4WI){}}/*R4:E:HELPER*/
  const NAME=PROFILE+'.writer',KEY=PROFILE+'.writer-lease.v1',CHANNEL=PROFILE+'.writer-handoff.v1',owner=env.crypto?.randomUUID?.()||'writer-'+Date.now()+'-'+Math.random();
  const locks=env.navigator?.locks,reason='This game tab is view-only. Another game tab owns this save; close it, then reload here to play.',fallbackNote='Browser locks unavailable: guarded single-tab saving. Keep only one game tab open.';
  let allowed=false,ready=false,release=null,renewal=null,channel=null,yielded=false,mode=locks?.request?'web-lock':'guarded-lease',replyTo=null,failure='';
  const now=()=>Date.now();
  function lease(){const raw=env.localStorage.getItem(KEY);if(raw===null)return null;const value=JSON.parse(raw);check(record(value)&&typeof value.owner==='string'&&Number.isSafeInteger(value.until),'invalid writer lease.');return value}
  function renew(){const current=lease();if(current?.owner!==owner){allowed=false;yielded=true;return false}env.localStorage.setItem(KEY,JSON.stringify({owner,until:now()+10000}));return true}
  function canWrite(){if(!allowed||!ready||yielded)return false;try{if(env.localStorage.getItem('danis-table.manual-recovery.journal.v1')!==null){allowed=false;yielded=true;failure='Manual recovery is pending. Close this game tab and use the read-only recovery page; keep browser data.';return false}}catch(_){allowed=false;yielded=true;failure='Save storage is uncertain. Reload safely before writing.';return false}if(mode==='guarded-lease')try{if(lease()?.owner!==owner){allowed=false;yielded=true;return false}}catch(_){allowed=false;return false}return true}
  function assert(){check(canWrite(),failure||reason)}
  function status(){const writable=canWrite();return {writable,mode,reason:writable?'':failure||reason,note:mode==='guarded-lease'?fallbackNote:''}}
  function yieldPermit(request){if(!canWrite())return;const witness=api.beforeYield?.();if(mode==='guarded-lease')try{if(lease()?.owner===owner)env.localStorage.removeItem(KEY)}catch(_){}allowed=false;yielded=true;if(renewal!==null)env.clearInterval(renewal);renewal=null;release?.();release=null;if(request)channel?.postMessage({type:'handoff-granted',to:request.owner,sessionId:request.sessionId,witness});api.changed?.()}
  try{if(env.BroadcastChannel){channel=new env.BroadcastChannel(CHANNEL);channel.onmessage=event=>{const m=event.data;if(m?.type==='handoff-granted'&&m.to===owner){replyTo?.(m);return}if(m?.type==='fresh-survey-return'&&typeof m.sessionId==='string'&&m.owner!==owner&&canWrite()&&api.validReturn?.(m.sessionId))yieldPermit(m)}}}catch(_){channel=null}
  function ask(returnId){let finish;const reply=new Promise(resolve=>finish=resolve),timeout=env.setTimeout(()=>finish(null),3000);replyTo=m=>{if(m.sessionId===returnId)finish(m.witness)};channel.postMessage({type:'fresh-survey-return',sessionId:returnId,owner});return {reply,close:()=>{env.clearTimeout(timeout);replyTo=null}}}
  async function confirmHandoff(reply){/*R4:I:HANDOFF_WAIT*/;__boR4Writer("HANDOFF_WAIT");/*R4:E:HANDOFF_WAIT*/const witness=await reply;/*R4:I:HANDOFF_RESUMED*/;__boR4Writer("HANDOFF_RESUMED");/*R4:E:HANDOFF_RESUMED*/for(let i=0;witness&&i<=20;i++){try{if(api.matchesWitness?.(witness)){/*R4:I:HANDOFF_CONFIRMED*/;__boR4Writer("HANDOFF_CONFIRMED");/*R4:E:HANDOFF_CONFIRMED*/ready=true;return true}}catch(_){}if(i<20)await new Promise(r=>env.setTimeout(r,50))}failure='Save handoff could not confirm fresh XP data. This tab is view-only; reload before playing.';destroy();return false}
  async function attempt(options){return new Promise((resolve,reject)=>{/*R4:I:REQUEST_BEFORE*/;__boR4Writer("REQUEST_BEFORE");/*R4:E:REQUEST_BEFORE*/locks.request(NAME,options,lock=>{/*R4:I:CALLBACK_ENTER*/;__boR4Writer("CALLBACK_ENTER");/*R4:E:CALLBACK_ENTER*/if(!lock){/*R4:I:CALLBACK_NULL*/;__boR4Writer("CALLBACK_NULL");/*R4:E:CALLBACK_NULL*/resolve(false);return}/*R4:I:CALLBACK_GRANTED*/;__boR4Writer("CALLBACK_GRANTED");/*R4:E:CALLBACK_GRANTED*/allowed=true;resolve(true);return new Promise(done=>{release=()=>{allowed=false;done()}})}).catch(reject)/*R4:I:REQUEST_CHAIN_RETURNED*/;__boR4Writer("REQUEST_CHAIN_RETURNED");/*R4:E:REQUEST_CHAIN_RETURNED*/})}
  async function acquire(returnId){
   if(mode==='web-lock'){/*R4:I:MODE_NATIVE*/;__boR4Writer("MODE_NATIVE");/*R4:E:MODE_NATIVE*/
    if(await attempt({mode:'exclusive',ifAvailable:true})){ready=true;return true;}
    if(returnId&&channel){/*R4:I:RETURN_QUEUE*/;__boR4Writer("RETURN_QUEUE");/*R4:E:RETURN_QUEUE*/const request=ask(returnId),controller=new env.AbortController(),timeout=env.setTimeout(()=>controller.abort(),3000);try{if(await attempt({mode:'exclusive',signal:controller.signal}))return await confirmHandoff(request.reply)}catch(e){if(e.name!=='AbortError')throw e}finally{env.clearTimeout(timeout);request.close()}}return false;
   }
   // localStorage has no compare-and-swap. This bounded contention/owner lease
   // is deliberately a guarded fallback, not a promise of browser-lock strength.
   /*R4:I:MODE_LEASE*/;__boR4Writer("MODE_LEASE");/*R4:E:MODE_LEASE*/let current=lease(),witness=null;if(current&&current.until>now()&&returnId&&channel){const request=ask(returnId);try{/*R4:I:LEASE_HANDOFF_WAIT*/;__boR4Writer("LEASE_HANDOFF_WAIT");/*R4:E:LEASE_HANDOFF_WAIT*/witness=await request.reply/*R4:I:LEASE_HANDOFF_RESUMED*/;__boR4Writer("LEASE_HANDOFF_RESUMED");/*R4:E:LEASE_HANDOFF_RESUMED*/}finally{request.close()}current=lease();if(!witness)return false}if(current&&current.until>now())return false;
   /*R4:I:LEASE_CLAIM*/;__boR4Writer("LEASE_CLAIM");/*R4:E:LEASE_CLAIM*/const claim=JSON.stringify({owner,until:now()+10000});env.localStorage.setItem(KEY,claim);/*R4:I:LEASE_WAIT*/;__boR4Writer("LEASE_WAIT");/*R4:E:LEASE_WAIT*/await new Promise(r=>env.setTimeout(r,60));/*R4:I:LEASE_RESUMED*/;__boR4Writer("LEASE_RESUMED");/*R4:E:LEASE_RESUMED*//*R4:I:LEASE_READBACK_PATH*/;__boR4Writer("LEASE_READBACK_PATH");/*R4:E:LEASE_READBACK_PATH*/if(env.localStorage.getItem(KEY)!==claim)return false;allowed=true;if(witness&&!await confirmHandoff(Promise.resolve(witness)))return false;ready=true;
   renewal=env.setInterval(()=>{if(!canWrite())return;try{renew()}catch(_){/* The next durable write still has its own quota check. */}},2500);
   return true;
  }
  function destroy(){allowed=false;ready=false;yielded=true;if(renewal!==null)env.clearInterval(renewal);renewal=null;release?.();release=null;channel?.close();channel=null;if(mode==='guarded-lease')try{if(lease()?.owner===owner)env.localStorage.removeItem(KEY)}catch(_){}}
  // Hidden tabs retain the live WebLock. Actual document destruction releases
  // it in the browser; fallback leases can be relinquished on a real navigation.
  const pagehide=event=>{if(mode==='guarded-lease'&&!event.persisted)destroy()};env.addEventListener('pagehide',pagehide);
  return {acquire,assert,canWrite,status,yield:yieldPermit,destroy};
 }
 function createController(api,env=root){
  check(env&&api?.getProfile&&api.capture&&api.transact,'ticker host unavailable.');
  const native=root?.BONativeObservedWork?.isNative(api.nativeObservedWork)?api.nativeObservedWork:null;
  check(api.nativeObservedWork===undefined||native,'original private native work capability required');
  // Optional original-controller bridge. Each payment receives the COMPLETE
  // preceding native whole, including BOTH progression and its interest receipt.
  // The public legacy payEligible and every rate/step/proof/cost/RNG rule stay exact.
  function payNativePrefix(whole,elapsed,at){
   check(native&&finite(elapsed)&&elapsed<=MAX_GAP_MS,'invalid private native drain');
   let prefix=copy(whole),consumedMs=0,payments=0,awardedXp=0,baseAwardedXp=0,criticalAwardedXp=0,criticalPayments=0,last=null;
   while(true){
    const config=api.xpConfig(at,prefix),interval=intervalMs(prefix.progression.level,config);
    if(elapsed-consumedMs<interval||!rate(prefix.progression,config))break;
    check(record(config.costContext?.beforeProfile)&&JSON.stringify(config.costContext.beforeProfile)===JSON.stringify(prefix)&&config.costContext.at===at&&config.now===at,'complete native prefix and REAL cost source required');
    const state=normalize(prefix.expInterest),receiptAt=state.revision?state.lastTickAt+interval:Math.max(interval,Math.floor(at));
    const r=step(prefix.progression,prefix.expInterest,receiptAt,config);check(!r.unchanged,'original native payment did not advance');
    prefix.progression=copy(r.progression);prefix.expInterest=copy(r.state);consumedMs+=interval;payments++;awardedXp+=r.awardedXp;baseAwardedXp+=r.baseAwardedXp;criticalAwardedXp+=r.criticalAwardedXp;criticalPayments+=r.critical?1:0;last=r;
    check(finite(awardedXp)&&awardedXp<=Number.MAX_SAFE_INTEGER&&finite(baseAwardedXp)&&finite(criticalAwardedXp),'native batch overflow');
   }
   return {...(last||{}),ok:true,unchanged:payments===0,fromLevel:whole.progression.level,toLevel:prefix.progression.level,progression:prefix.progression,state:normalize(prefix.expInterest),payments,consumedMs,remainderMs:elapsed-consumedMs,awardedXp,baseAwardedXp,critical:criticalPayments>0,criticalPayments,criticalAwardedXp};
  }
  let clock=api.now||(typeof env.__BO_EXP_INTEREST_CLOCK__==='function'?env.__BO_EXP_INTEREST_CLOCK__:()=>env.performance.now());
  let anchor=clock(),lastLevel=api.getProfile().progression.level,epoch=0,pending=null,timer=null,abort=null,error='',fenceName='',fenceRelease=null,destroyed=false,parked=false;
  let retainedMs=0,policyPaused=api.enabled?api.enabled()!==true:false,lastPolicyKey=null;
  const owner=env.crypto?.randomUUID?env.crypto.randomUUID():'interest-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),waiters=new Map();
  const wall=()=>api.wallNow?api.wallNow():Date.now(),visible=()=>!destroyed&&!parked&&!env.document.hidden;
  lastPolicyKey=policyKey();
  function mono(){const value=clock();check(finite(value),'invalid visible-time clock.');return value}
  function currentRate(){try{const p=api.getProfile();return rate(p.progression,api.xpConfig?.(wall(),p))}catch(_){return 0}}
  function currentInterval(){const p=api.getProfile();return intervalMs(p.progression.level,api.xpConfig?.(wall(),p))}
  function powerAllowed(){return api.enabled?api.enabled()===true:true}
  function policyKey(){const p=api.getProfile(),choice=IS.read(api.xpConfig?.(wall(),p));return JSON.stringify([p.progression.level,choice?.index??null])}
  function reanchorPolicy(now){native?.reset();anchor=now;retainedMs=0;lastLevel=api.getProfile().progression.level;lastPolicyKey=policyKey()}
  function remaining(){if(native)return Math.max(0,currentInterval()-native.amount());const interval=currentInterval(),elapsed=mono()-anchor,budget=policyPaused?retainedMs:visible()&&elapsed>=0&&elapsed<=MAX_GAP_MS+retainedMs?elapsed:retainedMs;return Math.max(0,interval-budget)}
  function status(){const save=api.saveStatus?.(),readonly=save?.writable===false,paused=policyPaused||!powerAllowed();return {rateXp:readonly||error||paused?0:currentRate(),intervalMs:currentInterval(),remainingMs:remaining(),paused,pending:!!pending,blocked:!!error||readonly,reason:error||(readonly?save.reason:''),anchor,active:visible()&&!paused&&!readonly&&!error,revision:api.getProfile().expInterest?.revision||0}}
  function clearLease(){try{const value=JSON.parse(env.localStorage.getItem(LEASE)||'null');if(value?.owner===owner)env.localStorage.removeItem(LEASE)}catch(_){}}
  function invalidate(){epoch++;abort?.abort();abort=null;for(const [id,resolve]of waiters){env.clearTimeout(id);resolve(false)}waiters.clear();clearLease()}
  function resetAnchor(){invalidate();if(policyPaused&&lastPolicyKey===policyKey()){anchor=mono();lastLevel=api.getProfile().progression.level}else reanchorPolicy(mono())}
  function releaseFence(){fenceRelease?.();fenceRelease=null;fenceName=''}
  function wait(ms){return new Promise(resolve=>{const id=env.setTimeout(()=>{waiters.delete(id);resolve(true)},ms);waiters.set(id,resolve)})}
  async function checkFence(context){
   if(!env.navigator?.locks?.query)return;
   const held=(await env.navigator.locks.query()).held,state=normalize(api.getProfile().expInterest);
   for(const lock of held){
    // COMMITTED advertisements use SHARED locks; an exclusive grant blocker is not saved-state evidence.
    if(native&&lock.name.startsWith(FENCE)&&lock.mode!=='shared')continue;
    const medalPrefix=PROFILE+'.committed.';if(lock.name.startsWith(medalPrefix)){let f;try{f=JSON.parse(lock.name.slice(medalPrefix.length))}catch(_){continue}const e=api.getProfile().economy;if(f[0]===context.reset&&(!e||f[1]!==e.generation||f[2]>e.revision))throw new Error('Another tab saved a newer Medal wallet. Reload before earning Exp Interest.');continue}
    if(!lock.name.startsWith(FENCE))continue;let f;try{f=JSON.parse(lock.name.slice(FENCE.length))}catch(_){continue}
    if(f[0]===context.reset&&(f[1]>state.revision||f[1]===state.revision&&(f[2]!==state.totalXp||f[3]!==state.lastTickAt)))throw new Error('Another tab saved newer Exp Interest. Reload before saving or earning.');
   }
  }
  async function publishFence(context,requestEpoch){
   if(!env.navigator?.locks?.query)return;
   const state=normalize(api.getProfile().expInterest),name=FENCE+JSON.stringify([context.reset,state.revision,state.totalXp,state.lastTickAt]);if(name===fenceName)return;
   let releaseNew;await new Promise((resolve,reject)=>{env.navigator.locks.request(name,{mode:'shared'},()=>new Promise(release=>{releaseNew=release;resolve()})).catch(reject)});
   if(requestEpoch!==epoch||!visible()){releaseNew();return}const previous=fenceRelease;fenceRelease=releaseNew;fenceName=name;previous?.();
  }
  async function fallback(commit,requestEpoch){
   // No spin or catch-up: a contested/expired lease simply skips this opportunity.
   // Verify ownership after a contention window AND again immediately before the
   // synchronous host raw/signature check + single write. Other writers also
   // reject an observed foreign lease, so they cannot rewind this receipt.
   const raw=env.localStorage.getItem(LEASE),existing=raw===null?null:JSON.parse(raw),now=wall();
   if(existing!==null)check(record(existing)&&typeof existing.owner==='string'&&Number.isSafeInteger(existing.until),'invalid fallback save guard.');
   if(existing&&existing.owner!==owner&&existing.until>now)return {ok:false,code:'busy'};
   const claim=JSON.stringify({owner,until:now+2000});env.localStorage.setItem(LEASE,claim);
   try{if(!await wait(60)||requestEpoch!==epoch||!visible())return {ok:false,code:'cancelled'};if(env.localStorage.getItem(LEASE)!==claim)return {ok:false,code:'busy'};return commit()}finally{clearLease()}
  }
  async function heartbeat(){
   if(pending)return pending;
   if(error)return {ok:false,code:'blocked',reason:error};
   if(policyPaused)return {ok:true,unchanged:true,code:'paused',paused:true};
   if(!powerAllowed())return setPaused(true);
   if(!visible())return {ok:true,unchanged:true,code:'hidden'};
   const now=mono(),level=api.getProfile().progression.level;
   if(level!==lastLevel||lastPolicyKey!==policyKey()){const code=level!==lastLevel?'level-anchor':'choice-anchor';reanchorPolicy(now);return {ok:true,unchanged:true,code}}
   if(!currentRate()){native?.reset();anchor=now;retainedMs=0;return {ok:true,unchanged:true,code:'zero'}}
   if(native)try{native.observe()}catch(e){native.fail();error=e.message;return {ok:false,code:'stale',reason:error}}
   const elapsed=native?native.amount():now-anchor;
   if(!native&&(elapsed<0||elapsed>MAX_GAP_MS+retainedMs)){anchor=now-retainedMs;return {ok:true,unchanged:true,code:'fresh-anchor'}}
   if(elapsed<currentInterval())return {ok:true,unchanged:true,code:'not-due'};
   if(api.busy?.()){native?.reset();anchor=now;retainedMs=0;return {ok:false,code:'busy'}}
   let context;try{context=api.capture()}catch(e){error=e.message;api.changed?.();return {ok:false,code:'stale',reason:error}}
   const nativeLease=native?.lease();if(native&&!nativeLease)return {ok:true,unchanged:true,code:'fresh-native-anchor'};
   const requestEpoch=epoch,tickAt=native?native.details(nativeLease).at:wall(),capturedPolicyKey=lastPolicyKey,payableElapsed=native?native.details(nativeLease).amount:Math.min(elapsed,MAX_GAP_MS);abort=new env.AbortController();
   const commit=()=>{
    if(requestEpoch!==epoch||!visible()||policyPaused||!powerAllowed())return {ok:false,code:'cancelled'};
    if(policyKey()!==capturedPolicyKey){reanchorPolicy(mono());return {ok:true,unchanged:true,code:'choice-anchor'}}
    if(api.busy?.())return {ok:false,code:'busy'};
    if(mono()-now>MAX_GAP_MS){native?.reset();anchor=mono()-retainedMs;return {ok:true,unchanged:true,code:'fresh-anchor'}}
    const at=tickAt,result=api.transact(next=>{if(native)native.assert(nativeLease);const r=native?payNativePrefix(next,payableElapsed,at):payEligible(next.progression,next.expInterest,payableElapsed,at,progression=>api.xpConfig?.(at,{...next,progression}));if(r.unchanged)return r;next.progression=r.progression;next.expInterest=r.state;return {...r,xpResult:r}},context);
    // Debit eligible time at the synchronous durable result, BEFORE awaiting a
    // shared fence grant. Visibility may invalidate this epoch while publication
    // waits, but must never resurrect time already spent by the saved PROFILE.
    if(result?.ok){const consumed=result.consumedMs||0;if(native){native.consume(nativeLease,consumed);anchor=now;retainedMs=native.amount();}else{anchor+=consumed;retainedMs=Math.max(0,elapsed-consumed);}lastLevel=api.getProfile().progression.level;lastPolicyKey=policyKey()}
    return result;
   };
   const work=(async()=>{
    try{
     const locks=env.navigator?.locks,result=locks?.request?await locks.request(PROFILE,{mode:'exclusive',signal:abort.signal},async()=>{await checkFence(context);const r=commit();if(r?.ok&&!r.unchanged)try{await publishFence(context,requestEpoch)}catch(_){/* XP is already durable; never retry a saved second. */}return r}):await fallback(commit,requestEpoch);
     if(result?.ok&&requestEpoch===epoch&&!result.unchanged)api.changed?.(result);
     return result;
    }catch(e){if(requestEpoch!==epoch||e.name==='AbortError')return {ok:false,code:'cancelled'};native?.fail();error=e.message||'Exp Interest could not be saved.';api.changed?.();return {ok:false,code:'save-failed',reason:error}}
   })();pending=work;
   try{return await work}finally{if(pending===work)pending=null}
  }
  // Explicit power boundaries cannot race a pending durable transaction. The
  // parent holds its cross-model boundary, checkpoints RUN, commits policy, then
  // resumes only after exact readback. No paused wall gap becomes eligible time.
  function setPaused(value){
   check(typeof value==='boolean','pause must be an explicit boolean.');
   if(error||destroyed)return {ok:false,code:'blocked',reason:error||'Destroyed interest controller.'};
   if(pending)return {ok:false,code:'busy',reason:'Interest payment is finishing; no power boundary changed.'};
   const want=value||!powerAllowed(),now=mono();if(lastPolicyKey!==policyKey())reanchorPolicy(now);
   if(want===policyPaused)return {ok:true,unchanged:true,paused:want};
   if(want){const elapsed=now-anchor;if(native)retainedMs=native.amount();else if(visible()&&elapsed>=0&&elapsed<=MAX_GAP_MS+retainedMs)retainedMs=elapsed;policyPaused=true;stop();anchor=now}else{policyPaused=false;start()}
   return {ok:true,paused:policyPaused};
  }
  function stop(){native?.hold();if(timer!==null)env.clearInterval(timer);timer=null;invalidate();releaseFence()}
  function start(){stop();if(lastPolicyKey!==policyKey())reanchorPolicy(mono());if(destroyed||error||policyPaused||parked||env.document.hidden)return;native?.resume();anchor=mono()-retainedMs;lastLevel=api.getProfile().progression.level;timer=env.setInterval(()=>{void heartbeat()},50)}
  function visibility(){if(env.document.hidden)stop();else start()}
  function hide(){parked=true;stop()}
  function show(){parked=false;start()}
  function reset(){if(error)return {ok:false,code:'blocked',reason:error};stop();start();return {ok:true}}
  function setClock(fn){check(fn===null||typeof fn==='function','test clock must be a function or null.');clock=fn||(()=>env.performance.now());resetAnchor()}
  function destroy(){stop();destroyed=true;env.document.removeEventListener('visibilitychange',visibility);env.removeEventListener('pagehide',hide);env.removeEventListener('pageshow',show)}
  env.document.addEventListener('visibilitychange',visibility);env.addEventListener('pagehide',hide);env.addEventListener('pageshow',show);
  return {start,stop,reset,resetAnchor,setClock,setPaused,heartbeat,status,destroy,assertFenceCurrent:checkFence,ownsLease:()=>owner};
 }
 return {create,normalize,validateProfile,validateMirror,rate,step,intervalMs,payEligible,createController,createWriterGuard,INTERVAL_MS,MAX_GAP_MS,LEASE_KEY:LEASE};
});
