// The two switch marks, drawn so they read without words: a globe for the
// language the game speaks, a keyboard for the layout it teaches. A player
// who reads neither English nor Russian should still find both switches on
// the first screen. Line art in currentColor, sized to the switch row.
// Global namespace: ICONS
(function () {
  'use strict';

  const BODY = {
    // globe: outline, equator, one meridian — the "which language" mark
    globe: '<circle cx="11" cy="11" r="8.5"/>'
      + '<path d="M2.5 11h17"/>'
      + '<path d="M11 2.5c3 2.6 4.4 5.6 4.4 8.5S14 17.4 11 19.5C8 17.4 6.6 14.4 6.6 11.5S8 5.1 11 2.5Z"/>',
    // keyboard: the slab itself, three rows of caps and a space bar
    keyboard: '<rect x="1.5" y="4.5" width="19" height="13" rx="2"/>'
      + '<path d="M5 8h1M8.5 8h1M12 8h1M15.5 8h1"/>'
      + '<path d="M5 11h1M8.5 11h1M12 11h1M15.5 11h1"/>'
      + '<path d="M7.5 14.2h7"/>',
  };

  // `label` becomes the accessible name — the words stay for screen readers
  // and as a tooltip, they just stop taking room on screen.
  function svg(id, label) {
    const body = BODY[id];
    if (!body) return '';
    return `<svg class="switch-icon" viewBox="0 0 22 22" width="22" height="22"`
      + ` role="img" fill="none" stroke="currentColor" stroke-width="1.3"`
      + ` stroke-linecap="round" stroke-linejoin="round">`
      + `<title>${label}</title>${body}</svg>`;
  }

  window.ICONS = { svg, has: (id) => !!BODY[id] };
})();
