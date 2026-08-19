// The physical ANSI keyboard: where the keys sit, which finger owns each one,
// where the hands rest. None of this depends on the glyphs printed on the
// caps — QWERTY and ЙЦУКЕН are the same slab of plastic — so every ANSI
// layout data file shares this board and adds only its own glyph maps.
// Global namespace: BOARD_ANSI
(function () {
  'use strict';

  // Physical geometry (ANSI), in key-units. x = left edge, w = width.
  // `split` per row: keys with x >= split belong to the right hand and are
  // drawn shifted right by the hand gap. Inert keys are rendered for spatial
  // realism but do nothing in M1.
  const KEY_GEOMETRY = [
    { y: 0, split: 6.0, keys: [
      { code: 'Backquote', x: 0 },
      { code: 'Digit1', x: 1, inert: true, label: '1' }, { code: 'Digit2', x: 2, inert: true, label: '2' },
      { code: 'Digit3', x: 3, inert: true, label: '3' }, { code: 'Digit4', x: 4, inert: true, label: '4' },
      { code: 'Digit5', x: 5, inert: true, label: '5' }, { code: 'Digit6', x: 6, inert: true, label: '6' },
      { code: 'Digit7', x: 7, inert: true, label: '7' }, { code: 'Digit8', x: 8, inert: true, label: '8' },
      { code: 'Digit9', x: 9, inert: true, label: '9' }, { code: 'Digit0', x: 10, inert: true, label: '0' },
      { code: 'Minus', x: 11, inert: true, label: '-' }, { code: 'Equal', x: 12, inert: true, label: '=' },
      { code: 'Backspace', x: 13, w: 2, inert: true, label: '⌫' },
    ] },
    { y: 1, split: 6.5, keys: [
      { code: 'Tab', x: 0, w: 1.5, inert: true, label: '⇥' },
      { code: 'KeyQ', x: 1.5 }, { code: 'KeyW', x: 2.5 }, { code: 'KeyE', x: 3.5 },
      { code: 'KeyR', x: 4.5 }, { code: 'KeyT', x: 5.5 }, { code: 'KeyY', x: 6.5 },
      { code: 'KeyU', x: 7.5 }, { code: 'KeyI', x: 8.5 }, { code: 'KeyO', x: 9.5 },
      { code: 'KeyP', x: 10.5 }, { code: 'BracketLeft', x: 11.5 }, { code: 'BracketRight', x: 12.5 },
      { code: 'Backslash', x: 13.5, w: 1.5, inert: true, label: '\\' },
    ] },
    { y: 2, split: 6.75, keys: [
      { code: 'CapsLock', x: 0, w: 1.75, inert: true, label: '⇪' },
      { code: 'KeyA', x: 1.75 }, { code: 'KeyS', x: 2.75 }, { code: 'KeyD', x: 3.75 },
      { code: 'KeyF', x: 4.75 }, { code: 'KeyG', x: 5.75 }, { code: 'KeyH', x: 6.75 },
      { code: 'KeyJ', x: 7.75 }, { code: 'KeyK', x: 8.75 }, { code: 'KeyL', x: 9.75 },
      { code: 'Semicolon', x: 10.75 }, { code: 'Quote', x: 11.75 },
      { code: 'Enter', x: 12.75, w: 2.25, inert: true, label: '⏎' },
    ] },
    { y: 3, split: 7.25, keys: [
      { code: 'ShiftLeft', x: 0, w: 2.25, label: '⇧' },
      { code: 'KeyZ', x: 2.25 }, { code: 'KeyX', x: 3.25 }, { code: 'KeyC', x: 4.25 },
      { code: 'KeyV', x: 5.25 }, { code: 'KeyB', x: 6.25 }, { code: 'KeyN', x: 7.25 },
      { code: 'KeyM', x: 8.25 }, { code: 'Comma', x: 9.25 }, { code: 'Period', x: 10.25 },
      { code: 'Slash', x: 11.25 },
      { code: 'ShiftRight', x: 12.25, w: 2.75, label: '⇧' },
    ] },
    { y: 4, split: null, keys: [
      { code: 'Space', x: 3.75, w: 6.25 },
    ] },
  ];

  // Finger assignment: l5..l2 (left pinky→index), r2..r5 (right index→pinky).
  const FINGER = {
    Backquote: 'l5', Digit1: 'l5', Digit2: 'l4', Digit3: 'l3', Digit4: 'l2', Digit5: 'l2',
    Digit6: 'r2', Digit7: 'r2', Digit8: 'r3', Digit9: 'r4', Digit0: 'r5', Minus: 'r5', Equal: 'r5',
    KeyQ: 'l5', KeyA: 'l5', KeyZ: 'l5',
    KeyW: 'l4', KeyS: 'l4', KeyX: 'l4',
    KeyE: 'l3', KeyD: 'l3', KeyC: 'l3',
    KeyR: 'l2', KeyF: 'l2', KeyV: 'l2', KeyT: 'l2', KeyG: 'l2', KeyB: 'l2',
    KeyY: 'r2', KeyH: 'r2', KeyN: 'r2', KeyU: 'r2', KeyJ: 'r2', KeyM: 'r2',
    KeyI: 'r3', KeyK: 'r3', Comma: 'r3',
    KeyO: 'r4', KeyL: 'r4', Period: 'r4',
    KeyP: 'r5', Semicolon: 'r5', Quote: 'r5', BracketLeft: 'r5', BracketRight: 'r5', Slash: 'r5',
    ShiftLeft: 'l5', ShiftRight: 'r5',
  };

  // Home-row anchor keys (where fingers rest).
  const HOME_CODES = new Set(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']);

  // What the same physical key produces in QWERTY — for intrusion detection
  // when a course teaches a different script on the same board.
  const CODE_TO_QWERTY = {
    KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't', KeyY: 'y',
    KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
    KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g', KeyH: 'h',
    KeyJ: 'j', KeyK: 'k', KeyL: 'l',
    KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b', KeyN: 'n', KeyM: 'm',
  };

  window.BOARD_ANSI = { KEY_GEOMETRY, FINGER, HOME_CODES, CODE_TO_QWERTY };
})();
