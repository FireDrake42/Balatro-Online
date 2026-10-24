/* Frenzy: strict optional run-owned state, physical-score accounting, supplied clock only. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BOFrenzy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var MAX = 500, DURATION_MS = 10000, MAX_TIME = 8640000000000000-DURATION_MS;
  var FIELDS = ['version','revision','charge','startedAt','expiresAt','lastNow'];
  function check(ok, message) { if (!ok) throw new Error(message); }
  // Check descriptors BEFORE reading values: JSON cloning must not hide forged
  // accessors, symbols, non-enumerable fields, inherited records or undefined.
  function fields(value, allowed) {
    check(value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype, 'Invalid Frenzy record.');
    var keys = Reflect.ownKeys(value);
    check(keys.length === allowed.length && keys.every(function (key) {
      var d = Object.getOwnPropertyDescriptor(value,key);
      return typeof key === 'string' && allowed.indexOf(key) >= 0 && d.enumerable && Object.prototype.hasOwnProperty.call(d,'value');
    }), 'Invalid or unknown Frenzy fields.');
  }
  function clock(now) { check(Number.isSafeInteger(now) && now >= 0 && now <= MAX_TIME, 'Supply a valid Frenzy clock time.'); return now; }
  function level(actualLevel) { check(Number.isInteger(actualLevel) && actualLevel >= 1 && actualLevel <= 100, 'Supply the actual player level (1-100) for Frenzy.'); return actualLevel; }
  // MAX remains the v1 save-validation ceiling: never clamp/migrate old charge.
  function requirement(actualLevel) { return level(actualLevel) >= 35 ? 166 : MAX; }
  function create() { return {version:1,revision:0,charge:0,startedAt:null,expiresAt:null,lastNow:0}; }
  function normalize(value) {
    fields(value,FIELDS);
    check(value.version === 1, 'Invalid Frenzy version.');
    check(Number.isSafeInteger(value.revision) && value.revision >= 0, 'Invalid Frenzy revision.');
    check(Number.isInteger(value.charge) && value.charge >= 0 && value.charge < MAX, 'Invalid Frenzy charge.');
    clock(value.lastNow);
    if (value.startedAt === null || value.expiresAt === null) {
      check(value.startedAt === null && value.expiresAt === null, 'Invalid Frenzy activation pair.');
    } else {
      clock(value.startedAt);
      check(value.expiresAt === value.startedAt+DURATION_MS && value.lastNow >= value.startedAt && value.lastNow < value.expiresAt && value.charge === 0, 'Invalid Frenzy activation.');
    }
    check(value.revision !== 0 || value.charge === 0 && value.startedAt === null && value.lastNow === 0, 'Invalid fresh Frenzy state.');
    return {version:1,revision:value.revision,charge:value.charge,startedAt:value.startedAt,expiresAt:value.expiresAt,lastNow:value.lastNow};
  }
  function validate(value) { normalize(value); return true; }
  function context(value) {
    fields(value,['actualLevel','now']);
    return {actualLevel:level(value.actualLevel),now:clock(value.now)};
  }
  function view(s, actualLevel, now) {
    var eligible = actualLevel >= 33, active = eligible && s.startedAt !== null && now < s.expiresAt, required = requirement(actualLevel);
    var remaining = active ? s.expiresAt-now : 0, charge = eligible && s.startedAt === null?s.charge:0;
    return {eligible:eligible,active:active,charge:charge,meter:active?(required===MAX?remaining/20:remaining/DURATION_MS*required):Math.min(required,charge),max:required,requirement:required,meterMax:required,durationMs:DURATION_MS,remainingMs:remaining,multiplier:active?1.5:1,startedAt:s.startedAt,expiresAt:s.expiresAt,revision:s.revision};
  }
  function checked(value, actualLevel, now) {
    var s = value === undefined ? create() : normalize(value);
    level(actualLevel); clock(now);
    check(now >= s.lastNow, 'Frenzy clock cannot move backwards.');
    return s;
  }
  // Expiry is virtual during queries: no timer, reset, revision bump or write.
  function info(value, actualLevel, now) { return view(checked(value,actualLevel,now),actualLevel,now); }
  function commit(value, actualLevel, now, scoringTriggers) {
    var s = checked(value,actualLevel,now);
    check(Number.isSafeInteger(scoringTriggers) && scoringTriggers >= 0, 'Invalid physical Frenzy scoring-trigger count.');
    var before = view(s,actualLevel,now), charged = 0, activationTrigger = null;
    if (before.eligible && scoringTriggers > 0) {
      check(s.revision < Number.MAX_SAFE_INTEGER, 'Frenzy revision is exhausted.');
      if (!before.active) {
        // Expired overflow is deliberately discarded. A fresh scoring play may
        // begin charging, never resume or refill the old 10-second activation.
        if (s.startedAt !== null) { s.startedAt = null; s.expiresAt = null; s.charge = 0; }
        // An old valid 166..499 charge remains intact until a real score. Its
        // first trigger activates immediately, with no negative/phantom counts.
        charged = Math.min(scoringTriggers,Math.max(1,before.requirement-s.charge));
        s.charge += charged;
        if (s.charge >= before.requirement) { activationTrigger = charged; s.charge = 0; s.startedAt = now; s.expiresAt = now+DURATION_MS; }
      }
      s.lastNow = now;
      s.revision++;
    }
    var after = view(s,actualLevel,now);
    return {state:s,receipt:{eligible:after.eligible,now:now,scoringTriggers:scoringTriggers,charged:charged,ignored:scoringTriggers-charged,activationTrigger:activationTrigger,activated:activationTrigger !== null,active:after.active,meter:after.meter,requirement:after.requirement,meterMax:after.meterMax,remainingMs:after.remainingMs,multiplier:after.multiplier,startedAt:after.startedAt,expiresAt:after.expiresAt,revision:after.revision}};
  }
  return {MAX:MAX,DURATION_MS:DURATION_MS,requirement:requirement,create:create,normalize:normalize,validate:validate,context:context,info:info,commit:commit};
});
