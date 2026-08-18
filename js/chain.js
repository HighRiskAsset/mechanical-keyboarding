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
    { id: 'p16', x: 1380, y: 100, region: 'bog' },
    { id: 'p17', x: 1700, y: 130, region: 'flats' },
    { id: 'p18', x: 1900, y: 130, region: 'peaks' },
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
    // coal bog
    sc('reeds', 76, 7), sc('reeds2', 82, 12), sc('reeds', 90, 7), sc('reeds3', 78, 14),
    sc('deadtree', 83, 5), sc('deadtree2', 91, 13), sc('deadtree', 89, 10),
    // oil flats
    sc('scrub', 96, 6), sc('scrub2', 101, 13), sc('scrub', 110, 6), sc('boulder2', 109, 13),
    sc('tarpool', 95, 13), sc('scrub3', 103, 4), sc('boulder', 100, 4),
    // titanium peaks
    sc('snowpine', 116, 5), sc('snowpine2', 118, 14), sc('snowpine', 130, 11), sc('boulder2', 122, 14),
    sc('spire2', 131, 5), sc('snowpine3', 126, 10),
  ];

  // The terrain. Regions run west→east, one per tier of the tech tree; each
  // has its own ground kind and cliff palette. GROUND rects paint over the
  // region base in order; PLATEAUS are raised ground (elev 1) with a boulder
  // face on their south edge and stairs where `ramps` says; WALLS are rock
  // heaps (solid); CROSSINGS are the closed choke points between regions —
  // each opens after the edition (Издание) named in opensAfter. Rects are
  // 16px-grid aligned. tiles.js bakes all of this into a tile grid.
  const MAP = {
    TREELINE: 48,          // rows above this are the border forest (player's north limit)
    REGIONS: [
      { id: 'meadow', x: 0, w: 528, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
      { id: 'quarry', x: 528, w: 320, base: 'rock', cliff: 'tan', treeline: ['spire', 'boulder', 'boulder2'] },
      { id: 'canyon', x: 848, w: 320, base: 'shale', cliff: 'violet', treeline: ['spire', 'deadtree', 'spire2'] },
      { id: 'bog', x: 1168, w: 320, base: 'marsh', cliff: 'grey', treeline: ['deadtree', 'deadtree2', 'reeds'] },
      { id: 'flats', x: 1488, w: 320, base: 'crack', cliff: 'tan', treeline: ['boulder', 'scrub', 'boulder2'] },
      { id: 'peaks', x: 1808, w: 320, base: 'snow', cliff: 'snow', treeline: ['snowpine', 'snowpine2', 'spire'] },
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
      // — crystal canyon: the stream with a sand bank, worn floor
      { kind: 'sand', x: 880, y: 48, w: 16, h: 192 },
      { kind: 'water', x: 848, y: 48, w: 32, h: 192 },
      { kind: 'dirt', x: 992, y: 112, w: 64, h: 32 },  // p15 apron
      { kind: 'dirt', x: 928, y: 176, w: 96, h: 16 },
      // — coal bog: bog water on the west edge, pools, boardwalk planks
      { kind: 'water', x: 1168, y: 48, w: 32, h: 192 },
      { kind: 'water', x: 1232, y: 64, w: 64, h: 32 },
      { kind: 'water', x: 1344, y: 176, w: 80, h: 48 },
      { kind: 'water', x: 1408, y: 64, w: 48, h: 32 },
      { kind: 'board', x: 1200, y: 160, w: 144, h: 16 },
      { kind: 'board', x: 1344, y: 192, w: 80, h: 16 },
      { kind: 'dirt', x: 1280, y: 112, w: 64, h: 32 }, // coal seam apron
      { kind: 'dirt', x: 1360, y: 80, w: 64, h: 32 },  // p16 apron
      // — oil flats: tar pools, a mesa
      { kind: 'tar', x: 1552, y: 144, w: 48, h: 32 },
      { kind: 'tar', x: 1680, y: 64, w: 64, h: 32 },
      { kind: 'tar', x: 1728, y: 176, w: 48, h: 32 },
      { kind: 'dirt', x: 1600, y: 112, w: 64, h: 32 }, // oil derrick apron
      { kind: 'dirt', x: 1680, y: 112, w: 64, h: 32 }, // p17 apron
      { kind: 'rock', x: 1600, y: 176, w: 96, h: 48 }, // mesa top
      // — titanium peaks: frost grass, an ice pond
      { kind: 'frost', x: 1856, y: 96, w: 48, h: 32 },
      { kind: 'frost', x: 2000, y: 64, w: 64, h: 32 },
      { kind: 'ice', x: 1904, y: 176, w: 80, h: 48 },
      { kind: 'dirt', x: 1888, y: 112, w: 64, h: 32 }, // p18 apron
      { kind: 'rock', x: 2000, y: 48, w: 48, h: 32 },  // titanium seam apron (shelf interior)
    ],
    // A plateau's N/E/W ring tiles bake as solid rim (boulder band), so the
    // walkable top is the rect inset by one tile on those sides; the face sits
    // on the row(s) below. Author with that inset in mind.
    PLATEAUS: [
      { x: 320, y: 48, w: 96, h: 48, face: 1, ramps: [{ x: 352, y: 96, side: 'S' }] },        // meadow knoll (p8)
      { x: 592, y: 48, w: 96, h: 48, face: 2, ramps: [{ x: 624, y: 96, side: 'S' }] },        // quarry terrace A (p13)
      { x: 720, y: 128, w: 112, h: 64, face: 1, ramps: [{ x: 768, y: 192, side: 'S' }] },     // quarry terrace B (stone); N/E/W ring is rim
      { x: 912, y: 48, w: 128, h: 32, face: 1 },                                              // canyon north wall
      { x: 1600, y: 176, w: 96, h: 48, face: 1, ramps: [{ x: 1600, y: 192, side: 'W' }] },    // flats mesa
      { x: 1968, y: 48, w: 96, h: 48, face: 2, ramps: [{ x: 2000, y: 96, side: 'S' }] },      // peaks shelf (titanium)
    ],
    WALLS: [
      { x: 528, y: 48, w: 16, h: 80 }, { x: 528, y: 160, w: 16, h: 80 },       // meadow|quarry, gap rows 8–9
      { x: 912, y: 208, w: 224, h: 16 },                                       // canyon south wall
      { x: 1488, y: 48, w: 16, h: 32 }, { x: 1488, y: 112, w: 16, h: 128 },    // bog|flats, gap rows 5–6
      { x: 1808, y: 48, w: 16, h: 80 }, { x: 1808, y: 160, w: 16, h: 80 },     // flats|peaks, gap rows 8–9
    ],
    CROSSINGS: [
      { id: 'x1', kind: 'pass', x: 528, y: 128, w: 16, h: 32, opensAfter: 'ed1', style: 'grey' },  // fallen grey rock in a tan wall
      { id: 'x2', kind: 'bridge', x: 848, y: 96, w: 32, h: 32, opensAfter: 'ed2' },
      { id: 'x3', kind: 'boardwalk', x: 1168, y: 160, w: 32, h: 32, opensAfter: 'ed3' },
      { id: 'x4', kind: 'pass', x: 1488, y: 80, w: 16, h: 32, opensAfter: 'ed4', style: 'grey' },
      { id: 'x5', kind: 'drift', x: 1808, y: 128, w: 16, h: 32, opensAfter: 'ed5' },
    ],
    NODES: [
      { kind: 'iron', x: 92, y: 54 },
      { kind: 'copper', x: 130, y: 138 },
      { kind: 'quartz', x: 250, y: 178 },     // moves to the canyon when tier 3 lands
      { kind: 'stone', x: 752, y: 166 },
      { kind: 'coal', x: 1296, y: 118 },
      { kind: 'oil', x: 1616, y: 118 },
      { kind: 'titan', x: 2016, y: 54 },
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

  const WORLD_W = 2128; // 133 x 15 tiles of 16px: meadow 33 + five regions of 20
  const WORLD_H = 240;
  const TILE = 16;

  // a crossing opens once the edition it names has been passed; naming an
  // edition that doesn't exist yet keeps it honestly closed
  function crossingOpen(profile, c) {
    const i = MILESTONES.findIndex((m) => m.id === c.opensAfter);
    return i !== -1 && (profile.milestoneIdx || 0) > i;
  }
  function regionAt(px) {
    return MAP.REGIONS.find((r) => px >= r.x && px < r.x + r.w) || MAP.REGIONS[0];
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
