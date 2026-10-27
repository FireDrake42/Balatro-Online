/* Independent pure Poker proposals. The durable controller owns availability,
 * shared player XP/friendship, currencies, event activation and exactly-once
 * commits. No external entropy, clocks, storage or host callbacks. Public views
 * project visible descriptors only: never read/replay private RNG or deck order.
 * Full validate/copy/move replay the seed, target, held positions and receipt.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldPoker=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const VERSION=1,MAX=Number.MAX_SAFE_INTEGER,UINT=4294967296;
 const SUITS=Object.freeze(['S','H','D','C']),SYMBOLS=Object.freeze(['♠','♥','♦','♣']);
 const STATE_FIELDS=['version','revision','roundCounter','completedRounds','totalPXP','results','matchedTargets','rng','phase','round'];
 const ROUND_FIELDS=['id','deckSeed','targetSeed','startRevision','pxpBefore','deck','cursor','target','hand','held','result','receipt'];
 const REWARD_FIELDS=['xp','fp','medals','coins','faucetClaims','pxp'];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0);
 const seed=n=>Number.isInteger(n)&&n>0&&n<UINT;
 const validCard=n=>Number.isInteger(n)&&n>=0&&n<52&&!Object.is(n,-0);
 function check(ok,message){if(!ok)throw new Error(message)}
 function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const key of Object.keys(value))freeze(value[key]);Object.freeze(value)}return value}
 function shape(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))return false;const names=Reflect.ownKeys(value);return names.length===keys.length&&names.every(k=>typeof k==='string'&&keys.includes(k))}
 function data(value,key){const d=Object.getOwnPropertyDescriptor(value,key);check(d&&own(d,'value')&&d.enumerable===true,'Poker requires plain enumerable data fields.');return d.value}
 function fields(value,keys){if(!shape(value,keys))return false;return keys.every(k=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable===true})}
 function array(value,max){if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max)return false;const keys=Reflect.ownKeys(value);if(keys.length!==value.length+1||!keys.includes('length'))return false;for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!own(d,'value')||d.enumerable!==true)return false}return true}
 function cardIds(value,length){return array(value,length)&&value.length===length&&value.every(validCard)&&new Set(value).size===length}
 function sameArray(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i])}
 // Expected trees are generated internally. Validate every actual descriptor
 // before reading its value; no user toJSON/getter/prototype method is called.
 function sameData(expected,actual){if(expected===null||typeof expected!=='object')return Object.is(expected,actual);if(Array.isArray(expected))return array(actual,expected.length)&&actual.length===expected.length&&expected.every((v,i)=>sameData(v,actual[i]));const keys=Object.keys(expected);return fields(actual,keys)&&keys.every(k=>sameData(expected[k],actual[k]))}
 const CATEGORIES=freeze([
  {id:'royal-flush',name:'Royal Flush',strength:10},{id:'straight-flush',name:'Straight Flush',strength:9},
  {id:'four-of-a-kind',name:'Four of a Kind',strength:8},{id:'full-house',name:'Full House',strength:7},
  {id:'flush',name:'Flush',strength:6},{id:'straight',name:'Straight',strength:5},
  {id:'three-of-a-kind',name:'Three of a Kind',strength:4},{id:'two-pair',name:'Two Pair',strength:3},
  {id:'one-pair',name:'One Pair',strength:2},{id:'high-card',name:'High Card (10+)',strength:1}
 ]);
 const NONE=freeze({id:'none',name:'No Winning Hand',strength:0});
 const CATEGORY_MAP=freeze(Object.fromEntries(CATEGORIES.concat([NONE]).map(c=>[c.id,c])));
 const RESULT_IDS=Object.freeze(CATEGORIES.map(c=>c.id).concat(['none']));
 const category=id=>typeof id==='string'&&own(CATEGORY_MAP,id);
 const target=id=>category(id)&&id!=='none';
 function base(xp,fp,medals,coins,faucetClaims,pxp,event,durationMs){return {xp,fp,medals,coins,faucetClaims,pxp,events:event?[{id:event,durationMs}]:[]}}
 const PAYOUTS=freeze({
  'royal-flush':base(100000,1000,1000,1000,100,1000,'zero-cooldowns',604800000),
  'straight-flush':base(10000,100,100,100,0,500,'double-faucet',86400000),
  'four-of-a-kind':base(2500,25,25,25,0,100,'double-score',3600000),
  'full-house':base(1000,10,10,10,0,75,'double-xp',1800000),
  flush:base(750,7.5,5,5,0,50),straight:base(500,5,3,3,0,20),
  'three-of-a-kind':base(400,4,2,2,0,10),'two-pair':base(200,2,1,1,0,5),
  'one-pair':base(50,0,0,0,0,3),'high-card':base(25,0,0,0,0,1),none:base(0,0,0,0,0,0)
 });
 const LEVEL_THRESHOLDS=Object.freeze([0,100,1000,2000,3000,4000,5000,7000,9000,...Array.from({length:25},(_,i)=>11000+2000*i),80000,100000,150000,200000,250000,300000]);
 function available(ownLevel){return Number.isInteger(ownLevel)&&ownLevel>=5&&ownLevel<=10}
 function levelInfo(totalPXP){check(count(totalPXP),'Poker PXP must be a nonnegative safe integer.');let index=0;while(index<39&&totalPXP>=LEVEL_THRESHOLDS[index+1])index++;const max=index===39,floor=LEVEL_THRESHOLDS[index],next=max?null:LEVEL_THRESHOLDS[index+1],required=max?0:next-floor,progress=max?0:totalPXP-floor;return freeze({level:index+1,totalPXP,floor,next,progress,required,remaining:max?0:required-progress,percent:max?100:100*progress/required,multiplier:1+index*.01,max})}
 function card(id){check(validCard(id),'Invalid Poker card ID.');const rank=id%13+2,suitIndex=Math.floor(id/13);return freeze({id,rank,suit:SUITS[suitIndex],name:(rank===14?'A':rank===13?'K':rank===12?'Q':rank===11?'J':String(rank))+SYMBOLS[suitIndex]})}
 function evaluation(cards){
  const counts=new Array(15).fill(0),ranks=[],pairs=[];let flush=true,three=0,four=0;
  const suit=Math.floor(cards[0]/13);for(const id of cards){counts[id%13+2]++;if(Math.floor(id/13)!==suit)flush=false}
  for(let r=14;r>=2;r--)if(counts[r]){ranks.push(r);if(counts[r]===2)pairs.push(r);else if(counts[r]===3)three=r;else if(counts[r]===4)four=r}
  let straight=0;if(ranks.length===5){if(ranks[0]-ranks[4]===4)straight=ranks[0];else if(ranks[0]===14&&ranks[1]===5&&ranks[2]===4&&ranks[3]===3&&ranks[4]===2)straight=5}
  let id,tiebreak,contributes;
  if(flush&&straight){id=straight===14?'royal-flush':'straight-flush';tiebreak=[straight];contributes=()=>true}
  else if(four){id='four-of-a-kind';tiebreak=[four,...ranks.filter(r=>r!==four)];contributes=r=>r===four}
  else if(three&&pairs.length){id='full-house';tiebreak=[three,pairs[0]];contributes=()=>true}
  else if(flush){id='flush';tiebreak=ranks;contributes=()=>true}
  else if(straight){id='straight';tiebreak=[straight];contributes=()=>true}
  else if(three){id='three-of-a-kind';tiebreak=[three,...ranks.filter(r=>r!==three)];contributes=r=>r===three}
  else if(pairs.length===2){id='two-pair';tiebreak=[...pairs,...ranks.filter(r=>!pairs.includes(r))];contributes=r=>pairs.includes(r)}
  else if(pairs.length===1){id='one-pair';tiebreak=[pairs[0],...ranks.filter(r=>r!==pairs[0])];contributes=r=>r===pairs[0]}
  else if(ranks[0]>=10){id='high-card';tiebreak=ranks;contributes=r=>r===ranks[0]}
  else{id='none';tiebreak=ranks;contributes=()=>false}
  const highlight=[];for(let i=0;i<5;i++)if(contributes(cards[i]%13+2))highlight.push(i);
  const c=CATEGORY_MAP[id];return {category:id,name:c.name,strength:c.strength,highlight,tiebreak};
 }
 function evaluate(cards){check(cardIds(cards,5),'Poker requires exactly five unique plain card IDs.');return freeze(evaluation(cards))}
 function payout(categoryId,targetId){
  const p=PAYOUTS[categoryId],matchedTarget=categoryId===targetId,baseRewards={},targetBonus={},rewards={};
  for(const key of REWARD_FIELDS){baseRewards[key]=p[key];targetBonus[key]=matchedTarget?(key==='xp'?100:key==='fp'?5:0):0;rewards[key]=baseRewards[key]+targetBonus[key]}
  return {baseRewards,targetBonus,rewards,events:p.events.map(e=>({...e})),matchedTarget};
 }
 function payoutFor(categoryId,targetId){check(category(categoryId)&&target(targetId),'Choose valid Poker hand and target IDs.');return freeze(payout(categoryId,targetId))}
 function safeAdd(a,b){const sum=a+b;check(count(sum),'Poker lifetime counters or rewards would overflow.');return sum}
 function ledger(results,matchedTargets){
  check(fields(results,RESULT_IDS)&&count(matchedTargets),'Invalid Poker results ledger.');
  const totals={xp:0,fpHalf:0,medals:0,coins:0,faucetClaims:0,pxp:0};let rounds=0;
  for(const id of RESULT_IDS){const n=results[id];check(count(n),'Invalid Poker result count.');rounds=safeAdd(rounds,n);const p=PAYOUTS[id];for(const key of Object.keys(totals)){const unit=key==='fpHalf'?p.fp*2:p[key],product=n*unit;check(count(product),'Poker lifetime rewards would overflow.');totals[key]=safeAdd(totals[key],product)}}
  check(matchedTargets<=rounds-results.none,'Poker target count exceeds qualifying completed hands.');totals.xp=safeAdd(totals.xp,matchedTargets*100);totals.fpHalf=safeAdd(totals.fpHalf,matchedTargets*10);return {rounds,totals};
 }
 function random(n){let x=n>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}
 function targetSeedFor(n){let x=(n^0x9e3779b9)>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b)>>>0;x=Math.imul(x^(x>>>13),0xc2b2ae35)>>>0;x=(x^(x>>>16))>>>0;return x||0x6d2b79f5}
 // Nonzero xorshift32 has word domain 1..UINT-1, never zero. Accept a whole
 // number of size-wide blocks, inclusive, then zero-base the accepted word.
 // Equal accepted-word residues, not an impossible exact all-seed-count claim.
 // Deck and target use separate streams; target never examines/searches cards.
 function choose(n,size){const limit=Math.floor((UINT-1)/size)*size;let word;do{n=random(n);word=n}while(word>limit);return {index:(word-1)%size,rng:n}}
 function shuffled(n){const deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const roll=choose(n,i+1);n=roll.rng;[deck[i],deck[roll.index]]=[deck[roll.index],deck[i]]}return {deck,rng:n}}
 function chosen(n){const roll=choose(n,10);return {target:CATEGORIES[roll.index].id,rng:roll.rng}}
 function receiptFor(s,r,result){const p=payout(result.category,r.target);return {version:VERSION,roundId:r.id,serial:s.roundCounter,revision:s.revision,completedRounds:s.completedRounds,hand:r.hand.slice(),category:result.category,target:r.target,matchedTarget:p.matchedTarget,baseRewards:p.baseRewards,targetBonus:p.targetBonus,rewards:p.rewards,events:p.events}}
 function visibleHeader(s){
  check(s.version===VERSION&&[s.revision,s.roundCounter,s.completedRounds,s.totalPXP,s.matchedTargets].every(count)&&['idle','holding','settled'].includes(s.phase),'Invalid Poker table fields.');
  const l=ledger(s.results,s.matchedTargets);check(l.rounds===s.completedRounds&&l.totals.pxp===s.totalPXP&&s.completedRounds<=Math.floor(s.revision/2),'Poker ledger and round counters disagree.');
  if(s.phase==='idle')check(s.round===null&&s.revision===0&&s.roundCounter===0&&s.completedRounds===0,'Invalid idle Poker table.');
  else check(s.roundCounter>0&&(s.phase==='holding'?s.completedRounds<MAX&&s.roundCounter===s.completedRounds+1:s.roundCounter===s.completedRounds),'Poker phase and completed rounds disagree.');
  return l;
 }
 function precedingLedger(s,result,matched){const results={...s.results};check(results[result.category]>0&&s.matchedTargets>=Number(matched),'Poker current receipt is missing from its ledger.');results[result.category]--;const l=ledger(results,s.matchedTargets-Number(matched));check(l.rounds===s.completedRounds-1,'Poker preceding ledger disagrees.');return l}
 function validate(s){try{
  if(!fields(s,STATE_FIELDS)||!fields(s.rng,['deck','target'])||!seed(s.rng.deck)||!seed(s.rng.target))return false;
  visibleHeader(s);if(s.phase==='idle')return s.rng.target===targetSeedFor(s.rng.deck);
  const r=s.round,settled=s.phase==='settled';
  if(!fields(r,ROUND_FIELDS)||r.id!=='poker:'+s.roundCounter||!seed(r.deckSeed)||!seed(r.targetSeed)||!count(r.startRevision)||r.startRevision<1||r.startRevision>s.revision||!count(r.pxpBefore))return false;
  if(s.roundCounter===1&&(r.startRevision!==1||r.targetSeed!==targetSeedFor(r.deckSeed)))return false;
  if(s.roundCounter-1>Math.floor((r.startRevision-1)/2))return false;
  if(!cardIds(r.deck,52)||!cardIds(r.hand,5)||!array(r.held,5)||r.held.length!==5||!r.held.every(v=>typeof v==='boolean')||!count(r.cursor)||r.cursor<5||r.cursor>10||!target(r.target))return false;
  const toggles=s.revision-r.startRevision-(settled?1:0),held=r.held.filter(Boolean).length;if(!count(toggles)||toggles<held||(toggles-held)%2!==0)return false;
  const shuffle=shuffled(r.deckSeed),choice=chosen(r.targetSeed);if(!sameArray(r.deck,shuffle.deck)||s.rng.deck!==shuffle.rng||s.rng.target!==choice.rng||r.target!==choice.target)return false;
  if(!settled)return r.cursor===5&&sameArray(r.hand,r.deck.slice(0,5))&&r.result===null&&r.receipt===null&&r.pxpBefore===s.totalPXP;
  const expectedHand=r.deck.slice(0,5);let cursor=5;for(let i=0;i<5;i++)if(!r.held[i])expectedHand[i]=r.deck[cursor++];
  if(cursor!==r.cursor||!sameArray(expectedHand,r.hand))return false;
  const result=evaluation(expectedHand),receipt=receiptFor(s,r,result);if(!sameData(result,r.result)||!sameData(receipt,r.receipt))return false;
  const prior=precedingLedger(s,result,receipt.matchedTarget);return prior.totals.pxp===r.pxpBefore&&safeAdd(r.pxpBefore,receipt.rewards.pxp)===s.totalPXP;
 }catch(_){return false}}
 function cloneValid(s){check(validate(s),'Poker save needs attention. No hand or reward was changed.');return JSON.parse(JSON.stringify(s))}
 function copy(s){return freeze(cloneValid(s))}
 function create(n){check(seed(n),'Poker needs its own nonzero uint32 seed.');return freeze({version:VERSION,revision:0,roundCounter:0,completedRounds:0,totalPXP:0,results:Object.fromEntries(RESULT_IDS.map(id=>[id,0])),matchedTargets:0,rng:{deck:n,target:targetSeedFor(n)},phase:'idle',round:null})}
 function rewardTotals(s){check(validate(s),'Poker save needs attention. No rewards were derived.');return freeze(ledger(s.results,s.matchedTargets).totals)}
 function move(s,action,expectedRevision){
  const next=cloneValid(s);check(count(expectedRevision)&&expectedRevision===next.revision,'Poker revision changed. Read the current table.');
  check(fields(action,['type'])||fields(action,['type','index']),'Choose a plain current Poker action.');
  check(['draw','toggle-hold','redraw'].includes(action.type)&&(action.type==='toggle-hold'?fields(action,['type','index'])&&Number.isInteger(action.index)&&action.index>=0&&action.index<5&&!Object.is(action.index,-0):fields(action,['type'])),'Unknown Poker action or card position.');
  check(next.revision<MAX,'Poker revision is full.');let completed=false;
  if(action.type==='draw'){
   check(next.phase==='idle'||next.phase==='settled','Finish the held hand before drawing again.');check(next.roundCounter<MAX,'Poker round serial is full.');
   const deckSeed=next.rng.deck,targetSeed=next.rng.target,shuffle=shuffled(deckSeed),choice=chosen(targetSeed);next.roundCounter++;
   next.round={id:'poker:'+next.roundCounter,deckSeed,targetSeed,startRevision:next.revision+1,pxpBefore:next.totalPXP,deck:shuffle.deck,cursor:5,target:choice.target,hand:shuffle.deck.slice(0,5),held:[false,false,false,false,false],result:null,receipt:null};
   next.rng={deck:shuffle.rng,target:choice.rng};next.phase='holding';
  }else{
   check(next.phase==='holding','This Poker round is not awaiting a hold or redraw.');const r=next.round;
   if(action.type==='toggle-hold')r.held[action.index]=!r.held[action.index];
   else{
    for(let i=0;i<5;i++)if(!r.held[i])r.hand[i]=r.deck[r.cursor++];r.result=evaluation(r.hand);const p=payout(r.result.category,r.target);
    next.completedRounds=safeAdd(next.completedRounds,1);next.results[r.result.category]=safeAdd(next.results[r.result.category],1);if(p.matchedTarget)next.matchedTargets=safeAdd(next.matchedTargets,1);
    next.totalPXP=safeAdd(next.totalPXP,p.rewards.pxp);next.phase='settled';completed=true;
   }
  }
  next.revision++;if(completed)next.round.receipt=receiptFor(next,next.round,next.round.result);check(validate(next),'Poker move produced an invalid table. No reward was committed.');
  return freeze({state:next,completed,roundId:next.round.id,receipt:completed?next.round.receipt:null});
 }
 // This is NOT validate/copy: private descriptors may deliberately be poisoned.
 // Do not add full validation here; projection cannot inspect hidden future data.
 function projection(value,allKeys,visibleKeys){check(shape(value,allKeys),'Invalid Poker projection shape.');const result={};for(const key of visibleKeys)result[key]=data(value,key);return result}
 function publicState(state){
  const s=projection(state,STATE_FIELDS,STATE_FIELDS.filter(k=>k!=='rng')),l=visibleHeader(s);let roundId=null,targetInfo=null,hand=[],held=[],remaining=52,result=null,receipt=null;
  if(s.phase!=='idle'){
   const r=projection(s.round,ROUND_FIELDS,['id','cursor','target','hand','held','result','receipt']);
   check(r.id==='poker:'+s.roundCounter&&target(r.target)&&cardIds(r.hand,5)&&array(r.held,5)&&r.held.length===5&&r.held.every(v=>typeof v==='boolean')&&count(r.cursor),'Invalid visible Poker round.');
   const settled=s.phase==='settled';check(r.cursor===(settled?10-r.held.filter(Boolean).length:5),'Invalid visible Poker draw count.');
   if(!settled)check(r.result===null&&r.receipt===null,'A held Poker round cannot have a receipt.');
   else{result=evaluation(r.hand);receipt=receiptFor(s,r,result);check(sameData(result,r.result)&&sameData(receipt,r.receipt),'Invalid visible Poker receipt.');precedingLedger(s,result,receipt.matchedTarget)}
   roundId=r.id;targetInfo=CATEGORY_MAP[r.target];hand=r.hand.map(card);held=r.held.slice();remaining=52-r.cursor;
  }
  return freeze({version:VERSION,revision:s.revision,roundCounter:s.roundCounter,completedRounds:s.completedRounds,totalPXP:s.totalPXP,results:{...s.results},matchedTargets:s.matchedTargets,totals:l.totals,level:levelInfo(s.totalPXP),phase:s.phase,roundId,target:targetInfo,hand,held,deckRemaining:remaining,result,receipt,can:{draw:s.phase==='idle'||s.phase==='settled',toggleHold:s.phase==='holding',redraw:s.phase==='holding'}});
 }
 return Object.freeze({VERSION,SUITS,CATEGORIES,PAYOUTS,LEVEL_THRESHOLDS,available,create,validate,copy,move,publicState,card,evaluate,payoutFor,levelInfo,rewardTotals});
});
