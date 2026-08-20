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
    if (typeof m.rot !== 'number') m.rot = 0;   // which way it faces (ports, below)
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
  // A machine has three sides, not four. The operator sees it from the front
  // and its tower stands above its base, so anything on the row behind it is
  // hidden by the machine itself, and a port nobody can see is no better
  // than the old rule of ending a run wherever it fitted. The places are one
  // per column across the front and one per row down each side — a body two
  // across and two deep gives six:
  //
  //        [w1] [ B O D Y ] [e1]      (behind: hidden)
  //        [w0] [ B O D Y ] [e0]      the row it stands on
  //             [s0] [s1]             the row in front of it
  //
  // One whole side discharges; the other two take deliveries. Turning steps
  // the discharge side round — front, right, left — and the inlets fill the
  // two remaining sides in turn, the first to the brim before the second.
  //
  // This is what sets a kind's size (chain.js). A side of a one-deep body is
  // a single tile, so a one-deep machine can only ever have one outlet: the
  // mine, and nothing else. The Manufacturer's fifth port is why it is three
  // across — its front holds three places.
  const OUT_SIDE = ['s', 'e', 'w'];                                  // what a turn steps through
  const IN_SIDES = { s: ['w', 'e'], e: ['s', 'w'], w: ['e', 's'] };  // and what is left to take in by
  const ROTS = OUT_SIDE.length;
  const sizeOf = (m) => (C().KINDS[m.kind] || {}).size || [2, 2];
  const placesOf = (m) => { const [w, h] = sizeOf(m); return { s: w, e: h, w: h }; };
  const rotOf = (m) => ((((m && m.rot) | 0) % ROTS) + ROTS) % ROTS;
  const facingOf = (m) => OUT_SIDE[rotOf(m)];   // the side the product leaves by
  const turn = (m) => { m.rot = (rotOf(m) + 1) % ROTS; return m.rot; };
  // every port of a machine, in order, as a side and a place on it.
  // factory.js turns these into tiles; nothing here knows where the machine
  // stands. A kind whose size cannot seat all its ports comes back short,
  // and dev/sim.html says so rather than letting it reach the map.
  function ports(m) {
    const face = facingOf(m), room = placesOf(m);
    const out = [], inn = [];
    for (let i = 0; i < outletsOf(m) && i < room[face]; i++) out.push({ face, slot: i, dir: 'out', i });
    let i = 0;
    for (const side of IN_SIDES[face]) {
      for (let s = 0; s < room[side] && i < inletsOf(m); s++, i++) inn.push({ face: side, slot: s, dir: 'in', i });
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
  function removeBelt(p, beltId) {
    const i = p.belts.findIndex((b) => b.id === beltId);
    if (i < 0) return false;
    // items on the belt go back to the source's output buffer (cap permitting)
    const b = p.belts[i];
    const from = machineById(p, b.from);
    if (from) for (const it of b.items) if ((from.buf.out[it.mat] || 0) < CAP()) from.buf.out[it.mat] = (from.buf.out[it.mat] || 0) + 1;
    p.belts.splice(i, 1);
    return true;
  }
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
    ports, rotOf, facingOf, turn, sizeOf,
    recipeOf, accepts, produces, canLink, addBelt, removeBelt, hasExit,
    takeInput, canTake, emit, collect, feed, canFeed, hasOutput, state,
    step, catchUp, tick,
  };
})();
