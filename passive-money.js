/* Pure, optional RUN-owned Passive Money v1/v2. No storage, clocks, timers, DOM,
 * potion, Wallet, XP or RNG dependencies. Explicit start alone creates
 * RUN.passiveMoney. All commands propose a whole RUN clone; failures do not
 * mutate their input. Ordinary current-run Bank is RUN.money.
 *
 * start/create(run, actualLevel, now, {pauseClock:true} [optional], context?),
 * poll(run, actualLevel, now, observedMs, context?),
 * setPaused(run, level, now, paused, observedMs, context?), status(run, level, now, context?)
 * -> {run, result:{ok,changed,awardedCents,earnedMs,code,status,...}}.
 * Optional pure context is ONLY {pokerEvents}, evaluated at the supplied absolute
 * now. Royal virtually bypasses EXPIRED-session manual restart cooldown only;
 * no active/paused restart, saved deadline rewrite, rate change or auto start.
 * status is read-only. normalize(undefined) is null; invalid state throws;
 * validate accepts the optional undefined case and otherwise returns boolean.
 *
 * Sessions CAPTURE duration/cooldown at start: levels 40/42/44 -> 10/20/30 min
 * and 5/4/2.5 min cooldown. Upgrades apply to the NEXT session only. Potions
 * never alter these timers or income. No hidden/offline time is reconstructed:
 * only the supplied observable interval intersecting [startedAt, endsAt) earns.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./emerald-poker-events'));
  else root.BOPassiveMoney = factory(root.BOEmeraldPokerEvents);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  const VERSION = 1, PAUSE_VERSION = 2, UNLOCK_LEVEL = 40, TICK_MS = 1000, MAX_TIME = Number.MAX_SAFE_INTEGER;
  const PHASES = Object.freeze(['select', 'play', 'cashout', 'shop', 'pack']);
  const STATE_FIELDS = Object.freeze(['version','sequence','startedAt','endsAt','durationMs','cooldownMs','cooldownEndsAt','lastAt','visibleMs','creditedCents','settled']);
  const PAUSE_STATE_FIELDS = Object.freeze([...STATE_FIELDS,'pausedAt','pausedMs']);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const count = value => Number.isSafeInteger(value) && value >= 0;
  const clock = value => count(value) && value <= MAX_TIME;
  function check(ok, code, message) { if (!ok) { const error = new Error(message); error.code = code; throw error; } }
  function dataKeys(value) {
    check(value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype,
      'invalid-data', 'Expected a plain, own-data object.');
    const keys = Reflect.ownKeys(value);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      check(typeof key === 'string' && descriptor && own(descriptor, 'value') && descriptor.enumerable === true,
        'invalid-data', 'Only enumerable string-keyed data properties are supported.');
      check(!['__proto__','constructor','prototype'].includes(key), 'invalid-data', 'Unsupported data key.');
    }
    return keys;
  }
  // Descriptor-first copying avoids getters/toJSON and keeps genuine subcent
  // numbers and all other native fields exact. Shared JSON aliases are legal;
  // cycles, sparse/exotic arrays, symbols and executable properties are not.
  function copyData(input) {
    const path = new Set(); let nodes = 0;
    function visit(value, depth) {
      check(++nodes <= 1000000 && depth <= 64, 'invalid-data', 'Run data is too large or deep.');
      if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
      if (typeof value === 'number') { check(Number.isFinite(value), 'invalid-data', 'Nonfinite run value.'); return value; }
      check(typeof value === 'object' && !path.has(value), 'invalid-data', 'Run must contain acyclic JSON data only.');
      path.add(value); let out;
      if (Array.isArray(value)) {
        check(Object.getPrototypeOf(value) === Array.prototype && value.length <= 1000000,
          'invalid-data', 'Unsupported data array.');
        const keys = Reflect.ownKeys(value);
        check(keys.length === value.length + 1 && keys.includes('length'), 'invalid-data', 'Sparse or extended array.');
        out = [];
        for (let i = 0; i < value.length; i++) {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
          check(descriptor && own(descriptor, 'value') && descriptor.enumerable === true, 'invalid-data', 'Accessor or sparse array.');
          out.push(visit(descriptor.value, depth + 1));
        }
      } else {
        out = {};
        for (const key of dataKeys(value)) out[key] = visit(Object.getOwnPropertyDescriptor(value, key).value, depth + 1);
      }
      path.delete(value); return out;
    }
    return visit(input, 0);
  }
  function normalize(existing) {
    if (existing === undefined) return null;
    const keys = dataKeys(existing), descriptor = Object.getOwnPropertyDescriptor(existing, 'version');
    const fields = descriptor && descriptor.value === PAUSE_VERSION ? PAUSE_STATE_FIELDS : STATE_FIELDS;
    check(keys.length === fields.length && keys.every(key => fields.includes(key)), 'invalid-state', 'Unexpected Passive Money state fields.');
    const s = {};
    for (const key of keys) s[key] = Object.getOwnPropertyDescriptor(existing, key).value;
    check((s.version === VERSION || s.version === PAUSE_VERSION) && count(s.sequence) && s.sequence >= 1, 'invalid-state', 'Invalid Passive Money version or sequence.');
    const pausedMs = s.version === PAUSE_VERSION ? s.pausedMs : 0;
    check(count(pausedMs) && (s.version !== PAUSE_VERSION || s.pausedAt === null || clock(s.pausedAt)), 'invalid-state', 'Invalid Passive Money pause ledger.');
    check((s.durationMs === 600000 && s.cooldownMs === 300000) ||
      (s.durationMs === 1200000 && s.cooldownMs === 240000) ||
      (s.durationMs === 1800000 && s.cooldownMs === 150000), 'invalid-state', 'Invalid captured Passive Money tier.');
    check(clock(s.startedAt) && clock(s.endsAt) && clock(s.cooldownEndsAt) && clock(s.lastAt) &&
      s.startedAt <= MAX_TIME - s.durationMs - s.cooldownMs - pausedMs && s.endsAt === s.startedAt + s.durationMs + pausedMs &&
      s.cooldownEndsAt === s.endsAt + s.cooldownMs, 'invalid-state', 'Invalid Passive Money absolute deadlines.');
    check(s.version !== PAUSE_VERSION || s.pausedAt === null || (s.pausedAt === s.lastAt && s.pausedAt < s.cooldownEndsAt),
      'invalid-state', 'Invalid Passive Money paused cursor.');
    check(typeof s.settled === 'boolean' && (s.settled ? s.lastAt >= s.endsAt : s.lastAt >= s.startedAt && s.lastAt < s.endsAt),
      'invalid-state', 'Invalid Passive Money chronological cursor.');
    check(count(s.visibleMs) && s.visibleMs <= s.durationMs && s.visibleMs <= Math.min(s.durationMs, s.lastAt - s.startedAt - pausedMs) &&
      count(s.creditedCents) && s.creditedCents === Math.floor(s.visibleMs / TICK_MS), 'invalid-state', 'Invalid Passive Money visible-time ledger.');
    return s;
  }
  function validate(existing) { try { normalize(existing); return true; } catch (_) { return false; } }
  function tierForLevel(actualLevel) {
    check(Number.isInteger(actualLevel) && actualLevel >= 1 && actualLevel <= 100, 'invalid-level', 'Supply the actual profile player level (1–100).');
    return {durationMs:actualLevel >= 44 ? 1800000 : actualLevel >= 42 ? 1200000 : 600000,
      cooldownMs:actualLevel >= 44 ? 150000 : actualLevel >= 42 ? 240000 : 300000};
  }
  function inspectedRun(run) {
    const r = copyData(run); dataKeys(r);
    check(typeof r._uiId === 'string' && r._uiId.trim().length > 0 && typeof r.phase === 'string', 'invalid-run', 'An identified origin run is required.');
    check(typeof r.money === 'number' && Number.isFinite(r.money), 'invalid-bank', 'The current-run Bank needs attention.');
    dataKeys(r.stats);
    check(typeof r.stats.moneyEarned === 'number' && Number.isFinite(r.stats.moneyEarned) && r.stats.moneyEarned >= 0,
      'invalid-bank', 'The run income statistic needs attention.');
    return {run:r, state:normalize(own(r, 'passiveMoney') ? r.passiveMoney : undefined)};
  }
  function usable(run) { return PHASES.includes(run.phase) && run.abandoned !== true; }
  function effectsAt(context, now) {
    if (context === undefined) return {zeroCooldowns:false};
    const keys = dataKeys(context);
    check(keys.every(key => key === 'pokerEvents'), 'invalid-context', 'Supply only an optional Poker event ledger.');
    if (!own(context, 'pokerEvents')) return {zeroCooldowns:false};
    check(E && typeof E.effectsAt === 'function', 'missing-events', 'The Poker events model is required for event authority.');
    return E.effectsAt(Object.getOwnPropertyDescriptor(context, 'pokerEvents').value, now);
  }
  function view(run, s, actualLevel, now, tier, effects) {
    const unlocked = actualLevel >= UNLOCK_LEVEL, eligibleRun = usable(run), rollback = !!s && now < s.lastAt;
    const paused = !!s && s.version === PAUSE_VERSION && s.pausedAt !== null;
    const at = s ? paused ? s.pausedAt : rollback ? s.lastAt : now : now;
    const sessionRemainingMs = s && !s.settled ? Math.max(0, s.endsAt - at) : 0;
    const active = unlocked && eligibleRun && !!s && !paused && !s.settled && !rollback && at < s.endsAt;
    // Saved native cooldown/deadlines remain authoritative after event expiry.
    // The event changes only present manual readiness AFTER the original end.
    const zeroCooldowns = effects.zeroCooldowns && !paused && !rollback && (!s || now >= s.endsAt);
    const coolingDown = !!s && !zeroCooldowns && at >= s.endsAt && at < s.cooldownEndsAt;
    return {ok:true, unlocked, eligibleRun, active, paused, hasSession:!!s, legacyClock:!!s && s.version === VERSION,
      sessionRemainingMs, ready:unlocked && eligibleRun && !paused && !rollback && (!s || at >= s.cooldownEndsAt || zeroCooldowns),
      coolingDown, zeroCooldowns, clockRollback:rollback, expired:!!s && at >= s.endsAt, settled:!!s && s.settled,
      sequence:s ? s.sequence : 0, startedAt:s ? s.startedAt : 0, endsAt:s ? s.endsAt : 0,
      cooldownEndsAt:s ? s.cooldownEndsAt : 0, durationMs:s ? s.durationMs : tier.durationMs,
      cooldownMs:zeroCooldowns ? 0 : s ? s.cooldownMs : tier.cooldownMs, nextDurationMs:tier.durationMs, nextCooldownMs:zeroCooldowns ? 0 : tier.cooldownMs,
      remainingMs:active || paused ? sessionRemainingMs : 0, cooldownRemainingMs:coolingDown ? s.cooldownEndsAt - at : 0,
      visibleMs:s ? s.visibleMs : 0, creditedCents:s ? s.creditedCents : 0,
      maxCents:(s ? s.durationMs : tier.durationMs) / TICK_MS, centsPerSecond:1};
  }
  function failure(error) { return {ok:false,changed:false,awardedCents:0,earnedMs:0,code:error.code || 'invalid-input',reason:error.message || String(error)}; }
  function status(run, actualLevel, now, context) {
    try { const tier = tierForLevel(actualLevel); check(clock(now), 'invalid-time', 'Supply a nonnegative safe-integer absolute timestamp.');
      const effects = effectsAt(context, now), a = inspectedRun(run); return view(a.run, a.state, actualLevel, now, tier, effects);
    } catch (error) { return failure(error); }
  }
  function command(run, actualLevel, now, operation, context) {
    try {
      const tier = tierForLevel(actualLevel); check(clock(now), 'invalid-time', 'Supply a nonnegative safe-integer absolute timestamp.');
      const effects = effectsAt(context, now), a = inspectedRun(run);
      check(actualLevel >= UNLOCK_LEVEL, 'locked', 'Passive Money unlocks at actual player Level 40.');
      check(usable(a.run), 'ineligible-run', 'Passive Money needs the active, non-abandoned origin run.');
      check(!a.state || now >= a.state.lastAt, 'clock-rollback', 'The absolute clock moved backwards. No time was forced forward.');
      const result = operation(a.run, a.state, tier, effects);
      result.status = view(a.run, own(a.run, 'passiveMoney') ? a.run.passiveMoney : null, actualLevel, now, tier, effects);
      return {run:a.run, result};
    } catch (error) { return {run, result:failure(error)}; }
  }
  function start(run, actualLevel, now, options, context) {
    return command(run, actualLevel, now, (r, s, tier, effects) => {
      check(options === undefined || (dataKeys(options).length === 1 && own(options, 'pauseClock') && typeof options.pauseClock === 'boolean'), 'invalid-options', 'Supply only an explicit boolean pauseClock option.');
      check(!s || ((s.version !== PAUSE_VERSION || s.pausedAt === null) && now >= s.endsAt && (now >= s.cooldownEndsAt || effects.zeroCooldowns)), s && s.version === PAUSE_VERSION && s.pausedAt !== null ? 'paused' : s && now < s.endsAt ? 'active' : 'cooldown', 'This session is active, paused or still cooling down.');
      check(!s || s.sequence < MAX_TIME, 'sequence-overflow', 'Passive Money sequence cannot safely advance.');
      check(now <= MAX_TIME - tier.durationMs - tier.cooldownMs, 'clock-overflow', 'The captured session deadlines would overflow.');
      r.passiveMoney = {version:VERSION, sequence:s ? s.sequence + 1 : 1, startedAt:now, endsAt:now + tier.durationMs,
        durationMs:tier.durationMs, cooldownMs:tier.cooldownMs, cooldownEndsAt:now + tier.durationMs + tier.cooldownMs,
        lastAt:now, visibleMs:0, creditedCents:0, settled:false};
      if (options && options.pauseClock) Object.assign(r.passiveMoney, {version:PAUSE_VERSION,pausedAt:null,pausedMs:0});
      return {ok:true,changed:true,awardedCents:0,earnedMs:0,code:'started',sequence:r.passiveMoney.sequence};
    }, context);
  }
  function cleanCentNoise(value) {
    const cents = Math.round(value * 100), nearest = cents / 100;
    // Do not round genuine tiny/subcent legacy data to zero or apply a large
    // relative-epsilon tolerance at large banks. Only near-cent arithmetic dust.
    return Number.isSafeInteger(cents) && (nearest !== 0 || value === 0) &&
      Math.abs(nearest - value) <= Math.min(1e-12, Number.EPSILON * Math.max(1, Math.abs(value)) * 4) ? nearest : value;
  }
  function decimal(value) {
    const parts = String(value).toLowerCase().split('e'), exponent = parts.length === 2 ? Number(parts[1]) : 0;
    const pieces = parts[0].split('.'), fraction = pieces[1] || '';
    let scale = fraction.length - exponent, units = BigInt(pieces[0] + fraction);
    if (scale < 0) { units *= 10n ** BigInt(-scale); scale = 0; }
    return {units,scale};
  }
  function decimalText(units, scale) {
    const negative = units < 0n; let digits = String(negative ? -units : units);
    if (scale) { digits = digits.padStart(scale + 1, '0'); digits = digits.slice(0, -scale) + '.' + digits.slice(-scale); }
    return (negative ? '-' : '') + digits;
  }
  function addCents(value, cents) {
    const base = cleanCentNoise(value), a = decimal(base), scale = Math.max(2, a.scale);
    const intended = a.units * 10n ** BigInt(scale - a.scale) + BigInt(cents) * 10n ** BigInt(scale - 2);
    const out = Number(decimalText(intended, scale));
    check(Number.isFinite(out) && out > value, 'precision', 'A full cent award cannot be represented without losing existing Bank or income precision.');
    const b = decimal(out), common = Math.max(scale, b.scale);
    check(b.units * 10n ** BigInt(common - b.scale) === intended * 10n ** BigInt(common - scale),
      'precision', 'A full cent award cannot be represented without losing existing Bank or income precision.');
    return out;
  }
  function poll(run, actualLevel, now, observedMs, context) {
    return command(run, actualLevel, now, (r, s) => {
      check(count(observedMs), 'invalid-observation', 'Observable eligible milliseconds must be a nonnegative safe integer.');
      if (!s || s.settled || (s.version === PAUSE_VERSION && s.pausedAt !== null)) return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:s && s.version === PAUSE_VERSION && s.pausedAt !== null ? 'paused' : s ? 'settled' : 'idle'};
      // A forward jump is not evidence of observed time. In particular, a
      // one-second observation wholly AFTER expiry earns nothing before expiry.
      const end = Math.min(now, s.endsAt), begin = Math.max(s.lastAt, s.startedAt, now - observedMs);
      const earnedMs = Math.min(s.durationMs - s.visibleMs, Math.max(0, end - begin));
      const visibleMs = s.visibleMs + earnedMs, creditedCents = Math.floor(visibleMs / TICK_MS);
      const awardedCents = creditedCents - s.creditedCents, settled = now >= s.endsAt;
      if (awardedCents > 0) { const money = addCents(r.money, awardedCents), income = addCents(r.stats.moneyEarned, awardedCents);
        r.money = money; r.stats.moneyEarned = income; }
      const changed = now !== s.lastAt || earnedMs > 0 || settled !== s.settled;
      if (changed) { s.lastAt = now; s.visibleMs = visibleMs; s.creditedCents = creditedCents; s.settled = settled; r.passiveMoney = s; }
      return {ok:true,changed,awardedCents,earnedMs,code:settled ? 'settled' : awardedCents ? 'earned' : 'observed',sequence:s.sequence};
    }, context);
  }
  // Explicit power command only. v1 reads remain absolute and byte-preserving;
  // converting a live ledger records remaining NOW, never an invented past pause.
  function setPaused(run, actualLevel, now, paused, observedMs = 0, context) {
    return command(run, actualLevel, now, (r, s) => {
      check(typeof paused === 'boolean' && count(observedMs), 'invalid-observation', 'Supply a boolean pause and nonnegative observed milliseconds.');
      const wasPaused = !!s && s.version === PAUSE_VERSION && s.pausedAt !== null;
      if (!s || wasPaused === paused || (!wasPaused && now >= s.cooldownEndsAt))
        return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:wasPaused ? 'paused' : s ? 'unchanged' : 'idle'};
      if (paused) {
        const proposed = poll(r, actualLevel, now, observedMs, context);
        check(proposed.result.ok, proposed.result.code, proposed.result.reason);
        Object.assign(r, proposed.run); s = normalize(r.passiveMoney);
        Object.assign(s, {version:PAUSE_VERSION,pausedMs:s.version === PAUSE_VERSION ? s.pausedMs : 0,pausedAt:now,lastAt:now});
        r.passiveMoney = s; normalize(s);
        return {...proposed.result,ok:true,changed:true,code:'paused',sequence:s.sequence};
      }
      const gap = now - s.pausedAt;
      check(s.cooldownEndsAt <= MAX_TIME - gap, 'clock-overflow', 'Resuming these captured deadlines would overflow.');
      s.pausedMs += gap; s.endsAt += gap; s.cooldownEndsAt += gap; s.lastAt = now; s.pausedAt = null;
      r.passiveMoney = s; normalize(s);
      return {ok:true,changed:true,awardedCents:0,earnedMs:0,code:'resumed',sequence:s.sequence};
    }, context);
  }
  return Object.freeze({VERSION,PAUSE_VERSION,UNLOCK_LEVEL,TICK_MS,MAX_TIME,PHASES,STATE_FIELDS,PAUSE_STATE_FIELDS,create:start,start,poll,setPaused,status,normalize,validate,tierForLevel,copyData});
}));
