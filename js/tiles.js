// The terrain composer. The drawings moved to assets/sprites/ (ground fills,
// cliff cells, stairs, slopes, crossings, scenery, all baked by dev/bake.html
// from the generator in dev/gen/tiles.js); what lives here is everything a
// PNG cannot know at edit time: which tile of the grid gets which cell, the
// autotile edge spills masked out of the artist's fill tiles, the cliff
// band's connectivity, walkability, and the minimap. Style rules and the
// original drawings: dev/gen/tiles.js.
//
// Terrain data comes from CHAIN.MAP (regions / ground rects / plateaus /
// walls / crossings). bake() turns those rects into a tile grid + baked
// ground canvases. Global namespace: TILES. No PIXI here; canvases only.
(function () {
  'use strict';

  const { P, util } = window.PIXELS;
  const { canvas, R, dr } = util;
  const T = 16;

  // ---------- ground kinds ----------
  // pri: a higher kind spills its edge onto a lower neighbour (autotiling).
  // edge: how the spill looks. tuft = grass overhang w/ outline + hanging
  // blades; soft = no outline (sand, snow, dirt); hard = outlined stone;
  // plate = built surface (pad, boards): straight seam + shadow.
  const KINDS = {
    water: { pri: 0, edge: 'none', walk: false },
    tar:   { pri: 0, edge: 'none', walk: false },
    sand:  { pri: 1, edge: 'soft' },
    dirt:  { pri: 2, edge: 'soft' },
    crack: { pri: 2, edge: 'soft' },
    marsh: { pri: 2, edge: 'soft' },
    pad:   { pri: 2, edge: 'soft' },   // a cobbled pad sits IN the grass; grass overhangs it (FF3 paths)
    ice:   { pri: 3, edge: 'hard' },
    rock:  { pri: 3, edge: 'hard' },
    shale: { pri: 3, edge: 'hard' },
    snow:  { pri: 4, edge: 'soft' },
    frost: { pri: 4, edge: 'tuft' },
    grass: { pri: 5, edge: 'tuft' },
    board: { pri: 7, edge: 'plate' },
  };
  const KIND_IDS = Object.keys(KINDS);
  const kid = (name) => { const i = KIND_IDS.indexOf(name); if (i < 0) throw new Error('unknown ground kind ' + name); return i; };
  const STYLE_IDS = ['tan', 'grey', 'violet', 'snow', 'drift'];
  // side bits, shared by the cliff band, the stairs and the side ramps
  const N = 1, E = 2, S = 4, Wb = 8;

  // ---------- fills: the artist's 16x16 tiles ----------
  // A kind is a handful of variants that are the same tile looking different;
  // bake() spreads them by position. Water's variants animate (two frames).
  const NV = () => window.PIXELS.GROUND_VARIANTS || 4;
  function fill(kind, seed, frame) {
    const v = (((seed | 0) % NV()) + NV()) % NV();
    if (kind === 'water') return window.PIXELS.cell('ground', 'water.' + v, frame || 0);
    return window.PIXELS.cell('ground', kind + '.' + v);
  }

  // ---------- edge spills (the autotile) ----------
  // bits: N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128 — set where that neighbour
  // is the `over` kind. Draws over's texture spilling into THIS (lower) tile.
  // The mask is computed here; the pixels inside it are the artist's fill, so
  // no edge combination ever has to be painted by hand.
  const TUFT_COL = { grass: P.gD, frost: P.fC };
  const SOFT_HI = { sand: P.sB, snow: P.white, dirt: null, crack: P.xB, marsh: null };
  const PLATE_SHADOW = { pad: P.pD, board: P.bD };
  const spillCache = new Map();
  function spill(over, under, bits, seed) {
    const st = KINDS[over].edge;
    if (st === 'none' || !bits) return null;
    const key = over + '>' + under + ':' + bits + ':' + (seed % 7);
    if (spillCache.has(key)) return spillCache.get(key);
    const [c, x] = canvas(T, T);
    if (st === 'plate') {
      const sh = PLATE_SHADOW[over];
      if (bits & 1) R(x, sh, 0, 0, T, 1);
      if (bits & 64) R(x, sh, 0, 0, 1, T);
      spillCache.set(key, c);
      return c;
    }
    const mask = new Uint8Array(T * T);
    const set = (px, py) => { if (px >= 0 && px < T && py >= 0 && py < T) mask[py * T + px] = 1; };
    const depth = (i, side) => {
      const n = dr(i >> 1, seed, side * 3 + 1);
      const j = dr(i, seed + 5, side + 11);
      if (st === 'tuft') return 1 + Math.floor(n * 3) + (j > 0.7 ? 1 : 0);
      if (st === 'soft') return 2 + Math.floor(n * 2) + (j > 0.6 ? 1 : 0);
      return 1 + Math.floor(n * 2);
    };
    if (bits & 1) for (let i = 0; i < T; i++) { const d = depth(i, 0); for (let k = 0; k < d; k++) set(i, k); }
    if (bits & 16) for (let i = 0; i < T; i++) { const d = depth(i, 2); for (let k = 0; k < d; k++) set(i, T - 1 - k); }
    if (bits & 4) for (let i = 0; i < T; i++) { const d = depth(i, 1); for (let k = 0; k < d; k++) set(T - 1 - k, i); }
    if (bits & 64) for (let i = 0; i < T; i++) { const d = depth(i, 3); for (let k = 0; k < d; k++) set(k, i); }
    const corner = (cx, cy) => {
      const r = st === 'soft' ? 4 : 3 + (dr(cx, cy, seed) > 0.5 ? 1 : 0);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r) set(cx + dx, cy + dy);
    };
    if (bits & 2) corner(T - 1, 0);
    if (bits & 8) corner(T - 1, T - 1);
    if (bits & 32) corner(0, T - 1);
    if (bits & 128) corner(0, 0);

    x.drawImage(fill(over, seed), 0, 0);
    const img = x.getImageData(0, 0, T, T);
    for (let i = 0; i < T * T; i++) if (!mask[i]) img.data[i * 4 + 3] = 0;
    x.putImageData(img, 0, 0);

    const outCol = st === 'tuft' ? P.tOut : st === 'hard' ? (over === 'ice' ? P.iC : over === 'shale' ? P.hD : P.rD) : null;
    const hiCol = st === 'soft' ? SOFT_HI[over] : null;
    const foam = under === 'water' ? P.wF : under === 'tar' ? P.tC : null;
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) {
      if (!mask[py * T + px]) continue;
      let boundary = false;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + ox, ny = py + oy;
        if (nx < 0 || nx >= T || ny < 0 || ny >= T) continue;
        if (!mask[ny * T + nx]) { boundary = true; if (foam) R(x, foam, nx, ny, 1, 1); }
      }
      if (boundary) { if (outCol) R(x, outCol, px, py, 1, 1); else if (hiCol) R(x, hiCol, px, py, 1, 1); }
    }
    // grass overhangs: dark blades hang below a northern spill
    if (st === 'tuft' && (bits & 1)) {
      for (let i = 0; i < T; i++) {
        if (dr(i, seed, 9) < 0.62) continue;
        let py = 0; while (py < T && mask[py * T + i]) py++;
        if (py < T - 1) R(x, TUFT_COL[over], i, py, 1, 1 + (dr(i, seed, 10) > 0.5 ? 1 : 0));
      }
    }
    spillCache.set(key, c);
    return c;
  }

  // ---------- the cliff band ----------
  // The rock mass is a sheet cell per (conn, high, style); what stays live is
  // the plateau ground overhanging its high sides, which comes off the ground
  // sheet through spill(), so cliff tops always match the terrain over them.
  // Canvas is 20×24, drawn at (x-2, y-6): tile interior at (2..18, 6..22).
  const KIND_DARK = { grass: P.gD, frost: P.fC, dirt: P.dD, sand: P.sC, rock: P.rD, shale: P.hD, snow: P.nC, ice: P.iC, marsh: P.mC, crack: P.xD, pad: P.pD, board: P.bD, water: P.wO, tar: P.tB };
  const CW = T + 4, CH = T + 8, OX = 2, OY = 6;
  const cliffCache = new Map();
  function cliff(conn, high, style, topKind, seed) {
    const key = conn + ':' + high + ':' + style + ':' + topKind;
    if (cliffCache.has(key)) return cliffCache.get(key);
    const [c, x] = canvas(CW, CH);
    x.drawImage(window.PIXELS.cell('cliffs', 'c.' + style + '.' + conn + '.' + high), 0, 0);
    // the plateau's ground overhangs the high sides in tufts
    if (high && topKind) {
      let bits = 0;
      if (high & N) bits |= 1;
      if (high & E) bits |= 4;
      if (high & S) bits |= 16;
      if (high & Wb) bits |= 64;
      const sp = spill(topKind, 'rock', bits, seed || 0);
      if (sp) x.drawImage(sp, OX, OY);
      else { const dk = KIND_DARK[topKind] || P.tOut; if (high & N) R(x, dk, OX, OY, T, 1); if (high & S) R(x, dk, OX, OY + T - 1, T, 1); if (high & Wb) R(x, dk, OX, OY, 1, T); if (high & E) R(x, dk, OX + T - 1, OY, 1, T); }
    }
    cliffCache.set(key, c);
    return c;
  }
  // Stairs down a face: a sheet cell per (part, style, rails).
  function stairs(part, style, run) {
    const rails = run === undefined ? (Wb | E) : run;
    return window.PIXELS.cell('stairs', 'st.' + part + '.' + style + '.' + rails);
  }
  // A side ramp: the artist's treads over the ground's own fill.
  function slope(side, style, seed, topKind, run) {
    const ends = run === undefined ? (N | S) : run;
    const [c, x] = canvas(T, T);
    x.drawImage(fill(topKind || 'grass', seed), 0, 0);
    x.drawImage(window.PIXELS.cell('slopes', 'sl.' + side + '.' + style + '.' + ends), 0, 0);
    return c;
  }
  // cast shadow onto lower ground east of / below a cliff band (bits W=8 means
  // "the band is to my west", N=1 "the band is above me"). Lighting, not art.
  const shadeCache = new Map();
  function shade(bits) {
    if (shadeCache.has(bits)) return shadeCache.get(bits);
    const [c, x] = canvas(T, T);
    x.fillStyle = 'rgba(8, 20, 12, 0.38)';
    if (bits & 8) x.fillRect(0, 0, 2, T);
    if (bits & 1) x.fillRect(0, 0, T, 3);
    x.fillStyle = 'rgba(8, 20, 12, 0.18)';
    if (bits & 8) x.fillRect(2, 0, 1, T);
    if (bits & 1) x.fillRect(0, 3, T, 1);
    shadeCache.set(bits, c);
    return c;
  }

  // ---------- crossings ----------
  // Baked per configuration that exists in a shipped map: kind, size in
  // tiles, orientation, open/closed (and the slide's style). A new map with a
  // size the sheet lacks warns here: re-run dev/bake.html for the scaffold.
  // The same key logic lives in dev/bake.js; keep the two in step.
  function crossKey(kind, w, h, open, style, dir) {
    if (kind === 'bridge' || kind === 'boardwalk') return 'x.' + kind + '.' + w + 'x' + h + '.' + (dir === 'v' ? 'v' : 'h') + '.' + (open ? 'o' : 'c');
    return 'x.' + kind + '.' + w + 'x' + h + '.' + (kind === 'drift' ? 'drift' : (style || 'tan'));
  }
  function crossing(kind, w, h, open, style, seed, dir) {
    if (open && kind !== 'bridge' && kind !== 'boardwalk') return null;   // an open pass is just the ground
    const key = crossKey(kind, w, h, open, style, dir);
    const e = window.PIXELS.entry('crossings', key);
    if (!e) { console.warn('tiles: no crossing cell ' + key + ', re-run dev/bake.html'); return null; }
    return { c: window.PIXELS.cell('crossings', key), dx: e.dx || 0, dy: e.dy || 0 };
  }

  // ---------- region scenery ----------
  const scenery = (kind) => window.PIXELS.cell('scenery', kind);

  // ---------- baking a map to a grid + ground canvases ----------
  const FL = { SOLID: 1, WATER: 2, RAMP: 4, WALL: 8, FACE: 16, RIM: 32 };
  const CHUNK = 512;

  function bake(MAP, W, H) {
    const cols = Math.ceil(W / T), rows = Math.ceil(H / T);
    const Nt = cols * rows;
    const kind = new Uint8Array(Nt), elev = new Uint8Array(Nt), flags = new Uint8Array(Nt);
    const style = new Uint8Array(Nt), faceH = new Uint8Array(Nt), ramp = new Uint8Array(Nt); // ramp: 1=S stairs, 2=W, 3=E
    const idx = (tx, ty) => ty * cols + tx;
    const inb = (tx, ty) => tx >= 0 && tx < cols && ty >= 0 && ty < rows;
    const paint = (arr, v, r) => {
      const x0 = Math.max(0, Math.floor(r.x / T)), y0 = Math.max(0, Math.floor(r.y / T));
      const x1 = Math.min(cols, Math.ceil((r.x + r.w) / T)), y1 = Math.min(rows, Math.ceil((r.y + r.h) / T));
      for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) arr[idx(tx, ty)] = v;
    };
    // regions are rects anywhere (a biome is placeable, not a column): base
    // ground, cliff palette, elevation (default 0) and the height of the face
    // it shows where it drops (default 2). Later rects paint over earlier.
    for (const rg of MAP.REGIONS) {
      const r = { x: rg.x, y: rg.y || 0, w: rg.w, h: rg.h || H };
      paint(kind, kid(rg.base), r);
      paint(style, Math.max(0, STYLE_IDS.indexOf(rg.cliff || 'tan')), r);
      paint(elev, rg.elev || 0, r);
      paint(faceH, rg.face || 2, r);
    }
    for (const g of MAP.GROUND || []) paint(kind, kid(g.kind), g);
    // plateaus: raised ground within a region (default one level above 0);
    // faces one row unless said; ramps: S = stairs down the face, W/E = side stairs
    for (const p of MAP.PLATEAUS || []) {
      paint(elev, p.elev || 1, p);
      paint(faceH, p.face || 1, p);
      for (const rp of p.ramps || []) {
        const tx = Math.floor(rp.x / T), ty = Math.floor(rp.y / T);
        if (!inb(tx, ty)) continue;
        if (rp.side === 'S') { for (let k = 0; k < (p.face || 1); k++) if (inb(tx, ty + k)) ramp[idx(tx, ty + k)] = 1; }
        else ramp[idx(tx, ty)] = rp.side === 'W' ? 2 : 3;
      }
    }
    // a 'stairs' crossing is a flight cut through a face (open/closed is the
    // heap on top of it, decided at run time)
    for (const c of MAP.CROSSINGS || []) {
      if (c.kind !== 'stairs') continue;
      const x0 = Math.floor(c.x / T), x1 = Math.ceil((c.x + c.w) / T), y0 = Math.floor(c.y / T), y1 = Math.ceil((c.y + c.h) / T);
      for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) if (inb(tx, ty)) ramp[idx(tx, ty)] = 1;
    }
    for (const w of MAP.WALLS || []) paint(flags, FL.WALL | FL.SOLID, w);
    const forest = MAP.FOREST || { n: MAP.TREELINE || 0 };
    const treeTop = Math.floor((forest.n || 0) / T);   // rows above this are the border forest
    // faces below any drop in elevation; water/tar are solid
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const i = idx(tx, ty);
      const kn = KIND_IDS[kind[i]];
      if (KINDS[kn].walk === false) flags[i] |= FL.SOLID | (kn === 'water' ? FL.WATER : 0);
      if (inb(tx, ty + 1) && elev[idx(tx, ty + 1)] < elev[i]) {
        const fh = faceH[i] || 1;
        for (let k = 1; k <= fh; k++) {
          if (!inb(tx, ty + k) || elev[idx(tx, ty + k)] >= elev[i]) break;
          const j = idx(tx, ty + k);
          if (ramp[j] === 1) { flags[j] |= FL.RAMP; flags[j] &= ~FL.SOLID; }
          else flags[j] |= FL.FACE | FL.SOLID;
        }
      }
      if (ramp[i] >= 2) flags[i] |= FL.RAMP;
    }
    // rims: high ground's ring tiles on the N/E/W sides are cliff band too —
    // unwalkable, so the top of high ground always shows its edge (FF3 rule).
    // A side ramp keeps its ring tile as stairs.
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const i = idx(tx, ty);
      if (ramp[i] >= 2) continue;
      const lower = (nx, ny) => inb(nx, ny) && elev[idx(nx, ny)] < elev[i] && !(flags[idx(nx, ny)] & FL.FACE);
      if ((ty > treeTop && lower(tx, ty - 1)) || lower(tx + 1, ty) || lower(tx - 1, ty)) flags[i] |= FL.RIM | FL.SOLID;
    }
    const isBand = (tx, ty) => inb(tx, ty) && (flags[idx(tx, ty)] & (FL.WALL | FL.FACE | FL.RIM));

    // ground canvases per chunk (water tiles left transparent — animated sprites go under)
    const chunks = [];
    for (let cx0 = 0; cx0 < W; cx0 += CHUNK) {
      const [c, x] = canvas(Math.min(CHUNK, W - cx0), rows * T);
      chunks.push({ x: cx0, canvas: c, ctx: x });
    }
    const ctxAt = (px) => { const ch = chunks[Math.floor(px / CHUNK)]; return [ch.ctx, px - ch.x]; };
    // variants are spread by position; the modulus is the sheet's variant count
    const seedOf = (tx, ty) => (tx * 7 + ty * 13) % NV();
    const walls = [], water = [];
    const NB = [[0, -1, 1], [1, -1, 2], [1, 0, 4], [1, 1, 8], [0, 1, 16], [-1, 1, 32], [-1, 0, 64], [-1, -1, 128]];
    const SIDES = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];   // N E S W
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const i = idx(tx, ty);
      const kn = KIND_IDS[kind[i]], seed = seedOf(tx, ty);
      const [x, ox] = ctxAt(tx * T);
      const px = ox, py = ty * T;
      const st = STYLE_IDS[style[i]];
      if (kn === 'water') water.push({ x: tx * T, y: ty * T, seed });
      else x.drawImage(fill(kn, seed), px, py);
      // spills from higher neighbours, lowest priority first
      const overs = {};
      for (const [dx, dy, bit] of NB) {
        const nx = tx + dx, ny = ty + dy;
        if (!inb(nx, ny)) continue;
        const nk = KIND_IDS[kind[idx(nx, ny)]];
        if (nk === kn) continue;
        const a = KINDS[nk].pri, b = KINDS[kn].pri;
        if (a > b || (a === b && nk > kn)) overs[nk] = (overs[nk] || 0) | bit;
      }
      for (const ok of Object.keys(overs).sort((p, q) => KINDS[p].pri - KINDS[q].pri)) {
        const sp = spill(ok, kn, overs[ok], seed);
        if (sp) x.drawImage(sp, px, py);
      }
      // stairs, side ramps, and the shade a band casts on the ground beside it
      if (ramp[i] === 1) {
        let k = 1; while (inb(tx, ty - k) && (flags[idx(tx, ty - k)] & (FL.FACE | FL.RAMP)) && elev[idx(tx, ty - k)] === elev[i]) k++;
        const up = inb(tx, ty - k) ? idx(tx, ty - k) : i;
        const fh = faceH[up] || 1;
        // a flight authored several tiles wide keeps its rails on the outside
        const rails = (inb(tx - 1, ty) && ramp[idx(tx - 1, ty)] === 1 ? 0 : Wb)
          | (inb(tx + 1, ty) && ramp[idx(tx + 1, ty)] === 1 ? 0 : E);
        x.drawImage(stairs(fh > 1 && k < fh ? 'top' : 'bot', STYLE_IDS[style[up]], rails), px, py);
      } else if (ramp[i] === 2 || ramp[i] === 3) {
        const ends = (inb(tx, ty - 1) && ramp[idx(tx, ty - 1)] === ramp[i] ? 0 : N)
          | (inb(tx, ty + 1) && ramp[idx(tx, ty + 1)] === ramp[i] ? 0 : S);
        x.drawImage(slope(ramp[i] === 2 ? 'W' : 'E', st, seed, kn, ends), px, py);
      } else if (!isBand(tx, ty)) {
        let sb = 0;
        if (isBand(tx - 1, ty)) sb |= 8;
        if (isBand(tx, ty - 1)) sb |= 1;
        if (sb) x.drawImage(shade(sb), px, py);
      }
      // the cliff band: rims, faces and walls share one renderer
      if (isBand(tx, ty)) {
        let conn = 0, high = 0, topKind = null;
        for (const [dx, dy, bit] of SIDES) {
          const nx = tx + dx, ny = ty + dy;
          if (!inb(nx, ny)) { conn |= bit; continue; }              // world edge: run straight off
          const j = idx(nx, ny);
          if (isBand(nx, ny) || (flags[j] & FL.RAMP)) conn |= bit;
          else if (!(flags[j] & FL.SOLID) && (((flags[i] & FL.FACE) && elev[j] > elev[i]) || ((flags[i] & FL.RIM) && elev[j] === elev[i]))) {
            high |= bit; topKind = topKind || KIND_IDS[kind[j]];   // the high ground this band belongs to
          }
        }
        // a face is the side of the high ground above it — it wears THAT
        // biome's cliff palette, not the lowland's it happens to stand on
        let bandStyle = st;
        if (flags[i] & FL.FACE) {
          let k = 1; while (inb(tx, ty - k) && (flags[idx(tx, ty - k)] & (FL.FACE | FL.RAMP)) && elev[idx(tx, ty - k)] === elev[i]) k++;
          if (inb(tx, ty - k)) bandStyle = STYLE_IDS[style[idx(tx, ty - k)]];
        }
        // z = the tile's TOP: a band tile beside the operator draws under them
        // (SNES low-priority tile), one below them draws over (they're behind it)
        walls.push({ x: tx * T - 2, y: ty * T - 6, canvas: cliff(conn, high, bandStyle, topKind, seed), z: ty * T });
      }
    }
    for (const ch of chunks) delete ch.ctx;
    return { cols, rows, kind, elev, flags, chunks, walls, water, KIND_IDS, FL };
  }

  // A pixel minimap for the map picker: the map is baked for real, then each
  // tile becomes one s×s block of its ground's average colour — water in the
  // pond's own blue, the cliff band and walls darkened, the border forest a
  // dark green fringe. No PIXI — a canvas.
  function minimap(MAP, W, H, s) {
    const g = bake(MAP, W, H);
    const [c, x] = canvas(g.cols * s, g.rows * s);
    const px = g.chunks.map((ch) => ({
      x: ch.x, w: ch.canvas.width,
      d: ch.canvas.getContext('2d').getImageData(0, 0, ch.canvas.width, ch.canvas.height).data,
    }));
    const avgOf = (d, w, x0, y0) => {
      let r = 0, gg = 0, b = 0, n = 0;
      for (let yy = 0; yy < T; yy++) for (let xx = 0; xx < T; xx++) {
        const i = ((y0 + yy) * w + x0 + xx) * 4;
        if (d[i + 3] === 0) continue;
        r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++;
      }
      return n ? [r / n, gg / n, b / n] : null;
    };
    const wc = fill('water', 0, 0);
    const water = avgOf(wc.getContext('2d').getImageData(0, 0, T, T).data, T, 0, 0) || [40, 70, 120];
    const waterId = KIND_IDS.indexOf('water');
    for (let ty = 0; ty < g.rows; ty++) for (let tx = 0; tx < g.cols; tx++) {
      const i = ty * g.cols + tx;
      let col;
      if (g.kind[i] === waterId) col = water;
      else {
        const wx = tx * T;
        const ch = px.find((p) => wx >= p.x && wx < p.x + p.w);
        col = (ch && avgOf(ch.d, ch.w, wx - ch.x, ty * T)) || [60, 60, 60];
      }
      const dark = (g.flags[i] & (FL.WALL | FL.FACE | FL.RIM)) ? 0.55 : 1;
      x.fillStyle = `rgb(${Math.round(col[0] * dark)},${Math.round(col[1] * dark)},${Math.round(col[2] * dark)})`;
      x.fillRect(tx * s, ty * s, s, s);
    }
    // the border forest as a fringe the walk can't enter
    const f = MAP.FOREST || {};
    x.fillStyle = 'rgba(18, 48, 24, 0.75)';
    const band = (x0, y0, w, h) => { if (w > 0 && h > 0) x.fillRect(x0 * s, y0 * s, w * s, h * s); };
    band(0, 0, g.cols, Math.floor((f.n || 0) / T));
    band(0, g.rows - Math.floor((f.s || 0) / T), g.cols, Math.floor((f.s || 0) / T));
    band(0, 0, Math.floor((f.w || 0) / T), g.rows);
    band(g.cols - Math.floor((f.e || 0) / T), 0, Math.floor((f.e || 0) / T), g.rows);
    return c;
  }

  // tile lookups for movement
  function tileAt(grid, px, py) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (tx < 0 || ty < 0 || tx >= grid.cols || ty >= grid.rows) return null;
    return ty * grid.cols + tx;
  }
  // may a walker step from (ax,ay) to (bx,by)? solid tiles block; a change of
  // elevation blocks unless one side is a ramp.
  function passable(grid, ax, ay, bx, by) {
    const a = tileAt(grid, ax, ay), b = tileAt(grid, bx, by);
    if (b === null) return false;
    if (grid.flags[b] & FL.SOLID) return false;
    if (a === null || a === b) return true;
    if (grid.elev[a] !== grid.elev[b] && !((grid.flags[a] | grid.flags[b]) & FL.RAMP)) return false;
    return true;
  }

  window.TILES = {
    T, KINDS, KIND_IDS, STYLE_IDS, FL,
    fill, spill, cliff, stairs, slope, shade, crossing, scenery,
    bake, tileAt, passable, minimap,
  };
})();
