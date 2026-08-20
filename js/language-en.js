// English QWERTY course — A STUB. This file exists to prove invariant 5:
// chain.js and engine.js run a world from any course data without an edit.
// It is marked `stub: true`, so COURSES keeps the English course greyed out
// in the switch; dev/en.html loads it headless and asserts a T0 world works.
// The real EN course replaces the lists below and drops the stub flag.
// Global namespace: LANG_EN
(function () {
  'use strict';

  // % of running text, rough (Norvig's counts, trimmed) — enough to weight
  const LETTER_FREQ = {
    e: 12.5, t: 9.3, a: 8.0, o: 7.6, i: 7.5, n: 7.2, s: 6.5, r: 6.2, h: 5.1, l: 4.1,
    d: 3.8, c: 3.3, u: 2.7, m: 2.5, f: 2.4, p: 2.1, g: 1.9, w: 1.7, y: 1.6, b: 1.5,
    v: 1.0, k: 0.7, x: 0.2, j: 0.2, q: 0.1, z: 0.1,
    '.': 1.3, ',': 1.2, '?': 0.1, '!': 0.1,
  };

  // ore = finger, Mk = reach — the EN pair map is NOT designed yet (F/J = f j
  // is a poor first pair in English); this ladder is a placeholder that only
  // has to be structurally valid: contiguous Mks, one finger per pair.
  const PAIRS = [
    { keys: ['e', 'i'], ore: 'az', mk: 1, tier: 0 },      // D K — middle home (frequent!)
    { keys: ['t', 'n'], ore: 'buki', mk: 1, tier: 0 },    // F J neighbours via top? placeholder
    { keys: ['a', 's'], ore: 'stone', mk: 1, tier: 0 },
    { keys: ['o', 'l'], ore: 'vedi', mk: 1, tier: 1 },
    { keys: ['r', 'h'], ore: 'az', mk: 2, tier: 1 },
    { keys: ['d', 'c'], ore: 'vedi', mk: 2, tier: 1 },
    { keys: ['u', 'm'], ore: 'coal', mk: 1, tier: 2 },
    { keys: ['g', 'p'], ore: 'buki', mk: 2, tier: 2 },
    { keys: ['w', 'y'], ore: 'stone', mk: 2, tier: 2 },
    { keys: ['f', '.'], ore: 'oil', mk: 1, tier: 3 },
    { keys: [','], at: 'fastener', mk: 1, tier: 3 },
    { keys: ['b', 'v'], ore: 'vedi', mk: 3, tier: 3 },
    { keys: ['k', 'j'], ore: 'oil', mk: 2, tier: 3 },
    { keys: ['x', 'q'], ore: 'coal', mk: 2, tier: 4 },
    { keys: ['?', '!'], at: 'fastener', mk: 2, tier: 4 },
    { keys: ['z', '\''], ore: 'oil', mk: 3, tier: 4 },
  ];

  const UNLOCK_ORDER = PAIRS.flatMap((p) => p.keys);
  const LEGACY_ORDER = UNLOCK_ORDER.filter((c) => !'.,?!\''.includes(c));
  const SEED_COUNT = 6;

  const ORE_OF = {};
  for (const p of PAIRS) if (p.ore) for (const k of p.keys) ORE_OF[k] = p.ore;

  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
  const SEMIS = new Set(['y']);
  const PUNCT = new Set(['.', ',', '?', '!', '\'']);
  const RARE_LETTERS = new Set(['x', 'q', 'z', 'j']);
  const TOP_BIGRAMS = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd'];

  const SYLLABLES = [
    ['the', 10], ['in', 9], ['an', 8], ['on', 7], ['at', 7], ['it', 8], ['is', 8], ['as', 6],
    ['en', 6], ['es', 6], ['te', 5], ['ti', 5], ['se', 5], ['ne', 5], ['to', 6], ['ta', 4],
    ['st', 5], ['no', 4], ['so', 4], ['ea', 4], ['ai', 3], ['ee', 3], ['oo', 3], ['io', 3],
  ];
  const CLUSTERS = ['st', 'th', 'nt', 'nd', 'ns', 'tr', 'ct', 'ss', 'll', 'rt', 'rs', 'ts'];

  const ENDINGS = {
    az:    ['re-', '-er', '-ers', '-here'],
    buki:  ['-ent', '-ten', '-net', '-tten'],
    stone: ['-as', '-ass', '-ess', '-ists'],
    vedi:  ['-le', '-old', '-ole', '-oll'],
    coal:  ['-um', '-ism', '-ment', 'un-'],
    oil:   ['-ful', '-off', '-if', '-ify'],
  };

  const WORD_SETS = ['func', 'verbs', 'people', 'time', 'nature', 'home', 'rail', 'place', 'adj', 'life', 'work', 'things'];

  const WORDS = [
    ['it', 'it', 'func'], ['is', 'is', 'func'], ['in', 'in', 'func'], ['tie', 'tie', 'things'],
    ['site', 'site', 'place'], ['test', 'test', 'work'], ['tin', 'tin', 'things'], ['ten', 'ten', 'things'],
    ['net', 'net', 'things'], ['tent', 'tent', 'things'], ['seat', 'seat', 'home'], ['east', 'east', 'place'],
    ['as', 'as', 'func'], ['at', 'at', 'func'], ['sea', 'sea', 'nature'], ['tea', 'tea', 'things'],
    ['eat', 'eat', 'verbs'], ['ant', 'ant', 'nature'], ['sand', 'sand', 'nature'], ['stone', 'stone', 'nature'],
    ['nest', 'nest', 'nature'], ['note', 'note', 'things'], ['tone', 'tone', 'things'], ['salt', 'salt', 'things'],
    ['tall', 'tall', 'adj'], ['last', 'last', 'adj'], ['least', 'least', 'adj'], ['steel', 'steel', 'things'],
    ['rail', 'rail', 'rail'], ['train', 'train', 'rail'], ['iron', 'iron', 'things'], ['ore', 'ore', 'things'],
    ['earth', 'earth', 'nature'], ['heart', 'heart', 'people'], ['hand', 'hand', 'people'], ['hall', 'hall', 'home'],
    ['here', 'here', 'place'], ['there', 'there', 'place'], ['other', 'other', 'func'], ['their', 'their', 'func'],
    ['that', 'that', 'func'], ['this', 'this', 'func'], ['then', 'then', 'time'], ['than', 'than', 'func'],
    ['coal', 'coal', 'things'], ['cold', 'cold', 'adj'], ['old', 'old', 'adj'], ['road', 'road', 'place'],
    ['load', 'load', 'work'], ['clear', 'clear', 'adj'], ['dear', 'dear', 'adj'], ['read', 'read', 'verbs'],
    ['lead', 'lead', 'verbs'], ['deal', 'deal', 'work'], ['ideal', 'ideal', 'adj'], ['trade', 'trade', 'work'],
    ['candle', 'candle', 'things'], ['handle', 'handle', 'things'], ['machine', 'machine', 'things'], ['mine', 'mine', 'work'],
    ['men', 'men', 'people'], ['home', 'home', 'home'], ['time', 'time', 'time'], ['team', 'team', 'people'],
  ];

  const PHRASES = [
    ['it is here', 'it is here'], ['at the sea', 'at the sea'], ['in the east', 'in the east'],
    ['this and that', 'this and that'], ['a tall tale', 'a tall tale'], ['iron and steel', 'iron and steel'],
    ['the old road', 'the old road'], ['a clear deal', 'a clear deal'], ['hand in hand', 'hand in hand'],
    ['time and tide', 'time and tide'],
  ];
  const SENTENCES = [
    ['it is here.', 'It is here.'], ['the sea is cold.', 'The sea is cold.'], ['this is the east.', 'This is the east.'],
    ['the train is late.', 'The train is late.'], ['iron is old, steel is new.', 'Iron is old, steel is new.'],
    ['is it here? yes.', 'Is it here? Yes.'], ['stand still!', 'Stand still!'],
  ];
  const NAMES = [['Tess', 'Tess'], ['Nate', 'Nate'], ['Stan', 'Stan'], ['Anne', 'Anne']];
  const PAGES = [
    ['The mine wakes first. Then the smelter, then the hall; the whole road hums before noon.',
      'The mine wakes first. Then the smelter, then the hall; the whole road hums before noon.'],
  ];

  const seen = new Set();
  const WORD_LIST = WORDS.filter(([w]) => (seen.has(w) ? false : (seen.add(w), true)));

  window.LANG_EN = {
    stub: true,   // structurally valid, pedagogically unwritten — keeps the course greyed out
    LETTER_FREQ, PAIRS, UNLOCK_ORDER, LEGACY_ORDER, SEED_COUNT, ORE_OF, VOWELS, SEMIS, PUNCT, RARE_LETTERS, TOP_BIGRAMS,
    SYLLABLES, CLUSTERS, ENDINGS, PHRASES, SENTENCES, NAMES, PAGES,
    WORD_SETS, WORDS: WORD_LIST,
  };
})();
