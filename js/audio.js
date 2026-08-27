// Synthesized sound: key clicks, error thuds, arrival whistle, collect ding,
// the soft poof of a thing coming apart and the assemble that runs it
// backwards, the pickup run off the ground and the shimmer it lands on,
// and the train rhythm — steady typing makes the ride sound smooth.
// No audio assets; everything is WebAudio. Global namespace: AUDIO
(function () {
  'use strict';

  // ---------- three buses ----------
  // Everything the game makes goes through exactly one of these, and the
  // switches move the bus rather than reaching into the sounds. The split is
  // the one docs/bgm-plan.md asks for, made now while there is still nothing
  // to retrofit:
  //
  //   sfx      every event: clicks, thuds, dings, whistles, the lot
  //   music    the typing rhythm layer (the rumble and the clack), and
  //            js/music.js when it lands
  //   weather  the sky's ambience, and nothing else ever
  //
  // The weather bus is quiet by construction. The click ladder lives at 1.6
  // and 5.2 kHz and it is the atomic reward of the whole game, so no ambience
  // is allowed to put anything up there: rain is low-passed to a patter, wind
  // is unresonant so it can never whistle, and the night and day beds are
  // narrow, quiet and sparse. Weather is ducked by typing, never the reverse.
  const PREF_KEY = 'mk.sound';         // the sfx switch; it was the only one once
  const MUSIC_KEY = 'mk.music';
  const WX_KEY = 'mk.weather';
  const LEGACY_KEY = 'transsib.sound'; // pre-rename preference; adopted once
  let sfxOn = true, musicOn = true, wxOn = true;
  try {
    let v = localStorage.getItem(PREF_KEY);
    if (v === null) {
      v = localStorage.getItem(LEGACY_KEY);
      if (v !== null) { localStorage.setItem(PREF_KEY, v); localStorage.removeItem(LEGACY_KEY); }
    }
    sfxOn = v !== 'off';
    // Somebody who turned the one old switch off wanted silence, so the music
    // switch starts where that one was and only then goes its own way.
    const m = localStorage.getItem(MUSIC_KEY);
    musicOn = m === null ? sfxOn : m !== 'off';
    wxOn = localStorage.getItem(WX_KEY) !== 'off';
  } catch { /* defaults on */ }

  // A second, non-persisted switch, held down by the debug autotyper: at
  // machine speed the key clicks are a buzzsaw, and the preference the player
  // actually set has to survive being talked over.
  let muted = false;

  let ctx = null;
  let rumbleGain = null;
  let clackTimer = null;
  let sfxBus = null, musicBus = null, wxBus = null;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0;
      musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 1 : 0;
      wxBus = ctx.createGain(); wxBus.gain.value = sfxOn && wxOn ? 1 : 0;
      sfxBus.connect(ctx.destination);
      musicBus.connect(ctx.destination);
      wxBus.connect(ctx.destination);
      buildRumble();
      buildWeather();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // which bus a sound is on, and whether it is allowed to make a noise at all
  const busOf = (bus) => (bus === 'music' ? musicBus : bus === 'wx' ? wxBus : sfxBus);
  function busOK(bus) {
    if (!ctx || muted) return false;
    if (bus === 'music') return musicOn;
    if (bus === 'wx') return sfxOn && wxOn;
    return sfxOn;
  }
  function rampBus(g, to) {
    if (g && ctx) g.gain.setTargetAtTime(to, ctx.currentTime, 0.08);
  }
  function syncBuses() {
    rampBus(sfxBus, sfxOn && !muted ? 1 : 0);
    rampBus(musicBus, musicOn && !muted ? 1 : 0);
    rampBus(wxBus, sfxOn && wxOn && !muted ? 1 : 0);
  }

  // Short filtered noise burst — a soft mechanical click.
  function noiseBurst(dur, freq, gain, type, when, bus) {
    if (!busOK(bus)) return;
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
    src.connect(filter).connect(g).connect(busOf(bus));
    src.start(t);
  }

  function tone(freq, dur, gain, when, type, bus) {
    if (!busOK(bus)) return;
    const t = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    osc.type = type || 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(busOf(bus));
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
    src.connect(filter).connect(rumbleGain).connect(musicBus);
    src.start();
  }

  // ---------- the weather bed ----------
  // Three looping noise sources, all built once and left running silent. The
  // sky opens their gains; nothing here starts or stops. Every cutoff below is
  // chosen to stay out of the way of the key click, which is the whole reason
  // this bed can exist at all.
  let rainGain = null, rainLp = null, rainLp2 = null, windGain = null, windBp = null, nightGain = null;
  let wxDuck = null;                       // typing pushes the weather back through this
  function noiseLoop(seconds, brown) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.05 * white) / 1.05; d[i] = last * 2.6; } else d[i] = white;
    }
    // the seam: cross-fade the tail into the head so the loop has no click in it
    const fade = Math.floor(ctx.sampleRate * 0.25);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] = d[i] * k + d[len - fade + i] * (1 - k);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopEnd = (len - fade) / ctx.sampleRate;
    return src;
  }
  function buildWeather() {
    wxDuck = ctx.createGain();
    wxDuck.gain.value = 1;
    wxDuck.connect(wxBus);

    // Rain, deliberately not realistic. Real rain is broadband hiss centred on
    // exactly the band the click needs, so this one is rolled off hard: what
    // is left is patter and weight, rain heard through a window. That trade is
    // the price of having rain at all.
    // Two poles, not one. Measured: a single lowpass at 900 Hz leaves 1.6 kHz
    // only 8 dB down, and 1.6 kHz is the body of the key click. Cascaded it is
    // 16 dB down there, and 5.2 kHz (the sparkle, the part that makes a click
    // crisp) is 30 dB down and effectively absent.
    const rs = noiseLoop(3, false);
    rainLp = ctx.createBiquadFilter();
    rainLp.type = 'lowpass';
    rainLp.Q.value = 0.5;                  // no resonance: a peak here would ring
    rainLp.frequency.value = 700;
    rainLp2 = ctx.createBiquadFilter();
    rainLp2.type = 'lowpass';
    rainLp2.Q.value = 0.5;
    rainLp2.frequency.value = 700;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rs.connect(rainLp).connect(rainLp2).connect(rainGain).connect(wxDuck);
    rs.start();

    // Wind: one wide unresonant band. Q stays low on purpose. A resonant peak
    // would give the wind a pitch, and a pitch would fight whatever key the
    // soundtrack is in.
    const ws = noiseLoop(4, true);
    windBp = ctx.createBiquadFilter();
    windBp.type = 'bandpass';
    windBp.frequency.value = 320;
    windBp.Q.value = 0.7;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    ws.connect(windBp).connect(windGain).connect(wxDuck);
    ws.start();

    // The night bed: low and wide, frogs and the bog rather than crickets.
    // Crickets sit at 4 to 5 kHz, which is the click, so the bed stays under
    // 500 Hz and the only thing that goes higher is the odd short chirp below.
    const ns = noiseLoop(5, true);
    const nlp = ctx.createBiquadFilter();
    nlp.type = 'lowpass';
    nlp.frequency.value = 480;
    nlp.Q.value = 0.4;
    nightGain = ctx.createGain();
    nightGain.gain.value = 0;
    ns.connect(nlp).connect(nightGain).connect(wxDuck);
    ns.start();
  }

  // What the sky tells the ear, once a second or so. Everything is a target,
  // never a step, so a shower arriving is a shower arriving and not a switch.
  //   rain  0..1 how hard it is coming down
  //   wind  0..1 how hard it is blowing
  //   night 0..1 how far into the dark it is
  function weather(w) {
    if (!ctx || !rainGain) return;
    const t = ctx.currentTime;
    const rain = Math.max(0, Math.min(1, w.rain || 0));
    const wind = Math.max(0, Math.min(1, w.wind || 0));
    const night = Math.max(0, Math.min(1, w.night || 0));
    // 0.22 puts the bed's peak at about the level of the loudest key click, so
    // a storm is present without ever being the loudest thing in the room
    rainGain.gain.setTargetAtTime(0.22 * rain, t, 1.2);
    // heavier rain is not only louder, it is lower and fuller
    rainLp.frequency.setTargetAtTime(520 + 380 * rain, t, 1.5);
    rainLp2.frequency.setTargetAtTime(520 + 380 * rain, t, 1.5);
    windGain.gain.setTargetAtTime(0.055 * wind, t, 1.6);
    // the night bed backs off under rain: one weather at a time is enough
    nightGain.gain.setTargetAtTime(0.030 * night * (1 - 0.7 * rain), t, 2.0);
    wxState = { rain, wind, night };
  }
  let wxState = { rain: 0, wind: 0, night: 0 };

  // The voices over the bed: a night chirp, a day whistle. Both are pitched
  // into the gap between the click's body at 1.6 kHz and its sparkle at 5.2,
  // both are quiet, and both are sparse enough to be a place rather than a
  // loop. Called on a timer, never on the frame.
  let voiceTimer = null;
  function scheduleVoice() {
    const wait = 4200 + Math.random() * 12000;
    voiceTimer = setTimeout(() => {
      voiceTimer = null;
      if (busOK('wx')) {
        if (wxState.night > 0.6 && wxState.rain < 0.25) {
          // a night insect: three short pulses, dry, well under the click
          const n = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < n; i++) tone(2280 + Math.random() * 220, 0.05, 0.011, i * 0.11, 'triangle', 'wx');
        } else if (wxState.night < 0.25 && wxState.rain < 0.2) {
          // a bird, two notes and gone
          const f = 1900 + Math.random() * 500;
          tone(f, 0.10, 0.012, 0, 'sine', 'wx');
          tone(f * 1.34, 0.13, 0.010, 0.11, 'sine', 'wx');
        }
      }
      scheduleVoice();
    }, wait);
  }

  // Typing pushes the weather back. This is the guardrail from
  // docs/bgm-plan.md read the only way it may be read: the storm ducks for the
  // keystroke, the keystroke never ducks for the storm. A run of clean
  // characters clears the air, and letting the run go only lets it back in.
  // Carrot, no stick: nothing is taken away when the streak breaks, the world
  // simply stops being pushed.
  function setDrive(k) {
    if (!wxDuck || !ctx) return;
    const drive = Math.max(0, Math.min(1, k || 0));
    wxDuck.gain.setTargetAtTime(1 - 0.45 * drive, ctx.currentTime, 0.5);
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
    if (!busOK()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(1040, t + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g).connect(sfxBus);
    o.start(t); o.stop(t + 0.12);
  }
  // inventory count-up: rising micro-ticks (the addictive one)
  function countTick(i) { ensureCtx(); tone(820 + Math.min(i, 14) * 55, 0.04, 0.05); }

  // Thunder: a long low roll, and deliberately NOT a crack. Two constraints
  // decide every number here and neither is realism.
  //
  // It must never be mistaken for `thud`, the error sound: that is a short
  // low-passed burst with a hard onset, and a thunderclap is the same thing in
  // the same band. Being told you made a mistake you did not make is the one
  // thing a sound in this game must never do. So thunder swells over a fifth
  // of a second instead of starting, runs ten times longer, and peaks well
  // under the thud.
  //
  // And it must not mask a keystroke: the click lives at 1.6 and 5.2 kHz, so
  // this is brown noise under a filter that closes from 260 Hz to 70 Hz. There
  // is nothing of it left where the clicks are.
  function thunder() {
    ensureCtx();
    if (!busOK('wx')) return;
    const t = ctx.currentTime, dur = 2.2;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.03 * white) / 1.03;        // brown: weight, no hiss
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.4;                             // no resonance: a peak would whistle
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.exponentialRampToValueAtTime(70, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.22);
    g.gain.setValueAtTime(0.075, t + 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g).connect(wxDuck);
    src.start(t); src.stop(t + dur);
  }
  // a thing coming apart: a soft puff, never a bang. The attack is a ramp
  // and not a step — a step is exactly what makes a noise burst read as a
  // crack — and the filter closes from a breath down to a thud over the
  // whole length of it, so what is heard is air leaving, then weight
  // settling, then three quiet taps of the pieces landing.
  function poof() {
    ensureCtx();
    if (!busOK()) return;
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
    src.connect(lp).connect(g).connect(sfxBus);
    src.start(t); src.stop(t + dur);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(58, t + 0.3);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.13, t + 0.035);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(og).connect(sfxBus);
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
    if (!busOK()) return;
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
    o.connect(g).connect(sfxBus);
    o.start(t); o.stop(t + 0.13);
    noiseBurst(0.02, 4200, 0.025, 'highpass');          // the sparkle on top of it
  }
  // A batch of goods landing in the bag. The pop at the far end of the
  // flight: `mint` and `pickup` fire when a good leaves the world, this
  // fires when it arrives, so a reward is two beats and not one. It sits
  // above the count-up ticks rather than over them — a bell and a sparkle,
  // both quiet, and a fatter batch only opens it a little wider.
  function arrive(n) {
    ensureCtx();
    if (!busOK()) return;
    const k = Math.min(1, (Math.max(1, n || 1) + 2) / 6);
    tone(1568, 0.16, 0.05 * k, 0, 'sine');
    tone(2093, 0.22, 0.035 * k, 0.035, 'sine');
    noiseBurst(0.05, 6000, 0.03 * k, 'highpass', 0.02);
  }
  // Materials leaving the bag on their way to a build site: `mint` run
  // backwards, a pop that falls instead of climbing. Soft on purpose —
  // paying is the wind-up, and the latch at the end is the payoff.
  function pay() {
    ensureCtx();
    if (!busOK()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(430, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(sfxBus);
    o.start(t); o.stop(t + 0.14);
    noiseBurst(0.03, 3200, 0.02, 'highpass');
  }
  // A thing coming together: `poof` run backwards. Where the poof opens a
  // breath down into a thud, this gathers a thud up into a breath — the
  // filter climbs, the body tone rises instead of sagging, and the three
  // quiet taps lead in rather than trailing off. It ends on the swell,
  // which is where `build`'s latch lands.
  function assemble() {
    ensureCtx();
    if (!busOK()) return;
    const t = ctx.currentTime, dur = 0.34;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.5;                                   // no resonance, same as the poof
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.exponentialRampToValueAtTime(1500, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + dur * 0.8);   // the swell, at the end this time
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g).connect(sfxBus);
    src.start(t); src.stop(t + dur);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(62, t);
    o.frequency.exponentialRampToValueAtTime(165, t + 0.3);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.12, t + 0.24);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.33);
    o.connect(og).connect(sfxBus);
    o.start(t); o.stop(t + 0.35);
    noiseBurst(0.05, 520, 0.03, 'lowpass', 0.02);
    noiseBurst(0.05, 700, 0.04, 'lowpass', 0.09);
    noiseBurst(0.06, 900, 0.05, 'lowpass', 0.16);
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

  function onKey(iki, streak) {
    ensureCtx();
    lastKeyAt = performance.now();
    if (iki !== null && iki > 0 && iki < 2000) {
      ikis.push(iki);
      if (ikis.length > 10) ikis.shift();
    }
    if (!clackTimer) scheduleClack();
    if (!voiceTimer) scheduleVoice();
    // a run of forty clean characters has the weather all the way back
    if (streak !== undefined) setDrive(Math.min(1, streak / 40));
  }

  function smoothness() {
    if (ikis.length < 5) return 0;
    const mean = ikis.reduce((a, b) => a + b, 0) / ikis.length;
    const sd = Math.sqrt(ikis.reduce((a, b) => a + (b - mean) ** 2, 0) / ikis.length);
    const cv = sd / mean;
    return Math.max(0, 1 - cv * 1.4); // cv 0 → 1.0, cv ≥ 0.71 → 0
  }

  // The rhythm layer is the closest thing to a soundtrack the game has today,
  // so it rides the music bus and answers the music switch, not the sfx one.
  function scheduleClack() {
    const idleMs = performance.now() - lastKeyAt;
    if (idleMs > 2500 || !musicOn || muted) {
      clackTimer = null;
      if (rumbleGain && ctx) rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      return;
    }
    const mean = ikis.length ? ikis.reduce((a, b) => a + b, 0) / ikis.length : 400;
    const beat = Math.min(1000, Math.max(260, mean * 2.4));
    const smooth = smoothness();
    if (rumbleGain) rumbleGain.gain.setTargetAtTime(0.028 * (0.3 + 0.7 * smooth), ctx.currentTime, 0.3);
    // clickety-clack: two soft thumps, crisper when smooth
    const vol = 0.05 + 0.09 * smooth;
    noiseBurst(0.05, 300 + 200 * smooth, vol, 'lowpass', 0, 'music');
    setTimeout(() => noiseBurst(0.05, 260 + 180 * smooth, vol * 0.8, 'lowpass', 0, 'music'), Math.min(160, beat * 0.28));
    clackTimer = setTimeout(scheduleClack, beat);
  }

  function setSfx(on) {
    sfxOn = !!on;
    try { localStorage.setItem(PREF_KEY, sfxOn ? 'on' : 'off'); } catch { /* non-fatal */ }
    syncBuses();
  }
  function setMusic(on) {
    musicOn = !!on;
    try { localStorage.setItem(MUSIC_KEY, musicOn ? 'on' : 'off'); } catch { /* non-fatal */ }
    if (!musicOn && rumbleGain && ctx) rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    syncBuses();
  }
  function setWeather(on) {
    wxOn = !!on;
    try { localStorage.setItem(WX_KEY, wxOn ? 'on' : 'off'); } catch { /* non-fatal */ }
    syncBuses();
  }

  function setMuted(on) {
    muted = !!on;
    if (muted && rumbleGain && ctx) rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    syncBuses();
  }

  window.AUDIO = {
    click, thud, ding, whistle, press, mint, build, countTick, fanfare, poof,
    assemble, pickup, arrive, pay, thunder, onKey, setMuted,
    // the sky drives these two; nothing else may
    weather, setDrive,
    // the three switches. sfx and music are the player's, in the header;
    // weather is a developer switch while the bed is being judged.
    setSfx, isSfx: () => sfxOn,
    setMusic, isMusic: () => musicOn,
    setWeather, isWeather: () => wxOn,
  };
})();
