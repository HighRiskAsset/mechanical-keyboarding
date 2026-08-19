// The production chain and the maps (tech tree v3, DESIGN.md): ores, machine
// kinds, recipes, prices, tier bars, plots, nodes, scenery. Walking IS the
// menu; this file is the world's data. Global: CHAIN
//
// v3 rules this file encodes: an ore is a finger and a Mk is a reach (the
// pairs live in language-ru.js); a material's alphabet is the union of the
// ores that went into it, computed live; a recipe is only offered once its
// union clears the kind's minimum alphabet; everything is bought from the
// bag at the place (no Hub, no kits, no contracts, no Depot); kinds are
// templates — several instances may stand.
//
// Maps (2026-08-18): the chain is shared, the ground is not. MAPS is a
// registry of worlds — each one its own terrain, plots, nodes, scenery,
// props and spawn — and CHAIN.useMap(id) makes one of them current. Every
// world keeps its own save (engine.js).
(function () {
  'use strict';

  const L = COURSES.course();
  const TILE = 16;

  // ---- ores: six fingers. ids are material ids (legacy names never rename) ----
  const ORES = {
    az:    { id: 'az',    node: 'iron',   order: 0 },
    buki:  { id: 'buki',  node: 'copper', order: 1 },
    stone: { id: 'stone', node: 'stone',  order: 2 },
    vedi:  { id: 'vedi',  node: 'quartz', order: 3 },
    coal:  { id: 'coal',  node: 'coal',   order: 4 },
    oil:   { id: 'oil',   node: 'oil',    order: 5 },
  };
  const ORE_IDS = Object.keys(ORES);
  const ORE_BY_NODE = {};
  for (const o of Object.values(ORES)) ORE_BY_NODE[o.node] = o.id;

  // letters an ore holds at a given Mk (from the course pairs)
  function oreLetters(ore, mk) {
    const out = [];
    for (const p of L.PAIRS) if (p.ore === ore && p.mk <= mk) out.push(...p.keys);
    return out;
  }
  function oreMaxMk(ore) {
    let m = 0;
    for (const p of L.PAIRS) if (p.ore === ore) m = Math.max(m, p.mk);
    return m;
  }

  // ---- machine kinds: grammar = kind; arity fixed; minimum alphabets ----
  // perUnit = correct keystrokes per unit of output when worked by hand.
  // autoFrom = the tier from which ⚙ is purchasable (mines: when keys are
  // sticky). ready = implemented in this build (phases 4–5 add the rest).
  const KINDS = {
    mine:         { id: 'mine',         arity: 0, grammar: 'letters',   minAlpha: 2,  perUnit: 1,  autoFrom: 0,  tier: 0, ready: true },
    smelter:      { id: 'smelter',      arity: 2, grammar: 'syllables', minAlpha: 4,  perUnit: 4,  autoFrom: 1,  tier: 0, ready: true, needsVC: true },
    foundry:      { id: 'foundry',      arity: 2, grammar: 'clusters',  minAlpha: 8,  perUnit: 5,  autoFrom: 2,  tier: 1, ready: true },
    constructor:  { id: 'constructor',  arity: 1, grammar: 'words',     minAlpha: 8,  perUnit: 6,  autoFrom: 2,  tier: 1, ready: true, minWords: 25 },
    molder:       { id: 'molder',       arity: 2, grammar: 'endings',   minAlpha: 14, perUnit: 6,  autoFrom: 3,  tier: 2, ready: false, full: true },
    assembler:    { id: 'assembler',    arity: 2, grammar: 'phrases',   minAlpha: 16, perUnit: 8,  autoFrom: 3,  tier: 2, ready: false, full: true },
    fastener:     { id: 'fastener',     arity: 2, grammar: 'punct',     minAlpha: 20, perUnit: 8,  autoFrom: 4,  tier: 3, ready: false, full: true },
    crane:        { id: 'crane',        arity: 2, grammar: 'capitals',  minAlpha: 30, perUnit: 8,  autoFrom: 6,  tier: 5, ready: false, full: true },
    manufacturer: { id: 'manufacturer', arity: 3, grammar: 'pages',     minAlpha: 33, perUnit: 12, autoFrom: 99, tier: 6, ready: false, full: true },
  };
  const KIND_IDS = Object.keys(KINDS);

  // ---- materials: ores, 2-ore ingots, 3-ore ingots, deeper forms ----
  // Legacy ids: slogi = the first ingot (bronze), slova = parts, stroki =
  // modules; listy retired. Icons are ore-colour stacks (pixels.js).
  const MATS = {
    az: { form: 'ore', ores: ['az'] }, buki: { form: 'ore', ores: ['buki'] }, stone: { form: 'ore', ores: ['stone'] },
    vedi: { form: 'ore', ores: ['vedi'] }, coal: { form: 'ore', ores: ['coal'] }, oil: { form: 'ore', ores: ['oil'] },
    slogi:      { form: 'ingot', ores: ['az', 'buki'] },      // bronze
    castiron:   { form: 'ingot', ores: ['az', 'stone'] },
    qziron:     { form: 'ingot', ores: ['az', 'vedi'] },
    steel:      { form: 'ingot', ores: ['az', 'coal'] },
    brass:      { form: 'ingot', ores: ['buki', 'stone'] },
    blackiron:  { form: 'ingot', ores: ['az', 'oil'] },
    gunmetal:   { form: 'ingot', ores: ['buki', 'coal'] },
    glass:      { form: 'ingot', ores: ['vedi', 'oil'] },
    qzbronze:   { form: 'ingot3', ores: ['az', 'buki', 'vedi'] },
    caststeel:  { form: 'ingot3', ores: ['az', 'stone', 'coal'] },
    blackbrass: { form: 'ingot3', ores: ['buki', 'stone', 'oil'] },
    qzsteel:    { form: 'ingot3', ores: ['az', 'coal', 'vedi'] },
    cokeiron:   { form: 'ingot3', ores: ['az', 'oil', 'coal'] },
    slova: { form: 'parts', ores: [] }, mold: { form: 'moldings', ores: [] }, stroki: { form: 'modules', ores: [] },
    fast: { form: 'fastened', ores: [] }, crate: { form: 'crates', ores: [] }, heavy: { form: 'heavy', ores: [] },
    listy: { form: 'legacy', ores: [] },
  };
  const MAT_IDS = Object.keys(MATS).filter((id) => MATS[id].form !== 'legacy');
  const INGOT_IDS = MAT_IDS.filter((id) => MATS[id].form === 'ingot' || MATS[id].form === 'ingot3');

  // ---- recipes: authored, never emergent. Ratios are placeholders. ----
  const RECIPES = [
    { kind: 'smelter', in: { az: 2, buki: 1 }, out: 'slogi', tier: 0 },
    { kind: 'smelter', in: { az: 2, stone: 1 }, out: 'castiron', tier: 0 },
    { kind: 'smelter', in: { az: 2, vedi: 1 }, out: 'qziron', tier: 1 },
    { kind: 'smelter', in: { az: 3, coal: 1 }, out: 'steel', tier: 2 },
    { kind: 'smelter', in: { buki: 2, stone: 1 }, out: 'brass', tier: 2 },
    { kind: 'smelter', in: { az: 2, oil: 1 }, out: 'blackiron', tier: 3 },
    { kind: 'smelter', in: { buki: 2, coal: 1 }, out: 'gunmetal', tier: 4 },
    { kind: 'smelter', in: { vedi: 2, oil: 1 }, out: 'glass', tier: 5 },
    { kind: 'foundry', in: { slogi: 2, vedi: 1 }, out: 'qzbronze', tier: 1 },
    { kind: 'foundry', in: { castiron: 2, coal: 1 }, out: 'caststeel', tier: 2 },
    { kind: 'foundry', in: { brass: 2, oil: 1 }, out: 'blackbrass', tier: 3 },
    { kind: 'foundry', in: { steel: 2, vedi: 1 }, out: 'qzsteel', tier: 4 },
    { kind: 'foundry', in: { blackiron: 2, coal: 1 }, out: 'cokeiron', tier: 5 },
    // deeper kinds — data for phases 4–5 (kinds not ready in this build)
    { kind: 'molder', in: { slova: 2, az: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { slova: 2, buki: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { slova: 2, stone: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { slova: 2, vedi: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { slova: 2, coal: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { slova: 2, oil: 1 }, out: 'mold', tier: 3 },
    { kind: 'assembler', in: { slova: 2, steel: 1 }, out: 'stroki', tier: 2 },
    { kind: 'assembler', in: { slova: 2, brass: 1 }, out: 'stroki', tier: 2 },
    { kind: 'assembler', in: { slova: 2, blackiron: 1 }, out: 'stroki', tier: 3 },
    { kind: 'assembler', in: { slova: 2, gunmetal: 1 }, out: 'stroki', tier: 4 },
    { kind: 'fastener', in: { stroki: 2, oil: 1 }, out: 'fast', tier: 3 },
    { kind: 'fastener', in: { stroki: 2, coal: 1 }, out: 'fast', tier: 4 },
    { kind: 'crane', in: { fast: 2, oil: 1 }, out: 'crate', tier: 5 },
    { kind: 'manufacturer', in: { crate: 2, mold: 1, slova: 2 }, out: 'heavy', tier: 6 },
  ];
  // Constructor: any ingot → parts (2 → 1). Tier = the ingot's recipe tier.
  for (const id of INGOT_IDS) {
    const src = RECIPES.find((r) => r.out === id);
    RECIPES.push({ kind: 'constructor', in: { [id]: 2 }, out: 'slova', tier: Math.max(KINDS.constructor.tier, src ? src.tier : 1) });
  }
  const recipesFor = (kind) => RECIPES.filter((r) => r.kind === kind);
  const recipeFor = (mat) => RECIPES.find((r) => r.out === mat) || null;
  // the tier a material first exists at
  function matTier(id) {
    if (MATS[id].form === 'ore') { const p = L.PAIRS.find((q) => q.ore === id); return p ? p.tier : 0; }
    const r = recipeFor(id);
    return r ? r.tier : 0;
  }

  // ---- tier bars: readiness targets on every unlocked letter ----
  const BARS = [
    { wpm: 12, acc: 0.95 }, { wpm: 15, acc: 0.96 }, { wpm: 18, acc: 0.96 }, { wpm: 21, acc: 0.97 },
    { wpm: 24, acc: 0.97 }, { wpm: 28, acc: 0.97 }, { wpm: 35, acc: 0.97 },
  ];
  // the trade good of each tier (documentation of pacing; nothing is locked
  // behind a tier number — prices ask for later materials, that is all)
  const TIER_GOOD = ['slogi', 'slova', 'stroki', 'fast', 'fast', 'crate', 'heavy'];
  // each ore's own alloy — the good its extra mines and automation cost in
  const ORE_GOOD = { az: 'slogi', buki: 'slogi', stone: 'castiron', vedi: 'qziron', coal: 'steel', oil: 'blackiron' };

  const TUNING = {
    PICKUP_CAP: 100,       // (legacy) the old instant pickup; buffers cap below
    // the simulation (phase 3): buffers, rates, belts — real time
    BUFFER_CAP: 100,       // per material, input and output buffers
    RATE: { mine: 2, smelter: 3, foundry: 4, constructor: 4, molder: 5, assembler: 6, fastener: 6, crane: 7, manufacturer: 10 }, // seconds per unit
    BELT_SPEED: 2,         // tiles per second, one item per tile
    OUTLETS: { mine: 1, processor: 2 }, // belts out of a machine; inlets = the kind's arity
    MIN_WORDS: 25,         // Constructor pool size before a recipe is offered
    RATIO_TILT_CAP: 3,     // ratio → sampling tilt, capped (variance only)
    RATIO_MIN_POOL: 25,    // below this many words the tilt is off
    K_HEAVY: 200,          // heavy modules to finish (placeholder)
    MACHINE_PRICE_STEP: 0.5, // nth instance of a kind costs ×(1 + step·(n−1))
    // PACE multiplies every price. With no skill gates, prices are the whole
    // pacing: a purchase should ask for about the keystrokes we want spent on
    // those keys. The base table below is written at ×1; 4 is the first-pass
    // guess for the ~30 h target — tune this one number from play logs.
    PACE: 4,
  };

  // ---- prices (placeholders, all in the pattern "own material + tier good") ----
  const PRICES = {
    // opening an ore (its first mine): the tier's goods
    node: {
      vedi: { slogi: 40, castiron: 40 },
      coal: { slova: 60, qziron: 40 },
      oil: { stroki: 60, steel: 40 },
    },
    // Mk levels per ore
    mk: {
      az: { 2: { az: 80, slogi: 30 } },
      buki: { 2: { buki: 80, steel: 30 } },
      stone: { 2: { stone: 80, steel: 30 } },
      vedi: { 2: { vedi: 60, qziron: 40 }, 3: { vedi: 60, blackiron: 30 } },
      coal: { 2: { fast: 60, steel: 40 }, 3: { coal: 60, qzsteel: 40 } },
      oil: { 2: { oil: 60, blackiron: 30 }, 3: { oil: 60, gunmetal: 40 }, 4: { oil: 60, fast: 60 } },
    },
    // first instance of a kind at a plot — each asks for a material of the
    // tier the kind belongs to, which is the only pacing there is
    machine: {
      smelter: { az: 30, buki: 30, stone: 30 },
      foundry: { slova: 40, slogi: 40 },
      constructor: { qziron: 40, castiron: 40 },
      molder: { slova: 60, steel: 30 },
      assembler: { mold: 60, slova: 40 },
      fastener: { blackiron: 40, stroki: 40 },
      crane: { fast: 80, glass: 40 },
      manufacturer: { crate: 100, mold: 60, slova: 60 },
    },
    // automation on a processor: its own output + a later good (the price is
    // the hand work; there is no mastery test)
    auto: {
      smelter: { slogi: 40, slova: 20 },
      foundry: { qzbronze: 30, slova: 30 },
      constructor: { slova: 60, qziron: 20 },
      molder: { mold: 40, stroki: 20 },
      assembler: { stroki: 40, fast: 20 },
      fastener: { fast: 40, crate: 20 },
      crane: { crate: 40, heavy: 10 },
    },
    // repairing a closed crossing (The Frontier): paid in the goods of the
    // regions behind you
    crossing: {
      x1: { slogi: 30, castiron: 30 },
      x2: { slova: 40, qzbronze: 20 },
      x3: { slova: 40, brass: 20 },
      x4: { caststeel: 30, slova: 40 },
      x5: { blackiron: 40, slova: 60 },
    },
  };
  const scaleCost = (cost, k) => {
    const out = {};
    for (const [m, n] of Object.entries(cost)) out[m] = Math.max(1, Math.round(n * k));
    return out;
  };
  const paced = (cost) => (cost ? scaleCost(cost, TUNING.PACE) : null);
  // opening an ore: its first mine
  const priceNode = (ore) => paced(PRICES.node[ore] || null);
  // an extra mine of an already-open ore: its ore + its own alloy
  function priceExtraMine(ore) {
    return paced({ [ore]: 60, [ORE_GOOD[ore]]: 20 });
  }
  function priceMk(ore, level) {
    return paced((PRICES.mk[ore] && PRICES.mk[ore][level]) || null);
  }
  function priceMachine(kind, nth) {
    const base = PRICES.machine[kind];
    if (!base) return null;
    return paced(scaleCost(base, 1 + TUNING.MACHINE_PRICE_STEP * Math.max(0, nth - 1)));
  }
  // automation on a mine: its ore + its own alloy (processors: phase 3)
  function priceAuto(m) {
    if (m.kind === 'mine') return paced({ [m.ore]: 80, [ORE_GOOD[m.ore]]: 20 });
    return paced(PRICES.auto[m.kind] || null);
  }
  const priceCrossing = (c) => paced(PRICES.crossing[c.id] || null);

  // ---- the curriculum position, from the save ----
  // pairsUnlocked counts L.PAIRS unlocked in order; ore Mk levels derive.
  function oreMk(profile, ore) {
    let mk = 0;
    for (let i = 0; i < profile.pairsUnlocked && i < L.PAIRS.length; i++) {
      const p = L.PAIRS[i];
      if (p.ore === ore) mk = Math.max(mk, p.mk);
    }
    return mk;
  }
  function unlockedKeys(profile) {
    const out = [];
    for (let i = 0; i < profile.pairsUnlocked && i < L.PAIRS.length; i++) out.push(...L.PAIRS[i].keys);
    return out;
  }
  function currentTier(profile) {
    let t = 0;
    for (let i = 0; i < profile.pairsUnlocked && i < L.PAIRS.length; i++) t = Math.max(t, L.PAIRS[i].tier);
    return t;
  }
  function nextPair(profile) {
    return L.PAIRS[profile.pairsUnlocked] || null;
  }
  // the tier.s speed/accuracy target — shown to the player and used to weight
  // weak letters in the drills; never a lock (progress is what you type and
  // spend). The bar of the tier the next pair belongs to.
  function targetBar(profile) {
    const np = nextPair(profile);
    const t = np ? np.tier : BARS.length;
    return BARS[Math.max(0, Math.min(BARS.length - 1, t - 1))];
  }

  // ---- alphabets: union of the inputs, live ----
  function alphabetOf(mat, profile) {
    const m = MATS[mat];
    if (!m) return [];
    if (m.form === 'ore') return oreLetters(mat, oreMk(profile, mat));
    if (m.ores.length) {
      const set = new Set();
      for (const o of m.ores) for (const ch of oreLetters(o, oreMk(profile, o))) set.add(ch);
      return [...set];
    }
    return unlockedKeys(profile); // parts and deeper: the full unlocked set
  }
  // a recipe's drill alphabet (+ focus letters from the flux, for full kinds)
  function recipeAlphabet(r, profile) {
    const kind = KINDS[r.kind];
    if (kind.full) return unlockedKeys(profile);
    const set = new Set();
    for (const mat of Object.keys(r.in)) for (const ch of alphabetOf(mat, profile)) set.add(ch);
    return [...set];
  }
  // letters the recipe should lean on: its ore inputs, weighted by ratio
  function recipeTilt(r, profile) {
    const w = {};
    for (const [mat, n] of Object.entries(r.in)) {
      for (const ch of alphabetOf(mat, profile)) w[ch] = Math.max(w[ch] || 0, n);
    }
    return w;
  }
  const isVowel = (ch) => L.VOWELS.has(ch);
  const isLetter = (ch) => !L.PUNCT.has(ch) && /\p{L}/u.test(ch);
  // does this ore exist for the player yet (its first pair unlocked)?
  const oreOpen = (profile, ore) => oreMk(profile, ore) >= 1;
  // does every ore behind a material exist yet
  function matExists(profile, mat) {
    const m = MATS[mat];
    if (!m) return false;
    if (m.form === 'ore') return oreOpen(profile, mat);
    if (m.ores.length) return m.ores.every((o) => oreOpen(profile, o));
    return true;
  }
  // real words typeable with an alphabet
  function wordPool(alpha) {
    const set = new Set(alpha);
    return L.WORDS.filter(([w]) => [...w].every((c) => set.has(c)));
  }
  // is a recipe offered now: kind ready, inputs exist, alphabet clears the
  // minimum (and V+C / word-pool rules). Nothing is locked behind a tier
  // number — the recipe's tier is documentation of when it tends to arrive.
  function offerable(r, profile) {
    const kind = KINDS[r.kind];
    if (!kind.ready) return false;
    for (const mat of Object.keys(r.in)) if (!matExists(profile, mat)) return false;
    const alpha = recipeAlphabet(r, profile);
    const letters = alpha.filter(isLetter);
    if (alpha.length < kind.minAlpha) return false;
    if (kind.needsVC && !(letters.some(isVowel) && letters.some((c) => !isVowel(c)))) return false;
    if (kind.minWords && wordPool(alpha).length < kind.minWords) return false;
    return true;
  }
  function offerableRecipes(kind, profile) {
    return recipesFor(kind).filter((r) => offerable(r, profile));
  }
  function affordable(bag, cost) {
    return !!cost && Object.entries(cost).every(([mat, n]) => (bag[mat] || 0) >= n);
  }

  // ---- machines standing on the map ----
  function machinePos(m) {
    if (m.node !== undefined && m.node !== null) {
      const n = cur.MAP.NODES[m.node];
      return n ? { x: n.x + 4, y: n.y + 12 } : { x: 0, y: 0 };
    }
    const p = plotById(m.plot);
    return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  const machinesOfKind = (profile, kind) => profile.machines.filter((m) => m.kind === kind);
  const machinesOfOre = (profile, ore) => profile.machines.filter((m) => m.kind === 'mine' && m.ore === ore);
  const nodeBuilt = (profile, i) => profile.machines.some((m) => m.node === i);
  function freePlots(profile) {
    const taken = new Set(profile.machines.map((m) => m.plot).filter(Boolean));
    return cur.PLOTS.filter((p) => !taken.has(p.id));
  }
  function unbuiltNodes(profile) {
    const out = [];
    cur.MAP.NODES.forEach((n, i) => {
      if (ORE_BY_NODE[n.kind] && !nodeBuilt(profile, i)) out.push({ ...n, index: i, ore: ORE_BY_NODE[n.kind] });
    });
    return out;
  }
  // machine kinds a plot could hold now: ready, and the player has held
  // every material the price asks for (progressive reveal — the price is
  // the only pacing)
  function buildableKinds(profile) {
    return KIND_IDS.filter((k) => {
      const kind = KINDS[k];
      if (k === 'mine' || !kind.ready) return false;
      const price = priceMachine(k, machinesOfKind(profile, k).length + 1);
      return price && Object.keys(price).every((mat) => profile.seen[mat]);
    });
  }

  // ---- solid scenery ----
  // Everything stands ON a tile — sc(kind, tx, ty) names the tile under its
  // base; wide kinds (FOOT_W) span that many tiles to the east. The sprite is
  // drawn centred on the footprint with its base on the tile bottom
  // (factory.js); the collision box is the footprint, inset a hair.
  const FOOT_W = { boulder: 2, tarpool: 2 };
  const sc = (kind, tx, ty) => {
    const fw = FOOT_W[kind.replace(/\d+$/, '')] || 1;
    return { kind, tx, ty, fw, box: { x: tx * 16 + 2, y: ty * 16 + 3, w: fw * 16 - 4, h: 12 } };
  };

  // ======================================================================
  // THE FRONTIER — the world proper: six biomes laid as a snake, cliffs,
  // closed crossings, plots scattered where the land allows.
  // ======================================================================

  const FRONTIER_PLOTS = [
    { id: 'p1', x: 96, y: 66 },        // (the iron mine stands here — filtered)
    { id: 'p2', x: 176, y: 66 },
    { id: 'p3', x: 136, y: 150 },      // (copper mine — filtered)
    { id: 'p4', x: 256, y: 108 },
    { id: 'p5', x: 256, y: 190 },      // (quartz node — filtered)
    { id: 'p6', x: 356, y: 130 },
    { id: 'p7', x: 446, y: 96 },
    { id: 'p8', x: 356, y: 66 },       // on the meadow knoll (stairs at x=352)
    { id: 'p9', x: 60, y: 150 },       // (stone mine — filtered)
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

  const FRONTIER_SCENERY = [
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

  // set dressing — cosmetic, walk-through (drawn by factory.js)
  const FRONTIER_PROPS = [
    { kind: 'lamppost', x: 62, y: 78, glow: true },
    { kind: 'lamppost', x: 230, y: 128, glow: true },
    { kind: 'lamppost', x: 420, y: 108, glow: true },
    { kind: 'crate', x: 482, y: 156 },
    { kind: 'crate2', x: 492, y: 168 },
    { kind: 'drum', x: 18, y: 178 },
    { kind: 'bush', x: 186, y: 84 },
    { kind: 'bush', x: 498, y: 204 },
    { kind: 'sign', x: 12, y: 126 },
  ];

  // The terrain. REGIONS are biome rects placed anywhere on the map. This
  // layout is a snake: the high north row runs meadow → quarry → canyon,
  // stairs drop into the low south row, which runs back west bog → flats →
  // peaks. CROSSINGS open once the tier bar named in opensAfter is passed
  // (v3 re-basing: quarry at T1, canyon + bog by T2, flats at T3, peaks at
  // T4). Rects are 16px-grid aligned. tiles.js bakes all of this.
  const FRONTIER_MAP = {
    FOREST: { n: 48 },
    REGIONS: [
      { id: 'meadow', x: 0, y: 0, w: 528, h: 240, elev: 1, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
      { id: 'quarry', x: 528, y: 0, w: 320, h: 240, elev: 1, base: 'rock', cliff: 'tan', treeline: ['spire', 'boulder', 'boulder2'] },
      { id: 'canyon', x: 848, y: 0, w: 320, h: 240, elev: 1, base: 'shale', cliff: 'violet', treeline: ['spire', 'deadtree', 'spire2'] },
      { id: 'peaks', x: 0, y: 240, w: 528, h: 256, elev: 0, base: 'snow', cliff: 'snow', treeline: ['snowpine', 'snowpine2', 'spire'] },
      { id: 'flats', x: 528, y: 240, w: 320, h: 256, elev: 0, base: 'crack', cliff: 'tan', treeline: ['boulder', 'scrub', 'boulder2'] },
      { id: 'bog', x: 848, y: 240, w: 320, h: 256, elev: 0, base: 'marsh', cliff: 'grey', treeline: ['deadtree', 'deadtree2', 'reeds'] },
    ],
    GROUND: [
      // — meadow: worn aprons under mines/plots, a worn road with spurs, the pond
      { kind: 'dirt', x: 80, y: 48, w: 64, h: 32 },    // iron mine
      { kind: 'dirt', x: 160, y: 48, w: 64, h: 32 },   // p2
      { kind: 'dirt', x: 112, y: 128, w: 64, h: 32 },  // copper mine
      { kind: 'dirt', x: 48, y: 128, w: 64, h: 32 },   // stone mine (v3: a T0 ore, in the meadow)
      { kind: 'dirt', x: 240, y: 176, w: 64, h: 32 },  // quartz node
      { kind: 'dirt', x: 240, y: 96, w: 64, h: 32 },   // p4
      { kind: 'dirt', x: 336, y: 112, w: 64, h: 32 },  // p6
      { kind: 'dirt', x: 336, y: 48, w: 64, h: 32 },   // p8 (knoll)
      { kind: 'pad', x: 432, y: 80, w: 64, h: 32 },    // p7 pad
      { kind: 'pad', x: 16, y: 96, w: 48, h: 32 },     // the old hub pad (a landing now)
      { kind: 'dirt', x: 64, y: 112, w: 368, h: 16 },  // the road
      { kind: 'dirt', x: 96, y: 80, w: 16, h: 32 },    // spur north to the iron mine
      { kind: 'dirt', x: 256, y: 128, w: 16, h: 48 },  // spur south to the quartz node
      { kind: 'dirt', x: 480, y: 128, w: 48, h: 32 },  // the track east to the gate
      { kind: 'sand', x: 0, y: 176, w: 112, h: 64 },
      { kind: 'water', x: 0, y: 192, w: 96, h: 48 },   // the pond, southwest
      // — quarry hills
      { kind: 'grass', x: 560, y: 208, w: 64, h: 32 },
      { kind: 'grass', x: 688, y: 96, w: 48, h: 32 },
      { kind: 'dirt', x: 544, y: 128, w: 48, h: 32 },  // inside the gate
      { kind: 'dirt', x: 592, y: 64, w: 64, h: 32 },   // p13 apron (terrace top)
      { kind: 'dirt', x: 656, y: 192, w: 64, h: 32 },  // p14 apron
      { kind: 'dirt', x: 736, y: 160, w: 64, h: 32 },  // stone seam apron (terrace interior)
      // — crystal canyon
      { kind: 'sand', x: 880, y: 48, w: 16, h: 192 },
      { kind: 'water', x: 848, y: 48, w: 32, h: 192 },
      { kind: 'dirt', x: 992, y: 112, w: 64, h: 32 },  // p15 apron
      { kind: 'dirt', x: 928, y: 176, w: 96, h: 16 },
      { kind: 'dirt', x: 960, y: 192, w: 32, h: 48 },  // track to the stairs down
      // — coal bog
      { kind: 'dirt', x: 960, y: 272, w: 32, h: 16 },  // foot of the stairs
      { kind: 'water', x: 912, y: 288, w: 64, h: 32 },
      { kind: 'water', x: 1024, y: 400, w: 80, h: 48 },
      { kind: 'water', x: 1088, y: 288, w: 48, h: 32 },
      { kind: 'board', x: 880, y: 384, w: 144, h: 16 },
      { kind: 'board', x: 1024, y: 416, w: 80, h: 16 },
      { kind: 'dirt', x: 960, y: 336, w: 64, h: 32 },  // coal seam apron
      { kind: 'dirt', x: 1024, y: 304, w: 64, h: 32 }, // p16 apron
      // — oil flats
      { kind: 'tar', x: 592, y: 368, w: 48, h: 32 },
      { kind: 'tar', x: 720, y: 288, w: 64, h: 32 },
      { kind: 'tar', x: 768, y: 400, w: 48, h: 32 },
      { kind: 'dirt', x: 640, y: 336, w: 64, h: 32 },  // oil derrick apron
      { kind: 'dirt', x: 720, y: 336, w: 64, h: 32 },  // p17 apron
      { kind: 'rock', x: 640, y: 400, w: 96, h: 48 },  // mesa top
      // — titanium peaks
      { kind: 'frost', x: 48, y: 320, w: 48, h: 32 },
      { kind: 'frost', x: 272, y: 288, w: 64, h: 32 },
      { kind: 'ice', x: 96, y: 400, w: 80, h: 48 },
      { kind: 'dirt', x: 80, y: 336, w: 64, h: 32 },   // p18 apron
      { kind: 'rock', x: 192, y: 320, w: 48, h: 32 },  // titanium seam apron (shelf interior)
    ],
    PLATEAUS: [
      { x: 320, y: 48, w: 96, h: 48, elev: 2, face: 1, ramps: [{ x: 352, y: 96, side: 'S' }] },        // meadow knoll (p8)
      { x: 592, y: 48, w: 96, h: 48, elev: 2, face: 2, ramps: [{ x: 624, y: 96, side: 'S' }] },        // quarry terrace A (p13)
      { x: 720, y: 128, w: 112, h: 64, elev: 2, face: 1, ramps: [{ x: 768, y: 192, side: 'S' }] },     // quarry terrace B (stone #2)
      { x: 912, y: 48, w: 128, h: 32, elev: 2, face: 1 },                                              // canyon north wall
      { x: 640, y: 400, w: 96, h: 48, elev: 1, face: 1, ramps: [{ x: 640, y: 416, side: 'W' }] },      // flats mesa
      { x: 160, y: 304, w: 96, h: 48, elev: 1, face: 2, ramps: [{ x: 192, y: 352, side: 'S' }] },      // peaks shelf (titanium)
    ],
    WALLS: [
      { x: 528, y: 48, w: 16, h: 80 }, { x: 528, y: 160, w: 16, h: 80 },       // meadow|quarry, gap rows 8–9
      { x: 848, y: 272, w: 16, h: 32 }, { x: 848, y: 336, w: 16, h: 160 },     // flats|bog, gap rows 19–20
      { x: 528, y: 272, w: 16, h: 80 }, { x: 528, y: 384, w: 16, h: 112 },     // peaks|flats, gap rows 22–23
    ],
    // closed crossings are repaired at the place — hold Space, pay in the
    // goods of the regions behind you (PRICES.crossing). No tier locks.
    CROSSINGS: [
      { id: 'x1', kind: 'pass', x: 528, y: 128, w: 16, h: 32, style: 'grey' },    // meadow → quarry hills
      { id: 'x2', kind: 'bridge', x: 848, y: 96, w: 32, h: 32, dir: 'h' },        // over the canyon stream
      { id: 'x3', kind: 'stairs', x: 960, y: 240, w: 32, h: 32, style: 'violet' }, // down into the bog
      { id: 'x4', kind: 'pass', x: 848, y: 304, w: 16, h: 32, style: 'grey' },    // bog → flats
      { id: 'x5', kind: 'drift', x: 528, y: 352, w: 16, h: 32 },                  // flats → peaks
    ],
    NODES: [
      { kind: 'iron', x: 92, y: 54 },
      { kind: 'copper', x: 130, y: 138 },
      { kind: 'stone', x: 60, y: 138 },        // v3: stone is a T0 ore — the meadow gets its node
      { kind: 'quartz', x: 250, y: 178 },      // the T1 node
      { kind: 'stone', x: 752, y: 166 },       // stone #2, quarry hills
      { kind: 'coal', x: 976, y: 342 },
      { kind: 'oil', x: 656, y: 342 },
      { kind: 'titan', x: 208, y: 326 },       // no ore in v3 — a landmark for now
    ],
  };

  // ======================================================================
  // OPEN RANGE — one flat meadow the width of the frontier, every node in a
  // row, ranks of plots below, nothing in the way. Tests the mechanics.
  // ======================================================================

  const RANGE_COLS = Array.from({ length: 13 }, (_, k) => 112 + 80 * k);
  const RANGE_ROWS = [146, 226, 306];
  const RANGE_PLOTS = [];
  for (const x of RANGE_COLS.slice(7, 13)) RANGE_PLOTS.push({ id: 'p' + (RANGE_PLOTS.length + 1), x, y: 66 });
  for (const y of RANGE_ROWS) for (const x of RANGE_COLS) RANGE_PLOTS.push({ id: 'p' + (RANGE_PLOTS.length + 1), x, y });
  const apron = (kind, x, y) => ({ kind, x: x - 16, y: y - 18, w: 64, h: 32 });

  const RANGE_SCENERY = [
    sc('tree', 5, 20), sc('tree2', 12, 21), sc('rock', 19, 20), sc('tree', 26, 21),
    sc('rock2', 33, 20), sc('tree2', 40, 21), sc('tree', 47, 20), sc('rock', 54, 21),
    sc('tree2', 60, 20), sc('rock2', 63, 22), sc('tree', 68, 20),
  ];

  const RANGE_PROPS = [
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

  const RANGE_MAP = {
    FOREST: { n: 48, e: 32, s: 32, w: 32 },
    REGIONS: [
      { id: 'range', x: 0, y: 0, w: 1168, h: 416, elev: 0, base: 'grass', cliff: 'tan', treeline: ['tree', 'tree2'] },
    ],
    GROUND: [
      ...RANGE_COLS.map((x) => apron('dirt', x, 66)),
      { kind: 'pad', x: 32, y: 128, w: 48, h: 32 },
      { kind: 'dirt', x: 80, y: 96, w: 1024, h: 16 },
      { kind: 'dirt', x: 80, y: 112, w: 16, h: 16 },
      { kind: 'dirt', x: 128, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 208, y: 80, w: 16, h: 16 }, { kind: 'dirt', x: 288, y: 80, w: 16, h: 16 },
      { kind: 'dirt', x: 1088, y: 80, w: 16, h: 16 },
      ...RANGE_ROWS.flatMap((y) => RANGE_COLS.map((x) => apron('dirt', x, y))),
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
    ],
  };

  // The registry. Per map: world size, the operator's spawn, then the ground,
  // plots, scenery and props. LEGACY: where pre-plot saves' kit stations go.
  const MAPS = {
    frontier: {
      id: 'frontier', W: 1168, H: 496, spawn: { x: 40, y: 90 },
      LEGACY: { slogi: 'p2', slova: 'p4', stroki: 'p6' },
      MAP: FRONTIER_MAP, PLOTS: FRONTIER_PLOTS, SCENERY: FRONTIER_SCENERY, PROPS: FRONTIER_PROPS,
    },
    range: {
      id: 'range', W: 1168, H: 416, spawn: { x: 84, y: 154 },
      LEGACY: {},
      MAP: RANGE_MAP, PLOTS: RANGE_PLOTS, SCENERY: RANGE_SCENERY, PROPS: RANGE_PROPS,
    },
  };
  const MAP_IDS = Object.keys(MAPS);
  const DEFAULT_MAP = 'frontier';

  // ---- the current map ----
  let cur = null;
  function useMap(id) {
    cur = MAPS[id] || MAPS[DEFAULT_MAP];
    const C = window.CHAIN;
    C.MAP_ID = cur.id;
    C.MAP = cur.MAP;
    // plots that coincide with an ore node are the node's (mines stand there)
    C.PLOTS = cur.PLOTS.filter((p) => !cur.MAP.NODES.some((n) => Math.abs(n.x + 4 - p.x) <= 8 && Math.abs(n.y + 12 - p.y) <= 8));
    cur.PLOTS = C.PLOTS;
    C.SCENERY = cur.SCENERY;
    C.PROPS = cur.PROPS;
    C.WORLD_W = cur.W;
    C.WORLD_H = cur.H;
    C.SPAWN = cur.spawn;
    C.LEGACY = cur.LEGACY || {};
    return cur;
  }
  function currentMap() { return cur; }
  // the pre-built mines of a map: the first node of each T0 ore
  function starterNodes() {
    const out = [];
    for (const ore of ORE_IDS) {
      const p = L.PAIRS.find((q) => q.ore === ore);
      if (!p || p.tier !== 0) continue;
      const i = cur.MAP.NODES.findIndex((n) => ORE_BY_NODE[n.kind] === ore);
      if (i >= 0) out.push({ ore, index: i });
    }
    return out;
  }
  function plotById(id) { return cur.PLOTS.find((p) => p.id === id); }

  // a crossing is open once the player has paid to repair it (hold Space at
  // the closed pass / bridge / stairs; the price is that region's goods)
  function crossingOpen(profile, c) {
    return !!(profile.crossings && profile.crossings[c.id]);
  }
  const closedCrossings = (profile) => (cur.MAP.CROSSINGS || []).filter((c) => !crossingOpen(profile, c));
  // the biome under a world point (later rects win, like the bake)
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
    TILE, ORES, ORE_IDS, ORE_BY_NODE, ORE_GOOD, KINDS, KIND_IDS, MATS, MAT_IDS, INGOT_IDS, RECIPES, BARS, TIER_GOOD, TUNING, PRICES,
    MAPS, MAP_IDS, DEFAULT_MAP,
    oreLetters, oreMaxMk, recipesFor, recipeFor, matTier,
    priceNode, priceExtraMine, priceMk, priceMachine, priceAuto, priceCrossing, scaleCost, closedCrossings,
    oreMk, unlockedKeys, currentTier, nextPair, targetBar,
    alphabetOf, recipeAlphabet, recipeTilt, wordPool, offerable, offerableRecipes, matExists, oreOpen, affordable,
    machinePos, machinesOfKind, machinesOfOre, nodeBuilt, freePlots, unbuiltNodes, buildableKinds, starterNodes,
    useMap, currentMap, plotById, crossingOpen, regionAt,
    // per-map fields (MAP, PLOTS, SCENERY, PROPS, WORLD_W, WORLD_H, SPAWN, LEGACY, MAP_ID) are set by useMap
  };
  useMap(DEFAULT_MAP);
})();
