# Build plan — Tech Tree v3 (the core gameplay foundation)

Companion to DESIGN.md → "THE TECH TREE (v3, agreed 2026-08-18)" and to
`docs/tech-tree-v3.html`. This is the order in which the v3 tree gets built,
what each phase must contain, and how each phase proves itself. It is the
foundation of the game: it gets executed fully and well before anything on
the gravy list.

## 0. Ground rules for the build

1. **Playable after every phase.** Each phase ends with a game a fresh save can
   play from the first key to the end of what that phase covers, and a v2 save
   can migrate into. No phase leaves the game in a half-state.
2. **Data first, engine second.** Ores, pairs, kinds, recipes, prices, bars,
   rates live in data (`chain.js`, `language-ru.js`, `layout-ru.js`). The
   engine knows kinds and grammars, never letters (invariant 5). Every
   placeholder number lives in one `TUNING` object.
3. **Nothing beyond DESIGN v3.** If a phase wants a mechanic the design does
   not name, it goes on the gravy list, not into the phase.
4. **Every phase has three proofs:** data checks (a dev page that loads the
   data files and asserts the rules), a simulation check where the phase
   touches the factory, and a playtest script a person can follow in minutes.
5. **Ids are additive.** Legacy material ids (iron/copper/quartz/bronze/parts/modules)
   keep mapping to iron/copper/stone/…; new ids are added, never renamed.
6. **One interact key.** Everything the player does at a place is hold-Space
   (menus: arrows choose, hold-Space confirms). No new keys, no mouse.

## 1. The data model (the shape every phase builds on)

### Course data — `language-ru.js` (per-course, additive)

- `PAIRS`: ordered key introductions, each `{keys:[…], ore, mk, tier}` for
  mine events, and `{keys:[','], at:'fastener', mk:1, tier:3}`-style entries
  for machine key events (comma, `? ! -`, Shift, `: ; " ( )`). Replaces
  `UNLOCK_ORDER` as the curriculum spine (keep `UNLOCK_ORDER` derived from it
  for migration).
- `ORE_OF[letter]`, `VOWELS` (exists), `PUNCT` (grows).
- `SYLLABLES`: `[{s:'на', f:…}, …]` ~150 real high-frequency syllables with
  frequencies. `CLUSTERS`: ~40 consonant clusters. `WORDS`: grown to ~1,500
  entries `[word, gloss, set, rank]`. `ENDINGS`: families tagged by ore
  (`{ore:'st', items:['-ть','-ить','-ом',…]}`). `PHRASES`: ~200 collocations.
  `SENTENCES`: ~300, graded `{text, len, punct}`. `NAMES`: ~50 proper names.
  `PAGES`: paragraphs graded by length and punctuation density (content slot).
- The generator consumes these through the grammar interface only.

### Layout data — `layout-ru.js`

- `SHIFTED_CODE_TO_CHAR` grows: capitals for every letter key, number-row
  punctuation (`! " ; : ? ( )`), `Minus` for `-`. `NEEDS_SHIFT` grows to
  match. `FINGER` already covers the number row.

### World / economy data — `chain.js`

- `ORES`: `{id, finger, color}` ×6 (ids: fe, cu, st, qz, co, oi; legacy
  aliases iron→fe, copper→cu, quartz→qz kept in a map).
- `KINDS`: `{id, arity, grammar, minAlphabet, jobSeconds, outlets, autoFromTier,
  adds:[keys]|null}` ×9 (mine, smelter, foundry, constructor, molder,
  assembler, fastener, crane, manufacturer).
- `RECIPES`: authored list `{kind, in:{mat:n,…}, out, tier}`; alloys are ids
  like `fe+cu`; three-ore alloys `fe+cu+qz`; deeper forms `parts, moldings,
  modules, fastened, crates, heavy`. Display names in i18n; icons are ore-color
  stacks in `pixels.js`.
- `PRICES`: `mk[ore][level]`, `node[ore]`, `machine[kind][instanceIndex]`,
  `auto[kind]` — all in the pattern "own material + a current-tier good".
- `BARS`: per tier `{wpmEq, acc}`; `TUNING`: rates, buffer cap, K, overpass
  tier, ratio tilt cap, ⚙ lag, hint dimming/free tiers.
- The worlds (`js/maps/*.js` since 2026-08-20): nodes per ore (several),
  plots, choke tiles, crossings. On The Frontier every crossing is `free`
  (user ruling 2026-08-20 — nothing there is gated); the repair price stands
  for a world that wants it.

### Profile v2 — `engine.js`

- Keep: per-letter stats, `automated` (sticky), `collected`, totals.
- New: `oreMk {fe:1,…}`; `tier` (derived: highest bar passed);
  `machines: [{id, kind, at:{plot|node}, auto, buffers:{in:{mat:n}, out:{mat:n}},
  job:{recipe, startedAt}|null}]`; `belts: [{id, from:{machine,outlet},
  to:{machine,inlet}, path:[[tx,ty],…], items:[{mat, pos}]}]`; `bag` (was
  `mats`); `heavy` count toward the finish; `lastTick` wall time for
  fast-forward; `version: 2`.
- Migration v1 → v2 (one-shot, on load): `unlockedCount` → `oreMk` (letters
  map to pairs; a half-unlocked pair rounds down and its second letter waits);
  built stations → machine instances on their plots; `autoBench` → `auto`;
  purchased belts → belts with routed paths; `mats` → `bag`; milestones,
  edition state, kits → dropped. Never lossy on letter stats.

## 2. Phases

### Phase 1 — Curriculum core

**Status (2026-08-19): built, with Phase 2, in one pass.** `PAIRS` /
`ORE_OF` / `SYLLABLES` (286) / `CLUSTERS` (50) / `ENDINGS` / `WORDS` (771)
in `language-ru.js`; unlock by pair with tier bars, `alphabetOf` from the
graph, grammars keys/letters/syllables/clusters/words and the capped ratio
tilt in `engine.js` + `chain.js`; `dev/verify.html` runs the data checks
(green; the vowel-poor 2-ore alloys are reported as never reaching a
Constructor pool, by design). Key events at machines that don't exist yet
(comma, `? ! -`, Shift, `: ; " ( )`) unlock as they are reached until
phases 4–5 give them their machines.

**Goal.** The letters arrive in pairs, by finger, per ore Mk; alphabets come
from the recipe graph; syllables and clusters are real drills. Still the
current world (three mines + smelter + constructor), still the current
build/kit flow — only the curriculum and the drills change.

**Scope.**
- Data: `PAIRS`, `ORE_OF`, `SYLLABLES`, `CLUSTERS`, `ENDINGS` (families for
  the six ores), `WORDS` growth to ≥600 with ranks (enough for T0–T2 pools).
- Engine: unlock by pair (all unlocked letters ≥ readiness → next pair
  offered); per-tier readiness target (`BARS`); `alphabetOf(material)` from
  the graph × `oreMk`; `recipeAlphabet`, `minAlphabet` checks; grammar modes
  `keys` (Mk1 two-key positions, hinted then blind), `letters`, `syllables`,
  `clusters`, `words` (strict union), plus ratio tilt (capped, off on small
  pools); focus weighting from inputs; hesitation hints unchanged.
- World: the three T0 mines re-keyed (fe а о, cu е н, st и т); the Smelter
  becomes 2-in over ore pairs (bronze, cast iron); the Constructor takes
  ingots; the current kit flow drives it for now.
- Art: none required (existing sprites).

**Acceptance.**
- A fresh save shows exactly а о lit at the iron mine, е н at copper, и т at
  stone; the Mk1 drill is two positions with hints, then blind streams.
- Bronze drills syllables over {а о е н} only; cast iron over {а о и т} only;
  every syllable shown is in `SYLLABLES`.
- Unlocking в л requires all six T0 letters past bar 0; then п р, then с б,
  in that order and no other.
- After Iron Mk2 (п р) the bronze smelter's syllable set includes па по пра
  про without any code change (graph ripple).
- Constructor(quartz iron) is refused until its pool has ≥25 real words;
  offered the moment it does.
- Ratio tilt: with 3 iron + 1 coal the sampled iron:coal letter ratio is
  ≈3:1 over 500 draws; with a pool < 25 the tilt is off (ratio ≈ frequency).
- Data checks (dev/verify.html): every pair covers two keys of one finger;
  the 16 mine events cover all 33 letters + `.`; every 2-ore alloy has ≥1
  vowel + 1 consonant; every Constructor recipe reaches ≥25 words at its
  intro tier; no recipe's minimum alphabet is unmet at its tier.
- Invariant 5: `engine.js` contains no Cyrillic literal.

### Phase 2 — Build from the bag

**Status (2026-08-19): built.** Place menus at plots / nodes / mines (arrows,
hold-Space confirm, tap/Escape close); prices in `chain.js` (`PRICES`,
`priceMachine` scaling per instance, `priceExtraMine`, `priceMk`,
`priceAuto`); machines are instances (`profile.machines`), several per
kind; ⚙ on mines with the one rule (letters sticky → refuses labor →
collect 100); Hub / kits / contracts / Depot / ₽ / editions removed;
crossings open on tier bars; profile v2 + v1 migration + save-file version 2
(v1 files import); the stone node added to The Frontier's meadow; the
Ctrl+Alt+M / Ctrl+Shift+Q debug bag (500 of every material in the tree,
behind the developer-mode tickbox in Settings, off by default); the 9999
per-material bag cap. Not yet: automation on processors (phase 3, needs
buffers), belts (phase 3 — the old BELTS list and autofeed are gone).
**Corrections after the first play (2026-08-19):** no tier-number locks
anywhere — recipes are offered when their inputs exist and their alphabet
clears the minimum, machines when their price materials have been held,
closed crossings are repaired at the place for a price (`PRICES.crossing`);
the space key types at once on press when a space is next and charges the
menu when held (a held space that isn't next is never an error); a
processor's recipe is chosen at its own menu and remembered per machine
(no auto-switching; ✗ when unpayable). **And the larger correction:** no
skill gates at all — the readiness check on unlocking a pair and the
"mastered letters" check on automation (inherited from the pre-v3 design)
are gone; progress is what you type and spend. Pairs, mines, machines,
repairs and automation are prices only; a Mk on an ore retools its mines
(automation off until bought again); tier bars are shown targets, never
locks; every price is the base table × `TUNING.PACE` (4 as the first-pass
guess — the one pacing knob, since prices now carry all the pacing).

**Goal.** Kits, the Hub, contracts and the Depot go. Every purchase is a
priced row at the place: Mk at a mine, a mine at a node, a machine at a plot,
⚙ at a machine. Place menus with arrows.

**Scope.**
- UI: hold-Space at a plot/node/machine opens an in-canvas pixel icon menu;
  arrows move the highlight; hold-Space confirms; Escape/walk-away closes.
  Rows show price icons (dimmed when unaffordable), the readiness gauge for a
  gated Mk, and ✗ when the tier gate is closed. A machine's build row appears
  in a plot's menu once the player has *held* every material it costs.
- Economy: `PRICES` in data; `spend()` from the bag; ⚙ per machine instance
  (rule: purchasable when its recipes' letters are sticky and, for
  processors, from the tier after arrival).
- Curriculum gates: Mk rows show and enforce readiness ∧ tier bar.
- Removals: milestone board/Hub, contracts, kits, Depot, ₽, edition cards;
  crossings open on tier bars.
- Save: profile v2 + migration (machines/plots/auto/bag), export/import
  wrapper `version:2`.
- Art: menu plate + highlight; small ⚙ / Mk / build glyphs; a signpost sprite
  where the Hub stood is optional decoration.

**Acceptance.**
- A fresh save can reach the T1 quartz node, buy it, buy Iron Mk2, buy Quartz
  Mk2, build a Constructor and a Foundry — all through place menus and prices,
  with no Hub and no kit anywhere.
- A Mk row shows its gauge and refuses until readiness passes; the price row
  refuses until affordable; both states are visible before trying.
- A v2-era save (any of the current worlds) migrates: same letters ready, same
  machines standing on the same plots, same bag, no milestone state.
- Playtest script T0→T1 completes in ~2 h of typing for a competent typist
  and never once needs a walk to a board.

### Phase 3 — The simulation

**Status (2026-08-19): built.** `js/sim.js` (buffers, automated mines and
jobs, belts with items, catch-up), `FACTORY.routeBelt` (BFS over free
tiles), spool & socket with the green/red route preview, menus for feed /
collect / spool / socket / put back / remove belt, processor automation
for a price (no mastery), state dots, pipes for oil, the live 120 ms tick
and catch-up on load / tab return, `dev/sim.html` (13 checks green) and
`dev/play.html` (the game headless). Not yet: a contextual HUD (the bag
HUD still lists everything held), belt sounds, an overpass (tier 4, phase
5), relocation (no relocation exists yet).

**Goal.** Machines have insides; automation runs on the real clock; belts move
things across the map. This is the phase that makes automation mean something.

**Scope.**
- Machines: input/output buffers with cap; hand work consumes buffers first,
  then bag; output → bag unless an exit belt exists; automated jobs (⚙ ∧
  sticky ∧ full set) with `jobSeconds`; automated recipes refuse labor,
  un-automated ones accept it; collect / feed rows in the machine menu.
- Belts: `belts` graph; tile router (shortest free path over walkable tiles,
  one belt per tile, choke tiles honored, red ghost when no path); spool &
  socket state on the operator (sprite: coil on the back); inlets = arity,
  outlets 1 (mines) / 2 (processors), round-robin; outlet filter (only what
  the consumer accepts); items advance at belt speed; belts removed/refunded
  on machine relocation; belts free.
- Clock: real-time scheduler for jobs and belt items; `lastTick` fast-forward
  on load/visibility (bounded by buffers); nothing about letters or bars
  touches the clock.
- HUD: contextual in-canvas rows (what the dock needs); full bag in the side
  panel; machine icon shows buffer state (hungry / full / running).
- Sound: belt clatter and job ka-chunk on the existing ladder.
- Art: belt/pipe links already roll; item sprites on belts (small material
  dots); spool on the operator; buffer state glyphs.

**Acceptance.**
- Hand-typed bronze rolls onto an exit belt when one exists and lands in the
  bag when none does; the Constructor at the other end fills its input buffer
  and can be worked from it without touching the bag.
- With ⚙ on the iron mine and a belt to the Smelter, and ⚙ on the Smelter,
  bronze accumulates in the Smelter's output buffer while the player types at
  another station — and also while they walk, and while the tab is hidden
  (verified by fast-forward on return, capped at the buffer).
- A mine feeding two consumers is visibly hungry on both; building a second
  mine fixes it (one mine ≈ one consumer at `TUNING` rates).
- Buying Iron Mk2 while iron is automated: the iron mines revert to hand-work,
  their belts idle, downstream automation keeps its ⚙ and starves; typing п р
  to sticky brings them back with no purchase.
- Router: a two-tile bridge accepts two belts; the third gets a red ghost;
  removing one belt frees the tile.
- Sim harness (dev/sim.html): a scripted T1 factory runs 30 simulated minutes
  headless with no clog, no buffer overflow, and throughput within ±20% of the
  hand-computed rates.
- Save round-trip: buffers, jobs, belt paths and items survive export/import.

### Phase 4 — Tiers 2 and 3

**Status (2026-08-20): built.** The Molder, Assembler and Fastener are
live (`KINDS.ready`), each with its grammar in the engine: `endings`
(affix families by flux ore — real words carrying the affix, pseudo-stems
when thin), `phrases` (`LANG_RU.PHRASES`, 202, no marks) and `punct`
(`LANG_RU.SENTENCES`, 278, with the marks they carry — a sentence fits
when its letters *and* marks are unlocked); full-set kinds take the whole
unlocked alphabet and the flux sets the focus (`CHAIN.recipeFocus`: the
flux's letters tilt sampling, an ore flux names the ending family). The
Fastener's keys are bought at the Fastener (`PAIRS` events with `at`;
`PRICES.at`, `priceAt`, `kindMk`; the menu row "MK1 ," with its caption;
the unlock card says ⇧ Shift + right pinky); comma is typed as Shift+/
and the hint lights Shift. Words 771 → 1040; syllables for ы д к г м ь я
у ш й з; ending families widened; Molder and Fastener sprites in the
steampunk kit. Maps: the Frontier gets iron #2 (meadow), copper #2
(quarry), quartz #2 (canyon), coal #2 (bog), oil #2 (flats), iron #3
(peaks) on the outer regions' first plots, plus eleven new plots out there
(p19–p29), every one checked clear and reachable; Open Range row A carries
the whole pyramid. `dev/verify.html` grew seven checks (pools per ladder
stage, stray characters, placement/reachability) — 20 green. Not yet: the
T2 acceptance "brass only after both T0 ores are at Mk2" is a consequence
of the union rule and holds; hint dimming is phase 5; art for the
Assembler stays the shared hall sprite.

**Goal.** Coal and oil; the Foundry, Molder, Assembler and Fastener Mk1;
pipes; endings, phrases and punctuated sentences; comma as Shift's first
appearance.

**Scope.**
- Data: `PAIRS` T2–T3 events; `ENDINGS` complete; `PHRASES`; `SENTENCES`
  graded for 20+ letters with `. ,`; `SYLLABLES`/`CLUSTERS` for the new
  alloys; `WORDS` to ~1,000.
- Engine: grammar modes `endings` (frames), `phrases`, `punct` (Fastener adds
  keys to the alphabet); Shift handling for `,`; full-set-plus-focus rule for
  Molder and up; family selection by flux ore.
- World: coal and oil nodes (several), plots for T2–T3, pipes skin, Foundry /
  Molder / Assembler / Fastener sprites and recipes, brass/steel/black iron
  and their three-ore alloys, prices, bars 2–3.
- Map: The Frontier re-based per DESIGN "Map consequences" (stone node in
  the meadow; quarry hills open at T1; canyon + bog by T2; flats at T3;
  crossings on bars); Open Range row A gains the node set.

**Acceptance.**
- T2 playtest: coal node → Copper Mk2 → Stone Mk2 → Molder → Assembler; brass
  offered only after both T0 ores are at Mk2; steel drills iron 3× coal.
- Molder with stone flux drills -ть -ить -ом; with copper flux -ение -ник —
  by carrying the ore in, or by which ore is belted.
- T3 playtest: oil node → Fastener → comma typed as Shift+/ with the keyboard
  showing Shift lit; Quartz Mk3 refreshes quartz iron (суп, шум) at the T1
  stations; oil is piped, everything else belted.
- Data checks extended to T2–T3 recipes; sentence pool at 20 letters ≥ 100
  sentences.

### Phase 5 — Tiers 4, 5 and 6

**Status (2026-08-20): built.** The Crane and Manufacturer are live with
their grammars: `capitals` (sentences with sentence-initial capitals,
`LANG_RU.NAMES` sprinkled in; a capital's stats fold onto its lowercase
letter — same finger, Shift is the addition) and `pages`
(`LANG_RU.PAGES`, real paragraphs the engine grades by length and mark
density, easiest served first; 14 placeholders — the content slot the
user fills later). Fastener Mk2 (`? ! -`) and Mk3 (`: ; " ( )`) ride the
existing mk-at mechanism; layout-ru maps the number-row marks (Shift+1 2
4 6 7 9 0, hyphen plain) and uppercase for every letter, and formerly
inert keys wake when the course puts a glyph on them (the digit caps show
their mark). Hint taper: from T4 the rescue waits twice as long and glows
half as bright (`.hint.dim`); from T5 it never comes. The finish:
`TUNING.K_HEAVY` heavy modules typed by hand at the Manufacturer (a count,
never a lock — `profile.heavy`, the 🏁 card, free play continues). Crane
and Manufacturer sprites in the animated steampunk kit. Verified headless:
the whole ladder climbed through all 19 events, capitals and pages lines
generated, the card fired at heavy #150. Not yet: NAMES beyond ~36, more
pages, the human playtest log.

**Goal.** The rare tail, punctuation Mk2/Mk3, capitals, pages, the finish.

**Scope.**
- Data: `PAIRS` T4–T5; `NAMES`; `PAGES` (an initial set — the content slot
  the user fills later); `SENTENCES` with `? ! - : ; " ( )`; `WORDS` to
  ~1,500.
- Engine: `capitals` (Shift on letters; sentence-initial and names), `pages`;
  Fastener Mk2/Mk3 key additions; hint dimming from T4, hint-free from T5;
  the finish condition (bar 35 on every letter + K heavy modules).
- World: Crane and Manufacturer kinds; gunmetal, glass, quartz steel, coke
  iron; overpass at tier 4; the finish site (Titanium peaks) and its
  crossing; prices, bars 4–6.
- Post-finish: free-play flag (bars raised, night shift hint-free) — minimal.

**Acceptance.**
- T4 playtest: three retools (coal ×2, oil), Fastener Mk2 (`? ! -` on the
  number row with Shift), quartz steel words (дача, чудо, луч).
- T5: Oil Mk4 (outer pinky) → Crane: capitals typed with either Shift; names
  from `NAMES`; Fastener Mk3.
- T6: Manufacturer pages from `PAGES`; heavy count rises only from hand work
  there; the finish triggers at bar 35 + K, and free-play follows.
- A full fresh-save run T0→finish is completed by a tester and logged
  (hours per tier vs. the estimate).

### Phase 6 — Content, art, sound, tuning

**Status (2026-08-20): first pass done; open until the human log.**
- **The log, simulated:** `dev/playtest.html` — a modelled learner (WPM
  12 → 40, accuracy 94 → 98%, one machine worked at a time, automation
  bought as an investment once a material has cost 250 hand keystrokes,
  automated machines running in parallel with a surplus rule standing in
  for belts) plays a fresh save to the finish and prints hours per event
  and per tier. The endgame is computed, not simulated (fully automated
  chain, crane-limited), because the shared-bag stand-in misprices it.
- **Tuning from that log:** at PACE 4 the run read 62 h against the ~30 h
  target, with 17.7 h on Oil Mk4 alone (its price asked for 240 fastened
  modules at ~25 keystrokes a unit). Changes: PACE 4 → 3; the tail
  prices trimmed (Coal Mk2 fast 60→40 · Coal Mk3 qzsteel 40→25 · Oil Mk3
  gunmetal 40→30 · Oil Mk4 fast 60→30, oil 60→80 · Fastener Mk1/2/3 fast
  40/60/60→30/40/40); K_HEAVY 200 → 150; the Crane's automation price no
  longer asks for heavy modules (the finish counter) — crate + mold now.
  The bot then reads **29.5 h**. Placeholders until the human log.
- **The EN course (2026-08-20, no longer a stub):** `js/language-en.js` is
  a playable course — the RU ladder key-for-key (order pinned for later),
  758 words, 56 phrases, 71 sentences, 12 pages, names. `dev/en.html`
  checks it (14 green), including the **traversability walk**: every
  price producible when its rung appears. That walk found and fixed two
  systemic deadlocks — the coal node priced in parts before EN can field
  25 words, and castiron/qziron/steel/blackiron prices before EN iron
  (f j g h, vowelless) can smelt them — so the shared price tables now
  use only both-courses-producible goods, and verify.html runs the same
  walk for RU. After the reprice the bot reads **20.5 h** (the fastener's
  automation price also dropped crates — they hid the Crane pyramid).
- **PAGES organised:** placeholders in `language-ru.js` with the writing
  rules in a comment (the course's keys only — no numbers, no em-dash, no
  guillemets); the engine grades and orders them itself.
- **The EN ladder reseated (2026-08-25):** the key-for-key order retired
  for a frequency-built EN ladder in the same 18 slots (T0 = f j · r u ·
  b n; e i at pair 4; copper takes the index top row so brass/gunmetal
  keep a vowel in the smelter book — prices untouched). Bank grown to
  ~1590 words / 110 phrases / 120 sentences / 22 pages, machine-staged;
  contractions from Oil Mk1 (apostrophe); 'I' waits for the Crane;
  `MINE_MARKS` moved trainable-mark declaration into the course files.
  `dev/en.html` re-checked green after the change.
- Still open: the tuning playtest by a human; belt-clatter sound; art
  variants per mine ore/Mk; passport coverage of the grown word list.

**Goal.** Make it good, not just complete.

**Scope.**
- Tuning pass from Phase 5's log: prices, bars, K, rates, buffer cap, minimum
  alphabets — all in `TUNING`/`PRICES`/`BARS`; playtests until hours per tier
  are within ~±25% of the estimate and no tier feels empty or endless.
- Art pass: every kind's sprite in the **steampunk / FF6 machinery idiom**
  (see DESIGN.md → ENVIRONMENT PLAN → *Machinery style*), built from the
  shared parts kit `M` in pixels.js — mines per ore and Mk look, Foundry,
  Molder, Fastener, Crane, Manufacturer; alloy icons as ore-colour stacks,
  belt items, pipes, spool, menus; the Hub/Depot art retired. Every machine
  sprite ships all **three animation states** — still / idle / work (DESIGN.md
  → *Machine animation*); it is not finished without them. Check each new
  sprite on `dev/machines.html` before it lands.
- Sound: menu tick, spool/socket, belt clatter, retool cue on the ladder.
- Content: the `PAGES` file organised for the user to write into (graded slots
  by length/punctuation); the passport/glosses cover the grown word list.
- Invariant-5 dry run: a stub `language-en.js` with an EN pair map loads and
  produces a T0 world without engine edits (no EN course yet — just proof).

**Acceptance.** Playtest log within tolerance; no console errors across a
full run; data checks green; the EN stub loads.

## 3. Verification harness (built alongside, not after)

- **`dev/verify.html`** — loads the data files and prints pass/fail for: pairs
  cover the alphabet exactly once; each pair = one finger; ore Mk levels are
  contiguous; every alloy ≥1 vowel + 1 consonant; every recipe's minimum
  alphabet is met at its tier; every Constructor recipe has ≥25 words at its
  intro tier (measured against `WORDS`); every ending family has ≥6 items;
  the sentence pool at 20 letters ≥ 100; prices reference existing materials
  the player can hold by that tier; `KINDS` arity matches recipe inputs;
  outlets/inlets are consistent; no Cyrillic literal in `engine.js`.
- **Deep ores landed 2026-08-22** (same day as the branch; DESIGN.md "Deep
  ores" is the record): 9 deep ore materials + 6 signature alloys + sealed/
  bound goods; constant per-course recipe books replace every runtime
  content floor; ⚙ per recipe with a hand-made run-in; family-aware bag,
  belts and prices. The pacing bot reads 31.1 h at PACE 3. Content grew
  with it (clusters 108, RU +105 words, +40 dash sentences, EN 841 words).
- **`dev/ladder-walk.js`** (2026-08-22, the branch) — walks every Mk table
  a course can reach from the pre-built mines (RU 98 states, EN 59) and
  returns what holds at each: deadlocks, kinds for sale with nothing to
  make and no nameable fix, purchases that break the finger order, rungs
  for sale two eras ahead of the lowest unbought one, the widest moment.
  `dev/verify.html` and `dev/en.html` both run it; the one-line "ladder is
  traversable" check it replaced could not see a machine-price cycle (the
  Foundry costing parts deadlocked EN at oil and the check passed).
- **`dev/sim.html`** — headless factory simulation at accelerated time:
  scripted T1 and T3 factories; asserts no clog, caps respected, throughput
  bands, retool starvation and recovery, fast-forward correctness.
- **Playtest scripts** — one per tier in this file's acceptance lists; a run
  is logged with hours per tier.
- **Regression** — settings, map picker, export/import, both worlds, the
  keyboard visualizer, sound ladder still work after each phase.

## 4. Tunables (single source: `chain.js` TUNING / PRICES / BARS)

| Knob | Placeholder | Notes |
|---|---|---|
| Bars (WPM-eq · acc) | 12·95, 15·96, 18·96, 21·97, 24·97, 28·97, 35·97 | per-tier readiness target on every unlocked letter |
| K (heavy modules) | 200 | ~6–8 h at ~30 WPM |
| Job seconds | mine 2 · smelter 3 · foundry 4 · constructor 4 · molder 5 · assembler 6 · fastener 6 · crane 7 · manufacturer 10 | −20% at bars 2 and 4 |
| Belt speed | 2 tiles/s, 1 item/tile | pipes same |
| Buffer cap | 100 per material | in and out |
| Bag cap | 300 per material (2026-08-22) | the hand ceiling; overflow bag → bin → ground; no price ask may exceed 80% of it (verify 17e) |
| Outlets / inlets | mines 1, processors 2 / arity | each at a port: one tile against the body, met head-on |
| Machine size | mine 2×1 · smelter…fastener 2×2 · crane + manufacturer 3×2 | `KINDS[kind].size`; a side of a one-deep body is one tile, so only a one-outlet kind can be one deep |
| Build plot | one size, 3×2 — it takes the largest kind, smaller ones leave slack | wants 5 tiles across × 4 deep for all three turns; dev/verify.html asserts it per plot per map |
| Port places | one per column in front, one per row down each side | the back is hidden by the machine's own tower |
| Turning | free, 3 steps — discharge side front → right → left | re-lays that machine's runs; a stranded run comes up |
| ⚙ lag | one tier after a kind arrives | mines: when keys are sticky |
| Ratio tilt cap | 3:1, off when pool < 25 | variance only |
| Overpass | tier 4 | |
| Hints | dimmed from T4, off from T5 | |
| Prices | pattern: own material + a current-tier good | see the tier table in DESIGN.md; since 2026-08-22 prices are also the only order between places — a rung's price names the good of the rung it must follow (coal ← quartz, oil ← modules, the last two rungs ← crates), and a machine's price names the ore its recipes live on |
| Assembler floor | 18 keys | the whole first three eras, so modules (the derrick's price) leave no early rung behind |
| `whatUnlocks` depth | 4 purchases | past it a build row says "after deeper mines" |
| Kind in view | half its price goods held | same rule for the summary's "keys for sale" list |

## 5. Map work (with the environment owner)

**Definition of done for any map change (ruling 2026-08-21):** re-bake the
picker thumbnail. Open `dev/map-thumbs.html?save=1` against the local server
and commit the `assets/maps/<id>.png` it writes alongside the map edit. The
game never draws these — it did once, and it cost 18.8 s of frozen main
thread on every cold start. See DESIGN.md, "Map thumbnails — baked to file".

Nodes per ore ≈ iron 3, copper 2, stone 2, quartz 2, coal 2, oil 2; plots as
many as the tree can use. **Done 2026-08-20**: the worlds moved out of
`chain.js` into `js/maps/` (kit + registry + one file per world), and The
Frontier was rebuilt as an open basin — a 60×20-tile grass middle with
thirty plots and the first vein of every ore, all six biomes wrapped around
its rim as noise-shaped fronts rather than rects, and every terrain and
obstacle demonstrated out at the edges. Elevation is three big stepped
landmarks (the elev-2 Great Mesa, two elev-1 shelves) plus the island in the
bog, each with wide flights and side cuts on every approachable side.
Nothing is gated (user ruling): every crossing carries `free`. Open Range's
vein row carries the same node set.

**Done 2026-08-21 — the map rework (user rulings 2026-08-20 / 08-21):** both
worlds re-laid to the four-facing guarantee, which is a `dev/verify.html`
failure now rather than a warning (it was 52 spots short at the ruling, and
it now also asks that a run be able to *step* between a port and its way
out, so a port hanging over a cliff no longer counts). Pads sit 80px apart
in both axes — three tiles of pad, two of air. **The Frontier**: the ring's
lone pads gathered into six works, one to a biome, none smaller than three
(52 plots); the two elev-1 shelves gave up their pads and keep their seams;
the bog's lake and everything on it moved five tiles east to open a west
bank for its works. **The Open Range**: ranks from a 64px pitch to 80px and
the meadow three rows taller (39 plots), the ranks half a step off the seam
columns. **Mines are 2×1 or 1×2**: a node carries `vert`, `MAPKIT.veinBox`
is the one place a node becomes tiles, and eight Frontier seams and six Open
Range seams are bedded on end. Neither world needed to grow wider in the
end — there was room once the pads stopped being scattered.

## 6. Gravy (after the foundation, in no order)

Guidance checklist ("what to build next" — UI, not a mechanic) · the
×1.5-while-typing feel layer · ₽ and décor · contracts / bundles for variety ·
live exams · night-shift lamp · relocation fee · story/trivia/plot pages ·
the EN QWERTY course proper (committed scope; its own pair map on the same six
ores) · numbers as a bonus tier.

## 7. Order and definition of done

Phase 1 → 2 → 3 → 4 → 5 → 6, each playable and proven before the next.
Phases 1 and 2 may overlap in data authoring; Phase 3 depends on 2 (menus
host collect/feed/spool); 4 and 5 depend on 3 (they add kinds to a working
simulation). **Done** = a fresh save plays T0 → finish with every rule in
DESIGN v3 holding, the harness green, a logged run within tolerance, and
DESIGN.md's "What v3 removes" list actually removed.
