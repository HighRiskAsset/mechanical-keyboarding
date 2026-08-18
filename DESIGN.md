# Mechanical Keyboarding — Design Document (the one source of truth)

A **language-agnostic touch-typing trainer**, worn as an outdoor machine-frontier
factory game in bright anime-flavored pixel art (style reference since
2026-08-17: SNES RPGs — Final Fantasy III, USA release): **Satisfactory's
production chain with constrained building — the player spends their time
running machines, not planning layouts.** You land on a resource frontier dotted with
dormant machines. Typing is the literal power source.

**Scope: this is not a Russian typing product.** The engine, economy, art, and
pedagogy are independent of any one alphabet or keyboard layout. Russian
ЙЦУКЕН is simply the **first course** — the only one playable today — and
**English QWERTY is committed scope, not a stretch goal.** More
language/layout pairs are expected after. Wherever this document specifies
letters, word lists, or frequency data, that content is *per-course*; the
structure around it is shared.

(Re-themed 2026-08-11 on user direction from «Печатня», an 1890s print works.
Named **Mechanical Keyboarding** 2026-08-13, replacing the «Завод» placeholder.)

## The five invariants (survived every pivot; never trade away)

1. **Typing is the only source of skill and of new production.** Letters,
   readiness and tier bars move only by typing; every current-tier good is
   hand-made; nothing you have not mastered advances without keystrokes. No
   timers, no time pressure ever. (Amended 2026-08-18 with the v3 tree:
   *mastered* production — automated machines and belts — runs on the real
   clock, so old lessons are truly obsolete; that idle is bounded by buffer
   caps and by the fact that the current tier's goods are never automated,
   so waiting can fill the inputs of your next lesson but never pay for your
   next purchase.)
2. **Stations are lessons.** Each machine wraps a drill mode; its letter set
   lights up on the keyboard when you dock. Walking IS the menu — no scene
   switches, no instructional text; icons carry all information. (v3: hold
   Space at a place opens its icon menu — arrows choose, hold Space confirms
   — the same one interact key, still no text.)
3. **Materials are the motor-chunking hierarchy**, displayed as frontier
   resources (v3 ladder): six ores = six fingers (letters, mined at nodes) →
   2-ore ingots (syllables, Smelter) → 3-ore ingots (clusters, Foundry) →
   parts (words, Constructor) → moldings (endings, Molder) / modules
   (phrases, Assembler) → fastened modules (punctuated sentences, Fastener)
   → crates (capitals, Crane) → heavy modules (pages, Manufacturer) → the
   finish. Machines take 1–3 inputs with ratios, 1 output.
   IMPORTANT: internal save ids keep the legacy Slavic names
   (az/buki/vedi/slogi/slova/stroki/listy) — display names live in i18n
   matNames/stationNames, looks in pixels.js matIcon. Renames never touch ids.
4. **Automation is earned honestly, and there is one rule for it.** The
   *curriculum* unlocks by measured skill only (readiness per key-pair; sticky
   automaticity; per-tier bars). The *economy* (mines, Mk upgrades, machines,
   ⚙) is bought from the bag at the place it happens and buys placement and
   convenience, never skill progress. A machine runs a recipe by itself iff it
   has its ⚙, every letter of that recipe's alphabet is sticky-mastered, and
   its input buffers hold a full set; automated recipes refuse labor, and
   un-automated recipes at the same machine still accept it.
5. **Language and layout are data, never assumptions.** This is not a Russian
   product with other languages bolted on later. Everything language-specific
   (letter frequencies, unlock order, phonotactics, word lists, glosses) lives
   in a `language-<code>.js`; everything layout-specific (key geometry, shift
   rules, intrusion mapping) lives in a `layout-<code>.js`. The engine,
   economy, tier structure, and art must hold for any alphabet + layout pair.
   Adding a course means adding two data files, not editing the engine —
   if a change would break that, it is the wrong change.

## Current mechanics (implemented)

- 2D walkable hall (arrows, collision on built machines; ghosts walk-through),
  ~90% of the plan visible at once (430×230 logical @2×, canvas 860×460).
- Docking by proximity. ONE interact key: **hold Space for 0.5s** — a pixel
  charge bar fills over the operator; release early and nothing fires (a tap
  is just a typed space). The hold does whatever the dock offers: build on a
  plot → deliver a contract → automate → collect 100 from an automation →
  lay a belt. Glow turns green when the action is affordable.
- **All game UI is pixels in-canvas**: the inventory HUD (icons + bitmap
  numbers, top-right of the canvas), requirement rows, charge bar. Only the
  page header and the keyboard visualizer are DOM. (The drill text line stays
  DOM for now — it's the reading surface.)
- Per-letter consumption accumulators; dry stations stop producing; belts
  auto-feed only after purchase and only while typing happens.
- Learning engine: hesitation-gated hints (recall first), stop-on-error,
  per-letter EW latency/error stats, min-readiness unlock gates, focus sets
  per bench, word passport with glosses (user reads Cyrillic, little vocab).
- All three tier-1 benches exist from the start; press pays ₽ by accuracy³
  (строки preferred, азы-handbill fallback).
- **One pixel grid, no exceptions**: integer device-pixel upscale with
  letterboxing (roundPixels, whole-pixel camera and sprite positions), bitmap
  pixel font for all in-world text (digits/arrows/₽, ink outline baked),
  pixel-pure circles, one named palette in pixels.js.
- **The operator (redrawn 2026-08-18, SNES FF3 idiom)**: 16×25 hand-authored
  pixel grids in `pixels.js` — big outlined head under the yellow hard hat,
  2×2 eyes (highlight over dark), three tones per material, cream shirt under
  blue overalls, tool belt, boots, a pack on the back; walk = stand / stride
  / stand / stride per direction with a real leg scissor, a 1px body rise on
  the strides and the near arm swinging in profile; work = back view at the
  machine, hands tapping in alternation with a nod. `dev/operator.html` is
  the proof sheet.
- **Charm animation**: 4-frame directional walk (down/up/side) + working pose
  at the bench; 1px machine cast dip; rolling belt links; spark fountains on
  production; paper flutter at the press; window light shafts, drifting dust
  motes, breathing lamp/stove glows; code-drawn props (crates, ink barrel,
  paper bales, stove, wall lamps) inhabit the hall.
- **Sound ladder — one feedback language, NOT per-station instruments** (user
  decision): crisp keystroke tick → pickup pop → inventory count-up ticks
  (the addictive one; numbers animate stepping up) → purchase ka-chunk →
  automation fanfare.
- Side panel inventory with pixel icons; fly-to-inventory animations; float
  "+N"; icon rows sit on dark plates (legible over windows); welcome card
  carries a pixel vignette; EN/РУ interface.
- **Settings menu** (⚙ header button → overlay card): the current world +
  «Change» (back to the map picker); interface language EN/РУ; keyboard
  layout switch (ЙЦУКЕН active, QWERTY a disabled placeholder); save file
  export/import (JSON wrapper `{app, version:1, map, profile, sound,
  uilang}`; the file names its world and imports into that world's slot — a
  pre-maps file lands on the Frontier; import confirms, then reloads); reset
  *this world* (confirm-gated, cancel returns to settings; other worlds
  stand); tip jar with two rails like Sketchmill's free tier (PayPal
  international + YooMoney RU), each rail crowned by glowing gold coin badges
  straddling the button's top edge ($ £ € fan / single ₽) so the relevant
  rail reads before any text. Language toggle and reset live only here — off
  the main screen. The header keeps sound + stats; the footer keeps passport
  + summary.
- **Loading card (2026-08-18)**: static markup in `index.html` inside the
  overlay, on screen from the first paint — before pixi and the game scripts
  have downloaded — so a slow load reads as busy, never frozen. Wordmark, a
  three-cell pixel bar (cell 1 lit at paint, 2 when `app.js` runs, 3 when the
  renderer is up; unlit cells pulse), «Loading… waking the machines / Not
  frozen — the game starts in a moment», and a reload hint that reveals
  itself only after 20 s. Language comes from a two-line inline script that
  reads the saved interface preference. The map picker replaces it.
- **Maps — one save per world (user ruling 2026-08-18).** `CHAIN.MAPS` is a
  registry of worlds; the chain (stations, recipes, milestones, belts) is
  shared, the ground is not: each map brings its own `MAP` rects, `PLOTS`,
  `SCENERY`, `PROPS`, world size, spawn, the hub's spot, and which plot each
  pre-built station stands on (`HOME`). A map changes *where* things are,
  never a rate: yield is not a mechanic (user ruling 2026-08-18 — «plentiful,
  easy resources» means placement, and a ×N multiplier tried that day was
  removed). `CHAIN.useMap(id)`
  makes one current; `FACTORY.loadMap()` tears down and re-plants the
  ground; `ENGINE.loadProfile(mapId)` reads the slot `mk.profile.v1.<map>`
  (the pre-maps `mk.profile.v1` is adopted once into the Frontier's slot;
  `mk.map` remembers the last world). Nothing crosses worlds — materials,
  machines, belts, milestones, *and the letter curriculum*: a save is one
  object, so a fresh world starts at the seed letters (replay value; if the
  skill model should ever be shared across worlds, that is a deliberate
  split of the profile, not a leak). **The session opens on the map picker**
  — a card per world with a pixel minimap baked from the real terrain
  (`TILES.minimap`), the world's promise, its save's progress line, and
  Begin/Continue; the last-played world is focused so Enter resumes at once;
  ← → move, EN/РУ sits on the card. Two worlds today:
  **The Frontier** (`frontier`, 1168×496) — the six-biome snake below, the
  game proper: tests the environments and geographical progression. **Open
  Range** (`range`, 1168×416, the frontier's width) — one flat meadow ringed
  by forest on a 13-column × 4-row station grid (80px pitch): row A holds
  the three mines and the four later nodes in a row by the hub, five free
  plots, and the depot at the east end; ranks B–D hold thirteen free plots
  each (44 free plots in all, generated in code from the grid); the hub
  sits west, a worn road runs under row A hub→depot, nothing stands in any
  route, a pond in the SE corner for colour: tests the mechanics (build,
  deliver, automate, belt, edition) without walking or gating, with room for
  the whole 14-machine tree and then some. Adding a world = a new entry in
  `MAPS` + two i18n strings (name, tagline).
- **Dynamic viewport**: fills all space the drill + keyboard don't need, at
  the largest integer zoom that keeps ≥300×170 world px visible — bigger
  window means bigger pixels first, then more world. Never letterboxes more
  than one integer step.
- **Building = chosen plots (user ruling 2026-08-11)**: the chain is authored
  (what stations exist and what they consume/produce IS the curriculum), but
  the player picks WHICH free dashed plot each earned kit occupies. Solid
  scenery (columns, stock mountains, scrap heaps) makes routes uneven — map
  variance, bounded strategy, never ratio planning. Data-driven (PLOTS +
  SCENERY in chain.js) so it carries to any future map. (Superseded in
  direction 2026-08-18 by v3 rule 6: the player chooses which machine
  occupies each plot from a build menu, paid from the bag; kits and the Hub
  go. Implemented behaviour is still the kit flow until the build plan's
  phase 2 lands.)
- **Milestone board («Контора») & Издания v1**: a notice board station shows
  the current commission as an icon row (goal → reward); Enter delivers
  materials; rewards are KITS for tier-2+ stations (still curriculum-gated by
  unlockAt). The era's final milestone is an ИЗДАНИЕ — it cannot be
  hand-stocked: it demands an automated азы base plus 3 consecutive live
  press pages at ≥97%, and advances the era (hand → steam: automated benches
  feed belts 0.5 → 0.8 per keystroke-pair).

## The outdoor pivot — SHIPPED 2026-08-11

- Tilemap world on a **16×16 square tile grid** (`PIXELS.TILE`; was 16×12
  until 2026-08-17; world = 33×15 tiles): grass base with wildflowers, dirt
  work-aprons under machines, an unwalkable pond, ore nodes beneath the mines,
  a treeline border, solid trees/rocks shaping routes. All data in chain.js
  `MAP` (DIRT/WATER/NODES rects, grid-aligned) + `SCENERY` — a new map is a
  new set of rects.
- Machine roster: hand drill rigs → powered mines (tier-1, on nodes, fixed);
  Smelter / Constructor / Assembler kits on chosen plots; Freight Depot with
  a working crane; the Hub (roofed contract board). Anime-bright palette:
  cream + teal machines, gold accents, chibi engineer with hard hat.
- Milestones = Hub contracts; the era edition = «Фаза I» (grid power).
  Drifting petals replaced dust motes; lampposts replaced light shafts.
- **Requirement rows (UX)**: docking any machine shows what Enter can do
  there as an icon row — ⚙ + automation cost on tier-1, belt cost after
  automation — visible even when unaffordable (dimmed). Fixes "I can't see
  how to automate / build tier 2."

## ENVIRONMENT PLAN (rulings 2026-08-17 — precedes the graphical overhaul)

Environment only: machines, belts, pipes, and any power system are **tabled**
(the user is open to a power system if it serves the typing goal; nothing is
designed). The tech tree is still being planned; region↔tier mapping below
follows the current draft and moves with it.

**Yardstick — 80%+ of play is typing.** Anything in the world that adds a
player *action*, a *decision*, or *walking time* must justify itself against
that. Pure rendering is free. This is why the cuts below were cut.

**Style — SNES RPG, Final Fantasy III (USA) as the reference**, on the existing
one-pixel-grid rules: 16×16 tiles, ¾ top-down; per-tile palette discipline
(few colours per tile, dithered shading on ground); dark outlines on objects,
soft on ground; cliffs as stratified faces with a lit top edge and a base
shadow; water as banded, slowly animated ripples; distinct per-region
palettes the way FF3's areas read at a glance.

**Grid & data.** 16×16 square tiles (`PIXELS.TILE`), world 33×15. Ground is
authored as kinded, grid-aligned rects in chain.js `MAP`, baked to a tile grid
at load and autotiled by neighbour bitmask (to do). Collision from tile flags
for water/cliffs; prop boxes stay for scenery. Nothing here is per-course
(invariant 5).

**Ground kinds (planned):** grass ×3 tints + a worn variant on well-walked
tiles · gravel pad under machines (replaces the dirt apron) · water deep +
shallow ford (walkable) · shore fringes · stream + waterfall · sand · rock
floor / scree · marsh + boardwalk (a look, never a slow-walk penalty) · cracked
earth + tar pool · snow / ice / frost-grass blend · ore patch ×7 (plain, tinted
to region; no purity, no "tells") · auto-laid trail Hub→each built machine
(rendering only; helps "walking is the menu").

**Elevation & routing (approved):** cliff faces + ramps/stairs; bridges (plank,
stone); fords; authored hedges/logs/boulders as soft walls; tunnel mouths.

**Regions (approved — for navigation and memory):** Meadow (T0–1, home) →
Quarry hills (T2) → Crystal canyon (T3) → Coal bog (T4) → Oil flats (T5) →
Titanium peaks (T6). Each: own ground set, palette, ambient particle, one
landmark. Distinct by *look* and adjacent — seconds apart, not a trek.

**Region crossings — stretch goal, Stardew bundle style.** Every region border
is authored with a *closed* crossing (broken bridge over the stream, rockslide
at the canyon mouth, washed-out boardwalk into the bog, snowed-in pass).
Interim: a crossing opens on the previous tier's Издание (the gate the tech
tree already has). Stretch: Hub-board **bundles** — an icon row of slots that
fill *partially* (unlike today's all-or-nothing milestones); completing a
bundle repairs the crossing. Rewards are routes and space for new materials,
not kits. Authoring the choke points now means the mechanic drops in later
without redrawing the map.

**Ambient life (low priority, pure rendering):** birds, butterflies, fireflies
on the lamp toggle, pond ripples, grass sway, cast shadows.

**Cut 2026-08-17:** clearable debris · forage pickups · node purity/tells ·
player-placed fences, paths, or any placement mode (customization that takes
time from typing) · slow terrain · crops · a "launch" finale (finishing the
course is a later question) · a pylon/"typing is power" visual (never a
mechanic; dropped as factory-noise).

**Build order:** 0 grid ✔ → 1 autotile ground/shore/cliff/ramp kit applied to
the meadow ✔ → 2 regions east + 4 ore patches + ~6 plots + closed crossings ✔
→ 3 landmarks → 4 ambient life → stretch: bundle board + partial-fill milestones.

### Environment build 1–2 — SHIPPED 2026-08-18

- **`js/tiles.js` — the terrain kit.** Ground kinds (grass, frost, dirt, sand,
  pad = cobbles, rock, shale, marsh, board, crack, tar, snow, ice, water), each a
  procedural 16×16 fill in the FF3 idiom (jittered lattice of 2px ticks). Edges
  autotile by **priority spill**: a higher kind spills a seeded jagged fringe
  onto its lower neighbour — grass = tufted overhang + green-black outline +
  hanging blades; sand/snow/dirt/pad = soft; rock/shale/ice = outlined; board =
  straight seam + shadow. Water under any spill gets a pale foam rim. Cobble
  pads sit BELOW grass so the grass overhangs them (FF3 paths), low contrast.
  **The cliff band (user ruling 2026-08-18: FF3 never shows a bare edge)**:
  every level change is a band of stacked boulders, one tile thick per row,
  unwalkable — one renderer for plateau **rims** (the N/E/W ring tiles of a
  plateau bake as solid rim), south **faces** (1–2 rows below the plateau) and
  free-standing **walls**. Per side: connected → the mass runs straight through;
  facing the plateau interior → its ground overhangs in dark tufts; open →
  the round stones themselves make the edge — a scalloped crest of lit
  boulder caps on top (never a flat line that could read as a surface), a
  bumpy dark foot below, E = shadow line, plus shade cast on the ground
  below/east. Stairs cut a face; sideways stairs cut a W/E rim. Band tiles
  are sprites sorted by their TOP edge (SNES low-priority rule): a band tile
  beside the operator draws under them, one below draws over — no clipping.
  Closed crossing heaps and low rock-like scenery (rock, boulder, crystal,
  spire, scrub, reeds, tarpool) sort the same way; trees sort by their base
  (you walk under the crown). Scenery is tile-based: `sc(kind, tx, ty)` names
  the tile under its base (wide kinds span 2), the sprite is drawn centred on
  that footprint with its base on the tile bottom, and the hitbox IS the
  footprint. The border forest is two staggered rows on the grid (back row on
  odd columns, front row on even columns with its trunks on the north limit),
  so no bare strip reads as walkable; bands end in their scalloped cap
  against the tree bases (running them up under the trees looked wrong).
  Cliff palettes: tan, grey, violet, snow (+ drift for snowdrifts).
  **Crossings**: bridge / boardwalk (open = walk on it) and pass / drift
  (closed = rockslide or snowdrift heap; open = bare ground). Region scenery:
  pine, snowpine, deadtree, boulder, spire, crystal, scrub, reeds, tarpool;
  meadow tree/rock restyled with outline + lumpy canopy. `bake()` turns
  `CHAIN.MAP` into a tile grid (kind / elev / flags) and ground canvases per
  512px chunk; `passable()` is the walk rule (solid blocks; elevation change
  blocks unless one side is a ramp).
- **`CHAIN.MAP` schema (user ruling 2026-08-18: biomes are placeable, the
  map is never locked to one shape)**: `FOREST` {n,e,s,w} border-forest px
  per side (= the walkable limits); `REGIONS` = biome rects anywhere
  {x,y,w,h, base kind, cliff palette, `elev` (default 0), `face` height where
  it drops (default 2), treeline kinds} — later rects paint over earlier;
  `GROUND` rects (kind); `PLATEAUS` (raised ground within a biome: `elev`,
  face height, ramps S/W/E; the walkable top is the rect inset one tile on
  N/E/W — author with that in mind); `WALLS`; `CROSSINGS` (kind pass | drift
  | bridge | boardwalk | stairs, rect, `opensAfter` edition id, style, `dir`
  'h' walked E–W / 'v' walked N–S — stairs bake as a flight through a face);
  `NODES` ×7. Elevation is multi-level: any drop shows a face on the row(s)
  below in the HIGH biome's cliff palette, any higher edge shows a rim.
  `regionAt(x, y)`; `crossingOpen(profile, c)` — a crossing naming an
  edition that doesn't exist yet is honestly closed. A new map = a new set of
  rects — a `MAPS` entry (see Maps above; the second world, Open Range,
  arrived 2026-08-18 and this layout became **The Frontier**).
- **The world (this layout — a snake, 1168×496 = 73×31 tiles)**. North
  row, high ground (elev 1): **Meadow** (grass, tan) with the pond + sand
  shore, worn road hub→depot with spurs, cobble pads under hub/depot, a
  knoll (plot p8, elev 2) with face + stairs, a tan wall with a gate (x1,
  opens after Издание I) → **Quarry hills** (rock, tan): two terraces (p13
  on top, the stone seam on the other), grass tufts on stone; a bridge (x2)
  over the stream → **Crystal canyon** (shale, violet): stream with a sand
  bank, north wall face, crystals, plot p15, and a **stairs crossing (x3)
  down the two-row face** into the lowlands. South row (elev 0), running back
  west under the north row: **Coal bog** under the canyon (marsh, grey):
  pools, plank walks, reeds, dead trees, coal seam, p16; a grey wall with a
  gap (x4) → **Oil flats** under the quarry (cracked earth, tan): tar pools,
  scrub, a mesa with side stairs, oil seam, p17; a tan wall with a snowdrift
  (x5) → **Titanium peaks** under the meadow (snow): frost patches, an ice
  pond, snowpines, a shelf with a 2-row snow-capped face + stairs and the
  titanium seam, p18. Existing stations untouched; the quartz node stays in
  the meadow until tier 3 lands. Cliff faces along the whole north/south
  drop wear each high biome's palette (tan under meadow/quarry, violet under
  the canyon).
- **`dev/tiles.html`** — proof sheet: bakes synthetic maps through the real
  `bake()` and POSTs a 3× PNG to `/upload` for review. Not linked from the game.
- Verified: no console errors; 17 passability probes (faces, water, walls,
  stairs up/down, side stairs, lips) behave; bake ≈ 8 ms warm.
- Known follow-ups (steps 3–5): landmarks per region (waterfall at the
  stream head, summit), ambient life, tune cobble contrast, HUD rows for the
  four new materials when their machines exist.

## THE TECH TREE (v3, agreed 2026-08-18 — six ores, nine machine kinds, seven tiers)

Supersedes v2 (2026-08-11) in full. The visual twin of this section is
`docs/tech-tree-v3.html` (the review page it was agreed on); the build order
is `docs/build-plan.md`. Everything below is the design; what is *built* today
is still v2 (see "What v3 removes" at the end).

**One sentence:** every lesson is a recipe — what goes into a machine sets its
alphabet, the machine kind sets its grammar; mines start at two keys and grow
by upgrade; automation follows mastery and then runs on its own; belts carry
what machines make; by the end everything mastered works without you while
everything new still needs your hands.

**Targets:** ~32 h to the finish (a floor set by skill gates, not a schedule);
20 key introductions; ~47 distinct lessons; ~110 unlock moments (one every
~17 min); a typical full build ≈ 13 mines, 12 processors, 40 belts.

### The seven rules that generate the tree

If a recipe or a tier disagrees with a rule, the recipe is wrong.

1. **An ore is a finger. A Mk is a reach.** *(LOCKED 2026-08-18.)* Iron,
   copper, stone are the index finger's home, top and bottom rows (the six
   most frequent letters); quartz is the middle finger, coal the ring, oil the
   pinky. An ore's Mk adds the next key-pair on that finger. Pairs are mirror
   keys — same finger, both hands — sorted by frequency. Mk is per ore, not
   per mine: every iron mine drills the same keys. This is course data; the
   EN course will assign its own pairs to the same six ores (F/J = f/j is a
   poor first pair in English).
2. **Alphabet = union of the inputs.** A material's letter set is the union of
   what went into it, computed live from the recipe graph and the current Mk
   levels. Feed a Smelter iron + copper → syllables over а о е н; iron + stone
   → over а о и т. Upgrade iron and every downstream lesson widens (bronze
   @T0 = {а о е н}, @T1 = {а о п р е н}). Strict union stops at parts; from
   moldings on, the alphabet is the full unlocked set and inputs set the
   *focus* (weight and content family) instead.
3. **Grammar = machine kind. Ratio = variance only.** Mine → letters (Mk1:
   two positions, hinted then blind; Mk2+: streams). Smelter → syllables.
   Foundry → clusters. Constructor → words. Molder → endings. Assembler →
   phrases. Fastener → punctuated sentences. Crane → capitals. Manufacturer →
   pages. Each grammar has a minimum alphabet (syllables ≥4 with ≥1 vowel + 1
   consonant · clusters ≥8 · words ≥8 and a measured pool ≥25 real words ·
   endings ≥14 · phrases ≥16 · punct ≥20 · capitals ≥30) and a recipe is only
   offered once its union clears it. Recipes have quantities; a quantity may
   *tilt* sampling (3 iron + 1 coal → iron letters come up more often; capped
   3:1) but never filters a pool — the word bank stays the full union and the
   tilt switches off when a pool is small.
4. **Every deeper recipe carries a flux.** From the Molder on, every recipe
   takes one raw ore or alloy alongside its parts. The flux sets the lesson's
   focus (its letters, its ending family, its word pool) and ties the deep
   machines to old nodes.
5. **The inputs pick the recipe. Kinds are templates.** No dials. A machine
   makes whatever its inputs can pay for — belted into its buffers, or carried
   in the bag when worked by hand. Several instances of a kind exist; a
   smelter's identity is what is belted into it. Docking shows the machine's
   recipes as icon rows; by hand the active one is the affordable recipe
   holding the player's weakest letters, else the newest — carrying only what
   you want forces it; on its own a machine makes what its belts bring.
   Unknown pairs show a ✗ row; recipes are authored, never emergent.
6. **Everything is built from the bag, at the place.** No Hub, no kits, no
   contracts, no Depot. Hold Space at a plot, a node or a machine and its icon
   menu opens: arrows choose, hold Space confirms. A plot lists the machines
   you could build there (greyed when unaffordable; a machine appears once you
   have held the materials it costs, so high tiers stay out of sight until
   reached). A mine lists Mk, ⚙, collect, feed, spool. Each row shows
   curriculum gate (readiness of the letters it waits on) ∧ tier gate (every
   unlocked letter past the previous tier's bar) ∧ price. Materials pay for
   placement, never for progress.
7. **Automation runs on the clock. Skill never does.** What is mastered works
   without you: automated machines and belts run in real time — while you
   walk, build, or have the tab hidden (fast-forward on return). Idle
   production is bounded: buffers cap (~100) and then the machine waits, and
   the current tier's goods are always hand-made (a kind gets ⚙ one tier after
   it arrives), so waiting fills the inputs of your next lesson and never pays
   for your next purchase. Letters, readiness and tier bars move only by
   typing.

### RU course — pairs, ores, tiers (LOCKED)

Sixteen mine events (key-pairs) + four key events at machines = twenty key
introductions. Coverage of running Russian text: T0 47% · T1 71% · T2 86% ·
T3 95% · T4 99% · T5 100%. All six T0 keys are index-finger keys.

| # | Tier | Event | Keys | Curriculum gate | Price at the place (pattern) | Opens |
|---|---|---|---|---|---|---|
| 1 | T0 | Iron Mk1 | а о (F J) | — | pre-built | first two keys, the F/J bumps; iron is the vowel bank |
| 2 | T0 | Copper Mk1 | е н (T Y) | — | pre-built | bronze (2 iron + 1 copper) |
| 3 | T0 | Stone Mk1 | и т (B N) | — | pre-built | cast iron (2 iron + 1 stone); first real words (тот, то, от) |
| 4 | T1 | Quartz node | в л (D K) | 6 letters past bar 0 | 40 bronze + 40 cast iron | middle finger; quartz iron |
| 5 | T1 | Iron Mk2 | п р (G H) | в л ready | 80 iron + 30 bronze | home-row core; bronze/cast iron/quartz iron widen; iron retools |
| 6 | T1 | Quartz Mk2 | с б (C ,) | п р ready | 60 quartz + 40 quartz iron | quartz iron → 8 → Constructor; quartz bronze → 10 → Foundry |
| 7 | T2 | Coal node | ы д (S L) | 12 past bar 1 | 60 parts + 40 quartz iron | ring finger; steel; alphabet ≥14 → Molder |
| 8 | T2 | Copper Mk2 | к г (R U) | ы д ready | 80 copper + 30 steel | copper retools; -ник -ение family |
| 9 | T2 | Stone Mk2 | м ь (V M) | к г ready | 80 stone + 30 steel | stone retools; brass; -ть verbs; ≥16 → Assembler |
| 10 | T3 | Oil node | я . (Z /) | 18 past bar 2 | 60 modules + 40 steel | pinky and the period; black iron; Fastener Mk1 (comma = Shift+/) right after |
| 11 | T3 | Quartz Mk3 | у ш (E I) | я . , ready | 60 quartz + 30 black iron | quartz retools; T1 stations refresh (суп шум шов) |
| 12 | T3 | Oil Mk2 | й з (Q P) | у ш ready | 60 oil + 30 black iron | oil retools; black brass; -ый -ий -ой |
| 13 | T4 | Coal Mk2 | ч ю (X .) | 24 past bar 3 | 60 fastened + 40 steel | coal retools; gunmetal; Fastener Mk2 (? ! -) |
| 14 | T4 | Oil Mk3 | ф ж (A ;) | ч ю ready | 60 oil + 40 gunmetal | oil retools; black iron widens |
| 15 | T4 | Coal Mk3 | ц щ (W O) | ф ж ready | 60 coal + 40 quartz steel | coal retools; quartz steel; -ция -щик |
| 16 | T5 | Oil Mk4 | э х ё ъ (' [ ` ]) | 30 past bar 4 | 60 oil + 60 fastened | glass, coke iron; then Crane (Shift), then Fastener Mk3 (: ; " ( )) |

Key events at machines: comma (Fastener Mk1, T3 — Shift's first appearance,
the layout's signature hurdle) · ? ! - (Fastener Mk2, T4) · Shift as
capitals (Crane, T5) · : ; " ( ) (Fastener Mk3, T5). Numbers stay out (a
bonus tier later). Prices are placeholders showing the pattern: the ore's own
material, typed by hand right before its new keys arrive, plus a good from the
current tier. Extra mines of an ore are bought at unbuilt nodes and inherit
the ore's Mk.

### Machine kinds

Nine lesson kinds. Kinds are templates — build as many instances as the
factory wants; arity is fixed per kind so the icon row always reads the same.

| Kind | Arity (inlets) | Grammar | Min alphabet | First · ⚙ from | How the input changes the lesson |
|---|---|---|---|---|---|
| Mine | 0 → ore | letters | 2 | T0 · when its keys are sticky | the ore IS the finger; Mk adds a reach; several nodes per ore |
| Smelter | ore + ore → 2-ore ingot | syllables (course syllable table, filtered) | 4, ≥1V+1C | T0 · T1 | different pair, different syllable set; ratio tilts |
| Foundry | ingot + ore → 3-ore ingot | clusters (ст пр вл сн in 2-syllable pseudo-words + real bigrams) | 8 | T1 · T2 | third ore widens the union |
| Constructor | ingot → parts | words (real, glossed, strict union) | 8 & pool ≥25 | T1 · T2 | one alloy = one word pool; vowel-poor alloys skip it until enriched |
| Molder | parts + ore → moldings | endings (prefixes/suffixes/inflections in frames) | 14, full set | T2 · T3 | flux ore picks the family (stone -ть -ить -ом; copper -ение -ник; coal -ция -щик; oil -ся -ый -ой) |
| Assembler | parts + ingot → modules | phrases (collocations → short sentences, no punct.) | 16, full set | T2 · T3 | flux ingot's ores are the focus |
| Fastener | modules + ore → fastened · adds keys | punct (, Mk1 · ? ! - Mk2 · : ; " ( ) Mk3) | 20 | T3 · T4 | Mk levels add keys like ores add letters |
| Crane | fastened + oil → crates · adds ⇧ | capitals (sentence-initial, names) | 30 | T5 · T6 | oil is the pinky ore; Shift is a pinky key |
| Manufacturer | crates + moldings + parts → heavy modules | pages (real paragraphs; the content slot) | all | T6 · after the finish | reaches every earlier form; the one station the factory exists to feed |

Alloy working names (ids are ore-pairs; display names live in i18n): bronze
(fe+cu), cast iron (fe+st), quartz iron (fe+qz), steel (3 fe+co), brass
(2 cu+st), black iron (fe+oi), gunmetal (cu+co), glass (qz+oi); three-ore:
quartz bronze, cast steel, black brass, quartz steel, coke iron.

### Recipes by tier (ratios placeholder; teal = new, gold = refreshed on the page)

- **T0** — bronze, cast iron (syllables, 4). Copper+stone waits for T2 as
  brass at 8 letters. Two thin alloys are the tutorial; the first real words
  already appear inside them.
- **T1** — quartz iron (syll. 6→8) · quartz iron → parts (words 8) · quartz
  bronze (clusters 10) · quartz bronze → parts · bronze refreshes (Fe Mk2).
- **T2** — steel (syll. 6) · brass (syll. 8) · cast steel (clusters 10) ·
  brass, cast steel → parts · 2 parts + ore → moldings (families by ore) ·
  2 parts + steel/brass → modules (phrases) · brass = both T0 ores at their
  new Mk2 keys.
- **T3** — black iron (syll. 8) · black brass (clusters 12) → parts · 2 modules
  + oil → fastened (. ,) · 2 parts + black iron → modules · Oi ending family ·
  quartz iron/quartz bronze refresh (Qz Mk3).
- **T4** — gunmetal (syll. 10) · quartz steel (clusters 16) → parts · fastened
  with ? ! - · Co ending family · steel refreshes (Co Mk2/3).
- **T5** — glass (syll. 16) · coke iron (clusters 20; rare-letter words) ·
  2 fastened + oil → crates (capitals) · fastened with : ; " ( ) · Oi Mk4
  family · black iron refreshes.
- **T6** — 2 crates + 1 moldings + 2 parts → heavy modules (pages); heavy
  modules count toward the finish.

Vowel poverty is real: iron holds а о (19% of text), quartz has no vowel until
T3, late ores are consonant-heavy. Every alloy must hold ≥1 vowel + 1
consonant; late alloys pair a rare ore with iron/copper/stone; the Constructor
demands a measured pool of ≥25 real words before a recipe is offered.

### The factory simulation

- **Buffers.** Every machine has an input buffer per material it accepts and
  one output buffer, cap ≈100. A full machine pauses; nothing spills, nothing
  spoils, nothing needs babysitting.
- **Hand work.** Dock and type. Each correct keystroke consumes inputs at the
  recipe ratio — from the machine's own buffers first, then from the bag — and
  advances that station only. Output goes to the bag, unless a belt leaves the
  machine, in which case it rolls onto the belt.
- **Automated work.** With ⚙, sticky letters and a full input set in its
  buffers, the machine runs a timed job and emits to the exit belt or its
  output buffer. It never reaches into the bag and never needs you.
- **You can still carry.** Hold Space at any machine to collect its output
  buffer or to feed its input buffers from the bag. Early game is carrying;
  late game is belts; both always work.
- **Rates (placeholders):** mine 2 s/ore · Smelter 3 · Foundry 4 ·
  Constructor 4 · Molder 5 · Assembler 6 · Fastener 6 · Crane 7 ·
  Manufacturer 10; belts 2 tiles/s, one item per tile. Passing bars 2 and 4
  speeds the factory 20% each. Automation is parallel, not fast: a fluent
  typist out-produces any single automated bench; the factory wins because
  every automated machine runs at once, forever.
- **Tuning target:** one mine ≈ one consumer's appetite for its ore. The
  player never computes rates; they see a hungry machine and build another
  mine.
- **Instances.** Kinds are templates. How many the player builds is theirs;
  the map offers as many nodes and plots as the tree can use (nodes per ore
  farther out each tier, plots opened region by region) — never scarce.

### Automation

- **The rule** (invariant 4): a machine runs a recipe by itself, in real time,
  iff it has its ⚙ · every letter of that recipe's alphabet is sticky-mastered ·
  its input buffers hold a full set at the recipe ratio. Otherwise that recipe
  is hand-work. Automated recipes refuse labor; un-automated recipes at the
  same machine still accept it.
- What falls out: **retool is not a mechanic** (buy a Mk → the ore's alphabet
  gains two un-sticky letters → every mine of that ore is hand-work again →
  master them → they resume; its belts idle meanwhile, which is what pulls you
  back — one ore, one pair, downstream keeps its ⚙ and simply starves);
  **new recipes at an automated machine are still lessons**; the whole factory
  ends automated except the Manufacturer, which is you.
- **When ⚙ is purchasable:** mines — as soon as the ore's current keys are
  sticky, per mine instance (cost: its ore + the tier's good; nothing forces
  it — you automate because it ends the walk). Processors — one tier of hand
  work first: ⚙ appears once the bar that closes the kind's arrival tier is
  passed (Smelter → T1, Foundry/Constructor → T2, Molder/Assembler → T3,
  Fastener → T4, Crane → T6, Manufacturer → after the finish).

### Transport — belts and pipes

- A belt is a conveyor from one machine's outlet to another machine's inlet.
  Anything the source makes — by hand or by itself — rolls onto it. Belts
  decide whether you walk; buffers decide whether machines wait; neither asks
  for a layout.
- **Unlocked** with tier 1 (the T0 bar passed). Any machine can be a source;
  automation is not required. Pipes arrive with the oil derrick (T3): same
  rules, different skin, the only piped resource. **Free** for now; automation
  and machines are the material sinks (a distance price in the tier's trade
  good is the obvious sink to add if ever needed).
- **Built by spool & socket:** hold Space at the source (spool on the back);
  walk; hold Space at a machine that accepts that material → the belt
  auto-routes on free tiles. Every valid inlet glows while carrying; a ghost
  route follows; a red ghost means no free path (carry by hand, or free a
  tile); hold Space at the source again to put the spool back.
- **Inlets = the kind's arity** (one belt per input slot: Constructor 1;
  Smelter/Foundry/Molder/Assembler/Fastener/Crane 2; Manufacturer 3).
  **Outlets: mines 1, processors 2** — a processor can split its output once
  (round-robin); a mine feeds one consumer, which is what grows the pyramid.
  No cap on the number of belts. A belt carries only what its consumer accepts
  (the outlet filters), so belts never clog.
- **Routing and congestion:** one belt per tile; the router takes the shortest
  free path. Choke points are authored into the map (bridges, gaps between
  rocks) — choosing which lines get the bridge is the same bounded strategy as
  choosing plots. Belts can be removed for half refund; an *overpass* arrives
  at tier 4 to cross an existing line. Docking shows a machine's belts as icon
  rows; belts are removed (refunded) when a machine is relocated.
- **Build-out (~40 belts, roughly):** T1 iron/copper/stone/quartz → Smelter A,
  iron #2 → Smelter B, quartz → Foundry, Smelters → Foundry/Constructor,
  Foundry → Constructor · T2 coal → Smelter B, iron #3 + coal → Smelter C,
  Foundry → Constructor #2, Constructors → Molder/Assembler, Smelter →
  Assembler, iron/stone → Molder · T3 oil ⇒ Smelter/Foundry/Fastener/Molder,
  Assembler → Fastener · T4 coal #2 → Fastener/Molder, copper #2 →
  Molder/Smelter C · T5 Fastener → Crane, oil ⇒ Crane · T6 Crane, Molder,
  Constructor → Manufacturer.
- Rejected: keystroke-tick clock (deadlocks when the frontier is starved and
  upstream refuses labor; makes walking and belt-laying dead time), a power
  station (a lesson-less machine competing with lessons), keystroke-laid
  belts, manual routing, throughput math (Mk belts, splitters), Hub contracts
  for anything.

### Tier bars, pacing, and the two clocks

Tier bars replace the Издание exams: a per-tier readiness target that every
unlocked letter must pass before the next tier's first purchase opens — no
station, no ceremony. Bars (WPM-equivalent latency target · accuracy):
T0→1 12·95% · T1→2 15·96% · T2→3 18·96% · T3→4 21·97% (with . ,) · T4→5
24·97% (hints dimmed from here) · T5→6 28·97% (hint-free, capitals) · finish
35·97% + K heavy modules produced (K ≈ 200 placeholder, tuned to ~6–8 h at
~30 WPM). Estimated hours: T0 2 · T1 4 · T2 5 · T3 6 · T4 6 · T5 5 · T6 4+ ≈
32 h — a floor set by the skill gates; prices, bars and K stretch it if it
plays short.

- **The skill clock (T0–T5):** pairs unlock on readiness (30+ clean samples at
  the tier's latency target, ≥ its accuracy) so keys cannot arrive faster than
  a modest fluency on the previous ones; every Mk retool and every flux slot is
  review of an older bench with new material — one ore at a time.
- **The volume clock (T5 to the finish, and beyond):** players know every key
  before they hold 30–40 WPM. Once everything is automated and belted, the
  whole chain runs on its own up to the Manufacturer, and heavy modules exist
  only because you type pages there. What you type there is a content slot,
  not a mechanic — a per-course `pages` file: real prose, trivia, easter eggs,
  the machines talking, a plot that turns; the engine only cares that pages
  are graded by length and punctuation density. After the finish: free-play
  with raised bars (50+ WPM), speed runs, hint-free night shifts, more pages.
  "Launch" is just the word for finishing.

### Backtracking budget

Backtracking is a property of the graph, not a rule to enforce. Retools pull
you back exactly one ore; flux slots tie deep machines to old nodes; a hand-
drilled input is at most two tiers behind (measured by that ore's latest Mk),
and older ores appear only as belted feedstock. Per tier: T1 the Foundry price
asks for bronze (T0), iron retools · T2 brass needs both T0 ores at their new
Mk2 keys, copper and stone retool · T3 the Fastener price wants modules (T2),
the quartz retool refreshes T1 stations · T4 copper and steel (T2), coal and
oil retool · T5 black iron (T3), oil retools · T6 the Manufacturer reaches
everything, by design.

### Map consequences (re-basing the environment plan to v3)

The environment plan's region↔tier mapping "follows the tech tree draft and
moves with it"; v3 moves it. Six ores, no titanium; new ores at T1 (quartz),
T2 (coal), T3 (oil) only; T4–T6 bring no new ore but need more nodes (the
pyramid) and plots. Proposed re-basing of The Frontier's snake, keeping its
geography and seams: **Meadow** = T0–T1 (iron, copper, **stone — a stone node
must be added to the meadow**, quartz, iron #2); **Quarry hills** open at T1
(extra nodes and plots; the existing stone seam becomes stone #2); **Crystal
canyon + the stairs + Coal bog** open by T2 (the coal seam is the T2 node;
quartz #2 in the canyon); **Oil flats** open at T3 (oil seam); **Titanium
peaks** open at T4 as the finish site with extra nodes (the titanium seam
becomes a late iron/coal/oil node or a landmark). Crossings' `opensAfter` names
a tier bar instead of an edition. Nodes per ore across the map ≈ iron 3,
copper 2, stone 2, quartz 2, coal 2, oil 2; plots as many as the tree can use.
Open Range needs the same node set on its row A. Choke points (bridges, gaps)
stay authored — they are the belt-congestion feature.

### Course data this asks for (RU)

Pair order + ore map (above; locked) · syllable table ~150 with frequencies ·
cluster list ~40 · word list grown to ~1,500 with frequency ranks (restricted-
alphabet pools need density) · ending families ~60, tagged by ore · phrase
list ~200 · graded sentence corpus ~300 · proper-name list ~50 · pages, as
many as the user writes. All in `language-ru.js` / `layout-ru.js` (Shift rules
for capitals and the number-row punctuation); the skeleton — kinds, arities,
minimum alphabets, recipe graph, automation, belts, rates — is shared.

### What v3 removes from the current build (once the build plan lands)

Hub / milestone board / contracts / kits · Depot, ₽ and the press · Издания as
events (bars replace them; crossings open on bars) · single-letter unlock order
(pairs) · fixed per-bench focus sets (alphabet from the graph) · fixed BELTS
list, `upgradeCost`/`buildCost` on stations (place menus, ⚙, spool) · the
"collect 100 on approach" pickup (output buffers) · per-keystroke autofeed
(real-time simulation). Save ids stay additive: az/buki/vedi/slogi/slova/
stroki keep mapping to iron/copper/stone/…; a v2 profile migrates into the v3
model (see the build plan). Décor money, live exams, a guidance checklist and
"contracts for variety" may return later — none is a core mechanic.

### Tunables (placeholders, all in data)

Bars 12/15/18/21/24/28/35 WPM-eq at 95–97% · K ≈ 200 · rates and buffer caps
above · prices per the pattern above · minimum alphabets · outlet counts (1/2)
· overpass at tier 4 · ⚙ lag one tier · ratio tilt cap 3:1 · hint dimming
from T4, hint-free from T5 · the ×1.5-while-typing feel layer (off; gravy).

## Next epoch candidates (pick with the user)

- **Build the v3 tree — the core gameplay foundation** (agreed 2026-08-18;
  this comes first, executed fully and well; everything else is gravy). The
  phased order, acceptance criteria and data checks live in
  `docs/build-plan.md`: curriculum core → build-from-bag → the simulation →
  tiers 2–3 → tiers 4–6 → content and tuning.
- **English QWERTY course** (committed scope, not optional): `language-en.js`
  + `layout-en.js`, an EN frequency-ordered unlock order and word list, and a
  course picker so progress is tracked per course. The settings menu already
  has the layout switch stubbed (QWERTY disabled) — this lights it up. Doing
  this early is the honest test of invariant 5; the longer it waits, the more
  Russian assumptions leak into the engine.
- UI chrome reskin to match the bright outdoor world (the page frame is
  still night-train blue). Naming is done: Mechanical Keyboarding.
- Art polish: smelter sprite reads house-like — make it more furnace;
  shoreline fringe tiles.
- Polish debt: re-voice the typing-rhythm layer (still train clacks);
  night runs as a lamp toggle; station relocation fee.

## Later epochs (parked, in order)

- Bigram-level skill items; suffix-chunk subassemblies (-ого, -ться).
- Cosmetics economy (₽ buys décor only). Night-shift lamp toggle.
- Possible delivery meta (ship листы to market cities — the retired Транссиб
  train content could return here; cut until the core is polished).
- Further courses beyond EN QWERTY (phonetic ЯВЕРТЫ, other languages
  entirely) — additive data files only. EN QWERTY itself is NOT parked; it is
  committed scope, listed under next epoch candidates.

## Pedagogy references (kept from research)

These findings are language-neutral and apply to every course; the worked
numbers happen to be Russian because it is the first course.

Accuracy before speed (95–97% gates); frequency-ordered introduction, computed
per language (in Russian, о е а и н т ≈ 47% of text); blind typing with
recall-first hints; no free backspace; 15–30 min/day beats marathons
(soft-stop card); real-text transfer; each layout has a signature hurdle worth
its own drill (in ЙЦУКЕН, comma = Shift+Slash); ~40h ≈ 40 WPM expectation;
Fitts & Posner automaticity = the automation metaphor.

## Files

`js/engine.js` learning engine + per-world save slots · `js/language-ru.js`
RU course data · `js/layout-ru.js` ЙЦУКЕН · `js/chain.js` chain/economy data
+ the `MAPS` registry (Frontier, Open Range) · `js/factory.js` Pixi world
(`loadMap` per world) · `js/pixels.js` sprite kit + the one palette ·
`js/tiles.js` terrain kit (fills, autotile spills, walls, faces, crossings,
region scenery, `bake`, `minimap`) · `js/app.js` orchestration + the map
picker · `js/audio.js` synth ·
`js/i18n.js` EN/РУ · `serve.ps1` dev server (+ POST /upload for QA frames) ·
`dev/tiles.html` terrain proof sheet · `libs/pixi.min.js` vendored Pixi 8 ·
`docs/tech-tree-v3.html` the agreed tech-tree page (keyboard-by-ore, tier
board, material ladder, simulation, transport) · `docs/build-plan.md` the
phased build order for v3.
`assets/inbox/` (upload target) and `assets/ref/` (style references, study
only) are gitignored.

The `-ru` suffix is the convention, not an afterthought (invariant 5): a new
course is a new `language-<code>.js` + `layout-<code>.js` pair and nothing
else. Note that `i18n.js` is a separate axis — it translates the *interface*,
and the interface language is independent of the course being typed (you can
read English UI while drilling Cyrillic, or the reverse).
