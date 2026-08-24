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
  const idleTex = { down: [], up: [], side: [] };
  let facing = 'side', faceSign = 1, walkClock = 0, walkFrame = 0;
  let idleClock = 0, idleFrame = 0;
  let workTtl = 0, workClock = 0, working = false;
  let playerX = 40, playerY = 90;
  const moving = { left: false, right: false, up: false, down: false };
  let dockedId = null;
  let frameClock = 0;
  let dotTex = null;
  const particles = [], floats = [], flashes = [], sparks = [], puffs = [], builds = [];
  const petals = [];
  let ambient = [], waterSprites = [], terrain = [], nodeSprites = [];
  let waterTexes = [];
  let grid = null;
  let crossSprites = [], openRects = [], closedRects = [];
  const machineTexCache = {};          // 'look:state' → one texture per frame of that band
  // phase 3: belts on the map, items riding them, the spool, the ghost route
  let simProfile = null;               // the save whose belts/items we draw (set by buildWorld)
  let beltViews = {};                  // belt id → {c, items:[sprite], pipe, b}
  let portSprites = [];                // the inlet/outlet plates around every machine
  let padSprites = [];                 // the surveyed pads and veins (markers only)
  const beltTileIndex = new Map();      // "tx,ty" → belt ids on that tile (two where runs cross)
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
  const STATION_LOOK = { smelter: 'bigrams', foundry: 'foundry', constructor: 'words', molder: 'molder', fastener: 'fastener', crane: 'crane', manufacturer: 'manufacturer' };
  // an automated mine is a different machine to look at, not a different state
  const lookOf = (kind, auto) => kind === 'mine' ? (auto ? 3 : 1) : (STATION_LOOK[kind] || 'lines');
  function band(look, mode, facing) {
    const face = facing || 's';
    const k = look + ':' + mode + ':' + face;
    if (!machineTexCache[k]) {
      const n = mode === 'work' ? PIXELS.WORK_FRAMES : mode === 'idle' ? PIXELS.IDLE_FRAMES : 1;
      const draw = typeof look === 'number'
        ? (f) => PIXELS.machineTex(look, f, mode, face)
        : (f) => PIXELS.stationTex(look, f, mode, face);
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
      // the row's own flash, under everything in it: a bar that lights when
      // goods land in this row or a price leaves it, so the bag says which
      // line moved without the number having to be read
      const flash = new PIXI.Graphics().rect(1, 1 + i * HUD_ROW, HUD_W - 2, HUD_ROW - 1).fill(0xffffff);
      flash.visible = false;
      uiC.addChild(flash);
      const ic = new PIXI.Sprite(PIXELS.matTex(k));
      ic.position.set(3, 3 + i * HUD_ROW);
      uiC.addChild(ic);
      const t = new PIXI.Sprite(PIXELS.textTex(String(invValues[k] || 0), PIXELS.P.paper));
      t.position.set(HUD_W - 3 - t.texture.width, 6 + i * HUD_ROW);
      uiC.addChild(t);
      hudRows[k] = { t, ic, flash, iy: ic.y, pulse: null };
    });
  }
  function setInvValue(key, n) {
    invValues[key] = n;
    const r = hudRows[key];
    if (!r) return;
    r.t.texture = PIXELS.textTex(String(n), PIXELS.P.paper);
    r.t.position.x = HUD_W - 3 - r.t.texture.width;
  }
  function invScreenPos(key) {
    const r = hudRows[key];
    if (!r) return null;
    return r.t.getGlobalPosition();
  }
  // The row takes the hit: gold and a jump up when a good lands in it,
  // verdigris and a press down when a price is drawn out of it. One flag
  // and the frame does the rest, so a burst of arrivals restarts the same
  // flash instead of stacking a dozen of them.
  function pulseInv(key, out) {
    const r = hudRows[key];
    if (!r) return;
    r.pulse = { t: 0, life: 15, out: !!out };
  }
  function tickHud(dt) {
    for (const r of Object.values(hudRows)) {
      const p = r.pulse;
      if (!p) continue;
      p.t += dt;
      const k = Math.min(1, p.t / p.life);
      r.flash.visible = true;
      r.flash.tint = p.out ? 0x7fc9a8 : 0xf2c14e;
      r.flash.alpha = (1 - k) * (p.out ? 0.34 : 0.55);
      r.ic.y = r.iy + (p.out ? 1 : -1) * (k < 0.55 ? 1 : 0);
      r.t.tint = k < 0.55 ? (p.out ? 0x7fc9a8 : 0xfff0a6) : 0xffffff;
      if (k >= 1) { r.pulse = null; r.flash.visible = false; r.ic.y = r.iy; r.t.tint = 0xffffff; }
    }
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
    socketG.position.set(midX(st.def) - 5, st.def.y - 32 - bounce);
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
    for (let f = 0; f < PIXELS.WALK_BEATS; f++) {
      charTex.down.push(PIXELS.characterTex('down', f));
      charTex.up.push(PIXELS.characterTex('up', f));
      charTex.side.push(PIXELS.characterTex('side', f));
    }
    // Standing still is not a still frame: four slow beats of breath.
    for (let f = 0; f < PIXELS.IDLE_BEATS; f++) {
      idleTex.down.push(PIXELS.characterIdleTex('down', f));
      idleTex.up.push(PIXELS.characterIdleTex('up', f));
      idleTex.side.push(PIXELS.characterIdleTex('side', f));
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
    terrain = []; ambient = []; waterSprites = []; nodeSprites = [];
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
    // Ore veins (the mines stand on them). A vein is seated across or down;
    // the map may say which, and a mine built on it overrides that with its
    // own facing — see reseatVeins, which runs once the save is known. The
    // terrain pass cannot do it here because it has no profile.
    nodeSprites = [];
    CHAIN.MAP.NODES.forEach((n, i) => {
      const sp = keep(new PIXI.Sprite(PIXELS.nodeTex(n.kind, !!n.vert)));
      sp.position.set(n.x, n.y);
      sp.zIndex = -960;
      nodeSprites[i] = sp;
    });
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
  // A row: {pre?: text, kind?: kind id (12px icon), items?: {mat:n} sprites+counts,
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
      const ic = new PIXI.Sprite(PIXELS.matTex(row.ore));
      put(ic, 1); ix += 12;
    }
    for (const [mat, n] of Object.entries(row.items || {})) {
      const ic = new PIXI.Sprite(PIXELS.matTex(mat));
      put(ic, 1); ix += 11;
      // a count the bag falls short of prints red (row.short lists them),
      // so an unaffordable price says which material is the problem
      const lack = row.short && row.short.includes(mat);
      const cnt = new PIXI.Sprite(PIXELS.textTex(String(n), lack ? '#ff8a70' : PIXELS.P.paper));
      put(cnt, 3); ix += cnt.texture.width + 3;
    }
    if (row.out) {
      const arrow = new PIXI.Sprite(PIXELS.textTex('→', PIXELS.P.brass2));
      put(arrow, 3); ix += arrow.texture.width + 3;
      const oc = new PIXI.Sprite(PIXELS.matTex(row.out));
      put(oc, 1); ix += 11;
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
  // the def a floating panel anchors to: a station's, or the operator
  // themself ('@player') for the panels the build flow raises in open field
  function defOf(dockId) {
    if (dockId === '@player') return { id: '@player', x: Math.round(playerX) - 13, y: Math.round(playerY), bw: 26 };
    const st = stations[dockId];
    return st ? st.def : null;
  }
  function showInfo(dockId, rows) {
    wipeInfo();
    if (!ready || !dockId || !rows || !rows.length) { drawMenu(); return; }
    const def = defOf(dockId);
    if (!def) { drawMenu(); return; }
    const cx = midX(def);
    let y = def.y - 46 - (rows.length - 1) * 16;
    // no room above (a place near the world's top edge): the rows stand
    // beside the place instead, right of it — or left near the east edge —
    // so the ground below (a belt route, say) stays visible
    const side = y < 2;
    if (side) y = Math.max(2, def.y - 40);
    if (!side) infoBox = { dockId, top: y };
    const built = rows.map((row) => rowContainer(row));
    const widest = Math.max(...built.map((c) => c._w));
    const rightOK = def.x + 40 + widest + 6 <= CHAIN.WORLD_W;
    built.forEach((c, i) => {
      const row = rows[i];
      const back = new PIXI.Graphics().rect(-3, -2, c._w + 6, 16).fill({ color: 0x17161a, alpha: 0.7 });
      c.addChildAt(back, 0);
      if (!side) c.position.set(Math.round(cx - c._w / 2), y);
      else c.position.set(rightOK ? def.x + 40 : def.x - 12 - c._w, y);
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
    const def = defOf(dockId);
    if (!def) return;
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
    const cx = midX(def);
    let px = Math.round(cx - w / 2);
    // above the machine's own rows when it has any, else above the machine —
    // and always inside the window the player is looking at: a tall panel
    // near the world's top edge drops below the place rather than off-screen
    let base = def.y - 50;
    if (infoBox && infoBox.dockId === dockId) base = Math.min(base, infoBox.top - 6);
    const vx = Math.round(camX), vy = Math.round(camY);
    px = Math.max(vx + 2, Math.min(vx + viewW - w - 2, px));
    let py = base - h;
    if (py < vy + 2) py = def.y + 8;
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
    return band(lookOf(m.kind, m.autoLive), m.autoLive ? 'idle' : 'still', SIM.facingOf(m))[0];
  }

  // Build the world from the save: machines on plots and nodes, free plots,
  // unbuilt nodes, crossings. `autoLive(m)` says whether a machine is running
  // by itself right now (⚙ bought and its letters sticky).
  // A vein takes the seating of the mine standing on it: a mine faced east or
  // west is 1x2, so its vein is too. An unbuilt vein keeps whatever the map
  // gave it. Cheap enough to redo on every rebuild, and it is the only place
  // that knows both the vein and the machine.
  function reseatVeins(profile) {
    if (!nodeSprites.length) return;
    const face = [];
    for (const m of profile.machines) if (m.node !== undefined && m.node !== null) face[m.node] = m.face;
    CHAIN.MAP.NODES.forEach((n, i) => {
      const sp = nodeSprites[i];
      if (!sp) return;
      const f = face[i];
      const vert = f ? (f === 'e' || f === 'w') : !!n.vert;
      sp.texture = PIXELS.nodeTex(n.kind, vert);
    });
  }

  function buildWorld(profile, autoLive) {
    if (!ready) return;
    simProfile = profile;
    reseatVeins(profile);
    clearInfo(); clearMenu(); clearGhost(); clearBuildGhost();
    for (const v of Object.values(beltViews)) { cameraC.removeChild(v.c); v.c.destroy({ children: true }); }
    beltViews = {};
    for (const s of portSprites) { cameraC.removeChild(s); s.destroy(); }
    portSprites = [];
    for (const s of padSprites) { cameraC.removeChild(s); s.destroy(); }
    padSprites = [];
    beltTileIndex.clear();
    beltDockId = null;                 // its station goes with the rest, below
    for (const s of Object.values(stateDots)) { cameraC.removeChild(s); s.destroy(); }
    stateDots = {};
    for (const s of Object.values(stations)) { cameraC.removeChild(s.root); s.root.destroy({ children: true }); }
    for (const l of labelsC.children.slice()) { labelsC.removeChild(l); l.destroy(); }
    floats.length = 0;
    flashes.length = 0;
    builds.length = 0;            // the bodies these held are being destroyed below
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

    // machines: seated on their tile box, the sprite centred on it with its
    // feet a step up from the box's south edge — the ground the front ports
    // use stays visible, and the tower covers at most half of the row
    // behind (rotation overhaul, 2026-08-21)
    for (const m of profile.machines) {
      const b = bodyBox(m);
      const bx = b.c0 * T16, by = b.r0 * T16, bwPx = b.w * T16, bhPx = b.h * T16;
      const foot = m.kind === 'mine' ? 2 : 10;
      const live = !!(autoLive && autoLive(m));
      const root = new PIXI.Container();
      const sp = new PIXI.Sprite(stationSpriteTex({ ...m, autoLive: live }));
      sp.position.set((bwPx - sp.texture.width) >> 1, bhPx - foot - sp.texture.height);
      root.addChild(sp);
      const bw = bwPx - 2;
      const glow = new PIXI.Graphics().rect(1, bhPx - 5, bw - 4, 2).fill(0xc9a24a);
      glow.visible = false;
      root.addChild(glow);
      // the belt mark: green = a belt from the carried spool can end here,
      // red = it cannot (shown only while carrying)
      const mark = new PIXI.Graphics().rect(-1, bhPx - 2, bw, 2).fill(0x6cc46c);
      mark.visible = false;
      root.addChild(mark);
      root.position.set(bx, by);
      root.zIndex = by + bhPx - 5;
      cameraC.addChild(root);
      const id = 'm:' + m.id;
      stations[id] = {
        def: { id, x: bx + 1, y: by + bhPx - 5, kind: m.kind, m, bw }, root, sp, glow, mark, built: true, auto: live, sqTtl: 0,
        spBase: sp.y,
        body: { x: bx, y: by, w: bwPx, h: bhPx },   // the ground it covers, for the smoke it arrives in
        glowRect: { x: 1, y: bhPx - 5, w: bw - 4, h: 2 },
        simState: live && window.SIM ? SIM.state(profile, m) : 'off',
      };
      if (live) {
        const d = new PIXI.Sprite(PIXELS.stateDotTex('run'));
        d.position.set(bx + bwPx - 6, by - 10);
        d.zIndex = by + bhPx - 4;
        cameraC.addChild(d);
        stateDots[id] = d;
      }
    }
    const relaid = reconcileBelts(profile);
    drawPorts(profile);
    drawBelts(profile);
    // Free pads and unbuilt veins: surveyed markers on the ground, and
    // nothing more. They stopped being dockable places when the build ghost
    // arrived (rotation overhaul, 2026-08-21): a long press on open ground
    // opens the build menu, and the ghost is aimed by walking — so a pad is
    // just the ground that will take a body, drawn where the zone really is
    // (one size, 3×3, the largest kind every way up).
    for (const p of CHAIN.freePlots(profile)) {
      const b = MAPKIT.padBox(p);
      const sp = new PIXI.Sprite(PIXELS.plotTex(48, 48));
      sp.position.set(b.c0 * T16, b.r0 * T16);
      sp.zIndex = -700;
      sp.alpha = 0.9;
      cameraC.addChild(sp);
      padSprites.push(sp);
    }
    // a vein takes a mine and a mine is two tiles by one, so its mark is
    // that and not a build pad's — laid across or bedded on end, whichever
    // way the map seated the seam
    for (const n of CHAIN.unbuiltNodes(profile)) {
      const b = MAPKIT.veinBox(n);
      const sp = new PIXI.Sprite(PIXELS.plotTex(b.w * T16, b.h * T16));
      sp.position.set(b.c0 * T16, b.r0 * T16);
      sp.zIndex = -700;
      sp.alpha = 0.6;
      cameraC.addChild(sp);
      padSprites.push(sp);
    }

    player = new PIXI.Sprite(charTex.side[0]);
    player.anchor.set(0.5, 1);
    player.position.set(Math.round(playerX), Math.round(playerY));
    cameraC.addChild(player);
    if (dockedId && stations[dockedId]) stations[dockedId].glow.visible = true;
    return relaid;   // {moved, lost} — what turning or an older save did to the runs
  }
  // an automated mine changes look without a full rebuild
  function setAutoLook(dockId, live) {
    const st = stations[dockId];
    if (!st || st.def.kind !== 'mine') return;
    st.auto = live;
    st.simState = live ? 'run' : 'off';
    st.sp.texture = band(lookOf(st.def.kind, live), live ? 'idle' : 'still', SIM.facingOf(st.def.m))[0];
  }

  // ---------- belts on the map (phase 3) ----------
  const T16 = 16;
  const HALF_MAT = PIXELS.MAT_PX >> 1;   // a good is centred on the band
  const tileOf = (px, py) => [Math.floor(px / T16), Math.floor(py / T16)];
  // ---------- the ground a machine stands on ----------
  // The box is both the tiles no run may lie on and the frame the ports hang
  // off, so a port is never a tile the body covers and a run always meets
  // the machine flush. The arithmetic is CHAIN's (the seated `at` plus the
  // facing's footprint): dev/verify.html checks every plot on every map
  // against the same answer this draws from.
  function bodyBox(m) {
    return CHAIN.machineBox(m);
  }
  function footprintTiles(m) {
    const b = bodyBox(m);
    const out = [];
    for (let ty = b.r0; ty <= b.r1; ty++) for (let tx = b.c0; tx <= b.c1; tx++) out.push([tx, ty]);
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
  // ---------- a machine's ports, on the ground ----------
  // sim.js names the places around a body — one per column across the front,
  // one per row down each side — and hands each inlet and outlet one of
  // them. MAPKIT turns a place into a tile; what is added here is the heading
  // it may be met on.
  //
  // A run ends ON the plate, its drum against the body — that is what makes
  // it look plugged in rather than merely finishing nearby. It used to have
  // to leave and arrive straight out as well, which swung a run a tile wide
  // of a port it approached from the side; since 2026-08-21 the run may
  // TURN on the plate itself — a corner plug — provided the corner's first
  // tile does not lie on another port of either machine (the cut-off rule:
  // a turn that blocked a neighbouring plug would trade one port for
  // another). A port with every way out blocked is still a port you cannot
  // use where the machine stands and faces.
  const AWAY_STEP = { e: 0, w: 1, s: 2, n: 3 };   // into STEPS, below
  const DIR_SIDE = ['e', 'w', 's', 'n'];          // STEPS index → tile side
  function machinePorts(m) {
    const b = bodyBox(m);
    const facing = SIM.facingOf(m);
    const plan = SIM.ports(m);
    const place = (q) => {
      const [tx, ty] = MAPKIT.portTile(b, facing, q.side, q.slot);
      const away = AWAY_STEP[q.face];
      return { ...q, tx, ty, away, toward: away ^ 1 };
    };
    return { out: plan.out.map(place), in: plan.in.map(place) };
  }
  // every tile a machine loads or unloads on — the ground the cut-off rule
  // protects
  function portTiles(m) {
    const ps = machinePorts(m);
    const set = new Set();
    for (const q of ps.out.concat(ps.in)) set.add(key(q.tx, q.ty));
    return set;
  }
  // the ways a run may meet this port: straight along its heading, or —
  // the corner plug — square across the plate. A corner's first tile must
  // not lie on another port (`noPass`), and every way needs its tile free
  // and the step onto it walkable. Empty = a port you cannot use.
  const PERP = [[2, 3], [2, 3], [0, 1], [0, 1]];   // the two headings square to each
  function portWays(q, profile, blocked, beltAt, noPass) {
    if (!beltFree(profile, q.tx, q.ty, blocked, beltAt, null)) return [];
    const ways = [];
    for (const dir of [q.away, PERP[q.away][0], PERP[q.away][1]]) {
      const nx = q.tx + STEPS[dir][0], ny = q.ty + STEPS[dir][1];
      if (dir !== q.away && noPass && noPass.has(key(nx, ny))) continue;
      if (!beltFree(profile, nx, ny, blocked, beltAt, STEP_AXIS[dir])) continue;
      if (!beltStep(q.tx, q.ty, nx, ny)) continue;
      ways.push(dir);
    }
    return ways;
  }
  // the ports of a machine a run could actually use, each carrying its ways
  function openPorts(m, dir, profile, blocked, beltAt, noPass) {
    const guard = noPass || portTiles(m);
    return machinePorts(m)[dir]
      .map((q) => ({ ...q, ways: portWays(q, profile, blocked, beltAt, guard) }))
      .filter((q) => q.ways.length);
  }
  // the same, for a caller that has no map in hand (the dev pages)
  function portsOpen(m, dir, profile) {
    const { blocked, beltAt } = beltGround(profile);
    return openPorts(m, dir, profile, blocked, beltAt);
  }
  function portOpen(q, profile, blocked, beltAt, noPass) {
    return portWays(q, profile, blocked, beltAt, noPass).length > 0;
  }
  // shortest belt path from one machine's outlet to another's inlet, or null
  // when there is none — the caller says so rather than laying anything.
  // Breadth-first from every open outlet of the source to the first open
  // inlet of the target; machines, scenery and solids block, and another
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
  // the ground a run may cover, laid out from the source's open outlets.
  // Stops at the first goal when given one, floods everything when not, so
  // the bars under the machines and the route the hold lays come out of the
  // same walk.
  //
  // `starts` are ports: the walk begins on every way out of each — straight
  // out first, so a tie between a straight plug and a corner plug goes to
  // the straight one — with the port tile itself standing at distance
  // nothing so the way back finds it. `goals` maps an inlet's tile to its
  // port: a run may arrive straight in or square across the plate (the
  // corner plug), never out of the body. `noPass` is the cut-off rule's
  // ground: the involved machines' other ports, tiles the walk never
  // crosses.
  function beltFlood(profile, starts, blocked, beltAt, goals, noPass) {
    const dist = new Map(), q = [];
    const startSet = new Set(starts.map((s) => key(s.tx, s.ty)));
    for (const s of starts) {
      dist.set(sk(s.tx, s.ty, FROM_MACHINE), 0);
      for (const dir of s.ways || [s.away]) {
        const nx = s.tx + STEPS[dir][0], ny = s.ty + STEPS[dir][1];
        const nk = sk(nx, ny, dir);
        if (dist.has(nk) || startSet.has(key(nx, ny))) continue;
        dist.set(nk, 1); q.push([nx, ny, dir]);
      }
    }
    let found = null, guard = 0, head = 0;
    while (head < q.length && guard++ < 40000) {
      const [x, y, d] = q[head++];
      // A run ends somewhere other than where it started. Where two machines
      // stand close enough to share a tile around them, that tile is both a
      // place to start and a place to finish, and without this the walk
      // stepped off it and straight back onto it — a run of three tiles that
      // doubled back on itself and stood on its own end.
      if (goals) {
        const g = goals.get(key(x, y));
        if (g && !startSet.has(key(x, y)) && (d === g.toward || STEP_AXIS[d] !== STEP_AXIS[g.toward])) { found = [x, y, d]; break; }
        // A port is a place a run ends, never one it passes over: an
        // arrival that cannot plug (out of the body) is a dead end, and the
        // walk never steps past a goal and back in — a run standing on its
        // own last tile.
        if (g) continue;
      }
      const straightOnly = beltAt.has(key(x, y));
      const here = dist.get(sk(x, y, d));
      for (let s = 0; s < 4; s++) {
        if (straightOnly && d !== FROM_MACHINE && s !== d) continue;   // cross it, don't turn on it
        const nx = x + STEPS[s][0], ny = y + STEPS[s][1], nk = sk(nx, ny, s);
        if (dist.has(nk) || startSet.has(key(nx, ny))) continue;
        if (noPass && noPass.has(key(nx, ny))) continue;
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
    // neither machine's ports are ground the run may cross (the cut-off
    // rule) — except the inlets it may actually end on, which the flood
    // already guards as goals
    const noPass = new Set([...portTiles(from), ...portTiles(to)]);
    const starts = openPorts(from, 'out', profile, blocked, beltAt, noPass);
    const goals = new Map();
    for (const q of openPorts(to, 'in', profile, blocked, beltAt, noPass)) goals.set(key(q.tx, q.ty), q);
    if (!starts.length || !goals.size) return null;
    for (const k of goals.keys()) noPass.delete(k);
    const { dist, found, guard } = beltFlood(profile, starts, blocked, beltAt, goals, noPass);
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
    // The walk holds states of (tile, heading), so nothing in it forbids a
    // route from crossing itself on two headings. Geometry makes that all
    // but impossible now that ports are ends rather than through-tiles, and
    // a route that managed it anyway would draw as a run lying over itself:
    // say there is none rather than lay it.
    const seen = new Set();
    for (const [tx, ty] of path) { if (seen.has(key(tx, ty))) return null; seen.add(key(tx, ty)); }
    return path;
  }
  // which machines a run from this one could actually reach, by geometry
  // alone — one flood rather than a search per machine, so the green bars
  // never promise a belt the ground has no room for
  function beltReaches(from, profile) {
    const out = new Set();
    if (!grid) return out;
    const { blocked, beltAt } = beltGround(profile);
    const fromPorts = portTiles(from);
    const starts = openPorts(from, 'out', profile, blocked, beltAt, fromPorts);
    if (!starts.length) return out;
    const { dist } = beltFlood(profile, starts, blocked, beltAt, null, fromPorts);
    const startSet = new Set(starts.map((s) => key(s.tx, s.ty)));
    for (const m of profile.machines) {
      if (m.id === from.id) continue;
      // an inlet counts as reached on a heading it may be plugged on:
      // straight in, or square across the plate
      const ok = openPorts(m, 'in', profile, blocked, beltAt)
        .some((q) => !startSet.has(key(q.tx, q.ty)) &&
          [q.toward, PERP[q.toward][0], PERP[q.toward][1]].some((d) => dist.has(sk(q.tx, q.ty, d))));
      if (ok) out.add(m.id);
    }
    return out;
  }
  // is this run actually plugged in at both ends — ON a port, leaving and
  // arriving by a way a port allows? Straight through the plate, or square
  // across it (the corner plug), never out of the body — and a corner's
  // first tile never lies on another of that machine's ports.
  function beltPlugged(b, from, to) {
    const n = b.path.length;
    if (n < 2) return false;
    const at = (list, tile) => list.find((q) => q.tx === tile[0] && q.ty === tile[1]);
    const head = at(machinePorts(from).out, b.path[0]);
    const tail = at(machinePorts(to).in, b.path[n - 1]);
    if (!head || !tail) return false;
    const dirOf = (a, z) => STEPS.findIndex((s) => s[0] === z[0] - a[0] && s[1] === z[1] - a[1]);
    const outDir = dirOf(b.path[0], b.path[1]);
    const inDir = dirOf(b.path[n - 2], b.path[n - 1]);
    if (outDir < 0 || inDir < 0) return false;
    if (outDir === (head.away ^ 1) || inDir === tail.away) return false;   // through the body
    if (outDir !== head.away && portTiles(from).has(key(b.path[1][0], b.path[1][1]))) return false;
    if (inDir !== tail.toward && portTiles(to).has(key(b.path[n - 2][0], b.path[n - 2][1]))) return false;
    return true;
  }
  // A run laid before machines had ports ends wherever it could reach, and a
  // machine turned since leaves its runs in the same state: meeting the body
  // at no port at all. Re-lay each one between the same two machines rather
  // than leave it plugged into nothing; where the ground has no route left,
  // take it up.
  // A run that moves has not died — it is the same run over different tiles,
  // so its goods roll home into the source and it makes no smoke. A run with
  // nowhere to go has died, and dying is dying: it goes out the same door as
  // everything else destroyed (DROPS.demolish), with the poof, the sound and
  // its goods left lying on the tiles it was crossing. Which of the two it is
  // is not known until the route has been tried, so the goods come off the
  // run as it is lifted and wait here for the answer.
  // Every run that has to move comes up first, and only then do they go back
  // down. Lifting them one at a time let a run still lying on its old path
  // block the ground another one needed, and the second run was taken up for
  // want of a route that was about to be free.
  function reconcileBelts(profile) {
    const belts = profile.belts || [];
    const lift = [];
    // a body that has grown since — a save from before the kinds had sizes —
    // can be standing on a tile a run lies across. Such a run is plugged in
    // at both ends and still has to move, so the bodies are checked as well
    // as the ends.
    const under = new Set();
    for (const m of profile.machines) for (const [x, y] of footprintTiles(m)) under.add(key(x, y));
    belts.forEach((b, at) => {
      const from = SIM.machineById(profile, b.from), to = SIM.machineById(profile, b.to);
      if (!from || !to) return;
      if (beltPlugged(b, from, to) && !b.path.some(([x, y]) => under.has(key(x, y)))) return;
      SIM.ensureMachine(from);
      lift.push({ b, at, from, to, riding: b.items });
      b.items = [];
    });
    if (!lift.length) return { moved: 0, lost: 0 };
    profile.belts = belts.filter((b) => !lift.some((l) => l.b === b));
    let moved = 0;
    const back = [], gone = [];
    for (const l of lift) {
      const path = routeBelt(l.from, l.to, profile);
      if (!path) { gone.push(l); continue; }
      // it moved: the goods it was carrying roll home, as if it had been
      // lying along its new tiles all along
      for (const it of l.riding) {
        if ((l.from.buf.out[it.mat] || 0) < CHAIN.TUNING.BUFFER_CAP) l.from.buf.out[it.mat] = (l.from.buf.out[it.mat] || 0) + 1;
      }
      l.b.path = path;
      profile.belts.push(l.b);      // in the ground's eyes at once, so the next one routes around it
      back.push(l);
      moved++;
    }
    // and the rest died. Their goods go back on them first, so the one door
    // drops each one where it was riding; one call, so however many runs came
    // up it is one poof and one sound.
    if (gone.length) {
      for (const l of gone) l.b.items = l.riding;
      DROPS.demolish(profile, { belts: gone.map((l) => l.b) });
    }
    // laying order decides which run bridges which at a crossing: put them
    // back where they were, so a world drawn twice looks the same twice
    profile.belts = profile.belts.filter((b) => !back.some((l) => l.b === b));
    for (const l of back) profile.belts.splice(Math.min(l.at, profile.belts.length), 0, l.b);
    return { moved, lost: gone.length };
  }
  // Every inlet and outlet, marked on the tile a run has to reach to use it.
  // A port under a run keeps its plate (the drum sits on top of it and says
  // the same thing); a port with no room outside it is drawn faint, because
  // it is a port you cannot use where the machine stands and faces now.
  function drawPorts(profile) {
    const { blocked, beltAt } = beltGround(profile);
    const ends = new Set();
    for (const b of profile.belts || []) {
      if (b.path && b.path.length) {
        ends.add(key(b.path[0][0], b.path[0][1]));
        ends.add(key(b.path[b.path.length - 1][0], b.path[b.path.length - 1][1]));
      }
    }
    for (const m of profile.machines) {
      const ps = machinePorts(m);
      const own = portTiles(m);
      for (const q of ps.out.concat(ps.in)) {
        if (!grid || q.tx < 0 || q.ty < 0 || q.tx >= grid.cols || q.ty >= grid.rows) continue;
        const sp = new PIXI.Sprite(PIXELS.portTex(OPP[q.face], q.dir));
        sp.position.set(q.tx * T16, q.ty * T16);
        sp.zIndex = -520;                    // over the ground, under the runs and the bodies
        if (!ends.has(key(q.tx, q.ty)) && !portOpen(q, profile, blocked, beltAt, own)) sp.alpha = 0.4;
        cameraC.addChild(sp);
        portSprites.push(sp);
      }
    }
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
      const to = profile.machines.find((m) => m.id === b.to);
      const pipe = !!(from && from.kind === 'mine' && from.ore === 'oil');
      const n = b.path.length;
      if (n < 2) return;
      const c = new PIXI.Container();
      c.zIndex = -500 + bi * 0.01;      // the later run draws over the earlier
      const geo = [];
      // an end tile's band runs from its drum — against the machine's body —
      // to its one neighbour: straight through the plate, or round a quarter
      // turn where the run plugs in on a corner (2026-08-21)
      const port = (m, dir2, tile) => (m ? machinePorts(m)[dir2].find((p) => p.tx === tile[0] && p.ty === tile[1]) : null);
      const hq = port(from, 'out', b.path[0]);
      const tq = port(to, 'in', b.path[n - 1]);
      const headSide = hq ? DIR_SIDE[hq.away ^ 1] : null;
      const tailSide = tq ? DIR_SIDE[tq.away ^ 1] : null;
      for (let i = 0; i < n; i++) {
        const [tx, ty] = b.path[i];
        const inS = i > 0 ? sideTo(b.path[i], b.path[i - 1]) : null;
        const outS = i < n - 1 ? sideTo(b.path[i], b.path[i + 1]) : null;
        const a = inS || headSide || OPP[outS], z = outS || tailSide || OPP[inS];
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
      for (const [tx, ty] of b.path) {
        const k = key(tx, ty);
        const l = beltTileIndex.get(k);
        if (l) l.push(b.id); else beltTileIndex.set(k, [b.id]);
      }
    });
  }

  // ---------- standing on a run ----------
  // A run is a place like any other: step onto one of its tiles and it has
  // its own menu, and taking the run up is a row in it. That belongs here
  // rather than in the menu of a machine the run happens to reach — a busy
  // machine has runs coming and going and no way to tell them apart in a
  // list, so the wrong one came up too easily.
  let beltDockId = null;
  function clearBeltDock() {
    if (!beltDockId) return;
    const st = stations[beltDockId];
    if (st) { cameraC.removeChild(st.root); st.root.destroy({ children: true }); delete stations[beltDockId]; }
    beltDockId = null;
  }
  // the run under the operator's feet, if any — two ids where runs cross
  function beltsUnderfoot() {
    if (!simProfile) return null;
    const [tx, ty] = tileOf(playerX, playerY - 2);
    const ids = beltTileIndex.get(key(tx, ty));
    return ids && ids.length ? { tx, ty, ids } : null;
  }
  // one station, moved to whichever tile of whichever run is underfoot, so
  // the menu, the glow and the caption all work the way they do everywhere
  function beltDock(tx, ty, ids) {
    const id = 'belt:' + tx + ',' + ty;
    if (beltDockId === id && stations[id]) { stations[id].def.belts = ids; return id; }
    clearBeltDock();
    const root = new PIXI.Container();
    const glow = new PIXI.Graphics();
    glow.visible = false;
    root.addChild(glow);
    const def = { id, x: tx * T16 - 5, y: ty * T16 + T16, kind: 'belt', tile: [tx, ty], belts: ids };
    root.position.set(def.x, def.y - 36);
    root.zIndex = ty * T16 + 8;
    cameraC.addChild(root);
    stations[id] = {
      def, root, sp: null, glow, built: true, auto: false, sqTtl: 0,
      glowRect: { x: 5, y: 34, w: T16, h: 2 },     // a bar along the tile's own foot
    };
    beltDockId = id;
    return id;
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
  // ---------- the build ghost (rotation overhaul, 2026-08-21) ----------
  // The machine the operator is about to build, walking with them: the body
  // translucent in its facing, every tile under it marked buildable or not,
  // and its port plates already on the ground — faint where the way out of
  // them is blocked — so a placement is aimed with the traffic in view.
  // app.js owns the rules; this draws what it is handed.
  let buildC = null, buildBodyC = null;
  function clearBuildGhost() {
    if (buildC) { cameraC.removeChild(buildC); buildC.destroy({ children: true }); buildC = null; }
    if (buildBodyC) { cameraC.removeChild(buildBodyC); buildBodyC.destroy({ children: true }); buildBodyC = null; }
  }
  function showBuildGhost(m, tiles, ok) {
    clearBuildGhost();
    if (!ready) return;
    // the ground half — the validity grid and the plates-to-be — under the
    // bodies. Every tile the body would take draws as a translucent cell,
    // green where it may stand and red where it may not, each cell rimmed
    // so the marks read as a surveyor's grid and not a stain.
    buildC = new PIXI.Container();
    buildC.zIndex = -498;
    const g = new PIXI.Graphics();
    for (const [tx, ty, tok] of tiles || []) {
      const col = tok ? 0x6cc46c : 0xd84f4f;
      const px = tx * T16, py = ty * T16;
      g.rect(px + 1, py + 1, 14, 14).fill({ color: col, alpha: 0.26 });
      g.rect(px, py, T16, 1).fill({ color: col, alpha: 0.75 });
      g.rect(px, py + T16 - 1, T16, 1).fill({ color: col, alpha: 0.75 });
      g.rect(px, py + 1, 1, T16 - 2).fill({ color: col, alpha: 0.75 });
      g.rect(px + T16 - 1, py + 1, 1, T16 - 2).fill({ color: col, alpha: 0.75 });
    }
    buildC.addChild(g);
    if (simProfile) {
      const { blocked, beltAt } = beltGround(simProfile);
      const ps = machinePorts(m);
      const own = portTiles(m);
      for (const q of ps.out.concat(ps.in)) {
        const spr = new PIXI.Sprite(PIXELS.portTex(OPP[q.face], q.dir));
        spr.position.set(q.tx * T16, q.ty * T16);
        spr.alpha = portOpen(q, simProfile, blocked, beltAt, own) ? 0.9 : 0.35;
        buildC.addChild(spr);
      }
    }
    cameraC.addChild(buildC);
    // the body half sorts like the machine it will be, so the operator
    // stands in front of it or behind it the way they will once it is real
    const b = bodyBox(m);
    const foot = m.kind === 'mine' ? 2 : 10;
    const tex0 = band(lookOf(m.kind, false), 'still', SIM.facingOf(m))[0];
    const sp = new PIXI.Sprite(tex0);
    sp.position.set(b.c0 * T16 + ((b.w * T16 - tex0.width) >> 1), b.r0 * T16 + b.h * T16 - foot - tex0.height);
    sp.alpha = 0.6;
    if (!ok) sp.tint = 0xff9a8a;
    buildBodyC = new PIXI.Container();
    buildBodyC.zIndex = b.r0 * T16 + b.h * T16 - 5;
    buildBodyC.addChild(sp);
    cameraC.addChild(buildBodyC);
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
      if (v) st.mark.clear().rect(-2, 39, (st.def.bw || 26) + 4, 2).fill(v === 'ok' ? 0x6cc46c : 0xd84f4f);
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

  // Motes: thrown up out of a place, or — with `ring` — drawn into one from
  // a circle that wide, which is the only difference between a thing giving
  // something up and a thing being put together. Drawn in, they fall to the
  // middle instead of to the ground, so they carry no weight.
  function spawnSparks(wx, wy, n, tint, ring) {
    for (let i = 0; i < n; i++) {
      const sp = new PIXI.Sprite(PIXELS.sparkTex());
      sp.tint = tint;
      sp.zIndex = 5000;
      cameraC.addChild(sp);
      if (ring) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
        const r = ring * (0.65 + Math.random() * 0.5), ttl = 14 + Math.random() * 8;
        sparks.push({
          sp, x: wx + Math.cos(a) * r, y: wy + Math.sin(a) * r * 0.6,
          vx: (-Math.cos(a) * r) / ttl, vy: (-Math.sin(a) * r * 0.6) / ttl, g: 0,
          ttl,
        });
      } else {
        sparks.push({
          sp, x: wx + Math.random() * 10 - 5, y: wy,
          vx: Math.random() * 1.6 - 0.8, vy: -(0.15 + Math.random() * 0.5), g: 0.07,
          ttl: 18 + Math.random() * 10,
        });
      }
    }
  }

  // ---------- coming apart, and what is left lying there ----------
  // The poof a destroyed thing makes: a box of ground, filled with puffs of
  // smoke that rise and open out, and a ring of sparks at its foot. A wider
  // body gets more of them, a single belt tile three, so one machine reads
  // as heavier than one tile of run without anything having to say so.
  // Everything that can be destroyed comes through DROPS.demolish, which
  // calls this; nothing else should.
  function poof(wx, wy, w, h) {
    if (!ready) return;
    const n = Math.max(3, Math.min(9, Math.round((w * h) / 90)));
    for (let i = 0; i < n; i++) {
      const sp = new PIXI.Sprite(PIXELS.puffTex(0));
      sp.anchor.set(0.5);
      sp.zIndex = 5600;
      sp.visible = false;
      cameraC.addChild(sp);
      puffs.push({
        sp, frame: -1,
        x: wx + Math.random() * w, y: wy + h * 0.25 + Math.random() * h * 0.75,
        vx: Math.random() * 0.7 - 0.35, vy: -(0.14 + Math.random() * 0.3),
        t: 0, life: 26 + Math.random() * 14, delay: i * 1.6,
      });
    }
    spawnSparks(wx + w / 2, wy + h * 0.7, 7, 0xe8dcc0);
  }

  // ---------- coming together: the poof, run backwards ----------
  // Everything built goes out through here, the way everything destroyed
  // goes out through DROPS.demolish, and for the same reason: a purchase
  // should look like its own undoing played the other way round. The poof
  // opens puffs out of a body and leaves bare ground; this gathers puffs
  // onto bare ground, draws a ring of motes down into the middle of them,
  // and settles the body out of the smoke a beat later.
  //
  // `what` names the site the way demolish names what is coming apart:
  //   {dockId}  a station's body — a machine, or a place with none left
  //   {path}    the tiles a run was laid along
  //   {rect}    any box of world pixels, for a site with no station
  // `hold` is how long the price is still in the air: the body lands a beat
  // after that, and the site smokes for the whole wait rather than standing
  // bare and then puffing at the last moment. The body is hidden the moment
  // this is called, so a rebuilt world never shows the thing standing there
  // before it has arrived. Returns the delay in ms before it lands, so the
  // caller can put the latch on the same beat.
  //
  // the smoke leads, the body follows: ten frames of it, said in frames
  // because that is what the ticker counts, and in ms for the caller
  const BODY_IN_F = 10, BODY_IN = Math.round((BODY_IN_F * 1000) / 60);
  const inFrames = (ms) => Math.max(0, (ms || 0) / (1000 / 60));
  function materialize(what, hold) {
    if (!ready || !what) return BODY_IN;
    const wait = inFrames(hold) + BODY_IN_F;      // frames from now until the body lands
    const boxes = [];
    let st = null;
    if (what.dockId) {
      st = stations[what.dockId] || null;
      if (st && st.body) boxes.push(st.body);
    }
    if (what.path) {
      const path = what.path;
      const step = Math.max(1, Math.ceil(path.length / 5));
      for (let i = 0; i < path.length; i += step) boxes.push({ x: path[i][0] * T16, y: path[i][1] * T16, w: T16, h: T16 });
    }
    if (what.rect) boxes.push({ x: what.rect.x, y: what.rect.y, w: what.rect.w, h: what.rect.h });
    if (!boxes.length && st) boxes.push({ x: st.def.x, y: st.def.y - 24, w: st.def.bw || 26, h: 26 });
    if (st && st.built && st.sp) bodyIn(st, wait);
    for (const b of boxes.slice(0, 6)) gather(b.x, b.y, b.w, b.h, wait);
    return (hold || 0) + BODY_IN;
  }
  // where a site is, in world pixels: the middle of a body, the middle tile
  // of a run, the middle of a rect. The price flies to this point, and the
  // smoke gathers around it.
  function siteOf(what) {
    if (!ready || !what) return null;
    if (what.dockId) {
      const st = stations[what.dockId];
      if (st && st.body) return { x: st.body.x + st.body.w / 2, y: st.body.y + st.body.h / 2 };
      const def = posOf(what.dockId);
      if (def) return { x: midX(def), y: def.y - 14 };
    }
    if (what.path && what.path.length) {
      const [tx, ty] = what.path[what.path.length >> 1];
      return { x: tx * T16 + T16 / 2, y: ty * T16 + T16 / 2 };
    }
    if (what.rect) return { x: what.rect.x + what.rect.w / 2, y: what.rect.y + what.rect.h / 2 };
    return null;
  }
  // One box of ground filling with smoke: the same puffs as the poof, but
  // they sink instead of rising and tighten through their frames instead of
  // opening out, and the motes come down a ring rather than off the foot.
  // They are spread across the whole wait rather than fired all at once, so
  // a site still being paid for goes on smoking right up to the landing —
  // a machine takes a moment to come together, and a machine coming apart
  // does not, which is the difference between the two written as timing.
  function gather(wx, wy, w, h, wait) {
    const base = Math.max(3, Math.min(9, Math.round((w * h) / 90)));
    const n = Math.min(18, Math.round(base * (1 + wait / 24)));
    for (let i = 0; i < n; i++) {
      const sp = new PIXI.Sprite(PIXELS.puffTex(PIXELS.PUFF_FRAMES - 1));
      sp.anchor.set(0.5);
      sp.zIndex = 5600;
      sp.visible = false;
      cameraC.addChild(sp);
      puffs.push({
        sp, frame: -1, rev: true,
        x: wx + Math.random() * w, y: wy + h * 0.15 + Math.random() * h * 0.7,
        vx: Math.random() * 0.5 - 0.25, vy: 0.1 + Math.random() * 0.22,
        t: 0, life: 22 + Math.random() * 10, delay: (wait * i) / n,
      });
    }
    // the ring closes as the body lands, not before it
    const ms = Math.round(Math.max(0, wait - 6) * (1000 / 60));
    if (ms) setTimeout(() => ringIn(wx, wy, w, h), ms);
    else ringIn(wx, wy, w, h);
  }
  const ringIn = (wx, wy, w, h) => spawnSparks(wx + w / 2, wy + h * 0.6, 8, 0xfff0a6, Math.max(12, w * 0.7));
  // the body settling out of the smoke: it drops the last few pixels on an
  // ease-out, comes up opaque almost at once so the smoke never shows
  // through it, and runs hot for the first beat
  function bodyIn(st, wait) {
    const sp = st.sp;
    const base = st.spBase === undefined ? sp.y : st.spBase;
    for (let i = builds.length - 1; i >= 0; i--) if (builds[i].sp === sp) builds.splice(i, 1);
    sp.visible = false;
    builds.push({ sp, base, t: 0, life: 14, delay: wait || 0 });
  }
  // Goods lying on the ground, drawn straight off the save: one sprite and
  // one shadow each, created and destroyed as the pile changes. They are
  // plain children of the camera, so rebuilding the world (which takes the
  // machines, the runs and the labels with it) leaves them where they lie —
  // and a world loaded from another save simply finds none of these ids and
  // clears them.
  let dropViews = {};
  function syncDrops() {
    const list = (simProfile && simProfile.drops) || [];
    const live = new Set();
    for (const d of list) {
      live.add(d.id);
      let v = dropViews[d.id];
      if (!v) {
        const sh = new PIXI.Sprite(PIXELS.dropShadowTex());
        sh.anchor.set(0.5);
        const sp = new PIXI.Sprite(PIXELS.matTex(d.mat));
        sp.anchor.set(0.5);
        cameraC.addChild(sh); cameraC.addChild(sp);
        v = dropViews[d.id] = { sp, sh, mat: d.mat, ph: (d.id.charCodeAt(d.id.length - 1) * 37) % 64 };
      }
      if (v.mat !== d.mat) { v.mat = d.mat; v.sp.texture = PIXELS.matTex(d.mat); }
      const z = d.z || 0;
      // at rest it breathes, a pixel up and a pixel down, on its own phase:
      // enough to say "pick me up" and not enough to look like it is loose
      const bob = z ? 0 : Math.round(Math.sin((frameClock + v.ph) * 0.07)) * 0.5;
      v.sp.position.set(Math.round(d.x), Math.round(d.y - 3 - z + bob));
      v.sp.zIndex = d.y + 0.2;
      v.sh.position.set(Math.round(d.x), Math.round(d.y));
      v.sh.zIndex = d.y + 0.1;
      v.sh.alpha = 0.42 / (1 + z * 0.06);
      v.sh.scale.set(Math.max(0.55, 1 - z * 0.035), 1);
    }
    for (const id of Object.keys(dropViews)) {
      if (live.has(id)) continue;
      const v = dropViews[id];
      cameraC.removeChild(v.sp); v.sp.destroy();
      cameraC.removeChild(v.sh); v.sh.destroy();
      delete dropViews[id];
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
      st.sp.y = (st.spBase || 0) + 1; st.sqTtl = 4;
      const p = new PIXI.Sprite(dotTex);
      p.zIndex = st.def.y + 1;
      cameraC.addChild(p);
      particles.push({
        sp: p, x: midX(st.def) - 3 + Math.random() * 8, y: st.def.y - 32,
        vy: -0.8, ttl: 18,
      });
    }
  }

  // the middle of whatever a place is: a body, a pad, a vein. Everything that
  // points at a place — the caption's sparks, the socket marker, the walk
  // that decides which place you are standing at — reads it from here, so a
  // kind three tiles across is docked at and lit up on its own centre line.
  const midX = (def) => def.x + ((def.bw || 26) >> 1);
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
    floats.push({ t, ttl: 60, wx: midX(def), wy: def.y - 44 });
    labelsC.addChild(t);
    spawnSparks(midX(def), def.y - 22, 5, parseInt(css.slice(1), 16));
  }
  function stamp() {
    const def = posOf(dockedId);
    if (def) spawnSparks(midX(def), def.y - 26, 6, 0xffe08a);
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
        // the base blocks, never the tower: the operator squeezes behind a
        // machine as before, and a wider kind blocks a wider base
        if (px > d.x - 3 && px < d.x + (d.bw || 26) + 3 && py > d.y - 14 && py < d.y + 2) return true;
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
      if (walkClock > 4) { walkClock = 0; walkFrame = (walkFrame + 1) % charTex[facing].length; }
      idleClock = 0; idleFrame = 0;          // he starts breathing again from rest
    } else {
      walkFrame = 0;
      // the breath is four times slower than the walk, so standing still
      // reads as standing still and not as a second, shorter walk
      idleClock += dt;
      if (idleClock > 16) { idleClock = 0; idleFrame = (idleFrame + 1) % idleTex[facing].length; }
    }
    if (workTtl > 0) workTtl -= dt;
    // `moving` above is the held keys; walking is whether they moved him
    const walking = vx !== 0 || vy !== 0;
    if (working && dockedId) {
      workClock += dt;
      player.texture = charTex.work[Math.floor(workClock / 8) % charTex.work.length];
      player.scale.x = 1;
    } else {
      player.texture = walking ? charTex[facing][walkFrame] : idleTex[facing][idleFrame];
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
      if (s.def.kind === 'belt') continue;          // a run yields to anything else in reach
      const dx = playerX - midX(s.def);
      const dy = playerY - (s.def.y + 6);
      const d = Math.hypot(dx, dy);
      if (d < DOCK_RANGE && d < bestD) { best = s.def.id; bestD = d; }
    }
    // nothing else claims you: the run you are standing on does
    const onRun = best ? null : beltsUnderfoot();
    if (onRun) best = beltDock(onRun.tx, onRun.ty, onRun.ids);
    else if (beltDockId) clearBeltDock();
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
          // the good's own sprite, the same one the bag shows. The head of a
          // run is delivered and the rest shift down a place, so the material
          // under a given sprite changes — swap the texture when it does.
          const g = new PIXI.Sprite(PIXELS.matTex('az'));
          v.itemsC.addChild(g);
          v.items.push({ g, mat: 'az' });
        }
        while (v.items.length > b.items.length) { const it = v.items.pop(); v.itemsC.removeChild(it.g); it.g.destroy(); }
        b.items.forEach((it, i) => {
          const sp = v.items[i];
          const [px, py] = pathPos(v.geo, it.pos);
          sp.g.position.set(Math.round(px) - HALF_MAT, Math.round(py) - HALF_MAT);
          if (sp.mat !== it.mat) { sp.mat = it.mat; sp.g.texture = PIXELS.matTex(it.mat); }
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
        const t = band(lookOf(s.def.kind, s.auto), mode, SIM.facingOf(s.def.m))[mode === 'work' ? wf : mode === 'idle' ? idf : 0];
        if (s.sp.texture !== t) s.sp.texture = t;
      }
    }
    for (const s of Object.values(stations)) {
      if (s.sqTtl > 0) { s.sqTtl--; if (s.sqTtl <= 0) s.sp.y = s.spBase || 0; }
    }

    if (chargeG) chargeG.clear();
    if (chargeVal !== null) {
      if (!chargeG) {
        chargeG = new PIXI.Graphics();
        chargeG.zIndex = 6000;
        cameraC.addChild(chargeG);
      }
      // hung off the sprite's own height, so it stays clear of his head
      // whenever the operator is redrawn taller or shorter
      const bx = Math.round(playerX) - 8, by = Math.round(playerY) - PIXELS.CHAR_H - 5;
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
    // smoke: it rises, opens out through its four frames and thins away.
    // They start a beat apart so a body comes apart in a roll rather than
    // all at once. A puff marked `rev` runs the same numbers the other way
    // — it sinks, tightens back down its frames and is gone by the time the
    // body it gathered into is standing — so building and destroying share
    // one loop and cannot drift apart.
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.sp.visible = true;
      p.t += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = Math.min(0.999, p.t / p.life);
      const f = p.rev ? PIXELS.PUFF_FRAMES - 1 - Math.floor(k * PIXELS.PUFF_FRAMES) : Math.floor(k * PIXELS.PUFF_FRAMES);
      if (p.frame !== f) { p.frame = f; p.sp.texture = PIXELS.puffTex(f); }
      p.sp.position.set(Math.round(p.x), Math.round(p.y));
      // coming apart it is opaque at once and thins out; coming together it
      // has to arrive from nothing, so it fades up fast and off at the end
      p.sp.alpha = 0.85 * (p.rev ? Math.min(1, k / 0.16) * Math.min(1, (1 - k) / 0.35) : 1 - k);
      if (p.t >= p.life) { cameraC.removeChild(p.sp); p.sp.destroy(); puffs.splice(i, 1); }
    }
    // a body settling out of that smoke: down the last few pixels, opaque
    // almost at once, hot for the first beat
    for (let i = builds.length - 1; i >= 0; i--) {
      const b = builds[i];
      if (b.sp.destroyed) { builds.splice(i, 1); continue; }
      if (b.delay > 0) { b.delay -= dt; continue; }
      b.sp.visible = true;
      b.t += dt;
      const k = Math.min(1, b.t / b.life);
      b.sp.y = Math.round(b.base - 7 * (1 - k) * (1 - k));
      b.sp.alpha = Math.min(1, k * 2.4);
      b.sp.tint = k < 0.45 ? 0xfff0c4 : 0xffffff;
      if (k >= 1) { b.sp.y = b.base; b.sp.alpha = 1; b.sp.tint = 0xffffff; builds.splice(i, 1); }
    }
    tickHud(dt);
    syncDrops();
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.vy += p.g * dt;
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
    init, loadMap, buildWorld, setMove, castLetter, floatText, stamp, getDocked, posOf, poof, materialize, siteOf,
    // the burst a good makes as it leaves the world for the bag, or as a
    // price leaves the bag for a site
    sparkle: (wx, wy, n, tint, ring) => { if (ready) spawnSparks(wx, wy, n, tint, ring); },
    playerPos: () => ({ x: playerX, y: playerY }),
    // the way the operator faces, as a world side — the build ghost stands ahead
    playerDir: () => (facing === 'down' ? 's' : facing === 'up' ? 'n' : faceSign > 0 ? 'e' : 'w'),
    scale: () => S,                    // device px per world px, so the DOM can match the canvas
    screenPos, setDockGlow, showInfo, clearInfo, showMenu, clearMenu, setAutoLook,
    routeBelt, beltReaches, machinePorts, portsOpen, showGhost, clearGhost, setSpool, markStations, setSocketTarget,
    showBuildGhost, clearBuildGhost,
    setInvValue, invScreenPos, setHudKeys, setCharge, pulseInv,
    onDock: null,
  };
})();
