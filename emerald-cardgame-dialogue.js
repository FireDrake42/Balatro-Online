/* Original contextual Emerald dialogue. Every changing clause describes a real
 * visible decision, card, rule or resource; no numbered/prefix filler corpus.
 * Pure public projections only. No IO, entropy, schedules or private data.
 * The audit enumerates >1,000 different mechanical contexts per native cardgame;
 * this is a factual local grammar, NOT thousands of independently authored jokes.
 * Existing authored quotes, translations, names and friendship tone stay separate. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(n?()=>require('./emerald-poker'):()=>root.BOEmeraldPoker,n?()=>require('./emerald-strict-poker'):()=>root.BOEmeraldStrictPoker,n?()=>require('./emerald-slots'):()=>root.BOEmeraldSlots,n?()=>require('./darts-native'):()=>root.BODartsNative);if(n)module.exports=api;else root.BOCardgameDialogue=api;})(typeof globalThis!=='undefined'?globalThis:this,function(poker,strict,slots,darts){'use strict';
 const GAMES=Object.freeze(['balatro','blackjack','baccarat','high-low','poker','strict-poker']),MAX_REPLY=640;
 const SUITS=Object.freeze({S:'♠',H:'♥',D:'♦',C:'♣',spades:'♠',hearts:'♥',diamonds:'♦',clubs:'♣'}),CODES=Object.freeze({S:'S',H:'H',D:'D',C:'C',spades:'S',hearts:'H',diamonds:'D',clubs:'C'}),NAMES=Object.freeze({'royal-flush':'Royal Flush','straight-flush':'Straight Flush','four-of-a-kind':'Four of a Kind','full-house':'Full House',flush:'Flush',straight:'Straight','three-of-a-kind':'Three of a Kind','two-pair':'Two Pair','one-pair':'One Pair','high-card':'High Card',none:'No Paying Hand'});
 function get(o,k){if(!o||typeof o!=='object')return undefined;const d=Object.getOwnPropertyDescriptor(o,k);return d&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;}
 const whole=n=>Number.isSafeInteger(n)&&n>=0,finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const number=n=>String(Math.round(n*100000)/100000),rank=n=>n===14?'A':n===13?'K':n===12?'Q':n===11?'J':String(n);
 function card(c){if(get(c,'hidden')===true||get(c,'faceDown')===true)return null;const r=get(c,'rank'),s=get(c,'suit');if(!Number.isInteger(r)||r<2||r>14||!Object.prototype.hasOwnProperty.call(SUITS,s))return null;return {rank:r,suit:CODES[s],text:rank(r)+SUITS[s]};}
 function cards(a,min,max){if(!Array.isArray(a)||a.length<min||a.length>max)return null;const out=[];for(let i=0;i<a.length;i++){const c=card(get(a,String(i)));if(!c)return null;out.push(c)}return out;}
 const faces=a=>a.map(c=>c.text).join(', '),ids=a=>a.map(c=>['S','H','D','C'].indexOf(c.suit)*13+c.rank-2);
 const category=id=>Object.prototype.hasOwnProperty.call(NAMES,id)?NAMES[id]:null;
 function bjValue(a){let value=a.reduce((n,c)=>n+(c.rank===14?1:Math.min(10,c.rank)),0),soft=a.some(c=>c.rank===14)&&value+10<=21;if(soft)value+=10;return {value,soft};}
 function blackjack(s){
  if(get(s,'version')!==2)return null;const p=cards(get(get(s,'player'),'cards'),2,12),ec=get(get(s,'emerald'),'cards'),up=card(get(ec,'0'));if(!p||!up)return null;
  const {value,soft}=bjValue(p),natural=p.length===2&&value===21,head='Your visible '+faces(p)+' make '+(soft?'soft ':'hard ')+value+'; I’m showing '+up.text+'. ';
  let fact;
  if(value>21)fact='That is a bust: crossing 21 ends your round before I draw again.';
  else if(natural)fact='Ace plus a ten-value card is natural Blackjack, stronger than an ordinary multi-card 21; two naturals push.';
  else if(value===21)fact='This is an ordinary 21, not a two-card natural. Reaching 21 ends your turn, but a revealed opposing 21 can still push.';
  else if(soft)fact='Your Ace can fall from 11 to 1, so one hit cannot bust this soft hand. Stand still ends your turn; softness is not a promise of a win.';
  else if(value<=11)fact='Even a ten-value draw fits below or at 21 from here. Taking a card changes the hand, not my still-hidden total.';
  else fact='Without a usable 11-point Ace, a draw worth more than '+(21-value)+' busts this hand. Standing keeps '+value+' and lets my fixed draw rule resolve.';
  const winner=get(s,'winner'),end=winner==='player'?' Your completed round won; its saved Friendship reward pays only once.':winner==='emerald'?' My completed round won; the saved Friendship reward still pays only once.':winner==='push'||winner==='tie'?' The completed round pushed: no match point, and one saved Friendship reward.':get(get(s,'emerald'),'hidden')===true?' My other card stays unknown; I stand on 17, including soft 17.':'';
  return head+fact+end;
 }
 const point=c=>c.rank===14?1:c.rank>=10?0:c.rank,total=a=>a.reduce((n,c)=>n+point(c),0)%10;
 function bankerDraw(b,x){return x===null?b<=5:b<=2||b===3&&x!==8||b===4&&x>=2&&x<=7||b===5&&x>=4&&x<=7||b===6&&(x===6||x===7);}
 function baccarat(s){
  const r=get(s,'round'),p=cards(get(r,'player'),2,3),b=cards(get(r,'banker'),2,3);if(!p||!b)return null;const pi=total(p.slice(0,2)),bi=total(b.slice(0,2)),natural=pi>=8||bi>=8,pt=p.length===3?point(p[2]):null,bt=b.length===3?point(b[2]):null;
  if((pt!==null)!==(!natural&&pi<=5)||(bt!==null)!==(!natural&&bankerDraw(bi,pt)))return null;
  const pf=total(p),bf=total(b),player=pt===null?'Player starts '+pi+' and stands at '+pf:'Player starts '+pi+', draws a '+pt+'-value third card and finishes '+pf,banker=bt===null?'Banker starts '+bi+' and stands at '+bf:'Banker starts '+bi+', draws a '+bt+'-value third card and finishes '+bf;
  const rule=natural?' An initial 8 or 9 stops both hands: no third cards.':pt===null?' Player stood on 6 or 7; Banker therefore draws below 6.':bi<=2?' Banker’s initial 0–2 draws regardless of Player’s third-card value.':bi===3?' Banker’s initial 3 draws unless Player’s third card is 8.':bi===4?' Banker’s initial 4 draws only against a Player third card worth 2–7.':bi===5?' Banker’s initial 5 draws only against a Player third card worth 4–7.':bi===6?' Banker’s initial 6 draws only against a Player third card worth 6 or 7.':' Banker stands on an initial 7.';
  return player+'; '+banker+'. '+(pf===bf?'Equal '+pf+' totals push.':pf>bf?'Player’s '+pf+' beats Banker’s '+bf+'.':'Banker’s '+bf+' beats Player’s '+pf+'.')+rule+' This completed free round earns one FP, never again on redisplay.';
 }
 function highLow(s){
  const phase=get(s,'phase'),remaining=get(s,'remaining');if(!whole(remaining)||remaining>51)return null;
  if(phase==='prediction'){if(remaining===0)return null;const c=card(get(s,'current')),guess=get(s,'emeraldGuess');if(!c||!['higher','lower'].includes(guess))return null;return 'The visible card is '+c.text+'; Ace is high. I have already committed to '+guess+', but your Higher or Lower choice is independent. Equal ranks reward neither guess; my choice does not reveal the next card.';}
  if(phase!=='result')return null;const r=get(s,'round'),from=card(get(r,'from')),next=card(get(r,'next')),pg=get(r,'playerGuess'),eg=get(r,'emeraldGuess'),xp=get(r,'rawXp')??get(s,'rawXp');if(!from||!next||!['higher','lower'].includes(pg)||!['higher','lower'].includes(eg)||![10,25].includes(xp))return null;
  const delta=next.rank-from.rank,pc=delta!==0&&(delta>0?pg==='higher':pg==='lower'),ec=delta!==0&&(delta>0?eg==='higher':eg==='lower');
  const head=rank(from.rank)+' followed by '+rank(next.rank)+': '+(delta===0?'equal ranks':delta>0?'the next rank is higher':'the next rank is lower')+'. You chose '+pg+'; I chose '+eg+'. ';
  const award=delta===0?'Equal ranks mean no XP or FP.':pc&&ec?'Both guesses were correct: '+xp+' base player XP and one FP before existing bonuses.':pc?'Only your guess was correct: '+xp+' base player XP before existing bonuses, no FP.':ec?'Only my guess was correct: one FP, no player XP.':'Both guesses missed: no XP or FP.';
  const shoe=remaining===0?' The shoe is empty; Next begins a new shoe without paying this receipt again.':' There are '+remaining+' unseen cards left in this shoe; Next keeps that shoe without paying this receipt again.';
  return head+award+shoe;
 }
 function drawPoker(s){
  const hand=cards(get(s,'hand'),5,5),target=category(get(get(s,'target'),'id')),phase=get(s,'phase');if(!hand||!target||!['holding','settled'].includes(phase))return null;
  const result=poker()?.evaluate(ids(hand)),made=category(result?.category);if(!made)return null;
  if(phase==='settled')return 'Our visible '+faces(hand)+' finished as '+made+'. The selected target was '+target+'. '+(made===target?'That exact target matched; its bonus belongs to this saved settlement.':'The target did not match; only the attained hand’s saved reward applies.')+' Looking at the hand again never pays another reward.';
  const held=get(s,'held');if(!Array.isArray(held)||held.length!==5)return null;const kept=[],replaced=[];for(let i=0;i<5;i++){const flag=get(held,String(i));if(typeof flag!=='boolean')return null;(flag?kept:replaced).push(hand[i]);}
  const hold=kept.length===5?'All five are held: Submit keeps the hand unchanged.':kept.length===0?'Nothing is held; the one redraw replaces all five visible cards.':'You are keeping '+faces(kept)+' and replacing '+faces(replaced)+' in the one redraw.';
  return 'Our target is '+target+'; showing '+faces(hand)+' currently makes '+made+'. '+hold+' A target is not a forecast: the completed shared hand’s saved receipt decides its reward.';
 }
 function strictPoker(s){
  if(get(s,'receipt'))return null;const p=cards(get(s,'player'),2,2),board=cards(get(s,'community'),0,5),street=get(s,'street'),actor=get(s,'actor'),pot=get(s,'pot'),call=get(s,'toCall');if(!p||!board||!['preflop','flop','turn','river'].includes(street)||!['player','emerald','dealer'].includes(actor)||!whole(pot)||!whole(call))return null;
  const pair=p[0].rank===p[1].rank,suited=p[0].suit===p[1].suit,starting=pair?'a pocket pair':suited?'suited starting cards':'offsuit starting cards',head='Your '+faces(p)+' are '+starting+'. ';
  const visible=board.length>=3?'The '+street+' shows '+faces(board)+'; your best visible five-card category is '+category(strict()?.evaluate(ids([...p,...board]))?.category)+'. ':'Pre-flop has no community cards yet; a starting hand is not a made five-card result. ';
  if(actor==='emerald')return head+visible+'It is my betting turn. My hole cards stay private; these visible facts do not tell you my decision.';
  if(actor==='dealer')return head+visible+'Bets are matched in a '+pot+'-chip pot. '+(street==='river'?'Showdown can reveal the saved hands.':'The next Reveal button adds the next shared street.')+' Neither action predicts the unseen cards.';
  const stack=get(get(s,'stacks'),'0'),price=call===0?'There is nothing to match: Check commits no extra chips.':'Matching costs '+call+' chips into the current '+pot+'-chip pot'+(whole(stack)?'; that leaves '+Math.max(0,stack-call)+' of your '+stack+' chips':'')+'.';
  return head+visible+price+' Use the enabled betting buttons; my hidden hand is not evidence for a guaranteed win.';
 }
 function balatro(s){
  const selected=cards(get(s,'selection'),1,6),p=get(s,'preview'),name=get(p,'name'),chips=get(p,'chips'),mult=get(p,'mult'),hands=get(s,'hands'),discards=get(s,'discards');if(!selected||typeof name!=='string'||name.length>60||!finite(chips)||!finite(mult)||!finite(chips*mult)||!whole(hands)||!whole(discards))return null;
  const base='Base: '+name+' — '+number(chips)+' Chips × '+number(mult)+' Mult = '+number(chips*mult)+'. Cards, Jokers and random effects resolve when played. ';
  const budget=hands===1?'This is your last hand; '+discards+' discards remain, so compare the visible preview before committing.':hands+' hands and '+discards+' discards remain; '+(discards===0?'there is no discard left to search for another pattern.':'a discard searches without spending one of those hands.');
  return base+'Visible selection: '+faces(selected)+'. '+budget+' Hidden cards are not promises.';
 }
 function line(game,state){try{if(!GAMES.includes(game)||!state)return null;const text=game==='balatro'?balatro(state):game==='blackjack'?blackjack(state):game==='baccarat'?baccarat(state):game==='high-low'?highLow(state):game==='poker'?drawPoker(state):strictPoker(state);return typeof text==='string'&&text.length<=MAX_REPLY?text:null;}catch(_){return null;}}
 // Only called by the private adapter for a freshly accepted durable event.
 // This function alone is not an admission authority; the host rechecks the
 // exact current public source, foreground context and bounded highwater.
 function nativeEventLine(game,event){try{const s=get(event,'after'),action=get(event,'action'),done=get(event,'completed')===true;if(!s)return null;let text=null;
  if(game==='blackjack'&&done){const p=cards(get(get(s,'player'),'cards'),2,12),e=cards(get(get(s,'emerald'),'cards'),2,12),winner=get(s,'winner');if(!p||!['player','emerald','tie','push'].includes(winner))return null;const pv=bjValue(p).value;if(pv>21&&winner==='emerald')text='Your '+pv+' is a bust. You lose this round.';else if(e){const ev=bjValue(e).value,pn=p.length===2&&pv===21,en=e.length===2&&ev===21,actual=ev>21?'player':pn!==en?(pn?'player':'emerald'):pv===ev?'tie':pv>ev?'player':'emerald';if((winner==='push'?'tie':winner)!==actual)return null;text='You finish '+pv+'; Emerald finishes '+ev+'. '+(actual==='tie'?'Equal-strength hands: this round is a push.':actual==='player'?'You win this round.':'You lose this round.')}}
  else if(game==='blackjack'){const fact=line(game,s);if(fact)text=(action==='hit'?'You hit. ':action==='deal'?'Cards dealt. ':'')+fact}
  else if(game==='strict-poker'){const receipt=get(s,'receipt'),last=get(s,'lastAction'),pot=get(s,'pot');if(receipt){const winner=get(receipt,'winner'),reason=get(receipt,'reason'),amount=get(receipt,'pot');if(!['player','emerald','tie'].includes(winner)||!['fold','showdown'].includes(reason)||!whole(amount))return null;const result=winner==='player'?'You won':winner==='emerald'?'Emerald won':'You split';if(reason==='fold')text=(get(last,'actor')==='player'?'You folded. ':'Emerald folded. ')+result+' the '+amount+'-chip fictional pot.';else{const p=category(get(get(receipt,'playerRank'),'category')),e=category(get(get(receipt,'emeraldRank'),'category'));if(p&&e)text='Showdown: your '+p+' against Emerald’s '+e+'. '+result+' the '+amount+'-chip fictional pot.'}}
   else if(last&&whole(pot)){const actor=get(last,'actor'),type=get(last,'type'),amount=get(last,'amount'),verbs={check:'checked',call:'called',raise:'raised',fold:'folded'};if(['player','emerald'].includes(actor)&&ownKey(verbs,type)&&whole(amount))text=(actor==='player'?'You ': 'Emerald ')+verbs[type]+(['call','raise'].includes(type)?' '+amount+' fictional chips':'')+'. The public pot contains '+pot+' fictional chips.';else if(actor==='dealer'&&type==='reveal'){const board=cards(get(s,'community'),3,5);if(board)text='The '+get(s,'street')+' is revealed: '+faces(board)+'. The public pot contains '+pot+' fictional chips.'}}
   else text=line(game,s)}
  else if(game==='slots'){if(!done||get(s,'phase')!=='result')return null;const reels=get(s,'reels'),last=get(s,'last');if(!Array.isArray(reels)||reels.length!==3||!last)return null;const middle=[];for(const reel of reels){if(get(reel,'locked')!==true)return null;const strip=get(reel,'symbols');if(!Array.isArray(strip)||strip.length!==3)return null;middle.push(get(strip,'1'))}const model=slots(),id=get(last,'payout');if(!model||model.payoutFor(middle)!==id)return null;const names={spade:'Spades',joker:'Joker',coin:'Coin',seven:'Seven',xp:'XP',Emerald:'Emerald'},shown=middle.map(k=>names[k]);if(shown.some(x=>!x))return null;text=shown[0]+', '+shown[1]+' and '+shown[2]+(middle.every(x=>x===middle[0])?'! ':'. ')+(id==='triple-spade'?'Triple Spades':model.PAYOUTS[id].name)+'.'}
  else if(game==='darts'){const who=get(s,'actor'),hit=get(s,'hit'),left=get(s,'remaining'),visit=get(s,'visit');if(!['player','emerald'].includes(who)||!hit||!whole(left)||left>501)return null;const name=who==='player'?'Your':'Emerald’s';if(get(s,'fresh180')===true&&get(visit,'result')==='scored'&&get(visit,'score')===180)text='ONE HUNDRED AND EIIIIIGHTYYYY! '+name+' completed visit scored 180.';else{const label=darts()?.label(hit);if(typeof label!=='string')return null;text=(who==='player'?'You hit ':'Emerald hit ')+label+'. ';if(visit&&typeof get(visit,'result')==='string'&&get(visit,'result').startsWith('bust-'))text+='That visit busts; '+name.toLowerCase()+' score returns to '+left+'.';else if(get(visit,'result')==='checkout')text+=(who==='player'?'You checked out':'Emerald checked out')+' on a double and won the leg.';else text+=left+' remaining.'}}
  else if(game==='balatro'){const result=get(s,'lastResult'),name=get(result,'name'),score=get(s,'score'),target=get(s,'target');if(action==='play'&&typeof name==='string'&&name.length>0&&name.length<=60&&finite(get(result,'total'))&&finite(score)&&finite(target))text='Your played '+name+' scored '+number(get(result,'total'))+'. The blind total is '+number(score)+' against '+number(target)+'. '+(['won','boss-rush-won'].includes(get(s,'phase'))?'You completed this run.':get(s,'phase')==='lost'?'This run ended.':score>=target?'This blind is complete.':'');else if(action==='start-blind'&&finite(target))text='This blind has started with a target of '+number(target)+'.';else if(action==='discard'&&whole(get(s,'discards')))text='You discarded from the current hand. '+get(s,'discards')+' discards remain.'}
  else if(get(event,'source')==='games'){const title=get(s,'name'),milestone=get(s,'milestone');if(done&&typeof title==='string'&&title.length>0&&title.length<=100&&whole(milestone)&&milestone>=1&&milestone<=10)text=title+': milestone '+milestone+' is now saved. Its existing native reward was credited once.'}
  else text=line(game,s);
  return typeof text==='string'&&text.length<=MAX_REPLY?text:null;}catch(_){return null}}
 function ownKey(o,k){return Object.prototype.hasOwnProperty.call(o,k)}
 return Object.freeze({GAMES,MAX_REPLY,line,nativeEventLine});
});
