/* Slots canonical-host adapter. ONE guarded whole-PROFILE writer supplied by
 * the app; no independent storage/key/timer. Pending spin spend+private RNG,
 * completed receipt, native XP/FP/coins/medals must share that same commit.
 * Any uncertainty after attempting write permanently closes this actor. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(root,n?require('./emerald-slots'):root.BOEmeraldSlots,n?require('./emerald-progress'):root.BOEmeraldProgress);if(n)module.exports=api;else root.BOEmeraldSlotsActions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,G,EP){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0);
 const record=o=>!!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
 function check(ok,message){if(!ok)throw Error(message)}
 function fields(o,keys){return record(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(o,k);return d&&own(d,'value')&&d.enumerable===true})}
 function data(o,key){check(record(o),'Expected an ordinary Slots host record.');const d=Object.getOwnPropertyDescriptor(o,key);if(!d)return undefined;check(own(d,'value')&&d.enumerable===true,'Slots host data cannot contain accessors.');return d.value}
 function thenable(v){return !!v&&(typeof v==='object'||typeof v==='function')&&typeof v.then==='function'}
 function json(value){
  const path=new Set();function inspect(v,depth){
   check(depth<=64,'The live save is nested too deeply.');if(v===null||typeof v==='string'||typeof v==='boolean')return;
   if(typeof v==='number'){check(Number.isFinite(v)&&!Object.is(v,-0),'The live save contains a non-canonical number.');return}
   check(v&&typeof v==='object'&&!path.has(v),'Slots needs ordinary acyclic JSON save data.');const isArray=Array.isArray(v);check(isArray?Object.getPrototypeOf(v)===Array.prototype:record(v),'The live save contains a non-JSON object.');path.add(v);
   const keys=Reflect.ownKeys(v);if(isArray)check(keys.length===v.length+1,'The live save contains sparse or extended arrays.');
   for(const key of keys){if(isArray&&key==='length')continue;const d=Object.getOwnPropertyDescriptor(v,key);check(typeof key==='string'&&d&&own(d,'value')&&d.enumerable===true,'The live save contains a hidden field or accessor.');if(isArray)check(/^(0|[1-9][0-9]*)$/.test(key)&&Number(key)<v.length,'The live save contains a non-index array property.');inspect(d.value,depth+1)}path.delete(v);
  }inspect(value,0);return JSON.stringify(value);
 }
 function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o)}return o}
 function sum(a,b){const n=BigInt(a)+BigInt(b);check(n<=BigInt(Number.MAX_SAFE_INTEGER),'Native Slots reward precision would overflow.');return Number(n)}
 function nativeCoins100(profile){
  const p=data(profile,'progression'),half=data(p,'coinsHalf'),faucet=data(p,'faucet');check(count(half)&&record(faucet),'The normal native coin bank is unavailable.');const raw=data(faucet,'coinRemainderHundredths'),carry=raw===undefined&&!own(faucet,'coinRemainderHundredths')?0:raw;check(count(carry)&&carry<50,'The native coin carry is invalid.');
  const n=BigInt(half)*50n+BigInt(carry);check(n<=BigInt(Number.MAX_SAFE_INTEGER),'The native coin bank exceeds Slots fixed-precision capacity.');return Number(n);
 }
 function create(host){
  const required=['get','stamp','assertWritable','read','write','applyProfile','pause','render','notify','seed','now','prepareRewards','rewardSnapshot','validateProfile'];
  check(host&&required.every(k=>typeof host[k]==='function')&&G&&EP,'The canonical Slots host is incomplete.');let busy=false,paused=false,destroyed=false;
  function notify(message){try{host.notify(message)}catch(_){}}
  function clock(){const now=host.now();check(count(now)&&now<=8640000000000000,'Invalid absolute Slots host clock.');return now}
  function writable(){const result=host.assertWritable();check(result!==false&&!thenable(result),'Slots save ownership is not synchronously writable.');}
  function validate(profile){G.validateProfile(profile);const result=host.validateProfile(profile);check(result===true&&!thenable(result),'The whole Slots profile or paired reward source is invalid.');}
  function gate(c,resumeOnly=false){
   check(!paused&&!destroyed,'Slots saving is paused. Reopen safely before playing again.');check(c&&record(c.profile)&&(resumeOnly?['home','game'].includes(c.page):c.page==='home'&&c.tab==='slots'),'Open a safe current game view before settling, or the Slots table before new input.');
   check(c.gamesEnabled!==false,'Games are disabled in Feature Power. Your saved spin is kept.');
   check((resumeOnly||!c.hidden&&!root.document?.hidden&&root.document?.visibilityState!=='hidden')&&!c.protected&&!c.suspended&&!c.animating&&!c.conductPaused&&!c.cloudRestoring&&!c.slotBusy&&!c.survey&&!c.batteryBlocked,'Slots is protected or gameplay is paused. Your saved spin is kept.');
   const progression=data(c.profile,'progression'),actual=data(progression,'level');check(Number.isInteger(c.level)&&c.level>=50&&c.level<=100&&actual===c.level,'Slots unlocks at actual reconciled player Level50, not a cached run level.');return c;
  }
  function ownMax(profile,level){const emerald=data(profile,'emerald');if(emerald===undefined){check(!own(profile,'emerald'),'The optional Emerald ledger is invalid.');return false}check(EP.validate(emerald),'Emerald progress needs attention.');return EP.progress(emerald,level).max===true}
  function read(key){const value=host.read(key);check(value===null||typeof value==='string','The canonical '+key+' save could not be read.');return value}
  function fence(c,expectedRaw=c.rawProfile){
   // A guard may itself discover foreign progress; reread AFTER every guard.
   for(let i=0;i<2;i++){
    writable();const live=gate(host.get(),c.resumeOnly);check(live.profile===c.profile&&live.run===c.run&&live.level===c.level&&host.stamp()===c.stamp,'The Slots owner, slot generation, run, or view changed.');
    check(json(live.profile)===c.profileJSON&&json(live.run??null)===c.runJSON,'Whole live profile or RUN changed during the Slots action.');
    check(read('profile')===expectedRaw&&read('run')===c.rawRun,'Canonical progress changed during the Slots action.');
   }
  }
  function snapshot(resumeOnly=false){
   writable();const live=gate(host.get(),resumeOnly);const profileJSON=json(live.profile),runJSON=json(live.run??null);validate(live.profile);const rawProfile=read('profile'),rawRun=read('run');check(typeof rawProfile==='string','Save the whole current profile before spinning.');
   let saved;try{saved=JSON.parse(rawProfile)}catch(_){throw Error('The saved Slots profile needs attention. Nothing was credited.')}
   check(json(saved)===profileJSON,'The complete live and saved profiles disagree. Reopen safely.');validate(saved);
   const c={profile:live.profile,run:live.run,level:live.level,profileJSON,runJSON,rawProfile,rawRun,stamp:host.stamp(),nowMs:clock(),resumeOnly};fence(c);return c;
  }
  function rewards(profile){
   const snap=host.rewardSnapshot(profile);check(!thenable(snap)&&fields(snap,['coins100','fpMilli','medalsMilli'])&&['coins100','fpMilli','medalsMilli'].every(k=>count(snap[k])),'Native Slots coin/FP/medal snapshot is invalid.');check(snap.coins100===nativeCoins100(profile),'Slots coins must use the normal native bank, never a separate wallet.');return {...snap};
  }
  function status(){
   try{const c=gate(host.get());json(c.profile);validate(c.profile);const state=data(c.profile,'emeraldSlots'),now=clock();return {unlocked:true,blocked:false,busy,state:state===undefined?null:G.publicState(state,now)}}
   catch(error){return {unlocked:false,blocked:true,busy,state:null,reason:error.message}}
  }
  function failure(error,attempted,applied,quiet=false){
   const uncertain=attempted&&!applied;if(uncertain){paused=true;const message='Slots saving is uncertain. This spin/reward may ALREADY be saved. Do not retry, reset or clear storage; reopen safely to inspect it. '+error.message;try{host.pause(message)}catch(_){}notify(message)}else if(!quiet)notify(error.message);
   return {ok:false,uncertain,reason:error.message};
  }
  function commit(request,resumeOnly=false){
   if(busy||paused||destroyed)return {ok:false,uncertain:false,reason:'A Slots action is committing or saving is paused.'};busy=true;let attempted=false,applied=false;
   try{
    check(fields(request,['action','expectedRevision'])&&['spin','settle','checkpoint'].includes(request.action)&&count(request.expectedRevision),'Choose a plain current Slots action.');
    check(!resumeOnly||request.action==='settle','Resume may only settle an existing saved spin.');
    const c=snapshot(resumeOnly),next=JSON.parse(c.profileJSON),before=next.emeraldSlots,revision=before?.revision??0;check(revision===request.expectedRevision,'The Slots revision changed. Use the current machine buttons.');
    check(!resumeOnly||before!==undefined&&before.pending!==null,'Resume cannot create a Slots ledger or a new spin.');
    if(before===undefined&&request.action==='checkpoint')return {ok:true,changed:false,completed:false,state:null,receipt:null,xpResult:null};
    check(before!==undefined||request.action==='spin','Start a saved spin before settling.');const oldRewards=rewards(c.profile),source=before===undefined?G.create(host.seed(),c.nowMs):before;
    const proposal=G.move(source,{type:request.action},request.expectedRevision,c.nowMs,request.action==='spin'?{ownEmeraldMax:ownMax(c.profile,c.level)}:undefined);
    if(!proposal.changed)return {ok:true,changed:false,completed:false,state:G.publicState(proposal.state,c.nowMs),receipt:null,xpResult:null};
    next.emeraldSlots=proposal.state;const slotsJSON=json(proposal.state),receipt=proposal.receipt?freeze(JSON.parse(json(proposal.receipt))):null;let xpResult=null;
    if(proposal.completed){
     const result=host.prepareRewards(next,receipt,Object.freeze({nowMs:c.nowMs,spinAtMs:receipt.atMs,level:c.level,source:receipt.source,slotsXpMultiplierApplied:true}));
     check(!thenable(result)&&fields(result,['xpResult']),'Native Slots rewards need synchronous detached preparation.');xpResult=result.xpResult;
     check(xpResult===null||record(xpResult)&&!thenable(xpResult)&&typeof xpResult.awardedXp==='number'&&Number.isFinite(xpResult.awardedXp)&&xpResult.awardedXp>=0&&xpResult.duplicate!==true,'Native Slots XP receipt was not confirmed.');
     check(receipt.credits.xp10===0||xpResult!==null,'The earned Slots XP source was not prepared.');
    }
    check(json(next.emeraldSlots)===slotsJSON,'Native reward preparation altered the Slots proposal.');validate(next);const afterRewards=rewards(next),credit=receipt?.credits||{coins100:0,fp10:0,medals10:0};
    const delta={coins100:credit.coins100,fpMilli:sum(0,BigInt(credit.fp10)*100n),medalsMilli:sum(0,BigInt(credit.medals10)*100n)};
    for(const key of ['coins100','fpMilli','medalsMilli'])check(afterRewards[key]===sum(oldRewards[key],delta[key]),'Native Slots '+key+' credit does not match its single receipt.');
    const raw=json(next);fence(c);attempted=true;const written=host.write('profile',next);check(written===true&&!thenable(written),'The complete Slots profile write was not confirmed.');fence(c,raw);fence(c,raw);
    const appliedResult=host.applyProfile(next,xpResult);check(appliedResult!==false&&!thenable(appliedResult),'The saved Slots reward could not be applied through native mirrors.');check(json(host.get().profile)===raw,'The saved whole Slots profile was not applied live.');applied=true;
    const after=G.publicState(proposal.state,c.nowMs),event={game:'slots',action:request.action,resumed:resumeOnly,before:before?G.publicState(before,c.nowMs):null,after,completed:proposal.completed,receipt,xpResult};
    try{host.render(event)}catch(_){notify('Slots is saved. Reopen the table if its display has not refreshed.')}
    return {ok:true,changed:true,completed:proposal.completed,state:after,receipt,xpResult};
   }catch(error){return failure(error,attempted,applied,resumeOnly)}finally{busy=false}
  }
  function action(request){return commit(request,false)}
  function resumePending(){
   // Explicit boot/wake/deadline ACTION, never a status/render side effect. It
   // cannot seed, start a spin, checkpoint an idle ledger, or bypass ownership.
   if(busy||paused||destroyed)return {ok:false,uncertain:false,reason:'A Slots action is committing or saving is paused.'};
   try{
    const live=host.get(),saved=data(live.profile,'emeraldSlots');
    if(saved===undefined){check(!own(live.profile,'emeraldSlots'),'The optional Slots ledger is invalid.');return {ok:true,changed:false,completed:false,state:null,receipt:null,xpResult:null}}
    check(G.validate(saved),'The saved pending Slots ledger is invalid.');const projection=G.publicState(saved,clock());
    if(saved.pending===null||!projection.pendingReady)return {ok:true,changed:false,completed:false,state:projection,receipt:null,xpResult:null};
    return commit({action:'settle',expectedRevision:saved.revision},true);
   }catch(error){return failure(error,false,false,true)}
  }
  return Object.freeze({status,action,resumePending,destroy(){destroyed=true}});
 }
 return Object.freeze({create});
});
