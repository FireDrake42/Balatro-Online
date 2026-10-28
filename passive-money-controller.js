/* Injected synchronous Passive Money commit controller; no listeners, timers,
 * startup writes, DOM, global clocks, audio or PROFILE writes. Parent wires its
 * existing heartbeat and calls resetObservation on lifecycle/cancellation.
 * DEFAULT clockMode:'elapsed' uses only the DURABLE RUN lastAt cursor, so other
 * app tabs, reload and closed time cannot discard unclaimed session fractions.
 * host.eligible is a SAFE-TO-COMMIT/OWNER predicate, not a foreground time budget.
 * No commit while an action/slot/cloud/ownership boundary is unsafe; the next
 * safe tick catches up. All elapsed income is bounded by captured active time.
 * Optional clockMode:'observed' retains the prior foreground-only contract.
 *
 * const c = BOPassiveMoneyController.create(host);
 * c.status(); c.start(); c.tick(); c.syncPower({explicit:true}); c.resetObservation(); c.destroy();
 * host: get()->{profile,run,level,page}, eligible()->boolean, assertWritable(),
 * stamp(), now()->Date.now integer, monotonic()->performance.now number,
 * read('run'|'profile'), ownRaw('run'|'profile'), write('run',wholeRun), pause(msg),
 * applyRun(next,result), changed(result) [optional], notify(msg) [optional].
 * getFeatureEnabled()->boolean [default true], getPaused()->boolean [default false]
 * explicitly opt new starts into v2. syncPower is an essential owner-fenced RUN
 * checkpoint (never a PROFILE/SETTINGS writer); explicit:true alone may upgrade
 * an existing v1 at CURRENT remaining. Reads/creation never upgrade. The parent
 * preholds getPaused BEFORE guarded policy writes; uncertainty keeps that hold.
 * All host operations must be synchronous. A write must update ownRaw to its
 * confirmed owned raw, exactly like the parent's existing whole-RUN writer.
 *
 * LIVE whole RUN is the proposal source. Owned durable raw must match its
 * id/phase/Bank/passive ledger; native-owned live potion/task/derived fields may
 * differ from that previous owned raw and are preserved, not deleted or reset.
 * Exact whole-live/profile snapshots and both durable raws fence every commit.
 * Royal context is derived ONLY from matching own saved/live PROFILE event
 * ledgers, at the existing captured absolute host.now. No global config, cached
 * event flag, extra clock, PROFILE writer or persisted duplicate is introduced.
 * Status uses whole owned saved raws + live run/event-only fencing, without
 * enumerating unrelated live PROFILE/private Poker fields or invoking action
 * guards/replay. host.eligible includes its existing writer-canWrite check.
 * Readiness is virtual; hidden/protected/power/owner guards remain strict.
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
    for (const key of ['getFeatureEnabled','getPaused'])
      check(host[key] === undefined || typeof host[key] === 'function', 'invalid-host', 'Invalid synchronous Passive Money host.' + key);
    check(host.clockMode === undefined || ['elapsed','observed'].includes(host.clockMode), 'invalid-host', 'Invalid Passive Money clockMode.');
    const elapsedClock = host.clockMode !== 'observed';
    check(!elapsedClock || ['pollElapsed','startElapsed','setPausedElapsed'].every(key => typeof M[key] === 'function'), 'missing-model', 'The elapsed Passive Money model is required.');
    const pauseClock = typeof host.getFeatureEnabled === 'function' || typeof host.getPaused === 'function';
    function power() {
      const enabled = typeof host.getFeatureEnabled === 'function' ? host.getFeatureEnabled() : true;
      const paused = typeof host.getPaused === 'function' ? host.getPaused() : false;
      check(typeof enabled === 'boolean' && typeof paused === 'boolean', 'invalid-power', 'Power callbacks must return synchronous booleans.');
      return {powerPaused:!enabled || paused,powerKey:JSON.stringify([enabled,paused])};
    }
    let busy = false, destroyed = false, uncertain = false, retaining = false, epoch = 0, observation = null, carry = null;
    function resetObservation() {
      epoch++;
      // A reset inside a transaction is cancellation, never an earning pause.
      if (elapsedClock || busy || retaining || destroyed || uncertain) { observation = null; carry = null; return; }
      retainObserved(true);
    }
    function guard() {
      check(!destroyed && !uncertain, uncertain ? 'uncertain' : 'destroyed', uncertain ? 'Saving is uncertain. Reload safely; do not retry or reset.' : 'This Passive Money controller was destroyed.');
      const allowed = host.assertWritable(); check(allowed !== false && !thenable(allowed), 'read-only', 'This save is not writable.');
      check(host.eligible() === true, 'ineligible', 'The selected-slot owner is not safe to commit Passive Money yet. Earned elapsed time remains in its durable cursor.');
      check(!power().powerPaused, 'power-paused', 'Low Power or a disabled Passive Money feature pauses earnings.');
    }
    function eventContext(profile) {
      check(profile && typeof profile === 'object' && Object.getPrototypeOf(profile) === Object.prototype,
        'invalid-profile', 'An own whole profile is required for Poker event authority.');
      const d = Object.getOwnPropertyDescriptor(profile, 'emeraldPokerEvents');
      if (!d) return undefined;
      check(d.enumerable === true && Object.prototype.hasOwnProperty.call(d, 'value') && d.value !== undefined,
        'invalid-events', 'The existing Poker event field needs attention.');
      return {pokerEvents:d.value};
    }
    function savedEvents(c) {
      const context = eventContext(JSON.parse(c.profileRaw));
      check(stable(context) === stable(c.modelContext), 'event-mismatch', 'The whole saved and live Poker event ledgers differ.');
    }
    function liveContext() {
      const c = host.get();
      check(c && c.profile && c.run && (c.page === 'game' || c.page === 'home'), 'ineligible-run', 'An eligible current origin run is required.');
      check(Number.isInteger(c.level) && c.level >= 40 && c.level <= 100, 'locked', 'Passive Money unlocks at actual player Level 40.');
      const source = M.copyData(c.run), profileSource = M.copyData(c.profile), profileJSON = JSON.stringify(profileSource);
      const modelContext = eventContext(profileSource);
      check(source.progressionEnabled === true && source.playerLevel === c.level,
        'unreconciled-level', 'The origin run actual player level is not durably reconciled yet.');
      const s = M.status(source, c.level, 0, modelContext);
      check(s.ok && s.eligibleRun, s.code || 'ineligible-run', s.reason || 'An active, non-abandoned origin run is required.');
      return {...c,...power(),source,runJSON:JSON.stringify(source),profileJSON,modelContext};
    }
    function verifyLive(c) {
      check(c.epoch === epoch && !destroyed && !uncertain, 'cancelled', 'This observation or action was cancelled.');
      const stamp = host.stamp(), live = liveContext();
      check(c.epoch === epoch && !destroyed && !uncertain && live.run === c.run && live.profile === c.profile &&
        live.level === c.level && live.page === c.page && live.source._uiId === c.id && stamp === c.stamp &&
        live.runJSON === c.runJSON && live.profileJSON === c.profileJSON && live.powerKey === c.powerKey,
        'context-changed', 'The whole live run, profile, actual level, owner or slot changed.');
      return live;
    }
    function sameContext(c) { guard(); return verifyLive(c); }
    function confirmedFence(c, runRaw = c.runRaw) {
      if (c.powerTransition) { retentionFence(c, runRaw); return verifyLive(c); }
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
      savedEvents(c);
      sameContext(c); raws(c); sameContext(c); return c;
    }
    function clocks() {
      const now = host.now(), mono = host.monotonic();
      check(Number.isSafeInteger(now) && now >= 0 && now <= M.MAX_TIME, 'invalid-time', 'Invalid absolute clock.');
      check(typeof mono === 'number' && Number.isFinite(mono) && mono >= 0 && mono <= M.MAX_TIME, 'invalid-monotonic', 'Invalid observable monotonic clock.');
      return {now,mono};
    }
    function identify(c, now, mono, pending, since = now, prior = pending) {
      return {run:c.run,profile:c.profile,id:c.id,level:c.level,page:c.page,stamp:c.stamp,epoch,
        ledger:stable(M.normalize(c.source.passiveMoney)),now,mono,pending,since,prior};
    }
    function sameOrigin(saved, c) {
      return saved && saved.run === c.run && saved.profile === c.profile && saved.id === c.id &&
        saved.level === c.level && saved.stamp === c.stamp &&
        saved.ledger === stable(M.normalize(c.source.passiveMoney));
    }
    function matches(c) { return sameOrigin(observation, c) && observation.epoch === epoch; }
    function segmentBudget(s, saved, now, pending) {
      // Clip the WHOLE contiguous observation, preserving monotonic sub-ms
      // fractions across quantized Date.now samples. An explicit segment start
      // prevents post-expiry observations from being projected before expiry.
      // prior is ONLY a previously verified sub-ms remainder from a commit.
      const begin = Math.max(saved.since, s.startedAt, s.lastAt, now - (pending - saved.prior));
      return saved.prior + Math.max(0, Math.min(now, s.endsAt) - begin);
    }
    function retentionGuard() {
      check(!destroyed && !uncertain, 'cancelled', 'This observation was cancelled.');
      const allowed = host.assertWritable();
      check(allowed !== false && !thenable(allowed), 'read-only', 'This save is not writable.');
    }
    function retentionFence(c, runRaw = c.runRaw) {
      // Pauses may be ineligible but never owner/read/save-guard exempt.
      retentionGuard(); verifyLive(c); raws(c, runRaw);
      retentionGuard(); verifyLive(c); raws(c, runRaw); verifyLive(c);
    }
    function retentionCapture() {
      const token = epoch; retentionGuard();
      const stamp = host.stamp(), live = liveContext();
      const c = {...live,id:live.source._uiId,stamp,epoch:token,runRaw:host.read('run'),profileRaw:host.read('profile')};
      check(typeof c.runRaw === 'string' && typeof c.profileRaw === 'string' &&
        c.runRaw === host.ownRaw('run') && c.profileRaw === host.ownRaw('profile'),
        'foreign-raw', 'The latest complete save is missing or was not written by this owner.');
      const durable = M.copyData(JSON.parse(c.runRaw));
      check(durable._uiId === c.id && durable.phase === c.source.phase && durable.money === c.source.money &&
        stable(M.normalize(durable.passiveMoney)) === stable(M.normalize(c.source.passiveMoney)),
        'durable-mismatch', 'The durable origin id, phase, Bank or Passive Money ledger is not reconciled.');
      savedEvents(c);
      retentionFence(c); return c;
    }
    function retainObserved(sampleBoundary) {
      const saved = observation, previousCarry = carry;
      observation = null; carry = null;
      if (retaining || destroyed || uncertain || !saved && !previousCarry) return;
      retaining = true;
      try {
        const c = retentionCapture(), s = M.normalize(c.source.passiveMoney), clock = clocks();
        if (!s || s.settled) return;
        const previous = sameOrigin(previousCarry, c) ? previousCarry : null, current = sameOrigin(saved, c) ? saved : null;
        // Read clocks even while ineligible and even if observation is null.
        // A rollback invalidates ALL carry; reading a gap does not earn it.
        if (previous && (clock.now < previous.now || clock.mono < previous.mono) ||
            current && (clock.now < current.now || clock.mono < current.mono)) return;
        let budget = previous ? previous.pending : 0;
        if (current) {
          // An ineligible reset adds only the last sampled segment, never the
          // modal/hidden/busy interval leading up to this reset. No writer here.
          const sample = sampleBoundary && host.eligible() === true && !c.powerPaused && !(s.version === M.PAUSE_VERSION && s.pausedAt !== null);
          const now = sample ? clock.now : current.now;
          const pending = current.pending + (sample ? clock.mono - current.mono : 0);
          budget += segmentBudget(s, current, now, pending);
        }
        check(Number.isFinite(budget) && budget >= 0 && budget <= M.MAX_TIME, 'observation-overflow', 'Observable eligible time cannot be represented safely.');
        // Host reads/clocks/eligibility hooks can cancel or replace this origin.
        // The private latch prevents recursion; this final epoch/raw/live fence
        // prevents an external reset from resurrecting either local snapshot.
        retentionFence(c);
        carry = budget ? identify(c, clock.now, clock.mono, budget) : null;
      } catch (_) { carry = null; }
      finally { retaining = false; }
    }
    function commitObserved(c, proposal, now, mono, fraction) {
      // Both successful writes and denied/uncertain attempted commits consume
      // this private budget. The original complete-RUN commit remains exact.
      carry = null;
      return commit(c, proposal, now, mono, fraction);
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
          next.page === c.page && next.powerKey === c.powerKey && host.stamp() === c.stamp && epoch === c.epoch && !destroyed,
          'apply-context', 'The confirmed run application changed its origin context.');
        if (!elapsedClock && !proposal.run.passiveMoney.settled)
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
      if (destroyed || uncertain || busy || retaining) return fail(uncertain ? 'uncertain' : destroyed ? 'destroyed' : 'reentrant', uncertain ? 'Saving is uncertain; reload safely without retrying.' : 'This action is no longer available.');
      busy = true;
      try { return work(); }
      catch (error) {
        if (error.code === 'ineligible' || error.code === 'power-paused') { epoch++; retainObserved(false); }
        else resetObservation();
        return fail(error.code || 'denied', error.message);
      }
      finally { busy = false; }
    }
    function start() {
      return perform(() => {
        const clock = clocks(), c = capture(), proposal = (elapsedClock ? M.startElapsed : M.start)(c.source, c.level, clock.now, pauseClock ? {pauseClock:true} : undefined, c.modelContext);
        if (!proposal.result.ok) return proposal.result;
        return commitObserved(c, proposal, clock.now, clock.mono, 0);
      });
    }
    function tick() {
      return perform(() => {
        const clock = clocks(), c = capture(), s = M.normalize(c.source.passiveMoney);
        if (!s) { observation = null; carry = null; return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'idle',status:M.status(c.source,c.level,clock.now,c.modelContext)}; }
        if (clock.now < s.lastAt) { resetObservation(); return fail('clock-rollback','The absolute clock moved backwards. No time was forced forward.'); }
        if (s.version === M.PAUSE_VERSION && s.pausedAt !== null)
          return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'paused',status:M.status(c.source,c.level,clock.now,c.modelContext)};
        if (s.settled) { observation = null; carry = null; return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'settled',status:M.status(c.source,c.level,clock.now,c.modelContext)}; }
        if (elapsedClock) {
          const proposal = M.pollElapsed(c.source, c.level, clock.now, c.modelContext);
          if (!proposal.result.ok) return proposal.result;
          if (proposal.result.changed && (proposal.result.awardedCents > 0 || proposal.run.passiveMoney.settled))
            return commit(c, proposal, clock.now, clock.mono, 0);
          // Avoid 250ms zero-cent writes. The saved cursor stays PUT, so a reload
          // recovers this whole fractional edge; no private observation to lose.
          return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'accruing',status:M.status(c.source,c.level,clock.now,c.modelContext)};
        }
        if (!sameOrigin(carry, c)) carry = null;
        if (carry && (clock.now < carry.now || clock.mono < carry.mono) ||
            matches(c) && (clock.now < observation.now || clock.mono < observation.mono)) { carry = null; observation = null; }
        let pending = 0, since = clock.now, prior = 0;
        if (matches(c) && clock.mono >= observation.mono && clock.now >= observation.now) {
          pending = observation.pending + clock.mono - observation.mono;
          since = observation.since; prior = observation.prior;
          check(Number.isFinite(pending) && pending >= 0 && pending <= M.MAX_TIME, 'observation-overflow', 'Observable eligible time cannot be represented safely.');
        } else {
          observation = identify(c, clock.now, clock.mono, 0);
          // Anchor a new segment without counting the gap. A carried budget is
          // already observed, not reconstructed from lastAt or offline time.
          if (!carry && clock.now < s.endsAt) return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'observing',status:M.status(c.source,c.level,clock.now,c.modelContext)};
        }
        const budget = (carry ? carry.pending : 0) + segmentBudget(s, {since,prior}, clock.now, pending);
        check(Number.isFinite(budget) && budget >= 0 && budget <= M.MAX_TIME, 'observation-overflow', 'Observable eligible time cannot be represented safely.');
        const observedMs = Math.floor(budget), at = Math.min(clock.now, s.endsAt);
        // ONLY the independently clipped pre-deadline budget may be folded at
        // the deadline. A wholly post-expiry interval contributes exactly zero.
        let proposal = M.poll(c.source, c.level, at, observedMs, c.modelContext);
        if (proposal.result.ok && clock.now > at) {
          const final = M.poll(proposal.run, c.level, clock.now, 0, c.modelContext);
          if (final.result.ok) final.result = {...final.result,
            changed:proposal.result.changed || final.result.changed,
            awardedCents:proposal.result.awardedCents + final.result.awardedCents,
            earnedMs:proposal.result.earnedMs + final.result.earnedMs};
          proposal = final;
        }
        if (!proposal.result.ok) { resetObservation(); return proposal.result; }
        if (proposal.result.awardedCents > 0 || proposal.run.passiveMoney.settled) {
          return commitObserved(c, proposal, clock.now, clock.mono, budget - observedMs);
        }
        // No every-250ms zero-cent writes. Keep integer AND fractional eligible
        // milliseconds since the last confirmed commit, not since the last poll.
        observation = identify(c, clock.now, clock.mono, pending, since, prior);
        return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'observing',status:M.status(c.source,c.level,clock.now,c.modelContext)};
      });
    }
    function syncPower(options) {
      return perform(() => {
        const config = options === undefined ? {explicit:false} : M.copyData(options);
        check(config && Object.keys(config).length === 1 && typeof config.explicit === 'boolean', 'invalid-options', 'Supply only a boolean explicit power-command option.');
        const clock = clocks(), c = retentionCapture(), s = M.normalize(c.source.passiveMoney);
        const unchanged = code => ({ok:true,changed:false,awardedCents:0,earnedMs:0,code,
          status:{...M.status(c.source,c.level,clock.now,c.modelContext),powerPaused:c.powerPaused}});
        if (!s) return unchanged('idle');
        check(clock.now >= s.lastAt, 'clock-rollback', 'The absolute clock moved backwards. No pause was forced forward.');
        const wasPaused = s.version === M.PAUSE_VERSION && s.pausedAt !== null;
        if (wasPaused === c.powerPaused) return unchanged(wasPaused ? 'paused' : 'unchanged');
        if (s.version === M.VERSION && !config.explicit) return unchanged('legacy-power-pending');
        if (elapsedClock) {
          const proposal = M.setPausedElapsed(c.source, c.level, clock.now, c.powerPaused, c.modelContext);
          if (!proposal.result.ok || !proposal.result.changed) return proposal.result;
          // This essential pre-policy checkpoint bypasses ONLY the transient
          // earning-policy/foreground predicate. All owner/slot/raw/live/readback
          // fences remain, including after the one atomic RUN write.
          c.powerTransition = true;
          return commit(c, proposal, clock.now, clock.mono, 0);
        }
        let previous = sameOrigin(carry, c) ? carry : null, current = sameOrigin(observation, c) ? observation : null;
        if (previous && (clock.now < previous.now || clock.mono < previous.mono) ||
            current && (clock.now < current.now || clock.mono < current.mono)) {
          previous = null; current = null; carry = null; observation = null;
        }
        // ONLY already verified budget survives a policy boundary. Never sample
        // modal/hidden/policy-off time on this essential checkpoint path.
        let budget = previous ? previous.pending : 0;
        if (current) budget += segmentBudget(s, current, current.now, current.pending);
        check(Number.isFinite(budget) && budget >= 0 && budget <= M.MAX_TIME, 'observation-overflow', 'Invalid verified pause-boundary budget.');
        const observedMs = Math.floor(budget);
        let source = c.source, folded = {ok:true,changed:false,awardedCents:0,earnedMs:0};
        if (!wasPaused && !s.settled) {
          const at = Math.min(clock.now, s.endsAt);
          let proposal = M.poll(source, c.level, at, observedMs, c.modelContext);
          if (proposal.result.ok && clock.now > at) {
            const final = M.poll(proposal.run, c.level, clock.now, 0, c.modelContext);
            if (final.result.ok) final.result = {...final.result,changed:proposal.result.changed || final.result.changed,
              awardedCents:proposal.result.awardedCents + final.result.awardedCents,earnedMs:proposal.result.earnedMs + final.result.earnedMs};
            proposal = final;
          }
          if (!proposal.result.ok) return proposal.result;
          source = proposal.run; folded = proposal.result;
        }
        const proposal = M.setPaused(source, c.level, clock.now, c.powerPaused, 0, c.modelContext);
        if (!proposal.result.ok) return proposal.result;
        proposal.result = {...proposal.result,changed:folded.changed || proposal.result.changed,
          awardedCents:folded.awardedCents + proposal.result.awardedCents,earnedMs:folded.earnedMs + proposal.result.earnedMs};
        if (!proposal.result.changed) return proposal.result;
        c.powerTransition = true;
        return commitObserved(c, proposal, clock.now, clock.mono, wasPaused ? budget : budget - observedMs);
      });
    }
    function statusEvents(profile) {
      const context = eventContext(profile);
      return context === undefined ? undefined : M.copyData(context);
    }
    function statusFence(c) {
      check(c.epoch === epoch && !destroyed && !uncertain && host.stamp() === c.stamp,
        'context-changed', 'The read-only Passive Money context changed.');
      raws(c);
      const v = host.get();
      check(v && v.profile === c.profile && v.run === c.run && v.level === c.level && v.page === c.page &&
        serialized(v.run) === c.runJSON && stable(statusEvents(v.profile)) === stable(c.modelContext) && power().powerKey === c.powerKey,
        'context-changed', 'The origin run, event ledger or power policy changed during the status read.');
      raws(c);
      check(c.epoch === epoch && !destroyed && !uncertain && host.stamp() === c.stamp,
        'context-changed', 'The read-only Passive Money context changed.');
    }
    function status() {
      try {
        // Never enumerate/copy live PROFILE here: Poker private RNG/seed/round
        // replay belongs to explicit action boundaries, not render/read paths.
        check(!destroyed && !uncertain, destroyed ? 'destroyed' : 'uncertain', 'Passive Money status is not writable.');
        const now = host.now(), v = host.get();
        check(v && v.profile && v.run && (v.page === 'game' || v.page === 'home'), 'ineligible-run', 'An eligible origin run is required.');
        check(Number.isInteger(v.level) && v.level >= 40 && v.level <= 100, 'locked', 'Passive Money unlocks at actual player Level 40.');
        const source = M.copyData(v.run), c = {profile:v.profile,run:v.run,level:v.level,page:v.page,
          source,runJSON:JSON.stringify(source),modelContext:statusEvents(v.profile),...power(),epoch,
          stamp:host.stamp(),profileRaw:host.read('profile'),runRaw:host.read('run')};
        check(source.progressionEnabled === true && source.playerLevel === c.level,
          'unreconciled-level', 'The origin run actual player level is not durably reconciled yet.');
        check(typeof c.runRaw === 'string' && typeof c.profileRaw === 'string', 'unsaved-run', 'Save this origin run before starting Passive Money.');
        const durable = JSON.parse(c.runRaw);
        check(durable && durable._uiId === source._uiId && durable.phase === source.phase && durable.money === source.money &&
          stable(M.normalize(durable.passiveMoney)) === stable(M.normalize(source.passiveMoney)),
          'durable-mismatch', 'The durable origin id, phase, Bank or Passive Money ledger is not reconciled.');
        savedEvents(c); statusFence(c);
        const result = M.status(source, c.level, now, c.modelContext), eligible = host.eligible() === true;
        statusFence(c);
        return {...result,powerPaused:c.powerPaused,powerKey:c.powerKey,eligible,
          ready:result.ok === true && result.ready && eligible && !c.powerPaused,uncertain,destroyed};
      } catch (error) { return {...fail(error.code || 'invalid-context', error.message),ready:false,uncertain,destroyed}; }
    }
    function destroy() { destroyed = true; resetObservation(); }
    return Object.freeze({status,start,tick,syncPower,resetObservation,destroy});
  }
  return Object.freeze({create});
}));
