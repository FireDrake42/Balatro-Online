(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./potions'));
  else root.BOProgress = factory(root.BOPotions);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (POT) {
  'use strict';

  // Profile-only arithmetic. Callers provide ordered gameplay receipts and time.
  var MAX_PLAYER_LEVEL = 100, MAX_FAUCET_LEVEL = 50;
  var CAP_THRESHOLDS = Object.freeze([
    {clears: 0, cap: 10}, {clears: 10, cap: 20}, {clears: 25, cap: 30},
    {clears: 50, cap: 35}, {clears: 100, cap: MAX_PLAYER_LEVEL}
  ].map(function (entry) { return Object.freeze(entry); }));
  var COSTS = [100, 150, 250, 375, 500, 750, 1000, 1300, 1700, 2500, 3000, 3500, 4000, 4500, 5000, 6200, 7500, 8900, 10000, 15000, 17500, 20000, 22500, 25000];
  var EXTENDED_COSTS = [30000, 35000, 40000, 45000, 60000, 80000, 87500, 90000, 95000];
  // Thresholds are TOTAL successful lifetime claims, never claims spent per tier.
  // Explicit working transition interpretation, not player XP: 30->31 through
  // 39->40 cost 3100..4000; 40->41 through 49->50 use the next ten values.
  // "5.9" means 5.9K in that range. Level 50 is terminal, not a free transition.
  var CLAIM_REQUIREMENTS = [10, 25, null, 50, 75, 100, 200, 350, 500, 750, 1000, 1300, 1400, null, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4000, 4200, 4400, 4600, 4800, 5000, 5300, 5600, 5900, 6000, null];
  var SUFFIXES = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  var MAX_SAFE = Number.MAX_SAFE_INTEGER;
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };
  var record = function (value) { return value !== null && typeof value === 'object' && !Array.isArray(value); };
  var nonnegative = function (value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; };
  var integer = function (value, min, max) { return Number.isSafeInteger(value) && value >= min && value <= max; };
  var identifier = function (value) { return typeof value === 'string' && value.trim().length > 0; };
  function put(object, key, value) {
    Object.defineProperty(object, key, {value: value, enumerable: true, writable: true, configurable: true});
  }
  function validLevel(level) {
    if (!integer(level, 1, MAX_PLAYER_LEVEL)) throw new RangeError('Player level must be an integer from 1 to 100.');
    return level;
  }
  function potionContext(config) {
    // Both fields are opt-in: loading this module alone never changes old saves.
    var neutral = {potionId: null, xpMultiplier: 1, xpCostMultiplier: 1, cooldownMultiplier: 1};
    if (!config || !own(config, 'potionState') || !own(config, 'now')) return {effects: neutral, active: null};
    if (!nonnegative(config.now) || config.now > MAX_SAFE) throw new RangeError('Potion configuration time must be a finite safe timestamp.');
    if (!POT) throw new TypeError('The pure potion model is required for potion-aware XP configuration.');
    var state = POT.normalize(config.potionState), now = Math.floor(config.now);
    return {effects: POT.effectsAt(state, now), active: POT.current(state, now)};
  }
  function discountCost(required) {
    if (required === null) return null;
    if (!integer(required, 1, MAX_SAFE)) throw new RangeError('Discounted XP costs require positive safe integer base costs.');
    // Exact ceil(9*n/10), minimum one: avoid .9 floating-point rounding at MAX_SAFE.
    return Math.max(1, Math.floor(required / 10) * 9 + Math.ceil((required % 10) * 9 / 10));
  }
  function copyCooldownReceipts(source) {
    if (!record(source)) throw new RangeError('Invalid saved cooldown potion receipts.');
    var out = {};
    Object.keys(source).forEach(function (uid) {
      if (!identifier(uid) || source[uid] !== true) throw new RangeError('Invalid saved cooldown potion receipt.');
      put(out, uid, true);
    });
    return out;
  }
  function rememberCooldown(f, uid) {
    if (!f.cooldownPotionReceipts) f.cooldownPotionReceipts = {};
    put(f.cooldownPotionReceipts, uid, true);
  }
  function playerCosts(config) {
    if (config !== undefined && !record(config)) throw new TypeError('Player XP configuration must be an object.');
    var table = COSTS.concat([null], EXTENDED_COSTS);
    while (table.length < MAX_PLAYER_LEVEL) table.push(null);
    function supplied(key) { return config && own(config, key) && config[key] !== null && config[key] !== undefined; }
    if (supplied('level25Cost')) {
      if (!integer(config.level25Cost, 1, MAX_SAFE)) throw new RangeError('Configured level 25 XP cost must be a positive safe integer.');
      table[24] = config.level25Cost;
    }
    if (supplied('exponentialBase') && (!nonnegative(config.exponentialBase) || config.exponentialBase === 0)) {
      throw new RangeError('Configured exponential XP base must be a finite positive number.');
    }
    if (supplied('exponentialFactor') && (!nonnegative(config.exponentialFactor) || config.exponentialFactor <= 1)) {
      throw new RangeError('Configured exponential XP factor must be finite and greater than 1.');
    }
    // Neither the missing cost at 25 nor either growth parameter has a default.
    if (supplied('exponentialBase') && supplied('exponentialFactor')) {
      for (var level = 35; level < MAX_PLAYER_LEVEL; level++) {
        var required = Math.ceil(config.exponentialBase * Math.pow(config.exponentialFactor, level - 35));
        if (!nonnegative(required) || required === 0) throw new RangeError('Configured exponential XP cost overflows at level ' + level + '.');
        table[level - 1] = required;
      }
    }
    // Level 10 permanently halves future player-level requirements. Earlier
    // transitions stay unchanged: no retroactive XP refund or earned-level reset.
    // Keep this as the new base so potion savings track only their extra 10%.
    table = table.map(function (required, index) {
      return index >= 9 && required !== null ? Math.ceil(required / 2) : required;
    });
    table = table.map(function(required,index){return index>=19&&required!==null?Math.floor(required/5)*3+Math.ceil(required%5*3/5):required;});
    // Level 30 adds another permanent 30% reduction from 30->31 onward.
    // Preserve prior ceilings: exact ceil(7*n/10), without unsafe 7*n.
    // No refunds for earned levels; potion savings still track only extra 10%.
    table = table.map(function (required, index) {
      return index >= 29 && required !== null ? Math.max(1, Math.floor(required / 10) * 7 + Math.ceil((required % 10) * 7 / 10)) : required;
    });
    // Explicit outgoing n->n+1 prices are FINAL normal requirements: overlay
    // after permanent reductions, before snapshotting the Potion's extra saving.
    // Missing configuration never changes the pure module's historic defaults.
    if (config && own(config, 'costOverrides')) {
      var overrideField = Object.getOwnPropertyDescriptor(config, 'costOverrides');
      if (!own(overrideField, 'value') || !overrideField.enumerable) throw new TypeError('XP cost overrides require an enumerable data field.');
      var overrides = overrideField.value;
      if (!record(overrides) || (Object.getPrototypeOf(overrides) !== Object.prototype && Object.getPrototypeOf(overrides) !== null)) {
        throw new TypeError('XP cost overrides must be a plain outgoing-level map.');
      }
      Reflect.ownKeys(overrides).forEach(function (key) {
        if (typeof key !== 'string' || !/^[1-9][0-9]?$/.test(key)) throw new RangeError('XP cost override levels must be canonical integers from 1 to 99.');
        var entry = Object.getOwnPropertyDescriptor(overrides, key);
        if (!own(entry, 'value') || !entry.enumerable || !integer(entry.value, 1, MAX_SAFE)) {
          throw new RangeError('XP cost overrides require enumerable positive safe integer costs.');
        }
        table[Number(key) - 1] = entry.value;
      });
    }
    var baseCosts = table.slice(), effects = potionContext(config).effects;
    if (effects.xpCostMultiplier === 0.9) table = table.map(discountCost);
    table.baseCosts = baseCosts;
    // Only the Joker multiplier is contextual; never snapshot the XP bank here.
    table.jokerXpMultiplier = jokerXpMultiplier(config);
    return table;
  }
  function cost(level, config) { validLevel(level); return playerCosts(config)[level - 1]; }
  function jokerXpMultiplier(config) {
    var m=record(config)&&own(config,'jokerXpMultiplier')?config.jokerXpMultiplier:1;
    if(!nonnegative(m)||m<1||m>MAX_SAFE)throw new TypeError('Joker XP multiplier must be finite, at least one and safe.');
    return m;
  }
  function interestCostMultiplier(p, config) {
    requireProfile(p); validLevel(p.level); validateXp(p.xp); jokerXpMultiplier(config);
    // Retained read-only API: earning capped interest never penalizes XP costs.
    return 1;
  }
  function currentCost(p, table) {
    return {required: table[p.level - 1], interestCostMultiplier: 1};
  }
  function manualXpMultiplier(level,config) {return level>=22&&(!record(config)||config.xpSource!=='passive')?1.2:1;}
  function buffs(level) {
    validLevel(level);
    return {
      music: level >= 2, interest: level >= 3,
      jokerBaseSlots: level >= 35 ? 6 : level >= 5 ? 5 : level >= 4 ? 4 : 3,
      selectionLimit: level >= 35 ? 6 : 5, handSizeBonus: level >= 43 ? 1 : 0,
      numberSuffixes: level >= 7, passiveXp: level >= 9, themes: level >= 10, potions: level >= 12, bossDisable: false,
      xpMultiplier: level >= 15 ? 2 : 1, luckMultiplier: level >= 17 ? 1.25 : 1,
      enhancedLevelsUI: level >= 18, bossEffectMoney: level >= 19 ? 1 : 0,
      bossBonusHands: level >= 20 ? 1 : 0, bossBonusDiscards: level >= 20 ? 1 : 0,
      stockMarket: level >= 21, casinoTrack: level >= 24, moreTracks:level>=27, faucet: level >= 25, faucetNotifications:level>=28,
      animationDurationMultiplier:level>=22?.8:1,manualXpMultiplier:level>=22?1.2:1,roundCashoutBonus:level>=23?1:0,shopDiscount:level>=24?1:0,
      interestRate:level>=30?.00025:level>=26?.00015:level>=20?.0001:0,interestCap:level>=30?5:level>=26?3:level>=20?2:0,fullscreen:level>=31,baseCritChance:level>=32?.01:0,potionMerging:level>=33,
      enhancedUI: level >= 30, roundBonusMoney: (level >= 23 ? 1 : 0) + (level >= 35 ? 2 : 0)
    };
  }
  function create() {
    return {
      version: 1, level: 1, xp: 0, totalXp: 0, cap: 10,
      highestAnteDefeated: 0, bossesWon: 0, gateMode: null, cursors: {}, coinsHalf: 0,
      faucet: {level: 1, claims: 0, totalClaims: 0, nextClaimAt: 0, lastClaimAt: 0,
        earnedLifetimeHundredths: 0, lifetimeEarningsKnown: true},
      unlockedJokers: []
    };
  }
  function capFor(p) {
    // Preserve earned saved caps/levels, never manufacture fresh whole-Ante
    // credit from old Boss totals, highest Ante, or the retained gate-mode tag.
    var cap = CAP_THRESHOLDS.some(function (entry) { return entry.cap === p.cap; }) ? p.cap : 10;
    for (var i = 1; i < CAP_THRESHOLDS.length; i++) {
      if (p.level > CAP_THRESHOLDS[i - 1].cap) cap = Math.max(cap, CAP_THRESHOLDS[i].cap);
    }
    return cap;
  }
  function nextCapGate(cap) {
    for (var i = 0; i < CAP_THRESHOLDS.length - 1; i++) {
      if (CAP_THRESHOLDS[i].cap === cap) return CAP_THRESHOLDS[i + 1];
    }
    return null;
  }
  function capDataKeys(value, allowed) {
    if (!record(value) || Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new RangeError('Invalid whole-Ante cap ledger object.');
    }
    var keys = Reflect.ownKeys(value);
    if (allowed && keys.length !== allowed.length || keys.some(function (key) {
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      return typeof key !== 'string' || allowed && allowed.indexOf(key) === -1 || !descriptor.enumerable || !own(descriptor, 'value');
    })) throw new RangeError('Unsupported whole-Ante cap ledger fields.');
    return keys;
  }
  function copyCapProgress(source, p) {
    capDataKeys(source, ['version', 'cap', 'clears', 'runs']);
    var gate = nextCapGate(p.cap), runs = {}, keys = capDataKeys(source.runs);
    if (source.version !== 1 || source.cap !== p.cap || !integer(source.clears, 0, gate ? gate.clears - 1 : 0) ||
        (p.level < p.cap || !gate) && (source.clears !== 0 || keys.length !== 0)) {
      throw new RangeError('Invalid saved whole-Ante cap progress.');
    }
    keys.forEach(function (id) {
      var entry = source.runs[id];
      capDataKeys(entry, ['ante', 'nextBlind', 'seq']);
      if (!identifier(id) || !integer(entry.ante, 0, MAX_SAFE) || !integer(entry.nextBlind, 1, 2) ||
          !integer(entry.seq, entry.nextBlind, MAX_SAFE) || !own(p.cursors, id) || entry.seq > p.cursors[id]) {
        throw new RangeError('Invalid saved whole-Ante Blind proof or cursor.');
      }
      put(runs, id, {ante: entry.ante, nextBlind: entry.nextBlind, seq: entry.seq});
    });
    return {version: 1, cap: source.cap, clears: source.clears, runs: runs};
  }
  function capGateView(p) {
    var gate = nextCapGate(p.cap), clears = p.capProgress ? p.capProgress.clears : 0;
    return {policy: 'fresh-whole-ante', cap: p.cap, nextCap: gate ? gate.cap : null,
      requiredClears: gate ? gate.clears : null, clears: clears, remainingClears: gate ? gate.clears - clears : 0,
      active: !!gate && p.level >= p.cap, percent: gate ? clears / gate.clears * 100 : 100};
  }
  function observeCapBlind(p, runId, event) {
    // Ordered engine WIN/SKIP receipts are sufficient: do not infer wins from
    // entered Antes, Boss-only receipts, stats, duplicate history or XP totals.
    if (event.kind !== 'blind-win' && event.kind !== 'blind-skip' || p.cap === MAX_PLAYER_LEVEL || p.level < p.cap) return 0;
    var state = p.capProgress;
    if (event.kind === 'blind-win' && event.blindIndex === 0) {
      if (!state) state = p.capProgress = {version: 1, cap: p.cap, clears: 0, runs: {}};
      put(state.runs, runId, {ante: event.ante, nextBlind: 1, seq: event.seq});
      return 0;
    }
    if (!state) return 0;
    var pending = own(state.runs, runId) ? state.runs[runId] : null;
    delete state.runs[runId];
    if (event.kind === 'blind-skip' || !pending || pending.ante !== event.ante || pending.nextBlind !== event.blindIndex) return 0;
    if (event.blindIndex === 1) {
      put(state.runs, runId, {ante: event.ante, nextBlind: 2, seq: event.seq});
      return 0;
    }
    var gate = nextCapGate(p.cap);
    state.clears++;
    if (state.clears === gate.clears) {
      p.cap = gate.cap;
      state.cap = gate.cap; state.clears = 0; state.runs = {};
    }
    return 1;
  }
  function settleXp(p, table) {
    p.cap = capFor(p);
    while (p.level < p.cap && p.level < MAX_PLAYER_LEVEL) {
      var required = currentCost(p, table).required;
      if (required === null || p.xp < required) break;
      // Only the potion's real extra reduction earns savings; no interest penalty.
      var saving = table.baseCosts[p.level - 1] - table[p.level - 1];
      if (saving > 0) {
        var savings = (p.xpDiscountSavings || 0) + saving;
        if (!integer(savings, 0, MAX_SAFE)) throw new RangeError('Discounted XP cost savings overflow.');
        p.xpDiscountSavings = savings;
      }
      p.xp -= required; p.level++;
    }
    p.cap = capFor(p);
  }
  function normalizeWithCosts(existing, table) {
    var p = create();
    if (!record(existing)) return p;
    // Only freshly created profiles explicitly know their entire income history.
    // A legacy save lacking this ledger must remain unknown, even at zero claims.
    delete p.faucet.earnedLifetimeHundredths; delete p.faucet.lifetimeEarningsKnown;
    if (integer(existing.level, 1, MAX_PLAYER_LEVEL)) p.level = existing.level;
    p.cap = capFor({level: p.level, cap: existing.cap});
    if (!own(existing, 'capProgress')) {
      // One-time earned-tier floor uses the ORIGINAL Boss policy (75, not 50).
      // It retains a legacy effective cap even if its raw cached cap was stale;
      // it never becomes new whole-Ante credit. The next commit marks migration.
      var legacyMetric = existing.gateMode === 'single-run' ? existing.highestAnteDefeated : existing.gateMode === 'cumulative' ? existing.bossesWon : 0;
      var legacyRequirements = [0, 10, 25, 75, 100];
      if (integer(legacyMetric, 0, MAX_SAFE)) for (var tier = 1; tier < CAP_THRESHOLDS.length; tier++) {
        if (legacyMetric >= legacyRequirements[tier]) p.cap = Math.max(p.cap, CAP_THRESHOLDS[tier].cap);
      }
    }
    if (nonnegative(existing.xp)) p.xp = existing.xp;
    if (nonnegative(existing.totalXp)) p.totalXp = existing.totalXp;
    if (own(existing, 'xpDiscountSavings')) {
      if (!integer(existing.xpDiscountSavings, 0, MAX_SAFE)) throw new RangeError('Invalid saved discounted XP cost savings.');
      p.xpDiscountSavings = existing.xpDiscountSavings;
    }
    if (integer(existing.highestAnteDefeated, 0, MAX_SAFE)) p.highestAnteDefeated = existing.highestAnteDefeated;
    if (integer(existing.bossesWon, 0, MAX_SAFE)) p.bossesWon = existing.bossesWon;
    if (existing.gateMode === 'single-run' || existing.gateMode === 'cumulative') p.gateMode = existing.gateMode;
    if (integer(existing.coinsHalf, 0, MAX_SAFE)) p.coinsHalf = existing.coinsHalf;
    if (record(existing.cursors)) Object.keys(existing.cursors).forEach(function (id) {
      if (identifier(id) && integer(existing.cursors[id], 0, MAX_SAFE)) put(p.cursors, id, existing.cursors[id]);
    });
    // Absence is an optional legacy state, not historic completion evidence.
    if (own(existing, 'capProgress')) {
      var capDescriptor = Object.getOwnPropertyDescriptor(existing, 'capProgress');
      if (!own(capDescriptor, 'value') || !capDescriptor.enumerable) throw new RangeError('Invalid saved whole-Ante cap field.');
      p.capProgress = copyCapProgress(capDescriptor.value, p);
    }
    if (record(existing.receipts)) {
      var receipts = {};
      Object.keys(existing.receipts).forEach(function (id) {
        if (identifier(id) && existing.receipts[id] === true) put(receipts, id, true);
      });
      if (Object.keys(receipts).length) p.receipts = receipts;
    }
    if (record(existing.faucet)) {
      var f = existing.faucet;
      if (integer(f.level, 1, MAX_FAUCET_LEVEL)) p.faucet.level = f.level;
      if (integer(f.claims, 0, MAX_SAFE)) p.faucet.claims = f.claims;
      if (integer(f.totalClaims, 0, MAX_SAFE)) p.faucet.totalClaims = f.totalClaims;
      p.faucet.totalClaims = Math.max(p.faucet.totalClaims, p.faucet.claims);
      if (nonnegative(f.nextClaimAt) && f.nextClaimAt <= MAX_SAFE) p.faucet.nextClaimAt = f.nextClaimAt;
      if (nonnegative(f.lastClaimAt) && f.lastClaimAt <= MAX_SAFE) p.faucet.lastClaimAt = f.lastClaimAt;
      if (own(f, 'cooldownPotionReceipts')) p.faucet.cooldownPotionReceipts = copyCooldownReceipts(f.cooldownPotionReceipts);
      if (own(f, 'cooldownPotionApplied')) {
        if (typeof f.cooldownPotionApplied !== 'boolean') throw new RangeError('Invalid saved faucet cooldown potion flag.');
        p.faucet.cooldownPotionApplied = f.cooldownPotionApplied;
      }
      // New ledgers are optional on legacy saves. Never infer historical income
      // or daily claims from an old wallet, claim count, or highest defeated Ante.
      if (own(f, 'coinRemainderHundredths')) {
        if (!integer(f.coinRemainderHundredths, 0, 49)) throw new RangeError('Invalid saved faucet coin carry.');
        p.faucet.coinRemainderHundredths = f.coinRemainderHundredths;
      }
      if (own(f, 'earnedLifetimeHundredths')) {
        if (!integer(f.earnedLifetimeHundredths, 0, MAX_SAFE)) throw new RangeError('Invalid saved lifetime faucet earnings.');
        p.faucet.earnedLifetimeHundredths = f.earnedLifetimeHundredths;
        p.faucet.lifetimeEarningsKnown = f.lifetimeEarningsKnown === true;
      }
      if (own(f, 'daily')) {
        if (!record(f.daily) || dayNumber(f.daily.dayKey) === null ||
            !integer(f.daily.claims, 0, MAX_SAFE) || !integer(f.daily.earnedHundredths, 0, MAX_SAFE)) {
          throw new RangeError('Invalid saved daily faucet ledger; no daily reset was applied.');
        }
        p.faucet.daily = {dayKey: f.daily.dayKey, claims: f.daily.claims, earnedHundredths: f.daily.earnedHundredths};
      }
      if (own(f, 'runQualifications')) {
        if (!record(f.runQualifications)) throw new RangeError('Invalid saved faucet run qualification ledger.');
        p.faucet.runQualifications = {};
        Object.keys(f.runQualifications).forEach(function (id) {
          if (!identifier(id)) return;
          var receipt = f.runQualifications[id];
          // A damaged receipt remains consumed rather than silently allowing the
          // same run to qualify again after reload, rollback, or a later Ante 3.
          put(p.faucet.runQualifications, id, {
            seq: record(receipt) && integer(receipt.seq, 1, MAX_SAFE) ? receipt.seq : 0,
            dayKey: record(receipt) && integer(receipt.seq, 1, MAX_SAFE) && dayNumber(receipt.dayKey) !== null ? receipt.dayKey : null
          });
        });
      }
    }
    if (Array.isArray(existing.unlockedJokers)) existing.unlockedJokers.forEach(function (id) {
      if (identifier(id) && p.unlockedJokers.indexOf(id) === -1) p.unlockedJokers.push(id);
    });
    settleXp(p, table);
    // A finite nonnegative STORED lifetime total (including zero) is authoritative.
    // Repricing/settlement/replays are not income; never reconstruct its history
    // from either old or current costs. Only genuine awards may increase it.
    if (!nonnegative(existing.totalXp)) {
      // Retain the prior recovery policy separately for missing/corrupt totals:
      // known configured costs only, less actual saved Potion transition savings.
      var minimumTotal = p.xp;
      for (var level = 1; level < p.level; level++) if (table.baseCosts[level - 1] !== null) minimumTotal += table.baseCosts[level - 1];
      minimumTotal = Math.max(p.xp, minimumTotal - (p.xpDiscountSavings || 0));
      if (!Number.isFinite(minimumTotal)) throw new RangeError('XP total overflow during profile normalization.');
      p.totalXp = Math.max(p.totalXp, minimumTotal);
    }
    return p;
  }
  function normalize(existing, config) { return normalizeWithCosts(existing, playerCosts(config)); }
  function savedLevel(p) { return integer(p.level, 1, MAX_PLAYER_LEVEL) ? p.level : 1; }
  function requireProfile(p) {
    if (!record(p)) throw new TypeError('A mutable progression object is required.');
  }
  function commit(target, draft) {
    // Persist the zero-credit migration marker on a real model mutation, not a
    // read. Future Boss totals can then never re-activate the old cap policy.
    if (!own(draft, 'capProgress')) draft.capProgress = {version: 1, cap: draft.cap, clears: 0, runs: {}};
    // Retain unrelated extension data; replace the model's nested data with clean copies.
    Object.keys(draft).forEach(function (key) { put(target, key, draft[key]); });
  }
  function percentText(percent) { return String(Number(percent.toFixed(2))) + '%'; }
  function view(p, table) {
    var current = currentCost(p, table), required = current.required, maxLevel = p.level === MAX_PLAYER_LEVEL, capped = p.level >= p.cap;
    var configurationMissing = !maxLevel && required === null;
    var shownXp = maxLevel ? 0 : configurationMissing ? null : Math.min(p.xp, required);
    var percent = maxLevel ? 100 : configurationMissing ? 0 : Number(Math.min(100, Math.max(0, shownXp / required * 100)).toFixed(2));
    return {
      level: p.level, xp: p.xp, required: required, shownXp: shownXp, interestCostMultiplier: current.interestCostMultiplier,
      remainingXp: maxLevel || configurationMissing ? null : Math.max(0, required - p.xp),
      percent: percent, percentText: configurationMissing ? 'TBD' : percentText(percent),
      banked: maxLevel || configurationMissing ? p.xp : capped ? Math.max(0, p.xp - required) : 0,
      heldXp: capped || configurationMissing ? p.xp : 0, cap: p.cap, capped: capped, maxLevel: maxLevel,
      configurationMissing: configurationMissing,
      gateMode: p.gateMode, gatePending: false, capGate: capGateView(p)
    };
  }
  function progress(p, config) {
    var table = playerCosts(config);
    return view(normalizeWithCosts(p, table), table);
  }
  function summary(p, fromLevel, awardedXp, table) {
    var v = view(p, table);
    return {awardedXp: awardedXp, fromLevel: fromLevel, toLevel: p.level, levelsGained: p.level - fromLevel,
      cap: p.cap, banked: v.banked, heldXp: v.heldXp, maxLevel: v.maxLevel, configurationMissing: v.configurationMissing};
  }
  function validateXp(baseXp) {
    if (!nonnegative(baseXp)) throw new RangeError('Base XP must be a finite non-negative number.');
  }
  function award(p, baseXp, multiplier, table) {
    var earned = baseXp * multiplier;
    if (!nonnegative(earned) || !Number.isFinite(p.xp + earned) || !Number.isFinite(p.totalXp + earned)) {
      throw new RangeError('XP overflow; no XP was applied.');
    }
    p.xp += earned;
    if (earned > 0) p.totalXp += earned;
    settleXp(p, table);
    return earned;
  }
  function addXpWithPolicy(p, baseXp, eventId, config, fixedAward) {
    requireProfile(p); validateXp(baseXp);
    if (eventId !== undefined && !identifier(eventId)) throw new TypeError('XP event ID must be a non-empty string.');
    var table = playerCosts(config), fromLevel = savedLevel(p), draft = normalizeWithCosts(p, table);
    var duplicate = eventId !== undefined && draft.receipts && own(draft.receipts, eventId);
    if (duplicate) {
      // A newly confirmed cost can release old XP, never re-award this receipt.
      commit(p, draft);
      return Object.assign(summary(draft, fromLevel, 0, table), {baseXp: baseXp, duplicate: true});
    }
    var multiplier = fixedAward ? 1 : (draft.level >= 15 ? 2 : 1) * potionContext(config).effects.xpMultiplier * jokerXpMultiplier(config) * manualXpMultiplier(draft.level,config);
    var earned = award(draft, baseXp, multiplier, table);
    if (eventId !== undefined) {
      if (!draft.receipts) draft.receipts = {};
      put(draft.receipts, eventId, true);
    }
    commit(p, draft);
    return Object.assign(summary(draft, fromLevel, earned, table), {baseXp: baseXp, duplicate: false});
  }
  function addXp(p, baseXp, eventId, config) { return addXpWithPolicy(p, baseXp, eventId, config, false); }
  // Knowledge supplies final awarded XP, not a pre-multiplier gameplay amount.
  function addAwardedXp(p, awardedXp, eventId, config) { return addXpWithPolicy(p, awardedXp, eventId, config, true); }
  function validateEvent(event) {
    if (!record(event) || !integer(event.seq, 1, MAX_SAFE)) throw new TypeError('Progression event sequence must be a positive safe integer.');
    validateXp(event.baseXp);
    if(own(event,'jokerXpMultiplier'))jokerXpMultiplier(event);
    if (own(event, 'potionXpMultiplier') && event.potionXpMultiplier !== 1 && event.potionXpMultiplier !== 2) {
      throw new TypeError('Progression potion XP multiplier snapshot must be 1 or 2.');
    }
    var expected;
    if (event.kind === 'shop-spend') {
      if (!nonnegative(event.dollars)) throw new TypeError('Shop XP requires actual non-negative dollars spent.');
      expected = event.dollars;
    } else if (event.kind === 'blind-win') {
      if (!integer(event.ante, 0, MAX_SAFE) || !integer(event.blindIndex, 0, 2)) throw new TypeError('Blind XP requires a valid defeated Ante and Blind index.');
      expected = [3, 5, 10][event.blindIndex] * event.ante;
    } else if (event.kind === 'hand-level') {
      if (!identifier(event.hand) || !integer(event.levels, 0, MAX_SAFE)) throw new TypeError('Hand XP requires a hand and actual non-negative levels gained.');
      expected = 3 * event.levels;
    } else if (event.kind === 'tarot-use') {
      if (!identifier(event.tarotId)) throw new TypeError('Tarot-use XP requires the successfully used Tarot ID.');
      expected = 3;
    } else if (event.kind === 'blind-skip') {
      if (!integer(event.ante, 0, MAX_SAFE) || !integer(event.blindIndex, 0, 1)) throw new TypeError('Skip XP requires an actual Small or Big Blind and its Ante.');
      expected = 5;
    } else if (event.kind === 'hand-play') {
      // The engine gates fresh six-card selections at actual Player Level35.
      // Receipts remain valid on later profile sync/reload, not just that level.
      if (!integer(event.cards, 1, 6)) throw new TypeError('Played-hand XP requires the actual selected card count from 1 to 6.');
      expected = event.cards;
    } else if (event.kind === 'joker-buy') {
      if (!identifier(event.jokerId)) throw new TypeError('Joker-purchase XP requires the acquired shop Joker ID.');
      expected = 3;
    } else throw new TypeError('Unknown progression event kind; a validated gameplay XP source is required.');
    if (!Number.isFinite(expected) || expected !== event.baseXp) throw new RangeError('Progression event base XP does not match its actual source.');
    return event;
  }
  function applyEvents(p, runId, events, config, now) {
    requireProfile(p);
    if (!identifier(runId)) throw new TypeError('A unique non-empty run ID is required.');
    if (!Array.isArray(events)) throw new TypeError('Progression events must be an array.');
    var ordered = events.map(validateEvent).sort(function (a, b) { return a.seq - b.seq; });
    var clock = now === undefined ? null : faucetDay(now);
    var table = playerCosts(config), fromLevel = savedLevel(p), draft = normalizeWithCosts(p, table);
    var active = clock ? dailyClock(draft.faucet, clock) : null;
    if (active) draft.faucet.daily = active.daily;
    var cursor = own(draft.cursors, runId) ? draft.cursors[runId] : 0;
    var earned = 0, baseXp = 0, processed = 0, duplicates = 0, qualifiedRunsAdded = 0, capClearsAdded = 0;
    ordered.forEach(function (event) {
      if (event.seq <= cursor) {
        // Remember consumed legacy Boss-3 receipts, but NEVER backfill a day.
        if (passedTaskPoint(event)) rememberQualification(draft.faucet, runId, event.seq, null);
        duplicates++; return;
      }
      if (event.seq !== cursor + 1) throw new RangeError('Missing progression event sequence ' + (cursor + 1) + '; no events applied.');
      // Capture this BEFORE the current Boss receipt can release banked XP.
      var multiplier = (draft.level >= 15 ? 2 : 1) * (own(event, 'potionXpMultiplier') ? event.potionXpMultiplier : 1) * jokerXpMultiplier(event) * manualXpMultiplier(draft.level);
      // A Small WIN that reaches cap through its own XP is not after-cap proof.
      // Gate opening precedes XP settlement, so existing bank/carry is released
      // by the unchanged cost policy, and never credited to two gates at once.
      capClearsAdded += observeCapBlind(draft, runId, event);
      if (event.kind === 'blind-win' && event.blindIndex === 2) {
        if (!integer(draft.bossesWon + 1, 0, MAX_SAFE)) throw new RangeError('Boss-win counter overflow.');
        draft.bossesWon++;
        draft.highestAnteDefeated = Math.max(draft.highestAnteDefeated, event.ante);
      }
      earned += award(draft, event.baseXp, multiplier, table); baseXp += event.baseXp;
      if (!Number.isFinite(earned) || !Number.isFinite(baseXp)) throw new RangeError('Batch XP overflow.');
      if (qualifyingRunEvent(event)) {
        // An untimed or clock-rollback receipt is consumed without daily credit;
        // it cannot become a new qualifying run on a later sync/day.
        var qualifiedDay = active && !active.clockRollback ? active.daily.dayKey : null;
        if (rememberQualification(draft.faucet, runId, event.seq, qualifiedDay) && qualifiedDay !== null) qualifiedRunsAdded++;
      } else if (passedTaskPoint(event)) {
        rememberQualification(draft.faucet, runId, event.seq, null);
      }
      cursor = event.seq; processed++;
    });
    if (processed) put(draft.cursors, runId, cursor);
    // Even an empty/replayed batch can settle a newly configured cost, without
    // moving the cursor or replaying any XP/counter award.
    commit(p, draft);
    return Object.assign(summary(draft, fromLevel, earned, table), {baseXp: baseXp, processed: processed, duplicates: duplicates,
      duplicate: processed === 0 && duplicates > 0, cursor: cursor, runId: runId, qualifiedRunsAdded: qualifiedRunsAdded,
      wholeAntesCompleted: capClearsAdded, capClearsAdded: capClearsAdded});
  }
  function setGateMode(p, mode, config) {
    requireProfile(p);
    if (mode !== null && mode !== 'single-run' && mode !== 'cumulative') throw new TypeError('Gate mode must be null, single-run or cumulative.');
    var table = playerCosts(config), fromLevel = savedLevel(p), draft = normalizeWithCosts(p, table);
    draft.gateMode = mode; settleXp(draft, table); commit(p, draft);
    return Object.assign(summary(draft, fromLevel, 0, table), {gateMode: mode});
  }

  function fullNumber(value) {
    var text = String(value);
    if (!/[eE]/.test(text)) return text;
    var parts = text.toLowerCase().split('e'), exponent = Number(parts[1]);
    var negative = parts[0].charAt(0) === '-', mantissa = negative ? parts[0].slice(1) : parts[0];
    var dot = mantissa.indexOf('.'), digits = mantissa.replace('.', '');
    var position = (dot < 0 ? mantissa.length : dot) + exponent;
    var result = position <= 0 ? '0.' + '0'.repeat(-position) + digits : position >= digits.length ? digits + '0'.repeat(position - digits.length) : digits.slice(0, position) + '.' + digits.slice(position);
    return (negative ? '-' : '') + result;
  }
  function scientific(value) {
    var parts = value.toExponential(2).split('e');
    return String(Number(parts[0])) + 'e' + parts[1];
  }
  function format(value, level, options) {
    if (level === undefined) level = 1;
    validLevel(level);
    if (options !== undefined && !record(options)) throw new TypeError('Number-format options must be an object.');
    var decimals = options && options.decimals;
    if (decimals !== undefined && !integer(decimals, 0, 20)) throw new RangeError('Number-format decimals must be an integer from 0 to 20.');
    if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return '0';
    var magnitude = Math.abs(value);
    if (level < 7 || magnitude < 1000) return fullNumber(decimals === undefined ? value : Number(value.toFixed(decimals)));
    if (magnitude >= 1e21) return scientific(value);
    var index = 0, divisor = 1000;
    while (index < SUFFIXES.length - 1 && magnitude >= divisor * 1000) { index++; divisor *= 1000; }
    var rounded = Number((magnitude / divisor).toPrecision(3));
    if (rounded >= 1000) {
      if (index === SUFFIXES.length - 1) return scientific(value);
      index++; divisor *= 1000; rounded = Number((magnitude / divisor).toPrecision(3));
    }
    return (value < 0 ? '-' : '') + String(rounded) + SUFFIXES[index];
  }

  function requirements(config) {
    if (config !== undefined && !record(config)) throw new TypeError('Faucet configuration must be an object.');
    var table = CLAIM_REQUIREMENTS.slice();
    if (!config || !own(config, 'claimRequirements')) return table;
    var supplied = config.claimRequirements;
    if (!record(supplied)) throw new TypeError('Faucet claim requirements configuration must be an object.');
    Object.keys(supplied).forEach(function (key) {
      var level = Number(key), value = supplied[key];
      if (String(level) !== key || !integer(level, 1, MAX_FAUCET_LEVEL - 1)) throw new RangeError('Faucet claim requirement level must be from 1 to 49; level 50 is terminal.');
      if (value === null && table[level - 1] === null) return;
      if (!integer(value, 1, MAX_SAFE)) throw new RangeError('Faucet claim requirements must be positive integers, not guessed or fractional.');
      if (table[level - 1] !== null && table[level - 1] !== value) throw new RangeError('Specified faucet claim requirements cannot be overridden.');
      table[level - 1] = value;
    });
    return table;
  }
  function faucetCosts(config) {
    return requirements(config).map(function (required, index) {
      var terminal = index + 1 === MAX_FAUCET_LEVEL;
      return {level: index + 1, requiredClaims: required, terminal: terminal, configurationMissing: !terminal && required === null};
    });
  }
  function checkTime(now) {
    if (!nonnegative(now)) throw new RangeError('Claim time must be a finite non-negative timestamp.');
  }
  var DAY_MS = 86400000, MAX_DATE = 8640000000000000, TASK_REQUIRED = 1;
  var dayFormatter = new Intl.DateTimeFormat('en-GB', {timeZone: 'Atlantic/Canary', calendar: 'gregory', numberingSystem: 'latn',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'});
  function dayParts(now) {
    var out = {};
    dayFormatter.formatToParts(now).forEach(function (part) { if (part.type !== 'literal') out[part.type] = Number(part.value); });
    return out;
  }
  function keyFromParts(parts) {
    return String(parts.year).padStart(4, '0') + '-' + String(parts.month).padStart(2, '0') + '-' + String(parts.day).padStart(2, '0');
  }
  function dayNumber(key) {
    if (typeof key !== 'string' || !/^\d{4,6}-\d{2}-\d{2}$/.test(key)) return null;
    var parts = key.split('-').map(Number), stamp = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    if (!nonnegative(stamp) || stamp > MAX_DATE) return null;
    var date = new Date(stamp);
    return date.getUTCFullYear() === parts[0] && date.getUTCMonth() + 1 === parts[1] && date.getUTCDate() === parts[2] &&
      keyFromParts({year: parts[0], month: parts[1], day: parts[2]}) === key ? stamp / DAY_MS : null;
  }
  function faucetDay(now) {
    checkTime(now);
    if (now > MAX_DATE) throw new RangeError('Daily clock timestamp overflow.');
    var parts = dayParts(now), nextMidnight = Date.UTC(parts.year, parts.month - 1, parts.day) + DAY_MS;
    var candidate = nextMidnight;
    // Solve the next local midnight using the offset AT that midnight, not
    // today's offset or a fixed 24-hour increment (23/25-hour DST days).
    for (var i = 0; i < 4; i++) {
      if (!nonnegative(candidate) || candidate > MAX_DATE) throw new RangeError('Daily reset timestamp overflow.');
      var local = dayParts(candidate);
      var wall = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
      var corrected = nextMidnight - (wall - Math.floor(candidate / 1000) * 1000);
      if (candidate === corrected) break;
      candidate = corrected;
    }
    if (!integer(candidate, 0, MAX_DATE) || candidate <= now) throw new RangeError('Daily reset timestamp overflow.');
    return {dayKey: keyFromParts(parts), resetAt: candidate};
  }
  function dailyClock(f, clock) {
    var saved = f.daily, currentDay = dayNumber(clock.dayKey), savedDay = saved ? dayNumber(saved.dayKey) : null;
    var rollback = savedDay !== null && currentDay < savedDay;
    var daily = savedDay === null || currentDay > savedDay ? {dayKey: clock.dayKey, claims: 0, earnedHundredths: 0} : saved;
    // The persisted day is a high-water mark. Clock rollback never resets a day
    // or makes a previously completed/decayed day available a second time.
    return {daily: daily, clockRollback: rollback,
      resetAt: rollback ? faucetDay(savedDay * DAY_MS + DAY_MS / 2).resetAt : clock.resetAt};
  }
  function qualifyingRunEvent(event) { return event.kind === 'blind-win' && event.blindIndex === 2 && event.ante === 3; }
  function passedTaskPoint(event) { return qualifyingRunEvent(event) || event.kind === 'blind-win' && event.ante >= 4; }
  function rememberQualification(f, runId, seq, dayKey) {
    if (!f.runQualifications) f.runQualifications = {};
    if (own(f.runQualifications, runId)) return false;
    put(f.runQualifications, runId, {seq: seq, dayKey: dayKey});
    return true;
  }
  function qualifiedRuns(f, dayKey) {
    var ids = f.runQualifications ? Object.keys(f.runQualifications) : [], runs = 0;
    for (var i = 0; i < ids.length && runs < TASK_REQUIRED; i++) if (f.runQualifications[ids[i]].dayKey === dayKey) runs++;
    return runs;
  }
  function faucetSettings(config) {
    var table = requirements(config), rate = config && own(config, 'incompleteDailyRatePercent') ? config.incompleteDailyRatePercent : 50;
    // Confirmed incomplete-task default: 50%. Multiples of ten preserve exact
    // integer hundredths at every half-coin base reward and daily tier.
    if (!integer(rate, 0, 100) || rate % 10 !== 0) throw new RangeError('Incomplete daily rate configuration must be 0..100 percent in steps of 10 for exact hundredths.');
    var playerConfig = config && own(config, 'playerXpConfig') ? config.playerXpConfig : undefined;
    if (config && (own(config, 'potionState') || own(config, 'now'))) {
      if (playerConfig !== undefined && !record(playerConfig)) throw new TypeError('Player XP configuration must be an object.');
      playerConfig = Object.assign({}, playerConfig);
      if (own(config, 'potionState')) playerConfig.potionState = config.potionState;
      if (own(config, 'now')) playerConfig.now = config.now;
    }
    return {table: table, incompleteRate: rate, potion: potionContext(playerConfig), playerConfig:playerConfig, playerTable: playerCosts(playerConfig)};
  }
  function claimTier(claims) {
    var limits = [80, 100, 120, 150], rates = [100, 80, 60, 40];
    for (var i = 0; i < limits.length; i++) if (claims < limits[i]) return {percent: rates[i], next: limits[i], remaining: limits[i] - claims};
    return {percent: 20, next: null, remaining: null};
  }
  function coinCarry(f) { return f.coinRemainderHundredths || 0; }
  function coinBalance(p) { return p.coinsHalf / 2 + coinCarry(p.faucet) / 100; }
  function faucetView(p, now, settings) {
    var f = p.faucet, table = settings.table, required = table[f.level - 1], remaining = Math.max(0, f.nextClaimAt - now);
    var maxLevel = f.level === MAX_FAUCET_LEVEL, configurationMissing = !maxLevel && required === null;
    // Legacy saves retain their per-tier counter for raw cloud compatibility.
    // Their truthful lifetime total is the progress numerator; queries never migrate it.
    var shownClaims = f.totalClaims, remainingClaims = maxLevel || configurationMissing ? null : Math.max(0, required - shownClaims);
    var percent = maxLevel ? 100 : configurationMissing ? 0 : Number((Math.min(100, shownClaims / required * 100)).toFixed(2));
    var active = dailyClock(f, faucetDay(now)), daily = active.daily, runs = qualifiedRuns(f, daily.dayKey);
    var complete = runs >= TASK_REQUIRED, taskRate = complete ? 100 : settings.incompleteRate, tier = claimTier(daily.claims);
    var reward = (f.level + 1) * (taskRate / 10) * (tier.percent / 20), carry = coinCarry(f);
    var trackedEarned = f.earnedLifetimeHundredths || 0;
    var baseCooldownMs = (600 - 10 * (f.level - 1)) * 1000, effects = settings.potion.effects;
    var awardedXp = 10 * effects.xpMultiplier * jokerXpMultiplier(settings.playerConfig) * manualXpMultiplier(p.level);
    var lifetimeKnown = own(f, 'earnedLifetimeHundredths') && f.lifetimeEarningsKnown === true;
    return {
      unlocked: p.level >= 25, level: f.level, claims: f.claims, totalClaims: f.totalClaims,
      requiredClaims: required, shownClaims: shownClaims, remainingClaims: remainingClaims, percent: percent, percentText: configurationMissing ? 'TBD' : percentText(percent),
      coins: coinBalance(p), coinsHalf: p.coinsHalf, coinRemainderHundredths: carry, pendingCoinHundredths: carry,
      baseRewardHalf: f.level + 1, baseRewardCoins: (f.level + 1) / 2,
      // rewardHalf is an accrued-amount compatibility alias, NOT wallet credit.
      rewardHalf: reward / 50, rewardCoins: reward / 100, rewardHundredths: reward,
      coinsAwardedHalf: Math.floor((carry + reward) / 50),
      cooldownMs: baseCooldownMs * effects.cooldownMultiplier, baseCooldownMs: baseCooldownMs,
      cooldownMultiplier: effects.cooldownMultiplier, committedCooldownMs: Math.max(0, f.nextClaimAt - f.lastClaimAt),
      cooldownPotionApplied: f.cooldownPotionApplied === true,
      awardedXp: awardedXp, awardXp: awardedXp, baseXp: 10, potionXpMultiplier: effects.xpMultiplier,
      nextClaimAt: f.nextClaimAt, lastClaimAt: f.lastClaimAt, remainingMs: remaining,
      ready: p.level >= 25 && remaining === 0 && !active.clockRollback,
      claimable: p.level>=25 && remaining===0 && !active.clockRollback && claimHasCapacity(p,now,reward,awardedXp,baseCooldownMs*effects.cooldownMultiplier,daily), configurationMissing: configurationMissing,
      missingClaimLevels: table.reduce(function (out, requirement, index) { if (requirement === null && index + 1 < MAX_FAUCET_LEVEL) out.push(index + 1); return out; }, []),
      maxLevel: maxLevel, terminal: maxLevel, claimsArePerLevel: false,
      claimsToday: daily.claims, earnedTodayHundredths: daily.earnedHundredths, earnedTodayCoins: daily.earnedHundredths / 100,
      dailyRuns: runs, taskRequired: TASK_REQUIRED, taskComplete: complete, taskRatePercent: taskRate,
      incompleteDailyRatePercent: settings.incompleteRate, claimTierPercent: tier.percent, effectiveRatePercent: taskRate * tier.percent / 100,
      nextTierAt: tier.next, remainingAtTier: tier.remaining, dayKey: daily.dayKey, resetAt: active.resetAt, clockRollback: active.clockRollback,
      earnedLifetimeHundredths: trackedEarned, trackedLifetimeEarnedCoins: trackedEarned / 100,
      earnedLifetimeCoins: lifetimeKnown ? trackedEarned / 100 : null, lifetimeEarningsKnown: lifetimeKnown
    };
  }
  function faucetInfo(p, now, config) {
    checkTime(now);
    var settings = faucetSettings(config);
    return faucetView(normalizeWithCosts(p, settings.playerTable), now, settings);
  }
  function failure(code, reason) { return {ok: false, code: code, reason: reason}; }
  function claimFailure(code, reason) { return Object.assign(failure(code, reason), {awardXp: 0, awardedXp: 0}); }
  function canAddClaimXp(value, awardedXp) {
    var next = value + awardedXp;
    // Passive XP is fractional. Permit ordinary floating roundoff, but reject
    // large banks where adding ten becomes zero, eight, sixteen, etc. XP itself
    // remains the existing floating model; coin/carry counters stay integers.
    var tolerance = Math.min(1e-8, Number.EPSILON * Math.max(awardedXp, value, next) * 2);
    return Number.isFinite(next) && next > value && Math.abs((next - value) - awardedXp) <= tolerance;
  }
  function claimHasCapacity(p,now,reward,xp,cooldown,daily) {
    var f=p.faucet,next=now+cooldown,carry=coinCarry(f)+reward;
    return integer(p.coinsHalf+Math.ceil(carry/50),0,MAX_SAFE)&&integer(f.claims+1,0,MAX_SAFE)&&integer(f.totalClaims+1,0,MAX_SAFE)&&integer(daily.claims+1,0,MAX_SAFE)&&integer(daily.earnedHundredths+reward,0,MAX_SAFE)&&integer((f.earnedLifetimeHundredths||0)+reward,0,MAX_SAFE)&&Number.isFinite(next)&&next<=MAX_SAFE&&next>now&&canAddClaimXp(p.xp,xp)&&canAddClaimXp(p.totalXp,xp);
  }
  function claimFaucet(p, now, options) {
    if (!record(p)) return claimFailure('invalid-profile', 'A progression profile is required.');
    if (!nonnegative(now)) return claimFailure('invalid-time', 'Claim time must be a finite non-negative timestamp.');
    var settings, draft, info;
    try { settings = faucetSettings(options); } catch (error) { return claimFailure('invalid-config', error.message); }
    try {
      draft = normalizeWithCosts(p, settings.playerTable);
      info = faucetView(draft, now, settings);
    } catch (error) { return claimFailure(/overflow/i.test(error.message) ? 'overflow' : 'invalid-profile', error.message); }
    if (!info.unlocked) return claimFailure('locked', 'The virtual coin faucet unlocks at player level 25.');
    if (!record(options) || options.passedCaptcha !== true || options.passedQuiz !== true) return claimFailure('validation-failed', 'Both the local challenge and the Balatro question must be answered correctly.');
    if (info.clockRollback) return claimFailure('clock-rollback', 'The daily clock is earlier than the last saved faucet day.');
    if (!info.ready) return Object.assign(claimFailure('cooldown', 'The faucet cooldown has not finished.'), {remainingMs: info.remainingMs, nextClaimAt: info.nextClaimAt});
    var next = now + info.cooldownMs, f = draft.faucet, table = settings.table;
    var reward = info.rewardHundredths, carryTotal = coinCarry(f) + reward, creditedHalf = Math.floor(carryTotal / 50);
    var earnedLifetime = (f.earnedLifetimeHundredths || 0) + reward;
    // Reserve safe half-coin capacity for pending carry too; never strand
    // fractional income beyond the wallet's safe-integer boundary.
    if (!integer(draft.coinsHalf + Math.ceil(carryTotal / 50), 0, MAX_SAFE) || !integer(f.claims + 1, 0, MAX_SAFE) ||
        !integer(f.totalClaims + 1, 0, MAX_SAFE) || !integer(info.claimsToday + 1, 0, MAX_SAFE) ||
        !integer(info.earnedTodayHundredths + reward, 0, MAX_SAFE) || !integer(earnedLifetime, 0, MAX_SAFE) ||
        !Number.isFinite(next) || next > MAX_SAFE || next <= now ||
        !canAddClaimXp(draft.xp, info.awardedXp) || !canAddClaimXp(draft.totalXp, info.awardedXp)) {
      return claimFailure('overflow', 'The coin ledger, XP, earnings, claim counter or timestamp would overflow.');
    }
    var fromLevel = savedLevel(p), earnedXp;
    try { earnedXp = award(draft, 10, info.awardedXp/10, settings.playerTable); } catch (error) { return claimFailure('overflow', error.message); }
    draft.coinsHalf += creditedHalf; f.coinRemainderHundredths = carryTotal % 50;
    f.daily = {dayKey: info.dayKey, claims: info.claimsToday + 1, earnedHundredths: info.earnedTodayHundredths + reward};
    f.lifetimeEarningsKnown = info.lifetimeEarningsKnown; f.earnedLifetimeHundredths = earnedLifetime;
    f.totalClaims++; f.claims = f.totalClaims; f.lastClaimAt = now; f.nextClaimAt = next;
    // Exactly one reduction per WAIT, not one reduction per replacement bottle.
    if (info.cooldownMultiplier === 0.5) f.cooldownPotionApplied = true;
    else delete f.cooldownPotionApplied;
    if (settings.potion.active && POT.hasEffect(settings.potion.active,'cooldown')) rememberCooldown(f, settings.potion.active.uid);
    // Only a successful claim settles earned cumulative thresholds. No startup
    // awards, subtraction or downgrade; unknown thresholds hold, duplicates advance safely.
    while (f.level < MAX_FAUCET_LEVEL && table[f.level - 1] !== null && f.totalClaims >= table[f.level - 1]) {
      f.level++;
    }
    commit(p, draft);
    var xpSummary = summary(draft, fromLevel, earnedXp, settings.playerTable);
    return Object.assign({}, xpSummary, {
      ok: true, awardXp: earnedXp, xpSummary: xpSummary, playerConfigurationMissing: xpSummary.configurationMissing,
      rewardHalf: info.rewardHalf, coinsAwardedHalf: creditedHalf,
      baseRewardHalf: info.baseRewardHalf, baseRewardCoins: info.baseRewardCoins,
      rewardCoins: info.rewardCoins, rewardHundredths: reward, coinsHalf: draft.coinsHalf, coins: coinBalance(draft),
      coinRemainderHundredths: f.coinRemainderHundredths, pendingCoinHundredths: f.coinRemainderHundredths,
      taskRatePercent: info.taskRatePercent, claimTierPercent: info.claimTierPercent, effectiveRatePercent: info.effectiveRatePercent,
      claimedLevel: info.level, level: f.level, claims: f.claims, totalClaims: f.totalClaims,
      cooldownMs: info.cooldownMs, baseCooldownMs: info.baseCooldownMs, cooldownMultiplier: info.cooldownMultiplier,
      committedCooldownMs: info.cooldownMs, potionXpMultiplier: info.potionXpMultiplier, nextClaimAt: next, lastClaimAt: now,
      configurationMissing: f.level < MAX_FAUCET_LEVEL && table[f.level - 1] === null,
      faucet: faucetView(draft, now, settings)
    });
  }
  function applyCooldownPotion(p, now, potionState) {
    if (!record(p) || !integer(p.level, 1, MAX_PLAYER_LEVEL) || !record(p.faucet) || !integer(p.faucet.level, 1, MAX_FAUCET_LEVEL)) {
      return failure('invalid-profile', 'A valid progression profile with a faucet ledger is required.');
    }
    if (!nonnegative(now) || now > MAX_SAFE) return failure('invalid-time', 'Cooldown time must be a finite safe timestamp.');
    var context;
    try { context = potionContext({potionState: potionState, now: now}); }
    catch (error) { return failure('invalid-potions', error.message); }
    var active = context.active, f = p.faucet, deadline = f.nextClaimAt;
    if (!nonnegative(deadline) || deadline > MAX_SAFE || !nonnegative(f.lastClaimAt) || f.lastClaimAt > MAX_SAFE) {
      return failure('invalid-profile', 'Invalid saved faucet cooldown timestamps.');
    }
    var receipts;
    try { receipts = own(f, 'cooldownPotionReceipts') ? copyCooldownReceipts(f.cooldownPotionReceipts) : {}; }
    catch (error) { return failure('invalid-profile', error.message); }
    var eligible = active && POT.hasEffect(active,'cooldown'), duplicate = !!eligible && own(receipts, active.uid);
    if (own(f, 'cooldownPotionApplied') && typeof f.cooldownPotionApplied !== 'boolean') return failure('invalid-profile', 'Invalid saved faucet cooldown potion flag.');
    var remaining = Math.max(0, deadline - now), applied = !!eligible && !duplicate && remaining > 0 && f.cooldownPotionApplied !== true;
    var next = applied ? now + remaining / 2 : deadline;
    if (!nonnegative(next) || next > MAX_SAFE) return failure('overflow', 'Faucet cooldown deadline overflow.');
    // This helper never normalizes/settles progression, coins, claims or XP.
    if (eligible && !duplicate) {
      put(receipts, active.uid, true);
      p.faucet = Object.assign({}, f, {nextClaimAt: next, cooldownPotionReceipts: receipts});
      if (applied) p.faucet.cooldownPotionApplied = true;
    }
    var base = (600 - 10 * (f.level - 1)) * 1000;
    return {ok: true, applied: applied, duplicate: duplicate, nextClaimAt: next, remainingMs: Math.max(0, next - now),
      baseCooldownMs: base, cooldownMs: base * context.effects.cooldownMultiplier,
      cooldownMultiplier: context.effects.cooldownMultiplier, cooldownPotionApplied: applied || f.cooldownPotionApplied === true,
      committedCooldownMs: Math.max(0, next - f.lastClaimAt)};
  }
  function catalogPrices(catalog) {
    var prices = {};
    function entry(id, price) {
      if (!identifier(id) || !integer(price, 0, MAX_SAFE)) throw new TypeError('Catalog IDs and integer half-coin prices must be explicitly configured.');
      if (own(prices, id)) throw new TypeError('Duplicate catalog Joker ID.');
      put(prices, id, price);
    }
    if (catalog === undefined || catalog === null) return prices;
    if (Array.isArray(catalog)) catalog.forEach(function (item) {
      if (!record(item) || !own(item, 'id') || !own(item, 'priceHalf')) throw new TypeError('Catalog entries require id and priceHalf.');
      entry(item.id, item.priceHalf);
    });
    else if (record(catalog)) Object.keys(catalog).forEach(function (id) {
      var item = catalog[id];
      if (typeof item === 'number') entry(id, item);
      else {
        if (!record(item) || !own(item, 'priceHalf') || (own(item, 'id') && item.id !== id)) throw new TypeError('Catalog map entries require a matching ID and priceHalf.');
        entry(id, item.priceHalf);
      }
    });
    else throw new TypeError('An explicit Joker unlock catalog is required.');
    return prices;
  }
  function unlockJoker(p, jokerId, priceHalf, catalog, config) {
    if (!record(p)) return failure('invalid-profile', 'A progression profile is required.');
    if (!identifier(jokerId)) return failure('invalid-joker', 'A configured Joker ID is required.');
    if (!integer(priceHalf, 0, MAX_SAFE)) return failure('invalid-price', 'Price must be a non-negative integer number of half-coins.');
    var prices;
    try { prices = catalogPrices(catalog); } catch (error) { return failure('invalid-catalog', error.message); }
    if (!own(prices, jokerId)) return failure('unconfigured-joker', 'No coin unlock catalog entry is configured for this Joker.');
    if (prices[jokerId] !== priceHalf) return failure('price-mismatch', 'Requested price does not match the configured half-coin price.');
    var draft = normalize(p, config);
    if (draft.unlockedJokers.indexOf(jokerId) !== -1) return failure('already-owned', 'This Joker is already unlocked; no coins were spent.');
    if (draft.coinsHalf < priceHalf) return failure('insufficient-coins', 'Not enough virtual coins.');
    draft.coinsHalf -= priceHalf; draft.unlockedJokers.push(jokerId); commit(p, draft);
    return {ok: true, jokerId: jokerId, priceHalf: priceHalf, coinsHalf: draft.coinsHalf, coins: coinBalance(draft),
      coinRemainderHundredths: coinCarry(draft.faucet), pendingCoinHundredths: coinCarry(draft.faucet)};
  }

  return {MAX_PLAYER_LEVEL: MAX_PLAYER_LEVEL, MAX_FAUCET_LEVEL: MAX_FAUCET_LEVEL, CAP_THRESHOLDS: CAP_THRESHOLDS,
    create: create, normalize: normalize, buffs: buffs, jokerXpMultiplier:jokerXpMultiplier, interestCostMultiplier: interestCostMultiplier, cost: cost, addXp: addXp, addAwardedXp: addAwardedXp,
    applyEvents: applyEvents, setGateMode: setGateMode, progress: progress, format: format, applyCooldownPotion: applyCooldownPotion,
    faucetCosts: faucetCosts, faucetDay: faucetDay, faucetInfo: faucetInfo, claimFaucet: claimFaucet, unlockJoker: unlockJoker};
}));
