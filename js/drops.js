// Loose materials on the ground, and the one door everything destroyed goes
// through. Global: DROPS
//
// Nothing that cost materials is ever simply deleted. Take a machine down,
// take a run up, and what it cost — with everything standing in its buffers
// and every good riding its belts — bursts out of it in a soft poof and
// lands on the ground inside the tile it stood on. There it sits. It never
// expires and nothing ever sweeps it away: the ground is a bag with no lid,
// and there is no hurry. Walk near and a generous magnet draws it in; it
// arrives with the same pop and the same flight the goods make when they are
// typed out of a machine, because it is the same reward.
//
// Everything destructible goes through DROPS.demolish, and anything added
// later must too. That is the whole point of the file: the refund, the
// insides, the goods on the runs, the poof and the sound are one behaviour
// in one place, not a rule every new kind has to remember. A caller that
// only wants the ground half — a machine that spits its buffer out, say —
// calls DROPS.scatter and gets the same landing.
(function () {
  'use strict';

  const TILE = 16;
  // The toss: a good is thrown up, not away. Gravity and the drag on the
  // bounce are set so a hop lasts about half a second and carries a few
  // pixels; SPREAD is the hard limit, so nothing ever leaves the tile.
  const SPREAD = 13;             // world px from the burst, never further
  const G = 190;                 // px/s² down
  const BOUNCE = 0.34, DRAG = 0.55;
  const STACKS = 4;              // a price of sixty comes out as a handful, not as sixty
  // The magnet is deaf while a good is still in the air and for a beat after
  // it lands, so the burst is seen before it is swept up. Without the pause
  // an operator standing at the machine they just took down never sees the
  // materials at all — they are in the bag before the first frame draws.
  const SETTLE_MS = 380;
  // Generous on purpose: nearly three tiles of reach, a tug at the edge and
  // a snap up close, so a heap is collected by walking past it rather than
  // by standing on each piece.
  const PULL = 44, GRAB = 7, PULL_MIN = 26, PULL_MAX = 320;
  const CHEST = 8;               // goods fly to the operator's middle, not their boots
  const MAX_DT = 100;            // a long frame never teleports a good across the map

  const C = () => window.CHAIN;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // a resting good carries nothing but what it is and where it is, so the
  // save stays small; the jitter on its magnet is read off its id instead of
  // stored, and so is the wobble the world draws it with
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const jitterOf = (d) => 0.85 + (hash(d.id) % 100) / 300;

  function ensure(p) {
    if (!p) return null;
    if (!Array.isArray(p.drops)) p.drops = [];
    if (typeof p.nextDropId !== 'number') p.nextDropId = 1;
    p.drops = p.drops.filter((d) => d && d.mat && d.n > 0);
    return p.drops;
  }

  // ---------- the ground ----------
  // one good, tossed up from (wx, wy) and left wherever it lands
  function spawn(p, mat, n, wx, wy) {
    ensure(p);
    const a = Math.random() * Math.PI * 2, s = rnd(12, 30);
    const d = {
      id: 'd' + (p.nextDropId++), mat, n: Math.max(1, Math.round(n)),
      x: wx, y: wy, ox: wx, oy: wy,
      // the world is seen from slightly above, so the same throw covers less
      // ground away from the eye than across it
      z: 1, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: rnd(34, 54),
      settle: SETTLE_MS,
    };
    p.drops.push(d);
    return d;
  }
  // a whole bundle ({mat: n}) tossed out of one place. Each material comes
  // out as a few stacks rather than as one icon per unit: sixty ore is a
  // spray of four, and the spray is what reads as a refund.
  function scatter(p, bundle, wx, wy) {
    ensure(p);
    let made = 0;
    for (const [mat, n] of Object.entries(bundle || {})) {
      const total = Math.round(n);
      if (!(total > 0)) continue;
      const k = Math.max(1, Math.min(STACKS, total));
      let left = total;
      for (let i = 0; i < k; i++) {
        const take = i === k - 1 ? left : Math.floor(total / k);
        left -= take;
        if (take > 0) { spawn(p, mat, take, wx, wy); made++; }
      }
    }
    return made;
  }

  // ---------- where a thing stands ----------
  // the box the body covers, in world pixels — CHAIN.machineBox already
  // knows the facing, so a body turned sideways poofs sideways too. The
  // refund bursts from its foot, which is where the operator is standing.
  function machineBox(m) {
    const b = C().machineBox(m);
    return { x: b.c0 * TILE + 1, y: b.r0 * TILE - 4, w: b.w * TILE - 2, h: b.h * TILE + 4, foot: (b.r1 + 1) * TILE - 5 };
  }
  // world position of a good riding a run at a fractional path index. The
  // run's own drawing walks corners on an arc; this reads the straight line
  // between two tile centres, which is inside the same tile either way and
  // is all a good needs to know about where to fall.
  function beltPos(b, pos) {
    const path = b.path || [];
    if (!path.length) return null;
    const i = Math.max(0, Math.min(path.length - 1, Math.floor(pos)));
    const j = Math.min(path.length - 1, i + 1);
    const t = Math.max(0, Math.min(1, pos - i));
    return [(path[i][0] + (path[j][0] - path[i][0]) * t) * TILE + TILE / 2,
      (path[i][1] + (path[j][1] - path[i][1]) * t) * TILE + TILE / 2];
  }
  // a run poofs along its whole length, not at one end — but a long run
  // would be a wall of smoke, so the puffs are sampled down to a handful
  function beltBoxes(b) {
    const path = b.path || [];
    const step = Math.max(1, Math.ceil(path.length / 5));
    const out = [];
    for (let i = 0; i < path.length; i += step) out.push({ x: path[i][0] * TILE, y: path[i][1] * TILE, w: TILE, h: TILE });
    return out;
  }
  // the goods on a run fall where they ride: no flight back to the machine
  // they came from, just a hop in place, as if the ground went out from
  // under them
  function spillBelt(p, b) {
    for (const it of b.items || []) {
      const at = beltPos(b, it.pos);
      if (at) spawn(p, it.mat, 1, at[0], at[1]);
    }
    b.items = [];
  }

  // ---------- the one door ----------
  // what: {machine: m, back?: {mat: n}}
  //     | {belt: b, back?: {mat: n}}
  //     | {belts: [b, …], back?: {mat: n}}
  // Returns {bundle, spilled} — what went on the ground and how many pieces
  // it came out as — so a caller can say something about it if it wants to.
  // The poof and its sound happen here, once, for every kind of thing there
  // will ever be — and once for the whole call, so several runs coming apart
  // together sound like one thing coming apart, the way a machine and all of
  // its runs already do.
  function demolish(p, what) {
    if (!p || !what) return null;
    ensure(p);
    const boxes = [], bundle = {};
    const add = (o) => { for (const [mat, n] of Object.entries(o || {})) if (n > 0) bundle[mat] = (bundle[mat] || 0) + n; };
    add(what.back);
    const before = p.drops.length;
    let burst = null;

    if (what.machine) {
      const m = what.machine;
      if (window.SIM) SIM.ensureMachine(m);
      // its insides come out with it: an input buffer half full of ore is
      // ore the operator paid for, and it is standing right there
      if (m.buf) { add(m.buf.in); add(m.buf.out); m.buf.in = {}; m.buf.out = {}; }
      // its runs come up with it, and every good riding one falls on the spot
      const runs = (p.belts || []).filter((b) => b.from === m.id || b.to === m.id);
      for (const b of runs) { spillBelt(p, b); boxes.push(...beltBoxes(b)); }
      if (runs.length) p.belts = p.belts.filter((b) => !runs.includes(b));
      const box = machineBox(m);
      boxes.unshift(box);
      burst = { x: box.x + box.w / 2, y: box.foot - 6 };
      const i = p.machines.indexOf(m);
      if (i >= 0) p.machines.splice(i, 1);
    } else if (what.belt || what.belts) {
      const runs = (what.belts || [what.belt]).filter(Boolean);
      if (!runs.length) return null;
      for (const b of runs) { spillBelt(p, b); boxes.push(...beltBoxes(b)); }
      p.belts = (p.belts || []).filter((x) => !runs.includes(x));
    } else {
      return null;
    }

    if (!burst && boxes.length) burst = { x: boxes[0].x + boxes[0].w / 2, y: boxes[0].y + boxes[0].h / 2 };
    if (burst) scatter(p, bundle, burst.x, burst.y);
    poof(boxes);
    return { bundle, spilled: p.drops.length - before };
  }
  // the poof itself, guarded: the harnesses run this file with no world and
  // no sound, and a demolition still has to work there
  function poof(boxes) {
    if (window.FACTORY && FACTORY.poof) for (const b of boxes.slice(0, 6)) FACTORY.poof(b.x, b.y, b.w, b.h);
    if (window.AUDIO && AUDIO.poof) AUDIO.poof();
  }

  // ---------- the clock: settling, the magnet, the pickup ----------
  // Returns the goods collected this tick as [{mat, n, x, y}], or null. The
  // caller banks them — this file never touches the bag, so the flight into
  // the HUD and the pop stay where the rest of the bag's feedback lives.
  // canTake(mat), when given, keeps a stack lying where it is instead of
  // pulling it in — the full-of-that bag walks over its own spill without
  // churning it (the bag cap, 2026-08-22)
  function tick(p, dtMs, px, py, canTake) {
    const list = ensure(p);
    if (!list || !list.length) return null;
    const ms = Math.min(MAX_DT, Math.max(0, dtMs));
    const dt = ms / 1000;
    if (dt <= 0) return null;
    const live = typeof px === 'number' && typeof py === 'number';
    const tx = px, ty = py - CHEST;
    let got = null;
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i];
      // in the air: an arc, a bounce, and a stop. When it stops it forgets
      // it ever moved, and what is saved is a material at a place.
      if (d.z || d.vz) {
        d.vz -= G * dt;
        d.z += d.vz * dt;
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.z <= 0) {
          d.z = 0;
          if (Math.abs(d.vz) < 14) { d.vz = 0; d.vx = 0; d.vy = 0; }
          else { d.vz = -d.vz * BOUNCE; d.vx *= DRAG; d.vy *= DRAG; }
        }
        const ax = d.x - d.ox, ay = d.y - d.oy, r0 = Math.hypot(ax, ay);
        if (r0 > SPREAD) {
          const s = SPREAD / r0;
          d.x = d.ox + ax * s; d.y = d.oy + ay * s;
          d.vx *= -0.2; d.vy *= -0.2;
        }
        if (!d.z && !d.vz) { delete d.z; delete d.vx; delete d.vy; delete d.vz; delete d.ox; delete d.oy; }
        continue;
      }
      if (d.settle) { d.settle = Math.max(0, d.settle - ms); if (!d.settle) delete d.settle; continue; }
      if (!live) continue;
      if (canTake && !canTake(d.mat)) continue;   // a full back leaves the pile lying
      const dx = tx - d.x, dy = ty - d.y;
      const r = Math.hypot(dx, dy);
      if (r > PULL) continue;
      if (r > 0.001) {
        // a tug at the edge of the field, a snap at the middle of it
        const near = 1 - r / PULL;
        const v = (PULL_MIN + (PULL_MAX - PULL_MIN) * near * near) * jitterOf(d);
        const step = Math.min(r, v * dt);
        d.x += (dx / r) * step; d.y += (dy / r) * step;
      }
      if (Math.hypot(tx - d.x, ty - d.y) <= GRAB) {
        list.splice(i, 1);
        (got || (got = [])).push({ mat: d.mat, n: d.n, x: d.x, y: d.y });
      }
    }
    return got;
  }

  const count = (p) => (p && Array.isArray(p.drops) ? p.drops.length : 0);

  window.DROPS = { ensure, spawn, scatter, demolish, tick, count, TILE, SPREAD, PULL, GRAB };
})();
