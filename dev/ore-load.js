// The ore ledger (2026-08-25): how much work each ore is actually asked to
// do, and therefore how many veins of it a map owes. Used by dev/verify.html
// (RU) and dev/en.html (EN); never by the game. Global: ORELOAD.
//
// Why this exists. DESIGN.md used to name the vein counts outright — "iron 3,
// copper 2, stone 2, quartz 2, coal 2, oil 2" — a number written once and
// never re-derived, so it could not follow the tree it was cut for. It did
// not follow it: on the tree as it stands, iron had the most veins and the
// least work, and copper the reverse. A count that cannot move with the
// recipes is a count that is wrong the first time a recipe moves.
//
// So the count is computed here instead. Three facts make it computable:
//
//   · A VEIN IS ONE UNIT OF SUPPLY. Every mine yields at TUNING.RATE.mine
//     whatever the ore and whatever the Mk — depth mints a new material, not
//     a new rate — so ore supply is exactly (veins × rate) and nothing else.
//   · THE BILL IS AUTHORED. Everything the player must buy to finish is in
//     PRICES (rungs, first builds, ⚙, extra mines) plus K_HEAVY of the last
//     good. Nothing is emergent, so the bill can be totalled.
//   · THE PATH IS THE PLAYER'S. A good with several recipes can be made
//     several ways, and a player short of copper will reach for the recipe
//     that is not copper. So an ore's share is not one number off the
//     cheapest path — it is what the best BLEND consumes, which is an LP:
//     spread the bill across recipes so the busiest ore is as idle as it can
//     be made. Solved below by multiplicative weights over the Pareto-minimal
//     ore vectors of each good.
//
// What comes out is `load` — the hours each ore's veins must run to cover its
// share — and the verdict is local optimality, tested BOTH WAYS:
//
//   short   a seam that is not there and would buy more than the margin
//   padded  a seam that is there and could come out for almost nothing
//
// Local on purpose. A greedy cut grown from the floor is also reported
// (`owed`), but it is guidance, never the test: the two courses do not want
// the same cut — EN's book has no vowel on the iron alloys, so an EN player
// leans on quartz where a RU player leans on copper — and one map has to
// serve both. A map is not wrong for carrying a seam this course would not
// have chosen; it is wrong for being SHORT. So the pass condition is "short
// for nobody", which a single cut can satisfy for every course at once, and
// a padded seam is reported rather than failed.
//
// Both tests re-answer themselves whenever a recipe, a price or K_HEAVY
// moves, which is the whole point of them.
//
// It is a ratio diagnostic, not a play-length claim: it assumes mines never
// stall and everything they raise is consumed, and it ignores the hands,
// which out-produce ~6 mines at speed. The RATIOS are what it is for.
(function () {
  'use strict';

  const SWAP_MARGIN = 0.15;   // a seam worth >15% is a seam the map is short of
  const VEIN_FLOOR = 2;       // every ore owes an extra-mine row (priceExtraMine)

  // ---------- the bill: everything the player must buy to finish ----------
  // One of every purchase, at PACE, plus the finish counter. Extra mines are
  // counted once per ore: the map's second vein is content the player is
  // meant to buy, so its price belongs in the bill.
  function bill(C, L, profile) {
    const demand = {};
    const add = (price) => {
      if (!price) return;
      for (const [mat, n] of Object.entries(price)) demand[mat] = (demand[mat] || 0) + n;
    };
    for (const p of L.PAIRS) add(C.pricePair(p));
    for (const kind of Object.keys(C.KINDS)) if (kind !== 'mine') add(C.priceMachine(kind, 1));
    for (const ore of C.ORE_IDS) {
      add(C.priceExtraMine(ore));
      add(C.priceAuto({ kind: 'mine', ore }, null, profile));
    }
    for (const kind of Object.keys(C.KINDS)) {
      if (kind === 'mine') continue;
      const r = C.offerableRecipes(kind, profile)[0];
      if (r) add(C.priceAuto({ kind }, r, profile));
    }
    demand[C.TIER_GOOD[C.TIER_GOOD.length - 1]] =
      (demand[C.TIER_GOOD[C.TIER_GOOD.length - 1]] || 0) + C.TUNING.K_HEAVY;
    return demand;
  }

  // ---------- every way a good can be made, as raw ore ----------
  // Kept Pareto-minimal: a vector another vector beats on every ore at once
  // can never be the LP's answer, so dropping it costs nothing and keeps the
  // enumeration from blowing up on the deep goods (heavy fans out through
  // six parts recipes under four module recipes under two fastened recipes).
  function paretoMin(vs, n) {
    const out = [];
    for (const v of vs) {
      let dominated = false;
      for (const w of vs) {
        if (w === v) continue;
        let le = true, lt = false;
        for (let i = 0; i < n; i++) { if (w[i] > v[i]) { le = false; break; } if (w[i] < v[i]) lt = true; }
        if (le && lt) { dominated = true; break; }
      }
      if (!dominated) out.push(v);
    }
    return out;
  }

  function makeVectors(C, ORE_IDS, recipes) {
    const N = ORE_IDS.length;
    const zero = () => new Array(N).fill(0);
    const cache = new Map();
    function vecs(mat, depth) {
      if (depth > 12) return [];
      if (cache.has(mat)) return cache.get(mat);
      const spec = C.MATS[mat];
      if (spec && spec.form === 'ore') {
        const z = zero();
        z[ORE_IDS.indexOf(spec.ores[0])] = 1;
        return [z];
      }
      let all = [];
      for (const r of recipes.filter((x) => x.out === mat)) {
        let combos = [zero()];
        let ok = true;
        for (const [m, n] of Object.entries(r.in)) {
          const sub = vecs(m, depth + 1);
          if (!sub.length) { ok = false; break; }
          const next = [];
          for (const c of combos) for (const v of sub) {
            const q = c.slice();
            for (let i = 0; i < N; i++) q[i] += v[i] * n;
            next.push(q);
          }
          combos = paretoMin(dedupe(next), N);
        }
        if (ok) all = all.concat(combos);
      }
      const out = paretoMin(dedupe(all), N);
      cache.set(mat, out);
      return out;
    }
    return (mat) => vecs(mat, 0);
  }
  function dedupe(vs) {
    const seen = new Set(), out = [];
    for (const v of vs) { const k = v.join(','); if (!seen.has(k)) { seen.add(k); out.push(v); } }
    return out;
  }

  // ---------- the blend: minimise the busiest ore ----------
  // The player will not walk one recipe path; short of copper they reach for
  // the recipe that is not copper. So the honest measure of an ore's share is
  // the best BLEND, which is the LP
  //
  //     min over mixes of  max over ores ( ore used / ore supply )
  //
  // Solved by multiplicative weights, not by descending the primal: max() has
  // no gradient at the point where two ores tie for busiest, and a descent
  // method stalls there — it did, and reported a blend 12% worse than one
  // that exists. MW dodges it. `w` is a price per ore; each round every good
  // takes its cheapest path at those prices (which decomposes per good, so
  // the inner problem is a lookup), then the price of whatever ore came out
  // busiest goes up. The RUNNING AVERAGE of those rounds is the blend — that
  // average is what converges, never the last round on its own, because the
  // last round is always a single path and the answer is a mixture of them.
  function solve(demand, vecsOf, caps, N) {
    const mats = Object.entries(demand).filter(([, q]) => q > 0);
    const cheapestAt = (w) => {
      const U = new Array(N).fill(0);
      for (const [mat, q] of mats) {
        const vs = vecsOf(mat);
        if (!vs.length) continue;
        let best = null, bestCost = Infinity;
        for (const v of vs) {
          let c = 0;
          for (let i = 0; i < N; i++) c += v[i] * w[i] / caps[i];
          if (c < bestCost) { bestCost = c; best = v; }
        }
        for (let i = 0; i < N; i++) U[i] += best[i] * q;
      }
      return U;
    };
    const ROUNDS = 1200, ETA = 0.05;
    const w = new Array(N).fill(1 / N);
    const avg = new Array(N).fill(0);
    let best = null, bestWorst = Infinity;
    for (let t = 1; t <= ROUNDS; t++) {
      const U = cheapestAt(w);
      for (let i = 0; i < N; i++) avg[i] += (U[i] - avg[i]) / t;   // running mean
      const worst = Math.max(...avg.map((v, i) => v / caps[i]));
      if (worst < bestWorst) { bestWorst = worst; best = avg.slice(); }
      // raise the price of the ore this round leaned on hardest
      const load = U.map((v, i) => v / caps[i]);
      const mx = Math.max(...load) || 1;
      let s = 0;
      for (let i = 0; i < N; i++) { w[i] *= Math.exp(ETA * load[i] / mx); s += w[i]; }
      for (let i = 0; i < N; i++) w[i] /= s;
    }
    return best;
  }

  // ---------- the public call ----------
  // veins: { material name → count }, as `veinsOf` returns them. Gives the
  // hours each ore's seams must run, the seam the map is short of, and the
  // seam that earns nothing (either may be null — short:null is the pass).
  //
  // Everything this module says out loud is a MATERIAL NAME — iron, copper,
  // quartz — never the legacy internal id (`iron`, `copper`, `quartz`) that chain.js
  // keeps so old saves still load. `ORES[id].node` is the material name and is
  // what the maps already key their seams by, so the counts a caller passes in
  // and the counts this prints out are the same words the map file uses.
  const oreNames = (C) => C.ORE_IDS.map((id) => C.ORES[id].node);

  function measure(C, L, veins, profile) {
    const ORE_IDS = C.ORE_IDS.slice();
    const ORES = oreNames(C);            // display + caller-facing keys
    const N = ORES.length;
    const rate = 1 / C.TUNING.RATE.mine;             // ore per second per vein
    const prof = profile || fullProfile(C, L);
    const recipes = [];
    for (const kind of Object.keys(C.KINDS)) for (const r of C.offerableRecipes(kind, prof)) recipes.push(r);
    // vectors index by ORE_IDS — MATS carries the legacy ids — but every
    // slot lines up with ORES, so the same index is the material name
    const vecsOf = makeVectors(C, ORE_IDS, recipes);
    const demand = bill(C, L, prof);

    const runMemo = new Map();
    const run = (counts) => {
      const key = ORES.map((o) => counts[o] || 0).join(',');
      if (runMemo.has(key)) return runMemo.get(key);
      const caps = ORES.map((o) => Math.max(1, counts[o] || 0) * rate);
      const U = solve(demand, vecsOf, caps, N);
      const load = U.map((v, i) => v / caps[i] / 3600);
      const out = { hours: Math.max(...load), load, ore: U };
      runMemo.set(key, out);
      return out;
    };

    const here = run(veins);
    const perOre = {};
    ORES.forEach((o, i) => {
      perOre[o] = {
        veins: veins[o] || 0,
        units: Math.round(here.ore[i]),
        hours: +here.load[i].toFixed(2),
        busy: +(here.load[i] / here.hours).toFixed(2),
      };
    });

    // ---- the cut the tree owes ----
    // Start every ore at the floor and add the ONE seam that helps most,
    // over and over, until the next seam would not pay for itself. That is
    // the whole derivation: the tree is asked what it wants a seam for, and
    // it stops answering when another seam buys less than the margin. The
    // answer is a total AND a split, and it moves the moment a recipe does.
    const owed = {};
    for (const o of ORES) owed[o] = VEIN_FLOOR;
    let at = run(owed);
    const steps = [];
    for (let guard = 0; guard < 40; guard++) {
      let best = null;
      for (const o of ORES) {
        const next = Object.assign({}, owed);
        next[o]++;
        const r = run(next);
        const gain = (at.hours - r.hours) / at.hours;
        if (!best || gain > best.gain) best = { ore: o, gain, hours: r.hours };
      }
      if (!best || best.gain <= SWAP_MARGIN) break;
      owed[best.ore]++;
      at = { hours: best.hours };
      steps.push(`+${best.ore} → ${best.hours.toFixed(2)} h`);
    }
    const owedTotal = ORES.reduce((a, o) => a + owed[o], 0);
    const haveTotal = ORES.reduce((a, o) => a + (veins[o] || 0), 0);

    // ---- the verdict on the map's own cut, both ways ----
    // The greedy cut above is guidance, not the test: two courses want
    // different fourth seams and one map has to serve both, so a map is not
    // wrong for carrying a seam this course would not have chosen. What it
    // IS wrong for is being short — a seam that would buy more than the
    // margin and is not there — or being padded: a seam that could come out
    // and cost almost nothing. Both are local, so a map can satisfy every
    // course at once by being short for none of them.
    let short = null;
    for (const o of ORES) {
      const next = Object.assign({}, veins);
      next[o] = (next[o] || 0) + 1;
      const gain = (here.hours - run(next).hours) / here.hours;
      if (gain > SWAP_MARGIN && (!short || gain > short.gain)) short = { ore: o, gain: +gain.toFixed(3) };
    }
    let padded = null;
    for (const o of ORES) {
      if ((veins[o] || 0) - 1 < VEIN_FLOOR) continue;
      const next = Object.assign({}, veins);
      next[o]--;
      const cost = (run(next).hours - here.hours) / here.hours;
      if (cost < SWAP_MARGIN / 3 && (!padded || cost < padded.cost)) padded = { ore: o, cost: +cost.toFixed(3) };
    }

    return {
      hours: +here.hours.toFixed(2),
      perOre,
      owed,
      owedHours: +at.hours.toFixed(2),
      owedTotal,
      haveTotal,
      short,
      padded,
      steps,
      margin: SWAP_MARGIN,
      floor: VEIN_FLOOR,
      belowFloor: ORES.filter((o) => (veins[o] || 0) < VEIN_FLOOR),
    };
  }

  // a profile with every rung on the course bought
  function fullProfile(C, L) {
    const mk = {};
    for (const pl of C.PLACES) mk[pl] = 0;
    for (const p of L.PAIRS) { const pl = p.ore || p.at; mk[pl] = Math.max(mk[pl] || 0, p.mk); }
    return { mk, machines: [], bag: {}, letters: {}, seen: {} };
  }

  // the seams a map carries, keyed by material name — which is what a map
  // file already calls them (`{ kind: 'copper', … }`), so this is a count,
  // not a translation. A node kind with no ore behind it is not a seam and is
  // not counted; no map authors one any more (the frontier's `titan` landmark
  // became a copper seam on 2026-08-28), and the guard stays because a node
  // the game cannot mine must never quietly count as supply here.
  function veinsOf(C, mapId) {
    const was = C.MAP_ID;
    C.useMap(mapId);
    const counts = {};
    for (const name of oreNames(C)) counts[name] = 0;
    for (const n of C.MAP.NODES) if (C.ORE_BY_NODE[n.kind]) counts[n.kind]++;
    if (was && was !== mapId) C.useMap(was);
    return counts;
  }

  window.ORELOAD = { measure, veinsOf, bill, fullProfile, SWAP_MARGIN, VEIN_FLOOR };
})();
