/* Emerald Blackjack: pure, isolated 52-card table. No game engine, clock, storage,
 * timers, Math.random or DOM. Version 2: every non-tie winner earns one point;
 * first to ten. Opening naturals settle immediately; otherwise Emerald stands
 * on every 17 (soft too), including after a player draws to 21.
 * Each freshly settled round is one completion, irrespective of its result.
 * Strict version-1 saves retain their exact old rules/messages through terminal;
 * only a successful Deal, Next or New match action upgrades the table to v2.
 * Replay proves the saved permutation, bounded moves, piles and outcome agree.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldBlackjack=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const VERSION=2,TARGET=10,MAX=Number.MAX_SAFE_INTEGER,SUITS=Object.freeze(['S','H','D','C']);
 const STATE_FIELDS=['version','revision','rng','roundCounter','completedRounds','matchCounter','score','phase','round','lastAction','message'];
 const ROUND_FIELDS=['id','deck','cursor','player','emerald','moves','outcome'];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function check(ok,message){if(!ok)throw new Error(message);}
 function fields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))return false;
  const names=Reflect.ownKeys(value);return names.length===keys.length&&names.every(k=>typeof k==='string'&&keys.includes(k)&&(()=>{const d=Object.getOwnPropertyDescriptor(value,k);return d&&own(d,'value')&&d.enumerable===true;})());
 }
 function array(value,max){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>max)return false;
  const keys=Reflect.ownKeys(value);if(keys.length!==value.length+1||!keys.includes('length'))return false;
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!own(d,'value')||d.enumerable!==true)return false;}return true;
 }
 const count=n=>Number.isSafeInteger(n)&&n>=0,seed=n=>Number.isInteger(n)&&n>0&&n<=4294967295;
 const validCard=n=>Number.isInteger(n)&&n>=0&&n<52;
 function card(id){check(validCard(id),'Invalid Blackjack card.');const rank=id%13+2,suit=SUITS[Math.floor(id/13)];return {id,rank,suit,name:(rank===14?'A':rank===13?'K':rank===12?'Q':rank===11?'J':String(rank))+({S:'♠',H:'♥',D:'♦',C:'♣'})[suit],hidden:false};}
 function total(cards){
  check(array(cards,52)&&cards.every(validCard)&&new Set(cards).size===cards.length,'Invalid Blackjack hand.');
  let value=0,aces=0;for(const id of cards){const rank=id%13+2;value+=rank===14?11:Math.min(10,rank);if(rank===14)aces++;}
  while(value>21&&aces>0){value-=10;aces--;}return {value,soft:aces>0,bust:value>21};
 }
 function stepRng(n){let x=n>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
 function shuffled(rng){
  const deck=Array.from({length:52},(_,i)=>i);let current=rng;
  // Rejection sampling avoids modulo bias; only this private table stream moves.
  for(let i=51;i>0;i--){const n=i+1,limit=Math.floor(4294967296/n)*n;let roll;do{current=stepRng(current);roll=current;}while(roll>=limit);const j=roll%n;[deck[i],deck[j]]=[deck[j],deck[i]];}
  return {deck,rng:current};
 }
 function outcome(winner,reason,pointAwarded=false){return {winner,reason,pointAwarded};}
 function draw(round,who){check(round.cursor<52,'No Blackjack cards remain.');const id=round.deck[round.cursor++];round[who].push(id);return id;}
 function dealtLegacy(deck,id){
  const round={id,deck:deck.slice(),cursor:4,player:[deck[0],deck[2]],emerald:[deck[1],deck[3]],moves:[],outcome:null};
  // Literal player-first instant 21: the unrevealed opponent cannot overturn it.
  if(total(round.player).value===21)round.outcome=outcome('player','player-21',true);
  return {round,events:[{type:'deal',text:'Cards dealt. Your hand is '+total(round.player).value+'. Emerald has one card face down.'}]};
 }
 function advanceLegacy(round,action){
  check(!round.outcome,'This Blackjack round is already complete.');check(action==='hit'||action==='stand','Choose Hit or Stand.');
  const events=[];round.moves.push(action);
  if(action==='hit'){
   const id=draw(round,'player'),p=total(round.player);events.push({type:'player-hit',text:'You hit '+card(id).name+' — '+p.value+'.'});
   if(p.value===21)round.outcome=outcome('player','player-21',true);else if(p.bust)round.outcome=outcome('emerald','player-bust');
  }else{
   const p=total(round.player);events.push({type:'player-stand',text:'You stand on '+p.value+'.'});
   events.push({type:'emerald-reveal',text:'Emerald reveals '+card(round.emerald[1]).name+'.'});
   while(total(round.emerald).value<17){const id=draw(round,'emerald'),d=total(round.emerald);events.push({type:'emerald-hit',text:'Emerald hits '+card(id).name+' — '+d.value+'.'});}
   const d=total(round.emerald);
   if(d.value===21)round.outcome=outcome('emerald','emerald-21',true);
   else if(d.bust)round.outcome=outcome('player','emerald-bust');
   else{events.push({type:'emerald-stand',text:'Emerald stands on '+d.value+(d.soft?' (soft)':'')+'.'});round.outcome=p.value===d.value?outcome('tie','tie'):outcome(p.value>d.value?'player':'emerald','comparison');}
  }
  return events;
 }
 // V1 functions above remain literal legacy replay. No saved round is upgraded
 // by a read, or while Hit/Stand is still resolving that round.
 function dealt(deck,id,version){
  if(version===1)return dealtLegacy(deck,id);
  const round={id,deck:deck.slice(),cursor:4,player:[deck[0],deck[2]],emerald:[deck[1],deck[3]],moves:[],outcome:null};
  const p=total(round.player).value,d=total(round.emerald).value,events=[{type:'deal',text:'Cards dealt. Your hand is '+p+'. Emerald has one card face down.'}];
  if(p===21||d===21){round.outcome=p===d?outcome('tie','natural-tie'):p===21?outcome('player','player-natural',true):outcome('emerald','emerald-natural',true);events.push({type:'emerald-reveal',text:'Emerald reveals '+card(round.emerald[1]).name+'.'});}
  return {round,events};
 }
 function emeraldTurn(round,events){
  events.push({type:'emerald-reveal',text:'Emerald reveals '+card(round.emerald[1]).name+'.'});
  while(total(round.emerald).value<17){const id=draw(round,'emerald'),d=total(round.emerald);events.push({type:'emerald-hit',text:'Emerald hits '+card(id).name+' — '+d.value+'.'});}
  const p=total(round.player),d=total(round.emerald);
  if(d.bust)round.outcome=outcome('player','emerald-bust',true);
  else{events.push({type:'emerald-stand',text:'Emerald stands on '+d.value+(d.soft?' (soft)':'')+'.'});round.outcome=p.value===d.value?outcome('tie','tie'):outcome(p.value>d.value?'player':'emerald','comparison',true);}
 }
 function advance(round,action,version){
  if(version===1)return advanceLegacy(round,action);
  check(!round.outcome,'This Blackjack round is already complete.');check(action==='hit'||action==='stand','Choose Hit or Stand.');
  const events=[];round.moves.push(action);
  if(action==='hit'){
   const id=draw(round,'player'),p=total(round.player);events.push({type:'player-hit',text:'You hit '+card(id).name+' — '+p.value+'.'});
   if(p.bust)round.outcome=outcome('emerald','player-bust',true);else if(p.value===21)emeraldTurn(round,events);
  }else{events.push({type:'player-stand',text:'You stand on '+total(round.player).value+'.'});emeraldTurn(round,events);}
  return events;
 }
 function sameArray(a,b){return a.length===b.length&&a.every((x,i)=>x===b[i]);}
 function sameOutcome(a,b){return a===null?b===null:fields(b,['winner','reason','pointAwarded'])&&a.winner===b.winner&&a.reason===b.reason&&a.pointAwarded===b.pointAwarded;}
 function replay(round,version){let result=dealt(round.deck,round.id,version),events=result.events;for(const action of round.moves)events=advance(result.round,action,version);return {round:result.round,events};}
 function describeLegacy(state){
  if(state.phase==='ready')return state.lastAction==='new-match'?'New match ready. Only exactly 21 earns a point.':'Ready to deal. Only exactly 21 earns a point.';
  const r=state.round,p=total(r.player),o=r.outcome;
  if(!o)return state.lastAction==='hit'?'You hit '+card(r.player[r.player.length-1]).name+' — '+p.value+'. Hit or stand; I won’t peek at the deck.':'You have '+p.value+'. Your move! My second card stays hidden.';
  const d=total(r.emerald);let message;
  if(o.reason==='player-21')message='Exactly 21! You earn 1 point — nicely played!';
  else if(o.reason==='emerald-21')message='Emerald reaches exactly 21 and earns 1 point!';
  else if(o.reason==='player-bust')message='You went over 21. Round complete; no point this time.';
  else if(o.reason==='emerald-bust')message='Emerald went over 21. You win this round, but no point without exactly 21.';
  else if(o.reason==='tie')message='A tie on '+p.value+'. Round complete; no point.';
  else message=(o.winner==='player'?'You win':'Emerald wins')+' this round, '+(o.winner==='player'?p.value:d.value)+' to '+(o.winner==='player'?d.value:p.value)+'. No point without exactly 21.';
  return message+(state.phase==='match-over'?(state.score.player===TARGET?' You win the match, 10 points!':' Emerald wins the match, 10 points!'):'')+' +1 friendship FP for this completed round.';
 }
 function describe(state){
  if(state.version===1)return describeLegacy(state);
  if(state.phase==='ready')return (state.lastAction==='new-match'?'New match ready.':'Ready to deal.')+' Each round winner earns 1 point; ties are a push. First to 10.';
  const r=state.round,p=total(r.player),o=r.outcome;
  if(!o)return state.lastAction==='hit'?'You hit '+card(r.player[r.player.length-1]).name+' — '+p.value+'. Hit or stand; I won’t peek at the deck.':'You have '+p.value+'. Your move! My second card stays hidden.';
  const d=total(r.emerald);let message;
  if(o.reason==='player-natural')message='Blackjack! You earn 1 point — nicely played!';
  else if(o.reason==='emerald-natural')message='Emerald has Blackjack and earns 1 point!';
  else if(o.reason==='natural-tie')message='Both have Blackjack. Push — no point.';
  else if(o.reason==='player-bust')message='You went over 21. Emerald earns 1 point.';
  else if(o.reason==='emerald-bust')message='Emerald went over 21. You earn 1 point!';
  else if(o.reason==='tie')message='A tie on '+p.value+'. Push — no point.';
  else message=(o.winner==='player'?'You win':'Emerald wins')+' this round, '+(o.winner==='player'?p.value:d.value)+' to '+(o.winner==='player'?d.value:p.value)+'. '+(o.winner==='player'?'You earn':'Emerald earns')+' 1 point!';
  return message+(state.phase==='match-over'?(state.score.player===TARGET?' You win the match, 10 points!':' Emerald wins the match, 10 points!'):'')+' +1 friendship FP for this completed round.';
 }
 function validate(state){try{
  if(!fields(state,STATE_FIELDS)||![1,VERSION].includes(state.version)||!count(state.revision)||!seed(state.rng)||!count(state.roundCounter)||!count(state.completedRounds)||!count(state.matchCounter)||state.matchCounter<1)return false;
  if(!fields(state.score,['player','emerald'])||![state.score.player,state.score.emerald].every(n=>count(n)&&n<=TARGET)||state.score.player===TARGET&&state.score.emerald===TARGET)return false;
  if(!['ready','player','round-over','match-over'].includes(state.phase)||![null,'deal','hit','stand','next','new-match'].includes(state.lastAction)||typeof state.message!=='string'||state.message.length>600)return false;
  if(state.completedRounds>state.roundCounter||state.matchCounter-1>Math.floor(state.completedRounds/TARGET)||state.revision-state.roundCounter<state.matchCounter-1)return false;
  if(state.score.player+state.score.emerald>state.completedRounds-(state.matchCounter-1)*TARGET)return false;
  if(state.roundCounter<=Math.floor(MAX/50)&&state.revision-(state.matchCounter-1)>state.roundCounter*50)return false;
  if(state.phase==='ready'){
   if(state.round!==null||state.score.player!==0||state.score.emerald!==0||state.completedRounds!==state.roundCounter)return false;
   if(state.roundCounter===0){if(state.matchCounter!==1||state.revision!==0||state.lastAction!==null)return false;}
   else if(state.matchCounter<2||state.lastAction!=='new-match')return false;
  }else{
   const r=state.round;if(!fields(r,ROUND_FIELDS)||state.roundCounter<1||r.id!=='blackjack:'+state.matchCounter+':'+state.roundCounter||!array(r.deck,52)||r.deck.length!==52||!r.deck.every(validCard)||new Set(r.deck).size!==52)return false;
   if(!count(r.cursor)||r.cursor<4||r.cursor>52||!array(r.player,52)||!array(r.emerald,52)||!array(r.moves,49)||!r.moves.every(a=>a==='hit'||a==='stand'))return false;
   if(!r.player.every(validCard)||!r.emerald.every(validCard)||r.player.length<2||r.emerald.length<2)return false;
   if(state.revision-state.roundCounter-(state.matchCounter-1)<r.moves.length||state.roundCounter===1&&state.revision!==1+r.moves.length)return false;
   const expected=replay(r,state.version).round;if(r.cursor!==expected.cursor||!sameArray(r.player,expected.player)||!sameArray(r.emerald,expected.emerald)||!sameOutcome(expected.outcome,r.outcome))return false;
   if(r.moves.length?state.lastAction!==r.moves[r.moves.length-1]:!['deal','next'].includes(state.lastAction))return false;
   if(r.outcome===null){if(state.phase!=='player'||state.completedRounds!==state.roundCounter-1||state.score.player>=TARGET||state.score.emerald>=TARGET)return false;}
   else{
    if(state.completedRounds!==state.roundCounter)return false;
    const end=state.score.player===TARGET||state.score.emerald===TARGET;if(state.phase!==(end?'match-over':'round-over'))return false;
    const prior={...state.score};if(r.outcome.pointAwarded)prior[r.outcome.winner]--;
    if(prior.player<0||prior.emerald<0||prior.player>=TARGET||prior.emerald>=TARGET||prior.player+prior.emerald>state.completedRounds-1)return false;
   }
  }
  return state.message===describe(state);
 }catch(_){return false;}}
 function copy(state){check(validate(state),'Blackjack save needs attention. No round was changed.');return JSON.parse(JSON.stringify(state));}
 function create(rng){check(seed(rng),'Blackjack needs its own nonzero uint32 seed.');const state={version:VERSION,revision:0,rng,roundCounter:0,completedRounds:0,matchCounter:1,score:{player:0,emerald:0},phase:'ready',round:null,lastAction:null,message:''};state.message=describe(state);return state;}
 function move(state,action,expectedRevision){
  const next=copy(state);check(count(expectedRevision)&&expectedRevision===state.revision,'Blackjack revision changed. Read the current table.');
  check(typeof action==='string'&&['deal','hit','stand','next','new-match'].includes(action),'Unknown Blackjack move.');check(next.revision<MAX,'Blackjack revision is full.');
  let completed=false;
  if(action==='new-match'){
   check(next.phase==='match-over','Finish the current match before starting another.');check(next.matchCounter<MAX,'Blackjack match counter is full.');
   next.version=VERSION;next.matchCounter++;next.score={player:0,emerald:0};next.round=null;next.phase='ready';
  }else{
   if(action==='deal'||action==='next'){
    check(action==='deal'?next.phase==='ready':next.phase==='round-over','Deal only a ready table, or choose Next after a completed round.');check(next.roundCounter<MAX,'Blackjack round counter is full.');
    next.version=VERSION;const deck=shuffled(next.rng);next.rng=deck.rng;next.roundCounter++;next.round=dealt(deck.deck,'blackjack:'+next.matchCounter+':'+next.roundCounter,next.version).round;
   }else{check(next.phase==='player','This round is not awaiting your move.');advance(next.round,action,next.version);}
   if(next.round.outcome){check(next.completedRounds<MAX,'Blackjack completed-round counter is full.');next.completedRounds++;completed=true;if(next.round.outcome.pointAwarded)next.score[next.round.outcome.winner]++;next.phase=next.score.player===TARGET||next.score.emerald===TARGET?'match-over':'round-over';}
   else next.phase='player';
  }
  next.revision++;next.lastAction=action;next.message=describe(next);check(validate(next),'Blackjack move produced an invalid table.');
  return {state:next,completed,roundId:next.round?.id||null,message:next.message};
 }
 function publicState(state){
  const s=copy(state),r=s.round,terminal=!!r?.outcome,p=r?total(r.player):{value:0,soft:false,bust:false},d=r?total(r.emerald):{value:0,soft:false,bust:false};
  return {version:s.version,revision:s.revision,roundCounter:s.roundCounter,completedRounds:s.completedRounds,matchCounter:s.matchCounter,roundId:r?.id||null,phase:s.phase,score:{...s.score},matchWinner:s.phase==='match-over'?(s.score.player===TARGET?'player':'emerald'):null,
   player:{cards:r?r.player.map(card):[],total:p.value,soft:p.soft,bust:p.bust},
   emerald:{cards:r?r.emerald.map((id,i)=>terminal||i===0?card(id):{hidden:true}):[],total:terminal||!r?d.value:null,soft:terminal||!r?d.soft:null,bust:terminal?d.bust:false,visibleTotal:r?total([r.emerald[0]]).value:0,hidden:!!r&&!terminal},
   deckRemaining:r?52-r.cursor:52,winner:r?.outcome?.winner||null,pointAwarded:r?.outcome?.pointAwarded===true,message:s.message,lastAction:s.lastAction,events:r?replay(r,s.version).events.map(e=>({...e})):[],
   can:{deal:s.phase==='ready',hit:s.phase==='player',stand:s.phase==='player',next:s.phase==='round-over',newMatch:s.phase==='match-over'}};
 }
 return Object.freeze({VERSION,TARGET,SUITS,create,validate,copy,move,publicState,card,total,describe});
});
