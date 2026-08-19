// Standard Russian ЙЦУКЕН layout as a pluggable data file: only the glyphs on
// the caps live here — the slab itself (geometry, fingers, home row) comes
// from BOARD_ANSI. The game maps physical keys (KeyboardEvent.code) to glyphs
// itself, so no OS layout switch is needed. Global namespace: LAYOUT_RU
(function () {
  'use strict';

  // code → unshifted glyph. Slash is the Russian ./, key: '.' plain, ',' shifted.
  const CODE_TO_CHAR = {
    Backquote: 'ё',
    KeyQ: 'й', KeyW: 'ц', KeyE: 'у', KeyR: 'к', KeyT: 'е', KeyY: 'н',
    KeyU: 'г', KeyI: 'ш', KeyO: 'щ', KeyP: 'з', BracketLeft: 'х', BracketRight: 'ъ',
    KeyA: 'ф', KeyS: 'ы', KeyD: 'в', KeyF: 'а', KeyG: 'п', KeyH: 'р',
    KeyJ: 'о', KeyK: 'л', KeyL: 'д', Semicolon: 'ж', Quote: 'э',
    KeyZ: 'я', KeyX: 'ч', KeyC: 'с', KeyV: 'м', KeyB: 'и', KeyN: 'т',
    KeyM: 'ь', Comma: 'б', Period: 'ю', Slash: '.',
    Space: ' ',
  };

  // code → glyph when Shift is held (only the trainable ones).
  const SHIFTED_CODE_TO_CHAR = { Slash: ',' };

  // Characters that require Shift.
  const NEEDS_SHIFT = new Set([',']);

  // char → code (reverse map; ',' shares the Slash key).
  const CHAR_TO_CODE = {};
  for (const [code, ch] of Object.entries(CODE_TO_CHAR)) CHAR_TO_CODE[ch] = code;
  CHAR_TO_CODE[','] = 'Slash';

  window.LAYOUT_RU = Object.assign({}, window.BOARD_ANSI, {
    id: 'ru-jcuken',
    name: 'Русская (ЙЦУКЕН)',
    shortName: 'ЙЦУКЕН',   // the chip on the layout switch
    flag: 'ru',
    CODE_TO_CHAR, SHIFTED_CODE_TO_CHAR, NEEDS_SHIFT, CHAR_TO_CODE,
  });
})();
