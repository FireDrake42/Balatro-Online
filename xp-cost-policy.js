/* Level60 future95: pure, bounded three-domain requirement policy. No clock,
 * storage, RNG, entropy, income, read migration or new currency. Native actors
 * alone supply an accepted positive source and the ORIGINAL whole beforeimage.
 * PXP is exact integer milli-units; unsafe products are canonical decimal text.
 * Saved anchors are provenance, not a binding to a later destination slot.
 */
(function(root,factory){'use strict';
const n=typeof module==='object'&&module.exports,api=factory(n?require('./emerald-poker'):root.BOEmeraldPoker,n?require('./manual-restoration-model'):root.BOManualRestoration,()=>n?require('./late-level-rules'):root.BOLateLevels,()=>n?require('./expansion-rewards'):root.BOExpansionRewards,()=>n?require('./emerald-slots'):root.BOEmeraldSlots);
if(n)module.exports=api;
else root.BOXPCostPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(P,MR,LL,rewards,slots){'use strict';
 const MAX=Number.MAX_SAFE_INTEGER,BMAX=BigInt(MAX),POLICY='level60-future95',MONEY=['xpMilli','fpMilli','coinsMilli','medalsMilli','pxpMilli'],IDS=Object.freeze(Object.keys(P.PAYOUTS)),SIDS=['none','triple-emerald','triple-seven','triple-joker','triple-xp','double-seven','triple-coin','triple-spade'];
 const MASTER=['version','policy','policyId','activation','legacyPotion','player','poker','slots','savings'],ROW=['outgoing','normal','potion','paid','potionSaving','perkSaving','source','bankBefore','bankAfter','totalXp'];
 // Single immutable original payout table shared with the native Slots model;
 // proof validation must derive every anchored total from the actual counters.
 function pay(name,xp10,fp10,coins10,medals10,sxp10){return Object.freeze({name,xp10,fp10,coins10,medals10,sxp10})}
 const SLOT_PAYOUTS=Object.freeze({none:pay('No matching payout',0,0,0,0,0),'triple-emerald':pay('Triple Emerald',363630,3630,3630,3630,3630),'triple-seven':pay('Triple 7',77770,2770,2770,2770,7770),'triple-joker':pay('Triple Joker',20000,2000,2000,2000,0),'triple-xp':pay('Triple XP',50000,300,300,300,3000),'double-seven':pay('Double 7',7777,277,277,277,777),'triple-coin':pay('Triple Coin',10000,1000,1500,1500,1500),'triple-spade':pay('Triple Spade',1000,30,20,20,100)});
 const own=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k),clone=o=>JSON.parse(JSON.stringify(o));
 function check(ok,m){if(!ok)throw Error('XP cost policy: '+m)}
 function record(v){return !!v&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v))}
 function data(v,depth=0){check(depth<=48,'data depth');
if(v===null||typeof v==='string'||typeof v==='boolean')return;
if(typeof v==='number'){check(Number.isFinite(v)&&!Object.is(v,-0),'nonfinite or negative-zero data');
return}check(v&&typeof v==='object'&&(Array.isArray(v)?Object.getPrototypeOf(v)===Array.prototype:record(v)),'plain data required');
const ks=Reflect.ownKeys(v);
if(Array.isArray(v))check(ks.length===v.length+1,'sparse/extended array');
for(const k of ks){if(Array.isArray(v)&&k==='length')continue;
const d=Object.getOwnPropertyDescriptor(v,k);
check(typeof k==='string'&&d&&d.enumerable&&own(d,'value'),'hidden, accessor or symbol data');
if(Array.isArray(v))check(/^(0|[1-9][0-9]*)$/.test(k)&&Number(k)<v.length,'array index');
data(d.value,depth+1)}}
 function fields(v,ks){check(record(v)&&Reflect.ownKeys(v).length===ks.length&&ks.every(k=>{const d=Object.getOwnPropertyDescriptor(v,k);
return d&&d.enumerable&&own(d,'value')}),'exact fields '+ks.join(','))}
 function count(v,min=0,max=MAX){check(Number.isSafeInteger(v)&&v>=min&&v<=max&&!Object.is(v,-0),'unsafe cost counter');
return v}
 function amount(v){check(typeof v==='number'&&Number.isFinite(v)&&v>=0&&!Object.is(v,-0),'invalid lifetime total/bank');
return v}
 function safe(n){check(n>=0n&&n<=BMAX,'cost/source overflow');
return Number(n)}
 function add(a,b){count(a);
count(b);
return safe(BigInt(a)+BigInt(b))}
 function text(n){check(typeof n==='string'&&/^(0|[1-9][0-9]*)$/.test(n)&&n.length<=32,'canonical milli-PXP text');
return BigInt(n)}
 function optional(v){fields(v,['present','value']);
check(typeof v.present==='boolean'&&(v.present?v.value!==null:v.value===null),'optional provenance')}
 function declared(value,field){optional(value);
if(!value.present)return 0;
check(MR.validateBaseline(value.value,field),'declared source identity');
return value.value.value}
 function optionalOf(o,key){return own(o,key)?{present:true,value:clone(o[key])}:{present:false,value:null}}
 function counterMap(v,ids){fields(v,ids);
for(const k of ids)count(v[k])}
 function equal(a,b){if(Object.is(a,b))return true;
if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
const ak=Reflect.ownKeys(a),bk=Reflect.ownKeys(b);
return ak.length===bk.length&&ak.every(k=>own(b,k)&&equal(a[k],b[k]))}
 function header(p){return {completedRounds:p.completedRounds,totalPXP:p.totalPXP,matchedTargets:p.matchedTargets,results:{...p.results},...(own(p,'manualRestoration')?{manualRestoration:clone(p.manualRestoration)}:{})}}
 function checkHeader(h){fields(h,['completedRounds','totalPXP','matchedTargets','results'].concat(own(h,'manualRestoration')?['manualRestoration']:[]));
count(h.completedRounds);
count(h.totalPXP);
count(h.matchedTargets);
counterMap(h.results,IDS);
if(own(h,'manualRestoration'))check(MR.validateBaseline(h.manualRestoration,'pokerPxp'),'declared Poker header');
let rounds=0n,pxp=0n;
for(const k of IDS){rounds+=BigInt(h.results[k]);
pxp+=BigInt(h.results[k])*BigInt(P.PAYOUTS[k].pxp)}check(rounds===BigInt(h.completedRounds)&&pxp===BigInt(h.totalPXP)&&h.matchedTargets<=h.completedRounds-h.results.none,'Poker header/category source');
return h}
 function pokerUnits(base,declaredPxp,bonus){count(base);
count(declaredPxp);
count(bonus);
const n=(BigInt(base)+BigInt(declaredPxp))*1000n+BigInt(bonus);
check(n<=BMAX*1000n,'cumulative Poker source overflow');
return n}
 function curve(f,unit){check(f===null||Number.isInteger(f)&&f>=1&&f<=39,'curve frontier');
let out=[0n];
for(let outgoing=1;
outgoing<40;
outgoing++){const old=BigInt(P.LEVEL_THRESHOLDS[outgoing]-P.LEVEL_THRESHOLDS[outgoing-1])*BigInt(unit),cost=f!==null&&outgoing>=f?(old*95n+99n)/100n:old;
out.push(out.at(-1)+(cost<1n?1n:cost))}return out}
 function indexFor(n,thresholds){let i=0;
while(i<39&&n>=thresholds[i+1])i++;
return i}
 function frontierOf(policy,domain){if(!policy)return null;
if(own(policy,'anchor'))return policy.firstEligibleOutgoing;
return policy[domain].firstEligibleOutgoing}
 function pokerInfo(totalMilli,policy){const n=typeof totalMilli==='bigint'?totalMilli:text(totalMilli),c=curve(frontierOf(policy,'poker'),1000),i=indexFor(n,c),max=i===39,floor=Number(c[i])/1000,next=max?null:Number(c[i+1])/1000,progress=Number(n-c[i])/1000,required=max?0:Number(c[i+1]-c[i])/1000;
return {level:i+1,totalPXP:Number(n)/1000,floor,next,required,progress,remaining:max?0:required-progress,percent:max?100:100*progress/required,multiplier:1+i/100,max,thresholds:c.map(v=>Number(v)/1000)}}
 function slotsInfo(total10,policy){count(total10);
const c=curve(frontierOf(policy,'slots'),10),n=BigInt(total10),i=indexFor(n,c),max=i===39,start10=Number(c[i]),next10=max?null:Number(c[i+1]),required10=max?0:next10-start10,progress10=total10-start10;
return {level:i+1,capped:max,totalSxp10:total10,start10,next10,remaining10:max?0:required10-progress10,percent:max?100:100*progress10/required10,speedFactor:(101-(i+1))/100,thresholds:c.map(v=>Number(v)/10)}}
 function bonusFor(category,matched,level){check(IDS.includes(category)&&typeof matched==='boolean'&&(!matched||category!=='none')&&Number.isInteger(level)&&level>=1&&level<=40,'bonus receipt');
const b=P.PAYOUTS[category],out={};
for(const k of MONEY){const key=k.slice(0,-5),v=b[key]+(matched?(key==='xp'?100:key==='fp'?5:0):0);
out[k]=v*(level-1)*10;
count(out[k])}return out}
 function scaleCoinsMilli(value,n=10){count(value);
check([10,17].includes(n),'coin numerator');
return safe(((BigInt(value)*BigInt(n)+50n)/100n)*10n)}
 function replayLegacy(state){data(state);
fields(state,['version','base','receipts','bonus','coinCreditsMilli']);
check(state.version===1&&Array.isArray(state.receipts)&&state.receipts.length<=20000,'legacy bonus version/capacity');
checkHeader(state.base);
counterMap(state.bonus,MONEY);
count(state.coinCreditsMilli);
const current=clone(state.base),bonus=Object.fromEntries(MONEY.map(k=>[k,0]));
let coins=0;
for(const r of state.receipts){fields(r,['serial','category','matchedTarget','level','coinNumerator']);
const d=own(current,'manualRestoration')?MR.amount(current,'pokerPxp'):0,level=pokerInfo(pokerUnits(current.totalPXP,d,bonus.pxpMilli).toString(),null).level;
check(r.serial===current.completedRounds+1&&r.level===level&&[10,17].includes(r.coinNumerator),'legacy bonus serial/level');
const b=bonusFor(r.category,r.matchedTarget,r.level),base=P.PAYOUTS[r.category].coins*1000;
coins=add(coins,scaleCoinsMilli(base+b.coinsMilli,r.coinNumerator)-base);
for(const k of MONEY)bonus[k]=add(bonus[k],b[k]);
current.totalPXP=add(current.totalPXP,P.PAYOUTS[r.category].pxp);
current.completedRounds=add(current.completedRounds,1);
current.results[r.category]=add(current.results[r.category],1);
if(r.matchedTarget)current.matchedTargets=add(current.matchedTargets,1)}check(equal(bonus,state.bonus)&&coins===state.coinCreditsMilli,'legacy bonus replay aggregate');
return {current,bonus,coinCreditsMilli:coins}}
 function pokerAnchor(p){const present=own(p,'emeraldPoker');
if(!present)return {present:false,native:null,declared:{present:false,value:null},legacyBonus:{present:false,value:null},totalMilli:'0',openedLevel:1,firstEligibleOutgoing:2};
const s=p.emeraldPoker;
check(P.validate(s),'original native Poker');
const h=header(s),native={completedRounds:h.completedRounds,totalPXP:h.totalPXP,matchedTargets:h.matchedTargets,results:h.results},d=optionalOf(s,'manualRestoration'),legacyBonus=optionalOf(p,'pokerLevelRewards');
let bonus=0;
if(legacyBonus.present){const r=replayLegacy(legacyBonus.value);
check(equal(r.current,h),'original bonus source/header');
bonus=r.bonus.pxpMilli}const n=pokerUnits(s.totalPXP,declared(d,'pokerPxp'),bonus),openedLevel=pokerInfo(n.toString(),null).level;
return {present:true,native,declared:d,legacyBonus,totalMilli:n.toString(),openedLevel,firstEligibleOutgoing:openedLevel===40?null:openedLevel+1}}
 function slotsAnchor(p){if(!own(p,'emeraldSlots'))return {present:false,native:null,declared:{present:false,value:null},total10:0,openedLevel:1,firstEligibleOutgoing:2};
const s=p.emeraldSlots,d=optionalOf(s,'manualRestoration'),total10=add(s.totals.sxp10,declared(d,'slotsSxp10')),openedLevel=slotsInfo(total10,null).level;
return {present:true,native:{spinsStarted:s.spinsStarted,spinsSettled:s.spinsSettled,counts:clone(s.counts),xpBoosted:clone(s.xpBoosted),coinsBoosted:clone(s.coinsBoosted),totals:clone(s.totals),lastSerial:s.last?.serial??null,pendingSerial:s.pending?.serial??null},declared:d,total10,openedLevel,firstEligibleOutgoing:openedLevel===40?null:openedLevel+1}}
 function potionPrice(n){count(n,1);
return safe((BigInt(n)*9n+9n)/10n)}
 function futurePrice(n){count(n,1);
return Math.max(1,safe((BigInt(n)*95n+99n)/100n))}
 function playerFrontier(before,costs){let level=before.level,bank=before.xp;
while(level<100){const n=costs[level-1];
if(n===null||bank<potionPrice(n))break;
bank-=potionPrice(n);
level++}return level}
 function capture(profile,normalCosts,totalXp){data(profile);
check(record(profile.progression),'whole original PROFILE required');
const p=profile.progression;
check(!record(p.xpDiscountSavings),'a policy cannot reanchor itself');
const legacyPotion=optionalOf(p,'xpDiscountSavings');
if(legacyPotion.present)count(legacyPotion.value);
const before={level:p.level,cap:p.cap,xp:p.xp,totalXp:amount(totalXp),totalProvenance:typeof p.totalXp==='number'&&Number.isFinite(p.totalXp)&&p.totalXp>=0?'stored':'legacy-inferred'},costs=normalCosts.slice(0,99);
count(before.level,1,100);
count(before.cap,before.level,100);
amount(before.xp);
const protectedFrontier=playerFrontier(before,costs);
return {legacyPotion,player:{before,normalCosts:costs,protectedFrontier,firstEligibleOutgoing:protectedFrontier===100?null:Math.max(60,protectedFrontier+1),transitions:[]},poker:pokerAnchor(profile),slots:slotsAnchor(profile)}}
 function source(s){fields(s,['kind','id','at']);
check(typeof s.kind==='string'&&/^[A-Za-z0-9_:-]{1,80}$/.test(s.kind)&&typeof s.id==='string'&&s.id.length>=1&&s.id.length<=1024,'native source identity');
count(s.at,0,8640000000000000)}
 function slot(v){fields(v,['id','generation']);
check([1,2,3].includes(v.id)&&typeof v.generation==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(v.generation),'origin slot generation')}
 function policyId(a){return POLICY+':'+a.slot.id+':'+a.slot.generation+':'+a.kind+':'+encodeURIComponent(a.id)+':'+a.at}
 function validateSnapshot(s,p,normalCosts,totalXp){
  data(s);
fields(s,['legacyPotion','player','poker','slots']);
const before={...p};
if(!(typeof before.totalXp==='number'&&Number.isFinite(before.totalXp)&&before.totalXp>=0))delete before.totalXp;
  const expected=capture({progression:before},normalCosts,totalXp);
check(equal(s.legacyPotion,expected.legacyPotion)&&equal(s.player,expected.player),'source snapshot/original Player mismatch');
checkPokerAnchor(s.poker);
checkSlotsAnchor(s.slots);
return true;
 }
 function validateSourceContext(c,at){data(c);
fields(c,['slot','at','snapshot','id']);
slot(c.slot);
count(c.at,0,8640000000000000);
check(c.at===at&&typeof c.id==='string'&&/^interest:[1-9][0-9]*$/.test(c.id)&&Number.isSafeInteger(Number(c.id.slice(9))),'actual interest cost source identity/time');
return true}
 function activate(p,snapshot,s,legacyTransitions=[]){if(record(p.xpDiscountSavings)||!snapshot||p.level<60)return false;
fields(snapshot,['legacyPotion','player','poker','slots']);
const q=clone(snapshot);
if([q.player,q.poker,q.slots].every(d=>d.firstEligibleOutgoing===null))return false;
const activation={kind:s.kind,id:s.id,at:s.at,slot:clone(s.slot),fromLevel:q.player.before.level,atLevel:p.level,amount:s.amount,legacyTransitions:clone(legacyTransitions)},r={version:1,policy:POLICY,policyId:policyId(activation),activation,legacyPotion:q.legacyPotion,player:q.player,poker:q.poker,slots:q.slots,savings:{potion:0,perk:0}};
for(const row of legacyTransitions)r.savings.potion=add(r.savings.potion,row.potionSaving);
p.xpDiscountSavings=r;
return true}
 function price(level,normal,potion,r){return r&&r.player.firstEligibleOutgoing!==null&&level>=r.player.firstEligibleOutgoing?futurePrice(potion):potion}
 function transition(level,normal,potion,paid,s,bank,totalXp){return {outgoing:level,normal,potion,paid,potionSaving:normal-potion,perkSaving:potion-paid,source:{kind:s.kind,id:s.id,at:s.at},bankBefore:bank,bankAfter:bank-paid,totalXp}}
 function append(r,row){r.player.transitions.push(row);
r.savings.potion=add(r.savings.potion,row.potionSaving);
r.savings.perk=add(r.savings.perk,row.perkSaving)}
 function checkPokerAnchor(a){fields(a,['present','native','declared','legacyBonus','totalMilli','openedLevel','firstEligibleOutgoing']);
check(typeof a.present==='boolean','Poker presence');
const d=declared(a.declared,'pokerPxp');
optional(a.legacyBonus);
let n=0n;
if(!a.present){check(a.native===null&&!a.declared.present&&!a.legacyBonus.present,'missing Poker source remains absent')}else{fields(a.native,['completedRounds','totalPXP','matchedTargets','results']);
checkHeader(a.native);
let bonus=0;
if(a.legacyBonus.present){const old=replayLegacy(a.legacyBonus.value),h={...clone(a.native),...(a.declared.present?{manualRestoration:clone(a.declared.value)}:{})};
check(equal(old.current,h),'Poker prefix/header binding');
bonus=old.bonus.pxpMilli}n=pokerUnits(a.native.totalPXP,d,bonus)}const level=pokerInfo(n.toString(),null).level;
check(text(a.totalMilli)===n&&a.openedLevel===level&&a.firstEligibleOutgoing===(level===40?null:level+1),'Poker protected frontier');
return true}
 function checkSlotsAnchor(a){fields(a,['present','native','declared','total10','openedLevel','firstEligibleOutgoing']);
check(typeof a.present==='boolean','Slots presence');
const d=declared(a.declared,'slotsSxp10');
let total=0;
if(!a.present)check(a.native===null&&!a.declared.present,'missing Slots source remains absent');
else{const n=a.native;
fields(n,['spinsStarted','spinsSettled','counts','xpBoosted','coinsBoosted','totals','lastSerial','pendingSerial']);
count(n.spinsStarted);
count(n.spinsSettled);
check(n.spinsStarted-n.spinsSettled===Number(n.pendingSerial!==null),'Slots pending serial boundary');
check(n.pendingSerial===(n.spinsStarted>n.spinsSettled?n.spinsStarted:null)&&n.lastSerial===(n.spinsSettled?n.spinsSettled:null),'Slots old last/pending serial');
counterMap(n.counts,SIDS);
counterMap(n.xpBoosted,SIDS);
counterMap(n.coinsBoosted,SIDS);
fields(n.totals,['xp10','fp10','coins100','medals10','sxp10']);
for(const k of Object.keys(n.totals))count(n.totals[k]);
let spins=0n;
const expected={xp10:0n,fp10:0n,coins100:0n,medals10:0n,sxp10:0n};
for(const id of SIDS){const p=SLOT_PAYOUTS[id],c=BigInt(n.counts[id]),x=BigInt(n.xpBoosted[id]),b=BigInt(n.coinsBoosted[id]);
spins+=c;
check(x<=c&&b<=c&&(!['none','triple-emerald','triple-seven'].includes(id)||x===0n)&&(id!=='none'||b===0n),'Slots source boost counts');
expected.xp10+=BigInt(p.xp10)*(c+5n*x);
expected.sxp10+=BigInt(p.sxp10)*(c+5n*x);
expected.fp10+=BigInt(p.fp10)*c;
expected.medals10+=BigInt(p.medals10)*c;
expected.coins100+=BigInt(p.coins10)*(10n*c+7n*b)}check(spins===BigInt(n.spinsSettled)&&Object.keys(expected).every(k=>expected[k]===BigInt(n.totals[k])),'Slots source count/payout aggregate');
total=add(n.totals.sxp10,d)}const level=slotsInfo(total,null).level;
check(a.total10===total&&a.openedLevel===level&&a.firstEligibleOutgoing===(level===40?null:level+1),'Slots protected frontier');
return true}
 function validate(r,p){data(r);
fields(r,MASTER);
check(r.version===1&&r.policy===POLICY,'cost policy version');
const a=r.activation;
fields(a,['kind','id','at','slot','fromLevel','atLevel','amount','legacyTransitions']);
source({kind:a.kind,id:a.id,at:a.at});
slot(a.slot);
count(a.fromLevel,1,100);
count(a.atLevel,60,100);
amount(a.amount);
check(a.amount>0&&r.policyId===policyId(a),'positive source/policy provenance');
optional(r.legacyPotion);
if(r.legacyPotion.present)count(r.legacyPotion.value);
const pl=r.player;
fields(pl,['before','normalCosts','protectedFrontier','firstEligibleOutgoing','transitions']);
fields(pl.before,['level','cap','xp','totalXp','totalProvenance']);
const b=pl.before;
count(b.level,1,100);
count(b.cap,b.level,100);
amount(b.xp);
amount(b.totalXp);
check(['stored','legacy-inferred'].includes(b.totalProvenance)&&a.fromLevel===b.level,'original Player provenance');
check(Array.isArray(pl.normalCosts)&&pl.normalCosts.length===99,'original cost table');
pl.normalCosts.forEach((n,i)=>{if(n!==null)count(n,1);
if(i>=49)check(n===LL().normalCost(i+1),'original normal late cost')});
const frontier=playerFrontier(b,pl.normalCosts);
check(pl.protectedFrontier===frontier&&pl.firstEligibleOutgoing===(frontier===100?null:Math.max(60,frontier+1)),'Player protected frontier');
checkPokerAnchor(r.poker);
checkSlotsAnchor(r.slots);
check(![pl,r.poker,r.slots].every(d=>d.firstEligibleOutgoing===null),'empty terminal policy');
check(Array.isArray(pl.transitions)&&Array.isArray(a.legacyTransitions)&&pl.transitions.length+a.legacyTransitions.length<=99,'transition capacity');
fields(r.savings,['potion','perk']);
let potion=0,perk=0,level=b.level;
function row(t,legacy){fields(t,ROW);
count(t.outgoing,1,99);
check(t.outgoing===level&&t.normal===pl.normalCosts[level-1]&&(t.potion===t.normal||t.potion===potionPrice(t.normal)),'ordered actual transition');
const paid=legacy?t.potion:price(level,t.normal,t.potion,r);
check(t.paid===paid&&t.potionSaving===t.normal-t.potion&&t.perkSaving===t.potion-paid,'paid cost/savings arithmetic');
source(t.source);
amount(t.bankBefore);
amount(t.bankAfter);
amount(t.totalXp);
check(t.bankBefore>=paid&&t.bankAfter===t.bankBefore-paid&&t.totalXp>=b.totalXp,'actual bank debit/lifetime');
if(legacy)check(t.source.kind===a.kind&&t.source.id===a.id&&t.source.at===a.at&&level<60,'legacy activation source');
potion=add(potion,t.potionSaving);
perk=add(perk,t.perkSaving);
level++}a.legacyTransitions.forEach(t=>row(t,true));
check(level===a.atLevel&&(b.level>=60?a.legacyTransitions.length===0:level===60),'real old59 transition before activation');
pl.transitions.forEach(t=>row(t,false));
check(r.savings.potion===potion&&r.savings.perk===perk,'cost saving aggregates');
if(r.legacyPotion.present)add(r.legacyPotion.value,potion);
if(p){amount(p.totalXp);
amount(p.xp);
check(p.level===level&&p.totalXp>=b.totalXp+a.amount,'carried total/Player transition coverage')}return true}
 function read(p){const v=p?.xpDiscountSavings;
if(!record(v))return null;
validate(v,p);
return v}
 function savings(p){const r=read(p);
return r?add(r.legacyPotion.present?r.legacyPotion.value:0,r.savings.potion):p?.xpDiscountSavings||0}
 // A historical Player mirror is not a substitute for a whole PROFILE. Its
 // evolving Player rows may be older, but its immutable ALL3 origin must agree.
 function validateMirror(profile,mirror){data(profile);data(mirror);check(record(mirror.progression),'Player mirror unavailable');const current=read(profile.progression),incoming=read(mirror.progression);
 if(current||incoming){check(incoming,'a legacy-only Player mirror cannot replace a typed policy; use supported whole-profile restore');if(current){const origin=r=>({...r,player:{...r.player,transitions:[]},savings:{potion:0,perk:0}});check(equal(origin(current),origin(incoming)),'Player mirror policy origin differs; use supported whole-profile restore')}}
 const joined={...profile,progression:mirror.progression};for(const k of ['passiveXp','expInterest'])if(own(mirror,k))joined[k]=mirror[k];validateProfile(joined);return true}
 function contract(master,prefixSpinSerial){validate(master);
count(prefixSpinSerial);
check(prefixSpinSerial===(master.slots.native?.spinsStarted??0),'Slots prefix cannot precede activation');
return {version:1,policyId:master.policyId,firstEligibleOutgoing:master.slots.firstEligibleOutgoing,anchor:clone(master.slots),prefixSpinSerial}}
 function validateContract(c){data(c);
fields(c,['version','policyId','firstEligibleOutgoing','anchor','prefixSpinSerial']);
check(c.version===1&&typeof c.policyId==='string'&&c.policyId.startsWith(POLICY+':'),'Slots cost policy identity');
checkSlotsAnchor(c.anchor);
check(c.firstEligibleOutgoing===c.anchor.firstEligibleOutgoing,'Slots contract frontier');
count(c.prefixSpinSerial);
check(c.prefixSpinSerial===(c.anchor.native?.spinsStarted??0),'Slots legacy serial prefix');
return true}
 function validateProfile(profile){const r=read(profile.progression);
if(!r){check(profile.pokerLevelRewards?.version!==2&&profile.emeraldSlots?.version!==3,'detached real cost-bearing domain');
return true}const a=r.activation,s=profile.emeraldSlots,p=profile.emeraldPoker;
function declaredNow(native,anchor,field){const now=optionalOf(native||{},'manualRestoration');
check(equal(now,anchor.declared),'declared '+field+' anchor changed');
return declared(now,field)}if(r.poker.present){check(p&&P.validate(p),'missing/invalid original Poker');
declaredNow(p,r.poker,'pokerPxp');
check(p.completedRounds>=r.poker.native.completedRounds&&p.totalPXP>=r.poker.native.totalPXP&&p.matchedTargets>=r.poker.native.matchedTargets&&IDS.every(k=>p.results[k]>=r.poker.native.results[k]),'Poker anchor moved backwards')}else if(p)check(!own(p,'manualRestoration'),'missing original Poker cannot acquire a declaration');
if(s)check(slots()&&slots().validate(s),'invalid actual native Slots source');
 if(r.slots.present){check(s,'original Slots is missing');
declaredNow(s,r.slots,'slotsSxp10');
const n=r.slots.native;
check(s.spinsStarted>=n.spinsStarted&&s.spinsSettled>=n.spinsSettled&&SIDS.every(k=>s.counts[k]>=n.counts[k]&&s.xpBoosted[k]>=n.xpBoosted[k]&&s.coinsBoosted[k]>=n.coinsBoosted[k])&&Object.keys(n.totals).every(k=>s.totals[k]>=n.totals[k]),'Slots anchor moved backwards')}else if(s)check(!own(s,'manualRestoration'),'missing original Slots cannot acquire a declaration');
if(s?.version===3){validateContract(s.costContract);
check(s.costContract.policyId===r.policyId&&equal(s.costContract.anchor,r.slots),'whole Slots/master policy mismatch')}
 else if(s){const n=r.slots.native;check(s.spinsStarted===(n?.spinsStarted||0)&&s.spinsSettled===(n?.spinsSettled||0)&&SIDS.every(k=>s.counts[k]===(n?.counts[k]||0)&&s.xpBoosted[k]===(n?.xpBoosted[k]||0)&&s.coinsBoosted[k]===(n?.coinsBoosted[k]||0))&&Object.keys(s.totals).every(k=>s.totals[k]===(n?.totals[k]||0)),'native Slots advanced without a real v3 cost source');}
 const reward=profile.pokerLevelRewards;
 if(reward?.version===2){check(reward.policyId===r.policyId&&reward.firstEligibleOutgoing===r.poker.firstEligibleOutgoing&&equal(reward.legacy,r.poker.legacyBonus),'whole Poker/master prefix mismatch');check(rewards()&&rewards().validatePoker(profile)===true,'invalid authentic v2 native Poker replay');}
 else {check(equal(optionalOf(profile,'pokerLevelRewards'),r.poker.legacyBonus),'legacy bonus changed without a real v2 hand');if(p){const h=r.poker.native||{completedRounds:0,totalPXP:0,matchedTargets:0,results:Object.fromEntries(IDS.map(k=>[k,0]))};check(P.validate(p)&&equal(header(p),{...clone(h),...(r.poker.declared.present?{manualRestoration:clone(r.poker.declared.value)}:{})}),'native Poker advanced without a real v2 cost source');}}
if(a.kind==='interest'){check(profile.expInterest?.version===5&&profile.expInterest.revision>=Number(a.id.slice(a.id.lastIndexOf(':')+1)),'activation is missing its native interest receipt')}else if(a.kind==='balatro'){const parts=a.id.split(':'),seq=Number(parts.pop()),runId=parts.slice(1).join(':');
check(profile.progression.cursors?.[runId]>=seq,'activation is missing native run cursor')}else if(a.kind==='faucet')check(profile.progression.faucet.totalClaims>=Number(a.id.slice(a.id.lastIndexOf(':')+1)),'activation is missing actual faucet claim');
else if(a.kind==='passive'){const match=/^passive:([0-9]+):([1-9][0-9]*)$/.exec(a.id),native=profile.passiveXp;
 check(match&&native&&Number.isSafeInteger(Number(match[1]))&&Number.isSafeInteger(Number(match[2]))&&native.startedAt>=Number(match[1])&&native.totalTicks>=Number(match[2])&&typeof native.totalXp==='number'&&Number.isFinite(native.totalXp)&&native.totalXp>=a.amount,'activation is missing its actual positive native passive cursor');}
 else check(own(profile.progression.receipts,a.id),'activation is missing its accepted native receipt');
return true}
 return Object.freeze({POLICY,MONEY,IDS,SIDS,SLOT_PAYOUTS,data,fields,count,amount,clone,equal,optionalOf,header,checkHeader,pokerUnits,pokerInfo,slotsInfo,bonusFor,scaleCoinsMilli,replayLegacy,pokerAnchor,slotsAnchor,potionPrice,futurePrice,capture,validateSnapshot,validateSourceContext,activate,price,transition,append,validate,read,savings,contract,validateContract,validateProfile,validateMirror});
});
