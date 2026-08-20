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

1. **Progress is what you type and spend.** Every key-pair, vein, machine,
   upgrade, repair and automation is bought with materials, and materials
   come only from typing — at the frontier, by hand. Accuracy and speed are
   measured and shown to the player (hints, weak-letter weighting, the
   summary, a per-tier target) and are **never a lock**; the point is
   accuracy and repetition, not a gate. No timers, no time pressure ever.
   (Amended 2026-08-18/19 with the v3 tree: automated machines and belts run
   on the real clock, so old lessons are truly obsolete; that idle is bounded
   by buffer caps and by the fact that the current tier's goods are never
   automated, so waiting can fill the inputs of your next lesson but never
   pay for your next purchase.)
2. **Stations are lessons.** Each machine wraps a drill mode; its letter set
   lights up on the keyboard when you dock. Walking IS the menu — no scene
   switches, no instructional text; icons carry all information. (v3: hold
   Space at a place opens its icon menu — arrows choose, a tap of Space
   confirms — the same one interact key, still no text.)
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
4. **Automation is bought, and a new Mk takes it back.** The curriculum
   advances by purchase — the next key-pair is bought at its mine or vein,
   in the ladder's order, for a price that asks for that ore and a later
   good. Automation is bought the same way; buying a Mk on an ore retools
   every mine of that ore (automation off — the new keys are worked by hand
   until its automation is bought again). A machine runs a recipe by itself
   iff it has its automation upgrade and (phase 3) its input buffers hold a
   full set; automated recipes refuse labor. There is no mastery test
   anywhere: the price is the repetition.
5. **Language and layout are data, never assumptions.** This is not a Russian
   product with other languages bolted on later. Everything language-specific
   (letter frequencies, unlock order, phonotactics, word lists, glosses) lives
   in a `language-<code>.js`; everything layout-specific (key geometry, shift
   rules, intrusion mapping) lives in a `layout-<code>.js`. The physical slab
   underneath — key geometry, finger assignment, home row — is the same for
   every layout on it and lives once in `board-ansi.js`. `courses.js` is the
   registry that pairs a layout with its course data; the engine, chain and
   app read the active course through it and never touch a `LANG_*` /
   `LAYOUT_*` global. The engine, economy, tier structure, and art must hold
   for any alphabet + layout pair. Adding a course means adding two data
   files and one registry row, not editing the engine — if a change would
   break that, it is the wrong change. A course with no course data yet is
   listed but not ready: the switch shows it greyed. Saves are per world
   *and* per course (the first course keeps the untagged key).

## Current mechanics (implemented)

- 2D walkable hall (arrows, collision on built machines; ghosts walk-through),
  ~90% of the plan visible at once (430×230 logical @2×, canvas 860×460).
- Docking by proximity. ONE interact key, two jobs at once: on **press**,
  if the drill's next character is a space it is typed right then (a held
  space that isn't the next character costs nothing — never an error);
  **holding for 0.5 s** (a pixel charge bar fills over the operator) opens
  the place's icon menu — a plot lists the machines it could hold, an ore
  vein its mine, a mine its next Mk / automation / collect, a processor the
  recipes it is *not* running (the one it runs stands under the machine
  itself), its ⚙ and its removal, a closed crossing its repair — arrows
  choose, a tap of Space confirms, Escape closes. Glow turns green when a row
  is affordable. Everything is paid from the bag; no Hub, kits, contracts or
  Depot remain (v3, 2026-08-19, build-plan phases 1–2).
- **All game UI is pixels in-canvas**: the inventory HUD (icons + bitmap
  numbers, top-right of the canvas), requirement rows, charge bar. Only the
  page header and the keyboard visualizer are DOM. (The drill text line stays
  DOM for now — it's the reading surface.)
- **Recipes and consumption (v3):** a processor wears **one** row — the
  recipe it is running (2026-08-20; it used to show the whole list, which
  crowded the machine). The others are chosen at the machine's hold-Space
  menu, which offers every recipe it does *not* currently run, affordable or
  not; the choice is remembered per machine and the default is the first
  offered. A unit of output is paid for at its first keystroke and emitted at
  its `perUnit`-th; an unpayable choice runs dry with ✗ (typing still
  trains). Mines yield one ore per correct letter.
- **Taking a machine down (2026-08-20):** the last row of every machine's
  menu. Its price comes back at the price of the newest one of its kind — so
  down-and-up again is even — with everything in its buffers, and its belts
  come up with it (goods riding them roll back into the machine each one
  runs from). A vein's opening price is never refunded: that bought keys, and
  the keys stay. The last mine standing on an ore cannot be taken down: a new
  one is paid for in that same ore, so it could put the vein out of reach for
  good. The highlight never opens on the removal row.
- **The factory simulation (phase 3, 2026-08-19, `js/sim.js`):** every
  machine has an input buffer per material and an output buffer (cap
  `TUNING.BUFFER_CAP` = 100); a worked machine takes inputs from its own
  buffers first, then the bag, and its output rolls onto an exit belt if it
  has one (overflow to the bag), else into the bag. Automated mines yield
  on the clock (`TUNING.RATE.mine` s/ore) into their output buffer;
  automated processors run timed jobs (`TUNING.RATE[kind]`) from their input
  buffers into their output buffer and refuse labor; nothing automated ever
  reaches into the bag. **Belts** (free, uncapped) run from one machine's
  outlet to another's inlet — inlets = the kind's arity, outlets mines 1 /
  processors 2 — laid by **spool & socket** (hold Space at the source →
  spool on the back → walk → the route previews green/red at each machine →
  hold Space to lay; `FACTORY.routeBelt` is a breadth-first search over
  free tiles: machines, scenery, solids and other belts block, ramps carry
  elevation, open crossings override); a belt carries only what its
  consumer's chosen recipe accepts, one item per tile at
  `TUNING.BELT_SPEED`; a belt from an oil derrick draws as a pipe. Menus:
  feed (bag → an automated machine's inputs), collect (output buffer →
  bag), spool / socket / put back, and one ✗ row per belt to remove it.
  The clock is real time: a live tick every 120 ms, `SIM.catchUp` on load
  and when the tab returns (bounded by buffers; at most six hours), saves
  every 15 s. A Mk on an ore retools its mines (automation off). State dots
  over automated machines: green running, red starved, gold full. Harness:
  `dev/sim.html`; the whole game runs headless in `dev/play.html` (a rAF
  shim) for automated checks.
- **Tiers 4–6 (phase 5, 2026-08-20):** the Crane drills *capitals*
  (sentence-initial, with `NAMES`; a capital's stats fold onto its
  lowercase letter) and the Manufacturer drills *pages* (`PAGES`, real
  paragraphs graded by length and mark density, easiest first — the
  content slot). Fastener Mk2 `? ! -` and Mk3 `: ; " ( )` are bought at a
  Fastener; layout-ru puts the marks on the number row (Shift) and an
  uppercase on every letter key; a key the shared geometry marks inert
  wakes when the course gives it a glyph. Hints taper: from T4 slower and
  dimmer, from T5 gone (presentation only — nothing is locked). The
  finish: `K_HEAVY` heavy modules typed by hand at the Manufacturer —
  `profile.heavy` counts them, the 🏁 card celebrates, free play
  continues. Nothing else changes at the finish.
- **The pacing log (phase 6, 2026-08-20):** `dev/playtest.html` simulates
  a learner playing a fresh save to the finish (WPM ramp, serial hand
  work, automation as investment, parallel machines) and prints hours per
  tier — the tuning instrument until a human log exists. First tuning
  from it: PACE 4 → 3, tail prices trimmed, K_HEAVY 200 → 150, the
  Crane's automation price freed of heavy modules; the bot reads ~30 h.
  `dev/en.html` + `js/language-en.js` (stub) prove invariant 5: the
  engine runs an EN world untouched.
- **Tiers 2–3 (phase 4, 2026-08-20):** the Molder, Assembler and Fastener
  run. Molder → *endings*: the flux ore names the family
  (`LANG_RU.ENDINGS`, affixes in the course's dash notation), items are
  real words carrying one of its affixes, pseudo-stems wear the affix when
  the pool is thin. Assembler → *phrases* from `LANG_RU.PHRASES` (no
  marks). Fastener → *punct*: `LANG_RU.SENTENCES` with the marks they
  carry; a sentence fits once its letters and its marks are unlocked, the
  list is written across the whole ladder so ~70 fit at the period, ~120
  once the comma arrives. Full-set kinds drill the whole unlocked alphabet;
  the flux (the one ore/ingot input) sets the focus — its letters tilt
  sampling (`CHAIN.recipeFocus`). The Fastener's Mk levels are bought at a
  Fastener like an ore's at a mine (`PAIRS` events with `at:`,
  `PRICES.at`): "MK1 ," with a price, the unlock card names ⇧ Shift + the
  finger; the comma is typed as Shift+/ and the hint lights Shift. Maps
  carry the pyramid (iron 3, copper 2, stone 2, quartz 2, coal 2, oil 2)
  and the outer regions have their own plots.
- **Discoverability (2026-08-19):** the in-canvas menus are icons only (the
  bitmap font has no letters), so a **caption** (`#place-caption`, DOM text,
  EN/RU) sits at the bottom of the map: while a menu is open it says what
  the chosen row does ("Take the belt spool — carry it to a machine that
  uses copper ore", "Lay the belt here — 3 tiles from the Copper mine", "No
  belt here — it doesn't use stone", "Mk2: Iron mines reach the keys …",
  "Automate — …", prices append "not affordable yet"); docked without a
  menu it names the place and says "hold Space for the menu"; while
  carrying a spool it states the errand. While carrying, every machine
  shows a **bar**: green = a belt from this spool may end here (free
  inlet, takes what the source makes), red = not; a beaded **cord** runs
  from the source machine to the operator; the route preview is gold (red
  = no free path). **Carrying is modal** (2026-08-19): there is no menu
  while the spool is on your back — at a machine that can take the belt a
  green chevron bounces over it, its dock glow is green, the caption reads
  "Hold Space: lay the belt here — N tiles from X", and the hold lays the
  belt at once (the charge bar fills green); anywhere else — no machine,
  the source, a machine that can't take it (red glow, caption says why) —
  the same hold **drops the spool** (charge bar red, caption "Spool
  dropped — no belt laid"), so aborting is one hold wherever you stand.
  Info rows that would run off the world's top edge stand beside the place
  instead. Debug: **Ctrl+Alt+M** or **Ctrl+Shift+Q** give 100 of every
  material that exists for the save (a caption confirms).
- Learning engine: hesitation-gated hints (recall first), stop-on-error,
  per-letter EW latency/error stats; **v3 curriculum:** letters unlock in
  mirror key-pairs per ore Mk (`LANG_RU.PAIRS`), a pair is bought at the
  place for a price — the only gate; accuracy and speed are measured for
  hints, weak-letter weighting and the summary, never as a lock (2026-08-19);
  alphabets come from the recipe graph (`CHAIN.alphabetOf`); drill grammars
  keys / letters / syllables / clusters / words; word passport with glosses.
- Three T0 mines (iron а о, copper е н, stone и т) stand from the start;
  automation on a mine is bought (its ore + its own alloy) and the mine
  refuses labor afterwards (hold Space → collect 100); buying a Mk on an
  ore retools its mines (automation off until bought again). Every price is
  the base table × `TUNING.PACE` — the one pacing knob. Profile v2 with a v1
  migration; save files version 2 (v1 files import and migrate). Debug:
  Ctrl+Alt+M (or Ctrl+Shift+Q) gives 100 of every material that exists for the save.
  `dev/verify.html` runs the data checks.
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
- **The two switches** (on the map picker, and again in settings): interface
  language and keyboard course, stacked, language above layout. Both are
  flags — drawn in `flags.js` on a 21×14 pixel grid, because Windows ships no
  flag emoji and a blurry flag has no place in a pixel game — the layout one
  flags plus its name (ЙЦУКЕН, QWERTY), since the choice there is a keyboard,
  not a country. **The switches are labelled by icon, not by word** (`icons.js`:
  a globe for the language the game speaks, a keyboard for the layout it
  teaches): the player who cannot read the current interface language is
  exactly the player who needs to find them. The words survive as tooltip and
  accessible name. Both switches render from their registry, so a third entry
  needs no UI work; a course whose data is still a stub simply renders greyed
  out. No explainer line under them — every listed course ships before
  release, so there is nothing to apologize for. Changing the course reloads
  (layout and course data bind once at load).
- **Changing the interface language must not move the furniture.** Every
  translated text block on the picker and in settings reserves its tallest
  case (`.map-tagline`, `.map-progress`, `.map-note`, `.set-note`, `.set-row`),
  so switching EN↔РУ leaves the card the same height and every control where
  it was. Any new translated block on those screens owes the same reserve.
- **Settings menu** (⚙ header button → overlay card): the current world +
  «Change» (back to the map picker); the same two switches; save file
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
- ~~Milestone board («Контора») & Издания v1~~ — removed 2026-08-19 with the
  v3 build (phases 1–2): no Hub, contracts, kits, Depot, ₽ or edition
  station; closed crossings are repaired at the place for a price in the
  goods of the regions behind you (`PRICES.crossing`) — nothing is locked
  behind a tier number; the old BELTS list and per-keystroke autofeed are
  gone until phase 3 brings belts and machine buffers back properly.

## The outdoor pivot — SHIPPED 2026-08-11

- Tilemap world on a **16×16 square tile grid** (`PIXELS.TILE`; was 16×12
  until 2026-08-17; world = 33×15 tiles): grass base with wildflowers, dirt
  work-aprons under machines, an unwalkable pond, ore nodes beneath the mines,
  a treeline border, solid trees/rocks shaping routes. All data in chain.js
  `MAP` (DIRT/WATER/NODES rects, grid-aligned) + `SCENERY` — a new map is a
  new set of rects.
- Machine roster: hand drill rigs → powered mines (tier-1, on nodes, fixed);
  Smelter / Constructor / Assembler kits on chosen plots; Freight Depot with
  a working crane; the Hub (roofed contract board). Chibi engineer with hard
  hat. The machines were reskinned steampunk on 2026-08-19 — see **Machinery
  style** under ENVIRONMENT PLAN for the binding ruling.
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

**Machinery style — steampunk, Final Fantasy VI as the reference (ruling
2026-08-19).** The land is FF3-USA; the *machines* are FF6 machinery. They are
**not** a futuristic factory, not sci-fi panels, not a colony on Mars — that is
the whole reason this world is a slightly fantasy RPG one. Concretely, every
machine is built from:

- **cast-iron plate** — a dark outline, a shaded lower half, a lit top edge,
  and a seam of rivet heads. The iron ramp is `ironO / iron3 / iron2 / iron /
  ironL`; nothing on a machine is ceramic, white or cyan.
- **brass** as trim only — hoops around a boiler, dial bezels, a collar on a
  flue, a sill under a firebox door. Discipline: `brass1` carries the fitting,
  `brass2` is a one-pixel ridge, `brass3` is a glint. Brass used as a *surface*
  turns every machine into gold stripes; it is the first thing to check.
- **copper pipework** with brass flanges, **oxblood enamel** panels (`enam`)
  for the one warm colour field, **verdigris** (`teal`) on old copper fittings.
- **fire and steam** — a sooted firebox mouth with the fire banked at the grate
  on every machine, a flue that puffs steam across the animation frames.
- **wood and canvas** (`trunk`, `bA/bB/bC`, `cream`) wherever a thing was
  hand-built rather than cast: the tier-1 derrick, belt slats, the depot awning.

Silhouette first, always: a derrick, a boiler, a walking beam, a tapered
furnace — the shape must read at 1× against grass before any brass goes on. The
machines are the dark, warm, heavy thing in a bright frame.

All of it is one shared parts kit in `js/pixels.js` — `M.plate`, `M.rivets`,
`M.band`, `M.vband`, `M.gauge`, `M.firebox` (fire flares with the heat it is
given), `M.flue`, `M.pipeH/pipeV`, `M.wheel` (spokes turn per frame), `M.puff`
(steam rises and thins), `M.lamp` (a signal bead: dark, or breathing, or lit).
**Any new machine, belt, prop or build-menu icon goes through that kit**, so the
whole frontier reads as one workshop. Proof sheet: `dev/machines.html`.

### Machine animation — the three states (ruling 2026-08-20)

**A general visual rule for every machine on the map**, present and future:
mining rigs, works buildings, the freight depot, anything added later. A
machine is always in exactly one of three states, and the state is *read off
the world* — never authored per machine, never a property in the save.

- **still** — not automated, and nobody is working it. **Nothing moves.** The
  pose holds: the wheel stopped, the steam a wisp sitting over the flue, the
  fire banked at the grate, the signal lamp dark. A machine standing by itself
  on the frontier is a still picture.
- **work** — the machine is running. Either the operator is docked at it and
  the **worker's working animation is playing**, or it is automated and the sim
  has a job in hand. **Everything moves**, and it is meant to be seen from
  across the screen: flywheels and pulleys turn, the walking beam rocks, the
  ram falls on the anvil, the screw presses, the crane hoist travels, the flue
  puffs, the firebox flares, the lamp burns steady.
- **idle** — automated, but with nothing to process: starved of inputs, or its
  output buffer full. **Only the lamps breathe.** The machine holds the still
  pose — wheel stopped, fire banked, steam a wisp — while a signal lamp fades
  up and down on a slow count. It reads "powered, waiting", and must never be
  mistaken at a glance for a machine that is working.

The binding rules:

1. A **non-automated** machine is only ever `still` or `work`, and its `work`
   runs on **exactly the same condition as the operator's own work animation** —
   the two start together and stop together, so the hand and the machine are
   never in disagreement. Hands move ⇒ the machine moves.
2. An **automated** machine is **never `still`**: something is always playing on
   it. That is how ⚙ reads from across the map without stopping to look at the
   state dot.
3. **The gap between `idle` and `work` carries the information.** `idle` is one
   small pulsing element on an otherwise frozen sprite; `work` moves the big
   parts. If the two can't be told apart at 1× from ten tiles away, the work
   animation is not doing enough — fix the work animation, never by making idle
   busier.
4. New machine art is **not finished** until all three states exist. The proof
   sheet shows every machine in all three.

Frames and clocks: `work` is the 4-frame beat (one frame every 9 ticks); `idle`
is a 6-frame breath on a slower count (one frame every 12 ticks), so the two
never read as the same animation slowed down. In code, `PIXELS.machineTex(look,
frame, mode)` and `PIXELS.stationTex(kind, frame, mode)` take the mode;
`js/factory.js` caches one texture band per (look, state) and picks the state
each tick.

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
5. **You choose the recipe at the machine. Kinds are templates.** (Amended
   2026-08-19: choosing beats guessing when a machine offers several recipes.)
   A machine's hold-Space menu lists every recipe it offers; arrows pick, a
   second hold confirms; the choice sticks to that machine and shows bright
   in the rows above it. No silent switching: if the bag can't pay for the
   chosen recipe the machine runs dry and its row shows ✗ — feed the bag or
   choose another. Several instances of a kind exist. On its own (phase 3) a
   machine makes its chosen recipe from what its belts bring. Recipes are
   authored, never emergent.
6. **Everything is built from the bag, at the place — and nothing is locked
   behind a tier number.** No Hub, no kits, no contracts, no Depot. Hold
   Space at a plot, a node, a machine or a closed crossing and its icon menu
   opens: arrows choose, a tap of Space confirms, Escape closes. A plot
   lists the machines you could build there (greyed when unaffordable; a
   machine appears once you have held the materials it costs); a vein lists
   its mine; a mine lists its next Mk, automation, collect (later feed and
   spool); a processor lists every other recipe it could run, affordable or
   not, its ⚙ and its removal; a closed pass or bridge lists its repair. A
   machine wears only the recipe it is running now; the choices live behind
   the hold (2026-08-20). Tiers organise the
   design and pace it — they are never a check: order comes only from the
   letter ladder (the next key-pair is always the next one) and pacing from
   prices that ask for later materials plus the readiness bar. Each row shows
   a price and nothing else — accuracy and speed are shown, never a gate.
   The ladder decides order (the next key-pair is the next one), the price
   decides pace.
7. **Automation runs on the clock. Skill never does.** What is mastered works
   without you: automated machines and belts run in real time — while you
   walk, build, or have the tab hidden (fast-forward on return). Idle
   production is bounded: buffers cap (~100) and then the machine waits, and
   the current tier's goods are always hand-made (a kind gets ⚙ one tier after
   it arrives), so waiting fills the inputs of your next lesson and never pays
   for your next purchase. New letters and machines come only from what
   typing earns.

### RU course — pairs, ores, tiers (LOCKED)

Sixteen mine events (key-pairs) + four key events at machines = twenty key
introductions. Coverage of running Russian text: T0 47% · T1 71% · T2 86% ·
T3 95% · T4 99% · T5 100%. All six T0 keys are index-finger keys.

| # | Tier | Event | Keys | Comes after (the ladder) | Price at the place (pattern, ×PACE) | Opens |
|---|---|---|---|---|---|---|
| 1 | T0 | Iron Mk1 | а о (F J) | — | pre-built | first two keys, the F/J bumps; iron is the vowel bank |
| 2 | T0 | Copper Mk1 | е н (T Y) | — | pre-built | bronze (2 iron + 1 copper) |
| 3 | T0 | Stone Mk1 | и т (B N) | — | pre-built | cast iron (2 iron + 1 stone); first real words (тот, то, от) |
| 4 | T1 | Quartz node | в л (D K) | и т | 40 bronze + 40 cast iron | middle finger; quartz iron |
| 5 | T1 | Iron Mk2 | п р (G H) | в л | 80 iron + 30 bronze | home-row core; bronze/cast iron/quartz iron widen; iron retools |
| 6 | T1 | Quartz Mk2 | с б (C ,) | п р | 60 quartz + 40 quartz iron | quartz iron → 8 → Constructor; quartz bronze → 10 → Foundry |
| 7 | T2 | Coal node | ы д (S L) | с б | 60 parts + 40 quartz iron | ring finger; steel; alphabet ≥14 → Molder |
| 8 | T2 | Copper Mk2 | к г (R U) | ы д | 80 copper + 30 steel | copper retools; -ник -ение family |
| 9 | T2 | Stone Mk2 | м ь (V M) | к г | 80 stone + 30 steel | stone retools; brass; -ть verbs; ≥16 → Assembler |
| 10 | T3 | Oil node | я . (Z /) | м ь | 60 modules + 40 steel | pinky and the period; black iron; Fastener Mk1 (comma = Shift+/) right after |
| 11 | T3 | Quartz Mk3 | у ш (E I) | я . , | 60 quartz + 30 black iron | quartz retools; T1 stations refresh (суп шум шов) |
| 12 | T3 | Oil Mk2 | й з (Q P) | у ш | 60 oil + 30 black iron | oil retools; black brass; -ый -ий -ой |
| 13 | T4 | Coal Mk2 | ч ю (X .) | й з | 60 fastened + 40 steel | coal retools; gunmetal; Fastener Mk2 (? ! -) |
| 14 | T4 | Oil Mk3 | ф ж (A ;) | ? ! - | 60 oil + 40 gunmetal | oil retools; black iron widens |
| 15 | T4 | Coal Mk3 | ц щ (W O) | ф ж | 60 coal + 40 quartz steel | coal retools; quartz steel; -ция -щик |
| 16 | T5 | Oil Mk4 | э х ё ъ (' [ ` ]) | ц щ | 60 oil + 60 fastened | glass, coke iron; then Crane (Shift), then Fastener Mk3 (: ; " ( )) |

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
  iff it has its automation upgrade · (phase 3) its input buffers hold a full
  set at the recipe ratio. Otherwise that recipe is hand-work. Automated
  recipes refuse labor. No mastery test (removed 2026-08-19: progress is what
  you type and spend).
- **A Mk retools.** Buying a Mk on an ore switches automation off on every
  mine of that ore: the new keys are worked by hand, its belts idle meanwhile
  (which is what pulls you back — one ore, one pair; downstream keeps its
  automation and simply starves) until its automation is bought again. The
  whole factory ends automated except the Manufacturer, which is you.
- **When automation is purchasable:** mines — any time, per mine instance,
  for its ore + its own alloy (nothing forces it — you automate because it
  ends the walk; the price is the repetition). Processors — phase 3, priced
  in the next tier's good so a kind is hand-worked for about a tier first.

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

There are no exams and no skill gates (2026-08-19). The tier bars are
*targets* shown to the player — WPM-equivalent · accuracy: T0 12·95% · T1
15·96% · T2 18·96% · T3 21·97% · T4 24·97% (hints dimmed from here) · T5
28·97% (hint-free) — they weight weak letters in the drills and appear in
the summary, and they lock nothing. Finish = K heavy modules produced (K ≈
200 placeholder, tuned to ~6–8 h at ~30 WPM). Estimated hours: T0 1–2 · T1
4 · T2 5 · T3 6 · T4 6 · T5 5 · T6 4+ ≈ 32 h — set entirely by prices:
`TUNING.PACE` multiplies every price (4 is the first-pass guess), and a
purchase should ask for about the keystrokes we want spent on those keys.

- **The material clock (T0–T5):** every key-pair is bought for its ore plus a
  later good, so keys cannot arrive faster than the typing that pays for
  them; every Mk retool and every flux slot is review of an older bench with
  new material — one ore at a time.
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
becomes a late iron/coal/oil node or a landmark). Crossings are repaired at
the place for a price in the goods of the regions behind you (2026-08-19:
no tier locks anywhere — pacing is prices and the readiness bar). Nodes per ore across the map ≈ iron 3,
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
- **English QWERTY course** (committed scope, not optional): `layout-en.js`
  and the course picker are in place and progress is already tracked per
  course; what is missing is `language-en.js` — an EN frequency-ordered
  unlock order, phonotactics and word list. The QWERTY entry goes live the
  moment that file exists (`courses.js` reads readiness from it). Doing
  this early is the honest test of invariant 5; the longer it waits, the more
  Russian assumptions leak into the engine.
- UI chrome reskin to match the bright outdoor world (the page frame is
  still night-train blue). Naming is done: Mechanical Keyboarding.
- Art polish: shoreline fringe tiles. (Smelter-reads-house-like is done —
  it is a tapered blast furnace now, 2026-08-19 steampunk pass.)
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

`js/engine.js` learning engine + per-world save slots · `js/courses.js` the
course registry (which keyboard is being taught) · `js/language-ru.js`
RU course data · `js/layout-ru.js` ЙЦУКЕН glyphs · `js/layout-en.js` QWERTY
glyphs (course data pending) · `js/board-ansi.js` the physical ANSI slab
shared by both · `js/flags.js` drawn flags + `js/icons.js` the globe and
keyboard marks that label the switches ·
`js/chain.js` chain/economy data
+ the `MAPS` registry (Frontier, Open Range) · `js/factory.js` Pixi world
(`loadMap` per world) · `js/pixels.js` sprite kit + the one palette, incl. the
steampunk machinery parts kit `M` and the three machine animation states ·
`js/tiles.js` terrain kit (fills, autotile spills, walls, faces, crossings,
region scenery, `bake`, `minimap`) · `js/app.js` orchestration + the map
picker · `js/audio.js` synth ·
`js/i18n.js` EN/РУ · `serve.ps1` dev server (+ POST /upload for QA frames) ·
`js/sim.js` the factory simulation (buffers, jobs, belts, the clock) ·
`dev/tiles.html` terrain proof sheet · `dev/machines.html` machinery proof
sheet (rigs, works, belts, pipes, props, icons on real terrain, and every
machine in its three animation states) ·
`dev/verify.html` data checks ·
`dev/sim.html` simulation harness · `dev/play.html` the game headless (rAF
shim) · `libs/pixi.min.js` vendored Pixi 8 ·
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
