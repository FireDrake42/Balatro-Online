/* Pure optional PROFILE friendship ledger. No load-time defaults or writes.
 * The app owns E5 visibility, E10 eligibility, native Blackjack completion and
 * guarded durable commit. Each receipt must be the next native credited round;
 * the model never treats a preview, reload or arbitrary UI action as completion.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldFriendship=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const VERSION=1,MAX_COUNT=Number.MAX_SAFE_INTEGER,THRESHOLDS=Object.freeze([100,150,200,250,300,350,400,500,750,1000]);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0;
 function check(ok,message){if(!ok)throw new Error(message)}
 function fields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const p=Object.getPrototypeOf(value);if(p!==null&&p!==Object.prototype)return false;
  const names=Reflect.ownKeys(value);if(names.length!==keys.length||!names.every(k=>typeof k==='string'&&keys.includes(k)))return false;
  return names.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable===true});
 }
 function roundId(id){return typeof id==='string'&&/^[a-zA-Z0-9:_-]{1,160}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id)}
 function derived(rounds){let level=1,fp=rounds;while(level<10&&fp>=THRESHOLDS[level-1]){fp-=THRESHOLDS[level-1];level++}return {level,fp:Math.min(fp,THRESHOLDS[level-1])}}
 function create(){return {version:VERSION,revision:0,rounds:0,level:1,fp:0,lastRoundId:null}}
 function validate(state){try{
  if(!fields(state,['version','revision','rounds','level','fp','lastRoundId'])||state.version!==VERSION||!count(state.rounds)||!count(state.revision)||state.revision!==state.rounds)return false;
  const d=derived(state.rounds);return state.level===d.level&&state.fp===d.fp&&(state.rounds===0?state.lastRoundId===null:roundId(state.lastRoundId));
 }catch(_){return false}}
 function copy(state){check(validate(state),'Emerald friendship save needs attention. No round was credited.');return {version:VERSION,revision:state.revision,rounds:state.rounds,level:state.level,fp:state.fp,lastRoundId:state.lastRoundId}}
 function info(state=undefined){
  const s=state===undefined?create():copy(state),required=THRESHOLDS[s.level-1];
  return {level:s.level,fp:s.fp,required,remaining:required-s.fp,percent:100*s.fp/required,nicenessPercent:s.fp/10,workMs:120000-6000*(s.level-1),capped:s.level===10&&s.fp===1000};
 }
 function completeRound(state,receipt,expectedRevision){
  const next=copy(state);check(count(expectedRevision)&&expectedRevision===next.revision,'Emerald friendship revision changed. Read the current save before crediting a round.');
  check(fields(receipt,['roundId','completedRounds'])&&roundId(receipt.roundId)&&count(receipt.completedRounds),'Invalid native Blackjack round receipt.');
  check(next.rounds<MAX_COUNT,'Emerald friendship completed-round counter would overflow.');
  check(receipt.completedRounds===next.rounds+1,'Only the next completed Blackjack round can credit friendship.');
  check(receipt.roundId!==next.lastRoundId,'That Blackjack round was already credited.');
  next.rounds++;next.revision++;next.lastRoundId=receipt.roundId;const d=derived(next.rounds);next.level=d.level;next.fp=d.fp;
  return {state:next,changed:true};
 }
 return Object.freeze({create,validate,copy,info,completeRound});
});
