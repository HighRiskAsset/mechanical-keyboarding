// The game's sprite library. Every pixel the game shows comes from the PNG
// sheets in assets/sprites/ (baked by dev/bake.html from the generator in
// dev/gen/, then handed to artists: the PNGs are the truth, the generator is
// the scaffold). This file loads the sheets, slices them by their JSON
// manifests, and serves the same API the old code-drawing pixels.js served,
// so factory.js and app.js never learn where a texture came from.
//
// What stays code here, deliberately: string composition over the font sheet
// (with the pure-white fill tinted per caller), the survey-tape site marker
// (sized at run time), and the small canvas utils the sky and the terrain
// composer share. Composition is code; pixels are the artist's.
// Global: PIXELS
(function () {
  'use strict';

  // One palette, no strays. The composition code below and js/tiles.js tint
  // edges and text with these; the sheets carry their own colours.
  const P = {
    ink: '#172033',
    white: '#fff4dc',
    ironO: '#151824', iron3: '#2c303e', iron2: '#454b5c', iron: '#646c7d', ironL: '#8f96a3',
    steel: '#c2c8d4',
    enam: '#8c3f42', enamD: '#571f2c', enamL: '#bd6157',
    soot: '#171420', steam: '#e4e0da',
    beltS: '#0e0d16', beltD: '#1b1928', beltE: '#272437', beltM: '#37324b', beltL: '#4f4a6a',
    teal: '#4f8f7c', teal2: '#2f5c54', teal3: '#7fc9a8',
    cream: '#f0e0bc', cream2: '#c3ab84',
    orange: '#f06d4f', red: '#d84d66', green: '#80d66e',
    glow: '#ffe28a',
    brass1: '#bf813a', brass2: '#f0bd4f', brass3: '#fff0a6',
    grass1: '#6cbf5a', grass2: '#5fae4f', grass3: '#86d370', grass4: '#549c46',
    dirt1: '#c2955f', dirt2: '#a87f4d', dirt3: '#8f6a3e',
    water1: '#4ba8d8', water2: '#3b8ec4', water3: '#bfe8f5',
    leaf1: '#4e9e52', leaf2: '#a4cf63', leaf3: '#245a43',
    trunk: '#84503a', trunk2: '#4b2c2d',
    rock1: '#9aa0ab', rock2: '#7c828e', rock3: '#c6ccd6',
    tOut: '#0c1a0c',
    gA: '#67ad4a', gB: '#9ad35e', gC: '#397d3e', gD: '#1f5036',
    dA: '#bc8a4c', dB: '#e0b665', dC: '#83563a', dD: '#4e3029',
    sA: '#ddc47e', sB: '#f1dfa2', sC: '#ae8657',
    wA: '#17627a', wB: '#278ca1', wC: '#10465f', wF: '#b8edf0', wO: '#082b3b',
    pA: '#98a080', pB: '#b0b898', pC: '#6c7458', pD: '#484c38',
    rA: '#8c8478', rB: '#a49c8c', rC: '#6c6458', rD: '#484038',
    cA: '#e0bd79', cB: '#b9894f', cC: '#7d5738', cD: '#463022', cO: '#21150f',
    kA: '#b9b9c2', kB: '#7b8195', kC: '#4a5067', kD: '#292d42',
    vA: '#9a86bb', vB: '#665985', vC: '#403c62', vD: '#252340',
    hA: '#6c6480', hB: '#847c98', hC: '#4c4460', hD: '#302c40',
    mA: '#587040', mB: '#6c8450', mC: '#405030', mD: '#2c4c48', mE: '#8ca060',
    bA: '#8c6840', bB: '#a88050', bC: '#5c4028', bD: '#3c2818',
    xA: '#b89c68', xB: '#c8b078', xC: '#987c50', xD: '#6c5434',
    tA: '#141418', tB: '#2c2840', tC: '#403c58',
    nA: '#e8f0f8', nB: '#c8d8e8', nC: '#a0b8d0',
    iA: '#a0d0e0', iB: '#c0e8f0', iC: '#70a8c0',
    fA: '#6c9c6c', fB: '#d8e8dc', fC: '#4c7c50',
    ironore: '#7d8aa5', ironore2: '#49526b', ironore3: '#bcc8dc',
    copper: '#d8814e', copper2: '#a85c32', copper3: '#f5ac77', copper4: '#7a4426',
    quartz: '#e59ae0', quartz2: '#b45cbc', quartz3: '#f9d4f5',
    stoneore: '#b9ab8c', stoneore2: '#7a6c53', stoneore3: '#e2d6b6',
    coal: '#3a3a4a', coal2: '#161620', coal3: '#5c5c72',
    oil: '#4c3d70', oil2: '#1c1628', oil3: '#9b86c4',
    rust: '#a5502a', rustD: '#6d2f16', ash: '#8a8494', ashD: '#5c5668',
    ironBed: '#8a5a34', copBed: '#9c7846', emberD: '#c9762a',
    bronze: '#c08a4a', bronzeD: '#7a4d1e', bronzeL: '#eec37e',
    cIron: '#9a9488', cIronD: '#5b554a', cIronL: '#d4ccb6',
    qIron: '#a79fc4', qIronD: '#655d86', qIronL: '#e0daf4',
    stl: '#9db4d0', stlD: '#586c8a', stlL: '#e6f2ff',
    brs: '#d8ac3e', brsD: '#8a6614', brsL: '#ffe488',
    bIron: '#4a4358', bIronD: '#221d2e', bIronL: '#8b81a6',
    gun: '#8a5e46', gunD: '#4c3122', gunL: '#c08a68',
    gls: '#cfa8e4', glsD: '#6e4f8e', glsL: '#f6e8ff',
    titan: '#c8d0e0', titan2: '#8890a8', titan3: '#f0f4ff',
    paper: '#f4ecd8', paper2: '#d8cba8',
    coatN: '#0d1018', coatD: '#1e2540', coat: '#39457a', coatL: '#6b7ec0',
    capD: '#170f0a', cap: '#3d2b1e', capL: '#63462c',
    hairD: '#4a2214', hair: '#a85a2c',
    skin: '#e8b184', skinD: '#a4674a',
    eye: '#16121c', iris: '#2a2438',
    leathD: '#2c1a10', leath: '#6d4526',
    bootD: '#141220', boot: '#3a3350',
    brassD: '#6d4318',
    petal: '#f5b8d9',
  };

  // deterministic pseudo-random, shared with the terrain composer's edge jitter
  const dr = (x, y, s) => ((x * 31 + y * 17 + s * 7) % 97) / 97;

  // CPU-backed canvases: half of what happens here is drawn and read straight
  // back (sheet slicing, spill masks in tiles.js, text tinting, the minimap),
  // and willReadFrequently is the difference between a playable boot and a
  // frozen one; see the measurements in dev/gen/pixels.js.
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    return [c, x];
  }
  const R = (x, c, px, py, w, h) => { x.fillStyle = c; x.fillRect(px, py, w, h); };
  function disc(x, color, cx, cy, r) {
    x.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const hw = Math.round(Math.sqrt(r * r - dy * dy));
      x.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
    }
  }
  function tex(cnv) {
    const t = PIXI.Texture.from(cnv);
    t.source.scaleMode = 'nearest';
    return t;
  }
  const texCache = new Map();
  function cachedTex(key, make) {
    if (!texCache.has(key)) texCache.set(key, tex(make()));
    return texCache.get(key);
  }

  // ---------- the sheets ----------
  // assets/sprites/index.json names every sheet and carries the pipeline's
  // shared numbers; each sheet is <name>.png + <name>.json. A manifest entry
  // is {x, y, w, h, n} (n frames laid left to right, each w wide) plus
  // whatever extras a family needs (a glyph's advance, a crossing's offsets).
  const BASE = window.SPRITES_BASE || 'assets/sprites/';
  const sheets = {};

  function loadSheet(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const [c, x] = canvas(img.naturalWidth, img.naturalHeight);
        x.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = () => reject(new Error('sprites: failed to load ' + url));
      img.src = url;
    });
  }

  const ready = (async () => {
    const idx = await (await fetch(BASE + 'index.json')).json();
    const meta = idx.meta || {};
    await Promise.all((idx.sheets || []).map(async (name) => {
      const [man, cnv] = await Promise.all([
        fetch(BASE + name + '.json').then((r) => r.json()),
        loadSheet(BASE + name + '.png'),
      ]);
      sheets[name] = { sprites: man.sprites || {}, canvas: cnv };
    }));
    // the shared numbers ride in with the sheets, so a longer work loop or a
    // taller operator is a manifest edit, not a code edit
    for (const [k, v] of Object.entries(META_KEYS)) if (meta[k] !== undefined) API[v] = meta[k];
    return API;
  })();

  const entry = (sheet, name) => { const s = sheets[sheet]; return (s && s.sprites[name]) || null; };
  const cellCache = new Map();
  function cell(sheetName, name, i) {
    const key = sheetName + '|' + name + '|' + (i || 0);
    if (cellCache.has(key)) return cellCache.get(key);
    const s = sheets[sheetName], e = s && s.sprites[name];
    let c;
    if (!e) {
      console.warn('sprites: missing ' + sheetName + ':' + name + ', re-run dev/bake.html');
      c = canvas(1, 1)[0];
    } else {
      const n = e.n || 1, f = (((i || 0) % n) + n) % n;
      const [cc, x] = canvas(e.w, e.h);
      x.drawImage(s.canvas, e.x + f * e.w, e.y, e.w, e.h, 0, 0, e.w, e.h);
      c = cc;
    }
    cellCache.set(key, c);
    return c;
  }
  const cellTex = (sheet, name, i) => cachedTex('c:' + sheet + '|' + name + '|' + (i || 0), () => cell(sheet, name, i));

  // ---------- text: composed at run time over the font sheet ----------
  // A glyph cell is its ink outline plus a PURE #ffffff fill; composition
  // replaces exactly that white with the caller's colour, so an artist can
  // reshape a glyph, restyle its outline, even add a fixed-colour accent:
  // anything that is not pure white stays as painted.
  const hexRGB = (col) => {
    let h = String(col).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const textCache = new Map();
  function textCanvas(str, fg) {
    const key = fg + '|' + str;
    if (textCache.has(key)) return textCache.get(key);
    const font = sheets.font;
    const parts = [];
    let w = 0;
    for (const ch of str) {
      if (ch === ' ') { parts.push(null); w += 3; continue; }
      const e = font && font.sprites['g.' + ch];
      if (!e) continue;
      parts.push(e);
      w += (e.adv || e.w - 2) + 1;
    }
    const [c, x] = canvas(Math.max(1, w + 1), 7);
    let gx = 1;
    for (const e of parts) {
      if (!e) { gx += 3; continue; }
      x.drawImage(font.canvas, e.x, e.y, e.w, e.h, gx - 1, 0, e.w, e.h);
      gx += (e.adv || e.w - 2) + 1;
    }
    const [r, g, b] = hexRGB(fg);
    const img = x.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] === 255 && d[i + 1] === 255 && d[i + 2] === 255 && d[i + 3] === 255) { d[i] = r; d[i + 1] = g; d[i + 2] = b; }
    }
    x.putImageData(img, 0, 0);
    textCache.set(key, c);
    return c;
  }

  // ---------- materials ----------
  // A material is one cell; its grade is a second sprite laid over it, never
  // baked in (two grades, twelve frames, shared by the whole game).
  const matName = (kind) => {
    if (entry('materials', 'mat.' + kind)) return 'mat.' + kind;
    console.warn('sprites: no material cell for ' + kind);
    return 'mat.crate';
  };
  // 0 = plain (Mk1, and everything past the ore level), 1 = deep, 2 = pure
  function matGrade(kind) {
    const spec = (window.CHAIN && window.CHAIN.MATS && window.CHAIN.MATS[kind]) || null;
    if (!spec || spec.form !== 'ore') return 0;
    return Math.max(0, Math.min(2, (spec.depth || 1) - 1));
  }
  // body and mark flattened, for callers that can only take a picture
  function matFlat(kind, frame) {
    const body = cell('materials', matName(kind));
    const [c, x] = canvas(body.width, body.height);
    x.drawImage(body, 0, 0);
    const lv = matGrade(kind);
    if (lv) x.drawImage(cell('materials', 'grade.' + lv, frame === undefined ? API.MAT_SPARK_PEAK : frame), 0, 0);
    return c;
  }

  // ---------- build site marker: bold survey outline, sized at run time ----------
  function siteMarker(w, h) {
    const W = w || 48, H = h || 32;
    const [c, x] = canvas(W, H);
    x.fillStyle = 'rgba(242, 193, 78, 0.28)';
    x.fillRect(1, 1, W - 2, H - 2);
    R(x, P.brass1, 0, 0, W, 1); R(x, P.brass1, 0, H - 1, W, 1);
    R(x, P.brass1, 0, 0, 1, H); R(x, P.brass1, W - 1, 0, 1, H);
    for (let i = 3; i < W - 3; i += 6) { R(x, P.brass2, i, 0, 3, 1); R(x, P.brass2, i, H - 1, 3, 1); }
    for (let i = 3; i < H - 3; i += 6) { R(x, P.brass2, 0, i, 1, 3); R(x, P.brass2, W - 1, i, 1, 3); }
    for (const [sx, sy] of [[0, 0], [W - 3, 0], [0, H - 3], [W - 3, H - 3]]) {
      R(x, P.white, sx, sy, 3, 3); R(x, P.red, sx, sy, 3, 1);
    }
    const cx = (W >> 1) - 1, cy = (H >> 1) - 1;
    R(x, P.brass3, cx - 2, cy, 5, 1); R(x, P.brass3, cx, cy - 2, 1, 5);
    return c;
  }

  // index.json meta key → exported constant. Defaults below match the first
  // bake; the manifest wins the moment the sheets are in.
  const META_KEYS = {
    tile: 'TILE', workFrames: 'WORK_FRAMES', idleFrames: 'IDLE_FRAMES',
    walkBeats: 'WALK_BEATS', idleBeats: 'IDLE_BEATS', charW: 'CHAR_W', charH: 'CHAR_H',
    beltPitch: 'BELT_PITCH', matPx: 'MAT_PX', sparkFrames: 'MAT_SPARK_FRAMES',
    sparkPeak: 'MAT_SPARK_PEAK', puffFrames: 'PUFF_FRAMES', groundVariants: 'GROUND_VARIANTS',
  };

  const API = {
    P,
    TILE: 16,
    util: { canvas, R, disc, dr, tex, cachedTex },
    ready,
    // sheet access for js/tiles.js (the terrain composer) and the dev pages
    cell, entry,
    GROUND_VARIANTS: 4,
    // machines take a mode: 'still' | 'idle' | 'work'; facing 's'|'n'|'e'|'w'.
    // Every facing is its own drawn row on the sheet; nothing is mirrored.
    WORK_FRAMES: 4, IDLE_FRAMES: 6,
    machineTex: (tier, frame, mode, facing) => cellTex('mine', tier + '.' + (facing || 's') + '.' + (mode || 'work'), frame),
    stationTex: (kind, frame, mode, facing) => cellTex('station-' + kind, (facing || 's') + '.' + (mode || 'work'), frame),
    // how many frames one (look, mode, facing) band holds: per animation,
    // read off the manifest, so one machine can grow an eight-frame work
    // loop without the others hearing about it
    animFrames: (look, mode, face) => {
      const e = typeof look === 'number'
        ? entry('mine', look + '.' + (face || 's') + '.' + mode)
        : entry('station-' + look, (face || 's') + '.' + mode);
      return (e && e.n) || 1;
    },
    // the operator: dirs down | up | side (faces right) | left, and left is
    // its own drawn row too
    CHAR_W: 20, CHAR_H: 28, WALK_BEATS: 8, IDLE_BEATS: 4,
    characterTex: (dir, frame) => cellTex('character', 'walk.' + dir, frame),
    characterIdleTex: (dir, frame) => cellTex('character', 'idle.' + dir, frame),
    characterWorkTex: (frame) => cellTex('character', 'work', frame),
    // belts: shape h|v|ne|nw|se|sw, each direction its own row; ends and
    // ports are drawn per side, no quarter-turning at run time
    BELT_PITCH: 8,
    beltTileTex: (frame, shape, rev, pipe) => cellTex('belts', 'tile.' + shape + '.' + (rev ? 'r' : 'f') + '.' + (pipe ? 'p' : 'b'), frame),
    beltEndTex: (frame, side, pipe) => (pipe ? cellTex('belts', 'end.' + side + '.p', 0) : cellTex('belts', 'end.' + side + '.b', frame)),
    portTex: (side, dir) => cellTex('belts', 'port.' + side + '.' + dir, 0),
    spoolTex: () => cellTex('belts', 'spool', 0),
    matDotTex: () => cellTex('belts', 'dot', 0),
    // veins, scenery, props
    nodeTex: (kind, vert) => cellTex('veins', 'vein.' + kind + '.' + (vert ? 'v' : 'h'), 0),
    flowerTex: (s) => cellTex('scenery', 'flower.' + (((s | 0) % 4 + 4) % 4), 0),
    sceneryTex: (kind) => cellTex('scenery', kind, 0),
    propTex: (kind) => cellTex('props', kind, 0),
    boardTex: (hasWork) => cellTex('props', 'board.' + (hasWork ? 1 : 0), 0),
    // effects
    PUFF_FRAMES: 4,
    puffTex: (frame) => cellTex('effects', 'puff.' + Math.max(0, Math.min(API.PUFF_FRAMES - 1, frame | 0)), 0),
    stateDotTex: (kind) => cellTex('effects', 'dot.' + (kind === 'run' || kind === 'starved' ? kind : 'full'), 0),
    sparkTex: () => cellTex('effects', 'spark', 0),
    dropShadowTex: () => cellTex('effects', 'shadow', 0),
    petalTex: (frame) => cellTex('effects', 'petal', frame),
    glowHaloTex: () => cellTex('effects', 'halo', 0),
    siteTex: (w, h) => cachedTex('site:' + (w || 48) + 'x' + (h || 32), () => siteMarker(w, h)),
    // text and icons
    textTex: (str, fg) => cachedTex('t:' + fg + '|' + str, () => textCanvas(str, fg)),
    // the 12px menu icons: one per machine kind, plus 'belt' and 'pipe' for
    // the rows that build a run
    kindIconTex: (kind) => cellTex('materials', entry('materials', 'icon.' + kind) ? 'icon.' + kind : 'icon.default', 0),
    // materials
    MAT_PX: 10, MAT_SPARK_FRAMES: 12, MAT_SPARK_PEAK: 2, matGrade,
    matTex: (kind) => cellTex('materials', matName(kind), 0),
    gradeTex: (level, frame) => cellTex('materials', 'grade.' + level, frame),
    matCanvas: matFlat,
    matURL: (kind, frame) => matFlat(kind, frame).toDataURL(),
    vignetteURL: () => cell('vignette', 'vignette').toDataURL(),
    // raw canvases for the dev proof pages (dev/map.html, dev/sky.html)
    nodeCanvas: (kind, vert) => cell('veins', 'vein.' + kind + '.' + (vert ? 'v' : 'h')),
    sceneryCanvas: (kind) => cell('scenery', kind),
    propCanvas: (kind) => cell('props', kind),
    machineCanvas: (tier, frame, mode, facing) => cell('mine', tier + '.' + (facing || 's') + '.' + (mode || 'work'), frame),
    stationCanvas: (kind, frame, mode, facing) => cell('station-' + kind, (facing || 's') + '.' + (mode || 'work'), frame),
  };
  window.PIXELS = API;
})();
