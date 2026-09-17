// The chrome's pixel art: the walnut window frame with its brass rivets, the
// brass hand cursor, and the three corner icons (gear, wrench, bot). All of
// it is drawn here at load, on a canvas, at an integer scale, and handed to
// css/style.css as custom properties (--frame-img, --cursor-img, --gear-img,
// --wrench-img, --bot-img), so the stylesheet uses them like any image.
//
// Why generated and not PNGs in assets/: the frame is a 9-slice whose panel
// colour must match the stylesheet's, and its grain is a handful of rules,
// so a table here is the honest source. When an artist draws these, point the
// four properties at files in assets/ui/ and delete this file; nothing else
// has to change. Colours are literals mirroring css/style.css (the sheet is
// loaded as print media until it lands, so it cannot be read here).
//
// The plan and the mock: docs/chrome-plan.md, dev/chrome-mock.html.
(() => {
  'use strict';
  const SCALE = 2;                                    // every pixel here is 2x2 on screen
  const PANEL = 'rgba(23, 31, 41, 0.94)';             // --bg-card
  const BRASS = { hi: '#f7dc8e', mid: '#d4a94e', lo: '#8a5c22', ink: '#100a05' };
  const WOOD = ['#100a05', '#b47d49', '#8a5a33', '#6d4429', '#6d4429', '#5c3822', '#6d4429', '#5c3822', '#4a2b18', '#3d2414', '#1a0f07'];

  // a tiny deterministic generator, so the grain is the same on every load
  const rnd = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // a 9-slice tile: a wood frame T source pixels thick around a panel fill,
  // with a brass rivet in each corner. The stylesheet slices it at T*SCALE.
  function frame(T) {
    const N = T * 4;
    const c = document.createElement('canvas');
    c.width = c.height = N * SCALE;
    const g = c.getContext('2d');
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x * SCALE, y * SCALE, SCALE, SCALE); };
    const r = rnd(7);
    const grain = [];
    for (let i = 0; i < N; i++) grain.push(r());
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = Math.min(x, y, N - 1 - x, N - 1 - y);
        if (d >= T) { px(x, y, PANEL); continue; }
        const along = (d === x || d === N - 1 - x) ? y : x;   // the side bands run with the plank
        let col = d < WOOD.length ? WOOD[d] : 'rgba(0, 0, 0, 0.35)';
        if (d >= 2 && d <= 9) {
          const gv = grain[(along + d * 7) % N];
          if (gv < 0.18) col = '#7d4f2e'; else if (gv > 0.86) col = '#4f3019';
        }
        px(x, y, col);
      }
    }
    const rivet = [' ####  ', '#hhbb# ', '#hbbbb#', '#bbbbs#', '#bbbss#', ' #sss# ', '  ###  '];
    const pal = { '#': BRASS.ink, h: BRASS.hi, b: BRASS.mid, s: BRASS.lo };
    const put = (cx, cy) => rivet.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ' ') px(cx + i, cy + j, pal[ch]); }));
    put(2, 2); put(N - 9, 2); put(2, N - 9); put(N - 9, N - 9);
    return c.toDataURL();
  }

  function sprite(rows, pal, scale) {
    const c = document.createElement('canvas');
    c.width = rows[0].length * scale;
    c.height = rows.length * scale;
    const g = c.getContext('2d');
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === ' ') return;
      g.fillStyle = pal[ch];
      g.fillRect(i * scale, j * scale, scale, scale);
    }));
    return c.toDataURL();
  }

  const PAL = { '#': BRASS.ink, b: BRASS.mid, h: BRASS.hi, s: BRASS.lo, i: '#9fb2b5', r: '#e06a5e' };
  // the cursor: a caret pointing in at the row it sits beside
  const CURSOR = sprite([
    '#       ', '##      ', '#b#     ', '#bb#    ', '#bhb#   ', '#bhhb#  ',
    '#bhb#   ', '#bb#    ', '#b#     ', '##      ', '#       ',
  ], PAL, 3);
  const GEAR = sprite([
    '   ##  ##   ', '  #bb##bb#  ', ' ##bbbbbb## ', '#bbbb##bbbb#', '#bbb#  #bbb#', ' #bb#  #bb# ',
    ' #bb#  #bb# ', '#bbb#  #bbb#', '#bbbb##bbbb#', ' ##bbbbbb## ', '  #bb##bb#  ', '   ##  ##   ',
  ], PAL, 2);
  const WRENCH = sprite([
    '        ##  ', '       #ii# ', '      #i##i#', '      #i# #i', '     #ii#  #', '    #iii#   ',
    '   #iii#    ', '  #iii#     ', ' #iii#      ', '#ii##       ', '#i#         ', ' #          ',
  ], PAL, 2);
  const BOT = sprite([
    '     ##     ', '    #ii#    ', ' ########## ', '#iiiiiiiiii#', '#i#ii##ii#i#', '#i#ii##ii#i#',
    '#iiiiiiiiii#', '#ii#rrrr#ii#', '#iiiiiiiiii#', ' ########## ', '  #ii##ii#  ', '  ##    ##  ',
  ], PAL, 2);

  const rs = document.documentElement.style;
  rs.setProperty('--frame-img', `url(${frame(12)})`);
  rs.setProperty('--cursor-img', `url(${CURSOR})`);
  rs.setProperty('--gear-img', `url(${GEAR})`);
  rs.setProperty('--wrench-img', `url(${WRENCH})`);
  rs.setProperty('--bot-img', `url(${BOT})`);
})();
