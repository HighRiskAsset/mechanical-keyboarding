// The factory simulation (tech tree v4). Global: SIM
//
// Machines have insides: an input buffer per material and an output buffer.
// Automated mines yield into their output buffer on the clock; automated
// processors run timed jobs from their input buffers; belts carry items from
// one machine's outlet to another's inlet, one item per tile, at a fixed
// speed. Everything here runs in real time (mastered production runs on
// the clock; idle is bounded by buffer caps). The player's hands are
// handled by app.js (a worked machine uses its own buffers first, then the
// bag; its output rolls onto an exit belt if one exists, else into the
// bag). A recipe may make several materials at once (a byproduct beside
// the main one), and a fluid never leaves a machine except down a pipe.
// Nothing here knows a letter.
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
    // a job from before recipes had several outputs carried one
    if (m.job && !m.job.outs) m.job = { outs: { [m.job.out]: 1 }, left: m.job.left };
    if (typeof m.acc !== 'number') m.acc = 0;
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
  // a machine's ports come from its shape (chain.js KINDS): so many belts
  // or pipes in, so many out. A mine has one outlet and nothing in.
  const outletsOf = (m) => (m.kind === 'mine' ? T().OUTLETS.mine : ((C().KINDS[m.kind] || {}).outlets || 1));
  const inletsOf = (m) => (m.kind === 'mine' ? 0 : ((C().KINDS[m.kind] || {}).arity || 0));

  // ---------- ports: the sides a run may meet a machine on ----------
  // Every inlet and every outlet stands at one named place on the ring of
  // tiles around the body, and a run has to arrive there. Ports are
  // body-relative and turn rigidly with the machine. The whole front
  // discharges; deliveries fill the machine's own right flank to the brim,
  // then its left; the back carries nothing. A body two across and two
  // deep, facing front (s), gives six places for four ports:
  //
  //        [r1] [ B O D Y ] [l1]      (behind: the portless back)
  //        [r0] [ B O D Y ] [l0]      the row it stands on
  //             [f0] [f1]             the row in front of it
  //
  // A quarter turn clockwise steps the facing s → w → n → e, and every port
  // steps with it. This is what sets a kind's size (chain.js): a flank of a
  // one-deep body is a single tile, so a one-deep machine can only ever
  // have one outlet (the mine); three outlets or three inlets need a body
  // three across.
  const FACINGS = ['s', 'w', 'n', 'e'];         // a clockwise quarter each
  const sizeOf = (m) => (C().KINDS[m.kind] || {}).size || [2, 2];
  const faceOf = (m) => (m && FACINGS.includes(m.face)) ? m.face : 's';
  const facingOf = faceOf;                      // the side the product leaves by
  const footprintOf = (m) => window.MAPKIT.footprint(sizeOf(m), faceOf(m));
  const nextFacing = (m) => FACINGS[(FACINGS.indexOf(faceOf(m)) + 1) % 4];
  const turn = (m) => { m.face = nextFacing(m); return m.face; };
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
      const r = offered.find((x) => x.out === m.recipe);
      if (r) return r;
    }
    // no choice made yet: the earliest recipe whose inputs have been held,
    // else the earliest (app.js pickRecipe writes the same choice down)
    return offered.find((r) => C().inputsExist(r, p)) || offered[0];
  }
  // is this machine's CURRENT work automated? ⚙ is per recipe: a mine's key
  // is its raw, a processor's is the lesson of its running recipe
  function autoLive(p, m) {
    const key = m.kind === 'mine' ? C().mineMat(p, m) : C().autoKey(m, recipeOf(p, m), p);
    return C().autoOn(m, key);
  }
  // materials a machine takes in through its inlets: its recipe's inputs
  function accepts(p, m) {
    const r = recipeOf(p, m);
    return r ? Object.keys(r.in) : [];
  }
  const fits = (mat, want) => C().matSatisfies(mat, want);
  // materials a machine can send down a run: what the recipe it is set to
  // makes (a machine only ever runs one), and whatever is standing in its bin
  function produces(p, m) {
    if (m.kind === 'mine') return [C().mineMat(p, m)];
    const set = new Set();
    const r = recipeOf(p, m);
    if (r) for (const mat of Object.keys(outsOf(r))) set.add(mat);
    for (const mat of Object.keys(m.buf ? m.buf.out : {})) if ((m.buf.out[mat] || 0) > 0) set.add(mat);
    return [...set];
  }
  // the materials a run from → to would carry: what the source makes that
  // the consumer takes
  function linkMats(p, from, to) {
    const wants = accepts(p, to);
    return produces(p, from).filter((mat) => wants.some((w) => fits(mat, w)));
  }
  // a run is a pipe when everything it could carry is a fluid; a machine
  // whose every product is a fluid hands out a pipe spool
  const pipeFrom = (p, m) => { const mats = produces(p, m); return mats.length > 0 && mats.every((mat) => C().isFluid(mat)); };
  function isPipe(p, b) {
    const from = machineById(p, b.from), to = machineById(p, b.to);
    if (!from || !to) return false;
    const mats = linkMats(p, from, to);
    return mats.length > 0 ? mats.every((mat) => C().isFluid(mat)) : pipeFrom(p, from);
  }
  // may a belt run from → to: outlets/inlets free, and the consumer takes
  // something the source makes
  function canLink(p, from, to) {
    if (!from || !to || from === to) return { ok: false, why: 'same' };
    if (beltsFrom(p, from).length >= outletsOf(from)) return { ok: false, why: 'outlets' };
    if (beltsTo(p, to).length >= inletsOf(to)) return { ok: false, why: 'inlets' };
    if (p.belts.some((b) => b.from === from.id && b.to === to.id)) return { ok: false, why: 'exists' };
    if (!linkMats(p, from, to).length) return { ok: false, why: 'material' };
    return { ok: true };
  }
  function addBelt(p, from, to, path) {
    const b = { id: 'b' + (p.nextBeltId++), from: from.id, to: to.id, path, items: [] };
    p.belts.push(b);
    return b;
  }
  // A run is taken up through DROPS.demolish (js/drops.js); re-laying one
  // after a turn is factory.js's business (reconcileBelts).
  const hasExit = (p, m) => beltsFrom(p, m).length > 0;

  // ---------- hands: buffers first, then the bag ----------
  // take the cost for a worked machine; returns false (taking nothing) if
  // the machine's buffer and the bag together can't cover it. A fluid is
  // never in the bag, so a fluid input is the buffer's alone.
  function takeInput(p, m, cost) {
    ensureMachine(m);
    for (const [mat, n] of Object.entries(cost)) {
      if ((m.buf.in[mat] || 0) + C().bagAvail(p.bag, mat) < n) return false;
    }
    for (const [mat, n] of Object.entries(cost)) {
      const fromBuf = Math.min(n, m.buf.in[mat] || 0);
      if (fromBuf) m.buf.in[mat] -= fromBuf;
      if (n - fromBuf) C().spendCost(p.bag, { [mat]: n - fromBuf });
    }
    return true;
  }
  const canTake = (p, m, cost) => Object.entries(cost).every(([mat, n]) => ((m.buf && m.buf.in[mat]) || 0) + C().bagAvail(p.bag, mat) >= n);
  // where a worked machine's output goes: an exit belt's buffer if one
  // exists, else the bag — and past a full bag (or for a fluid, which the
  // bag refuses), the machine's own bin catches it. Whatever not even the
  // bin will hold comes back as `spilled` for the caller to lay on the
  // ground; a fluid is never spilled, it simply waits in the bin.
  // Returns { where: 'belt'|'bag'|'bin', spilled }.
  function emit(p, m, mat, n) {
    ensureMachine(m);
    let left = n, where = 'bag';
    if (hasExit(p, m) && (m.buf.out[mat] || 0) < CAP()) {
      const k = Math.min(CAP() - (m.buf.out[mat] || 0), left);
      m.buf.out[mat] = (m.buf.out[mat] || 0) + k;
      left -= k;
      where = 'belt';
    }
    if (left > 0) {
      const kept = C().bagAdd(p.bag, mat, left);
      left -= kept;
      if (!kept && where === 'bag') where = 'bin';
    }
    if (left > 0) {
      const k = Math.min(CAP() - (m.buf.out[mat] || 0), left);
      if (k > 0) { m.buf.out[mat] = (m.buf.out[mat] || 0) + k; left -= k; }
    }
    if (left > 0 && C().isFluid(mat)) left = 0;   // a fluid past the cap is lost to the ground, not laid on it
    return { where, spilled: left };
  }
  // collect a machine's output buffer into the bag; returns {mat: n} of what
  // actually landed. What the bag has no room for STAYS in the machine —
  // and a fluid stays whatever the room, since the bag will not take it.
  function collect(p, m) {
    ensureMachine(m);
    const got = {};
    for (const [mat, n] of Object.entries(m.buf.out)) {
      if (n <= 0) continue;
      const kept = C().bagAdd(p.bag, mat, n);
      if (kept > 0) got[mat] = kept;
      m.buf.out[mat] = n - kept;
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
      const k = Math.min(room, C().bagAvail(p.bag, mat));
      if (k <= 0) continue;
      m.buf.in[mat] = (m.buf.in[mat] || 0) + k;
      C().spendCost(p.bag, { [mat]: k });
      moved[mat] = k;
    }
    return moved;
  }
  const canFeed = (p, m) => accepts(p, m).some((mat) => C().bagAvail(p.bag, mat) > 0 && ((m.buf && m.buf.in[mat]) || 0) < CAP());
  const hasOutput = (m) => !!m.buf && Object.values(m.buf.out).some((n) => n > 0);
  // anything in the bin the bag could take (a fluid never is)
  const hasCollectable = (m) => !!m.buf && Object.entries(m.buf.out).some(([mat, n]) => n > 0 && !C().isFluid(mat));
  const outsOf = (r) => (r.outs || { [r.out]: 1 });
  const outsFit = (m, r) => Object.entries(outsOf(r)).every(([mat, q]) => (m.buf.out[mat] || 0) + q <= CAP());
  // a machine's state for the player's eye: 'off' | 'run' | 'starved' | 'full'
  function state(p, m) {
    ensureMachine(m);
    if (!autoLive(p, m)) return 'off';
    if (m.kind === 'mine') return (m.buf.out[C().mineMat(p, m)] || 0) >= CAP() ? 'full' : 'run';
    if (m.job) return m.job.left <= 0 ? 'full' : 'run';
    const r = recipeOf(p, m);
    if (!r) return 'starved';
    if (Object.entries(r.in).every(([mat, n]) => (m.buf.in[mat] || 0) >= n)) return outsFit(m, r) ? 'run' : 'full';
    return 'starved';
  }

  // ---------- the clock ----------
  let rr = 0;
  function step(p, dtMs) {
    ensure(p);
    const cap = CAP();
    // 1. automated mines yield on the clock
    const minePer = C().rateOf({ kind: 'mine' }, null) * 1000;
    for (const m of p.machines) {
      if (m.kind !== 'mine' || !autoLive(p, m)) continue;
      const yieldMat = C().mineMat(p, m);
      m.acc += dtMs;
      while (m.acc >= minePer) {
        if ((m.buf.out[yieldMat] || 0) >= cap) { m.acc = minePer; break; }   // full: wait
        m.acc -= minePer;
        m.buf.out[yieldMat] = (m.buf.out[yieldMat] || 0) + 1;
      }
    }
    // 2. automated processors run timed jobs from their buffers; a job
    //    makes every output of its recipe at once, and waits at the end
    //    until the bin has room for all of them
    for (const m of p.machines) {
      if (m.kind === 'mine' || !autoLive(p, m)) continue;
      if (m.job) {
        m.job.left -= dtMs;
        if (m.job.left <= 0) {
          const outs = m.job.outs || { [m.job.out]: 1 };
          if (Object.entries(outs).every(([mat, q]) => (m.buf.out[mat] || 0) + q <= cap)) {
            for (const [mat, q] of Object.entries(outs)) m.buf.out[mat] = (m.buf.out[mat] || 0) + q;
            m.job = null;
          } else m.job.left = 0;   // stalled until the output is taken
        }
      }
      if (!m.job) {
        const r = recipeOf(p, m);
        if (r && Object.entries(r.in).every(([mat, n]) => (m.buf.in[mat] || 0) >= n)) {
          for (const [mat, n] of Object.entries(r.in)) m.buf.in[mat] -= n;
          m.job = { outs: { ...outsOf(r) }, left: C().rateOf(m, r) * 1000 };
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
        const slot = accepts(p, to).find((w) => fits(it.mat, w));
        if (slot && (to.buf.in[slot] || 0) < cap) {
          to.buf.in[slot] = (to.buf.in[slot] || 0) + 1;
          b.items.shift();
        }
      }
      const tailFree = !b.items.length || b.items[b.items.length - 1].pos >= 1;
      if (tailFree) {
        const wants = accepts(p, to);
        const mat = Object.keys(from.buf.out).find((x) => (from.buf.out[x] || 0) > 0 && wants.some((w) => fits(x, w)));
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
    recipeOf, autoLive, accepts, produces, linkMats, pipeFrom, isPipe, canLink, addBelt, hasExit,
    takeInput, canTake, emit, collect, feed, canFeed, hasOutput, hasCollectable, outsOf, state,
    step, catchUp, tick,
  };
})();
