/* Guarded native Blackjack commits. Parent delegates trusted actions and owns
 * writer/slot/cloud/reset/conduct fences. No listeners, timers or startup writes.
 * The complete PROFILE (table + friendship) is written once, read back exactly,
 * fenced again, then applied live. RUN is only observed; never written/mutated.
 * ANY uncertain attempted write latches this controller and freezes host saving.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports,api=factory(root,node?require('./emerald-blackjack'):root.BOEmeraldBlackjack,node?require('./emerald-friendship'):root.BOEmeraldFriendship,node?require('./emerald-progress'):root.BOEmeraldProgress);if(node)module.exports=api;else root.BOEmeraldBlackjackActions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,B,F,P){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),record=x=>!!x&&typeof x==='object'&&!Array.isArray(x),thenable=x=>!!x&&(typeof x==='object'||typeof x==='function')&&typeof x.then==='function';
 function check(ok,message){if(!ok)throw new Error(message);}
 function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(stable).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';}
 function json(value){const raw=JSON.stringify(value);check(typeof raw==='string','The current profile cannot be serialized.');return raw;}
 function create(host){
  check(B&&F&&P,'Blackjack, friendship and Emerald models must load before the controller.');
  check(host&&['get','stamp','assertWritable','read','write','applyProfile','pause','render','notify','seed'].every(k=>typeof host[k]==='function'),'Incomplete Blackjack host.');
  let busy=false,paused=false,destroyed=false;
  function notify(message){try{host.notify(message);}catch(_){/* Presentation cannot decide commit success. */}}
  function gate(c){
   check(!destroyed&&!paused,'Blackjack saving is paused. Reload safely before playing.');
   check(c&&record(c.profile)&&c.page==='home'&&c.tab==='blackjack','Open the Blackjack tab before playing.');
   check(!c.hidden&&!c.protected&&!c.suspended&&!c.conductPaused&&!c.cloudRestoring&&!c.slotBusy&&!c.survey,'Blackjack is unavailable in this protected context.');
   check(!root.document?.hidden&&root.document?.visibilityState!=='hidden','Return to the visible Blackjack table before playing.');
   check(Number.isInteger(c.level)&&c.level>=10&&c.level<=100&&c.profile.progression?.level===c.level,'Use the actual, reconciled player level before playing.');
   check(P.validate(c.profile.emerald)&&P.progress(c.profile.emerald,c.level).level>=10,'Blackjack unlocks at Emerald Level 10.');return c;
  }
  function assert(){const result=host.assertWritable();check(result!==false&&!thenable(result),'This save is not synchronously writable.');}
  function read(key){const value=host.read(key);check(value===null||typeof value==='string','The canonical '+key+' save could not be read.');return value;}
  function ledgers(profile){
   const bj=own(profile,'emeraldBlackjack'),fp=own(profile,'emeraldFriendship');
   check(bj===fp,'Blackjack and friendship saves must be reconciled together. No defaults were loaded.');
   if(!bj)return {present:false,state:null,friendship:null};
   check(B.validate(profile.emeraldBlackjack)&&F.validate(profile.emeraldFriendship),'Blackjack or friendship save needs attention. No round was changed.');
   check(profile.emeraldBlackjack.completedRounds===profile.emeraldFriendship.rounds,'Blackjack and friendship round counts disagree. No reward was changed.');
   if(profile.emeraldBlackjack.round?.outcome)check(profile.emeraldFriendship.lastRoundId===profile.emeraldBlackjack.round.id,'The completed Blackjack round and friendship receipt disagree.');
   return {present:true,state:profile.emeraldBlackjack,friendship:profile.emeraldFriendship};
  }
  function fence(c){
   assert();const live=gate(host.get());
   check(live.profile===c.profile&&live.run===c.run&&live.level===c.level&&host.stamp()===c.stamp,'The slot, origin run, context or player changed. Read the current table.');
   check(json(live.profile)===c.profileJSON,'The live profile changed during the Blackjack action. Read the current table.');return live;
  }
  function unchanged(c){fence(c);check(read('profile')===c.profileRaw&&read('run')===c.runRaw,'The canonical save changed. Read the current Blackjack table.');fence(c);check(read('profile')===c.profileRaw&&read('run')===c.runRaw,'The canonical save changed after its ownership check.');}
  function capture(){
   assert();const live=gate(host.get()),c={...live,stamp:host.stamp(),profileRaw:read('profile'),runRaw:read('run'),profileJSON:json(live.profile)};
   check(c.profileRaw!==null,'Save the current profile safely before opening Blackjack.');
   let durable;try{durable=JSON.parse(c.profileRaw);}catch(_){throw new Error('The saved profile needs attention. No round was changed.');}
   check(record(durable)&&durable.progression?.level===c.level,'The actual player level is not durably reconciled.');
   check(stable(durable)===stable(c.profile),'The complete profile is not durably reconciled. Save the current progress safely before playing Blackjack.');
   check(P.validate(durable.emerald)&&stable(durable.emerald)===stable(c.profile.emerald),'Emerald progress is not durably reconciled.');
   const source=ledgers(c.profile),saved=ledgers(durable);
   check(source.present===saved.present&&(!source.present||stable(source.state)===stable(saved.state)&&stable(source.friendship)===stable(saved.friendship)),'Blackjack or friendship progress is not durably reconciled.');
   unchanged(c);return {c,source};
  }
  function command(input){
   if(typeof input==='string')return {action:input,expectedRevision:null};
   check(record(input)&&Reflect.ownKeys(input).length===2&&own(input,'action')&&own(input,'expectedRevision'),'Choose a current Blackjack action.');
   for(const key of ['action','expectedRevision'])check(own(Object.getOwnPropertyDescriptor(input,key)||{},'value'),'Blackjack action must contain plain data.');
   check(typeof input.action==='string'&&Number.isSafeInteger(input.expectedRevision)&&input.expectedRevision>=0,'Invalid Blackjack action revision.');return input;
  }
  function status(){
   try{const c=gate(host.get()),source=ledgers(c.profile);return {unlocked:true,blocked:false,reason:null,state:source.present?B.publicState(source.state):null,friendship:source.present?F.info(source.friendship):F.info()};}
   catch(error){return {unlocked:false,blocked:true,reason:error.message,state:null,friendship:null};}
  }
  function action(input){
   if(busy||destroyed||paused)return {ok:false,reason:busy?'A Blackjack action is already committing.':'Blackjack saving is paused. Reload safely.'};
   busy=true;let attempted=false,applied=false;
   try{
    const request=command(input);check(['deal','hit','stand','next','new-match'].includes(request.action),'Unknown Blackjack action.');
    const {c,source}=capture();
    if(!source.present)check(request.action==='deal','Deal manually to start the first Blackjack table.');
    // No default ledger or RNG seed is created by mount/status/render/reopen.
    const state=source.present?B.copy(source.state):B.create(host.seed()),friendship=source.present?F.copy(source.friendship):F.create();
    const revision=request.expectedRevision===null?state.revision:request.expectedRevision;
    const proposal=B.move(state,request.action,revision);let nextFriendship=friendship;
    if(proposal.completed){
     const credit=F.completeRound(friendship,{roundId:proposal.roundId,completedRounds:proposal.state.completedRounds},friendship.revision);
     check(credit.changed===true,'The newly completed Blackjack round was not credited.');nextFriendship=credit.state;
    }
    check(B.validate(proposal.state)&&F.validate(nextFriendship)&&proposal.state.completedRounds===nextFriendship.rounds,'Blackjack and friendship must commit as one valid round.');
    const next=JSON.parse(c.profileJSON);next.emeraldBlackjack=proposal.state;next.emeraldFriendship=nextFriendship;
    const raw=json(next);unchanged(c);attempted=true;
    const wrote=host.write('profile',next);check(wrote===true&&!thenable(wrote),'The Blackjack profile write was not confirmed.');
    check(read('profile')===raw,'Blackjack profile readback did not match.');check(read('run')===c.runRaw,'The origin run changed during the Blackjack write.');fence(c);
    // Read once more after host guards: a guard itself may discover a slot swap.
    check(read('profile')===raw&&read('run')===c.runRaw,'The canonical save changed before Blackjack could apply.');fence(c);
    check(read('profile')===raw&&read('run')===c.runRaw,'The canonical save changed after the final ownership check.');
    const appliedResult=host.applyProfile(next);check(appliedResult!==false&&!thenable(appliedResult),'The Blackjack profile could not be applied synchronously.');applied=true;
    try{host.render();}catch(_){/* A renderer failure cannot revoke a proven durable action. */}
    return {ok:true,completed:proposal.completed,roundId:proposal.roundId,message:proposal.message,state:B.publicState(proposal.state)};
   }catch(error){
    if(attempted&&!applied){paused=true;try{host.pause('Blackjack saving is uncertain. This action may already be saved. Do not retry, reset or clear storage; reload safely to inspect it. '+error.message);}catch(_){/* The local uncertainty latch still prevents a second attempt. */}}
    notify(error.message);return {ok:false,reason:error.message,uncertain:attempted&&!applied};
   }finally{busy=false;}
  }
  return Object.freeze({action,status,destroy(){destroyed=true;}});
 }
 return Object.freeze({create});
});
