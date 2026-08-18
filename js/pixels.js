// Code-authored pixel sprites for the machine frontier. Deterministic,
// palette-disciplined, no binary assets. Anime-bright: lush greens, clean
// cream-and-teal machines, warm gold light. Global namespace: PIXELS
(function () {
  'use strict';

  // One palette, no strays. brass* keys kept for the bitmap-font callers.
  const P = {
    ink: '#221d29',
    white: '#ffffff',
    // machines: cream bodies, teal panels, steel frames
    cream: '#f2ead6', cream2: '#d9cdb0',
    teal: '#3fa8a0', teal2: '#2f7f7a',
    frame: '#4b4a54', frame2: '#6f6e7a', dark: '#2e2d33', steel: '#b9bec7',
    orange: '#e8834a', red: '#d84f4f', green: '#6cc46c',
    glow: '#ffd27f',
    brass1: '#c99a35', brass2: '#f2c14e', brass3: '#ffe08a',
    // the land — legacy keys (props, vignette, old drawers)
    grass1: '#6cbf5a', grass2: '#5fae4f', grass3: '#86d370', grass4: '#549c46',
    dirt1: '#c2955f', dirt2: '#a87f4d', dirt3: '#8f6a3e',
    water1: '#4ba8d8', water2: '#3b8ec4', water3: '#bfe8f5',
    leaf1: '#3f9147', leaf2: '#5cb457', leaf3: '#2f7038',
    trunk: '#7a5638', trunk2: '#5d4128',
    rock1: '#9aa0ab', rock2: '#7c828e', rock3: '#c6ccd6',
    // terrain kit (tiles.js) — SNES FF3-USA reference, one notch brighter.
    // 5-bit-ish steps; every ground kind is a 3–4 colour ramp + one outline.
    tOut: '#0c1a0c',                                    // terrain outline (green-black)
    gA: '#2c9c3c', gB: '#3cac4c', gC: '#1c7c2c', gD: '#10561c',            // grass
    dA: '#a07848', dB: '#b88c58', dC: '#80603c', dD: '#584028',            // worn dirt
    sA: '#d8c488', sB: '#e8d8a0', sC: '#b8a068',                           // sand
    wA: '#184c60', wB: '#2c7080', wC: '#0c3444', wF: '#a8dce0', wO: '#081c24', // water
    pA: '#98a080', pB: '#b0b898', pC: '#6c7458', pD: '#484c38',            // paved pad (sage cobble)
    rA: '#8c8478', rB: '#a49c8c', rC: '#6c6458', rD: '#484038',            // rock floor / scree
    cA: '#c8a870', cB: '#a08050', cC: '#705838', cD: '#403018', cO: '#181008', // cliff, tan
    kA: '#b0b0b8', kB: '#888890', kC: '#5c5c68', kD: '#343440',            // cliff, grey stone
    vA: '#8880a0', vB: '#5c5878', vC: '#3c3854', vD: '#201c30',            // cliff, violet canyon
    hA: '#6c6480', hB: '#847c98', hC: '#4c4460', hD: '#302c40',            // shale canyon floor
    mA: '#587040', mB: '#6c8450', mC: '#405030', mD: '#2c4c48', mE: '#8ca060', // marsh
    bA: '#8c6840', bB: '#a88050', bC: '#5c4028', bD: '#3c2818',            // boards / planks
    xA: '#b89c68', xB: '#c8b078', xC: '#987c50', xD: '#6c5434',            // cracked earth
    tA: '#141418', tB: '#2c2840', tC: '#403c58',                           // tar
    nA: '#e8f0f8', nB: '#c8d8e8', nC: '#a0b8d0',                           // snow
    iA: '#a0d0e0', iB: '#c0e8f0', iC: '#70a8c0',                           // ice
    fA: '#6c9c6c', fB: '#d8e8dc', fC: '#4c7c50',                           // frost grass
    // ores
    ironore: '#8b93a3', ironore2: '#5f6674',
    copper: '#d8814e', copper2: '#a85c32',
    quartz: '#e59ae0', quartz2: '#c470c9', quartz3: '#f5c9f2',
    stoneore: '#a8a49c', stoneore2: '#6c6864',
    coal: '#303038', coal2: '#181820', coal3: '#585868',
    oil: '#2c2438', oil2: '#141418', oil3: '#5c4c78',
    titan: '#c8d0e0', titan2: '#8890a8', titan3: '#f0f4ff',
    // paper goods
    paper: '#f4ecd8', paper2: '#d8cba8',
    // the operator
    skin: '#f5cfa6', hair: '#6b4a32', suit: '#4a78c8', suit2: '#3a5f9e', hat: '#f2c14e', hat2: '#c99a35',
    petal: '#f5b8d9',
  };

  // deterministic pseudo-random for texture grain
  const dr = (x, y, s) => ((x * 31 + y * 17 + s * 7) % 97) / 97;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    return [c, x];
  }
  const R = (x, c, px, py, w, h) => { x.fillStyle = c; x.fillRect(px, py, w, h); };

  // pixel-perfect filled circle — no anti-aliased arc() anywhere in the world
  function disc(x, color, cx, cy, r) {
    x.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const hw = Math.round(Math.sqrt(r * r - dy * dy));
      x.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
    }
  }

  // ---------- bitmap pixel font: 5px-tall glyphs, ink outline baked ----------
  const GLYPHS = {
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '011', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    '7': ['111', '001', '001', '010', '010'],
    '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'],
    '+': ['000', '010', '111', '010', '000'],
    '-': ['000', '000', '111', '000', '000'],
    '×': ['000', '101', '010', '101', '000'],
    '%': ['11001', '11010', '00100', '01011', '10011'],
    '₽': ['1110', '1010', '1110', '1100', '1000'],
    '→': ['00100', '00010', '11111', '00010', '00100'],
    '✦': ['00100', '01110', '11111', '01110', '00100'],
    '⚙': ['01010', '11111', '11011', '11111', '01010'],
  };

  const textCache = new Map();
  function textCanvas(str, fg) {
    const key = fg + '|' + str;
    if (textCache.has(key)) return textCache.get(key);
    const parts = [];
    let w = 0;
    for (const ch of str) {
      if (ch === ' ') { parts.push(null); w += 3; continue; }
      const g = GLYPHS[ch];
      if (!g) continue;
      parts.push(g);
      w += g[0].length + 1;
    }
    const [c, x] = canvas(Math.max(1, w + 1), 7);
    for (const pass of [0, 1]) {
      let gx = 1;
      for (const g of parts) {
        if (!g) { gx += 3; continue; }
        for (let ry = 0; ry < 5; ry++) for (let cx = 0; cx < g[ry].length; cx++) {
          if (g[ry][cx] !== '1') continue;
          if (pass === 0) {
            for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
              R(x, P.ink, gx + cx + ox, 1 + ry + oy, 1, 1);
            }
          } else {
            R(x, fg, gx + cx, 1 + ry, 1, 1);
          }
        }
        gx += g[0].length + 1;
      }
    }
    textCache.set(key, c);
    return c;
  }

  // ---------- terrain tiles: 16x16 square grid (exported as PIXELS.TILE) ----------
  const TILE = 16;
  function tileGrass(seed) {
    const [c, x] = canvas(TILE, TILE);
    R(x, P.grass1, 0, 0, TILE, TILE);
    for (let i = 0; i < 6; i++) {
      R(x, dr(i, seed, 7) > 0.6 ? P.grass3 : P.grass2,
        Math.floor(dr(i, seed, 3) * TILE), Math.floor(dr(seed, i, 5) * TILE), 1, 1);
    }
    // grass blade tufts
    if (seed % 3 === 0) {
      const bx = 2 + (seed % 11), by = 3 + (seed % 10);
      R(x, P.grass4, bx, by, 1, 2); R(x, P.grass3, bx + 1, by - 1, 1, 2);
    }
    return c;
  }
  function tileDirt(seed) {
    const [c, x] = canvas(TILE, TILE);
    R(x, P.dirt1, 0, 0, TILE, TILE);
    for (let i = 0; i < 5; i++) {
      R(x, dr(i, seed, 11) > 0.5 ? P.dirt2 : P.dirt3,
        Math.floor(dr(i, seed, 13) * (TILE - 1)), Math.floor(dr(seed, i, 17) * (TILE - 1)), 2, 1);
    }
    if (seed % 4 === 1) R(x, P.dirt3, 3 + (seed % 9), 3 + (seed % 9), 1, 1);
    return c;
  }
  function tileWater(frame) {
    const [c, x] = canvas(TILE, TILE);
    R(x, P.water1, 0, 0, TILE, TILE);
    R(x, P.water2, 0, 11, TILE, 5);
    const o = frame === 0 ? 0 : 5;
    R(x, P.water3, 2 + o, 3, 3, 1);
    R(x, P.water3, 9 - o < 0 ? 11 : 9 - o, 8, 2, 1);
    R(x, P.water3, 12, 13, 2, 1);
    return c;
  }
  // shoreline fringe drawn over grass at a water rect's top edge
  function tileShore() {
    const [c, x] = canvas(16, 3);
    R(x, P.water3, 0, 1, 16, 1);
    R(x, P.grass4, 0, 0, 4, 1); R(x, P.grass4, 8, 0, 5, 1);
    return c;
  }

  // ---------- ore node patch 36x16 — one per mine tier ----------
  // [main, dark, light, ground] — ground is the stained soil the ore sits in
  const ORE_LOOK = {
    iron:   [P.ironore, P.ironore2, P.steel, P.dirt2],
    copper: [P.copper, P.copper2, P.steel, P.dirt2],
    stone:  [P.stoneore, P.stoneore2, P.cream2, P.rC],
    quartz: [P.quartz, P.quartz2, P.quartz3, P.vB],
    coal:   [P.coal, P.coal2, P.coal3, P.mC],
    oil:    [P.oil, P.oil2, P.oil3, P.xC],
    titan:  [P.titan, P.titan2, P.titan3, P.kB],
  };
  function nodePatch(kind) {
    const [c, x] = canvas(36, 16);
    const [main, dk, lt, ground] = ORE_LOOK[kind] || ORE_LOOK.iron;
    // soil oval, outlined below (SNES ground objects sit in a shadowed dish)
    for (const [px, py, w, h] of [[4, 5, 28, 8], [8, 3, 20, 12], [2, 7, 32, 5]]) R(x, P.tOut, px, py, w, h);
    for (const [px, py, w, h] of [[4, 4, 28, 8], [8, 2, 20, 12], [2, 6, 32, 5]]) R(x, ground, px, py, w, h);
    const chunks = [[6, 6], [14, 3], [22, 7], [28, 4], [11, 10], [25, 11]];
    for (const [px, py] of chunks) {
      R(x, P.tOut, px - 1, py + 3, 6, 1); R(x, P.tOut, px + 4, py, 1, 3);
      R(x, dk, px, py + 1, 4, 3);
      R(x, main, px, py, 4, 3);
      R(x, lt, px + 1, py, 1, 1);
    }
    return c;
  }

  // ---------- trees, rocks, flowers (SNES town look: lumpy canopy, outline) ----------
  function tree(seed) {
    const [c, x] = canvas(24, 30);
    const blobs = seed % 2
      ? [[12, 12, 8], [6, 15, 5], [18, 14, 5], [11, 7, 5]]
      : [[12, 11, 8], [7, 14, 6], [17, 15, 5], [13, 6, 5]];
    // ground shadow, trunk (outlined), then canopy: outline → dark → mid → light caps
    for (let dy = -2; dy <= 2; dy++) R(x, P.gD, 6 + Math.abs(dy), 27 + dy, 12 - Math.abs(dy) * 2, 1);
    R(x, P.tOut, 9, 18, 6, 11); R(x, P.trunk2, 10, 18, 4, 10); R(x, P.trunk, 10, 18, 1, 9);
    for (const [cx, cy, r] of blobs) disc(x, P.tOut, cx, cy + 1, r + 1);
    for (const [cx, cy, r] of blobs) disc(x, P.gD, cx, cy + 1, r);
    for (const [cx, cy, r] of blobs) disc(x, P.leaf3, cx, cy, r - 1);
    for (const [cx, cy, r] of blobs) disc(x, P.leaf1, cx - 1, cy - 2, Math.max(1, r - 3));
    for (const [cx, cy, r] of blobs) R(x, P.leaf2, cx - 2, cy - r + 1, 2, 1);
    R(x, P.leaf2, 9, 4, 1, 1); R(x, P.leaf2, 6, 11, 1, 1);
    return c;
  }
  function rock(seed) {
    const [c, x] = canvas(16, 12);
    const blobs = seed % 2 ? [[6, 7, 4], [11, 7, 3]] : [[8, 7, 5], [3, 8, 2]];
    for (const [cx, cy, r] of blobs) disc(x, P.tOut, cx, cy + 1, r + 1);
    for (const [cx, cy, r] of blobs) disc(x, P.rock2, cx, cy, r);
    for (const [cx, cy, r] of blobs) disc(x, P.rock1, cx - 1, cy - 1, Math.max(1, r - 1));
    for (const [cx, cy, r] of blobs) R(x, P.rock3, cx - 1, cy - r + 1, 2, 1);
    R(x, P.rock2, 4, 10, 8, 1);
    return c;
  }
  function flower(seed) {
    const [c, x] = canvas(5, 5);
    const col = seed % 2 ? P.white : P.petal;
    R(x, col, 2, 0, 1, 1); R(x, col, 0, 2, 1, 1); R(x, col, 4, 2, 1, 1); R(x, col, 2, 4, 1, 1);
    R(x, P.brass2, 2, 2, 1, 1);
    return c;
  }

  // ---------- mining rig, 26x36, 4 frames ----------
  // tier 1: hand drill rig on a tripod. tier 3: powered mine with a piston.
  function machine(tier, frame) {
    const [c, x] = canvas(26, 36);
    if (tier === 1) {
      // tripod legs
      R(x, P.dark, 5, 22, 2, 12); R(x, P.dark, 19, 22, 2, 12);
      R(x, P.frame, 5, 20, 16, 2);
      // motor box, cream with a teal stripe
      R(x, P.cream, 7, 10, 12, 8); R(x, P.white, 7, 10, 12, 1);
      R(x, P.teal, 7, 15, 12, 2);
      R(x, P.brass2, 8, 12, 1, 1); R(x, P.brass2, 17, 12, 1, 1);
      R(x, P.dark, 10, 12, 6, 2);
      // drill shaft + bit (bobs with the cast cycle)
      const bob = [0, 1, 2, 1][frame];
      R(x, P.frame, 12, 18, 2, 6 + bob);
      const by = 24 + bob;
      R(x, P.frame2, 10, by, 6, 2);
      R(x, frame % 2 ? P.steel : P.frame2, 11, by + 2, 4, 2);
      R(x, P.frame, 12, by + 4, 2, 2);
      // ore chute
      R(x, P.dirt3, 20, 26, 5, 4); R(x, P.ironore, 21, 25, 3, 2);
      // small spoil pile
      R(x, P.dirt2, 2, 32, 6, 2); R(x, P.dirt3, 3, 31, 3, 1);
    } else if (tier === 2) {
      // compact powered rig (transitional; rarely seen)
      R(x, P.frame, 4, 32, 18, 2);
      R(x, P.cream, 6, 14, 14, 18); R(x, P.white, 6, 14, 14, 1);
      R(x, P.teal, 6, 20, 14, 3);
      R(x, [P.orange, P.red][frame % 2], 8, 16, 2, 2);
      R(x, P.frame, 11, 6, 4, 8);
      R(x, P.frame2, 9, 4 + (frame % 2), 8, 2);
    } else {
      // powered mine: cream housing, teal roof, working piston
      R(x, P.frame, 3, 33, 20, 3);
      R(x, P.cream, 4, 12, 18, 21); R(x, P.cream2, 4, 30, 18, 3);
      R(x, P.teal, 3, 10, 20, 3); R(x, P.teal2, 3, 12, 20, 1);
      // piston
      const armY = [2, 5, 8, 5][frame];
      R(x, P.frame2, 9, armY, 8, 2);
      R(x, P.frame, 11, armY + 2, 4, 12 - armY);
      // power lamp
      R(x, [P.orange, P.brass2][frame % 2], 6, 15, 2, 2);
      // teal door with a warm window
      R(x, P.teal2, 9, 24, 8, 9);
      R(x, P.glow, 11, 26, 4, 3);
      // side pipe
      R(x, P.frame2, 22, 18, 3, 2); R(x, P.frame2, 23, 18, 2, 8);
    }
    return c;
  }

  // ---------- production stations 30x30 ----------
  function station(kind) {
    const [c, x] = canvas(30, 30);
    if (kind === 'bigrams') {
      // SMELTER: cream furnace, glowing mouth, chimney
      R(x, P.frame, 2, 28, 26, 2);
      R(x, P.cream, 3, 10, 24, 18); R(x, P.white, 3, 10, 24, 1);
      R(x, P.frame, 20, 2, 5, 9); R(x, P.frame2, 20, 2, 5, 1);
      R(x, P.dark, 7, 15, 12, 10);
      R(x, P.orange, 9, 17, 8, 7); R(x, P.glow, 11, 19, 4, 3);
      R(x, P.ink, 9, 20, 8, 1); R(x, P.ink, 12, 17, 1, 7);
      R(x, P.teal, 3, 11, 3, 12); R(x, P.teal2, 3, 21, 3, 2);
    } else if (kind === 'words') {
      // CONSTRUCTOR: teal cabinet, screen, overhead arm holding a gear
      R(x, P.frame, 2, 28, 26, 2);
      R(x, P.teal, 3, 12, 24, 16); R(x, P.teal2, 3, 26, 24, 2);
      R(x, P.cream, 3, 8, 24, 5); R(x, P.white, 3, 8, 24, 1);
      R(x, P.dark, 5, 9, 9, 3); R(x, P.brass2, 7, 10, 2, 1); R(x, P.green, 11, 10, 1, 1);
      R(x, P.frame, 16, 1, 2, 8); R(x, P.frame, 16, 1, 9, 2);
      R(x, P.frame2, 23, 3, 2, 3);
      R(x, P.frame2, 21, 6, 3, 3); R(x, P.brass2, 22, 7, 1, 1);
      R(x, P.glow, 8, 17, 6, 4); R(x, P.dark, 9, 18, 4, 2);
    } else {
      // ASSEMBLER: wide body, two arms, intake rollers
      R(x, P.frame, 1, 28, 28, 2);
      R(x, P.cream, 2, 12, 26, 14); R(x, P.white, 2, 12, 26, 1);
      R(x, P.teal, 2, 18, 26, 3);
      R(x, P.frame, 6, 4, 2, 9); R(x, P.frame, 22, 4, 2, 9);
      R(x, P.frame2, 4, 3, 6, 2); R(x, P.frame2, 20, 3, 6, 2);
      R(x, P.brass2, 5, 14, 2, 2); R(x, P.green, 9, 14, 2, 2); R(x, P.brass2, 13, 14, 2, 2);
      R(x, P.dark, 3, 26, 24, 2);
      R(x, P.frame2, 5, 26, 2, 2); R(x, P.frame2, 11, 26, 2, 2); R(x, P.frame2, 17, 26, 2, 2); R(x, P.frame2, 23, 26, 2, 2);
    }
    return c;
  }

  // ---------- freight depot 44x36, 4 frames (crane hook cycles) ----------
  function press(frame) {
    const [c, x] = canvas(44, 36);
    // platform
    R(x, P.frame, 2, 30, 40, 6); R(x, P.frame2, 2, 30, 40, 1);
    // canopy on posts
    R(x, P.teal, 2, 2, 28, 4); R(x, P.teal2, 2, 5, 28, 1);
    R(x, P.frame, 4, 6, 2, 24); R(x, P.frame, 26, 6, 2, 24);
    // crate stack
    R(x, P.trunk, 6, 22, 10, 8); R(x, P.trunk2, 6, 26, 10, 1);
    R(x, P.trunk, 8, 15, 8, 7); R(x, P.brass1, 9, 17, 6, 1);
    // crane tower + moving hook
    R(x, P.frame, 34, 4, 3, 26); R(x, P.frame2, 34, 4, 3, 1);
    R(x, P.frame2, 20, 6, 16, 2);
    const hy = [14, 17, 20, 17][frame];
    R(x, P.dark, 27, 8, 1, hy - 8);
    R(x, P.trunk, 24, hy, 7, 5); R(x, P.brass1, 25, hy + 2, 5, 1);
    // signal lamp
    R(x, P.frame, 40, 8, 3, 7);
    R(x, frame % 2 ? P.green : P.red, 41, 9, 1, 2);
    return c;
  }

  // ---------- the Hub 26x36: roofed contract board ----------
  function noticeBoard(hasWork) {
    const [c, x] = canvas(26, 36);
    R(x, P.trunk2, 4, 20, 3, 16); R(x, P.trunk2, 19, 20, 3, 16);
    R(x, P.teal, 1, 5, 24, 3); R(x, P.teal2, 1, 8, 24, 1);
    R(x, P.trunk, 2, 9, 22, 14); R(x, P.trunk2, 2, 21, 22, 2);
    // pinned contracts
    R(x, P.paper, 4, 11, 7, 8); R(x, P.paper2, 5, 13, 5, 1); R(x, P.paper2, 5, 15, 5, 1);
    R(x, P.paper2, 13, 11, 8, 6); R(x, P.paper, 14, 13, 6, 1);
    R(x, P.paper, 14, 18, 7, 4);
    R(x, P.red, 6, 11, 1, 1); R(x, P.red, 16, 11, 1, 1); R(x, P.red, 17, 18, 1, 1);
    if (hasWork) R(x, P.brass3, 4, 12, 6, 4);
    return c;
  }

  // ---------- the operator: chibi frontier engineer, 14x24 ----------
  // dir: 'down' | 'up' | 'side' (side faces right; mirror for left).
  // 4 walk frames: neutral, step-left, neutral, step-right. work(): 2 frames.
  function headDown(x) {
    R(x, P.hat, 3, 0, 8, 4); R(x, P.white, 4, 1, 2, 1);
    R(x, P.hat2, 2, 4, 10, 1);
    R(x, P.skin, 3, 5, 8, 5);
    R(x, P.hair, 3, 5, 2, 1); R(x, P.hair, 9, 5, 2, 1);
    // big anime eyes with a shine pixel
    R(x, P.ink, 4, 6, 2, 2); R(x, P.white, 4, 6, 1, 1);
    R(x, P.ink, 8, 6, 2, 2); R(x, P.white, 8, 6, 1, 1);
  }
  function headUp(x) {
    R(x, P.hat, 3, 0, 8, 4); R(x, P.hat2, 2, 4, 10, 1);
    R(x, P.hair, 3, 5, 8, 4);
  }
  function bodyFront(x) {
    R(x, P.suit, 3, 10, 8, 6);
    R(x, P.dark, 3, 14, 8, 1);
    R(x, P.brass2, 6, 11, 2, 2);
  }
  function armsIdle(x) {
    R(x, P.suit, 1, 10, 2, 4); R(x, P.skin, 1, 14, 2, 2);
    R(x, P.suit, 11, 10, 2, 4); R(x, P.skin, 11, 14, 2, 2);
  }
  function legsFront(x, frame) {
    const liftL = frame === 1, liftR = frame === 3;
    R(x, P.suit2, 4, 16, 2, liftL ? 5 : 6);
    R(x, P.suit2, 8, 16, 2, liftR ? 5 : 6);
    R(x, P.trunk, 3, liftL ? 21 : 22, 3, 2);
    R(x, P.trunk, 8, liftR ? 21 : 22, 3, 2);
  }
  function legsSide(x, frame) {
    const L = [[4, 8], [2, 9], [4, 8], [5, 7]][frame];
    const F = [[3, 8], [1, 9], [3, 8], [4, 7]][frame];
    R(x, P.suit2, L[0], 16, 2, 6); R(x, P.suit2, L[1], 16, 2, 6);
    R(x, P.trunk, F[0], 22, 3, 2); R(x, P.trunk, F[1], 22, 3, 2);
  }
  function character(dir, frame) {
    const [c, x] = canvas(14, 24);
    if (dir === 'side') {
      R(x, P.hat, 3, 0, 8, 4); R(x, P.white, 4, 1, 2, 1);
      R(x, P.hat2, 3, 4, 10, 1);
      R(x, P.skin, 4, 5, 7, 5); R(x, P.hair, 4, 5, 2, 2);
      R(x, P.ink, 8, 6, 2, 2); R(x, P.white, 8, 6, 1, 1);
      bodyFront(x);
      const sw = frame === 1 ? -1 : frame === 3 ? 1 : 0;
      R(x, P.suit, 1, 10, 2, 4); R(x, P.skin, 1, 14 + sw, 2, 2);
      R(x, P.suit, 11, 10, 2, 4); R(x, P.skin, 11, 14 - sw, 2, 2);
      legsSide(x, frame);
    } else if (dir === 'up') {
      headUp(x);
      R(x, P.suit, 3, 10, 8, 6); R(x, P.dark, 3, 14, 8, 1);
      armsIdle(x);
      legsFront(x, frame);
    } else {
      headDown(x);
      bodyFront(x);
      armsIdle(x);
      legsFront(x, frame);
    }
    return c;
  }
  function characterWork(frame) {
    const [c, x] = canvas(14, 24);
    headUp(x);
    R(x, P.suit, 3, 10, 8, 6); R(x, P.dark, 3, 14, 8, 1);
    const lY = frame === 0 ? 6 : 7, rY = frame === 0 ? 7 : 6;
    R(x, P.suit, 1, 9, 2, 3); R(x, P.skin, 1, lY, 2, 2);
    R(x, P.suit, 11, 9, 2, 3); R(x, P.skin, 11, rY, 2, 2);
    legsFront(x, 0);
    return c;
  }

  // ---------- belt segment 12x8, 4 frames (rolling) ----------
  function belt(frame) {
    const [c, x] = canvas(12, 8);
    R(x, P.frame, 0, 2, 12, 4);
    R(x, P.frame2, 0, 2, 12, 1);
    R(x, P.teal, 1 + frame * 3, 3, 2, 2);
    R(x, P.frame, 2, 6, 2, 2); R(x, P.frame, 8, 6, 2, 2);
    return c;
  }

  // material dot 4x4 (things riding belts / popping out of machines)
  function matDot() {
    const [c, x] = canvas(4, 4);
    R(x, P.brass1, 0, 1, 4, 2); R(x, P.brass2, 0, 1, 4, 1);
    return c;
  }

  function spark() {
    const [c, x] = canvas(2, 2);
    R(x, P.white, 0, 0, 2, 2);
    return c;
  }

  // shipping slips fluttering off the depot, 2 tumble frames
  function paperScrap(frame) {
    if (frame === 0) {
      const [c, x] = canvas(5, 3);
      R(x, P.paper, 0, 0, 5, 2); R(x, P.paper2, 0, 2, 5, 1);
      return c;
    }
    const [c, x] = canvas(3, 5);
    R(x, P.paper, 0, 0, 2, 5); R(x, P.paper2, 2, 0, 1, 5);
    return c;
  }

  // drifting petal 3x3, 2 flutter frames
  function petal(frame) {
    const [c, x] = canvas(3, 3);
    if (frame === 0) { R(x, P.petal, 0, 0, 2, 2); R(x, P.white, 0, 0, 1, 1); }
    else { R(x, P.petal, 1, 0, 1, 3); R(x, P.white, 1, 0, 1, 1); }
    return c;
  }

  // warm halo for lampposts and windows, additive
  function glowHalo() {
    const [c, x] = canvas(28, 28);
    const steps = [[13, 0.05], [9, 0.07], [5, 0.1]];
    for (const [r, a] of steps) {
      x.fillStyle = `rgba(255, 210, 127, ${a})`;
      for (let dy = -r; dy <= r; dy++) {
        const hw = Math.round(Math.sqrt(r * r - dy * dy));
        x.fillRect(14 - hw, 14 + dy, hw * 2 + 1, 1);
      }
    }
    return c;
  }

  // ---------- props (walk-through set dressing) ----------
  function propLamppost() {
    const [c, x] = canvas(8, 26);
    R(x, P.frame, 3, 6, 2, 18);
    R(x, P.frame2, 2, 24, 4, 2);
    R(x, P.frame, 1, 0, 6, 7); R(x, P.frame2, 1, 0, 6, 1);
    R(x, P.glow, 2, 1, 4, 5);
    return c;
  }
  function propCrate(seed) {
    const [c, x] = canvas(14, 12);
    R(x, P.trunk, 0, 0, 14, 12);
    R(x, P.trunk2, 0, 11, 14, 1); R(x, P.trunk2, 0, 0, 1, 12); R(x, P.trunk2, 13, 0, 1, 12);
    R(x, '#8f6a44', 1, 0, 12, 1);
    for (let i = 0; i < 5; i++) R(x, P.trunk2, 2 + i * 2, 9 - i * 2, 2, 2);
    if (seed % 2) R(x, P.paper2, 4, 4, 3, 2);
    return c;
  }
  function propDrum() {
    const [c, x] = canvas(10, 13);
    R(x, P.teal, 1, 1, 8, 12); R(x, P.teal2, 1, 10, 8, 3);
    R(x, P.frame2, 1, 3, 8, 1); R(x, P.frame2, 1, 8, 8, 1);
    R(x, P.frame, 2, 0, 6, 2); R(x, P.steel, 3, 0, 2, 1);
    return c;
  }
  function propBush() {
    const [c, x] = canvas(14, 10);
    disc(x, P.leaf3, 7, 6, 5);
    disc(x, P.leaf2, 6, 5, 4);
    R(x, P.grass3, 4, 3, 1, 1);
    R(x, P.red, 9, 5, 1, 1); R(x, P.red, 5, 7, 1, 1);
    return c;
  }
  function propSign() {
    const [c, x] = canvas(12, 14);
    R(x, P.trunk2, 5, 4, 2, 10);
    R(x, P.cream, 1, 0, 10, 6); R(x, P.cream2, 1, 5, 10, 1);
    R(x, P.brass1, 3, 2, 4, 1); R(x, P.brass1, 6, 1, 1, 3);
    return c;
  }
  const PROP_DRAW = {
    lamppost: propLamppost, crate: () => propCrate(0), crate2: () => propCrate(1),
    drum: propDrum, bush: propBush, sign: propSign,
  };

  // ---------- buildable plot marker 30x14: bold survey outline ----------
  // Bright: translucent gold fill, thick dashes, red-and-white corner stakes.
  function plotMarker() {
    const [c, x] = canvas(30, 14);
    x.fillStyle = 'rgba(242, 193, 78, 0.25)';
    x.fillRect(1, 1, 28, 12);
    for (let i = 3; i < 27; i += 6) { R(x, P.brass2, i, 0, 4, 2); R(x, P.brass2, i, 12, 4, 2); }
    for (let i = 4; i < 10; i += 5) { R(x, P.brass2, 0, i, 2, 4); R(x, P.brass2, 28, i, 2, 4); }
    for (const [sx, sy] of [[0, 0], [27, 0], [0, 11], [27, 11]]) {
      R(x, P.white, sx, sy, 3, 3); R(x, P.red, sx, sy, 3, 1);
    }
    R(x, P.brass3, 13, 6, 5, 1); R(x, P.brass3, 15, 4, 1, 5);
    return c;
  }

  const SCENERY_DRAW = { tree: () => tree(0), tree2: () => tree(1), rock: () => rock(0), rock2: () => rock(1) };

  // ---------- material icons 12x12 (side-panel inventory) ----------
  function matIcon(kind) {
    const [c, x] = canvas(12, 12);
    const oreIcon = (main, dk, lt) => {
      R(x, dk, 2, 6, 5, 4); R(x, main, 2, 5, 5, 4); R(x, lt, 3, 5, 1, 1);
      R(x, dk, 7, 4, 4, 4); R(x, main, 7, 3, 4, 4); R(x, lt, 8, 3, 1, 1);
      R(x, dk, 5, 9, 4, 2); R(x, main, 5, 8, 4, 2);
    };
    if (kind === 'money') {
      disc(x, P.brass2, 6, 6, 5);
      R(x, P.brass3, 3, 3, 3, 1); R(x, P.brass1, 5, 5, 2, 4);
    } else if (kind === 'az') {
      oreIcon(P.ironore, P.ironore2, P.steel);
    } else if (kind === 'buki') {
      oreIcon(P.copper, P.copper2, P.brass3);
    } else if (kind === 'vedi') {
      // quartz crystal spikes
      R(x, P.quartz2, 3, 4, 3, 7); R(x, P.quartz, 3, 3, 2, 7); R(x, P.quartz3, 3, 3, 1, 2);
      R(x, P.quartz2, 7, 2, 3, 9); R(x, P.quartz, 7, 1, 2, 9); R(x, P.quartz3, 7, 1, 1, 3);
      R(x, P.rock2, 2, 10, 9, 2);
    } else if (kind === 'slogi') {
      // ingot stack
      R(x, P.frame2, 1, 7, 6, 3); R(x, P.steel, 1, 7, 6, 1);
      R(x, P.frame2, 6, 7, 5, 3); R(x, P.steel, 6, 7, 5, 1);
      R(x, P.frame2, 3, 3, 6, 3); R(x, P.steel, 3, 3, 6, 1);
    } else if (kind === 'slova') {
      // gear
      R(x, P.frame2, 5, 1, 2, 10); R(x, P.frame2, 1, 5, 10, 2);
      disc(x, P.frame2, 6, 6, 3);
      disc(x, P.steel, 6, 6, 2);
      R(x, P.dark, 5, 5, 2, 2);
    } else if (kind === 'stroki') {
      // circuit module
      R(x, P.teal2, 1, 2, 10, 8); R(x, P.teal, 1, 2, 10, 1);
      R(x, P.brass2, 3, 4, 2, 2); R(x, P.brass2, 7, 4, 2, 2);
      R(x, P.green, 3, 7, 6, 1);
      R(x, P.brass1, 2, 10, 1, 2); R(x, P.brass1, 5, 10, 1, 2); R(x, P.brass1, 8, 10, 1, 2);
    } else { // listy — sealed cargo crate
      R(x, P.trunk, 1, 2, 10, 9); R(x, '#8f6a44', 1, 2, 10, 1);
      R(x, P.trunk2, 1, 10, 10, 1);
      R(x, P.brass1, 1, 5, 10, 2);
      R(x, P.paper2, 7, 3, 3, 2);
    }
    return c;
  }

  // little welcome-card scene: the operator by the depot on grass
  function vignette() {
    const [c, x] = canvas(100, 48);
    for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 7; tx++) {
      x.drawImage(tileGrass((tx * 7 + ty * 13) % 23), tx * TILE, ty * TILE);
    }
    x.drawImage(flower(1), 10, 14); x.drawImage(flower(2), 84, 10);
    x.drawImage(tree(0), 2, 16);
    x.drawImage(propCrate(1), 80, 32);
    x.drawImage(press(1), 44, 6);
    x.drawImage(character('side', 0), 26, 20);
    return c;
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

  window.PIXELS = {
    P,
    TILE,
    // drawing primitives shared with tiles.js (the terrain kit)
    util: { canvas, R, disc, dr, tex, cachedTex },
    grassTex: (s) => tex(tileGrass(s)),
    dirtTex: (s) => tex(tileDirt(s)),
    waterTex: (f) => cachedTex('water:' + f, () => tileWater(f)),
    shoreTex: () => cachedTex('shore', tileShore),
    nodeTex: (kind) => cachedTex('node:' + kind, () => nodePatch(kind)),
    flowerTex: (s) => cachedTex('flower:' + (s % 4), () => flower(s)),
    machineTex: (tier, frame) => tex(machine(tier, frame)),
    stationTex: (kind) => tex(station(kind)),
    characterTex: (dir, frame) => cachedTex('ch:' + dir + frame, () => character(dir, frame)),
    characterWorkTex: (frame) => cachedTex('chw:' + frame, () => characterWork(frame)),
    beltTex: (frame) => tex(belt(frame)),
    matDotTex: () => tex(matDot()),
    sparkTex: () => cachedTex('spark', spark),
    paperScrapTex: (frame) => cachedTex('scrap:' + frame, () => paperScrap(frame)),
    petalTex: (frame) => cachedTex('petal:' + frame, () => petal(frame)),
    glowHaloTex: () => cachedTex('halo', glowHalo),
    propTex: (kind) => cachedTex('prop:' + kind, PROP_DRAW[kind]),
    plotTex: () => cachedTex('plot', plotMarker),
    // scenery: the meadow set lives here; region sets (pine, boulder, reeds…) in tiles.js
    sceneryTex: (kind) => cachedTex('scenery:' + kind,
      SCENERY_DRAW[kind] || (() => window.TILES.scenery(kind))),
    boardTex: (hasWork) => cachedTex('board:' + !!hasWork, () => noticeBoard(hasWork)),
    textTex: (str, fg) => cachedTex('t:' + fg + '|' + str, () => textCanvas(str, fg)),
    matIconURL: (kind) => matIcon(kind).toDataURL(),
    // raw canvases for the dev proof page (dev/tiles.html) — no PIXI needed
    nodeCanvas: nodePatch,
    sceneryCanvas: (kind) => SCENERY_DRAW[kind] ? SCENERY_DRAW[kind]() : window.TILES.scenery(kind),
    machineCanvas: machine, stationCanvas: station, characterCanvas: character,
    matIconTex: (kind) => tex(matIcon(kind)),
    pressTex: (frame) => tex(press(frame)),
    vignetteURL: () => vignette().toDataURL(),
  };
})();
