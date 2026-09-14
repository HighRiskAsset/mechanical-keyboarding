// Skill model + adaptive content generator (tech tree v4). Global: ENGINE
//
// The engine knows rungs and grammars, never letters (invariant 5): every
// letter it touches comes from the active course's data (COURSES) or from the
// tree through the chain. Profile v4 (lesson plan v4, 2026-09-12): keys open
// per introduction — a mine built, a key group's recipe reached — the bag
// holds materials, machines are instances standing on tiles.
(function () {
  'use strict';

  const L = COURSES.course();

  // One save per map and course: mk.profile.v4.<course.><mapId>. The v4
  // tree shares nothing with the v3 one (other materials, other machines,
  // other lessons), so a v3 save is neither read nor touched: it keeps its
  // own key, and this course starts a new world under this one.
  const STORAGE_PREFIX = 'mk.profile.v4.';
  const LAST_MAP_KEY = 'mk.map';
  const keyFor = (mapId) => STORAGE_PREFIX + COURSES.saveTag() + mapId;

  // Tuning constants
  const MIN_SAMPLES = 30;                    // presses before a letter reads fully ready (readiness is display + sampling weight, never a lock)
  const ACC_SPAN = 0.07;                     // readiness 0 at (bar.acc − span) … 1 at bar.acc
  const EW_ALPHA_LAT = 0.10;                 // exponential weight for latency
  const EW_ALPHA_ERR = 0.05;                 // exponential weight for error rate
  const MAX_LATENCY = 2000;                  // ms; longer gaps are pauses, not typing
  const WEAKNESS_BOOST = 3;                  // how strongly weak letters are over-sampled
  const NEW_LETTER_SAMPLES = 60;             // presses during which the newest keys are boosted
  const DEFAULT_BAR = { wpm: 25, acc: 0.97 };

  const C = () => window.CHAIN;
  // every key the course teaches: the stats table has a row for each
  const scopeKeys = () => {
    const s = C().TREE.scope || {};
    return [].concat(s.letters || [], s.digits || [], s.marks || [], s.extended || []);
  };

  function newLetterStats() {
    return { ewLat: null, ewErr: 0.05, n: 0, misses: 0 };
  }
  // every key the tree teaches is drilled, marks and digits with the rest
  const trainable = () => true;

  // ---------- profile ----------
  function starterMachines() {
    const machines = [];
    let id = 1;
    for (const s of C().starterNodes()) machines.push({ id: 'm' + (id++), kind: 'mine', ore: s.ore, node: s.index, face: C().nodeFace(s.index) });
    return { machines, nextId: id };
  }
  function defaultProfile(mapId) {
    const letters = {};
    for (const ch of scopeKeys()) letters[ch] = newLetterStats();
    const sm = starterMachines();
    const unlocked = {};
    for (const s of C().starterNodes()) if (s.lesson) unlocked[s.lesson] = true;
    return {
      version: 4,
      map: mapId,
      createdAt: Date.now(),
      savedAt: null,
      unlocked,          // introduction lesson id → true once its keys are open
      letters,
      totalActiveMs: 0,
      totalChars: 0,
      totalErrors: 0,
      unlockLog: [],     // {id, keys, at}
      km: 0,
      nightBlocks: 0,
      collected: {},     // word → {n, clean, at} — the passport
      bag: {},           // material id → count
      seen: {},          // material id → true once held (progressive reveal)
      touched: {},       // material id → the count of its last hand touch (the bag panel's residents)
      touchN: 0,
      machines: sm.machines, // {id, kind, ore?, node?, at, face, recipe?, autoOn?}
      nextMachineId: sm.nextId,
      drops: [],         // loose materials on the ground: {id, mat, n, x, y}
      nextDropId: 1,
      crossings: {},     // crossing id → true once repaired (bought at the place)
      finishedAt: null,  // the completion purchase, once
      // the layout this save's coordinates are in (see relayProfile below). A
      // new save is born in the current one and is never shifted.
      relay: (C().MAPS[mapId] && C().MAPS[mapId].RELAY || {}).tag || null,
    };
  }

  // ---- a world that moved inside a larger frame (2026-08-28) ----
  // Everything a save remembers by position (where a machine stands, the
  // tiles a belt runs over, a good lying on the ground) is in the OLD frame
  // until this runs, so a save is moved exactly as far as the ground was.
  function relayProfile(p, relay) {
    const { dc, dr } = relay;
    const list = (v) => (Array.isArray(v) ? v : []);
    for (const m of list(p.machines)) if (Array.isArray(m.at)) m.at = [m.at[0] + dc, m.at[1] + dr];
    for (const b of list(p.belts)) if (Array.isArray(b.path)) b.path = b.path.map((t) => [t[0] + dc, t[1] + dr]);
    for (const d of list(p.drops)) {
      for (const k of ['x', 'ox']) if (typeof d[k] === 'number') d[k] += dc * 16;
      for (const k of ['y', 'oy']) if (typeof d[k] === 'number') d[k] += dr * 16;
    }
    p.relay = relay.tag;
  }

  // forward-compat: fill anything a newer build added, and keep the save
  // consistent with the tree it is loaded into
  function normalize(p, mapId) {
    p.map = mapId;
    // first of all, before anything reads a coordinate or writes one: a save
    // from an older layout of this world is moved into the current frame
    const relay = (C().MAPS[mapId] || {}).RELAY;
    if (relay && p.relay !== relay.tag) relayProfile(p, relay);
    if (typeof p.savedAt !== 'number') p.savedAt = null;
    if (!p.letters) p.letters = {};
    for (const ch of scopeKeys()) if (!p.letters[ch]) p.letters[ch] = newLetterStats();
    if (!p.unlocked || typeof p.unlocked !== 'object') p.unlocked = {};
    for (const k of ['totalActiveMs', 'totalChars', 'totalErrors', 'km', 'nightBlocks']) if (typeof p[k] !== 'number') p[k] = 0;
    if (!Array.isArray(p.unlockLog)) p.unlockLog = [];
    if (!p.collected) p.collected = {};
    if (!p.bag) p.bag = {};
    if (!p.seen) p.seen = {};
    // a save from before the panel had residents: everything it has held is
    // touched in tree order, so its newest goods are the ones that stay up
    if (!p.touched) { p.touched = {}; p.touchN = 0; for (const m of C().MAT_IDS) if (p.seen[m] && !C().isFluid(m)) p.touched[m] = ++p.touchN; }
    if (typeof p.touchN !== 'number') p.touchN = Object.keys(p.touched).length;
    if (!p.crossings) p.crossings = {};
    if (p.finishedAt === undefined) p.finishedAt = null;
    // a fluid never sits in the bag (it cannot be carried); a save that
    // somehow holds one drops it
    for (const k of Object.keys(p.bag)) if (C().isFluid(k)) delete p.bag[k];
    // a save from before the cap spills its surplus onto the ground at the
    // spawn, once — clamping would be theft. The piles never expire.
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
    // a machine of a kind this tree has no longer, or a mine on an ore it has
    // no longer, is gone (the tree changed under the save)
    p.machines = p.machines.filter((m) => (m.kind === 'mine' ? !!C().ORES[m.ore] : !!C().KINDS[m.kind]));
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
    // on its vein, at the facing the seam is bedded at
    for (const m of p.machines) {
      if (m.kind !== 'mine' || m.node === undefined || m.node === null || !Array.isArray(m.at)) continue;
      const v = MAPKIT.veinBox(C().MAP.NODES[m.node]);
      const b = C().machineBox(m);
      if (b.c0 > v.c1 || b.c1 < v.c0 || b.r0 > v.r1 || b.r1 < v.r0) { m.face = C().nodeFace(m.node); delete m.at; }
    }
    // the starter ores always have their first mine
    for (const s of C().starterNodes()) {
      if (!p.machines.some((m) => m.kind === 'mine' && m.ore === s.ore)) {
        p.machines.push({ id: 'm' + (p.nextMachineId++), kind: 'mine', ore: s.ore, node: s.index, face: C().nodeFace(s.index) });
      }
    }
    // a mine standing means its keys are open; a recipe a machine was told
    // to run that the tree no longer has is forgotten
    for (const m of p.machines) {
      if (m.kind === 'mine') { const id = C().mineLesson(m.ore); if (id) p.unlocked[id] = true; }
      else if (m.recipe && !C().recipeFor(m.recipe)) { delete m.recipe; delete m.recipeIn; }
    }
    if (window.SIM) SIM.ensure(p);   // buffers, belts, the clock, the facing
    if (window.DROPS) DROPS.ensure(p);   // goods lying on the ground; they never expire
    // machines stand on tiles: one from before carries a node anchor and no
    // `at`; seat it there once
    for (const m of p.machines) {
      if (Array.isArray(m.at) && m.at.length === 2) continue;
      const b = C().machineBox(m);   // the anchor fallback path
      m.at = [b.c0, b.r0];
    }
    return p;
  }

  function rawFor(mapId) {
    return localStorage.getItem(keyFor(mapId));
  }
  function fresh(mapId) { return normalize(defaultProfile(mapId), mapId); }

  function loadProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return fresh(mapId);
      const p = JSON.parse(raw);
      if (p.version !== 4) return fresh(mapId);
      return normalize(p, mapId);
    } catch {
      return fresh(mapId);
    }
  }
  // import: a raw v4 profile object → a normalized one for a map
  function adoptProfile(p, mapId) {
    if (!p || p.version !== 4) return fresh(mapId);
    return normalize(p, mapId);
  }

  // a look at a map's save without adopting it (the picker's progress line)
  function peekProfile(mapId) {
    try {
      const raw = rawFor(mapId);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (p.version !== 4) return null;
      const letters = C().unlockedKeys({ unlocked: p.unlocked || {} }).length;
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
  // open an introduction: the purchase that reaches it is the only gate
  // (progress is what you type and spend; accuracy and speed are measured
  // for the player, never a lock). Returns the introduction as the summary
  // reads it ({id, keys, tier}), or null if it was already open.
  function unlockIntro(p, id) {
    const l = C().lessonOf(id);
    if (!l || (l.kind !== 'raw' && l.kind !== 'keys')) return null;
    if (p.unlocked[id]) return null;
    p.unlocked[id] = true;
    p.unlockLog.push({ id, keys: l.keys, at: Date.now() });
    return C().introRung(id) || { id, keys: l.keys, tier: l.col };
  }
  const unlockPair = (p, pair) => (pair ? unlockIntro(p, pair.id) : null);
  const unlockNextPair = (p) => unlockPair(p, nextPair(p));

  // ---------- content generation ----------
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  // Sampling weight: corpus frequency × weakness boost (+ newest-keys boost,
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
  const isDigit = (ch) => /^[0-9]$/.test(ch);
  const isLetter = (ch) => !L.PUNCT.has(ch) && !isDigit(ch);
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
  // a number of one to four digits over the digits the lesson holds
  function numberItem(p, digits, tilt) {
    const n = Math.random() < 0.4 ? 1 : Math.random() < 0.6 ? 2 : Math.random() < 0.6 ? 3 : 4;
    let s = '';
    for (let i = 0; i < n; i++) {
      let d = weightedPick(digits, (c) => letterWeight(p, c, tilt));
      if (i === 0 && d === '0' && n > 1 && digits.length > 1) for (let t = 0; t < 3 && d === '0'; t++) d = weightedPick(digits, (c) => letterWeight(p, c, tilt));
      s += d;
    }
    return s;
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
  // position drill: single keys, sometimes doubled, over a tiny alphabet
  function keysItem(p, alpha, tilt) {
    const pick = () => weightedPick(alpha, (c) => letterWeight(p, c, tilt));
    const r = Math.random();
    if (r < 0.55) return pick();
    if (r < 0.85) { const a = pick(); let b = pick(); if (b === a && alpha.length > 1) b = pick(); return a + b; }
    return pick() + pick() + pick();
  }

  // ---- phrases, sentences and pages ----
  // Phrases and sentences are [text, gloss]; a text fits when every letter
  // and mark it carries is in the alphabet. The course lists them in lower
  // case; a lesson with capitals capitalises what it takes.
  const textLetters = (s) => [...s].filter((c) => c !== ' ');
  function phrasePool(alpha) {
    const set = new Set(alpha);
    return (L.PHRASES || []).filter(([s]) => textLetters(s).every((c) => set.has(c)));
  }
  function sentencePool(alpha, extra) {
    const set = new Set(alpha);
    const list = (L.SENTENCES || []).concat((extra || []).map((s) => (Array.isArray(s) ? s : [s, null])));
    return list.filter(([s]) => textLetters(s).every((c) => set.has(c) || set.has(c.toLowerCase())));
  }
  // the sentence families the plan drills, as the plan tests them
  // (dev/lessons-v4-build.js FAMILY_TEST)
  const FAMILY_TEST = {
    period: (s) => /^[^,?!:;"«»()—\d]*\.$/.test(s),
    names: (s) => /^[^,?!:;"«»()—\d]*\.$/.test(s),
    clauses: (s) => s.includes(','),
    dash: (s) => /—|\S-\S/.test(s),
    past: (s) => /(^|\s)(был|была|были|было)(\s|[.,!?])|л[аи]?[.,]/.test(s),
    questions: (s) => /[?!]/.test(s),
    dialogue: (s) => /["«»]/.test(s),
    lists: (s) => /[:;()]/.test(s),
    numbers: (s) => /\d/.test(s),
    dates: (s) => /\d/.test(s),
    mixed: () => true,
    everything: () => true,
  };
  function familyPool(pool, family) {
    const test = typeof family === 'string' ? FAMILY_TEST[family] : null;
    if (!test) return pool;
    const fam = pool.filter(([s]) => test(s));
    return fam.length >= 3 ? fam : pool;
  }
  // a phrase or sentence as drill entries: one per word, trailing marks on
  // the word as `punct`, the gloss on the last word
  function textEntries(text, gloss) {
    const out = [];
    for (const tok of text.split(' ')) {
      if (!tok) continue;
      const m = tok.match(/^(.*?)([.,?!:;"»)\]}—-]*)$/u);
      const core = m ? m[1] : tok, marks = m ? m[2] : '';
      if (!core) { if (out.length) out[out.length - 1].punct = (out[out.length - 1].punct || '') + marks; else out.push({ text: marks, gloss: null }); continue; }
      out.push({ text: core, gloss: null, punct: marks || undefined });
    }
    if (out.length) out[out.length - 1].gloss = gloss || null;
    return out;
  }
  // proper names: a name fits when its lowercase letters are unlocked
  function namePool(alpha) {
    const set = new Set(alpha);
    return (L.NAMES || []).filter(([w]) => [...w.toLowerCase()].every((c) => set.has(c)));
  }
  // pages: real paragraphs, graded by length and mark density. A page fits
  // when its letters (case-folded) and marks fit.
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
    for (const c of text) { if (c === ' ') continue; sum += letterWeight(p, c.toLowerCase(), tilt); k++; }
    return k ? sum / k + 0.2 : 0.2;
  }
  const capFirst = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  // sentence-initial capitals, and names where they fit
  function capitalise(out, letters, withNames) {
    const names = withNames ? namePool(letters) : [];
    let boundary = true;
    for (const e of out) {
      if (boundary && /\p{L}/u.test(e.text.charAt(0))) e.text = capFirst(e.text);
      else if (boundary && /^[«"(]/.test(e.text)) e.text = e.text.charAt(0) + capFirst(e.text.slice(1));
      boundary = !!(e.punct && /[.!?]/.test(e.punct));
      if (names.length && !boundary && Math.random() < 0.12 && /\p{Ll}/u.test(e.text.charAt(0))) {
        const nm = names[Math.floor(Math.random() * names.length)];
        e.text = nm[0]; e.gloss = nm[1];
      }
    }
  }

  // Generate one drill line: array of {text, gloss|null, punct?}.
  // opts (a lesson spec from CHAIN.lessonSpec): {mode, alphabet, tilt, count,
  // family, caps, page, authored}. mode: 'keys' | 'letters' | 'syllables' |
  // 'words' | 'phrases' | 'sentences' | 'capitals' | 'pages'. family: for
  // words, the word sets the lesson leans on; for sentences, the family
  // name the plan tests.
  function generateLine(p, opts) {
    opts = opts || {};
    const mode = opts.mode || 'words';
    const alpha = (opts.alphabet && opts.alphabet.length ? opts.alphabet : unlockedLetters(p)).slice();
    const letters = alpha.filter(isLetter);
    const digits = alpha.filter(isDigit);
    const pool = realWordPool(letters);
    // ratio tilt is variance only: off when the pool is small (words) — and
    // never a filter (the pool above is the full union)
    const tilt = (mode === 'words' && pool.length < C().TUNING.RATIO_MIN_POOL) ? null : capTilt(opts.tilt);
    const wordCount = opts.count || (mode === 'keys' ? 9 : mode === 'syllables' ? 8 : mode === 'phrases' ? 8 : mode === 'sentences' ? 10 : 7);
    if (mode === 'pages') {
      // one page per line: the lesson's own text, else the easiest fitting
      // page of the course
      if (opts.page) return textEntries(opts.page, null);
      const pgs = pagePool(alpha);
      if (!pgs.length) return generateLine(p, { ...opts, mode: 'sentences' });
      const pick = pgs[Math.floor(Math.random() * Math.min(5, pgs.length))];
      return textEntries(pick[0], pick[1]);
    }
    if (mode === 'phrases' || mode === 'sentences') {
      const texts = mode === 'phrases' ? phrasePool(alpha) : familyPool(sentencePool(alpha, opts.authored), opts.family);
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
      if (mode === 'sentences' && out.length && !out[out.length - 1].punct && alpha.includes('.')) out[out.length - 1].punct = '.';
      // a number lesson without enough numbered sentences slips numbers in
      if (mode === 'sentences' && digits.length && (opts.family === 'numbers' || opts.family === 'dates') && !out.some((e) => /\d/.test(e.text))) {
        const i = Math.floor(Math.random() * out.length);
        out.splice(i, 0, { text: numberItem(p, digits, tilt), gloss: null });
      }
      if (opts.caps && out.length) capitalise(out, letters, mode === 'sentences');
      return out;
    }
    // the Shift drill: real words with their first letter up, names among
    // them — every item takes the far Shift
    if (mode === 'capitals') {
      const names = namePool(letters);
      const out = [];
      let lastText = null;
      for (let i = 0; i < wordCount; i++) {
        let text;
        if (names.length && Math.random() < 0.35) text = names[Math.floor(Math.random() * names.length)][0];
        else if (pool.length) text = capFirst(weightedPick(pool, (e) => realWordWeight(p, e, tilt))[0]);
        else text = capFirst(pseudoWord(p, letters, tilt));
        for (let t = 0; t < 3 && text === lastText; t++) text = capFirst(pool.length ? weightedPick(pool, (e) => realWordWeight(p, e, tilt))[0] : pseudoWord(p, letters, tilt));
        lastText = text;
        out.push({ text, gloss: null });
      }
      return out;
    }
    // words: the lesson's word sets first, the whole pool behind them
    const fams = Array.isArray(opts.family) ? opts.family : null;
    const famPool = fams ? pool.filter((e) => fams.includes(e[2])) : [];
    let pReal = pool.length >= 40 ? 0.6 : pool.length >= 15 ? 0.45 : pool.length >= 5 ? 0.3 : 0.1;
    if (mode === 'keys') pReal = 0;
    if (mode === 'letters') pReal = Math.min(pReal, 0.15);
    if (mode === 'syllables') pReal = pool.length >= 5 ? 0.12 : 0;
    if (mode === 'words') pReal = pool.length >= 5 ? 0.95 : pReal;
    const sylPool = mode === 'syllables' ? syllablePool(letters) : null;
    const digitsOnly = !letters.length && digits.length > 0;
    // a stream over keys that are not all letters (a mark among them, the
    // number row) is drilled as the keys themselves, never as pseudo-words
    const asKeys = mode === 'keys' || ((mode === 'letters' || mode === 'syllables') && (!letters.length || alpha.some((c) => !isLetter(c))));
    const words = [];
    let lastText = null;
    for (let i = 0; i < wordCount; i++) {
      let entry = null;
      const src = famPool.length >= 5 && Math.random() < 0.75 ? famPool : pool;
      if (!asKeys && src.length > 0 && Math.random() < pReal) {
        for (let tries = 0; tries < 4; tries++) {
          const cand = weightedPick(src, (e) => realWordWeight(p, e, tilt));
          if (cand[0] !== lastText) { entry = { text: cand[0], gloss: cand[1], set: cand[2] }; break; }
        }
      }
      if (!entry) {
        const make = () => (asKeys ? keysItem(p, alpha, tilt)
          : digitsOnly ? numberItem(p, digits, tilt)
          : mode === 'syllables' ? syllableItem(p, letters, tilt, sylPool)
          : pseudoWord(p, letters, tilt));
        let text = make();
        for (let t = 0; t < 3 && text === lastText; t++) text = make();
        entry = { text, gloss: null };
      }
      lastText = entry.text;
      words.push(entry);
    }
    // a words lesson that holds digits sprinkles a number in
    if (digits.length && letters.length && mode === 'words' && Math.random() < 0.5) {
      words.splice(Math.floor(Math.random() * words.length), 0, { text: numberItem(p, digits, tilt), gloss: null });
    }
    // the marks the alphabet holds: appended after items, never inside them
    const weaknessOf = (ch) => 1 - clamp(readiness(p, ch), 0, 1);
    if (alpha.includes(',') && !asKeys) {
      const pComma = Math.min(0.35, 0.12 * (1 + 2 * weaknessOf(',')));
      for (let i = 0; i < words.length - 1; i++) if (Math.random() < pComma) words[i].punct = ',';
    }
    if (alpha.includes('.') && !asKeys) {
      const pMid = Math.min(0.3, 0.1 * (1 + 2 * weaknessOf('.')));
      for (let i = 0; i < words.length - 1; i++) if (!words[i].punct && Math.random() < pMid) words[i].punct = '.';
      if (Math.random() < 0.85) words[words.length - 1].punct = '.';
    }
    // the dash stands alone between words, a space each side (the Russian
    // clause dash). Only where prose would carry one: words, never
    // syllables.
    for (const dash of ['—', '-']) {
      if (alpha.includes(dash) && mode === 'words') {
        const pDash = Math.min(0.18, 0.06 * (1 + 2 * weaknessOf(dash)));
        for (let i = words.length - 2; i >= 1; i--) {
          if (!words[i - 1].punct && words[i - 1].text.length > 1 && !/^[—-]$/.test(words[i - 1].text) && Math.random() < pDash) words.splice(i, 0, { text: dash, gloss: null });
        }
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
    unlockedLetters, nextPair, readiness, unlockIntro, unlockPair, unlockNextPair, trainable,
    recordHit, recordMiss,
    generateLine, realWordPool, phrasePool, sentencePool, namePool, pagePool,
  };
})();
