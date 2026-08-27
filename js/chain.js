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
// The ladder branches (2026-08-22). A save holds a Mk level per PLACE —
// each ore and each machine kind that sells keys (the Fastener) — and every
// place always offers its next level at its real price. Nothing orders one
// place against another except what the prices are made of: the coal seam
// asks for quartz, so the ring finger follows the middle finger; the oil
// derrick asks for modules, so the pinky waits for the Assembler. A price a
// course cannot produce when its rung appears is a bug dev/verify.html and
// dev/en.html catch by walking every reachable state. Where a machine kind
// would have nothing to make — its content floor wants keys no good can
// name — the build row names the upgrade that fixes it (`whatUnlocks`), and
// the machine cannot be built until then: no machine is ever born dead.
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
    iron:   { id: 'iron',   node: 'iron',   order: 0 },
    copper: { id: 'copper', node: 'copper', order: 1 },
    stone:  { id: 'stone',  node: 'stone',  order: 2 },
    quartz: { id: 'quartz', node: 'quartz', order: 3 },
    coal:   { id: 'coal',   node: 'coal',   order: 4 },
    oil:    { id: 'oil',    node: 'oil',    order: 5 },
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
  // Content floors left the runtime with the deep-ore ledger (2026-08-22):
  // a recipe's alphabet is a constant of its pinned inputs, so what a course
  // can drill is decided once, when its book is built (below) — V+C for the
  // Smelter, the word floor for the Constructor — and every gate the player
  // meets is an ingredient. Full-set kinds drill the whole unlocked set.
  const KINDS = {
    mine:         { id: 'mine',         arity: 0, grammar: 'letters',   perUnit: 1,  tier: 0, size: [2, 1], ready: true },
    smelter:      { id: 'smelter',      arity: 2, grammar: 'syllables', perUnit: 4,  tier: 0, size: [2, 2], ready: true, needsVC: true },
    foundry:      { id: 'foundry',      arity: 2, grammar: 'clusters',  perUnit: 5,  tier: 1, size: [2, 2], ready: true },
    constructor:  { id: 'constructor',  arity: 1, grammar: 'words',     perUnit: 6,  tier: 1, size: [2, 2], ready: true, minWords: 25 },
    molder:       { id: 'molder',       arity: 2, grammar: 'endings',   perUnit: 6,  tier: 2, size: [2, 2], ready: true,  full: true },
    assembler:    { id: 'assembler',    arity: 2, grammar: 'phrases',   perUnit: 8,  tier: 2, size: [2, 2], ready: true,  full: true },
    fastener:     { id: 'fastener',     arity: 2, grammar: 'punct',     perUnit: 8,  tier: 3, size: [2, 2], ready: true,  full: true },
    crane:        { id: 'crane',        arity: 2, grammar: 'capitals',  perUnit: 8,  tier: 5, size: [3, 2], ready: true,  full: true },
    manufacturer: { id: 'manufacturer', arity: 3, grammar: 'pages',     perUnit: 12, tier: 6, size: [3, 2], ready: true,  full: true },
  };
  const KIND_IDS = Object.keys(KINDS);

  // ---- materials: ores at depths, pinned ingots, deeper forms ----
  // The deep-ore ledger (2026-08-22, approved): a Mk MINTS a material. Each
  // ore-form entry carries its family ore and a depth; a deep good holds its
  // ore's letters cumulatively through that depth, and satisfies any recipe
  // or price asking for a shallower form of the same ore (downward
  // compatibility — see matSatisfies / bagAvail below). Every ingot PINS its
  // ores at exact depths, so its alphabet — and its whole content pool — is
  // a constant, checked once per course when the book is built, never at
  // run time. Variants stop at the ore level: parts and above are grade-free.
  // Ids are the material's own name (2026-08-26): the transliterated ids the
  // chain carried from the pre-v3 build — `az`, `buki`, `vedi`, `slogi`,
  // `slova`, `stroki` — are gone, and an id now reads as what it is, the same
  // word the maps, the art and DESIGN.md use. They are save keys, so
  // engine.js migrates a v2 profile forward (migrateV2); the only places the
  // old spellings survive are the two v1/v2 lookup tables there and each
  // map's `LEGACY`, all of which are read off disk and can never rename.
  // Icons derive from form + ores (pixels.js).
  const MATS = {
    iron:   { form: 'ore', ores: ['iron'],   depth: 1 }, iron2:   { form: 'ore', ores: ['iron'],   depth: 2 },
    copper: { form: 'ore', ores: ['copper'], depth: 1 }, copper2: { form: 'ore', ores: ['copper'], depth: 2 },
    stone:  { form: 'ore', ores: ['stone'],  depth: 1 }, stone2:  { form: 'ore', ores: ['stone'],  depth: 2 },
    quartz: { form: 'ore', ores: ['quartz'], depth: 1 }, quartz2: { form: 'ore', ores: ['quartz'], depth: 2 }, quartz3: { form: 'ore', ores: ['quartz'], depth: 3 },
    coal:   { form: 'ore', ores: ['coal'],   depth: 1 }, coal2:   { form: 'ore', ores: ['coal'],   depth: 2 }, coal3:   { form: 'ore', ores: ['coal'],   depth: 3 },
    oil:    { form: 'ore', ores: ['oil'],    depth: 1 }, oil2:    { form: 'ore', ores: ['oil'],    depth: 2 }, oil3:    { form: 'ore', ores: ['oil'],    depth: 3 },
    // two-ore ingots (the Smelter), pinned. Six are the deep rungs'
    // signature alloys — every Mk is a new recipe to hand-work.
    bronze:       { form: 'ingot', ores: ['iron', 'copper'],   pin: { iron: 1, copper: 1 } },   // bronze
    castiron:    { form: 'ingot', ores: ['iron', 'stone'],  pin: { iron: 1, stone: 1 } },
    qziron:      { form: 'ingot', ores: ['iron', 'quartz'],   pin: { iron: 1, quartz: 1 } },
    rivetiron:   { form: 'ingot', ores: ['iron', 'copper'],   pin: { iron: 2, copper: 1 } },
    bellquartz:  { form: 'ingot', ores: ['quartz', 'copper'], pin: { quartz: 2, copper: 1 } },
    steel:       { form: 'ingot', ores: ['iron', 'coal'],   pin: { iron: 2, coal: 1 } },
    gunmetal:    { form: 'ingot', ores: ['copper', 'coal'], pin: { copper: 2, coal: 1 } },
    brass:       { form: 'ingot', ores: ['copper', 'stone'], pin: { copper: 2, stone: 2 } },   // the deep pair, as the v3 table always intended
    blackiron:   { form: 'ingot', ores: ['iron', 'oil'],    pin: { iron: 2, oil: 1 } },
    glass:       { form: 'ingot', ores: ['quartz', 'oil'],  pin: { quartz: 3, oil: 1 } },
    naphtha:     { form: 'ingot', ores: ['copper', 'oil'],  pin: { copper: 1, oil: 2 } },      // naphtha bronze
    cokebrass:   { form: 'ingot', ores: ['copper', 'coal'], pin: { copper: 2, coal: 2 } },
    petrolglass: { form: 'ingot', ores: ['quartz', 'oil'],  pin: { quartz: 3, oil: 3 } },
    flashcopper: { form: 'ingot', ores: ['copper', 'coal'], pin: { copper: 2, coal: 3 } },
    // three-ore ingots (the Foundry), pinned
    qzbronze:   { form: 'ingot3', ores: ['iron', 'copper', 'quartz'],   pin: { iron: 1, copper: 1, quartz: 2 } },
    caststeel:  { form: 'ingot3', ores: ['iron', 'coal', 'stone'],  pin: { iron: 2, coal: 1, stone: 1 } },
    blackbrass: { form: 'ingot3', ores: ['copper', 'stone', 'oil'], pin: { copper: 2, stone: 2, oil: 2 } },
    qzsteel:    { form: 'ingot3', ores: ['iron', 'coal', 'quartz'],   pin: { iron: 2, coal: 1, quartz: 3 } },
    cokeiron:   { form: 'ingot3', ores: ['iron', 'oil', 'coal'],    pin: { iron: 2, oil: 1, coal: 2 } },
    parts: { form: 'parts', ores: [] }, mold: { form: 'moldings', ores: [] }, modules: { form: 'modules', ores: [] },
    fast: { form: 'fastened', ores: [] }, sealed: { form: 'sealed', ores: [] }, bound: { form: 'bound', ores: [] },
    crate: { form: 'crates', ores: [] }, heavy: { form: 'heavy', ores: [] },
  };
  const MAT_IDS = Object.keys(MATS);
  const INGOT_IDS = MAT_IDS.filter((id) => MATS[id].form === 'ingot' || MATS[id].form === 'ingot3');
  // the ore families, shallow to deep, and the family algebra
  const ORE_MATS = {};
  for (const id of MAT_IDS) if (MATS[id].form === 'ore') (ORE_MATS[MATS[id].ores[0]] = ORE_MATS[MATS[id].ores[0]] || []).push(id);
  for (const fam of Object.values(ORE_MATS)) fam.sort((a, b) => MATS[a].depth - MATS[b].depth);
  const matOfDepth = (ore, d) => (ORE_MATS[ore] || [])[Math.max(0, Math.min(d, (ORE_MATS[ore] || []).length)) - 1] || ore;
  // does material `id` satisfy a slot asking for `pinId`? Itself, or a
  // deeper member of the same ore family (downward compatibility).
  function matSatisfies(id, pinId) {
    if (id === pinId) return true;
    const a = MATS[id], b = MATS[pinId];
    return !!(a && b && a.form === 'ore' && b.form === 'ore' && a.ores[0] === b.ores[0] && a.depth >= b.depth);
  }
  // how much of `pinId` the bag can cover, counting deeper family stock
  function bagAvail(bag, pinId) {
    const spec = MATS[pinId];
    if (!spec || spec.form !== 'ore') return bag[pinId] || 0;
    return (ORE_MATS[spec.ores[0]] || [pinId]).filter((id) => matSatisfies(id, pinId)).reduce((a, id) => a + (bag[id] || 0), 0);
  }
  // spend a cost from the bag, shallowest stock first; assumes affordable()
  function spendCost(bag, cost) {
    for (const [pinId, n] of Object.entries(cost)) {
      let left = n;
      const spec = MATS[pinId];
      const pool = spec && spec.form === 'ore' ? (ORE_MATS[spec.ores[0]] || [pinId]).filter((id) => matSatisfies(id, pinId)) : [pinId];
      for (const id of pool) {
        const k = Math.min(left, bag[id] || 0);
        if (k > 0) { bag[id] -= k; left -= k; }
        if (!left) break;
      }
    }
  }

  // ---- recipes: authored, never emergent. Ratios are placeholders. ----
  // Inputs name exact materials — a deep id where the ledger pins one — and
  // an ore slot is satisfied by deeper family stock (matSatisfies). A
  // recipe with `atMk` needs that many key rungs bought at its own machine
  // (the Fastener's product line: fastened → sealed → bound) — an upgrade
  // bought AT the machine changing THAT machine's work, like a mine's Mk.
  // Tier is documentation of when a recipe tends to arrive, never a gate.
  const RECIPES = [
    { kind: 'smelter', in: { iron: 2, copper: 1 }, out: 'bronze', tier: 0 },
    { kind: 'smelter', in: { iron: 2, stone: 1 }, out: 'castiron', tier: 0 },
    { kind: 'smelter', in: { iron: 2, quartz: 1 }, out: 'qziron', tier: 1 },
    { kind: 'smelter', in: { iron2: 2, copper: 1 }, out: 'rivetiron', tier: 1 },
    { kind: 'smelter', in: { quartz2: 2, copper: 1 }, out: 'bellquartz', tier: 1 },
    { kind: 'smelter', in: { iron2: 3, coal: 1 }, out: 'steel', tier: 2 },
    { kind: 'smelter', in: { copper2: 2, coal: 1 }, out: 'gunmetal', tier: 2 },
    { kind: 'smelter', in: { copper2: 2, stone2: 1 }, out: 'brass', tier: 2 },
    { kind: 'smelter', in: { iron2: 2, oil: 1 }, out: 'blackiron', tier: 3 },
    { kind: 'smelter', in: { quartz3: 2, oil: 1 }, out: 'glass', tier: 3 },
    { kind: 'smelter', in: { copper: 2, oil2: 1 }, out: 'naphtha', tier: 3 },
    { kind: 'smelter', in: { copper2: 2, coal2: 1 }, out: 'cokebrass', tier: 4 },
    { kind: 'smelter', in: { quartz3: 2, oil3: 1 }, out: 'petrolglass', tier: 4 },
    { kind: 'smelter', in: { copper2: 2, coal3: 1 }, out: 'flashcopper', tier: 4 },
    { kind: 'foundry', in: { bronze: 2, quartz2: 1 }, out: 'qzbronze', tier: 1 },
    { kind: 'foundry', in: { steel: 2, stone: 1 }, out: 'caststeel', tier: 2 },
    { kind: 'foundry', in: { brass: 2, oil2: 1 }, out: 'blackbrass', tier: 3 },
    { kind: 'foundry', in: { steel: 2, quartz3: 1 }, out: 'qzsteel', tier: 4 },
    { kind: 'foundry', in: { blackiron: 2, coal2: 1 }, out: 'cokeiron', tier: 4 },
    { kind: 'molder', in: { parts: 2, iron: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { parts: 2, copper: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { parts: 2, stone: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { parts: 2, quartz: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { parts: 2, coal: 1 }, out: 'mold', tier: 2 },
    { kind: 'molder', in: { parts: 2, oil: 1 }, out: 'mold', tier: 3 },
    { kind: 'assembler', in: { parts: 2, steel: 1 }, out: 'modules', tier: 2 },
    { kind: 'assembler', in: { parts: 2, brass: 1 }, out: 'modules', tier: 2 },
    { kind: 'assembler', in: { parts: 2, blackiron: 1 }, out: 'modules', tier: 3 },
    { kind: 'assembler', in: { parts: 2, gunmetal: 1 }, out: 'modules', tier: 4 },
    { kind: 'fastener', in: { modules: 2, oil: 1 }, out: 'fast', tier: 3 },
    { kind: 'fastener', in: { modules: 2, coal: 1 }, out: 'fast', tier: 4 },
    { kind: 'fastener', in: { fast: 1, glass: 1 }, out: 'sealed', tier: 4, atMk: 2 },   // one cased good, sealed — a tax, not a pyramid
    { kind: 'fastener', in: { sealed: 2, petrolglass: 1 }, out: 'bound', tier: 5, atMk: 3 },
    { kind: 'crane', in: { sealed: 2, oil: 1 }, out: 'crate', tier: 5 },
    { kind: 'manufacturer', in: { crate: 2, bound: 1, parts: 2 }, out: 'heavy', tier: 6 },
  ];
  // Constructor: any ingot → parts (2 → 1). Tier = the ingot's recipe tier.
  // The course book (below) keeps only the ingots whose constant word pool
  // clears MIN_WORDS — vowel-poor alloys skip the Constructor by design.
  for (const id of INGOT_IDS) {
    const src = RECIPES.find((r) => r.out === id);
    RECIPES.push({ kind: 'constructor', in: { [id]: 2 }, out: 'parts', tier: Math.max(KINDS.constructor.tier, src ? src.tier : 1) });
  }
  const recipesFor = (kind) => RECIPES.filter((r) => r.kind === kind);
  const recipeFor = (mat) => RECIPES.find((r) => r.out === mat) || null;
  // the tier a material first exists at
  function matTier(id) {
    const spec = MATS[id];
    if (spec && spec.form === 'ore') { const p = L.PAIRS.find((q) => q.ore === spec.ores[0] && q.mk === spec.depth); return p ? p.tier : 0; }
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
  const TIER_GOOD = ['bronze', 'parts', 'modules', 'fast', 'sealed', 'crate', 'heavy'];
  // each ore's own alloy — the good its extra mines and automation cost in
  // (every entry exists in both courses' books)
  const ORE_GOOD = { iron: 'bronze', copper: 'bronze', stone: 'bronze', quartz: 'qzbronze', coal: 'gunmetal', oil: 'glass' };

  const TUNING = {
    PICKUP_CAP: 100,       // (legacy) the old instant pickup; buffers cap below
    // the simulation (phase 3): buffers, rates, belts — real time
    BUFFER_CAP: 100,       // per material, input and output buffers
    // What his back will bear, made real (user ruling 2026-08-22): the bag
    // is the HAND ceiling — every mandatory hold tops out at 240 (paced), so
    // 300 gives 25% headroom — and the standing factory is the scalable
    // warehouse: every machine's bins hold 100 per material and refill
    // themselves while you type elsewhere. Wanting a bigger surplus means
    // building more works. Hand overflow: bag → the machine's own bin → the
    // ground at your feet (bounded by typing speed; automation NEVER spills
    // — a full machine pauses, as ever).
    BAG_CAP: 300,          // per material, what the operator can carry (see bagAdd)
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
      // T0 goods only: parallel with Iron Mk2, the first branch (brass went
      // deep with the ledger, so raw stone stands beside the bronze)
      quartz: { bronze: 40, stone: 40 },
      // quartz in the price: the seam (ring finger) follows the vein (middle)
      coal: { quartz: 40, bronze: 60 },
      // rivet iron forces Iron Mk2 before the pinky — with modules (which
      // force everything else early), the derrick leaves no rung behind
      oil: { modules: 60, rivetiron: 40 },
    },
    // Mk levels per ore (gunmetal pins deep copper now, so Copper/Stone Mk2
    // ask for raw coal instead; naphtha bronze gives Oil Mk2's alloy its
    // consumer at Coal Mk2; sealed goods put the last letters after ? !)
    mk: {
      iron: { 2: { iron: 80, bronze: 30 } },
      copper: { 2: { copper: 80, coal: 30 } },
      stone: { 2: { stone: 80, coal: 30 } },
      quartz: { 2: { quartz: 60, bronze: 40 }, 3: { quartz: 60, modules: 30 } },   // Mk3 in modules: the middle finger's top row waits for the Assembler's era
      coal: { 2: { fast: 40, naphtha: 40 }, 3: { coal: 60, glass: 25 } },
      // No place goes past Mk3 (user ruling 2026-08-22): RU's rare pinky
      // tail folded into Mk2/Mk3 as four-key sweeps — see language-ru.js
      oil: { 2: { oil: 60, glass: 30 }, 3: { oil: 60, sealed: 20 } },
    },
    // Mk levels on a machine kind (the Fastener: punctuation keys) — its own
    // output, typed by hand right before the keys arrive, plus a tier good
    at: {
      // comma in gunmetal (deep copper); ? ! in brass — the deep PAIR, so
      // Stone Mk2 stands on the critical path (no rung is skippable to the
      // finish); Mk3 after the Crane, in glass and a few crates
      fastener: { 1: { fast: 30, gunmetal: 30 }, 2: { fast: 40, brass: 30 }, 3: { glass: 40, crate: 6 } },
    },
    // first instance of a kind at a build site — each asks for a material of the
    // era the kind belongs to, which is the only pacing there is. A price
    // names the ore a kind's recipes live on (2026-08-22): the Constructor
    // asks for quartz, the Molder for a coal alloy, the Fastener for oil
    // itself — so a kind is only ever built where its recipes can exist.
    // Raw ores and bronze / brass / gunmetal / moldings / modules / fastened
    // goods are the price goods every course can make when the rung appears;
    // quartz iron, steel and black iron are not (EN has no vowel on them).
    // first instance of a kind at a build site. A price names the kind's own first
    // feed where one exists (the ledger): the Foundry costs bell quartz —
    // "after Quartz Mk2" as an ingredient — the Constructor its quartz
    // bronze, the Crane sealed goods and flash copper. Every good exists in
    // both courses' books.
    machine: {
      smelter: { iron: 30, copper: 30, stone: 30 },
      foundry: { bellquartz: 40, bronze: 40 },
      constructor: { qzbronze: 40, bronze: 40 },
      molder: { parts: 60, gunmetal: 30 },
      assembler: { mold: 60, parts: 40 },
      fastener: { oil: 40, modules: 40 },
      crane: { sealed: 50, flashcopper: 30 },
      manufacturer: { crate: 80, mold: 60, parts: 60 },   // 80: no single ask may crowd the 300 bag (240 paced is the game-wide ceiling)
    },
    // automation is PER RECIPE (the ledger): its price is the recipe's own
    // output (`own` — which is also the run-in: that many units by hand
    // since the machine learned the recipe, and the price then consumes
    // them) plus a later good. priceAuto() assembles it.
    auto: {
      smelter: { own: 40, plus: { parts: 20 } },
      foundry: { own: 30, plus: { parts: 30 } },
      constructor: { own: 60, plus: { bellquartz: 20 } },
      molder: { own: 40, plus: { modules: 20 } },
      assembler: { own: 40, plus: { fast: 20 } },
      fastener: { own: 40, plus: { glass: 20 } },   // 2026-08-20: crates hid the whole Crane pyramid inside this price
      crane: { own: 40, plus: { mold: 30 } },   // never heavy: heavy modules are the finish counter
    },
    // repairing a closed crossing (The Frontier): paid in the goods of the
    // regions behind you
    crossing: {
      x1: { bronze: 30, brass: 30 },
      x2: { parts: 40, qzbronze: 20 },
      x3: { parts: 40, brass: 20 },
      x4: { gunmetal: 30, parts: 40 },
      x5: { blackiron: 40, parts: 60 },
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
  function priceMachine(kind, nth) {
    const base = PRICES.machine[kind];
    if (!base) return null;
    return paced(scaleCost(base, 1 + TUNING.MACHINE_PRICE_STEP * Math.max(0, nth - 1)));
  }
  // automation is per recipe (the ledger, 2026-08-22). A mine's "recipe" is
  // the material its depth yields — so a Mk retools by construction: the new
  // depth's product has no ⚙ yet. The price asks for the recipe's own
  // output, which doubles as the run-in: the machine must have made that
  // many units by hand since it learned the recipe, and the purchase then
  // consumes them. No stockpile skips the review.
  function priceAuto(m, r, profile) {
    if (m.kind === 'mine') {
      const own = profile ? mineMat(profile, m) : m.ore;
      return paced({ [own]: 80, [ORE_GOOD[m.ore]]: 20 });
    }
    const spec = PRICES.auto[m.kind];
    if (!spec || !r) return null;
    return paced(Object.assign({ [r.out]: spec.own }, spec.plus));
  }
  // the key a recipe's ⚙ and run-in hang on (per machine instance)
  const autoKey = (m, r, profile) => (m.kind === 'mine' ? (profile ? mineMat(profile, m) : m.ore) : (r ? r.out + '|' + JSON.stringify(r.in) : null));
  const autoOn = (m, key) => !!(key && m.autoOn && m.autoOn[key]);
  // units still to hand-work before this recipe's ⚙ goes on sale
  function runInLeft(m, r, profile) {
    const price = priceAuto(m, r, profile);
    if (!price) return 0;
    const own = m.kind === 'mine' ? (profile ? mineMat(profile, m) : m.ore) : r.out;
    const done = (m.handMade && m.handMade[autoKey(m, r, profile)]) || 0;
    return Math.max(0, (price[own] || 0) - done);
  }
  const priceCrossing = (c) => paced(PRICES.crossing[c.id] || null);

  // ---- the curriculum position, from the save ----
  // A place is an ore (keys bought at its mines) or a machine kind that
  // sells keys (the Fastener). The save carries a Mk level per place
  // (`profile.mk`); a save from before the branch (2026-08-22) carries
  // `pairsUnlocked`, a count along the course order, and reads the same.
  const AT_KINDS = [...new Set(L.PAIRS.filter((p) => p.at).map((p) => p.at))];
  const PLACES = [...ORE_IDS, ...AT_KINDS];
  const placeOf = (p) => p.ore || p.at;
  function mkTable(profile) {
    if (profile.mk) return profile.mk;
    const t = {};
    for (const pl of PLACES) t[pl] = 0;
    for (let i = 0; i < (profile.pairsUnlocked || 0) && i < L.PAIRS.length; i++) {
      const p = L.PAIRS[i];
      t[placeOf(p)] = Math.max(t[placeOf(p)] || 0, p.mk);
    }
    return t;
  }
  const pairOf = (place, level) => L.PAIRS.find((p) => placeOf(p) === place && p.mk === level) || null;
  const pairBought = (profile, p) => (mkTable(profile)[placeOf(p)] || 0) >= p.mk;
  const boughtPairs = (profile) => L.PAIRS.filter((p) => pairBought(profile, p));
  const oreMk = (profile, ore) => mkTable(profile)[ore] || 0;
  // the Mk a machine kind stands at (keys bought at it)
  const kindMk = (profile, kind) => mkTable(profile)[kind] || 0;
  function unlockedKeys(profile) {
    const out = [];
    for (const p of boughtPairs(profile)) out.push(...p.keys);
    return out;
  }
  function currentTier(profile) {
    let t = 0;
    for (const p of boughtPairs(profile)) t = Math.max(t, p.tier);
    return t;
  }
  // the rungs for sale right now: at every place, its next level
  function nextPairs(profile) {
    const t = mkTable(profile);
    const out = [];
    for (const pl of PLACES) {
      const p = pairOf(pl, (t[pl] || 0) + 1);
      if (p) out.push(p);
    }
    return out;
  }
  // the rung the course would take first — the lowest tier for sale, ties
  // in course order. What the summary and the tier bar read.
  function nextPair(profile) {
    const ps = nextPairs(profile);
    if (!ps.length) return null;
    return ps.reduce((a, b) => (b.tier < a.tier || (b.tier === a.tier && L.PAIRS.indexOf(b) < L.PAIRS.indexOf(a)) ? b : a));
  }
  // what a rung costs: a vein's opening, a mine's Mk, a machine's Mk
  function pricePair(p) {
    if (!p) return null;
    if (p.at) return priceAt(p.at, p.mk);
    return p.mk === 1 ? priceNode(p.ore) : priceMk(p.ore, p.mk);
  }
  // the keys that arrived last — the drills lean on them while they are new
  function newestPair(profile) {
    const log = profile.unlockLog || [];
    const last = log[log.length - 1];
    if (!last || !Array.isArray(last.keys)) return null;
    return L.PAIRS.find((p) => p.keys.length === last.keys.length && p.keys.every((k, i) => k === last.keys[i])) || null;
  }
  // the tier.s speed/accuracy target — shown to the player and used to weight
  // weak letters in the drills; never a lock (progress is what you type and
  // spend). The bar of the tier the next pair belongs to.
  function targetBar(profile) {
    const np = nextPair(profile);
    const t = np ? np.tier : BARS.length;
    return BARS[Math.max(0, Math.min(BARS.length - 1, t - 1))];
  }

  // ---- alphabets: constants of the pins (2026-08-22) ----
  // An ore-form material's letters run through its depth; an ingot's are the
  // union of its pinned ores. Only parts and deeper read the live profile.
  function alphabetOf(mat, profile) {
    const m = MATS[mat];
    if (!m) return [];
    if (m.form === 'ore') return oreLetters(m.ores[0], m.depth);
    if (m.pin) {
      const set = new Set();
      for (const [o, d] of Object.entries(m.pin)) for (const ch of oreLetters(o, d)) set.add(ch);
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
      if (m.form === 'ore') { ores.push(m.ores[0]); if (!family) family = m.ores[0]; }
      else if (m.ores && m.ores.length) ores.push(...m.ores);
      else continue;
      // the focus leans on every letter the player owns of the flux's ores,
      // not just the pinned depth — a drill emphasis, never a gate
      for (const o of (m.form === 'ore' ? [m.ores[0]] : m.ores)) for (const ch of oreLetters(o, oreMk(profile, o))) letters.add(ch);
    }
    const tilt = {};
    for (const ch of letters) tilt[ch] = 2;
    return { letters: [...letters], ores: [...new Set(ores)], family, tilt };
  }
  const isVowel = (ch) => L.VOWELS.has(ch);
  const isLetter = (ch) => !L.PUNCT.has(ch) && /\p{L}/u.test(ch);
  // does this ore exist for the player yet (its first pair unlocked)?
  const oreOpen = (profile, ore) => oreMk(profile, ore) >= 1;
  // does this material exist yet: every pinned ore bought to its depth
  function matExists(profile, mat) {
    const m = MATS[mat];
    if (!m) return false;
    if (m.form === 'ore') return oreMk(profile, m.ores[0]) >= m.depth;
    if (m.pin) return Object.entries(m.pin).every(([o, d]) => oreMk(profile, o) >= d);
    return true;
  }
  // the material a mine yields: its ore at the depth its Mk has reached —
  // a Mk MINTS a material, and the retool is emergent (the new depth's
  // product has no ⚙ yet, so the mine is back in your hands)
  const mineMat = (profile, m) => matOfDepth(m.ore, Math.max(1, oreMk(profile, m.ore)));
  // real words typeable with an alphabet — memoized by the alphabet, since
  // every menu refresh and every state the verify walker visits asks again
  const poolMemo = new Map();
  function wordPool(alpha) {
    const key = [...alpha].sort().join('');
    let pool = poolMemo.get(key);
    if (!pool) {
      const set = new Set(alpha);
      pool = L.WORDS.filter(([w]) => [...w].every((c) => set.has(c)));
      if (poolMemo.size > 4096) poolMemo.clear();
      poolMemo.set(key, pool);
    }
    return pool;
  }
  // ---- the course book: which recipes exist in THIS course, decided once ----
  // A recipe's alphabet is a constant of its pins, so the content checks run
  // here, at load: the Smelter's alloys must hold a vowel and a consonant
  // (EN's vowel-poor alloys are absent from its book, never grayed at run
  // time), and the Constructor's feeds must clear the word floor. Everything
  // else is always in. dev/verify.html and dev/en.html print each course's
  // book and hold the ledger's invariants against it.
  function inBook(r) {
    const kind = KINDS[r.kind];
    if (kind.full) return true;
    const alpha = recipeAlphabet(r, { mk: {} });
    const letters = alpha.filter(isLetter);
    if (kind.needsVC && !(letters.some(isVowel) && letters.some((c) => !isVowel(c) && !L.SEMIS.has(c)))) return false;
    if (kind.minWords && wordPool(alpha).length < kind.minWords) return false;
    return true;
  }
  let BOOK = null;
  const bookRecipes = () => BOOK || (BOOK = RECIPES.filter(inBook));
  // is a recipe offered now: in the course's book, kind ready, every input's
  // rungs bought, and — for the Fastener's product line — enough key rungs
  // bought at the machine itself. Nothing is locked behind a tier number —
  // the recipe's tier is documentation of when it tends to arrive.
  function offerable(r, profile) {
    const kind = KINDS[r.kind];
    if (!kind.ready) return false;
    if (!bookRecipes().includes(r)) return false;
    if (r.atMk && kindMk(profile, r.kind) < r.atMk) return false;
    for (const mat of Object.keys(r.in)) if (!matExists(profile, mat)) return false;
    return true;
  }
  function offerableRecipes(kind, profile) {
    return recipesFor(kind).filter((r) => offerable(r, profile));
  }
  function affordable(bag, cost) {
    return !!cost && Object.entries(cost).every(([mat, n]) => bagAvail(bag, mat) >= n);
  }

  // The bag carries at most BAG_CAP of any one material, and everything that
  // puts goods in it comes through here — typed output, ground pickups, a
  // machine's collected buffer, a debug handout. Past the cap the surplus is
  // not held back anywhere: it simply never arrives. Returns how many landed,
  // so a caller can float the number the player actually got.
  function bagAdd(bag, mat, n) {
    const have = bag[mat] || 0;
    const k = Math.max(0, Math.min(n, TUNING.BAG_CAP - have));
    if (k > 0) bag[mat] = have + k;
    return k;
  }

  // ---- machines standing on the map ----
  // A machine stands where it was placed: `at` = [c0, r0], the top-left tile
  // of its body box, chosen with the build ghost (rotation overhaul,
  // 2026-08-20). The box turns with the facing. A save from before carries a
  // site or node anchor instead (the machine field is spelled `plot`, a
  // save-reader spelling that stays); engine.js seats it once on load, and
  // the anchor fallback here is what it seats from.
  function machineAnchor(m) {
    if (m.node !== undefined && m.node !== null) {
      const n = cur.MAP.NODES[m.node];
      if (!n) return { x: 0, y: 0 };
      // the vein's own foot — a seam bedded on end is anchored lower, so a
      // mine seated from it lands on the two tiles the patch is drawn over
      return n.vert ? { x: n.x + 4, y: n.y + 24 } : { x: n.x + 4, y: n.y + 12 };
    }
    const p = siteById(m.plot);
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
  // box's foot-left corner, matching where the old site anchors stood
  function machinePos(m) {
    const b = machineBox(m);
    return { x: b.c0 * TILE + 1, y: (b.r1 + 1) * TILE - 5 };
  }
  // the middle of that same foot: where a machine sets something down in
  // front of itself (a spill), rather than where a line is drawn from it
  function machineFoot(m) {
    const b = machineBox(m);
    return { x: (b.c0 + b.w / 2) * TILE, y: (b.r1 + 1) * TILE - 5 };
  }
  const machinesOfKind = (profile, kind) => profile.machines.filter((m) => m.kind === kind);
  const machinesOfOre = (profile, ore) => profile.machines.filter((m) => m.kind === 'mine' && m.ore === ore);
  const nodeBuilt = (profile, i) => profile.machines.some((m) => m.node === i);
  // build sites with no body standing on any of their tiles. A site stopped
  // being a dockable shop when the build ghost arrived; what is left of it
  // is the ground it zones.
  function freeSites(profile) {
    const taken = new Set();
    for (const m of profile.machines) {
      const b = machineBox(m);
      for (let ty = b.r0; ty <= b.r1; ty++) for (let tx = b.c0; tx <= b.c1; tx++) taken.add(tx + ',' + ty);
    }
    return cur.SITES.filter((p) => {
      const b = MAPKIT.siteBox(p);
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
  // A kind with nothing to make is not for sale. Which purchase would give
  // it a recipe? Try the next level at every place, then pairs of them, then
  // triples — the smallest set that makes any recipe offerable, in course
  // order. Null when none does within reach (the row then says so). Pure
  // and course-agnostic: it reads the same content floors the drills read,
  // so what it names is exactly what is missing. Returns [] when the kind
  // already has a recipe.
  function whatUnlocks(kind, profile, depth) {
    depth = depth || 4;
    if (offerableRecipes(kind, profile).length) return [];
    const base = Object.assign({}, mkTable(profile));
    // the earliest-era fix among the smallest: lowest top tier, then lowest
    // tiers in all, then course order
    const rank = (set) => [Math.max(...set.map((p) => p.tier)), set.reduce((a, p) => a + p.tier, 0), Math.max(...set.map((p) => L.PAIRS.indexOf(p)))];
    const better = (a, b) => { const ra = rank(a), rb = rank(b); for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] < rb[i]; return false; };
    let frontier = [[]];
    for (let d = 1; d <= depth; d++) {
      const next = [];
      let best = null;
      for (const set of frontier) {
        const t = Object.assign({}, base);
        for (const p of set) t[placeOf(p)] = p.mk;
        const lastIdx = set.length ? L.PAIRS.indexOf(set[set.length - 1]) : -1;
        for (const p of nextPairs({ mk: t })) {
          // each set once: grow only in course order, except along one place
          if (L.PAIRS.indexOf(p) < lastIdx && placeOf(p) !== placeOf(set[set.length - 1])) continue;
          const t2 = Object.assign({}, t);
          t2[placeOf(p)] = p.mk;
          const grown = set.concat([p]);
          if (offerableRecipes(kind, { mk: t2 }).length) { if (!best || better(grown, best)) best = grown; }
          else next.push(grown);
        }
      }
      if (best) return best.slice().sort((a, b) => L.PAIRS.indexOf(a) - L.PAIRS.indexOf(b));
      frontier = next;
    }
    return null;
  }
  // the rungs the summary names: for sale, and the player has held at least
  // half of the goods the price asks for
  function rungsInView(profile) {
    return nextPairs(profile).filter((p) => {
      const mats = Object.keys(pricePair(p) || {});
      const held = mats.filter((mat) => profile.seen[mat]).length;
      return mats.length && held * 2 >= mats.length;
    });
  }
  // a price good is in reach: held at least once, or makeable right now by
  // a machine already standing (a mine's current depth, or a recipe the
  // machine can run; deeper ore stock answers a shallower ask)
  function matInReach(profile, pinId) {
    if (profile.seen[pinId]) return true;
    const kinds = new Set();
    for (const m of profile.machines) {
      if (m.kind === 'mine') { if (matSatisfies(mineMat(profile, m), pinId)) return true; }
      else kinds.add(m.kind);
    }
    for (const k of kinds) if (offerableRecipes(k, profile).some((r) => matSatisfies(r.out, pinId))) return true;
    return false;
  }
  // machine kinds the build menu lists: ready, and any good its price asks
  // for is in reach. The smelter stands priced from the first mine, and each
  // machine placed pulls the kinds it feeds into view, so the list grows a
  // step ahead of the bag and the goods a price names are the way to it.
  function visibleKinds(profile) {
    return KIND_IDS.filter((k) => {
      const kind = KINDS[k];
      if (k === 'mine' || !kind.ready) return false;
      const price = priceMachine(k, machinesOfKind(profile, k).length + 1);
      if (!price) return false;
      return Object.keys(price).some((mat) => matInReach(profile, mat));
    });
  }
  // can this kind run a recipe now — the build row is only live when it can
  const kindLive = (kind, profile) => offerableRecipes(kind, profile).length > 0;
  // can it ever: at the whole course's keys (an authoring check)
  function kindEverLive(kind) {
    const t = {};
    for (const pl of PLACES) t[pl] = 0;
    for (const p of L.PAIRS) t[placeOf(p)] = Math.max(t[placeOf(p)], p.mk);
    return kindLive(kind, { mk: t });
  }
  // the kinds whose price goods have all been held (older callers)
  function buildableKinds(profile) {
    return visibleKinds(profile).filter((k) => Object.keys(priceMachine(k, machinesOfKind(profile, k).length + 1)).every((mat) => profile.seen[mat]));
  }

  // ---- the worlds ----
  // The maps live in js/maps/ — one file per world, each ending in
  // MAPKIT.register(...) — and load before this file. The chain is shared,
  // the ground is not: a world brings its own terrain, build sites, nodes,
  // scenery, props and spawn, and keeps its own save (engine.js). Adding a
  // world is a new file in js/maps/, a script tag, and two i18n strings.
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
    // sites that coincide with an ore node are the node's (mines stand there)
    C.SITES = cur.SITES.filter((p) => !cur.MAP.NODES.some((n) => Math.abs(n.x + 4 - p.x) <= 8 && Math.abs(n.y + 12 - p.y) <= 8));
    cur.SITES = C.SITES;
    C.SCENERY = cur.SCENERY;
    C.PROPS = cur.PROPS;
    C.WORLD_W = cur.W;
    C.WORLD_H = cur.H;
    C.SPAWN = cur.spawn;
    C.LEGACY = cur.LEGACY || {};
    // the map's own weather odds, if it declares any: cosmetic weights the sky
    // multiplies into its table, and nothing else in the game ever reads
    C.WEATHER = cur.WEATHER || null;
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
  function siteById(id) { return cur.SITES.find((p) => p.id === id); }

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
    TILE, ORES, ORE_IDS, ORE_BY_NODE, ORE_GOOD, ORE_MATS, KINDS, KIND_IDS, MATS, MAT_IDS, INGOT_IDS, RECIPES, BARS, TIER_GOOD, TUNING, PRICES,
    matOfDepth, matSatisfies, bagAvail, spendCost, mineMat, bookRecipes, autoKey, autoOn, runInLeft,
    MAPS, MAP_IDS, DEFAULT_MAP,
    oreLetters, oreMaxMk, recipesFor, recipeFor, matTier,
    priceNode, priceExtraMine, priceMk, priceAt, kindMk, priceMachine, priceAuto, priceCrossing, scaleCost, closedCrossings,
    AT_KINDS, PLACES, placeOf, mkTable, pairOf, pairBought, boughtPairs, oreMk, unlockedKeys, currentTier, nextPairs, nextPair, pricePair, newestPair, targetBar,
    alphabetOf, recipeAlphabet, recipeTilt, recipeFocus, wordPool, offerable, offerableRecipes, matExists, oreOpen, affordable, bagAdd,
    machinePos, machineFoot, machineBox, machineAnchor, nodeFace, machinesOfKind, machinesOfOre, nodeBuilt, freeSites, unbuiltNodes, visibleKinds, buildableKinds, kindLive, kindEverLive, whatUnlocks, rungsInView, starterNodes,
    useMap, currentMap, siteById, crossingOpen, regionAt,
    // per-map fields (MAP, SITES, SCENERY, PROPS, WORLD_W, WORLD_H, SPAWN, LEGACY, MAP_ID) are set by useMap
  };
  useMap(DEFAULT_MAP);
})();
