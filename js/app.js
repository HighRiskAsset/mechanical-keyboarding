// UI + world orchestration: one persistent overworld, no scene switching.
// Walk with arrows; dock at a station by standing near it; type to work it.
// The one screen before the world is the map picker: each world (CHAIN.MAPS)
// keeps its own save, and the session begins by choosing which one to play.
(function () {
  'use strict';

  // the loading card (index.html) has been on screen since first paint; the
  // scripts have now arrived — light its second cell
  const loadingCard = document.getElementById('loading');
  if (loadingCard) loadingCard.classList.add('s2');

  const L = window.LANG_RU;
  const LAYOUT = window.LAYOUT_RU;
  const E = window.ENGINE;
  const T = window.I18N;
  const A = window.AUDIO;

  const SOFT_STOP_MIN = 25;
  const NIGHT_MERCY = 5; // (night runs return later as a lamp toggle)

  let profile = null;   // the current map's save; set by startMap
  let mapId = null;     // the current map (CHAIN.MAPS key)

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
  let nextWords = null;

  // ---- world state ----
  let station = null;            // docked CHAIN station def, or null
  let dockedPlot = null;         // docked free plot id, or null
  let pendingUnlock = null;
  let pendingAutomation = [];
  let benchStreak = 0;           // consecutive benchmark-grade lines at the press
  let pendingEdition = null;     // completed edition, card queued
  const consAcc = {};            // per-mat fractional consumption accumulators
  const feedAcc = {};            // per-bench autofeed accumulators
  let dryNow = false;
  let producedSinceFloat = {};   // mat → n, batched into float text per word

  const nightMode = false;       // reserved

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

  // ---------- materials ----------
  function produceMat(mat, n) {
    if (n <= 0) return;
    profile.mats[mat] = (profile.mats[mat] || 0) + n;
    producedSinceFloat[mat] = (producedSinceFloat[mat] || 0) + n;
  }
  function tryConsumePerLetter() {
    if (!station || !station.consume) return;
    for (const [mat, ratio] of Object.entries(station.consume)) {
      consAcc[mat] = (consAcc[mat] || 0) + ratio;
      while (consAcc[mat] >= 1) {
        if ((profile.mats[mat] || 0) > 0) {
          profile.mats[mat]--;
          consAcc[mat] -= 1;
        } else {
          consAcc[mat] = 1; // hold — station is starved
          dryNow = true;
          return;
        }
      }
    }
  }
  function autofeedTick() {
    // automated benches feed only through PURCHASED belts
    for (const id of Object.keys(profile.autoBench)) {
      if (!profile.autoBench[id]) continue;
      const hasBelt = CHAIN.BELTS.some((b) => b.from === id && profile.belts[CHAIN.beltKey(b)]);
      if (!hasBelt) continue;
      // steam-era machines feed their belts noticeably faster
      feedAcc[id] = (feedAcc[id] || 0) + (profile.era === 'hand' ? 0.5 : 0.8);
      if (feedAcc[id] >= 1) {
        feedAcc[id] -= 1;
        const def = CHAIN.get(id);
        if (def && def.out) {
          profile.mats[def.out] = (profile.mats[def.out] || 0) + 1;
          FACTORY.beltDot(id);
        }
      }
    }
  }
  function flushFloats() {
    const parts = Object.entries(producedSinceFloat).filter(([, n]) => n > 0);
    if (parts.length && station) {
      FACTORY.floatText(parts.map(([m, n]) => `+${n}`).join(' '), station.id);
      for (const [m, n] of parts) flyMat(m, station.id, Math.min(n, 3));
      A.mint();
    }
    producedSinceFloat = {};
  }

  // The inventory lives inside the game canvas as a pixel HUD (icons +
  // bitmap numbers, no words — nothing to overflow). This code only feeds
  // it values; count-up animation ticks stay the addictive one.
  let iconURLs = null;
  const invPrev = {};
  const countTimers = {};
  const INV_KEYS = ['money', 'az', 'buki', 'vedi', 'slogi', 'slova', 'stroki', 'listy'];
  const invValue = (k) => (k === 'money' ? profile.money : (profile.mats[k] || 0));

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
    if (!iconURLs) {
      iconURLs = {};
      for (const k of INV_KEYS) iconURLs[k] = PIXELS.matIconURL(k);
    }
    for (const k of INV_KEYS) {
      const v = invValue(k);
      if (invPrev[k] === undefined) { invPrev[k] = v; FACTORY.setInvValue(k, v); continue; }
      if (v === invPrev[k]) continue;
      if (v > invPrev[k]) animateCount(k, invPrev[k], v);
      else { clearInterval(countTimers[k]); FACTORY.setInvValue(k, v); }
      invPrev[k] = v;
    }
  }

  // ---------- Enter-action + dock glow (icons in-world carry the info) ----------
  function enterAction() {
    if (dockedPlot) {
      const kit = CHAIN.pendingKit(profile);
      return kit && CHAIN.affordable(profile, kit.buildCost) ? 'build' : null;
    }
    if (!station) return null;
    if (station.kind === 'board') return CHAIN.canDeliver(profile) ? 'milestone' : null;
    if (CHAIN.canUpgrade(profile, station)) return 'upgrade';
    if (profile.autoBench[station.id] && (profile.mats[station.out] || 0) < CHAIN.PICKUP_CAP) return 'collect';
    const belt = CHAIN.nextBelt(profile, station);
    if (belt && CHAIN.affordable(profile, belt.cost)) return 'belt';
    return null;
  }
  function refreshStatus() {
    if (!profile) return;
    FACTORY.setDockGlow(enterAction() ? 0x7fb98a : 0xc9a24a);
    // requirement row: what Enter could do here, visible even when
    // unaffordable (dimmed) — the goal is never a secret
    if (station && station.upgradeCost && !profile.autoBench[station.id]) {
      FACTORY.showDockInfo(station.id, station.upgradeCost, '⚙', CHAIN.affordable(profile, station.upgradeCost));
    } else if (station && CHAIN.nextBelt(profile, station)) {
      const belt = CHAIN.nextBelt(profile, station);
      FACTORY.showDockInfo(station.id, belt.cost, '→', CHAIN.affordable(profile, belt.cost));
    } else {
      FACTORY.showDockInfo(null);
    }
  }

  // ---------- keyboard lesson lights: the bench's letters illuminate ----------
  function refreshLessonLights() {
    let set = null;
    if (station && station.mode && CHAIN.isBuilt(profile, station) && !profile.autoBench[station.id]) {
      const unlocked = E.unlockedLetters(profile);
      const focused = (station.focus || unlocked).filter((ch) => unlocked.includes(ch));
      // a bench whose letters are not yet unlocked drills the letters you have
      set = new Set(focused.length ? focused : unlocked);
    }
    for (const [code, cap] of Object.entries(keycapEls)) {
      const ch = LAYOUT.CODE_TO_CHAR[code];
      cap.classList.toggle('lesson', !!(set && ch && set.has(ch)));
    }
  }

  // ---------- materials fly to the in-canvas HUD ----------
  function flyMat(mat, stationId, count) {
    const canvas = document.querySelector('#factory-mount canvas');
    if (!canvas || !iconURLs) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / canvas.width;
    const def = CHAIN.get(stationId);
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

  // ---------- line rendering ----------
  function newLine() {
    if (!station) { clearLine(); return; }
    const genMode = station.mode || 'lines';
    words = E.generateLine(profile, undefined, genMode);
    lineText = words.map((w) => w.text + (w.punct || '')).join(' ');
    pos = 0;
    erroredAt = -1;
    attemptsAtPos = 0;
    wordHadError = false;
    lineErrors = 0;
    renderLine();
    refreshKeyboard();
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
  // ONE interact key: hold Space for half a second (a charge bar fills above
  // the operator). A quick tap is just a typed space; the hold fires the
  // dock's action — build / deliver / automate / collect / belt.
  const HOLD_MS = 500;
  let spaceState = null;   // {done, typedEmitted}
  let chargeTimer = null;

  const canTypeHere = () =>
    !!(station && station.mode && CHAIN.isBuilt(profile, station) && !profile.autoBench[station.id]);

  function performAction(act) {
    if (act === 'build') doBuildOnPlot();
    else if (act === 'milestone') doDeliver();
    else if (act === 'upgrade') doUpgrade();
    else if (act === 'collect') doCollect();
    else if (act === 'belt') doBelt();
  }
  function cancelCharge() {
    if (chargeTimer) { clearInterval(chargeTimer); chargeTimer = null; }
    FACTORY.setCharge(null);
  }
  function startSpace() {
    if (spaceState) return;
    spaceState = { done: false, typedEmitted: false };
    if (!enterAction()) {
      // nothing to interact with — space is just a keystroke
      if (canTypeHere()) handleTyped(' ');
      spaceState.typedEmitted = true;
      return;
    }
    const start = performance.now();
    FACTORY.setCharge(0);
    chargeTimer = setInterval(() => {
      const p = (performance.now() - start) / HOLD_MS;
      FACTORY.setCharge(Math.min(1, p));
      if (p >= 1) {
        cancelCharge();
        if (spaceState) spaceState.done = true;
        performAction(enterAction());
      }
    }, 33);
  }
  function endSpace() {
    if (!spaceState) return;
    const wasCharging = !!chargeTimer;
    cancelCharge();
    // released early: the tap types its space after all
    if (wasCharging && !spaceState.done && !spaceState.typedEmitted && canTypeHere()) handleTyped(' ');
    spaceState = null;
  }

  window.addEventListener('keydown', (e) => {
    const overlayOpen = !overlay.classList.contains('hidden');
    // walking (always available when no overlay)
    const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (ARROWS[e.code]) {
      e.preventDefault();
      if (!overlayOpen) FACTORY.setMove(ARROWS[e.code], true);
      return;
    }
    if (e.code === 'Space' && !overlayOpen) {
      e.preventDefault();
      if (!e.repeat) startSpace();
      return;
    }
    if (overlayOpen) return;
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
        // the material chain, per correct letter
        dryNow = false;
        tryConsumePerLetter();
        if (station.tier === 1 && !dryNow) produceMat(station.out, 1);
        autofeedTick();
      }

      pos++;
      attemptsAtPos = 0;
      advanceCaret();

      // word boundary
      if (lineText[pos] === ' ' || pos >= lineText.length) {
        const endedIdx = lineText.slice(0, pos).split(' ').length - 1;
        const word = words[endedIdx];
        if (word) {
          session.wordsTyped++;
          const clean = !wordHadError;
          const justCollected = collectWord(word, clean);
          showGloss(word, justCollected);
          if (!dryNow) {
            if (station.id === 'slogi') {
              const occ = E.bigramsIn(word.text);
              if (occ > 0) produceMat('slogi', occ * (clean ? 2 : 1));
            } else if (station.id === 'slova') {
              if (clean) produceMat('slova', 1);
            }
          }
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
  window.addEventListener('keyup', (e) => {
    const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (ARROWS[e.code]) FACTORY.setMove(ARROWS[e.code], false);
    if (e.code === 'Space') endSpace();
  });

  // ---------- line completion / world progression ----------
  function finishLine() {
    session.linesDone++;
    lastCorrectTime = null;

    const lineChars = lineText.length;
    const accLine = lineChars / (lineChars + lineErrors);

    if (station && station.id === 'stroki' && !dryNow) produceMat('stroki', 1);
    if (station && station.id === 'press') {
      const m = profile.mats;
      let printed = false;
      if ((m.stroki || 0) >= 1) {
        m.stroki--;
        const pay = Math.max(1, Math.round(5 * Math.pow(accLine, 3)));
        profile.money += pay;
        produceMat('listy', 1);
        printed = true;
        FACTORY.floatText(`+${pay} ₽`, 'press', 0x7fb98a);
        FACTORY.stamp();
        A.press();
      } else if ((m.az || 0) >= 8) {
        m.az -= 8;
        const pay = Math.max(1, Math.round(2 * Math.pow(accLine, 3)));
        profile.money += pay;
        produceMat('listy', 1);
        printed = true;
        FACTORY.floatText(`+${pay} ₽`, 'press', 0x7fb98a);
        FACTORY.stamp();
        A.press();
      } else {
        dryNow = true;
      }
      // ИЗДАНИЕ benchmark: automated base + consecutive clean pages, live
      const ms = CHAIN.currentMilestone(profile);
      if (printed && ms && ms.edition && profile.autoBench[ms.needAuto]) {
        if (accLine >= ms.acc) {
          benchStreak++;
          FACTORY.floatText('✦' + benchStreak, 'press', 0xeacc78);
          if (benchStreak >= ms.lines) {
            benchStreak = 0;
            profile.milestoneIdx++;
            profile.era = ms.era;
            pendingEdition = ms;
          }
        } else {
          benchStreak = 0;
        }
      }
    } else if (station && station.id !== 'press') {
      FACTORY.stamp();
      A.press();
    }
    flushFloats();
    refreshInventory();
    refreshStatus();

    pendingUnlock = E.checkUnlock(profile) || pendingUnlock;
    pendingAutomation.push(...E.updateAutomation(profile));
    E.saveProfile(profile);

    // soft-stop reminder, at most once per 10 minutes
    if (session.activeMs > SOFT_STOP_MIN * 60000 && session.activeMs - lastSoftStopAt > 10 * 60000) {
      lastSoftStopAt = session.activeMs;
      showSoftStopCard();
      return;
    }
    proceedAfterLine();
  }

  function proceedAfterLine() {
    if (pendingEdition) {
      const m = pendingEdition;
      pendingEdition = null;
      rebuildWorld();
      showEditionCard(m);
      return;
    }
    if (pendingUnlock) {
      const letter = pendingUnlock;
      pendingUnlock = null;
      showUnlockCard(letter);
      return;
    }
    if (pendingAutomation.length) {
      showAutomationCard(pendingAutomation.shift());
      return;
    }
    newLine();
  }

  // ---------- the board's note shows in the gloss line while docked ----------
  function showBoardGloss() {
    const m = CHAIN.currentMilestone(profile);
    glossLine.innerHTML = `<b>${T.t('boardName')}</b> — ${T.t(m ? 'boardGloss_' + m.id : 'boardGloss_done')}`;
    glossLine.classList.add('visible');
    clearTimeout(glossTimer);
  }

  // ---------- docking ----------
  FACTORY.onDock = (id) => {
    dockedPlot = id && id.startsWith('plot:') ? id.slice(5) : null;
    station = id && !dockedPlot ? CHAIN.get(id) : null;
    E.setFocusSet(station && station.focus ? station.focus : null);
    for (const k of Object.keys(consAcc)) delete consAcc[k];
    dryNow = false;
    lastCorrectTime = null;
    glossLine.classList.remove('visible');
    FACTORY.showPlotKit(dockedPlot, dockedPlot ? CHAIN.pendingKit(profile) : null);
    if (dockedPlot) {
      clearLine();
    } else if (station && station.kind === 'board') {
      clearLine();
      showBoardGloss();
    } else if (station && profile.autoBench[station.id]) {
      // automated machine = dispenser: hold Space to draw a full load
      clearLine();
    } else if (station && CHAIN.isBuilt(profile, station)) {
      newLine();
    } else {
      clearLine();
    }
    refreshLessonLights();
    refreshStatus();
  };

  function rebuildWorld() {
    if (!profile) return;
    FACTORY.buildWorld(profile, {});
  }

  // ---------- purchases: build station / upgrade bench / lay belt ----------
  function spend(cost) {
    for (const [mat, n] of Object.entries(cost)) profile.mats[mat] -= n;
  }
  function afterPurchase() {
    E.saveProfile(profile);
    rebuildWorld();
    refreshInventory();
    refreshLessonLights();
    refreshStatus();
    A.build();
  }
  function doBuildOnPlot() {
    const kit = CHAIN.pendingKit(profile);
    if (!kit || !dockedPlot || !CHAIN.affordable(profile, kit.buildCost)) return;
    spend(kit.buildCost);
    profile.built[kit.id] = true;
    profile.plots[kit.id] = dockedPlot;
    afterPurchase();
    // the plot marker is gone; the next tick re-docks onto the new machine
  }
  function doCollect() {
    if (!station || !profile.autoBench[station.id]) return;
    const cap = CHAIN.PICKUP_CAP;
    const have = profile.mats[station.out] || 0;
    if (have >= cap) return;
    profile.mats[station.out] = cap;
    flyMat(station.out, station.id, 5);
    FACTORY.floatText(`+${cap - have}`, station.id, 0x7fb98a);
    A.ding();
    E.saveProfile(profile);
    refreshInventory();
    refreshStatus();
  }
  function doDeliver() {
    const m = CHAIN.currentMilestone(profile);
    if (!m || m.edition || !CHAIN.affordable(profile, m.goal)) return;
    spend(m.goal);
    profile.milestoneIdx++;
    afterPurchase();
    showBoardGloss();
    showMilestoneCard(m);
  }
  function doUpgrade() {
    spend(station.upgradeCost);
    profile.autoBench[station.id] = true;
    afterPurchase();
    showBenchAutoCard(station);
  }
  function doBelt() {
    const belt = CHAIN.nextBelt(profile, station);
    if (!belt) return;
    spend(belt.cost);
    profile.belts[CHAIN.beltKey(belt)] = true;
    afterPurchase();
  }

  // ---------- overlays ----------
  let overlayRerender = null;
  function showOverlay(html, wide) {
    clearHint();
    FACTORY.setMove('left', false);
    FACTORY.setMove('right', false);
    overlayCard.classList.toggle('wide', !!wide);
    overlayCard.innerHTML = html;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
    overlayRerender = null;
  }

  function showUnlockCard(letter) {
    overlayRerender = () => showUnlockCard(letter);
    const code = LAYOUT.CHAR_TO_CODE[letter];
    let finger = T.fingerName(LAYOUT.FINGER[code]);
    if (LAYOUT.NEEDS_SHIFT.has(letter)) finger = T.t('shiftFinger', { finger });
    const freq = L.LETTER_FREQ[letter];
    const isPunct = L.PUNCT.has(letter);
    const title = isPunct
      ? T.t('unlockTitlePunct', { ch: letter, name: T.t('punctNames')[letter] })
      : T.t('unlockTitle', { upper: letter.toUpperCase(), lower: letter });
    showOverlay(`
      <div class="card-station">${T.t('unlockStation')}</div>
      <h2>${title}</h2>
      <p class="muted">${T.t('unlockMeta', { finger, freq })}</p>
      <p>${T.t('unlockNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('unlockGo')}</button>
    `);
    const cap = keycapEls[code];
    if (cap) { cap.classList.remove('locked'); cap.classList.add('unlock-glow'); }
    $('ov-continue').onclick = () => {
      if (cap) cap.classList.remove('unlock-glow');
      hideOverlay();
      lastCorrectTime = null;
      rebuildWorld();
      proceedAfterLine();
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

  function showMilestoneCard(m) {
    overlayRerender = () => showMilestoneCard(m);
    A.fanfare();
    showOverlay(`
      <div class="card-station">${T.t('milestoneStation')}</div>
      <h2>${T.t('milestoneTitle')}</h2>
      <p>${T.t('milestoneNote', { name: T.t('stationNames')[m.reward] || '' })}</p>
      <button id="ov-continue" class="btn-primary">${T.t('automationGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); };
    $('ov-continue').focus();
  }

  function showEditionCard(m) {
    overlayRerender = () => showEditionCard(m);
    A.fanfare();
    showOverlay(`
      <div class="card-station">${T.t('editionStation')}</div>
      <h2>${T.t('editionTitle')}</h2>
      <p>${T.t('editionNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('automationGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); proceedAfterLine(); };
    $('ov-continue').focus();
  }

  function showBenchAutoCard(st) {
    overlayRerender = () => showBenchAutoCard(st);
    A.fanfare();
    showOverlay(`
      <div class="card-station">${T.t('benchAutoStation')}</div>
      <h2>${T.t('benchAutoTitle', { name: T.t('stationNames')[st.id] })}</h2>
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
    const next = E.nextLetter(profile);
    const unlocked = E.unlockedLetters(profile);
    const minReady = Math.min(...unlocked.map((ch) => Math.min(1, E.readiness(profile, ch))));
    showOverlay(`
      <div class="card-station">${T.t('blockStation')}</div>
      <h2>${T.t('blockLines', { n: session.linesDone })}</h2>
      <div class="summary-grid">
        <div><span class="sum-val">${sessionAccuracy() === null ? '—' : (sessionAccuracy() * 100).toFixed(1) + '%'}</span><span class="sum-label">${T.t('sumAccuracy')}</span></div>
        <div><span class="sum-val">${sessionWPM() === null ? '—' : sessionWPM().toFixed(0)}</span><span class="sum-label">${T.t('sumWpm')}</span></div>
        <div><span class="sum-val">${session.bestStreak}</span><span class="sum-label">${T.t('sumStreak')}</span></div>
      </div>
      <p class="muted">${T.t('weakLetters')} ${weakest || '—'}</p>
      ${next ? `<p class="muted">${T.t('progressTo', { ch: next, pct: Math.round(minReady * 100) })}</p>` : `<p class="muted">${T.t('allUnlocked')}</p>`}
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
  // Every world in CHAIN.MAPS has its own save. The picker opens the session
  // (last-played world focused, so Enter continues at once) and is reachable
  // again from settings. Each card carries a pixel minimap baked from the
  // real terrain, the world's name and promise, and its save's progress.
  const thumbCache = {};
  let thumbScale = 0;    // one px-per-tile for every world, so their sizes compare honestly
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
        ? `${T.t('mapProgress', { letters: peek.unlockedCount, kits: peek.built, chars: peek.totalChars })}${peek.savedAt ? ` · ${T.t('mapLast', { day: fmtDay(peek.savedAt) })}` : ''}`
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
    // ← → move between worlds; Enter / Space plays the focused one (handled
    // here, not left to the button's native activation, so the world's own
    // Space/arrow handling never sees the keystroke that chose it)
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

  // Make a world current: save the one we're leaving, swap the chain's map,
  // load that world's save, raise its ground, and put the session's world
  // state back to zero (nothing docked, nothing pending). A fresh save gets
  // the welcome card.
  function startMap(id) {
    if (!CHAIN.MAPS[id]) id = CHAIN.DEFAULT_MAP;
    if (id === mapId && profile) { hideOverlay(); return; }   // "continue" on the world you're standing in
    if (profile) E.saveProfile(profile);
    mapId = id;
    CHAIN.useMap(id);
    profile = E.loadProfile(id);
    E.setLastMap(id);

    station = null; dockedPlot = null;
    pendingUnlock = null; pendingAutomation = []; pendingEdition = null;
    benchStreak = 0; dryNow = false; lastCorrectTime = null;
    for (const k of Object.keys(consAcc)) delete consAcc[k];
    for (const k of Object.keys(feedAcc)) delete feedAcc[k];
    producedSinceFloat = {};
    for (const k of Object.keys(invPrev)) delete invPrev[k];   // HUD shows this save's numbers outright, no count-up from the last world
    for (const k of Object.keys(countTimers)) clearInterval(countTimers[k]);
    E.setFocusSet(null);
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
      sections += `<div class="pw-set"><h3>${T.t('setNames')[set]} <small>${got}/${list.length}${done}</small></h3><div class="pw-grid">${chips}</div></div>`;
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
  // Tip links follow Sketchmill's free-tier pattern: two payment rails so
  // international (PayPal) and RU/CIS (YooMoney) both have an easy path.
  // One label per rail's audience, shown in both interface languages.
  // coins = currency badges over each button, so the right rail reads at a glance
  const DONATE = [
    { label: 'Buy me a beer', sub: 'PayPal · cards & balance', url: 'https://paypal.me/HighRiskAsset', coins: ['$', '£', '€'] },
    { label: 'Оставить на пиво', sub: 'YooMoney · ₽ RUB', url: 'https://yoomoney.ru/to/4100119579691782', coins: ['₽'] },
  ];

  // reset is scoped to the current world — the other worlds' saves stand
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
      profile = null;          // startMap must not save the profile we just wiped
      buildKeyboard();
      startMap(mapId);
    };
  };

  // the save file names its world; importing puts it in that world's slot
  function exportSave() {
    E.saveProfile(profile);
    const data = {
      app: 'mechanical-keyboarding', kind: 'save', version: 1,
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
    if (!data || data.app !== 'mechanical-keyboarding' || !data.profile || data.profile.version !== 1) {
      showImportError();
      return;
    }
    // which world the file belongs to: the wrapper's map, else the profile's,
    // else (a pre-maps save) the default world
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
      E.saveProfile(data.profile);
      E.setLastMap(data.map);
      if (typeof data.sound === 'boolean') A.setEnabled(data.sound);
      if (data.uilang) T.setLang(data.uilang);
      profile = null;        // nothing may save over the import before the reload
      location.reload();     // clean re-init; the picker opens on the imported world
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
    refreshStatus();
    if (!station) clearLine();
    rebuildWorld();
  }

  // ---------- boot ----------
  // The world waits for a choice: the picker opens first (last-played world
  // focused — Enter and you're back), then startMap raises it. Until then the
  // loading card holds the overlay; its third cell lights when the renderer
  // is up, and the picker (which bakes its minimaps first) replaces it.
  applyI18n();
  buildKeyboard();
  refreshStats();
  refreshSoundBtn();
  FACTORY.init(document.getElementById('factory-mount')).then(() => {
    if (loadingCard) loadingCard.classList.add('s3');
    clearLine();
    // a beat so the lit cell can paint before the (synchronous) minimap bake —
    // a timeout, not rAF, so a page loading in a background tab still arrives
    setTimeout(showMapSelect, 30);
  });
})();
