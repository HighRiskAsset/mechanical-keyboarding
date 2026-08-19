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
  let frameClock = 0, frameIdx = 0;
  let dotTex = null;
  const particles = [], floats = [], flashes = [], sparks = [];
  const petals = [];
  let ambient = [], waterSprites = [], terrain = [];
  let waterTexes = [];
  let grid = null;
  let crossSprites = [], openRects = [], closedRects = [];
  const machineTexCache = {};
  // in-canvas pixel HUD (the bag) + the hold-to-interact charge bar
  let uiC = null, hudPanel = null;
  let hudRows = {}, hudKeys = [];
  const invValues = {};
  const HUD_W = 46, HUD_ROW = 14;
  let chargeVal = null, chargeG = null;

  function texFor(tier) {
    if (!machineTexCache[tier]) machineTexCache[tier] = [0, 1, 2, 3].map((f) => PIXELS.machineTex(tier, f));
    return machineTexCache[tier];
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
  function setCharge(p) { chargeVal = p; }

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
    for (let f = 0; f < 4; f++) {
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
  function clearInfo() {
    for (const r of infoRows) { if (r.parent) r.parent.removeChild(r); r.destroy({ children: true }); }
    infoRows = [];
  }
  function showInfo(dockId, rows) {
    clearInfo();
    if (!ready || !dockId || !rows || !rows.length) return;
    const st = stations[dockId];
    if (!st) return;
    const cx = st.def.x + 13;
    let y = st.def.y - 46 - (rows.length - 1) * 16;
    for (const row of rows) {
      const c = rowContainer(row);
      const back = new PIXI.Graphics().rect(-3, -2, c._w + 6, 16).fill({ color: 0x17161a, alpha: 0.7 });
      c.addChildAt(back, 0);
      c.position.set(Math.round(cx - c._w / 2), y);
      c.alpha = row.enabled === false ? 0.5 : 1;
      labelsC.addChild(c);
      infoRows.push(c);
      y += 16;
    }
  }
  // the place menu: a panel of rows with a highlighted selection
  let menuC = null;
  function clearMenu() {
    if (!menuC) return;
    if (menuC.parent) menuC.parent.removeChild(menuC);
    menuC.destroy({ children: true });
    menuC = null;
  }
  function showMenu(dockId, rows, sel) {
    clearMenu();
    if (!ready || !dockId || !rows || !rows.length) return;
    const st = stations[dockId];
    if (!st) return;
    menuC = new PIXI.Container();
    const built = rows.map((r) => rowContainer(r));
    const w = Math.max(...built.map((c) => c._w)) + 10;
    const h = rows.length * 16 + 6;
    const cx = st.def.x + 13;
    let px = Math.round(cx - w / 2), py = st.def.y - 50 - h;
    px = Math.max(2, Math.min(CHAIN.WORLD_W - w - 2, px));
    if (py < 4) py = st.def.y + 8;
    const panel = new PIXI.Graphics()
      .rect(0, 0, w, h).fill({ color: 0x17161a, alpha: 0.9 })
      .rect(0, 0, w, 1).fill(0xc9a24a).rect(0, h - 1, w, 1).fill(0xc9a24a);
    menuC.addChild(panel);
    built.forEach((c, i) => {
      if (i === sel) {
        const hl = new PIXI.Graphics().rect(2, 3 + i * 16, w - 4, 14).fill({ color: 0xf2c14e, alpha: rows[i].enabled === false ? 0.18 : 0.35 });
        menuC.addChild(hl);
      }
      c.position.set(5, 4 + i * 16);
      c.alpha = rows[i].enabled === false ? 0.5 : 1;
      menuC.addChild(c);
    });
    menuC.position.set(px, py);
    labelsC.addChild(menuC);
  }

  function stationSpriteTex(m) {
    if (m.kind === 'mine') return texFor(m.autoLive ? 3 : 1)[0];
    if (m.kind === 'smelter') return PIXELS.stationTex('bigrams');
    if (m.kind === 'foundry') return PIXELS.stationTex('foundry');
    if (m.kind === 'constructor') return PIXELS.stationTex('words');
    return PIXELS.stationTex('lines');
  }

  // Build the world from the save: machines on plots and nodes, free plots,
  // unbuilt nodes, crossings. `autoLive(m)` says whether a machine is running
  // by itself right now (⚙ bought and its letters sticky).
  function buildWorld(profile, autoLive) {
    if (!ready) return;
    clearInfo(); clearMenu();
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
      root.position.set(pos.x, pos.y - 36);
      root.zIndex = pos.y;
      cameraC.addChild(root);
      const id = 'm:' + m.id;
      stations[id] = { def: { id, x: pos.x, y: pos.y, kind: m.kind, m }, root, sp, glow, built: true, auto: live, sqTtl: 0 };
    }
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
    st.sp.texture = texFor(live ? 3 : 1)[0];
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

  function tick(ticker) {
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
      if (walkClock > 7) { walkClock = 0; walkFrame = (walkFrame + 1) % 4; }
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

    frameClock++;
    if (frameClock % 9 === 0) {
      frameIdx = (frameIdx + 1) % 4;
      for (const s of Object.values(stations)) {
        if (s.def.kind !== 'mine') continue;
        if (s.auto) s.sp.texture = texFor(3)[frameIdx];
        else s.sp.texture = texFor(1)[(s.def.id === dockedId && workTtl > 0) ? frameIdx : 0];
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
        .rect(bx + 1, by + 1, Math.round(14 * Math.min(1, chargeVal)), 2).fill(0xf2c14e);
    }

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
    setInvValue, invScreenPos, setHudKeys, setCharge,
    onDock: null,
  };
})();
