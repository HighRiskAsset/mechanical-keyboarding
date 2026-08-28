// The soundtrack. Seven tracks live in assets/bgm; which ones, and why those
// and not others, is docs/bgm-plan.md. This file is only the machine that
// plays them, and every rule in it falls out of one fact: the player is
// reading and typing for about thirty hours.
//
//   · Nothing is ever hard-looped. A seam heard four hundred times is a seam,
//     so a track crossfades into its successor three seconds before it ends —
//     which also swallows the fade-out Suno leaves on the tail, and the tail
//     is exactly three seconds long on every one of them.
//   · A pool never plays the same file twice running. Fatigue is fought with
//     rotation, not with blandness; that is the whole reason the basin has two
//     tracks instead of one good one.
//   · A biome edge does not move the music until the new ground has held for
//     a moment. The meadow-to-biome boundary is a ragged band by design, not
//     a line, and an operator standing on it would otherwise crossfade back
//     and forth for as long as they stood there.
//   · Output goes on AUDIO's music bus. The header switch, the mute and the
//     master limiter apply to a loaded track exactly as they do to a key
//     click, because it is the same graph and there is only one of it.
//
// Global namespace: MUSIC
(function () {
  'use strict';

  const DIR = 'assets/bgm/';
  const XFADE = 3.0;          // track → track, and the length of Suno's tail fade
  const XREGION = 2.0;        // place → place, short enough to feel like a step
  const FIRST_IN = 1.5;       // the very first fade of a session
  const HOLD_MS = 1800;       // how long new ground must hold before the music follows
  const POLL_MS = 500;

  // Which files a place may draw from. The outer biomes rotate with the basin
  // pair so that no one of them is a single cue on repeat; the bog and the
  // peaks keep their own company instead, because both are tonally particular
  // enough that dropping the bright basin dorian in beside them would undo
  // the thing they were written to do.
  const POOLS = {
    basin:  ['01-basin-a', '02-basin-b'],
    quarry: ['03-far-frontier', '01-basin-a', '02-basin-b'],
    canyon: ['03-far-frontier', '01-basin-a', '02-basin-b'],
    flats:  ['03-far-frontier', '01-basin-a', '02-basin-b'],
    bog:    ['04-coal-bog', '03-far-frontier'],
    peaks:  ['05-snow-peaks', '03-far-frontier'],
    range:  ['01-basin-a', '02-basin-b'],
    works:  ['06-the-works'],
    launch: ['07-launch'],
  };
  const DEFAULT_POOL = 'basin';

  // The map is not fixed and is not supposed to be — biomes are placeable and
  // CHAIN.MAP is explicitly never locked to one shape, so a table keyed only
  // by region id would go quietly wrong the day someone adds a region rather
  // than moving one. (Coordinates have already shifted once under this file;
  // the ids happened to survive, which is luck, not design.)
  //
  // So the id is the override and the *ground* is the rule. Every region
  // declares a `base` kind, and every kind tiles.js can draw is spoken for
  // here, which means a new biome gets music that suits it on the day it is
  // authored and nobody has to remember this file exists.
  const BY_GROUND = {
    grass: 'basin',  pad: 'basin',   board: 'basin',   // home, and ground somebody built
    dirt: 'quarry',  rock: 'quarry', shale: 'quarry',  // dry working country
    sand: 'quarry',  crack: 'quarry',
    snow: 'peaks',   frost: 'peaks', ice: 'peaks',     // high and thin
    marsh: 'bog',    water: 'bog',   tar: 'bog',       // wet and uneasy
  };

  let out = null;             // { ctx, bus } from AUDIO
  let duck = null;            // one node between every voice and the bus
  let voice = null;           // { src, gain, name, startedAt, dur }
  let current = null;         // the pool key now playing
  let nextTimer = null;
  let poller = null;
  let wantWorks = false;
  let pendingPool = null, pendingSince = 0;

  const buffers = new Map();  // name → AudioBuffer
  const inflight = new Map(); // name → Promise
  const failed = new Set();   // names that 404'd; asked for once, never again

  // ---------- loading ----------

  function load(name) {
    if (buffers.has(name)) return Promise.resolve(buffers.get(name));
    if (inflight.has(name)) return inflight.get(name);
    if (failed.has(name)) return Promise.reject(new Error('gave up on ' + name));
    const p = fetch(DIR + name + '.mp3')
      .then((r) => { if (!r.ok) throw new Error(r.status + ' ' + name); return r.arrayBuffer(); })
      // the callback form, not the promise form: Safari has shipped the
      // callback signature for far longer and this is the one place a silent
      // failure would cost the whole soundtrack
      .then((bytes) => new Promise((res, rej) => out.ctx.decodeAudioData(bytes, res, rej)))
      .then((buf) => { buffers.set(name, buf); inflight.delete(name); return buf; })
      .catch((err) => { inflight.delete(name); failed.add(name); throw err; });
    inflight.set(name, p);
    return p;
  }

  // ---------- fades ----------

  // Equal power, not linear. Two different tracks do not sum coherently, so a
  // pair of straight ramps dips audibly in the middle of every crossfade;
  // sin² + cos² = 1 holds the loudness flat across the join instead.
  function curve(rising, peak) {
    const n = 64, a = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * (Math.PI / 2);
      a[i] = (rising ? Math.sin(t) : Math.cos(t)) * peak;
    }
    return a;
  }

  function play(name, buf, fadeIn) {
    const g = out.ctx.createGain();
    g.connect(duck);
    const src = out.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    const t0 = out.ctx.currentTime;
    g.gain.setValueAtTime(0, t0);
    g.gain.setValueCurveAtTime(curve(true, 1), t0, fadeIn);
    src.start(t0);
    return { src, gain: g, name, startedAt: t0, dur: buf.duration };
  }

  function retire(v, fadeOut) {
    if (!v) return;
    const t0 = out.ctx.currentTime;
    try {
      // scale the falling curve to wherever the gain actually is: a voice cut
      // short mid-fade-in is not at 1, and starting the curve at 1 would step
      // it up before taking it down
      const from = Math.max(0.0001, v.gain.gain.value);
      v.gain.gain.cancelScheduledValues(t0);
      v.gain.gain.setValueAtTime(from, t0);
      v.gain.gain.setValueCurveAtTime(curve(false, from), t0, fadeOut);
      v.src.stop(t0 + fadeOut + 0.05);
    } catch (e) {
      try { v.src.stop(); } catch (e2) { /* already gone */ }
    }
  }

  // ---------- choosing ----------

  function pick(pool) {
    const all = (POOLS[pool] || POOLS[DEFAULT_POOL]).filter((n) => !failed.has(n));
    if (!all.length) return null;
    if (all.length === 1) return all[0];
    const fresh = all.filter((n) => !voice || n !== voice.name);
    const from = fresh.length ? fresh : all;
    return from[Math.floor(Math.random() * from.length)];
  }

  // The successor is queued a crossfade early, by clock rather than by the
  // source's own ended event — ended fires when the track is already silent,
  // which is a join too late to be a join at all.
  function queueNext() {
    clearTimeout(nextTimer);
    if (!voice) return;
    const left = (voice.startedAt + voice.dur) - out.ctx.currentTime - XFADE;
    nextTimer = setTimeout(() => {
      if (!voice || !current) return;
      swap(current, XFADE);
    }, Math.max(50, left * 1000));
  }

  function swap(pool, fade) {
    const name = pick(pool);
    if (!name) return;
    load(name).then((buf) => {
      if (!out || current !== pool) return;   // the operator moved on while it loaded
      const old = voice;
      voice = play(name, buf, fade);
      retire(old, fade);
      queueNext();
      // warm the rest of the pool so the next join does not wait on the network
      for (const n of POOLS[pool] || []) if (n !== name) load(n).catch(() => {});
    }).catch(() => { /* a missing file is silence, not an exception */ });
  }

  function goTo(pool, fade) {
    if (!out) return;
    current = pool;
    swap(pool, voice ? (fade || XREGION) : FIRST_IN);
  }

  function silence(fade) {
    clearTimeout(nextTimer);
    retire(voice, fade || 0.4);
    voice = null;
    current = null;
  }

  // ---------- where the operator is standing ----------

  // Named region first, its ground second, home last. The middle step is the
  // one that makes this survive an expanding map.
  function placeNow() {
    try {
      const p = window.FACTORY && FACTORY.playerPos && FACTORY.playerPos();
      if (!p) return null;
      const r = window.CHAIN && CHAIN.regionAt && CHAIN.regionAt(p.x, p.y);
      if (!r) return null;
      if (r.id && POOLS[r.id]) return r.id;
      if (r.base && BY_GROUND[r.base]) return BY_GROUND[r.base];
      return null;
    } catch (e) { return null; }
  }

  function tick() {
    if (!out) return;

    // The switch is the player's, and it is checked here rather than left to
    // the bus gain: a muted bus still costs the fetch, the decode and the
    // scheduling, and someone who turned the music off should not go on
    // paying for it.
    const on = !window.AUDIO || !AUDIO.isMusic || AUDIO.isMusic();
    if (!on) { if (voice) silence(0.4); return; }

    const target = wantWorks ? 'works' : (placeNow() || DEFAULT_POOL);
    if (target === current) { pendingPool = null; return; }
    if (!current) { goTo(target); return; }        // nothing playing: no reason to wait

    const now = (window.performance && performance.now) ? performance.now() : Date.now();
    if (pendingPool !== target) { pendingPool = target; pendingSince = now; return; }
    if (now - pendingSince < HOLD_MS) return;
    pendingPool = null;
    goTo(target);
  }

  // ---------- start ----------

  // Browsers will not let audio begin without a gesture, and the first gesture
  // in this game is always a keystroke. ensureCtx inside AUDIO.musicOut does
  // the resuming; this only has to be late enough to be allowed.
  let begun = false;
  function begin() {
    if (begun) return;
    if (!window.AUDIO || !AUDIO.musicOut) return;
    const o = AUDIO.musicOut();
    if (!o) return;
    begun = true;
    out = o;
    duck = out.ctx.createGain();
    duck.gain.value = 1;
    duck.connect(out.bus);
    tick();
    poller = setInterval(tick, POLL_MS);
  }

  window.addEventListener('keydown', begin);
  window.addEventListener('pointerdown', begin);

  // ---------- the small public surface ----------

  window.MUSIC = {
    // Automation changed the world, so the world changes what it sounds like:
    // once a place is running itself, its loop gives way to the works theme.
    // Driven from outside because whether a place counts as automated is the
    // simulation's business, not the soundtrack's.
    works(on) { wantWorks = !!on; },

    // The finish. Immediate and unheld — this is the one cue that has earned
    // the right to interrupt, and the one track that ends rather than loops.
    launch() { if (out) { wantWorks = false; goTo('launch', 1.0); } },

    // Duck, do not stop, under the arrival whistle. Its own node, so a duck
    // landing in the middle of a crossfade does not fight the crossfade.
    duck(depth, seconds) {
      if (!duck || !out) return;
      const t = out.ctx.currentTime, d = Math.max(0, Math.min(1, depth === undefined ? 0.45 : depth));
      duck.gain.cancelScheduledValues(t);
      duck.gain.setTargetAtTime(d, t, 0.05);
      duck.gain.setTargetAtTime(1, t + (seconds || 1.2), 0.25);
    },

    // for the console, and for dev/ pages that want to see the state
    now() {
      return {
        place: current, track: voice ? voice.name : null, works: wantWorks,
        loaded: [...buffers.keys()], missing: [...failed],
      };
    },
  };
})();
