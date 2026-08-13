// Interface language (not the typing layout). Global namespace: I18N
(function () {
  'use strict';

  const STORAGE_KEY = 'mk.uilang';
  const LEGACY_KEY = 'transsib.uilang'; // pre-rename preference; adopted once
  const DEFAULT_LANG = 'en';

  const STRINGS = {
    en: {
      docTitle: 'Mechanical Keyboarding — learn to type Russian',
      statAccuracy: 'accuracy',
      statWpm: 'WPM',
      statStreak: 'streak',
      statToday: 'today',
      hintNote: 'Read the text and try to recall — the keyboard lights up only if you hesitate.',
      btnSummary: 'summary',
      btnReset: 'reset progress',
      btnPassport: 'passport',
      kmToStation: (p) => `${p.km} km to ${p.name}`,
      kmOdometer: (p) => `${p.km} km`,
      arrivalStation: '🚉 Arrival',
      arrivalKm: (p) => `kilometre ${p.km}`,
      arrivalGo: 'Depart →',
      nightOffer: '🌙 Night run: next block with the keyboard dark — double distance if you finish it.',
      nightAccept: '🌙 Run dark',
      nightDone: (p) => `🌙 Night run complete — ${p.km} km at double rate.`,
      nightFailNote: '🌙 Night run — the keyboard stays dark. A hint appears only after 5 misses on the same key.',
      blockKm: (p) => `+${p.km} km`,
      passportTitle: 'Word passport',
      passportCount: (p) => `${p.have} / ${p.total} words collected`,
      passportRare: 'rare find',
      passportClose: 'Close',
      collectedMark: 'collected',
      setNames: {
        func: 'Little words', verbs: 'Doing words', people: 'People & family',
        time: 'Time & seasons', nature: 'Nature & world', home: 'Home & food',
        rail: 'Rails & roads', place: 'Cities & places', adj: 'Describing', life: 'Life & ideas',
      },
      moneyVal: (p) => `${p.n} ₽`,
      stationNames: {
        practice: 'Practice desk', az: 'Iron Mine', slogi: 'Smelter',
        buki: 'Copper Mine', slova: 'Constructor', vedi: 'Quartz Quarry',
        stroki: 'Assembler', press: 'Freight Depot', board: 'The Hub',
      },
      stationDesc: {
        practice: 'Plain practice — no production, just typing.',
        az: 'Cast азы from the six core letters (о е а и н т).',
        slogi: 'Set syllables (ст, но, ен…). Consumes азы as you type.',
        buki: 'Cast буки from the second letter row (с л в р к м д п).',
        slova: 'Forge whole words. Consumes слоги and буки as you type.',
        vedi: 'Cast веди from the hard row (ы у б я ь г з ч й).',
        stroki: 'Cast full sentence lines. Consumes слова and веди.',
        press: 'Print and earn ₽ — best from строки, or crude handbills from азы.',
      },
      stationShort: {
        practice: '✎', az: 'АЗ', slogi: 'СЛОГИ', buki: 'БУКИ',
        slova: 'СЛОВА', vedi: 'ВЕДИ', stroki: 'СТРОКИ', press: 'ПРЕСС',
      },
      matNames: { az: 'iron ore', buki: 'copper ore', vedi: 'quartz', slogi: 'ingots', slova: 'parts', stroki: 'modules', listy: 'cargo' },
      statusWalk: '← → walk the floor; stand at a bench to work it.',
      statusDry: (p) => `⛔ out of ${p.mats} — walk back and cast more.`,
      statusUpgrade: (p) => `⏎ Enter: automate this bench (${p.cost})`,
      benchAutoStation: '⚙ Automation built',
      benchAutoTitle: (p) => `The ${p.name} now runs itself`,
      benchAutoNote: 'While you type anywhere on the field, this machine keeps producing and sends its output down the belt. Your hands are free for finer work.',
      payoutStation: '🖨 Order complete',
      payoutPay: (p) => `Payment: ${p.pay} ₽`,
      payoutGoods: (p) => p.goods > 0 ? `Automated machines minted +${p.goods} surplus type.` : 'No machines are automated yet — master letters to automate them.',
      payoutAcc: (p) => `Accuracy ${p.acc}% — precision is the wage.`,
      payoutGo: 'Back to the floor →',
      automationStation: '🏭 Automation!',
      automationTitle: (p) => `The «${p.ch}» key is fully automatic`,
      automationNote: 'This letter has become automatic — your fingers handle it without thought. That is real automation: skill your hands run on their own, forever.',
      automationGo: 'Onward →',
      lettersStripTitle: 'Unlocked letters and their readiness',
      chipReadiness: (p) => `${p.ch}: readiness ${p.pct}%`,
      chipNext: (p) => `next letter: ${p.ch}`,
      chipLocked: 'not yet unlocked',
      welcomeStation: '⛏ The Frontier',
      welcomeTitle: 'Mechanical Keyboarding',
      welcomeIntro: 'You\'ve landed on a resource frontier dotted with dormant machines — and every one of them runs on typing. Each letter you learn becomes power: all 33, plus the punctuation Russian can\'t live without. The first six (<b>о е а и н т</b>) are nearly half of all Russian text.',
      welcomeRules: [
        '<b>Walk with the arrow keys.</b> Stand at a machine to run it; each machine is a lesson and produces its material. Higher machines consume lower ones.',
        '<b>Recall first.</b> The keyboard stays dark — read the letter and try to remember. The hint lights up only if you hesitate or miss.',
        '<b>Accuracy beats speed.</b> New letters unlock for precision, not haste.',
        '<b>An error stops the machine.</b> Press the correct key to continue. No Backspace needed.',
        '<b>15–30 minutes a day</b> teaches faster than long marathons.',
        '<b>Hold Space</b> to act wherever you stand — build on a surveyed plot, automate a machine, draw a load from an automated one. A small bar fills; half a second, no accidents.',
      ],
      welcomeGo: 'Power up →',
      unlockStation: '⚡ Unlocked!',
      unlockTitle: (p) => `New letter: <span class="big-letter">${p.upper} ${p.lower}</span>`,
      unlockTitlePunct: (p) => `New key: <span class="big-letter">${p.ch}</span> — ${p.name}`,
      punctNames: { '.': 'period', ',': 'comma' },
      shiftFinger: (p) => `⇧ Shift + ${p.finger}`,
      unlockMeta: (p) => `${p.finger} · ${p.freq}% of all text`,
      unlockNote: 'The new letter will appear in almost every word until you master it.',
      unlockGo: 'Onward →',
      blockStation: 'Leg complete',
      blockLines: (p) => `${p.n} ${p.n === 1 ? 'line' : 'lines'}`,
      sumAccuracy: 'accuracy',
      sumWpm: 'session WPM',
      sumStreak: 'best streak',
      weakLetters: 'Weak letters:',
      progressTo: (p) => `Progress to «${p.ch}»: ${p.pct}%`,
      allUnlocked: 'All letters unlocked!',
      softStop: (p) => `🌅 You've been at it for ${p.min} minutes — a great place to stop. Short daily sessions teach faster than long ones.`,
      blockGo: 'Continue →',
      resetTitle: 'Reset all progress?',
      resetNote: 'All letter statistics will be deleted. This cannot be undone.',
      resetCancel: 'Cancel',
      resetConfirm: 'Yes, reset',
      boardName: 'The Hub',
      boardGloss_m1: 'First contract: deliver 60 iron ore to the Hub. Reward: the Smelter kit.',
      boardGloss_m2: 'Deliver 25 ingots and 60 copper ore. Reward: the Constructor kit.',
      boardGloss_m3: 'Deliver 15 parts and 50 quartz. Reward: the Assembler kit.',
      boardGloss_ed1: 'Phase I: automate the Iron Mine, then ship 3 consecutive flawless lines (97%+) at the Depot.',
      boardGloss_done: 'No open contracts. More arrive with the powered era.',
      milestoneStation: '📋 Contract complete',
      milestoneTitle: 'The Hub pays in kind',
      milestoneNote: (p) => `A kit for the <b>${p.name}</b> is yours. Stand on any surveyed plot and hold Space to erect it — the field is yours to arrange.`,
      editionStation: '✦ Phase I',
      editionTitle: 'The grid comes online',
      editionNote: 'Your flawless shipments powered the grid. Automated machines now feed their belts noticeably faster.',
      fingers: {
        l5: 'left pinky', l4: 'left ring finger', l3: 'left middle finger', l2: 'left index finger',
        r2: 'right index finger', r3: 'right middle finger', r4: 'right ring finger', r5: 'right pinky',
      },
    },
    ru: {
      docTitle: 'Mechanical Keyboarding — учимся печатать по-русски',
      statAccuracy: 'точность',
      statWpm: 'WPM',
      statStreak: 'серия',
      statToday: 'сегодня',
      hintNote: 'Читайте текст и вспоминайте — клавиатура подсветится, только если вы замешкались.',
      btnSummary: 'итоги',
      btnReset: 'сбросить прогресс',
      btnPassport: 'паспорт',
      kmToStation: (p) => `${p.km} км до ст. ${p.name}`,
      kmOdometer: (p) => `${p.km} км`,
      arrivalStation: '🚉 Прибытие',
      arrivalKm: (p) => `${p.km}-й километр`,
      arrivalGo: 'Отправление →',
      nightOffer: '🌙 Ночной перегон: следующий блок с тёмной клавиатурой — двойное расстояние.',
      nightAccept: '🌙 Ехать в темноте',
      nightDone: (p) => `🌙 Ночной перегон пройден — ${p.km} км по двойному тарифу.`,
      nightFailNote: '🌙 Ночной перегон — клавиатура не подсвечивается. Подсказка появится только после 5 промахов на одной клавише.',
      blockKm: (p) => `+${p.km} км`,
      passportTitle: 'Паспорт слов',
      passportCount: (p) => `Собрано слов: ${p.have} / ${p.total}`,
      passportRare: 'редкая находка',
      passportClose: 'Закрыть',
      collectedMark: 'в паспорт',
      setNames: {
        func: 'Маленькие слова', verbs: 'Глаголы', people: 'Люди и семья',
        time: 'Время и сезоны', nature: 'Природа и мир', home: 'Дом и еда',
        rail: 'Рельсы и дороги', place: 'Города и места', adj: 'Описания', life: 'Жизнь и идеи',
      },
      moneyVal: (p) => `${p.n} ₽`,
      stationNames: {
        practice: 'Учебный стол', az: 'Железный рудник', slogi: 'Плавильня',
        buki: 'Медный рудник', slova: 'Конструктор', vedi: 'Кварцевый карьер',
        stroki: 'Сборочный цех', press: 'Грузовое депо', board: 'Штаб',
      },
      stationDesc: {
        practice: 'Просто практика — без производства.',
        az: 'Отливайте азы из шести главных букв (о е а и н т).',
        slogi: 'Набирайте слоги (ст, но, ен…). Расходует азы при наборе.',
        buki: 'Отливайте буки из второго ряда (с л в р к м д п).',
        slova: 'Куйте целые слова. Расходует слоги и буки при наборе.',
        vedi: 'Отливайте веди из трудного ряда (ы у б я ь г з ч й).',
        stroki: 'Отливайте строки со знаками. Расходует слова и веди.',
        press: 'Печатайте за ₽ — лучше из строк, или афишки из азов.',
      },
      stationShort: {
        practice: '✎', az: 'АЗ', slogi: 'СЛОГИ', buki: 'БУКИ',
        slova: 'СЛОВА', vedi: 'ВЕДИ', stroki: 'СТРОКИ', press: 'ПРЕСС',
      },
      matNames: { az: 'железо', buki: 'медь', vedi: 'кварц', slogi: 'слитки', slova: 'детали', stroki: 'модули', listy: 'грузы' },
      statusWalk: '← → ходите по цеху; встаньте у станка, чтобы работать.',
      statusDry: (p) => `⛔ кончились ${p.mats} — вернитесь и отлейте ещё.`,
      statusUpgrade: (p) => `⏎ Enter: автоматизировать стан (${p.cost})`,
      benchAutoStation: '⚙ Автоматика построена',
      benchAutoTitle: (p) => `${p.name} теперь работает сам`,
      benchAutoNote: 'Пока вы печатаете где угодно на поле, эта машина продолжает производить и отправляет продукцию по ленте. Руки свободны для тонкой работы.',
      payoutStation: '🖨 Заказ выполнен',
      payoutPay: (p) => `Оплата: ${p.pay} ₽`,
      payoutGoods: (p) => p.goods > 0 ? `Автоматические машины отлили +${p.goods} литер сверх заказа.` : 'Автоматических машин пока нет — осваивайте буквы до автоматизма.',
      payoutAcc: (p) => `Точность ${p.acc}% — плата за аккуратность.`,
      payoutGo: 'В цех →',
      automationStation: '🏭 Автоматика!',
      automationTitle: (p) => `Клавиша «${p.ch}» — полный автомат`,
      automationNote: 'Эта буква стала автоматической — пальцы набирают её без мысли. Это и есть настоящая автоматизация: навык, который работает сам, навсегда.',
      automationGo: 'Дальше →',
      lettersStripTitle: 'Открытые буквы и их уверенность',
      chipReadiness: (p) => `${p.ch}: готовность ${p.pct}%`,
      chipNext: (p) => `следующая буква: ${p.ch}`,
      chipLocked: 'ещё не открыта',
      welcomeStation: '⛏ Фронтир',
      welcomeTitle: 'Mechanical Keyboarding',
      welcomeIntro: 'Вы высадились на фронтире, усеянном спящими машинами — и все они работают на печати. Каждая выученная буква — это энергия: все 33 и знаки препинания, без которых русский не обходится. Первые шесть (<b>о е а и н т</b>) — почти половина любого текста.',
      welcomeRules: [
        '<b>Ходите стрелками.</b> Встаньте у машины, чтобы запустить её; каждая машина — урок, и каждая производит свой материал. Высшие машины расходуют низшие.',
        '<b>Сначала вспоминайте.</b> Клавиатура тёмная — прочитайте букву и попробуйте вспомнить. Подсказка загорится, только если вы замешкались или ошиблись.',
        '<b>Точность важнее скорости.</b> Новая буква открывается за точность, не за спешку.',
        '<b>Ошибка останавливает машину.</b> Нажмите правильную клавишу, чтобы продолжить. Backspace не нужен.',
        '<b>15–30 минут в день</b> эффективнее долгих марафонов.',
        '<b>Зажмите пробел</b>, чтобы действовать там, где стоите — собрать машину на площадке, автоматизировать её, забрать груз у автомата. Полсекунды — полоска заполнится, случайных нажатий не будет.',
      ],
      welcomeGo: 'Запуск →',
      unlockStation: '⚡ Открыто!',
      unlockTitle: (p) => `Новая буква: <span class="big-letter">${p.upper} ${p.lower}</span>`,
      unlockTitlePunct: (p) => `Новая клавиша: <span class="big-letter">${p.ch}</span> — ${p.name}`,
      punctNames: { '.': 'точка', ',': 'запятая' },
      shiftFinger: (p) => `⇧ Shift + ${p.finger}`,
      unlockMeta: (p) => `${p.finger} · ${p.freq}% всего текста`,
      unlockNote: 'Новая буква будет появляться почти в каждом слове, пока не освоится.',
      unlockGo: 'Поехали →',
      blockStation: 'Перегон пройден',
      blockLines: (p) => {
        const n = p.n, m10 = n % 10, m100 = n % 100;
        const word = (m10 === 1 && m100 !== 11) ? 'строка'
          : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? 'строки' : 'строк';
        return `${n} ${word}`;
      },
      sumAccuracy: 'точность',
      sumWpm: 'WPM за сессию',
      sumStreak: 'лучшая серия',
      weakLetters: 'Слабые буквы:',
      progressTo: (p) => `До буквы «${p.ch}»: ${p.pct}%`,
      allUnlocked: 'Все буквы открыты!',
      softStop: (p) => `🌅 Вы занимаетесь уже ${p.min} минут — отличное место, чтобы остановиться. Короткие ежедневные сессии учат быстрее длинных.`,
      blockGo: 'Дальше →',
      resetTitle: 'Сбросить весь прогресс?',
      resetNote: 'Статистика всех букв будет удалена. Это действие необратимо.',
      resetCancel: 'Отмена',
      resetConfirm: 'Да, сбросить',
      boardName: 'Штаб',
      boardGloss_m1: 'Первый контракт: сдайте 60 железа в Штаб. Награда: набор плавильни.',
      boardGloss_m2: 'Сдайте 25 слитков и 60 меди. Награда: набор конструктора.',
      boardGloss_m3: 'Сдайте 15 деталей и 50 кварца. Награда: набор сборочного цеха.',
      boardGloss_ed1: 'Фаза I: автоматизируйте железный рудник и отгрузите 3 безупречные строки (97%+) в депо.',
      boardGloss_done: 'Открытых контрактов нет. Новые придут с эрой энергосети.',
      milestoneStation: '📋 Контракт выполнен',
      milestoneTitle: 'Штаб платит натурой',
      milestoneNote: (p) => `Набор «<b>${p.name}</b>» ваш. Встаньте на любую размеченную площадку и зажмите пробел — поле расставляете вы.`,
      editionStation: '✦ Фаза I',
      editionTitle: 'Сеть под напряжением',
      editionNote: 'Безупречные отгрузки запитали сеть. Автоматические машины теперь кормят ленты заметно быстрее.',
      fingers: {
        l5: 'левый мизинец', l4: 'левый безымянный', l3: 'левый средний', l2: 'левый указательный',
        r2: 'правый указательный', r3: 'правый средний', r4: 'правый безымянный', r5: 'правый мизинец',
      },
    },
  };

  let lang = DEFAULT_LANG;
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(LEGACY_KEY);
      if (saved) { localStorage.setItem(STORAGE_KEY, saved); localStorage.removeItem(LEGACY_KEY); }
    }
    if (saved && STRINGS[saved]) lang = saved;
  } catch { /* default stands */ }

  function t(key, params) {
    const v = STRINGS[lang][key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
    return typeof v === 'function' ? v(params || {}) : v;
  }

  function fingerName(fingerId) {
    return STRINGS[lang].fingers[fingerId] || fingerId;
  }

  function getLang() { return lang; }

  function setLang(newLang) {
    if (!STRINGS[newLang]) return;
    lang = newLang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* non-fatal */ }
  }

  window.I18N = { t, fingerName, getLang, setLang, LANGS: Object.keys(STRINGS) };
})();
