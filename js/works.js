// The found works: a world that begins at the full keyboard.
//
// A player who already types opens a world here instead of at the first key.
// Nothing is bought and nothing is stored: every time such a world is opened
// the works are derived again from the tree and the map as they stand, so a
// price change, a rebuild of the tree or an edit to a map flows through.
//
// The rule: the start column is the column of the first page lesson. Every
// lesson before it is done. Its keys are open, its materials have been seen,
// its machine stands with its recipe set and its automation on, and a belt
// or pipe is laid to it wherever a run can be routed from a maker with an
// outlet free. Everything from that column on is the game as usual, and the
// works arrive full: every bin holds what its machine makes, every hopper
// what it takes.
//
// Placement is the bot's model of a player (js/bot.js: home first, then
// camps pulled by the ore), and routing is the factory's (js/factory.js), so
// the works stand where a player would have stood them. Where no ground can
// be found for a machine it is simply not built; the player builds it.
(function () {
  const C = () => window.CHAIN;

  // the column of the first page lesson: where the found works end
  function startCol() {
    const cols = C().LESSONS.filter((l) => l.kind === 'page').map((l) => l.col);
    return cols.length ? Math.min(...cols) : Infinity;
  }

  // everything before the start column, in the tree's order
  function plan() {
    const S = startCol();
    const below = (id) => ((C().LESSON[id] || {}).col || Infinity) < S;
    const intros = C().INTROS.filter((l) => l.col < S);
    const mines = C().MINES.filter((m) => below(m.lesson));
    const recipes = C().RECIPES.filter((r) => below(r.lesson)).slice().sort((a, b) => a.col - b.col);
    const mats = new Set();
    for (const m of mines) mats.add(m.raw);
    for (const r of recipes) for (const mat of Object.keys(r.outs || { [r.out]: 1 })) mats.add(mat);
    return { S, intros, mines, recipes, mats: [...mats] };
  }

  const mid = (m) => { const b = C().machineBox(m); return [b.c0 + b.w / 2, b.r0 + b.h / 2]; };
  const dist = (a, b) => { const p = mid(a), q = mid(b); return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]); };

  // Fill a fresh profile. `site(p, a)` says where a machine goes up (a spot
  // with at, face and, for a mine, vein), `route(p, from, to)` finds a run's
  // path or null; the game passes the bot's and the factory's, a harness
  // without a screen passes its own.
  function found(p, opts) {
    const o = opts || {};
    const site = o.site || ((pp, a) => window.BOT.siteFor(pp, a));
    const route = o.route || ((pp, from, to) => window.FACTORY.routeBelt(from, to, pp));
    const E = window.ENGINE, S = window.SIM;
    S.ensure(p);
    const { intros, mines, recipes, mats } = plan();
    const missed = [];
    for (const l of intros) E.unlockIntro(p, l.id);
    for (const mat of mats) p.seen[mat] = true;
    // mines first: one on a vein or pool of every raw the start lies past
    // (a fresh save already holds the free first mine; that one is kept)
    for (const mn of mines) {
      const had = C().machinesOfOre(p, mn.raw)[0];
      if (had) { S.ensureMachine(had); had.autoOn = { [C().autoKey(had, null)]: true }; continue; }
      const s = site(p, { kind: 'mine', ore: mn.raw });
      if (!s) { missed.push(mn.name); continue; }
      const m = { id: 'm' + (p.nextMachineId++), kind: 'mine', ore: mn.raw, node: s.vein, at: s.at.slice(), face: s.face, auto: false };
      m.autoOn = { [C().autoKey(m, null)]: true };
      p.machines.push(m);
      S.ensureMachine(m);
    }
    // then a machine for every recipe, in the tree's order, so a fluid's
    // maker stands before the machine a pipe has to reach from it
    for (const r of recipes) {
      const s = site(p, { kind: r.kind, r });
      if (!s) { missed.push(C().kindName(r.kind) + ' for ' + C().matName(r.out)); continue; }
      const m = { id: 'm' + (p.nextMachineId++), kind: r.kind, at: s.at.slice(), face: s.face, auto: false, recipe: r.out, recipeIn: JSON.stringify(r.in) };
      m.autoOn = { [C().autoKey(m, r)]: true };
      p.machines.push(m);
      S.ensureMachine(m);
      if (window.BOT && window.BOT.noteBuilt) window.BOT.noteBuilt(m, { kind: r.kind, r });
    }
    // runs, best effort: every input of every machine from the nearest maker
    // of it with an outlet free, where the ground lets a run through. What
    // cannot be belted is fed by hand, as it would be in any works.
    for (const m of p.machines) {
      if (m.kind === 'mine') continue;
      const r = S.recipeOf(p, m);
      if (!r) continue;
      for (const mat of Object.keys(r.in)) {
        const brought = S.beltsTo(p, m).some((b) => { const f = S.machineById(p, b.from); return !!f && S.produces(p, f).includes(mat); });
        if (brought) continue;
        const makers = p.machines.filter((x) => x !== m && S.produces(p, x).includes(mat) && S.canLink(p, x, m).ok)
          .sort((a, b) => dist(a, m) - dist(b, m));
        for (const from of makers) {
          const path = route(p, from, m);
          if (path) { S.addBelt(p, from, m, path); break; }
        }
      }
    }
    // The works arrive full. A machine has one outlet, two at most, so most
    // of a works is fed by hand in any game; here every bin holds a full
    // measure of what it makes and every hopper a full measure of what it
    // takes, so the player collects at once and the works run on from there.
    const cap = C().TUNING.BUFFER_CAP;
    for (const m of p.machines) {
      const r = m.kind === 'mine' ? null : S.recipeOf(p, m);
      const outs = m.kind === 'mine' ? [m.ore] : (r ? Object.keys(r.outs || { [r.out]: 1 }) : []);
      for (const mat of outs) m.buf.out[mat] = cap;
      if (r) for (const mat of Object.keys(r.in)) m.buf.in[mat] = cap;
    }
    p.lastTick = Date.now();
    return { start: startCol(), missed, machines: p.machines.length, runs: p.belts.length };
  }

  window.WORKS = { startCol, plan, found };
})();
