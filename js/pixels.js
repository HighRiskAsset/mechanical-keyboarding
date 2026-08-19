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
    // the operator (SNES-style: 3 tones per material + one dark outline)
    skin: '#f5cfa6', skin2: '#d9a878', hair: '#6b4a32', hair2: '#8c6a48',
    suit: '#4a78c8', suit2: '#3a5f9e', suit3: '#6a98e0', hat: '#f2c14e', hat2: '#c99a35',
    iris: '#5a9ce0', eye: '#1a2440', boot: '#4a3220', boot2: '#2c1c10',
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
    '↓': ['00100', '00100', '10101', '01110', '00100'],
    '✦': ['00100', '01110', '11111', '01110', '00100'],
    '⚙': ['01010', '11111', '11011', '11111', '01010'],
    'M': ['10001', '11011', '10101', '10001', '10001'],
    'K': ['1001', '1010', '1100', '1010', '1001'],
    '✓': ['00001', '00010', '10100', '01000', '00000'],
    '✗': ['101', '010', '101', '000', '000'],
    '⇧': ['00100', '01110', '11111', '01110', '01110'],
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
    } else if (kind === 'foundry') {
      // FOUNDRY: squat cream crucible house, two short stacks, a tilted ladle
      R(x, P.frame, 2, 28, 26, 2);
      R(x, P.cream, 3, 12, 24, 16); R(x, P.white, 3, 12, 24, 1);
      R(x, P.frame, 6, 3, 4, 10); R(x, P.frame2, 6, 3, 4, 1);
      R(x, P.frame, 20, 5, 4, 8); R(x, P.frame2, 20, 5, 4, 1);
      R(x, P.teal, 3, 22, 24, 3); R(x, P.teal2, 3, 25, 24, 1);
      R(x, P.dark, 10, 15, 10, 7);
      R(x, P.orange, 11, 16, 8, 5); R(x, P.glow, 13, 17, 4, 2);
      R(x, P.frame2, 12, 9, 8, 3); R(x, P.steel, 13, 9, 6, 1);
      R(x, P.brass2, 5, 14, 2, 1); R(x, P.brass2, 23, 14, 2, 1);
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

  // ---------- the operator: frontier engineer, 16x25 (SNES FF3 idiom) ----------
  // Hand-authored pixel grids: a big outlined head under a hard hat, 2x2
  // eyes (highlight over dark), three tones per material, cream shirt under
  // blue overalls, tool belt, boots, a small pack on the back. dir: 'down' |
  // 'up' | 'side' (side faces RIGHT; factory mirrors for left). Four walk
  // frames: stand, stride, stand, stride — the body rises one pixel on the
  // strides (the canvas keeps a spare top row for it). work(): four frames at
  // the machine, back view, hands working.
  const OP = {
    '.': null, o: () => P.ink,
    H: () => P.hat, h: () => P.hat2, L: () => P.brass3,
    S: () => P.skin, s: () => P.skin2, A: () => P.hair, a: () => P.hair2,
    W: () => P.white, I: () => P.iris, E: () => P.eye,
    B: () => P.suit, b: () => P.suit2, l: () => P.suit3, C: () => P.cream, c: () => P.cream2,
    G: () => P.brass2, T: () => P.trunk, t: () => P.trunk2, K: () => P.boot, k: () => P.boot2,
  };
  const grid = (x, rows, ox, oy) => {
    rows.forEach((row, ry) => {
      for (let cx = 0; cx < row.length; cx++) {
        const f = OP[row[cx]];
        if (f) R(x, f(), ox + cx, oy + ry, 1, 1);
      }
    });
  };
  const mirror = (rows) => rows.map((r) => r.split('').reverse().join(''));

  const HEAD_D = [
    '......oooo......',
    '....ooLLLHoo....',
    '...oLLLHHHHHo...',
    '..oLLHHHHHHHHo..',
    '..oLHHHHHHHHho..',
    '.oHHHHHHHHHHHho.',
    '.ohhhhhhhhhhhho.',
    '..oAAASSSSAAAo..',
    '..oASSSSSSSsAo..',
    '..oSSWISSWISso..',
    '..oSSEESSEESso..',
    '...oSSSSsSSso...',
  ];
  const HEAD_U = [
    '......oooo......',
    '....ooLLLHoo....',
    '...oLLLHHHHHo...',
    '..oLLHHHHHHHHo..',
    '..oLHHHHHHHHho..',
    '.oHHHHHHHHHHHho.',
    '.ohhhhhhhhhhhho.',
    '..oAAAAAAAAAAo..',
    '..oAaAAAAAAaAo..',
    '..oAAAAAAAAAAo..',
    '...oAAAAAAAAo...',
    '....oSSSSSSo....',
  ];
  const HEAD_S = [
    '......oooo......',
    '....ooLLHHoo....',
    '...oLLHHHHHHo...',
    '..oLLHHHHHHHHo..',
    '..oLHHHHHHHHHo..',
    '..oHHHHHHHHHHHo.',
    '..ohhhhhhhhhhho.',
    '...oAAAASSSSSo..',
    '...oAAASSSSSSo..',
    '...oAAASSSWISo..',
    '...oAAASSSEESo..',
    '....oAASSSSSo...',
  ];
  const TORSO_D = [
    '....oCCBBCCo....',
    '...oCCBBBBCCo...',
    '..oCCcBGBBcCCo..',
    '..oSoBBBBBboSo..',
    '...ooBBBBBboo...',
    '...oTTTGGTTTo...',
  ];
  const TORSO_U = [
    '....oCCBBCCo....',
    '...oCCBBBBCCo...',
    '..oCCcTTTTcCCo..',
    '..oSoBTtTtBoSo..',
    '...ooBTTTTBoo...',
    '...oTTTTTTTTo...',
  ];
  const TORSO_S = [
    '.....oCBBBCo....',
    '....oCCBBBBCo...',
    '....oCcBBoCCo...',
    '....oCBBBBoSo...',
    '.....oBBBBoo....',
    '.....oTTGTTo....',
  ];
  const TORSO_S_FWD = [
    '.....oCBBBCo....',
    '....oCCBBBBCo...',
    '....oCcBBBoCCo..',
    '....oCBBBBBoSo..',
    '.....oBBBBoo....',
    '.....oTTGTTo....',
  ];
  const TORSO_S_BACK = [
    '.....oCBBBCo....',
    '....oCCBBBBCo...',
    '...oCoBBBBBo....',
    '...oSoBBBBBo....',
    '.....oBBBBoo....',
    '.....oTTGTTo....',
  ];
  const LEGS_D = [
    '...obbBBBBbbo...',
    '...obbBooBbbo...',
    '...obbBooBbbo...',
    '...oKKKooKKKo...',
    '...oKkKooKkKo...',
    '....ooo..ooo....',
  ];
  const LEGS_D_STEP = [           // right leg forward (lower), left tucked up — a real scissor
    '...obbBBBBbbo...',
    '...obbBooBbbo...',
    '...oKKKooBbbo...',
    '...oKkKooBbbo...',
    '....ooo.oKKKo...',
    '........oKkKo...',
    '.........ooo....',
  ];
  const LEGS_S = [
    '.....obBBBo.....',
    '.....obBoBo.....',
    '.....obBoBo.....',
    '.....oKKoKKo....',
    '....oKkKoKkKo...',
    '.....ooo.ooo....',
  ];
  const LEGS_S_STEP = [           // front leg forward (right), back leg back — a modest stride
    '.....obBBBo.....',
    '....obBBoBBo....',
    '....obBo.oBBo...',
    '...oKKKo.oKKo...',
    '...oKkKo.oKkKo..',
    '....ooo...ooo...',
    '................',
  ];
  const TORSO_WORK = [            // back view, arms raised to the machine (hands added per frame)
    '....oCCBBCCo....',
    '..o.oCBBBBCo.o..',
    '..oCoCTTTTCoCo..',
    '...oCBTtTtBCo...',
    '...ooBTTTTBoo...',
    '...oTTTTTTTTo...',
  ];

  function character(dir, frame) {
    const [c, x] = canvas(16, 25);
    const stride = frame === 1 || frame === 3;
    const oy = stride ? 0 : 1;             // the body rises a pixel on the strides
    if (dir === 'side') {
      grid(x, HEAD_S, 0, oy);
      grid(x, frame === 1 ? TORSO_S_FWD : frame === 3 ? TORSO_S_BACK : TORSO_S, 0, oy + 12);
      grid(x, stride ? (frame === 1 ? LEGS_S_STEP : mirror(LEGS_S_STEP)) : LEGS_S, 0, oy + 18);
    } else {
      grid(x, dir === 'up' ? HEAD_U : HEAD_D, 0, oy);
      grid(x, dir === 'up' ? TORSO_U : TORSO_D, 0, oy + 12);
      grid(x, stride ? (frame === 1 ? LEGS_D_STEP : mirror(LEGS_D_STEP)) : LEGS_D, 0, oy + 18);
    }
    return c;
  }
  // working at a machine: back view, arms up, hands tapping in alternation
  function characterWork(frame) {
    const [c, x] = canvas(16, 25);
    grid(x, TORSO_WORK, 0, 13);
    grid(x, LEGS_D, 0, 19);
    grid(x, HEAD_U, 0, 1 + (frame % 2));   // a nod on the off-beats
    const lift = [0, 1, 0, -1][frame % 4];
    const hand = (hx, hy) => { R(x, P.ink, hx - 1, hy - 1, 3, 3); R(x, P.skin, hx, hy, 1, 1); R(x, P.skin, hx, hy + 1, 1, 1); };
    hand(3, 13 - lift); hand(12, 13 + lift);
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

  // ---------- belt / pipe tiles 16x16 (phase 3): one tile per path step ----------
  // A belt: dark bed, steel rails, three pale treads rolling along its axis.
  // A pipe: a grey tube with a seam and a glinting flow dash. dir 'h' | 'v'.
  function beltTile(frame, dir, pipe) {
    const [c, x] = canvas(TILE, TILE);
    const horiz = dir === 'h';
    if (pipe) {
      if (horiz) { R(x, P.frame, 0, 4, 16, 8); R(x, P.frame2, 0, 5, 16, 1); R(x, P.dark, 0, 10, 16, 1); R(x, P.oil3, 0, 7, 16, 1); }
      else { R(x, P.frame, 4, 0, 8, 16); R(x, P.frame2, 5, 0, 1, 16); R(x, P.dark, 10, 0, 1, 16); R(x, P.oil3, 7, 0, 1, 16); }
      const o = (frame * 4) % 16;
      if (horiz) R(x, P.steel, o, 7, 3, 1); else R(x, P.steel, 7, o, 1, 3);
      return c;
    }
    if (horiz) {
      R(x, P.dark, 0, 3, 16, 10); R(x, P.frame2, 0, 3, 16, 1); R(x, P.frame2, 0, 12, 16, 1);
      for (let k = 0; k < 4; k++) { const o = (k * 4 + frame) % 16; R(x, P.steel, o, 5, 2, 6); }
    } else {
      R(x, P.dark, 3, 0, 10, 16); R(x, P.frame2, 3, 0, 1, 16); R(x, P.frame2, 12, 0, 1, 16);
      for (let k = 0; k < 4; k++) { const o = (k * 4 + frame) % 16; R(x, P.steel, 5, o, 6, 2); }
    }
    return c;
  }
  // a white 4x4 item dot — tinted per material by the renderer
  function itemDot() {
    const [c, x] = canvas(4, 4);
    R(x, P.ink, 0, 0, 4, 4); R(x, P.white, 1, 1, 2, 2); R(x, P.white, 0, 1, 1, 2); R(x, P.white, 1, 0, 2, 1); R(x, P.white, 3, 1, 1, 2); R(x, P.white, 1, 3, 2, 1);
    return c;
  }
  // a belt spool carried on the operator's back, 8x8
  function spool() {
    const [c, x] = canvas(8, 8);
    disc(x, P.ink, 4, 4, 3); disc(x, P.frame2, 4, 4, 2); R(x, P.steel, 3, 2, 2, 1); R(x, P.dark, 3, 4, 2, 1);
    return c;
  }
  // a machine's state dot 5x5: running (green) / starved (red) / full (gold)
  function stateDot(kind) {
    const [c, x] = canvas(5, 5);
    const col = kind === 'run' ? P.green : kind === 'starved' ? P.red : P.brass2;
    disc(x, P.ink, 2, 2, 2); disc(x, col, 2, 2, 1);
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

  // ---------- material icons 12x12 (HUD, menus, rows) ----------
  // Ore colours by material id (chain ore ids). Alloys are ore-colour stacks
  // — two- or three-tone ingots — so they read as combinations.
  const ORE_TONE = {
    az: [P.ironore, P.ironore2, P.steel],
    buki: [P.copper, P.copper2, P.brass3],
    stone: [P.stoneore, P.stoneore2, P.cream2],
    vedi: [P.quartz, P.quartz2, P.quartz3],
    coal: [P.coal3, P.coal2, P.coal],
    oil: [P.oil3, P.oil2, P.oil],
  };
  function matIcon(kind) {
    const [c, x] = canvas(12, 12);
    const spec = (window.CHAIN && window.CHAIN.MATS && window.CHAIN.MATS[kind]) || null;
    const form = spec ? spec.form : (kind === 'money' ? 'money' : 'legacy');
    const oreIcon = (main, dk, lt) => {
      R(x, dk, 2, 6, 5, 4); R(x, main, 2, 5, 5, 4); R(x, lt, 3, 5, 1, 1);
      R(x, dk, 7, 4, 4, 4); R(x, main, 7, 3, 4, 4); R(x, lt, 8, 3, 1, 1);
      R(x, dk, 5, 9, 4, 2); R(x, main, 5, 8, 4, 2);
    };
    if (form === 'money') {
      disc(x, P.brass2, 6, 6, 5);
      R(x, P.brass3, 3, 3, 3, 1); R(x, P.brass1, 5, 5, 2, 4);
    } else if (form === 'ore') {
      const t = ORE_TONE[kind] || ORE_TONE.az;
      if (kind === 'vedi') {
        R(x, P.quartz2, 3, 4, 3, 7); R(x, P.quartz, 3, 3, 2, 7); R(x, P.quartz3, 3, 3, 1, 2);
        R(x, P.quartz2, 7, 2, 3, 9); R(x, P.quartz, 7, 1, 2, 9); R(x, P.quartz3, 7, 1, 1, 3);
        R(x, P.rock2, 2, 10, 9, 2);
      } else if (kind === 'oil') {
        R(x, P.frame, 3, 2, 6, 9); R(x, P.frame2, 3, 2, 6, 1);
        R(x, P.oil, 4, 4, 4, 6); R(x, P.oil3, 4, 4, 1, 3);
        R(x, P.frame2, 5, 0, 2, 2);
      } else {
        oreIcon(t[0], t[1], t[2]);
      }
    } else if (form === 'ingot' || form === 'ingot3') {
      // stacked ingots, one tone per ore in the alloy
      const tones = spec.ores.map((o) => ORE_TONE[o] || ORE_TONE.az);
      const bars = form === 'ingot3'
        ? [[1, 7, 5], [6, 7, 5], [3, 3, 6]]
        : [[1, 7, 6], [6, 7, 5], [3, 3, 6]];
      bars.forEach(([bx, by, bw], i) => {
        const t = tones[Math.min(i, tones.length - 1)];
        R(x, t[1], bx, by, bw, 3); R(x, t[0], bx, by, bw, 1); R(x, t[2], bx + 1, by, 1, 1);
      });
    } else if (form === 'parts') {
      R(x, P.frame2, 5, 1, 2, 10); R(x, P.frame2, 1, 5, 10, 2);
      disc(x, P.frame2, 6, 6, 3);
      disc(x, P.steel, 6, 6, 2);
      R(x, P.dark, 5, 5, 2, 2);
    } else if (form === 'moldings') {
      // a moulded bracket
      R(x, P.frame2, 2, 2, 8, 3); R(x, P.steel, 2, 2, 8, 1);
      R(x, P.frame2, 2, 5, 3, 5); R(x, P.frame2, 7, 5, 3, 5);
      R(x, P.brass2, 3, 8, 1, 1); R(x, P.brass2, 8, 8, 1, 1);
    } else if (form === 'modules') {
      R(x, P.teal2, 1, 2, 10, 8); R(x, P.teal, 1, 2, 10, 1);
      R(x, P.brass2, 3, 4, 2, 2); R(x, P.brass2, 7, 4, 2, 2);
      R(x, P.green, 3, 7, 6, 1);
      R(x, P.brass1, 2, 10, 1, 2); R(x, P.brass1, 5, 10, 1, 2); R(x, P.brass1, 8, 10, 1, 2);
    } else if (form === 'fastened') {
      R(x, P.teal2, 1, 2, 10, 8); R(x, P.teal, 1, 2, 10, 1);
      R(x, P.steel, 2, 3, 1, 1); R(x, P.steel, 9, 3, 1, 1); R(x, P.steel, 2, 8, 1, 1); R(x, P.steel, 9, 8, 1, 1);
      R(x, P.brass2, 5, 5, 2, 2);
    } else if (form === 'crates') {
      R(x, P.trunk, 1, 2, 10, 9); R(x, '#8f6a44', 1, 2, 10, 1);
      R(x, P.trunk2, 1, 10, 10, 1);
      R(x, P.brass1, 1, 5, 10, 2);
      R(x, P.paper2, 7, 3, 3, 2);
    } else if (form === 'heavy') {
      R(x, P.frame, 1, 1, 10, 10); R(x, P.frame2, 1, 1, 10, 1);
      R(x, P.teal, 3, 3, 6, 6); R(x, P.glow, 4, 4, 2, 2); R(x, P.brass2, 7, 7, 1, 1);
    } else { // legacy cargo
      R(x, P.trunk, 1, 2, 10, 9); R(x, '#8f6a44', 1, 2, 10, 1);
      R(x, P.trunk2, 1, 10, 10, 1);
      R(x, P.brass1, 1, 5, 10, 2);
    }
    return c;
  }

  // ---------- machine-kind icons 12x12 (build menus) ----------
  function kindIcon(kind) {
    const [c, x] = canvas(12, 12);
    if (kind === 'mine') {
      // pick over a spoil mound
      R(x, P.trunk, 5, 3, 2, 8); R(x, P.steel, 2, 2, 8, 2); R(x, P.frame2, 2, 4, 2, 1); R(x, P.frame2, 8, 4, 2, 1);
      R(x, P.dirt2, 1, 10, 10, 2);
    } else if (kind === 'smelter') {
      R(x, P.cream, 2, 4, 8, 7); R(x, P.frame, 8, 0, 3, 5); R(x, P.dark, 3, 6, 6, 4); R(x, P.orange, 4, 7, 4, 2); R(x, P.glow, 5, 7, 2, 1);
    } else if (kind === 'foundry') {
      R(x, P.cream, 2, 5, 8, 6); R(x, P.frame, 3, 1, 2, 4); R(x, P.frame, 8, 2, 2, 3); R(x, P.dark, 4, 7, 4, 3); R(x, P.orange, 5, 8, 2, 1);
    } else if (kind === 'constructor') {
      R(x, P.teal, 2, 5, 8, 6); R(x, P.cream, 2, 3, 8, 2); R(x, P.frame, 6, 0, 1, 3); R(x, P.frame, 6, 0, 4, 1); R(x, P.glow, 4, 7, 3, 2);
    } else if (kind === 'molder') {
      R(x, P.cream, 2, 4, 8, 7); R(x, P.frame2, 3, 2, 6, 2); R(x, P.dark, 4, 6, 4, 3);
    } else if (kind === 'assembler') {
      R(x, P.cream, 1, 5, 10, 5); R(x, P.frame, 3, 2, 1, 3); R(x, P.frame, 8, 2, 1, 3); R(x, P.teal, 1, 7, 10, 1);
    } else if (kind === 'fastener') {
      R(x, P.teal, 2, 4, 8, 6); R(x, P.steel, 3, 5, 1, 1); R(x, P.steel, 8, 5, 1, 1); R(x, P.steel, 3, 8, 1, 1); R(x, P.steel, 8, 8, 1, 1);
    } else if (kind === 'crane') {
      R(x, P.frame, 8, 1, 2, 10); R(x, P.frame2, 2, 2, 8, 1); R(x, P.dark, 3, 3, 1, 4); R(x, P.trunk, 2, 7, 3, 3);
    } else {
      R(x, P.frame, 1, 3, 10, 8); R(x, P.teal, 3, 5, 6, 4); R(x, P.glow, 4, 6, 2, 2);
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
    beltTileTex: (frame, dir, pipe) => cachedTex('bt:' + frame + dir + (pipe ? 'p' : 'b'), () => beltTile(frame, dir, pipe)),
    itemDotTex: () => cachedTex('itemdot', itemDot),
    spoolTex: () => cachedTex('spool', spool),
    stateDotTex: (kind) => cachedTex('state:' + kind, () => stateDot(kind)),
    // a material's tint (its first ore's main tone) for item dots
    matTint: (mat) => {
      const spec = window.CHAIN && window.CHAIN.MATS && window.CHAIN.MATS[mat];
      const ore = spec && spec.ores && spec.ores[0];
      const tone = (ore && ORE_TONE[ore]) || null;
      const hex = tone ? tone[0] : (spec && spec.form === 'parts' ? P.steel : P.brass2);
      return parseInt(hex.slice(1), 16);
    },
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
    kindIconTex: (kind) => cachedTex('kind:' + kind, () => kindIcon(kind)),
    // raw canvases for the dev proof page (dev/tiles.html) — no PIXI needed
    nodeCanvas: nodePatch,
    sceneryCanvas: (kind) => SCENERY_DRAW[kind] ? SCENERY_DRAW[kind]() : window.TILES.scenery(kind),
    machineCanvas: machine, stationCanvas: station, characterCanvas: character, workCanvas: characterWork,
    matIconTex: (kind) => cachedTex('mat:' + kind, () => matIcon(kind)),
    pressTex: (frame) => tex(press(frame)),
    vignetteURL: () => vignette().toDataURL(),
  };
})();
