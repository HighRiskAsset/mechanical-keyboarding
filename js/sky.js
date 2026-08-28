// The sky over the map: an invisible clock, a colour grade and the weather.
//
// Everything in this file draws OVER the finished world and under the labels,
// and none of it knows what a sprite looks like. That is the whole point. The
// art can be redrawn, baked to PNG and remastered, and the atmosphere still
// works, because it is light and water laid on top of the picture rather than
// part of it.
//
// One rule holds all the way through, the same one the world keeps: the layer
// is scaled by the same whole number as the world, every position is an integer
// world pixel, and every soft edge is baked into a canvas at one canvas pixel
// per world pixel. No smoothing, no rotation, no half pixels. A slanted rain
// streak is a stepped column of pixels, not a rotated sprite.
//
// LIGHT MULTIPLIES A SURFACE. It is never added to one. That is the single
// rule the whole lighting model turns on, and getting it wrong once already
// cost this file a rewrite: an additive lamp adds the same constant to every
// pixel under it regardless of what the pixel is, so every surface converges
// on the colour of the lamp. Measured on the additive build, under a firebox
// at midnight, grass came out red-dominant, so did water, so did an iron
// machine, and water gave up 78% of its saturation. There is no tuning that
// fixes an operator that is wrong.
//
// So the dark and the lamps are ONE layer. The hour's ambient level is the
// floor of an offscreen light map; every light is added onto that map, because
// lights genuinely sum in the air; and the finished map multiplies the world
// exactly once. Lit ground multiplies by about (0.82, 0.72, 0.70) against an
// unlit (0.29, 0.33, 0.49): brighter, warmer, and still its own colour.
//
// The layer, bottom to top:
//   1. cloud shadows     world-anchored soft blots, multiply, daylight only
//   2. THE LIGHT MAP     the hour and every lamp on it, multiplied on in one
//   3. emissive cores    add: the sources themselves, small and hot, because a
//                        multiply can never take a surface past its daylight
//   4. the hour's throw  a faint add: the colour a low sun scatters back
//   5. the weather wash  a multiply the weather owns, plus wet ground
//   6. what is in the air fireflies after dark, motes in a low sun
//   7. precipitation     rain streaks and the splashes they land in, or snow
//   8. fog banks         soft wisps drifting through the place
//   9. lightning         a full-frame add flash
//  10. vignette          a permanent soft frame, a touch heavier at night
//
// The clock is invisible on purpose: no dial, no number, nothing to manage.
// One full day is DAY_LEN seconds of play, and the game opens mid-morning so
// the first thing a new player sees is daylight. Weather runs its own slow
// chain: every sky picks the next one from a short table of the skies it can
// honestly turn into, so an hour walks clear, cloudy, drizzle, rain rather
// than teleporting from sunshine to blizzard.
//
// Two frames are in play, and which one a layer belongs to is a judgement, not
// a rule. What is slow, sparse and has no direction sits in the WORLD, drawn at
// world minus camera and wrapped around it so the field never runs out: cloud
// shadows, fireflies, motes and fog banks. They stay over the ground they are
// on, and walking carries you through them.
//
// Precipitation rides the FRAME, and the long comment over tickRain says why it
// is the exception. In short: a drop anchored in the world stands still over
// the ground, and the price is that your own walking becomes its travel across
// the screen, which tips several hundred streaks about sixteen degrees and
// swings them through thirty-one every time you reverse. That was shipped once
// and came straight back. A slip you have to watch the ground to see is the
// cheaper of the two errors.
//
// The washes belong to neither frame because they have no place to be: the
// grade, the wet sheen, the lightning and the vignette are the frame itself.
//
// Nothing here touches the simulation. Weather is weather: it changes no rate,
// gates nothing, and is never a mechanic.
//
// Global namespace: SKY
(function () {
  'use strict';

  const DAY_LEN = 720;          // seconds of play in one full day, midnight to midnight
  const START_T = 0.36;         // the game opens mid-morning
  const FADE = 16;              // seconds a sky takes to become the next one
  const SPELL_MIN = 70, SPELL_VAR = 120;
  const PREF_KEY = 'mk.sky';    // 'full' | 'calm' | 'off'

  // ---------- the hours ----------
  // One key per hour worth naming. `mul` and `ma` are the sun: the colour and
  // the depth the sky multiplies the world by, which is illumination and
  // therefore keeps every surface its own. `add`/`aa` is only scatter, the
  // haze a low sun leaves hanging in the air, and it is deliberately small.
  //
  // The `aa` column used to be three times this and was doing the golden hour
  // on its own, which is the same mistake the lamps made: an additive wash
  // pulls every surface toward the colour of the wash. The warmth moved into
  // `mul` where it belongs, so sunset now TINTS the world instead of painting
  // over it, and `add` was left with the little that is genuinely airborne.
  const HOURS = [
    { t: 0.00, name: 'night',   mul: 0x1c2a5c, ma: 0.80, add: 0x1e3468, aa: 0.05, lamp: 1.00 },
    { t: 0.15, name: 'night',   mul: 0x1f2e60, ma: 0.77, add: 0x1e3468, aa: 0.05, lamp: 1.00 },
    { t: 0.21, name: 'dawn',    mul: 0x3a3d68, ma: 0.64, add: 0x2b2452, aa: 0.04, lamp: 0.90 },
    { t: 0.27, name: 'sunrise', mul: 0xa8705a, ma: 0.40, add: 0xff9a5a, aa: 0.05, lamp: 0.55 },
    { t: 0.34, name: 'morning', mul: 0xdcc4a0, ma: 0.17, add: 0xffd08a, aa: 0.03, lamp: 0.18 },
    { t: 0.44, name: 'day',     mul: 0xffffff, ma: 0.00, add: 0xfff4d6, aa: 0.03, lamp: 0.04 },
    { t: 0.60, name: 'day',     mul: 0xffffff, ma: 0.00, add: 0xfff4d6, aa: 0.03, lamp: 0.04 },
    { t: 0.70, name: 'gold',    mul: 0xffc078, ma: 0.18, add: 0xffb45a, aa: 0.04, lamp: 0.20 },
    { t: 0.77, name: 'sunset',  mul: 0xd07a4a, ma: 0.36, add: 0xff7a3a, aa: 0.06, lamp: 0.62 },
    { t: 0.84, name: 'dusk',    mul: 0x4a4c80, ma: 0.58, add: 0x3c2c5c, aa: 0.05, lamp: 0.92 },
    { t: 0.91, name: 'night',   mul: 0x243158, ma: 0.75, add: 0x1e3468, aa: 0.05, lamp: 1.00 },
    { t: 1.00, name: 'night',   mul: 0x1c2a5c, ma: 0.80, add: 0x1e3468, aa: 0.05, lamp: 1.00 },
  ];
  const DARKEST = 0.80;         // the ma at midnight, so `day` below reads 0..1

  // ---------- the skies ----------
  // `next` is the only sequencing rule there is: the weights a sky uses to pick
  // what it becomes. Nothing may reach a sky that is not in somebody's table,
  // and no sky may reach one it could not plausibly turn into.
  const SKIES = {
    clear: {
      cloud: 0.20, fog: 0.00, wind: 0.35, mul: null,
      next: { clear: 2, cloudy: 4, fog: 1 },
    },
    cloudy: {
      cloud: 1.00, fog: 0.05, wind: 0.75, mul: { c: 0x7f8a9e, a: 0.30 },
      next: { clear: 3, cloudy: 1, drizzle: 4, fog: 1, snow: 2 },
    },
    drizzle: {
      rain: 55, len: 3, fall: 3.0, cloud: 0.85, fog: 0.10, wind: 0.55,
      mul: { c: 0x74839c, a: 0.34 },
      next: { cloudy: 3, rain: 4, clear: 2 },
    },
    rain: {
      rain: 140, len: 5, fall: 4.8, splash: 1, cloud: 1.00, fog: 0.14, wind: 1.00,
      mul: { c: 0x5b6c8a, a: 0.42 },
      next: { drizzle: 4, storm: 2, cloudy: 2 },
    },
    storm: {
      rain: 210, len: 7, fall: 6.4, splash: 1, bolts: 1, cloud: 1.20, fog: 0.16, wind: 1.70,
      mul: { c: 0x46536f, a: 0.52 },
      next: { rain: 5, drizzle: 2 },
    },
    fog: {
      cloud: 0.35, fog: 0.66, wind: 0.22, mul: { c: 0xa9b1bd, a: 0.14 },
      next: { clear: 3, cloudy: 2, fog: 1, drizzle: 1 },
    },
    snow: {
      snow: 120, fall: 0.85, cloud: 0.70, fog: 0.18, wind: 0.60,
      mul: { c: 0x93a9c4, a: 0.26 },
      next: { cloudy: 4, snow: 2, clear: 2, fog: 1 },
    },
  };
  const SKY_IDS = Object.keys(SKIES);

  // ---------- what a firebox says ----------
  // A machine's light pool is not decoration: it is the machine's state, read
  // off the ground it stands on. The same fire at four temperatures, never a
  // different colour per kind, so a smelter and a mine at the same heat look
  // the same and only the heat carries meaning. `lo` is how far down the beat
  // pulls the light: a running box never goes out, a starved one nearly does.
  const FIRE = {
    work:    { base: 1.00, tint: 0xffb964, lo: 0.68, beat: 'work' },     // running: throbs on the work beat
    full:    { base: 0.72, tint: 0xffa848, lo: 0.80, beat: 'breathe' },  // made it, nowhere to put it
    starved: { base: 0.40, tint: 0xff7a3c, lo: 0.45, beat: 'gutter' },   // nothing to eat: going out
    banked:  { base: 0.36, tint: 0xff9a54, lo: 0.90, beat: 'steady' },   // not automated, nobody there
  };

  const MAX_RAIN = 240, MAX_SNOW = 150, FOG_BANDS = 7, CLOUDS = 7;
  const FLIES = 48, MOTES = 30, SHEENS = 3;
  // The operator's lantern, in world pixels. A tile is 16, so the plateau is
  // 32: two full tiles every way stay plainly lit, and the light then falls
  // off over the next twenty to nothing. These two numbers are the whole
  // answer to "how far can I see at night", so they are named and up here.
  const LANTERN_R = 52, LANTERN_HOLD = 32 / 52;

  // ---------- state ----------
  let mode = 'full';
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === 'calm' || v === 'off') mode = v;
  } catch (e) { /* full stands */ }

  let app = null, root = null;
  let cloudC, hourAddSp, wxMulSp, packSp, sheenC, airC, wxC, fogC, boltSp, vigSp;
  // the light map and the pieces that build it
  let lightScene, ambientSp, lightC, lightMapSp, lightRT, emitC;
  let vw = 430, vh = 230, S = 2, vigKey = '';

  let clock = START_T * DAY_LEN;
  let held = null;                        // a clock the dev page froze, or null
  let curSky = 'clear', prevSky = 'clear', spell = 0, spellLen = 110, mixK = 1;
  // A front arrives from one side or the other and the whole spell leans that
  // way, so the rain does not slant the same direction for an entire session.
  let curDir = 1, prevDir = 1;
  let forced = null;                      // a sky the dev page pinned, or null
  let climate = {};                       // per-map weights, 1 unless the map says otherwise
  let windX = 0, windY = 0, gustPh = 0;
  // Two accumulators with the same shape: they climb while the weather runs
  // and fall back afterwards, slower than they rose. Both are full-frame
  // grades and neither asks what a tile is, so both survive any art change.
  // `pack` is deliberately quick to melt: with no seasons in the game, snow
  // lying past the spell that dropped it is a reskin with nothing behind it.
  let wet = 0;                            // 0..1, rises in rain and dries off slowly
  let pack = 0;                           // 0..1, snow lying on the ground
  let sheenPh = 0;
  // A/B switches, developer only: either effect can be taken out without
  // touching the other or the rest of the sky.
  const FX_KEYS = { wet: 'mk.fx.wet', pack: 'mk.fx.pack', lightmap: 'mk.fx.lightmap' };
  const fx = { wet: true, pack: true, lightmap: true };
  try {
    for (const k of Object.keys(FX_KEYS)) fx[k] = localStorage.getItem(FX_KEYS[k]) !== 'off';
  } catch (e) { /* both on */ }
  let boltA = 0, boltNext = 6, boltEcho = 0;
  let lampK = 0, dayK = 1, warmK = 0;
  let flick = 0, frames = 0, camX = 0, camY = 0;
  // the machines' two animation periods, in frames; factory.js hands over the
  // real numbers so a firebox throbs in step with the sprite it belongs to
  let beatWork = 36, beatIdle = 48;

  const rain = [], snow = [], fogs = [], clouds = [], pools = [], flies = [], motes = [], sheens = [];
  let lightDefs = [];                     // what the map handed us, in world coords
  let followX = 0, followY = 0;           // the operator, who carries a lantern

  // ---------- little maths ----------
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const rnd = (a, b) => a + Math.random() * (b - a);
  function mixColor(a, b, k) {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(lerp(ar, br, k)) << 16) | (Math.round(lerp(ag, bg, k)) << 8) | Math.round(lerp(ab, bb, k));
  }

  function hourAt(t) {
    let i = 0;
    while (i < HOURS.length - 2 && HOURS[i + 1].t <= t) i++;
    const a = HOURS[i], b = HOURS[i + 1];
    const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
    return {
      name: k < 0.5 ? a.name : b.name,
      mul: mixColor(a.mul, b.mul, k), ma: lerp(a.ma, b.ma, k),
      add: mixColor(a.add, b.add, k), aa: lerp(a.aa, b.aa, k),
      lamp: lerp(a.lamp, b.lamp, k),
    };
  }

  // ---------- baked art ----------
  // Every soft edge in this file is a stack of flat discs or flat rows, the way
  // the halo in pixels.js is built. Nothing here calls arc(), nothing is ever
  // scaled by a fraction, and every canvas is drawn at one pixel per world
  // pixel so the upscale stays exact.
  const texCache = new Map();
  const cv = (w, h) => PIXELS.util.canvas(w, h);
  function baked(key, make) {
    if (!texCache.has(key)) texCache.set(key, PIXELS.util.tex(make()));
    return texCache.get(key);
  }

  // A pool of light: white, so the sprite can be tinted, and soft, so it reads
  // as light falling rather than as a target painted on the ground.
  // `hold` is the fraction of the radius that stays at full brightness before
  // the light starts to fall away. A fire wants 0 (it is brightest at its
  // middle and dies out); a lantern wants a plateau, because a lantern in a
  // top-down game is a radius you can see by and not a bright spot on a hat.
  // How hard a light burns at its middle. This was 0.62 while lights were
  // added on top of the world, where every extra point of it was another point
  // of wash, so it was held down. Multiplied into a map it cannot wash
  // anything and it cannot take a surface past its own daylight, so it can be
  // generous: at 0.95 a lantern brings the ground under it back to about
  // nine tenths of noon, warmed, which is what standing under a lamp looks
  // like. It is the single number that says how bright a light is.
  const HALO_PEAK = 0.95;
  function haloCanvas(r, hold) {
    const d = r * 2 + 1;
    const [c, x] = cv(d, d);
    const h = hold || 0;
    // One value per pixel, worked out from the distance to the middle. The
    // canvas is at one pixel per world pixel and the sprite is never scaled by
    // a fraction, so this is as much a pixel as anything the world draws: the
    // ramp is in the alpha, not in a filter.
    for (let py = 0; py < d; py++) {
      for (let px = 0; px < d; px++) {
        const dx = px - r, dy = py - r;
        const k = clamp01((1 - Math.sqrt(dx * dx + dy * dy) / r) / (1 - h));
        if (k <= 0) continue;
        const a = HALO_PEAK * (h > 0 ? Math.pow(k, 1.5) : k * k);
        x.fillStyle = 'rgba(255, 255, 255, ' + a.toFixed(4) + ')';
        x.fillRect(px, py, 1, 1);
      }
    }
    return c;
  }
  const haloTex = (r, hold) => baked('halo:' + r + ':' + (hold || 0), () => haloCanvas(r, hold));

  // A rain streak: one pixel wide, stepped sideways by `slant` down its length,
  // brightest at the head. White, so the tint carries the hour.
  function rainCanvas(len, slant) {
    const w = Math.max(1, Math.abs(slant) + 1);
    const [c, x] = cv(w, len);
    for (let i = 0; i < len; i++) {
      const step = slant === 0 ? 0 : Math.round((i / (len - 1)) * slant);
      const px = slant < 0 ? w - 1 + step : step;   // a leftward streak leans in from the right
      const a = 0.35 + 0.65 * (i / (len - 1));
      x.fillStyle = 'rgba(255, 255, 255, ' + a.toFixed(3) + ')';
      x.fillRect(px, i, 1, 1);
    }
    return c;
  }
  const rainTex = (len, slant) => baked('rain:' + len + ':' + slant, () => rainCanvas(len, slant));

  // Where a drop lands: two frames, opening out and thinning away.
  function splashCanvas(f) {
    const [c, x] = cv(5, 3);
    if (f === 0) {
      x.fillStyle = 'rgba(255,255,255,0.75)'; x.fillRect(2, 1, 1, 1);
      x.fillStyle = 'rgba(255,255,255,0.40)'; x.fillRect(1, 2, 3, 1);
    } else {
      x.fillStyle = 'rgba(255,255,255,0.30)'; x.fillRect(0, 2, 1, 1); x.fillRect(4, 2, 1, 1);
      x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(2, 0, 1, 1);
    }
    return c;
  }
  const splashTex = (f) => baked('splash:' + f, () => splashCanvas(f));

  // Snow: three sizes, none of them a circle.
  function flakeCanvas(s) {
    if (s === 0) {
      const [c, x] = cv(1, 1);
      x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(0, 0, 1, 1);
      return c;
    }
    if (s === 1) {
      const [c, x] = cv(2, 2);
      x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, 0, 2, 2);
      return c;
    }
    const [c, x] = cv(3, 3);
    x.fillStyle = 'rgba(255,255,255,0.95)';
    x.fillRect(1, 0, 1, 3); x.fillRect(0, 1, 3, 1);
    return c;
  }
  const flakeTex = (s) => baked('flake:' + s, () => flakeCanvas(s));

  // The sheen on wet ground: one broad soft band, drawn the full height of the
  // frame and slid across it. It reads as wet because it MOVES the way light
  // moves on a wet surface, not because it knows what is underneath, which is
  // exactly why it survives every art change: it never asks what a tile is.
  function sheenCanvas(w, h) {
    const [c, x] = cv(w, h);
    for (let px = 0; px < w; px++) {
      const k = Math.sin((px / (w - 1)) * Math.PI);
      const a = Math.pow(k, 2.2);
      if (a <= 0.004) continue;
      x.fillStyle = 'rgba(255,255,255,' + a.toFixed(4) + ')';
      x.fillRect(px, 0, 1, h);
    }
    return c;
  }
  const sheenTex = (w, h) => baked('sheen:' + w + 'x' + h, () => sheenCanvas(w, h));

  // A firefly: one hot pixel with a breath of light around it. Drawn white and
  // tinted, like everything else here.
  function flyCanvas() {
    const [c, x] = cv(5, 5);
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(1, 1, 3, 3);
    x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(2, 1, 1, 3); x.fillRect(1, 2, 3, 1);
    x.fillStyle = 'rgba(255,255,255,0.95)'; x.fillRect(2, 2, 1, 1);
    return c;
  }
  const flyTex = () => baked('fly', flyCanvas);

  // A mote of something in the air, catching a low sun. One pixel, or two.
  function moteCanvas(big) {
    const [c, x] = cv(big ? 2 : 1, big ? 2 : 1);
    x.fillStyle = 'rgba(255,255,255,0.9)';
    x.fillRect(0, 0, big ? 2 : 1, big ? 2 : 1);
    return c;
  }
  const moteTex = (big) => baked('mote:' + (big ? 1 : 0), () => moteCanvas(big));

  // A cloud shadow on the ground: a run of overlapping soft discs, wide and
  // low, so it reads as one drifting blot and not as a row of balls.
  function cloudCanvas(seed) {
    const W = 132, H = 74;
    const [c, x] = cv(W, H);
    let n = seed * 9301 + 49297;
    const nx = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
    const blobs = [];
    for (let i = 0; i < 6; i++) blobs.push([18 + nx() * (W - 36), 20 + nx() * (H - 40), 16 + nx() * 15]);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        let v = 0;
        for (let b = 0; b < blobs.length; b++) {
          const dx = px - blobs[b][0], dy = (py - blobs[b][1]) * 1.45;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < blobs[b][2]) v = Math.max(v, 1 - d / blobs[b][2]);
        }
        if (v <= 0.02) continue;
        x.fillStyle = 'rgba(255,255,255,' + Math.min(1, v * 1.25).toFixed(3) + ')';
        x.fillRect(px, py, 1, 1);
      }
    }
    return c;
  }
  const cloudTex = (seed) => baked('cloud:' + seed, () => cloudCanvas(seed));

  // A fog bank: a long low wisp, thickest through the middle of its height.
  function fogCanvas(seed) {
    const W = 220, H = 42;
    const [c, x] = cv(W, H);
    let n = seed * 7717 + 104729;
    const nx = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
    const lumps = [];
    for (let i = 0; i < 7; i++) lumps.push([nx() * W, 12 + nx() * 18, 26 + nx() * 34]);
    for (let py = 0; py < H; py++) {
      const band = Math.sin((py / (H - 1)) * Math.PI);          // dies at both edges
      for (let px = 0; px < W; px++) {
        let v = 0;
        for (let i = 0; i < lumps.length; i++) {
          const dx = px - lumps[i][0], dy = (py - lumps[i][1]) * 3.2;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < lumps[i][2]) v = Math.max(v, 1 - d / lumps[i][2]);
        }
        v *= band;
        if (v <= 0.02) continue;
        x.fillStyle = 'rgba(255,255,255,' + (v * 0.75).toFixed(3) + ')';
        x.fillRect(px, py, 1, 1);
      }
    }
    return c;
  }
  const fogTex = (seed) => baked('fog:' + seed, () => fogCanvas(seed));

  // The frame: four edge ramps on a canvas the size of the viewport, so it is
  // one canvas pixel per world pixel and never resampled. Rebuilt only when the
  // viewport changes shape.
  function vignetteCanvas(w, h) {
    const [c, x] = cv(w, h);
    const d = Math.max(10, Math.round(Math.min(w, h) * 0.30));
    const edge = (gx0, gy0, gx1, gy1, rx, ry, rw, rh) => {
      const g = x.createLinearGradient(gx0, gy0, gx1, gy1);
      g.addColorStop(0, 'rgba(6, 10, 16, 1)');
      g.addColorStop(1, 'rgba(6, 10, 16, 0)');
      x.fillStyle = g;
      x.fillRect(rx, ry, rw, rh);
    };
    edge(0, 0, 0, d, 0, 0, w, d);
    edge(0, h, 0, h - d, 0, h - d, w, d);
    edge(0, 0, d, 0, 0, 0, d, h);
    edge(w, 0, w - d, 0, w - d, 0, d, h);
    return c;
  }

  // ---------- build ----------
  // factory.js calls this straight after the world container goes on the stage,
  // so the whole layer sits above the world and below the labels and the bag.
  function flat(blend) {
    const sp = new PIXI.Sprite(PIXI.Texture.WHITE);
    sp.blendMode = blend;
    sp.alpha = 0;
    return sp;
  }
  function init(pixiApp) {
    if (!pixiApp || typeof PIXI === 'undefined' || !window.PIXELS) return null;
    app = pixiApp;
    root = new PIXI.Container();
    root.scale.set(S);
    root.eventMode = 'none';

    cloudC = new PIXI.Container(); cloudC.blendMode = 'multiply';
    // ---------- the light map ----------
    // Light MULTIPLIES a surface, it is never added to it. Adding a constant
    // to every pixel regardless of what the pixel is has one result: every
    // surface converges on the colour of the lamp. Measured on the shipped
    // additive build, under a firebox at night, grass, water and an iron
    // machine all came out RED-dominant, and water lost 78% of its saturation.
    // That is what washed out means, and no amount of tuning fixes an operator
    // that is wrong.
    //
    // So the darkness and the lamps are one layer, not two. Into an offscreen
    // map the size of the viewport goes the hour's ambient level, and every
    // light is ADDED on top of it, because lights really do sum in the air.
    // The finished map then multiplies the world exactly once. A lit patch
    // multiplies by about (0.82, 0.72, 0.70) where an unlit one multiplies by
    // (0.29, 0.33, 0.49): brighter and warmer, and the surface keeps its own
    // hue and its own contrast, which is the whole difference between a place
    // being lit and a place being painted over.
    lightScene = new PIXI.Container();          // never on the stage: it renders to a texture
    ambientSp = new PIXI.Sprite(PIXI.Texture.WHITE);
    lightC = new PIXI.Container();
    lightScene.addChild(ambientSp, lightC);
    lightMapSp = new PIXI.Sprite(PIXI.Texture.EMPTY);
    lightMapSp.blendMode = 'multiply';
    // the sources themselves, over the map: a lamp has to look brighter than
    // the ground it lights, and that IS what additive is for
    emitC = new PIXI.Container(); emitC.blendMode = 'add';
    hourAddSp = flat('add');
    wxMulSp = flat('multiply');
    // snow that has settled: a screen wash, because whitening is what settled
    // snow does and multiply can only ever take light away
    packSp = flat('screen'); packSp.tint = 0xdfe9f4;
    sheenC = new PIXI.Container(); sheenC.blendMode = 'add';
    for (let i = 0; i < SHEENS; i++) {
      const sp = new PIXI.Sprite(PIXI.Texture.EMPTY);
      sp.visible = false;
      sheenC.addChild(sp);
      sheens.push({ sp, x: rnd(-400, 400), v: 0.10 + i * 0.055, a: 1 - i * 0.28 });
    }
    airC = new PIXI.Container(); airC.blendMode = 'add';
    wxC = new PIXI.Container();
    fogC = new PIXI.Container();
    boltSp = flat('add');
    vigSp = new PIXI.Sprite(PIXI.Texture.EMPTY);

    // The map carries the hour AND the lamps, so it stands where the old flat
    // darkness stood and the old light layer is gone from here entirely. What
    // follows it is weather and atmosphere: things between the eye and the
    // world rather than light falling on it.
    root.addChild(cloudC, lightMapSp, emitC, hourAddSp, wxMulSp, packSp, sheenC, airC, wxC, fogC, boltSp, vigSp);

    // What is in the air. Both are lit things, so they go over the grade with
    // the lamps: a firefly that the night grade could darken is not a firefly.
    for (let i = 0; i < FLIES; i++) {
      const sp = new PIXI.Sprite(flyTex());
      sp.visible = false;
      airC.addChild(sp);
      flies.push({
        sp, x: rnd(-100, 900), y: rnd(-100, 700),
        ph: Math.random() * 6.28, ph2: Math.random() * 6.28,
        // dark for a few seconds, then one slow swell: a firefly is mostly off
        wait: rnd(0, 220), lit: 0,
      });
    }
    for (let i = 0; i < MOTES; i++) {
      const sp = new PIXI.Sprite(moteTex(i % 4 === 0));
      sp.visible = false;
      airC.addChild(sp);
      motes.push({ sp, x: rnd(-100, 900), y: rnd(-100, 700), ph: Math.random() * 6.28, rise: rnd(0.02, 0.09) });
    }

    for (let i = 0; i < CLOUDS; i++) {
      const sp = new PIXI.Sprite(cloudTex(i % 4));
      sp.tint = 0x39435c;
      sp.visible = false;
      cloudC.addChild(sp);
      clouds.push({ sp, x: rnd(-200, 900), y: rnd(-120, 700), vx: rnd(0.10, 0.22), vy: rnd(-0.02, 0.05) });
    }
    for (let i = 0; i < FOG_BANDS; i++) {
      const sp = new PIXI.Sprite(fogTex(i % 4));
      sp.visible = false;
      fogC.addChild(sp);
      fogs.push({ sp, x: rnd(-220, 460), y: rnd(-10, 210), v: rnd(0.06, 0.30), a: rnd(0.5, 1) });
    }
    applyLightPath();
    applyMode();
    return root;
  }

  function resize(w, h, s) {
    vw = w; vh = h; S = s;
    if (!root) return;
    root.scale.set(S);
    const sheet = [hourAddSp, wxMulSp, boltSp, ambientSp];
    for (let i = 0; i < sheet.length; i++) { sheet[i].width = vw; sheet[i].height = vh; }
    // The map is one texel per world pixel, drawn back at the world's own whole
    // scale with nearest sampling, so it never softens the grid it lies on.
    if (!lightRT || lightRT.width !== vw || lightRT.height !== vh) {
      const old = lightRT;
      lightRT = PIXI.RenderTexture.create({ width: vw, height: vh });
      lightRT.source.scaleMode = 'nearest';
      lightMapSp.texture = lightRT;
      if (old) old.destroy(true);
    }
    const key = vw + 'x' + vh;
    if (key !== vigKey) {
      vigKey = key;
      const old = vigSp.texture;
      vigSp.texture = PIXELS.util.tex(vignetteCanvas(vw, vh));
      if (old && old !== PIXI.Texture.EMPTY) old.destroy(true);
    }
  }

  function applyMode() {
    if (!root) return;
    root.visible = mode !== 'off';
    const moving = mode === 'full';
    cloudC.visible = moving; wxC.visible = moving; fogC.visible = moving; airC.visible = moving;
    sheenC.visible = moving;
    if (!moving) { boltSp.alpha = 0; boltA = 0; }
    if (mode === 'off' && window.AUDIO && AUDIO.weather) AUDIO.weather({ rain: 0, wind: 0, night: 0 });
  }
  // The A/B switches. Each takes its effect out entirely rather than turning it
  // down, so what is being judged is the effect and not a setting of it.
  function setFx(key, on) {
    if (!(key in fx)) return;
    fx[key] = !!on;
    try { localStorage.setItem(FX_KEYS[key], fx[key] ? 'on' : 'off'); } catch (e) { /* non-fatal */ }
    if (key === 'wet' && !fx.wet) { wet = 0; if (sheenC) sheenC.visible = false; }
    if (key === 'pack' && !fx.pack) { pack = 0; if (packSp) packSp.alpha = 0; }
    if (key === 'lightmap') applyLightPath();
  }

  // The A/B, and the whole difference between the two ways of lighting a
  // world is one question: where does the light container live?
  //
  //   in the map    the lights are added to the hour's floor and the finished
  //                 map multiplies the world once. Light scales a surface, so
  //                 the surface keeps its colour. This is the right one.
  //   on the stage  the hour multiplies the world, and the lights are then
  //                 added over the top of it. Every surface converges on the
  //                 colour of the lamp. This is what shipped, kept only so the
  //                 two can be put side by side.
  function applyLightPath() {
    if (!lightC || !root || !lightScene) return;
    if (fx.lightmap) {
      if (lightC.parent !== lightScene) lightScene.addChild(lightC);
    } else if (lightC.parent !== root) {
      root.addChildAt(lightC, root.getChildIndex(emitC));
    }
    // the emissive cores belong to the new way; the old way never had them
    emitC.renderable = fx.lightmap;
  }
  function setMode(m) {
    mode = (m === 'calm' || m === 'off') ? m : 'full';
    try { localStorage.setItem(PREF_KEY, mode); } catch (e) { /* non-fatal */ }
    applyMode();
  }

  // ---------- the lights on the map ----------
  // factory.js hands over one record per light every time it raises a world:
  // {x, y, r, tint, base}, in world coordinates. This layer moves them with the
  // camera and lights them by the hour. One spare pool sprite past the end of
  // the list is the operator's lantern.
  // Every light is two sprites: the pool it throws, which goes into the map and
  // multiplies the ground, and a much smaller core over the top, which is the
  // source itself and is the one thing here that is honestly additive. A lamp
  // has to look brighter than what it lights, and a multiply can never take a
  // surface past its own daylight, so the core is what carries the glow.
  const EMIT_R = 0.22;                    // the core, as a fraction of the pool
  function setLights(list) {
    lightDefs = (list || []).slice();
    if (!lightC) return;
    while (pools.length < lightDefs.length + 1) {
      const sp = new PIXI.Sprite(PIXI.Texture.EMPTY);
      sp.visible = false;
      sp.blendMode = 'add';               // additive INSIDE the map: lights sum in air
      lightC.addChild(sp);
      const em = new PIXI.Sprite(PIXI.Texture.EMPTY);
      em.visible = false;
      emitC.addChild(em);
      pools.push({ sp, em, ph: Math.random() * 6.28, def: null });
    }
    for (let i = 0; i < pools.length; i++) {
      const d = lightDefs[i];
      pools[i].def = d || null;
      if (d) {
        const r = d.r || 24;
        pools[i].sp.texture = haloTex(r);
        pools[i].em.texture = haloTex(Math.max(4, Math.round(r * EMIT_R)));
        pools[i].sp.tint = d.tint || 0xffcf80;
      } else {
        pools[i].sp.visible = false;
        pools[i].em.visible = false;
      }
    }
  }
  function follow(x, y) { followX = x; followY = y; }
  // How long a machine's work cycle and idle breath run, in frames. factory.js
  // owns those numbers; a firebox throbbing out of step with the sprite over it
  // reads as two machines, so they are handed over rather than guessed.
  function setBeat(work, idle) {
    if (work > 0) beatWork = work;
    if (idle > 0) beatIdle = idle;
  }

  // ---------- the weather chain ----------
  function setClimate(w) { climate = w || {}; }
  function weightOf(id, table) {
    const c = climate[id];
    let k = table[id] * (c === undefined ? 1 : c);
    if (id === 'fog') k *= 1 + 1.2 * (1 - dayK);        // fog wants the cold hours
    if (id === 'snow') k *= 0.6 + 0.8 * (1 - dayK);
    return k;
  }
  function rollSky() {
    const table = SKIES[curSky].next;
    const ids = Object.keys(table);
    let total = 0;
    for (let i = 0; i < ids.length; i++) total += Math.max(0, weightOf(ids[i], table));
    prevSky = curSky;
    if (total > 0) {
      let r = Math.random() * total;
      for (let i = 0; i < ids.length; i++) {
        r -= Math.max(0, weightOf(ids[i], table));
        if (r <= 0) { curSky = ids[i]; break; }
      }
    }
    prevDir = curDir;
    if (Math.random() < 0.4) curDir = -curDir;
    mixK = 0; spell = 0;
    spellLen = SPELL_MIN + Math.random() * SPELL_VAR;
  }
  // one field of the sky, part way between the one going and the one coming
  function fld(k, dflt) {
    const a = SKIES[prevSky][k], b = SKIES[curSky][k];
    return lerp(a === undefined ? dflt : a, b === undefined ? dflt : b, mixK);
  }
  function washNow() {
    const a = SKIES[prevSky].mul, b = SKIES[curSky].mul;
    if (!a && !b) return null;
    // a sky with no wash of its own borrows the other's colour at zero alpha,
    // so only the alpha moves and the fade never passes through black
    const ac = a ? a.c : b.c, bc = b ? b.c : a.c;
    return { c: mixColor(ac, bc, mixK), a: lerp(a ? a.a : 0, b ? b.a : 0, mixK) };
  }

  // ---------- the frame ----------
  // dt is the ticker's delta (1 at 60fps); cam is the camera's world origin.
  function tick(dt, cam) {
    if (!root || mode === 'off') return;
    flick += 0.045 * dt;
    frames += dt;
    camX = cam ? cam.x : 0;
    camY = cam ? cam.y : 0;
    const sec = dt / 60;
    if (held === null) clock += sec;
    const t = (((clock % DAY_LEN) + DAY_LEN) % DAY_LEN) / DAY_LEN;
    const H = hourAt(t);
    lampK = H.lamp;
    warmK = H.aa;
    dayK = 1 - clamp01(H.ma / DARKEST);

    // The hour is no longer a flat multiply of its own: it is the floor of the
    // light map, the level the world sits at where no lamp reaches. Folding
    // `mul` and `ma` into one multiplier here is what lets a light add into
    // the same map and come out as illumination rather than as paint.
    ambientSp.tint = ambientOf(H);
    hourAddSp.tint = H.add; hourAddSp.alpha = H.aa;

    // the sky, and how far through becoming the next one it is
    if (mixK < 1) mixK = Math.min(1, mixK + sec / FADE);
    if (!forced) {
      spell += sec;
      if (spell >= spellLen) rollSky();
    }

    const rainN = Math.round(fld('rain', 0));
    const snowN = Math.round(fld('snow', 0));
    gustPh += sec * 0.22;
    const gust = 0.75 + 0.45 * Math.sin(gustPh) + 0.2 * Math.sin(gustPh * 2.7);
    windX = fld('wind', 0.4) * gust * 0.55 * lerp(prevDir, curDir, mixK);
    windY = 0;

    // Wet ground: it takes a while to soak and longer to dry, so the map stays
    // dark and cool for a minute after the shower has gone.
    const pouring = clamp01(rainN / 120);
    wet = clamp01(wet + (pouring > 0 ? (sec / 30) * pouring : -sec / 90));
    // Snow lies while it falls and is gone about a minute after it stops, well
    // inside the spell that dropped it. Anything slower and the map would sit
    // white for no reason a player could point at.
    const falling = clamp01(snowN / 90);
    pack = clamp01(pack + (falling > 0 ? (sec / 55) * falling : -sec / 45));
    if (!fx.wet) wet = 0;
    if (!fx.pack) pack = 0;

    // Cloud takes far more off a bright afternoon than it does off a night that
    // is already dark, so the weather wash is pulled back as the hour darkens.
    // Without that, a storm at midnight is simply a black screen.
    const w = washNow();
    const wetA = 0.10 * wet;
    const totalA = (w ? w.a * (0.30 + 0.70 * dayK) : 0) + wetA;
    if (totalA > 0.002) {
      const base = w ? w.c : 0x9fb0c8;
      wxMulSp.tint = wetA > 0.002 ? mixColor(base, 0x9fb0c8, wetA / totalA) : base;
      wxMulSp.alpha = Math.min(0.55, totalA);
    } else wxMulSp.alpha = 0;

    // snow that has settled whitens everything it landed on, which is what
    // snow does; it is pulled back a little at night, when nothing is white
    packSp.alpha = pack * (0.10 + 0.17 * dayK);

    tickLights();
    tickSheen(dt);
    tellTheEar(sec, rainN, snowN);
    if (mode === 'full') {
      tickClouds(dt, fld('cloud', 0));
      tickRain(dt, rainN);
      tickSnow(dt, snowN);
      tickFog(dt, fld('fog', 0));
      tickBolts(sec, fld('bolts', 0));
      tickAir(dt, rainN, snowN, fld('fog', 0));
    }

    // the frame closes in after dark and in heavy weather
    vigSp.alpha = 0.17 + 0.15 * (1 - dayK) + 0.10 * clamp01(rainN / 210);

    // Last, once everything that goes into the map has been placed: bake it.
    // This runs inside the ticker, which is before the stage is drawn, so the
    // sprite showing the map is already holding this frame's light by the time
    // anything looks at it.
    bakeLightMap();
  }

  // One offscreen pass: the hour's floor, with every light summed onto it.
  function bakeLightMap() {
    if (!app || !lightRT || !lightMapSp.visible) return;
    app.renderer.render({ container: lightScene, target: lightRT, clear: true });
  }

  // Light pools ride above the grade, so a lamp reads as a lamp burning and not
  // as a bright patch somebody forgot to darken.
  // What the hour multiplies the world by where nothing is lighting it. This
  // is the same number the old flat multiply arrived at, `c*a + (1-a)` per
  // channel, but held as a colour instead of a blend, so lights can be added
  // to it before it is ever applied.
  function ambientOf(H) {
    const c = H.mul, a = H.ma;
    const ch = (shift) => Math.round((((c >> shift) & 255) / 255 * a + (1 - a)) * 255);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }

  function tickLights() {
    const on = lampK > 0.03;
    lightC.visible = on;
    emitC.visible = on;
    if (!on) return;
    const ox = -Math.round(camX), oy = -Math.round(camY);
    // the two rhythms the machines animate on, in radians per frame
    const wW = (Math.PI * 2) / beatWork, wI = (Math.PI * 2) / beatIdle;
    for (let i = 0; i < pools.length; i++) {
      const p = pools[i], d = p.def;
      if (!d) { p.sp.visible = false; continue; }
      const r = d.r || 24;
      const sx = Math.round(d.x) + ox - r, sy = Math.round(d.y) + oy - r;
      if (sx > vw || sy > vh || sx < -r * 2 || sy < -r * 2) {
        p.sp.visible = false; p.em.visible = false; continue;
      }
      p.sp.visible = true;
      p.sp.position.set(sx, sy);
      // the core rides the middle of the pool and answers whatever the pool does
      const er = Math.max(4, Math.round(r * EMIT_R));
      p.em.visible = true;
      p.em.position.set(Math.round(d.x) + ox - er, Math.round(d.y) + oy - er);
      const st = d.state ? FIRE[d.state] : null;
      if (!st) {
        // a lamp: gas burns unevenly, so a slow breath on each one, out of
        // step with its neighbours, and a row of lampposts is not one bulb
        // repeated
        p.sp.tint = d.tint || 0xffcf80;
        p.sp.alpha = (d.base || 1) * lampK * (0.86 + 0.14 * Math.sin(flick + p.ph));
        p.em.tint = 0xfff2cc;             // the flame itself, hotter than its pool
        p.em.alpha = p.sp.alpha * 0.55;
        continue;
      }
      // A firebox says what the machine is doing. Running, it throbs on the
      // machine's own work beat and every working body on the map throbs
      // together, the way the sprites do. Backed up, it breathes on the slow
      // idle beat. Starved, it gutters and nearly goes out, each one on its
      // own time. Banked, it is the pilot light and nothing more.
      const b = st.beat === 'work' ? 0.5 + 0.5 * Math.sin(frames * wW)
        : st.beat === 'breathe' ? 0.5 + 0.5 * Math.sin(frames * wI + p.ph)
          : st.beat === 'gutter' ? 0.5 + 0.5 * Math.sin(frames * 0.026 + p.ph * 3)
            : 0.5 + 0.5 * Math.sin(flick * 0.6 + p.ph);
      p.sp.tint = st.tint;
      p.sp.alpha = st.base * lampK * (st.lo + (1 - st.lo) * b);
      // the mouth of the firebox: the same beat, hotter, and it is the only
      // part of a machine's light allowed to go brighter than daylight
      p.em.tint = mixColor(st.tint, 0xffffff, 0.45);
      p.em.alpha = p.sp.alpha * 0.6;
    }
    // The operator carries one, and it lights only once the day has gone. This
    // one is a real light and not a glint on him: the ground stays plainly lit
    // for LANTERN_HOLD of its radius, which is two full tiles every way, and
    // only then starts to fall off. He is the reason you can work at night.
    const lantern = pools[lightDefs.length];
    if (!lantern) return;
    // It reads the dark, not the lamp clock: at sunset there is still plenty of
    // light to work by and a lantern that bright would only look like a
    // spotlight. It comes up through dusk and is full once the day has gone.
    const k = clamp01((1 - dayK - 0.45) / 0.35);
    lantern.sp.visible = k > 0.02;
    lantern.em.visible = lantern.sp.visible;
    if (!lantern.sp.visible) return;
    lantern.sp.texture = haloTex(LANTERN_R, LANTERN_HOLD);
    lantern.sp.tint = 0xffd89a;
    const lx = Math.round(followX) + ox, ly = Math.round(followY) + oy - 8;
    lantern.sp.position.set(lx - LANTERN_R, ly - LANTERN_R);
    lantern.sp.alpha = 0.62 * k * (0.93 + 0.07 * Math.sin(flick * 1.7));
    // the lamp in his hand: small, hot, and the only thing on him that glows
    const lr = 7;
    lantern.em.texture = haloTex(lr);
    lantern.em.tint = 0xfff0cc;
    lantern.em.position.set(lx - lr, ly - lr);
    lantern.em.alpha = 0.7 * k;
  }

  // Wet ground: three broad bands of light sliding across the frame at
  // different speeds. Nothing about the ground is consulted, and nothing needs
  // to be: what says "wet" is that the light is moving.
  function tickSheen(dt) {
    const on = wet > 0.02 && mode === 'full';
    sheenC.visible = on;
    if (!on) return;
    const bw = Math.max(40, Math.round(vw * 0.55));
    const tex = sheenTex(bw, vh);
    const span = vw + bw;
    sheenPh += 0.01 * dt;
    for (let i = 0; i < sheens.length; i++) {
      const s = sheens[i];
      s.x += (s.v + windX * 0.20) * dt;
      while (s.x > vw) s.x -= span;
      while (s.x < -bw) s.x += span;
      if (s.sp.texture !== tex) s.sp.texture = tex;
      s.sp.visible = true;
      s.sp.position.set(Math.round(s.x), 0);
      // cool, and never bright: a sheen you can name is a searchlight
      s.sp.tint = mixColor(0x6f86a8, 0xdcecfa, dayK);
      s.sp.alpha = 0.085 * wet * s.a * (0.75 + 0.25 * Math.sin(sheenPh + i * 2.1));
    }
  }

  // What the sky tells the ear. Once a second is plenty: every number on the
  // other side is a slow target, and the bed must never twitch on the frame.
  let earAt = 0;
  function tellTheEar(sec, rainN, snowN) {
    earAt += sec;
    if (earAt < 1 || !window.AUDIO || !AUDIO.weather) return;
    earAt = 0;
    AUDIO.weather({
      rain: clamp01(rainN / 190),
      // snow makes no sound of its own, so a snowfall is heard as wind and as
      // the night bed going quiet under it
      wind: clamp01((Math.abs(windX) / 1.1) * (0.35 + 0.65 * clamp01((rainN + snowN) / 120))),
      night: 1 - dayK,
    });
  }

  // ---------- what is in the air ----------
  // Fireflies after dark and motes in a low sun: the same idea twice, a few
  // dozen specks anchored in the world and wrapped around the camera, so they
  // sit in the place rather than sliding over the screen as you walk. Both
  // want still, clear air, so rain, snow and fog put them out.
  function tickAir(dt, rainN, snowN, fogPower) {
    const still = clamp01(1 - (rainN + snowN) / 40) * clamp01(1 - fogPower * 2.2);
    // fireflies want the dark, and a while after dusk before they come out
    const flyK = clamp01((1 - dayK - 0.35) / 0.35) * still;
    // motes want a low sun: they ride the same warm throw the hour gives the
    // grade, so they are brightest at sunrise and at the golden hour and are
    // nearly gone at noon
    const moteK = clamp01((warmK - 0.045) / 0.11) * still * dayK;
    airC.visible = flyK > 0.01 || moteK > 0.01;
    if (!airC.visible) return;

    const ox = -Math.round(camX), oy = -Math.round(camY);
    const spanX = vw + 220, spanY = vh + 200;
    const place = (p, sp) => {
      let sx = Math.round(p.x - camX), sy = Math.round(p.y - camY);
      while (sx > vw + 90) { p.x -= spanX; sx -= spanX; }
      while (sx < -90) { p.x += spanX; sx += spanX; }
      while (sy > vh + 80) { p.y -= spanY; sy -= spanY; }
      while (sy < -80) { p.y += spanY; sy += spanY; }
      sp.position.set(sx, sy);
    };

    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      if (flyK <= 0.01) { f.sp.visible = false; continue; }
      // a wander, not a path: two slow sines that never quite repeat together
      f.ph += 0.011 * dt; f.ph2 += 0.007 * dt;
      f.x += (Math.sin(f.ph) * 0.16 + windX * 0.10) * dt;
      f.y += (Math.cos(f.ph2) * 0.11) * dt;
      place(f, f.sp);
      // mostly dark, then one swell and out again
      if (f.lit > 0) {
        f.lit -= dt;
        if (f.lit <= 0) f.wait = rnd(60, 220);
      } else {
        f.wait -= dt;
        if (f.wait <= 0) f.lit = rnd(45, 95);
      }
      const k = f.lit > 0 ? Math.sin(Math.PI * clamp01(1 - f.lit / 95)) : 0;
      f.sp.visible = k > 0.01;
      f.sp.tint = 0xd8ff96;
      f.sp.alpha = 0.9 * k * flyK;
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      if (moteK <= 0.01) { m.sp.visible = false; continue; }
      m.ph += 0.013 * dt;
      m.x += (windX * 0.30 + Math.sin(m.ph) * 0.09) * dt;
      m.y -= m.rise * dt;                       // they hang and climb, they never fall
      place(m, m.sp);
      m.sp.visible = true;
      m.sp.tint = 0xfff0cc;
      m.sp.alpha = (0.30 + 0.30 * (0.5 + 0.5 * Math.sin(m.ph * 1.7))) * moteK;
    }
  }

  function tickClouds(dt, power) {
    // a shadow needs a sun, so none of this at night
    const a = 0.28 * clamp01(power) * (0.25 + 0.75 * dayK);
    const on = a > 0.005;
    cloudC.visible = on;
    if (!on) return;
    const span = vw + 400, spanY = vh + 300;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x += (c.vx + windX * 0.35) * dt;
      c.y += (c.vy + windY * 0.2) * dt;
      let sx = Math.round(c.x - camX), sy = Math.round(c.y - camY);
      // wrapped around the camera, so the field is endless without being kept
      while (sx > vw + 140) { c.x -= span; sx -= span; }
      while (sx < -272) { c.x += span; sx += span; }
      while (sy > vh + 80) { c.y -= spanY; sy -= spanY; }
      while (sy < -154) { c.y += spanY; sy += spanY; }
      c.sp.visible = true;
      c.sp.position.set(sx, sy);
      c.sp.alpha = a;
    }
  }

  const area = () => (vw * vh) / (430 * 230);

  // PRECIPITATION RIDES THE FRAME. Rain and snow are held in screen pixels and
  // the camera is never subtracted from them, which is not an oversight and was
  // tried the other way round and reverted.
  //
  // The two ways of holding it are the same quantity with the sign flipped, and
  // there is no third. Anchor a drop in the world and it stands still over the
  // ground, which is honest, and the price is that the camera's own travel
  // becomes the drop's travel across the frame: walking at 1.35 against a fall
  // of 4.8 tips the whole shower about 16 degrees, and reversing direction
  // swings it through 31. Full screen, several hundred drops, instant. Anchor
  // it to the frame and the drop always falls the same way you are looking, and
  // the price is that it slips over the ground while you walk.
  //
  // Shipped once anchored in the world and the answer came back inside the
  // minute: really obvious when switching left and right, visually jarring
  // because it is a full-screen effect. That settles it. A slip you have to
  // look for the ground to notice is cheaper than a tilt that reverses across
  // the whole frame every time the player changes their mind, and the SNES
  // weather this game is drawn after rides the frame for the same reason.
  //
  // What is slow and sparse and has no direction still lives in the world, and
  // should: the cloud shadows, the fireflies, the motes and the fog banks all
  // sit in the place and are wrapped around the camera. Nothing there carries
  // an angle for walking to tip over.
  function tickRain(dt, n) {
    const want = Math.min(MAX_RAIN, Math.round(n * area()));
    while (rain.length < want) {
      const sp = new PIXI.Sprite(PIXI.Texture.EMPTY);
      wxC.addChild(sp);
      rain.push({ sp, x: 0, y: -999, hy: 0, v: 4, st: -1, sf: -1 });
    }
    if (!want) {
      for (let i = 0; i < rain.length; i++) rain[i].sp.visible = false;
      return;
    }
    const len = Math.max(2, Math.round(fld('len', 4)));
    // The streak leans with the WIND and with nothing else. Leaning it into the
    // camera's travel as well was tried and is the same mistake as anchoring
    // the drop: walking must not tip the rain.
    const aw = Math.abs(windX), sgn = windX < 0 ? -1 : 1;
    const slant = (aw > 1.0 ? 2 : aw > 0.45 ? 1 : 0) * sgn;
    const tex = rainTex(len, slant);
    const splashes = fld('splash', 0) > 0.4;
    // rain is silver by day and steel at night, never brighter than the ground
    // it is falling on
    const tint = mixColor(0x9fb6d4, 0xdfeaf6, dayK);
    const alpha = 0.44 + 0.24 * dayK;
    for (let i = 0; i < rain.length; i++) {
      const d = rain[i];
      if (i >= want) { d.sp.visible = false; continue; }
      d.sp.visible = true;
      d.sp.tint = tint;
      if (d.st >= 0) {                            // landed: a splash, then gone
        d.st += dt;
        const f = d.st < 4 ? 0 : 1;
        if (f !== d.sf) { d.sf = f; d.sp.texture = splashTex(f); }
        d.sp.alpha = alpha * (1 - d.st / 9);
        if (d.st >= 9) respawnDrop(d, tex);
        continue;
      }
      if (d.y < -90) { respawnDrop(d, tex); continue; }
      if (d.sp.texture !== tex) d.sp.texture = tex;
      d.sp.alpha = alpha;
      d.x += windX * 0.9 * dt;
      d.y += d.v * dt;
      if (d.y >= d.hy) {
        if (splashes) {
          d.st = 0; d.sf = -1; d.y = d.hy;
          d.sp.position.set(Math.round(d.x) - 2, Math.round(d.y));
        } else respawnDrop(d, tex);
        continue;
      }
      if (d.x < -60 || d.x > vw + 60) { respawnDrop(d, tex); continue; }
      d.sp.position.set(Math.round(d.x), Math.round(d.y));
    }
  }
  function respawnDrop(d, tex) {
    d.st = -1; d.sf = -1;
    d.sp.texture = tex;
    d.x = rnd(-50, vw + 50);
    d.y = rnd(-30, -2);
    // every drop lands at its own depth in the frame, which is what makes flat
    // rain read as rain falling through a place
    d.hy = rnd(vh * 0.10, vh + 6);
    d.v = fld('fall', 4) * rnd(0.85, 1.2);
    d.sp.position.set(Math.round(d.x), Math.round(d.y));
  }

  function tickSnow(dt, n) {
    const want = Math.min(MAX_SNOW, Math.round(n * area()));
    while (snow.length < want) {
      const sp = new PIXI.Sprite(flakeTex(1));
      wxC.addChild(sp);
      const f = { sp, x: rnd(-20, vw + 20), y: rnd(-40, vh), ph: Math.random() * 6.28, s: 1, k: 1 };
      rollFlake(f);
      snow.push(f);
    }
    if (!want) {
      for (let i = 0; i < snow.length; i++) snow[i].sp.visible = false;
      return;
    }
    const tint = mixColor(0xa8bcd8, 0xffffff, dayK);
    const alpha = 0.55 + 0.35 * dayK;
    const fall = fld('fall', 0.85);
    for (let i = 0; i < snow.length; i++) {
      const f = snow[i];
      if (i >= want) { f.sp.visible = false; continue; }
      f.sp.visible = true;
      f.sp.tint = tint;
      f.sp.alpha = alpha;
      f.ph += 0.02 * dt;
      f.x += (windX * 0.7 + Math.sin(f.ph) * 0.35) * dt;
      f.y += fall * f.k * dt;
      if (f.y > vh + 4 || f.x < -20 || f.x > vw + 20) {
        f.x = rnd(-20, vw + 20);
        f.y = rnd(-30, -2);
        rollFlake(f);
      }
      f.sp.position.set(Math.round(f.x), Math.round(f.y));
    }
  }
  // A flake's size and its weight, given at birth and again every time it is
  // sent back to the top. `k` is the weight ALONE: the sky's fall speed is read
  // fresh each frame and multiplied through it, so a flake made while the snow
  // was still fading in is not left crawling for the rest of the spell.
  function rollFlake(f) {
    f.s = Math.random() < 0.2 ? 2 : Math.random() < 0.5 ? 0 : 1;
    f.sp.texture = flakeTex(f.s);
    f.k = (0.6 + f.s * 0.35) * rnd(0.8, 1.3);
  }

  function tickFog(dt, power) {
    const on = power > 0.01;
    fogC.visible = on;
    if (!on) return;
    // fog takes the colour of whatever light there is: near white at noon, blue
    // at three in the morning, amber for the ten minutes the sun is on the deck
    const tint = mixColor(0x63708f, 0xdfe6ee, dayK);
    const spanX = vw + 260, spanY = vh + 120;
    for (let i = 0; i < fogs.length; i++) {
      const f = fogs[i];
      f.x += (f.v + windX * 0.45) * dt;
      let sx = Math.round(f.x - camX), sy = Math.round(f.y - camY);
      // anchored and wrapped like the cloud shadows: a bank lies over the
      // ground it is on, and walking takes you through it rather than pushing
      // it along in front of you
      while (sx > vw + 20) { f.x -= spanX; sx -= spanX; }
      while (sx < -240) { f.x += spanX; sx += spanX; }
      while (sy > vh + 10) { f.y -= spanY; sy -= spanY; }
      while (sy < -56) { f.y += spanY; sy += spanY; }
      f.sp.visible = true;
      f.sp.tint = tint;
      f.sp.alpha = Math.min(0.70, power * 0.62 * f.a);
      f.sp.position.set(sx, sy);
    }
  }

  function tickBolts(sec, chance) {
    if (chance > 0.4) {
      boltNext -= sec;
      if (boltNext <= 0) {
        boltNext = rnd(5, 18);
        boltA = rnd(0.20, 0.34);
        boltEcho = Math.random() < 0.55 ? rnd(0.12, 0.30) : 0;
        // thunder arrives after the light does, the way it does outdoors
        if (window.AUDIO && AUDIO.thunder) {
          setTimeout(function () { AUDIO.thunder(); }, Math.round(rnd(500, 2400)));
        }
      }
    }
    if (boltA > 0) {
      boltA = Math.max(0, boltA - 0.055 * (sec * 60));
      if (boltA === 0 && boltEcho > 0) { boltA = boltEcho; boltEcho = 0; }
    }
    boltSp.tint = 0xcfe2ff;
    boltSp.alpha = boltA;
  }

  // ---------- what the rest of the game asks ----------
  window.SKY = {
    init, resize, tick, setLights, follow, setBeat, setClimate, setMode, setFx,
    fx: () => ({ wet: fx.wet, pack: fx.pack, lightmap: fx.lightmap }),
    mode: () => mode,
    // 0..1: how hard every light on the map should burn right now
    lamp: () => (mode === 'off' ? 0 : lampK),
    // 0..1: 1 at noon, 0 at midnight. Anything that wants to know whether it is
    // dark asks this and never reads the clock itself.
    day: () => (mode === 'off' ? 1 : dayK),
    // The one wind in the game: rain, snow, fog and the drifting petals all
    // read it, so the whole frame moves as one thing.
    wind: () => ({ x: mode === 'off' ? 0 : windX, y: windY }),
    weather: () => curSky,
    // dev handles: pin an hour, pin a sky, put both back
    jump(t) { clock = ((t % 1) + 1) % 1 * DAY_LEN; },
    hold(on) { held = on ? clock : null; },
    // pin a sky. `snap` puts it there whole instead of letting it fade in,
    // which is what a proof sheet wants and a game never does.
    force(id, snap) {
      if (id && SKIES[id]) {
        forced = id;
        prevSky = snap ? id : curSky;
        curSky = id;
        mixK = snap ? 1 : 0;
      } else { forced = null; spell = 0; spellLen = SPELL_MIN; }
    },
    report() {
      const t = (((clock % DAY_LEN) + DAY_LEN) % DAY_LEN) / DAY_LEN;
      const hh = Math.floor(t * 24), mm = Math.floor((t * 24 - hh) * 60);
      return {
        t,
        clock: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm,
        hour: hourAt(t).name, weather: curSky, from: prevSky, mix: mixK,
        wet, pack, lamp: lampK, day: dayK, wind: windX, forced: !!forced, mode,
      };
    },
    DAY_LEN, HOURS, SKIES, SKY_IDS, hourAt,
  };
})();
