/* Local statistics only: no gameplay writes, storage, timers, networking or RNG. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BOStats = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
// Finite keyed presentation only: lookup at call time; canonical models and receipts stay untouched.

function _aux(key,fallback,params){const rt=globalThis.BOTranslation,values=params||{},plain=()=>fallback.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):all);if(!rt)return plain();const text=rt.t(key,values);return text===key?plain():text;}
function _auxEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const _auxKeys=Object.freeze({"Tracked since this update · {value1}. Earlier history is not reconstructed.":"aux.stats.238956e4926f","Level {value1}":"aux.levels.ui.39140b8816f7"," · base {value1} Chips × {value2} Mult":"aux.stats.4a4f50729c2a","{value1} in 10":"aux.stats.2d4fa89c84c1","{value1} percentage point":"aux.stats.8c7097e5508d","{value1} Blind wins":"aux.stats.00a725f0ec7f","Ante {value1} Blind wins":"aux.stats.1e90767ab1e7","Recorded wins: {value1}":"aux.stats.8f8de858858b","Not available":"aux.stats.67a926f7008e","Not tracked":"aux.stats.4367a6002fa7","Tracked since this update: Not tracked yet. Extended counters have no earlier history.":"aux.stats.bdc5876be85a","Statistics sections":"aux.stats.66c993f37b71","Lifetime records":"aux.stats.f411423426c7","Runs started":"stats.runs","Runs completed":"aux.stats.f1f73dee293f","Runs won":"stats.wins","Runs lost":"aux.stats.8c240ef0ad61","Runs without a recorded outcome":"aux.stats.c584cd918def","Includes abandoned or still-open runs.":"aux.stats.cc29ff844262","Win rate · completed runs":"aux.stats.a63e2baf96ba","Wins / (wins + losses).":"aux.stats.11f2c4e133bb","Wins / all runs started":"aux.stats.668031105e96","Hands played":"stats.hands","Discard actions":"aux.stats.0778520dad5b","Cards played":"aux.stats.c9acdd82fc10","Cards discarded":"aux.stats.06b894988b81","Blinds defeated":"aux.stats.0f2c0c0e06fb","Gross money earned":"aux.stats.cfeb0ae76c1b","Income, not profit or current bank.":"aux.stats.65ce9e5e00da","Best hand score":"aux.stats.3691cbd6dc3e","Highest Ante reached":"aux.stats.c36202a517b9","Cards per played hand":"aux.stats.49646dbb70fd","Cards per discard action":"aux.stats.254dc5c6afe3","Existing browser records; no advanced history is inferred from these totals.":"aux.stats.2b127dae111a","Since this update":"aux.stats.7b48982d53c5","App visible time":"aux.stats.ffe431ea6088","Time while the app is visible; not a measure of human activity.":"aux.stats.9df1379f328e","Observed hand scores":"aux.stats.79bc62b1db34","Permanent cards created":"aux.stats.bd9639b67c6b","Permanent cards destroyed":"aux.stats.225da12e7704","Jokers acquired":"aux.stats.5e6069149c6d","Jokers removed":"aux.stats.7612b11e81ab","Recorded hands by type":"aux.stats.5b057a0ae8c1","Hand history":"aux.stats.14f700ac17a1","No current run. Start a run to see its live resources and deck.":"aux.stats.4cc99659d115","Current run":"aux.stats.34a04b78fca4","Deck":"aux.stats.889eacd6e13f","Stake":"aux.stock.market.ui.8939aea8419b","Run seed":"aux.stats.d549b7ba5f9b","Phase":"aux.stats.46342ec1eec9","Ante":"game.ante","Round":"game.round","Blind type":"aux.stats.397e029ad47a","Small Blind":"aux.stats.bd5d1acd9296","Big Blind":"aux.stats.a0548d3bd180","Boss Blind":"aux.stats.69cae2bf134f","Boss":"aux.stats.6a6ac8386005","Round score":"aux.stats.2bd0bbc63a8e","Current target":"aux.stats.d7978718d1c9","Target reached":"aux.stats.333c7c9d500a","Run bank":"aux.stats.6e05ac2f18f3","Hands remaining":"aux.stats.817d6fde7e34","Discards remaining":"aux.stats.19202a60c1f7","Hand size":"aux.stats.7f2320edbe7f","Active Jokers":"aux.stats.cecdb73e5dfd","Saved Jokers":"game.savedJokers","Joker slots":"aux.stats.da8f3b99d3b9","Consumables held":"aux.stats.4eb17ca79ba1","Consumable slots":"aux.stats.6aadfca0150c","This run’s recorded play":"aux.stats.bfbcbab70ba6","Bosses defeated":"aux.stats.252c74762606","Skipped Blinds":"aux.stats.0d16ee7d3184","Tarot cards used":"aux.stats.8a3c456ab697","Physical deck":"aux.stats.5397180ea3bf","Permanent playing cards":"aux.stats.f6f7b8637f34","Cards in hand":"aux.stats.1b5cf42789b7","Undrawn cards":"aux.stats.6e5f8f427551","Cards in discard pile":"aux.stats.554709e821af","Enhanced cards":"aux.stats.f3ec0c80abb4","Editioned cards":"aux.stats.408aef8f42ef","Sealed cards":"aux.stats.abc207ae9d1c","Stone cards":"aux.stats.b5366182c111","Wild cards":"aux.stats.3366dac89a7a","Currently debuffed cards":"aux.stats.2bbe5059ef1c","Undrawn means the current draw pile only. The full permanent deck also includes held and discarded cards.":"aux.stats.a10439664603","Printed suits · full deck / undrawn pile":"aux.stats.836b840a6600","Spades":"aux.stats.5612e4b8ae1c","Hearts":"aux.stats.a061d6997cde","Diamonds":"aux.stats.dc95f33b5876","Clubs":"aux.stats.98348a90362d","Printed suits only; Stone, Wild, debuffs and Joker suit effects can change scoring eligibility.":"aux.stats.e24f43b928c3","Jack":"aux.stats.b5fd03dd91df","Queen":"aux.stats.153f6e435589","King":"aux.stats.13166b63aaa7","Ace":"aux.stats.a467da82da54","Printed ranks · full deck / undrawn pile":"aux.stats.6e3d15c607d3","Card modifiers":"aux.stats.9160168ed3ba","Hand levels":"aux.stats.0d86fa361114","Base hand values only, before cards and Jokers.":"aux.stats.14cc53a84eef","Purchases and shop actions":"aux.stats.273519ce5825","Shelf items bought":"aux.stats.72e23fbf60b6","Includes free items; excludes pack choices.":"aux.stats.8201f2010f84","Paid shelf items":"aux.stats.16381be65021","Free shelf items":"aux.stats.e18b79042887","Jokers bought from shelves":"aux.stats.da404a44a1df","Playing cards bought from shelves":"aux.stats.f4da8bfd6784","Consumables bought from shelves":"aux.stats.9bf240f51bbe","Vouchers redeemed":"aux.stats.5276c39a6c9e","Free vouchers redeemed":"aux.stats.537eb523da07","Packs opened":"aux.stats.360f3fd91194","Free packs opened":"aux.stats.6ab2986b9422","Shop rerolls":"aux.stats.067648284854","Free shop rerolls":"aux.stats.62f2000d29d5","Boss rerolls":"aux.stats.9b17818024bc","Shop visits":"aux.stats.a262d9cc4758","Only entering from cashout or a won run, never returning from a pack.":"aux.stats.afa79269a558","Actual shop dollars spent":"aux.stats.e53d7876f5d2","Successful progression receipts only; not inferred from bank changes.":"aux.stats.14079c8862a7","Income and bank observations":"aux.stats.921ef6361f09","Cashouts collected":"aux.stats.e56fc2df2cb4","Cashout money collected":"aux.stats.002b02e23a3e","Interest actually collected":"aux.stats.07a005b095c3","Level 35 bonus collected":"aux.stats.87bdc4b62480","level35BonusMoney":"aux.stats.b313f1fee6c7","After-action peak bank":"aux.stats.79fa6aced5fb","After-action worst debt":"aux.stats.e73b1b1a4253","Historical net profit":"aux.stats.cf3cae55c61d","After-action observations can miss temporary mid-hand highs and lows. Only collected payout lines count as cashout income.":"aux.stats.1f5b50af7282","Items and observed scoring":"aux.stats.a809ec545af5","Jokers sold":"aux.stats.1a491be046cd","Consumables used":"aux.stats.a765f5388808","Consumables sold":"aux.stats.2ab8b654224a","Physical active + saved UID union; moving a Joker is not an acquisition.":"aux.stats.3e97a77f5a14","Observed hand score sum":"aux.stats.e783f89d44cd","Average observed hand score":"aux.stats.6b717f56ccda","Highest observed Chips":"aux.stats.9c16d749bade","Highest observed Mult":"aux.stats.ed638741f68f","Consumables by type":"aux.stats.1bc3505c01aa","Unlocked":"common.unlocked","Locked":"common.locked","Player progression":"aux.stats.40de42af01c4","Player level":"aux.stats.99d06e91cd74","Current level cap":"aux.stats.6b1e969fd0a8","XP available toward levels":"aux.stats.8e529a2fd731","Recorded total XP":"aux.stats.efef340fbb7c","XP required for next level":"aux.stats.5dc34481f2dd","Maximum level":"aux.levels.ui.777774aaf270","XP held at cap":"aux.stats.f4af02276513","Cap gate mode":"aux.stats.588cf260900f","Not configured":"aux.stats.dd1841d29502","Highest Boss Ante defeated":"aux.stats.63b929712795","Current XP multiplier":"aux.stats.58da6ca1113d","Current level buffs":"aux.stats.29e254f1ac27","Music":"aux.stats.6eb00b4b2614","Interest":"aux.stats.595fd085df10","Base Joker slots":"aux.stats.4b004e15f7f2","Number suffixes":"aux.stats.c263b3eb27e3","Passive XP access":"aux.stats.904283903112","Themes":"aux.stats.43ae3265b99f","Potions":"nav.potions","Level 12 replaces the old once-per-run Boss-disable unlock. Hold two potions; one active 2-minute effect at a time.":"aux.stats.d7a7ef71125f","Player luck":"aux.stats.2a195cdc5e77","Base (×1)":"aux.stats.83a6c591b7f6","Level 17+: listed proc probabilities ×1.25, stacking with active Oops ×2 per copy; capped at 100%. Shop rarity and editions are unchanged. Collection stays at base odds.":"aux.stats.b5c7345ef43c","Money per Boss effect":"aux.stats.2665c8532928","Level 19+: $1 per actual active Boss special-effect activation. Card batches count once; suppressed abilities, queries, reload and potion-only administrative changes do not pay. Settles after native action effects.":"aux.stats.dfd4cdecceff","Bonus Boss hands":"aux.stats.4270505ad356","Bonus Boss discards":"aux.stats.3dbd9ac95ec2","Manual XP bonus":"aux.stats.21f94aabb16c","Animation duration":"aux.stats.78e85e85559a","Shop flat discount":"aux.stats.33c678384f29","Two extra original tracks":"aux.stats.8dfd989fc54c","Fullscreen controls":"aux.stats.c3d647a29e3b","Potion merging":"aux.stats.6a96232c7e36","Casino track":"aux.stats.e015cb529b44","Stock Market":"nav.market","Level 21: fictional in-run game dollars only; no real money.":"aux.stats.4209fbc5298a","Faucet access":"aux.stats.d0b104a35200","Enhanced interface":"aux.stats.1c685ab7f9c0","Current round money bonus":"aux.stats.6a681fd7630b","Stored potions":"aux.stats.96b3a676e8a4","Active potion":"potion.active","None":"common.none","Effect remaining":"aux.stats.4216c7916643","Boss potion drop chance":"aux.stats.63c92212e29c","Unavailable":"aux.levels.ui.ca1844969742","No drop · inventory full":"aux.stats.f2f8b41a818a","Start a run to inspect":"aux.stats.b87e63ff46f2","Permanent base CRIT bonus":"aux.stats.fc5552c484cf","Potion base CRIT chance":"aux.stats.f9314ab5740e","Combined base CRIT effective chance":"aux.stats.971d8583cbc3","No active run":"aux.stats.87e6c43b902c","Potion XP multiplier":"aux.stats.e457ced72023","Potion luck multiplier":"aux.stats.5d84ae847ae2","Temporary hand-size bonus":"aux.stats.71b87005e846","Gaming HP":"aux.potions.ui.39c43f81bd87","Inactive":"aux.stats.ac7c949f1211","XP requirement rate":"aux.stats.0dc06c50a558","One active bottle for2 real minutes. Level33 blends preserve all distinct effects for one shared lifetime; Gaming+Critical add4.5% potion base CRIT. Final odds cap100%. Boss drops are capped at 5 in 10; Boss-disabler Potion stays fixed at 1 in 20. Market prediction timers are not cooldowns.":"aux.stats.ca04e0349f22","Passive XP sessions":"aux.stats.4acca865dbb6","Passive session":"aux.stats.e6a7cb43dc04","Running":"aux.stats.f4ccae29e1bb","Cooling down":"aux.stats.8dec2f39b28d","Stopped":"aux.stats.1a4f630ac1b6","Passive restart cooldown":"aux.stats.30ef05ccbf74","Current passive cooldown":"aux.stats.97f70cda8c43","Sessions started":"aux.stats.2fc5e288f610","Sessions completed":"aux.stats.184fbde40bf2","Passive payouts credited":"aux.stats.36f40a35fc14","Passive seconds paid":"aux.stats.4a9df964e016","Passive XP earned":"aux.stats.2a633f2f20aa","Ticks this session":"aux.stats.9d1399441b1c","XP per passive payout":"aux.stats.4ce16a300404","Passive payout interval":"aux.stats.105943d6bf25","Unlocked session duration":"aux.stats.c7ac106ca106","Session remaining":"aux.stats.b70edc427fba","Level 9: 0.01 XP per second. Levels 11–15: 0.025 base XP per second; Level 16+: 0.05 base XP per second until Level 20. Passive XP is doubled from Level 15, so Level 16 gives 0.1 XP per second. At Level 20, Compound Interest replaces flat passive XP: 0.01% of the current XP-bar numerator per second, capped at2 actual XP/sec. Level26 improves this to0.015% and cap3. Exp Jokers multiply BEFORE the actual cap; manual22, Exp Potion and Level15 do not multiply interest. Knowledge keeps its separate potion effect. New sessions last 10 minutes until Level 13, then20/30/50/60 minutes at Levels13/16/33/44; Level22 no longer extends sessions. Five-minute cooldown until Level 14, then four minutes; reaching Level 14 also shortens a current cooldown. No automatic restart. Exp Potion doubles ordinary passive XP; Knowledge earns1 XP per second times active physical Exp Jokers only; Level15, Exp Potion and manual Level22 are excluded. Cooldown Potion can halve a wait once, never stack it to a quarter.":"aux.stats.84d8669b9135","Virtual coin faucet":"aux.stats.7c321789b917","Virtual coin balance":"aux.stats.90a4760bbfb6","Claims today":"aux.stats.cec81120bc86","Earned today · virtual coins":"aux.stats.90db295b4c5a","Daily Ante 4 runs":"aux.stats.a5950c40b229","Current reward rate":"aux.stats.f5db6b52c254","XP per successful claim":"aux.stats.0046aebd5583","Base10; manual22 ×1.2, Exp Potion ×2 and active physical Exp Jokers ×1.2 each apply. The Level15 multiplier does not apply.":"aux.stats.111c04fc81db","Faucet level":"aux.stats.7940d1d5c626","Successful claims":"aux.stats.e017d12ee6b6","Claims toward current faucet level":"aux.stats.acb428e6e0a2","claims":"aux.levels.ui.a61808fe40fe","Claims required for next faucet level":"aux.stats.7802d9410317","Current reward · virtual coins":"aux.stats.e82682d5e356","New claim cooldown":"aux.stats.82943eb70695","Current cooldown remaining":"aux.stats.935b7d167ac3","Permanent coin Joker unlocks":"aux.stats.f2a3669367bb","Virtual coins ever earned":"aux.stats.9b5bec7c21ea","Virtual coins ever spent":"aux.stats.08f9902bddeb","Virtual coins are not cash. Fractional rewards are retained exactly, including pending hundredths. Daily Ante 4 task and claim tiers reset at Atlantic/Canary midnight; successful claims give base10 XP with manual22, Exp Potion and active physical Exp Joker multipliers, but not Level15. Historical lifetime coin income cannot be reconstructed from today’s faucet level or balance.":"aux.stats.c715b03dc462","New progression receipts since this update":"aux.stats.c5b17c8cdb02","Gameplay receipt base XP":"aux.stats.52bf2c9c2b8d","Actual spending, Joker purchases, Tarot uses, played cards, Blind skips/wins and hand-level receipts before multipliers. Passive XP is listed separately.":"aux.stats.cb3f65a07fd0","New hand levels gained":"aux.stats.5bd307278f19","New Blind wins recorded":"aux.stats.5652803bae02","New event receipts":"aux.stats.6b92ea4a1c80","Shop spending base XP":"aux.stats.747f4286ab83","Hand level base XP":"aux.stats.ade88a50dc48","Blind win base XP":"aux.stats.d27eedd93281","Blind skip base XP":"aux.stats.69552f82ab7b","Played card base XP":"aux.stats.62221d48f4e8","Tarot use base XP":"aux.stats.57321feca03a","Joker purchase bonus base XP":"aux.stats.80a92d34387f","Base XP by actual source":"aux.stats.ef3788ad42ef","New hand levels by type":"aux.stats.f5b0ab3d89d6","New Blind wins by type and Ante":"aux.stats.4abdeef2dca7","Jokers":"game.jokers","Decks":"nav.decks","Vouchers":"collection.vouchers","Planets":"collection.planets","Tarot cards":"collection.tarots","Spectral cards":"collection.spectrals","Packs":"aux.stats.3e784fc40cfb","Tags":"aux.stats.1331275bc537","Blinds":"collection.blinds","Enhancements":"aux.stats.ea2b517e4f01","Editions":"aux.stats.c6a48dcca4f7","Seals":"aux.stats.1f4707c8ffd0","Collection discovery":"aux.stats.7dfe73fb80e6","Local milestones earned":"aux.stats.455750b74204","Challenges won":"aux.stats.cd2db99c08b9","Discovery follows the existing local ledger, including its starter entries; browsing a catalog is not an acquisition.":"aux.stats.eda52f1c5379","No recorded stake win":"aux.stats.38713b8f61f8","Highest recorded stake · each deck":"aux.stats.a42a05e29293","Highest recorded stake · winning Jokers":"aux.stats.b328ab0b8815","Joker stake history":"aux.stats.3d549651f415","No recorded stake wins":"aux.stats.5a304d1f0bc4","Only recorded winners are listed; unrecorded historical ownership is not inferred.":"aux.stats.974de6192c45","Audited chance reference":"aux.stats.9b7346d9cdb4","Chance reference is awaiting its probability audit. No unverified odds are shown.":"aux.stats.fdbdbb49ef45"});
function _auxSource(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_aux(key,source):source;}


// Source-explicit text/attribute bindings: no scanning English text, DOM-source recovery or user-data inference.
const _auxDisplayValues=new WeakMap();
function _auxInline(key,fallback,params){return '<span data-i18n-inline="true" data-i18n="'+_auxEsc(key)+'"'+(params?' data-i18n-params="'+_auxEsc(JSON.stringify(params))+'"':'')+'>'+_auxEsc(_aux(key,fallback,params))+'</span>';}
function _auxAttribute(attribute,quote,key,fallback,params){return _auxEsc(_aux(key,fallback,params))+quote+' data-i18n-'+attribute+'='+quote+_auxEsc(key)+(params?quote+' data-i18n-params='+quote+_auxEsc(JSON.stringify(params)):'');}
function _auxValue(key,fallback,params){const value=new String(_aux(key,fallback,params));_auxDisplayValues.set(value,{key,fallback,params});return value;}
function _auxSourceValue(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_auxValue(key,source):source;}
function _auxValueHTML(value){const binding=value&&typeof value==='object'&&_auxDisplayValues.get(value);return binding?_auxInline(binding.key,binding.fallback,binding.params):_auxEsc(value);}

// Exact keyed projection of source-explicit bindings, before native equality checks.
// Never traverses the live document and never invokes an economy/controller/render callback.
function _auxMarkup(html){return globalThis.BOI18n?.projectHTML?.("stats",html)??html;}
function _auxSetText(element,key,fallback,params){const text=_aux(key,fallback,params);element.textContent=text;element.setAttribute?.('data-i18n',key);if(params)element.setAttribute?.('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindText?.(element,key,params||{});return text;}
function _auxSetAttribute(element,attribute,key,fallback,params){const text=_aux(key,fallback,params);if(element.nodeType===9&&attribute==='title'){element.title=text;const leaf=element.querySelector('title');if(leaf)_auxSetText(leaf,key,fallback,params);return text;}element.setAttribute(attribute,text);element.setAttribute('data-i18n-'+attribute,key);if(params)element.setAttribute('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindAttribute?.(element,attribute,key,params||{});return text;}


  var VERSION = 1;
  var COUNTS = ['itemsBought','freeItemsBought','paidItemsBought','jokersBought','cardsBought','consumablesBought',
    'vouchersBought','freeVouchersBought','packsOpened','freePacksOpened','rerolls','freeRerolls','bossRerolls',
    'jokersSold','consumablesUsed','consumablesSold','shopVisits','cashouts','cardsCreated','cardsDestroyed',
    'jokersAcquired','jokersRemoved','handLevelsGained','blindWins','eventsRecorded'];
  var AMOUNTS = ['visibleSeconds','cashoutMoney','interestMoney','level35BonusMoney','shopDollars','baseXp'];
  var COUNT_MAPS = ['purchasesByType','consumablesUsedByType','consumablesSoldByType','handLevelsByType',
    'blindWinsByType','blindWinsByAnte','eventCursors','handCursors'];
  var SECTIONS = [['overview','Overview'],['run','Current run'],['economy','Economy'],['progression','Progression'],['collection','Collection'],['chances','Chances']];
  var HANDS = {high:'High Card',pair:'Pair',two_pair:'Two Pair',three:'Three of a Kind',straight:'Straight',flush:'Flush',full_house:'Full House',four:'Four of a Kind',straight_flush:'Straight Flush',five:'Five of a Kind',flush_house:'Flush House',flush_five:'Flush Five',double_triple:'Double-Triple of a Kind',six:'Six of a Kind'};
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var object = function (x) { return x !== null && typeof x === 'object' && !Array.isArray(x); };
  var finite = function (x) { return typeof x === 'number' && Number.isFinite(x); };
  var nonnegative = function (x) { return finite(x) && x >= 0; };
  var count = function (x) { return Number.isSafeInteger(x) && x >= 0; };
  var identifier = function (x) { return typeof x === 'string' && x.trim().length > 0 && x.length <= 1024; };
  function put(o, k, v) { Object.defineProperty(o, k, {value:v, enumerable:true, writable:true, configurable:true}); }
  function mapCopy(source, valid) {
    var out = {};
    if (object(source)) Object.keys(source).forEach(function (k) { if (identifier(k) && valid(source[k])) put(out, k, source[k]); });
    return out;
  }
  function timestamp(x) { return nonnegative(x) && x <= 8640000000000000; }
  function create(now) {
    var a = {version:VERSION, since:timestamp(now) ? now : Date.now(), peakMoney:null, worstDebt:null,
      handScores:{count:0, sum:0, bestChips:null, bestMult:null}, baseXpBySource:{}, actionReceipts:{}, cashoutReceipts:{}};
    COUNTS.concat(AMOUNTS).forEach(function (key) { a[key] = 0; });
    COUNT_MAPS.forEach(function (key) { a[key] = {}; });
    return a;
  }
  function normalize(existing) {
    var a = create();
    if (!object(existing) || existing.version !== VERSION) return a;
    if (timestamp(existing.since)) a.since = existing.since;
    COUNTS.forEach(function (key) { if (count(existing[key])) a[key] = existing[key]; });
    AMOUNTS.forEach(function (key) { if (nonnegative(existing[key])) a[key] = existing[key]; });
    if (finite(existing.peakMoney)) a.peakMoney = existing.peakMoney;
    if (nonnegative(existing.worstDebt)) a.worstDebt = existing.worstDebt;
    COUNT_MAPS.forEach(function (key) { a[key] = mapCopy(existing[key], count); });
    a.baseXpBySource = mapCopy(existing.baseXpBySource, nonnegative);
    a.actionReceipts = mapCopy(existing.actionReceipts, function (x) { return typeof x === 'string' && x.length <= 100; });
    a.cashoutReceipts = mapCopy(existing.cashoutReceipts, function (x) { return x === true; });
    if (object(existing.handScores)) {
      var h = existing.handScores;
      if (count(h.count)) a.handScores.count = h.count;
      if (nonnegative(h.sum)) a.handScores.sum = h.sum;
      if (nonnegative(h.bestChips)) a.handScores.bestChips = h.bestChips;
      if (nonnegative(h.bestMult)) a.handScores.bestMult = h.bestMult;
    }
    return a;
  }
  function add(o, key, amount, integer) {
    var total = (own(o, key) && nonnegative(o[key]) ? o[key] : 0) + amount;
    put(o, key, Math.min(integer ? Number.MAX_SAFE_INTEGER : Number.MAX_VALUE, total));
  }
  function freeze(x) {
    if (x && typeof x === 'object') { Object.keys(x).forEach(function (k) { freeze(x[k]); }); Object.freeze(x); }
    return x;
  }
  function idKey(x) { return typeof x + ':' + String(x); }
  function ids(items, key) {
    if (!Array.isArray(items)) return null;
    var seen = new Set();
    return items.reduce(function (out, item) {
      var id = item && item[key];
      if ((typeof id === 'string' || finite(id)) && !seen.has(idKey(id))) { seen.add(idKey(id)); out.push(id); }
      return out;
    }, []);
  }
  function offer(item) {
    return item ? {id:typeof item.id === 'string' ? item.id : '', type:typeof item.type === 'string' ? item.type : '',
      price:nonnegative(item.price) ? item.price : null, sold:item.sold === true} : null;
  }
  // Snapshots are compact value copies, not references to mutable cards or bills.
  function capture(run) {
    if (!object(run)) return null;
    var result = run.lastResult || {}, bill = run.payout || {}, lines = Array.isArray(bill.lines) ? bill.lines : [];
    function payoutLine(label) { return lines.reduce(function (n, l) { return n + (l && l.label === label && nonnegative(l.amount) ? l.amount : 0); }, 0); }
    var active = Array.isArray(run.jokers) ? run.jokers : [], reserve = Array.isArray(run.jokerReserve) ? run.jokerReserve : [];
    var shop = run.shop || {};
    return freeze({
      runId:identifier(run._uiId) ? run._uiId : identifier(run.runId) ? run.runId : JSON.stringify([run.seed || '',run.deckId || '',run.stake || 'white']),
      phase:typeof run.phase === 'string' ? run.phase : '', round:count(run.round) ? run.round : 0,
      ante:count(run.ante) ? run.ante : 0, blindIndex:count(run.blindIndex) ? run.blindIndex : 0,
      money:finite(run.money) ? run.money : null,
      statsHands:run.stats && count(run.stats.handsPlayed) ? run.stats.handsPlayed : null,
      lastResult:{key:typeof result.key === 'string' ? result.key : '', total:nonnegative(result.total) ? result.total : null,
        chips:nonnegative(result.chips) ? result.chips : null, mult:nonnegative(result.mult) ? result.mult : null},
      payout:{total:nonnegative(bill.total) ? bill.total : null, interest:payoutLine('Interest'), level35Bonus:payoutLine('Level 35 bonus')},
      cardIds:ids(run.cards, 'id'), jokerUids:Array.isArray(run.jokers) ? ids(active.concat(reserve), 'uid') : null,
      consumableUids:ids(run.consumables, 'uid'),
      consumables:Array.isArray(run.consumables) ? run.consumables.map(function (c) { return {uid:c.uid, id:c.id, type:c.type}; }) : [],
      voucherIds:object(run.vouchers) ? Object.keys(run.vouchers).filter(function (id) { return !!run.vouchers[id]; }) : [],
      shop:{items:Array.isArray(shop.items) ? shop.items.map(offer) : [], packs:Array.isArray(shop.packs) ? shop.packs.map(offer) : [],
        voucher:offer(shop.voucher), rerollCost:nonnegative(shop.rerollCost) ? shop.rerollCost : null},
      // Scalar commit markers distinguish rerolls and zero-dollar actions without invoking RNG.
      rng:finite(run.rng) ? run.rng : null, nextId:count(run.nextId) ? run.nextId : null,
      progressSeq:count(run.progressSeq) ? run.progressSeq : null,
      tagPacksOpened:count(run.tagPacksOpened) ? run.tagPacksOpened : 0,
      hands:finite(run.hands) ? run.hands : null, discards:finite(run.discards) ? run.discards : null,
      handIds:ids(run.hand, 'id'), logLength:Array.isArray(run.log) ? run.log.length : 0
    });
  }
  function difference(after, before) {
    if (!Array.isArray(after) || !Array.isArray(before)) return [];
    var old = new Set(before.map(idKey));
    return after.filter(function (id) { return !old.has(idKey(id)); });
  }
  function fingerprint(before, after, meta) {
    var text = JSON.stringify([before,after,meta.action || '',meta.index,meta.itemType || '']), a = 2166136261, b = 5381;
    for (var i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
    return (a >>> 0).toString(16) + ':' + (b >>> 0).toString(16);
  }
  function boughtOffers(before, after, index) {
    if (count(index)) {
      var x = before[index], y = after[index];
      return x && y && !x.sold && y.sold && x.id === y.id ? [x] : [];
    }
    return before.filter(function (x, i) { var y = after[i]; return x && y && !x.sold && y.sold && x.id === y.id; });
  }
  function requireProfile(profile) { if (!object(profile)) throw new TypeError('A mutable profile is required for statistics.'); }
  // Call only after an engine action commits. Only advancedStats is ever replaced.
  function recordAction(profile, before, after, meta) {
    requireProfile(profile); meta = object(meta) ? meta : {};
    var a = normalize(profile.advancedStats);
    if (!after) return a;
    var runId = after.runId, receipt = fingerprint(before, after, meta);
    if (own(a.actionReceipts, runId) && a.actionReceipts[runId] === receipt) return a;
    put(a.actionReceipts, runId, receipt);
    if (finite(after.money)) {
      a.peakMoney = a.peakMoney === null ? after.money : Math.max(a.peakMoney, after.money);
      a.worstDebt = Math.max(a.worstDebt === null ? 0 : a.worstDebt, -after.money, 0);
    }
    if (!before || before.runId !== runId) { profile.advancedStats = a; return a; }
    if(count(before.tagPacksOpened)&&count(after.tagPacksOpened)&&after.tagPacksOpened>before.tagPacksOpened){var tagPacks=after.tagPacksOpened-before.tagPacksOpened;add(a,'packsOpened',tagPacks,true);add(a,'freePacksOpened',tagPacks,true);}
    add(a, 'cardsCreated', difference(after.cardIds, before.cardIds).length, true);
    add(a, 'cardsDestroyed', difference(before.cardIds, after.cardIds).length, true);
    var removedJokers = difference(before.jokerUids, after.jokerUids);
    add(a, 'jokersAcquired', difference(after.jokerUids, before.jokerUids).length, true);
    add(a, 'jokersRemoved', removedJokers.length, true);
    var cursor = own(a.handCursors, runId) ? a.handCursors[runId] : 0;
    if (count(before.statsHands) && count(after.statsHands) && after.statsHands > cursor) {
      // One lastResult cannot honestly reconstruct multiple missed hands.
      if (after.statsHands === before.statsHands + 1 && nonnegative(after.lastResult.total)) {
        add(a.handScores, 'count', 1, true); add(a.handScores, 'sum', after.lastResult.total);
        ['chips','mult'].forEach(function (key) {
          var field = key === 'chips' ? 'bestChips' : 'bestMult', value = after.lastResult[key];
          if (nonnegative(value)) a.handScores[field] = a.handScores[field] === null ? value : Math.max(a.handScores[field], value);
        });
      }
      put(a.handCursors, runId, after.statsHands);
    }
    if ((before.phase === 'cashout' || before.phase === 'won') && after.phase === 'shop') add(a, 'shopVisits', 1, true);
    if (before.phase === 'cashout' && (after.phase === 'shop' || after.phase === 'won')) {
      var cashoutId = JSON.stringify([runId,before.round,before.ante,before.blindIndex]);
      if (!own(a.cashoutReceipts, cashoutId) && nonnegative(before.payout.total)) {
        add(a, 'cashouts', 1, true); add(a, 'cashoutMoney', before.payout.total);
        add(a, 'interestMoney', before.payout.interest); add(a, 'level35BonusMoney', before.payout.level35Bonus);
        put(a.cashoutReceipts, cashoutId, true);
      }
    }
    // A sound effect is deliberately NOT a purchase receipt: pack choices also use "purchase".
    if ((meta.action === 'buy' || meta.action === 'buy-use') && before.phase === 'shop') {
      boughtOffers(before.shop.items, after.shop.items, meta.index).forEach(function (item) {
        var type = item.type || (typeof meta.itemType === 'string' ? meta.itemType : 'unknown');
        add(a, 'itemsBought', 1, true); add(a.purchasesByType, type, 1, true);
        if (item.price === 0) add(a, 'freeItemsBought', 1, true);
        else if (nonnegative(item.price)) add(a, 'paidItemsBought', 1, true);
        if (type === 'joker') add(a, 'jokersBought', 1, true);
        else if (type === 'card') add(a, 'cardsBought', 1, true);
        else if (['tarot','planet','spectral'].indexOf(type) >= 0) add(a, 'consumablesBought', 1, true);
        if (meta.action === 'buy-use' && ['tarot','planet'].indexOf(type) >= 0) {
          add(a, 'consumablesUsed', 1, true); add(a.consumablesUsedByType, type, 1, true);
        }
      });
    } else if (meta.action === 'voucher' && before.phase === 'shop') {
      var v = before.shop.voucher;
      if (v && !v.sold && before.voucherIds.indexOf(v.id) < 0 && after.voucherIds.indexOf(v.id) >= 0) {
        add(a, 'vouchersBought', 1, true); if (v.price === 0) add(a, 'freeVouchersBought', 1, true);
      }
    } else if (meta.action === 'pack' && before.phase === 'shop') {
      boughtOffers(before.shop.packs, after.shop.packs, meta.index).forEach(function (p) { add(a, 'packsOpened', 1, true); if (p.price === 0) add(a, 'freePacksOpened', 1, true); });
    } else if (meta.action === 'reroll' && before.phase === 'shop' && after.phase === 'shop' && JSON.stringify(before) !== JSON.stringify(after)) {
      add(a, 'rerolls', 1, true); if (before.shop.rerollCost === 0) add(a, 'freeRerolls', 1, true);
    } else if (meta.action === 'reroll-boss' && JSON.stringify(before) !== JSON.stringify(after)) add(a, 'bossRerolls', 1, true);
    else if ((meta.action === 'sell-joker' || meta.action === 'mothim-attack') && removedJokers.length) add(a, 'jokersSold', 1, true);
    else if (meta.action === 'use-consumable' || meta.action === 'sell-consumable') {
      var removed = new Set(difference(before.consumableUids, after.consumableUids).map(idKey));
      var consumed = before.consumables.find(function (c) { return removed.has(idKey(c.uid)); });
      if (consumed) {
        var used = meta.action === 'use-consumable';
        add(a, used ? 'consumablesUsed' : 'consumablesSold', 1, true);
        if (identifier(consumed.type)) add(used ? a.consumablesUsedByType : a.consumablesSoldByType, consumed.type, 1, true);
      }
    }
    profile.advancedStats = a;
    return a;
  }
  function validEvent(e) {
    if (!object(e) || !count(e.seq) || e.seq === 0 || !nonnegative(e.baseXp)) throw new TypeError('Invalid statistics event receipt.');
    var expected;
    if (e.kind === 'shop-spend' && nonnegative(e.dollars)) expected = e.dollars;
    else if (e.kind === 'hand-level' && identifier(e.hand) && count(e.levels)) expected = 3 * e.levels;
    else if (e.kind === 'blind-win' && count(e.ante) && count(e.blindIndex) && e.blindIndex <= 2) expected = [3,5,10][e.blindIndex] * e.ante;
    else if (e.kind === 'tarot-use' && identifier(e.tarotId)) expected = 3;
    else if (e.kind === 'blind-skip' && count(e.ante) && count(e.blindIndex) && e.blindIndex <= 1) expected = 5;
    else if (e.kind === 'hand-play' && count(e.cards) && e.cards >= 1 && e.cards <= 6) expected = e.cards;
    else if (e.kind === 'joker-buy' && identifier(e.jokerId)) expected = 3;
    if (!nonnegative(expected) || expected !== e.baseXp) throw new TypeError('Statistics require an actual, source-matched progression receipt.');
    return e;
  }
  // [fromSeq EXCLUSIVE, toSeq INCLUSIVE], from the successful PG.applyEvents call.
  // The lower bound skips legacy receipts even on the first call after this update.
  function recordEvents(profile, runId, events, fromSeq, toSeq) {
    requireProfile(profile);
    if (!identifier(runId) || !Array.isArray(events) || !count(fromSeq) || !count(toSeq) || toSeq < fromSeq) throw new TypeError('A run ID and successful progression cursor range are required.');
    var a = normalize(profile.advancedStats), cursor = Math.max(fromSeq, own(a.eventCursors, runId) ? a.eventCursors[runId] : 0);
    var fresh = events.filter(function (e) { return e && e.seq > cursor && e.seq <= toSeq; }).map(validEvent).sort(function (x, y) { return x.seq - y.seq; });
    fresh.forEach(function (e) {
      if (e.seq <= cursor) return;
      if (e.seq !== cursor + 1) throw new RangeError('Missing statistics event sequence ' + (cursor + 1) + '; no counters applied.');
      if (e.kind === 'shop-spend') add(a, 'shopDollars', e.dollars);
      else if (e.kind === 'hand-level') { add(a, 'handLevelsGained', e.levels, true); add(a.handLevelsByType, e.hand, e.levels, true); }
      else if (e.kind === 'blind-win') {
        add(a, 'blindWins', 1, true); add(a.blindWinsByType, ['small','big','boss'][e.blindIndex], 1, true); add(a.blindWinsByAnte, String(e.ante), 1, true);
      }
      add(a, 'baseXp', e.baseXp); add(a.baseXpBySource, e.kind, e.baseXp); add(a, 'eventsRecorded', 1, true); cursor = e.seq;
    });
    if (cursor < toSeq) throw new RangeError('Missing statistics event sequence ' + (cursor + 1) + '; no counters applied.');
    put(a.eventCursors, runId, cursor); profile.advancedStats = a;
    return a;
  }

  function esc(x) { if(x&&typeof x==='object'&&_auxDisplayValues.has(x))return _auxValueHTML(x);return String(x === null || x === undefined ? '' : x).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function named(catalog, id) { var found = Array.isArray(catalog) && catalog.find(function (x) { return x.id === id; }); return found ? _auxSourceValue(found.name) : id || _auxValue("aux.stats.67a926f7008e","Not available"); }
  function duration(seconds) {
    var s = Math.floor(seconds), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return (h ? h + 'h ' : '') + (m || h ? m + 'm ' : '') + (s % 60) + 's';
  }
  function render(options) {
    options = object(options) ? options : {};
    var p = object(options.profile) ? options.profile : {}, run = object(options.run) ? options.run : null;
    var E = options.engine || {}, PG = options.progression || {}, rules = options.levelRules || {};
    var tracked = object(p.advancedStats) && p.advancedStats.version === VERSION && timestamp(p.advancedStats.since);
    var a = tracked ? normalize(p.advancedStats) : null, section = options.section;
    var actualLevel=object(p.progression)?p.progression.level:null,rich=Number.isInteger(actualLevel)&&actualLevel>=34&&actualLevel<=100;
    var tr=function(en,es,fr){return globalThis.BOLevelEnhancements?globalThis.BOLevelEnhancements.text(en,es,fr):en;};
    var sections=rich?SECTIONS.concat([['insights',tr('Insights','Análisis','Analyses')]]):SECTIONS;
    if (!sections.some(function (s) { return s[0] === section; })) section = 'overview';
    function fmt(n, decimals) {
      if (!finite(n)) return _auxValue("aux.stats.4367a6002fa7","Not tracked");
      if (typeof options.format === 'function') { try { return String(options.format(n, decimals)); } catch (e) { /* safe built-in fallback */ } }
      return n.toLocaleString('en-US', {maximumFractionDigits:decimals === undefined ? 2 : decimals});
    }
    function val(o, key) { return object(o) && own(o, key) && finite(o[key]) ? o[key] : null; }
    function n(o, key) { return fmt(val(o, key)); }
    function dollar(x) { return finite(x) ? '$' + fmt(x) : _auxValue("aux.stats.4367a6002fa7","Not tracked"); }
    function advanced(key, money) { var x = a ? a[key] : null; return money ? dollar(x) : fmt(x); }
    function ratio(num, den) { return finite(num) && finite(den) && den > 0 ? fmt(num / den * 100) + '%' : _auxValue("aux.stats.4367a6002fa7","Not tracked"); }
    function row(label, value, note) { return '<div class="stat-box"><small>' + esc(label) + '</small><strong>' + esc(value === null || value === undefined ? _auxValue("aux.stats.4367a6002fa7","Not tracked") : value) + '</strong>' + (note ? '<small class="stats-note">' + esc(note) + '</small>' : '') + '</div>'; }
    function panel(title, rows, note) { return '<section class="panel stats-panel"><h3>' + esc(title) + '</h3>' + (note ? '<p class="build-note">' + esc(note) + '</p>' : '') + '<div class="stat-grid">' + rows.join('') + '</div></section>'; }
    function mapRows(map, label, asMoney) { return object(map) ? Object.keys(map).filter(function (key) { return nonnegative(map[key]); }).map(function (key) { return row(label ? label(key) : key, asMoney ? dollar(map[key]) : fmt(map[key])); }) : []; }
    var scope = tracked ? _auxValue("aux.stats.238956e4926f","Tracked since this update · {value1}. Earlier history is not reconstructed.",{value1:(new Date(a.since).toISOString().slice(0,10))}) : _auxValue("aux.stats.bdc5876be85a","Tracked since this update: Not tracked yet. Extended counters have no earlier history.");
    var html = _auxMarkup(("<div class=\"stats-dashboard"+(rich?' levels-rich-dashboard':'')+"\"><nav class=\"stats-tabs tabbar\" aria-label=\""+_auxAttribute("aria-label","\"","aux.stats.66c993f37b71","Statistics sections")+"\">") + sections.map(function (s) {
      return '<button type="button" class="tab' + (section === s[0] ? ' active' : '') + '" data-action="stats-section" data-section="' + s[0] + '" aria-pressed="' + (section === s[0]) + '">' + _auxValueHTML(_auxSourceValue(s[1])) + '</button>';
    }).join('') + '</nav><p class="stats-scope build-note">' + esc(scope) + '</p><div class="stats-section" data-stats-section="' + section + '">');
    if(rich&&(section==='overview'||section==='insights')){
      var recordedProgress=p.progression,view=null;try{if(typeof PG.progress==='function')view=PG.progress(recordedProgress,rules)}catch(e){/* unknown configured price is not guessed */}
      html+='<div class="levels-rich-stats">'+panel(tr('Recorded progression','Progreso registrado','Progression enregistrée'),[
        row(tr('Actual player level','Nivel real del jugador','Niveau réel du joueur'),fmt(actualLevel)),
        row(tr('Current XP bank','XP guardada actual','Réserve d’XP actuelle'),n(recordedProgress,'xp')),
        row(tr('Lifetime earned XP','XP ganada de por vida','XP gagnée au total'),n(recordedProgress,'totalXp')),
        row(tr('Next transition cost','Coste del próximo nivel','Coût du prochain niveau'),view?fmt(view.required):null),
        row(tr('XP still needed','XP que falta','XP encore nécessaire'),view?fmt(view.remainingXp):null),
        row(tr('Balatro action XP bonus','Bonus de XP por acciones de Balatro','Bonus d’XP des actions Balatro'),'+10%')
      ],tr('No outcome is inferred from a missing result. Earned levels and stored XP are never reconstructed.','No se deduce un resultado si no está registrado. No se reconstruyen niveles ganados ni XP guardada.','Aucun résultat n’est déduit d’un résultat manquant. Les niveaux gagnés et l’XP gardée ne sont jamais reconstruits.'))+'</div>';
    }
    if(section==='insights'){
      var handCount=val(p,'hands'),discardCount=val(p,'discards'),blindCount=val(p,'blinds'),moneyTotal=val(p,'money');
      html+=panel(tr('Derived lifetime ratios','Ratios históricos derivados','Ratios historiques calculés'),[
        row(tr('Hands per defeated blind','Manos por ciega superada','Mains par blinde battue'),handCount!==null&&blindCount>0?fmt(handCount/blindCount):null),
        row(tr('Discards per played hand','Descartes por mano jugada','Défausses par main jouée'),discardCount!==null&&handCount>0?fmt(discardCount/handCount):null),
        row(tr('Gross income per defeated blind','Ingresos brutos por ciega superada','Revenus bruts par blinde battue'),moneyTotal!==null&&blindCount>0?dollar(moneyTotal/blindCount):null),
        row(tr('Observed mean hand score','Media de puntuación observada','Score moyen observé'),a&&a.handScores.count>0?fmt(a.handScores.sum/a.handScores.count):null)
      ],tr('Ratios use only recorded numerators and denominators. Gross income is not profit; observed scores cover only the tracked update period.','Los ratios solo usan numeradores y denominadores registrados. Ingresos brutos no es beneficio; las puntuaciones observadas cubren solo el periodo registrado.','Les ratios utilisent seulement les valeurs enregistrées. Les revenus bruts ne sont pas un bénéfice ; les scores observés couvrent seulement la période suivie.'));
    }else if (section === 'overview') {
      var wins = val(p,'wins'), losses = val(p,'losses'), started = val(p,'runs'), completed = wins !== null && losses !== null ? wins + losses : null;
      html += panel(_auxValue("aux.stats.f411423426c7","Lifetime records"), [row(_auxValue("stats.runs","Runs started"), n(p,'runs')),row(_auxValue("aux.stats.f1f73dee293f","Runs completed"), fmt(completed)),row(_auxValue("stats.wins","Runs won"), n(p,'wins')),row(_auxValue("aux.stats.8c240ef0ad61","Runs lost"), n(p,'losses')),
        row(_auxValue("aux.stats.c584cd918def","Runs without a recorded outcome"), started !== null && completed !== null ? fmt(Math.max(0,started-completed)) : _auxValue("aux.stats.4367a6002fa7","Not tracked"), _auxValue("aux.stats.cc29ff844262","Includes abandoned or still-open runs.")),
        row(_auxValue("aux.stats.a63e2baf96ba","Win rate · completed runs"), ratio(wins,completed), _auxValue("aux.stats.11f2c4e133bb","Wins / (wins + losses).")),row(_auxValue("aux.stats.668031105e96","Wins / all runs started"), ratio(wins,started)),
        row(_auxValue("stats.hands","Hands played"),n(p,'hands')),row(_auxValue("aux.stats.0778520dad5b","Discard actions"),n(p,'discards')),row(_auxValue("aux.stats.c9acdd82fc10","Cards played"),n(p,'cardsPlayed')),row(_auxValue("aux.stats.06b894988b81","Cards discarded"),n(p,'cardsDiscarded')),
        row(_auxValue("aux.stats.0f2c0c0e06fb","Blinds defeated"),n(p,'blinds')),row(_auxValue("aux.stats.cfeb0ae76c1b","Gross money earned"),dollar(val(p,'money')), _auxValue("aux.stats.65ce9e5e00da","Income, not profit or current bank.")),row(_auxValue("aux.stats.3691cbd6dc3e","Best hand score"),n(p,'best')),row(_auxValue("aux.stats.c36202a517b9","Highest Ante reached"),n(p,'ante')),
        row(_auxValue("aux.stats.49646dbb70fd","Cards per played hand"),finite(p.hands) && p.hands > 0 && finite(p.cardsPlayed) ? fmt(p.cardsPlayed/p.hands) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),
        row(_auxValue("aux.stats.254dc5c6afe3","Cards per discard action"),finite(p.discards) && p.discards > 0 && finite(p.cardsDiscarded) ? fmt(p.cardsDiscarded/p.discards) : _auxValue("aux.stats.4367a6002fa7","Not tracked"))], _auxValue("aux.stats.2b127dae111a","Existing browser records; no advanced history is inferred from these totals."));
      html += panel(_auxValue("aux.stats.7b48982d53c5","Since this update"), [row(_auxValue("aux.stats.ffe431ea6088","App visible time"),a ? duration(a.visibleSeconds) : _auxValue("aux.stats.4367a6002fa7","Not tracked"),_auxValue("aux.stats.9df1379f328e","Time while the app is visible; not a measure of human activity.")),row(_auxValue("aux.stats.79bc62b1db34","Observed hand scores"),a ? fmt(a.handScores.count) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.bd9639b67c6b","Permanent cards created"),advanced('cardsCreated')),row(_auxValue("aux.stats.225da12e7704","Permanent cards destroyed"),advanced('cardsDestroyed')),row(_auxValue("aux.stats.5e6069149c6d","Jokers acquired"),advanced('jokersAcquired')),row(_auxValue("aux.stats.7612b11e81ab","Jokers removed"),advanced('jokersRemoved'))]);
      var handRows = mapRows(p.handCounts,function (key) { return _auxSourceValue(HANDS[key] || key); });
      html += panel(_auxValue("aux.stats.5b057a0ae8c1","Recorded hands by type"),handRows.length ? handRows : [row(_auxValue("aux.stats.14f700ac17a1","Hand history"),_auxValue("aux.stats.4367a6002fa7","Not tracked"))]);
    } else if (section === 'run') {
      if (!run) html += ("<p class=\"empty-message\""+" data-i18n=\"aux.stats.4cc99659d115\""+">"+_auxEsc(_aux("aux.stats.4cc99659d115","No current run. Start a run to see its live resources and deck."))+"</p>");
      else {
        var stats = run.stats || {}, cards = Array.isArray(run.cards) ? run.cards : [], draw = Array.isArray(run.drawPile) ? run.drawPile : [];
        function length(key) { return Array.isArray(run[key]) ? fmt(run[key].length) : _auxValue("aux.stats.4367a6002fa7","Not tracked"); }
        html += panel(_auxValue("aux.stats.34a04b78fca4","Current run"), [row(_auxValue("aux.stats.889eacd6e13f","Deck"),named(E.decks,run.deckId)),row(_auxValue("aux.stock.market.ui.8939aea8419b","Stake"),named(E.stakes,run.stake || 'white')),row(_auxValue("aux.stats.d549b7ba5f9b","Run seed"),run.seed),row(_auxValue("aux.stats.46342ec1eec9","Phase"),run.phase),row(_auxValue("game.ante","Ante"),n(run,'ante')),row(_auxValue("game.round","Round"),n(run,'round')),
          row(_auxValue("aux.stats.397e029ad47a","Blind type"),[_auxValue("aux.stats.bd5d1acd9296","Small Blind"),_auxValue("aux.stats.a0548d3bd180","Big Blind"),_auxValue("aux.stats.69cae2bf134f","Boss Blind")][run.blindIndex] || _auxValue("aux.stats.67a926f7008e","Not available")),row(_auxValue("aux.stats.6a6ac8386005","Boss"),named(E.bosses,run.bossId)),row(_auxValue("aux.stats.2bd0bbc63a8e","Round score"),n(run,'score')),row(_auxValue("aux.stats.d7978718d1c9","Current target"),n(run,'target')),row(_auxValue("aux.stats.333c7c9d500a","Target reached"),ratio(val(run,'score'),val(run,'target'))),row(_auxValue("aux.stats.6e05ac2f18f3","Run bank"),dollar(val(run,'money'))),
          row(_auxValue("aux.stats.817d6fde7e34","Hands remaining"),n(run,'hands')),row(_auxValue("aux.stats.19202a60c1f7","Discards remaining"),n(run,'discards')),row(_auxValue("aux.stats.7f2320edbe7f","Hand size"),n(run,'handSize')),row(_auxValue("aux.stats.cecdb73e5dfd","Active Jokers"),length('jokers')),row(_auxValue("game.savedJokers","Saved Jokers"),Array.isArray(run.jokerReserve) ? fmt(run.jokerReserve.length) : '0'),row(_auxValue("aux.stats.da8f3b99d3b9","Joker slots"),n(run,'jokerSlots')),row(_auxValue("aux.stats.4eb17ca79ba1","Consumables held"),length('consumables')),row(_auxValue("aux.stats.6aadfca0150c","Consumable slots"),n(run,'consumableSlots'))]);
        html += panel(_auxValue("aux.stats.bfbcbab70ba6","This run’s recorded play"), [row(_auxValue("stats.hands","Hands played"),n(stats,'handsPlayed')),row(_auxValue("aux.stats.0778520dad5b","Discard actions"),n(stats,'discardsUsed')),row(_auxValue("aux.stats.c9acdd82fc10","Cards played"),n(stats,'cardsPlayed')),row(_auxValue("aux.stats.06b894988b81","Cards discarded"),n(stats,'cardsDiscarded')),row(_auxValue("aux.stats.0f2c0c0e06fb","Blinds defeated"),n(stats,'blindsWon')),row(_auxValue("aux.stats.252c74762606","Bosses defeated"),n(stats,'bossesWon')),row(_auxValue("aux.stats.3691cbd6dc3e","Best hand score"),n(stats,'bestHand')),row(_auxValue("aux.stats.cfeb0ae76c1b","Gross money earned"),dollar(val(stats,'moneyEarned'))),row(_auxValue("aux.stats.0d16ee7d3184","Skipped Blinds"),n(run,'skips')),row(_auxValue("aux.stats.8a3c456ab697","Tarot cards used"),n(run,'tarotsUsed'))]);
        var enhanced = cards.filter(function (c) { return c.enhancement && c.enhancement !== 'none'; }).length;
        html += panel(_auxValue("aux.stats.5397180ea3bf","Physical deck"), [row(_auxValue("aux.stats.f6f7b8637f34","Permanent playing cards"),length('cards')),row(_auxValue("aux.stats.1b5cf42789b7","Cards in hand"),length('hand')),row(_auxValue("aux.stats.6e5f8f427551","Undrawn cards"),length('drawPile')),row(_auxValue("aux.stats.554709e821af","Cards in discard pile"),length('discardPile')),row(_auxValue("aux.stats.f3ec0c80abb4","Enhanced cards"),fmt(enhanced)),row(_auxValue("aux.stats.408aef8f42ef","Editioned cards"),fmt(cards.filter(function(c){return !!c.edition;}).length)),row(_auxValue("aux.stats.abc207ae9d1c","Sealed cards"),fmt(cards.filter(function(c){return !!c.seal;}).length)),row(_auxValue("aux.stats.b5366182c111","Stone cards"),fmt(cards.filter(function(c){return c.enhancement === 'stone';}).length)),row(_auxValue("aux.stats.3366dac89a7a","Wild cards"),fmt(cards.filter(function(c){return c.enhancement === 'wild';}).length)),row(_auxValue("aux.stats.2bbe5059ef1c","Currently debuffed cards"),fmt(cards.filter(function(c){return !!c.debuffed;}).length))], _auxValue("aux.stats.a10439664603","Undrawn means the current draw pile only. The full permanent deck also includes held and discarded cards."));
        html += panel(_auxValue("aux.stats.836b840a6600","Printed suits · full deck / undrawn pile"), [['S',_auxValue("aux.stats.5612e4b8ae1c","Spades")],['H',_auxValue("aux.stats.a061d6997cde","Hearts")],['D',_auxValue("aux.stats.dc95f33b5876","Diamonds")],['C',_auxValue("aux.stats.98348a90362d","Clubs")]].map(function (s) { return row(s[1],fmt(cards.filter(function(c){return c.suit === s[0];}).length) + ' / ' + fmt(draw.filter(function(c){return c.suit === s[0];}).length)); }), _auxValue("aux.stats.e24f43b928c3","Printed suits only; Stone, Wild, debuffs and Joker suit effects can change scoring eligibility."));
        var rankRows = []; for (var rank = 2; rank <= 14; rank++) { (function (r) { rankRows.push(row(({11:_auxValue("aux.stats.b5fd03dd91df","Jack"),12:_auxValue("aux.stats.153f6e435589","Queen"),13:_auxValue("aux.stats.13166b63aaa7","King"),14:_auxValue("aux.stats.a467da82da54","Ace")})[r] || String(r),fmt(cards.filter(function(c){return c.rank === r;}).length) + ' / ' + fmt(draw.filter(function(c){return c.rank === r;}).length))); }(rank)); }
        html += panel(_auxValue("aux.stats.6e3d15c607d3","Printed ranks · full deck / undrawn pile"),rankRows);
        var mods = ['enhancement','edition','seal'].reduce(function (rows, key) {
          var counts = {}; cards.forEach(function(c){if(c[key] && c[key] !== 'none') add(counts,String(c[key]),1,true);});
          return rows.concat(mapRows(counts,function(id){return key + ': ' + id;}));
        }, []);
        if (mods.length) html += panel(_auxValue("aux.stats.9160168ed3ba","Card modifiers"),mods);
        html += panel(_auxValue("aux.stats.0d86fa361114","Hand levels"),object(run.levels) ? Object.keys(run.levels).map(function (key) {
          var lv = run.levels[key], def = E.hands && E.hands[key], text = _auxValue("aux.levels.ui.39140b8816f7","Level {value1}",{value1:(fmt(lv))});
          if (Array.isArray(def) && finite(lv)) text += _auxValue("aux.stats.4a4f50729c2a"," · base {value1} Chips × {value2} Mult",{value1:(fmt(def[1]+def[3]*(lv-1))),value2:(fmt(def[2]+def[4]*(lv-1)))});
          return row(_auxSourceValue(HANDS[key] || key),text);
        }) : [row(_auxValue("aux.stats.0d86fa361114","Hand levels"),_auxValue("aux.stats.4367a6002fa7","Not tracked"))], _auxValue("aux.stats.14cc53a84eef","Base hand values only, before cards and Jokers."));
      }
    } else if (section === 'economy') {
      html += panel(_auxValue("aux.stats.273519ce5825","Purchases and shop actions"), [row(_auxValue("aux.stats.72e23fbf60b6","Shelf items bought"),advanced('itemsBought'),_auxValue("aux.stats.8201f2010f84","Includes free items; excludes pack choices.")),row(_auxValue("aux.stats.16381be65021","Paid shelf items"),advanced('paidItemsBought')),row(_auxValue("aux.stats.e18b79042887","Free shelf items"),advanced('freeItemsBought')),row(_auxValue("aux.stats.da404a44a1df","Jokers bought from shelves"),advanced('jokersBought')),row(_auxValue("aux.stats.f4da8bfd6784","Playing cards bought from shelves"),advanced('cardsBought')),row(_auxValue("aux.stats.9bf240f51bbe","Consumables bought from shelves"),advanced('consumablesBought')),row(_auxValue("aux.stats.5276c39a6c9e","Vouchers redeemed"),advanced('vouchersBought')),row(_auxValue("aux.stats.537eb523da07","Free vouchers redeemed"),advanced('freeVouchersBought')),row(_auxValue("aux.stats.360f3fd91194","Packs opened"),advanced('packsOpened')),row(_auxValue("aux.stats.6ab2986b9422","Free packs opened"),advanced('freePacksOpened')),row(_auxValue("aux.stats.067648284854","Shop rerolls"),advanced('rerolls')),row(_auxValue("aux.stats.62f2000d29d5","Free shop rerolls"),advanced('freeRerolls')),row(_auxValue("aux.stats.9b17818024bc","Boss rerolls"),advanced('bossRerolls')),row(_auxValue("aux.stats.a262d9cc4758","Shop visits"),advanced('shopVisits'),_auxValue("aux.stats.afa79269a558","Only entering from cashout or a won run, never returning from a pack.")),row(_auxValue("aux.stats.e53d7876f5d2","Actual shop dollars spent"),advanced('shopDollars',true),_auxValue("aux.stats.14079c8862a7","Successful progression receipts only; not inferred from bank changes."))]);
      html += panel(_auxValue("aux.stats.921ef6361f09","Income and bank observations"), [row(_auxValue("aux.stats.e56fc2df2cb4","Cashouts collected"),advanced('cashouts')),row(_auxValue("aux.stats.002b02e23a3e","Cashout money collected"),advanced('cashoutMoney',true)),row(_auxValue("aux.stats.07a005b095c3","Interest actually collected"),advanced('interestMoney',true)),row(_auxValue("aux.stats.87bdc4b62480","Level 35 bonus collected"),advanced("level35BonusMoney",true)),row(_auxValue("aux.stats.79fa6aced5fb","After-action peak bank"),advanced('peakMoney',true)),row(_auxValue("aux.stats.e73b1b1a4253","After-action worst debt"),advanced('worstDebt',true)),row(_auxValue("aux.stats.cf3cae55c61d","Historical net profit"),_auxValue("aux.stats.4367a6002fa7","Not tracked"))], _auxValue("aux.stats.1f5b50af7282","After-action observations can miss temporary mid-hand highs and lows. Only collected payout lines count as cashout income."));
      html += panel(_auxValue("aux.stats.a809ec545af5","Items and observed scoring"), [row(_auxValue("aux.stats.1a491be046cd","Jokers sold"),advanced('jokersSold')),row(_auxValue("aux.stats.a765f5388808","Consumables used"),advanced('consumablesUsed')),row(_auxValue("aux.stats.2ab8b654224a","Consumables sold"),advanced('consumablesSold')),row(_auxValue("aux.stats.bd9639b67c6b","Permanent cards created"),advanced('cardsCreated')),row(_auxValue("aux.stats.225da12e7704","Permanent cards destroyed"),advanced('cardsDestroyed')),row(_auxValue("aux.stats.5e6069149c6d","Jokers acquired"),advanced('jokersAcquired'),_auxValue("aux.stats.3e97a77f5a14","Physical active + saved UID union; moving a Joker is not an acquisition.")),row(_auxValue("aux.stats.7612b11e81ab","Jokers removed"),advanced('jokersRemoved')),row(_auxValue("aux.stats.79bc62b1db34","Observed hand scores"),a ? fmt(a.handScores.count) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.e783f89d44cd","Observed hand score sum"),a ? fmt(a.handScores.sum) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.6b717f56ccda","Average observed hand score"),a && a.handScores.count ? fmt(a.handScores.sum/a.handScores.count) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.9c16d749bade","Highest observed Chips"),a ? fmt(a.handScores.bestChips) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.ed638741f68f","Highest observed Mult"),a ? fmt(a.handScores.bestMult) : _auxValue("aux.stats.4367a6002fa7","Not tracked"))]);
      if (a) {
        var usedRows = mapRows(a.consumablesUsedByType,function(key){return key + ' used';}).concat(mapRows(a.consumablesSoldByType,function(key){return key + ' sold';}));
        if (usedRows.length) html += panel(_auxValue("aux.stats.1bc3505c01aa","Consumables by type"),usedRows);
      }
    } else if (section === 'progression') {
      var pr = object(p.progression) ? p.progression : {}, view = {}, buffs = {}, faucet = {};
      var potionInfo = object(options.potionInfo) ? options.potionInfo : {}, potionState = object(potionInfo.state) ? potionInfo.state : object(p.potions) ? p.potions : {}, fx = object(potionInfo.effects) ? potionInfo.effects : {}, activePotion = object(potionInfo.current) ? potionInfo.current : null;
      var potionName = activePotion ? (Array.isArray(potionInfo.catalog) ? potionInfo.catalog.find(function(x){return x.id === activePotion.potionId;}) : null) : null;
      var potionOdds = {}; try { if(run && typeof E.probabilityInfo === 'function') potionOdds = E.probabilityInfo(run); } catch(e) { /* no fabricated current odds */ }
      try { if (typeof PG.progress === 'function') view = PG.progress(pr,rules.playerXpConfig); } catch (e) { /* unavailable configuration */ }
      try { if (typeof PG.buffs === 'function' && count(pr.level)) buffs = PG.buffs(pr.level); } catch (e) { /* unavailable configuration */ }
      try { if (typeof PG.faucetInfo === 'function') faucet = PG.faucetInfo(pr,Date.now(),rules); } catch (e) { /* unavailable configuration */ }
      function yes(value) { return value === true ? _auxValue("common.unlocked","Unlocked") : value === false ? _auxValue("common.locked","Locked") : _auxValue("aux.stats.4367a6002fa7","Not tracked"); }
      html += panel(_auxValue("aux.stats.40de42af01c4","Player progression"), [row(_auxValue("aux.stats.99d06e91cd74","Player level"),n(pr,'level')),row(_auxValue("aux.stats.6b1e969fd0a8","Current level cap"),finite(view.cap) ? fmt(view.cap) : n(pr,'cap')),row(_auxValue("aux.stats.8e529a2fd731","XP available toward levels"),fmt(val(pr,'xp'),3)),row(_auxValue("aux.stats.efef340fbb7c","Recorded total XP"),fmt(val(pr,'totalXp'),3)),row(_auxValue("aux.stats.5dc34481f2dd","XP required for next level"),view.maxLevel ? _auxValue("aux.levels.ui.777774aaf270","Maximum level") : fmt(view.required)),row(_auxValue("aux.stats.f4af02276513","XP held at cap"),fmt(view.heldXp,3)),row(_auxValue("aux.stats.588cf260900f","Cap gate mode"),pr.gateMode || _auxValue("aux.stats.dd1841d29502","Not configured")),row(_auxValue("aux.stats.252c74762606","Bosses defeated"),n(pr,'bossesWon')),row(_auxValue("aux.stats.63b929712795","Highest Boss Ante defeated"),n(pr,'highestAnteDefeated')),row(_auxValue("aux.stats.58da6ca1113d","Current XP multiplier"),finite(buffs.xpMultiplier) ? '×' + fmt(buffs.xpMultiplier * (finite(fx.xpMultiplier) ? fx.xpMultiplier : 1) * (buffs.manualXpMultiplier||1) * (rules.playerXpConfig?.jokerXpMultiplier||1)) : _auxValue("aux.stats.4367a6002fa7","Not tracked"))]);
      html += panel(_auxValue("aux.stats.29e254f1ac27","Current level buffs"), [row(_auxValue("aux.stats.6eb00b4b2614","Music"),yes(buffs.music)),row(_auxValue("aux.stats.595fd085df10","Interest"),yes(buffs.interest)),row(_auxValue("aux.stats.4b004e15f7f2","Base Joker slots"),n(buffs,'jokerBaseSlots')),row(_auxValue("aux.stats.c263b3eb27e3","Number suffixes"),yes(buffs.numberSuffixes)),row(_auxValue("aux.stats.904283903112","Passive XP access"),yes(buffs.passiveXp)),row(_auxValue("aux.stats.43ae3265b99f","Themes"),yes(buffs.themes)),row(_auxValue("nav.potions","Potions"),yes(buffs.potions),tr('Level12: hold2; Level40: hold3; Level47: hold4. One active 2-minute effect.','Nivel12: guarda2; Nivel40: guarda3; Nivel47: guarda4. Un efecto activo de 2 minutos.','Niveau12 : garde2 ; Niveau40 : garde3 ; Niveau47 : garde4. Un effet actif de 2 minutes.')),row(_auxValue("aux.stats.2a195cdc5e77","Player luck"),finite(buffs.luckMultiplier) ? buffs.luckMultiplier>1 ? '+25% (×'+fmt(buffs.luckMultiplier)+')' : _auxValue("aux.stats.83a6c591b7f6","Base (×1)") : _auxValue("aux.stats.4367a6002fa7","Not tracked"),_auxValue("aux.stats.b5c7345ef43c","Level 17+: listed proc probabilities ×1.25, stacking with active Oops ×2 per copy; capped at 100%. Shop rarity and editions are unchanged. Collection stays at base odds.")),row(tr('Extra offered pack options','Opciones extra en los sobres','Options supplémentaires par paquet'),n(buffs,'packOptionBonus'),tr('Level19+: one more generated option, not another pick. Replaces Boss-special dollars.','Nivel19+: una opción generada más, no otra elección. Sustituye los dólares por efectos de jefe.','Niveau19+ : une option proposée en plus, pas un choix en plus. Remplace les dollars des effets du Boss.')),row(_auxValue("aux.stats.4270505ad356","Bonus Boss hands"),n(buffs,'bossBonusHands')),row(_auxValue("aux.stats.3dbd9ac95ec2","Bonus Boss discards"),n(buffs,'bossBonusDiscards')),row(_auxValue("aux.stats.21f94aabb16c","Manual XP bonus"),fmt(((buffs.manualXpMultiplier||1)-1)*100)+'%'),row(_auxValue("aux.stats.78e85e85559a","Animation duration"),fmt((buffs.animationDurationMultiplier||1)*100)+'%'),row(_auxValue("aux.stats.33c678384f29","Shop flat discount"),dollar(buffs.shopDiscount||0)),row(_auxValue("aux.stats.8dfd989fc54c","Two extra original tracks"),yes(buffs.moreTracks)),row(_auxValue("aux.stats.c3d647a29e3b","Fullscreen controls"),yes(buffs.fullscreen)),row(_auxValue("aux.stats.6a96232c7e36","Potion merging"),yes(buffs.potionMerging)),row(_auxValue("aux.stats.e015cb529b44","Casino track"),yes(buffs.casinoTrack)),row(_auxValue("nav.market","Stock Market"),yes(buffs.stockMarket),_auxValue("aux.stats.4209fbc5298a","Level 21: fictional in-run game dollars only; no real money.")),row(_auxValue("aux.stats.d0b104a35200","Faucet access"),yes(buffs.faucet)),row(_auxValue("aux.stats.1c685ab7f9c0","Enhanced interface"),yes(buffs.enhancedUI)),row(_auxValue("aux.stats.6a681fd7630b","Current round money bonus"),dollar(val(buffs,'roundBonusMoney')))]);
      var drop = object(potionOdds.potionDrop) ? potionOdds.potionDrop : null;
      html += panel(_auxValue("nav.potions","Potions"), [row(_auxValue("aux.stats.96b3a676e8a4","Stored potions"),(Array.isArray(potionState.inventory)?fmt(potionState.inventory.length):'0')+' / '+(actualLevel>=47?4:actualLevel>=40?3:2)),row(_auxValue("potion.active","Active potion"),activePotion ? (activePotion.components?activePotion.components.map(function(id){var d=(potionInfo.catalog||[]).find(function(x){return x.id===id;});return d?d.name:id;}).join(' + '):(potionName ? potionName.name : activePotion.potionId)) : _auxValue("common.none","None")),row(_auxValue("aux.stats.4216c7916643","Effect remaining"),activePotion ? duration(Math.ceil(Math.max(0,activePotion.expiresAt-(finite(potionInfo.now)?potionInfo.now:Date.now()))/1000)) : '0s'),row(_auxValue("aux.stats.63c92212e29c","Boss potion drop chance"),drop ? !drop.unlocked ? _auxValue("common.locked","Locked") : drop.blocked ? _auxValue("aux.levels.ui.ca1844969742","Unavailable") : drop.full ? _auxValue("aux.stats.f2f8b41a818a","No drop · inventory full") : _auxValue("aux.stats.2d4fa89c84c1","{value1} in 10",{value1:(fmt(drop.numerator))}) : _auxValue("aux.stats.b87e63ff46f2","Start a run to inspect")),row(_auxValue("aux.stats.fc5552c484cf","Permanent base CRIT bonus"),_auxValue("aux.stats.8c7097e5508d","{value1} percentage point",{value1:(fmt((buffs.baseCritChance||0)*100))})),row(_auxValue("aux.stats.f9314ab5740e","Potion base CRIT chance"),fmt((finite(fx.baseCritChance)?fx.baseCritChance:0)*100)+'%'),row(_auxValue("aux.stats.971d8583cbc3","Combined base CRIT effective chance"),finite(potionOdds.baseCritEffectiveChance) ? fmt(potionOdds.baseCritEffectiveChance*100)+'%' : _auxValue("aux.stats.87e6c43b902c","No active run")),row(_auxValue("aux.stats.e457ced72023","Potion XP multiplier"),'×'+fmt(finite(fx.xpMultiplier)?fx.xpMultiplier:1)),row(_auxValue("aux.stats.5d84ae847ae2","Potion luck multiplier"),'×'+fmt(finite(fx.luckMultiplier)?fx.luckMultiplier:1)),row(_auxValue("aux.stats.71b87005e846","Temporary hand-size bonus"),'+'+fmt(finite(fx.handSizeBonus)?fx.handSizeBonus:0)),row(_auxValue("aux.potions.ui.39c43f81bd87","Gaming HP"),finite(fx.gamingHP) ? fmt(fx.gamingHP)+' / 100' : _auxValue("aux.stats.ac7c949f1211","Inactive")),row(_auxValue("aux.stats.0dc06c50a558","XP requirement rate"),fmt((finite(fx.xpCostMultiplier)?fx.xpCostMultiplier:1)*100)+'%')], _auxValue("aux.stats.ca04e0349f22","One active bottle for2 real minutes. Level33 blends preserve all distinct effects for one shared lifetime; Gaming+Critical add4.5% potion base CRIT. Final odds cap100%. Boss drops are capped at 5 in 10; Boss-disabler Potion stays fixed at 1 in 20. Market prediction timers are not cooldowns."));
      var passiveInfo = object(options.passiveInfo) ? options.passiveInfo : {}, passive = object(p.passiveXp) ? p.passiveXp : {}, passiveActive = buffs.passiveXp === true && passive.sequence > 0 && passive.completionCounted !== true && finite(passive.endsAt) && Date.now() < passive.endsAt;
      html += panel(_auxValue("aux.stats.4acca865dbb6","Passive XP sessions"), [row(_auxValue("aux.stats.e6a7cb43dc04","Passive session"),passiveActive ? _auxValue("aux.stats.f4ccae29e1bb","Running") : passiveInfo.coolingDown ? _auxValue("aux.stats.8dec2f39b28d","Cooling down") : _auxValue("aux.stats.1a4f630ac1b6","Stopped")),row(_auxValue("aux.stats.30ef05ccbf74","Passive restart cooldown"),finite(passiveInfo.cooldownRemainingMs) ? duration(Math.ceil(passiveInfo.cooldownRemainingMs/1000)) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.97f70cda8c43","Current passive cooldown"),pr.level>=9 ? duration((passiveInfo.coolingDown&&finite(passiveInfo.committedCooldownMs) ? passiveInfo.committedCooldownMs : finite(passiveInfo.nextCooldownMs) ? passiveInfo.nextCooldownMs : finite(passiveInfo.cooldownMs) ? passiveInfo.cooldownMs : pr.level>=14 ? 240000 : 300000)/1000) : _auxValue("common.locked","Locked")),row(_auxValue("aux.stats.2fc5e288f610","Sessions started"),n(passive,'sessionsStarted')),row(_auxValue("aux.stats.184fbde40bf2","Sessions completed"),n(passive,'sessionsCompleted')),row(_auxValue("aux.stats.36f40a35fc14","Passive payouts credited"),n(passive,'totalTicks')),row(_auxValue("aux.stats.4a9df964e016","Passive seconds paid"),finite(passive.totalCreditedMs) ? fmt(passive.totalCreditedMs/1000) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.2a633f2f20aa","Passive XP earned"),fmt(val(passive,'totalXp'),3)),row(_auxValue("aux.stats.9d1399441b1c","Ticks this session"),n(passive,'creditedTicks')),row(_auxValue("aux.stats.4ce16a300404","XP per passive payout"),buffs.passiveXp===true ? fmt(finite(passiveInfo.rateXp) ? passiveInfo.rateXp : finite(fx.knowledgeXpPerSecond) ? fx.knowledgeXpPerSecond : (pr.level>=20?0:pr.level>=16?.05:pr.level>=11?.025:.01)*(finite(buffs.xpMultiplier)?buffs.xpMultiplier:1)*(finite(fx.xpMultiplier)?fx.xpMultiplier:1),3) : _auxValue("common.locked","Locked")),row(_auxValue("aux.stats.105943d6bf25","Passive payout interval"),pr.level>=9 ? '1s' : _auxValue("common.locked","Locked")),row(_auxValue("aux.stats.c7ac106ca106","Unlocked session duration"),pr.level>=9 ? duration((pr.level>=44?60:pr.level>=33?50:pr.level>=16?30:pr.level>=13?20:10)*60) : _auxValue("common.locked","Locked")),row(_auxValue("aux.stats.b70edc427fba","Session remaining"),passiveActive ? duration(Math.ceil(Math.max(0,passive.endsAt-Date.now())/1000)) : '0s')], _auxValue("aux.stats.84d8669b9135","Level 9: 0.01 XP per second. Levels 11–15: 0.025 base XP per second; Level 16+: 0.05 base XP per second until Level 20. Passive XP is doubled from Level 15, so Level 16 gives 0.1 XP per second. At Level 20, Compound Interest replaces flat passive XP: 0.01% of the current XP-bar numerator per second, capped at2 actual XP/sec. Level26 improves this to0.015% and cap3. Exp Jokers multiply BEFORE the actual cap; manual22, Exp Potion and Level15 do not multiply interest. Knowledge keeps its separate potion effect. New sessions last 10 minutes until Level 13, then20/30/50/60 minutes at Levels13/16/33/44; Level22 no longer extends sessions. Five-minute cooldown until Level 14, then four minutes; reaching Level 14 also shortens a current cooldown. No automatic restart. Exp Potion doubles ordinary passive XP; Knowledge earns1 XP per second times active physical Exp Jokers only; Level15, Exp Potion and manual Level22 are excluded. Cooldown Potion can halve a wait once, never stack it to a quarter."));
      var f = object(pr.faucet) ? pr.faucet : {};
      html += panel(_auxValue("aux.stats.7c321789b917","Virtual coin faucet"), [row(_auxValue("aux.stats.90a4760bbfb6","Virtual coin balance"),finite(faucet.coins) ? fmt(faucet.coins) : finite(pr.coinsHalf) ? fmt(pr.coinsHalf/2) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.cec81120bc86","Claims today"),fmt(faucet.claimsToday)),row(_auxValue("aux.stats.90db295b4c5a","Earned today · virtual coins"),fmt(faucet.earnedTodayCoins)),row(_auxValue("aux.stats.a5950c40b229","Daily Ante 4 runs"),finite(faucet.dailyRuns) ? fmt(faucet.dailyRuns)+' / 5' : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.f5db6b52c254","Current reward rate"),finite(faucet.effectiveRatePercent) ? fmt(faucet.effectiveRatePercent)+'%' : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.0046aebd5583","XP per successful claim"),fmt(finite(faucet.awardedXp)?faucet.awardedXp:finite(faucet.awardXp)?faucet.awardXp:10),_auxValue("aux.stats.111c04fc81db","Base10; manual22 ×1.2, Exp Potion ×2 and active physical Exp Jokers ×1.2 each apply. The Level15 multiplier does not apply.")),row(_auxValue("aux.stats.7940d1d5c626","Faucet level"),n(f,'level')),row(_auxValue("aux.stats.e017d12ee6b6","Successful claims"),n(f,'totalClaims')),row(_auxValue("aux.stats.acb428e6e0a2","Claims toward current faucet level"),n(f,"claims")),row(_auxValue("aux.stats.7802d9410317","Claims required for next faucet level"),faucet.maxLevel ? _auxValue("aux.levels.ui.777774aaf270","Maximum level") : fmt(faucet.requiredClaims)),row(_auxValue("aux.stats.e82682d5e356","Current reward · virtual coins"),fmt(faucet.rewardCoins)),row(_auxValue("aux.stats.82943eb70695","New claim cooldown"),finite(faucet.cooldownMs) ? duration(faucet.cooldownMs/1000) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.935b7d167ac3","Current cooldown remaining"),finite(faucet.remainingMs) ? duration(Math.ceil(faucet.remainingMs/1000)) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.f2a3669367bb","Permanent coin Joker unlocks"),Array.isArray(pr.unlockedJokers) ? fmt(new Set(pr.unlockedJokers).size) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.9b5bec7c21ea","Virtual coins ever earned"),_auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.08f9902bddeb","Virtual coins ever spent"),_auxValue("aux.stats.4367a6002fa7","Not tracked"))], _auxValue("aux.stats.c715b03dc462","Virtual coins are not cash. Fractional rewards are retained exactly, including pending hundredths. Daily Ante 4 task and claim tiers reset at Atlantic/Canary midnight; successful claims give base10 XP with manual22, Exp Potion and active physical Exp Joker multipliers, but not Level15. Historical lifetime coin income cannot be reconstructed from today’s faucet level or balance."));
      html += panel(_auxValue("aux.stats.c5b17c8cdb02","New progression receipts since this update"), [row(_auxValue("aux.stats.52bf2c9c2b8d","Gameplay receipt base XP"),advanced('baseXp'),_auxValue("aux.stats.cb3f65a07fd0","Actual spending, Joker purchases, Tarot uses, played cards, Blind skips/wins and hand-level receipts before multipliers. Passive XP is listed separately.")),row(_auxValue("aux.stats.5bd307278f19","New hand levels gained"),advanced('handLevelsGained')),row(_auxValue("aux.stats.5652803bae02","New Blind wins recorded"),advanced('blindWins')),row(_auxValue("aux.stats.6b92ea4a1c80","New event receipts"),advanced('eventsRecorded'))]);
      if (a) {
        var xpRows = mapRows(a.baseXpBySource,function(key){return ({'shop-spend':_auxValue("aux.stats.747f4286ab83","Shop spending base XP"),'hand-level':_auxValue("aux.stats.ade88a50dc48","Hand level base XP"),'blind-win':_auxValue("aux.stats.d27eedd93281","Blind win base XP"),'blind-skip':_auxValue("aux.stats.69552f82ab7b","Blind skip base XP"),'hand-play':_auxValue("aux.stats.62221d48f4e8","Played card base XP"),'tarot-use':_auxValue("aux.stats.57321feca03a","Tarot use base XP"),'joker-buy':_auxValue("aux.stats.80a92d34387f","Joker purchase bonus base XP")})[key] || key;});
        var byHand = mapRows(a.handLevelsByType,function(key){return _auxSourceValue(HANDS[key] || key);});
        var blindRows = mapRows(a.blindWinsByType,function(key){return _auxValue("aux.stats.00a725f0ec7f","{value1} Blind wins",{value1:(key.charAt(0).toUpperCase()+key.slice(1))});}).concat(mapRows(a.blindWinsByAnte,function(key){return _auxValue("aux.stats.1e90767ab1e7","Ante {value1} Blind wins",{value1:(key)});}));
        if (xpRows.length) html += panel(_auxValue("aux.stats.ef3788ad42ef","Base XP by actual source"),xpRows);
        if (byHand.length) html += panel(_auxValue("aux.stats.f5b0ab3d89d6","New hand levels by type"),byHand);
        if (blindRows.length) html += panel(_auxValue("aux.stats.4abdeef2dca7","New Blind wins by type and Ante"),blindRows);
      }
    } else if (section === 'collection') {
      var discovery = object(p.discovery) ? p.discovery : {}, kinds = [
        ['jokers',_auxValue("game.jokers","Jokers"),E.jokers],['decks',_auxValue("nav.decks","Decks"),E.decks],['vouchers',_auxValue("collection.vouchers","Vouchers"),E.vouchers],['planets',_auxValue("collection.planets","Planets"),E.planets],['tarots',_auxValue("collection.tarots","Tarot cards"),E.tarots],['spectrals',_auxValue("collection.spectrals","Spectral cards"),E.spectrals],['packs',_auxValue("aux.stats.3e784fc40cfb","Packs"),E.packs],['tags',_auxValue("aux.stats.1331275bc537","Tags"),E.tags],
        ['blinds',_auxValue("collection.blinds","Blinds"),[{id:'small'},{id:'big'}].concat(E.bosses || [])],['enhancements',_auxValue("aux.stats.ea2b517e4f01","Enhancements"),Object.keys(E.enhancements || {}).map(function(id){return {id:id};})],['editions',_auxValue("aux.stats.c6a48dcca4f7","Editions"),[{id:'base'}].concat(Object.keys(E.editions || {}).map(function(id){return {id:id};}))],['seals',_auxValue("aux.stats.1f4707c8ffd0","Seals"),Object.keys(E.seals || {}).map(function(id){return {id:id};})]
      ];
      html += panel(_auxValue("aux.stats.7dfe73fb80e6","Collection discovery"),kinds.map(function (kind) {
        var available = Array.isArray(kind[2]) ? new Set(kind[2].map(function(x){return x.id;})) : null;
        var found = Array.isArray(discovery[kind[0]]) && available ? new Set(discovery[kind[0]].filter(function(id){return available.has(id);})).size : null;
        return row(_auxValue('aux.stats.discovery.'+kind[0],{"jokers":"Jokers","decks":"Decks","vouchers":"Vouchers","planets":"Planets","tarots":"Tarot cards","spectrals":"Spectral cards","packs":"Packs","tags":"Tags","blinds":"Blinds","enhancements":"Enhancements","editions":"Editions","seals":"Seals"}[kind[0]]+' discovered'),found === null ? _auxValue("aux.stats.4367a6002fa7","Not tracked") : fmt(found) + ' / ' + fmt(available.size));
      }).concat([row(_auxValue("aux.stats.455750b74204","Local milestones earned"),Array.isArray(p.achievements) ? fmt(new Set(p.achievements).size) : _auxValue("aux.stats.4367a6002fa7","Not tracked")),row(_auxValue("aux.stats.cd2db99c08b9","Challenges won"),object(p.challengeWins) ? fmt(Object.keys(p.challengeWins).filter(function(id){return p.challengeWins[id] === true;}).length) : _auxValue("aux.stats.4367a6002fa7","Not tracked"))]), _auxValue("aux.stats.eda52f1c5379","Discovery follows the existing local ledger, including its starter entries; browsing a catalog is not an acquisition."));
      function stake(index) { return Number.isInteger(index) && index >= 0 && Array.isArray(E.stakes) && E.stakes[index] ? E.stakes[index].name : _auxValue("aux.stats.38713b8f61f8","No recorded stake win"); }
      var deckRows = (E.decks || []).map(function(d){return row(d.name,stake(p.deckStakeWins && p.deckStakeWins[d.id]),_auxValue("aux.stats.8f8de858858b","Recorded wins: {value1}",{value1:(object(p.deckWins) ? fmt(nonnegative(p.deckWins[d.id]) ? p.deckWins[d.id] : 0) : 'Not tracked')}));});
      html += panel(_auxValue("aux.stats.a42a05e29293","Highest recorded stake · each deck"),deckRows);
      var jokerRecords = (E.jokers || []).filter(function(j){return object(p.jokerStakeWins) && Number.isInteger(p.jokerStakeWins[j.id]) && p.jokerStakeWins[j.id] >= 0 && p.jokerStakeWins[j.id] < (E.stakes || []).length;});
      html += panel(_auxValue("aux.stats.b328ab0b8815","Highest recorded stake · winning Jokers"),jokerRecords.length ? jokerRecords.map(function(j){return row(j.name,stake(p.jokerStakeWins[j.id]));}) : [row(_auxValue("aux.stats.3d549651f415","Joker stake history"),_auxValue("aux.stats.5a304d1f0bc4","No recorded stake wins"))], _auxValue("aux.stats.974de6192c45","Only recorded winners are listed; unrecorded historical ownership is not inferred."));
    } else {
      var info = options.probabilityInfo, probabilityRows = Array.isArray(info) ? info : object(info) && Array.isArray(info.rows) ? info.rows : null;
      if (probabilityRows) html += panel(object(info) && info.title ? info.title : _auxValue("aux.stats.9b7346d9cdb4","Audited chance reference"),probabilityRows.filter(function(r){return object(r) || Array.isArray(r);}).map(function(r){return Array.isArray(r) ? row(r[0],r[1],r[2]) : row(r.label,r.value,r.note);}),object(info) ? info.note : '');
      else html += ("<p class=\"empty-message\""+" data-i18n=\"aux.stats.fdbdbb49ef45\""+">"+_auxEsc(_aux("aux.stats.fdbdbb49ef45","Chance reference is awaiting its probability audit. No unverified odds are shown."))+"</p>");
    }
    return _auxMarkup(html + '</div></div>');
  }
  return {create:create, normalize:normalize, capture:capture, recordAction:recordAction, recordEvents:recordEvents, render:render};
}));
