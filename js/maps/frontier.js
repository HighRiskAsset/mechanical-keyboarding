// THE FRONTIER — the game proper. One wide open basin of meadow in the middle,
// every biome wrapped around it as a ring, and nothing in the way.
//
// The shape of the world (2026-08-20 rebuild; works and seams re-laid
// 2026-08-21; THE RIM GREW 2026-08-28):
//   · A 60×20-tile grass BASIN sits in the centre. It holds the track, the
//     landing, thirty build sites and the first vein of every ore. Nothing solid
//     stands in it — no cliff, no water, no boulder, not one rock.
//   · The LANDING CLUSTER: the three mines the player starts with — iron,
//     copper, stone — stand around the landing, all three inside the camera
//     the moment the world opens, even at the smallest viewport the zoom
//     will settle on. The basin's other veins sit at its corners and the
//     rest are away in the ring: those are found by looking around.
//   · EVERY BIOME OF THE RING HAS AT LEAST TWO WORKS: twelve of them over
//     the five biomes, forty-three sites, because a biome you can only look
//     at is not a place. Seventy-three sites in all with the basin's thirty,
//     every one a full 3x3 with all four facings legal.
//   · A SEAM LIES THE WAY THE LAND DOES: half the nineteen veins are bedded
//     on end, so the mine that takes them stands 1x2 rather than 2x1.
//   · Six biomes ring it — peaks west, quarry north-west, canyon north-east
//     and east, bog south-east, flats south-west — and none of them is a
//     rectangle. Each fades into the basin through its own ramp of ground
//     kinds (grass → dirt → rock, grass → frost → snow, …) across a front a
//     noise field drags back and forth by half a dozen tiles, so every
//     border wanders and neighbours finger into each other.
//   · The water, ice and tar are blobs, not rects: a noise-wobbled ellipse,
//     with its shore sharing the blob's seed so the sand follows the coast.
//   · Every change of elevation is big and easy. THE GREAT MESA (elev 2) is
//     four blocks reaching different distances south, so its front steps in
//     and out; each step carries a wide flight down, and a cut through the
//     rim gives a way up each side. THE SUMMIT (elev 2) stands in the far
//     north-west corner, the peaks' own high ground. The PEAKS SHELF and the
//     CANYON SHELF are the same idea at elev 1, three blocks each; they are
//     seven tiles of top between their rims, which a site and the air it
//     needs cannot have, so they carry seams and views and no works. So do
//     the two CRYSTAL BENCHES at the top of the canyon and the BADLAND BUTTE
//     in the corner of the flats. The ISLAND in the bog has two lobes and six
//     open crossings, on all four sides.
//   · THE OUTSKIRTS ARE THE INTERESTING PART. Every one of the five outer
//     edges carries a landmark and a seam you have to go out to: the summit
//     and its coal, the mesa's north edge and its stone, the east crystal
//     bench and its quartz, the badland butte and its copper, the reed lagoon
//     and the oil on its shore. Four of the five are a climb.
//   · Nothing is gated. Every crossing carries `free`, so the bridges and the
//     west causeway stand built from the first second.
//   · Every terrain and every obstacle is on show and all of it is out of the
//     way: water, tar, ice, the three wall palettes and every piece of region
//     scenery live in the ring, never in the basin — and never on a works.
//
// THE RIM GREW (user ruling 2026-08-28). The world was 1600×720 and the ring
// was a strip: the quarry and the two southern biomes were eleven or twelve
// rows deep, and a biome that thin is a corridor you cross, not a place you
// work in. It is 1920×960 now, and EVERY tile of the growth went to the rim:
// ten columns east and west, eight rows north and south. The basin did not
// move, change shape, or gain a site: it is the same sixty by twenty it was
// tuned to be, and every landmark in the ring kept its exact relationship to
// it. What the file did was slide the whole world +160, +128 into the larger
// frame (engine.js carries a save across that; see RELAY below) and then fill
// the new depth: a second works in every ring biome, five new seams, and the
// Great Mesa reaching north to the treeline it always wanted.
//
// THE OUTSKIRTS ARE THE INTERESTING PART (user ruling, the same day). The
// first pass at the growth spent the new depth on works and left the deep
// edges as biome floor, which is what a biome IS past the fifteen-tile ramp
// band, and it read as a lot of flat nothing. That is backwards: the corner
// of the world should be the thing worth walking to, not the thing you cross
// to get to the works. So each of the five outer edges got a landmark of its
// own: the SUMMIT, the FLOODED PIT on the mesa, the two CRYSTAL BENCHES, the
// DRY WASH, the BADLAND BUTTE, a second broken CREVASSE, a third TAR SEEP and
// the REED LAGOON, and the five seams the growth added were moved out onto
// them. Four of the five now stand on high ground: the walk to a rim seam is
// a climb, and the belt home from it is a long one. That is the trade the
// edges are for.
//
// MAPKIT.field turns the per-tile decision below back into GROUND rects — the
// schema is still rects, the shapes are not.
(function () {
  'use strict';
  const K = window.MAPKIT;
  const { sc, fbm, noise, field, blob, box, path, anyOf } = K;

  const T = 16;
  const W = 1920, H = 960;
  const COLS = W / T, ROWS = H / T;               // 120 × 60 tiles

  // the open middle, in tiles (inclusive)
  const BASIN = { x0: 30, x1: 89, y0: 20, y1: 39 };

  // ======================================================================
  // regions — the biome ring. The basin is first: it is the home region
  // (the drifting petals live in it). The rest tile the rim exactly, so no
  // tile is ever left unclaimed. A region here sets the cliff palette, the
  // border treeline and the elevation floor; the ground field below decides
  // what the dirt actually looks like, and it pays the rects no mind.
  // ======================================================================
  const REGIONS = [
    { id: 'basin',  x: 480,  y: 320, w: 960, h: 320, elev: 0, base: 'grass', cliff: 'tan',    treeline: ['tree', 'tree2', 'pine'] },
    // the peaks wear GREY rock, not snow: a white cliff on white ground has no
    // height to it, and stone breaking through the snow is what a peak is
    { id: 'peaks',  x: 0,    y: 0,   w: 480, h: 640, elev: 0, base: 'snow',  cliff: 'grey',   treeline: ['snowpine', 'snowpine2', 'spire'] },
    { id: 'quarry', x: 480,  y: 0,   w: 512, h: 320, elev: 0, base: 'rock',  cliff: 'tan',    treeline: ['spire', 'boulder', 'boulder2'] },
    { id: 'canyon', x: 992,  y: 0,   w: 928, h: 320, elev: 0, base: 'shale', cliff: 'violet', treeline: ['spire2', 'deadtree', 'crystal'] },
    { id: 'canyon', x: 1440, y: 320, w: 480, h: 320, elev: 0, base: 'shale', cliff: 'violet', treeline: ['spire2', 'deadtree', 'crystal'] },
    { id: 'flats',  x: 0,    y: 640, w: 992, h: 320, elev: 0, base: 'crack', cliff: 'tan',    treeline: ['boulder', 'scrub', 'boulder2'] },
    { id: 'bog',    x: 992,  y: 640, w: 928, h: 320, elev: 0, base: 'marsh', cliff: 'grey',   treeline: ['deadtree', 'deadtree2', 'reeds'] },
  ];

  // ======================================================================
  // the biome field — biomes as noise, not as rects
  // ======================================================================
  // Each biome reads as a ramp: nearest the basin it is still meadow, then a
  // transition, then its own floor. `rim` says how far out of the basin a
  // point lies (0 at the basin's edge, 1 at the world's), and the ramp is
  // indexed by that, so the change is a band and never a line.
  const RAMPS = {
    peaks:  ['grass', 'frost', 'snow', 'snow'],
    quarry: ['grass', 'dirt', 'rock', 'rock'],
    canyon: ['grass', 'sand', 'shale', 'shale'],
    flats:  ['grass', 'dirt', 'crack', 'crack'],
    bog:    ['grass', 'dirt', 'marsh', 'marsh'],
  };
  // what the top of high ground is made of: wind strips a plateau back to the
  // stone, so a shelf never wears the same coat as the ground at its foot
  const TOP = { peaks: 'rock', quarry: 'rock', canyon: 'rock', flats: 'rock', bog: 'rock' };

  // Which biome's ramp a tile reads from. The basin is not one of them: a tile
  // inside it borrows the ramp of the rim it is nearest, and only its distance
  // decides how far along that ramp it sits — which for the open middle is
  // nowhere at all. So no region rect ever draws a line on the ground.
  const rectAt = (px, py) => {
    for (const r of REGIONS) if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return r.id;
    return 'quarry';
  };
  const REGION_AT = new Array(COLS * ROWS);
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    let sx = tx, sy = ty;
    if (rectAt(tx * T + 8, ty * T + 8) === 'basin') {
      const dl = tx - BASIN.x0, dr = BASIN.x1 - tx, dt = ty - BASIN.y0, db = BASIN.y1 - ty;
      const mn = Math.min(dl, dr, dt, db);
      if (mn === dt) sy = BASIN.y0 - 1;
      else if (mn === db) sy = BASIN.y1 + 1;
      else if (mn === dl) sx = BASIN.x0 - 1;
      else sx = BASIN.x1 + 1;
    }
    REGION_AT[ty * COLS + tx] = rectAt(sx * T + 8, sy * T + 8);
  }

  // How far out of the basin a tile lies, measured in tiles and divided by one
  // band width, the same everywhere, so the north rim changes over the same
  // distance as the west one and no side of the world reads as more crowded
  // than another. The rim is deeper than the band now (2026-08-28): the ramp
  // still finishes fifteen tiles out, and everything past that is the biome's
  // own floor, unmixed. That is the point of the growth: a snowfield you are
  // standing IN rather than a gradient you are crossing.
  const BAND = 15;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  function rim(tx, ty) {
    const d = Math.max(BASIN.x0 - tx, tx - BASIN.x1, BASIN.y0 - ty, ty - BASIN.y1);
    return d <= 0 ? 0 : d / BAND;
  }
  // Two independent wobbles do the work. WHICH biome a tile belongs to is read
  // at a point dragged well off the tile, so the seam between two neighbours
  // wanders and each throws headlands across the other — but a sample that
  // lands in the basin falls back to the tile's own region, so the meadow
  // never leaks outward. HOW FAR ALONG its ramp the tile sits is the rim
  // distance plus a slow noise with a fine one riding on it, and that noise
  // is faded out towards the middle: the basin stays clean grass, the front
  // between meadow and biome is a ragged band, never a line.
  function biomeGround(tx, ty) {
    const wx = Math.round(tx + (fbm(tx * 0.055, ty * 0.055, 17, 2) - 0.5) * 13);
    const wy = Math.round(ty + (fbm(tx * 0.055 + 31, ty * 0.055 + 47, 23, 2) - 0.5) * 7);
    const bio = REGION_AT[clamp(wy, 0, ROWS - 1) * COLS + clamp(wx, 0, COLS - 1)];
    const ramp = RAMPS[bio];
    const high = HIGH[ty * COLS + tx];
    const r0 = rim(tx, ty);
    const n = (noise(tx * 0.032, ty * 0.032, 5) - 0.5) * 1.3
      + (fbm(tx * 0.115, ty * 0.115, 13, 2) - 0.5) * 0.4
      + (fbm(tx * 0.29, ty * 0.29, 9, 2) - 0.5) * 0.2;
    // high ground is bare ground: a plateau reads further along its biome's
    // ramp than the lowland at its foot, and its crown is stripped to stone
    const t = clamp(r0 * 1.35 + high * 0.3 + n * Math.min(1, r0 / 0.22), 0, 0.999);
    const i = Math.floor(t * ramp.length);
    return high && i >= 3 ? TOP[bio] : ramp[i];
  }

  // ======================================================================
  // build sites: thirty in the open basin on an 80px grid, then TWO WORKS in
  // every biome of the ring, so a walk out there ends somewhere you can
  // build a line rather than at one lonely square (user ruling 2026-08-21;
  // the second works per biome came with the rim, 2026-08-28).
  //
  // A site is a 3x3 and it owes the four-facing guarantee: the largest
  // kind seatable every way up, with every port tile and the tile beyond it
  // free. That costs the ground around a site as much as the site — two
  // clear tiles off each side — so sites come on an 80px lattice (three
  // tiles of site, two of air) and never in a rank of their own out in the
  // weeds. Every anchor below is checked by dev/verify.html with the whole
  // map built, so a site can never be a place you walk to and find you
  // cannot use.
  //
  // The rule the ring follows: NO AREA GETS FEWER THAN THREE. A single site
  // on a headland is a place no one has a reason to build on — the belt has
  // nowhere to go, so the outliers were gathered into works of three and
  // four, each within belting distance of itself and of the vein it was
  // put there for. The two elev-1 shelves gave their sites up for it: they
  // are seven tiles of walkable top between their rims, which a 3x3 site
  // and its air cannot have, and they keep their veins instead. High ground
  // carries seams and views; the works stand on the flats. The mesa is the
  // exception: elev 2 and wide enough on top to hold two quarry works.
  //
  // Site ids are positional ('p' + index) and legacy saves name them, so the
  // basin comes first and the 2026-08-21 ring follows it in its old order:
  // p1..p52 are the same ground they have always been. The rim's new works
  // are appended after them.
  // ======================================================================
  const BASIN_COLS = [560, 640, 720, 800, 880, 960, 1040, 1120, 1200, 1280];
  const BASIN_ROWS = [416, 496, 576];
  // ids keep the 'p' prefix: legacy saves and LEGACY tables name them by it
  const SITES = [];
  const site = (x, y, region) => SITES.push({ id: 'p' + (SITES.length + 1), x, y, region });
  for (const y of BASIN_ROWS) for (const x of BASIN_COLS) site(x, y, 'basin');
  // the quarry works — a rank of three across the mesa top, joined by the
  // track that runs over it. Three and not four: a site on high ground has
  // to keep its whole port ring at its own elevation, because a run cannot
  // step off a cliff, and the mesa's shallow notch (block 3) is two rows
  // short of carrying a fourth.
  for (const x of [608, 688, 768]) site(x, 256, 'quarry');
  // the peaks works — two ranks of two on the snowfield under the shelf
  for (const y of [496, 592]) for (const x of [352, 432]) site(x, y, 'peaks');
  // the canyon head works — two ranks of two on the shale bench north of
  // the basin, under the crystal country
  for (const y of [256, 336]) for (const x of [1056, 1136]) site(x, y, 'canyon');
  // the canyon flank works — a rank of three at the foot of the east shelf
  for (const x of [1488, 1568, 1648]) site(x, 624, 'canyon');
  // the tar flats works — a rank of four east of the oil seeps
  for (const x of [624, 704, 784, 864]) site(x, 752, 'flats');
  // the bog works — two ranks of two on the west bank, where the causeway
  // out to the island starts. The island itself still holds its coal vein
  // and nothing else: a mine fits on it, a site and its air do not.
  for (const y of [704, 784]) for (const x of [1024, 1104]) site(x, y, 'bog');

  // ---- the rim's works (2026-08-28) ----
  // One more works in every ring biome, each stood beside the seam the rim
  // gained, so no new vein is a mine with nowhere to send what it raises.
  // the upper mesa: a second rank on the ground the mesa gained when it
  // reached north to the treeline, with the stone seam between the two ranks
  for (const x of [608, 688, 768]) site(x, 176, 'quarry');
  // the west snowfield: two ranks of two out past the shelf's western cut,
  // the far side of the peaks from the basin, with the coal seam below them
  for (const y of [288, 384]) for (const x of [64, 144]) site(x, y, 'peaks');
  // the crystal country: a rank of three along the top of the canyon head,
  // under the border forest where the shale is bare
  for (const x of [1024, 1104, 1184]) site(x, 176, 'canyon');
  // the east shale: two ranks of two out past the canyon shelf, either side
  // of the quartz seam that comes up between them. They stand NORTH of the
  // shelf rather than beside it: a run cannot climb a cliff, so a site whose
  // port ring backs onto the shelf's east rim loses that facing, and this
  // works sits clear of it on level shale.
  for (const y of [272, 368]) for (const x of [1712, 1792]) site(x, y, 'canyon');
  // the lower flats: a second rank of four below the first, on the cracked
  // pan south of both tar seeps
  for (const x of [624, 704, 784, 864]) site(x, 880, 'flats');
  // the south marsh: a rank of three on the far shore of the bog lake,
  // reached over the island's two southern bridges
  for (const x of [1216, 1296, 1376]) site(x, 896, 'bog');

  // ======================================================================
  // ore nodes. Order matters: starterNodes() builds the FIRST node of each
  // tier-0 ore, so iron, copper and stone lead the list.
  //
  // THE LANDING CLUSTER (user ruling 2026-08-20): the three mines the player
  // starts with must all be on screen the moment the world opens. The camera
  // is playerX ± viewW/2 and playerY − viewH/2 − 8, and the viewport can be
  // as small as 300×170 world px — so from the spawn there are 150 px to
  // either side, 93 above and 77 below, and the whole cluster is authored to
  // sit inside that box with room to spare. A mine draws from n.y − 24 (the
  // top of the rig) to n.y + 16 (the foot of its patch), and 36 px wide.
  //
  // Everything after the cluster is a walk: the basin's other veins sit out
  // at its corners, and the deeper ones are away in the biome they belong to.
  //
  // HOW MANY OF EACH IS NOT AUTHORED HERE (DESIGN.md, *Veins follow the
  // tree*). `dev/ore-load.js` spreads the whole bill across every recipe path
  // and reports the ore the map is short of; the cut below (iron 3, copper
  // 4, stone 3, quartz 3, coal 3, oil 3) is what that check wanted on
  // 2026-08-28, and it is short for neither course. It will move again when a
  // recipe does, and it is recomputed rather than remembered.
  //
  // WHERE they go is this file's business. THE BASIN HOLDS ONE OF EVERY ORE
  // AND THE SECOND IRON. That second one stays in reach on purpose: it is
  // the first extra mine the ladder sells, and the purchase that teaches what
  // an extra mine is should not also be a trek. EVERY OTHER SEAM IS OUT IN
  // THE RING, two or three to a biome, and each biome is the place you go for
  // its own ores rather than a copy of its neighbour: iron, copper and coal
  // in the peaks, copper and stone on the mesa, oil and copper on the flats,
  // coal and oil in the bog. The canyon is the exception and earns it: it is
  // two regions wide, and it is quartz country at both ends with the stone
  // seam on the shelf between them.
  // ======================================================================
  // A SEAM LIES THE WAY THE LAND DOES (user ruling 2026-08-21). A mine is
  // two tiles by one, and it may stand across the seam or along it, so half
  // the veins here are bedded on end: `vert` makes the patch 1x2, the
  // surveyed mark 1x2, and the mine that takes it 1x2 (MAPKIT.veinBox, and
  // the patch art in pixels.js, which has always cut both ways). Every
  // anchor sits on a tile line, so a vein's two tiles are exactly the tiles
  // you see, and every one of them is clear of the site lattices above.
  const NODES = [
    { kind: 'iron',   x: 608,  y: 416 },              // ── the landing cluster, all in shot from the spawn
    { kind: 'copper', x: 688,  y: 496, vert: true },
    { kind: 'stone',  x: 768,  y: 416 },
    { kind: 'quartz', x: 496,  y: 352, vert: true },  // ── the basin's corners: found by looking around
    { kind: 'coal',   x: 1360, y: 352 },
    { kind: 'oil',    x: 512,  y: 544, vert: true },
    { kind: 'iron',   x: 1360, y: 544 },
    { kind: 'copper', x: 752,  y: 272, vert: true },  // ── the ring: a reason to walk to each landmark
    { kind: 'stone',  x: 1520, y: 400, vert: true },  // the canyon shelf
    { kind: 'quartz', x: 1552, y: 224 },              // the canyon head, beside the creek
    { kind: 'coal',   x: 1328, y: 704 },              // the island
    { kind: 'oil',    x: 512,  y: 720, vert: true },  // the tar flats
    { kind: 'iron',   x: 272,  y: 304, vert: true },  // the peaks shelf
    { kind: 'copper', x: 224,  y: 464, vert: true },  // the snowfield, out past the tarn
    // ---- the rim's seams (2026-08-28) ----
    // These five are the OUTSKIRTS SEAMS and they are deliberately the
    // furthest things on the map from the landing. Four of the five sit on
    // ground you have to climb (the summit, the mesa's north edge, the east
    // crystal bench, the badland butte), and the fifth is out past the bog
    // lake. A works is never more than a belt run away from its seam, but the
    // walk to stand on one is the longest walk in the world, and that is what
    // an edge is for.
    { kind: 'stone',  x: 640,  y: 80 },               // the mesa's north edge, up under the treeline
    { kind: 'coal',   x: 128,  y: 96,  vert: true },  // the summit, the highest seam on the map
    { kind: 'quartz', x: 1792, y: 96 },               // the east crystal bench, over the east works
    { kind: 'copper', x: 96,   y: 768, vert: true },  // the badland butte, the far south-west
    { kind: 'oil',    x: 1600, y: 832, vert: true },  // the reed lagoon's west shore, past the lake
  ];

  // ======================================================================
  // high ground — a face is two rows at most, every approachable side carries
  // a ramp, and every flight is four tiles wide
  // ======================================================================
  const flight = (x0, y, n) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * T, y, side: 'S' }));
  const sideRamp = (x, y0, n, side) => Array.from({ length: n }, (_, i) => ({ x, y: y0 + i * T, side }));

  const PLATEAUS = [
    // THE GREAT MESA — one elev-2 mass whose north edge runs up under the
    // border forest, so it never shows a back wall. That is a rule of the
    // bake and not a preference: tiles.js only skips the north rim above the
    // treeline (row 3), so when the rim grew the mesa had to grow north with
    // it or wake up with a cliff facing the wrong way. It reaches the trees
    // again, eight rows taller, and the ground it gained is the upper quarry
    // works and the stone seam.
    //
    // It is authored as four blocks that reach different distances south: the
    // front of the mesa steps in and out instead of running as one straight
    // wall, and each step carries its own wide flight down. All four tops
    // join from row 3.
    {
      x: 560, y: 48, w: 128, h: 240, elev: 2, face: 2,      // cols 35–42, down to row 17
      ramps: [...flight(576, 288, 3), ...sideRamp(560, 208, 3, 'W')],
    },
    {
      // cols 43–50, the deepest, down to row 19. It used to reach a row
      // further, which put its cliff face on the two rows the basin's north
      // rank needs behind it to face north: a site is only as good as the
      // air around it, so the mesa gave the row back (2026-08-21).
      x: 688, y: 48, w: 128, h: 272, elev: 2, face: 2,
      ramps: [...flight(704, 320, 3)],
    },
    {
      x: 816, y: 48, w: 96, h: 224, elev: 2, face: 2,       // cols 51–56, the shallow notch, row 16
      ramps: [...flight(832, 272, 3)],
    },
    {
      x: 912, y: 48, w: 64, h: 272, elev: 2, face: 2,       // cols 57–60, down to row 19
      ramps: [...flight(912, 320, 3), ...sideRamp(960, 208, 3, 'E')],
    },
    // THE SUMMIT: the far north-west corner, and the only elev 2 outside the
    // mesa. The peaks are named for it and did not have it until the rim grew
    // (2026-08-28): past the ramp band a biome is its own floor and nothing
    // else, so the deep west was eleven columns of flat snow. The outskirts
    // should be the most interesting ground on the map, not the least, so
    // the corner got the highest thing in the world, its north edge under the
    // treeline the way the mesa's is (no back wall), one flight down its face
    // and a stair cut through its east rim. The coal seam is ON it: the walk
    // out here is a climb, and what you climb for is the point of the walk.
    {
      x: 48, y: 48, w: 176, h: 128, elev: 2, face: 2,       // cols 3–13, rows 3–10
      ramps: [...flight(96, 176, 3), ...sideRamp(208, 96, 3, 'E')],
    },
    // THE PEAKS SHELF — elev 1, three blocks of different reach, grey stone
    // breaking through the snow. A flight off each block, a cut up each side.
    {
      x: 224, y: 240, w: 112, h: 144, elev: 1, face: 1,     // cols 14–20, rows 15–23
      ramps: [...flight(256, 384, 3), ...sideRamp(224, 288, 3, 'W')],
    },
    { x: 336, y: 208, w: 64, h: 208, elev: 1, face: 1, ramps: [...flight(336, 416, 3)] },   // cols 21–24, rows 13–25
    {
      x: 400, y: 272, w: 64, h: 96, elev: 1, face: 1,       // cols 25–28, rows 17–22
      ramps: [...flight(416, 368, 3), ...sideRamp(448, 304, 3, 'E')],
    },
    // THE CRYSTAL BENCHES: elev 1, two of them along the very top of the
    // canyon head, with the creek running down between them. Same reason as
    // the summit: the deep north was flat shale from the works to the trees.
    // Each runs up under the treeline, drops a flight south and cuts a stair
    // through its west rim. The east one carries the quartz seam, which is
    // why the east-shale works below it has a climb worth making.
    {
      x: 1264, y: 48, w: 192, h: 112, elev: 1, face: 1,     // cols 79–90, rows 3–9
      ramps: [...flight(1296, 160, 3), ...sideRamp(1264, 80, 3, 'W')],
    },
    {
      x: 1728, y: 48, w: 160, h: 112, elev: 1, face: 1,     // cols 108–117, rows 3–9
      ramps: [...flight(1760, 160, 3), ...sideRamp(1728, 80, 3, 'W')],
    },
    // THE BADLAND BUTTE: elev 1, the far south-west corner of the flats. The
    // cracked pan ran flat to the treeline out there; it has a butte on it
    // now, with the copper seam on top and a stair up its east side.
    {
      x: 48, y: 736, w: 128, h: 112, elev: 1, face: 1,      // cols 3–10, rows 46–52
      ramps: [...flight(80, 848, 3), ...sideRamp(160, 768, 3, 'E')],
    },
    // THE CANYON SHELF — elev 1, violet faces, cut the same way
    {
      x: 1472, y: 368, w: 96, h: 160, elev: 1, face: 1,     // cols 92–97, rows 23–32
      ramps: [...flight(1504, 528, 3), ...sideRamp(1472, 432, 3, 'W')],
    },
    { x: 1568, y: 336, w: 80, h: 224, elev: 1, face: 1, ramps: [...flight(1584, 560, 3)] }, // cols 98–102, rows 21–34
    {
      x: 1648, y: 400, w: 64, h: 112, elev: 1, face: 1,     // cols 103–106, rows 25–31
      ramps: [...flight(1648, 512, 3), ...sideRamp(1696, 432, 3, 'E')],
    },
  ];

  // how high each tile stands — the ground field reads this so a plateau top
  // wears bare stone while the meadow at its foot is still grass
  const HIGH = new Uint8Array(COLS * ROWS);
  for (const p of PLATEAUS) {
    for (let ty = p.y / T; ty < (p.y + p.h) / T; ty++) {
      for (let tx = p.x / T; tx < (p.x + p.w) / T; tx++) HIGH[ty * COLS + tx] = p.elev;
    }
  }

  // freestanding rock — one stub per palette, each in a corner nothing routes
  // through, so the wall art is on show without ever being a gate
  const WALLS = [
    { x: 336,  y: 656, w: 16, h: 80 },   // flats, tan
    { x: 1696, y: 704, w: 16, h: 80 },   // bog, grey: the east corner, past the long bridge
    { x: 1360, y: 192, w: 16, h: 96 },   // canyon, violet
  ];

  // ======================================================================
  // crossings — all free. A `free` crossing was never broken: it is built
  // scenery you walk over, not a repair job.
  // ======================================================================
  const CROSSINGS = [
    { id: 'w1', kind: 'boardwalk', x: 1184, y: 704, w: 96, h: 32, dir: 'h', free: true },  // the causeway out from the west bank
    { id: 'b2', kind: 'bridge', x: 1552, y: 704, w: 112, h: 32, dir: 'h', free: true },    // the long bridge in from the east
    { id: 'b3', kind: 'bridge', x: 1392, y: 640, w: 32, h: 32, dir: 'v', free: true },     // north, mid
    { id: 'b4', kind: 'bridge', x: 1296, y: 640, w: 32, h: 32, dir: 'v', free: true },     // north, west
    { id: 'b5', kind: 'bridge', x: 1392, y: 752, w: 32, h: 48, dir: 'v', free: true },     // south, mid
    { id: 'b6', kind: 'bridge', x: 1488, y: 752, w: 32, h: 48, dir: 'v', free: true },     // south, east
  ];

  // ======================================================================
  // the ground: the biome field, then the water and the tar as blobs, then
  // the few things that really are rectangular because somebody built them
  // ======================================================================
  const LAYERS = [];
  const lay = (kind, test) => LAYERS.push({ kind, test });

  // THE OUTSKIRTS ARE THE INTERESTING PART (user ruling 2026-08-28). Past the
  // ramp band a biome is nothing but its own floor, so growing the rim bought
  // depth and spent it on flat ground. Every one of the five outer edges gets
  // a feature of its own below (a crevasse, a flooded pit, a dry wash, a
  // third seep, a lagoon) on top of the four new landmarks in PLATEAUS. The
  // deep corners are now the ones worth walking to.

  // - the peaks: a frost pan, an ice sheet on it, a tarn frozen into the middle
  lay('frost', blob(19, 32.5, 7.6, 4.4, 51, 0.34));
  lay('ice', blob(19, 32, 5.4, 3.1, 53, 0.36));
  lay('water', blob(19, 32, 2.6, 1.4, 57, 0.42));
  // and a second, smaller one broken open in the far south-west, under the
  // summit, the corner the peaks works never had a reason to look at
  lay('frost', blob(7, 33, 5.6, 3.6, 63, 0.34));
  lay('ice', blob(7, 33, 4.2, 2.6, 65, 0.36));
  lay('water', blob(7, 33, 1.9, 1.2, 67, 0.42));

  // - the quarry: a pit on the mesa's north-east that filled with rain. The
  // mesa top is the whole quarry now that it reaches the treeline, and a
  // plateau with nothing on it is a plateau nobody crosses twice.
  lay('sand', blob(56, 5.5, 3.2, 2.2, 81, 0.3));
  lay('water', blob(56, 5.5, 2.1, 1.4, 81, 0.3));

  // - the canyon: a creek at the head of it, sand banks either side. It runs
  // the full depth of the head now: the creek came out of the border forest
  // when the head was nine rows deep and it still does at seventeen.
  const creekX = (ty) => 103 + (fbm(0.5, ty * 0.38, 61, 2) - 0.5) * 3.4;
  lay('sand', (tx, ty) => ty >= 3 && ty <= 20 && Math.abs(tx + 0.5 - creekX(ty)) < 2.6);
  lay('water', (tx, ty) => ty >= 4 && ty <= 18 && Math.abs(tx + 0.5 - creekX(ty)) < 1.1);
  // and the wash the creek cut before it moved: a dry bed of sand wandering
  // down the far south-east corner, from the shelf's foot to the treeline
  lay('sand', path('v', 24, 39, 112, 111, 3.2, 3));

  // - the bog: the lake, and the two-lobed island standing well out in it. The
  // lake and its beach share a seed, so the sand follows every bay the water
  // cuts; the island's two lobes share theirs with their own shore. The lake
  // was pulled five tiles east and shortened by as much in the 2026-08-21
  // rework: it kept its east shore and its whole shape, and gave up the west
  // end — fourteen columns of marsh the bog works stand on. Everything that
  // rode on it (island, bridges, causeway, the island's pad, the coal seam)
  // moved the same five tiles, so the crossings still meet what they met.
  lay('sand', blob(88, 45, 13.8, 4.8, 71, 0.15));
  lay('water', blob(88, 45, 13, 4.2, 71, 0.15));
  lay('sand', anyOf(blob(85, 44.5, 6, 2.15, 73, 0.2), blob(91, 44.5, 5.8, 2.15, 74, 0.2)));
  lay('grass', anyOf(blob(85, 44.5, 5.4, 1.8, 73, 0.2), blob(91, 44.5, 5.2, 1.8, 74, 0.2)));

  // - a marsh pool in the south-east corner, to walk around
  lay('sand', blob(104, 43, 4, 2.4, 79, 0.34));
  lay('water', blob(104, 43, 3, 1.8, 79, 0.34));
  // - and the reed lagoon below it, filling the corner past the lake: the
  // deepest south-east there is, and the oil seam sits on its west shore
  lay('sand', blob(110, 53, 6.4, 3.6, 83, 0.2));
  lay('water', blob(110, 53, 5.2, 2.7, 83, 0.2));

  // - the flats: tar seeps, and a third one out in the deep south where the
  // pan used to run flat to the trees
  lay('tar', blob(18, 45, 3.2, 1.9, 41, 0.4));
  lay('tar', blob(32.5, 49, 3, 1.5, 43, 0.4));
  lay('tar', blob(20, 56, 2.8, 1.5, 45, 0.4));

  // - built: planking, pads, and the tracks that wander because feet made them
  lay('board', box(976, 672, 48, 16));              // plank walks over the west marsh
  lay('board', box(992, 688, 16, 48));
  lay('dirt', path('h', 36, 59, 15, 83, 2.4, 1));   // the track over the mesa top
  lay('dirt', path('h', 36, 59, 9, 84, 2.4, 1));    // and the upper track, over the ground the mesa gained
  lay('pad', box(912, 192, 64, 32));                // the mesa lookout, on the east block
  lay('dirt', path('h', 31, 88, 26, 87, 3.2, 2));   // the basin track, east to west
  lay('dirt', path('v', 21, 25, 38, 91, 2, 1));     // a spur north to the mesa stairs
  lay('dirt', path('v', 27, 29, 44, 97, 1.4, 1));   // the step down from the track to the landing
  lay('dirt', path('v', 28, 37, 72, 93, 2.4, 1));   // and a spur south to the lake
  lay('pad', box(672, 464, 80, 48));                // the landing
  lay('pad', box(1392, 704, 96, 32));               // the island's own pad

  // - every ore node sits in its own worn dish, lying the way the seam does
  for (const n of NODES) {
    lay('dirt', n.vert
      ? blob((n.x + 8) / T, (n.y + 18) / T, 1.6, 2.3, n.x + n.y, 0.45)
      : blob((n.x + 18) / T, (n.y + 8) / T, 2.3, 1.6, n.x + n.y, 0.45));
  }

  // - a bridge always meets dry land: the two tiles past each end are shore
  for (const c of CROSSINGS) {
    const x0 = c.x / T, y0 = c.y / T, x1 = (c.x + c.w) / T, y1 = (c.y + c.h) / T;
    const ends = c.dir === 'v'
      ? [[x0, y0 - 1, x1, y0], [x0, y1, x1, y1 + 1]]
      : [[x0 - 1, y0, x0, y1], [x1, y0, x1 + 1, y1]];
    for (const [a, b, cc, d] of ends) lay('sand', (tx, ty) => tx >= a && tx < cc && ty >= b && ty < d);
  }

  function groundAt(tx, ty) {
    for (let i = LAYERS.length - 1; i >= 0; i--) if (LAYERS[i].test(tx, ty)) return LAYERS[i].kind;
    return biomeGround(tx, ty);
  }

  const GROUND = field(COLS, ROWS, groundAt);

  // ======================================================================
  // scenery — solid, and every piece of it out in the ring
  // ======================================================================
  // Scenery frames the works; it never stands in one. Where a piece fell
  // inside a new site's air it moved to the nearest edge of the same
  // landmark rather than being dropped — the ring keeps every rock and tree
  // it had (2026-08-21 rework, and again when the rim grew).
  const SCENERY = [
    // the peaks
    sc('snowpine', 12, 13), sc('spire2', 28, 15), sc('snowpine2', 28, 25),
    sc('snowpine', 12, 38), sc('snowpine3', 16, 39), sc('boulder', 25, 38),
    sc('spire', 27, 32), sc('snowpine2', 13, 27), sc('boulder2', 19, 37),
    // the west snowfield, out past the shelf's cut, the far side of the
    // peaks, which used to be four columns of nothing and is a place now.
    // The summit stands over it (cols 3–13, rows 3–10) and its own stones
    // are up there; the rest ring the broken crevasse below.
    sc('spire', 5, 4), sc('spire2', 11, 4), sc('boulder', 4, 9),
    sc('snowpine3', 3, 26), sc('snowpine2', 12, 25), sc('spire', 13, 31),
    sc('snowpine', 12, 39), sc('snowpine2', 3, 38), sc('spire2', 8, 39),
    sc('snowpine3', 7, 19), sc('snowpine', 13, 19), sc('boulder', 2, 13), sc('spire', 2, 34),
    // the quarry: the mesa top west of the notch is the works' ground now,
    // so its rocks stand on the east blocks and on the apron below the west
    // stair — the mesa keeps every piece it had
    sc('rock', 32, 14), sc('boulder2', 32, 18), sc('pine', 55, 14),
    sc('boulder', 58, 11), sc('rock2', 58, 18), sc('spire', 61, 11),
    // the upper mesa, the eight rows it reached north for, and the spoil
    // standing round the flooded pit in its north-east corner
    sc('boulder2', 36, 12), sc('rock', 46, 4), sc('spire', 59, 9),
    sc('boulder', 50, 4), sc('rock2', 59, 3), sc('boulder2', 53, 11),
    // the canyon head
    sc('crystal', 63, 11), sc('spire', 77, 11), sc('deadtree', 78, 17), sc('crystal2', 80, 14),
    sc('spire2', 88, 12), sc('deadtree2', 94, 16), sc('crystal', 98, 18), sc('rock2', 83, 18),
    // the crystal country, along the top of the head, and the two benches
    // over it: the west one carries its crystals, the east one keeps its
    // top clear for the quartz seam and wears them round the edge
    sc('crystal2', 64, 5), sc('spire2', 72, 4), sc('deadtree', 77, 6), sc('crystal', 95, 4),
    sc('crystal', 81, 4), sc('crystal2', 88, 8), sc('spire2', 84, 8),
    sc('crystal2', 116, 4), sc('spire2', 109, 9), sc('crystal', 116, 9),
    // the canyon's east flank and shelf. crystal2 came in two columns off the
    // shelf's shoulder when the east works took the ground it stood on
    sc('crystal', 91, 22), sc('spire', 107, 35), sc('deadtree', 91, 33), sc('crystal2', 105, 19),
    sc('rock', 90, 30), sc('crystal', 98, 32), sc('spire', 104, 28),
    // the east shale, out past the shelf
    sc('crystal', 110, 12), sc('spire2', 117, 22), sc('deadtree2', 108, 38), sc('crystal2', 117, 35),
    sc('crystal', 114, 28), sc('spire2', 110, 31),
    // the oil flats
    sc('scrub', 14, 42), sc('boulder', 18, 49), sc('scrub2', 24, 46), sc('tarpool', 36, 42),
    sc('boulder2', 40, 49), sc('scrub3', 43, 41), sc('scrub', 54, 49), sc('boulder', 57, 42),
    sc('rock', 48, 50), sc('scrub2', 30, 44),
    // the lower flats, below the second seep, and the badland butte standing
    // over the third one in the corner
    sc('scrub3', 26, 55), sc('boulder', 28, 52), sc('tarpool', 36, 56), sc('scrub', 60, 55),
    sc('boulder2', 4, 43), sc('scrub2', 12, 51), sc('rock', 8, 55), sc('scrub', 3, 57),
    sc('boulder', 13, 56),
    // the coal bog — the west bank stays clear for the works
    sc('reeds', 62, 40), sc('deadtree', 61, 49), sc('reeds3', 73, 49),
    sc('reeds2', 99, 47), sc('deadtree2', 101, 46), sc('deadtree', 106, 49), sc('reeds', 98, 40),
    // the island keeps its own little wood
    sc('tree', 89, 43), sc('tree2', 95, 44), sc('rock', 82, 45),
    // the south marsh, the far shore of the lake, and the reed lagoon that
    // fills the corner beyond it
    sc('reeds2', 66, 55), sc('deadtree', 92, 52), sc('reeds', 96, 57), sc('reeds3', 103, 49),
    sc('reeds', 116, 56), sc('deadtree2', 117, 51), sc('reeds2', 102, 57), sc('deadtree', 111, 47),
  ];

  // set dressing — cosmetic, walk-through
  const PROPS = [
    { kind: 'lamppost', x: 584,  y: 406, glow: true },
    { kind: 'lamppost', x: 952,  y: 406, glow: true },
    { kind: 'lamppost', x: 1320, y: 406, glow: true },
    { kind: 'lamppost', x: 1432, y: 712, glow: true },   // on the island's pad, east with it
    { kind: 'lamppost', x: 944,  y: 208, glow: true },   // the mesa lookout, over the upper works
    { kind: 'lamppost', x: 1312, y: 872, glow: true },   // the far shore, where the south bridges land
    { kind: 'sign', x: 680, y: 516 },
    { kind: 'crate', x: 738, y: 470 },
    { kind: 'crate2', x: 748, y: 482 },
    { kind: 'drum', x: 674, y: 470 },
    { kind: 'bush', x: 860, y: 364 },
    { kind: 'bush', x: 1220, y: 628 },
    { kind: 'bush', x: 410, y: 598 },
  ];

  const MAP = {
    FOREST: { n: 48, e: 32, s: 32, w: 32 },
    REGIONS, GROUND, PLATEAUS, WALLS, CROSSINGS, NODES,
  };

  // How often each sky turns up here. Weights, not rates: weather in this game
  // is paint and nothing else, and none of it touches a machine. The frontier
  // carries a snowfield and a bog, so it gets the lot, with a little more snow
  // and fog than a bare meadow would see.
  const WEATHER = { snow: 0.9, fog: 1.2 };

  K.register({
    id: 'frontier', W, H, spawn: { x: 706, y: 480 },
    LEGACY: { slogi: 'p1', slova: 'p2', stroki: 'p3' },
    // The world moved inside a larger frame on 2026-08-28 and a save is moved
    // with it: engine.js reads this once per profile and slides every machine,
    // belt tile and dropped good the same ten columns and eight rows the
    // ground went, so a factory built before the growth comes back standing
    // exactly where it was built. `tag` is what a migrated save remembers; a
    // new one is stamped with it and never shifts.
    RELAY: { tag: 'rim-2026-08-28', dc: 10, dr: 8 },
    MAP, SITES, SCENERY, PROPS, WEATHER,
  });
})();
