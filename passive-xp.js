(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./progression'), require('./potions'));
  else root.BOPassiveXP = factory(root.BOProgress, root.BOPotions);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (PG, POT) {
  'use strict';

  var UNLOCK_LEVEL = 9, TICK_MS = 1000, SESSION_MS = 600000, MAX_SESSION_MS = 3600000, COOLDOWN_MS = 300000, REDUCED_COOLDOWN_MS = 240000;
  var SESSION_MAX_TICKS = MAX_SESSION_MS / TICK_MS, MAX_SAFE = Number.MAX_SAFE_INTEGER, XP_UNITS = 1000;
  var record = function (value) { return value !== null && typeof value === 'object' && !Array.isArray(value); };
  var nonnegative = function (value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; };
  var counter = function (value) { return Number.isSafeInteger(value) && value >= 0 ? value : 0; };
  var own = function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); };
  function put(object, key, value) { Object.defineProperty(object, key, {value: value, enumerable: true, writable: true, configurable: true}); }
  function effectsAt(state, now) {
    if (state === undefined || state === null) return {potionId: null, xpMultiplier: 1, cooldownMultiplier: 1, knowledgeXpPerSecond: null};
    if (!POT) throw new TypeError('The pure potion model is required for potion-aware passive XP.');
    return POT.effectsAt(state, Math.floor(now));
  }
  function potionState(profile) {
    if (!record(profile) || profile.potions === undefined || profile.potions === null) return undefined;
    if (!POT) throw new TypeError('The pure potion model is required for potion-aware passive XP.');
    return POT.normalize(profile.potions);
  }
  function profileXpConfig(profile, now, config) {
    // Keep existing potion/Joker/native wall-session policy. Only the optional
    // whole-PROFILE event ledger supplies new event authority, never read defaults.
    PG.pokerXpMultiplier(config,Math.floor(now));
    var out=Object.assign({},config);delete out.pokerXpMultiplier;
    if(record(profile)&&own(profile,'emeraldPokerEvents'))out.pokerEvents=pauseData(profile,'emeraldPokerEvents');
    if(own(out,'pokerEvents'))out.now=Math.floor(now);
    PG.pokerEffects(out,Math.floor(now));return out;
  }
  function xpConfigAt(config, state, now) {
    // The whole profile's historical ledger, never a current Exp snapshot, owns passive payouts.
    var out = Object.assign({}, config);
    delete out.potionState; delete out.now; delete out.pokerXpMultiplier; out.xpSource='passive';
    if (state !== undefined) out.potionState = state;
    if (state !== undefined || own(out,'pokerEvents')) out.now=Math.floor(now);
    return out;
  }
  function rateWithEffects(p, rate, effects, config) {
    return (effects.knowledgeXpPerSecond === 1 ? 1 : level(p) >= 20 ? 0 : rate.baseXp * (level(p) >= 15 ? 2 : 1) * effects.xpMultiplier) * PG.jokerXpMultiplier(config) * PG.earnedXpMultiplier(level(p)) * PG.pokerXpMultiplier(config);
  }
  function copyReceipts(source) {
    if (!record(source)) throw new RangeError('Invalid passive cooldown potion receipts.');
    var out = {};
    Object.keys(source).forEach(function (uid) {
      if (typeof uid !== 'string' || !uid.trim() || source[uid] !== true) throw new RangeError('Invalid passive cooldown potion receipt.');
      put(out, uid, true);
    });
    return out;
  }
  function rememberCooldown(s, uid) {
    if (!s.cooldownPotionReceipts) s.cooldownPotionReceipts = {};
    put(s.cooldownPotionReceipts, uid, true);
  }
  function level(p) { return record(p) && Number.isInteger(p.level) && p.level >= 1 && p.level <= 100 ? p.level : 1; }
  function rateForLevel(value) {
    value = level({level: value});
    return {baseXp: value >= 16 ? 0.05 : value >= 11 ? 0.025 : 0.01, intervalMs: TICK_MS};
  }
  function durationForLevel(value) {
    value = level({level: value});
    return (value >= 16 ? 30 : value >= 13 ? 20 : 10) * 60000;
  }
  function cooldownForLevel(value) { return level({level: value}) >= 14 ? REDUCED_COOLDOWN_MS : COOLDOWN_MS; }
  function failure(code, reason) { return {ok: false, code: code, reason: reason}; }
  function cleanXp(value) {
    // Snap only floating noise near thousandths, preserving genuine finer saved XP.
    var rounded = Math.round(value * XP_UNITS) / XP_UNITS;
    return Number.isFinite(rounded) && Math.abs(rounded - value) <= Number.EPSILON * Math.max(1, Math.abs(value)) * 8 ? rounded : value;
  }
  var MAX_TIMESTAMP = 8640000000000000, MAX_POWER_INTERVALS = 4096;
  function safeTimestamp(value) { return Number.isSafeInteger(value) && value >= 0 && value <= MAX_TIMESTAMP; }
  function pauseData(object, key) {
    var d = Object.getOwnPropertyDescriptor(object, key);
    if (!d || !d.enumerable || !own(d, 'value')) throw new RangeError('Passive power pause must contain enumerable data only.');
    return d.value;
  }
  function pauseRecord(value, keys) {
    if (!record(value) || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) ||
        Reflect.ownKeys(value).length !== keys.length || !keys.every(function (key) { return own(value, key); })) {
      throw new RangeError('Invalid passive power pause fields.');
    }
    keys.forEach(function (key) { pauseData(value, key); });
  }
  function copyPowerPause(value) {
    pauseRecord(value, ['version', 'activeFrom', 'exclusions']);
    if (value.version !== 1 || value.activeFrom !== null && !safeTimestamp(value.activeFrom)) throw new RangeError('Invalid passive power pause boundary.');
    var a = value.exclusions;
    if (!Array.isArray(a) || Object.getPrototypeOf(a) !== Array.prototype || a.length > MAX_POWER_INTERVALS || Reflect.ownKeys(a).length !== a.length + 1) {
      throw new RangeError('Invalid passive power exclusions.');
    }
    var exclusions = [], end = 0;
    for (var i = 0; i < a.length; i++) {
      var entry = pauseData(a, String(i)); pauseRecord(entry, ['from', 'to']);
      if (!safeTimestamp(entry.from) || !safeTimestamp(entry.to) || entry.from >= entry.to || entry.from < end) throw new RangeError('Invalid passive power exclusion interval.');
      exclusions.push({from: entry.from, to: entry.to}); end = entry.to;
    }
    if (value.activeFrom !== null && value.activeFrom < end) throw new RangeError('Passive power intervals overlap.');
    return {version: 1, activeFrom: value.activeFrom, exclusions: exclusions};
  }
  function powerPaused(s) { return !!s.powerPause && s.powerPause.activeFrom !== null; }
  function powerExcluded(s, at) {
    var pause = s.powerPause; if (!pause) return false;
    if (pause.activeFrom !== null && at >= pause.activeFrom) return true;
    var a = pause.exclusions, lo = 0, hi = a.length - 1;
    while (lo <= hi) {
      var mid = Math.floor((lo + hi) / 2), entry = a[mid];
      if (at < entry.from) hi = mid - 1; else if (at >= entry.to) lo = mid + 1; else return true;
    }
    return false;
  }
  function prunePower(s) {
    if (!s.powerPause) return;
    var nextLeftEdge = s.startedAt + s.creditedMs;
    // A partially covered next tick still needs its exclusion after reload.
    s.powerPause.exclusions = s.powerPause.exclusions.filter(function (entry) { return entry.to > nextLeftEdge; });
  }
  function create() {
    return {version: 3, sequence: 0, startedAt: 0, endsAt: 0, sessionDurationMs: 0, tickMs: TICK_MS, baseRateXp: 0.01,
      creditedTicks: 0, creditedMs: 0, totalTicks: 0, totalCreditedMs: 0, totalXp: 0,
      sessionsStarted: 0, sessionsCompleted: 0, completionCounted: false};
  }
  function normalize(existing) {
    var s = create(), pause, pokerTick;
    if(record(existing)&&own(existing,'pokerTick')){pokerTick=pauseData(existing,'pokerTick');pauseRecord(pokerTick,['at','multiplier']);if(!safeTimestamp(pokerTick.at)||(pokerTick.multiplier!==1&&pokerTick.multiplier!==2))throw new RangeError('Invalid passive Poker tick snapshot.');pokerTick={at:pokerTick.at,multiplier:pokerTick.multiplier};}
    if (record(existing) && own(existing, 'powerPause')) pause = copyPowerPause(pauseData(existing, 'powerPause'));
    if (!record(existing) || (existing.version !== 1 && existing.version !== 2 && existing.version !== 3)) {if(pokerTick)throw new RangeError('Poker tick needs a valid passive session.');return s;}
    if (pause) s.powerPause = pause;
    var version = existing.version, oldInterval = version === 1 ? 10000 : TICK_MS;
    if (own(existing, 'cooldownPotionReceipts')) s.cooldownPotionReceipts = copyReceipts(existing.cooldownPotionReceipts);
    if(own(existing,'jokerXpSegments')){
      if(!Array.isArray(existing.jokerXpSegments)||!existing.jokerXpSegments.length||existing.jokerXpSegments.length>4096)throw new RangeError('Invalid passive Joker XP history.');
      var last=-1;s.jokerXpSegments=existing.jokerXpSegments.map(function(e){if(!record(e)||Object.keys(e).length!==2||!own(e,'at')||!own(e,'multiplier')||!Number.isSafeInteger(e.at)||e.at<0||e.at>8640000000000000||e.at<=last)throw new RangeError('Invalid passive Joker XP segment.');PG.jokerXpMultiplier({jokerXpMultiplier:e.multiplier});last=e.at;return {at:e.at,multiplier:e.multiplier};});
    }
    s.sequence = counter(existing.sequence);
    // Ticks count actual payouts in every schema. Paid time is a separate ledger:
    // converting old ticks into new ticks would both distort history and risk replay.
    s.totalTicks = counter(existing.totalTicks);
    s.totalCreditedMs = version === 3 ? counter(existing.totalCreditedMs) : Math.min(Math.floor(MAX_SAFE / oldInterval), s.totalTicks) * oldInterval;
    s.totalXp = nonnegative(existing.totalXp) ? existing.totalXp : 0;
    s.sessionsStarted = Math.max(counter(existing.sessionsStarted), s.sequence);
    s.sessionsCompleted = Math.min(counter(existing.sessionsCompleted), s.sessionsStarted);
    // A previously captured 20-minute session remains earned, even though new
    // level-11 sessions now last ten minutes. Never shrink a saved deadline.
    var duration = version === 1 ? SESSION_MS : existing.sessionDurationMs;
    var validDuration = Number.isInteger(duration) && duration >= SESSION_MS && duration <= MAX_SESSION_MS && duration % SESSION_MS === 0;
    var validRate = version === 1 || (version === 2 ? existing.tickMs === TICK_MS :
      existing.tickMs === TICK_MS && (existing.baseRateXp === 0.01 || existing.baseRateXp === 0.025 || existing.baseRateXp === 0.05) ||
      existing.tickMs === 10000 && existing.baseRateXp === 0.25);
    var paidMs = version === 3 ? existing.creditedMs : existing.creditedTicks * oldInterval;
    var validCursor = Number.isSafeInteger(existing.creditedTicks) && existing.creditedTicks >= 0 &&
      Number.isSafeInteger(paidMs) && paidMs >= 0 && paidMs <= duration && paidMs % TICK_MS === 0 &&
      (version !== 3 || existing.creditedTicks * TICK_MS <= paidMs && paidMs <= existing.creditedTicks * 10000);
    if (s.sequence > 0 && validDuration && validRate && validCursor &&
        nonnegative(existing.startedAt) && nonnegative(existing.endsAt) && existing.endsAt > existing.startedAt &&
        existing.endsAt === existing.startedAt + duration) {
      s.startedAt = existing.startedAt; s.endsAt = existing.endsAt; s.sessionDurationMs = duration;
      s.creditedTicks = existing.creditedTicks; s.creditedMs = paidMs;
      if (version === 3) { s.tickMs = existing.tickMs; s.baseRateXp = existing.baseRateXp; }
      s.completionCounted = existing.completionCounted === true;
      s.totalTicks = Math.max(s.totalTicks, s.creditedTicks);
      s.totalCreditedMs = Math.max(s.totalCreditedMs, s.creditedMs);
      if (s.completionCounted) s.sessionsCompleted = Math.max(1, s.sessionsCompleted);
      if (own(existing, 'cooldownUntil')) {
        if (!nonnegative(existing.cooldownUntil) || existing.cooldownUntil > MAX_SAFE || existing.cooldownUntil < s.endsAt || existing.cooldownEndAt !== s.endsAt) {
          throw new RangeError('Invalid saved passive potion cooldown deadline.');
        }
        s.cooldownUntil = existing.cooldownUntil; s.cooldownEndAt = s.endsAt;
      }
      if (own(existing, 'cooldownPotionAnchorAt')) {
        if (!own(s, 'cooldownUntil') || !nonnegative(existing.cooldownPotionAnchorAt) || existing.cooldownPotionAnchorAt > MAX_SAFE || existing.cooldownPotionAnchorAt < s.endsAt) {
          throw new RangeError('Invalid saved passive cooldown potion reduction anchor.');
        }
        s.cooldownPotionAnchorAt = existing.cooldownPotionAnchorAt;
      }
    }
    if(pokerTick){if(!hasSession(s)||s.completionCounted||pokerTick.at!==s.startedAt+s.creditedMs||s.creditedMs>=s.sessionDurationMs)throw new RangeError('Poker tick must match the ONE pending passive left edge.');s.pokerTick=pokerTick;}
    return s;
  }
  function hasSession(s) { return s.sequence > 0 && s.sessionDurationMs > 0 && s.endsAt > s.startedAt; }
  function captureJoker(s,now,m) {
    PG.jokerXpMultiplier({jokerXpMultiplier:m});if(!hasSession(s))return;
    var a=s.jokerXpSegments;if(!a&&m===1)return;
    if(!a)a=s.jokerXpSegments=[{at:s.startedAt,multiplier:1}];
    var last=a[a.length-1];if(now<last.at)throw new RangeError('Passive Joker clock moved backwards.');
    if(last.multiplier!==m){if(now===last.at)last.multiplier=m;else{if(a.length>=4096)throw new RangeError('Passive Joker history is full.');a.push({at:now,multiplier:m});}}
    var boundary=s.startedAt+s.creditedMs,index=0;while(index+1<a.length&&a[index+1].at<=boundary)index++;if(index)a.splice(0,index);
  }
  function captureJokerMultiplier(profile,now,m) {
    if(!record(profile)||!Number.isSafeInteger(now)||now<0||now>8640000000000000)throw new RangeError('Supply a valid passive Joker clock.');
    var s=normalize(profile.passiveXp);captureJoker(s,now,m);profile.passiveXp=s;return s;
  }
  function historicalJoker(s,at) {var a=s.jokerXpSegments||[];for(var i=a.length-1;i>=0;i--)if(a[i].at<=at)return a[i].multiplier;return 1;}
  function elapsedMs(s, now) {
    return Math.min(s.sessionDurationMs, Math.max(0, now - s.startedAt));
  }
  function needsDurationUpdate(p, s, now) {
    return level(p) >= UNLOCK_LEVEL && hasSession(s) && !s.completionCounted && now < s.endsAt && durationForLevel(level(p)) > s.sessionDurationMs;
  }
  function needsRateUpdate(p, s) {
    var rate = rateForLevel(level(p));
    return level(p) >= UNLOCK_LEVEL && hasSession(s) && !s.completionCounted && (s.tickMs !== rate.intervalMs || s.baseRateXp !== rate.baseXp);
  }
  function setRate(s, rate) { s.tickMs = rate.intervalMs; s.baseRateXp = rate.baseXp; }
  function extend(s, duration) {
    if (duration <= s.sessionDurationMs) return;
    var end = s.startedAt + duration;
    if (!Number.isFinite(end) || end <= s.startedAt) throw new RangeError('Passive XP deadline overflow.');
    s.sessionDurationMs = duration; s.endsAt = end;
  }
  function cooldownView(p, s, end, state) {
    var base = cooldownForLevel(level(p)), session = hasSession(s);
    var factor = session ? effectsAt(state, end).cooldownMultiplier : 1;
    var until = session ? end + base * factor : 0;
    var committed = session && s.cooldownEndAt === end && nonnegative(s.cooldownUntil);
    if (committed && nonnegative(s.cooldownPotionAnchorAt)) {
      // Reuse the ONE original reduction anchor if Level 14 improves the normal
      // deadline later: end+300k, drink at end+100k -> 200k; Level14 -> 170k.
      var normalUntil = end + base, anchor = s.cooldownPotionAnchorAt;
      until = Math.min(normalUntil, anchor + Math.max(0, normalUntil - anchor) / 2);
    }
    if (committed) until = Math.min(until, s.cooldownUntil);
    var duration = session ? Math.max(0, until - end) : base;
    return {baseCooldownMs: base, cooldownMs: duration, committedCooldownMs: session ? duration : 0,
      cooldownPotionApplied: !!committed || factor === 0.5, cooldownUntil: until};
  }
  function captureCooldown(p, s, state) {
    if (!hasSession(s) || s.cooldownEndAt === s.endsAt && nonnegative(s.cooldownUntil) || effectsAt(state, s.endsAt).cooldownMultiplier !== 0.5) return;
    var view = cooldownView(p, s, s.endsAt, state);
    if (!nonnegative(view.cooldownUntil) || view.cooldownUntil > MAX_SAFE) throw new RangeError('Passive potion cooldown deadline overflow.');
    s.cooldownUntil = view.cooldownUntil; s.cooldownEndAt = s.endsAt; s.cooldownPotionAnchorAt = s.endsAt;
    // current() describes only the latest effect; an older replaced effect needs
    // no new UID replay guard, but its historical deadline is still committed.
    var active = POT && state ? POT.current(state, Math.floor(s.endsAt)) : null;
    if (active && POT.hasEffect(active,'cooldown')) rememberCooldown(s, active.uid);
  }
  function view(p, s, now, state, xpConfig) {
    var paused = powerPaused(s), unlocked = level(p) >= UNLOCK_LEVEL, session = hasSession(s), update = !paused && needsDurationUpdate(p, s, now);
    var unlockedDuration = durationForLevel(level(p)), rate = rateForLevel(level(p));
    var duration = update ? unlockedDuration : session ? s.sessionDurationMs : unlockedDuration;
    var end = session ? s.startedAt + duration : 0;
    var active = unlocked && session && !s.completionCounted && now < end;
    // Anchor to the historical end, not this poll. Potion deadlines only shrink;
    // expiry/replacement cannot lengthen a wait that was already committed.
    var effects = effectsAt(state, now), cooldown = cooldownView(p, s, end, state);
    var zeroCooldowns=PG.pokerEffects(xpConfig,Math.floor(now)).zeroCooldowns&&(!session||now>=end),cooldownMs = zeroCooldowns?0:cooldown.cooldownMs, cooldownUntil = cooldown.cooldownUntil;
    var coolingDown = unlocked && session && !active && !zeroCooldowns && now < cooldownUntil;
    var elapsed = session ? Math.min(duration, Math.max(0, now - s.startedAt)) : 0;
    // This read-only estimate uses the current rate. Settlement re-evaluates it
    // after every own level-up, so a catch-up batch can cross rate/duration tiers.
    var pending = unlocked && session && !s.completionCounted ? Math.floor(Math.max(0, elapsed - s.creditedMs) / rate.intervalMs) : 0;
    var maxTicks = session ? s.creditedTicks + (s.completionCounted ? 0 : Math.floor((duration - s.creditedMs) / rate.intervalMs)) : Math.floor(duration / rate.intervalMs);
    var result = {unlocked: unlocked, active: active, ready: unlocked && !active && !coolingDown,
      coolingDown: coolingDown, cooldownMs: cooldownMs, cooldownUntil: cooldownUntil, zeroCooldowns:zeroCooldowns,
      baseCooldownMs: cooldown.baseCooldownMs, committedCooldownMs: cooldown.committedCooldownMs, cooldownPotionApplied: cooldown.cooldownPotionApplied,
      cooldownMultiplier: effects.cooldownMultiplier, nextCooldownMs: zeroCooldowns?0:cooldown.baseCooldownMs * effects.cooldownMultiplier,
      cooldownRemainingMs: coolingDown ? Math.max(0, cooldownUntil - now) : 0,
      remainingMs: active ? Math.min(duration, Math.max(0, end - now)) : 0,
      nextTickMs: active && s.creditedMs + rate.intervalMs <= duration ? Math.max(0, s.startedAt + s.creditedMs + rate.intervalMs - now) : 0,
      sessionTicks: s.creditedTicks + pending, creditedTicks: s.creditedTicks, pendingTicks: pending,
      creditedMs: s.creditedMs, totalCreditedMs: s.totalCreditedMs,
      totalTicks: s.totalTicks, totalXp: s.totalXp, rateXp: rateWithEffects(p, rate, effects, xpConfig),
      potionXpMultiplier: effects.xpMultiplier, knowledgeXpPerSecond: effects.knowledgeXpPerSecond, potionId: effects.potionId,
      baseRateXp: rate.baseXp, intervalMs: rate.intervalMs, tickMs: rate.intervalMs,
      sessionMaxTicks: maxTicks, durationMs: duration,
      sessionDurationMs: s.sessionDurationMs, unlockedDurationMs: unlockedDuration, needsDurationUpdate: update,
      needsRateUpdate: needsRateUpdate(p, s), sequence: s.sequence, startedAt: s.startedAt, endsAt: end,
      sessionsStarted: s.sessionsStarted, sessionsCompleted: s.sessionsCompleted,
      completionCounted: s.completionCounted, expired: session && now >= end};
    if (s.powerPause) result.paused = paused;
    if (paused) {
      result.rateXp = 0; result.ready = false; result.pendingTicks = 0;
      result.sessionTicks = s.creditedTicks; result.nextTickMs = 0;
      result.needsDurationUpdate = false; result.needsRateUpdate = false;
    }
    return result;
  }
  function status(profile, now, xpConfig) {
    if (!nonnegative(now)) throw new RangeError('Passive XP time must be a finite non-negative timestamp.');
    return view(record(profile) ? profile.progression : null, normalize(record(profile) ? profile.passiveXp : null), now, potionState(profile), profileXpConfig(profile,now,xpConfig));
  }
  function validate(profile, now, xpConfig) {
    if (!record(profile) || !record(profile.progression)) return failure('invalid-profile', 'A full profile with progression is required.');
    if (!nonnegative(now)) return failure('invalid-time', 'Passive XP time must be a finite non-negative timestamp.');
    if (level(profile.progression) < UNLOCK_LEVEL) return failure('locked', 'Passive XP unlocks at player level 9.');
    try { PG.cost(1, profileXpConfig(profile,now,xpConfig)); } catch (error) { return failure('invalid-config', error.message); }
    try { potionState(profile); normalize(profile.passiveXp); } catch (error) { return failure('invalid-potions', error.message); }
    return null;
  }
  function summary(p, s, now, fromLevel, ticks, baseUnits, units, paidMs, stopped, xpConfig, state) {
    var progress = PG.progress(p, xpConfig);
    return {ok: true, ticks: ticks, baseXp: baseUnits / XP_UNITS, awardedXp: units / XP_UNITS, creditedMs: paidMs,
      fromLevel: fromLevel, toLevel: p.level, levelsGained: p.level - fromLevel,
      cap: progress.cap, banked: progress.banked, heldXp: progress.heldXp,
      maxLevel: progress.maxLevel, configurationMissing: progress.configurationMissing,
      stopped: stopped, status: view(p, s, now, state, xpConfig)};
  }
  function settle(p, s, now, xpConfig, fromLevel, state) {
    var ticks = 0, baseUnits = 0, units = 0, paidMs = 0, stopped = false;
    captureJoker(s,now,PG.jokerXpMultiplier(xpConfig));
    if (hasSession(s) && !s.completionCounted) {
      // External level changes may extend a still-active session, never revive one.
      if (needsDurationUpdate(p, s, now)) extend(s, durationForLevel(level(p)));
      setRate(s, rateForLevel(level(p)));
      while (s.creditedMs + s.tickMs <= elapsedMs(s, now)) {
        var beforeDuration = durationForLevel(level(p)), interval = s.tickMs, base = level(p) >= 20 ? 0 : s.baseRateXp;
        // Paid seconds are half-open intervals: the payout at +1000ms owns the
        // effect at its LEFT edge. Thus an aligned 120s Knowledge effect pays
        // exactly 120 XP, never 119, even when first polled after expiry.
        var tickTime = s.startedAt + s.creditedMs, effects = effectsAt(state, tickTime);
        var tickConfig = xpConfigAt(xpConfig, state, tickTime);tickConfig.jokerXpMultiplier=historicalJoker(s,tickTime);
        if(s.pokerTick&&s.pokerTick.at===tickTime)tickConfig.pokerXpMultiplier=s.pokerTick.multiplier;
        var excluded = powerExcluded(s, tickTime);
        // Recorded power-off seconds consume the existing paid-time cursor with
        // zero new XP, just like ordinary zero-base ticks at actual level20+.
        var result = excluded ? PG.addXp(p, 0, undefined, tickConfig) : effects.knowledgeXpPerSecond === 1 ? PG.addEarnedXp(p, PG.jokerXpMultiplier(tickConfig), undefined, tickConfig) : PG.addXp(p, base, undefined, tickConfig);
        baseUnits += Math.round((excluded ? 0 : base) * XP_UNITS); units += result.awardedXp * XP_UNITS;
        p.xp = cleanXp(p.xp); p.totalXp = cleanXp(p.totalXp);
        PG.addXp(p, 0, undefined, tickConfig);
        p.xp = cleanXp(p.xp); p.totalXp = cleanXp(p.totalXp);
        s.creditedMs += interval; paidMs += interval; s.creditedTicks++; ticks++;delete s.pokerTick;
        // Future payouts use the current level's rate from this paid-time cursor.
        // Legacy 10s payout counts and paid milliseconds are never reset/replayed.
        setRate(s, rateForLevel(level(p)));
        // Own historical level-ups can extend catch-up, anchored to original start.
        // The session is still bounded to one hour and at most 3600 payouts.
        var afterDuration = durationForLevel(level(p));
        if (afterDuration > beforeDuration) extend(s, afterDuration);
      }
      if (!Number.isSafeInteger(s.totalTicks + ticks) || !Number.isSafeInteger(s.totalCreditedMs + paidMs)) throw new RangeError('Passive XP paid counter overflow.');
      var totalXp = cleanXp(s.totalXp + units / XP_UNITS);
      if (!nonnegative(totalXp)) throw new RangeError('Passive XP total overflow.');
      s.totalTicks += ticks; s.totalCreditedMs += paidMs; s.totalXp = totalXp;
      // Do not round a final partial interval into a payout or extend it past end.
      if (now >= s.endsAt) {
        if (s.sessionsCompleted >= MAX_SAFE) throw new RangeError('Passive XP completion counter overflow.');
        s.sessionsCompleted++; s.completionCounted = true; stopped = true;
        captureCooldown(p, s, state);
      }
    }
    // Commit later level-based improvements only for an already potion-reduced
    // wait. Legacy neutral cooldowns remain the same pure derived view as before.
    if (s.cooldownEndAt === s.endsAt && nonnegative(s.cooldownUntil)) s.cooldownUntil = cooldownView(p, s, s.endsAt, state).cooldownUntil;
    captureJoker(s,now,PG.jokerXpMultiplier(xpConfig));
    prunePower(s);
    return summary(p, s, now, fromLevel, ticks, baseUnits, units, paidMs, stopped, xpConfigAt(xpConfig, state, now), state);
  }
  function commit(profile, p, s) {
    // Persist the whole profile after this synchronous transaction, never one ledger.
    profile.progression = p; profile.passiveXp = s;
  }
  function powerResult(p, s, now, xpConfig, state, changed, settled) {
    var result = settled || summary(p, s, now, level(p), 0, 0, 0, 0, false, xpConfig, state);
    result.changed = changed; result.paused = powerPaused(s); result.status = view(p, s, now, state, xpConfig);
    return result;
  }
  function setPowerPaused(profile, now, paused, xpConfig) {
    if (!safeTimestamp(now)) return failure('invalid-time', 'Supply a safe passive power boundary timestamp.');
    if (typeof paused !== 'boolean') return failure('invalid-power', 'Passive power pause must be boolean.');
    var invalid = validate(profile, now, xpConfig); if (invalid) return invalid;
    xpConfig=profileXpConfig(profile,now,xpConfig);
    var p = Object.assign({}, profile.progression), s = normalize(profile.passiveXp), state = potionState(profile);
    try {
      // An explicit boundary without an existing session cannot initialize a
      // ledger. Parent feature policy separately gates any future Start action.
      if ((!hasSession(s) && !s.powerPause) || powerPaused(s) === paused) return powerResult(p, s, now, xpConfig, state, false);
      var result;
      if (paused) {
        var last = s.powerPause && s.powerPause.exclusions[s.powerPause.exclusions.length - 1];
        if (last && now < last.to) throw new RangeError('Passive power clock moved backwards.');
        // Settle only the pre-pause legacy debt, once; no future pause interval
        // is inferred from saved Low Power, elapsed wall time or a missing poll.
        result = settle(p, s, now, xpConfig, level(profile.progression), state);
        if (!s.powerPause) s.powerPause = {version: 1, activeFrom: null, exclusions: []};
        s.powerPause.activeFrom = now;
      } else {
        var pause = s.powerPause, from = pause.activeFrom, a = pause.exclusions;
        if (now < from) throw new RangeError('Passive power clock moved backwards.');
        if (now > from) {
          var previous = a[a.length - 1];
          if (previous && previous.to === from) previous.to = now;
          else {
            if (a.length >= MAX_POWER_INTERVALS) throw new RangeError('Passive power exclusion history is full.');
            a.push({from: from, to: now});
          }
        }
        // Close the interval in this PRIVATE draft. Resume and its excluded
        // backlog become visible only together in the single whole-PROFILE commit.
        pause.activeFrom = null;
        result = settle(p, s, now, xpConfig, level(profile.progression), state);
      }
      var out = powerResult(p, s, now, xpConfig, state, true, result);
      commit(profile, p, s); return out;
    } catch (error) { return failure('overflow', error.message); }
  }
  function poll(profile, now, xpConfig) {
    var invalid = validate(profile, now, xpConfig);
    if (invalid) return invalid;
    xpConfig=profileXpConfig(profile,now,xpConfig);
    var p = Object.assign({}, profile.progression), s = normalize(profile.passiveXp), state = potionState(profile);
    try {
      if (powerPaused(s)) return powerResult(p, s, now, xpConfig, state, false);
      var result = settle(p, s, now, xpConfig, level(profile.progression), state);
      commit(profile, p, s); return result;
    } catch (error) { return failure('overflow', error.message); }
  }
  function checkpointPokerEvents(profile, now, xpConfig) {
    // Explicit atomic-proposal boundary BEFORE replacing Full House's raw window.
    // Native poll's existing bounded wall-session policy is unchanged (it is not
    // EI/PM's foreground clock). No separate write and no second elapsed stream.
    if(!record(profile)||!record(profile.progression))return failure('invalid-profile','A complete profile is required.');
    if(!safeTimestamp(now))return failure('invalid-time','Supply a safe Poker passive checkpoint time.');
    try {
      var config=profileXpConfig(profile,now,xpConfig),before=normalize(profile.passiveXp),from=level(profile.progression);
      if(!hasSession(before)||before.completionCounted)return {ok:true,changed:false,checkpointed:false,ticks:0,baseXp:0,awardedXp:0,creditedMs:0,fromLevel:from,toLevel:from,levelsGained:0};
      var next=Object.assign({},profile),result=poll(next,now,config);if(!result.ok)return result;
      var s=normalize(next.passiveXp),left=s.startedAt+s.creditedMs;
      if(hasSession(s)&&!s.completionCounted&&left<now&&left<s.endsAt&&!s.pokerTick)s.pokerTick={at:left,multiplier:PG.pokerXpMultiplier(xpConfigAt(config,potionState(profile),left),Math.floor(left))};
      s=normalize(s);
      // Paused native poll intentionally performs NO commit/normalization. Keep
      // even legacy-v1 bytes in that branch; only our explicit edge may be added.
      var stored=next.passiveXp===profile.passiveXp?Object.assign({},next.passiveXp):s;
      if(s.pokerTick)stored.pokerTick={at:s.pokerTick.at,multiplier:s.pokerTick.multiplier};
      var changed=JSON.stringify(stored)!==JSON.stringify(profile.passiveXp)||JSON.stringify(next.progression)!==JSON.stringify(profile.progression);
      profile.progression=next.progression;profile.passiveXp=stored;
      return Object.assign({},result,{changed:changed,checkpointed:!!s.pokerTick});
    } catch(error) {return failure('invalid-poker-checkpoint',error.message);}
  }
  function start(profile, now, xpConfig) {
    var invalid = validate(profile, now, xpConfig);
    if (invalid) return invalid;
    xpConfig=profileXpConfig(profile,now,xpConfig);
    var p = Object.assign({}, profile.progression), s = normalize(profile.passiveXp), state = potionState(profile);
    try {
      var current = view(p, s, now, state, xpConfig);
      if (powerPaused(s)) return Object.assign(failure('power-paused', 'Passive XP is paused by the current power setting.'), {status: current});
      if (current.active) return Object.assign(failure('already-active', 'The active passive XP session cannot be restarted or extended.'), {status: current});
      var settled = settle(p, s, now, xpConfig, level(profile.progression), state);
      // Historical passive level-ups can reveal that the old session is still open,
      // or move its real cooldown. A rejected start never commits this draft XP.
      var after = view(p, s, now, state, xpConfig), resumed = after.active;
      if (!resumed && after.coolingDown) {
        return Object.assign(failure('cooldown', 'Passive XP cooldown: ' + Math.ceil(after.cooldownRemainingMs / 1000) + 's remaining.'),
          {status: after, cooldownUntil: after.cooldownUntil, cooldownRemainingMs: after.cooldownRemainingMs});
      }
      if (!resumed) {
        if (s.sequence >= MAX_SAFE || s.sessionsStarted >= MAX_SAFE) throw new RangeError('Passive XP session counter overflow.');
        var duration = durationForLevel(level(p)), endsAt = now + duration;
        if (!Number.isFinite(endsAt) || endsAt <= now) throw new RangeError('Passive XP deadline overflow.');
        if (s.powerPause && s.completionCounted && s.creditedMs === s.sessionDurationMs) s.powerPause.exclusions = [];
        s.sequence++; s.sessionsStarted++; s.startedAt = now; s.endsAt = endsAt; s.sessionDurationMs = duration;
        s.creditedTicks = 0; s.creditedMs = 0; s.completionCounted = false; setRate(s, rateForLevel(level(p)));
        delete s.pokerTick;delete s.jokerXpSegments;if(PG.jokerXpMultiplier(xpConfig)!==1)s.jokerXpSegments=[{at:now,multiplier:PG.jokerXpMultiplier(xpConfig)}];
        delete s.cooldownUntil; delete s.cooldownEndAt; delete s.cooldownPotionAnchorAt;
      }
      var result = Object.assign({}, settled, {started: !resumed, resumed: resumed, sequence: s.sequence,
        startedAt: s.startedAt, endsAt: s.endsAt, session: normalize(s), settled: settled, status: view(p, s, now, state, xpConfig)});
      commit(profile, p, s); return result;
    } catch (error) { return failure('overflow', error.message); }
  }

  function applyCooldownPotion(profile, now, suppliedState) {
    if (!record(profile) || !record(profile.progression) || level(profile.progression) !== profile.progression.level) {
      return failure('invalid-profile', 'A full profile with valid progression is required.');
    }
    if (!nonnegative(now) || now > MAX_SAFE) return failure('invalid-time', 'Cooldown time must be a finite safe timestamp.');
    var state, active, s;
    try {
      if (!POT) throw new TypeError('The pure potion model is required for potion cooldowns.');
      state = POT.normalize(suppliedState); active = POT.current(state, Math.floor(now));
      s = normalize(profile.passiveXp);
    } catch (error) { return failure('invalid-potions', error.message); }
    var eligible = active && POT.hasEffect(active,'cooldown');
    var duplicate = !!eligible && !!s.cooldownPotionReceipts && own(s.cooldownPotionReceipts, active.uid);
    var before;
    try {
      before = view(profile.progression, s, now, state);
      if (eligible && !duplicate) {
        // If the still-unpaid session ended inside this very effect, capture its
        // already-halved historical wait instead of halving the same wait twice.
        if (hasSession(s) && now >= s.endsAt) captureCooldown(profile.progression, s, state);
        var capturedForUid = !!s.cooldownPotionReceipts && own(s.cooldownPotionReceipts, active.uid);
        if (!capturedForUid && !before.cooldownPotionApplied && before.coolingDown && now >= s.endsAt) {
          var deadline = now + before.cooldownRemainingMs / 2;
          if (!nonnegative(deadline) || deadline > MAX_SAFE) throw new RangeError('Passive potion cooldown deadline overflow.');
          s.cooldownUntil = deadline; s.cooldownEndAt = s.endsAt; s.cooldownPotionAnchorAt = now;
        }
        rememberCooldown(s, active.uid);
      }
      var after = view(profile.progression, s, now, state);
      if (eligible && !duplicate) profile.passiveXp = s;
      return {ok: true, applied: !!eligible && !duplicate && (after.cooldownUntil < before.cooldownUntil || !!capturedForUid && before.coolingDown),
        duplicate: duplicate, cooldownUntil: after.cooldownUntil, cooldownRemainingMs: after.cooldownRemainingMs,
        cooldownMs: after.cooldownMs, baseCooldownMs: after.baseCooldownMs, cooldownMultiplier: after.cooldownMultiplier,
        nextCooldownMs: after.nextCooldownMs, committedCooldownMs: after.committedCooldownMs, cooldownPotionApplied: after.cooldownPotionApplied};
    } catch (error) { return failure('overflow', error.message); }
  }

  return {UNLOCK_LEVEL: UNLOCK_LEVEL, BASE_XP: 0.01, TICK_MS: TICK_MS, SESSION_MS: SESSION_MS, COOLDOWN_MS: COOLDOWN_MS, REDUCED_COOLDOWN_MS: REDUCED_COOLDOWN_MS,
    MAX_SESSION_MS: MAX_SESSION_MS, SESSION_MAX_TICKS: SESSION_MAX_TICKS, durationForLevel: durationForLevel, rateForLevel: rateForLevel, cooldownForLevel: cooldownForLevel,
    create: create, normalize: normalize, captureJokerMultiplier:captureJokerMultiplier, status: status, start: start, poll: poll, checkpointPokerEvents:checkpointPokerEvents, setPowerPaused: setPowerPaused, applyCooldownPotion: applyCooldownPotion};
}));
