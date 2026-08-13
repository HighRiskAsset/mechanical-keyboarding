// Russian language data: letter frequencies, unlock order, words, phonotactics.
// Global namespace: LANG_RU
(function () {
  'use strict';

  // Letter relative frequency (% of running text), sttmedia.com corpus.
  // '.' and ',' are estimates for item weighting (Russian is comma-heavy).
  const LETTER_FREQ = {
    'о': 11.18, 'е': 8.75, 'а': 7.64, 'и': 7.09, 'н': 6.78, 'т': 6.09,
    'с': 4.97, 'л': 4.96, 'в': 4.38, 'р': 4.23, 'к': 3.30, 'м': 3.17,
    'д': 3.09, 'п': 2.47, 'ы': 2.36, 'у': 2.22, 'б': 2.01, 'я': 1.96,
    'ь': 1.84, 'г': 1.72, 'з': 1.48, 'ч': 1.40, 'й': 1.21, 'ж': 1.01,
    'х': 0.95, 'ш': 0.72, 'ю': 0.47, 'ц': 0.39, 'э': 0.36, 'щ': 0.30,
    'ф': 0.21, 'ё': 0.20, 'ъ': 0.02,
    '.': 1.20, ',': 1.60,
  };

  // Frequency-ordered introduction. Seed = first 6 (≈47% of all text).
  // Period and comma arrive right after the letter core — they matter too much
  // to leave for the very end (and the Shift-comma is the layout's signature
  // stumbling block). ё is promoted ahead of the rare tail for the same reason.
  const UNLOCK_ORDER = [
    'о', 'е', 'а', 'и', 'н', 'т',
    'с', 'л', 'в', 'р', 'к', 'м', 'д', 'п',
    'ы', 'у', 'б', 'я', 'ь', 'г', 'з', 'ч', 'й',
    '.', ',',
    'ж', 'х', 'ш', 'ю', 'ё', 'ц', 'э', 'щ', 'ф', 'ъ',
  ];

  const SEED_COUNT = 6;

  const VOWELS = new Set(['а', 'е', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'ё']);

  // Trainable non-letter items (never used inside generated words).
  const PUNCT = new Set(['.', ',']);

  // Letters that make a collected word a "rare find" in the passport.
  const RARE_LETTERS = new Set(['ф', 'ъ', 'ё', 'щ', 'ц', 'э']);

  // Top bigrams (for M2 bigram items; unused in M1 generator).
  const TOP_BIGRAMS = ['ст', 'но', 'ен', 'то', 'на', 'ов', 'ни', 'ра', 'во', 'ко'];

  // Passport set ids (labels live in i18n).
  const WORD_SETS = ['func', 'verbs', 'people', 'time', 'nature', 'home', 'rail', 'place', 'adj', 'life'];

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
    // --- people & family ---
    ['человек', 'person', 'people'], ['люди', 'people', 'people'], ['мужчина', 'man', 'people'],
    ['женщина', 'woman', 'people'], ['ребенок', 'child', 'people'], ['сын', 'son', 'people'],
    ['дочь', 'daughter', 'people'], ['брат', 'brother', 'people'], ['сестра', 'sister', 'people'],
    ['отец', 'father', 'people'], ['мать', 'mother', 'people'], ['мама', 'mom', 'people'],
    ['папа', 'dad', 'people'], ['семья', 'family', 'people'], ['друг', 'friend', 'people'],
    ['имя', 'name', 'people'], ['глаз', 'eye', 'people'], ['голова', 'head', 'people'],
    ['рука', 'hand, arm', 'people'], ['лицо', 'face', 'people'], ['нос', 'nose', 'people'],
    // --- time & seasons ---
    ['время', 'time', 'time'], ['год', 'year', 'time'], ['день', 'day', 'time'],
    ['ночь', 'night', 'time'], ['утро', 'morning', 'time'], ['вечер', 'evening', 'time'],
    ['час', 'hour', 'time'], ['минута', 'minute', 'time'], ['неделя', 'week', 'time'],
    ['месяц', 'month', 'time'], ['зима', 'winter', 'time'], ['весна', 'spring', 'time'],
    ['осень', 'autumn', 'time'], ['лето', 'summer', 'time'], ['сегодня', 'today', 'time'],
    ['сейчас', 'right now', 'time'], ['теперь', 'now', 'time'], ['потом', 'later, then', 'time'],
    ['первый', 'first', 'time'], ['сон', 'dream, sleep', 'time'],
    // --- nature & world ---
    ['море', 'sea', 'nature'], ['вода', 'water', 'nature'], ['лес', 'forest', 'nature'],
    ['река', 'river', 'nature'], ['гора', 'mountain', 'nature'], ['небо', 'sky', 'nature'],
    ['земля', 'earth, land', 'nature'], ['звезда', 'star', 'nature'], ['дерево', 'tree', 'nature'],
    ['птица', 'bird', 'nature'], ['собака', 'dog', 'nature'], ['кошка', 'cat (f.)', 'nature'],
    ['кот', 'cat', 'nature'], ['рыба', 'fish', 'nature'], ['ёлка', 'fir tree', 'nature'],
    // --- home & food ---
    ['дом', 'house, home', 'home'], ['окно', 'window', 'home'], ['стол', 'table', 'home'],
    ['стул', 'chair', 'home'], ['книга', 'book', 'home'], ['чай', 'tea', 'home'],
    ['хлеб', 'bread', 'home'], ['молоко', 'milk', 'home'], ['мясо', 'meat', 'home'],
    ['яблоко', 'apple', 'home'],
    // --- rails & roads ---
    ['поезд', 'train', 'rail'], ['вагон', 'train car', 'rail'], ['вокзал', 'railway station', 'rail'],
    ['путь', 'way, path', 'rail'], ['билет', 'ticket', 'rail'], ['дорога', 'road', 'rail'],
    // --- cities & places ---
    ['город', 'city', 'place'], ['страна', 'country', 'place'], ['место', 'place', 'place'],
    ['школа', 'school', 'place'], ['сторона', 'side', 'place'],
    // --- describing ---
    ['красивый', 'beautiful', 'adj'], ['новый', 'new', 'adj'], ['старый', 'old', 'adj'],
    ['молодой', 'young', 'adj'], ['маленький', 'small', 'adj'], ['большой', 'big', 'adj'],
    ['белый', 'white', 'adj'], ['черный', 'black', 'adj'], ['красный', 'red', 'adj'],
    ['синий', 'dark blue', 'adj'], ['зеленый', 'green', 'adj'], ['самый', 'the most', 'adj'],
    ['русский', 'Russian', 'adj'], ['быстро', 'quickly', 'adj'], ['медленно', 'slowly', 'adj'],
    ['хорошо', 'good, okay', 'adj'], ['плохо', 'badly', 'adj'],
    // --- life & ideas ---
    ['жизнь', 'life', 'life'], ['дело', 'matter, business', 'life'], ['вопрос', 'question', 'life'],
    ['ответ', 'answer', 'life'], ['совет', 'advice', 'life'], ['свет', 'light', 'life'],
    ['сила', 'strength', 'life'], ['пример', 'example', 'life'], ['работа', 'work', 'life'],
    ['история', 'history, story', 'life'], ['мир', 'world, peace', 'life'], ['язык', 'language, tongue', 'life'],
    ['слово', 'word', 'life'], ['привет', 'hi', 'life'], ['спасибо', 'thank you', 'life'],
    ['сто', 'hundred', 'life'], ['два', 'two', 'life'], ['нота', 'note', 'life'], ['тон', 'tone', 'life'],
  ];

  // Deduplicate (keep first gloss).
  const seen = new Set();
  const WORD_LIST = WORDS.filter(([w]) => (seen.has(w) ? false : (seen.add(w), true)));

  window.LANG_RU = {
    LETTER_FREQ, UNLOCK_ORDER, SEED_COUNT, VOWELS, PUNCT, RARE_LETTERS, TOP_BIGRAMS,
    WORD_SETS, WORDS: WORD_LIST,
  };
})();
