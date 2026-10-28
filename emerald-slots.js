/* Slots V1: pure, optional selected-slot ledger. No clocks, entropy, storage or
 * DOM are read here. Only explicit spin advances its PRIVATE seeded PRNG.
 * Reads/validation never draw. Rewards are proposals until the host atomically
 * commits the whole profile and paired native reward sources. All persisted
 * amounts are safe integer tenths, coin hundredths, or milliseconds. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOEmeraldSlots=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const MAX=Number.MAX_SAFE_INTEGER,MAX_TIME=8640000000000000,DAY_MS=86400000,TOKEN_MS=100000,TOKEN_CAP_MS=100000000;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0);
 const time=n=>count(n)&&n<=MAX_TIME;
 const seed=n=>Number.isInteger(n)&&n>0&&n<=4294967295;
 const record=o=>!!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
 function check(ok,message){if(!ok)throw Error(message)}
 function fields(o,keys){return record(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>{const d=Object.getOwnPropertyDescriptor(o,k);return d&&own(d,'value')&&d.enumerable===true})}
 function array(a,n){if(!Array.isArray(a)||Object.getPrototypeOf(a)!==Array.prototype||a.length!==n||Reflect.ownKeys(a).length!==n+1)return false;for(let i=0;i<n;i++){const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d||!own(d,'value')||!d.enumerable)return false}return true}
 function safe(n){check(n>=0n&&n<=BigInt(MAX),'Slots fixed-precision capacity would overflow.');return Number(n)}
 function add(a,b){return safe(BigInt(a)+BigInt(b))}
 function clone(o){return JSON.parse(JSON.stringify(o))}
 function equal(a,b){return JSON.stringify(a)===JSON.stringify(b)}
 function freeze(o){Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v)});return Object.freeze(o)}
 const SYMBOLS=freeze(['spade','joker','coin','seven','xp','Emerald']);
 const REELS=freeze([
  ['spade','spade','joker','coin','coin','joker','coin','spade','spade','Emerald','coin','spade','seven','spade','coin','spade','xp','xp','spade','spade','spade','spade','spade','coin','coin','xp','seven','coin','xp','spade','spade','coin','spade','xp','spade','joker'],
  ['joker','spade','coin','spade','spade','spade','spade','spade','xp','coin','coin','spade','spade','spade','spade','spade','xp','joker','xp','coin','coin','spade','coin','coin','seven','joker','xp','Emerald','spade','xp','spade','xp','spade','coin','coin','seven'],
  ['spade','spade','spade','spade','xp','seven','coin','spade','coin','spade','spade','coin','spade','spade','coin','xp','seven','xp','xp','spade','spade','coin','joker','spade','spade','coin','xp','coin','spade','Emerald','coin','spade','joker','spade','seven','coin']
 ]);
 const IDS=freeze(['none','triple-emerald','triple-seven','triple-joker','triple-xp','double-seven','triple-coin','triple-spade']);
 const CREDIT_KEYS=freeze(['xp10','fp10','coins100','medals10','sxp10']);
 const EFFECT_KEYS=freeze(['double-emerald-wins','six-xp','coins-17']);
 const EFFECT_IDS=freeze({'double-emerald-wins':'slots-double-emerald-wins','six-xp':'slots-six-xp','coins-17':'slots-coins-17'});
 const EFFECT_NAMES=freeze({'double-emerald-wins':'Double Emerald win counter','six-xp':'Six-times XP','coins-17':'All coins ×1.7'});
 function pay(name,xp10,fp10,coins10,medals10,sxp10){return {name,xp10,fp10,coins10,medals10,sxp10}}
 const PAYOUTS=freeze({
  none:pay('No matching payout',0,0,0,0,0),
  'triple-emerald':pay('Triple Emerald',363630,3630,3630,3630,3630),
  'triple-seven':pay('Triple 7',77770,2770,2770,2770,7770),
  'triple-joker':pay('Triple Joker',20000,2000,2000,2000,0),
  'triple-xp':pay('Triple XP',50000,300,300,300,3000),
  'double-seven':pay('Double 7',7777,277,277,277,777),
  'triple-coin':pay('Triple Coin',10000,1000,1500,1500,1500),
  'triple-spade':pay('Triple Spade',1000,30,20,20,100)
 });
 const TRIPLES=freeze({seven:'triple-seven',xp:'triple-xp',joker:'triple-joker',coin:'triple-coin',spade:'triple-spade'});
 const LEVEL_THRESHOLDS=freeze([0,100,1000,2000,3000,4000,5000,7000,9000,...Array.from({length:25},(_,i)=>11000+2000*i),80000,100000,150000,200000,250000,300000]);
 const SYMBOL_COUNTS=freeze(REELS.map(r=>Object.fromEntries(SYMBOLS.map(s=>[s,r.filter(x=>x===s).length]))));
 const zeroCounts=()=>Object.fromEntries(IDS.map(id=>[id,0]));
 const zeroCredits=()=>Object.fromEntries(CREDIT_KEYS.map(k=>[k,0]));
 function validCounts(o){return fields(o,IDS)&&IDS.every(k=>count(o[k]))}
 function validCredits(o){return fields(o,CREDIT_KEYS)&&CREDIT_KEYS.every(k=>count(o[k]))}
 function levelNumber(n){return Number.isInteger(n)&&n>=1&&n<=40}
 function progress(sxp10){
  check(count(sxp10),'Slots XP must be non-negative integer tenths.');let level=1;
  while(level<40&&sxp10>=LEVEL_THRESHOLDS[level]*10)level++;
  const capped=level===40,start10=LEVEL_THRESHOLDS[level-1]*10,next10=capped?null:LEVEL_THRESHOLDS[level]*10;
  return {level,capped,totalSxp10:sxp10,start10,next10,remaining10:capped?0:next10-sxp10,percent:capped?100:100*(sxp10-start10)/(next10-start10),speedFactor:(101-level)/100};
 }
 function payoutFor(line){
  check(array(line,3)&&line.every(s=>SYMBOLS.includes(s)),'Slots needs exactly three known middle-line symbols.');
  const wild=line.filter(s=>s==='Emerald').length;if(wild===3)return 'triple-emerald';
  let best='none';for(const [symbol,id] of Object.entries(TRIPLES))if(line.every(s=>s==='Emerald'||s===symbol)&&PAYOUTS[id].xp10>PAYOUTS[best].xp10)best=id;
  // Two wilds may become two7; one real7+one wild may also become Double7.
  // There must remain exactly one non7 after replacement, not three7.
  const sevens=line.filter(s=>s==='seven').length;
  if(sevens<=2&&sevens+wild>=2&&(line.some(s=>s!=='seven'&&s!=='Emerald')||wild>2-sevens)&&PAYOUTS['double-seven'].xp10>PAYOUTS[best].xp10)best='double-seven';
  return best;
 }
 // This is an odds/count table, not a spin or RNG operation.
 const OUTCOME_COUNTS=(()=>{const out=zeroCounts();for(const a of REELS[0])for(const b of REELS[1])for(const c of REELS[2])out[payoutFor([a,b,c])]++;return freeze(out)})();
 function xpAllowed(source){return !(/^(?:emerald-poker|poker|strict-poker)(?:$|[-:])/.test(source)||source==='slots:triple-emerald'||source==='slots:triple-seven')}
 function credits(id,xpBoosted,coinsBoosted){const p=PAYOUTS[id],x=xpBoosted?6:1;return {xp10:p.xp10*x,fp10:p.fp10,coins100:p.coins10*(coinsBoosted?17:10),medals10:p.medals10,sxp10:p.sxp10*x}}
 function computedTotals(s){
  const out=Object.fromEntries(CREDIT_KEYS.map(k=>[k,0n]));
  for(const id of IDS){const p=PAYOUTS[id],n=BigInt(s.counts[id]),x=BigInt(s.xpBoosted[id]),c=BigInt(s.coinsBoosted[id]);out.xp10+=BigInt(p.xp10)*(n+5n*x);out.sxp10+=BigInt(p.sxp10)*(n+5n*x);out.fp10+=BigInt(p.fp10)*n;out.medals10+=BigInt(p.medals10)*n;out.coins100+=BigInt(p.coins10)*(10n*n+7n*c)}
  return Object.fromEntries(CREDIT_KEYS.map(k=>[k,safe(out[k])]));
 }
 function lockAt(r,i){return r.startedAtMs+Math.ceil(1666*(101-r.level)*i/100)}
 const PENDING_FIELDS=['serial','startedAtMs','stops','level','ownEmeraldMax'];
 const RECEIPT_FIELDS=['id','serial','startedAtMs','atMs','stops','level','ownEmeraldMax','payout','source','xpBoosted','coinsBoosted','credits'];
 const STATE_FIELDS=['version','revision','rng','createdAtMs','clockAtMs','creditedDay','freeSpins','tokenMs','spinsStarted','spinsSettled','freeSpent','tokensSpent','counts','xpBoosted','coinsBoosted','emeraldMaxSpins','totals','effects','pending','last'];
 function validSpin(r,keys){return fields(r,keys)&&count(r.serial)&&r.serial>0&&time(r.startedAtMs)&&array(r.stops,3)&&r.stops.every(x=>Number.isInteger(x)&&x>=0&&x<36&&!Object.is(x,-0))&&levelNumber(r.level)&&typeof r.ownEmeraldMax==='boolean'&&time(lockAt(r,3))}
 function validate(s){try{
  if(!fields(s,STATE_FIELDS)||s.version!==1||!seed(s.rng)||!time(s.createdAtMs)||!time(s.clockAtMs)||s.clockAtMs<s.createdAtMs)return false;
  if(!['revision','creditedDay','freeSpins','tokenMs','spinsStarted','spinsSettled','freeSpent','tokensSpent','emeraldMaxSpins'].every(k=>count(s[k]))||s.tokenMs>TOKEN_CAP_MS||s.creditedDay!==Math.floor(s.clockAtMs/DAY_MS))return false;
  if(!validCounts(s.counts)||!validCounts(s.xpBoosted)||!validCounts(s.coinsBoosted)||!validCredits(s.totals))return false;
  if(BigInt(s.freeSpins)!==100n*BigInt(s.creditedDay-Math.floor(s.createdAtMs/DAY_MS)+1)-BigInt(s.freeSpent)||BigInt(s.freeSpent)+BigInt(s.tokensSpent)!==BigInt(s.spinsStarted))return false;
  if(IDS.reduce((n,k)=>n+BigInt(s.counts[k]),0n)!==BigInt(s.spinsSettled)||BigInt(s.revision)<BigInt(s.spinsStarted)+BigInt(s.spinsSettled))return false;
  if(IDS.some(k=>s.xpBoosted[k]>s.counts[k]||s.coinsBoosted[k]>s.counts[k]||(!xpAllowed('slots:'+k)||k==='none')&&s.xpBoosted[k]!==0||k==='none'&&s.coinsBoosted[k]!==0))return false;
  const total=computedTotals(s);if(!CREDIT_KEYS.every(k=>s.totals[k]===total[k]))return false;
  if(s.emeraldMaxSpins>s.counts['triple-emerald']||!fields(s.effects,EFFECT_KEYS))return false;
  const effectCounts={'double-emerald-wins':s.counts['triple-emerald']-s.emeraldMaxSpins,'six-xp':s.emeraldMaxSpins,'coins-17':add(s.counts['triple-seven'],s.counts['double-seven'])};
  for(const key of EFFECT_KEYS){const e=s.effects[key];if(!fields(e,['count','expiresAtMs'])||!count(e.count)||e.count!==effectCounts[key]||!time(e.expiresAtMs)||(e.count===0?e.expiresAtMs!==0:e.expiresAtMs<=s.createdAtMs))return false}
  if(s.spinsSettled===0){if(s.last!==null||s.emeraldMaxSpins!==0)return false}else{
   const r=s.last;if(!validSpin(r,RECEIPT_FIELDS)||r.serial!==s.spinsSettled||r.id!=='slots:'+r.serial||r.startedAtMs<s.createdAtMs||r.atMs!==lockAt(r,3)||r.atMs>s.clockAtMs||!own(PAYOUTS,r.payout)||r.payout!==payoutFor(r.stops.map((n,i)=>REELS[i][n]))||r.source!=='slots:'+r.payout||typeof r.xpBoosted!=='boolean'||typeof r.coinsBoosted!=='boolean'||!validCredits(r.credits))return false;
   if(!CREDIT_KEYS.every(k=>r.credits[k]===credits(r.payout,r.xpBoosted,r.coinsBoosted)[k])||s.counts[r.payout]===0||r.xpBoosted&&s.xpBoosted[r.payout]===0||r.coinsBoosted&&s.coinsBoosted[r.payout]===0||!r.xpBoosted&&s.xpBoosted[r.payout]===s.counts[r.payout]||!r.coinsBoosted&&s.coinsBoosted[r.payout]===s.counts[r.payout])return false;
   if(r.level!==progress(s.totals.sxp10-r.credits.sxp10).level)return false;
   if(r.payout==='triple-emerald'){const key=r.ownEmeraldMax?'six-xp':'double-emerald-wins';if(s.effects[key].count===0||s.effects[key].expiresAtMs<r.atMs+36363000)return false}
   if(['triple-seven','double-seven'].includes(r.payout)&&s.effects['coins-17'].expiresAtMs<r.atMs+(r.payout==='triple-seven'?7777000:777700))return false;
  }
  if(s.pending===null){if(s.spinsStarted!==s.spinsSettled)return false}else{
   const p=s.pending;if(!validSpin(p,PENDING_FIELDS)||p.serial!==s.spinsSettled+1||s.spinsStarted!==p.serial||p.startedAtMs<s.createdAtMs||p.startedAtMs>s.clockAtMs||s.last&&p.startedAtMs<s.last.atMs||p.level!==progress(s.totals.sxp10).level)return false;
  }
  return true;
 }catch(_){return false}}
 function copy(s){check(validate(s),'Slots save needs attention. No spin or reward was changed.');return clone(s)}
 function create(rng,now){
  check(seed(rng),'Slots requires its own nonzero uint32 seed.');check(time(now),'Invalid absolute Slots creation time.');
  return {version:1,revision:0,rng,createdAtMs:now,clockAtMs:now,creditedDay:Math.floor(now/DAY_MS),freeSpins:100,tokenMs:0,spinsStarted:0,spinsSettled:0,freeSpent:0,tokensSpent:0,counts:zeroCounts(),xpBoosted:zeroCounts(),coinsBoosted:zeroCounts(),emeraldMaxSpins:0,totals:zeroCredits(),effects:Object.fromEntries(EFFECT_KEYS.map(k=>[k,{count:0,expiresAtMs:0}])),pending:null,last:null};
 }
 // Nonzero xorshift32 has2^32-1 equiprobable words over its full cycle.
 // Subtract1, reject the final3 words, then modulo36: no modulo bias. Reels
 // are sampled separately; independent uniform stops are the disclosed strip
 // interpretation. A finite seeded PRNG is NOT secure or physical randomness.
 function step(s){let x=s;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0}
 function draw(s){const stops=[];for(let i=0;i<3;i++){let word;do{s=step(s);word=s-1}while(word>=4294967292);stops.push(word%36)}return {rng:s,stops}}
 function elapse(s,now){
  const at=Math.max(now,s.clockAtMs),day=Math.floor(at/DAY_MS),days=day-s.creditedDay;
  // If free spins were already available, NONE of this gap earns tokens. If
  // zero, the next UTC midnight grants free spins and closes eligibility.
  if(s.freeSpins===0){const until=Math.min(at,(s.creditedDay+1)*DAY_MS);s.tokenMs=Math.min(TOKEN_CAP_MS,s.tokenMs+until-s.clockAtMs)}
  if(days)s.freeSpins=add(s.freeSpins,safe(BigInt(days)*100n));s.clockAtMs=at;s.creditedDay=day;
 }
 function extend(s,key,at,duration){const e=s.effects[key],until=Math.max(e.expiresAtMs,at)+duration;check(time(until),'Slots event expiry would exceed safe absolute time.');e.count=add(e.count,1);e.expiresAtMs=until}
 function effectsUnchecked(s,now,source){
  const at=s?Math.max(now,s.clockAtMs):now,active=k=>!!s&&s.effects[k].count>0&&s.effects[k].expiresAtMs>at;
  const events=EFFECT_KEYS.filter(active).map(k=>({id:EFFECT_IDS[k],name:EFFECT_NAMES[k],expiresAtMs:s.effects[k].expiresAtMs,remainingMs:s.effects[k].expiresAtMs-at}));
  return {xpMultiplier:active('six-xp')&&xpAllowed(source)?6:1,coinMultiplier:active('coins-17')?1.7:1,coinNumerator:active('coins-17')?17:10,coinDenominator:10,emeraldWinMultiplier:active('double-emerald-wins')?2:1,events};
 }
 function effectsAt(s,now,source='other'){check(time(now),'Invalid absolute Slots effect time.');check(typeof source==='string'&&source.length<=240,'Invalid Slots XP reward source.');check(s===undefined||validate(s),'Invalid supplied Slots event ledger.');return effectsUnchecked(s,now,source)}
 function scaleCoinsHundredths(amount,s,now){check(count(amount),'Coin amounts must be integer hundredths.');const effect=effectsAt(s,now);return safe((BigInt(amount)*BigInt(effect.coinNumerator)+5n)/10n)}
 function move(s,request,expectedRevision,now,options){
  const next=copy(s);check(count(expectedRevision)&&expectedRevision===s.revision,'Slots revision changed. Read the current saved machine.');check(time(now),'Invalid absolute Slots action time.');check(fields(request,['type'])&&['spin','settle','checkpoint'].includes(request.type),'Invalid Slots action.');
  const type=request.type;if(type==='spin')check(fields(options,['ownEmeraldMax'])&&typeof options.ownEmeraldMax==='boolean','A spin needs the actual Emerald MAX snapshot.');else check(options===undefined,'Unexpected Slots action options.');
  elapse(next,now);let receipt=null;
  if(type==='spin'){
   check(!next.pending,'Finish the saved pending spin before starting another.');check(next.freeSpins>0||next.tokenMs>=TOKEN_MS,'No free spin or complete SpinToken is available.');
   const level=progress(next.totals.sxp10).level,drawn=draw(next.rng),serial=add(next.spinsStarted,1),p={serial,startedAtMs:next.clockAtMs,stops:drawn.stops,level,ownEmeraldMax:options.ownEmeraldMax};check(time(lockAt(p,3)),'This spin cannot finish within the safe clock range.');
   if(next.freeSpins>0){next.freeSpins--;next.freeSpent=add(next.freeSpent,1)}else{next.tokenMs-=TOKEN_MS;next.tokensSpent=add(next.tokensSpent,1)}
   next.spinsStarted=serial;next.rng=drawn.rng;next.pending=p;
  }else if(type==='settle'){
   const p=next.pending;check(p&&next.clockAtMs>=lockAt(p,3),'The saved reels must all lock before settling.');const at=lockAt(p,3),id=payoutFor(p.stops.map((n,i)=>REELS[i][n]));
   // Award at the actual third lock, NOT reopening time. Use the OLD event
   // ledger before this action's high-water checkpoint/brand-new effect.
   const effect=effectsUnchecked({...s,clockAtMs:Math.min(s.clockAtMs,at)},at,'slots:'+id),xpBoosted=id!=='none'&&effect.xpMultiplier===6,coinsBoosted=id!=='none'&&effect.coinNumerator===17;
   receipt={id:'slots:'+p.serial,serial:p.serial,startedAtMs:p.startedAtMs,atMs:at,stops:p.stops.slice(),level:p.level,ownEmeraldMax:p.ownEmeraldMax,payout:id,source:'slots:'+id,xpBoosted,coinsBoosted,credits:credits(id,xpBoosted,coinsBoosted)};
   next.counts[id]=add(next.counts[id],1);if(xpBoosted)next.xpBoosted[id]=add(next.xpBoosted[id],1);if(coinsBoosted)next.coinsBoosted[id]=add(next.coinsBoosted[id],1);
   if(id==='triple-emerald'){if(p.ownEmeraldMax){next.emeraldMaxSpins=add(next.emeraldMaxSpins,1);extend(next,'six-xp',at,36363000)}else extend(next,'double-emerald-wins',at,36363000)}
   if(id==='triple-seven'||id==='double-seven')extend(next,'coins-17',at,id==='triple-seven'?7777000:777700);
   next.spinsSettled=p.serial;next.last=receipt;next.pending=null;next.totals=computedTotals(next);
  }
  if(equal(next,s))return {state:next,changed:false,completed:false,receipt:null};next.revision=add(next.revision,1);check(validate(next),'Invalid Slots transition; no proposal was committed.');return {state:next,changed:true,completed:type==='settle',receipt:receipt?clone(receipt):null};
 }
 function rewardTotals(s){check(validate(s),'Invalid Slots reward source ledger.');return {...s.totals}}
 function validateProfile(p){
  check(record(p),'Slots needs an ordinary profile.');const d=Object.getOwnPropertyDescriptor(p,'emeraldSlots');if(d)check(own(d,'value')&&d.enumerable&&validate(d.value),'Invalid optional canonical Slots ledger.');return true;
 }
 function publicState(s,now){
  check(validate(s),'Slots save needs attention.');check(time(now),'Invalid absolute Slots display time.');const at=Math.max(now,s.clockAtMs),r=s.pending||s.last,pendingReady=!!s.pending&&at>=lockAt(s.pending,3);
  const reels=[0,1,2].map(i=>{const locked=!!r&&(!s.pending||at>=lockAt(r,i+1));return {locked,lockAtMs:s.pending?lockAt(r,i+1):null,symbols:locked?[REELS[i][(r.stops[i]+35)%36],REELS[i][r.stops[i]],REELS[i][(r.stops[i]+1)%36]]:null}});
  return {version:1,revision:s.revision,phase:s.pending?(pendingReady?'ready':'spinning'):s.last?'result':'empty',pendingReady,reels,freeSpins:s.freeSpins,tokens:s.tokenMs/TOKEN_MS,tokenMs:s.tokenMs,tokenCap:1000,canSpin:!s.pending&&(s.freeSpins>0||s.tokenMs>=TOKEN_MS),nextDailyAtMs:(s.creditedDay+1)*DAY_MS,regenerating:s.freeSpins===0,spinsStarted:s.spinsStarted,spinsSettled:s.spinsSettled,progress:progress(s.totals.sxp10),totals:{...s.totals},counts:{...s.counts},effects:effectsUnchecked(s,now,'other'),last:s.last?{id:s.last.id,serial:s.last.serial,atMs:s.last.atMs,payout:s.last.payout,source:s.last.source,xpBoosted:s.last.xpBoosted,coinsBoosted:s.last.coinsBoosted,credits:{...s.last.credits}}:null};
 }
 return Object.freeze({VERSION:1,DAY_MS,TOKEN_MS,TOKEN_CAP_MS,EFFECT_IDS,SYMBOLS,REELS,PAYOUTS,LEVEL_THRESHOLDS,SYMBOL_COUNTS,OUTCOME_COUNTS,create,validate,validateProfile,copy,move,publicState,progress,payoutFor,rewardTotals,effectsAt,scaleCoinsHundredths});
});
