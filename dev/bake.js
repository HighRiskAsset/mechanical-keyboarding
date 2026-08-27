// The sheet baker. Renders every sprite the game shows, from the generator
// in dev/gen/, into PNG sheets + JSON manifests, and POSTs them through the
// dev server's /upload. Open dev/bake.html; it lands in assets/inbox unless
// the page is opened with ?to=sprites, which writes assets/sprites directly
// (the first bake, and deliberate re-bakes only: artist files live there).
//
// Sheets are shelf-packed left to right; a manifest entry is {x,y,w,h,n}
// with n frames laid horizontally, each w wide. dev/bake.js and js/sprites.js
// (plus crossKey in js/tiles.js) share these naming conventions; change them
// in step or not at all.
(function () {
  'use strict';

  const TARGET = new URLSearchParams(location.search).get('to') === 'sprites' ? 'sprites' : 'inbox';
  const SHEET_W = 512;
  const logEl = document.getElementById('log');
  const show = document.getElementById('sheets');
  const log = (s) => { logEl.textContent += s + '\n'; };

  function flipC(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }

  // ---------- one sheet: add anims, shelf-pack, upload ----------
  function builder(name) {
    const anims = [];
    return {
      name,
      add(key, frames, opts) {
        const list = Array.isArray(frames) ? frames : [frames];
        if (!list.length || list.some((c) => !c)) throw new Error(name + ':' + key + ' has empty frames');
        const w = list[0].width, h = list[0].height;
        if (list.some((c) => c.width !== w || c.height !== h)) throw new Error(name + ':' + key + ' frames differ in size');
        anims.push({ key, list, w, h, opts: opts || {} });
      },
      pack() {
        let x = 0, y = 0, shelfH = 0, maxW = 0;
        const sprites = {};
        for (const a of anims) {
          const bw = a.w * a.list.length;
          if (x > 0 && x + bw > SHEET_W) { y += shelfH; x = 0; shelfH = 0; }
          a.x = x; a.y = y;
          x += bw; shelfH = Math.max(shelfH, a.h); maxW = Math.max(maxW, a.x + bw);
        }
        y += shelfH;
        const c = document.createElement('canvas');
        c.width = Math.max(1, maxW); c.height = Math.max(1, y);
        const ctx = c.getContext('2d');
        for (const a of anims) {
          a.list.forEach((f, i) => ctx.drawImage(f, a.x + i * a.w, a.y));
          sprites[a.key] = Object.assign({ x: a.x, y: a.y, w: a.w, h: a.h }, a.list.length > 1 ? { n: a.list.length } : {}, a.opts);
        }
        return { canvas: c, manifest: { image: name + '.png', sprites } };
      },
    };
  }

  const toBlob = (c) => new Promise((res) => c.toBlob(res, 'image/png'));
  async function put(fname, blob) {
    const r = await fetch('/upload?name=' + encodeURIComponent(fname) + '&dir=' + TARGET, { method: 'POST', body: blob });
    log('  ' + fname + ': ' + r.status + ' ' + await r.text());
  }
  async function bakeSheet(b) {
    const { canvas: c, manifest } = b.pack();
    const label = document.createElement('div');
    label.textContent = b.name + '.png (' + c.width + 'x' + c.height + ')';
    show.appendChild(label);
    show.appendChild(c);
    await put(b.name + '.png', await toBlob(c));
    await put(b.name + '.json', new Blob([JSON.stringify(manifest, null, 1)], { type: 'application/json' }));
  }

  // ---------- enumerations off the live data ----------
  const MAPS = Object.values(window.MAPKIT.MAPS);
  const STYLES = TILES.STYLE_IDS;                       // tan grey violet snow drift
  const LOOKS = ['bigrams', 'foundry', 'words', 'molder', 'lines', 'fastener', 'crane', 'manufacturer'];
  const FACINGS = ['s', 'n', 'e', 'w'];
  const MODES = [['work', PIXELS.WORK_FRAMES], ['idle', PIXELS.IDLE_FRAMES], ['still', 1]];
  const GROUND_VARIANTS = 4;

  async function bakeAll() {
    const sheetNames = [];
    const run = async (b) => { sheetNames.push(b.name); await bakeSheet(b); };

    // ---- ground: 4 static variants per kind; water's variants animate ----
    {
      const b = builder('ground');
      for (const kind of TILES.KIND_IDS) {
        for (let v = 0; v < GROUND_VARIANTS; v++) {
          if (kind === 'water') b.add('water.' + v, [TILES.fill('water', v, 0), TILES.fill('water', v, 1)], { clock: 'water' });
          else b.add(kind + '.' + v, TILES.fill(kind, v));
        }
      }
      await run(b);
    }

    // ---- cliffs: one cell per (style, conn bits, high bits) ----
    {
      const b = builder('cliffs');
      for (const style of STYLES) {
        for (let conn = 0; conn < 16; conn++) {
          for (let high = 0; high < 16; high++) {
            if (conn & high) continue;                 // a side is conn OR high, never both
            b.add('c.' + style + '.' + conn + '.' + high, TILES.cliff(conn, high, style, null, 0));
          }
        }
      }
      await run(b);
    }

    // ---- stairs and side ramps ----
    {
      const b = builder('stairs');
      for (const part of ['top', 'bot']) for (const style of STYLES) for (const rails of [0, 2, 8, 10]) {
        b.add('st.' + part + '.' + style + '.' + rails, TILES.stairs(part, style, rails, 0));
      }
      await run(b);
    }
    {
      const b = builder('slopes');
      for (const side of ['W', 'E']) for (const style of STYLES) for (const ends of [0, 1, 4, 5]) {
        b.add('sl.' + side + '.' + style + '.' + ends, TILES.slope(side, style, 0, 'none', ends));
      }
      await run(b);
    }

    // ---- crossings: every configuration the shipped maps use ----
    {
      const b = builder('crossings');
      const seen = new Set();
      for (const m of MAPS) {
        for (const cr of (m.MAP.CROSSINGS || [])) {
          const w = cr.w / 16, h = cr.h / 16, dir = cr.dir === 'v' ? 'v' : 'h';
          if (cr.kind === 'bridge' || cr.kind === 'boardwalk') {
            for (const open of [true, false]) {
              const key = 'x.' + cr.kind + '.' + w + 'x' + h + '.' + dir + '.' + (open ? 'o' : 'c');
              if (seen.has(key)) continue;
              seen.add(key);
              const art = TILES.crossing(cr.kind, w, h, open, cr.style, 0, cr.dir);
              b.add(key, art.c, { dx: art.dx || 0, dy: art.dy || 0 });
            }
          } else {
            const styleKey = cr.kind === 'drift' ? 'drift' : (cr.style || 'tan');
            const key = 'x.' + cr.kind + '.' + w + 'x' + h + '.' + styleKey;
            if (seen.has(key)) continue;
            seen.add(key);
            const art = TILES.crossing(cr.kind, w, h, false, cr.style, 0, cr.dir);
            b.add(key, art.c, { dx: art.dx || 0, dy: art.dy || 0 });
          }
        }
      }
      await run(b);
    }

    // ---- scenery: region sets + the meadow set + flowers ----
    {
      const b = builder('scenery');
      const kinds = new Set(['tree', 'tree2', 'rock', 'rock2']);
      for (const m of MAPS) {
        for (const rg of (m.MAP.REGIONS || [])) for (const k of (rg.treeline || [])) kinds.add(k);
        for (const sc of (m.SCENERY || [])) kinds.add(sc.kind);
      }
      for (const k of kinds) {
        try { b.add(k, PIXELS.sceneryCanvas(k)); }
        catch (e) { log('  scenery skipped ' + k + ': ' + e.message); }
      }
      for (let s = 0; s < 4; s++) b.add('flower.' + s, PIXELS.flowerCanvas(s));
      await run(b);
    }

    // ---- ore veins, both seatings ----
    {
      const b = builder('veins');
      const kinds = new Set(['iron', 'copper', 'stone', 'quartz', 'coal', 'oil', 'titan']);
      for (const m of MAPS) for (const n of (m.MAP.NODES || [])) kinds.add(n.kind);
      for (const k of kinds) {
        b.add('vein.' + k + '.h', PIXELS.nodeCanvas(k, false));
        b.add('vein.' + k + '.v', PIXELS.nodeCanvas(k, true));
      }
      await run(b);
    }

    // ---- the mining rigs: 3 tiers, 4 drawn facings, 3 modes ----
    {
      const b = builder('mine');
      for (const tier of [1, 2, 3]) for (const facing of FACINGS) for (const [mode, n] of MODES) {
        const frames = Array.from({ length: n }, (_, f) => PIXELS.machineCanvas(tier, f, mode, facing));
        b.add(tier + '.' + facing + '.' + mode, frames, mode === 'still' ? {} : { clock: mode });
      }
      await run(b);
    }

    // ---- the stations: one sheet per look ----
    for (const look of LOOKS) {
      const b = builder('station-' + look);
      for (const facing of FACINGS) for (const [mode, n] of MODES) {
        const frames = Array.from({ length: n }, (_, f) => PIXELS.stationCanvas(look, f, mode, facing));
        b.add(facing + '.' + mode, frames, mode === 'still' ? {} : { clock: mode });
      }
      await run(b);
    }

    // ---- the operator: walk, idle, work; left is its own drawn row ----
    {
      const b = builder('character');
      for (const dir of ['down', 'up', 'side']) {
        b.add('walk.' + dir, Array.from({ length: PIXELS.WALK_BEATS }, (_, f) => PIXELS.characterCanvas(dir, f)), { clock: 'walk' });
        b.add('idle.' + dir, Array.from({ length: PIXELS.IDLE_BEATS }, (_, f) => PIXELS.idleCanvas(dir, f)), { clock: 'breath' });
      }
      b.add('walk.left', Array.from({ length: PIXELS.WALK_BEATS }, (_, f) => flipC(PIXELS.characterCanvas('side', f))), { clock: 'walk' });
      b.add('idle.left', Array.from({ length: PIXELS.IDLE_BEATS }, (_, f) => flipC(PIXELS.idleCanvas('side', f))), { clock: 'breath' });
      b.add('work', Array.from({ length: 4 }, (_, f) => PIXELS.workCanvas(f)), { clock: 'work' });
      await run(b);
    }

    // ---- belts: tiles per shape and direction, ends and ports per side ----
    {
      const b = builder('belts');
      for (const shape of ['h', 'v', 'ne', 'nw', 'se', 'sw']) {
        for (const rev of [false, true]) for (const pipe of [false, true]) {
          const key = 'tile.' + shape + '.' + (rev ? 'r' : 'f') + '.' + (pipe ? 'p' : 'b');
          b.add(key, Array.from({ length: 8 }, (_, f) => PIXELS.beltTileCanvas(f, shape, rev, pipe)), { clock: 'belt' });
        }
      }
      for (const side of ['n', 'e', 's', 'w']) {
        b.add('end.' + side + '.b', Array.from({ length: 8 }, (_, f) => PIXELS.beltEndCanvas(f, side, false)), { clock: 'belt' });
        b.add('end.' + side + '.p', PIXELS.beltEndCanvas(0, side, true));
        b.add('port.' + side + '.in', PIXELS.portCanvas(side, 'in'));
        b.add('port.' + side + '.out', PIXELS.portCanvas(side, 'out'));
      }
      b.add('spool', PIXELS.spoolCanvas());
      b.add('dot', PIXELS.matDotCanvas());
      await run(b);
    }

    // ---- materials: every material in the chain, the grade marks, the kind icons ----
    {
      const b = builder('materials');
      for (const kind of Object.keys(CHAIN.MATS).concat('money')) b.add('mat.' + kind, PIXELS.matBodyCanvas(kind));
      b.add('grade.1', Array.from({ length: PIXELS.MAT_SPARK_FRAMES }, (_, f) => PIXELS.gradeCanvas(1, f)), { clock: 'spark' });
      b.add('grade.2', Array.from({ length: PIXELS.MAT_SPARK_FRAMES }, (_, f) => PIXELS.gradeCanvas(2, f)), { clock: 'spark' });
      const icons = new Set(['mine', 'smelter', 'foundry', 'constructor', 'molder', 'assembler', 'fastener', 'crane', 'manufacturer', 'default']);
      for (const k of Object.keys(CHAIN.KINDS || {})) icons.add(k);
      for (const k of icons) b.add('icon.' + k, PIXELS.kindIconCanvas(k));
      await run(b);
    }

    // ---- effects ----
    {
      const b = builder('effects');
      for (let f = 0; f < PIXELS.PUFF_FRAMES; f++) b.add('puff.' + f, PIXELS.puffCanvas(f));
      b.add('spark', PIXELS.sparkCanvas());
      for (const k of ['run', 'starved', 'full']) b.add('dot.' + k, PIXELS.stateDotCanvas(k));
      b.add('shadow', PIXELS.dropShadowCanvas());
      b.add('petal', [PIXELS.petalCanvas(0), PIXELS.petalCanvas(1)], { clock: 'flutter' });
      b.add('halo', PIXELS.glowHaloCanvas());
      await run(b);
    }

    // ---- props and the notice board ----
    {
      const b = builder('props');
      const kinds = new Set(['lamppost', 'crate', 'crate2', 'drum', 'bush', 'sign']);
      for (const m of MAPS) for (const p of (m.PROPS || [])) kinds.add(p.kind);
      for (const k of kinds) {
        try { b.add(k, PIXELS.propCanvas(k)); }
        catch (e) { log('  prop skipped ' + k + ': ' + e.message); }
      }
      b.add('board.0', PIXELS.boardCanvas(false));
      b.add('board.1', PIXELS.boardCanvas(true));
      await run(b);
    }

    // ---- the font: one cell per glyph, ink outline + pure-white fill ----
    // The white is a marker: at run time exactly #ffffff takes the caller's
    // colour and every other pixel stays as painted. adv is the fill width;
    // cells overlap by one outline pixel when composed, spacing adv+1.
    {
      const b = builder('font');
      for (const ch of Object.keys(PIXELS.GLYPHS)) {
        b.add('g.' + ch, PIXELS.textCanvas(ch, '#ffffff'), { adv: PIXELS.GLYPHS[ch][0].length });
      }
      await run(b);
    }

    // ---- the welcome-card vignette, one repaintable picture ----
    {
      const b = builder('vignette');
      b.add('vignette', PIXELS.vignetteCanvas());
      await run(b);
    }

    // ---- the index: the sheet list + the pipeline's shared numbers ----
    const index = {
      sheets: sheetNames,
      meta: {
        tile: PIXELS.TILE,
        workFrames: PIXELS.WORK_FRAMES, idleFrames: PIXELS.IDLE_FRAMES,
        walkBeats: PIXELS.WALK_BEATS, idleBeats: PIXELS.IDLE_BEATS,
        charW: PIXELS.CHAR_W, charH: PIXELS.CHAR_H,
        beltPitch: PIXELS.BELT_PITCH, matPx: PIXELS.MAT_PX,
        sparkFrames: PIXELS.MAT_SPARK_FRAMES, sparkPeak: PIXELS.MAT_SPARK_PEAK,
        puffFrames: PIXELS.PUFF_FRAMES,
        groundVariants: GROUND_VARIANTS,
      },
    };
    await put('index.json', new Blob([JSON.stringify(index, null, 1)], { type: 'application/json' }));
    log('done: ' + sheetNames.length + ' sheets → assets/' + (TARGET === 'sprites' ? 'sprites' : 'inbox'));
  }

  log('baking to assets/' + (TARGET === 'sprites' ? 'sprites' : 'inbox') + ' …');
  bakeAll().catch((e) => { log('FAILED: ' + (e && e.stack || e)); });
})();
