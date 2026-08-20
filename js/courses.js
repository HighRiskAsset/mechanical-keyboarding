// Which keyboard the player is learning. A course pairs a layout data file
// (glyphs on the caps, over the shared physical board) with its course data
// (letter frequencies, the curriculum spine, words). Everything else in the
// game reads the active course through here and never touches a LAYOUT_* or
// LANG_* global directly, so a second course is a data drop, not a rewrite.
//
// To add a course: write js/layout-xx.js and js/language-xx.js, then add one
// row below. A course becomes playable the moment both globals exist — the
// switch lists it either way, greyed out while its content is a stub.
// Global namespace: COURSES
(function () {
  'use strict';

  const STORAGE_KEY = 'mk.course';

  // The course whose saves predate the switch; its profiles keep the bare
  // storage key so nobody loses a world. See saveTag().
  const LEGACY_ID = 'ru-jcuken';

  // Order here is the order the switch shows. QWERTY leads so the two
  // switches read as one choice: English interface, English keyboard, both
  // first. ЙЦУКЕН sits beside it, not beneath it.
  const ROWS = [
    { id: 'en-qwerty', layout: 'LAYOUT_EN', course: 'LANG_EN' },
    { id: 'ru-jcuken', layout: 'LAYOUT_RU', course: 'LANG_RU' },
  ];

  const byId = {};
  const list = ROWS.map((row) => {
    const layout = window[row.layout];
    const entry = {
      id: row.id,
      flag: (layout && layout.flag) || null,
      shortName: (layout && layout.shortName) || row.id.toUpperCase(),
      name: (layout && layout.name) || row.id,
      ready: !!(layout && window[row.course] && !window[row.course].stub),   // stub courses stay greyed
      _layout: row.layout,
      _course: row.course,
    };
    byId[entry.id] = entry;
    return entry;
  });

  // The first course that is actually playable takes the default, so QWERTY
  // inherits it the day LANG_EN stops being a stub — no edit here.
  const DEFAULT_ID = (list.find((c) => c.ready) || list[0]).id;

  // engine.js owns this prefix; courses.js only asks whether any save exists.
  const PROFILE_PREFIX = 'mk.profile';

  function hasPlayed() {
    for (let i = 0; i < localStorage.length; i++) {
      if ((localStorage.key(i) || '').startsWith(PROFILE_PREFIX)) return true;
    }
    return false;
  }

  let id = DEFAULT_ID;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && byId[saved] && byId[saved].ready) id = saved;
    // Nothing written down, but a world on disk: this player has been typing
    // on the course the default happened to be, and that counts as choosing
    // it. Pin it now, so the day the default moves to QWERTY their saves do
    // not quietly go looking for a course they never picked. A visitor with
    // no world yet is left unpinned and follows the default wherever it goes.
    else if (!saved && hasPlayed()) localStorage.setItem(STORAGE_KEY, id);
  } catch { /* default stands */ }

  function get() { return id; }
  function active() { return byId[id]; }
  function layout() { return window[byId[id]._layout]; }
  function course() { return window[byId[id]._course]; }

  // Saves are per world *and* per course — a QWERTY frontier is a different
  // game from a ЙЦУКЕН one, so their profiles must not collide.
  function saveTag() { return id === LEGACY_ID ? '' : id + '.'; }

  // Returns true when the course actually changed. The layout and course data
  // are bound once at load, so the caller reloads the page after a switch.
  function set(newId) {
    const next = byId[newId];
    if (!next || !next.ready || newId === id) return false;
    id = newId;
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* non-fatal */ }
    return true;
  }

  window.COURSES = {
    list: () => list.slice(),
    get, set, active, layout, course, saveTag, DEFAULT_ID,
  };
})();
