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
  // looks at these (comma and the deeper punctuation arrive with their
  // machines in later build phases)
  const TRAINABLE_PUNCT = new Set(['.']);
  const trainable = (ch) => !L.PUNCT.has(ch) || TRAINABLE_PUNCT.has(ch);

  // ---------- profile ----------
  function starterMachines() {
    const machines = [];
    let id = 1;
    for (const s of C().starterNodes()) machines.push({ id: 'm' + (id++), kind: 'mine', ore: s.ore, node: s.index, auto: false });
    return { machines, nextId: id };
  }
  function tier0Pairs() {
    let n = 0;
    while (n < L.PAIRS.length && L.PAIRS[n].tier === 0) n++;
    return n;
  }
  function defaultProfile(mapId) {
    const letters = {};
    for (const ch of L.UNLOCK_ORDER) letters[ch] = newLetterStats();
    const sm = starterMachines();
    return {
      version: 2,
      map: mapId,
      createdAt: Date.now(),
      savedAt: null,
      pairsUnlocked: tier0Pairs(),
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
      crossings: {},     // crossing id → true once repaired (bought at the place)
      heavy: 0,          // heavy modules toward the finish
    };
  }

  // ---- v1 → v2 migration (one-shot, on load) ----
  // A v1 save's unlockedCount indexes the course's pre-v3 order (course data).
  const V1_ORDER = L.LEGACY_ORDER || L.UNLOCK_ORDER;
  const V1_MATS = { az: 'az', buki: 'buki', vedi: 'vedi', slogi: 'slogi', slova: 'slova', stroki: 'stroki' };
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
    q.pairsUnlocked = Math.max(tier0Pairs(), n);
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
      if (m.ore === 'az' && p.autoBench && p.autoBench.az) m.auto = true;
      if (m.ore === 'buki' && p.autoBench && p.autoBench.buki) m.auto = true;
    }
    if (C().oreOpen(q, 'vedi')) {
      const node = C().unbuiltNodes(q).find((nd) => nd.ore === 'vedi');
      if (node) q.machines.push({ id: 'm' + (q.nextMachineId++), kind: 'mine', ore: 'vedi', node: node.index, auto: !!(p.autoBench && p.autoBench.vedi) });
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
    if (typeof p.pairsUnlocked !== 'number') p.pairsUnlocked = tier0Pairs();
    for (const k of ['totalActiveMs', 'totalChars', 'totalErrors', 'km', 'nightBlocks', 'heavy']) if (typeof p[k] !== 'number') p[k] = 0;
    if (!Array.isArray(p.unlockLog)) p.unlockLog = [];
    if (!p.collected) p.collected = {};
    if (!p.bag) p.bag = {};
    if (!p.seen) p.seen = {};
    if (!p.crossings) p.crossings = {};
    for (const [k, v] of Object.entries(p.bag)) if (v > 0) p.seen[k] = true;
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
      if (alt) m.node = alt.index; else p.machines.splice(p.machines.indexOf(m), 1);
    }
    // the starter ores always have their first mine
    for (const s of C().starterNodes()) {
      if (!p.machines.some((m) => m.kind === 'mine' && m.ore === s.ore)) {
        p.machines.push({ id: 'm' + (p.nextMachineId++), kind: 'mine', ore: s.ore, node: s.index, auto: false });
      }
    }
    autoAdvance(p);
    return p;
  }

  // key events at machines that don't exist in this build unlock as they are
  // reached (transitional; phases 4–5 give them their machines)
  function autoAdvance(p) {
    let guard = 0;
    while (guard++ < 20) {
      const np = L.PAIRS[p.pairsUnlocked];
      if (!np || !np.at || C().KINDS[np.at].ready) break;
      p.pairsUnlocked++;
      p.unlockLog.push({ keys: np.keys, at: Date.now(), auto: true });
    }
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

  function loadProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return fresh(mapId);
      const p = JSON.parse(raw);
      if (p.version === 1) return normalize(migrateV1(p, mapId), mapId);
      if (p.version !== 2) return fresh(mapId);
      return normalize(p, mapId);
    } catch {
      return fresh(mapId);
    }
  }
  // import: a raw profile object (v1 or v2) → a normalized v2 for a map
  function adoptProfile(p, mapId) {
    if (p.version === 1) return normalize(migrateV1(p, mapId), mapId);
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
      if (p.version !== 2) return null;
      let letters = 0;
      for (let i = 0; i < (p.pairsUnlocked || 0) && i < L.PAIRS.length; i++) letters += L.PAIRS[i].keys.length;
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
    const s = p.letters[ch];
    if (!s || s.n === 0) return 0;
    bar = bar || C().targetBar(p) || DEFAULT_BAR;
    const targetLat = 12000 / bar.wpm;
    const acc = 1 - s.ewErr;
    const accScore = clamp((acc - (bar.acc - ACC_SPAN)) / ACC_SPAN, 0, 1.25);
    const speedScore = s.ewLat === null ? 0 : clamp(targetLat / s.ewLat, 0, 1.25);
    const fill = Math.min(1, s.n / MIN_SAMPLES);
    return Math.min(accScore, speedScore, fill);
  }
  function recordHit(p, ch, latencyMs) {
    const s = p.letters[ch];
    if (!s) return;
    s.n++;
    if (latencyMs !== null && latencyMs > 0 && latencyMs <= MAX_LATENCY) {
      s.ewLat = s.ewLat === null ? latencyMs : s.ewLat + EW_ALPHA_LAT * (latencyMs - s.ewLat);
    }
    s.ewErr = s.ewErr + EW_ALPHA_ERR * (0 - s.ewErr);
  }
  function recordMiss(p, ch) {
    const s = p.letters[ch];
    if (!s) return;
    s.misses++;
    s.ewErr = s.ewErr + EW_ALPHA_ERR * (1 - s.ewErr);
  }
  // unlock the next pair — the purchase that pays for it is the only gate
  // (progress is what you type and spend; accuracy and speed are measured
  // for the player, never a lock)
  function unlockNextPair(p) {
    const np = nextPair(p);
    if (!np) return null;
    p.pairsUnlocked++;
    p.unlockLog.push({ keys: np.keys, at: Date.now() });
    autoAdvance(p);
    return np;
  }

  // ---------- content generation ----------
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  // Sampling weight: corpus frequency × weakness boost (+ newest-pair boost,
  // × ratio tilt when given — variance only, capped).
  function letterWeight(p, ch, tilt) {
    const weak = 1 - clamp(readiness(p, ch), 0, 1);
    let w = (L.LETTER_FREQ[ch] || 0.5) * (1 + WEAKNESS_BOOST * weak);
    const s = p.letters[ch];
    const last = L.PAIRS[p.pairsUnlocked - 1];
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

  // Generate one drill line: array of {text, gloss|null, punct?}.
  // opts: {mode, alphabet, tilt, count}. mode: 'keys' | 'letters' |
  // 'syllables' | 'clusters' | 'words' | 'lines' (legacy full mix).
  function generateLine(p, opts) {
    opts = opts || {};
    const mode = opts.mode || 'lines';
    const alpha = (opts.alphabet && opts.alphabet.length ? opts.alphabet : unlockedLetters(p)).slice();
    const letters = alpha.filter(isLetter);
    const pool = realWordPool(letters);
    // ratio tilt is variance only: off when the pool is small (words) — and
    // never a filter (the pool above is the full union)
    const tilt = (mode === 'words' && pool.length < C().TUNING.RATIO_MIN_POOL) ? null : capTilt(opts.tilt);
    const wordCount = opts.count || (mode === 'keys' ? 9 : mode === 'syllables' ? 8 : 7);
    let pReal = pool.length >= 40 ? 0.6 : pool.length >= 15 ? 0.45 : pool.length >= 5 ? 0.3 : 0.1;
    if (mode === 'keys') pReal = 0;
    if (mode === 'letters') pReal = Math.min(pReal, 0.15);
    if (mode === 'syllables') pReal = pool.length >= 5 ? 0.12 : 0;
    if (mode === 'clusters') pReal = pool.length >= 10 ? 0.3 : 0.1;
    if (mode === 'words') pReal = pool.length >= 5 ? 0.95 : pReal;
    const sylPool = mode === 'syllables' ? syllablePool(letters) : null;
    const words = [];
    let lastText = null;
    for (let i = 0; i < wordCount; i++) {
      let entry = null;
      if (pool.length > 0 && Math.random() < pReal) {
        for (let tries = 0; tries < 4; tries++) {
          const cand = weightedPick(pool, (e) => realWordWeight(p, e, tilt));
          if (cand[0] !== lastText) { entry = { text: cand[0], gloss: cand[1], set: cand[2] }; break; }
        }
      }
      if (!entry) {
        let text;
        if (mode === 'keys') text = keysItem(p, letters, tilt);
        else if (mode === 'syllables') text = syllableItem(p, letters, tilt, sylPool);
        else if (mode === 'clusters') text = clusterItem(p, letters, tilt);
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
    unlockedLetters, nextPair, readiness, unlockNextPair, trainable,
    recordHit, recordMiss,
    generateLine, realWordPool,
  };
})();
