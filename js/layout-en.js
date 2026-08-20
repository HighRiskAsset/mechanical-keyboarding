// US English QWERTY layout as a pluggable data file — the glyph half of the
// English course (LANG_EN in js/language-en.js carries the curriculum).
// Global namespace: LAYOUT_EN
(function () {
  'use strict';

  // code → unshifted glyph. Comma and period sit on their own keys here, so
  // unlike ЙЦУКЕН nothing punctuation-wise needs Shift.
  const CODE_TO_CHAR = {
    KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't', KeyY: 'y',
    KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p', BracketLeft: '[', BracketRight: ']',
    KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g', KeyH: 'h',
    KeyJ: 'j', KeyK: 'k', KeyL: 'l', Semicolon: ';', Quote: '\'',
    KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b', KeyN: 'n',
    KeyM: 'm', Comma: ',', Period: '.', Slash: '/',
    Backquote: '`', Minus: '-',
    Space: ' ',
  };

  // Shifted glyphs the course trains: '?' at the Fastener's Mk1 (the same
  // physical stroke as the Russian comma), '!' at Mk2, ': " ( )' at Mk3 —
  // and a capital for every letter, handed out by the Crane.
  const SHIFTED_CODE_TO_CHAR = {
    Slash: '?', Digit1: '!', Semicolon: ':', Quote: '"', Digit9: '(', Digit0: ')',
  };
  for (const [code, ch] of Object.entries(CODE_TO_CHAR)) {
    const up = ch.toUpperCase();
    if (up !== ch) SHIFTED_CODE_TO_CHAR[code] = up;
  }

  const NEEDS_SHIFT = new Set(Object.values(SHIFTED_CODE_TO_CHAR));

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
