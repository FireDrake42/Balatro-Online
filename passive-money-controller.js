/* Synchronous Passive Money controller; no listeners, timers, startup writes,
 * DOM, audio or PROFILE writes. Standalone clocks stay injected; OPTIONAL native
 * Game Speed alone binds real Date/Mono and requires original paired staging. Parent wires its
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
    for (const key of ['getFeatureEnabled','getPaused','gameSpeedSource'])
      check(host[key] === undefined || typeof host[key] === 'function', 'invalid-host', 'Invalid synchronous Passive Money host.' + key);
    check(host.clockMode === undefined || ['elapsed','observed'].includes(host.clockMode), 'invalid-host', 'Invalid Passive Money clockMode.');
    check(host.nativeSource === undefined || typeof host.nativeSource === 'boolean', 'invalid-host', 'Invalid native Passive Money source option.');
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
    // A native stage executes the ORIGINAL synchronous command and all its
    // prewrite fences, but stops at its first write. No fake write/readback,
    // public success, durable cursor or private observation is published here.
    let staging = null;
    const nativeStages = new WeakMap();
    // Optional NATIVE capability only. No public/injected elapsed clock can mint
    // bonus. BASE keeps its original other-tab/closed-time cursor semantics.
    const completeBoostModel=M.BOOST_VERSION===3&&['advanceBoosted','pollElapsed','startElapsed','setPausedElapsed','normalize','validate','status'].every(key=>typeof M[key]==='function');
    const nativeGameSpeed=host.nativeSource===true&&elapsedClock&&typeof host.gameSpeedSource==='function'&&completeBoostModel&&typeof performance!=='undefined'&&typeof performance.now==='function';
    const nativeWall=nativeGameSpeed?Date.now.bind(Date):null;
    const nativeMono=nativeGameSpeed?performance.now.bind(performance):null;
    const nativeBudgets=new WeakSet();let gameSpeedObservation=null,gameSpeedOrigin=null,gameSpeedLast=null,gameSpeedClockError='',gameSpeedSlice=0;
    function discardGameSpeed(){gameSpeedObservation=null;}
    function pauseNativeBudget(error){
      if(!uncertain){uncertain=true;epoch++;observation=null;carry=null;discardGameSpeed();
        try{host.pause('Passive Money native bonus acceptance is uncertain. Do not retry, reset or roll back; reload safely. '+error.message);}catch(_){/* latch is independent of reporting */}}
    }
    function requireCompatibleSavedClock(run){
      const state=Object.getOwnPropertyDescriptor(run||{},'passiveMoney')?.value;
      const version=Object.getOwnPropertyDescriptor(state||{},'version')?.value;
      if(version!==3||elapsedClock&&completeBoostModel)return;
      const error=Object.assign(Error('The saved optional Money clock requires the complete elapsed model. Keep the whole save; writes are paused.'),{code:'unsupported-saved-clock'});
      pauseNativeBudget(error);throw error;
    }
    function nativeBudgetClock(t){
      if(gameSpeedClockError)return false;
      if(!gameSpeedOrigin)gameSpeedOrigin={now:t.now,mono:t.mono};
      if(gameSpeedLast&&(t.now<gameSpeedLast.now||t.mono<gameSpeedLast.mono)||
        Math.abs(t.now-gameSpeedOrigin.now-(t.mono-gameSpeedOrigin.mono))>64){
        gameSpeedClockError='Native REAL clock changed; reload before new Game Speed bonus.';discardGameSpeed();return false;}
      gameSpeedLast={now:t.now,mono:t.mono};return true;
    }
    function gameSpeedReceipt(c){
      const p=JSON.parse(c.profileJSON),r=p.gameSpeed,fields=['version','revision','startedAt','activeUntil','cooldownUntil'];
      return r&&Object.keys(r).length===5&&Object.keys(r).every(k=>fields.includes(k))&&r.version===1&&Number.isSafeInteger(r.revision)&&r.revision>0&&
        [r.startedAt,r.activeUntil,r.cooldownUntil].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=M.MAX_TIME)&&
        r.activeUntil-r.startedAt===60000&&r.cooldownUntil-r.activeUntil===600000?r:null;
    }
    function sampleGameSpeed(c,t){
      if(!nativeGameSpeed||destroyed||uncertain){discardGameSpeed();return false;}
      const authority=host.gameSpeedSource(),s=M.normalize(c.source.passiveMoney),receipt=gameSpeedReceipt(c);
      if(!authority?.owner||authority.visible!==true||authority.epoch===undefined||c.level<50||c.powerPaused||!s||!receipt||
        s.version===M.BOOST_VERSION&&receipt.revision<s.boostRevision||
        (s.version===M.PAUSE_VERSION||s.version===M.BOOST_VERSION)&&s.pausedAt!==null){discardGameSpeed();return false;}
      if(t.now>=receipt.activeUntil&&(!gameSpeedObservation||gameSpeedObservation.bracket.now>=receipt.activeUntil)&&!gameSpeedObservation?.slices.length){discardGameSpeed();return false;}
      if(!nativeBudgetClock(t)){discardGameSpeed();return false;}
      const key=JSON.stringify([epoch,c.stamp,c.source._uiId,s.sequence,c.level,c.page,c.powerKey,authority.epoch,receipt]);
      let o=gameSpeedObservation;
      const anchor=()=>gameSpeedObservation={key,owner:authority.owner,authorityEpoch:authority.epoch,run:c.run,profile:c.profile,last:t,bracket:t,slices:[],receipt};
      if(!o||o.key!==key||o.owner!==authority.owner||o.run!==c.run||o.profile!==c.profile){anchor();return false;}
      if(t.mono-o.last.mono>2500||o.slices.length&&t.mono-o.slices[0].fromMono>2500){anchor();return false;}
      o.last=t;
      if(t.now>o.bracket.now){
        const realMs=t.mono-o.bracket.mono,span=t.now-o.bracket.now;
        if(realMs<=0||realMs>2500||Math.abs(span-realMs)>64){anchor();return false;}
        if(t.now>receipt.startedAt&&o.bracket.now<receipt.activeUntil)o.slices.push({id:++gameSpeedSlice,fromAt:o.bracket.now,toAt:t.now,realMs,fromMono:o.bracket.mono});
        o.bracket=t;
      }
      // Stale/overlapping whole pieces are discarded, NEVER interpolated into a
      // fictional source time. Own accepted publication normally removes them.
      o.slices=o.slices.filter(p=>p.fromAt>=s.lastAt);
      if(o.slices.reduce((n,p)=>n+p.realMs,0)+(t.mono-o.bracket.mono)>2500){anchor();return false;}
      return true;
    }
    function observeGameSpeed(){
      check(arguments.length===0,'invalid-observation','Native observations take no public timestamp or budget.');
      if(!nativeGameSpeed||destroyed||uncertain){discardGameSpeed();return false;}
      try{const t=clocks();retentionGuard();const c={...liveContext(),stamp:host.stamp()};return sampleGameSpeed(c,t);}
      catch(_){discardGameSpeed();return false;}
    }
    function takeGameSpeed(c,t){
      if(!nativeGameSpeed||!staging)return undefined;
      sampleGameSpeed(c,t);const o=gameSpeedObservation;if(!o?.slices.length)return undefined;
      const pieces=o.slices.slice(),token={observation:o,epoch,owner:o.owner,authorityEpoch:o.authorityEpoch,key:o.key,ids:pieces.map(p=>p.id),fromMono:pieces[0].fromMono,consumed:false,receipt:stable(o.receipt)};
      nativeBudgets.add(token);staging.boostToken=token;
      return {receipt:M.copyData(o.receipt),slices:pieces.map(p=>({fromAt:p.fromAt,toAt:p.toAt,realMs:p.realMs}))};
    }
    function assertGameSpeed(token){
      if(!token)return true;
      check(nativeBudgets.has(token)&&!token.consumed&&token.epoch===epoch&&token.observation===gameSpeedObservation,
        'native-budget-consumed','The private native observation was cancelled or already consumed.');
      const t=clocks(),authority=host.gameSpeedSource({nativeTransaction:true}),v=host.get();
      check(nativeBudgetClock(t)&&t.mono-token.fromMono>=0&&t.mono-token.fromMono<=2500&&authority?.owner===token.owner&&authority.epoch===token.authorityEpoch&&authority.visible===true&&
        stable(Object.getOwnPropertyDescriptor(v.profile,'gameSpeed')?.value)===token.receipt,
        'native-budget-stale','The private observed owner/clock/receipt changed before native acceptance.');
      return true;
    }
    function finishGameSpeed(token,confirmed){
      if(!token)return;
      if(confirmed){assertGameSpeed(token);const ids=new Set(token.ids);
        check(token.ids.every(id=>token.observation.slices.some(p=>p.id===id)),'native-budget-missing','The exact private observed pieces are unavailable.');
        token.observation.slices=token.observation.slices.filter(p=>!ids.has(p.id));}
      else if(token.observation===gameSpeedObservation)discardGameSpeed();
      token.consumed=true;
    }
    function resetObservation() {
      discardGameSpeed();epoch++;
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
      requireCompatibleSavedClock(c.run);
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
      const now = nativeGameSpeed?nativeWall():host.now(), mono = nativeGameSpeed?nativeMono():host.monotonic();
      check(Number.isSafeInteger(now) && now >= 0 && now <= M.MAX_TIME, 'invalid-time', 'Invalid absolute clock.');
      check(typeof mono === 'number' && Number.isFinite(mono) && mono >= 0 && mono <= M.MAX_TIME, 'invalid-monotonic', 'Invalid observable monotonic clock.');
      if (staging) staging.clock = {now,mono};
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
        if (staging) {
          check(!staging.commit, 'multiple-source-writes', 'Only one native Passive Money source is allowed per original command.');
          staging.commit = {c,proposal:M.copyData(proposal),now,mono,fraction};
          return M.copyData(proposal.result);
        }
        check(host.nativeSource !== true, 'native-boundary-required', 'Passive Money requires its complete native source transaction. No RUN-only fallback was saved.');
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
        let clock = clocks();const c = capture();let source=c.source,folded=null;
        if(nativeGameSpeed&&staging){clock=clocks();const proof=takeGameSpeed(c,clock);
          if(proof){folded=M.advanceBoosted(c.source,c.level,clock.now,proof,c.modelContext);if(!folded.result.ok)return folded.result;source=folded.run;}}
        const proposal = (elapsedClock ? M.startElapsed : M.start)(source, c.level, clock.now, pauseClock ? {pauseClock:true} : undefined, c.modelContext);
        if (!proposal.result.ok) return proposal.result;
        if(folded)proposal.result={...proposal.result,awardedCents:proposal.result.awardedCents+folded.result.awardedCents,
          earnedMs:proposal.result.earnedMs+folded.result.earnedMs,bonusMs:folded.result.bonusMs};
        return commitObserved(c, proposal, clock.now, clock.mono, 0);
      });
    }
    function tick() {
      return perform(() => {
        const clock = clocks(), c = capture(), s = M.normalize(c.source.passiveMoney);
        if (!s) { observation = null; carry = null; return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'idle',status:M.status(c.source,c.level,clock.now,c.modelContext)}; }
        if (clock.now < s.lastAt) { resetObservation(); return fail('clock-rollback','The absolute clock moved backwards. No time was forced forward.'); }
        if ((s.version === M.PAUSE_VERSION || s.version === M.BOOST_VERSION) && s.pausedAt !== null)
          return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:'paused',status:M.status(c.source,c.level,clock.now,c.modelContext)};
        // BEFORE the original settled return: full native cooldown also has a
        // boost clock. Combined chronological BASE+bonus, never BASE-first.
        if(elapsedClock&&(nativeGameSpeed||s.version===M.BOOST_VERSION)){
          const late=clocks(),proof=takeGameSpeed(c,late),proposal=proof?M.advanceBoosted(c.source,c.level,late.now,proof,c.modelContext):M.pollElapsed(c.source,c.level,late.now,c.modelContext);
          if(!proposal.result.ok)return proposal.result;
          const after=M.status(proposal.run,c.level,late.now,c.modelContext),before=M.status(c.source,c.level,Math.min(late.now,s.lastAt),c.modelContext);
          if(proposal.result.changed&&(proposal.result.awardedCents>0||proposal.result.bonusMs>0||after.settled&&!before.settled))
            return commit(c,proposal,late.now,late.mono,0);
          if(staging?.boostToken){finishGameSpeed(staging.boostToken,false);staging.boostToken=null;}
          return {ok:true,changed:false,awardedCents:0,earnedMs:0,code:after.expired?'settled':'accruing',status:M.status(c.source,c.level,late.now,c.modelContext)};
        }
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
        if(nativeGameSpeed&&c.powerPaused)discardGameSpeed();
        const wasPaused = (s.version === M.PAUSE_VERSION || s.version === M.BOOST_VERSION) && s.pausedAt !== null;
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
        const now = nativeGameSpeed?nativeWall():host.now(), v = host.get();
        check(v && v.profile && v.run && (v.page === 'game' || v.page === 'home'), 'ineligible-run', 'An eligible origin run is required.');
        requireCompatibleSavedClock(v.run);
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
          ready:result.ok === true && result.ready && eligible && !c.powerPaused,uncertain,destroyed,
          ...(nativeGameSpeed?{gameSpeedBonusPaused:!!gameSpeedClockError,gameSpeedBonusReason:gameSpeedClockError}:{})};
      } catch (error) { return {...fail(error.code || 'invalid-context', error.message),ready:false,uncertain,destroyed}; }
    }
    function stageCommand(kind, options) {
      check(elapsedClock, 'native-clock-unsupported', 'Native staging requires the existing elapsed Passive Money controller. Observed standalone commands are unchanged.');
      check(!staging && !busy && !retaining && !destroyed && !uncertain, 'native-stage-unavailable', 'This native source is busy, cancelled or uncertain. Reload safely.');
      check(['start','tick','syncPower'].includes(kind) && (kind === 'syncPower' || options === undefined), 'invalid-native-command', 'Use one original native Passive Money command.');
      const before = {epoch,observation,carry}, frame = {epoch,commit:null,clock:null,result:null,published:false,finished:false,consumed:false}, token = Object.freeze({});
      staging = frame;
      try { frame.result = M.copyData(kind === 'syncPower' ? syncPower(options) : kind === 'start' ? start() : tick()); }
      finally {
        staging = null;
        // Never undo an external reset, destruction or original refusal. A
        // cancelled projection cannot resurrect an earlier private budget.
        if (epoch === before.epoch && !destroyed && !uncertain) { observation = before.observation; carry = before.carry; }
        else { observation = null; carry = null; }
      }
      nativeStages.set(token,frame); return token;
    }
    function assertStage(token, options) {
      const f = nativeStages.get(token);
      check(f && !f.consumed && !f.published && f.epoch === epoch && !destroyed && !uncertain, 'native-stage-consumed', 'This native source was cancelled, consumed or already published.');
      check(options === undefined || options && Object.keys(options).length === 1 && options.nativeTransaction === true, 'invalid-native-fence', 'Use only the native whole-transaction source fence.');
      assertGameSpeed(f.boostToken);
      if (f.commit) {
        const c = f.commit.c;
        // prepareStage ALWAYS confirms original raws. Once inside the paired
        // journal, NFT authenticates its exact phase-known whole bank images;
        // an old standalone raw fence must not reject its OWN partial writes.
        // Keep every original live/owner/power/epoch fence at all phases.
        if (options?.nativeTransaction === true) {
          // The host's explicit paired-phase guard must likewise not mistake
          // this journal/its phase-known PROFILE for an unrelated save writer.
          const allowed = host.assertWritable({nativeTransaction:true});
          check(allowed !== false && !thenable(allowed), 'read-only', 'This native source owner is no longer writable.');
          if (!c.powerTransition) {
            check(host.eligible({nativeTransaction:true}) === true, 'ineligible', 'The original foreground source is no longer eligible.');
            check(!power().powerPaused, 'power-paused', 'The original source power policy changed.');
          }
          verifyLive(c);
        } else confirmedFence(c);
      }
      return true;
    }
    function prepareStage(token) {
      assertStage(token); const f = nativeStages.get(token), p = f.commit;
      return {result:M.copyData(f.result),at:p ? p.now : f.clock?.now,
        ...(p ? {run:M.copyData(p.proposal.run),beforeProfileJSON:p.c.profileJSON,beforeRunJSON:p.c.runJSON} : {})};
    }
    function publishStage(token) {
      const f = nativeStages.get(token), p = f?.commit;
      try {
        check(f && p && !f.consumed && !f.published && f.epoch === epoch && !destroyed && !uncertain, 'native-stage-consumed', 'This native source is not an unpublished committed stage.');
        retentionGuard(); const c = p.c, next = liveContext(), r = next.source;
        // The paired host may legitimately add Player XP/new200 and its strict
        // whole mirrors. Preserve original run identities and exact source money,
        // income and cursor; authenticate the WHOLE current readback, not old XP.
        check(next.run === c.run && next.profile === c.profile && r._uiId === c.id && next.page === c.page &&
          next.powerKey === c.powerKey && host.stamp() === c.stamp && f.epoch === epoch && !destroyed && !uncertain,
          'native-committed-context', 'The confirmed native source no longer matches its original context.');
        check(host.read('run') === next.runJSON && host.ownRaw('run') === next.runJSON &&
          host.read('profile') === next.profileJSON && host.ownRaw('profile') === next.profileJSON &&
          r.money === p.proposal.run.money && r.stats.moneyEarned === p.proposal.run.stats.moneyEarned &&
          serialized(M.normalize(r.passiveMoney)) === serialized(M.normalize(p.proposal.run.passiveMoney)),
          'native-committed-mismatch', 'The whole confirmed native readback does not match the original Passive Money source.');
        // Earliest confirmed point: debit before ANY foreign publication/UI.
        finishGameSpeed(f.boostToken,true);
        f.published = true; observation = null; carry = null;
        // Fresh actual readback is an eligible zero-work observation boundary.
        // A new sequence/legitimate level-up anchors HERE, never from old tail.
        if(nativeGameSpeed)observeGameSpeed();
        return true;
      }catch(error){if(f?.boostToken&&!f.published)pauseNativeBudget(error);throw error;}
    }
    function finishStage(token) {
      const f = nativeStages.get(token);
      check(f && f.published && !f.finished && !f.consumed, 'native-stage-consumed', 'A committed source can publish its effects only once.');
      f.finished = true; const result = M.copyData(f.result);
      if (typeof host.changed === 'function') host.changed(result);
      return result;
    }
    function discardStage(token, error) {
      const f = nativeStages.get(token);
      if (!f || f.consumed || f.published) return false;
      f.consumed = true;
      if(error&&f.boostToken)pauseNativeBudget(error);
      else if (error && (error.attempted === true || error.reloadRequired === true)) { uncertain = true; epoch++; observation = null; carry = null; discardGameSpeed(); }
      finishGameSpeed(f.boostToken,false);
      return true;
    }
    function destroy() { destroyed = true; resetObservation(); }
    return Object.freeze({status,start,tick,syncPower,observeGameSpeed,resetObservation,destroy,stageCommand,assertStage,prepareStage,publishStage,finishStage,discardStage});
  }
  return Object.freeze({create});
}));
