/* Exp Interest: actual current-bank income, not a passive session or offline claim.
 * One guarded PROFILE write owns both the exact XP and this compact highwater.
 * No reload timestamp is ever converted into elapsed income. */
(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('./progression'):root.BOProgress,root,typeof module==='object'&&module.exports?require('./interest-settings'):root.BOInterestSettings);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.BOExpInterest=api;})(typeof window!=='undefined'?window:null,function(PG,root,IS){'use strict';
 const PROFILE='danis-table.profile.v1',INTERVAL_MS=1000,MAX_GAP_MS=2500,FENCE=PROFILE+'.exp-interest.committed.',LEASE=PROFILE+'.exp-interest.lease.v1';
 const copy=x=>JSON.parse(JSON.stringify(x)),record=x=>!!x&&typeof x==='object'&&!Array.isArray(x),finite=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 const check=(ok,message)=>{if(!ok)throw new Error('Exp Interest: '+message)};
 function create(){return {version:1,revision:0,totalXp:0,lastTickAt:0}}
 function normalize(value){
  if(value===undefined)return create();
  const keys=['version','revision','totalXp','lastTickAt'];
  check(record(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Reflect.ownKeys(value).length===keys.length&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&d.enumerable&&Object.prototype.hasOwnProperty.call(d,'value')}),'invalid saved ledger; stored data was not overwritten.');
  check([1,2,3].includes(value.version)&&Number.isSafeInteger(value.revision)&&value.revision>=0&&finite(value.totalXp)&&Number.isSafeInteger(value.lastTickAt)&&value.lastTickAt>=0,'invalid saved ledger values.');
  // V1/V2 remain strict on read. V3 is born only on a paid <500ms
  // tick; its highwater is a logical receipt clock, not offline entitlement.
  const grid=value.version===1?INTERVAL_MS:100,minInterval=value.version===1?INTERVAL_MS:value.version===2?500:100;
  check(value.revision===0?value.version===1&&value.totalXp===0&&value.lastTickAt===0:value.totalXp>0&&value.totalXp<=value.revision*10&&value.lastTickAt>0&&value.lastTickAt%grid===0&&value.lastTickAt>=value.revision*minInterval,'saved income does not match its highwater.');
  return {version:value.version,revision:value.revision,totalXp:value.totalXp,lastTickAt:value.lastTickAt};
 }
 function rate(p,config){check(record(p)&&Number.isInteger(p.level)&&p.level>=1&&p.level<=100&&finite(p.xp),'invalid current player level or XP bank.');return p.level>=20&&p.level<100?Math.min(p.level>=43?10:p.level>=30?5:p.level>=26?3:2,p.xp*IS.effective(p.level,config).rateFraction*PG.jokerXpMultiplier(config)*PG.earnedXpMultiplier(p.level)*PG.pokerXpMultiplier(config)):0}
 function intervalMs(level,config){check(Number.isInteger(level)&&level>=1&&level<=100,'invalid actual player level.');return IS.effective(level,config).intervalMs}
 function step(progression,ledger,at,config){
  const state=normalize(ledger),amount=rate(progression,config),fromLevel=progression.level,interval=intervalMs(fromLevel,config),version=Math.max(state.version,interval<500?3:interval<INTERVAL_MS?2:1),grid=version===1?INTERVAL_MS:100;
  check(Number.isSafeInteger(at)&&at>=0,'invalid tick time.');const slot=Math.floor(at/grid)*grid;
  const unchanged=()=>({ok:true,unchanged:true,awardedXp:0,fromLevel,toLevel:fromLevel,state,progression:copy(progression)});
  if(!amount||slot<interval||slot-state.lastTickAt<interval)return unchanged();
  check(state.revision<Number.MAX_SAFE_INTEGER,'receipt counter overflow.');
  check(finite(progression.totalXp)&&progression.xp+amount>progression.xp&&progression.totalXp+amount>progression.totalXp,'XP cannot represent this award safely; no income was changed.');
  const next=copy(progression),result=PG.addAwardedXp(next,amount,undefined,config);
  // The progression model retains its historical-cost lower bound; its floating
  // summation can move by an ulp on normalization. The awarded amount itself,
  // not a lifetime-total subtraction, is the exact income receipt.
  check(!result.duplicate&&result.awardedXp===amount&&next.totalXp>progression.totalXp,'XP award did not match the explicit actual rate.');
  const total=state.totalXp+amount;check(finite(total)&&total>state.totalXp,'income total overflow.');
  return {...result,ok:true,unchanged:false,progression:next,state:normalize({version,revision:state.revision+1,totalXp:total,lastTickAt:slot})};
 }
 // The controller supplies ONLY captured foreground monotonic elapsed time.
 // One durable whole-PROFILE transaction may contain several real payments;
 // each compounds on the preceding native progression result and cap/interval.
 // The bounded remainder is presentation-session memory, never wall catch-up.
 function payEligible(progression,ledger,elapsedMs,at,config){
  check(finite(elapsedMs)&&elapsedMs<=MAX_GAP_MS,'invalid eligible interval; never claim an offline gap.');check(Number.isSafeInteger(at)&&at>=0,'invalid captured receipt time.');
  let next=copy(progression),state=normalize(ledger),consumedMs=0,awardedXp=0,payments=0,lastResult=null;
  while(true){
   const c=typeof config==='function'?config(next):config,interval=intervalMs(next.level,c);if(elapsedMs-consumedMs<interval||!rate(next,c))break;
   const grid=state.version>=2||interval<INTERVAL_MS?100:INTERVAL_MS,receiptAt=state.revision?state.lastTickAt+interval:Math.max(interval,Math.floor(at/grid)*grid);
   check(Number.isSafeInteger(receiptAt),'receipt clock overflow.');const r=step(next,state,receiptAt,c);check(!r.unchanged,'captured payment did not advance its receipt.');
   next=r.progression;state=r.state;consumedMs+=interval;awardedXp+=r.awardedXp;payments++;lastResult=r;
  }
  return {...(lastResult||{}),ok:true,unchanged:payments===0,fromLevel:progression.level,toLevel:next.level,progression:next,state,awardedXp,payments,consumedMs,remainderMs:elapsedMs-consumedMs};
 }
 // A synchronous gameplay API cannot await a browser-lock-manager query at
 // every write. Keep one live writer permit instead. Losing, already-loaded
 // game tabs are view-only forever; only a FRESH validated hosted-survey return
 // document may ask the owner to yield before it loads PROFILE/SAVE.
 function createWriterGuard(api={},env=root){
  const NAME=PROFILE+'.writer',KEY=PROFILE+'.writer-lease.v1',CHANNEL=PROFILE+'.writer-handoff.v1',owner=env.crypto?.randomUUID?.()||'writer-'+Date.now()+'-'+Math.random();
  const locks=env.navigator?.locks,reason='This game tab is view-only. Another game tab owns this save; close it, then reload here to play.',fallbackNote='Browser locks unavailable: guarded single-tab saving. Keep only one game tab open.';
  let allowed=false,ready=false,release=null,renewal=null,channel=null,yielded=false,mode=locks?.request?'web-lock':'guarded-lease',replyTo=null,failure='';
  const now=()=>Date.now();
  function lease(){const raw=env.localStorage.getItem(KEY);if(raw===null)return null;const value=JSON.parse(raw);check(record(value)&&typeof value.owner==='string'&&Number.isSafeInteger(value.until),'invalid writer lease.');return value}
  function renew(){const current=lease();if(current?.owner!==owner){allowed=false;yielded=true;return false}env.localStorage.setItem(KEY,JSON.stringify({owner,until:now()+10000}));return true}
  function canWrite(){if(!allowed||!ready||yielded)return false;if(mode==='guarded-lease')try{if(lease()?.owner!==owner){allowed=false;yielded=true;return false}}catch(_){allowed=false;return false}return true}
  function assert(){check(canWrite(),failure||reason)}
  function status(){const writable=canWrite();return {writable,mode,reason:writable?'':failure||reason,note:mode==='guarded-lease'?fallbackNote:''}}
  function yieldPermit(request){if(!canWrite())return;const witness=api.beforeYield?.();if(mode==='guarded-lease')try{if(lease()?.owner===owner)env.localStorage.removeItem(KEY)}catch(_){}allowed=false;yielded=true;if(renewal!==null)env.clearInterval(renewal);renewal=null;release?.();release=null;if(request)channel?.postMessage({type:'handoff-granted',to:request.owner,sessionId:request.sessionId,witness});api.changed?.()}
  try{if(env.BroadcastChannel){channel=new env.BroadcastChannel(CHANNEL);channel.onmessage=event=>{const m=event.data;if(m?.type==='handoff-granted'&&m.to===owner){replyTo?.(m);return}if(m?.type==='fresh-survey-return'&&typeof m.sessionId==='string'&&m.owner!==owner&&canWrite()&&api.validReturn?.(m.sessionId))yieldPermit(m)}}}catch(_){channel=null}
  function ask(returnId){let finish;const reply=new Promise(resolve=>finish=resolve),timeout=env.setTimeout(()=>finish(null),3000);replyTo=m=>{if(m.sessionId===returnId)finish(m.witness)};channel.postMessage({type:'fresh-survey-return',sessionId:returnId,owner});return {reply,close:()=>{env.clearTimeout(timeout);replyTo=null}}}
  async function confirmHandoff(reply){const witness=await reply;for(let i=0;witness&&i<=20;i++){try{if(api.matchesWitness?.(witness)){ready=true;return true}}catch(_){}if(i<20)await new Promise(r=>env.setTimeout(r,50))}failure='Save handoff could not confirm fresh XP data. This tab is view-only; reload before playing.';destroy();return false}
  async function attempt(options){return new Promise((resolve,reject)=>{locks.request(NAME,options,lock=>{if(!lock){resolve(false);return}allowed=true;resolve(true);return new Promise(done=>{release=()=>{allowed=false;done()}})}).catch(reject)})}
  async function acquire(returnId){
   if(mode==='web-lock'){
    if(await attempt({mode:'exclusive',ifAvailable:true})){ready=true;return true;}
    if(returnId&&channel){const request=ask(returnId),controller=new env.AbortController(),timeout=env.setTimeout(()=>controller.abort(),3000);try{if(await attempt({mode:'exclusive',signal:controller.signal}))return await confirmHandoff(request.reply)}catch(e){if(e.name!=='AbortError')throw e}finally{env.clearTimeout(timeout);request.close()}}return false;
   }
   // localStorage has no compare-and-swap. This bounded contention/owner lease
   // is deliberately a guarded fallback, not a promise of browser-lock strength.
   let current=lease(),witness=null;if(current&&current.until>now()&&returnId&&channel){const request=ask(returnId);try{witness=await request.reply}finally{request.close()}current=lease();if(!witness)return false}if(current&&current.until>now())return false;
   const claim=JSON.stringify({owner,until:now()+10000});env.localStorage.setItem(KEY,claim);await new Promise(r=>env.setTimeout(r,60));if(env.localStorage.getItem(KEY)!==claim)return false;allowed=true;if(witness&&!await confirmHandoff(Promise.resolve(witness)))return false;ready=true;
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
  function reanchorPolicy(now){anchor=now;retainedMs=0;lastLevel=api.getProfile().progression.level;lastPolicyKey=policyKey()}
  function remaining(){const interval=currentInterval(),elapsed=mono()-anchor,budget=policyPaused?retainedMs:visible()&&elapsed>=0&&elapsed<=MAX_GAP_MS+retainedMs?elapsed:retainedMs;return Math.max(0,interval-budget)}
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
   if(!currentRate()){anchor=now;retainedMs=0;return {ok:true,unchanged:true,code:'zero'}}
   const elapsed=now-anchor;
   if(elapsed<0||elapsed>MAX_GAP_MS+retainedMs){anchor=now-retainedMs;return {ok:true,unchanged:true,code:'fresh-anchor'}}
   if(elapsed<currentInterval())return {ok:true,unchanged:true,code:'not-due'};
   if(api.busy?.()){anchor=now;retainedMs=0;return {ok:false,code:'busy'}}
   let context;try{context=api.capture()}catch(e){error=e.message;api.changed?.();return {ok:false,code:'stale',reason:error}}
   const requestEpoch=epoch,tickAt=wall(),capturedPolicyKey=lastPolicyKey,payableElapsed=Math.min(elapsed,MAX_GAP_MS);abort=new env.AbortController();
   const commit=()=>{
    if(requestEpoch!==epoch||!visible()||policyPaused||!powerAllowed())return {ok:false,code:'cancelled'};
    if(policyKey()!==capturedPolicyKey){reanchorPolicy(mono());return {ok:true,unchanged:true,code:'choice-anchor'}}
    if(api.busy?.())return {ok:false,code:'busy'};
    if(mono()-now>MAX_GAP_MS){anchor=mono()-retainedMs;return {ok:true,unchanged:true,code:'fresh-anchor'}}
    const at=tickAt,result=api.transact(next=>{const r=payEligible(next.progression,next.expInterest,payableElapsed,at,progression=>api.xpConfig?.(at,{...next,progression}));if(r.unchanged)return r;next.progression=r.progression;next.expInterest=r.state;return {...r,xpResult:r}},context);
    // Debit eligible time at the synchronous durable result, BEFORE awaiting a
    // shared fence grant. Visibility may invalidate this epoch while publication
    // waits, but must never resurrect time already spent by the saved PROFILE.
    if(result?.ok){const consumed=result.consumedMs||0;anchor+=consumed;retainedMs=Math.max(0,elapsed-consumed);lastLevel=api.getProfile().progression.level;lastPolicyKey=policyKey()}
    return result;
   };
   const work=(async()=>{
    try{
     const locks=env.navigator?.locks,result=locks?.request?await locks.request(PROFILE,{mode:'exclusive',signal:abort.signal},async()=>{await checkFence(context);const r=commit();if(r?.ok&&!r.unchanged)try{await publishFence(context,requestEpoch)}catch(_){/* XP is already durable; never retry a saved second. */}return r}):await fallback(commit,requestEpoch);
     if(result?.ok&&requestEpoch===epoch&&!result.unchanged)api.changed?.(result);
     return result;
    }catch(e){if(requestEpoch!==epoch||e.name==='AbortError')return {ok:false,code:'cancelled'};error=e.message||'Exp Interest could not be saved.';api.changed?.();return {ok:false,code:'save-failed',reason:error}}
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
   if(want){const elapsed=now-anchor;if(visible()&&elapsed>=0&&elapsed<=MAX_GAP_MS+retainedMs)retainedMs=elapsed;policyPaused=true;stop();anchor=now}else{policyPaused=false;start()}
   return {ok:true,paused:policyPaused};
  }
  function stop(){if(timer!==null)env.clearInterval(timer);timer=null;invalidate();releaseFence()}
  function start(){stop();if(lastPolicyKey!==policyKey())reanchorPolicy(mono());if(destroyed||error||policyPaused||parked||env.document.hidden)return;anchor=mono()-retainedMs;lastLevel=api.getProfile().progression.level;timer=env.setInterval(()=>{void heartbeat()},250)}
  function visibility(){if(env.document.hidden)stop();else start()}
  function hide(){parked=true;stop()}
  function show(){parked=false;start()}
  function reset(){if(error)return {ok:false,code:'blocked',reason:error};stop();start();return {ok:true}}
  function setClock(fn){check(fn===null||typeof fn==='function','test clock must be a function or null.');clock=fn||(()=>env.performance.now());resetAnchor()}
  function destroy(){stop();destroyed=true;env.document.removeEventListener('visibilitychange',visibility);env.removeEventListener('pagehide',hide);env.removeEventListener('pageshow',show)}
  env.document.addEventListener('visibilitychange',visibility);env.addEventListener('pagehide',hide);env.addEventListener('pageshow',show);
  return {start,stop,reset,resetAnchor,setClock,setPaused,heartbeat,status,destroy,assertFenceCurrent:checkFence,ownsLease:()=>owner};
 }
 return {create,normalize,rate,step,intervalMs,payEligible,createController,createWriterGuard,INTERVAL_MS,MAX_GAP_MS,LEASE_KEY:LEASE};
});
