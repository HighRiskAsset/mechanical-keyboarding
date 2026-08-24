// English QWERTY course. The ladder maps the Russian course key-for-key:
// the same physical keys arrive in the same order, so ore = finger and every
// price, tier and machine behave identically — only the glyphs differ.
//
// PINNED (2026-08-20, the user's call): key-for-key is a placeholder order.
// English's own frequency argues for a different ladder (f j is a famously
// poor first pair — no vowels; here 'y' carries the early syllables, 'u'
// arrives at pair 8, 'e' at 12, 'a' at 16, 'o' last at 17). Revisit whether
// EN deserves its own pair order once the RU course has a human playtest.
// Deliberate deviations from strict key-for-key, where the RU key holds a
// letter but the EN key holds a mark: the period joins oil Mk1 (as in RU),
// the apostrophe joins coal Mk2 (English can't spell don't without it), and
// the Fastener hands out ? · ! - · : " ( ) — '?' is Shift+Slash, the same
// physical stroke as the Russian comma. Oil stops at Mk3 (26 letters end
// sooner than 33); the ladder is 18 events to Russian's 19.
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

  // the ladder: RU pair n = the same physical keys as EN pair n
  const PAIRS = [
    { keys: ['f', 'j'], ore: 'az', mk: 1, tier: 0 },      // F J — index home
    { keys: ['t', 'y'], ore: 'buki', mk: 1, tier: 0 },    // T Y — index top
    { keys: ['b', 'n'], ore: 'stone', mk: 1, tier: 0 },   // B N — index bottom
    { keys: ['d', 'k'], ore: 'vedi', mk: 1, tier: 1 },    // D K — middle home
    { keys: ['g', 'h'], ore: 'az', mk: 2, tier: 1 },      // G H — index inner home
    { keys: ['c', ','], ore: 'vedi', mk: 2, tier: 1 },    // C , — middle bottom (the comma is unshifted here)
    { keys: ['s', 'l'], ore: 'coal', mk: 1, tier: 2 },    // S L — ring home
    { keys: ['r', 'u'], ore: 'buki', mk: 2, tier: 2 },    // R U — index inner top
    { keys: ['v', 'm'], ore: 'stone', mk: 2, tier: 2 },   // V M — index inner bottom
    { keys: ['z', '.'], ore: 'oil', mk: 1, tier: 3 },     // Z + the period — pinky bottom (deviation: '.' rides the Period key)
    { keys: ['?'], at: 'fastener', mk: 1, tier: 3 },      // Shift+/ — the same stroke as the Russian comma
    { keys: ['e', 'i'], ore: 'vedi', mk: 3, tier: 3 },    // E I — middle top
    { keys: ['q', 'p'], ore: 'oil', mk: 2, tier: 3 },     // Q P — pinky top
    { keys: ['x', "'"], ore: 'coal', mk: 2, tier: 4 },    // X + the apostrophe (deviation: ' rides the Quote key)
    { keys: ['!', '-'], at: 'fastener', mk: 2, tier: 4 },
    { keys: ['a', ';'], ore: 'oil', mk: 3, tier: 4 },     // A ; — pinky home
    { keys: ['w', 'o'], ore: 'coal', mk: 3, tier: 4 },    // W O — ring top
    { keys: [':', '"', '(', ')'], at: 'fastener', mk: 3, tier: 5 },
  ];

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
  ];

  const CLUSTERS = [
    'st', 'nd', 'ng', 'th', 'ch', 'sh', 'tr', 'br', 'dr', 'fr', 'gr', 'cr',
    'pl', 'cl', 'fl', 'sl', 'bl', 'gl', 'sp', 'sc', 'sk', 'sm', 'sn', 'sw',
    'tw', 'nt', 'rt', 'lt', 'ct', 'pt', 'mp', 'lk', 'rk', 'ft', 'ld', 'rd',
    'str', 'spr', 'scr', 'thr', 'shr', 'spl',
  ];

  // ending families: the Molder's grammar, keyed by flux ore. The engine
  // filters each family by the live alphabet, so early entries lean on the
  // letters that exist by tier 2 (no a e i o until pairs 12–17).
  const ENDINGS = {
    az:    ['-ful', '-ght', '-ing', '-igh', '-ish', '-ify'],
    buki:  ['-ty', '-tten', '-ent', '-ate', '-ture', '-tion'],
    stone: ['un-', '-ness', '-ed', '-en', 'be-', '-ent'],
    vedi:  ['-ck', '-ic', '-ical', '-ance', '-ade', '-ide'],
    coal:  ['-ly', '-less', '-ss', '-sty', '-self', '-lys'],
    oil:   ['-zz', '-que', '-ap', '-ize', '-ous', '-est'],
  };

  const WORD_SETS = ['func', 'verbs', 'people', 'time', 'nature', 'home', 'rail', 'place', 'adj', 'life', 'work', 'things'];

  // [word, gloss, set] — glosses stay empty for the native course (the gloss
  // line only shows when a gloss exists). Grouped by the ladder stage that
  // first makes them typeable; y carries the early stages as a vowel.
  const WORDS = [
    // --- pairs 1–7 (f j t y b n d k g h c s l): y is the only vowel ---
    ['by', '', 'func'], ['thy', '', 'func'], ['shy', '', 'adj'], ['sly', '', 'adj'],
    ['fly', '', 'verbs'], ['cyst', '', 'life'],
    // --- pair 8 adds r u: the u-words open the game ---
    ['run', '', 'verbs'], ['sun', '', 'nature'], ['fun', '', 'life'], ['gun', '', 'things'],
    ['bun', '', 'things'], ['nun', '', 'people'], ['cut', '', 'verbs'], ['but', '', 'func'],
    ['gut', '', 'people'], ['hut', '', 'home'], ['nut', '', 'things'], ['rut', '', 'place'],
    ['cub', '', 'nature'], ['tub', '', 'home'], ['rub', '', 'verbs'], ['hub', '', 'place'],
    ['sub', '', 'things'], ['bud', '', 'nature'], ['dud', '', 'things'], ['jug', '', 'things'],
    ['tug', '', 'verbs'], ['rug', '', 'home'], ['bug', '', 'nature'], ['dug', '', 'verbs'],
    ['hug', '', 'life'], ['lug', '', 'verbs'], ['gust', '', 'nature'], ['bust', '', 'verbs'],
    ['dust', '', 'nature'], ['just', '', 'func'], ['rust', '', 'things'], ['hunt', '', 'verbs'],
    ['runt', '', 'nature'], ['blunt', '', 'adj'], ['grunt', '', 'verbs'], ['stunt', '', 'life'],
    ['burn', '', 'verbs'], ['turn', '', 'verbs'], ['curl', '', 'verbs'], ['hurl', '', 'verbs'],
    ['burst', '', 'verbs'], ['curb', '', 'place'], ['curd', '', 'things'], ['surf', '', 'nature'],
    ['turf', '', 'nature'], ['curt', '', 'adj'], ['hurt', '', 'verbs'], ['blur', '', 'verbs'],
    ['slur', '', 'verbs'], ['fur', '', 'nature'], ['urn', '', 'things'], ['sunk', '', 'verbs'],
    ['dunk', '', 'verbs'], ['junk', '', 'things'], ['hunk', '', 'things'], ['trunk', '', 'nature'],
    ['drunk', '', 'adj'], ['skunk', '', 'nature'], ['stun', '', 'verbs'], ['snub', '', 'verbs'],
    ['stub', '', 'things'], ['club', '', 'place'], ['slug', '', 'nature'], ['snug', '', 'adj'],
    ['drug', '', 'things'], ['thug', '', 'people'], ['thus', '', 'func'], ['rush', '', 'verbs'],
    ['gush', '', 'verbs'], ['hush', '', 'life'], ['lush', '', 'adj'], ['blush', '', 'verbs'],
    ['brush', '', 'things'], ['crush', '', 'verbs'], ['flush', '', 'verbs'], ['shrug', '', 'verbs'],
    ['truck', '', 'rail'], ['stuck', '', 'adj'], ['duck', '', 'nature'], ['luck', '', 'life'],
    ['buck', '', 'nature'], ['suck', '', 'verbs'], ['tuck', '', 'verbs'], ['shut', '', 'verbs'],
    ['strut', '', 'verbs'], ['scrub', '', 'verbs'], ['shrub', '', 'nature'], ['bluff', '', 'place'],
    ['fluff', '', 'things'], ['stuff', '', 'things'], ['snuff', '', 'verbs'], ['cuff', '', 'things'],
    ['buff', '', 'verbs'], ['huff', '', 'life'], ['dull', '', 'adj'], ['gull', '', 'nature'],
    ['hull', '', 'rail'], ['lull', '', 'life'], ['null', '', 'adj'], ['bull', '', 'nature'],
    ['full', '', 'adj'], ['cult', '', 'life'], ['sulk', '', 'verbs'], ['bulk', '', 'things'],
    ['hulk', '', 'things'], ['husk', '', 'nature'], ['dusk', '', 'time'], ['tusk', '', 'nature'],
    ['lung', '', 'people'], ['rung', '', 'things'], ['sung', '', 'verbs'], ['hung', '', 'verbs'],
    ['stung', '', 'verbs'], ['slung', '', 'verbs'], ['flung', '', 'verbs'], ['clung', '', 'verbs'],
    ['strung', '', 'verbs'], ['dry', '', 'adj'], ['try', '', 'verbs'], ['cry', '', 'verbs'],
    ['fry', '', 'verbs'], ['sty', '', 'place'], ['guy', '', 'people'], ['buy', '', 'verbs'],
    ['truly', '', 'func'], ['ugly', '', 'adj'], ['dryly', '', 'adj'], ['curtly', '', 'adj'],
    ['nub', '', 'things'], ['bunt', '', 'verbs'], ['brunt', '', 'things'], ['burnt', '', 'adj'],
    ['bunny', '', 'nature'], ['runny', '', 'adj'], ['nutty', '', 'adj'], ['ruby', '', 'things'],
    ['bury', '', 'verbs'],
    // --- pair 9 adds v m ---
    ['mud', '', 'nature'], ['hum', '', 'verbs'], ['sum', '', 'things'], ['gum', '', 'things'],
    ['rum', '', 'things'], ['mug', '', 'things'], ['smug', '', 'adj'], ['drum', '', 'things'],
    ['strum', '', 'verbs'], ['slum', '', 'place'], ['glum', '', 'adj'], ['scum', '', 'things'],
    ['mum', '', 'people'], ['musk', '', 'nature'], ['murky', '', 'adj'], ['myth', '', 'life'],
    ['gym', '', 'place'], ['hymn', '', 'life'], ['much', '', 'func'], ['must', '', 'func'],
    ['muddy', '', 'adj'], ['mutt', '', 'nature'], ['munch', '', 'verbs'], ['brunch', '', 'home'],
    ['my', '', 'func'], ['numb', '', 'adj'], ['tummy', '', 'people'], ['yummy', '', 'adj'],
    ['murmur', '', 'verbs'],
    ['bunch', '', 'things'], ['lunch', '', 'home'], ['crunch', '', 'verbs'], ['hunch', '', 'life'],
    ['muggy', '', 'adj'], ['mushy', '', 'adj'],
    // --- pair 10 adds z (and the period) ---
    ['buzz', '', 'nature'], ['fuzz', '', 'things'], ['fuzzy', '', 'adj'], ['muzzy', '', 'adj'],
    // --- pair 12 adds e i: the language arrives (no a o w p x yet) ---
    ['the', '', 'func'], ['he', '', 'func'], ['be', '', 'func'], ['me', '', 'func'],
    ['she', '', 'func'], ['see', '', 'verbs'], ['tree', '', 'nature'], ['free', '', 'adj'],
    ['three', '', 'things'], ['if', '', 'func'], ['it', '', 'func'], ['is', '', 'func'],
    ['in', '', 'func'], ['his', '', 'func'], ['him', '', 'func'], ['her', '', 'func'],
    ['here', '', 'place'], ['there', '', 'place'], ['these', '', 'func'], ['time', '', 'time'],
    ['life', '', 'life'], ['like', '', 'verbs'], ['bike', '', 'things'], ['hike', '', 'verbs'],
    ['line', '', 'things'], ['nine', '', 'things'], ['mine', '', 'work'], ['fine', '', 'adj'],
    ['dine', '', 'verbs'], ['vine', '', 'nature'], ['side', '', 'place'], ['ride', '', 'verbs'],
    ['hide', '', 'verbs'], ['tide', '', 'nature'], ['site', '', 'place'], ['bite', '', 'verbs'],
    ['mile', '', 'things'], ['tile', '', 'home'], ['file', '', 'things'], ['smile', '', 'life'],
    ['slide', '', 'verbs'], ['bride', '', 'people'], ['drive', '', 'verbs'], ['live', '', 'verbs'],
    ['give', '', 'verbs'], ['dive', '', 'verbs'], ['five', '', 'things'], ['this', '', 'func'],
    ['kid', '', 'people'], ['lid', '', 'things'], ['bid', '', 'verbs'], ['did', '', 'verbs'],
    ['big', '', 'adj'], ['dig', '', 'verbs'], ['fig', '', 'things'], ['jig', '', 'life'],
    ['rig', '', 'work'], ['tin', '', 'things'], ['fin', '', 'nature'], ['bin', '', 'things'],
    ['kin', '', 'people'], ['sit', '', 'verbs'], ['fit', '', 'adj'], ['hit', '', 'verbs'],
    ['bit', '', 'things'], ['kit', '', 'things'], ['lit', '', 'verbs'], ['list', '', 'things'],
    ['fist', '', 'people'], ['mist', '', 'nature'], ['begin', '', 'verbs'], ['being', '', 'func'],
    ['end', '', 'time'], ['bend', '', 'verbs'], ['lend', '', 'verbs'], ['send', '', 'verbs'],
    ['mend', '', 'verbs'], ['ten', '', 'things'], ['hen', '', 'nature'], ['den', '', 'nature'],
    ['men', '', 'people'], ['then', '', 'time'], ['let', '', 'verbs'], ['get', '', 'verbs'],
    ['set', '', 'verbs'], ['net', '', 'things'], ['jet', '', 'rail'], ['met', '', 'verbs'],
    ['bet', '', 'verbs'], ['yet', '', 'func'], ['red', '', 'adj'], ['bed', '', 'home'],
    ['fed', '', 'verbs'], ['led', '', 'verbs'], ['leg', '', 'people'], ['beg', '', 'verbs'],
    ['less', '', 'func'], ['mess', '', 'things'], ['guess', '', 'verbs'], ['bless', '', 'verbs'],
    ['dress', '', 'things'], ['best', '', 'adj'], ['rest', '', 'life'], ['test', '', 'work'],
    ['nest', '', 'nature'], ['vest', '', 'things'], ['belt', '', 'work'], ['felt', '', 'verbs'],
    ['melt', '', 'verbs'], ['held', '', 'verbs'], ['self', '', 'people'], ['shelf', '', 'home'],
    ['deck', '', 'rail'], ['neck', '', 'people'], ['check', '', 'verbs'], ['fetch', '', 'verbs'],
    ['sketch', '', 'things'], ['ditch', '', 'place'], ['itch', '', 'life'], ['rich', '', 'adj'],
    ['inch', '', 'things'], ['use', '', 'verbs'], ['fuse', '', 'things'], ['cube', '', 'things'],
    ['tube', '', 'things'], ['tune', '', 'life'], ['dune', '', 'nature'], ['rude', '', 'adj'],
    ['crude', '', 'adj'], ['dude', '', 'people'], ['duke', '', 'people'], ['mule', '', 'nature'],
    ['rule', '', 'life'], ['true', '', 'adj'], ['blue', '', 'adj'], ['glue', '', 'things'],
    ['clue', '', 'things'], ['cure', '', 'life'], ['sure', '', 'adj'], ['lure', '', 'verbs'],
    ['fire', '', 'nature'], ['hire', '', 'work'], ['tire', '', 'things'], ['then', '', 'time'],
    ['tender', '', 'adj'], ['under', '', 'func'], ['thunder', '', 'nature'], ['hundred', '', 'things'],
    ['finish', '', 'verbs'], ['begin', '', 'verbs'], ['engine', '', 'rail'], ['tunnel', '', 'rail'],
    ['little', '', 'adj'], ['middle', '', 'place'], ['metal', '', 'things'], ['nickel', '', 'things'],
    ['steel', '', 'things'], ['bridge', '', 'rail'], ['smith', '', 'work'], ['shift', '', 'work'],
    ['build', '', 'verbs'], ['built', '', 'verbs'],
    // --- pair 13 adds q p ---
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
    ['pretty', '', 'adj'], ['plenty', '', 'func'], ['people', '', 'people'], ['simple', '', 'adj'],
    ['temple', '', 'place'], ['triple', '', 'things'], ['purple', '', 'adj'], ['supper', '', 'home'],
    ['upper', '', 'adj'], ['copper', '', 'things'], ['pepper', '', 'things'], ['puppy', '', 'nature'],
    ['queen', '', 'people'], ['quit', '', 'verbs'], ['quite', '', 'func'], ['quiet', '', 'adj'],
    ['quick', '', 'adj'], ['quilt', '', 'home'], ['liquid', '', 'things'], ['equip', '', 'work'],
    ['pick', '', 'verbs'], ['kick', '', 'verbs'], ['lick', '', 'verbs'], ['stick', '', 'things'],
    ['trick', '', 'life'], ['brick', '', 'things'], ['thick', '', 'adj'], ['click', '', 'verbs'],
    // --- pair 14 adds x and the apostrophe ---
    ['six', '', 'things'], ['fix', '', 'verbs'], ['mix', '', 'verbs'], ['next', '', 'func'],
    ['text', '', 'things'], ['exit', '', 'place'], ['sixty', '', 'things'], ['expect', '', 'verbs'],
    ['expert', '', 'people'], ["it's", '', 'func'], ["he's", '', 'func'], ["she's", '', 'func'],
    ["isn't", '', 'func'], ["didn't", '', 'func'], ["let's", '', 'func'], ["there's", '', 'func'],
    // --- pair 16 adds a (and the semicolon) ---
    ['and', '', 'func'], ['an', '', 'func'], ['at', '', 'func'], ['as', '', 'func'],
    ['has', '', 'func'], ['had', '', 'func'], ['hand', '', 'people'], ['land', '', 'nature'],
    ['sand', '', 'nature'], ['band', '', 'life'], ['stand', '', 'verbs'], ['grand', '', 'adj'],
    ['than', '', 'func'], ['that', '', 'func'], ['back', '', 'place'], ['black', '', 'adj'],
    ['track', '', 'rail'], ['crack', '', 'things'], ['stack', '', 'things'], ['snack', '', 'home'],
    ['can', '', 'func'], ['man', '', 'people'], ['fan', '', 'things'], ['pan', '', 'home'],
    ['ran', '', 'verbs'], ['tan', '', 'adj'], ['van', '', 'rail'], ['plan', '', 'work'],
    ['clan', '', 'people'], ['scan', '', 'verbs'], ['span', '', 'things'], ['cat', '', 'nature'],
    ['hat', '', 'things'], ['bat', '', 'nature'], ['rat', '', 'nature'], ['mat', '', 'home'],
    ['sat', '', 'verbs'], ['fat', '', 'adj'], ['flat', '', 'adj'], ['chat', '', 'life'],
    ['car', '', 'rail'], ['bar', '', 'things'], ['far', '', 'place'], ['jar', '', 'things'],
    ['tar', '', 'things'], ['star', '', 'nature'], ['scar', '', 'people'], ['mark', '', 'things'],
    ['dark', '', 'adj'], ['park', '', 'place'], ['bark', '', 'nature'], ['hard', '', 'adj'],
    ['card', '', 'things'], ['yard', '', 'place'], ['art', '', 'life'], ['cart', '', 'rail'],
    ['part', '', 'things'], ['start', '', 'verbs'], ['smart', '', 'adj'], ['chart', '', 'things'],
    ['arm', '', 'people'], ['farm', '', 'place'], ['harm', '', 'life'], ['charm', '', 'life'],
    ['ask', '', 'verbs'], ['task', '', 'work'], ['mask', '', 'things'], ['cash', '', 'things'],
    ['dash', '', 'verbs'], ['crash', '', 'rail'], ['flash', '', 'nature'], ['trash', '', 'things'],
    ['class', '', 'life'], ['glass', '', 'things'], ['grass', '', 'nature'], ['brass', '', 'things'],
    ['pass', '', 'verbs'], ['mass', '', 'things'], ['last', '', 'adj'], ['fast', '', 'adj'],
    ['past', '', 'time'], ['cast', '', 'verbs'], ['vast', '', 'adj'], ['blast', '', 'things'],
    ['plant', '', 'nature'], ['grant', '', 'verbs'], ['salt', '', 'things'], ['halt', '', 'verbs'],
    ['act', '', 'verbs'], ['fact', '', 'life'], ['exact', '', 'adj'], ["can't", '', 'func'],
    ['late', '', 'time'], ['gate', '', 'home'], ['date', '', 'time'], ['fate', '', 'life'],
    ['mate', '', 'people'], ['rate', '', 'things'], ['plate', '', 'home'], ['slate', '', 'things'],
    ['skate', '', 'life'], ['state', '', 'place'], ['safe', '', 'adj'], ['cake', '', 'things'],
    ['lake', '', 'nature'], ['make', '', 'verbs'], ['take', '', 'verbs'], ['bake', '', 'verbs'],
    ['rake', '', 'things'], ['name', '', 'people'], ['game', '', 'life'], ['fame', '', 'life'],
    ['same', '', 'func'], ['tame', '', 'adj'], ['came', '', 'verbs'], ['place', '', 'place'],
    ['face', '', 'people'], ['race', '', 'life'], ['lace', '', 'things'], ['pace', '', 'things'],
    ['space', '', 'nature'], ['trace', '', 'verbs'], ['grace', '', 'life'], ['page', '', 'things'],
    ['cage', '', 'things'], ['age', '', 'time'], ['rage', '', 'life'], ['stage', '', 'place'],
    ['save', '', 'verbs'], ['cave', '', 'nature'], ['gave', '', 'verbs'], ['brave', '', 'adj'],
    ['grave', '', 'place'], ['main', '', 'adj'], ['rain', '', 'nature'], ['gain', '', 'verbs'],
    ['pain', '', 'life'], ['train', '', 'rail'], ['brain', '', 'people'], ['chain', '', 'things'],
    ['plain', '', 'nature'], ['grain', '', 'nature'], ['again', '', 'func'], ['air', '', 'nature'],
    ['fair', '', 'adj'], ['hair', '', 'people'], ['pair', '', 'things'], ['chair', '', 'home'],
    ['stair', '', 'home'], ['said', '', 'verbs'], ['paid', '', 'verbs'], ['raid', '', 'life'],
    ['maid', '', 'people'], ['laid', '', 'verbs'], ['sail', '', 'rail'], ['fail', '', 'verbs'],
    ['tail', '', 'nature'], ['mail', '', 'things'], ['nail', '', 'things'], ['rail', '', 'rail'],
    ['jail', '', 'place'], ['trail', '', 'place'], ['snail', '', 'nature'], ['tea', '', 'things'],
    ['sea', '', 'nature'], ['eat', '', 'verbs'], ['seat', '', 'home'], ['heat', '', 'nature'],
    ['beat', '', 'verbs'], ['meat', '', 'things'], ['neat', '', 'adj'], ['team', '', 'people'],
    ['beam', '', 'things'], ['cream', '', 'things'], ['dream', '', 'life'], ['steam', '', 'rail'],
    ['stream', '', 'nature'], ['each', '', 'func'], ['teach', '', 'verbs'], ['reach', '', 'verbs'],
    ['beach', '', 'place'], ['peach', '', 'things'], ['read', '', 'verbs'], ['lead', '', 'verbs'],
    ['head', '', 'people'], ['bread', '', 'things'], ['dead', '', 'adj'], ['deal', '', 'work'],
    ['real', '', 'adj'], ['seal', '', 'nature'], ['meal', '', 'home'], ['steal', '', 'verbs'],
    ['learn', '', 'verbs'], ['earn', '', 'work'], ['heart', '', 'people'], ['earth', '', 'nature'],
    ['heard', '', 'verbs'], ['year', '', 'time'], ['near', '', 'place'], ['dear', '', 'adj'],
    ['fear', '', 'life'], ['gear', '', 'work'], ['tear', '', 'life'], ['clear', '', 'adj'],
    // --- pair 17 adds w o: the last vowel and everything it held back ---
    ['of', '', 'func'], ['on', '', 'func'], ['or', '', 'func'], ['to', '', 'func'],
    ['do', '', 'verbs'], ['go', '', 'verbs'], ['no', '', 'func'], ['so', '', 'func'],
    ['off', '', 'func'], ['too', '', 'func'], ['zoo', '', 'place'], ['how', '', 'func'],
    ['now', '', 'time'], ['cow', '', 'nature'], ['row', '', 'things'], ['low', '', 'adj'],
    ['own', '', 'verbs'], ['down', '', 'place'], ['town', '', 'place'], ['brown', '', 'adj'],
    ['crown', '', 'things'], ['word', '', 'things'], ['work', '', 'work'], ['world', '', 'nature'],
    ['would', '', 'func'], ['could', '', 'func'], ['should', '', 'func'], ['good', '', 'adj'],
    ['food', '', 'things'], ['mood', '', 'life'], ['room', '', 'home'], ['moon', '', 'nature'],
    ['soon', '', 'time'], ['book', '', 'things'], ['look', '', 'verbs'], ['took', '', 'verbs'],
    ['cook', '', 'home'], ['foot', '', 'people'], ['door', '', 'home'], ['floor', '', 'home'],
    ['more', '', 'func'], ['store', '', 'place'], ['score', '', 'things'], ['shore', '', 'nature'],
    ['north', '', 'place'], ['short', '', 'adj'], ['sport', '', 'life'], ['form', '', 'things'],
    ['storm', '', 'nature'], ['born', '', 'verbs'], ['corn', '', 'nature'], ['horn', '', 'things'],
    ['torn', '', 'verbs'], ['worn', '', 'verbs'], ['morning', '', 'time'], ['over', '', 'func'],
    ['open', '', 'verbs'], ['only', '', 'func'], ['once', '', 'time'], ['one', '', 'things'],
    ['two', '', 'things'], ['who', '', 'func'], ['why', '', 'func'], ['what', '', 'func'],
    ['when', '', 'func'], ['where', '', 'func'], ['water', '', 'nature'], ['woman', '', 'people'],
    ['women', '', 'people'], ['wood', '', 'nature'], ['wool', '', 'things'], ['snow', '', 'nature'],
    ['show', '', 'verbs'], ['slow', '', 'adj'], ['grow', '', 'verbs'], ['blow', '', 'verbs'],
    ['flow', '', 'verbs'], ['glow', '', 'nature'], ['know', '', 'verbs'], ['throw', '', 'verbs'],
    ['window', '', 'home'], ['yellow', '', 'adj'], ['follow', '', 'verbs'], ['hollow', '', 'adj'],
    ['for', '', 'func'], ['from', '', 'func'], ['not', '', 'func'], ['was', '', 'func'],
    ['are', '', 'func'], ['you', '', 'func'], ['your', '', 'func'], ['our', '', 'func'],
    ['out', '', 'func'], ['about', '', 'func'], ['house', '', 'home'], ['mouse', '', 'nature'],
    ['mouth', '', 'people'], ['south', '', 'place'], ['sound', '', 'things'], ['found', '', 'verbs'],
    ['round', '', 'adj'], ['ground', '', 'nature'], ['pound', '', 'things'], ['count', '', 'verbs'],
    ['mount', '', 'place'], ['point', '', 'things'], ['join', '', 'verbs'], ['coin', '', 'things'],
    ['oil', '', 'things'], ['boil', '', 'verbs'], ['soil', '', 'nature'], ['coil', '', 'things'],
    ['voice', '', 'people'], ['noise', '', 'things'], ['choice', '', 'life'], ['most', '', 'func'],
    ['post', '', 'things'], ['cost', '', 'work'], ['lost', '', 'verbs'], ['host', '', 'people'],
    ['ghost', '', 'life'], ['both', '', 'func'], ['cloth', '', 'things'], ['worker', '', 'work'],
    ['workshop', '', 'work'], ['ore', '', 'work'], ['iron', '', 'things'], ['smoke', '', 'nature'],
    ['stone', '', 'nature'], ['coal', '', 'things'], ['quartz', '', 'things'], ['bronze', '', 'things'],
    ['furnace', '', 'work'], ['factory', '', 'work'], ['machine', '', 'things'], ['motor', '', 'things'],
    ['power', '', 'things'], ['tower', '', 'place'], ['crane', '', 'work'], ['wagon', '', 'rail'],
    ['frontier', '', 'place'], ['operator', '', 'people'],
    // --- the deep-ore pass (2026-08-22): the pinned alloys' thin sets, and
    // the workshop's own vocabulary, generously ---
    ['sultry', '', 'adj'], ['surly', '', 'adj'], ['tryst', '', 'life'], ['truss', '', 'things'],
    ['strut', '', 'things'], ['trusty', '', 'adj'], ['unruly', '', 'adj'], ['untruly', '', 'func'],
    ['pace', '', 'verbs'], ['pack', '', 'verbs'], ['dice', '', 'things'], ['iced', '', 'adj'],
    ['idea', '', 'life'], ['aide', '', 'people'], ['cake', '', 'things'], ['peak', '', 'place'],
    ['pike', '', 'things'], ['deck', '', 'place'], ['epic', '', 'adj'], ['acid', '', 'things'],
    ['decade', '', 'time'], ['decide', '', 'verbs'], ['peace', '', 'life'], ['dazed', '', 'adj'],
    ['worry', '', 'life'], ['sorry', '', 'adj'], ['tour', '', 'life'], ['sour', '', 'adj'],
    ['soul', '', 'people'], ['stout', '', 'adj'], ['trout', '', 'nature'], ['scout', '', 'people'],
    ['rivet', '', 'things'], ['anvil', '', 'things'], ['forge', '', 'work'], ['ingot', '', 'things'],
    ['boiler', '', 'things'], ['firebox', '', 'things'], ['piston', '', 'things'], ['flywheel', '', 'things'],
    ['gearwheel', '', 'things'], ['pulley', '', 'things'], ['winch', '', 'things'], ['crucible', '', 'things'],
    ['furnace', '', 'things'], ['smelter', '', 'work'], ['foundry', '', 'work'], ['bellows', '', 'things'],
    ['lantern', '', 'things'], ['pickaxe', '', 'things'], ['shaft', '', 'place'], ['seam', '', 'nature'],
    ['spoil', '', 'nature'], ['slag', '', 'things'], ['soot', '', 'nature'], ['ember', '', 'nature'],
    ['spark', '', 'nature'], ['grime', '', 'nature'], ['quench', '', 'verbs'], ['temper', '', 'verbs'],
    ['solder', '', 'verbs'], ['gasket', '', 'things'], ['sprocket', '', 'things'], ['crankshaft', '', 'things'],
    ['gauge', '', 'things'], ['valve', '', 'things'], ['nozzle', '', 'things'], ['funnel', '', 'things'],
    ['girder', '', 'things'], ['truss', '', 'things'], ['derrick', '', 'work'], ['gantry', '', 'work'],
    ['foreman', '', 'people'], ['apprentice', '', 'people'], ['workshop', '', 'work'], ['toolbox', '', 'things'],
  ];

  // phrases: the Assembler's grammar (no marks); early ones survive on u/y
  const PHRASES = [
    ['just run', ''], ['dry run', ''], ['try my luck', ''], ['burnt rust', ''],
    ['dust and rust', ''], ['hunt the duck', ''], ['such fun', ''], ['hush hush', ''],
    ['the sun is up', ''], ['it is here', ''], ['let me see', ''], ['time flies', ''],
    ['nine lives', ''], ['side by side', ''], ['bit by bit', ''], ['in the end', ''],
    ['the best rest', ''], ['test the line', ''], ['run the mine', ''], ['fire and steel', ''],
    ['keep it up', ''], ['deep sleep', ''], ['quite quick', ''], ['the queen is quiet', ''],
    ['pick it up', ''], ['thick brick', ''], ['fix the pipe', ''], ['the next exit', ''],
    ['hand in hand', ''], ['fast track', ''], ['a grand plan', ''], ['the last train', ''],
    ['start the engine', ''], ['a clear head', ''], ['read and learn', ''], ['near and far', ''],
    ['year after year', ''], ['heart and hand', ''], ['salt and sand', ''], ['a fair deal', ''],
    ['rain in the hills', ''], ['a chain of parts', ''], ['make it last', ''], ['take a seat', ''],
    ['one by one', ''], ['now and then', ''], ['out and about', ''], ['down the road', ''],
    ['good as gold', ''], ['slow but sure', ''], ['the whole world', ''], ['word for word', ''],
    ['work the room', ''], ['a good morning', ''], ['snow on the ground', ''], ['follow the flow', ''],
  ];

  // sentences: the Fastener's grammar (with their marks; capitals wait for
  // the Crane, so the texts stay lowercase like the Russian corpus)
  const SENTENCES = [
    ['the sun is up.', ''], ['just run.', ''], ['it is here.', ''], ['this is the end.', ''],
    ['he is here.', ''], ['she is fine.', ''], ['let me see it.', ''], ['time flies.', ''],
    ['the line is fine.', ''], ['it is mine.', ''], ['his side, her side.', ''], ['the tide is in.', ''],
    ['nine miles, then rest.', ''], ['the fire is lit.', ''], ['use it, then set it here.', ''],
    ['the rule is true.', ''], ['it is just dust.', ''], ['dust, rust, and such.', ''],
    ['run, then rest.', ''], ['the drum is silent.', ''], ['keep it simple.', ''],
    ['the pipe is fixed.', ''], ['pick it up, then set it here.', ''], ['six, then ten.', ''],
    ["it's here.", ''], ["he's fine.", ''], ["she's here, isn't she?", ''], ["isn't it fine?", ''],
    ['is it here?', ''], ['is it true?', ''], ['is he in?', ''], ['see me, then hide.', ''],
    ['the test is set.', ''], ['this is it.', ''], ['the mine is deep.', ''],
    ['the hand is fast.', ''], ['the plan is grand.', ''], ['start the engine.', ''],
    ['the last train is late.', ''], ['the track is clear.', ''], ['the train is fast, the cart is slow.', ''],
    ['rain came, then heat.', ''], ['a hard task, a fair deal.', ''], ['take a seat.', ''],
    ['the gate is shut.', ''], ['the cat sat back.', ''], ['make it last.', ''],
    ['the earth is vast.', ''], ['read it again.', ''], ['learn it by heart.', ''],
    ['what is it?', ''], ['where is he?', ''], ['when is the train?', ''], ['who is there?', ''],
    ['why not now?', ''], ['how far is it?', ''], ['stop! the track is out!', ''],
    ['well done!', ''], ['what a day!', ''], ['hold on - the gate is shut.', ''],
    ['one - two - three.', ''], ['slow down, then stop.', ''], ['the world is round.', ''],
    ['the room is warm; the door is shut.', ''], ['one thing is sure: the work goes on.', ''],
    ['he said: "go home".', ''], ['"yes," she said.', ''], ['the book (an old one) is on the shelf.', ''],
    ['here is the list: iron, coal, stone.', ''], ['the day is done; the night is near.', ''],
    ['it works! it really works!', ''],
  ];

  const NAMES = [
    ['Ben', ''], ['Sam', ''], ['Max', ''], ['Judy', ''], ['Ruth', ''], ['Nick', ''],
    ['Jack', ''], ['Jill', ''], ['Tom', ''], ['Tim', ''], ['Kim', ''], ['Ken', ''],
    ['Dan', ''], ['Don', ''], ['Meg', ''], ['Sue', ''], ['Roy', ''], ['Ray', ''],
    ['Lee', ''], ['Ann', ''], ['Rose', ''], ['Jane', ''], ['Mark', ''], ['Luke', ''],
    ['Grant', ''], ['York', ''], ['London', ''], ['Boston', ''], ['Denver', ''], ['Hudson', ''],
  ];

  // pages: the Manufacturer's paragraphs — THE CONTENT SLOT (placeholders;
  // the writing rules match the Russian file: the course's keys only)
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
  ];

  // Deduplicate (keep first entry).
  const seen = new Set();
  const WORD_LIST = WORDS.filter(([w]) => (seen.has(w) ? false : (seen.add(w), true)));

  window.LANG_EN = {
    LETTER_FREQ, PAIRS, UNLOCK_ORDER, LEGACY_ORDER, SEED_COUNT, ORE_OF, VOWELS, SEMIS, PUNCT, RARE_LETTERS, TOP_BIGRAMS,
    SYLLABLES, CLUSTERS, ENDINGS, PHRASES, SENTENCES, NAMES, PAGES,
    WORD_SETS, WORDS: WORD_LIST,
  };
})();
