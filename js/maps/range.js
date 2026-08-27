// OPEN RANGE — one flat meadow the width of the frontier, every node in a
// row, ranks of build sites below, nothing in the way. Tests the mechanics
// (build, deliver, automate, belt) without walking or geography.
//
// Re-laid 2026-08-21 to the four-facing guarantee. A 3x3 site costs the
// ground around it as much as the site itself — two clear tiles off every
// side, for the port and for the tile the run arrives on — so the ranks
// moved from a 64px pitch to 80px, matching the columns, and the meadow grew
// three rows to take them. THIS MAP IS THE EASY ONE: every site here is a
// full 3x3 with all four facings legal, so a kind can be put down any way up
// anywhere, and any shortfall shows up on The Frontier first.
(function () {
  'use strict';
  const K = window.MAPKIT;
  const { sc, apron } = K;

  const W = 1168, H = 464;                        // 73 × 29 tiles
  // The vein row: thirteen seams on tile lines, alternating across and on
  // end — the flat map is where both seatings get walked into first
  // (MAPKIT.veinBox). Node x = 112 + 80k, so a seam takes cols 7+5k (and
  // 8+5k when it lies across) on row 3, the first row inside the treeline.
  const COLS = Array.from({ length: 13 }, (_, k) => 112 + 80 * k);
  const NODE_KINDS = ['iron', 'copper', 'stone', 'quartz', 'coal', 'oil', 'iron',
    'copper', 'stone', 'quartz', 'coal', 'oil', 'iron'];
  const VERT = new Set([0, 3, 4, 7, 8, 11]);      // every ore gets one of each
  const NODES = COLS.map((x, k) => (VERT.has(k)
    ? { kind: NODE_KINDS[k], x, y: 48, vert: true }
    : { kind: NODE_KINDS[k], x, y: 48 }));

  // Ranks of build sites below the veins, on the same 80px lattice as the
  // columns but half a step off it, so no site ever stands directly under a
  // seam: a vein bedded on end reaches down to row 4, and a site in that
  // column would lose the two rows it needs above it to face east or west.
  const SITE_COLS = Array.from({ length: 13 }, (_, k) => 96 + 80 * k);
  const SITE_ROWS = [160, 240, 320];              // sites on rows 7–9, 12–14, 17–19
  const SITES = [];
  for (const y of SITE_ROWS) for (const x of SITE_COLS) SITES.push({ id: 'p' + (SITES.length + 1), x, y });

  const SCENERY = [
    sc('tree', 5, 24), sc('tree2', 12, 25), sc('rock', 19, 24), sc('tree', 26, 25),
    sc('rock2', 33, 24), sc('tree2', 40, 25), sc('tree', 47, 24), sc('rock', 54, 25),
    sc('tree2', 60, 24), sc('rock2', 63, 26), sc('tree', 68, 24),
  ];

  const PROPS = [
    { kind: 'lamppost', x: 92, y: 106, glow: true },
    { kind: 'lamppost', x: 372, y: 106, glow: true },
    { kind: 'lamppost', x: 652, y: 106, glow: true },
    { kind: 'lamppost', x: 932, y: 106, glow: true },
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
      { id: 'range', x: 0, y: 0, w: 1168, h: 464, elev: 0, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
    ],
    GROUND: [
      // the dish under every seam, lying the way the seam does
      ...NODES.map((n) => (n.vert
        ? { kind: 'dirt', x: n.x - 8, y: n.y - 4, w: 32, h: 48 }
        : { kind: 'dirt', x: n.x - 4, y: n.y - 8, w: 48, h: 32 })),
      { kind: 'pad', x: 32, y: 128, w: 48, h: 32 },
      { kind: 'dirt', x: 80, y: 96, w: 1024, h: 16 },
      { kind: 'dirt', x: 80, y: 112, w: 16, h: 16 },
      { kind: 'dirt', x: 128, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 208, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 288, y: 80, w: 16, h: 16 },
      { kind: 'dirt', x: 1088, y: 80, w: 16, h: 16 },
      ...SITE_ROWS.flatMap((y) => SITE_COLS.map((x) => apron(x, y))),
      // the pond sits in the south strip, below every site's last port row
      { kind: 'sand', x: 1008, y: 368, w: 112, h: 64 },
      { kind: 'water', x: 1024, y: 384, w: 80, h: 32 },
    ],
    PLATEAUS: [],
    WALLS: [],
    CROSSINGS: [],
    NODES,
  };

  K.register({
    id: 'range', W, H, spawn: { x: 84, y: 154 },
    LEGACY: {},
    MAP, SITES, SCENERY, PROPS,
  });
})();
