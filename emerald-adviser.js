/* Emerald v2: read-only, bounded local advice and cumulatively unlocked quotes.
 * Never reads hidden ranks, the deck, draw order, game seed, RNG or future plays.
 * Quote conditions are checked from current public facts, not queued assertions.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BOEmerald=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const DEFAULT_TIPS=Object.freeze({first:true,second:true}),MAX_POOL=12,MAX_SELECTION=6;
 function number(n){return Number.isFinite(n)?String(Math.round(n*100000)/100000):'—'}
 function validLevel(n){return Number.isInteger(n)&&n>=1&&n<=100}
 // Keep the game/action predicate narrow: chat and public table advice use it.
 function visible(s){return !!s&&validLevel(s.level)&&s.level>=5&&s.page==='game'&&!s.survey&&!s.protected&&!s.suspended&&!!s.run}
 function presentationVisible(s){return visible(s)||!!s&&validLevel(s.level)&&s.level>=39&&['home','game'].includes(s.page)&&!s.survey&&!s.protected&&!s.suspended}
 function validateTips(v){try{if(!v||typeof v!=='object'||![null,Object.prototype].includes(Object.getPrototypeOf(v)))return false;const keys=Reflect.ownKeys(v);if(keys.length!==2||!keys.every(k=>k==='first'||k==='second'))return false;return keys.every(k=>{const d=Object.getOwnPropertyDescriptor(v,k);return d&&Object.prototype.hasOwnProperty.call(d,'value')&&d.enumerable===true&&typeof d.value==='boolean'})}catch(_){return false}}
 function tips(v){return validateTips(v)?{first:v.first,second:v.second}:{...DEFAULT_TIPS}}
 function visibleCards(run){const out=[];for(const c of Array.isArray(run?.hand)?run.hand:[]){if(!c||c.faceDown)continue;const item={};for(const k of ['id','rank','suit','enhancement','edition','seal','debuffed'])if(Object.prototype.hasOwnProperty.call(c,k))item[k]=c[k];out.push(item)}return out}
 function publicRun(s){const r=s.run||{},out={hand:visibleCards(r),levels:{...(r.levels||{})},jokers:(r.jokers||[]).map(j=>({...j})),playerLevel:s.level};
  // These are displayed run/effect facts used by the pure base-hand evaluator.
  // In particular, do not spread the original run or copy canonical deck piles.
  for(const k of ['phase','progressionEnabled','potions','potionNow','blindIndex','bossId','bossDisabled','blindTags','stake','deckId','roundBlindLevelFactor','ante','round','roundHands'])if(Object.prototype.hasOwnProperty.call(r,k))out[k]=r[k];return out;
 }
 function selectionLimit(E,s){const r=publicRun(s);try{if(typeof E?.selectionLimit==='function'){const n=E.selectionLimit(r,s.level);if(Number.isInteger(n)&&n>=1)return Math.min(MAX_SELECTION,n)}}catch(_){}return s.level>=35?6:5}
 function selectedCards(s,run,max){const ids=Array.isArray(s.selected)?s.selected:[];if(!ids.length||ids.length>max||new Set(ids.map(String)).size!==ids.length)return null;const cards=ids.map(id=>run.hand.find(c=>String(c.id)===String(id)));return cards.every(Boolean)?cards:null}
 function recommendation(E,s){const run=publicRun(s),pool=run.hand.slice(0,MAX_POOL),max=selectionLimit(E,s);let best=null;
  // At most sum(C(12,k),k=1..6)=2,509 pure base previews. No cloned play calls.
  function visit(start,ids){if(ids.length){try{const p=E.preview(run,ids,{actualLevel:s.level}),score=p.chips*p.mult;if(Number.isFinite(score)&&(!best||score>best.score||score===best.score&&ids.length<best.ids.length))best={ids:ids.slice(),name:p.name,score}}catch(_){}}
   if(ids.length===max)return;for(let i=start;i<pool.length;i++){ids.push(pool[i].id);visit(i+1,ids);ids.pop()}}
  visit(0,[]);if(best)best.limited=run.hand.length>MAX_POOL;return best;
 }
 function frenzyInfo(s){const f=s?.frenzy||{},fallback=s?.level>=35?166:500,required=Number.isFinite(f.required)&&f.required>0?f.required:Number.isFinite(f.meterMax)&&f.meterMax>0?f.meterMax:Number.isFinite(f.max)&&f.max>0?f.max:fallback;
  return {active:s?.level>=33&&f.active===true,required,meterMax:Number.isFinite(f.meterMax)&&f.meterMax>0?f.meterMax:required,charge:Number.isFinite(f.charge)?f.charge:0,meter:Number.isFinite(f.meter)?f.meter:0,remaining:required-(Number.isFinite(f.charge)?f.charge:0),remainingMs:Number.isFinite(f.remainingMs)?Math.max(0,f.remainingMs):0};
 }
 function royalOnTable(E,s){if(!visible(s)||s.run.phase!=='play')return false;const r=publicRun(s),cards=selectedCards(s,r,selectionLimit(E,s));if(!cards)return false;
  // Prefer the engine's explicit public evaluator flag when available. With
  // older engines, require five literal visible Royal ranks of one suit.
  try{const p=E.preview(r,cards.map(c=>c.id),{actualLevel:s.level});if(typeof p.royalFlush==='boolean')return p.royalFlush}catch(_){return false}
  return ['S','H','D','C'].some(suit=>[10,11,12,13,14].every(rank=>cards.some(c=>c.rank===rank&&c.enhancement!=='stone'&&(c.suit===suit||c.enhancement==='wild'&&!c.debuffed))));
 }
 function ownLevel(s){if(Number.isInteger(s.pet?.level)&&s.pet.level>=1&&s.pet.level<=10)return s.pet.level;const total=Number.isInteger(s.pet?.totalWins)&&s.pet.totalWins>=0&&s.pet.totalWins<=415?s.pet.totalWins:0;return 1+[10,25,50,80,120,170,235,315,415].filter(n=>total>=n).length}
 function quoteEntries(E,s){if(!visible(s))return [];const out=[],add=(id,message)=>out.push({id:'second:'+id,source:'second',message}),l=s.level,e=ownLevel(s);
  add('table','Im sitting right here by the poker table!');add('team','Your Level is Level '+l+', and I’m level '+e+'! We make a great team!');
  if(l>=6){add('never','Never give up!');add('try','Try your best!');add('NEVER','NEVER GIVE UP!!!')}
  if(l>=7&&royalOnTable(E,s))add('royal','O-M-G!!! Thats a Royal Flush!');
  if(l>=9&&s.passiveReady===true)add('passive-ready','Don’t forget to activate your Passive Exp');
  if(l>=10&&Number.isFinite(s.run.money)&&s.run.money>=100)add('bank','You have over $100, when are you gonna spend it!?');
  if(l>=13)add('passive','Passive Exp... Great for knowledge about Balatro!');
  if(l>=22)add('interest','Ooh! Are you investing in your Exp and it’s getting bigger every second? I would watch movies and level up a bunch!');
  if(l>=25&&validLevel(s.faucetLevel))add('three','Your level is '+l+', the faucet’s level is '+s.faucetLevel+' and I’m level '+e+'!!! We three are the only ones on this poker table. All to ourselves!!!');
  if(l>=26&&s.faucetReady===true)add('faucet-ready','You can claim your faucet...');
  if(l>=30)add('virtual','You must claim your faucet, do ficcional surveys, and invest in stonks for in-game stuff and hope Bitcoin isn’t crashing... Fictional game only: virtual surveys, stonks and Bitcoin — never real money.');
  const f=frenzyInfo(s);if(l>=33){if(f.active)add('frenzy-active','FRENZY ACTIVATED!!! LETS GO!!!!!');else if(f.remaining>0&&f.remaining<=10)add('frenzy-near','Frenzy is nearly full, get ready for pure dopamine')}
  return out;
 }
 function quotes(E,s){return quoteEntries(E,s).map(x=>x.message)}
 function advice(E,state){const s=state||{},run=s.run;if(!visible(s))return {visible:false,messages:[],recommendation:null};
  const messages=[],out={visible:true,messages,recommendation:null};
  if(s.faucetReady===true)messages.push('Your faucet is ready! Claim it when you want your free game coins and XP.');
  const x=s.xp;if(x&&!x.capped&&Number.isFinite(x.required)&&x.required>0&&Number.isFinite(x.remaining)&&x.remaining>0&&x.remaining<=x.required*.1)messages.push('You’re nearly leveling up — '+number(x.remaining)+' XP to go!');
  if(run.phase==='play'){
   const publicR=publicRun(s),cards=selectedCards(s,publicR,selectionLimit(E,s)),hidden=(run.hand||[]).some(c=>c.faceDown);
   if(cards){try{const p=E.preview(publicR,cards.map(c=>c.id),{actualLevel:s.level});messages.push('Base: '+p.name+' — '+number(p.chips)+' Chips × '+number(p.mult)+' Mult = '+number(p.chips*p.mult)+'. Cards, Jokers and random effects resolve when played.')}catch(_){}}
   if(hidden)messages.push('Some cards are hidden. I won’t peek at them or guess their ranks.');
   out.recommendation=recommendation(E,s);
   if(out.recommendation){const r=out.recommendation;messages.push('Try looking for '+r.name+'! It leads my visible base-hand comparison'+(r.limited?' among the first 12 visible cards':'')+'. This is not a guaranteed best final score; card effects, Jokers and the Boss can change it.')}
   if(run.lastResult&&Number.isFinite(run.lastResult.total))messages.push('Your last hand actually scored '+number(run.lastResult.total)+' points'+(Number.isFinite(run.lastResult.chips)&&Number.isFinite(run.lastResult.mult)?' = '+number(run.lastResult.chips)+' Chips × '+number(run.lastResult.mult)+' Mult':'')+'.');
   if(Number.isFinite(run.target)&&Number.isFinite(run.score))messages.push('Blind target: '+number(run.target)+'. Still needed: '+number(Math.max(0,run.target-run.score))+' points.');
   if(run.blindIndex===2){try{const b=E.blindInfo(publicR);if(b.description)messages.push('Boss reminder: '+b.description)}catch(_){}}
   if(run.hands===1)messages.push('Last hand — take your time and check the Boss before you play. You’ve got this!');
  }else if(run.phase==='shop'){
   const items=(run.shop?.items||[]).filter(i=>!i.sold&&Number.isFinite(i.price)&&i.price>=0),offer=items.find(i=>i.type==='joker')||items[0];
   if(offer)messages.push('Shop check: '+offer.name+' costs $'+number(offer.price)+'. Read its effect and compare it with your build before buying.');
   messages.push('Your run’s bank cash powers money-based effects and interest. Compare an offer with your build before spending; a cheap offer isn’t always the right fit.');
  }else if(run.phase==='select')messages.push('Beat Small, Big and Boss without skipping to complete a whole Ante for cap progress.');
  else if(run.phase==='cashout')messages.push('Nice work! Don’t forget to cash out your blind reward.');
  else if(run.phase==='pack')messages.push('Check your free inventory slots and your build before choosing from this pack.');
  else if(run.phase==='won')messages.push('You did it! An excellent run — ready for endless?');
  else if(run.phase==='lost')messages.push('Every run teaches you something. I’ll be here for your next one!');
  messages.push('One thoughtful hand at a time. I’m cheering you on!');
  if(s.capabilities?.facts)messages.push('My favourite number is 6.','I love greenery and green places.','I like fictional casino scratch tickets in this game — not real-money gambling.');
  if(s.capabilities?.adviceRichness===1.2){const extra=[];if(run.phase==='play'&&Number.isFinite(run.target)&&Number.isFinite(run.score)&&run.hands>0)extra.push('A planning average is '+number(Math.max(0,run.target-run.score)/run.hands)+' points per remaining hand — not a prediction of your next score.');if(run.phase==='play')extra.push('Within the same scoring phase, earlier +Mult can help later ×Mult. Read each effect’s trigger before changing Joker order.');if(run.phase==='shop')extra.push('Check your free Joker and consumable slots before buying. You can keep your cash if nothing suits your build.');extra.push('No rush — we can work through this together. A careful choice matters more than a fast one.');messages.push(...extra.slice(0,Math.max(1,Math.ceil(messages.length*.2))))}
  return out;
 }
 function looker(E,s){if(!visible(s)||s.run.phase!=='play')return null;const r=recommendation(E,s);return r?{...r,message:'Try looking for a “'+r.name+'”. It leads my visible base-hand comparison'+(r.limited?' among the first 12 visible cards':'')+'.'}:null}
 function kinder(entries,s){const fp=Math.max(0,Math.min(1000,Number(s?.friendship?.fp)||0));if(!fp)return entries;return entries.map(entry=>{let h=2166136261;for(const c of entry.id)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%1000<fp?{...entry,message:entry.message+' I’m on your side — take your time.'}:entry})}
 function catalog(E,s,preference){if(s?.looker===true){const r=looker(E,s);return r?[{id:'looker:'+r.ids.map(String).join(','),source:'looker',message:r.message}]:[]}if(!presentationVisible(s))return [];const t=tips(preference===undefined?s.tips:preference),out=[];
  if(!visible(s)){
   // Home/collection/settings share page='home'. Never inspect a parked run,
   // readiness, money, Frenzy or selected cards while outside its game context.
   const add=(source,id,message)=>out.push({id:source+':menu:'+id,source,message});
   if(t.first){add('first','explore','Take your time exploring the game menus — I’ll keep you company.');add('first','score','Balatro tip: Chips × Mult makes your score. Read each effect before choosing.');add('first','fictional','Everything here uses fictional game currency. Nothing can be cashed out.');}
   if(t.second){add('second','hello','I’m right here with you!');add('second','team','Your Level is Level '+s.level+', and I’m level '+ownLevel(s)+'! We make a great team!');add('second','pace','One thing at a time. You’ve got this!');}
   return kinder(out,s);
  }
  if(t.first)advice(E,s).messages.forEach(message=>out.push({id:'first:'+message,source:'first',message}));
  if(t.second)out.push(...quoteEntries(E,s));return kinder(out,s);
 }
 return Object.freeze({DEFAULT_TIPS,MAX_POOL,MAX_SELECTION,advice,number,visible,presentationVisible,validateTips,tips,publicRun,selectionLimit,frenzyInfo,royalOnTable,quotes,looker,catalog});
});
