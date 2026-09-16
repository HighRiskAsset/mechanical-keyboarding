// OPEN RANGE: one flat meadow, every node in a row, and below them nothing
// at all, bare grass to lay a factory out on however you like. Tests the
// mechanics (build, deliver, automate, belt) without walking or geography.
//
// FREE BUILD since 2026-08-28. The map used to carry fifty-seven surveyed
// sites in three ranks, and a machine could only stand on one of them; the
// sites are gone, so a body may go down on any clear
// ground. The obstacles still rule: the treeline, the scenery, the pools and
// the seams themselves refuse a placement, and belts still have to find a
// lane between whatever you put in their way. The Frontier was meant to
// keep its sites so the two styles could be played against each other; it
// went free too on 2026-09-14, and every map builds this way now.
//
// (The ranks were laid on an 80px pitch in the 2026-08-21 rework to give
// every site all four facings; that geometry is what set the meadow's size,
// and the meadow keeps it. The pitch survives in the vein row above.)
(function () {
  'use strict';
  const K = window.MAPKIT;
  const { sc } = K;

  const W = 2848, H = 464;                        // 178 × 29 tiles
  // The vein row: nineteen seams on tile lines, alternating across and on
  // end — the flat map is where both seatings get walked into first
  // (MAPKIT.veinBox). Node x = 112 + 80k, so a seam takes cols 7+5k (and
  // 8+5k when it lies across) on row 3, the first row inside the treeline.
  //
  // The row was thirteen until 2026-08-28 and carried the pre-2026-08-25 cut
  // (iron 3, copper 2, and one of everything else) which `dev/ore-load.js`
  // called SHORT OF COPPER on both courses. It is nineteen now and carries
  // the same cut The Frontier does (iron 3 · copper 4 · stone 3 · quartz 3 ·
  // coal 3 · oil 3): the test map is where a player tries the mechanics
  // without walking, and it cannot test a supply the real world has and it
  // does not. Three full turns of the six ores, then the fourth copper the
  // tree leans on. How many of each is not authored here (see DESIGN.md,
  // *Veins follow the tree*); the map only lays out what the check asks for.
  // The map grew east to take them, six columns of meadow on the same 80px
  // pitch, and nothing else about it moved: every seam that was here is on
  // the ground it was on, so a save comes back untouched.
  //
  // Thirty-four since 2026-09-13, the same cut as The Frontier (R1 5, R2 4,
  // R3 3, R4 3, R5 3, two of every later raw). The v4 tree has thirteen raws,
  // and R7 to R13 had one seam each. The row grew east again on the same
  // pitch, with the new seams appended so every old one keeps its index.
  //
  // R5 and R9 have no seams since 2026-09-16: water and crude oil come from
  // pools, each taking exactly one four-by-four extractor, laid in a second
  // row below the seams under the slot each one used to hold. Their places in
  // the seam row are `null`, empty ground a save may still name, so every
  // index holds.
  const COLS = Array.from({ length: 34 }, (_, k) => 112 + 80 * k);
  const NODE_KINDS = ['R1', 'R2', 'R3', 'R4', null, 'R6',
    'R7', 'R8', null, 'R10', 'R11', 'R12',
    'R13', 'R1', 'R2', 'R3', 'R4', null, 'R6',
    'R7', 'R8', null, 'R10', 'R11', 'R12', 'R13',
    'R1', 'R2', 'R3', 'R4', null, 'R1', 'R2', 'R1'];
  // every raw with two seams or more gets one of each seating
  const VERT = new Set([0, 3, 4, 7, 8, 11, 13, 14, 16, 17, 19, 22, 23, 25, 27, 28, 31]);
  const NODES = COLS.map((x, k) => (VERT.has(k)
    ? { kind: NODE_KINDS[k], x, y: 48, vert: true }
    : { kind: NODE_KINDS[k], x, y: 48 }));
  // the pools, appended so no index moves: each a four by four on tile lines
  // in rows 10 to 13, under the seam slot its raw gave up. The raws named
  // here must agree with the tree's `pools`.
  const POOL_RAWS = new Set(['R5', 'R9']);
  for (const [k, kind] of [[4, 'R5'], [17, 'R5'], [30, 'R5'], [8, 'R9'], [21, 'R9']]) NODES.push({ kind, x: 112 + 80 * k, y: 160 });

  const SCENERY = [
    sc('tree', 5, 24), sc('tree2', 12, 25), sc('rock', 19, 24), sc('tree', 26, 25),
    sc('rock2', 33, 24), sc('tree2', 40, 25), sc('tree', 47, 24), sc('rock', 54, 25),
    sc('tree2', 60, 24), sc('rock2', 63, 26), sc('tree', 68, 24),
    // the six columns the row grew east
    sc('tree2', 75, 25), sc('rock', 82, 24), sc('tree', 89, 25), sc('rock2', 96, 24),
    // and the fifteen it grew for the v4 raws
    sc('tree', 103, 25), sc('rock', 110, 24), sc('tree2', 117, 25), sc('tree', 124, 24),
    sc('rock2', 131, 25), sc('tree2', 138, 24), sc('tree', 145, 25), sc('rock', 152, 24),
    sc('tree2', 159, 25), sc('rock2', 166, 24), sc('tree', 173, 25),
  ];

  const PROPS = [
    { kind: 'lamppost', x: 92, y: 106, glow: true },
    { kind: 'lamppost', x: 372, y: 106, glow: true },
    { kind: 'lamppost', x: 652, y: 106, glow: true },
    { kind: 'lamppost', x: 932, y: 106, glow: true },
    { kind: 'lamppost', x: 1492, y: 106, glow: true },
    { kind: 'lamppost', x: 2052, y: 106, glow: true },
    { kind: 'lamppost', x: 2612, y: 106, glow: true },
    { kind: 'crate', x: 1106, y: 90 },
    { kind: 'crate2', x: 1116, y: 100 },
    { kind: 'drum', x: 30, y: 178 },
    { kind: 'sign', x: 84, y: 166 },
    { kind: 'bush', x: 330, y: 84 },
    { kind: 'bush', x: 740, y: 388 },
  ];

  const MAP = {
    FOREST: { n: 48, e: 32, s: 32, w: 32 },
    REGIONS: [
      { id: 'range', x: 0, y: 0, w: 2848, h: 464, elev: 0, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
    ],
    GROUND: [
      // the dish under every seam, lying the way the seam does
      ...NODES.filter((n) => n.kind && !POOL_RAWS.has(n.kind)).map((n) => (n.vert
        ? { kind: 'dirt', x: n.x - 8, y: n.y - 4, w: 32, h: 48 }
        : { kind: 'dirt', x: n.x - 4, y: n.y - 8, w: 48, h: 32 })),
      { kind: 'pad', x: 32, y: 128, w: 48, h: 32 },
      { kind: 'dirt', x: 80, y: 96, w: 2704, h: 16 },   // the track under the row, out to the last seam
      { kind: 'dirt', x: 80, y: 112, w: 16, h: 16 },
      { kind: 'dirt', x: 128, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 208, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 288, y: 80, w: 16, h: 16 },
      { kind: 'dirt', x: 2768, y: 80, w: 16, h: 16 },
      // The meadow below the row is bare on purpose. The worn aprons that
      // marked the three ranks went out with the sites: a patch of laid
      // dirt reads as an invitation to stand on it, and this ground has no
      // favourites any more.
      //
      // each pool in its own shore: sand round the water, a stained dirt rim
      // round the crude, and the pool itself the four by four an extractor
      // stands on (2026-09-16)
      ...NODES.filter((n) => POOL_RAWS.has(n.kind)).flatMap((n) => [
        { kind: n.kind === 'R9' ? 'dirt' : 'sand', x: n.x - 16, y: n.y - 16, w: 96, h: 96 },
        { kind: n.kind === 'R9' ? 'tar' : 'water', x: n.x, y: n.y, w: 64, h: 64 },
      ]),
    ],
    PLATEAUS: [],
    WALLS: [],
    CROSSINGS: [],
    NODES,
  };

  // Open meadow, low ground, nothing to make its own weather: mild skies, and
  // snow only now and then. Weights, not rates; the sky is paint here too.
  const WEATHER = { snow: 0.3, storm: 0.6, fog: 0.8 };

  K.register({
    id: 'range', W, H, spawn: { x: 84, y: 154 },
    LEGACY: {},
    MAP, SCENERY, PROPS, WEATHER,
  });
})();
