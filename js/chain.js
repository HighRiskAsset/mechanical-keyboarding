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
  const PLOTS = [
    { id: 'p1', x: 96, y: 66 },
    { id: 'p2', x: 176, y: 66 },
    { id: 'p3', x: 136, y: 150 },
    { id: 'p4', x: 256, y: 108 },
    { id: 'p5', x: 256, y: 190 },
    { id: 'p6', x: 356, y: 130 },
    { id: 'p7', x: 446, y: 96 },
    { id: 'p8', x: 356, y: 66 },
    { id: 'p9', x: 60, y: 150 },
    { id: 'p10', x: 446, y: 190 },
    { id: 'p11', x: 176, y: 210 },
    { id: 'p12', x: 316, y: 190 },
  ];

  // Solid scenery: shapes the walking routes (box = collision rect).
  const SCENERY = [
    { kind: 'tree', x: 204, y: 100, box: { x: 208, y: 122, w: 13, h: 6 } },
    { kind: 'tree2', x: 298, y: 84, box: { x: 302, y: 106, w: 13, h: 6 } },
    { kind: 'tree', x: 466, y: 136, box: { x: 470, y: 158, w: 13, h: 6 } },
    { kind: 'tree2', x: 150, y: 180, box: { x: 154, y: 202, w: 13, h: 6 } },
    { kind: 'rock', x: 146, y: 84, box: { x: 147, y: 88, w: 14, h: 7 } },
    { kind: 'rock2', x: 338, y: 198, box: { x: 339, y: 202, w: 14, h: 7 } },
    { kind: 'rock', x: 390, y: 60, box: { x: 391, y: 64, w: 14, h: 7 } },
  ];

  // The terrain: dirt work-aprons, water (unwalkable), and the ore nodes the
  // tier-1 mines sit on. All data — a future map is a new set of rects.
  // Rects are aligned to the 16x16 tile grid (a tile takes the terrain under
  // its centre, so unaligned rects render, but aligned ones say what they mean).
  const MAP = {
    DIRT: [
      { x: 80, y: 48, w: 64, h: 32 },   // iron mine
      { x: 160, y: 48, w: 64, h: 32 },  // plot p2
      { x: 112, y: 128, w: 64, h: 32 }, // copper mine
      { x: 240, y: 176, w: 64, h: 32 }, // quartz quarry
      { x: 240, y: 96, w: 64, h: 32 },  // plot p4
      { x: 336, y: 112, w: 64, h: 32 }, // plot p6
      { x: 432, y: 80, w: 64, h: 32 },  // depot
      { x: 16, y: 96, w: 48, h: 32 },   // the hub
    ],
    WATER: [
      { x: 0, y: 192, w: 96, h: 48 },   // the pond, southwest
    ],
    NODES: [
      { kind: 'iron', x: 92, y: 54 },
      { kind: 'copper', x: 130, y: 138 },
      { kind: 'quartz', x: 250, y: 178 },
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

  const WORLD_W = 528; // 33 x 15 tiles of 16px
  const WORLD_H = 240;

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
    WORLD_W, WORLD_H, PICKUP_CAP, beltKey,
    available, get, plotById, resolvePositions, freePlots,
    affordable, isBuilt, kitUnlocked, pendingKit, currentMilestone, canDeliver,
    canUpgrade, nextBelt,
    SET_AZ, SET_BUKI, SET_VEDI,
  };
})();
