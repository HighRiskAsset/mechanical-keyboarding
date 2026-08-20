// The map kit: everything a world file needs to describe itself, plus the
// registry the chain reads. Global namespace: MAPKIT. No PIXI, no CHAIN — a
// map file is data and arithmetic only, so it can be written, read and
// verified on its own.
//
// A world lives in js/maps/<id>.js, ends with MAPKIT.register({...}) and is
// loaded before js/chain.js. Registration order is the order of the picker,
// and the first one registered is the default world.
(function () {
  'use strict';

  const T = 16;

  // ---------- solid scenery ----------
  // Everything stands ON a tile — sc(kind, tx, ty) names the tile under its
  // base; wide kinds (FOOT_W) span that many tiles to the east. The sprite is
  // drawn centred on the footprint with its base on the tile bottom
  // (factory.js); the collision box is the footprint, inset a hair.
  const FOOT_W = { boulder: 2, tarpool: 2 };
  const sc = (kind, tx, ty) => {
    const fw = FOOT_W[kind.replace(/\d+$/, '')] || 1;
    return { kind, tx, ty, fw, box: { x: tx * T + 2, y: ty * T + 3, w: fw * T - 4, h: 12 } };
  };

  // ---------- deterministic noise ----------
  // A world must bake the same way on every machine and every reload — the
  // save remembers where things were built, not what the ground looked like.
  // So no Math.random anywhere: an integer hash, smoothed into value noise.
  function hash(x, y, s) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  function noise(x, y, s) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = smooth(x - x0), fy = smooth(y - y0);
    const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s);
    const c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }
  // fractal sum, normalised back into 0..1
  function fbm(x, y, s, octaves) {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < (octaves || 3); i++) {
      sum += noise(x * f, y * f, s + i * 101) * amp;
      norm += amp;
      amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }

  // ---------- shapes ----------
  // A blob is a noise-wobbled ellipse in tile space: the wobble is read in
  // polar coordinates so it closes on itself (no seam at due east), with a
  // little positional noise on top for a bitten edge. Two blobs sharing a
  // seed wobble in step — that is how a shore follows its water.
  function blob(cx, cy, rx, ry, seed, wob) {
    const w = wob === undefined ? 0.28 : wob;
    return (tx, ty) => {
      const dx = (tx + 0.5 - cx) / rx, dy = (ty + 0.5 - cy) / ry;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1.7) return false;
      const a = Math.atan2(dy, dx);
      const ang = fbm(Math.cos(a) * 2.4 + 5, Math.sin(a) * 2.4 + 5, seed, 3) - 0.5;
      const grain = fbm(tx * 0.34, ty * 0.34, seed + 7, 2) - 0.5;
      return r < 1 + ang * w + grain * 0.16;
    };
  }
  const anyOf = (...tests) => (tx, ty) => tests.some((t) => t(tx, ty));
  // built things stay rectangular — masonry, planking, a laid pad. Pixels in.
  const box = (x, y, w, h) => (tx, ty) => tx >= x / T && tx < (x + w) / T && ty >= y / T && ty < (y + h) / T;
  // A worn path that wanders: `width` tiles across, its centre line drifting.
  // Where the line steps sideways the tile stays filled from the old centre to
  // the new one, so the road never breaks into a dashed line.
  function path(axis, from, to, at, seed, sway, width) {
    const s = sway === undefined ? 2.4 : sway;
    const w = Math.max(1, width || 1);
    const line = (v) => at + Math.round((fbm(v * 0.13, 0.5, seed, 2) - 0.5) * s);
    return (tx, ty) => {
      const along = axis === 'h' ? tx : ty, across = axis === 'h' ? ty : tx;
      if (along < from || along > to) return false;
      const c = line(along), p = line(Math.max(from, along - 1));
      return across >= Math.min(c, p) && across <= Math.max(c, p) + w - 1;
    };
  }

  // ---------- the ground field ----------
  // pick(tx, ty) names the ground kind of one tile (or null to leave the
  // region's own base showing). The tiles come back as GROUND rects, run
  // together along each row so a whole biome costs a handful of rects
  // instead of one per tile — the schema stays rects, the shapes do not.
  function field(cols, rows, pick) {
    const out = [];
    for (let ty = 0; ty < rows; ty++) {
      let run = null;
      for (let tx = 0; tx < cols; tx++) {
        const k = pick(tx, ty);
        if (run && run.kind === k) { run.w += T; continue; }
        if (run) out.push(run);
        run = k ? { kind: k, x: tx * T, y: ty * T, w: T, h: T } : null;
      }
      if (run) out.push(run);
    }
    return out;
  }

  // A worn patch under a station: the plot's own dirt apron. A plot is a 3x3
  // pad anchored at its foot, so the patch is the rows a body stands on and
  // the row in front of it where its outlets are — what a machine and its
  // traffic actually wear away.
  const apron = (x, y, kind) => ({ kind: kind || 'dirt', x, y: y - 32, w: 48, h: 48 });
  // the same for an ore node (the patch art is 36×16 at the node's corner)
  const nodeApron = (x, y, kind) => ({ kind: kind || 'dirt', x: x - 14, y: y - 16, w: 64, h: 48 });

  // ---------- the ground a machine claims ----------
  // A kind's size is [tiles across, tiles deep] and its anchor is the point a
  // plot or a vein names. Turning that into tiles is arithmetic, and it lives
  // here rather than in the renderer because three things need the same
  // answer: factory.js to draw and route, dev/verify.html to check every plot
  // on every map, and a map file to know how much room a pad wants.
  //
  // Anchors fall where the land allows and rarely line up with the grid, so
  // of the windows of the right size the box takes the one the drawn body
  // covers most — that keeps it under the art wherever the machine stands.
  function bestWindow(lo, hi, n) {
    const first = Math.floor(lo / T), last = Math.floor(hi / T);
    const cover = (t) => Math.max(0, Math.min(hi, t * T + T - 1) - Math.max(lo, t * T) + 1);
    let at = first, most = -1;
    for (let s = Math.min(first, last - n + 1); s <= last; s++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += cover(s + k);
      if (sum > most) { most = sum; at = s; }
    }
    return at;
  }
  // the art each size is drawn at: a pixel shy of the tiles on every side but
  // the foot, which is what the machine stands on
  function bodyBox(x, y, w, h) {
    const c0 = bestWindow(x, x + w * T - 3, w), r0 = bestWindow(y - (h * T - 4), y + 1, h);
    return { c0, c1: c0 + w - 1, r0, r1: r0 + h - 1, w, h };
  }
  // ---------- facings (rotation overhaul, 2026-08-20) ----------
  // A machine faces one of the four world sides — the side its whole front,
  // the discharge, looks at — and a quarter turn clockwise steps s → w → n
  // → e (a pipe at the bottom turns up on the left). Everything on the body
  // is body-relative and turns rigidly with it: the front, the machine's own
  // right and left flanks, and the back, which carries no ports.
  const FACINGS = ['s', 'w', 'n', 'e'];
  // the world side each body side looks at, per facing
  const BODY_SIDE = {
    s: { f: 's', r: 'w', l: 'e', b: 'n' },
    w: { f: 'w', r: 'n', l: 's', b: 'e' },
    n: { f: 'n', r: 'e', l: 'w', b: 's' },
    e: { f: 'e', r: 's', l: 'n', b: 'w' },
  };
  // the ground a size takes at a facing: turned sideways, a body stands as
  // many tiles across as it stood deep
  const footprint = (size, facing) =>
    (facing === 'e' || facing === 'w') ? [size[1], size[0]] : [size[0], size[1]];
  // the tile box of a machine seated at `at` = [c0, r0] (its top-left tile)
  const boxAt = (at, size, facing) => {
    const [w, h] = footprint(size, facing);
    return { c0: at[0], c1: at[0] + w - 1, r0: at[1], r1: at[1] + h - 1, w, h };
  };
  // One place on the ring, body-relative so it turns with the machine: the
  // front counts places from the machine's own right hand, each flank counts
  // from its front corner back. A door drawn over a port on the sprite stays
  // over that port at every turn — this table is what makes that true.
  const PORT_TILE = {
    s: { f: (b, k) => [b.c0 + k, b.r1 + 1], r: (b, k) => [b.c0 - 1, b.r1 - k], l: (b, k) => [b.c1 + 1, b.r1 - k] },
    w: { f: (b, k) => [b.c0 - 1, b.r0 + k], r: (b, k) => [b.c0 + k, b.r0 - 1], l: (b, k) => [b.c0 + k, b.r1 + 1] },
    n: { f: (b, k) => [b.c1 - k, b.r0 - 1], r: (b, k) => [b.c1 + 1, b.r0 + k], l: (b, k) => [b.c0 - 1, b.r0 + k] },
    e: { f: (b, k) => [b.c1 + 1, b.r1 - k], r: (b, k) => [b.c1 - k, b.r1 + 1], l: (b, k) => [b.c1 - k, b.r0 - 1] },
  };
  // the step that leads away from the machine, by the world side a port is on
  const PORT_AWAY = { s: [0, 1], e: [1, 0], w: [-1, 0], n: [0, -1] };
  const portTile = (box, facing, bodySide, slot) => PORT_TILE[facing][bodySide](box, slot);
  // a build plot's pad: one size, the 3x3 of tiles that takes the largest
  // kind whichever way it faces, anchored at the plot's foot
  const PAD = 3;
  const padBox = (p) => bodyBox(p.x, p.y, PAD, PAD);

  // ---------- the registry ----------
  const MAPS = {};
  const IDS = [];
  function register(def) {
    if (!def || !def.id) throw new Error('a map needs an id');
    if (!MAPS[def.id]) IDS.push(def.id);
    MAPS[def.id] = def;
    return def;
  }

  window.MAPKIT = {
    T, FOOT_W, sc, hash, noise, fbm, field, apron, nodeApron,
    blob, anyOf, box, path,
    bodyBox, portTile, PORT_AWAY,
    FACINGS, BODY_SIDE, footprint, boxAt, PAD, padBox,
    register, MAPS, IDS,
    get DEFAULT() { return IDS[0]; },
  };
})();
