// Code-authored pixel sprites for the machine frontier. Deterministic,
// palette-disciplined, no binary assets. The visual target is a dense,
// jewel-toned anime frontier: readable CrossCode-like ground strata, warm
// settlement materials, and SNES-scale character silhouettes. Global: PIXELS
(function () {
  'use strict';

  // One palette, no strays. brass* keys kept for the bitmap-font callers.
  const P = {
    ink: '#172033',
    white: '#fff4dc',
    // Machinery — steampunk in the SNES Final Fantasy idiom, not a clean
    // future. Cast-iron plate with riveted seams, brass hoops and gauge
    // rings, copper pipework, oxblood enamel panels, verdigris fittings,
    // sooted flues and one live firebox per machine. Nothing on a machine
    // is ceramic or cyan: it is heavy warm metal that burns something.
    ironO: '#151824', iron3: '#2c303e', iron2: '#454b5c', iron: '#646c7d', ironL: '#8f96a3',
    steel: '#c2c8d4',                                   // rivet heads, polished rod
    enam: '#8c3f42', enamD: '#571f2c', enamL: '#bd6157', // oxblood enamel panel
    soot: '#171420', steam: '#e4e0da',                   // firebox mouth / steam + gauge face
    teal: '#4f8f7c', teal2: '#2f5c54',                   // verdigris on old copper
    cream: '#f0e0bc', cream2: '#c3ab84',                 // linen, canvas, paper
    orange: '#f06d4f', red: '#d84d66', green: '#80d66e',
    glow: '#ffe28a',
    brass1: '#bf813a', brass2: '#f0bd4f', brass3: '#fff0a6',
    // the land — legacy keys (props, vignette, old drawers)
    grass1: '#6cbf5a', grass2: '#5fae4f', grass3: '#86d370', grass4: '#549c46',
    dirt1: '#c2955f', dirt2: '#a87f4d', dirt3: '#8f6a3e',
    water1: '#4ba8d8', water2: '#3b8ec4', water3: '#bfe8f5',
    leaf1: '#4e9e52', leaf2: '#a4cf63', leaf3: '#245a43',
    trunk: '#84503a', trunk2: '#4b2c2d',
    rock1: '#9aa0ab', rock2: '#7c828e', rock3: '#c6ccd6',
    // terrain kit (tiles.js). High chroma highlights sit over cool, deep
    // shadows so paths, water and elevation still read at a glance.
    tOut: '#0c1a0c',                                    // terrain outline (green-black)
    gA: '#67ad4a', gB: '#9ad35e', gC: '#397d3e', gD: '#1f5036',            // sunlit meadow grass
    dA: '#bc8a4c', dB: '#e0b665', dC: '#83563a', dD: '#4e3029',            // warm ochre dirt
    sA: '#ddc47e', sB: '#f1dfa2', sC: '#ae8657',                           // sunlit sand
    wA: '#17627a', wB: '#278ca1', wC: '#10465f', wF: '#b8edf0', wO: '#082b3b', // cool blue water
    pA: '#98a080', pB: '#b0b898', pC: '#6c7458', pD: '#484c38',            // paved pad (sage cobble)
    rA: '#8c8478', rB: '#a49c8c', rC: '#6c6458', rD: '#484038',            // rock floor / scree
    cA: '#e0bd79', cB: '#b9894f', cC: '#7d5738', cD: '#463022', cO: '#21150f', // cliff, tan
    kA: '#b9b9c2', kB: '#7b8195', kC: '#4a5067', kD: '#292d42',            // cool grey stone
    vA: '#9a86bb', vB: '#665985', vC: '#403c62', vD: '#252340',            // violet canyon
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
    copper: '#d8814e', copper2: '#a85c32', copper3: '#f5ac77',
    quartz: '#e59ae0', quartz2: '#c470c9', quartz3: '#f5c9f2',
    stoneore: '#a8a49c', stoneore2: '#6c6864',
    coal: '#303038', coal2: '#181820', coal3: '#585868',
    oil: '#2c2438', oil2: '#141418', oil3: '#5c4c78',
    titan: '#c8d0e0', titan2: '#8890a8', titan3: '#f0f4ff',
    // paper goods
    paper: '#f4ecd8', paper2: '#d8cba8',
    // the operator (SNES-style: 3 tones per material + one dark outline)
    skin: '#f8cda4', skin2: '#cf946e', hair: '#5b3a35', hair2: '#9a6047',
    suit: '#3e78c8', suit2: '#28508f', suit3: '#6ca9eb', hat: '#ffd05b', hat2: '#c88832',
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

  // ---------- machinery parts kit ----------
  // Every machine is assembled from one shared steampunk vocabulary, so the
  // whole frontier reads as a single workshop: riveted cast-iron plate,
  // brass hoops and dials, copper pipework, oxblood enamel, a flue that
  // smokes and a firebox that burns. Final Fantasy machinery — worked metal
  // and fire — not a clean future factory. Brass is trim, never a surface:
  // brass1 carries it, brass2 is a one-pixel ridge, brass3 is a glint.
  const M = {
    plate(x, px, py, w, h) {                       // iron plate, lit top edge, dark foot
      R(x, P.ironO, px - 1, py - 1, w + 2, h + 2);
      R(x, P.iron2, px, py, w, h);
      R(x, P.iron, px, py, w, Math.max(1, h >> 1));
      R(x, P.ironL, px, py, w, 1);
      R(x, P.iron3, px, py + h - 1, w, 1);
    },
    rivets(x, px, py, w, step) {                   // a seam of lit rivet heads
      for (let i = 0; i < w; i += (step || 3)) { R(x, P.iron3, px + i, py + 1, 1, 1); R(x, P.steel, px + i, py, 1, 1); }
    },
    band(x, px, py, w) {                           // brass hoop: lit ridge, shadow beneath
      R(x, P.brass1, px, py, w, 2);
      R(x, P.brass2, px + 1, py, Math.max(1, w - 2), 1);
      R(x, P.iron3, px, py + 2, w, 1);
    },
    vband(x, px, py, h) { R(x, P.brass1, px, py, 2, h); R(x, P.brass2, px, py + 1, 1, Math.max(1, h - 2)); },
    gauge(x, px, py) {                             // 5x5 dial: iron bezel, brass ring, pale face
      R(x, P.ironO, px + 1, py, 3, 5); R(x, P.ironO, px, py + 1, 5, 3);
      R(x, P.brass1, px + 1, py + 1, 3, 3); R(x, P.brass2, px + 1, py + 1, 2, 1);
      R(x, P.steam, px + 2, py + 2, 1, 1);
    },
    firebox(x, px, py, w, h) {                     // sooted mouth, fire banked at the grate
      R(x, P.ironO, px - 1, py - 1, w + 2, h + 2);
      R(x, P.soot, px, py, w, h);
      R(x, P.orange, px + 1, py + h - 3, w - 2, 2);
      R(x, P.glow, px + 2, py + h - 2, w - 4, 1);
      R(x, P.brass1, px - 1, py + h, w + 2, 1);    // the sill under the door
    },
    flue(x, px, py, h) {                           // chimney: iron tube, brass collar, flared lip
      R(x, P.ironO, px - 1, py + 2, 6, h - 2);
      R(x, P.iron2, px, py + 3, 4, h - 3);
      R(x, P.iron, px, py + 3, 2, h - 3);
      R(x, P.ironO, px - 2, py, 8, 3);
      R(x, P.iron, px - 1, py + 1, 6, 1);
      R(x, P.brass1, px, py + 6, 4, 1);
    },
    pipeH(x, px, py, w) {                          // copper run with brass flanges
      R(x, P.ironO, px, py - 1, w, 5); R(x, P.copper2, px, py, w, 3); R(x, P.copper, px, py, w, 1);
      for (let i = 1; i < w; i += 6) { R(x, P.brass1, px + i, py - 1, 1, 5); R(x, P.brass2, px + i, py, 1, 1); }
    },
    pipeV(x, px, py, h) {
      R(x, P.ironO, px - 1, py, 5, h); R(x, P.copper2, px, py, 3, h); R(x, P.copper, px, py, 1, h);
      for (let i = 1; i < h; i += 6) { R(x, P.brass1, px - 1, py + i, 5, 1); R(x, P.brass2, px, py + i, 1, 1); }
    },
    wheel(x, cx, cy, r, f) {                       // flywheel / pulley; f turns the spokes
      disc(x, P.ironO, cx, cy, r + 1);
      disc(x, P.brass1, cx, cy, r);
      if (r >= 4) {                                // big enough for a rim, a web and spokes
        disc(x, P.iron3, cx, cy, r - 1);
        if ((f || 0) % 2) for (let i = 2 - r; i < r - 1; i++) { R(x, P.brass1, cx + i, cy + i, 1, 1); R(x, P.brass1, cx + i, cy - i, 1, 1); }
        else { R(x, P.brass1, cx - r + 1, cy, r * 2 - 1, 1); R(x, P.brass1, cx, cy - r + 1, 1, r * 2 - 1); }
      } else if (r === 3) {                        // four dark ports read as spokes turning
        for (const [dx, dy] of ((f || 0) % 2 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : [[0, -2], [0, 2], [-2, 0], [2, 0]])) R(x, P.iron3, cx + dx, cy + dy, 1, 1);
      }
      R(x, P.iron3, cx, cy, 1, 1); R(x, P.brass2, cx, cy - 1, 1, 1);
    },
    puff(x, px, py, f) {                           // steam off a flue: rises and thins
      const cols = ['rgba(228,224,218,0.75)', 'rgba(228,224,218,0.45)', 'rgba(228,224,218,0.2)'];
      for (let i = 0; i < 3; i++) {
        const r = 1 + i, cy = py - (f % 4) - i * 3;
        if (cy - r < -1) continue;
        x.fillStyle = cols[i];
        x.fillRect(px + i - r, cy - r, r * 2, r * 2);
      }
    },
  };

  // ---------- mining rigs, 26x36, 4 frames ----------
  // Three hand-me-down machines, each a step up in ambition: a timber
  // prospector rig, a riveted steam extractor, a beam-engine works. Read the
  // silhouette first — derrick, boiler, walking beam — then the brass.
  function machine(tier, frame) {
    const [c, x] = canvas(26, 36);
    R(x, P.ironO, 2, 34, 22, 2); R(x, P.iron3, 5, 33, 16, 1);      // planted shadow
    if (tier === 1) {
      // Prospector rig: a timber derrick splayed over a little upright
      // boiler, hand-built, the drill rod bobbing on every beat.
      const bob = [0, 1, 2, 1][frame];
      for (const [lx, ly] of [[14, 11], [13, 17], [11, 23], [9, 29], [16, 11], [17, 17], [19, 23], [21, 29]]) {
        R(x, P.ironO, lx - 1, ly, 4, 6); R(x, P.trunk2, lx, ly, 2, 6); R(x, P.trunk, lx, ly, 1, 6);
      }
      R(x, P.ironO, 12, 21, 9, 3); R(x, P.trunk2, 13, 22, 7, 1); R(x, P.trunk, 13, 22, 7, 1);
      R(x, P.ironO, 8, 30, 15, 2); R(x, P.trunk2, 9, 30, 13, 1);
      R(x, P.ironO, 12, 8, 8, 4); R(x, P.trunk2, 13, 9, 6, 2); R(x, P.trunk, 13, 9, 6, 1);
      R(x, P.ironO, 14, 10, 4, 4); R(x, P.iron2, 15, 11, 2, 2); R(x, P.brass1, 15, 11, 1, 1);
      R(x, P.ironO, 14, 13 + bob, 3, 14); R(x, P.iron2, 15, 13 + bob, 1, 13); R(x, P.steel, 15, 14 + bob, 1, 4);
      R(x, P.ironO, 13, 26 + bob, 5, 4); R(x, P.iron2, 14, 27 + bob, 3, 2); R(x, P.brass1, 15, 28 + bob, 1, 1);
      M.plate(x, 2, 16, 7, 15);
      M.gauge(x, 3, 17);
      M.band(x, 2, 22, 7);
      M.firebox(x, 3, 25, 5, 4);
      M.flue(x, 3, 7, 10);
      M.puff(x, 4, 6, frame);
      R(x, P.dirt3, 5, 31, 4, 2); R(x, P.ironore, 19, 31, 3, 2);
    } else if (tier === 2) {
      // Steam extractor: a riveted boiler-house with an oxblood door, twin
      // dials, a turning flywheel and a flue that never stops.
      M.plate(x, 3, 15, 20, 16);
      R(x, P.ironO, 1, 12, 24, 4); R(x, P.iron, 2, 13, 22, 2); R(x, P.ironL, 2, 13, 22, 1);
      M.band(x, 5, 17, 16);
      M.rivets(x, 4, 22, 18, 5);
      R(x, P.ironO, 8, 19, 9, 7); R(x, P.enamD, 9, 20, 7, 5); R(x, P.enam, 9, 20, 7, 3); R(x, P.enamL, 9, 20, 7, 1);
      R(x, P.brass1, 10, 22, 5, 1);
      M.gauge(x, 3, 20); M.gauge(x, 18, 20);
      M.firebox(x, 8, 26, 8, 4);
      M.wheel(x, 20, 26, 3, frame);
      M.flue(x, 15, 5, 9);
      M.puff(x, 16, 4, frame);
      R(x, P.ironO, 6, 8, 4, 6); R(x, P.brass1, 7, 9, 2, 5); R(x, P.brass2, 7, 9, 1, 5);
      M.pipeV(x, 2, 18, 13);
    } else {
      // Beam-engine works: the walking beam rocks on its post, the flywheel
      // turns, the firebox roars. The frontier's real machine.
      const tilt = [0, 1, 0, -1][frame];
      M.plate(x, 2, 15, 22, 16);
      R(x, P.ironO, 0, 12, 26, 4); R(x, P.iron, 1, 13, 24, 2); R(x, P.ironL, 1, 13, 24, 1);
      M.rivets(x, 3, 22, 20, 5);
      R(x, P.ironO, 10, 5, 6, 10); R(x, P.iron2, 11, 6, 4, 9); R(x, P.iron, 11, 6, 1, 9);
      R(x, P.ironO, 3, 6 + tilt, 9, 4); R(x, P.iron2, 4, 7 + tilt, 7, 2); R(x, P.ironL, 4, 7 + tilt, 7, 1);
      R(x, P.ironO, 14, 6 - tilt, 9, 4); R(x, P.iron2, 15, 7 - tilt, 7, 2); R(x, P.ironL, 15, 7 - tilt, 7, 1);
      R(x, P.brass1, 12, 8, 2, 2); R(x, P.brass2, 12, 8, 1, 1);
      R(x, P.ironO, 4, 10 + tilt, 3, 9); R(x, P.iron, 5, 10 + tilt, 1, 8);
      R(x, P.ironO, 19, 10 - tilt, 3, 7); R(x, P.iron, 20, 10 - tilt, 1, 6);
      M.wheel(x, 6, 25, 5, frame);
      R(x, P.ironO, 12, 17, 10, 7); R(x, P.enamD, 13, 18, 8, 5); R(x, P.enam, 13, 18, 8, 3); R(x, P.enamL, 13, 18, 8, 1);
      M.gauge(x, 13, 18); R(x, P.brass1, 19, 19, 2, 3); R(x, P.brass2, 19, 19, 1, 3);
      M.firebox(x, 13, 26, 8, 4);
      M.flue(x, 20, 3, 10);
      M.puff(x, 21, 2, frame);
    }
    return c;
  }

  // ---------- production stations 30x30 ----------
  // Works buildings in the same idiom: a blast furnace, a crucible foundry,
  // a belt-driven machine shop, an assembly hall. Same kit, heavier iron —
  // each one gets a chimney on the roof, one fire, and one thing that moves.
  function station(kind) {
    const [c, x] = canvas(30, 30);
    R(x, P.ironO, 1, 28, 28, 2);
    if (kind === 'bigrams') {
      // SMELTER: a blast furnace that tapers as it climbs, charged from the
      // hopper on top and tapped at the foot into a mould that still glows.
      M.plate(x, 6, 20, 15, 8);                    // hearth
      M.plate(x, 8, 14, 11, 6);                    // mid stack
      M.plate(x, 10, 9, 7, 5);                     // throat
      M.band(x, 8, 14, 11); M.band(x, 6, 20, 15);
      M.rivets(x, 7, 24, 13, 4);
      R(x, P.ironO, 8, 4, 11, 5); R(x, P.iron2, 9, 5, 9, 4); R(x, P.iron, 9, 5, 9, 1);
      R(x, P.soot, 11, 5, 5, 2); R(x, P.ironore, 12, 5, 3, 1);   // ore in the hopper
      M.firebox(x, 8, 22, 8, 5);
      M.flue(x, 23, 4, 11); M.puff(x, 24, 3, 0);
      R(x, P.ironO, 20, 14, 7, 8); R(x, P.iron2, 21, 15, 5, 6); R(x, P.iron, 21, 15, 5, 1); M.gauge(x, 21, 16);
      R(x, P.brass1, 16, 25, 6, 1); R(x, P.glow, 16, 25, 4, 1);  // the tap runner
      R(x, P.ironO, 21, 24, 7, 5); R(x, P.iron2, 22, 25, 5, 3); R(x, P.orange, 22, 25, 5, 1); R(x, P.glow, 23, 25, 3, 1);
      M.pipeV(x, 2, 16, 12);
    } else if (kind === 'foundry') {
      // FOUNDRY: a crucible house — twin flues over the fire, and a ladle on
      // its trunnions tipping molten metal into the mould bed below.
      M.plate(x, 2, 13, 26, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      M.rivets(x, 3, 14, 24, 4);
      M.flue(x, 6, 2, 9); M.puff(x, 7, 1, 0);
      M.flue(x, 20, 4, 7);
      M.gauge(x, 4, 16); M.gauge(x, 10, 16);
      M.firebox(x, 4, 22, 9, 5);
      R(x, P.ironO, 16, 16, 9, 8); R(x, P.iron2, 17, 17, 7, 6); R(x, P.iron, 17, 17, 7, 2);
      M.band(x, 17, 19, 7);
      R(x, P.orange, 17, 16, 7, 1); R(x, P.glow, 19, 16, 3, 1);
      R(x, P.brass1, 15, 18, 1, 4); R(x, P.brass1, 25, 18, 1, 4);
      R(x, P.orange, 20, 24, 1, 2); R(x, P.glow, 20, 24, 1, 1);
      R(x, P.ironO, 17, 25, 8, 4); R(x, P.iron2, 18, 26, 6, 2); R(x, P.orange, 18, 26, 6, 1); R(x, P.glow, 19, 26, 4, 1);
    } else if (kind === 'words') {
      // CONSTRUCTOR: a machine shop under a timber truss — a line shaft on
      // brass pulleys, leather belting down to the press, dies at the bench.
      M.plate(x, 2, 14, 26, 14);
      R(x, P.ironO, 0, 6, 30, 5); R(x, P.trunk2, 1, 7, 28, 3); R(x, P.trunk, 1, 7, 28, 1);
      R(x, P.ironO, 3, 11, 24, 2); R(x, P.iron, 4, 11, 22, 1);
      M.wheel(x, 7, 12, 2, 0); M.wheel(x, 15, 12, 2, 1); M.wheel(x, 22, 12, 2, 0);
      R(x, P.trunk2, 7, 14, 1, 6); R(x, P.trunk2, 15, 14, 1, 4); R(x, P.trunk2, 22, 14, 1, 5);
      M.band(x, 3, 17, 24);
      M.rivets(x, 4, 25, 22, 5);
      R(x, P.ironO, 4, 20, 9, 8); R(x, P.iron3, 5, 21, 7, 6);
      R(x, P.iron2, 6, 22, 5, 3); R(x, P.steel, 6, 22, 5, 1); R(x, P.brass1, 6, 26, 5, 1);
      R(x, P.ironO, 14, 20, 8, 5); R(x, P.enamD, 15, 21, 6, 3); R(x, P.enam, 15, 21, 6, 2); R(x, P.enamL, 15, 21, 6, 1);
      M.gauge(x, 23, 20);
      M.firebox(x, 15, 26, 6, 2);
      M.flue(x, 24, 1, 7); M.puff(x, 25, 0, 0);
    } else {
      // ASSEMBLER: the big hall — a gantry over the floor, a heavy flywheel,
      // a bank of dials on oxblood, and the firebox that drives it all.
      M.plate(x, 1, 13, 28, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      R(x, P.ironO, 1, 3, 18, 3); R(x, P.iron2, 2, 4, 16, 2); R(x, P.ironL, 2, 4, 16, 1);
      R(x, P.ironO, 2, 6, 4, 5); R(x, P.iron2, 3, 6, 2, 5);
      R(x, P.ironO, 14, 6, 4, 5); R(x, P.iron2, 15, 6, 2, 5);
      R(x, P.iron3, 10, 6, 1, 4); R(x, P.ironO, 8, 10, 5, 3); R(x, P.trunk, 9, 11, 3, 1);
      M.band(x, 2, 16, 26);
      M.rivets(x, 3, 25, 24, 5);
      M.wheel(x, 7, 22, 5, 0);
      R(x, P.ironO, 14, 19, 13, 5); R(x, P.enamD, 15, 20, 11, 3); R(x, P.enam, 15, 20, 11, 2); R(x, P.enamL, 15, 20, 11, 1);
      M.gauge(x, 16, 19); M.gauge(x, 22, 19);
      M.firebox(x, 15, 25, 10, 3);
      M.pipeH(x, 1, 24, 5);
      M.flue(x, 23, 1, 10); M.puff(x, 24, 0, 0);
    }
    return c;
  }

  // ---------- freight depot 44x36, 4 frames (crane hook cycles) ----------
  // A timber loading stage with an iron crane and a steam donkey engine
  // chuffing away beside the crates.
  function press(frame) {
    const [c, x] = canvas(44, 36);
    R(x, P.ironO, 1, 28, 42, 8);
    R(x, P.bC, 2, 29, 40, 6);
    for (let px = 2; px < 42; px += 5) R(x, P.bA, px, 29, 4, 1);
    R(x, P.bB, 2, 29, 40, 1);
    R(x, P.iron2, 2, 33, 40, 2); M.rivets(x, 4, 33, 36, 5);
    // canvas awning on timber posts
    R(x, P.ironO, 1, 2, 26, 5); R(x, P.cream, 2, 3, 24, 3); R(x, P.cream2, 2, 5, 24, 1);
    for (let px = 4; px < 25; px += 6) R(x, P.enam, px, 3, 1, 3);
    R(x, P.trunk2, 3, 7, 2, 22); R(x, P.trunk2, 23, 7, 2, 22);
    R(x, P.trunk, 3, 7, 1, 22); R(x, P.trunk, 23, 7, 1, 22);
    // crates
    R(x, P.ironO, 5, 21, 12, 9); R(x, P.trunk, 6, 22, 10, 7); R(x, P.trunk2, 6, 26, 10, 1); R(x, P.brass1, 6, 24, 10, 1);
    R(x, P.ironO, 7, 13, 10, 8); R(x, P.trunk, 8, 14, 8, 6); R(x, P.brass1, 9, 16, 6, 1);
    // crane: iron mast, brass sheave, a hook that rises and falls
    R(x, P.ironO, 32, 3, 5, 26); R(x, P.iron2, 33, 4, 3, 25); R(x, P.iron, 33, 4, 1, 25);
    R(x, P.ironO, 19, 5, 15, 4); R(x, P.iron2, 20, 6, 13, 2); R(x, P.ironL, 20, 6, 13, 1);
    M.wheel(x, 22, 7, 2, frame);
    const hy = [14, 17, 20, 17][frame];
    R(x, P.iron3, 22, 9, 1, hy - 9);
    R(x, P.ironO, 18, hy, 9, 6); R(x, P.trunk, 19, hy + 1, 7, 4); R(x, P.brass1, 19, hy + 3, 7, 1);
    // steam donkey engine beside the mast
    M.plate(x, 37, 19, 6, 9);
    M.band(x, 37, 22, 6);
    M.firebox(x, 38, 25, 4, 3);
    M.flue(x, 38, 9, 10); M.puff(x, 39, 8, frame);
    M.gauge(x, 28, 20);
    // signal lantern on the mast
    R(x, P.ironO, 28, 9, 5, 8); R(x, P.brass1, 29, 10, 3, 6); R(x, P.brass2, 29, 10, 1, 6);
    R(x, frame % 2 ? P.green : P.red, 30, 12, 1, 2);
    return c;
  }

  // ---------- the Hub 26x36: roofed contract board ----------
  function noticeBoard(hasWork) {
    const [c, x] = canvas(26, 36);
    R(x, P.trunk2, 4, 20, 3, 16); R(x, P.trunk2, 19, 20, 3, 16);
    R(x, P.ironO, 0, 4, 26, 5); R(x, P.iron2, 1, 5, 24, 3); R(x, P.iron, 1, 5, 24, 1); R(x, P.brass1, 1, 8, 24, 1);
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
  // 'up' | 'side' (side faces RIGHT; factory mirrors for left). Eight walk
  // beats add settle and pass poses between the two long strides. work(): four frames at
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
    const phase = frame % 8;
    const forward = phase === 2 || phase === 3;
    const backward = phase === 6 || phase === 7;
    const stride = forward || backward;
    const settle = phase === 1 || phase === 5;
    const oy = (stride || settle) ? 0 : 1;
    if (dir === 'side') {
      grid(x, HEAD_S, 0, oy);
      grid(x, forward ? TORSO_S_FWD : backward ? TORSO_S_BACK : TORSO_S, 0, oy + 12);
      grid(x, stride ? (forward ? LEGS_S_STEP : mirror(LEGS_S_STEP)) : LEGS_S, 0, oy + 18);
      const arm = forward ? 1 : backward ? -1 : settle ? (phase === 1 ? 1 : -1) : 0;
      R(x, P.ink, 13 + arm, 16 + (arm < 0 ? 1 : 0), 2, 3);
      R(x, P.skin, 14 + arm, 16 + (arm < 0 ? 1 : 0), 1, 2);
    } else {
      grid(x, dir === 'up' ? HEAD_U : HEAD_D, 0, oy);
      grid(x, dir === 'up' ? TORSO_U : TORSO_D, 0, oy + 12);
      grid(x, stride ? (forward ? LEGS_D_STEP : mirror(LEGS_D_STEP)) : LEGS_D, 0, oy + 18);
      const arm = forward ? 1 : backward ? -1 : 0;
      if (arm) {
        R(x, P.ink, arm > 0 ? 1 : 13, oy + 15, 2, 3);
        R(x, P.skin, arm > 0 ? 2 : 13, oy + 16, 1, 1);
      }
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
    R(x, P.ironO, 0, 1, 12, 6);
    R(x, P.iron2, 0, 2, 12, 4); R(x, P.iron, 0, 2, 12, 1);
    R(x, P.bC, 0, 3, 12, 2); R(x, P.bB, 1 + frame * 3, 3, 2, 2);
    R(x, P.brass1, 0, 3, 1, 2); R(x, P.brass1, 11, 3, 1, 2);
    R(x, P.iron2, 2, 6, 2, 2); R(x, P.iron2, 8, 6, 2, 2);
    return c;
  }

  // material dot 4x4 (things riding belts / popping out of machines)
  function matDot() {
    const [c, x] = canvas(4, 4);
    R(x, P.brass1, 0, 1, 4, 2); R(x, P.brass2, 0, 1, 4, 1);
    return c;
  }

  // ---------- belt / pipe tiles 16x16 (phase 3): one tile per path step ----------
  // A belt: an iron trestle carrying a slatted timber band over brass
  // rollers — the slats walk along the axis as the frame advances.
  // A pipe: riveted copper with brass flanges and a glinting flow dash.
  function beltTile(frame, dir, pipe) {
    const [c, x] = canvas(TILE, TILE);
    const horiz = dir === 'h';
    if (pipe) {
      if (horiz) {
        R(x, P.ironO, 0, 3, 16, 10);
        R(x, P.copper2, 0, 4, 16, 8); R(x, P.copper, 0, 4, 16, 4); R(x, P.copper3, 0, 4, 16, 1);
        R(x, P.brass1, 2, 3, 2, 10); R(x, P.brass2, 2, 3, 1, 10);
        R(x, P.glow, (frame * 4) % 16, 8, 3, 1);
      } else {
        R(x, P.ironO, 3, 0, 10, 16);
        R(x, P.copper2, 4, 0, 8, 16); R(x, P.copper, 4, 0, 4, 16); R(x, P.copper3, 4, 0, 1, 16);
        R(x, P.brass1, 3, 2, 10, 2); R(x, P.brass2, 3, 2, 10, 1);
        R(x, P.glow, 8, (frame * 4) % 16, 1, 3);
      }
      return c;
    }
    if (horiz) {
      R(x, P.ironO, 0, 2, 16, 12);
      R(x, P.iron2, 0, 3, 16, 10); R(x, P.iron, 0, 3, 16, 1); R(x, P.iron3, 0, 12, 16, 1);
      R(x, P.bC, 0, 5, 16, 6);
      for (let k = 0; k < 4; k++) { const o = (k * 4 + frame) % 16; R(x, P.bB, o, 5, 2, 6); R(x, P.bA, o, 5, 1, 6); }
      R(x, P.brass1, 0, 5, 1, 6); R(x, P.brass1, 15, 5, 1, 6);
      for (let i = 2; i < 16; i += 6) R(x, P.ironL, i, 3, 1, 1);
    } else {
      R(x, P.ironO, 2, 0, 12, 16);
      R(x, P.iron2, 3, 0, 10, 16); R(x, P.iron, 3, 0, 1, 16); R(x, P.iron3, 12, 0, 1, 16);
      R(x, P.bC, 5, 0, 6, 16);
      for (let k = 0; k < 4; k++) { const o = (k * 4 + frame) % 16; R(x, P.bB, 5, o, 6, 2); R(x, P.bA, 5, o, 6, 1); }
      R(x, P.brass1, 5, 0, 6, 1); R(x, P.brass1, 5, 15, 6, 1);
      for (let i = 2; i < 16; i += 6) R(x, P.ironL, 3, i, 1, 1);
    }
    return c;
  }
  // a white 4x4 item dot — tinted per material by the renderer
  function itemDot() {
    const [c, x] = canvas(4, 4);
    R(x, P.ink, 0, 0, 4, 4); R(x, P.white, 1, 1, 2, 2); R(x, P.white, 0, 1, 1, 2); R(x, P.white, 1, 0, 2, 1); R(x, P.white, 3, 1, 1, 2); R(x, P.white, 1, 3, 2, 1);
    return c;
  }
  // a spool of belting carried on the operator's back, 8x8
  function spool() {
    const [c, x] = canvas(8, 8);
    disc(x, P.ironO, 4, 4, 3); disc(x, P.trunk2, 4, 4, 2); R(x, P.trunk, 3, 2, 2, 1);
    R(x, P.brass2, 3, 3, 2, 2); R(x, P.brass3, 3, 3, 1, 1);
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
    // a cast-iron post under a brass gas lantern
    const [c, x] = canvas(8, 26);
    R(x, P.ironO, 2, 7, 4, 19); R(x, P.iron2, 3, 7, 2, 18); R(x, P.iron, 3, 7, 1, 18);
    R(x, P.ironO, 1, 24, 6, 2); R(x, P.iron, 2, 24, 4, 1);
    R(x, P.ironO, 0, 1, 8, 7); R(x, P.brass1, 1, 2, 6, 5); R(x, P.brass2, 1, 2, 6, 1);
    R(x, P.glow, 2, 3, 4, 3); R(x, P.white, 3, 4, 2, 1);
    R(x, P.brass2, 3, 0, 2, 2);
    return c;
  }
  function propCrate(seed) {
    const [c, x] = canvas(14, 12);
    R(x, P.trunk, 0, 0, 14, 12);
    R(x, P.trunk2, 0, 11, 14, 1); R(x, P.trunk2, 0, 0, 1, 12); R(x, P.trunk2, 13, 0, 1, 12);
    R(x, '#8f6a44', 1, 0, 12, 1);
    for (let i = 0; i < 5; i++) R(x, P.trunk2, 2 + i * 2, 9 - i * 2, 2, 2);
    R(x, P.brass1, 0, 5, 14, 1);
    if (seed % 2) R(x, P.paper2, 4, 4, 3, 2);
    return c;
  }
  function propDrum() {
    // a verdigrised copper drum, brass-rimmed and iron-hooped
    const [c, x] = canvas(10, 13);
    R(x, P.ironO, 0, 0, 10, 13);
    R(x, P.teal2, 1, 1, 8, 11); R(x, P.teal, 1, 1, 8, 6); R(x, P.copper3, 1, 1, 1, 6);
    R(x, P.brass1, 1, 4, 8, 1); R(x, P.brass1, 1, 9, 8, 1);
    R(x, P.brass1, 2, 0, 6, 2); R(x, P.brass2, 2, 0, 6, 1);
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
        R(x, P.iron2, 3, 2, 6, 9); R(x, P.iron, 3, 2, 6, 1);
        R(x, P.oil, 4, 4, 4, 6); R(x, P.oil3, 4, 4, 1, 3);
        R(x, P.iron, 5, 0, 2, 2);
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
      // a brass gear
      R(x, P.brass1, 5, 0, 2, 12); R(x, P.brass1, 0, 5, 12, 2);
      R(x, P.brass1, 2, 2, 2, 2); R(x, P.brass1, 8, 2, 2, 2); R(x, P.brass1, 2, 8, 2, 2); R(x, P.brass1, 8, 8, 2, 2);
      disc(x, P.brass1, 6, 6, 4); disc(x, P.brass2, 6, 6, 3);
      disc(x, P.iron3, 6, 6, 1); R(x, P.brass3, 4, 3, 2, 1);
    } else if (form === 'moldings') {
      // a cast bracket, still warm at the edge
      R(x, P.iron2, 2, 2, 8, 3); R(x, P.ironL, 2, 2, 8, 1);
      R(x, P.iron2, 2, 5, 3, 5); R(x, P.iron2, 7, 5, 3, 5);
      R(x, P.steel, 3, 5, 1, 5); R(x, P.steel, 8, 5, 1, 5);
      R(x, P.brass2, 3, 8, 1, 1); R(x, P.brass2, 8, 8, 1, 1);
    } else if (form === 'modules') {
      // an instrument block: one brass dial, a copper coil, brass feet
      R(x, P.iron2, 1, 2, 10, 8); R(x, P.iron, 1, 2, 10, 2);
      R(x, P.brass1, 2, 4, 4, 4); R(x, P.brass2, 2, 4, 3, 1); R(x, P.steam, 3, 5, 2, 2);
      R(x, P.copper2, 7, 4, 3, 5); R(x, P.copper, 7, 4, 3, 1); R(x, P.copper, 7, 6, 3, 1); R(x, P.copper, 7, 8, 3, 1);
      R(x, P.brass1, 2, 10, 1, 2); R(x, P.brass1, 5, 10, 1, 2); R(x, P.brass1, 8, 10, 1, 2);
    } else if (form === 'fastened') {
      // a riveted plate with a brass boss
      R(x, P.iron2, 1, 2, 10, 8); R(x, P.iron, 1, 2, 10, 3); R(x, P.ironL, 1, 2, 10, 1);
      R(x, P.steel, 2, 3, 1, 1); R(x, P.steel, 9, 3, 1, 1); R(x, P.steel, 2, 8, 1, 1); R(x, P.steel, 9, 8, 1, 1);
      R(x, P.brass1, 5, 5, 3, 3); R(x, P.brass2, 5, 5, 2, 1);
    } else if (form === 'crates') {
      R(x, P.trunk, 1, 2, 10, 9); R(x, '#8f6a44', 1, 2, 10, 1);
      R(x, P.trunk2, 1, 10, 10, 1);
      R(x, P.brass1, 1, 5, 10, 2);
      R(x, P.paper2, 7, 3, 3, 2);
    } else if (form === 'heavy') {
      // a boiler assembly: iron shell, brass hoop, a lit firebox
      R(x, P.iron2, 1, 1, 10, 10); R(x, P.iron, 1, 1, 10, 3); R(x, P.ironL, 1, 1, 10, 1);
      R(x, P.brass1, 1, 5, 10, 1);
      R(x, P.soot, 3, 7, 6, 4); R(x, P.orange, 4, 8, 4, 2); R(x, P.glow, 5, 9, 2, 1);
    } else { // legacy cargo
      R(x, P.trunk, 1, 2, 10, 9); R(x, '#8f6a44', 1, 2, 10, 1);
      R(x, P.trunk2, 1, 10, 10, 1);
      R(x, P.brass1, 1, 5, 10, 2);
    }
    return c;
  }

  // ---------- machine-kind icons 12x12 (build menus) ----------
  // Miniatures of the real machines: iron body, brass fitting, one fire.
  function kindIcon(kind) {
    const [c, x] = canvas(12, 12);
    if (kind === 'mine') {
      // a pick over a spoil mound
      R(x, P.trunk, 5, 3, 2, 8); R(x, P.steel, 2, 2, 8, 2); R(x, P.iron2, 2, 4, 2, 1); R(x, P.iron2, 8, 4, 2, 1);
      R(x, P.dirt2, 1, 10, 10, 2);
    } else if (kind === 'smelter') {
      // a tapered furnace with a tapped mouth
      R(x, P.iron2, 3, 3, 6, 8); R(x, P.iron, 3, 3, 6, 3); R(x, P.brass1, 3, 5, 6, 1);
      R(x, P.iron2, 9, 0, 3, 5); R(x, P.iron, 9, 0, 3, 1);
      R(x, P.soot, 4, 7, 4, 4); R(x, P.orange, 4, 8, 4, 2); R(x, P.glow, 5, 9, 2, 1);
    } else if (kind === 'foundry') {
      // twin flues over a crucible
      R(x, P.iron2, 2, 4, 8, 7); R(x, P.iron, 2, 4, 8, 2);
      R(x, P.iron2, 3, 0, 2, 4); R(x, P.iron2, 8, 1, 2, 3);
      R(x, P.soot, 4, 7, 4, 4); R(x, P.orange, 4, 8, 4, 2); R(x, P.glow, 5, 9, 2, 1);
    } else if (kind === 'constructor') {
      // a line shaft on brass pulleys over a bench
      R(x, P.trunk2, 1, 1, 10, 2); R(x, P.trunk, 1, 1, 10, 1);
      R(x, P.brass1, 3, 3, 2, 2); R(x, P.brass1, 8, 3, 2, 2); R(x, P.brass2, 3, 3, 1, 1); R(x, P.brass2, 8, 3, 1, 1);
      R(x, P.iron2, 2, 6, 8, 5); R(x, P.iron, 2, 6, 8, 1); R(x, P.steel, 4, 8, 4, 1);
    } else if (kind === 'molder') {
      R(x, P.iron2, 2, 4, 8, 7); R(x, P.iron, 2, 4, 8, 2); R(x, P.brass1, 3, 2, 6, 2); R(x, P.brass2, 3, 2, 6, 1);
      R(x, P.soot, 4, 7, 4, 3); R(x, P.orange, 5, 8, 2, 1);
    } else if (kind === 'assembler') {
      // a gantry over a riveted hall
      R(x, P.iron2, 1, 1, 10, 2); R(x, P.iron, 1, 1, 10, 1);
      R(x, P.iron2, 1, 5, 10, 6); R(x, P.iron, 1, 5, 10, 2);
      R(x, P.steel, 2, 7, 1, 1); R(x, P.steel, 5, 7, 1, 1); R(x, P.steel, 8, 7, 1, 1);
      R(x, P.enam, 4, 9, 5, 2); R(x, P.enamL, 4, 9, 5, 1);
    } else if (kind === 'fastener') {
      R(x, P.iron2, 2, 3, 8, 8); R(x, P.iron, 2, 3, 8, 3);
      R(x, P.steel, 3, 4, 1, 1); R(x, P.steel, 8, 4, 1, 1); R(x, P.steel, 3, 9, 1, 1); R(x, P.steel, 8, 9, 1, 1);
      R(x, P.brass1, 5, 6, 2, 2); R(x, P.brass2, 5, 6, 1, 1);
    } else if (kind === 'crane') {
      R(x, P.iron2, 8, 1, 2, 10); R(x, P.iron, 2, 2, 8, 1); R(x, P.iron3, 3, 3, 1, 4); R(x, P.trunk, 2, 7, 3, 3);
      R(x, P.brass1, 2, 8, 3, 1);
    } else {
      R(x, P.iron2, 1, 3, 10, 8); R(x, P.iron, 1, 3, 10, 2); R(x, P.soot, 3, 6, 6, 4); R(x, P.orange, 4, 7, 4, 2); R(x, P.glow, 5, 8, 2, 1);
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
    pressCanvas: press, beltTileCanvas: beltTile, boardCanvas: noticeBoard,
    propCanvas: (kind) => PROP_DRAW[kind](), kindIconCanvas: kindIcon, matIconCanvas: matIcon,
    matIconTex: (kind) => cachedTex('mat:' + kind, () => matIcon(kind)),
    pressTex: (frame) => tex(press(frame)),
    vignetteURL: () => vignette().toDataURL(),
  };
})();
