/* Optional shared friendship ledger. Legacy v1 reads/copies keep their exact
 * capped shape. Only a successful explicit completed-round credit opts into v2.
 * Host must pair all receipt streams with their native game in the same commit;
 * this pure proposal model has no storage, clock, RNG, UI or migration effects. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldFriendship=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const LEGACY_VERSION=1,VERSION=2,DECIMAL_VERSION=3,MAX_LEVEL=15,MAX_COUNT=Number.MAX_SAFE_INTEGER;
 const THRESHOLDS=Object.freeze([100,150,200,250,300,350,400,500,750,1000]);
 // Stage-local costs to ENTER levels2..15. The final100000 is the disclosed
 // default; there is no next-stage requirement at terminal level15.
 const STAGE_COSTS=Object.freeze([100,150,200,250,300,350,400,500,750,2000,5000,10000,50000,100000]);
 const LEVEL_STARTS=Object.freeze(STAGE_COSTS.reduce((out,cost)=>{out.push(out[out.length-1]+cost);return out},[0]));
 const POKER_FP=Object.freeze([0,2,4,5,7,7.5,9,10,12.5,15,25,30,100,105,1000,1005]);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0;
 const pokerCount=n=>count(n)&&!Object.is(n,-0);
 function check(ok,message){if(!ok)throw new Error(message)}
 function fields(value,keys){if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);if(p!==null&&p!==Object.prototype)return false;const names=Reflect.ownKeys(value);if(names.length!==keys.length||!names.every(k=>typeof k==='string'&&keys.includes(k)))return false;return names.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable===true})}
 function roundId(id){return typeof id==='string'&&/^[a-zA-Z0-9:_-]{1,160}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id)}
 function derived(rounds){let level=1,fp=rounds;while(level<10&&fp>=THRESHOLDS[level-1]){fp-=THRESHOLDS[level-1];level++}return {level,fp:Math.min(fp,THRESHOLDS[level-1])}}
 function create(){return {version:LEGACY_VERSION,revision:0,rounds:0,level:1,fp:0,lastRoundId:null}}
 // Keep the preceding validator exact, including retained High-Low IDs which
 // identify completed predictions, not the count of Emerald's correct guesses.
 function validateLegacy(state){try{
  if(!fields(state,['version','revision','rounds','level','fp','lastRoundId'].concat(own(state,'chill')?['chill']:[]))||state.version!==LEGACY_VERSION||!count(state.rounds)||!count(state.revision))return false;
  const c=state.chill;if(own(state,'chill')){if(!fields(c,['baccarat','highlow','lastBaccaratId','lastHighlowId'])||!count(c.baccarat)||!count(c.highlow))return false;if(c.baccarat===0?c.lastBaccaratId!==null:typeof c.lastBaccaratId!=='string'||!/^baccarat:[1-9][0-9]*$/.test(c.lastBaccaratId)||Number(c.lastBaccaratId.slice(9))!==c.baccarat)return false;if(c.highlow===0?c.lastHighlowId!==null:typeof c.lastHighlowId!=='string'||!/^highlow:[1-9][0-9]*$/.test(c.lastHighlowId))return false;}
  const total=state.rounds+(c?c.baccarat+c.highlow:0);if(!count(total)||state.revision!==total)return false;const d=derived(total);return state.level===d.level&&state.fp===d.fp&&(state.rounds===0?state.lastRoundId===null:roundId(state.lastRoundId));
 }catch(_){return false}}
 function validChill(c){
  if(!fields(c,['baccarat','highlow','lastBaccaratId','lastHighlowId'])||!count(c.baccarat)||!count(c.highlow))return false;
  if(c.baccarat===0?c.lastBaccaratId!==null:typeof c.lastBaccaratId!=='string'||!/^baccarat:[1-9][0-9]*$/.test(c.lastBaccaratId)||Number(c.lastBaccaratId.slice(9))!==c.baccarat)return false;
  return c.highlow===0?c.lastHighlowId===null:typeof c.lastHighlowId==='string'&&/^highlow:[1-9][0-9]*$/.test(c.lastHighlowId);
 }
 function validPoker(p){return fields(p,['rounds','pointsHalf','lastRoundId'])&&pokerCount(p.rounds)&&pokerCount(p.pointsHalf)&&BigInt(p.pointsHalf)<=BigInt(p.rounds)*2010n&&(p.rounds===0?p.lastRoundId===null:p.lastRoundId==='poker:'+p.rounds)}
 // Internal integer half-points prevent a large legacy integer plus7.5 from
 // silently rounding. No BigInt enters persisted data or the numeric info API.
 // Integer-only histories above2^52 remain supported up to MAX_SAFE_INTEGER;
 // refuse only when the exact resulting FP cannot be represented as a Number.
 function numericFP(half){
  const fp=Number(half)/2;
  check(fp<=MAX_COUNT&&(Number.isInteger(fp)?BigInt(fp)*2n:BigInt(fp*2))===half,'Friendship FP precision would overflow; no credits were changed.');return fp;
 }
 function milliOfNumber(n){check(typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=MAX_COUNT,'Friendship precision would overflow.');const [whole,fraction='']=String(n).split('.');check(/^\d+$/.test(whole)&&/^\d{0,3}$/.test(fraction),'Friendship precision exceeds thousandths.');return BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0'));}
 function numericMilli(n){const fp=Number(String(n/1000n)+'.'+String(n%1000n).padStart(3,'0'));check(milliOfNumber(fp)===n,'Friendship FP precision would overflow; no credits were changed.');return fp}
 function validExpansion(e){if(!e||typeof e!=='object'||!fields(e,Object.keys(e))||Object.keys(e).length<1||!Object.keys(e).every(k=>['poker','strict','slots'].includes(k)))return false;return Object.values(e).every(v=>fields(v,['sequence','pointsMilli','lastId'])&&pokerCount(v.sequence)&&pokerCount(v.pointsMilli)&&(v.sequence===0?v.pointsMilli===0&&v.lastId===null:roundId(v.lastId)))}
 function rawTotals(s){
  const c=own(s,'chill')?s.chill:null,p=own(s,'poker')?s.poker:null,legacyFP=BigInt(s.rounds)+BigInt(c?c.baccarat:0)+BigInt(c?c.highlow:0);
  check(legacyFP<=BigInt(MAX_COUNT),'Friendship legacy-round counter would overflow.');
  const legacyRoundFP=Number(legacyFP),pokerRounds=p?p.rounds:0,pokerPointsHalf=p?p.pointsHalf:0,totalHalf=legacyFP*2n+BigInt(pokerPointsHalf);
  let totalFP=numericFP(totalHalf),extra=0n,sequences=0n;if(own(s,'expansion')){for(const v of Object.values(s.expansion)){extra+=BigInt(v.pointsMilli);sequences+=BigInt(v.sequence)}totalFP=numericMilli(totalHalf*500n+extra)}
  return {totalLegacyRoundFP:legacyRoundFP,pokerRounds,pokerPointsHalf,totalFP,totalCredits:totalFP,totalFPHalfText:extra?String(totalFP*2):String(totalHalf),...(own(s,'expansion')?{totalFPMilliText:String(totalHalf*500n+extra),expansionSequencesText:String(sequences)}:{})};
 }
 function derivedExpanded(totalFP){let level=1,fp=milliOfNumber(totalFP);while(level<MAX_LEVEL&&fp>=BigInt(STAGE_COSTS[level-1])*1000n){fp-=BigInt(STAGE_COSTS[level-1])*1000n;level++}return {level,fp:numericMilli(fp)};}
 function validateExpanded(s){
  if(!fields(s,['version','revision','rounds','level','fp','lastRoundId'].concat(own(s,'chill')?['chill']:[],own(s,'poker')?['poker']:[],s.version===DECIMAL_VERSION?['expansion']:[]))||![VERSION,DECIMAL_VERSION].includes(s.version)||!count(s.rounds)||!count(s.revision))return false;
  if(own(s,'chill')&&!validChill(s.chill)||own(s,'poker')&&!validPoker(s.poker)||s.version===DECIMAL_VERSION&&!validExpansion(s.expansion))return false;
  const t=rawTotals(s);if(BigInt(s.revision)!==BigInt(t.totalLegacyRoundFP)+BigInt(t.pokerRounds)+BigInt(t.expansionSequencesText||'0'))return false;
  const d=derivedExpanded(t.totalFP);return s.level===d.level&&s.fp===d.fp&&(s.rounds===0?s.lastRoundId===null:roundId(s.lastRoundId));
 }
 function validate(state){try{
  // Inspect the descriptor before reading version: a poisoned discriminator
  // must not execute an accessor merely to choose a schema branch.
  const d=state&&typeof state==='object'?Object.getOwnPropertyDescriptor(state,'version'):null;
  if(!d||!own(d,'value'))return false;return d.value===LEGACY_VERSION?validateLegacy(state):[VERSION,DECIMAL_VERSION].includes(d.value)&&validateExpanded(state);
 }catch(_){return false}}
 function copy(state){check(validate(state),'Emerald friendship save needs attention. No round was credited.');return {version:state.version,revision:state.revision,rounds:state.rounds,level:state.level,fp:state.fp,lastRoundId:state.lastRoundId,...(own(state,'chill')?{chill:{...state.chill}}:{}),...(own(state,'poker')?{poker:{...state.poker}}:{}),...(own(state,'expansion')?{expansion:JSON.parse(JSON.stringify(state.expansion))}:{})}}
 function totals(state=undefined){return rawTotals(state===undefined?create():copy(state))}
 function info(state=undefined){
  const s=state===undefined?create():copy(state);
  if(s.version===LEGACY_VERSION){const required=THRESHOLDS[s.level-1];return {level:s.level,fp:s.fp,required,remaining:required-s.fp,percent:100*s.fp/required,nicenessPercent:100+Math.min(s.revision/10,100),nicenessBonus:Math.min(s.revision/10,100),nicenessMode:'total-credit-v1',totalCredits:s.revision,revision:s.revision,workMs:120000-6000*(s.level-1),capped:s.level===10&&s.fp===1000}}
  const total=rawTotals(s),required=s.level===MAX_LEVEL?0:STAGE_COSTS[s.level-1],bonus=Math.min(total.totalFP/10,100);
  return {level:s.level,fp:s.fp,required,remaining:s.level===MAX_LEVEL?0:required-s.fp,percent:s.level===MAX_LEVEL?100:100*s.fp/required,nicenessPercent:100+bonus,nicenessBonus:bonus,nicenessMode:'total-fp-v2',totalCredits:total.totalCredits,totalFP:total.totalFP,totalFPHalfText:total.totalFPHalfText,revision:s.revision,workMs:120000-6000*(Math.min(s.level,10)-1),capped:s.level===MAX_LEVEL};
 }
 function settled(next){const d=derivedExpanded(rawTotals(next).totalFP);next.level=d.level;next.fp=d.fp;check(validate(next),'Invalid completed-round friendship transition.');return {state:next,changed:true}}
 function completeRound(state,receipt,expectedRevision){
  const next=copy(state);check(count(expectedRevision)&&expectedRevision===next.revision,'Emerald friendship revision changed. Read the current save before crediting a round.');
  check(fields(receipt,['roundId','completedRounds'])&&roundId(receipt.roundId)&&count(receipt.completedRounds),'Invalid native Blackjack round receipt.');
  check(next.rounds<MAX_COUNT&&next.revision<MAX_COUNT,'Emerald friendship completed-round counter would overflow.');check(receipt.completedRounds===next.rounds+1,'Only the next completed Blackjack round can credit friendship.');check(receipt.roundId!==next.lastRoundId,'That Blackjack round was already credited.');
  next.version=Math.max(VERSION,next.version);next.rounds++;next.revision++;next.lastRoundId=receipt.roundId;return settled(next);
 }
 function completeChill(state,game,receipt,expectedRevision){
  const next=copy(state);check(expectedRevision===next.revision&&next.revision<MAX_COUNT,'Friendship revision changed.');
  check(['baccarat','highlow'].includes(game)&&fields(receipt,['roundId','credited'])&&count(receipt.credited)&&roundId(receipt.roundId)&&receipt.roundId.startsWith(game+':'),'Invalid native card-game friendship receipt.');
  const c=next.chill||{baccarat:0,highlow:0,lastBaccaratId:null,lastHighlowId:null},last=game==='baccarat'?'lastBaccaratId':'lastHighlowId';
  check(receipt.credited===c[game]+1&&receipt.roundId!==c[last],'That card-game reward is not the next receipt.');c[game]++;c[last]=receipt.roundId;next.chill=c;next.version=Math.max(VERSION,next.version);next.revision++;return settled(next);
 }
 function completePoker(state,receipt,expectedRevision){
  const next=copy(state);check(count(expectedRevision)&&expectedRevision===next.revision,'Friendship Poker revision changed.');
  check(fields(receipt,['roundId','completedRounds','fp'])&&pokerCount(receipt.completedRounds)&&receipt.roundId==='poker:'+receipt.completedRounds&&typeof receipt.fp==='number'&&!Object.is(receipt.fp,-0)&&POKER_FP.includes(receipt.fp),'Invalid native Poker friendship receipt.');
  const p=next.poker||{rounds:0,pointsHalf:0,lastRoundId:null};
  check(p.rounds<MAX_COUNT&&next.revision<MAX_COUNT&&p.pointsHalf<=MAX_COUNT-receipt.fp*2,'Friendship Poker counter or half-point total would overflow.');
  check(receipt.completedRounds===p.rounds+1&&receipt.roundId!==p.lastRoundId,'Only the next completed Poker round can settle friendship.');
  p.pointsHalf+=receipt.fp*2;p.rounds++;p.lastRoundId=receipt.roundId;next.poker=p;next.revision++;next.version=Math.max(VERSION,next.version);return settled(next);
 }
 function completeExpansion(state,source,receipt,expectedRevision){const next=copy(state);check(['poker','strict','slots'].includes(source)&&count(expectedRevision)&&expectedRevision===next.revision&&next.revision<MAX_COUNT,'Expansion friendship source or revision changed.');check(fields(receipt,['id','sequence','pointsMilli'])&&roundId(receipt.id)&&pokerCount(receipt.sequence)&&pokerCount(receipt.pointsMilli),'Invalid exact-decimal friendship receipt.');const e=next.expansion||{},previous=e[source]||{sequence:0,pointsMilli:0,lastId:null};check(receipt.sequence===previous.sequence+1&&receipt.id!==previous.lastId&&previous.pointsMilli<=MAX_COUNT-receipt.pointsMilli,'Expansion friendship receipt was replayed or overflowed.');e[source]={sequence:receipt.sequence,pointsMilli:previous.pointsMilli+receipt.pointsMilli,lastId:receipt.id};next.expansion=e;next.version=DECIMAL_VERSION;next.revision++;return settled(next)}
 return Object.freeze({LEGACY_VERSION,VERSION,DECIMAL_VERSION,MAX_LEVEL,STAGE_COSTS,LEVEL_STARTS,create,validate,copy,info,totals,completeRound,completeChill,completePoker,completeExpansion});
});
