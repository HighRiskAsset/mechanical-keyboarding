// Synthesized sound: key clicks, error thuds, arrival whistle, collect ding,
// the soft poof of a thing coming apart, the pickup run off the ground,
// and the train rhythm — steady typing makes the ride sound smooth.
// No audio assets; everything is WebAudio. Global namespace: AUDIO
(function () {
  'use strict';

  const PREF_KEY = 'mk.sound';
  const LEGACY_KEY = 'transsib.sound'; // pre-rename preference; adopted once
  let enabled = true;
  try {
    let v = localStorage.getItem(PREF_KEY);
    if (v === null) {
      v = localStorage.getItem(LEGACY_KEY);
      if (v !== null) { localStorage.setItem(PREF_KEY, v); localStorage.removeItem(LEGACY_KEY); }
    }
    enabled = v !== 'off';
  } catch { /* default on */ }

  let ctx = null;
  let rumbleGain = null;
  let clackTimer = null;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      buildRumble();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Short filtered noise burst — a soft mechanical click.
  function noiseBurst(dur, freq, gain, type, when) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type || 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t);
  }

  function tone(freq, dur, gain, when, type) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    osc.type = type || 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Continuous low rumble, silent until the rhythm engine opens the gain.
  function buildRumble() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown-ish noise
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;
    rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;
    src.connect(filter).connect(rumbleGain).connect(ctx.destination);
    src.start();
  }

  // ---- the feedback ladder: tick → pop → count-up → ka-chunk → fanfare ----
  // One satisfying mobile-game language, not per-station instruments.

  // keystroke: crisp two-layer tick
  function click() { ensureCtx(); noiseBurst(0.018, 5200, 0.05, 'highpass'); noiseBurst(0.028, 1600, 0.09); }
  function thud() { ensureCtx(); noiseBurst(0.09, 220, 0.18, 'lowpass'); }
  function ding() { ensureCtx(); tone(1320, 0.25, 0.08); tone(1760, 0.35, 0.05, 0.07); }
  function press() { ensureCtx(); noiseBurst(0.14, 130, 0.24, 'lowpass'); tone(90, 0.16, 0.1, 0.02, 'sine'); }
  // material pickup: quick pitch-up pop
  function mint() {
    ensureCtx();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(1040, t + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.12);
  }
  // inventory count-up: rising micro-ticks (the addictive one)
  function countTick(i) { ensureCtx(); tone(820 + Math.min(i, 14) * 55, 0.04, 0.05); }
  // a thing coming apart: a soft puff, never a bang. The attack is a ramp
  // and not a step — a step is exactly what makes a noise burst read as a
  // crack — and the filter closes from a breath down to a thud over the
  // whole length of it, so what is heard is air leaving, then weight
  // settling, then three quiet taps of the pieces landing.
  function poof() {
    ensureCtx();
    if (!enabled || !ctx) return;
    const t = ctx.currentTime, dur = 0.42;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.5;                                   // no resonance: a resonant sweep whistles
    lp.frequency.setValueAtTime(1300, t);
    lp.frequency.exponentialRampToValueAtTime(220, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);      // the swell
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(t); src.stop(t + dur);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(58, t + 0.3);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.13, t + 0.035);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(og).connect(ctx.destination);
    o.start(t); o.stop(t + 0.36);
    noiseBurst(0.05, 900, 0.05, 'lowpass', 0.12);
    noiseBurst(0.05, 700, 0.04, 'lowpass', 0.2);
    noiseBurst(0.06, 520, 0.03, 'lowpass', 0.29);
  }
  // a loose good swept off the ground and into the bag: the same pop the
  // typed goods make, but it climbs a semitone for every one that follows
  // close behind, so clearing a heap is a run up the scale instead of the
  // same note eight times. The run resets after a moment of quiet.
  let pickAt = 0, pickRun = 0;
  function pickup() {
    ensureCtx();
    if (!enabled || !ctx) return;
    const now = performance.now();
    pickRun = now - pickAt < 900 ? Math.min(pickRun + 1, 11) : 0;
    pickAt = now;
    const t = ctx.currentTime;
    const base = 460 * Math.pow(2, pickRun / 12);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 2, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.13);
    noiseBurst(0.02, 4200, 0.025, 'highpass');          // the sparkle on top of it
  }
  // purchase: latch + heavy chunk + body resonance
  function build() {
    ensureCtx();
    noiseBurst(0.03, 1800, 0.14);
    noiseBurst(0.12, 120, 0.26, 'lowpass', 0.045);
    tone(230, 0.16, 0.07, 0.05);
  }
  // automation earned: short brass arpeggio with a sparkle
  function fanfare() {
    ensureCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => tone(f, 0.22, 0.075, i * 0.09));
    tone(1046.5, 0.5, 0.06, 0.27);
    tone(1568, 0.4, 0.03, 0.3);
    noiseBurst(0.2, 4000, 0.03, 'highpass', 0.28);
  }
  function whistle() {
    ensureCtx();
    tone(660, 0.55, 0.07, 0, 'sine'); tone(880, 0.55, 0.05, 0.02, 'sine');
    tone(660, 0.8, 0.06, 0.7, 'sine'); tone(880, 0.8, 0.045, 0.72, 'sine');
  }

  // ---- rhythm engine ----
  // Fed inter-key intervals; when typing is active and *consistent*, the
  // wheels clack in time and the rumble opens up. Erratic typing = rattly,
  // quiet ride. Idle = silence.
  const ikis = [];
  let lastKeyAt = 0;

  function onKey(iki) {
    ensureCtx();
    lastKeyAt = performance.now();
    if (iki !== null && iki > 0 && iki < 2000) {
      ikis.push(iki);
      if (ikis.length > 10) ikis.shift();
    }
    if (!clackTimer) scheduleClack();
  }

  function smoothness() {
    if (ikis.length < 5) return 0;
    const mean = ikis.reduce((a, b) => a + b, 0) / ikis.length;
    const sd = Math.sqrt(ikis.reduce((a, b) => a + (b - mean) ** 2, 0) / ikis.length);
    const cv = sd / mean;
    return Math.max(0, 1 - cv * 1.4); // cv 0 → 1.0, cv ≥ 0.71 → 0
  }

  function scheduleClack() {
    const idleMs = performance.now() - lastKeyAt;
    if (idleMs > 2500 || !enabled) {
      clackTimer = null;
      if (rumbleGain) rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      return;
    }
    const mean = ikis.length ? ikis.reduce((a, b) => a + b, 0) / ikis.length : 400;
    const beat = Math.min(1000, Math.max(260, mean * 2.4));
    const smooth = smoothness();
    if (rumbleGain) rumbleGain.gain.setTargetAtTime(0.028 * (0.3 + 0.7 * smooth), ctx.currentTime, 0.3);
    // clickety-clack: two soft thumps, crisper when smooth
    const vol = 0.05 + 0.09 * smooth;
    noiseBurst(0.05, 300 + 200 * smooth, vol, 'lowpass');
    setTimeout(() => noiseBurst(0.05, 260 + 180 * smooth, vol * 0.8, 'lowpass'), Math.min(160, beat * 0.28));
    clackTimer = setTimeout(scheduleClack, beat);
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch { /* non-fatal */ }
    if (!on && rumbleGain && ctx) rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  }
  function isEnabled() { return enabled; }

  window.AUDIO = { click, thud, ding, whistle, press, mint, build, countTick, fanfare, poof, pickup, onKey, setEnabled, isEnabled };
})();
