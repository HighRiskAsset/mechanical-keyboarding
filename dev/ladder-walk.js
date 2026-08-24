// The ladder walker (2026-08-22): every state a course's ladder can reach,
// and what is true in each. Since the ladder branched, "is the ladder
// traversable" is no longer one line of rungs to step along — it is a
// graph of Mk tables, and the rules DESIGN.md states have to hold at every
// node of it. Used by dev/verify.html (RU) and dev/en.html (EN); never by
// the game. Global: LADDERWALK.
//
// walk(C, L, rules) →
//   states      how many Mk tables are reachable from the pre-built mines
//   deadlocks   states with rungs left and nothing for sale producible
//   deadRows    [state, kind] where the kind's price is producible but it
//               has nothing to make, whatUnlocks cannot name a fix, and the
//               kind never comes alive on the course at all
//   farRows     the same, but the kind does come alive later — the row
//               reads "after deeper mines" (the far horizon; reported)
//   orderBad    purchases that broke a rule in `rules.after` — pairs of
//               [later, earlier] as [place, level]: the earlier must be
//               bought before the later ever goes on sale
//   lookahead   purchases of a rung two tiers past the lowest unbought one
//               (the loose "one era ahead" expectation — reported, not failed)
//   width       the most rungs ever for sale and producible at once
//   widthAt     the state that showed it
(function () {
  'use strict';

  function walk(C, L, rules) {
    rules = rules || {};
    const PLACES = C.PLACES;
    const keyOf = (mk) => PLACES.map((pl) => mk[pl] || 0).join(',');
    const profOf = (mk) => ({ mk, letters: {}, seen: {}, bag: {}, machines: [] });

    // can the player make this material in this state: an open ore, or an
    // offered recipe whose machine kind can be built (price producible, a
    // recipe to run) and whose inputs are all producible. A cycle (parts
    // need the Foundry, the Foundry costs parts) reads as "not yet".
    const memo = new Map();
    function producible(mat, prof, seen) {
      const k = keyOf(prof.mk) + '|' + mat;
      if (!seen && memo.has(k)) return memo.get(k);
      seen = seen || new Set();
      if (seen.has(mat)) return false;
      seen.add(mat);
      const spec = C.MATS[mat];
      let ok = false;
      if (!spec) ok = false;
      else if (spec.form === 'ore') ok = C.matExists(prof, mat);   // depth-aware: deep ores are their own materials
      else {
        outer: for (const kind of C.KIND_IDS) {
          if (kind === 'mine') continue;
          for (const r of C.offerableRecipes(kind, prof)) {
            if (r.out !== mat) continue;
            if (!kindObtainable(kind, prof, new Set(seen))) continue;
            if (Object.keys(r.in).every((m) => producible(m, prof, new Set(seen)))) { ok = true; break outer; }
          }
        }
      }
      if (seen.size === 1) memo.set(k, ok);
      return ok;
    }
    function kindObtainable(kind, prof, seen) {
      if (kind === 'mine') return true;
      if (!C.kindLive(kind, prof)) return false;
      const price = C.priceMachine(kind, 1);
      return !!price && Object.keys(price).every((m) => producible(m, prof, new Set(seen)));
    }
    const priceProducible = (price, prof) => !!price && Object.keys(price).every((m) => producible(m, prof));

    const start = {};
    for (const pl of PLACES) start[pl] = 0;
    for (const p of L.PAIRS) if (p.tier === 0) start[C.placeOf(p)] = Math.max(start[C.placeOf(p)], p.mk);

    const seenStates = new Set([keyOf(start)]);
    const queue = [start];
    const deadlocks = [], deadRows = [], farRows = [], orderBad = [], lookahead = [];
    let width = 0, widthAt = null, states = 0;
    const after = rules.after || [];
    const bought = (mk, place, level) => (mk[place] || 0) >= level;

    while (queue.length) {
      const mk = queue.shift();
      states++;
      const prof = profOf(mk);
      const forSale = C.nextPairs(prof);
      const open = forSale.filter((p) => priceProducible(C.pricePair(p), prof));
      if (forSale.length && !open.length) deadlocks.push(keyOf(mk));
      if (open.length > width) { width = open.length; widthAt = keyOf(mk); }
      // a kind whose price the player can pay but which has nothing to make
      // must be able to name its fix — or at least be a kind that comes
      // alive somewhere on the course (the row then says "deeper mines")
      for (const kind of C.KIND_IDS) {
        if (kind === 'mine') continue;
        if (C.kindLive(kind, prof)) continue;
        if (!priceProducible(C.priceMachine(kind, 1), prof)) continue;
        const fix = C.whatUnlocks(kind, prof);
        if (!fix && !C.kindEverLive(kind)) deadRows.push(`${keyOf(mk)} ${kind}`);
        else if (!fix) farRows.push(`${keyOf(mk)} ${kind}`);
      }
      const lowestUnbought = Math.min(...L.PAIRS.filter((p) => !C.pairBought(prof, p)).map((p) => p.tier), 99);
      for (const p of open) {
        const place = C.placeOf(p);
        for (const [later, earlier] of after) {
          if (later[0] === place && later[1] === p.mk && !bought(mk, earlier[0], earlier[1])) orderBad.push(`${p.keys.join(' ')} (${place} Mk${p.mk}) for sale before ${earlier[0]} Mk${earlier[1]} — at ${keyOf(mk)}`);
        }
        if (p.tier >= lowestUnbought + 2) lookahead.push(`${p.keys.join(' ')} (T${p.tier}) for sale while T${lowestUnbought} rungs remain — at ${keyOf(mk)}`);
        const next = Object.assign({}, mk);
        next[place] = p.mk;
        const k = keyOf(next);
        if (!seenStates.has(k)) { seenStates.add(k); queue.push(next); }
      }
    }
    return { states, deadlocks, deadRows, farRows, orderBad, lookahead: [...new Set(lookahead)], width, widthAt, keyOf, producible };
  }

  window.LADDERWALK = { walk };
})();
