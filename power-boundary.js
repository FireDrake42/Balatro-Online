/* Pure synchronous injected policy-boundary orchestrator. NO canonical writer,
 * storage, model dependencies, timers, clocks, DOM, snapshots or rollback.
 *
 * BOPowerBoundary.create(host) -> frozen {run(action), status()}.
 * All callbacks are synchronous and mutators return own-data {ok:true,...}, or
 * {ok:false,definite:true,...} ONLY for proven prewrite validation refusal.
 * xpPaused() alone returns a strict boolean from ACTUAL policy, ignoring hold.
 *
 * Required host: preflight(), hold(boolean), interestPause(boolean), syncMoney(),
 * flushBattery(), syncXp(boolean), xpPaused(), resetBattery(), pause(Error).
 * hold ONLY assigns an idempotent parent transient flag, with no model/write.
 * Parent retains every existing owner/raw/revision/readback/global guard and
 * normalizes absent-session/ineligible controller no-ops to confirmed success.
 * Parent proves definite action refusal against POST-checkpoint owned data,
 * not stale pre-battery/pre-XP snapshots. Never infer attempt certainty here.
 *
 * Any uncertainty is permanent; no reset/resume/unpause API. After a release or
 * unconfirmed hold, ONE best-effort control-only hold(true) reassertion precedes
 * global pause. This is not a model/write retry. Host pause failure cannot clear
 * the local latch. Reload/recovery remains the parent's guarded responsibility.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BOPowerBoundary = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const REQUIRED = ['preflight','hold','interestPause','syncMoney','flushBattery','syncXp','xpPaused','resetBattery','pause'];
  // Descriptor-only protocol checks never call then(), await, or invoke result
  // getters. Extra result data is opaque: never enumerate/clone/freeze it.
  function resultKind(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return 'unknown';
    // Ordinary records only (including null-prototype/cross-realm records).
    // Reject Promise/exotic prototypes even with own ok:true/then:null.
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== null && Object.getPrototypeOf(prototype) !== null) return 'unknown';
    let cursor = value, depth = 0;
    while (cursor !== null) {
      if (++depth > 64) return 'unknown';
      const then = Object.getOwnPropertyDescriptor(cursor, 'then');
      if (then) {
        if (!Object.prototype.hasOwnProperty.call(then, 'value') || typeof then.value === 'function') return 'unknown';
        break;
      }
      cursor = Object.getPrototypeOf(cursor);
    }
    const ok = Object.getOwnPropertyDescriptor(value, 'ok');
    if (!ok || !Object.prototype.hasOwnProperty.call(ok, 'value')) return 'unknown';
    if (ok.value === true) return 'ok';
    if (ok.value !== false) return 'unknown';
    const definite = Object.getOwnPropertyDescriptor(value, 'definite');
    return definite && Object.prototype.hasOwnProperty.call(definite, 'value') && definite.value === true ? 'definite' : 'unknown';
  }
  function create(host) {
    if (!host || !['object','function'].includes(typeof host)) throw new TypeError('A synchronous power-boundary host is required.');
    const fn = Object.create(null);
    for (const name of REQUIRED) {
      const callback = host[name];
      if (typeof callback !== 'function') throw new TypeError('Missing synchronous power-boundary host.' + name);
      fn[name] = callback;
    }
    let busy = false, held = false, holdConfirmed = true, uncertain = false;
    let stage = 'idle', code = 'idle', reason = '', pauseAttempted = false, globalPauseConfirmed = false;
    function status() { return Object.freeze({busy,held,holdConfirmed,uncertain,stage,code,reason,pauseAttempted,globalPauseConfirmed}); }
    function fault(at, value, definite, cause) { return {stage:at,value,definite,cause}; }
    function step(name, args = []) {
      stage = name;
      if (name === 'hold') { held = args[0]; holdConfirmed = false; }
      let value, kind;
      try { value = fn[name].apply(host, args); kind = resultKind(value); }
      catch (cause) { throw fault(name, value, false, cause); }
      if (kind !== 'ok') throw fault(name, value, name !== 'hold' && kind === 'definite');
      if (name === 'hold') holdConfirmed = true;
      return value;
    }
    function actualXpPaused() {
      stage = 'xpPaused';
      let value;
      try { value = fn.xpPaused.call(host); }
      catch (cause) { throw fault('xpPaused', value, false, cause); }
      if (typeof value !== 'boolean') throw fault('xpPaused', value, false);
      return value;
    }
    function finish() {
      // XP must close its skipped interval under hold, using verified ACTUAL
      // policy. Releasing the transient flag is NOT a command to bypass policy.
      step('syncXp', [actualXpPaused()]);
      step('hold', [false]);
      step('syncMoney');
      step('interestPause', [false]);
      step('resetBattery');
    }
    function blocked() { return {ok:false,code:'uncertain',uncertain:true,held:true,holdConfirmed,stage,reason}; }
    function latch(failure, actionResult, actionConfirmed) {
      uncertain = true; code = 'uncertain'; stage = failure.stage;
      reason = 'Power change is unconfirmed at ' + stage + '. Keep saved data; reload safely. Do not retry or roll back.';
      const reassert = !held || !holdConfirmed;
      held = true;
      if (reassert) {
        holdConfirmed = false;
        try { holdConfirmed = resultKind(fn.hold.call(host, true)) === 'ok'; } catch (_) {}
      }
      const error = new Error(reason);
      error.code = 'power-uncertain'; error.stage = stage;
      error.cause = failure.cause === undefined ? failure.value : failure.cause;
      if (!pauseAttempted) {
        pauseAttempted = true;
        try { globalPauseConfirmed = resultKind(fn.pause.call(host, error)) === 'ok'; } catch (_) {}
      }
      return {...blocked(),result:actionResult,actionConfirmed,failure:failure.value};
    }
    function run(action) {
      if (uncertain) return blocked();
      if (busy) return {ok:false,code:'busy',definite:true,stage,reason:'A power change is already in progress.'};
      if (typeof action !== 'function') return {ok:false,code:'refused',definite:true,stage:'action',reason:'A synchronous guarded policy action is required.'};
      busy = true;
      let actionResult, actionConfirmed = false;
      try {
        // Preflight is nonwriting, before any boundary. Even throw/Promise is a
        // refusal here, not an excuse to acquire a hold or invoke global pause.
        try { step('preflight'); }
        catch (failure) { code = 'refused'; reason = 'Power change preflight was not confirmed.'; return {ok:false,code,definite:true,stage:'preflight',reason,failure:failure.value}; }
        try {
          step('hold', [true]);
          step('interestPause', [true]);
          step('syncMoney');
          step('flushBattery');
          step('syncXp', [true]);
          stage = 'action';
          let kind;
          try { actionResult = action(); kind = resultKind(actionResult); }
          catch (cause) { throw fault('action', actionResult, false, cause); }
          if (kind !== 'ok') throw fault('action', actionResult, kind === 'definite');
          actionConfirmed = true;
          finish();
          code = 'committed'; reason = '';
          return {ok:true,code,result:actionResult};
        } catch (failure) {
          // Only pre-action/PROVEN pre-policy-write validation may clean up.
          // After action success, ANY resume failure latches, even "definite".
          if (failure.definite && !actionConfirmed) {
            try { finish(); }
            catch (cleanupFailure) { return latch(cleanupFailure, actionResult, actionConfirmed); }
            code = 'refused'; reason = 'Power policy validation refused before a policy write; confirmed checkpoints were retained.';
            return {ok:false,code,definite:true,stage:failure.stage,reason,result:actionResult,failure:failure.value};
          }
          return latch(failure, actionResult, actionConfirmed);
        }
      } finally {
        busy = false;
        if (!uncertain) stage = 'idle';
      }
    }
    return Object.freeze({run,status});
  }
  return Object.freeze({create});
}));
