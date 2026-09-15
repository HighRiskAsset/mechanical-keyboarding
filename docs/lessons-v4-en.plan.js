// EN lesson plan v4 (2026-09-15). The structure only: ids, keys, inputs,
// intended rung and family. Alphabets, pools, samples and the checks are
// computed from js/language-en.js by dev/lessons-v4-build.js, which renders
// docs/lessons-v4-en.html. No material or machine is named here.
//
// The skeleton is the RU plan's, column for column and lesson for lesson
// (user ruling 2026-09-15: the two courses should be obviously parallel),
// with the keys reseated for QWERTY. The seating follows the research the
// user asked for (docs/lessons-v4-rules.md, A17): hands stay on the home
// row and every key has one finger (Feit, Weir and Oulasvirta 2016), real
// words at once and no long isolated-letter drills (West 1957, 1962),
// technique from the first lesson for children (Donica 2018 to 2021), and
// hand alternation (Dhakal 2018). So the first two columns sit on the home
// row (s l, a h), the first reach is the middle fingers straight up (e i),
// words open at C3, and every syllable from then on is a home key plus a
// reach: leave and return. The A6 scorer set the rest, tuned to the RU
// column roles. The differences from RU, all forced by the language or the
// board:
//
// - English has 26 letters to Russian's 33, so over the same sixteen letter
//   columns the rare tail stands one letter to a column: k v j x q z.
// - The apostrophe takes the dash's column (C12) with the hyphen beside it:
//   the two marks that live inside a word. English has no em dash in scope,
//   and the apostrophe is the EN hurdle (contractions wait on it).
// - The comma keeps its column (C10, clauses) but is no hurdle here: it sits
//   on its own key, unshifted. The period sits on the Period key.
// - C17 is the straight double quote alone (no guillemets); C24 has no numero
//   sign (English writes "No.").
//
// The shape every letter group follows: intro (streams over its own keys),
// syllables with the first ores, focused words over everything unlocked,
// then a sentence lesson or a gather. The vowel banks are I-02 a h and I-03
// e i (I-01 s l is the consonant bank), chosen per pair by counting as A3
// says: a group that pairs with s l takes e i or a h beside it, and q takes
// r u for its u. Marks get an intro and one expansion that needs them.
'use strict';

const L = [];
const I = (id, keys, strokes, note, extra) => L.push(Object.assign({ id, kind: 'intro', keys, strokes, note }, extra || {}));
const E = (id, inputs, rung, family, note, extra) => L.push(Object.assign({ id, kind: 'exp', inputs, rung, family, note }, extra || {}));
const P = (id, cat, grade, inputs, note, samples) => L.push({ id, kind: 'page', cat, grade, inputs, note, samples });

// ---- C1..C4: the seed; two columns on the home row, then the first reach ----
I('I-01', ['s', 'l'], 'S L', 'ring fingers on the home row, mirror keys: the hands start where they rest');
I('I-02', ['a', 'h'], 'A H', 'pinky and index inner, still on the home row; syllables open');
E('E-01', ['I-01', 'I-02'], 'syllables', null, 'as ha la sal; the first syllables, all on the home row');
I('I-03', ['e', 'i'], 'E I', 'the first reach: middle fingers straight up; words open here');
E('E-02', ['I-01', 'I-03'], 'syllables', null, 'se le is el; a second alphabet, same rung: a home key and a reach in every pair');
E('E-03', ['E-01', 'I-03'], 'words', ['func'], 'the first real words: she, he, his, has, is, as, else');
I('I-04', ['t', 'n'], 'T N', 'index fingers, the first diagonal reaches: the, that, this, it, in, at, an');
E('E-04', ['E-02', 'I-04'], 'words', ['things', 'nature', 'home'], 'nouns over six letters: nest, tent, tin, net, list, line, tile');
E('E-05', ['E-03', 'I-04', 'I-02'], 'words', ['func'], 'little words over eight letters: the, this, that, then, it, in, at, an; a h come back as the flux');

// ---- C5: d o ----
I('I-05', ['d', 'o'], 'D O', 'back to the home row with d, and o straight up: and, to, on, not, one');
E('E-06', ['I-05', 'I-01'], 'syllables', null, 'do so old sold; d o with the home-row bank', { focus: true });
E('E-07', ['E-06', 'E-04', 'I-02'], 'words', ['nature', 'things'], 'nature words leaning on d o: stone, soil, sand, land, toad, seed, tide; a h ride along as the flux', { focus: true });
E('E-08', ['E-05', 'I-05'], 'phrases', null, 'first phrases: salt and sand, hand in hand, head to toe');

// ---- C6: r u ----
I('I-06', ['r', 'u'], 'R U', 'index fingers straight up: the last vowel');
E('E-09', ['I-06', 'I-05', 'I-01'], 'syllables', null, 'ru ur ro or with d o', { focus: true });
E('E-10', ['E-09', 'E-07'], 'words', ['home', 'things', 'rail'], 'home and road words leaning on r u: door, road, route, rust, hour, house, ruin', { focus: true });
E('E-11', ['E-08', 'E-10'], 'phrases', null, 'GATHER 1: phrases over the first twelve letters', { gather: true });

// ---- C7: c m and the period ----
I('I-07', ['c', 'm', '.'], 'C M .', 'the bottom row, middle and index, and the period on its own key: sentences are within reach');
E('E-12', ['I-07', 'I-03'], 'syllables', null, 'ce ec me em ic; ice, mice; e i is the bank because s l holds no vowel', { focus: true });
E('E-13', ['E-12', 'E-10'], 'words', ['home', 'people', 'time'], 'home and family words leaning on c m: home, room, mother, cousin, uncle, morning', { focus: true });
E('E-14', ['E-11', 'E-13'], 'sentences', 'period', 'the first sentences, period only');

// ---- C8: Shift ----
I('I-08', ['Shift'], 'Shift', 'capitals of every unlocked letter; a sentence gets its capital, and so does I', { caps: true });
E('E-15', ['E-14', 'I-08', 'E-08'], 'sentences', 'names', 'capitalised sentences and proper names: Sam, Ruth, London; the first phrases come back as the flux');

// ---- C9: g y ----
I('I-09', ['g', 'y'], 'G Y', 'index inner home and index top inner: -ing and -ly; you, they, my');
E('E-16', ['I-09', 'I-01', 'I-02'], 'syllables', null, 'ga ag gas; ay ly hy', { focus: true });
E('E-17', ['E-16', 'E-13'], 'words', ['verbs'], 'verbs and their -ing leaning on g y: go, get, dig, try, say, stay, carry, going, saying', { focus: true });
E('E-18', ['E-15', 'E-17'], 'sentences', 'period', 'GATHER 2: sentences over sixteen letters', { gather: true });

// ---- C10: the comma ----
I('I-10', [','], ',', 'the comma on its own key, unshifted: not the hurdle it is in ЙЦУКЕН, but clauses keep their column');
E('E-19', ['E-18', 'I-10', 'E-11'], 'sentences', 'clauses', 'clauses: he sat, and she read; two phrases joined by a comma, so the phrase gather is the flux');

// ---- C11: f w ----
I('I-11', ['f', 'w'], 'F W', 'the left bump and ring top: of, for, from, if; we, was, with, what, when, where, who, how, now');
E('E-20', ['I-11', 'I-01', 'I-03'], 'syllables', null, 'fe fi self; we wi wise', { focus: true });
E('E-21', ['E-20', 'E-17'], 'words', ['things', 'place', 'nature'], 'things and places leaning on f w: farm, field, fire, forest, water, wood, wind, wall, window, world', { focus: true });
E('E-22', ['E-19', 'E-21'], 'sentences', 'clauses', 'sentences with clauses and the wh- words');

// ---- C12: the apostrophe and the hyphen ----
I('I-12', ["'", '-'], "' -", 'the apostrophe on the Quote key, the signature hurdle, and the hyphen on Minus: the two marks that live inside a word', { hurdle: true });
E('E-23', ['E-22', 'I-12', 'E-13'], 'sentences', 'contractions', "contractions and compounds: it's cold, so don't go out; a one-way street; the home and family words are the flux");

// ---- C13: b p ----
I('I-13', ['b', 'p'], 'B P', 'index bottom, inner, and pinky top');
E('E-24', ['I-13', 'I-05', 'I-01'], 'syllables', null, 'bo ob po op; sob, pod, plod', { focus: true });
E('E-25', ['E-24', 'E-21'], 'words', ['people', 'life', 'verbs'], 'people leaning on b p: people, boy, brother, baby, papa, pupil, partner; put, pull, build, bring', { focus: true });
E('E-26', ['E-23', 'E-25'], 'sentences', 'past', 'GATHER 3: the past tense: yesterday we were busy. the boy was born by the bay.', { gather: true });

// ---- C14: k ----
I('I-14', ['k'], 'K', 'middle home, alone: 26 letters over sixteen columns leave the rare six standing alone from here; know, think, like, look, make, take, work');
E('E-27', ['I-14', 'I-01', 'I-03'], 'syllables', null, 'ke ki sk; silk, skill', { focus: true });
E('E-28', ['E-27', 'E-25'], 'words', ['adj', 'things', 'place'], 'adjectives leaning on k: dark, black, thick, weak, sick, kind, keen, lucky; key, book, lock, market, lake', { focus: true });
E('E-29', ['E-26', 'E-28'], 'sentences', 'period', 'sentences with adjectives');

// ---- C15: ? ! ----
I('I-15', ['?', '!'], 'Shift+/, Shift+1', 'the slash key and the number row, shifted: questions and exclamations');
E('E-30', ['E-29', 'I-15', 'E-05'], 'sentences', 'questions', 'who is there? are you ready? well done! The question words are little words, so E-05 is the flux');

// ---- C16: v ----
I('I-16', ['v'], 'V', 'index bottom, alone: very, have, over, every, seven, river');
E('E-31', ['I-16', 'I-01', 'I-03'], 'syllables', null, 've ev vi iv; evil, live', { focus: true });
E('E-32', ['E-31', 'E-28'], 'words', ['time', 'life', 'verbs'], 'time and doing words leaning on v: evening, event, ever, never, give, live, move, save, visit', { focus: true });
E('E-33', ['E-30', 'E-32'], 'sentences', 'questions', 'GATHER 4: questions with have, ever, very: have you seen it? do you ever rest?', { gather: true });

// ---- C17: quotes ----
I('I-17', ['"'], "Shift+'", 'the straight double quote on the apostrophe key, shifted; English has no guillemets');
E('E-34', ['E-33', 'I-17', 'E-25'], 'sentences', 'dialogue', 'dialogue: "Go home!" said Bob. The people and past-tense words are the flux');

// ---- C18: j ----
I('I-18', ['j'], 'J', 'the right bump, alone: the rarest letter this side of x');
E('E-35', ['I-18', 'I-01', 'I-02'], 'syllables', null, 'ja aj; jab', { focus: true });
E('E-36', ['E-35', 'E-32'], 'words', ['things', 'verbs', 'rail'], 'words leaning on j: jar, jug, jacket, join, jump, enjoy, jet, junction, journey', { focus: true });
E('E-37', ['E-34', 'E-36'], 'sentences', 'clauses', 'sentences with j: just a minute, then we go.');

// ---- C19: x ----
I('I-19', ['x'], 'X', 'ring bottom, alone');
E('E-38', ['I-19', 'I-01', 'I-03'], 'syllables', null, 'ex xi ix; six, exile', { focus: true });
E('E-39', ['E-38', 'E-36'], 'words', ['things', 'people', 'place'], 'things leaning on x: box, axle, text, index, expert, exit, taxi, six, sixty', { focus: true });
E('E-40', ['E-37', 'E-39'], 'sentences', 'mixed', 'GATHER 5: every mark so far in one pool: comma, question, capitals, apostrophe, quotes', { gather: true });

// ---- C20: : ; ( ) ----
I('I-20', [':', ';', '(', ')'], 'Shift+;, ;, Shift+9, Shift+0', 'the semicolon on its key, the colon above it, the brackets on the number row: lists and asides');
E('E-41', ['E-40', 'I-20', 'E-21'], 'sentences', 'lists', 'here is the list: iron, coal, stone. the plan is simple (almost). Lists are of things, so the things words are the flux');

// ---- C21: q ----
I('I-21', ['q'], 'Q', 'pinky top, alone: q only ever comes with u');
E('E-42', ['I-21', 'I-06', 'I-03'], 'syllables', null, 'qu que quire; r u is the partner because q needs its u', { focus: true });
E('E-43', ['E-42', 'E-39'], 'words', ['work', 'things', 'life'], 'work words leaning on q: quarry, quality, quantity, equip, quartz, liquid, question', { focus: true });
E('E-44', ['E-41', 'E-43'], 'sentences', 'mixed', 'sentences with q: the quarry is quiet today.');

// ---- C22: z ----
I('I-22', ['z'], 'Z', 'pinky bottom, alone: the last letter, the corner of the board');
E('E-45', ['I-22', 'I-05', 'I-01'], 'syllables', null, 'zo oz; zoo, doze', { focus: true });
E('E-46', ['E-45', 'E-43'], 'words', ['life', 'things', 'nature'], 'the last letter in words: puzzle, jazz, size, dozen, zinc, bronze, breeze, blizzard', { focus: true });
E('E-47', ['E-44', 'E-46'], 'sentences', 'mixed', 'GATHER 6: every letter of the alphabet', { gather: true });

// ---- C23, C24: digits ----
I('I-23', ['1', '2', '3', '4', '5'], '1 2 3 4 5', 'the left half of the number row');
E('E-48', ['E-47', 'I-23', 'E-32'], 'sentences', 'numbers', 'counts and times: there are 25 men in the crew. the train is at 5. The time words are the flux');
I('I-24', ['6', '7', '8', '9', '0'], '6 7 8 9 0', 'the right half; English writes No. for the numero sign, so nothing rides along');
E('E-49', ['E-48', 'I-24'], 'full', 'dates', 'full sentences at last: dates, prices, numbers of things: in 1867. house 7, flat 108.');
E('E-50', ['E-49', 'E-46', 'E-41'], 'full', 'everything', 'GATHER 7: the keyboard is complete; every core key in one pool', { gather: true, milestone: 'keyboard complete' });

// ---- Pages: six categories, three grades, staggered by difficulty, the
// same table as RU (user ruling 2026-09-11): plain sentences first (lore,
// letters), then prose and light trivia, then verse and dialogue with their
// quotes, then digit-dense trivia, and mathematics last of all.
//
// Pages open at C22, the column where the last letter arrives, and run
// beside the digit columns: the digit-free categories go first; a page that
// needs digits or the list marks waits for the lesson that teaches them. A
// page sits at column pageBase + order; the order is only when it opens.
// Every page takes paper and ink plus, at grade 1, a flux from the branch
// that set its marks, and at grades 2 and 3 its own previous grade and a
// neighbour's page. Completion = the easier half of the pages, listed at
// the end. ----
const PAGES = {
  lore: { flux: 'E-23', name: 'lore: the machines talking' },
  let: { flux: 'E-30', name: 'letters and correspondence' },
  lit: { flux: 'E-40', name: 'famous literature' },
  triv: { flux: 'E-44', name: 'fun trivia' },
  dia: { flux: 'E-34', name: 'dialogue and theatre' },
  tech: { flux: 'E-48', name: 'mathematical and technical writing' },
};
const PAPER = ['I-04', 'I-17'];   // paper and ink, the same two lessons as RU
const PT = (id, cat, grade, order, inputs, note) => { P(id, cat, grade, inputs.concat(PAPER), note, null); L[L.length - 1].order = order; };
// order 1, C22: all letters are in; no digits yet
PT('P-lore-1', 'lore', 1, 1, ['E-23'], 'plain sentences; the machines talk');
PT('P-let-1', 'let', 1, 1, ['E-30'], 'a short letter: greeting, plain sentences, a name');
// order 2, C23: digits 1-5 arrive beside these; none of these need them
PT('P-lit-1', 'lit', 1, 2, ['E-40', 'P-lore-1'], 'plain classic prose');
PT('P-triv-1', 'triv', 1, 2, ['E-44', 'P-let-1'], 'facts in plain sentences, numbers spelled out');
PT('P-lore-2', 'lore', 2, 2, ['P-lore-1', 'P-let-1'], 'longer, a joke, a colon');
// order 3, C24: the rest of the digits arrive; the formal letter uses 1-5
PT('P-lit-2', 'lit', 2, 3, ['P-lit-1', 'P-lore-2'], 'verse: commas, capitals at line starts');
PT('P-let-2', 'let', 2, 3, ['P-let-1', 'P-triv-1', 'E-48'], 'a formal letter with numbered points (digits 1-5)');
PT('P-dia-1', 'dia', 1, 3, ['E-34', 'P-lit-1'], 'dialogue: quotes and question marks');
// order 4: the keyboard is complete; digit-dense pages open
PT('P-triv-2', 'triv', 2, 4, ['P-triv-1', 'P-lit-2', 'E-50'], 'digit-dense facts: the charter, the digits gather, is the flux');
PT('P-dia-2', 'dia', 2, 4, ['P-dia-1', 'P-let-2'], 'a scene from a play');
PT('P-lore-3', 'lore', 3, 4, ['P-lore-2', 'P-dia-1', 'E-49'], 'the frontier exam: brackets, a time');
// order 5: mathematics begins
PT('P-tech-1', 'tech', 1, 5, ['E-50', 'E-41', 'P-triv-2'], 'a worked speed problem in words and digits');
PT('P-lit-3', 'lit', 3, 5, ['P-lit-2', 'P-dia-2'], 'verse with semicolons and exclamations');
PT('P-let-3', 'let', 3, 5, ['P-let-2', 'P-lore-3', 'E-50'], 'an order: order numbers, prices, dates');
// the advanced half
PT('P-dia-3', 'dia', 3, 6, ['P-dia-2', 'P-lit-3'], 'nested quotation inside speech');
PT('P-tech-2', 'tech', 2, 6, ['P-tech-1', 'P-let-3', 'E-50'], 'geometry with brackets and decimals');
PT('P-triv-3', 'triv', 3, 6, ['P-triv-2', 'P-tech-1'], 'the railway in numbers');
PT('P-tech-3', 'tech', 3, 7, ['P-tech-2', 'P-triv-3'], 'an algorithm: numbered steps, conditions');

// ---- Extended scope: taught, never required; may open early (after
// tech 2) since it is optional. Every one of these is a native QWERTY
// stroke, unlike the Latin-layer strokes RU borrows. ----
I('X-01', ['%', '*', '+', '='], 'Shift+5, Shift+8, Shift+=, =', 'arithmetic marks; opens after tech 2', { ext: true, after: 'P-tech-2' });
I('X-02', ['/', '\\', '[', ']', '{', '}', '<', '>'], '/ \\ [ ] plain; { } < > shifted', 'brackets and slashes, all on their own keys', { ext: true, after: 'X-01' });
I('X-03', ['@', '#', '$', '&', '^', '~', '|', '_', '`'], 'the number row shifted; ~ ` and | on the corner keys', 'the code symbols', { ext: true, after: 'X-02' });
P('PX-math', 'tech', 4, ['P-tech-3', 'X-01'].concat(PAPER), 'extended: formulas');
P('PX-code', 'tech', 4, ['PX-math', 'X-02', 'X-03'].concat(PAPER), 'extended: a page of code');

// Authored content the course data does not yet hold. Every item here is
// real English and is flagged "authored" on the page; it counts toward the
// pool and is the to-do list for js/language-en.js. Lower case before C8
// (no capitals, so no "I"), and each list uses only the keys its column has.
const AUTHORED = {
  'E-01': ['ah', 'sal', 'lash', 'hall'],
  'E-12': ['ice', 'mice', 'mic', 'cem'],
  'E-14': ['the sun is hot.', 'the moon is out.', 'she is at home.', 'the train is late.', 'it is cold in here.', 'the coal is in the cart.', 'the door is shut.', 'the tea is hot.', 'hand me the salt.', 'the mine is old.', 'the cat sat on the mat.', 'the line is clean.', 'the road ends here.', 'she is at the door.', 'the tent is on the hill.', 'the oats are in the shed.', 'a mouse is in the house.', 'the steel is cold.', 'mother is at home.', 'the rain is here.', 'the cart is on the rails.', 'she can see the sea.', 'the hut is small.', 'the air is still.', 'the tools are in the shed.', 'the moon lit the road.', 'the men are at the mine.', 'time is short.', 'the ore is in the cart.', 'it is time to eat.', 'the sea is calm.', 'the stone is in the road.', 'the hill is on the east side.'],
  'E-15': ['Sam is at home.', 'Ann and Tom are in London.', 'Ruth is late.', 'Dan sold the cart.', 'Rose can see the sea.', 'Lee is at the mine.', 'Sue and Dan sat on the hill.', 'Tim is in Rome.', 'The road to Athens is old.', 'Nora has the salt.', 'Simon and Clara are here.', 'Dan is a miner.', 'Anna reads at noon.', 'The Nile runs north.', 'Carl lit the lantern.', 'Emma is at the door.', 'Helen and Leo are at sea.', 'Otto is old.', 'Ellen came home.', 'Alan sees the moon.', 'Sarah made the tea.', 'Ian sold the ore to Sam.', 'Tom is a doctor.', 'The Thames is calm.', 'Alice and Lena are at the station.', 'Nathan has a cat.', 'Rita is in the tent.', 'Linda and Laura are sisters.', 'The Hudson is cold.'],
  'E-16': ['ag', 'ga', 'gas', 'sag', 'lag', 'hag', 'gal', 'say', 'lay', 'hay', 'shy', 'gash', 'slay'],
  'E-18': ['You can go home.', 'The day is long.', 'They sang all night.', 'The engine is running.', 'You are early today.', 'My hands are cold.', 'The young man is a miner.', 'Sunday is a rest day.', 'Glass and gold are in the cart.', 'The gate is shut and the dog is out.', 'They are digging a tunnel.', 'Get the gear and go.', 'The morning is grey.', 'The city is a long ride.', 'Nothing is easy at the start.', 'Gold is dense.', 'The rain stayed all day.', 'The steel is ready.', 'Say it again.', 'The seam is rich in ore.', 'My uncle sings at night.', 'The sea is grey today.', 'You need a good rest.', 'The tunnel is dry.', 'They ate early and rested.', 'Ruth is a young engineer.', 'Each man has a duty.', 'The signal is green.', 'Sing along.', 'Get the tools ready.'],
  'E-19': ['He sat, and she read.', 'The day is done, and the night is here.', 'Go home, Sam.', 'The rain came, then the sun.', 'Coal is dear, gold is dearer.', 'It is late, so rest.', 'Stone, sand, iron and coal.', 'Say it, then do it.', 'Ruth is here, Tom is not.', 'The tea is hot, the toast is cold.', 'One more load, then home.', 'Rest, then run the line again.', 'The mine is old, the road is long.', 'Dig, then sort the ore.', 'Sit, eat, then go.', 'The sun is high, the sea is calm.', 'Yes, it is mine.', 'Oh, it is you.', 'The engine is hot, so stand clear.', 'The gate is shut, and the dog is out.', 'You sing, I listen.', 'It is morning, and the moon is still out.', 'Dan is a miner, Anna is a doctor.', 'Easy, steady, sure.', 'The cart is here, the mule is not.', 'Iron, then steel, then rails.', 'The road is long, the day is short.', 'Tea, then toast, then the mine.'],
  'E-22': ['We wait, and the train is late.', 'The wind is cold, so shut the window.', 'Wood for the fire, water for the tea.', 'If it rains, we stay in.', 'The fields are wet, the roads are worse.', 'We found it, and we left it there.', 'First the ore, then the iron, then the steel.', 'Few of us are ready, and none of us are late.', 'The fire is out, the forge is cold.', 'The water is low, so the wheel is slow.', 'We dig in the mine, and we rest at home.', 'The world is wide, the road is narrow.', 'Frost on the rails, fog in the fields.', 'Wait here, then follow me.', 'The wolf is near, so watch the herd.', 'When the whistle sounds, the shift ends.', 'My father was a miner, and his father too.', 'The wheel turns, the water flows.', 'We had a fine day, then it rained.', 'Half of the coal is wet, and the rest is dust.', 'Wash, then eat, then rest.', 'The flag is out, so the train is due.', 'It was warm, then it was cold.', 'Two men went in, and two men came out.', 'The west field is dry, the east one is wet.', 'Fetch the tools, and we can start.', 'We saw the light, and we followed it.'],
  'E-23': ["It's cold, so don't go out.", "We can't wait, and we won't.", "Mother's at home, father's at the mine.", "It isn't late.", 'The self-made man is my uncle.', "Don't touch the hot iron.", "We're home, and we're tired.", "That's the last of the coal.", "He didn't come, and she didn't wait.", 'The well-worn road leads home.', "You're early, and I'm glad.", "It's a one-way street.", "Let's go home.", 'The twenty-one men are all here.', "There's tea in the hall.", "We'll rest here, then we'll go.", "The old man's hat is on the chair.", "I'm not sure it's here.", "They're at the station, and we're not.", "Here's the gate, and there's the house.", "It wasn't me, and it wasn't you.", "The dog's at the door.", "My sister's a nurse.", "Ann's cousin is here.", "Don't run in the hall.", "We had our tea, and that's that.", "The sun's out, so let's go.", "You'll need a coat, it's cold.", "What's done is done.", 'The mid-day sun is hot.'],
  'E-24': ['bo', 'ob', 'sob', 'lob', 'bod', 'pod', 'plod', 'blob', 'bold', 'slob'],
  'E-26': ['Yesterday we were busy.', 'The boy was born by the bay.', 'Papa had put the pipe by the bed.', 'We played, then we stopped.', 'The baby was asleep all night.', 'I was a pupil here.', 'The bridge was built in a year.', 'They planted beans by the path.', 'The pump failed, so we pumped by hand.', 'The brothers were at the mill.', 'She boiled beans, and he made tea.', 'The pub was full.', 'The band played until dawn.', 'We piled the ore by the belt.', 'It rained, so we stayed in.', 'Bob painted the barn blue.', 'The bell rang, and the men stopped.', 'The paper was damp.', 'The bear was in the cabin.', 'This bridge was built by my father.', 'Ben opened the gate and bolted it.', 'The pipes were cold.', 'The bus was late, so we waited.', 'Peter had a plan, and it was good.', 'The boat sailed at noon.', 'We dropped the load, then we rested.', 'The bread was ready by noon.', 'It was a bad day, but a good year.', 'The pond was deep, and the boys were bold.'],
  'E-27': ['ki', 'ik', 'elk', 'ilk', 'silk', 'skill', 'like', 'kiss', 'leek', 'seek'],
  'E-29': ['The kettle is on.', 'Keep the key in the lock.', 'The dark road leads to the lake.', 'Take the book back.', 'The market opens at dusk.', 'The bank is by the park.', 'A kind word is a key.', 'The brick wall is thick.', 'The sky is dark and the wind is keen.', 'Look at the black cat.', 'The clock ticks all night.', 'We like the old track.', 'Milk and bread are on the table.', 'The lock is broken.', 'My back is sore from the work.', 'The kids are asleep.', 'The weak link is the belt.', 'The lake is deep and cold.', 'The kitchen is warm.', 'Knock before you walk in.', 'The smoke is thick and black.', 'Make the tea and keep it hot.', 'The truck is stuck in the muck.', 'Work is done for the week.', 'The key is under the mat.'],
  'E-30': ['Who is there?', 'Is it true?', 'Where are you?', 'What is this?', 'Why not now?', 'How far is it?', 'Is he in?', 'Stop!', 'Well done!', 'What a day!', 'Are you ready?', 'Can we go?', 'Is the train late?', 'Did you see it?', 'Who has the salt?', 'Where is my hat?', 'Hold on!', 'Mind the gap!', 'Go home!', 'Is this yours?', 'When is dinner?', 'Has anyone seen Tom?', 'Do you hear that?', 'Run!', 'Is it far?', 'What now?', 'Do you want tea?', 'Oh no!', 'Are we there yet?', 'Who said that?'],
  'E-31': ['vie', 'vile', 'evil', 'live', 'veil', 'vise', 'elves', 'sieve'],
  'E-33': ['Have you seen it?', 'Do you ever rest?', 'Is it very far?', 'Will you give it back?', 'Where do you live?', 'Who drove the van?', 'Have we met?', 'Do you know the way?', 'What do you think?', 'How does it look?', 'Can you make it?', 'Will it work?', 'Take it back!', 'Do you like it here?', 'Who took the key?', 'Where is the book?', 'Is the kettle on?', 'Did you lock the door?', 'What kind of ore is this?', 'Look out!', 'Can you speak up?', 'Keep going!', 'Why is it so dark?', 'Do you take milk?', 'Is it broken?', 'Which track is ours?', 'Knock first!', 'Are the kids asleep?', 'How much does it weigh?', 'Thank you!', 'Did the clock stop?', 'Who wants a break?', 'Can we walk there?', "What's for lunch?"],
  'E-34': ['"Go home!" said Bob.', '"Who is there?" she asked.', '"I am ready," said the boy.', '"Not yet," said Papa.', '"Yes," she said.', '"Ready," she said.', '"Wait for me!" the girl called.', '"Keep it," said Peter.', '"The bridge is out," said the driver.', '"Is it far?" asked Ben.', '"No," said the old man.', '"Look!" said the boy.', 'The word "home" is a small word.', '"Stop the train!" he shouted.', '"We are late," said Anna.', '"Take the key," said Mother.', '"Where were you?" asked Papa.', '"I was at the mine," said Bob.', '"Sit down," said the teacher.', '"Well done, boys!" said the foreman.', 'She said "yes" and he said "no".', '"It works!" cried Tom.', '"Come in," said the baker.', '"Not now," said the nurse.', '"Mind the gap," said the guard.'],
  'E-35': ['ja', 'aj', 'jah'],
  'E-37': ['Just a minute, please.', 'Jack joined the crew, and Jane joined too.', 'The job is done, so enjoy the evening.', 'In June the days are long, in January they are short.', 'Jim jumped the fence, and the dog followed.', 'The judge was fair, but the jury was slow.', 'We had jam, bread and tea.', 'Join us, or stay at home.', 'The major road is closed, so take the lane.', 'It is just a joke, so laugh.', 'The jar is full, the jug is empty.', 'Jenny has a new jacket, and it is blue.', 'The journey is long, but the road is good.', 'The engine jerked, then it ran smooth.', 'Just one more, then we stop.', 'The jet is fast, the barge is slow.', 'The joint is loose, so tighten it.', 'Enjoy your tea, and rest.', 'The project is late, and the subject is hard.', 'Jump in, the water is warm.', 'Jill has the juice, Jack has the bread.'],
  'E-38': ['xi', 'ix', 'six', 'ilex', 'exile', 'exes'],
  'E-40': ['Next stop, Exeter!', 'Six boxes, all full.', 'The axle is fixed, so we can go.', '"Exactly," said the expert.', 'Is the exit this way?', 'Fix the pipe, then mix the mortar.', 'The text is long, but the story is good.', 'What an excellent day!', 'Sixty men, six wagons, one road.', "Don't expect too much.", 'The fox is in the box!', 'Explain it again, please.', 'Extra coal, extra steam.', "The taxi is here, so let's go.", 'Six times six is thirty-six.', 'The exam is next week.', 'Max fixed the axle.', "Relax, it's only a mouse.", 'Expect rain, then expect sun.', 'The index is at the back.', 'We export ore and we import tea.', 'Is the toolbox in the boxcar?', 'Wax the sled, then ride it.'],
  'E-41': ['Here is the list: iron, coal, stone.', 'The day is done; the night is near.', 'The book (an old one) is on the shelf.', 'Note: oil the gears.', 'Three things: bread, salt, water.', 'One rule: think first.', 'The room is warm; the door is shut.', 'The plan is simple (almost).', 'Input: ore; output: pages.', 'Bring: a lamp, a rope, a coat.', 'The master said: go.', 'Down tools; the day is done.', 'Eight bells; all is fine.', 'The ledger reads: iron, coal, sand.', 'The pump (the old one) is broken; the new one works.', 'Answer: no.', 'Asked: who? Answer: nobody.', 'Tea is at four; dinner is at six.', 'The mine (as always) is cold; the forge is hot.', 'The price (with delivery) is ten pounds.', 'Two jobs: dig, then sort.', 'He waited; she did not.', 'Hush; the baby is asleep.', 'First: wash. Then: eat.', 'We need three: a saw, a hammer, a file.', 'Stone (the grey kind) is best for walls.'],
  'E-42': ['qu', 'que', 'quer', 'requ', 'equ', 'quir'],
  'E-44': ['The quarry is quiet today.', 'Be quick, be quiet, be careful.', 'Quarry stone is hard; sand is soft.', 'The queen is not amused.', 'Is it quite ready?', 'Quality first, quantity second.', 'Equip the men, then go.', 'A square peg in a round hole.', 'The liquid is cold; the pipe is warm.', 'Quite so!', 'The request was refused.', 'We require six more.', '"Quick!" she said.', 'The squirrel took the nut.', 'The quilt is on the bed.', 'A quarter past nine.', 'The question is: who pays?', "Squash in, there's room.", 'The quest is over; the treasure is ours.', 'Quit while you can.', 'The engine is quiet now.', 'The quay is empty.', "Unique, isn't it?", 'We quarried stone for the bridge.'],
  'E-45': ['zo', 'oz', 'doz', 'zoo'],
  'E-46': ['zero', 'size', 'dozen', 'zinc', 'bronze', 'puzzle', 'jazz', 'breeze', 'blizzard', 'drizzle', 'haze', 'blaze', 'zone', 'lazy', 'crazy', 'dizzy', 'frozen', 'zigzag', 'prize', 'freeze', 'quartz', 'zeal', 'zebra', 'wizard', 'lizard'],
  'E-47': ['The zinc is in the bronze.', 'Zero wind today.', 'The puzzle has a dozen pieces.', 'Size matters; so does speed.', 'The blizzard froze the points.', 'A lazy breeze, a hazy sky.', 'Freeze!', 'The prize is a zinc medal.', 'Jazz at the pub tonight.', 'The zone is closed (frozen rails).', 'Is the nozzle blocked?', "Don't be crazy; wear a coat.", 'The bronze bell is quiet.', 'We seized the moment.', 'Dizzy? Sit down.', 'The zoo is open on Sunday.', 'Zigzag up the hill.', "The quartz sparkles; the zinc doesn't.", 'A dozen eggs, please.', 'The fizz is gone.', 'The haze lifted at noon.', 'Amazing!', 'Seize the day.', 'The glaze is dry; the pot is done.'],
  'E-48': ['There are 25 men in the crew.', 'The train is at 5.', 'We need 3 tons of coal and 2 of quartz.', 'The station is 12 miles away.', 'The shift is 4 hours; lunch is 1.', 'Answer: 2, 4, 1, 3, 5.', 'Buy 2 loaves and 1 pint of milk.', 'House 14, floor 3.', 'The lesson is 45 minutes.', 'We were 5; now we are 3.', 'Lunch at 2.', 'Page 231, line 12.', 'A cat has 4 legs and 1 tail.', 'He lives on floor 5.', 'We bought 3 tickets at 125 each.', 'Wait 15 minutes.', 'There are 4 seasons and 12 months.', 'Walk 2 miles, then 1 more.', 'Three plus two is 5.', 'Track 3, 11 sharp.', 'It is 13 miles to Exeter.', 'The shop opens at 5, not 4.'],
  'E-49': ['The mill was built in 1867.', 'The price is 90 pounds.', 'House 7, flat 108.', 'Light travels at almost 300 000 km a second.', 'A year is 365 days (or 366).', 'Train 16 leaves at 20:40.', 'For 8 hours, 1000; for 10, 1250.', 'Dickens was born in 1812.', 'Loch Ness is 230 metres deep.', 'Temperature: 36.6.', 'London was founded in the year 43.', 'A year has 12 months and 365 days.', 'Bus 60 goes to the station.', 'It costs 1 990 pounds.', 'Height 178 cm, weight 70 kg.', 'Departs 07:45, arrives 10:20.', 'Flat 96, code 9607.', 'Phone: 0800 100 2030.', 'Pi is 3.14.', 'Order 4085 is ready.', 'Six nines are 54.', 'The bridge is 1 890 feet long.', 'In 1969 men walked on the moon.'],
  'E-50': ['The engineer writes: "The system is simple (almost)". Input: ore; output: pages.', 'In 1812 Dickens was born, and the English novel changed.', 'Which is heavier: a ton of coal or a ton of quartz? Easy: the empty cart!', "House 7 (by the river) sold for 1 250 000 pounds; the owner's pleased."],
};

// Page samples: the first line of a real page for each category and grade,
// so the plan can be judged by reading. Literature is public domain.
const PAGE_SAMPLES = {
  'P-lit-1': 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. (Austen)',
  'P-lit-2': 'Two roads diverged in a yellow wood, And sorry I could not travel both, And be one traveler, long I stood. (Frost)',
  'P-lit-3': 'Tyger Tyger, burning bright, In the forests of the night; What immortal hand or eye, Could frame thy fearful symmetry? (Blake)',
  'P-triv-1': 'An octopus has three hearts, and its blood is blue.',
  'P-triv-2': 'Loch Ness holds more water than every lake in England and Wales put together: about 7 452 million cubic metres.',
  'P-triv-3': 'In 1928 the Flying Scotsman ran the 392 miles from London to Edinburgh without a stop: 8 hours, 3 minutes, 1 engine.',
  'P-tech-1': 'Speed is distance divided by time. If the distance is 120 miles and the time is 2 hours, the speed is 60 miles an hour.',
  'P-tech-2': 'The area of a circle is pi times the radius squared. With a radius of 3 (cm) the area is about 28.3 (sq cm).',
  'P-tech-3': 'Algorithm: 1) read a number; 2) if it is even, halve it, else triple it and add 1; 3) repeat until you reach 1.',
  'P-dia-1': '"Who is there?" "It is me, the postman." "What have you brought?" "A letter from home."',
  'P-dia-2': 'Hamlet. To be, or not to be, that is the question: whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune. (Shakespeare)',
  'P-dia-3': '"Curiouser and curiouser!" cried Alice; "now I am opening out like the largest telescope that ever was!" (Carroll)',
  'P-let-1': 'Dear Ann, I am writing from Leeds. It is cold here, but the work goes on. Love, Sam.',
  'P-let-2': 'Dear Mr Hudson, Thank you for your letter of 12 May. My answers, point by point: 1) yes; 2) no; 3) we can talk it over when we meet.',
  'P-let-3': 'Hello! Order 4085 (3 items; 12 700 pounds) was sent on 8 June; the tracking number is attached. Regards, the warehouse.',
  'P-lore-1': 'The smelter never sleeps. It eats ore and gives back bronze, and so it goes all day.',
  'P-lore-2': 'They say the crane once lifted itself. That is a joke, of course; but ever since, its plaque has read: "Do not test!"',
  'P-lore-3': 'The frontier has one exam: build the machine, start it (at 6:00) and go to bed. If it is running in the morning, you are a master.',
  'PX-math': 'Formula: (x + y) * (x - y) = x^2 - y^2; with x = 7, y = 3 we get 40 (100% correct).',
  'PX-code': 'if (n % 2 === 0) { print(`${n} is even`); } else { print(`odd`); } // n: 0..10',
};

module.exports = {
  course: 'en',
  scope: {
    letters: 'abcdefghijklmnopqrstuvwxyz'.split(''),
    digits: '1234567890'.split(''),
    marks: ['.', ',', "'", '-', '?', '!', ':', ';', '"', '(', ')'],
    caps: true,
    extended: ['%', '*', '+', '=', '/', '\\', '[', ']', '{', '}', '<', '>', '@', '#', '$', '&', '^', '~', '|', '_', '`'],
  },
  lessons: L,
  pages: PAGES,
  authored: AUTHORED,
  pageSamples: PAGE_SAMPLES,
  thresholds: { syllables: 8, words: 25, phrases: 40, phrasesFunc: 3, sentences: 20 },
  pageBase: 21,     // a page of order n sits at column 21 + n: order 1 at C22, where the last letter arrives
  // completion: the easier half of the pages, the same list as RU
  completion: ['P-lore-1', 'P-let-1', 'P-lit-1', 'P-triv-1', 'P-dia-1', 'P-tech-1', 'P-lore-2', 'P-let-2', 'P-lit-2'],
};
