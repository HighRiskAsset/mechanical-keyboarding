// The factory simulation (tech tree v3, phase 3). Global: SIM
//
// Machines have insides: an input buffer per material and an output buffer.
// Automated mines yield into their output buffer on the clock; automated
// processors run timed jobs from their input buffers; belts carry items from
// one machine's outlet to another's inlet, one item per tile, at a fixed
// speed. Everything here runs in real time (invariant 1, amended 2026-08-18:
// mastered production runs on the clock; idle is bounded by buffer caps).
// The player's hands are handled by app.js (a worked machine uses its own
// buffers first, then the bag; its output rolls onto an exit belt if one
// exists, else into the bag). Nothing here knows a letter.
(function () {
  'use strict';

  const C = () => window.CHAIN;
  const T = () => C().TUNING;
  const CAP = () => T().BUFFER_CAP;
  const MAX_CATCHUP_MS = 6 * 60 * 60 * 1000;   // fast-forward at most six hours of absence
  const CATCHUP_STEP_MS = 500;

  // ---------- shape ----------
  function ensureMachine(m) {
    if (!m.buf) m.buf = { in: {}, out: {} };
    if (!m.buf.in) m.buf.in = {};
    if (!m.buf.out) m.buf.out = {};
    if (m.job === undefined) m.job = null;
    if (typeof m.acc !== 'number') m.acc = 0;
    // which way it faces (ports, below). A save from before machines turned
    // rigidly carries `rot` — a step through the discharge sides s, e, w —
    // and keeps the side it discharged on as its facing.
    if (!FACINGS.includes(m.face)) {
      m.face = ['s', 'e', 'w'][m.rot | 0] || 's';
      delete m.rot;
    }
  }
  function ensure(p) {
    for (const m of p.machines) ensureMachine(m);
    if (!Array.isArray(p.belts)) p.belts = [];
    if (typeof p.nextBeltId !== 'number') p.nextBeltId = 1;
    if (typeof p.lastTick !== 'number') p.lastTick = Date.now();
    // belts whose ends are gone (a machine removed) are gone too
    p.belts = p.belts.filter((b) => machineById(p, b.from) && machineById(p, b.to) && Array.isArray(b.path) && b.path.length >= 2);
    for (const b of p.belts) if (!Array.isArray(b.items)) b.items = [];
  }
  const machineById = (p, id) => p.machines.find((m) => m.id === id) || null;
  const beltsFrom = (p, m) => p.belts.filter((b) => b.from === m.id);
  const beltsTo = (p, m) => p.belts.filter((b) => b.to === m.id);
  const outletsOf = (m) => (m.kind === 'mine' ? T().OUTLETS.mine : T().OUTLETS.processor);
  const inletsOf = (m) => C().KINDS[m.kind].arity;

  // ---------- ports: the sides a run may meet a machine on ----------
  // A run used to end wherever it could reach, so a machine's traffic said
  // nothing about the machine. Now every inlet and every outlet stands at
  // one named place on the ring of tiles around the body, and a run has to
  // arrive there. What a machine takes and what it gives is then something
  // you read off the ground before you lay anything.
  //
  // Ports are body-relative and turn rigidly with the machine (rotation
  // overhaul, 2026-08-20). The whole front discharges; deliveries fill the
  // machine's own right flank to the brim, then its left; the back carries
  // nothing. A body two across and two deep, facing front (s), gives six
  // places for four ports:
  //
  //        [r1] [ B O D Y ] [l1]      (behind: the portless back)
  //        [r0] [ B O D Y ] [l0]      the row it stands on
  //             [f0] [f1]             the row in front of it
  //
  // A quarter turn clockwise steps the facing s → w → n → e, and every port
  // steps with it — a pipe leaving at the bottom leaves on the left after
  // one turn. Turned sideways the body itself turns too: footprintOf swaps
  // across and deep, and a facing whose ports come up behind the body (the
  // n rows) is legal — the ground plates and the doors high on the sprite
  // keep it readable (DESIGN.md).
  //
  // This is what sets a kind's size (chain.js). A flank of a one-deep body
  // is a single tile, so a one-deep machine can only ever have one outlet:
  // the mine, and nothing else. The Manufacturer's fifth port is why it is
  // three across — its front holds three places.
  const FACINGS = ['s', 'w', 'n', 'e'];         // a clockwise quarter each
  const sizeOf = (m) => (C().KINDS[m.kind] || {}).size || [2, 2];
  const faceOf = (m) => (m && FACINGS.includes(m.face)) ? m.face : 's';
  const facingOf = faceOf;                      // the side the product leaves by
  const footprintOf = (m) => window.MAPKIT.footprint(sizeOf(m), faceOf(m));
  const nextFacing = (m) => FACINGS[(FACINGS.indexOf(faceOf(m)) + 1) % 4];
  const turn = (m) => { m.face = nextFacing(m); return m.face; };
  // every port of a machine, in order: its body side (f/r/l + slot) and the
  // world side that lands on at this facing. factory.js turns these into
  // tiles; nothing here knows where the machine stands. A kind whose size
  // cannot seat all its ports comes back short, and dev/sim.html says so
  // rather than letting it reach the map.
  function ports(m) {
    const face = faceOf(m), [across, deep] = sizeOf(m);
    const world = window.MAPKIT.BODY_SIDE[face];
    const room = { f: across, r: deep, l: deep };
    const out = [], inn = [];
    for (let i = 0; i < outletsOf(m) && i < room.f; i++) out.push({ side: 'f', slot: i, face: world.f, dir: 'out', i });
    let i = 0;
    for (const bs of ['r', 'l']) {
      for (let s = 0; s < room[bs] && i < inletsOf(m); s++, i++) inn.push({ side: bs, slot: s, face: world[bs], dir: 'in', i });
    }
    return { out, in: inn };
  }

  // ---------- recipes, inputs, outputs ----------
  // the recipe a machine runs by itself: its chosen one, else the first it offers
  function recipeOf(p, m) {
    if (m.kind === 'mine') return null;
    const offered = C().offerableRecipes(m.kind, p);
    if (!offered.length) return null;
    if (m.recipe) {
      const r = offered.find((x) => x.out === m.recipe && (!m.recipeIn || JSON.stringify(x.in) === m.recipeIn));
      if (r) return r;
    }
    return offered[0];
  }
  // materials a machine takes in through its inlets: its recipe's inputs
  function accepts(p, m) {
    const r = recipeOf(p, m);
    return r ? Object.keys(r.in) : [];
  }
  // materials a machine can send down a belt
  function produces(p, m) {
    if (m.kind === 'mine') return [m.ore];
    const set = new Set();
    for (const r of C().offerableRecipes(m.kind, p)) set.add(r.out);
    for (const mat of Object.keys(m.buf ? m.buf.out : {})) if ((m.buf.out[mat] || 0) > 0) set.add(mat);
    return [...set];
  }
  // may a belt run from → to: outlets/inlets free, and the consumer takes
  // something the source makes
  function canLink(p, from, to) {
    if (!from || !to || from === to) return { ok: false, why: 'same' };
    if (beltsFrom(p, from).length >= outletsOf(from)) return { ok: false, why: 'outlets' };
    if (beltsTo(p, to).length >= inletsOf(to)) return { ok: false, why: 'inlets' };
    if (p.belts.some((b) => b.from === from.id && b.to === to.id)) return { ok: false, why: 'exists' };
    const wants = accepts(p, to), makes = produces(p, from);
    if (!makes.some((mat) => wants.includes(mat))) return { ok: false, why: 'material' };
    return { ok: true };
  }
  function addBelt(p, from, to, path) {
    const b = { id: 'b' + (p.nextBeltId++), from: from.id, to: to.id, path, items: [] };
    p.belts.push(b);
    return b;
  }
  // There is no removeBelt here, and there was one until 2026-08-21. It took
  // a run out of the save and rolled the goods riding it back into the
  // machine they came from; nothing wants that any more. A run is taken up
  // through DROPS.demolish (js/drops.js) — the one door everything destroyed
  // goes through — which poofs it and lets its goods fall where they were
  // riding. Re-laying one after a turn is factory.js's business
  // (reconcileBelts), because only the world knows what the ground will take.
  const hasExit = (p, m) => beltsFrom(p, m).length > 0;

  // ---------- hands: buffers first, then the bag ----------
  // take n of mat for a worked machine; returns false (taking nothing) if the
  // machine's buffer and the bag together can't cover it
  function takeInput(p, m, cost) {
    ensureMachine(m);
    for (const [mat, n] of Object.entries(cost)) {
      if ((m.buf.in[mat] || 0) + (p.bag[mat] || 0) < n) return false;
    }
    for (const [mat, n] of Object.entries(cost)) {
      const fromBuf = Math.min(n, m.buf.in[mat] || 0);
      if (fromBuf) m.buf.in[mat] -= fromBuf;
      if (n - fromBuf) p.bag[mat] = (p.bag[mat] || 0) - (n - fromBuf);
    }
    return true;
  }
  const canTake = (p, m, cost) => Object.entries(cost).every(([mat, n]) => ((m.buf && m.buf.in[mat]) || 0) + (p.bag[mat] || 0) >= n);
  // where a worked machine's output goes: an exit belt's buffer if one
  // exists (overflow to the bag when full), else the bag. Returns 'belt'|'bag'.
  function emit(p, m, mat, n) {
    ensureMachine(m);
    if (hasExit(p, m) && (m.buf.out[mat] || 0) < CAP()) {
      const room = CAP() - (m.buf.out[mat] || 0);
      const k = Math.min(room, n);
      m.buf.out[mat] = (m.buf.out[mat] || 0) + k;
      if (n - k > 0) p.bag[mat] = (p.bag[mat] || 0) + (n - k);
      return 'belt';
    }
    p.bag[mat] = (p.bag[mat] || 0) + n;
    return 'bag';
  }
  // collect a machine's output buffer into the bag; returns {mat: n}
  function collect(p, m) {
    ensureMachine(m);
    const got = {};
    for (const [mat, n] of Object.entries(m.buf.out)) {
      if (n <= 0) continue;
      p.bag[mat] = (p.bag[mat] || 0) + n;
      got[mat] = n;
      m.buf.out[mat] = 0;
    }
    return got;
  }
  // feed an automated machine's inputs from the bag (fill toward the cap);
  // returns {mat: n} moved
  function feed(p, m) {
    ensureMachine(m);
    const moved = {};
    for (const mat of accepts(p, m)) {
      const room = CAP() - (m.buf.in[mat] || 0);
      const k = Math.min(room, p.bag[mat] || 0);
      if (k <= 0) continue;
      m.buf.in[mat] = (m.buf.in[mat] || 0) + k;
      p.bag[mat] -= k;
      moved[mat] = k;
    }
    return moved;
  }
  const canFeed = (p, m) => accepts(p, m).some((mat) => (p.bag[mat] || 0) > 0 && ((m.buf && m.buf.in[mat]) || 0) < CAP());
  const hasOutput = (m) => !!m.buf && Object.values(m.buf.out).some((n) => n > 0);
  // a machine's state for the player's eye: 'off' | 'run' | 'starved' | 'full'
  function state(p, m) {
    ensureMachine(m);
    if (!m.auto) return 'off';
    if (m.kind === 'mine') return (m.buf.out[m.ore] || 0) >= CAP() ? 'full' : 'run';
    if (m.job) return 'run';
    const r = recipeOf(p, m);
    if (!r) return 'starved';
    if (Object.entries(r.in).every(([mat, n]) => (m.buf.in[mat] || 0) >= n)) return (m.buf.out[r.out] || 0) >= CAP() ? 'full' : 'run';
    return 'starved';
  }

  // ---------- the clock ----------
  let rr = 0;
  function step(p, dtMs) {
    ensure(p);
    const cap = CAP();
    // 1. automated mines yield on the clock
    const minePer = T().RATE.mine * 1000;
    for (const m of p.machines) {
      if (m.kind !== 'mine' || !m.auto) continue;
      m.acc += dtMs;
      while (m.acc >= minePer) {
        if ((m.buf.out[m.ore] || 0) >= cap) { m.acc = minePer; break; }   // full: wait
        m.acc -= minePer;
        m.buf.out[m.ore] = (m.buf.out[m.ore] || 0) + 1;
      }
    }
    // 2. automated processors run timed jobs from their buffers
    for (const m of p.machines) {
      if (m.kind === 'mine' || !m.auto) continue;
      if (m.job) {
        m.job.left -= dtMs;
        if (m.job.left <= 0) {
          if ((m.buf.out[m.job.out] || 0) < cap) { m.buf.out[m.job.out] = (m.buf.out[m.job.out] || 0) + 1; m.job = null; }
          else m.job.left = 0;   // stalled until the output is taken
        }
      }
      if (!m.job) {
        const r = recipeOf(p, m);
        if (r && Object.entries(r.in).every(([mat, n]) => (m.buf.in[mat] || 0) >= n)) {
          for (const [mat, n] of Object.entries(r.in)) m.buf.in[mat] -= n;
          m.job = { out: r.out, left: (T().RATE[m.kind] || 4) * 1000 };
        }
      }
    }
    // 3. belts: items advance, the head delivers, the tail loads
    const adv = T().BELT_SPEED * dtMs / 1000;
    const order = p.belts.slice();
    if (order.length > 1) { const k = (rr++) % order.length; order.push(...order.splice(0, k)); }
    for (const b of order) {
      const to = machineById(p, b.to), from = machineById(p, b.from);
      if (!to || !from) continue;
      const end = b.path.length - 1;
      for (let i = 0; i < b.items.length; i++) {
        const it = b.items[i];
        const limit = i === 0 ? end : b.items[i - 1].pos - 1;
        it.pos = Math.min(it.pos + adv, Math.max(it.pos, limit));
      }
      if (b.items.length && b.items[0].pos >= end - 1e-6) {
        const it = b.items[0];
        if (accepts(p, to).includes(it.mat) && (to.buf.in[it.mat] || 0) < cap) {
          to.buf.in[it.mat] = (to.buf.in[it.mat] || 0) + 1;
          b.items.shift();
        }
      }
      const tailFree = !b.items.length || b.items[b.items.length - 1].pos >= 1;
      if (tailFree) {
        const wants = accepts(p, to);
        const mat = wants.find((x) => (from.buf.out[x] || 0) > 0);
        if (mat) { from.buf.out[mat]--; b.items.push({ mat, pos: 0 }); }
      }
    }
  }
  // run the clock from the save's last tick to now (bounded)
  function catchUp(p, nowMs) {
    ensure(p);
    let dt = Math.max(0, Math.min(MAX_CATCHUP_MS, nowMs - p.lastTick));
    while (dt > 0) {
      const d = Math.min(CATCHUP_STEP_MS, dt);
      step(p, d);
      dt -= d;
    }
    p.lastTick = nowMs;
  }
  // the live tick: advance by real elapsed time since the last tick
  function tick(p, nowMs) {
    ensure(p);
    const dt = nowMs - p.lastTick;
    if (dt <= 0) return 0;
    if (dt > 5000) { catchUp(p, nowMs); return dt; }   // a hidden tab, a long frame
    step(p, dt);
    p.lastTick = nowMs;
    return dt;
  }

  window.SIM = {
    ensure, ensureMachine, machineById, beltsFrom, beltsTo, outletsOf, inletsOf,
    ports, facingOf, nextFacing, turn, sizeOf, footprintOf, FACINGS,
    recipeOf, accepts, produces, canLink, addBelt, hasExit,
    takeInput, canTake, emit, collect, feed, canFeed, hasOutput, state,
    step, catchUp, tick,
  };
})();
