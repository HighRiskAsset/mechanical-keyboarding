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
   (iron/copper/quartz/bronze/parts/modules) — display names live in i18n
   matNames/stationNames, looks in pixels.js matSprite. Renames never touch ids.
4. **Automation is bought, and a new Mk takes it back.** The curriculum
   advances by purchase — a key-pair is bought at its mine or vein, each
   place selling its next level, for a price that asks for that ore and a
   later good; what the prices are made of is the only order between
   places (the ladder branches, 2026-08-22). Automation is bought the same way; buying a Mk on an ore retools
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
- **Building — the menu on you, and the ghost (rotation overhaul,
  2026-08-21):** building happens anywhere. A long press of Space on open
  ground — anywhere a hold would not open something else — raises the
  **build menu on the operator**: the mine first, then every kind with any
  good of its price in reach, held once or makeable by a machine already
  standing (progressive reveal, retuned 2026-08-27: the smelter is priced
  from the first mine, and each machine placed pulls the kinds it feeds
  into view before they can be paid for), priced in its row. **Affordability is settled here, not at the ghost** (user
  ruling 2026-08-21): an unaffordable kind cannot be picked — its row is
  greyed and every count the bag falls short of prints red, so the row
  says which material is the problem — and the mine's row only offers
  itself while some free vein could actually be paid for (its price lives
  on the vein). An unaffordable ghost never stands. Arrows choose; a
  **tap** of Space picks; a **hold** over the open menu puts it away (this
  one menu answers the release, because its hold means cancel). The pick
  becomes a **ghost on
  the grid, standing a step ahead of the operator** in the direction they
  face — walking aims it, turning to face another way swings it round —
  body translucent in its facing, its port plates already on the ground and
  faint where their way out is blocked. Under it, a **translucent
  surveyor's grid**: every tile the body would take draws as a green cell
  where it may stand and a red one where it may not, so a bad placement
  says which tiles are the problem. No price rides the ghost — the build
  menu already named and gated it; the one price the menu cannot know is a
  mine's per-vein one, and a vein the bag cannot cover simply reads red
  like any bad ground, the caption saying why. A **tap** of Space turns it
  a quarter clockwise; a **hold**
  builds it on good ground, and on bad ground the same hold cancels;
  Escape cancels too. Valid ground **for now** is the
  surveyed pads (mines: a free vein the body covers — the mine row prices
  itself off the vein under the ghost, and an unopened ore's first mine
  still unlocks its keys); free placement over open terrain is a later mode
  that swaps exactly that one zone test for a terrain answer (big rocks
  invalid, stairs invalid though belts may cross them). Machines are seated
  in the save as tiles (`m.at` + `m.face`), and pads and veins stopped
  being dockable places — their markers survey the ground, the menu came to
  the operator. **The ghost is the only place a machine turns** (user
  ruling 2026-08-21): once built, the facing is final — take it down and
  build it again to face it another way.
- **Taking a machine down (2026-08-20):** the last row of every machine's
  menu. Its price comes back at the price of the newest one of its kind — so
  down-and-up again is even — with everything in its buffers, and its belts
  come up with it. A vein's opening price is never refunded: that bought
  keys, and the keys stay. The last mine standing on an ore cannot be taken
  down: a new one is paid for in that same ore, so it could put the vein out
  of reach for good. The highlight never opens on the removal row.
- **Destruction, and loose materials on the ground (2026-08-20,
  `js/drops.js`):** nothing that cost materials is ever simply deleted, and
  nothing destroyed pays straight into the bag. **`DROPS.demolish` is the one
  door** — machines and runs go through it today, and anything destructible
  added later must too, so the poof, the refund, the insides and the goods on
  the belts stay one behaviour in one place instead of a rule each new kind
  has to remember. What comes out of it:
  - the thing poofs where it stood — puffs of smoke over the whole body (a
    run puffs along its length, sampled down to a handful), a ring of
    sparks, and one soft `AUDIO.poof`: a ramped swell, not a step, filtered
    from a breath down to a thud. Nothing here explodes; a machine lets go.
  - its price, its input buffer and its output buffer burst out of its foot
    as a few stacks per material (four, not one per unit — a spray reads as
    a refund where sixty icons read as a mess), tossed up on a real arc with
    a bounce and clamped to within one tile of the burst.
  - every good riding one of its runs falls **where it rides**, not back
    into the machine it came from: a hop in place, as if the ground went out
    from under it.
  - what lands **never expires** and nothing sweeps it away. It is saved
    (`profile.drops`, `{id, mat, n, x, y}` once at rest — the wobble and the
    magnet's jitter are read off the id, not stored) and it is still lying
    there after a reload. There is no hurry.
  - a generous magnet — nearly three tiles, a tug at the edge and a snap up
    close — draws it in when the operator walks near, and it arrives with
    the flight into the HUD and the rising pop the typed goods already use
    (`AUDIO.pickup` climbs a semitone per good while they keep coming). The
    magnet is deaf while a good is airborne and for a beat after it lands,
    or the burst would be in the bag before the first frame drew it.
  Re-laying a run — a machine turned, a machine built across it, a save from
  before ports — sorts it into one of two, and only one of them is a
  destruction. A run that finds a new route **moves**: it is the same run
  over different tiles, its goods roll home into the source, and nothing
  poofs. A run that finds none has **died**, and it goes out this same door
  as everything else, with the poof, the sound, and its goods left on the
  tiles it was still crossing. It used to vanish in silence, which was the
  one thing in the game the door exists to make impossible (2026-08-21).
  Which of the two a run is is not known until the route has been tried, so
  its goods come off it when it is lifted and wait there for the answer.
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
  processors 2, and every one of them stands at a **port**: a named tile
  against one side of the body, marked on the ground (verdigris wedge in,
  brass wedge out), the run ending on the plate — straight in, or turning
  on it (the corner plug) — laid by
  **spool & socket** (hold Space at the source →
  spool on the back → walk → the route previews green/red at each machine →
  hold Space to lay; `FACTORY.routeBelt` is a breadth-first search over
  states of (tile, heading): machines, scenery and solids block, ramps carry
  elevation, open crossings override, and of the shortest routes it takes
  one with the fewest corners. A machine claims a tile when its drawn body
  covers six of that tile's sixteen pixels, so a run ends against it rather
  than a tile short. Two runs may share a tile only by **crossing** it — one
  on each axis, both straight through, neither turning or ending there —
  which makes a crossing a single tile and never a shared length; the later
  run bridges the earlier and throws a shadow on it. A belt carries only
  what its consumer's chosen recipe accepts, one item per tile at
  `TUNING.BELT_SPEED`; a belt from an oil derrick draws as a pipe. Menus:
  feed (bag → an automated machine's inputs), collect (output buffer →
  bag), spool / socket / put back. **A run is taken up from the run**, not
  from a machine: stand on any of its tiles, hold Space for its own menu,
  and the ✗ row there removes it (both rows where two cross). A machine
  with runs coming and going gave a list there was no reading, and the
  wrong one went too easily. The clock is real time and has two hands —
  the animation frame while the page draws, a 250 ms timer while the tab is
  in the background, both through one `SIM.tick` that reads the elapsed
  time from a single `lastTick`, because this host stops delivering frames
  to a tab that is not on top without ever marking the page hidden.
  `SIM.catchUp` on load and when the tab returns (bounded by buffers; at
  most six hours), saves every 15 s. A Mk on an ore retools its mines (automation off). State dots
  over automated machines: green running, red starved, gold full. Harness:
  `dev/sim.html`; the whole game runs headless in `dev/play.html` (a rAF
  shim) for automated checks.
- **The EN QWERTY course (2026-08-20):** selectable from the switch, its
  own saves per world. The ladder maps the RU course key-for-key — the
  same physical keys arrive in the same order, so ore = finger and every
  price and tier behaves identically. PINNED: whether EN deserves its own
  pair order (f j holds no vowel; y carries the early game, u lands at
  pair 8, e at 12, a at 16, o last at 17 — word pools open at pair 8).
  Deviations where the RU key holds a letter but the EN key a mark: the
  period joins oil Mk1, the apostrophe coal Mk2, and the Fastener deals
  ? · ! - · : " ( ) — '?' is Shift+Slash, the same stroke as the Russian
  comma. Oil stops at Mk3 (18 events to Russian's 19). This audit forced
  a shared reprice: **every price is now payable only in goods both
  courses can produce when the rung appears** (EN iron f j g h holds no
  vowel, so castiron never clears the smelter's V+C gate and qziron /
  steel / blackiron wait for e / o / a) — checked from now on by the
  producibility walk in dev/verify.html (RU) and dev/en.html (EN, plus
  ladder coverage checks). ORE_GOOD retuned the same way (stone → brass,
  coal → gunmetal, oil → glass).
- **The EN ladder reseated (2026-08-25):** the key-for-key placeholder is
  retired — the pinned question answered with a ladder of EN's own. Same
  18 slots, tiers and prices (ore = finger, Mk = reach); the pairs move
  within their fingers by English frequency. T0 = f j (iron, the bumps) ·
  r u (copper — u is the first vowel) · b n; e i arrives at pair 4 (20%
  of text in one rung), a at 10, o at 14. Seating constraint discovered
  on the way: copper must own the index TOP row — brass and gunmetal pin
  deep copper, the smelter book drops vowel-less alloys, and r u t y are
  the only index vowels; iron keeps f j g h, so castiron/steel stay out
  of the EN book exactly as before and the shared prices stand untouched.
  The full ladder, the split of the x/period mirror pair, and the other
  deviations live in Course exceptions below. Content grew to ~1590
  words / 110 phrases / 120 sentences / 22 pages, machine-staged by rung;
  contractions enter with the apostrophe (Oil Mk1); the pronoun 'I' waits
  for the Crane. Engine: TRAINABLE_PUNCT is now course-declared
  (`MINE_MARKS` — invariant 5; RU keeps the ['.','-'] fallback).
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
- **Pacing accepted (2026-08-20, the user):** ~20 bot-hours to the finish
  at PACE 3 is the target shape. Any lengthening comes from **more page
  variety extending the late game**, not from raising prices — the PAGES
  file is where the game grows.
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
  carry the pyramid — veins per ore in proportion to the work that ore is
  asked to do, computed from the tree rather than named (see *Veins follow
  the tree*) — and the outer regions have their own plots.
- **Discoverability (2026-08-19):** the in-canvas menus are icons only (the
  bitmap font has no letters), so a **caption** (`#place-caption`, DOM text,
  EN/RU) sits at the bottom of the map: while a menu is open it says what
  the chosen row does ("Take the belt spool and carry it to a machine that
  uses copper ore", "Lay the belt here, 3 tiles from the Copper mine", "No
  belt here: it doesn't use stone", "Mk2: Iron mines reach the keys …",
  "Automate this recipe: …", prices append "not affordable yet"); docked
  without a menu it names the place and says "hold Space for the menu";
  while carrying a spool it states the errand. **Two lines** (2026-08-27,
  user decision): the caption is the place's name in brass over what can be
  done with it, either line standing alone. The identity line covers ground
  that all looks alike (free veins name their ore, build sites say "Build
  site", tracked by tile as the operator walks), and the action line is
  omitted rather than padded when there is nothing to do. No hover
  tooltips, no caption for bare open ground until something is buildable.
  **Terminology and typography (user rulings 2026-08-27):** the buildable
  ground is a "build site" everywhere, code identifiers included (was
  "surveyed plot" / "pad"; only the v1 save spellings `p.plots` and the
  machine `plot:` anchor stay, as save-readers), and no English string
  anywhere uses an em dash (Russian keeps its dashes; they are standard
  Russian typography).
- **The selector** (2026-08-27, user decision): the docked place (machine,
  belt, closed crossing) is marked by **corner brackets around the whole
  object** (ink under colour, `drawSelector` in factory.js, gently
  breathing), not by the old 2px foot bar, which vanished on dark ground
  and never read as "this one". A docked belt brackets the one tile
  underfoot, not the run. Colours keep their meanings: gold = menu, green
  = rows available / belt may land, red = it may not. While carrying, every machine
  shows a **bar**: green = a belt from this spool may end here (free
  inlet, takes what the source makes), red = not; a beaded **cord** runs
  from the source machine to the operator; the route preview is gold (red
  = no free path). **Carrying is modal** (2026-08-19): there is no menu
  while the spool is on your back — at a machine that can take the belt a
  green chevron bounces over it, its dock glow is green, the caption reads
  "Hold Space: lay the belt here, N tiles from X", and the hold lays the
  belt at once (the charge bar fills green); anywhere else — no machine,
  the source, a machine that can't take it (red glow, caption says why) —
  the same hold **drops the spool** (charge bar red, caption "Spool
  dropped — no belt laid"), so aborting is one hold wherever you stand.
  Info rows that would run off the world's top edge stand beside the place
  instead. The bag holds at most `TUNING.BAG_CAP` (9999) of any one material:
  everything that puts goods in it goes through `CHAIN.bagAdd`, and past the
  cap the surplus is not held anywhere — it never arrives. **Developer mode**
  — a subdued tickbox at the foot of Settings, off by default and remembered
  per device beside the interface language — arms the cheats; unticked, they
  do nothing. Behind it: **Ctrl+Alt+M** or **Ctrl+Shift+Q** give 500 of every
  material in the tree, opened or not (a caption confirms).
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
  Ctrl+Alt+M (or Ctrl+Shift+Q) gives 500 of every material in the tree,
  behind the developer-mode tickbox in Settings (off by default); the bag
  caps every material at 9999 and drops the rest.
  `dev/verify.html` runs the data checks.
- **One pixel grid, no exceptions**: integer device-pixel upscale with
  letterboxing (roundPixels, whole-pixel camera and sprite positions), bitmap
  pixel font for all in-world text (digits/arrows/₽, ink outline baked),
  pixel-pure circles, one named palette in pixels.js.
- **The operator (redrawn 2026-08-21, CrossCode idiom)**: **a fantasy
  mechanic — the man who works on airships** (user ruling). 20×28 in
  `pixels.js`: a leather flight cap with brass goggles strapped to it, an
  aviator's scarf in verdigris, a long working coat, a leather rig across the
  chest carrying a brass pressure gauge that still has a light in it, heavy
  gloves, brass-capped boots. He is dressed out of the machines' own material
  list — iron dark, brass, verdigris, one warm fire — because he is the man
  who keeps them running. Not a builder in a hard hat, and nothing futuristic.
  - **The value rule, measured off the CrossCode sheets in `assets/inbox`**
    (12 and 21 colours per character): ~30% of a sprite is ONE near-black
    tone doing both outline *and* shadow — and it is a saturated dark, not
    black. Highlights are 3–5% of the pixels. One saturated accent hue
    carries the eye; everything else is dark. The head is a third of the
    height and the widest part of the sprite; the body is narrower than the
    head. **The cap is what makes this work here** — drawn with bare hair, a
    head-sized slab of mid-brown became the brightest thing on the sprite,
    the exact inverse of the rule.
  - **Animation (reworked 2026-08-21 on user note: "the legs don't look or
    move like legs, and there's no arm movement at all")**. Arms and legs are
    **limbs, not grid rows**. The sleeves used to be drawn into the torso
    grids, which is exactly why the arms could not move — an arm baked into
    the torso is an arm that is always in the same place. The grids stop at
    the shoulder now and `limb()` walks a slanting, dark-edged bar between two
    points, so a thigh or a forearm can angle. Legs are `w=2` (four across),
    arms `w=1` (three): an arm as wide as a leg is a slab, and against a coat
    this dark it stops reading as an arm.
    - **A leg is a thigh, a knee, a shin and a foot.** It was a vertical bar
      that got shorter, which reads as a leg retracting into the body rather
      than stepping. The knee sits between hip and ankle and leads the foot;
      the foot is its own horizontal thing, and in profile it points the way
      he walks.
    - **Walk = 8 beats.** Beats 0–4 are STANCE: the foot is planted and
      travels backward under him as the body passes over it. Beats 5–7 are
      SWING: it lifts clear and comes forward to land. The far limb runs the
      same cycle half a turn later. The passing beats are ±1, not 0 — at dead
      centre both legs land on the same pixels and he reads as having one
      thick leg for two beats of every cycle.
    - **Face-on there is no room to swing the feet past each other** — hips
      six pixels apart and a four-wide boot means opposite strides collide.
      So face-on the feet shift *together*, a weight shift on the beat the
      coat swings, and it is the lift that alternates. The arms carry the
      stride instead: hand ±2 across and ±2 up, elbow bending with them.
    - The body drops a pixel at contact and lifts one at passing; in profile
      the coat's tail and the scarf's trail a beat behind, because cloth
      lagging is what makes a walk read as a walk. All 8 beats differ in
      every direction.
    - **Idle = 4 slow beats of breath**: head and chest ride together — a
      seam opens the moment they don't — and the chest gauge burns brighter
      on beats offset from the rise, so it is four distinct beats and not a
      two-pose flicker. work = 4 beats, back to us, both hands up on the
      console with a nod and the hands falling in alternation.
  - Anything hung above him (the hold-to-interact charge bar) is positioned
    off `PIXELS.CHAR_H`, not a literal, so it survives the next resize.
    `dev/operator.html` is the proof sheet — every beat, plus a magnified
    strip on grass and on ink, and the operator at a machine for scale.
- **Charm animation**: 8-beat directional walk + idle breath + working pose
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
- **The welcome card says four things** (user decision, 2026-08-27): walk
  with arrow keys and interact by short- or long-pressing spacebar; stand
  at a machine and type; use mines and machines to create new materials,
  and materials to build more advanced machines; discover new recipes and
  the secrets that lie in the most advanced materials. The last two are the
  goal, added the same day: the card must say what the game is for, not
  only how it steers. Everything else (menus, building, belts, prices,
  pacing) is taught in place by the caption under the map at the moment it
  applies. The one gap that closed: open ground now carries a dim "hold
  Space to build" caption, shown only while the build menu has a row the
  bag can cover.
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
  shared, the ground is not: each map brings its own `MAP` rects, `SITES`,
  `SCENERY`, `PROPS`, world size, spawn, the hub's spot, and which build site
  each pre-built station stands on (`HOME`). A map changes *where* things are,
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
  **The Frontier** (`frontier`, 1600×720) — the open basin below, the game
  proper: one wide meadow to build in with all six biomes, every terrain and
  every obstacle wrapped around its rim. **Open
  Range** (`range`, 1168×464 since 2026-08-21, the frontier's width) — one
  flat meadow ringed by forest on a 13-column grid at an 80px pitch: the
  vein row holds thirteen seams, alternating across and on end so both
  seatings get walked into on the easy map; three ranks of thirteen plots
  below it (39 in all, generated in code from the grid), each a full 3×3
  with every facing legal; the landing sits west, a worn road runs under the
  vein row, nothing stands in any route, a pond in the SE corner for colour.
  The ranks are half a step off the seam columns so no pad ever stands
  directly under a seam bedded on end. Tests the mechanics (build, deliver,
  automate, belt, edition) without walking or gating, with room for the
  whole 14-machine tree and then some. **A world is a file** (2026-08-20):
  `js/maps/kit.js` holds the shared kit and the registry, and each world is
  `js/maps/<id>.js` ending in `MAPKIT.register({...})`, loaded before
  `js/chain.js` — which now owns only the chain. Adding a world = a new file
  in `js/maps/`, a script tag, and two i18n strings (name, tagline);
  registration order is the picker's order and the first one is the default.
- **Dynamic viewport**: fills all space the drill + keyboard don't need, at
  the largest integer zoom that keeps ≥300×170 world px visible — bigger
  window means bigger pixels first, then more world. Never letterboxes more
  than one integer step.
- **Building = chosen plots (user ruling 2026-08-11)**: the chain is authored
  (what stations exist and what they consume/produce IS the curriculum), but
  the player picks WHICH free dashed plot each earned kit occupies. Solid
  scenery (columns, stock mountains, scrap heaps) makes routes uneven — map
  variance, bounded strategy, never ratio planning. Data-driven (SITES +
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
  (**User ruling 2026-08-20: nothing on The Frontier is gated at all.** Its
  rebuilt geography has no closed crossing — every bridge and causeway
  carries `free` and stands open from the first second. The repair mechanic
  and `PRICES.crossing` remain in the code for a world that wants them.)
- **The keyboard check (2026-08-20)**: the game is desktop-only and now says
  so instead of dying quietly. Everything it reads is a physical position
  (`e.code` through the layout tables) and two keys are *held* — space runs a
  machine, arrows walk — none of which an on-screen keyboard sends, so a
  phone would load the world, look playable, and never answer a keystroke. On
  a touch-primary device (`(pointer: coarse)`) with no keystroke on record,
  a card stands in front of the world picker and asks whether the device has
  a keyboard, with one Dismiss button. **The question goes to the pointer,
  never to the OS** — an Android tablet with a board plugged into it plays
  fine, and a touchscreen laptop still reports a fine pointer first, so it is
  never asked. One keydown carrying a real `code` — which no soft keyboard
  emits — proves the input path works, clears the card if it is up, and is
  remembered (`mk.keyboard`) so the device is never asked again. Dismissing
  alone is not remembered: a device that truly cannot type still needs the
  answer to "why is nothing happening" next time.

## The outdoor pivot — SHIPPED 2026-08-11

- Tilemap world on a **16×16 square tile grid** (`PIXELS.TILE`; was 16×12
  until 2026-08-17; world = 33×15 tiles): grass base with wildflowers, dirt
  work-aprons under machines, an unwalkable pond, ore nodes beneath the mines,
  a treeline border, solid trees/rocks shaping routes. All data in chain.js
  `MAP` (DIRT/WATER/NODES rects, grid-aligned) + `SCENERY` — a new map is a
  new set of rects.
- **Ore veins (redrawn 2026-08-21, user: identifiable "rather than just
  various colours")**: the six were one silhouette in six hues — the same
  oval of soil with the same six rectangles, tinted grey-blue for iron,
  orange for copper, pink for quartz. Nothing about the *shape* said which
  ore it was. Each is its own form now: **iron** cleaved plates with rust
  across the face (rust only on the soil left six grey rocks that could have
  been any metal); **copper** verdigris crusting the top with the metal
  showing at the foot, because copper in the ground is green, not orange;
  **stone** flat level bedding, no metal, no crystal; **quartz** standing
  prisms, the one vein nameable from its outline alone; **coal** glossy black
  shards with hard specular hits and live embers in a **pale ash bed** — the
  one vein whose bed deliberately does *not* match its region, because black
  ore on dark ground was invisible; **oil** not a rock at all but a seep with
  an iridescent film. 5–9 colours each. Checked legible on all eight ground
  types (grass/dirt/rock/marsh/sand/shale/snow/crack) — `dev/veins.html`.
  - **Two seatings, because a mine rotates**: 36×16 across, 16×36 down.
    Rotating the art 90° is not enough — quartz would lie on its side and
    stone's bedding would run vertical — so each seating is laid out
    deliberately and every feature is drawn world-up in both.
  - **The 1×2 art is ready ahead of the layout** (user, 2026-08-21: every
    patch in the game is 2×1 today; laying out mines that use the other
    seating is a separate task). Nothing renders 1×2 yet — all fourteen veins
    come out 36×16 on the current maps. Two hooks are in place for whoever
    does that work, and both are meant to be overridden rather than treated
    as settled: a vein reads `vert` off its own `NODES` entry, and
    `reseatVeins` (factory.js) lets a mine standing on it override that with
    its own facing — e/w means 1×2. It re-runs on every rebuild, because the
    terrain pass that creates the vein sprites has no profile to ask.
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

### Materials — one sprite, and the belt sets its size (ruling 2026-08-20)

**A material is drawn once.** `PIXELS.matSprite(id)` is the picture in the bag,
the picture in a recipe row, the picture that flies to the bag, and the picture
that rides the belt. There is no smaller stand-in for the belt: a tinted square
told the player only which ore a good *started* from, so every iron alloy was
the same object going past, and the thing on the band had nothing to do with
the thing in the HUD.

**The belt sets the size, and the size is ten world pixels.** A run's trestle is
twelve pixels across and its band is six. A good is centred on the band with its
corner cells left clear, so at the worst point of a quarter turn it reaches
8 + 4·√2 ≈ 13.7 from the pivot and never rides out over the grass; twelve would,
on every corner. Goods sit a whole tile apart, so ten still leaves six pixels of
band between them. `PIXELS.MAT_PX` is that number — read it, never repeat it.

Four rules make twenty-five materials tell apart at ten pixels:

- **Form is the silhouette.** An ore is an irregular lump (each of the six its
  own: angular chunk, round nugget, flat slab, twin crystals, jagged lump,
  stoppered flask). A two-ore alloy is a flat-topped, square-shouldered **bar**
  with the added ore left showing as a cap at one end. A three-ore alloy is a
  **stack of two** — the parent alloy below, the ore the foundry added on top,
  so the recipe is legible off the good. Glass is the one non-metal and gets a
  **pane**. Then a gear, a cast channel, an instrument block, a hex nut, a
  crate, a lit boiler, a coin. Fifteen silhouettes, no two alike.
- **An alloy has its own colour, not a blend of its ores'.** Bronze is bronze,
  brass is brass, steel is bright. Eight bars separated only by a tone swap are
  eight of the same bar. The six ore hues are pushed apart for the same reason —
  iron reads blue-cool, stone warm sand, because at ten pixels a grey is a grey.
- **The rim is the light, not the material.** Every sprite takes the same rim
  after its mask is painted: dim cream squarely above and left of the body, ink
  down the shade side. Every ground a good sits on is dark — the belt band, the
  HUD plate, a menu row — so an ink outline alone would sink into it and take
  coal with it. Only *square* neighbours take the light; let the diagonal
  staircases light up too and the cream stops being an edge and becomes a halo,
  which at ten pixels is a quarter of the sprite spent on nothing.
- **Grade is a twinkle, and hue is the grade** (2026-08-25). Form and colour are
  spent on *which* material a good is; they cannot also say *how deep it was
  dug*, because a deep ore wears its family's art by design. So depth animates
  instead: **Mk1 nothing, Mk2 a small warm gold twinkle, Mk3 a wider verdigris
  one**, on a one-second cycle. Two rules keep it honest. The difference between
  the grades is **hue, not size** — a moving ten-pixel sprite hides size and
  cannot hide warm against cold — and subtlety is brightness, never *rarity*: a
  mark that is dark most of the second is not subtle, it is missed. Mk2 runs
  half the cycle at five pixels, Mk3 all of it at nine. Every sprite carries its
  own phase, so a run of deep ore shimmers down the line instead of the whole
  belt blinking at once.
- **The mark is one sprite, and it is not part of any material** (2026-08-26).
  A good is drawn, and its grade rides on top of it: a transparent ten by ten
  holding nothing but the twinkle, the *identical* overlay over every material
  of that grade (`gradeMark`/`gradeTex` in `pixels.js`, hung as a child by
  `matIcon` in `factory.js`, which is where the bag, the belts, the ground and
  the price rows all get their sprites). So there are twenty-four marks in the
  whole game — two grades, twelve frames — not a private set baked into every
  ore, and a material keeps the one texture it always had. **There is exactly
  one mark.** A static depth pip said the same thing worse until this ruling
  and is gone: two marks for one fact is one of them lying, eventually.

Masks are 8×8 character grids laid at (1,1) in `pixels.js` (`ORE_MASK`, `BAR`,
`STACK`, `PANE`, `FORM_ART`); a digit indexes a tone list. Keep the four corner
cells of a mask empty — that is what keeps the good inside the trestle on a
turn. Proof sheets: `dev/mats.html` (every material in the bag, on a straight,
round a corner, and the whole ladder on one run), `dev/mats-zoom.html` (the
pixels themselves, on both the grounds that matter), and `dev/grade.html` +
`dev/grade-zoom.html` (every frame of the grade twinkle, on the band it rides,
and the three grades of a family side by side).

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
4. New machine art is **not finished** until all three states exist **at all
   four facings**. The proof sheet shows every machine in all of them.

Frames and clocks: `work` is the 4-frame beat (one frame every 9 ticks); `idle`
is a 6-frame breath on a slower count (one frame every 12 ticks), so the two
never read as the same animation slowed down. In code, `PIXELS.machineTex(look,
frame, mode, facing)` and `PIXELS.stationTex(kind, frame, mode, facing)` take
the mode and the facing; `js/factory.js` caches one texture band per (look,
state, facing) and picks both each tick.

### Machine drawing — four facings and the doors (rotation overhaul, 2026-08-21)

Machines turn rigidly, so every kind is drawn **from four angles** — and the
four are three: the **front** (`s`, the fully-furnished face every station
was born with), the **back** (`n`), and the **flank** (`e`), with **`w` the
flank flipped** — exactly how the operator's own `down/up/side` sprites
already turn. The rules that keep the four reading as one machine:

- **A half turn swaps left for right.** The back view is the front's massing
  mirrored: a smokestack on the front's left stands on the back's right. A
  quarter turn clockwise carries a pipe that left at the bottom to the left
  edge. The facings strip on `dev/machines.html` shows the smelter turned
  through all four over its port plates — that strip is the contract.
- **The fire and the furniture face front.** Fireboxes, dial banks, mould
  beds and delivery stacks live on the front view; the back is service iron
  — rivets, ladders, plain plate — and the flanks are working profiles. The
  **signal lamp shows in every view** (the idle breath must read from any
  side), every flue keeps its puff, and each view keeps at least one moving
  part on the work beat.
- **The overhang cap.** A sprite overhangs the back edge of its body box by
  at most ~8px (art height ≤ `deep·16 + 6`, seated with its bottom 10px —
  mines 2px — above the box's south edge), so the **outer half of the row
  behind stays clear**: a port that lands back there keeps its ground plate
  and its arriving run visible. This is the readable-back ruling that
  reopened the fourth side, and it is what trimmed the mining rigs from
  26×36 to 26×22.
- **The doors — every port's body half (the aesthetic ruling that started
  the overhaul).** Every inlet and outlet on the ground has a fixture on
  the body it serves, in the plates' own colours — **verdigris takes
  deliveries in, brass sends the product out** — so which way the goods go
  is written on the machine as well as the ground, and it turns with the
  machine. Three fixtures in the shared kit, chosen per view by where the
  port's side stands (`DOORS` + `doorsS/N/E` in pixels.js):
  - a **hatch** — an 8×6 roller door on the visible face, on the tile
    centres its plates take;
  - a **jamb** — a 3px door-post strip riding a near edge of the body;
  - a **crest** — a lintel tick over the far silhouette, high on the roof,
    for a port whose side looks away (with the plate and the run on the
    ground behind completing it).
  The side views wear the doors of the flank that actually shows: facing
  east that is the machine's right flank, facing west its left — the body
  flips, the doors must not lie (`doorsE`'s `west` flag).

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
  | bridge | boardwalk | stairs, rect, style, `dir` 'h' walked E–W / 'v'
  walked N–S — stairs bake as a flight through a face — and `free`, which
  means it was never broken and stands open from the first second);
  `NODES` ×14. Elevation is multi-level: any drop shows a face on the row(s)
  below in the HIGH biome's cliff palette, any higher edge shows a rim.
  `regionAt(x, y)`; `crossingOpen(profile, c)`.
- **`js/maps/kit.js` — the map kit (2026-08-20)**. A world file is data and
  arithmetic only: no PIXI, no CHAIN. `sc()` places solid scenery; `hash` /
  `noise` / `fbm` are deterministic value noise (never `Math.random` — the
  save remembers where things were built, not what the ground looked like,
  so a world must bake identically on every machine); `blob(cx,cy,rx,ry,seed,
  wob)` is a noise-wobbled ellipse in tile space, wobbled in polar
  coordinates so it closes on itself — two blobs sharing a seed wobble in
  step, which is how a shore follows its water; `path()` is a wandering worn
  track; `box()` is for the things somebody actually built; and `field(cols,
  rows, pick)` turns a per-tile decision back into GROUND rects, run
  together along each row. **The schema is still rects. The shapes are not.**
- **The world — THE FRONTIER (rebuilt 2026-08-20, works and seams re-laid
  2026-08-21; 1600×720 = 100×45 tiles)**.
  A 60×20-tile grass **basin** in the middle holds the landing, a wandering
  track, thirty plots on an 80px grid and the first vein of every ore.
  Nothing solid stands in it — no cliff, no water, no boulder, not one rock.
  **The landing cluster (user ruling 2026-08-20): the three mines the player
  starts with must all be on screen when the world opens.** Iron, copper and
  stone stand around the landing pad, authored against the worst case the
  dynamic viewport allows — 300×170 world px, so 150 either side of the
  spawn, 93 above and 77 below (`camY` leans 8px down) — and every one of
  them clears that box by at least 13px. The basin's other four veins sit at
  its corners and the deeper ones are away in the ring: those are a walk and
  a look around, which is the point of them.
  Six biomes ring it and none of them is a rectangle: **peaks** west (snow,
  grey cliffs — a white cliff on white ground has no height to it), **quarry**
  north-west (rock, tan), **canyon** north-east and east (shale, violet),
  **bog** south-east (marsh, grey), **flats** south-west (cracked earth, tan).
  Each fades into the basin along its own ramp of ground kinds — grass →
  dirt → rock, grass → frost → snow, grass → sand → shale — over a front a
  noise field drags back and forth by half a dozen tiles, with the wobble
  faded out towards the middle so the meadow stays clean. Which biome a tile
  belongs to is read at a domain-warped point, so the seams between
  neighbours wander and each throws headlands across the other. High ground
  reads further along its ramp than the lowland at its foot and its crown is
  stripped to stone, so a plateau never wears the same coat as the ground
  below it. Water, ice and tar are blobs with their own shores.
  Landmarks: **THE GREAT MESA** (elev 2, north) is four blocks reaching
  different distances south, so its front steps in and out; each step carries
  a three-tile flight down and a cut through the rim gives a way up each
  side. The **peaks shelf** and the **canyon shelf** are the same idea at
  elev 1, three blocks each. The **island** in the bog has two lobes
  and six open crossings — a plank causeway west, a long bridge east, two
  north and two south. The deeper vein of every ore sits out in the biome it
  belongs to, so each landmark is worth the walk. Nothing is gated: every
  crossing carries `free`.
- **Six works ring the basin — no area gets fewer than three pads (user
  ruling 2026-08-21).** The 2026-08-20 map scattered lone pads over the
  landmarks: one on a mesa finger, two far apart on a shelf, one on a
  headland in the bog. A single pad is a pad nobody builds on — a machine
  wants neighbours to belt to, and a lone square out in the weeds offers
  none — so the outliers were gathered into **six works**, one to a biome:
  quarry 3 on the mesa top, peaks 4 on the snowfield, canyon head 4, canyon
  flank 3, flats 4, bog 4. Fifty-two plots in all. Each works is a group
  within belting distance of itself and of the vein it was put there for.
  **Mines may be isolated; works may not** — ore can be belted or piped
  home, so a seam on a shelf is a reason to walk, while a lone pad is only a
  disappointment. The two elev-1 shelves gave their pads up for the rule:
  seven tiles of walkable top between their rims cannot hold a 3×3 pad and
  the air it needs, so they keep their seams and their view. The mesa (elev
  2) is the one landmark broad enough on top to carry a works, and it takes
  three, not four: **a pad on high ground has to keep its whole port ring at
  its own elevation**, because a run cannot step off a cliff any more than a
  walker can, and the mesa's shallow notch is two rows short of a fourth.
  The bog was re-cut for its works: the lake and everything riding on it
  (island, four bridges, causeway, the island's pad, the coal seam) moved
  five tiles east and the lake lost five tiles of length, opening fourteen
  columns of west bank — it kept its east shore and its whole shape.
- **A seam lies the way the land does (user ruling 2026-08-21).** A mine is
  two tiles by one, and it may stand across a seam or along it, so a node
  carries `vert`: the ore patch is cut 1×2 instead of 2×1 (`pixels.js` has
  always drawn both), the surveyed mark and the build ghost's target follow
  (`MAPKIT.veinBox` — the one place a node becomes tiles), and a mine the
  map pre-builds is stood at the seam's own facing (`CHAIN.nodeFace`). Eight
  of the Frontier's fourteen veins and six of the Open Range's thirteen are
  bedded on end; every ore appears both ways. A player-built mine still
  turns however they like — the ghost only asks that its body cover a free
  vein. A save whose seam moved under it re-seats the mine on the ore
  (`engine.js`) rather than leaving a rig standing on bare ground.
- **`dev/map.html`** — proof sheet: bakes a world through the real `bake()`,
  plants its forest, nodes, scenery and crossings the way `factory.js` does,
  outlines every plot and POSTs the PNG to `assets/inbox/`. This is how the
  terrain gets reviewed. **`dev/tiles.html`** does the same for synthetic
  tile samples. Neither is linked from the game.
- Verified 2026-08-21: dev/verify.html passes 26/26 — every plot and ore node
  stands on clear, reachable ground on both worlds AND clears the four-facing
  guarantee (52 pads + 13 veins on the Frontier, 39 + 13 on the Open Range);
  no console errors; bake ≈ 70 ms cold for the 100×45 frontier.
- Known follow-ups (steps 3–5): landmarks per region (waterfall at the
  stream head, summit), ambient life, tune cobble contrast, HUD rows for the
  four new materials when their machines exist.

### Map thumbnails — baked to file, never drawn at run time (ruling 2026-08-21)

The picker's thumbnails are **static PNGs in `assets/maps/<id>.png`**, and
they are produced in exactly one place: **`dev/map-thumbs.html`**. Run it
whenever a map is created or its terrain is edited, and commit the PNGs in
the same change as the map. Nothing in the game writes them, and nothing in
the game falls back to drawing one — a map whose PNG is missing shows an
empty frame, which is a commit to fix, not a stall to sit through.

This is a ruling because the alternative was measured. The picker used to
call `TILES.minimap` per world as it opened, which bakes that world's terrain
in full. That put an **18.8-second frozen main thread** between the loading
card lighting its last cell and the picker appearing — the card sat there
looking finished while the page was wedged. Two images that change only when
a map does were costing every player twenty seconds of every cold start.

Two things were wrong and both are fixed:

- **Drawing at run time what only changes at edit time.** Now baked to file.
- **`getImageData` on GPU-backed canvases.** `TILES.spill` masks each edge
  tile by reading it straight back after drawing it, and `PIXELS.util.canvas`
  asked for a plain 2D context, so every one of those readbacks was a
  synchronous stall: **12.8 ms per 16×16 tile**, ~1,200 tiles, ≈16 s for the
  first bake of a world. With `willReadFrequently: true` the same tile costs
  **0.14 ms** and the bake **0.5 s** — a 92× and 31× difference from one
  context flag. Any new canvas that is drawn and then read back belongs on
  that same helper; do not hand-roll `getContext('2d')`.

Measured after both changes: worst long task on a cold load **86 ms** (from
18,831 ms), LCP **332 ms** (from 19,260 ms), and picking a world — which
still bakes its terrain for real — **289 ms**.

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
19 key introductions; ~47 distinct lessons; ~110 unlock moments (one every
~17 min); a typical full build ≈ 13 mines, 12 processors, 40 belts.

### The seven rules that generate the tree

If a recipe or a tier disagrees with a rule, the recipe is wrong.

1. **An ore is a finger. A Mk is a reach.** *(LOCKED 2026-08-18.)* Iron,
   copper, stone are the index finger's home, top and bottom rows (the six
   most frequent letters); quartz is the middle finger, coal the ring, oil the
   pinky. An ore's Mk adds the next key-pair on that finger. Pairs are mirror
   keys — same finger, both hands — sorted by frequency. Mk is per ore, not
   per mine: every iron mine drills the same keys. This is course data; the
   EN course assigns its own pairs to the same six ores (done 2026-08-25 —
   see Course exceptions: EN).
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
   design and pace it — they are never a check: order comes only from what
   the prices are made of, and pacing from how much they ask for plus the
   readiness bar. Each row shows a price and nothing else — accuracy and
   speed are shown, never a gate. **The ladder branches (2026-08-22):** a
   save holds a Mk level per place (each ore, and the Fastener), every
   place always sells its next level at its real price, and no counter or
   key total is ever consulted — see *The ladder branches* below. A build
   row for a machine that would have nothing to make is dimmed and names
   the upgrade that gives it a recipe ("after Coal seam"); it cannot be
   built until then, so no machine is ever born dead.
7. **Automation runs on the clock. Skill never does.** What is mastered works
   without you: automated machines and belts run in real time — while you
   walk, build, or have the tab hidden (fast-forward on return). Idle
   production is bounded: buffers cap (~100) and then the machine waits, and
   the current tier's goods are always hand-made (a kind gets ⚙ one tier after
   it arrives), so waiting fills the inputs of your next lesson and never pays
   for your next purchase. New letters and machines come only from what
   typing earns.

### RU course — pairs, ores, tiers (LOCKED)

Fifteen mine events + four key events at machines = nineteen key
introductions. Coverage of running Russian text: T0 47% · T1 71% · T2 86% ·
T3 96% · T4 100% of letters · T5 adds the deep punctuation. All six T0 keys
are index-finger keys. **No place goes past Mk3 (user ruling 2026-08-22):**
Russian's rare pinky tail (э х ё ъ, ~1.5% of text together) folds into the
oil rig's last two rungs as four-key row sweeps — see Course exceptions
below.

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
| 10 | T3 | Oil node | я . - (Z / Minus) | м ь | 60 modules + 40 steel | pinky, the period and the dash key (phrases just began — see Course exceptions); black iron; Fastener Mk1 (comma = Shift+/) right after |
| 11 | T3 | Quartz Mk3 | у ш (E I) | я . , | 60 quartz + 30 black iron | quartz retools; T1 stations refresh (суп шум шов) |
| 12 | T3 | Oil Mk2 | й з х ъ (Q P [ ]) | у ш | 60 oil + 30 glass | oil retools; the pinky's top-row sweep (tail fold); black brass; -ый -ий -ой |
| 13 | T4 | Coal Mk2 | ч ю (X .) | й з х ъ | 40 fastened + 40 brass | coal retools; Fastener Mk2 (? ! -) |
| 14 | T4 | Oil Mk3 | ф ж э ё (A ; ' `) | ? ! - | 60 oil + 30 fastened | oil retools; the pinky's home-row sweep, ё on the corner key; all 33 letters in |
| 15 | T4 | Coal Mk3 | ц щ (W O) | ф ж э ё | 60 coal + 25 glass | coal retools; quartz steel; -ция -щик; then Crane (Shift), then Fastener Mk3 (: ; " ( )) |

Key events at machines: comma (Fastener Mk1, T3 — Shift's first appearance,
the layout's signature hurdle) · ? ! (Fastener Mk2, T4 — RU's dash moved to
the derrick) · Shift as capitals (Crane, T5) · : ; " ( ) (Fastener Mk3, T5).
Numbers stay out (a bonus tier later — the user wants them added for the
late game eventually, 2026-08-22).

### Course exceptions (user ruling 2026-08-22)

**No place goes past Mk3, ever — three reaches is the shape of the game.**
Where a language's alphabet doesn't divide evenly into mirror pairs over six
ores, the course folds the remainder into existing rungs and documents the
deviation here and in its own course file. Every layout will carry a few of
these; they are data, never engine rules (invariant 5).

**The pair order is a base mode, not a law (user ruling 2026-08-25).** The
mirror-pair spine — index out, home row first, both hands on the same finger —
exists for one reason: to order lessons sensibly for a learner. Easiest reaches
first, every new key with a twin so the hands stay balanced. *That purpose is
the rule.* The specific ЙЦУКЕН sequence is only its best answer for a
33-letter Cyrillic alphabet on an ANSI slab — it is not itself the principle,
and a course does not have to argue its way out of it. Where a language's own
frequencies, script, or input method make a different order the better teacher,
the course takes the better order and documents it here. Base mode is what a
course inherits when it has no reason to differ.

What base mode actually holds steady is the **frame**, not the sequence: six
ores = six fingers, Mk = reach, eighteen-odd slots, shared tiers and prices. A
Latin or Cyrillic course inherits that whole frame and moves only *which pairs
sit where* — by its own letter frequencies, within their fingers. That is
exactly what the EN reseat of 2026-08-25 did, and why it cost nothing
structurally: same slots, same prices, English order.

Romaji, pinyin and kana courses go further, because for them even the frame's
unit is wrong — kana teaches a syllable, not a letter, and its natural order is
by sound family (gojūon), not by finger. Those courses set their own ladder
outright and let the ore-per-finger mapping follow it, rather than bending the
order to keep an ore where it was. See the JA course sketch below.

- **RU (ЙЦУКЕН):** 33 letters leave a rare tail on the pinky. Oil Mk2 is a
  four-key top-row sweep (й з х ъ — Q P [ ]) and Mk3 a four-key home-row
  sweep (ф ж э ё — A ; ' `), with ё on the corner key the course's one
  off-finger stroke. The four tail letters together are ~1.5% of text.
- **EN (QWERTY, reseated 2026-08-25):** its own pair order in the same 18
  slots — T0 is f j · r u · b n, then e i, g h, d k, s l + period, t y,
  v m, a ; ' (the pinky home sweep), ?, c + comma, q p, w o, ! -, z, x,
  : " ( ). Copper owns the index top row (r u t y) so the deep-copper
  alloys (brass, gunmetal — Fastener price goods) keep a vowel; iron's
  vowel-less alloys stay out of the EN book, as the price tables already
  assume. The x/period mirror pair splits: the period joins s l at Coal
  Mk1 (sentences begin at the Fastener, rung 11 — its mirror slot is
  rung 17), and x stands alone as the Coal Mk3 capstone; z stands alone
  at Oil Mk3. The comma rides Quartz Mk3 unshifted; the apostrophe rides
  Oil Mk1 and opens the contractions; '?' is Shift+Slash, the same stroke
  as the Russian comma; the / ` [ ] caps stay untaught. The pronoun 'I'
  waits for the Crane with every other capital — earlier content simply
  avoids the word.
- **RU: the dash key rides the oil derrick (Oil Mk1 = я . -).** Russian
  leans on the dash the way English leans on the comma, and phrases — the
  first content a dash belongs in — begin right before the derrick opens
  (its price is the Assembler's modules). The Minus key is a right-pinky
  reach and oil is the pinky's ore, so even the finger stays honest.
  Generated word and ending lines seat it standalone with a space each
  side, the way тире stands; drills never put it inside syllables. The EN
  course keeps its dash at Fastener Mk2 — a mark on a mine rung is a
  per-course seating, exactly like the period.
- **Punctuation is a course decision, both the set and the glyph.** Russian
  prose leans hard on the em dash (тире: «Москва — столица») — and the
  standard ЙЦУКЕН layout has **no em dash key**: real typists get «—» from
  editor autocorrect, Alt+0151, or enthusiast layouts. Same story for the
  typographic quotes «». The course therefore teaches the *stroke* and maps
  the *glyph*: the Minus key is the dash — drills display and accept «—»
  for it in sentence content — and the Quote-role key carries the quote
  glyph the language actually prints. The glyph map lives in the course
  file next to the pair table.
- **Expected later, same pattern:** Spanish (ñ on its own key on ES layouts;
  dead-key accents; ¿ ¡ bought as *pairs* — the opening mark and its closer
  are one purchase, which is a better rung than anything in the EN course),
  German (QWERTZ on an ISO board — ä ö ü ß all land on real unshifted keys in
  the pinky's territory, so the tail folds exactly as Russian's does; and the
  y/z swap puts German's near-useless y on the pinky bottom, which the
  frequencies endorse), Polish (plain ANSI, but nine letters live behind
  AltGr — a new modifier taught like Shift, and a ladder that runs a *second
  layer* over keys already owned instead of growing longer), French (AZERTY
  moves the home fingers), Arabic (RTL; mirrored marks ، ؛ ؟ on the same
  physical keys as their Latin twins; Shift carries letters, not just
  capitals).
- **Correction: three of these do bend one engine rule.** The earlier claim
  that none of them do was too generous. Spanish dead keys, Polish AltGr and
  kana dakuten each produce **one character from more than one keystroke**,
  and `CHAR_TO_CODE` is a 1:1 map. It wants to become char → keystroke
  sequence (`{code, mods}[]`) once, deliberately, rather than three times as
  a patch. Two smaller ones: `'ß'.toUpperCase()` is `'SS'`, which would
  silently poison the auto-derived shifted map; and Arabic's contextual
  letter shaping is broken by the per-character `<span>`s in `renderLine()`
  (`app.js`) — each letter isolated in its own box renders in isolated form,
  so الكتاب comes out as ا ل ك ت ا ب. The tech tree is untouched by all of
  this.
- **CJK: the IME is real, but the dominant methods are QWERTY skills.**
  Roughly nine in ten Japanese PC typists use romaji input — type `nihon`,
  the IME shows にほん, Space converts to 日本, Enter commits — and the
  overwhelming majority of mainland Chinese typists use pinyin the same way.
  Both are Latin letters on an unmodified board, so a romaji course and a
  pinyin course are data drops on this engine with kana or hanzi as the belt
  gloss. That is not a compromise standing in for "real" Japanese: it *is*
  the national skill. What the engine cannot model is the conversion half —
  Space, a candidate list, Enter — which is a decision skill, not a motor
  one. If it is ever wanted, it is shaped like a machine and not a drill:
  romaji → kana → committed kanji is a smelting chain. Kana-direct
  (JIS かな入力, a small but real minority) is the one variant
  architecturally identical to Russian — one key, one kana — at the price of
  a JIS board and dakuten composition. Neither CJK course inherits base mode:
  each sets its own pair order, and neither has word spaces, which quietly
  removes the space bar from the curriculum.
- **Boards:** `BOARD_ANSI` gets siblings — ISO (German, Spain) and JIS (kana).
  The file is already factored for this and nothing has tested the seam yet;
  German is the natural first test. Chinese needs no new board at all.

Prices are placeholders showing the pattern: the ore's own
material, typed by hand right before its new keys arrive, plus a good from the
current tier. Extra mines of an ore are bought at unbuilt nodes and inherit
the ore's Mk. The "comes after" column is the course order — one branch of
the ladder, the one the summary and the pacing bot follow; the live prices
are `PRICES` in `chain.js`, and since 2026-08-22 they are the only thing
that orders one place against another (below).

### JA course — how Japanese gets taught (plan agreed 2026-08-25, not built)

**Ruling: build the IME into the game, and copy the one ~90% of Japanese PC
typists actually use.** Romaji input on QWERTY, not kana-direct. This is not a
simplification standing in for "real" Japanese typing — typing `nihon` on a
QWERTY board *is* what a Japanese person does at a computer. Kana-direct
(JIS かな入力) stays parked as a possible separate course; it is the variant
architecturally identical to RU (one key, one kana) but it costs a JIS board
and dakuten composition, and it is a shrinking minority method.

**Two stages, and they are already the smelting chain:**

> **romaji = ore · kana = ingot · kanji = finished good**

- **Stage 1 — romaji → kana. The mines.** Latin keys on QWERTY, kana shown on
  the belt. Pure motor skill; the pair ladder lives here. Output defaults to
  hiragana.
- **Stage 2 — kana → committed text. The Converter.** Judgment, not motor
  skill. Three output chutes, and the operator picks:
  - **stays hiragana** — particles (は が を に で と も の), verb and
    adjective endings (します ました ている かった). Commit with Enter, no
    conversion. ~45–50% of running text; the busiest chute is the one that
    does nothing.
  - **becomes kanji** — content words. Space, then accept or pick. ~35–40%.
  - **becomes katakana** — loanwords and onomatopoeia. F7 or a candidate
    pick. ~5–10%.

**Stage 1 does not inherit base mode — it sets its own order, by kana row.**
Japanese is learned in gojūon order (あかさたなはまやらわ) and every romaji
tutor follows it. In romaji terms that ladder is unusually generous: after the
five vowels, **each new row costs exactly one new consonant key and pays out
five syllables.** Buy one key, five new kana appear on the belt — a better
payoff-per-purchase than mirror pairs produce anywhere in the RU course. This
is the clearest case of the base-mode ruling above: the purpose (teach in a
sensible order) beats the rule (mirror pairs by finger).

| rung | new keys | kana unlocked |
| --- | --- | --- |
| 1 | a i u e o | あいうえお |
| 2 | k | かきくけこ |
| 3 | s h | さしすせそ (shi) |
| 4 | t c | たちつてと (chi, tsu) |
| 5 | n | なにぬねの + ん |
| 6 | f | はひふへほ |
| 7 | m | まみむめも |
| 8 | y | やゆよ **+ every glide at once** (kya sha cho…) |
| 9 | r | らりるれろ |
| 10 | w | わを |
| 11+ | g z d b p | が ざ だ ば ぱ rows |

**Hiragana is the spine; katakana is a second layer over keys already owned** —
structurally the same move as Polish AltGr. It is not free, though: katakana
carries the long-vowel bar **ー** (the `-` key, essentially katakana-only —
コーヒー has two) and the extended foreign-sound combos ファ フィ ヴ ティ ディ
(`fa` `fi` `vu` `thi` `dhi`), which hiragana has no equivalent for. That earns
a real rung. And it should arrive **earlier than its 5–10% frequency argues**,
because loanwords are guessable for an English speaker — コーヒー ビール テレビ
パン コンピューター — so the player reads their first Japanese word correctly
with zero vocabulary. Strongest early-game beat in the course.

**The Converter must not eat the typing share (invariant: 80%+ of play is
typing).** A candidate list is a menu, and menus are not typing. Copy what real
IMEs do: **a single Space accepts the first candidate**, which is right the
large majority of the time, and modern IMEs convert whole clauses at once
rather than word by word. Surface the candidate list only when the reading is
genuinely ambiguous *and* the course wants to teach that distinction — rare and
deliberate. That also keeps the Converter honest as a machine: it runs itself
most of the time and only calls the operator when the ore is unusual.

**Why the ambiguity is worth teaching at all:** picking 記者 / 汽車 / 貴社 out
of きしゃ is vocabulary practice, not typing practice — the player has to know
which word they meant. For a game whose pitch is typing practice that teaches
you something, that is the strongest content in the design.

**The shown target is the whole spec (user ruling 2026-08-25).** Display the
finished form we want — and where we want the kana left alone, display the
kana. Nothing else instructs the player: the target form silently says whether
to convert and to what, exactly as a document being copied does. Three
consequences worth having:

- **One reading generates three exercises.** にほん / 日本 / ニホン are all
  `nihon` — identical keystrokes, different commits. The romaji ladder and the
  Converter ladder share one bank instead of needing two.
- **A wrong candidate is a typo**, graded by the same character comparison as
  everything else. No new error concept, no new grading path.
- **Ambiguity gets a correct answer.** Showing 記者 makes きしゃ a real
  vocabulary question rather than a free pick. Candidates should still be
  frequency-ordered honestly — that *is* the skill — but the bank controls
  when an ambiguous reading is presented at all.

**Banks: one extra column, and the destination computes itself.** Rows go from
`[surface, gloss, set]` to `[surface, reading, gloss, set]`, and the chute is
derived, never authored: `surface === reading` → stays kana; all-katakana
surface → katakana; otherwise kanji. So balancing the mix is a *query* over a
bank, not a curation burden — measurable and adjustable the way letter
coverage already is. **The alphabet filter runs on the reading, not the
surface** — a word is typeable when its kana are unlocked however exotic its
kanji, which is correct (the player types `nihon` either way and reads 日本 as
a picture). Kanji need no unlock track of their own.

**Two mixes, never conflated.** Characters in running text are ~45–50%
hiragana / ~35–40% kanji / ~5–10% katakana — that is what the typing-share
yardstick measures. *Decisions* asked by the Converter are kanji-dominant,
because hiragana is the null choice. A drill balanced by character count is
mostly kanji decisions.

**Kanji and katakana drill in isolation; hiragana cannot.** は alone is just
"ha" — it is only a particle in context. So the no-conversion chute cannot
appear until items are at least word-plus-particle, which gives the Converter a
three-stage arc mirroring how the mines already tier: (1) isolated
conversions — katakana loanwords first for the win rate, then simple kanji
nouns; (2) word + particle, where the no-conversion chute appears and the
player learns that not everything converts; (3) clauses — one Space over a
whole phrase, glance, Enter. Existing content slots already fit: `SYLLABLES` →
kana (they *are* syllables), `WORDS` → stage 1, `ENDINGS` → the hiragana glue
(します ました ている かった, already keyed by ore), `PHRASES` → stage 2,
`SENTENCES`/`PAGES` → stage 3.

**Focused exercises are authentic registers, not training wheels.** All-katakana
documents exist (menus, product names, foreign place names); all-hiragana
documents exist (children's books); kanji-focus is a noun drill or an ambiguity
set. A themed run never reads as a lab exercise, which matters for a course
teaching a real skill.

**Katakana is easy to read and hard to type** — the inverse of the usual
assumption, so do not seat it as the easy tier. Loanwords are guessable for an
English speaker, but the fingers must produce Japanese phonology, not the
English word: ベッド = `beddo`, コーヒー = `ko-hi-`, サッカー = `sakka-`,
マクドナルド = `makudonarudo`. Small っ, the ー bar, doubled consonants. It earns
its early slot on readability while staying demanding.

**Open question — alternate romaji spellings.** Real IMEs accept both し =
`shi`/`si`, つ = `tsu`/`tu`, ふ = `fu`/`hu`, じ = `ji`/`zi`, ん = `nn`/`n`.
Recommendation: teach one canonical spelling (the Hepburn-ish `shi tsu fu ji`,
which is what learners are taught and matches the sound) and accept the other
silently, never penalised. The short forms are a genuine expert speed
technique — one keystroke cheaper — so there is an option, not a
recommendation, to reveal them later as an efficiency upgrade rather than
day-one noise.

**Also true of this course:** no word spaces, so the space bar leaves the
curriculum as a rhythm anchor and returns as the *convert* key — a promotion,
not a loss. Punctuation is full-width: 。 、 「」 ・ and ー (a letter, not a
mark). The same two-stage model applies to a ZH pinyin course, which is the
method the overwhelming majority of mainland typists use.

### ZH course — how Chinese gets taught (plan agreed 2026-08-25, not built)

**Ruling: pinyin input, the method the overwhelming majority of mainland
typists use, on a plain ANSI board.** No new board file — mainland keyboards
are unmodified US boards with nothing extra printed. Simplified characters by
default (the vast majority of speakers and learners); traditional is a cheap
later variant, see below. Sibling plan to the JA course above; where the two
agree, this section says so rather than repeating.

**The structural difference from Japanese: there is no intermediate script.**
Japanese runs romaji → kana → kanji, and the kana stage is a real script that
stands on its own — roughly half of Japanese text *stays* kana and needs no
decision. Pinyin is not a script anyone reads. No Chinese text is written in
it. So:

> **pinyin = ore · hanzi = finished good.** Two stages, not three. **One
> chute, not three: everything converts.**

The JA Converter's busiest chute is the one that does nothing, which is what
protects its typing share. **Chinese has no null chute at all** — every word
goes through the IME. That is the central risk in this course and the ladder
below is shaped around it.

**The answer to the typing-share risk is long units, and it is what skilled
typists actually do.** Toneless pinyin is drastically lossy — Mandarin has
~400 syllables ignoring tone against several thousand common characters, so
`shi` alone maps to dozens (是十时事实施式市试…). Nobody types syllable by
syllable. They type multi-syllable words and whole phrases and let context
disambiguate: `zhongguo` → 中国 is near-unambiguous, `wojintianhenkaixin` →
我今天很开心 converts on one Space. That is **18 keystrokes to one decision** —
a far better ratio than Japanese word-by-word. So the ZH arc pushes to phrase
length *earlier* than JA's does: word → phrase → sentence, with the isolated
single-character stage kept deliberately brief because it is both
unrepresentative and ambiguity-hell. First-candidate-on-one-Space matters even
more here than in JA (invariant: 80%+ of play is typing).

**ZH does not inherit base mode, and the reason is structural, not stylistic.**
Pinyin has a hard constraint no Latin alphabet has: **no vowel, no syllable, no
output.** English can drill `th` and consonant clusters early; pinyin can
produce *nothing at all* until a e i o u are in hand. The EN reseat seats e i
at pair 4 and o at 14 — under that order a ZH course types nothing for half the
ladder. So rung 1 is forced: the five vowels, which sit on five different
fingers across both hands (l5 l3 r3 r4 r2 — scattered, but balanced). After
that the finger-pair principle can resume wherever it costs no coverage; where
it costs coverage, coverage wins.

**Ladder sketch — 26 keys over 12 rungs, ordered by character yield.** Pinyin
uses all 26 keys: 25 letters plus `v`, which every mainland IME accepts as ü
(`lv` → 绿) because v is otherwise unused. Note `zh ch sh` are digraphs and
arrive free once both halves are owned.

| rung | new keys | characters it opens |
| --- | --- | --- |
| 1 | a e i o u | the vowels — position drill, no words yet |
| 2 | d y | **的**(#1, ~4% of all text) **一**(#2) **有**(#9) 都 第 |
| 3 | n w | **我**(#7) 你 那 为 年 |
| 4 | s h | **是**(#3) 十 说 好 和 会 四 |
| 5 | b l | **不**(#4) **了**(#5) 来 里 吧 八 |
| 6 | r z | **人**(#6) **在**(#8) 日 子 做 走 最 |
| 7 | t g | **他**(#10) 个 国 天 给 过 到 |
| 8 | m j | 吗 们 么 就 家 几 没 见 |
| 9 | c k | 可 看 出 从 才 开 次 车 |
| 10 | f p | 发 方 服 跑 朋 分 |
| 11 | q x | 去 起 下 想 学 前 谢 |
| 12 | v (= ü) | 女 绿 旅 律 — the tail, ZH's ъ |

**Seven rungs of twelve cover the ten most frequent characters in Chinese**
(的一是不了人我在有他). That is the payoff that justifies taking an own order.

**Banks: the same schema as JA**, `[surface, reading, gloss, set]`, reading =
pinyin. Two simplifications over Japanese: the chute needs no computing (there
is only one), and there is no script-mix to balance. One addition: a
**traditional surface** as an optional extra column makes a Taiwan/HK variant
nearly free — identical readings, identical ladder, different glyphs (国/國,
学/學, 门/門). The alphabet filter runs on the reading, as in JA. The only
pass-through material is Latin letters and digits, which appear untouched in
Chinese text (WiFi, 2026年) — a footnote, not a chute.

**Punctuation is full-width, and the IME does the width conversion** — which is
already the house rule ("teach the stroke, map the glyph", as with тире on
Minus). Press `,` get ，; press `.` get 。(a small hollow circle, not a dot).
Two marks need their own strokes and have **no Latin equivalent**, so both are
real course items:

- **、 the enumeration comma (顿号)**, on `\`. Used *only* between list items —
  苹果、香蕉、橘子 — and never interchangeable with ，.
- **《》 book-title marks**, on Shift+`,` and Shift+`.`. Titles of books, films
  and articles; English uses italics or quotes and has nothing equivalent.

Also doubled by convention: —— (em dash) and …… (ellipsis), both written as two
characters. Mainland uses “”‘’ for quotes; Taiwan uses 「」.

**Open question — tones.** Standard pinyin input drops them, which is why
ambiguity is so severe. But real IMEs (Sogou, Google Pinyin and others) *do*
accept tone digits — `ma3` → 马 — and this is worth considering as an optional
discipline rather than dismissing: it teaches the tone, which a learner
genuinely needs and toneless typing actively neglects; it collapses the
candidate list; and it **adds keystrokes**, which helps the typing share. Three
arguments in favour and it is a real IME feature, not an invented mechanic.
Recommendation: default to toneless (real practice), offer tone digits as a
course setting or a late precision upgrade. Not decided.

**Same open question as JA, same answer:** experts use abbreviated input —
initials only, `zg` → 中国, `wjthkx` → 我今天很开心. Real and widely used, but it
*removes* keystrokes, so teach full pinyin, never penalise the short form, and
do not train it.

**Parked variants, none scoped:** **Zhuyin/Bopomofo** (Taiwan standard, 37
symbols on QWERTY, tones typed — architecturally a middle case between
kana-direct and pinyin, since it is one-key-one-symbol *plus* conversion);
**Wubi / Cangjie** (shape-based, near-deterministic, no candidate list for most
characters — the closest fit of anything to this engine, but low single-digit
usage and months of decomposition study); **Cantonese** input for HK. All are
data drops on top of the Converter if ever wanted.

### The ladder branches (2026-08-22 — the Molder problem)

**What was wrong.** Five machine kinds were gated by a hidden key count
(`minAlpha` on a full-alphabet kind): a Molder bought at 12 keys stood dead
with no message, and the only "ladder" was one counter, so the coal seam
could not be opened before Quartz Mk2 whatever you held. A key total is not
a mechanic; progress is what you type and spend.

**The rules now.**
- **A save holds a Mk level per place** — `profile.mk = {iron, copper,
  stone, quartz, coal, oil, fastener}` — and every place always sells its
  next level at its real price, enabled when the bag covers it. "Comes
  later on the ladder" rows are gone. A save from before carries
  `pairsUnlocked` and is read as the same table once (`CHAIN.mkTable`).
- **Prices are the only cross-place order.** The quartz vein and Iron Mk2
  are both for sale from the first smelt (the first branch). The coal seam
  asks for raw quartz, so the ring finger follows the middle. Copper Mk2 and
  Stone Mk2 ask for gunmetal, so they follow coal — and open together. The
  oil derrick asks for modules, Quartz Mk3 for modules, Oil Mk3 (the last
  letters) for
  fastened goods, and the last rung (Fastener Mk3) for a few
  crates — the Crane's existence, not its volume. The Assembler's floor is
  18 keys (the v3 table's own row), so modules imply every rung of the
  first three eras: nothing early can be left behind when the pinky comes.
- **A machine's price names the ore its recipes live on**, so a kind is
  only for sale where it can run: Constructor ← quartz + bronze · Foundry ←
  quartz + brass (never parts — EN's two-ore alloys never field 25 words,
  so its first parts come from three-ore alloys, and the Foundry stands
  first) · Molder ← parts + gunmetal · Fastener ← oil + modules. Quartz
  iron, steel and black iron are never price goods: EN has no vowel on them.
- **Where a price cannot say it, the row names the upgrade.** Mk2 upgrades
  mint no new good, but content floors are real (endings want 14 keys,
  phrases 18, sentences 20, capitals 30, pages 33). `CHAIN.whatUnlocks`
  tries the next level at every place, then pairs, triples and quads, and
  returns the earliest-era set that gives the kind a recipe; the build row
  shows the price dimmed with "— after Quartz vein + Iron mine Mk2", or
  "— after deeper mines" past four purchases. A kind appears in the menu
  once half the goods its price names have been held. A standing machine
  with nothing to make (a cheat, an old save) says so in its caption with
  the same tail. The content floors stay in the engine as the truth the
  captions read — never as a silent lock.
- **Verified on every branch.** `dev/ladder-walk.js` walks every reachable
  Mk table (RU: 98 states, EN: 59) and `dev/verify.html` / `dev/en.html`
  assert: no deadlock; no kind for sale without a nameable fix (or one that
  never comes alive); coal after quartz, oil after coal, the Fastener's
  keys after oil; and report any rung for sale two eras past the lowest
  unbought one (RU: 11 cases, all the last two rungs with one T3 rung — the
  comma or у ш — outstanding; EN: none). Up to four rungs are for sale and
  producible at once. The walk exposed a pre-existing EN deadlock (the
  Foundry costing parts) that the old one-line check could not see.
- **Pacing** (bot, PACE 3, Open Range): 23.9 h against the accepted ~20 —
  T1 2.5 · T2 1.1 · T3 10.1 · T4 4.7 · T5 4.5 · finish 1.1. No price was
  raised; the difference is the Crane's real cost now standing before the
  last rungs (the old log deferred it into the computed finish) and Oil Mk3
  sitting in the Fastener era by price. The human log has the last word.
- **What stays loose, on purpose.** Within an era the order is the player's:
  quartz or iron first, copper or stone first, side upgrades whenever they
  pay. Between eras the slack is one rung at the tail. "Unlock two at once"
  on the spine itself is now a price question, not a refactor.

### Deep ores (2026-08-22 — the ledger, approved and built)

The Mk question's resolution: **a Mk mints a material.** The full worksheet
is the Deep-Ore Ledger (artifact); this is the binding record.

- **Materials.** Each mine rung yields a distinct good — deep iron/copper/
  stone (Mk2), deep and pure quartz/coal/oil (Mk2/Mk3) — carrying its ore's
  letters *cumulatively* through that depth. Deep ore satisfies any recipe
  or price asking a shallower form of the same ore (downward compatibility,
  `matSatisfies`/`bagAvail`/`spendCost`; belts deliver deep goods into
  shallow slots; the bag spends shallow stock first). Variants stop at the
  ore level: parts and above are grade-free.
- **Constant books.** Every ingot pins its ores at exact depths, so its
  alphabet and content pools are constants. A course's recipe BOOK is built
  once at load (`CHAIN.bookRecipes`): Smelter alloys must hold V+C, the
  Constructor's feeds ≥25 words — vowel-poor alloys are absent from that
  course's book, never grayed at run time. `minAlpha` and every runtime
  content floor are GONE: every gate the player meets is an ingredient.
  Six signature alloys, one per deep rung (rivet iron, bell quartz, naphtha
  bronze, coke brass, petrol glass, flash copper), so every Mk is a new
  recipe to hand-work — the revisit as new material. RU Constructor feeds:
  brass, quartz bronze, cast steel, black brass, quartz steel, coke iron;
  EN: brass, black brass, quartz steel (as the ledger predicted).
- **The Fastener's product line.** fastened → sealed (after ? !, +glass) →
  bound (after : ; " ( ), +petrol glass); recipes with `atMk` need that
  many key rungs bought at their own machine. Crates take sealed goods;
  heavy modules take bound goods instead of moldings — the finish itself
  demands the last punctuation lesson. Sealing is 1 fastened + 1 glass (a
  tax, not a pyramid — 2 doubled the endgame in the bot).
- **⚙ is per recipe, with a run-in.** A machine's automation belongs to the
  recipe it runs (`m.autoOn[key]`); a mine's key is the material of its
  depth, so a Mk retools by construction — nothing is switched off, the
  deeper seam is simply new work. ⚙ goes on sale once the machine has made
  the price's own-output count by hand since learning the recipe
  (`m.handMade`, shown on the row as "run it in: N more by hand"), and the
  purchase then consumes those units — no stockpile skips the review.
  A v2 save's per-machine `auto` migrates to its current recipe's key once.
- **No rung is skippable to the finish** (the no-terminal rule): oil's
  price carries rivet iron (⇒ Iron Mk2) and modules (⇒ the whole early
  set); ? ! costs brass (⇒ the deep pair, Copper+Stone Mk2); the Crane
  costs sealed goods + flash copper (⇒ pure coal); bound goods ⇒ pure oil;
  Foundry ← bell quartz (⇒ Quartz Mk2); Constructor ← quartz bronze; the
  Fastener's Mk contiguity carries its own three. The walker holds it: RU
  56 reachable states, EN 59 — none deadlocked, finger order kept, six
  soft cases of a T3 rung early (reported, not failed).
- **Pacing** (bot, PACE 3): 31.1 h against the ~30 target — T3 is the fat
  era (the modules-and-Fastener climb). The human log has the last word.
- **Content volumes** (user ruling: larger than needed, all languages): RU
  clusters 50 → 108; RU words +~105 (the pinned thin sets + the workshop's
  own vocabulary — anvil-and-rivet Russian); RU sentences +40 clause-dash
  lines at тире's true weight ('-' 0.30 → 1.00); EN words 772 → 841; EN
  syllables +17 bigrams for the thin quartz/iron/brass sets. Dup checks now
  in both verify pages.
- **The demand rule — tempo (2026-08-22, the automation-concern talk).**
  Almost every price is one-time, and early on that is correct (the user
  accepts no-surplus play through the opening eras). What makes a player
  build more than one of a kind, automate, and lay belts is TEMPO: the
  player's own WPM is the rate the factory must match, because typing at a
  bench consumes its inputs live and the Manufacturer never automates. A
  25-WPM typist eats ~21 crates a minute against one Crane's 8.6 — the
  endgame needs the wide factory by arithmetic, and every full-set bench
  feels the same pull earlier. Scale buys unbroken typing time, and dead
  air is the enemy. UX: when hands outrun supply, the caption names the
  starving input and the three cures (belt · feed · another maker) —
  never a silent ✗. Held for later, both liked: rolling orders (contracts
  for surplus, the sanctioned gravy) and coal-fired automation upkeep (a
  continuous sink; a new mechanic, decided separately).
- **The bag cap is real (user ruling 2026-08-22): 300 per material.** The
  bag is the hand ceiling; the standing factory is the scalable warehouse
  (every machine's bins hold 100 per material and refill themselves while
  you type elsewhere — wanting a bigger surplus means building more
  works). Every mandatory hold tops out at 240 paced (the Manufacturer's
  crate ask trimmed 100 → 80 to fit), and verify asserts no ask ever
  crowds 80% of the cap. Hand overflow runs bag → the machine's own bin →
  the ground at your feet, with a float; a spill is bounded by typing
  speed and lands in front of whoever typed it. **Automation never
  spills** — a full machine pauses, as ever. Collect leaves what the bag
  can't take in the bin; a full-of-that back walks over its own piles
  without churning them; an old save's surplus spills at the spawn once
  instead of being clamped away.
- **Grade reads at a glance (2026-08-25, settled 2026-08-26).** Deep-ore icons
  stay family art until the Phase 6 bake; what tells the grades apart is one
  animated mark laid over the good — Mk1 nothing, Mk2 warm gold, Mk3 verdigris
  — in the bag, on the belts, on the ground and in every price row. The depth
  pip it replaced has been removed. See *Materials* above for the rule.
- **Still open:** the display glyph map (standalone `-` drawn as —, «» on
  the quote key) rides a later content pass; the number row is its own bonus
  era, later.

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
| Assembler | parts + ingot → modules | phrases (collocations → short sentences, no punct.) | 18, full set (2026-08-22: the whole first three eras, so the oil derrick's modules leave nothing behind) | T2 · T3 | flux ingot's ores are the focus |
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
- **Ports (2026-08-20; body-relative since the rotation overhaul,
  2026-08-21):** every inlet and every outlet stands at one tile against the
  body, and a run has to reach that tile and meet it head-on — it leaves an
  outlet straight out and enters an inlet straight in, which is what makes a
  run look plugged in rather than merely finishing nearby. The places are
  **body-relative**: one per column across the front, one per row down each
  flank, so a body two across and two deep holds six:

  ```
        [r1] [  B O D Y  ] [l1]      (behind: the portless back)
        [r0] [  B O D Y  ] [l0]      the row it stands on
             [f0]  [f1]              the row in front
  ```

  **The whole front discharges; deliveries fill the machine's own right
  flank to the brim, then its left; the back carries nothing.** The ports
  turn rigidly with the body (`SIM.ports`, `MAPKIT.portTile`,
  `FACTORY.machinePorts`): a facing whose front or flank happens to look
  north puts those ports behind the body, and that is legal — see the
  machine-drawing spec for how it stays readable. Marked on the ground with
  a bolted plate — verdigris rim and a wedge pointing into the machine for
  an inlet, brass and a wedge pointing out for an outlet — drawn under the
  runs, so a port with a belt on it still shows its colour down either side
  of the band.
  **The corner plug (2026-08-21):** a run ends ON the plate with its drum
  against the body — that is what plugged-in means — but it no longer has
  to leave and arrive straight: it may **turn on the plate itself**, the
  end tile a quarter-turn piece feeding the drum. This is what lets a run
  hug a machine it approaches from the side instead of swinging a tile
  wide to line up (two wasted tiles per such plug, deadly in tight
  ground). The **cut-off rule** bounds it: a corner's first tile must not
  lie on another port of either machine — a turn that blocked a
  neighbouring plug would trade one port for another — and the router
  never crosses the involved machines' ports at all (a port is a place a
  run ends, never one it passes over). Ties between a straight plug and a
  corner plug go to the straight one. A port whose tile or whose every way
  out is blocked draws faint: it is a port you cannot use where the
  machine stands and faces.
- **Machine sizes (2026-08-20), `KINDS[kind].size = [across, deep]`:** how
  much ground a machine stands on is not decoration — it is what seats its
  ports, and it is the one place the tree's climb is visible in the world.
  The whole front discharges, and a flank of a one-deep body is a single
  tile, so **only a one-outlet machine can be one deep**: the **mine, 2×1**,
  and nothing else. Everything from the Smelter to the Fastener is **2×2** —
  six places, four ports, and the sprite already drew to that box. The
  **Crane and the Manufacturer are 3×2**: the Manufacturer needs its front's
  third place for a fifth port (3 in + 2 out), the Crane earns the width with
  its jib, and the last two kinds ought not to look like the first Smelter
  you ever built. **The footprint turns with the machine** (rotation
  overhaul, 2026-08-21): facing east or west a body stands `deep` across and
  `across` deep (`MAPKIT.footprint`), so a 3×2 kind sideways is 2×3.
  Rejected: 3×3 (it starts costing plots and buys no places), and one-deep
  processors (with one outlet's worth of flank they could never seat two
  belts of intake).
- **A build pad is one size: 3×3 (user rulings 2026-08-20, grown from 3×2
  with the rotation overhaul).** Machines vary; pads do not. A pad has to
  take the largest kind there is **at every facing** — a 3×2 kind sideways
  is 2×3, so the pad is the square of the two — and a smaller machine simply
  leaves slack on it. The alternative was pads that matched their machine,
  which would make "which kinds can I build here?" a question you can only
  answer by walking there and being told no. The pad is drawn as it is:
  48×48 of surveyed ground, taped and pegged, on the exact tiles the zone is
  (`MAPKIT.siteBox`), anchored at the site's foot and grown upward.
  **The four-facing guarantee:** a pad wants every facing of the largest
  kind seatable with every port usable — some seat of the body inside the
  pad, the port tiles and the tile beyond each free, **and a run able to
  step between the two** (a belt cannot climb a cliff, so a port whose way
  out is the drop off a plateau is no port at all). `dev/verify.html`
  asserts it for every pad and every vein on every map, and it is a failure
  now, not a warning: **both maps were re-laid to it on 2026-08-21** — the
  Frontier's fifty-two plots into six works, the Open Range's ranks from a
  64px pitch to 80px with the meadow grown three rows to take them. The
  arithmetic that forces the lattice: three tiles of pad plus two of air on
  every side, because a body seated at a pad's edge puts its flank port one
  tile out and the run's arrival tile two. So pads come **80px apart in both
  axes** and never in a rank of their own. Neither map grew wider or (the
  Frontier) taller in the end: there was room once the pads stopped being
  scattered.
- **The facing is final (user ruling 2026-08-21).** A machine is turned at
  the build ghost — a tap of Space, a quarter clockwise per tap — and never
  after: there is no turn row on a standing machine, because turning one
  would silently re-lay every run plugged into it, and a layout is a thing
  the player laid. To face a standing machine another way, take it down
  (its price, its insides and its goods come back on the ground — the
  demolish door) and build it again; taking down and rebuilding is even,
  so the turn costs only the walk. The turn-in-place that shipped with the
  rotation overhaul lasted a day.
  The re-lay machinery stays for the cases that still need it: a save from
  before ports has its runs re-laid once on load; a body built across a run
  pushes it aside; a run that moves rolls its goods home into the source,
  and one with no route left comes apart like anything else destroyed — a
  poof, the sound, its goods on the ground where they lay (see
  "Destruction, and loose materials on the ground"). Saves from before
  machines stood on tiles are seated once at their old plot or vein
  (`m.at` = the body box's top-left tile, `m.face` the facing — engine.js
  `normalize`). Superseded (2026-08-21): "no fourth port side at the back"
  — rigid rotation reopened the back, and the readability that ruling
  protected is carried by the art instead (the overhang cap and the door
  fixtures, below). Still rejected: free-standing ports the player places
  (a second placement puzzle on top of pads, for a machine two tiles
  wide).
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
no tier locks anywhere — pacing is prices and the readiness bar). Nodes per
ore are not named here — see *Veins follow the tree* below; plots as many as
the tree can use. Open Range needs the same ores on its row A. Choke points
(bridges, gaps) stay authored — they are the belt-congestion feature.

### Veins follow the tree, and are never written down (user ruling 2026-08-25)

This section used to name the counts: *"iron 3, copper 2, stone 2, quartz 2,
coal 2, oil 2."* A number written once and never re-derived cannot follow the
tree it was cut for, and this one did not follow it. Measured against the
recipes as they actually stand, **the ore with the most seams is the one whose
last seam earns nothing, and the ore the tree leans on hardest has the fewest**
— iron's third seam can be taken out for 0.0% while copper, which the cheapest
route to parts runs almost entirely on, sits on two. Nobody chose that; it is
what a fixed list does when the tree moves underneath it. **How many veins an
ore gets is a consequence of the mechanics, not an authored constant**, and it
is recomputed, never remembered.

(Iron's seams are not *idle* — under a balanced blend they run flat out,
because a player short of copper pushes work onto iron on purpose. That is the
point: an ore's load is not a property of the ore, it is what the blend does
when some other ore runs out. Only the marginal seam tells you anything, which
is why the test is marginal.)

The derivation, and why it is available at all:

- **A vein is one unit of supply.** Every mine yields at `TUNING.RATE.mine`
  whatever the ore and whatever the Mk — a depth mints a new *material*, never
  a new *rate* — so an ore's supply is exactly `veins × rate`. Yield is not a
  mechanic and never becomes one; **plenty is placement**.
- **The bill is authored.** Everything the player must buy to finish stands in
  `PRICES` — rungs, first builds, ⚙, extra mines — plus `K_HEAVY` of the last
  good. Nothing is emergent, so the bill totals.
- **The path is the player's.** A good with several recipes can be made
  several ways, and a player short of copper reaches for the recipe that is
  not copper. So an ore's share is not one number off the cheapest path: it is
  what the best *blend* consumes, which is a linear program.

The test is **local optimality, not a target**, and it runs both ways: a map
is **short** when a seam that is not there would buy more than 15%, and
**padded** when a seam that is there could come out for almost nothing. One
floor sits under both: **at least two veins of every ore**, so every ore has
an extra-mine row to sell and no ore is a single point of failure.

Local on purpose, because **the two courses do not want the same cut** — EN's
book has no vowel on the iron alloys, so an EN player leans on quartz where a
RU player leans on copper — and one map serves both. A map is not wrong for
carrying a seam this course would not have chosen; it is wrong for being
short. So the pass condition is *short for nobody*, which one cut can satisfy
for every course at once, and a padded seam is reported rather than failed. A
greedy cut grown from the floor is printed alongside as guidance, never as
the test.

`dev/ore-load.js` does the arithmetic; `dev/verify.html` (RU) and
`dev/en.html` (EN) run it per map and print the per-ore table. It is a **ratio
diagnostic, not a play-length claim**: it assumes mines never stall and
everything they raise is consumed, and it ignores the hands, which out-produce
about six mines at speed.

Measured 2026-08-25, the tree as it stands wants **iron 2 · copper 4 · stone 2
· quartz 3 · coal 2 · oil 2** — fifteen seams, short for neither course (RU
7.2 h, EN 5.2 h). The maps carry thirteen, cut iron 3 / copper 2, which is
short of copper on both courses by about a fifth, and whose third iron seam
can be removed for **0.0%**. That is a reading, not a new spec: it is what the
check said on the day, and it is expected to move.

The same rule governs plots, and always did — *as many as the tree can use*.
What the tree can use is roughly twelve to finish and twenty-five to thirty
for a player who wants every good standing and refilling itself; never a
throughput number, because at full mine output the whole chain needs under
four machines' worth of rate. Nothing may cap that from outside the tree — a
per-instance price escalation, a bag that cannot hold a price, any rule whose
effect is "you may not build the next one" — see *the bag is the hand
ceiling*. If a count has to be capped, the tree caps it.

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
(real-time simulation). Save ids stay additive: iron/copper/quartz/bronze/parts/
modules keep mapping to iron/copper/stone/…; a v2 profile migrates into the v3
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
`js/chain.js` chain/economy data (the chain only) · `js/maps/kit.js`
the map kit + world registry, `js/maps/frontier.js` + `js/maps/range.js`
the two worlds · `js/factory.js` Pixi world
(`loadMap` per world) · `js/pixels.js` sprite kit + the one palette, incl. the
steampunk machinery parts kit `M` and the three machine animation states ·
`js/tiles.js` terrain kit (fills, autotile spills, walls, faces, crossings,
region scenery, `bake`, `minimap`) · `js/app.js` orchestration + the map
picker · `js/audio.js` synth ·
`js/i18n.js` EN/РУ · `serve.ps1` dev server (+ POST /upload for QA frames) ·
`js/sim.js` the factory simulation (buffers, jobs, belts, the clock) ·
`js/drops.js` loose materials on the ground + `DROPS.demolish`, the one door
everything destroyed goes through ·
`dev/map.html` + `dev/map-proof.js` world proof sheet · `dev/tiles.html`
terrain proof sheet · `dev/machines.html` machinery proof
sheet (rigs, works, belts, pipes, props, icons on real terrain, and every
machine in its three animation states) · `dev/mats.html` + `dev/mats-zoom.html`
material proof sheets (every material in the bag and on the band) ·
`dev/verify.html` data checks ·
`dev/map-thumbs.html` bakes the picker's thumbnails to `assets/maps/` — the
only thing that writes them, run on every map edit ·
`dev/sim.html` simulation harness · `dev/play.html` the game headless (rAF
shim) · `libs/pixi.min.js` vendored Pixi 8 ·
`docs/tech-tree-v3.html` the agreed tech-tree page (keyboard-by-ore, tier
board, material ladder, simulation, transport) · `docs/build-plan.md` the
phased build order for v3.
`assets/maps/<id>.png` the picker's baked thumbnails — tracked, shipped, and
written only by `dev/map-thumbs.html`. `assets/inbox/` (upload target) and
`assets/ref/` (style references, study only) are gitignored.

The `-ru` suffix is the convention, not an afterthought (invariant 5): a new
course is a new `language-<code>.js` + `layout-<code>.js` pair and nothing
else. Note that `i18n.js` is a separate axis — it translates the *interface*,
and the interface language is independent of the course being typed (you can
read English UI while drilling Cyrillic, or the reverse).
