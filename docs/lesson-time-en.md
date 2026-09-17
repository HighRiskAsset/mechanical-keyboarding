# Lesson time, EN (v4 tree)

Generated 2026-09-17 by `dev/lesson-time.js` from `js/tree-en.js`, `docs/tree-v4-en.json` and `js/chain.js`, with 2 bot runs from `dev/bot-sim.js` (bot-en-20h.json, bot-en-40h.json). Do not edit by hand; rerun the script.

Two models of a player who automates as soon as an engine can be paid for, both at a flat 30 words a minute (150 characters a minute, spaces counted, the same count the WPM readout uses):

- **Design model.** The purchase replay the tree builder prices with: every purchase in column order, its price expanded through every recipe not yet automated, an engine bought the moment its price exists (two columns after the lesson), and whatever an engine makes arriving free and at once. Costed **as priced** (the builder's own characters per item, which the prices were tuned to) and **as the game charges** (`js/chain.js` PER_UNIT, one ore a keystroke, over the purchases and prices the game actually carries). The **ramp** column is the game-charged cost typed at the game's own bars instead of a flat 30 (`chain.js` BARS: 12, 15, 18, 21, 24, 28, 35 WPM as the introductions open).
- **Bot model.** `dev/bot-sim.js` on the real rules (`CHAIN`, `SIM`, `js/bot.js`'s planner) to a clock budget, the keystrokes it spent at each lesson divided by 2.5 a second. The bot buys an engine as soon as its price costs fewer keystrokes than it would save, builds extra mines, carries up to 300 of a material, and plans only toward the completion.

A lesson's time is the time at the keys typing what it drills, wherever that typing was demanded from: its own purchases, a later price that reaches back to it, or a byproduct that falls out of it. Walking, menus and waiting are not in it.

## Totals

| model | keyboard complete (C24) | completion (C26) | everything |
|---|---|---|---|
| design, as priced (the builder's replay) | 18.2 h | 21.2 h | 22.7 h |
| design, as the game charges, flat 30 WPM | 13.0 h | 14.1 h | 14.2 h |
| design, as the game charges, on the bars (12 to 35 WPM) | 19.2 h | 20.2 h | 20.3 h |
| bot, 20 h on the clock (frontier) | typing 16.6 h of 20.0 h; 25 keys open; clock budget | | |
| bot, 40 h on the clock (frontier) | typing 32.9 h of 40.0 h; 30 keys open; clock budget | | |

Where the bot got to, by the hour its keys came open:

- 20 h: I-01 (`s` `l`) 0.0 h · I-02 (`a` `h`) 0.1 h · I-03 (`e` `i`) 0.2 h · I-04 (`t` `n`) 0.3 h · I-05 (`d` `o`) 1.7 h · I-06 (`r` `u`) 1.9 h · I-07 (`c` `m` `.`) 3.6 h · I-08 (Shift) 4.3 h · I-09 (`g` `y`) 7.4 h · I-10 (`,`) 7.7 h · I-11 (`f` `w`) 10.2 h · I-12 (`'` `-`) 10.8 h · I-13 (`b` `p`) 16.3 h · I-14 (`k`) 16.6 h
- 40 h: I-01 (`s` `l`) 0.0 h · I-02 (`a` `h`) 0.1 h · I-03 (`e` `i`) 0.2 h · I-04 (`t` `n`) 0.3 h · I-05 (`d` `o`) 1.7 h · I-06 (`r` `u`) 1.9 h · I-07 (`c` `m` `.`) 3.6 h · I-08 (Shift) 4.3 h · I-09 (`g` `y`) 7.4 h · I-10 (`,`) 7.7 h · I-11 (`f` `w`) 10.2 h · I-12 (`'` `-`) 10.8 h · I-13 (`b` `p`) 16.3 h · I-14 (`k`) 16.6 h · I-15 (`?` `!`) 22.6 h · I-16 (`v`) 23.3 h · I-17 (`"`) 38.4 h · I-18 (`j`) 38.5 h

## Hours by column

The hours the purchases of a column ask of the hands (design) and the hours the bot spent typing lessons that live in that column (bot).

| column | opens | as priced | game, flat | game, ramp | bot 20 h | bot 40 h |
|---|---|---|---|---|---|---|
| C1 | `s` `l` | 0.0 | 0.0 | 0.0 | 0.12 | 0.12 |
| C2 | `a` `h` | 0.3 | 0.0 | 0.1 | 0.39 | 0.39 |
| C3 | `e` `i` | 0.4 | 0.2 | 0.4 | 0.91 | 0.99 |
| C4 | `t` `n` | 0.8 | 0.5 | 0.9 | 2.56 | 4.83 |
| C5 | `d` `o` | 0.8 | 0.6 | 1.2 | 3.78 | 6.18 |
| C6 | `r` `u` | 1.0 | 0.8 | 1.5 | 3.19 | 6.70 |
| C7 | `c` `m` `.` | 1.2 | 0.8 | 1.7 | 1.81 | 2.87 |
| C8 | Shift | 0.7 | 0.5 | 0.9 | 0.56 | 0.89 |
| C9 | `g` `y` | 1.0 | 0.7 | 1.2 | 1.15 | 1.49 |
| C10 | `,` | 0.3 | 0.3 | 0.5 | 0.46 | 1.11 |
| C11 | `f` `w` | 1.0 | 0.8 | 1.3 | 0.86 | 2.07 |
| C12 | `'` `-` | 0.3 | 0.3 | 0.4 | 0.26 | 1.25 |
| C13 | `b` `p` | 1.2 | 0.9 | 1.3 | 0.44 | 2.13 |
| C14 | `k` | 0.3 | 0.3 | 0.4 | 0.07 | 0.89 |
| C15 | `?` `!` | 1.2 | 1.0 | 1.4 | 0.00 | 0.35 |
| C16 | `v` | 0.7 | 0.6 | 0.8 | 0.00 | 0.40 |
| C17 | `"` | 0.7 | 0.6 | 0.8 | 0.00 | 0.09 |
| C18 | `j` | 0.7 | 0.6 | 0.8 | 0.00 | 0.09 |
| C19 | `x` | 0.6 | 0.5 | 0.6 | 0.00 | 0.00 |
| C20 | `:` `;` `(` `)` | 0.7 | 0.6 | 0.6 | 0.00 | 0.00 |
| C21 | `q` | 1.0 | 0.7 | 0.8 | 0.00 | 0.00 |
| C22 | `z` | 0.7 | 0.2 | 0.3 | 0.00 | 0.00 |
| C23 | `1` `2` `3` `4` `5` | 1.5 | 0.8 | 0.9 | 0.00 | 0.00 |
| C24 | `6` `7` `8` `9` `0` | 1.3 | 0.6 | 0.6 | 0.00 | 0.00 |
| C25 | 3 pages | 1.1 | 0.3 | 0.2 | 0.00 | 0.00 |
| C26 | 3 pages | 1.9 | 0.8 | 0.7 | 0.00 | 0.00 |
| C27 | 3 pages | 0.6 | 0.0 | 0.0 | 0.00 | 0.00 |
| C28 | `%` `*` `+` `=` | 0.3 | 0.0 | 0.0 | 0.00 | 0.00 |
| C29 | `/` `\` `[` `]` `{` `}` `<` `>` | 0.2 | 0.0 | 0.0 | 0.00 | 0.00 |
| C30 | `@` `#` `$` `&` `^` `~` `\|` `_` `` ` `` | 0.1 | 0.1 | 0.1 | 0.00 | 0.00 |
| C31 | 1 pages | 0.3 | 0.1 | 0.1 | 0.00 | 0.00 |

## The lesson behind every material

Tree order, first material first (the bag panel lists the same materials newest first). The five fluids are here too though they never reach the bag; each has a lesson like any other material. A byproduct has no lesson of its own: it falls out of another lesson's recipe, and typing at that lesson is what makes it.

| # | material | lesson | col | keys opened | what you type | samples | where it is made | the plan's note |
|---|---|---|---|---|---|---|---|---|
| 1 | Iron Ore `R1` | I-01 (mine) | C1 | `s` `l` | the new keys `s` `l`, typed on their own, hinted and then blind | s l | Iron Ore Mine (there at the start); engine 44 Copper Sheet + 65 Iron Ingot + 1 Copper Ingot | ring fingers on the home row, mirror keys: the hands start where they rest |
| 2 | Copper Ore `R2` | I-02 (mine) | C2 | `a` `h` | the new keys `a` `h`, typed on their own, hinted and then blind | a h | Copper Ore Mine; price 135 Iron Ore; engine 177 Iron Rod + 44 Screw + 1 Wire | pinky and index inner, still on the home row; syllables open |
| 3 | Copper Ingot `S1` | E-01 (syllables) | C2 |  | syllables typed with `s` `l` `a` `h`, mostly `a` `h` | al · ha · as (+4 authored lines) | Foundry: 1 Iron Ore + 1 Copper Ore → 1 Copper Ingot; engine 31 Iron Plate + 40 Wire | as ha la sal; the first syllables, all on the home row |
| 4 | Limestone `R3` | I-03 (mine) | C3 | `e` `i` | the new keys `e` `i`, typed on their own, hinted and then blind | e i | Limestone Mine; price 147 Copper Ingot + 135 Copper Ore; engine 103 Steel Ingot + 48 Reinforced Iron Plate | the first reach: middle fingers straight up; words open here |
| 5 | Iron Ingot `S2` | E-02 (syllables) | C3 |  | syllables typed with `s` `l` `e` `i`, mostly `e` `i` | es · is · se | Foundry: 1 Iron Ore + 1 Limestone → 1 Iron Ingot; engine 21 Steel Beam + 51 Reinforced Iron Plate + 1 Steel Ingot | se le is el; a second alphabet, same rung: a home key and a reach in every pair |
| 6 | Copper Sheet `W1` | E-03 (words) | C3 |  | little words, typed with `s` `l` `a` `h` `e` `i`, mostly `e` `i` | he · she · is | Foundry: 2 Copper Ingot + 1 Limestone → 2 Copper Sheet; engine 87 Iron Plate + 25 Steel Beam | the first real words: she, he, his, has, is, as, else |
| 7 | Iron Rod `K1` | I-04 (keys) | C4 | `t` `n` | the new keys `t` `n`, typed on their own, hinted and then blind | t n | Crusher: 1 Copper Sheet → 4 Iron Rod + 1 Screw; engine 183 Steel Pipe + 9 Modular Frame | index fingers, the first diagonal reaches: the, that, this, it, in, at, an |
| 8 | Screw `B1` | byproduct of I-04 | C4 | | no lesson of its own: falls out of I-04 beside Iron Rod, 1 a run | | Crusher: 1 Copper Sheet → 4 Iron Rod + 1 Screw; engine 183 Steel Pipe + 9 Modular Frame | |
| 9 | Iron Plate `W2` | E-04 (words) | C4 |  | words about things, nature and home, typed with `s` `l` `e` `i` `t` `n`, mostly `t` `n` | nine · line · lens | Foundry: 2 Iron Ingot + 1 Iron Rod → 1 Iron Plate; engine 9 Steel Offcuts + 13 Encased Industrial Beam + 2 Solid Steel Ingot | nouns typed with six letters: nest, tent, tin, net, list, line, tile |
| 10 | Wire `W3` | E-05 (words) | C4 |  | little words, typed with `s` `l` `a` `h` `e` `i` `t` `n`, mostly `t` `n` | in · the · it | Manufacturer: 1 Copper Sheet + 1 Iron Rod + 1 Copper Ore → 1 Wire; engine 189 Steel Pipe + 10 Modular Frame + 1 Steel Offcuts | little words typed with eight letters: the, this, that, then, it, in, at, an; a h come back as the flux |
| 11 | Coal `R4` | I-05 (mine) | C5 | `d` `o` | the new keys `d` `o`, typed on their own, hinted and then blind | d o | Coal Mine; price 58 Wire + 35 Iron Plate + 129 Iron Ingot + 135 Limestone; engine 7 Iron Rebar + 8 Rotor | back to the home row with d, and o straight up: and, to, on, not, one |
| 12 | Steel Ingot `S3` | E-06 (syllables) | C5 |  | syllables typed with `d` `o` `s` `l`, mostly `d` `o` | so · lo · ol | Foundry: 1 Coal + 1 Iron Ore → 1 Steel Ingot; engine 9 Iron Rebar + 9 Rotor + 1 Encased Industrial Beam | do so old sold; d o with the home-row bank |
| 13 | Steel Beam `W4` | E-07 (words) | C5 |  | words about nature and things, typed with 10 letters, mostly `d` `o` | den · din · hind | Manufacturer: 2 Steel Ingot + 1 Iron Plate + 1 Copper Ore → 1 Steel Beam; engine 10 Rotor + 10 Iron Rebar | nature words leaning on d o: stone, soil, sand, land, toad, seed, tide; a h ride along as the flux |
| 14 | Reinforced Iron Plate `P1` | E-08 (phrases) | C5 |  | short phrases typed with 10 letters, mostly `d` `o` | in the end · he did it · hand in hand | Foundry: 1 Wire + 1 Coal → 2 Reinforced Iron Plate; engine 11 Rotor + 41 Encased Industrial Beam + 1 Modular Frame | first phrases: salt and sand, hand in hand, head to toe |
| 15 | Steel Pipe `K2` | I-06 (keys) | C6 | `r` `u` | the new keys `r` `u`, typed on their own, hinted and then blind | r u | Constructor: 1 Reinforced Iron Plate → 4 Steel Pipe; engine 7 Stator + 46 Iron Casting + 1 Slag | index fingers straight up: the last vowel |
| 16 | Solid Steel Ingot `S4` | E-09 (syllables) | C6 |  | syllables typed with `r` `u` `d` `o` `s` `l`, mostly `r` `u` | or · ou · ro | Manufacturer: 1 Steel Pipe + 1 Coal + 1 Iron Ore → 1 Solid Steel Ingot; engine 7 Stator + 47 Iron Casting + 1 Slag | ru ur ro or with d o |
| 17 | Encased Industrial Beam `W5` | E-10 (words) | C6 |  | words about home, things and the railway, typed with 12 letters, mostly `r` `u` | urn · rune · rein | Foundry: 2 Solid Steel Ingot + 1 Steel Beam → 1 Encased Industrial Beam; engine 8 Stator + 52 Iron Casting + 1 Slag | home and road words leaning on r u: door, road, route, rust, hour, house, ruin |
| 18 | Modular Frame `P2` | E-11 (phrases, gather) | C6 |  | short phrases typed with 12 letters, mostly `r` `u` | hush hush · it is here · run the line | Packager: 1 Reinforced Iron Plate + 1 Encased Industrial Beam → 1 Modular Frame + 1 Steel Offcuts; engine 9 Stator + 58 Iron Casting | GATHER 1: phrases typed with the first twelve letters |
| 19 | Steel Offcuts `B2` | byproduct of E-11 | C6 | | no lesson of its own: falls out of E-11 beside Modular Frame, 1 a run | | Packager: 1 Reinforced Iron Plate + 1 Encased Industrial Beam → 1 Modular Frame + 1 Steel Offcuts; engine 9 Stator + 58 Iron Casting | |
| 20 | Water (fluid) `R5` | I-07 (mine) | C7 | `c` `m` `.` | the new keys `c` `m` `.`, typed on their own, hinted and then blind | c m . | Water Extractor; price 8 Modular Frame + 11 Encased Industrial Beam + 54 Solid Steel Ingot + 129 Steel Ingot + 135 Coal; engine 103 Caterium Ingot + 9 Spare Wire | the bottom row, middle and index, and the period on its own key: sentences are within reach |
| 21 | Iron Slurry (fluid) `S5` | E-12 (syllables) | C7 |  | syllables typed with `c` `m` `e` `i`, mostly `c` `m` `.` | me · ic · ce (+4 authored lines) | Refinery: 2 Water + 1 Limestone → 1 Iron Slurry; engine 18 Quickwire + 9 Motor + 1 Iron Scrap | ce ec me em ic; ice, mice; e i is the bank because s l holds no vowel |
| 22 | Iron Rebar `W6` | E-13 (words) | C7 |  | words about home, people and time, typed with 14 letters, mostly `c` `m` `.` | mum · time · men | Refinery: 4 Iron Slurry + 1 Encased Industrial Beam → 1 Iron Rebar; engine 27 Quickwire + 102 Caterium Ingot | home and family words leaning on c m: home, room, mother, cousin, uncle, morning |
| 23 | Rotor `T1` | E-14 (sentences) | C7 |  | plain sentences ending in a period, typed with 14 letters and the marks `.`, mostly `c` `m` `.` | the sun is hot. · the moon is out. · she is at home. (+33 authored lines) | Foundry: 1 Modular Frame + 1 Iron Rebar → 2 Rotor; engine 35 Quickwire + 13 Motor + 1 Spare Wire | the first sentences, period only |
| 24 | Iron Casting `K3` | I-08 (keys) | C8 | Shift | the Shift key: capitals of every letter opened so far, and the pronoun I | Sam · Ruth · Tom | Crusher: 1 Rotor → 4 Iron Casting + 1 Slag; engine 8 Heavy Modular Frame + 56 Caterium Filament + 1 Spare Wire + 1 Motor | capitals of every unlocked letter; a sentence gets its capital, and so does I |
| 25 | Slag `B3` | byproduct of I-08 | C8 | | no lesson of its own: falls out of I-08 beside Iron Casting, 1 a run | | Crusher: 1 Rotor → 4 Iron Casting + 1 Slag; engine 8 Heavy Modular Frame + 56 Caterium Filament + 1 Spare Wire + 1 Motor | |
| 26 | Stator `T2` | E-15 (sentences) | C8 |  | sentences with capitals and names, typed with 14 letters and the marks `.` | Sam is at home. · Ann and Tom are in London. · Sam (+29 authored lines) | Manufacturer: 1 Rotor + 1 Iron Casting + 1 Reinforced Iron Plate → 1 Stator; engine 8 Heavy Modular Frame + 57 Caterium Filament + 1 Spare Wire + 1 Motor | capitalised sentences and proper names: Sam, Ruth, London; the first phrases come back as the flux |
| 27 | Caterium Ore `R6` | I-09 (mine) | C9 | `g` `y` | the new keys `g` `y`, typed on their own, hinted and then blind | g y | Caterium Ore Mine; price 22 Stator + 300 Solid Steel Ingot + 135 Coal; engine 103 Quartz Crystal + 11 Radio Control Unit | index inner home and index top inner: -ing and -ly; you, they, my |
| 28 | Caterium Ingot `S6` | E-16 (syllables) | C9 |  | syllables typed with `g` `y` `s` `l` `a` `h`, mostly `g` `y` | ly · gh · ay (+13 authored lines) | Manufacturer: 1 Caterium Ore + 1 Iron Ore + 1 Copper Ore → 1 Caterium Ingot; engine 22 Crystal Oscillator + 102 Quartz Crystal | ga ag gas; ay ly hy |
| 29 | Quickwire `W7` | E-17 (words) | C9 |  | verbs, typed with 16 letters, mostly `g` `y` | hung · reign · urge | Foundry: 2 Caterium Ingot + 1 Iron Rebar → 1 Quickwire; engine 14 Radio Control Unit + 26 Crystal Oscillator + 1 Caterium Filament + 1 Heavy Modular Frame | verbs and their -ing leaning on g y: go, get, dig, try, say, stay, carry, going, saying |
| 30 | Motor `T3` | E-18 (sentences, gather) | C9 |  | plain sentences ending in a period, typed with 16 letters and the marks `.`, mostly `g` `y` | You can go home. · The day is long. · They sang all night. (+30 authored lines) | Fractionator: 1 Stator + 2 Quickwire → 2 Motor + 3 Spare Wire + 4 Iron Scrap; engine 16 Radio Control Unit + 169 Caterium Filament + 1 Crystal Oscillator | GATHER 2: sentences typed with sixteen letters |
| 31 | Spare Wire `B4` | byproduct of E-18 | C9 | | no lesson of its own: falls out of E-18 beside Motor, 3 a run | | Fractionator: 1 Stator + 2 Quickwire → 2 Motor + 3 Spare Wire + 4 Iron Scrap; engine 16 Radio Control Unit + 169 Caterium Filament + 1 Crystal Oscillator | |
| 32 | Iron Scrap `B5` | byproduct of E-18 | C9 | | no lesson of its own: falls out of E-18 beside Motor, 4 a run | | Fractionator: 1 Stator + 2 Quickwire → 2 Motor + 3 Spare Wire + 4 Iron Scrap; engine 16 Radio Control Unit + 169 Caterium Filament + 1 Crystal Oscillator | |
| 33 | Caterium Filament `K4` | I-10 (keys) | C10 | `,` | the new key `,`, typed on its own, hinted and then blind | , | Constructor: 1 Motor → 4 Caterium Filament; engine 10 Control Panel + 70 Silica | the comma on its own key, unshifted: not the hurdle it is in ЙЦУКЕН, but clauses keep their column |
| 34 | Heavy Modular Frame `T4` | E-19 (sentences) | C10 |  | sentences joined with commas, typed with 16 letters and the marks `.` `,`, mostly `,` | He sat, and she read. · The day is done, and the night is here. · Go home, Sam. (+28 authored lines) | Manufacturer: 1 Motor + 1 Caterium Filament + 1 Modular Frame → 1 Heavy Modular Frame; engine 18 Quartz Dust + 10 Control Panel | clauses: he sat, and she read; two phrases joined by a comma, so the phrase gather is the flux |
| 35 | Raw Quartz `R7` | I-11 (mine) | C11 | `f` `w` | the new keys `f` `w`, typed on their own, hinted and then blind | f w | Raw Quartz Mine; price 24 Heavy Modular Frame + 129 Caterium Ingot + 135 Caterium Ore; engine 103 Black Powder + 12 Nobelisk Detonator | the left bump and ring top: of, for, from, if; we, was, with, what, when, where, who, how, now |
| 36 | Quartz Crystal `S7` | E-20 (syllables) | C11 |  | syllables typed with `f` `w` `s` `l` `e` `i`, mostly `f` `w` | wi · we · fi | Manufacturer: 1 Raw Quartz + 1 Iron Ore + 1 Limestone → 1 Quartz Crystal; engine 22 Nobelisk + 6 Sulfuric Residue + 8 Black Powder | fe fi self; we wi wise |
| 37 | Crystal Oscillator `W8` | E-21 (words) | C11 |  | words about things, places and nature, typed with 18 letters, mostly `f` `w` | fur · ruff · fin | Foundry: 2 Quartz Crystal + 1 Quickwire → 1 Crystal Oscillator; engine 27 Nobelisk + 102 Black Powder | things and places leaning on f w: farm, field, fire, forest, water, wood, wind, wall, window, world |
| 38 | Radio Control Unit `T5` | E-22 (sentences) | C11 |  | sentences joined with commas, typed with 18 letters and the marks `.` `,`, mostly `f` `w` | We wait, and the train is late. · The wind is cold, so shut the window. · Wood for the fire, water for the tea. (+27 authored lines) | Foundry: 1 Heavy Modular Frame + 1 Crystal Oscillator → 2 Radio Control Unit; engine 35 Nobelisk + 16 Nobelisk Detonator + 1 Sulfuric Residue | sentences with clauses and the wh- words |
| 39 | Silica `K5` | I-12 (keys, hurdle) | C12 | `'` `-` | the new keys `'` `-`, typed on their own, hinted and then blind | ' - | Crusher: 1 Radio Control Unit → 4 Silica + 1 Quartz Dust; engine 6 Turbine Housing + 55 Pig Iron + 1 Iron Casing | the apostrophe on the Quote key, the signature hurdle, and the hyphen on Minus: the two marks that live inside a word |
| 40 | Quartz Dust `B6` | byproduct of I-12 | C12 | | no lesson of its own: falls out of I-12 beside Silica, 1 a run | | Crusher: 1 Radio Control Unit → 4 Silica + 1 Quartz Dust; engine 6 Turbine Housing + 55 Pig Iron + 1 Iron Casing | |
| 41 | Control Panel `T6` | E-23 (sentences) | C12 |  | sentences with apostrophes and hyphens, typed with 18 letters and the marks `.` `,` `'` `-`, mostly `'` `-` | It's cold, so don't go out. · We can't wait, and we won't. · Mother's at home, father's at the mine. (+30 authored lines) | Manufacturer: 1 Radio Control Unit + 1 Silica + 1 Iron Rebar → 1 Control Panel; engine 72 Compacted Coal + 6 Turbine Housing + 2 Pig Iron | contractions and compounds: it's cold, so don't go out; a one-way street; the home and family words are the flux |
| 42 | Sulfur `R8` | I-13 (mine) | C13 | `b` `p` | the new keys `b` `p`, typed on their own, hinted and then blind | b p | Sulfur Mine; price 29 Control Panel + 129 Quartz Crystal + 135 Raw Quartz; engine 11 Fuel Generator + 73 Pig Iron + 1 Turbine Housing | index bottom, inner, and pinky top |
| 43 | Black Powder `S8` | E-24 (syllables) | C13 |  | syllables typed with `b` `p` `d` `o` `s` `l`, mostly `b` `p` | po · pl · bl (+10 authored lines) | Manufacturer: 1 Sulfur + 1 Coal + 1 Iron Ore → 1 Black Powder; engine 12 Fuel Generator + 9 Turbine Housing + 1 Iron Casing | bo ob po op; sob, pod, plod |
| 44 | Nobelisk `W9` | E-25 (words) | C13 |  | verbs and words about people and life, typed with 20 letters, mostly `b` `p` | rub · burn · buff | Assembler: 2 Black Powder + 1 Crystal Oscillator → 1 Nobelisk; engine 14 Fuel Generator + 24 Iron Casing + 1 Turbine Housing | people leaning on b p: people, boy, brother, baby, papa, pupil, partner; put, pull, build, bring |
| 45 | Nobelisk Detonator `T7` | E-26 (sentences, gather) | C13 |  | sentences in the past tense, typed with 20 letters and the marks `.` `,` `'` `-`, mostly `b` `p` | Yesterday we were busy. · The boy was born by the bay. · Papa had put the pipe by the bed. (+29 authored lines) | Packager: 1 Control Panel + 1 Nobelisk → 2 Nobelisk Detonator + 1 Sulfuric Residue; engine 15 Fuel Generator + 34 Iron Casing + 1 Turbine Housing | GATHER 3: the past tense: yesterday we were busy. the boy was born by the bay. |
| 46 | Sulfuric Residue `B7` | byproduct of E-26 | C13 | | no lesson of its own: falls out of E-26 beside Nobelisk Detonator, 1 a run | | Packager: 1 Control Panel + 1 Nobelisk → 2 Nobelisk Detonator + 1 Sulfuric Residue; engine 15 Fuel Generator + 34 Iron Casing + 1 Turbine Housing | |
| 47 | Compacted Coal `K6` | I-14 (keys) | C14 | `k` | the new key `k`, typed on its own, hinted and then blind | k | Constructor: 1 Nobelisk Detonator → 4 Compacted Coal; engine 5 Computer + 12 Polymer Resin + 1 Petroleum Coke | middle home, alone: 26 letters over sixteen columns leave the rare six standing alone from here; know, think, like, look, make, take, work |
| 48 | Pig Iron `S9` | E-27 (syllables) | C14 |  | syllables typed with `k` `s` `l` `e` `i`, mostly `k` | ke · sk · ki (+10 authored lines) | Manufacturer: 1 Compacted Coal + 1 Iron Ore + 1 Limestone → 1 Pig Iron; engine 55 Polymer Composite + 16 Circuit Board | ke ki sk; silk, skill |
| 49 | Iron Casing `W10` | E-28 (words) | C14 |  | adjectives and words about things and places, typed with 21 letters, mostly `k` | hunk · drunk · bike | Assembler: 2 Pig Iron + 1 Nobelisk → 1 Iron Casing; engine 77 Plastic + 19 Heavy Oil Residue + 1 Polymer Resin | adjectives leaning on k: dark, black, thick, weak, sick, kind, keen, lucky; key, book, lock, market, lake |
| 50 | Turbine Housing `T8` | E-29 (sentences) | C14 |  | plain sentences ending in a period, typed with 21 letters and the marks `.` `,` `'` `-`, mostly `k` | The kettle is on. · Keep the key in the lock. · The dark road leads to the lake. (+25 authored lines) | Assembler: 1 Nobelisk Detonator + 1 Iron Casing → 1 Turbine Housing; engine 24 Circuit Board + 19 Polymer Resin + 1 Computer | sentences with adjectives |
| 51 | Crude Oil (fluid) `R9` | I-15 (mine) | C15 | `?` `!` | the new keys `?` `!`, typed on their own, hinted and then blind | ? ! | Crude Oil Extractor; price 55 Pig Iron + 6 Turbine Housing + 11 Iron Casing + 129 Black Powder + 135 Sulfur; engine 12 Supercomputer + 31 Circuit Board + 1 Polymer Resin | the slash key and the number row, shifted: questions and exclamations |
| 52 | Fuel Generator `T9` | E-30 (sentences) | C15 |  | questions and exclamations, typed with 21 letters and the marks `.` `,` `'` `-` `?` `!`, mostly `?` `!` | Who is there? · Is it true? · Where are you? (+30 authored lines) | Blender: 1 Turbine Housing + 2 Crude Oil + 1 Wire → 2 Fuel Generator; engine 13 Supercomputer + 27 Polymer Resin | who is there? are you ready? well done! The question words are little words, so E-05 is the flux |
| 53 | Plastic `K7` | I-16 (keys) | C16 | `v` | the new key `v`, typed on its own, hinted and then blind | v | Crusher: 1 Fuel Generator → 4 Plastic + 1 Heavy Oil Residue; engine 6 Heat Sink + 49 Aluminum Ingot + 1 Alclad Aluminum Sheet | index bottom, alone: very, have, over, every, seven, river |
| 54 | Heavy Oil Residue `B8` | byproduct of I-16 | C16 | | no lesson of its own: falls out of I-16 beside Plastic, 1 a run | | Crusher: 1 Fuel Generator → 4 Plastic + 1 Heavy Oil Residue; engine 6 Heat Sink + 49 Aluminum Ingot + 1 Alclad Aluminum Sheet | |
| 55 | Polymer Composite `S10` | E-31 (syllables) | C16 |  | syllables typed with `v` `s` `l` `e` `i`, mostly `v` | ve · iv · vi (+8 authored lines) | Manufacturer: 1 Plastic + 1 Iron Ore + 1 Limestone → 1 Polymer Composite; engine 65 Aluminum Scrap + 6 Heat Sink + 2 Aluminum Ingot + 1 Alclad Aluminum Sheet | ve ev vi iv; evil, live |
| 56 | Circuit Board `W11` | E-32 (words) | C16 |  | verbs and words about time and life, typed with 22 letters, mostly `v` | drive · live · give | Assembler: 2 Polymer Composite + 1 Iron Casing → 1 Circuit Board; engine 7 Heat Sink + 19 Alclad Aluminum Sheet + 2 Aluminum Ingot | time and doing words leaning on v: evening, event, ever, never, give, live, move, save, visit |
| 57 | Computer `T10` | E-33 (sentences, gather) | C16 |  | questions and exclamations, typed with 22 letters and the marks `.` `,` `'` `-` `?` `!`, mostly `v` | Have you seen it? · Do you ever rest? · Is it very far? (+34 authored lines) | Fractionator: 1 Fuel Generator + 2 Circuit Board → 1 Computer + 3 Polymer Resin + 4 Petroleum Coke; engine 25 Alclad Aluminum Sheet + 9 Heat Sink | GATHER 4: questions with have, ever, very: have you seen it? do you ever rest? |
| 58 | Polymer Resin `B9` | byproduct of E-33 | C16 | | no lesson of its own: falls out of E-33 beside Computer, 3 a run | | Fractionator: 1 Fuel Generator + 2 Circuit Board → 1 Computer + 3 Polymer Resin + 4 Petroleum Coke; engine 25 Alclad Aluminum Sheet + 9 Heat Sink | |
| 59 | Petroleum Coke `B10` | byproduct of E-33 | C16 | | no lesson of its own: falls out of E-33 beside Computer, 4 a run | | Fractionator: 1 Fuel Generator + 2 Circuit Board → 1 Computer + 3 Polymer Resin + 4 Petroleum Coke; engine 25 Alclad Aluminum Sheet + 9 Heat Sink | |
| 60 | Bauxite `R10` | I-17 (mine) | C17 | `"` | the new key `"`, typed on its own, hinted and then blind | " | Bauxite Mine; price 6 Computer + 23 Circuit Board + 65 Polymer Composite + 300 Pig Iron + 135 Sulfur; engine 103 Encased Uranium Cell + 17 Electromagnetic Control Rod | the straight double quote on the apostrophe key, shifted; English has no guillemets |
| 61 | Supercomputer `T11` | E-34 (sentences) | C17 |  | dialogue in quotation marks, typed with 22 letters and the marks `.` `,` `'` `-` `?` `!` `"`, mostly `"` | "Go home!" said Bob. · "Who is there?" she asked. · "I am ready," said the boy. (+25 authored lines) | Fabricator: 1 Computer + 1 Bauxite + 1 Nobelisk → 2 Supercomputer; engine 11 Cooling System + 6 Concrete | dialogue: "Go home!" said Bob. The people and past-tense words are the flux |
| 62 | Aluminum Scrap `K8` | I-18 (keys) | C18 | `j` | the new key `j`, typed on its own, hinted and then blind | j | Constructor: 1 Supercomputer → 4 Aluminum Scrap; engine 8 Reactor Assembly + 52 Uranium Fuel Rod + 1 Uranium Waste | the right bump, alone: the rarest letter this side of x |
| 63 | Aluminum Ingot `S11` | E-35 (syllables) | C18 |  | syllables typed with `j` `s` `l` `a` `h`, mostly `j` | ja · ja · aj (+3 authored lines) | Fabricator: 1 Aluminum Scrap + 1 Iron Ore + 1 Copper Ore → 1 Aluminum Ingot; engine 8 Reactor Assembly + 22 Electromagnetic Control Rod + 1 Uranium Fuel Rod | ja aj; jab |
| 64 | Alclad Aluminum Sheet `W12` | E-36 (words) | C18 |  | verbs and words about things and the railway, typed with 23 letters, mostly `j` | jib · jug · junk | Assembler: 2 Aluminum Ingot + 1 Circuit Board → 1 Alclad Aluminum Sheet; engine 9 Reactor Assembly + 61 Uranium Fuel Rod + 1 Uranium Waste | words leaning on j: jar, jug, jacket, join, jump, enjoy, jet, junction, journey |
| 65 | Heat Sink `T12` | E-37 (sentences) | C18 |  | sentences joined with commas, typed with 23 letters and the marks `.` `,` `'` `-` `?` `!` `"`, mostly `j` | Jack joined the crew, and Jane joined too. · The job is done, so enjoy the evening. · Jim jumped the fence, and the dog followed. (+21 authored lines) | Assembler: 1 Supercomputer + 1 Alclad Aluminum Sheet → 1 Heat Sink; engine 10 Reactor Assembly + 35 Electromagnetic Control Rod | sentences with j: just a minute, then we go. |
| 66 | Uranium `R11` | I-19 (mine) | C19 | `x` | the new key `x`, typed on its own, hinted and then blind | x | Uranium Mine; price 25 Alclad Aluminum Sheet + 9 Heat Sink + 65 Aluminum Ingot + 300 Polymer Composite + 135 Bauxite; engine 10 Fused Modular Frame + 9 Turbo Motor + 1 Reactor Assembly | ring bottom, alone |
| 67 | Encased Uranium Cell `S12` | E-38 (syllables) | C19 |  | syllables typed with `x` `s` `l` `e` `i`, mostly `x` | ex · ix · xi (+6 authored lines) | Fabricator: 1 Uranium + 1 Iron Ore + 1 Limestone → 1 Encased Uranium Cell; engine 11 Fused Modular Frame + 10 Turbo Motor + 8 Uranium Fuel Rod + 1 Uranium Waste | ex xi ix; six, exile |
| 68 | Electromagnetic Control Rod `W13` | E-39 (words) | C19 |  | words about things, people and places, typed with 24 letters, mostly `x` | six · text · exit | Assembler: 2 Encased Uranium Cell + 1 Alclad Aluminum Sheet → 1 Electromagnetic Control Rod; engine 11 Turbo Motor + 13 Fused Modular Frame | things leaning on x: box, axle, text, index, expert, exit, taxi, six, sixty |
| 69 | Cooling System `T13` | E-40 (sentences, gather) | C19 |  | sentences with every mark so far, typed with 24 letters and the marks `.` `,` `'` `-` `?` `!` `"`, mostly `x` | Next stop, Exeter! · Six boxes, all full. · The axle is fixed, so we can go. (+23 authored lines) | Packager: 1 Heat Sink + 1 Electromagnetic Control Rod → 2 Cooling System + 1 Concrete; engine 169 Uranium Fuel Rod + 42 Uranium Waste + 1 Turbo Motor | GATHER 5: every mark so far in one pool: comma, question, capitals, apostrophe, quotes |
| 70 | Concrete `B11` | byproduct of E-40 | C19 | | no lesson of its own: falls out of E-40 beside Cooling System, 1 a run | | Packager: 1 Heat Sink + 1 Electromagnetic Control Rod → 2 Cooling System + 1 Concrete; engine 169 Uranium Fuel Rod + 42 Uranium Waste + 1 Turbo Motor | |
| 71 | Uranium Fuel Rod `K9` | I-20 (keys) | C20 | `:` `;` `(` `)` | the new keys `:` `;` `(` `)`, typed on their own, hinted and then blind | : ; ( ) | Crusher: 1 Cooling System → 4 Uranium Fuel Rod + 1 Uranium Waste; engine 43 Magnetic Core + 3 Assembly Director System | the semicolon on its key, the colon above it, the brackets on the number row: lists and asides |
| 72 | Uranium Waste `B12` | byproduct of I-20 | C20 | | no lesson of its own: falls out of I-20 beside Uranium Fuel Rod, 1 a run | | Crusher: 1 Cooling System → 4 Uranium Fuel Rod + 1 Uranium Waste; engine 43 Magnetic Core + 3 Assembly Director System | |
| 73 | Reactor Assembly `T14` | E-41 (sentences) | C20 |  | lists and asides with colons, semicolons and brackets, typed with 24 letters and the marks `.` `,` `'` `-` `?` `!` `"` `:` `;` `(` `)`, mostly `:` `;` `(` `)` | Here is the list: iron, coal, stone. · The day is done; the night is near. · The book (an old one) is on the shelf. (+26 authored lines) | Fabricator: 1 Cooling System + 1 Uranium Fuel Rod + 1 Crystal Oscillator → 1 Reactor Assembly; engine 11 Iron Filings + 8 Copper Powder + 3 Battery | here is the list: iron, coal, stone. the plan is simple (almost). Lists are of things, so the things words are the flux |
| 74 | Nitrogen Gas (fluid) `R12` | I-21 (mine) | C21 | `q` | the new key `q`, typed on its own, hinted and then blind | q | Nitrogen Gas Extractor; price 29 Reactor Assembly + 129 Encased Uranium Cell + 135 Uranium; engine 6 SAM Fluctuator + 49 Magnetic Core | pinky top, alone: q only ever comes with u |
| 75 | Nitric Acid (fluid) `S13` | E-42 (syllables) | C21 |  | syllables typed with `q` `r` `u` `e` `i`, mostly `q` | qu · qu · que (+6 authored lines) | Blender: 2 Nitrogen Gas + 1 Steel Pipe + 1 Limestone → 1 Nitric Acid; engine 9 SAM Fluctuator + 15 Copper Powder + 1 Assembly Director System | qu que quire; r u is the partner because q needs its u |
| 76 | Fused Modular Frame `W14` | E-43 (words) | C21 |  | words about work, things and life, typed with 25 letters, mostly `q` | liquid · equip · quest | Refinery: 4 Nitric Acid + 1 Electromagnetic Control Rod → 1 Fused Modular Frame; engine 11 SAM Fluctuator + 25 Magnetic Field Generator + 1 Copper Powder | work words leaning on q: quarry, quality, quantity, equip, quartz, liquid, question |
| 77 | Turbo Motor `T15` | E-44 (sentences) | C21 |  | sentences with every mark so far, typed with 25 letters and the marks `.` `,` `'` `-` `?` `!` `"` `:` `;` `(` `)`, mostly `q` | The quarry is quiet today. · Be quick, be quiet, be careful. · The queen is not amused. (+24 authored lines) | Assembler: 1 Reactor Assembly + 1 Fused Modular Frame → 2 Turbo Motor; engine 13 SAM Fluctuator + 34 Magnetic Field Generator + 1 Copper Powder | sentences with q: the quarry is quiet today. |
| 78 | Battery `K10` | I-22 (keys) | C22 | `z` | the new key `z`, typed on its own, hinted and then blind | z | Constructor: 1 Turbo Motor → 4 Battery; engine 5 Ballistic Warp Drive + 8 Alien Power Matrix | pinky bottom, alone: the last letter, the corner of the board |
| 79 | Magnetic Core `S14` | E-45 (syllables) | C22 |  | syllables typed with `z` `d` `o` `s` `l`, mostly `z` | zo · zz · zo (+4 authored lines) | Fabricator: 1 Battery + 1 Coal + 1 Iron Ore → 1 Magnetic Core; engine 66 Reanimated SAM + 5 Ballistic Warp Drive + 1 Alien Power Matrix | zo oz; zoo, doze |
| 80 | Magnetic Field Generator `W15` | E-46 (words) | C22 |  | words about life, things and nature, typed with 26 letters, mostly `z` | buzz · fuzz · quartz (+25 authored lines) | Assembler: 2 Magnetic Core + 1 Fused Modular Frame → 1 Magnetic Field Generator; engine 6 Ballistic Warp Drive + 9 Alien Power Matrix | the last letter in words: puzzle, jazz, size, dozen, zinc, bronze, breeze, blizzard |
| 81 | Assembly Director System `T16` | E-47 (sentences, gather) | C22 |  | sentences with every mark so far, typed with 26 letters and the marks `.` `,` `'` `-` `?` `!` `"` `:` `;` `(` `)`, mostly `z` | The zinc is in the bronze. · The puzzle has a dozen pieces. · Size matters; so does speed. (+24 authored lines) | Fractionator: 1 Turbo Motor + 2 Magnetic Field Generator → 1 Assembly Director System + 3 Copper Powder + 4 Iron Filings; engine 7 Ballistic Warp Drive + 86 Reanimated SAM | GATHER 6: every letter of the alphabet |
| 82 | Copper Powder `B13` | byproduct of E-47 | C22 | | no lesson of its own: falls out of E-47 beside Assembly Director System, 3 a run | | Fractionator: 1 Turbo Motor + 2 Magnetic Field Generator → 1 Assembly Director System + 3 Copper Powder + 4 Iron Filings; engine 7 Ballistic Warp Drive + 86 Reanimated SAM | |
| 83 | Iron Filings `B14` | byproduct of E-47 | C22 | | no lesson of its own: falls out of E-47 beside Assembly Director System, 4 a run | | Fractionator: 1 Turbo Motor + 2 Magnetic Field Generator → 1 Assembly Director System + 3 Copper Powder + 4 Iron Filings; engine 7 Ballistic Warp Drive + 86 Reanimated SAM | |
| 84 | Gazette I `G1` | P-lore-1 (page) | C22 |  | a page of lore (the machines talking), grade 1 | The smelter never sleeps. It eats ore and gives back bronze, and so it goes all day. | Assembler: 1 Control Panel + 1 Copper Powder → 1 Gazette I; no engine priced | plain sentences; the machines talk |
| 85 | Letter I `G2` | P-let-1 (page) | C22 |  | a page of letters and correspondence, grade 1 | Dear Ann, I am writing from Leeds. It is cold here, but the work goes on. Love, Sam. | Assembler: 1 Fuel Generator + 1 Iron Filings → 1 Letter I; no engine priced | a short letter: greeting, plain sentences, a name |
| 86 | SAM Ore `R13` | I-23 (mine) | C23 | `1` `2` `3` `4` `5` | the new keys `1` `2` `3` `4` `5`, typed on their own, hinted and then blind | 1 2 3 4 5 | SAM Ore Mine; price 1 Letter I + 1 Gazette I + 4 Magnetic Field Generator + 24 Magnetic Core + 1 Assembly Director System + 300 Encased Uranium Cell + 135 Uranium; engine 3 Gazette III + 2 Almanac II + 1 Script II | the left half of the number row |
| 87 | SAM Fluctuator `T17` | E-48 (sentences) | C23 |  | sentences with numbers, typed with 26 letters and the marks `.` `,` `'` `-` `?` `!` `"` `:` `;` `(` `)` and the digits 12345, mostly `1` `2` `3` `4` `5` | There are 25 men in the crew. · The train is at 5. · We need 3 tons of coal and 2 of quartz. (+22 authored lines) | Fabricator: 1 Assembly Director System + 1 SAM Ore + 1 Circuit Board → 2 SAM Fluctuator; engine 2 Script II + 2 Almanac II + 1 Gazette III + 1 Ballistic Warp Drive | counts and times: there are 25 men in the crew. the train is at 5. The time words are the flux |
| 88 | Book I `G3` | P-lit-1 (page) | C23 |  | a page of famous literature, grade 1 | It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. (Austen) | Workshop: 1 Cooling System + 1 Uranium Waste → 1 Book I; no engine priced | plain classic prose |
| 89 | Almanac I `G4` | P-triv-1 (page) | C23 |  | a page of fun trivia, grade 1 | An octopus has three hearts, and its blood is blue. | Workshop: 1 Turbo Motor + 1 Concrete → 1 Almanac I; no engine priced | facts in plain sentences, numbers spelled out |
| 90 | Gazette II `G5` | P-lore-2 (page) | C23 |  | a page of lore (the machines talking), grade 2 | They say the crane once lifted itself. That is a joke, of course; but ever since, its plaque has read: "Do not test!" | Workshop: 1 SAM Fluctuator + 1 Heavy Oil Residue → 1 Gazette II; no engine priced | longer, a joke, a colon |
| 91 | Reanimated SAM `K11` | I-24 (keys) | C24 | `6` `7` `8` `9` `0` | the new keys `6` `7` `8` `9` `0`, typed on their own, hinted and then blind | 6 7 8 9 0 | Constructor: 1 SAM Fluctuator → 4 Reanimated SAM; engine 3 Blueprint I + 2 Book III + 1 Letter III | the right half; English writes No. for the numero sign, so nothing rides along |
| 92 | Alien Power Matrix `T18` | E-49 (full) | C24 |  | full sentences with dates, prices and numbers, typed with 26 letters and the marks `.` `,` `'` `-` `?` `!` `"` `:` `;` `(` `)` and the digits 1234567890, mostly `6` `7` `8` `9` `0` | The mill was built in 1867. · The price is 90 pounds. · House 7, flat 108. (+23 authored lines) | Workshop: 1 SAM Fluctuator + 1 Reanimated SAM → 1 Alien Power Matrix; engine 3 Letter III + 2 Book III + 1 Blueprint I | full sentences at last: dates, prices, numbers of things: in 1867. house 7, flat 108. |
| 93 | Ballistic Warp Drive `T19` | E-50 (full, gather) | C24 |  | full sentences using the whole keyboard, typed with 26 letters and the marks `.` `,` `'` `-` `?` `!` `"` `:` `;` `(` `)` and the digits 1234567890, mostly `6` `7` `8` `9` `0` | In 1812 Dickens was born, and the English novel changed. · House 7 (by the river) sold for 1 250 000 pounds; the owner's pleased. · The engineer writes: "The system is simple (almost)". Input: ore; output: pages. (+4 authored lines) | Fabricator: 1 Alien Power Matrix + 1 Magnetic Field Generator + 1 Reactor Assembly → 1 Ballistic Warp Drive; engine 3 Blueprint I + 3 Book III + 1 Letter III | GATHER 7: the keyboard is complete; every core key in one pool |
| 94 | Book II `G6` | P-lit-2 (page) | C24 |  | a page of famous literature, grade 2 | Two roads diverged in a yellow wood, And sorry I could not travel both, And be one traveler, long I stood. (Frost) | Workshop: 1 Ballistic Warp Drive + 1 Polymer Resin → 1 Book II; no engine priced | verse: commas, capitals at line starts |
| 95 | Letter II `G7` | P-let-2 (page) | C24 |  | a page of letters and correspondence, grade 2 | Dear Mr Hudson, Thank you for your letter of 12 May. My answers, point by point: 1) yes; 2) no; 3) we can talk it over when we meet. | Workshop: 1 SAM Fluctuator + 1 Petroleum Coke → 1 Letter II; no engine priced | a formal letter with numbered points (digits 1-5) |
| 96 | Script I `G8` | P-dia-1 (page) | C24 |  | a page of dialogue and theatre, grade 1 | "Who is there?" "It is me, the postman." "What have you brought?" "A letter from home." | Workshop: 1 Supercomputer + 1 Sulfuric Residue → 1 Script I; no engine priced | dialogue: quotes and question marks |
| 97 | Almanac II `G9` | P-triv-2 (page) | C25 |  | a page of fun trivia, grade 2 | Loch Ness holds more water than every lake in England and Wales put together: about 7 452 million cubic metres. | Workshop: 1 Ballistic Warp Drive + 1 Quartz Dust → 1 Almanac II; no engine priced | digit-dense facts: the charter, the digits gather, is the flux |
| 98 | Script II `G10` | P-dia-2 (page) | C25 |  | a page of dialogue and theatre, grade 2 | Hamlet. To be, or not to be, that is the question: whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune. (Shakespeare) | Workshop: 1 Ballistic Warp Drive + 1 Spare Wire → 1 Script II; no engine priced | a scene from a play |
| 99 | Gazette III `G11` | P-lore-3 (page) | C25 |  | a page of lore (the machines talking), grade 3 | The frontier has one exam: build the machine, start it (at 6:00) and go to bed. If it is running in the morning, you are a master. | Workshop: 1 Alien Power Matrix + 1 Iron Scrap → 1 Gazette III; no engine priced | the frontier exam: brackets, a time |
| 100 | Blueprint I `G12` | P-tech-1 (page) | C26 |  | a page of mathematical and technical writing, grade 1 | Speed is distance divided by time. If the distance is 120 miles and the time is 2 hours, the speed is 60 miles an hour. | Workshop: 1 Ballistic Warp Drive + 1 Slag → 1 Blueprint I; no engine priced | a worked speed problem in words and digits |
| 101 | Book III `G13` | P-lit-3 (page) | C26 |  | a page of famous literature, grade 3 | Tyger Tyger, burning bright, In the forests of the night; What immortal hand or eye, Could frame thy fearful symmetry? (Blake) | Fitting Shop: 1 Ballistic Warp Drive + 1 Steel Offcuts → 1 Book III; no engine priced | verse with semicolons and exclamations |
| 102 | Letter III `G14` | P-let-3 (page) | C26 |  | a page of letters and correspondence, grade 3 | Hello! Order 4085 (3 items; 12 700 pounds) was sent on 8 June; the tracking number is attached. Regards, the warehouse. | Fitting Shop: 1 Ballistic Warp Drive + 1 Screw → 1 Letter III; no engine priced | an order: order numbers, prices, dates |
| 103 | Script III `G15` | P-dia-3 (page) | C27 |  | a page of dialogue and theatre, grade 3 | "Curiouser and curiouser!" cried Alice; "now I am opening out like the largest telescope that ever was!" (Carroll) | Fitting Shop: 1 Ballistic Warp Drive + 1 Copper Powder → 1 Script III; no engine priced | nested quotation inside speech |
| 104 | Blueprint II `G16` | P-tech-2 (page) | C27 |  | a page of mathematical and technical writing, grade 2 | The area of a circle is pi times the radius squared. With a radius of 3 (cm) the area is about 28.3 (sq cm). | Fitting Shop: 1 Ballistic Warp Drive + 1 Iron Filings → 1 Blueprint II; no engine priced | geometry with brackets and decimals |
| 105 | Almanac III `G17` | P-triv-3 (page) | C27 |  | a page of fun trivia, grade 3 | In 1928 the Flying Scotsman ran the 392 miles from London to Edinburgh without a stop: 8 hours, 3 minutes, 1 engine. | Fitting Shop: 1 Ballistic Warp Drive + 1 Uranium Waste → 1 Almanac III; no engine priced | the railway in numbers |
| 106 | Blueprint III `G18` | P-tech-3 (page) | C28 |  | a page of mathematical and technical writing, grade 3 | Algorithm: 1) read a number; 2) if it is even, halve it, else triple it and add 1; 3) repeat until you reach 1. | Fitting Shop: 1 Ballistic Warp Drive + 1 Concrete → 1 Blueprint III; no engine priced | an algorithm: numbered steps, conditions |
| 107 | Power Shard `K12` | X-01 (keys, extended) | C28 | `%` `*` `+` `=` | the new keys `%` `*` `+` `=`, typed on their own, hinted and then blind | % * + = | Constructor: 1 SAM Ore → 4 Power Shard; engine 300 Excited Photonic Matter + 300 Superposition Oscillator | arithmetic marks; opens after tech 2 |
| 108 | Superposition Oscillator `K13` | X-02 (keys, extended) | C29 | `/` `\` `[` `]` `{` `}` `<` `>` | the new keys `/` `\` `[` `]` `{` `}` `<` `>`, typed on their own, hinted and then blind | / \ [ ] { } < > | Constructor: 1 SAM Ore → 4 Superposition Oscillator; engine 4 Program Listing + 300 Excited Photonic Matter | brackets and slashes, all on their own keys |
| 109 | Formula Sheet `G19` | PX-math (page) | C29 |  | a page of mathematical and technical writing, grade 4 | Formula: (x + y) * (x - y) = x^2 - y^2; with x = 7, y = 3 we get 40 (100% correct). | Fabricator: 1 Ballistic Warp Drive + 1 Power Shard + 1 Heavy Oil Residue → 1 Formula Sheet; no engine priced | extended: formulas |
| 110 | Excited Photonic Matter `K14` | X-03 (keys, extended) | C30 | `@` `#` `$` `&` `^` `~` `\|` `_` `` ` `` | the new keys `@` `#` `$` `&` `^` `~` `\|` `_` `` ` ``, typed on their own, hinted and then blind | @ # $ & ^ ~ \| _ \` | Constructor: 1 SAM Ore → 4 Excited Photonic Matter; no engine priced | the code symbols |
| 111 | Program Listing `G20` | PX-code (page) | C31 |  | a page of mathematical and technical writing, grade 4 | if (n % 2 === 0) { print(\`${n} is even\`); } else { print(\`odd\`); } // n: 0..10 | Fabricator: 1 Ballistic Warp Drive + 1 Superposition Oscillator + 1 Excited Photonic Matter → 1 Program Listing; no engine priced | extended: a page of code |

## Time at every lesson

Design columns are the game-charged replay at a flat 30 WPM unless named otherwise: items typed by hand over the whole game, keystrokes, minutes, the minutes of the single purchase that asks most of it (and which), how many purchases reach it, the columns it is typed in, and the column its engine is bought. Flags are the plan's caps (rule A12 and the builder's checks): an introduction five to ten minutes, a lesson at least three and at most sixty, no purchase over fifteen at one lesson.

| lesson | makes | col | kind | items | keystrokes | min, game flat | min, ramp | min, as priced | biggest purchase | purchases | typed in | engine | bot 20 h | bot 40 h | flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I-01 | Iron Ore | C1 | mine | 572 | 572 | 3.8 | 9.5 | 23.3 | 1.2 (build M1, C2) | 4 | C2 C3 | C3 | 0.12 | 0.12 |  |
| I-02 | Copper Ore | C2 | mine | 536 | 536 | 3.6 | 8.2 | 14.3 | 1.9 (mine I-03, C3) | 4 | C3 C4 | C4 | 0.13 | 0.13 |  |
| E-01 | Copper Ingot | C2 | syllables | 457 | 1372 | 9.1 | 20.2 | 9.1 | 2.9 (mine I-03, C3) | 5 | C3 C4 | C4 | 0.26 | 0.26 |  |
| I-03 | Limestone | C3 | mine | 1237 | 1237 | 8.2 | 16.8 | 33.0 | 2.6 (build M2, C4) | 7 | C3 C4 C5 | C5 | 0.23 | 0.23 |  |
| E-02 | Iron Ingot | C3 | syllables | 574 | 1722 | 11.5 | 23.6 | 11.5 | 4.1 (build M2, C4) | 5 | C3 C4 C5 | C5 | 0.33 | 0.37 |  |
| E-03 | Copper Sheet | C3 | words | 243 | 1457 | 9.7 | 19.9 | 10.5 | 2.4 (build M3, C4) | 8 | C3 C4 C5 | C5 | 0.36 | 0.39 |  |
| I-04 | Iron Rod + Screw | C4 | keys | 393 | 1572 | 10.5 | 21.0 | 10.5 | 2.8 (build M4, C6) | 9 | C4 C5 C6 | C6 | 0.45 | 0.76 | intro 10.5 min (five to ten) |
| E-04 | Iron Plate | C4 | words | 281 | 1686 | 11.2 | 22.5 | 12.2 | 4.5 (auto E-03, C5) | 7 | C4 C5 C6 | C6 | 1.41 | 2.79 |  |
| E-05 | Wire | C4 | words | 282 | 1694 | 11.3 | 22.6 | 12.2 | 2.5 (build M4, C6) | 10 | C4 C5 C6 | C6 | 0.69 | 1.28 |  |
| I-05 | Coal | C5 | mine | 1478 | 1478 | 9.9 | 19.7 | 39.4 | 2.7 (mine I-07, C7) | 11 | C5 C6 C7 | C7 | 0.38 | 0.38 |  |
| E-06 | Steel Ingot | C5 | syllables | 636 | 1908 | 12.7 | 25.4 | 12.7 | 3.3 (mine I-07, C7) | 11 | C5 C6 C7 | C7 | 0.39 | 0.39 |  |
| E-07 | Steel Beam | C5 | words | 221 | 1326 | 8.8 | 17.7 | 9.6 | 2.0 (build M5, C6) | 11 | C5 C6 C7 | C7 | 1.42 | 2.79 |  |
| E-08 | Reinforced Iron Plate | C5 | phrases | 280 | 3357 | 22.4 | 44.8 | 22.4 | 4.9 (build M4, C6) | 13 | C5 C6 C7 | C7 | 1.60 | 2.62 |  |
| I-06 | Steel Pipe | C6 | keys | 281 | 1125 | 7.5 | 14.9 | 7.5 | 2.1 (build M6, C7) | 10 | C6 C7 C8 | C8 | 0.50 | 0.92 |  |
| E-09 | Solid Steel Ingot | C6 | syllables | 496 | 1487 | 9.9 | 19.3 | 9.9 | 2.1 (auto E-08, C7) | 11 | C6 C7 C8 | C8 | 0.99 | 2.34 |  |
| E-10 | Encased Industrial Beam | C6 | words | 244 | 1463 | 9.8 | 18.6 | 10.6 | 2.1 (auto E-08, C7) | 12 | C6 C7 C8 | C8 | 1.32 | 2.67 |  |
| E-11 (gather) | Modular Frame + Steel Offcuts | C6 | phrases | 112 | 1347 | 9.0 | 16.7 | 9.0 | 1.0 (auto E-11, C8) | 13 | C6 C7 C8 | C8 | 0.38 | 0.76 |  |
| I-07 | Water | C7 | mine | 1000 | 1000 | 6.7 | 11.9 | 26.7 | 0.8 (auto E-07, C7) | 11 | C7 C8 C9 | C9 | 0.18 | 0.18 |  |
| E-12 | Iron Slurry | C7 | syllables | 622 | 1866 | 12.4 | 21.9 | 12.4 | 2.4 (auto E-12, C9) | 12 | C7 C8 C9 | C9 | 0.27 | 0.27 |  |
| E-13 | Iron Rebar | C7 | words | 182 | 1095 | 7.3 | 12.8 | 7.9 | 1.2 (auto E-12, C9) | 13 | C7 C8 C9 | C9 | 0.91 | 1.78 |  |
| E-14 | Rotor | C7 | sentences | 100 | 2606 | 17.4 | 30.1 | 17.4 | 2.4 (mine I-09, C9) | 13 | C7 C8 C9 | C9 | 0.47 | 0.65 |  |
| I-08 | Iron Casting + Slag | C8 | keys | 79 | 316 | 2.1 | 3.5 | 2.1 | 0.4 (auto E-11, C8) | 10 | C8 C9 C10 | C10 | 0.04 | 0.04 |  |
| E-15 | Stator | C8 | sentences | 112 | 2922 | 19.5 | 32.5 | 19.5 | 3.8 (mine I-09, C9) | 11 | C8 C9 C10 | C10 | 0.52 | 0.85 |  |
| I-09 | Caterium Ore | C9 | mine | 875 | 875 | 5.8 | 9.7 | 23.3 | 2.2 (mine I-11, C11) | 8 | C9 C10 C11 | C11 | 0.16 | 0.16 |  |
| E-16 | Caterium Ingot | C9 | syllables | 784 | 2353 | 15.7 | 26.1 | 15.7 | 3.8 (mine I-11, C11) | 9 | C9 C10 C11 | C11 | 0.31 | 0.31 |  |
| E-17 | Quickwire | C9 | words | 268 | 1610 | 10.7 | 17.9 | 11.6 | 1.9 (auto E-14, C9) | 10 | C9 C10 C11 | C11 | 0.19 | 0.19 |  |
| E-18 (gather) | Motor + Spare Wire + Iron Scrap | C9 | sentences | 90 | 2342 | 15.6 | 26.0 | 15.6 | 4.5 (auto E-18, C11) | 9 | C9 C10 C11 | C11 | 0.49 | 0.83 |  |
| I-10 | Caterium Filament | C10 | keys | 90 | 360 | 2.4 | 4.0 | 2.4 | 1.2 (auto E-18, C11) | 7 | C10 C11 C12 | C12 | 0.07 | 0.07 |  |
| E-19 | Heavy Modular Frame | C10 | sentences | 92 | 2386 | 15.9 | 25.3 | 15.9 | 4.2 (mine I-11, C11) | 8 | C10 C11 C12 | C12 | 0.39 | 1.04 |  |
| I-11 | Raw Quartz | C11 | mine | 847 | 847 | 5.6 | 8.6 | 22.6 | 2.0 (mine I-13, C13) | 9 | C11 C12 C13 | C13 | 0.16 | 0.16 |  |
| E-20 | Quartz Crystal | C11 | syllables | 685 | 2056 | 13.7 | 21.2 | 13.7 | 3.3 (mine I-13, C13) | 10 | C11 C12 C13 | C13 | 0.34 | 0.68 |  |
| E-21 | Crystal Oscillator | C11 | words | 203 | 1216 | 8.1 | 12.2 | 8.8 | 1.3 (auto E-17, C11) | 11 | C11 C12 C13 | C13 | 0.10 | 0.31 |  |
| E-22 | Radio Control Unit | C11 | sentences | 98 | 2555 | 17.0 | 25.2 | 17.0 | 3.1 (mine I-13, C13) | 10 | C11 C12 C13 | C13 | 0.27 | 0.92 |  |
| I-12 | Silica + Quartz Dust | C12 | keys | 62 | 250 | 1.7 | 2.4 | 1.7 | 0.5 (auto E-19, C12) | 8 | C12 C13 C14 | C14 | 0.01 | 0.02 |  |
| E-23 | Control Panel | C12 | sentences | 121 | 3156 | 21.0 | 30.1 | 21.0 | 5.0 (mine I-13, C13) | 9 | C12 C13 C14 | C14 | 0.25 | 1.23 |  |
| I-13 | Sulfur | C13 | mine | 994 | 994 | 6.6 | 9.5 | 26.5 | 2.2 (mine I-15, C15) | 9 | C13 C14 C15 | C15 | 0.07 | 0.30 |  |
| E-24 | Black Powder | C13 | syllables | 824 | 2471 | 16.5 | 23.5 | 16.5 | 3.8 (mine I-15, C15) | 10 | C13 C14 C15 | C15 | 0.18 | 0.51 |  |
| E-25 | Nobelisk | C13 | words | 285 | 1709 | 11.4 | 16.3 | 12.3 | 1.8 (auto E-22, C13) | 11 | C13 C14 C15 | C15 | 0.09 | 0.45 |  |
| E-26 (gather) | Nobelisk Detonator + Sulfuric Residue | C13 | sentences | 131 | 3413 | 22.8 | 32.5 | 22.8 | 3.2 (build M9, C15) | 11 | C13 C14 C15 | C15 | 0.10 | 0.87 |  |
| I-14 | Compacted Coal | C14 | keys | 178 | 714 | 4.8 | 6.7 | 4.8 | 1.0 (build M9, C15) | 9 | C14 C15 C16 | C16 | 0.02 | 0.12 |  |
| E-27 | Pig Iron | C14 | syllables | 695 | 2086 | 13.9 | 19.5 | 13.9 | 2.9 (build M9, C15) | 10 | C14 C15 C16 | C16 | 0.03 | 0.35 |  |
| E-28 | Iron Casing | C14 | words | 202 | 1211 | 8.1 | 11.0 | 8.7 | 1.7 (auto E-26, C15) | 10 | C14 C15 C16 | C16 | 0.01 | 0.10 |  |
| E-29 | Turbine Housing | C14 | sentences | 109 | 2832 | 18.9 | 25.3 | 18.9 | 3.4 (auto E-28, C16) | 11 | C14 C15 C16 | C16 | 0.02 | 0.32 |  |
| I-15 | Crude Oil | C15 | mine | 258 | 258 | 1.7 | 2.2 | 6.9 | 0.3 (mine I-17, C17) | 11 | C15 C16 C17 | C17 | 0.00 | 0.03 |  |
| E-30 | Fuel Generator | C15 | sentences | 145 | 3762 | 25.1 | 32.2 | 25.1 | 3.4 (mine I-17, C17) | 12 | C15 C16 C17 | C17 | 0.00 | 0.32 |  |
| I-16 | Plastic + Heavy Oil Residue | C16 | keys | 191 | 763 | 5.1 | 6.4 | 5.1 | 1.0 (auto E-28, C16) | 9 | C16 C17 C18 | C18 | 0.00 | 0.06 |  |
| E-31 | Polymer Composite | C16 | syllables | 676 | 2029 | 13.5 | 16.9 | 13.5 | 2.7 (mine I-17, C17) | 10 | C16 C17 C18 | C18 | 0.00 | 0.14 |  |
| E-32 | Circuit Board | C16 | words | 325 | 1948 | 13.0 | 16.2 | 14.1 | 1.9 (auto E-32, C18) | 11 | C16 C17 C18 | C18 | 0.00 | 0.10 |  |
| E-33 (gather) | Computer + Polymer Resin + Petroleum Coke | C16 | sentences | 108 | 2817 | 18.8 | 23.5 | 18.8 | 2.8 (build M10, C17) | 11 | C16 C17 C18 | C18 | 0.00 | 0.10 |  |
| I-17 | Bauxite | C17 | mine | 220 | 220 | 1.5 | 1.8 | 5.9 | 1.0 (mine I-19, C19) | 8 | C17 C18 C19 | C19 | 0.00 | 0.02 |  |
| E-34 | Supercomputer | C17 | sentences | 97 | 2512 | 16.7 | 20.9 | 16.7 | 3.7 (mine I-19, C19) | 9 | C17 C18 C19 | C19 | 0.00 | 0.07 |  |
| I-18 | Aluminum Scrap | C18 | keys | 132 | 527 | 3.5 | 4.3 | 3.5 | 0.9 (mine I-19, C19) | 8 | C18 C19 C20 | C20 | 0.00 | 0.01 |  |
| E-35 | Aluminum Ingot | C18 | syllables | 527 | 1580 | 10.5 | 12.8 | 10.5 | 2.7 (mine I-19, C19) | 9 | C18 C19 C20 | C20 | 0.00 | 0.03 |  |
| E-36 | Alclad Aluminum Sheet | C18 | words | 232 | 1391 | 9.3 | 11.0 | 10.0 | 1.4 (auto E-33, C18) | 10 | C18 C19 C20 | C20 | 0.00 | 0.01 |  |
| E-37 | Heat Sink | C18 | sentences | 86 | 2226 | 14.8 | 17.4 | 14.8 | 2.4 (auto E-36, C20) | 10 | C18 C19 C20 | C20 | 0.00 | 0.04 |  |
| I-19 | Uranium | C19 | mine | 684 | 684 | 4.6 | 5.1 | 18.3 | 2.0 (mine I-21, C21) | 8 | C19 C20 C21 | C21 | 0.00 | 0.00 |  |
| E-38 | Encased Uranium Cell | C19 | syllables | 591 | 1772 | 11.8 | 13.2 | 11.8 | 3.3 (mine I-21, C21) | 9 | C19 C20 C21 | C21 | 0.00 | 0.00 |  |
| E-39 | Electromagnetic Control Rod | C19 | words | 201 | 1208 | 8.0 | 8.8 | 8.7 | 1.7 (auto E-37, C20) | 10 | C19 C20 C21 | C21 | 0.00 | 0.00 |  |
| E-40 (gather) | Cooling System + Concrete | C19 | sentences | 121 | 3138 | 20.9 | 22.8 | 20.9 | 7.4 (auto E-40, C21) | 10 | C19 C20 C21 | C21 | 0.00 | 0.00 |  |
| I-20 | Uranium Fuel Rod + Uranium Waste | C20 | keys | 140 | 560 | 3.7 | 4.0 | 3.7 | 2.3 (auto E-40, C21) | 10 | C20 C21 C22 | C22 | 0.00 | 0.00 |  |
| E-41 | Reactor Assembly | C20 | sentences | 95 | 2461 | 16.4 | 17.6 | 16.4 | 5.0 (mine I-21, C21) | 11 | C20 C21 C22 | C22 | 0.00 | 0.00 |  |
| I-21 | Nitrogen Gas | C21 | mine | 901 | 901 | 6.0 | 6.4 | 26.3 | 1.0 (auto E-39, C21) | 9 | C21 C22 C23 | C23 | 0.00 | 0.00 |  |
| E-42 | Nitric Acid | C21 | syllables | 577 | 1730 | 11.5 | 12.4 | 12.4 | 2.5 (auto E-42, C23) | 10 | C21 C22 C23 | C23 | 0.00 | 0.00 |  |
| E-43 | Fused Modular Frame | C21 | words | 193 | 1157 | 7.7 | 8.3 | 8.8 | 1.9 (auto E-43, C23) | 11 | C21 C22 C23 | C23 | 0.00 | 0.00 |  |
| E-44 | Turbo Motor | C21 | sentences | 84 | 2176 | 14.5 | 15.5 | 15.1 | 2.7 (auto E-44, C23) | 12 | C21 C22 C23 | C23 | 0.00 | 0.00 |  |
| I-22 | Battery | C22 | keys | 109 | 438 | 2.9 | 3.1 | 3.1 | 0.6 (auto E-44, C23) | 9 | C22 C23 C24 | C24 | 0.00 | 0.00 |  |
| E-45 | Magnetic Core | C22 | syllables | 493 | 1479 | 9.9 | 10.1 | 10.5 | 1.9 (auto E-44, C23) | 10 | C22 C23 C24 | C24 | 0.00 | 0.00 |  |
| E-46 | Magnetic Field Generator | C22 | words | 213 | 1279 | 8.5 | 8.5 | 10.0 | 1.9 (auto E-44, C23) | 11 | C22 C23 C24 | C24 | 0.00 | 0.00 |  |
| E-47 (gather) | Assembly Director System + Copper Powder + Iron Filings | C22 | sentences | 82 | 2137 | 14.2 | 13.6 | 15.7 | 2.6 (auto E-47, C24) | 12 | C22 C23 C24 | C24 | 0.00 | 0.00 |  |
| P-lore-1 | Gazette I | C22 | page | 6 | 720 | 4.8 | 4.6 | 20.0 | 2.4 (completion completion, C26) | 3 | C23 C26 |  | 0.00 | 0.00 |  |
| P-let-1 | Letter I | C22 | page | 7 | 840 | 5.6 | 5.5 | 21.3 | 2.4 (build M11, C23) | 3 | C23 C26 |  | 0.00 | 0.00 |  |
| I-23 | SAM Ore | C23 | mine | 68 | 68 | 0.5 | 0.4 | 2.1 | 0.1 (auto E-47, C24) | 9 | C23 C24 C25 | C25 | 0.00 | 0.00 |  |
| E-48 | SAM Fluctuator | C23 | sentences | 72 | 1862 | 12.4 | 11.4 | 14.4 | 2.6 (auto E-47, C24) | 10 | C23 C24 C25 | C25 | 0.00 | 0.00 |  |
| P-lit-1 | Book I | C23 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | 0.00 | only 2.4 min: nothing asks for it |
| P-triv-1 | Almanac I | C23 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | 0.00 | only 2.4 min: nothing asks for it |
| P-lore-2 | Gazette II | C23 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | 0.00 | only 2.4 min: nothing asks for it |
| I-24 | Reanimated SAM | C24 | keys | 54 | 216 | 1.4 | 1.2 | 1.6 | 0.6 (auto E-47, C24) | 8 | C24 C25 C26 | C26 | 0.00 | 0.00 |  |
| E-49 | Alien Power Matrix | C24 | full | 70 | 2660 | 17.7 | 15.2 | 24.6 | 3.8 (auto E-46, C24) | 9 | C24 C25 C26 | C26 | 0.00 | 0.00 |  |
| E-50 (gather) | Ballistic Warp Drive | C24 | full | 53 | 2014 | 13.4 | 11.5 | 18.7 | 1.8 (auto E-47, C24) | 10 | C24 C25 C26 | C26 | 0.00 | 0.00 |  |
| P-lit-2 | Book II | C24 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | 0.00 | only 2.4 min: nothing asks for it |
| P-let-2 | Letter II | C24 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | 0.00 | only 2.4 min: nothing asks for it |
| P-dia-1 | Script I | C24 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | 0.00 | only 2.4 min: nothing asks for it |
| P-triv-2 | Almanac II | C25 | page | 5 | 600 | 4.0 | 3.4 | 18.7 | 1.6 (auto I-23, C25) | 3 | C25 C26 |  | 0.00 | 0.00 |  |
| P-dia-2 | Script II | C25 | page | 5 | 600 | 4.0 | 3.4 | 18.7 | 1.6 (auto E-48, C25) | 3 | C25 C26 |  | 0.00 | 0.00 |  |
| P-lore-3 | Gazette III | C25 | page | 6 | 720 | 4.8 | 4.1 | 20.0 | 2.4 (auto I-23, C25) | 3 | C25 C26 |  | 0.00 | 0.00 |  |
| P-tech-1 | Blueprint I | C26 | page | 10 | 1200 | 8.0 | 6.9 | 25.3 | 2.4 (auto I-24, C26) | 4 | C26 |  | 0.00 | 0.00 |  |
| P-lit-3 | Book III | C26 | page | 7 | 840 | 5.6 | 4.8 | 21.3 | 2.4 (auto E-50, C26) | 3 | C26 |  | 0.00 | 0.00 |  |
| P-let-3 | Letter III | C26 | page | 5 | 600 | 4.0 | 3.4 | 18.7 | 2.4 (auto E-49, C26) | 3 | C26 |  | 0.00 | 0.00 |  |
| P-dia-3 | Script III | C27 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | 0.00 | only 0.0 min: nothing asks for it |
| P-tech-2 | Blueprint II | C27 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | 0.00 | only 0.0 min: nothing asks for it |
| P-triv-3 | Almanac III | C27 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | 0.00 | only 0.0 min: nothing asks for it |
| P-tech-3 | Blueprint III | C28 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | 0.00 | only 0.0 min: nothing asks for it |
| X-01 (ext) | Power Shard | C28 | keys | 0 | 0 | 0.0 | 0.0 | 0.0 |  | 0 |  | C30 | 0.00 | 0.00 |  |
| X-02 (ext) | Superposition Oscillator | C29 | keys | 76 | 304 | 2.0 | 1.7 | 2.0 | 2.0 (auto X-01, C30) | 2 | C30 C31 | C31 | 0.00 | 0.00 |  |
| PX-math | Formula Sheet | C29 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | 0.00 | only 0.0 min: nothing asks for it |
| X-03 (ext) | Excited Photonic Matter | C30 | keys | 151 | 604 | 4.0 | 3.5 | 4.1 | 2.0 (auto X-02, C31) | 2 | C30 C31 |  | 0.00 | 0.00 |  |
| PX-code | Program Listing | C31 | page | 4 | 480 | 3.2 | 2.7 | 13.3 | 3.2 (auto X-02, C31) | 1 | C31 |  | 0.00 | 0.00 |  |

### By kind of lesson

| kind | lessons | min, game flat | min, ramp | min, as priced | bot 20 h (h) | bot 40 h (h) |
|---|---|---|---|---|---|---|
| mine | 13 | 64.5 | 109.9 | 268.4 | 1.4 | 1.7 |
| keys | 14 | 51.6 | 76.6 | 52.1 | 1.1 | 2.0 |
| syllables | 14 | 172.7 | 266.2 | 174.2 | 3.1 | 5.6 |
| words | 15 | 143.0 | 224.2 | 156.1 | 6.5 | 12.9 |
| phrases | 2 | 31.4 | 61.5 | 31.4 | 2.0 | 3.4 |
| sentences | 17 | 302.0 | 401.7 | 306.0 | 2.5 | 7.2 |
| full | 2 | 31.2 | 26.7 | 43.3 | 0.0 | 0.0 |
| pages | 20 | 58.4 | 51.3 | 333.3 | 0.0 | 0.0 |

### Flags (design model, as the game charges, flat 30 WPM)

- I-04 (Iron Rod, C4): intro 10.5 min (five to ten)
- P-lit-1 (Book I, C23): only 2.4 min: nothing asks for it
- P-triv-1 (Almanac I, C23): only 2.4 min: nothing asks for it
- P-lore-2 (Gazette II, C23): only 2.4 min: nothing asks for it
- P-lit-2 (Book II, C24): only 2.4 min: nothing asks for it
- P-let-2 (Letter II, C24): only 2.4 min: nothing asks for it
- P-dia-1 (Script I, C24): only 2.4 min: nothing asks for it
- P-dia-3 (Script III, C27): only 0.0 min: nothing asks for it
- P-tech-2 (Blueprint II, C27): only 0.0 min: nothing asks for it
- P-triv-3 (Almanac III, C27): only 0.0 min: nothing asks for it
- P-tech-3 (Blueprint III, C28): only 0.0 min: nothing asks for it
- PX-math (Formula Sheet, C29): only 0.0 min: nothing asks for it

### Flags (design model, as priced)

- I-01 (Iron Ore, C1): intro 23.3 min (five to ten)
- I-02 (Copper Ore, C2): intro 14.3 min (five to ten)
- I-03 (Limestone, C3): intro 33.0 min (five to ten)
- I-04 (Iron Rod, C4): intro 10.5 min (five to ten)
- I-05 (Coal, C5): intro 39.4 min (five to ten)
- I-07 (Water, C7): intro 26.7 min (five to ten)
- I-09 (Caterium Ore, C9): intro 23.3 min (five to ten)
- I-11 (Raw Quartz, C11): intro 22.6 min (five to ten)
- I-13 (Sulfur, C13): intro 26.5 min (five to ten)
- I-19 (Uranium, C19): intro 18.3 min (five to ten)
- I-21 (Nitrogen Gas, C21): intro 26.3 min (five to ten)

## Where the paper and the game part ways

- mine I-02 (R2 mine (a h) makes R2): the builder priced 435 Iron Ore, the game carries 135 Iron Ore (a repeated id in the price collapsed to its last entry)
- 9 print-run purchases (4.3 h as priced) exist only in the builder's replay: nothing in play buys a print run, so a page lesson is typed only for the completion, a machine price and an engine price
- a words item is priced at 6.5 characters but the game emits a unit every 6 keystrokes (chain.js PER_UNIT)
- a pages item is priced at 200 characters but the game emits a unit every 120 keystrokes (chain.js PER_UNIT)
- a mine is priced at 4 characters an ore but the game yields an ore a keystroke (app.js workKeystroke): every ore price is four times cheaper in play than on paper
- the completion price (3 Gazette I + 3 Letter I + 3 Book I + 3 Almanac I + 3 Script I + 3 Blueprint I + 3 Gazette II + 3 Letter II + 3 Book II) expands through the recipe quantities to 23,998 raw units (6,938 Iron Ore, 4,994 Limestone, 4,064 Water, ...). Automation does not shrink that: an engine consumes at the same ratio, so even with every engine bought the belts carry it all, at 2 s an ore per mine, or about 13 mine-hours. That is a volume a few engines carry in a session, so the bot's per-lesson hours past the first columns now measure its own habits (batches of 300, extra mines, typing rather than waiting) more than the tree

## What this method cannot see

- **Time at a lesson is not rehearsal of its keys.** A lesson's minutes are spread over its alphabet: a gather typed with 26 letters gives each key a sliver, an introduction gives two keys everything. Lesson minutes measure boredom; the builder's per-key exposure check measures learning. Judge with both.
- **A flat speed makes minutes a rescaling of keystrokes.** The ranking of lessons at 30 WPM is the ranking by keystrokes. The ramp column shows where a flat rate misleads: the first columns, typed at 12 to 15 WPM, take about twice what the flat model says, and those are the columns whose lessons are already the longest in keystrokes.
- **The typist never errs.** Both models count correct keystrokes only. A learner at 95% accuracy with stop-on-error spends time on errors and corrections that make nothing, most of all on fresh keys.
- **Each model is one player.** The design model buys every engine at exactly two columns and makes exactly what a price asks; the bot buys an engine when it pays back in keystrokes, builds extra mines, carries 300 at a time and plans only toward the completion. A person who automates late, forgets, or over-builds gets other numbers. Neither model brackets the human.
- **Demand comes from below, not from the material.** A lesson is typed because later prices reach through it: Reinforced Iron Plate is the longest lesson in the design model not because anything wants phrases but because thirteen purchases pass through it. Moving one price moves the minutes of lessons two columns back, so a judgement per material needs the why chain.
- **Automated output is free on paper and not in play.** The design model hands over whatever an engine makes at once; the real engines make a unit every few seconds and the finish needs tens of millions of raw units. Until the quantities change, the bot's numbers past the middle columns say nothing about the lessons, and the design model's numbers assume a fix that keeps the prices.
- **The line is a random draw.** The engine samples words by weakness and frequency and a unit is a fixed number of keystrokes, so the item counts here are keystroke units, not words or sentences, and the per-key mix inside a lesson follows the player's own weak keys.
- **Only the keys are timed.** Walking, menus, reading the caption and deciding are outside a lesson's time; the bot spent about a sixth of its clock on them, and a person spends more. Fine for rehearsal, short for session length.
- **Digits and shifted marks are slower than home-row letters.** One flat rate for a number sentence and a period sentence understates the number lesson; the ramp does not fix that either, since it varies by column, not by content.
- **The extended lessons and the advanced pages are optional.** The bot never touches them (not on the completion path), the design model prices them; their numbers are what a player who chooses them would spend.

