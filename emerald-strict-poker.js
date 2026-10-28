/* Pure heads-up no-limit Texas Hold'em. Two hole cards each; five community
 * cards revealed only after closed betting streets. Separate deck/decision RNG.
 * Every save authenticates by replaying THIS hand from seeds + bounded actions;
 * aggregate outcome-by-level sources authenticate exact integer FP hundredths.
 * No storage, clocks, external entropy, callbacks or legacy Poker mutation.
 * publicState is projection, NOT authentication: it never reads private fields.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldStrictPoker=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const VERSION=1,STARTING_CHIPS=1000,SMALL_BLIND=10,BIG_BLIND=20,MAX=Number.MAX_SAFE_INTEGER,UINT=4294967296;
 const END_QUOTE="GG!!! What are game and how we've bonded together to make this a reality!!!";
 const STATE=['version','revision','matchCounter','handCounter','completedHands','results','rng','phase','stacks','round'];
 const PRIVATE=['deckSeed','decisionSeed','startingStacks','priorResults','actions','deck','hiddenEmerald','decisionRng'];
 const VISIBLE=['id','startRevision','button','rewardLevel','player','community','street','actor','streetBets','contributions','pot','currentBet','lastFullRaise','acted','lastAction','shownEmerald','receipt'];
 const ROUND=PRIVATE.concat(VISIBLE),SUITS=['S','H','D','C'],SYMBOLS=['♠','♥','♦','♣'];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0),seed=n=>Number.isInteger(n)&&n>0&&n<UINT,level=n=>Number.isInteger(n)&&n>=1&&n<=40;
 function check(ok,text){if(!ok)throw Error(text)}
 function freeze(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){for(const k of Object.keys(o))freeze(o[k]);Object.freeze(o)}return o}
 function shape(o,keys){return !!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o))&&Reflect.ownKeys(o).length===keys.length&&Reflect.ownKeys(o).every(k=>typeof k==='string'&&keys.includes(k))}
 function data(o,k){const d=Object.getOwnPropertyDescriptor(o,k);check(d&&own(d,'value')&&d.enumerable,'Strict Poker needs plain enumerable data.');return d.value}
 function fields(o,keys){return shape(o,keys)&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(o,k);return d&&own(d,'value')&&d.enumerable})}
 function array(a,max){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length>max||Reflect.ownKeys(a).length!==a.length+1)return false;for(let i=0;i<a.length;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d||!own(d,'value')||!d.enumerable)return false}return true}
 function equal(expected,actual){if(expected===null||typeof expected!=='object')return Object.is(expected,actual);if(Array.isArray(expected))return array(actual,expected.length)&&actual.length===expected.length&&expected.every((v,i)=>equal(v,actual[i]));const keys=Object.keys(expected);return fields(actual,keys)&&keys.every(k=>equal(expected[k],actual[k]))}
 function cards(a,min,max=min){return array(a,max)&&a.length>=min&&a.every(n=>Number.isInteger(n)&&n>=0&&n<52&&!Object.is(n,-0))&&new Set(a).size===a.length}
 function card(id){check(Number.isInteger(id)&&id>=0&&id<52&&!Object.is(id,-0),'Invalid card.');const rank=id%13+2,suit=SUITS[Math.floor(id/13)];return freeze({id,rank,suit,name:(rank===14?'A':({11:'J',12:'Q',13:'K'}[rank]||rank))+SYMBOLS[Math.floor(id/13)]})}
 function rank5(a){
  const counts=new Array(15).fill(0),ranks=[],pairs=[];let suit=Math.floor(a[0]/13),flush=true,three=0,four=0;
  for(const c of a){counts[c%13+2]++;if(Math.floor(c/13)!==suit)flush=false}
  for(let r=14;r>=2;r--)if(counts[r]){ranks.push(r);if(counts[r]===4)four=r;else if(counts[r]===3)three=r;else if(counts[r]===2)pairs.push(r)}
  let straight=0;if(ranks.length===5){if(ranks[0]-ranks[4]===4)straight=ranks[0];else if(equal([14,5,4,3,2],ranks))straight=5}
  let strength,category,tiebreak;
  if(straight&&flush){strength=8;category='straight-flush';tiebreak=[straight]}
  else if(four){strength=7;category='four-of-a-kind';tiebreak=[four,...ranks.filter(r=>r!==four)]}
  else if(three&&pairs.length){strength=6;category='full-house';tiebreak=[three,pairs[0]]}
  else if(flush){strength=5;category='flush';tiebreak=ranks}
  else if(straight){strength=4;category='straight';tiebreak=[straight]}
  else if(three){strength=3;category='three-of-a-kind';tiebreak=[three,...ranks.filter(r=>r!==three)]}
  else if(pairs.length===2){strength=2;category='two-pair';tiebreak=[...pairs,...ranks.filter(r=>!pairs.includes(r))]}
  else if(pairs.length){strength=1;category='one-pair';tiebreak=[pairs[0],...ranks.filter(r=>r!==pairs[0])]}
  else{strength=0;category='high-card';tiebreak=ranks}
  return {category,strength,tiebreak};
 }
 function compare(a,b){if(a.strength!==b.strength)return Math.sign(a.strength-b.strength);for(let i=0;i<a.tiebreak.length;i++)if(a.tiebreak[i]!==b.tiebreak[i])return Math.sign(a.tiebreak[i]-b.tiebreak[i]);return 0}
 function best(a){let result=null,bestCards=null;for(let i=0;i<a.length-4;i++)for(let j=i+1;j<a.length-3;j++)for(let k=j+1;k<a.length-2;k++)for(let l=k+1;l<a.length-1;l++)for(let m=l+1;m<a.length;m++){const chosen=[a[i],a[j],a[k],a[l],a[m]],r=rank5(chosen);if(!result||compare(r,result)>0){result=r;bestCards=chosen}}return {...result,cards:bestCards}}
 function evaluate(a){check(cards(a,5,7),'Hold’em evaluation needs 5–7 unique plain card IDs.');return freeze(best(a))}
 function random(n){let x=n>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}
 function derive(n){let x=(n^0x9e3779b9)>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b)>>>0;x=Math.imul(x^(x>>>13),0xc2b2ae35)>>>0;return (x^(x>>>16))>>>0||0x6d2b79f5}
 function choose(n,size){let word;const limit=Math.floor((UINT-1)/size)*size;do{n=random(n);word=n}while(word>limit);return {index:(word-1)%size,rng:n}}
 function shuffle(n){const deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const r=choose(n,i+1);n=r.rng;[deck[i],deck[r.index]]=[deck[r.index],deck[i]]}return {deck,rng:n}}
 function results(){return {wins:new Array(40).fill(0),ties:new Array(40).fill(0),losses:0}}
 function totals(r){check(fields(r,['wins','ties','losses'])&&array(r.wins,40)&&r.wins.length===40&&array(r.ties,40)&&r.ties.length===40&&r.wins.every(count)&&r.ties.every(count)&&count(r.losses),'Invalid Strict Poker outcome ledger.');let wins=0,ties=0,fpHundredths=0;for(let i=0;i<40;i++){wins+=r.wins[i];ties+=r.ties[i];fpHundredths+=r.wins[i]*10*(100+i)+r.ties[i]*5*(100+i);check([wins,ties,fpHundredths].every(count),'Strict Poker reward capacity is full.')}const rounds=wins+ties+r.losses;check(count(rounds),'Strict Poker round capacity is full.');return {wins,ties,losses:r.losses,rounds,baseFP:wins*10+ties*5,fpHundredths,fp:fpHundredths/100}}
 function rewardTotals(s){check(validate(s),'Strict Poker save needs attention.');return freeze(totals(s.results))}
 function create(n){check(seed(n),'Strict Poker needs independent nonzero uint32 entropy.');return freeze({version:VERSION,revision:0,matchCounter:1,handCounter:0,completedHands:0,results:results(),rng:{deck:n,decision:derive(n)},phase:'idle',stacks:[1000,1000],round:null})}
 function pay(s,i,amount){check(count(amount)&&amount<=s.stacks[i],'Bet exceeds available stack.');s.stacks[i]-=amount;s.round.streetBets[i]+=amount;s.round.contributions[i]+=amount;s.round.pot+=amount}
 function maxTo(s,i){return Math.min(s.stacks[i]+s.round.streetBets[i],s.stacks[1-i]+s.round.streetBets[1-i])}
 function legal(s){const r=s.round,i=r?.actor==='player'?0:1,active=s.phase==='playing'&&['player','emerald'].includes(r?.actor),facing=active?r.currentBet-r.streetBets[i]:0,max=active?maxTo(s,i):0,min=active?r.currentBet+r.lastFullRaise:0;return {can:{deal:['idle','settled'].includes(s.phase),newMatch:s.phase==='match-over',check:active&&facing===0,call:active&&facing>0,fold:active,raise:active&&max>r.currentBet,emerald:s.phase==='playing'&&r.actor==='emerald',reveal:s.phase==='playing'&&r.actor==='dealer'},toCall:Math.min(facing,s.stacks[i]??0),minRaiseTo:Math.min(min,max),maxRaiseTo:max,shortAllIn:active&&max>r.currentBet&&max<min}}
 function closeStreet(s){const r=s.round;if(r.streetBets[0]===r.streetBets[1]&&(r.acted.every(Boolean)||s.stacks.some(n=>n===0))){r.actor='dealer';return true}return false}
 function begin(s,rewardLevel){
  check(['idle','settled'].includes(s.phase)&&s.stacks.every(n=>n>0),'Finish this hand or explicitly start a new match first.');check(level(rewardLevel)&&s.handCounter<MAX,'Invalid reward level or full hand counter.');
  const deckSeed=s.rng.deck,decisionSeed=s.rng.decision,shuffled=shuffle(deckSeed),serial=++s.handCounter,button=(serial-1)%2;
  s.round={deckSeed,decisionSeed,startingStacks:s.stacks.slice(),priorResults:JSON.parse(JSON.stringify(s.results)),actions:[],deck:shuffled.deck,hiddenEmerald:[shuffled.deck[1],shuffled.deck[3]],decisionRng:decisionSeed,id:'strict-poker:'+serial,startRevision:s.revision+1,button,rewardLevel,player:[shuffled.deck[0],shuffled.deck[2]],community:[],street:'preflop',actor:button===0?'player':'emerald',streetBets:[0,0],contributions:[0,0],pot:0,currentBet:0,lastFullRaise:20,acted:[false,false],lastAction:null,shownEmerald:null,receipt:null};s.rng.deck=shuffled.rng;s.phase='playing';
  const effective=Math.min(...s.stacks);pay(s,button,Math.min(SMALL_BLIND,effective));pay(s,1-button,Math.min(BIG_BLIND,effective));s.round.currentBet=Math.max(...s.round.streetBets);closeStreet(s);
 }
 function settle(s,winner,reason){
  const r=s.round;check(r.contributions[0]===r.contributions[1]||reason==='fold','Unmatched showdown bets.');
  if(reason==='fold'){const refund=Math.abs(r.contributions[0]-r.contributions[1]),owner=r.contributions[0]>r.contributions[1]?0:1;s.stacks[owner]+=refund;r.pot-=refund;r.contributions[owner]-=refund;r.streetBets[owner]-=refund;r.currentBet=Math.max(...r.streetBets)}
  const payout=r.pot;if(winner==='tie'){check(payout%2===0,'Unmatched split pot.');s.stacks[0]+=payout/2;s.stacks[1]+=payout/2}else s.stacks[winner==='player'?0:1]+=payout;
  r.pot=0;r.actor=null;const baseFP=winner==='player'?10:winner==='tie'?5:0;
  if(winner==='player')s.results.wins[r.rewardLevel-1]++;else if(winner==='tie')s.results.ties[r.rewardLevel-1]++;else s.results.losses++;
  s.completedHands++;r.receipt={version:VERSION,roundId:r.id,serial:s.handCounter,completedHands:s.completedHands,winner,reason,pot:payout,baseFP,rewardLevel:r.rewardLevel,multiplierHundredths:99+r.rewardLevel,fpHundredths:baseFP*(99+r.rewardLevel),playerRank:reason==='showdown'?best([...r.player,...r.community]):null,emeraldRank:reason==='showdown'?best([...r.hiddenEmerald,...r.community]):null,quote:END_QUOTE};
  if(reason==='showdown'){r.street='showdown';r.shownEmerald=r.hiddenEmerald.slice()}
  s.phase=s.stacks.some(n=>n===0)?'match-over':'settled';totals(s.results);
 }
 function betting(s,action){
  const r=s.round;check(s.phase==='playing'&&['player','emerald'].includes(r.actor),'This is not a betting turn.');const i=r.actor==='player'?0:1,actor=r.actor,l=legal(s),kind=action.type;
  if(kind==='fold'){r.lastAction={actor,type:kind,amount:0};settle(s,i===0?'emerald':'player','fold');return}
  check(['check','call','raise'].includes(kind),'Unknown betting action.');let amount=0;
  if(kind==='check')check(l.can.check,'Facing a bet: call, raise or fold.');
  if(kind==='call'){check(l.can.call,'There is no outstanding bet to call.');amount=l.toCall;pay(s,i,amount)}
  if(kind==='raise'){const to=action.to;check(count(to)&&l.can.raise&&to>r.currentBet&&to<=l.maxRaiseTo&&(to>=r.currentBet+r.lastFullRaise||to===l.maxRaiseTo),'Choose a stack-bound full raise or the effective all-in.');amount=to-r.streetBets[i];const raise=to-r.currentBet;pay(s,i,amount);if(raise>=r.lastFullRaise)r.lastFullRaise=raise;r.currentBet=to;r.acted[1-i]=false}
  r.acted[i]=true;r.lastAction={actor,type:kind,amount};if(!closeStreet(s))r.actor=i===0?'emerald':'player';
 }
 // Deliberately receives ONLY Emerald's own hole cards and public information.
 // No player hand, future board, deck, deck seed or state-wide object is passed.
 function decision(hole,community,stack,pot,toCall,currentBet,minTo,max,rng){
  const roll=choose(rng,100);let score;
  if(community.length>=3)score=best([...hole,...community]).strength*12+Math.max(...hole.map(c=>c%13+2));else{const ranks=hole.map(c=>c%13+2);score=ranks[0]+ranks[1]+(ranks[0]===ranks[1]?24:0)+(Math.floor(hole[0]/13)===Math.floor(hole[1]/13)?5:0)}
  if(toCall>0&&toCall>Math.max(40,stack*.25)&&score<30&&roll.index<48)return {action:{type:'fold'},rng:roll.rng};
  if(max>currentBet&&score>=27&&roll.index<28){const desired=roll.index<5&&score>=45?max:Math.max(minTo,currentBet+Math.max(20,Math.floor(pot/2)));return {action:{type:'raise',to:Math.min(max,desired)},rng:roll.rng}}
  return {action:{type:toCall?'call':'check'},rng:roll.rng};
 }
 function apply(s,action){
  const r=s.round;
  if(action.type==='emerald'){check(s.phase==='playing'&&r.actor==='emerald','It is not Emerald’s betting turn.');const l=legal(s),d=decision(r.hiddenEmerald,r.community,s.stacks[1],r.pot,l.toCall,r.currentBet,l.minRaiseTo,l.maxRaiseTo,r.decisionRng);r.decisionRng=d.rng;s.rng.decision=d.rng;betting(s,d.action)}
  else if(action.type==='reveal'){
   check(s.phase==='playing'&&r.actor==='dealer'&&r.streetBets[0]===r.streetBets[1],'Both seats must finish and match this street’s bets before a reveal.');
   if(r.street==='river'){const p=best([...r.player,...r.community]),e=best([...r.hiddenEmerald,...r.community]),result=compare(p,e);settle(s,result>0?'player':result<0?'emerald':'tie','showdown');return}
   r.street=r.street==='preflop'?'flop':r.street==='flop'?'turn':'river';const length=r.street==='flop'?3:r.street==='turn'?4:5;r.community=r.deck.slice(4,4+length);r.streetBets=[0,0];r.currentBet=0;r.lastFullRaise=BIG_BLIND;r.acted=[false,false];r.actor=s.stacks.some(n=>n===0)?'dealer':r.button===0?'emerald':'player';r.lastAction={actor:'dealer',type:'reveal',amount:0};
  }else{check(s.phase==='playing'&&r.actor==='player','It is not your betting turn.');betting(s,action)}
 }
 function validAction(a){if(!a||typeof a!=='object')return false;const d=Object.getOwnPropertyDescriptor(a,'type');if(!d||!own(d,'value'))return false;return ['emerald','reveal','check','call','fold'].includes(d.value)?fields(a,['type']):d.value==='raise'&&fields(a,['type','to'])&&count(a.to)}
 function validate(s){try{
  if(!fields(s,STATE)||s.version!==VERSION||![s.revision,s.matchCounter,s.handCounter,s.completedHands].every(count)||s.matchCounter<1||!fields(s.rng,['deck','decision'])||!seed(s.rng.deck)||!seed(s.rng.decision)||!array(s.stacks,2)||s.stacks.length!==2||!s.stacks.every(count)||!['idle','playing','settled','match-over'].includes(s.phase))return false;
  const t=totals(s.results);if(t.rounds!==s.completedHands)return false;
  if(s.phase==='idle')return s.round===null&&s.handCounter===s.completedHands&&equal([1000,1000],s.stacks)&&(s.handCounter!==0||s.revision===0&&s.matchCounter===1&&s.rng.decision===derive(s.rng.deck));
  const r=s.round;if(!fields(r,ROUND)||r.id!=='strict-poker:'+s.handCounter||!count(r.startRevision)||r.startRevision<1||!seed(r.deckSeed)||!seed(r.decisionSeed)||!level(r.rewardLevel)||!array(r.actions,512)||!r.actions.every(validAction)||!array(r.startingStacks,2)||r.startingStacks.length!==2||!r.startingStacks.every(n=>count(n)&&n>0)||r.startingStacks[0]+r.startingStacks[1]!==2000||r.button!==(s.handCounter-1)%2)return false;
  const prior=totals(r.priorResults);if(prior.rounds!==s.handCounter-1)return false;
  const replay={version:VERSION,revision:r.startRevision-1,matchCounter:s.matchCounter,handCounter:s.handCounter-1,completedHands:prior.rounds,results:JSON.parse(JSON.stringify(r.priorResults)),rng:{deck:r.deckSeed,decision:r.decisionSeed},phase:'settled',stacks:r.startingStacks.slice(),round:null};begin(replay,r.rewardLevel);replay.revision++;
  for(const action of r.actions){if(replay.phase!=='playing')return false;apply(replay,action);replay.round.actions.push({...action});replay.revision++}
  return equal(replay,s)&&s.stacks[0]+s.stacks[1]+r.pot===2000;
 }catch(_){return false}}
 function copy(s){check(validate(s),'Strict Poker save needs attention. No hand or reward was changed.');return freeze(JSON.parse(JSON.stringify(s)))}
 function move(s,action,expectedRevision){
  check(validate(s),'Strict Poker save needs attention.');check(count(expectedRevision)&&expectedRevision===s.revision&&s.revision<MAX,'Strict Poker revision changed or is full.');
  const next=JSON.parse(JSON.stringify(s));let dealt=false;
  if(fields(action,['type','rewardLevel'])&&action.type==='deal'){begin(next,action.rewardLevel);dealt=true}
  else if(fields(action,['type'])&&action.type==='new-match'){check(next.phase==='match-over'&&next.matchCounter<MAX,'A new fictional match is available only after a stack reaches zero.');next.stacks=[1000,1000];next.matchCounter++;next.phase='idle';next.round=null}
  else{check(validAction(action),'Choose a plain current Strict Poker action.');check(next.round&&next.round.actions.length<512,'Strict Poker action history is full.');apply(next,action);next.round.actions.push({...action})}
  next.revision++;check(validate(next),'Strict Poker move could not be authenticated.');const completed=!dealt&&s.phase==='playing'&&next.phase!=='playing';return freeze({state:next,completed,receipt:completed?next.round.receipt:null});
 }
 function project(o,all,visible){check(shape(o,all),'Invalid visible Strict Poker shape.');const result={};for(const k of visible)result[k]=data(o,k);return result}
 function publicState(state){
  const s=project(state,STATE,STATE.filter(k=>k!=='rng')),t=totals(s.results);check(s.version===VERSION&&[s.revision,s.matchCounter,s.handCounter,s.completedHands].every(count)&&t.rounds===s.completedHands&&array(s.stacks,2)&&s.stacks.length===2&&s.stacks.every(count),'Invalid visible Strict Poker header.');
  let r=null;if(s.round!==null){r=project(s.round,ROUND,VISIBLE);check(cards(r.player,2)&&cards(r.community,0,5)&&['preflop','flop','turn','river','showdown'].includes(r.street)&&[null,'player','emerald','dealer'].includes(r.actor)&&level(r.rewardLevel),'Invalid visible Strict Poker cards.');check(r.shownEmerald===null||r.street==='showdown'&&cards(r.shownEmerald,2),'Emerald’s hole cards stay hidden until showdown.');}
  const view={phase:s.phase,round:r};const l=legal({...s,round:r});
  return freeze({version:VERSION,revision:s.revision,matchCounter:s.matchCounter,handCounter:s.handCounter,completedHands:s.completedHands,totals:t,phase:view.phase,roundId:r?.id??null,stacks:s.stacks.slice(),button:r?.button??0,rewardLevel:r?.rewardLevel??1,player:r?r.player.map(card):[],emerald:r?.shownEmerald?r.shownEmerald.map(card):null,community:r?r.community.map(card):[],street:r?.street??null,actor:r?.actor??null,streetBets:r?r.streetBets.slice():[0,0],pot:r?.pot??0,lastAction:r?.lastAction?{...r.lastAction}:null,receipt:r?.receipt??null,...l,can:{...l.can,check:r?.actor==='player'&&l.can.check,call:r?.actor==='player'&&l.can.call,fold:r?.actor==='player'&&l.can.fold,raise:r?.actor==='player'&&l.can.raise}});
 }
 return Object.freeze({VERSION,STARTING_CHIPS,SMALL_BLIND,BIG_BLIND,END_QUOTE,create,validate,copy,move,publicState,card,evaluate,compare,rewardTotals});
});
