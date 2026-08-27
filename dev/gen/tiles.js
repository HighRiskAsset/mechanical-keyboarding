// THE TERRAIN GENERATOR (dev only, moved out of the game 2026-08-27). The
// game runs js/tiles.js, which composes the same terrain from the sheets in
// assets/sprites/; dev/bake.html renders those sheets FROM this file. Keep
// prototyping new ground kinds and cliff work here, bake, hand to the artist.
//
// The terrain kit: ground fills, autotile edge spills, rock-wall heaps, plateau
// faces + lips + stairs, water shore, crossings, and region scenery — all
// code-drawn on the 16x16 grid. Style reference: SNES Final Fantasy III (USA)
// town exteriors — jittered-lattice ground ticks, dark green-black outlines,
// tufted grass edges that overhang lower ground, boulder-strata cliff faces
// with a lit lip and a shadowed foot, navy water with a pale foam rim.
// Global namespace: TILES. No PIXI here — canvases only; factory.js textures them.
//
// Terrain data comes from CHAIN.MAP (regions / ground rects / plateaus / walls /
// crossings). bake() turns those rects into a tile grid + baked ground canvases.
(function () {
  'use strict';

  const { P, util } = window.PIXELS;
  const { canvas, R, disc, dr } = util;
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

  // cliff / wall palettes: A hi, B mid, C lo, D deep, O outline
  const CLIFF = {
    tan:    { A: P.cA, B: P.cB, C: P.cC, D: P.cD, O: P.cO },
    grey:   { A: P.kA, B: P.kB, C: P.kC, D: P.kD, O: P.tOut },
    violet: { A: P.vA, B: P.vB, C: P.vC, D: P.vD, O: P.tOut },
    snow:   { A: P.nA, B: P.kA, C: P.kB, D: P.kC, O: P.kD },
    drift:  { A: P.white, B: P.nA, C: P.nB, D: P.nC, O: P.kB },   // a snowdrift, not rock
  };
  const STYLE_IDS = Object.keys(CLIFF);
  // side bits, shared by the cliff band, the stairs and the side ramps
  const N = 1, E = 2, S = 4, Wb = 8;

  // ---------- fills ----------
  // FF3 ground reads as a jittered lattice of 2px ticks: light '/' and dark '\'
  function lattice(x, seed, light, dark, keep) {
    for (let gy = 1; gy < T; gy += 4) {
      const off = ((gy >> 2) & 1) ? 2 : 0;
      for (let gx = off; gx < T; gx += 4) {
        const r = dr(gx + 1, gy + 1, seed);
        if (r < (1 - keep)) continue;
        const px = gx + (dr(gx, gy, seed + 1) > 0.5 ? 1 : 0);
        const py = gy + (dr(gy, gx, seed + 2) > 0.5 ? 1 : 0);
        if (dark && r > 0.86) { R(x, dark, px, py, 1, 1); R(x, dark, px + 1, py + 1, 1, 1); }
        else { R(x, light, px, py, 1, 1); R(x, light, px + 1, py - 1, 1, 1); }
      }
    }
  }
  const specks = (x, seed, col, n, w, h, salt) => {
    for (let i = 0; i < n; i++) {
      R(x, col, Math.floor(dr(i, seed, salt) * (T - w + 1)), Math.floor(dr(seed, i, salt + 1) * (T - h + 1)), w, h);
    }
  };

  const FILL = {
    grass(x, seed) {
      R(x, P.gA, 0, 0, T, T);
      // Cross-hatched meadow blades: the tile has deliberate clumps and
      // shadow pockets rather than a uniform random-noise carpet.
      for (let row = 0; row < 3; row++) {
        const y = 2 + row * 5;
        const offset = (seed * 3 + row * 5) % 9;
        for (let x0 = offset - 7; x0 < T; x0 += 9) {
          const h = 1 + ((seed + row + x0 + 18) % 4 === 0 ? 1 : 0);
          R(x, P.gC, x0 + 1, y + 1, 1, h);
          R(x, P.gB, x0 + 2, y, 1, h + 1);
          if ((seed + row + x0) % 3 === 0) R(x, P.gB, x0 + 3, y + 1, 1, 1);
        }
      }
      if (seed % 4 === 0) {
        const px = 2 + seed % 10, py = 4 + (seed * 3) % 8;
        R(x, P.gD, px, py, 1, 3); R(x, P.gC, px + 1, py - 1, 1, 3); R(x, P.gB, px + 2, py, 2, 1);
      }
      if (seed % 7 === 2) {
        const px = 3 + (seed * 5) % 9, py = 3 + (seed * 7) % 8;
        R(x, P.gD, px, py + 1, 1, 2); R(x, P.petal, px - 1, py, 1, 1); R(x, P.petal, px + 1, py, 1, 1); R(x, P.brass3, px, py, 1, 1);
      }
    },
    frost(x, seed) {
      R(x, P.fA, 0, 0, T, T);
      lattice(x, seed, P.fC, null, 0.35);
      specks(x, seed, P.fB, 4, 1, 1, 107);
      specks(x, seed, P.fB, 2, 2, 1, 109);
    },
    dirt(x, seed) {
      R(x, P.dA, 0, 0, T, T);
      specks(x, seed, P.dC, 5, 2, 1, 3);
      specks(x, seed, P.dB, 4, 1, 1, 7);
      if (seed % 3 === 0) { const px = 3 + seed % 9, py = 2 + (seed * 5) % 11; R(x, P.dD, px, py + 1, 2, 1); R(x, P.dB, px, py, 2, 1); R(x, P.sB, px, py, 1, 1); }
    },
    sand(x, seed) {
      R(x, P.sA, 0, 0, T, T);
      specks(x, seed, P.sB, 5, 1, 1, 11);
      specks(x, seed, P.sC, 3, 1, 1, 13);
    },
    pad(x, seed) {
      // cobbles the FF3 way: pale sage stones of uneven size on a slightly
      // darker bed, low contrast, seams only a shade darker, one lit pixel each
      R(x, P.pC, 0, 0, T, T);
      const cells = [[0, 0, 5, 4], [5, 0, 6, 4], [11, 0, 5, 4], [0, 4, 6, 5], [6, 4, 4, 5], [10, 4, 6, 5], [0, 9, 4, 4], [4, 9, 6, 4], [10, 9, 6, 4], [0, 13, 7, 3], [7, 13, 5, 3], [12, 13, 4, 3]];
      cells.forEach(([sx, sy, w, h], k) => {
        const v = dr(sx + 1, sy + 1, seed);
        const col = v > 0.7 ? P.pB : v < 0.15 ? P.pC : P.pA;
        if (v < 0.15) return;                                   // a missing stone shows the bed
        R(x, col, sx + 1, sy + 1, w - 1, h - 1);
        R(x, P.pB, sx + 1, sy + 1, 1, 1);                       // lit corner
        if (h > 3) R(x, P.pC, sx + 1, sy + h - 1, w - 1, 1);    // its own soft foot
      });
    },
    rock(x, seed) {
      R(x, P.rA, 0, 0, T, T);
      for (let i = 0; i < 4; i++) {
        const px = Math.floor(dr(i, seed, 17) * 14), py = Math.floor(dr(seed, i, 19) * 14);
        R(x, P.rC, px, py + 1, 2, 2); R(x, P.rB, px, py, 2, 2); R(x, P.rB, px, py, 1, 1);
      }
      const cx = 2 + seed % 9, cy = 3 + (seed * 7) % 9;
      R(x, P.rD, cx, cy, 3, 1); R(x, P.rD, cx + 2, cy + 1, 1, 2);
      specks(x, seed, P.rC, 3, 1, 1, 23);
    },
    shale(x, seed) {
      R(x, P.hA, 0, 0, T, T);
      specks(x, seed, P.hB, 4, 2, 1, 113);
      specks(x, seed, P.hC, 3, 2, 1, 127);
      const cx = 1 + seed % 10, cy = 2 + (seed * 5) % 11;
      R(x, P.hD, cx, cy, 4, 1); R(x, P.hD, cx + 3, cy + 1, 1, 2);
      if (seed % 3 === 0) R(x, P.hB, cx + 1, cy - 1, 2, 1);
    },
    marsh(x, seed) {
      R(x, P.mA, 0, 0, T, T);
      specks(x, seed, P.mC, 2, 3, 2, 29);
      specks(x, seed, P.mD, 2, 2, 1, 31);
      lattice(x, seed, P.mB, null, 0.3);
      for (let i = 0; i < 3; i++) {
        const px = Math.floor(dr(i, seed, 37) * 15), py = 2 + Math.floor(dr(seed, i, 41) * 11);
        R(x, P.mC, px, py + 2, 1, 1); R(x, P.mE, px, py, 1, 2);
      }
    },
    board(x, seed) {
      // horizontal planks, 4px pitch, staggered end seams, a nail or two
      R(x, P.bA, 0, 0, T, T);
      for (let y = 3; y < T; y += 4) R(x, P.bD, 0, y, T, 1);
      for (let row = 0; row < 4; row++) {
        const sx = (row * 5 + seed * 3) % T;
        R(x, P.bC, sx, row * 4, 1, 3);
        R(x, P.bB, (sx + 3) % T, row * 4 + 1, 4, 1);
      }
      if (seed % 2) R(x, P.bD, 2 + seed % 11, 1, 1, 1);
    },
    crack(x, seed) {
      R(x, P.xA, 0, 0, T, T);
      specks(x, seed, P.xB, 4, 1, 1, 43);
      specks(x, seed, P.xC, 2, 2, 1, 47);
      // one meandering crack + a stub, dark
      let cy = 3 + Math.floor(dr(seed, 1, 53) * 9);
      for (let px = 0; px < T; px += 2) {
        R(x, P.xD, px, cy, 2, 1);
        const step = dr(px, seed, 59);
        if (step < 0.3 && cy > 1) cy--; else if (step > 0.72 && cy < T - 2) cy++;
      }
      const sx = 2 + Math.floor(dr(seed, 2, 61) * 12);
      R(x, P.xD, sx, 0, 1, 3 + (seed % 3));
    },
    tar(x, seed) {
      R(x, P.tA, 0, 0, T, T);
      specks(x, seed, P.tB, 3, 3, 1, 67);
      specks(x, seed, P.tC, 1, 2, 1, 71);
    },
    snow(x, seed) {
      R(x, P.nA, 0, 0, T, T);
      specks(x, seed, P.nB, 3, 3, 2, 73);
      specks(x, seed, P.nC, 2, 1, 1, 79);
      if (seed % 3 === 0) R(x, P.white, 3 + seed % 10, 2 + (seed * 3) % 11, 1, 1);
    },
    ice(x, seed) {
      R(x, P.iA, 0, 0, T, T);
      specks(x, seed, P.iB, 3, 3, 1, 83);
      for (let i = 0; i < 2; i++) {
        const px = Math.floor(dr(i, seed, 89) * 12), py = Math.floor(dr(seed, i, 97) * 12);
        R(x, P.iC, px, py, 1, 1); R(x, P.iC, px + 1, py + 1, 1, 1); R(x, P.iC, px + 2, py + 2, 1, 1);
      }
    },
    water(x, seed, frame) {
      // Interlocking wavelets move diagonally across a deep blue base. A
      // separate bright crest makes water feel lively even at 16px tiles.
      R(x, P.wA, 0, 0, T, T);
      specks(x, seed, P.wC, 3, 4, 1, 101);
      const o = frame ? 2 : 0;
      for (let row = 0; row < 3; row++) {
        const wy = 2 + row * 5 + (seed % 2);
        const wx = ((row * 6 + seed * 3 + o) % 14);
        R(x, P.wB, wx, wy, 4, 1); R(x, P.wF, wx + 1, wy, 2, 1); R(x, P.wC, wx + 2, wy + 1, 2, 1);
      }
      if (seed % 4 === 0) { const px = (seed * 5 + o) % 15; R(x, P.wF, px, 9, 1, 1); R(x, P.wB, px + 1, 9, 2, 1); }
    },
  };

  const fillCache = new Map();
  function fill(kind, seed, frame) {
    const key = kind + ':' + (seed % 23) + ':' + (frame || 0);
    if (!fillCache.has(key)) {
      const [c, x] = canvas(T, T);
      FILL[kind](x, seed % 23, frame || 0);
      fillCache.set(key, c);
    }
    return fillCache.get(key);
  }

  // ---------- edge spills (the autotile) ----------
  // bits: N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128 — set where that neighbour
  // is the `over` kind. Draws over's texture spilling into THIS (lower) tile.
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

  // ---------- boulder heaps: rockslides, boulders, scrub ----------
  // Paints a union of blobs as shaded boulders with an outline. `m` is a
  // W×H mask; blobs are [cx, cy, r]. Each stone: deep foot, lo body, mid
  // shoulder, a small lit cap top-left — the FF3 river-stone look.
  function stone(x, cx, cy, r, pal, clip) {
    const d = (col, ox, oy, rr) => {
      for (let dy = -rr; dy <= rr; dy++) {
        const hw = Math.round(Math.sqrt(rr * rr - dy * dy));
        for (let px = cx + ox - hw; px <= cx + ox + hw; px++) {
          const py = cy + oy + dy;
          if (!clip || clip(px, py)) R(x, col, px, py, 1, 1);
        }
      }
    };
    d(pal.D, 0, 2, r); d(pal.C, 0, 0, r); d(pal.B, 0, -1, Math.max(1, r - 1)); d(pal.A, -1, -2, Math.max(1, r - 3));
  }
  function heap(x, W, H, blobs, pal, openEdges) {
    const m = new Uint8Array(W * H);
    const put = (cx, cy, r) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + r / 2) continue;
        const px = cx + dx, py = cy + dy;
        if (px >= 0 && px < W && py >= 0 && py < H) m[py * W + px] = 1;
      }
    };
    for (const [cx, cy, r] of blobs) put(cx, cy, r);
    const inMass = (px, py) => px >= 0 && px < W && py >= 0 && py < H && m[py * W + px];
    for (let i = 0; i < W * H; i++) if (m[i]) R(x, pal.C, i % W, (i / W) | 0, 1, 1);
    for (const [cx, cy, r] of blobs) stone(x, cx, cy, r, pal, inMass);
    // foot shadow: bottom pixels of the mass, plus a cast row on the ground
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      if (!m[py * W + px]) continue;
      const below = py + 1 < H ? m[(py + 1) * W + px] : 1;
      if (!below) { R(x, pal.D, px, py, 1, 1); R(x, pal.D, px, py - 1, 1, 1); if (py + 1 < H) R(x, pal.D, px, py + 1, 1, 1); }
    }
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      if (m[py * W + px]) continue;
      let adj = false;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + ox, ny = py + oy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && m[ny * W + nx]) adj = true;
      }
      if (!adj) continue;
      if ((openEdges & 1) && py < 4) continue;
      R(x, pal.O, px, py, 1, 1);
    }
  }
  // a rockslide filling w×h tiles (a closed pass) or a snowdrift
  function slide(w, h, style, seed) {
    const [c, x] = canvas(w * T, h * T + 4);
    const pal = CLIFF[style];
    const blobs = [];
    for (let j = 0; j < h; j++) {
      const by = 4 + j * T;
      for (let i = 0; i < w; i++) {
        blobs.push([i * T + 8, by + 8, 5 + (dr(i, j + seed, 3) > 0.5 ? 1 : 0)]);
        blobs.push([i * T + 1, by + 9, 4]);
        if (dr(i, j + seed, 5) > 0.4) blobs.push([i * T + 11 - ((i + j) % 2) * 6, by + 3, 3]);
      }
      blobs.push([w * T - 1, by + 9, 4]);
    }
    heap(x, w * T, h * T + 4, blobs, pal, 0);
    return c;
  }

  // ---------- the cliff band ----------
  // Every level change is a band of stacked boulders, one tile thick per row,
  // unwalkable (FF3: you never see a bare edge). One renderer covers plateau
  // rims (N/E/W ring tiles), south faces (rows below the plateau) and free-
  // standing rock walls. Per side:
  //   conn  — another band tile or stairs: mass runs straight through, no outline
  //   high  — the plateau interior: its ground overhangs the stones in dark tufts
  //   open  — anything else: the mass bulges/notches by a pixel or two;
  //           N/W open = lit rim (the top of the heap), E open = a shadow line,
  //           S open = the heavy dark foot. The neighbour below/east gets shade().
  // Canvas is 20×24, drawn at (x-2, y-6): tile interior at (2..18, 6..22).
  const KIND_DARK = { grass: P.gD, frost: P.fC, dirt: P.dD, sand: P.sC, rock: P.rD, shale: P.hD, snow: P.nC, ice: P.iC, marsh: P.mC, crack: P.xD, pad: P.pD, board: P.bD, water: P.wO, tar: P.tB };
  const CW = T + 4, CH = T + 8, OX = 2, OY = 6;
  const cliffCache = new Map();
  function cliff(conn, high, style, topKind, seed) {
    const key = conn + ':' + high + ':' + style + ':' + topKind + ':' + (seed % 8);
    if (cliffCache.has(key)) return cliffCache.get(key);
    const [c, x] = canvas(CW, CH);
    const pal = CLIFF[style];
    const open = (b) => !(conn & b) && !(high & b);
    // mass: on connected / high sides the tile is filled to its edge; on open
    // sides the core is inset and the round stones themselves make the edge —
    // a scalloped crest of boulder caps on top, a bumpy foot below, so the
    // band never ends in a flat line that could read as a walkable surface
    const m = new Uint8Array(CW * CH);
    const x0 = open(Wb) ? 3 : 0, x1 = open(E) ? T - 3 : T, y0 = open(N) ? 4 : 0, y1 = open(S) ? T - 3 : T;
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) m[(py + OY) * CW + px + OX] = 1;
    const jit = (a, b, s) => Math.floor(dr(a + 3, b + 7, seed + s) * 3) - 1;   // -1..1
    const stones = [[1, 4], [8, 4], [15, 4], [4, 11], [12, 11]];
    if (conn & S) stones.push([4, 18], [12, 18]);
    if (conn & N) stones.push([8, -3]);
    if (!open(Wb)) stones.push([-2, 11]);
    if (!open(E)) stones.push([18, 11]);
    const placed = stones.map(([sx, sy]) => [OX + sx + jit(sx, sy, 0), OY + sy + jit(sy, sx, 1), 3 + Math.floor(dr(sx + 11, sy + 5, seed) * 3)]);
    for (const [cx, cy, r] of placed) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + r / 2) continue;
        const px = cx + dx, py = cy + dy;
        if (px >= 0 && px < CW && py >= 0 && py < CH) m[py * CW + px] = 1;
      }
    }
    // never past the tile on connected sides (the neighbour continues the mass)
    for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) {
      if (!m[py * CW + px]) continue;
      if (((conn | high) & N) && py < OY) m[py * CW + px] = 0;
      if (((conn | high) & S) && py >= OY + T) m[py * CW + px] = 0;
      if (((conn | high) & Wb) && px < OX) m[py * CW + px] = 0;
      if (((conn | high) & E) && px >= OX + T) m[py * CW + px] = 0;
    }
    const inMass = (px, py) => px >= 0 && px < CW && py >= 0 && py < CH && m[py * CW + px];
    for (let i = 0; i < CW * CH; i++) if (m[i]) R(x, pal.C, i % CW, (i / CW) | 0, 1, 1);
    for (const [cx, cy, r] of placed) stone(x, cx, cy, r, pal, inMass);
    // side dressing
    if (open(S)) for (let px = 0; px < CW; px++) { let py = CH - 1; while (py >= 0 && !m[py * CW + px]) py--; for (let k = 0; k < 3 && py - k >= 0; k++) if (m[(py - k) * CW + px]) R(x, pal.D, px, py - k, 1, 1); }
    if (open(E)) for (let py = 0; py < CH; py++) { let px = CW - 1; while (px >= 0 && !m[py * CW + px]) px--; if (px >= 0) R(x, pal.D, px, py, 1, 1); }
    if (open(N)) for (let px = 0; px < CW; px++) { let py = 0; while (py < CH && !m[py * CW + px]) py++; if (py < CH) R(x, pal.A, px, py, 1, 1); }
    if (open(Wb)) for (let py = 0; py < CH; py++) { let px = 0; while (px < CW && !m[py * CW + px]) px++; if (px < CW && dr(py, seed, 13) > 0.3) R(x, pal.A, px, py, 1, 1); }
    // outline around the mass, except where the band continues
    for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) {
      if (m[py * CW + px]) continue;
      let adj = false;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inMass(px + ox, py + oy)) adj = true;
      if (!adj) continue;
      if ((conn & N) && py < OY) continue;
      if ((conn & S) && py >= OY + T) continue;
      if ((conn & Wb) && px < OX) continue;
      if ((conn & E) && px >= OX + T) continue;
      R(x, pal.O, px, py, 1, 1);
    }
    // the plateau's ground overhangs the high sides in tufts
    if (high && topKind) {
      let bits = 0;
      if (high & N) bits |= 1;
      if (high & E) bits |= 4;
      if (high & S) bits |= 16;
      if (high & Wb) bits |= 64;
      const sp = spill(topKind, 'rock', bits, seed);
      if (sp) x.drawImage(sp, OX, OY);
      else { const dk = KIND_DARK[topKind] || pal.O; if (high & N) R(x, dk, OX, OY, T, 1); if (high & S) R(x, dk, OX, OY + T - 1, T, 1); if (high & Wb) R(x, dk, OX, OY, 1, T); if (high & E) R(x, dk, OX + T - 1, OY, 1, T); }
    }
    cliffCache.set(key, c);
    return c;
  }
  // Stairs down a face (a south ramp): stone treads between dark rails. `run`
  // says which of W/E carry a rail — a flight several tiles wide is authored
  // as several ramp tiles side by side, and only its two outer tiles show a
  // rail, so the run reads as one broad stair instead of a rank of narrow ones.
  const stairCache = new Map();
  function stairs(part, style, run, seed) {
    const rails = run === undefined ? (Wb | E) : run;
    const s = (seed || 0) % 4;
    const key = part + ':' + style + ':' + rails + ':' + s;
    if (stairCache.has(key)) return stairCache.get(key);
    const [c, x] = canvas(T, T);
    const pal = CLIFF[style];
    R(x, pal.C, 0, 0, T, T);
    const x0 = (rails & Wb) ? 2 : 0, x1 = (rails & E) ? T - 2 : T;
    // Treads run the whole width and straight on into the next tile: a flight
    // authored several tiles wide is ONE broad stair, and any vertical line
    // inside it would turn the whole thing into fence panels.
    for (let y = 0; y < T; y += 4) {
      R(x, pal.A, x0, y, x1 - x0, 1);           // the lit nosing
      R(x, pal.B, x0, y + 1, x1 - x0, 2);       // the tread
      R(x, pal.O, x0, y + 3, x1 - x0, 1);       // the riser, dark — this is what says step
      // a worn stone here and there, offset per tile so the wear never repeats
      const px = x0 + ((y >> 2) + s) % 4 * 3 + 2;
      if (px < x1 - 2) { R(x, pal.C, px, y + 1, 2, 2); R(x, pal.B, px, y, 2, 1); }
    }
    if (rails & Wb) { R(x, pal.D, 1, 0, 1, T); R(x, pal.O, 0, 0, 1, T); }
    if (rails & E) { R(x, pal.D, T - 2, 0, 1, T); R(x, pal.O, T - 1, 0, 1, T); }
    if (part !== 'top') R(x, pal.O, 0, T - 1, T, 1);
    stairCache.set(key, c);
    return c;
  }
  // A side ramp (W/E): a sideways stair cut through the plateau's rim. `run`
  // says which of N/S close the cut — stacked ramp tiles leave their shared
  // edges open so a tall run reads as one wide way up.
  function slope(side, style, seed, topKind, run) {
    const ends = run === undefined ? (N | S) : run;
    const [c, x] = canvas(T, T);
    // 'none' is the baker asking for the treads alone: at run time the ground
    // under a ramp comes from the ground sheet, not from this drawing
    if (topKind !== 'none') x.drawImage(fill(topKind || 'grass', seed), 0, 0);
    const pal = CLIFF[style];
    // The cut's floor runs the full tile except where the run ends, so a ramp
    // several tiles tall is one wide way up rather than a stack of gateposts.
    // Treads stand on end (you climb sideways) with a dark riser between them.
    const y0 = (ends & N) ? 2 : 0, y1 = (ends & S) ? T - 2 : T;
    R(x, pal.C, 0, y0, T, y1 - y0);
    for (let sx = 0; sx < T; sx += 4) {
      const lit = side === 'W' ? sx : T - 1 - sx;   // treads climb toward the plateau interior
      R(x, pal.A, lit, y0, 1, y1 - y0);
      R(x, pal.B, side === 'W' ? sx + 1 : T - 3 - sx, y0, 2, y1 - y0);
      R(x, pal.O, side === 'W' ? sx + 3 : T - 4 - sx, y0, 1, y1 - y0);
    }
    if (ends & N) { R(x, pal.O, 0, 0, T, 1); R(x, pal.D, 0, 1, T, 1); }
    if (ends & S) { R(x, pal.D, 0, T - 2, T, 1); R(x, pal.O, 0, T - 1, T, 1); }
    return c;
  }
  // cast shadow onto lower ground east of / below a cliff band (bits W=8 means
  // "the band is to my west", N=1 "the band is above me")
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
  // w,h in tiles. Each returns {c, dy} (draw the canvas at x, y - dy) or null
  // when nothing is drawn (an open pass or drift is just the ground).
  function bridge(w, h, open) {
    const W = w * T, H = h * T;
    const [c, x] = canvas(W, H + 2);
    const planks = (x0, x1) => {
      for (let px = x0; px < x1; px += 3) {
        R(x, P.bA, px, 3, 2, H - 4); R(x, P.bB, px, 4, 1, 3); R(x, P.bB, px, H - 8, 1, 2); R(x, P.bD, px + 2, 3, 1, H - 4);
      }
      R(x, P.bC, x0, 2, x1 - x0, 1); R(x, P.bD, x0, H - 1, x1 - x0, 1);
    };
    const rails = (x0, x1) => {
      for (let px = x0; px < x1; px += 8) { R(x, P.bD, px, 0, 2, 5); R(x, P.bD, px, H - 3, 2, 5); R(x, P.bB, px, 0, 1, 1); }
      R(x, P.bC, x0, 1, x1 - x0, 1); R(x, P.bC, x0, H - 2, x1 - x0, 1);
    };
    if (open) { planks(0, W); rails(0, W); }
    else {
      planks(0, 10); planks(W - 10, W); rails(0, 10); rails(W - 10, W);
      // snapped ends and a couple of drifting boards
      R(x, P.bD, 10, 5, 2, 3); R(x, P.bD, W - 12, 9, 2, 4);
      R(x, P.bA, 14, 8, 6, 2); R(x, P.bD, 14, 10, 6, 1);
      R(x, P.bA, W - 20, H - 6, 5, 2); R(x, P.bD, W - 20, H - 4, 5, 1);
    }
    return { c, dy: 1 };
  }
  function boardwalk(w, h, open) {
    const W = w * T, H = h * T;
    const [c, x] = canvas(W, H + 4);
    if (open) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) x.drawImage(fill('board', i * 3 + j * 5), i * T, 4 + j * T);
      for (let i = 0; i < w; i++) { R(x, P.bD, i * T + 2, H + 1, 2, 3); R(x, P.bD, i * T + 12, H + 1, 2, 3); }
      R(x, P.bC, 0, 4, W, 1); R(x, P.bD, 0, H + 3, W, 1);
    } else {
      // washed out: leaning posts, loose boards
      for (let i = 0; i < w; i++) { R(x, P.bD, i * T + 3, 8 + (i % 2) * 5, 2, 6); R(x, P.bC, i * T + 3, 8 + (i % 2) * 5, 1, 1); }
      R(x, P.bA, 6, 9, 8, 2); R(x, P.bD, 6, 11, 8, 1);
      R(x, P.bA, W - 14, H - 2, 7, 2); R(x, P.bD, W - 14, H, 7, 1);
      R(x, P.bA, W / 2 - 3, H / 2 + 3, 6, 2); R(x, P.bD, W / 2 - 3, H / 2 + 5, 6, 1);
    }
    return { c, dy: 4 };
  }
  // dir 'h' (default): you cross it walking E–W; 'v': walking N–S (the art
  // is drawn for 'h' and turned a quarter). Pass/drift/stairs are heaps when
  // closed and nothing when open (bare ground / the baked stairs).
  function rot90(c) {
    const [r, x] = canvas(c.height, c.width);
    x.translate(c.height, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0);
    return r;
  }
  function crossing(kind, w, h, open, style, seed, dir) {
    if (kind === 'bridge' || kind === 'boardwalk') {
      const draw = kind === 'bridge' ? bridge : boardwalk;
      if (dir === 'v') {
        const a = draw(h, w, open);                       // drawn as if walked E–W, then turned
        return { c: rot90(a.c), dx: a.c.height - a.dy - w * T, dy: 0 };   // what hung below now hangs left
      }
      return draw(w, h, open);
    }
    if (open) return null;
    return { c: slide(w, h, kind === 'drift' ? 'drift' : (style || 'tan'), seed || 0), dy: 4 };
  }

  // ---------- region scenery ----------
  const SCENERY = {
    // one connected triangle whose sides notch back at each tier; the lit
    // side is the west, the shaded side the east
    pineHalf(y) { const t = y - 2, tier = t % 8; return Math.max(0, Math.floor(t / 3) - (tier < 2 ? 2 : 0)); },
    pine(seed, snow) {
      const [c, x] = canvas(20, 32);
      const half = (y) => Math.min(8, SCENERY.pineHalf(y));
      for (let y = 2; y < 27; y++) R(x, P.tOut, 10 - half(y) - 1, y, half(y) * 2 + 3, 1);
      R(x, P.tOut, 10, 1, 1, 1);
      for (let y = 3; y < 27; y++) {
        const hw = half(y);
        R(x, P.leaf3, 10 - hw, y, hw * 2 + 1, 1);
        R(x, P.gC, 10 - hw, y, Math.max(1, hw - 1), 1);
        if ((y - 2) % 8 === 7) R(x, P.gD, 10 - hw, y, hw * 2 + 1, 1);
        if (snow && (y - 2) % 8 <= 2) R(x, P.nA, 10 - hw, y, hw + 1, 1);
      }
      R(x, P.gB, 9, 4, 1, 1); if (seed % 2) R(x, P.gB, 8, 12, 1, 1);
      R(x, P.tOut, 8, 27, 5, 4); R(x, P.trunk2, 9, 27, 3, 3); R(x, P.trunk, 9, 27, 1, 3);
      R(x, P.gD, 6, 30, 9, 1);
      return c;
    },
    snowpine(seed) { return SCENERY.pine(seed, true); },
    deadtree(seed) {
      const [c, x] = canvas(18, 28);
      const px = (col, ax, ay, w, h) => { R(x, P.tOut, ax - 1, ay - 1, w + 2, h + 2); R(x, col, ax, ay, w, h); };
      px(P.trunk2, 8, 10, 3, 17);
      px(P.trunk2, 4, 6, 5, 2); px(P.trunk2, 3, 2, 2, 5);
      px(P.trunk2, 10, 8, 5, 2); px(P.trunk2, 14, 3, 2, 6);
      px(P.trunk2, 8, 4, 2, 7);
      R(x, P.trunk, 8, 12, 1, 14); R(x, P.trunk, 4, 6, 3, 1);
      if (seed % 2) { R(x, P.tOut, 1, 5, 2, 1); R(x, P.trunk2, 1, 4, 2, 1); }
      R(x, P.tOut, 6, 26, 8, 1);
      return c;
    },
    boulder(seed) {
      const [c, x] = canvas(26, 20);
      heap(x, 26, 20, [[9, 11, 7], [18, 12, 6], [14, 7, 4]], CLIFF[seed % 2 ? 'grey' : 'tan'], 0);
      return c;
    },
    boulder2(seed) { return SCENERY.boulder(seed + 1); },
    spire(seed) {
      const [c, x] = canvas(16, 30);
      const pal = CLIFF.grey;
      for (let y = 2; y < 30; y++) {
        const hw = 1 + Math.floor(((y - 2) / 28) * 6);
        R(x, pal.O, 8 - hw - 1, y, hw * 2 + 3, 1);
      }
      for (let y = 3; y < 29; y++) {
        const hw = 1 + Math.floor(((y - 3) / 27) * 6);
        R(x, pal.C, 8 - hw, y, hw * 2 + 1, 1);
        R(x, pal.B, 8 - hw, y, hw, 1);
        if (y % 5 === 0) R(x, pal.A, 8 - hw, y, 2, 1);
      }
      R(x, pal.D, 3, 27, 10, 2); R(x, pal.O, 2, 29, 12, 1);
      if (seed % 2) R(x, P.nA, 7, 3, 2, 2);
      return c;
    },
    crystal(seed) {
      const [c, x] = canvas(22, 24);
      const spike = (bx, top, w, hue) => {
        const [main, dk, lt] = hue;
        for (let y = top; y < 22; y++) {
          const hw = Math.min(w, Math.floor(((y - top) / (22 - top)) * w) + 1);
          R(x, P.tOut, bx - hw - 1, y, hw * 2 + 3, 1);
        }
        for (let y = top + 1; y < 21; y++) {
          const hw = Math.min(w, Math.floor(((y - top - 1) / (21 - top)) * w) + 1);
          R(x, dk, bx - hw, y, hw * 2 + 1, 1);
          R(x, main, bx - hw, y, hw, 1);
          if ((y - top) % 4 === 1) R(x, lt, bx - hw, y, 1, 1);
        }
      };
      spike(6, 8, 3, [P.quartz, P.quartz2, P.quartz3]);
      spike(15, 3, 4, [P.quartz, P.quartz2, P.quartz3]);
      spike(11, 12, 2, [P.quartz3, P.quartz, P.white]);
      R(x, P.tOut, 2, 21, 18, 2); R(x, P.vC, 3, 21, 16, 1);
      if (seed % 2) R(x, P.white, 15, 5, 1, 1);
      return c;
    },
    scrub(seed) {
      const [c, x] = canvas(18, 12);
      const pal = { A: P.xB, B: P.mE, C: P.xC, D: P.dD, O: P.tOut };
      heap(x, 18, 12, [[6, 7, 4], [12, 6, 4], [9, 4, 3]], pal, 0);
      if (seed % 2) R(x, P.mE, 4, 3, 1, 2);
      return c;
    },
    reeds(seed) {
      const [c, x] = canvas(14, 18);
      for (let i = 0; i < 4; i++) {
        const sx = 2 + i * 3 + (seed + i) % 2, top = 2 + ((seed * 3 + i * 5) % 5);
        R(x, P.tOut, sx - 1, top - 1, 3, 18 - top);
        R(x, P.mE, sx, top, 1, 17 - top);
        R(x, P.bC, sx, top + 1, 1, 3); R(x, P.bB, sx, top + 1, 1, 1);
      }
      R(x, P.mC, 1, 16, 12, 1);
      return c;
    },
    tarpool(seed) {
      const [c, x] = canvas(28, 14);
      const [main, sheen, hi] = [P.tA, P.tB, P.tC];
      for (const [cx, cy, r] of [[10, 7, 6], [19, 7, 6]]) { disc(x, P.tOut, cx, cy + 1, r + 1); }
      for (const [cx, cy, r] of [[10, 7, 6], [19, 7, 6]]) { disc(x, main, cx, cy, r); }
      R(x, sheen, 6, 5, 4, 1); R(x, sheen, 15, 8, 5, 1); R(x, hi, 8, 4, 1, 1);
      if (seed % 2) R(x, hi, 20, 6, 1, 1);
      return c;
    },
  };
  const sceneryCache = new Map();
  function scenery(kind) {
    if (!sceneryCache.has(kind)) {
      const base = kind.replace(/\d+$/, '');
      const seed = parseInt(kind.slice(base.length) || '0', 10);
      if (!SCENERY[base]) throw new Error('unknown scenery ' + kind);
      sceneryCache.set(kind, SCENERY[base](seed));
    }
    return sceneryCache.get(kind);
  }

  // ---------- the bake: rects → grid → canvases ----------
  const FL = { SOLID: 1, WATER: 2, RAMP: 4, WALL: 8, FACE: 16, RIM: 32 };
  const CHUNK = 512;

  function bake(MAP, W, H) {
    const cols = Math.ceil(W / T), rows = Math.ceil(H / T);
    const N = cols * rows;
    const kind = new Uint8Array(N), elev = new Uint8Array(N), flags = new Uint8Array(N);
    const style = new Uint8Array(N), faceH = new Uint8Array(N), ramp = new Uint8Array(N); // ramp: 1=S stairs, 2=W, 3=E
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
    const seedOf = (tx, ty) => (tx * 7 + ty * 13) % 23;
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
        x.drawImage(stairs(fh > 1 && k < fh ? 'top' : 'bot', STYLE_IDS[style[up]], rails, tx + ty), px, py);
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
    T, KINDS, KIND_IDS, CLIFF, STYLE_IDS, FL,
    fill, spill, cliff, slide, stairs, slope, shade, crossing, scenery, heap,
    bake, tileAt, passable, minimap,
  };
})();
