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
5. **Ids are additive.** Legacy material ids (az/buki/vedi/slogi/slova/stroki)
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
  aliases az→fe, buki→cu, vedi→qz kept in a map).
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
- `MAPS[*]`: nodes per ore (several), plots, choke tiles, and crossings that
  `opensAfter` a tier bar (was: an edition id).

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

**Goal.** Make it good, not just complete.

**Scope.**
- Tuning pass from Phase 5's log: prices, bars, K, rates, buffer cap, minimum
  alphabets — all in `TUNING`/`PRICES`/`BARS`; playtests until hours per tier
  are within ~±25% of the estimate and no tier feels empty or endless.
- Art pass: every kind's sprite in the FF3 idiom (mines per ore and Mk look,
  Foundry, Molder, Fastener, Crane, Manufacturer), alloy icons as ore-color
  stacks, belt items, pipes, spool, menus; the Hub/Depot art retired.
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
| Outlets / inlets | mines 1, processors 2 / arity | |
| ⚙ lag | one tier after a kind arrives | mines: when keys are sticky |
| Ratio tilt cap | 3:1, off when pool < 25 | variance only |
| Overpass | tier 4 | |
| Hints | dimmed from T4, off from T5 | |
| Prices | pattern: own material + a current-tier good | see the tier table in DESIGN.md |

## 5. Map work (with the environment owner)

Nodes per ore ≈ iron 3, copper 2, stone 2, quartz 2, coal 2, oil 2; plots as
many as the tree can use; The Frontier re-based per DESIGN "Map consequences"
(stone node added to the meadow; quarry hills at T1; canyon + bog by T2;
flats at T3; peaks at T4 as the finish site); crossings `opensAfter` a tier
bar; choke tiles authored (bridges, gaps) — they are the congestion feature.
Open Range row A carries the same node set.

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
