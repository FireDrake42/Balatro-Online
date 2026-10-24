/* Potions: pure, supplied-clock inventory and historical effect ledger. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BOPotions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var MAX_INVENTORY = 2, DURATION_MS = 120000;
  var CATALOG = [
    ['exp','Exp Potion','Double ordinary earned XP for2 minutes, including surveys and faucet; interest and Knowledge keep their own rates.'],
    ['luck','Luck Potion','Double listed luck for 2 minutes; Boss disabling stays fixed at 5%.'],
    ['mult','Mult Potion','Each actual scoring-card trigger adds +4 Mult for 2 minutes.'],
    ['chips','Chip Potion','Each actual scoring-card trigger adds +20 Chips for 2 minutes.'],
    ['money','Money Potion','Each successful round payout gains +$5 for 2 minutes.'],
    ['high_stonks','High Stonks Potion','Interest uses $3 instead of $5 per interest dollar for 2 minutes, keeping its cap.'],
    ['gaming','Gaming Potion','Start at 100 HP; lose 1 HP per played card. 0 HP ends the run. Base CRIT is 1 in 50 for 2 minutes.'],
    ['knowledge','Knowledge Potion','An existing passive session awards exactly 1 XP per second for 2 minutes, ignoring Level15, manual22 and Exp Potion; active physical Exp Jokers still multiply it.'],
    ['cooldown','Cooldown Potion','Halve passive restart and coin faucet waits for 2 minutes; no potion or prediction timer changes.'],
    ['daylight','Daylight Potion','Add the current Canary Islands day of the month to Mult at the very end of scoring for 2 minutes.'],
    ['night','Night Potion','Each genuine Planet use grants 1 extra hand level for 2 minutes (not Black Hole or Space Joker).'],
    ['critical','Critical Potion','Base CRIT is 1 in 40 per actual scoring-card trigger for 2 minutes; each CRIT gives X2 current Mult.'],
    ['all_suiter','All-Suiter','Every non-Stone card counts as every suit for 2 minutes without changing its printed suit.'],
    ['boss_disabler','Boss-disabler Potion','Fixed 1 in 20 chance to disable an actual Boss at its start, only until this potion ends.'],
    ['turtle','Turtle Potion','Start at +12 hand size, losing 1 every 10 seconds for 2 minutes; excess held cards are kept.'],
    ['xp_discount','Exp for Discounts Potion','Player XP level costs are 10% lower for 2 minutes; earned levels remain afterwards.'],
    ['speed','Speed Potion','Scoring animation durations are multiplied by 0.7 for 2 minutes. Emerald gift only; no scoring, gameplay clock or cooldown changes.']
  ].map(function (x) { return Object.freeze({id:x[0],name:x[1],description:x[2]}); });
  Object.freeze(CATALOG);
  // Speed is an Emerald gift, not an implicit new Boss reward or Medal-shop offer.
  // Keep the historical sixteen-item order and random selection unchanged.
  var DROP_CATALOG = Object.freeze(CATALOG.slice(0,16)), SHOP_CATALOG = DROP_CATALOG;
  var ids = CATALOG.map(function (x) { return x.id; });
  function check(ok, message) { if (!ok) throw new Error(message); }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function clock(now) { check(Number.isSafeInteger(now) && now >= 0 && now <= 8640000000000000-DURATION_MS, 'Supply a valid potion clock time.'); return now; }
  function key(value, name) { check(typeof value === 'string' && value.length > 0 && value.length <= 512, 'Invalid potion '+name+'.'); return value; }
  function potionId(id) { check(ids.indexOf(id) >= 0, 'Unknown potion ID.'); return id; }
  function create() { return {version:1,revision:0,inventory:[],active:null,timeline:[],dropReceipts:[],sequence:0}; }
  function fields(value,allowed) {check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(function(k){return allowed.indexOf(k)>=0;}),'Unknown potion fields.');}
  function components(value) {return value&&Array.isArray(value.components)?value.components.slice():value&&ids.indexOf(value.potionId)>=0?[value.potionId]:[];}
  function hasEffect(value,id) {return components(value).indexOf(id)>=0;}
  function displayName(value) {return components(value).map(function(id){return CATALOG[ids.indexOf(id)].name;}).join(' + ');}
  function bottleEntry(value) {
    fields(value,['uid','potionId','components']);var b={uid:key(value.uid,'UID'),potionId:potionId(value.potionId)};
    if(Object.prototype.hasOwnProperty.call(value,'components')){
      var c=value.components;check(Array.isArray(c)&&c.length>=2&&c.length<=ids.length&&c[0]===b.potionId,'Invalid composite potion components.');
      var last=-1;c.forEach(function(id){var n=ids.indexOf(id);check(n>last,'Composite potion components must be distinct valid IDs in catalogue order.');last=n;});b.components=c.slice();
    }return b;
  }
  function effectEntry(value) {
    check(value && typeof value === 'object' && !Array.isArray(value), 'Invalid potion effect.');
    fields(value,['uid','potionId','components','startedAt','expiresAt','hp']);
    var raw={uid:value.uid,potionId:value.potionId};if(Object.prototype.hasOwnProperty.call(value,'components'))raw.components=value.components;
    var e=bottleEntry(raw);e.startedAt=clock(value.startedAt);e.expiresAt=clock(value.expiresAt);
    check(e.expiresAt >= e.startedAt && e.expiresAt <= e.startedAt+DURATION_MS, 'Invalid potion effect duration.');
    if(hasEffect(e,'gaming')) { check(Number.isInteger(value.hp) && value.hp >= 0 && value.hp <= 100, 'Invalid Gaming potion HP.'); e.hp=value.hp; }
    else check(!Object.prototype.hasOwnProperty.call(value,'hp'),'Only a Gaming potion may store HP.');
    return e;
  }
  function normalize(value) {
    if(value === undefined || value === null) return create();
    check(value && typeof value === 'object' && !Array.isArray(value) && value.version === 1, 'Invalid potion ledger version.');
    fields(value,['version','revision','inventory','active','timeline','dropReceipts','sequence','blockedReason']);
    check(Number.isSafeInteger(value.revision) && value.revision >= 0 && Number.isSafeInteger(value.sequence) && value.sequence >= 0, 'Invalid potion ledger revision or sequence.');
    check(Array.isArray(value.inventory) && value.inventory.length <= MAX_INVENTORY, 'Invalid potion inventory.');
    check(Array.isArray(value.timeline) && Array.isArray(value.dropReceipts), 'Invalid potion timeline or drop receipts.');
    var seen=Object.create(null),inventory=value.inventory.map(function(value){var b=bottleEntry(value);check(!seen[b.uid],'Duplicate potion UID.');seen[b.uid]=true;return b;});
    var previousEnd=0,timeline=value.timeline.map(function(item){var e=effectEntry(item);check(!seen[e.uid], 'Duplicate potion UID.');seen[e.uid]=true;check(e.startedAt >= previousEnd, 'Potion effects cannot overlap.');previousEnd=e.expiresAt;return e;});
    var receipts=Object.create(null),dropReceipts=value.dropReceipts.map(function(id){key(id,'drop receipt');check(!receipts[id], 'Duplicate potion drop receipt.');receipts[id]=true;return id;});
    check(value.sequence >= inventory.length+timeline.length, 'Invalid potion bottle sequence.');
    var active=value.active === null ? null : effectEntry(value.active);
    if(active){var last=timeline[timeline.length-1];check(last && JSON.stringify(last) === JSON.stringify(active), 'Active potion must match the latest timeline entry.');}
    var result={version:1,revision:value.revision,inventory:inventory,active:active,timeline:timeline,dropReceipts:dropReceipts,sequence:value.sequence};
    if(value.blockedReason !== undefined){key(value.blockedReason,'blocked reason');result.blockedReason=value.blockedReason;}
    return result;
  }
  function recover(profileState, runMirror) {
    var a=null,b=null,invalid=false;
    try { if(profileState !== undefined && profileState !== null) a=normalize(profileState); } catch (_) {invalid=true;}
    try { if(runMirror !== undefined && runMirror !== null) b=normalize(runMirror); } catch (_) {invalid=true;}
    if(a && a.blockedReason && b && !b.blockedReason)return b;
    if(b && b.blockedReason && a && !a.blockedReason)return a;
    if(a && (!b || a.revision >= b.revision))return a;
    if(b)return b;
    var empty=create();if(invalid)empty.blockedReason='Invalid potion save: restore a valid potion ledger before using or receiving potions.';return empty;
  }
  function writable(state) {check(!state.blockedReason,state.blockedReason || 'Potion ledger is blocked.');return state;}
  // Queries deliberately do not normalize/prune the ledger or mutate the active
  // pointer at expiry. Historical unpaid passive ticks may still need every entry.
  function at(state, now) {
    clock(now); if(!state || state.blockedReason) return null;
    var timeline=state.timeline || [];
    for(var i=timeline.length-1;i>=0;i--){var e=timeline[i];if(e.startedAt <= now && now < e.expiresAt)return e;}
    return null;
  }
  function current(state, now) {
    clock(now);var e=state && !state.blockedReason && state.active;
    return e && e.startedAt <= now && now < e.expiresAt ? copy(e) : null;
  }
  var dayFormatter = new Intl.DateTimeFormat('en-GB',{timeZone:'Atlantic/Canary',day:'numeric'});
  function dayOfMonth(now) { clock(now);return Number(dayFormatter.format(new Date(now))); }
  function effectsAt(state, now) {
    var e=at(state,now),m={potionId:null,xpMultiplier:1,luckMultiplier:1,cardMult:0,cardChips:0,roundMoney:0,interestDivisor:5,baseCritChance:0,knowledgeXpPerSecond:null,cooldownMultiplier:1,daylightMult:0,planetBonusLevels:0,allSuits:false,bossDisableChance:0,handSizeBonus:0,xpCostMultiplier:1,gamingHP:null,scoringDurationMultiplier:1};
    if(!e)return m;m.potionId=e.potionId;
    components(e).forEach(function(id){switch(id){
      case 'exp':m.xpMultiplier=2;break;case 'luck':m.luckMultiplier=2;break;
      case 'mult':m.cardMult=4;break;case 'chips':m.cardChips=20;break;case 'money':m.roundMoney=5;break;
      case 'high_stonks':m.interestDivisor=3;break;case 'gaming':m.baseCritChance+=.02;m.gamingHP=e.hp;break;
      case 'knowledge':m.knowledgeXpPerSecond=1;break;case 'cooldown':m.cooldownMultiplier=.5;break;
      case 'daylight':m.daylightMult=dayOfMonth(now);break;case 'night':m.planetBonusLevels=1;break;
      case 'critical':m.baseCritChance+=.025;break;case 'all_suiter':m.allSuits=true;break;
      case 'boss_disabler':m.bossDisableChance=.05;break;case 'turtle':m.handSizeBonus=Math.max(0,12-Math.floor((now-e.startedAt)/10000));break;
      case 'xp_discount':m.xpCostMultiplier=.9;break;case 'speed':m.scoringDurationMultiplier=.7;break;
    }});
    return m;
  }
  function revise(state) { check(state.revision < Number.MAX_SAFE_INTEGER, 'Potion revision is exhausted.');state.revision++;return state; }
  function stop(state, now) {
    if(!state.active)return false;
    check(now >= state.active.startedAt, 'Potion clock cannot end an effect before it starts.');
    var e=state.timeline[state.timeline.length-1];e.expiresAt=Math.min(e.expiresAt,now);state.active=null;return true;
  }
  function drink(value, inventoryUid, now, options) {
    clock(now);var s=writable(normalize(value)),old=current(s,now);options=options||{};
    var index=s.inventory.findIndex(function(b){return b.uid===inventoryUid;});check(index>=0,'Choose an available inventory bottle.');
    check(!old || options.replaceConfirmed===true,'Confirm replacement of the active potion first.');
    if(s.active)stop(s,now);
    var b=s.inventory.splice(index,1)[0],e=copy(b);e.startedAt=now;e.expiresAt=now+DURATION_MS;if(hasEffect(b,'gaming'))e.hp=100;
    check(!s.timeline.length || s.timeline[s.timeline.length-1].expiresAt <= now,'Potion clock cannot move backwards.');
    s.active=e;s.timeline.push(copy(e));revise(s);return {state:s,effect:copy(e)};
  }
  function merge(value,inventoryUids,now) {
    clock(now);var s=writable(normalize(value));check(Array.isArray(inventoryUids)&&inventoryUids.length===2&&inventoryUids[0]!==inventoryUids[1],'Choose two distinct stored potions.');
    var chosen=inventoryUids.map(function(uid){var b=s.inventory.find(function(x){return x.uid===uid;});check(b,'A selected potion is no longer available.');return b;});
    var combined=ids.filter(function(id){return chosen.some(function(b){return hasEffect(b,id);});}),seen=s.inventory.concat(s.timeline).map(function(b){return b.uid;}),nextUid;
    do{check(s.sequence<Number.MAX_SAFE_INTEGER,'Potion bottle sequence is exhausted.');nextUid='potion-'+(++s.sequence);}while(seen.indexOf(nextUid)>=0);
    var b={uid:nextUid,potionId:combined[0]};if(combined.length>1)b.components=combined;
    s.inventory=s.inventory.filter(function(x){return inventoryUids.indexOf(x.uid)<0;});s.inventory.push(b);revise(s);return {state:s,bottle:copy(b)};
  }
  function receiveDrop(value, id, receiptId, now) {
    clock(now);potionId(id);key(receiptId,'drop receipt');var s=writable(normalize(value));
    if(s.dropReceipts.indexOf(receiptId)>=0)return {state:s,received:false,reason:'duplicate'};
    s.dropReceipts.push(receiptId);revise(s);
    if(s.inventory.length>=MAX_INVENTORY)return {state:s,received:false,reason:'full'};
    var nextUid;
    do {check(s.sequence < Number.MAX_SAFE_INTEGER,'Potion bottle sequence is exhausted.');nextUid='potion-'+(++s.sequence);} while(s.inventory.concat(s.timeline).some(function(b){return b.uid===nextUid;}));
    s.inventory.push({uid:nextUid,potionId:id});return {state:s,received:true,reason:'received'};
  }
  function endActive(value, now, reason) { clock(now);var s=writable(normalize(value));if(stop(s,now))revise(s);return s; }
  function patchActiveHp(value, hp, now) {
    clock(now);check(Number.isInteger(hp)&&hp>=0&&hp<=100,'Invalid Gaming potion HP.');var s=writable(normalize(value)),e=current(s,now);
    if(!e || !hasEffect(e,'gaming') || e.hp===hp)return s;
    s.active.hp=hp;s.timeline[s.timeline.length-1].hp=hp;return revise(s);
  }
  return {CATALOG:CATALOG,DROP_CATALOG:DROP_CATALOG,SHOP_CATALOG:SHOP_CATALOG,MAX_INVENTORY:MAX_INVENTORY,DURATION_MS:DURATION_MS,create:create,normalize:normalize,recover:recover,current:current,effectsAt:effectsAt,drink:drink,merge:merge,components:components,hasEffect:hasEffect,displayName:displayName,receiveDrop:receiveDrop,endActive:endActive,patchActiveHp:patchActiveHp,dayOfMonth:dayOfMonth};
});
