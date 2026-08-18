// Skill model + adaptive content generator. Global namespace: ENGINE
(function () {
  'use strict';

  const L = window.LANG_RU;

  // One save per map (2026-08-18): mk.profile.v1.<mapId>. Progress never
  // crosses worlds — resources, machines, letters all live in the map's slot.
  const STORAGE_PREFIX = 'mk.profile.v1.';
  const LAST_MAP_KEY = 'mk.map';               // the world last played (the picker's default)
  const SINGLE_KEY = 'mk.profile.v1';          // pre-maps save; adopted once into the frontier's slot
  const LEGACY_KEY = 'transsib.profile.v1';    // pre-rename save; likewise
  const keyFor = (mapId) => STORAGE_PREFIX + mapId;

  // Tuning constants
  const TARGET_WPM = 25;                     // modest speed target that gates unlocks
  const TARGET_LATENCY = 12000 / TARGET_WPM; // ms per char (60000 / (wpm*5))
  const MIN_SAMPLES = 30;                    // presses before a letter can pass its gate
  const ACC_FLOOR = 0.90;                    // readiness 0 at 90% accuracy…
  const ACC_GOAL = 0.97;                     // …1.0 at 97%
  const EW_ALPHA_LAT = 0.10;                 // exponential weight for latency
  const EW_ALPHA_ERR = 0.05;                 // exponential weight for error rate
  const MAX_LATENCY = 2000;                  // ms; longer gaps are pauses, not typing
  const WEAKNESS_BOOST = 3;                  // how strongly weak letters are over-sampled
  const NEW_LETTER_SAMPLES = 60;             // presses during which the newest letter is boosted

  function newLetterStats() {
    return { ewLat: null, ewErr: 0.05, n: 0, misses: 0 };
  }

  function defaultProfile(mapId) {
    const letters = {};
    for (const ch of L.UNLOCK_ORDER) letters[ch] = newLetterStats();
    return {
      version: 1,
      map: mapId,        // the world this save belongs to (its slot key)
      createdAt: Date.now(),
      savedAt: null,
      unlockedCount: L.SEED_COUNT,
      letters,
      totalActiveMs: 0,
      totalChars: 0,
      totalErrors: 0,
      unlockLog: [], // {letter, at}
      km: 0,             // distance travelled — earned by clean words
      nightBlocks: 0,    // completed hint-free blocks
      collected: {},     // word → {n, clean, at} — the passport
      money: 0,          // рубли — order payouts; buys paint, never progress
      automated: {},     // letter → true; sticky automaticity monuments
      autoBench: {},     // bench id → true; material-paid bench automation
      built: {},         // tier-2+ station id → true (erected with materials)
      belts: {},         // "from>to" → true (purchased feed lines)
      plots: {},         // station id → plot id (the player's placement choices)
      milestoneIdx: 0,   // progress on the milestone board
      era: 'hand',       // hand → steam → rotary; advanced by Издания
      // the material chain (old Slavic letter names for the tier-1 goods)
      mats: { az: 0, buki: 0, vedi: 0, slogi: 0, slova: 0, stroki: 0, listy: 0 },
    };
  }

  // Kit stations erected before the plot system have no plot on record: park
  // them where the map says legacy builds went, else on the first free plot.
  // Pre-built stations need nothing — they resolve through the map's HOME.
  // Runs against the CURRENT map (CHAIN.useMap first).
  function migratePlots(p) {
    if (!p.plots) p.plots = {};
    const C = window.CHAIN;
    if (!C) return;
    for (const st of C.STATIONS) {
      if (!st.buildCost || !C.isBuilt(p, st) || p.plots[st.id]) continue;
      const legacy = C.LEGACY[st.id];
      const free = C.freePlots(p);
      const plot = (legacy && free.find((pl) => pl.id === legacy)) || free[0];
      if (plot) p.plots[st.id] = plot.id;
    }
  }

  // the raw save for a map's slot, or null; a pre-maps save is adopted into
  // the default map's slot the first time anyone asks for it
  function rawFor(mapId) {
    let raw = localStorage.getItem(keyFor(mapId));
    if (mapId === window.CHAIN.DEFAULT_MAP) {
      for (const k of [SINGLE_KEY, LEGACY_KEY]) {
        const old = localStorage.getItem(k);
        if (!old) continue;
        if (!raw) { raw = old; localStorage.setItem(keyFor(mapId), old); }
        localStorage.removeItem(k);   // adopted, or superseded by the slot — either way retired
      }
    }
    return raw;
  }
  function fresh(mapId) { const p = defaultProfile(mapId); migratePlots(p); return p; }

  function loadProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return fresh(mapId);
      const p = JSON.parse(raw);
      if (p.version !== 1) return fresh(mapId);
      p.map = mapId;
      if (typeof p.savedAt !== 'number') p.savedAt = null;
      // Ensure all letters exist (forward-compat if order list grows).
      for (const ch of L.UNLOCK_ORDER) if (!p.letters[ch]) p.letters[ch] = newLetterStats();
      // Additive migration for profiles saved before the game layer existed.
      if (typeof p.km !== 'number') p.km = 0;
      if (typeof p.nightBlocks !== 'number') p.nightBlocks = 0;
      if (!p.collected) p.collected = {};
      if (typeof p.money !== 'number') p.money = 0;
      if (!p.automated) p.automated = {};
      if (!p.autoBench) p.autoBench = {};
      if (!p.built) p.built = {};
      if (!p.belts) p.belts = {};
      if (!p.mats) p.mats = {};
      if (typeof p.mats.az !== 'number') {
        p.mats = {
          az: p.mats.lit || 0, buki: 0, vedi: 0,
          slogi: p.mats.svz || 0, slova: p.mats.slova || 0,
          stroki: p.mats.stroki || 0, listy: p.mats.listy || 0,
        };
      }
      if (typeof p.milestoneIdx !== 'number') p.milestoneIdx = 0;
      if (!p.era) p.era = 'hand';
      migratePlots(p);
      return p;
    } catch {
      return fresh(mapId);
    }
  }

  // a look at a map's save without adopting it as current (the picker's
  // progress line): {unlockedCount, totalChars, built, savedAt} or null
  function peekProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (p.version !== 1) return null;
      return {
        unlockedCount: p.unlockedCount || 0,
        totalChars: p.totalChars || 0,
        built: Object.keys(p.built || {}).length,
        milestoneIdx: p.milestoneIdx || 0,
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

  // the world last played, if it still exists
  function getLastMap() {
    try {
      const id = localStorage.getItem(LAST_MAP_KEY);
      return id && window.CHAIN.MAPS[id] ? id : null;
    } catch { return null; }
  }
  function setLastMap(mapId) {
    try { localStorage.setItem(LAST_MAP_KEY, mapId); } catch { /* non-fatal */ }
  }

  function unlockedLetters(p) {
    return L.UNLOCK_ORDER.slice(0, p.unlockedCount);
  }

  function nextLetter(p) {
    return p.unlockedCount < L.UNLOCK_ORDER.length ? L.UNLOCK_ORDER[p.unlockedCount] : null;
  }

  // Readiness ∈ [0, ~1.25]: min of speed score, accuracy score, sample fill.
  // A letter passes its gate at readiness ≥ 1.
  function readiness(p, ch) {
    const s = p.letters[ch];
    if (!s || s.n === 0) return 0;
    const acc = 1 - s.ewErr;
    const accScore = clamp((acc - ACC_FLOOR) / (ACC_GOAL - ACC_FLOOR), 0, 1.25);
    const speedScore = s.ewLat === null ? 0 : clamp(TARGET_LATENCY / s.ewLat, 0, 1.25);
    const fill = Math.min(1, s.n / MIN_SAMPLES);
    return Math.min(accScore, speedScore, fill);
  }

  // Record a correct keystroke for `ch`, with optional latency in ms.
  function recordHit(p, ch, latencyMs) {
    const s = p.letters[ch];
    if (!s) return;
    s.n++;
    if (latencyMs !== null && latencyMs > 0 && latencyMs <= MAX_LATENCY) {
      s.ewLat = s.ewLat === null ? latencyMs : s.ewLat + EW_ALPHA_LAT * (latencyMs - s.ewLat);
    }
    s.ewErr = s.ewErr + EW_ALPHA_ERR * (0 - s.ewErr);
  }

  // Record a miss where `ch` was expected.
  function recordMiss(p, ch) {
    const s = p.letters[ch];
    if (!s) return;
    s.misses++;
    s.ewErr = s.ewErr + EW_ALPHA_ERR * (1 - s.ewErr);
  }

  // Check gate; unlocks the next letter if every unlocked letter passes.
  // Returns the newly unlocked letter or null.
  function checkUnlock(p) {
    const next = nextLetter(p);
    if (!next) return null;
    for (const ch of unlockedLetters(p)) {
      if (readiness(p, ch) < 1) return null;
    }
    p.unlockedCount++;
    p.unlockLog.push({ letter: next, at: Date.now() });
    return next;
  }

  // ---------- content generation ----------

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  // Focus set (bench letter groups): temporarily over-weighted in generation.
  let focusSet = null; // Set of letters, or null
  function setFocusSet(letters) { focusSet = letters && letters.length ? new Set(letters) : null; }

  // Sampling weight: corpus frequency × weakness boost (+ new-letter boost).
  function letterWeight(p, ch) {
    const weak = 1 - clamp(readiness(p, ch), 0, 1);
    let w = L.LETTER_FREQ[ch] * (1 + WEAKNESS_BOOST * weak);
    const s = p.letters[ch];
    const isNewest = ch === L.UNLOCK_ORDER[p.unlockedCount - 1];
    if (isNewest && s.n < NEW_LETTER_SAMPLES) w *= 4;
    if (focusSet && focusSet.has(ch)) w *= 3;
    return w;
  }

  // Sticky automaticity: returns letters newly crossing the automation bar.
  function updateAutomation(p) {
    const fresh = [];
    for (const ch of unlockedLetters(p)) {
      if (p.automated[ch]) continue;
      const s = p.letters[ch];
      if (s.n >= MIN_SAMPLES && readiness(p, ch) >= 1) {
        p.automated[ch] = true;
        fresh.push(ch);
      }
    }
    return fresh;
  }

  function weightedPick(items, weightFn) {
    let total = 0;
    const ws = items.map((it) => { const w = weightFn(it); total += w; return w; });
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  // Pseudo-word obeying loose Russian phonotactics, from unlocked letters only.
  function pseudoWord(p) {
    const unlocked = unlockedLetters(p);
    const vowels = unlocked.filter((c) => L.VOWELS.has(c));
    const cons = unlocked.filter((c) => !L.VOWELS.has(c) && !L.PUNCT.has(c) && c !== 'ь' && c !== 'ъ' && c !== 'й');
    const hasSoft = unlocked.includes('ь');
    const hasJ = unlocked.includes('й');
    if (vowels.length === 0) return null;

    const pickV = () => weightedPick(vowels, (c) => letterWeight(p, c));
    const pickC = () => weightedPick(cons, (c) => letterWeight(p, c));

    const sylCount = Math.random() < 0.25 ? 1 : Math.random() < 0.65 ? 2 : 3;
    let word = '';
    for (let i = 0; i < sylCount; i++) {
      let onset = cons.length > 0 && Math.random() < 0.85 ? pickC() : '';
      // Avoid doubled letters across syllable boundaries (ттоо-style artifacts).
      for (let t = 0; t < 3 && onset && onset === word[word.length - 1]; t++) onset = pickC();
      if (onset === word[word.length - 1]) onset = '';
      let nucleus = pickV();
      for (let t = 0; t < 3 && nucleus === (onset || word[word.length - 1]); t++) nucleus = pickV();
      let coda = '';
      if (Math.random() < 0.35) {
        if (hasJ && Math.random() < 0.2) coda = 'й';
        else if (cons.length > 0) {
          coda = pickC();
          if (coda === nucleus || coda === onset) coda = '';
          else if (coda && hasSoft && Math.random() < 0.25) coda += 'ь';
        }
      }
      word += onset + nucleus + coda;
    }
    // Single-syllable bare vowel looks silly; pad it.
    if (word.length < 2) word += cons.length > 0 ? pickC() + pickV() : pickV();
    return word;
  }

  // Real words typeable with the unlocked set.
  function realWordPool(p) {
    const set = new Set(unlockedLetters(p));
    return L.WORDS.filter(([w]) => [...w].every((c) => set.has(c)));
  }

  function realWordWeight(p, entry) {
    const [w] = entry;
    let sum = 0;
    for (const c of w) sum += letterWeight(p, c);
    return sum / w.length + w.length * 0.3; // slight preference for longer words
  }

  // Count occurrences of tracked bigrams in a word.
  function bigramsIn(word) {
    let n = 0;
    for (const bg of L.TOP_BIGRAMS) {
      for (let i = 0; i + 1 < word.length; i++) if (word.slice(i, i + 2) === bg) n++;
    }
    return n;
  }

  // Inject a tracked bigram into a pseudo-word (for bigram-frame drills).
  function bigramWord(p) {
    const unlockedSet = new Set(unlockedLetters(p));
    const avail = L.TOP_BIGRAMS.filter((bg) => unlockedSet.has(bg[0]) && unlockedSet.has(bg[1]));
    if (!avail.length) return pseudoWord(p);
    const bg = avail[Math.floor(Math.random() * avail.length)];
    const base = pseudoWord(p) || '';
    const cut = Math.min(base.length, 1 + Math.floor(Math.random() * 3));
    return base.slice(0, cut) + bg + base.slice(cut, cut + 3);
  }

  // Generate one drill line: array of {text, gloss|null}.
  // mode: 'lines' (default: full mix + punctuation), 'letters' (pseudo-heavy),
  // 'bigrams' (tracked-bigram injection), 'words' (real words dominate).
  function generateLine(p, wordCount, mode) {
    wordCount = wordCount || 7;
    mode = mode || 'lines';
    const pool = realWordPool(p);
    // Real-word share grows with pool size; drills always keep some pseudo-words
    // early so letter-level fluency is trained, then real words dominate.
    let pReal = pool.length >= 40 ? 0.6 : pool.length >= 15 ? 0.45 : pool.length >= 5 ? 0.3 : 0.1;
    if (mode === 'letters') pReal = Math.min(pReal, 0.15);
    if (mode === 'bigrams') pReal = 0;
    if (mode === 'words') pReal = pool.length >= 5 ? 0.95 : pReal;
    const words = [];
    let lastText = null;
    for (let i = 0; i < wordCount; i++) {
      let entry = null;
      if (pool.length > 0 && Math.random() < pReal) {
        for (let tries = 0; tries < 4; tries++) {
          const cand = weightedPick(pool, (e) => realWordWeight(p, e));
          if (cand[0] !== lastText) { entry = { text: cand[0], gloss: cand[1], set: cand[2] }; break; }
        }
      }
      if (!entry) {
        const pw = mode === 'bigrams' ? bigramWord(p) : pseudoWord(p);
        entry = { text: pw, gloss: null };
      }
      lastText = entry.text;
      words.push(entry);
    }

    // Punctuation attachment (once unlocked): appended after words, never
    // inside them. Skipped in low-tier station modes (letters/bigrams).
    if (mode === 'letters' || mode === 'bigrams') return words;
    const unlockedSet = new Set(unlockedLetters(p));
    const weaknessOf = (ch) => 1 - clamp(readiness(p, ch), 0, 1);
    if (unlockedSet.has(',')) {
      const pComma = Math.min(0.35, 0.12 * (1 + 2 * weaknessOf(',')));
      for (let i = 0; i < words.length - 1; i++) {
        if (Math.random() < pComma) words[i].punct = ',';
      }
    }
    if (unlockedSet.has('.')) {
      const pMid = Math.min(0.3, 0.1 * (1 + 2 * weaknessOf('.')));
      for (let i = 0; i < words.length - 1; i++) {
        if (!words[i].punct && Math.random() < pMid) words[i].punct = '.';
      }
      if (Math.random() < 0.85) words[words.length - 1].punct = '.';
    }
    return words;
  }

  window.ENGINE = {
    TARGET_WPM, MIN_SAMPLES, MAX_LATENCY,
    loadProfile, saveProfile, resetProfile, peekProfile, getLastMap, setLastMap,
    unlockedLetters, nextLetter, readiness,
    recordHit, recordMiss, checkUnlock,
    generateLine, realWordPool, bigramsIn,
    setFocusSet, updateAutomation,
  };
})();
