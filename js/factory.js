// The overworld, now in two dimensions: a floor-plan hall the typesetter walks
// with all four arrows. Belts run in L-shaped paths; stations depth-sort with
// the player. Walking IS the menu. Global namespace: FACTORY
//
// One pixel grid, no exceptions: the canvas upscales by a whole number of
// device pixels (letterboxed), every sprite renders at integer world
// coordinates, and all in-world text is the bitmap pixel font.
(function () {
  'use strict';

  // The viewport is dynamic: it fills the mount at the LARGEST integer zoom
  // that still shows a useful slice of the world (≥ MIN_VW × MIN_VH world px).
  // Bigger window → bigger pixels first, then more world.
  const MIN_VW = 300, MIN_VH = 170;
  let viewW = 430, viewH = 230;        // world pixels currently visible
  const FLOOR_TOP = 48;                // player's north limit (the treeline)
  const DOCK_RANGE = 20;
  const SPEED = 1.35;

  let app, cameraC, labelsC, ready = false;
  let mountEl = null;
  let S = 2;                           // device px per world px — integer, set by resize()
  let stations = {};
  let beltsDrawn = [];                 // {fromId, path:[{x,y}...], c(container)}
  let player = null;
  const charTex = { down: [], up: [], side: [], work: [] };
  let facing = 'side', faceSign = 1, walkClock = 0, walkFrame = 0;
  let workTtl = 0, workClock = 0;
  let playerX = 40, playerY = 90;
  const moving = { left: false, right: false, up: false, down: false };
  let dockedId = null;
  let pressBurst = 0, frameClock = 0, frameIdx = 0;
  let beltTexes = [], pressTexes = [], dotTex = null;
  const particles = [], floats = [], dots = [], flashes = [], sparks = [], scraps = [];
  const petals = [], ambient = [], waterSprites = [];
  const machineTexCache = {};
  // in-canvas pixel HUD (inventory) + the hold-to-interact charge bar
  let uiC = null;
  const hudRows = {}, invValues = {};
  const HUD_KEYS = ['money', 'az', 'buki', 'vedi', 'slogi', 'slova', 'stroki', 'listy'];
  const HUD_W = 46, HUD_ROW = 14;
  let chargeVal = null, chargeG = null;

  function texFor(tier) {
    if (!machineTexCache[tier]) machineTexCache[tier] = [0, 1, 2, 3].map((f) => PIXELS.machineTex(tier, f));
    return machineTexCache[tier];
  }
  const cssColor = (c) => typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c;

  // integer upscale in device pixels; the mount letterboxes any remainder
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

  // ---------- the pixel HUD: inventory in-canvas, icons + numbers only ----------
  function layoutHud() {
    if (!uiC) return;
    uiC.scale.set(S);
    uiC.position.set((viewW - HUD_W - 2) * S, 2 * S);
  }
  function buildHud() {
    uiC = new PIXI.Container();
    app.stage.addChild(uiC);
    const panel = new PIXI.Graphics()
      .rect(0, 0, HUD_W, HUD_KEYS.length * HUD_ROW + 5)
      .fill({ color: 0x221d29, alpha: 0.74 });
    uiC.addChild(panel);
    HUD_KEYS.forEach((k, i) => {
      const ic = new PIXI.Sprite(PIXELS.matIconTex(k));
      ic.position.set(3, 3 + i * HUD_ROW);
      uiC.addChild(ic);
      const t = new PIXI.Sprite(PIXELS.textTex(String(invValues[k] || 0), PIXELS.P.paper));
      t.position.set(HUD_W - 3 - t.texture.width, 6 + i * HUD_ROW);
      uiC.addChild(t);
      hudRows[k] = t;
    });
    layoutHud();
  }
  function setInvValue(key, n) {
    invValues[key] = n;
    const t = hudRows[key];
    if (!t) return;
    t.texture = PIXELS.textTex(String(n), PIXELS.P.paper);
    t.position.x = HUD_W - 3 - t.texture.width;
  }
  // canvas-space position of a HUD row (for the DOM fly-to-inventory)
  function invScreenPos(key) {
    const t = hudRows[key];
    if (!t) return null;
    return t.getGlobalPosition();
  }
  function setCharge(p) { chargeVal = p; }

  // set dressing — cosmetic, walk-through
  const PROPS = [
    { kind: 'lamppost', x: 62, y: 78, glow: true },
    { kind: 'lamppost', x: 230, y: 128, glow: true },
    { kind: 'lamppost', x: 420, y: 108, glow: true },
    { kind: 'crate', x: 482, y: 156 },
    { kind: 'crate2', x: 492, y: 168 },
    { kind: 'drum', x: 18, y: 150 },
    { kind: 'bush', x: 186, y: 84 },
    { kind: 'bush', x: 498, y: 204 },
    { kind: 'sign', x: 12, y: 126 },
  ];

  function addGlow(wx, wy, base) {
    const g = new PIXI.Sprite(PIXELS.glowHaloTex());
    g.anchor.set(0.5);
    g.position.set(wx, wy);
    g.blendMode = 'add';
    g.zIndex = -860;
    g.alpha = base;
    cameraC.addChild(g);
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

    // shell: the tilemap — grass base, dirt work-aprons, the pond, ore nodes.
    // Square 16x16 grid (PIXELS.TILE); a tile takes the terrain under its centre.
    const W = CHAIN.WORLD_W, H = CHAIN.WORLD_H, T = PIXELS.TILE;
    const dirtIn = (px, py) => CHAIN.MAP.DIRT.some((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);
    const waterIn = (px, py) => CHAIN.MAP.WATER.some((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);
    for (let ty = 0; ty < Math.ceil(H / T); ty++) {
      for (let tx = 0; tx < Math.ceil(W / T); tx++) {
        const cx = tx * T + T / 2, cy = ty * T + T / 2;
        let s;
        if (waterIn(cx, cy)) { s = new PIXI.Sprite(PIXELS.waterTex(0)); waterSprites.push(s); }
        else if (dirtIn(cx, cy)) s = new PIXI.Sprite(PIXELS.dirtTex((tx * 7 + ty * 13) % 23));
        else s = new PIXI.Sprite(PIXELS.grassTex((tx * 7 + ty * 13) % 23));
        s.position.set(tx * T, ty * T);
        s.zIndex = -1000;
        cameraC.addChild(s);
      }
    }
    // ore nodes under the mines
    for (const n of CHAIN.MAP.NODES) {
      const sp = new PIXI.Sprite(PIXELS.nodeTex(n.kind));
      sp.position.set(n.x, n.y);
      sp.zIndex = -960;
      cameraC.addChild(sp);
    }
    // wildflowers on open grass
    for (let i = 0; i < 26; i++) {
      const fx = (i * 97) % W, fy = 42 + (i * 61) % (H - 56);
      if (waterIn(fx, fy) || dirtIn(fx, fy)) continue;
      const f = new PIXI.Sprite(PIXELS.flowerTex(i));
      f.position.set(fx, fy);
      f.zIndex = -970;
      cameraC.addChild(f);
    }
    // treeline along the north edge (player can't reach past FLOOR_TOP)
    for (let i = 0; i < 23; i++) {
      const t = new PIXI.Sprite(PIXELS.sceneryTex(i % 2 ? 'tree' : 'tree2'));
      t.position.set(i * 24 + (i % 3) * 3 - 6, (i % 3) * 4 - 6);
      t.zIndex = t.y + 28;
      cameraC.addChild(t);
    }

    // set dressing; lampposts glow warmly
    for (const pr of PROPS) {
      const sp = new PIXI.Sprite(PIXELS.propTex(pr.kind));
      sp.position.set(pr.x, pr.y);
      sp.zIndex = pr.y + sp.texture.height;
      cameraC.addChild(sp);
      if (pr.glow) addGlow(pr.x + 4, pr.y + 3, 0.9);
    }

    // solid scenery shapes the walking routes — map variance
    for (const sc of CHAIN.SCENERY) {
      const sp = new PIXI.Sprite(PIXELS.sceneryTex(sc.kind));
      sp.position.set(sc.x, sc.y);
      sp.zIndex = sc.box.y + sc.box.h;
      cameraC.addChild(sp);
    }

    // petals drifting on the breeze
    for (let i = 0; i < 14; i++) {
      const m = new PIXI.Sprite(PIXELS.petalTex(0));
      m.zIndex = 4000;
      cameraC.addChild(m);
      petals.push({
        sp: m,
        x: Math.random() * W, y: 36 + Math.random() * (H - 50),
        vx: 0.05 + Math.random() * 0.08, phase: Math.random() * 6.28,
      });
    }

    beltTexes = [0, 1, 2, 3].map((f) => PIXELS.beltTex(f));
    pressTexes = [0, 1, 2, 3].map((f) => PIXELS.pressTex(f));
    dotTex = PIXELS.matDotTex();
    for (let f = 0; f < 4; f++) {
      charTex.down.push(PIXELS.characterTex('down', f));
      charTex.up.push(PIXELS.characterTex('up', f));
      charTex.side.push(PIXELS.characterTex('side', f));
    }
    charTex.work = [PIXELS.characterWorkTex(0), PIXELS.characterWorkTex(1)];

    buildHud();
    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(mountEl);

    app.ticker.add(tick);
    ready = true;
    window.FACTORY._app = app;
  }

  // icon row on a dark plate, bitmap font only. preGlyphs renders a leading
  // pixel-text chunk (e.g. '✦3' for editions).
  function iconRowAt(specObj, outMat, cx, topY, preGlyphs) {
    const row = new PIXI.Container();
    let ix = 0;
    const put = (spr, dy) => { spr.position.set(ix, dy); row.addChild(spr); };
    if (preGlyphs) {
      const t = new PIXI.Sprite(PIXELS.textTex(preGlyphs, PIXELS.P.brass3));
      put(t, 3); ix += t.texture.width + 3;
    }
    for (const [mat, n] of Object.entries(specObj || {})) {
      const ic = new PIXI.Sprite(PIXELS.matIconTex(mat));
      put(ic, 0); ix += 13;
      const cnt = new PIXI.Sprite(PIXELS.textTex(String(n), PIXELS.P.paper));
      put(cnt, 3); ix += cnt.texture.width + 3;
    }
    if (outMat) {
      const arrow = new PIXI.Sprite(PIXELS.textTex('→', PIXELS.P.brass2));
      put(arrow, 3); ix += arrow.texture.width + 3;
      const oc = new PIXI.Sprite(PIXELS.matIconTex(outMat));
      put(oc, 0); ix += 12;
    }
    const back = new PIXI.Graphics().rect(-3, -2, ix + 6, 16).fill({ color: 0x17161a, alpha: 0.7 });
    row.addChildAt(back, 0);
    row.position.set(Math.round(cx - ix / 2), topY);
    labelsC.addChild(row);
    return row;
  }

  function stationSpriteTex(def, auto) {
    if (def.kind === 'board') return PIXELS.boardTex(false);
    if (def.kind === 'bench') return texFor(auto ? 3 : 1)[0];
    if (def.kind === 'press') return pressTexes[0];
    return PIXELS.stationTex(def.kind === 'slogi' ? 'bigrams' : def.kind === 'slova' ? 'words' : 'lines');
  }

  // what Enter needs at the docked machine (automation / belt costs) —
  // shown even when unaffordable, dimmed, so the goal is always visible
  let dockInfo = null;
  function clearDockInfo() {
    if (!dockInfo) return;
    if (dockInfo.parent) dockInfo.parent.removeChild(dockInfo);
    dockInfo.destroy({ children: true });
    dockInfo = null;
  }
  function showDockInfo(stationId, spec, preGlyph, affordable) {
    clearDockInfo();
    if (!ready || !stationId || !spec) return;
    const def = CHAIN.get(stationId);
    if (!def) return;
    dockInfo = iconRowAt(spec, null, def.x + 13, def.y - 62, preGlyph);
    dockInfo.alpha = affordable ? 1 : 0.55;
  }

  // ghost preview of the pending kit on the docked plot
  let plotPreview = null;
  function clearPlotPreview() {
    if (!plotPreview) return;
    if (plotPreview.row.parent) plotPreview.row.parent.removeChild(plotPreview.row);
    plotPreview.row.destroy({ children: true });
    if (plotPreview.gh.parent) plotPreview.gh.parent.removeChild(plotPreview.gh);
    plotPreview.gh.destroy();
    plotPreview = null;
  }
  function showPlotKit(plotId, kit) {
    clearPlotPreview();
    if (!ready || !plotId || !kit) return;
    const p = CHAIN.plotById(plotId);
    if (!p) return;
    const gh = new PIXI.Sprite(stationSpriteTex(kit, false));
    gh.alpha = 0.35;
    gh.position.set(p.x, p.y - 36);
    gh.zIndex = p.y;
    cameraC.addChild(gh);
    const row = iconRowAt(kit.buildCost, kit.out, p.x + 13, p.y - 46);
    plotPreview = { row, gh };
  }

  function buildWorld(profile, names) {
    if (!ready) return;
    clearPlotPreview();
    dockInfo = null; // its container lives in labelsC, cleared below
    CHAIN.resolvePositions(profile);
    for (const s of Object.values(stations)) { cameraC.removeChild(s.root); s.root.destroy({ children: true }); }
    for (const l of labelsC.children.slice()) { labelsC.removeChild(l); l.destroy(); }
    for (const b of beltsDrawn) { cameraC.removeChild(b.c); b.c.destroy({ children: true }); }
    stations = {}; beltsDrawn = [];
    if (player) { cameraC.removeChild(player); player.destroy(); player = null; }

    // belts: L-shaped runs between wherever the two stations actually stand
    // (direction-agnostic — the player chooses plots). Both endpoints must be
    // built; an unpurchased link renders as a faint ghost of the plan.
    for (const link of CHAIN.BELTS) {
      const from = CHAIN.get(link.from), to = CHAIN.get(link.to);
      if (profile.unlockedCount < from.unlockAt || profile.unlockedCount < to.unlockAt) continue;
      if (!CHAIN.isBuilt(profile, from) || !CHAIN.isBuilt(profile, to)) continue;
      const built = !!profile.belts[CHAIN.beltKey(link)];
      const c = new PIXI.Container();
      c.zIndex = -500;
      c.alpha = built ? 1 : 0.22;
      const y0 = from.y - 10, y1 = to.y - 10;
      const x0 = from.x + 24, x1 = to.x + 1;
      const midX = x1 - 8;
      const runH = (xa, xb, y) => {
        for (let x = Math.min(xa, xb); x < Math.max(xa, xb); x += 12) {
          const seg = new PIXI.Sprite(beltTexes[0]);
          seg.position.set(x, y);
          c.addChild(seg);
        }
      };
      const runV = (xc, ya, yb) => {
        for (let y = Math.min(ya, yb); y < Math.max(ya, yb); y += 12) {
          const seg = new PIXI.Sprite(beltTexes[0]);
          seg.rotation = Math.PI / 2;
          seg.position.set(xc + 8, y);
          c.addChild(seg);
        }
      };
      runH(x0, midX, y0);
      runV(midX, y0, y1);
      runH(midX, x1 + 6, y1);
      cameraC.addChild(c);
      beltsDrawn.push({
        fromId: link.from, c, built,
        path: [{ x: x0, y: y0 + 2 }, { x: midX + 4, y: y0 + 2 }, { x: midX + 4, y: y1 + 2 }, { x: x1 + 4, y: y1 + 2 }],
      });
    }

    for (const def of CHAIN.STATIONS) {
      // kit stations don't exist until the player erects them on a chosen plot
      if (def.buildCost && !CHAIN.isBuilt(profile, def)) continue;
      const locked = profile.unlockedCount < def.unlockAt;
      const auto = !!profile.autoBench[def.id];
      const root = new PIXI.Container();
      let sp;
      if (def.kind === 'board') sp = new PIXI.Sprite(PIXELS.boardTex(CHAIN.canDeliver(profile)));
      else sp = new PIXI.Sprite(stationSpriteTex(def, auto));
      root.addChild(sp);
      if (locked) sp.tint = 0x4a4a58;

      // icon row above the station: recipe → output; the board shows the
      // current milestone (goal → reward, or ✦N for an edition benchmark).
      if (!locked) {
        if (def.kind === 'board') {
          const m = CHAIN.currentMilestone(profile);
          if (!m) iconRowAt(null, null, def.x + 13, def.y - 46, '✦');
          else if (m.edition) iconRowAt(null, 'listy', def.x + 13, def.y - 46, '✦' + m.lines);
          else iconRowAt(m.goal, CHAIN.get(m.reward).out, def.x + 13, def.y - 46);
        } else if (def.tier === 1) iconRowAt(null, def.out, def.x + 13, def.y - 46);
        else iconRowAt(def.recipe, def.out, def.x + 13, def.y - 46);
      }

      const glow = new PIXI.Graphics().rect(0, 36, 26, 2).fill(0xc9a24a);
      glow.visible = false;
      root.addChild(glow);
      root.position.set(def.x, def.y - 36);
      root.zIndex = def.y;
      cameraC.addChild(root);
      stations[def.id] = { def, root, sp, glow, locked, auto, built: true, sqTtl: 0 };
    }

    // free plots: surveyed markers, dockable; they pulse while a kit awaits
    const kit = CHAIN.pendingKit(profile);
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
      stations['plot:' + p.id] = {
        def: { id: 'plot:' + p.id, x: p.x, y: p.y, kind: 'plot' },
        root, sp, glow, locked: false, auto: false, built: false, sqTtl: 0,
        glowRect: { x: 0, y: 15, w: 30, h: 2 },
        plotPulse: !!kit,
      };
      sp.alpha = kit ? 1 : 0.75;
    }

    player = new PIXI.Sprite(charTex.side[0]);
    player.anchor.set(0.5, 1);
    player.position.set(Math.round(playerX), Math.round(playerY));
    cameraC.addChild(player);
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
    st.sp.tint = ok ? 0xffe9a0 : 0xff8a70;
    flashes.push({ sp: st.sp, ttl: 6, locked: st.locked });
    workTtl = 50; // the typesetter leans into the case
    if (ok) {
      st.sp.y = 1; st.sqTtl = 4; // 1px cast dip
      const p = new PIXI.Sprite(dotTex);
      p.zIndex = st.def.y + 1;
      cameraC.addChild(p);
      particles.push({
        sp: p, x: st.def.x + 10 + Math.random() * 8, y: st.def.y - 32,
        vy: -0.8, ttl: 18,
      });
    }
  }

  function floatText(text, stationId, color) {
    if (!ready) return;
    const def = CHAIN.get(stationId || dockedId || 'az');
    if (!def) return;
    const css = cssColor(color || 0xeacc78);
    const t = new PIXI.Sprite(PIXELS.textTex(text, css));
    floats.push({ t, ttl: 60, wx: def.x + 13, wy: def.y - 44 });
    labelsC.addChild(t);
    // low fountain arc — stays below the icon plate where it can be seen
    spawnSparks(def.x + 13, def.y - 22, 5, parseInt(css.slice(1), 16));
  }

  function stamp() {
    pressBurst = 16;
    // printed sheets flutter off the press
    const def = CHAIN.get('press');
    for (let i = 0; i < 3; i++) {
      const sp = new PIXI.Sprite(PIXELS.paperScrapTex(0));
      sp.zIndex = def.y + 2;
      cameraC.addChild(sp);
      scraps.push({
        sp, x: def.x + 8 + Math.random() * 26, y: def.y - 30 - Math.random() * 6,
        vy: 0.2 + Math.random() * 0.14, phase: Math.random() * 6.28, clock: 0, ttl: 70,
      });
    }
  }

  function beltDot(fromId) {
    if (!ready) return;
    const belt = beltsDrawn.find((b) => b.fromId === fromId);
    if (!belt) return;
    const p = new PIXI.Sprite(dotTex);
    p.zIndex = -400;
    cameraC.addChild(p);
    dots.push({ sp: p, x: belt.path[0].x, y: belt.path[0].y, path: belt.path, seg: 0, v: 1.6 });
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
    // built machines and scenery are solid; plot markers are walk-through
    const collides = (px, py) => {
      for (const s of Object.values(stations)) {
        if (!s.built || s.locked) continue;
        const d = s.def;
        if (px > d.x - 3 && px < d.x + 29 && py > d.y - 14 && py < d.y + 2) return true;
      }
      for (const sc of CHAIN.SCENERY) {
        const b = sc.box;
        if (px > b.x - 3 && px < b.x + b.w + 3 && py > b.y - 3 && py < b.y + b.h + 3) return true;
      }
      for (const r of CHAIN.MAP.WATER) {
        if (px > r.x - 2 && px < r.x + r.w + 2 && py > r.y - 3 && py < r.y + r.h + 2) return true;
      }
      return false;
    };
    if (vx !== 0 || vy !== 0) {
      workTtl = 0;
      facing = Math.abs(vy) > Math.abs(vx) ? (vy < 0 ? 'up' : 'down') : 'side';
      if (vx !== 0) faceSign = vx > 0 ? 1 : -1;
      const nx = Math.max(8, Math.min(CHAIN.WORLD_W - 8, playerX + vx * dt));
      if (!collides(nx, playerY)) playerX = nx;
      const ny = Math.max(FLOOR_TOP, Math.min(CHAIN.WORLD_H - 6, playerY + vy * dt));
      if (!collides(playerX, ny)) playerY = ny;
      walkClock += dt;
      if (walkClock > 7) { walkClock = 0; walkFrame = (walkFrame + 1) % 4; }
    } else {
      walkFrame = 0;
    }
    if (workTtl > 0 && dockedId) {
      workTtl -= dt;
      workClock += dt;
      player.texture = charTex.work[Math.floor(workClock / 10) % 2];
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
    // camera locks to whole world pixels — the grid never shimmers
    cameraC.position.set(-Math.round(camX) * S, -Math.round(camY) * S);
    labelsC.position.set(-Math.round(camX) * S, -Math.round(camY) * S);

    // docking: 2D proximity to the station's work spot (front-center)
    let best = null, bestD = 1e9;
    for (const s of Object.values(stations)) {
      if (s.locked) continue;
      const dx = playerX - (s.def.x + 13);
      const dy = playerY - (s.def.y + 6);
      const d = Math.hypot(dx, dy);
      if (d < DOCK_RANGE && d < bestD) { best = s.def.id; bestD = d; }
    }
    if (best !== dockedId) {
      dockedId = best;
      if (!dockedId) workTtl = 0;
      for (const s of Object.values(stations)) s.glow.visible = s.def.id === dockedId;
      if (window.FACTORY.onDock) window.FACTORY.onDock(dockedId);
    }

    frameClock++;
    if (frameClock % 9 === 0) {
      frameIdx = (frameIdx + 1) % 4;
      for (const s of Object.values(stations)) {
        if (s.def.kind === 'bench' && s.auto) s.sp.texture = texFor(3)[frameIdx];
        // the drill spins while the operator works the mine
        if (s.def.kind === 'bench' && !s.auto) s.sp.texture = texFor(1)[(s.def.id === dockedId && workTtl > 0) ? frameIdx : 0];
        if (s.def.kind === 'press' && pressBurst <= 0) s.sp.texture = pressTexes[frameIdx];
      }
      for (const b of beltsDrawn) {
        if (b.built && stations[b.fromId] && stations[b.fromId].auto) {
          for (const seg of b.c.children) seg.texture = beltTexes[frameIdx];
        }
      }
    }
    if (pressBurst > 0) {
      pressBurst--;
      const pr = stations.press;
      if (pr) pr.sp.texture = pressTexes[(pressBurst >> 1) % 4];
    }

    // 1px cast squash recovers; kit-pending plot markers pulse
    for (const s of Object.values(stations)) {
      if (s.sqTtl > 0) { s.sqTtl--; if (s.sqTtl <= 0) s.sp.y = 0; }
      if (s.plotPulse) s.sp.alpha = 0.75 + 0.25 * Math.sin(frameClock * 0.12);
    }

    // the hold-to-interact charge bar over the operator's head
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

    // lamppost glow breathes; water shimmers
    for (const a of ambient) {
      a.sp.alpha = a.base * (0.75 + 0.25 * Math.sin(frameClock * 0.05 + a.phase));
    }
    if (frameClock % 26 === 0 && waterSprites.length) {
      const wt = PIXELS.waterTex(Math.floor(frameClock / 26) % 2);
      for (const s of waterSprites) s.texture = wt;
    }
    // petals drift and flutter
    for (const m of petals) {
      m.x += m.vx * dt;
      m.y += 0.05 * dt;
      if (m.x > CHAIN.WORLD_W) m.x = 0;
      if (m.y > CHAIN.WORLD_H) m.y = 36;
      const wob = Math.sin(frameClock * 0.03 + m.phase);
      m.sp.texture = PIXELS.petalTex(Math.abs(Math.floor(frameClock / 14 + m.phase)) % 2);
      m.sp.position.set(Math.round(m.x + wob * 2), Math.round(m.y));
      m.sp.alpha = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(frameClock * 0.02 + m.phase * 2));
    }

    for (let i = flashes.length - 1; i >= 0; i--) {
      if (--flashes[i].ttl <= 0) { flashes[i].sp.tint = flashes[i].locked ? 0x4a4a58 : 0xffffff; flashes.splice(i, 1); }
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
    for (let i = scraps.length - 1; i >= 0; i--) {
      const p = scraps[i];
      p.clock += dt;
      p.y += p.vy * dt;
      p.sp.texture = PIXELS.paperScrapTex(Math.floor(p.clock / 12) % 2);
      p.sp.position.set(Math.round(p.x + Math.sin(p.clock * 0.15 + p.phase) * 3), Math.round(p.y));
      p.ttl -= dt;
      if (p.ttl < 15) p.sp.alpha = p.ttl / 15;
      if (p.ttl <= 0) { cameraC.removeChild(p.sp); p.sp.destroy(); scraps.splice(i, 1); }
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.wy -= 0.16 * dt;
      f.t.position.set(Math.round(f.wx - f.t.texture.width / 2), Math.round(f.wy));
      f.t.alpha = Math.min(1, f.ttl / 25);
      if ((f.ttl -= dt) <= 0) { labelsC.removeChild(f.t); f.t.destroy(); floats.splice(i, 1); }
    }
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      const target = d.path[d.seg + 1];
      if (!target) { cameraC.removeChild(d.sp); d.sp.destroy(); dots.splice(i, 1); continue; }
      const ddx = target.x - d.x, ddy = target.y - d.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist < d.v * dt) { d.x = target.x; d.y = target.y; d.seg++; }
      else { d.x += (ddx / dist) * d.v * dt; d.y += (ddy / dist) * d.v * dt; }
      d.sp.position.set(Math.round(d.x), Math.round(d.y));
    }
  }

  // canvas-space pixel position for a world point (for DOM fly-to-inventory)
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
    init, buildWorld, setMove, castLetter, floatText, stamp, beltDot, getDocked,
    screenPos, setDockGlow, showPlotKit, showDockInfo,
    setInvValue, invScreenPos, setCharge,
    onDock: null,
  };
})();
