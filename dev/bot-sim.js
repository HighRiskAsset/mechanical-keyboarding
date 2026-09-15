// Headless play-through of js/bot.js's planner against the real tree: every
// move the planner asks for is applied through CHAIN and SIM (the calls the
// game makes), the clock advances by what the move would take a bot at the
// chosen pace (so the engines run while it types and walks), and it runs
// until the finish, a planner error, a stretch with no progress, or the
// clock budget.
// usage: node dev/bot-sim.js [range|frontier] [seconds] [batch budget] [sample step]
//   BOT_CPS=2.5     characters a second at the keys (2.5 = 30 WPM; 200 = machine speed)
//   BOT_HOURS=40    stop when the bot's clock passes this many hours
//   BOT_ENGINES=0   the old way: carry everything, automate nothing
//   COURSE=en       play the English tree (default ru); only that course's files are loaded
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const mapId = process.argv[2] || 'range';
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
  'js/courses.js', 'js/maps/kit.js', 'js/maps/frontier.js', 'js/maps/range.js', 'js/chain.js', 'js/engine.js', 'js/sim.js', 'js/bot.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const { CHAIN, SIM, ENGINE: E, BOT, MAPKIT } = ctx;
if (process.argv[4]) BOT.tune.BATCH_KS.max = +process.argv[4];
if (process.env.BOT_ENGINES === '0') BOT.tune.ENGINES = false;   // the old way: carry everything, automate nothing
if (process.env.BOT_CPS) BOT.tune.CPS = +process.env.BOT_CPS;     // the planner weighs a wait against typing at this pace
const SAMPLE_AT = +(process.argv[5] || 3000);
CHAIN.useMap(mapId);
const p = E.loadProfile(mapId);
const CAP = CHAIN.TUNING.BUFFER_CAP;
let clock = Date.now();
p.lastTick = clock;
const advance = (ms) => { clock += ms; SIM.tick(p, clock); };
const name = (a) => JSON.stringify(BOT.describe(a));
const fail = (msg, a) => { throw new Error(msg + (a ? ' @ ' + name(a) : '')); };

let keys = 0, slot = 0, trips = 0, lastAt = null;
const counts = {}, builds = [], trail = [], switches = {}, sample = [];
function apply(a) {
  counts[a.type] = (counts[a.type] || 0) + 1;
  const at = (a.m || a.from || {}).id || a.kind || null;
  if (at && at !== lastAt) { trips++; lastAt = at; }
  if (a.type === 'recipe') {
    const k = CHAIN.kindName(a.m.kind) + ' ' + a.m.id + ': ' + (a.m.recipe || '-') + ' → ' + a.r.out;
    switches[k] = (switches[k] || 0) + 1;
  }
  if (a.type === 'work') {
    const m = a.m;
    if (m.kind === 'mine') {
      for (let n = 0; a.fill ? (m.buf.out[m.ore] || 0) < CAP : (p.bag[m.ore] || 0) < a.target; n++) {
        if (n > 20000) fail('mine work never ends', a);
        SIM.emit(p, m, m.ore, 1); p.seen[m.ore] = true; keys++;
      }
      return;
    }
    if (m.recipe !== a.r.out) fail('work at a machine set to another recipe', a);
    const enough = () => (a.fill ? (m.buf.out[a.mat] || 0) >= CAP : (p.bag[a.mat] || 0) >= a.target);
    let units = 0;
    while (!enough() && SIM.canTake(p, m, a.r.in)) {
      SIM.takeInput(p, m, a.r.in);
      for (const [mat, q] of Object.entries(SIM.outsOf(a.r))) { SIM.emit(p, m, mat, q); p.seen[mat] = true; }
      keys += CHAIN.perUnit(a.r);
      if (++units > 20000) fail('work never ends', a);
    }
    return;
  }
  if (a.type === 'build') {
    if (a.kind === 'mine') {
      // a raw drawn from open water stands on no vein (2026-09-16)
      const water = CHAIN.drawsWater(a.ore);
      const n = water ? null : CHAIN.unbuiltNodes(p).find((x) => x.ore === a.ore);
      if (!water && !n) fail('no vein', a);
      const price = CHAIN.oreOpen(p, a.ore) ? CHAIN.priceExtraMine(a.ore) : CHAIN.priceNode(a.ore);
      if (price && !CHAIN.affordable(p.bag, price)) fail('mine not affordable', a);
      CHAIN.spendCost(p.bag, price);
      if (water) p.machines.push({ id: 'm' + (p.nextMachineId++), kind: 'mine', ore: a.ore, at: [300 + (slot += 5), 320], face: 's', auto: false });
      else {
        const seat = MAPKIT.veinBox({ ...n, vert: false });
        p.machines.push({ id: 'm' + (p.nextMachineId++), kind: 'mine', ore: a.ore, node: n.index, at: [seat.c0, seat.r0], face: 's', auto: false });
      }
      E.unlockIntro(p, CHAIN.mineLesson(a.ore));
    } else {
      const price = CHAIN.priceMachine(a.kind, CHAIN.machinesOfKind(p, a.kind).length + 1);
      if (!CHAIN.affordable(p.bag, price)) fail('machine not affordable', a);
      CHAIN.spendCost(p.bag, price);
      const m = { id: 'm' + (p.nextMachineId++), kind: a.kind, at: [300 + (slot += 5), 300], face: 's', auto: false };
      p.machines.push(m);
      SIM.ensureMachine(m);
      BOT.noteBuilt(m, a);
    }
    builds.push((a.kind === 'mine' ? CHAIN.mineName(a.ore) : CHAIN.kindName(a.kind)) + ' @' + hours().toFixed(1) + 'h'
      + (a.r ? ' for ' + a.r.lesson : '') + '  after: ' + trail.slice(-3, -1).join(' | '));
    return;
  }
  if (a.type === 'recipe') {
    // the live menu only offers a recipe whose inputs have all been held
    if (!CHAIN.inputsExist(a.r, p)) fail('recipe asked for before the menu would offer it', a);
    a.m.recipe = a.r.out; a.m.recipeIn = JSON.stringify(a.r.in);
    return;
  }
  if (a.type === 'pipe') {
    const link = SIM.canLink(p, a.from, a.to);
    if (!link.ok) fail('the game refuses that run: ' + link.why, a);
    SIM.addBelt(p, a.from, a.to, [[0, 0], [1, 0], [2, 0]]);
    return;
  }
  if (a.type === 'collect') { const got = SIM.collect(p, a.m); for (const k of Object.keys(got)) p.seen[k] = true; return; }
  if (a.type === 'auto') {
    const r = a.r || null;
    if (r && a.m.recipe !== r.out) fail('engine bought for a recipe the machine is not set to', a);
    const price = CHAIN.priceAuto(a.m, r, p);
    if (!price || !CHAIN.affordable(p.bag, price)) fail('automation not affordable', a);
    CHAIN.spendCost(p.bag, price);
    a.m.autoOn = a.m.autoOn || {};
    a.m.autoOn[CHAIN.autoKey(a.m, r, p)] = true;
    builds.push('⚙ ' + (a.m.kind === 'mine' ? CHAIN.mineName(a.m.ore) : CHAIN.kindName(a.m.kind) + ' ' + a.m.id + ' ' + r.lesson + ' → ' + CHAIN.matName(r.out)) + ' @' + hours().toFixed(1) + 'h');
    return;
  }
  if (a.type === 'feed') {
    const moved = SIM.feed(p, a.m);
    if (!Object.keys(moved).length) fail('nothing to load', a);
    return;
  }
  if (a.type === 'wait') return;
  if (a.type === 'complete') {
    const price = CHAIN.priceCompletion();
    if (!CHAIN.affordable(p.bag, price)) fail('finish not affordable', a);
    CHAIN.spendCost(p.bag, price);
    p.finishedAt = clock;
    return;
  }
  fail('unknown move ' + a.type, a);
}

// what a move costs the bot in seconds, besides its keystrokes: five a walk,
// two a menu, six a run laid, twenty a build, one a wait
const CPS = +(process.env.BOT_CPS || 2.5);
const SECS = { walk: 5, recipe: 2, collect: 2, feed: 2, auto: 2, complete: 2, pipe: 6, build: 20, wait: 1 };
const spent = { typing: 0, walking: 0, waiting: 0, menus: 0, building: 0 };
const start = clock;
const hours = () => (clock - start) / 3.6e6;
let steps = 0, same = 0, lastSig = '', outcome = 'step limit';
const t0 = Date.now(), LIMIT_MS = +(process.argv[3] || 240) * 1000, HOURS = +(process.env.BOT_HOURS || Infinity);
try {
  for (; steps < 300000; steps++) {
    if (Date.now() - t0 > LIMIT_MS) { outcome = 'time limit'; break; }
    if (hours() > HOURS) { outcome = 'clock budget'; break; }
    if (steps % 5000 === 0) console.error(`step ${steps}  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${hours().toFixed(1)}h on the clock  machines ${p.machines.length}`);
    const a = BOT.planFor(p);
    if (a.type === 'done') { outcome = 'FINISHED'; break; }
    trail.push(name(a)); if (trail.length > 12) trail.shift();
    if (steps >= SAMPLE_AT && steps < SAMPLE_AT + 40) sample.push(`[${steps}] ` + name(a));
    const keys0 = keys, trips0 = trips;
    apply(a);
    const typed = (keys - keys0) / CPS, walked = trips > trips0 ? SECS.walk : 0;
    const rest = SECS[a.type] || 0;
    spent.typing += typed; spent.walking += walked;
    if (a.type === 'wait') spent.waiting += rest; else if (a.type === 'build') spent.building += rest; else spent.menus += rest;
    advance(Math.max(50, (typed + walked + rest) * 1000));
    const sig = JSON.stringify([p.bag, p.machines.map((m) => [m.recipe, m.buf]), p.belts.length]);
    if (sig === lastSig) { if (++same > 300) { outcome = 'NO PROGRESS'; break; } } else { same = 0; lastSig = sig; }
  }
} catch (e) {
  outcome = 'ERROR: ' + e.message;
}
const kinds = {};
for (const m of p.machines) { const k = m.kind === 'mine' ? 'mine:' + CHAIN.mineName(m.ore) : CHAIN.kindName(m.kind); kinds[k] = (kinds[k] || 0) + 1; }
console.log(JSON.stringify({
  map: mapId, outcome, steps, keystrokes: keys, cps: CPS, engines: BOT.tune.ENGINES,
  hoursOnTheClock: +hours().toFixed(1),
  hoursSpent: Object.fromEntries(Object.entries(spent).map(([k, s]) => [k, +(s / 3600).toFixed(1)])),
  moves: counts, machines: kinds, runs: p.belts.length, keysOpen: CHAIN.unlockedKeys(p).length,
}, null, 1));
console.log('trips between places:', trips, ' batch budget (max):', BOT.tune.BATCH_KS.max);
console.log('sampled moves:\n  ' + sample.join('\n  '));
console.log('bag at the end:', JSON.stringify(Object.fromEntries(Object.entries(p.bag).filter(([, n]) => n > 0).map(([k, n]) => [CHAIN.matName(k), n]))));
console.log('buffers at the end:', JSON.stringify(p.machines.filter((m) => m.buf && (Object.values(m.buf.in).some((n) => n > 0) || Object.values(m.buf.out).some((n) => n > 0)))
  .map((m) => ({ m: m.id + ' ' + (m.kind === 'mine' ? CHAIN.mineName(m.ore) : CHAIN.kindName(m.kind)), in: m.buf.in, out: m.buf.out }))));
console.log('top recipe switches:\n  ' + Object.entries(switches).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => n + '  ' + k).join('\n  '));
console.log('build order:\n  ' + builds.join('\n  '));
if (outcome !== 'FINISHED') {
  console.log('last moves:\n  ' + trail.join('\n  '));
  const o = BOT.outstanding(p);
  console.log('still asked for:', JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, n]) => [CHAIN.matName(k), n]))));
  console.log('engines:\n  ' + p.machines.filter((m) => SIM.autoLive(p, m))
    .map((m) => m.id + ' ' + (m.kind === 'mine' ? CHAIN.mineName(m.ore) : CHAIN.kindName(m.kind) + ' ' + m.recipe) + ' [' + SIM.state(p, m) + '] in ' + JSON.stringify(m.buf.in) + ' out ' + JSON.stringify(m.buf.out)).join('\n  '));
  console.log('runs:', JSON.stringify(p.belts.map((b) => b.from + '→' + b.to + ' ' + b.items.length)));
}
