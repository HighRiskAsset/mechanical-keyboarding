// The lesson behind every material, and the time the hands spend at every
// lesson, for one course of the v4 tree. Renders docs/lesson-time-<course>.md.
//
//   node dev/lesson-time.js [bot-run.json ...]     COURSE=en (default) or ru
//
// Two models of a player who automates as soon as the price exists:
//
//  1. The design model: the purchase replay dev/tech-tree-v4-build.js runs to
//     price the tree. Every purchase in column order (a mine, a machine, an
//     engine, a print run, the completion), its price expanded through every
//     recipe not yet automated, and whatever an engine makes arriving free.
//     Costed twice: "as priced", the builder's own charsPerItem (a mine at
//     four keystrokes an ore, a page at 200), which is what the prices were
//     tuned to; and "as the game charges", js/chain.js PER_UNIT (one ore a
//     keystroke, a page at 120), over the purchases the game actually has
//     (there is no print run in play) at the prices js/tree-<course>.js
//     carries. Speed is a flat 30 words a minute (150 characters), and once
//     more on the game's own bars (chain.js BARS: 12 to 35 WPM by how many
//     introductions are open).
//  2. The bot model: dev/bot-sim.js played on the real rules to a clock
//     budget, the keystrokes it spent at each lesson read from the JSON it
//     writes with BOT_OUT. One column per run given on the command line.
//
// Nothing here changes the tree; this is a report.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const course = process.env.COURSE || 'en';
const botFiles = process.argv.slice(2);
// LESSON_TIME_IN: read the tree and its json from another root (a trial build
// written elsewhere); LESSON_TIME_OUT: write the report there instead of docs;
// LESSON_TIME_JSON: also write the per-lesson numbers as JSON; LESSON_TIME_WHY:
// print every purchase that reaches one lesson, with its minutes
const IN = process.env.LESSON_TIME_IN || ROOT;

// ---- the tree the game loads, the purchases the builder priced, the engine's constants ----
const w = {};
eval(fs.readFileSync(path.join(IN, 'js', `tree-${course}.js`), 'utf8').replace(`window.TREE_${course.toUpperCase()}`, 'w.T'));
const T = w.T;
const data = JSON.parse(fs.readFileSync(path.join(IN, 'docs', `tree-v4-${course}.json`), 'utf8'));
const chainSrc = fs.readFileSync(path.join(ROOT, 'js', 'chain.js'), 'utf8');
const PER_UNIT = eval('(' + chainSrc.match(/const PER_UNIT = (\{[^}]*\})/)[1] + ')');
const BARS = eval('(' + chainSrc.match(/const BARS = (\[[\s\S]*?\]);/)[1] + ')');
const CH = T.sim.charsPerItem;
const CPM = T.sim.cpm;                       // 150: 30 words a minute, five characters to a word

const L = T.lessons, byId = {};
for (const l of L) byId[l.id] = l;
const M = {};
for (const m of T.materials) M[m.id] = m;
const name = (id) => (M[id] ? M[id].name : id);
const R = {};
for (const r of T.recipes) R[r.lesson] = r;
const MACH = {};
for (const m of T.machines) MACH[m.id] = m;
const MINE = {};
for (const m of T.mines) MINE[m.lesson] = m;
const isIntro = (l) => l.kind === 'raw' || l.kind === 'keys';
const INTROS = L.filter(isIntro);
const madeBy = (mat) => byId[M[mat].madeBy];
const inputsOf = (l) => (R[l.id] ? R[l.id].inputs : {});
const qtyOut = (l, mat) => (R[l.id] ? R[l.id].outputs[mat] || 1 : 1);
const outputsOf = (l) => (R[l.id] ? R[l.id].outputs : { [MINE[l.id].raw]: 1 });
const keysGame = (l) => (l.kind === 'raw' ? 1 : PER_UNIT[l.rung] || 6);   // app.js: a mine yields an ore a keystroke; a recipe a unit at perUnit
const charsPriced = (l) => CH[l.rung];
// the bar the game shows at column c: by the share of introductions open
const wpmAt = (col) => {
  const n = INTROS.filter((l) => l.col <= col).length;
  return BARS[Math.max(0, Math.min(BARS.length - 1, Math.floor((n / INTROS.length) * BARS.length)))].wpm;
};
const fmtCost = (cost) => Object.entries(cost || {}).map(([m, q]) => `${q} ${name(m)}`).join(' + ') || 'nothing';
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2);

// ---- the game's own prices, per purchase kind ----
function gamePrice(p) {
  if (p.kind === 'mine') return MINE[p.target] ? MINE[p.target].price : null;
  if (p.kind === 'build') return MACH[p.target] ? MACH[p.target].price : null;
  if (p.kind === 'auto') return MINE[p.target] ? MINE[p.target].autoPrice : R[p.target] ? R[p.target].autoPrice : null;
  if (p.kind === 'completion') return T.completion.price;
  return null;   // a print run has no counterpart in play
}
const listPrice = (price) => Object.fromEntries(price.map((x) => [x.id, x.qty]));
const sumPrice = (price) => { const out = {}; for (const x of price) out[x.id] = (out[x.id] || 0) + x.qty; return out; };

// ---- the replay ----
// mode 'priced': the builder's list, its chars. mode 'game': the game's
// purchases and prices, the game's keystrokes. Speed: cpmOf(col).
function replay(mode, cpmOf) {
  const stat = {};
  for (const l of L) stat[l.id] = { items: 0, keys: 0, min: 0, maxPurchase: 0, maxAt: null, purchases: 0, cols: new Set(), automatedAt: null };
  const byCol = {};
  const purchases = [];
  const demand = (mat, qty, col, acc) => {
    const l = madeBy(mat);
    if (!l) return;
    const s = stat[l.id];
    if (s.automatedAt !== null && s.automatedAt <= col) return;
    const runs = qty / qtyOut(l, mat);
    acc[l.id] = (acc[l.id] || 0) + runs;
    for (const [i, q] of Object.entries(inputsOf(l))) demand(i, runs * q, col, acc);
  };
  for (const p of data.purchases) {
    let price;
    if (mode === 'priced') price = sumPrice(p.price);
    else { price = gamePrice(p); if (!price) continue; }
    const acc = {};
    for (const [mat, q] of Object.entries(price)) demand(mat, q, p.col, acc);
    if (p.kind === 'auto') stat[p.target].automatedAt = p.col;
    let minutes = 0;
    const parts = [];
    for (const [id, q] of Object.entries(acc)) {
      const l = byId[id], s = stat[id];
      const ks = q * (mode === 'priced' ? charsPriced(l) : keysGame(l));
      const m = ks / cpmOf(p.col);
      s.items += q; s.keys += ks; s.min += m; s.purchases++; s.cols.add(p.col);
      if (m > s.maxPurchase) { s.maxPurchase = m; s.maxAt = p; }
      minutes += m;
      parts.push({ id, items: q, min: m });
    }
    byCol[p.col] = (byCol[p.col] || 0) + minutes;
    purchases.push({ ...p, gamePrice: price, minutes, parts: parts.sort((a, b) => b.min - a.min) });
  }
  const total = purchases.reduce((a, p) => a + p.minutes, 0) / 60;
  return { stat, byCol, purchases, total };
}
const flat = () => CPM;
const ramp = (col) => wpmAt(col) * 5;
const priced = replay('priced', flat);
const game = replay('game', flat);
const gameRamp = replay('game', ramp);
const COMPLETION_COL = (data.purchases.find((p) => p.kind === 'completion') || {}).col || 26;
const KEYBOARD_COLS = 24;
const hoursTo = (rep, col) => rep.purchases.filter((p) => p.col <= col).reduce((a, p) => a + p.minutes, 0) / 60;

// ---- the bot runs ----
const bots = botFiles.map((f) => {
  const b = JSON.parse(fs.readFileSync(f, 'utf8'));
  b.file = path.basename(f);
  b.label = `${b.hoursBudget === null || b.hoursBudget === undefined || b.hoursBudget === 'Infinity' ? b.hoursOnTheClock : b.hoursBudget} h`;
  b.hoursAt = (id) => (b.byLesson[id] ? b.byLesson[id].keys / b.cps / 3600 : 0);
  b.byCol = {};
  for (const [id, x] of Object.entries(b.byLesson)) { const c = (byId[id] || {}).col || 0; b.byCol[c] = (b.byCol[c] || 0) + x.keys / b.cps / 3600; }
  return b;
});

// ---- the checks the plan asks for (rules A2, A12; the builder's caps) ----
function flagsFor(l, s) {
  const out = [];
  if (isIntro(l)) { if (s.min > 10) out.push(`intro ${f1(s.min)} min (five to ten)`); }
  else if (l.ext) { if (s.min < 3) out.push('extended, nothing asks'); }
  else if (s.min < 3) out.push(`only ${f1(s.min)} min: nothing asks for it`);
  if (s.min > 60) out.push(`${f1(s.min)} min in all (cap 60)`);
  if (s.maxPurchase > 15) out.push(`one purchase asks ${f1(s.maxPurchase)} min (cap 15)`);
  return out;
}

// ---- the lesson in words (the pause menu's bagLesson, js/i18n.js, widened) ----
const TOPIC = { things: 'things', nature: 'nature', home: 'home', rail: 'the railway', people: 'people', time: 'time', place: 'places', life: 'life', work: 'work' };
const SENT = {
  period: 'plain sentences ending in a period', names: 'sentences with capitals and names', clauses: 'sentences joined with commas',
  contractions: 'sentences with apostrophes and hyphens', dash: 'sentences with dashes', past: 'sentences in the past tense',
  questions: 'questions and exclamations', dialogue: 'dialogue in quotation marks', mixed: 'sentences with every mark so far',
  lists: 'lists and asides with colons, semicolons and brackets', numbers: 'sentences with numbers',
  dates: 'full sentences with dates, prices and numbers', everything: 'full sentences using the whole keyboard',
};
const GENRE = { lore: 'lore (the machines talking)', let: 'letters and correspondence', lit: 'famous literature', triv: 'fun trivia', dia: 'dialogue and theatre', tech: 'mathematical and technical writing' };
const and = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''));
// keys as code spans, safe inside a markdown table cell
const keycap = (k) => (k === 'Shift' ? 'Shift' : k === '|' ? '`\\|`' : k === '`' ? '`` ` ``' : '`' + k + '`');
const keycaps = (a) => a.map(keycap).join(' ');
function lessonWords(l) {
  const mostly = l.focus && l.focus.length ? `, mostly ${keycaps(l.focus)}` : '';
  const typedWith = l.alpha.length > 8 ? `${l.alpha.length} letters` : keycaps(l.alpha);
  const extras = (l.marks && l.marks.length ? ` and the marks ${keycaps(l.marks)}` : '') + (l.digits && l.digits.length ? ` and the digits ${l.digits.join('')}` : '');
  if (isIntro(l)) {
    if (l.keys.includes('Shift')) return 'the Shift key: capitals of every letter opened so far, and the pronoun I';
    return `the new key${l.keys.length > 1 ? 's' : ''} ${keycaps(l.keys)}, typed on ${l.keys.length > 1 ? 'their' : 'its'} own, hinted and then blind`;
  }
  if (l.rung === 'syllables') return `syllables typed with ${typedWith}${mostly}`;
  if (l.rung === 'words') {
    const kinds = [];
    const fam = l.family || [];
    if (fam.includes('func')) kinds.push('little words');
    if (fam.includes('adj')) kinds.push('adjectives');
    if (fam.includes('verbs')) kinds.push('verbs');
    const about = fam.filter((t) => TOPIC[t]).map((t) => TOPIC[t]);
    if (about.length) kinds.push('words about ' + and(about));
    return `${and(kinds) || 'words'}, typed with ${typedWith}${mostly}`;
  }
  if (l.rung === 'phrases') return `short phrases typed with ${typedWith}${mostly}`;
  if (l.rung === 'sentences' || l.rung === 'full') return `${SENT[l.family] || 'sentences'}, typed with ${typedWith}${extras}${mostly}`;
  if (l.rung === 'pages') return `a page of ${GENRE[l.cat] || 'writing'}, grade ${l.grade}`;
  return l.what;
}
const engineOf = (price) => (price && Object.keys(price).length ? `engine ${fmtCost(price)}` : 'no engine priced');
function whereMade(l) {
  if (l.kind === 'raw') { const m = MINE[l.id]; return `${m.name}${m.free ? ' (there at the start)' : `; price ${fmtCost(m.price)}`}; ${engineOf(m.autoPrice)}`; }
  const r = R[l.id];
  return `${MACH[r.machine].name}: ${fmtCost(r.inputs)} → ${fmtCost(r.outputs)}; ${engineOf(r.autoPrice)}`;
}
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/`/g, '\\`').replace(/\n/g, ' ');
const escText = (s) => String(s).replace(/\n/g, ' ');   // for text whose keycaps already made their own code spans

// ---- the volume behind the finish: what the belts must carry even with every engine bought ----
const rawMemo = {};
function rawsBehind(mat) {
  if (rawMemo[mat]) return rawMemo[mat];
  const l = madeBy(mat), out = {};
  if (!l || l.kind === 'raw') { out[mat] = 1; return (rawMemo[mat] = out); }
  const q = qtyOut(l, mat);
  for (const [i, n] of Object.entries(inputsOf(l))) for (const [k, v] of Object.entries(rawsBehind(i))) out[k] = (out[k] || 0) + (v * n) / q;
  return (rawMemo[mat] = out);
}
const rawsOf = (cost) => { const out = {}; for (const [m, q] of Object.entries(cost || {})) for (const [k, v] of Object.entries(rawsBehind(m))) out[k] = (out[k] || 0) + v * q; return out; };
const completionRaws = rawsOf(T.completion.price);
const completionRawUnits = Object.values(completionRaws).reduce((a, b) => a + b, 0);
const MINE_S = +(chainSrc.match(/const RATE = \{ mine: ([\d.]+)/) || [])[1] || 2;   // seconds an ore, an automated mine (chain.js RATE)

// ---- discrepancies between what the builder priced and what the game charges ----
const notes = [];
for (const p of data.purchases) {
  const seen = {};
  for (const x of p.price) seen[x.id] = (seen[x.id] || 0) + 1;
  const dup = Object.keys(seen).filter((k) => seen[k] > 1);
  const gp = gamePrice(p);
  if (dup.length && gp) notes.push(`${p.kind} ${p.target} (${p.label}): the builder priced ${fmtCost(sumPrice(p.price))}, the game carries ${fmtCost(gp)} (a repeated id in the price collapsed to its last entry)`);
}
const printRuns = data.purchases.filter((p) => p.kind === 'print');
const printMin = priced.purchases.filter((p) => p.kind === 'print').reduce((a, p) => a + p.minutes, 0);
if (printRuns.length) notes.push(`${printRuns.length} print-run purchases (${f1(printMin / 60)} h as priced) exist only in the builder's replay: nothing in play buys a print run, so a page lesson is typed only for the completion, a machine price and an engine price`);
for (const rung of Object.keys(CH)) if (rung !== 'streams' && CH[rung] !== PER_UNIT[rung]) notes.push(`a ${rung} item is priced at ${CH[rung]} characters but the game emits a unit every ${PER_UNIT[rung]} keystrokes (chain.js PER_UNIT)`);
notes.push(`a mine is priced at ${CH.streams} characters an ore but the game yields an ore a keystroke (app.js workKeystroke): every ore price is four times cheaper in play than on paper`);
notes.push(`the completion price (${fmtCost(T.completion.price)}) expands through the recipe quantities to ${Math.round(completionRawUnits).toLocaleString('en-US')} raw units (${Object.entries(completionRaws).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, q]) => `${Math.round(q).toLocaleString('en-US')} ${name(m)}`).join(', ')}, ...). Automation does not shrink that: an engine consumes at the same ratio, so even with every engine bought the belts carry it all, at ${MINE_S} s an ore per mine, or about ${Math.round((completionRawUnits * MINE_S) / 3600).toLocaleString('en-US')} mine-hours.${completionRawUnits > 1e6 ? " That is why the bot stalls in the middle columns: nothing on paper asks the C4 to C6 lessons for more than an hour, and the real rules ask them for most of a 40 hour run" : " That is a volume a few engines carry in a session, so the bot's per-lesson hours past the first columns now measure its own habits (batches of 300, extra mines, typing rather than waiting) more than the tree"}`);

// ---- render ----
const NL = '\n';
const out = [];
out.push(`# Lesson time, ${course.toUpperCase()} (v4 tree)`);
out.push('');
out.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`dev/lesson-time.js\` from \`js/tree-${course}.js\`, \`docs/tree-v4-${course}.json\` and \`js/chain.js\`${bots.length ? `, with ${bots.length} bot run${bots.length > 1 ? 's' : ''} from \`dev/bot-sim.js\` (${bots.map((b) => b.file).join(', ')})` : ''}. Do not edit by hand; rerun the script.`);
out.push('');
out.push('Two models of a player who automates as soon as an engine can be paid for, both at a flat 30 words a minute (150 characters a minute, spaces counted, the same count the WPM readout uses):');
out.push('');
out.push('- **Design model.** The purchase replay the tree builder prices with: every purchase in column order, its price expanded through every recipe not yet automated, an engine bought the moment its price exists (two columns after the lesson), and whatever an engine makes arriving free and at once. Costed **as priced** (the builder\'s own characters per item, which the prices were tuned to) and **as the game charges** (`js/chain.js` PER_UNIT, one ore a keystroke, over the purchases and prices the game actually carries). The **ramp** column is the game-charged cost typed at the game\'s own bars instead of a flat 30 (`chain.js` BARS: 12, 15, 18, 21, 24, 28, 35 WPM as the introductions open).');
out.push('- **Bot model.** `dev/bot-sim.js` on the real rules (`CHAIN`, `SIM`, `js/bot.js`\'s planner) to a clock budget, the keystrokes it spent at each lesson divided by 2.5 a second. The bot buys an engine as soon as its price costs fewer keystrokes than it would save, builds extra mines, carries up to 300 of a material, and plans only toward the completion.');
out.push('');
out.push('A lesson\'s time is the time at the keys typing what it drills, wherever that typing was demanded from: its own purchases, a later price that reaches back to it, or a byproduct that falls out of it. Walking, menus and waiting are not in it.');
out.push('');

// totals
out.push('## Totals');
out.push('');
out.push('| model | keyboard complete (C24) | completion (C' + COMPLETION_COL + ') | everything |');
out.push('|---|---|---|---|');
out.push(`| design, as priced (the builder's replay) | ${f1(hoursTo(priced, KEYBOARD_COLS))} h | ${f1(hoursTo(priced, COMPLETION_COL))} h | ${f1(priced.total)} h |`);
out.push(`| design, as the game charges, flat 30 WPM | ${f1(hoursTo(game, KEYBOARD_COLS))} h | ${f1(hoursTo(game, COMPLETION_COL))} h | ${f1(game.total)} h |`);
out.push(`| design, as the game charges, on the bars (12 to 35 WPM) | ${f1(hoursTo(gameRamp, KEYBOARD_COLS))} h | ${f1(hoursTo(gameRamp, COMPLETION_COL))} h | ${f1(gameRamp.total)} h |`);
for (const b of bots) out.push(`| bot, ${b.label} on the clock (${b.map}) | typing ${f1(b.hoursSpent.typing)} h of ${f1(b.hoursOnTheClock)} h; ${b.keysOpen} keys open; ${b.outcome} | | |`);
out.push('');
if (bots.length) {
  out.push('Where the bot got to, by the hour its keys came open:');
  out.push('');
  for (const b of bots) out.push(`- ${b.label}: ` + Object.entries(b.opened).sort((x, y) => x[1] - y[1]).map(([id, h]) => `${id} (${keycaps(byId[id].keys)}) ${f1(h)} h`).join(' · '));
  out.push('');
}

// hours by column
const cols = [...new Set(L.map((l) => l.col))].sort((a, b) => a - b);
out.push('## Hours by column');
out.push('');
out.push('The hours the purchases of a column ask of the hands (design) and the hours the bot spent typing lessons that live in that column (bot).');
out.push('');
out.push('| column | opens | as priced | game, flat | game, ramp |' + bots.map((b) => ` bot ${b.label} |`).join(''));
out.push('|---|---|---|---|---|' + bots.map(() => '---|').join(''));
for (const c of cols) {
  const intro = INTROS.filter((l) => l.col === c).map((l) => keycaps(l.keys)).join(', ');
  const pages = L.filter((l) => l.col === c && l.kind === 'page').length;
  out.push(`| C${c} | ${intro || (pages ? `${pages} pages` : '')} | ${f1((priced.byCol[c] || 0) / 60)} | ${f1((game.byCol[c] || 0) / 60)} | ${f1((gameRamp.byCol[c] || 0) / 60)} |` + bots.map((b) => ` ${f2(b.byCol[c] || 0)} |`).join(''));
}
out.push('');

// the lesson behind every material
out.push('## The lesson behind every material');
out.push('');
out.push('Tree order, first material first (the bag panel lists the same materials newest first). The five fluids are here too though they never reach the bag; each has a lesson like any other material. A byproduct has no lesson of its own: it falls out of another lesson\'s recipe, and typing at that lesson is what makes it.');
out.push('');
out.push('| # | material | lesson | col | keys opened | what you type | samples | where it is made | the plan\'s note |');
out.push('|---|---|---|---|---|---|---|---|---|');
let n = 0;
for (const m of T.materials) {
  const l = madeBy(m.id);
  const r = R[l.id];
  const main = r ? r.out : m.id;
  n++;
  const mat = `${m.name}${m.fluid ? ' (fluid)' : ''} \`${m.id}\``;
  if (m.byproduct) {
    out.push(`| ${n} | ${mat} | byproduct of ${l.id} | C${l.col} | | no lesson of its own: falls out of ${l.id} beside ${name(main)}, ${r.outputs[m.id]} a run | | ${esc(whereMade(l))} | |`);
    continue;
  }
  const kind = l.kind === 'raw' ? 'mine' : l.kind === 'keys' ? 'keys' : l.kind === 'page' ? 'page' : l.rung;
  const samples = (l.samples || []).map(esc).join(' · ') + (l.authored && l.authored.length ? ` (+${l.authored.length} authored lines)` : '');
  out.push(`| ${n} | ${mat} | ${l.id} (${kind}${l.gather ? ', gather' : ''}${l.hurdle ? ', hurdle' : ''}${l.ext ? ', extended' : ''}) | C${l.col} | ${keycaps(l.keys)} | ${escText(lessonWords(l))} | ${samples} | ${esc(whereMade(l))} | ${esc(l.note || '')} |`);
}
out.push('');

// time at every lesson
out.push('## Time at every lesson');
out.push('');
out.push('Design columns are the game-charged replay at a flat 30 WPM unless named otherwise: items typed by hand over the whole game, keystrokes, minutes, the minutes of the single purchase that asks most of it (and which), how many purchases reach it, the columns it is typed in, and the column its engine is bought. Flags are the plan\'s caps (rule A12 and the builder\'s checks): an introduction five to ten minutes, a lesson at least three and at most sixty, no purchase over fifteen at one lesson.');
out.push('');
out.push('| lesson | makes | col | kind | items | keystrokes | min, game flat | min, ramp | min, as priced | biggest purchase | purchases | typed in | engine |' + bots.map((b) => ` bot ${b.label} |`).join('') + ' flags |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|' + bots.map(() => '---|').join('') + '---|');
const sorted = L.slice().sort((a, b) => a.col - b.col || L.indexOf(a) - L.indexOf(b));
const flagged = [];
for (const l of sorted) {
  const s = game.stat[l.id], sp = priced.stat[l.id], sr = gameRamp.stat[l.id];
  const kind = l.kind === 'raw' ? 'mine' : l.kind === 'keys' ? 'keys' : l.kind === 'page' ? 'page' : l.rung;
  const makes = Object.keys(outputsOf(l)).map(name).join(' + ');
  const flags = flagsFor(l, s);
  if (flags.length) flagged.push({ l, flags });
  const cs = [...s.cols].sort((a, b) => a - b);
  const typedIn = cs.length ? (cs.length > 3 ? `C${cs[0]}..C${cs[cs.length - 1]} (${cs.length})` : cs.map((c) => 'C' + c).join(' ')) : '';
  const big = s.maxAt ? `${f1(s.maxPurchase)} (${s.maxAt.kind} ${s.maxAt.target}, C${s.maxAt.col})` : '';
  out.push(`| ${l.id}${l.gather ? ' (gather)' : ''}${l.ext ? ' (ext)' : ''} | ${makes} | C${l.col} | ${kind} | ${Math.round(s.items)} | ${Math.round(s.keys)} | ${f1(s.min)} | ${f1(sr.min)} | ${f1(sp.min)} | ${big} | ${s.purchases} | ${typedIn} | ${s.automatedAt ? 'C' + s.automatedAt : ''} |` + bots.map((b) => ` ${f2(b.hoursAt(l.id))} |`).join('') + ` ${flags.join('; ')} |`);
}
out.push('');

// by rung
out.push('### By kind of lesson');
out.push('');
out.push('| kind | lessons | min, game flat | min, ramp | min, as priced |' + bots.map((b) => ` bot ${b.label} (h) |`).join(''));
out.push('|---|---|---|---|---|' + bots.map(() => '---|').join(''));
const kinds = ['mine', 'keys', 'syllables', 'words', 'phrases', 'sentences', 'full', 'pages'];
const kindOf = (l) => (l.kind === 'raw' ? 'mine' : l.kind === 'keys' ? 'keys' : l.rung);
for (const k of kinds) {
  const ls = L.filter((l) => kindOf(l) === k);
  const sum = (rep) => ls.reduce((a, l) => a + rep.stat[l.id].min, 0);
  out.push(`| ${k} | ${ls.length} | ${f1(sum(game))} | ${f1(sum(gameRamp))} | ${f1(sum(priced))} |` + bots.map((b) => ` ${f1(ls.reduce((a, l) => a + b.hoursAt(l.id), 0))} |`).join(''));
}
out.push('');

// flags
out.push('### Flags (design model, as the game charges, flat 30 WPM)');
out.push('');
if (!flagged.length) out.push('None.');
for (const { l, flags } of flagged) out.push(`- ${l.id} (${name(Object.keys(outputsOf(l))[0])}, C${l.col}): ${flags.join('; ')}`);
out.push('');
const flaggedPriced = sorted.map((l) => ({ l, flags: flagsFor(l, priced.stat[l.id]) })).filter((x) => x.flags.length);
out.push('### Flags (design model, as priced)');
out.push('');
if (!flaggedPriced.length) out.push('None: this is the replay the builder checks, and it passes.');
for (const { l, flags } of flaggedPriced) out.push(`- ${l.id} (${name(Object.keys(outputsOf(l))[0])}, C${l.col}): ${flags.join('; ')}`);
out.push('');

// notes
out.push('## Where the paper and the game part ways');
out.push('');
for (const x of notes) out.push(`- ${x}`);
out.push('');

// what the method cannot see
out.push('## What this method cannot see');
out.push('');
out.push('- **Time at a lesson is not rehearsal of its keys.** A lesson\'s minutes are spread over its alphabet: a gather typed with 26 letters gives each key a sliver, an introduction gives two keys everything. Lesson minutes measure boredom; the builder\'s per-key exposure check measures learning. Judge with both.');
out.push('- **A flat speed makes minutes a rescaling of keystrokes.** The ranking of lessons at 30 WPM is the ranking by keystrokes. The ramp column shows where a flat rate misleads: the first columns, typed at 12 to 15 WPM, take about twice what the flat model says, and those are the columns whose lessons are already the longest in keystrokes.');
out.push('- **The typist never errs.** Both models count correct keystrokes only. A learner at 95% accuracy with stop-on-error spends time on errors and corrections that make nothing, most of all on fresh keys.');
out.push('- **Each model is one player.** The design model buys every engine at exactly two columns and makes exactly what a price asks; the bot buys an engine when it pays back in keystrokes, builds extra mines, carries 300 at a time and plans only toward the completion. A person who automates late, forgets, or over-builds gets other numbers. Neither model brackets the human.');
out.push('- **Demand comes from below, not from the material.** A lesson is typed because later prices reach through it: Reinforced Iron Plate is the longest lesson in the design model not because anything wants phrases but because thirteen purchases pass through it. Moving one price moves the minutes of lessons two columns back, so a judgement per material needs the why chain.');
out.push('- **Automated output is free on paper and not in play.** The design model hands over whatever an engine makes at once; the real engines make a unit every few seconds and the finish needs tens of millions of raw units. Until the quantities change, the bot\'s numbers past the middle columns say nothing about the lessons, and the design model\'s numbers assume a fix that keeps the prices.');
out.push('- **The line is a random draw.** The engine samples words by weakness and frequency and a unit is a fixed number of keystrokes, so the item counts here are keystroke units, not words or sentences, and the per-key mix inside a lesson follows the player\'s own weak keys.');
out.push('- **Only the keys are timed.** Walking, menus, reading the caption and deciding are outside a lesson\'s time; the bot spent about a sixth of its clock on them, and a person spends more. Fine for rehearsal, short for session length.');
out.push('- **Digits and shifted marks are slower than home-row letters.** One flat rate for a number sentence and a period sentence understates the number lesson; the ramp does not fix that either, since it varies by column, not by content.');
out.push('- **The extended lessons and the advanced pages are optional.** The bot never touches them (not on the completion path), the design model prices them; their numbers are what a player who chooses them would spend.');
out.push('');

const file = process.env.LESSON_TIME_OUT || path.join(ROOT, 'docs', `lesson-time-${course}.md`);
fs.writeFileSync(file, out.join(NL) + NL);
console.log(`wrote ${path.relative(ROOT, file) || file}`);
if (process.env.LESSON_TIME_JSON) {
  const lessons = {};
  for (const l of L) lessons[l.id] = { col: l.col, kind: l.kind === 'raw' ? 'mine' : l.kind === 'keys' ? 'keys' : l.rung, makes: Object.keys(outputsOf(l)).map(name),
    minFlat: game.stat[l.id].min, minRamp: gameRamp.stat[l.id].min, minPriced: priced.stat[l.id].min, maxPurchase: game.stat[l.id].maxPurchase, purchases: game.stat[l.id].purchases, keys: game.stat[l.id].keys, flags: flagsFor(l, game.stat[l.id]) };
  fs.writeFileSync(process.env.LESSON_TIME_JSON, JSON.stringify({ hours: { priced: priced.total, flat: game.total, ramp: gameRamp.total, flatKeyboard: hoursTo(game, KEYBOARD_COLS), flatCompletion: hoursTo(game, COMPLETION_COL) }, completionRawUnits, lessons }, null, 1));
}
if (process.env.LESSON_TIME_WHY) {
  const id = process.env.LESSON_TIME_WHY;
  console.log(`purchases reaching ${id} (game-charged, flat):`);
  for (const p of game.purchases) { const part = p.parts.find((x) => x.id === id); if (part) console.log(`  C${p.col} ${p.kind} ${p.target}: ${f1(part.min)} min, ${Math.round(part.items)} items  (${fmtCost(p.gamePrice)})`); }
}
console.log(`hours: as priced ${f1(priced.total)} (keyboard ${f1(hoursTo(priced, KEYBOARD_COLS))}, completion ${f1(hoursTo(priced, COMPLETION_COL))}) · game flat ${f1(game.total)} (keyboard ${f1(hoursTo(game, KEYBOARD_COLS))}, completion ${f1(hoursTo(game, COMPLETION_COL))}) · game ramp ${f1(gameRamp.total)}`);
console.log(`flags (game flat): ${flagged.length}`);
for (const { l, flags } of flagged) console.log('  ' + l.id + ': ' + flags.join('; '));
console.log(`notes: ${notes.length}`);
for (const x of notes) console.log('  ' + x);
