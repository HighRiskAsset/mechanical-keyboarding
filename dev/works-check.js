// The found works without a screen (js/works.js): derive them for a fresh
// save on every map and check the rule held. Placement here is a stub (a
// mine on the first free vein of its raw, any other machine on a dummy tile,
// every run a two-tile path), since the real placement needs the factory's
// ground; the browser is where that is judged. What this checks is the
// derivation: which lessons are done, which materials seen, which machines
// stand automated, and that nothing at or past the start column was touched
// and nothing was spent.
// usage: node dev/works-check.js            COURSE=en node dev/works-check.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const course = process.env.COURSE || 'ru';
const store = new Map([['mk.devmode', 'on']]);
const el = () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {}, appendChild() {} });
const ctx = {
  console, performance: { now: () => Date.now() },
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k), key: (i) => [...store.keys()][i], get length() { return store.size; },
  },
  document: { getElementById: () => null, createElement: el, documentElement: {}, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, hidden: true },
  addEventListener() {}, removeEventListener() {},
  setInterval: () => 0, clearInterval() {}, setTimeout: () => 0, clearTimeout() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, matchMedia: () => ({ matches: false }),
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
for (const f of ['js/i18n.js', 'js/dev.js', 'js/board-ansi.js', `js/language-${course}.js`, `js/layout-${course}.js`, `js/tree-${course}.js`,
  'js/courses.js', 'js/maps/kit.js', 'js/maps/frontier.js', 'js/maps/range.js', 'js/chain.js', 'js/engine.js', 'js/sim.js', 'js/works.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { CHAIN, SIM, ENGINE: E, WORKS } = ctx;

let failures = 0;
const check = (ok, what) => { if (!ok) failures++; console.log((ok ? '  ok   ' : '  FAIL ') + what); };

for (const mapId of CHAIN.MAP_IDS) {
  CHAIN.useMap(mapId);
  store.clear(); store.set('mk.devmode', 'on');
  const p = E.loadProfile(mapId);
  let slot = 0;
  const site = (pp, a) => {
    if (a.kind === 'mine') {
      const n = CHAIN.unbuiltNodes(pp).find((x) => x.ore === a.ore);
      if (!n) return null;
      const seat = CHAIN.nodeSeat(n, 's');
      return { kind: 'mine', vein: n.index, at: [seat.c0, seat.r0], face: 's' };
    }
    return { kind: a.kind, at: [300 + (slot += 4), 300], face: 's' };
  };
  const route = (pp, from, to) => [[0, 0], [1, 0]];
  const t0 = Date.now();
  const w = WORKS.found(p, { site, route });
  const S = w.start;
  console.log(`\n${course} · ${mapId}: start column ${S}, ${w.machines} machines, ${w.runs} runs, ${Date.now() - t0} ms` + (w.missed.length ? `, no site for ${w.missed.join(', ')}` : ''));

  const plan = WORKS.plan();
  const intros = CHAIN.INTROS.filter((l) => l.col < S).map((l) => l.id);
  const unlocked = Object.keys(p.unlocked).filter((k) => p.unlocked[k]);
  check(unlocked.length === intros.length && intros.every((id) => p.unlocked[id]), `${unlocked.length} introductions open, exactly those before column ${S}`);
  check(CHAIN.INTROS.filter((l) => l.col >= S).every((l) => !p.unlocked[l.id]), 'nothing from the start column on is open');
  const pages = CHAIN.LESSONS.filter((l) => l.kind === 'page');
  check(pages.every((l) => l.col >= S), `all ${pages.length} page lessons lie at or past the start`);
  const seen = Object.keys(p.seen).filter((k) => p.seen[k]);
  check(seen.length === plan.mats.length && plan.mats.every((m) => p.seen[m]), `${seen.length} materials seen, exactly the ones made before the start`);
  const later = CHAIN.RECIPES.filter((r) => r.col >= S).map((r) => r.out);
  check(later.every((m) => !p.seen[m]), 'no material of a later recipe has been seen');
  const mines = p.machines.filter((m) => m.kind === 'mine');
  check(mines.length === plan.mines.length, `${mines.length} mines, one per raw opened before the start (${plan.mines.length})`);
  const procs = p.machines.filter((m) => m.kind !== 'mine');
  check(procs.length === plan.recipes.length, `${procs.length} machines, one per recipe before the start (${plan.recipes.length})`);
  check(p.machines.every((m) => SIM.autoLive(p, m)), 'every machine is automated at its own work');
  check(procs.every((m) => SIM.recipeOf(p, m) && SIM.recipeOf(p, m).out === m.recipe), 'every machine holds its recipe');
  check(Object.keys(p.bag).every((k) => !p.bag[k]), 'the bag is empty: nothing was granted');
  // the works arrive full: every bin a full measure, every hopper loaded
  const cap = CHAIN.TUNING.BUFFER_CAP;
  const full = mines.filter((m) => (m.buf.out[m.ore] || 0) >= cap).length;
  check(full === mines.length, `${full} of ${mines.length} mines have a full bin`);
  const made = procs.filter((m) => Object.keys(SIM.recipeOf(p, m).outs).every((mat) => (m.buf.out[mat] || 0) >= cap)).length;
  check(made === procs.length, `${made} of ${procs.length} machines have a full bin of every output`);
  const loaded = procs.filter((m) => Object.keys(SIM.recipeOf(p, m).in).every((mat) => (m.buf.in[mat] || 0) >= cap)).length;
  check(loaded === procs.length, `${loaded} of ${procs.length} machines have every hopper loaded`);
  const fed = procs.filter((m) => Object.keys(SIM.recipeOf(p, m).in).every((mat) => SIM.beltsTo(p, m).some((b) => SIM.produces(p, SIM.machineById(p, b.from)).includes(mat)))).length;
  console.log(`  ${fed} of ${procs.length} machines have every input on a run (stub routing; the ground decides in the browser)`);
  // and a minute of play runs the works without anything odd
  const before = JSON.stringify(p.machines.map((m) => m.buf));
  SIM.catchUp(p, p.lastTick + 60 * 1000);
  check(!p.machines.some((m) => Object.values(m.buf.in).concat(Object.values(m.buf.out)).some((n) => n < 0 || n > cap)), 'a minute of the clock keeps every buffer within its cap');
  check(JSON.stringify(p.machines.map((m) => m.buf)) !== before, 'the works do run once the clock moves');
  // what the first page column can offer once the player arrives
  const next = CHAIN.RECIPES.filter((r) => r.col === S);
  const ready = next.filter((r) => CHAIN.inputsExist(r, p));
  console.log(`  column ${S}: ${ready.length} of ${next.length} recipes list with every input seen (${next.filter((r) => !CHAIN.inputsExist(r, p)).map((r) => r.lesson).join(' ') || 'none waiting'})`);
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
