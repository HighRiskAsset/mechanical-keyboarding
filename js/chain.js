// The production chain (tech tree v4, 2026-09-12): materials, machines,
// recipes, prices. Walking IS the menu; this file is the rules.
// Global: CHAIN
//
// The tree itself is data: js/tree-<course>.js, generated from the lesson
// plan (docs/lessons-v4-<course>.plan.js) by dev/tech-tree-v4-build.js and
// read through COURSES.tree(). The model is plain: there are materials and
// machines; some materials are raw and come from mines; every other lesson
// is a recipe at a machine turning input materials into output materials;
// prices are made of materials; automation is the only thing that retires
// a lesson. A mine's or a recipe's lesson is what you type there.
//
// Nothing in this file names a key. What a lesson drills comes from the
// tree's lesson specs (alphabet, rung, family), which the plan computed
// from the course data; the engine reads them through lessonSpec().
//
// The map section at the end (machines standing on tiles, sites, nodes,
// crossings, the worlds) is the v3 code, kept: the ground is not the tree.
(function () {
  'use strict';

  const L = COURSES.course();
  const TREE = COURSES.tree();
  const TILE = 16;

  // ---- lessons ----
  const LESSONS = TREE.lessons;
  const LESSON = {};
  for (const l of LESSONS) LESSON[l.id] = l;
  const INTROS = LESSONS.filter((l) => l.kind === 'raw' || l.kind === 'keys');   // the lessons that open keys
  const lessonOf = (id) => LESSON[id] || null;

  // ---- raws and their mines ----
  const MINES = TREE.mines;   // {lesson, raw, name, opens, price, autoPrice, free}
  const MINE_BY_RAW = {};
  for (const m of MINES) MINE_BY_RAW[m.raw] = m;
  // a raw drawn from a pool rather than a seam (the tree's `ground`,
  // 2026-09-16): water and crude oil. A map lays each pool as a node, and a
  // pool takes exactly one extractor, so supply is counted the way veins are.
  const onPool = (ore) => !!(MINE_BY_RAW[ore] && MINE_BY_RAW[ore].ground === 'pool');
  const ORE_IDS = MINES.map((m) => m.raw);
  const ORES = {};
  ORE_IDS.forEach((id, i) => { ORES[id] = { id, node: id, order: i, lesson: MINE_BY_RAW[id].lesson, name: MINE_BY_RAW[id].name }; });
  // a map's node kind IS the raw id (js/maps/*.js)
  const ORE_BY_NODE = {};
  for (const id of ORE_IDS) ORE_BY_NODE[id] = id;
  // the keys a raw's lesson opens
  const oreLetters = (ore) => ((LESSON[(ORES[ore] || {}).lesson] || {}).keys || []).slice();

  // ---- materials ----
  const MATS = {};
  for (const m of TREE.materials) MATS[m.id] = { id: m.id, name: m.name, form: m.raw ? 'raw' : m.page ? 'page' : m.byproduct ? 'byproduct' : 'made', fluid: !!m.fluid, madeBy: m.madeBy };
  const MAT_IDS = TREE.materials.map((m) => m.id);
  const isFluid = (id) => !!(MATS[id] && MATS[id].fluid);
  const matName = (id) => (MATS[id] ? MATS[id].name : id);
  // one material is one material: no families, no grades (ruling 2026-09-11)
  const matSatisfies = (mat, want) => mat === want;
  const bagAvail = (bag, mat) => bag[mat] || 0;
  function spendCost(bag, cost) {
    for (const [mat, n] of Object.entries(cost || {})) bag[mat] = Math.max(0, (bag[mat] || 0) - n);
  }
  // the pages that finish the game; the completion is bought at the machine
  // that makes the last of them
  const COMPLETION = TREE.completion || { pages: [], price: null };
  const completionKind = () => {
    const last = COMPLETION.pages[COMPLETION.pages.length - 1];
    const r = last ? TREE.recipes.find((x) => x.lesson === last) : null;
    return r ? r.machine : null;
  };

  // ---- machines: a kind is a machine with a shape ----
  // size is [tiles across, tiles deep]: the front holds one outlet per
  // column, each flank one inlet per row (sim.js ports), so three of either
  // needs a body three across. A mine is one deep: one outlet, no inlet.
  const KINDS = {
    mine: { id: 'mine', name: 'Mine', arity: 0, outlets: 1, pipesIn: 0, pipesOut: 0, size: [2, 1], ready: true, opens: 1 },
  };
  for (const m of TREE.machines) {
    const arity = m.bi + m.pi, outlets = m.bo + m.po;
    KINDS[m.id] = { id: m.id, name: m.name, arity, outlets, pipesIn: m.pi, pipesOut: m.po, size: (arity > 2 || outlets > 2) ? [3, 2] : [2, 2], ready: true, opens: m.opens, shapeText: m.shapeText, price: m.price };
  }
  const KIND_IDS = Object.keys(KINDS);
  const kindName = (k) => (KINDS[k] ? KINDS[k].name : k);
  const mineName = (ore) => (MINE_BY_RAW[ore] ? MINE_BY_RAW[ore].name : ore);

  // ---- recipes: one per lesson, one material each (plus byproducts) ----
  const RECIPES = TREE.recipes.map((r) => ({
    kind: r.machine, lesson: r.lesson, in: r.inputs, outs: r.outputs, out: r.out, autoPrice: r.autoPrice,
    rung: (LESSON[r.lesson] || {}).rung || 'words', col: (LESSON[r.lesson] || {}).col || 0,
  }));
  const recipesFor = (kind) => RECIPES.filter((r) => r.kind === kind);
  const recipeFor = (mat) => RECIPES.find((r) => r.outs[mat]) || null;
  const recipeOfLesson = (id) => RECIPES.find((r) => r.lesson === id) || null;
  // correct keystrokes per unit of output when worked by hand, by what the
  // lesson types; and seconds per unit when the machine runs itself
  const PER_UNIT = { streams: 4, syllables: 3, words: 6, phrases: 12, sentences: 26, full: 38, pages: 120 };
  const perUnit = (r) => PER_UNIT[r.rung] || 6;
  const RATE = { mine: 2, streams: 3, syllables: 3, words: 4, phrases: 5, sentences: 6, full: 7, pages: 10 };
  const rateOf = (m, r) => (m.kind === 'mine' ? RATE.mine : RATE[(r && r.rung) || 'words'] || 4);

  const TUNING = {
    BUFFER_CAP: 100,       // per material, input and output buffers
    BAG_CAP: 300,          // per material, what the operator can carry
    RATE,                  // seconds per unit, by rung (rateOf)
    BELT_SPEED: 2,         // tiles per second, one item per tile
    OUTLETS: { mine: 1, processor: 2 },   // the mine's; a machine's come from its shape (KINDS[k].outlets)
    RATIO_TILT_CAP: 3,     // focus → sampling tilt, capped
    RATIO_MIN_POOL: 25,    // below this many words the tilt is off
    PACE: 1,               // the builder already paced every price
  };

  // ---- prices: all of them are made of materials, and a fluid is never one ----
  const scaleCost = (cost, k) => {
    const out = {};
    for (const [m, n] of Object.entries(cost || {})) out[m] = Math.max(1, Math.round(n * k));
    return out;
  };
  const paced = (cost) => (cost ? scaleCost(cost, TUNING.PACE) : null);
  // opening a raw: its first mine. The first mine of the game is there at the start.
  const priceNode = (ore) => paced((MINE_BY_RAW[ore] || {}).price || null);
  const mineFree = (ore) => !!(MINE_BY_RAW[ore] && MINE_BY_RAW[ore].free);
  // an extra mine of an open raw: some of that raw — or, for a fluid, which
  // is never a price, the extractor's opening price again
  const priceExtraMine = (ore) => (isFluid(ore) ? paced((MINE_BY_RAW[ore] || {}).price || null) : paced({ [ore]: 40 }));
  // a machine costs its price, the first copy and the tenth alike (user
  // ruling 2026-09-13: the v3 step per instance was an invented rule)
  function priceMachine(kind) {
    const base = KINDS[kind] && KINDS[kind].price;
    return base ? paced(base) : null;
  }
  // automation is per recipe: the price is a material from two columns later
  function priceAuto(m, r) {
    if (m.kind === 'mine') return paced((MINE_BY_RAW[m.ore] || {}).autoPrice || null);
    return r ? paced(r.autoPrice || null) : null;
  }
  const priceCompletion = () => paced(COMPLETION.price || null);
  // the key a recipe's ⚙ hangs on (per machine instance): the mine's raw, the recipe's lesson
  const autoKey = (m, r) => (m.kind === 'mine' ? m.ore : (r ? r.lesson : null));
  const autoOn = (m, key) => !!(key && m.autoOn && m.autoOn[key]);
  const priceCrossing = () => null;   // no crossing is priced in this tree

  // ---- the curriculum position, from the save ----
  // keys open per introduction: a mine built opens its raw's keys, a key
  // group's recipe opens its keys the first time it can be worked
  const unlockedIntros = (profile) => INTROS.filter((l) => profile.unlocked && profile.unlocked[l.id]);
  const introUnlocked = (profile, id) => !!(profile.unlocked && profile.unlocked[id]);
  function unlockedKeys(profile) {
    const out = [];
    for (const l of unlockedIntros(profile)) for (const k of l.keys) if (k !== 'Shift') out.push(k);
    return out;
  }
  const capsUnlocked = (profile) => unlockedIntros(profile).some((l) => l.caps || l.keys.includes('Shift'));
  // the introductions still to come, in column order, as the summary reads
  // them: {id, keys, tier} — tier is the column, kept for older callers
  const asRung = (l) => (l ? { id: l.id, keys: l.keys, tier: l.col, ore: l.kind === 'raw' ? rawOfIntro(l.id) : null, at: l.kind === 'keys' ? recipeOfLesson(l.id) && recipeOfLesson(l.id).kind : null, mk: 1 } : null);
  const rawOfIntro = (id) => { const m = MINES.find((x) => x.lesson === id); return m ? m.raw : null; };
  const nextPairs = (profile) => INTROS.filter((l) => !introUnlocked(profile, l.id)).slice(0, 3).map(asRung);
  const introRung = (id) => asRung(LESSON[id] && (LESSON[id].kind === 'raw' || LESSON[id].kind === 'keys') ? LESSON[id] : null);
  const nextPair = (profile) => nextPairs(profile)[0] || null;
  function newestPair(profile) {
    const log = profile.unlockLog || [];
    const last = log[log.length - 1];
    return last && last.id && LESSON[last.id] ? asRung(LESSON[last.id]) : null;
  }
  // the speed/accuracy target shown to the player and used to weight weak
  // letters; never a lock. Seven bars over the introductions.
  const BARS = [
    { wpm: 12, acc: 0.95 }, { wpm: 15, acc: 0.96 }, { wpm: 18, acc: 0.96 }, { wpm: 21, acc: 0.97 },
    { wpm: 24, acc: 0.97 }, { wpm: 28, acc: 0.97 }, { wpm: 35, acc: 0.97 },
  ];
  function targetBar(profile) {
    const n = unlockedIntros(profile).length;
    const i = Math.floor((n / Math.max(1, INTROS.length)) * BARS.length);
    return BARS[Math.max(0, Math.min(BARS.length - 1, i))];
  }
  const currentTier = (profile) => Math.max(0, ...unlockedIntros(profile).map((l) => l.col));

  // ---- what exists, what is offered ----
  // a raw is open once a mine of it stands; a made material exists once it
  // has been held (progressive reveal, the same set the HUD reads)
  const machinesOfOre = (profile, ore) => profile.machines.filter((m) => m.kind === 'mine' && m.ore === ore);
  const oreOpen = (profile, ore) => machinesOfOre(profile, ore).length > 0 || !!(profile.seen && profile.seen[ore]);
  const matExists = (profile, mat) => (MATS[mat] && MATS[mat].form === 'raw') ? oreOpen(profile, mat) : !!(profile.seen && profile.seen[mat]);
  // every recipe a machine has is listed, always (no discovery, ruling
  // 2026-09-11): the row greys while its inputs are not to hand
  const offerable = () => true;
  const offerableRecipes = (kind) => recipesFor(kind);
  const inputsExist = (r, profile) => Object.keys(r.in).every((mat) => matExists(profile, mat));
  // can this kind run anything yet: the build row is live when it can
  const kindLive = (kind, profile) => recipesFor(kind).some((r) => inputsExist(r, profile));
  // what a kind with nothing to make is waiting for: the materials its
  // first recipe lacks, as the lessons that make them
  function whatUnlocks(kind, profile) {
    const rs = recipesFor(kind);
    if (!rs.length) return null;
    if (kindLive(kind, profile)) return [];
    const r = rs[0];
    return Object.keys(r.in).filter((mat) => !matExists(profile, mat)).map((mat) => ({ mat, lesson: MATS[mat] ? MATS[mat].madeBy : null }));
  }
  function affordable(bag, cost) {
    return !!cost && Object.entries(cost).every(([mat, n]) => bagAvail(bag, mat) >= n);
  }
  // a price good is in reach: held at least once, or makeable right now by
  // a machine already standing
  function matInReach(profile, mat) {
    if (profile.seen && profile.seen[mat]) return true;
    for (const m of profile.machines) {
      if (m.kind === 'mine') { if (m.ore === mat) return true; }
      else if (recipesFor(m.kind).some((r) => r.outs[mat] && inputsExist(r, profile))) return true;
    }
    return false;
  }
  // the kinds the build menu lists: in the order they open, every kind whose
  // price names a material in reach, and always the next one to open
  function visibleKinds(profile) {
    const ks = KIND_IDS.filter((k) => k !== 'mine').sort((a, b) => KINDS[a].opens - KINDS[b].opens);
    const out = [];
    let nextShown = false;
    for (const k of ks) {
      const price = priceMachine(k, machinesOfKind(profile, k).length + 1);
      const built = machinesOfKind(profile, k).length > 0;
      if (built || (price && Object.keys(price).some((mat) => matInReach(profile, mat)))) out.push(k);
      else if (!nextShown) { out.push(k); nextShown = true; }
    }
    return out;
  }
  const buildableKinds = (profile) => visibleKinds(profile).filter((k) => affordable(profile.bag, priceMachine(k, machinesOfKind(profile, k).length + 1) || {}));
  const kindEverLive = () => true;
  // the introductions the summary names: the next ones for sale whose
  // price the player has held half of
  function rungsInView(profile) {
    return nextPairs(profile).filter((p) => {
      const l = LESSON[p.id];
      const mine = MINES.find((m) => m.lesson === l.id);
      const mats = Object.keys((mine && mine.price) || (recipeOfLesson(l.id) || { in: {} }).in || {});
      const held = mats.filter((mat) => matExists(profile, mat)).length;
      return !mats.length || held * 2 >= mats.length;
    });
  }

  // ---- what a lesson drills ----
  // The spec the engine reads: the mode by rung, the alphabet the plan
  // computed (letters, then the marks and digits a sentence lesson may use),
  // the focus keys tilted, the family, capitals, and for a page its text.
  // Only keys the player has opened are ever asked for.
  function lessonSpec(id, profile) {
    const l = LESSON[id];
    if (!l) return null;
    const have = new Set(unlockedKeys(profile));
    const keysOf = (arr) => (arr || []).filter((k) => have.has(k));
    let alphabet;
    if (l.rung === 'streams') alphabet = keysOf(l.keys.filter((k) => k !== 'Shift'));
    else if (l.rung === 'sentences' || l.rung === 'full' || l.rung === 'pages') alphabet = keysOf(l.alpha).concat(keysOf(l.marks), keysOf(l.digits));
    else alphabet = keysOf(l.alpha);
    if (!alphabet.length) alphabet = [...have];
    const mode = l.keys.includes('Shift') ? 'capitals'
      : l.rung === 'streams' ? (alphabet.length <= 3 ? 'keys' : 'letters')
      : l.rung === 'syllables' ? 'syllables' : l.rung === 'words' ? 'words' : l.rung === 'phrases' ? 'phrases'
      : l.rung === 'pages' ? 'pages' : 'sentences';
    const tilt = {};
    for (const k of l.focus || []) if (have.has(k)) tilt[k] = 2;
    const caps = (l.rung === 'sentences' || l.rung === 'full' || l.rung === 'pages') ? capsUnlocked(profile) : (l.caps && capsUnlocked(profile));
    return {
      id, mode, alphabet, tilt, family: l.family, caps, page: l.rung === 'pages' ? (TREE.pages[id] || '') : null,
      authored: l.authored || [], what: l.what, rung: l.rung,
    };
  }
  const mineLesson = (ore) => (ORES[ore] || {}).lesson || null;
  const mineMat = (profile, m) => m.ore;

  // The bag carries at most BAG_CAP of any one material; a fluid never
  // enters it (the player cannot carry a fluid: it needs a pipe). Returns
  // how many landed, so a caller can float the number actually got.
  function bagAdd(bag, mat, n) {
    if (isFluid(mat)) return 0;
    const have = bag[mat] || 0;
    const k = Math.max(0, Math.min(n, TUNING.BAG_CAP - have));
    if (k > 0) bag[mat] = have + k;
    return k;
  }

  // ---- machines standing on the map (v3, kept) ----
  function machineAnchor(m) {
    if (m.node !== undefined && m.node !== null) {
      const n = cur.MAP.NODES[m.node];
      if (!n) return { x: 0, y: 0 };
      return n.vert ? { x: n.x + 4, y: n.y + 24 } : { x: n.x + 4, y: n.y + 12 };
    }
    const p = siteById(m.plot);
    return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  const nodeFace = (i) => ((cur.MAP.NODES[i] || {}).vert ? 'e' : 's');
  // the tiles a machine takes, [across, deep]: its kind's, except that an
  // extractor standing on a pool takes the pool's four by four (2026-09-16)
  const sizeOf = (kind, ore) => (kind === 'mine' && onPool(ore) ? [MAPKIT.POOL, MAPKIT.POOL] : ((KINDS[kind] || {}).size || [2, 2]));
  // The ground a node is (a vein's two tiles, a pool's four by four), and
  // where a mine facing `face` stands on it: a pool is square, so every
  // facing stands on the pool itself, while a vein turns to match the mine.
  const nodeBox = (n) => (onPool(n.ore || ORE_BY_NODE[n.kind]) ? MAPKIT.poolBox(n) : MAPKIT.veinBox(n));
  function nodeSeat(n, face) {
    const ore = n.ore || ORE_BY_NODE[n.kind];
    if (onPool(ore)) return MAPKIT.poolBox(n);
    const fp = MAPKIT.footprint(sizeOf('mine', ore), face || 's');
    return MAPKIT.veinBox({ ...n, vert: fp[1] > fp[0] });
  }
  function machineBox(m) {
    const size = sizeOf(m.kind, m.ore);
    // an extractor carried over from an older save may name only its pool
    if (!Array.isArray(m.at) && m.kind === 'mine' && onPool(m.ore) && m.node !== undefined && m.node !== null && cur.MAP.NODES[m.node]) {
      return MAPKIT.poolBox(cur.MAP.NODES[m.node]);
    }
    const face = MAPKIT.FACINGS.includes(m.face) ? m.face : 's';
    if (Array.isArray(m.at)) return MAPKIT.boxAt(m.at, size, face);
    const a = machineAnchor(m);
    const fp = MAPKIT.footprint(size, face);
    return MAPKIT.bodyBox(a.x, a.y, fp[0], fp[1]);
  }
  function machinePos(m) {
    const b = machineBox(m);
    return { x: b.c0 * TILE + 1, y: (b.r1 + 1) * TILE - 5 };
  }
  function machineFoot(m) {
    const b = machineBox(m);
    return { x: (b.c0 + b.w / 2) * TILE, y: (b.r1 + 1) * TILE - 5 };
  }
  const machinesOfKind = (profile, kind) => profile.machines.filter((m) => m.kind === kind);
  const nodeBuilt = (profile, i) => profile.machines.some((m) => m.node === i);
  function unbuiltNodes(profile) {
    const out = [];
    cur.MAP.NODES.forEach((n, i) => {
      if (ORE_BY_NODE[n.kind] && !nodeBuilt(profile, i)) out.push({ ...n, index: i, ore: ORE_BY_NODE[n.kind] });
    });
    return out;
  }

  // ---- the worlds ----
  const MAPS = MAPKIT.MAPS;
  const MAP_IDS = MAPKIT.IDS;
  const DEFAULT_MAP = MAPKIT.DEFAULT;
  let cur = null;
  function useMap(id) {
    cur = MAPS[id] || MAPS[DEFAULT_MAP];
    const C = window.CHAIN;
    C.MAP_ID = cur.id;
    C.MAP = cur.MAP;
    C.SCENERY = cur.SCENERY;
    C.PROPS = cur.PROPS;
    C.WORLD_W = cur.W;
    C.WORLD_H = cur.H;
    C.SPAWN = cur.spawn;
    C.LEGACY = cur.LEGACY || {};
    C.WEATHER = cur.WEATHER || null;
    return cur;
  }
  function currentMap() { return cur; }
  // the pre-built mines of a map: the first node of each raw that comes free
  function starterNodes() {
    const out = [];
    for (const ore of ORE_IDS) {
      if (!mineFree(ore)) continue;
      const i = cur.MAP.NODES.findIndex((n) => ORE_BY_NODE[n.kind] === ore);
      if (i >= 0) out.push({ ore, index: i, lesson: mineLesson(ore) });
    }
    return out;
  }
  // a plot is only a save-reader now (free build on every map since
  // 2026-09-14): a machine saved before the rotation overhaul names one
  // instead of carrying `at`
  function siteById(id) { return (cur.PLOTS || []).find((p) => p.id === id); }
  function crossingOpen(profile, c) {
    return !!c.free || !!(profile.crossings && profile.crossings[c.id]);
  }
  const closedCrossings = (profile) => (cur.MAP.CROSSINGS || []).filter((c) => !crossingOpen(profile, c));
  function regionAt(px, py) {
    const MAP = cur.MAP;
    let hit = MAP.REGIONS[0];
    for (const r of MAP.REGIONS) {
      const y0 = r.y || 0, h = r.h || cur.H;
      if (px >= r.x && px < r.x + r.w && py >= y0 && py < y0 + h) hit = r;
    }
    return hit;
  }

  window.CHAIN = {
    TILE, TREE, LESSONS, LESSON, INTROS, lessonOf, lessonSpec, mineLesson,
    ORES, ORE_IDS, ORE_BY_NODE, MINES, oreLetters, mineName, mineFree,
    MATS, MAT_IDS, isFluid, matName, matSatisfies, bagAvail, spendCost, bagAdd, COMPLETION, completionKind,
    KINDS, KIND_IDS, kindName, RECIPES, recipesFor, recipeFor, recipeOfLesson, perUnit, rateOf, BARS, TUNING,
    priceNode, priceExtraMine, priceMachine, priceAuto, priceCompletion, priceCrossing, scaleCost, autoKey, autoOn, closedCrossings,
    unlockedIntros, introUnlocked, unlockedKeys, capsUnlocked, nextPairs, nextPair, introRung, newestPair, targetBar, currentTier,
    oreOpen, matExists, offerable, offerableRecipes, inputsExist, kindLive, whatUnlocks, affordable, matInReach, visibleKinds, buildableKinds, kindEverLive, rungsInView, mineMat,
    machineBox, machinePos, machineFoot, machineAnchor, nodeFace, machinesOfKind, machinesOfOre, nodeBuilt, unbuiltNodes, onPool, sizeOf, nodeBox, nodeSeat,
    MAPS, MAP_IDS, DEFAULT_MAP, useMap, currentMap, starterNodes, siteById, crossingOpen, regionAt,
  };
  useMap(DEFAULT_MAP);
})();
