// Small vector flags for the language and layout switches. Emoji flags are
// not an option: Windows ships no country-flag glyphs, so a regional-indicator
// pair renders as the letters "RU". These are drawn instead, on a 21×14 pixel
// grid with every edge on a whole pixel — the same crisp look as the game's
// sprites. That grid is why the stars and stripes carry seven stripes rather
// than thirteen: at this size thirteen is a pink blur, seven reads as itself.
// Add a flag by adding one entry. Global namespace: FLAGS
(function () {
  'use strict';

  const W = 21, H = 14;
  const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

  // Stars and stripes: 7 stripes of 2px, canton over the top four.
  function usa() {
    let out = rect(0, 0, W, H, '#eeeeee');
    for (let y = 0; y < H; y += 4) out += rect(0, y, W, 2, '#b22234');
    out += rect(0, 0, 9, 8, '#3c3b6e');
    for (const y of [1, 3, 5]) for (const x of [1, 4, 7]) out += rect(x, y, 1, 1, '#ffffff');
    return out;
  }

  // Three bands, top to bottom. Heights are given so they land on pixels.
  function bands(top, mid, bottom, hTop, hMid) {
    return rect(0, 0, W, hTop, top)
      + rect(0, hTop, W, hMid, mid)
      + rect(0, hTop + hMid, W, H - hTop - hMid, bottom);
  }

  const BODY = {
    us: usa(),
    ru: bands('#eeeeee', '#0039a6', '#d52b1e', 5, 4),
  };

  // Inline SVG, safe to drop into innerHTML. Decorative: the switch buttons
  // carry the readable name in their label and title.
  function svg(id) {
    const body = BODY[id];
    if (!body) return '';
    return `<svg class="flag" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"`
      + ` shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
  }

  window.FLAGS = { svg, has: (id) => !!BODY[id] };
})();
