// UI + world orchestration: one persistent overworld, no scene switching.
// Walk with arrows; dock at a place by standing near it; type to work a
// machine; hold Space to open the place's menu (arrows choose, a tap of
// Space confirms, Escape closes). Tech tree v3: everything is bought from
// the bag: Mk and ⚙ at the machine, and machines through the build menu a
// hold raises on open ground: pick a kind, walk its ghost to a build site
// (mines to a free vein), tap Space to turn it, hold Space to build
// (rotation overhaul, 2026-08-21). The one screen before the world is the
// map picker.
(function () {
  'use strict';

  const loadingCard = document.getElementById('loading');
  if (loadingCard) loadingCard.classList.add('s2');

  const L = COURSES.course();
  const LAYOUT = COURSES.layout();
  const E = window.ENGINE;
  const T = window.I18N;
  const A = window.AUDIO;
  const DEVMODE = window.DEV;

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
  let dock = null;               // {id, kind:'machine'|'crossing'|'belt', m?, crossing?, belts?}
  let recipe = null;             // active recipe at a processor
  let unitAcc = 0;               // keystrokes into the current unit of output
  let unitPaid = false;          // inputs deducted for the current unit
  let dryNow = false;
  let alphabet = [];             // the current lesson's letters
  let menu = null;               // {rows:[{...row, action}], sel}
  let buildMenu = null;          // the build menu, raised on the operator in open field
  let placing = null;            // {kind, face, at, ok, vein, price, …} — the build ghost
  let pendingUnlock = null;      // a pair just unlocked, card queued
  let producedSinceFloat = {};

  // ---- DOM ----
  const $ = (id) => document.getElementById(id);
  const lineDisplay = $('line-display');
  const glossLine = $('gloss-line');
  const captionEl = $('place-caption');
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
        if (!isSpace) cap.classList.add(finger ? (finger[0] === 'l' ? 'hand-l' : 'hand-r') : (isRight ? 'hand-r' : 'hand-l'));
        if (LAYOUT.HOME_CODES.has(key.code)) cap.classList.add('home');
        const shifted = LAYOUT.SHIFTED_CODE_TO_CHAR[key.code];
        const plain = LAYOUT.CODE_TO_CHAR[key.code];
        // inert is the geometry's default; the course wakes a key by putting
        // a glyph on it (the Fastener's marks live on the number row)
        if (key.inert && plain === undefined && (shifted === undefined || L.PUNCT === undefined || !L.PUNCT.has(shifted))) cap.classList.add('inert');
        if (isSpace) cap.classList.add('space');
        if (shifted !== undefined && L.PUNCT && L.PUNCT.has(shifted)) cap.innerHTML = `<span class="cap-shift">${shifted}</span>${plain ?? key.label ?? ''}`;
        else cap.textContent = key.label ?? (plain || '').toUpperCase();
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
  // One delay for every key, at every level of practice. A hint that arrives
  // quickly for an unfamiliar letter teaches the eye to drop to the board
  // before the hand has tried, which is the habit this game exists to break,
  // so the board stays dark long enough that recall is always the cheaper
  // move and the picture is a rescue rather than a reading surface.
  const HINT_DELAY = 2000;
  // the taper (phase 5): from tier 4 the hint waits twice as long and glows
  // half as bright; from tier 5 it never comes — by then every key is known
  // and the rescue would only teach the eye to drop. Presentation only:
  // nothing is locked behind it.
  const hintTier = () => (profile ? CHAIN.currentTier(profile) : 0);
  let hintTimer = null;
  function clearHint() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    for (const cap of Object.values(keycapEls)) cap.classList.remove('hint', 'dim');
  }
  function applyHint() {
    const expected = lineText[pos];
    if (expected === undefined) return;
    const code = expected === ' ' ? 'Space' : LAYOUT.CHAR_TO_CODE[expected];
    const cap = keycapEls[code];
    if (!cap) return;
    cap.classList.add('hint');
    if (hintTier() >= 4) cap.classList.add('dim');
    if (LAYOUT.NEEDS_SHIFT.has(expected)) {
      // the far shift: the hand that is not reaching for the letter
      const shiftCode = LAYOUT.FINGER[code]?.[0] === 'r' ? 'ShiftLeft' : 'ShiftRight';
      keycapEls[shiftCode]?.classList.add('hint');
    }
  }
  function scheduleHint() {
    clearHint();
    if (autoTyping) return;   // no finger to prompt
    if (lineText[pos] === undefined) return;
    const tier = hintTier();
    if (tier >= 5) return;                                  // hint-free
    hintTimer = setTimeout(applyHint, tier >= 4 ? HINT_DELAY * 2 : HINT_DELAY);
  }

  // ---------- what the board is showing you ----------
  // Locked and unlocked caps are printed alike; the band under the key is the
  // whole tell, and its colour is the ore that unlocked the letter. So buying
  // a mine's Mk lights that mine's colour across the board, and the keyboard
  // reads as the economy rather than as a finger chart.
  function bandFor(ch) {
    const ore = ch === undefined ? null : L.ORE_OF[ch];
    return ore ? `var(--ore-${ore})` : 'var(--band-free)';
  }
  function paintBand(cap, ch, unlocked) {
    cap.classList.toggle('locked', !unlocked);
    cap.style.setProperty('--ore', unlocked ? bandFor(ch) : 'transparent');
  }
  function refreshKeyboard() {
    const unlockedSet = new Set(E.unlockedLetters(profile));
    // Shift belongs to no ore. It lights when the course has handed out
    // something that needs it — in ЙЦУКЕН that is the comma, at the Fastener.
    const shiftReady = [...LAYOUT.NEEDS_SHIFT].some((c) => unlockedSet.has(c));
    for (const [code, cap] of Object.entries(keycapEls)) {
      if (cap.classList.contains('inert')) continue;
      const isShift = code === 'ShiftLeft' || code === 'ShiftRight';
      let ch = LAYOUT.CODE_TO_CHAR[code];
      // a key whose only trainable glyph is shifted (the number-row marks)
      if (ch === undefined) {
        const sh = LAYOUT.SHIFTED_CODE_TO_CHAR[code];
        if (sh !== undefined && L.PUNCT.has(sh)) ch = sh;
      }
      if (!isShift && ch === undefined) continue;
      if (isShift) paintBand(cap, undefined, shiftReady);
      else paintBand(cap, ch, ch === ' ' || unlockedSet.has(ch));
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
  // What the bag will not hold is not held anywhere: past CHAIN's per-material
  // cap the surplus vanishes, and the float shows what actually landed.
  function gain(mat, n) {
    if (n <= 0) return;
    if (!profile.seen[mat]) { profile.seen[mat] = true; }
    const got = CHAIN.bagAdd(profile.bag, mat, n);
    if (!got) return;
    producedSinceFloat[mat] = (producedSinceFloat[mat] || 0) + got;
  }
  function spend(cost) {
    CHAIN.spendCost(profile.bag, cost);   // family-aware: deeper ore covers a shallow ask, shallow stock first
  }
  const canPay = (cost) => CHAIN.affordable(profile.bag, cost);
  // the materials of a price the bag falls short of — their counts print
  // red in the menu rows, so an unaffordable row says which is the problem
  const shortOf = (cost) => Object.keys(cost || {}).filter((mat) => (profile.bag[mat] || 0) < cost[mat]);
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
  const invShown = {};
  const countTimers = {}, countWaits = {};
  // A row waiting on goods in the air. The bag is banked the instant it is
  // earned, but the number is what the player watches, and a number that
  // has already climbed by the time the goods arrive makes the flight
  // decorative. So the flight leaves a note here and the count keeps to it:
  // `wait` holds the climb until the goods land, `drain` walks a price down
  // as it flies out instead of snapping to the new total.
  const countHint = {};
  let hudKeysShown = [];
  const invValue = (k) => profile.bag[k] || 0;
  function hudKeys() {
    return CHAIN.MAT_IDS.filter((id) => profile.seen[id]);
  }
  function showInv(key, n) {
    invShown[key] = n;
    FACTORY.setInvValue(key, n);
  }
  function stopCount(key) { clearInterval(countTimers[key]); clearTimeout(countWaits[key]); }
  // always from what the row is actually showing, never from the last value
  // banked — two batches landing close together would otherwise make the
  // second one start from a number the first never got round to drawing
  function animateCount(key, to, hint) {
    stopCount(key);
    const run = () => {
      const from = invShown[key] === undefined ? to : invShown[key];
      const delta = to - from;
      const up = delta > 0;
      const steps = Math.min(8, Math.abs(delta));
      if (steps <= 1) { showInv(key, to); if (up) A.countTick(1); return; }
      let i = 0;
      countTimers[key] = setInterval(() => {
        i++;
        showInv(key, Math.round(from + (delta * i) / steps));
        if (up) A.countTick(i);
        if (i >= steps) clearInterval(countTimers[key]);
      }, up ? 45 : 32);
    };
    if (hint && hint.wait) countWaits[key] = setTimeout(run, hint.wait);
    else run();
  }
  function refreshInventory() {
    if (!profile) return;
    const keys = hudKeys();
    if (keys.join() !== hudKeysShown.join()) {
      hudKeysShown = keys;
      FACTORY.setHudKeys(keys);
      for (const k of keys) { if (!iconURLs[k]) iconURLs[k] = PIXELS.matURL(k, PIXELS.MAT_SPARK_PEAK); showInv(k, invPrev[k] === undefined ? invValue(k) : invPrev[k]); }
    }
    for (const k of keys) {
      const v = invValue(k);
      if (invPrev[k] === undefined) { invPrev[k] = v; showInv(k, v); continue; }
      if (v === invPrev[k]) continue;               // a note is only spent on the change it was left for
      const hint = countHint[k];
      delete countHint[k];
      if (v > invPrev[k] || (hint && hint.drain)) animateCount(k, v, hint);
      else { stopCount(k); showInv(k, v); }
      invPrev[k] = v;
    }
  }
  function flyMat(mat, dockId, count) {
    const def = FACTORY.posOf(dockId);
    if (def) flyFrom(mat, count, def.x + 13, def.y - 30);
  }

  // ---------- the flight between the world and the bag ----------
  // One flight, run either way round. A good typed out of a machine or
  // swept off the ground flies world → bag; the price of anything built
  // flies bag → world. Same arc, same tumble, same burst at both ends,
  // because a purchase should read as a reward played backwards — the
  // rule the poof and DROPS.demolish already keep on the other side.
  //
  // The arc is thrown and not dragged: a good pops up and a little back
  // from where it starts, hangs a beat, then swoops in with all of its
  // speed at the end. A straight slide reads as a panel updating; this
  // reads as a thing moving, which is the whole point of it.
  const FLY_MS = 520, FLY_STEP = 70, FLY_STEPS = 16;
  // page coordinates: the canvas is drawn at device pixels and laid out at
  // css pixels, so everything the DOM throws over it comes through here
  function pageOf(p) {
    const canvas = document.querySelector('#factory-mount canvas');
    if (!canvas || !p) return null;
    const rect = canvas.getBoundingClientRect();
    const k = rect.width / canvas.width;
    return { x: rect.left + p.x * k, y: rect.top + p.y * k, k };
  }
  const screenOf = (wx, wy) => pageOf(FACTORY.screenPos(wx, wy));
  const hudOf = (mat) => pageOf(FACTORY.invScreenPos(mat));
  // a quadratic bezier whose control point is up and a touch behind the
  // start — that is what makes it a toss and not a slide
  const flyArc = (dx, dy, side, lift) => (u) => {
    const cx = -dx * 0.16 + side, cy = -lift, v = 1 - u;
    return [2 * v * u * cx + u * u * dx, 2 * v * u * cy + u * u * dy];
  };
  // time → distance along that arc: a snap out, a hang at the top, then
  // everything else in the last third
  const flyEase = (t) => (t < 0.3 ? (t / 0.3) * 0.2 : 0.2 + 0.8 * Math.pow((t - 0.3) / 0.7, 1.75));
  // Returns how long the last good of the batch is in the air, so a caller
  // can put whatever happens at the far end on the same beat.
  function flight(mat, count, from, to, out) {
    if (!from || !to) return 0;
    if (!iconURLs[mat]) iconURLs[mat] = PIXELS.matURL(mat, PIXELS.MAT_SPARK_PEAK);
    // the same size it will be when it lands: a world pixel is FACTORY.scale()
    // device pixels, and `from.k` turns those into the page's own
    const px = PIXELS.MAT_PX * FACTORY.scale() * from.k;
    const dx = to.x - from.x, dy = to.y - from.y;
    const n = Math.max(1, Math.min(count, 5));
    for (let i = 0; i < n; i++) {
      // each good of a batch is thrown its own way, so five of them are a
      // handful in the air and not one icon drawn five times
      const side = (i % 2 ? 1 : -1) * (14 + Math.random() * 26);
      const lift = Math.min(150, 54 + Math.hypot(dx, dy) * 0.2) * (0.8 + Math.random() * 0.45);
      const at = flyArc(dx, dy, side, lift);
      const spin = (Math.random() < 0.5 ? -1 : 1) * (110 + Math.random() * 150);
      const el = document.createElement('img');
      el.src = iconURLs[mat];
      el.className = 'fly-mat' + (out ? ' out' : '');
      el.style.width = el.style.height = px + 'px';
      el.style.left = from.x + 'px';
      el.style.top = from.y + 'px';
      document.body.appendChild(el);
      const frames = [];
      for (let s = 0; s <= FLY_STEPS; s++) {
        const t = s / FLY_STEPS, u = flyEase(t);
        const [x, y] = at(u);
        // it swells as it is thrown and shrinks into wherever it is going
        const k = out ? 1.3 - 0.9 * u : u < 0.2 ? 1 + u * 1.9 : 1.38 - (0.72 * (u - 0.2)) / 0.8;
        frames.push({
          transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(spin * u).toFixed(1)}deg) scale(${k.toFixed(3)})`,
          opacity: t < 0.86 ? 1 : ((1 - t) / 0.14).toFixed(2),
          easing: 'linear',
        });
      }
      const delay = i * FLY_STEP;
      el.animate(frames, { duration: FLY_MS, delay, fill: 'forwards', easing: 'linear' });
      if (i < 3) trail(at, from, delay, out);
      setTimeout(() => el.remove(), FLY_MS + delay + 80);
    }
    return FLY_MS + (n - 1) * FLY_STEP;
  }
  // two motes dropped on the arc behind a good and left to fade where they
  // were dropped — the wake, not the path
  function trail(at, from, delay, out) {
    for (const t of [0.5, 0.72]) {
      setTimeout(() => {
        const [mx, my] = at(flyEase(t));
        const el = document.createElement('div');
        el.className = 'fly-mote' + (out ? ' out' : '');
        el.style.left = from.x + mx + 'px';
        el.style.top = from.y + my + 'px';
        document.body.appendChild(el);
        el.animate([{ opacity: 0.95, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.25)' }],
          { duration: 300, easing: 'ease-out', fill: 'forwards' });
        setTimeout(() => el.remove(), 340);
      }, delay + FLY_MS * t);
    }
  }
  // world → bag: a good typed out of a machine, or swept up off the ground.
  // It leaves in a burst of motes and lands on the row lighting up, the
  // count starting to climb and a shimmer over the ticks.
  function flyFrom(mat, count, wx, wy) {
    const from = screenOf(wx, wy), to = hudOf(mat);
    if (!from || !to) return 0;
    FACTORY.sparkle(wx, wy, 4, 0xffe08a);
    const ms = flight(mat, count, from, to, false);
    if (!ms) return 0;
    countHint[mat] = { wait: FLY_MS };            // the row climbs when they land, not when they leave
    setTimeout(() => { FACTORY.pulseInv(mat, false); A.arrive(count); }, FLY_MS);
    return ms;
  }
  // bag → world: the price of anything built, on its way to the site. The
  // row it comes out of presses down as it goes, and the count drains
  // behind it rather than snapping to the new number.
  function flyTo(mat, count, wx, wy) {
    const from = hudOf(mat), to = screenOf(wx, wy);
    if (!from || !to) return 0;
    FACTORY.pulseInv(mat, true);
    return flight(mat, count, from, to, true);
  }

  // ---------- automation: bought at the mine; a Mk on its ore retools it ----------
  // ⚙ is per recipe (the deep-ore ledger): live automation = the machine's
  // CURRENT work has its engine. A mine that deepens is back in your hands.
  const autoLive = (m) => !!(m && SIM.autoLive(profile, m));
  // record a unit made by hand — the run-in every recipe's ⚙ waits on
  function recordHandMade(m, key, n) {
    if (!key) return;
    if (!m.handMade) m.handMade = {};
    m.handMade[key] = (m.handMade[key] || 0) + n;
  }
  // the belt spool on the operator's back: {from: machine id} while carrying
  let spool = null;
  let spoolRoute = null;         // the route to the docked machine while carrying, or null

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
    if (kind.full) {
      // Molder and up: the whole unlocked set; the flux sets the focus
      const focus = CHAIN.recipeFocus(recipe, profile);
      return { mode: kind.grammar, alphabet: CHAIN.recipeAlphabet(recipe, profile), tilt: focus.tilt, family: focus.family };
    }
    return { mode: kind.grammar, alphabet: CHAIN.recipeAlphabet(recipe, profile), tilt: CHAIN.recipeTilt(recipe, profile) };
  }
  const canTypeHere = () => !!(dock && dock.kind === 'machine' && !autoLive(dock.m) && (dock.m.kind === 'mine' || recipe)) && !placing && !buildMenu;

  // per correct letter: mines yield an ore; processors pay for a unit at its
  // first keystroke and emit at its last
  // output: exit belt → bag → the machine's own bin — and past all three,
  // the ground at your feet (the bag cap: only hands ever reach this, so a
  // spill is a trickle in front of the one who typed it, never a pump)
  let lastSpillFloat = 0;
  function produce(m, mat, n) {
    const res = SIM.emit(profile, m, mat, n);
    profile.seen[mat] = true;
    if (res.where === 'bag') producedSinceFloat[mat] = (producedSinceFloat[mat] || 0) + n - res.spilled;
    else beltFloat[mat] = (beltFloat[mat] || 0) + n - res.spilled;
    if (res.spilled > 0 && window.DROPS) {
      const at = CHAIN.machineFoot(m);
      DROPS.scatter(profile, { [mat]: res.spilled }, at.x, at.y + 8);
      const now = Date.now();
      if (now - lastSpillFloat > 4000 && dock) { FACTORY.floatText(T.t('floatBagFull'), dock.id, 0xd8905f); lastSpillFloat = now; }
    }
    // the finish: K heavy modules, hand-made here — a count, never a lock
    if (mat === 'heavy') {
      profile.heavy = (profile.heavy || 0) + n;
      if (!profile.finishedAt && profile.heavy >= CHAIN.TUNING.K_HEAVY) {
        profile.finishedAt = Date.now();
        E.saveProfile(profile);
        showFinishCard();
      }
    }
  }
  let beltFloat = {};
  function workKeystroke() {
    const m = dock.m;
    if (m.kind === 'mine') {
      const mat = CHAIN.mineMat(profile, m);
      produce(m, mat, 1);
      recordHandMade(m, mat, 1);
      return;
    }
    if (!recipe) return;
    const kind = CHAIN.KINDS[m.kind];
    if (!unitPaid) {
      // a worked machine uses what is inside it first, then the bag
      if (SIM.takeInput(profile, m, recipe.in)) { unitPaid = true; if (dryNow) { dryNow = false; refreshInfo(); refreshCaption(); } }
      else { if (!dryNow) { dryNow = true; refreshInfo(); refreshCaption(); } return; }   // starved: runs dry, still trains
    }
    unitAcc++;
    if (unitAcc >= kind.perUnit) {
      unitAcc = 0; unitPaid = false;
      recordHandMade(m, CHAIN.autoKey(m, recipe, profile), 1);
      produce(m, recipe.out, 1);
    }
  }

  // ---------- place menus ----------
  function menuRowsFor(d) {
    if (!d) return [];
    const rows = [];
    if (d.kind === 'crossing') {
      const price = CHAIN.priceCrossing(d.crossing) || {};
      rows.push({ pre: '→', items: price, enabled: canPay(price), priced: true, short: shortOf(price), caption: T.t('capRepair'), action: { type: 'repair', id: d.crossing.id, price } });
    } else if (d.kind === 'belt') {
      // the run underfoot — both of them where two cross. Its own menu, so
      // taking one up is a hold and then a press, never a stray press.
      for (const id of d.belts) {
        const b = (profile.belts || []).find((x) => x.id === id);
        if (!b) continue;
        const from = SIM.machineById(profile, b.from), to = SIM.machineById(profile, b.to);
        rows.push({
          pre: '✗', kind: from ? from.kind : undefined, ore: from && from.kind === 'mine' ? from.ore : undefined,
          enabled: true,
          caption: T.t('capUnbelt', { from: machineName(from), to: machineName(to) }),
          action: { type: 'unbelt', id },
        });
      }
    } else if (d.kind === 'machine' && d.m.kind === 'mine') {
      const m = d.m, ore = m.ore;
      const mk = CHAIN.oreMk(profile, ore);
      // the next Mk of this ore is always for sale here at its real price —
      // the ladder branches between places; what orders them is the goods
      // the price asks for
      const np = CHAIN.pairOf(ore, mk + 1);
      if (np) {
        const price = CHAIN.pricePair(np) || {};
        rows.push({ pre: 'MK' + np.mk, items: price, enabled: canPay(price), priced: true, short: shortOf(price), caption: T.t('capMk', { level: np.mk, name: mineName(ore), keys: pairKeys(np) }), action: { type: 'mk', ore, level: np.mk, price } });
      }
      if (!autoLive(m)) {
        // ⚙ for the depth the mine now works: run it in by hand first, then
        // the price consumes the very units you ran it in on
        const price = CHAIN.priceAuto(m, null, profile);
        const left = CHAIN.runInLeft(m, null, profile);
        const caption = T.t('capAuto') + (left > 0 ? T.t('capRunIn', { left }) : '');
        rows.push({ pre: '⚙', items: price, enabled: left <= 0 && canPay(price), priced: left <= 0, short: shortOf(price), caption, action: left <= 0 ? { type: 'auto', m, price, key: CHAIN.autoKey(m, null, profile) } : null });
      }
      beltRows(m, rows);
      removeRow(m, rows);
    } else if (d.kind === 'machine') {
      // a processor's menu: everything the machine can be told to do. The
      // recipe it runs stands under the machine itself, so the menu offers
      // the others — all of them, affordable or not — then automation, the
      // belt rows, and taking it down again.
      const m = d.m;
      const active = SIM.recipeOf(profile, m);
      for (const r of CHAIN.offerableRecipes(m.kind, profile)) {
        if (r === active) continue;
        // a recipe whose engine this machine already owns wears the gear:
        // switching to it means the machine runs itself again
        const owned = CHAIN.autoOn(m, CHAIN.autoKey(m, r, profile));
        rows.push({ pre: owned ? '⚙' : undefined, items: r.in, out: r.out, ok: SIM.canTake(profile, m, r.in) ? undefined : false, enabled: true, caption: T.t('capRecipe', { out: matName(r.out), inputs: Object.entries(r.in).map(([mat, k]) => `${k} ${matName(mat)}`).join(' + ') }) + (owned ? T.t('capEngineOwned') : ''), action: { type: 'recipe', m, r } });
      }
      // keys bought at this kind of machine (the Fastener's punctuation):
      // its next level, always for sale here at its price
      const np = CHAIN.pairOf(m.kind, CHAIN.kindMk(profile, m.kind) + 1);
      if (np) {
        const price = CHAIN.pricePair(np) || {};
        rows.push({ pre: 'MK' + np.mk, items: price, enabled: canPay(price), priced: true, short: shortOf(price), caption: T.t('capMkAt', { level: np.mk, name: kindName(m.kind), keys: pairKeys(np) }), action: { type: 'mk-at', kind: m.kind, level: np.mk, price } });
      }
      if (active && !autoLive(m)) {
        // ⚙ for the recipe it is running now — every recipe earns its own
        const price = CHAIN.priceAuto(m, active, profile);
        const left = CHAIN.runInLeft(m, active, profile);
        if (price) {
          const caption = T.t('capAuto') + (left > 0 ? T.t('capRunIn', { left }) : '');
          rows.push({ pre: '⚙', items: price, enabled: left <= 0 && canPay(price), priced: left <= 0, short: shortOf(price), caption, action: left <= 0 ? { type: 'auto', m, price, key: CHAIN.autoKey(m, active, profile) } : null });
        }
      }
      beltRows(m, rows);
      removeRow(m, rows);
    }
    return rows;
  }
  // the last row on every machine: take it down. What it cost comes back —
  // at the price of the newest one of its kind, so down-and-up again is even
  // — along with everything standing inside it. A vein's opening price is
  // never refunded: that bought keys, and the keys stay.
  function removeRefund(m) {
    if (m.kind === 'mine') return CHAIN.priceExtraMine(m.ore) || {};
    return CHAIN.priceMachine(m.kind, CHAIN.machinesOfKind(profile, m.kind).length) || {};
  }
  function removeRow(m, rows) {
    if (spool) return;
    const back = removeRefund(m);
    const row = { pre: '✗', kind: m.kind, ore: m.kind === 'mine' ? m.ore : undefined, items: back };
    // the last mine on an ore stays: a new one is paid for in that same ore,
    // so taking it down could leave the vein out of reach for good
    if (m.kind === 'mine' && CHAIN.machinesOfOre(profile, m.ore).length <= 1) {
      rows.push({ ...row, ok: false, enabled: false, caption: T.t('capRemoveLast', { name: machineName(m) }), action: null });
      return;
    }
    rows.push({ ...row, enabled: true, caption: T.t('capRemove', { name: machineName(m) }), action: { type: 'remove-machine', m, back } });
  }
  // the rows every machine shares (phase 3): socket / put the spool back /
  // take the spool, feed, collect, and one row per belt to remove it
  function beltRows(m, rows) {
    const mid = 'm:' + m.id;
    // (while carrying a spool there is no menu: the hold lays the belt here
    // or drops the spool — see startSpace)
    // feed and collect come before the spool: the everyday rows first
    if (autoLive(m) && m.kind !== 'mine') rows.push({ pre: '→', items: recipeInputsIcons(m), enabled: SIM.canFeed(profile, m), caption: T.t('capFeed'), action: { type: 'feed', m } });
    if (SIM.hasOutput(m)) rows.push({ pre: '↓', items: nonZero(m.buf.out), enabled: true, caption: T.t('capCollect'), action: { type: 'collect', m } });
    if (!spool && SIM.beltsFrom(profile, m).length < SIM.outletsOf(m) && (m.kind === 'mine' || SIM.produces(profile, m).length)) {
      rows.push({ pre: '→', enabled: true, caption: T.t('capSpool', { mats: matList(SIM.produces(profile, m)) }), action: { type: 'spool', m } });
    }
    // There is no turn row (user ruling 2026-08-21): a machine's facing is
    // chosen at the build ghost and it is final — turning a standing
    // machine would silently re-lay every run plugged into it. To face it
    // another way, take it down (everything comes back, on the ground) and
    // build it again.
    // taking a run up is not offered here. A machine with several runs
    // coming and going gave a list of ✗ rows there was no reading, and the
    // wrong one went too easily; you take a run up by standing on it.
    void mid;
  }
  const nonZero = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, n]) => n > 0));
  function recipeInputsIcons(m) {
    const r = SIM.recipeOf(profile, m);
    if (!r) return {};
    const out = {};
    for (const mat of Object.keys(r.in)) out[mat] = profile.bag[mat] || 0;
    return out;
  }
  // ---------- names and the caption under the map ----------
  const kindName = (k) => (T.t('kindNames') || {})[k] || k;
  const mineName = (ore) => (T.t('oreMineNames') || {})[ore] || ore;
  const matName = (mat) => (T.t('matNames') || {})[mat] || mat;
  const matList = (mats) => (mats || []).map(matName).join(' / ');
  const machineName = (m) => (m ? (m.kind === 'mine' ? mineName(m.ore) : kindName(m.kind)) : '?');
  const pairKeys = (pair) => (pair && pair.keys ? pair.keys.map((c) => c.toUpperCase()).join(' ') : '');
  // a rung named as a purchase: "Quartz vein" (opening it), "Quartz mine Mk2", "Fastener Mk1"
  const placeName_ = (pair) => (pair.ore ? (pair.mk === 1 ? ((T.t('veinNames') || {})[pair.ore] || mineName(pair.ore)) : mineName(pair.ore)) : kindName(pair.at));
  const rungName = (pair) => (pair.ore && pair.mk === 1 ? placeName_(pair) : T.t('capAtPlace', { name: placeName_(pair), level: pair.mk }));
  // what a kind with nothing to make is waiting for, as a caption tail
  function afterTail(kind) {
    const need = CHAIN.whatUnlocks(kind, profile);
    if (!need || !need.length) return need ? '' : T.t('capAfterDeeper');
    return T.t('capAfter', { list: need.map(rungName).join(' + ') });
  }
  function beltWhy(why, from) {
    const table = T.t('beltWhy') || {};
    const v = table[why] || table.path;
    return typeof v === 'function' ? v({ mats: matList(from ? SIM.produces(profile, from) : []) }) : v;
  }
  function placeName(d) {
    if (!d) return '';
    if (d.kind === 'machine') return machineName(d.m) + (autoLive(d.m) ? ' · ' + T.t('capAutomated') : '');
    if (d.kind === 'crossing') return T.t('capCrossing');
    if (d.kind === 'belt') return T.t(d.belts.length > 1 ? 'capOnCrossing' : 'capOnBelt');
    return '';
  }
  // The caption: two lines under the map — what the place is, then what can
  // be done with it; either line may stand alone (2026-08-27). While a menu
  // is open the second line is the chosen row's meaning; while carrying the
  // spool it is the spool's errand, which already names its own parties.
  function setCaption(name, action, cls) {
    if (!captionEl) return;
    if (!name && !action) { captionEl.classList.add('hidden'); captionEl.textContent = ''; return; }
    captionEl.textContent = '';
    for (const [line, cn] of [[name, 'cap-name'], [action, 'cap-act']]) {
      if (!line) continue;
      const el = document.createElement('div');
      el.className = cn;
      el.textContent = line;
      captionEl.appendChild(el);
    }
    captionEl.className = cls || '';
  }
  let captionFlash = null;
  function flashCaption(text) {
    if (captionFlash) clearTimeout(captionFlash);
    setCaption('', text, 'ok');
    captionFlash = setTimeout(() => { captionFlash = null; refreshCaption(); }, 1600);
  }
  // what the operator stands on when no place holds them: a free vein, a
  // build site, or nothing worth a name. The identity line for ground that
  // all looks alike from above
  function groundName() {
    const at = FACTORY.playerPos();
    const tx = Math.floor(at.x / 16), ty = Math.floor((at.y - 1) / 16);
    for (const n of CHAIN.unbuiltNodes(profile)) {
      const b = MAPKIT.veinBox(n);
      if (tx >= b.c0 && tx <= b.c1 && ty >= b.r0 && ty <= b.r1) return (T.t('veinNames') || {})[n.ore] || '';
    }
    for (const p of CHAIN.freeSites(profile)) {
      const b = MAPKIT.siteBox(p);
      if (tx >= b.c0 && tx <= b.c1 && ty >= b.r0 && ty <= b.r1) return T.t('capSite');
    }
    return '';
  }
  function refreshCaption() {
    if (captionFlash) return;
    if (autoTyping) { setCaption('', T.t('capDebugAuto'), 'ok'); return; }
    if (!profile) { setCaption('', ''); return; }
    if (menu || buildMenu) {
      const mm = menu || buildMenu;
      const row = mm.rows[mm.sel] || {};
      let text = row.caption || '';
      let cls = '';
      if (row.enabled === false) { cls = 'dim'; if (row.priced) text += T.t('capUnaffordable'); }
      else if (row.action && row.action.type === 'socket') cls = 'ok';
      if (row.ok === false && row.action === null && spool) cls = 'no';
      setCaption(menu ? placeName(dock) : groundName() || T.t('capOpenGround'), text, cls);
      return;
    }
    if (placing) {
      if (placing.kind === 'mine' && !placing.vein) { setCaption('', T.t('capPlaceMine'), 'no'); return; }
      if (placing.later) { setCaption('', T.t('capVeinLater', { name: mineName(placing.vein.ore) }), 'no'); return; }
      const name = placing.kind === 'mine' ? mineName(placing.vein.ore) : kindName(placing.kind);
      if (placing.poor) { setCaption('', T.t('capPlacePoor', { name }), 'no'); return; }
      if (!placing.ground) { setCaption('', T.t('capPlaceBad'), 'no'); return; }
      setCaption('', placing.kind === 'mine' ? T.t('capPlaceMine') : T.t('capPlace', { name }), 'ok');
      return;
    }
    if (spool && dock && dock.kind === 'machine' && dock.m.id !== spool.from) {
      const from = SIM.machineById(profile, spool.from);
      const link = from ? SIM.canLink(profile, from, dock.m) : { ok: false, why: 'same' };
      if (dock.m.kind === 'mine' && !link.ok) link.why = 'mine';
      if (link.ok && spoolRoute) setCaption(placeName(dock), T.t('capSocket', { n: spoolRoute.length, from: machineName(from) }), 'ok');
      else setCaption(placeName(dock), T.t('capNoBelt', { why: beltWhy(link.ok ? 'path' : link.why, from) }), 'no');
      return;
    }
    if (spool) {
      const from = SIM.machineById(profile, spool.from);
      setCaption('', T.t('capCarrying', { from: machineName(from), mats: matList(from ? SIM.produces(profile, from) : []) }), '');
      return;
    }
    // a machine with nothing to make says so, and names what would change it
    if (dock && dock.kind === 'machine' && dock.m.kind !== 'mine' && !CHAIN.kindLive(dock.m.kind, profile)) {
      setCaption(placeName(dock), T.t('capNothingToMake') + afterTail(dock.m.kind), 'no');
      return;
    }
    // typing outran supply: name the starving input — this is the moment
    // the player should feel "I need a belt here, or another maker"
    if (dock && dock.kind === 'machine' && dryNow && recipe) {
      SIM.ensureMachine(dock.m);
      const short = Object.entries(recipe.in)
        .filter(([mat, n]) => ((dock.m.buf.in[mat] || 0) + CHAIN.bagAvail(profile.bag, mat)) < n)
        .map(([mat]) => matName(mat));
      if (short.length) { setCaption(placeName(dock), T.t('capStarved', { mats: short.join(' / ') }), 'no'); return; }
    }
    if (dock && menuRowsFor(dock).length) { setCaption(placeName(dock), T.t('capHold'), 'dim'); return; }
    // the ground underfoot: its name, plus the build prompt only while the
    // menu would have a row the bag can cover — the hint is never a lie
    setCaption(groundName(), buildMenuRows().some((r) => r.enabled) ? T.t('capBuildHere') : '', 'dim');
  }
  // while carrying the spool: a green bar under every machine the belt may
  // end at, red under the rest. A machine has to want the material AND have
  // ground the run can cross to reach it — a bar that promised the first
  // without the second sent you walking to a machine where the hold could
  // only drop the spool.
  function refreshMarks() {
    if (!profile || !spool) { FACTORY.markStations(null); return; }
    const from = SIM.machineById(profile, spool.from);
    if (!from) { FACTORY.markStations(null); return; }
    const reachable = FACTORY.beltReaches(from, profile);
    const marks = {};
    for (const m of profile.machines) {
      if (m.id === from.id) continue;
      marks['m:' + m.id] = SIM.canLink(profile, from, m).ok && reachable.has(m.id) ? 'ok' : 'no';
    }
    FACTORY.markStations(marks);
  }

  // carrying a spool: can the belt end at the place the operator stands?
  function socketHere() {
    if (!spool || !dock || dock.kind !== 'machine' || dock.m.id === spool.from) return null;
    const from = SIM.machineById(profile, spool.from);
    if (!from || !SIM.canLink(profile, from, dock.m).ok || !spoolRoute) return null;
    return { type: 'socket', from, to: dock.m, path: spoolRoute };
  }
  // the hold away from any socket: the spool goes back where it came from
  function dropSpool() {
    if (!spool) return;
    spool = null; spoolRoute = null;
    FACTORY.setSpool(false);
    FACTORY.setSocketTarget(null);
    A.thud();
    flashCaption(T.t('capDropped'));
    refreshStatus();
  }

  // ---------- the build menu and the ghost (rotation overhaul, 2026-08-21) ----------
  // Building happens anywhere: a long press on open ground — anywhere a
  // hold would not open something else — raises the build menu on the
  // operator. Arrows choose, a tap of Space picks, and the pick becomes a
  // ghost on the grid that walks with you: every tile under it says
  // buildable or not, its port plates lie where they will land, a tap of
  // Space turns it a quarter clockwise, and a hold builds it on good
  // ground. On bad ground — or over the open menu — the hold cancels
  // instead. Mines are rows in the same menu: their ghost asks to be stood
  // on a free vein, and prices itself off the vein under it.
  // The mine's price lives on the vein — an open ore's extra-mine price, or
  // the next rung's opening price — so the row carries no one price of its
  // own: while any vein can be paid for it offers itself bare, and the ghost
  // prices the vein under it. When veins stand free but the bag covers none
  // of them, affordability is numbers, never words (the menu ruling,
  // 2026-08-21; fixed here 2026-08-27 — the old caption said "no free vein"
  // while veins stood free): the row greys with the price of the vein
  // needing the least more gathering, that vein's ore in front, the missing
  // counts red. Words keep only the two priceless states: every vein taken,
  // or the free ones not for sale yet. An unaffordable ghost never happens.
  function mineRow() {
    const priced = [];
    let free = 0;
    for (const n of CHAIN.unbuiltNodes(profile)) {
      free++;
      const price = CHAIN.oreOpen(profile, n.ore) ? CHAIN.priceExtraMine(n.ore) : CHAIN.priceNode(n.ore);
      if (!price) continue;
      if (canPay(price)) return { kind: 'mine', enabled: true, caption: T.t('capBuildMinePick'), action: { type: 'pick', kind: 'mine' } };
      priced.push({ ore: n.ore, price, gap: Object.entries(price).reduce((a, [mat, k]) => a + Math.max(0, k - CHAIN.bagAvail(profile.bag, mat)), 0) });
    }
    if (priced.length) {
      const near = priced.reduce((a, b) => (b.gap < a.gap ? b : a));
      return { kind: 'mine', ore: near.ore, items: near.price, priced: true, short: shortOf(near.price), enabled: false, caption: T.t('capBuildMinePick'), action: null };
    }
    return { kind: 'mine', enabled: false, caption: T.t(free ? 'capBuildMineLater' : 'capBuildMineNone'), action: null };
  }
  // every kind in view stands in the menu with its price — dimmed while the
  // bag cannot cover it, and dimmed with the upgrade it waits for while it
  // would have nothing to make (a machine is never born dead)
  function buildMenuRows() {
    const rows = [mineRow()];
    for (const k of CHAIN.visibleKinds(profile)) {
      const price = CHAIN.priceMachine(k, CHAIN.machinesOfKind(profile, k).length + 1);
      const live = CHAIN.kindLive(k, profile);
      const caption = T.t('capBuild', { kind: kindName(k) }) + (live ? '' : afterTail(k));
      rows.push({ kind: k, items: price, enabled: live && canPay(price), priced: live, short: shortOf(price), caption, action: live ? { type: 'pick', kind: k } : null });
    }
    return rows;
  }
  function openBuildMenu() {
    buildMenu = { rows: buildMenuRows(), sel: 0 };
    FACTORY.showMenu('@player', buildMenu.rows, 0);
    refreshCaption();
    A.click();
  }
  function closeBuildMenu() {
    buildMenu = null;
    FACTORY.clearMenu();
    refreshCaption();
  }
  function confirmBuildMenu() {
    if (!buildMenu) return;
    const row = buildMenu.rows[buildMenu.sel];
    if (!row || row.enabled === false || !row.action) { A.thud(); return; }
    closeBuildMenu();
    startPlacing(row.action.kind);
  }
  function startPlacing(kind) {
    placing = { kind, face: 's', at: null, ok: false, vein: null, price: null, unlock: false };
    clearLine();
    refreshLessonLights();
    updatePlacing(true);
    A.click();
  }
  function rotatePlacing() {
    if (!placing) return;
    placing.face = SIM.FACINGS[(SIM.FACINGS.indexOf(placing.face) + 1) % 4];
    updatePlacing(true);
    A.click();
  }
  function cancelPlacing() {
    if (!placing) return;
    placing = null;
    FACTORY.clearBuildGhost();
    A.thud();
    redock();
  }
  // The zone, as tiles: for now a machine may only stand on a build site
  // (CURRENT RULE; free placement over open terrain is a later mode, and
  // this set is the one thing it will replace with a terrain answer).
  let siteTiles = null, siteTilesMap = null;
  function siteZone() {
    if (siteTiles && siteTilesMap === mapId) return siteTiles;
    siteTiles = new Set();
    siteTilesMap = mapId;
    for (const p of CHAIN.SITES) {
      const b = MAPKIT.siteBox(p);
      for (let ty = b.r0; ty <= b.r1; ty++) for (let tx = b.c0; tx <= b.c1; tx++) siteTiles.add(tx + ',' + ty);
    }
    return siteTiles;
  }
  // the ghost walks a step ahead of the operator, snapped to the grid: the
  // body stands against the tile they are on, in the direction they face,
  // centred across — so aiming is walking, and turning to face another way
  // swings the ghost round without a key
  function updatePlacing(force) {
    if (!placing) return;
    const pp = FACTORY.playerPos();
    const dir = FACTORY.playerDir();
    const fp = MAPKIT.footprint(CHAIN.KINDS[placing.kind].size, placing.face);
    const ptx = Math.floor(pp.x / 16), pty = Math.floor((pp.y - 2) / 16);
    let c0, r0;
    if (dir === 's') { c0 = ptx - ((fp[0] - 1) >> 1); r0 = pty + 1; }
    else if (dir === 'n') { c0 = ptx - ((fp[0] - 1) >> 1); r0 = pty - fp[1]; }
    else if (dir === 'e') { c0 = ptx + 1; r0 = pty - ((fp[1] - 1) >> 1); }
    else { c0 = ptx - fp[0]; r0 = pty - ((fp[1] - 1) >> 1); }
    if (!force && placing.at && placing.at[0] === c0 && placing.at[1] === r0) return;
    placing.at = [c0, r0];
    const phantom = { kind: placing.kind, at: [c0, r0], face: placing.face };
    const box = CHAIN.machineBox(phantom);
    const zone = siteZone();
    const bodies = new Set();
    for (const om of profile.machines) {
      const ob = CHAIN.machineBox(om);
      for (let ty = ob.r0; ty <= ob.r1; ty++) for (let tx = ob.c0; tx <= ob.c1; tx++) bodies.add(tx + ',' + ty);
    }
    const mine = placing.kind === 'mine';
    // a mine stands on a vein: the first free vein its body covers claims it
    let vein = null;
    if (mine) {
      for (const n of CHAIN.unbuiltNodes(profile)) {
        const vb = MAPKIT.veinBox(n);
        if (box.c0 <= vb.c1 && box.c1 >= vb.c0 && box.r0 <= vb.r1 && box.r1 >= vb.r0) { vein = n; break; }
      }
    }
    // the price: a machine's is its kind's next instance; a mine prices
    // itself off the vein under it — an open ore's extra-mine price, or the
    // vein's opening price, which is the only thing that orders the ores
    // (the coal seam asks for quartz). A vein the bag cannot cover is not
    // a target at all — the whole footprint reads red, like any bad ground
    // — and machines were gated at the build menu, so an unaffordable ghost
    // never stands.
    let price = null, unlock = false, later = false;
    if (!mine) price = CHAIN.priceMachine(placing.kind, CHAIN.machinesOfKind(profile, placing.kind).length + 1);
    else if (vein) {
      if (CHAIN.oreOpen(profile, vein.ore)) price = CHAIN.priceExtraMine(vein.ore);
      else if (CHAIN.priceNode(vein.ore)) { price = CHAIN.priceNode(vein.ore); unlock = true; }
      else later = true;
    }
    const poor = !!price && !canPay(price);
    const tiles = [];
    let ground = true;
    for (let ty = box.r0; ty <= box.r1; ty++) for (let tx = box.c0; tx <= box.c1; tx++) {
      const k = tx + ',' + ty;
      const ok = !bodies.has(k) && (mine ? !!vein : zone.has(k)) && !later && !poor;
      if (!ok) ground = false;
      tiles.push([tx, ty, ok]);
    }
    placing.vein = vein;
    placing.price = price;
    placing.unlock = unlock;
    placing.later = later;
    placing.poor = poor;
    placing.ground = ground;
    placing.ok = ground && (!mine || !!vein);
    // no price row over the ghost: the build menu already named it, and the
    // caption still says so when the bag cannot cover it
    FACTORY.showBuildGhost(phantom, tiles, placing.ok);
    refreshCaption();
  }
  function placeNow() {
    if (!placing) return;
    updatePlacing(true);
    if (!placing.ok) { cancelPlacing(); return; }
    const { kind, face, at, price, vein, unlock } = placing;
    let pair = null;
    if (unlock) pair = E.unlockPair(profile, CHAIN.pairOf(vein.ore, 1));
    if (price) spend(price);
    const m = { id: 'm' + (profile.nextMachineId++), kind, at: at.slice(), face, auto: false };
    if (kind === 'mine') { m.ore = vein.ore; m.node = vein.index; }
    profile.machines.push(m);
    placing = null;
    FACTORY.clearBuildGhost();
    const landed = afterPurchase({ dockId: 'm:' + m.id }, price);
    // the card waits for the body: a mine that opens a pair is the build
    // most worth watching, and a card over the smoke is a card over nothing
    if (pair) { pendingUnlock = pair; setTimeout(() => showUnlockCard(pair), landed + 140); }
  }

  function openMenu() {
    const rows = menuRowsFor(dock);
    if (!rows.length) return false;
    // the highlight opens on the first row you could act on — but never on
    // the removal, which a stray tap would otherwise take down
    const open = (r) => r.enabled !== false && !(r.action && r.action.type === 'remove-machine');
    let sel = rows.findIndex(open);
    if (sel < 0) sel = rows.findIndex((r) => r.enabled !== false);
    if (sel < 0) sel = 0;
    menu = { rows, sel };
    FACTORY.showMenu(dock.id, rows, sel);
    refreshCaption();
    A.click();
    return true;
  }
  function closeMenu() {
    menu = null;
    FACTORY.clearMenu();
    refreshCaption();
  }
  function moveMenu(dir) {
    const mm = menu || buildMenu;
    if (!mm) return;
    const n = mm.rows.length;
    mm.sel = (mm.sel + dir + n) % n;
    FACTORY.showMenu(menu ? dock.id : '@player', mm.rows, mm.sel);
    refreshCaption();
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
    if (act.type === 'mk') {
      if (!canPay(act.price)) return;
      const np = CHAIN.pairOf(act.ore, act.level);
      if (!np || CHAIN.oreMk(profile, act.ore) + 1 !== act.level) return;
      // a Mk retools by construction now: the mines' new depth-product has
      // no ⚙ yet, so they are back in your hands until it is run in and
      // bought — nothing is switched off, the deeper seam is simply new work
      const retooled = CHAIN.machinesOfOre(profile, act.ore).some((m) => autoLive(m));
      const site = dock ? { dockId: dock.id } : null;
      spend(act.price);
      const pair = E.unlockPair(profile, np);
      const landed = afterPurchase(site, act.price);
      if (pair) { pendingUnlock = pair; setTimeout(() => showUnlockCard(pair, retooled), landed + 140); }
    } else if (act.type === 'mk-at') {
      if (!canPay(act.price)) return;
      const np = CHAIN.pairOf(act.kind, act.level);
      if (!np || CHAIN.kindMk(profile, act.kind) + 1 !== act.level) return;
      spend(act.price);
      const pair = E.unlockPair(profile, np);
      const landed = afterPurchase(dock ? { dockId: dock.id } : null, act.price);
      if (pair) { pendingUnlock = pair; setTimeout(() => showUnlockCard(pair, false), landed + 140); }
    } else if (act.type === 'auto') {
      if (!canPay(act.price) || !act.key) return;
      spend(act.price);
      if (!act.m.autoOn) act.m.autoOn = {};
      act.m.autoOn[act.key] = true;
      SIM.ensureMachine(act.m);
      const landed = afterPurchase({ dockId: 'm:' + act.m.id }, act.price);
      setTimeout(() => showBenchAutoCard(act.m), landed + 140);
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
      // its station goes with the repair — an open crossing is not a place —
      // so the site is the span of ground it stood on
      const cr = CHAIN.MAP.CROSSINGS.find((c) => c.id === act.id);
      spend(act.price);
      profile.crossings[act.id] = true;
      const landed = afterPurchase(cr ? { rect: { x: cr.x, y: cr.y, w: cr.w, h: cr.h } } : null, act.price);
      setTimeout(A.fanfare, landed);
    } else if (act.type === 'collect') {
      // the machine empties whether or not the bag can take it all; a stack
      // already at the cap swallows nothing, and the surplus is gone
      if (!SIM.hasOutput(act.m)) return;
      const got = SIM.collect(profile, act.m);
      const total = Object.values(got).reduce((a, b) => a + b, 0);
      for (const mat of Object.keys(got)) { profile.seen[mat] = true; flyMat(mat, dock.id, 3); }
      if (total) { FACTORY.floatText(`+${total}`, dock.id, 0x7fb98a); A.ding(); }
      E.saveProfile(profile);
      refreshInventory();
      refreshStatus();
    } else if (act.type === 'feed') {
      const moved = SIM.feed(profile, act.m);
      const total = Object.values(moved).reduce((a, b) => a + b, 0);
      if (!total) return;
      FACTORY.floatText(`→${total}`, dock.id, 0xeacc78);
      A.mint();
      E.saveProfile(profile);
      refreshInventory();
      refreshStatus();
    } else if (act.type === 'spool') {
      spool = { from: act.m.id };
      spoolRoute = null;
      FACTORY.setSpool(true, CHAIN.machinePos(act.m));
      A.click();
      refreshStatus();
    } else if (act.type === 'socket') {
      if (!act.path || !act.from || !act.to) return;
      SIM.addBelt(profile, act.from, act.to, act.path);
      spool = null; spoolRoute = null;
      FACTORY.setSpool(false);
      FACTORY.setSocketTarget(null);
      // a run costs nothing, so there is no price to fly — it simply lays
      // itself down the length of the route it took
      afterPurchase({ path: act.path });
    } else if (act.type === 'unbelt') {
      const b = (profile.belts || []).find((x) => x.id === act.id);
      if (!b) return;
      DROPS.demolish(profile, { belt: b });
      afterDemolish();
    } else if (act.type === 'remove-machine') {
      const m = act.m;
      if (profile.machines.indexOf(m) < 0) return;
      DROPS.demolish(profile, { machine: m, back: act.back });
      afterDemolish();
    }
  }
  // The world is rebuilt before the save, here and below, for the reason the
  // turn gives: re-laying the runs is part of the act, and a run that had
  // nowhere to go leaves its goods on the ground. Saving first wrote the
  // world as it was a moment before that.
  //
  // Everything bought goes out through here, the way everything destroyed
  // goes out through DROPS.demolish — and this is that, run backwards. The
  // price climbs out of the bag and flies to the site; the site fills with
  // smoke as it arrives; the body settles out of the smoke and the latch
  // closes on it. `built` names the site the way demolish names what is
  // coming apart — {dockId} a body, {path} a run, {rect} a place with no
  // station left — and anything bought later must name itself too, or it
  // simply appears, which is the one thing nothing in this world does.
  function afterPurchase(built, cost) {
    rebuildWorld();
    E.saveProfile(profile);
    const site = built ? FACTORY.siteOf(built) : null;
    let flying = 0;
    if (site) {
      for (const [mat, n] of Object.entries(cost || {})) {
        if (!(n > 0)) continue;
        countHint[mat] = { drain: true };         // the row walks down behind them
        flying = Math.max(flying, flyTo(mat, Math.min(n, 3), site.x, site.y));
      }
      if (flying) A.pay();
    }
    refreshInventory();
    refreshKeyboard();
    redock();
    // the site smokes for the whole flight and the body settles as the last
    // of the price arrives, so the ground is never bare between the ghost
    // going and the thing standing
    const landed = built ? FACTORY.materialize(built, flying) : 0;
    if (built) setTimeout(A.assemble, Math.max(0, landed - 340));
    setTimeout(A.build, landed);
    return landed;                   // when the thing is standing, for a caller with something to say after
  }
  // Taking a thing down is a purchase run backwards, minus the chunk of the
  // latch closing: DROPS.demolish has already made the poof and its sound,
  // and nothing has reached the bag yet — the materials are lying on the
  // ground waiting to be walked over.
  function afterDemolish() {
    rebuildWorld();
    E.saveProfile(profile);
    refreshInventory();
    refreshKeyboard();
    redock();
  }
  // returns {moved, lost}: runs the world re-laid or gave up on because a
  // machine's ports are somewhere else now (a turn, or a save from before
  // machines had ports)
  function rebuildWorld() {
    if (!profile) return null;
    return FACTORY.buildWorld(profile, autoLive) || null;
  }

  // ---------- Enter-action + dock glow (icons in-world carry the info) ----------
  function refreshStatus() {
    if (!profile) return;
    const rows = menu ? menu.rows : menuRowsFor(dock);
    const any = rows.some((r) => r.enabled !== false);
    if (spool && dock) {
      // carrying: the place is a socket (green) or not (red) — nothing else
      const here = socketHere();
      FACTORY.setDockGlow(here ? 0x6cc46c : 0xd84f4f);
      FACTORY.setSocketTarget(here ? dock.id : null);
    } else {
      FACTORY.setDockGlow(any ? 0x7fb98a : 0xc9a24a);
      FACTORY.setSocketTarget(null);
    }
    refreshInfo();
    refreshMarks();
    refreshCaption();
  }
  // info rows above the docked machine: the one recipe it is running now
  // (with ✗ while the bag can't pay for it). Every other choice — the other
  // recipes, the spool, ⚙, taking it down — waits in the menu behind the hold.
  function refreshInfo() {
    if (!dock || dock.kind !== 'machine') { FACTORY.clearInfo(); return; }
    const m = dock.m;
    const rows = [];
    if (m.kind !== 'mine') {
      if (!recipe) rows.push({ pre: '✗', enabled: false });
      else rows.push({ items: recipe.in, out: recipe.out, enabled: true, ok: !SIM.canTake(profile, m, recipe.in) && !unitPaid ? false : undefined });
    }
    // what is inside the machine: inputs waiting, outputs made
    SIM.ensureMachine(m);
    const inb = nonZero(m.buf.in), outb = nonZero(m.buf.out);
    if (Object.keys(inb).length) rows.push({ pre: '→', items: inb, enabled: true });
    if (Object.keys(outb).length) rows.push({ pre: '↓', items: outb, enabled: true });
    if (!rows.length) { FACTORY.clearInfo(); return; }
    FACTORY.showInfo(dock.id, rows.slice(0, 5));
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
    glossLine.innerHTML = `<b>${word.text}</b> · ${word.gloss}${mark}`;
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
    $('stat-acc').textContent = acc === null ? '–' : (acc * 100).toFixed(1) + '%';
    const wpm = sessionWPM();
    $('stat-wpm').textContent = wpm === null ? '–' : wpm.toFixed(0);
    $('stat-streak').textContent = session.streak;
    $('stat-time').textContent = fmtTime(session.activeMs);
  }

  // ---------- input ----------
  // ONE interact key, three lives. On press: if the drill's next character
  // is a space, it is typed right then (never on release, and a held space
  // that isn't the next character costs nothing). Holding for half a second
  // (a charge bar fills above the operator) does the place's big thing:
  // opens the menu at a place with rows, lays or drops a carried belt — and
  // in open field, where a hold once did nothing, it raises the BUILD menu
  // (rotation overhaul, 2026-08-21). The build menu answers the release: a
  // tap of Space picks the highlighted kind, a hold cancels the menu. With
  // the ghost up, a tap turns it a quarter clockwise and a hold builds —
  // on bad ground the same hold cancels. A regular menu keeps its manners:
  // arrows choose, a tap confirms on the press, Escape closes.
  const HOLD_MS = 500;
  let spaceDown = false;   // Space is held right now
  let chargeTimer = null;
  let tapVerb = null;      // what a release before the threshold does

  function cancelCharge() {
    if (chargeTimer) { clearInterval(chargeTimer); chargeTimer = null; }
    tapVerb = null;
    FACTORY.setCharge(null);
  }
  // charge toward `hold`; a release before the threshold fires `tap` instead
  function beginHold(hold, color, tap) {
    tapVerb = tap || null;
    const start = performance.now();
    FACTORY.setCharge(0, color);
    chargeTimer = setInterval(() => {
      const p = (performance.now() - start) / HOLD_MS;
      FACTORY.setCharge(Math.min(1, p), color);
      if (p >= 1) {
        cancelCharge();
        hold();
        refreshStatus();
      }
    }, 33);
  }
  function startSpace() {
    if (spaceDown) return;
    spaceDown = true;
    // a menu is open: the tap confirms the highlighted row, nothing else
    if (menu) { confirmMenu(); refreshStatus(); return; }
    // the build menu: a tap picks, a hold puts the whole thing away
    if (buildMenu) { beginHold(closeBuildMenu, 0xd84f4f, confirmBuildMenu); return; }
    // the ghost: a tap turns it, a hold builds — or cancels on bad ground
    if (placing) {
      const ok = !!placing.ok;
      beginHold(ok ? placeNow : cancelPlacing, ok ? 0x6cc46c : 0xd84f4f, rotatePlacing);
      return;
    }
    // the typed space, at once — only when it is the next character
    if (canTypeHere() && lineText[pos] === ' ') handleTyped(' ');
    // what the hold will do: lay the belt here / drop the spool (carrying),
    // open the menu (a place with rows), or raise the build menu in open field
    if (spool) {
      const here = socketHere();
      beginHold(
        here ? () => { const act = socketHere(); if (act) performAction(act); else dropSpool(); } : dropSpool,
        here ? 0x6cc46c : 0xd84f4f
      );
      return;
    }
    if (menuRowsFor(dock).length > 0) beginHold(openMenu, 0xf2c14e);
    else beginHold(openBuildMenu, 0xf2c14e);
  }
  function endSpace() {
    if (!spaceDown) return;
    const tap = tapVerb;
    cancelCharge();
    spaceDown = false;
    if (tap) { tap(); refreshStatus(); }
  }

  // headless inspection (dev/play.html and the harnesses): read-only state
  window.MK_DEBUG = {
    state: () => ({
      dock: dock ? dock.id : null,
      menu: menu ? { sel: menu.sel, rows: menu.rows.map((r) => (r.action ? r.action.type : 'none') + (r.enabled === false ? '(off)' : '')) } : null,
      buildMenu: buildMenu ? { sel: buildMenu.sel, rows: buildMenu.rows.map((r) => (r.action ? r.action.kind : 'none') + (r.enabled === false ? '(off)' : '')) } : null,
      placing: placing ? { kind: placing.kind, face: placing.face, at: placing.at, ok: placing.ok } : null,
      spool, spoolRoute: spoolRoute ? spoolRoute.length : null,
    }),
  };

  // debug: Ctrl+Alt+M — 500 of every material in the tree, whether or not this
  // save has opened its ore or built anything that makes it. Developer mode
  // arms it; with the box unticked the combo does nothing.
  const DEBUG_MATERIALS = 500;
  function debugMaterials() {
    let n = 0;
    for (const mat of CHAIN.MAT_IDS) {
      if (!CHAIN.bagAdd(profile.bag, mat, DEBUG_MATERIALS)) continue;   // already at the cap
      profile.seen[mat] = true;
      n++;
    }
    E.saveProfile(profile);
    refreshInventory();
    refreshStatus();
    if (dock) FACTORY.floatText(`+${DEBUG_MATERIALS}×${n}`, dock.id, 0x7fb98a);
    flashCaption(T.t('capCheat', { n, amount: DEBUG_MATERIALS }));
    A.fanfare();
  }

  // debug: hold Tab — the drill types itself, correctly, as fast as the frame
  // will carry, so the mechanics can be tested without doing the typing that
  // pays for them. Developer mode arms it; with the box unticked Tab is Tab.
  //
  // Every autotyped character goes through the same handleTyped() a real key
  // goes through: ore, recipes, belts, spills, prices, the ladder and the
  // finish all run for real, and the only thing skipped is the finger. What it
  // will not do is sign the typing record — see handleTyped: the letter stats,
  // the accuracy and the WPM stay a record of the hands, not of the machine
  // that stood in for them.
  //
  // Speed is a rate, not a race: AUTO_CPS characters a second, measured off
  // the clock rather than off the frame, so it reads the same on any machine.
  // The fraction of a character a frame leaves over is carried to the next one
  // — dropping it would quietly cost about a fifth of the rate at 60fps.
  // Three keys, any of which does it, because a hold key has to be one the
  // browser has no opinion about. Tab was the obvious hold and the wrong one:
  // it drives focus navigation, and a page that only asks for it politely (a
  // listener in the bubble phase, preventDefault) can still be beaten to it.
  // Backspace is the one to lean on — a big key under the right little finger
  // that browsers stopped steering with in 2016 — with backslash next to it
  // and Tab left in for the boards where it does come through. None of the
  // three carries a glyph on either course's board, so none costs a key.
  const AUTO_KEYS = new Set(['Backspace', 'Backslash', 'Tab']);
  const AUTO_CPS = 200;         // characters a second
  const AUTO_MAX_GAP = 250;     // ms of one frame that may be paid for; a stalled
                                // tab owes for the stall, not for the whole nap
  const AUTO_SAVE_MS = 1500;    // the per-line save steps aside for this one
  let autoTyping = false, autoRaf = null, autoSavedAt = 0, autoChars = 0;
  let autoLastFrame = 0, autoOwed = 0;

  function autoTypeFrame() {
    autoRaf = null;
    if (!autoTyping) return;
    const now = performance.now();
    autoOwed += Math.min(AUTO_MAX_GAP, now - autoLastFrame) * AUTO_CPS / 1000;
    autoLastFrame = now;
    const budget = Math.floor(autoOwed);
    autoOwed -= budget;                                   // the remainder rides to the next frame
    let n = 0;
    while (n < budget) {
      // a door shut mid-hold cancels what is owed rather than banking it: a
      // walk across the map must not arrive as one burst at the next machine
      if (!overlay.classList.contains('hidden')) { autoOwed = 0; break; }   // a card is up: hands off
      if (menu || buildMenu || placing) { autoOwed = 0; break; }            // and the same doors a real keystroke waits at
      if (!canTypeHere()) { autoOwed = 0; break; }                          // walking, or standing somewhere with no drill
      if (lineText[pos] === undefined) { autoOwed = 0; break; }
      handleTyped(lineText[pos]);
      n++;
    }
    if (n) {
      autoChars += n;
      // the once-a-frame half of what a keystroke normally does per character
      renderLine();
      FACTORY.castLetter(true);
      flushFloats();
      refreshInventory();
      refreshStatus();
      if (now - autoSavedAt > AUTO_SAVE_MS) { E.saveProfile(profile); autoSavedAt = now; }
    }
    autoRaf = requestAnimationFrame(autoTypeFrame);
  }

  function autoTypeStart() {
    if (autoTyping || !profile) return;
    autoTyping = true;
    autoChars = 0;
    autoOwed = 0;
    autoLastFrame = performance.now();
    autoSavedAt = autoLastFrame;
    clearHint();
    A.setMuted(true);            // a few hundred key clicks a second is a buzzsaw
    refreshCaption();            // the caption says so for as long as the key is down
    autoRaf = requestAnimationFrame(autoTypeFrame);
  }
  function autoTypeStop() {
    if (!autoTyping) return;
    autoTyping = false;
    if (autoRaf) cancelAnimationFrame(autoRaf);
    autoRaf = null;
    A.setMuted(false);
    if (profile) E.saveProfile(profile);
    renderLine();
    flushFloats();
    refreshInventory();
    refreshKeyboard();
    refreshStats();
    refreshStatus();
    flashCaption(T.t('capDebugAutoDone', { n: autoChars }));
  }
  // The hold is armed from the capture phase, ahead of every other listener on
  // the page and ahead of the browser's own reading of the key, and the event
  // is swallowed whole. Asking politely from the bubble phase is what let Tab
  // move the focus instead of running the drill.
  window.addEventListener('keydown', (e) => {
    if (!AUTO_KEYS.has(e.code)) return;
    if (!overlay.classList.contains('hidden') || !profile || !DEVMODE.isEnabled()) return;   // a card up, or the box unticked: the key is the browser's again
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) autoTypeStart();
  }, { capture: true });
  window.addEventListener('keyup', (e) => { if (AUTO_KEYS.has(e.code)) autoTypeStop(); }, { capture: true });
  // a key held while the window goes away never sends its keyup
  window.addEventListener('blur', autoTypeStop);
  window.addEventListener('keydown', (e) => {
    noteRealKeyboard(e);
    const overlayOpen = !overlay.classList.contains('hidden');
    const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (((e.ctrlKey && e.altKey && e.code === 'KeyM') || (e.ctrlKey && e.shiftKey && e.code === 'KeyQ')) && !overlayOpen && profile && DEVMODE.isEnabled()) {
      e.preventDefault();
      debugMaterials();
      return;
    }
    // The sky, by hand. Ctrl+Alt+T walks the day forward an eighth at a time,
    // Ctrl+Alt+W steps through the skies and then hands the weather back. Both
    // only exist with developer mode on, and neither touches a save.
    if (e.ctrlKey && e.altKey && (e.code === 'KeyT' || e.code === 'KeyW') && window.SKY && DEVMODE.isEnabled()) {
      e.preventDefault();
      if (e.code === 'KeyT') {
        SKY.jump(SKY.report().t + 0.125);
      } else {
        const r = SKY.report();
        const i = SKY.SKY_IDS.indexOf(r.weather);
        const next = r.forced && i === SKY.SKY_IDS.length - 1 ? null : SKY.SKY_IDS[r.forced ? i + 1 : 0];
        SKY.force(next, true);
      }
      const r = SKY.report();
      console.log('[sky] ' + r.clock + '  ' + r.hour + '  ' + r.weather + (r.forced ? '  (held)' : '  (running)'));
      return;
    }
    if (ARROWS[e.code]) {
      e.preventDefault();
      if (overlayOpen) return;
      if (menu || buildMenu) {
        if (!e.repeat) moveMenu(e.code === 'ArrowUp' || e.code === 'ArrowLeft' ? -1 : 1);
        return;
      }
      FACTORY.setMove(ARROWS[e.code], true);
      return;
    }
    if (e.code === 'Escape' && !overlayOpen) {
      if (menu) { e.preventDefault(); closeMenu(); refreshStatus(); return; }
      if (buildMenu) { e.preventDefault(); closeBuildMenu(); refreshStatus(); return; }
      if (placing) { e.preventDefault(); cancelPlacing(); refreshStatus(); return; }
    }
    if (e.code === 'Space' && !overlayOpen) {
      e.preventDefault();
      if (!e.repeat) startSpace();
      return;
    }
    if (overlayOpen || menu || buildMenu || placing) return;
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
      // The autotyper drives the world but never signs the register: no
      // latency, no letter stat, no character on the session's count. What it
      // does not measure it cannot lie about, so the skill model and the two
      // readouts over the board stay a record of the hands that really typed.
      lastCorrectTime = autoTyping ? null : now;

      if (!autoTyping) {
        if (expected !== ' ') E.recordHit(profile, expected, latency);
        session.chars++;
        session.streak++;
        if (session.streak > session.bestStreak) session.bestStreak = session.streak;
        profile.totalChars++;

        A.click();
        A.onKey(latency, session.streak);      // the streak pushes the weather back
      }

      if (expected !== ' ') {
        if (!autoTyping) FACTORY.castLetter(true);   // once a frame instead, while the autotyper runs
        workKeystroke();
      }

      pos++;
      attemptsAtPos = 0;
      if (!autoTyping) advanceCaret();

      if (lineText[pos] === ' ' || pos >= lineText.length) {
        const endedIdx = lineText.slice(0, pos).split(' ').length - 1;
        const word = words[endedIdx];
        if (word) {
          session.wordsTyped++;
          const clean = !wordHadError;
          const justCollected = collectWord(word, clean);
          // the panels: per word by hand, per frame under the autotyper —
          // hundreds of words a second is not something a panel can show
          if (!autoTyping) {
            showGloss(word, justCollected);
            flushFloats();
            refreshInventory();
            refreshStatus();
          }
        }
        wordHadError = false;
      }

      if (pos >= lineText.length) finishLine();
      else scheduleHint();
      if (!autoTyping) refreshStats();
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
      // the weather comes back in when the run ends. Nothing is taken away for
      // the miss: the world simply stops being pushed back.
      A.setDrive(0);
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
    if (!autoTyping) {
      A.press();
      flushFloats();
      refreshInventory();
      E.saveProfile(profile);   // the autotyper saves on its own beat instead
    }
    // the bag may now pay for a different recipe
    if (dock && dock.kind === 'machine' && dock.m.kind !== 'mine') recipe = pickRecipe(dock.m);
    if (!autoTyping) refreshStatus();

    if (session.activeMs > SOFT_STOP_MIN * 60000 && session.activeMs - lastSoftStopAt > 10 * 60000) {
      lastSoftStopAt = session.activeMs;
      showSoftStopCard();
      return;
    }
    proceedAfterLine();
  }
  function proceedAfterLine() {
    newLine();
  }

  // ---------- docking ----------
  FACTORY.onDock = (id) => {
    closeMenu();
    dock = null;
    if (id && id.startsWith('m:')) {
      const m = profile.machines.find((x) => 'm:' + x.id === id);
      if (m) dock = { id, kind: 'machine', m };
    } else if (id && id.startsWith('cross:')) {
      const crossing = CHAIN.closedCrossings(profile).find((c) => 'cross:' + c.id === id);
      if (crossing) dock = { id, kind: 'crossing', crossing };
    } else if (id && id.startsWith('belt:')) {
      const def = FACTORY.posOf(id);
      if (def) dock = { id, kind: 'belt', tile: def.tile, belts: def.belts };
    }
    recipe = dock && dock.kind === 'machine' ? pickRecipe(dock.m) : null;
    unitAcc = 0; unitPaid = false; dryNow = false;
    lastCorrectTime = null;
    glossLine.classList.remove('visible');
    // carrying a spool: preview the route to this machine (green) or the
    // lack of one (red)
    spoolRoute = null;
    FACTORY.clearGhost();
    if (spool && dock && dock.kind === 'machine' && dock.m.id !== spool.from) {
      const from = SIM.machineById(profile, spool.from);
      const link = from ? SIM.canLink(profile, from, dock.m) : { ok: false };
      if (link.ok) {
        spoolRoute = FACTORY.routeBelt(from, dock.m, profile);
        FACTORY.showGhost(spoolRoute || [], !!spoolRoute);
      }
    }
    if (canTypeHere()) newLine(); else clearLine();
    refreshLessonLights();
    refreshStatus();
  };
  const redock = () => FACTORY.onDock(FACTORY.getDocked());

  // ---------- the clock (phase 3) ----------
  // Automated machines and belts run in real time; the live tick advances
  // them by the real elapsed time, a return from a hidden tab or a reload
  // fast-forwards (bounded by buffers). Hands never touch this.
  //
  // Two hands wind the same clock. SIM.tick advances by the time actually
  // elapsed and takes it from one lastTick, so whichever hand arrives first
  // does the work and the other finds nothing left to do — they cannot
  // double-count between them. The animation frame drives it while the page
  // is drawing, which is what moves goods a pixel at a time instead of in
  // visible jumps; the timer carries it while the tab is in the background,
  // where frames stop but the factory should not.
  let simRaf = null, simTimer = null, simSaveAcc = 0, beltFloatAcc = 0;
  let lastGroundTile = null;
  // The goods lying on the ground settle, then follow the operator in. This
  // is the only place they reach the bag: DROPS says what was picked up and
  // where it was lying, and the flight and the pop are the ones the typed
  // goods already use. Returns true when anything landed.
  function sweepDrops(dt) {
    if (!window.DROPS || !FACTORY.playerPos) return false;
    const at = FACTORY.playerPos();
    // a stack the bag has no room for stays lying where it is (canTake);
    // a partly-taken one falls back with the remainder
    const got = DROPS.tick(profile, dt, at.x, at.y, (mat) => (profile.bag[mat] || 0) < CHAIN.TUNING.BAG_CAP);
    if (!got) return false;
    for (const g of got) {
      const kept = CHAIN.bagAdd(profile.bag, g.mat, g.n);
      profile.seen[g.mat] = true;
      if (kept < g.n) DROPS.spawn(profile, g.mat, g.n - kept, g.x, g.y);
      if (!kept) continue;
      flyFrom(g.mat, Math.min(kept, 3), g.x, g.y);
      A.pickup();
    }
    refreshInventory();
    refreshStatus();
    return true;
  }
  function simTick() {
    if (!profile) return;
    // the build ghost walks with the operator: re-aim it as they move
    if (placing) updatePlacing();
    // the caption names the ground as the operator crosses it — a vein, a
    // site, open field, which no dock event announces
    const gp = FACTORY.playerPos();
    const gt = Math.floor(gp.x / 16) + ',' + Math.floor((gp.y - 1) / 16);
    if (gt !== lastGroundTile) {
      lastGroundTile = gt;
      if (!dock && !menu && !buildMenu && !placing && !spool) refreshCaption();
    }
    const dt = SIM.tick(profile, Date.now());
    if (dt <= 0) return;
    simSaveAcc += dt;
    if (sweepDrops(dt)) simSaveAcc += 16000;   // the ground changed: bank it on this beat
    if (simSaveAcc > 15000) { simSaveAcc = 0; E.saveProfile(profile); }
    // the docked machine's buffers change under you; redraw its rows now and then
    beltFloatAcc += dt;
    if (beltFloatAcc > 1000) {
      beltFloatAcc = 0;
      const parts = Object.entries(beltFloat).filter(([, k]) => k > 0);
      if (parts.length && dock) { FACTORY.floatText('→' + parts.map(([, k]) => k).join('+'), dock.id, 0xeacc78); beltFloat = {}; }
      if (dock && dock.kind === 'machine') refreshInfo();
    }
  }
  function startClock() {
    if (simRaf) cancelAnimationFrame(simRaf);
    if (simTimer) clearInterval(simTimer);
    const spin = () => { simTick(); simRaf = requestAnimationFrame(spin); };
    simRaf = requestAnimationFrame(spin);
    // the background hand: browsers hold this to about once a second in a
    // hidden tab, which is plenty — the tick reads the real elapsed time
    simTimer = setInterval(simTick, 250);
  }
  document.addEventListener('visibilitychange', () => {
    if (!profile) return;
    // the clock keeps running in the background on the timer; bank the save
    // on the way out in case the tab never comes back, and on the way in
    // settle up whatever the throttle has let pile up
    if (document.hidden) { E.saveProfile(profile); return; }
    SIM.catchUp(profile, Date.now()); refreshInventory(); if (dock) refreshInfo();
  });

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

  function showUnlockCard(pair, retooled) {
    overlayRerender = () => showUnlockCard(pair, retooled);
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
      ${retooled ? `<p class="muted">${T.t('unlockRetool')}</p>` : ''}
      <button id="ov-continue" class="btn-primary">${T.t('unlockGo')}</button>
    `);
    // paint the new ore band under the glow, so when the glow drops away the
    // key is already wearing the colour of the mine that paid for it
    const caps = [];
    for (const k of keys) {
      const cap = keycapEls[LAYOUT.CHAR_TO_CODE[k]];
      if (!cap) continue;
      paintBand(cap, k, true);
      cap.classList.add('unlock-glow');
      caps.push(cap);
    }
    $('ov-continue').onclick = () => {
      for (const cap of caps) cap.classList.remove('unlock-glow');
      hideOverlay();
      pendingUnlock = null;
      lastCorrectTime = null;
      redock();
    };
    $('ov-continue').focus();
  }
  function showBenchAutoCard(m) {
    overlayRerender = () => showBenchAutoCard(m);
    A.fanfare();
    showOverlay(`
      <div class="card-station">${T.t('benchAutoStation')}</div>
      <h2>${T.t('benchAutoTitle', { name: m.kind === 'mine' ? (T.t('oreMineNames')[m.ore] || m.ore) : (T.t('kindNames')[m.kind] || m.kind) })}</h2>
      <p>${T.t(m.kind === 'mine' ? 'benchAutoNote' : 'autoNoteProcessor')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('automationGo')}</button>
    `);
    $('ov-continue').onclick = () => { hideOverlay(); };
    $('ov-continue').focus();
  }
  // the finish: the frontier is built. Free play continues — raised bars,
  // hint-free by now, more pages — nothing shuts.
  function showFinishCard() {
    overlayRerender = showFinishCard;
    A.fanfare();
    const hours = profile.totalActiveMs ? (profile.totalActiveMs / 3600000).toFixed(1) : null;
    showOverlay(`
      <div class="card-station">${T.t('finishStation')}</div>
      <h2>${T.t('finishTitle')}</h2>
      <p>${T.t('finishNote', { k: CHAIN.TUNING.K_HEAVY })}</p>
      ${hours ? `<p class="muted">${T.t('finishHours', { hours })}</p>` : ''}
      <button id="ov-continue" class="btn-primary">${T.t('finishGo')}</button>
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
    const nexts = CHAIN.rungsInView(profile);
    const next = CHAIN.nextPairs(profile).length ? { list: (nexts.length ? nexts : [CHAIN.nextPair(profile)]).map((p) => T.t('nextKeyAt', { ch: p.keys.join(' '), place: placeName_(p).toLowerCase() })).join(' · ') } : null;
    const bar = CHAIN.targetBar(profile);
    showOverlay(`
      <div class="card-station">${T.t('blockStation')}</div>
      <h2>${T.t('blockLines', { n: session.linesDone })}</h2>
      <div class="summary-grid">
        <div><span class="sum-val">${sessionAccuracy() === null ? '–' : (sessionAccuracy() * 100).toFixed(1) + '%'}</span><span class="sum-label">${T.t('sumAccuracy')}</span></div>
        <div><span class="sum-val">${sessionWPM() === null ? '–' : sessionWPM().toFixed(0)}</span><span class="sum-label">${T.t('sumWpm')}</span></div>
        <div><span class="sum-val">${session.bestStreak}</span><span class="sum-label">${T.t('sumStreak')}</span></div>
      </div>
      <p class="muted">${T.t('weakLetters')} ${weakest || '–'}</p>
      ${next ? `<p class="muted">${T.t('nextKeys', { list: next.list, wpm: bar.wpm, acc: Math.round(bar.acc * 100) })}</p>` : `<p class="muted">${T.t('allUnlocked')}</p>`}
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
  // The thumbnails are baked files, never drawn here. They used to come from
  // TILES.minimap at load, which meant baking every world's terrain in full
  // before the player had chosen one — eighteen seconds of frozen main thread
  // on the picker, for two images that only change when a map does.
  //
  // Regenerate them with dev/map-thumbs.html after editing or adding a map.
  // That is the only way these files are produced; nothing writes them at run
  // time. A map whose PNG is missing shows an empty frame, not a stall.
  const mapThumb = (id) => `assets/maps/${id}.png`;
  function fmtDay(ts) {
    const d = new Date(ts), now = new Date();
    const day = (x) => Math.floor((x - new Date(x).getTimezoneOffset() * 60000) / 86400000);
    const diff = day(now.getTime()) - day(ts);
    if (diff <= 0) return T.t('dayToday');
    if (diff === 1) return T.t('dayYesterday');
    return d.toLocaleDateString(T.getLang() === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
  }
  // ---------- the two switches: interface language, keyboard course ----------
  // Flags carry the recognition — Windows has no flag emoji, so FLAGS draws
  // them. The layout switch names itself as well: the choice there is QWERTY
  // or ЙЦУКЕН, not a country. Both switches render from their registry, so a
  // third language or layout arrives without touching this file.
  function langSwitchHTML() {
    return T.langs().map((l) => {
      const on = l.id === T.getLang();
      return `<button class="seg-btn flag-btn${on ? ' active' : ''}" data-lang="${l.id}"`
        + ` title="${l.native}" aria-label="${l.native}" aria-pressed="${on}">`
        + `${FLAGS.svg(l.flag)}</button>`;
    }).join('');
  }
  // The atmosphere switch: how much of the sky the player wants over the map.
  // Full is the day, the weather and everything that moves in it; calm keeps
  // the hour and the lamps and stops the rain, the snow and the drifting cloud
  // shadow, for anyone the movement pulls away from the line they are typing;
  // off leaves the world lit flat, the way it was before any of this.
  const SKY_MODES = ['full', 'calm', 'off'];
  function skySwitchHTML() {
    const now = window.SKY ? SKY.mode() : 'off';
    return SKY_MODES.map((m) => {
      const on = m === now;
      return `<button class="seg-btn${on ? ' active' : ''}" data-sky="${m}" aria-pressed="${on}">`
        + `${T.t('setSkyModes')[m]}</button>`;
    }).join('');
  }
  function courseSwitchHTML() {
    return COURSES.list().map((c) => {
      const on = c.id === COURSES.get();
      return `<button class="seg-btn flag-btn${on ? ' active' : ''}" data-course="${c.id}"`
        + ` title="${c.name}" aria-pressed="${on}"${c.ready ? '' : ' disabled'}>`
        + `${FLAGS.svg(c.flag)}<span>${c.shortName}</span></button>`;
    }).join('');
  }
  // A globe marks the language the game speaks, a keyboard the layout it
  // teaches. No words: a player who reads neither language still has to find
  // both switches on the first screen. The words survive as the icon's
  // accessible name and tooltip.
  function switchesHTML(idPrefix) {
    return `
      <div class="switches">
        <span class="switch-label" title="${T.t('setLanguage')}">${ICONS.svg('globe', T.t('setLanguage'))}</span>
        <span class="seg" id="${idPrefix}-lang">${langSwitchHTML()}</span>
        <span class="switch-label" title="${T.t('setLayout')}">${ICONS.svg('keyboard', T.t('setLayout'))}</span>
        <span class="seg" id="${idPrefix}-course">${courseSwitchHTML()}</span>
      </div>`;
  }
  function wireSwitches(idPrefix, rerender) {
    document.querySelectorAll(`#${idPrefix}-lang .seg-btn`).forEach((b) => {
      b.onclick = () => { T.setLang(b.dataset.lang); applyI18n(); rerender(); };
    });
    document.querySelectorAll(`#${idPrefix}-course .seg-btn`).forEach((b) => {
      b.onclick = () => {
        // The layout and its course data bind once at load, and every save is
        // course-scoped; starting over is the honest way to hand the game a
        // different keyboard.
        if (!COURSES.set(b.dataset.course)) return;
        if (profile) E.saveProfile(profile);
        location.reload();
      };
    });
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
          <span class="map-thumb"><img src="${th}" alt="" decoding="async"></span>
          <b>${T.t('mapNames')[id]}</b>
          <span class="map-tagline">${T.t('mapTaglines')[id]}</span>
          <span class="map-progress">${progress}</span>
          <span class="map-go">${go}</span>
        </button>`;
    }).join('');
    showOverlay(`
      <div class="card-station">${T.t('mapSelectStation')}</div>
      <h2>${T.t('mapSelectTitle')}</h2>
      <p class="muted map-note">${T.t('mapSelectNote')}</p>
      <div class="map-cards" id="map-cards">${cards}</div>
      <div class="map-foot">
        ${switchesHTML('map')}
        ${mapId ? `<button id="ov-cancel" class="link-btn">${T.t('mapSelectBack')}</button>` : ''}
      </div>
    `, true);
    wireSwitches('map', showMapSelect);
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
    buildMenu = null; placing = null; siteTiles = null;
    FACTORY.clearBuildGhost();
    pendingUnlock = null;
    unitAcc = 0; unitPaid = false; dryNow = false; lastCorrectTime = null;
    producedSinceFloat = {};
    for (const k of Object.keys(invPrev)) delete invPrev[k];
    for (const k of Object.keys(invShown)) delete invShown[k];
    for (const k of Object.keys(countHint)) delete countHint[k];
    for (const k of new Set([...Object.keys(countTimers), ...Object.keys(countWaits)])) stopCount(k);
    hudKeysShown = [];
    cancelCharge(); spaceDown = false;

    spool = null; spoolRoute = null; FACTORY.setSpool(false);
    SIM.catchUp(profile, Date.now());
    startClock();

    FACTORY.loadMap();
    // a save from before machines had ports has runs meeting them nowhere:
    // the build re-lays what it can, and that is worth keeping
    const relaid = rebuildWorld();
    if (relaid && (relaid.moved || relaid.lost)) E.saveProfile(profile);
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

  // the colophon's year range extends itself: 2026 stands alone this year, and
  // reads 2026–YYYY from the next one on
  const thisYear = new Date().getFullYear();
  if (thisYear > 2026) $('colophon-years').textContent = '2026–' + thisYear;

  // Two switches in the header, and they are the player's: the events the game
  // makes at you, and the rhythm layer under them. Neither is hidden and
  // neither depends on developer mode. The weather bed answers the sfx switch
  // as well, because "sound effects off" has to mean the game goes quiet; its
  // own switch is a developer one while the bed is still being judged.
  const sfxBtn = $('btn-sfx'), musicBtn = $('btn-music');
  function refreshSoundBtn() {
    sfxBtn.textContent = A.isSfx() ? '🔊' : '🔇';
    // there is no struck-through note in the emoji set that renders anywhere,
    // so the music switch says off by going dim, and its title says it in words
    musicBtn.classList.toggle('btn-off', !A.isMusic());
    sfxBtn.title = T.t(A.isSfx() ? 'sndSfxOn' : 'sndSfxOff');
    musicBtn.title = T.t(A.isMusic() ? 'sndMusicOn' : 'sndMusicOff');
  }
  sfxBtn.onclick = () => { A.setSfx(!A.isSfx()); refreshSoundBtn(); sfxBtn.blur(); };
  musicBtn.onclick = () => { A.setMusic(!A.isMusic()); refreshSoundBtn(); musicBtn.blur(); };

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
      devmode: DEVMODE.isEnabled(),
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
      if (typeof data.devmode === 'boolean') DEVMODE.setEnabled(data.devmode);
      profile = null;
      location.reload();
    };
  }
  function showSettings() {
    overlayRerender = showSettings;
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
          <span class="set-label">${ICONS.svg('globe', T.t('setLanguage'))}${T.t('setLanguage')}</span>
          <span class="seg" id="set-lang">${langSwitchHTML()}</span>
        </div>
        <div class="set-row">
          <span class="set-label">${ICONS.svg('keyboard', T.t('setLayout'))}${T.t('setLayout')}</span>
          <span class="seg" id="set-course">${courseSwitchHTML()}</span>
        </div>
        <div class="set-row">
          <span class="set-label">${T.t('setSky')}</span>
          <span class="seg" id="set-sky">${skySwitchHTML()}</span>
        </div>
        <p class="set-note">${T.t('setSkyNote')}</p>
        <div class="set-row">
          <span class="set-label">${T.t('setSaveFile')}</span>
          <span class="seg"><button class="seg-btn" id="set-export">${T.t('setExport')}</button><button class="seg-btn" id="set-import">${T.t('setImport')}</button></span>
        </div>
        <div class="tip-box">
          <div class="tip-head">${T.t('tipHead')}</div>
          <p class="set-note">${T.t('tipNote')}</p>
          <div class="tip-btns">${tips}</div>
        </div>
        <div class="set-dev-box">
          <label class="set-dev" for="set-dev">
            <input type="checkbox" id="set-dev"${DEVMODE.isEnabled() ? ' checked' : ''}>
            <span>${T.t('setDevMode')}</span>
          </label>
          <p class="set-note set-dev-note" id="set-dev-note"${DEVMODE.isEnabled() ? '' : ' hidden'}>${T.t('setDevNote')}</p>
        </div>
      </div>
      <button id="set-reset" class="link-btn danger">${T.t('btnReset')}</button>
      <div><button id="ov-continue" class="btn-primary">${T.t('passportClose')}</button></div>
    `);
    wireSwitches('set', showSettings);
    document.querySelectorAll('#set-sky .seg-btn').forEach((b) => {
      b.onclick = () => { if (window.SKY) SKY.setMode(b.dataset.sky); showSettings(); };
    });
    $('set-map').onclick = () => showMapSelect();
    $('set-export').onclick = () => exportSave();
    $('set-import').onclick = () => pickImportFile();
    $('set-dev').onchange = (e) => {
      DEVMODE.setEnabled(e.target.checked);
      $('set-dev-note').hidden = !e.target.checked;
      refreshDebugBtn();                       // the 🔧 comes and goes with it
    };
    $('set-reset').onclick = () => showResetConfirm();
    $('ov-continue').onclick = () => hideOverlay();
    $('ov-continue').focus();
  }
  $('btn-settings').onclick = () => { $('btn-settings').blur(); if (profile) showSettings(); };

  // ---------- developer settings ----------
  // A second panel behind a second icon, and the icon is only on screen with
  // developer mode on. Nothing in here is a game setting: it is the bench the
  // atmosphere is judged on, so every switch takes its effect out whole rather
  // than turning it down, and the sky rows drive the same SKY calls the game
  // does. None of it is written into a save.
  const debugBtn = $('btn-debug');
  function refreshDebugBtn() {
    debugBtn.hidden = !DEVMODE.isEnabled();
    debugBtn.title = T.t('dbgTitle');
  }
  debugBtn.onclick = () => { debugBtn.blur(); showDebug(); };

  function showDebug() {
    overlayRerender = showDebug;
    const f = window.SKY ? SKY.fx() : { wet: false, pack: false };
    const r = window.SKY ? SKY.report() : null;
    const seg = (id, on, onLabel, offLabel) =>
      `<span class="seg" id="${id}">`
      + `<button class="seg-btn${on ? ' active' : ''}" data-on="1">${onLabel}</button>`
      + `<button class="seg-btn${on ? '' : ' active'}" data-on="0">${offLabel}</button></span>`;
    const yes = T.t('dbgOn'), no = T.t('dbgOff');
    showOverlay(`
      <div class="card-station">🔧 ${T.t('dbgTitle')}</div>
      <div class="settings-body">
        <p class="set-note">${T.t('dbgNote')}</p>
        <div class="set-row">
          <span class="set-label">${T.t('dbgWeatherSound')}</span>
          ${seg('dbg-wxsound', A.isWeather(), yes, no)}
        </div>
        <div class="set-row">
          <span class="set-label">${T.t('dbgWet')}</span>
          ${seg('dbg-wet', f.wet, yes, no)}
        </div>
        <div class="set-row">
          <span class="set-label">${T.t('dbgPack')}</span>
          ${seg('dbg-pack', f.pack, yes, no)}
        </div>
        <p class="set-note">${T.t('dbgFxNote')}</p>
        <div class="set-row">
          <span class="set-label">${T.t('dbgSky')}</span>
          <span class="seg" id="dbg-sky">${
            (window.SKY ? SKY.SKY_IDS : []).map((id) =>
              `<button class="seg-btn${r && r.forced && r.weather === id ? ' active' : ''}" data-sky="${id}">${id}</button>`).join('')
          }<button class="seg-btn${r && !r.forced ? ' active' : ''}" data-sky="">${T.t('dbgSkyAuto')}</button></span>
        </div>
        <div class="set-row">
          <span class="set-label">${T.t('dbgHour')}</span>
          <span class="seg" id="dbg-hour">${
            [['06:00', 0.25], ['12:00', 0.50], ['18:00', 0.75], ['00:00', 0.00]].map(([lab, t]) =>
              `<button class="seg-btn" data-t="${t}">${lab}</button>`).join('')
          }</span>
        </div>
        <p class="set-note" id="dbg-read">${r ? T.t('dbgRead', {
          clock: r.clock, hour: r.hour, weather: r.weather + (r.forced ? ' *' : ''),
          wet: r.wet.toFixed(2), pack: r.pack.toFixed(2),
        }) : ''}</p>
      </div>
      <div><button id="ov-continue" class="btn-primary">${T.t('passportClose')}</button></div>
    `);
    const wire = (id, set) => {
      document.querySelectorAll('#' + id + ' .seg-btn').forEach((b) => {
        b.onclick = () => { set(b.dataset.on === '1'); showDebug(); };
      });
    };
    wire('dbg-wxsound', (on) => A.setWeather(on));
    wire('dbg-wet', (on) => { if (window.SKY) SKY.setFx('wet', on); });
    wire('dbg-pack', (on) => { if (window.SKY) SKY.setFx('pack', on); });
    document.querySelectorAll('#dbg-sky .seg-btn').forEach((b) => {
      b.onclick = () => { if (window.SKY) SKY.force(b.dataset.sky || null, true); showDebug(); };
    });
    document.querySelectorAll('#dbg-hour .seg-btn').forEach((b) => {
      b.onclick = () => { if (window.SKY) SKY.jump(+b.dataset.t); showDebug(); };
    });
    $('ov-continue').onclick = () => hideOverlay();
    $('ov-continue').focus();
  }

  // ---------- interface language ----------
  function applyI18n() {
    document.documentElement.lang = T.getLang();
    document.title = T.t('docTitle');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = T.t(el.dataset.i18n); });
    refreshSoundBtn();                      // the switch titles are words, so they turn over too
    refreshDebugBtn();
    refreshInventory();
    if (profile) { rebuildWorld(); redock(); }
  }

  // ---------- the keyboard check ----------
  // Every keystroke this game reads is a physical position — `e.code` through
  // the layout's tables — and two of them are held down: space runs a machine,
  // arrows walk. A phone's on-screen keyboard sends neither a position nor a
  // hold, so the game would load, look entirely playable, and then never
  // answer a keystroke. Asking is kinder than failing silently.
  //
  // The question goes to the device's pointer, never to its OS: an Android
  // tablet with a board plugged into it is a machine this game plays fine on,
  // and a laptop with a touchscreen still reports a fine pointer first, so it
  // is never asked. The asking is provisional either way — see below.
  const KBD_SEEN_KEY = 'mk.keyboard';
  let keyboardSeen = false;
  try { keyboardSeen = localStorage.getItem(KBD_SEEN_KEY) === '1'; } catch { /* then ask */ }
  let kbdCardUp = false;

  // One real keydown settles it for good, whether it lands before the card or
  // while the card is up. A soft keyboard reports no position — Android sends
  // keyCode 229 with an empty `code`, iOS an empty `code` alone — so a code
  // that survives this guard is one CODE_TO_CHAR could have looked up, which
  // is exactly the capability in question. Nothing here is a brand check.
  function noteRealKeyboard(e) {
    if (keyboardSeen) return;
    if (!e.code || e.code === 'Unidentified' || e.keyCode === 229 || e.isComposing) return;
    keyboardSeen = true;
    try { localStorage.setItem(KBD_SEEN_KEY, '1'); } catch { /* non-fatal */ }
    if (kbdCardUp) dismissKeyboardCard();
  }

  const needsKeyboardCheck = () =>
    !keyboardSeen && !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  function dismissKeyboardCard() {
    kbdCardUp = false;
    showMapSelect();
  }

  function showKeyboardCard() {
    kbdCardUp = true;
    showOverlay(`
      <div class="card-station">${T.t('kbdStation')}</div>
      <h2>${T.t('kbdTitle')}</h2>
      <p>${T.t('kbdNote')}</p>
      <button id="ov-continue" class="btn-primary">${T.t('kbdDismiss')}</button>
    `);
    $('ov-continue').onclick = dismissKeyboardCard;
    $('ov-continue').focus();
  }

  // ---------- boot ----------
  function boot() {
    applyI18n();
    buildKeyboard();
    refreshStats();
    refreshSoundBtn();
    refreshDebugBtn();
    FACTORY.init(document.getElementById('factory-mount')).then(() => {
      if (loadingCard) loadingCard.classList.add('s3');
      clearLine();
      setTimeout(needsKeyboardCheck() ? showKeyboardCard : showMapSelect, 30);
    });
  }
  // The heavy work waits two frames: the first callback lands before a paint,
  // the second after it, so the loading card is on screen with its pulse
  // running on the compositor before the world build takes the main thread.
  // A hidden tab is handed no frames at all, so that wait would never end —
  // there is nothing on screen to protect there, so boot goes ahead at once,
  // and a timer covers the tab that is hidden after the wait has begun.
  let booted = false;
  const startBoot = () => { if (booted) return; booted = true; boot(); };
  if (document.hidden) startBoot();
  else {
    requestAnimationFrame(() => requestAnimationFrame(startBoot));
    setTimeout(startBoot, 400);
  }
})();
