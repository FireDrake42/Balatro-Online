/* Local statistics only: no gameplay writes, storage, timers, networking or RNG. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BOStats = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
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

  function esc(x) { return String(x === null || x === undefined ? '' : x).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function named(catalog, id) { var found = Array.isArray(catalog) && catalog.find(function (x) { return x.id === id; }); return found ? found.name : id || 'Not available'; }
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
    if (!SECTIONS.some(function (s) { return s[0] === section; })) section = 'overview';
    function fmt(n, decimals) {
      if (!finite(n)) return 'Not tracked';
      if (typeof options.format === 'function') { try { return String(options.format(n, decimals)); } catch (e) { /* safe built-in fallback */ } }
      return n.toLocaleString('en-US', {maximumFractionDigits:decimals === undefined ? 2 : decimals});
    }
    function val(o, key) { return object(o) && own(o, key) && finite(o[key]) ? o[key] : null; }
    function n(o, key) { return fmt(val(o, key)); }
    function dollar(x) { return finite(x) ? '$' + fmt(x) : 'Not tracked'; }
    function advanced(key, money) { var x = a ? a[key] : null; return money ? dollar(x) : fmt(x); }
    function ratio(num, den) { return finite(num) && finite(den) && den > 0 ? fmt(num / den * 100) + '%' : 'Not tracked'; }
    function row(label, value, note) { return '<div class="stat-box"><small>' + esc(label) + '</small><strong>' + esc(value === null || value === undefined ? 'Not tracked' : value) + '</strong>' + (note ? '<small class="stats-note">' + esc(note) + '</small>' : '') + '</div>'; }
    function panel(title, rows, note) { return '<section class="panel stats-panel"><h3>' + esc(title) + '</h3>' + (note ? '<p class="build-note">' + esc(note) + '</p>' : '') + '<div class="stat-grid">' + rows.join('') + '</div></section>'; }
    function mapRows(map, label, asMoney) { return object(map) ? Object.keys(map).filter(function (key) { return nonnegative(map[key]); }).map(function (key) { return row(label ? label(key) : key, asMoney ? dollar(map[key]) : fmt(map[key])); }) : []; }
    var scope = tracked ? 'Tracked since this update · ' + new Date(a.since).toISOString().slice(0,10) + '. Earlier history is not reconstructed.' : 'Tracked since this update: Not tracked yet. Extended counters have no earlier history.';
    var html = '<div class="stats-dashboard"><nav class="stats-tabs tabbar" aria-label="Statistics sections">' + SECTIONS.map(function (s) {
      return '<button type="button" class="tab' + (section === s[0] ? ' active' : '') + '" data-action="stats-section" data-section="' + s[0] + '" aria-pressed="' + (section === s[0]) + '">' + s[1] + '</button>';
    }).join('') + '</nav><p class="stats-scope build-note">' + esc(scope) + '</p><div class="stats-section" data-stats-section="' + section + '">';
    if (section === 'overview') {
      var wins = val(p,'wins'), losses = val(p,'losses'), started = val(p,'runs'), completed = wins !== null && losses !== null ? wins + losses : null;
      html += panel('Lifetime records', [row('Runs started', n(p,'runs')),row('Runs completed', fmt(completed)),row('Runs won', n(p,'wins')),row('Runs lost', n(p,'losses')),
        row('Runs without a recorded outcome', started !== null && completed !== null ? fmt(Math.max(0,started-completed)) : 'Not tracked', 'Includes abandoned or still-open runs.'),
        row('Win rate · completed runs', ratio(wins,completed), 'Wins / (wins + losses).'),row('Wins / all runs started', ratio(wins,started)),
        row('Hands played',n(p,'hands')),row('Discard actions',n(p,'discards')),row('Cards played',n(p,'cardsPlayed')),row('Cards discarded',n(p,'cardsDiscarded')),
        row('Blinds defeated',n(p,'blinds')),row('Gross money earned',dollar(val(p,'money')), 'Income, not profit or current bank.'),row('Best hand score',n(p,'best')),row('Highest Ante reached',n(p,'ante')),
        row('Cards per played hand',finite(p.hands) && p.hands > 0 && finite(p.cardsPlayed) ? fmt(p.cardsPlayed/p.hands) : 'Not tracked'),
        row('Cards per discard action',finite(p.discards) && p.discards > 0 && finite(p.cardsDiscarded) ? fmt(p.cardsDiscarded/p.discards) : 'Not tracked')], 'Existing browser records; no advanced history is inferred from these totals.');
      html += panel('Since this update', [row('App visible time',a ? duration(a.visibleSeconds) : 'Not tracked','Time while the app is visible; not a measure of human activity.'),row('Observed hand scores',a ? fmt(a.handScores.count) : 'Not tracked'),row('Permanent cards created',advanced('cardsCreated')),row('Permanent cards destroyed',advanced('cardsDestroyed')),row('Jokers acquired',advanced('jokersAcquired')),row('Jokers removed',advanced('jokersRemoved'))]);
      var handRows = mapRows(p.handCounts,function (key) { return HANDS[key] || key; });
      html += panel('Recorded hands by type',handRows.length ? handRows : [row('Hand history','Not tracked')]);
    } else if (section === 'run') {
      if (!run) html += '<p class="empty-message">No current run. Start a run to see its live resources and deck.</p>';
      else {
        var stats = run.stats || {}, cards = Array.isArray(run.cards) ? run.cards : [], draw = Array.isArray(run.drawPile) ? run.drawPile : [];
        function length(key) { return Array.isArray(run[key]) ? fmt(run[key].length) : 'Not tracked'; }
        html += panel('Current run', [row('Deck',named(E.decks,run.deckId)),row('Stake',named(E.stakes,run.stake || 'white')),row('Run seed',run.seed),row('Phase',run.phase),row('Ante',n(run,'ante')),row('Round',n(run,'round')),
          row('Blind type',['Small Blind','Big Blind','Boss Blind'][run.blindIndex] || 'Not available'),row('Boss',named(E.bosses,run.bossId)),row('Round score',n(run,'score')),row('Current target',n(run,'target')),row('Target reached',ratio(val(run,'score'),val(run,'target'))),row('Run bank',dollar(val(run,'money'))),
          row('Hands remaining',n(run,'hands')),row('Discards remaining',n(run,'discards')),row('Hand size',n(run,'handSize')),row('Active Jokers',length('jokers')),row('Saved Jokers',Array.isArray(run.jokerReserve) ? fmt(run.jokerReserve.length) : '0'),row('Joker slots',n(run,'jokerSlots')),row('Consumables held',length('consumables')),row('Consumable slots',n(run,'consumableSlots'))]);
        html += panel('This run’s recorded play', [row('Hands played',n(stats,'handsPlayed')),row('Discard actions',n(stats,'discardsUsed')),row('Cards played',n(stats,'cardsPlayed')),row('Cards discarded',n(stats,'cardsDiscarded')),row('Blinds defeated',n(stats,'blindsWon')),row('Bosses defeated',n(stats,'bossesWon')),row('Best hand score',n(stats,'bestHand')),row('Gross money earned',dollar(val(stats,'moneyEarned'))),row('Skipped Blinds',n(run,'skips')),row('Tarot cards used',n(run,'tarotsUsed'))]);
        var enhanced = cards.filter(function (c) { return c.enhancement && c.enhancement !== 'none'; }).length;
        html += panel('Physical deck', [row('Permanent playing cards',length('cards')),row('Cards in hand',length('hand')),row('Undrawn cards',length('drawPile')),row('Cards in discard pile',length('discardPile')),row('Enhanced cards',fmt(enhanced)),row('Editioned cards',fmt(cards.filter(function(c){return !!c.edition;}).length)),row('Sealed cards',fmt(cards.filter(function(c){return !!c.seal;}).length)),row('Stone cards',fmt(cards.filter(function(c){return c.enhancement === 'stone';}).length)),row('Wild cards',fmt(cards.filter(function(c){return c.enhancement === 'wild';}).length)),row('Currently debuffed cards',fmt(cards.filter(function(c){return !!c.debuffed;}).length))], 'Undrawn means the current draw pile only. The full permanent deck also includes held and discarded cards.');
        html += panel('Printed suits · full deck / undrawn pile', [['S','Spades'],['H','Hearts'],['D','Diamonds'],['C','Clubs']].map(function (s) { return row(s[1],fmt(cards.filter(function(c){return c.suit === s[0];}).length) + ' / ' + fmt(draw.filter(function(c){return c.suit === s[0];}).length)); }), 'Printed suits only; Stone, Wild, debuffs and Joker suit effects can change scoring eligibility.');
        var rankRows = []; for (var rank = 2; rank <= 14; rank++) { (function (r) { rankRows.push(row(({11:'Jack',12:'Queen',13:'King',14:'Ace'})[r] || String(r),fmt(cards.filter(function(c){return c.rank === r;}).length) + ' / ' + fmt(draw.filter(function(c){return c.rank === r;}).length))); }(rank)); }
        html += panel('Printed ranks · full deck / undrawn pile',rankRows);
        var mods = ['enhancement','edition','seal'].reduce(function (rows, key) {
          var counts = {}; cards.forEach(function(c){if(c[key] && c[key] !== 'none') add(counts,String(c[key]),1,true);});
          return rows.concat(mapRows(counts,function(id){return key + ': ' + id;}));
        }, []);
        if (mods.length) html += panel('Card modifiers',mods);
        html += panel('Hand levels',object(run.levels) ? Object.keys(run.levels).map(function (key) {
          var lv = run.levels[key], def = E.hands && E.hands[key], text = 'Level ' + fmt(lv);
          if (Array.isArray(def) && finite(lv)) text += ' · base ' + fmt(def[1]+def[3]*(lv-1)) + ' Chips × ' + fmt(def[2]+def[4]*(lv-1)) + ' Mult';
          return row(HANDS[key] || key,text);
        }) : [row('Hand levels','Not tracked')], 'Base hand values only, before cards and Jokers.');
      }
    } else if (section === 'economy') {
      html += panel('Purchases and shop actions', [row('Shelf items bought',advanced('itemsBought'),'Includes free items; excludes pack choices.'),row('Paid shelf items',advanced('paidItemsBought')),row('Free shelf items',advanced('freeItemsBought')),row('Jokers bought from shelves',advanced('jokersBought')),row('Playing cards bought from shelves',advanced('cardsBought')),row('Consumables bought from shelves',advanced('consumablesBought')),row('Vouchers redeemed',advanced('vouchersBought')),row('Free vouchers redeemed',advanced('freeVouchersBought')),row('Packs opened',advanced('packsOpened')),row('Free packs opened',advanced('freePacksOpened')),row('Shop rerolls',advanced('rerolls')),row('Free shop rerolls',advanced('freeRerolls')),row('Boss rerolls',advanced('bossRerolls')),row('Shop visits',advanced('shopVisits'),'Only entering from cashout or a won run, never returning from a pack.'),row('Actual shop dollars spent',advanced('shopDollars',true),'Successful progression receipts only; not inferred from bank changes.')]);
      html += panel('Income and bank observations', [row('Cashouts collected',advanced('cashouts')),row('Cashout money collected',advanced('cashoutMoney',true)),row('Interest actually collected',advanced('interestMoney',true)),row('Level 35 bonus collected',advanced('level35BonusMoney',true)),row('After-action peak bank',advanced('peakMoney',true)),row('After-action worst debt',advanced('worstDebt',true)),row('Historical net profit','Not tracked')], 'After-action observations can miss temporary mid-hand highs and lows. Only collected payout lines count as cashout income.');
      html += panel('Items and observed scoring', [row('Jokers sold',advanced('jokersSold')),row('Consumables used',advanced('consumablesUsed')),row('Consumables sold',advanced('consumablesSold')),row('Permanent cards created',advanced('cardsCreated')),row('Permanent cards destroyed',advanced('cardsDestroyed')),row('Jokers acquired',advanced('jokersAcquired'),'Physical active + saved UID union; moving a Joker is not an acquisition.'),row('Jokers removed',advanced('jokersRemoved')),row('Observed hand scores',a ? fmt(a.handScores.count) : 'Not tracked'),row('Observed hand score sum',a ? fmt(a.handScores.sum) : 'Not tracked'),row('Average observed hand score',a && a.handScores.count ? fmt(a.handScores.sum/a.handScores.count) : 'Not tracked'),row('Highest observed Chips',a ? fmt(a.handScores.bestChips) : 'Not tracked'),row('Highest observed Mult',a ? fmt(a.handScores.bestMult) : 'Not tracked')]);
      if (a) {
        var usedRows = mapRows(a.consumablesUsedByType,function(key){return key + ' used';}).concat(mapRows(a.consumablesSoldByType,function(key){return key + ' sold';}));
        if (usedRows.length) html += panel('Consumables by type',usedRows);
      }
    } else if (section === 'progression') {
      var pr = object(p.progression) ? p.progression : {}, view = {}, buffs = {}, faucet = {};
      var potionInfo = object(options.potionInfo) ? options.potionInfo : {}, potionState = object(potionInfo.state) ? potionInfo.state : object(p.potions) ? p.potions : {}, fx = object(potionInfo.effects) ? potionInfo.effects : {}, activePotion = object(potionInfo.current) ? potionInfo.current : null;
      var potionName = activePotion ? (Array.isArray(potionInfo.catalog) ? potionInfo.catalog.find(function(x){return x.id === activePotion.potionId;}) : null) : null;
      var potionOdds = {}; try { if(run && typeof E.probabilityInfo === 'function') potionOdds = E.probabilityInfo(run); } catch(e) { /* no fabricated current odds */ }
      try { if (typeof PG.progress === 'function') view = PG.progress(pr,rules.playerXpConfig); } catch (e) { /* unavailable configuration */ }
      try { if (typeof PG.buffs === 'function' && count(pr.level)) buffs = PG.buffs(pr.level); } catch (e) { /* unavailable configuration */ }
      try { if (typeof PG.faucetInfo === 'function') faucet = PG.faucetInfo(pr,Date.now(),rules); } catch (e) { /* unavailable configuration */ }
      function yes(value) { return value === true ? 'Unlocked' : value === false ? 'Locked' : 'Not tracked'; }
      html += panel('Player progression', [row('Player level',n(pr,'level')),row('Current level cap',finite(view.cap) ? fmt(view.cap) : n(pr,'cap')),row('XP available toward levels',fmt(val(pr,'xp'),3)),row('Recorded total XP',fmt(val(pr,'totalXp'),3)),row('XP required for next level',view.maxLevel ? 'Maximum level' : fmt(view.required)),row('XP held at cap',fmt(view.heldXp,3)),row('Cap gate mode',pr.gateMode || 'Not configured'),row('Bosses defeated',n(pr,'bossesWon')),row('Highest Boss Ante defeated',n(pr,'highestAnteDefeated')),row('Current XP multiplier',finite(buffs.xpMultiplier) ? '×' + fmt(buffs.xpMultiplier * (finite(fx.xpMultiplier) ? fx.xpMultiplier : 1) * (buffs.manualXpMultiplier||1) * (rules.playerXpConfig?.jokerXpMultiplier||1)) : 'Not tracked')]);
      html += panel('Current level buffs', [row('Music',yes(buffs.music)),row('Interest',yes(buffs.interest)),row('Base Joker slots',n(buffs,'jokerBaseSlots')),row('Number suffixes',yes(buffs.numberSuffixes)),row('Passive XP access',yes(buffs.passiveXp)),row('Themes',yes(buffs.themes)),row('Potions',yes(buffs.potions),'Level 12 replaces the old once-per-run Boss-disable unlock. Hold two potions; one active 2-minute effect at a time.'),row('Player luck',finite(buffs.luckMultiplier) ? buffs.luckMultiplier>1 ? '+25% (×'+fmt(buffs.luckMultiplier)+')' : 'Base (×1)' : 'Not tracked','Level 17+: listed proc probabilities ×1.25, stacking with active Oops ×2 per copy; capped at 100%. Shop rarity and editions are unchanged. Collection stays at base odds.'),row('Money per Boss effect',dollar(val(buffs,'bossEffectMoney')),'Level 19+: $1 per actual active Boss special-effect activation. Card batches count once; suppressed abilities, queries, reload and potion-only administrative changes do not pay. Settles after native action effects.'),row('Bonus Boss hands',n(buffs,'bossBonusHands')),row('Bonus Boss discards',n(buffs,'bossBonusDiscards')),row('Manual XP bonus',fmt(((buffs.manualXpMultiplier||1)-1)*100)+'%'),row('Animation duration',fmt((buffs.animationDurationMultiplier||1)*100)+'%'),row('Shop flat discount',dollar(buffs.shopDiscount||0)),row('Two extra original tracks',yes(buffs.moreTracks)),row('Fullscreen controls',yes(buffs.fullscreen)),row('Potion merging',yes(buffs.potionMerging)),row('Casino track',yes(buffs.casinoTrack)),row('Stock Market',yes(buffs.stockMarket),'Level 21: fictional in-run game dollars only; no real money.'),row('Faucet access',yes(buffs.faucet)),row('Enhanced interface',yes(buffs.enhancedUI)),row('Current round money bonus',dollar(val(buffs,'roundBonusMoney')))]);
      var drop = object(potionOdds.potionDrop) ? potionOdds.potionDrop : null;
      html += panel('Potions', [row('Stored potions',Array.isArray(potionState.inventory) ? fmt(potionState.inventory.length)+' / 2' : '0 / 2'),row('Active potion',activePotion ? (activePotion.components?activePotion.components.map(function(id){var d=(potionInfo.catalog||[]).find(function(x){return x.id===id;});return d?d.name:id;}).join(' + '):(potionName ? potionName.name : activePotion.potionId)) : 'None'),row('Effect remaining',activePotion ? duration(Math.ceil(Math.max(0,activePotion.expiresAt-(finite(potionInfo.now)?potionInfo.now:Date.now()))/1000)) : '0s'),row('Boss potion drop chance',drop ? !drop.unlocked ? 'Locked' : drop.blocked ? 'Unavailable' : drop.full ? 'No drop · inventory full' : fmt(drop.numerator)+' in 10' : 'Start a run to inspect'),row('Permanent base CRIT bonus',fmt((buffs.baseCritChance||0)*100)+' percentage point'),row('Potion base CRIT chance',fmt((finite(fx.baseCritChance)?fx.baseCritChance:0)*100)+'%'),row('Combined base CRIT effective chance',finite(potionOdds.baseCritEffectiveChance) ? fmt(potionOdds.baseCritEffectiveChance*100)+'%' : 'No active run'),row('Potion XP multiplier','×'+fmt(finite(fx.xpMultiplier)?fx.xpMultiplier:1)),row('Potion luck multiplier','×'+fmt(finite(fx.luckMultiplier)?fx.luckMultiplier:1)),row('Temporary hand-size bonus','+'+fmt(finite(fx.handSizeBonus)?fx.handSizeBonus:0)),row('Gaming HP',finite(fx.gamingHP) ? fmt(fx.gamingHP)+' / 100' : 'Inactive'),row('XP requirement rate',fmt((finite(fx.xpCostMultiplier)?fx.xpCostMultiplier:1)*100)+'%')], 'One active bottle for2 real minutes. Level33 blends preserve all distinct effects for one shared lifetime; Gaming+Critical add4.5% potion base CRIT. Final odds cap100%. Boss drops are capped at 5 in 10; Boss-disabler Potion stays fixed at 1 in 20. Market prediction timers are not cooldowns.');
      var passiveInfo = object(options.passiveInfo) ? options.passiveInfo : {}, passive = object(p.passiveXp) ? p.passiveXp : {}, passiveActive = buffs.passiveXp === true && passive.sequence > 0 && passive.completionCounted !== true && finite(passive.endsAt) && Date.now() < passive.endsAt;
      html += panel('Passive XP sessions', [row('Passive session',passiveActive ? 'Running' : passiveInfo.coolingDown ? 'Cooling down' : 'Stopped'),row('Passive restart cooldown',finite(passiveInfo.cooldownRemainingMs) ? duration(Math.ceil(passiveInfo.cooldownRemainingMs/1000)) : 'Not tracked'),row('Current passive cooldown',pr.level>=9 ? duration((passiveInfo.coolingDown&&finite(passiveInfo.committedCooldownMs) ? passiveInfo.committedCooldownMs : finite(passiveInfo.nextCooldownMs) ? passiveInfo.nextCooldownMs : finite(passiveInfo.cooldownMs) ? passiveInfo.cooldownMs : pr.level>=14 ? 240000 : 300000)/1000) : 'Locked'),row('Sessions started',n(passive,'sessionsStarted')),row('Sessions completed',n(passive,'sessionsCompleted')),row('Passive payouts credited',n(passive,'totalTicks')),row('Passive seconds paid',finite(passive.totalCreditedMs) ? fmt(passive.totalCreditedMs/1000) : 'Not tracked'),row('Passive XP earned',fmt(val(passive,'totalXp'),3)),row('Ticks this session',n(passive,'creditedTicks')),row('XP per passive payout',buffs.passiveXp===true ? fmt(finite(passiveInfo.rateXp) ? passiveInfo.rateXp : finite(fx.knowledgeXpPerSecond) ? fx.knowledgeXpPerSecond : (pr.level>=20?0:pr.level>=16?.05:pr.level>=11?.025:.01)*(finite(buffs.xpMultiplier)?buffs.xpMultiplier:1)*(finite(fx.xpMultiplier)?fx.xpMultiplier:1),3) : 'Locked'),row('Passive payout interval',pr.level>=9 ? '1s' : 'Locked'),row('Unlocked session duration',pr.level>=9 ? duration((pr.level>=44?60:pr.level>=33?50:pr.level>=16?30:pr.level>=13?20:10)*60) : 'Locked'),row('Session remaining',passiveActive ? duration(Math.ceil(Math.max(0,passive.endsAt-Date.now())/1000)) : '0s')], 'Level 9: 0.01 XP per second. Levels 11–15: 0.025 base XP per second; Level 16+: 0.05 base XP per second until Level 20. Passive XP is doubled from Level 15, so Level 16 gives 0.1 XP per second. At Level 20, Compound Interest replaces flat passive XP: 0.01% of the current XP-bar numerator per second, capped at2 actual XP/sec. Level26 improves this to0.015% and cap3. Exp Jokers multiply BEFORE the actual cap; manual22, Exp Potion and Level15 do not multiply interest. Knowledge keeps its separate potion effect. New sessions last 10 minutes until Level 13, then20/30/50/60 minutes at Levels13/16/33/44; Level22 no longer extends sessions. Five-minute cooldown until Level 14, then four minutes; reaching Level 14 also shortens a current cooldown. No automatic restart. Exp Potion doubles ordinary passive XP; Knowledge earns1 XP per second times active physical Exp Jokers only; Level15, Exp Potion and manual Level22 are excluded. Cooldown Potion can halve a wait once, never stack it to a quarter.');
      var f = object(pr.faucet) ? pr.faucet : {};
      html += panel('Virtual coin faucet', [row('Virtual coin balance',finite(faucet.coins) ? fmt(faucet.coins) : finite(pr.coinsHalf) ? fmt(pr.coinsHalf/2) : 'Not tracked'),row('Claims today',fmt(faucet.claimsToday)),row('Earned today · virtual coins',fmt(faucet.earnedTodayCoins)),row('Daily Ante 4 runs',finite(faucet.dailyRuns) ? fmt(faucet.dailyRuns)+' / 5' : 'Not tracked'),row('Current reward rate',finite(faucet.effectiveRatePercent) ? fmt(faucet.effectiveRatePercent)+'%' : 'Not tracked'),row('XP per successful claim',fmt(finite(faucet.awardedXp)?faucet.awardedXp:finite(faucet.awardXp)?faucet.awardXp:10),'Base10; manual22 ×1.2, Exp Potion ×2 and active physical Exp Jokers ×1.2 each apply. The Level15 multiplier does not apply.'),row('Faucet level',n(f,'level')),row('Successful claims',n(f,'totalClaims')),row('Claims toward current faucet level',n(f,'claims')),row('Claims required for next faucet level',faucet.maxLevel ? 'Maximum level' : fmt(faucet.requiredClaims)),row('Current reward · virtual coins',fmt(faucet.rewardCoins)),row('New claim cooldown',finite(faucet.cooldownMs) ? duration(faucet.cooldownMs/1000) : 'Not tracked'),row('Current cooldown remaining',finite(faucet.remainingMs) ? duration(Math.ceil(faucet.remainingMs/1000)) : 'Not tracked'),row('Permanent coin Joker unlocks',Array.isArray(pr.unlockedJokers) ? fmt(new Set(pr.unlockedJokers).size) : 'Not tracked'),row('Virtual coins ever earned','Not tracked'),row('Virtual coins ever spent','Not tracked')], 'Virtual coins are not cash. Fractional rewards are retained exactly, including pending hundredths. Daily Ante 4 task and claim tiers reset at Atlantic/Canary midnight; successful claims give base10 XP with manual22, Exp Potion and active physical Exp Joker multipliers, but not Level15. Historical lifetime coin income cannot be reconstructed from today’s faucet level or balance.');
      html += panel('New progression receipts since this update', [row('Gameplay receipt base XP',advanced('baseXp'),'Actual spending, Joker purchases, Tarot uses, played cards, Blind skips/wins and hand-level receipts before multipliers. Passive XP is listed separately.'),row('New hand levels gained',advanced('handLevelsGained')),row('New Blind wins recorded',advanced('blindWins')),row('New event receipts',advanced('eventsRecorded'))]);
      if (a) {
        var xpRows = mapRows(a.baseXpBySource,function(key){return ({'shop-spend':'Shop spending base XP','hand-level':'Hand level base XP','blind-win':'Blind win base XP','blind-skip':'Blind skip base XP','hand-play':'Played card base XP','tarot-use':'Tarot use base XP','joker-buy':'Joker purchase bonus base XP'})[key] || key;});
        var byHand = mapRows(a.handLevelsByType,function(key){return HANDS[key] || key;});
        var blindRows = mapRows(a.blindWinsByType,function(key){return key.charAt(0).toUpperCase()+key.slice(1)+' Blind wins';}).concat(mapRows(a.blindWinsByAnte,function(key){return 'Ante '+key+' Blind wins';}));
        if (xpRows.length) html += panel('Base XP by actual source',xpRows);
        if (byHand.length) html += panel('New hand levels by type',byHand);
        if (blindRows.length) html += panel('New Blind wins by type and Ante',blindRows);
      }
    } else if (section === 'collection') {
      var discovery = object(p.discovery) ? p.discovery : {}, kinds = [
        ['jokers','Jokers',E.jokers],['decks','Decks',E.decks],['vouchers','Vouchers',E.vouchers],['planets','Planets',E.planets],['tarots','Tarot cards',E.tarots],['spectrals','Spectral cards',E.spectrals],['packs','Packs',E.packs],['tags','Tags',E.tags],
        ['blinds','Blinds',[{id:'small'},{id:'big'}].concat(E.bosses || [])],['enhancements','Enhancements',Object.keys(E.enhancements || {}).map(function(id){return {id:id};})],['editions','Editions',[{id:'base'}].concat(Object.keys(E.editions || {}).map(function(id){return {id:id};}))],['seals','Seals',Object.keys(E.seals || {}).map(function(id){return {id:id};})]
      ];
      html += panel('Collection discovery',kinds.map(function (kind) {
        var available = Array.isArray(kind[2]) ? new Set(kind[2].map(function(x){return x.id;})) : null;
        var found = Array.isArray(discovery[kind[0]]) && available ? new Set(discovery[kind[0]].filter(function(id){return available.has(id);})).size : null;
        return row(kind[1] + ' discovered',found === null ? 'Not tracked' : fmt(found) + ' / ' + fmt(available.size));
      }).concat([row('Local milestones earned',Array.isArray(p.achievements) ? fmt(new Set(p.achievements).size) : 'Not tracked'),row('Challenges won',object(p.challengeWins) ? fmt(Object.keys(p.challengeWins).filter(function(id){return p.challengeWins[id] === true;}).length) : 'Not tracked')]), 'Discovery follows the existing local ledger, including its starter entries; browsing a catalog is not an acquisition.');
      function stake(index) { return Number.isInteger(index) && index >= 0 && Array.isArray(E.stakes) && E.stakes[index] ? E.stakes[index].name : 'No recorded stake win'; }
      var deckRows = (E.decks || []).map(function(d){return row(d.name,stake(p.deckStakeWins && p.deckStakeWins[d.id]),'Recorded wins: '+(object(p.deckWins) ? fmt(nonnegative(p.deckWins[d.id]) ? p.deckWins[d.id] : 0) : 'Not tracked'));});
      html += panel('Highest recorded stake · each deck',deckRows);
      var jokerRecords = (E.jokers || []).filter(function(j){return object(p.jokerStakeWins) && Number.isInteger(p.jokerStakeWins[j.id]) && p.jokerStakeWins[j.id] >= 0 && p.jokerStakeWins[j.id] < (E.stakes || []).length;});
      html += panel('Highest recorded stake · winning Jokers',jokerRecords.length ? jokerRecords.map(function(j){return row(j.name,stake(p.jokerStakeWins[j.id]));}) : [row('Joker stake history','No recorded stake wins')], 'Only recorded winners are listed; unrecorded historical ownership is not inferred.');
    } else {
      var info = options.probabilityInfo, probabilityRows = Array.isArray(info) ? info : object(info) && Array.isArray(info.rows) ? info.rows : null;
      if (probabilityRows) html += panel(object(info) && info.title ? info.title : 'Audited chance reference',probabilityRows.filter(function(r){return object(r) || Array.isArray(r);}).map(function(r){return Array.isArray(r) ? row(r[0],r[1],r[2]) : row(r.label,r.value,r.note);}),object(info) ? info.note : '');
      else html += '<p class="empty-message">Chance reference is awaiting its probability audit. No unverified odds are shown.</p>';
    }
    return html + '</div></div>';
  }
  return {create:create, normalize:normalize, capture:capture, recordAction:recordAction, recordEvents:recordEvents, render:render};
}));
