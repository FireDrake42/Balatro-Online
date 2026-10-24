/* Poker Table PWA support. Local-only, optional, and never reloads a running game. */
(function (root) {
  'use strict';
  if (!root || !root.document || root.BOPWA) return;

  const location = root.location;
  const script = root.document.currentScript;
  const base = new URL('./', script && script.src ? script.src : root.document.baseURI);
  let registration = null;
  let finishReady;
  const ready = new Promise(resolve => { finishReady = resolve; });
  const state = {
    state: 'initializing', supported: false, offlineReady: false,
    updateAvailable: false, scope: base.pathname, error: null
  };

  function getStatus() {
    let installed = !!root.navigator.standalone;
    try { installed = installed || root.matchMedia('(display-mode: standalone)').matches; }
    catch (_) { /* Old browsers can still play without an install check. */ }
    return Object.freeze({ ...state, installed });
  }
  function publish(changes) {
    Object.assign(state, changes);
    try { root.dispatchEvent(new root.CustomEvent('bopwa:status', { detail: getStatus() })); }
    catch (_) { /* Notifications are optional. */ }
    return getStatus();
  }
  function installInstructionsHTML() {
    return '<section aria-label="Install on iPad">' +
      '<h3>Play on iPad</h3>' +
      '<p>A Telegram or Files preview may not run JavaScript. A downloaded HTML file is not an installable web app.</p>' +
      '<ol><li>Ask a parent or guardian to approve hosting first. Nothing is uploaded automatically.</li>' +
      '<li>Open the approved HTTPS game URL directly in Safari, not in a Telegram preview.</li>' +
      '<li>Use Safari’s Share button, then Add to Home Screen. If shown, leave Open as Web App on, then tap Add.</li>' +
      '<li>Open the new icon while online once. Wait until offline support is ready before trying Airplane Mode.</li></ol>' +
      '<p>Tap the music button to enable audio. Keep Safari website data: clearing it can remove local saves and offline files. Back up important progress using the game’s own save export.</p>' +
      '<p>Updates never reload a hand. Finish playing, then close every game tab and Home Screen window before reopening online.</p>' +
      '</section>';
  }
  async function checkForUpdate() {
    await ready;
    if (!registration) return getStatus();
    try { await registration.update(); }
    catch (_) { publish({ error: 'Could not check for an update. The current game is unchanged.' }); }
    return getStatus();
  }
  root.BOPWA = Object.freeze({ getStatus, ready, installInstructionsHTML, checkForUpdate });

  // Do not even access the ServiceWorker API on file:// (including embedded standalone HTML).
  if (location.protocol === 'file:') {
    finishReady(publish({ state: 'file' }));
    return;
  }
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ||
    location.hostname === '[::1]';
  if (!((location.protocol === 'https:') || (location.protocol === 'http:' && local)) ||
      root.isSecureContext !== true) {
    finishReady(publish({ state: 'insecure' }));
    return;
  }
  if (!('serviceWorker' in root.navigator)) {
    finishReady(publish({ state: 'unsupported' }));
    return;
  }
  // The helper must never register a worker from a different origin or outside its directory.
  if (base.origin !== location.origin) {
    finishReady(publish({ state: 'unsupported' }));
    return;
  }
  publish({ supported: true });

  function updateStatus() {
    const waiting = !!registration.waiting;
    const active = !!registration.active && registration.active.state === 'activated';
    publish({
      state: waiting ? 'update-waiting' : active ? 'ready' : 'installing',
      offlineReady: active,
      updateAvailable: waiting,
      error: null
    });
    if (active) finishReady(getStatus());
  }
  const watched = new WeakSet();
  function watch(worker) {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener('statechange', () => {
      updateStatus();
      if (worker.state === 'redundant' && !registration.active) {
        finishReady(publish({ state: 'error', error: 'Offline support could not be installed. Play online and try again later.' }));
      }
    });
  }
  async function register() {
    try {
      registration = await root.navigator.serviceWorker.register(new URL('sw.js', base).href, {
        scope: base.href, updateViaCache: 'none'
      });
      registration.addEventListener('updatefound', () => {
        watch(registration.installing);
        updateStatus();
      });
      // Observe this exact registration: navigator.serviceWorker.ready could refer to
      // another worker already controlling a parent directory on the same origin.
      watch(registration.installing);
      watch(registration.active);
      updateStatus();
    } catch (_) {
      finishReady(publish({ state: 'error', error: 'Offline support is unavailable. The game can still play online.' }));
    }
  }
  // No install prompts, sharing, skipWaiting, controller-change reload, or game/save access.
  if (root.document.readyState === 'complete') register();
  else root.addEventListener('load', register, { once: true });
})(typeof window === 'undefined' ? null : window);
