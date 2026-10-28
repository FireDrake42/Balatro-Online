/* Guarded app integration helpers. No timers, DOM, storage or game RNG here.
 * Call recovery only during boot, mirrors only during saves, afterAction only
 * after an actual native action, and speech only inside a durable PROFILE commit.
 */
(function(root,factory){'use strict';const node=typeof module==='object'&&module.exports;const api=factory(node?require('./frenzy'):root.BOFrenzy,node?require('./emerald-progress'):root.BOEmeraldProgress,node?require('./emerald-workshop'):root.BOEmeraldWorkshop,node?require('./potions'):root.BOPotions);if(node)module.exports=api;else root.BOEmeraldRuntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(F,P,W,PT){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k),clone=x=>JSON.parse(JSON.stringify(x));
 function check(ok,message){if(!ok)throw Error(message)}
 function seed(text){let n=2166136261;for(const c of String(text)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return (n>>>0)||1831565813}
 function progress(profile,actualLevel){return P.progress(own(profile,'emerald')?profile.emerald:P.create(),actualLevel)}
 function capabilities(profile,actualLevel){return P.capabilities(own(profile,'emerald')?profile.emerald:P.create(),actualLevel)}
 function workshopInfo(run,now){check(Number.isSafeInteger(now)&&now>=0&&now<=W.MAX_TIME,'Invalid workshop clock.');const s=own(run,'emeraldWorkshop')?W.copy(run.emeraldWorkshop):W.create(run._uiId);check(s.runId===run._uiId,'Workshop belongs to another run.');const j=s.job;return {busy:!!j,silent:!!j&&now<j.completedAt,ready:!!j&&now>=j.completedAt,jobId:j?j.id:null,workRemainingMs:j?Math.max(0,j.completedAt-now):0,cooldownRemainingMs:Math.max(0,s.availableAt-now),nextGiveAt:s.availableAt}}
 function recoverFrenzy(a,b){
  if(a===undefined&&b===undefined)return undefined;
  if(a===undefined)return F.normalize(b);if(b===undefined)return F.normalize(a);
  const x=F.normalize(a),y=F.normalize(b);
  if(x.revision===y.revision){check(JSON.stringify(x)===JSON.stringify(y),'Divergent Frenzy states. Keep your save and reload safely.');return x}
  const low=x.revision<y.revision?x:y,high=x.revision<y.revision?y:x;
  check(high.lastNow>=low.lastNow,'Frenzy history moved backwards. Keep your save and reload safely.');return high;
 }
 function recover(profile,run){
  if(own(profile,'emerald'))P.copy(profile.emerald);
  if(own(profile,'frenzy'))F.normalize(profile.frenzy);
  if(own(run,'frenzy'))F.normalize(run.frenzy);
  if(own(run,'_emeraldProfile'))P.copy(run._emeraldProfile);
  if(own(run,'emeraldWorkshop'))check(W.validateRun(run),'Emerald workshop save needs attention. No default deck was loaded.');
  if(own(profile,'emerald')||own(run,'_emeraldProfile'))profile.emerald=P.recover(profile.emerald,run?._emeraldProfile);
  const f=recoverFrenzy(profile.frenzy,run?.frenzy);if(f!==undefined)profile.frenzy=f;
 }
 function mirror(profile,run){
  if(!run)return;
  const f=recoverFrenzy(profile.frenzy,run.frenzy);if(f!==undefined){profile.frenzy=f;run.frenzy=F.normalize(f)}
  if(own(profile,'emerald'))run._emeraldProfile=P.copy(profile.emerald);
 }
 function seedRun(profile,run){if(own(profile,'frenzy'))run.frenzy=F.normalize(profile.frenzy)}
 function capture(run,actualLevel,effect,handNames){return {...(handNames?{handNames:Object.fromEntries(Object.entries(handNames).map(([k,v])=>[k,v[0]]))}:{}),run,id:run?._uiId,phase:run?.phase,ante:run?.ante,blindIndex:run?.blindIndex,endless:run?.endless===true,abandoned:run?.abandoned===true,outcome:!!run?._uiOutcome,actualLevel,effect,jokers:(run?.jokers||[]).map(j=>({uid:j.uid,id:j.id,eternal:j.eternal===true})),levels:clone(run?.levels||{})}}
 function winOptions(context){
  if(context===undefined)return undefined;
  check(context&&typeof context==='object'&&!Array.isArray(context)&&[null,Object.prototype].includes(Object.getPrototypeOf(context)),'Invalid Emerald action context.');
  const keys=Reflect.ownKeys(context),d=Object.getOwnPropertyDescriptor(context,'emeraldWinMultiplier');
  check(keys.length===1&&keys[0]==='emeraldWinMultiplier'&&d&&own(d,'value')&&d.enumerable===true&&(d.value===1||d.value===2),'Supply only an Emerald win multiplier of 1 or 2.');return {winMultiplier:d.value};
 }
 // Optional context is an explicit host snapshot, not a clock/Slots lookup.
 function afterAction(profile,run,before,context){
  const messages=[];if(!before||before.run!==run||before.id!==run?._uiId)return messages;
  // The engine completes a GAME at final cashout, never at a blind/old won load.
  if(before.effect==='cashout'&&before.phase==='cashout'&&before.ante===8&&before.blindIndex===2&&!before.endless&&!before.abandoned&&!before.outcome&&P.unlocked(before.actualLevel)&&run.phase==='won'&&run.abandoned!==true&&!run.endless){
   const options=winOptions(context),d=Object.getOwnPropertyDescriptor(profile,'emerald');
   check(!d||own(d,'value')&&d.enumerable===true,'Emerald progress must be an enumerable data field.');
   const state=d?P.copy(d.value):P.create(seed(run._uiId));
   profile.emerald=P.creditWin(state,{runId:run._uiId,actualLevel:before.actualLevel,beforePhase:'cashout',afterPhase:'won',endless:false,abandoned:false,source:'fresh-completion'},state.revision,options).state;
  }
  if(before.actualLevel>=5)for(const [key,n]of Object.entries(run.levels||{})){if(![10,20,30,40,50].includes(n)||before.levels[key]===n)continue;const name=before.handNames?.[key]||key;const message=n===10?'Your poker hand is level 10. Nice.':n===20?'Your '+name+' is level 20!? WOW!!!':n===30?'Your poker hand is level 30, but how!?!?':n===40?'LEVEL 40!!! YOURE UNSTOPPABLE!!!!!':'LEVEL 50!! The legendary poker hand!!!';messages.push({message,handKey:key,handLevel:n})}
  if(before.effect!=='play'||!capabilities(profile,before.actualLevel).eventCommentary)return messages;
  const lines=run.lastResult?.lines||[];
  if(lines.includes('Lucky +20 Mult'))messages.push('Lucky landed +20 Mult! That reward really triggered.');
  if(lines.includes('Lucky: +$20'))messages.push('Lucky paid +$20 into your run’s Bank!');
  if(lines.some(l=>typeof l==='string'&&/Space Joker.*: level up$/.test(l))&&run.lastResult?.key&&(run.levels[run.lastResult.key]||0)>(before.levels[run.lastResult.key]||0))messages.push('Space Joker upgraded '+(run.lastResult.name||'your poker hand')+'!');
  if(['cashout','won'].includes(run.phase))for(const j of before.jokers)if(['gros_michel','cavendish'].includes(j.id)&&!j.eternal&&!run.jokers.some(x=>x.uid===j.uid))messages.push(j.id==='gros_michel'?'Your Gros Michel banana broke after the round. Cavendish can now appear.':'Your Cavendish banana broke after the round.');
  return messages;
 }
 function speech(profile,run,actualLevel,now){
  check(run&&P.validRunId(run._uiId),'Choose the active origin run before Emerald speaks.');
  const current=profile.emerald;check(P.validate(current),'Emerald progress needs attention.');
  const pt=PT.normalize(profile.potions);check(!pt.blockedReason,pt.blockedReason||'Potion inventory needs attention.');
  const change=P.recordSpeech(current,{runId:run._uiId,actualLevel,source:'automatic',sequence:current.speech.sequence+1,at:now,inventoryFree:pt.inventory.length<PT.capacity(actualLevel)},current.revision),next=clone(profile);next.emerald=change.state;
  if(change.giftResult.granted){const drop=PT.receiveDrop(pt,'speed',change.giftResult.nonce,now,actualLevel);check(drop.received,'The Speed gift could not be stored. No speech roll was committed.');next.potions=drop.state}
  return {profile:next,gift:change.giftResult};
 }
 function rolls(run,cardId){
  // Dedicated deterministic workshop dice: reopening/retrying cannot reroll the
  // same offered card/sequence, and hidden draw order/game RNG are never read.
  let x=seed(run._uiId+':emerald-workshop:'+((run.emeraldWorkshop?.sequence||0)+1)+':'+String(cardId));
  return Array.from({length:4},()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296});
 }
 return Object.freeze({seed,progress,capabilities,workshopInfo,recoverFrenzy,recover,mirror,seedRun,capture,afterAction,speech,rolls});
});
