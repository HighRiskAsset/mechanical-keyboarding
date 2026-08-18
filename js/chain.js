// The production chain and the map: stations, plots, scenery, milestones.
// Walking IS the menu; this file is the world's data. Global: CHAIN
//
// Building ruling (2026-08-11): the chain is AUTHORED — what stations exist
// and what they consume/produce is the curriculum. The player chooses WHICH
// free plot each new station occupies (kits earned at the milestone board).
// Scenery makes the map uneven: some areas walled off, plots unevenly spread.
// Bounded strategy — arranging walk routes, never ratio planning.
(function () {
  'use strict';

  const L = window.LANG_RU;

  // Letter sets per tier-1 bench (curriculum legs wearing old Slavic letter names).
  const SET_AZ = L.UNLOCK_ORDER.slice(0, 6);     // о е а и н т
  const SET_BUKI = L.UNLOCK_ORDER.slice(6, 14);  // с л в р к м д п
  const SET_VEDI = L.UNLOCK_ORDER.slice(14, 23); // ы у б я ь г з ч й

  // Station defs. x/y = DEFAULT plot (pre-built stations start there; movable
  // stations resolve through profile.plots). Consumption ratios are
  // per-correct-letter (fractions accumulate); perLine consumes on line finish.
  // upgradeCost turns a tier-1 bench into an automation (auto-feeds its belt).
  // buildCost marks a kit-built station: its kit is earned at the milestone
  // board, then erected on any free plot the player chooses.
  const STATIONS = [
    { id: 'board', x: 30, y: 108, tier: 0, kind: 'board', unlockAt: 0 },
    { id: 'az', x: 96, y: 66, tier: 1, kind: 'bench', mode: 'letters', focus: SET_AZ, out: 'az', unlockAt: 0, upgradeCost: { slogi: 30, az: 90 } },
    { id: 'slogi', x: 176, y: 66, tier: 2, kind: 'slogi', mode: 'bigrams', out: 'slogi', consume: { az: 0.5 }, recipe: { az: 2 }, buildCost: { az: 60 }, unlockAt: 8 },
    { id: 'buki', x: 136, y: 150, tier: 1, kind: 'bench', mode: 'letters', focus: SET_BUKI, out: 'buki', unlockAt: 0, upgradeCost: { slova: 18, buki: 90 } },
    { id: 'slova', x: 256, y: 108, tier: 3, kind: 'slova', mode: 'words', out: 'slova', consume: { az: 0.2, slogi: 0.34, buki: 0.34 }, recipe: { az: 1, slogi: 2, buki: 2 }, buildCost: { slogi: 40, buki: 50 }, unlockAt: 10 },
    { id: 'vedi', x: 256, y: 190, tier: 1, kind: 'bench', mode: 'letters', focus: SET_VEDI, out: 'vedi', unlockAt: 0, upgradeCost: { stroki: 10, vedi: 90 } },
    { id: 'stroki', x: 356, y: 130, tier: 4, kind: 'stroki', mode: 'lines', out: 'stroki', consume: { slova: 0.25, vedi: 0.2 }, recipe: { slova: 8, vedi: 6 }, buildCost: { slova: 30, vedi: 40 }, unlockAt: 14 },
    { id: 'press', x: 446, y: 96, tier: 5, kind: 'press', mode: 'lines', out: 'listy', perLine: { stroki: 1 }, fallbackPerLine: { az: 8 }, recipe: { stroki: 1 }, unlockAt: 0 },
  ];

  // Buildable plots. Pre-built stations occupy their defaults; the rest are
  // the player's to choose. Unevenly spread on purpose — map variance.
  // p13+ live in the eastern regions (2026-08-18) — reachable once the
  // region's crossing opens.
  const PLOTS = [
    { id: 'p1', x: 96, y: 66 },
    { id: 'p2', x: 176, y: 66 },
    { id: 'p3', x: 136, y: 150 },
    { id: 'p4', x: 256, y: 108 },
    { id: 'p5', x: 256, y: 190 },
    { id: 'p6', x: 356, y: 130 },
    { id: 'p7', x: 446, y: 96 },
    { id: 'p8', x: 356, y: 66 },     // on the meadow knoll (stairs at x=352)
    { id: 'p9', x: 60, y: 150 },
    { id: 'p10', x: 446, y: 190 },
    { id: 'p11', x: 176, y: 210 },
    { id: 'p12', x: 316, y: 190 },
    { id: 'p13', x: 608, y: 82, region: 'quarry' },   // terrace top
    { id: 'p14', x: 672, y: 210, region: 'quarry' },
    { id: 'p15', x: 1000, y: 130, region: 'canyon' },
    { id: 'p16', x: 1044, y: 324, region: 'bog' },
    { id: 'p17', x: 740, y: 354, region: 'flats' },
    { id: 'p18', x: 92, y: 354, region: 'peaks' },
  ];

  // Solid scenery: shapes the walking routes. Everything stands ON a tile —
  // sc(kind, tx, ty) names the tile under its base; wide kinds (FOOT_W) span
  // that many tiles to the east. The sprite is drawn centred on the footprint
  // with its base on the tile bottom (factory.js); the collision box is the
  // footprint, inset a hair. Art sizes live in pixels.js / tiles.js.
  const FOOT_W = { boulder: 2, tarpool: 2 };
  const sc = (kind, tx, ty) => {
    const fw = FOOT_W[kind.replace(/\d+$/, '')] || 1;
    return { kind, tx, ty, fw, box: { x: tx * 16 + 2, y: ty * 16 + 3, w: fw * 16 - 4, h: 12 } };
  };
  const SCENERY = [
    // meadow
    sc('tree', 13, 8), sc('tree2', 19, 7), sc('tree', 29, 10), sc('tree2', 10, 13),
    sc('rock', 9, 5), sc('rock2', 21, 13), sc('rock', 24, 4), sc('tree', 2, 10),
    // quarry hills
    sc('boulder', 35, 13), sc('boulder2', 43, 7), sc('spire', 50, 5), sc('rock', 46, 14),
    sc('tree', 38, 14), sc('boulder', 40, 4),
    // crystal canyon
    sc('crystal', 59, 10), sc('crystal2', 68, 8), sc('crystal', 71, 12), sc('deadtree', 58, 7),
    sc('spire', 70, 7), sc('rock2', 63, 11),
    // coal bog (south row, under the canyon)
    sc('reeds', 56, 21), sc('reeds2', 62, 26), sc('reeds', 70, 21), sc('reeds3', 58, 28),
    sc('deadtree', 63, 19), sc('deadtree2', 71, 27), sc('deadtree', 69, 24),
    // oil flats (under the quarry)
    sc('scrub', 36, 20), sc('scrub2', 41, 27), sc('scrub', 50, 20), sc('boulder2', 49, 27),
    sc('tarpool', 35, 27), sc('scrub3', 43, 18), sc('boulder', 40, 18),
    // titanium peaks (under the meadow)
    sc('snowpine', 3, 19), sc('snowpine2', 5, 28), sc('snowpine', 17, 25), sc('boulder2', 9, 28),
    sc('spire2', 18, 19), sc('snowpine3', 13, 24), sc('snowpine', 24, 22), sc('spire', 28, 26),
    sc('boulder', 22, 28), sc('snowpine2', 30, 20),
  ];

  // The terrain. REGIONS are biome rects placed anywhere on the map — a biome
  // has a base ground kind, a cliff palette, an elevation (higher ground shows
  // a boulder face where it drops south and a rim on its other edges) and a
  // border-forest kind. This layout is a snake: the high north row runs
  // meadow → quarry → canyon, stairs drop into the low south row, which runs
  // back west bog → flats → peaks. Nothing else assumes that shape: a new map
  // is a new set of rects. GROUND rects paint over the region base in order;
  // PLATEAUS are raised ground within a region (their N/E/W ring bakes as
  // solid rim, so author the walkable top one tile inset on those sides);
  // WALLS are rock heaps (solid); CROSSINGS are the closed choke points
  // between regions — pass/drift in a wall gap, bridge/boardwalk over water
  // (dir 'h' walked E–W, 'v' walked N–S), stairs cut through a face — each
  // opens after the edition (Издание) named in opensAfter. Rects are 16px-grid
  // aligned. tiles.js bakes all of this into a tile grid.
  const MAP = {
    FOREST: { n: 48 },     // border forest thickness per side (n/e/s/w); the player's limit
    REGIONS: [
      // north row — high ground (elev 1), a two-row face along its south edge
      { id: 'meadow', x: 0, y: 0, w: 528, h: 240, elev: 1, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
      { id: 'quarry', x: 528, y: 0, w: 320, h: 240, elev: 1, base: 'rock', cliff: 'tan', treeline: ['spire', 'boulder', 'boulder2'] },
      { id: 'canyon', x: 848, y: 0, w: 320, h: 240, elev: 1, base: 'shale', cliff: 'violet', treeline: ['spire', 'deadtree', 'spire2'] },
      // south row — lowlands (elev 0)
      { id: 'peaks', x: 0, y: 240, w: 528, h: 256, elev: 0, base: 'snow', cliff: 'snow', treeline: ['snowpine', 'snowpine2', 'spire'] },
      { id: 'flats', x: 528, y: 240, w: 320, h: 256, elev: 0, base: 'crack', cliff: 'tan', treeline: ['boulder', 'scrub', 'boulder2'] },
      { id: 'bog', x: 848, y: 240, w: 320, h: 256, elev: 0, base: 'marsh', cliff: 'grey', treeline: ['deadtree', 'deadtree2', 'reeds'] },
    ],
    GROUND: [
      // — meadow: worn aprons under mines/plots, paved pads under hub + depot,
      //   a worn road hub→depot with spurs, the pond with a sand shore
      { kind: 'dirt', x: 80, y: 48, w: 64, h: 32 },    // iron mine
      { kind: 'dirt', x: 160, y: 48, w: 64, h: 32 },   // p2
      { kind: 'dirt', x: 112, y: 128, w: 64, h: 32 },  // copper mine
      { kind: 'dirt', x: 240, y: 176, w: 64, h: 32 },  // quartz quarry
      { kind: 'dirt', x: 240, y: 96, w: 64, h: 32 },   // p4
      { kind: 'dirt', x: 336, y: 112, w: 64, h: 32 },  // p6
      { kind: 'dirt', x: 336, y: 48, w: 64, h: 32 },   // p8 (knoll)
      { kind: 'pad', x: 432, y: 80, w: 64, h: 32 },    // depot
      { kind: 'pad', x: 16, y: 96, w: 48, h: 32 },     // the hub
      { kind: 'dirt', x: 64, y: 112, w: 368, h: 16 },  // the road
      { kind: 'dirt', x: 96, y: 80, w: 16, h: 32 },    // spur north to the iron mine
      { kind: 'dirt', x: 256, y: 128, w: 16, h: 48 },  // spur south to the quarry
      { kind: 'dirt', x: 480, y: 128, w: 48, h: 32 },  // the track east to the gate
      { kind: 'sand', x: 0, y: 176, w: 112, h: 64 },
      { kind: 'water', x: 0, y: 192, w: 96, h: 48 },   // the pond, southwest
      // — quarry hills: grass tufts on stone, a worn floor
      { kind: 'grass', x: 560, y: 208, w: 64, h: 32 },
      { kind: 'grass', x: 688, y: 96, w: 48, h: 32 },
      { kind: 'dirt', x: 544, y: 128, w: 48, h: 32 },  // inside the gate
      { kind: 'dirt', x: 592, y: 64, w: 64, h: 32 },   // p13 apron (terrace top)
      { kind: 'dirt', x: 656, y: 192, w: 64, h: 32 },  // p14 apron
      { kind: 'dirt', x: 736, y: 160, w: 64, h: 32 },  // stone mine apron (terrace interior)
      // — crystal canyon: the stream with a sand bank, worn floor, the way down
      { kind: 'sand', x: 880, y: 48, w: 16, h: 192 },
      { kind: 'water', x: 848, y: 48, w: 32, h: 192 },
      { kind: 'dirt', x: 992, y: 112, w: 64, h: 32 },  // p15 apron
      { kind: 'dirt', x: 928, y: 176, w: 96, h: 16 },
      { kind: 'dirt', x: 960, y: 192, w: 32, h: 48 },  // track to the stairs down
      // — coal bog (south row, under the canyon): pools, plank walks
      { kind: 'dirt', x: 960, y: 272, w: 32, h: 16 },  // foot of the stairs
      { kind: 'water', x: 912, y: 288, w: 64, h: 32 },
      { kind: 'water', x: 1024, y: 400, w: 80, h: 48 },
      { kind: 'water', x: 1088, y: 288, w: 48, h: 32 },
      { kind: 'board', x: 880, y: 384, w: 144, h: 16 },
      { kind: 'board', x: 1024, y: 416, w: 80, h: 16 },
      { kind: 'dirt', x: 960, y: 336, w: 64, h: 32 },  // coal seam apron
      { kind: 'dirt', x: 1024, y: 304, w: 64, h: 32 }, // p16 apron
      // — oil flats (under the quarry): tar pools, a mesa
      { kind: 'tar', x: 592, y: 368, w: 48, h: 32 },
      { kind: 'tar', x: 720, y: 288, w: 64, h: 32 },
      { kind: 'tar', x: 768, y: 400, w: 48, h: 32 },
      { kind: 'dirt', x: 640, y: 336, w: 64, h: 32 },  // oil derrick apron
      { kind: 'dirt', x: 720, y: 336, w: 64, h: 32 },  // p17 apron
      { kind: 'rock', x: 640, y: 400, w: 96, h: 48 },  // mesa top
      // — titanium peaks (under the meadow): frost grass, an ice pond, a shelf
      { kind: 'frost', x: 48, y: 320, w: 48, h: 32 },
      { kind: 'frost', x: 272, y: 288, w: 64, h: 32 },
      { kind: 'ice', x: 96, y: 400, w: 80, h: 48 },
      { kind: 'dirt', x: 80, y: 336, w: 64, h: 32 },   // p18 apron
      { kind: 'rock', x: 192, y: 320, w: 48, h: 32 },  // titanium seam apron (shelf interior)
    ],
    PLATEAUS: [
      { x: 320, y: 48, w: 96, h: 48, elev: 2, face: 1, ramps: [{ x: 352, y: 96, side: 'S' }] },        // meadow knoll (p8)
      { x: 592, y: 48, w: 96, h: 48, elev: 2, face: 2, ramps: [{ x: 624, y: 96, side: 'S' }] },        // quarry terrace A (p13)
      { x: 720, y: 128, w: 112, h: 64, elev: 2, face: 1, ramps: [{ x: 768, y: 192, side: 'S' }] },     // quarry terrace B (stone)
      { x: 912, y: 48, w: 128, h: 32, elev: 2, face: 1 },                                              // canyon north wall
      { x: 640, y: 400, w: 96, h: 48, elev: 1, face: 1, ramps: [{ x: 640, y: 416, side: 'W' }] },      // flats mesa
      { x: 160, y: 304, w: 96, h: 48, elev: 1, face: 2, ramps: [{ x: 192, y: 352, side: 'S' }] },      // peaks shelf (titanium)
    ],
    WALLS: [
      { x: 528, y: 48, w: 16, h: 80 }, { x: 528, y: 160, w: 16, h: 80 },       // meadow|quarry, gap rows 8–9
      { x: 848, y: 272, w: 16, h: 32 }, { x: 848, y: 336, w: 16, h: 160 },     // flats|bog, gap rows 19–20
      { x: 528, y: 272, w: 16, h: 80 }, { x: 528, y: 384, w: 16, h: 112 },     // peaks|flats, gap rows 22–23
    ],
    CROSSINGS: [
      { id: 'x1', kind: 'pass', x: 528, y: 128, w: 16, h: 32, opensAfter: 'ed1', style: 'grey' },    // fallen grey rock in a tan wall
      { id: 'x2', kind: 'bridge', x: 848, y: 96, w: 32, h: 32, opensAfter: 'ed2', dir: 'h' },        // over the canyon stream
      { id: 'x3', kind: 'stairs', x: 960, y: 240, w: 32, h: 32, opensAfter: 'ed3', style: 'violet' }, // down the canyon face into the bog
      { id: 'x4', kind: 'pass', x: 848, y: 304, w: 16, h: 32, opensAfter: 'ed4', style: 'grey' },    // bog → flats
      { id: 'x5', kind: 'drift', x: 528, y: 352, w: 16, h: 32, opensAfter: 'ed5' },                  // flats → peaks
    ],
    NODES: [
      { kind: 'iron', x: 92, y: 54 },
      { kind: 'copper', x: 130, y: 138 },
      { kind: 'quartz', x: 250, y: 178 },     // moves to the canyon when tier 3 lands
      { kind: 'stone', x: 752, y: 166 },
      { kind: 'coal', x: 976, y: 342 },
      { kind: 'oil', x: 656, y: 342 },
      { kind: 'titan', x: 208, y: 326 },
    ],
  };

  // The milestone ladder: goals paid with hand-crafted production; kit rewards
  // open tier-2+ stations (still curriculum-gated by unlockAt). The final
  // milestone of an era is an ИЗДАНИЕ — it cannot be hand-stocked: it demands
  // an automated base plus a live benchmark run at the press.
  const MILESTONES = [
    { id: 'm1', goal: { az: 60 }, reward: 'slogi' },
    { id: 'm2', goal: { slogi: 25, buki: 60 }, reward: 'slova' },
    { id: 'm3', goal: { slova: 15, vedi: 50 }, reward: 'stroki' },
    { id: 'ed1', edition: true, era: 'steam', needAuto: 'az', lines: 3, acc: 0.97 },
  ];

  // Belts: purchased links; once built, an automated source auto-feeds its target.
  const BELTS = [
    { from: 'az', to: 'slogi', cost: { az: 80 } },
    { from: 'slogi', to: 'slova', cost: { slogi: 50 } },
    { from: 'buki', to: 'slova', cost: { buki: 60 } },
    { from: 'az', to: 'slova', cost: { az: 80 } },
    { from: 'slova', to: 'stroki', cost: { slova: 40 } },
    { from: 'vedi', to: 'stroki', cost: { vedi: 50 } },
    { from: 'stroki', to: 'press', cost: { stroki: 25 } },
  ];
  const beltKey = (b) => b.from + '>' + b.to;

  const PICKUP_CAP = 100; // automated benches refill you to this on approach

  const WORLD_W = 1168; // 73 x 31 tiles of 16px: two rows of three biomes
  const WORLD_H = 496;
  const TILE = 16;

  // a crossing opens once the edition it names has been passed; naming an
  // edition that doesn't exist yet keeps it honestly closed
  function crossingOpen(profile, c) {
    const i = MILESTONES.findIndex((m) => m.id === c.opensAfter);
    return i !== -1 && (profile.milestoneIdx || 0) > i;
  }
  // the biome under a world point (later rects win, like the bake); the first
  // region is home when the point is outside all of them
  function regionAt(px, py) {
    let hit = MAP.REGIONS[0];
    for (const r of MAP.REGIONS) {
      const y0 = r.y || 0, h = r.h || WORLD_H;
      if (px >= r.x && px < r.x + r.w && py >= y0 && py < y0 + h) hit = r;
    }
    return hit;
  }

  function available(profile) {
    return STATIONS.filter((s) => profile.unlockedCount >= s.unlockAt);
  }
  function get(id) {
    return STATIONS.find((s) => s.id === id);
  }
  function plotById(id) {
    return PLOTS.find((p) => p.id === id);
  }
  // stations resolve their coordinates through the player's plot choices
  function resolvePositions(profile) {
    for (const st of STATIONS) {
      const plotId = profile.plots && profile.plots[st.id];
      const plot = plotId && plotById(plotId);
      if (plot) { st.x = plot.x; st.y = plot.y; }
    }
  }
  function freePlots(profile) {
    const taken = new Set(Object.values(profile.plots || {}));
    return PLOTS.filter((p) => !taken.has(p.id));
  }
  function affordable(profile, cost) {
    return Object.entries(cost).every(([mat, n]) => (profile.mats[mat] || 0) >= n);
  }
  function isBuilt(profile, st) {
    return !st.buildCost || !!profile.built[st.id];
  }
  // kit-built stations need their milestone earned before they can be placed
  function kitUnlocked(profile, st) {
    const idx = MILESTONES.findIndex((m) => m.reward === st.id);
    return idx === -1 || idx < (profile.milestoneIdx || 0);
  }
  // the next kit awaiting placement: milestone earned, curriculum met, unbuilt
  function pendingKit(profile) {
    return STATIONS.find((s) =>
      s.buildCost && !profile.built[s.id] &&
      kitUnlocked(profile, s) && profile.unlockedCount >= s.unlockAt) || null;
  }
  function currentMilestone(profile) {
    return MILESTONES[profile.milestoneIdx || 0] || null;
  }
  function canDeliver(profile) {
    const m = currentMilestone(profile);
    return !!(m && !m.edition && affordable(profile, m.goal));
  }
  function canUpgrade(profile, st) {
    if (!st || !st.upgradeCost || profile.autoBench[st.id]) return false;
    return affordable(profile, st.upgradeCost);
  }
  // next purchasable belt whose source is this station (source must be automated,
  // both endpoints built)
  function nextBelt(profile, st) {
    if (!st || !profile.autoBench[st.id]) return null;
    for (const b of BELTS) {
      if (b.from !== st.id) continue;
      if (profile.belts[beltKey(b)]) continue;
      const to = get(b.to);
      if (profile.unlockedCount < to.unlockAt || !isBuilt(profile, to)) continue;
      return b;
    }
    return null;
  }

  window.CHAIN = {
    STATIONS, BELTS, PLOTS, SCENERY, MAP, MILESTONES,
    WORLD_W, WORLD_H, TILE, PICKUP_CAP, beltKey,
    available, get, plotById, resolvePositions, freePlots,
    affordable, isBuilt, kitUnlocked, pendingKit, currentMilestone, canDeliver,
    canUpgrade, nextBelt, crossingOpen, regionAt,
    SET_AZ, SET_BUKI, SET_VEDI,
  };
})();
