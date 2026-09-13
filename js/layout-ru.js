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
    Minus: '-', Equal: '=', Backslash: '\\',
    // the digits are keys like any other (lesson plan v4, 2026-09-12)
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
    Space: ' ',
  };

  // code → glyph when Shift is held: the comma on the period key (the
  // layout's signature hurdle), the number row's marks where the standard
  // Russian layout puts them (№ on 3, % on 5, * on 8, + on =), capitals of
  // every letter.
  const SHIFTED_CODE_TO_CHAR = {
    Slash: ',',
    Digit1: '!', Digit2: '"', Digit3: '№', Digit4: ';', Digit5: '%', Digit6: ':', Digit7: '?', Digit8: '*', Digit9: '(', Digit0: ')',
    Equal: '+', Backslash: '/',
  };

  // Glyphs no key on the standard layout produces: the em dash and the
  // guillemets. The game checks the glyph, never the stroke (ruling
  // 2026-09-10): whatever the OS composes — Birman's right Alt strokes, a
  // numpad Alt code, macOS Option — arrives as the character itself, and
  // that is what the listener reads. The hint shown is the Birman stroke.
  const COMPOSED = { '—': 'AltRight+Minus', '«': 'AltRight+Comma', '»': 'AltRight+Period' };
  for (const [code, ch] of Object.entries(CODE_TO_CHAR)) {
    const up = ch.toUpperCase();
    if (up !== ch) SHIFTED_CODE_TO_CHAR[code] = up;
  }

  // Characters that require Shift.
  const NEEDS_SHIFT = new Set(Object.values(SHIFTED_CODE_TO_CHAR));

  // char → code (reverse map; shifted glyphs share their key's code).
  const CHAR_TO_CODE = {};
  for (const [code, ch] of Object.entries(CODE_TO_CHAR)) CHAR_TO_CODE[ch] = code;
  for (const [code, ch] of Object.entries(SHIFTED_CODE_TO_CHAR)) CHAR_TO_CODE[ch] = code;

  window.LAYOUT_RU = Object.assign({}, window.BOARD_ANSI, {
    id: 'ru-jcuken',
    name: 'Русская (ЙЦУКЕН)',
    shortName: 'ЙЦУКЕН',   // the chip on the layout switch
    flag: 'ru',
    CODE_TO_CHAR, SHIFTED_CODE_TO_CHAR, NEEDS_SHIFT, CHAR_TO_CODE, COMPOSED,
  });
})();
