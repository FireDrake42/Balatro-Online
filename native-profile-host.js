/* Existing writer + selected-slot + whole native paired-bank boundary for
 * genuine rewards. Never acquires/steals an owner, guesses a slot, creates a
 * RUN, advances passive time, retries uncertainty, or treats a game journal as
 * PROFILE ownership. Both main and direct original-games use this same host. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory({NFT:n?require('./native-feature-transaction'):root.BONativeFeatureTransaction,N:n?require('./native-player-xp'):root.BONativePlayerXP,AX:n?require('./achievement-xp'):root.BOAchievementXP,CS:n?require('./cloud-save'):root.BOCloudSave,BO:n?require('./engine'):root.BO});if(n)module.exports=api;else root.BONativeProfileHost=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v)),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const check=(ok,message)=>{if(!ok)throw Error('Native reward save: '+message)};
 // Exact pre-existing app95 cost configuration, shared without a second rule fork.
 const PLAYER_XP_CONFIG=Object.freeze({level25Cost:27500,exponentialBase:100000,exponentialFactor:1.15,costOverrides:Object.freeze({35:25000,36:27500,37:30000,38:33000,39:36000,40:45000,41:50000,42:55000,43:60000,44:65000,45:70000,46:80000,47:90000,48:95000,49:100000})});
 const KEYS=M.NFT?.KEYS||[],PROFILE=KEYS[0],RUN=KEYS[1],SETTINGS=KEYS[2];
 function mirror(profile,run,at){if(run===null)return null;const next=copy(run);check(!M.BO.isLabMarked(next),'Lab/practice is not an earning source');if(next.playerLevel!==profile.progression.level)M.BO.setPlayerLevel(next,profile.progression.level);
  if(own(profile,'potions')){if(profile.progression.level>=12||own(next,'potions'))M.BO.setPotionState(next,profile.potions,at);next._potionProfile={revision:profile.potions.revision,progression:copy(profile.progression)};for(const k of ['passiveXp','expInterest','achievementXp'])if(own(profile,k))next._potionProfile[k]=copy(profile[k]);}
  else check(!own(next,'potions')&&!own(next,'_potionProfile'),'RUN Potion mirror is missing its whole PROFILE source');return next;
 }
 function create(options){
  check(M.NFT&&M.N&&M.AX&&M.CS&&M.BO&&KEYS.length===3,'complete native model dependencies required');check(options&&['withLocks','context','assertOwner','assertContext','get','assertWritable','validateBank','validateImage','token','now','xpConfig','apply'].every(k=>typeof options[k]==='function'),'existing native whole-owner callbacks required');
  const sourcePublications=new WeakMap(),storage=options.storage;check(storage&&['getItem','setItem','removeItem'].every(k=>typeof storage[k]==='function'),'native Storage required');let paused=false,reason='',activeGuard=null,recovering=false,tail=Promise.resolve();
  function pause(error){paused=true;reason=error.message;try{options.onPause?.(error)}catch(_){/* retain original uncertainty */}}
  function writable(){check(!paused,'saving is paused; reload before any retry');options.assertOwner();options.assertWritable({committing:!!activeGuard,recovering});}
  function bank(key,raw){M.CS.validateBank(key,raw);options.validateBank(key,raw);if(key===PROFILE&&raw!==null)M.AX.validateProfile(JSON.parse(raw));return true;}
  function image(image){const p=image[PROFILE]===null?null:JSON.parse(image[PROFILE]),r=image[RUN]===null?null:JSON.parse(image[RUN]);check(p!==null,'whole selected PROFILE required');M.CS.validateMirrors(p,r);M.AX.validateMirrors?.(p,r);options.validateImage(image);return true;}
  const tx=M.NFT.create({storage,assertOwner(frame){writable();activeGuard?.(frame)},assertContext:options.assertContext,validateBank:bank,validateImage:image,validateAuxTransition:request=>M.CS.validateAuxTransition(request),token:options.token,onPause:pause});
  function selected(c,intent){const slot=M.N.binding(c.slot);M.AX.assertHost(c.profile,slot);if(intent)check(slot.id===intent.slot?.id&&slot.generation===intent.slot?.generation,'original selected slot/generation changed');return slot;}
  async function transact(make,intent,auxiliary=false,sourceFence,preflight){
   check(typeof make==='function','detached native projector required');const queuedSlot=preflight?M.N.binding(intent.slot):selected(options.get(),intent);options.assertIntent?.(intent);
   // Serialize this owner's valid requests, not a busy/debounce gate. Capture
   // intent ownership now; read financial/source witnesses ONLY inside locks.
   const enter=()=>{writable();const c=options.get(),slot=selected(c,intent),context=options.context();check(same(slot,queuedSlot),'original queued slot/generation changed');options.assertContext(context);
    const before={[PROFILE]:c.profileRaw,[RUN]:c.runRaw,[SETTINGS]:c.settingsRaw},keys=auxiliary?[...KEYS,...M.NFT.AUX_KEYS]:KEYS;if(auxiliary)for(const key of M.NFT.AUX_KEYS)before[key]=storage.getItem(key);
    for(const key of keys)check(before[key]===null||typeof before[key]==='string','unreadable whole bank witness');check(before[PROFILE]!==null,'whole confirmed PROFILE required');if(options.validateLiveImage)check(options.validateLiveImage(c,before)===true,'whole live native image changed');else{check(same(JSON.parse(before[PROFILE]),c.profile),'whole live PROFILE changed outside its confirmed raw image');check(before[RUN]===null?c.run===null:same(JSON.parse(before[RUN]),c.run),'whole live RUN changed outside its confirmed raw image');}
    for(const key of keys)bank(key,before[key]);image(before);check(storage.getItem(M.NFT.JOURNAL_KEY)===null,'paired native journal requires explicit recovery');
    const extraGuard=options.captureFence?.(c),seen={profile:c.profile,run:c.run,p:JSON.stringify(c.profile),r:JSON.stringify(c.run)},at=options.now();check(Number.isSafeInteger(at)&&at>=0&&at<=8640000000000000,'invalid actual native acceptance time');let phase=null;
    function guard(frame){if(frame)phase=frame;sourceFence?.();extraGuard?.(phase);const latest=options.get();selected(latest,intent);check(latest.profile===seen.profile&&latest.run===seen.run&&JSON.stringify(latest.profile)===seen.p&&JSON.stringify(latest.run)===seen.r,'whole live candidate changed before native confirmation');options.assertContext(context);options.assertIntent?.(intent);}
    activeGuard=guard;try{guard();const ctx={slot,at,context,before:Object.freeze({...before}),levelAtIntent:intent?.levelAtIntent??c.profile.progression.level,session:intent?.session,sequence:intent?.sequence},prepared=make({profile:copy(c.profile),run:copy(c.run)},ctx);if(prepared.accepted===false){guard();return {...prepared,committed:false};}const nextProfile=prepared.profile;check(nextProfile&&typeof nextProfile==='object','projector must supply its detached whole PROFILE');M.AX.assertPreserved(c.profile,nextProfile);
     const nextRun=prepared.run===undefined?mirror(nextProfile,c.run,at):mirror(nextProfile,prepared.run,at),after={...(auxiliary?prepared.after:{}),[PROFILE]:JSON.stringify(nextProfile),[RUN]:nextRun===null?null:JSON.stringify(nextRun),[SETTINGS]:before[SETTINGS]};for(const key of keys)bank(key,after[key]);image(after);guard();
     if(keys.every(k=>after[k]===before[k]))return {...prepared,profile:copy(nextProfile),run:copy(nextRun),committed:false};
     if(auxiliary)tx.commitAux({context,before,after,sourceKeys:prepared.sourceKeys,sources:prepared.sources});else tx.commit({context,before,after});guard();try{options.apply({profile:nextProfile,run:nextRun,raw:after,sourceId:prepared.id||null,summary:prepared.summary||null,summaries:prepared.summaries||[]});const publish=sourcePublications.get(prepared);sourcePublications.delete(prepared);publish?.();}catch(error){const failure=Object.assign(new Error('Confirmed native banks could not be published. Reload before retrying: '+error.message),{reloadRequired:true,attempted:true});pause(failure);throw failure;}
     return {...prepared,profile:copy(nextProfile),run:copy(nextRun),committed:true};
    }finally{activeGuard=null;}
   };
   const job=tail.then(()=>options.withLocks(()=>{
    if(!preflight)return enter();
    // Only the trusted Survey revision-fence query may await here. The host's
    // four-lock scope must await this entire promise before releasing authority.
    writable();options.assertIntent?.(intent);sourceFence?.();const context=options.context();
    return Promise.resolve().then(preflight).then(()=>{writable();options.assertContext(context);options.assertIntent?.(intent);sourceFence?.();return enter();});
   }));tail=job.catch(()=>{});return job;
  }
  function source(request,intent){
   check(request&&['check-in','daily-task'].includes(request.kind),'a supported original native source is required');check(intent&&typeof intent==='object','original source owner intent is required');
   return transact(({profile},c)=>{request.assertCurrent?.();const key=request.kind==='check-in'?M.NFT.AUX_KEYS[0]:M.NFT.AUX_KEYS[1],record=request.kind==='check-in'?{key,kind:request.kind,at:c.at}:{key,kind:request.kind,at:c.at,observations:typeof request.observations==='function'?request.observations():request.observations},parsed=M.NFT.parseSources([key],[record]),input={context:c.context,before:c.before,...parsed};if(profile.advancedStats&&own(profile.advancedStats,'visibleSeconds'))input.visibleSeconds=profile.advancedStats.visibleSeconds;const prepared={...M.CS.prepareNativeAux(input),...parsed};if(typeof request.onCommitted==='function')sourcePublications.set(prepared,()=>request.onCommitted(copy(prepared.result)));return prepared;},intent,true,request.assertCurrent);
  }
  function core(request,intent){
   check(typeof M.CS.prepareNativeCore==='function'&&request&&typeof request.project==='function','complete original core source projector required');check(intent&&typeof intent==='object','original core source owner intent required');
   const kind=request.kind===undefined?'balatro':request.kind;check(['balatro','survey','emerald-poker','emerald-strict-poker'].includes(kind),'unsupported original profile source');check(request.preflight===undefined||kind==='survey'&&typeof request.preflight==='function','only the trusted Survey fence may use preflight');
   return transact((snapshot,c)=>{request.assertCurrent?.();const candidate=request.project(snapshot,c);check(candidate&&typeof candidate==='object'&&typeof candidate.then!=='function','core projector must be a synchronous detached candidate');if(candidate.accepted===false)return candidate;
    check(candidate.finalizeRewards===undefined||kind==='emerald-poker'&&typeof candidate.finalizeRewards==='function','only Poker may finalize its detached PXP contract');const before={...c.before};for(const key of M.NFT.AUX_KEYS)before[key]=storage.getItem(key);const prepared=M.CS.prepareNativeCore({context:c.context,before,candidate:{profile:candidate.profile,run:candidate.run},source:{kind,id:request.id,at:c.at},configuration:options.xpConfig(candidate.profile,c.at,'achievement')},candidate.finalizeRewards);check(candidate.summaries===undefined||Array.isArray(candidate.summaries),'invalid original core source summaries');prepared.summaries=[...(candidate.summaries||[]),...prepared.summaries];if(typeof request.onCommitted==='function')sourcePublications.set(prepared,()=>request.onCommitted());return prepared;
   },intent,false,request.assertCurrent,request.preflight);
  }
  function nativeReward(make,intent){let witnesses=null;return transact(({profile,run},c)=>{const prepared=make(profile,c);if(prepared.summary&&!prepared.summary.duplicate&&!own(profile,'achievementXp')){witnesses=Object.fromEntries(M.NFT.AUX_KEYS.map(key=>[key,storage.getItem(key)]));for(const key of M.NFT.AUX_KEYS)bank(key,witnesses[key]);const streak=witnesses[M.NFT.AUX_KEYS[0]]===null?null:JSON.parse(witnesses[M.NFT.AUX_KEYS[0]]),tasks=witnesses[M.NFT.AUX_KEYS[1]]===null?null:JSON.parse(witnesses[M.NFT.AUX_KEYS[1]]);prepared.profile=M.AX.prepareBaseline(profile,prepared.profile,{...c,beforeRun:run,beforeSources:{streakHalf:streak?.medalsHalf||0,tasksHalf:tasks?.earnedMedalsHalf||0}}).profile;}return prepared;},intent,false,()=>{if(witnesses)for(const key of M.NFT.AUX_KEYS)check(storage.getItem(key)===witnesses[key],'canonical daily eligibility changed before native baseline confirmation');});}
  function button(intent){return nativeReward((profile,c)=>M.N.prepareButton(profile,c,options.xpConfig(profile,c.at,'native-button')),intent);}
  function dart(request,intent){return nativeReward((profile,c)=>M.N.prepareDart(profile,request,c,options.xpConfig(profile,c.at,'physical-dart')),intent);}
  async function recover(){return options.withLocks(()=>{recovering=true;try{writable();return tx.recover()}finally{recovering=false}});}
  return Object.freeze({button,dart,core,source,transact:(make,intent)=>transact(make,intent),recover,status:()=>({paused:paused||tx.status().paused,reason:reason||tx.status().reason})});
 }
 return Object.freeze({create,mirror,PLAYER_XP_CONFIG});
});
