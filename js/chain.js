// The production chain (tech tree v3, DESIGN.md): ores, machine kinds,
// recipes, prices, tier bars. Walking IS the menu; this file is the rules.
// Global: CHAIN
//
// v3 rules this file encodes: an ore is a finger and a Mk is a reach (the
// pairs live in language-ru.js); a material's alphabet is the union of the
// ores that went into it, computed live; a recipe is only offered once its
// union clears the kind's minimum alphabet; everything is bought from the
// bag at the place (no Hub, no kits, no contracts, no Depot); kinds are
// templates — several instances may stand.
//
// Maps (2026-08-18; split out of this file 2026-08-20): the chain is shared,
// the ground is not. Each world is its own file in js/maps/ and registers
// itself with MAPKIT before this file loads; CHAIN.useMap(id) makes one of
// them current. Every world keeps its own save (engine.js).
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
  //
  // `size` is [tiles across, tiles deep] — the body's own ground, before any
  // turn. The machine turns rigidly (2026-08-20): facing e or w the body
  // stands size[1] across and size[0] deep (MAPKIT.footprint), and its
  // ports turn with it: the front holds one place per column, each flank
  // one per row (sim.js). How deep a machine stands is not decoration; it
  // is set by how many belts leave it. The whole front discharges, and a
  // flank of a one-deep body is one tile, so only the mine — one outlet —
  // can be one deep. Everything else is two, and the last two kinds are
  // three across: the Crane's jib and the printing hall have the reach to
  // earn it, and the Manufacturer needs the front's third place for its
  // fifth port.
  const KINDS = {
    mine:         { id: 'mine',         arity: 0, grammar: 'letters',   minAlpha: 2,  perUnit: 1,  autoFrom: 0,  tier: 0, size: [2, 1], ready: true },
    smelter:      { id: 'smelter',      arity: 2, grammar: 'syllables', minAlpha: 4,  perUnit: 4,  autoFrom: 1,  tier: 0, size: [2, 2], ready: true, needsVC: true },
    foundry:      { id: 'foundry',      arity: 2, grammar: 'clusters',  minAlpha: 8,  perUnit: 5,  autoFrom: 2,  tier: 1, size: [2, 2], ready: true },
    constructor:  { id: 'constructor',  arity: 1, grammar: 'words',     minAlpha: 8,  perUnit: 6,  autoFrom: 2,  tier: 1, size: [2, 2], ready: true, minWords: 25 },
    molder:       { id: 'molder',       arity: 2, grammar: 'endings',   minAlpha: 14, perUnit: 6,  autoFrom: 3,  tier: 2, size: [2, 2], ready: true,  full: true },
    assembler:    { id: 'assembler',    arity: 2, grammar: 'phrases',   minAlpha: 16, perUnit: 8,  autoFrom: 3,  tier: 2, size: [2, 2], ready: true,  full: true },
    fastener:     { id: 'fastener',     arity: 2, grammar: 'punct',     minAlpha: 20, perUnit: 8,  autoFrom: 4,  tier: 3, size: [2, 2], ready: true,  full: true },
    crane:        { id: 'crane',        arity: 2, grammar: 'capitals',  minAlpha: 30, perUnit: 8,  autoFrom: 6,  tier: 5, size: [3, 2], ready: true,  full: true },
    manufacturer: { id: 'manufacturer', arity: 3, grammar: 'pages',     minAlpha: 33, perUnit: 12, autoFrom: 99, tier: 6, size: [3, 2], ready: true,  full: true },
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
  const ORE_GOOD = { az: 'slogi', buki: 'slogi', stone: 'brass', vedi: 'qziron', coal: 'gunmetal', oil: 'glass' };

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
    K_HEAVY: 150,          // heavy modules to finish (2026-08-20 bot log: 200 cost ~11 h)
    MACHINE_PRICE_STEP: 0.5, // nth instance of a kind costs ×(1 + step·(n−1))
    // PACE multiplies every price. With no skill gates, prices are the whole
    // pacing: a purchase should ask for about the keystrokes we want spent on
    // those keys. The base table below is written at ×1; 4 is the first-pass
    // guess for the ~30 h target — tune this one number from play logs.
    PACE: 3,               // 2026-08-20: the bot log read 62 h at 4; 3 aims the ~30 h target — the human log has the last word
  };

  // ---- prices (placeholders, all in the pattern "own material + tier good") ----
  const PRICES = {
    // opening an ore (its first mine): the tier's goods
    // priced only in goods every course can produce when the rung appears
    // (EN iron holds no vowel: castiron never smelts there, and qziron /
    // steel / blackiron wait for e / o / a — dev/en.html checks this)
    node: {
      vedi: { slogi: 40, brass: 40 },
      // never slova here: the Constructor's 25-word gate is course-dependent
      // and the EN ladder can't field 25 words this early (2026-08-20)
      coal: { brass: 60, slogi: 40 },
      oil: { stroki: 60, gunmetal: 40 },
    },
    // Mk levels per ore
    mk: {
      az: { 2: { az: 80, slogi: 30 } },
      buki: { 2: { buki: 80, gunmetal: 30 } },
      stone: { 2: { stone: 80, gunmetal: 30 } },
      vedi: { 2: { vedi: 60, slogi: 40 }, 3: { vedi: 60, qzbronze: 30 } },
      coal: { 2: { fast: 40, brass: 40 }, 3: { coal: 60, glass: 25 } },
      oil: { 2: { oil: 60, glass: 30 }, 3: { oil: 60, gunmetal: 30 }, 4: { oil: 80, fast: 30 } },
    },
    // Mk levels on a machine kind (the Fastener: punctuation keys) — its own
    // output, typed by hand right before the keys arrive, plus a tier good
    at: {
      fastener: { 1: { fast: 30, gunmetal: 30 }, 2: { fast: 40, gunmetal: 30 }, 3: { fast: 40, glass: 40 } },
    },
    // first instance of a kind at a plot — each asks for a material of the
    // tier the kind belongs to, which is the only pacing there is
    machine: {
      smelter: { az: 30, buki: 30, stone: 30 },
      foundry: { slova: 40, slogi: 40 },
      constructor: { slogi: 40, brass: 40 },
      molder: { slova: 60, brass: 30 },
      assembler: { mold: 60, slova: 40 },
      fastener: { gunmetal: 40, stroki: 40 },
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
      fastener: { fast: 40, glass: 20 },   // 2026-08-20: crates hid the whole Crane pyramid inside this price
      crane: { crate: 40, mold: 30 },   // never heavy: heavy modules are the finish counter
    },
    // repairing a closed crossing (The Frontier): paid in the goods of the
    // regions behind you
    crossing: {
      x1: { slogi: 30, brass: 30 },
      x2: { slova: 40, qzbronze: 20 },
      x3: { slova: 40, brass: 20 },
      x4: { gunmetal: 30, slova: 40 },
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
  // a machine kind's Mk (the Fastener's punctuation): the next pair's price
  function priceAt(kind, level) {
    return paced((PRICES.at[kind] && PRICES.at[kind][level]) || null);
  }
  // the Mk a machine kind stands at (pairs bought at it, in order)
  function kindMk(profile, kind) {
    let mk = 0;
    for (let i = 0; i < profile.pairsUnlocked && i < L.PAIRS.length; i++) {
      const p = L.PAIRS[i];
      if (p.at === kind) mk = Math.max(mk, p.mk);
    }
    return mk;
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
  // the focus of a full-set recipe (Molder and up): the flux — the one input
  // that is an ore or an ingot — sets the letters to lean on and, for an
  // ore, the ending family. Parts and deeper forms carry no focus.
  function recipeFocus(r, profile) {
    const letters = new Set();
    const ores = [];
    let family = null;
    for (const mat of Object.keys(r.in)) {
      const m = MATS[mat];
      if (!m) continue;
      if (m.form === 'ore') { ores.push(mat); if (!family) family = mat; }
      else if (m.ores && m.ores.length) ores.push(...m.ores);
      else continue;
      for (const ch of alphabetOf(mat, profile)) letters.add(ch);
    }
    const tilt = {};
    for (const ch of letters) tilt[ch] = 2;
    return { letters: [...letters], ores: [...new Set(ores)], family, tilt };
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
  // A machine stands where it was placed: `at` = [c0, r0], the top-left tile
  // of its body box, chosen with the build ghost (rotation overhaul,
  // 2026-08-20). The box turns with the facing. A save from before carries a
  // plot/node anchor instead; engine.js seats it once on load, and the
  // anchor fallback here is what it seats from.
  function machineAnchor(m) {
    if (m.node !== undefined && m.node !== null) {
      const n = cur.MAP.NODES[m.node];
      if (!n) return { x: 0, y: 0 };
      // the vein's own foot — a seam bedded on end is anchored lower, so a
      // mine seated from it lands on the two tiles the patch is drawn over
      return n.vert ? { x: n.x + 4, y: n.y + 24 } : { x: n.x + 4, y: n.y + 12 };
    }
    const p = plotById(m.plot);
    return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  // the way a mine stands on a vein it was not walked onto: a map that beds
  // a seam on end gets a mine on end (the pre-built starters, and any mine
  // re-homed when the map data changed under a save)
  const nodeFace = (i) => ((cur.MAP.NODES[i] || {}).vert ? 'e' : 's');
  function machineBox(m) {
    const size = (KINDS[m.kind] || {}).size || [2, 2];
    const face = MAPKIT.FACINGS.includes(m.face) ? m.face : 's';
    if (Array.isArray(m.at)) return MAPKIT.boxAt(m.at, size, face);
    const a = machineAnchor(m);
    const fp = MAPKIT.footprint(size, face);
    return MAPKIT.bodyBox(a.x, a.y, fp[0], fp[1]);
  }
  // the point everything that hangs off a machine reads: just inside the
  // box's foot-left corner, matching where the old plot anchors stood
  function machinePos(m) {
    const b = machineBox(m);
    return { x: b.c0 * TILE + 1, y: (b.r1 + 1) * TILE - 5 };
  }
  const machinesOfKind = (profile, kind) => profile.machines.filter((m) => m.kind === kind);
  const machinesOfOre = (profile, ore) => profile.machines.filter((m) => m.kind === 'mine' && m.ore === ore);
  const nodeBuilt = (profile, i) => profile.machines.some((m) => m.node === i);
  // pads with no body standing on any of their tiles. A plot stopped being a
  // dockable shop when the build ghost arrived; what is left of it is the
  // ground it surveys.
  function freePlots(profile) {
    const taken = new Set();
    for (const m of profile.machines) {
      const b = machineBox(m);
      for (let ty = b.r0; ty <= b.r1; ty++) for (let tx = b.c0; tx <= b.c1; tx++) taken.add(tx + ',' + ty);
    }
    return cur.PLOTS.filter((p) => {
      const b = MAPKIT.padBox(p);
      for (let ty = b.r0; ty <= b.r1; ty++) for (let tx = b.c0; tx <= b.c1; tx++) if (taken.has(tx + ',' + ty)) return false;
      return true;
    });
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

  // ---- the worlds ----
  // The maps live in js/maps/ — one file per world, each ending in
  // MAPKIT.register(...) — and load before this file. The chain is shared,
  // the ground is not: a world brings its own terrain, plots, nodes, scenery,
  // props and spawn, and keeps its own save (engine.js). Adding a world is a
  // new file in js/maps/, a script tag, and two i18n strings.
  const MAPS = MAPKIT.MAPS;
  const MAP_IDS = MAPKIT.IDS;
  const DEFAULT_MAP = MAPKIT.DEFAULT;

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
    // a `free` crossing was never broken — it is built scenery you walk over
    // (the bridges out to the Frontier's island), not a repair job
    return !!c.free || !!(profile.crossings && profile.crossings[c.id]);
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
    priceNode, priceExtraMine, priceMk, priceAt, kindMk, priceMachine, priceAuto, priceCrossing, scaleCost, closedCrossings,
    oreMk, unlockedKeys, currentTier, nextPair, targetBar,
    alphabetOf, recipeAlphabet, recipeTilt, recipeFocus, wordPool, offerable, offerableRecipes, matExists, oreOpen, affordable,
    machinePos, machineBox, machineAnchor, nodeFace, machinesOfKind, machinesOfOre, nodeBuilt, freePlots, unbuiltNodes, buildableKinds, starterNodes,
    useMap, currentMap, plotById, crossingOpen, regionAt,
    // per-map fields (MAP, PLOTS, SCENERY, PROPS, WORLD_W, WORLD_H, SPAWN, LEGACY, MAP_ID) are set by useMap
  };
  useMap(DEFAULT_MAP);
})();
