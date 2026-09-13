// Builds docs/lessons-v4-<course>.html from docs/lessons-v4-<course>.plan.js
// and the course data in js/language-<course>.js. Everything on the page
// that is a fact about the language (alphabets, pool sizes, samples,
// coverage) is computed here; the plan file only holds structure.
//
//   node dev/lessons-v4-build.js ru
'use strict';
const fs = require('fs');
const path = require('path');

const course = (require.main === module ? process.argv[2] : process.env.COURSE) || 'ru';
const ROOT = path.join(__dirname, '..');
const plan = require(path.join(ROOT, 'docs', `lessons-v4-${course}.plan.js`));
const src = fs.readFileSync(path.join(ROOT, 'js', `language-${course}.js`), 'utf8');
const lay = fs.readFileSync(path.join(ROOT, 'js', `layout-${course}.js`), 'utf8');

// ---- course data, lifted out of the IIFE by pattern ----
const block = (name) => {
  const m = src.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n  \\];`));
  if (!m) throw new Error('no block ' + name);
  return m[1];
};
const pairs = (text) => [...text.matchAll(/\['((?:[^'\\]|\\.)+)',\s*(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g)].map((x) => x[1].replace(/\\'/g, "'"));
const FREQ = eval('(' + src.match(/const LETTER_FREQ = (\{[\s\S]*?\});/)[1] + ')');
const WORDS = [...block('WORDS').matchAll(/\['([^']+)',\s*(?:'(?:[^'\\]|\\.)*'|"[^"]*"),\s*'(\w+)'\]/g)].map((x) => ({ w: x[1], set: x[2] }));
const SYL = [...block('SYLLABLES').matchAll(/\['([^']+)', \d+\]/g)].map((x) => x[1])
  .concat([...block('MORE_SYLLABLES').matchAll(/\['([^']+)', \d+\]/g)].map((x) => x[1]));
const PHRASES = pairs(block('PHRASES'));
const SENTENCES = pairs(block('SENTENCES')).map((s) => s.replace(/ - /g, ' — '));
const NAMES = pairs(block('NAMES'));
const CODE_TO_CHAR = eval('(' + lay.match(/const CODE_TO_CHAR = (\{[\s\S]*?\});/)[1] + ')');
const CHAR_CODE = {}; for (const [c, ch] of Object.entries(CODE_TO_CHAR)) CHAR_CODE[ch] = c;

const LETTERS = new Set(plan.scope.letters);
const DIGITS = new Set(plan.scope.digits);
const MARKS = new Set(plan.scope.marks.concat(plan.scope.extended));
const RUNGS = ['streams', 'syllables', 'words', 'phrases', 'sentences', 'full', 'pages'];
const rungIx = (r) => RUNGS.indexOf(r);
const T = plan.thresholds;

// ---- columns and the unlocked sets ----
const byId = {}; for (const l of plan.lessons) byId[l.id] = l;
let col = 0;
for (const l of plan.lessons) if (l.kind === 'intro' && !l.ext) l.col = ++col;
const KEYBOARD_COLS = col;
// a page sits at its order; an extended intro sits one column after the
// lesson it opens behind; anything else sits one column after its newest
// input (expansions share their newest input's column)
const colOf = (id) => {
  const l = byId[id];
  if (l.col) return l.col;
  if (l.kind === 'page' && l.order) l.col = (plan.pageBase || KEYBOARD_COLS) + l.order;
  else if (l.after) l.col = colOf(l.after) + 1;
  else l.col = Math.max(...l.inputs.map(colOf)) + (l.kind === 'exp' ? 0 : 1);
  return l.col;
};
for (const l of plan.lessons) colOf(l.id);
const PAGE_BASE = plan.pageBase || KEYBOARD_COLS;
// completion is a list of pages; its column is where the last of them opens
const COMPLETION_COL = Math.max(...(plan.completion || []).map((id) => byId[id].col));

// unlocked[c] = { letters, marks, digits, caps } after column c
const unlocked = [];
{
  const acc = { letters: new Set(), marks: new Set(), digits: new Set(), caps: false };
  for (let c = 1; c <= KEYBOARD_COLS; c++) {
    const intro = plan.lessons.find((l) => l.kind === 'intro' && l.col === c);
    for (const k of intro.keys) {
      if (LETTERS.has(k)) acc.letters.add(k);
      else if (DIGITS.has(k)) acc.digits.add(k);
      else if (k === 'Shift') acc.caps = true;
      else acc.marks.add(k);
    }
    unlocked[c] = { letters: new Set(acc.letters), marks: new Set(acc.marks), digits: new Set(acc.digits), caps: acc.caps };
  }
}
// share of running text: the frequency table covers letters and the core
// marks, and its total is the denominator, so 100% means every key it knows
const FREQ_TOTAL = Object.entries(FREQ).filter(([k]) => LETTERS.has(k) || plan.scope.marks.includes(k)).reduce((s, [, v]) => s + v, 0);
const cov = (u) => ([...u.letters].reduce((s, ch) => s + (FREQ[ch] || 0), 0) + [...u.marks].reduce((s, ch) => s + (FREQ[ch] || 0), 0)) * 100 / FREQ_TOTAL;

// ---- alphabets ----
const alphaOf = (l) => {
  if (l.alpha) return l.alpha;
  if (l.kind === 'intro') { l.alpha = new Set(l.keys.filter((k) => LETTERS.has(k))); return l.alpha; }
  if (l.kind === 'exp' && rungIx(l.rung) <= rungIx('phrases')) {
    l.alpha = new Set();
    for (const i of l.inputs) for (const ch of alphaOf(byId[i])) l.alpha.add(ch);
    return l.alpha;
  }
  const u = unlocked[Math.min(l.col, KEYBOARD_COLS)];
  l.alpha = new Set(u.letters); l.marks = u.marks; l.digits = u.digits; l.caps = u.caps;
  return l.alpha;
};
for (const l of plan.lessons) alphaOf(l);
const introCol = (c) => plan.lessons.find((l) => l.kind === 'intro' && l.col === c);
for (const l of plan.lessons) if (l.kind === 'exp') {
  const intro = introCol(l.col);
  l.focusKeys = intro ? intro.keys.filter((k) => LETTERS.has(k) || MARKS.has(k) || DIGITS.has(k)) : [];
  l.newKeys = intro ? intro.keys : [];
}

// ---- writability ----
const writableWord = (w, alpha) => [...w].every((ch) => alpha.has(ch));
const sentenceOk = (s, l) => {
  const u = { letters: l.alpha, marks: l.marks || new Set(), digits: l.digits || new Set(), caps: l.caps };
  for (const ch of s) {
    if (ch === ' ') continue;
    const lo = ch.toLowerCase();
    if (LETTERS.has(lo)) { if (!u.letters.has(lo)) return false; if (ch !== lo && !u.caps) return false; continue; }
    if (DIGITS.has(ch)) { if (!u.digits.has(ch)) return false; continue; }
    if (u.marks.has(ch)) continue;
    return false;
  }
  return true;
};
const FAMILY_TEST = {
  period: (s) => /^[^,?!:;"«»()—\d]*\.$/.test(s),
  names: (s) => /^[^,?!:;"«»()—\d]*\.$/.test(s),
  clauses: (s) => s.includes(','),
  dash: (s) => /—|\S-\S/.test(s),
  past: (s) => /(^|\s)(был|была|были|было)(\s|[.,!?])|л[аи]?[.,]/.test(s),
  questions: (s) => /[?!]/.test(s),
  dialogue: (s) => /["«»]/.test(s),
  lists: (s) => /[:;()]/.test(s),
  numbers: (s) => /\d/.test(s),
  dates: (s) => /\d/.test(s),
  mixed: () => true,
  everything: () => true,
};
const cap = (s, l) => (l.caps ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ---- pools and samples ----
for (const l of plan.lessons) {
  const authored = (plan.authored[l.id] || []);
  l.authored = authored.length;
  l.checks = [];
  l.pool = {};
  const alpha = l.alpha;
  const hasFocus = (s) => l.focusKeys && l.focusKeys.some((k) => s.includes(k));
  const pick = (arr, n = 3) => {
    const a = arr.filter(hasFocus), b = arr.filter((x) => !hasFocus(x));
    return a.slice(0, n).concat(b.slice(0, Math.max(0, n - a.length)));
  };
  // every lesson below sentences knows how many words its alphabet writes
  const words = WORDS.filter((x) => writableWord(x.w, alpha));
  const syl = SYL.filter((s) => writableWord(s, alpha) && s.length >= 2).concat(authored.filter((s) => writableWord(s, alpha) && s.length >= 2 && s.length <= 4));
  const phrases = PHRASES.filter((p) => writableWord(p.replace(/ /g, ''), alpha));
  const funcWords = words.filter((x) => x.set === 'func').length;
  l.pool.words = words.length; l.pool.syllables = syl.length; l.pool.phrases = phrases.length; l.pool.func = funcWords;
  if (l.kind === 'intro') {
    l.what = l.caps ? 'capitals of every unlocked letter' : `streams over ${l.keys.join(' ')}`;
    l.samples = l.caps ? NAMES.filter((n) => writableWord(n.toLowerCase(), unlocked[l.col].letters)).slice(0, 3) : [l.keys.join(' ')];
    continue;
  }
  if (l.kind === 'page') {
    l.what = `${plan.pages[l.cat].name}, grade ${l.grade}`;
    l.samples = [plan.pageSamples[l.id] || ''];
    continue;
  }
  if (l.rung === 'syllables') {
    l.what = 'syllables';
    l.samples = pick(syl);
    l.checks.push(syl.length >= T.syllables ? `✓ ${syl.length} syllables` : `✗ only ${syl.length} syllables (need ${T.syllables})`);
    if (words.length >= T.words) l.checks.push(`↑ ${words.length} words writable: could be a words lesson`);
  } else if (l.rung === 'words') {
    const fam = words.filter((x) => l.family.includes(x.set));
    const focus = fam.filter((x) => hasFocus(x.w));
    l.pool.family = fam.length; l.pool.focus = focus.length;
    l.what = `words: ${l.family.join(', ')}`;
    l.samples = pick(fam.map((x) => x.w)).concat(authored.filter((w) => !w.includes(' ') && writableWord(w, alpha))).slice(0, 3);
    l.checks.push(words.length >= T.words ? `✓ ${words.length} words, ${fam.length} in family` : `✗ only ${words.length} words (need ${T.words})`);
    if (l.focus && focus.length < 8) l.checks.push(`✗ only ${focus.length} family words carry ${l.focusKeys.join(' ')}`);
    if (words.length >= T.phrases && funcWords >= T.phrasesFunc && phrases.length >= 10) l.checks.push(`↑ ${phrases.length} phrases writable: could be phrases`);
  } else if (l.rung === 'phrases') {
    l.what = 'phrases';
    l.samples = pick(phrases);
    l.checks.push(words.length >= T.phrases && funcWords >= T.phrasesFunc ? `✓ ${words.length} words, ${funcWords} little words, ${phrases.length} phrases` : `✗ ${words.length} words / ${funcWords} little words (need ${T.phrases} / ${T.phrasesFunc})`);
  } else {
    // sentences and full sentences: alphabet is everything unlocked
    const test = FAMILY_TEST[l.family] || (() => true);
    const course_ = SENTENCES.filter((s) => sentenceOk(s, l) && test(s)).map((s) => cap(s, l));
    const auth = authored.filter((s) => sentenceOk(s, l) && test(s));
    const bad = authored.filter((s) => !sentenceOk(s, l));
    const all = auth.concat(course_);
    l.pool.sentences = all.length; l.pool.authoredOk = auth.length;
    l.what = (l.rung === 'full' ? 'full sentences: ' : 'sentences: ') + l.family;
    l.samples = pick(all);
    const need = T.sentences;
    l.checks.push(all.length >= need ? `✓ ${all.length} sentences (${course_.length} in the course data, ${auth.length} authored)` : `✗ ${all.length} sentences (${course_.length} course, ${auth.length} authored; need ${need})`);
    if (bad.length) l.checks.push(`✗ authored but not writable here: ${bad.join(' | ')}`);
    // full sentences = the whole core scope: every mark, every digit, capitals
    const missing = plan.scope.marks.filter((m) => !l.marks.has(m)).concat(plan.scope.digits.filter((d) => !l.digits.has(d)));
    if (!l.caps) missing.push('capitals');
    if (l.rung === 'full' && missing.length) l.checks.push(`✗ full sentences without ${missing.join(' ')}`);
    if (l.rung === 'sentences' && !missing.length) l.checks.push('↑ the whole core scope is in: could be full sentences');
  }
  if (l.family === 'names') {
    const names = NAMES.filter((n) => writableWord(n.toLowerCase(), alpha));
    l.pool.names = names.length;
    l.samples = l.samples.slice(0, 2).concat(names.slice(0, 1));
  }
}

// ---- graph checks: never regress, spans, distinctness, feeds ----
const rungOfLesson = (l) => (l.kind === 'intro' ? 0 : l.kind === 'page' ? 6 : rungIx(l.rung));
for (const l of plan.lessons) l.feeds = [];
for (const l of plan.lessons) if (l.inputs) for (const i of l.inputs) byId[i].feeds.push(l.id);
for (const l of plan.lessons) {
  if (l.kind !== 'exp') continue;
  const ins = l.inputs.map((i) => byId[i]);
  const maxIn = Math.max(...ins.map(rungOfLesson));
  if (rungOfLesson(l) < maxIn) l.checks.push(`✗ regresses below an input (${RUNGS[maxIn]})`);
  if (rungIx(l.rung) <= rungIx('phrases')) {
    for (const i of ins) {
      const grows = [...l.alpha].some((ch) => !i.alpha.has(ch));
      if (!grows && rungOfLesson(l) === rungOfLesson(i)) l.checks.push(`✗ neither wider nor higher than ${i.id}`);
    }
  }
  l.expands = ins.filter((i) => i.col >= l.col - 1).map((i) => i.id);
  l.reviews = ins.filter((i) => i.col < l.col - 1).map((i) => i.id);
  l.span = l.col - Math.min(...ins.map((i) => i.col));
  if (!l.expands.length) l.checks.push('✗ no expansion input from this or the previous column');
  if (l.col > 1 && !ins.some((i) => i.col < l.col)) l.checks.push('✗ nothing from an earlier column');
}
// review is a property of the column: every column past the second has at
// least one lesson that reaches two or more columns back
const columnProblems = [];
for (let c = 3; c <= KEYBOARD_COLS; c++) {
  const exps = plan.lessons.filter((l) => l.kind === 'exp' && l.col === c);
  if (!exps.some((l) => l.reviews.length)) columnProblems.push(`C${c}: no lesson reaches back two or more columns`);
}
// a page needs every letter, and every input it names must exist by its column
const lettersDoneCol = (() => { for (let c = 1; c <= KEYBOARD_COLS; c++) if (unlocked[c].letters.size === LETTERS.size) return c; return KEYBOARD_COLS; })();
for (const l of plan.lessons) {
  if (l.kind !== 'page') continue;
  if (l.col < lettersDoneCol) l.checks.push(`✗ opens at C${l.col}, before the last letters (C${lettersDoneCol})`);
  for (const i of l.inputs) if (byId[i].col > l.col) l.checks.push(`✗ input ${i} arrives later (C${byId[i].col})`);
}
const seen = new Map();
for (const l of plan.lessons) {
  if (l.kind !== 'exp') continue;
  const key = [...l.alpha].sort().join('') + [...(l.marks || [])].sort().join('') + [...(l.digits || [])].sort().join('') + '|' + l.rung + '|' + (Array.isArray(l.family) ? l.family.join(',') : l.family);
  if (seen.has(key)) l.checks.push(`✗ same alphabet, rung and family as ${seen.get(key)}`); else seen.set(key, l.id);
}

// ---- summaries ----
const lessonsPerCol = {};
for (const l of plan.lessons) lessonsPerCol[l.col] = (lessonsPerCol[l.col] || 0) + 1;
const coverage = [];
for (let c = 1; c <= KEYBOARD_COLS; c++) coverage.push({ col: c, intro: introCol(c).keys.join(' '), cov: cov(unlocked[c]), letters: unlocked[c].letters.size });
const firstRung = {};
for (const l of plan.lessons) if (l.kind === 'exp' && !(l.checks.some((c) => c.startsWith('✗')))) if (!firstRung[l.rung]) firstRung[l.rung] = l.col;
const counts = { intro: 0, exp: 0, page: 0, ext: 0 };
for (const l of plan.lessons) counts[l.ext ? 'ext' : l.kind]++;
const problems = plan.lessons.flatMap((l) => l.checks.filter((c) => c.startsWith('✗')).map((c) => `${l.id}: ${c}`)).concat(columnProblems);
const reviewEdges = {};
for (const l of plan.lessons) if (l.kind === 'exp' && l.col <= KEYBOARD_COLS) reviewEdges[l.col] = (reviewEdges[l.col] || 0) + l.reviews.length;
const letterCols = coverage.filter((c) => /[а-яё]/.test(c.intro));
const rises = plan.lessons.flatMap((l) => l.checks.filter((c) => c.startsWith('↑')).map((c) => `${l.id}: ${c}`));

// ---- console report ----
const MAIN = require.main === module;
if (MAIN) {
  console.log(`lessons: ${counts.intro} intros, ${counts.exp} expansions, ${counts.page} pages, ${counts.ext} extended (${plan.lessons.length} total)`);
  console.log('coverage by column: ' + coverage.map((c) => `C${c.col} ${c.cov.toFixed(0)}%`).join(' · '));
  console.log('first column per rung: ' + JSON.stringify(firstRung));
  console.log('problems: ' + problems.length); for (const p of problems) console.log('  ' + p);
  console.log('could rise: ' + rises.length); for (const p of rises) console.log('  ' + p);
}
// the tech-tree builder requires this file for the computed lessons
module.exports = { plan, byId, KEYBOARD_COLS, COMPLETION_COL, coverage, FREQ, LETTERS, DIGITS, MARKS, RUNGS, rungIx, unlocked, introCol, problems };

// ---- render ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FILL = { intro: '#e6c47a', syllables: '#a9cfea', words: '#9fd3a5', phrases: '#cfe3a0', sentences: '#f3c6a2', full: '#eaa6a6', page: '#d7c4ee', ext: '#e3e3e3' };
const fillOf = (l) => (l.kind === 'intro' ? (l.ext ? FILL.ext : FILL.intro) : l.kind === 'page' ? (l.grade > 3 ? FILL.ext : FILL.page) : FILL[l.rung]);
const keysLine = (l) => {
  if (l.kind === 'intro') return `<tspan font-weight="700">${esc(l.keys.join(' '))}</tspan>`;
  if (l.kind === 'page') return esc(l.cat + ' ' + l.grade);
  const a = [...l.alpha];
  const focus = new Set(l.focusKeys || []);
  if (rungIx(l.rung) >= rungIx('sentences')) {
    const marks = [...(l.marks || [])].join('');
    return `<tspan font-weight="700">${esc(l.focusKeys.join(' '))}</tspan> + ${a.length} letters ${esc(marks)}${l.digits && l.digits.size ? ' 0-9' : ''}`;
  }
  if (a.length <= 12) return a.map((ch) => (focus.has(ch) ? `<tspan font-weight="700">${esc(ch)}</tspan>` : esc(ch))).join(' ');
  return `<tspan font-weight="700">${esc(l.focusKeys.join(' '))}</tspan> + ${a.length - l.focusKeys.filter((k) => LETTERS.has(k)).length} more`;
};
const COLW = 158, NW = 140, ROWH = 78, NH = 64, X0 = 24, Y0 = 44;
const slotOf = {};
{
  const per = {};
  for (const l of plan.lessons) { per[l.col] = per[l.col] || 0; slotOf[l.id] = per[l.col]++; }
}
const nodeX = (l) => X0 + (l.col - 1) * COLW;
const nodeY = (l) => Y0 + slotOf[l.id] * ROWH;
const maxSlots = Math.max(...Object.values(lessonsPerCol));
const totalCols = Math.max(...plan.lessons.map((l) => l.col));
const W = X0 * 2 + totalCols * COLW, H = Y0 + maxSlots * ROWH + 20;
let svg = `<svg class="tree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
// column headers
for (let c = 1; c <= totalCols; c++) {
  const intro = introCol(c);
  const label = c <= KEYBOARD_COLS ? `C${c}` : c <= COMPLETION_COL ? `pages ${c - PAGE_BASE}` : `beyond ${c - COMPLETION_COL}`;
  const sub = c <= KEYBOARD_COLS ? `${coverage[c - 1].cov.toFixed(0)}% of text${c === PAGE_BASE + 1 ? ' · pages open' : ''}` : c === KEYBOARD_COLS + 1 ? 'keyboard complete' : c === COMPLETION_COL + 1 ? 'completion' : '';
  svg += `<text x="${X0 + (c - 1) * COLW + NW / 2}" y="16" text-anchor="middle" font-size="12" font-weight="700" fill="#555">${label}</text>`;
  if (sub) svg += `<text x="${X0 + (c - 1) * COLW + NW / 2}" y="31" text-anchor="middle" font-size="10" fill="#888">${sub}</text>`;
  if (c === KEYBOARD_COLS + 1 || c === COMPLETION_COL + 1 || c === PAGE_BASE + 1) svg += `<line x1="${X0 + (c - 1) * COLW - 9}" y1="6" x2="${X0 + (c - 1) * COLW - 9}" y2="${H}" stroke="#999" stroke-width="1.5" stroke-dasharray="5 4"/>`;
}
// edges
for (const l of plan.lessons) if (l.inputs) for (const i of l.inputs) {
  const a = byId[i];
  const x1 = nodeX(a) + NW, y1 = nodeY(a) + NH / 2, x2 = nodeX(l), y2 = nodeY(l) + NH / 2;
  const dx = Math.max(30, (x2 - x1) / 2);
  const review = a.col < l.col - 1;
  const far = l.col - a.col > 4;   // the vowel banks feed every syllable lesson; keep those long edges faint
  svg += `<path class="edge from-${a.id} to-${l.id}${review ? ' review' : ''}" d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}" fill="none" stroke="${review ? '#b08a3c' : '#8a8a8a'}" stroke-width="${far ? 0.8 : review ? 1.2 : 1.4}" opacity="${far ? 0.3 : review ? 0.55 : 0.6}"/>`;
}
// nodes
for (const l of plan.lessons) {
  const x = nodeX(l), y = nodeY(l);
  const gather = l.gather ? ' stroke="#333" stroke-width="2.5"' : ' stroke="#666" stroke-width="1"';
  const title = `${l.id} · ${l.what}\n${l.samples.join(' · ')}\n${(l.checks || []).join('\n')}`;
  svg += `<g class="node" data-id="${l.id}" transform="translate(${x},${y})"><title>${esc(title)}</title>`;
  svg += `<rect width="${NW}" height="${NH}" rx="8" fill="${fillOf(l)}"${gather}/>`;
  svg += `<text x="8" y="16" font-size="11" font-weight="700" fill="#222">${esc(l.id)}${l.gather ? ' · gather' : ''}${l.hurdle ? ' · hurdle' : ''}</text>`;
  svg += `<text x="8" y="33" font-size="12" fill="#111">${keysLine(l)}</text>`;
  const what = l.kind === 'intro' ? (l.caps ? 'capitals' : 'streams') : l.kind === 'page' ? plan.pages[l.cat].name : l.what;
  svg += `<text x="8" y="50" font-size="10.5" fill="#333">${esc(what.length > 26 ? what.slice(0, 25) + '…' : what)}</text>`;
  svg += `</g>`;
}
svg += '</svg>';

// coverage curve
let curve = '';
{
  const cw = 720, ch = 200, px = 40, py = 20;
  const xs = (i) => px + (i / (KEYBOARD_COLS - 1)) * (cw - px - 10);
  const ys = (v) => py + (1 - v / 100) * (ch - py - 30);
  curve += `<svg viewBox="0 0 ${cw} ${ch}" width="${cw}" height="${ch}" font-family="system-ui, sans-serif" font-size="10">`;
  for (const v of [50, 80, 95, 100]) curve += `<line x1="${px}" y1="${ys(v)}" x2="${cw - 10}" y2="${ys(v)}" stroke="#ddd"/><text x="4" y="${ys(v) + 3}" fill="#777">${v}%</text>`;
  curve += `<polyline fill="none" stroke="#b5651d" stroke-width="2" points="${coverage.map((c, i) => `${xs(i)},${ys(c.cov)}`).join(' ')}"/>`;
  coverage.forEach((c, i) => { curve += `<circle cx="${xs(i)}" cy="${ys(c.cov)}" r="3" fill="#b5651d"/><text x="${xs(i)}" y="${ch - 6}" text-anchor="middle" fill="#555">${esc(c.intro.length > 5 ? c.intro.slice(0, 5) : c.intro)}</text>`; });
  curve += '</svg>';
}

const rows = plan.lessons.map((l) => {
  const keys = l.kind === 'intro' ? `<b>${esc(l.keys.join(' '))}</b> <span class="dim">${esc(l.strokes || '')}</span>`
    : l.kind === 'page' ? `<span class="dim">from: ${esc(l.inputs.join(', '))}</span>`
    : rungIx(l.rung) >= rungIx('sentences') ? `<b>${esc(l.focusKeys.join(' '))}</b> <span class="dim">+ all ${l.alpha.size} letters; marks ${esc([...(l.marks || [])].join(' '))}${l.caps ? '; capitals' : ''}${l.digits && l.digits.size ? '; digits ' + [...l.digits].join('') : ''}</span>`
    : [...l.alpha].map((ch) => ((l.focusKeys || []).includes(ch) ? `<b>${esc(ch)}</b>` : esc(ch))).join(' ');
  const pool = l.kind === 'exp' ? Object.entries(l.pool).filter(([k]) => ['syllables', 'words', 'family', 'focus', 'phrases', 'sentences', 'names'].includes(k)).map(([k, v]) => `${k} ${v}`).join(' · ') : '';
  const inputs = l.kind === 'exp' ? `${l.expands.map((i) => `<span class="ex">${i}</span>`).join(' ')} ${l.reviews.map((i) => `<span class="rv">↶ ${i}</span>`).join(' ')}` : l.inputs ? l.inputs.join(', ') : '';
  const checks = (l.checks || []).map((c) => `<div class="${c[0] === '✓' ? 'ok' : c[0] === '↑' ? 'rise' : 'bad'}">${esc(c)}</div>`).join('');
  const cls = l.kind === 'intro' ? 'intro' : l.kind === 'page' ? 'page' : l.rung;
  return `<tr class="${cls}${l.gather ? ' gather' : ''}" id="row-${l.id}"><td class="id">${esc(l.id)}${l.gather ? '<br><span class="tag">gather</span>' : ''}${l.hurdle ? '<br><span class="tag">hurdle</span>' : ''}${l.milestone ? `<br><span class="tag">${esc(l.milestone)}</span>` : ''}</td><td>${l.col <= KEYBOARD_COLS ? 'C' + l.col : l.kind === 'page' ? 'P' + l.grade : 'X'}</td><td class="keys">${keys}</td><td>${esc(l.what)}<div class="dim">${esc(l.note || '')}</div></td><td class="samples">${l.samples.map((s) => esc(s)).join('<br>')}${l.authored ? `<div class="dim">${l.pool.authoredOk !== undefined ? l.pool.authoredOk : l.authored} authored</div>` : ''}</td><td>${inputs}</td><td class="dim">${(l.feeds || []).join(', ')}</td><td class="dim">${pool}</td><td>${checks}</td></tr>`;
}).join('\n');

const targets = [[4, 50], [8, 80], [12, 95]].map(([n, v]) => {
  const c = coverage[n - 1], lc = letterCols[n - 1];
  return `${v}% by the ${n}th introduction: ${c.cov.toFixed(1)}% ${c.cov >= v ? '✓' : '✗'} (by the ${n}th letter pair, ${lc.intro}: ${lc.cov.toFixed(1)}% ${lc.cov >= v ? '✓' : '✗'})`;
});
const lettersDone = coverage.find((c) => c.letters === LETTERS.size);
const summary = `
<ul>
<li><b>Size.</b> ${counts.intro} introductions, ${counts.exp} expansions = ${counts.intro + counts.exp} lessons before pages; ${counts.page} pages; ${counts.ext} extended intros. Target was 50 to 60 before pages.</li>
<li><b>Coverage curve.</b> ${targets.join(' · ')} · all letters by C${lettersDone ? lettersDone.col : '?'} · full core scope by C${KEYBOARD_COLS}.</li>
<li><b>Rung curve.</b> first clean column per rung: ${RUNGS.slice(1, 6).map((r) => `${r} C${firstRung[r] || '?'}`).join(' · ')}; pages from C${PAGE_BASE + 1}, the column of the last letters, beside the digits.</li>
<li><b>Width and window.</b> lessons per column: ${Object.keys(lessonsPerCol).filter((c) => c <= KEYBOARD_COLS).map((c) => lessonsPerCol[c]).join(' ')}; review edges per column (two or more columns back): ${Object.keys(reviewEdges).map((c) => reviewEdges[c]).join(' ')}. Frontier width itself waits on the weave.</li>
<li><b>Exposure.</b> pending the weave (needs prices).</li>
<li><b>Distinctness, never-regress, window.</b> ${problems.length ? problems.length + ' problems, listed below' : 'no problems'}.</li>
<li><b>Hurdles.</b> ${plan.lessons.filter((l) => l.hurdle).map((l) => `${l.id} (${l.keys.join(' ')}) → ${l.feeds.join(', ')}`).join(' · ')}.</li>
<li><b>Pages.</b> ${Object.keys(plan.pages).length} categories × 3 grades, opening in difficulty order over ${Math.max(...plan.lessons.filter((l) => l.order).map((l) => l.order))} columns: plain sentences first, mathematics last; completion = ${(plan.completion || []).length} named pages (every kind once, a second of the plain ones), the last of them at ${'C' + COMPLETION_COL}; ${plan.lessons.filter((l) => l.col > COMPLETION_COL).length} lessons open after it.</li>
<li><b>Ids only.</b> no material or machine is named.</li>
</ul>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Lesson plan v4 · RU</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 20px 28px; font: 14px/1.45 system-ui, sans-serif; color: #222; background: #fbfaf7; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 28px 0 8px; }
  .dim { color: #777; font-size: 12px; }
  .scroll { overflow-x: auto; border: 1px solid #ddd; background: #fff; border-radius: 8px; padding: 8px; }
  .legend span { display: inline-block; padding: 2px 8px; border-radius: 6px; margin-right: 6px; font-size: 12px; border: 1px solid #999; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; background: #fff; }
  th, td { border-bottom: 1px solid #e6e6e6; padding: 6px 8px; vertical-align: top; text-align: left; }
  th { position: sticky; top: 0; background: #f2efe8; }
  td.id { font-weight: 700; white-space: nowrap; }
  td.keys { min-width: 150px; letter-spacing: 0.04em; }
  td.samples { min-width: 220px; }
  tr.intro td.id { background: ${FILL.intro}; } tr.syllables td.id { background: ${FILL.syllables}; } tr.words td.id { background: ${FILL.words}; }
  tr.phrases td.id { background: ${FILL.phrases}; } tr.sentences td.id { background: ${FILL.sentences}; } tr.full td.id { background: ${FILL.full}; } tr.page td.id { background: ${FILL.page}; }
  tr.gather td.id { box-shadow: inset 3px 0 #333; }
  .tag { font-size: 10px; font-weight: 400; color: #444; }
  .ok { color: #2a7a2a; } .bad { color: #b02a2a; font-weight: 600; } .rise { color: #8a6d1a; }
  .ex { background: #e9e9e9; padding: 0 5px; border-radius: 4px; } .rv { background: #f3e6c7; padding: 0 5px; border-radius: 4px; }
  svg.tree .edge.hi { opacity: 1; stroke-width: 2.6; stroke: #c0392b; }
  svg.tree .node { cursor: pointer; }
  ul.problems li { color: #b02a2a; }
</style></head><body>
<h1>Lesson plan v4 · Russian (ЙЦУКЕН)</h1>
<div class="dim">Draft 2026-09-10. Structure in <code>docs/lessons-v4-ru.plan.js</code>; everything computed by <code>dev/lessons-v4-build.js</code> from <code>js/language-ru.js</code>. Rules in <code>docs/lessons-v4-rules.md</code>. Ids only; naming comes after the structure freezes.</div>

<h2>The tree</h2>
<div class="legend">
  <span style="background:${FILL.intro}">introduction</span><span style="background:${FILL.syllables}">syllables</span><span style="background:${FILL.words}">words</span><span style="background:${FILL.phrases}">phrases</span><span style="background:${FILL.sentences}">sentences</span><span style="background:${FILL.full}">full sentences</span><span style="background:${FILL.page}">pages</span><span style="background:${FILL.ext}">extended</span>
  <span style="border-width:2.5px;border-color:#333">gather</span> <span style="border-color:#b08a3c;color:#b08a3c">↶ review edge (two or more columns back)</span>
</div>
<div class="dim">Each column opens with an introduction; the expansions below it are the lessons that need those keys. Hover a node for its samples and checks; click to jump to its row. Grey edges are the expansion input, gold edges reach back for review. Coverage is the share of running Russian text the unlocked keys can write.</div>
<div class="scroll">${svg}</div>

<h2>Coverage</h2>
<div class="scroll">${curve}</div>

<h2>Checks (Part B of the rules)</h2>
${summary}
${problems.length ? `<ul class="problems">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
${rises.length ? `<div class="dim">Could sit a rung higher by A4 (kept low on purpose where the note says so): <br>${rises.map(esc).join('<br>')}</div>` : ''}

<h2>Every lesson</h2>
<div class="dim">Keys: bold = the column's new keys. Inputs: grey = expands (this or the previous column), gold ↶ = reviews (older). Pool = what the course data can write with this alphabet; "authored" items are real Russian written for this plan and are the to-do list for the course file.</div>
<div class="scroll"><table>
<thead><tr><th>id</th><th>col</th><th>keys</th><th>what you type</th><th>samples</th><th>inputs</th><th>feeds</th><th>pool</th><th>checks</th></tr></thead>
<tbody>${rows}</tbody></table></div>

<h2>Scope</h2>
<div>Core: ${plan.scope.letters.length} letters · digits ${esc(plan.scope.digits.join(''))} · marks ${esc(plan.scope.marks.join(' '))} · capitals. Extended (taught, never required): ${esc(plan.scope.extended.join(' '))}.</div>

<script>
  const paths = document.querySelectorAll('svg.tree .edge');
  document.querySelectorAll('svg.tree .node').forEach((n) => {
    const id = n.dataset.id;
    n.addEventListener('mouseenter', () => paths.forEach((p) => { if (p.classList.contains('from-' + id) || p.classList.contains('to-' + id)) p.classList.add('hi'); }));
    n.addEventListener('mouseleave', () => paths.forEach((p) => p.classList.remove('hi')));
    n.addEventListener('click', () => { const r = document.getElementById('row-' + id); if (r) { r.scrollIntoView({ block: 'center' }); r.style.outline = '2px solid #c0392b'; setTimeout(() => (r.style.outline = ''), 1600); } });
  });
</script>
<script type="application/json" id="plan-json">${esc(JSON.stringify(plan.lessons.map((l) => ({ id: l.id, kind: l.kind, col: l.col, keys: l.keys, inputs: l.inputs, rung: l.rung, family: l.family, alpha: [...l.alpha], marks: l.marks ? [...l.marks] : undefined, what: l.what, samples: l.samples, pool: l.pool, checks: l.checks }))))}</script>
</body></html>`;
if (MAIN) {
  fs.writeFileSync(path.join(ROOT, 'docs', `lessons-v4-${course}.html`), html);
  console.log('wrote docs/lessons-v4-' + course + '.html');
}
