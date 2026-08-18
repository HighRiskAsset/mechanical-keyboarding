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

1. **Typing is the only power source.** Nothing produces, feeds, or advances
   without keystrokes. No idle progress, no timers, no time pressure ever.
2. **Stations are lessons.** Each machine wraps a drill mode; its letter set
   lights up on the keyboard when you dock. Walking IS the menu — no scene
   switches, no instructional text; icons carry all information.
3. **Materials are the motor-chunking hierarchy**, displayed as frontier
   resources: iron ore / copper ore / quartz (tier-1 letter groups, mined at
   nodes) → ingots (bigrams, Smelter) → parts (clean words, Constructor) →
   modules (sentences, Assembler) → cargo + ₽ at the Freight Depot. Machines
   take 1–4 inputs, usually 1 output; tier-1 = 1 material per letter.
   IMPORTANT: internal save ids keep the legacy Slavic names
   (az/buki/vedi/slogi/slova/stroki/listy) — display names live in i18n
   matNames/stationNames, looks in pixels.js matIcon. Renames never touch ids.
4. **Automation is earned two ways, honestly.** The *curriculum* unlocks by
   measured skill only (accuracy-gated frequency-ordered letters; readiness;
   sticky automaticity). The *economy* (erect kits, upgrade machines to
   automations, lay belts) is bought with materials — and buys paint and
   convenience, never skill progress. An automated machine refuses labor:
   hold Space at it to draw a full load of 100 (the graduation reward).
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
  SCENERY in chain.js) so it carries to any future map.
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

## THE TECH TREE (v2, 2026-08-11 — 7 tiers × 2 lessons)

**14 lesson machines: 7 mines + 7 processors, one pair per tier.** The Hub
and Depot are meta, NOT lessons. Only the Tier 0 pair is pre-built; every
later machine is a kit — earned via Hub contract, paid in materials.
Mines are fixed on their ore nodes; processors go on chosen plots.

**Pacing principle — the tiers are time-locked by SKILL, not content.**
Each tier ends in an Издание benchmark with a rising measured bar (WPM at
97% accuracy on the full unlocked set, live at the Depot). Skill bars can't
be rushed: readiness needs 30+ clean samples per letter, automation demands
sticky mastery, and ~40 h of practice ≈ 40 WPM. Target playthrough:
**≈30–40 hours ≈ 6–10 weeks at the 15–30 min/day soft-stop pace** —
roughly one tier a week. Materials can't be rushed either (typing is the
only source), but skill is the real clock; contract sizes are tuned so the
economy never finishes before the skill bar does.

**Review is structural, not a separate lesson type**: (a) every processor
drills the FULL unlocked set (words/sentences revisit everything); (b) the
weakness-boosted generator over-samples shaky letters everywhere; (c) tier
contracts demand big batches from EARLIER mines — go back and type them, or
earn their automation (which itself requires sticky letter mastery);
(d) each Издание is a review exam over everything learned so far.

### The tiers — Russian ЙЦУКЕН course

The 7×2 tier STRUCTURE, the material ladder, and the Издание-benchmark pacing
are shared by every course. The letter sets and WPM bars below are the Russian
curriculum specifically; an English QWERTY course reuses the same skeleton with
its own frequency-ordered letters, its own word lists, and its own bars.

| Tier / era | Mine (letters mode) | Processor (skill mode) | Издание bar (tunable) |
|---|---|---|---|
| **0 · hand** (pre-built) | Iron Mine — о е а и н т (1–6) | Smelter — bigrams (2 iron → ingots) | 12 WPM · 95% · 3 clean lines |
| **1 · powered** | Copper Mine — с л в р (7–10) | Constructor — words (ingots + copper → parts) | 15 WPM · 96% |
| **2 · stone** | Stone Quarry — к м д п (11–14) | Assembler — sentences (parts + stone → modules) | 18 WPM · 96% |
| **3 · crystal** | Quartz Mine — ы у б я ь (15–19) | Molder — suffix chunks -ться -ого (quartz + stone → moldings) | 21 WPM · 97% |
| **4 · coal** | Coal Pit — г з ч й (20–23) | Fastener Plant — punctuated lines «.» «,» (24–25; copper + ingots → screws) | 24 WPM · 97%, dimmed hints |
| **5 · oil** | Oil Derrick — ж х ш ю ё (26–30) | Circuit Fab — rare-letter words (oil + copper → circuits) | 28 WPM · 97%, hint-free (night runs return here) |
| **6 · titanium** | Titanium Mine — ц э щ ф ъ (31–35) | Manufacturer — real-text pages (modules + screws + moldings + circuits → heavy modules) | 35 WPM · 97% · one flawless page (course finale TBD — decided later) |

Letter positions are UNLOCK_ORDER indices; a mine's kit gates on its first
letter being unlocked (curriculum) AND the previous tier's Издание (economy).
Both gates must pass — skill first, always.

- Every layout nominates its own signature hurdle, which earns its own machine.
  In ЙЦУКЕН that is comma = Shift+Slash; QWERTY's will differ and must be
  chosen from that layout's own data, not inherited from this table.
- Suffix chunks adapt to unlocked letters (engine picks available frames).
- Tier 5+ benchmarks are hint-free: the night-run mechanic returns as exam
  conditions rather than an opt-in block.
- Finishing a course unlocks endless free-play and speed runs with raised bars
  (50+ WPM). Starting a DIFFERENT course (EN QWERTY, phonetic ЯВЕРТЫ) is a
  first-class playthrough with its own progress and its own tier ladder — not
  a replay skin of the Russian one. A playthrough is weeks, not an evening.

### Materials ladder

iron → copper → stone → quartz → coal → oil → titanium (mines);
ingots → parts → modules → moldings → screws → circuits → heavy modules
(processors). Depot ships handbills (iron) early, modules mid, heavy
modules late; accuracy³ pay everywhere. ₽ buys décor, never progress.

### Build notes (constraints discovered in planning)

- Existing saves: az=iron, buki=copper (splits into copper+stone — stone is
  a NEW id), vedi=quartz (splits into quartz+coal). Additive ids only:
  stone, coal, oil, titan, mold, screw, circ, heavy. Display names/icons
  live in i18n + pixels; internal ids never rename.
- Current Copper Mine (8 letters) and Quartz Quarry (9) each split into two
  4–5 letter mines — smaller focused lessons, more stations, longer tree.
- HUD grows 8 → 16 rows: progressive reveal — a material appears in the
  HUD the first time the player produces one.
- Map needs 4 more ore nodes placed farther out each tier (walking distance
  IS the cost of late resources) and ~6 more plots; widen WORLD_W or open
  an eastern region when Tier 2+ lands.
- New drill modes in engine.js: 'punct', 'chunks', 'rarewords', 'page';
  benchmark mode needs a WPM meter on the live run.
- Издание WPM bars live in chain.js MILESTONES; tune against real play data
  so each tier ≈ 4–6 hours of daily-session practice.

## Next epoch candidates (pick with the user)

- **Phase II per the tech tree** (recommended next): Fastener Plant + Coal
  Pit + Molder, the powered-era contract ladder, Издание II.
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
`dev/tiles.html` terrain proof sheet · `libs/pixi.min.js` vendored Pixi 8.
`assets/inbox/` (upload target) and `assets/ref/` (style references, study
only) are gitignored.

The `-ru` suffix is the convention, not an afterthought (invariant 5): a new
course is a new `language-<code>.js` + `layout-<code>.js` pair and nothing
else. Note that `i18n.js` is a separate axis — it translates the *interface*,
and the interface language is independent of the course being typed (you can
read English UI while drilling Cyrillic, or the reverse).
