/* Injected synchronous Passive Money commit controller; no listeners, timers,
 * startup writes, DOM, global clocks, audio or PROFILE writes. Parent wires its
 * existing heartbeat and calls resetObservation on visibility/eligibility
 * transitions (also before cloud/slot/run replacement).
 *
 * const c = BOPassiveMoneyController.create(host);
 * c.status(); c.start(); c.tick(); c.resetObservation(); c.destroy();
 * host: get()->{profile,run,level,page}, eligible()->boolean, assertWritable(),
 * stamp(), now()->Date.now integer, monotonic()->performance.now number,
 * read('run'|'profile'), ownRaw('run'|'profile'), write('run',wholeRun), pause(msg),
 * applyRun(next,result), changed(result) [optional], notify(msg) [optional].
 * All host operations must be synchronous. A write must update ownRaw to its
 * confirmed owned raw, exactly like the parent's existing whole-RUN writer.
 *
 * LIVE whole RUN is the proposal source. Owned durable raw must match its
 * id/phase/Bank/passive ledger; native-owned live potion/task/derived fields may
 * differ from that previous owned raw and are preserved, not deleted or reset.
 * Exact whole-live/profile snapshots and both durable raws fence every commit.
 * Any attempted uncertainty permanently latches this controller and calls
 * pause; never retry, roll back or apply money after an unconfirmed write.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./passive-money'));
  else root.BOPassiveMoneyController = factory(root.BOPassiveMoney);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';
  function check(ok, code, message) { if (!ok) { const error = new Error(message); error.code = code; throw error; } }
  function fail(code, reason) { return {ok:false,changed:false,awardedCents:0,earnedMs:0,code,reason}; }
  function stable(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
  }
  const serialized = value => JSON.stringify(M.copyData(value));
  const thenable = value => value !== null && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
  function create(host) {
    check(M && typeof M.poll === 'function', 'missing-model', 'The pure Passive Money model is required.');
    for (const key of ['get','eligible','assertWritable','stamp','now','monotonic','read','ownRaw','write','pause','applyRun'])
      check(host && typeof host[key] === 'function', 'invalid-host', 'Missing synchronous Passive Money host.' + key);
    let busy = false, destroyed = false, uncertain = false, epoch = 0, observation = null;
    function resetObservation() { epoch++; observation = null; }
    function guard() {
      check(!destroyed && !uncertain, uncertain ? 'uncertain' : 'destroyed', uncertain ? 'Saving is uncertain. Reload safely; do not retry or reset.' : 'This Passive Money controller was destroyed.');
      const allowed = host.assertWritable(); check(allowed !== false && !thenable(allowed), 'read-only', 'This save is not writable.');
      check(host.eligible() === true, 'ineligible', 'Only observable foreground eligible time earns Passive Money.');
    }
    function liveContext() {
      const c = host.get();
      check(c && c.profile && c.run && (c.page === 'game' || c.page === 'home'), 'ineligible-run', 'An eligible current origin run is required.');
      check(Number.isInteger(c.level) && c.level >= 40 && c.level <= 100, 'locked', 'Passive Money unlocks at actual player Level 40.');
      const source = M.copyData(c.run), profileJSON = serialized(c.profile);
      check(source.progressionEnabled === true && source.playerLevel === c.level,
        'unreconciled-level', 'The origin run actual player level is not durably reconciled yet.');
      const s = M.status(source, c.level, 0);
      check(s.ok && s.eligibleRun, s.code || 'ineligible-run', s.reason || 'An active, non-abandoned origin run is required.');
      return {...c,source,runJSON:JSON.stringify(source),profileJSON};
    }
    function verifyLive(c) {
      check(c.epoch === epoch && !destroyed && !uncertain, 'cancelled', 'This observation or action was cancelled.');
      const stamp = host.stamp(), live = liveContext();
      check(c.epoch === epoch && !destroyed && !uncertain && live.run === c.run && live.profile === c.profile &&
        live.level === c.level && live.page === c.page && live.source._uiId === c.id && stamp === c.stamp &&
        live.runJSON === c.runJSON && live.profileJSON === c.profileJSON,
        'context-changed', 'The whole live run, profile, actual level, owner or slot changed.');
      return live;
    }
    function sameContext(c) { guard(); return verifyLive(c); }
    function confirmedFence(c, runRaw = c.runRaw) {
      // The guard itself may discover ownership/slot changes. Re-read raws
      // AFTER it; then seal whole live data again in case a storage read hook
      // cancelled/replaced/mutated this context. Never overwrite a failed origin.
      sameContext(c); raws(c, runRaw); return verifyLive(c);
    }
    function raws(c, runRaw = c.runRaw) {
      check(host.read('profile') === c.profileRaw && host.ownRaw('profile') === c.profileRaw,
        'profile-changed', 'The owned durable profile changed outside this action.');
      check(host.read('run') === runRaw && host.ownRaw('run') === runRaw,
        'run-changed', 'The owned durable origin run changed outside this action.');
    }
    function capture() {
      const token = epoch; guard();
      const stamp = host.stamp(), live = liveContext();
      const c = {...live,id:live.source._uiId,stamp,epoch:token,runRaw:host.read('run'),profileRaw:host.read('profile')};
      check(typeof c.runRaw === 'string' && typeof c.profileRaw === 'string' &&
        c.runRaw === host.ownRaw('run') && c.profileRaw === host.ownRaw('profile'),
        'foreign-raw', 'The latest complete save is missing or was not written by this owner.');
      const durable = M.copyData(JSON.parse(c.runRaw));
      const durableState = M.normalize(durable.passiveMoney), liveState = M.normalize(c.source.passiveMoney);
      check(durable._uiId === c.id && durable.phase === c.source.phase && durable.money === c.source.money &&
        stable(durableState) === stable(liveState), 'durable-mismatch', 'The durable origin id, phase, Bank or Passive Money ledger is not reconciled.');
      sameContext(c); raws(c); sameContext(c); return c;
    }
    function clocks() {
      const now = host.now(), mono = host.monotonic();
      check(Number.isSafeInteger(now) && now >= 0 && now <= M.MAX_TIME, 'invalid-time', 'Invalid absolute clock.');
      check(typeof mono === 'number' && Number.isFinite(mono) && mono >= 0 && mono <= M.MAX_TIME, 'invalid-monotonic', 'Invalid observable monotonic clock.');
      return {now,mono};
    }
    function identify(c, now, mono, pending) {
      return {run:c.run,profile:c.profile,id:c.id,level:c.level,page:c.page,stamp:c.stamp,epoch,
        ledger:stable(M.normalize(c.source.passiveMoney)),now,mono,pending};
    }
    function matches(c) {
      return observation && observation.run === c.run && observation.profile === c.profile && observation.id === c.id &&
        observation.level === c.level && observation.page === c.page && observation.stamp === c.stamp && observation.epoch === epoch &&
        observation.ledger === stable(M.normalize(c.source.passiveMoney));
    }
    function commit(c, proposal, now, mono, fraction) {
      let attempted = false;
      try {
        check(proposal.result.ok && proposal.result.changed, 'invalid-proposal', 'No changed Passive Money proposal to commit.');
        const intended = serialized(proposal.run), intendedResult = serialized(proposal.result);
        // Re-read owned raws AFTER the final writer/eligibility guard, then
        // seal whole live data; no model mutations or asynchronous gap exist.
        confirmedFence(c);
        check(serialized(proposal.run) === intended, 'proposal-changed', 'The intended complete RUN changed before writing.');
        attempted = true;
        const written = host.write('run', proposal.run);
        check(written !== false && !thenable(written), 'write-failed', 'The complete RUN write was not synchronously confirmed.');
        check(host.read('run') === intended, 'readback-mismatch', 'The exact complete RUN readback did not match.');
        confirmedFence(c, intended);
        check(serialized(proposal.run) === intended && serialized(proposal.result) === intendedResult,
          'proposal-changed', 'The intended complete RUN or result changed during writing.');
        // No live money, income statistic, ledger or UI-success callback before
        // exact durable readback AND the post-write context/owner/profile fence.
        const applied = host.applyRun(proposal.run, proposal.result);
        check(applied !== false && !thenable(applied), 'apply-failed', 'The confirmed run was not synchronously applied.');
        observation = null;
        const next = liveContext();
        check(next.runJSON === intended && next.profile === c.profile && next.profileJSON === c.profileJSON && next.level === c.level &&
          next.page === c.page && host.stamp() === c.stamp && epoch === c.epoch && !destroyed,
          'apply-context', 'The confirmed run application changed its origin context.');
        if (!proposal.run.passiveMoney.settled)
          observation = identify({...next,id:next.source._uiId,stamp:c.stamp}, now, mono, fraction);
        if (typeof host.changed === 'function') host.changed(proposal.result);
        return proposal.result;
      } catch (error) {
        observation = null;
        if (attempted) {
          uncertain = true; epoch++;
          try { host.pause('Passive Money saving is uncertain. The action may already be saved. Do not retry, reset or roll back; reload safely to inspect it. ' + error.message); } catch (_) { /* latch is independent of host reporting */ }
        }
        return fail(attempted ? 'uncertain' : error.code || 'denied', error.message);
      }
    }
    function perform(work) {
      if (destroyed || uncertain || busy) return fail(uncertain ? 'uncertain' : destroyed ? 'destroyed' : 'reentrant', uncertain ? 'Saving is uncertain; reload safely without retrying.' : 'This action is no longer available.');
      busy = true;
      try { return work(); }
      catch (error) { resetObservation(); return fail(error.code || 'denied', error.message); }
      finally { busy = false; }
    }
    function start() {
      return perform(() => {
        const clock = clocks(), c = capture(), proposal = M.start(c.source, c.level, clock.now);
        if (!proposal.result.ok) return proposal.result;
        return commit(c, proposal, clock.now, clock.mono, 0);
      });
    }
    function tick() {
      return perform(() => {
        const clock = clocks(), c = capture(), s = M.normalize(c.source.passiveMoney);
        if (!s) { observation = null; return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'idle',status:M.status(c.source,c.level,clock.now)}; }
        if (clock.now < s.lastAt) { resetObservation(); return fail('clock-rollback','The absolute clock moved backwards. No time was forced forward.'); }
        if (s.settled) { observation = null; return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'settled',status:M.status(c.source,c.level,clock.now)}; }
        let pending = 0;
        if (matches(c) && clock.mono >= observation.mono && clock.now >= observation.now) {
          pending = observation.pending + clock.mono - observation.mono;
          check(Number.isFinite(pending) && pending >= 0 && pending <= M.MAX_TIME, 'observation-overflow', 'Observable eligible time cannot be represented safely.');
        } else {
          observation = identify(c, clock.now, clock.mono, 0);
          // A reload/context reset never infers the missing interval. Expiry is
          // still settled once, with zero observation, at its original deadline.
          if (clock.now < s.endsAt) return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'observing',status:M.status(c.source,c.level,clock.now)};
        }
        const observedMs = Math.floor(pending), proposal = M.poll(c.source, c.level, clock.now, observedMs);
        if (!proposal.result.ok) { resetObservation(); return proposal.result; }
        if (proposal.result.awardedCents > 0 || proposal.run.passiveMoney.settled) {
          return commit(c, proposal, clock.now, clock.mono, pending - observedMs);
        }
        // No every-250ms zero-cent writes. Keep integer AND fractional eligible
        // milliseconds since the last confirmed commit, not since the last poll.
        observation = identify(c, clock.now, clock.mono, pending);
        return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'observing',status:M.status(c.source,c.level,clock.now)};
      });
    }
    function status() {
      try { const c = host.get(), result = M.status(c && c.run, c && c.level, host.now());
        return {...result,uncertain,destroyed};
      } catch (error) { return {...fail(error.code || 'invalid-context', error.message),uncertain,destroyed}; }
    }
    function destroy() { destroyed = true; resetObservation(); }
    return Object.freeze({status,start,tick,resetObservation,destroy});
  }
  return Object.freeze({create});
}));
