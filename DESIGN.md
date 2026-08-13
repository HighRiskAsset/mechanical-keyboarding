# Mechanical Keyboarding — Design Document (the one source of truth)

A typing trainer for Russian ЙЦУКЕН, worn as an outdoor machine-frontier
factory game in bright anime-flavored pixel art: **Satisfactory's production
chain with constrained building — the player spends their time running
machines, not planning layouts.** You land on a resource frontier dotted with
dormant machines. Typing is the literal power source.

(Re-themed 2026-08-11 on user direction from «Печатня», an 1890s print works.
Named **Mechanical Keyboarding** 2026-08-13, replacing the «Завод» placeholder.)

## The four invariants (survived every pivot; never trade away)

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
- **Settings menu** (⚙ header button → overlay card): interface language
  EN/РУ; keyboard layout switch (ЙЦУКЕН active, QWERTY a disabled
  placeholder); save file export/import (JSON wrapper `{app, version:1,
  profile, sound, uilang}`; import confirms, then reloads); reset all
  progress (confirm-gated, cancel returns to settings); tip jar with two
  rails like Sketchmill's free tier (PayPal international + YooMoney RU),
  each rail crowned by glowing gold coin badges straddling the button's top
  edge ($ £ € fan / single ₽) so the relevant rail reads before any text.
  Language toggle and reset live only here — off the main screen. The header
  keeps sound + stats; the footer keeps passport + summary.
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

- Tilemap world: grass base with wildflowers, dirt work-aprons under
  machines, an unwalkable pond, ore nodes beneath the mines, a treeline
  border, solid trees/rocks shaping routes. All data in chain.js `MAP`
  (DIRT/WATER/NODES rects) + `SCENERY` — a new map is a new set of rects.
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

### The tiers

| Tier / era | Mine (letters mode) | Processor (skill mode) | Издание bar (tunable) |
|---|---|---|---|
| **0 · hand** (pre-built) | Iron Mine — о е а и н т (1–6) | Smelter — bigrams (2 iron → ingots) | 12 WPM · 95% · 3 clean lines |
| **1 · powered** | Copper Mine — с л в р (7–10) | Constructor — words (ingots + copper → parts) | 15 WPM · 96% |
| **2 · stone** | Stone Quarry — к м д п (11–14) | Assembler — sentences (parts + stone → modules) | 18 WPM · 96% |
| **3 · crystal** | Quartz Mine — ы у б я ь (15–19) | Molder — suffix chunks -ться -ого (quartz + stone → moldings) | 21 WPM · 97% |
| **4 · coal** | Coal Pit — г з ч й (20–23) | Fastener Plant — punctuated lines «.» «,» (24–25; copper + ingots → screws) | 24 WPM · 97%, dimmed hints |
| **5 · oil** | Oil Derrick — ж х ш ю ё (26–30) | Circuit Fab — rare-letter words (oil + copper → circuits) | 28 WPM · 97%, hint-free (night runs return here) |
| **6 · titanium** | Titanium Mine — ц э щ ф ъ (31–35) | Manufacturer — real-text pages (modules + screws + moldings + circuits → heavy modules) | 35 WPM · 97% · one flawless page → launch |

Letter positions are UNLOCK_ORDER indices; a mine's kit gates on its first
letter being unlocked (curriculum) AND the previous tier's Издание (economy).
Both gates must pass — skill first, always.

- Comma = Shift+Slash is the layout's signature hurdle → its own machine.
- Suffix chunks adapt to unlocked letters (engine picks available frames).
- Tier 5+ benchmarks are hint-free: the night-run mechanic returns as exam
  conditions rather than an opt-in block.
- After launch: endless free-play, and REPLAY = a new layout (phonetic
  ЯВЕРТЫ / EN QWERTY — engine is layout-pluggable) or a speed run with
  raised bars (50+ WPM). A playthrough is weeks, not an evening.

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
- Additional layouts (phonetic ЯВЕРТЫ, EN QWERTY) — engine is layout-pluggable.

## Pedagogy references (kept from research)

Accuracy before speed (95–97% gates); frequency-ordered introduction
(о е а и н т ≈ 47% of text); blind typing with recall-first hints; no free
backspace; 15–30 min/day beats marathons (soft-stop card); real-text transfer;
comma = Shift+Slash is the layout's signature hurdle; ~40h ≈ 40 WPM
expectation; Fitts & Posner automaticity = the automation metaphor.

## Files

`js/engine.js` learning engine · `js/language-ru.js` RU data ·
`js/layout-ru.js` ЙЦУКЕН · `js/chain.js` world/economy data ·
`js/factory.js` Pixi world · `js/pixels.js` sprite kit · `js/app.js`
orchestration · `js/audio.js` synth · `js/i18n.js` EN/РУ · `serve.ps1` dev
server (+ POST /upload for QA frames) · `libs/pixi.min.js` vendored Pixi 8.
