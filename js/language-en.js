// English QWERTY course. Unlike ЙЦУКЕН, QWERTY was not laid out for its
// language's frequency: the index fingers hold one vowel between them (u),
// a e i o live on the top row and the left pinky, and the key-for-key copy
// of the Russian ladder spent its first seven rungs with 'y' for a vowel.
// So the EN course has its own ladder (2026-08-25, replacing the
// key-for-key placeholder of 2026-08-20): the same 18 slots, tiers and
// prices as RU — ore = finger, Mk = reach, no place past Mk3 — but the
// pairs are seated by English frequency. Deviations are documented here
// and in DESIGN.md (Course exceptions).
//
// The one non-obvious seating constraint (2026-08-25): copper must own the
// index TOP row (r u t y). Alloy alphabets are constants of their pins
// (chain.js), and the Smelter's book drops any alloy without a vowel —
// brass and gunmetal pin deep copper against stone and coal, and the top
// row holds the only index-finger vowels, so any other seating would drop
// the Fastener's own price goods from the book. Iron keeps the home row
// (f j — the bumps, the first pair, as in RU), and its vowel-less alloys
// (cast iron, steel) stay out of the EN book exactly as before; prices
// never ask for them (see the price-table note in chain.js).
//
// Deviations from strict mirror pairs (every key stays on its own finger):
// - the period rides Coal Mk1 with s l: sentences begin at the Fastener
//   (rung 11), and its mirror twin x would hold it to rung 17 — RU seats
//   the period at rung 10 for the same reason. So x stands alone at Coal
//   Mk3, the capstone: the rarest letter is the last one.
// - the pinky home row is a three-key sweep, a ; ' (Oil Mk1) — the
//   apostrophe opens the contractions, which wait on it.
// - the comma rides Quartz Mk3 with c, on its own key (unshifted here,
//   where ЙЦУКЕН needs Shift).
// - z stands alone at Oil Mk3 (26 letters over 15 mine rungs leave two
//   singles); the / ` [ ] caps stay untaught — '?' (Shift+/, the same
//   physical stroke as the Russian comma) is the Slash key's only course
//   glyph, as before.
// - 'I', the pronoun, waits for the Crane like every capital (user ruling
//   2026-08-25): all content before the Crane simply avoids the word.
// Global namespace: LANG_EN
(function () {
  'use strict';

  // % of running text (Norvig's counts, trimmed; marks rough)
  const LETTER_FREQ = {
    e: 12.5, t: 9.3, a: 8.0, o: 7.6, i: 7.5, n: 7.2, s: 6.5, r: 6.2, h: 5.1, l: 4.1,
    d: 3.8, c: 3.3, u: 2.7, m: 2.5, f: 2.4, p: 2.1, g: 1.9, w: 1.7, y: 1.6, b: 1.5,
    v: 1.0, k: 0.7, x: 0.2, j: 0.2, q: 0.1, z: 0.1,
    '.': 1.3, ',': 1.2, "'": 0.5, '?': 0.1, '!': 0.1, '-': 0.2, ':': 0.1, ';': 0.1, '"': 0.2, '(': 0.1, ')': 0.1,
  };

  // the ladder: same (ore, Mk, tier) slots as the RU course — prices and
  // the goods graph line up rung for rung — with EN's own pairs seated
  const PAIRS = [
    { keys: ['f', 'j'], ore: 'az', mk: 1, tier: 0 },       // F J — the bumps; iron holds the home anchors
    { keys: ['r', 'u'], ore: 'buki', mk: 1, tier: 0 },     // R U — copper is the top row; u is the first vowel
    { keys: ['b', 'n'], ore: 'stone', mk: 1, tier: 0 },    // B N — index bottom
    { keys: ['e', 'i'], ore: 'vedi', mk: 1, tier: 1 },     // E I — middle top: a fifth of English in one rung
    { keys: ['g', 'h'], ore: 'az', mk: 2, tier: 1 },       // G H — index inner home
    { keys: ['d', 'k'], ore: 'vedi', mk: 2, tier: 1 },     // D K — middle home
    { keys: ['s', 'l', '.'], ore: 'coal', mk: 1, tier: 2 },    // S L + the period on its own key (see the header note)
    { keys: ['t', 'y'], ore: 'buki', mk: 2, tier: 2 },     // T Y — index inner top: 'the' arrives
    { keys: ['v', 'm'], ore: 'stone', mk: 2, tier: 2 },    // V M — index inner bottom
    { keys: ['a', ';', "'"], ore: 'oil', mk: 1, tier: 3 },     // A ; ' — the pinky home sweep; contractions open
    { keys: ['?'], at: 'fastener', mk: 1, tier: 3 },       // Shift+/ — the same stroke as the Russian comma
    { keys: ['c', ','], ore: 'vedi', mk: 3, tier: 3 },     // C , — middle bottom, the comma unshifted
    { keys: ['q', 'p'], ore: 'oil', mk: 2, tier: 3 },      // Q P — pinky top
    { keys: ['w', 'o'], ore: 'coal', mk: 2, tier: 4 },     // W O — ring top: the last vowel
    { keys: ['!', '-'], at: 'fastener', mk: 2, tier: 4 },
    { keys: ['z'], ore: 'oil', mk: 3, tier: 4 },           // Z — pinky bottom, alone
    { keys: ['x'], ore: 'coal', mk: 3, tier: 4 },          // X — ring bottom, alone: the capstone
    { keys: [':', '"', '(', ')'], at: 'fastener', mk: 3, tier: 5 },
  ];

  // marks this course seats on mine rungs (engine.js reads this to decide
  // which punctuation is trainable — coached, weighted, shown in readiness;
  // RU's fallback is ['.', '-']): the period, comma, semicolon, apostrophe
  const MINE_MARKS = ['.', ',', ';', "'"];

  const UNLOCK_ORDER = PAIRS.flatMap((p) => p.keys);
  const LEGACY_ORDER = UNLOCK_ORDER.filter((c) => !'.,?!-:;"()\''.includes(c));
  const SEED_COUNT = 6;

  const ORE_OF = {};
  for (const p of PAIRS) if (p.ore) for (const k of p.keys) ORE_OF[k] = p.ore;

  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
  const SEMIS = new Set(['y']);
  const PUNCT = new Set(['.', ',', '?', '!', '-', ':', ';', '"', '(', ')', "'"]);
  const RARE_LETTERS = new Set(['z', 'q', 'x', 'j']);
  const TOP_BIGRAMS = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd'];

  // CV / VC pairs the smelters drill, weights 1–10; filtered by alphabet live
  const SYLLABLES = [
    ['th', 10], ['he', 10], ['in', 9], ['er', 9], ['an', 8], ['re', 8], ['on', 7], ['at', 7],
    ['en', 7], ['nd', 6], ['ti', 6], ['es', 6], ['or', 6], ['te', 6], ['of', 5], ['ed', 5],
    ['is', 5], ['it', 5], ['al', 5], ['ar', 5], ['st', 5], ['to', 5], ['nt', 5], ['ng', 5],
    ['se', 4], ['ha', 4], ['as', 4], ['ou', 4], ['io', 4], ['le', 4], ['ve', 4], ['co', 4],
    ['me', 4], ['de', 4], ['hi', 4], ['ri', 3], ['ro', 3], ['ic', 3], ['ne', 3], ['ea', 3],
    ['ra', 3], ['ce', 3], ['li', 3], ['ch', 3], ['ll', 3], ['be', 3], ['ma', 3], ['si', 3],
    ['om', 3], ['ur', 3], ['ca', 2], ['el', 2], ['ta', 2], ['la', 2], ['ns', 2], ['di', 2],
    ['fo', 2], ['ho', 2], ['pe', 2], ['ec', 2], ['pr', 2], ['no', 2], ['ct', 2], ['us', 2],
    ['ac', 2], ['ot', 2], ['il', 2], ['tr', 2], ['ly', 2], ['nc', 2], ['et', 2], ['ut', 2],
    ['ss', 2], ['so', 2], ['rs', 2], ['un', 2], ['lo', 2], ['wa', 2], ['ge', 2], ['ie', 2],
    ['wh', 2], ['ee', 2], ['wi', 2], ['em', 2], ['ad', 2], ['ol', 2], ['rt', 2], ['po', 2],
    ['we', 2], ['na', 2], ['ul', 1], ['ni', 1], ['ts', 1], ['mo', 1], ['ow', 1], ['pa', 1],
    ['im', 1], ['mi', 1], ['ai', 1], ['sh', 1], ['ir', 1], ['su', 1], ['id', 1], ['os', 1],
    ['iv', 1], ['ia', 1], ['am', 1], ['fi', 1], ['ci', 1], ['vi', 1], ['pl', 1], ['ig', 1],
    ['tu', 1], ['ev', 1], ['ld', 1], ['ry', 1], ['mp', 1], ['fe', 1], ['bl', 1], ['ab', 1],
    ['gh', 1], ['ty', 1], ['op', 1], ['wo', 1], ['sa', 1], ['ay', 1], ['ex', 1], ['ke', 1],
    ['ui', 1], ['pt', 1], ['do', 1], ['gu', 1], ['bu', 1], ['ju', 1], ['fu', 1], ['ky', 1],
    // the deep-ore pass (2026-08-22): real bigrams for the pinned alloys'
    // thin sets — ck/dy/cy for the quartz keys, gy/hy/fy for the iron pair,
    // by/my/nu/ub for the copper-stone brass set
    ['ck', 3], ['dy', 2], ['cy', 1], ['gy', 1], ['hy', 1], ['fy', 1],
    ['by', 2], ['my', 2], ['nu', 1], ['ub', 1], ['um', 2], ['ud', 1],
    ['yr', 1], ['rn', 2], ['rb', 1], ['lt', 1], ['aw', 1],
    // the 2026-08-25 ladder pass: the new T0 (f j r u b n) and the e/i rung
    ['ru', 2], ['ei', 1], ['ib', 1], ['ls', 1], ['ny', 1],
  ];

  const CLUSTERS = [
    'st', 'nd', 'ng', 'th', 'ch', 'sh', 'tr', 'br', 'dr', 'fr', 'gr', 'cr',
    'pl', 'cl', 'fl', 'sl', 'bl', 'gl', 'sp', 'sc', 'sk', 'sm', 'sn', 'sw',
    'tw', 'nt', 'rt', 'lt', 'ct', 'pt', 'mp', 'lk', 'rk', 'ft', 'ld', 'rd',
    'str', 'spr', 'scr', 'thr', 'shr', 'spl', 'wr', 'qu', 'squ', 'nk',
  ];

  // ending families: the Molder's grammar, keyed by flux ore. Each ore's
  // letter set is unchanged by the 2026-08-25 reseating (only the depth
  // order within a finger moved), so the families stand; the engine filters
  // each by the live alphabet as ever. Oil's "-'s" is the possessive — the
  // apostrophe is oil's own key.
  const ENDINGS = {
    az:    ['-ful', '-ght', '-ing', '-igh', '-ish', '-ify'],
    buki:  ['-ty', '-tten', '-ent', '-ate', '-ture', '-tion'],
    stone: ['un-', '-ness', '-ed', '-en', 'be-', '-ent'],
    vedi:  ['-ck', '-ic', '-ical', '-ance', '-ade', '-ide'],
    coal:  ['-ly', '-less', '-ss', '-sty', '-self', '-low'],
    oil:   ['-zz', '-que', '-ap', '-ize', '-ous', "-'s"],
  };

  const WORD_SETS = ['func', 'verbs', 'people', 'time', 'nature', 'home', 'rail', 'place', 'adj', 'life', 'work', 'things'];

  // [word, gloss, set] — glosses stay empty for the native course (the gloss
  // line only shows when a gloss exists). Grouped by the ladder rung that
  // first makes the word typeable; the groups were machine-staged from the
  // pair table on 2026-08-25 — restage them if the ladder ever moves.
  const WORDS = [
    // --- T0: f j + r u (Iron and Copper Mk1) - u is the first vowel ---
    ['fur', '', 'nature'], ['ruff', '', 'things'],
    // --- T0 completes with b n (Stone Mk1): the six seed keys ---
    ['run', '', 'verbs'], ['fun', '', 'life'], ['bun', '', 'things'], ['nun', '', 'people'],
    ['rub', '', 'verbs'], ['burn', '', 'verbs'], ['urn', '', 'things'], ['buff', '', 'verbs'],
    ['nub', '', 'things'], ['burr', '', 'nature'],
    // --- pair 4 adds e i (Quartz Mk1): the language starts ---
    ['be', '', 'func'], ['free', '', 'adj'], ['if', '', 'func'], ['in', '', 'func'],
    ['nine', '', 'things'], ['fine', '', 'adj'], ['fin', '', 'nature'], ['bin', '', 'things'],
    ['fire', '', 'nature'], ['rib', '', 'people'], ['inn', '', 'place'], ['fee', '', 'things'],
    ['bee', '', 'nature'], ['fen', '', 'nature'], ['fib', '', 'life'], ['nib', '', 'things'],
    ['err', '', 'verbs'], ['ire', '', 'life'], ['rue', '', 'verbs'], ['brine', '', 'nature'],
    ['bribe', '', 'life'], ['reef', '', 'nature'], ['beef', '', 'things'], ['brief', '', 'adj'],
    ['fern', '', 'nature'], ['ruin', '', 'verbs'], ['rune', '', 'things'], ['rein', '', 'rail'],
    ['beer', '', 'things'], ['ebb', '', 'nature'], ['jib', '', 'rail'], ['fife', '', 'things'],
    ['runner', '', 'people'], ['burner', '', 'things'],
    // --- pair 5 adds g h (Iron Mk2) ---
    ['gun', '', 'things'], ['hub', '', 'place'], ['jug', '', 'things'], ['rug', '', 'home'],
    ['bug', '', 'nature'], ['hug', '', 'life'], ['huff', '', 'life'], ['rung', '', 'things'],
    ['hung', '', 'verbs'], ['he', '', 'func'], ['her', '', 'func'], ['here', '', 'place'],
    ['big', '', 'adj'], ['fig', '', 'things'], ['jig', '', 'life'], ['rig', '', 'work'],
    ['begin', '', 'verbs'], ['being', '', 'func'], ['hen', '', 'nature'], ['beg', '', 'verbs'],
    ['hire', '', 'work'], ['engine', '', 'rail'], ['hue', '', 'things'], ['grub', '', 'nature'],
    ['grin', '', 'life'], ['ring', '', 'things'], ['hinge', '', 'things'], ['fringe', '', 'things'],
    ['bring', '', 'verbs'], ['high', '', 'adj'], ['nigh', '', 'func'], ['neigh', '', 'nature'],
    ['reign', '', 'verbs'], ['gruff', '', 'adj'], ['hunger', '', 'life'], ['finger', '', 'people'],
    ['ginger', '', 'things'], ['urge', '', 'verbs'], ['figure', '', 'things'], ['herb', '', 'nature'],
    ['grief', '', 'life'], ['brig', '', 'rail'], ['huge', '', 'adj'],
    // --- pair 6 adds d k (Quartz Mk2) ---
    ['bud', '', 'nature'], ['dud', '', 'things'], ['dug', '', 'verbs'], ['dunk', '', 'verbs'],
    ['junk', '', 'things'], ['hunk', '', 'things'], ['drunk', '', 'adj'], ['drug', '', 'things'],
    ['bike', '', 'things'], ['hike', '', 'verbs'], ['dine', '', 'verbs'], ['ride', '', 'verbs'],
    ['hide', '', 'verbs'], ['bride', '', 'people'], ['kid', '', 'people'], ['bid', '', 'verbs'],
    ['did', '', 'verbs'], ['dig', '', 'verbs'], ['kin', '', 'people'], ['end', '', 'time'],
    ['bend', '', 'verbs'], ['den', '', 'nature'], ['red', '', 'adj'], ['bed', '', 'home'],
    ['fed', '', 'verbs'], ['dune', '', 'nature'], ['rude', '', 'adj'], ['dude', '', 'people'],
    ['duke', '', 'people'], ['under', '', 'func'], ['hundred', '', 'things'], ['bridge', '', 'rail'],
    ['girder', '', 'things'], ['kind', '', 'adj'], ['king', '', 'people'], ['keg', '', 'things'],
    ['bird', '', 'nature'], ['fridge', '', 'home'], ['grid', '', 'things'], ['grind', '', 'verbs'],
    ['find', '', 'verbs'], ['fund', '', 'work'], ['fend', '', 'verbs'], ['bind', '', 'verbs'],
    ['drink', '', 'verbs'], ['dried', '', 'adj'], ['deed', '', 'life'], ['deer', '', 'nature'],
    ['feed', '', 'verbs'], ['need', '', 'verbs'], ['reed', '', 'nature'], ['rid', '', 'verbs'],
    ['din', '', 'things'], ['diner', '', 'home'], ['hind', '', 'nature'], ['rind', '', 'things'],
    ['judge', '', 'people'], ['fudge', '', 'things'], ['nudge', '', 'verbs'], ['ridge', '', 'place'],
    ['edge', '', 'place'], ['hedge', '', 'nature'], ['kindred', '', 'people'], ['dirge', '', 'life'],
    ['budge', '', 'verbs'], ['drudge', '', 'work'], ['rudder', '', 'rail'], ['friend', '', 'people'],
    // --- pair 7 adds s l and the period (Coal Mk1) ---
    ['sun', '', 'nature'], ['sub', '', 'things'], ['lug', '', 'verbs'], ['hurl', '', 'verbs'],
    ['surf', '', 'nature'], ['blur', '', 'verbs'], ['slur', '', 'verbs'], ['sunk', '', 'verbs'],
    ['skunk', '', 'nature'], ['snub', '', 'verbs'], ['slug', '', 'nature'], ['snug', '', 'adj'],
    ['rush', '', 'verbs'], ['gush', '', 'verbs'], ['hush', '', 'life'], ['lush', '', 'adj'],
    ['blush', '', 'verbs'], ['brush', '', 'things'], ['flush', '', 'verbs'], ['shrug', '', 'verbs'],
    ['shrub', '', 'nature'], ['bluff', '', 'place'], ['fluff', '', 'things'], ['snuff', '', 'verbs'],
    ['dull', '', 'adj'], ['gull', '', 'nature'], ['hull', '', 'rail'], ['lull', '', 'life'],
    ['null', '', 'adj'], ['bull', '', 'nature'], ['full', '', 'adj'], ['sulk', '', 'verbs'],
    ['bulk', '', 'things'], ['hulk', '', 'things'], ['husk', '', 'nature'], ['dusk', '', 'time'],
    ['lung', '', 'people'], ['sung', '', 'verbs'], ['slung', '', 'verbs'], ['flung', '', 'verbs'],
    ['she', '', 'func'], ['see', '', 'verbs'], ['is', '', 'func'], ['his', '', 'func'],
    ['life', '', 'life'], ['like', '', 'verbs'], ['line', '', 'things'], ['side', '', 'place'],
    ['file', '', 'things'], ['slide', '', 'verbs'], ['lid', '', 'things'], ['lend', '', 'verbs'],
    ['send', '', 'verbs'], ['led', '', 'verbs'], ['leg', '', 'people'], ['less', '', 'func'],
    ['guess', '', 'verbs'], ['bless', '', 'verbs'], ['dress', '', 'things'], ['held', '', 'verbs'],
    ['self', '', 'people'], ['shelf', '', 'home'], ['use', '', 'verbs'], ['fuse', '', 'things'],
    ['rule', '', 'life'], ['blue', '', 'adj'], ['glue', '', 'things'], ['sure', '', 'adj'],
    ['lure', '', 'verbs'], ['finish', '', 'verbs'], ['build', '', 'verbs'], ['funnel', '', 'things'],
    ['sir', '', 'people'], ['user', '', 'people'], ['rise', '', 'verbs'], ['ruse', '', 'life'],
    ['nurse', '', 'people'], ['lie', '', 'verbs'], ['lied', '', 'verbs'], ['slid', '', 'verbs'],
    ['sled', '', 'rail'], ['sledge', '', 'things'], ['sling', '', 'things'], ['fling', '', 'verbs'],
    ['sing', '', 'verbs'], ['singer', '', 'people'], ['single', '', 'adj'], ['jungle', '', 'nature'],
    ['unless', '', 'func'], ['sense', '', 'life'], ['dense', '', 'adj'], ['lens', '', 'things'],
    ['else', '', 'func'], ['gel', '', 'things'], ['shed', '', 'home'], ['shine', '', 'verbs'],
    ['shrine', '', 'place'], ['sniff', '', 'verbs'], ['skin', '', 'people'], ['skill', '', 'work'],
    ['skid', '', 'verbs'], ['surfer', '', 'people'], ['shield', '', 'things'], ['field', '', 'nature'],
    ['hill', '', 'nature'], ['bell', '', 'things'], ['fell', '', 'verbs'], ['sell', '', 'verbs'],
    ['shell', '', 'nature'], ['blind', '', 'adj'], ['blend', '', 'verbs'], ['bundle', '', 'things'],
    ['kindle', '', 'verbs'], ['needle', '', 'things'], ['seed', '', 'nature'], ['ledge', '', 'place'],
    ['sludge', '', 'things'], ['silk', '', 'things'], ['girl', '', 'people'], ['hers', '', 'func'],
    ['huddle', '', 'verbs'], ['riddle', '', 'life'], ['fiddle', '', 'things'], ['kennel', '', 'home'],
    ['diesel', '', 'rail'], ['slurs', '', 'verbs'], ['lulls', '', 'verbs'],
    // --- pair 8 adds t y (Copper Mk2): 'the' and 'they' arrive ---
    ['by', '', 'func'], ['thy', '', 'func'], ['shy', '', 'adj'], ['sly', '', 'adj'],
    ['fly', '', 'verbs'], ['but', '', 'func'], ['gut', '', 'people'], ['hut', '', 'home'],
    ['nut', '', 'things'], ['rut', '', 'place'], ['tub', '', 'home'], ['tug', '', 'verbs'],
    ['gust', '', 'nature'], ['bust', '', 'verbs'], ['dust', '', 'nature'], ['just', '', 'func'],
    ['rust', '', 'things'], ['hunt', '', 'verbs'], ['runt', '', 'nature'], ['blunt', '', 'adj'],
    ['grunt', '', 'verbs'], ['stunt', '', 'life'], ['turn', '', 'verbs'], ['burst', '', 'verbs'],
    ['turf', '', 'nature'], ['hurt', '', 'verbs'], ['trunk', '', 'nature'], ['stun', '', 'verbs'],
    ['stub', '', 'things'], ['thug', '', 'people'], ['thus', '', 'func'], ['shut', '', 'verbs'],
    ['strut', '', 'verbs'], ['stuff', '', 'things'], ['tusk', '', 'nature'], ['stung', '', 'verbs'],
    ['strung', '', 'verbs'], ['dry', '', 'adj'], ['try', '', 'verbs'], ['fry', '', 'verbs'],
    ['sty', '', 'place'], ['guy', '', 'people'], ['buy', '', 'verbs'], ['truly', '', 'func'],
    ['ugly', '', 'adj'], ['dryly', '', 'adj'], ['bunt', '', 'verbs'], ['brunt', '', 'things'],
    ['burnt', '', 'adj'], ['bunny', '', 'nature'], ['runny', '', 'adj'], ['nutty', '', 'adj'],
    ['ruby', '', 'things'], ['bury', '', 'verbs'], ['the', '', 'func'], ['tree', '', 'nature'],
    ['three', '', 'things'], ['it', '', 'func'], ['there', '', 'place'], ['these', '', 'func'],
    ['tide', '', 'nature'], ['site', '', 'place'], ['bite', '', 'verbs'], ['tile', '', 'home'],
    ['this', '', 'func'], ['tin', '', 'things'], ['sit', '', 'verbs'], ['fit', '', 'adj'],
    ['hit', '', 'verbs'], ['bit', '', 'things'], ['kit', '', 'things'], ['lit', '', 'verbs'],
    ['list', '', 'things'], ['fist', '', 'people'], ['ten', '', 'things'], ['then', '', 'time'],
    ['let', '', 'verbs'], ['get', '', 'verbs'], ['set', '', 'verbs'], ['net', '', 'things'],
    ['jet', '', 'rail'], ['bet', '', 'verbs'], ['yet', '', 'func'], ['best', '', 'adj'],
    ['rest', '', 'life'], ['test', '', 'work'], ['nest', '', 'nature'], ['belt', '', 'work'],
    ['felt', '', 'verbs'], ['tube', '', 'things'], ['tune', '', 'life'], ['true', '', 'adj'],
    ['tire', '', 'things'], ['tender', '', 'adj'], ['thunder', '', 'nature'], ['tunnel', '', 'rail'],
    ['little', '', 'adj'], ['steel', '', 'things'], ['shift', '', 'work'], ['built', '', 'verbs'],
    ['sultry', '', 'adj'], ['surly', '', 'adj'], ['tryst', '', 'life'], ['truss', '', 'things'],
    ['trusty', '', 'adj'], ['unruly', '', 'adj'], ['untruly', '', 'func'], ['kidney', '', 'people'],
    ['they', '', 'func'], ['street', '', 'place'], ['sky', '', 'nature'], ['style', '', 'life'],
    ['title', '', 'things'], ['letter', '', 'things'], ['better', '', 'adj'], ['butter', '', 'things'],
    ['bitter', '', 'adj'], ['litter', '', 'things'], ['gutter', '', 'home'], ['shutter', '', 'home'],
    ['night', '', 'time'], ['right', '', 'adj'], ['light', '', 'nature'], ['sight', '', 'life'],
    ['fight', '', 'verbs'], ['tight', '', 'adj'], ['bright', '', 'adj'], ['flight', '', 'rail'],
    ['slight', '', 'adj'], ['nifty', '', 'adj'], ['fifty', '', 'things'], ['thirty', '', 'things'],
    ['turtle', '', 'nature'], ['trust', '', 'life'], ['dusty', '', 'adj'], ['gusty', '', 'adj'],
    ['lust', '', 'life'], ['gilt', '', 'adj'], ['hilt', '', 'things'], ['kilt', '', 'things'],
    ['tilt', '', 'verbs'], ['silt', '', 'nature'], ['hint', '', 'life'], ['lint', '', 'things'],
    ['tint', '', 'things'], ['flint', '', 'nature'], ['glint', '', 'nature'], ['stint', '', 'work'],
    ['sting', '', 'verbs'], ['string', '', 'things'], ['yes', '', 'func'], ['yield', '', 'verbs'],
    ['tidy', '', 'adj'], ['unity', '', 'life'], ['entity', '', 'life'], ['destiny', '', 'life'],
    ['utterly', '', 'func'], ['gently', '', 'adj'], ['lightly', '', 'adj'], ['rightly', '', 'func'],
    ['nightly', '', 'time'], ['tightly', '', 'adj'], ['duty', '', 'work'], ['deity', '', 'life'],
    ['diet', '', 'home'], ['edit', '', 'verbs'], ['tied', '', 'verbs'], ['kite', '', 'things'],
    ['suit', '', 'things'], ['shirt', '', 'things'], ['skirt', '', 'things'], ['stir', '', 'verbs'],
    ['still', '', 'func'], ['stiff', '', 'adj'], ['sturdy', '', 'adj'], ['study', '', 'verbs'],
    ['student', '', 'people'], ['jut', '', 'verbs'], ['yen', '', 'things'], ['till', '', 'func'],
    ['tell', '', 'verbs'], ['yell', '', 'verbs'], ['belly', '', 'people'], ['jelly', '', 'things'],
    ['jetty', '', 'rail'], ['kitty', '', 'nature'], ['guilty', '', 'adj'], ['unite', '', 'verbs'],
    ['united', '', 'adj'], ['untie', '', 'verbs'], ['hunter', '', 'people'], ['turbine', '', 'things'],
    ['tiny', '', 'adj'], ['dirty', '', 'adj'], ['thirsty', '', 'adj'], ['thirst', '', 'life'],
    ['sully', '', 'verbs'], ['usury', '', 'work'], ['tutu', '', 'things'], ['rusty', '', 'adj'],
    ['ninety', '', 'things'], ['eight', '', 'things'], ['eighty', '', 'things'], ['lusty', '', 'adj'],
    ['ruts', '', 'place'], ['rusts', '', 'verbs'], ['struts', '', 'verbs'], ['trusts', '', 'verbs'],
    // --- pair 9 adds v m (Stone Mk2) ---
    ['mud', '', 'nature'], ['hum', '', 'verbs'], ['sum', '', 'things'], ['gum', '', 'things'],
    ['rum', '', 'things'], ['mug', '', 'things'], ['smug', '', 'adj'], ['drum', '', 'things'],
    ['strum', '', 'verbs'], ['slum', '', 'place'], ['glum', '', 'adj'], ['mum', '', 'people'],
    ['musk', '', 'nature'], ['murky', '', 'adj'], ['myth', '', 'life'], ['gym', '', 'place'],
    ['hymn', '', 'life'], ['must', '', 'func'], ['muddy', '', 'adj'], ['mutt', '', 'nature'],
    ['my', '', 'func'], ['numb', '', 'adj'], ['tummy', '', 'people'], ['yummy', '', 'adj'],
    ['murmur', '', 'verbs'], ['muggy', '', 'adj'], ['mushy', '', 'adj'], ['me', '', 'func'],
    ['him', '', 'func'], ['time', '', 'time'], ['mine', '', 'work'], ['vine', '', 'nature'],
    ['mile', '', 'things'], ['smile', '', 'life'], ['drive', '', 'verbs'], ['live', '', 'verbs'],
    ['give', '', 'verbs'], ['dive', '', 'verbs'], ['five', '', 'things'], ['mist', '', 'nature'],
    ['mend', '', 'verbs'], ['men', '', 'people'], ['met', '', 'verbs'], ['mess', '', 'things'],
    ['vest', '', 'things'], ['melt', '', 'verbs'], ['mule', '', 'nature'], ['middle', '', 'place'],
    ['smith', '', 'work'], ['rivet', '', 'things'], ['smelter', '', 'work'], ['ember', '', 'nature'],
    ['grime', '', 'nature'], ['mild', '', 'adj'], ['milk', '', 'things'], ['film', '', 'things'],
    ['firm', '', 'work'], ['term', '', 'time'], ['germ', '', 'life'], ['grim', '', 'adj'],
    ['timer', '', 'things'], ['lime', '', 'nature'], ['slime', '', 'nature'], ['seven', '', 'things'],
    ['never', '', 'func'], ['ever', '', 'func'], ['every', '', 'func'], ['very', '', 'func'],
    ['given', '', 'verbs'], ['lively', '', 'adj'], ['hive', '', 'nature'], ['driver', '', 'people'],
    ['river', '', 'nature'], ['level', '', 'things'], ['event', '', 'time'], ['evening', '', 'time'],
    ['velvet', '', 'things'], ['vivid', '', 'adj'], ['invent', '', 'verbs'], ['mind', '', 'people'],
    ['might', '', 'func'], ['mighty', '', 'adj'], ['them', '', 'func'], ['member', '', 'people'],
    ['number', '', 'things'], ['lumber', '', 'things'], ['timber', '', 'things'], ['limb', '', 'people'],
    ['thumb', '', 'people'], ['tumble', '', 'verbs'], ['humble', '', 'adj'], ['mumble', '', 'verbs'],
    ['jumble', '', 'things'], ['nimble', '', 'adj'], ['tremble', '', 'verbs'], ['misty', '', 'adj'],
    ['musty', '', 'adj'], ['dim', '', 'adj'], ['dimly', '', 'adj'], ['rim', '', 'things'],
    ['brim', '', 'things'], ['trim', '', 'verbs'], ['slim', '', 'adj'], ['skim', '', 'verbs'],
    ['vim', '', 'life'], ['hem', '', 'things'], ['gem', '', 'things'], ['stem', '', 'nature'],
    ['item', '', 'things'], ['mystery', '', 'life'], ['system', '', 'things'], ['sleeve', '', 'things'],
    // --- pair 10 adds a ; ' (Oil Mk1): the a-words and the first contractions ---
    ['metal', '', 'things'], ["it's", '', 'func'], ["he's", '', 'func'], ["she's", '', 'func'],
    ["isn't", '', 'func'], ["didn't", '', 'func'], ["let's", '', 'func'], ["there's", '', 'func'],
    ['and', '', 'func'], ['an', '', 'func'], ['at', '', 'func'], ['as', '', 'func'],
    ['has', '', 'func'], ['had', '', 'func'], ['hand', '', 'people'], ['land', '', 'nature'],
    ['sand', '', 'nature'], ['band', '', 'life'], ['stand', '', 'verbs'], ['grand', '', 'adj'],
    ['than', '', 'func'], ['that', '', 'func'], ['man', '', 'people'], ['fan', '', 'things'],
    ['ran', '', 'verbs'], ['tan', '', 'adj'], ['van', '', 'rail'], ['hat', '', 'things'],
    ['bat', '', 'nature'], ['rat', '', 'nature'], ['mat', '', 'home'], ['sat', '', 'verbs'],
    ['fat', '', 'adj'], ['flat', '', 'adj'], ['bar', '', 'things'], ['far', '', 'place'],
    ['jar', '', 'things'], ['tar', '', 'things'], ['star', '', 'nature'], ['mark', '', 'things'],
    ['dark', '', 'adj'], ['bark', '', 'nature'], ['hard', '', 'adj'], ['yard', '', 'place'],
    ['art', '', 'life'], ['start', '', 'verbs'], ['smart', '', 'adj'], ['arm', '', 'people'],
    ['farm', '', 'place'], ['harm', '', 'life'], ['ask', '', 'verbs'], ['task', '', 'work'],
    ['mask', '', 'things'], ['dash', '', 'verbs'], ['flash', '', 'nature'], ['trash', '', 'things'],
    ['glass', '', 'things'], ['grass', '', 'nature'], ['brass', '', 'things'], ['mass', '', 'things'],
    ['last', '', 'adj'], ['fast', '', 'adj'], ['vast', '', 'adj'], ['blast', '', 'things'],
    ['grant', '', 'verbs'], ['salt', '', 'things'], ['halt', '', 'verbs'], ['late', '', 'time'],
    ['gate', '', 'home'], ['date', '', 'time'], ['fate', '', 'life'], ['mate', '', 'people'],
    ['rate', '', 'things'], ['slate', '', 'things'], ['skate', '', 'life'], ['state', '', 'place'],
    ['safe', '', 'adj'], ['lake', '', 'nature'], ['make', '', 'verbs'], ['take', '', 'verbs'],
    ['bake', '', 'verbs'], ['rake', '', 'things'], ['name', '', 'people'], ['game', '', 'life'],
    ['fame', '', 'life'], ['same', '', 'func'], ['tame', '', 'adj'], ['age', '', 'time'],
    ['rage', '', 'life'], ['stage', '', 'place'], ['save', '', 'verbs'], ['gave', '', 'verbs'],
    ['brave', '', 'adj'], ['grave', '', 'place'], ['main', '', 'adj'], ['rain', '', 'nature'],
    ['gain', '', 'verbs'], ['train', '', 'rail'], ['brain', '', 'people'], ['grain', '', 'nature'],
    ['again', '', 'func'], ['air', '', 'nature'], ['fair', '', 'adj'], ['hair', '', 'people'],
    ['stair', '', 'home'], ['said', '', 'verbs'], ['raid', '', 'life'], ['maid', '', 'people'],
    ['laid', '', 'verbs'], ['sail', '', 'rail'], ['fail', '', 'verbs'], ['tail', '', 'nature'],
    ['mail', '', 'things'], ['nail', '', 'things'], ['rail', '', 'rail'], ['jail', '', 'place'],
    ['trail', '', 'place'], ['snail', '', 'nature'], ['tea', '', 'things'], ['sea', '', 'nature'],
    ['eat', '', 'verbs'], ['seat', '', 'home'], ['heat', '', 'nature'], ['beat', '', 'verbs'],
    ['meat', '', 'things'], ['neat', '', 'adj'], ['team', '', 'people'], ['beam', '', 'things'],
    ['dream', '', 'life'], ['steam', '', 'rail'], ['stream', '', 'nature'], ['read', '', 'verbs'],
    ['lead', '', 'verbs'], ['head', '', 'people'], ['bread', '', 'things'], ['dead', '', 'adj'],
    ['deal', '', 'work'], ['real', '', 'adj'], ['seal', '', 'nature'], ['meal', '', 'home'],
    ['steal', '', 'verbs'], ['learn', '', 'verbs'], ['earn', '', 'work'], ['heart', '', 'people'],
    ['earth', '', 'nature'], ['heard', '', 'verbs'], ['year', '', 'time'], ['near', '', 'place'],
    ['dear', '', 'adj'], ['fear', '', 'life'], ['gear', '', 'work'], ['tear', '', 'life'],
    ['are', '', 'func'], ['idea', '', 'life'], ['aide', '', 'people'], ['anvil', '', 'things'],
    ['lantern', '', 'things'], ['shaft', '', 'place'], ['seam', '', 'nature'], ['slag', '', 'things'],
    ['gasket', '', 'things'], ['gauge', '', 'things'], ['valve', '', 'things'], ['gantry', '', 'work'],
    ['a', '', 'func'], ['all', '', 'func'], ['any', '', 'func'], ['may', '', 'func'],
    ['say', '', 'verbs'], ['day', '', 'time'], ['stay', '', 'verbs'], ['gray', '', 'adj'],
    ['ray', '', 'nature'], ['tray', '', 'home'], ['stray', '', 'adj'], ['aim', '', 'verbs'],
    ['mainly', '', 'func'], ['against', '', 'func'], ['hay', '', 'nature'], ['lay', '', 'verbs'],
    ['area', '', 'place'], ['ahead', '', 'func'], ['alive', '', 'adj'], ['alarm', '', 'things'],
    ['amber', '', 'things'], ['anthem', '', 'life'], ['have', '', 'func'], ['made', '', 'verbs'],
    ['maker', '', 'people'], ['ale', '', 'things'], ['male', '', 'people'], ['female', '', 'people'],
    ['tale', '', 'life'], ['sale', '', 'work'], ['shale', '', 'nature'], ['valley', '', 'nature'],
    ['value', '', 'work'], ['heavy', '', 'adj'], ['heavier', '', 'adj'], ['leather', '', 'things'],
    ['measure', '', 'verbs'], ['treasure', '', 'things'], ['early', '', 'time'], ['yearn', '', 'verbs'],
    ['nearly', '', 'func'], ['beard', '', 'people'], ['bear', '', 'nature'], ['yeah', '', 'func'],
    ['great', '', 'adj'], ['treat', '', 'life'], ['already', '', 'func'], ['steady', '', 'adj'],
    ['ready', '', 'adj'], ['leaf', '', 'nature'], ['deaf', '', 'adj'], ['beast', '', 'nature'],
    ['least', '', 'func'], ['feast', '', 'home'], ['east', '', 'place'], ['eastern', '', 'place'],
    ['beneath', '', 'func'], ['breath', '', 'life'], ['breathe', '', 'verbs'], ['leave', '', 'verbs'],
    ['leaves', '', 'nature'], ['heave', '', 'verbs'], ['gleam', '', 'nature'], ['attend', '', 'verbs'],
    ['attain', '', 'verbs'], ['banner', '', 'things'], ['hammer', '', 'things'], ['ladder', '', 'things'],
    ['matter', '', 'life'], ['manner', '', 'life'], ['manage', '', 'verbs'], ['damage', '', 'things'],
    ['garage', '', 'home'], ['market', '', 'place'], ['basket', '', 'things'], ['gather', '', 'verbs'],
    ['father', '', 'people'], ['rather', '', 'func'], ['signal', '', 'rail'], ['medal', '', 'things'],
    ['magma', '', 'nature'], ["that's", '', 'func'], ["here's", '', 'func'], ["ain't", '', 'func'],
    ["aren't", '', 'func'], ["hadn't", '', 'func'], ["hasn't", '', 'func'], ["haven't", '', 'func'],
    ["mustn't", '', 'func'], ["needn't", '', 'func'], ["they're", '', 'func'], ["they've", '', 'func'],
    ["they'll", '', 'func'], ["she'll", '', 'func'], ["he'll", '', 'func'], ["it'll", '', 'func'],
    ["that'll", '', 'func'],
    // --- pair 12 adds c , (Quartz Mk3) ---
    ['cyst', '', 'life'], ['cut', '', 'verbs'], ['cub', '', 'nature'], ['curl', '', 'verbs'],
    ['curb', '', 'place'], ['curd', '', 'things'], ['curt', '', 'adj'], ['club', '', 'place'],
    ['crush', '', 'verbs'], ['truck', '', 'rail'], ['stuck', '', 'adj'], ['duck', '', 'nature'],
    ['luck', '', 'life'], ['buck', '', 'nature'], ['suck', '', 'verbs'], ['tuck', '', 'verbs'],
    ['scrub', '', 'verbs'], ['cuff', '', 'things'], ['cult', '', 'life'], ['clung', '', 'verbs'],
    ['cry', '', 'verbs'], ['curtly', '', 'adj'], ['scum', '', 'things'], ['much', '', 'func'],
    ['munch', '', 'verbs'], ['brunch', '', 'home'], ['bunch', '', 'things'], ['lunch', '', 'home'],
    ['crunch', '', 'verbs'], ['hunch', '', 'life'], ['deck', '', 'rail'], ['neck', '', 'people'],
    ['check', '', 'verbs'], ['fetch', '', 'verbs'], ['sketch', '', 'things'], ['ditch', '', 'place'],
    ['itch', '', 'life'], ['rich', '', 'adj'], ['inch', '', 'things'], ['cube', '', 'things'],
    ['crude', '', 'adj'], ['clue', '', 'things'], ['cure', '', 'life'], ['nickel', '', 'things'],
    ['kick', '', 'verbs'], ['lick', '', 'verbs'], ['stick', '', 'things'], ['trick', '', 'life'],
    ['brick', '', 'things'], ['thick', '', 'adj'], ['click', '', 'verbs'], ['back', '', 'place'],
    ['black', '', 'adj'], ['track', '', 'rail'], ['crack', '', 'things'], ['stack', '', 'things'],
    ['snack', '', 'home'], ['can', '', 'func'], ['clan', '', 'people'], ['scan', '', 'verbs'],
    ['cat', '', 'nature'], ['chat', '', 'life'], ['car', '', 'rail'], ['scar', '', 'people'],
    ['card', '', 'things'], ['cart', '', 'rail'], ['chart', '', 'things'], ['charm', '', 'life'],
    ['cash', '', 'things'], ['crash', '', 'rail'], ['class', '', 'life'], ['cast', '', 'verbs'],
    ['act', '', 'verbs'], ['fact', '', 'life'], ["can't", '', 'func'], ['cake', '', 'things'],
    ['came', '', 'verbs'], ['face', '', 'people'], ['race', '', 'life'], ['lace', '', 'things'],
    ['trace', '', 'verbs'], ['grace', '', 'life'], ['cage', '', 'things'], ['cave', '', 'nature'],
    ['chain', '', 'things'], ['chair', '', 'home'], ['cream', '', 'things'], ['each', '', 'func'],
    ['teach', '', 'verbs'], ['reach', '', 'verbs'], ['beach', '', 'place'], ['clear', '', 'adj'],
    ['furnace', '', 'work'], ['machine', '', 'things'], ['crane', '', 'work'], ['dice', '', 'things'],
    ['iced', '', 'adj'], ['acid', '', 'things'], ['decade', '', 'time'], ['decide', '', 'verbs'],
    ['crucible', '', 'things'], ['crankshaft', '', 'things'], ['derrick', '', 'work'], ['victim', '', 'people'],
    ['care', '', 'life'], ['case', '', 'things'], ['catch', '', 'verbs'], ['call', '', 'verbs'],
    ['calm', '', 'adj'], ['chance', '', 'life'], ['dance', '', 'life'], ['glance', '', 'verbs'],
    ['chalk', '', 'things'], ['change', '', 'verbs'], ['charge', '', 'verbs'], ['chase', '', 'verbs'],
    ['cheat', '', 'verbs'], ['cheek', '', 'people'], ['cheer', '', 'life'], ['cheese', '', 'things'],
    ['chest', '', 'people'], ['chief', '', 'people'], ['child', '', 'people'], ['children', '', 'people'],
    ['chill', '', 'nature'], ['chin', '', 'people'], ['chime', '', 'things'], ['circle', '', 'things'],
    ['city', '', 'place'], ['claim', '', 'verbs'], ['clay', '', 'nature'], ['clean', '', 'adj'],
    ['clerk', '', 'people'], ['cliff', '', 'nature'], ['climb', '', 'verbs'], ['cling', '', 'verbs'],
    ['since', '', 'func'], ['science', '', 'life'], ['scene', '', 'place'], ['ice', '', 'nature'],
    ['mice', '', 'nature'], ['nice', '', 'adj'], ['rice', '', 'things'], ['slice', '', 'verbs'],
    ['juice', '', 'things'], ['sticky', '', 'adj'], ['lucky', '', 'adj'], ['struck', '', 'verbs'],
    ['shack', '', 'home'], ['march', '', 'verbs'], ['starch', '', 'things'], ['search', '', 'verbs'],
    ['arch', '', 'place'], ['cabin', '', 'home'], ['cable', '', 'things'], ['candle', '', 'home'],
    ['candy', '', 'things'], ['cattle', '', 'nature'], ['cellar', '', 'home'], ['certain', '', 'adj'],
    ['heck', '', 'func'], ['hitch', '', 'things'], ['kitchen', '', 'home'], ['hatch', '', 'things'],
    ['latch', '', 'things'], ['match', '', 'things'], ['batch', '', 'things'], ['scratch', '', 'verbs'],
    ['actual', '', 'adj'], ['crate', '', 'things'], ['chimney', '', 'home'], ['mechanic', '', 'people'],
    ['circuit', '', 'things'], ['cinder', '', 'nature'], ['canal', '', 'place'], ['carriage', '', 'rail'],
    // --- pair 13 adds q p (Oil Mk2) ---
    ['up', '', 'func'], ['cup', '', 'things'], ['pup', '', 'nature'], ['put', '', 'verbs'],
    ['pull', '', 'verbs'], ['push', '', 'verbs'], ['punch', '', 'verbs'], ['plus', '', 'func'],
    ['plug', '', 'things'], ['plum', '', 'things'], ['plump', '', 'adj'], ['pump', '', 'things'],
    ['jump', '', 'verbs'], ['bump', '', 'verbs'], ['dump', '', 'verbs'], ['lump', '', 'things'],
    ['stump', '', 'nature'], ['trumpet', '', 'things'], ['pen', '', 'things'], ['pet', '', 'nature'],
    ['pin', '', 'things'], ['pit', '', 'place'], ['pig', '', 'nature'], ['pie', '', 'things'],
    ['pile', '', 'things'], ['pine', '', 'nature'], ['pipe', '', 'things'], ['ripe', '', 'adj'],
    ['type', '', 'verbs'], ['keep', '', 'verbs'], ['deep', '', 'adj'], ['sheep', '', 'nature'],
    ['sleep', '', 'life'], ['steep', '', 'adj'], ['creep', '', 'verbs'], ['speed', '', 'rail'],
    ['spend', '', 'verbs'], ['spent', '', 'verbs'], ['print', '', 'work'], ['press', '', 'work'],
    ['pretty', '', 'adj'], ['plenty', '', 'func'], ['simple', '', 'adj'], ['temple', '', 'place'],
    ['triple', '', 'things'], ['purple', '', 'adj'], ['supper', '', 'home'], ['upper', '', 'adj'],
    ['pepper', '', 'things'], ['puppy', '', 'nature'], ['queen', '', 'people'], ['quit', '', 'verbs'],
    ['quite', '', 'func'], ['quiet', '', 'adj'], ['quick', '', 'adj'], ['quilt', '', 'home'],
    ['liquid', '', 'things'], ['equip', '', 'work'], ['pick', '', 'verbs'], ['pan', '', 'home'],
    ['plan', '', 'work'], ['span', '', 'things'], ['park', '', 'place'], ['part', '', 'things'],
    ['pass', '', 'verbs'], ['past', '', 'time'], ['plant', '', 'nature'], ['plate', '', 'home'],
    ['place', '', 'place'], ['pace', '', 'things'], ['space', '', 'nature'], ['page', '', 'things'],
    ['pain', '', 'life'], ['plain', '', 'nature'], ['pair', '', 'things'], ['paid', '', 'verbs'],
    ['peach', '', 'things'], ['pack', '', 'verbs'], ['peak', '', 'place'], ['pike', '', 'things'],
    ['epic', '', 'adj'], ['peace', '', 'life'], ['pulley', '', 'things'], ['spark', '', 'nature'],
    ['quench', '', 'verbs'], ['temper', '', 'verbs'], ['apprentice', '', 'people'], ['help', '', 'verbs'],
    ['apple', '', 'things'], ['happy', '', 'adj'], ['camp', '', 'place'], ['damp', '', 'adj'],
    ['lamp', '', 'home'], ['ramp', '', 'place'], ['stamp', '', 'things'], ['play', '', 'verbs'],
    ['player', '', 'people'], ['pray', '', 'verbs'], ['praise', '', 'verbs'], ['party', '', 'life'],
    ['path', '', 'place'], ['paste', '', 'things'], ['pattern', '', 'things'], ['pay', '', 'work'],
    ['pear', '', 'things'], ['pearl', '', 'things'], ['pedal', '', 'things'], ['pure', '', 'adj'],
    ['sharp', '', 'adj'], ['shape', '', 'things'], ['ship', '', 'rail'], ['skip', '', 'verbs'],
    ['slip', '', 'verbs'], ['snap', '', 'verbs'], ['clap', '', 'verbs'], ['flap', '', 'verbs'],
    ['trap', '', 'things'], ['strap', '', 'things'], ['scrap', '', 'things'], ['grip', '', 'verbs'],
    ['trip', '', 'life'], ['drip', '', 'verbs'], ['chip', '', 'things'], ['clip', '', 'things'],
    ['lip', '', 'people'], ['tip', '', 'things'], ['sip', '', 'verbs'], ['rip', '', 'verbs'],
    ['spare', '', 'adj'], ['speak', '', 'verbs'], ['spear', '', 'things'], ['special', '', 'adj'],
    ['spell', '', 'verbs'], ['spice', '', 'things'], ['spike', '', 'rail'], ['spill', '', 'verbs'],
    ['spin', '', 'verbs'], ['spine', '', 'people'], ['spit', '', 'verbs'], ['split', '', 'verbs'],
    ['spring', '', 'time'], ['sprint', '', 'verbs'], ['quest', '', 'life'], ['quill', '', 'things'],
    ['square', '', 'place'], ['squeak', '', 'verbs'], ['unique', '', 'adj'], ['antique', '', 'things'],
    ['equal', '', 'adj'], ['equally', '', 'func'], ['request', '', 'verbs'], ['require', '', 'verbs'],
    ['plaque', '', 'things'], ['quaint', '', 'adj'], ['quality', '', 'work'], ['quantity', '', 'work'],
    ['quarry', '', 'work'], ['plank', '', 'things'], ['puddle', '', 'nature'], ['paddle', '', 'things'],
    // --- pair 14 adds w o (Coal Mk2): the last vowel and everything it held back ---
    ['people', '', 'people'], ['copper', '', 'things'], ['of', '', 'func'], ['on', '', 'func'],
    ['or', '', 'func'], ['to', '', 'func'], ['do', '', 'verbs'], ['go', '', 'verbs'],
    ['no', '', 'func'], ['so', '', 'func'], ['off', '', 'func'], ['too', '', 'func'],
    ['how', '', 'func'], ['now', '', 'time'], ['cow', '', 'nature'], ['row', '', 'things'],
    ['low', '', 'adj'], ['own', '', 'verbs'], ['down', '', 'place'], ['town', '', 'place'],
    ['brown', '', 'adj'], ['crown', '', 'things'], ['word', '', 'things'], ['work', '', 'work'],
    ['world', '', 'nature'], ['would', '', 'func'], ['could', '', 'func'], ['should', '', 'func'],
    ['good', '', 'adj'], ['food', '', 'things'], ['mood', '', 'life'], ['room', '', 'home'],
    ['moon', '', 'nature'], ['soon', '', 'time'], ['book', '', 'things'], ['look', '', 'verbs'],
    ['took', '', 'verbs'], ['cook', '', 'home'], ['foot', '', 'people'], ['door', '', 'home'],
    ['floor', '', 'home'], ['more', '', 'func'], ['store', '', 'place'], ['score', '', 'things'],
    ['shore', '', 'nature'], ['north', '', 'place'], ['short', '', 'adj'], ['sport', '', 'life'],
    ['form', '', 'things'], ['storm', '', 'nature'], ['born', '', 'verbs'], ['corn', '', 'nature'],
    ['horn', '', 'things'], ['torn', '', 'verbs'], ['worn', '', 'verbs'], ['morning', '', 'time'],
    ['over', '', 'func'], ['open', '', 'verbs'], ['only', '', 'func'], ['once', '', 'time'],
    ['one', '', 'things'], ['two', '', 'things'], ['who', '', 'func'], ['why', '', 'func'],
    ['what', '', 'func'], ['when', '', 'func'], ['where', '', 'func'], ['water', '', 'nature'],
    ['woman', '', 'people'], ['women', '', 'people'], ['wood', '', 'nature'], ['wool', '', 'things'],
    ['snow', '', 'nature'], ['show', '', 'verbs'], ['slow', '', 'adj'], ['grow', '', 'verbs'],
    ['blow', '', 'verbs'], ['flow', '', 'verbs'], ['glow', '', 'nature'], ['know', '', 'verbs'],
    ['throw', '', 'verbs'], ['window', '', 'home'], ['yellow', '', 'adj'], ['follow', '', 'verbs'],
    ['hollow', '', 'adj'], ['for', '', 'func'], ['from', '', 'func'], ['not', '', 'func'],
    ['was', '', 'func'], ['you', '', 'func'], ['your', '', 'func'], ['our', '', 'func'],
    ['out', '', 'func'], ['about', '', 'func'], ['house', '', 'home'], ['mouse', '', 'nature'],
    ['mouth', '', 'people'], ['south', '', 'place'], ['sound', '', 'things'], ['found', '', 'verbs'],
    ['round', '', 'adj'], ['ground', '', 'nature'], ['pound', '', 'things'], ['count', '', 'verbs'],
    ['mount', '', 'place'], ['point', '', 'things'], ['join', '', 'verbs'], ['coin', '', 'things'],
    ['oil', '', 'things'], ['boil', '', 'verbs'], ['soil', '', 'nature'], ['coil', '', 'things'],
    ['voice', '', 'people'], ['noise', '', 'things'], ['choice', '', 'life'], ['most', '', 'func'],
    ['post', '', 'things'], ['cost', '', 'work'], ['lost', '', 'verbs'], ['host', '', 'people'],
    ['ghost', '', 'life'], ['both', '', 'func'], ['cloth', '', 'things'], ['worker', '', 'work'],
    ['workshop', '', 'work'], ['ore', '', 'work'], ['iron', '', 'things'], ['smoke', '', 'nature'],
    ['stone', '', 'nature'], ['coal', '', 'things'], ['factory', '', 'work'], ['motor', '', 'things'],
    ['power', '', 'things'], ['tower', '', 'place'], ['wagon', '', 'rail'], ['frontier', '', 'place'],
    ['operator', '', 'people'], ['worry', '', 'life'], ['sorry', '', 'adj'], ['tour', '', 'life'],
    ['sour', '', 'adj'], ['soul', '', 'people'], ['stout', '', 'adj'], ['trout', '', 'nature'],
    ['scout', '', 'people'], ['forge', '', 'work'], ['ingot', '', 'things'], ['boiler', '', 'things'],
    ['piston', '', 'things'], ['flywheel', '', 'things'], ['gearwheel', '', 'things'], ['winch', '', 'things'],
    ['foundry', '', 'work'], ['bellows', '', 'things'], ['spoil', '', 'nature'], ['soot', '', 'nature'],
    ['solder', '', 'verbs'], ['sprocket', '', 'things'], ['foreman', '', 'people'], ['rough', '', 'adj'],
    ['enough', '', 'func'], ['always', '', 'func'], ['away', '', 'func'], ['question', '', 'life'],
    ['prospect', '', 'work'], ['whose', '', 'func'], ['owner', '', 'people'], ['week', '', 'time'],
    ['weeks', '', 'time'], ['well', '', 'func'], ['went', '', 'verbs'], ['were', '', 'func'],
    ['west', '', 'place'], ['wet', '', 'adj'], ['wheel', '', 'things'], ['while', '', 'func'],
    ['white', '', 'adj'], ['wide', '', 'adj'], ['widely', '', 'func'], ['wife', '', 'people'],
    ['wild', '', 'adj'], ['will', '', 'func'], ['win', '', 'verbs'], ['wind', '', 'nature'],
    ['wine', '', 'things'], ['wing', '', 'nature'], ['winter', '', 'time'], ['wire', '', 'things'],
    ['wise', '', 'adj'], ['wish', '', 'life'], ['within', '', 'func'], ['without', '', 'func'],
    ['wonder', '', 'life'], ['wooden', '', 'adj'], ['wore', '', 'verbs'], ['worse', '', 'adj'],
    ['worst', '', 'adj'], ['worth', '', 'work'], ['old', '', 'adj'], ['older', '', 'adj'],
    ['onto', '', 'func'], ['orange', '', 'things'], ['order', '', 'work'], ['organ', '', 'things'],
    ['other', '', 'func'], ['others', '', 'func'], ['ought', '', 'func'], ['ounce', '', 'things'],
    ['ours', '', 'func'], ['outer', '', 'adj'], ['oven', '', 'home'], ['honest', '', 'adj'],
    ['hold', '', 'verbs'], ['hole', '', 'place'], ['whole', '', 'adj'], ['home', '', 'home'],
    ['hope', '', 'life'], ['horse', '', 'nature'], ['hose', '', 'things'], ['hour', '', 'time'],
    ['gold', '', 'things'], ['golden', '', 'adj'], ['bold', '', 'adj'], ['cold', '', 'adj'],
    ['fold', '', 'verbs'], ['sold', '', 'verbs'], ['told', '', 'verbs'], ['roll', '', 'verbs'],
    ['toll', '', 'things'], ['doll', '', 'things'], ['roof', '', 'home'], ['root', '', 'nature'],
    ['boot', '', 'things'], ['boots', '', 'things'], ['tool', '', 'things'], ['tools', '', 'things'],
    ['cool', '', 'adj'], ['pool', '', 'nature'], ['fool', '', 'people'], ['noon', '', 'time'],
    ['spoon', '', 'home'], ['broom', '', 'home'], ['bloom', '', 'nature'], ['boom', '', 'things'],
    ['joint', '', 'things'], ['coast', '', 'place'], ['roast', '', 'home'], ['toast', '', 'home'],
    ['boat', '', 'rail'], ['coat', '', 'things'], ['goat', '', 'nature'], ['float', '', 'verbs'],
    ['throat', '', 'people'], ['road', '', 'place'], ['load', '', 'work'], ['loads', '', 'work'],
    ['toad', '', 'nature'], ['soap', '', 'things'], ['soar', '', 'verbs'], ['coach', '', 'rail'],
    ['stove', '', 'home'], ['story', '', 'life'], ['stories', '', 'life'], ['sort', '', 'verbs'],
    ['port', '', 'place'], ['spot', '', 'place'], ['stop', '', 'verbs'], ['stops', '', 'verbs'],
    ['shot', '', 'things'], ['hot', '', 'adj'], ['lot', '', 'func'], ['lots', '', 'func'],
    ['dot', '', 'things'], ['got', '', 'verbs'], ['pot', '', 'home'], ['rot', '', 'verbs'],
    ['cot', '', 'home'], ['jot', '', 'verbs'], ["don't", '', 'func'], ["won't", '', 'func'],
    ["doesn't", '', 'func'], ["wasn't", '', 'func'], ["weren't", '', 'func'], ["wouldn't", '', 'func'],
    ["couldn't", '', 'func'], ["shouldn't", '', 'func'], ["we're", '', 'func'], ["we've", '', 'func'],
    ["we'll", '', 'func'], ["you're", '', 'func'], ["you've", '', 'func'], ["you'll", '', 'func'],
    ["what's", '', 'func'], ["who's", '', 'func'], ["where's", '', 'func'], ["o'clock", '', 'time'],
    ['crossing', '', 'rail'], ['locomotive', '', 'rail'], ['coke', '', 'things'], ['cog', '', 'things'],
    ['cogs', '', 'things'], ['conveyor', '', 'work'], ['overalls', '', 'things'], ['goggles', '', 'things'],
    ['workbench', '', 'work'], ['blowtorch', '', 'things'], ['tomorrow', '', 'time'], ['today', '', 'time'],
    ['young', '', 'adj'], ['youth', '', 'people'], ['yours', '', 'func'],
    // --- pair 16 adds z (Oil Mk3) ---
    ['buzz', '', 'nature'], ['fuzz', '', 'things'], ['fuzzy', '', 'adj'], ['muzzy', '', 'adj'],
    ['zoo', '', 'place'], ['quartz', '', 'things'], ['bronze', '', 'things'], ['dazed', '', 'adj'],
    ['nozzle', '', 'things'], ['zone', '', 'place'], ['zero', '', 'things'], ['size', '', 'things'],
    ['sizes', '', 'things'], ['prize', '', 'things'], ['seize', '', 'verbs'], ['maze', '', 'place'],
    ['gaze', '', 'verbs'], ['graze', '', 'verbs'], ['glaze', '', 'things'], ['blaze', '', 'nature'],
    ['haze', '', 'nature'], ['lazy', '', 'adj'], ['crazy', '', 'adj'], ['hazy', '', 'adj'],
    ['dizzy', '', 'adj'], ['fizz', '', 'things'], ['jazz', '', 'life'], ['dozen', '', 'things'],
    ['dozens', '', 'things'], ['puzzle', '', 'life'], ['drizzle', '', 'nature'], ['sizzle', '', 'verbs'],
    ['freeze', '', 'verbs'], ['breeze', '', 'nature'], ['sneeze', '', 'verbs'], ['squeeze', '', 'verbs'],
    ['frozen', '', 'adj'], ['zinc', '', 'things'], ['zigzag', '', 'things'], ['blizzard', '', 'nature'],
    ['buzzer', '', 'things'], ['zeal', '', 'life'], ['zest', '', 'life'],
    // --- pair 17 adds x (Coal Mk3): the capstone ---
    ['six', '', 'things'], ['fix', '', 'verbs'], ['mix', '', 'verbs'], ['next', '', 'func'],
    ['text', '', 'things'], ['exit', '', 'place'], ['sixty', '', 'things'], ['expect', '', 'verbs'],
    ['expert', '', 'people'], ['exact', '', 'adj'], ['firebox', '', 'things'], ['pickaxe', '', 'things'],
    ['toolbox', '', 'things'], ['box', '', 'things'], ['boxes', '', 'things'], ['fox', '', 'nature'],
    ['wax', '', 'things'], ['tax', '', 'work'], ['taxi', '', 'rail'], ['axe', '', 'things'],
    ['axle', '', 'rail'], ['extra', '', 'adj'], ['exactly', '', 'func'], ['export', '', 'work'],
    ['express', '', 'rail'], ['extend', '', 'verbs'], ['oxen', '', 'nature'], ['sixth', '', 'things'],
    ['index', '', 'things'], ['example', '', 'life'], ['exam', '', 'life'], ['explain', '', 'verbs'],
    ['explore', '', 'verbs'], ['oxide', '', 'things'], ['boxcar', '', 'rail'], ['sixteen', '', 'things'],
    ['mixture', '', 'things'], ['expand', '', 'verbs'], ['flax', '', 'nature'], ['flex', '', 'verbs'],
  ];

  // phrases: the Assembler's grammar (no sentence marks; contractions are
  // words, so the apostrophe may appear). Grouped by first typeable rung.
  const PHRASES = [
    // --- typeable from pair 7 ---
    ['hush hush', ''],
    // --- typeable from pair 8 ---
    ['just run', ''], ['dry run', ''], ['burnt rust', ''],
    ['it is here', ''], ['side by side', ''], ['bit by bit', ''],
    ['in the end', ''], ['the best rest', ''], ['test the line', ''],
    ['feed the fire', ''], ['run the line', ''], ['test then rest', ''],
    ['the night shift', ''], ['first light', ''], ['burn it in', ''],
    ['he did it', ''], ['the risk is his', ''], ['shift by shift', ''],
    // --- typeable from pair 9 ---
    ['let me see', ''], ['time flies', ''], ['nine lives', ''],
    ['run the mine', ''], ['mind the belt', ''], ['never give in', ''],
    ['the middle field', ''], ['seven times seven', ''],
    // --- typeable from pair 10 ---
    ['dust and rust', ''], ['fire and steel', ''], ['hand in hand', ''],
    ['the last train', ''], ['start the engine', ''], ['read and learn', ''],
    ['near and far', ''], ['year after year', ''], ['heart and hand', ''],
    ['salt and sand', ''], ['a fair deal', ''], ['rain in the hills', ''],
    ['make it last', ''], ['take a seat', ''], ['silver and steel', ''],
    ["it's all here", ''], ['day after day', ''], ['the daily grind', ''],
    ['an early start', ''], ['hammer and anvil', ''], ['heat and hammer', ''],
    ['make and mend', ''], ['read the gauge', ''], ['raise the frame', ''],
    ['a steady hand', ''], ['the last mile', ''], ['sand and shale', ''],
    ['an even trade', ''],
    // --- typeable from pair 12 ---
    ['try my luck', ''], ['hunt the duck', ''], ['such fun', ''],
    ['thick brick', ''], ['fast track', ''], ['a clear head', ''],
    ['check the chain', ''], ['a clean cut', ''], ['catch the light', ''],
    ['trace the circuit', ''],
    // --- typeable from pair 13 ---
    ['the sun is up', ''], ['keep it up', ''], ['deep sleep', ''],
    ['quite quick', ''], ['the queen is quiet', ''], ['pick it up', ''],
    ['a grand plan', ''], ['pipe and pump', ''], ['the quiet type', ''],
    ['keep the pace', ''], ['a spare part', ''], ['speed and spark', ''],
    ['the deep pit', ''], ['quite the quest', ''],
    // --- typeable from pair 14 ---
    ['a chain of parts', ''], ['one by one', ''], ['now and then', ''],
    ['out and about', ''], ['down the road', ''], ['good as gold', ''],
    ['slow but sure', ''], ['the whole world', ''], ['word for word', ''],
    ['work the room', ''], ['a good morning', ''], ['snow on the ground', ''],
    ['follow the flow', ''], ['time will tell', ''], ["that's the way", ''],
    ['ice on the track', ''], ['coal and smoke', ''], ['good to go', ''],
    ['round and round', ''], ['the long road', ''], ['out of the woods', ''],
    ['the world of work', ''], ['the whole town', ''], ['north by west', ''],
    ['the old workshop', ''], ['below the frost', ''],
    // --- typeable from pair 16 ---
    ['the frozen north', ''],
    // --- typeable from pair 17 ---
    ['fix the pipe', ''], ['the next exit', ''], ['a dozen boxes', ''],
    ['fix the axle', ''],
  ];

  // sentences: the Fastener's grammar (with their marks; capitals wait for
  // the Crane, so the texts stay lowercase like the Russian corpus)
  const SENTENCES = [
    // --- typeable from pair 7 ---
    ['he is here.', ''], ['she is fine.', ''],
    // --- typeable from pair 8 ---
    ['just run.', ''], ['it is here.', ''], ['this is the end.', ''],
    ['the line is fine.', ''], ['the tide is in.', ''], ['the fire is lit.', ''],
    ['the rule is true.', ''], ['it is just dust.', ''], ['the test is set.', ''],
    ['this is it.', ''], ['the shift begins.', ''],
    // --- typeable from pair 9 ---
    ['let me see it.', ''], ['time flies.', ''], ['it is mine.', ''],
    ['the drum is silent.', ''],
    // --- typeable from pair 10 ---
    ["it's here.", ''], ["he's fine.", ''], ['the hand is fast.', ''],
    ['start the engine.', ''], ['the last train is late.', ''], ['take a seat.', ''],
    ['the gate is shut.', ''], ['make it last.', ''], ['the earth is vast.', ''],
    ['read it again.', ''], ['learn it by heart.', ''], ["it's fine.", ''],
    ["that's it.", ''], ["let's begin.", ''], ["he isn't late.", ''],
    ["they're here.", ''], ["she'll manage it.", ''], ['the anvil rings.', ''],
    ['start the drill.', ''], ['hand it here.', ''], ["it'll last.", ''],
    ["there's time.", ''], ['the rig stands still.', ''], ['eight bells; all is fine.', ''],
    ["the belt is still; the mine isn't.", ''], ["they've seen it.", ''],
    // --- typeable from pair 11 ---
    ["isn't it fine?", ''], ['is it here?', ''], ['is it true?', ''],
    ['is he in?', ''],
    // --- typeable from pair 12 ---
    ['his side, her side.', ''], ['nine miles, then rest.', ''], ['use it, then set it here.', ''],
    ['dust, rust, and such.', ''], ['run, then rest.', ''], ["she's here, isn't she?", ''],
    ['see me, then hide.', ''], ['the track is clear.', ''], ['rain came, then heat.', ''],
    ['a hard task, a fair deal.', ''], ['the cat sat back.', ''], ["can't say yet.", ''],
    ['check the chain, then run it.', ''], ['ice came early.', ''], ['the circle is clean.', ''],
    // --- typeable from pair 13 ---
    ['the sun is up.', ''], ['keep it simple.', ''], ['pick it up, then set it here.', ''],
    ['the mine is deep.', ''], ['the plan is grand.', ''], ['the seam is deep.', ''],
    ['the pipe is set, the pump runs.', ''], ["quite quiet, isn't it?", ''], ['keep the pace, then rest.', ''],
    // --- typeable from pair 14 ---
    ['the train is fast, the cart is slow.', ''], ['what is it?', ''], ['where is he?', ''],
    ['when is the train?', ''], ['who is there?', ''], ['why not now?', ''],
    ['how far is it?', ''], ['slow down, then stop.', ''], ['the world is round.', ''],
    ['the room is warm; the door is shut.', ''], ['the day is done; the night is near.', ''], ["don't stop now.", ''],
    ["it won't budge.", ''], ["who's there?", ''], ["that's how it works.", ''],
    ["we're close now.", ''], ['the town wakes slow.', ''], ['wood smoke over the roofs.', ''],
    ['one more load, then home.', ''], ["the wheels won't turn.", ''], ['hold the door.', ''],
    ["it's an old story.", ''], ['the coal train is long.', ''], ['so far, so good.', ''],
    ['down tools; the day is done.', ''], ["you've done well.", ''], ["we'll see tomorrow.", ''],
    // --- typeable from pair 15 ---
    ['stop! the track is out!', ''], ['well done!', ''], ['what a day!', ''],
    ['hold on - the gate is shut.', ''], ['one - two - three.', ''], ['it works! it really works!', ''],
    // --- typeable from pair 16 ---
    ['the points froze.', ''], ['zero wind today.', ''],
    // --- typeable from pair 17 ---
    ['the pipe is fixed.', ''], ['six, then ten.', ''], ["what's next?", ''],
    ['the axle is fixed.', ''], ['six boxes, all full.', ''], ['the express is on time.', ''],
    // --- typeable from pair 18 ---
    ['one thing is sure: the work goes on.', ''], ['he said: "go home".', ''], ['"yes," she said.', ''],
    ['the book (an old one) is on the shelf.', ''], ['here is the list: iron, coal, stone.', ''], ['"ready," she said.', ''],
    ['note: oil the gears.', ''], ['the ledger reads: iron, coal, quartz.', ''],
  ];

  const NAMES = [
    ['Ben', ''], ['Sam', ''], ['Max', ''], ['Judy', ''], ['Ruth', ''], ['Nick', ''],
    ['Jack', ''], ['Jill', ''], ['Tom', ''], ['Tim', ''], ['Kim', ''], ['Ken', ''],
    ['Dan', ''], ['Don', ''], ['Meg', ''], ['Sue', ''], ['Roy', ''], ['Ray', ''],
    ['Lee', ''], ['Ann', ''], ['Rose', ''], ['Jane', ''], ['Mark', ''], ['Luke', ''],
    ['Grant', ''], ['York', ''], ['London', ''], ['Boston', ''], ['Denver', ''], ['Hudson', ''],
    ['Fred', ''], ['Hugh', ''], ['Frank', ''], ['Henry', ''], ['Ruby', ''], ['June', ''],
    ['Fern', ''], ['Grace', ''], ['Kate', ''], ['Claire', ''], ['Wade', ''], ['Zack', ''],
    ['Pearl', ''], ['Gus', ''], ['Hank', ''], ['Bess', ''], ['Nell', ''], ['Joe', ''],
    ['Bill', ''], ['Walt', ''], ['Quinn', ''], ['Rex', ''],
  ];

  // pages: the Manufacturer's paragraphs — THE CONTENT SLOT (the writing
  // rules match the Russian file: the course's keys only, no digits, and
  // never the pronoun 'I' — the frontier speaks in the third person)
  const PAGES = [
    ['Morning on the frontier is quiet. The operator walks to the iron mine, and the first ingot of the day is still cold. The work begins with a single letter.', ''],
    ['The smelter never sleeps. It eats ore and gives back bronze, all day long. If the belt is empty, it waits; if the bag is full, it is glad.', ''],
    ['Whoever laid the first belt knows: the route finds itself. Goods go from machine to machine, and nobody carries them. That is what automation is.', ''],
    ["The craftsman's table is simple: a hammer, a wrench and a jar of rivets. Steam does all the rest. But without hands, steam does not know what to do.", ''],
    ['A question: which is heavier, a ton of coal or a ton of quartz? The old miner says: heaviest of all is the empty cart, because there is no one to push it.', ''],
    ['At night the derrick lights burn over the bog. It pumps and pumps, and by morning the black iron is ready. That is how the frontier gets its ink.', ''],
    ['They say the crane once lifted itself. That is a joke, of course; but ever since, its plaque has read: "Do not test!"', ''],
    ['The first factory stood by the river. Water turned the wheel, the wheel turned the shaft, the shaft turned everything else. Now typing turns it all: letter by letter, page by page.', ''],
    ['The frontier has one exam: assemble the machine, start it, and go to bed. If it is running in the morning, you are a master. If not, you are an apprentice; that is also fine.', ''],
    ['Careful: they asked the centipede which foot it starts with, and it forgot how to walk. Do not think about your fingers; think about the word. The fingers know the way.', ''],
    ['The shift ends when the forge goes dark. The operator hangs the spool on a nail, looks at the map and counts: three mines, two smelters, one press. Tomorrow there will be more.', ''],
    ['The engineer writes: "The system is simple (almost). Input: ore; output: pages. Everything in between is called a game; everything after is called a skill."', ''],
    ["The apprentice asks: what makes the belt move? The foreman smiles. Steam, he says; steam and habit. The machines learned it from us, and now they don't forget.", ''],
    ['Rain on the tin roof, and the smelter glowing like a small sun. On such nights the town does not sleep badly; it sleeps well, because the work is done.', ''],
    ["There's a rule on the frontier: never lend your last rivet. And there's a second rule: lend it anyway. The rails remember who kept them running.", ''],
    ['The quarry master keeps a list of everything the hill has given: stone for the mill, quartz for the glass, and one small fossil, which he keeps in his pocket and shows to nobody.', ''],
    ['A letter home: all is well. The derrick stands, the pay is fair, the beds are warm. Send socks. Send more socks than you think a man can use.', ''],
    ['Winter came early and the water wheel froze. For six days the whole line ran by hand - every letter, every page. Nobody praised it, but nobody quit either.', ''],
    ['The night operator knows every sound: the tick of the cooling boiler, the sigh of the valves, the mice in the grain. When a new sound comes, she is out of the chair before it ends.', ''],
    ['Progress, the engineer says, is patience with a schedule. The mountain does not hurry; the rails do not wait. Somewhere between them, the town gets built.', ''],
    ["Don't oil what isn't squeaking, says the old fitter. Then he oils it anyway, because tomorrow it will squeak, and tomorrow he means to be fishing.", ''],
    ['The mapmaker draws the frontier in pencil. Rivers move, they say; roads wander. Only the rails are drawn in ink, because the rails are a promise.', ''],
  ];

  // Deduplicate (keep first entry).
  const seen = new Set();
  const WORD_LIST = WORDS.filter(([w]) => (seen.has(w) ? false : (seen.add(w), true)));

  window.LANG_EN = {
    LETTER_FREQ, PAIRS, UNLOCK_ORDER, LEGACY_ORDER, SEED_COUNT, ORE_OF, VOWELS, SEMIS, PUNCT, RARE_LETTERS, TOP_BIGRAMS,
    MINE_MARKS, SYLLABLES, CLUSTERS, ENDINGS, PHRASES, SENTENCES, NAMES, PAGES,
    WORD_SETS, WORDS: WORD_LIST,
  };
})();
