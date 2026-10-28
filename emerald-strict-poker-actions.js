/* Guarded whole-PROFILE Strict Poker actor. NO independent storage writer.
 * Host retains selected-slot ownership, cloud authentication, strictFP source
 * pairing and native live mirrors. Reads/status never create a table or seed it.
 * Write uncertainty is permanent for this instance: no rollback/retry/reset.
 */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(root,n?require('./emerald-strict-poker'):root.BOEmeraldStrictPoker,n?require('./poker-levels'):root.BOPokerLevels);if(n)module.exports=api;else root.BOEmeraldStrictPokerActions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root,P,Levels){'use strict';
 const KEY='emeraldStrictPoker',own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0);
 function check(ok,message){if(!ok)throw Error(message)}
 function record(o){return !!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o))}
 function fields(o,keys){return record(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(o,k);return d&&own(d,'value')&&d.enumerable})}
 function sync(value,message){check(!value||typeof value.then!=='function',message);return value}
 function json(value){const path=new Set();function inspect(v,depth){check(depth<=64,'Strict Poker save is nested too deeply.');if(v===null||['string','boolean'].includes(typeof v))return;if(typeof v==='number'){check(Number.isFinite(v),'Strict Poker save contains a non-finite value.');return}check(v&&typeof v==='object'&&!path.has(v),'Strict Poker needs ordinary acyclic JSON.');const arr=Array.isArray(v);check(arr?Object.getPrototypeOf(v)===Array.prototype:record(v),'Strict Poker needs ordinary JSON objects.');path.add(v);const keys=Reflect.ownKeys(v);if(arr)check(keys.length===v.length+1,'Strict Poker cannot save sparse arrays.');for(const key of keys){if(arr&&key==='length')continue;const d=Object.getOwnPropertyDescriptor(v,key);check(typeof key==='string'&&d&&own(d,'value')&&d.enumerable,'Strict Poker cannot save accessors or private fields.');if(arr)check(/^(0|[1-9][0-9]*)$/.test(key)&&Number(key)<v.length,'Strict Poker cannot save custom array fields.');inspect(d.value,depth+1)}path.delete(v)}inspect(value,0);return JSON.stringify(value)}
 function create(host){
  check(host&&['get','stamp','assertWritable','read','write','applyProfile','pause','render','notify','seed','validateProfile','creditRewards'].every(k=>typeof host[k]==='function'),'Strict Poker host must supply native whole-profile and strictFP authentication hooks.');
  let busy=false,paused=false,destroyed=false;
  function announce(text){try{host.notify(text)}catch(_){}}
  function writable(){check(sync(host.assertWritable(),'Strict Poker ownership checks must be synchronous.')!==false,'Strict Poker save ownership changed.')}
  function gate(c){check(!paused&&!destroyed,'Strict Poker saving is paused. Reopen the website before playing.');check(c&&c.page==='home'&&c.tab==='strict-poker','Open the current Strict Poker table first.');check(c.gamesEnabled!==false,'Card games are paused in Feature Power. The saved hand is kept.');check(!c.hidden&&!root.document?.hidden&&!c.protected&&!c.suspended&&!c.animating&&!c.conductPaused&&!c.cloudRestoring&&!c.slotBusy&&!c.survey&&!c.batteryBlocked,'Finish other dialogs or save actions before playing Strict Poker.');check(Number.isInteger(c.level)&&c.level>=50&&c.level<=100,'Strict Poker needs actual player Level 50+.')}
  function authenticate(p){check(sync(host.validateProfile(p),'Strict Poker profile validation must be synchronous.')!==false,'Strict Poker profile sources disagree.');check(!own(p,KEY)||P.validate(p[KEY]),'Strict Poker private seeded ledger needs attention.')}
  function fence(c,after=false,raw){writable();const current=host.get();gate(current);check(current.profile===c.profile&&current.run===c.run&&current.level===c.level&&host.stamp()===c.stamp,'Strict Poker owner, slot or view changed.');check(json(current.profile)===c.profileJSON&&json(current.run??null)===c.runJSON,'The whole live profile or run changed during Strict Poker.');check(host.read('profile')===(after?raw:c.rawProfile)&&host.read('run')===c.rawRun,'The saved whole profile or run changed during Strict Poker.');writable()}
  function snapshot(){writable();const current=host.get();gate(current);const profileJSON=json(current.profile),runJSON=json(current.run??null);authenticate(current.profile);const rawProfile=host.read('profile'),rawRun=host.read('run');check(typeof rawProfile==='string','Strict Poker whole-profile save is unavailable.');let saved;try{saved=JSON.parse(rawProfile)}catch(_){throw Error('The saved whole profile needs attention. Nothing was credited.')}check(json(saved)===profileJSON,'The live and saved whole profiles disagree. Reopen the website.');const capture={profile:current.profile,run:current.run,level:current.level,stamp:host.stamp(),profileJSON,runJSON,rawProfile,rawRun};fence(capture);return capture}
  function uncertain(reason){paused=true;const text='Strict Poker save could not be confirmed. The hand may already be saved. Do not retry or reset; reopen the website. '+reason;try{host.pause(text)}catch(_){}announce(text)}
  function pokerPXP(profile){const value=host.pokerPXP?sync(host.pokerPXP(profile),'Strict Poker combined PXP reads must be synchronous.'):profile?.emeraldPoker?.totalPXP??0;Levels.info(value);return value}
  function status(){try{const c=host.get();gate(c);const state=c.profile?.[KEY],totalPXP=pokerPXP(c.profile);return {unlocked:true,blocked:paused,busy,state:state===undefined?null:P.publicState(state),totalPXP,level:Levels.info(totalPXP)}}catch(error){return {unlocked:false,blocked:true,busy,state:null,reason:error.message}}}
  function action(request){
   if(busy||paused||destroyed)return {ok:false,reason:'Strict Poker is busy or save-paused.'};busy=true;let attempted=false,applied=false;
   try{
    const descriptor=record(request)?Object.getOwnPropertyDescriptor(request,'action'):null;check(descriptor&&own(descriptor,'value'),'Choose a plain Strict Poker action.');const kind=descriptor.value;
    check(['deal','new-match','check','call','raise','fold','emerald','reveal'].includes(kind)&&fields(request,['action','expectedRevision'].concat(kind==='raise'?['to']:[]))&&count(request.expectedRevision),'Invalid Strict Poker action fields.');
    const c=snapshot(),next=JSON.parse(c.profileJSON),old=next[KEY],oldRevision=old?.revision??0;check(request.expectedRevision===oldRevision,'The Strict Poker table changed. Use the current controls.');check(old!==undefined||kind==='deal','Deal the first hand explicitly.');
    const rewardLevel=kind==='deal'?Levels.info(pokerPXP(next)).level:null,source=old===undefined?P.create(host.seed()):old,before=old===undefined?null:P.publicState(old),beforeTotals=old===undefined?{wins:0,ties:0,losses:0,rounds:0,baseFP:0,fpHundredths:0,fp:0}:P.rewardTotals(old);
    const proposal=P.move(source,{type:kind,...(kind==='raise'?{to:request.to}:{}),...(kind==='deal'?{rewardLevel}:{})},oldRevision);next[KEY]=proposal.state;let xpResult=null;
    if(proposal.completed){const result=sync(host.creditRewards(next,{receipt:proposal.receipt,totals:P.rewardTotals(proposal.state),beforeTotals}),'Strict Poker reward source pairing must be synchronous.');check(result!==false,'The strictFP receipt could not be paired.');xpResult=result??null;}
    authenticate(next);const expected=json(next);fence(c);attempted=true;check(sync(host.write('profile',next),'Strict Poker whole-profile writer must be synchronous.')!==false,'Strict Poker whole-profile write was not confirmed.');fence(c,true,expected);fence(c,true,expected);
    check(sync(host.applyProfile(next,xpResult),'Strict Poker native mirrors must be synchronous.')!==false,'The saved Strict Poker profile could not be applied to native mirrors.');applied=true;
    const after=P.publicState(proposal.state),event={before,after,completed:proposal.completed,receipt:proposal.receipt,xpResult};try{host.render(event)}catch(_){announce('Strict Poker is saved. Reopen the table if its display has not refreshed.')}
    return {ok:true,completed:proposal.completed,state:after,receipt:proposal.receipt,xpResult};
   }catch(error){if(attempted&&!applied)uncertain(error.message);else announce(error.message);return {ok:false,uncertain:attempted&&!applied,reason:error.message}}
   finally{busy=false}
  }
  return Object.freeze({status,action,destroy:()=>{destroyed=true}});
 }
 return Object.freeze({KEY,create});
});
