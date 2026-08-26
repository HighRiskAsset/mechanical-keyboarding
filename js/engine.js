// Skill model + adaptive content generator (tech tree v3). Global: ENGINE
//
// The engine knows kinds and grammars, never letters (invariant 5): every
// letter it touches comes from the active course's data (COURSES) or from the
// chain's alphabet functions. Profile v2: letters unlock in pairs (per ore
// Mk), the bag holds materials, machines are instances standing on plots and
// nodes.
(function () {
  'use strict';

  const L = COURSES.course();

  // One save per map and course: mk.profile.v1.<course.><mapId>. The first
  // course carries no tag, so saves made before the switch keep loading. (The
  // key kept its name across the v1 → v2 profile change; the version lives
  // inside the object.)
  const STORAGE_PREFIX = 'mk.profile.v1.';
  const LAST_MAP_KEY = 'mk.map';
  const SINGLE_KEY = 'mk.profile.v1';
  const LEGACY_KEY = 'transsib.profile.v1';
  const keyFor = (mapId) => STORAGE_PREFIX + COURSES.saveTag() + mapId;

  // Tuning constants
  const MIN_SAMPLES = 30;                    // presses before a letter can pass its gate
  const ACC_SPAN = 0.07;                     // readiness 0 at (bar.acc − span) … 1 at bar.acc
  const EW_ALPHA_LAT = 0.10;                 // exponential weight for latency
  const EW_ALPHA_ERR = 0.05;                 // exponential weight for error rate
  const MAX_LATENCY = 2000;                  // ms; longer gaps are pauses, not typing
  const WEAKNESS_BOOST = 3;                  // how strongly weak letters are over-sampled
  const NEW_LETTER_SAMPLES = 60;             // presses during which the newest pair is boosted
  const DEFAULT_BAR = { wpm: 25, acc: 0.97 };

  const C = () => window.CHAIN;

  function newLetterStats() {
    return { ewLat: null, ewErr: 0.05, n: 0, misses: 0 };
  }

  // the letters the generator can produce today — the readiness gate only
  // looks at these (punctuation seated at machines arrives with its machine
  // in later build phases). Which marks ride mine rungs is the course's
  // call (invariant 5): the course file declares them in MINE_MARKS — RU
  // seats the period and dash on the oil derrick (the fallback), EN the
  // period, comma, semicolon and apostrophe on their own fingers' rungs.
  const TRAINABLE_PUNCT = new Set(L.MINE_MARKS || ['.', '-']);
  const trainable = (ch) => !L.PUNCT.has(ch) || TRAINABLE_PUNCT.has(ch);

  // ---------- profile ----------
  function starterMachines() {
    const machines = [];
    let id = 1;
    for (const s of C().starterNodes()) machines.push({ id: 'm' + (id++), kind: 'mine', ore: s.ore, node: s.index, face: C().nodeFace(s.index), auto: false });
    return { machines, nextId: id };
  }
  function tier0Pairs() {
    let n = 0;
    while (n < L.PAIRS.length && L.PAIRS[n].tier === 0) n++;
    return n;
  }
  // a fresh save's Mk table: the pre-built mines' keys, nothing else
  function tier0Mk() {
    return C().mkTable({ pairsUnlocked: tier0Pairs() });
  }
  function defaultProfile(mapId) {
    const letters = {};
    for (const ch of L.UNLOCK_ORDER) letters[ch] = newLetterStats();
    const sm = starterMachines();
    return {
      version: 3,
      map: mapId,
      createdAt: Date.now(),
      savedAt: null,
      mk: tier0Mk(),     // place (ore or key-selling kind) → Mk level bought there
      letters,
      totalActiveMs: 0,
      totalChars: 0,
      totalErrors: 0,
      unlockLog: [],     // {keys, at}
      km: 0,
      nightBlocks: 0,
      collected: {},     // word → {n, clean, at} — the passport
      bag: {},           // material id → count
      seen: {},          // material id → true once held (progressive reveal)
      machines: sm.machines, // {id, kind, ore?, node?|plot?, auto, recipe?}
      nextMachineId: sm.nextId,
      drops: [],         // loose materials on the ground: {id, mat, n, x, y}
      nextDropId: 1,
      crossings: {},     // crossing id → true once repaired (bought at the place)
      heavy: 0,          // heavy modules toward the finish
    };
  }

  // ---- v1 → v2 migration (one-shot, on load) ----
  // A v1 save's unlockedCount indexes the course's pre-v3 order (course data).
  const V1_ORDER = L.LEGACY_ORDER || L.UNLOCK_ORDER;
  // KEYS on the left of these two tables are what a v1 SAVE FILE says, so they
  // keep the pre-v3 names for ever — they are read off disk, not written. The
  // values are current ids and move with the rename (2026-08-26).
  const V1_MATS = { az: 'iron', buki: 'copper', vedi: 'quartz', slogi: 'bronze', slova: 'parts', stroki: 'modules' };
  // v1 STATION ids, which merely looked like material ids. `CHAIN.LEGACY` on
  // each map is keyed by these same station ids and is legacy for the same
  // reason (js/maps/frontier.js).
  const V1_KIT_KIND = { slogi: 'smelter', slova: 'constructor', stroki: 'foundry' };
  function migrateV1(p, mapId) {
    const q = defaultProfile(mapId);
    q.createdAt = p.createdAt || q.createdAt;
    q.savedAt = typeof p.savedAt === 'number' ? p.savedAt : null;
    // letters: keep every stat; make sure every v3 key exists
    q.letters = p.letters || {};
    for (const ch of L.UNLOCK_ORDER) if (!q.letters[ch]) q.letters[ch] = newLetterStats();
    // pairs: unlocked while every key of the pair was unlocked in v1
    const had = new Set(V1_ORDER.slice(0, p.unlockedCount || 0));
    let n = 0;
    while (n < L.PAIRS.length && L.PAIRS[n].keys.every((k) => had.has(k) || (L.PAIRS[n].at && !C().KINDS[L.PAIRS[n].at].ready))) n++;
    q.mk = C().mkTable({ pairsUnlocked: Math.max(tier0Pairs(), n) });
    for (const k of ['totalActiveMs', 'totalChars', 'totalErrors', 'km', 'nightBlocks']) q[k] = typeof p[k] === 'number' ? p[k] : 0;
    q.unlockLog = Array.isArray(p.unlockLog) ? p.unlockLog : [];
    q.collected = p.collected || {};
    // a v1 save past its first edition had the first crossing open
    if ((p.milestoneIdx || 0) >= 4) q.crossings.x1 = true;
    // the bag
    for (const [k, v] of Object.entries(p.mats || {})) if (V1_MATS[k] && v > 0) q.bag[V1_MATS[k]] = v;
    for (const k of Object.keys(q.bag)) q.seen[k] = true;
    // machines: starter mines carry the old bench automation; kit stations
    // become instances on the plots they stood on
    for (const m of q.machines) {
      // m.ore is a CURRENT id (it is on `q`); p.autoBench is a v1 save's own
      // table and stays spelled the v1 way
      if (m.ore === 'iron' && p.autoBench && p.autoBench.az) m.auto = true;
      if (m.ore === 'copper' && p.autoBench && p.autoBench.buki) m.auto = true;
    }
    if (C().oreOpen(q, 'quartz')) {
      const node = C().unbuiltNodes(q).find((nd) => nd.ore === 'quartz');
      if (node) q.machines.push({ id: 'm' + (q.nextMachineId++), kind: 'mine', ore: 'quartz', node: node.index, face: C().nodeFace(node.index), auto: !!(p.autoBench && p.autoBench.vedi) });
    }
    const built = p.built || {}, plots = p.plots || {};
    for (const [stId, kind] of Object.entries(V1_KIT_KIND)) {
      if (!built[stId]) continue;
      const free = C().freePlots(q);
      const want = plots[stId] || C().LEGACY[stId];
      const plot = free.find((pl) => pl.id === want) || free[0];
      if (!plot) continue;
      q.machines.push({ id: 'm' + (q.nextMachineId++), kind, plot: plot.id, auto: false });
    }
    return q;
  }

  // v2 forward-compat: fill anything a newer build added
  function normalize(p, mapId) {
    p.map = mapId;
    if (typeof p.savedAt !== 'number') p.savedAt = null;
    for (const ch of L.UNLOCK_ORDER) if (!p.letters[ch]) p.letters[ch] = newLetterStats();
    // the ladder branched (2026-08-22): a save from before carries a count
    // along the course order; it becomes a Mk level per place, once
    if (!p.mk || typeof p.mk !== 'object') p.mk = C().mkTable(typeof p.pairsUnlocked === 'number' ? { pairsUnlocked: p.pairsUnlocked } : { pairsUnlocked: tier0Pairs() });
    const t0 = tier0Mk();
    for (const pl of C().PLACES) if (typeof p.mk[pl] !== 'number') p.mk[pl] = t0[pl] || 0;
    delete p.pairsUnlocked;
    for (const k of ['totalActiveMs', 'totalChars', 'totalErrors', 'km', 'nightBlocks', 'heavy']) if (typeof p[k] !== 'number') p[k] = 0;
    if (!Array.isArray(p.unlockLog)) p.unlockLog = [];
    if (!p.collected) p.collected = {};
    if (!p.bag) p.bag = {};
    if (!p.seen) p.seen = {};
    if (!p.crossings) p.crossings = {};
    // a save from before the cap (2026-08-22) spills its surplus onto the
    // ground at the spawn, once — clamping would be theft. The piles lie
    // where the operator lands and never expire.
    const bagCap = C().TUNING.BAG_CAP;
    if (!Array.isArray(p.drops)) p.drops = [];
    if (typeof p.nextDropId !== 'number') p.nextDropId = 1;
    let spillN = 0;
    for (const [k, v] of Object.entries(p.bag)) {
      if (v > bagCap) {
        const over = v - bagCap;
        p.bag[k] = bagCap;
        const sp = C().SPAWN || { x: 100, y: 100 };
        p.drops.push({ id: 'd' + (p.nextDropId++), mat: k, n: over, x: sp.x + 14 + (spillN % 5) * 9, y: sp.y + 10 + Math.floor(spillN / 5) * 8 });
        spillN++;
      }
      if (v > 0) p.seen[k] = true;
    }
    if (!Array.isArray(p.machines) || !p.machines.length) {
      const sm = starterMachines();
      p.machines = sm.machines; p.nextMachineId = sm.nextId;
    }
    if (typeof p.nextMachineId !== 'number') p.nextMachineId = p.machines.length + 1;
    // a machine on a node this map doesn't have (map data changed) is re-homed
    // to the first unbuilt node of its ore, else dropped
    for (const m of p.machines.slice()) {
      if (m.kind !== 'mine') continue;
      const n = C().MAP.NODES[m.node];
      if (n && C().ORE_BY_NODE[n.kind] === m.ore) continue;
      const alt = C().unbuiltNodes(p).find((nd) => nd.ore === m.ore);
      if (alt) { m.node = alt.index; m.face = C().nodeFace(alt.index); delete m.at; } else p.machines.splice(p.machines.indexOf(m), 1);
    }
    // a mine whose seam moved under it (the map was re-laid) is stood back
    // on its vein: a mine only makes sense on the tiles the ore is in, so
    // the seat goes and it is taken again from the node, at the facing the
    // seam is bedded at
    for (const m of p.machines) {
      if (m.kind !== 'mine' || m.node === undefined || m.node === null || !Array.isArray(m.at)) continue;
      const v = MAPKIT.veinBox(C().MAP.NODES[m.node]);
      const b = C().machineBox(m);
      if (b.c0 > v.c1 || b.c1 < v.c0 || b.r0 > v.r1 || b.r1 < v.r0) { m.face = C().nodeFace(m.node); delete m.at; }
    }
    // the starter ores always have their first mine
    for (const s of C().starterNodes()) {
      if (!p.machines.some((m) => m.kind === 'mine' && m.ore === s.ore)) {
        p.machines.push({ id: 'm' + (p.nextMachineId++), kind: 'mine', ore: s.ore, node: s.index, face: C().nodeFace(s.index), auto: false });
      }
    }
    if (window.SIM) SIM.ensure(p);   // buffers, belts, the clock, the facing (phase 3)
    // ⚙ went per-recipe with the deep-ore ledger (2026-08-22): a save from
    // before carries one `auto` flag per machine — it becomes that machine's
    // engine for the work it is doing right now, once
    for (const m of p.machines) {
      if (m.auto !== true) { delete m.auto; continue; }
      const key = m.kind === 'mine' ? C().mineMat(p, m) : (window.SIM ? C().autoKey(m, SIM.recipeOf(p, m), p) : null);
      if (key) { if (!m.autoOn) m.autoOn = {}; m.autoOn[key] = true; }
      delete m.auto;
    }
    if (window.DROPS) DROPS.ensure(p);   // goods lying on the ground; they never expire
    // machines stand on tiles now (rotation overhaul, 2026-08-21): a machine
    // from before carries a plot or node anchor and no `at` — seat it there
    // once, at the facing sim.js migrated off its old rot
    for (const m of p.machines) {
      if (Array.isArray(m.at) && m.at.length === 2) continue;
      const b = C().machineBox(m);   // the anchor fallback path
      m.at = [b.c0, b.r0];
    }
    return p;
  }

  function rawFor(mapId) {
    let raw = localStorage.getItem(keyFor(mapId));
    if (mapId === C().DEFAULT_MAP) {
      for (const k of [SINGLE_KEY, LEGACY_KEY]) {
        const old = localStorage.getItem(k);
        if (!old) continue;
        if (!raw) { raw = old; localStorage.setItem(keyFor(mapId), old); }
        localStorage.removeItem(k);
      }
    }
    return raw;
  }
  function fresh(mapId) { return normalize(defaultProfile(mapId), mapId); }

  // ---- v2 → v3 migration (one-shot, on load) ----
  // The material ids stopped being the pre-v3 transliterations on 2026-08-26
  // (`az` → `iron`, `slogi` → `bronze`, …) so the chain reads in the same
  // words the map, the art and the design doc use. Those ids are SAVE KEYS,
  // so a v2 profile has to be rewritten rather than reinterpreted: rename it
  // everywhere it is spelled and nothing is lost — a world in progress keeps
  // its bag, its buffers, its belts and its automation.
  //
  // Every place a material id is written down, and there are more of them
  // than there look to be:
  //   bag / seen            keys
  //   mk                    keys (ore places; machine places are kind ids)
  //   machines[].ore        the ore a mine stands on
  //   machines[].recipe     a material id
  //   machines[].recipeIn   JSON of a recipe's inputs — ids inside a string
  //   machines[].buf.in/out keys
  //   machines[].autoOn     keys: an ore id, or "out|{inputs}" per recipe
  //   machines[].handMade   the same key shape as autoOn
  //   belts[].items[].mat   goods in flight
  //   drops[].mat           goods on the ground
  const V2_MATS = {
    az: 'iron', az2: 'iron2',
    buki: 'copper', buki2: 'copper2',
    vedi: 'quartz', vedi2: 'quartz2', vedi3: 'quartz3',
    slogi: 'bronze', slova: 'parts', stroki: 'modules',
  };
  const v3mat = (id) => V2_MATS[id] || id;
  const v3keys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[v3mat(k)] = v;
    return out;
  };
  // "out|{"az":2,"buki":1}" → "bronze|{"iron":2,"copper":1}". The inputs keep
  // their order, and the renamed RECIPES keep theirs, so the rebuilt key is
  // the one CHAIN.autoKey will ask for.
  function v3autoKey(key) {
    if (typeof key !== 'string') return key;
    const bar = key.indexOf('|');
    if (bar < 0) return v3mat(key);                 // a mine's key: a material id
    const out = v3mat(key.slice(0, bar));
    try {
      return out + '|' + JSON.stringify(v3keys(JSON.parse(key.slice(bar + 1))));
    } catch {
      return out + '|' + key.slice(bar + 1);        // unparseable: leave the tail be
    }
  }
  function migrateV2(p) {
    const q = Object.assign({}, p, { version: 3 });
    q.bag = v3keys(p.bag);
    q.seen = v3keys(p.seen);
    q.mk = v3keys(p.mk);                            // ore places rename; kind places do not
    q.machines = (p.machines || []).map((m) => {
      const n = Object.assign({}, m);
      if (n.ore) n.ore = v3mat(n.ore);
      if (n.recipe) n.recipe = v3mat(n.recipe);
      if (n.recipeIn) { try { n.recipeIn = JSON.stringify(v3keys(JSON.parse(n.recipeIn))); } catch { /* leave it */ } }
      if (n.buf) n.buf = { in: v3keys(n.buf.in), out: v3keys(n.buf.out) };
      if (n.autoOn) { const a = {}; for (const [k, v] of Object.entries(n.autoOn)) a[v3autoKey(k)] = v; n.autoOn = a; }
      if (n.handMade) { const h = {}; for (const [k, v] of Object.entries(n.handMade)) h[v3autoKey(k)] = v; n.handMade = h; }
      return n;
    });
    q.belts = (p.belts || []).map((b) => Object.assign({}, b, {
      items: (b.items || []).map((it) => Object.assign({}, it, { mat: v3mat(it.mat) })),
    }));
    q.drops = (p.drops || []).map((d) => Object.assign({}, d, { mat: v3mat(d.mat) }));
    return q;
  }

  function loadProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return fresh(mapId);
      const p = JSON.parse(raw);
      if (p.version === 1) return normalize(migrateV1(p, mapId), mapId);   // migrateV1 already writes current ids
      if (p.version === 2) return normalize(migrateV2(p), mapId);
      if (p.version !== 3) return fresh(mapId);
      return normalize(p, mapId);
    } catch {
      return fresh(mapId);
    }
  }
  // import: a raw profile object (v1, v2 or v3) → a normalized v3 for a map
  function adoptProfile(p, mapId) {
    if (p.version === 1) return normalize(migrateV1(p, mapId), mapId);   // migrateV1 already writes current ids
    if (p.version === 2) return normalize(migrateV2(p), mapId);
    return normalize(p, mapId);
  }

  // a look at a map's save without adopting it (the picker's progress line)
  function peekProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (p.version === 1) {
        return { letters: p.unlockedCount || 0, machines: 3 + Object.keys(p.built || {}).length, totalChars: p.totalChars || 0, savedAt: typeof p.savedAt === 'number' ? p.savedAt : null };
      }
      if (p.version !== 2 && p.version !== 3) return null;
      const letters = C().unlockedKeys({ mk: p.mk, pairsUnlocked: p.pairsUnlocked }).length;
      return {
        letters, machines: (p.machines || []).length,
        totalChars: p.totalChars || 0,
        savedAt: typeof p.savedAt === 'number' ? p.savedAt : null,
      };
    } catch {
      return null;
    }
  }

  function saveProfile(p) {
    p.savedAt = Date.now();
    localStorage.setItem(keyFor(p.map), JSON.stringify(p));
  }
  function resetProfile(mapId) {
    localStorage.removeItem(keyFor(mapId));
    return fresh(mapId);
  }
  function getLastMap() {
    try {
      const id = localStorage.getItem(LAST_MAP_KEY);
      return id && C().MAPS[id] ? id : null;
    } catch { return null; }
  }
  function setLastMap(mapId) {
    try { localStorage.setItem(LAST_MAP_KEY, mapId); } catch { /* non-fatal */ }
  }

  // ---------- the curriculum ----------
  const unlockedLetters = (p) => C().unlockedKeys(p);
  const nextPair = (p) => C().nextPair(p);

  // Readiness ∈ [0, ~1.25] against a bar {wpm, acc}: min of speed score,
  // accuracy score, sample fill. Passes at ≥ 1.
  function readiness(p, ch, bar) {
    const s = p.letters[statChar(ch)];
    if (!s || s.n === 0) return 0;
    bar = bar || C().targetBar(p) || DEFAULT_BAR;
    const targetLat = 12000 / bar.wpm;
    const acc = 1 - s.ewErr;
    const accScore = clamp((acc - (bar.acc - ACC_SPAN)) / ACC_SPAN, 0, 1.25);
    const speedScore = s.ewLat === null ? 0 : clamp(targetLat / s.ewLat, 0, 1.25);
    const fill = Math.min(1, s.n / MIN_SAMPLES);
    return Math.min(accScore, speedScore, fill);
  }
  // a capital letter's skill lives on its lowercase stat — the reach is the
  // same finger; Shift is the only addition
  const statChar = (ch) => (typeof ch === 'string' ? ch.toLowerCase() : ch);
  function recordHit(p, ch, latencyMs) {
    const s = p.letters[statChar(ch)];
    if (!s) return;
    s.n++;
    if (latencyMs !== null && latencyMs > 0 && latencyMs <= MAX_LATENCY) {
      s.ewLat = s.ewLat === null ? latencyMs : s.ewLat + EW_ALPHA_LAT * (latencyMs - s.ewLat);
    }
    s.ewErr = s.ewErr + EW_ALPHA_ERR * (0 - s.ewErr);
  }
  function recordMiss(p, ch) {
    const s = p.letters[statChar(ch)];
    if (!s) return;
    s.misses++;
    s.ewErr = s.ewErr + EW_ALPHA_ERR * (1 - s.ewErr);
  }
  // unlock a rung — the purchase that pays for it is the only gate
  // (progress is what you type and spend; accuracy and speed are measured
  // for the player, never a lock). The rung must be the next level at its
  // place; the ladder branches between places, never within one.
  function unlockPair(p, pair) {
    if (!pair) return null;
    const place = C().placeOf(pair);
    if ((p.mk[place] || 0) + 1 !== pair.mk) return null;
    p.mk[place] = pair.mk;
    p.unlockLog.push({ keys: pair.keys, at: Date.now() });
    return pair;
  }
  // older callers: the course-order next rung
  const unlockNextPair = (p) => unlockPair(p, nextPair(p));

  // ---------- content generation ----------
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  // Sampling weight: corpus frequency × weakness boost (+ newest-pair boost,
  // × ratio tilt when given — variance only, capped).
  function letterWeight(p, ch, tilt) {
    const weak = 1 - clamp(readiness(p, ch), 0, 1);
    let w = (L.LETTER_FREQ[ch] || 0.5) * (1 + WEAKNESS_BOOST * weak);
    const s = p.letters[ch];
    const last = C().newestPair(p);
    if (last && last.keys.includes(ch) && s && s.n < NEW_LETTER_SAMPLES) w *= 4;
    if (tilt && tilt[ch]) w *= tilt[ch];
    return w;
  }
  function weightedPick(items, weightFn) {
    let total = 0;
    const ws = items.map((it) => { const w = weightFn(it); total += w; return w; });
    if (total <= 0) return items[Math.floor(Math.random() * items.length)];
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  const isLetter = (ch) => !L.PUNCT.has(ch);
  const isVowel = (ch) => L.VOWELS.has(ch);
  const SEMIS = L.SEMIS || new Set();
  const isCons = (ch) => isLetter(ch) && !isVowel(ch) && !SEMIS.has(ch);
  // the course's semi-letters that may close a syllable: a soft sign
  // (attaches after a consonant) and a glide (stands as a coda) — taken as
  // the first and last of SEMIS in the order the course lists them
  const SEMI_LIST = [...SEMIS];
  const SOFT = SEMI_LIST[0], GLIDE = SEMI_LIST[SEMI_LIST.length - 1];

  // Pseudo-word obeying loose phonotactics, from an alphabet.
  function pseudoWord(p, alpha, tilt) {
    const vowels = alpha.filter(isVowel);
    const cons = alpha.filter(isCons);
    const hasSoft = !!SOFT && alpha.includes(SOFT);
    const hasJ = !!GLIDE && GLIDE !== SOFT && alpha.includes(GLIDE);
    if (vowels.length === 0) {
      // no vowel yet: short consonant runs
      const n = 2 + Math.floor(Math.random() * 2);
      let w = '';
      for (let i = 0; i < n; i++) w += weightedPick(cons.length ? cons : alpha, (c) => letterWeight(p, c, tilt));
      return w;
    }
    const pickV = () => weightedPick(vowels, (c) => letterWeight(p, c, tilt));
    const pickC = () => weightedPick(cons, (c) => letterWeight(p, c, tilt));
    const sylCount = Math.random() < 0.25 ? 1 : Math.random() < 0.65 ? 2 : 3;
    let word = '';
    for (let i = 0; i < sylCount; i++) {
      let onset = cons.length > 0 && Math.random() < 0.85 ? pickC() : '';
      for (let t = 0; t < 3 && onset && onset === word[word.length - 1]; t++) onset = pickC();
      if (onset === word[word.length - 1]) onset = '';
      let nucleus = pickV();
      for (let t = 0; t < 3 && nucleus === (onset || word[word.length - 1]); t++) nucleus = pickV();
      let coda = '';
      if (Math.random() < 0.35) {
        if (hasJ && Math.random() < 0.2) coda = GLIDE;
        else if (cons.length > 0) {
          coda = pickC();
          if (coda === nucleus || coda === onset) coda = '';
          else if (coda && hasSoft && Math.random() < 0.25) coda += SOFT;
        }
      }
      word += onset + nucleus + coda;
    }
    if (word.length < 2) word += cons.length > 0 ? pickC() + pickV() : pickV();
    return word;
  }

  // Real words typeable with an alphabet.
  function realWordPool(alpha) {
    const set = new Set(alpha);
    return L.WORDS.filter(([w]) => [...w].every((c) => set.has(c)));
  }
  function realWordWeight(p, entry, tilt) {
    const [w] = entry;
    let sum = 0;
    for (const c of w) sum += letterWeight(p, c, tilt);
    return sum / w.length + w.length * 0.3;
  }

  // syllables from the course table that fit an alphabet
  function syllablePool(alpha) {
    const set = new Set(alpha);
    return L.SYLLABLES.filter(([s]) => [...s].every((c) => set.has(c)));
  }
  function syllableItem(p, alpha, tilt, pool) {
    if (!pool.length) return pseudoWord(p, alpha, tilt);
    const pick = () => weightedPick(pool, ([s, f]) => f * (1 + [...s].reduce((a, c) => a + letterWeight(p, c, tilt), 0) / (s.length * 10)))[0];
    // mostly single syllables; sometimes two joined into a word-shape
    if (Math.random() < 0.3) {
      const a = pick(); let b = pick();
      for (let t = 0; t < 3 && b[0] === a[a.length - 1]; t++) b = pick();
      return a + b;
    }
    return pick();
  }
  // a 2-syllable pseudo-word carrying a consonant cluster the alphabet allows
  function clusterItem(p, alpha, tilt) {
    const set = new Set(alpha);
    const clusters = L.CLUSTERS.filter((cl) => [...cl].every((c) => set.has(c)));
    const vowels = alpha.filter(isVowel);
    if (!clusters.length || !vowels.length) return pseudoWord(p, alpha, tilt);
    const cl = clusters[Math.floor(Math.random() * clusters.length)];
    const v = () => weightedPick(vowels, (c) => letterWeight(p, c, tilt));
    const cons = alpha.filter(isCons);
    const c = () => (cons.length ? weightedPick(cons, (x) => letterWeight(p, x, tilt)) : '');
    const shapes = [
      () => cl + v() + c() + v(),        // CCV-CV
      () => v() + cl + v(),              // V-CCV
      () => c() + v() + cl + v(),        // CV-CCV
      () => cl + v() + c(),              // CCVC
      () => c() + v() + cl + v() + c(),  // CV-CCVC
    ];
    return shapes[Math.floor(Math.random() * shapes.length)]();
  }
  // Mk1 position drill: single keys, sometimes doubled, over a tiny alphabet
  function keysItem(p, alpha, tilt) {
    const letters = alpha.filter(isLetter);
    const pick = () => weightedPick(letters.length ? letters : alpha, (c) => letterWeight(p, c, tilt));
    const r = Math.random();
    if (r < 0.55) return pick();
    if (r < 0.85) { const a = pick(); let b = pick(); if (b === a && letters.length > 1) b = pick(); return a + b; }
    return pick() + pick() + pick();
  }

  // ---- the Molder's grammar: ending families in frames ----
  // A family (keyed by the flux ore) lists affixes in the course's notation:
  // a leading dash marks a suffix (carried anywhere after the first letter),
  // a trailing dash a prefix. Items are real words
  // of the alphabet that carry one of the family's affixes; when that pool
  // is thin, a pseudo-stem wears the affix instead.
  function affixOf(a) {
    if (a.endsWith('-') && !a.startsWith('-')) return { kind: 'prefix', s: a.slice(0, -1) };
    return { kind: 'suffix', s: a.replace(/^-/, '').replace(/-$/, '') };
  }
  function familyAffixes(alpha, family) {
    const set = new Set(alpha);
    return (L.ENDINGS[family] || []).map(affixOf).filter((x) => [...x.s].every((c) => set.has(c)));
  }
  const carries = (w, x) => (x.kind === 'prefix' ? w.startsWith(x.s) && w.length > x.s.length : w.indexOf(x.s, 1) >= 0);
  function endingPool(alpha, family) {
    const affixes = familyAffixes(alpha, family);
    if (!affixes.length) return [];
    return realWordPool(alpha).filter(([w]) => affixes.some((x) => carries(w, x)));
  }
  function endingItem(p, alpha, tilt, family) {
    const affixes = familyAffixes(alpha, family);
    if (!affixes.length) return pseudoWord(p, alpha, tilt);
    const x = affixes[Math.floor(Math.random() * affixes.length)];
    const vowels = alpha.filter(isVowel), cons = alpha.filter(isCons);
    if (!vowels.length || !cons.length) return pseudoWord(p, alpha, tilt);
    const v = () => weightedPick(vowels, (c) => letterWeight(p, c, tilt));
    const c = () => weightedPick(cons, (k) => letterWeight(p, k, tilt));
    // a 1–2 syllable stem; the join never doubles a letter
    let stem = c() + v();
    if (Math.random() < 0.5) stem += c() + v();
    if (x.kind === 'prefix') {
      if (stem[0] === x.s[x.s.length - 1]) stem = c() + stem.slice(1);
      return x.s + stem;
    }
    if (isVowel(x.s[0])) stem = stem.replace(/[^]$/, '');   // suffix opens with a vowel: stem closes on a consonant
    else if (Math.random() < 0.4) stem += c();
    if (stem[stem.length - 1] === x.s[0]) stem = stem.slice(0, -1);
    return stem + x.s;
  }

  // ---- phrases (the Assembler) and sentences (the Fastener) ----
  // Both lists are [text, gloss]; a text fits when every letter is in the
  // alphabet and, for sentences, every mark it carries is unlocked too.
  const textLetters = (s) => [...s].filter((c) => c !== ' ');
  function phrasePool(alpha) {
    const set = new Set(alpha);
    return (L.PHRASES || []).filter(([s]) => textLetters(s).every((c) => set.has(c)));
  }
  function sentencePool(alpha) {
    const set = new Set(alpha);
    return (L.SENTENCES || []).filter(([s]) => textLetters(s).every((c) => set.has(c)));
  }
  // a phrase or sentence as drill entries: one per word, trailing marks on
  // the word as `punct`, the gloss on the last word
  function textEntries(text, gloss) {
    const out = [];
    for (const tok of text.split(' ')) {
      if (!tok) continue;
      const m = tok.match(/^(.*?)([.,?!:;"()-]*)$/u);
      const core = m ? m[1] : tok, marks = m ? m[2] : '';
      if (!core) { if (out.length) out[out.length - 1].punct = (out[out.length - 1].punct || '') + marks; continue; }
      out.push({ text: core, gloss: null, punct: marks || undefined });
    }
    if (out.length) out[out.length - 1].gloss = gloss || null;
    return out;
  }
  // proper names (the Crane sprinkles them into capital drills): a name fits
  // when its lowercase letters are unlocked — Shift arrives with the Crane
  function namePool(alpha) {
    const set = new Set(alpha);
    return (L.NAMES || []).filter(([w]) => [...w.toLowerCase()].every((c) => set.has(c)));
  }
  // pages (the Manufacturer): real paragraphs, graded by length and mark
  // density. A page fits when its letters (case-folded) and marks fit.
  function pageGrade(s) {
    let marks = 0;
    for (const c of s) if (L.PUNCT.has(c)) marks++;
    return s.length + marks * 12;
  }
  function pagePool(alpha) {
    const set = new Set(alpha);
    const fits = (s) => [...s].every((c) => c === ' ' || set.has(c) || set.has(c.toLowerCase()));
    return (L.PAGES || []).filter(([s]) => fits(s)).sort((a, b) => pageGrade(a[0]) - pageGrade(b[0]));
  }
  function textWeight(p, text, tilt) {
    let sum = 0, k = 0;
    for (const c of text) { if (c === ' ') continue; sum += letterWeight(p, c, tilt); k++; }
    return k ? sum / k + 0.2 : 0.2;
  }

  // Generate one drill line: array of {text, gloss|null, punct?}.
  // opts: {mode, alphabet, tilt, count, family}. mode: 'keys' | 'letters' |
  // 'syllables' | 'clusters' | 'words' | 'endings' | 'phrases' | 'punct' |
  // 'lines' (legacy full mix). family: the ending family (an ore id) for
  // the endings mode.
  function generateLine(p, opts) {
    opts = opts || {};
    const mode = opts.mode || 'lines';
    const alpha = (opts.alphabet && opts.alphabet.length ? opts.alphabet : unlockedLetters(p)).slice();
    const letters = alpha.filter(isLetter);
    const pool = realWordPool(letters);
    // ratio tilt is variance only: off when the pool is small (words) — and
    // never a filter (the pool above is the full union)
    const tilt = (mode === 'words' && pool.length < C().TUNING.RATIO_MIN_POOL) ? null : capTilt(opts.tilt);
    const wordCount = opts.count || (mode === 'keys' ? 9 : mode === 'syllables' ? 8 : mode === 'phrases' ? 8 : mode === 'punct' ? 10 : 7);
    // phrases and sentences: whole texts from the course lists, filled out
    // with real words when the pool is thin
    if (mode === 'pages') {
      // one page per line, easiest fitting pages favoured
      const pgs = pagePool(alpha);
      if (!pgs.length) return generateLine(p, { ...opts, mode: 'punct' });
      const pick = pgs[Math.floor(Math.random() * Math.min(5, pgs.length))];
      return textEntries(pick[0], pick[1]);
    }
    if (mode === 'phrases' || mode === 'punct' || mode === 'capitals') {
      const texts = mode === 'phrases' ? phrasePool(alpha) : sentencePool(alpha);
      const out = [];
      let lastText = null, guard = 0;
      while (out.length < wordCount && guard++ < 12) {
        if (texts.length >= 3 && Math.random() < (texts.length >= 10 ? 0.9 : 0.6)) {
          let cand = weightedPick(texts, ([s]) => textWeight(p, s, tilt));
          for (let tries = 0; tries < 4 && cand[0] === lastText; tries++) cand = weightedPick(texts, ([s]) => textWeight(p, s, tilt));
          lastText = cand[0];
          out.push(...textEntries(cand[0], cand[1]));
        } else if (pool.length) {
          const cand = weightedPick(pool, (e) => realWordWeight(p, e, tilt));
          out.push({ text: cand[0], gloss: cand[1], set: cand[2] });
        } else {
          out.push({ text: pseudoWord(p, letters, tilt), gloss: null });
        }
      }
      // sentences end in a mark; a fill-in run of words gets the period
      if (mode !== 'phrases' && out.length && !out[out.length - 1].punct && alpha.includes('.')) out[out.length - 1].punct = '.';
      // the Crane: sentence-initial capitals, and names where they fit
      if (mode === 'capitals' && out.length) {
        const names = namePool(letters);
        const capFirst = (w) => w.charAt(0).toUpperCase() + w.slice(1);
        let boundary = true;
        for (const e of out) {
          if (boundary) e.text = capFirst(e.text);
          boundary = !!(e.punct && /[.!?]/.test(e.punct));
          if (names.length && !boundary && Math.random() < 0.12) {
            const nm = names[Math.floor(Math.random() * names.length)];
            e.text = nm[0]; e.gloss = nm[1];
          }
        }
      }
      return out;
    }
    const famPool = mode === 'endings' ? endingPool(letters, opts.family) : null;
    let pReal = pool.length >= 40 ? 0.6 : pool.length >= 15 ? 0.45 : pool.length >= 5 ? 0.3 : 0.1;
    if (mode === 'keys') pReal = 0;
    if (mode === 'letters') pReal = Math.min(pReal, 0.15);
    if (mode === 'syllables') pReal = pool.length >= 5 ? 0.12 : 0;
    if (mode === 'clusters') pReal = pool.length >= 10 ? 0.3 : 0.1;
    if (mode === 'words') pReal = pool.length >= 5 ? 0.95 : pReal;
    if (mode === 'endings') pReal = famPool.length >= 8 ? 0.7 : famPool.length >= 3 ? 0.45 : 0;
    const sylPool = mode === 'syllables' ? syllablePool(letters) : null;
    const words = [];
    let lastText = null;
    for (let i = 0; i < wordCount; i++) {
      let entry = null;
      const src = mode === 'endings' ? famPool : pool;
      if (src.length > 0 && Math.random() < pReal) {
        for (let tries = 0; tries < 4; tries++) {
          const cand = weightedPick(src, (e) => realWordWeight(p, e, tilt));
          if (cand[0] !== lastText) { entry = { text: cand[0], gloss: cand[1], set: cand[2] }; break; }
        }
      }
      if (!entry) {
        let text;
        if (mode === 'keys') text = keysItem(p, letters, tilt);
        else if (mode === 'syllables') text = syllableItem(p, letters, tilt, sylPool);
        else if (mode === 'clusters') text = clusterItem(p, letters, tilt);
        else if (mode === 'endings') text = endingItem(p, letters, tilt, opts.family);
        else text = pseudoWord(p, letters, tilt);
        for (let t = 0; t < 3 && text === lastText; t++) text = mode === 'keys' ? keysItem(p, letters, tilt) : pseudoWord(p, letters, tilt);
        entry = { text, gloss: null };
      }
      lastText = entry.text;
      words.push(entry);
    }
    // the trainable punctuation the alphabet holds (the period arrives as a
    // mined key): appended after items, never inside them
    const weaknessOf = (ch) => 1 - clamp(readiness(p, ch), 0, 1);
    if (alpha.includes(',') && mode !== 'keys') {
      const pComma = Math.min(0.35, 0.12 * (1 + 2 * weaknessOf(',')));
      for (let i = 0; i < words.length - 1; i++) if (Math.random() < pComma) words[i].punct = ',';
    }
    if (alpha.includes('.')) {
      const pMid = Math.min(0.3, 0.1 * (1 + 2 * weaknessOf('.')));
      for (let i = 0; i < words.length - 1; i++) if (!words[i].punct && Math.random() < pMid) words[i].punct = '.';
      if (Math.random() < 0.85) words[words.length - 1].punct = '.';
    }
    // the dash stands alone between words, a space each side (the Russian
    // clause dash; the glyph rides the Minus key — see DESIGN.md, Course
    // exceptions). Only where prose would carry one: words and endings,
    // never syllables.
    if (alpha.includes('-') && (mode === 'words' || mode === 'endings')) {
      const pDash = Math.min(0.18, 0.06 * (1 + 2 * weaknessOf('-')));
      for (let i = words.length - 2; i >= 1; i--) {
        if (!words[i - 1].punct && words[i - 1].text !== '-' && Math.random() < pDash) words.splice(i, 0, { text: '-', gloss: null });
      }
    }
    return words;
  }
  function capTilt(t) {
    if (!t) return null;
    const cap = C().TUNING.RATIO_TILT_CAP;
    const vals = Object.values(t);
    if (!vals.length) return null;
    const lo = Math.min(...vals);
    const out = {};
    for (const [k, v] of Object.entries(t)) out[k] = Math.min(cap, v / lo);
    return out;
  }

  window.ENGINE = {
    MIN_SAMPLES, MAX_LATENCY,
    loadProfile, saveProfile, resetProfile, peekProfile, adoptProfile, getLastMap, setLastMap,
    unlockedLetters, nextPair, readiness, unlockPair, unlockNextPair, trainable,
    recordHit, recordMiss,
    generateLine, realWordPool, endingPool, phrasePool, sentencePool, namePool, pagePool,
  };
})();
