// THE FRONTIER — the game proper. One wide open basin of meadow in the middle,
// every biome wrapped around it as a ring, and nothing in the way.
//
// The shape of the world (2026-08-20 rebuild):
//   · A 60×20-tile grass BASIN sits in the centre. It holds the track, the
//     landing, thirty plots and the first vein of every ore. Nothing solid
//     stands in it — no cliff, no water, no boulder, not one rock.
//   · The LANDING CLUSTER: the three mines the player starts with — iron,
//     copper, stone — stand around the landing, all three inside the camera
//     the moment the world opens, even at the smallest viewport the zoom
//     will settle on. The basin's other four veins sit at its corners and
//     the rest are away in the ring: those are found by looking around.
//   · Six biomes ring it — peaks west, quarry north-west, canyon north-east
//     and east, bog south-east, flats south-west — and none of them is a
//     rectangle. Each fades into the basin through its own ramp of ground
//     kinds (grass → dirt → rock, grass → frost → snow, …) across a front a
//     noise field drags back and forth by half a dozen tiles, so every
//     border wanders and neighbours finger into each other.
//   · The water, ice and tar are blobs, not rects: a noise-wobbled ellipse,
//     with its shore sharing the blob's seed so the sand follows the coast.
//   · Every change of elevation is big and easy. THE GREAT MESA (elev 2) is
//     four blocks reaching different distances south, so its front steps in
//     and out; each step carries a wide flight down, and a cut through the
//     rim gives a way up each side. The PEAKS SHELF and the CANYON SHELF are
//     the same idea at elev 1, three blocks each. The ISLAND in the south
//     lake has two lobes and six open crossings, on all four sides.
//   · Nothing is gated. Every crossing carries `free`, so the bridges and the
//     west causeway stand built from the first second.
//   · Every terrain and every obstacle is on show and all of it is out of the
//     way: water, tar, ice, the three wall palettes and every piece of region
//     scenery live in the ring, never in the basin.
//
// MAPKIT.field turns the per-tile decision below back into GROUND rects — the
// schema is still rects, the shapes are not.
(function () {
  'use strict';
  const K = window.MAPKIT;
  const { sc, fbm, noise, field, blob, box, path, anyOf } = K;

  const T = 16;
  const W = 1600, H = 720;
  const COLS = W / T, ROWS = H / T;               // 100 × 45 tiles

  // the open middle, in tiles (inclusive)
  const BASIN = { x0: 20, x1: 79, y0: 12, y1: 31 };

  // ======================================================================
  // regions — the biome ring. The basin is first: it is the home region
  // (the drifting petals live in it). The rest tile the rim exactly, so no
  // tile is ever left unclaimed. A region here sets the cliff palette, the
  // border treeline and the elevation floor; the ground field below decides
  // what the dirt actually looks like, and it pays the rects no mind.
  // ======================================================================
  const REGIONS = [
    { id: 'basin',  x: 320,  y: 192, w: 960, h: 320, elev: 0, base: 'grass', cliff: 'tan',    treeline: ['tree', 'tree2', 'pine'] },
    // the peaks wear GREY rock, not snow: a white cliff on white ground has no
    // height to it, and stone breaking through the snow is what a peak is
    { id: 'peaks',  x: 0,    y: 0,   w: 320, h: 512, elev: 0, base: 'snow',  cliff: 'grey',   treeline: ['snowpine', 'snowpine2', 'spire'] },
    { id: 'quarry', x: 320,  y: 0,   w: 512, h: 192, elev: 0, base: 'rock',  cliff: 'tan',    treeline: ['spire', 'boulder', 'boulder2'] },
    { id: 'canyon', x: 832,  y: 0,   w: 768, h: 192, elev: 0, base: 'shale', cliff: 'violet', treeline: ['spire2', 'deadtree', 'crystal'] },
    { id: 'canyon', x: 1280, y: 192, w: 320, h: 320, elev: 0, base: 'shale', cliff: 'violet', treeline: ['spire2', 'deadtree', 'crystal'] },
    { id: 'flats',  x: 0,    y: 512, w: 832, h: 208, elev: 0, base: 'crack', cliff: 'tan',    treeline: ['boulder', 'scrub', 'boulder2'] },
    { id: 'bog',    x: 832,  y: 512, w: 768, h: 208, elev: 0, base: 'marsh', cliff: 'grey',   treeline: ['deadtree', 'deadtree2', 'reeds'] },
  ];

  // ======================================================================
  // the biome field — biomes as noise, not as rects
  // ======================================================================
  // Each biome reads as a ramp: nearest the basin it is still meadow, then a
  // transition, then its own floor. `rim` says how far out of the basin a
  // point lies (0 at the basin's edge, 1 at the world's), and the ramp is
  // indexed by that, so the change is a band and never a line.
  const RAMPS = {
    peaks:  ['grass', 'frost', 'snow', 'snow'],
    quarry: ['grass', 'dirt', 'rock', 'rock'],
    canyon: ['grass', 'sand', 'shale', 'shale'],
    flats:  ['grass', 'dirt', 'crack', 'crack'],
    bog:    ['grass', 'dirt', 'marsh', 'marsh'],
  };
  // what the top of high ground is made of: wind strips a plateau back to the
  // stone, so a shelf never wears the same coat as the ground at its foot
  const TOP = { peaks: 'rock', quarry: 'rock', canyon: 'rock', flats: 'rock', bog: 'rock' };

  // Which biome's ramp a tile reads from. The basin is not one of them: a tile
  // inside it borrows the ramp of the rim it is nearest, and only its distance
  // decides how far along that ramp it sits — which for the open middle is
  // nowhere at all. So no region rect ever draws a line on the ground.
  const rectAt = (px, py) => {
    for (const r of REGIONS) if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return r.id;
    return 'quarry';
  };
  const REGION_AT = new Array(COLS * ROWS);
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    let sx = tx, sy = ty;
    if (rectAt(tx * T + 8, ty * T + 8) === 'basin') {
      const dl = tx - BASIN.x0, dr = BASIN.x1 - tx, dt = ty - BASIN.y0, db = BASIN.y1 - ty;
      const mn = Math.min(dl, dr, dt, db);
      if (mn === dt) sy = BASIN.y0 - 1;
      else if (mn === db) sy = BASIN.y1 + 1;
      else if (mn === dl) sx = BASIN.x0 - 1;
      else sx = BASIN.x1 + 1;
    }
    REGION_AT[ty * COLS + tx] = rectAt(sx * T + 8, sy * T + 8);
  }

  // How far out of the basin a tile lies, measured in tiles and divided by one
  // band width — the same everywhere, so the north rim (12 rows deep) changes
  // over the same distance as the west one (20 columns deep) and no side of
  // the world reads as more crowded than another.
  const BAND = 15;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  function rim(tx, ty) {
    const d = Math.max(BASIN.x0 - tx, tx - BASIN.x1, BASIN.y0 - ty, ty - BASIN.y1);
    return d <= 0 ? 0 : d / BAND;
  }
  // Two independent wobbles do the work. WHICH biome a tile belongs to is read
  // at a point dragged well off the tile, so the seam between two neighbours
  // wanders and each throws headlands across the other — but a sample that
  // lands in the basin falls back to the tile's own region, so the meadow
  // never leaks outward. HOW FAR ALONG its ramp the tile sits is the rim
  // distance plus a slow noise with a fine one riding on it, and that noise
  // is faded out towards the middle: the basin stays clean grass, the front
  // between meadow and biome is a ragged band, never a line.
  function biomeGround(tx, ty) {
    const wx = Math.round(tx + (fbm(tx * 0.055, ty * 0.055, 17, 2) - 0.5) * 13);
    const wy = Math.round(ty + (fbm(tx * 0.055 + 31, ty * 0.055 + 47, 23, 2) - 0.5) * 7);
    const bio = REGION_AT[clamp(wy, 0, ROWS - 1) * COLS + clamp(wx, 0, COLS - 1)];
    const ramp = RAMPS[bio];
    const high = HIGH[ty * COLS + tx];
    const r0 = rim(tx, ty);
    const n = (noise(tx * 0.032, ty * 0.032, 5) - 0.5) * 1.3
      + (fbm(tx * 0.115, ty * 0.115, 13, 2) - 0.5) * 0.4
      + (fbm(tx * 0.29, ty * 0.29, 9, 2) - 0.5) * 0.2;
    // high ground is bare ground: a plateau reads further along its biome's
    // ramp than the lowland at its foot, and its crown is stripped to stone
    const t = clamp(r0 * 1.35 + high * 0.3 + n * Math.min(1, r0 / 0.22), 0, 0.999);
    const i = Math.floor(t * ramp.length);
    return high && i >= 3 ? TOP[bio] : ramp[i];
  }

  // ======================================================================
  // plots — thirty in the open basin on an 80px grid, then a handful on the
  // high ground and the island so every landmark is worth the walk
  // ======================================================================
  const BASIN_COLS = [416, 496, 576, 656, 736, 816, 896, 976, 1056, 1136];
  const BASIN_ROWS = [272, 352, 432];
  const PLOTS = [];
  const plot = (x, y, region) => PLOTS.push({ id: 'p' + (PLOTS.length + 1), x, y, region });
  for (const y of BASIN_ROWS) for (const x of BASIN_COLS) plot(x, y, 'basin');
  plot(464, 144, 'quarry');    // the mesa top
  plot(720, 128, 'quarry');
  plot(112, 224, 'peaks');     // the peaks shelf
  plot(224, 208, 'peaks');
  plot(1392, 336, 'canyon');   // the canyon shelf
  plot(1472, 368, 'canyon');
  plot(1120, 600, 'bog');      // the island
  plot(1216, 600, 'bog');
  plot(1472, 656, 'bog');      // past the boardwalk, the south-east shore

  // ======================================================================
  // ore nodes. Order matters: starterNodes() builds the FIRST node of each
  // tier-0 ore, so iron, copper and stone lead the list.
  //
  // THE LANDING CLUSTER (user ruling 2026-08-20): the three mines the player
  // starts with must all be on screen the moment the world opens. The camera
  // is playerX ± viewW/2 and playerY − viewH/2 − 8, and the viewport can be
  // as small as 300×170 world px — so from the spawn there are 150 px to
  // either side, 93 above and 77 below, and the whole cluster is authored to
  // sit inside that box with room to spare. A mine draws from n.y − 24 (the
  // top of the rig) to n.y + 16 (the foot of its patch), and 36 px wide.
  //
  // Everything after the cluster is a walk: the basin's other veins sit out
  // at its corners, and the deeper ones are away in the biome they belong to.
  // ======================================================================
  const NODES = [
    { kind: 'iron',   x: 448,  y: 296 },   // ── the landing cluster, all in shot from the spawn
    { kind: 'copper', x: 528,  y: 400 },
    { kind: 'stone',  x: 608,  y: 296 },
    { kind: 'quartz', x: 336,  y: 232 },   // ── the basin's corners: found by looking around
    { kind: 'coal',   x: 1216, y: 232 },
    { kind: 'oil',    x: 336,  y: 424 },
    { kind: 'iron',   x: 1216, y: 424 },
    { kind: 'copper', x: 592,  y: 128 },   // ── out in the ring: a reason to climb each landmark
    { kind: 'stone',  x: 1344, y: 272 },   // the canyon shelf
    { kind: 'quartz', x: 1392, y: 96 },    // the canyon head, beside the creek
    { kind: 'coal',   x: 1088, y: 560 },   // the island
    { kind: 'oil',    x: 352,  y: 592 },   // the tar flats
    { kind: 'iron',   x: 112,  y: 176 },   // the peaks shelf
    { kind: 'titan',  x: 208,  y: 464 },   // no ore in v3 — a landmark on the snowfield
  ];

  // ======================================================================
  // high ground — a face is two rows at most, every approachable side carries
  // a ramp, and every flight is four tiles wide
  // ======================================================================
  const flight = (x0, y, n) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * T, y, side: 'S' }));
  const sideRamp = (x, y0, n, side) => Array.from({ length: n }, (_, i) => ({ x, y: y0 + i * T, side }));

  const PLATEAUS = [
    // THE GREAT MESA — one elev-2 mass whose north edge runs up under the
    // border forest, so it never shows a back wall. It is authored as four
    // blocks that reach different distances south: the front of the mesa
    // steps in and out instead of running as one straight wall, and each
    // step carries its own wide flight down. All four tops join at row 3–8.
    {
      x: 400, y: 48, w: 128, h: 112, elev: 2, face: 2,       // cols 25–32, down to row 9
      ramps: [...flight(416, 160, 3), ...sideRamp(400, 80, 3, 'W')],
    },
    {
      x: 528, y: 48, w: 128, h: 160, elev: 2, face: 2,       // cols 33–40, the deepest, down to row 12
      ramps: [...flight(544, 208, 3)],
    },
    {
      x: 656, y: 48, w: 96, h: 96, elev: 2, face: 2,         // cols 41–46, the shallow notch, row 8
      ramps: [...flight(672, 144, 3)],
    },
    {
      x: 752, y: 48, w: 64, h: 144, elev: 2, face: 2,        // cols 47–50, down to row 11
      ramps: [...flight(752, 192, 3), ...sideRamp(800, 80, 3, 'E')],
    },
    // THE PEAKS SHELF — elev 1, three blocks of different reach, grey stone
    // breaking through the snow. A flight off each block, a cut up each side.
    {
      x: 64, y: 112, w: 112, h: 144, elev: 1, face: 1,       // cols 4–10, rows 7–15
      ramps: [...flight(96, 256, 3), ...sideRamp(64, 160, 3, 'W')],
    },
    { x: 176, y: 80, w: 64, h: 208, elev: 1, face: 1, ramps: [...flight(176, 288, 3)] },   // cols 11–14, rows 5–17
    {
      x: 240, y: 144, w: 64, h: 96, elev: 1, face: 1,        // cols 15–18, rows 9–14
      ramps: [...flight(256, 240, 3), ...sideRamp(288, 176, 3, 'E')],
    },
    // THE CANYON SHELF — elev 1, violet faces, cut the same way
    {
      x: 1312, y: 240, w: 96, h: 160, elev: 1, face: 1,      // cols 82–87, rows 15–24
      ramps: [...flight(1344, 400, 3), ...sideRamp(1312, 304, 3, 'W')],
    },
    { x: 1408, y: 208, w: 80, h: 224, elev: 1, face: 1, ramps: [...flight(1424, 432, 3)] }, // cols 88–92, rows 13–26
    {
      x: 1488, y: 272, w: 64, h: 112, elev: 1, face: 1,      // cols 93–96, rows 17–23
      ramps: [...flight(1488, 384, 3), ...sideRamp(1536, 304, 3, 'E')],
    },
  ];

  // how high each tile stands — the ground field reads this so a plateau top
  // wears bare stone while the meadow at its foot is still grass
  const HIGH = new Uint8Array(COLS * ROWS);
  for (const p of PLATEAUS) {
    for (let ty = p.y / T; ty < (p.y + p.h) / T; ty++) {
      for (let tx = p.x / T; tx < (p.x + p.w) / T; tx++) HIGH[ty * COLS + tx] = p.elev;
    }
  }

  // freestanding rock — one stub per palette, each in a corner nothing routes
  // through, so the wall art is on show without ever being a gate
  const WALLS = [
    { x: 176, y: 528, w: 16, h: 80 },    // flats, tan
    { x: 880, y: 592, w: 16, h: 80 },    // bog, grey
    { x: 1200, y: 64, w: 16, h: 96 },    // canyon, violet
  ];

  // ======================================================================
  // crossings — all free. A `free` crossing was never broken: it is built
  // scenery you walk over, not a repair job.
  // ======================================================================
  const CROSSINGS = [
    { id: 'w1', kind: 'boardwalk', x: 880, y: 576, w: 144, h: 32, dir: 'h', free: true }, // the causeway in from the west
    { id: 'b2', kind: 'bridge', x: 1344, y: 576, w: 144, h: 32, dir: 'h', free: true },   // the long bridge in from the east
    { id: 'b3', kind: 'bridge', x: 1152, y: 512, w: 32, h: 32, dir: 'v', free: true },    // north, mid
    { id: 'b4', kind: 'bridge', x: 1056, y: 512, w: 32, h: 32, dir: 'v', free: true },    // north, west
    { id: 'b5', kind: 'bridge', x: 1152, y: 624, w: 32, h: 48, dir: 'v', free: true },    // south, mid
    { id: 'b6', kind: 'bridge', x: 1248, y: 624, w: 32, h: 48, dir: 'v', free: true },    // south, east
  ];

  // ======================================================================
  // the ground: the biome field, then the water and the tar as blobs, then
  // the few things that really are rectangular because somebody built them
  // ======================================================================
  const LAYERS = [];
  const lay = (kind, test) => LAYERS.push({ kind, test });

  // — the peaks: a frost pan, an ice sheet on it, a tarn frozen into the middle
  lay('frost', blob(9, 24.5, 7.6, 4.4, 51, 0.34));
  lay('ice', blob(9, 24, 5.4, 3.1, 53, 0.36));
  lay('water', blob(9, 24, 2.6, 1.4, 57, 0.42));

  // — the canyon: a creek at the head of it, sand banks either side
  const creekX = (ty) => 93 + (fbm(0.5, ty * 0.38, 61, 2) - 0.5) * 3.4;
  lay('sand', (tx, ty) => ty >= 3 && ty <= 12 && Math.abs(tx + 0.5 - creekX(ty)) < 2.6);
  lay('water', (tx, ty) => ty >= 4 && ty <= 10 && Math.abs(tx + 0.5 - creekX(ty)) < 1.1);

  // — the bog: the lake, and the two-lobed island standing well out in it. The
  // lake and its beach share a seed, so the sand follows every bay the water
  // cuts; the island's two lobes share theirs with their own shore.
  lay('sand', blob(73, 37, 18.8, 4.8, 71, 0.15));
  lay('water', blob(73, 37, 18, 4.2, 71, 0.15));
  lay('sand', anyOf(blob(70, 36.5, 6, 2.15, 73, 0.2), blob(76, 36.5, 5.8, 2.15, 74, 0.2)));
  lay('grass', anyOf(blob(70, 36.5, 5.4, 1.8, 73, 0.2), blob(76, 36.5, 5.2, 1.8, 74, 0.2)));

  // — a marsh pool in the south-east corner, to walk around
  lay('sand', blob(94, 35, 4, 2.4, 79, 0.34));
  lay('water', blob(94, 35, 3, 1.8, 79, 0.34));

  // — the flats: tar seeps
  lay('tar', blob(8, 37, 3.2, 1.9, 41, 0.4));
  lay('tar', blob(22.5, 41, 3, 1.5, 43, 0.4));

  // — built: planking, pads, and the tracks that wander because feet made them
  lay('board', box(816, 544, 80, 16));              // plank walks over the west marsh
  lay('board', box(832, 560, 16, 80));
  lay('dirt', path('h', 26, 49, 7, 83, 2.4, 1));    // the track over the mesa top
  lay('pad', box(640, 64, 96, 32));                 // the mesa lookout
  lay('dirt', path('h', 21, 78, 18, 87, 3.2, 2));   // the basin track, east to west
  lay('dirt', path('v', 13, 17, 28, 91, 2, 1));     // a spur north to the mesa stairs
  lay('dirt', path('v', 19, 21, 34, 97, 1.4, 1));   // the step down from the track to the landing
  lay('dirt', path('v', 20, 29, 62, 93, 2.4, 1));   // and a spur south to the lake
  lay('pad', box(512, 336, 80, 48));                // the landing
  lay('pad', box(1152, 576, 96, 32));               // the island's own pad

  // — every ore node sits in its own worn dish
  for (const n of NODES) lay('dirt', blob((n.x + 18) / T, (n.y + 8) / T, 2.3, 1.6, n.x + n.y, 0.45));

  // — a bridge always meets dry land: the two tiles past each end are shore
  for (const c of CROSSINGS) {
    const x0 = c.x / T, y0 = c.y / T, x1 = (c.x + c.w) / T, y1 = (c.y + c.h) / T;
    const ends = c.dir === 'v'
      ? [[x0, y0 - 1, x1, y0], [x0, y1, x1, y1 + 1]]
      : [[x0 - 1, y0, x0, y1], [x1, y0, x1 + 1, y1]];
    for (const [a, b, cc, d] of ends) lay('sand', (tx, ty) => tx >= a && tx < cc && ty >= b && ty < d);
  }

  function groundAt(tx, ty) {
    for (let i = LAYERS.length - 1; i >= 0; i--) if (LAYERS[i].test(tx, ty)) return LAYERS[i].kind;
    return biomeGround(tx, ty);
  }

  const GROUND = field(COLS, ROWS, groundAt);

  // ======================================================================
  // scenery — solid, and every piece of it out in the ring
  // ======================================================================
  const SCENERY = [
    // the peaks
    sc('snowpine', 2, 5), sc('spire2', 18, 7), sc('snowpine2', 18, 17),
    sc('snowpine', 2, 30), sc('snowpine3', 6, 31), sc('boulder', 15, 30),
    sc('spire', 17, 24), sc('snowpine2', 3, 19), sc('boulder2', 9, 29),
    // the quarry, all of it up on the mesa
    sc('rock', 27, 4), sc('boulder', 32, 3), sc('rock2', 48, 5),
    sc('pine', 34, 9), sc('boulder2', 44, 3), sc('spire', 51, 3),
    // the canyon head
    sc('crystal', 55, 5), sc('spire', 60, 3), sc('deadtree', 65, 9), sc('crystal2', 70, 6),
    sc('spire2', 78, 4), sc('deadtree2', 84, 8), sc('crystal', 88, 10), sc('rock2', 73, 10),
    // the canyon's east flank and shelf
    sc('crystal', 81, 14), sc('spire', 97, 27), sc('deadtree', 81, 28), sc('crystal2', 97, 13),
    sc('rock', 80, 22), sc('crystal', 88, 24), sc('spire', 94, 20),
    // the oil flats
    sc('scrub', 4, 34), sc('boulder', 8, 41), sc('scrub2', 14, 38), sc('tarpool', 26, 34),
    sc('boulder2', 30, 41), sc('scrub3', 34, 35), sc('scrub', 44, 41), sc('boulder', 46, 34),
    sc('rock', 38, 42), sc('scrub2', 20, 36),
    // the coal bog
    sc('reeds', 54, 33), sc('deadtree', 55, 41), sc('reeds3', 56, 36),
    sc('reeds2', 89, 39), sc('deadtree2', 91, 38), sc('deadtree', 96, 41), sc('reeds', 88, 32),
    // the island keeps its own little wood
    sc('tree', 74, 35), sc('tree2', 80, 36), sc('rock', 67, 37),
  ];

  // set dressing — cosmetic, walk-through
  const PROPS = [
    { kind: 'lamppost', x: 424, y: 278, glow: true },
    { kind: 'lamppost', x: 792, y: 278, glow: true },
    { kind: 'lamppost', x: 1160, y: 278, glow: true },
    { kind: 'lamppost', x: 1192, y: 584, glow: true },
    { kind: 'sign', x: 520, y: 388 },
    { kind: 'crate', x: 578, y: 342 },
    { kind: 'crate2', x: 588, y: 354 },
    { kind: 'drum', x: 514, y: 342 },
    { kind: 'bush', x: 700, y: 236 },
    { kind: 'bush', x: 1060, y: 500 },
    { kind: 'bush', x: 250, y: 470 },
  ];

  const MAP = {
    FOREST: { n: 48, e: 32, s: 32, w: 32 },
    REGIONS, GROUND, PLATEAUS, WALLS, CROSSINGS, NODES,
  };

  K.register({
    id: 'frontier', W, H, spawn: { x: 546, y: 352 },
    LEGACY: { slogi: 'p1', slova: 'p2', stroki: 'p3' },
    MAP, PLOTS, SCENERY, PROPS,
  });
})();
