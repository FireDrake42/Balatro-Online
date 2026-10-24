/* Poker Table audio: original scores plus bounded, verified local-only licensed recordings.
 * Original synthesis never touches engine RNG or saves. Licensed audio decodes lazily.
 * Call unlock() directly inside a trusted pointer/key event (not after an await).
 * chip/mult pitch is a scoring-step index: its pentatonic rise deliberately plateaus.
 */
(function (root) {
  'use strict';
  if (root.BOAudio) return;

  const LEGACY_TRACKS = Object.freeze([Object.freeze({
    id: 'poker_lounge', name: 'Midnight Felt', bpm: 92, bars: 16,
    description: 'Original relaxed poker-lounge instrumental.'
  }), Object.freeze({
    id: 'casino_lounge', name: 'Velvet Casino', bpm: 112, bars: 16,
    description: 'Original upbeat casino lounge: warm electric piano, a bright jazz hook and plucked bass.'
  }), Object.freeze({id:'starlight_felt',name:'Starlight Felt',bpm:84,bars:16,unlockLevel:27,description:'Original spacious E-minor bell waltz-feel over a four-beat brush pulse.'}), Object.freeze({id:'copper_groove',name:'Copper Groove',bpm:124,bars:16,unlockLevel:27,description:'Original B-flat major syncopated electric-piano and walking-bass groove.'})]);
  const MUSIC_DATA = root.BOMusicData && root.BOMusicData.version === 1 ? root.BOMusicData : null;
  const TRACKS = MUSIC_DATA ? MUSIC_DATA.tracks : LEGACY_TRACKS;
  const LICENSED_TRACKS = MUSIC_DATA ? (MUSIC_DATA.licensedTracks || [MUSIC_DATA.licensed]).filter(track => track && track.verified) : [];
  const LICENSED_BY_ID = new Map(LICENSED_TRACKS.map(track => [track.id, track]));
  const licensedFor = id => LICENSED_BY_ID.get(id);
  const actualPlayerLevel = value => Number.isInteger(value) && value >= 1 && value <= 100 ? value : 1;
  const tracksForPlayerLevel = actual => MUSIC_DATA && MUSIC_DATA.tracksForPlayerLevel ?
    MUSIC_DATA.tracksForPlayerLevel(actual) : TRACKS;
  const SCENES = Object.freeze(['table', 'boss', 'final_boss', 'last_chance', 'frenzy']);
  const sceneId = value => SCENES.includes(value) ? value : 'table';
  const DEFAULTS = Object.freeze({ sound: true, music: true, sfxVolume: 0.62,
    musicVolume: 0.44, muted: false, track: 'poker_lounge', bossDrama: false, playerLevel: 1 });
  const BPM = 92, BEAT = 60 / BPM, LOOP_BEATS = 64;
  const LOOKAHEAD = 0.15, TICK_MS = 50, FX_LIMIT = 16, MUSIC_LIMIT = 36;
  const PENTATONIC = [0, 2, 4, 7, 9, 12, 14];
  const SFX_NAMES = new Set(['select', 'deselect', 'deal', 'discard', 'play', 'chip',
    'mult', 'xmult', 'joker', 'coin', 'purchase', 'pack', 'win', 'lose', 'error', 'click', 'xp', 'money_gain']);
  const COALESCE = { deal: 0.018, chip: 0.027, mult: 0.035, xmult: 0.075,
    joker: 0.05, win: 0.25, lose: 0.25, pack: 0.12, purchase: 0.08, xp: 0.4, money_gain: 0.1 };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const number = (n, fallback) => {
    try { const v = Number(n); return Number.isFinite(v) ? v : fallback; }
    catch (_) { return fallback; }
  };
  const unit = (n, fallback) => clamp(number(n, fallback), 0, 1);
  const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
  function xpSemitones(options) {
    // Omitted amount is the exact legacy C–E–A chime. Explicit false awards
    // are silent; never coerce strings/objects or derive XP from a save/total.
    if (!options || !Object.prototype.hasOwnProperty.call(options, 'amount')) return 0;
    const amount = options.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
    const logarithm = Math.log1p(amount) / Math.LN10;
    // Strictly rising, gently compressed to less than one octave, even at MAX_VALUE.
    return 12 * logarithm / (3 + logarithm);
  }
  const audioConstructor = () => root.AudioContext || root.webkitAudioContext;
  const hidden = () => !!(root.document && root.document.hidden);

  // A private seeded generator: synthesis must never consume the game's random stream.
  function random(seed) {
    let state = seed >>> 0;
    return function () {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }
  function disconnect(node) { try { node.disconnect(); } catch (_) {} }
  function stop(source, at) { try { source.stop(at); } catch (_) {} }
  function ramp(param, value, now, seconds) {
    value = unit(value, 0);
    try {
      if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
      else { const held = param.value; param.cancelScheduledValues(now); param.setValueAtTime(held, now); }
      param.linearRampToValueAtTime(value, now + seconds);
    } catch (_) { try { param.value = value; } catch (_) {} }
  }
  function noiseBuffer(ctx) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.13), ctx.sampleRate);
    const data = buffer.getChannelData(0), rng = random(0x5f3759df);
    for (let i = 0; i < data.length; i++) data[i] = rng() * 2 - 1;
    return buffer;
  }
  function roomImpulse(ctx, seconds, seed) {
    const length = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate), rng = random(seed);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch); let colour = 0;
      for (let i = 0; i < length; i++) {
        colour = colour * 0.63 + (rng() * 2 - 1) * 0.37;
        const t = i / ctx.sampleRate;
        data[i] = colour * Math.exp(-6.6 * t / seconds) * Math.min(1, t / 0.009);
      }
      for (const [time, level] of [[0.019, 0.3], [0.037, 0.19], [0.061, 0.11]]) {
        const i = Math.floor((time + ch * 0.003) * ctx.sampleRate);
        if (i < length) data[i] += level;
      }
    }
    return buffer;
  }

  // Pure graph factory shared by realtime playback and independent offline previews.
  function makeGraph(ctx, prefs, offline) {
    const graph = { ctx, offline: !!offline, nodes: [], fx: new Set(), music: new Set(),
      fxAll: new Set(), musicAll: new Set(), noise: noiseBuffer(ctx), noiseOffset: 0, disposed: false };
    const own = node => { graph.nodes.push(node); return node; };
    graph.fxBus = own(ctx.createGain()); graph.musicBus = own(ctx.createGain());
    graph.master = own(ctx.createGain());
    graph.fxBus.gain.value = prefs.sound && !prefs.muted ? prefs.sfxVolume : 0;
    graph.musicBus.gain.value = prefs.music && !prefs.muted ? prefs.musicVolume : 0;
    graph.master.gain.value = 0.9;
    const highpass = own(ctx.createBiquadFilter());
    highpass.type = 'highpass'; highpass.frequency.value = 28; highpass.Q.value = 0.5;
    const compressor = own(ctx.createDynamicsCompressor());
    compressor.threshold.value = -13; compressor.knee.value = 18; compressor.ratio.value = 3;
    compressor.attack.value = 0.006; compressor.release.value = 0.19;
    const limiter = own(ctx.createWaveShaper()), curve = new Float32Array(2049);
    for (let i = 0; i < curve.length; i++) curve[i] = 0.89 * Math.tanh((i / 1024 - 1) * 1.14);
    limiter.curve = curve; limiter.oversample = '2x';
    graph.fxBus.connect(highpass); graph.musicBus.connect(highpass);
    highpass.connect(compressor); compressor.connect(limiter);
    limiter.connect(graph.master); graph.master.connect(ctx.destination);
    function room(seconds, seed, destination, level) {
      const input = own(ctx.createGain()), verb = own(ctx.createConvolver());
      const lowpass = own(ctx.createBiquadFilter()), wet = own(ctx.createGain());
      verb.buffer = roomImpulse(ctx, seconds, seed);
      lowpass.type = 'lowpass'; lowpass.frequency.value = 3200; lowpass.Q.value = 0.5;
      wet.gain.value = level;
      input.connect(verb); verb.connect(lowpass); lowpass.connect(wet); wet.connect(destination);
      return input;
    }
    graph.fxRoom = room(0.31, 0x12d04ad, graph.fxBus, 0.17);
    graph.musicRoom = room(0.94, 0x484f5553, graph.musicBus, 0.26);
    const real = new Float32Array([0, 0, 0, 0, 0, 0]);
    graph.pianoWave = ctx.createPeriodicWave(real, new Float32Array([0, 1, 0.23, 0.085, 0.025, 0.012]));
    return graph;
  }

  function voice(graph, kind, at, pan, wet) {
    const ctx = graph.ctx, registry = kind === 'fx' ? graph.fx : graph.music;
    const all = kind === 'fx' ? graph.fxAll : graph.musicAll;
    const limit = kind === 'fx' ? FX_LIMIT : MUSIC_LIMIT;
    if (!graph.offline && registry.size >= limit) registry.values().next().value.cancel(false);
    // Include fading voices in a separate hard bound, even if the context gets suspended.
    if (!graph.offline && all.size >= limit + 4) all.values().next().value.cancel(true);
    const output = ctx.createGain(), nodes = [output], sources = [];
    output.gain.value = 1;
    let destination = output, liveSources = 0, cleaned = false, cancelled = false;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner(); panner.pan.value = clamp(pan || 0, -0.7, 0.7);
      output.connect(panner); destination = panner; nodes.push(panner);
    }
    destination.connect(kind === 'fx' ? graph.fxBus : graph.musicBus);
    if (wet > 0) {
      const send = ctx.createGain(); send.gain.value = unit(wet, 0);
      destination.connect(send); send.connect(kind === 'fx' ? graph.fxRoom : graph.musicRoom);
      nodes.push(send);
    }
    function cleanup() {
      if (cleaned) return;
      cleaned = true; registry.delete(v); all.delete(v);
      for (const source of sources) source.onended = null;
      for (const node of nodes) disconnect(node);
      sources.length = 0; nodes.length = 0;
    }
    const v = {
      at, output,
      own(node) { nodes.push(node); return node; },
      source(source, startAt, endAt, offset) {
        sources.push(source); nodes.push(source); liveSources++;
        source.onended = () => { if (--liveSources === 0) cleanup(); };
        try {
          if (offset === undefined) source.start(startAt); else source.start(startAt, offset);
          source.stop(endAt);
        }
        catch (_) { if (--liveSources === 0) cleanup(); }
      },
      cancel(immediate) {
        if (cleaned || (cancelled && !immediate)) return;
        cancelled = true; registry.delete(v);
        const now = ctx.currentTime;
        if (!immediate) ramp(output.gain, 0, now, 0.018);
        for (const source of sources) stop(source, now + (immediate ? 0 : 0.022));
        if (immediate) cleanup();
      }
    };
    registry.add(v); all.add(v);
    return v;
  }
  function envelope(ctx, v, at, duration, level, attack, sustain, tail) {
    const gain = v.own(ctx.createGain()), param = gain.gain;
    const end = at + duration, a = Math.min(attack || 0.006, duration * 0.22);
    level = unit(level, 0);
    param.setValueAtTime(0, at);
    param.linearRampToValueAtTime(level, at + a);
    if (sustain !== undefined) {
      param.exponentialRampToValueAtTime(Math.max(0.00001, level * sustain), at + Math.min(duration * 0.4, 0.18));
    }
    if (tail !== undefined && duration > 0.28) {
      param.exponentialRampToValueAtTime(Math.max(0.00001, level * tail), end - 0.12);
      param.exponentialRampToValueAtTime(0.00001, end - 0.008);
    } else param.exponentialRampToValueAtTime(0.00001, Math.max(at + a + 0.001, end - 0.012));
    param.linearRampToValueAtTime(0, end);
    gain.connect(v.output);
    return gain;
  }
  function tone(graph, v, at, midi, length, level, shape, cutoff, attack, sustain) {
    const ctx = graph.ctx, osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(hz(midi), at);
    if (shape === 'piano') osc.setPeriodicWave(graph.pianoWave);
    else osc.type = shape || 'sine';
    const gain = envelope(ctx, v, at, length, level, attack, sustain, shape === 'piano' ? 0.08 : undefined);
    if (cutoff) {
      const filter = v.own(ctx.createBiquadFilter());
      filter.type = 'lowpass'; filter.Q.value = 0.55;
      filter.frequency.setValueAtTime(cutoff, at);
      filter.frequency.exponentialRampToValueAtTime(Math.max(320, cutoff * 0.38), at + length);
      osc.connect(filter); filter.connect(gain);
    } else osc.connect(gain);
    v.source(osc, at, at + length + 0.012);
    return osc;
  }
  function noise(graph, v, at, duration, level, centre, q, highpass) {
    const ctx = graph.ctx, source = ctx.createBufferSource(), filter = v.own(ctx.createBiquadFilter());
    source.buffer = graph.noise; source.loop = true;
    filter.type = highpass ? 'highpass' : 'bandpass';
    filter.frequency.value = centre; filter.Q.value = q || 0.65;
    const lowpass = v.own(ctx.createBiquadFilter());
    lowpass.type = 'lowpass'; lowpass.frequency.value = highpass ? 9500 : 4200; lowpass.Q.value = 0.5;
    source.connect(filter); filter.connect(lowpass);
    lowpass.connect(envelope(ctx, v, at, duration, level, Math.min(0.009, duration * 0.15)));
    graph.noiseOffset = (graph.noiseOffset + 0.137) % 0.8;
    // Offsets keep successive brushes/paper sounds from being identical samples.
    v.source(source, at, at + duration + 0.01, graph.noiseOffset);
  }
  function mallet(graph, v, at, midi, level, duration) {
    tone(graph, v, at, midi, duration, level, 'sine', 2800, 0.005, 0.36);
    tone(graph, v, at, midi + 12.02, duration * 0.45, level * 0.16, 'sine', 3600, 0.003);
  }
  function piano(graph, v, at, notes, velocity, length) {
    for (let i = 0; i < notes.length; i++) {
      const t = at + i * 0.007;
      tone(graph, v, t, notes[i], length, 0.42 * velocity, 'piano', 2900, 0.008, 0.48);
      tone(graph, v, t, notes[i] + 19.01, Math.min(length, 0.27), 0.022 * velocity, 'sine', 2800, 0.005);
    }
  }
  function bass(graph, v, at, midi, velocity, length) {
    const main = tone(graph, v, at, midi, length, 0.36 * velocity, 'triangle', 780, 0.007, 0.4);
    main.detune.setValueAtTime(9, at); main.detune.exponentialRampToValueAtTime(0.1, at + 0.07);
    tone(graph, v, at, midi, length * 0.96, 0.28 * velocity, 'sine', 0, 0.009, 0.5);
    noise(graph, v, at, 0.035, 0.018 * velocity, 800, 0.5, false);
  }
  function drum(graph, v, at, kind, velocity) {
    if (kind === 'hat') noise(graph, v, at, 0.075, 0.108 * velocity, 5100, 0.5, true);
    else if (kind === 'brush') noise(graph, v, at, 0.15, 0.102 * velocity, 2700, 0.55, false);
    else if (kind === 'stick') {
      tone(graph, v, at, 83, 0.055, 0.132 * velocity, 'sine', 1900, 0.003);
      tone(graph, v, at, 72.3, 0.04, 0.037 * velocity, 'triangle', 1400, 0.002);
      noise(graph, v, at, 0.038, 0.06 * velocity, 1400, 0.9, false);
    } else {
      const osc = tone(graph, v, at, 35, 0.19, 0.288 * velocity, 'sine', 0, 0.006);
      osc.frequency.setValueAtTime(72, at); osc.frequency.exponentialRampToValueAtTime(43, at + 0.12);
    }
  }

  // Original sixteen-bar composition. Rootless 7/9/13 voicings leave space for bass.
  const HARMONY = [
    [38, [53, 60, 64, 69]], [43, [53, 59, 64, 69]],
    [36, [52, 59, 62, 67]], [33, [55, 61, 64, 70]],
    [38, [53, 57, 60, 64]], [31, [53, 58, 62, 69]],
    [36, [52, 58, 62, 69]], [41, [52, 57, 60, 67]],
    [35, [53, 57, 62, 65]], [40, [50, 56, 59, 65]],
    [33, [55, 60, 64, 71]], [33, [55, 61, 64, 69]],
    [38, [53, 60, 64, 69]], [43, [53, 59, 64, 69]],
    [36, [52, 57, 62, 67]], [33, [55, 61, 64, 70]]
  ];
  const MELODY = [
    [[0.58, 69], [2, 72], [2.58, 69]], [[1.58, 71], [2.58, 69], [3.58, 67]],
    [[0.58, 64], [2, 67], [3.58, 69]], [[1.58, 70], [2.58, 69], [3, 67]],
    [[0.58, 65], [1.58, 64], [3, 62]], [[1, 65], [2.58, 69], [3.58, 67]],
    [[0.58, 64], [2, 67], [3.58, 69]], [[1.58, 72], [2.58, 69]],
    [[1.58, 65], [2.58, 69], [3.58, 71]], [[0.58, 68], [2, 64], [3.58, 65]],
    [[1, 64], [2.58, 67], [3.58, 71]], [[0.58, 69], [1.58, 67], [3, 64]],
    [[1.58, 65], [2.58, 69], [3.58, 72]], [[0.58, 71], [2, 69], [3.58, 67]],
    [[1.58, 64], [2.58, 62], [3.58, 64]], [[1.58, 67], [2.58, 65], [3.58, 61]]
  ];
  function buildScore() {
    const score = [];
    const add = (bar, beat, type, data) => score.push({ beat: bar * 4 + beat, type, bar, ...data });
    for (let bar = 0; bar < 16; bar++) {
      const [rootNote, notes] = HARMONY[bar], next = HARMONY[(bar + 1) % 16][0];
      add(bar, 0, 'chord', { notes, velocity: bar % 4 === 0 ? 0.55 : 0.49, length: 2.45 });
      add(bar, bar % 2 ? 2.58 : 2.75, 'chord', { notes, velocity: 0.34, length: 1.16 });
      add(bar, 0.01, 'bass', { note: rootNote, velocity: 0.82, length: 0.88 });
      add(bar, 1.58, 'bass', { note: rootNote + 7, velocity: 0.57, length: 0.46 });
      add(bar, 2.02, 'bass', { note: rootNote + (bar % 4 === 2 ? 12 : 0), velocity: 0.68, length: 0.75 });
      let approach = next - 1;
      while (approach < 31) approach += 12;
      add(bar, 3.58, 'bass', { note: approach, velocity: 0.48, length: 0.29 });
      for (let beat = 0; beat < 4; beat++) {
        add(bar, beat, 'hat', { velocity: beat % 2 ? 0.35 : 0.43 });
        add(bar, beat + 0.58, 'hat', { velocity: 0.24 + (bar % 3) * 0.025 });
      }
      add(bar, 1.015, 'stick', { velocity: 0.51 });
      add(bar, 3.015, 'stick', { velocity: bar % 4 === 3 ? 0.42 : 0.57 });
      add(bar, 1.58, 'brush', { velocity: 0.23 });
      add(bar, 0, 'kick', { velocity: 0.43 });
      if (bar % 2 === 0) add(bar, 2.58, 'kick', { velocity: 0.29 });
      MELODY[bar].forEach(([beat, note], i) => add(bar, beat + 0.018, 'melody', {
        note, velocity: i === 0 ? 0.65 : 0.54, length: i === 2 ? 0.7 : 0.92
      }));
    }
    return score.sort((a, b) => a.beat - b.beat);
  }
  const SCORE = buildScore();
  function musicEvent(graph, event, at, cycle) {
    // The second pass leaves an occasional melodic rest and slightly changes comping weight.
    if (event.type === 'melody' && cycle % 2 && event.bar % 4 === 1 && event.note === 69) return;
    const pan = event.type === 'chord' ? -0.19 : event.type === 'melody' ? 0.22 : event.type === 'hat' ? 0.29 : -0.025;
    const wet = event.type === 'chord' ? 0.32 : event.type === 'melody' ? 0.38 : event.type === 'stick' ? 0.1 : 0;
    const v = voice(graph, 'music', at, pan, wet);
    if (event.type === 'chord') {
      piano(graph, v, at, event.notes, event.velocity * (cycle % 2 ? 0.96 : 1), event.length * BEAT);
    } else if (event.type === 'bass') {
      bass(graph, v, at, event.note, event.velocity, event.length * BEAT);
    } else if (event.type === 'melody') {
      mallet(graph, v, at, event.note, 0.29 * event.velocity, event.length * BEAT + 0.22);
    } else drum(graph, v, at, event.type, event.velocity);
  }

  // A separate, original F-major composition, not a renamed/retimed Midnight Felt.
  // Its syncopated 112-BPM EP groove has an A/B hook, a chromatic bridge and a
  // C13 turnaround into the next F6/9 downbeat. All pitches/rhythms are authored here.
  const CASINO_BEAT = 60 / 112;
  const CASINO_HARMONY = [
    [41, [57, 60, 62, 67]], [38, [53, 57, 60, 64]],
    [43, [53, 57, 58, 62]], [36, [52, 58, 62, 69]],
    [41, [57, 60, 62, 67]], [38, [53, 57, 60, 64]],
    [43, [53, 57, 58, 62]], [36, [52, 58, 62, 69]],
    [34, [53, 57, 60, 62]], [35, [53, 56, 59, 62]],
    [33, [55, 59, 60, 64]], [38, [54, 60, 64, 71]],
    [43, [53, 57, 58, 62]], [36, [52, 58, 62, 69]],
    [41, [57, 60, 62, 67]], [36, [52, 58, 62, 69]]
  ];
  const CASINO_MELODY = [
    [[0.5, 69], [1, 72], [1.75, 74], [2.5, 72], [3.5, 67]],
    [[0.5, 69], [1.5, 65], [2.25, 64], [3.25, 60]],
    [[0.5, 62], [1, 65], [1.75, 69], [2.5, 70], [3.5, 69]],
    [[0.5, 67], [1.5, 64], [2.5, 62], [3, 64], [3.5, 67]],
    [[0.5, 69], [1, 72], [1.75, 74], [2.5, 77], [3.5, 76]],
    [[0.5, 72], [1.5, 69], [2.25, 65], [3.25, 64]],
    [[0.5, 65], [1.25, 69], [2, 70], [2.75, 74]],
    [[0.5, 72], [1.5, 70], [2.5, 69], [3.5, 67]],
    [[0.5, 65], [1, 69], [1.75, 72], [2.5, 74], [3.5, 72]],
    [[0.5, 71], [1.5, 68], [2.25, 65], [3.25, 62]],
    [[0.5, 64], [1, 67], [1.75, 71], [2.5, 72], [3.5, 71]],
    [[0.5, 69], [1.5, 66], [2.5, 64], [3.25, 60]],
    [[0.5, 62], [1, 65], [1.75, 69], [2.5, 70], [3.5, 74]],
    [[0.5, 72], [1.5, 69], [2.25, 67], [3.25, 64]],
    [[0.5, 69], [1, 72], [1.75, 74], [2.5, 72], [3.5, 69]],
    [[0.5, 67], [1.25, 64], [2, 62], [2.75, 58], [3.5, 64]]
  ];
  function electricPiano(graph, v, at, notes, velocity, length) {
    for (let i = 0; i < notes.length; i++) {
      const t = at + i * 0.004, note = notes[i];
      tone(graph, v, t, note, length, 0.27 * velocity, 'sine', 2600, 0.006, 0.58);
      tone(graph, v, t, note + 12.01, length * 0.82, 0.10 * velocity, 'sine', 3200, 0.005, 0.32);
      tone(graph, v, t, note + 28.02, Math.min(length * 0.4, 0.19), 0.024 * velocity, 'sine', 3800, 0.003);
    }
  }
  function buildCasinoScore() {
    const score = [];
    const add = (bar, beat, type, data) => score.push({ beat: bar * 4 + beat, type, bar, ...data });
    for (let bar = 0; bar < CASINO_HARMONY.length; bar++) {
      const [rootNote, notes] = CASINO_HARMONY[bar], next = CASINO_HARMONY[(bar + 1) % 16][0];
      add(bar, 0, 'chord', { notes, velocity: 0.63, length: 1.22 });
      add(bar, 1.5, 'chord', { notes, velocity: 0.42, length: 0.66 });
      add(bar, 2.75, 'chord', { notes, velocity: 0.50, length: 1.18 });
      add(bar, 0.01, 'bass', { note: rootNote, velocity: 0.79, length: 0.79 });
      add(bar, 1.5, 'bass', { note: rootNote + 7, velocity: 0.55, length: 0.38 });
      add(bar, 2, 'bass', { note: rootNote + 12, velocity: 0.62, length: 0.62 });
      add(bar, 3.5, 'bass', { note: next + (next < rootNote ? 1 : -1), velocity: 0.52, length: 0.43 });
      for (let beat = 0; beat < 4; beat++) {
        add(bar, beat, 'hat', { velocity: beat % 2 ? 0.29 : 0.36 });
        add(bar, beat + 0.54, 'hat', { velocity: 0.19 + (bar % 2) * 0.025 });
      }
      add(bar, 1.01, 'stick', { velocity: 0.44 });
      add(bar, 3.01, 'stick', { velocity: 0.48 });
      add(bar, 3.54, 'brush', { velocity: 0.19 });
      add(bar, 0, 'kick', { velocity: 0.40 });
      add(bar, bar % 2 ? 2.5 : 2, 'kick', { velocity: 0.26 });
      CASINO_MELODY[bar].forEach(([beat, note], i) => add(bar, beat + 0.012, 'melody', {
        note, velocity: i === 0 ? 0.92 : 0.80, length: i === 4 ? 0.49 : 0.63
      }));
    }
    return score.sort((a, b) => a.beat - b.beat);
  }
  function casinoEvent(graph, event, at) {
    const pan = event.type === 'chord' ? -0.24 : event.type === 'melody' ? 0.19 : event.type === 'hat' ? 0.31 : -0.025;
    const wet = event.type === 'chord' ? 0.25 : event.type === 'melody' ? 0.31 : event.type === 'stick' ? 0.08 : 0;
    const v = voice(graph, 'music', at, pan, wet);
    if (event.type === 'chord') electricPiano(graph, v, at, event.notes, event.velocity, event.length * CASINO_BEAT);
    else if (event.type === 'bass') bass(graph, v, at, event.note, event.velocity, event.length * CASINO_BEAT);
    else if (event.type === 'melody') {
      electricPiano(graph, v, at, [event.note], event.velocity, event.length * CASINO_BEAT + 0.13);
    } else drum(graph, v, at, event.type, event.velocity);
  }
  // Two newly authored pieces: independent harmony, hook and rhythmic form.
  // Private deterministic score construction; no network/assets/game RNG.
  const STAR_HARMONY=[[40,[55,59,62,66]],[45,[55,60,64,67]],[38,[54,57,60,64]],[43,[54,59,62,66]],[36,[55,59,62,64]],[42,[57,60,64,69]],[47,[57,63,66,69]],[40,[55,59,62,66]]];
  const STAR_HOOK=[[71,74,78],[76,72,67],[69,66,64],[66,71,74],[76,79,74],[73,76,81],[78,75,71],[74,71,67]];
  const COPPER_HARMONY=[[34,[53,57,60,62]],[41,[55,57,60,65]],[43,[53,58,62,65]],[36,[52,58,62,67]],[39,[55,58,62,65]],[38,[53,57,60,64]],[43,[53,58,62,65]],[41,[51,57,60,67]]];
  const COPPER_HOOK=[[74,77,72,69,65],[67,69,72,77,76],[74,70,65,62,65],[64,67,70,74,79],[77,74,70,67,70],[69,72,76,74,72],[70,74,77,81,77],[75,72,69,67,63]];
  function buildNewScore(star){
    const score=[],harmony=star?STAR_HARMONY:COPPER_HARMONY,hook=star?STAR_HOOK:COPPER_HOOK,add=(bar,beat,type,data)=>score.push({beat:bar*4+beat,bar,type,...data});
    for(let bar=0;bar<16;bar++){
      const [rootNote,notes]=harmony[bar%8];
      (star?[0,2.5]:[.5,1.75,3.25]).forEach((beat,i)=>add(bar,beat,'chord',{notes,velocity:star?.36:.43,length:star?1.8:i===2?.6:.8}));
      (star?[0,2]:[0,.75,2,3.5]).forEach((beat,i)=>add(bar,beat,'bass',{note:rootNote+(i%2?7:0),velocity:star?.48:.59,length:star?1.4:.46}));
      (star?[.25,1.5,2.75]:[0,.75,1.5,2.5,3.25]).forEach((beat,i)=>add(bar,beat,'melody',{note:hook[bar%8][i]+(bar>=8&&bar%3===0?12:0),velocity:star?.53:.66,length:star?1:.38}));
      (star?[.5,1.5,2.5,3.5]:[0,.5,1,1.5,2,2.5,3,3.5]).forEach((beat,i)=>add(bar,beat,'hat',{velocity:star?.13:i%2?.14:.24}));
      add(bar,0,'kick',{velocity:star?.22:.34});add(bar,star?3:1,'stick',{velocity:star?.16:.33});if(!star){add(bar,3,'stick',{velocity:.36});add(bar,2.75,'kick',{velocity:.23});}
    }return score.sort((a,b)=>a.beat-b.beat);
  }
  function newMusicEvent(star){const beat=60/(star?84:124);return function(graph,event,at){
    const v=voice(graph,'music',at,event.type==='melody'?.23:event.type==='chord'?-.2:0,event.type==='melody'?(star?.4:.19):.12);
    if(event.type==='chord')electricPiano(graph,v,at,event.notes,event.velocity,event.length*beat);
    else if(event.type==='bass')bass(graph,v,at,event.note,event.velocity,event.length*beat);
    else if(event.type==='melody'){if(star)mallet(graph,v,at,event.note,.26*event.velocity,event.length*beat+.2);else electricPiano(graph,v,at,[event.note],event.velocity,event.length*beat+.08);}
    else drum(graph,v,at,event.type,event.velocity);
  };}
  const COMPOSITIONS = Object.freeze({
    poker_lounge: { score: SCORE, beat: BEAT, loopBeats: LOOP_BEATS, play: musicEvent },
    casino_lounge: { score: buildCasinoScore(), beat: CASINO_BEAT, loopBeats: 64, play: casinoEvent },
    starlight_felt:{score:buildNewScore(true),beat:60/84,loopBeats:64,play:newMusicEvent(true)},
    copper_groove:{score:buildNewScore(false),beat:60/124,loopBeats:64,play:newMusicEvent(false)}
  });
  const trackId = (id, level) => tracksForPlayerLevel(actualPlayerLevel(level)).some(track => track.id === id) ? id : DEFAULTS.track;

  function effect(graph, name, at, options) {
    if(name==='money_gain')return moneyGainSound(graph,at,options);
    const intensity = unit(options && options.intensity, 1);
    const rawPitch = number(options && options.pitch, 0);
    const step = PENTATONIC[clamp(Math.floor(rawPitch), 0, PENTATONIC.length - 1)];
    const bend = clamp(rawPitch, -6, 6), n = name;
    const xpShift = n === 'xp' ? xpSemitones(options) : 0;
    if (xpShift === null) return null;
    const v = voice(graph, 'fx', at, 0, ['chip', 'mult', 'xmult', 'joker', 'coin', 'win', 'pack', 'xp'].includes(n) ? 0.28 : 0.05);
    const note = (offset, midi, duration, level, shape, cutoff) => tone(graph, v, at + offset,
      midi, duration, level * intensity, shape || 'sine', cutoff || 2100, 0.004, 0.3);
    const tap = (offset, midi, level, duration) => note(offset, midi, duration || 0.07, level, 'triangle', 1700);
    const bell = (offset, midi, level, duration) => mallet(graph, v, at + offset, midi,
      level * intensity, duration || 0.29);
    const paper = (offset, length, level, centre) => noise(graph, v, at + offset, length,
      level * intensity, centre, 0.6, false);
    if (n === 'select') { tap(0, 72, 0.19, 0.075); note(0, 51, 0.055, 0.09); }
    else if (n === 'deselect') { tap(0, 65, 0.16, 0.065); note(0, 47, 0.05, 0.07); }
    else if (n === 'click') tap(0, 67, 0.16, 0.048);
    else if (n === 'xp') {
      // The same tiny glass rise, levels, envelopes and octave shimmer; only
      // transpose the entire motif by genuinely awarded XP, never a tick count.
      const oscillators = [];
      for (const [offset, midi, level, duration] of [[0, 72, 0.15, 0.14], [0.055, 76, 0.13, 0.16], [0.115, 81, 0.11, 0.20]]) {
        const start = at + offset, note = midi + xpShift;
        oscillators.push(tone(graph, v, start, note, duration, level * intensity, 'sine', 2800, 0.005, 0.36));
        oscillators.push(tone(graph, v, start, note + 12.02, duration * 0.45, level * intensity * 0.16, 'sine', 3600, 0.003));
      }
      v.xpSemitones = xpShift;
      v.raiseXp = (next, now) => {
        const cents = (next - xpShift) * 100;
        for (const osc of oscillators) {
          const param = osc.detune;
          // One shared glide timeline, including not-yet-started notes: the
          // motif/shimmer intervals stay exact even through an imminent attack.
          if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
          else { const held = param.value; param.cancelScheduledValues(now); param.setValueAtTime(held, now); }
          param.linearRampToValueAtTime(cents, now + 0.008);
        }
        v.xpSemitones = next;
      };
    }
    else if (n === 'deal') { paper(0, 0.105, 0.20, 1550 + bend * 60); tap(0.019, 48 + bend, 0.11, 0.055); }
    else if (n === 'discard') { paper(0, 0.17, 0.22, 1000); paper(0.035, 0.11, 0.10, 2100); tap(0.045, 45, 0.09); }
    else if (n === 'play') { paper(0, 0.09, 0.15, 1300); tap(0.025, 48, 0.18, 0.11); bell(0.035, 60, 0.09, 0.18); }
    else if (n === 'chip') bell(0, 60 + step, 0.23, 0.24);
    else if (n === 'mult') { bell(0, 57 + step, 0.23, 0.29); bell(0.018, 64 + Math.min(step, 9), 0.10, 0.21); }
    else if (n === 'xmult') {
      [57, 60, 64, 67].forEach((m, i) => bell(i * 0.013, m, 0.125, 0.49));
      note(0, 45, 0.28, 0.12);
    } else if (n === 'joker') {
      [62, 65, 69].forEach((m, i) => bell(i * 0.035, m, 0.15, 0.38));
    } else if (n === 'coin') { bell(0, 67, 0.18, 0.24); bell(0.037, 71, 0.13, 0.3); }
    else if (n === 'purchase') { tap(0, 55, 0.15); [64, 67, 72].forEach((m, i) => bell(0.035 + i * 0.045, m, 0.14, 0.32)); }
    else if (n === 'pack') {
      paper(0, 0.23, 0.24, 1750); paper(0.07, 0.17, 0.15, 900);
      [60, 64, 69, 72].forEach((m, i) => bell(0.11 + i * 0.048, m, 0.13, 0.55));
    } else if (n === 'win') {
      [60, 64, 67, 71, 74].forEach((m, i) => bell(i * 0.036, m, 0.14, 1.05));
      note(0, 48, 0.65, 0.14); note(0.09, 55, 0.65, 0.07);
    } else if (n === 'lose') {
      [53, 57, 60, 64].forEach((m, i) => note(i * 0.025, m, 0.72, 0.095, 'piano', 1400));
      note(0, 41, 0.45, 0.11);
    } else if (n === 'error') { tap(0, 54, 0.15, 0.065); tap(0.085, 52, 0.12, 0.08); }
    return v;
  }
  // Legacy table-mode builders and their DSP above remain byte-for-byte intact.
  // New instruments are additive, so neither the four original tracks nor SFX
  // inherit a different timbre, envelope, gain, noise seed or coalescing rule.
  function instrument(graph, v, at, notes, velocity, length, palette) {
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i], t = at + i * 0.003, level = velocity / Math.sqrt(notes.length);
      if (palette === 'ep' || palette === 'rhodes') {
        electricPiano(graph, v, t, [note], level * (palette === 'rhodes' ? 0.82 : 0.94), length);
      } else if (palette === 'vibes' || palette === 'celesta' || palette === 'glass' || palette === 'fm_bell') {
        tone(graph, v, t, note, length + 0.14, level * 0.19, 'sine', 4200, 0.004, 0.3);
        const partial = palette === 'glass' ? 19.08 : palette === 'fm_bell' ? 27.94 : 12.02;
        tone(graph, v, t, note + partial, length * 0.52, level * 0.055, 'sine', 5200, 0.003);
      } else if (palette === 'chip_comp' || palette === 'pulse') {
        tone(graph, v, t, note, length, level * 0.095, 'square', palette === 'pulse' ? 2400 : 1300, 0.005, 0.32);
        if (palette === 'pulse') tone(graph, v, t, note - 12, length * 0.65, level * 0.045, 'triangle', 1600, 0.005);
      } else if (palette === 'fm') {
        tone(graph, v, t, note, length, level * 0.2, 'sine', 3600, 0.003, 0.28);
        tone(graph, v, t, note + 19.12, length * 0.4, level * 0.075, 'sine', 4800, 0.002);
        tone(graph, v, t, note + 12, length * 0.75, level * 0.05, 'triangle', 2500, 0.004);
      } else if (palette === 'organ') {
        tone(graph, v, t, note, length, level * 0.14, 'sine', 1700, 0.012, 0.75);
        tone(graph, v, t, note + 12, length, level * 0.055, 'sine', 2100, 0.012, 0.7);
        tone(graph, v, t, note + 19, length * 0.8, level * 0.035, 'sine', 2500, 0.01);
      } else if (palette === 'brass' || palette === 'muted_brass' || palette === 'saw_pad') {
        const muted = palette === 'muted_brass', pad = palette === 'saw_pad';
        tone(graph, v, t, note, length, level * (pad ? 0.075 : 0.10), 'sawtooth', muted ? 1100 : pad ? 1400 : 2200, pad ? 0.035 : 0.019, 0.58);
        tone(graph, v, t, note + 0.04, length * 0.95, level * 0.055, 'triangle', 1800, 0.014, 0.45);
      } else if (palette === 'guitar' || palette === 'twang' || palette === 'clav') {
        tone(graph, v, t, note, length, level * 0.19, 'piano', palette === 'clav' ? 1700 : 2700, 0.003, 0.3);
        const pick = tone(graph, v, t, note + 12.04, Math.min(length, 0.19), level * 0.05, 'triangle', 3100, 0.002);
        if (palette === 'twang') { pick.detune.setValueAtTime(18, t); pick.detune.linearRampToValueAtTime(0, t + 0.07); }
      } else if (palette === 'breath') {
        tone(graph, v, t, note, length, level * 0.2, 'sine', 1900, 0.035, 0.65);
        tone(graph, v, t, note + 12.01, length * 0.8, level * 0.025, 'sine', 2200, 0.03);
      } else piano(graph, v, t, [note], level * 0.58, length);
    }
  }
  function expandedBass(graph, v, at, note, velocity, length, palette) {
    if (palette === 'upright') { bass(graph, v, at, note, velocity * 0.8, length); return; }
    const sub = palette === 'subtle_sub', bright = ['sequence', 'picked', 'funk', 'disco'].includes(palette);
    tone(graph, v, at, note, length, velocity * (sub ? 0.36 : 0.28), 'sine', 0, 0.009, 0.5);
    tone(graph, v, at, note, length * 0.8, velocity * (bright ? 0.15 : 0.08), bright ? 'triangle' : 'sine', bright ? 930 : 460, 0.004, 0.36);
    if (palette === 'picked' || palette === 'funk') noise(graph, v, at, 0.025, 0.018 * velocity, 1250, 0.6, false);
  }
  function expandedDrum(graph, v, at, kind, velocity) {
    if (kind === 'snare' || kind === 'clap') {
      noise(graph, v, at, kind === 'clap' ? 0.13 : 0.17, 0.18 * velocity, kind === 'clap' ? 2100 : 1650, 0.65, false);
      if (kind === 'snare') tone(graph, v, at, 49, 0.10, 0.12 * velocity, 'triangle', 900, 0.003);
      else noise(graph, v, at + 0.012, 0.08, 0.06 * velocity, 2800, 0.8, false);
    } else if (kind === 'rim' || kind === 'tick') drum(graph, v, at, 'stick', velocity * (kind === 'tick' ? 0.56 : 0.82));
    else if (kind === 'shaker' || kind === 'openhat') noise(graph, v, at, kind === 'openhat' ? 0.19 : 0.055, 0.12 * velocity, 5700, 0.5, true);
    else if (kind === 'tom') {
      const osc = tone(graph, v, at, 43, 0.26, velocity * 0.29, 'sine', 780, 0.005);
      osc.frequency.exponentialRampToValueAtTime(hz(36), at + 0.18);
    } else drum(graph, v, at, kind, velocity);
  }
  function expandedPlay(definition) {
    const beat = 60 / definition.bpm, palette = definition.palette;
    return function (graph, event, at) {
      const pan = event.type === 'chord' ? -0.22 : event.type === 'melody' ? 0.22 : event.type === 'hat' ? 0.27 : 0;
      const wet = event.type === 'melody' ? 0.28 : event.type === 'chord' ? 0.21 : 0.02;
      const v = voice(graph, 'music', at, pan, wet);
      if (event.type === 'chord' || event.type === 'melody') instrument(graph, v, at,
        event.notes || [event.note], event.velocity, event.length * beat,
        event.type === 'chord' ? palette.chord : palette.lead);
      else if (event.type === 'bass') expandedBass(graph, v, at, event.note, event.velocity, event.length * beat, palette.bass);
      else expandedDrum(graph, v, at, event.type, event.velocity);
    };
  }
  const tableCompositions = { ...COMPOSITIONS };
  if (MUSIC_DATA) for (const [id, definition] of Object.entries(MUSIC_DATA.scores)) {
    tableCompositions[id] = { score: definition.events, beat: 60 / definition.bpm,
      loopBeats: definition.loopBeats, play: expandedPlay(definition) };
  }

  // Boss music is a new orchestration/score, not a volume knob or a retimed table
  // melody: minor low-register voicings, sub pedals, chromatic eighth-note cells,
  // asymmetric drum patterns and pitched timpani. Final bosses add contrary-motion
  // counterlines, altered dominants, double-time tension and a four-bar climax.
  function bossComposition(metadata, harmony, final, identity) {
    const tempo = isLicensed(metadata.id) ? recordingRate(final ? 'final_boss' : 'boss') : (final ? 0.93 : 0.86);
    const beat = 60 / (metadata.bpm * tempo), score = [];
    const add = (bar, b, type, data) => score.push({ beat: bar * 4 + b, bar, type, ...data });
    const cells = [[0,7,3,7,1,7,3,10],[0,3,7,10,8,7,3,1],[0,7,10,7,6,3,1,7],[0,1,7,3,10,8,7,3]];
    const cell = cells[identity % cells.length];
    for (let bar = 0; bar < 16; bar++) {
      const entry = harmony[bar % harmony.length], rootNote = 24 + ((entry[0] % 12 + 12) % 12);
      const next = harmony[(bar + 1) % harmony.length][0], altered = bar % 4 === 3;
      const notes = [rootNote + 12, rootNote + 15, rootNote + (altered ? 18 : 19), rootNote + (altered ? 22 : 26)];
      add(bar, 0, 'dark_chord', { notes, length: final ? 2.45 : 3.4, velocity: .48 });
      if (final) add(bar, 2.75, 'dark_chord', { notes:[rootNote+13,rootNote+16,rootNote+19,rootNote+22], length:.95, velocity:.33 });
      add(bar, .01, 'sub', { note:rootNote, length:final?1.65:2.2, velocity:.82 });
      add(bar, final?2:2.5, 'sub', { note:rootNote+(bar%2?7:0), length:final?1.35:1.15, velocity:.62 });
      for (let step = 0; step < 8; step++) {
        if (!final && step === (bar + identity) % 8) continue;
        const chromatic = final && bar >= 12 && step % 3 === 2;
        add(bar, step*.5 + .025, 'ostinato', { note:rootNote+12+cell[(step+bar%2*2)%8]+(chromatic?1:0), length:.31, velocity:step%2?.36:.47 });
      }
      add(bar, 0, 'timpani', { note:rootNote+12, velocity:.67 });
      add(bar, final?1.5:2.75, 'timpani', { note:rootNote+7, velocity:.46 });
      if (bar%2 || final) add(bar,3.5,'timpani',{note:24+next%12+12,velocity:.38});
      (final?[1,2.5,3]:[1.5,3.25]).forEach(b=>add(bar,b,'war_snare',{velocity:final?.48:.38}));
      (final?[.25,.75,1.25,1.75,2.25,2.75,3.25,3.75]:[.75,1.75,2.25,3.75]).forEach(b=>add(bar,b,'dark_hat',{velocity:.25}));
      const note = entry[1][(bar + identity) % entry[1].length];
      add(bar, final?.75:1, 'warning', { note:rootNote+24+(note%12-rootNote%12+12)%12, length:final?.7:1.3, velocity:.38 });
      if (final) {
        add(bar,2.25,'warning',{note:rootNote+24+((bar%2)?11:8),length:.58,velocity:.35});
        if (bar>=12) [3,3.5,3.75].forEach((b,i)=>add(bar,b,'climax',{note:rootNote+36+11-i,length:.2,velocity:.32}));
      }
    }
    score.sort((a,b)=>a.beat-b.beat);
    return { beat, loopBeats:64, score, play(graph,event,at) {
      const v = voice(graph,'music',at,event.type==='ostinato'?-.16:event.type==='warning'?.2:0,
        event.type==='dark_chord'?.18:event.type==='warning'?.25:.03);
      const length=(event.length||.4)*beat, vel=event.velocity;
      if (event.type==='dark_chord') {
        for(const note of event.notes) {
          tone(graph,v,at,note,length,vel*.11,'triangle',610,.045,.66);
          tone(graph,v,at,note-.04,length*.92,vel*.055,'sine',720,.04,.6);
        }
      } else if(event.type==='sub') {
        tone(graph,v,at,event.note,length,vel*.47,'sine',0,.012,.72);
        tone(graph,v,at,event.note+12,length*.84,vel*.09,'triangle',430,.008,.45);
      } else if(event.type==='timpani') {
        const osc=tone(graph,v,at,event.note,.55,vel*.39,'sine',650,.009,.25);
        osc.frequency.setValueAtTime(hz(event.note+3),at);osc.frequency.exponentialRampToValueAtTime(hz(event.note),at+.11);
        noise(graph,v,at,.1,vel*.045,340,.7,false);
      } else if(event.type==='ostinato') {
        tone(graph,v,at,event.note,length,vel*.21,'triangle',820,.004,.35);
        tone(graph,v,at,event.note+12.03,length*.5,vel*.025,'sine',1100,.003);
      } else if(event.type==='war_snare') {
        noise(graph,v,at,.2,vel*.14,920,.65,false);
        tone(graph,v,at,38,.16,vel*.13,'triangle',540,.004);
      } else if(event.type==='dark_hat') noise(graph,v,at,.065,vel*.09,2800,.6,false);
      else instrument(graph,v,at,[event.note],vel*.8,length,event.type==='climax'?'fm':'muted_brass');
    } };
  }
  const bossCompositions={}, finalCompositions={};
  const oldHarmony={poker_lounge:HARMONY,casino_lounge:CASINO_HARMONY,starlight_felt:STAR_HARMONY,copper_groove:COPPER_HARMONY};
  TRACKS.filter(track=>!isLicensed(track.id)).forEach((metadata,index)=>{
    const harmony=oldHarmony[metadata.id] || MUSIC_DATA.scores[metadata.id].harmony;
    bossCompositions[metadata.id]=bossComposition(metadata,harmony,false,index);
    finalCompositions[metadata.id]=bossComposition(metadata,harmony,true,index);
  });
  LICENSED_TRACKS.forEach((metadata,index)=>{
    tableCompositions[metadata.id]={score:[],beat:60/metadata.bpm,loopBeats:64,play() {}};
    const harmony=MUSIC_DATA.scores[metadata.fallback].harmony;
    bossCompositions[metadata.id]=bossComposition(metadata,harmony,false,17+index);
    finalCompositions[metadata.id]=bossComposition(metadata,harmony,true,17+index);
  });
  // Last Chance is transient, never a catalog selection or saved preference.
  // Revoice the selected piece's root journey as a slow minor/add9/sus lament:
  // open piano, a falling two-note sigh, breathy bowed swells and a soft heartbeat.
  // This deliberately shares none of the boss ostinato, snare or climax score.
  function lastChanceStrings(graph, v, at, notes, velocity, length) {
    const ctx=graph.ctx, gain=v.own(ctx.createGain()), filter=v.own(ctx.createBiquadFilter());
    const level=velocity*.075/Math.sqrt(notes.length), end=at+length;
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(level,at+Math.min(.65,length*.28));
    gain.gain.linearRampToValueAtTime(level*.78,at+length*.66);
    gain.gain.exponentialRampToValueAtTime(.00001,end-.08);gain.gain.linearRampToValueAtTime(0,end);
    filter.type='lowpass';filter.frequency.value=1450;filter.Q.value=.45;
    filter.connect(gain);gain.connect(v.output);
    for(const note of notes) for(const [shape,cents]of [['triangle',-5],['sawtooth',5]]) {
      const osc=ctx.createOscillator();osc.type=shape;osc.frequency.setValueAtTime(hz(note),at);
      osc.detune.setValueAtTime(cents,at);osc.connect(filter);v.source(osc,at,end+.012);
    }
    const breath=ctx.createBufferSource(), band=v.own(ctx.createBiquadFilter()), air=v.own(ctx.createGain());
    breath.buffer=graph.noise;breath.loop=true;band.type='bandpass';band.frequency.value=1050;band.Q.value=.6;
    air.gain.value=.22;breath.connect(band);band.connect(air);air.connect(filter);v.source(breath,at,end+.012,.23);
  }
  function lastChanceComposition(metadata, harmony, identity) {
    const beat=60/clamp(metadata.bpm*.56,56,74),score=[];
    const add=(bar,b,type,data)=>score.push({beat:bar*4+b,bar,type,...data});
    const sighs=[[7,3,2,0],[10,7,5,3],[12,10,7,2],[7,5,3,2]],cell=sighs[identity%4];
    for(let bar=0;bar<16;bar++) {
      const rootNote=36+((harmony[bar%harmony.length][0]%12+12)%12),sus=bar%4===1||bar===15;
      const notes=[rootNote+12,rootNote+(sus?17:15),rootNote+19,rootNote+26];
      const lift=bar>=8&&bar<12?1.1:bar>=12?.88:1;
      add(bar,0,'felt_piano',{notes,length:3.35,velocity:.55*lift});
      add(bar,.12,'bowed_breath',{notes:[rootNote+12,rootNote+19,rootNote+(sus?29:27)],length:3.75,velocity:.56*lift});
      add(bar,.025,'quiet_sub',{note:rootNote-12,length:3.65,velocity:.34});
      add(bar,.78,'sigh',{note:rootNote+24+cell[(bar+identity)%4],length:1.65,velocity:.61*lift});
      add(bar,2.55,'sigh',{note:rootNote+24+cell[(bar+identity+1)%4],length:1.35,velocity:.47*lift});
      if(sus) add(bar,2.75,'felt_piano',{notes:[rootNote+15,rootNote+26],length:1.12,velocity:.31});
      // A double heartbeat, not a dance kick: two rounded low pulses every half bar.
      for(const b of [0,2]) {
        add(bar,b,'heartbeat',{velocity:.43});add(bar,b+.27,'heartbeat',{velocity:.25});
      }
    }
    score.sort((a,b)=>a.beat-b.beat);
    return {beat,loopBeats:64,score,play(graph,event,at) {
      const v=voice(graph,'music',at,event.type==='felt_piano'?-.2:event.type==='sigh'?.21:event.type==='bowed_breath'?.08:0,
        event.type==='felt_piano'||event.type==='sigh'?.43:event.type==='bowed_breath'?.32:.02);
      const length=(event.length||.3)*beat,vel=event.velocity;
      if(event.type==='felt_piano'||event.type==='sigh') {
        const notes=event.notes||[event.note],level=vel/Math.sqrt(notes.length);
        for(let i=0;i<notes.length;i++) {
          const t=at+i*.016;
          tone(graph,v,t,notes[i],length,level*.28,'piano',1750,.014,.5);
          tone(graph,v,t,notes[i]+12.01,length*.7,level*.018,'sine',1900,.012,.32);
        }
      } else if(event.type==='bowed_breath') lastChanceStrings(graph,v,at,event.notes,vel,length);
      else if(event.type==='quiet_sub') tone(graph,v,at,event.note,length,vel*.27,'sine',0,.04,.65);
      else {
        const osc=tone(graph,v,at,33,.24,vel*.19,'sine',180,.016,.32);
        osc.frequency.setValueAtTime(61,at);osc.frequency.exponentialRampToValueAtTime(43,at+.15);
      }
    }};
  }
  // Emerald Frenzy: original 288-BPM, eight-bar (6⅔-second) neon sprint; game effect stays ten seconds.
  // Separate deterministic score; never uses game RNG, external music or storage.
  function frenzyComposition() {
    const beat=60/288,score=[],roots=[40,43,45,47,40,43,38,47],hook=[0,7,12,15,14,12,7,10];
    const add=(bar,b,type,data)=>score.push({beat:bar*4+b,bar,type,...data});
    for(let bar=0;bar<8;bar++) {
      const note=roots[bar];
      for(let n=0;n<8;n++) {
        add(bar,n*.5,'lead',{note:note+24+hook[(n+bar*2)%8],length:.32,velocity:.18});
        add(bar,n*.5+.25,'bass',{note:note+(n%3===2?12:0),length:.21,velocity:.28});
        add(bar,n*.5,'hat',{velocity:n%2?.095:.13});
      }
      for(const b of [0,1,2,3])add(bar,b,'kick',{velocity:.48});
      for(const b of [1,3])add(bar,b,'stick',{velocity:.32});
      add(bar,0,'chord',{notes:[note+12,note+15,note+19],length:1.35,velocity:.20});
      add(bar,2.5,'chord',{notes:[note+19,note+24,note+27],length:.55,velocity:.17});
    }
    score.sort((a,b)=>a.beat-b.beat);
    return {beat,loopBeats:32,score,play(graph,event,at) {
      const v=voice(graph,'music',at,event.type==='lead'?.22:event.type==='chord'?-.24:0,event.type==='lead'?.18:.07);
      if(event.type==='lead')tone(graph,v,at,event.note,event.length*beat,event.velocity,'square',2600,.007,.22);
      else if(event.type==='bass')tone(graph,v,at,event.note,event.length*beat,event.velocity,'sawtooth',820,.008,.15);
      else if(event.type==='chord')electricPiano(graph,v,at,event.notes,event.velocity,event.length*beat);
      else drum(graph,v,at,event.type,event.velocity);
    }};
  }
  const frenzyPiece=frenzyComposition(),frenzyCompositions=Object.freeze(Object.fromEntries(TRACKS.map(t=>[t.id,frenzyPiece])));
  const lastChanceCompositions={};
  TRACKS.forEach((metadata,index)=>{
    const harmony=oldHarmony[metadata.id]||MUSIC_DATA.scores[isLicensed(metadata.id)?licensedFor(metadata.id).fallback:metadata.id].harmony;
    lastChanceCompositions[metadata.id]=lastChanceComposition(metadata,harmony,index);
  });
  const ARRANGEMENTS=Object.freeze({table:Object.freeze(tableCompositions),boss:Object.freeze(bossCompositions),
    final_boss:Object.freeze(finalCompositions),last_chance:Object.freeze(lastChanceCompositions),frenzy:frenzyCompositions});
  // Actual Level 37 is decided by the caller, never by audio reading a profile.
  // This strict, transient option selects an independent score. The original
  // arrangements/DSP above remain exact for false, and for every nonboss scene.
  const bossScene = value => value === 'boss' || value === 'final_boss';
  function dramaStrings(graph, v, at, notes, velocity, length, bright) {
    const ctx=graph.ctx, gain=v.own(ctx.createGain()), filter=v.own(ctx.createBiquadFilter());
    const end=at+length, level=.115*velocity/Math.sqrt(notes.length);
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(level,at+Math.min(.3,length*.2));
    gain.gain.linearRampToValueAtTime(level*.86,at+length*.7);
    gain.gain.exponentialRampToValueAtTime(.00001,end-.04);gain.gain.linearRampToValueAtTime(0,end);
    filter.type='lowpass';filter.Q.value=.45;
    filter.frequency.setValueAtTime(bright?1050:520,at);
    filter.frequency.linearRampToValueAtTime(bright?2300:1200,at+length*.62);
    filter.frequency.linearRampToValueAtTime(650,end);
    filter.connect(gain);gain.connect(v.output);
    for(const note of notes)for(const [shape,cents,mix]of [['triangle',-4,.72],['sawtooth',4,.28]]) {
      const osc=ctx.createOscillator(),weight=v.own(ctx.createGain());weight.gain.value=mix;
      osc.type=shape;osc.frequency.setValueAtTime(hz(note),at);osc.detune.setValueAtTime(cents,at);
      osc.connect(weight);weight.connect(filter);v.source(osc,at,end+.012);
    }
  }
  function dramaticBossComposition(metadata, harmony, final, identity, palette) {
    // Keep the exact old tempo, including the licensed recording's pitch/rate.
    // Four authored acts: threat (pedal/chromatic descent), pursuit (the chosen
    // piece's root journey), suspended bridge, then minor/dominant reckoning.
    // The final version answers the descending calls with a rising high line,
    // a V-to-i arrival and a timpani roll, not a global speed/volume increase.
    const tempo=isLicensed(metadata.id)?recordingRate(final?'final_boss':'boss'):(final?.93:.86);
    const beat=60/(metadata.bpm*tempo),score=[],key=((harmony[0][0]%12)+12)%12;
    const roots=[key,key-1,key+8,key+7,...[4,5,6,7].map(i=>harmony[i%harmony.length][0]),
      key+5,key+6,key+8,key+7,key,key+8,key+5,key+7];
    const cells=[[0,7,12,3,7,14,12,7],[0,3,7,12,10,7,3,2],
      [0,7,10,12,7,3,2,7],[0,5,7,12,14,12,7,2]];
    const calls=[[7,10,14,12,7,3],[12,7,3,2,7,10],[3,7,14,12,10,7],[14,12,7,5,3,2]];
    const cell=cells[identity%4],call=calls[identity%4];
    const add=(bar,b,type,data)=>score.push({beat:bar*4+b,bar,type,...data});
    for(let bar=0;bar<16;bar++) {
      const act=bar>>2,rootNote=24+((roots[bar]%12+12)%12),dominant=bar%4===3;
      const colour=dominant?[0,4,7,10]:bar===9?[0,3,6,9]:bar%4===1?[0,5,7,14]:[0,3,7,14];
      const notes=colour.map(n=>rootNote+24+n),lift=[.48,.56,.36,.62][act];
      add(bar,0,'drama_strings',{notes,length:bar===15&&final?2.9:3.85,velocity:lift,bright:act===3});
      // Long strings and short bow strokes have independent phrasing/envelopes.
      const steps=act===2?(bar===8?[0,3]:[0,1.5,2.5,3.5]):[0,.5,1,1.5,2,2.5,3,3.5];
      steps.forEach((b,i)=>{
        const index=(i+(bar%2)*2+identity%3)%8,interval=cell[index];
        const pitch=dominant&&interval===3?4:dominant&&interval===14?13:interval;
        add(bar,b+.025,'drama_ostinato',{note:rootNote+12+pitch+(act===3&&i%3===2?12:0),
          length:act===2?.48:.29,velocity:lift*([0,3,6].includes(i)?.9:.62),bright:act>=1});
      });
      add(bar,.01,'drama_bass',{note:rootNote,length:act===2?2.7:1.7,velocity:act===2?.48:.67});
      if(bar!==8)add(bar,act===0?2.5:2,'drama_bass',{note:rootNote+(bar%2?7:0),length:1.25,velocity:.48});
      // A phrase-ending semitone pickup leads into the next bass root.
      if(dominant)add(bar,3.5,'drama_bass',{note:24+((roots[(bar+1)%16]+11)%12+12)%12,length:.36,velocity:.38});
      const callBeats=act===0?[.75,2.25]:act===1?[.5,1.75,3]:act===2?[1,2.75]:[.25,1.5,2.75];
      callBeats.forEach((b,i)=>add(bar,b,'drama_call',{
        note:rootNote+24+call[(bar*2+i+identity)%call.length],length:act===2?.9:.62,
        velocity:act===0?.38:act===3?.55:.46,palette:act===0?'muted_brass':act===2?'glass':i%2?palette:'brass'}));
      if(act===1||act===3)add(bar,2.25,'drama_answer',{
        notes:[rootNote+19,rootNote+(dominant?28:27)],length:.85,velocity:act===3?.42:.32});
      // The bridge deliberately removes the dance pulse before its rebuild.
      const hits=bar===8?[0]:act===2?[0,2.75]:act===0?[0,2.5]:[0,1.5,2.75];
      hits.forEach((b,i)=>add(bar,b,'drama_taiko',{note:rootNote+12-(i%2?5:0),velocity:i?.45:.6}));
      if(bar!==8)for(const b of act===0?[3]:act===2?[3.25]:[1,3])add(bar,b,'drama_snare',{velocity:act===3?.44:.3});
      if(act!==2)for(const b of act===0?[.75,2.25,3.5]:[.5,1.5,2.5,3.5])add(bar,b,'drama_tick',{velocity:.18});
      if([0,4,12].includes(bar))add(bar,0,'drama_surge',{note:rootNote+24,velocity:bar===12?.5:.32});
      if(dominant) {
        const fill=final&&bar===15?[2.5,2.75,3,3.1667,3.3333,3.5,3.6667,3.8333]:[3,3.25,3.5,3.75];
        fill.forEach((b,i)=>add(bar,b,'drama_fill',{
          note:rootNote+24-[0,5,7,12][i%4],length:.2,velocity:.28+i/fill.length*.22,snare:i%3===2}));
      }
      if(final&&bar>=12) {
        const rise=[[0,3,7,12],[2,7,10,14],[3,7,12,15],[11,14,19,12]][bar-12];
        [.5,1.5,2.5,3.5].forEach((b,i)=>add(bar,b,'drama_climax',{
          note:bar===15&&i===3?key+72:rootNote+36+rise[i],length:.7,velocity:.43+i*.025}));
        if(bar===15) {
          add(bar,3,'drama_strings',{notes:[key+48,key+51,key+55,key+62],length:.94,velocity:.58,bright:true});
          add(bar,3,'drama_bass',{note:key+24,length:.94,velocity:.63});
          add(bar,3,'drama_surge',{note:key+60,velocity:.38});
        }
      }
    }
    score.sort((a,b)=>a.beat-b.beat);
    return {beat,loopBeats:64,score,play(graph,event,at) {
      const type=event.type,vel=event.velocity,length=(event.length||.3)*beat;
      const pan=type==='drama_strings'?-.15:type==='drama_ostinato'?-.27:type==='drama_call'?.23:type==='drama_climax'?.3:type==='drama_answer'?-.3:0;
      const wet=type==='drama_strings'?.26:type==='drama_call'||type==='drama_climax'?.27:type==='drama_answer'?.18:.035;
      const v=voice(graph,'music',at,pan,wet);
      if(type==='drama_strings')dramaStrings(graph,v,at,event.notes,vel,length,event.bright);
      else if(type==='drama_ostinato') {
        tone(graph,v,at,event.note,length,vel*.19,'triangle',event.bright?1750:950,.009,.32);
        tone(graph,v,at,event.note+12.02,length*.65,vel*.038,'sawtooth',1900,.008,.22);
      } else if(type==='drama_bass') {
        tone(graph,v,at,event.note,length,vel*.33,'sine',0,.018,.7);
        tone(graph,v,at,event.note+12,length*.8,vel*.075,'triangle',700,.012,.45);
      } else if(type==='drama_call')instrument(graph,v,at,[event.note],vel*.8,length,event.palette);
      else if(type==='drama_answer')instrument(graph,v,at,event.notes,vel,length,'muted_brass');
      else if(type==='drama_climax') {
        tone(graph,v,at,event.note,length,vel*.11,'triangle',2600,.045,.72);
        tone(graph,v,at,event.note-.045,length,vel*.045,'sawtooth',1950,.04,.6);
        tone(graph,v,at,event.note-12,length*.8,vel*.055,'sine',2100,.03,.6);
      } else if(type==='drama_taiko'||type==='drama_fill') {
        const duration=type==='drama_fill'?.25:.5;
        const osc=tone(graph,v,at,event.note,duration,vel*.26,'sine',1100,.008,.26);
        osc.frequency.setValueAtTime(hz(event.note+4),at);
        osc.frequency.exponentialRampToValueAtTime(hz(event.note),at+.095);
        noise(graph,v,at,.075,vel*.04,550,.65,false);
        if(event.snare)noise(graph,v,at,.14,vel*.12,1800,.65,false);
      } else if(type==='drama_snare') {
        noise(graph,v,at,.17,vel*.15,1500,.6,false);
        tone(graph,v,at,48,.12,vel*.1,'triangle',1100,.004);
      } else if(type==='drama_tick')noise(graph,v,at,.07,vel*.1,4400,.5,true);
      else if(type==='drama_surge') {
        noise(graph,v,at,.85,vel*.12,3600,.55,true);
        tone(graph,v,at,event.note,.8,vel*.07,'sine',2400,.012,.25);
      }
    }};
  }
  const dramaticBossCompositions={},dramaticFinalCompositions={};
  // Function declarations are hoisted; the licensed test here has no I/O.
  TRACKS.forEach((metadata,index)=>{
    const id=isLicensed(metadata.id)?licensedFor(metadata.id).fallback:metadata.id;
    const harmony=oldHarmony[id]||MUSIC_DATA.scores[id].harmony;
    const definition=MUSIC_DATA&&MUSIC_DATA.scores[id];
    const palette=definition?definition.palette.lead:
      ({poker_lounge:'soft_piano',casino_lounge:'rhodes',starlight_felt:'glass',copper_groove:'clav'})[id];
    dramaticBossCompositions[metadata.id]=dramaticBossComposition(metadata,harmony,false,index,palette);
    dramaticFinalCompositions[metadata.id]=dramaticBossComposition(metadata,harmony,true,index,palette);
  });
  const DRAMATIC_ARRANGEMENTS=Object.freeze({boss:Object.freeze(dramaticBossCompositions),final_boss:Object.freeze(dramaticFinalCompositions)});
  function isLicensed(id) { return LICENSED_BY_ID.has(id); }
  function effectiveId(id, ready) { return isLicensed(id) && !ready ? licensedFor(id).fallback : id; }
  function compositionFor(id, scene, ready, bossDrama) {
    const arrangements=bossDrama===true&&bossScene(scene)?DRAMATIC_ARRANGEMENTS:ARRANGEMENTS;
    return arrangements[scene][effectiveId(id,ready)];
  }

  const MAX_ASSET_BYTES=12*1024*1024, MAX_DATA_URL=18*1024*1024;
  const MAX_DECODE_SECONDS=300, MAX_DECODE_SAMPLES=30000000;
  // One native fetch/decode lease across realtime and explicit offline previews.
  // A timeout cannot cancel native decodeAudioData: keep the lease until it really
  // settles, so rapid selections/timeouts cannot allocate parallel full-song buffers.
  let activeDecode = null;
  function localAssetUrl(metadata) {
    const catalog=root.BOMusicAssets, embedded=catalog && catalog[metadata.id];
    const value=typeof embedded==='string'?embedded:metadata.src;
    if(typeof value!=='string' || value.length>MAX_DATA_URL) throw new Error('asset_size_limit');
    if(/^data:audio\/(mpeg|mp3|wav|wave|x-wav);base64,/i.test(value)) return value;
    if(value!==metadata.src || !root.document || !root.location) throw new Error('local_asset_only');
    const url=new URL(value,root.document.baseURI);
    if(!['http:','https:'].includes(url.protocol) || url.origin!==root.location.origin) throw new Error('file_asset_requires_embedded_data');
    return url.href;
  }
  async function boundedAssetBytes(response) {
    const declared=Number(response.headers && response.headers.get('content-length'));
    if(declared>MAX_ASSET_BYTES) {
      if(response.body) try { await response.body.cancel(); } catch (_) {}
      throw new Error('asset_size_limit');
    }
    if(response.body && typeof response.body.getReader==='function') {
      const reader=response.body.getReader(), chunks=[];let total=0;
      try {
        for(;;) {
          const part=await reader.read();if(part.done)break;
          total+=part.value.byteLength;
          if(total>MAX_ASSET_BYTES) { await reader.cancel();throw new Error('asset_size_limit'); }
          chunks.push(part.value);
        }
      } finally { reader.releaseLock(); }
      const bytes=new Uint8Array(total);let offset=0;
      for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      return bytes.buffer;
    }
    return response.arrayBuffer();
  }
  function decodeLicensed(ctx, metadata, hooks) {
    if(activeDecode) return Promise.reject(new Error('asset_decode_busy'));
    const observe=hooks || {}, controller=typeof root.AbortController==='function'?new root.AbortController():null;
    const job={id:metadata.id,expired:false,controller};activeDecode=job;
    let resolveResult,rejectResult;
    const result=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject;});
    const fail=error=>{if(observe.failure)observe.failure(error);rejectResult(error);};
    job.timeout=root.setTimeout(()=>{
      job.expired=true;if(controller)controller.abort();fail(new Error('asset_timeout'));
    },20000);
    const work=(async()=>{
      // AudioContext resamples to its own rate. Reject known oversized target PCM
      // before native allocation (e.g. a high-rate 96-kHz context for George).
      if(Number.isFinite(ctx.sampleRate) && metadata.duration*ctx.sampleRate*2>MAX_DECODE_SAMPLES)
        throw new Error('asset_decode_limit');
      const url=localAssetUrl(metadata);
      if(typeof root.fetch!=='function') throw new Error('asset_fetch_unavailable');
      const response=await root.fetch(url,{credentials:'omit',redirect:'error',...(controller?{signal:controller.signal}:{})});
      if(job.expired)throw new Error('asset_timeout');
      if(!response.ok) throw new Error('asset_read_failed');
      const bytes=await boundedAssetBytes(response);
      if(job.expired)throw new Error('asset_timeout');
      if(!bytes.byteLength || bytes.byteLength>MAX_ASSET_BYTES) throw new Error('asset_size_limit');
      if(observe.decoding)observe.decoding();
      const buffer=await ctx.decodeAudioData(bytes);
      if(!buffer || !Number.isFinite(buffer.duration) || !Number.isInteger(buffer.numberOfChannels) ||
        buffer.numberOfChannels<1 || buffer.numberOfChannels>2 || buffer.duration>MAX_DECODE_SECONDS ||
        buffer.duration<1 || !Number.isFinite(buffer.length) || buffer.length<1 ||
        buffer.length*buffer.numberOfChannels>MAX_DECODE_SAMPLES) throw new Error('asset_decode_limit');
      return buffer;
    })();
    const finish=()=>{
      root.clearTimeout(job.timeout);if(activeDecode===job)activeDecode=null;
      pumpRecording();notifyStatus();
    };
    work.then(buffer=>{
      if(!job.expired){if(observe.success)observe.success(buffer);resolveResult(buffer);}
    },error=>{if(!job.expired)fail(error);}).then(finish,finish);
    return result;
  }
  function recordingRate(scene) { return scene==='last_chance'?Math.pow(2,-5/12):scene==='final_boss'?Math.pow(2,-3/12):scene==='boss'?Math.pow(2,-2/12):1; }
  function recordingVoice(target, buffer, at, position, scene, beat, endAt) {
    if(scene==='last_chance') return lastChanceRecording(target,buffer,at,position,beat,endAt);
    const rate=recordingRate(scene);
    const v=voice(target,'music',at,0,0), source=target.ctx.createBufferSource();
    source.buffer=buffer;source.loop=true;source.playbackRate.setValueAtTime(rate,at);
    const level=scene==='table'?.54:.30;
    v.output.gain.setValueAtTime(0,at);v.output.gain.linearRampToValueAtTime(level,at+.06);
    source.connect(v.output);
    v.source(source,at,endAt,(Math.max(0,position)*beat*rate)%buffer.duration);
    return v;
  }

  function lastChanceRecording(target, buffer, at, position, beat, endAt) {
    // Keep the verified local recording audible underneath the new orchestration,
    // with a five-semitone slowdown and subdued, low-passed backing (modified CC BY).
    const rate=recordingRate('last_chance'),v=voice(target,'music',at,0,.12);
    const source=target.ctx.createBufferSource(),filter=v.own(target.ctx.createBiquadFilter());
    source.buffer=buffer;source.loop=true;source.playbackRate.setValueAtTime(rate,at);
    filter.type='lowpass';filter.frequency.value=900;filter.Q.value=.5;
    v.output.gain.setValueAtTime(0,at);v.output.gain.linearRampToValueAtTime(.13,at+.18);
    source.connect(filter);filter.connect(v.output);
    v.source(source,at,endAt,(Math.max(0,position)*beat*rate)%buffer.duration);
    return v;
  }

  function cancelKind(graph, kind, immediate) {
    if (!graph) return;
    for (const v of [...graph[kind]]) v.cancel(!!immediate);
  }
  function disposeGraph(graph) {
    if (!graph || graph.disposed) return;
    graph.disposed = true;
    for (const v of [...graph.fxAll, ...graph.musicAll]) v.cancel(true);
    for (const node of graph.nodes) disconnect(node);
    graph.nodes.length = 0; graph.noise = null; graph.pianoWave = null;
  }

  let prefs = { ...DEFAULTS }, context = null, graph = null, unlocked = false;
  let scene = 'table', activeComposition = null, activeTrackId = DEFAULTS.track, transportGeneration = 0;
  // At most ONE retained decoded recording. Queued/failed descriptors contain no PCM.
  let assetBuffer = null, assetBufferId = null, assetVoice = null, recordingDemand = null, offlinePreviewActive = false;
  const assetStates = new Map(LICENSED_TRACKS.map(track=>[track.id,{status:'idle',error:null}]));
  const bufferFor = id => assetBufferId===id ? assetBuffer : null;
  function evictRecording() {
    if(assetBufferId && assetStates.get(assetBufferId).status==='ready')assetStates.get(assetBufferId).status='idle';
    assetBuffer=null;assetBufferId=null;
  }
  let lastStatusSignature = '';
  let playingMusic = false, timer = null, lastContextState = 'uninitialized';
  let musicPosition = 0, baseBeat = 0, baseTime = 0, scoreIndex = 0, cycle = 0;
  let lastSfx = null, eventsTriggered = 0, resumeAttempt = null, listening = false, xpVoice = null;
  const lastCalls = new Map();
  const fxEnabled = () => prefs.sound && !prefs.muted && prefs.sfxVolume > 0;
  const musicEnabled = () => prefs.music && !prefs.muted && prefs.musicVolume > 0;
  const musicAllowed = () => !!(context && graph && unlocked && musicEnabled() && !hidden() && context.state === 'running');

  function notifyStatus() {
    if (!root.dispatchEvent || typeof root.CustomEvent !== 'function') return;
    const value = status(), signature = JSON.stringify([value.track,value.scene,value.effectiveTrack,
      value.assetStatus,value.assetError,value.playingMusic,value.licensedPlaying,value.contextState,value.muted,value.unlocked,
      value.fxEnabled,value.musicEnabled,value.bossDrama,value.bossDramaActive,value.playerLevel]);
    if (signature === lastStatusSignature) return;
    lastStatusSignature = signature;
    try { root.dispatchEvent(new root.CustomEvent('bo-audio-status', { detail:value })); } catch (_) {}
  }
  function pauseMusic() {
    transportGeneration++;recordingDemand=null;
    for(const state of assetStates.values())if(state.status==='queued')state.status='idle';
    if (timer !== null) { root.clearTimeout(timer); timer = null; }
    if (playingMusic && context && activeComposition) musicPosition = Math.max(baseBeat,
      baseBeat + (context.currentTime - baseTime) / activeComposition.beat);
    playingMusic = false; assetVoice = null;
    cancelKind(graph, 'music', false);
  }
  function prepareRecording(token, current, selectedScene) {
    recordingDemand={token,current,scene:selectedScene,id:prefs.track};pumpRecording();
  }
  function pumpRecording() {
    const demand=recordingDemand;
    // Only a current, explicitly authorized transport demand may start/restart.
    // Cache completion by itself never creates a context, resumes or autoplays.
    if(!demand || demand.token!==transportGeneration || demand.current!==context || demand.id!==prefs.track ||
      demand.scene!==scene || scene==='frenzy' || !isLicensed(demand.id) || !musicAllowed())return;
    const id=demand.id,state=assetStates.get(id);
    if(bufferFor(id)) {pauseMusic();musicPosition=0;startMusic();notifyStatus();return;}
    if(activeDecode) {
      if(['idle','queued'].includes(state.status)){state.status='queued';state.error=null;}
      return;
    }
    if(!['idle','queued'].includes(state.status))return;
    evictRecording();state.status='loading';state.error=null;notifyStatus();
    decodeLicensed(demand.current,licensedFor(id),{
      decoding(){state.status='decoding';notifyStatus();},
      success(buffer){
        if(prefs.track===id && context===demand.current) {
          evictRecording();assetBuffer=buffer;assetBufferId=id;state.status='ready';state.error=null;
        } else {state.status='idle';state.error=null;}
      },
      failure(error){
        state.status='failed';const reason=error && error.message;
        state.error=['asset_size_limit','asset_decode_limit','asset_timeout','asset_read_failed','asset_decode_busy',
          'asset_fetch_unavailable','file_asset_requires_embedded_data','local_asset_only'].includes(reason)?reason:'asset_decode_failed';
        notifyStatus();
      }
    }).catch(()=>{});
  }
  function tick() {
    timer = null;
    if (!musicAllowed()) { pauseMusic(); notifyStatus(); return; }
    const now = context.currentTime, horizon = now + LOOKAHEAD, track = activeComposition;
    try {
      if (track.score.length) {
        let count = 0;
        while (count++ < 96) {
          const event = track.score[scoreIndex], absoluteBeat = cycle * track.loopBeats + event.beat;
          const when = baseTime + (absoluteBeat - baseBeat) * track.beat;
          if (when > horizon) break;
          // Never dump a delayed tab's backlog into one loud burst.
          if (when >= now - 0.025) track.play(graph, event, Math.max(now + 0.001, when), cycle);
          if (++scoreIndex === track.score.length) { scoreIndex = 0; cycle++; }
        }
        // A throttled foreground tab can jump many bars. Re-anchor to its next event.
        const nextBeat = cycle * track.loopBeats + track.score[scoreIndex].beat;
        if (baseTime + (nextBeat - baseBeat) * track.beat < now - 0.1) locate(baseBeat + (now - baseTime) / track.beat);
      }
      if (scene!=='frenzy' && isLicensed(prefs.track) && activeTrackId === prefs.track && bufferFor(prefs.track) && (!assetVoice || !graph.music.has(assetVoice))) {
        assetVoice = recordingVoice(graph,bufferFor(prefs.track),now+.035,baseBeat+(now-baseTime)/track.beat,
          scene,track.beat,now+86400);
      }
      timer = root.setTimeout(tick, TICK_MS);
      if (assetVoice) notifyStatus(); // Deduped; records when its scheduled downbeat really starts.
    } catch (_) { pauseMusic(); notifyStatus(); }
  }
  function locate(position) {
    const track = activeComposition;
    cycle = Math.floor(position / track.loopBeats);
    const localBeat = position - cycle * track.loopBeats;
    scoreIndex = track.score.findIndex(event => event.beat >= localBeat - 0.000001);
    if (scoreIndex < 0) { scoreIndex = 0; cycle++; }
  }
  function startMusic() {
    if (playingMusic || !musicAllowed()) return;
    // A decode completed while hidden/muted may replace an unheard fallback.
    // Start that first real recording at its beginning, but preserve subsequent
    // pauses of an already-playing recording exactly like the original tracks.
    const recording=bufferFor(prefs.track);
    if (isLicensed(prefs.track) && recording && activeTrackId !== prefs.track) musicPosition = 0;
    activeTrackId = effectiveId(prefs.track,!!recording);
    activeComposition = compositionFor(prefs.track,scene,!!recording,prefs.bossDrama);
    baseBeat = musicPosition; baseTime = context.currentTime + 0.035;
    locate(baseBeat); playingMusic = true;
    if (scene!=='frenzy' && isLicensed(prefs.track) && recording) assetVoice = recordingVoice(graph,recording,baseTime,baseBeat,scene,activeComposition.beat,baseTime+86400);
    tick();
    if (scene!=='frenzy' && isLicensed(prefs.track) && !recording && assetStates.get(prefs.track).status !== 'failed') prepareRecording(transportGeneration,context,scene);
  }
  function sync() {
    if (!context || !graph) return;
    ramp(graph.fxBus.gain, fxEnabled() ? prefs.sfxVolume : 0, context.currentTime, 0.025);
    ramp(graph.musicBus.gain, musicAllowed() ? prefs.musicVolume : 0, context.currentTime, 0.04);
    if (!fxEnabled()) cancelKind(graph, 'fx', false);
    if (musicAllowed()) startMusic(); else pauseMusic();
    notifyStatus();
  }
  function onStateChange() {
    if (!context) return;
    lastContextState = context.state;
    if (context.state !== 'running') pauseMusic();
    sync();
  }
  function onVisibility() {
    if (hidden()) { pauseMusic(); cancelKind(graph, 'fx', false); sync(); }
    else if (unlocked && context) {
      if (context.state === 'running') sync();
      else resumeCurrent(); // Previously permitted only; a blocked Safari resume is caught.
    }
  }
  function listen() {
    if (!listening && root.document && root.document.addEventListener) {
      root.document.addEventListener('visibilitychange', onVisibility); listening = true;
    }
    if (context && context.addEventListener) context.addEventListener('statechange', onStateChange);
  }
  function configure(next) {
    if (!next || typeof next !== 'object') return status();
    const level = Object.prototype.hasOwnProperty.call(next,'playerLevel') ? actualPlayerLevel(next.playerLevel) : prefs.playerLevel;
    const selected = trackId(next.track === undefined ? prefs.track : next.track,level);
    const selectedScene = next.scene === undefined ? scene : sceneId(next.scene);
    const selectedDrama = typeof next.bossDrama === 'boolean' ? next.bossDrama : prefs.bossDrama;
    if (selected !== prefs.track || selectedScene !== scene ||
        (selectedDrama !== prefs.bossDrama && bossScene(selectedScene))) {
      // Stop the one scheduler and fade/stop its old voices before changing tempo.
      // startMusic's 35-ms lead clears the 22-ms voice fade; begin at bar one,
      // never reinterpret the old beat position in the new composition.
      pauseMusic(); musicPosition = 0; scoreIndex = 0; cycle = 0;
    }
    for (const key of ['sound', 'music', 'muted', 'bossDrama']) if (typeof next[key] === 'boolean') prefs[key] = next[key];
    for (const key of ['sfxVolume', 'musicVolume']) if (next[key] !== undefined) prefs[key] = unit(next[key], prefs[key]);
    prefs.track = selected; prefs.playerLevel = level; scene = selectedScene;
    try { sync(); } catch (_) { pauseMusic(); }
    notifyStatus();
    return status();
  }
  function settleAttempt(attempt, success) {
    if (!attempt || attempt !== resumeAttempt) return;
    root.clearTimeout(attempt.timer); resumeAttempt = null;
    const ok = !!(success && context === attempt.context && context.state === 'running' && graph);
    if (ok) { unlocked = true; try { sync(); } catch (_) { pauseMusic(); } }
    attempt.resolve(ok);
  }
  function resumeCurrent() {
    if (!context) return Promise.resolve(false);
    const current = context;
    let result;
    // Keep this call synchronous in the caller's gesture stack, including Safari.
    try { result = current.resume(); }
    catch (_) { return Promise.resolve(false); }
    try { if (!graph) graph = makeGraph(current, prefs, false); }
    catch (_) {
      Promise.resolve(result).catch(() => {});
      return close().then(() => false);
    }
    if (current.state === 'running') {
      Promise.resolve(result).catch(() => {});
      unlocked = true; sync();
      if (resumeAttempt) settleAttempt(resumeAttempt, true);
      return Promise.resolve(true);
    }
    if (!resumeAttempt) {
      let resolve;
      const promise = new Promise(done => { resolve = done; });
      const attempt = { context: current, resolve, promise, timer: null };
      attempt.timer = root.setTimeout(() => settleAttempt(attempt, false), 1800);
      resumeAttempt = attempt;
    }
    const attempt = resumeAttempt;
    Promise.resolve(result).then(() => settleAttempt(attempt, true), () => settleAttempt(attempt, false));
    return attempt.promise;
  }
  function unlock() {
    try {
      const Constructor = audioConstructor();
      if (typeof Constructor !== 'function') return Promise.resolve(false);
      // Where exposed, refuse programmatic first unlocks outside a real user activation.
      const activation = root.navigator && root.navigator.userActivation;
      if (!unlocked && activation && activation.isActive === false) return Promise.resolve(false);
      if (!context || context.state === 'closed') {
        context = new Constructor({ latencyHint: 'interactive' });
        lastContextState = context.state; listen();
      }
      return resumeCurrent();
    } catch (_) { return Promise.resolve(false); }
  }
  function sfx(name, options) {
    if (!SFX_NAMES.has(name) || !unlocked || !graph || !context || context.state !== 'running' || !fxEnabled() || hidden()) return false;
    if (unit(options && options.intensity, 1) <= 0) return false;
    try {
      const shift = name === 'xp' ? xpSemitones(options) : 0;
      if (shift === null) return false;
      const now = context.currentTime, previous = lastCalls.get(name);
      if (previous !== undefined && now - previous < (COALESCE[name] || 0.028)) {
        if (name !== 'xp' || !xpVoice || shift <= xpVoice.xpSemitones) return false;
        // A higher award must not disappear behind a tiny passive tick. Before
        // the final attack, raise the SAME six oscillators (no voices/timers).
        if (now < xpVoice.at + 0.115) {
          if (!graph.fx.has(xpVoice)) return false;
          xpVoice.raiseXp(shift, now); lastSfx = name; eventsTriggered++;
          return true;
        }
        // Late higher awards get a fresh audible attack, fading the old one.
        // Starts are >=117ms apart: <=4 allocations/400ms, <=2 live voices
        // including the 22ms fade. Same/lower calls keep the full 400ms gate.
        if (graph.fx.has(xpVoice)) xpVoice.cancel(false);
      }
      const played = effect(graph, name, now + 0.002, options || {});
      if (!played) return false;
      if (name === 'xp') xpVoice = played;
      lastCalls.set(name, now); lastSfx = name; eventsTriggered++;
      return true;
    } catch (_) { return false; }
  }
  function cancelEffects() {
    cancelKind(graph, 'fx', false);
    lastCalls.clear(); xpVoice = null;
  }
  // New, isolated original chime. Existing coin/chip/XP voices and options above
  // are untouched. The caller confirms an actual positive award, not this layer.
  function moneyGainSound(target, at, options) {
    const bank=options && options.bank;
    if(!Number.isFinite(bank))return null;
    const logarithm=Math.log1p(Math.max(0,bank)),shift=18*logarithm/(logarithm+20);
    const v=voice(target,'fx',at,0,.12),intensity=unit(options.intensity,1);
    for(const [offset,midi,length,level,shape]of [[0,67,.12,.13,'sine'],[.035,74,.14,.075,'triangle'],[.07,79,.16,.04,'sine']])
      tone(target,v,at+offset,midi+shift,length,level*intensity,shape,2200,.003,.4);
    return v;
  }
  function moneyGain(bank) { return sfx('money_gain',{bank}); }
  function status() {
    const effectiveTrack = playingMusic ? activeTrackId : effectiveId(prefs.track,!!bufferFor(prefs.track));
    const assetState = assetStates.get(prefs.track);
    const licensedPlaying = !!(scene!=='frenzy' && playingMusic && isLicensed(prefs.track) && assetVoice && graph &&
      graph.music.has(assetVoice) && context && context.currentTime >= assetVoice.at);
    return { available: typeof audioConstructor() === 'function', unlocked,
      contextState: context ? context.state : lastContextState, playingMusic,
      fxEnabled: fxEnabled(), musicEnabled: musicEnabled(), muted: prefs.muted,
      scheduledVoices: graph ? graph.fx.size + graph.music.size : 0,
      lastSfx, eventsTriggered, track: prefs.track,
      bossDrama: prefs.bossDrama, bossDramaActive: prefs.bossDrama === true && bossScene(scene),
      trackName: TRACKS.find(track => track.id === prefs.track).name,
      scene, effectiveArrangement:scene, arrangementName:scene==='frenzy'?'Emerald Frenzy':scene==='last_chance'?'Last Chance':scene==='final_boss'?'Final Boss':scene==='boss'?'Boss Blind':'Table',
      effectiveTrack, effectiveTrackName:scene==='frenzy'?'Emerald Frenzy':TRACKS.find(track=>track.id===effectiveTrack).name,
      assetStatus:assetState?assetState.status:'idle', assetError:assetState?assetState.error:null,
      assetTrackId:assetState?prefs.track:null, assetCacheTrackId:assetBufferId,
      assetCacheBytes:assetBuffer?assetBuffer.length*assetBuffer.numberOfChannels*4:0,
      assetLoadTrackId:activeDecode?activeDecode.id:null,
      assetStates:Object.fromEntries([...assetStates].map(([id,state])=>[id,{...state}])),playerLevel:prefs.playerLevel,
      licensedPlaying, modified:licensedPlaying&&scene!=='table'&&scene!=='frenzy' };
  }
  function close() {
    pauseMusic();evictRecording();
    if (resumeAttempt) settleAttempt(resumeAttempt, false);
    const previous = context;
    if (listening && root.document) root.document.removeEventListener('visibilitychange', onVisibility);
    if (previous && previous.removeEventListener) previous.removeEventListener('statechange', onStateChange);
    listening = false; unlocked = false; context = null;
    disposeGraph(graph); graph = null;
    musicPosition = 0; lastCalls.clear(); lastSfx = null; eventsTriggered = 0; xpVoice = null;
    lastContextState = 'closed'; activeComposition = null;
    notifyStatus();
    try {
      const result = previous && previous.state !== 'closed' ? (previous.close ? previous.close() : previous.suspend()) : null;
      return Promise.resolve(result).then(() => true, () => false);
    } catch (_) { return Promise.resolve(false); }
  }

  function renderOffline(offlineContext, duration, overrides) {
    // Explicit previews own their decode; never read/write the realtime asset cache.
    if (!offlineContext || typeof offlineContext.startRendering !== 'function') {
      return Promise.reject(new TypeError('renderOffline needs an OfflineAudioContext.'));
    }
    const options=overrides && typeof overrides==='object'?overrides:{};
    // Match the graph's clamped window and 45-ms pickup before requesting a large
    // recording. Empty/short previews have no source to play and need no decode.
    const available=offlineContext.length/offlineContext.sampleRate;
    const seconds=clamp(number(duration,available),0,available);
    const selected=trackId(options.track,options.playerLevel), wantsRecording=sceneId(options.scene)!=='frenzy' && isLicensed(selected) && seconds>.045 && options.music!==false &&
      options.muted!==true && unit(options.musicVolume,DEFAULTS.musicVolume)>0;
    // One explicit recording preview at a time; it owns its buffer until rendering
    // finishes and never inserts it into the realtime cache or changes preferences.
    if(wantsRecording) {
      if(offlinePreviewActive || activeDecode)return Promise.reject(new Error('asset_decode_busy'));
      offlinePreviewActive=true;
      return decodeLicensed(offlineContext,licensedFor(selected)).then(buffer=>renderOfflineGraph(offlineContext,seconds,overrides,buffer))
        .finally(()=>{offlinePreviewActive=false;});
    }
    return renderOfflineGraph(offlineContext,seconds,overrides,null);
  }
  function renderOfflineGraph(offlineContext, duration, overrides, recording) {
    // No access to the singleton's context, preferences, counters or transport here.
    if (!offlineContext || typeof offlineContext.startRendering !== 'function') {
      return Promise.reject(new TypeError('renderOffline needs an OfflineAudioContext.'));
    }
    let offlineGraph;
    try {
      const available = offlineContext.length / offlineContext.sampleRate;
      const seconds = clamp(number(duration, available), 0, available);
      const offlinePrefs = { ...DEFAULTS };
      if (overrides && typeof overrides === 'object') {
        for (const key of ['sound', 'music', 'muted', 'bossDrama']) if (typeof overrides[key] === 'boolean') offlinePrefs[key] = overrides[key];
        for (const key of ['sfxVolume', 'musicVolume']) if (overrides[key] !== undefined) offlinePrefs[key] = unit(overrides[key], offlinePrefs[key]);
        offlinePrefs.playerLevel=actualPlayerLevel(overrides.playerLevel);
        if (overrides.track !== undefined) offlinePrefs.track = trackId(overrides.track,offlinePrefs.playerLevel);
      }
      const offlineScene=sceneId(overrides && overrides.scene);
      const track = compositionFor(offlinePrefs.track,offlineScene,!!recording,offlinePrefs.bossDrama);
      offlineGraph = makeGraph(offlineContext, offlinePrefs, true);
      const fade = offlineGraph.master.gain;
      fade.setValueAtTime(0, 0); fade.linearRampToValueAtTime(0.9, Math.min(0.03, seconds * 0.25));
      fade.setValueAtTime(0.9, Math.max(seconds * 0.5, seconds - 0.15));
      fade.linearRampToValueAtTime(0, seconds);
      const start = 0.045;
      if(recording && offlinePrefs.music && !offlinePrefs.muted && seconds>start) {
        recordingVoice(offlineGraph,recording,start,0,offlineScene,track.beat,seconds);
      }
      for (let c = 0; offlinePrefs.music && !offlinePrefs.muted && c * track.loopBeats * track.beat < seconds; c++) {
        for (const event of track.score) {
          const at = start + (c * track.loopBeats + event.beat) * track.beat;
          if (at >= seconds - 0.07) break;
          track.play(offlineGraph, event, at, c);
        }
      }
      // Optional explicit SFX preview; the existing demo and music API stay unchanged.
      const demo = overrides && Array.isArray(overrides.effects) ? overrides.effects : [
        [0.32, 'select'], [0.63, 'deselect'], [0.92, 'deal'], [1.05, 'deal'], [1.18, 'deal'],
        [1.64, 'play'], [2.08, 'chip', 0], [2.27, 'chip', 1], [2.46, 'chip', 2],
        [2.65, 'chip', 3], [2.84, 'chip', 4], [3.03, 'chip', 99],
        [3.46, 'mult', 2], [3.91, 'xmult'], [4.65, 'joker'], [5.3, 'coin'],
        [5.82, 'purchase'], [6.5, 'discard'], [7.05, 'pack'], [8.1, 'win'],
        [10.2, 'click'], [10.65, 'error'], [11.2, 'lose']
      ];
      // Tuples stay [time, name, numericPitch], or accept explicit options in
      // the third slot: [time, 'xp', {amount: awardedXp}]. Never mutate them.
      for (const [at, name, pitch] of demo) if (offlinePrefs.sound && !offlinePrefs.muted &&
        Number.isFinite(at) && at >= 0 && SFX_NAMES.has(name) && at < seconds - 0.1) {
        const options = pitch && typeof pitch === 'object' ? {
          pitch: pitch.pitch, intensity: unit(pitch.intensity, 0.82),
          ...(Object.prototype.hasOwnProperty.call(pitch, 'amount') ? { amount: pitch.amount } : {}),
          ...(Object.prototype.hasOwnProperty.call(pitch, 'bank') ? { bank: pitch.bank } : {})
        } : { pitch: pitch || 0, intensity: 0.82 };
        if (options.intensity > 0) effect(offlineGraph, name, at, options);
      }
      return Promise.resolve(offlineContext.startRendering()).then(buffer => {
        disposeGraph(offlineGraph); return buffer;
      }, error => { disposeGraph(offlineGraph); throw error; });
    } catch (error) { disposeGraph(offlineGraph); return Promise.reject(error); }
  }

  root.BOAudio = Object.freeze({ configure, unlock, sfx, moneyGain, cancelEffects, status, close,
    tracks: TRACKS, tracksForPlayerLevel, renderOffline });
})(typeof window !== 'undefined' ? window : globalThis);
