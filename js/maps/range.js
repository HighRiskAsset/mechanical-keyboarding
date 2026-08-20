// OPEN RANGE — one flat meadow the width of the frontier, every node in a
// row, ranks of plots below, nothing in the way. Tests the mechanics (build,
// deliver, automate, belt) without walking or geography.
(function () {
  'use strict';
  const K = window.MAPKIT;
  const { sc, apron } = K;

  const COLS = Array.from({ length: 13 }, (_, k) => 112 + 80 * k);
  // Ranks of plots below the veins. A plot is a 3x2 pad and wants five tiles
  // across and four deep for all three of its turns to be legal, so the ranks
  // are laid on their own lattice rather than under the vein columns: a tile
  // left of each vein, and set clear of the vein row above and the treeline
  // below, with the ranks far enough apart that their aprons stay separate
  // patches instead of running together into one field.
  const PLOT_COLS = Array.from({ length: 13 }, (_, k) => 96 + 80 * k);
  const PLOT_ROWS = [144, 208, 272];
  const PLOTS = [];
  for (const x of COLS.slice(7, 13)) PLOTS.push({ id: 'p' + (PLOTS.length + 1), x, y: 66 });
  for (const y of PLOT_ROWS) for (const x of PLOT_COLS) PLOTS.push({ id: 'p' + (PLOTS.length + 1), x, y });

  const SCENERY = [
    sc('tree', 5, 20), sc('tree2', 12, 21), sc('rock', 19, 20), sc('tree', 26, 21),
    sc('rock2', 33, 20), sc('tree2', 40, 21), sc('tree', 47, 20), sc('rock', 54, 21),
    sc('tree2', 60, 20), sc('rock2', 63, 22), sc('tree', 68, 20),
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
    { kind: 'bush', x: 740, y: 340 },
  ];

  const MAP = {
    FOREST: { n: 48, e: 32, s: 32, w: 32 },
    REGIONS: [
      { id: 'range', x: 0, y: 0, w: 1168, h: 416, elev: 0, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
    ],
    GROUND: [
      ...COLS.map((x) => apron(x, 66)),
      { kind: 'pad', x: 32, y: 128, w: 48, h: 32 },
      { kind: 'dirt', x: 80, y: 96, w: 1024, h: 16 },
      { kind: 'dirt', x: 80, y: 112, w: 16, h: 16 },
      { kind: 'dirt', x: 128, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 208, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 288, y: 80, w: 16, h: 16 },
      { kind: 'dirt', x: 1088, y: 80, w: 16, h: 16 },
      ...PLOT_ROWS.flatMap((y) => PLOT_COLS.map((x) => apron(x, y))),
      { kind: 'sand', x: 1024, y: 320, w: 112, h: 64 },
      { kind: 'water', x: 1040, y: 336, w: 80, h: 32 },
    ],
    PLATEAUS: [],
    WALLS: [],
    CROSSINGS: [],
    NODES: [
      { kind: 'iron', x: 108, y: 54 },
      { kind: 'copper', x: 188, y: 54 },
      { kind: 'stone', x: 268, y: 54 },
      { kind: 'quartz', x: 348, y: 54 },
      { kind: 'coal', x: 428, y: 54 },
      { kind: 'oil', x: 508, y: 54 },
      { kind: 'iron', x: 588, y: 54 },
      // phase 4: the rest of the pyramid along row A
      { kind: 'copper', x: 668, y: 54 },
      { kind: 'stone', x: 748, y: 54 },
      { kind: 'quartz', x: 828, y: 54 },
      { kind: 'coal', x: 908, y: 54 },
      { kind: 'oil', x: 988, y: 54 },
      { kind: 'iron', x: 1068, y: 54 },
    ],
  };

  K.register({
    id: 'range', W: 1168, H: 416, spawn: { x: 84, y: 154 },
    LEGACY: {},
    MAP, PLOTS, SCENERY, PROPS,
  });
})();
