// MAPPROOF.bake(mapId, outlines) — bake a world for real and hand back the canvas.
// MAPPROOF(mapId, name, sx, sy, sw, sh, scale) — do that and POST
// a PNG of it to assets/inbox/ through the dev server's /upload. Everything is
// drawn the way factory.js draws it (ground chunks, water, cliff band, border
// forest, nodes, scenery, crossings) so the sheet is what the game shows, with
// every plot outlined so placements can be checked at a glance.
// Used by dev/map.html. Not part of the game.
// dev/sky.html grades a slice of this, which is why the bake is its own call.
const bakeWorld = (mapId, outlines) => {
  const T = 16;
  const m = CHAIN.MAPS[mapId];
  const g = TILES.bake(m.MAP, m.W, m.H);
  const full = document.createElement('canvas');
  full.width = m.W; full.height = m.H;
  const x = full.getContext('2d');
  for (const w of g.water) x.drawImage(TILES.fill('water', w.seed, 0), w.x, w.y);
  for (const ch of g.chunks) x.drawImage(ch.canvas, ch.x, 0);

  // everything that sorts by its own z, collected then drawn in order
  const late = [];
  for (const w of g.walls) late.push({ z: w.z, draw: () => x.drawImage(w.canvas, w.x, w.y) });
  for (const cr of m.MAP.CROSSINGS || []) {
    const open = !!cr.free;
    const art = TILES.crossing(cr.kind, cr.w / T, cr.h / T, open, cr.style, cr.x, cr.dir);
    if (art) late.push({ z: open ? -900 : cr.y, draw: () => x.drawImage(art.c, cr.x - (art.dx || 0), cr.y - (art.dy || 0)) });
  }
  for (const n of m.MAP.NODES) late.push({ z: -960, draw: () => x.drawImage(PIXELS.nodeCanvas(n.kind, !!n.vert), n.x, n.y) });

  const F = m.MAP.FOREST || {}, cols = Math.ceil(m.W / T), rows = Math.ceil(m.H / T);
  const regionAt = (px, py) => {
    let hit = m.MAP.REGIONS[0];
    for (const r of m.MAP.REGIONS) if (px >= r.x && px < r.x + r.w && py >= (r.y || 0) && py < (r.y || 0) + (r.h || m.H)) hit = r;
    return hit;
  };
  const plant = (col, row, i, rg, dy) => {
    const kinds = rg.treeline || ['tree', 'tree2'];
    const a = PIXELS.sceneryCanvas(kinds[(i >> 1) % kinds.length]);
    const by = (row + 1) * T - dy;
    late.push({ z: by, draw: () => x.drawImage(a, Math.round(col * T + (T - a.width) / 2), by - a.height) });
  };
  if (F.n) for (let c = 0; c < cols; c++) { const f = c % 2 === 0, r = f ? Math.floor(F.n / T) - 1 : 1; plant(c, r, c, regionAt(c * T + 8, 8), f ? 2 : 4 + ((c >> 1) % 2) * 3); }
  if (F.s) for (let c = 0; c < cols; c++) { const f = c % 2 === 0, r = f ? rows - Math.floor(F.s / T) : rows - 1; plant(c, r, c, regionAt(c * T + 8, m.H - 8), f ? 4 : 2); }
  if (F.w) for (let r = 1; r < rows; r++) { const f = r % 2 === 0, c = f ? Math.floor(F.w / T) - 1 : 0; plant(c, r, r, regionAt(8, r * T + 8), 3); }
  if (F.e) for (let r = 1; r < rows; r++) { const f = r % 2 === 0, c = f ? cols - Math.floor(F.e / T) : cols - 1; plant(c, r, r, regionAt(m.W - 8, r * T + 8), 3); }

  for (const s of m.SCENERY) {
    const a = PIXELS.sceneryCanvas(s.kind);
    const low = /^(rock|boulder|tarpool|scrub|reeds|crystal|spire)/.test(s.kind);
    late.push({ z: low ? s.ty * T : (s.ty + 1) * T, draw: () => x.drawImage(a, Math.round(s.tx * T + (s.fw * T - a.width) / 2), (s.ty + 1) * T - a.height) });
  }
  // the set dressing, on the same z ladder factory.js sorts it on: the sheet is
  // missing a lamppost otherwise, and the sky sheet grades one
  for (const pr of (m.PROPS || [])) {
    const a = PIXELS.propCanvas(pr.kind);
    late.push({ z: pr.y + a.height, draw: () => x.drawImage(a, pr.x, pr.y) });
  }
  late.sort((a, b) => a.z - b.z).forEach((o) => o.draw());

  // every build site outlined on the tiles it actually zones (3×3, MAPKIT.siteBox),
  // and every vein on the two tiles its mine takes (MAPKIT.veinBox), so the
  // sheet shows which seams lie across and which are bedded on end. The sky
  // sheet wants the ground clean, so the outlines are optional.
  if (outlines !== false) {
    x.strokeStyle = 'rgba(255, 230, 140, 0.85)';
    for (const p of m.SITES) {
      const b = MAPKIT.siteBox(p);
      x.strokeRect(b.c0 * T + 0.5, b.r0 * T + 0.5, b.w * T - 1, b.h * T - 1);
    }
    x.strokeStyle = 'rgba(140, 220, 255, 0.85)';
    for (const n of m.MAP.NODES) {
      const b = MAPKIT.veinBox(n);
      x.strokeRect(b.c0 * T + 0.5, b.r0 * T + 0.5, b.w * T - 1, b.h * T - 1);
    }
  }
  return full;
};

window.MAPPROOF = async (mapId, name, sx, sy, sw, sh, scale) => {
  const full = bakeWorld(mapId, true);
  const c = document.createElement('canvas');
  c.width = sw * scale; c.height = sh * scale;
  const q = c.getContext('2d');
  q.imageSmoothingEnabled = false;
  q.drawImage(full, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  return (await fetch('/upload?name=' + name, { method: 'POST', body: blob })).text();
};
window.MAPPROOF.bake = bakeWorld;
