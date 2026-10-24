/* Same-entry, standalone-capable survey runner. Never persists response values. */
(function (root, factory) {
  'use strict';
  var generator = typeof module === 'object' && module.exports ? require('./surveys') : root.BOSurveys;
  var api = factory(root, generator);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BOSurveyRunner = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, S) {
  'use strict';
  var SESSION_PREFIX = 'danis-table.survey-session.', LEASE_MS = 15000, MAX_SPEED_STRIKES = 3;
  var STATUSES = ['qualified', 'in-progress', 'completed', 'disqualified'];
  var SIGNALS = ['too-fast', 'attention', 'repetition', 'keyboard-smash'];
  var active = null, closing = null;
  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function error(code) { var e = new Error(code); e.code = code; return e; }
  function check(ok, code) { if (!ok) throw error(code || 'invalid'); }
  function time(value) { return Number.isSafeInteger(value) && value >= 0 && value <= 8640000000000000; }
  function identifier(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value); }
  function normalizeSession(value, id) {
    check(S && value && typeof value === 'object' && !Array.isArray(value));
    check(value.version === 1 && identifier(value.id) && value.id === id && time(value.createdAt));
    check(typeof value.returnUrl === 'string' && value.returnUrl.length > 0 && value.returnUrl.length <= 4096);
    check((typeof value.seed === 'string' && value.seed.length <= 256) || Number.isSafeInteger(value.seed));
    check(STATUSES.indexOf(value.status) >= 0 && Number.isSafeInteger(value.index));
    var offer;
    try { offer = S.normalizeOffer(value.offer); } catch (_) { throw error('invalid'); }
    var modern = Object.prototype.hasOwnProperty.call(value, 'questionnaireVersion');
    check(!modern || value.questionnaireVersion === 2 || value.questionnaireVersion === S.QUESTIONNAIRE_VERSION);
    check(modern || !Object.prototype.hasOwnProperty.call(value, 'intro'));
    var questions = S.generateQuestions(offer, value.seed, value.questionnaireVersion), quality = value.quality === undefined ? [] : value.quality;
    check(value.index >= 0 && value.index <= offer.questionCount && Array.isArray(quality) && quality.length === value.index);
    if (value.status === 'qualified') check(value.index === 0);
    if (value.status === 'completed') check(value.index === offer.questionCount && time(value.completedAt) && value.completedAt >= value.createdAt);
    else check(value.index < offer.questionCount);
    var sum = 0;
    quality = quality.map(function (q, i) {
      check(q && q.questionId === questions[i].id && q.ok === true && time(q.elapsedMs) && q.elapsedMs >= S.SPEED_FLOORS[questions[i].type]);
      sum += q.elapsedMs; check(Number.isSafeInteger(sum));
      return {questionId: q.questionId, elapsedMs: q.elapsedMs, ok: true};
    });
    var revision = value.revision === undefined ? 0 : value.revision, elapsed = value.elapsedMs === undefined ? 0 : value.elapsedMs;
    check(Number.isSafeInteger(revision) && revision >= 0 && revision < Number.MAX_SAFE_INTEGER && time(elapsed) && elapsed === sum);
    var updated = value.updatedAt === undefined ? value.createdAt : value.updatedAt;
    check(time(updated) && updated >= value.createdAt);
    var out = {version: 1, id: id, offer: offer, seed: value.seed, createdAt: value.createdAt, returnUrl: value.returnUrl, status: value.status, index: value.index, revision: revision, elapsedMs: elapsed, quality: quality, updatedAt: updated};
    if (modern) {
      var intro = value.intro;
      check(intro && typeof intro === 'object' && !Array.isArray(intro) && ['captcha', 'welcome', 'ready'].indexOf(intro.phase) >= 0);
      var fields = ['phase'].concat(intro.phase !== 'captcha' ? ['captchaPassedAt'] : [], intro.phase === 'ready' ? ['welcomeAcceptedAt'] : []);
      check(Object.keys(intro).length === fields.length && fields.every(function (k) { return Object.prototype.hasOwnProperty.call(intro, k); }));
      if (intro.phase !== 'captcha') check(time(intro.captchaPassedAt) && intro.captchaPassedAt >= value.createdAt && intro.captchaPassedAt <= updated);
      if (intro.phase === 'ready') check(time(intro.welcomeAcceptedAt) && intro.welcomeAcceptedAt >= intro.captchaPassedAt && intro.welcomeAcceptedAt <= updated);
      else check(value.index === 0 && ['qualified', 'in-progress'].indexOf(value.status) >= 0);
      if (value.status === 'qualified') check(intro.phase === 'captcha');
      if (intro.phase === 'ready' && value.status === 'in-progress') check(value.questionStartedAt >= intro.welcomeAcceptedAt);
      out.questionnaireVersion = value.questionnaireVersion; out.intro = clone(intro);
    }
    if (value.economyGeneration !== undefined) { check(typeof value.economyGeneration === 'string' && value.economyGeneration.length > 0 && value.economyGeneration.length <= 256); out.economyGeneration = value.economyGeneration; }
    if (value.epoch !== undefined) { check(Number.isSafeInteger(value.epoch) && value.epoch >= 0); out.epoch = value.epoch; }
    if (value.startedAt !== undefined) { check(time(value.startedAt) && value.startedAt >= value.createdAt); out.startedAt = value.startedAt; }
    if (value.status === 'in-progress') { check(time(value.questionStartedAt) && value.questionStartedAt >= value.createdAt); out.questionStartedAt = value.questionStartedAt; }
    if (value.status === 'completed') out.completedAt = value.completedAt;
    if (value.status === 'disqualified') { check(time(value.disqualifiedAt) && value.disqualifiedAt >= value.createdAt && SIGNALS.indexOf(value.reason) >= 0); out.disqualifiedAt = value.disqualifiedAt; out.reason = value.reason; }
    var strikes = value.strikes === undefined ? {speed: 0} : value.strikes;
    check(strikes && Number.isSafeInteger(strikes.speed) && strikes.speed >= 0 && strikes.speed <= MAX_SPEED_STRIKES);
    out.strikes = {speed: strikes.speed};
    var failures = value.failures === undefined ? [] : value.failures;
    check(Array.isArray(failures) && failures.length <= MAX_SPEED_STRIKES + 1);
    out.failures = failures.map(function (f) { check(f && Number.isInteger(f.index) && f.index >= 0 && f.index <= value.index && SIGNALS.indexOf(f.reason) >= 0 && time(f.at) && f.at >= value.createdAt); return {index: f.index, reason: f.reason, at: f.at}; });
    check(out.failures.filter(function (f) { return f.reason === 'too-fast'; }).length === strikes.speed);
    if (value.status !== 'completed' && value.status !== 'disqualified' && value.lease !== undefined) { check(value.lease && identifier(value.lease.owner) && time(value.lease.expiresAt)); out.lease = {owner: value.lease.owner, expiresAt: value.lease.expiresAt}; }
    return out;
  }
  function identity(s) { return JSON.stringify([s.id, s.offer, s.seed, s.createdAt, s.returnUrl, s.economyGeneration, s.epoch, s.questionnaireVersion]); }
  function safeReturnUrl(returnUrl, currentUrl, id) {
    var base;
    try { base = new URL(currentUrl); } catch (_) { return null; }
    if (['https:', 'http:', 'file:', 'content:'].indexOf(base.protocol) < 0) return null;
    var target;
    try { target = new URL(returnUrl, base.href); } catch (_) { target = new URL(base.href); }
    // A survey can only return to the entry file that is currently running it.
    // For opaque file/content origins, compare protocol and host as well.
    if (target.origin !== base.origin || target.protocol !== base.protocol || target.host !== base.host || target.pathname !== base.pathname || target.search !== base.search || target.username || target.password) target = new URL(base.href);
    target.hash = 'survey-return=' + encodeURIComponent(identifier(id) ? id : 'invalid-session');
    return target.href;
  }
  function navigateReturn(location, returnUrl, id) {
    if (!location) return false;
    var target = safeReturnUrl(returnUrl, location.href, id);
    if (!target) return false;
    // Hash-only replace is same-document. Force normal app initialization even
    // when the runner was inlined in a single standalone HTML entry.
    location.replace(target);
    location.reload();
    return true;
  }
  function createController(env) {
    env = env || {};
    check(identifier(env.id) && identifier(env.owner));
    var key = SESSION_PREFIX + env.id, snapshot = null, fingerprint = null, pending = Promise.resolve();
    function now() { var n = env.now ? env.now() : Date.now(); check(time(n), 'clock'); return n; }
    function read() {
      var raw;
      try { raw = env.storage.getItem(key); } catch (_) { throw error('storage'); }
      check(raw !== null && raw !== undefined, 'missing');
      var value;
      try { value = JSON.parse(raw); } catch (_) { throw error('invalid'); }
      var session = normalizeSession(value, env.id), token = identity(session);
      if (fingerprint !== null) check(token === fingerprint, 'changed');
      else fingerprint = token;
      return {raw: raw, session: session};
    }
    function commit(previous, next, at) {
      check(next.revision < Number.MAX_SAFE_INTEGER - 1, 'invalid');
      next.revision++; next.updatedAt = Math.max(at, next.updatedAt);
      var raw = JSON.stringify(next), fresh;
      try { fresh = env.storage.getItem(key); } catch (_) { throw error('storage'); }
      check(fresh !== null, 'missing'); check(fresh === previous.raw, 'stale');
      try { env.storage.setItem(key, raw); check(env.storage.getItem(key) === raw, 'stale'); } catch (e) { throw e.code ? e : error('storage'); }
      snapshot = clone(next);
      return {ok: true, reason: 'ok', session: clone(next)};
    }
    function ownership(s, at) { check(!s.lease || s.lease.owner === env.owner || s.lease.expiresAt <= at, 'duplicate'); }
    function operation(kind, expectedIndex, value) {
      var previous = read(), s = previous.session, at = now(); snapshot = clone(s);
      check(at >= s.createdAt && at >= s.updatedAt, 'clock');
      if (s.status === 'completed' || s.status === 'disqualified') {
        if (kind === 'resume' || kind === 'heartbeat' || kind === 'release') return {ok: true, reason: 'ok', session: clone(s)};
        return {ok: false, reason: 'terminal', session: clone(s)};
      }
      if (kind === 'resume') {
        ownership(s, at);
        if (s.status === 'qualified') { s.status = 'in-progress'; s.startedAt = at; s.questionStartedAt = at; }
        s.lease = {owner: env.owner, expiresAt: at + LEASE_MS};
        return commit(previous, s, at);
      }
      check(s.status === 'in-progress', 'stale');
      // Never allow a submission/heartbeat from a stale tab to claim ownership.
      // A new tab must first resume and observe a vacant/expired lease.
      check(s.lease && s.lease.owner === env.owner, 'duplicate');
      if (kind === 'release') { delete s.lease; return commit(previous, s, at); }
      if (kind === 'heartbeat') { s.lease.expiresAt = at + LEASE_MS; return commit(previous, s, at); }
      if (kind === 'captcha' || kind === 'welcome') {
        check((s.questionnaireVersion === 2 || s.questionnaireVersion === S.QUESTIONNAIRE_VERSION) && s.intro.phase === (kind === 'captcha' ? 'captcha' : 'welcome'), 'intro');
        if (kind === 'captcha') {
          check(typeof value === 'string' && value.trim() === S.captchaChallenge(s.id, s.seed).expected, 'captcha');
          s.intro = {phase: 'welcome', captchaPassedAt: at};
        } else { s.intro.phase = 'ready'; s.intro.welcomeAcceptedAt = at; s.questionStartedAt = at; }
        s.lease.expiresAt = at + LEASE_MS;
        return commit(previous, s, at);
      }
      check(!s.intro || s.intro.phase === 'ready', 'intro');
      check(expectedIndex === s.index, 'stale');
      check(at >= s.questionStartedAt, 'clock');
      var q = S.generateQuestions(s.offer, s.seed, s.questionnaireVersion)[s.index], elapsed = at - s.questionStartedAt, result = S.answerQuality(q, value, elapsed);
      if (!result.ok) {
        if (SIGNALS.indexOf(result.reason) >= 0) {
          s.failures.push({index: s.index, reason: result.reason, at: at});
          if (result.reason === 'too-fast') s.strikes.speed++;
          if (result.reason !== 'too-fast' || s.strikes.speed >= MAX_SPEED_STRIKES) { s.status = 'disqualified'; s.reason = result.reason; s.disqualifiedAt = at; delete s.lease; delete s.questionStartedAt; }
          else s.lease.expiresAt = at + LEASE_MS;
          commit(previous, s, at);
        }
        return {ok: false, reason: result.reason, session: clone(s)};
      }
      s.quality.push({questionId: q.id, elapsedMs: elapsed, ok: true}); s.elapsedMs += elapsed; s.index++;
      if (s.index === s.offer.questionCount) { s.status = 'completed'; s.completedAt = at; delete s.lease; delete s.questionStartedAt; }
      else { s.questionStartedAt = at; s.lease.expiresAt = at + LEASE_MS; }
      return commit(previous, s, at);
    }
    function run(kind, expectedIndex, value) {
      var task = pending.then(function () {
        var work = function () { return operation(kind, expectedIndex, value); };
        if (env.locks && typeof env.locks.request === 'function') return env.locks.request(key, {mode: 'exclusive'}, work);
        // The fallback is deliberately synchronous inside a transaction, with
        // lease ownership plus fresh serialized state/revision checked before
        // and after every write. Browser Web Locks provide full serialization.
        return work();
      }).catch(function (e) { return {ok: false, reason: e.code || 'storage', session: clone(snapshot)}; });
      pending = task.then(function () {});
      return task;
    }
    return Object.freeze({resume: function () { return run('resume'); }, submitCaptcha: function (value) { return run('captcha', undefined, value); }, acceptWelcome: function () { return run('welcome'); }, submit: function (index, value) { return run('submit', index, value); }, heartbeat: function () { return run('heartbeat'); }, release: function () { return run('release'); }, getState: function () { return clone(snapshot); }, getQuestion: function () { return snapshot && snapshot.status === 'in-progress' && (!snapshot.intro || snapshot.intro.phase === 'ready') ? S.generateQuestions(snapshot.offer, snapshot.seed, snapshot.questionnaireVersion)[snapshot.index] : null; }});
  }
  var MESSAGES = {
    captcha: 'Try the local sum again. This game check never contacts a CAPTCHA service.', intro: 'Complete the local CAPTCHA and welcome screen before answering questions.',
    empty: 'Please complete the answer. Use invented details only.', invalid: 'This answer or saved session is not valid. Please check it and try again.',
    'too-fast': 'Please take a moment to read before continuing. Three speeding attempts end the survey.', attention: 'The explicit attention check was missed.',
    repetition: 'The answer contains a clear repeated spam pattern.', 'keyboard-smash': 'The answer is a recognisable keyboard-smash sequence.',
    storage: 'Browser storage is unavailable or full. Progress has NOT been confirmed. Free space or allow local storage, then retry.',
    duplicate: 'This survey is open in another tab. Continue there, or close it and retry here after 15 seconds.',
    stale: 'Progress changed in another tab. Reload the saved question before continuing.', missing: 'This saved survey is missing or was reset. It cannot be recreated here.',
    changed: 'This survey was replaced or the game was reset. This tab cannot update it.', clock: 'The device clock moved backwards. Restore the clock, then retry.', terminal: 'This survey has already ended.'
  };
  var CSS = [
    'body.bo-survey-page{margin:0!important;padding:0!important;min-height:100vh!important;background:#f5f7fa!important;color:var(--bo-survey-ink,#1d3044)!important;color-scheme:light!important;font:16px/1.5 system-ui,-apple-system,sans-serif!important;overflow:auto!important;text-shadow:none!important}body.bo-survey-page *{box-sizing:border-box}body.bo-survey-page [hidden]{display:none!important}',
    'body.bo-survey-page[data-survey-provider=theorem]{--bo-survey-primary:#7543a6;--bo-survey-primary-dark:#552979;--bo-survey-tint:#f5effc;--bo-survey-accent:#906700;--bo-survey-focus:#b18416;--bo-survey-attention:#e0b83c;--bo-survey-ink:#352346;--bo-survey-muted:#665574;background:#fff!important}body.bo-survey-page[data-survey-provider=bitlabs]{--bo-survey-primary:#236dba;--bo-survey-primary-dark:#18558f;--bo-survey-tint:#edf5fd;--bo-survey-accent:#236dba;--bo-survey-focus:#236dba;--bo-survey-attention:#236dba;--bo-survey-ink:#18344f;--bo-survey-muted:#49647e;background:#fff!important}',
    '.bo-survey-shell{width:min(760px,100%);margin:0 auto;padding:28px 20px 48px}.bo-survey-eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;color:var(--bo-survey-accent,#39705d)}.bo-survey-shell h1,.bo-survey-shell h2{letter-spacing:normal;text-transform:none;font-family:inherit;color:var(--bo-survey-ink,#1d3044)}.bo-survey-shell h1{font-size:clamp(25px,5vw,34px);line-height:1.2;margin:10px 0}.bo-survey-shell h2{font-size:21px;line-height:1.4;margin:0 0 18px}.bo-survey-shell p{margin:10px 0}.bo-survey-muted{color:var(--bo-survey-muted,#526375);font-size:14px}.bo-survey-card{background:#fff;border:1px solid #d8e0e8;border-radius:18px;padding:24px;margin:18px 0;box-shadow:0 6px 24px #18354c09}.bo-survey-meta{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:14px;color:var(--bo-survey-muted,#526375)}.bo-survey-progress{margin-top:12px}.bo-survey-progress progress{display:block;width:100%;height:12px;accent-color:var(--bo-survey-primary,#34735f)}.bo-survey-progress-label{display:block;font-size:14px;font-weight:700;margin-bottom:6px}',
    '.bo-survey-choice{display:flex;gap:12px;align-items:center;padding:14px;border:1px solid #cbd6df;border-radius:10px;cursor:pointer;margin:10px 0;background:#fff}.bo-survey-choice:has(input:checked){background:var(--bo-survey-tint,#edf7f1);border-color:var(--bo-survey-primary,#34735f)}.bo-survey-shell input[type=radio]{width:20px;height:20px;accent-color:var(--bo-survey-primary,#34735f);flex:none}.bo-survey-shell textarea{font:inherit;display:block;width:100%;min-height:125px;padding:14px;border:1px solid #9caebd;border-radius:9px;background:#fff;color:var(--bo-survey-ink,#1d3044);resize:vertical}.bo-survey-shell input[type=range]{width:100%;height:38px;accent-color:var(--bo-survey-primary,#34735f)}.bo-survey-slider-labels{display:flex;justify-content:space-between;gap:18px;font-size:14px}.bo-survey-slider-output{display:block;font-size:26px;font-weight:700;text-align:center;margin:14px}',
    '.bo-survey-shell button{appearance:none;font:inherit;font-weight:700;line-height:1.4;border:1px solid var(--bo-survey-primary-dark,#28614f);border-radius:10px;background:var(--bo-survey-primary,#34735f);color:white;padding:12px 18px;min-height:46px;cursor:pointer;text-shadow:none;box-shadow:none;position:static;transform:none;white-space:normal}.bo-survey-shell button:hover{background:var(--bo-survey-primary-dark,#285b4b)}.bo-survey-shell button:disabled{opacity:.6;cursor:wait}.bo-survey-shell .bo-survey-secondary{background:white;color:var(--bo-survey-primary-dark,#285b4b);border-color:#b4c3cc}.bo-survey-shell .bo-survey-secondary:hover{background:var(--bo-survey-tint,#edf7f1);color:var(--bo-survey-primary-dark,#285b4b)}.bo-survey-shell button:focus-visible,.bo-survey-shell input:focus-visible,.bo-survey-shell textarea:focus-visible{outline:3px solid var(--bo-survey-focus,#3d88c5);outline-offset:3px}.bo-survey-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:20px}.bo-survey-error{color:#973d2b;font-weight:600;min-height:24px;margin-top:16px}.bo-survey-attention{border-left:4px solid var(--bo-survey-attention,#6d59a3);padding-left:14px}',
    '.bo-survey-media{margin:16px 0;background:#edf7fb;border:1px solid #d6e5ec;border-radius:13px;overflow:hidden}.bo-survey-media svg,.bo-survey-media img{display:block;width:100%;height:auto;max-height:280px}.bo-survey-media figcaption{padding:10px 14px;font-size:13px;color:#355064}.bo-survey-animation .bo-survey-motion{animation:bo-survey-glide 5s ease-in-out infinite alternate!important}.bo-survey-clip-timeline{height:5px;background:#cadbe2;overflow:hidden}.bo-survey-clip-timeline span{display:block;width:100%;height:100%;background:var(--bo-survey-primary,#34735f);transform-origin:left;animation:bo-survey-timeline 5s linear infinite!important}.bo-survey-animation.is-paused .bo-survey-motion,.bo-survey-animation.is-paused .bo-survey-clip-timeline span{animation-play-state:paused!important}.bo-survey-clip-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px}.bo-survey-clip-controls button{font-size:14px;min-height:38px;padding:7px 10px}@keyframes bo-survey-glide{from{transform:translateX(-85px)}to{transform:translateX(150px)}}@keyframes bo-survey-timeline{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
    '.bo-survey-grid-wrap{overflow-x:auto;margin:16px 0 22px;border:1px solid #d6e0e7;border-radius:10px}.bo-survey-grid{width:100%;min-width:360px;border-collapse:collapse;font-size:14px;background:white}.bo-survey-grid caption{text-align:left;padding:12px;font-weight:700;background:var(--bo-survey-tint,#f2f6f8)}.bo-survey-grid th,.bo-survey-grid td{padding:12px 8px;text-align:center;border-bottom:1px solid #e4eaf0;vertical-align:middle}.bo-survey-grid th[scope=row]{text-align:left;min-width:100px}.bo-survey-grid th[scope=col]{font-weight:600;max-width:110px}.bo-survey-grid td label{display:flex;justify-content:center;align-items:center;min-height:34px;cursor:pointer}.bo-survey-grid tr:last-child>*{border-bottom:0}',
    'body.bo-survey-page[data-survey-stars="1"]{--bo-survey-primary:#62635b;--bo-survey-primary-dark:#41433d;--bo-survey-tint:#f2f1e9;--bo-survey-accent:#52534b;--bo-survey-focus:#465d7d;background:#e9e8e1!important}body[data-survey-stars="1"] .bo-survey-card{border:2px solid #9b9c91;border-radius:2px;box-shadow:3px 3px 0 #d2d0c5;background:#fbfaf5;background-image:none}body[data-survey-stars="1"] .bo-survey-choice{border-radius:1px}body[data-survey-stars="2"] .bo-survey-card{border-radius:8px;box-shadow:0 2px 4px #30443b12;background-image:linear-gradient(#fff,#fafbf9)}body[data-survey-stars="2"] .bo-survey-choice{border-radius:5px}body[data-survey-stars="4"] .bo-survey-card{border-radius:22px;box-shadow:0 10px 30px #194e4214;background-image:linear-gradient(150deg,#fff,#f4faf8)}body[data-survey-stars="5"] .bo-survey-card{border:1px solid #b6d8d5;border-top:4px solid var(--bo-survey-primary,#34735f);border-radius:26px;box-shadow:0 16px 45px #194e4221;background-image:linear-gradient(135deg,#fff 35%,#edfaf5 75%,#edf3ff)}body[data-survey-stars="5"] .bo-survey-choice{border-radius:13px;border-color:#bfd3cf}body[data-survey-stars="5"] .bo-survey-eyebrow{color:var(--bo-survey-primary,#28654e)}.bo-survey-quality{display:flex;gap:8px 15px;flex-wrap:wrap;align-items:center;font-size:13px;margin:14px 0;color:var(--bo-survey-muted,#526375)}.bo-survey-quality strong{color:var(--bo-survey-accent,#775607)}.bo-survey-quality button{font-size:12px;min-height:34px;padding:5px 9px}.bo-survey-captcha-label{display:block;font-size:19px;font-weight:700;margin:16px 0 10px}.bo-survey-shell .bo-survey-captcha-input{font:inherit;min-height:48px;width:160px;max-width:100%;padding:10px;border:2px solid #809b93;border-radius:6px;background:#fff;color:#1d3044}.bo-survey-grid-wrap:has(.bo-survey-grid-7){max-width:100%}.bo-survey-grid-7{min-width:820px}.bo-survey-grid-7 td label{min-width:44px;min-height:44px}.bo-survey-grid-7 th[scope=col]{min-width:88px}.bo-survey-procedural{display:block;width:100%;height:auto;aspect-ratio:12/5}.bo-survey-video{display:block;width:100%;max-height:300px;background:#17241e;aspect-ratio:16/9;object-fit:contain}.bo-survey-video[hidden]{display:none!important}.bo-survey-footage{margin:20px 0 0;border-top:1px solid #cadad2;padding-top:14px}.bo-survey-footage p{font-size:13px;color:#355064}.bo-survey-footage-status{font-size:13px}body[data-survey-stars="1"] .bo-survey-procedural{image-rendering:pixelated;filter:saturate(.3)}body[data-survey-stars="2"] .bo-survey-procedural{filter:saturate(.7)}body[data-survey-stars="1"] .bo-survey-video{filter:grayscale(.8) saturate(.4) blur(1.6px)}body[data-survey-stars="2"] .bo-survey-video{filter:saturate(.65) blur(.7px)}body[data-survey-stars="3"] .bo-survey-video{filter:saturate(.9)}body[data-survey-stars="4"] .bo-survey-video{filter:saturate(1.06) contrast(1.03)}body[data-survey-stars="5"] .bo-survey-video{filter:none}body[data-survey-stars="1"] .bo-survey-answer-text{filter:blur(.25px)}body[data-survey-stars="2"] .bo-survey-answer-text{filter:blur(.1px)}body .bo-survey-choice:focus-within .bo-survey-answer-text,body[data-sharp-answers="yes"] .bo-survey-answer-text{filter:none}.bo-survey-media svg text{filter:none}',
    '.bo-survey-video-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:14px;min-width:0;padding:0;margin:18px 0;border:0}.bo-survey-video-options legend{float:left;grid-column:1/-1;width:100%;padding:0;margin:0 0 12px}.bo-survey-video-option{display:flex;flex-direction:column;min-width:0;padding:12px;border:1px solid #cbd6df;border-radius:12px;background:#fff}.bo-survey-video-option:has(input:checked){border-color:var(--bo-survey-primary,#34735f);box-shadow:0 0 0 2px var(--bo-survey-primary,#34735f)}.bo-survey-option-video{display:block;width:100%;max-height:240px;aspect-ratio:16/9;object-fit:contain;background:#15202b;border-radius:7px}.bo-survey-video-option .bo-survey-choice{margin:14px 0 0;min-height:52px}.bo-survey-video-description{font-size:14px;line-height:1.5}.bo-survey-video-credit,.bo-survey-video-option .bo-survey-footage-status{font-size:12px;line-height:1.5;color:var(--bo-survey-muted,#526375);overflow-wrap:anywhere}.bo-survey-video-option .bo-survey-choice{margin-top:auto}.bo-survey-video-preview{margin:0 0 14px}.bo-survey-video-credit a{color:var(--bo-survey-primary-dark,#285b4b);text-decoration:underline}.bo-survey-option-video:focus-visible,.bo-survey-video-credit a:focus-visible{outline:3px solid var(--bo-survey-focus,#3d88c5);outline-offset:3px}',
    '@media(prefers-contrast:more),(forced-colors:active){body .bo-survey-answer-text,body .bo-survey-procedural,body .bo-survey-video{filter:none!important}.bo-survey-shell button:focus-visible,.bo-survey-shell input:focus-visible{outline:3px solid Highlight}}@media(max-width:420px){.bo-survey-shell{padding:20px 12px 32px}.bo-survey-card{padding:18px 14px}.bo-survey-shell h2{font-size:19px}.bo-survey-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){.bo-survey-animation:not(.motion-opt-in) .bo-survey-motion,.bo-survey-animation:not(.motion-opt-in) .bo-survey-clip-timeline span{animation:none!important}}'
    ,'body.bo-survey-page #bo-survey-username-badge{position:fixed;top:max(8px,env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));z-index:100;display:block;max-width:calc(100vw - 24px);padding:4px 10px;border:1px solid #b4c3cc;border-radius:8px;background:#fff;color:#1d3044;font:700 12px/20px system-ui,-apple-system,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}body.bo-survey-page .bo-survey-shell{padding-top:58px}body.bo-survey-page #player-username-badge{display:none!important}'
  ].join('\n');
  function start(options) {
    options = options || {};
    var w = root, d = w && w.document, explicit = Object.prototype.hasOwnProperty.call(options, 'sessionId');
    if (!d || !d.body || !w.location || (!explicit && !/^#survey(?:=|$)/.test(w.location.hash))) return false;
    if (closing) return false;
    var id = options.sessionId;
    if (!explicit) { try { id = decodeURIComponent(w.location.hash.slice(8)); } catch (_) { id = ''; } }
    if (active) return !explicit || active.id === id;
    var owner;
    try { owner = 'tab-' + w.crypto.randomUUID(); } catch (_) { owner = 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); }
    // Local document-provider grants can be lost even by reopening a hash URL.
    // Park (never destroy/detach) the live game so its clocks can still find HUDs.
    var mounted = options.mount === true || ['content:', 'file:'].indexOf(w.location.protocol) >= 0;
    var view = {id: id, mounted: mounted, controller: null, heartbeat: null, timer: null, redirect: null, busy: false, renderedIndex: null, closed: false, listeners: [], mediaCleanups: [], sharpAnswers: false};
    active = view;
    function current() { return active === view && !view.closed; }
    function listen(target, name, fn) { target.addEventListener(name, fn); view.listeners.push(function () { target.removeEventListener(name, fn); }); }
    var surface = d.body, parked = null, saved = null;
    if (mounted) {
      saved = {attributes: Array.from(d.body.attributes, function (a) { return [a.name, a.value]; }), title: d.title, focus: d.activeElement, x: w.scrollX, y: w.scrollY};
      parked = d.createElement('div'); parked.id = 'bo-survey-game'; parked.hidden = true; parked.inert = true; parked.setAttribute('aria-hidden', 'true'); parked.style.setProperty('display', 'none', 'important');
      // Move nodes, not HTML strings: native handlers and game identity survive.
      while (d.body.firstChild) parked.appendChild(d.body.firstChild);
      surface = d.createElement('div'); surface.id = 'bo-survey-host'; surface.tabIndex = -1;
      d.body.appendChild(parked); d.body.appendChild(surface);
      ['click', 'pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'contextmenu', 'keydown', 'keyup', 'input', 'change', 'submit'].forEach(function (name) { listen(surface, name, function (event) { event.stopPropagation(); }); });
    }
    view.close = function (closeOptions) {
      closeOptions = closeOptions || {};
      if (view.closed) return view.closing;
      view.closed = true; stopHeartbeat(); clearRedirect(); clearMedia();
      if (view.timer !== null) { w.clearInterval(view.timer); view.timer = null; }
      view.listeners.forEach(function (remove) { remove(); }); view.listeners = [];
      if (view.style) view.style.remove();
      if (mounted) {
        // Restore synchronously, before callers reset/render or await release.
        surface.remove();
        while (parked.firstChild) d.body.insertBefore(parked.firstChild, parked);
        parked.remove();
        Array.from(d.body.attributes).forEach(function (a) { d.body.removeAttribute(a.name); });
        saved.attributes.forEach(function (a) { d.body.setAttribute(a[0], a[1]); }); d.title = saved.title;
        if (saved.focus && saved.focus.isConnected) saved.focus.focus({preventScroll: true});
        w.scrollTo(saved.x, saved.y);
      }
      if (active === view) active = null;
      var release = view.controller && closeOptions.preserveSession !== true ? view.controller.release() : Promise.resolve();
      view.closing = Promise.resolve(release).then(async function () {
        if (closeOptions.notify === false) return true;
        var onReturn = options.onReturn || (mounted && w.BOApp && w.BOApp.surveys && w.BOApp.surveys.returnFromSurvey);
        if (onReturn) await onReturn(); // Host revalidates canonical completion; no reward is trusted here.
        return true;
      }).catch(function (e) { if (w.console) w.console.warn('Survey return could not refresh:', e.message); return false; }).finally(function () { if (closing === view.closing) closing = null; });
      closing = view.closing; return view.closing;
    };
    function element(tag, text, className) { var e = d.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }
    function button(text, fn, secondary, idValue) { var b = element('button', text, secondary ? 'bo-survey-secondary' : ''); b.type = 'button'; if (idValue) b.id = idValue; b.addEventListener('click', fn); return b; }
    function state() { return view.controller && view.controller.getState(); }
    function navigate() {
      if (!current() || view.navigating) return;
      view.navigating = true;
      if (mounted) { void view.close(); return; }
      var s = state();
      if (!navigateReturn(w.location, s ? s.returnUrl : w.location.href, id)) view.navigating = false;
    }
    function clearRedirect() { if (view.redirect !== null) { w.clearTimeout(view.redirect); view.redirect = null; } }
    function stopHeartbeat() { if (view.heartbeat !== null) { w.clearInterval(view.heartbeat); view.heartbeat = null; } }
    function clearMedia() { view.mediaCleanups.forEach(function (cleanup) { cleanup(); }); view.mediaCleanups = []; }
    // Read-only nickname display. No session, account or response identity is stored.
    function surveyUsername() {
      var prefs = null, generation;
      try { var raw = w.localStorage.getItem('danis-table.settings.v1'); if (raw !== null && raw.length <= 4 * 1024 * 1024) prefs = JSON.parse(raw); } catch (_) {}
      try { var m = w.BOSaveSlots && w.BOSaveSlots.peek(w.localStorage); if (m) generation = m.slots[m.active - 1].generation; } catch (_) {}
      return w.BOPlayerIdentity ? w.BOPlayerIdentity.displayUsername(prefs, generation) : 'LocalPlayer';
    }
    // Runner-owned, read-only companion: normal game nodes stay parked/inert.
    // Refreshing its snapshot cannot answer, pause or advance this questionnaire.
    function refreshEmerald() {
      var presentation = w.BOEmeraldSurvey, target = surface.querySelector('#emerald-survey-slot');
      if (!target) return;
      var details = target.querySelector('details'), wasOpen = details ? details.open : view.emeraldOpen === true;
      var hadFocus = target.contains(d.activeElement) || view.emeraldFocus === true;
      function restoreFocus() {
        if (!hadFocus) return;
        // A removed companion never focuses, clicks or changes an answer control.
        var next = target.querySelector('summary') || surface.querySelector('#bo-survey-shell h1');
        if (next) next.focus({preventScroll: true});
      }
      try {
        var snapshot = presentation ? presentation.readSnapshot(w.localStorage, id, Date.now()) : null;
        var signature = JSON.stringify(snapshot) + ':' + (view.emeraldQuestion ? view.emeraldQuestion.type : 'none');
        d.body.classList.toggle('bo-survey-emerald-rich', !!snapshot && snapshot.level >= 41);
        if (view.emeraldSignature === signature) return;
        var sameOrigin = !!snapshot && view.emeraldOrigin === snapshot.identity;
        view.emeraldSignature = signature; view.emeraldOrigin = snapshot ? snapshot.identity : null; target.replaceChildren();
        if (snapshot) {
          if (!presentation.render(d, target, snapshot, view.emeraldQuestion)) throw Error('Emerald presentation unavailable.');
          var replacement = target.querySelector('details'); if (replacement) replacement.open = sameOrigin && wasOpen;
        }
        view.emeraldOpen = false; view.emeraldFocus = false; restoreFocus();
      } catch (_) {
        target.replaceChildren(); view.emeraldSignature = null; view.emeraldOrigin = null; view.emeraldOpen = false; view.emeraldFocus = false;
        d.body.classList.remove('bo-survey-emerald-rich'); restoreFocus();
      }
    }
    function frame(title, emeraldQuestion) {
      var prior = surface.querySelector('#emerald-survey-slot'), priorDetails = prior && prior.querySelector('details');
      view.emeraldOpen = !!priorDetails && priorDetails.open; view.emeraldFocus = !!prior && prior.contains(d.activeElement);
      view.emeraldQuestion = emeraldQuestion || null; view.emeraldSignature = null;
      clearRedirect(); clearMedia(); d.body.className = 'bo-survey-page'; surface.replaceChildren(); d.title = 'Fictional survey — Balatro Online';
      var session = state(); d.body.dataset.surveyProvider = session && session.offer.provider ? session.offer.provider : 'cpx';
      var quality = session && S.runnerQuality(session.offer.stars); d.body.dataset.surveyStars = quality ? String(quality.stars) : '3'; d.body.dataset.sharpAnswers = view.sharpAnswers ? 'yes' : 'no';
      var shell = element('main', undefined, 'bo-survey-shell'); shell.id = 'bo-survey-shell';
      var identity = element('div', '@' + surveyUsername(), 'bo-survey-username-badge'); identity.id = 'bo-survey-username-badge'; identity.setAttribute('data-player-username', ''); shell.appendChild(identity);
      shell.appendChild(element('div', 'ORIGINAL GAME SURVEY', 'bo-survey-eyebrow')); var titleNode = element('h1', title); titleNode.tabIndex = -1; shell.appendChild(titleNode);
      shell.appendChild(element('p', 'Use fictional answers, never real personal information. Local-only · game currency only · no survey-company affiliation.', 'bo-survey-muted'));
      if (quality) {
        var rating = element('div', undefined, 'bo-survey-quality'); rating.appendChild(element('strong', '★'.repeat(quality.stars) + ' · ' + quality.label));
        rating.appendChild(element('span', 'Stars set presentation quality, never the saved reward.'));
        if (quality.stars <= 2) { var sharp = button(view.sharpAnswers ? 'Answer text is sharp' : 'Keep answers sharp', function () { view.sharpAnswers = !view.sharpAnswers; d.body.dataset.sharpAnswers = view.sharpAnswers ? 'yes' : 'no'; sharp.setAttribute('aria-pressed', String(view.sharpAnswers)); sharp.textContent = view.sharpAnswers ? 'Answer text is sharp' : 'Keep answers sharp'; }, true, 'bo-survey-sharp'); sharp.setAttribute('aria-pressed', String(view.sharpAnswers)); rating.appendChild(sharp); }
        shell.appendChild(rating);
      }
      var emeraldSlot = element('div'); emeraldSlot.id = 'emerald-survey-slot'; shell.appendChild(emeraldSlot);
      surface.appendChild(shell); refreshEmerald(); return shell;
    }
    function renderError(reason) {
      if (!current()) return;
      stopHeartbeat(); var shell = frame('Survey paused'), card = element('section', undefined, 'bo-survey-card');
      card.appendChild(element('p', MESSAGES[reason] || MESSAGES.invalid));
      var actions = element('div', undefined, 'bo-survey-actions');
      if (view.controller && ['missing', 'changed'].indexOf(reason) < 0) actions.appendChild(button('Retry saved survey', resume, false, 'bo-survey-retry'));
      actions.appendChild(button('Return to game', navigate, true, 'bo-survey-return')); card.appendChild(actions); shell.appendChild(card);
    }
    function renderTerminal(s) {
      if (!current()) return;
      stopHeartbeat(); var complete = s.status === 'completed', shell = frame(complete ? 'Thanks for completing the survey!' : 'This survey has ended'), card = element('section', undefined, 'bo-survey-card');
      if (complete) card.appendChild(element('p', 'Your completed status is saved on this device. Return to the game to collect the game-currency reward.'));
      else card.appendChild(element('p', (MESSAGES[s.reason] || 'This fictional survey did not qualify.') + ' No reward was earned.'));
      card.appendChild(element('p', 'Returning to your game shortly…', 'bo-survey-muted'));
      card.appendChild(button('Return to game', navigate, false, 'bo-survey-return')); shell.appendChild(card);
      view.redirect = w.setTimeout(navigate, 6000);
    }
    function renderIntro(s) {
      var captcha = s.intro.phase === 'captcha', shell = frame(captcha ? 'Local CAPTCHA' : 'Welcome to the Survey!'), card = element('section', undefined, 'bo-survey-card'), message = element('p', '', 'bo-survey-error'); message.id = 'bo-survey-error'; message.setAttribute('role', 'alert');
      async function advance(control, value) {
        if (!current() || view.busy) return; view.busy = true; control.disabled = true; message.textContent = '';
        var result = captcha ? await view.controller.submitCaptcha(value) : await view.controller.acceptWelcome(); view.busy = false;
        if (!current()) return; control.disabled = false;
        if (result.ok) { if (result.session.intro.phase === 'ready') renderQuestion(result.session); else renderIntro(result.session); w.scrollTo(0, 0); }
        else if (['captcha', 'intro', 'storage', 'clock'].indexOf(result.reason) >= 0) message.textContent = MESSAGES[result.reason];
        else renderError(result.reason);
      }
      if (captcha) {
        card.appendChild(element('p', 'A simple local game check — not a real bot-security service. No external CAPTCHA, tracking or account is used.', 'bo-survey-muted'));
        var form = element('form'); form.id = 'bo-survey-captcha-form'; form.noValidate = true;
        var label = element('label', S.captchaChallenge(s.id, s.seed).prompt, 'bo-survey-captcha-label'); label.htmlFor = 'bo-survey-captcha-answer';
        var input = element('input', undefined, 'bo-survey-captcha-input'); input.id = 'bo-survey-captcha-answer'; input.name = 'captcha'; input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 3; input.setAttribute('aria-describedby', message.id);
        var submit = element('button', 'Verify local CAPTCHA'); submit.id = 'bo-survey-captcha-submit'; submit.type = 'submit'; var actions = element('div', undefined, 'bo-survey-actions'); actions.appendChild(submit);
        form.appendChild(label); form.appendChild(input); form.appendChild(message); form.appendChild(actions); form.addEventListener('submit', function (event) { event.preventDefault(); void advance(submit, input.value); }); card.appendChild(form);
      } else {
        card.appendChild(element('p', 'The local CAPTCHA is complete. Take your time and use invented details. Your questionnaire and listed game reward are saved on this device.'));
        card.appendChild(element('p', s.questionnaireVersion === 3 ? 'This questionnaire includes clear instruction checks, seven-by-seven preference tables and real nature-video choices. Videos start paused and muted. Watching is optional; every video choice has a text description if its preview is unavailable.' : 'This questionnaire includes clear instruction checks and seven-by-seven preference tables. Media can be paused; optional real-world footage has a local illustration fallback.', 'bo-survey-muted'));
        card.appendChild(message); var begin = button('Begin survey', function () { void advance(begin); }, false, 'bo-survey-begin'); card.appendChild(begin);
      }
      shell.appendChild(card); shell.appendChild(button('Pause and return to game', async function () { if (!current() || view.busy) return; view.busy = true; if (!mounted) await view.controller.release(); navigate(); }, true, 'bo-survey-return'));
      view.renderedIndex = 'intro-' + s.intro.phase;
    }
    function elapsedText(s) { var elapsed = s.elapsedMs + (s.questionStartedAt ? Math.max(0, Date.now() - s.questionStartedAt) : 0), sec = Math.floor(elapsed / 1000); return 'Time elapsed ' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
    function grid(form, table, tableId) {
      var wrap = element('div', undefined, 'bo-survey-grid-wrap'), node = element('table', undefined, 'bo-survey-grid' + (table.rows.length === 7 && table.columns.length === 7 ? ' bo-survey-grid-7' : ''));
      wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', (table.label || 'Preference table') + ' — scroll sideways if needed');
      node.appendChild(element('caption', table.label || 'Rate each feature'));
      var head = element('thead'), headRow = element('tr'), blank = element('th', 'Feature'); blank.scope = 'col'; headRow.appendChild(blank);
      table.columns.forEach(function (c) { var th = element('th', c.label); th.scope = 'col'; headRow.appendChild(th); }); head.appendChild(headRow); node.appendChild(head);
      var body = element('tbody');
      table.rows.forEach(function (row) {
        var tr = element('tr'), th = element('th', row.label); th.scope = 'row'; tr.appendChild(th);
        table.columns.forEach(function (c) {
          var td = element('td'), label = element('label'), input = element('input'); input.type = 'radio'; input.name = tableId + '.' + row.id; input.value = c.value; input.dataset.table = tableId; input.dataset.row = row.id; input.setAttribute('aria-label', table.label + ': ' + row.label + ' — ' + c.label); label.appendChild(input); td.appendChild(label); tr.appendChild(td);
        }); body.appendChild(tr);
      }); node.appendChild(body); wrap.appendChild(node); form.appendChild(wrap);
    }
    function readAnswer(form, q) {
      if (q.type === 'text') return form.querySelector('textarea[name="answer"]').value;
      if (q.type === 'slider') { var range = form.querySelector('input[type="range"]'); return range.dataset.touched === 'yes' ? Number(range.value) : null; }
      if (q.type === 'table' || q.type === 'double-table') {
        var tables = q.type === 'table' ? [{id: 'main', rows: q.rows}] : q.tables, value = {};
        tables.forEach(function (table) { var group = {}; table.rows.forEach(function (row) { var selected = form.querySelector('input[data-table="' + table.id + '"][data-row="' + row.id + '"]:checked'); if (selected) group[row.id] = selected.value; }); value[table.id] = group; });
        return q.type === 'table' ? value.main : value;
      }
      var selected = form.querySelector('input[name="answer"]:checked'); return selected ? selected.value : null;
    }
    function drawScene(ctx, spec, phase) {
      // Bounded, original procedural scenery. This is illustration, not footage.
      var detail = spec.detail, x = 260 + Math.sin(phase * Math.PI * 2) * 105, y = 159, colour = spec.colour;
      ctx.setTransform(spec.width / 640, 0, 0, spec.height / 267, 0, 0); ctx.clearRect(0, 0, 640, 267);
      function ellipse(cx, cy, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
      function gradient(x1, y1, x2, y2, a, b) { var g = ctx.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
      ctx.fillStyle = detail >= 3 ? gradient(0, 0, 0, 240, '#77b9e0', '#e9f6f5') : '#d5e2e6'; ctx.fillRect(0, 0, 640, 267);
      if (detail >= 4) { var glow = ctx.createRadialGradient(520, 49, 8, 520, 49, 90); glow.addColorStop(0, '#fff9dce8'); glow.addColorStop(1, '#fff9dc00'); ctx.fillStyle = glow; ctx.fillRect(430, 0, 180, 145); }
      ellipse(520, 49, 24, 24, detail >= 3 ? '#ffe5a0' : '#e3d6af');
      for (var cloud = 0; cloud < detail; cloud++) { var cx = 55 + cloud * 137; ellipse(cx, 53 + cloud % 2 * 20, 31, 10, '#ffffffa0'); if (detail >= 3) ellipse(cx - 9, 47 + cloud % 2 * 20, 18, 15, '#ffffffaa'); }
      ctx.beginPath(); ctx.moveTo(0, 161); ctx.bezierCurveTo(100, 78, 180, 146, 280, 118); ctx.bezierCurveTo(400, 60, 500, 152, 640, 99); ctx.lineTo(640, 267); ctx.lineTo(0, 267); ctx.fillStyle = detail >= 3 ? gradient(0, 110, 0, 267, '#80b9a0', '#406f68') : '#a6b3a6'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 188); ctx.bezierCurveTo(220, 132, 380, 233, 640, 157); ctx.lineTo(640, 267); ctx.lineTo(0, 267); ctx.fillStyle = detail >= 3 ? gradient(0, 175, 0, 267, '#bad1a3', '#6d9369') : '#bfc6ad'; ctx.fill();
      if (spec.object === 'car') { ctx.fillStyle = '#66777d'; ctx.fillRect(0, 179, 640, 35); ctx.strokeStyle = '#e6e4ca'; ctx.lineWidth = 2; ctx.setLineDash([24, 18]); ctx.beginPath(); ctx.moveTo(0, 201); ctx.lineTo(640, 201); ctx.stroke(); ctx.setLineDash([]); y = 167; }
      if (spec.object === 'bee') y = 123 + Math.sin(phase * Math.PI * 4) * 7;
      if (detail >= 3) ellipse(x + 5, spec.object === 'bee' ? 187 : y + 33, 49, 8, '#173c332c');
      ctx.save(); ctx.translate(x, y);
      if (spec.object === 'car') {
        ctx.fillStyle = detail >= 3 ? gradient(0, -35, 0, 21, '#e4edf0', colour) : colour; ctx.beginPath(); ctx.moveTo(-49, 5); ctx.lineTo(-37, -12); ctx.lineTo(-21, -32); ctx.lineTo(21, -32); ctx.lineTo(41, -11); ctx.lineTo(53, -4); ctx.lineTo(53, 18); ctx.lineTo(-49, 18); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#254e66'; ctx.beginPath(); ctx.moveTo(-28, -13); ctx.lineTo(-16, -27); ctx.lineTo(15, -27); ctx.lineTo(29, -13); ctx.closePath(); ctx.fill();
        ellipse(-29, 19, 12, 12, '#23343e'); ellipse(32, 19, 12, 12, '#23343e');
        if (detail >= 3) { ellipse(-29, 19, 6, 6, '#b6c7d0'); ellipse(32, 19, 6, 6, '#b6c7d0'); ctx.fillStyle = '#fff3a4'; ctx.fillRect(44, -1, 8, 5); ctx.fillStyle = '#f08b73'; ctx.fillRect(-49, 0, 5, 5); }
        if (detail >= 4) { ctx.strokeStyle = '#ffffff8c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-37, -5); ctx.lineTo(37, -5); ctx.stroke(); ctx.fillStyle = '#274756'; ctx.fillRect(3, -8, 2, 22); ctx.fillRect(10, -4, 8, 2); }
      } else if (spec.object === 'bee') {
        ellipse(-12, -21, 16, 25, '#eaf9ffb8'); ellipse(14, -19, 17, 25, '#eaf9ffd0');
        var bee = detail >= 3 ? ctx.createRadialGradient(-10, -12, 2, 0, 0, 37) : null; if (bee) { bee.addColorStop(0, '#fff5ad'); bee.addColorStop(0.6, '#eec44c'); bee.addColorStop(1, '#ad7f1b'); }
        ellipse(0, 0, 35, 23, bee || '#d1be6b'); ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 35, 23, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#303d3e'; ctx.fillRect(-16, -25, 9, 50); ctx.fillRect(4, -25, 9, 50); ctx.restore(); ellipse(25, -5, 3, 3, '#142831'); if (detail >= 4) ellipse(24, -6, 1, 1, '#fff');
      } else if (spec.object === 'ball') {
        var ball = detail >= 3 ? ctx.createRadialGradient(-12, -15, 2, 0, 0, 34) : null; if (ball) { ball.addColorStop(0, '#ffecb8'); ball.addColorStop(0.5, colour); ball.addColorStop(1, '#334859'); }
        ellipse(0, 0, 33, 33, ball || colour); ctx.strokeStyle = '#284152'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-33, 0); ctx.lineTo(33, 0); ctx.moveTo(0, -33); ctx.bezierCurveTo(-22, -13, -22, 15, 0, 33); ctx.moveTo(0, -33); ctx.bezierCurveTo(22, -13, 22, 15, 0, 33); ctx.stroke();
      } else {
        ctx.beginPath(); for (var point = 0; point < 10; point++) { var angle = -Math.PI / 2 + point * Math.PI / 5, radius = point % 2 ? 17 : 36; if (!point) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius); else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } ctx.closePath(); ctx.fillStyle = detail >= 3 ? gradient(-25, -35, 25, 35, '#fff1b9', colour) : colour; ctx.fill(); if (detail >= 4) { ctx.strokeStyle = '#ffffffbd'; ctx.lineWidth = 2; ctx.stroke(); }
      }
      ctx.restore();
      if (detail >= 2) for (var grass = 0; grass < detail * 12; grass++) { var gx = (grass * 83 + 11) % 640, gy = 235 + grass % 6 * 5; ctx.strokeStyle = detail >= 4 ? '#385f4b89' : '#6d856c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 7 - grass % 4); ctx.stroke(); if (detail >= 4 && grass % 3 === 0) { ellipse(gx - 3, gy - 9, 3, 3, ['#fff5c8', '#f2bfc5', '#d8e6ff'][grass % 3]); } }
    }
    function procedural(figure, q, reduced) {
      var spec = q.media, canvas = element('canvas', undefined, 'bo-survey-procedural'); canvas.width = spec.width; canvas.height = spec.height; canvas.dataset.fps = String(spec.fps); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', q.alt); var ctx;
      try { ctx = canvas.getContext('2d', {alpha: false}); } catch (_) {}
      if (!ctx) return null;
      figure.appendChild(canvas);
      var paused = reduced || q.type !== 'animation', alive = true, request = null, last = -Infinity, started = null;
      function paint(stamp) { if (!alive || paused) return; if (started === null) started = stamp; if (stamp - last >= 1000 / spec.fps) { drawScene(ctx, spec, (stamp - started) % 5000 / 5000); last = stamp; } request = w.requestAnimationFrame(paint); }
      function setPaused(value) { paused = value; canvas.dataset.paused = String(paused); figure.classList.toggle('is-paused', paused); if (request !== null) { w.cancelAnimationFrame(request); request = null; } if (!paused) request = w.requestAnimationFrame(paint); }
      drawScene(ctx, spec, 0); setPaused(paused);
      var hidden = function () { if (d.hidden) setPaused(true); }; d.addEventListener('visibilitychange', hidden);
      view.mediaCleanups.push(function () { alive = false; if (request !== null) w.cancelAnimationFrame(request); d.removeEventListener('visibilitychange', hidden); });
      return {toggle: function () { setPaused(!paused); return paused; }};
    }
    function footage(form) {
      var box = element('section', undefined, 'bo-survey-footage'), title = element('p', 'Optional real-world flower footage · bundled CC0 preview. The question refers to the local illustration above, not this preview.'), video = element('video', undefined, 'bo-survey-video'), status = element('p', 'Real footage preview starts paused. Playback is optional; the illustrated question always works offline.', 'bo-survey-footage-status');
      video.src = 'survey-flower.mp4'; video.controls = true; video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata'; video.setAttribute('aria-label', 'Optional real-world flower footage, separate from the question');
      function ready() { video.dataset.ready = 'yes'; }
      function failed() { video.hidden = true; status.textContent = 'Real-world preview unavailable. Local illustrated fallback above remains available offline.'; }
      function hidden() { if (d.hidden) video.pause(); }
      video.addEventListener('loadedmetadata', ready); video.addEventListener('error', failed); d.addEventListener('visibilitychange', hidden);
      view.mediaCleanups.push(function () { video.removeEventListener('loadedmetadata', ready); video.removeEventListener('error', failed); d.removeEventListener('visibilitychange', hidden); video.pause(); video.removeAttribute('src'); video.load(); });
      box.appendChild(title); box.appendChild(video); box.appendChild(status); form.appendChild(box);
    }
    function videoOptions(form, q) {
      var group = element('fieldset', undefined, 'bo-survey-video-options'), players = [], removers = [];
      group.appendChild(element('legend', 'Choose one clip. Previewing is optional; playback controls do not select an answer.', 'bo-survey-muted'));
      function trusted(id) {
        // Saved questions/URLs are never consulted. Only the shipped, ID-bound
        // catalog can supply a source: an exact bundled path or build embedding.
        var fallback = S.VIDEO_OPTIONS[id], catalog = w.BOSurveyVideos, entry = null;
        if (!fallback) return null;
        try { if (catalog && typeof catalog.get === 'function') entry = catalog.get(id); } catch (_) {}
        if (!entry || entry.id !== id) entry = {};
        function text(value, limit) { return typeof value === 'string' && value.trim() && value.length <= limit ? value : ''; }
        var src = typeof entry.src === 'string' && (entry.src === 'survey-' + id + '.mp4' || /^data:video\/mp4;base64,[A-Za-z0-9+/]+={0,2}$/.test(entry.src)) ? entry.src : null;
        function link(value) {
          try { var url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
        }
        return {label: text(entry.label, 200) || fallback.label, description: text(entry.description, 2000) || fallback.description, credit: text(entry.credit, 500), license: text(entry.license, 200), sourceUrl: link(entry.sourceUrl), licenseUrl: link(entry.licenseUrl), changes: text(entry.changes, 500) || 'Shortened, resized and muted.', src: src};
      }
      q.videoOptions.forEach(function (choice) {
        var clip = trusted(choice.id); if (!clip) return;
        var card = element('article', undefined, 'bo-survey-video-option'), video = element('video', undefined, 'bo-survey-video bo-survey-option-video');
        var prefix = 'bo-survey-' + choice.id, description = element('p', clip.description, 'bo-survey-video-description'), status = element('p', 'Starts paused · watching is optional. Choose below using the video or description.', 'bo-survey-footage-status');
        card.dataset.videoId = choice.id; video.dataset.videoId = choice.id;
        description.id = prefix + '-description'; status.id = prefix + '-status'; status.setAttribute('role', 'status');
        video.controls = true; video.autoplay = false; video.loop = false; video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'metadata';
        video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-label', clip.label + ' — optional nature video preview'); video.setAttribute('aria-describedby', description.id);
        function ready() { video.dataset.ready = 'yes'; }
        function failed() { video.pause(); video.hidden = true; video.dataset.ready = 'no'; status.textContent = 'Preview unavailable. You can still choose this option using its description; no viewing is required.'; }
        function playing() { if (video.paused) return; players.forEach(function (other) { if (other !== video) other.pause(); }); if (d.hidden) video.pause(); }
        video.addEventListener('loadedmetadata', ready); video.addEventListener('error', failed); video.addEventListener('play', playing); video.addEventListener('playing', playing);
        players.push(video);
        removers.push(function () {
          video.removeEventListener('loadedmetadata', ready); video.removeEventListener('error', failed); video.removeEventListener('play', playing); video.removeEventListener('playing', playing);
          video.pause(); video.removeAttribute('src'); video.load();
        });
        if (clip.src) video.src = clip.src; else failed();
        var figure = element('figure', undefined, 'bo-survey-video-preview'), caption = element('figcaption');
        figure.appendChild(video); caption.appendChild(description); caption.appendChild(status);
        if (clip.credit || clip.license) {
          caption.appendChild(element('p', [clip.credit ? 'Footage: ' + clip.credit : '', clip.license ? 'License: ' + clip.license : ''].filter(Boolean).join(' · '), 'bo-survey-video-credit'));
          var attribution = element('p', clip.changes, 'bo-survey-video-credit');
          [['Source', clip.sourceUrl], ['License', clip.licenseUrl]].forEach(function (item) {
            if (!item[1]) return; var anchor = element('a', item[0]); anchor.href = item[1]; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; attribution.appendChild(d.createTextNode(' · ')); attribution.appendChild(anchor);
          });
          caption.appendChild(attribution);
        }
        figure.appendChild(caption); card.appendChild(figure);
        // Deliberately separate from <video>: no label/card click handler wraps
        // media controls, so playing, seeking or changing volume cannot answer.
        var label = element('label', undefined, 'bo-survey-choice'), input = element('input'); input.type = 'radio'; input.name = 'answer'; input.value = choice.id; input.id = prefix + '-answer'; input.setAttribute('aria-describedby', description.id + ' ' + status.id);
        label.htmlFor = input.id; label.appendChild(input); label.appendChild(element('span', clip.label, 'bo-survey-answer-text')); card.appendChild(label); group.appendChild(card);
      });
      function hidden() { if (d.hidden) players.forEach(function (video) { video.pause(); }); }
      d.addEventListener('visibilitychange', hidden);
      view.mediaCleanups.push(function () { d.removeEventListener('visibilitychange', hidden); removers.forEach(function (remove) { remove(); }); });
      form.appendChild(group);
    }
    function media(form, q) {
      var figure = element('figure', undefined, 'bo-survey-media' + (q.type === 'animation' ? ' bo-survey-animation' : q.type === 'attention' ? ' bo-survey-attention-media' : ''));
      // q.svg comes ONLY from the local pure generator, never from saved media
      // URLs, entered text, the hash, or an external service.
      var reduced = !!options.reducedMotion || !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches), clip = q.media && procedural(figure, q, reduced);
      if (!clip) { var scene = element('div'); scene.innerHTML = q.svg; figure.appendChild(scene); if (q.media) figure.appendChild(element('p', 'Local SVG fallback · canvas unavailable', 'bo-survey-muted')); }
      if (q.type === 'animation') {
        if (reduced) figure.classList.add('is-paused');
        var timeline = element('div', undefined, 'bo-survey-clip-timeline'); timeline.setAttribute('aria-hidden', 'true'); timeline.appendChild(element('span')); figure.appendChild(timeline);
        figure.appendChild(element('figcaption', q.animation.label + '. ' + q.animation.description));
        var controls = element('div', undefined, 'bo-survey-clip-controls'), toggle = button(reduced ? 'Play animation' : 'Pause animation', function () {
          var paused = clip ? clip.toggle() : figure.classList.toggle('is-paused'); if (!paused) figure.classList.add('motion-opt-in'); toggle.textContent = paused ? 'Play animation' : 'Pause animation'; toggle.setAttribute('aria-pressed', String(!paused));
        }, true); toggle.setAttribute('aria-pressed', String(!reduced)); controls.appendChild(toggle); controls.appendChild(element('span', '0:05 local loop · no audio', 'bo-survey-muted')); figure.appendChild(controls);
      } else figure.appendChild(element('figcaption', q.alt));
      form.appendChild(figure);
      if (q.media && q.type === 'animation') footage(form);
    }
    function renderQuestion(s) {
      if (!current()) return;
      var q = view.controller.getQuestion(); if (!q) return renderError('invalid');
      var shell = frame(s.offer.topic, q), meta = element('div', undefined, 'bo-survey-meta'), timer = element('span', elapsedText(s)); timer.id = 'bo-survey-timer'; meta.appendChild(timer); meta.appendChild(element('span', 'Fictional questionnaire')); shell.appendChild(meta);
      if (s.offer.showProgress) {
        var progressWrap = element('div', undefined, 'bo-survey-progress'), label = element('span', Math.floor(s.index / s.offer.questionCount * 100) + '% complete', 'bo-survey-progress-label'), progress = element('progress'); progress.id = 'bo-survey-progress'; progress.max = s.offer.questionCount; progress.value = s.index; progress.setAttribute('aria-label', 'Survey progress'); progressWrap.appendChild(label); progressWrap.appendChild(progress); shell.appendChild(progressWrap);
      }
      var card = element('section', undefined, 'bo-survey-card'), form = element('form'); form.id = 'bo-survey-form'; form.dataset.questionType = q.type; form.noValidate = true;
      var heading = element('h2', q.prompt, q.type === 'attention' ? 'bo-survey-attention' : ''); heading.id = 'bo-survey-prompt'; form.setAttribute('aria-labelledby', heading.id); form.appendChild(heading);
      if (q.variant) form.dataset.attentionVariant = q.variant;
      if (!q.videoOptions && (q.type === 'image' || q.type === 'animation' || (q.type === 'attention' && q.svg))) media(form, q);
      if (q.videoOptions) videoOptions(form, q);
      else if (q.type === 'text') {
        var text = element('textarea'); text.name = 'answer'; text.minLength = q.minLength; text.maxLength = q.maxLength; text.placeholder = 'Invent a short answer — no personal details'; text.setAttribute('aria-label', 'Your fictional answer'); form.appendChild(text); form.appendChild(element('p', '2–240 characters. Any language is welcome.', 'bo-survey-muted'));
      } else if (q.type === 'slider') {
        var output = element('output', 'Move the slider to answer', 'bo-survey-slider-output'), range = element('input'); range.type = 'range'; range.name = 'answer'; range.min = q.min; range.max = q.max; range.step = q.step; range.value = (q.min + q.max) / 2; range.dataset.touched = 'no'; range.setAttribute('aria-label', 'Preference from ' + q.min + ' to ' + q.max);
        function touched() { range.dataset.touched = 'yes'; output.textContent = range.value + ' / ' + q.max; }
        range.addEventListener('input', touched); range.addEventListener('change', touched); form.appendChild(output); form.appendChild(range); var labels = element('div', undefined, 'bo-survey-slider-labels'); labels.appendChild(element('span', q.min + ' — ' + q.minLabel)); labels.appendChild(element('span', q.max + ' — ' + q.maxLabel)); form.appendChild(labels);
      } else if (q.type === 'table' || q.type === 'double-table') {
        form.appendChild(element('p', 'On small screens, swipe each table sideways to see all choices.', 'bo-survey-muted'));
        if (q.type === 'table') grid(form, {label: 'Your fictional preferences', rows: q.rows, columns: q.columns}, 'main');
        else q.tables.forEach(function (t) { grid(form, t, t.id); });
      }
      else q.options.forEach(function (o) { var label = element('label', undefined, 'bo-survey-choice'), input = element('input'), text = element('span', o.label, 'bo-survey-answer-text'); input.type = 'radio'; input.name = 'answer'; input.value = o.value; if (q.type === 'attention' && Number.isInteger(o.fontSize)) { text.style.fontSize = o.fontSize + 'px'; text.style.lineHeight = '1.15'; input.setAttribute('aria-label', (q.variant === 'word-length' ? 'Word ' : 'Numeric value ') + o.label); } label.appendChild(input); label.appendChild(text); form.appendChild(label); });
      var message = element('p', '', 'bo-survey-error'); message.id = 'bo-survey-error'; message.setAttribute('role', 'alert'); form.appendChild(message);
      var actions = element('div', undefined, 'bo-survey-actions'), next = element('button', s.index === s.offer.questionCount - 1 ? 'Finish survey' : 'Continue'); next.id = 'bo-survey-continue'; next.type = 'submit'; actions.appendChild(next); form.appendChild(actions);
      form.addEventListener('submit', async function (event) {
        event.preventDefault(); if (!current() || view.busy) return; view.busy = true; next.disabled = true; message.textContent = '';
        // Response values exist only for this call and the visible form. Only
        // quality codes/timings can reach canonical storage.
        var result = await view.controller.submit(s.index, readAnswer(form, q)); view.busy = false;
        if (!current()) return;
        next.disabled = false;
        if (result.session && (result.session.status === 'completed' || result.session.status === 'disqualified')) { renderTerminal(result.session); return; }
        if (result.ok) { renderQuestion(result.session); w.scrollTo(0, 0); return; }
        if (['empty', 'invalid', 'too-fast'].indexOf(result.reason) >= 0) { message.textContent = MESSAGES[result.reason]; return; }
        if (['storage', 'clock'].indexOf(result.reason) >= 0) { message.textContent = MESSAGES[result.reason]; return; }
        renderError(result.reason);
      }); card.appendChild(form); shell.appendChild(card);
      shell.appendChild(element('p', 'Take your time. Explicit attention checks, three speeding attempts, or clear spam can end a survey. Your raw answers are not saved.', 'bo-survey-muted'));
      shell.appendChild(button('Pause and return to game', async function () { if (!current() || view.busy) return; view.busy = true; if (!mounted) await view.controller.release(); navigate(); }, true, 'bo-survey-return'));
      view.renderedIndex = s.index;
    }
    function startHeartbeat() {
      if (!current() || d.hidden || view.heartbeat !== null) return;
      view.heartbeat = w.setInterval(async function () {
        var result = await view.controller.heartbeat();
        if (!current()) return;
        if (!result.ok) { renderError(result.reason); return; }
        if (result.session.status === 'completed' || result.session.status === 'disqualified') renderTerminal(result.session);
      }, 5000);
    }
    async function resume() {
      if (!current() || view.busy || !view.controller) return;
      view.busy = true; var result = await view.controller.resume(); view.busy = false;
      if (!current()) return;
      if (!result.ok) { renderError(result.reason); return; }
      if (result.session.status === 'completed' || result.session.status === 'disqualified') renderTerminal(result.session);
      else {
        var intro = result.session.intro && result.session.intro.phase !== 'ready', key = intro ? 'intro-' + result.session.intro.phase : result.session.index;
        if (view.renderedIndex !== key || !surface.querySelector(intro ? '#bo-survey-error' : '#bo-survey-form')) { if (intro) renderIntro(result.session); else renderQuestion(result.session); }
        startHeartbeat();
      }
    }
    if (!d.getElementById('bo-survey-runner-style')) { var style = element('style', CSS); style.id = 'bo-survey-runner-style'; d.head.appendChild(style); view.style = style; }
    listen(w, 'pagehide', function () { void view.close({notify: false}); });
    frame('Opening your fictional survey…');
    if (mounted) surface.focus({preventScroll: true});
    if (!identifier(id) || !S) { renderError('invalid'); return true; }
    var storage = {getItem: function (key) { return w.localStorage.getItem(key); }, setItem: function (key, value) { if (typeof options.assertWritable === 'function') options.assertWritable(); if (w.BOEmeraldConduct) check(!w.BOEmeraldConduct.read(w.localStorage, Date.now()).active, 'conduct'); return w.localStorage.setItem(key, value); }};
    view.controller = createController({id: id, owner: owner, storage: storage, now: function () { return Date.now(); }, locks: w.navigator && w.navigator.locks});
    view.timer = w.setInterval(function () { var s = state(), node = surface.querySelector('#bo-survey-timer'); if (current() && s && node) node.textContent = elapsedText(s); if (current()) refreshEmerald(); }, 1000);
    listen(w, 'storage', function (event) {
      if (!current()) return;
      if (event.key === SESSION_PREFIX + id || event.key === null) {
        if (event.newValue === null) { renderError('missing'); return; }
        resume();
      }
    });
    listen(d, 'visibilitychange', function () {
      if (!current()) return;
      if (d.hidden) { stopHeartbeat(); void view.controller.release().then(function () { if (current() && !d.hidden) resume(); }); }
      else resume();
    });
    resume(); return true;
  }
  return Object.freeze({SESSION_PREFIX: SESSION_PREFIX, LEASE_MS: LEASE_MS, MAX_SPEED_STRIKES: MAX_SPEED_STRIKES, normalizeSession: normalizeSession, safeReturnUrl: safeReturnUrl, navigateReturn: navigateReturn, createController: createController, start: start, mountSession: function (id, options) { return start(Object.assign({}, options, {sessionId: id, mount: true})); }, close: function (options) { return active ? active.close(options) : closing || Promise.resolve(false); }, isMounted: function () { return !!(active && active.mounted); }, getState: function () { return active && active.controller ? active.controller.getState() : null; }, getQuestion: function () { return active && active.controller ? active.controller.getQuestion() : null; }});
});
