// US English QWERTY layout as a pluggable data file: only the glyphs on the
// caps live here; the slab itself (geometry, fingers, home row) comes from
// BOARD_ANSI. The game maps physical keys (KeyboardEvent.code) to glyphs
// itself, so no OS layout switch is needed. The glyph half of the English
// course (LANG_EN in js/language-en.js carries the course data, TREE_EN the
// lesson plan). Global namespace: LAYOUT_EN
(function () {
  'use strict';

  // code → unshifted glyph. The comma, the period and the apostrophe sit on
  // their own keys here, so unlike ЙЦУКЕН none of the everyday marks needs
  // Shift; the digits are keys like any other (lesson plan v4, 2026-09-15).
  const CODE_TO_CHAR = {
    Backquote: '`',
    Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
    Minus: '-', Equal: '=',
    KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't', KeyY: 'y',
    KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
    KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g', KeyH: 'h',
    KeyJ: 'j', KeyK: 'k', KeyL: 'l', Semicolon: ';', Quote: '\'',
    KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b', KeyN: 'n',
    KeyM: 'm', Comma: ',', Period: '.', Slash: '/',
    Space: ' ',
  };

  // code → glyph when Shift is held: the core marks the plan seats ('?' on
  // the slash key, the same physical stroke as the Russian comma; '!' on 1;
  // ':' above the semicolon; '"' above the apostrophe; the brackets on 9
  // and 0), the rest of the number row and the corner keys for the extended
  // scope, and a capital for every letter.
  const SHIFTED_CODE_TO_CHAR = {
    Backquote: '~',
    Digit1: '!', Digit2: '@', Digit3: '#', Digit4: '$', Digit5: '%', Digit6: '^', Digit7: '&', Digit8: '*', Digit9: '(', Digit0: ')',
    Minus: '_', Equal: '+',
    BracketLeft: '{', BracketRight: '}', Backslash: '|',
    Semicolon: ':', Quote: '"',
    Comma: '<', Period: '>', Slash: '?',
  };
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

  window.LAYOUT_EN = Object.assign({}, window.BOARD_ANSI, {
    id: 'en-qwerty',
    name: 'English (QWERTY)',
    shortName: 'QWERTY',
    flag: 'us',
    CODE_TO_CHAR, SHIFTED_CODE_TO_CHAR, NEEDS_SHIFT, CHAR_TO_CODE,
  });
})();
