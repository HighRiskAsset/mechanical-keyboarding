// The bot: a player that is not a person, for playing the game through and
// watching it for bugs without doing the typing that pays for it. Developer
// mode only, and off on every load. One switch cycles it: off, then 30 WPM,
// then machine speed, then off again (the robot in the header, or
// Ctrl+Alt+B).
//
// It plays with a player's hands. It walks, holds and taps by dispatching the
// key events a keyboard sends, so every menu, ghost, spool and card it uses is
// the one a player uses, and a bug it walks into is one a player would walk
// into. At the keys it drives the autotyper (app.js): at 30 WPM every
// keystroke is shown and heard the way a hand's is, at machine speed the
// panels catch up once a frame. Neither signs the typing register, so the
// letter stats, the accuracy and the WPM stay a record of real hands.
//
// Its plan is made fresh before every move, from the save alone: the finish's
// price, and for whatever is short, the mine or the recipe that makes it, down
// to the first thing missing. Solids travel in the bag. A fluid never can, so
// a recipe that takes or makes one gets a machine of its own, stood where a
// pipe from its source can reach it.
//
// A machine stands where a player would stand it: one a run comes into, where
// the run can reach it; one that eats an ore, at that ore's mine; the rest at
// home, the landing, until home has no ground left with a lane round it, and
// then wherever the operator is standing, which is the last input's source.
//
// Pressing a real key while it plays hands the game back: the bot stops.
// Global: BOT
(function () {
  'use strict';

  const DEV = window.DEV, T = window.I18N;
  const MODES = ['off', 'wpm30', 'max'];
  // 30 WPM is 150 characters a minute: five to a word, spaces included, the
  // same count the WPM readout divides by
  const CPS = { wpm30: 2.5, max: 200 };
  // the pause between moves that are not typing: a hand's at 30 WPM, and at
  // machine speed just long enough for the screen to answer
  const BEAT = { wpm30: 240, max: 50 };
  const HOLD = 650;                  // past app.js HOLD_MS, so a hold always lands
  const TILE = 16;
  // the cards play puts up, whose one button the bot may press; any other
  // panel (settings, the map picker) is the player's, and the
  // bot waits for it to close
  const DISMISS = new Set(['finish', 'rest']);

  let mode = 'off';
  let gen = 0;                       // bumped on every switch, so a stale run stops itself
  const CANCEL = { cancel: true };

  // ---------- names, as the interface says them ----------
  const kindName = (k) => (T.t('kindNames') || {})[k] || CHAIN.kindName(k);
  const mineName = (ore) => (T.t('oreMineNames') || {})[ore] || CHAIN.mineName(ore);
  const matName = (mat) => (T.t('matNames') || {})[mat] || CHAIN.matName(mat);
  const machineName = (m) => (m ? (m.kind === 'mine' ? mineName(m.ore) : kindName(m.kind)) : '?');

  // ---------- time ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // one frame, or a short wait where the host has stopped handing out frames
  const frame = () => new Promise((r) => {
    let done = false;
    const go = () => { if (!done) { done = true; r(); } };
    requestAnimationFrame(go);
    setTimeout(go, 40);
  });
  function alive(g) { if (g !== gen || mode === 'off') throw CANCEL; }
  async function wait(g, ms) { alive(g); await sleep(ms); alive(g); }
  const beat = (g) => wait(g, BEAT[mode] || 50);

  // ---------- the hands: key events, as a keyboard sends them ----------
  const held = new Set();
  function send(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, { code, key: code === 'Space' ? ' ' : code, bubbles: true, cancelable: true }));
  }
  function press(code) { if (held.has(code)) return; held.add(code); send('keydown', code); }
  function release(code) { if (!held.has(code)) return; held.delete(code); send('keyup', code); }
  function releaseAll() { for (const code of [...held]) release(code); }
  async function tap(g, code) {
    press(code);
    try { await wait(g, 45); } finally { release(code); }
    await beat(g);
  }
  async function hold(g, code, ms) {
    press(code);
    try { await wait(g, ms); } finally { release(code); }
    await beat(g);
  }

  const view = () => (window.MK_DEBUG && MK_DEBUG.bot ? MK_DEBUG.bot.view() : null);

  // ---------- the ground, in tiles ----------
  const k2 = (tx, ty) => tx + ',' + ty;
  // where the feet stand on a tile: the row app.js reads is floor((y - 2) / 16)
  const spot = (tx, ty) => ({ x: tx * TILE + 8, y: ty * TILE + 10 });
  function playerTile() {
    const p = FACTORY.playerPos();
    return [Math.floor(p.x / TILE), Math.floor((p.y - 2) / TILE)];
  }
  // Can the feet get from (x, y) to (gx, gy)? Asked of the frame's own rule a
  // pixel at a time, sideways and then up or down as a frame takes them, with
  // its one exception: feet inside a body (one built where they stood) go
  // anywhere until they are out of it.
  function reaches(x, y, gx, gy) {
    for (let n = 0; n < 400; n++) {
      const dx = gx - x, dy = gy - y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return true;
      const inside = !FACTORY.canStep(x, y, x, y);
      let moved = false;
      if (Math.abs(dx) >= 0.5) {
        const nx = x + Math.sign(dx) * Math.min(1, Math.abs(dx));
        if (inside || FACTORY.canStep(x, y, nx, y)) { x = nx; moved = true; }
      }
      if (Math.abs(dy) >= 0.5) {
        const ny = y + Math.sign(dy) * Math.min(1, Math.abs(dy));
        if (inside || FACTORY.canStep(x, y, x, ny)) { y = ny; moved = true; }
      }
      if (!moved) return false;
    }
    return false;
  }
  // The tile a walk starts from. The feet are seldom on a tile's middle, and a
  // player who walks up to a machine stops against its base, on a tile whose
  // middle is inside the base: planned from there, the way north goes
  // straight through the machine. So a walk starts from the nearest middle
  // the feet can walk to, of the tile under them and the four around it.
  function startTile(bad) {
    const p = FACTORY.playerPos(), [tx, ty] = playerTile();
    const far = (t) => { const s = spot(t[0], t[1]); return Math.hypot(s.x - p.x, s.y - p.y); };
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [tx + dx, ty + dy])
      .filter((t) => !(bad && bad.has(k2(t[0], t[1])))).sort((a, b) => far(a) - far(b));
    return near.find((t) => { const s = spot(t[0], t[1]); return reaches(p.x, p.y, s.x, s.y); }) || [tx, ty];
  }
  // breadth first over the tiles, every step one the frame would let the feet
  // take and none a stall has found shut (`bad`, see walk); stops at the first
  // tile `goal` accepts, or floods the lot
  function flood(goal, bad) {
    const cols = Math.ceil(CHAIN.WORLD_W / TILE), rows = Math.ceil(CHAIN.WORLD_H / TILE);
    const start = startTile(bad);
    const prev = new Map([[k2(start[0], start[1]), null]]);
    const dist = new Map([[k2(start[0], start[1]), 0]]);
    const q = [start];
    for (let h = 0; h < q.length; h++) {
      const [x, y] = q[h];
      if (goal && goal(x, y)) return { prev, dist, end: [x, y] };
      const a = spot(x, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || prev.has(k2(nx, ny))) continue;
        const b = spot(nx, ny);
        if (!FACTORY.canStep(a.x, a.y, b.x, b.y) || (bad && bad.has(k2(x, y) + '>' + k2(nx, ny)))) continue;
        prev.set(k2(nx, ny), [x, y]);
        dist.set(k2(nx, ny), dist.get(k2(x, y)) + 1);
        q.push([nx, ny]);
      }
    }
    return { prev, dist, end: null };
  }
  function pathTo(goal, bad) {
    const { prev, end } = flood(goal, bad);
    if (!end) return null;
    const path = [];
    for (let t = end; t; t = prev.get(k2(t[0], t[1]))) path.push(t);
    return path.reverse();
  }

  // ---------- walking ----------
  function steer(dx, dy, tol) {
    const want = { ArrowRight: dx > tol, ArrowLeft: dx < -tol, ArrowDown: dy > tol, ArrowUp: dy < -tol };
    for (const [code, on] of Object.entries(want)) { if (on) press(code); else release(code); }
  }
  // Walk to the nearest tile `goal` accepts; false when there is none in reach.
  // The feet move a pixel and a bit a frame on a good host, and in lumps of up
  // to eight where the host starves the page of frames and factory.js winds
  // the clock by hand. So a waypoint is a window inside its tile, wide enough
  // for either, and the feet keep to the path's own axis, straying across it
  // only as far as keeps them inside the tile, and only while the line they
  // are on is clear to the waypoint. It is not always: the row behind a
  // machine is walkable and its base begins a few pixels below that row's
  // middle, so feet that come up beside the machine and turn along the row
  // arrive those few pixels low and walk into its corner. Where the line runs
  // into something, the feet step back onto the path's own line, which the
  // plan found clear.
  async function walk(g, goal) {
    const bad = new Set();             // steps, and starts, that a stall found shut
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const path = pathTo(goal, bad);
        if (!path) { console.warn('[bot] walk: no way there from tile', playerTile().join(',')); return false; }
        let i = 0, near = Infinity, nearAt = 0;
        while (i < path.length) {
          alive(g);
          const p = FACTORY.playerPos();
          const c = spot(path[i][0], path[i][1]);
          const dx = c.x - p.x, dy = c.y - p.y;
          const end = i === path.length - 1;
          const win = end ? 4 : 5;
          if (Math.abs(dx) <= win && Math.abs(dy) <= win) { i++; near = Infinity; continue; }
          if (i === 0) steer(dx, dy, end ? 1 : 2);     // onto the start tile's middle first
          else {
            const alongX = path[i - 1][0] !== path[i][0];
            const clear = alongX ? reaches(p.x, p.y, c.x, p.y) : reaches(p.x, p.y, p.x, c.y);
            const back = !clear || Math.abs(alongX ? dy : dx) > win;
            steer(alongX || back ? dx : 0, !alongX || back ? dy : 0, end ? 1 : 2);
          }
          await frame();
          // stalled is no nearer the waypoint, which feet that only rock
          // across the line are not either
          const n = FACTORY.playerPos(), d = Math.abs(c.x - n.x) + Math.abs(c.y - n.y);
          if (d < near - 0.4) { near = d; nearAt = performance.now(); }
          else if (performance.now() - nearAt > 1500) {
            // something in the way the plan did not see: plan again from here,
            // around the step that stopped the feet, or the new plan is the
            // old one and walks them into the same thing
            console.warn('[bot] walk: stalled at', Math.round(n.x) + ',' + Math.round(n.y));
            bad.add(i === 0 ? k2(path[0][0], path[0][1]) : k2(path[i - 1][0], path[i - 1][1]) + '>' + k2(path[i][0], path[i][1]));
            break;
          }
        }
        steer(0, 0, 1);
        if (i >= path.length) return true;
      }
      return false;
    } finally {
      steer(0, 0, 1);
    }
  }
  // turn to face a world side without leaving the tile: hold the arrow for as
  // few frames as it takes the operator to turn
  async function faceTo(g, dir) {
    const code = { s: 'ArrowDown', n: 'ArrowUp', e: 'ArrowRight', w: 'ArrowLeft' }[dir];
    try {
      for (let i = 0; i < 20 && FACTORY.playerDir() !== dir; i++) { press(code); await frame(); alive(g); }
    } finally { release(code); }
    await frame();
  }
  // Walk the last tile onto `tile` facing `dir`, a frame at a time, until the
  // feet are on it and at or just short of its middle. The feet move in lumps
  // of up to eight pixels on a host short of frames, and the middle is eight
  // from the tile's edge, so they cannot overshoot out of it.
  async function nudge(g, dir, tile) {
    const code = { s: 'ArrowDown', n: 'ArrowUp', e: 'ArrowRight', w: 'ArrowLeft' }[dir];
    const c = spot(tile[0], tile[1]);
    const short = () => { const q = FACTORY.playerPos(); return { n: q.y - c.y, s: c.y - q.y, e: c.x - q.x, w: q.x - c.x }[dir]; };
    const there = () => { const [tx, ty] = playerTile(); return tx === tile[0] && ty === tile[1] && short() <= 4; };
    try {
      for (let i = 0; i < 40 && !there(); i++) { press(code); await frame(); alive(g); }
    } finally { release(code); }
    await frame();
    return there();
  }
  // a tile the operator docks at `id` from, anywhere inside the window a walk
  // stops in (see walk), since the feet stop near the middle of a tile and
  // not on it
  const JIGGLE = [[0, 0], [4, 4], [-4, -4], [4, -4], [-4, 4]];
  const docksAt = (id, tx, ty) => { const c = spot(tx, ty); return JIGGLE.every(([ox, oy]) => FACTORY.dockAt(c.x + ox, c.y + oy) === id); };
  async function goDock(g, m) {
    const id = 'm:' + m.id;
    let v = view();
    if (v && v.dock && v.dock.id === id) return true;
    if (!(await walk(g, (x, y) => docksAt(id, x, y)))) return false;
    for (let i = 0; i < 10; i++) { v = view(); if (v && v.dock && v.dock.id === id) return true; await frame(); }
    return false;
  }

  // ---------- menus ----------
  // A press of Space types the drill's space when a space is next, so one is
  // typed first by the typist, and the hold that opens the menu types nothing
  // by hand.
  async function clearSpace(g) {
    let v = view();
    if (!v || !v.canType || v.line[v.pos] !== ' ') return;
    MK_DEBUG.bot.type({ cps: CPS.max, until: (acc, paid, next) => next !== ' ' });
    try {
      for (let i = 0; i < 30; i++) { await frame(); alive(g); v = view(); if (!v || v.line[v.pos] !== ' ') break; }
    } finally { MK_DEBUG.bot.stopTyping(); }
  }
  async function waitFor(g, test, frames) {
    for (let i = 0; i < (frames || 20); i++) { const v = view(); if (v && test(v)) return v; await frame(); alive(g); }
    return null;
  }
  // move the highlight of the open menu (or build menu) onto the row `pick`
  // accepts; false when the menu offers no such row
  async function choose(g, which, pick) {
    for (let n = 0; n < 80; n++) {
      const mm = (view() || {})[which];
      if (!mm) return false;
      const idx = mm.rows.findIndex(pick);
      if (idx < 0) return false;
      if (idx === mm.sel) return true;
      const down = (idx - mm.sel + mm.rows.length) % mm.rows.length;
      await tap(g, down <= mm.rows.length - down ? 'ArrowDown' : 'ArrowUp');
    }
    return false;
  }
  // at a docked place: hold for its menu, find the row, press it
  async function menuDo(g, pick) {
    await clearSpace(g);
    await hold(g, 'Space', HOLD);
    if (!(await waitFor(g, (v) => v.menu))) return false;
    if (!(await choose(g, 'menu', (r) => r.enabled && pick(r)))) { await tap(g, 'Escape'); return false; }
    await tap(g, 'Space');
    return true;
  }

  // ---------- building ----------
  // The build ghost stands a step ahead of the operator in the way they face
  // (app.js updatePlacing): this is the tile to stand on to aim it at `box`.
  function standFor(box, dir) {
    if (dir === 's') return [box.c0 + ((box.w - 1) >> 1), box.r0 - 1];
    if (dir === 'n') return [box.c0 + ((box.w - 1) >> 1), box.r1 + 1];
    if (dir === 'e') return [box.c0 - 1, box.r0 + ((box.h - 1) >> 1)];
    return [box.c1 + 1, box.r0 + ((box.h - 1) >> 1)];
  }
  const boxTiles = (b) => { const out = []; for (let y = b.r0; y <= b.r1; y++) for (let x = b.c0; x <= b.c1; x++) out.push([x, y]); return out; };
  const grow = (b, k) => ({ c0: b.c0 - k, c1: b.c1 + k, r0: b.r0 - k, r1: b.r1 + k, w: b.w + 2 * k, h: b.h + 2 * k });
  const inBox = (b, x, y) => x >= b.c0 && x <= b.c1 && y >= b.r0 && y <= b.r1;
  // a body is worked from the row in front of its foot, whichever way it
  // faces (factory.js docks a walker by the middle of the base)
  const workTile = (b) => [b.c0 + (b.w >> 1), b.r1 + 1];
  // the ground a mine on a free vein will take: the ghost seats it on the
  // seam the way the mine faces (app.js), so every way it could face
  const seatsOf = (n) => [CHAIN.nodeBox(n)].concat(MAPKIT.FACINGS.map((f) => CHAIN.nodeSeat(n, f)));
  // What stands, and what is bound to: the bodies and the rows they are
  // worked from, the runs, and the seat of every free vein, since a mine will
  // stand there one day and a body built against it now is boxed in then.
  function taken(p) {
    const bodies = new Set(), works = new Set(), seats = new Set(), belts = new Set();
    for (const m of p.machines) {
      const b = CHAIN.machineBox(m);
      for (const [x, y] of boxTiles(b)) bodies.add(k2(x, y));
      for (let x = b.c0; x <= b.c1; x++) works.add(k2(x, b.r1 + 1));
    }
    for (const n of CHAIN.unbuiltNodes(p)) for (const b of seatsOf(n)) for (const [x, y] of boxTiles(b)) seats.add(k2(x, y));
    for (const b of p.belts || []) for (const [x, y] of b.path) belts.add(k2(x, y));
    return { bodies, works, seats, belts };
  }
  const badSpots = new Set();        // aims that failed once, never tried again this run
  // How good the ground in `box` is for a body. Every body keeps a ring of
  // air, the tile all round it: its ports stand there, it is worked from
  // there, and it is the way past it. So a body cannot stand on or against
  // anything standing or bound to (taken), nor where the tile it is worked
  // from cannot be walked to, nor where its ring is not building ground
  // (null). Where it can, its ring is its own, with a lane between it and
  // the next body's (0), or runs into the next body's (1); `lane` asks for
  // the first and turns the second away before the dear part.
  function groundFor(t, reach, box, lane) {
    const held = (x, y) => t.bodies.has(k2(x, y)) || t.seats.has(k2(x, y));
    const ring = grow(box, 1), tiles = boxTiles(ring);
    if (tiles.some(([x, y]) => held(x, y) || t.belts.has(k2(x, y)))) return null;
    const crowd = boxTiles(grow(box, 2)).some(([x, y]) => !inBox(ring, x, y) && held(x, y)) ? 1 : 0;
    if (lane && crowd) return null;
    const work = workTile(box);
    if (!reach.has(k2(work[0], work[1]))) return null;
    const zone = FACTORY.buildZone(box), ringZone = FACTORY.buildZone(ring);
    if (tiles.some(([x, y]) => !(inBox(box, x, y) ? zone : ringZone).has(k2(x, y)))) return null;
    return crowd;
  }
  // Somewhere to stand a machine of `kind`: the nearest ground to `anchor` (a
  // tile) with a lane round it, and only where there is none anywhere, the
  // nearest with its ring alone. With `feed`, a machine a pipe has to reach
  // it from, a spot only counts if that pipe would find a route. With
  // `within`, only ground that far from the anchor and only with a lane: a
  // home that has run out of lanes is left, not packed tighter.
  function findSpot(p, kind, anchor, feed, within) {
    const size = CHAIN.KINDS[kind].size;
    const t = taken(p);
    const reach = flood(null).dist;
    const cols = Math.ceil(CHAIN.WORLD_W / TILE), rows = Math.ceil(CHAIN.WORLD_H / TILE);
    const cands = [];
    for (const face of ['s', 'e', 'w', 'n']) {
      const fp = MAPKIT.footprint(size, face);
      for (let r0 = 0; r0 + fp[1] <= rows; r0++) for (let c0 = 0; c0 + fp[0] <= cols; c0++) {
        const d = Math.abs(c0 + fp[0] / 2 - anchor[0]) + Math.abs(r0 + fp[1] / 2 - anchor[1]) + (face === 's' ? 0 : 0.6);
        cands.push({ face, c0, r0, d });
      }
    }
    cands.sort((a, b) => a.d - b.d);
    let fallback = null, routed = 0;
    for (const c of cands) {
      if (within && c.d > within) break;
      if (badSpots.has(kind + '@' + c.c0 + ',' + c.r0 + c.face)) continue;
      const box = MAPKIT.boxAt([c.c0, c.r0], size, c.face);
      const crowd = groundFor(t, reach, box, !!fallback || !!within);
      if (crowd === null) continue;
      const dir = ['n', 'w', 's', 'e'].find((dd) => { const st = standFor(box, dd); return reach.has(k2(st[0], st[1])); });
      if (!dir) continue;
      if (feed) {
        if (routed++ > 40) break;      // routing is the dear part: a fair look, then give up
        const ghost = { id: 'bot-ghost', kind, at: [c.c0, c.r0], face: c.face };
        if (!FACTORY.routeBelt(feed, ghost, { machines: p.machines.concat([ghost]), belts: p.belts || [] })) continue;
      }
      const s = { kind, at: [c.c0, c.r0], face: c.face, box, stand: standFor(box, dir), dir, feed: feed || null, lane: !crowd };
      if (s.lane) return s;
      if (!within) fallback = s;
    }
    return fallback;
  }
  // A free vein of `ore` to stand a mine on. The seat is the vein's, so the
  // choice is only which: never one whose mine would stand on a body or on
  // the row a body is worked from, or could not be worked itself; and of the
  // rest one with a lane round it, then one with its ring alone, then one
  // with something against it, the nearest walk first. The ghost snaps to a
  // vein it touches, so any side of the seam will do to aim from.
  function findVein(p, ore) {
    const reach = flood(null).dist;
    const t = taken(p);
    let best = null;
    for (const n of CHAIN.unbuiltNodes(p)) {
      if (n.ore !== ore) continue;
      const vb = CHAIN.nodeBox(n);                 // a vein, or a pool (2026-09-16)
      const seat = CHAIN.nodeSeat(n, 's');
      const work = workTile(seat);
      if (!reach.has(k2(work[0], work[1])) || t.bodies.has(k2(work[0], work[1]))) continue;
      if (boxTiles(seat).some(([x, y]) => t.bodies.has(k2(x, y)) || t.works.has(k2(x, y)))) continue;
      const near = (k) => boxTiles(grow(seat, k)).some(([x, y]) => !inBox(seat, x, y) && (t.bodies.has(k2(x, y)) || (k === 1 && t.belts.has(k2(x, y)))));
      const grade = near(1) ? 2 : near(2) ? 1 : 0;
      // facing north or west first: turning on the spot can nudge the feet a
      // few pixels, and up or left from a tile's middle stays inside the tile
      for (const [dir, stand] of [['n', [vb.c0, vb.r1 + 1]], ['w', [vb.c1 + 1, vb.r0]], ['e', [vb.c0 - 1, vb.r0]], ['s', [vb.c0, vb.r0 - 1]]]) {
        const d = reach.get(k2(stand[0], stand[1]));
        if (d === undefined || badSpots.has('mine@' + n.index + dir)) continue;
        const score = d + grade * 1e6;
        if (!best || score < best.score) best = { kind: 'mine', ore, vein: n.index, at: [seat.c0, seat.r0], face: 's', stand, dir, score };
      }
    }
    return best;
  }
  // somewhere left to stand another mine of `ore`: a free vein or pool of it
  const mineRoom = (p, ore) => CHAIN.unbuiltNodes(p).some((n) => n.ore === ore);
  // a machine's ghost standing somewhere other than aimed is as good as the
  // aim wherever the ground is as good (and a pipe would still reach it)
  function goodGhost(v, s) {
    const p = v.profile, at = v.placing.at;
    const ghost = { id: 'bot-ghost', kind: s.kind, at, face: s.face };
    if (groundFor(taken(p), flood(null).dist, MAPKIT.boxAt(at, CHAIN.KINDS[s.kind].size, s.face), s.lane) === null) return false;
    return !s.feed || !!FACTORY.routeBelt(s.feed, ghost, { machines: p.machines.concat([ghost]), belts: p.belts || [] });
  }
  // Raise the build menu on open ground, pick the kind, turn the ghost, walk
  // it onto the spot and hold. Returns true, or why it could not.
  async function place(g, s) {
    if ((view() || {}).dock && !(await walk(g, (x, y) => { const c = spot(x, y); return JIGGLE.every(([ox, oy]) => FACTORY.dockAt(c.x + ox, c.y + oy) === null); }))) return 'walk';
    await hold(g, 'Space', HOLD);
    if (!(await waitFor(g, (v) => v.buildMenu))) return 'menu';
    const pick = (r) => r.enabled && r.type === 'pick' && r.kind === s.kind && (s.kind !== 'mine' || r.ore === s.ore);
    if (!(await choose(g, 'buildMenu', pick))) { await tap(g, 'Escape'); return 'menu'; }
    await tap(g, 'Space');
    if (!(await waitFor(g, (v) => v.placing))) return 'menu';
    for (let i = 0; i < 4 && (view().placing || {}).face !== s.face; i++) await tap(g, 'Space');
    // The ghost aims from the tile underfoot, and on a host short of frames
    // a turn on the spot carries the feet a whole step, and the ghost with
    // them. So the turn is made one tile back from the stand, where a slip
    // only brings the feet nearer, and the last tile is walked facing the
    // way the ghost goes. Where that tile cannot be walked to, the turn is
    // made on the stand and taken as it comes: a mine's ghost snaps back
    // onto its vein, a machine's is taken where it then stands if that
    // ground is as good.
    const back = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[s.dir];
    const approach = [s.stand[0] + back[0], s.stand[1] + back[1]];
    if (await walk(g, (x, y) => x === approach[0] && y === approach[1])) {
      await faceTo(g, s.dir);
      await nudge(g, s.dir, s.stand);
    } else {
      if (!(await walk(g, (x, y) => x === s.stand[0] && y === s.stand[1]))) { await tap(g, 'Escape'); return 'walk'; }
      await faceTo(g, s.dir);
    }
    const aimed = (v) => v.placing && v.placing.ok && v.placing.at && (s.vein !== undefined ? v.placing.vein === s.vein
      : v.placing.at[0] === s.at[0] && v.placing.at[1] === s.at[1]);
    let pl = await waitFor(g, aimed, 12);
    if (!pl && s.kind !== 'mine') pl = await waitFor(g, (v) => v.placing && v.placing.ok && v.placing.at && v.placing.face === s.face && goodGhost(v, s), 1);
    if (!pl) {
      const gh = (view() || {}).placing;
      console.warn('[bot] aim: wanted', s.kind, 'at', s.at.join(','), s.face, 'from', s.stand.join(','), s.dir, '; ghost', gh ? [gh.at && gh.at.join(','), gh.face, gh.ok ? 'ok' : 'refused'].join(' ') : 'gone', '; feet', (() => { const q = FACTORY.playerPos(); return Math.round(q.x) + ',' + Math.round(q.y); })());
      badSpots.add(s.vein !== undefined ? 'mine@' + s.vein + s.dir : s.kind + '@' + s.at[0] + ',' + s.at[1] + s.face);
      if (view().placing) await tap(g, 'Escape');
      return 'aim';
    }
    await hold(g, 'Space', HOLD);
    return (await waitFor(g, (v) => !v.placing, 20)) ? true : 'aim';
  }

  // ---------- the plan ----------
  // Nothing below names a material, a machine, a price or an order. The goal
  // is the finish; everything else is asked of the rules as the game has them
  // today (CHAIN, SIM), fresh before every move, so a tree rebuilt, a price
  // moved or a recipe added is simply a different plan.
  class Loop extends Error {}
  const TUNE = () => CHAIN.TUNING;
  // a material rides in the bag when the bag will take one; the rest move
  // through runs and wait in machines (the fluids, today)
  const carryable = (mat) => CHAIN.bagAdd({}, mat, 1) > 0;
  const isRaw = (mat) => !!CHAIN.ORES[mat];
  const have = (p, mat) => p.bag[mat] || 0;
  const live = (p, m) => !!SIM.autoLive(p, m);
  const outsOf = (r) => SIM.outsOf(r);
  // a recipe that takes or makes something the bag cannot hold is served by a
  // run, so the machine working it is kept for it
  const piped = (r) => Object.keys(r.in).concat(Object.keys(outsOf(r))).some((mat) => !carryable(mat));
  const freeOutlet = (p, m) => SIM.beltsFrom(p, m).length < SIM.outletsOf(m);
  const roles = new Map();           // machine id → the lesson of the piped recipe it is kept for
  let stack = new Set();             // the materials being looked for on the way down, to catch a circle
  let path = [];                     // the same, root first: the `why` a move carries
  let waiting = new Map();           // materials found only waiting on a run, this plan (each looked at once)
  let left = {};                     // what the rest of the game still asks for (outstanding)
  // a move that could only wait on a run, thrown so the plan can look for
  // something else to do in the meantime
  class Blocked extends Error { constructor(a) { super('waiting'); this.a = a; } }
  // the recipe a material is normally made by: the one naming it its product
  const mainMaker = (mat) => CHAIN.RECIPES.find((r) => r.out === mat) || CHAIN.RECIPES.find((r) => outsOf(r)[mat]) || null;
  // every material ahead of the inputs it is made from, worked out once
  let topo = null;
  function topoOrder() {
    if (topo) return topo;
    const out = [], seen = new Set();
    const visit = (mat) => {
      if (seen.has(mat)) return;
      seen.add(mat);
      const r = isRaw(mat) ? null : mainMaker(mat);
      if (r) for (const i of Object.keys(r.in)) visit(i);
      out.push(mat);
    };
    for (const mat of CHAIN.MAT_IDS) visit(mat);
    return (topo = out.reverse());
  }
  // How much of every material the rest of the game still asks for beyond
  // what the bag holds: the finish, and the price of every machine and mine
  // that making it needs and nobody has built, expanded down to raws. It
  // sizes a trip: whatever the operator goes to make, they make as much as is
  // still wanted and the bag will hold, rather than walking back for more a
  // minute later.
  function outstanding(p) {
    const roots = {};
    const add = (cost) => { for (const [mat, q] of Object.entries(cost || {})) roots[mat] = (roots[mat] || 0) + q; };
    const pass = () => {
      const gross = { ...roots }, net = {};
      for (const mat of topoOrder()) {
        const n = (gross[mat] || 0) - have(p, mat);
        if (n <= 0) continue;
        net[mat] = n;
        const r = isRaw(mat) ? null : mainMaker(mat);
        if (!r) continue;
        const units = Math.ceil(n / (outsOf(r)[mat] || 1));
        for (const [i, q] of Object.entries(r.in)) gross[i] = (gross[i] || 0) + q * units;
      }
      return net;
    };
    add(CHAIN.priceCompletion());
    const first = pass();
    const kind = CHAIN.completionKind();
    const kinds = new Set(kind ? [kind] : []), ores = new Set();
    for (const mat of Object.keys(first)) {
      if (isRaw(mat)) ores.add(mat);
      else { const r = mainMaker(mat); if (r) kinds.add(r.kind); }
    }
    let more = false;
    for (const k of kinds) if (!CHAIN.machinesOfKind(p, k).length) { add(CHAIN.priceMachine(k, 1)); more = true; }
    for (const o of ores) if (!CHAIN.machinesOfOre(p, o).length) { add(minePrice(p, o)); more = true; }
    return more ? pass() : first;
  }
  // what a unit of a material costs in keystrokes, all the way down (a
  // recipe's work and inputs shared across everything it makes)
  const unitCosts = {};
  function unitCost(mat) {
    if (unitCosts[mat] !== undefined) return unitCosts[mat];
    unitCosts[mat] = Infinity;       // a circle is too dear to make extra of
    let v = 1;
    const r = isRaw(mat) ? null : mainMaker(mat);
    if (r) {
      const total = Object.values(outsOf(r)).reduce((a, b) => a + b, 0) || 1;
      v = (CHAIN.perUnit(r) + Object.entries(r.in).reduce((a, [i, q]) => a + q * unitCost(i), 0)) / total;
    }
    return (unitCosts[mat] = v);
  }
  // How much a trip makes: at least what was asked, and more toward what the
  // rest of the game still wants, as far as a budget of keystrokes goes. Ore
  // is a keystroke a unit and fills the bag; a part a thousand keystrokes deep
  // is made to order. At machine speed keystrokes are cheap and the walk is
  // dear, so the budget is bigger there.
  const BATCH_KS = { wpm30: 400, max: 4000 };
  function lot(p, mat, target) {
    const wanted = Math.min(TUNE().BAG_CAP, have(p, mat) + (left[mat] || 0));
    if (wanted <= target) return target;
    return Math.min(wanted, target + Math.floor((BATCH_KS[mode] || BATCH_KS.max) / Math.max(1, unitCost(mat))));
  }
  // the inputs a machine is out of (less than a unit's worth, counting what
  // stands in it), each asked for as a whole trip's worth: while every input
  // covers a unit the operator works, and fetches only what runs out
  function restock(p, r, m, units) {
    const out = {};
    for (const [i, q] of Object.entries(r.in)) {
      if (!carryable(i) || have(p, i) + (m.buf.in[i] || 0) >= q) continue;
      out[i] = q * units - (m.buf.in[i] || 0);
    }
    return out;
  }

  // every recipe that makes `mat`: the ones that name it their product first,
  // then the ones whose inputs have all been held, then the tree's order
  function makers(p, mat) {
    return CHAIN.RECIPES.map((r, i) => ({ r, i })).filter(({ r }) => outsOf(r)[mat])
      .sort((a, b) => ((a.r.out === mat ? 0 : 2) + (CHAIN.inputsExist(a.r, p) ? 0 : 1) + a.i * 1e-4)
        - ((b.r.out === mat ? 0 : 2) + (CHAIN.inputsExist(b.r, p) ? 0 : 1) + b.i * 1e-4))
      .map(({ r }) => r);
  }
  // a machine kept for a piped recipe keeps its job across a reload: its runs
  // and the recipe it is set to say which it was
  function adoptRoles(p) {
    for (const id of [...roles.keys()]) if (!SIM.machineById(p, id)) roles.delete(id);
    for (const m of p.machines) {
      if (m.kind === 'mine' || roles.has(m.id) || !m.recipe) continue;
      if (!SIM.beltsTo(p, m).length && !SIM.beltsFrom(p, m).length) continue;
      const r = CHAIN.recipesFor(m.kind).find((x) => x.out === m.recipe);
      if (r && piped(r)) roles.set(m.id, r.lesson);
    }
  }

  function plan(p) {
    if (p.finishedAt) return { type: 'done' };
    stack = new Set();
    path = [];
    waiting = new Map();
    left = outstanding(p);
    try {
      // ore collected to pay for another mine goes on that mine before
      // anything else can spend it
      for (const [ore, n] of saving) {
        if (CHAIN.affordable(p.bag, { [ore]: n }) && mineRoom(p, ore)) { saving.delete(ore); return { type: 'build', kind: 'mine', ore }; }
      }
      const care = upkeep(p);
      if (care) return care;
      const kind = CHAIN.completionKind();
      const at = kind ? p.machines.find((m) => m.kind === kind) : null;
      // the finish is bought at a machine: stand it up first, since its price
      // may well share materials with the finish's own
      if (kind && !at) return buildMachine(p, kind, null, 0);
      const short = need(p, CHAIN.priceCompletion() || {}, 0);
      if (short) return short;
      if (!at) throw new Error('the finish has nowhere to be bought');
      return { type: 'complete', m: at };
    } catch (e) {
      // everything still to do is waiting on an engine: keep the engines
      // going meanwhile, else wait on the first of it
      if (e instanceof Blocked) return chores(p) || e.a;
      throw e;
    }
  }
  // the rounds while the hands are idle: an engine stopped by a full bin is
  // emptied (when the bag has room), an engine starved of something the bag
  // holds is loaded, and one starved of something a bin holds gets that
  // bin emptied first
  function chores(p) {
    const room = (mat) => CHAIN.bagAdd({ ...p.bag }, mat, 1) > 0;
    for (const m of p.machines) {
      if (!live(p, m) || SIM.state(p, m) !== 'full' || !SIM.hasCollectable(m)) continue;
      const mat = Object.keys(m.buf.out).filter((x) => (m.buf.out[x] || 0) > 0 && !CHAIN.isFluid(x) && room(x)).sort((a, b) => m.buf.out[b] - m.buf.out[a])[0];
      if (mat) return { type: 'collect', m, mat };
    }
    for (const m of p.machines) {
      if (!live(p, m) || m.kind === 'mine') continue;
      const r = SIM.recipeOf(p, m);
      if (!r) continue;
      for (const [i, q] of Object.entries(r.in)) {
        if (!carryable(i) || (m.buf.in[i] || 0) >= q || runBringing(p, m, i)) continue;
        const src = engineOf(p, i, m);
        if (src) return { type: 'pipe', from: src, to: m, mat: i };
        if (CHAIN.bagAvail(p.bag, i) >= q) return { type: 'feed', m, r };
        const bin = p.machines.find((x) => x.buf && (x.buf.out[i] || 0) >= q && SIM.hasCollectable(x) && room(i));
        if (bin) return { type: 'collect', m: bin, mat: i };
      }
    }
    return null;
  }
  // the first material of a cost the bag is short of, and the move toward it.
  // One that is only waiting on a run is passed over for the next, so the
  // operator makes something else while it arrives.
  function need(p, cost, depth) {
    let blocked = null;
    for (const [mat, q] of Object.entries(cost || {})) {
      if (!carryable(mat) || have(p, mat) >= q) continue;
      try {
        return acquire(p, mat, Math.min(q, TUNE().BAG_CAP), depth + 1);
      } catch (e) {
        if (!(e instanceof Blocked)) throw e;
        blocked = blocked || e;
      }
    }
    if (blocked) throw blocked;
    return null;
  }
  function acquire(p, mat, target, depth) {
    if (depth > 80) throw new Error(`the way to ${matName(mat)} runs too deep`);
    // a material already found waiting is waiting down every other path too:
    // without this the passing-over walks every path through the tree to it
    if (waiting.has(mat)) throw waiting.get(mat);
    if (stack.has(mat)) throw new Loop(mat);
    stack.add(mat);
    path.push(mat);
    try {
      const a = lookFor(p, mat, target, depth);
      if (a && !a.why) a.why = path.slice();
      return a;
    } catch (e) {
      if (e instanceof Blocked) waiting.set(mat, e);
      throw e;
    } finally { stack.delete(mat); path.pop(); }
  }
  function lookFor(p, mat, target, depth) {
    if (isRaw(mat)) return mineFor(p, mat, target, depth);
    // what already stands made in a bin is the cheapest there is
    const want = Math.max(1, Math.min(10, target - have(p, mat)));
    const bin = p.machines.find((m) => m.buf && (m.buf.out[mat] || 0) >= want && SIM.hasCollectable(m));
    if (bin) return { type: 'collect', m: bin, mat };
    const rs = makers(p, mat);
    if (!rs.length) throw new Error(`nothing makes ${matName(mat)}`);
    let loop = null;
    for (const r of rs) {
      try { return makeWith(p, r, mat, target, depth); } catch (e) { if (!(e instanceof Loop)) throw e; loop = e; }
    }
    throw loop;
  }
  const minePrice = (p, ore) => (CHAIN.oreOpen(p, ore) ? CHAIN.priceExtraMine(ore) : CHAIN.priceNode(ore));
  // the keystrokes a second a hand types at this pace (the harness sets its
  // own when the switch is off)
  const cps = () => CPS[mode] || BOT.tune.CPS;
  // Wait, or build and type? Every source of what is short runs itself, and
  // an engine is not worked by hand, so the plan so far would stand and wait
  // for the engines to bring it. A player would not stand there: they would
  // put up another of the machine and type it out. So the wait is timed at
  // the engines' own rate against the build (its walk, its price made from
  // scratch) and the typing, and whichever has it in the bag sooner is what
  // the operator does. The engines work on through the build, so the
  // comparison only ever errs toward waiting.
  function handsSooner(short, engines, secsPerUnit, price, ksPerUnit) {
    if (short <= 0 || !engines) return false;
    const waitS = (short * secsPerUnit) / engines;
    const priceKs = Object.entries(price || {}).reduce((a, [mat, q]) => a + q * unitCost(mat), 0);
    return BOT.tune.BUILD_S + (priceKs + short * ksPerUnit) / cps() < waitS;
  }
  function mineFor(p, ore, target, depth) {
    const mines = CHAIN.machinesOfOre(p, ore);
    const price = minePrice(p, ore) || {};
    const full = mines.slice().sort((a, b) => ((b.buf && b.buf.out[ore]) || 0) - ((a.buf && a.buf.out[ore]) || 0))[0];
    const inBin = (full && full.buf && full.buf.out[ore]) || 0;
    // Every mine of it runs itself. Another is worth its price while the
    // game still asks for a bag's worth per mine standing, or whenever it
    // would have the ore in the bag sooner than the engines (handsSooner).
    // Paid from the bag; where the price is the very ore that is short, else
    // saved up in the fullest bin (which is not nibbled at meanwhile) and
    // collected whole.
    const engines = mines.filter((m) => live(p, m)).length;
    if (BOT.tune.ENGINES && mines.length && engines === mines.length && mineRoom(p, ore)) {
      const binned = mines.reduce((a, m) => a + ((m.buf && m.buf.out[ore]) || 0), 0);
      const short = target - have(p, ore) - binned;
      const own = Object.keys(price).includes(ore);
      if ((own && (left[ore] || 0) >= EXTRA_MINE_AT * mines.length)
        || handsSooner(short, engines, CHAIN.rateOf({ kind: 'mine' }, null), price, 1)) {
        if (CHAIN.affordable(p.bag, price)) { saving.delete(ore); return { type: 'build', kind: 'mine', ore }; }
        if (!own) return buildMine(p, ore, depth);
        if (inBin >= Math.max(1, (price[ore] || 0) - have(p, ore))) { saving.set(ore, price[ore]); return { type: 'collect', m: full, mat: ore }; }
        throw new Blocked({ type: 'wait', m: full, mat: ore });
      }
    }
    saving.delete(ore);
    // what an engine has already made is the cheapest there is
    if (inBin >= Math.max(1, Math.min(10, target - have(p, ore)))) return { type: 'collect', m: full, mat: ore };
    const hand = mines.find((m) => !live(p, m));
    if (hand) return { type: 'work', m: hand, mat: ore, target: lot(p, ore, target) };
    if (mines.length && Object.keys(price).includes(ore)) throw new Blocked({ type: 'wait', m: full, mat: ore });
    return buildMine(p, ore, depth);
  }
  const EXTRA_MINE_AT = 200;         // ore still wanted, per mine standing, before another goes up
  const saving = new Map();          // ore → the price of another mine, collected for it and not to be spent on anything else
  function buildMine(p, ore, depth) {
    if (!mineRoom(p, ore)) throw new Error((T.t('botWhy') || {})[CHAIN.onPool(ore) ? 'pool' : 'vein']({ mat: matName(ore), kind: mineName(ore) }));
    const price = minePrice(p, ore);
    if (!price && !CHAIN.mineFree(ore)) throw new Error(`${mineName(ore)} cannot be built`);
    return need(p, price, depth) || { type: 'build', kind: 'mine', ore };
  }
  function buildMachine(p, kind, r, depth) {
    const price = CHAIN.priceMachine(kind, CHAIN.machinesOfKind(p, kind).length + 1) || {};
    return need(p, price, depth) || { type: 'build', kind, r };
  }
  // a machine stood up for a piped recipe is kept for it from the start
  function noteBuilt(m, a) {
    if (m && a && a.r && piped(a.r)) roles.set(m.id, a.r.lesson);
    noRoute.clear();                 // new ground, new routes
  }
  // can a material be made with what already stands: its mine, or its
  // machine and, all the way down, the same for its inputs
  function reachable(p, mat, stackR = new Set()) {
    if (isRaw(mat)) return CHAIN.machinesOfOre(p, mat).length > 0;
    if (stackR.has(mat)) return false;
    stackR.add(mat);
    const r = mainMaker(mat);
    const ok = !!r && CHAIN.machinesOfKind(p, r.kind).length > 0 && Object.keys(r.in).every((i) => reachable(p, i, stackR));
    stackR.delete(mat);
    return ok;
  }
  // Upkeep before progress: engines, bought early. A machine that runs itself
  // makes its material while the hands are elsewhere, so every hand-worked
  // mine of an ore the game still asks for, and every recipe a processor
  // could run by itself, is priced against what it would spare: the
  // keystrokes the rest of the game would otherwise spend at it by hand. An
  // engine goes on as soon as its price can be made with what stands and
  // costs fewer keystrokes than it spares, the biggest saving first. A
  // processor's engine is per recipe, so the recipe is set before it is
  // bought, and a machine already running itself is left to it.
  function engineOptions(p) {
    const ksOf = (price) => Object.entries(price).reduce((a, [mat, q]) => a + Math.max(0, q - have(p, mat)) * unitCost(mat), 0);
    const out = [];
    for (const m of p.machines) {
      if (live(p, m)) continue;
      if (m.kind === 'mine') {
        const ore = CHAIN.mineMat(p, m), price = CHAIN.priceAuto(m, null, p);
        if (price && (left[ore] || 0) > 0) out.push({ m, r: null, price, saves: left[ore], ks: ksOf(price) });
        continue;
      }
      for (const r of CHAIN.offerableRecipes(m.kind, p)) {
        // one engine per recipe: a second would be bought against the same
        // demand, since what the first is making is not in the bag yet
        if (!CHAIN.inputsExist(r, p) || p.machines.some((x) => x !== m && live(p, x) && (SIM.recipeOf(p, x) || {}).out === r.out)) continue;
        const price = CHAIN.priceAuto(m, r, p);
        const units = Math.ceil((left[r.out] || 0) / (outsOf(r)[r.out] || 1));
        if (price && units > 0) out.push({ m, r, price, saves: units * CHAIN.perUnit(r), ks: ksOf(price) });
      }
    }
    return out.filter((o) => o.ks < o.saves && Object.keys(o.price).every((mat) => reachable(p, mat)))
      .sort((a, b) => (b.saves - b.ks) - (a.saves - a.ks));
  }
  // the one mine of an ore the bag carries that the hands can still work, with
  // a vein of that ore still free
  function lastHands(p, m) {
    const ore = CHAIN.mineMat(p, m);
    return m.kind === 'mine' && carryable(ore) && CHAIN.machinesOfOre(p, ore).every((x) => x === m || live(p, x))
      && mineRoom(p, ore);
  }
  function upkeep(p) {
    if (!BOT.tune.ENGINES) return null;
    // runs first: an engine that wants what another engine makes gets the
    // run as soon as both stand, not when its bin happens to run dry
    for (const m of p.machines) {
      if (m.kind === 'mine' || !live(p, m)) continue;
      const r = SIM.recipeOf(p, m);
      if (!r) continue;
      for (const i of Object.keys(r.in)) {
        if (!carryable(i) || runBringing(p, m, i)) continue;
        const src = engineOf(p, i, m);
        if (src) return { type: 'pipe', from: src, to: m, mat: i };
      }
    }
    for (const o of engineOptions(p)) {
      try {
        // An engine on the last mine of an ore the hands can work leaves
        // nothing to type that ore at, and the next mine is priced in it: the
        // operator would stand at the engine waiting for its bin to pay. A
        // player puts the next mine down first and types there, so while a
        // vein of it is free, that is what goes up before the engine does.
        if (!o.r && lastHands(p, o.m)) return buildMine(p, CHAIN.mineMat(p, o.m), 0);
        const short = need(p, o.price, 0);
        if (short) return short;
        if (o.r && o.m.recipe !== o.r.out) return { type: 'recipe', m: o.m, r: o.r };
        return { type: 'auto', m: o.m, r: o.r };
      } catch (e) { if (!(e instanceof Blocked)) throw e; }
    }
    return null;
  }
  // a machine of the recipe's kind to work it at: one kept for it, for a piped
  // recipe (or a free one, which it then keeps), else any free one, the one
  // already set to it first
  function machineFor(p, r) {
    const ms = p.machines.filter((m) => m.kind === r.kind);
    const free = (m) => !roles.has(m.id) && !live(p, m);
    if (piped(r)) {
      const kept = ms.find((m) => roles.get(m.id) === r.lesson);
      if (kept) return kept;
      const m = ms.find((x) => free(x) && !SIM.beltsTo(p, x).length && !SIM.beltsFrom(p, x).length);
      if (m) roles.set(m.id, r.lesson);
      return m || null;
    }
    return ms.find((m) => free(m) && m.recipe === r.out) || ms.find(free) || null;
  }
  // make `mat` with `r` until the bag holds `target`, or as much of that as
  // one trip's inputs fit in the bag
  function makeWith(p, r, mat, target, depth) {
    target = lot(p, mat, target);
    const outQ = outsOf(r)[mat] || 1;
    const runIn = Object.keys(r.in).filter((i) => !carryable(i));
    // an engine already at it is fed and waited on; while it works, hands
    // help at a free machine of the kind, if one stands
    const engine = p.machines.find((x) => x.kind === r.kind && live(p, x) && (SIM.recipeOf(p, x) || {}).out === r.out);
    if (engine) {
      try { return tend(p, engine, r, mat, target, depth); } catch (e) {
        if (!(e instanceof Blocked)) throw e;
        if (!machineFor(p, r)) {
          // no free machine to help at: only the wait on this engine's own
          // work is weighed against another machine (a wait further down is
          // that material's to weigh), and a machine a run feeds is the
          // runs' question, not this one
          if (e.a.m !== engine || e.a.mat !== mat || piped(r)) throw e;
          const outQ = outsOf(r)[mat] || 1;
          const engines = p.machines.filter((x) => x.kind === r.kind && live(p, x) && (SIM.recipeOf(p, x) || {}).out === r.out);
          const binned = engines.reduce((a, x) => a + ((x.buf && x.buf.out[mat]) || 0), 0);
          const price = CHAIN.priceMachine(r.kind, CHAIN.machinesOfKind(p, r.kind).length + 1);
          if (!handsSooner(target - have(p, mat) - binned, engines.length, CHAIN.rateOf(engine, r) / outQ, price, CHAIN.perUnit(r) / outQ)) throw e;
          try { return buildMachine(p, r.kind, r, depth); } catch (e2) { if (e2 instanceof Blocked) throw e; throw e2; }
        }
      }
    }
    const m = machineFor(p, r);
    if (!m) {
      // the far end of every run first, so this machine can be stood where
      // its runs will reach it
      for (const f of runIn) if (!producerOf(p, f)) { const s = source(p, f, depth); if (s.action) return s.action; }
      return buildMachine(p, r.kind, r, depth);
    }
    SIM.ensureMachine(m);
    let units = Math.ceil((target - have(p, mat)) / outQ);
    for (const [i, q] of Object.entries(r.in)) if (carryable(i)) units = Math.min(units, Math.floor(TUNE().BAG_CAP / q));
    units = Math.max(1, units);
    const short = need(p, restock(p, r, m, units), depth);
    if (short) return short;
    for (const f of runIn) { const a = feed(p, r, m, f, depth); if (a) return a; }
    if (m.recipe !== r.out) return { type: 'recipe', m, r };
    return { type: 'work', m, r, mat, target: Math.min(TUNE().BAG_CAP, have(p, mat) + units * outQ) };
  }
  // A run from one engine to another is the price of a walk: it saves a
  // collect and a load per bin-full for the rest of the game and costs an
  // outlet, so wherever an engine wants what another engine makes, the run
  // is laid before anything is carried. One the game would refuse (ports
  // taken, the consumer not taking it, no way over the ground where there
  // is ground to ask) or has refused once is not asked for again.
  const noRoute = new Set();
  function linkable(p, from, to) {
    if (!from || !to || noRoute.has(from.id + '|' + to.id) || !SIM.canLink(p, from, to).ok) return false;
    if (!window.FACTORY || FACTORY.routeBelt(from, to, p)) return true;
    noRoute.add(from.id + '|' + to.id);          // until the ground changes (noteBuilt)
    return false;
  }
  // an engine making `mat` with an outlet to spare, from which a run would reach `to`
  const engineOf = (p, mat, to) => p.machines.find((x) => x !== to && live(p, x) && SIM.produces(p, x).includes(mat) && freeOutlet(p, x) && linkable(p, x, to)) || null;
  // is `mat` already coming to `to` down a run
  const runBringing = (p, to, mat) => p.belts.some((b) => b.to === to.id && (() => { const s = SIM.machineById(p, b.from); return !!s && SIM.produces(p, s).includes(mat); })());
  // keep an engine of `r` going: take what it has made when there is enough
  // to be worth the walk, bring what its bins lack and load it, feed its
  // runs, and otherwise wait on it
  function tend(p, m, r, mat, target, depth) {
    SIM.ensureMachine(m);
    const cap = TUNE().BUFFER_CAP, made = m.buf.out[mat] || 0;
    if (made > 0 && SIM.hasCollectable(m) && (made >= Math.min(cap, Math.max(1, target - have(p, mat))) || SIM.state(p, m) === 'full')) return { type: 'collect', m, mat };
    let units = Math.max(1, Math.ceil((target - have(p, mat)) / (outsOf(r)[mat] || 1)));
    for (const [i, q] of Object.entries(r.in)) if (carryable(i)) units = Math.min(units, Math.floor(cap / q));
    const short = {};
    let load = false;
    for (const [i, q] of Object.entries(r.in)) {
      if (!carryable(i) || (m.buf.in[i] || 0) >= q) continue;   // it can run a unit on that
      if (runBringing(p, m, i)) continue;                        // on its way down a run
      const src = engineOf(p, i, m);
      if (src) return { type: 'pipe', from: src, to: m, mat: i };
      if (CHAIN.bagAvail(p.bag, i) >= q) load = true; else short[i] = q * Math.max(1, units) - (m.buf.in[i] || 0);
    }
    const a = need(p, short, depth);
    if (a) return a;
    if (load || Object.keys(short).length) return { type: 'feed', m, r };
    for (const g of Object.keys(r.in).filter((i) => !carryable(i))) { const f = feed(p, r, m, g, depth + 1); if (f) return f; }
    throw new Blocked({ type: 'wait', m, mat });
  }
  // the machine a material the bag cannot hold already comes from, if any
  function producerOf(p, f) {
    if (isRaw(f)) return CHAIN.machinesOfOre(p, f)[0] || null;
    const r = makers(p, f)[0];
    return (r && p.machines.find((m) => m.kind === r.kind && roles.get(m.id) === r.lesson)) || null;
  }
  // where a new run of a material the bag cannot hold comes from: a mine of
  // it, or a machine kept for a recipe that makes it, with an outlet free
  function source(p, f, depth) {
    if (depth > 80) throw new Error(`the way to ${matName(f)} runs too deep`);
    if (isRaw(f)) {
      const m = CHAIN.machinesOfOre(p, f).find((x) => freeOutlet(p, x));
      return m ? { m } : { action: buildMine(p, f, depth) };
    }
    const r = makers(p, f)[0];
    if (!r) throw new Error(`nothing makes ${matName(f)}`);
    for (const g of Object.keys(r.in).filter((i) => !carryable(i))) { const s = source(p, g, depth + 1); if (s.action) return s; }
    const kept = p.machines.find((m) => m.kind === r.kind && roles.get(m.id) === r.lesson && freeOutlet(p, m));
    if (kept) return { m: kept };
    const m = p.machines.find((x) => x.kind === r.kind && !roles.has(x.id) && !live(p, x) && !SIM.beltsTo(p, x).length && !SIM.beltsFrom(p, x).length);
    if (m) { roles.set(m.id, r.lesson); return { m }; }
    return { action: buildMachine(p, r.kind, r, depth) };
  }
  // get enough of `f` into machine `m` for one unit of `r`
  function feed(p, r, m, f, depth) {
    const q = r.in[f];
    if ((m.buf.in[f] || 0) >= q) return null;
    const carries = (b) => { const s = SIM.machineById(p, b.from); return !!s && SIM.produces(p, s).includes(f); };
    const runs = p.belts.filter((b) => b.to === m.id && carries(b));
    if (!runs.length) {
      const s = source(p, f, depth);
      if (s.action) return s.action;
      // a recipe is only offered once its inputs have been held, and a run
      // only lies to a machine whose recipe takes what it carries
      if (!CHAIN.matExists(p, f)) return make(p, s.m, f, depth);
      if (m.recipe !== r.out) return { type: 'recipe', m, r };
      return { type: 'pipe', from: s.m, to: m, mat: f };
    }
    let coming = 0;
    for (const b of runs) {
      const s = SIM.machineById(p, b.from);
      coming += b.items.filter((it) => it.mat === f).length + ((s.buf && s.buf.out[f]) || 0);
    }
    if (coming >= q) throw new Blocked({ type: 'wait', m, mat: f });
    // a source the hands can pump
    for (const b of runs) {
      const s = SIM.machineById(p, b.from);
      if (!live(p, s) && ((s.buf && s.buf.out[f]) || 0) < TUNE().BUFFER_CAP) return make(p, s, f, depth);
    }
    // only engines feed it, and they are behind: where an inlet is free, a
    // second run the hands can pump, from a mine of it or a new one
    if (isRaw(f) && SIM.beltsTo(p, m).length < SIM.inletsOf(m)) {
      const hand = CHAIN.machinesOfOre(p, f).find((x) => !live(p, x) && freeOutlet(p, x));
      if (hand) return { type: 'pipe', from: hand, to: m, mat: f };
      if (mineRoom(p, f)) return buildMine(p, f, depth);
    }
    return make(p, SIM.machineById(p, runs[0].from), f, depth);
  }
  // fill a source machine with `f`: its bin, or the run leading out of it
  function make(p, src, f, depth) {
    SIM.ensureMachine(src);
    const full = (src.buf.out[f] || 0) >= TUNE().BUFFER_CAP;
    if (full || (live(p, src) && src.kind === 'mine')) throw new Blocked({ type: 'wait', m: src, mat: f });
    if (src.kind === 'mine') return { type: 'work', m: src, mat: f, fill: true };
    const r = CHAIN.recipesFor(src.kind).find((x) => roles.get(src.id) === x.lesson) || makers(p, f)[0];
    // a source that runs itself is kept fed rather than worked, at whatever
    // it is running
    if (live(p, src)) {
      const own = SIM.recipeOf(p, src);
      if (!own || !outsOf(own)[f]) throw new Blocked({ type: 'wait', m: src, mat: f });
      return tend(p, src, own, f, have(p, f) + TUNE().BUFFER_CAP, depth);
    }
    let units = 20;
    for (const [i, q] of Object.entries(r.in)) if (carryable(i)) units = Math.min(units, Math.floor(TUNE().BAG_CAP / q));
    const short = need(p, restock(p, r, src, Math.max(1, units)), depth);
    if (short) return short;
    for (const g of Object.keys(r.in).filter((i) => !carryable(i))) { const a = feed(p, r, src, g, depth + 1); if (a) return a; }
    if (src.recipe !== r.out) return { type: 'recipe', m: src, r };
    return { type: 'work', m: src, r, mat: f, fill: true };
  }

  // ---------- doing it ----------
  class Stuck extends Error {}
  const fails = new Map();
  const sigOf = (a) => [a.type, a.m && a.m.id, a.kind, a.ore, a.r && a.r.lesson, a.from && a.from.id, a.to && a.to.id].join('|');
  // one miss is noise (a card in the way, a step blocked); the same move
  // missing three times running is a wall, and the bot says what it hit
  function failed(a, why, words) {
    const k = sigOf(a), n = (fails.get(k) || 0) + 1;
    fails.set(k, n);
    console.warn('[bot] missed:', k, why);
    if (n >= 3) { const fn = (T.t('botWhy') || {})[why]; throw new Stuck(fn ? fn(words || {}) : why); }
  }
  const done = (a) => fails.delete(sigOf(a));
  const boxMid = (m) => { const b = CHAIN.machineBox(m); return [b.c0 + (b.w >> 1), b.r1 + 1]; };
  // The ore a machine of `kind` will be fed for `r`: the recipe's own raw
  // input, else the raw the same kind makes its inputs from, down the chain.
  // A smelter is asked for by the sheet it makes, not the ingot in between,
  // and it is the ingot's ore it stands by.
  function oreFor(kind, r, seen = new Set()) {
    if (!r || seen.has(r.lesson)) return null;
    seen.add(r.lesson);
    const ins = Object.entries(r.in).sort((x, y) => y[1] - x[1]).map(([i]) => i);
    for (const i of ins) if (isRaw(i) && carryable(i)) return i;
    for (const i of ins) { const rr = mainMaker(i); if (rr && rr.kind === kind) { const o = oreFor(kind, rr, seen); if (o) return o; } }
    return null;
  }
  // where an ore is: its mines, and the seats of its free veins, since a
  // mine will stand there
  function orePlaces(p, ore) {
    const seat = (n) => workTile(CHAIN.nodeSeat(n, 's'));
    return CHAIN.machinesOfOre(p, ore).map(boxMid).concat(CHAIN.unbuiltNodes(p).filter((n) => n.ore === ore).map(seat));
  }
  // Where a player would stand a machine, for a build move. One a run comes
  // into goes up where the run can reach it, beside its source. One that
  // eats an ore goes up at that ore, the nearest of its mines first (the
  // smelter by the ore patch; the operator is standing there anyway, with
  // the bag that paid for it). The rest go home, to the landing, while home
  // has ground with a lane round it within HOME tiles. Past that home is
  // full, and the next camp is started round the mine nearest home that has
  // such ground of its own, then the next mine out; only past every mine
  // does a machine go up wherever the operator stands.
  function spotFor(p, a) {
    const kind = a.kind, H = BOT.tune.HOME;
    const f = a.r ? Object.keys(a.r.in).find((i) => !carryable(i)) : null;
    const from = f ? producerOf(p, f) : null;
    if (from) return findSpot(p, kind, boxMid(from), from);
    const [px, py] = playerTile();
    const near = (ts) => ts.slice().sort((x, y) => (Math.abs(x[0] - px) + Math.abs(x[1] - py)) - (Math.abs(y[0] - px) + Math.abs(y[1] - py)));
    const ore = a.r ? oreFor(kind, a.r) : null;
    if (ore) for (const t of near(orePlaces(p, ore))) { const s = findSpot(p, kind, t, null, H); if (s) return s; }
    const sp = CHAIN.SPAWN || { x: 0, y: 0 }, home = [Math.floor(sp.x / TILE), Math.floor(sp.y / TILE)];
    const far = (t) => Math.abs(t[0] - home[0]) + Math.abs(t[1] - home[1]);
    const camps = p.machines.filter((m) => m.kind === 'mine').map(boxMid).filter((t) => far(t) > H).sort((x, y) => far(x) - far(y));
    for (const t of [home].concat(camps)) { const s = findSpot(p, kind, t, null, H); if (s) return s; }
    return findSpot(p, kind, playerTile(), null);
  }
  // stop typing at the end of a unit, never inside one: a unit's inputs are
  // paid at its first keystroke and lost if the operator walks off mid-unit
  function stopWhen(p, a) {
    const m = a.m, cap = TUNE().BUFFER_CAP;
    const enough = a.fill ? () => (m.buf.out[a.mat] || 0) >= cap : () => have(p, a.mat) >= a.target;
    if (m.kind === 'mine') return enough;
    return (acc, paid) => !paid && acc === 0 && (enough() || !SIM.canTake(p, m, a.r.in));
  }

  async function doWork(g, a, p) {
    const place = machineName(a.m);
    if (!(view() || {}).dock || view().dock.id !== 'm:' + a.m.id) say(T.t('botWalk', { place }));
    if (!(await goDock(g, a.m))) return failed(a, 'walk', { place });
    let v = view();
    if (a.r && v.recipe !== a.r.out) return;           // it is set to something else: the next plan says so
    if (!v.canType) { await wait(g, 500); return failed(a, 'stall', { place }); }
    const cps = CPS[mode], batch = mode === 'max';
    const until = stopWhen(p, a);
    const patience = (((a.r ? CHAIN.perUnit(a.r) : 1) + 12) / cps) * 1000 + 3000;
    const words = () => (a.fill ? T.t('botWorkFluid', { place, mat: matName(a.mat) })
      : T.t('botWork', { place, mat: matName(a.mat), have: have(p, a.mat), n: a.target }));
    MK_DEBUG.bot.type({ cps, batch, until });
    let mark = '', markAt = performance.now();
    try {
      for (;;) {
        await frame(); alive(g);
        v = view();
        if (!v || v.card || !v.dock || v.dock.id !== 'm:' + a.m.id) break;
        if (until(v.unit.acc, v.unit.paid, v.line[v.pos])) { done(a); break; }
        if (v.typing !== 'bot') MK_DEBUG.bot.type({ cps, batch, until });
        say(words());
        const now = performance.now();
        const s = have(p, a.mat) + ':' + v.unit.acc + ':' + (a.m.buf.out[a.mat] || 0);
        if (s !== mark) { mark = s; markAt = now; } else if (now - markAt > patience) { failed(a, 'stall', { place }); break; }
      }
    } finally { MK_DEBUG.bot.stopTyping(); }
  }
  async function doMenuRow(g, a, words, pick, why) {
    say(words);
    const place = machineName(a.m);
    if (!(await goDock(g, a.m))) return failed(a, 'walk', { place });
    if (!(await menuDo(g, pick))) return failed(a, why || 'menu', { place });
    done(a);
    return true;
  }
  async function doBuild(g, a, p) {
    const name = a.kind === 'mine' ? mineName(a.ore) : kindName(a.kind);
    say(T.t('botBuild', { place: name }));
    let s;
    if (a.kind === 'mine') s = findVein(p, a.ore);
    else s = spotFor(p, a);
    if (!s) return failed(a, a.kind === 'mine' ? (CHAIN.onPool(a.ore) ? 'pool' : 'vein') : 'site', { mat: matName(a.ore), kind: name });
    const before = new Set(p.machines.map((m) => m.id));
    const res = await place(g, s);
    if (res !== true) return failed(a, res, { place: name, kind: name });
    noteBuilt(p.machines.find((m) => !before.has(m.id)), a);
    done(a);
  }
  async function doPipe(g, a) {
    const from = machineName(a.from), to = machineName(a.to);
    say(T.t('botPipe', { from, to }));
    if (!(await goDock(g, a.from))) return failed(a, 'walk', { place: from });
    if (!(await menuDo(g, (r) => r.type === 'spool'))) return failed(a, 'menu', { place: from });
    if (!(await goDock(g, a.to))) { await hold(g, 'Space', HOLD); return failed(a, 'walk', { place: to }); }
    const ok = await waitFor(g, (v) => v.socket, 10);
    await hold(g, 'Space', HOLD);          // lays the run where it fits, drops the spool where it does not
    if (!ok) { noRoute.add(a.from.id + '|' + a.to.id); return failed(a, 'route', { to }); }
    done(a);
  }
  async function act(g, a, p) {
    console.info('[bot]', describe(a));
    if (a.type === 'done') { stopWith(T.t('botDone')); return; }
    if (a.type === 'work') return doWork(g, a, p);
    if (a.type === 'build') return doBuild(g, a, p);
    if (a.type === 'pipe') return doPipe(g, a);
    if (a.type === 'collect') return doMenuRow(g, a, T.t('botCollect', { place: machineName(a.m), mat: matName(a.mat) }), (r) => r.type === 'collect');
    if (a.type === 'recipe') {
      const ok = await doMenuRow(g, a, T.t('botRecipe', { place: machineName(a.m), mat: matName(a.r.out) }), (r) => r.type === 'recipe' && r.out === a.r.out);
      if (ok && piped(a.r)) roles.set(a.m.id, a.r.lesson);
      return;
    }
    if (a.type === 'complete') return doMenuRow(g, a, T.t('botFinish'), (r) => r.type === 'complete');
    if (a.type === 'auto') return doMenuRow(g, a, T.t('botAuto', { place: machineName(a.m) }), (r) => r.type === 'auto');
    if (a.type === 'feed') return doMenuRow(g, a, T.t('botLoad', { place: machineName(a.m) }), (r) => r.type === 'feed');
    if (a.type === 'wait') {
      say(T.t('botWaitFlow', { mat: matName(a.mat), place: machineName(a.m) }));
      if (!(await goDock(g, a.m))) return failed(a, 'walk', { place: machineName(a.m) });
      await wait(g, 700);
      return;
    }
    throw new Error('no move called ' + a.type);
  }
  // the plan as words, for the console and for BOT.plan()
  function describe(a) {
    if (!a) return null;
    return {
      type: a.type,
      machine: a.m ? machineName(a.m) + ' ' + a.m.id : undefined,
      build: a.type === 'build' ? (a.kind === 'mine' ? mineName(a.ore) : kindName(a.kind)) : undefined,
      recipe: a.r ? a.r.lesson + ' → ' + matName(a.r.out) : undefined,
      mat: a.mat ? matName(a.mat) : undefined,
      target: a.target, fill: a.fill || undefined,
      from: a.from ? machineName(a.from) + ' ' + a.from.id : undefined,
      to: a.to ? machineName(a.to) + ' ' + a.to.id : undefined,
      why: a.why ? a.why.map(matName).join(' › ') : undefined,
    };
  }

  // ---------- the loop ----------
  let lastProfile = null;
  async function step(g) {
    alive(g);
    const v = view();
    if (!v) { say(T.t('botNoWorld')); await wait(g, 600); return; }
    if (v.profile !== lastProfile) { lastProfile = v.profile; roles.clear(); saving.clear(); noRoute.clear(); fails.clear(); badSpots.clear(); }
    if (v.card) {
      if (!DISMISS.has(v.card)) { say(T.t('botPaused')); await wait(g, 600); return; }
      say(T.t('botCard'));
      await wait(g, (BEAT[mode] || 50) * 4);
      const b = document.getElementById('ov-continue');
      if (b && (view() || {}).card === v.card) b.click();
      await beat(g);
      return;
    }
    releaseAll();
    if (v.typing === 'bot') MK_DEBUG.bot.stopTyping();
    // whatever a move cut short left open is put away before the next one
    if (v.menu || v.buildMenu || v.placing) { await tap(g, 'Escape'); return; }
    if (v.spool) { await hold(g, 'Space', HOLD); return; }
    adoptRoles(v.profile);
    await act(g, plan(v.profile), v.profile);
  }
  async function run(g) {
    while (g === gen && mode !== 'off') {
      try {
        await step(g);
      } catch (e) {
        if (e === CANCEL) return;
        releaseAll();
        if (window.MK_DEBUG && MK_DEBUG.bot) MK_DEBUG.bot.stopTyping();
        console.error('[bot]', e);
        stopWith(T.t('botStuck', { why: e.message || String(e) }));
        return;
      }
    }
  }

  // ---------- the switch and the line ----------
  let btn = null, chip = null, chipTimer = null, said = '', btnSig = '';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function say(text) {
    if (!chip || mode === 'off') return;
    const pace = (T.t('botPace') || {})[mode];
    const html = `🤖 <b>${esc(pace || '')}</b> · ${esc(text)}`;
    if (html === said) return;
    said = html;
    if (chipTimer) { clearTimeout(chipTimer); chipTimer = null; }
    chip.innerHTML = html;
    chip.classList.remove('hidden');
  }
  function refreshButton() {
    if (!btn) return;
    const on = DEV.isEnabled();
    const pace = (T.t('botPace') || {})[mode] || '';
    const sig = [on, mode, pace, T.getLang()].join('|');
    if (sig === btnSig) return;
    btnSig = sig;
    btn.hidden = !on;
    btn.innerHTML = '<i></i>' + (mode === 'off' ? '' : `<span class="bot-pace">${esc(pace)}</span>`);
    btn.classList.toggle('btn-off', mode === 'off');
    btn.title = (T.t('botTitle') || {})[mode] || 'bot';
  }
  function setMode(next) {
    if (!MODES.includes(next)) next = 'off';
    if (next !== 'off' && (!DEV.isEnabled() || !window.MK_DEBUG || !MK_DEBUG.bot)) next = 'off';
    if (next === mode) return;
    mode = next;
    gen++;
    releaseAll();
    if (window.MK_DEBUG && MK_DEBUG.bot) MK_DEBUG.bot.stopTyping();
    console.info('[bot] mode:', mode);
    refreshButton();
    said = '';
    if (chip && mode === 'off') chip.classList.add('hidden');
    if (mode !== 'off') run(gen);
  }
  // off, with the reason left on the line for a while
  function stopWith(text) {
    setMode('off');
    if (!chip) return;
    chip.textContent = '🤖 ' + text;
    chip.classList.remove('hidden');
    chipTimer = setTimeout(() => chip.classList.add('hidden'), 9000);
  }
  const cycle = () => setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);

  // Ctrl+Alt+B cycles it. Any other real key while it plays is a player
  // reaching for the game, and the game is handed back; the other debug
  // chords (Ctrl+Alt+…) leave it playing. The bot's own key events are not
  // trusted events, which is how they are told apart.
  window.addEventListener('keydown', (e) => {
    if (!e.isTrusted) return;
    if (e.ctrlKey && e.altKey && e.code === 'KeyB') {
      if (DEV.isEnabled()) { e.preventDefault(); cycle(); }
      return;
    }
    if (mode === 'off' || e.ctrlKey || e.altKey || e.metaKey) return;
    if (/^(Shift|Control|Alt|Meta|OS|CapsLock)/.test(e.code)) return;
    stopWith(T.t('botTookKeys'));
  }, { capture: true });

  btn = document.getElementById('btn-bot');
  if (btn) btn.onclick = () => { btn.blur(); cycle(); };
  const host = document.getElementById('factory');
  if (host) {
    chip = document.createElement('div');
    chip.id = 'bot-status';
    chip.className = 'hidden';
    host.appendChild(chip);
  }
  refreshButton();
  // developer mode is ticked on and off in Settings: the switch follows it,
  // and the bot never outlives the box
  setInterval(() => { if (mode !== 'off' && !DEV.isEnabled()) setMode('off'); refreshButton(); }, 1000);

  window.BOT = {
    mode: () => mode, setMode, cycle,
    plan: () => { const v = view(); return v ? describe(plan(v.profile)) : null; },
    // the next move for any save, as the planner holds it: for a harness that
    // plays the plan out without a screen (see dev/bot-sim.js)
    planFor: (p) => { adoptRoles(p); return plan(p); },
    noteBuilt, describe,
    // where a machine would go up from a save, as doBuild would stand it:
    // for asking the map what the model makes of it without playing there
    spotFor: (p, a) => { const s = spotFor(p, a); return s && { kind: s.kind, at: s.at, face: s.face, stand: s.stand, lane: s.lane }; },
    outstanding,                   // what the rest of the game still asks for, for the harness's post-mortem
    // ENGINES off plays the old way, carrying everything and buying no
    // automation: the A/B for dev/bot-sim.js
    // HOME is how far from the landing, in tiles, a machine with no place of
    // its own still counts as at home
    // BUILD_S is the bot's guess at a build's seconds besides its price (the
    // walk, the menu, the aim), and CPS its pace with the switch off (the
    // harness), both for weighing a build against a wait (handsSooner)
    tune: { BATCH_KS, ENGINES: true, HOME: 8, BUILD_S: 25, CPS: CPS.wpm30 },
  };
})();
