/* One synchronous whole-PROFILE Poker actor. A proposal is not an award until
 * exact durable readback + owner/slot/context/live/raw fences all pass. Any
 * uncertainty after an attempted write permanently closes THIS actor. Never
 * rollback, retry a saved hand, or seed/migrate while reading/rendering. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(root,n?require('./emerald-poker'):root.BOEmeraldPoker,n?require('./emerald-friendship'):root.BOEmeraldFriendship,n?require('./emerald-progress'):root.BOEmeraldProgress,n?require('./progression'):root.BOProgress,n?require('./emerald-poker-events'):root.BOEmeraldPokerEvents,n?require('./emerald-poker-profile'):root.BOEmeraldPokerProfile,n?require('./passive-xp'):root.BOPassiveXP,n?require('./expansion-rewards'):root.BOExpansionRewards,n?require('./emerald-slots'):root.BOEmeraldSlots);if(n)module.exports=api;else root.BOEmeraldPokerActions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,P,F,EP,PG,Events,V,PX,R,SL){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0);
 function check(ok,message){if(!ok)throw Error(message)}
 function record(o){return !!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o))}
 function fields(o,keys){return record(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(o,k);return d&&own(d,'value')&&d.enumerable===true})}
 function thenable(o){return !!o&&typeof o.then==='function'}
 function json(value){
  const path=new Set();function inspect(v,depth){check(depth<=64,'The live save is nested too deeply.');if(v===null||['string','boolean'].includes(typeof v))return;if(typeof v==='number'){check(Number.isFinite(v),'The live save contains a non-finite number.');return}check(v&&typeof v==='object'&&!path.has(v),'The live save requires ordinary acyclic JSON data.');check(Array.isArray(v)?Object.getPrototypeOf(v)===Array.prototype:record(v),'The live save contains a non-JSON object.');path.add(v);const keys=Reflect.ownKeys(v);for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const d=Object.getOwnPropertyDescriptor(v,key);check(typeof key==='string'&&d&&own(d,'value')&&d.enumerable===true,'The live save contains a private field or accessor.');inspect(d.value,depth+1)}path.delete(v)}inspect(value,0);return JSON.stringify(value);
 }
 function create(host){
  check(host&&['get','stamp','assertWritable','read','write','applyProfile','pause','render','notify','seed','xpConfig'].every(k=>typeof host[k]==='function'),'Poker action host is incomplete.');
  let busy=false,paused=false,destroyed=false;
  function announce(message){try{host.notify(message)}catch(_){}}
  function writable(){const result=host.assertWritable();check(!thenable(result)&&result!==false,'Save ownership changed. Nothing was credited.');}
  function gate(c){
   check(!paused&&!destroyed,'Poker saving is paused. Reopen the website before playing again.');
   check(c&&c.page==='home'&&c.tab==='poker','Open the current Poker table before acting.');
   check(c.gamesEnabled!==false,'Card games are paused in Feature Power. Your saved table is kept.');
   check(!c.hidden&&!root.document?.hidden&&!c.protected&&!c.suspended&&!c.animating&&!c.conductPaused&&!c.cloudRestoring&&!c.slotBusy&&!c.survey&&!c.batteryBlocked,'Poker is paused while this view or save is unavailable.');
   check(Number.isInteger(c.level)&&c.level>=10&&c.level<=100,'Emerald Poker needs actual player Level 10+.');
   check(EP&&P.available(EP.progress(c.profile?.emerald,c.level).level),'Poker unlocks at Emerald’s own Level 5.');
  }
  function snapshot(){
   writable();const c=host.get();gate(c);V.validateProfile(c.profile);const profileJSON=json(c.profile),runJSON=json(c.run??null),rawProfile=host.read('profile'),rawRun=host.read('run');
   check(typeof rawProfile==='string','The current whole-profile save is unavailable.');let saved;try{saved=JSON.parse(rawProfile)}catch(_){throw Error('The saved profile needs attention. Nothing was credited.')}
   check(json(saved)===profileJSON,'The live and saved whole profiles disagree. Reopen the website before playing.');
   const capture={profile:c.profile,run:c.run,level:c.level,stamp:host.stamp(),profileJSON,runJSON,rawProfile,rawRun};fence(capture);return capture;
  }
  function fence(capture,afterWrite=false,expectedRaw){
   writable();const c=host.get();gate(c);
   check(c.profile===capture.profile&&c.run===capture.run&&c.level===capture.level&&host.stamp()===capture.stamp,'The current Poker owner, slot or view changed.');
   check(json(c.profile)===capture.profileJSON&&json(c.run??null)===capture.runJSON,'The complete live profile or run changed during this action.');
   check(host.read('profile')===(afterWrite?expectedRaw:capture.rawProfile)&&host.read('run')===capture.rawRun,'The saved profile or run changed during this action.');writable();
  }
  function uncertain(message){if(paused)return;paused=true;const text='Poker save could not be confirmed. The hand may already be saved. Do not retry or reset; reopen the website. '+message;try{host.pause(text)}catch(_){}announce(text)}
  function status(){try{const c=host.get();gate(c);const poker=c.profile?.emeraldPoker;return {unlocked:true,blocked:paused,busy,state:poker===undefined?null:R.publicPoker(c.profile),friendship:F.info(c.profile?.emeraldFriendship),effects:Events.effectsAt(c.profile?.emeraldPokerEvents,Math.trunc(host.now?host.now():Date.now()))}}catch(error){return {unlocked:false,blocked:true,state:null,reason:error.message}}}
  function xpConfig(next,now,oldEvents){const cfg=host.xpConfig(next,now);check(record(cfg)&&!thenable(cfg),'Poker needs a synchronous native XP configuration.');const context={...cfg,now,sourceKind:'emerald-poker',xpSource:'emerald-poker',extraRewardMultiplier:1,pokerXpMultiplier:Events.effectsAt(oldEvents,now).xpMultiplier};if(oldEvents===undefined)delete context.pokerEvents;else context.pokerEvents=oldEvents;return context}
  function capacity(p,amount){for(const key of ['xp','totalXp']){const old=p[key],sum=old+amount;check(typeof old==='number'&&Number.isFinite(old)&&old>=0&&Number.isFinite(sum)&&sum>old&&Math.abs((sum-old)-amount)<=1e-8,'The player XP bank has no exact capacity for this award.')}}
  function action(request){
   if(busy||paused||destroyed)return {ok:false,reason:'Poker is busy or save-paused.'};
   busy=true;let attempted=false,applied=false;
   try{
    check(record(request),'Invalid Poker action.');const descriptor=Object.getOwnPropertyDescriptor(request,'action');check(descriptor&&own(descriptor,'value')&&descriptor.enumerable===true,'Poker actions require plain data fields.');const kind=descriptor.value;
    check(['draw','toggle-hold','redraw'].includes(kind)&&fields(request,['action','expectedRevision'].concat(kind==='toggle-hold'?['index']:[]))&&count(request.expectedRevision),'Invalid Poker action fields.');
    const c=snapshot(),next=JSON.parse(c.profileJSON),oldPoker=next.emeraldPoker,oldRevision=oldPoker?.revision??0;
    check(request.expectedRevision===oldRevision,'The Poker table changed. Use the current buttons.');check(oldPoker!==undefined||kind==='draw','Draw five cards before choosing holds.');
    const now=Math.trunc(host.now?host.now():Date.now());check(count(now)&&now<=8640000000000000,'Invalid absolute Poker event time.');
    const before=oldPoker===undefined?null:R.publicPoker(c.profile),source=oldPoker===undefined?P.create(host.seed()):oldPoker;
    const proposal=P.move(source,{type:kind,...(kind==='toggle-hold'?{index:request.index}:{})},oldRevision);
    next.emeraldPoker=proposal.state;if(!own(next,'emeraldFriendship'))next.emeraldFriendship=F.create();let xpResult=null,checkpointResult=null;
    if(proposal.completed){
     const receipt=proposal.receipt,rewards=receipt.rewards,oldEvents=next.emeraldPokerEvents,cfg=xpConfig(next,now,oldEvents),priorBonus=R.pokerBonus(c.profile),priorCoins=R.pokerCoinCredits(c.profile),coinNumerator=SL.effectsAt(c.profile.emeraldSlots,now,'emerald-poker').coinNumerator;next.pokerLevelRewards=R.creditPoker(next.pokerLevelRewards,source,proposal.state,coinNumerator);const bonus=R.pokerBonus(next),delta=Object.fromEntries(Object.keys(bonus).map(k=>[k,bonus[k]-(priorBonus?.[k]||0)])),rawXp=rewards.xp+delta.xpMilli/1000;
     if(receipt.category==='full-house'&&own(next,'passiveXp')){check(typeof PX?.checkpointPokerEvents==='function','The passive XP event boundary module is unavailable.');const checkpointConfig={...cfg};delete checkpointConfig.pokerXpMultiplier;checkpointResult=PX.checkpointPokerEvents(next,now,checkpointConfig);check(checkpointResult?.ok===true,'The existing passive XP checkpoint could not be confirmed.');}
     const friendship=next.emeraldFriendship;
     next.emeraldFriendship=F.completePoker(friendship,{roundId:receipt.roundId,completedRounds:receipt.completedRounds,fp:rewards.fp},friendship.revision).state;
     next.emeraldFriendship=F.completeExpansion(next.emeraldFriendship,'poker',{id:receipt.roundId,sequence:next.pokerLevelRewards.receipts.length,pointsMilli:delta.fpMilli},next.emeraldFriendship.revision).state;
     if(rawXp>0){const expected=rawXp*PG.earnedXpMultiplier(next.progression.level)*cfg.pokerXpMultiplier;capacity(next.progression,expected);xpResult=PG.addEarnedXp(next.progression,rawXp,'emerald-poker:'+receipt.roundId,cfg);check(xpResult&&!xpResult.duplicate&&xpResult.awardedXp===expected,'The native Poker XP award could not be confirmed.');}
     if(rewards.coins>0){const delta=rewards.coins*2,prior=next.progression.coinsHalf??0;check(count(prior)&&count(delta)&&count(prior+delta),'The native coin bank has no capacity for this award.');next.progression.coinsHalf=prior+delta;}
     R.creditCoins(next,'poker',R.pokerCoinCredits(next)-priorCoins);
     if(rewards.faucetClaims>0){const credit=PG.creditPokerClaims(next.progression,{roundId:receipt.roundId,serial:receipt.serial,claimsTotal:P.rewardTotals(proposal.state).faucetClaims},cfg);check(credit?.ok===true&&credit.creditedClaims===100,'The Royal Flush faucet progression source could not be confirmed.');}
     const credited=Events.credit(oldEvents,{roundId:receipt.roundId,serial:receipt.serial,category:receipt.category},now,oldEvents?.revision??0);if(credited.changed)next.emeraldPokerEvents=credited.state;
     const passiveXP=checkpointResult?.awardedXp>0?checkpointResult:null;if(passiveXP){const awarded=(xpResult?.awardedXp||0)+(passiveXP.awardedXp||0);xpResult={...(xpResult||passiveXP),fromLevel:c.level,toLevel:next.progression.level,levelsGained:next.progression.level-c.level,awardedXp:awarded};}
    }
    V.validateProfile(next);const expectedRaw=json(next);fence(c);attempted=true;
    const written=host.write('profile',next);check(!thenable(written)&&written!==false,'The whole-profile write was not confirmed.');
    fence(c,true,expectedRaw);fence(c,true,expectedRaw);
    const outcome=host.applyProfile(next,xpResult);check(!thenable(outcome)&&outcome!==false,'The saved hand could not be applied to its live native mirrors.');applied=true;
    const after=R.publicPoker(next),event={game:'poker',action:kind,before,after,completed:proposal.completed,receipt:proposal.completed?after.receipt:proposal.receipt,xpResult,checkpointResult};
    try{host.render(event)}catch(_){announce('Poker is saved. Reopen the table if its display has not refreshed.');}
    return {ok:true,completed:proposal.completed,state:after,receipt:event.receipt,xpResult};
   }catch(error){if(attempted&&!applied)uncertain(error.message);else announce(error.message);return {ok:false,uncertain:attempted&&!applied,reason:error.message};}
   finally{busy=false;}
  }
  return Object.freeze({status,action,destroy:()=>{destroyed=true}});
 }
 return Object.freeze({create});
});
