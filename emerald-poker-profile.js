/* One authentication boundary for optional Poker-backed PROFILE sources.
 * No migration, default writes, clocks, currencies or presentation. The cloud,
 * native guarded writer and Poker actor all use these SAME paired invariants.
 * Public UI must project the already-authenticated model, not call this module. */
(function(root,factory){'use strict';const n=typeof module==='object'&&module.exports,api=factory(n?require('./emerald-poker'):root.BOEmeraldPoker,n?require('./emerald-friendship'):root.BOEmeraldFriendship,n?require('./emerald-poker-events'):root.BOEmeraldPokerEvents,n?()=>require('./passive-xp'):()=>root.BOPassiveXP);if(n)module.exports=api;else root.BOEmeraldPokerProfile=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P,F,E,getPX){'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),count=n=>Number.isSafeInteger(n)&&n>=0&&!Object.is(n,-0);
 function check(ok,message){if(!ok)throw Error('Poker save: '+message)}
 function record(o){return !!o&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o))}
 function data(o,k){check(record(o),'expected a plain profile object.');const d=Object.getOwnPropertyDescriptor(o,k);if(!d)return undefined;check(own(d,'value')&&d.enumerable===true,'expected enumerable data field '+k+'.');return d.value}
 function fields(o,keys){return record(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>own(o,k)&&(data(o,k),true))}
 function dataTree(value,seen=new Set()){
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return;
  check(record(value)||Array.isArray(value),'expected native passive JSON data.');check(!seen.has(value),'cyclic passive data.');seen.add(value);
  for(const key of Reflect.ownKeys(value)){if(Array.isArray(value)&&key==='length')continue;const d=Object.getOwnPropertyDescriptor(value,key);check(typeof key==='string'&&d&&own(d,'value')&&d.enumerable,'expected passive data fields.');dataTree(d.value,seen)}
  seen.delete(value);
 }
 function sources(p){check(record(p),'expected a plain profile.');const poker=data(p,'emeraldPoker'),events=data(p,'emeraldPokerEvents'),friendship=data(p,'emeraldFriendship'),progression=data(p,'progression'),faucet=progression===undefined?undefined:data(progression,'faucet'),claims=faucet===undefined?undefined:data(faucet,'pokerClaims');return {poker,events,friendship,claims,hasClaims:faucet!==undefined&&own(faucet,'pokerClaims')}}
 function authenticate(p){
  const {poker,events,friendship,claims,hasClaims}=sources(p),passive=data(p,'passiveXp'),hasTick=passive!==undefined&&passive!==null&&own(passive,'pokerTick'),tick=hasTick?data(passive,'pokerTick'):undefined;
  if(poker===undefined){check(!own(p,'emeraldPoker'),'an explicitly present Poker ledger cannot be undefined.');check(!own(p,'emeraldPokerEvents'),'events are missing their Poker source.');check(!friendship||!own(friendship,'poker'),'friendship is missing its Poker source.');check(!hasClaims,'gifted faucet progression is missing its Poker source.');check(!hasTick,'the pending passive tick is missing its Poker source.');return {medals:0,fpHalf:0,faucetClaims:0}}
  check(P&&P.validate(poker),'invalid private seeded Poker ledger.');check(F&&F.validate(friendship),'Poker requires its matching friendship ledger.');
  const totals=P.rewardTotals(poker),stream=data(friendship,'poker');
  if(poker.completedRounds===0){check(stream===undefined||stream.rounds===0&&stream.pointsHalf===0&&stream.lastRoundId===null,'unsettled Poker has already-paid friendship.');}
  else check(stream!==undefined&&stream.rounds===poker.completedRounds&&stream.pointsHalf===totals.fpHalf&&stream.lastRoundId==='poker:'+poker.completedRounds,'Poker and friendship completed receipts disagree.');
  check(E&&E.validateAgainstPoker(events,poker,P),'timed events disagree with their completed hand sources.');
  if(own(p,'emeraldPokerEvents'))check(events!==undefined&&events.revision>0,'an explicitly saved event ledger needs a completed event source.');
  // PX authenticates the native session/left edge; this bridge authenticates its
  // Poker provenance. The first Full House can only snapshot an OLD neutral edge.
  if(hasTick){const PX=getPX();check(PX&&typeof PX.normalize==='function','the native passive XP validator is unavailable.');dataTree(passive);PX.normalize(passive);check(fields(tick,['at','multiplier'])&&count(tick.at)&&(tick.multiplier===1||tick.multiplier===2),'invalid pending passive tick data.');check((events?.effects?.['double-xp']?.count??0)>=(tick.multiplier===2?2:1),'the pending passive tick has no matching Full House history.');}
  if(totals.faucetClaims===0)check(!hasClaims,'gifted faucet progression has no Royal Flush source.');
  else{
   check(fields(claims,['total','lastSerial','lastRoundId'])&&count(claims.total)&&claims.total===totals.faucetClaims&&count(claims.lastSerial)&&claims.lastSerial>=poker.results['royal-flush']&&claims.lastSerial<=poker.completedRounds&&claims.lastRoundId==='poker:'+claims.lastSerial,'gifted faucet progression receipts disagree.');
   if(poker.phase==='settled'&&poker.round.receipt.category==='royal-flush')check(claims.lastSerial===poker.round.receipt.serial,'the final Royal Flush gifted claim source is missing.');
  }
  check(count(totals.medals*2),'Poker Medal half-unit source exceeds safe capacity.');return totals;
 }
 function validateProfile(p){authenticate(p);return true}
 function medalsHalf(p){return authenticate(p).medals*2}
 return Object.freeze({validateProfile,medalsHalf});
});
