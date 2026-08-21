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
    // belting: a dark band on purpose — brass, copper and coal riding it
    // all have to read at a glance against it
    beltS: '#0e0d16', beltD: '#1b1928', beltE: '#272437', beltM: '#37324b', beltL: '#4f4a6a',
    teal: '#4f8f7c', teal2: '#2f5c54', teal3: '#7fc9a8',  // verdigris on old copper (teal3: its highlight)
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
    // ores. The six are pulled apart by hue on purpose: iron reads blue-cool
    // and stone reads warm sand, because at ten pixels a grey is a grey and
    // those two used to be the same rock. Veins in the ground (ORE_LOOK) and
    // goods on the belt (MAT_DRAW) share these keys, so an ore looks the same
    // where it is dug as it does where it is carried.
    ironore: '#7d8aa5', ironore2: '#49526b', ironore3: '#bcc8dc',
    copper: '#d8814e', copper2: '#a85c32', copper3: '#f5ac77', copper4: '#7a4426',
    quartz: '#e59ae0', quartz2: '#b45cbc', quartz3: '#f9d4f5',
    stoneore: '#b9ab8c', stoneore2: '#7a6c53', stoneore3: '#e2d6b6',
    coal: '#3a3a4a', coal2: '#161620', coal3: '#5c5c72',
    oil: '#4c3d70', oil2: '#1c1628', oil3: '#9b86c4',
    // alloys — each is its own colour, not a blend of its two ores. Eight
    // bars that differ only by a tone swap are eight of the same bar; these
    // are eight materials.
    bronze: '#c08a4a', bronzeD: '#7a4d1e', bronzeL: '#eec37e',
    cIron: '#9a9488', cIronD: '#5b554a', cIronL: '#d4ccb6',
    qIron: '#a79fc4', qIronD: '#655d86', qIronL: '#e0daf4',
    stl: '#9db4d0', stlD: '#586c8a', stlL: '#e6f2ff',
    brs: '#d8ac3e', brsD: '#8a6614', brsL: '#ffe488',
    bIron: '#4a4358', bIronD: '#221d2e', bIronL: '#8b81a6',
    gun: '#8a5e46', gunD: '#4c3122', gunL: '#c08a68',
    gls: '#cfa8e4', glsD: '#6e4f8e', glsL: '#f6e8ff',
    titan: '#c8d0e0', titan2: '#8890a8', titan3: '#f0f4ff',
    // paper goods
    paper: '#f4ecd8', paper2: '#d8cba8',
    // the operator — a fantasy mechanic, the man who works on airships
    // (user ruling, 2026-08-21). Dressed out of the machines' own material
    // list, and built the way the CrossCode sheets are: one near-black tone
    // doing both outline and shadow over about a third of the sprite, a
    // single saturated accent, and highlights measured in single pixels.
    coatN: '#0d1018', coatD: '#1e2540', coat: '#39457a', coatL: '#6b7ec0',
    capD: '#170f0a', cap: '#3d2b1e', capL: '#63462c',   // the leather flight cap
    hairD: '#4a2214', hair: '#a85a2c',                  // what escapes it, at the temples
    skin: '#e8b184', skinD: '#a4674a',
    eye: '#16121c', iris: '#2a2438',                    // dark, with one white glint
    leathD: '#2c1a10', leath: '#6d4526',                // the chest rig and the gloves
    bootD: '#141220', boot: '#3a3350',
    brassD: '#6d4318',                                  // the dark side of a brass rim
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
    firebox(x, px, py, w, h, heat) {               // sooted mouth, fire banked at the grate
      R(x, P.ironO, px - 1, py - 1, w + 2, h + 2);
      R(x, P.soot, px, py, w, h);
      R(x, P.orange, px + 1, py + h - 3, w - 2, 2);
      R(x, P.glow, px + 2, py + h - 2, w - 4, 1);
      // driven, the fire licks up the mouth — never past the lintel
      const g = Math.max(0, Math.min(heat || 0, h - 3));
      if (g) {
        R(x, P.orange, px + 2, py + h - 3 - g, w - 4, g);
        if (g > 1) R(x, P.glow, px + 3, py + h - 3, Math.max(1, w - 6), 1);
      }
      R(x, P.brass1, px - 1, py + h, w + 2, 1);    // the sill under the door
    },
    lamp(x, px, py, lit) {                         // 3x3 signal lamp: iron bezel, brass hood,
      const n = Math.max(0, Math.min(3, lit | 0)); // a bead that is dark, breathing, or lit
      if (n >= 2) {
        x.fillStyle = n >= 3 ? 'rgba(255,226,138,0.30)' : 'rgba(255,226,138,0.14)';
        x.fillRect(px - 1, py - 1, 5, 5);
      }
      R(x, P.ironO, px, py, 3, 3);
      R(x, P.brass1, px, py, 3, 1);
      R(x, [P.iron3, P.brass1, P.orange, P.glow][n], px + 1, py + 1, 1, 1);
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
      } else if (r === 2) {                        // a line-shaft pulley: one port swings round
        const [dx, dy] = [[0, -1], [1, 0], [0, 1], [-1, 0]][((f || 0) % 4 + 4) % 4];
        R(x, P.iron3, cx + dx, cy + dy, 1, 1);
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
    // ---------- the doors: the body's half of every port (2026-08-21) ----------
    // A port on the ground has a fixture on the body it serves, in the
    // plate's own colours — verdigris takes deliveries in, brass sends the
    // product out — so which way the goods go is written on the machine as
    // well as on the ground, and it turns with the machine. Three fixtures,
    // by where the port's side stands in the drawn view: a hatch on the
    // visible face, a jamb strip riding a near edge, and a crest tick over
    // the far silhouette (a port behind the body stays readable — ruling
    // 2026-08-21, with the plates and the arriving run below it).
    hatch(x, cx, py, out) {                        // 8x6 roller door, centred on cx
      const lit = out ? P.brass2 : P.teal3, dim = out ? P.brass1 : P.teal2;
      R(x, P.ironO, cx - 5, py - 1, 10, 8);
      R(x, dim, cx - 4, py, 8, 6);
      R(x, P.soot, cx - 3, py + 1, 6, 5);
      R(x, lit, cx - 4, py, 8, 1);                 // the lintel
      R(x, P.iron3, cx - 3, py + 2, 6, 1);         // the slats of the leaf
      R(x, P.iron3, cx - 3, py + 4, 6, 1);
    },
    jamb(x, px, py, h, out) {                      // 3-wide door post on a body edge
      const lit = out ? P.brass2 : P.teal3, dim = out ? P.brass1 : P.teal2;
      R(x, P.ironO, px - 1, py - 1, 5, h + 2);
      R(x, dim, px, py, 3, h);
      R(x, P.soot, px + 1, py + 2, 1, h - 4);
      R(x, lit, px, py, 3, 1);
    },
    crest(x, cx, py, out) {                        // the far door's lintel over the roof
      const lit = out ? P.brass2 : P.teal3, dim = out ? P.brass1 : P.teal2;
      R(x, P.ironO, cx - 4, py - 1, 8, 4);
      R(x, lit, cx - 3, py, 6, 1);
      R(x, dim, cx - 3, py + 1, 6, 1);
    },
  };
  // a view drawn once and turned about: facing west is facing east flipped,
  // the way the operator's own side sprite already works
  function flipX(src) {
    const [c, x] = canvas(src.width, src.height);
    x.translate(src.width, 0);
    x.scale(-1, 1);
    x.drawImage(src, 0, 0);
    return c;
  }
  // The ports each body wears, body-relative (chain.js sizes, sim.js filling
  // order): the front discharges, the machine's own right flank takes the
  // first deliveries, the left what is left. Keys are the drawing looks.
  const DOORS = {
    mine: { out: 1, r: 0, l: 0 },
    bigrams: { out: 2, r: 2, l: 0 }, foundry: { out: 2, r: 2, l: 0 },
    words: { out: 2, r: 1, l: 0 }, molder: { out: 2, r: 2, l: 0 },
    lines: { out: 2, r: 2, l: 0 }, fastener: { out: 2, r: 2, l: 0 },
    crane: { out: 2, r: 2, l: 0 }, manufacturer: { out: 2, r: 2, l: 1 },
  };
  // the canvas x of a body tile's centre: art is centred on its tile box
  const tileCx = (W, across, k) => k * 16 + 8 - ((across * 16 - W) >> 1);

  // ---------- how a machine moves: the three states (DESIGN.md, 2026-08-20) ----------
  // Every machine on the map is in exactly one of these, read off the world:
  //   'still' — not automated, nobody working it: nothing moves, the lamp dark
  //   'idle'  — automated with nothing to process: the pose holds, the lamp breathes
  //   'work'  — worked by hand, or automated and processing: everything moves
  // The gap between 'idle' and 'work' is what the player reads, so 'idle'
  // touches one small bead and 'work' drives the big parts.
  const WORK_FRAMES = 4;                  // the work beat
  const IDLE_FRAMES = 6;                  // the idle breath, on a slower clock
  // the bead's ramp across that breath. It never reaches 0: a powered machine
  // must not pass, even for one frame, for a machine nobody automated.
  const IDLE_LAMP = [1, 2, 3, 3, 2, 1];
  // the dials a machine drawer reads: the beat pose, whether the big parts run,
  // how hard the fire is driven, and how bright the signal lamp burns
  function beat(mode, frame) {
    const n = frame | 0;
    if (mode === 'work') {
      const f = ((n % WORK_FRAMES) + WORK_FRAMES) % WORK_FRAMES;
      return { f, run: true, heat: [2, 3, 2, 1][f], lamp: 3 };
    }
    const i = ((n % IDLE_FRAMES) + IDLE_FRAMES) % IDLE_FRAMES;
    return { f: 0, run: false, heat: 0, lamp: mode === 'idle' ? IDLE_LAMP[i] : 0 };
  }

  // ---------- mining rigs, 26x22 (trimmed 2026-08-21) ----------
  // Three hand-me-down machines, each a step up in ambition: a timber
  // prospector rig, a riveted steam extractor, a beam-engine works. Read the
  // silhouette first — derrick, boiler, walking beam — then the brass.
  // Trimmed to their one-deep box when machines learned to turn: a sprite
  // that buried the row behind it buried that row's ports, so a rig keeps
  // at most half a tile of overhang and the vein shows around its feet.
  // The one discharge hatch sits on the left tile, over the bore.
  function mineS(tier, frame, mode) {
    const [c, x] = canvas(26, 22);
    const b = beat(mode === undefined ? 'work' : mode, frame);
    R(x, P.ironO, 2, 20, 22, 2); R(x, P.iron3, 5, 19, 16, 1);      // planted shadow
    if (tier === 1) {
      // Prospector rig: a timber derrick splayed over the bore, the little
      // upright boiler moved to its right, the drill rod bobbing.
      const bob = b.run ? [0, 1, 2, 1][b.f] : 0;
      for (const [lx, ly] of [[8, 3], [7, 8], [6, 13], [13, 3], [14, 8], [15, 13]]) {
        R(x, P.ironO, lx - 1, ly, 4, 6); R(x, P.trunk2, lx, ly, 2, 5); R(x, P.trunk, lx, ly, 1, 5);
      }
      R(x, P.ironO, 6, 10, 12, 2); R(x, P.trunk2, 7, 10, 10, 1);   // the brace
      R(x, P.ironO, 7, 1, 9, 3); R(x, P.trunk2, 8, 2, 7, 1);       // the crown
      R(x, P.ironO, 10, 3 + bob, 3, 11); R(x, P.iron2, 11, 4 + bob, 1, 9); R(x, P.steel, 11, 4 + bob, 1, 3);
      R(x, P.ironO, 9, 13 + bob, 5, 3); R(x, P.iron2, 10, 14 + bob, 3, 1); R(x, P.brass1, 11, 14 + bob, 1, 1);
      M.plate(x, 19, 6, 6, 13);
      M.band(x, 19, 10, 6);
      M.gauge(x, 20, 7);
      M.firebox(x, 20, 15, 4, 3, b.heat);
      M.flue(x, 21, 0, 7); M.puff(x, 22, 0, b.f);
      M.lamp(x, 16, 4, b.lamp);
      R(x, P.dirt3, 2, 18, 3, 1); R(x, P.ironore, 16, 18, 3, 1);
    } else if (tier === 2) {
      // Steam extractor: a riveted boiler-house, twin dials, a turning
      // flywheel, the flue that never stops.
      M.plate(x, 2, 8, 22, 12);
      R(x, P.ironO, 1, 5, 24, 4); R(x, P.iron, 2, 6, 22, 2); R(x, P.ironL, 2, 6, 22, 1);
      M.band(x, 4, 11, 18);
      M.rivets(x, 3, 16, 20, 5);
      R(x, P.ironO, 13, 9, 9, 5); R(x, P.enamD, 14, 10, 7, 3); R(x, P.enam, 14, 10, 7, 2); R(x, P.enamL, 14, 10, 7, 1);
      M.gauge(x, 11, 9);
      M.firebox(x, 12, 15, 5, 4, b.heat);
      M.wheel(x, 21, 16, 2, b.f);
      M.flue(x, 18, 0, 7); M.puff(x, 19, 0, b.f);
      M.lamp(x, 22, 6, b.lamp);
    } else {
      // Beam-engine works: the walking beam rocks on its post, the flywheel
      // turns, the firebox roars. The frontier's real machine.
      const tilt = b.run ? [0, 1, 0, -1][b.f] : 0;
      M.plate(x, 2, 10, 22, 10);
      R(x, P.ironO, 11, 2, 4, 9); R(x, P.iron2, 12, 3, 2, 8);      // the post
      R(x, P.ironO, 2, 3 + tilt, 10, 3); R(x, P.iron2, 3, 4 + tilt, 8, 1); R(x, P.ironL, 3, 4 + tilt, 8, 1);
      R(x, P.ironO, 14, 3 - tilt, 10, 3); R(x, P.iron2, 15, 4 - tilt, 8, 1); R(x, P.ironL, 15, 4 - tilt, 8, 1);
      R(x, P.brass1, 12, 4, 2, 2); R(x, P.brass2, 12, 4, 1, 1);    // the pivot
      R(x, P.ironO, 4, 6 + tilt, 3, 6); R(x, P.iron, 5, 6 + tilt, 1, 5);
      R(x, P.ironO, 20, 6 - tilt, 3, 5); R(x, P.iron, 21, 6 - tilt, 1, 4);
      M.rivets(x, 3, 12, 20, 5);
      M.wheel(x, 19, 15, 3, b.f);
      M.firebox(x, 12, 15, 6, 4, b.heat);
      M.gauge(x, 13, 11);
      M.flue(x, 3, 0, 7); M.puff(x, 4, 0, b.f);
      M.lamp(x, 22, 11, b.lamp);
    }
    M.hatch(x, tileCx(26, 2, 0), 15, true);
    return c;
  }
  // the rigs from behind: the same silhouette mirrored, the fire away, the
  // discharge hatch's crest riding the far edge over the bore
  function mineN(tier, frame, mode) {
    const [c, x] = canvas(26, 22);
    const b = beat(mode === undefined ? 'work' : mode, frame);
    R(x, P.ironO, 2, 20, 22, 2); R(x, P.iron3, 5, 19, 16, 1);
    if (tier === 1) {
      const bob = b.run ? [0, 1, 2, 1][b.f] : 0;
      for (const [lx, ly] of [[12, 3], [11, 8], [10, 13], [17, 3], [18, 8], [19, 13]]) {
        R(x, P.ironO, lx - 1, ly, 4, 6); R(x, P.trunk2, lx, ly, 2, 5); R(x, P.trunk, lx, ly, 1, 5);
      }
      R(x, P.ironO, 10, 10, 12, 2); R(x, P.trunk2, 11, 10, 10, 1);
      R(x, P.ironO, 11, 1, 9, 3); R(x, P.trunk2, 12, 2, 7, 1);
      R(x, P.ironO, 14, 3 + bob, 3, 11); R(x, P.iron2, 15, 4 + bob, 1, 9);
      M.plate(x, 1, 6, 6, 13);
      M.band(x, 1, 10, 6);
      M.flue(x, 3, 0, 7); M.puff(x, 4, 0, b.f);
      M.lamp(x, 8, 4, b.lamp);
    } else if (tier === 2) {
      M.plate(x, 2, 8, 22, 12);
      R(x, P.ironO, 1, 5, 24, 4); R(x, P.iron, 2, 6, 22, 2); R(x, P.ironL, 2, 6, 22, 1);
      M.band(x, 4, 11, 18);
      M.rivets(x, 3, 13, 20, 5);
      M.rivets(x, 3, 17, 20, 5);
      R(x, P.iron3, 11, 9, 1, 10); R(x, P.iron3, 14, 9, 1, 10);    // the service ladder
      for (let ry = 10; ry < 19; ry += 3) R(x, P.iron3, 12, ry, 2, 1);
      M.flue(x, 5, 0, 7); M.puff(x, 6, 0, b.f);
      M.lamp(x, 2, 6, b.lamp);
    } else {
      const tilt = b.run ? [0, 1, 0, -1][b.f] : 0;
      M.plate(x, 2, 10, 22, 10);
      R(x, P.ironO, 11, 2, 4, 9); R(x, P.iron2, 12, 3, 2, 8);
      R(x, P.ironO, 2, 3 - tilt, 10, 3); R(x, P.iron2, 3, 4 - tilt, 8, 1); R(x, P.ironL, 3, 4 - tilt, 8, 1);
      R(x, P.ironO, 14, 3 + tilt, 10, 3); R(x, P.iron2, 15, 4 + tilt, 8, 1); R(x, P.ironL, 15, 4 + tilt, 8, 1);
      R(x, P.brass1, 12, 4, 2, 2);
      R(x, P.ironO, 3, 6 - tilt, 3, 5); R(x, P.iron, 4, 6 - tilt, 1, 4);
      R(x, P.ironO, 19, 6 + tilt, 3, 6); R(x, P.iron, 20, 6 + tilt, 1, 5);
      M.rivets(x, 3, 12, 20, 5);
      M.rivets(x, 3, 16, 20, 5);
      M.wheel(x, 6, 15, 3, b.f);
      M.flue(x, 21, 0, 7); M.puff(x, 22, 0, b.f);
      M.lamp(x, 2, 11, b.lamp);
    }
    M.crest(x, 25 - tileCx(26, 2, 0), 0, true);
    return c;
  }
  // the rigs down their flank: one tile across and two deep, so the boiler
  // stands on the far row and the working iron on the near one; the one
  // discharge door rides the front (right) edge
  function mineE(tier, frame, mode) {
    const [c, x] = canvas(14, 34);
    const b = beat(mode === undefined ? 'work' : mode, frame);
    R(x, P.ironO, 1, 32, 12, 2);
    if (tier === 1) {
      const bob = b.run ? [0, 1, 2, 1][b.f] : 0;
      M.plate(x, 3, 8, 8, 8);                       // the boiler, far row
      M.flue(x, 6, 1, 7); M.puff(x, 7, 0, b.f);
      for (const [lx, ly] of [[4, 17], [3, 22], [9, 17], [10, 22]]) {
        R(x, P.ironO, lx - 1, ly, 4, 6); R(x, P.trunk2, lx, ly, 2, 5); R(x, P.trunk, lx, ly, 1, 5);
      }
      R(x, P.ironO, 4, 15, 6, 3); R(x, P.trunk2, 5, 16, 4, 1);     // the crown
      R(x, P.ironO, 6, 17 + bob, 2, 10); R(x, P.steel, 6, 18 + bob, 1, 3);
      R(x, P.ironO, 5, 27 + bob, 4, 3); R(x, P.iron2, 6, 28 + bob, 2, 1);
      M.lamp(x, 2, 18, b.lamp);
    } else if (tier === 2) {
      M.plate(x, 2, 12, 10, 18);
      R(x, P.ironO, 1, 9, 12, 4); R(x, P.iron, 2, 10, 10, 2); R(x, P.ironL, 2, 10, 10, 1);
      M.band(x, 2, 17, 10);
      M.rivets(x, 3, 24, 8, 3);
      M.gauge(x, 4, 13);
      M.flue(x, 5, 1, 9); M.puff(x, 6, 0, b.f);
      M.lamp(x, 3, 20, b.lamp);
    } else {
      // the beam end-on: its flywheel faces the eye, the one big circle
      M.plate(x, 2, 14, 10, 16);
      R(x, P.ironO, 4, 3, 6, 4); R(x, P.iron2, 5, 4, 4, 2);        // the beam's end
      R(x, P.ironO, 5, 7, 4, 8); R(x, P.iron2, 6, 8, 2, 7);        // the post
      M.wheel(x, 7, 21, 5, b.f);
      M.flue(x, 4, 1, 6); M.puff(x, 5, 0, b.f);
      M.gauge(x, 3, 15);
      M.lamp(x, 10, 15, b.lamp);
    }
    M.jamb(x, 10, 23, 8, true);
    return c;
  }
  function machine(tier, frame, mode, facing) {
    if (facing === 'n') return mineN(tier, frame, mode);
    if (facing === 'e') return mineE(tier, frame, mode);
    if (facing === 'w') return flipX(mineE(tier, frame, mode));
    return mineS(tier, frame, mode);
  }

  // ---------- production stations 30x30 ----------
  // Works buildings in the same idiom: a blast furnace, a crucible foundry,
  // a belt-driven machine shop, an assembly hall. Same kit, heavier iron —
  // each one gets a chimney on the roof, one fire, and one thing that moves.
  // How wide a station is drawn. Two tiles of ground is 30 px of art, three
  // is 46 — chain.js sets the size and this follows it, so the sprite and
  // the tiles a kind claims can never drift apart.
  const STATION_W = { crane: 46, manufacturer: 46 };
  const stationW = (kind) => STATION_W[kind] || 30;
  // the front view — the fully-furnished face every station was born with
  function stationS(kind, frame, mode) {
    const W = stationW(kind);
    const [c, x] = canvas(W, 30);
    const b = beat(mode === undefined ? 'work' : mode, frame);
    R(x, P.ironO, 1, 28, W - 2, 2);
    if (kind === 'bigrams') {
      // SMELTER: a blast furnace that tapers as it climbs, charged from the
      // hopper on top and tapped at the foot into a mould that still glows.
      M.plate(x, 6, 20, 15, 8);                    // hearth
      M.plate(x, 8, 14, 11, 6);                    // mid stack
      M.plate(x, 10, 9, 7, 5);                     // throat
      M.band(x, 8, 14, 11); M.band(x, 6, 20, 15);
      M.rivets(x, 7, 24, 13, 4);
      R(x, P.ironO, 8, 4, 11, 5); R(x, P.iron2, 9, 5, 9, 4); R(x, P.iron, 9, 5, 9, 1);
      const chg = b.run ? [0, 1, 2, 1][b.f] : 0;                 // the charge settles as it burns
      R(x, P.soot, 11, 5, 5, 3); R(x, P.ironore, 12, 5 + chg, 3, 1);   // ore in the hopper
      // the skip hoist: a bucket of ore rides the stack rail while it is charged
      const skip = b.run ? [0, 3, 6, 3][b.f] : 0;
      R(x, P.iron3, 4, 5, 1, 11);
      R(x, P.ironO, 2, 12 - skip, 5, 4); R(x, P.iron2, 3, 13 - skip, 3, 2); R(x, P.ironore, 3, 13 - skip, 3, 1);
      M.firebox(x, 12, 22, 6, 5, b.heat);
      M.flue(x, 23, 4, 11); M.puff(x, 24, 3, b.f);
      R(x, P.ironO, 20, 14, 7, 8); R(x, P.iron2, 21, 15, 5, 6); R(x, P.iron, 21, 15, 5, 1); M.gauge(x, 21, 16);
      // the tap runner: it only flows while the furnace is being charged
      R(x, P.brass1, 16, 25, 6, 1);
      if (b.run) { R(x, P.orange, 16, 25, 6, 1); R(x, P.glow, 16, 25, 2 + b.f, 1); }
      R(x, P.ironO, 21, 24, 7, 5); R(x, P.iron2, 22, 25, 5, 3); R(x, P.orange, 22, 25, 5, 1); R(x, P.glow, 23, 25, 3, 1);
      M.lamp(x, 17, 21, b.lamp);
      M.pipeV(x, 2, 16, 12);
    } else if (kind === 'foundry') {
      // FOUNDRY: a crucible house — twin flues over the fire, and a ladle on
      // its trunnions tipping molten metal into the mould bed below.
      M.plate(x, 2, 13, 26, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      M.rivets(x, 3, 14, 24, 4);
      M.flue(x, 6, 2, 9); M.puff(x, 7, 1, b.f);
      M.flue(x, 20, 4, 7);
      M.gauge(x, 4, 16); M.gauge(x, 10, 16);
      M.firebox(x, 4, 22, 9, 5, b.heat);
      // the ladle tips on its trunnions as it pours, and rights itself between
      const tip = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.ironO, 16, 16 + tip, 9, 8); R(x, P.iron2, 17, 17 + tip, 7, 6); R(x, P.iron, 17, 17 + tip, 7, 2);
      M.band(x, 17, 19 + tip, 7);
      R(x, P.orange, 17, 16 + tip, 7, 1); R(x, P.glow, 19, 16 + tip, 3, 1);
      R(x, P.brass1, 15, 18, 1, 4); R(x, P.brass1, 25, 18, 1, 4);
      if (b.run) { R(x, P.orange, 20, 24 - tip, 1, 2 + tip); R(x, P.glow, 20, 24 - tip, 1, 1 + tip); }
      R(x, P.ironO, 17, 25, 8, 4); R(x, P.iron2, 18, 26, 6, 2); R(x, P.orange, 18, 26, 6, 1); R(x, P.glow, 19, 26, 4, 1);
      M.lamp(x, 16, 22, b.lamp);
    } else if (kind === 'words') {
      // CONSTRUCTOR: a machine shop under a timber truss — a line shaft on
      // brass pulleys, leather belting down to the press, dies at the bench.
      M.plate(x, 2, 14, 26, 14);
      R(x, P.ironO, 0, 6, 30, 5); R(x, P.trunk2, 1, 7, 28, 3); R(x, P.trunk, 1, 7, 28, 1);
      R(x, P.ironO, 3, 11, 24, 2); R(x, P.iron, 4, 11, 22, 1);
      // the line shaft drives everything here: pulleys, belting, then the ram
      M.wheel(x, 7, 12, 2, b.f); M.wheel(x, 15, 12, 2, b.f + 1); M.wheel(x, 22, 12, 2, b.f + 2);
      R(x, P.trunk2, 7, 14, 1, 6); R(x, P.trunk2, 15, 14, 1, 4); R(x, P.trunk2, 22, 14, 1, 5);
      M.band(x, 3, 17, 24);
      M.rivets(x, 4, 25, 22, 5);
      const ram = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.ironO, 4, 20, 9, 8); R(x, P.iron3, 5, 21, 7, 6);
      R(x, P.iron2, 6, 22 + ram, 5, 3); R(x, P.steel, 6, 22 + ram, 5, 1); R(x, P.brass1, 6, 26, 5, 1);
      R(x, P.ironO, 14, 20, 8, 5); R(x, P.enamD, 15, 21, 6, 3); R(x, P.enam, 15, 21, 6, 2); R(x, P.enamL, 15, 21, 6, 1);
      M.gauge(x, 23, 20);
      M.firebox(x, 15, 26, 6, 2, b.heat);
      M.lamp(x, 24, 14, b.lamp);
      M.flue(x, 24, 1, 7); M.puff(x, 25, 0, b.f);
    } else if (kind === 'molder') {
      // MOLDER: a screw press — a tall frame, the big handwheel on the screw
      // over the die box, trays of fresh mouldings cooling on the bench, a
      // small firebox keeping the dies warm.
      M.plate(x, 3, 16, 24, 12);
      R(x, P.ironO, 6, 2, 4, 14); R(x, P.iron2, 7, 3, 2, 13); R(x, P.iron, 7, 3, 1, 13);      // left upright
      R(x, P.ironO, 20, 2, 4, 14); R(x, P.iron2, 21, 3, 2, 13); R(x, P.iron, 21, 3, 1, 13);   // right upright
      R(x, P.ironO, 5, 1, 20, 3); R(x, P.iron, 6, 2, 18, 1); R(x, P.ironL, 6, 2, 18, 1);      // crown
      M.wheel(x, 15, 6, 4, b.f);                                                            // the handwheel
      const screw = b.run ? [0, 1, 2, 1][b.f] : 0;                                          // it drives the die down
      R(x, P.ironO, 14, 9, 3, 5); R(x, P.steel, 15, 10, 1, 4 + screw);                        // the screw
      R(x, P.ironO, 10, 13 + screw, 11, 4); R(x, P.iron2, 11, 14 + screw, 9, 2); R(x, P.brass1, 11, 14 + screw, 9, 1); // die box
      M.band(x, 4, 19, 22);
      M.rivets(x, 5, 25, 20, 4);
      R(x, P.ironO, 4, 22, 8, 4); R(x, P.enamD, 5, 23, 6, 2); R(x, P.enam, 5, 23, 6, 1);     // tray of mouldings
      R(x, P.brass2, 6, 23, 1, 1); R(x, P.brass2, 8, 23, 1, 1);
      M.gauge(x, 22, 21);
      M.firebox(x, 13, 23, 6, 3, b.heat);
      M.lamp(x, 23, 16, b.lamp);
      M.flue(x, 25, 6, 10); M.puff(x, 26, 5, b.f);
    } else if (kind === 'fastener') {
      // FASTENER: a riveting machine — a C-frame with the hammer arm raised
      // over the anvil, a rack of bolts and rivets on the side, a bin of
      // fastened work at the foot.
      M.plate(x, 2, 15, 26, 13);
      R(x, P.ironO, 4, 3, 6, 13); R(x, P.iron2, 5, 4, 4, 12); R(x, P.iron, 5, 4, 2, 12);     // the C-frame post
      R(x, P.ironO, 4, 3, 16, 4); R(x, P.iron2, 5, 4, 14, 2); R(x, P.ironL, 5, 4, 14, 1);    // top arm
      const fall = b.run ? [0, 1, 3, 1][b.f] : 0;                                            // the ram's stroke
      M.wheel(x, 7, 10, 3, b.f);                                                             // the drive pulley
      R(x, P.iron3, 10, 9 + fall, 8, 1); R(x, P.iron2, 10, 10 + fall, 8, 1);                 // the rod to the ram
      R(x, P.ironO, 17, 6, 4, 7 + fall); R(x, P.steel, 18, 7 + fall, 2, 5); R(x, P.iron3, 18, 12 + fall, 2, 1); // hammer ram
      R(x, P.ironO, 15, 13, 8, 3); R(x, P.brass1, 16, 14, 6, 1);                             // anvil
      if (fall === 3) {                                                                      // the blow lands
        R(x, P.glow, 17, 13, 4, 1); R(x, P.brass3, 18, 12, 2, 1);
        R(x, P.orange, 15, 12, 1, 1); R(x, P.glow, 22, 11, 1, 1); R(x, P.brass3, 14, 14, 1, 1);
      }
      R(x, P.ironO, 22, 3, 6, 12); R(x, P.iron2, 23, 4, 4, 10);                               // the rack
      for (let i = 0; i < 4; i++) { R(x, P.steel, 24, 5 + i * 2, 2, 1); R(x, P.brass2, 24, 5 + i * 2, 1, 1); }
      M.band(x, 3, 18, 24);
      M.rivets(x, 4, 24, 22, 4);
      R(x, P.ironO, 4, 21, 9, 5); R(x, P.iron3, 5, 22, 7, 3); R(x, P.brass1, 6, 23, 1, 1); R(x, P.steel, 9, 23, 1, 1); // bin
      M.gauge(x, 16, 20);
      M.firebox(x, 21, 22, 5, 3, b.heat);
      M.lamp(x, 24, 16, b.lamp);
      M.flue(x, 12, 1, 8); M.puff(x, 13, 0, b.f);
    } else if (kind === 'crane') {
      // CRANE: three tiles of ground, and reach is what it spends them on. A
      // lattice jib the full width of the deck on a riveted mast, the
      // trolley running its whole length with the fall under it, and a crate
      // landed at each end of the travel. The winch house burns coal beneath.
      M.plate(x, 2, 17, 42, 11);                                                             // the deck / winch house
      R(x, P.ironO, 19, 6, 8, 12); R(x, P.iron2, 20, 7, 6, 11); R(x, P.iron, 20, 7, 2, 11);  // the mast
      M.rivets(x, 20, 9, 6, 2); M.rivets(x, 20, 14, 6, 2);
      // the jib: two chords with a webbing of posts between them, so the
      // boom reads as a girder and not as a bar laid over the machine
      for (let k = 3; k < 43; k += 4) { R(x, P.iron3, k, 4, 1, 4); R(x, P.iron2, k + 2, 5, 1, 2); }
      R(x, P.ironO, 1, 2, 44, 2); R(x, P.iron, 2, 2, 42, 1); R(x, P.ironL, 2, 2, 42, 1);     // top chord
      R(x, P.ironO, 1, 8, 44, 2); R(x, P.iron3, 2, 8, 42, 1);                                // bottom chord
      const ride = b.run ? [2, 12, 24, 12][b.f] : 2;                                         // the trolley rides the span
      const drop = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.brass1, 4 + ride, 10, 5, 2); R(x, P.brass2, 4 + ride, 10, 3, 1);                // trolley
      R(x, P.steel, 6 + ride, 12, 1, 2 + drop);                                              // the fall
      R(x, P.ironO, 5 + ride, 14 + drop, 3, 2);                                              // the hook block
      R(x, P.ironO, 3, 12, 9, 5); R(x, P.bB, 4, 13, 7, 3); R(x, P.bA, 4, 13, 7, 1);          // a crate landed
      R(x, P.ironO, 33, 12, 9, 5); R(x, P.bB, 34, 13, 7, 3); R(x, P.bA, 34, 13, 7, 1);       // and one waiting
      M.band(x, 3, 20, 40);
      M.rivets(x, 4, 26, 38, 4);
      M.gauge(x, 5, 21); M.gauge(x, 37, 21);
      M.firebox(x, 20, 23, 6, 3, b.heat);
      M.lamp(x, 14, 19, b.lamp);
      M.flue(x, 15, 12, 5); M.puff(x, 16, 11, b.f);
    } else if (kind === 'manufacturer') {
      // MANUFACTURER: the printing house — a long press hall, the platen
      // rising and falling over the bed, a stack of finished pages growing
      // at the delivery end. The one station the factory exists to feed.
      // Three tiles of ground, and the hall spends them on the run of the
      // work: feed tower, two platens on one shaft, the bed between them,
      // then the delivery end where the pages pile. The factory's last
      // machine should look like the longest thing on the field.
      M.plate(x, 1, 12, 44, 16);
      R(x, P.ironO, 0, 9, 46, 4); R(x, P.iron, 1, 10, 44, 2); R(x, P.ironL, 1, 10, 44, 1);   // roofline
      R(x, P.ironO, 3, 2, 5, 8); R(x, P.iron2, 4, 3, 3, 7);                                  // the feed tower
      M.wheel(x, 40, 6, 3, b.f);                                                             // the drive wheel
      R(x, P.iron3, 12, 5, 28, 1);                                                           // the line shaft down the hall
      const fall = b.run ? [0, 2, 4, 2][b.f] : 0;                                            // the platens stroke
      const lift = b.run ? [4, 2, 0, 2][b.f] : 4;                                            // in opposition, so the hall never rests
      R(x, P.ironO, 12, 3, 4, 3 + fall); R(x, P.steel, 13, 4, 2, 2 + fall);                  // near platen ram
      R(x, P.ironO, 26, 3, 4, 3 + lift); R(x, P.steel, 27, 4, 2, 2 + lift);                  // far platen ram
      R(x, P.ironO, 10, 8, 22, 3); R(x, P.brass1, 11, 9, 20, 1);                             // the bed under both
      M.band(x, 2, 15, 42);
      M.rivets(x, 3, 25, 40, 5);
      R(x, P.ironO, 33, 17, 9, 7); R(x, P.enamD, 34, 18, 7, 5); R(x, P.enam, 34, 18, 7, 2); R(x, P.enamL, 34, 18, 7, 1); // dial bank
      M.gauge(x, 35, 19); M.gauge(x, 39, 19);
      const stack = b.run ? [2, 3, 4, 3][b.f] : 2;                                           // pages pile up
      R(x, P.ironO, 3, 25 - stack, 8, stack + 2); R(x, P.paper, 4, 26 - stack, 6, stack); R(x, P.paper2, 4, 26 - stack, 6, 1); // the delivery stack
      M.gauge(x, 13, 20); M.gauge(x, 27, 20);
      M.firebox(x, 19, 24, 6, 3, b.heat);
      M.lamp(x, 6, 14, b.lamp);
      M.flue(x, 4, 1, 8); M.puff(x, 5, 0, b.f);
    } else {
      // ASSEMBLER: the big hall — a gantry over the floor, a heavy flywheel,
      // a bank of dials on oxblood, and the firebox that drives it all.
      M.plate(x, 1, 13, 28, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      R(x, P.ironO, 1, 3, 18, 3); R(x, P.iron2, 2, 4, 16, 2); R(x, P.ironL, 2, 4, 16, 1);
      R(x, P.ironO, 2, 6, 4, 5); R(x, P.iron2, 3, 6, 2, 5);
      R(x, P.ironO, 14, 6, 4, 5); R(x, P.iron2, 15, 6, 2, 5);
      const trav = b.run ? [0, 1, 2, 1][b.f] : 0;                                  // the hoist travels the gantry
      R(x, P.iron3, 10 + trav, 6, 1, 4); R(x, P.ironO, 8 + trav, 10, 5, 3); R(x, P.trunk, 9 + trav, 11, 3, 1);
      M.band(x, 2, 16, 26);
      M.rivets(x, 3, 25, 24, 5);
      M.wheel(x, 7, 22, 5, b.f);
      R(x, P.ironO, 14, 19, 13, 5); R(x, P.enamD, 15, 20, 11, 3); R(x, P.enam, 15, 20, 11, 2); R(x, P.enamL, 15, 20, 11, 1);
      M.gauge(x, 16, 19); M.gauge(x, 22, 19);
      M.firebox(x, 15, 25, 10, 3, b.heat);
      M.lamp(x, 3, 13, b.lamp);
      M.pipeH(x, 1, 24, 5);
      M.flue(x, 23, 1, 10); M.puff(x, 24, 0, b.f);
    }
    doorsS(x, kind, W);
    return c;
  }
  // ---------- the doors each view wears (rotation overhaul, 2026-08-21) ----------
  // The same ports, told three ways by where their side stands in this view:
  // hatches on the visible face, jambs on a near edge, crests over the far
  // silhouette. Slot order turns with the body — a flank's first place is
  // its front corner — so a door never swaps tiles when the machine does.
  function doorsS(x, kind, W) {
    const d = DOORS[kind] || DOORS.lines;
    const across = W > 40 ? 3 : 2;
    for (let k = 0; k < d.out; k++) M.hatch(x, tileCx(W, across, k), 22, true);
    for (let s = 0; s < d.r; s++) M.jamb(x, 1, s ? 10 : 19, 7, false);      // right flank: the west edge
    for (let s = 0; s < d.l; s++) M.jamb(x, W - 4, s ? 10 : 19, 7, false);  // left flank: the east edge
  }
  // how high each back silhouette carries its crests (tuned on the proof sheet)
  const CREST_Y = { bigrams: 4, foundry: 10, words: 6, molder: 1, lines: 3, fastener: 3, crane: 2, manufacturer: 9 };
  function doorsN(x, kind, W) {
    const d = DOORS[kind] || DOORS.lines;
    const across = W > 40 ? 3 : 2;
    const cy = CREST_Y[kind] === undefined ? 2 : CREST_Y[kind];
    for (let k = 0; k < d.out; k++) M.crest(x, W - 1 - tileCx(W, across, k), cy, true);
    for (let s = 0; s < d.r; s++) M.jamb(x, W - 4, s ? 19 : 10, 7, false);  // right flank: now the east edge, front corner far
    for (let s = 0; s < d.l; s++) M.jamb(x, 1, s ? 19 : 10, 7, false);
  }
  // The side views' doors are facing-aware where the body is not: facing
  // east the visible flank is the machine's right, facing west its left —
  // so the flipped body wears the OTHER flank's fixtures, or the doors
  // would sit on a face whose plates lie behind the machine. Drawn before
  // the flip, so a hatch placed at the canvas' right lands at the front
  // (the left) once the west view is turned over.
  function doorsE(x, kind, W, H, west) {
    const d = DOORS[kind] || DOORS.lines;
    const face = west ? d.l : d.r, far = west ? d.r : d.l;
    // the visible flank's hatches, the front corner first — and the front
    // is the canvas' right edge before any flip
    for (let s = 0; s < face; s++) M.hatch(x, tileCx(W, 2, 1 - s), H - 8, false);
    const jy = H > 40 ? [H - 13, H - 26, H - 39] : [19, 10];
    for (let k = 0; k < d.out; k++) M.jamb(x, W - 4, jy[k], 7, true);
    // the hidden flank's lintels ride the far silhouette
    for (let s = 0; s < far; s++) M.crest(x, tileCx(W, 2, 1 - s), 1, false);
  }
  // ---------- the back views: the same massing, mirrored ----------
  // A half turn swaps left for right, so a stack on the front view's left
  // stands on the back view's right. The fire, the dials and the delivery
  // furniture face away; what shows is service iron — rivets, ladders, the
  // flues still puffing — and the lamp, which must read from every side.
  function stationN(kind, frame, mode) {
    const W = stationW(kind);
    const [c, x] = canvas(W, 30);
    const b = beat(mode === undefined ? 'work' : mode, frame);
    R(x, P.ironO, 1, 28, W - 2, 2);
    if (kind === 'bigrams') {
      // the furnace from behind: the same climb, mirrored — hopper, throat,
      // mid stack, hearth — the skip rail now on the right, the fire away
      M.plate(x, 9, 20, 15, 8);
      M.plate(x, 11, 14, 11, 6);
      M.plate(x, 13, 9, 7, 5);
      M.band(x, 11, 14, 11); M.band(x, 9, 20, 15);
      M.rivets(x, 10, 24, 13, 4);
      R(x, P.ironO, 11, 4, 11, 5); R(x, P.iron2, 12, 5, 9, 4); R(x, P.iron, 12, 5, 9, 1);
      const skip = b.run ? [0, 3, 6, 3][b.f] : 0;
      R(x, P.iron3, 25, 5, 1, 11);
      R(x, P.ironO, 23, 12 - skip, 5, 4); R(x, P.iron2, 24, 13 - skip, 3, 2); R(x, P.ironore, 24, 13 - skip, 3, 1);
      M.flue(x, 3, 4, 11); M.puff(x, 4, 3, b.f);
      R(x, P.ironO, 3, 14, 7, 8); R(x, P.iron2, 4, 15, 5, 6); R(x, P.iron, 4, 15, 5, 1);
      M.lamp(x, 10, 21, b.lamp);
    } else if (kind === 'foundry') {
      // the crucible house from behind: twin flues swapped, a charging
      // ladder up the wall, and the sheet all rivets
      M.plate(x, 2, 13, 26, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      M.rivets(x, 3, 15, 24, 4);
      M.rivets(x, 3, 22, 24, 4);
      M.flue(x, 20, 2, 9); M.puff(x, 21, 1, b.f);
      M.flue(x, 6, 4, 7);
      R(x, P.iron3, 12, 14, 1, 12); R(x, P.iron3, 16, 14, 1, 12);
      for (let ry = 15; ry < 26; ry += 3) R(x, P.iron3, 13, ry, 3, 1);
      M.gauge(x, 23, 16);
      M.lamp(x, 11, 22, b.lamp);
    } else if (kind === 'words') {
      // the shop's back: the truss and a plank wall, the flue swapped left,
      // the line shaft's end bearing turning past the boards
      M.plate(x, 2, 14, 26, 14);
      R(x, P.ironO, 0, 6, 30, 5); R(x, P.trunk2, 1, 7, 28, 3); R(x, P.trunk, 1, 7, 28, 1);
      R(x, P.ironO, 3, 11, 24, 2); R(x, P.iron, 4, 11, 22, 1);
      for (let pk = 6; pk < 26; pk += 5) R(x, P.iron3, pk, 15, 1, 12);
      M.band(x, 3, 17, 24);
      M.wheel(x, 8, 12, 2, b.f);
      M.gauge(x, 22, 20);
      M.lamp(x, 3, 14, b.lamp);
      M.flue(x, 3, 1, 7); M.puff(x, 4, 0, b.f);
    } else if (kind === 'molder') {
      // the press from behind: the frame reads whole — uprights, crown, the
      // handwheel on its screw — the trays and the fire away
      M.plate(x, 3, 16, 24, 12);
      R(x, P.ironO, 6, 2, 4, 14); R(x, P.iron2, 7, 3, 2, 13); R(x, P.iron, 7, 3, 1, 13);
      R(x, P.ironO, 20, 2, 4, 14); R(x, P.iron2, 21, 3, 2, 13); R(x, P.iron, 21, 3, 1, 13);
      R(x, P.ironO, 5, 1, 20, 3); R(x, P.iron, 6, 2, 18, 1); R(x, P.ironL, 6, 2, 18, 1);
      M.wheel(x, 15, 6, 4, b.f);
      const screw = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.ironO, 14, 9, 3, 5); R(x, P.steel, 15, 10, 1, 4 + screw);
      M.band(x, 4, 19, 22);
      M.rivets(x, 5, 25, 20, 4);
      M.flue(x, 2, 6, 10); M.puff(x, 3, 5, b.f);
      M.lamp(x, 5, 16, b.lamp);
    } else if (kind === 'fastener') {
      // the riveter from behind: the C-frame's spine and the rack's back,
      // the drive pulley still turning past the frame
      M.plate(x, 2, 15, 26, 13);
      R(x, P.ironO, 20, 3, 6, 13); R(x, P.iron2, 21, 4, 4, 12); R(x, P.iron, 23, 4, 2, 12);
      R(x, P.ironO, 10, 3, 16, 4); R(x, P.iron2, 11, 4, 14, 2); R(x, P.ironL, 11, 4, 14, 1);
      M.wheel(x, 23, 10, 3, b.f);
      R(x, P.ironO, 2, 3, 6, 12); R(x, P.iron2, 3, 4, 4, 10);
      M.rivets(x, 3, 6, 4, 3); M.rivets(x, 3, 10, 4, 3);
      M.band(x, 3, 18, 24);
      M.rivets(x, 4, 24, 22, 4);
      M.gauge(x, 12, 20);
      M.flue(x, 14, 1, 8); M.puff(x, 15, 0, b.f);
      M.lamp(x, 3, 16, b.lamp);
    } else if (kind === 'crane') {
      // the crane from behind: everything that matters rides above the deck
      // and shows from every side — the jib, the trolley, the fall — over a
      // plainer winch house, the crates' far sides at its feet
      M.plate(x, 2, 17, 42, 11);
      R(x, P.ironO, 19, 6, 8, 12); R(x, P.iron2, 20, 7, 6, 11); R(x, P.iron, 24, 7, 2, 11);
      M.rivets(x, 20, 9, 6, 2); M.rivets(x, 20, 14, 6, 2);
      for (let k = 3; k < 43; k += 4) { R(x, P.iron3, k, 4, 1, 4); R(x, P.iron2, k + 2, 5, 1, 2); }
      R(x, P.ironO, 1, 2, 44, 2); R(x, P.iron, 2, 2, 42, 1); R(x, P.ironL, 2, 2, 42, 1);
      R(x, P.ironO, 1, 8, 44, 2); R(x, P.iron3, 2, 8, 42, 1);
      const ride = b.run ? [2, 12, 24, 12][b.f] : 2;
      const drop = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.brass1, 37 - ride, 10, 5, 2); R(x, P.brass2, 39 - ride, 10, 3, 1);
      R(x, P.steel, 39 - ride, 12, 1, 2 + drop);
      R(x, P.ironO, 38 - ride, 14 + drop, 3, 2);
      R(x, P.ironO, 34, 12, 9, 5); R(x, P.bB, 35, 13, 7, 3); R(x, P.bA, 35, 13, 7, 1);
      R(x, P.ironO, 3, 12, 9, 5); R(x, P.bB, 4, 13, 7, 3); R(x, P.bA, 4, 13, 7, 1);
      M.band(x, 3, 20, 40);
      M.rivets(x, 4, 26, 38, 4);
      M.flue(x, 27, 12, 5); M.puff(x, 28, 11, b.f);
      M.lamp(x, 29, 19, b.lamp);
    } else if (kind === 'manufacturer') {
      // the hall from behind: the long roofline, the feed tower at the far
      // right, both platens still striding, the wall a run of rivets where
      // the dials and the delivery stack face away
      M.plate(x, 1, 12, 44, 16);
      R(x, P.ironO, 0, 9, 46, 4); R(x, P.iron, 1, 10, 44, 2); R(x, P.ironL, 1, 10, 44, 1);
      R(x, P.ironO, 38, 2, 5, 8); R(x, P.iron2, 39, 3, 3, 7);
      M.wheel(x, 6, 6, 3, b.f);
      R(x, P.iron3, 6, 5, 28, 1);
      const fall = b.run ? [0, 2, 4, 2][b.f] : 0;
      const lift = b.run ? [4, 2, 0, 2][b.f] : 4;
      R(x, P.ironO, 30, 3, 4, 3 + fall); R(x, P.steel, 31, 4, 2, 2 + fall);
      R(x, P.ironO, 16, 3, 4, 3 + lift); R(x, P.steel, 17, 4, 2, 2 + lift);
      R(x, P.ironO, 14, 8, 22, 3); R(x, P.brass1, 15, 9, 20, 1);
      M.band(x, 2, 15, 42);
      M.rivets(x, 3, 19, 40, 4);
      M.rivets(x, 3, 25, 40, 5);
      M.flue(x, 38, 1, 8); M.puff(x, 39, 0, b.f);
      M.lamp(x, 37, 14, b.lamp);
    } else {
      // the assembler's back: gantry legs mirrored, the hoist still on its
      // travel, the pipe run swapped, a riveted back sheet
      M.plate(x, 1, 13, 28, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      R(x, P.ironO, 11, 3, 18, 3); R(x, P.iron2, 12, 4, 16, 2); R(x, P.ironL, 12, 4, 16, 1);
      R(x, P.ironO, 24, 6, 4, 5); R(x, P.iron2, 25, 6, 2, 5);
      R(x, P.ironO, 12, 6, 4, 5); R(x, P.iron2, 13, 6, 2, 5);
      const trav = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.iron3, 19 - trav, 6, 1, 4); R(x, P.ironO, 17 - trav, 10, 5, 3); R(x, P.trunk, 18 - trav, 11, 3, 1);
      M.band(x, 2, 16, 26);
      M.rivets(x, 3, 25, 24, 5);
      M.pipeH(x, 24, 24, 5);
      M.flue(x, 3, 1, 10); M.puff(x, 4, 0, b.f);
      M.lamp(x, 24, 13, b.lamp);
    }
    doorsN(x, kind, W);
    return c;
  }
  // ---------- the side views: the body down its flank ----------
  // Facing east: the camera still looks from the south, so the visible face
  // is the machine's own right flank and the front is the canvas' right
  // edge. Facing west is this, flipped — the way the operator's side sprite
  // already turns. A kind three tiles across stands three tiles deep here,
  // so the last two kinds run away from the eye.
  const STATION_EH = { crane: 46, manufacturer: 46 };
  function stationE(kind, frame, mode, west) {
    const W = 30, H = STATION_EH[kind] || 30;
    const [c, x] = canvas(W, H);
    const b = beat(mode === undefined ? 'work' : mode, frame);
    R(x, P.ironO, 1, H - 2, W - 2, 2);
    if (kind === 'bigrams') {
      // the furnace down its flank: the stack climbing toward the front,
      // the skip rail up the back, the tap's glow round the front corner
      M.plate(x, 4, 20, 24, 8);
      M.plate(x, 12, 14, 14, 6);
      M.plate(x, 16, 9, 9, 5);
      M.band(x, 12, 14, 14); M.band(x, 4, 20, 24);
      M.rivets(x, 5, 24, 22, 4);
      R(x, P.ironO, 15, 4, 11, 5); R(x, P.iron2, 16, 5, 9, 4); R(x, P.iron, 16, 5, 9, 1);
      const skip = b.run ? [0, 3, 6, 3][b.f] : 0;
      R(x, P.ironO, 3, 4, 3, 17); R(x, P.iron3, 4, 5, 1, 15); R(x, P.ironL, 4, 5, 1, 2);
      R(x, P.ironO, 2, 12 - skip, 5, 4); R(x, P.iron2, 3, 13 - skip, 3, 2); R(x, P.ironore, 3, 13 - skip, 3, 1);
      M.flue(x, 10, 3, 9); M.puff(x, 11, 2, b.f);
      if (b.run) { R(x, P.orange, 26, 26, 3, 1); R(x, P.glow, 27, 26, 2, 1); }
      M.gauge(x, 6, 21);
      M.lamp(x, 22, 21, b.lamp);
    } else if (kind === 'foundry') {
      // the crucible house down its flank: the two flues in file — the near
      // one tall — and the ladle's trunnion arm on the front wall
      M.plate(x, 2, 13, 26, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      M.rivets(x, 3, 14, 24, 4);
      M.flue(x, 18, 2, 9); M.puff(x, 19, 1, b.f);
      M.flue(x, 7, 4, 7);
      const tip = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.ironO, 22, 16 + tip, 6, 6); R(x, P.iron2, 23, 17 + tip, 4, 4); R(x, P.orange, 23, 17 + tip, 4, 1);
      M.gauge(x, 4, 16);
      M.lamp(x, 16, 22, b.lamp);
    } else if (kind === 'words') {
      // the shop end-on: the timber gable is the tell — the truss peak, the
      // shaft's last pulley under it, the press ram inside the open bay
      M.plate(x, 2, 14, 26, 14);
      R(x, P.ironO, 2, 9, 26, 3); R(x, P.trunk2, 3, 10, 24, 1);
      R(x, P.ironO, 6, 6, 18, 3); R(x, P.trunk2, 7, 7, 16, 1);
      R(x, P.ironO, 11, 3, 8, 3); R(x, P.trunk, 12, 4, 6, 1);
      M.wheel(x, 15, 12, 2, b.f);
      R(x, P.trunk2, 15, 14, 1, 5);
      M.band(x, 3, 17, 24);
      M.rivets(x, 4, 25, 22, 4);
      const ram = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.ironO, 8, 19, 8, 8); R(x, P.iron3, 9, 20, 6, 6); R(x, P.iron2, 10, 21 + ram, 4, 2); R(x, P.steel, 10, 21 + ram, 4, 1);
      M.gauge(x, 22, 17);
      M.lamp(x, 4, 16, b.lamp);
      M.flue(x, 23, 1, 7); M.puff(x, 24, 0, b.f);
    } else if (kind === 'molder') {
      // the press in profile: one deep upright, the crown's end, the
      // handwheel edge-on as a turning brass slab, the screw past the wall
      M.plate(x, 3, 16, 24, 12);
      R(x, P.ironO, 12, 2, 5, 14); R(x, P.iron2, 13, 3, 3, 13); R(x, P.iron, 13, 3, 1, 13);
      R(x, P.ironO, 10, 1, 9, 3); R(x, P.iron, 11, 2, 7, 1);
      const spin = b.run ? b.f % 2 : 0;
      R(x, P.ironO, 15, 4, 2, 7); R(x, P.brass1, 15, 5 + spin, 2, 5 - spin); R(x, P.brass2, 15, 5 + spin, 2, 1);
      const screw = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.ironO, 19, 9, 3, 5); R(x, P.steel, 20, 10, 1, 4 + screw);
      R(x, P.ironO, 17, 13 + screw, 9, 4); R(x, P.iron2, 18, 14 + screw, 7, 2); R(x, P.brass1, 18, 14 + screw, 7, 1);
      M.band(x, 4, 19, 22);
      M.rivets(x, 5, 25, 20, 4);
      M.gauge(x, 6, 18);
      M.lamp(x, 6, 22, b.lamp);
      M.flue(x, 5, 6, 10); M.puff(x, 6, 5, b.f);
    } else if (kind === 'fastener') {
      // the riveter in true profile: the C reads whole — spine up the back,
      // arm over, the ram falling inside its open jaw at the front
      M.plate(x, 2, 15, 26, 13);
      R(x, P.ironO, 4, 3, 6, 14); R(x, P.iron2, 5, 4, 4, 13); R(x, P.iron, 5, 4, 2, 13);
      R(x, P.ironO, 4, 3, 20, 4); R(x, P.iron2, 5, 4, 18, 2); R(x, P.ironL, 5, 4, 18, 1);
      const fall = b.run ? [0, 1, 3, 1][b.f] : 0;
      M.wheel(x, 8, 10, 3, b.f);
      R(x, P.ironO, 19, 6, 4, 7 + fall); R(x, P.steel, 20, 7 + fall, 2, 5); R(x, P.iron3, 20, 12 + fall, 2, 1);
      R(x, P.ironO, 17, 13, 8, 3); R(x, P.brass1, 18, 14, 6, 1);
      if (fall === 3) { R(x, P.glow, 19, 13, 4, 1); R(x, P.brass3, 20, 12, 2, 1); }
      M.band(x, 3, 18, 24);
      M.rivets(x, 4, 24, 22, 4);
      M.gauge(x, 13, 20);
      M.flue(x, 12, 1, 8); M.puff(x, 13, 0, b.f);
      M.lamp(x, 25, 17, b.lamp);
    } else if (kind === 'crane') {
      // the crane end-on: the boom runs away from the eye — the mast up the
      // middle, the lattice diminishing north — the deck three tiles deep
      // with a crate landed at its foot
      M.plate(x, 2, 17, 26, 27);
      R(x, P.ironO, 11, 6, 8, 12); R(x, P.iron2, 12, 7, 6, 11); R(x, P.iron, 12, 7, 2, 11);
      M.rivets(x, 12, 9, 6, 2); M.rivets(x, 12, 14, 6, 2);
      R(x, P.ironO, 6, 2, 18, 2); R(x, P.iron, 7, 2, 16, 1);
      R(x, P.ironO, 6, 8, 18, 2); R(x, P.iron3, 7, 8, 16, 1);
      for (let k = 7; k < 23; k += 4) R(x, P.iron3, k, 4, 1, 4);
      const drop = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.brass1, 13, 10, 5, 2); R(x, P.steel, 15, 12, 1, 2 + drop); R(x, P.ironO, 14, 14 + drop, 3, 2);
      R(x, P.ironO, 5, 20, 9, 5); R(x, P.bB, 6, 21, 7, 3); R(x, P.bA, 6, 21, 7, 1);
      M.band(x, 3, 26, 24);
      M.rivets(x, 4, 32, 22, 4);
      M.rivets(x, 4, 38, 22, 5);
      M.gauge(x, 6, 28); M.gauge(x, 22, 34);
      M.flue(x, 22, 12, 5); M.puff(x, 23, 11, b.f);
      M.lamp(x, 5, 18, b.lamp);
    } else if (kind === 'manufacturer') {
      // the printing hall end-on: the gable of the longest building there
      // is, the feed tower on the near wall, one platen striding over the
      // roof, the wall running three tiles back in rivets and dials
      M.plate(x, 1, 12, 28, 32);
      R(x, P.ironO, 0, 9, 30, 4); R(x, P.iron, 1, 10, 28, 2); R(x, P.ironL, 1, 10, 28, 1);
      R(x, P.ironO, 4, 2, 5, 8); R(x, P.iron2, 5, 3, 3, 7);
      M.wheel(x, 24, 6, 3, b.f);
      const fall = b.run ? [0, 2, 4, 2][b.f] : 0;
      R(x, P.ironO, 14, 3, 4, 3 + fall); R(x, P.steel, 15, 4, 2, 2 + fall);
      R(x, P.iron3, 10, 5, 12, 1);
      M.band(x, 2, 15, 26);
      M.rivets(x, 3, 20, 24, 4);
      M.rivets(x, 3, 27, 24, 5);
      M.rivets(x, 3, 34, 24, 5);
      R(x, P.ironO, 4, 22, 9, 7); R(x, P.enamD, 5, 23, 7, 5); R(x, P.enam, 5, 23, 7, 2); R(x, P.enamL, 5, 23, 7, 1);
      M.gauge(x, 6, 24); M.gauge(x, 10, 24);
      const stack = b.run ? [2, 3, 4, 3][b.f] : 2;
      R(x, P.ironO, 22, 41 - stack, 6, stack + 2); R(x, P.paper, 23, 42 - stack, 4, stack);
      M.flue(x, 6, 1, 8); M.puff(x, 7, 0, b.f);
      M.lamp(x, 25, 14, b.lamp);
    } else {
      // the assembler end-on: the gantry portal — two legs and the beam's
      // end — the hoist's chain dropping inside the bay
      M.plate(x, 1, 13, 28, 15);
      R(x, P.ironO, 0, 10, 30, 4); R(x, P.iron, 1, 11, 28, 2); R(x, P.ironL, 1, 11, 28, 1);
      R(x, P.ironO, 8, 3, 14, 3); R(x, P.iron2, 9, 4, 12, 2); R(x, P.ironL, 9, 4, 12, 1);
      R(x, P.ironO, 8, 6, 4, 5); R(x, P.iron2, 9, 6, 2, 5);
      R(x, P.ironO, 18, 6, 4, 5); R(x, P.iron2, 19, 6, 2, 5);
      const trav = b.run ? [0, 1, 2, 1][b.f] : 0;
      R(x, P.iron3, 14, 6 + trav, 1, 3); R(x, P.ironO, 12, 9 + trav, 5, 3); R(x, P.trunk, 13, 10 + trav, 3, 1);
      M.band(x, 2, 16, 26);
      M.rivets(x, 3, 25, 24, 5);
      M.wheel(x, 24, 22, 4, b.f);
      M.gauge(x, 5, 19);
      M.flue(x, 5, 1, 10); M.puff(x, 6, 0, b.f);
      M.lamp(x, 26, 14, b.lamp);
    }
    doorsE(x, kind, W, H, west);
    return c;
  }
  // one station, four ways up: s is the authored front, n the authored
  // back, e the authored flank — and w is e flipped, the way the operator's
  // own side sprite turns, with the doors of the flank that actually shows
  function station(kind, frame, mode, facing) {
    if (facing === 'n') return stationN(kind, frame, mode);
    if (facing === 'e') return stationE(kind, frame, mode);
    if (facing === 'w') return flipX(stationE(kind, frame, mode, true));
    return stationS(kind, frame, mode);
  }

  // ---------- freight depot 44x36, 4 frames (crane hook cycles) ----------
  // A timber loading stage with an iron crane and a steam donkey engine
  // chuffing away beside the crates.
  function press(frame, mode) {
    const [c, x] = canvas(44, 36);
    const b = beat(mode === undefined ? 'work' : mode, frame);
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
    M.wheel(x, 22, 7, 2, b.f);
    const hy = b.run ? [14, 17, 20, 17][b.f] : 14;   // the hook parks at the sheave when idle
    R(x, P.iron3, 22, 9, 1, hy - 9);
    R(x, P.ironO, 18, hy, 9, 6); R(x, P.trunk, 19, hy + 1, 7, 4); R(x, P.brass1, 19, hy + 3, 7, 1);
    // steam donkey engine beside the mast
    M.plate(x, 37, 19, 6, 9);
    M.band(x, 37, 22, 6);
    M.firebox(x, 38, 25, 4, 3, b.heat);
    M.flue(x, 38, 9, 10); M.puff(x, 39, 8, b.f);
    M.gauge(x, 28, 20);
    // signal lantern on the mast: it winks green under way, else it is the
    // machine's state bead — breathing amber while it waits, dark when it is off
    if (!b.run && b.lamp >= 2) {
      x.fillStyle = b.lamp >= 3 ? 'rgba(255,226,138,0.30)' : 'rgba(255,226,138,0.14)';
      x.fillRect(28, 9, 5, 8);
    }
    R(x, P.ironO, 28, 9, 5, 8); R(x, P.brass1, 29, 10, 3, 6); R(x, P.brass2, 29, 10, 1, 6);
    R(x, b.run ? (b.f % 2 ? P.green : P.glow) : [P.iron3, P.brass1, P.orange, P.glow][b.lamp], 30, 11, 2, 4);
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

  // ---------- the operator: a fantasy mechanic, 20x28 ----------
  // WHO HE IS (user ruling, 2026-08-21): the man who works on airships. A
  // leather flight cap with brass goggles strapped to it, an aviator's scarf
  // in verdigris, a long working coat, a leather rig across the chest with a
  // brass pressure gauge that still has a light in it, heavy gloves and
  // boots. He is dressed out of the machines' own material list — iron dark,
  // brass, verdigris, and one warm fire — because he is the man who keeps
  // them running. Not a builder in a hard hat, and nothing futuristic.
  //
  // WHAT THE CROSSCODE REFERENCE TEACHES (measured off the sheets in
  // assets/inbox — 12 and 21 colours, 32x32 and 32x40 cells):
  //   · ~30% of a sprite is ONE near-black tone, and that tone is both the
  //     outline and the shadow side. Nothing is outlined in neutral ink, and
  //     the dark is a saturated dark — Lea's is #3f0412, not black.
  //   · Highlights are 3-5% of the pixels, near-white, in three or four
  //     places. One saturated accent hue carries the eye; the rest is dark.
  //   · The head is a third of the height, and it is the widest part of the
  //     sprite — the body is narrower than the head.
  //   · The gait swings hard: leg spread nearly doubles between passing and
  //     contact, and the silhouette's width changes by a third across a cycle.
  //
  // The cap is what makes that value structure work. Drawn with bare hair, a
  // head-sized slab of mid-brown became the brightest thing on the sprite —
  // the exact inverse of the rule. Dark leather takes that area back, and the
  // brass on top of it is then the only bright thing above the belt.
  //
  // dir: 'down' | 'up' | 'side' (side faces RIGHT; factory mirrors for left).
  const OPW = 20, OPH = 28;                   // the feet ride the last row
  const OP_HIP = 21;                          // first row below the coat hem
  const OP_KEY = {
    '.': null,
    n: P.coatN, b: P.coatD, B: P.coat, l: P.coatL,
    p: P.capD, P: P.cap, Q: P.capL,
    t: P.teal2, T: P.teal, V: P.teal3,
    g: P.brassD, G: P.brass1, L: P.brass2,
    a: P.hairD, A: P.hair,
    s: P.skinD, S: P.skin,
    E: P.eye, I: P.iris, W: P.white,
    r: P.leathD, R: P.leath,
    F: P.glow,
  };
  // every grid row is OPW wide; a short row is a bug, not a shrug
  function opGrid(x, rows, ox, oy) {
    rows.forEach((row, ry) => {
      if (row.length !== OPW) throw new Error('operator row ' + ry + ' is ' + row.length + ' wide, want ' + OPW);
      for (let cx = 0; cx < OPW; cx++) {
        const col = OP_KEY[row[cx]];
        if (col) R(x, col, ox + cx, oy + ry, 1, 1);
      }
    });
  }

  // ---- head, rows 0-11: cap (4), goggles (3), face (5) ----
  // The goggles carry the whole read at ten pixels: a full-brass rim around
  // verdigris glass, sitting on a strap darker than the cap. Drawn with a
  // dark rim they vanished into the leather; drawn with a head-wide dark
  // strap the sprite wore a blindfold. A tuft of copper hair escapes at each
  // temple so he is a man and not a helmet.
  const HEAD_D = [
    '......pQQPPPPp......',
    '.....pQQQPPPPPp.....',
    '....pQQPPPPPPPPp....',
    '....pPPPPPPPPPGp....',
    '....pGLLGnnGLLGp....',
    '....pGVtGnnGVtGp....',
    '....pgGGgnngGGgp....',
    '....pAssssssssAp....',
    '....aSWESSSSWEsa....',
    '....aSEESSSsEEsa....',
    '....AsSSSSSSsssA....',
    '.....asSSSSsssa.....',
  ];
  const HEAD_U = [
    '......pQQPPPPp......',
    '.....pQQQPPPPPp.....',
    '....pQQPPPPPPPPp....',
    '....pPPPPPPPPPGp....',
    '....pnGGGnnGGGnp....',
    '....pPPPPPPPPPPp....',
    '....pPPPPPPPPPPp....',
    '....pPPPPPPPPPPp....',
    '....paAAAAAAAAap....',
    '.....aAAAAAAAAa.....',
    '.....asAAAAAAsa.....',
    '.....asSSSSSSsa.....',
  ];
  const HEAD_S = [
    '.....pQQPPPPp.......',
    '....pQQQPPPPPp......',
    '...pQQPPPPPPPp......',
    '...pPPPPPPPPGp......',
    '...pPPPPPnGLLGp.....',
    '...pPPPPPnGVtGp.....',
    '...pPPPPPngGGgp.....',
    '...pPAAsssssssp.....',
    '...pAAaSSWISSSs.....',
    '...pAAaSSEESSSs.....',
    '....pAaasSSSSs......',
    '.....paasSSSs.......',
  ];

  // ---- torso, rows 12-20 ----
  // Scarf, then the coat: near-black body lit only down the near lapel, a
  // leather rig crossing the chest, and the gauge burning on it. The sleeves
  // are part of the grid so the arms never read as blocks floating beside the
  // coat — only the gloves move.
  const TORSO_D = [
    '....tVVTTTTTTttt....',
    '..nlBBbtTTtbBBbbnn..',
    '.nBbnRrBBbbgGgnnbbn.',
    '.nBbnBRrBbbGFGnnbbn.',
    '.nBbnBbRrbbgggnnbbn.',
    '.nBbnrRRRLGRRRrnbbn.',
    '.nBbnBbnbbnbBbnnbbn.',
    '..nnbBbnnnnbBbnnnn..',
    '.nnbBbnnnnnbBbnnnnn.',
  ];
  const TORSO_U = [
    '....tVVTTTTTTttt....',
    '..nlBBBBBBBBBBbbnn..',
    '.nBbnRrBBBBBBbnnbbn.',
    '.nBbnBRrgGLgBbnnbbn.',
    '.nBbnBbRgGGgBbnnbbn.',
    '.nBbnrRRRLGRRRrnbbn.',
    '.nBbnBbnbbnbBbnnbbn.',
    '..nnbBbnnnnbBbnnnn..',
    '.nnbBbnnnnnbBbnnnnn.',
  ];
  const TORSO_S = [
    '....tVVTTTTTtt......',
    '...nnlBBTTBBbn......',
    '...nnlBRrBBBbn......',
    '...nnBBRrGFBbn......',
    '...nnBBbRrggbn......',
    '...nnrRRLGRRrn......',
    '...nnBBbbbBBbn......',
    '..nnnbBbnnbBbnn.....',
    '..nnbBbnnnbBbnnn....',
  ];
  // at the machine: back to us, the belting spool and its strap on his back
  const TORSO_WORK = [
    '....tVVTTTTTTttt....',
    '..nlBBBBBBBBBBbbnn..',
    '...nBRrBBBBBBBbn....',
    '...nBBRrgGLgBBbn....',
    '...nBBbRgGGgBBbn....',
    '...nrRRRLGRRRrrbn...',
    '...nBbnbbnbBbnbbn...',
    '..nnbBbnnnnbBbnnnn..',
    '.nnbBbnnnnnbBbnnnnn.',
  ];

  // ---- legs, drawn not gridded ----
  // A leg is a 4px column hung off the hip: two rows of trouser, the boot,
  // then a brass toe cap on the ground row. `lift` shortens it, which is how
  // a foot leaves the ground — the reference's whole gait is spread and lift,
  // so those are the two things a frame gets to change.
  function opLeg(x, lx, lift, near) {
    const bot = OPH - 1 - lift;
    if (bot < OP_HIP + 3) return;
    R(x, P.coatN, lx, OP_HIP, 4, bot - OP_HIP + 1);
    R(x, P.coatD, lx + 1, OP_HIP, 2, 2);
    R(x, near ? P.boot : P.bootD, lx + 1, OP_HIP + 2, 2, bot - OP_HIP - 2);
    if (near) R(x, P.bootD, lx + 2, OP_HIP + 2, 1, bot - OP_HIP - 2);
    R(x, P.brass1, lx + 1, bot, 2, 1);
    if (near) R(x, P.brass2, lx + 1, bot, 1, 1);
  }

  // one walk cycle, eight beats: contact, down, passing, up — twice, the
  // second half the first mirrored. [dx, lift] for the near leg then the far.
  const OP_GAIT = [
    [-1, 0, 1, 2], [0, 0, 0, 1], [0, 0, 0, 0], [1, 1, -1, 0],
    [1, 2, -1, 0], [0, 1, 0, 0], [0, 0, 0, 0], [-1, 0, 1, 1],
  ];
  const OP_GAIT_S = [                      // in profile the stride is fore/aft, so it is bigger
    [-3, 0, 3, 1], [-2, 0, 2, 2], [0, 0, 0, 0], [2, 1, -2, 0],
    [3, 0, -3, 1], [2, 0, -2, 2], [0, 0, 0, 0], [-2, 1, 2, 0],
  ];
  const OP_BOB = [1, 0, -1, 0, 1, 0, -1, 0];    // low at contact, high at passing
  const OP_ARM = [-2, -1, 0, 1, 2, 1, 0, -1];   // the near arm, opposite the near leg
  const OP_SWAY = [1, 1, 0, -1, -1, -1, 0, 1];  // the coat and the scarf lag a beat

  // The coat's back hem and the scarf's tail. Cloth is what makes a walk look
  // like a walk, so both trail the body instead of tracking it.
  function opTrail(x, oy, sway, side) {
    if (side) {
      const bx = 1 - sway;
      R(x, P.coatN, bx, oy + 17, 4, 5);
      R(x, P.coatD, bx + 1, oy + 18, 2, 3);
      // the tail leaves the collar and tapers away behind him — drawn as a
      // free-floating bar it read as a stick, not cloth
      R(x, P.teal2, bx + 1, oy + 12, 3, 2);
      R(x, P.teal, bx + 2, oy + 12, 2, 1);
      R(x, P.teal2, bx, oy + 13 - sway, 2, 1);
    } else {
      if (sway > 0) { R(x, P.coatN, 1, oy + 19, 2, 2); R(x, P.coatD, 1, oy + 19, 1, 1); }
      if (sway < 0) { R(x, P.coatN, 17, oy + 19, 2, 2); R(x, P.coatD, 18, oy + 19, 1, 1); }
    }
  }

  // a gloved hand at the end of a sleeve the grid already drew
  function opGlove(x, gx, gy) {
    R(x, P.coatN, gx, gy - 1, 3, 1);
    R(x, P.leathD, gx, gy, 3, 2);
    R(x, P.leath, gx + 1, gy, 1, 1);
  }

  function character(dir, frame) {
    const [c, x] = canvas(OPW, OPH);
    const f = frame % 8;
    const oy = OP_BOB[f], sway = OP_SWAY[f], sw = OP_ARM[f];
    const side = dir === 'side';
    const g = side ? OP_GAIT_S[f] : OP_GAIT[f];
    const head = dir === 'up' ? HEAD_U : side ? HEAD_S : HEAD_D;
    const torso = dir === 'up' ? TORSO_U : side ? TORSO_S : TORSO_D;

    opTrail(x, oy, sway, side);
    if (side) {
      opLeg(x, 7 - g[2], g[3], false);       // the far leg, behind and darker
      opLeg(x, 7 + g[0], g[1], true);
    } else {
      opLeg(x, 5 + g[0], g[1], true);
      opLeg(x, 11 + g[2], g[3], true);
    }
    opGrid(x, torso, 0, oy + 12);
    opGrid(x, head, 0, oy);
    if (side) {
      // the near arm swings across the coat; the sleeve travels with it
      const ax = 7 + Math.round(sw * 0.9);
      R(x, P.coatN, ax, oy + 15, 3, 4);
      R(x, sw > 0 ? P.coat : P.coatD, ax + 1, oy + 16, 1, 2);
      opGlove(x, ax, oy + 19);
    } else {
      const near = dir === 'down' ? 1 : -1;
      opGlove(x, 2, oy + 18 + (sw * near > 0 ? 1 : 0));
      opGlove(x, 15, oy + 18 + (sw * near < 0 ? 1 : 0));
    }
    return c;
  }

  // Standing still is not a still frame. Four slow beats of breath: the head
  // and chest ride together (a seam opens the moment they don't), the legs
  // stay planted, and the gauge on his chest rides with them.
  function characterIdle(dir, frame) {
    const [c, x] = canvas(OPW, OPH);
    const f = frame % 4;
    const rise = [1, 0, 0, 1][f];
    const side = dir === 'side';
    const head = dir === 'up' ? HEAD_U : side ? HEAD_S : HEAD_D;
    const torso = dir === 'up' ? TORSO_U : side ? TORSO_S : TORSO_D;
    if (side) { opLeg(x, 5, 0, false); opLeg(x, 8, 0, true); }
    else { opLeg(x, 5, 0, true); opLeg(x, 11, 0, true); }
    opGrid(x, torso, 0, 12 + rise);
    opGrid(x, head, 0, rise);
    if (side) opGlove(x, 8, 19 + rise);
    else { opGlove(x, 2, 19 + rise); opGlove(x, 15, 19 + rise); }
    // The gauge burns brighter on beats 2 and 3 — deliberately offset from
    // the chest's rise, so the breath is four distinct beats and not a
    // two-pose flicker. Run on the same beats as the rise it adds nothing.
    if (dir !== 'up' && f >= 2) R(x, P.brass3, side ? 10 : 12, 15 + rise, 1, 1);
    return c;
  }

  // at the machine: back to us, both hands up on the console, a nod on the
  // off-beats and the hands falling in alternation
  function characterWork(frame) {
    const [c, x] = canvas(OPW, OPH);
    const f = frame % 4;
    // nod and hand-lift run on different beats, so all four frames differ —
    // on one shared cadence frames 0 and 2 came out identical
    const nod = [0, 1, 1, 0][f];
    opLeg(x, 5, 0, true); opLeg(x, 11, 0, true);
    opGrid(x, TORSO_WORK, 0, 12);
    opGrid(x, HEAD_U, 0, nod);
    const lift = [0, 1, 0, -1][f];
    const armUp = (ax, ay) => {
      R(x, P.coatN, ax, ay, 3, 5);
      R(x, P.coatD, ax + 1, ay + 1, 1, 3);
      R(x, P.leathD, ax, ay - 2, 3, 2);
      R(x, P.leath, ax + 1, ay - 2, 1, 1);
    };
    armUp(1, 15 - lift); armUp(16, 15 + lift);
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
  // A run of belting is one machine, not a row of tiles. Nothing is drawn at
  // a tile edge that would give the joins away: the slats are placed by how
  // far along the run a pixel lies, so they walk straight through every
  // seam. Corners are a real quarter turn about the tile's inner corner —
  // band, rails and slats all swing round it, and the goods ride the curve.
  //
  // shape: 'h' 'v' straights · 'ne' 'nw' 'se' 'sw' — the two sides a corner
  // joins. rev: the run carries the other way, so the slats walk the other
  // way too. frame: one world pixel of travel each.
  const BELT_STEPS = 8;                 // slat frames = the pitch, one px apart
  const BELT_PITCH = 8;                 // world px between slats (divides TILE)
  const BELT_MID = TILE / 2;            // the band's centre line / the turn radius
  // per shape: which way the canonical run enters, and the corner it turns
  // about (null on a straight). `from` points from that corner at the
  // entry edge's middle.
  const BELT_SHAPE = {
    h: { axis: 'x' }, v: { axis: 'y' },
    ne: { pivot: [TILE, 0], from: [-1, 0] },
    nw: { pivot: [0, 0], from: [1, 0] },
    se: { pivot: [TILE, TILE], from: [-1, 0] },
    sw: { pivot: [0, TILE], from: [1, 0] },
  };
  // where one pixel sits on the run: `d` out from the centre line, `n` which
  // way that is (for the light), `s` how far along the tile in world pixels
  function beltPixel(shape, px, py) {
    const cx = px + 0.5, cy = py + 0.5;
    const sh = BELT_SHAPE[shape] || BELT_SHAPE.h;
    if (!sh.pivot) {
      const flat = sh.axis === 'x';
      const across = (flat ? cy : cx) - BELT_MID;
      const sg = across < 0 ? -1 : 1;
      return { d: Math.abs(across), nx: flat ? 0 : sg, ny: flat ? sg : 0, s: flat ? cx : cy };
    }
    const vx = cx - sh.pivot[0], vy = cy - sh.pivot[1];
    const r = Math.hypot(vx, vy) || 1e-6;
    const sg = r < BELT_MID ? -1 : 1;
    const dot = Math.max(-1, Math.min(1, (vx * sh.from[0] + vy * sh.from[1]) / r));
    return { d: Math.abs(r - BELT_MID), nx: (vx / r) * sg, ny: (vy / r) * sg, s: (Math.acos(dot) / (Math.PI / 2)) * TILE };
  }
  function beltTile(frame, shape, rev, pipe) {
    const [c, x] = canvas(TILE, TILE);
    const ph = ((frame % BELT_STEPS) + BELT_STEPS) % BELT_STEPS;
    for (let py = 0; py < TILE; py++) {
      for (let px = 0; px < TILE; px++) {
        const g = beltPixel(shape, px, py);
        if (g.d >= (pipe ? 5 : 6)) continue;
        const lit = g.nx + g.ny < 0;                       // the light is up and to the left
        const run = rev ? TILE - g.s : g.s;                // how far the load has come
        const walk = ((Math.floor(run) - ph) % BELT_PITCH + BELT_PITCH) % BELT_PITCH;
        let col;
        if (pipe) {
          // riveted copper, brass collars every pitch, one glint running it
          const collar = Math.floor(g.s) % BELT_PITCH < 2;
          if (g.d >= 4) col = P.ironO;
          else if (collar) col = g.d >= 3 ? (lit ? P.brass3 : P.brass1) : P.brass2;
          else if (g.d < 1 && walk < 3) col = P.glow;
          else col = lit ? (g.d >= 3 ? P.copper3 : P.copper) : (g.d >= 3 ? P.copper4 : P.copper2);
        } else if (g.d >= 5) col = P.ironO;                // the trestle's outline
        else if (g.d >= 4) col = lit ? P.iron : P.iron3;   // its lit lip, its shade
        else if (g.d >= 3) col = P.iron2;                  // the rail the band runs in
        else if (walk < 2) col = g.d < 2 ? P.beltM : (lit ? P.beltL : P.beltD);  // a slat
        else col = g.d < 2 ? P.beltD : (lit ? P.beltE : P.beltS);                // the band
        if (col) R(x, col, px, py, 1, 1);
      }
    }
    return c;
  }
  // the drum a run ends on, where it meets the machine. `side` is the tile
  // edge it sits against; drawn north and turned by whole quarters.
  function beltEnd(frame, side, pipe) {
    const [c, x] = canvas(TILE, TILE);
    x.save();
    x.translate(BELT_MID, BELT_MID);
    x.rotate(({ n: 0, e: 1, s: 2, w: 3 }[side] || 0) * Math.PI / 2);
    x.translate(-BELT_MID, -BELT_MID);
    if (pipe) {
      R(x, P.ironO, 2, 0, 12, 5);
      R(x, P.brass1, 3, 0, 10, 4); R(x, P.brass2, 3, 0, 10, 1);
      R(x, P.soot, 5, 1, 6, 3);
    } else {
      R(x, P.ironO, 2, 0, 12, 6);
      R(x, P.brass1, 3, 1, 10, 4); R(x, P.brass2, 3, 1, 10, 1);
      const ph = ((frame % BELT_STEPS) + BELT_STEPS) % BELT_STEPS;
      for (let k = 0; k < 2; k++) R(x, P.brass3, 3 + ((k * 5 + ph) % 10), 1, 1, 4);
      R(x, P.iron3, 3, 5, 10, 1);
    }
    x.restore();
    return c;
  }
  // An inlet or an outlet, bolted to the machine's side and standing on the
  // tile a run has to reach to use it. Drawn against the tile's north edge
  // and turned by whole quarters, the way the drum above is, so `side` is
  // the tile edge the machine is on the far side of.
  //
  // Which way the goods go is said twice over: an intake is verdigris and
  // its wedge points into the machine, a discharge is brass and its wedge
  // points out at the field. Colour alone would fail the eye that can't tell
  // the two apart, and a wedge alone would be four pixels of nothing at this
  // size, so it is both.
  function portPlate(side, dir) {
    const [c, x] = canvas(TILE, TILE);
    const into = dir === 'in';
    const lit = into ? P.teal3 : P.brass2, dim = into ? P.teal2 : P.brass1;
    x.save();
    x.translate(BELT_MID, BELT_MID);
    x.rotate(({ n: 0, e: 1, s: 2, w: 3 }[side] || 0) * Math.PI / 2);
    x.translate(-BELT_MID, -BELT_MID);
    // Fourteen long and six deep, which is two pixels shy of the tile both
    // ways. Two ports on one side of a machine sit one tile apart, and at
    // the full sixteen they ran together into a pillar taller than the body
    // they were bolted to; the gap keeps them two tabs. The coloured rim
    // still reaches past the twelve a run's drum covers, so a port with a
    // belt on it shows a thread of verdigris or brass down either side of
    // the band and goes on saying which way the goods go.
    R(x, lit, 1, 0, 14, 5);                            // the rim, in the port's own colour
    R(x, P.ironO, 1, 5, 14, 1);                        // ink along its far edge
    R(x, P.iron3, 2, 0, 12, 5);                        // its face, dark enough for the wedge
    R(x, dim, 2, 0, 12, 1);                            // the lip against the machine
    // the wedge: three rows, tip at the machine (intake) or at the field
    const rows = into ? [[7, 2], [6, 4], [5, 6]] : [[5, 6], [6, 4], [7, 2]];
    rows.forEach(([px, w], i) => R(x, lit, px, 1 + i, w, 1));
    x.restore();
    return c;
  }
  // What rides the belt is the material's own sprite — see matSprite below.
  // There is no separate belt token: a tinted square told the player only
  // which ore a good started from, so every iron alloy was the same object
  // going past.
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

  // ---------- coming apart: the poof, and the shadow a loose good throws ----------
  // Four frames of one ball of steam and dust, growing as it rises. Nothing
  // in this world explodes — a machine taken down lets go — so it is smoke
  // and never a fireball. It also has to thin, and pixel art has no soft
  // edge to thin with, so the three bands walk up the greys instead: a tight
  // dark pop with a hot core, opening into a pale ball with no core left in
  // it. The world fades the whole sprite out on top of that.
  // Two bites are taken out of the rim on opposite quarters, and they swap
  // sides frame by frame, so the ball tumbles and a cluster of these never
  // reads as a row of circles.
  const PUFF_FRAMES = 4;
  const PUFF_RIM = [P.iron3, P.iron2, P.iron, P.ironL];
  const PUFF_BODY = [P.iron, P.ironL, P.steam, P.steam];
  function puff(frame) {
    const f = Math.max(0, Math.min(PUFF_FRAMES - 1, frame | 0));
    const r = [3, 5, 7, 8][f];
    const [c, x] = canvas(r * 2 + 2, r * 2 + 2);
    disc(x, PUFF_RIM[f], r, r, r);
    disc(x, PUFF_BODY[f], r, r, r - 1);
    if (f < 2) disc(x, P.steam, r - 1, r - 1, r - 2 - f);   // the hot core, before it opens out
    const b = f % 2 ? 1 : -1, q = Math.round(r * 0.62);
    x.clearRect(r + b * q, r - q - 1, 2, 2);
    x.clearRect(r - b * q - 1, r + q, 2, 2);
    return c;
  }
  // Eight by three, opaque, and the same under every material: it is the
  // light and not the good. The world fades and narrows it as the good
  // rises, which is the only thing that says a good is in the air at all.
  function dropShadow() {
    const [c, x] = canvas(8, 3);
    R(x, '#0b0a12', 2, 0, 4, 1);
    R(x, '#0b0a12', 0, 1, 8, 1);
    R(x, '#0b0a12', 2, 2, 4, 1);
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

  // ---------- buildable pad marker: bold survey outline ----------
  // Bright: translucent gold fill, thick dashes, red-and-white corner stakes.
  // A surveyed pad: three tiles by three — the ground the largest machine
  // stands on whichever way it faces, so what you see before you build is
  // what you get after. Marked out in surveyor's tape with a peg at each
  // corner. Veins take the 2×1 a mine stands on.
  function plotMarker(w, h) {
    const W = w || 48, H = h || 32;
    const [c, x] = canvas(W, H);
    x.fillStyle = 'rgba(242, 193, 78, 0.28)';
    x.fillRect(1, 1, W - 2, H - 2);
    // tape right round, not a dotted suggestion of one: on worn dirt a pad
    // marked only at intervals read as no pad at all
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

  const SCENERY_DRAW = { tree: () => tree(0), tree2: () => tree(1), rock: () => rock(0), rock2: () => rock(1) };

  // ---------- materials: one 10x10 sprite, the bag's and the belt's ----------
  // A material is drawn once. What sits in the HUD is the same picture that
  // rides the band — there is no smaller stand-in — and the belt is what sets
  // the size. The trestle is twelve world pixels across; a good centred on
  // the band with its corner cells left clear reaches 8 + 4·√2 ≈ 13.7 from
  // the pivot at the worst point of a quarter turn, so it never rides out
  // over the grass. Twelve would, on every corner. Goods sit a whole tile
  // apart, so ten leaves six pixels of band between them and they still
  // count as separate things.
  const MAT_PX = 10;

  // Masks are 8x8, laid at (1,1) so the rim has its pixel. A digit indexes
  // the tone list, '.' is nothing. The rim is added around the silhouette
  // afterwards and is identical on every material, because it is the light
  // and not the material: a dim cream along the top and left, where this
  // world's light comes from, ink down the shade side. That is what makes
  // coal read as an object on a band this dark — an ink outline alone would
  // sink into it — and it is the one thing the old tinted dot got right.
  //
  // Only a cell squarely above or left of the body takes the light. A
  // diagonal step takes ink instead: let the staircases light up too and the
  // cream stops being an edge and becomes a halo, which at ten pixels is a
  // quarter of the sprite spent on nothing.
  const RIM_LIT = '#9c9184', RIM_INK = P.ink;
  function matMask(rows, tones) {
    const [c, x] = canvas(MAT_PX, MAT_PX);
    const on = (cx, cy) => cy >= 0 && cy < 8 && cx >= 0 && cx < 8 && rows[cy][cx] !== '.';
    for (let cy = -1; cy <= 8; cy++) for (let cx = -1; cx <= 8; cx++) {
      if (on(cx, cy)) continue;
      let col = null;
      if (on(cx, cy - 1) || on(cx - 1, cy)) col = RIM_INK;            // it is under or right of the body
      else if (on(cx, cy + 1) || on(cx + 1, cy)) col = RIM_LIT;       // it is squarely over or left of it
      else if (on(cx - 1, cy - 1) || on(cx + 1, cy - 1) || on(cx - 1, cy + 1) || on(cx + 1, cy + 1)) col = RIM_INK;
      if (col) R(x, col, cx + 1, cy + 1, 1, 1);
    }
    for (let cy = 0; cy < 8; cy++) for (let cx = 0; cx < 8; cx++) {
      const ch = rows[cy][cx];
      if (ch !== '.') R(x, tones[+ch - 1], cx + 1, cy + 1, 1, 1);
    }
    return c;
  }

  // The six ores get six silhouettes, not six tints: an angular chunk, a
  // round nugget and its pebble, a flat slab, twin crystals, a jagged lump,
  // a stoppered flask. Told apart with the colour taken away.
  const ORE_MASK = {
    az: ['........',
         '..33....',
         '.3331...',
         '.3311112',
         '13111122',
         '11112222',
         '.1122...',
         '........'],
    buki: ['........',
           '..3311..',
           '.3311112',
           '.3111112',
           '.3111122',
           '.1111222',
           '..12222.',
           '........'],
    stone: ['........',
            '........',
            '..3333..',
            '.3333112',
            '.1111112',
            '11111122',
            '.222222.',
            '........'],
    vedi: ['.....3..',
           '..3..31.',
           '..3..312',
           '.331.312',
           '.3311312',
           '.3311122',
           '.1111122',
           '..2222..'],
    coal: ['........',
           '..3..1..',
           '.3311112',
           '33111412',
           '.1111122',
           '.111222.',
           '..12.2..',
           '........'],
    oil: ['...44...',
          '...44...',
          '..3113..',
          '.331112.',
          '.3111122',
          '.3111122',
          '..111122',
          '..2222..'],
  };
  const ORE_TONE = {
    az: [P.ironore, P.ironore2, P.ironore3],
    buki: [P.copper, P.copper2, P.copper3],
    stone: [P.stoneore, P.stoneore2, P.stoneore3],
    vedi: [P.quartz, P.quartz2, P.quartz3],
    coal: [P.coal, P.coal2, P.coal3],
    oil: [P.oil, P.oil2, P.oil3],
  };
  // coal's one hard glint, and the flask's brass stopper, ride in slot 4
  const ORE_EXTRA = { coal: P.white, oil: P.brass1 };

  // An alloy is its own colour, not a mix of its ores' — bronze is bronze,
  // brass is brass, steel is bright. Eight bars that differed only by a tone
  // swap were eight of the same bar.
  const ALLOY_TONE = {
    slogi: [P.bronze, P.bronzeD, P.bronzeL],
    castiron: [P.cIron, P.cIronD, P.cIronL],
    qziron: [P.qIron, P.qIronD, P.qIronL],
    steel: [P.stl, P.stlD, P.stlL],
    brass: [P.brs, P.brsD, P.brsL],
    blackiron: [P.bIron, P.bIronD, P.bIronL],
    gunmetal: [P.gun, P.gunD, P.gunL],
    glass: [P.gls, P.glsD, P.glsL],
  };
  // A two-ore bar is cast with the added ore left showing at one end, in that
  // ore's own colour: bronze with a copper end, steel with a coal-black one.
  // A stamped glyph was tried first and could not be seen — three pixels of
  // pattern inside eight is not a mark, it is noise. Two columns of colour
  // is a mark.
  // Flat-topped and square-shouldered on purpose: a bar tapered at the top
  // came out a loaf, and a loaf is the same silhouette as an ore chunk. Cast
  // is cast — the ladder's whole point is that you can see when a thing has
  // been through a furnace.
  const BAR = ['........',
               '........',
               '.333333.',
               '33333333',
               '11111155',
               '11111144',
               '11111144',
               '.222222.'];
  // three ores is a stack of two: the bar below is the two-ore alloy it came
  // from, the bar on top is the ore the foundry added. The player reads the
  // recipe off the good.
  const STACK = ['........',
                 '..5555..',
                 '.444444.',
                 '.666666.',
                 '.333333.',
                 '11111111',
                 '11111111',
                 '.222222.'];
  // az the ore is an angular chunk with a facet, buki a round nugget, stone a
  // flat slab. Set against a flat-topped bar, none of the three can be
  // mistaken for something that has been cast.
  // glass is not a bar. It is the one material in the ladder that is not
  // metal, so it does not get a metal's silhouette.
  const PANE = ['..3333..',
                '.311113.',
                '.311131.',
                '.311311.',
                '.313111.',
                '.331111.',
                '.211112.',
                '..2222..'];
  // the deeper forms: a gear, a cast angle, an instrument block, a hex nut,
  // a crate, a boiler that is still lit. Six silhouettes, no two alike.
  const FORM_ART = {
    parts: { m: ['..33.1..',
                 '..3311..',
                 '33311122',
                 '.3144122',
                 '.3144122',
                 '33111222',
                 '..1122..',
                 '..11.2..'], t: [P.brass2, P.brass1, P.brass3, P.iron3] },
    moldings: { m: ['.33..33.',
                    '.11..11.',
                    '.11..11.',
                    '.11..11.',
                    '.11..11.',
                    '.111111.',
                    '.141141.',
                    '.222222.'], t: [P.iron, P.iron3, P.ironL, P.soot] },
    modules: { m: ['.....3..',
                   '.333333.',
                   '31111113',
                   '31544513',
                   '31466413',
                   '31111113',
                   '.222222.',
                   '.2....2.'], t: [P.iron2, P.iron3, P.iron, P.brass1, P.brass2, P.steam] },
    fastened: { m: ['..3333..',
                    '.311113.',
                    '31144112',
                    '31444412',
                    '21444422',
                    '21144222',
                    '.211112.',
                    '..2222..'], t: [P.iron, P.iron3, P.steel, P.soot] },
    crates: { m: ['........',
                  '.333333.',
                  '.311113.',
                  '.131131.',
                  '.444444.',
                  '.131131.',
                  '.311113.',
                  '.222222.'], t: [P.trunk, P.trunk2, '#8f6a44', P.brass1] },
    heavy: { m: ['..3333..',
                 '.311113.',
                 '.111111.',
                 '.444444.',
                 '.155551.',
                 '.166661.',
                 '.167761.',
                 '.222222.'], t: [P.iron2, P.iron3, P.iron, P.brass1, P.soot, P.orange, P.glow] },
    money: { m: ['..3333..',
                 '.331112.',
                 '33111112',
                 '31144112',
                 '31144112',
                 '33111122',
                 '.211122.',
                 '..2222..'], t: [P.brass2, P.brass1, P.brass3, P.brass1] },
  };

  function matSprite(kind) {
    const spec = (window.CHAIN && window.CHAIN.MATS && window.CHAIN.MATS[kind]) || null;
    const form = spec ? spec.form : (kind === 'money' ? 'money' : 'crates');
    if (form === 'ore') {
      const t = (ORE_TONE[kind] || ORE_TONE.az).concat(ORE_EXTRA[kind] || P.white);
      return matMask(ORE_MASK[kind] || ORE_MASK.az, t);
    }
    if (form === 'ingot') {
      const t = ALLOY_TONE[kind] || ALLOY_TONE.castiron;
      if (kind === 'glass') return matMask(PANE, t);
      const a = ORE_TONE[spec.ores[1]] || ORE_TONE.az;
      return matMask(BAR, t.concat([a[0], a[2]]));
    }
    if (form === 'ingot3') {
      // the parent is the two-ore alloy this one's first two ores make, so
      // the art never has to be told a recipe chain.js already knows
      const pair = spec.ores.slice(0, 2).join();
      const parent = Object.keys(ALLOY_TONE).find((id) => {
        const s = window.CHAIN.MATS[id];
        return s && s.ores.join() === pair;
      });
      const t = ALLOY_TONE[parent] || ALLOY_TONE.castiron;
      const a = ORE_TONE[spec.ores[2]] || ORE_TONE.vedi;
      return matMask(STACK, t.concat([a[0], a[2], a[1]]));
    }
    const art = FORM_ART[form] || FORM_ART.crates;
    return matMask(art.m, art.t);
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
    x.drawImage(character('side', 0), 24, 48 - OPH - 3);   // feet on the grass, not the card's edge
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
    // machines take a mode: 'still' | 'idle' | 'work' (DESIGN.md, 2026-08-20).
    // factory.js caches one band of these per (look, mode) and picks the mode
    // each tick; nothing here knows what the machine is doing.
    WORK_FRAMES, IDLE_FRAMES,
    // facing: 's' (front, the default) | 'n' | 'e' | 'w' — w is e, flipped
    machineTex: (tier, frame, mode, facing) => tex(machine(tier, frame, mode, facing)),
    stationTex: (kind, frame, mode, facing) => tex(station(kind, frame, mode, facing)),
    // walk is 8 beats, idle is 4 slow ones, work is 4 at the machine
    CHAR_W: OPW, CHAR_H: OPH, WALK_BEATS: 8, IDLE_BEATS: 4,
    characterTex: (dir, frame) => cachedTex('ch:' + dir + frame, () => character(dir, frame)),
    characterIdleTex: (dir, frame) => cachedTex('chi:' + dir + frame, () => characterIdle(dir, frame)),
    characterWorkTex: (frame) => cachedTex('chw:' + frame, () => characterWork(frame)),
    beltTex: (frame) => tex(belt(frame)),
    matDotTex: () => tex(matDot()),
    beltTileTex: (frame, shape, rev, pipe) => cachedTex('bt:' + frame + shape + (rev ? 'r' : 'f') + (pipe ? 'p' : 'b'), () => beltTile(frame, shape, rev, pipe)),
    beltEndTex: (frame, side, pipe) => cachedTex('be:' + frame + side + (pipe ? 'p' : 'b'), () => beltEnd(frame, side, pipe)),
    portTex: (side, dir) => cachedTex('port:' + side + dir, () => portPlate(side, dir)),
    BELT_PITCH,                        // world px a slat travels before the next takes its place
    spoolTex: () => cachedTex('spool', spool),
    stateDotTex: (kind) => cachedTex('state:' + kind, () => stateDot(kind)),
    sparkTex: () => cachedTex('spark', spark),
    // a thing coming apart, and the goods it leaves lying on the ground
    PUFF_FRAMES,
    puffTex: (frame) => cachedTex('puff:' + frame, () => puff(frame)),
    dropShadowTex: () => cachedTex('dropshadow', dropShadow),
    paperScrapTex: (frame) => cachedTex('scrap:' + frame, () => paperScrap(frame)),
    petalTex: (frame) => cachedTex('petal:' + frame, () => petal(frame)),
    glowHaloTex: () => cachedTex('halo', glowHalo),
    propTex: (kind) => cachedTex('prop:' + kind, PROP_DRAW[kind]),
    // a build pad is 3x3; an unbuilt vein is the 2x1 a mine stands on
    plotTex: (w, h) => cachedTex('plot:' + (w || 48) + 'x' + (h || 32), () => plotMarker(w, h)),
    // scenery: the meadow set lives here; region sets (pine, boulder, reeds…) in tiles.js
    sceneryTex: (kind) => cachedTex('scenery:' + kind,
      SCENERY_DRAW[kind] || (() => window.TILES.scenery(kind))),
    boardTex: (hasWork) => cachedTex('board:' + !!hasWork, () => noticeBoard(hasWork)),
    textTex: (str, fg) => cachedTex('t:' + fg + '|' + str, () => textCanvas(str, fg)),
    // materials: one sprite, three ways of asking for it. The HUD, the menu
    // rows, the goods on the belt and the fly-to-bag image are all this.
    MAT_PX,
    matTex: (kind) => cachedTex('mat:' + kind, () => matSprite(kind)),
    matCanvas: matSprite,
    matURL: (kind) => matSprite(kind).toDataURL(),
    kindIconTex: (kind) => cachedTex('kind:' + kind, () => kindIcon(kind)),
    // raw canvases for the dev proof page (dev/tiles.html) — no PIXI needed
    nodeCanvas: nodePatch,
    sceneryCanvas: (kind) => SCENERY_DRAW[kind] ? SCENERY_DRAW[kind]() : window.TILES.scenery(kind),
    machineCanvas: machine, stationCanvas: station, characterCanvas: character,
    idleCanvas: characterIdle, workCanvas: characterWork,
    pressCanvas: press, beltTileCanvas: beltTile, beltEndCanvas: beltEnd, portCanvas: portPlate, boardCanvas: noticeBoard,
    propCanvas: (kind) => PROP_DRAW[kind](), kindIconCanvas: kindIcon,
    pressTex: (frame, mode) => tex(press(frame, mode)),
    vignetteURL: () => vignette().toDataURL(),
  };
})();
