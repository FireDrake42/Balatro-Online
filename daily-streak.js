/* Daily Streak: independent Medals balance, in exact half-Medal integers.
 * Pure API: no DOM, storage, RNG, dependencies, or ambient clock.
 * info/checkIn REQUIRE now: a safe-integer epoch-millisecond timestamp or a
 * valid Date (including cross-realm Dates). The resulting Atlantic/Canary
 * Gregorian day must be within 0001-01-01..9999-12-31; no implicit default.
 * Only null/undefined state initializes. Corrupt state, invalid time and
 * bank/revision overflow throw without changing the caller's state.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.BODailyStreak = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_DAY = 90, MAX_INTEGER = Number.MAX_SAFE_INTEGER;
  const FIELDS = ['version', 'revision', 'streak', 'medalsHalf', 'lastClaimDay'];
  const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const dayFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Atlantic/Canary', calendar: 'gregory', numberingSystem: 'latn',
    era: 'short', year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function create() {
    return {version: 1, revision: 0, streak: 0, medalsHalf: 0, lastClaimDay: null};
  }
  function leapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  function calendarOrdinal(key) {
    if (typeof key !== 'string' || key.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      throw new TypeError('Daily Streak date must be a real YYYY-MM-DD day.');
    }
    const year = Number(key.slice(0, 4)), month = Number(key.slice(5, 7)), day = Number(key.slice(8, 10));
    const daysInMonth = month === 2 ? (leapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > daysInMonth) {
      throw new RangeError('Daily Streak date must be a real YYYY-MM-DD day.');
    }
    // Proleptic Gregorian ordinal, NOT elapsed milliseconds / 24 hours.
    // Arithmetic also avoids Date.UTC's special remapping of years 00..99.
    const previousYear = year - 1;
    return previousYear * 365 + Math.floor(previousYear / 4) - Math.floor(previousYear / 100) +
      Math.floor(previousYear / 400) + MONTH_STARTS[month - 1] + (month > 2 && leapYear(year) ? 1 : 0) + day - 1;
  }
  function normalize(value) {
    if (value === undefined || value === null) return create();
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError('Daily Streak state must be an object with all saved fields.');
    }
    const state = {};
    for (const key of FIELDS) {
      const field = Object.getOwnPropertyDescriptor(value, key);
      if (!field || !Object.prototype.hasOwnProperty.call(field, 'value')) {
        throw new TypeError('Daily Streak state requires its own data field: ' + key + '.');
      }
      state[key] = field.value;
    }
    if (state.version !== 1) throw new TypeError('Unsupported Daily Streak state version.');
    if (!Number.isSafeInteger(state.revision) || state.revision < 0) {
      throw new RangeError('Daily Streak revision must be a nonnegative safe integer.');
    }
    if (!Number.isSafeInteger(state.medalsHalf) || state.medalsHalf < 0) {
      throw new RangeError('Daily Streak Medals bank must be a nonnegative safe integer.');
    }
    if (!Number.isInteger(state.streak) || state.streak < 0 || state.streak > MAX_DAY) {
      throw new RangeError('Daily Streak streak must be an integer in 0..90.');
    }
    if (state.streak === 0) {
      if (state.lastClaimDay !== null) throw new RangeError('Day-zero streak must have a null last claim date.');
    } else {
      calendarOrdinal(state.lastClaimDay);
    }
    return state;
  }
  function todayFrom(now) {
    let stamp = now;
    if (typeof now === 'object' && now !== null) {
      try { stamp = Date.prototype.getTime.call(now); }
      catch (_) { throw new TypeError('Daily Streak now must be a timestamp or valid Date.'); }
    }
    if (!Number.isSafeInteger(stamp) || Math.abs(stamp) > 8640000000000000) {
      throw new RangeError('Daily Streak time must be an explicit safe-integer timestamp or valid Date.');
    }
    const parts = {};
    dayFormatter.formatToParts(stamp).forEach(function (part) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    });
    const year = Number(parts.year);
    if (parts.era !== 'AD' || year < 1 || year > 9999) {
      throw new RangeError('Daily Streak clock must have a Canary calendar year in 0001..9999.');
    }
    const today = String(year).padStart(4, '0') + '-' + parts.month + '-' + parts.day;
    calendarOrdinal(today);
    return today;
  }
  function view(state, now) {
    const today = todayFrom(now);
    const gap = state.lastClaimDay === null ? null : calendarOrdinal(today) - calendarOrdinal(state.lastClaimDay);
    const clockRollback = gap !== null && gap < 0;
    const claimedToday = gap === 0;
    const missed = gap !== null && gap > 1;
    const day = missed ? 0 : state.streak;
    const nextDay = Math.min(day + 1, MAX_DAY);
    return {
      day: day, claimedToday: claimedToday, canCheckIn: !claimedToday && !clockRollback,
      nextDay: nextDay, nextRewardHalf: nextDay + 1, medalsHalf: state.medalsHalf,
      today: today, missed: missed, clockRollback: clockRollback
    };
  }
  function info(state, now) {
    return view(normalize(state), now);
  }
  function checkIn(state, now) {
    const copied = normalize(state), current = view(copied, now);
    if (!current.canCheckIn) {
      return {ok: false, code: current.clockRollback ? 'clock-rollback' : 'already-claimed',
        state: copied, day: current.day, rewardHalf: 0};
    }
    if (copied.medalsHalf > MAX_INTEGER - current.nextRewardHalf) {
      throw new RangeError('Daily Streak Medals bank overflow.');
    }
    if (copied.revision === MAX_INTEGER) throw new RangeError('Daily Streak revision overflow.');
    copied.revision++;
    copied.streak = current.nextDay;
    copied.medalsHalf += current.nextRewardHalf;
    copied.lastClaimDay = current.today;
    return {ok: true, code: 'claimed', state: copied, day: current.nextDay, rewardHalf: current.nextRewardHalf};
  }
  return Object.freeze({create: create, normalize: normalize, info: info, checkIn: checkIn});
}));
