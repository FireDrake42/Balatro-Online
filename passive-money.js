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
 * now. Royal derives half the original EXPIRED-session manual restart wait only;
 * no active/paused restart, saved deadline rewrite, rate change or auto start.
 * status is read-only. normalize(undefined) is null; invalid state throws;
 * validate accepts the optional undefined case and otherwise returns boolean.
 *
 * Sessions CAPTURE duration/cooldown at start: levels 40/42/44 -> 10/20/30 min
 * and 5/4/2.5 min cooldown. Upgrades apply to the NEXT session only. Potions
 * never alter these timers or income. Legacy poll/setPaused remain observed-
 * time APIs. Explicit elapsed APIs pollElapsed/startElapsed/setPausedElapsed
 * use the saved lastAt high-water cursor, including other app tabs and closed
 * time, bounded by the CAPTURED active session. No automatic activation/restart.
 * The whole RUN is the journal: Bank, income, creditedCents, visibleMs (including
 * the millisecond fraction) and lastAt must commit and read back TOGETHER.
 * Wall rollback never advances or rewinds lastAt. A forward clock jump can earn
 * only the remaining finite session budget, never an unbounded offline award.
 * Legacy discarded gaps BEFORE lastAt are not reconstructed or migrated.
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
    if (context === undefined) return {zeroCooldowns:false,cooldownMultiplier:1};
    const keys = dataKeys(context);
    check(keys.every(key => key === 'pokerEvents'), 'invalid-context', 'Supply only an optional Poker event ledger.');
    if (!own(context, 'pokerEvents')) return {zeroCooldowns:false,cooldownMultiplier:1};
    check(E && typeof E.effectsAt === 'function', 'missing-events', 'The Poker events model is required for event authority.');
    return E.effectsAt(Object.getOwnPropertyDescriptor(context, 'pokerEvents').value, now);
  }
  function cooldownDuration(duration,context,now) {
    return context&&own(context,'pokerEvents')?E.cooldownDuration(duration,Object.getOwnPropertyDescriptor(context,'pokerEvents').value,now):duration;
  }
  function view(run, s, actualLevel, now, tier, effects, context) {
    const unlocked = actualLevel >= UNLOCK_LEVEL, eligibleRun = usable(run), rollback = !!s && now < s.lastAt;
    const paused = !!s && s.version === PAUSE_VERSION && s.pausedAt !== null;
    const at = s ? paused ? s.pausedAt : rollback ? s.lastAt : now : now;
    const sessionRemainingMs = s && !s.settled ? Math.max(0, s.endsAt - at) : 0;
    const active = unlocked && eligibleRun && !!s && !paused && !s.settled && !rollback && at < s.endsAt;
    // Saved native cooldown/deadlines remain authoritative after event expiry.
    // The event changes only present manual readiness AFTER the original end.
    const zeroCooldowns=false,cooldownMs=cooldownDuration(s?s.cooldownMs:tier.cooldownMs,context,now);
    const cooldownEndsAt=s?(effects.cooldownMultiplier===0.5?s.endsAt+cooldownMs:s.cooldownEndsAt):0;
    const coolingDown = !!s && at >= s.endsAt && at < cooldownEndsAt;
    return {ok:true, unlocked, eligibleRun, active, paused, hasSession:!!s, legacyClock:!!s && s.version === VERSION,
      sessionRemainingMs, ready:unlocked && eligibleRun && !paused && !rollback && (!s || at >= cooldownEndsAt),
      coolingDown, zeroCooldowns, pokerCooldownMultiplier:effects.cooldownMultiplier, clockRollback:rollback, expired:!!s && at >= s.endsAt, settled:!!s && s.settled,
      sequence:s ? s.sequence : 0, startedAt:s ? s.startedAt : 0, endsAt:s ? s.endsAt : 0,
      cooldownEndsAt, nativeCooldownEndsAt:s?s.cooldownEndsAt:0, durationMs:s ? s.durationMs : tier.durationMs,
      cooldownMs, nativeCooldownMs:s?s.cooldownMs:tier.cooldownMs, nextDurationMs:tier.durationMs, nextCooldownMs:cooldownDuration(tier.cooldownMs,context,now),
      remainingMs:active || paused ? sessionRemainingMs : 0, cooldownRemainingMs:coolingDown ? cooldownEndsAt - at : 0,
      visibleMs:s ? s.visibleMs : 0, creditedCents:s ? s.creditedCents : 0,
      maxCents:(s ? s.durationMs : tier.durationMs) / TICK_MS, centsPerSecond:1};
  }
  function failure(error) { return {ok:false,changed:false,awardedCents:0,earnedMs:0,code:error.code || 'invalid-input',reason:error.message || String(error)}; }
  function status(run, actualLevel, now, context) {
    try { const tier = tierForLevel(actualLevel); check(clock(now), 'invalid-time', 'Supply a nonnegative safe-integer absolute timestamp.');
      const effects = effectsAt(context, now), a = inspectedRun(run); return view(a.run, a.state, actualLevel, now, tier, effects, context);
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
      result.status = view(a.run, own(a.run, 'passiveMoney') ? a.run.passiveMoney : null, actualLevel, now, tier, effects, context);
      return {run:a.run, result};
    } catch (error) { return {run, result:failure(error)}; }
  }
  function start(run, actualLevel, now, options, context) {
    return command(run, actualLevel, now, (r, s, tier, effects) => {
      check(options === undefined || (dataKeys(options).length === 1 && own(options, 'pauseClock') && typeof options.pauseClock === 'boolean'), 'invalid-options', 'Supply only an explicit boolean pauseClock option.');
      check(!s || ((s.version !== PAUSE_VERSION || s.pausedAt === null) && now >= s.endsAt && now >= s.endsAt+cooldownDuration(s.cooldownMs,context,now)), s && s.version === PAUSE_VERSION && s.pausedAt !== null ? 'paused' : s && now < s.endsAt ? 'active' : 'cooldown', 'This session is active, paused or still cooling down.');
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
  // Elapsed time is authorized only through these explicit APIs. Descriptor-first
  // inspection and command() retain all legacy shape/level/run/clock checks.
  function pollElapsed(run, actualLevel, now, context) {
    return command(run, actualLevel, now, (r, s) => {
      const proposal = poll(r, actualLevel, now, s ? now - s.lastAt : 0, context);
      check(proposal.result.ok, proposal.result.code, proposal.result.reason);
      Object.assign(r, proposal.run);
      return proposal.result;
    }, context);
  }
  // A denied restart discards the ENTIRE proposal, including any hypothetical
  // settlement. A successful restart journals the old award and new session in
  // one RUN write; it cannot erase an unclaimed expired session on reload.
  function startElapsed(run, actualLevel, now, options, context) {
    const folded = pollElapsed(run, actualLevel, now, context);
    if (!folded.result.ok) return folded;
    const next = start(folded.run, actualLevel, now, options, context);
    if (!next.result.ok) return {run,result:next.result};
    next.result = {...next.result,awardedCents:folded.result.awardedCents,earnedMs:folded.result.earnedMs};
    return next;
  }
  // Essential pre-policy checkpoint: fold through the exact boundary BEFORE
  // pausing. Resuming a paused ledger credits no closed/policy-off interval and
  // shifts the captured remaining session/cooldown deadlines by the saved gap.
  function setPausedElapsed(run, actualLevel, now, paused, context) {
    const folded = pollElapsed(run, actualLevel, now, context);
    if (!folded.result.ok) return folded;
    const next = setPaused(folded.run, actualLevel, now, paused, 0, context);
    if (!next.result.ok) return {run,result:next.result};
    next.result = {...next.result,changed:folded.result.changed || next.result.changed,
      awardedCents:folded.result.awardedCents + next.result.awardedCents,
      earnedMs:folded.result.earnedMs + next.result.earnedMs};
    return next;
  }
  // Distinct optional full-clock receipt. ALL original v1/v2 function bodies above
  // remain exact. Only explicit version dispatch below can enter this namespace.
  const BOOST_VERSION = 3, BOOST_FIELDS = Object.freeze(['version','sequence','base','lastAt','pausedAt','sessionPausedMs','cooldownPausedMs','sessionBonusMs','cooldownBonusMs','creditedCents','boostRevision']);
  const finiteClock = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_TIME;
  const isBoosted = s => !!s && typeof s === 'object' && Object.getOwnPropertyDescriptor(s,'version')?.value === BOOST_VERSION;
  function boostLeft(s,at) {
    // Cancel integer UTC anchors BEFORE fractional work. Absolute epoch-rounded
    // derived S/K must never pay a final cent, change phase or unlock early.
    return {session:s.base.endsAt-at+s.sessionPausedMs-s.sessionBonusMs,
      cooldown:s.base.cooldownEndsAt-at+s.sessionPausedMs+s.cooldownPausedMs-(s.sessionBonusMs+s.cooldownBonusMs)};
  }
  function boostNumbers(s) {
    const b=s.base, D=b.durationMs, C=b.cooldownMs, P=b.version===PAUSE_VERSION?b.pausedMs:0;
    const U=Math.min(D,Math.max(0,b.lastAt-b.startedAt-P));
    const S=b.endsAt+s.sessionPausedMs-s.sessionBonusMs, K=S+C+s.cooldownPausedMs-s.cooldownBonusMs;
    const Q=boostLeft(s,s.lastAt).session<=0?D-U:Math.min(D-U,Math.max(0,s.lastAt-b.lastAt-s.sessionPausedMs)+s.sessionBonusMs);
    return {D,C,U,S,K,W:b.visibleMs+Q};
  }
  function normalizeBoosted(existing) {
    const keys=dataKeys(existing);
    check(keys.length===BOOST_FIELDS.length&&keys.every(k=>BOOST_FIELDS.includes(k)),'invalid-state','Unexpected full-clock Passive Money fields.');
    const s={};for(const k of keys)s[k]=Object.getOwnPropertyDescriptor(existing,k).value;
    s.base=normalize(s.base);
    check(s.version===BOOST_VERSION&&s.base&&count(s.sequence)&&s.sequence===s.base.sequence&&
      (s.base.version!==PAUSE_VERSION||s.base.pausedAt===null),'invalid-state','Invalid original full-clock session base.');
    check(clock(s.lastAt)&&s.lastAt>=s.base.lastAt&&count(s.sessionPausedMs)&&count(s.cooldownPausedMs)&&
      (s.pausedAt===null||clock(s.pausedAt)&&s.pausedAt===s.lastAt),'invalid-state','Invalid full-clock UTC/pause cursor.');
    // Type-check BEFORE arithmetic: invalid data cannot execute valueOf/getters.
    check(finiteClock(s.sessionBonusMs)&&finiteClock(s.cooldownBonusMs)&&count(s.boostRevision)&&s.boostRevision>0,
      'invalid-state','Invalid finite full-clock bonus fields.');
    const unpaused=s.lastAt-s.base.lastAt-s.sessionPausedMs-s.cooldownPausedMs;
    // Every admitted UTC bracket is >=1ms and REAL<=UTC+64ms. Summed across
    // disjoint brackets, even that extremal density is <=(1+64)*0.5 per UTC.
    // This is only a structural upper bound, NEVER an observation authority.
    check(unpaused>0&&s.sessionBonusMs+s.cooldownBonusMs<=32.5*unpaused+1e-7,
      'invalid-state','Noncausal aggregate full-clock pause/bonus budget.');
    const n=boostNumbers(s), c0=Math.min(n.C,Math.max(0,s.base.lastAt-s.base.endsAt));
    check(s.sessionBonusMs<=n.D-n.U&&s.cooldownBonusMs<=n.C-c0&&s.sessionBonusMs+s.cooldownBonusMs>0,
      'invalid-state','Invalid finite full-clock bonus budget.');
    check(finiteClock(n.S)&&finiteClock(n.K)&&n.K>=n.S&&
      (n.U===n.D?s.sessionBonusMs===0:boostLeft(s,s.base.lastAt).session>=0)&&
      (c0===n.C?s.cooldownBonusMs===0:boostLeft(s,s.base.lastAt).cooldown>=0)&&
      (boostLeft(s,s.lastAt).session<=0||s.cooldownBonusMs===0&&s.cooldownPausedMs===0)&&
      (s.pausedAt===null||boostLeft(s,s.lastAt).cooldown>0)&&s.lastAt>s.base.lastAt,
      'invalid-state','Noncausal full-clock phase boundaries.');
    check(count(s.creditedCents)&&s.creditedCents===Math.floor(n.W/TICK_MS)&&n.W>=s.base.visibleMs&&n.W<=n.D,
      'invalid-state','Full-clock work and credited cents disagree.');
    return s;
  }
  function normalizeAny(s) { return isBoosted(s)?normalizeBoosted(s):normalize(s); }
  function validateAny(s) { try { normalizeAny(s);return true; } catch(_) {return false;} }
  function inspectedAny(run) {
    const r=copyData(run);dataKeys(r);
    check(typeof r._uiId==='string'&&r._uiId.trim().length>0&&typeof r.phase==='string','invalid-run','An identified origin run is required.');
    check(typeof r.money==='number'&&Number.isFinite(r.money),'invalid-bank','The current-run Bank needs attention.');dataKeys(r.stats);
    check(typeof r.stats.moneyEarned==='number'&&Number.isFinite(r.stats.moneyEarned)&&r.stats.moneyEarned>=0,'invalid-bank','The run income statistic needs attention.');
    return {run:r,state:normalizeAny(own(r,'passiveMoney')?r.passiveMoney:undefined)};
  }
  function viewBoosted(run,s,level,now,context) {
    const tier=tierForLevel(level),effects=effectsAt(context,now),n=boostNumbers(s),paused=s.pausedAt!==null,rollback=now<s.lastAt;
    const at=paused?s.pausedAt:rollback?s.lastAt:now,unlocked=level>=UNLOCK_LEVEL,eligibleRun=usable(run);
    const left=boostLeft(s,at),threshold=cooldownDuration(n.C,context,now),cdWork=Math.min(n.C,Math.max(0,n.C-left.cooldown));
    const expired=left.session<=0,sessionRemainingMs=Math.max(0,left.session),cooldownRemainingMs=expired?Math.max(0,threshold-cdWork):0;
    // Royal's current zero remainder is NOT a saved historical completion time.
    const cooldownEndsAt=effects.cooldownMultiplier===0.5&&expired?at+cooldownRemainingMs:n.K;
    return {ok:true,unlocked,eligibleRun,active:unlocked&&eligibleRun&&!paused&&!rollback&&!expired,paused,hasSession:true,legacyClock:false,
      sessionRemainingMs,ready:unlocked&&eligibleRun&&!paused&&!rollback&&expired&&cdWork>=threshold,
      coolingDown:expired&&cdWork<threshold,zeroCooldowns:false,pokerCooldownMultiplier:effects.cooldownMultiplier,clockRollback:rollback,
      expired,settled:boostLeft(s,s.lastAt).session<=0,sequence:s.sequence,startedAt:s.base.startedAt,endsAt:n.S,cooldownEndsAt,nativeCooldownEndsAt:n.K,
      durationMs:n.D,cooldownMs:threshold,nativeCooldownMs:n.C,nextDurationMs:tier.durationMs,nextCooldownMs:cooldownDuration(tier.cooldownMs,context,now),
      remainingMs:!expired?sessionRemainingMs:0,cooldownRemainingMs,visibleMs:n.W,creditedCents:s.creditedCents,maxCents:n.D/TICK_MS,centsPerSecond:1};
  }
  function statusAny(run,level,now,context) {
    if(!isBoosted(Object.getOwnPropertyDescriptor(run||{},'passiveMoney')?.value))return status(run,level,now,context);
    try {check(clock(now),'invalid-time','Supply a nonnegative safe-integer absolute timestamp.');const a=inspectedAny(run);return viewBoosted(a.run,a.state,level,now,context);}catch(e){return failure(e);}
  }
  function boostCommand(run,level,now,context,operation) {
    try {
      const tier=tierForLevel(level);check(clock(now),'invalid-time','Supply a nonnegative safe-integer absolute timestamp.');effectsAt(context,now);
      const a=inspectedAny(run);check(level>=UNLOCK_LEVEL,'locked','Passive Money unlocks at actual player Level40.');
      check(usable(a.run),'ineligible-run','Passive Money needs the active, non-abandoned origin run.');
      check(!a.state||now>=a.state.lastAt,'clock-rollback','The absolute clock moved backwards. No time was forced forward.');
      const result=operation(a.run,a.state,tier);result.status=statusAny(a.run,level,now,context);return {run:a.run,result};
    }catch(e){return {run,result:failure(e)};}
  }
  function boostDraft(s) {
    if(s.version===BOOST_VERSION)return copyData(s);
    return {version:BOOST_VERSION,sequence:s.sequence,base:copyData(s),lastAt:s.lastAt,pausedAt:null,
      sessionPausedMs:0,cooldownPausedMs:0,sessionBonusMs:0,cooldownBonusMs:0,creditedCents:s.creditedCents,boostRevision:0};
  }
  function boostProof(input,s,level,now) {
    if(input===undefined)return null;
    const p=copyData(input),keys=dataKeys(p);
    check(keys.length===2&&keys.includes('receipt')&&keys.includes('slices')&&Array.isArray(p.slices),'invalid-observation','Supply one strict receipt and native observed slices.');
    if(p.receipt===undefined||level<50)return null;
    const r=p.receipt,rk=dataKeys(r),fields=['version','revision','startedAt','activeUntil','cooldownUntil'];
    check(rk.length===fields.length&&rk.every(k=>fields.includes(k))&&r.version===1&&count(r.revision)&&r.revision>0&&
      [r.startedAt,r.activeUntil,r.cooldownUntil].every(clock)&&r.activeUntil-r.startedAt===60000&&r.cooldownUntil-r.activeUntil===600000,
      'invalid-observation','Invalid current native Game Speed receipt.');
    if(s.version===BOOST_VERSION&&r.revision<s.boostRevision)return null;
    let end=s.lastAt,total=0;
    for(const slice of p.slices){const k=dataKeys(slice);
      check(k.length===3&&k.every(x=>['fromAt','toAt','realMs'].includes(x))&&clock(slice.fromAt)&&clock(slice.toAt)&&slice.toAt>slice.fromAt&&
        slice.fromAt>=end&&slice.toAt<=now&&finiteClock(slice.realMs)&&slice.realMs>0&&slice.realMs<=2500&&
        Math.abs(slice.toAt-slice.fromAt-slice.realMs)<=64,'invalid-observation','An observed slice is stale, overlapping, unbounded or nonnative.');
      end=slice.toAt;total+=slice.realMs;check(total<=2500,'invalid-observation','One native budget exceeds2500real milliseconds.');
    }
    return p;
  }
  function walkBoost(s,from,to,beta) {
    let cursor=0,session=boostLeft(s,from).session>0;const total=to-from;
    // Fractional offsets stay inside the ORIGINAL integer UTC bracket. Never
    // feed epoch-rounded derived deadlines back into REAL bonus consumption.
    for(let phase=0;cursor<total&&phase<2;phase++) {
      const left=boostLeft(s,from),remaining=(session?left.session:left.cooldown)-cursor;
      if(remaining<=0)return;
      const required=remaining/(1+beta),span=Math.min(total-cursor,required),hit=required<=total-cursor;
      if(beta>0){if(session)s.sessionBonusMs+=beta*span;else s.cooldownBonusMs+=beta*span;}
      cursor+=span;
      if(!hit||!session)return;
      session=false;
    }
  }
  function settleBoost(r,s,old,now,bonusMs) {
    const oldW=old.version===BOOST_VERSION?boostNumbers(old).W:old.visibleMs;
    s.lastAt=now;const n=boostNumbers(s);s.creditedCents=Math.floor(n.W/TICK_MS);
    const awardedCents=s.creditedCents-old.creditedCents;
    if(awardedCents>0){r.money=addCents(r.money,awardedCents);r.stats.moneyEarned=addCents(r.stats.moneyEarned,awardedCents);}
    normalizeBoosted(s);r.passiveMoney=s;
    return {ok:true,changed:serializedBoost(s)!==serializedBoost(old),awardedCents,earnedMs:n.W-oldW,bonusMs,
      code:boostLeft(s,s.lastAt).session<=0?'settled':awardedCents?'earned':'accruing',sequence:s.sequence};
  }
  const serializedBoost=s=>JSON.stringify(s);
  function advanceBoosted(run,level,now,observation,context) {
    return boostCommand(run,level,now,context,(r,old)=>{
      if(!old)return {ok:true,changed:false,awardedCents:0,earnedMs:0,bonusMs:0,code:'idle'};
      if(old.version===BOOST_VERSION?old.pausedAt!==null:old.version===PAUSE_VERSION&&old.pausedAt!==null)
        return {ok:true,changed:false,awardedCents:0,earnedMs:0,bonusMs:0,code:'paused'};
      const proof=boostProof(observation,old,level,now),s=boostDraft(old),before=s.sessionBonusMs+s.cooldownBonusMs;
      if(proof)for(const p of proof.slices){
        const begin=Math.max(p.fromAt,proof.receipt.startedAt),end=Math.min(p.toAt,proof.receipt.activeUntil);
        if(end>begin)walkBoost(s,begin,end,0.5*p.realMs/(p.toAt-p.fromAt));
      }
      const bonusMs=s.sessionBonusMs+s.cooldownBonusMs-before;
      if(old.version!==BOOST_VERSION&&bonusMs===0){const p=pollElapsed(r,level,now,context);check(p.result.ok,p.result.code,p.result.reason);Object.assign(r,p.run);return {...p.result,bonusMs:0};}
      if(bonusMs>0)s.boostRevision=proof.receipt.revision;
      if(now===old.lastAt||old.version===BOOST_VERSION&&boostLeft(old,old.lastAt).cooldown<=0&&bonusMs===0)
        return {ok:true,changed:false,awardedCents:0,earnedMs:0,bonusMs:0,code:'ready'};
      return settleBoost(r,s,old,now,bonusMs);
    });
  }
  function pollElapsedAny(run,level,now,context) {return isBoosted(Object.getOwnPropertyDescriptor(run||{},'passiveMoney')?.value)?advanceBoosted(run,level,now,undefined,context):pollElapsed(run,level,now,context);}
  function setPausedElapsedAny(run,level,now,paused,context) {
    if(!isBoosted(Object.getOwnPropertyDescriptor(run||{},'passiveMoney')?.value))return setPausedElapsed(run,level,now,paused,context);
    return boostCommand(run,level,now,context,(r,old)=>{
      check(typeof paused==='boolean','invalid-observation','Supply an explicit boolean pause.');
      const was=old.pausedAt!==null;
      if(was===paused)return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:was?'paused':'unchanged'};
      if(was){const s=copyData(old),gap=now-s.pausedAt;
        if(boostLeft(s,s.pausedAt).session>0)s.sessionPausedMs+=gap;else s.cooldownPausedMs+=gap;
        s.pausedAt=null;s.lastAt=now;normalizeBoosted(s);r.passiveMoney=s;
        return {ok:true,changed:true,awardedCents:0,earnedMs:0,code:'resumed',sequence:s.sequence};}
      const folded=pollElapsedAny(r,level,now,context);check(folded.result.ok,folded.result.code,folded.result.reason);Object.assign(r,folded.run);
      const s=normalizeBoosted(r.passiveMoney);if(boostLeft(s,now).cooldown<=0)return folded.result;
      s.pausedAt=now;s.lastAt=now;normalizeBoosted(s);r.passiveMoney=s;return {...folded.result,changed:true,code:'paused'};
    });
  }
  function startElapsedAny(run,level,now,options,context) {
    if(!isBoosted(Object.getOwnPropertyDescriptor(run||{},'passiveMoney')?.value))return startElapsed(run,level,now,options,context);
    const folded=pollElapsedAny(run,level,now,context);if(!folded.result.ok)return folded;
    const out=boostCommand(folded.run,level,now,context,(r,s,tier)=>{
      check(options===undefined||(dataKeys(options).length===1&&own(options,'pauseClock')&&typeof options.pauseClock==='boolean'),'invalid-options','Supply only an explicit boolean pauseClock option.');
      const state=viewBoosted(r,s,level,now,context);check(state.ready,state.paused?'paused':state.active?'active':'cooldown','This session is active, paused or still cooling down.');
      check(s.sequence<MAX_TIME,'sequence-overflow','Passive Money sequence cannot safely advance.');
      check(now<=MAX_TIME-tier.durationMs-tier.cooldownMs,'clock-overflow','The captured session deadlines would overflow.');
      r.passiveMoney={version:VERSION,sequence:s.sequence+1,startedAt:now,endsAt:now+tier.durationMs,durationMs:tier.durationMs,
        cooldownMs:tier.cooldownMs,cooldownEndsAt:now+tier.durationMs+tier.cooldownMs,lastAt:now,visibleMs:0,creditedCents:0,settled:false};
      if(options&&options.pauseClock)Object.assign(r.passiveMoney,{version:PAUSE_VERSION,pausedAt:null,pausedMs:0});
      return {ok:true,changed:true,awardedCents:folded.result.awardedCents,earnedMs:folded.result.earnedMs,code:'started',sequence:s.sequence+1};
    });
    return out.result.ok?out:{run,result:out.result};
  }
  return Object.freeze({VERSION,PAUSE_VERSION,BOOST_VERSION,BOOST_FIELDS,UNLOCK_LEVEL,TICK_MS,MAX_TIME,PHASES,STATE_FIELDS,PAUSE_STATE_FIELDS,create:start,start,poll,setPaused,
    pollElapsed:pollElapsedAny,startElapsed:startElapsedAny,setPausedElapsed:setPausedElapsedAny,status:statusAny,normalize:normalizeAny,validate:validateAny,advanceBoosted,tierForLevel,copyData});
}));
