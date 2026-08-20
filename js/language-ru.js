// Russian course data: letter frequencies, the v3 curriculum spine (mirror
// key-pairs by finger, per ore Mk), syllables, clusters, ending families,
// words with glosses. Global namespace: LANG_RU
//
// Invariant 5: everything language-specific lives here; the engine knows
// kinds and grammars, never letters. The tech tree (DESIGN.md v3) reads
// this file through PAIRS/ORE_OF and the content tables below.
(function () {
  'use strict';

  // Letter relative frequency (% of running text), sttmedia.com corpus.
  // Punctuation values are estimates for item weighting.
  const LETTER_FREQ = {
    'о': 11.18, 'е': 8.75, 'а': 7.64, 'и': 7.09, 'н': 6.78, 'т': 6.09,
    'с': 4.97, 'л': 4.96, 'в': 4.38, 'р': 4.23, 'к': 3.30, 'м': 3.17,
    'д': 3.09, 'п': 2.47, 'ы': 2.36, 'у': 2.22, 'б': 2.01, 'я': 1.96,
    'ь': 1.84, 'г': 1.72, 'з': 1.48, 'ч': 1.40, 'й': 1.21, 'ж': 1.01,
    'х': 0.95, 'ш': 0.72, 'ю': 0.47, 'ц': 0.39, 'э': 0.36, 'щ': 0.30,
    'ф': 0.21, 'ё': 0.20, 'ъ': 0.02,
    '.': 1.20, ',': 1.60, '-': 0.30, '?': 0.12, '!': 0.10,
    ':': 0.10, ';': 0.05, '"': 0.20, '(': 0.05, ')': 0.05,
  };

  // ---- the curriculum spine (v3, locked 2026-08-18) ----
  // Mirror key-pairs — same finger, both hands — sorted by frequency, each
  // pair belonging to one ore (= one finger) at one Mk (= one reach). Ore ids
  // are the chain's material ids (az = iron, buki = copper, vedi = quartz —
  // legacy names, never renamed; stone / coal / oil are additive).
  // Entries with `at` are key events at a machine (comma at the Fastener…):
  // they unlock when that machine's Mk is bought. Until those machines exist
  // in the build (phases 4–5) they unlock as they are reached — see engine.
  const PAIRS = [
    { keys: ['а', 'о'], ore: 'az', mk: 1, tier: 0 },     // F J — index home
    { keys: ['е', 'н'], ore: 'buki', mk: 1, tier: 0 },   // T Y — index top
    { keys: ['и', 'т'], ore: 'stone', mk: 1, tier: 0 },  // B N — index bottom
    { keys: ['в', 'л'], ore: 'vedi', mk: 1, tier: 1 },   // D K — middle home
    { keys: ['п', 'р'], ore: 'az', mk: 2, tier: 1 },     // G H — index inner home
    { keys: ['с', 'б'], ore: 'vedi', mk: 2, tier: 1 },   // C , — middle bottom
    { keys: ['ы', 'д'], ore: 'coal', mk: 1, tier: 2 },   // S L — ring home
    { keys: ['к', 'г'], ore: 'buki', mk: 2, tier: 2 },   // R U — index inner top
    { keys: ['м', 'ь'], ore: 'stone', mk: 2, tier: 2 },  // V M — index inner bottom
    { keys: ['я', '.'], ore: 'oil', mk: 1, tier: 3 },    // Z / — pinky bottom
    { keys: [','], at: 'fastener', mk: 1, tier: 3 },      // Shift+/ — the signature hurdle
    { keys: ['у', 'ш'], ore: 'vedi', mk: 3, tier: 3 },   // E I — middle top
    { keys: ['й', 'з'], ore: 'oil', mk: 2, tier: 3 },    // Q P — pinky top
    { keys: ['ч', 'ю'], ore: 'coal', mk: 2, tier: 4 },   // X . — ring bottom
    { keys: ['?', '!', '-'], at: 'fastener', mk: 2, tier: 4 },
    { keys: ['ф', 'ж'], ore: 'oil', mk: 3, tier: 4 },    // A ; — pinky home
    { keys: ['ц', 'щ'], ore: 'coal', mk: 3, tier: 4 },   // W O — ring top
    { keys: ['э', 'х', 'ё', 'ъ'], ore: 'oil', mk: 4, tier: 5 }, // outer pinky
    { keys: [':', ';', '"', '(', ')'], at: 'fastener', mk: 3, tier: 5 },
  ];

  // Flattened introduction order (letters + punctuation), for tables and
  // for the pre-v3 save migration.
  const UNLOCK_ORDER = PAIRS.flatMap((p) => p.keys);
  const SEED_COUNT = 6;

  // letter → the ore (finger) it belongs to
  const ORE_OF = {};
  for (const p of PAIRS) if (p.ore) for (const k of p.keys) ORE_OF[k] = p.ore;

  const VOWELS = new Set(['а', 'е', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'ё']);
  // letters that never open a syllable (signs and the glide) — the generator
  // treats them as neither vowel nor onset consonant
  const SEMIS = new Set(['ь', 'ъ', 'й']);

  // The pre-v3 unlock order (single letters by frequency). A v1 save's
  // unlockedCount indexes into it; the engine's migration reads it from here.
  const LEGACY_ORDER = ['о', 'е', 'а', 'и', 'н', 'т', 'с', 'л', 'в', 'р', 'к', 'м', 'д', 'п', 'ы', 'у', 'б', 'я', 'ь', 'г', 'з', 'ч', 'й', '.', ',', 'ж', 'х', 'ш', 'ю', 'ё', 'ц', 'э', 'щ', 'ф', 'ъ'];

  // Trainable non-letter items (never used inside generated words).
  const PUNCT = new Set(['.', ',', '?', '!', '-', ':', ';', '"', '(', ')']);

  // Letters that make a collected word a "rare find" in the passport.
  const RARE_LETTERS = new Set(['ф', 'ъ', 'ё', 'щ', 'ц', 'э']);

  // Top bigrams (legacy bigram frames; the cluster table below supersedes).
  const TOP_BIGRAMS = ['ст', 'но', 'ен', 'то', 'на', 'ов', 'ни', 'ра', 'во', 'ко'];

  // ---- syllables: real, high-frequency, [syllable, weight 1–10] ----
  // The Smelter's grammar. Filtered live to the recipe alphabet.
  const SYLLABLES = [
    // CV — the backbone
    ['на', 10], ['но', 9], ['не', 10], ['ни', 8], ['ну', 4], ['ны', 5], ['ня', 3], ['ню', 1],
    ['то', 9], ['та', 8], ['те', 8], ['ти', 7], ['ту', 4], ['ты', 6], ['тя', 2], ['тю', 1],
    ['ко', 8], ['ка', 8], ['ке', 4], ['ки', 6], ['ку', 4], ['кы', 1],
    ['ро', 8], ['ра', 8], ['ре', 8], ['ри', 6], ['ру', 4], ['ры', 4], ['ря', 3], ['рю', 1],
    ['ло', 7], ['ла', 8], ['ле', 7], ['ли', 8], ['лу', 3], ['лы', 3], ['ля', 4], ['лю', 3],
    ['во', 8], ['ва', 8], ['ве', 6], ['ви', 5], ['ву', 2], ['вы', 5], ['вя', 1],
    ['по', 10], ['па', 5], ['пе', 5], ['пи', 4], ['пу', 2], ['пы', 1], ['пя', 1],
    ['со', 6], ['са', 5], ['се', 6], ['си', 5], ['су', 3], ['сы', 2], ['ся', 4], ['сю', 1],
    ['до', 6], ['да', 7], ['де', 6], ['ди', 4], ['ду', 3], ['ды', 3], ['дя', 1], ['дю', 1],
    ['го', 6], ['га', 4], ['ге', 3], ['ги', 3], ['гу', 2], ['гы', 1],
    ['мо', 6], ['ма', 6], ['ме', 5], ['ми', 5], ['му', 3], ['мы', 5], ['мя', 2], ['мю', 1],
    ['бо', 4], ['ба', 4], ['бе', 4], ['би', 3], ['бу', 3], ['бы', 4], ['бя', 1], ['бю', 1],
    ['зо', 3], ['за', 6], ['зе', 2], ['зи', 2], ['зу', 1], ['зы', 1], ['зя', 1],
    ['ча', 4], ['че', 4], ['чи', 3], ['чу', 2], ['чё', 1],
    ['ша', 3], ['ше', 2], ['ши', 3], ['шу', 1], ['шо', 1],
    ['жа', 2], ['же', 3], ['жи', 3], ['жу', 1],
    ['ха', 2], ['хо', 3], ['хи', 1], ['ху', 1],
    ['ца', 2], ['це', 2], ['ци', 2], ['цы', 1],
    ['ща', 1], ['ще', 2], ['щи', 2], ['щу', 1],
    ['фа', 1], ['фо', 1], ['фе', 1], ['фи', 1],
    ['ю', 1], ['я', 3], ['э', 1], ['ё', 1],
    // VC — closed syllables
    ['ан', 4], ['он', 6], ['ен', 6], ['ин', 4], ['ун', 1], ['ын', 1],
    ['ат', 4], ['от', 6], ['ет', 5], ['ит', 4], ['ут', 2], ['ыт', 1],
    ['ал', 4], ['ол', 4], ['ел', 4], ['ил', 3], ['ул', 1], ['ыл', 2],
    ['ар', 4], ['ор', 5], ['ер', 5], ['ир', 2], ['ур', 1], ['ыр', 1],
    ['ас', 4], ['ос', 5], ['ес', 4], ['ис', 3], ['ус', 1], ['ыс', 1],
    ['ак', 4], ['ок', 5], ['ек', 3], ['ик', 4], ['ук', 1], ['ык', 1],
    ['ав', 3], ['ов', 6], ['ев', 4], ['ив', 2],
    ['ам', 3], ['ом', 5], ['ем', 4], ['им', 3], ['ум', 2], ['ым', 2],
    ['ад', 3], ['од', 4], ['ед', 3], ['ид', 1], ['уд', 1], ['ыд', 1],
    ['ап', 2], ['оп', 2], ['еп', 1], ['ип', 1], ['уп', 1],
    ['аз', 2], ['оз', 2], ['ез', 2], ['из', 3], ['уз', 1],
    ['ах', 2], ['ох', 1], ['ех', 1], ['их', 2], ['ух', 1],
    ['ай', 3], ['ой', 5], ['ей', 4], ['ий', 4], ['уй', 1], ['ый', 4],
    ['аб', 1], ['об', 3], ['еб', 1], ['иб', 1],
    ['аг', 1], ['ог', 2], ['ег', 2], ['иг', 1],
    ['ач', 1], ['оч', 2], ['еч', 1], ['ич', 2],
    ['аш', 1], ['ош', 1], ['еш', 1], ['иш', 1],
    ['аж', 1], ['ож', 1], ['еж', 1], ['иж', 1],
    // CVC — words and word-cores
    ['нет', 6], ['нос', 3], ['нон', 1], ['тот', 5], ['тон', 3], ['ток', 2], ['том', 3], ['тор', 2],
    ['вот', 5], ['вол', 2], ['вон', 2], ['пол', 3], ['пар', 2], ['пор', 3], ['рот', 2], ['ров', 1],
    ['лес', 3], ['лет', 3], ['лов', 2], ['лом', 1], ['сон', 3], ['сор', 1], ['сок', 2], ['сол', 1],
    ['дом', 4], ['дар', 2], ['дол', 1], ['дым', 1], ['кот', 3], ['кон', 2], ['ком', 2], ['кол', 1],
    ['мир', 3], ['мор', 1], ['мол', 1], ['бор', 1], ['бок', 2], ['бык', 1], ['год', 4], ['гол', 1],
    ['зал', 1], ['зов', 1], ['зря', 1], ['час', 3], ['чай', 2], ['чей', 2], ['шар', 1], ['шум', 1],
    ['жар', 1], ['жил', 1], ['хор', 1], ['цех', 1], ['щит', 1], ['рай', 1], ['зай', 1],
    ['нит', 1], ['тен', 1], ['тин', 1], ['ант', 1], ['ото', 2], ['ана', 1], ['ене', 1],
  ];

  // ---- consonant clusters: the Foundry's grammar (frequent onsets/codas) ----
  // phase 4: syllables over the T2–T3 letters — added only where the table
  // has none, weights on the table's 1–10 scale
  const MORE_SYLLABLES = [
    ['ды', 18], ['да', 30], ['до', 28], ['де', 26], ['ди', 14], ['ад', 10], ['од', 12], ['ед', 8], ['ид', 6], ['ыл', 8], ['ыт', 7], ['ын', 6],
    ['ка', 32], ['ко', 34], ['ке', 10], ['ки', 18], ['ак', 14], ['ок', 20], ['ек', 8], ['ик', 12], ['га', 12], ['го', 26], ['ге', 6], ['ги', 8], ['ог', 10], ['ег', 8],
    ['ма', 22], ['мо', 20], ['ме', 24], ['ми', 14], ['мы', 10], ['ам', 10], ['ом', 18], ['ем', 12], ['им', 10], ['ть', 30], ['ль', 16], ['нь', 12], ['сь', 14], ['дь', 6], ['мь', 4],
    ['ня', 10], ['ля', 12], ['ря', 8], ['ся', 20], ['тя', 6], ['мя', 8], ['вя', 4], ['ая', 14], ['яя', 4], ['ея', 4],
    ['ту', 10], ['ду', 10], ['ну', 10], ['му', 8], ['ку', 8], ['пу', 6], ['лу', 6], ['ру', 8], ['су', 6], ['бу', 8], ['ут', 6], ['ул', 6], ['ум', 6], ['уд', 6],
    ['ша', 10], ['ше', 8], ['ши', 8], ['шу', 4], ['аш', 6], ['ош', 6], ['еш', 4], ['уш', 4], ['ыш', 3],
    ['ой', 16], ['ый', 14], ['ий', 12], ['ай', 8], ['ей', 10], ['уй', 3], ['за', 12], ['зо', 6], ['зе', 6], ['зи', 6], ['зу', 3], ['зы', 3], ['аз', 6], ['оз', 4], ['из', 8], ['уз', 3],
  ];
  {
    const have = new Set(SYLLABLES.map(([s]) => s));
    for (const [s, w] of MORE_SYLLABLES) if (!have.has(s)) { SYLLABLES.push([s, Math.max(1, Math.round(w / 3))]); have.add(s); }
  }

  const CLUSTERS = [
    'ст', 'ск', 'сп', 'ср', 'сн', 'сл', 'св', 'см', 'сб', 'сд',
    'пр', 'пл', 'тр', 'тв', 'кр', 'кл', 'вл', 'вр', 'вс', 'вн',
    'бр', 'бл', 'гр', 'гл', 'др', 'дв', 'дн', 'зн', 'зд', 'зв',
    'нт', 'нд', 'нк', 'рт', 'рм', 'рн', 'рк', 'лк', 'лн', 'мн',
    'стр', 'вст', 'здр', 'ств', 'скр', 'спр', 'чт', 'шк', 'жд', 'щн',
  ];

  // ---- ending families: the Molder's grammar, keyed by ore (flux) ----
  const ENDINGS = {
    az:    ['по-', 'про-', '-ор', '-ар', '-ора', '-ро', '-ра', '-опа', '-ап', '-оп'],
    buki:  ['-ение', '-ник', '-ек', '-нк', '-ен', '-ген', '-ке', '-нег', '-ние', '-нее', '-ене'],
    stone: ['-ть', '-ить', '-ом', '-им', '-ими', '-ит', '-ми', '-тим', '-ти', '-ите', '-ат', '-ять'],
    vedi:  ['-ств', '-ов', '-ев', '-ул', '-ль', '-сь', '-ушк', '-вш', '-ал', '-ел', '-ав'],
    coal:  ['-ды', '-ция', '-щик', '-чик', '-ющ', '-ущ', '-ич', 'до-', '-ыд', '-ады', '-оды'],
    oil:   ['-ся', '-ый', '-ий', '-ой', '-яя', '-ёт', '-ешь', 'объ-', 'съ-', '-ая', '-яй', '-зя'],
  };

  // Passport set ids (labels live in i18n).
  const WORD_SETS = ['func', 'verbs', 'people', 'time', 'nature', 'home', 'rail', 'place', 'adj', 'life', 'work', 'things'];

  // [word, gloss, set]. е-spellings used where standard print uses them
  // (ещё → еще) so words unlock earlier; ё-words wait for ё.
  const WORDS = [
    // --- little words (particles, pronouns, prepositions) ---
    ['и', 'and', 'func'], ['в', 'in', 'func'], ['не', 'not', 'func'], ['он', 'he', 'func'],
    ['на', 'on', 'func'], ['я', 'I', 'func'], ['что', 'what / that', 'func'], ['тот', 'that one', 'func'],
    ['с', 'with', 'func'], ['а', 'and / but', 'func'], ['весь', 'all, whole', 'func'], ['это', 'this', 'func'],
    ['как', 'how / as', 'func'], ['она', 'she', 'func'], ['по', 'along, by', 'func'], ['но', 'but', 'func'],
    ['они', 'they', 'func'], ['к', 'to, towards', 'func'], ['у', 'at, by', 'func'], ['ты', 'you (informal)', 'func'],
    ['из', 'from, out of', 'func'], ['мы', 'we', 'func'], ['за', 'behind / for', 'func'], ['вы', 'you (formal)', 'func'],
    ['так', 'so', 'func'], ['же', '(emphasis)', 'func'], ['от', 'from', 'func'], ['этот', 'this one', 'func'],
    ['который', 'which', 'func'], ['о', 'about', 'func'], ['один', 'one', 'func'], ['еще', 'still, yet', 'func'],
    ['бы', 'would', 'func'], ['такой', 'such', 'func'], ['только', 'only', 'func'], ['себя', 'oneself', 'func'],
    ['какой', 'which, what kind', 'func'], ['когда', 'when', 'func'], ['уже', 'already', 'func'],
    ['для', 'for', 'func'], ['вот', 'here is', 'func'], ['кто', 'who', 'func'], ['да', 'yes', 'func'],
    ['мой', 'my', 'func'], ['до', 'until, up to', 'func'], ['или', 'or', 'func'], ['если', 'if', 'func'],
    ['нет', 'no', 'func'], ['ни', 'not a', 'func'], ['даже', 'even', 'func'], ['другой', 'other', 'func'],
    ['наш', 'our', 'func'], ['свой', "one's own", 'func'], ['ну', 'well', 'func'], ['под', 'under', 'func'],
    ['где', 'where', 'func'], ['сам', 'oneself', 'func'], ['раз', 'time, occasion', 'func'],
    ['чтобы', 'in order to', 'func'], ['там', 'there', 'func'], ['чем', 'than', 'func'], ['тут', 'here', 'func'],
    ['ничто', 'nothing', 'func'], ['очень', 'very', 'func'], ['ли', 'whether', 'func'], ['при', 'at, near', 'func'],
    ['надо', 'need to', 'func'], ['без', 'without', 'func'], ['тоже', 'also', 'func'], ['то', 'that / then', 'func'],
    ['оно', 'it', 'func'], ['все', 'all / everything', 'func'], ['никто', 'nobody', 'func'],
    ['просто', 'simply', 'func'], ['снова', 'again', 'func'], ['вместе', 'together', 'func'],
    ['пока', 'bye / while', 'func'], ['можно', 'one may', 'func'], ['нельзя', 'one may not', 'func'],
    ['нужно', 'necessary', 'func'], ['здесь', 'here', 'func'], ['много', 'many, much', 'func'],
    ['мало', 'few, little', 'func'], ['всё', 'everything', 'func'],
    ['те', 'those', 'func'], ['та', 'that (f.)', 'func'], ['её', 'her', 'func'], ['его', 'his', 'func'],
    ['нас', 'us', 'func'], ['вас', 'you (acc.)', 'func'], ['нам', 'to us', 'func'], ['вам', 'to you', 'func'],
    ['ему', 'to him', 'func'], ['им', 'to them / by him', 'func'], ['ей', 'to her', 'func'], ['их', 'their / them', 'func'],
    ['об', 'about', 'func'], ['со', 'with', 'func'], ['ко', 'to', 'func'], ['во', 'in', 'func'],
    ['над', 'above', 'func'], ['перед', 'in front of', 'func'], ['между', 'between', 'func'], ['через', 'through', 'func'],
    ['после', 'after', 'func'], ['около', 'near', 'func'], ['вокруг', 'around', 'func'], ['кроме', 'except', 'func'],
    ['потом', 'later', 'func'], ['почти', 'almost', 'func'], ['совсем', 'completely', 'func'], ['опять', 'again', 'func'],
    ['всегда', 'always', 'func'], ['иногда', 'sometimes', 'func'], ['никогда', 'never', 'func'], ['сразу', 'at once', 'func'],
    ['тогда', 'then', 'func'], ['теперь', 'now', 'func'], ['сюда', 'here (to)', 'func'], ['туда', 'there (to)', 'func'],
    ['оттуда', 'from there', 'func'], ['отсюда', 'from here', 'func'], ['ведь', 'after all', 'func'], ['лишь', 'only, merely', 'func'],
    ['вроде', 'sort of', 'func'], ['зато', 'but then', 'func'], ['итак', 'so, thus', 'func'], ['ага', 'aha', 'func'],
    ['вон', 'over there', 'func'], ['вне', 'outside', 'func'], ['ото', 'from', 'func'], ['ана', '(as in) up on', 'func'],
    // --- doing words ---
    ['быть', 'to be', 'verbs'], ['сказать', 'to say', 'verbs'], ['мочь', 'to be able', 'verbs'],
    ['говорить', 'to speak', 'verbs'], ['знать', 'to know', 'verbs'], ['стать', 'to become', 'verbs'],
    ['хотеть', 'to want', 'verbs'], ['видеть', 'to see', 'verbs'], ['идти', 'to go', 'verbs'],
    ['стоять', 'to stand', 'verbs'], ['есть', 'there is / to eat', 'verbs'], ['слушать', 'to listen', 'verbs'],
    ['смотреть', 'to watch', 'verbs'], ['читать', 'to read', 'verbs'], ['писать', 'to write', 'verbs'],
    ['думать', 'to think', 'verbs'], ['жить', 'to live', 'verbs'], ['любить', 'to love', 'verbs'],
    ['делать', 'to do', 'verbs'], ['работать', 'to work', 'verbs'], ['играть', 'to play', 'verbs'],
    ['спать', 'to sleep', 'verbs'], ['пить', 'to drink', 'verbs'], ['дать', 'to give', 'verbs'],
    ['взять', 'to take', 'verbs'], ['найти', 'to find', 'verbs'], ['понять', 'to understand', 'verbs'],
    ['помнить', 'to remember', 'verbs'], ['забыть', 'to forget', 'verbs'], ['спросить', 'to ask', 'verbs'],
    ['ответить', 'to answer', 'verbs'],
    ['брал', 'took (he)', 'verbs'], ['брала', 'took (she)', 'verbs'], ['стал', 'became', 'verbs'], ['стало', 'became (it)', 'verbs'],
    ['спал', 'slept', 'verbs'], ['спала', 'slept (she)', 'verbs'], ['пел', 'sang', 'verbs'], ['пела', 'sang (she)', 'verbs'],
    ['вел', 'led', 'verbs'], ['вела', 'led (she)', 'verbs'], ['нес', 'carried', 'verbs'], ['несла', 'carried (she)', 'verbs'],
    ['лил', 'poured', 'verbs'], ['лила', 'poured (she)', 'verbs'], ['пил', 'drank', 'verbs'], ['пила', 'drank (she) / saw (tool)', 'verbs'],
    ['бил', 'hit', 'verbs'], ['била', 'hit (she)', 'verbs'], ['носил', 'carried, wore', 'verbs'], ['носила', 'wore (she)', 'verbs'],
    ['просил', 'asked', 'verbs'], ['спросил', 'asked (once)', 'verbs'], ['ответил', 'answered', 'verbs'], ['оставил', 'left (something)', 'verbs'],
    ['поставил', 'put, set', 'verbs'], ['посетил', 'visited', 'verbs'], ['строил', 'built', 'verbs'], ['построил', 'built (finished)', 'verbs'],
    ['варил', 'boiled, cooked', 'verbs'], ['солил', 'salted', 'verbs'], ['ловил', 'caught', 'verbs'], ['плавил', 'melted (metal)', 'verbs'],
    ['лететь', 'to fly', 'verbs'], ['летит', 'flies', 'verbs'], ['летал', 'flew (about)', 'verbs'], ['плыть', 'to swim, sail', 'verbs'],
    ['расти', 'to grow', 'verbs'], ['нести', 'to carry', 'verbs'], ['вести', 'to lead', 'verbs'], ['пасти', 'to graze (herd)', 'verbs'],
    ['сесть', 'to sit down', 'verbs'], ['лечь', 'to lie down', 'verbs'], ['бежать', 'to run', 'verbs'], ['ждать', 'to wait', 'verbs'],
    ['звать', 'to call', 'verbs'], ['петь', 'to sing', 'verbs'], ['мыть', 'to wash', 'verbs'], ['бить', 'to hit', 'verbs'],
    ['лить', 'to pour', 'verbs'], ['шить', 'to sew', 'verbs'], ['мять', 'to crumple', 'verbs'], ['снять', 'to take off', 'verbs'],
    ['начать', 'to begin', 'verbs'], ['кончить', 'to finish', 'verbs'], ['открыть', 'to open', 'verbs'], ['закрыть', 'to close', 'verbs'],
    ['купить', 'to buy', 'verbs'], ['платить', 'to pay', 'verbs'], ['строить', 'to build', 'verbs'], ['ломать', 'to break', 'verbs'],
    ['копать', 'to dig', 'verbs'], ['носить', 'to carry, wear', 'verbs'], ['возить', 'to transport', 'verbs'], ['водить', 'to drive, lead', 'verbs'],
    ['варить', 'to boil, cook', 'verbs'], ['ковать', 'to forge', 'verbs'], ['плавить', 'to smelt', 'verbs'], ['лить', 'to cast, pour', 'verbs'],
    ['тонет', 'is sinking', 'verbs'], ['тонут', 'are sinking', 'verbs'], ['иметь', 'to have', 'verbs'], ['уметь', 'to know how', 'verbs'],
    // --- people & family ---
    ['человек', 'person', 'people'], ['люди', 'people', 'people'], ['мужчина', 'man', 'people'],
    ['женщина', 'woman', 'people'], ['ребенок', 'child', 'people'], ['сын', 'son', 'people'],
    ['дочь', 'daughter', 'people'], ['брат', 'brother', 'people'], ['сестра', 'sister', 'people'],
    ['отец', 'father', 'people'], ['мать', 'mother', 'people'], ['мама', 'mom', 'people'],
    ['папа', 'dad', 'people'], ['семья', 'family', 'people'], ['друг', 'friend', 'people'],
    ['имя', 'name', 'people'], ['глаз', 'eye', 'people'], ['голова', 'head', 'people'],
    ['рука', 'hand, arm', 'people'], ['лицо', 'face', 'people'], ['нос', 'nose', 'people'],
    ['нога', 'leg, foot', 'people'], ['спина', 'back', 'people'], ['плечо', 'shoulder', 'people'], ['рот', 'mouth', 'people'],
    ['лоб', 'forehead', 'people'], ['ухо', 'ear', 'people'], ['зуб', 'tooth', 'people'], ['волос', 'hair (one)', 'people'],
    ['борода', 'beard', 'people'], ['тело', 'body', 'people'], ['сила', 'strength', 'people'], ['голос', 'voice', 'people'],
    ['барон', 'baron', 'people'], ['пилот', 'pilot', 'people'], ['актер', 'actor', 'people'], ['поэт', 'poet', 'people'],
    ['солдат', 'soldier', 'people'], ['капитан', 'captain', 'people'], ['доктор', 'doctor', 'people'], ['повар', 'cook', 'people'],
    ['слесарь', 'fitter, locksmith', 'people'], ['столяр', 'joiner', 'people'], ['пастор', 'pastor', 'people'], ['сосед', 'neighbour', 'people'],
    ['народ', 'people, nation', 'people'], ['герой', 'hero', 'people'], ['гость', 'guest', 'people'], ['враг', 'enemy', 'people'],
    ['дед', 'grandfather', 'people'], ['баба', 'old woman', 'people'], ['тетя', 'aunt', 'people'], ['дядя', 'uncle', 'people'],
    ['внук', 'grandson', 'people'], ['малыш', 'little one', 'people'], ['ученик', 'pupil', 'people'], ['учитель', 'teacher', 'people'],
    // --- time & seasons ---
    ['время', 'time', 'time'], ['год', 'year', 'time'], ['день', 'day', 'time'],
    ['ночь', 'night', 'time'], ['утро', 'morning', 'time'], ['вечер', 'evening', 'time'],
    ['час', 'hour', 'time'], ['минута', 'minute', 'time'], ['неделя', 'week', 'time'],
    ['месяц', 'month', 'time'], ['зима', 'winter', 'time'], ['весна', 'spring', 'time'],
    ['осень', 'autumn', 'time'], ['лето', 'summer', 'time'], ['сегодня', 'today', 'time'],
    ['сейчас', 'right now', 'time'], ['потом', 'later, then', 'time'], ['первый', 'first', 'time'], ['сон', 'dream, sleep', 'time'],
    ['лета', 'summers / years', 'time'], ['пора', 'it is time / season', 'time'], ['век', 'century, age', 'time'], ['миг', 'instant', 'time'],
    ['срок', 'term, deadline', 'time'], ['ранее', 'earlier', 'time'], ['рано', 'early', 'time'], ['поздно', 'late', 'time'],
    ['вчера', 'yesterday', 'time'], ['завтра', 'tomorrow', 'time'], ['давно', 'long ago', 'time'], ['недавно', 'recently', 'time'],
    ['скоро', 'soon', 'time'], ['после', 'afterwards', 'time'], ['осенью', 'in autumn', 'time'], ['летом', 'in summer', 'time'],
    ['зимой', 'in winter', 'time'], ['весной', 'in spring', 'time'], ['ночью', 'at night', 'time'], ['днем', 'by day', 'time'],
    // --- nature & world ---
    ['море', 'sea', 'nature'], ['вода', 'water', 'nature'], ['лес', 'forest', 'nature'],
    ['река', 'river', 'nature'], ['гора', 'mountain', 'nature'], ['небо', 'sky', 'nature'],
    ['земля', 'earth, land', 'nature'], ['звезда', 'star', 'nature'], ['дерево', 'tree', 'nature'],
    ['птица', 'bird', 'nature'], ['собака', 'dog', 'nature'], ['кошка', 'cat (f.)', 'nature'],
    ['кот', 'cat', 'nature'], ['рыба', 'fish', 'nature'], ['ёлка', 'fir tree', 'nature'],
    ['енот', 'raccoon', 'nature'], ['тина', 'silt, slime', 'nature'], ['тени', 'shadows', 'nature'], ['нити', 'threads', 'nature'],
    ['оса', 'wasp', 'nature'], ['сова', 'owl', 'nature'], ['лиса', 'fox', 'nature'], ['слон', 'elephant', 'nature'],
    ['волк', 'wolf', 'nature'], ['вол', 'ox', 'nature'], ['барс', 'snow leopard', 'nature'], ['бобр', 'beaver', 'nature'],
    ['ворона', 'crow', 'nature'], ['ворон', 'raven', 'nature'], ['сорока', 'magpie', 'nature'], ['осел', 'donkey', 'nature'],
    ['паук', 'spider', 'nature'], ['комар', 'mosquito', 'nature'], ['крот', 'mole', 'nature'], ['крыса', 'rat', 'nature'],
    ['корова', 'cow', 'nature'], ['коза', 'goat', 'nature'], ['конь', 'horse', 'nature'], ['змей', 'serpent / kite', 'nature'],
    ['роса', 'dew', 'nature'], ['трава', 'grass', 'nature'], ['поле', 'field', 'nature'], ['сено', 'hay', 'nature'],
    ['волна', 'wave', 'nature'], ['берег', 'shore', 'nature'], ['остров', 'island', 'nature'], ['песок', 'sand', 'nature'],
    ['камень', 'stone', 'nature'], ['скала', 'cliff', 'nature'], ['холм', 'hill', 'nature'], ['долина', 'valley', 'nature'],
    ['лист', 'leaf', 'nature'], ['ветер', 'wind', 'nature'], ['снег', 'snow', 'nature'], ['лед', 'ice', 'nature'],
    ['дождь', 'rain', 'nature'], ['туман', 'fog', 'nature'], ['гроза', 'thunderstorm', 'nature'], ['буря', 'storm', 'nature'],
    ['солнце', 'sun', 'nature'], ['луна', 'moon', 'nature'], ['облако', 'cloud', 'nature'], ['заря', 'dawn', 'nature'],
    ['роза', 'rose', 'nature'], ['сосна', 'pine', 'nature'], ['осина', 'aspen', 'nature'], ['липа', 'linden', 'nature'],
    ['лоза', 'vine', 'nature'], ['мох', 'moss', 'nature'], ['дуб', 'oak', 'nature'], ['сад', 'garden', 'nature'],
    ['пруд', 'pond', 'nature'], ['болото', 'swamp', 'nature'], ['ручей', 'brook', 'nature'], ['озеро', 'lake', 'nature'],
    ['лужа', 'puddle', 'nature'], ['роща', 'grove', 'nature'], ['чаща', 'thicket', 'nature'], ['ёж', 'hedgehog', 'nature'],
    // --- home & food ---
    ['дом', 'house, home', 'home'], ['окно', 'window', 'home'], ['стол', 'table', 'home'],
    ['стул', 'chair', 'home'], ['книга', 'book', 'home'], ['чай', 'tea', 'home'],
    ['хлеб', 'bread', 'home'], ['молоко', 'milk', 'home'], ['мясо', 'meat', 'home'],
    ['яблоко', 'apple', 'home'], ['сало', 'lard', 'home'], ['соль', 'salt', 'home'], ['сок', 'juice', 'home'],
    ['суп', 'soup', 'home'], ['каша', 'porridge', 'home'], ['мед', 'honey', 'home'], ['масло', 'butter, oil', 'home'],
    ['вино', 'wine', 'home'], ['пиво', 'beer', 'home'], ['торт', 'cake', 'home'], ['сыр', 'cheese', 'home'],
    ['боб', 'bean', 'home'], ['бобы', 'beans', 'home'], ['лапа', 'paw', 'home'], ['лапта', 'bat-and-ball game', 'home'],
    ['ворота', 'gate', 'home'], ['дверь', 'door', 'home'], ['стена', 'wall', 'home'], ['пол', 'floor', 'home'],
    ['потолок', 'ceiling', 'home'], ['полка', 'shelf', 'home'], ['лампа', 'lamp', 'home'], ['печь', 'stove, oven', 'home'],
    ['плита', 'cooker / slab', 'home'], ['ванна', 'bath', 'home'], ['кровать', 'bed', 'home'], ['ковер', 'carpet', 'home'],
    ['тарелка', 'plate', 'home'], ['ложка', 'spoon', 'home'], ['нож', 'knife', 'home'], ['вилка', 'fork', 'home'],
    ['стакан', 'glass (drinking)', 'home'], ['банка', 'jar', 'home'], ['бутылка', 'bottle', 'home'], ['ведро', 'bucket', 'home'],
    ['обед', 'lunch', 'home'], ['ужин', 'dinner', 'home'], ['завтрак', 'breakfast', 'home'], ['еда', 'food', 'home'],
    ['вата', 'cotton wool', 'home'], ['нота', 'note (music)', 'home'], ['тонна', 'tonne', 'home'], ['антенна', 'antenna', 'home'],
    // --- rails & roads ---
    ['поезд', 'train', 'rail'], ['вагон', 'train car', 'rail'], ['вокзал', 'railway station', 'rail'],
    ['путь', 'way, path', 'rail'], ['билет', 'ticket', 'rail'], ['дорога', 'road', 'rail'],
    ['порт', 'port', 'rail'], ['мост', 'bridge', 'rail'], ['тропа', 'trail', 'rail'], ['тоннель', 'tunnel', 'rail'],
    ['перевал', 'mountain pass', 'rail'], ['брод', 'ford', 'rail'], ['паром', 'ferry', 'rail'], ['лодка', 'boat', 'rail'],
    ['парус', 'sail', 'rail'], ['весло', 'oar', 'rail'], ['колесо', 'wheel', 'rail'], ['телега', 'cart', 'rail'],
    ['трасса', 'highway', 'rail'], ['старт', 'start', 'rail'], ['спорт', 'sport', 'rail'], ['борт', 'board (side)', 'rail'],
    // --- cities & places ---
    ['город', 'city', 'place'], ['страна', 'country', 'place'], ['место', 'place', 'place'],
    ['школа', 'school', 'place'], ['сторона', 'side', 'place'], ['село', 'village', 'place'],
    ['завод', 'factory', 'place'], ['рынок', 'market', 'place'], ['парк', 'park', 'place'], ['театр', 'theatre', 'place'],
    ['зал', 'hall', 'place'], ['класс', 'classroom, class', 'place'], ['банк', 'bank', 'place'], ['почта', 'post office', 'place'],
    ['лагерь', 'camp', 'place'], ['трон', 'throne', 'place'], ['опора', 'support, pillar', 'place'], ['полоса', 'strip, lane', 'place'],
    ['стан', 'camp / mill', 'place'], ['посад', 'settlement', 'place'], ['столица', 'capital', 'place'], ['родина', 'homeland', 'place'],
    // --- describing ---
    ['красивый', 'beautiful', 'adj'], ['новый', 'new', 'adj'], ['старый', 'old', 'adj'],
    ['молодой', 'young', 'adj'], ['маленький', 'small', 'adj'], ['большой', 'big', 'adj'],
    ['белый', 'white', 'adj'], ['черный', 'black', 'adj'], ['красный', 'red', 'adj'],
    ['синий', 'dark blue', 'adj'], ['зеленый', 'green', 'adj'], ['самый', 'the most', 'adj'],
    ['русский', 'Russian', 'adj'], ['быстро', 'quickly', 'adj'], ['медленно', 'slowly', 'adj'],
    ['хорошо', 'good, okay', 'adj'], ['плохо', 'badly', 'adj'],
    ['тепло', 'warm(ly)', 'adj'], ['светло', 'bright, light', 'adj'], ['темно', 'dark', 'adj'], ['босо', 'barefoot', 'adj'],
    ['просто', 'simple / simply', 'adj'], ['прав', 'right (correct)', 'adj'], ['рад', 'glad', 'adj'], ['рады', 'glad (pl.)', 'adj'],
    ['болен', 'ill', 'adj'], ['спелый', 'ripe', 'adj'], ['сырой', 'raw, damp', 'adj'], ['слабый', 'weak', 'adj'],
    ['сильный', 'strong', 'adj'], ['ровно', 'evenly, exactly', 'adj'], ['прямо', 'straight', 'adj'], ['ясно', 'clear', 'adj'],
    ['важно', 'important', 'adj'], ['трудно', 'hard, difficult', 'adj'], ['легко', 'easy', 'adj'], ['громко', 'loudly', 'adj'],
    ['тихо', 'quietly', 'adj'], ['долго', 'for a long time', 'adj'], ['редко', 'rarely', 'adj'], ['часто', 'often', 'adj'],
    ['левый', 'left', 'adj'], ['правый', 'right', 'adj'], ['верно', 'true, right', 'adj'], ['ново', 'anew', 'adj'],
    ['лысый', 'bald', 'adj'], ['босой', 'barefoot', 'adj'], ['милый', 'dear, sweet', 'adj'], ['родной', 'native, dear', 'adj'],
    // --- life & ideas ---
    ['жизнь', 'life', 'life'], ['дело', 'matter, business', 'life'], ['вопрос', 'question', 'life'],
    ['ответ', 'answer', 'life'], ['совет', 'advice', 'life'], ['свет', 'light', 'life'],
    ['пример', 'example', 'life'], ['работа', 'work', 'life'],
    ['история', 'history, story', 'life'], ['мир', 'world, peace', 'life'], ['язык', 'language, tongue', 'life'],
    ['слово', 'word', 'life'], ['привет', 'hi', 'life'], ['спасибо', 'thank you', 'life'],
    ['сто', 'hundred', 'life'], ['два', 'two', 'life'], ['тон', 'tone', 'life'],
    ['слава', 'glory', 'life'], ['спор', 'argument', 'life'], ['сон', 'sleep, dream', 'life'], ['тост', 'toast', 'life'],
    ['право', 'right, law', 'life'], ['правда', 'truth', 'life'], ['вера', 'faith', 'life'], ['воля', 'will, freedom', 'life'],
    ['сорт', 'sort, grade', 'life'], ['тест', 'test', 'life'], ['план', 'plan', 'life'], ['карта', 'map, card', 'life'],
    ['номер', 'number', 'life'], ['пара', 'pair', 'life'], ['раз', 'once', 'life'], ['три', 'three', 'life'],
    ['сотня', 'a hundred', 'life'], ['тысяча', 'thousand', 'life'], ['песня', 'song', 'life'], ['танец', 'dance', 'life'],
    ['сказка', 'fairy tale', 'life'], ['роман', 'novel', 'life'], ['стих', 'verse', 'life'], ['рассказ', 'story', 'life'],
    ['мысль', 'thought', 'life'], ['память', 'memory', 'life'], ['радость', 'joy', 'life'], ['беда', 'trouble', 'life'],
    ['страх', 'fear', 'life'], ['смех', 'laughter', 'life'], ['покой', 'peace, calm', 'life'], ['честь', 'honour', 'life'],
    ['опыт', 'experience', 'life'], ['наука', 'science', 'life'], ['урок', 'lesson', 'life'], ['польза', 'benefit', 'life'],
    ['порядок', 'order', 'life'], ['простор', 'open space', 'life'], ['тонус', 'tone (vigor)', 'life'], ['нонет', 'nonet', 'life'],
    // --- the frontier: mines, metal, machines ---
    ['руда', 'ore', 'work'], ['рудник', 'mine (ore)', 'work'], ['шахта', 'mine (shaft)', 'work'], ['уголь', 'coal', 'work'],
    ['медь', 'copper', 'work'], ['олово', 'tin', 'work'], ['сталь', 'steel', 'work'], ['металл', 'metal', 'work'],
    ['кварц', 'quartz', 'work'], ['песок', 'sand', 'work'], ['глина', 'clay', 'work'], ['смола', 'resin, tar', 'work'],
    ['болт', 'bolt', 'work'], ['винт', 'screw', 'work'], ['гайка', 'nut', 'work'], ['деталь', 'part', 'work'],
    ['модуль', 'module', 'work'], ['станок', 'machine tool', 'work'], ['мотор', 'motor', 'work'], ['провод', 'wire', 'work'],
    ['ток', 'current', 'work'], ['лента', 'belt, ribbon', 'work'], ['труба', 'pipe', 'work'], ['насос', 'pump', 'work'],
    ['кран', 'crane, tap', 'work'], ['ремонт', 'repair', 'work'], ['смена', 'shift', 'work'], ['норма', 'quota, norm', 'work'],
    ['план', 'plan', 'work'], ['склад', 'warehouse', 'work'], ['ворот', 'winch', 'work'], ['вал', 'shaft, rampart', 'work'],
    ['пар', 'steam', 'work'], ['парта', 'school desk', 'work'], ['опора', 'support', 'work'], ['балка', 'beam', 'work'],
    ['брус', 'timber beam', 'work'], ['слиток', 'ingot', 'work'], ['сплав', 'alloy', 'work'], ['проба', 'sample, test', 'work'],
    ['сбор', 'assembly, gathering', 'work'], ['набор', 'set, kit', 'work'], ['отбор', 'selection', 'work'], ['прибор', 'device', 'work'],
    ['топор', 'axe', 'work'], ['лопата', 'shovel', 'work'], ['молот', 'hammer', 'work'], ['пила', 'saw', 'work'],
    ['тонна', 'tonne', 'work'], ['вес', 'weight', 'work'], ['рост', 'growth', 'work'], ['спад', 'decline', 'work'],
    ['поток', 'flow', 'work'], ['протон', 'proton', 'work'], ['атом', 'atom', 'work'], ['робот', 'robot', 'work'],
    ['ротор', 'rotor', 'work'], ['статор', 'stator', 'work'], ['аорта', 'aorta', 'work'], ['спорт', 'sport', 'work'],
    ['тент', 'awning', 'work'], ['настил', 'decking', 'work'], ['помост', 'platform', 'work'], ['столб', 'post, pole', 'work'],
    ['насос', 'pump', 'work'], ['ворса', 'pile (fabric)', 'work'], ['ветвь', 'branch', 'work'], ['ствол', 'trunk, barrel', 'work'],
    // --- things ---
    ['ручка', 'pen, handle', 'things'], ['сумка', 'bag', 'things'], ['ключ', 'key', 'things'], ['замок', 'lock / castle', 'things'],
    ['мешок', 'sack', 'things'], ['ящик', 'box, crate', 'things'], ['бочка', 'barrel', 'things'], ['корзина', 'basket', 'things'],
    ['веревка', 'rope', 'things'], ['цепь', 'chain', 'things'], ['сеть', 'net, network', 'things'], ['палка', 'stick', 'things'],
    ['доска', 'board, plank', 'things'], ['лист', 'sheet', 'things'], ['бумага', 'paper', 'things'], ['письмо', 'letter', 'things'],
    ['газета', 'newspaper', 'things'], ['монета', 'coin', 'things'], ['деньги', 'money', 'things'], ['цена', 'price', 'things'],
    ['часы', 'clock, watch', 'things'], ['зеркало', 'mirror', 'things'], ['окошко', 'little window', 'things'], ['лестница', 'ladder, stairs', 'things'],
    ['шапка', 'hat', 'things'], ['пальто', 'coat', 'things'], ['сапог', 'boot', 'things'], ['платок', 'kerchief', 'things'],
    ['пояс', 'belt', 'things'], ['ремень', 'strap', 'things'], ['ткань', 'fabric', 'things'], ['лоскут', 'scrap of cloth', 'things'],
    ['посуда', 'dishes', 'things'], ['сосуд', 'vessel', 'things'], ['ваза', 'vase', 'things'], ['лоток', 'tray', 'things'],
    ['осколок', 'shard', 'things'], ['обломок', 'fragment', 'things'], ['брусок', 'bar, block', 'things'], ['стопор', 'stopper', 'things'],
    ['пост', 'post (duty)', 'things'], ['паста', 'paste', 'things'], ['тесто', 'dough', 'things'], ['сор', 'litter', 'things'],
    ['лапоть', 'bast shoe', 'things'], ['салат', 'salad', 'things'], ['ананас', 'pineapple', 'things'], ['банан', 'banana', 'things'],
    ['томат', 'tomato', 'things'], ['лимон', 'lemon', 'things'], ['орех', 'nut (food)', 'things'], ['тмин', 'caraway', 'things'],
    // --- short words for the index-finger alphabets (brass: е н к г и т м ь) ---
    ['кит', 'whale', 'nature'], ['тень', 'shadow', 'nature'], ['мне', 'to me', 'func'], ['гимн', 'anthem', 'life'],
    ['тик', 'tick / teak', 'things'], ['миг', 'instant', 'time'], ['нить', 'thread', 'things'], ['кем', 'by whom', 'func'],
    ['ним', 'him (after prep.)', 'func'], ['тем', 'by that / the more', 'func'], ['ген', 'gene', 'life'], ['нем', 'in him', 'func'],
    ['теми', 'by those', 'func'], ['ими', 'by them', 'func'], ['мнение', 'opinion', 'life'], ['имение', 'estate', 'place'],
    ['гнить', 'to rot', 'verbs'], ['темень', 'darkness', 'time'], ['никем', 'by nobody', 'func'], ['тенге', 'tenge (currency)', 'things'],
    ['тент', 'awning', 'things'], ['метить', 'to mark', 'verbs'], ['кинем', "we'll throw", 'verbs'], ['темнит', 'is being cagey', 'verbs'],
    ['имени', 'of the name', 'people'], ['минет', 'will pass', 'verbs'], ['темнеть', 'to get dark', 'verbs'], ['мигнет', 'will blink', 'verbs'],
    // --- with я й з (black brass) ---
    ['змей', 'serpent, kite', 'nature'], ['зять', 'son-in-law', 'people'], ['зенит', 'zenith', 'nature'], ['гений', 'genius', 'people'],
    ['зимний', 'wintry', 'adj'], ['змий', 'serpent (arch.)', 'nature'], ['тяни', 'pull!', 'verbs'], ['меняй', 'change!', 'verbs'],
    ['знамя', 'banner', 'things'], ['мятеж', 'mutiny', 'life'], ['язык', 'tongue', 'people'], ['зенки', 'peepers (eyes)', 'people'],
    // --- with the late tail (coke iron: а о п р я . й з ф ж э х ё ъ ы д ч ю ц щ) ---
    ['чадо', 'child (arch.)', 'people'], ['жажда', 'thirst', 'life'], ['порох', 'gunpowder', 'work'], ['хор', 'choir', 'life'],
    ['эра', 'era', 'time'], ['ярд', 'yard (unit)', 'things'], ['ряд', 'row', 'things'], ['эхо', 'echo', 'nature'],
    ['ярче', 'brighter', 'adj'], ['дача', 'dacha', 'place'], ['ода', 'ode', 'life'], ['юрод', 'holy fool', 'people'],
    ['драп', 'drape (cloth)', 'things'], ['радар', 'radar', 'work'], ['парад', 'parade', 'life'], ['ад', 'hell', 'place'],
    // --- phase 4: the T2–T3 letters (ы д · к г · м ь · я · у ш · й з) ---
    ['дым', 'smoke', 'nature'], ['сыр', 'cheese', 'things'], ['рыба', 'fish', 'nature'], ['дыра', 'hole', 'things'],
    ['сын', 'son', 'people'], ['дно', 'bottom', 'nature'], ['дед', 'grandfather', 'people'], ['сады', 'gardens', 'place'],
    ['воды', 'waters', 'nature'], ['беды', 'troubles', 'life'], ['вид', 'view', 'nature'], ['выбор', 'choice', 'life'],
    ['вывод', 'conclusion', 'work'], ['быт', 'everyday life', 'life'], ['тыл', 'rear', 'place'], ['пыл', 'ardor', 'life'],
    ['стыд', 'shame', 'life'], ['стол', 'table', 'home'], ['дол', 'dale', 'nature'], ['долина', 'valley', 'nature'],
    ['делить', 'to divide', 'verbs'], ['делать', 'to do', 'verbs'], ['падать', 'to fall', 'verbs'], ['дать', 'to give', 'verbs'],
    ['сыро', 'damp', 'adj'], ['ныне', 'nowadays', 'time'], ['ныть', 'to whine', 'verbs'], ['рыть', 'to dig', 'verbs'],
    ['выпить', 'to drink up', 'verbs'], ['выйти', 'to go out', 'verbs'], ['обед', 'lunch', 'home'], ['беседа', 'conversation', 'life'],
    ['победа', 'victory', 'life'], ['обида', 'offense', 'life'], ['посадить', 'to plant', 'verbs'], ['садить', 'to seat', 'verbs'],
    ['опыт', 'experience', 'work'], ['отдел', 'department', 'work'], ['передать', 'to pass on', 'verbs'], ['идти', 'to go (on foot)', 'verbs'],
    ['кот', 'cat', 'nature'], ['книга', 'book', 'things'], ['кони', 'horses', 'nature'], ['кино', 'cinema', 'life'],
    ['кирка', 'pickaxe', 'things'], ['кора', 'bark', 'nature'], ['корабли', 'ships', 'things'], ['кран', 'crane / tap', 'things'],
    ['краски', 'paints', 'things'], ['крест', 'cross', 'things'], ['глина', 'clay', 'nature'], ['гора', 'mountain', 'nature'],
    ['горе', 'grief', 'life'], ['гол', 'goal (sport)', 'life'], ['голос', 'voice', 'people'], ['горн', 'forge / bugle', 'work'],
    ['нога', 'leg, foot', 'people'], ['ноги', 'legs', 'people'], ['дорога', 'road', 'place'], ['игра', 'game', 'life'],
    ['игла', 'needle', 'things'], ['бег', 'running', 'life'], ['бок', 'side', 'people'], ['берег', 'shore', 'nature'],
    ['век', 'century', 'time'], ['веко', 'eyelid', 'people'], ['волк', 'wolf', 'nature'], ['волна', 'wave', 'nature'],
    ['доска', 'board', 'things'], ['док', 'dock', 'place'], ['лак', 'varnish', 'things'], ['лоб', 'forehead', 'people'],
    ['окно', 'window', 'home'], ['окна', 'windows', 'home'], ['кит', 'whale', 'nature'], ['каток', 'skating rink', 'place'],
    ['пакет', 'packet', 'things'], ['токарь', 'turner', 'work'], ['пекарь', 'baker', 'work'], ['лекарь', 'healer', 'work'],
    ['сорок', 'forty', 'things'], ['рок', 'fate', 'life'], ['срок', 'term, deadline', 'time'], ['порог', 'threshold', 'home'],
    ['пирог', 'pie', 'things'], ['слог', 'syllable', 'work'], ['налог', 'tax', 'work'], ['итог', 'total', 'work'],
    ['легко', 'easily', 'adj'], ['далеко', 'far', 'place'], ['глубоко', 'deep', 'adj'], ['долго', 'for a long time', 'time'],
    ['мел', 'chalk', 'things'], ['мир', 'world / peace', 'life'], ['мост', 'bridge', 'place'], ['мать', 'mother', 'people'],
    ['мед', 'honey', 'things'], ['мода', 'fashion', 'life'], ['молоко', 'milk', 'things'], ['море', 'sea', 'nature'],
    ['мыло', 'soap', 'things'], ['мысли', 'thoughts', 'life'], ['дом', 'house', 'home'], ['дама', 'lady', 'people'],
    ['семь', 'seven', 'things'], ['восемь', 'eight', 'things'], ['день', 'day', 'time'], ['тень', 'shade', 'nature'],
    ['лень', 'laziness', 'life'], ['соль', 'salt', 'things'], ['боль', 'pain', 'life'], ['быль', 'true story', 'life'],
    ['пыль', 'dust', 'nature'], ['дверь', 'door', 'home'], ['лось', 'elk', 'nature'], ['ось', 'axis', 'things'],
    ['мель', 'shoal', 'nature'], ['медь', 'copper', 'things'], ['место', 'place', 'place'], ['месть', 'revenge', 'life'],
    ['мера', 'measure', 'things'], ['метр', 'metre', 'things'], ['мотор', 'motor', 'things'], ['молот', 'hammer', 'things'],
    ['мастер', 'master, craftsman', 'work'], ['смена', 'shift (work)', 'work'], ['семена', 'seeds', 'nature'], ['имена', 'names', 'people'],
    ['темно', 'dark', 'adj'], ['тепло', 'warm', 'adj'], ['больно', 'painfully', 'adj'], ['вольно', 'freely', 'adj'],
    ['сесть', 'to sit down', 'verbs'], ['есть', 'to eat / there is', 'verbs'], ['петь', 'to sing', 'verbs'], ['лететь', 'to fly', 'verbs'],
    ['видеть', 'to see', 'verbs'], ['сидеть', 'to sit', 'verbs'], ['терпеть', 'to endure', 'verbs'], ['болеть', 'to be ill', 'verbs'],
    ['яма', 'pit', 'nature'], ['ясно', 'clear', 'adj'], ['яд', 'poison', 'things'], ['моя', 'my (f.)', 'func'],
    ['твоя', 'your (f.)', 'func'], ['семья', 'family', 'people'], ['имя', 'name', 'people'], ['время', 'time', 'time'],
    ['пять', 'five', 'things'], ['девять', 'nine', 'things'], ['десять', 'ten', 'things'], ['вся', 'all (f.)', 'func'],
    ['мясо', 'meat', 'things'], ['мята', 'mint', 'nature'], ['няня', 'nanny', 'people'], ['дядя', 'uncle', 'people'],
    ['тетя', 'aunt', 'people'], ['рябина', 'rowan', 'nature'], ['ряд', 'row', 'things'], ['пряник', 'gingerbread', 'things'],
    ['прямо', 'straight', 'place'], ['поляна', 'glade', 'nature'], ['стоять', 'to stand', 'verbs'], ['сиять', 'to shine', 'verbs'],
    ['идея', 'idea', 'life'], ['воля', 'will', 'life'], ['доля', 'share, lot', 'life'], ['неделя', 'week', 'time'],
    ['песня', 'song', 'life'], ['дыня', 'melon', 'things'], ['тяга', 'pull, draught', 'work'], ['пятно', 'stain', 'things'],
    ['память', 'memory', 'life'], ['пламя', 'flame', 'nature'], ['бремя', 'burden', 'life'], ['племя', 'tribe', 'people'],
    ['рядом', 'nearby', 'place'], ['сегодня', 'today', 'time'], ['нельзя', 'not allowed', 'func'], ['понять', 'to understand', 'verbs'],
    ['утро', 'morning', 'time'], ['ум', 'mind', 'life'], ['усы', 'moustache', 'people'], ['суп', 'soup', 'things'],
    ['стул', 'chair', 'home'], ['стук', 'knock', 'things'], ['пуля', 'bullet', 'things'], ['пурга', 'blizzard', 'nature'],
    ['путь', 'way', 'place'], ['туда', 'there (to)', 'place'], ['куда', 'where (to)', 'func'], ['душа', 'soul', 'life'],
    ['душ', 'shower', 'home'], ['шум', 'noise', 'things'], ['шаг', 'step', 'life'], ['шар', 'ball, sphere', 'things'],
    ['шея', 'neck', 'people'], ['шуба', 'fur coat', 'things'], ['шапка', 'hat', 'things'], ['шина', 'tyre', 'things'],
    ['шило', 'awl', 'things'], ['каша', 'porridge', 'things'], ['крыша', 'roof', 'home'], ['мышь', 'mouse', 'nature'],
    ['тишь', 'stillness', 'nature'], ['шест', 'pole', 'things'], ['шесть', 'six', 'things'], ['шелк', 'silk', 'things'],
    ['шепот', 'whisper', 'life'], ['буду', 'I will be', 'verbs'], ['будет', 'will be', 'verbs'], ['слушать', 'to listen', 'verbs'],
    ['пушка', 'cannon', 'things'], ['пшено', 'millet', 'things'], ['уметь', 'to know how', 'verbs'], ['думать', 'to think', 'verbs'],
    ['устать', 'to get tired', 'verbs'], ['пусто', 'empty', 'adj'], ['густо', 'thick, dense', 'adj'], ['утка', 'duck', 'nature'],
    ['труба', 'pipe', 'things'], ['труд', 'labour', 'work'], ['друг', 'friend', 'people'], ['круг', 'circle', 'things'],
    ['луна', 'moon', 'nature'], ['лужа', 'puddle', 'nature'], ['улей', 'beehive', 'nature'], ['уголь', 'coal', 'things'],
    ['угол', 'corner', 'home'], ['ухо', 'ear', 'people'], ['умно', 'cleverly', 'adj'], ['шутка', 'joke', 'life'],
    ['зима', 'winter', 'time'], ['зал', 'hall', 'home'], ['зонт', 'umbrella', 'things'], ['звон', 'ringing', 'things'],
    ['закон', 'law', 'life'], ['запад', 'west', 'place'], ['здесь', 'here', 'place'], ['знать', 'to know', 'verbs'],
    ['злой', 'angry', 'adj'], ['зуб', 'tooth', 'people'], ['зерно', 'grain', 'nature'], ['зелень', 'greenery', 'nature'],
    ['земля', 'earth', 'nature'], ['заря', 'dawn', 'time'], ['затея', 'venture', 'life'], ['узел', 'knot', 'things'],
    ['воз', 'cart', 'things'], ['низ', 'bottom', 'place'], ['газ', 'gas', 'things'], ['глаз', 'eye', 'people'],
    ['таз', 'basin', 'things'], ['роза', 'rose', 'nature'], ['коза', 'goat', 'nature'], ['польза', 'benefit', 'life'],
    ['казна', 'treasury', 'work'], ['май', 'May', 'time'], ['мой', 'my', 'func'], ['твой', 'your', 'func'],
    ['свой', "one's own", 'func'], ['рай', 'paradise', 'place'], ['бой', 'battle', 'life'], ['герой', 'hero', 'people'],
    ['война', 'war', 'life'], ['тайна', 'secret', 'life'], ['лейка', 'watering can', 'things'], ['лайка', 'husky', 'nature'],
    ['стойка', 'counter / stance', 'things'], ['майка', 'T-shirt', 'things'], ['зайка', 'bunny', 'nature'], ['найти', 'to find', 'verbs'],
    ['дойти', 'to reach', 'verbs'], ['пойти', 'to go', 'verbs'], ['стой', 'stop!', 'verbs'], ['дай', 'give!', 'verbs'],
    ['знание', 'knowledge', 'life'], ['здание', 'building', 'place'], ['сказать', 'to say', 'verbs'], ['заказ', 'order', 'work'],
    ['завод', 'factory', 'work'], ['задание', 'task', 'work'], ['музей', 'museum', 'place'], ['зайти', 'to drop in', 'verbs'],
    ['синий', 'blue', 'adj'], ['добрый', 'kind', 'adj'], ['новый', 'new', 'adj'], ['старый', 'old', 'adj'],
    ['зеленый', 'green', 'adj'], ['большой', 'big', 'adj'], ['малый', 'small', 'adj'], ['белый', 'white', 'adj'],
    // --- the tail (ч ю · ф ж · ц щ · э х ё ъ), for T4–T5 pools ---
    ['час', 'hour', 'time'], ['часть', 'part', 'things'], ['чай', 'tea', 'things'], ['чашка', 'cup', 'things'],
    ['чудо', 'miracle', 'life'], ['чуть', 'a little', 'func'], ['чистый', 'clean', 'adj'], ['учить', 'to teach / learn', 'verbs'],
    ['читать', 'to read', 'verbs'], ['ночь', 'night', 'time'], ['печь', 'stove', 'home'], ['речь', 'speech', 'life'],
    ['дочь', 'daughter', 'people'], ['мяч', 'ball', 'things'], ['луч', 'ray', 'nature'], ['ключ', 'key', 'things'],
    ['врач', 'doctor', 'work'], ['туча', 'storm cloud', 'nature'], ['куча', 'heap', 'things'], ['удача', 'luck', 'life'],
    ['задача', 'task, problem', 'work'], ['ручей', 'brook', 'nature'], ['юг', 'south', 'place'], ['юла', 'spinning top', 'things'],
    ['юность', 'youth', 'time'], ['люди', 'people', 'people'], ['любить', 'to love', 'verbs'], ['любой', 'any', 'func'],
    ['плюс', 'plus', 'things'], ['клюв', 'beak', 'nature'], ['уют', 'cosiness', 'home'], ['союз', 'union', 'life'],
    ['почему', 'why', 'func'], ['очень', 'very', 'func'], ['человек', 'person', 'people'], ['учитель', 'teacher', 'work'],
    ['ученик', 'pupil', 'people'], ['вечер', 'evening', 'time'], ['плечо', 'shoulder', 'people'], ['число', 'number', 'things'],
    ['факт', 'fact', 'life'], ['фон', 'background', 'things'], ['фара', 'headlight', 'things'], ['фото', 'photo', 'things'],
    ['флаг', 'flag', 'things'], ['флот', 'fleet', 'things'], ['фрукт', 'fruit', 'things'], ['шкаф', 'wardrobe', 'home'],
    ['шарф', 'scarf', 'things'], ['кофе', 'coffee', 'things'], ['жук', 'beetle', 'nature'], ['жаба', 'toad', 'nature'],
    ['жара', 'heat', 'nature'], ['жест', 'gesture', 'life'], ['жизнь', 'life', 'life'], ['ждать', 'to wait', 'verbs'],
    ['жена', 'wife', 'people'], ['желать', 'to wish', 'verbs'], ['железо', 'iron', 'things'], ['уже', 'already', 'func'],
    ['тоже', 'also', 'func'], ['даже', 'even', 'func'], ['ножи', 'knives', 'things'], ['ужин', 'supper', 'home'],
    ['нужно', 'necessary', 'func'], ['можно', 'allowed', 'func'], ['дождь', 'rain', 'nature'], ['каждый', 'every', 'func'],
    ['цель', 'goal', 'life'], ['цена', 'price', 'work'], ['цепь', 'chain', 'things'], ['цирк', 'circus', 'life'],
    ['царь', 'tsar', 'people'], ['цвет', 'colour', 'things'], ['цветы', 'flowers', 'nature'], ['отец', 'father', 'people'],
    ['конец', 'end', 'time'], ['певец', 'singer', 'work'], ['улица', 'street', 'place'], ['птица', 'bird', 'nature'],
    ['лицо', 'face', 'people'], ['кольцо', 'ring', 'things'], ['сердце', 'heart', 'people'], ['солнце', 'sun', 'nature'],
    ['щи', 'cabbage soup', 'things'], ['щель', 'crack', 'things'], ['щука', 'pike', 'nature'], ['щит', 'shield', 'things'],
    ['щека', 'cheek', 'people'], ['роща', 'grove', 'nature'], ['пища', 'food', 'things'], ['плащ', 'cloak', 'things'],
    ['вещь', 'thing', 'things'], ['овощ', 'vegetable', 'things'], ['борщ', 'borscht', 'things'], ['еще', 'still, more', 'func'],
    ['это', 'this', 'func'], ['этот', 'this one', 'func'], ['эта', 'this (f.)', 'func'], ['эти', 'these', 'func'],
    ['эхо', 'echo', 'nature'], ['эра', 'era', 'time'], ['этаж', 'floor, storey', 'home'], ['поэт', 'poet', 'people'],
    ['экран', 'screen', 'things'], ['хлеб', 'bread', 'things'], ['холод', 'cold', 'nature'], ['ход', 'move, course', 'life'],
    ['хор', 'choir', 'life'], ['хвост', 'tail', 'nature'], ['уха', 'fish soup', 'things'], ['муха', 'fly', 'nature'],
    ['сухо', 'dry', 'adj'], ['тихо', 'quiet', 'adj'], ['плохо', 'bad', 'adj'], ['хорошо', 'good, well', 'adj'],
    ['верх', 'top', 'place'], ['мех', 'fur', 'things'], ['смех', 'laughter', 'life'], ['страх', 'fear', 'life'],
    ['ёж', 'hedgehog', 'nature'], ['ёлка', 'fir tree', 'nature'], ['всё', 'everything', 'func'], ['её', 'her', 'func'],
    ['своё', "one's own (n.)", 'func'], ['моё', 'my (n.)', 'func'], ['живёт', 'lives', 'verbs'], ['идёт', 'goes', 'verbs'],
    ['поёт', 'sings', 'verbs'], ['объём', 'volume', 'things'], ['объект', 'object', 'things'], ['съезд', 'congress', 'life'],
    ['подъезд', 'entrance (building)', 'home'], ['въезд', 'entry (vehicle)', 'place'], ['объявление', 'announcement', 'work'],
  ];

  // ---- phrases: the Assembler's grammar (collocations and short lines, no
  // marks) and sentences: the Fastener's (with the marks they carry). Both
  // are [text, gloss]; a text fits a lesson when every letter — and every
  // mark — is unlocked, so the lists are written across the ladder: the
  // earliest ones use only а о е н и т в л п р с б ы д к г, later ones add
  // м ь · я · у ш · й з · ч ю · ? ! - · ф ж · ц щ · э х ё ъ · : ; " ( ).
  const PHRASES = [
    ['он не один', 'he is not alone'], ['вот и все', "that's all"], ['так и так', 'one way or another'], ['нет воды', 'no water'],
    ['один в поле', 'alone in the field'], ['вода и лед', 'water and ice'], ['она не одна', 'she is not alone'], ['никто не видел', 'nobody saw'],
    ['они пели', 'they sang'], ['дети спали', 'the children slept'], ['вот так дела', "so that's how it is"], ['он не пил', "he didn't drink"],
    ['тот берег', 'that shore'], ['кот и пес', 'cat and dog'], ['два окна', 'two windows'], ['три кита', 'three whales'],
    ['сила воли', 'willpower'], ['все на свете', 'everything in the world'], ['лес и поле', 'forest and field'], ['свет в окне', 'light in the window'],
    ['дни и недели', 'days and weeks'], ['он вел нас', 'he led us'], ['так надо', "that's how it must be"], ['вот ответ', "here's the answer"],
    ['да и нет', 'yes and no'], ['нет ответа', 'no answer'], ['он не спал', "he didn't sleep"], ['вода в реке', 'water in the river'],
    ['сад и лес', 'garden and forest'], ['ответ был прост', 'the answer was simple'], ['лед на реке', 'ice on the river'], ['кто он', 'who is he'],
    ['кто ты', 'who are you'], ['ты не он', 'you are not him'], ['ты один', 'you are alone'], ['ты прав', "you're right"],
    ['ты готов', "you're ready"], ['кто они', 'who are they'], ['он и она', 'he and she'], ['не все', 'not all'],
    ['они были', 'they were'], ['ты была', 'you were (f.)'], ['вот и он', 'here he is'], ['весна и лето', 'spring and summer'],
    ['на поле', 'in the field'], ['новое дело', 'new business'], ['доброе дело', 'a good deed'], ['старое окно', 'an old window'],
    ['сто лет', 'a hundred years'], ['пес бегал', 'the dog ran'], ['кот спал', 'the cat slept'], ['он видел все', 'he saw everything'],
    ['она не видела', "she didn't see"], ['они не против', "they don't mind"], ['нет сил', 'no strength'], ['вот беда', 'what a pity'],
    ['такие дела', "that's how things are"], ['дело в нас', "it's about us"], ['все готово', 'all ready'], ['его нет', "he's not here"],
    ['ее нет', "she's not here"], ['нет никого', "nobody's here"], ['он не готов', "he's not ready"], ['оно и видно', "that's obvious"],
    ['ни то ни се', 'neither this nor that'], ['вне игры', 'out of the game'], ['долго ли', 'will it be long'], ['вот и нет', "no it isn't"],
    ['и так далее', 'and so on'], ['не то слово', 'you said it'], ['своего рода', 'of a kind'], ['как дела', 'how are things'],
    ['все как надо', 'everything as it should be'], ['не беда', 'no matter'], ['кто там', "who's there"], ['он дома', "he's at home"],
    ['тем более', 'all the more'], ['мы были там', 'we were there'], ['мы не одни', "we're not alone"], ['мало ли', 'who knows'],
    ['есть ли', 'is there'], ['так и есть', 'so it is'], ['мне не до того', "I can't be bothered"], ['он мог бы', 'he could'],
    ['на том свете', 'in the next world'], ['все было так', 'it was all like that'], ['нет слов', 'no words'], ['мал да дорог', 'small but precious'],
    ['темно в доме', 'dark in the house'], ['мы все видели', 'we saw everything'], ['мы ели', 'we ate'], ['день и год', 'day and year'],
    ['один момент', 'one moment'], ['все имена', 'all the names'], ['мне пора', 'I must go'], ['мне не до сна', "I can't sleep"],
    ['он был дома', 'he was at home'], ['семь лет', 'seven years'], ['восемь лет', 'eight years'], ['мы вместе', "we're together"],
    ['там и тогда', 'there and then'], ['мы идем', "we're going"], ['мы сидели', 'we sat'], ['много лет', 'many years'],
    ['вот его дом', "here's his house"], ['он сел', 'he sat down'], ['все в порядке', 'all is well'], ['время идет', 'time goes on'],
    ['моя семья', 'my family'], ['твоя сестра', 'your sister'], ['я не спал', "I didn't sleep"], ['я был там', 'I was there'],
    ['меня нет дома', "I'm not home"], ['я и ты', 'you and me'], ['моя вина', 'my fault'], ['новая идея', 'a new idea'],
    ['все время', 'all the time'], ['имя и дело', 'name and deed'], ['я не против', "I don't mind"], ['я вас понял', 'I understood you'],
    ['я сам видел', 'I saw it myself'], ['вся семья дома', 'the whole family is home'], ['я пел', 'I sang'], ['моя книга', 'my book'],
    ['ясно и понятно', 'clear and plain'], ['пять лет', 'five years'], ['девять лет', 'nine years'], ['вся правда', 'the whole truth'],
    ['я не виновата', "it's not my fault (f.)"], ['мы с ним', 'me and him'], ['наша семья', 'our family'], ['ваша книга', 'your book'],
    ['наш дом', 'our house'], ['я пишу письмо', "I'm writing a letter"], ['душа и тело', 'soul and body'], ['утро и день', 'morning and day'],
    ['я буду там', "I'll be there"], ['мы будем вместе', "we'll be together"], ['ты будешь дома', "you'll be home"], ['куда ты идешь', 'where are you going'],
    ['как ты', 'how are you'], ['мне надо время', 'I need time'], ['слушал тебя', 'listened to you'], ['наш путь', 'our way'],
    ['шум и тишина', 'noise and silence'], ['на берегу', 'on the shore'], ['тут и там', 'here and there'], ['в саду', 'in the garden'],
    ['суп и каша', 'soup and porridge'], ['у меня есть', 'I have'], ['у нас нет', "we don't have"], ['я тебя видел', 'I saw you'],
    ['все понятно', 'all clear'], ['я не знаю', "I don't know"], ['мой дом', 'my house'], ['твой брат', 'your brother'],
    ['добрый день', 'good day'], ['новый год', 'new year'], ['я знаю его', 'I know him'], ['зима и лето', 'winter and summer'],
    ['мой друг', 'my friend'], ['злой пес', 'an angry dog'], ['давай пойдем', "let's go"], ['иди домой', 'go home'],
    ['сколько стоит', 'how much is it'], ['стой здесь', 'stand here'], ['большой дом', 'a big house'], ['синий свет', 'blue light'],
    ['я здесь', "I'm here"], ['он там', "he's there"], ['мы здесь', "we're here"], ['я люблю тебя', 'I love you'],
    ['добрый вечер', 'good evening'], ['что ты видишь', 'what do you see'], ['чай и сыр', 'tea and cheese'], ['ключ от дома', 'key to the house'],
    ['почему нет', 'why not'], ['чуть свет', 'at dawn'], ['очень мило', 'very nice'], ['я читаю книгу', "I'm reading a book"],
    ['конечно', 'of course'], ['до встречи', 'see you'], ['ночь и день', 'night and day'], ['учу язык', "I'm learning a language"],
    ['я живу здесь', 'I live here'], ['можно ли', 'may I'], ['нужно время', 'time is needed'], ['тоже можно', 'also possible'],
    ['каждый день', 'every day'], ['уже поздно', "it's late already"], ['кофе и чай', 'coffee and tea'], ['фильм и книга', 'a film and a book'],
    ['цель ясна', 'the goal is clear'], ['в центре города', 'in the city centre'], ['еще раз', 'once more'], ['щи и каша', 'cabbage soup and porridge'],
    ['это хорошо', "that's good"], ['эхо в горах', 'echo in the mountains'], ['всё своё', "all one's own"], ['объём работы', 'the amount of work'],
    ['хлеб и соль', 'bread and salt'], ['это мой дом', 'this is my house'],
  ];

  const SENTENCES = [
    // period only — the Fastener's first lessons, before the comma
    ['я был дома.', 'I was at home.'], ['она видела меня.', 'She saw me.'], ['мы пели весь день.', 'We sang all day.'], ['он не готов.', "He's not ready."],
    ['я готов.', "I'm ready."], ['они дома.', "They're at home."], ['мне пора спать.', 'I must go to sleep.'], ['дело было не в том.', "That wasn't the point."],
    ['вот моя семья.', "Here's my family."], ['все не так.', "Everything's wrong."], ['мы видели море.', 'We saw the sea.'], ['я не видел моря.', "I haven't seen the sea."],
    ['она была одна.', 'She was alone.'], ['он сидел и ел.', 'He sat and ate.'], ['ты не спал.', "You didn't sleep."], ['мы не ели.', "We didn't eat."],
    ['все дома.', "Everyone's home."], ['день идет.', 'The day goes on.'], ['время не идет.', "Time doesn't pass."], ['я не пел.', "I didn't sing."],
    ['ты пела.', 'You sang (f.).'], ['они не были там.', "They weren't there."], ['мы были одни.', 'We were alone.'], ['вода была темная.', 'The water was dark.'],
    ['лед был тонким.', 'The ice was thin.'], ['небо темнело.', 'The sky was darkening.'], ['он мне не брат.', "He's not my brother."], ['я тебе не враг.', "I'm not your enemy."],
    ['мы с ними.', "We're with them."], ['я с вами.', "I'm with you."], ['он один дома.', "He's home alone."], ['они пили воду.', 'They drank water.'],
    ['кот пил молоко.', 'The cat drank milk.'], ['пес ел мясо.', 'The dog ate meat.'], ['сын был рад.', 'The son was glad.'], ['мать пела.', 'Mother sang.'],
    ['дед сидел дома.', 'Grandfather sat at home.'], ['дети были дома.', 'The children were at home.'], ['мы идем к реке.', "We're going to the river."], ['все пели и ели.', 'Everyone sang and ate.'],
    ['он был дома.', 'He was at home.'], ['она не пела.', "She didn't sing."], ['мы были там.', 'We were there.'], ['все в порядке.', 'Everything is fine.'],
    ['там никого не было.', 'There was nobody there.'], ['я не видел его.', "I didn't see him."], ['дети спали.', 'The children slept.'], ['они пели песни.', 'They sang songs.'],
    ['вот и все.', "That's all."], ['он не один.', "He's not alone."], ['нет воды.', "There's no water."], ['ты прав.', "You're right."],
    ['так и есть.', 'So it is.'], ['он мог бы.', 'He could.'], ['она одна.', "She's alone."], ['вода в реке.', 'Water in the river.'],
    ['лед на реке.', 'Ice on the river.'], ['кот спал.', 'The cat slept.'], ['пес бегал.', 'The dog ran.'], ['день был долгим.', 'The day was long.'],
    ['мы ели.', 'We ate.'], ['я пел, она пела.', 'I sang, she sang.'], ['он сел, и все сели.', 'He sat down, and everyone sat down.'], ['мы сидели и пели.', 'We sat and sang.'],
    ['я вас понял.', 'I understood you.'], ['время идет.', 'Time goes on.'], ['моя семья дома.', 'My family is at home.'], ['вот его дом.', 'Here is his house.'],
    ['он не спал, и я не спал.', "He didn't sleep, and neither did I."], ['она пела, а он сидел.', 'She sang and he sat.'], ['мы вместе, и все.', "We're together, and that's it."], ['я сам все видел.', 'I saw it all myself.'],
    ['меня нет дома.', "I'm not at home."], ['я и ты.', 'You and me.'], ['да, я готов.', "Yes, I'm ready."], ['нет, он не готов.', "No, he's not ready."],
    ['да, она была там.', 'Yes, she was there.'], ['нет, мы не видели.', "No, we didn't see."], ['он вел, а мы пели.', 'He led, and we sang.'], ['все готово, пора.', "All ready, it's time."],
    ['вот он, мой брат.', 'Here he is, my brother.'], ['я пел, и они пели.', 'I sang, and they sang.'], ['так надо, и все.', "That's how it must be, period."], ['я не против, и она не против.', "I don't mind, and neither does she."],
    ['тем более, он дома.', "All the more so, he's home."], ['кто там был, я не видел.', "I didn't see who was there."], ['дело было летом.', 'It happened in summer.'], ['дело было давно.', 'It was long ago.'],
    ['он сел и ел.', 'He sat and ate.'], ['сад был стар.', 'The garden was old.'], ['вода была теплая.', 'The water was warm.'], ['небо было темным.', 'The sky was dark.'],
    ['лес был темен.', 'The forest was dark.'], ['они были вместе.', 'They were together.'], ['она не одна, она с ним.', "She's not alone, she's with him."], ['мы не одни.', "We're not alone."],
    ['он видел все, и я видел.', 'He saw everything, and so did I.'], ['она не видела, а я видел.', "She didn't see, but I did."], ['они не против.', "They don't mind."], ['нет сил, и нет времени.', 'No strength, and no time.'],
    ['вот беда.', 'What a pity.'], ['такие дела, брат.', "That's how it is, brother."], ['его нет, и ее нет.', "He's not here, and neither is she."], ['нет никого.', "There's nobody."],
    ['оно и видно.', "That's obvious."], ['ни то ни се.', 'Neither this nor that.'], ['и так далее.', 'And so on.'], ['не то слово.', 'You said it.'],
    ['все как надо.', 'All as it should be.'], ['не беда.', 'No matter.'], ['мал да дорог.', 'Small but precious.'], ['темно в доме.', "It's dark in the house."],
    ['мы все видели.', 'We all saw.'], ['один момент, и все.', "One moment, and that's it."], ['мне пора.', 'I must go.'], ['мне не до сна.', "I can't sleep."],
    ['семь лет, восемь лет.', 'Seven years, eight years.'], ['все было там и тогда.', 'It all was there and then.'], ['мы идем.', "We're going."], ['много лет и много дел.', 'Many years and many things to do.'],
    ['моя вина, не твоя.', 'My fault, not yours.'], ['новая идея.', 'A new idea.'], ['я и не видел.', "I didn't even see."], ['вся правда, и только.', 'The whole truth, and only that.'],
    ['я не виновата.', "It's not my fault (f.)."], ['мы с ним были там.', 'He and I were there.'], ['ясно и понятно.', 'Clear and plain.'], ['пять лет и девять лет.', 'Five years and nine years.'],
    ['имя есть, а дела нет.', "There's a name but no deed."], ['вот ответ, и он прост.', "Here's the answer, and it's simple."], ['нет ответа, и не было.', "No answer, and there wasn't one."], ['сто лет, не менее.', 'A hundred years, no less.'],
    ['два окна, а не три.', 'Two windows, not three.'], ['сила воли, вот и все.', "Willpower, that's all."], ['все на свете.', 'Everything in the world.'], ['свет в окне, и тень.', 'Light in the window, and a shadow.'],
    ['дни и недели, годы.', 'Days and weeks, years.'], ['он не пил и не ел.', "He didn't drink or eat."], ['тот берег далеко.', 'That shore is far.'], ['кот и пес спали.', 'The cat and dog slept.'],
    ['лес и поле, река и небо.', 'Forest and field, river and sky.'], ['да и нет, вот и весь ответ.', "Yes and no, that's the whole answer."], ['ты один, и я один.', "You're alone, and so am I."], ['ты готов, и мы готовы.', "You're ready, and we're ready."],
    ['кто он, никто не видел.', 'Nobody saw who he was.'], ['он и она, вместе.', 'He and she, together.'], ['не все, но многие.', 'Not all, but many.'], ['они были, а потом не были.', 'They were, and then were not.'],
    ['ты была там, я видел.', 'You were there, I saw.'], ['весна и лето, потом осень.', 'Spring and summer, then autumn.'], ['на поле темно.', "It's dark in the field."], ['новое дело, новая идея.', 'New business, new idea.'],
    ['доброе дело не пропадет.', "A good deed isn't lost."], ['старое окно, старая дверь.', 'Old window, old door.'], ['пес бегал, кот спал.', 'The dog ran, the cat slept.'], ['он видел все, и все видели его.', 'He saw everything, and everyone saw him.'],
    ['они не против, и мы не против.', "They don't mind, and neither do we."], ['его нет дома.', "He's not at home."], ['все готово.', 'All ready.'], ['он был там, она была дома.', 'He was there, she was at home.'],
    ['я буду там, и ты будешь.', "I'll be there, and so will you."], ['мы будем вместе.', "We'll be together."], ['куда ты идешь, туда и я.', 'Where you go, I go.'], ['я пишу письмо, и она пишет.', "I'm writing a letter, and so is she."],
    ['душа и тело, все едино.', 'Soul and body, all one.'], ['утро было теплым.', 'The morning was warm.'], ['наша семья дома.', 'Our family is at home.'], ['наш путь был долгим.', 'Our way was long.'],
    ['шум и тишина.', 'Noise and silence.'], ['суп и каша, вот и обед.', "Soup and porridge, there's lunch."], ['у меня есть время.', 'I have time.'], ['у нас нет воды.', 'We have no water.'],
    ['я тебя видел, ты меня нет.', "I saw you, you didn't see me."], ['в саду было тепло.', 'It was warm in the garden.'], ['ты будешь дома, я буду там.', "You'll be home, I'll be there."], ['мне надо время, и много.', 'I need time, and a lot of it.'],
    ['он слушал, но не слышал.', "He listened but didn't hear."], ['она ушла, и все ушли.', 'She left, and everyone left.'], ['куда все ушли, я не видел.', "I didn't see where everyone went."], ['тут и там, вода и вода.', 'Here and there, water and water.'],
    ['на берегу было пусто.', 'It was empty on the shore.'], ['я не буду, и не проси.', "I won't, and don't ask."], ['будь добр, сядь.', 'Be so kind, sit down.'], ['мы шли долго, устали.', 'We walked long, got tired.'],
    ['утром я пел, днем спал.', 'In the morning I sang, by day I slept.'], ['пусть идет, пусть.', 'Let him go, let him.'], ['я думал, ты дома.', 'I thought you were home.'], ['думать надо самому.', 'One has to think for oneself.'],
    ['луна была полная.', 'The moon was full.'], ['буду рад тебе.', "I'll be glad to see you."], ['я не знаю, где он.', "I don't know where he is."], ['мой дом, мой сад.', 'My house, my garden.'],
    ['твой брат знает.', 'Your brother knows.'], ['добрый день, друзья.', 'Good day, friends.'], ['новый год, новые дела.', 'New year, new things.'], ['я знаю его давно.', "I've known him a long time."],
    ['зима была долгой.', 'The winter was long.'], ['мой друг здесь, рядом.', 'My friend is here, nearby.'], ['злой пес не спит.', "An angry dog doesn't sleep."], ['давай пойдем домой.', "Let's go home."],
    ['иди домой, пора.', "Go home, it's time."], ['сколько стоит, я не знаю.', "I don't know how much it costs."], ['стой здесь и не беги.', "Stand here and don't run."], ['большой дом, большой сад.', 'Big house, big garden.'],
    ['синий свет, зеленый свет.', 'Blue light, green light.'], ['я здесь, мы все здесь.', "I'm here, we're all here."], ['он знал, и она знала.', 'He knew, and she knew.'], ['зимой и летом, всегда.', 'In winter and summer, always.'],
    ['пойдем вместе, друг.', "Let's go together, friend."], ['я сказал, и я сделал.', 'I said it, and I did it.'], ['не зная, не говори.', "Not knowing, don't speak."], ['знание есть сила.', 'Knowledge is power.'],
    ['я люблю тебя, ты знаешь.', 'I love you, you know.'], ['добрый вечер, друзья.', 'Good evening, friends.'], ['что ты видишь, то и я.', 'What you see, I see too.'], ['ключ от дома у меня.', 'I have the key to the house.'],
    ['почему нет, я не знаю.', "Why not, I don't know."], ['чуть свет, мы в пути.', "At dawn we're on our way."], ['очень мило, спасибо.', 'Very nice, thank you.'], ['я читаю книгу, он читает письмо.', 'I read a book, he reads a letter.'],
    ['конечно, я приду.', "Of course I'll come."], ['до встречи, до свидания.', 'See you, goodbye.'], ['ночь и день, день и ночь.', 'Night and day, day and night.'], ['учу язык, читаю, пишу.', 'I study the language, read, write.'],
    ['чай был горячим.', 'The tea was hot.'], ['лучше поздно, чем никогда.', 'Better late than never.'], ['юг и север, запад и восток.', 'South and north, west and east.'], ['человек идет, собака сидит.', 'A man walks, a dog sits.'],
    ['кто там?', "Who's there?"], ['как дела?', 'How are you?'], ['что такое?', 'What is it?'], ['ты идешь? - да, иду.', 'Are you coming? - Yes, I am.'],
    ['почему нет?', 'Why not?'], ['как тебя зовут?', "What's your name?"], ['куда ты идешь?', 'Where are you going?'], ['стой! не беги!', "Stop! Don't run!"],
    ['как красиво!', 'How beautiful!'], ['какой день!', 'What a day!'], ['кто-то стучит.', 'Someone is knocking.'], ['что-нибудь еще?', 'Anything else?'],
    ['где-то там.', 'Somewhere there.'], ['ну и ну!', 'Well, well!'], ['да или нет?', 'Yes or no?'], ['сколько лет, сколько зим!', 'Long time no see!'],
    ['что делать?', 'What is to be done?'], ['когда-нибудь, не сейчас.', 'Someday, not now.'], ['кто бы мог подумать!', 'Who would have thought!'], ['ты где? - я тут.', "Where are you? - I'm here."],
    ['я живу здесь уже год.', "I've lived here for a year."], ['можно войти?', 'May I come in?'], ['нужно время, много времени.', 'Time is needed, a lot of time.'], ['тоже можно, почему нет?', "That's possible too, why not?"],
    ['каждый день одно и то же.', 'Every day the same thing.'], ['уже поздно, иди спать.', "It's late, go to sleep."], ['кофе или чай?', 'Coffee or tea?'], ['жизнь идет, а мы живем.', 'Life goes on, and we live.'],
    ['фильм был скучным.', 'The film was boring.'], ['ждите здесь, я сейчас.', "Wait here, I'll be right back."], ['цель ясна - вперед!', 'The goal is clear - forward!'], ['в центре города шумно.', "It's noisy in the city centre."],
    ['еще раз, пожалуйста.', 'Once more, please.'], ['щи да каша - пища наша.', 'Cabbage soup and porridge are our food.'], ['птица летит на юг.', 'A bird flies south.'], ['улица была пуста.', 'The street was empty.'],
    ['это хорошо, очень хорошо.', "That's good, very good."], ['эхо в горах.', 'An echo in the mountains.'], ['всё своё ношу с собой.', 'I carry all my own with me.'], ['объём работы велик.', 'The amount of work is great.'],
    ['хлеб да соль.', 'Bread and salt.'], ['это мой дом, а это - твой.', 'This is my house, and this is yours.'], ['ещё чуть-чуть.', 'A little more.'], ['поэт читает стихи.', 'The poet reads poems.'],
    ['он сказал: "иди домой".', 'He said: "go home".'], ['вот что нужно: хлеб, соль, вода.', "Here's what's needed: bread, salt, water."], ['книга (старая) лежит на столе.', 'The book (an old one) lies on the table.'], ['"да", - сказал он.', '"Yes," he said.'],
    ['день прошёл; настала ночь.', 'The day passed; night came.'], ['я знаю одно: это не конец.', 'I know one thing: this is not the end.'],
  ];

  // ---- proper names: the Crane's capitals (first letter is the drill) ----
  const NAMES = [
    ['Анна', 'Anna'], ['Иван', 'Ivan'], ['Мария', 'Maria'], ['Пётр', 'Pyotr'],
    ['Оля', 'Olya'], ['Нина', 'Nina'], ['Вера', 'Vera'], ['Игорь', 'Igor'],
    ['Дима', 'Dima'], ['Таня', 'Tanya'], ['Лена', 'Lena'], ['Саша', 'Sasha'],
    ['Костя', 'Kostya'], ['Миша', 'Misha'], ['Боря', 'Borya'], ['Галя', 'Galya'],
    ['Зоя', 'Zoya'], ['Юра', 'Yura'], ['Федя', 'Fedya'], ['Женя', 'Zhenya'],
    ['Москва', 'Moscow'], ['Волга', 'the Volga'], ['Сибирь', 'Siberia'], ['Урал', 'the Urals'],
    ['Байкал', 'Lake Baikal'], ['Нева', 'the Neva'], ['Дон', 'the Don'], ['Амур', 'the Amur'],
    ['Россия', 'Russia'], ['Казань', 'Kazan'], ['Тула', 'Tula'], ['Омск', 'Omsk'],
    ['Томск', 'Tomsk'], ['Крым', 'Crimea'], ['Алтай', 'Altai'], ['Енисей', 'the Yenisei'],
  ];

  // ---- pages: the Manufacturer's paragraphs — THE CONTENT SLOT ----
  // Placeholders for now (2026-08-20, the user's call: any material will do;
  // flavour comes later). Write real prose, trivia, easter eggs, the machines
  // talking, a plot that turns — just keep to the course's keys: the 33
  // letters, the ten marks, capitals. No numbers, no em-dash, no «guillemets».
  // The engine grades pages itself by length and mark density and serves the
  // easy ones first; order in this list does not matter.
  const PAGES = [
    ['Утром на фронтире тихо. Оператор идёт к железному руднику, и первый слиток дня ещё холодный. Работа начинается с одной буквы.',
      'Morning on the frontier is quiet. The operator walks to the iron mine, and the first ingot of the day is still cold. The work begins with a single letter.'],
    ['Плавильня не спит. Она ест руду и отдаёт бронзу, и так весь день. Если лента пуста, она ждёт; если сумка полна, она рада.',
      'The smelter never sleeps. It eats ore and gives back bronze, all day long. If the belt is empty, it waits; if the bag is full, it is glad.'],
    ['Медь любит компанию: одна она мягкая, а с оловом твёрдая. Наши машины знают это давно. Поэтому бронза была первой.',
      'Copper loves company: alone it is soft, with tin it is hard. Our machines have long known this. That is why bronze came first.'],
    ['Кто проложил первую ленту, тот знает: путь находит себя сам. Груз идёт от машины к машине, и никто его не несёт. Это и есть автоматика.',
      'Whoever laid the first belt knows: the route finds itself. Goods go from machine to machine, and nobody carries them. That is what automation is.'],
    ['Стол мастера прост: кувалда, ключ и банка с заклёпками. Всё остальное делает пар. Но без рук пар не знает, что делать.',
      "The craftsman's table is simple: a sledgehammer, a wrench and a jar of rivets. Steam does all the rest. But without hands, steam does not know what to do."],
    ['Вопрос: что тяжелее, тонна угля или тонна кварца? Ответ старого шахтёра: тяжелее всего пустая вагонетка, потому что её толкать некому.',
      "A question: which is heavier, a ton of coal or a ton of quartz? The old miner's answer: heaviest of all is the empty cart, because there is no one to push it."],
    ['Ночью над болотом горят огни нефтяной вышки. Она качает и качает, и чёрное железо к утру готово. Так фронтир получает свои чернила.',
      'At night the oil derrick lights burn over the bog. It pumps and pumps, and by morning the black iron is ready. That is how the frontier gets its ink.'],
    ['Говорят, что кран однажды поднял сам себя. Это, конечно, шутка; но с тех пор его табличка гласит: "Не проверять!"',
      'They say the crane once lifted itself. That is a joke, of course; but ever since, its plaque has read: "Do not test!"'],
    ['Первая мануфактура стояла у реки. Вода крутила колесо, колесо крутило вал, вал крутил всё остальное. Теперь всё крутит печать: буква за буквой, страница за страницей.',
      'The first manufactory stood by the river. Water turned the wheel, the wheel turned the shaft, the shaft turned everything else. Now typing turns it all: letter by letter, page by page.'],
    ['Экзамен на фронтире один: собери машину, запусти её и уйди спать. Если утром она работает, ты мастер. Если нет, ты ученик; это тоже хорошо.',
      'The frontier has one exam: assemble the machine, start it, and go to bed. If it is running in the morning, you are a master. If not, you are an apprentice; that is also fine.'],
    ['Что такое завод? Это буквы, ставшие делом. Каждая машина здесь помнит руку, которая её собрала, и каждая лента знает свой путь. Стучи ровно, и фронтир ответит.',
      'What is a factory? Letters become deeds. Every machine here remembers the hand that assembled it, and every belt knows its way. Type steadily, and the frontier will answer.'],
    ['Смена кончается, когда гаснет горн. Оператор вешает катушку на гвоздь, смотрит на карту и считает: три рудника, две плавильни, один пресс. Завтра будет больше.',
      'The shift ends when the forge goes dark. The operator hangs the spool on a nail, looks at the map and counts: three mines, two smelters, one press. Tomorrow there will be more.'],
    ['Осторожно: у сороконожки спросили, с какой ноги она ходит, и она разучилась ходить. Не думай о пальцах; думай о слове. Пальцы сами знают дорогу.',
      'Careful: they asked the centipede which foot it starts with, and it forgot how to walk. Do not think about your fingers; think about the word. The fingers know the way themselves.'],
    ['Инженер пишет: "Система проста (почти). Вход: руда; выход: страницы. Всё, что между ними, называется игрой; всё, что после, называется навыком."',
      'The engineer writes: "The system is simple (almost). Input: ore; output: pages. Everything in between is called a game; everything after is called a skill."'],
  ];

  // Deduplicate (keep first gloss).
  const seen = new Set();
  const WORD_LIST = WORDS.filter(([w]) => (seen.has(w) ? false : (seen.add(w), true)));

  window.LANG_RU = {
    LETTER_FREQ, PAIRS, UNLOCK_ORDER, LEGACY_ORDER, SEED_COUNT, ORE_OF, VOWELS, SEMIS, PUNCT, RARE_LETTERS, TOP_BIGRAMS,
    SYLLABLES, CLUSTERS, ENDINGS, PHRASES, SENTENCES, NAMES, PAGES,
    WORD_SETS, WORDS: WORD_LIST,
  };
})();
