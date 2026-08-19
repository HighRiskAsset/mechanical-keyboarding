// The overworld, in two dimensions: a frontier the operator walks with all
// four arrows. Machines stand on plots and ore nodes; walking IS the menu;
// hold Space at a place opens its icon menu (rows drawn here). Global: FACTORY
//
// One pixel grid, no exceptions: the canvas upscales by a whole number of
// device pixels (letterboxed), every sprite renders at integer world
// coordinates, and all in-world text is the bitmap pixel font.
(function () {
  'use strict';

  const MIN_VW = 300, MIN_VH = 170;
  let viewW = 430, viewH = 230;        // world pixels currently visible
  const LIM = { n: 48, e: 0, s: 0, w: 0 };
  const DOCK_RANGE = 20;
  const SPEED = 1.35;

  let app, cameraC, labelsC, ready = false;
  let mountEl = null;
  let S = 2;                           // device px per world px — integer, set by resize()
  let stations = {};                   // dock id → {def:{id,x,y,kind,m?,plot?,node?}, root, sp, glow, ...}
  let player = null;
  const charTex = { down: [], up: [], side: [], work: [] };
  let facing = 'side', faceSign = 1, walkClock = 0, walkFrame = 0;
  let workTtl = 0, workClock = 0, working = false;
  let playerX = 40, playerY = 90;
  const moving = { left: false, right: false, up: false, down: false };
  let dockedId = null;
  let frameClock = 0;
  let dotTex = null;
  const particles = [], floats = [], flashes = [], sparks = [];
  const petals = [];
  let ambient = [], waterSprites = [], terrain = [];
  let waterTexes = [];
  let grid = null;
  let crossSprites = [], openRects = [], closedRects = [];
  const machineTexCache = {};          // 'look:state' → one texture per frame of that band
  // phase 3: belts on the map, items riding them, the spool, the ghost route
  let simProfile = null;               // the save whose belts/items we draw (set by buildWorld)
  let beltViews = {};                  // belt id → {c, items:[sprite], pipe, b}
  let spoolSp = null, spoolOn = false;
  let ghostG = null;
  let stateDots = {};                  // machine dock id → sprite (automated machines)
  let beltFrame = -1, beltScroll = 0;   // the band's walk, in world pixels
  // in-canvas pixel HUD (the bag) + the hold-to-interact charge bar
  let uiC = null, hudPanel = null;
  let hudRows = {}, hudKeys = [];
  const invValues = {};
  const HUD_W = 46, HUD_ROW = 14;
  let chargeVal = null, chargeG = null;

  // ---------- how a machine looks: the three states (DESIGN.md, 2026-08-20) ----------
  // 'still' — not automated, nobody working it: nothing moves.
  // 'idle'  — automated with nothing to process: the pose holds, the lamp breathes.
  // 'work'  — worked by hand, or automated and processing: everything moves.
  // The state is read off the world each tick, never stored in the save. A
  // band is the texture per frame of one (look, state); the art is in pixels.js.
  const WORK_BEAT = 9, IDLE_BEAT = 12;   // ticks per frame of the beat / the breath
  const STATION_LOOK = { smelter: 'bigrams', foundry: 'foundry', constructor: 'words', molder: 'molder', fastener: 'fastener' };
  // an automated mine is a different machine to look at, not a different state
  const lookOf = (kind, auto) => kind === 'mine' ? (auto ? 3 : 1) : (STATION_LOOK[kind] || 'lines');
  function band(look, mode) {
    const k = look + ':' + mode;
    if (!machineTexCache[k]) {
      const n = mode === 'work' ? PIXELS.WORK_FRAMES : mode === 'idle' ? PIXELS.IDLE_FRAMES : 1;
      const draw = typeof look === 'number'
        ? (f) => PIXELS.machineTex(look, f, mode)
        : (f) => PIXELS.stationTex(look, f, mode);
      machineTexCache[k] = Array.from({ length: n }, (_, f) => draw(f));
    }
    return machineTexCache[k];
  }
  // the state a machine is in right now. Rule 1: a hand-worked machine runs on
  // exactly the condition the operator's own work animation runs on, so the
  // hands and the machine are never in disagreement. Rule 2: an automated
  // machine is never 'still' — it always has something playing.
  function modeOf(s) {
    if (working && s.def.id === dockedId) return 'work';
    if (!s.auto) return 'still';
    return s.simState === 'run' ? 'work' : 'idle';
  }
  const cssColor = (c) => typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c;

  function resize() {
    if (!app || !mountEl) return;
    const dpr = window.devicePixelRatio || 1;
    const availW = Math.max(1, Math.floor((mountEl.clientWidth || 430) * dpr));
    const availH = Math.max(1, Math.floor((mountEl.clientHeight || 230) * dpr));
    const needW = Math.min(MIN_VW, CHAIN.WORLD_W), needH = Math.min(MIN_VH, CHAIN.WORLD_H);
    let k = 1;
    for (let t = 2; t <= 6; t++) {
      if (Math.floor(availW / t) >= needW && Math.floor(availH / t) >= needH) k = t;
    }
    const vw = Math.min(CHAIN.WORLD_W, Math.floor(availW / k));
    const vh = Math.min(CHAIN.WORLD_H, Math.floor(availH / k));
    if (k !== S || vw !== viewW || vh !== viewH) {
      S = k; viewW = vw; viewH = vh;
      app.renderer.resize(viewW * S, viewH * S);
      cameraC.scale.set(S);
      labelsC.scale.set(S);
    }
    app.canvas.style.width = ((viewW * S) / dpr) + 'px';
    app.canvas.style.height = ((viewH * S) / dpr) + 'px';
    layoutHud();
  }

  // ---------- the pixel HUD: the bag in-canvas, icons + numbers only ----------
  function layoutHud() {
    if (!uiC) return;
    uiC.scale.set(S);
    uiC.position.set((viewW - HUD_W - 2) * S, 2 * S);
  }
  function buildHud() {
    uiC = new PIXI.Container();
    app.stage.addChild(uiC);
    setHudKeys(hudKeys);
    layoutHud();
  }
  // the rows the HUD shows: materials the player has held, in tree order
  function setHudKeys(keys) {
    hudKeys = keys.slice();
    if (!uiC) return;
    for (const ch of uiC.children.slice()) { uiC.removeChild(ch); ch.destroy({ children: true }); }
    hudRows = {};
    if (!hudKeys.length) return;
    hudPanel = new PIXI.Graphics()
      .rect(0, 0, HUD_W, hudKeys.length * HUD_ROW + 5)
      .fill({ color: 0x221d29, alpha: 0.74 });
    uiC.addChild(hudPanel);
    hudKeys.forEach((k, i) => {
      const ic = new PIXI.Sprite(PIXELS.matIconTex(k));
      ic.position.set(3, 3 + i * HUD_ROW);
      uiC.addChild(ic);
      const t = new PIXI.Sprite(PIXELS.textTex(String(invValues[k] || 0), PIXELS.P.paper));
      t.position.set(HUD_W - 3 - t.texture.width, 6 + i * HUD_ROW);
      uiC.addChild(t);
      hudRows[k] = t;
    });
  }
  function setInvValue(key, n) {
    invValues[key] = n;
    const t = hudRows[key];
    if (!t) return;
    t.texture = PIXELS.textTex(String(n), PIXELS.P.paper);
    t.position.x = HUD_W - 3 - t.texture.width;
  }
  function invScreenPos(key) {
    const t = hudRows[key];
    if (!t) return null;
    return t.getGlobalPosition();
  }
  // the hold-to-interact bar over the operator; its color says what the hold
  // will do (gold = menu, green = lay the belt here, red = drop the spool)
  let chargeColor = 0xf2c14e;
  function setCharge(p, color) { chargeVal = p; chargeColor = color || 0xf2c14e; }
  // the socket marker: a bouncing green chevron over the machine a carried
  // belt may end at (the place the operator stands)
  let socketTargetId = null, socketG = null;
  function setSocketTarget(dockId) {
    socketTargetId = dockId || null;
    if (!socketTargetId && socketG) socketG.visible = false;
  }
  function drawSocketMarker() {
    const st = socketTargetId ? stations[socketTargetId] : null;
    if (!st) { if (socketG) socketG.visible = false; return; }
    if (!socketG) {
      socketG = new PIXI.Graphics();
      // a chevron pointing down: 3 rows, ink outline then green
      const rows = [[0, 0, 11, 2], [2, 2, 7, 2], [4, 4, 3, 2]];
      for (const [x, y, w, h] of rows) socketG.rect(x - 1, y - 1, w + 2, h + 2).fill(0x17161a);
      for (const [x, y, w, h] of rows) socketG.rect(x, y, w, h).fill(0x6cc46c);
      socketG.zIndex = 6100;
      cameraC.addChild(socketG);
    }
    socketG.visible = true;
    const bounce = Math.round(Math.abs(Math.sin(frameClock * 0.12)) * 3);
    socketG.position.set(st.def.x + 13 - 5, st.def.y - 32 - bounce);
    // the route preview pulses with it
    if (ghostG) ghostG.alpha = 0.7 + 0.3 * Math.abs(Math.sin(frameClock * 0.12));
  }

  function addGlow(wx, wy, base) {
    const g = new PIXI.Sprite(PIXELS.glowHaloTex());
    g.anchor.set(0.5);
    g.position.set(wx, wy);
    g.blendMode = 'add';
    g.zIndex = -860;
    g.alpha = base;
    cameraC.addChild(g);
    terrain.push(g);
    ambient.push({ sp: g, base, phase: Math.random() * 6.28 });
  }

  async function init(mount) {
    if (typeof PIXI === 'undefined') return;
    app = new PIXI.Application();
    await app.init({
      width: viewW * S, height: viewH * S,
      backgroundAlpha: 1, background: 0x17161a,
      resolution: 1, roundPixels: true,
    });
    mount.appendChild(app.canvas);
    mountEl = mount;

    cameraC = new PIXI.Container();
    cameraC.scale.set(S);
    cameraC.sortableChildren = true;
    app.stage.addChild(cameraC);
    labelsC = new PIXI.Container();
    labelsC.scale.set(S);
    app.stage.addChild(labelsC);

    const tx = PIXELS.util.tex;
    waterTexes = [0, 1].map((f) => Array.from({ length: 23 }, (_, s) => tx(TILES.fill('water', s, f))));

    for (let i = 0; i < 14; i++) {
      const m = new PIXI.Sprite(PIXELS.petalTex(0));
      m.zIndex = 4000;
      cameraC.addChild(m);
      petals.push({ sp: m, x: 0, y: 0, vx: 0.05 + Math.random() * 0.08, phase: Math.random() * 6.28 });
    }

    dotTex = PIXELS.matDotTex();
    // Eight walk beats preserve the old cadence while giving the operator
    // distinct contact, passing and stride silhouettes.
    for (let f = 0; f < 8; f++) {
      charTex.down.push(PIXELS.characterTex('down', f));
      charTex.up.push(PIXELS.characterTex('up', f));
      charTex.side.push(PIXELS.characterTex('side', f));
    }
    charTex.work = [0, 1, 2, 3].map((f) => PIXELS.characterWorkTex(f));

    buildHud();
    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(mountEl);

    app.ticker.add(tick);
    setInterval(frameWatchdog, 250);
    ready = true;
    window.FACTORY._app = app;
  }

  // Raise the current map (CHAIN.useMap first): tear down the previous
  // ground, bake and plant this one, put the operator on its spawn.
  function loadMap() {
    if (!ready) return;
    for (const s of terrain) { cameraC.removeChild(s); s.destroy(); }
    terrain = []; ambient = []; waterSprites = [];
    for (const c of crossSprites) { cameraC.removeChild(c); c.destroy(); }
    crossSprites = []; openRects = []; closedRects = [];
    dockedId = null;
    const keep = (sp) => { cameraC.addChild(sp); terrain.push(sp); return sp; };

    const W = CHAIN.WORLD_W, H = CHAIN.WORLD_H, T = PIXELS.TILE;
    const FOREST = CHAIN.MAP.FOREST || { n: 48 };
    LIM.n = FOREST.n || 0; LIM.e = W - (FOREST.e || 0) - 8; LIM.s = H - (FOREST.s || 0) - 6; LIM.w = (FOREST.w || 0) + 8;
    grid = TILES.bake(CHAIN.MAP, W, H);
    const tx = PIXELS.util.tex;
    for (const wt of grid.water) {
      const s = keep(new PIXI.Sprite(waterTexes[0][wt.seed % 23]));
      s.position.set(wt.x, wt.y);
      s.zIndex = -1100;
      waterSprites.push({ sp: s, seed: wt.seed % 23 });
    }
    for (const ch of grid.chunks) {
      const s = keep(new PIXI.Sprite(tx(ch.canvas)));
      s.position.set(ch.x, 0);
      s.zIndex = -1000;
    }
    for (const w of grid.walls) {
      const s = keep(new PIXI.Sprite(tx(w.canvas)));
      s.position.set(w.x, w.y);
      s.zIndex = w.z;
    }
    // ore nodes (the mines stand on them)
    for (const n of CHAIN.MAP.NODES) {
      const sp = keep(new PIXI.Sprite(PIXELS.nodeTex(n.kind)));
      sp.position.set(n.x, n.y);
      sp.zIndex = -960;
    }
    const grassId = TILES.KIND_IDS.indexOf('grass');
    for (let i = 0; i < Math.floor(W / 20); i++) {
      const fx = (i * 97) % W, fy = 42 + (i * 61) % (H - 56);
      const ti = TILES.tileAt(grid, fx, fy);
      if (ti === null || grid.kind[ti] !== grassId || grid.flags[ti]) continue;
      const f = keep(new PIXI.Sprite(PIXELS.flowerTex(i)));
      f.position.set(fx, fy);
      f.zIndex = -970;
    }
    const cols = Math.ceil(W / T), rows = Math.ceil(H / T);
    const plant = (col, row, i, kindsAt, dy) => {
      const rg = kindsAt();
      const kinds = rg.treeline || ['tree', 'tree2'];
      const t = keep(new PIXI.Sprite(PIXELS.sceneryTex(kinds[(i >> 1) % kinds.length])));
      const by = (row + 1) * T - dy;
      t.position.set(Math.round(col * T + (T - t.texture.width) / 2), by - t.texture.height);
      t.zIndex = by;
    };
    if (FOREST.n) for (let col = 0; col < cols; col++) {
      const front = col % 2 === 0, row = front ? Math.floor(FOREST.n / T) - 1 : 1;
      plant(col, row, col, () => CHAIN.regionAt(col * T + 8, 8), front ? 2 : 4 + ((col >> 1) % 2) * 3);
    }
    if (FOREST.s) for (let col = 0; col < cols; col++) {
      const front = col % 2 === 0, row = front ? rows - Math.floor(FOREST.s / T) : rows - 1;
      plant(col, row, col, () => CHAIN.regionAt(col * T + 8, H - 8), front ? 4 : 2);
    }
    if (FOREST.w) for (let row = 1; row < rows; row++) {
      const front = row % 2 === 0, col = front ? Math.floor(FOREST.w / T) - 1 : 0;
      plant(col, row, row, () => CHAIN.regionAt(8, row * T + 8), 3);
    }
    if (FOREST.e) for (let row = 1; row < rows; row++) {
      const front = row % 2 === 0, col = front ? cols - Math.floor(FOREST.e / T) : cols - 1;
      plant(col, row, row, () => CHAIN.regionAt(W - 8, row * T + 8), 3);
    }
    for (const pr of CHAIN.PROPS) {
      const sp = keep(new PIXI.Sprite(PIXELS.propTex(pr.kind)));
      sp.position.set(pr.x, pr.y);
      sp.zIndex = pr.y + sp.texture.height;
      if (pr.glow) addGlow(pr.x + 4, pr.y + 3, 0.9);
    }
    for (const sc of CHAIN.SCENERY) {
      const sp = keep(new PIXI.Sprite(PIXELS.sceneryTex(sc.kind)));
      sp.position.set(Math.round(sc.tx * T + (sc.fw * T - sp.texture.width) / 2), (sc.ty + 1) * T - sp.texture.height);
      const low = /^(rock|boulder|tarpool|scrub|reeds|crystal|spire)/.test(sc.kind);
      sp.zIndex = low ? sc.ty * T : (sc.ty + 1) * T;
    }
    const home = CHAIN.MAP.REGIONS[0];
    for (const m of petals) {
      m.x = home.x + Math.random() * home.w;
      m.y = (home.y || 0) + 36 + Math.random() * ((home.h || H) - 50);
    }
    playerX = CHAIN.SPAWN.x; playerY = CHAIN.SPAWN.y;
    facing = 'side'; faceSign = 1; workTtl = 0; working = false;
    for (const k of Object.keys(moving)) moving[k] = false;
    if (player) player.position.set(Math.round(playerX), Math.round(playerY));
    resize();
  }

  // ---------- icon rows and the place menu (pixel UI in labelsC) ----------
  // A row: {pre?: text, kind?: kind id (12px icon), items?: {mat:n} icons+counts,
  //         out?: mat, gauge?: 0..1, enabled?: bool, ok?: bool}
  function rowContainer(row, dimText) {
    const c = new PIXI.Container();
    let ix = 0;
    const put = (spr, dy) => { spr.position.set(ix, dy); c.addChild(spr); };
    if (row.pre) {
      const t = new PIXI.Sprite(PIXELS.textTex(row.pre, dimText || PIXELS.P.brass3));
      put(t, 3); ix += t.texture.width + 3;
    }
    if (row.kind) {
      const ic = new PIXI.Sprite(PIXELS.kindIconTex(row.kind));
      put(ic, 0); ix += 14;
    }
    if (row.ore) {
      const ic = new PIXI.Sprite(PIXELS.matIconTex(row.ore));
      put(ic, 0); ix += 14;
    }
    for (const [mat, n] of Object.entries(row.items || {})) {
      const ic = new PIXI.Sprite(PIXELS.matIconTex(mat));
      put(ic, 0); ix += 13;
      const cnt = new PIXI.Sprite(PIXELS.textTex(String(n), PIXELS.P.paper));
      put(cnt, 3); ix += cnt.texture.width + 3;
    }
    if (row.out) {
      const arrow = new PIXI.Sprite(PIXELS.textTex('→', PIXELS.P.brass2));
      put(arrow, 3); ix += arrow.texture.width + 3;
      const oc = new PIXI.Sprite(PIXELS.matIconTex(row.out));
      put(oc, 0); ix += 12;
    }
    if (row.ok === true) {
      const t = new PIXI.Sprite(PIXELS.textTex('✓', '#6cc46c'));
      put(t, 3); ix += t.texture.width + 2;
    } else if (row.ok === false) {
      const t = new PIXI.Sprite(PIXELS.textTex('✗', '#d84f4f'));
      put(t, 3); ix += t.texture.width + 2;
    }
    if (typeof row.gauge === 'number') {
      const g = new PIXI.Graphics()
        .rect(0, 4, 14, 4).fill(0x221d29)
        .rect(1, 5, Math.round(12 * Math.max(0, Math.min(1, row.gauge))), 2).fill(row.gauge >= 1 ? 0x6cc46c : 0xf2c14e);
      put(g, 0); ix += 17;
    }
    c._w = Math.max(ix, 8);
    return c;
  }
  // a stack of info rows above a place (dimmed = not affordable/active)
  let infoRows = [];
  let infoBox = null;              // {dockId, top} — where the stack starts, so the menu can sit above it
  function wipeInfo() {
    for (const r of infoRows) { if (r.parent) r.parent.removeChild(r); r.destroy({ children: true }); }
    infoRows = [];
    infoBox = null;
  }
  function clearInfo() { wipeInfo(); drawMenu(); }
  function showInfo(dockId, rows) {
    wipeInfo();
    if (!ready || !dockId || !rows || !rows.length) { drawMenu(); return; }
    const st = stations[dockId];
    if (!st) { drawMenu(); return; }
    const cx = st.def.x + 13;
    let y = st.def.y - 46 - (rows.length - 1) * 16;
    // no room above (a place near the world's top edge): the rows stand
    // beside the place instead, right of it — or left near the east edge —
    // so the ground below (a belt route, say) stays visible
    const side = y < 2;
    if (side) y = Math.max(2, st.def.y - 40);
    if (!side) infoBox = { dockId, top: y };
    const built = rows.map((row) => rowContainer(row));
    const widest = Math.max(...built.map((c) => c._w));
    const rightOK = st.def.x + 40 + widest + 6 <= CHAIN.WORLD_W;
    built.forEach((c, i) => {
      const row = rows[i];
      const back = new PIXI.Graphics().rect(-3, -2, c._w + 6, 16).fill({ color: 0x17161a, alpha: 0.7 });
      c.addChildAt(back, 0);
      if (!side) c.position.set(Math.round(cx - c._w / 2), y);
      else c.position.set(rightOK ? st.def.x + 40 : st.def.x - 12 - c._w, y);
      c.alpha = row.enabled === false ? 0.5 : 1;
      labelsC.addChild(c);
      infoRows.push(c);
      y += 16;
    });
    drawMenu();
  }
  // the place menu: a panel of rows with a highlighted selection, standing
  // above whatever the place already shows about itself. A long list (a
  // Constructor's recipes) scrolls in a window around the selection.
  const MENU_WINDOW = 7;
  let menuC = null, menuState = null;
  function clearMenu() {
    menuState = null;
    wipeMenu();
  }
  function wipeMenu() {
    if (!menuC) return;
    if (menuC.parent) menuC.parent.removeChild(menuC);
    menuC.destroy({ children: true });
    menuC = null;
  }
  function showMenu(dockId, rows, sel) {
    menuState = (dockId && rows && rows.length) ? { dockId, rows, sel } : null;
    drawMenu();
  }
  function drawMenu() {
    wipeMenu();
    if (!ready || !menuState) return;
    const { dockId, rows, sel } = menuState;
    const st = stations[dockId];
    if (!st) return;
    // the window of rows on show: the whole list when it fits, else a slice
    // that keeps the selection in the middle
    const n = rows.length;
    const win = Math.min(MENU_WINDOW, n);
    const top = n > win ? Math.max(0, Math.min(n - win, sel - Math.floor(win / 2))) : 0;
    const shown = rows.slice(top, top + win);
    menuC = new PIXI.Container();
    const built = shown.map((r) => rowContainer(r));
    const w = Math.max(...built.map((c) => c._w)) + (n > win ? 16 : 10);
    const h = win * 16 + 6;
    const cx = st.def.x + 13;
    let px = Math.round(cx - w / 2);
    // above the machine's own rows when it has any, else above the machine —
    // and always inside the window the player is looking at: a tall panel
    // near the world's top edge drops below the place rather than off-screen
    let base = st.def.y - 50;
    if (infoBox && infoBox.dockId === dockId) base = Math.min(base, infoBox.top - 6);
    const vx = Math.round(camX), vy = Math.round(camY);
    px = Math.max(vx + 2, Math.min(vx + viewW - w - 2, px));
    let py = base - h;
    if (py < vy + 2) py = st.def.y + 8;
    py = Math.max(vy + 2, Math.min(vy + viewH - h - 2, py));
    const panel = new PIXI.Graphics()
      .rect(0, 0, w, h).fill({ color: 0x17161a, alpha: 0.9 })
      .rect(0, 0, w, 1).fill(0xc9a24a).rect(0, h - 1, w, 1).fill(0xc9a24a);
    menuC.addChild(panel);
    built.forEach((c, i) => {
      const row = shown[i];
      if (i + top === sel) {
        const hl = new PIXI.Graphics().rect(2, 3 + i * 16, w - 4, 14).fill({ color: 0xf2c14e, alpha: row.enabled === false ? 0.18 : 0.35 });
        menuC.addChild(hl);
      }
      c.position.set(5, 4 + i * 16);
      c.alpha = row.enabled === false ? 0.5 : 1;
      menuC.addChild(c);
    });
    // more rows above / below the window: a small brass arrow says so
    if (top > 0) menuC.addChild(new PIXI.Graphics().poly([w - 9, 8, w - 3, 8, w - 6, 4]).fill(0xc9a24a));
    if (top + win < n) menuC.addChild(new PIXI.Graphics().poly([w - 9, h - 8, w - 3, h - 8, w - 6, h - 4]).fill(0xc9a24a));
    menuC.position.set(px, py);
    labelsC.addChild(menuC);
  }

  // the pose a machine is built in: automated ones start on the idle breath,
  // the rest stand still. The ticker takes over from the next frame.
  function stationSpriteTex(m) {
    return band(lookOf(m.kind, m.autoLive), m.autoLive ? 'idle' : 'still')[0];
  }

  // Build the world from the save: machines on plots and nodes, free plots,
  // unbuilt nodes, crossings. `autoLive(m)` says whether a machine is running
  // by itself right now (⚙ bought and its letters sticky).
  function buildWorld(profile, autoLive) {
    if (!ready) return;
    simProfile = profile;
    clearInfo(); clearMenu(); clearGhost();
    for (const v of Object.values(beltViews)) { cameraC.removeChild(v.c); v.c.destroy({ children: true }); }
    beltViews = {};
    for (const s of Object.values(stateDots)) { cameraC.removeChild(s); s.destroy(); }
    stateDots = {};
    for (const s of Object.values(stations)) { cameraC.removeChild(s.root); s.root.destroy({ children: true }); }
    for (const l of labelsC.children.slice()) { labelsC.removeChild(l); l.destroy(); }
    floats.length = 0;
    flashes.length = 0;
    stations = {};
    if (player) { cameraC.removeChild(player); player.destroy(); player = null; }

    for (const c of crossSprites) { cameraC.removeChild(c); c.destroy(); }
    crossSprites = []; openRects = []; closedRects = [];
    for (const cr of CHAIN.MAP.CROSSINGS) {
      const open = CHAIN.crossingOpen(profile, cr);
      (open ? openRects : closedRects).push({ x: cr.x, y: cr.y, w: cr.w, h: cr.h });
      const art = TILES.crossing(cr.kind, cr.w / PIXELS.TILE, cr.h / PIXELS.TILE, open, cr.style, cr.x, cr.dir);
      if (art) {
        const sp = new PIXI.Sprite(PIXELS.util.tex(art.c));
        sp.position.set(cr.x - (art.dx || 0), cr.y - (art.dy || 0));
        sp.zIndex = open ? -900 : cr.y;
        cameraC.addChild(sp);
        crossSprites.push(sp);
      }
      // a closed crossing is a place: dock beside it, hold Space to repair
      if (!open) {
        const root = new PIXI.Container();
        const glow = new PIXI.Graphics().rect(0, 0, cr.w, 2).fill(0xc9a24a);
        glow.visible = false;
        root.addChild(glow);
        root.position.set(cr.x, cr.y + cr.h + 1);
        root.zIndex = -650;
        cameraC.addChild(root);
        // the work spot: centred on the crossing, a step out on the near side
        const horizontal = cr.kind === 'stairs' || cr.dir === 'v';
        const wx = horizontal ? cr.x + cr.w / 2 - 13 : cr.x - 24;
        const wy = horizontal ? cr.y - 14 : cr.y + cr.h / 2 - 6;
        stations['cross:' + cr.id] = {
          def: { id: 'cross:' + cr.id, x: wx, y: wy, kind: 'crossing', crossing: cr },
          root, sp: glow, glow, built: false, auto: false, sqTtl: 0,
          glowRect: { x: 0, y: 0, w: cr.w, h: 2 },
        };
      }
    }

    // machines
    for (const m of profile.machines) {
      const pos = CHAIN.machinePos(m);
      const live = !!(autoLive && autoLive(m));
      const root = new PIXI.Container();
      const sp = new PIXI.Sprite(stationSpriteTex({ ...m, autoLive: live }));
      root.addChild(sp);
      const glow = new PIXI.Graphics().rect(0, 36, 26, 2).fill(0xc9a24a);
      glow.visible = false;
      root.addChild(glow);
      // the belt mark: green = a belt from the carried spool can end here,
      // red = it cannot (shown only while carrying)
      const mark = new PIXI.Graphics().rect(-2, 39, 30, 2).fill(0x6cc46c);
      mark.visible = false;
      root.addChild(mark);
      root.position.set(pos.x, pos.y - 36);
      root.zIndex = pos.y;
      cameraC.addChild(root);
      const id = 'm:' + m.id;
      stations[id] = {
        def: { id, x: pos.x, y: pos.y, kind: m.kind, m }, root, sp, glow, mark, built: true, auto: live, sqTtl: 0,
        simState: live && window.SIM ? SIM.state(profile, m) : 'off',
      };
      if (live) {
        const d = new PIXI.Sprite(PIXELS.stateDotTex('run'));
        d.position.set(pos.x + 24, pos.y - 40);
        d.zIndex = pos.y + 1;
        cameraC.addChild(d);
        stateDots[id] = d;
      }
    }
    drawBelts(profile);
    // free plots: surveyed markers, dockable, walk-through
    for (const p of CHAIN.freePlots(profile)) {
      const root = new PIXI.Container();
      const sp = new PIXI.Sprite(PIXELS.plotTex());
      root.addChild(sp);
      const glow = new PIXI.Graphics().rect(0, 15, 30, 2).fill(0xc9a24a);
      glow.visible = false;
      root.addChild(glow);
      root.position.set(p.x - 2, p.y - 13);
      root.zIndex = -700;
      cameraC.addChild(root);
      sp.alpha = 0.75;
      stations['plot:' + p.id] = {
        def: { id: 'plot:' + p.id, x: p.x, y: p.y, kind: 'plot', plot: p },
        root, sp, glow, built: false, auto: false, sqTtl: 0,
        glowRect: { x: 0, y: 15, w: 30, h: 2 },
      };
    }
    // unbuilt ore nodes: the vein, surveyed
    for (const n of CHAIN.unbuiltNodes(profile)) {
      const root = new PIXI.Container();
      const sp = new PIXI.Sprite(PIXELS.plotTex());
      root.addChild(sp);
      const glow = new PIXI.Graphics().rect(0, 15, 30, 2).fill(0xc9a24a);
      glow.visible = false;
      root.addChild(glow);
      root.position.set(n.x + 2, n.y - 1);
      root.zIndex = -700;
      cameraC.addChild(root);
      sp.alpha = 0.6;
      stations['node:' + n.index] = {
        def: { id: 'node:' + n.index, x: n.x + 4, y: n.y + 12, kind: 'node', node: n },
        root, sp, glow, built: false, auto: false, sqTtl: 0,
        glowRect: { x: 0, y: 15, w: 30, h: 2 },
      };
    }

    player = new PIXI.Sprite(charTex.side[0]);
    player.anchor.set(0.5, 1);
    player.position.set(Math.round(playerX), Math.round(playerY));
    cameraC.addChild(player);
    if (dockedId && stations[dockedId]) stations[dockedId].glow.visible = true;
  }
  // an automated mine changes look without a full rebuild
  function setAutoLook(dockId, live) {
    const st = stations[dockId];
    if (!st || st.def.kind !== 'mine') return;
    st.auto = live;
    st.simState = live ? 'run' : 'off';
    st.sp.texture = band(lookOf(st.def.kind, live), live ? 'idle' : 'still')[0];
  }

  // ---------- belts on the map (phase 3) ----------
  const T16 = 16;
  const tileOf = (px, py) => [Math.floor(px / T16), Math.floor(py / T16)];
  // the tiles a machine's body covers (its collision box)
  // The tiles a machine's body covers, and so the tiles no run may lie on.
  //
  // A machine claims a tile when its body covers at least six of that tile's
  // sixteen pixels. The walking box is three pixels wider than the machine
  // on each side so the operator never clips it, and snapping that box out
  // to whole tiles used to hand a machine a tile its sprite never touches:
  // the run stopped on the far side of it and left a gap it had no way to
  // close. Six is well under the twelve a belt's band is wide, so whatever
  // sliver of machine hangs over a run's last tile is covered by the machine
  // itself — it draws above the belt — and the run meets it flush.
  const CLAIM = 6;
  function footprintTiles(m) {
    const pos = CHAIN.machinePos(m);
    const x0 = pos.x, x1 = pos.x + 25;            // the body as drawn, 26 wide
    const y0 = pos.y - 14, y1 = pos.y + 1;        // it stands on its base; runs pass behind the rest
    const covers = (lo, hi, t) => Math.min(hi, t * T16 + T16 - 1) - Math.max(lo, t * T16) + 1 >= CLAIM;
    const out = [];
    for (let ty = Math.floor(y0 / T16); ty <= Math.floor(y1 / T16); ty++)
      for (let tx = Math.floor(x0 / T16); tx <= Math.floor(x1 / T16); tx++)
        if (covers(x0, x1, tx) && covers(y0, y1, ty)) out.push([tx, ty]);
    return out;
  }
  const key = (tx, ty) => tx + ',' + ty;

  // ---------- the shape of a belt tile ----------
  // Which sides of a tile the run joins tells the art what to draw, the goods
  // where to turn, and another run whether it may cross here. A tile at
  // either end of the run joins its one neighbour and carries straight on
  // through the other side.
  const SIDE = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
  const SHAPE_OF = {
    we: 'h', ew: 'h', ns: 'v', sn: 'v',
    ne: 'ne', en: 'ne', nw: 'nw', wn: 'nw', se: 'se', es: 'se', sw: 'sw', ws: 'sw',
  };
  const SHAPE_HEAD = { h: 'w', v: 'n', ne: 'n', nw: 'n', se: 's', sw: 's' };  // the side the art runs from
  const sideTo = (a, b) => (b[0] > a[0] ? 'e' : b[0] < a[0] ? 'w' : b[1] > a[1] ? 's' : 'n');
  // one entry per run over a tile: the axis it crosses on ('h' or 'v'), or
  // null where that run turns, starts or ends there and so owns the tile
  // outright. Two runs may share a tile only by crossing — one on each axis,
  // both going straight through — which makes a crossing a single tile and
  // never a shared length.
  function beltAxes(profile, exceptId) {
    const at = new Map();
    for (const b of profile.belts || []) {
      if (b.id === exceptId) continue;
      const n = b.path.length;
      for (let i = 0; i < n; i++) {
        const inS = i > 0 ? sideTo(b.path[i], b.path[i - 1]) : null;
        const outS = i < n - 1 ? sideTo(b.path[i], b.path[i + 1]) : null;
        const shape = SHAPE_OF[(inS || OPP[outS]) + (outS || OPP[inS])];
        const through = i > 0 && i < n - 1 && (shape === 'h' || shape === 'v') ? shape : null;
        const k = key(b.path[i][0], b.path[i][1]);
        const list = at.get(k);
        if (list) list.push(through); else at.set(k, [through]);
      }
    }
    return at;
  }
  // may a run on `axis` ('h'/'v', or null when the heading is not settled)
  // lie on a tile another run already uses
  function crossable(here, axis) {
    if (!here) return true;
    if (!axis || here.length > 1) return false;   // no heading yet, or already a crossing
    return here[0] !== null && here[0] !== axis;  // it must go straight, and the other way
  }
  // can a belt lie on this tile: in bounds, not solid (an open crossing
  // overrides), not under a machine, not in scenery, and either clear of
  // other runs or square across a single one
  function beltFree(profile, tx, ty, blocked, beltAt, axis) {
    if (!grid || tx < 0 || ty < 0 || tx >= grid.cols || ty >= grid.rows) return false;
    if (blocked.has(key(tx, ty))) return false;
    if (!crossable(beltAt.get(key(tx, ty)), axis)) return false;
    const cx = tx * T16 + 8, cy = ty * T16 + 8;
    const inRect = (r) => cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h;
    if (closedRects.some(inRect)) return false;
    if (openRects.some(inRect)) return true;
    const i = ty * grid.cols + tx;
    if (grid.flags[i] & TILES.FL.SOLID) return false;
    for (const sc of CHAIN.SCENERY) {
      const b = sc.box;
      if (cx >= b.x - 2 && cx < b.x + b.w + 2 && cy >= b.y - 2 && cy < b.y + b.h + 2) return false;
    }
    return true;
  }
  // may a belt step between two adjacent tiles (elevation: ramps only)
  function beltStep(ax, ay, bx, by) {
    const inRect = (r, px, py) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
    const a = [ax * T16 + 8, ay * T16 + 8], b = [bx * T16 + 8, by * T16 + 8];
    if (openRects.some((r) => inRect(r, a[0], a[1])) && openRects.some((r) => inRect(r, b[0], b[1]))) return true;
    if (openRects.some((r) => inRect(r, a[0], a[1])) || openRects.some((r) => inRect(r, b[0], b[1]))) return true;
    return TILES.passable(grid, a[0], a[1], b[0], b[1]);
  }
  // the free tiles around a machine's footprint (where a belt may start/end).
  // No axis is passed: a run's own two ends carry its drums, so they want a
  // tile to themselves and never sit on another run's crossing.
  function ringTiles(m, profile, blocked, beltAt) {
    const fp = footprintTiles(m);
    const inFp = new Set(fp.map(([x, y]) => key(x, y)));
    const out = [];
    for (const [x, y] of fp) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = x + dx, ty = y + dy;
      if (inFp.has(key(tx, ty))) continue;
      if (beltFree(profile, tx, ty, blocked, beltAt, null)) { out.push([tx, ty]); inFp.add(key(tx, ty)); }
    }
    return out;
  }
  // shortest belt path from one machine to another over free tiles, or null
  // when there is none — the caller says so rather than laying anything.
  // Breadth-first from every free tile around the source to the first free
  // tile around the target; machines, scenery and solids block, and another
  // run blocks unless this one can cross it square.
  //
  // The search walks states of (tile, the way we came in), not bare tiles.
  // A tile another run already crosses may only be entered at right angles
  // and left the same way it was entered, which needs the heading in hand;
  // it also means a crossing is always one tile, never a shared length.
  // Of the shortest routes it takes one with the fewest corners: the walk
  // back over the distance field holds its heading for as long as the field
  // allows, so an open field gives a long straight and one turn, not stairs.
  const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const STEP_AXIS = ['h', 'h', 'v', 'v'];
  const FROM_MACHINE = 4;            // the heading a run leaves its source with: none yet
  const sk = (x, y, d) => x + ',' + y + ',' + d;
  // the ground a run may cover, laid out from the source's ring. Stops at the
  // first goal when given one, floods everything when not, so the bars under
  // the machines and the route the hold lays come out of the same walk.
  function beltFlood(profile, starts, blocked, beltAt, goals) {
    const dist = new Map(), q = [];
    const startSet = new Set(starts.map(([x, y]) => key(x, y)));
    for (const [x, y] of starts) {
      const k = sk(x, y, FROM_MACHINE);
      if (dist.has(k)) continue;
      dist.set(k, 0); q.push([x, y, FROM_MACHINE]);
    }
    let found = null, guard = 0, head = 0;
    while (head < q.length && guard++ < 40000) {
      const [x, y, d] = q[head++];
      // A run ends somewhere other than where it started. Where two machines
      // stand close enough to share a tile around them, that tile is both a
      // place to start and a place to finish, and without this the walk
      // stepped off it and straight back onto it — a run of three tiles that
      // doubled back on itself and stood on its own end.
      if (d !== FROM_MACHINE && goals && goals.has(key(x, y)) && !startSet.has(key(x, y))) { found = [x, y, d]; break; }
      const straightOnly = beltAt.has(key(x, y));
      const here = dist.get(sk(x, y, d));
      for (let s = 0; s < 4; s++) {
        if (straightOnly && d !== FROM_MACHINE && s !== d) continue;   // cross it, don't turn on it
        const nx = x + STEPS[s][0], ny = y + STEPS[s][1], nk = sk(nx, ny, s);
        if (dist.has(nk)) continue;
        if (!beltFree(profile, nx, ny, blocked, beltAt, STEP_AXIS[s])) continue;
        if (!beltStep(x, y, nx, ny)) continue;
        dist.set(nk, here + 1);
        q.push([nx, ny, s]);
      }
    }
    return { dist, found, guard };
  }
  // the map a run reads before it is laid: machines block, scenery and solids
  // block, another run blocks unless this one can cross it square
  function beltGround(profile) {
    const blocked = new Set();
    for (const m of profile.machines) for (const [x, y] of footprintTiles(m)) blocked.add(key(x, y));
    return { blocked, beltAt: beltAxes(profile, null) };
  }
  function routeBelt(from, to, profile) {
    if (!grid) return null;
    const { blocked, beltAt } = beltGround(profile);
    const starts = ringTiles(from, profile, blocked, beltAt);
    const goals = new Set(ringTiles(to, profile, blocked, beltAt).map(([x, y]) => key(x, y)));
    if (!starts.length || !goals.size) return null;
    const { dist, found, guard } = beltFlood(profile, starts, blocked, beltAt, goals);
    if (!found) return null;
    const path = [];
    let cur = found;
    for (let n = 0; n <= guard; n++) {
      path.push([cur[0], cur[1]]);
      const d = dist.get(sk(cur[0], cur[1], cur[2]));
      if (!d) break;
      const px = cur[0] - STEPS[cur[2]][0], py = cur[1] - STEPS[cur[2]][1];
      let back = null;
      for (const pd of [cur[2], 0, 1, 2, 3, FROM_MACHINE]) {
        if (dist.get(sk(px, py, pd)) === d - 1) { back = pd; break; }
      }
      if (back === null) break;
      cur = [px, py, back];
    }
    path.reverse();
    return path;
  }
  // which machines a run from this one could actually reach, by geometry
  // alone — one flood rather than a search per machine, so the green bars
  // never promise a belt the ground has no room for
  function beltReaches(from, profile) {
    const out = new Set();
    if (!grid) return out;
    const { blocked, beltAt } = beltGround(profile);
    const starts = ringTiles(from, profile, blocked, beltAt);
    if (!starts.length) return out;
    const { dist } = beltFlood(profile, starts, blocked, beltAt, null);
    const startSet = new Set(starts.map(([x, y]) => key(x, y)));
    const reached = new Set();
    for (const k of dist.keys()) {
      const i = k.lastIndexOf(',');
      const tile = k.slice(0, i);
      if (k.slice(i + 1) !== String(FROM_MACHINE) && !startSet.has(tile)) reached.add(tile);
    }
    for (const m of profile.machines) {
      if (m.id === from.id) continue;
      if (ringTiles(m, profile, blocked, beltAt).some(([x, y]) => reached.has(key(x, y)))) out.add(m.id);
    }
    return out;
  }
  function drawBelts(profile) {
    const belts = profile.belts || [];
    // where two runs cross, the later one bridges the earlier: laying order
    // decides, so a crossing looks the same every time the world is drawn
    const crossings = new Set();
    for (let bi = 1; bi < belts.length; bi++) {
      const under = beltAxes({ belts: belts.slice(0, bi) }, null);
      for (const [tx, ty] of belts[bi].path) if (under.has(key(tx, ty))) crossings.add(belts[bi].id + '@' + key(tx, ty));
    }
    belts.forEach((b, bi) => {
      const from = profile.machines.find((m) => m.id === b.from);
      const pipe = !!(from && from.kind === 'mine' && from.ore === 'oil');
      const n = b.path.length;
      if (n < 2) return;
      const c = new PIXI.Container();
      c.zIndex = -500 + bi * 0.01;      // the later run draws over the earlier
      const geo = [];
      for (let i = 0; i < n; i++) {
        const [tx, ty] = b.path[i];
        const inS = i > 0 ? sideTo(b.path[i], b.path[i - 1]) : null;
        const outS = i < n - 1 ? sideTo(b.path[i], b.path[i + 1]) : null;
        const a = inS || OPP[outS], z = outS || OPP[inS];
        const shape = SHAPE_OF[a + z];
        // the shadow the bridging run throws on the one beneath it
        if (crossings.has(b.id + '@' + key(tx, ty))) {
          const sh = new PIXI.Graphics();
          if (shape === 'h') sh.rect(tx * T16, ty * T16 + 4, T16, 12);
          else sh.rect(tx * T16 + 4, ty * T16, 12, T16);
          sh.fill({ color: 0x0b0a12, alpha: 0.45 });
          c.addChild(sh);
        }
        const sp = new PIXI.Sprite(PIXELS.beltTileTex(Math.max(0, beltFrame), shape, SHAPE_HEAD[shape] !== a, pipe));
        sp.position.set(tx * T16, ty * T16);
        sp._shape = shape; sp._rev = SHAPE_HEAD[shape] !== a;
        c.addChild(sp);
        // a drum where the run meets the machine at either end
        if (i === 0 || i === n - 1) {
          const cap = new PIXI.Sprite(PIXELS.beltEndTex(Math.max(0, beltFrame), i === 0 ? a : z, pipe));
          cap.position.set(tx * T16, ty * T16);
          cap._end = i === 0 ? a : z;
          c.addChild(cap);
        }
        geo.push(tileGeo(tx, ty, SIDE[a], SIDE[z]));
      }
      // the goods ride inside the run's own container, so clearing the world
      // takes them with it
      const itemsC = new PIXI.Container();
      c.addChild(itemsC);
      cameraC.addChild(c);
      beltViews[b.id] = { c, itemsC, items: [], pipe, b, geo };
    });
  }
  // how the band crosses one tile: straight through its centre, or a quarter
  // turn of radius 8 about the corner the two sides share
  function tileGeo(tx, ty, av, zv) {
    const cx = tx * T16 + 8, cy = ty * T16 + 8;
    if (av[0] + zv[0] === 0 && av[1] + zv[1] === 0) return { cx, cy, ax: zv[0], ay: zv[1] };
    const px = tx * T16 + (av[0] + zv[0] > 0 ? T16 : 0);
    const py = ty * T16 + (av[1] + zv[1] > 0 ? T16 : 0);
    const a0 = Math.atan2(cy + av[1] * 8 - py, cx + av[0] * 8 - px);
    let sweep = Math.atan2(cy + zv[1] * 8 - py, cx + zv[0] * 8 - px) - a0;
    if (sweep > Math.PI) sweep -= 2 * Math.PI; else if (sweep < -Math.PI) sweep += 2 * Math.PI;
    return { cx, cy, turn: true, px, py, a0, sweep };
  }
  // world position of a fractional path index: a tile is crossed from the
  // middle of one edge to the middle of the next, so the goods stay on the
  // band round a corner instead of cutting it
  function pathPos(geo, pos) {
    const i = Math.max(0, Math.min(geo.length - 1, Math.round(pos)));
    const g = geo[i];
    const t = Math.max(-0.5, Math.min(0.5, pos - i));
    if (!g.turn) return [g.cx + g.ax * t * T16, g.cy + g.ay * t * T16];
    const a = g.a0 + (t + 0.5) * g.sweep;
    return [g.px + Math.cos(a) * 8, g.py + Math.sin(a) * 8];
  }
  function clearGhost() {
    if (!ghostG) return;
    cameraC.removeChild(ghostG); ghostG.destroy(); ghostG = null;
  }
  // a translucent route preview while carrying the spool (green = will lay,
  // red = no free path)
  function showGhost(path, ok) {
    clearGhost();
    ghostG = new PIXI.Graphics();
    ghostG.zIndex = -499;
    // gold reads on grass and dirt alike; red for no route
    const col = ok ? 0xf2c14e : 0xd84f4f;
    for (const [tx, ty] of path || []) {
      ghostG.rect(tx * T16 + 1, ty * T16 + 1, 14, 14).fill({ color: 0x17161a, alpha: 0.55 });
      ghostG.rect(tx * T16 + 3, ty * T16 + 3, 10, 10).fill({ color: col, alpha: 0.75 });
    }
    cameraC.addChild(ghostG);
  }
  // carrying: `from` is the source machine's world position (the tether
  // line runs from there to the operator)
  function setSpool(on, from) {
    spoolOn = !!on; spoolFrom = on && from ? { x: from.x + 13, y: from.y + 2 } : null;
    if (!on) { clearGhost(); markStations(null); if (tetherG) tetherG.clear(); }
  }
  // belt marks under machines: {dockId: 'ok'|'no'} or null to clear
  function markStations(marks) {
    for (const st of Object.values(stations)) {
      if (!st.mark) continue;
      const v = marks ? marks[st.def.id] : null;
      st.mark.visible = !!v;
      if (v) st.mark.clear().rect(-2, 39, 30, 2).fill(v === 'ok' ? 0x6cc46c : 0xd84f4f);
    }
  }
  let spoolFrom = null, tetherG = null, tetherPhase = 0;
  function drawTether(dt) {
    if (!spoolOn || !spoolFrom) { if (tetherG) tetherG.clear(); return; }
    if (!tetherG) { tetherG = new PIXI.Graphics(); tetherG.zIndex = 5400; cameraC.addChild(tetherG); }
    tetherPhase = (tetherPhase + dt * 0.25) % 6;
    tetherG.clear();
    const x0 = spoolFrom.x, y0 = spoolFrom.y, x1 = Math.round(playerX), y1 = Math.round(playerY) - 10;
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 2) return;
    // a dotted cord: one dot every 6 px, crawling toward the operator
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    for (let d = tetherPhase; d < len; d += 6) {
      const bx = Math.round(x0 + ux * d), by = Math.round(y0 + uy * d);
      tetherG.rect(bx - 1, by - 1, 4, 4).fill({ color: 0x17161a, alpha: 0.8 });
      tetherG.rect(bx, by, 2, 2).fill({ color: 0xfff4dc, alpha: 0.95 });
    }
    tetherG.zIndex = Math.max(y0, y1) + 0.25;
  }

  function setMove(which, down) { moving[which] = down; }

  function spawnSparks(wx, wy, n, tint) {
    for (let i = 0; i < n; i++) {
      const sp = new PIXI.Sprite(PIXELS.sparkTex());
      sp.tint = tint;
      sp.zIndex = 5000;
      cameraC.addChild(sp);
      sparks.push({
        sp, x: wx + Math.random() * 10 - 5, y: wy,
        vx: Math.random() * 1.6 - 0.8, vy: -(0.15 + Math.random() * 0.5),
        ttl: 18 + Math.random() * 10,
      });
    }
  }

  function castLetter(ok) {
    if (!ready || !dockedId) return;
    const st = stations[dockedId];
    if (!st || !st.built) return;
    st.sp.tint = ok ? 0xffe9a0 : 0xff8a70;
    flashes.push({ sp: st.sp, ttl: 6 });
    workTtl = 50;
    working = true;
    if (ok) {
      st.sp.y = 1; st.sqTtl = 4;
      const p = new PIXI.Sprite(dotTex);
      p.zIndex = st.def.y + 1;
      cameraC.addChild(p);
      particles.push({
        sp: p, x: st.def.x + 10 + Math.random() * 8, y: st.def.y - 32,
        vy: -0.8, ttl: 18,
      });
    }
  }

  function posOf(dockId) {
    const st = stations[dockId || dockedId];
    return st ? st.def : null;
  }
  function floatText(text, dockId, color) {
    if (!ready) return;
    const def = posOf(dockId);
    if (!def) return;
    const css = cssColor(color || 0xeacc78);
    const t = new PIXI.Sprite(PIXELS.textTex(text, css));
    floats.push({ t, ttl: 60, wx: def.x + 13, wy: def.y - 44 });
    labelsC.addChild(t);
    spawnSparks(def.x + 13, def.y - 22, 5, parseInt(css.slice(1), 16));
  }
  function stamp() {
    const def = posOf(dockedId);
    if (def) spawnSparks(def.x + 13, def.y - 26, 6, 0xffe08a);
  }
  function getDocked() { return dockedId; }

  let camX = 0, camY = 0;

  // A watchdog on the animation frame. Some hosts — the in-app browser pane
  // among them — stop delivering frames to a tab that is not on top without
  // ever marking the page hidden: no visibilitychange fires and
  // visibilityState still reads 'visible', so the page has no way to know
  // and everything driven by the frame simply stops. When the page believes
  // it is visible and no frame has arrived for a while, wind the ticker by
  // hand instead. A tab that is genuinely hidden says so, and that one we
  // let sleep — nobody is looking at it, and the clock in app.js carries
  // the factory on its own timer either way.
  let lastFrame = 0, windingByHand = false;
  function frameWatchdog() {
    if (!app || !ready || document.visibilityState !== 'visible') return;
    if (performance.now() - lastFrame < 400) return;
    windingByHand = true;
    try { app.ticker.update(performance.now()); } finally { windingByHand = false; }
  }

  function tick(ticker) {
    if (!windingByHand) lastFrame = performance.now();
    if (!ready || !player) return;
    const dt = ticker.deltaTime;

    let vx = 0, vy = 0;
    if (moving.left) vx -= SPEED;
    if (moving.right) vx += SPEED;
    if (moving.up) vy -= SPEED;
    if (moving.down) vy += SPEED;
    const collides = (px, py) => {
      for (const s of Object.values(stations)) {
        if (!s.built) continue;
        const d = s.def;
        if (px > d.x - 3 && px < d.x + 29 && py > d.y - 14 && py < d.y + 2) return true;
      }
      for (const sc of CHAIN.SCENERY) {
        const b = sc.box;
        if (px > b.x - 3 && px < b.x + b.w + 3 && py > b.y - 3 && py < b.y + b.h + 3) return true;
      }
      return false;
    };
    const inRect = (r, px, py) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
    const terrainOK = (fx, fy, tx2, ty2) => {
      if (closedRects.some((r) => inRect(r, tx2, ty2))) return false;
      if (openRects.some((r) => inRect(r, tx2, ty2))) return true;
      return TILES.passable(grid, fx, fy, tx2, ty2);
    };
    if (vx !== 0 || vy !== 0) {
      workTtl = 0; working = false;
      facing = Math.abs(vy) > Math.abs(vx) ? (vy < 0 ? 'up' : 'down') : 'side';
      if (vx !== 0) faceSign = vx > 0 ? 1 : -1;
      // a machine built where you stand must not trap you: a move is blocked
      // only when it enters a solid the operator isn't already inside
      const stuck = collides(playerX, playerY);
      const nx = Math.max(LIM.w, Math.min(LIM.e, playerX + vx * dt));
      if ((stuck || !collides(nx, playerY)) && terrainOK(playerX, playerY, nx, playerY)) playerX = nx;
      const ny = Math.max(LIM.n, Math.min(LIM.s, playerY + vy * dt));
      if ((stuck || !collides(playerX, ny)) && terrainOK(playerX, playerY, playerX, ny)) playerY = ny;
      walkClock += dt;
      if (walkClock > 4) { walkClock = 0; walkFrame = (walkFrame + 1) % 8; }
    } else {
      walkFrame = 0;
    }
    if (workTtl > 0) workTtl -= dt;
    if (working && dockedId) {
      workClock += dt;
      player.texture = charTex.work[Math.floor(workClock / 8) % charTex.work.length];
      player.scale.x = 1;
    } else {
      player.texture = charTex[facing][walkFrame];
      player.scale.x = facing === 'side' ? faceSign : 1;
    }
    player.position.set(Math.round(playerX), Math.round(playerY));
    player.zIndex = playerY;

    camX = CHAIN.WORLD_W <= viewW ? (CHAIN.WORLD_W - viewW) / 2
      : Math.max(0, Math.min(CHAIN.WORLD_W - viewW, playerX - viewW / 2));
    camY = CHAIN.WORLD_H <= viewH ? (CHAIN.WORLD_H - viewH) / 2
      : Math.max(0, Math.min(CHAIN.WORLD_H - viewH, playerY - viewH / 2 - 8));
    cameraC.position.set(-Math.round(camX) * S, -Math.round(camY) * S);
    labelsC.position.set(-Math.round(camX) * S, -Math.round(camY) * S);

    // docking: 2D proximity to the place's work spot (front-center)
    let best = null, bestD = 1e9;
    for (const s of Object.values(stations)) {
      const dx = playerX - (s.def.x + 13);
      const dy = playerY - (s.def.y + 6);
      const d = Math.hypot(dx, dy);
      if (d < DOCK_RANGE && d < bestD) { best = s.def.id; bestD = d; }
    }
    if (best !== dockedId) {
      dockedId = best;
      workTtl = 0; working = false;
      for (const s of Object.values(stations)) s.glow.visible = s.def.id === dockedId;
      if (window.FACTORY.onDock) window.FACTORY.onDock(dockedId);
    }

    // the spool on the operator's back while carrying a belt
    if (spoolOn) {
      if (!spoolSp) { spoolSp = new PIXI.Sprite(PIXELS.spoolTex()); spoolSp.zIndex = 5500; cameraC.addChild(spoolSp); }
      spoolSp.visible = true;
      spoolSp.position.set(Math.round(playerX) - 9, Math.round(playerY) - 18);
      spoolSp.zIndex = playerY + 0.5;
    } else if (spoolSp) spoolSp.visible = false;
    drawTether(dt);
    // belts roll; items ride. The band walks at exactly the speed the goods
    // do, so the two never disagree, and a slat crosses one world pixel per
    // frame of the tile art rather than jumping a whole slat at a time.
    if (simProfile) {
      beltScroll = (beltScroll + CHAIN.TUNING.BELT_SPEED * T16 * (dt / 60)) % PIXELS.BELT_PITCH;
      const bf = Math.floor(beltScroll);
      if (bf !== beltFrame) {
        beltFrame = bf;
        for (const v of Object.values(beltViews)) {
          for (const sp of v.c.children) {
            if (sp._end) sp.texture = PIXELS.beltEndTex(bf, sp._end, v.pipe);
            else if (sp._shape) sp.texture = PIXELS.beltTileTex(bf, sp._shape, sp._rev, v.pipe);
          }
        }
      }
      for (const b of simProfile.belts || []) {
        const v = beltViews[b.id];
        if (!v) continue;
        while (v.items.length < b.items.length) {
          // a tinted core under an ink ring: the ring keeps its own colour,
          // so a dark material still reads against the dark band
          const g = new PIXI.Container();
          const core = new PIXI.Sprite(PIXELS.itemDotTex());
          g.addChild(core);
          g.addChild(new PIXI.Sprite(PIXELS.itemRingTex()));
          v.itemsC.addChild(g);
          v.items.push({ g, core });
        }
        while (v.items.length > b.items.length) { const it = v.items.pop(); v.itemsC.removeChild(it.g); it.g.destroy({ children: true }); }
        b.items.forEach((it, i) => {
          const sp = v.items[i];
          const [px, py] = pathPos(v.geo, it.pos);
          sp.g.position.set(Math.round(px) - 3, Math.round(py) - 3);
          sp.core.tint = PIXELS.matTint(it.mat);
        });
      }
      // the sim's own answer for each machine, read on a slow beat: it drives
      // both the state dot and whether the machine's art is working or waiting
      if (frameClock % 20 === 0 && window.SIM) {
        for (const s of Object.values(stations)) {
          if (!s.def.m) continue;
          s.simState = s.auto ? SIM.state(simProfile, s.def.m) : 'off';
          const d = stateDots[s.def.id];
          if (d) d.texture = PIXELS.stateDotTex(s.simState);
        }
      }
    }

    frameClock++;
    // every machine on the map, in its state, on the right clock: the work
    // beat is quick, the idle breath slow, so the two never read alike
    {
      const wf = Math.floor(frameClock / WORK_BEAT) % PIXELS.WORK_FRAMES;
      const idf = Math.floor(frameClock / IDLE_BEAT) % PIXELS.IDLE_FRAMES;
      for (const s of Object.values(stations)) {
        if (!s.def.m) continue;
        const mode = modeOf(s);
        const t = band(lookOf(s.def.kind, s.auto), mode)[mode === 'work' ? wf : mode === 'idle' ? idf : 0];
        if (s.sp.texture !== t) s.sp.texture = t;
      }
    }
    for (const s of Object.values(stations)) {
      if (s.sqTtl > 0) { s.sqTtl--; if (s.sqTtl <= 0) s.sp.y = 0; }
    }

    if (chargeG) chargeG.clear();
    if (chargeVal !== null) {
      if (!chargeG) {
        chargeG = new PIXI.Graphics();
        chargeG.zIndex = 6000;
        cameraC.addChild(chargeG);
      }
      const bx = Math.round(playerX) - 8, by = Math.round(playerY) - 30;
      chargeG.clear()
        .rect(bx, by, 16, 4).fill(0x221d29)
        .rect(bx + 1, by + 1, Math.round(14 * Math.min(1, chargeVal)), 2).fill(chargeColor);
    }
    drawSocketMarker();

    for (const a of ambient) {
      a.sp.alpha = a.base * (0.75 + 0.25 * Math.sin(frameClock * 0.05 + a.phase));
    }
    if (frameClock % 26 === 0 && waterSprites.length) {
      const f = Math.floor(frameClock / 26) % 2;
      for (const w of waterSprites) w.sp.texture = waterTexes[f][w.seed];
    }
    for (const m of petals) {
      m.x += m.vx * dt;
      m.y += 0.05 * dt;
      const home = CHAIN.MAP.REGIONS[0];
      if (m.x > home.x + home.w) m.x = home.x;
      if (m.y > (home.y || 0) + (home.h || CHAIN.WORLD_H)) m.y = (home.y || 0) + 36;
      const wob = Math.sin(frameClock * 0.03 + m.phase);
      m.sp.texture = PIXELS.petalTex(Math.abs(Math.floor(frameClock / 14 + m.phase)) % 2);
      m.sp.position.set(Math.round(m.x + wob * 2), Math.round(m.y));
      m.sp.alpha = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(frameClock * 0.02 + m.phase * 2));
    }

    for (let i = flashes.length - 1; i >= 0; i--) {
      if (--flashes[i].ttl <= 0) { flashes[i].sp.tint = 0xffffff; flashes.splice(i, 1); }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy * dt; p.sp.alpha -= 0.05 * dt;
      p.sp.position.set(Math.round(p.x), Math.round(p.y));
      if (--p.ttl <= 0) { cameraC.removeChild(p.sp); p.sp.destroy(); particles.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.vy += 0.07 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.sp.position.set(Math.round(p.x), Math.round(p.y));
      p.ttl -= dt;
      p.sp.alpha = p.ttl < 8 ? 0.5 : 1;
      if (p.ttl <= 0) { cameraC.removeChild(p.sp); p.sp.destroy(); sparks.splice(i, 1); }
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.wy -= 0.16 * dt;
      f.t.position.set(Math.round(f.wx - f.t.texture.width / 2), Math.round(f.wy));
      f.t.alpha = Math.min(1, f.ttl / 25);
      if ((f.ttl -= dt) <= 0) { labelsC.removeChild(f.t); f.t.destroy(); floats.splice(i, 1); }
    }
  }

  function screenPos(wx, wy) {
    return { x: wx * S + cameraC.x, y: wy * S + cameraC.y };
  }
  function setDockGlow(color) {
    if (!dockedId) return;
    const st = stations[dockedId];
    if (!st) return;
    const r = st.glowRect || { x: 0, y: 36, w: 26, h: 2 };
    st.glow.clear().rect(r.x, r.y, r.w, r.h).fill(color);
  }

  window.FACTORY = {
    init, loadMap, buildWorld, setMove, castLetter, floatText, stamp, getDocked, posOf,
    playerPos: () => ({ x: playerX, y: playerY }),
    screenPos, setDockGlow, showInfo, clearInfo, showMenu, clearMenu, setAutoLook,
    routeBelt, beltReaches, showGhost, clearGhost, setSpool, markStations, setSocketTarget,
    setInvValue, invScreenPos, setHudKeys, setCharge,
    onDock: null,
  };
})();
