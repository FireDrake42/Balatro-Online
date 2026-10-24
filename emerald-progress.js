/* Pure Emerald progression proposals. No storage, clock, DOM or game RNG.
 * Optional profile.emerald is per save-slot profile. Absence is NOT historical
 * credit. Only the caller's actual new completed-GAME action may create a win
 * receipt; loading an old won run, blind wins and endless never create one.
 * Every mutation returns a NEW state after strict revision/CAS validation. The
 * parent must durably save/read back the whole action before applying it live.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldProgress=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 // Keep the v1 historical receipt capacity; the final milestone is only 100.
 const VERSION=1,UNLOCK_LEVEL=10,MAX_WINS=415,SPEECH_COOLDOWN_MS=10000,MAX_TIME=8640000000000000;
 const NEXT_WINS=Object.freeze([10,15,25,30,40,50,65,80,100]);
 const CUMULATIVE_WINS=NEXT_WINS;
 const FACTS=Object.freeze(['My favourite number is 6.','I love greenery and green places.','I like fictional casino scratch tickets in this game — not real-money gambling.']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function check(ok,message){if(!ok)throw new Error(message)}
 function fields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const p=Object.getPrototypeOf(value);if(p!==null&&p!==Object.prototype)return false;
  const names=Reflect.ownKeys(value);if(names.length!==keys.length||!names.every(k=>typeof k==='string'&&keys.includes(k)))return false;
  return names.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable===true});
 }
 function array(value,max){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max)return false;
  const keys=Reflect.ownKeys(value);if(keys.length!==value.length+1||!keys.includes('length'))return false;
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!own(d,'value')||d.enumerable!==true)return false}
  return true;
 }
 function count(n){return Number.isSafeInteger(n)&&n>=0}
 function timestamp(n){return count(n)&&n<=MAX_TIME}
 function seed(n){return Number.isInteger(n)&&n>0&&n<=4294967295}
 function validRunId(id){return typeof id==='string'&&/^[a-zA-Z0-9:_-]{1,160}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id)}
 function unlocked(actualLevel){return Number.isInteger(actualLevel)&&actualLevel>=UNLOCK_LEVEL&&actualLevel<=100}
 function validate(state){try{
  if(!fields(state,['version','revision','winRunIds','speech'])||state.version!==VERSION||!count(state.revision)||!array(state.winRunIds,MAX_WINS)||!state.winRunIds.every(validRunId)||new Set(state.winRunIds).size!==state.winRunIds.length)return false;
  const s=state.speech;
  return fields(s,['sequence','lastAt','rng'])&&count(s.sequence)&&s.sequence<=Number.MAX_SAFE_INTEGER-MAX_WINS&&timestamp(s.lastAt)&&(s.sequence!==0||s.lastAt===0)&&s.lastAt>=Math.max(0,s.sequence-1)*SPEECH_COOLDOWN_MS&&seed(s.rng)&&state.revision===state.winRunIds.length+s.sequence;
 }catch(_){return false}}
 function copy(state){check(validate(state),'Emerald progress save needs attention. Nothing was credited.');return {version:VERSION,revision:state.revision,winRunIds:state.winRunIds.slice(),speech:{sequence:state.speech.sequence,lastAt:state.speech.lastAt,rng:state.speech.rng}}}
 function create(rng=1831565813){check(seed(rng),'Choose a separate nonzero uint32 Emerald speech seed.');return {version:VERSION,revision:0,winRunIds:[],speech:{sequence:0,lastAt:0,rng}}}
 function cas(state,revision){const s=copy(state);check(count(revision)&&revision===s.revision,'Emerald revision changed. Read the current save before retrying.');return s}
 function progress(state,actualLevel){
  const s=copy(state),total=s.winRunIds.length,enabled=unlocked(actualLevel);let level=1;
  while(level<=CUMULATIVE_WINS.length&&total>=CUMULATIVE_WINS[level-1])level++;
  const max=level===10;
  return {unlocked:enabled,level:enabled?level:0,totalWins:total,wins:enabled?total:0,nextWins:enabled&&!max?CUMULATIVE_WINS[level-1]:null,nextLevel:enabled&&!max?level+1:null,cumulativeForNext:enabled&&!max?CUMULATIVE_WINS[level-1]:null,bar:!enabled?'Locked':max?'MAX':total+'/'+CUMULATIVE_WINS[level-1],max:enabled&&max};
 }
 function capabilities(state,actualLevel){const l=progress(state,actualLevel).level;return {level:l,facts:l>=2,photoScale:l>=3?1.2:1,movementSpeed:l>=3?1.2:1,speedGift:l>=4,greenAura:l>=5,eventCommentary:l>=6,welcome:l>=7,adviceRichness:l>=8?1.2:1,workshop:l>=9,workshopRankGain:l>=10?3:l>=9?1:0}}
 function creditWin(state,receipt,expectedRevision){
  const next=cas(state,expectedRevision);
  check(fields(receipt,['runId','actualLevel','beforePhase','afterPhase','endless','abandoned','source'])&&validRunId(receipt.runId)&&unlocked(receipt.actualLevel)&&['play','cashout'].includes(receipt.beforePhase)&&receipt.afterPhase==='won'&&receipt.endless===false&&receipt.abandoned===false&&receipt.source==='fresh-completion','Only a fresh completed GAME win at actual profile Level 10+ can credit Emerald.');
  if(next.winRunIds.includes(receipt.runId))return {state:next,changed:false,reason:'duplicate'};
  if(next.winRunIds.length>=CUMULATIVE_WINS[CUMULATIVE_WINS.length-1])return {state:next,changed:false,reason:'max'};
  check(next.revision<Number.MAX_SAFE_INTEGER,'Emerald revision overflow.');next.winRunIds.push(receipt.runId);next.revision++;
  return {state:next,changed:true,reason:'credited'};
 }
 function stepRng(value){let x=value>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}
 // Xorshift is linear over GF(2): jump in O(log steps), without a replay loop.
 function applyMatrix(matrix,value){let out=0,v=value>>>0;for(let i=0;i<32;i++){if(v&1)out^=matrix[i];v>>>=1}return out>>>0}
 function advanceRng(value,steps){let matrix=Array.from({length:32},(_,i)=>stepRng((1<<i)>>>0)),v=value;while(steps>0){if(steps%2===1)v=applyMatrix(matrix,v);steps=Math.floor(steps/2);if(steps>0)matrix=matrix.map(x=>applyMatrix(matrix,x))}return v}
 function giftForRoll(roll){check(typeof roll==='number'&&Number.isFinite(roll)&&roll>=0&&roll<1,'Choose an Emerald roll in [0,1).');return roll<.01}
 function recordSpeech(state,event,expectedRevision){
  const next=cas(state,expectedRevision);
  check(fields(event,['runId','actualLevel','source','sequence','at','inventoryFree'])&&validRunId(event.runId)&&event.source==='automatic'&&typeof event.inventoryFree==='boolean','Only a genuine guarded automatic speech may roll a Speed gift.');
  check(capabilities(next,event.actualLevel).speedGift,'Emerald Speed gifts unlock at Emerald Level 4 and actual profile Level 10+.');
  check(count(event.sequence)&&event.sequence===next.speech.sequence+1&&event.sequence<=Number.MAX_SAFE_INTEGER-MAX_WINS,'Emerald speech sequence changed or overflowed.');
  check(timestamp(event.at)&&(next.speech.sequence===0||event.at-next.speech.lastAt>=SPEECH_COOLDOWN_MS),'Emerald automatic speech cooldown or timestamp is invalid.');
  check(next.revision<Number.MAX_SAFE_INTEGER,'Emerald revision overflow.');next.speech.rng=stepRng(next.speech.rng);next.speech.sequence=event.sequence;next.speech.lastAt=event.at;next.revision++;
  const roll=next.speech.rng/4294967296,rolled=giftForRoll(roll),granted=rolled&&event.inventoryFree;
  return {state:next,changed:true,giftResult:{roll,rolled,granted,potionId:granted?'speed':null,nonce:rolled?'emerald-speed:'+event.sequence+':'+event.runId:null,reason:rolled?(granted?'granted':'full'):'no-gift'}};
 }
 function recover(profileState,runMirror){
  check(profileState!==undefined||runMirror!==undefined,'No Emerald progress exists to recover.');
  if(profileState===undefined)return copy(runMirror);if(runMirror===undefined)return copy(profileState);
  const a=copy(profileState),b=copy(runMirror);if(a.revision===b.revision){check(JSON.stringify(a)===JSON.stringify(b),'Divergent Emerald states at the same revision. No replay was attempted.');return a}
  const low=a.revision<b.revision?a:b,high=a.revision<b.revision?b:a;
  check(low.winRunIds.length<=high.winRunIds.length&&low.winRunIds.every((id,i)=>high.winRunIds[i]===id)&&low.speech.sequence<=high.speech.sequence,'Divergent Emerald receipt history. No replay was attempted.');
  const delta=high.speech.sequence-low.speech.sequence;
  check(high.speech.rng===advanceRng(low.speech.rng,delta)&&(delta===0?high.speech.lastAt===low.speech.lastAt:high.speech.lastAt-low.speech.lastAt>=Math.max(0,delta-(low.speech.sequence===0?1:0))*SPEECH_COOLDOWN_MS),'Divergent Emerald speech history. No replay was attempted.');
  return high;
 }
 return Object.freeze({VERSION,UNLOCK_LEVEL,MAX_WINS,MAX_TIME,SPEECH_COOLDOWN_MS,NEXT_WINS,CUMULATIVE_WINS,FACTS,validRunId,unlocked,validate,copy,create,progress,capabilities,creditWin,giftForRoll,recordSpeech,recover});
});
