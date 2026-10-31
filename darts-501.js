/* Pure 501, straight-in/double-out. Whole visits; no host services or rewards. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BODarts501 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // [A1] Exact inert-data schemas and declared semantic darts.
  const VERSION = 1;
  const MAX = Number.MAX_SAFE_INTEGER;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const actor = x => x === 'player' || x === 'emerald';
  const other = x => x === 'player' ? 'emerald' : 'player';
  const count = x => Number.isSafeInteger(x) && x >= 0 && !Object.is(x, -0);
  const activeScore = x => Number.isSafeInteger(x) && x >= 2 && x <= 501;
  function check(ok, code) { if (!ok) throw new Error(code); }
  function record(o) {
    return o !== null && typeof o === 'object' &&
      (Object.getPrototypeOf(o) === Object.prototype || Object.getPrototypeOf(o) === null);
  }
  function fields(o, keys) {
    if (!record(o) || Reflect.ownKeys(o).length !== keys.length) return false;
    return keys.every(k => {
      const d = Object.getOwnPropertyDescriptor(o, k);
      return d && own(d, 'value') && d.enumerable === true;
    });
  }
  function dense(a, min, max) {
    if (!Array.isArray(a) || Object.getPrototypeOf(a) !== Array.prototype) return false;
    const length = Object.getOwnPropertyDescriptor(a, 'length');
    if (!length || !own(length, 'value') || !Number.isInteger(length.value) ||
        length.value < min || length.value > max ||
        Reflect.ownKeys(a).length !== length.value + 1) return false;
    for (let i = 0; i < length.value; i++) {
      const d = Object.getOwnPropertyDescriptor(a, String(i));
      if (!d || !own(d, 'value') || d.enumerable !== true) return false;
    }
    return true;
  }
  function validateDart(d) {
    try {
      if (!record(d)) return false;
      const tag = Object.getOwnPropertyDescriptor(d, 'kind');
      if (!tag || !own(tag, 'value') || tag.enumerable !== true) return false;
      if (tag.value === 'number') {
        return fields(d, ['kind', 'number', 'multiplier']) &&
          Number.isInteger(d.number) && d.number >= 1 && d.number <= 20 &&
          Number.isInteger(d.multiplier) && d.multiplier >= 1 && d.multiplier <= 3;
      }
      return fields(d, ['kind']) &&
        ['miss', 'outer-bull', 'inner-bull'].includes(tag.value);
    } catch (_) { return false; }
  }
  function points(d) {
    if (d.kind === 'miss') return 0;
    if (d.kind === 'outer-bull') return 25;
    if (d.kind === 'inner-bull') return 50;
    return d.number * d.multiplier;
  }
  function double(d) {
    return d.kind === 'inner-bull' || d.kind === 'number' && d.multiplier === 2;
  }
  function scoreDart(d) {
    check(validateDart(d), 'DARTS_INVALID_DART');
    return points(d);
  }

  // [A2] Explicit constructor and bounded whole-visit envelope.
  function freeze(o) {
    for (const v of Object.values(o)) if (v !== null && typeof v === 'object') freeze(v);
    return Object.freeze(o);
  }
  function cloneDart(d) {
    return d.kind === 'number'
      ? {kind: 'number', number: d.number, multiplier: d.multiplier}
      : {kind: d.kind};
  }
  function create(firstThrower) {
    check(actor(firstThrower), 'DARTS_FIRST_THROWER_REQUIRED');
    return freeze({version: VERSION, firstThrower, revision: 0, turn: firstThrower,
      remaining: {player: 501, emerald: 501}, winner: null, lastVisit: null});
  }
  function validateVisit(v) {
    try {
      return fields(v, ['thrower', 'darts']) && actor(v.thrower) &&
        dense(v.darts, 1, 3) && v.darts.every(validateDart);
    } catch (_) { return false; }
  }

  // [A3] Canonical consumed prefix; no supplied unused dart is thrown.
  function settle(start, darts) {
    let left = start;
    for (let i = 0; i < darts.length; i++) {
      left -= points(darts[i]);
      if (left < 0) return {end: start, result: 'bust-negative', used: i + 1};
      if (left === 1) return {end: start, result: 'bust-one', used: i + 1};
      if (left === 0) return double(darts[i])
        ? {end: 0, result: 'checkout', used: i + 1}
        : {end: start, result: 'bust-non-double', used: i + 1};
    }
    return {end: left, result: 'scored', used: darts.length};
  }
  function actorAt(first, zeroBasedVisit) {
    return zeroBasedVisit % 2 === 0 ? first : other(first);
  }
  function visitsFor(first, who, completed) {
    return Math.floor(completed / 2) + (who === first && completed % 2 === 1 ? 1 : 0);
  }
  function minDarts(total) {
    // Fresh bounded local DP, not a hidden mutable cache or game history.
    const scores = [25, 50];
    for (let n = 1; n <= 20; n++) for (let m = 1; m <= 3; m++) scores.push(n * m);
    const dp = Array(total + 1).fill(Infinity);
    dp[0] = 0;
    for (let t = 1; t <= total; t++) {
      for (const p of scores) if (p <= t) dp[t] = Math.min(dp[t], dp[t - p] + 1);
    }
    return dp[total];
  }
  function reachable(score, visits) {
    return activeScore(score) && visits >= Math.ceil(minDarts(501 - score) / 3);
  }
  function validate(s) {
    try {
      if (!fields(s, ['version', 'firstThrower', 'revision', 'turn', 'remaining',
                      'winner', 'lastVisit']) || s.version !== VERSION ||
          !actor(s.firstThrower) || !count(s.revision) || !actor(s.turn) ||
          !(s.winner === null || actor(s.winner)) ||
          !fields(s.remaining, ['player', 'emerald'])) return false;
      if (![s.remaining.player, s.remaining.emerald].every(x =>
          count(x) && x <= 501 && x !== 1)) return false;
      if (s.revision === 0) return s.turn === s.firstThrower && s.winner === null &&
        s.lastVisit === null && s.remaining.player === 501 && s.remaining.emerald === 501;
      const v = s.lastVisit;
      if (!fields(v, ['thrower', 'start', 'darts', 'result']) ||
          v.thrower !== actorAt(s.firstThrower, s.revision - 1) || !activeScore(v.start) ||
          !dense(v.darts, 1, 3) || !v.darts.every(validateDart)) return false;
      const r = settle(v.start, v.darts);
      if (r.used !== v.darts.length || r.result !== v.result ||
          s.remaining[v.thrower] !== r.end) return false;
      const opponent = other(v.thrower), before = s.revision - 1;
      if (!reachable(v.start, visitsFor(s.firstThrower, v.thrower, before)) ||
          !reachable(s.remaining[opponent], visitsFor(s.firstThrower, opponent, before))) {
        return false;
      }
      return r.result === 'checkout'
        ? s.winner === v.thrower && s.turn === v.thrower
        : s.winner === null && s.turn === opponent;
    } catch (_) { return false; }
  }

  // [A4] Immutable reducer. Revision is visits, not reward/source authentication.
  function reduce(s, v, expectedRevision) {
    check(validate(s), 'DARTS_INVALID_STATE');
    check(count(expectedRevision) && expectedRevision === s.revision, 'DARTS_STALE_REVISION');
    check(s.revision < MAX, 'DARTS_REVISION_CAPACITY');
    check(s.winner === null, 'DARTS_LEG_COMPLETE');
    check(validateVisit(v), 'DARTS_INVALID_VISIT');
    check(v.thrower === s.turn, 'DARTS_WRONG_TURN');
    const r = settle(s.remaining[v.thrower], v.darts);
    const winner = r.result === 'checkout' ? v.thrower : null;
    const remaining = {player: s.remaining.player, emerald: s.remaining.emerald};
    remaining[v.thrower] = r.end;
    const darts = v.darts.slice(0, r.used).map(cloneDart);
    const next = {version: VERSION, firstThrower: s.firstThrower, revision: s.revision + 1,
      turn: winner === null ? other(v.thrower) : winner, remaining, winner,
      lastVisit: {thrower: v.thrower, start: s.remaining[v.thrower], darts, result: r.result}};
    check(validate(next), 'DARTS_INVALID_TRANSITION');
    return freeze(next);
  }
  return Object.freeze({VERSION, validateDart, scoreDart, create, validateVisit, validate, reduce});
});
