// UI + world orchestration: one persistent overworld, no scene switching.
// Walk with arrows; dock at a place by standing near it; type to work a
// machine; hold Space to open the place's menu (arrows choose, hold Space
// confirms, a tap or Escape closes). Tech tree v3: everything is bought from
// the bag at the place — mines and Mk at ore nodes, machines at plots, ⚙ at
// the machine. The one screen before the world is the map picker.
(function () {
  'use strict';

  const loadingCard = document.getElementById('loading');
  if (loadingCard) loadingCard.classList.add('s2');

  const L = window.LANG_RU;
  const LAYOUT = window.LAYOUT_RU;
  const E = window.ENGINE;
  const T = window.I18N;
  const A = window.AUDIO;

  const SOFT_STOP_MIN = 25;

  let profile = null;
  let mapId = null;

  // ---- session state ----
  const session = {
    chars: 0, errors: 0, streak: 0, bestStreak: 0,
    activeMs: 0, linesDone: 0, wordsTyped: 0, collectedThisSession: 0,
  };
  let lastSoftStopAt = 0;

  // ---- line state ----
  let words = [];
  let lineText = '';
  let pos = 0;
  let erroredAt = -1;
  let attemptsAtPos = 0;
  let wordHadError = false;
  let lineErrors = 0;
  let lastCorrectTime = null;

  // ---- world state ----
  let dock = null;               // {id, kind:'machine'|'plot'|'node', m?, plot?, node?}
  let recipe = null;             // active recipe at a processor
  let unitAcc = 0;               // keystrokes into the current unit of output
  let unitPaid = false;          // inputs deducted for the current unit
  let dryNow = false;
  let alphabet = [];             // the current lesson's letters
  let menu = null;               // {rows:[{...row, action}], sel}
  let pendingUnlock = null;      // a pair just unlocked, card queued
  let pendingAutomation = [];
  let producedSinceFloat = {};

  // ---- DOM ----
  const $ = (id) => document.getElementById(id);
  const lineDisplay = $('line-display');
  const glossLine = $('gloss-line');
  const keyboardEl = $('keyboard');
  const overlay = $('overlay');
  const overlayCard = $('overlay-card');

  // ---------- keyboard rendering ----------
  const keycapEls = {};
  const KEY_U = 44, KEY_H = 42, ROW_PITCH = 47, HAND_GAP = 16;

  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    let maxRight = 0;
    for (const row of LAYOUT.KEY_GEOMETRY) {
      for (const key of row.keys) {
        const w = key.w || 1;
        const isRight = row.split !== null && key.x >= row.split;
        const isSpace = key.code === 'Space';
        const left = key.x * KEY_U + (isRight ? HAND_GAP : isSpace ? HAND_GAP / 2 : 0);
        const cap = document.createElement('div');
        cap.className = 'keycap';
        cap.dataset.code = key.code;
        const finger = LAYOUT.FINGER[key.code];
        if (finger) cap.classList.add('finger-' + finger);
        if (!isSpace) cap.classList.add(finger ? (finger[0] === 'l' ? 'hand-l' : 'hand-r') : (isRight ? 'hand-r' : 'hand-l'));
        if (LAYOUT.HOME_CODES.has(key.code)) cap.classList.add('home');
        if (key.inert) cap.classList.add('inert');
        if (isSpace) cap.classList.add('space');
        if (key.code === 'Slash') cap.innerHTML = '<span class="cap-shift">,</span>.';
        else cap.textContent = key.label ?? (LAYOUT.CODE_TO_CHAR[key.code] || '').toUpperCase();
        cap.style.left = left + 'px';
        cap.style.top = (row.y * ROW_PITCH) + 'px';
        cap.style.width = (w * KEY_U - 5) + 'px';
        keyboardEl.appendChild(cap);
        keycapEls[key.code] = cap;
        maxRight = Math.max(maxRight, left + w * KEY_U - 5);
      }
    }
    keyboardEl.style.width = maxRight + 'px';
    keyboardEl.style.height = (LAYOUT.KEY_GEOMETRY.length * ROW_PITCH - (ROW_PITCH - KEY_H)) + 'px';
  }

  // ---------- hints: recall first, rescue on hesitation ----------
  let hintTimer = null;
  function clearHint() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    for (const cap of Object.values(keycapEls)) {
      cap.classList.remove('hint');
      cap.style.removeProperty('--hint-strength');
    }
  }
  function hintDelayFor(ch) {
    if (ch === ' ') return 900;
    const s = profile.letters[ch];
    if (!s || s.n < 10) return 150;
    return 500 + 1700 * Math.min(1, E.readiness(profile, ch));
  }
  function applyHint() {
    const expected = lineText[pos];
    if (expected === undefined) return;
    const code = expected === ' ' ? 'Space' : LAYOUT.CHAR_TO_CODE[expected];
    const cap = keycapEls[code];
    if (!cap) return;
    const strength = expected === ' ' ? 0.2 : Math.max(0.35, 1 - Math.min(1, E.readiness(profile, expected)));
    cap.classList.add('hint');
    cap.style.setProperty('--hint-strength', strength.toFixed(2));
    if (LAYOUT.NEEDS_SHIFT.has(expected)) {
      const shiftCode = LAYOUT.FINGER[code]?.[0] === 'r' ? 'ShiftLeft' : 'ShiftRight';
      const shiftCap = keycapEls[shiftCode];
      if (shiftCap) {
        shiftCap.classList.add('hint');
        shiftCap.style.setProperty('--hint-strength', strength.toFixed(2));
      }
    }
  }
  function scheduleHint() {
    clearHint();
    const expected = lineText[pos];
    if (expected === undefined) return;
    hintTimer = setTimeout(applyHint, hintDelayFor(expected));
  }
  function refreshKeyboard() {
    const unlockedSet = new Set(E.unlockedLetters(profile));
    for (const [code, cap] of Object.entries(keycapEls)) {
      if (cap.classList.contains('inert')) continue;
      const ch = LAYOUT.CODE_TO_CHAR[code];
      if (ch === undefined || ch === ' ') continue;
      cap.classList.toggle('locked', !unlockedSet.has(ch));
    }
    scheduleHint();
  }
  // the lesson's letters light up
  function refreshLessonLights() {
    const set = canTypeHere() ? new Set(alphabet) : null;
    for (const [code, cap] of Object.entries(keycapEls)) {
      const ch = LAYOUT.CODE_TO_CHAR[code];
      cap.classList.toggle('lesson', !!(set && ch && set.has(ch)));
    }
  }

  // ---------- the bag ----------
  function gain(mat, n) {
    if (n <= 0) return;
    profile.bag[mat] = (profile.bag[mat] || 0) + n;
    if (!profile.seen[mat]) { profile.seen[mat] = true; }
    producedSinceFloat[mat] = (producedSinceFloat[mat] || 0) + n;
  }
  function spend(cost) {
    for (const [mat, n] of Object.entries(cost)) profile.bag[mat] = Math.max(0, (profile.bag[mat] || 0) - n);
  }
  const canPay = (cost) => CHAIN.affordable(profile.bag, cost);
  function flushFloats() {
    const parts = Object.entries(producedSinceFloat).filter(([, n]) => n > 0);
    if (parts.length && dock) {
      FACTORY.floatText(parts.map(([, n]) => `+${n}`).join(' '), dock.id);
      for (const [m, n] of parts) flyMat(m, dock.id, Math.min(n, 3));
      A.mint();
    }
    producedSinceFloat = {};
  }

  // The bag lives inside the game canvas as a pixel HUD (icons + bitmap
  // numbers). Rows are the materials the player has held, in tree order.
  let iconURLs = {};
  const invPrev = {};
  const countTimers = {};
  let hudKeysShown = [];
  const invValue = (k) => profile.bag[k] || 0;
  function hudKeys() {
    return CHAIN.MAT_IDS.filter((id) => profile.seen[id]);
  }
  function animateCount(key, from, to) {
    clearInterval(countTimers[key]);
    const delta = to - from;
    const steps = Math.min(8, Math.abs(delta));
    if (steps <= 1) { FACTORY.setInvValue(key, to); if (delta > 0) A.countTick(1); return; }
    let i = 0;
    countTimers[key] = setInterval(() => {
      i++;
      FACTORY.setInvValue(key, Math.round(from + (delta * i) / steps));
      if (delta > 0) A.countTick(i);
      if (i >= steps) clearInterval(countTimers[key]);
    }, 45);
  }
  function refreshInventory() {
    if (!profile) return;
    const keys = hudKeys();
    if (keys.join() !== hudKeysShown.join()) {
      hudKeysShown = keys;
      FACTORY.setHudKeys(keys);
      for (const k of keys) { if (!iconURLs[k]) iconURLs[k] = PIXELS.matIconURL(k); FACTORY.setInvValue(k, invPrev[k] === undefined ? invValue(k) : invPrev[k]); }
    }
    for (const k of keys) {
      const v = invValue(k);
      if (invPrev[k] === undefined) { invPrev[k] = v; FACTORY.setInvValue(k, v); continue; }
      if (v === invPrev[k]) continue;
      if (v > invPrev[k]) animateCount(k, invPrev[k], v);
      else { clearInterval(countTimers[k]); FACTORY.setInvValue(k, v); }
      invPrev[k] = v;
    }
  }
  function flyMat(mat, dockId, count) {
    const canvas = document.querySelector('#factory-mount canvas');
    if (!canvas || !iconURLs[mat]) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / canvas.width;
    const def = FACTORY.posOf(dockId);
    if (!def) return;
    const sp = FACTORY.screenPos(def.x + 13, def.y - 30);
    const sx = rect.left + sp.x * scale, sy = rect.top + sp.y * scale;
    const tp = FACTORY.invScreenPos(mat);
    if (!tp) return;
    const tx = rect.left + tp.x * scale, ty = rect.top + tp.y * scale;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = document.createElement('img');
      img.src = iconURLs[mat];
      img.className = 'fly-mat';
      img.style.left = sx + 'px';
      img.style.top = sy + 'px';
      document.body.appendChild(img);
      setTimeout(() => {
        img.style.transform = `translate(${tx - sx}px, ${ty - sy}px) scale(0.8)`;
        img.style.opacity = '0.2';
      }, 30 + i * 70);
      setTimeout(() => img.remove(), 750 + i * 70);
    }
  }

  // ---------- automation: the one rule (mines in this build) ----------
  const autoLive = (m) => !!(m && m.auto && m.kind === 'mine' && E.oreSticky(profile, m.ore));

  // ---------- recipes: the player chooses at the machine's menu ----------
  // A machine remembers its chosen recipe (m.recipe = output id). Until one
  // is chosen, the first recipe it offers (the authored order) is the
  // default. No silent switching: an unaffordable choice runs dry and shows ✗.
  function pickRecipe(m) {
    if (!m || m.kind === 'mine') return null;
    const offered = CHAIN.offerableRecipes(m.kind, profile);
    if (!offered.length) return null;
    const chosen = m.recipe ? offered.find((r) => r.out === m.recipe && JSON.stringify(r.in) === m.recipeIn) : null;
    if (chosen) return chosen;
    const r = offered[0];
    m.recipe = r.out; m.recipeIn = JSON.stringify(r.in);
    return r;
  }
  function lessonFor() {
    if (!dock || dock.kind !== 'machine') return null;
    const m = dock.m;
    if (m.kind === 'mine') {
      const letters = CHAIN.oreLetters(m.ore, CHAIN.oreMk(profile, m.ore));
      const mode = letters.filter((c) => !L.PUNCT.has(c)).length <= 2 ? 'keys' : 'letters';
      return { mode, alphabet: letters, tilt: null };
    }
    if (!recipe) return null;
    const kind = CHAIN.KINDS[m.kind];
    return { mode: kind.grammar, alphabet: CHAIN.recipeAlphabet(recipe, profile), tilt: kind.full ? null : CHAIN.recipeTilt(recipe, profile) };
  }
  const canTypeHere = () => !!(dock && dock.kind === 'machine' && !autoLive(dock.m) && (dock.m.kind === 'mine' || recipe));

  // per correct letter: mines yield an ore; processors pay for a unit at its
  // first keystroke and emit at its last
  function workKeystroke() {
    const m = dock.m;
    if (m.kind === 'mine') { gain(m.ore, 1); return; }
    if (!recipe) return;
    const kind = CHAIN.KINDS[m.kind];
    if (!unitPaid) {
      if (canPay(recipe.in)) { spend(recipe.in); unitPaid = true; if (dryNow) { dryNow = false; refreshInfo(); } }
      else { if (!dryNow) { dryNow = true; refreshInfo(); } return; }   // starved: runs dry, still trains
    }
    unitAcc++;
    if (unitAcc >= kind.perUnit) {
      unitAcc = 0; unitPaid = false;
      gain(recipe.out, 1);
    }
  }

  // ---------- place menus ----------
  function menuRowsFor(d) {
    if (!d) return [];
    const rows = [];
    if (d.kind === 'plot') {
      for (const k of CHAIN.buildableKinds(profile)) {
        const price = CHAIN.priceMachine(k, CHAIN.machinesOfKind(profile, k).length + 1);
        rows.push({ kind: k, items: price, enabled: canPay(price), action: { type: 'build-machine', kind: k, plot: d.plot.id, price } });
      }
    } else if (d.kind === 'crossing') {
      const price = CHAIN.priceCrossing(d.crossing) || {};
      rows.push({ pre: '→', items: price, enabled: canPay(price), action: { type: 'repair', id: d.crossing.id, price } });
    } else if (d.kind === 'node') {
      const ore = d.node.ore;
      if (CHAIN.oreOpen(profile, ore)) {
        const price = CHAIN.priceExtraMine(ore);
        rows.push({ kind: 'mine', ore, items: price, enabled: canPay(price), action: { type: 'build-mine', ore, node: d.node.index, price } });
      } else {
        const np = CHAIN.nextPair(profile);
        const price = CHAIN.PRICES.node[ore] || {};
        if (np && np.ore === ore && np.mk === 1) {
          const gate = E.gateProgress(profile);
          rows.push({ kind: 'mine', ore, items: price, gauge: gate.min, enabled: gate.ready && canPay(price), action: { type: 'build-mine', ore, node: d.node.index, price, unlock: true } });
        } else {
          rows.push({ kind: 'mine', ore, items: price, ok: false, enabled: false, action: null });
        }
      }
    } else if (d.kind === 'machine' && d.m.kind === 'mine') {
      const m = d.m, ore = m.ore;
      const mk = CHAIN.oreMk(profile, ore);
      const np = CHAIN.nextPair(profile);
      if (mk < CHAIN.oreMaxMk(ore)) {
        const price = CHAIN.priceMk(ore, mk + 1) || {};
        if (np && np.ore === ore && np.mk === mk + 1) {
          const gate = E.gateProgress(profile);
          rows.push({ pre: 'MK' + (mk + 1), items: price, gauge: gate.min, enabled: gate.ready && canPay(price), action: { type: 'mk', ore, level: mk + 1, price } });
        } else {
          rows.push({ pre: 'MK' + (mk + 1), items: price, ok: false, enabled: false, action: null });
        }
      }
      if (!m.auto) {
        const price = CHAIN.priceAuto(m);
        const mastered = E.oreSticky(profile, ore);
        rows.push({ pre: '⚙', items: price, ok: mastered ? undefined : false, enabled: mastered && canPay(price), action: { type: 'auto', m, price } });
      } else if (autoLive(m)) {
        const cap = CHAIN.TUNING.PICKUP_CAP;
        rows.push({ pre: '↓', ore, enabled: (profile.bag[ore] || 0) < cap, action: { type: 'collect', m } });
      }
    } else if (d.kind === 'machine') {
      // a processor's menu: its recipes — choose what this machine makes
      const m = d.m;
      for (const r of CHAIN.offerableRecipes(m.kind, profile)) {
        const active = recipe === r;
        rows.push({ items: r.in, out: r.out, ok: active ? true : undefined, enabled: true, action: { type: 'recipe', m, r } });
      }
    }
    return rows;
  }
  function openMenu() {
    const rows = menuRowsFor(dock);
    if (!rows.length) return false;
    let sel = rows.findIndex((r) => r.enabled !== false);
    if (sel < 0) sel = 0;
    menu = { rows, sel };
    FACTORY.showMenu(dock.id, rows, sel);
    A.click();
    return true;
  }
  function closeMenu() {
    menu = null;
    FACTORY.clearMenu();
  }
  function moveMenu(dir) {
    if (!menu) return;
    const n = menu.rows.length;
    menu.sel = (menu.sel + dir + n) % n;
    FACTORY.showMenu(dock.id, menu.rows, menu.sel);
    A.click();
  }
  function confirmMenu() {
    if (!menu) return;
    const row = menu.rows[menu.sel];
    if (!row || row.enabled === false || !row.action) { A.thud(); return; }
    performAction(row.action);
    closeMenu();
  }

  // ---------- actions ----------
  function performAction(act) {
    if (act.type === 'build-machine') {
      if (!canPay(act.price)) return;
      spend(act.price);
      profile.machines.push({ id: 'm' + (profile.nextMachineId++), kind: act.kind, plot: act.plot, auto: false });
      afterPurchase();
    } else if (act.type === 'build-mine') {
      if (!canPay(act.price)) return;
      let pair = null;
      if (act.unlock) {
        if (!E.pairReady(profile)) return;
        pair = E.unlockNextPair(profile);
      }
      spend(act.price);
      profile.machines.push({ id: 'm' + (profile.nextMachineId++), kind: 'mine', ore: act.ore, node: act.node, auto: false });
      afterPurchase();
      if (pair) { pendingUnlock = pair; showUnlockCard(pair); }
    } else if (act.type === 'mk') {
      if (!canPay(act.price) || !E.pairReady(profile)) return;
      const np = CHAIN.nextPair(profile);
      if (!np || np.ore !== act.ore || np.mk !== act.level) return;
      spend(act.price);
      const pair = E.unlockNextPair(profile);
      afterPurchase();
      if (pair) { pendingUnlock = pair; showUnlockCard(pair); }
    } else if (act.type === 'auto') {
      if (!canPay(act.price) || !E.oreSticky(profile, act.m.ore)) return;
      spend(act.price);
      act.m.auto = true;
      afterPurchase();
      showBenchAutoCard(act.m);
    } else if (act.type === 'recipe') {
      act.m.recipe = act.r.out; act.m.recipeIn = JSON.stringify(act.r.in);
      recipe = act.r;
      unitAcc = 0; unitPaid = false; dryNow = false;
      E.saveProfile(profile);
      newLine();
      refreshStatus();
      A.click();
    } else if (act.type === 'repair') {
      if (!canPay(act.price)) return;
      spend(act.price);
      profile.crossings[act.id] = true;
      afterPurchase();
      A.fanfare();
    } else if (act.type === 'collect') {
      const m = act.m, cap = CHAIN.TUNING.PICKUP_CAP;
      const have = profile.bag[m.ore] || 0;
      if (have >= cap) return;
      gain(m.ore, cap - have);
      flyMat(m.ore, dock.id, 5);
      FACTORY.floatText(`+${cap - have}`, dock.id, 0x7fb98a);
      A.ding();
      producedSinceFloat = {};
      E.saveProfile(profile);
      refreshInventory();
      refreshStatus();
    }
  }
  function afterPurchase() {
    E.saveProfile(profile);
    rebuildWorld();
    refreshInventory();
    refreshKeyboard();
    redock();
    A.build();
  }
  function rebuildWorld() {
    if (!profile) return;
    FACTORY.buildWorld(profile, autoLive);
  }

  // ---------- Enter-action + dock glow (icons in-world carry the info) ----------
  function refreshStatus() {
    if (!profile) return;
    const rows = menu ? menu.rows : menuRowsFor(dock);
    const any = rows.some((r) => r.enabled !== false);
    FACTORY.setDockGlow(any ? 0x7fb98a : 0xc9a24a);
    refreshInfo();
  }
  // info rows above the docked machine: its recipes, the chosen one bright
  // (with ✗ while the bag can't pay for it)
  function refreshInfo() {
    if (!dock || dock.kind !== 'machine' || dock.m.kind === 'mine') { FACTORY.clearInfo(); return; }
    const offered = CHAIN.offerableRecipes(dock.m.kind, profile).slice(0, 4);
    if (!offered.length) { FACTORY.showInfo(dock.id, [{ pre: '✗', enabled: false }]); return; }
    FACTORY.showInfo(dock.id, offered.map((r) => ({ items: r.in, out: r.out, enabled: r === recipe, ok: r === recipe && !canPay(r.in) && !unitPaid ? false : undefined })));
  }

  // ---------- line rendering ----------
  function newLine() {
    const lesson = lessonFor();
    if (!lesson || !canTypeHere()) { clearLine(); return; }
    alphabet = lesson.alphabet;
    words = E.generateLine(profile, lesson);
    lineText = words.map((w) => w.text + (w.punct || '')).join(' ');
    pos = 0;
    erroredAt = -1;
    attemptsAtPos = 0;
    wordHadError = false;
    lineErrors = 0;
    renderLine();
    refreshKeyboard();
    refreshLessonLights();
  }
  function clearLine() {
    words = []; lineText = ''; pos = 0;
    lineDisplay.innerHTML = '';
    clearHint();
  }
  function renderLine() {
    lineDisplay.innerHTML = '';
    const current = document.createElement('div');
    current.className = 'line current-line';
    [...lineText].forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.className = 'ch';
      if (i < pos) span.classList.add('done');
      if (i === pos) span.classList.add('caret');
      current.appendChild(span);
    });
    lineDisplay.appendChild(current);
  }
  function advanceCaret() {
    const spans = lineDisplay.querySelectorAll('.current-line .ch');
    if (spans[pos - 1]) { spans[pos - 1].classList.add('done'); spans[pos - 1].classList.remove('caret', 'err'); }
    if (spans[pos]) spans[pos].classList.add('caret');
  }
  function flashError() {
    const spans = lineDisplay.querySelectorAll('.current-line .ch');
    const span = spans[pos];
    if (!span) return;
    span.classList.add('err');
    setTimeout(() => span.classList.remove('err'), 250);
  }

  // ---------- gloss ----------
  let glossTimer = null;
  function showGloss(word, justCollected) {
    if (!word.gloss) return;
    const mark = justCollected ? ` <span class="collect-mark">🎫 ${T.t('collectedMark')}</span>` : '';
    glossLine.innerHTML = `<b>${word.text}</b> — ${word.gloss}${mark}`;
    glossLine.classList.add('visible');
    clearTimeout(glossTimer);
    glossTimer = setTimeout(() => glossLine.classList.remove('visible'), 3500);
  }
  function collectWord(word, clean) {
    if (!word.gloss) return false;
    const c = profile.collected[word.text];
    if (c) { c.n++; if (clean) c.clean++; return false; }
    profile.collected[word.text] = { n: 1, clean: clean ? 1 : 0, at: Date.now() };
    session.collectedThisSession++;
    A.ding();
    return true;
  }
  function isRareWord(w) { return [...w].some((c) => L.RARE_LETTERS.has(c)); }

  // ---------- stats ----------
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function sessionAccuracy() {
    const attempts = session.chars + session.errors;
    return attempts === 0 ? null : session.chars / attempts;
  }
  function sessionWPM() {
    if (session.activeMs < 10000) return null;
    return (session.chars / 5) / (session.activeMs / 60000);
  }
  function refreshStats() {
    const acc = sessionAccuracy();
    $('stat-acc').textContent = acc === null ? '—' : (acc * 100).toFixed(1) + '%';
    const wpm = sessionWPM();
    $('stat-wpm').textContent = wpm === null ? '—' : wpm.toFixed(0);
    $('stat-streak').textContent = session.streak;
    $('stat-time').textContent = fmtTime(session.activeMs);
  }

  // ---------- input ----------
  // ONE interact key, two things at once. On press: if the drill's next
  // character is a space, it is typed right then (never on release, and a
  // held space that isn't the next character costs nothing). Holding for half
  // a second (a charge bar fills above the operator) opens the place's menu,
  // or confirms the highlighted row when a menu is open. Releasing early with
  // a menu open closes it.
  const HOLD_MS = 500;
  let spaceState = null;   // {done}
  let chargeTimer = null;

  function cancelCharge() {
    if (chargeTimer) { clearInterval(chargeTimer); chargeTimer = null; }
    FACTORY.setCharge(null);
  }
  function startSpace() {
    if (spaceState) return;
    spaceState = { done: false };
    // the typed space, at once — only when it is the next character
    if (!menu && canTypeHere() && lineText[pos] === ' ') handleTyped(' ');
    const canOpen = !menu && menuRowsFor(dock).length > 0;
    if (!menu && !canOpen) return;
    const start = performance.now();
    FACTORY.setCharge(0);
    chargeTimer = setInterval(() => {
      const p = (performance.now() - start) / HOLD_MS;
      FACTORY.setCharge(Math.min(1, p));
      if (p >= 1) {
        cancelCharge();
        if (spaceState) spaceState.done = true;
        if (menu) confirmMenu(); else openMenu();
        refreshStatus();
      }
    }, 33);
  }
  function endSpace() {
    if (!spaceState) return;
    const wasCharging = !!chargeTimer;
    cancelCharge();
    if (wasCharging && !spaceState.done && menu) { closeMenu(); refreshStatus(); }
    spaceState = null;
  }

  // debug: Ctrl+Alt+M — 100 of every material that exists for this save
  // (ores you've opened, and anything a ready machine could make from them)
  function debugMaterials() {
    let n = 0;
    for (const mat of CHAIN.MAT_IDS) {
      const spec = CHAIN.MATS[mat];
      let exists = false;
      if (spec.form === 'ore') exists = CHAIN.oreOpen(profile, mat);
      else {
        const r = CHAIN.recipeFor(mat);
        exists = !!(r && CHAIN.KINDS[r.kind].ready && CHAIN.matExists(profile, mat));
      }
      if (!exists) continue;
      profile.bag[mat] = (profile.bag[mat] || 0) + 100;
      profile.seen[mat] = true;
      n++;
    }
    E.saveProfile(profile);
    refreshInventory();
    refreshStatus();
    if (dock) FACTORY.floatText(`+100×${n}`, dock.id, 0x7fb98a);
    A.fanfare();
  }

  window.addEventListener('keydown', (e) => {
    const overlayOpen = !overlay.classList.contains('hidden');
    const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (e.ctrlKey && e.altKey && e.code === 'KeyM' && !overlayOpen && profile) {
      e.preventDefault();
      debugMaterials();
      return;
    }
    if (ARROWS[e.code]) {
      e.preventDefault();
      if (overlayOpen) return;
      if (menu) {
        if (!e.repeat) moveMenu(e.code === 'ArrowUp' || e.code === 'ArrowLeft' ? -1 : 1);
        return;
      }
      FACTORY.setMove(ARROWS[e.code], true);
      return;
    }
    if (e.code === 'Escape' && menu && !overlayOpen) { e.preventDefault(); closeMenu(); refreshStatus(); return; }
    if (e.code === 'Space' && !overlayOpen) {
      e.preventDefault();
      if (!e.repeat) startSpace();
      return;
    }
    if (overlayOpen || menu) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return;
    if (!canTypeHere()) return;
    const typed = e.shiftKey ? LAYOUT.SHIFTED_CODE_TO_CHAR[e.code] : LAYOUT.CODE_TO_CHAR[e.code];
    if (typed === undefined) {
      if (e.code === 'Backspace') e.preventDefault();
      return;
    }
    e.preventDefault();
    handleTyped(typed);
  });
  window.addEventListener('keyup', (e) => {
    const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (ARROWS[e.code]) FACTORY.setMove(ARROWS[e.code], false);
    if (e.code === 'Space') endSpace();
  });

  function handleTyped(typed) {
    const expected = lineText[pos];
    if (expected === undefined) return;

    if (typed === expected) {
      const now = performance.now();
      let latency = null;
      if (lastCorrectTime !== null) {
        const gap = now - lastCorrectTime;
        if (gap <= E.MAX_LATENCY) { latency = gap; session.activeMs += gap; }
      }
      lastCorrectTime = now;

      if (expected !== ' ') E.recordHit(profile, expected, latency);
      session.chars++;
      session.streak++;
      if (session.streak > session.bestStreak) session.bestStreak = session.streak;
      profile.totalChars++;

      A.click();
      A.onKey(latency);

      if (expected !== ' ') {
        FACTORY.castLetter(true);
        workKeystroke();
      }

      pos++;
      attemptsAtPos = 0;
      advanceCaret();

      if (lineText[pos] === ' ' || pos >= lineText.length) {
        const endedIdx = lineText.slice(0, pos).split(' ').length - 1;
        const word = words[endedIdx];
        if (word) {
          session.wordsTyped++;
          const clean = !wordHadError;
          const justCollected = collectWord(word, clean);
          showGloss(word, justCollected);
          flushFloats();
          refreshInventory();
          refreshStatus();
        }
        wordHadError = false;
      }

      if (pos >= lineText.length) finishLine();
      else scheduleHint();
      refreshStats();
    } else {
      attemptsAtPos++;
      if (erroredAt !== pos) {
        erroredAt = pos;
        session.errors++;
        lineErrors++;
        profile.totalErrors++;
        if (expected !== ' ') E.recordMiss(profile, expected);
        session.streak = 0;
        wordHadError = true;
      }
      A.thud();
      FACTORY.castLetter(false);
      flashError();
      clearHint();
      applyHint();
      refreshStats();
    }
  }

  // ---------- line completion / world progression ----------
  function finishLine() {
    session.linesDone++;
    lastCorrectTime = null;
    FACTORY.stamp();
    A.press();
    flushFloats();
    refreshInventory();

    pendingAutomation.push(...E.updateAutomation(profile));
    E.saveProfile(profile);
    // an automated mine whose letters just went sticky changes look
    if (dock && dock.kind === 'machine' && dock.m.kind === 'mine' && dock.m.auto && autoLive(dock.m)) {
      FACTORY.setAutoLook(dock.id, true);
    }
    // the bag may now pay for a different recipe
    if (dock && dock.kind === 'machine' && dock.m.kind !== 'mine') recipe = pickRecipe(dock.m);
    refreshStatus();

    if (session.activeMs > SOFT_STOP_MIN * 60000 && session.activeMs - lastSoftStopAt > 10 * 60000) {
      lastSoftStopAt = session.activeMs;
      showSoftStopCard();
      return;
    }
    proceedAfterLine();
  }
  function proceedAfterLine() {
    if (pendingAutomation.length) {
      showAutomationCard(pendingAutomation.shift());
      return;
    }
    newLine();
  }

  // ---------- docking ----------
  FACTORY.onDock = (id) => {
    closeMenu();
    dock = null;
    if (id && id.startsWith('m:')) {
      const m = profile.machines.find((x) => 'm:' + x.id === id);
      if (m) dock = { id, kind: 'machine', m };
    } else if (id && id.startsWith('plot:')) {
      const plot = CHAIN.plotById(id.slice(5));
      if (plot) dock = { id, kind: 'plot', plot };
    } else if (id && id.startsWith('node:')) {
      const node = CHAIN.unbuiltNodes(profile).find((n) => 'node:' + n.index === id);
      if (node) dock = { id, kind: 'node', node };
    } else if (id && id.startsWith('cross:')) {
      const crossing = CHAIN.closedCrossings(profile).find((c) => 'cross:' + c.id === id);
      if (crossing) dock = { id, kind: 'crossing', crossing };
    }
    recipe = dock && dock.kind === 'machine' ? pickRecipe(dock.m) : null;
    unitAcc = 0; unitPaid = false; dryNow = false;
    lastCorrectTime = null;
    glossLine.classList.remove('visible');
    if (canTypeHere()) newLine(); else clearLine();
    refreshLessonLights();
    refreshStatus();
  };
  const redock = () => FACTORY.onDock(FACTORY.getDocked());

  // ---------- overlays ----------
  let overlayRerender = null;
  function showOverlay(html, wide) {
    clearHint();
    FACTORY.setMove('left', false);
    FACTORY.setMove('right', false);
    FACTORY.setMove('up', false);
    FACTORY.setMove('down', false);
    overlayCard.classList.toggle('wide', !!wide);
    overlayCard.innerHTML = html;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
    overlayRerender = null;
  }

  function showUnlockCard(pair) {
    overlayRerender = () => showUnlockCard(pair);
    const keys = pair.keys;
    const first = keys[0];
    const code = LAYOUT.CHAR_TO_CODE[first];
    let finger = T.fingerName(LAYOUT.FINGER[code]);
    if (LAYOUT.NEEDS_SHIFT.has(first)) finger = T.t('shiftFinger', { finger });
    const freq = keys.reduce((a, k) => a + (L.LETTER_FREQ[k] || 0), 0).toFixed(1);
    const big = keys.map((k) => (L.PUNCT.has(k) ? k : k.toUpperCase() + ' ' + k)).join(' · ');
    const title = T.t('unlockTitlePair', { keys: `<span class="big-letter">${big}</span>` });
    showOverlay(`
      <div class="card-station">${T.t('unlockStation')}</div>
      <h2>${title}</h2>
      <p class="muted">${T.t('unlockMeta', { finger, freq })}</p>
      <p>${T.t('unlockNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('unlockGo')}</button>
    `);
    const caps = keys.map((k) => keycapEls[LAYOUT.CHAR_TO_CODE[k]]).filter(Boolean);
    for (const cap of caps) { cap.classList.remove('locked'); cap.classList.add('unlock-glow'); }
    $('ov-continue').onclick = () => {
      for (const cap of caps) cap.classList.remove('unlock-glow');
      hideOverlay();
      pendingUnlock = null;
      lastCorrectTime = null;
      redock();
    };
    $('ov-continue').focus();
  }
  function showAutomationCard(ch) {
    overlayRerender = () => showAutomationCard(ch);
    A.fanfare();
    showOverlay(`
      <div class="card-station">${T.t('automationStation')}</div>
      <h2>${T.t('automationTitle', { ch })}</h2>
      <p>${T.t('automationNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('automationGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); lastCorrectTime = null; proceedAfterLine(); };
    $('ov-continue').focus();
  }
  function showBenchAutoCard(m) {
    overlayRerender = () => showBenchAutoCard(m);
    A.fanfare();
    showOverlay(`
      <div class="card-station">${T.t('benchAutoStation')}</div>
      <h2>${T.t('benchAutoTitle', { name: T.t('oreMineNames')[m.ore] || m.ore })}</h2>
      <p>${T.t('benchAutoNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('automationGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); };
    $('ov-continue').focus();
  }
  function showSoftStopCard() {
    overlayRerender = showSoftStopCard;
    showOverlay(`
      <div class="card-station">🌅</div>
      <p class="soft-stop">${T.t('softStop', { min: Math.round(session.activeMs / 60000) })}</p>
      <button id="ov-continue" class="btn-primary">${T.t('blockGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); proceedAfterLine(); };
    $('ov-continue').focus();
  }

  function weakestLetters(n) {
    return E.unlockedLetters(profile)
      .filter(E.trainable)
      .map((ch) => ({ ch, r: E.readiness(profile, ch), stats: profile.letters[ch] }))
      .filter((x) => x.stats.n > 0)
      .sort((a, b) => a.r - b.r)
      .slice(0, n);
  }
  function showSessionSummary() {
    overlayRerender = showSessionSummary;
    const weakest = weakestLetters(3)
      .map((x) => `<span class="weak-chip">${x.ch} <small>${Math.round(Math.min(1, x.r) * 100)}%</small></span>`)
      .join(' ');
    const next = E.nextPair(profile);
    const gate = E.gateProgress(profile);
    showOverlay(`
      <div class="card-station">${T.t('blockStation')}</div>
      <h2>${T.t('blockLines', { n: session.linesDone })}</h2>
      <div class="summary-grid">
        <div><span class="sum-val">${sessionAccuracy() === null ? '—' : (sessionAccuracy() * 100).toFixed(1) + '%'}</span><span class="sum-label">${T.t('sumAccuracy')}</span></div>
        <div><span class="sum-val">${sessionWPM() === null ? '—' : sessionWPM().toFixed(0)}</span><span class="sum-label">${T.t('sumWpm')}</span></div>
        <div><span class="sum-val">${session.bestStreak}</span><span class="sum-label">${T.t('sumStreak')}</span></div>
      </div>
      <p class="muted">${T.t('weakLetters')} ${weakest || '—'}</p>
      ${next ? `<p class="muted">${T.t('progressTo', { ch: next.keys.join(' '), pct: Math.round(gate.min * 100) })}</p>` : `<p class="muted">${T.t('allUnlocked')}</p>`}
      <button id="ov-continue" class="btn-primary">${T.t('blockGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); };
    $('ov-continue').focus();
  }

  function showWelcome() {
    overlayRerender = showWelcome;
    const rules = T.t('welcomeRules').map((r) => `<li>${r}</li>`).join('');
    showOverlay(`
      <div class="card-station">⛏ ${T.t('mapNames')[mapId]}</div>
      <img class="pix-scene" src="${PIXELS.vignetteURL()}" width="300" height="144" alt="">
      <h2>${T.t('welcomeTitle')}</h2>
      <p>${T.t('welcomeIntro')}</p>
      <ul class="rules">${rules}</ul>
      <button id="ov-continue" class="btn-primary">${T.t('welcomeGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); };
    $('ov-continue').focus();
  }

  // ---------- the map picker: which world to play ----------
  const thumbCache = {};
  let thumbScale = 0;
  function mapThumb(id) {
    if (!thumbScale) {
      const widest = Math.max(...CHAIN.MAP_IDS.map((k) => Math.ceil(CHAIN.MAPS[k].W / 16)));
      thumbScale = Math.max(1, Math.min(4, Math.floor(224 / widest)));
    }
    if (!thumbCache[id]) {
      const m = CHAIN.MAPS[id];
      const c = TILES.minimap(m.MAP, m.W, m.H, thumbScale);
      thumbCache[id] = { url: c.toDataURL(), w: c.width, h: c.height };
    }
    return thumbCache[id];
  }
  function fmtDay(ts) {
    const d = new Date(ts), now = new Date();
    const day = (x) => Math.floor((x - new Date(x).getTimezoneOffset() * 60000) / 86400000);
    const diff = day(now.getTime()) - day(ts);
    if (diff <= 0) return T.t('dayToday');
    if (diff === 1) return T.t('dayYesterday');
    return d.toLocaleDateString(T.getLang() === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
  }
  function showMapSelect() {
    overlayRerender = showMapSelect;
    const focusId = mapId || E.getLastMap() || CHAIN.DEFAULT_MAP;
    const cards = CHAIN.MAP_IDS.map((id) => {
      const peek = E.peekProfile(id);
      const th = mapThumb(id);
      const progress = peek && peek.totalChars > 0
        ? `${T.t('mapProgress', { letters: peek.letters, machines: peek.machines, chars: peek.totalChars })}${peek.savedAt ? ` · ${T.t('mapLast', { day: fmtDay(peek.savedAt) })}` : ''}`
        : T.t('mapNew');
      const go = peek && peek.totalChars > 0 ? T.t('mapContinue') : T.t('mapPlay');
      const cur = id === mapId ? ' current' : '';
      return `
        <button class="map-card${cur}" data-map="${id}">
          <span class="map-thumb"><img src="${th.url}" width="${th.w}" height="${th.h}" alt=""></span>
          <b>${T.t('mapNames')[id]}</b>
          <span class="map-tagline">${T.t('mapTaglines')[id]}</span>
          <span class="map-progress">${progress}</span>
          <span class="map-go">${go}</span>
        </button>`;
    }).join('');
    const langBtns = T.LANGS.map((l) =>
      `<button class="seg-btn${l === T.getLang() ? ' active' : ''}" data-lang="${l}">${l === 'ru' ? 'РУ' : l.toUpperCase()}</button>`).join('');
    showOverlay(`
      <div class="card-station">${T.t('mapSelectStation')}</div>
      <h2>${T.t('mapSelectTitle')}</h2>
      <p class="muted">${T.t('mapSelectNote')}</p>
      <div class="map-cards" id="map-cards">${cards}</div>
      <div class="map-foot">
        <span class="seg" id="map-lang">${langBtns}</span>
        ${mapId ? `<button id="ov-cancel" class="link-btn">${T.t('mapSelectBack')}</button>` : ''}
      </div>
    `, true);
    document.querySelectorAll('#map-lang .seg-btn').forEach((b) => {
      b.onclick = () => { T.setLang(b.dataset.lang); applyI18n(); showMapSelect(); };
    });
    const btns = [...document.querySelectorAll('#map-cards .map-card')];
    btns.forEach((b) => { b.onclick = () => startMap(b.dataset.map); });
    $('map-cards').onkeydown = (e) => {
      const i = btns.indexOf(document.activeElement);
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        const j = i < 0 ? 0 : (i + (e.code === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length;
        btns[j].focus();
      } else if ((e.code === 'Enter' || e.code === 'Space') && i >= 0) {
        if (!e.repeat) startMap(btns[i].dataset.map);
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    if ($('ov-cancel')) $('ov-cancel').onclick = () => hideOverlay();
    (btns.find((b) => b.dataset.map === focusId) || btns[0]).focus();
  }

  function startMap(id) {
    if (!CHAIN.MAPS[id]) id = CHAIN.DEFAULT_MAP;
    if (id === mapId && profile) { hideOverlay(); return; }
    if (profile) E.saveProfile(profile);
    mapId = id;
    CHAIN.useMap(id);
    profile = E.loadProfile(id);
    E.setLastMap(id);

    dock = null; recipe = null; menu = null;
    pendingUnlock = null; pendingAutomation = [];
    unitAcc = 0; unitPaid = false; dryNow = false; lastCorrectTime = null;
    producedSinceFloat = {};
    for (const k of Object.keys(invPrev)) delete invPrev[k];
    for (const k of Object.keys(countTimers)) clearInterval(countTimers[k]);
    hudKeysShown = [];
    cancelCharge(); spaceState = null;

    FACTORY.loadMap();
    rebuildWorld();
    clearLine();
    refreshInventory();
    refreshKeyboard();
    refreshLessonLights();
    refreshStatus();
    hideOverlay();
    if (profile.totalChars === 0) showWelcome();
  }

  // ---------- passport ----------
  function showPassport() {
    overlayRerender = showPassport;
    const bySet = {};
    for (const [w, gloss, set] of L.WORDS) (bySet[set] = bySet[set] || []).push([w, gloss]);
    const have = Object.keys(profile.collected).length;
    let sections = '';
    for (const set of L.WORD_SETS) {
      const list = bySet[set] || [];
      if (!list.length) continue;
      const got = list.filter(([w]) => profile.collected[w]).length;
      const chips = list.map(([w, gloss]) => {
        if (profile.collected[w]) {
          const rare = isRareWord(w) ? ' rare' : '';
          const rareTitle = isRareWord(w) ? ` · ${T.t('passportRare')}` : '';
          return `<span class="pw${rare}" title="${gloss}${rareTitle}">${w}</span>`;
        }
        return `<span class="pw locked">···</span>`;
      }).join('');
      const done = got === list.length ? ' ✦' : '';
      sections += `<div class="pw-set"><h3>${T.t('setNames')[set] || set} <small>${got}/${list.length}${done}</small></h3><div class="pw-grid">${chips}</div></div>`;
    }
    showOverlay(`
      <div class="card-station">🎫</div>
      <h2>${T.t('passportTitle')}</h2>
      <p class="muted">${T.t('passportCount', { have, total: L.WORDS.length })}</p>
      <div id="passport-body">${sections}</div>
      <button id="ov-continue" class="btn-primary">${T.t('passportClose')}</button>
    `);
    $('ov-continue').onclick = () => hideOverlay();
    $('ov-continue').focus();
  }

  // ---------- footer / header ----------
  $('btn-summary').onclick = () => { if (profile) showSessionSummary(); };
  $('btn-passport').onclick = () => { if (profile) showPassport(); };

  const soundBtn = $('btn-sound');
  function refreshSoundBtn() { soundBtn.textContent = A.isEnabled() ? '🔊' : '🔇'; }
  soundBtn.onclick = () => { A.setEnabled(!A.isEnabled()); refreshSoundBtn(); soundBtn.blur(); };

  // ---------- settings ----------
  const DONATE = [
    { label: 'Buy me a beer', sub: 'PayPal · cards & balance', url: 'https://paypal.me/HighRiskAsset', coins: ['$', '£', '€'] },
    { label: 'Оставить на пиво', sub: 'YooMoney · ₽ RUB', url: 'https://yoomoney.ru/to/4100119579691782', coins: ['₽'] },
  ];
  const showResetConfirm = () => {
    overlayRerender = showResetConfirm;
    showOverlay(`
      <h2>${T.t('resetTitle', { map: T.t('mapNames')[mapId] })}</h2>
      <p class="muted">${T.t('resetNote', { map: T.t('mapNames')[mapId] })}</p>
      <button id="ov-cancel" class="btn-primary">${T.t('resetCancel')}</button>
      <button id="ov-reset" class="link-btn danger">${T.t('resetConfirm')}</button>
    `);
    $('ov-cancel').onclick = () => showSettings();
    $('ov-reset').onclick = () => {
      E.resetProfile(mapId);
      profile = null;
      buildKeyboard();
      startMap(mapId);
    };
  };

  function exportSave() {
    E.saveProfile(profile);
    const data = {
      app: 'mechanical-keyboarding', kind: 'save', version: 2,
      exportedAt: new Date().toISOString(),
      map: mapId,
      profile,
      sound: A.isEnabled(),
      uilang: T.getLang(),
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `mechanical-keyboarding-save-${mapId}-${data.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function pickImportFile() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f) f.text().then(handleImportText, showImportError);
    };
    inp.click();
  }
  function handleImportText(text) {
    let data = null;
    try { data = JSON.parse(text); } catch { /* invalid JSON → error card below */ }
    if (!data || data.app !== 'mechanical-keyboarding' || !data.profile || (data.profile.version !== 1 && data.profile.version !== 2)) {
      showImportError();
      return;
    }
    const m = [data.map, data.profile.map].find((id) => id && CHAIN.MAPS[id]);
    data.map = m || CHAIN.DEFAULT_MAP;
    showImportConfirm(data);
  }
  function showImportError() {
    overlayRerender = showImportError;
    showOverlay(`
      <div class="card-station">⚙ ${T.t('settingsTitle')}</div>
      <p class="muted">${T.t('importErrNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('resetCancel')}</button>
    `);
    $('ov-continue').onclick = () => showSettings();
    $('ov-continue').focus();
  }
  function showImportConfirm(data) {
    overlayRerender = () => showImportConfirm(data);
    const date = data.exportedAt ? String(data.exportedAt).slice(0, 10) : null;
    const mapName = T.t('mapNames')[data.map];
    showOverlay(`
      <h2>${T.t('importConfirmTitle')}</h2>
      ${date ? `<p class="muted">${T.t('importMeta', { date, map: mapName })}</p>` : `<p class="muted">${T.t('importMap', { map: mapName })}</p>`}
      <p class="muted">${T.t('importConfirmNote', { map: mapName })}</p>
      <button id="ov-cancel" class="btn-primary">${T.t('resetCancel')}</button>
      <button id="ov-load" class="link-btn danger">${T.t('importConfirmGo')}</button>
    `);
    $('ov-cancel').onclick = () => showSettings();
    $('ov-load').onclick = () => {
      data.profile.map = data.map;
      E.saveProfile(data.profile);   // v1 files migrate on the next load
      E.setLastMap(data.map);
      if (typeof data.sound === 'boolean') A.setEnabled(data.sound);
      if (data.uilang) T.setLang(data.uilang);
      profile = null;
      location.reload();
    };
  }
  function showSettings() {
    overlayRerender = showSettings;
    const langBtns = T.LANGS.map((l) =>
      `<button class="seg-btn${l === T.getLang() ? ' active' : ''}" data-lang="${l}">${l === 'ru' ? 'РУ' : l.toUpperCase()}</button>`).join('');
    const tips = DONATE.map((d) => {
      const coins = d.coins.map((c) => `<i class="coin">${c}</i>`).join('');
      return `<a class="tip-btn" href="${d.url}" target="_blank" rel="noopener"><span class="tip-coins">${coins}</span><b>${d.label}</b><span>${d.sub}</span></a>`;
    }).join('');
    showOverlay(`
      <div class="card-station">⚙ ${T.t('settingsTitle')}</div>
      <div class="settings-body">
        <div class="set-row">
          <span class="set-label">${T.t('setWorld')}</span>
          <span class="seg"><span class="seg-cur">${T.t('mapNames')[mapId]}</span><button class="seg-btn" id="set-map">${T.t('setChangeWorld')}</button></span>
        </div>
        <p class="set-note">${T.t('setWorldNote')}</p>
        <div class="set-row">
          <span class="set-label">${T.t('setLanguage')}</span>
          <span class="seg" id="set-lang">${langBtns}</span>
        </div>
        <div class="set-row">
          <span class="set-label">${T.t('setLayout')}</span>
          <span class="seg"><button class="seg-btn active">ЙЦУКЕН</button><button class="seg-btn" disabled>QWERTY</button></span>
        </div>
        <p class="set-note">${T.t('setLayoutSoon')}</p>
        <div class="set-row">
          <span class="set-label">${T.t('setSaveFile')}</span>
          <span class="seg"><button class="seg-btn" id="set-export">${T.t('setExport')}</button><button class="seg-btn" id="set-import">${T.t('setImport')}</button></span>
        </div>
        <div class="tip-box">
          <div class="tip-head">${T.t('tipHead')}</div>
          <p class="set-note">${T.t('tipNote')}</p>
          <div class="tip-btns">${tips}</div>
        </div>
      </div>
      <button id="set-reset" class="link-btn danger">${T.t('btnReset')}</button>
      <div><button id="ov-continue" class="btn-primary">${T.t('passportClose')}</button></div>
    `);
    document.querySelectorAll('#set-lang .seg-btn').forEach((b) => {
      b.onclick = () => { T.setLang(b.dataset.lang); applyI18n(); showSettings(); };
    });
    $('set-map').onclick = () => showMapSelect();
    $('set-export').onclick = () => exportSave();
    $('set-import').onclick = () => pickImportFile();
    $('set-reset').onclick = () => showResetConfirm();
    $('ov-continue').onclick = () => hideOverlay();
    $('ov-continue').focus();
  }
  $('btn-settings').onclick = () => { $('btn-settings').blur(); if (profile) showSettings(); };

  // ---------- interface language ----------
  function applyI18n() {
    document.documentElement.lang = T.getLang();
    document.title = T.t('docTitle');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = T.t(el.dataset.i18n); });
    refreshInventory();
    if (profile) { rebuildWorld(); redock(); }
  }

  // ---------- boot ----------
  applyI18n();
  buildKeyboard();
  refreshStats();
  refreshSoundBtn();
  FACTORY.init(document.getElementById('factory-mount')).then(() => {
    if (loadingCard) loadingCard.classList.add('s3');
    clearLine();
    setTimeout(showMapSelect, 30);
  });
})();
