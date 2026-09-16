// Builds docs/tech-tree-v4-<course>.html: the lesson plan as materials,
// machines, recipes and prices, with a simulation of the hours they ask
// for. The model is plain: some materials are raw (mines); every other
// lesson is a recipe at a machine turning input materials into an output
// material; prices are made of materials. Ids only.
//
//   node dev/tech-tree-v4-build.js ru
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const course = process.argv[2] || 'ru';
process.env.COURSE = course;
const L = require('./lessons-v4-build.js');
const mech = require(path.join(ROOT, 'docs', `lessons-v4-${course}.mech.js`));
const { plan, byId, KEYBOARD_COLS, COMPLETION_COL, FREQ, LETTERS, rungIx } = L;
const PAGE_BASE = plan.pageBase || KEYBOARD_COLS;
const COURSE_NAME = { ru: 'Russian (ЙЦУКЕН)', en: 'English (QWERTY)' }[course] || course.toUpperCase();
const colLabel = (c) => (c <= KEYBOARD_COLS ? 'C' + c : 'pages ' + (c - PAGE_BASE));
const order = {}; plan.lessons.forEach((l, i) => { order[l.id] = i; });
const byCol = (a, b) => a.col - b.col || order[a.id] - order[b.id];
// every lesson is priced, the extended ones too; completion just does not need them
const lessons = plan.lessons.slice().sort(byCol);
const problems = [];
const rungOf = (l) => (l.kind === 'intro' ? 'streams' : l.kind === 'page' ? 'pages' : l.rung);
const isMine = (l) => l.kind === 'intro' && mech.mines.includes(l.id);
const maxCol = Math.max(...lessons.map((l) => l.col));

// ---- materials and recipes, in column order ----
// A mine outputs its raw. Every other lesson is a recipe. A key group that
// is not a mine consumes the newest raw and the previous column's newest
// material (that is what paces a column: the new keys cost last column's
// sentences); everything else consumes the plan's inputs as materials. The
// output is an id from the lesson's pool, reused when the pool is full and
// the id's latest recipe is at least shareGap columns back. An input always
// means the recipe for that material that was newest when the consumer
// appeared, so reuse never loops.
const outputOf = {};      // lesson id -> material id
const producers = {};     // material id -> [lesson ids], in column order
const inputsOf = {};      // lesson id -> [material ids]
const consumersOf = {};   // material id -> Set of lesson ids
const poolOf = (l) => (l.kind === 'intro' ? 'intro' : l.kind === 'page' ? 'pages' : rungIx(l.rung) >= rungIx('sentences') ? 'sentences' : l.rung);
const PREFIX = { intro: 'K', syllables: 'S', words: 'W', phrases: 'P', sentences: 'T', pages: 'G' };
const poolIds = {};       // pool -> [material ids]
const poolOfMat = {};     // material id -> pool
const latestProducerCol = (mat) => Math.max(...producers[mat].map((id) => byId[id].col));
const latestRawBefore = (col) => { let r = null; for (const id of mech.mines) if (byId[id].col <= col && outputOf[id]) r = outputOf[id]; return r; };
const madeBefore = (col, pred) => { const out = []; for (const l of lessons) if (l.col <= col && !isMine(l) && outputOf[l.id] && (!pred || pred(l))) out.push(outputOf[l.id]); return out; };
let pageTurn = 0;
const addRecipe = (l, inputs, out) => {
  inputsOf[l.id] = inputs; outputOf[l.id] = out;
  (producers[out] = producers[out] || []).push(l.id);
  for (const m of inputs) (consumersOf[m] = consumersOf[m] || new Set()).add(l.id);
};
for (const l of lessons) {
  if (isMine(l)) {
    const mat = 'R' + (mech.mines.indexOf(l.id) + 1);
    poolOfMat[mat] = 'raw';
    addRecipe(l, [], mat);
    continue;
  }
  const pool = poolOf(l);
  let inputs;
  if (l.kind === 'intro') {
    // a key group that is not a mine: a 1:1 recipe on the previous
    // column's newest material, so new keys need the lesson before them
    const prev = madeBefore(l.col - 1, (x) => x.col === l.col - 1 && x.kind !== 'intro' && x.kind !== 'page');
    inputs = prev.length ? [prev[prev.length - 1]] : [latestRawBefore(l.col - 1) || 'R1'];
  } else if (l.kind === 'page') {
    // a page is not made of pages: it takes the sentences its plan names (else the newest) and the newest byproduct (else the newest raw)
    const t = l.inputs.map((i) => outputOf[i]).find((m) => m && poolOfMat[m] === 'sentences') || madeBefore(l.col, (x) => poolOf(x) === 'sentences').pop();
    // pages take the byproduct with the fewest takers so far, the newest on a tie
    const bys = Object.keys(producers).filter((m) => poolOfMat[m] === 'byproduct' && byId[producers[m][0]].col <= l.col)
      .sort((a, b) => ((consumersOf[a] || new Set()).size - (consumersOf[b] || new Set()).size) || (byId[producers[b][0]].col - byId[producers[a][0]].col));
    const b = bys.length ? bys[0] : null;
    inputs = [t, b || latestRawBefore(l.col) || 'R1'].filter(Boolean);
  } else {
    inputs = [...new Set(l.inputs.map((i) => outputOf[i]).filter(Boolean))];
  }
  if (!inputs.length) inputs.push(latestRawBefore(l.col) || 'R1');
  const size = mech.pools ? (mech.pools[pool] || 5) : Infinity;   // no pools: one recipe, one material
  const ids = poolIds[pool] = poolIds[pool] || [];
  let pick = null;
  if (ids.length >= size) {
    const sorted = ids.filter((m) => !inputs.includes(m)).sort((a, b) => latestProducerCol(a) - latestProducerCol(b));
    if (sorted.length && latestProducerCol(sorted[0]) <= l.col - (mech.shareGap || 2)) pick = sorted[0];
  }
  if (!pick) { pick = PREFIX[pool] + (ids.length + 1); ids.push(pick); poolOfMat[pick] = pool; }
  addRecipe(l, inputs, pick);
  // some lessons make one or two byproducts beside their material
  const nBy = (mech.byproducts || {})[l.id] || 0;
  l.byproducts = [];
  for (let i = 0; i < nBy; i++) {
    const b = 'B' + (Object.keys(poolOfMat).filter((m) => poolOfMat[m] === 'byproduct').length + 1);
    poolOfMat[b] = 'byproduct'; producers[b] = [l.id]; l.byproducts.push(b);
  }
}
const materials = Object.keys(producers);
const outputsOf = (l) => [outputOf[l.id]].concat(l.byproducts || []);
// fluids travel by pipe: the raws named in the mech file, and what a syllable recipe fed by a fluid makes
const fluid = {};
for (const m of mech.fluids || []) fluid[m] = true;
for (const l of lessons) if (l.kind === 'exp' && l.rung === 'syllables' && inputsOf[l.id].some((m) => fluid[m])) fluid[outputOf[l.id]] = true;
const isFluid = (m) => !!fluid[m];
for (const m of materials) consumersOf[m] = consumersOf[m] || new Set();

// ---- machines have shapes: belts and pipes in, belts and pipes out. A
// recipe's shape is its inputs' and outputs' kinds; it goes to an open
// machine of that shape with room (rotating among them), else a machine of
// that shape opens at that column. Machines do not gate lessons. ----
const CAP = mech.machinesCap || 9;
const shapeOf = (l) => {
  if (l._s) return Object.assign({ key: '' }, l._s);
  const ins = inputsOf[l.id], outs = outputsOf(l);
  const s = { bi: ins.filter((m) => !isFluid(m)).length, pi: ins.filter(isFluid).length, bo: outs.filter((m) => !isFluid(m)).length, po: outs.filter(isFluid).length };
  s.key = `${s.bi}b${s.pi}p>${s.bo}b${s.po}p`;
  s.text = `${s.bi ? s.bi + ' belt' + (s.bi > 1 ? 's' : '') : ''}${s.bi && s.pi ? ' + ' : ''}${s.pi ? s.pi + ' pipe' + (s.pi > 1 ? 's' : '') : ''} in → ${s.bo ? s.bo + ' belt' + (s.bo > 1 ? 's' : '') : ''}${s.bo && s.po ? ' + ' : ''}${s.po ? s.po + ' pipe' + (s.po > 1 ? 's' : '') : ''} out`;
  return s;
};
const machines = [];
// the roster: a recipe takes the smallest roster shape that fits it (a slot may go unused)
const ROSTER = (mech.shapes || []).map((s) => { const t = shapeOf({ id: '_', _s: s }); return Object.assign({}, s, { key: `${s.bi}b${s.pi}p>${s.bo}b${s.po}p` }); });
const shapeText = (s) => `${s.bi ? s.bi + ' belt' + (s.bi > 1 ? 's' : '') : ''}${s.bi && s.pi ? ' + ' : ''}${s.pi ? s.pi + ' pipe' + (s.pi > 1 ? 's' : '') : ''} in → ${s.bo ? s.bo + ' belt' + (s.bo > 1 ? 's' : '') : ''}${s.bo && s.po ? ' + ' : ''}${s.po ? s.po + ' pipe' + (s.po > 1 ? 's' : '') : ''} out`;
const rosterFor = (s) => {
  const fits = ROSTER.filter((r) => r.bi >= s.bi && r.pi >= s.pi && r.bo >= s.bo && r.po >= s.po);
  if (!fits.length) { problems.push(`no machine shape fits ${s.key}`); return Object.assign({}, s, { key: s.key }); }
  return fits.sort((a, b) => (a.bi + a.pi + a.bo + a.po) - (b.bi + b.pi + b.bo + b.po))[0];
};
const openMachine = (col, r) => { const m = { id: 'M' + (machines.length + 1), recipes: [], col, shape: r.key, shapeText: shapeText(r) }; machines.push(m); return m; };
const turns = {};
for (const l of lessons) {
  if (isMine(l)) continue;
  const shape = shapeOf(l); l.shape = shape;
  const r = rosterFor(shape); l.roster = r.key;
  const fit = machines.filter((x) => x.shape === r.key && x.recipes.length < CAP);
  const m = fit.length ? fit[(turns[r.key] = (turns[r.key] || 0) + 1) % fit.length] : openMachine(l.col, r);
  m.recipes.push(l.id);
}
for (const m of machines) { m.lastCol = Math.max(...m.recipes.map((id) => byId[id].col)); }
const machineOf = {};
for (const m of machines) for (const id of m.recipes) machineOf[id] = m;
const mineOf = {};
mech.mines.forEach((id, i) => { mineOf[id] = { id: 'R' + (i + 1) + ' mine', col: byId[id].col }; });
const placeOf = (id) => (isMine(byId[id]) ? mineOf[id].id : machineOf[id].id);

// ---- quantities: a run of a recipe consumes and yields so many of each ----
const Q = mech.quantities || { byShape: {}, byLesson: {} };
const quantitiesOf = (l) => {
  if (l._q) return l._q;
  const base = (Q.byLesson || {})[l.id] || (Q.byShape || {})[l.roster] || { in: [], out: [] };
  const ins = inputsOf[l.id];
  const ordered = ins.filter((m) => !isFluid(m)).concat(ins.filter(isFluid));   // belts first, then pipes
  const qin = {};
  ordered.forEach((m, i) => { qin[m] = (base.in[i] || 1) * (rungOf(l) === 'words' && poolOfMat[m] === 'syllables' ? mech.ratioRules.syllablesIntoWords : 1); });
  const qout = {};
  outputsOf(l).forEach((m, i) => { qout[m] = base.out[i] || 1; });
  return (l._q = { in: qin, out: qout });
};
const qtyIn = (l, m) => (l.kind === 'intro' && isMine(l) ? 0 : quantitiesOf(l).in[m] || 1);
const qtyOut = (l, m) => quantitiesOf(l).out[m] || 1;

// ---- the simulation's cost model ----
const CH = mech.sim.charsPerItem;
const cpm = () => mech.sim.cpm;   // a flat 30 words a minute: a scale estimate, never a prediction
// a material means the recipe for it that was newest when the consumer
// appeared (a price at column c: the newest by c; a recipe's input: the
// newest by that recipe's column). If that recipe is automated by now the
// material arrives on its own; else it is typed there, one item per run,
// and its own inputs are demanded in turn by the run's quantities. Inputs
// always resolve to older or same-column recipes, so this never loops.
const recipeFor = (mat, atCol) => { let cur = null; for (const id of producers[mat]) if (byId[id].col <= atCol) cur = byId[id]; return cur; };
const demand = (mat, qty, col, acc, atCol) => {
  const l = recipeFor(mat, atCol === undefined ? col : atCol);
  if (!l || (l.automatedAt !== undefined && l.automatedAt <= col)) return;
  const runs = qty / qtyOut(l, mat);
  acc[l.id] = (acc[l.id] || 0) + runs;
  for (const m of inputsOf[l.id]) demand(m, runs * qtyIn(l, m), col, acc, l.col);
};
const unitMinutes = (mat, col) => { const acc = {}; demand(mat, 1, col, acc); let m = 0; for (const [k, q] of Object.entries(acc)) m += q * CH[rungOf(byId[k])] / cpm(col); return m; };
const qtyFor = (mat, budget, col) => {
  const per = unitMinutes(mat, col) || CH[rungOf(byId[producers[mat][0]])] / cpm(col);
  return Math.max(1, Math.round(budget * mech.pricing.pace / per));
};

// ---- pickers ----
// a fluid is never in a price: the player cannot carry it, so it can only be an input
const madeAt = (c) => lessons.filter((l) => l.col === c && !isMine(l)).flatMap((l) => outputsOf(l)).filter((m) => !isFluid(m));
const partsAt = (c) => lessons.filter((l) => l.col === c && !isMine(l) && l.kind !== 'intro').map((l) => outputOf[l.id]).filter((m) => !isFluid(m));
const ingotAt = (c) => { const l = lessons.find((x) => x.col === c && x.kind === 'exp' && x.rung === 'syllables' && !isFluid(outputOf[x.id])); return l ? outputOf[l.id] : null; };
const ingotBelow = (c) => { for (let k = c; k >= 1; k--) { const g = ingotAt(k); if (g) return g; } return null; };
const newestBelow = (c, not) => { for (let k = c; k >= 1; k--) { const m = madeAt(k).filter((x) => x !== not); if (m.length) return m[m.length - 1]; } return null; };
const solidRawBefore = (c) => { let r = null; for (const id of mech.mines) if (byId[id].col <= c && outputOf[id] && !isFluid(outputOf[id])) r = outputOf[id]; return r; };

// ---- purchases, column by column ----
const P = mech.pricing;
const purchases = [];
const byAsks = {};
const priceFor = (mat, budget, col) => ({ id: mat, qty: qtyFor(mat, budget, col) });
for (let c = 1; c <= maxCol; c++) {
  // 1. a new mine
  for (const id of mech.mines.filter((id) => byId[id].col === c && !P.firstFree.includes(id))) {
    const price = [];
    const newest = [...new Set(partsAt(c - 1))];
    if (!newest.length) { const g = ingotAt(c - 1); if (g) newest.push(g); }
    if (!newest.length) newest.push(solidRawBefore(c - 1) || 'R1');
    for (const m of newest) price.push(priceFor(m, P.mine.newest / newest.length, c));
    const review = ingotBelow(c - 2) || newestBelow(c - 2, newest[0]);
    if (review && !newest.includes(review)) price.push(priceFor(review, P.mine.review, c));
    // and some of the previous raw: a new mine costs the old ore
    const prevRaw = solidRawBefore(c - 1);
    if (prevRaw && P.mine.raw) price.push(priceFor(prevRaw, P.mine.raw, c));
    purchases.push({ col: c, kind: 'mine', target: id, label: `${mineOf[id].id} (${byId[id].keys.join(' ')}) makes ${outputOf[id]}`, price });
  }
  // 2. machines whose first recipe lives here: the newest material and the
  //    newest raw; a machine whose first recipe is a page asks for every
  //    page material of the previous page column instead of the one newest
  for (const m of machines.filter((m) => m.col === c)) {
    const price = [];
    const prevPages = byId[m.recipes[0]].kind === 'page' ? [...new Set(lessons.filter((l) => l.kind === 'page' && l.col === c - 1).map((l) => outputOf[l.id]))] : [];
    const newest = prevPages.length ? prevPages : [newestBelow(c - 1)].filter(Boolean);
    for (const mat of newest) price.push(priceFor(mat, P.build.newest / newest.length, c));
    // the newest raw, and the byproduct with the fewest takers so far once one exists
    const bys = Object.keys(producers).filter((x) => poolOfMat[x] === 'byproduct' && byId[producers[x][0]].col < c)
      .sort((a, b) => (consumersOf[a].size + (byAsks[a] || 0)) - (consumersOf[b].size + (byAsks[b] || 0)));
    const raw = solidRawBefore(c - 1) || 'R1';
    const extra = bys.length ? [raw, bys[0]] : [raw];
    if (bys.length) byAsks[bys[0]] = (byAsks[bys[0]] || 0) + 1;
    for (const x of extra) if (!newest.includes(x)) price.push(priceFor(x, P.build.raw / extra.length, c));
    purchases.push({ col: c, kind: 'build', target: m.id, label: `${m.id}, ${m.shapeText} (${m.recipes.length} recipes, C${m.col} to C${m.lastCol})`, price });
  }
  // 3. automation for lessons two columns old, paid with two of this
  //    column's materials in turn (pages only when there is nothing else),
  //    so every new material gets asked for
  const made = [...new Set(madeAt(c))];
  const pool = made.filter((m) => poolOfMat[m] !== 'pages').length ? made.filter((m) => poolOfMat[m] !== 'pages') : made;
  let k = 0;
  for (const l of lessons) {
    if (l.automatedAt !== undefined || l.col + 2 !== c) continue;
    const mats = pool.length ? [...new Set([pool[k++ % pool.length], pool[k++ % pool.length]])] : [solidRawBefore(c) || 'R1'];
    purchases.push({ col: c, kind: 'auto', target: l.id, label: `${l.id} at ${placeOf(l.id)}`, price: mats.map((m) => priceFor(m, P.automation.later / mats.length, c)) });
    l.automatedAt = c;
  }
  // 4. a print run for each column of pages: so many of each page material
  //    made in this column, and half as many of the previous column's; the
  //    completion purchase asks for the completion pages once more
  const pageMats = [...new Set(lessons.filter((l) => l.kind === 'page' && l.col === c).map((l) => outputOf[l.id]))];
  const prevPageCol = Math.max(0, ...lessons.filter((l) => l.kind === 'page' && l.col < c).map((l) => l.col));
  const prevMats = [...new Set(lessons.filter((l) => l.kind === 'page' && l.col === prevPageCol).map((l) => outputOf[l.id]))];
  if (pageMats.length) purchases.push({ col: c, kind: 'print', target: 'pages ' + (c - PAGE_BASE), label: `print run, ${colLabel(c)}`, price: pageMats.map((m) => ({ id: m, qty: P.pageRun })).concat(prevMats.map((m) => ({ id: m, qty: Math.max(1, Math.round(P.pageRun / 2)) }))) });
  if (c === COMPLETION_COL) purchases.push({ col: c, kind: 'completion', target: 'completion', label: 'completion: the easier half of the pages', price: (plan.completion || []).map((id) => ({ id: outputOf[id], qty: Math.max(1, Math.round(P.pageRun / 2)) })) });
}

// ---- simulation: replay with automation as it was bought ----
const hand = {}, mins = {}, maxPurchase = {}, asked = {};
for (const l of lessons) { hand[l.id] = 0; mins[l.id] = 0; maxPurchase[l.id] = 0; }
for (const m of materials) asked[m] = new Set();
for (const l of lessons) delete l.automatedAt;
let cumulative = 0;
for (const p of purchases) {
  const acc = {};
  for (const ing of p.price) { demand(ing.id, ing.qty, p.col, acc); asked[ing.id].add(p.kind + ':' + p.target); }
  if (p.kind === 'auto') byId[p.target].automatedAt = p.col;
  p.breakdown = [];
  let total = 0;
  for (const [id, q] of Object.entries(acc)) {
    const m = q * CH[rungOf(byId[id])] / cpm(p.col);
    hand[id] += q; mins[id] += m; maxPurchase[id] = Math.max(maxPurchase[id], m); total += m;
    p.breakdown.push({ id, items: Math.round(q), mins: m });
  }
  p.breakdown.sort((a, b) => b.mins - a.mins);
  p.minutes = total; cumulative += total; p.cumulativeHours = cumulative / 60;
}
const hoursByCol = {};
for (const p of purchases) hoursByCol[p.col] = (hoursByCol[p.col] || 0) + p.minutes / 60;
const hoursKeyboard = purchases.filter((p) => p.col <= KEYBOARD_COLS).reduce((s, p) => s + p.minutes, 0) / 60;
const hoursCompletion = purchases.filter((p) => p.col <= COMPLETION_COL).reduce((s, p) => s + p.minutes, 0) / 60;
const hoursAll = cumulative / 60;

// ---- exposure per key ----
const keyWeights = (l) => {
  const w = {};
  if (l.kind === 'intro') { for (const k of l.keys) w[k] = 1; return w; }
  const focus = new Set(l.focusKeys || []);
  const FOCUS_MARK = 3.0;
  for (const ch of l.alpha) w[ch] = (FREQ[ch] || 0.2) * (focus.has(ch) ? 2 : 1);
  if (l.marks) for (const m of l.marks) w[m] = focus.has(m) ? FOCUS_MARK : (FREQ[m] || 0.1);
  if (l.digits) for (const d of l.digits) w[d] = focus.has(d) ? FOCUS_MARK : mech.sim.digitShare;
  if (l.caps) w.Shift = focus.has('Shift') ? FOCUS_MARK * 2 : mech.sim.capsShare;
  if (l.kind === 'page') { for (const m of plan.scope.marks) w[m] = FREQ[m] || 0.1; for (const d of plan.scope.digits) w[d] = mech.sim.digitShare; w.Shift = mech.sim.capsShare; }
  return w;
};
const strokes = {};
for (const l of lessons) {
  const chars = hand[l.id] * CH[rungOf(l)];
  if (!chars) continue;
  const w = keyWeights(l); const sum = Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(w)) strokes[k] = (strokes[k] || 0) + chars * v / sum;
}
const target = {};
for (const ch of plan.scope.letters) target[ch] = FREQ[ch] || 0.2;
for (const m of plan.scope.marks) target[m] = FREQ[m] || 0.1;
for (const d of plan.scope.digits) target[d] = mech.sim.digitShare;
target.Shift = mech.sim.capsShare;
const tsum = Object.values(target).reduce((a, b) => a + b, 0);
const totalStrokes = Object.values(strokes).reduce((a, b) => a + b, 0);
const exposure = Object.keys(target).map((k) => {
  const actual = (strokes[k] || 0) / totalStrokes * 100, tgt = target[k] / tsum * 100;
  return { key: k, target: tgt, actual, ratio: actual / tgt, strokes: Math.round(strokes[k] || 0) };
});

// ---- checks ----
const FLOOR = 300;
// a letter must get 300 keystrokes, a mark or digit 200, and any key rarer than one in a thousand 100
const floorOf = (k) => ((target[k] / tsum * 100) < 0.1 ? Math.round(FLOOR / 3) : LETTERS.has(k) ? FLOOR : Math.round(FLOOR * 2 / 3));
const PAIRS = { '«': '»', '»': '«', '(': ')', ')': '(' };
const strokesOf = (k) => (strokes[k] || 0) + (PAIRS[k] ? strokes[PAIRS[k]] || 0 : 0);
for (const l of lessons) {
  const m = mins[l.id], mx = maxPurchase[l.id];
  if (m > 60) problems.push(`${l.id}: ${m.toFixed(0)} min by hand in total (cap 60)`);
  if (mx > 15) problems.push(`${l.id}: one purchase asks ${mx.toFixed(0)} min at it (cap 15)`);
  if (m < 3 && l.kind !== 'intro') problems.push(`${l.id}: only ${m.toFixed(1)} min by hand; nothing asks for it`);
}
for (const mat of materials) {
  const n = consumersOf[mat].size + asked[mat].size;
  // a fluid can only be an input, and the last column's pages have no column after them: one taker is enough there
  const need = isFluid(mat) || (poolOfMat[mat] === 'pages' && byId[producers[mat][0]].col >= maxCol) ? 1 : 2;
  if (n < need) problems.push(`${mat}: only ${n} consumer`);
  const cols = producers[mat].map((id) => byId[id].col);
  for (let i = 1; i < cols.length; i++) if (cols[i] - cols[i - 1] < (mech.shareGap || 2)) problems.push(`${mat}: recipes ${producers[mat][i - 1]} and ${producers[mat][i]} are only ${cols[i] - cols[i - 1]} column apart`);
}
for (const e of exposure) {
  if (e.ratio < 0.5 && e.target >= 0.3) problems.push(`key ${e.key}: exposure ${e.ratio.toFixed(2)}× its share of text`);
  if (e.ratio > (LETTERS.has(e.key) ? 2 : 2.5) && e.target >= 1) problems.push(`key ${e.key}: exposure ${e.ratio.toFixed(2)}× its share of text`);
  if (strokesOf(e.key) < floorOf(e.key)) problems.push(`key ${e.key}: only ${e.strokes} keystrokes (floor ${floorOf(e.key)})`);
}
if (hoursKeyboard < 15 || hoursKeyboard > 20) problems.push(`keyboard phase ${hoursKeyboard.toFixed(1)} h (target 15 to 20)`);

// ---- counts and console ----
const counts = {
  raws: mech.mines.length, materials: materials.length, made: materials.length - mech.mines.length, byproducts: materials.filter((m) => poolOfMat[m] === 'byproduct').length, fluids: materials.filter(isFluid).length,
  recipes: lessons.filter((l) => !isMine(l)).length, machines: machines.length, lessons: lessons.length, purchases: purchases.length,
};
console.log(`raws ${counts.raws} · materials ${counts.materials} (${counts.made} made, ${counts.byproducts} byproducts, ${counts.fluids} fluids) · recipes ${counts.recipes} · machines ${counts.machines} · lessons ${counts.lessons} · purchases ${counts.purchases}`);
console.log('machines: ' + machines.map((m) => `${m.id} ${m.shape} C${m.col} ×${m.recipes.length}`).join(' · '));
console.log(`hours: keyboard ${hoursKeyboard.toFixed(1)} · completion ${hoursCompletion.toFixed(1)} · everything ${hoursAll.toFixed(1)}`);
console.log('hours by column: ' + Object.keys(hoursByCol).map((c) => `${c}:${hoursByCol[c].toFixed(1)}`).join(' '));
console.log(`problems: ${problems.length}`); for (const p of problems) console.log('  ' + p);

// ---- render ----
const NL = '\n';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (n) => n.toFixed(1);
const slug = (s) => s.replace(/ /g, '_');

// the map: mines on top, machines below; a flow is a material travelling from the place of its first recipe to a consumer
const placesList = [...mech.mines.map((id) => ({ id: mineOf[id].id, col: mineOf[id].col, mine: id })), ...machines];
const LANES = [
  { title: 'mines (the raws)', ids: mech.mines.map((id) => mineOf[id].id) },
  { title: 'machines (recipes in column order)', ids: machines.map((m) => m.id) },
];
const placeById = {}; for (const p of placesList) placeById[p.id] = p;
const COLW = 70, NW = 190, NH = 120, LANEH = 300, X0 = 20, Y0 = 30;
const nodePos = {};
LANES.forEach((lane, li) => {
  let lastRight = -1e9;
  lane.ids.forEach((id, i) => {
    const p = placeById[id];
    let x = X0 + (p.col - 1) * COLW;
    if (x < lastRight + 12) x = lastRight + 12;
    const y = Y0 + li * LANEH + (i % 2) * (NH + 16);
    nodePos[id] = { x, y };
    lastRight = x + NW;
  });
});
const W = Math.max(...Object.values(nodePos).map((p) => p.x)) + NW + 40, H = Y0 + LANES.length * LANEH;
const flows = {};
for (const l of lessons) {
  if (isMine(l)) continue;
  for (const mat of inputsOf[l.id]) {
    const a = placeOf(producers[mat][0]), b = machineOf[l.id].id;
    if (a === b) continue;
    const key = a + '>' + b;
    flows[key] = flows[key] || { a, b, n: 0, items: [] };
    flows[key].n++; flows[key].items.push(`${mat} → ${l.id}`);
  }
}
let svg = `<svg class="map" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
LANES.forEach((lane, li) => { svg += `<text x="8" y="${Y0 + li * LANEH - 8}" font-size="11" font-weight="700" fill="#777">${esc(lane.title)}</text><line x1="0" y1="${Y0 + li * LANEH - 18}" x2="${W}" y2="${Y0 + li * LANEH - 18}" stroke="#e4e4e4"/>`; });
for (let c = 1; c <= maxCol; c += 1) if (c % 4 === 1 || c === maxCol) svg += `<text x="${X0 + (c - 1) * COLW}" y="${H - 4}" font-size="10" fill="#999">${colLabel(c)}</text>`;
for (const f of Object.values(flows)) {
  const a = nodePos[f.a], b = nodePos[f.b]; if (!a || !b) continue;
  const same = Math.abs(b.y - a.y) < 1;
  const d = same ? `M${a.x + NW},${a.y + NH / 2} C${a.x + NW + 40},${a.y + NH / 2 - 40} ${b.x - 40},${b.y + NH / 2 - 40} ${b.x},${b.y + NH / 2}`
    : `M${a.x + NW / 2},${a.y + NH} C${a.x + NW / 2},${a.y + NH + 70} ${b.x + NW / 2},${b.y - 70} ${b.x + NW / 2},${b.y}`;
  svg += `<path class="flow from-${slug(f.a)} to-${slug(f.b)}" d="${d}" fill="none" stroke="#8a7a5a" stroke-width="${Math.min(6, 1 + f.n * 0.6)}" opacity="0.35"><title>${esc(f.items.join(NL))}</title></path>`;
}
for (const p of placesList) {
  const pos = nodePos[p.id];
  const pipe = (m) => (isFluid(m) ? m + '~' : m);
  const rows = p.mine ? [`${pipe(outputOf[p.mine])} ← ${byId[p.mine].id}: ${byId[p.mine].keys.join(' ')}`] : p.recipes.map((rid) => `${outputsOf(byId[rid]).map((m) => qtyOut(byId[rid], m) + ' ' + pipe(m)).join(' + ')} ← ${inputsOf[rid].map((m) => qtyIn(byId[rid], m) + ' ' + pipe(m)).join(' + ') || 'nothing'} (${rid}, C${byId[rid].col})`);
  svg += `<g class="place" data-id="${slug(p.id)}" transform="translate(${pos.x},${pos.y})"><title>${esc(p.id + (p.shapeText ? ' · ' + p.shapeText : '') + NL + rows.join(NL))}</title>`;
  svg += `<rect width="${NW}" height="${NH}" rx="8" fill="${p.mine ? '#e6c47a' : '#dfe8f3'}" stroke="#666"/>`;
  svg += `<text x="8" y="16" font-size="12" font-weight="700" fill="#222">${esc(p.id)}${p.mine && isFluid(outputOf[p.mine]) ? ' (pipe)' : ''}</text><text x="8" y="30" font-size="10" fill="#555">${p.mine ? 'from ' + colLabel(p.col) : esc(p.shapeText) + ' · ' + colLabel(p.col)}</text>`;
  rows.slice(0, 7).forEach((r, i) => { svg += `<text x="8" y="${44 + i * 11}" font-size="9" fill="#333">${esc(r.length > 40 ? r.slice(0, 39) + '…' : r)}</text>`; });
  if (rows.length > 7) svg += `<text x="${NW - 8}" y="${NH - 6}" text-anchor="end" font-size="9" fill="#777">+${rows.length - 7}</text>`;
  svg += `</g>`;
}
svg += '</svg>';

const materialRows = materials.map((mat) => {
  const prod = producers[mat].map((id) => `${id} at ${placeOf(id)} (${colLabel(byId[id].col)})`).join('<br>');
  const cons = [...consumersOf[mat]].join(', ');
  const ask = [...asked[mat]].map((a) => `<span class="tag">${esc(a)}</span>`).join(' ');
  return `<tr><td class="id">${esc(mat)}</td><td>${prod}</td><td>${esc(cons)}</td><td>${ask}</td></tr>`;
}).join(NL);

const priceText = (price) => price.map((x) => `${x.qty} × ${esc(x.id)}`).join(' + ');
const purchaseRows = purchases.map((p) => `<tr class="${p.kind}"><td>${colLabel(p.col)}</td><td><span class="tag">${p.kind}</span> ${esc(p.label)}</td><td>${priceText(p.price)}</td><td class="dim">${p.breakdown.slice(0, 4).map((b) => `${esc(b.id)} ${f1(b.mins)}′`).join(' · ')}${p.breakdown.length > 4 ? ` · +${p.breakdown.length - 4}` : ''}</td><td>${f1(p.minutes)}</td><td>${f1(p.cumulativeHours)}</td></tr>`).join(NL);

const lessonRows = lessons.map((l) => {
  const tag = (m) => (isFluid(m) ? `${esc(m)} <span class="tag">pipe</span>` : esc(m));
  const ins = inputsOf[l.id].map((m) => `${qtyIn(l, m)} × ${tag(m)}`).join(' + ');
  const outs = outputsOf(l).map((m) => `${isMine(l) ? '' : qtyOut(l, m) + ' × '}${tag(m)}`).join(' + ');
  return `<tr class="${l.kind === 'intro' ? 'intro' : l.kind === 'page' ? 'page' : l.rung}"><td class="id">${l.id}</td><td>${esc(placeOf(l.id))}${l.shape ? `<div class="dim">${esc(l.shape.text)}</div>` : ''}</td><td>${esc(l.what || '')}</td><td>${ins || '<span class="dim">raw</span>'}</td><td><b>${outs}</b></td><td>${Math.round(hand[l.id])}</td><td>${f1(mins[l.id])}</td><td>${f1(maxPurchase[l.id])}</td><td>${l.automatedAt ? colLabel(l.automatedAt) : ''}</td></tr>`;
}).join(NL);

const expRows = exposure.map((e) => `<tr${(e.ratio < 0.5 && e.target >= 0.3) || (e.ratio > (LETTERS.has(e.key) ? 2 : 2.5) && e.target >= 1) || strokesOf(e.key) < floorOf(e.key) ? ' class="flag"' : ''}><td>${esc(e.key)}</td><td>${e.target.toFixed(2)}</td><td>${e.actual.toFixed(2)}</td><td>${e.ratio.toFixed(2)}</td><td>${e.strokes}</td></tr>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Tech tree v4 · ${course.toUpperCase()}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 20px 28px; font: 14px/1.45 system-ui, sans-serif; color: #222; background: #fbfaf7; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 28px 0 8px; }
  .dim { color: #777; font-size: 12px; }
  .scroll { overflow-x: auto; border: 1px solid #ddd; background: #fff; border-radius: 8px; padding: 8px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; background: #fff; }
  th, td { border-bottom: 1px solid #e6e6e6; padding: 5px 8px; vertical-align: top; text-align: left; }
  th { position: sticky; top: 0; background: #f2efe8; }
  td.id { font-weight: 700; white-space: nowrap; }
  .tag { font-size: 10px; padding: 0 5px; border-radius: 4px; background: #eee; color: #444; }
  tr.mine td:first-child { box-shadow: inset 3px 0 #e6c47a; } tr.build td:first-child { box-shadow: inset 3px 0 #7a9cc6; } tr.auto td:first-child { box-shadow: inset 3px 0 #8fbf8f; } tr.print td:first-child, tr.completion td:first-child { box-shadow: inset 3px 0 #b39ddb; }
  tr.intro td.id { background: #e6c47a; } tr.syllables td.id { background: #a9cfea; } tr.words td.id { background: #9fd3a5; } tr.phrases td.id { background: #cfe3a0; } tr.sentences td.id { background: #f3c6a2; } tr.full td.id { background: #eaa6a6; } tr.page td.id { background: #d7c4ee; }
  tr.flag td { color: #b02a2a; }
  svg.map .flow.hi { opacity: 0.9; stroke: #c0392b; }
  ul.problems li { color: #b02a2a; }
</style></head><body>
<h1>Tech tree v4 · ${COURSE_NAME}</h1>
<div class="dim">Materials and machines. Some materials are raw. A recipe at a machine turns input materials into one output material, and every recipe has its own. A lesson is one recipe or one raw. Prices are made of materials. Built by <code>dev/tech-tree-v4-build.js</code> from the lesson plan and <code>docs/lessons-v4-${course}.mech.js</code>. Ids only.</div>

<h2>Counts</h2>
<ul>
<li><b>${counts.raws} raws</b>, one mine each (${mech.mines.join(', ')}).</li>
<li><b>${counts.materials} materials</b> in all: the ${counts.raws} raws and ${counts.made} made ones, one per recipe. Automation is the only thing that retires a lesson.</li>
<li><b>${counts.recipes} recipes</b> at <b>${counts.machines} machines</b>, at most ${CAP} each. A machine has a shape (belts and pipes in, belts and pipes out); a recipe goes to an open machine of its shape, and a machine of a new shape opens when a recipe needs one: ${machines.map((m) => `${m.id} ${esc(m.shapeText)} at ${colLabel(m.col)}`).join(' · ')}. Machines do not gate lessons; a recipe's inputs do.</li>
<li><b>${counts.fluids} fluids</b> travel by pipe, <b>${counts.byproducts} byproducts</b> come out beside their lesson's material (one from ${Object.entries(mech.byproducts || {}).filter(([, n]) => n === 1).length} lessons, two from ${Object.entries(mech.byproducts || {}).filter(([, n]) => n === 2).length}); the pages are printed on them and machines are built with them, in turn.</li>
<li><b>${counts.lessons} lessons</b> = ${counts.raws} raws + ${counts.recipes} recipes. ${counts.purchases} purchases.</li>
</ul>

<h2>The map of places</h2>
<div class="dim">Mines on top, machines below, at the column where they are first bought. Hover a place for its recipes (output ← inputs), a flow for what travels along it.</div>
<div class="scroll">${svg}</div>

<h2>Hours</h2>
<ul>
<li><b>Keyboard complete</b> (through C${KEYBOARD_COLS}, including the pages open by then): ${f1(hoursKeyboard)} h. Target 15 to 20.</li>
<li><b>Completion</b> (${(plan.completion || []).length} pages: every kind once and a second of the plain ones): ${f1(hoursCompletion)} h.</li>
<li><b>Everything on the page</b>: ${f1(hoursAll)} h.</li>
<li>By column: ${Object.keys(hoursByCol).map((c) => `${colLabel(+c)} ${f1(hoursByCol[c])}`).join(' · ')}</li>
<li>Assumptions: ${Object.entries(CH).map(([k, v]) => `${k} ${v} chars`).join(', ')}; a flat ${mech.sim.cpm / 5} words a minute, which is a scale for the workloads and not a prediction of any player; a material is typed at its recipe until that recipe is automated, then arrives on its own.</li>
</ul>

<h2>Checks</h2>
${problems.length ? `<ul class="problems">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<div>No problems.</div>'}

<h2>Every material</h2>
<div class="scroll"><table><thead><tr><th>material</th><th>made by</th><th>consumed by</th><th>asked for by</th></tr></thead><tbody>${materialRows}</tbody></table></div>

<h2>Every purchase, in order</h2>
<div class="dim">mine = a new raw · build = a machine · auto = a recipe's or a mine's automation · print = a page column's run · completion = the easier half of the pages once more. "Typing" is what the purchase costs by hand, expanded through the recipe graph.</div>
<div class="scroll"><table><thead><tr><th>col</th><th>purchase</th><th>price</th><th>typing</th><th>min</th><th>cum. h</th></tr></thead><tbody>${purchaseRows}</tbody></table></div>

<h2>Every lesson as a recipe</h2>
<div class="scroll"><table><thead><tr><th>id</th><th>place</th><th>what you type</th><th>inputs</th><th>output</th><th>items by hand</th><th>min by hand</th><th>biggest ask</th><th>automated</th></tr></thead><tbody>${lessonRows}</tbody></table></div>

<h2>Exposure per key</h2>
<div class="dim">Share of all hand keystrokes each key gets, against its share of running text (digits ${mech.sim.digitShare}% each, Shift ${mech.sim.capsShare}%). Flagged below half or above double, or under the floor (${FLOOR} for a letter, ${Math.round(FLOOR * 2 / 3)} for a mark or digit; paired marks count together).</div>
<div class="scroll"><table><thead><tr><th>key</th><th>target %</th><th>actual %</th><th>ratio</th><th>keystrokes</th></tr></thead><tbody>${expRows}</tbody></table></div>

<script>
  const flows = document.querySelectorAll('svg.map .flow');
  document.querySelectorAll('svg.map .place').forEach((n) => {
    const id = n.dataset.id;
    n.addEventListener('mouseenter', () => flows.forEach((p) => { if (p.classList.contains('from-' + id) || p.classList.contains('to-' + id)) p.classList.add('hi'); }));
    n.addEventListener('mouseleave', () => flows.forEach((p) => p.classList.remove('hi')));
  });
</script>
<script type="application/json" id="tree-json">${esc(JSON.stringify({ mines: mech.mines, materials: materials.map((m) => ({ id: m, producers: producers[m], consumers: [...consumersOf[m]] })), machines, recipes: lessons.filter((l) => !isMine(l)).map((l) => ({ id: l.id, machine: machineOf[l.id].id, shape: l.roster, inputs: inputsOf[l.id].map((m) => ({ id: m, qty: qtyIn(l, m) })), outputs: outputsOf(l).map((m) => ({ id: m, qty: qtyOut(l, m) })) })), purchases: purchases.map((p) => ({ col: p.col, kind: p.kind, target: p.target, price: p.price, minutes: p.minutes })), hours: { keyboard: hoursKeyboard, completion: hoursCompletion, all: hoursAll }, counts }))}</script>
</body></html>`;
fs.writeFileSync(path.join(ROOT, 'docs', `tech-tree-v4-${course}.html`), html);
console.log('wrote docs/tech-tree-v4-' + course + '.html');

// ---- the overlay: the lesson tree with its recipe on every node ----
// Columns are the lesson plan's; each node is a lesson with its keys, what
// you type, its machine and shape, and its recipe with quantities. Solid
// edges are material flows (a pipe dashed, a byproduct gold); dotted edges
// are lesson lineage the materials do not carry (a page's earlier pages).
{
  const FILL = { intro: '#e6c47a', syllables: '#a9cfea', words: '#9fd3a5', phrases: '#cfe3a0', sentences: '#f3c6a2', full: '#eaa6a6', page: '#d7c4ee' };
  const fillOf = (l) => (l.kind === 'intro' ? FILL.intro : l.kind === 'page' ? FILL.page : FILL[l.rung]);
  const OC = 176, ON = 160, OR = 92, OH = 80, OX = 24, OY = 46;
  const slot = {}; { const per = {}; for (const l of lessons) { per[l.col] = per[l.col] || 0; slot[l.id] = per[l.col]++; } }
  const nx = (l) => OX + (l.col - 1) * OC, ny = (l) => OY + slot[l.id] * OR;
  const maxSlots = Math.max(...Object.values(slot)) + 1;
  const OW = OX * 2 + maxCol * OC, OHt = OY + maxSlots * OR + 16;
  const keysLine = (l) => {
    if (l.kind === 'intro') return `<tspan font-weight="700">${esc(l.keys.join(' '))}</tspan>`;
    if (l.kind === 'page') return esc(l.what.length > 26 ? l.what.slice(0, 25) + '…' : l.what);
    const a = [...l.alpha], focus = new Set(l.focusKeys || []);
    if (rungIx(l.rung) >= rungIx('sentences')) return `<tspan font-weight="700">${esc((l.focusKeys || []).join(' '))}</tspan> + ${a.length} letters`;
    if (a.length <= 12) return a.map((ch) => (focus.has(ch) ? `<tspan font-weight="700">${esc(ch)}</tspan>` : esc(ch))).join(' ');
    return `<tspan font-weight="700">${esc((l.focusKeys || []).join(' '))}</tspan> + ${a.length - (l.focusKeys || []).filter((k) => LETTERS.has(k)).length} more`;
  };
  const recipeLine = (l) => (isMine(l) ? `${outputOf[l.id]}, a raw` : `${inputsOf[l.id].map((m) => qtyIn(l, m) + '×' + m + (isFluid(m) ? '~' : '')).join('+')} → ${outputsOf(l).map((m) => qtyOut(l, m) + '×' + m + (isFluid(m) ? '~' : '')).join('+')}`);
  const unlockOf = {};
  for (const p of purchases) if (p.kind === 'mine') unlockOf[p.target] = `mine bought at ${colLabel(p.col)}: ${p.price.map((x) => x.qty + '×' + x.id).join(' + ')}`;
  let o = `<svg class="overlay" viewBox="0 0 ${OW} ${OHt}" width="${OW}" height="${OHt}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
  for (let c = 1; c <= maxCol; c++) {
    const opens = machines.filter((m) => m.col === c).map((m) => m.id);
    const mine = mech.mines.find((id) => byId[id].col === c);
    o += `<text x="${OX + (c - 1) * OC + ON / 2}" y="16" text-anchor="middle" font-size="12" font-weight="700" fill="#555">${colLabel(c)}</text>`;
    const sub = [mine ? outputOf[mine] + ' mine' : '', opens.length ? opens.join(' ') + ' opens' : ''].filter(Boolean).join(' · ');
    if (sub) o += `<text x="${OX + (c - 1) * OC + ON / 2}" y="31" text-anchor="middle" font-size="10" fill="#888">${esc(sub)}</text>`;
    if (c === PAGE_BASE + 1 || c === COMPLETION_COL + 1) o += `<line x1="${OX + (c - 1) * OC - 8}" y1="6" x2="${OX + (c - 1) * OC - 8}" y2="${OHt}" stroke="#999" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  }
  const edge = (a, b, cls, stroke, dash, width) => {
    const x1 = nx(a) + ON, y1 = ny(a) + OH / 2, x2 = nx(b), y2 = ny(b) + OH / 2;
    const dx = Math.max(30, (x2 - x1) / 2);
    return `<path class="edge ${cls} from-${a.id} to-${b.id}" d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}" fill="none" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} opacity="${b.col - a.col > 4 ? 0.3 : 0.6}"/>`;
  };
  for (const l of lessons) {
    if (isMine(l)) continue;
    for (const m of inputsOf[l.id]) {
      const src = byId[producers[m][0]];
      const by = poolOfMat[m] === 'byproduct';
      o += edge(src, l, 'flow', by ? '#b08a3c' : isFluid(m) ? '#3b7dd8' : '#8a8a8a', isFluid(m) ? '6 3' : '', by ? 1.2 : 1.5);
    }
    // lineage the materials do not carry
    for (const i of l.inputs || []) {
      const src = byId[i]; if (!src || !lessons.includes(src)) continue;
      const carried = inputsOf[l.id].some((m) => producers[m][0] === i);
      if (!carried) o += edge(src, l, 'lineage', '#c8a0d8', '2 3', 1);
    }
  }
  for (const l of lessons) {
    const x = nx(l), y = ny(l);
    const place = isMine(l) ? mineOf[l.id].id : `${machineOf[l.id].id} · ${machineOf[l.id].shapeText}`;
    const title = [`${l.id} · ${l.what}`, `place: ${place}`, `recipe: ${recipeLine(l)}`, unlockOf[l.id] || (isMine(l) ? 'there at the start' : `available when its inputs exist and ${machineOf[l.id].id} is built`), l.automatedAt ? `automated at ${colLabel(l.automatedAt)}` : '', `samples: ${(l.samples || []).join(' · ')}`].filter(Boolean).join(NL);
    o += `<g class="node" data-id="${l.id}" transform="translate(${x},${y})"><title>${esc(title)}</title>`;
    o += `<rect width="${ON}" height="${OH}" rx="8" fill="${fillOf(l)}" stroke="${l.gather ? '#333' : '#666'}" stroke-width="${l.gather ? 2.5 : 1}"/>`;
    o += `<text x="8" y="15" font-size="11" font-weight="700" fill="#222">${esc(l.id)}${l.gather ? ' · gather' : ''}</text>`;
    o += `<text x="8" y="31" font-size="11.5" fill="#111">${keysLine(l)}</text>`;
    o += `<text x="8" y="47" font-size="10" fill="#333">${esc(isMine(l) ? mineOf[l.id].id : machineOf[l.id].id + ' · ' + machineOf[l.id].shapeText.replace(' in → ', ' → ').replace(/ out$/, ''))}</text>`;
    const rl = recipeLine(l);
    o += `<text x="8" y="64" font-size="10" font-weight="600" fill="#333">${esc(rl.length > 30 ? rl.slice(0, 29) + '…' : rl)}</text>`;
    o += `</g>`;
  }
  o += '</svg>';
  const mach = machines.map((m) => `<tr><td class="id">${m.id}</td><td>${esc(m.shapeText)}</td><td>${colLabel(m.col)}</td><td>${m.recipes.length}</td><td class="dim">${m.recipes.join(', ')}</td></tr>`).join('');
  const mineRows = mech.mines.map((id) => `<tr><td class="id">${outputOf[id]}</td><td>${mineOf[id].id}</td><td>${colLabel(byId[id].col)}</td><td>${esc(byId[id].keys.join(' '))}</td><td>${isFluid(outputOf[id]) ? 'pipe' : 'belt'}</td><td class="dim">${[...consumersOf[outputOf[id]]].join(', ')}</td></tr>`).join('');
  const rowsAll = lessons.map((l) => `<tr class="${l.kind === 'intro' ? 'intro' : l.kind === 'page' ? 'page' : l.rung}"><td class="id">${l.id}</td><td>${colLabel(l.col)}</td><td>${l.kind === 'intro' ? `<b>${esc(l.keys.join(' '))}</b>` : esc(rungIx(l.rung || 'pages') >= rungIx('sentences') || l.kind === 'page' ? (l.focusKeys || []).join(' ') + ' + all' : [...l.alpha].join(' '))}</td><td>${esc(l.what || '')}<div class="dim">${esc((l.samples || []).join(' · '))}</div></td><td>${esc(isMine(l) ? mineOf[l.id].id : machineOf[l.id].id)}<div class="dim">${esc(isMine(l) ? '' : machineOf[l.id].shapeText)}</div></td><td>${esc(recipeLine(l))}</td><td class="dim">${esc(unlockOf[l.id] || (isMine(l) ? 'there at the start' : 'its inputs'))}</td><td>${l.automatedAt ? colLabel(l.automatedAt) : ''}</td></tr>`).join(NL);
  const overlay = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Lesson and tech tree v4 · ${course.toUpperCase()}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 20px 28px; font: 14px/1.45 system-ui, sans-serif; color: #222; background: #fbfaf7; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 28px 0 8px; }
  .dim { color: #777; font-size: 12px; }
  .scroll { overflow-x: auto; border: 1px solid #ddd; background: #fff; border-radius: 8px; padding: 8px; }
  .legend span { display: inline-block; padding: 2px 8px; border-radius: 6px; margin-right: 6px; font-size: 12px; border: 1px solid #999; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; background: #fff; }
  th, td { border-bottom: 1px solid #e6e6e6; padding: 5px 8px; vertical-align: top; text-align: left; }
  th { position: sticky; top: 0; background: #f2efe8; }
  td.id { font-weight: 700; white-space: nowrap; }
  tr.intro td.id { background: ${FILL.intro}; } tr.syllables td.id { background: ${FILL.syllables}; } tr.words td.id { background: ${FILL.words}; } tr.phrases td.id { background: ${FILL.phrases}; } tr.sentences td.id { background: ${FILL.sentences}; } tr.full td.id { background: ${FILL.full}; } tr.page td.id { background: ${FILL.page}; }
  svg.overlay .edge.hi { opacity: 1; stroke: #c0392b; stroke-width: 2.6; }
  svg.overlay .node { cursor: pointer; }
</style></head><body>
<h1>Lesson tree and tech tree v4 · ${COURSE_NAME}</h1>
<div class="dim">The lesson plan (<code>docs/lessons-v4-${course}.html</code>) with its recipe on every node, from the same build as <code>docs/tech-tree-v4-${course}.html</code>. Ids only.</div>

<div class="legend" style="margin-top:12px">
  <span style="background:${FILL.intro}">introduction (a raw or a key-group recipe)</span><span style="background:${FILL.syllables}">syllables</span><span style="background:${FILL.words}">words</span><span style="background:${FILL.phrases}">phrases</span><span style="background:${FILL.sentences}">sentences</span><span style="background:${FILL.full}">full sentences</span><span style="background:${FILL.page}">pages</span>
  <span style="border-color:#8a8a8a">— material flow</span> <span style="border-color:#3b7dd8;color:#3b7dd8">- - pipe</span> <span style="border-color:#b08a3c;color:#b08a3c">— byproduct</span> <span style="border-color:#c8a0d8;color:#a070b8">· · lineage only</span> <span style="border-width:2.5px;border-color:#333">gather</span>
</div>
<div class="dim">Each node: the lesson, its keys (new ones bold), its place and shape, its recipe with quantities (~ marks a fluid). Column headers say which mine and machines open there. Hover a node for what you type, samples, how it unlocks and when it automates; click to jump to its row.</div>
<div class="scroll">${o}</div>

<h2>Counts and hours</h2>
<ul>
<li>${counts.raws} raws · ${counts.materials} materials (${counts.made} made, ${counts.byproducts} byproducts, ${counts.fluids} fluids) · ${counts.recipes} recipes · ${counts.machines} machines · ${counts.lessons} lessons · ${counts.purchases} purchases.</li>
<li>Keyboard complete ${f1(hoursKeyboard)} h · completion ${f1(hoursCompletion)} h · everything ${f1(hoursAll)} h.</li>
</ul>

<h2>Mines (the raws)</h2>
<div class="scroll"><table><thead><tr><th>raw</th><th>mine</th><th>opens</th><th>keys</th><th>carried by</th><th>consumed by</th></tr></thead><tbody>${mineRows}</tbody></table></div>

<h2>Machines</h2>
<div class="scroll"><table><thead><tr><th>machine</th><th>shape</th><th>opens</th><th>recipes</th><th>which</th></tr></thead><tbody>${mach}</tbody></table></div>

<h2>Every lesson with its recipe</h2>
<div class="scroll"><table><thead><tr><th>id</th><th>col</th><th>keys</th><th>what you type</th><th>place</th><th>recipe</th><th>unlocked by</th><th>automated</th></tr></thead><tbody>${rowsAll}</tbody></table></div>

<script>
  const edges = document.querySelectorAll('svg.overlay .edge');
  document.querySelectorAll('svg.overlay .node').forEach((n) => {
    const id = n.dataset.id;
    n.addEventListener('mouseenter', () => edges.forEach((p) => { if (p.classList.contains('from-' + id) || p.classList.contains('to-' + id)) p.classList.add('hi'); }));
    n.addEventListener('mouseleave', () => edges.forEach((p) => p.classList.remove('hi')));
    n.addEventListener('click', () => { const rows = [...document.querySelectorAll('td.id')].filter((td) => td.textContent === id); const r = rows[rows.length - 1]; if (r) { r.parentElement.scrollIntoView({ block: 'center' }); r.parentElement.style.outline = '2px solid #c0392b'; setTimeout(() => (r.parentElement.style.outline = ''), 1600); } });
  });
</script>
</body></html>`;
  fs.writeFileSync(path.join(ROOT, 'docs', `lesson-tech-tree-v4-${course}.html`), overlay);
  console.log('wrote docs/lesson-tech-tree-v4-' + course + '.html');
  // the same data as a file the game can read, ids only
  const data = {
    course, generated: new Date().toISOString().slice(0, 10),
    lessons: lessons.map((l) => ({ id: l.id, kind: isMine(l) ? 'raw' : l.kind === 'intro' ? 'keys' : l.kind === 'page' ? 'page' : l.rung, col: l.col, keys: l.keys, rung: rungOf(l), family: l.family, what: l.what, alpha: [...l.alpha], marks: l.marks ? [...l.marks] : [], digits: l.digits ? [...l.digits] : [], caps: !!l.caps, focus: l.focusKeys || [], samples: l.samples || [], lineage: l.inputs || [] })),
    materials: materials.map((m) => ({ id: m, raw: poolOfMat[m] === 'raw', fluid: isFluid(m), byproduct: poolOfMat[m] === 'byproduct', madeBy: producers[m][0] })),
    machines: machines.map((m) => ({ id: m.id, shape: m.shape, shapeText: m.shapeText, opens: m.col, recipes: m.recipes })),
    recipes: lessons.filter((l) => !isMine(l)).map((l) => ({ lesson: l.id, machine: machineOf[l.id].id, inputs: inputsOf[l.id].map((m) => ({ id: m, qty: qtyIn(l, m) })), outputs: outputsOf(l).map((m) => ({ id: m, qty: qtyOut(l, m) })) })),
    mines: mech.mines.map((id) => ({ lesson: id, raw: outputOf[id], opens: byId[id].col })),
    purchases: purchases.map((p) => ({ col: p.col, kind: p.kind, target: p.target, price: p.price, label: p.label })),
    completion: plan.completion || [], sim: mech.sim, pricing: mech.pricing, hours: { keyboard: hoursKeyboard, completion: hoursCompletion, all: hoursAll },
  };
  fs.writeFileSync(path.join(ROOT, 'docs', `tree-v4-${course}.json`), JSON.stringify(data, null, 1));
  console.log('wrote docs/tree-v4-' + course + '.json');

  // ---- the module the game loads: js/tree-<course>.js (window.TREE_<COURSE>) ----
  // Everything the runtime needs and nothing it does not: the lessons with
  // their drill specs, the materials with names, the machines with shapes,
  // the recipes with quantities, the mines, the prices, the page texts and
  // the authored sentences. Ids only in the structure; names ride beside.
  let names = { materials: {}, machines: {}, mineOf: null };
  try { names = require(path.join(ROOT, 'docs', `lessons-v4-${course}.names.js`)); } catch (e) { console.log('no names file: ' + e.message); }
  const priceOf = (kind, target) => { const p = purchases.find((x) => x.kind === kind && x.target === target); return p ? Object.fromEntries(p.price.map((x) => [x.id, x.qty])) : null; };
  const rungOfLesson = (l) => (l.kind === 'intro' ? 'streams' : l.kind === 'page' ? 'pages' : l.rung);
  const mod = {
    course,
    scope: plan.scope,
    lessons: lessons.map((l) => ({
      id: l.id, kind: isMine(l) ? 'raw' : l.kind === 'intro' ? 'keys' : l.kind === 'page' ? 'page' : 'recipe',
      col: l.col, rung: rungOfLesson(l), family: l.family || null, cat: l.cat || null, grade: l.grade || null,
      keys: l.keys || [], caps: !!l.caps, hurdle: !!l.hurdle, gather: !!l.gather, ext: !!l.ext,
      what: l.what || '', note: l.note || '',
      alpha: [...l.alpha], marks: l.marks ? [...l.marks] : [], digits: l.digits ? [...l.digits] : [], useCaps: !!l.caps || (l.marks ? false : false),
      focus: l.focusKeys || [], samples: (l.samples || []).slice(0, 3),
      authored: (plan.authored[l.id] || []),
    })),
    // sentence lessons use everything unlocked and carry capitals once Shift is in
    materials: materials.map((m) => ({ id: m, name: (names.materials || {})[m] || m, raw: poolOfMat[m] === 'raw', fluid: isFluid(m), byproduct: poolOfMat[m] === 'byproduct', page: poolOfMat[m] === 'pages', madeBy: producers[m][0] })),
    machines: machines.map((m) => ({ id: m.id, name: (names.machines || {})[m.id] || m.id, shape: m.shape, shapeText: m.shapeText, bi: +m.shape[0], pi: +m.shape[2], bo: +m.shape.split('>')[1][0], po: +m.shape.split('>')[1][2], opens: m.col, recipes: m.recipes, price: priceOf('build', m.id) })),
    recipes: lessons.filter((l) => !isMine(l)).map((l) => ({ lesson: l.id, machine: machineOf[l.id].id, inputs: Object.fromEntries(inputsOf[l.id].map((m) => [m, qtyIn(l, m)])), outputs: Object.fromEntries(outputsOf(l).map((m) => [m, qtyOut(l, m)])), out: outputOf[l.id], autoPrice: priceOf('auto', l.id) })),
    mines: mech.mines.map((id) => ({ lesson: id, raw: outputOf[id], name: names.mineOf ? names.mineOf((names.materials || {})[outputOf[id]] || outputOf[id], isFluid(outputOf[id])) : outputOf[id] + ' mine', opens: byId[id].col, ground: (mech.poolRaws || []).includes(outputOf[id]) ? 'pool' : 'vein', price: priceOf('mine', id), autoPrice: priceOf('auto', id), free: mech.pricing.firstFree.includes(id) })),
    completion: { pages: plan.completion || [], price: priceOf('completion', 'completion') },
    pages: Object.fromEntries(lessons.filter((l) => l.kind === 'page').map((l) => [l.id, plan.pageSamples[l.id] || ''])),
    pricing: mech.pricing, sim: mech.sim,
  };
  const varName = 'TREE_' + course.toUpperCase();
  const js = `// GENERATED by dev/tech-tree-v4-build.js from docs/lessons-v4-${course}.plan.js,\n// docs/lessons-v4-${course}.mech.js and docs/lessons-v4-${course}.names.js. Do not edit by\n// hand: change the plan, the mech layer or the names and rebuild.\n// Global: ${varName}\nwindow.${varName} = ${JSON.stringify(mod)};\n`;
  fs.writeFileSync(path.join(ROOT, 'js', `tree-${course}.js`), js);
  console.log('wrote js/tree-' + course + '.js');
}
