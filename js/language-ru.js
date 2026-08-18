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
  const CLUSTERS = [
    'ст', 'ск', 'сп', 'ср', 'сн', 'сл', 'св', 'см', 'сб', 'сд',
    'пр', 'пл', 'тр', 'тв', 'кр', 'кл', 'вл', 'вр', 'вс', 'вн',
    'бр', 'бл', 'гр', 'гл', 'др', 'дв', 'дн', 'зн', 'зд', 'зв',
    'нт', 'нд', 'нк', 'рт', 'рм', 'рн', 'рк', 'лк', 'лн', 'мн',
    'стр', 'вст', 'здр', 'ств', 'скр', 'спр', 'чт', 'шк', 'жд', 'щн',
  ];

  // ---- ending families: the Molder's grammar, keyed by ore (flux) ----
  const ENDINGS = {
    az:    ['по-', 'про-', '-ор', '-ар', '-ора', '-ро', '-ра', '-опа'],
    buki:  ['-ение', '-ник', '-ек', '-нк', '-ен', '-ген', '-ке', '-нег'],
    stone: ['-ть', '-ить', '-ом', '-им', '-ими', '-ит', '-ми', '-тим'],
    vedi:  ['-ств', '-ов', '-ев', '-ул', '-ль', '-сь', '-ушк', '-вш'],
    coal:  ['-ды', '-ция', '-щик', '-чик', '-ющ', '-ущ', '-ич', 'до-'],
    oil:   ['-ся', '-ый', '-ий', '-ой', '-яя', '-ёт', '-ешь', 'объ-', 'съ-'],
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
  ];

  // Deduplicate (keep first gloss).
  const seen = new Set();
  const WORD_LIST = WORDS.filter(([w]) => (seen.has(w) ? false : (seen.add(w), true)));

  window.LANG_RU = {
    LETTER_FREQ, PAIRS, UNLOCK_ORDER, LEGACY_ORDER, SEED_COUNT, ORE_OF, VOWELS, SEMIS, PUNCT, RARE_LETTERS, TOP_BIGRAMS,
    SYLLABLES, CLUSTERS, ENDINGS,
    WORD_SETS, WORDS: WORD_LIST,
  };
})();
