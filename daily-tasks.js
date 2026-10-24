/* Daily Tasks: five automatic 20-Medal rewards per Atlantic/Canary date.
 * Pure UMD/CJS model: no game/DOM/storage mutation, RNG or ambient clock.
 * now is REQUIRED (epoch-ms integer or valid Date); observation.at is epoch-ms.
 * Depends only on BODailyStreak's pure Canary calendar projection.
 *
 * State v1: {version, revision, earnedMedalsHalf, days, cursors}.
 * days[YYYY-MM-DD] = {progress:{taskId:number}, paid:{taskId:boolean}}.
 * cursors[runId] = {handsPlayed,cardsPlayed,moneyEarned,blindsWon,tarotsUsed}.
 * The TASK-ONLY lifetime bank is exact half-Medals; never transfer another bank.
 * Only null/undefined state initializes. Corruption/overflow throws atomically.
 *
 * Keep current + 89 previous calendar dates for failed-write receipt recovery.
 * Older/future receipts reject; current-day anchors prevent clock rollback from
 * resurrecting pruned paid flags. Global run highwaters NEVER expire: deleting
 * them would let an old SAVE earn again under a new date. At 10,000 unique runs,
 * new run IDs fail closed (existing runs and all bank/history remain usable).
 * Hosts must persist the ENTIRE returned state atomically and replay pending
 * canonical receipts in action order, retaining their ORIGINAL at timestamp.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./daily-streak'));
  else if (typeof define === 'function' && define.amd) define(['./daily-streak'], factory);
  else root.BODailyTasks = factory(root.BODailyStreak);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Calendar) {
  'use strict';
  if (!Calendar || typeof Calendar.info !== 'function') throw new TypeError('Daily Tasks requires BODailyStreak calendar.');
  const VERSION = 1, REWARD_HALF = 40, KEEP_DAYS = 90, MAX_RUNS = 10000, MAX_INTEGER = Number.MAX_SAFE_INTEGER;
  const COUNTERS = ['handsPlayed', 'cardsPlayed', 'moneyEarned', 'blindsWon', 'tarotsUsed'];
  const DEFINITIONS = [
    {id: 'hand-score', choices: [10000], counter: null},
    {id: 'cards-played', choices: [300, 350, 400, 450, 500], counter: 'cardsPlayed'},
    {id: 'money-earned', choices: [100, 125, 150, 175, 200], counter: 'moneyEarned'},
    {id: 'blinds-won', choices: [3, 4, 5], counter: 'blindsWon'},
    {id: 'tarots-used', choices: [2, 3, 4, 5], counter: 'tarotsUsed'}
  ];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function object(value, context) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError('Daily Tasks ' + context + ' must be a plain data object.');
    }
    // Accept normal/cross-realm JSON objects and null-prototype data maps, but
    // never reinterpret Date/Map/Set/class instances as empty saved history.
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== null && Object.getPrototypeOf(prototype) !== null) {
      throw new TypeError('Daily Tasks ' + context + ' must be a plain data object.');
    }
    return value;
  }
  function field(value, key, context) {
    object(value, context);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !own(descriptor, 'value')) throw new TypeError('Daily Tasks ' + context + ' requires own data field ' + key + '.');
    return descriptor.value;
  }
  function optional(value, key, fallback, context) {
    return own(value, key) ? field(value, key, context) : fallback;
  }
  function put(map, key, value) {
    Object.defineProperty(map, key, {value: value, enumerable: true, writable: true, configurable: true});
  }
  function count(value, context) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Daily Tasks ' + context + ' must be a nonnegative safe integer.');
    return value;
  }
  function amount(value, context) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new RangeError('Daily Tasks ' + context + ' must be a finite nonnegative number.');
    }
    return value;
  }
  function identifier(value) {
    if (typeof value !== 'string' || !value.trim().length || value.length > 1024) {
      throw new TypeError('Daily Tasks runId must be a nonempty string of at most 1024 characters.');
    }
    return value;
  }
  function ordinal(key) {
    if (typeof key !== 'string' || key.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      throw new TypeError('Daily Tasks date must be a real YYYY-MM-DD day.');
    }
    const y = Number(key.slice(0, 4)), m = Number(key.slice(5, 7)), d = Number(key.slice(8, 10));
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    const length = m === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31;
    if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > length) throw new RangeError('Daily Tasks date must be a real YYYY-MM-DD day.');
    const previous = y - 1, starts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    return previous * 365 + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400) +
      starts[m - 1] + (m > 2 && leap ? 1 : 0) + d - 1;
  }
  function clock(now, receipt) {
    let stamp = now;
    if (!receipt && typeof now === 'object' && now !== null) {
      try { stamp = Date.prototype.getTime.call(now); }
      catch (_) { throw new TypeError('Daily Tasks now must be an explicit timestamp or valid Date.'); }
    }
    if (!Number.isSafeInteger(stamp) || Math.abs(stamp) > 8640000000000000) {
      throw new RangeError('Daily Tasks ' + (receipt ? 'observation.at' : 'now') + ' must be an explicit valid epoch-ms timestamp.');
    }
    const day = Calendar.info(null, stamp).today;
    return {stamp: stamp, day: day, ordinal: ordinal(day)};
  }
  // FNV-1a over fixed namespace + canonical date + task ID. No engine RNG.
  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
    return value >>> 0;
  }
  function target(day, definition) {
    return definition.choices[hash('daily-tasks-v1|' + day + '|' + definition.id) % definition.choices.length];
  }
  function label(id, goal) {
    if (id === 'hand-score') return 'Score 10,000 in one hand';
    if (id === 'cards-played') return 'Play ' + goal + ' cards';
    if (id === 'money-earned') return 'Earn $' + goal;
    if (id === 'blinds-won') return 'Win ' + goal + ' Blinds';
    return 'Use ' + goal + ' Tarot cards';
  }
  function emptyDay() {
    const record = {progress: {}, paid: {}};
    DEFINITIONS.forEach(definition => { record.progress[definition.id] = 0; record.paid[definition.id] = false; });
    return record;
  }
  function create() {
    return {version: VERSION, revision: 0, earnedMedalsHalf: 0, days: {}, cursors: {}};
  }
  function copyCounters(value, context) {
    object(value, context);
    const out = {};
    COUNTERS.forEach(key => {
      const current = field(value, key, context);
      out[key] = key === 'moneyEarned' ? amount(current, context + '.' + key) : count(current, context + '.' + key);
    });
    return out;
  }
  function normalize(value) {
    if (value === undefined || value === null) return create();
    object(value, 'state');
    if (field(value, 'version', 'state') !== VERSION) throw new TypeError('Unsupported Daily Tasks state version.');
    const out = create();
    out.revision = count(field(value, 'revision', 'state'), 'revision');
    out.earnedMedalsHalf = count(field(value, 'earnedMedalsHalf', 'state'), 'earnedMedalsHalf bank');
    if (out.earnedMedalsHalf % REWARD_HALF !== 0) throw new RangeError('Daily Tasks lifetime bank must contain whole task rewards.');
    const days = object(field(value, 'days', 'state'), 'days'), dates = Object.getOwnPropertyNames(days);
    if (dates.length > KEEP_DAYS) throw new RangeError('Daily Tasks history exceeds 90 days.');
    let earliest = Infinity, latest = -Infinity, paidCount = 0;
    dates.forEach(day => {
      const index = ordinal(day); earliest = Math.min(earliest, index); latest = Math.max(latest, index);
      const saved = field(days, day, 'days'), progress = object(field(saved, 'progress', 'day'), 'progress');
      const paid = object(field(saved, 'paid', 'day'), 'paid'), record = emptyDay();
      DEFINITIONS.forEach(definition => {
        const id = definition.id, goal = target(day, definition), current = field(progress, id, 'progress');
        if (id === 'cards-played' || id === 'blinds-won' || id === 'tarots-used') count(current, 'progress.' + id);
        else amount(current, 'progress.' + id);
        if (current > goal) throw new RangeError('Daily Tasks progress exceeds its target.');
        const isPaid = field(paid, id, 'paid');
        if (typeof isPaid !== 'boolean' || isPaid !== (current >= goal)) {
          throw new RangeError('Daily Tasks completion and automatic paid flag must agree.');
        }
        record.progress[id] = current; record.paid[id] = isPaid;
        if (isPaid) paidCount++;
      });
      put(out.days, day, record);
    });
    if (latest - earliest >= KEEP_DAYS) throw new RangeError('Daily Tasks history must fit a 90-calendar-day window.');
    if (out.earnedMedalsHalf < paidCount * REWARD_HALF) throw new RangeError('Daily Tasks lifetime bank is below its saved paid rewards.');
    const cursors = object(field(value, 'cursors', 'state'), 'cursors'), ids = Object.getOwnPropertyNames(cursors);
    if (ids.length > MAX_RUNS) throw new RangeError('Daily Tasks run cursor capacity exceeds 10000.');
    ids.forEach(id => { identifier(id); put(out.cursors, id, copyCounters(field(cursors, id, 'cursors'), 'cursor')); });
    return out;
  }
  function info(state, now) {
    const copied = normalize(state), day = clock(now, false).day;
    const record = own(copied.days, day) ? copied.days[day] : emptyDay();
    return {day: day, tasks: DEFINITIONS.map(definition => {
      const id = definition.id, goal = target(day, definition), progress = record.progress[id];
      return {id: id, label: label(id, goal), target: goal, progress: progress,
        completed: progress >= goal, paid: record.paid[id], rewardHalf: REWARD_HALF};
    }), earnedMedalsHalf: copied.earnedMedalsHalf};
  }
  function receipt(observation) {
    object(observation, 'observation');
    const runId = identifier(field(observation, 'runId', 'observation'));
    const at = clock(field(observation, 'at', 'observation'), true);
    const rawBefore = field(observation, 'before', 'observation'), rawAfter = field(observation, 'after', 'observation');
    const before = copyCounters(rawBefore, 'before'), after = copyCounters(rawAfter, 'after');
    COUNTERS.forEach(key => { if (after[key] < before[key]) throw new RangeError('Daily Tasks observation counter went backwards: ' + key + '.'); });
    if (own(rawBefore, 'handScore')) amount(field(rawBefore, 'handScore', 'before'), 'before.handScore');
    after.handScore = amount(field(rawAfter, 'handScore', 'after'), 'after.handScore');
    return {runId: runId, at: at, before: before, after: after};
  }
  function result(state, ok, code, newlyCompleted) {
    const completed = newlyCompleted || [];
    return {ok: ok, code: code, state: state, newlyCompleted: completed, awardedHalf: completed.length * REWARD_HALF};
  }
  function observe(state, observation, now) {
    const copied = normalize(state), current = clock(now, false), event = receipt(observation);
    if (event.at.stamp > current.stamp) return result(copied, false, 'future-observation');
    const dates = Object.keys(copied.days).sort(), latest = dates.length ? dates[dates.length - 1] : null;
    if (latest !== null && ordinal(latest) > current.ordinal) return result(copied, false, 'clock-rollback');
    if (event.at.ordinal < current.ordinal - (KEEP_DAYS - 1)) return result(copied, false, 'stale-observation');
    const known = own(copied.cursors, event.runId), seen = known ? copied.cursors[event.runId] : event.before;
    if (!known && Object.keys(copied.cursors).length >= MAX_RUNS) return result(copied, false, 'cursor-capacity');
    const delta = {}, nextCursor = {};
    let changed = !known;
    COUNTERS.forEach(key => {
      delta[key] = Math.max(0, event.after[key] - Math.max(event.before[key], seen[key]));
      nextCursor[key] = Math.max(seen[key], event.after[key]);
      if (nextCursor[key] !== seen[key]) changed = true;
    });
    // Do not turn duplicate receipts, lastResult reads or a day-rollover query
    // into a write. New baselines DO advance the highwater without retro-credit.
    if (!changed) return result(copied, true, 'duplicate');
    if (copied.revision === MAX_INTEGER) throw new RangeError('Daily Tasks revision overflow.');
    Object.keys(copied.days).forEach(day => { if (ordinal(day) < current.ordinal - (KEEP_DAYS - 1)) delete copied.days[day]; });
    if (!own(copied.days, current.day)) put(copied.days, current.day, emptyDay());
    if (!own(copied.days, event.at.day)) put(copied.days, event.at.day, emptyDay());
    const record = copied.days[event.at.day], completed = [];
    DEFINITIONS.forEach(definition => {
      const id = definition.id, goal = target(event.at.day, definition);
      if (definition.counter) {
        // Clamp before adding: legitimate engine totals can be as large as 1e300.
        record.progress[id] = Math.min(goal, record.progress[id] + Math.min(goal, delta[definition.counter]));
      } else if (delta.handsPlayed > 0) {
        // An actual new hand receipt only; never cumulative score or old result.
        record.progress[id] = Math.max(record.progress[id], Math.min(goal, event.after.handScore));
      }
      if (!record.paid[id] && record.progress[id] >= goal) { record.paid[id] = true; completed.push(id); }
    });
    const award = completed.length * REWARD_HALF;
    if (copied.earnedMedalsHalf > MAX_INTEGER - award) throw new RangeError('Daily Tasks lifetime Medals bank overflow.');
    copied.earnedMedalsHalf += award;
    copied.revision++;
    put(copied.cursors, event.runId, nextCursor);
    return result(copied, true, 'observed', completed);
  }
  function capture(run) {
    if (run === undefined || run === null) return null;
    object(run, 'run');
    const runId = identifier(field(run, '_uiId', 'run'));
    const stats = object(optional(run, 'stats', {}, 'run'), 'run.stats');
    const lastResult = object(optional(run, 'lastResult', {}, 'run'), 'run.lastResult');
    const values = {};
    COUNTERS.forEach(key => {
      const raw = key === 'tarotsUsed' ? optional(run, key, 0, 'run') : optional(stats, key, 0, 'run.stats');
      values[key] = key === 'moneyEarned' ? amount(raw, 'run.stats.' + key) : count(raw, 'run.' + key);
    });
    values.handScore = amount(optional(lastResult, 'total', 0, 'lastResult'), 'lastResult.total');
    return Object.freeze({runId: runId, metrics: Object.freeze(values)});
  }
  return Object.freeze({create: create, normalize: normalize, info: info, observe: observe, capture: capture});
}));
