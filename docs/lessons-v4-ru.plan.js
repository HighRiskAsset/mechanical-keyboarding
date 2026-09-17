// RU lesson plan v4 (draft 2026-09-10). The structure only: ids, keys,
// inputs, intended rung and family. Alphabets, pools, samples and the checks
// are computed from js/language-ru.js by dev/lessons-v4-build.js, which
// renders docs/lessons-v4-ru.html. No material or machine is named here.
//
// Columns: every introduction opens a column (C1..C24); an expansion sits in
// the column of its newest input. Pages take columns after the keyboard.
//
// The shape every letter group follows: intro (streams typed with its own keys),
// syllables with the first ores (I-01 о а, I-02 е н, I-03 и т are the vowel
// banks that partner every later pair, so the first lessons stay useful all
// game), focused words typed with everything unlocked, then a sentence lesson or a
// gather. Marks get an intro and one expansion that needs them.
'use strict';

const L = [];
const I = (id, keys, strokes, note, extra) => L.push(Object.assign({ id, kind: 'intro', keys, strokes, note }, extra || {}));
const E = (id, inputs, rung, family, note, extra) => L.push(Object.assign({ id, kind: 'exp', inputs, rung, family, note }, extra || {}));
const P = (id, cat, grade, inputs, note, samples) => L.push({ id, kind: 'page', cat, grade, inputs, note, samples });

// ---- C1..C4: the seed ----
I('I-01', ['о', 'а'], 'J F', 'the home bumps; the two vowels that carry 19% of text');
I('I-02', ['е', 'н'], 'T Y', 'index top');
E('E-01', ['I-01', 'I-02'], 'syllables', null, 'на но не; the first syllables');
I('I-03', ['и', 'т'], 'B N', 'index bottom; words open here');
E('E-02', ['I-01', 'I-03'], 'syllables', null, 'та то ти; a second alphabet, same rung');
E('E-03', ['E-01', 'I-03'], 'words', ['func'], 'the first real words: тот, нет, она, они');
I('I-04', ['с', 'л'], 'C K', 'the two most frequent consonants after н т');
E('E-04', ['E-02', 'I-04'], 'words', ['things', 'nature', 'home'], 'nouns typed with six letters: стол, лист, лиса');
E('E-05', ['E-03', 'I-04', 'I-02'], 'words', ['func'], 'little words typed with eight letters; е н come back as the flux');

// ---- C5: в р ----
I('I-05', ['в', 'р'], 'D H', 'middle home and index home');
E('E-06', ['I-05', 'I-01'], 'syllables', null, 'ва во ра ро; copper ore + coal → copper', { focus: true });
E('E-07', ['E-06', 'E-04', 'I-02'], 'words', ['nature', 'things'], 'nature words leaning on в р: ветер, весна, река; iron ore rides along as the flux', { focus: true });
E('E-08', ['E-05', 'I-05'], 'phrases', null, 'first phrases: он не один, вот и все, нет воды');

// ---- C6: к п ----
I('I-06', ['к', 'п'], 'R G', 'index top and index home, inner');
E('E-09', ['I-06', 'I-05', 'I-01'], 'syllables', null, 'ка ко па по with в р; tin + copper + coal → bronze', { focus: true });
E('E-10', ['E-09', 'E-07'], 'words', ['home', 'things', 'rail'], 'home and road words leaning on к п: окно, пол, поезд', { focus: true });
E('E-11', ['E-08', 'E-10'], 'phrases', null, 'GATHER 1: phrases typed with the first twelve letters', { gather: true });

// ---- C7: м д and the period ----
I('I-07', ['м', 'д', '.'], 'V L /', 'index bottom, ring home, and the period on the Slash key: sentences are within reach');
E('E-12', ['I-07', 'I-01'], 'syllables', null, 'ма мо да до; lead ore + coal → lead', { focus: true });
E('E-13', ['E-12', 'E-10'], 'words', ['home', 'people', 'time'], 'home and family words leaning on м д: дом, мама, дети', { focus: true });
E('E-14', ['E-11', 'E-13'], 'sentences', 'period', 'the first sentences, period only');

// ---- C8: Shift ----
I('I-08', ['Shift'], 'Shift', 'capitals of every unlocked letter; a sentence gets its capital', { caps: true });
E('E-15', ['E-14', 'I-08', 'E-08'], 'sentences', 'names', 'capitalised sentences and proper names: Анна, Иван, Москва; the first phrases come back as the flux');

// ---- C9: у ь ----
I('I-09', ['у', 'ь'], 'E M', 'middle top and index bottom, inner; the soft sign');
E('E-16', ['I-09', 'I-01', 'I-02'], 'syllables', null, 'ну ту; нь ть: the soft sign; manganese + coal + iron ore → steel', { focus: true });
E('E-17', ['E-16', 'E-13'], 'words', ['verbs'], 'infinitives and verbs leaning on у ь: делать, думать, спать', { focus: true });
E('E-18', ['E-15', 'E-17'], 'sentences', 'period', 'GATHER 2: sentences typed with sixteen letters', { gather: true });

// ---- C10: the comma ----
I('I-10', [','], 'Shift+/', 'the signature hurdle: the period key, shifted', { hurdle: true });
E('E-19', ['E-18', 'I-10', 'E-11'], 'sentences', 'clauses', 'clauses: он ел, а она пела; two phrases joined by a comma, so the phrase gather is the flux');

// ---- C11: ы г ----
I('I-11', ['ы', 'г'], 'S U', 'ring home and index top, inner');
E('E-20', ['I-11', 'I-01', 'I-03'], 'syllables', null, 'га го ги; ты; limestone + coal + sand → mortar', { focus: true });
E('E-21', ['E-20', 'E-17'], 'words', ['things', 'place', 'nature'], 'plurals in -ы and words leaning on г: горы, ноги, город', { focus: true });
E('E-22', ['E-19', 'E-21'], 'sentences', 'clauses', 'sentences with plurals and clauses');

// ---- C12: the dash ----
I('I-12', ['-', '—'], 'Minus, right Alt+Minus', 'the hyphen on its key and the em dash by the typographic stroke; the glyph is checked, not the stroke', { hurdle: true });
E('E-23', ['E-22', 'I-12', 'E-13'], 'sentences', 'dash', 'тире between the halves, дефис inside words: мама — доктор; кто-то; the home and family nouns are the flux');

// ---- C13: б я ----
I('I-13', ['б', 'я'], ', Z', 'middle bottom and pinky bottom');
E('E-24', ['I-13', 'I-05', 'I-01'], 'syllables', null, 'ба бо бя; вя ря; zinc + copper ore + coal → brass', { focus: true });
E('E-25', ['E-24', 'E-21'], 'words', ['people', 'life', 'verbs'], 'people and the past leaning on б я: я, был, была, брат, ребята', { focus: true });
E('E-26', ['E-23', 'E-25'], 'sentences', 'past', 'GATHER 3: the past tense: я был дома. она была одна.', { gather: true });

// ---- C14: з й ----
I('I-14', ['з', 'й'], 'P Q', 'both pinky top');
E('E-27', ['I-14', 'I-01', 'I-03'], 'syllables', null, 'за зо зи; ай ой ий', { focus: true });
E('E-28', ['E-27', 'E-25'], 'words', ['adj', 'things', 'place'], 'adjectives and possessives leaning on з й: мой, твой, злой, зима', { focus: true });
E('E-29', ['E-26', 'E-28'], 'sentences', 'period', 'sentences with adjectives');

// ---- C15: ? ! ----
I('I-15', ['?', '!'], 'Shift+7, Shift+1', 'the number row, shifted: questions and exclamations');
E('E-30', ['E-29', 'I-15', 'E-05'], 'sentences', 'questions', 'кто там? ты готов? вот беда! The question words are little words, so E-05 is the flux');

// ---- C16: ч ш ----
I('I-16', ['ч', 'ш'], 'X I', 'ring bottom and middle top');
E('E-31', ['I-16', 'I-01', 'I-03'], 'syllables', null, 'ча чи ша ши; что', { focus: true });
E('E-32', ['E-31', 'E-28'], 'words', ['time', 'life', 'verbs'], 'time and doing words leaning on ч ш: час, ночь, читать, шесть', { focus: true });
E('E-33', ['E-30', 'E-32'], 'sentences', 'questions', 'GATHER 4: questions with что, почему, куда', { gather: true });

// ---- C17: quotes ----
I('I-17', ['"', '«', '»'], 'Shift+2; right Alt+б, right Alt+ю', 'straight quotes on the number row; guillemets by the typographic stroke', { hurdle: true });
E('E-34', ['E-33', 'I-17', 'E-25'], 'sentences', 'dialogue', 'dialogue: «Иди домой!» — сказал он. The people and past-tense words are the flux');

// ---- C18: ж х ----
I('I-18', ['ж', 'х'], '; [', 'both pinky: home and top');
E('E-35', ['I-18', 'I-01', 'I-02'], 'syllables', null, 'жа же жо; ха хо хе', { focus: true });
E('E-36', ['E-35', 'E-32'], 'words', ['life', 'home', 'adj'], 'life words leaning on ж х: жизнь, уже, можно, хорошо, хлеб', { focus: true });
E('E-37', ['E-34', 'E-36'], 'sentences', 'clauses', 'sentences with ж х: хорошо, что ты здесь.');

// ---- C19: ц э ----
I('I-19', ['ц', 'э'], "W '", 'ring top and pinky home');
E('E-38', ['I-19', 'I-01', 'I-03'], 'syllables', null, 'ца цо ци; эт; clay + coal + sand → stoneware', { focus: true });
E('E-39', ['E-38', 'E-36'], 'words', ['things', 'people', 'place'], 'things leaning on ц э: это, цвет, улица, отец, центр', { focus: true });
E('E-40', ['E-37', 'E-39'], 'sentences', 'mixed', 'GATHER 5: every mark so far in one pool: comma, question, capitals, dash, quotes', { gather: true });

// ---- C20: : ; ( ) ----
I('I-20', [':', ';', '(', ')'], 'Shift+6, Shift+4, Shift+9, Shift+0', 'the rest of the number row: lists and asides');
E('E-41', ['E-40', 'I-20', 'E-21'], 'sentences', 'lists', 'вот что нужно: хлеб, соль, вода. система проста (почти). Lists are of things, so the things words are the flux');

// ---- C21: ю ф ----
I('I-21', ['ю', 'ф'], '. A', 'ring bottom and pinky home');
E('E-42', ['I-21', 'I-05', 'I-01'], 'syllables', null, 'ю after consonants: вю рю; фа фо; nickel + copper ore + coal → cupronickel', { focus: true });
E('E-43', ['E-42', 'E-39'], 'words', ['work', 'things', 'life'], 'work words leaning on ю ф: люди, фильм, кофе, фабрика', { focus: true });
E('E-44', ['E-41', 'E-43'], 'sentences', 'mixed', 'sentences with ю ф: я люблю кофе.');

// ---- C22: щ ё ъ ----
I('I-22', ['щ', 'ё', 'ъ'], 'O ` ]', 'the rare tail: ring top, the corner key, pinky top');
E('E-45', ['I-22', 'I-05', 'I-01'], 'syllables', null, 'ща щу; вё рё; gold + copper ore + coal → red gold', { focus: true });
E('E-46', ['E-45', 'E-43'], 'words', ['life', 'things', 'nature'], 'the tail in words: ещё, вещь, объект, ёлка, всё', { focus: true });
E('E-47', ['E-44', 'E-46'], 'sentences', 'mixed', 'GATHER 6: every letter of the alphabet', { gather: true });

// ---- C23, C24: digits ----
I('I-23', ['1', '2', '3', '4', '5'], '1 2 3 4 5', 'the left half of the number row');
E('E-48', ['E-47', 'I-23', 'E-32'], 'sentences', 'numbers', 'counts and times: в классе 25 человек. поезд в 5 часов. The time words are the flux');
I('I-24', ['6', '7', '8', '9', '0', '№'], '6 7 8 9 0, Shift+3', 'the right half, and the numero sign');
E('E-49', ['E-48', 'I-24'], 'full', 'dates', 'full sentences at last: dates, prices, numbers of things: в 1867 году. дом № 7.');
E('E-50', ['E-49', 'E-46', 'E-41'], 'full', 'everything', 'GATHER 7: the keyboard is complete; every core key in one pool', { gather: true, milestone: 'keyboard complete' });

// ---- Pages: six categories, three grades, staggered by difficulty (user
// ruling 2026-09-11): plain sentences first (lore, letters), then prose and
// light trivia, then verse and dialogue with their quotes and dashes, then
// digit-dense trivia, and mathematics last of all, harder than any sentence.
//
// Pages open at C22, the column where the last letters arrive, and run
// beside the digit columns (user ruling 2026-09-11, against the funnel):
// the digit-free categories go first; a page that needs digits or the list
// marks waits for the lesson that teaches them. A page has an order, and
// sits at column pageBase + order; the order is only when it opens. Every page takes paper and ink (timber, graphite) plus,
// at grade 1, a flux from the branch that set its marks, and at grades 2
// and 3 its own previous grade and a neighbour's page, so the flows fan out
// across the shops instead of funnelling through the last gather.
// Completion = the easier half of the pages, listed at the end: every
// kind of page once and a second of the plain ones, nothing advanced. ----
const PAGES = {
  lore: { flux: 'E-23', name: 'lore: the machines talking' },
  let: { flux: 'E-30', name: 'letters and correspondence' },
  lit: { flux: 'E-40', name: 'famous literature' },
  triv: { flux: 'E-44', name: 'fun trivia' },
  dia: { flux: 'E-34', name: 'dialogue and theatre' },
  tech: { flux: 'E-48', name: 'mathematical and technical writing' },
};
const PAPER = ['I-04', 'I-17'];   // timber for the paper, graphite for the ink
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
PT('P-dia-1', 'dia', 1, 3, ['E-34', 'P-lit-1'], 'dialogue: dashes and guillemets');
// order 4: the keyboard is complete; digit-dense pages open
PT('P-triv-2', 'triv', 2, 4, ['P-triv-1', 'P-lit-2', 'E-50'], 'digit-dense facts: the charter, the digits gather, is the flux');
PT('P-dia-2', 'dia', 2, 4, ['P-dia-1', 'P-let-2'], 'a scene from a play');
PT('P-lore-3', 'lore', 3, 4, ['P-lore-2', 'P-dia-1', 'E-49'], 'the frontier exam: brackets, a time');
// order 5: mathematics begins
PT('P-tech-1', 'tech', 1, 5, ['E-50', 'E-41', 'P-triv-2'], 'a worked speed problem in words and digits');
PT('P-lit-3', 'lit', 3, 5, ['P-lit-2', 'P-dia-2'], 'verse with semicolons and exclamations');
PT('P-let-3', 'let', 3, 5, ['P-let-2', 'P-lore-3', 'E-50'], 'an order: №, prices, dates');
// the advanced half
PT('P-dia-3', 'dia', 3, 6, ['P-dia-2', 'P-lit-3'], 'nested quotation inside speech');
PT('P-tech-2', 'tech', 2, 6, ['P-tech-1', 'P-let-3', 'E-50'], 'geometry with brackets and decimals');
PT('P-triv-3', 'triv', 3, 6, ['P-triv-2', 'P-tech-1'], 'the railway in numbers');
PT('P-tech-3', 'tech', 3, 7, ['P-tech-2', 'P-triv-3'], 'an algorithm: numbered steps, conditions');

// ---- Extended scope: taught, never required; may open early (after
// tech 2) since it is optional ----
I('X-01', ['%', '*', '+', '='], 'Shift+5, Shift+8, Shift+=, =', 'arithmetic marks; opens after tech 2', { ext: true, after: 'P-tech-2' });
I('X-02', ['/', '\\', '[', ']', '{', '}', '<', '>'], 'various', 'brackets and slashes (the / and [ ] caps carry letters in ЙЦУКЕН; these are the Latin-layer strokes)', { ext: true, after: 'X-01' });
I('X-03', ['@', '#', '$', '&', '^', '~', '|', '_', '`'], 'various', 'the code symbols', { ext: true, after: 'X-02' });
P('PX-math', 'tech', 4, ['P-tech-3', 'X-01'].concat(PAPER), 'extended: formulas');
P('PX-code', 'tech', 4, ['PX-math', 'X-02', 'X-03'].concat(PAPER), 'extended: a page of code');

// Authored content the course data does not yet hold. Every item here is
// real Russian and is flagged "authored" on the page; it counts toward the
// pool and is the to-do list for js/language-ru.js.
const AUTHORED = {
  'E-15': ['Иван дома.', 'Анна и Вера в Омске.', 'Нина спит.', 'Москва далеко.', 'Дима ел торт.', 'Лена дома.', 'Папа и Дима в Томске.', 'Дон и Нева.', 'Вера видела Дон.'],
  'E-19': ['он ел, а она пела.', 'мама дома, и нам тепло.', 'кот спит, пес не спит.', 'вот дом, а вот сад.', 'она пела, он спал.', 'скоро лето, потом осень.', 'дети спали, мама не спала.', 'не то, не то.', 'пусть спит, ему пора.', 'мне пора, а ему нет.', 'сад стар, а дом нов.', 'вода есть, а света нет.'],
  'E-22': ['горы далеко, а мы дома.', 'книги на столе, тетради в сумке.', 'мы уснули, они остались.', 'ноги устали, но мы идем.', 'город спит, дороги пусты.', 'сыр на столе, а масла нет.', 'мы поем, вы спите.', 'год идет, город растет.'],
  'E-23': ['Дон — река.', 'Труд — основа всего.', 'Мы — дома, они — в пути.', 'Кто-то поет.', 'Где-то там лес.', 'Дорога — на восток.', 'Утро — пора труда.', 'Ты — мастер, он — нет.', 'Как-то мы ели торт.', 'Сталь — металл.', 'Все-таки лето.', 'Кое-кто не спал.', 'Лето — не осень, дом — не сад.', 'Мы-то дома, а он в пути.', 'Урал — горы.', 'Москва — город.', 'Мама — доктор.', 'Нева — река, Урал — горы.', 'Кто-то поет, кто-то спит.', 'Где-то далеко — море.', 'Куда-то делись все.', 'Так-то оно так.', 'Понедельник — не вторник.', 'Дед — плотник.', 'Мед — на столе.', 'Кот — на окне, пес — у двери.'],
  'E-26': ['Я был дома.', 'Она была одна.', 'Мы были в лесу.', 'Брат работал, я спал.', 'Ребята пели, а мы спали.', 'Было темно, но тепло.', 'Я была рада.', 'Они были готовы.', 'Было утро, и все спали.'],
  'E-30': ['Кто там?', 'Ты готов?', 'Где мы?', 'Иди домой!', 'Вот беда!', 'Ты спал?', 'Когда поезд?', 'Не надо!', 'Кто здесь?', 'Ура!', 'Ты знал?', 'Зайти к вам?', 'Правда?', 'Стой!', 'Мы опоздали?'],
  'E-33': ['Что там?', 'Что ты делаешь?', 'Почему ты молчишь?', 'Что ты читаешь?', 'Куда ты идешь?', 'Чья книга?', 'Который час?', 'Что случилось?', 'Чего ты боишься?', 'Зачем тебе кот?', 'Что, ты спал?', 'Кто стучит?', 'Чем ты занят?', 'Что ты пишешь?'],
  'E-34': ['«Иди домой!» — сказал он.', '«Кто там?» — спросила она.', '«Я готов», — ответил брат.', 'Она молчала. «Ну и пусть», — думал я.', '«Не спи!» — крикнул кто-то.', 'Так называемая "малина" — не ягода.', '«Вода», — сказала она и указала на реку.', '«Что случилось?» — спросил я.', '«Ничего», — сказала мама.', 'Кто написал «Нос»?', 'Прочитай «Дубровского».', '«Стой!» — сказал он.', '«Ты готов?» — спросил мастер.', '«Да», — ответил я.', '«Нет», — сказала Анна.', '«Кто там?» — «Свои».', 'Он прочитал «Нос» за день.', '«Пора спать», — сказала мама.', '«Не надо!» — крикнула она.', 'Слово "мост" — короткое.', 'Так называемый "план" — просто список.', '«Куда?» — «Домой».'],
  'E-37': ['Хорошо, что ты здесь.', 'Уже поздно, иди спать.', 'Жизнь — игра.', 'Хлеб да соль.', 'Можно войти?', 'Каждый день одно и то же.', 'Ждите здесь, я сейчас.', 'Хочешь чай?', 'Мужчина вошел, а дети вышли.', 'Нужно много угля, а дров мало.', 'Хорошо, когда тихо.', 'Жара, а мы работаем.'],
  'E-40': ['Это мой дом, а это — твой.', 'Эхо в горах.', 'Цель ясна, путь долог.', 'В центре города — музей.', 'Отец читает, мать шьет.', 'Месяц светит, ночь тиха.', 'Кто это? Птица!', 'Цена — не главное.', 'Это конец? Нет, это начало.', 'Улица пуста, лишь ветер.', '«Это мое», — сказал отец.', 'Эй, кто там?'],
  'E-41': ['Вот что нужно: хлеб, соль, вода.', 'День прошел; настала ночь.', 'Система проста (почти).', 'Знай одно: это не конец.', 'Три цели: сталь, стекло, дорога.', 'Он ушел (не сразу); мы остались.', 'Дома (как всегда) тихо; на заводе — шум.', 'Ответ прост: нет.', 'Вход: руда; выход: страницы.', 'Мастер сказал: «Готово».', 'Список: хлеб, молоко, сахар.', 'Итак: мы едем.', 'Он молчал; она ждала.', 'Цена (с доставкой) — сто рублей.', 'Правило простое: думай, потом делай.', 'Три дела: спать, есть, работать.', 'Завод (старый) стоит у реки; новый — за городом.', 'Вопрос: кто? Ответ: никто.', 'Мастер (он же дед) знает все.', 'Тихо; все спят.', 'Смена (ночная) кончилась: идем домой.'],
  'E-44': ['Я люблю кофе.', 'В июле жара.', 'Люди ждут поезда.', 'Фильм был скучным.', 'Февраль — короткий месяц.', 'На юге тепло.', 'Юра любит футбол, а Федя — шахматы.', 'Профессия — фотограф.', 'Утюг горячий, осторожно!', 'Кто это? Юля.', 'Флаг поднят; праздник начался.', 'Фонарь горит, люди идут.'],
  'E-47': ['Всё своё ношу с собой.', 'Ещё чуть-чуть, и мы дома.', 'Щи да каша — пища наша.', 'Объявление на подъезде.', 'Женщина в чёрном пальто ждёт трамвай.', 'Её товарищ — щедрый человек.', 'Подъём в шесть; завтрак в семь.', 'Ёлка стоит, свечи горят.', 'Съезд начался (наконец-то).', 'Плащ мокрый, а сапоги — сухие.', 'Что ещё? Ничего.', 'Мёд, лёд и щи: обед готов.'],
  'E-48': ['В классе 25 человек.', 'Поезд в 5 часов 15 минут.', 'Нам нужно 3 тонны угля и 2 тонны кварца.', 'До станции 12 км.', 'Смена длится 4 часа, а обед — 1 час.', 'В 1345 году здесь был лес.', 'Ответ: 2, 4, 1, 3, 5.', 'Купи 2 хлеба и 1 литр молока.', 'Дом 14, этаж 3.', 'Урок длится 45 минут.', 'Нас было 5, а стало 3.', 'В 2 часа — обед.', 'Ответ на вопрос 4: да.', 'Страница 231, строка 12.', 'У кошки 4 лапы и 1 хвост.', 'Он живет на 5 этаже.', 'Купили 3 билета по 125 рублей.', 'Ждать 15 минут.', 'Всего 4 сезона, 12 месяцев, 52 недели.', 'Идти 2 км, потом 1 км.', 'Три плюс два — 5.'],
  'E-49': ['В 1867 году здесь построили завод.', 'Цена — 90 рублей.', 'Дом № 7, квартира 108.', 'Скорость света — почти 300 000 км в секунду.', 'Год длится 365 дней (или 366).', 'Поезд № 16 отходит в 20:40.', 'За 8 часов — 1000 рублей; за 10 — 1250.', 'Пушкин родился в 1799 году.', 'Байкал — 1642 метра глубиной.', 'Температура: 36,6.', 'Москва основана в 1147 году.', 'В году 12 месяцев и 365 дней.', 'Автобус № 60 идет до вокзала.', 'Это стоит 1 990 рублей.', 'Рост — 178 см, вес — 70 кг.', 'Вылет в 07:45, прилет в 10:20.', 'Квартира 96, домофон 9607.', 'Телефон: 8 800 100 20 30.', 'Число пи — 3,14.', 'Заказ № 4085 готов.', 'Шесть на девять — 54.'],
  'E-50': ['Инженер пишет: «Система проста (почти)». Вход: руда; выход: страницы.', 'В 1799 году родился Пушкин — и русский язык изменился.', 'Что тяжелее: тонна угля или тонна кварца? Ответ прост — пустая вагонетка!', 'Дом № 7 (у реки) продан за 1 250 000 рублей; хозяин доволен.'],
  'E-45': ['ща', 'ще', 'щи', 'ещё', 'тё', 'лё', 'нё', 'объ', 'съе', 'подъ', 'ёт', 'щу'],
  'E-46': ['ещё', 'вещь', 'женщина', 'площадь', 'товарищ', 'объект', 'съезд', 'подъезд', 'объём', 'ёлка', 'всё', 'её', 'мёд', 'лёд', 'тёплый', 'чёрный', 'щука', 'щека', 'помощь', 'объявление', 'плащ', 'ящик', 'счастье', 'подъём', 'мощь'],
};

// Page samples: the first line of a real page for each category and grade,
// so the plan can be judged by reading. Literature is public domain.
const PAGE_SAMPLES = {
  'P-lit-1': 'Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему. (Толстой)',
  'P-lit-2': 'Я помню чудное мгновенье: передо мной явилась ты, как мимолётное виденье, как гений чистой красоты. (Пушкин)',
  'P-lit-3': 'Мороз и солнце; день чудесный! Ещё ты дремлешь, друг прелестный — пора, красавица, проснись. (Пушкин)',
  'P-triv-1': 'У осьминога три сердца, а кровь у него голубая.',
  'P-triv-2': 'Байкал — самое глубокое озеро на Земле: 1642 метра. В нём пятая часть пресной воды планеты.',
  'P-triv-3': 'Транссибирская магистраль — 9289 км, 87 городов, 8 часовых поясов; поезд № 1 идёт 6 дней.',
  'P-tech-1': 'Скорость — это путь, делённый на время. Если путь 120 км, а время 2 часа, скорость равна 60 км в час.',
  'P-tech-2': 'Площадь круга: пи умножить на квадрат радиуса. При радиусе 3 (см) площадь около 28,3 (кв. см).',
  'P-tech-3': 'Алгоритм: 1) прочитать число; 2) если оно чётное — разделить на 2, иначе умножить на 3 и прибавить 1; 3) повторять, пока не получится 1.',
  'P-dia-1': '— Кто там? — Это я, почтальон Печкин. — Что принесли? — Журнал «Мурзилка».',
  'P-dia-2': 'Городничий. Я пригласил вас, господа, с тем, чтобы сообщить вам пренеприятное известие: к нам едет ревизор. (Гоголь)',
  'P-dia-3': '— Отчего люди не летают? — сказала Катерина. — Я говорю: отчего люди не летают так, как птицы? (Островский)',
  'P-let-1': 'Дорогая Анна! Пишу тебе из Омска. Здесь холодно, но работа идёт. Целую, Иван.',
  'P-let-2': 'Уважаемый Пётр Ильич! Благодарю за письмо от 12 мая. Отвечаю по пунктам: 1) да; 2) нет; 3) обсудим при встрече.',
  'P-let-3': 'Здравствуйте! Заказ № 4085 (3 позиции; 12 700 руб.) отправлен 8 июня; трек-номер — в приложении. С уважением, склад.',
  'P-lore-1': 'Плавильня не спит. Она ест руду и отдаёт бронзу, и так весь день.',
  'P-lore-2': 'Говорят, что кран однажды поднял сам себя. Это, конечно, шутка; но с тех пор его табличка гласит: «Не проверять!»',
  'P-lore-3': 'Экзамен на фронтире один: собери машину, запусти её (в 6:00) и уйди спать. Если утром она работает — ты мастер.',
  'PX-math': 'Формула: (х + у) * (х - у) = х^2 - у^2; при х = 7, у = 3 получаем 40 (100% верно).',
  'PX-code': 'если (число % 2 === 0) { печать(`${число} чётное`); } иначе { печать(`нечётное`); } // числа: 0..10',
};

module.exports = {
  course: 'ru',
  scope: {
    letters: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split(''),
    digits: '1234567890'.split(''),
    marks: ['.', ',', '-', '—', '?', '!', ':', ';', '"', '«', '»', '(', ')', '№'],
    caps: true,
    extended: ['%', '*', '+', '=', '/', '\\', '[', ']', '{', '}', '<', '>', '@', '#', '$', '&', '^', '~', '|', '_', '`'],
  },
  lessons: L,
  pages: PAGES,
  authored: AUTHORED,
  pageSamples: PAGE_SAMPLES,
  thresholds: { syllables: 8, words: 25, phrases: 40, phrasesFunc: 3, sentences: 20 },
  pageBase: 21,     // a page of order n sits at column 21 + n: order 1 at C22, where the last letters arrive
  // completion: the easier half of the pages. Every kind once, so every key is
  // practised in every kind of page, and a second of the plain kinds; nothing
  // advanced, no mathematics past the first page. The rest is there to play.
  completion: ['P-lore-1', 'P-let-1', 'P-lit-1', 'P-triv-1', 'P-dia-1', 'P-tech-1', 'P-lore-2', 'P-let-2', 'P-lit-2'],
};
