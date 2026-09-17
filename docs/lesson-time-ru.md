# Lesson time, RU (v4 tree)

Generated 2026-09-17 by `dev/lesson-time.js` from `js/tree-ru.js`, `docs/tree-v4-ru.json` and `js/chain.js`, with 1 bot run from `dev/bot-sim.js` (bot-ru-20h.json). Do not edit by hand; rerun the script.

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
| bot, 20 h on the clock (frontier) | typing 16.4 h of 20.0 h; 26 keys open; clock budget | | |

Where the bot got to, by the hour its keys came open:

- 20 h: I-01 (`о` `а`) 0.0 h · I-02 (`е` `н`) 0.1 h · I-03 (`и` `т`) 0.2 h · I-04 (`с` `л`) 0.3 h · I-05 (`в` `р`) 1.7 h · I-06 (`к` `п`) 1.8 h · I-07 (`м` `д` `.`) 3.6 h · I-08 (Shift) 4.2 h · I-09 (`у` `ь`) 7.0 h · I-10 (`,`) 7.3 h · I-11 (`ы` `г`) 10.5 h · I-12 (`-` `—`) 10.8 h · I-13 (`б` `я`) 15.6 h · I-14 (`з` `й`) 15.9 h

## Hours by column

The hours the purchases of a column ask of the hands (design) and the hours the bot spent typing lessons that live in that column (bot).

| column | opens | as priced | game, flat | game, ramp | bot 20 h |
|---|---|---|---|---|---|
| C1 | `о` `а` | 0.0 | 0.0 | 0.0 | 0.12 |
| C2 | `е` `н` | 0.3 | 0.0 | 0.1 | 0.39 |
| C3 | `и` `т` | 0.4 | 0.2 | 0.4 | 0.94 |
| C4 | `с` `л` | 0.8 | 0.5 | 0.9 | 2.37 |
| C5 | `в` `р` | 0.8 | 0.6 | 1.2 | 3.62 |
| C6 | `к` `п` | 1.0 | 0.8 | 1.5 | 2.97 |
| C7 | `м` `д` `.` | 1.2 | 0.8 | 1.7 | 1.71 |
| C8 | Shift | 0.7 | 0.5 | 0.9 | 0.48 |
| C9 | `у` `ь` | 1.0 | 0.7 | 1.2 | 1.48 |
| C10 | `,` | 0.3 | 0.3 | 0.5 | 0.46 |
| C11 | `ы` `г` | 1.0 | 0.8 | 1.3 | 0.94 |
| C12 | `-` `—` | 0.3 | 0.3 | 0.4 | 0.29 |
| C13 | `б` `я` | 1.2 | 0.9 | 1.3 | 0.54 |
| C14 | `з` `й` | 0.3 | 0.3 | 0.4 | 0.09 |
| C15 | `?` `!` | 1.2 | 1.0 | 1.4 | 0.00 |
| C16 | `ч` `ш` | 0.7 | 0.6 | 0.8 | 0.00 |
| C17 | `"` `«` `»` | 0.7 | 0.6 | 0.8 | 0.00 |
| C18 | `ж` `х` | 0.7 | 0.6 | 0.8 | 0.00 |
| C19 | `ц` `э` | 0.6 | 0.5 | 0.6 | 0.00 |
| C20 | `:` `;` `(` `)` | 0.7 | 0.6 | 0.6 | 0.00 |
| C21 | `ю` `ф` | 1.0 | 0.7 | 0.8 | 0.00 |
| C22 | `щ` `ё` `ъ` | 0.7 | 0.2 | 0.3 | 0.00 |
| C23 | `1` `2` `3` `4` `5` | 1.5 | 0.8 | 0.9 | 0.00 |
| C24 | `6` `7` `8` `9` `0` `№` | 1.3 | 0.6 | 0.6 | 0.00 |
| C25 | 3 pages | 1.1 | 0.3 | 0.2 | 0.00 |
| C26 | 3 pages | 1.9 | 0.8 | 0.7 | 0.00 |
| C27 | 3 pages | 0.6 | 0.0 | 0.0 | 0.00 |
| C28 | `%` `*` `+` `=` | 0.3 | 0.0 | 0.0 | 0.00 |
| C29 | `/` `\` `[` `]` `{` `}` `<` `>` | 0.2 | 0.0 | 0.0 | 0.00 |
| C30 | `@` `#` `$` `&` `^` `~` `\|` `_` `` ` `` | 0.1 | 0.1 | 0.1 | 0.00 |
| C31 | 1 pages | 0.3 | 0.1 | 0.1 | 0.00 |

## The lesson behind every material

Tree order, first material first (the bag panel lists the same materials newest first). The five fluids are here too though they never reach the bag; each has a lesson like any other material. A byproduct has no lesson of its own: it falls out of another lesson's recipe, and typing at that lesson is what makes it.

| # | material | lesson | col | keys opened | what you type | samples | where it is made | the plan's note |
|---|---|---|---|---|---|---|---|---|
| 1 | Iron Ore `R1` | I-01 (mine) | C1 | `о` `а` | the new keys `о` `а`, typed on their own, hinted and then blind | о а | Iron Ore Mine (there at the start); engine 44 Copper Sheet + 65 Iron Ingot + 1 Copper Ingot | the home bumps; the two vowels that carry 19% of text |
| 2 | Copper Ore `R2` | I-02 (mine) | C2 | `е` `н` | the new keys `е` `н`, typed on their own, hinted and then blind | е н | Copper Ore Mine; price 135 Iron Ore; engine 177 Iron Rod + 44 Screw + 1 Wire | index top |
| 3 | Copper Ingot `S1` | E-01 (syllables) | C2 |  | syllables typed with `о` `а` `е` `н`, mostly `е` `н` | на · но · не | Foundry: 1 Iron Ore + 1 Copper Ore → 1 Copper Ingot; engine 31 Iron Plate + 40 Wire | на но не; the first syllables |
| 4 | Limestone `R3` | I-03 (mine) | C3 | `и` `т` | the new keys `и` `т`, typed on their own, hinted and then blind | и т | Limestone Mine; price 147 Copper Ingot + 135 Copper Ore; engine 103 Steel Ingot + 48 Reinforced Iron Plate | index bottom; words open here |
| 5 | Iron Ingot `S2` | E-02 (syllables) | C3 |  | syllables typed with `о` `а` `и` `т`, mostly `и` `т` | то · та · ти | Foundry: 1 Iron Ore + 1 Limestone → 1 Iron Ingot; engine 21 Steel Beam + 51 Reinforced Iron Plate + 1 Steel Ingot | та то ти; a second alphabet, same rung |
| 6 | Copper Sheet `W1` | E-03 (words) | C3 |  | little words, typed with `о` `а` `е` `н` `и` `т`, mostly `и` `т` | и · тот · они | Foundry: 2 Copper Ingot + 1 Limestone → 2 Copper Sheet; engine 87 Iron Plate + 25 Steel Beam | the first real words: тот, нет, она, они |
| 7 | Iron Rod `K1` | I-04 (keys) | C4 | `с` `л` | the new keys `с` `л`, typed on their own, hinted and then blind | с л | Crusher: 1 Copper Sheet → 4 Iron Rod + 1 Screw; engine 183 Steel Pipe + 9 Modular Frame | the two most frequent consonants after н т |
| 8 | Screw `B1` | byproduct of I-04 | C4 | | no lesson of its own: falls out of I-04 beside Iron Rod, 1 a run | | Crusher: 1 Copper Sheet → 4 Iron Rod + 1 Screw; engine 183 Steel Pipe + 9 Modular Frame | |
| 9 | Iron Plate `W2` | E-04 (words) | C4 |  | words about things, nature and home, typed with `о` `а` `и` `т` `с` `л`, mostly `с` `л` | оса · лиса · лист | Foundry: 2 Iron Ingot + 1 Iron Rod → 1 Iron Plate; engine 9 Steel Offcuts + 13 Encased Industrial Beam + 2 Solid Steel Ingot | nouns typed with six letters: стол, лист, лиса |
| 10 | Wire `W3` | E-05 (words) | C4 |  | little words, typed with `о` `а` `е` `н` `и` `т` `с` `л`, mostly `с` `л` | с · или · если | Manufacturer: 1 Copper Sheet + 1 Iron Rod + 1 Copper Ore → 1 Wire; engine 189 Steel Pipe + 10 Modular Frame + 1 Steel Offcuts | little words typed with eight letters; е н come back as the flux |
| 11 | Coal `R4` | I-05 (mine) | C5 | `в` `р` | the new keys `в` `р`, typed on their own, hinted and then blind | в р | Coal Mine; price 58 Wire + 35 Iron Plate + 129 Iron Ingot + 135 Limestone; engine 7 Iron Rebar + 8 Rotor | middle home and index home |
| 12 | Steel Ingot `S3` | E-06 (syllables) | C5 |  | syllables typed with `в` `р` `о` `а`, mostly `в` `р` | ро · ра · во | Foundry: 1 Coal + 1 Iron Ore → 1 Steel Ingot; engine 9 Iron Rebar + 9 Rotor + 1 Encased Industrial Beam | ва во ра ро; copper ore + coal → copper |
| 13 | Steel Beam `W4` | E-07 (words) | C5 |  | words about nature and things, typed with 10 letters, mostly `в` `р` | сова · вол · ворона | Manufacturer: 2 Steel Ingot + 1 Iron Plate + 1 Copper Ore → 1 Steel Beam; engine 10 Rotor + 10 Iron Rebar | nature words leaning on в р: ветер, весна, река; iron ore rides along as the flux |
| 14 | Reinforced Iron Plate `P1` | E-08 (phrases) | C5 |  | short phrases typed with 10 letters, mostly `в` `р` | вот и все · сила воли · все на свете | Foundry: 1 Wire + 1 Coal → 2 Reinforced Iron Plate; engine 11 Rotor + 41 Encased Industrial Beam + 1 Modular Frame | first phrases: он не один, вот и все, нет воды |
| 15 | Steel Pipe `K2` | I-06 (keys) | C6 | `к` `п` | the new keys `к` `п`, typed on their own, hinted and then blind | к п | Constructor: 1 Reinforced Iron Plate → 4 Steel Pipe; engine 7 Stator + 46 Iron Casting + 1 Slag | index top and index home, inner |
| 16 | Solid Steel Ingot `S4` | E-09 (syllables) | C6 |  | syllables typed with `к` `п` `в` `р` `о` `а`, mostly `к` `п` | ко · ка · по | Manufacturer: 1 Steel Pipe + 1 Coal + 1 Iron Ore → 1 Solid Steel Ingot; engine 7 Stator + 47 Iron Casting + 1 Slag | ка ко па по with в р; tin + copper + coal → bronze |
| 17 | Encased Industrial Beam `W5` | E-10 (words) | C6 |  | words about home, things and the railway, typed with 12 letters, mostly `к` `п` | окно · сок · пиво | Foundry: 2 Solid Steel Ingot + 1 Steel Beam → 1 Encased Industrial Beam; engine 8 Stator + 52 Iron Casting + 1 Slag | home and road words leaning on к п: окно, пол, поезд |
| 18 | Modular Frame `P2` | E-11 (phrases, gather) | C6 |  | short phrases typed with 12 letters, mostly `к` `п` | так и так · они пели · он не пил | Packager: 1 Reinforced Iron Plate + 1 Encased Industrial Beam → 1 Modular Frame + 1 Steel Offcuts; engine 9 Stator + 58 Iron Casting | GATHER 1: phrases typed with the first twelve letters |
| 19 | Steel Offcuts `B2` | byproduct of E-11 | C6 | | no lesson of its own: falls out of E-11 beside Modular Frame, 1 a run | | Packager: 1 Reinforced Iron Plate + 1 Encased Industrial Beam → 1 Modular Frame + 1 Steel Offcuts; engine 9 Stator + 58 Iron Casting | |
| 20 | Water (fluid) `R5` | I-07 (mine) | C7 | `м` `д` `.` | the new keys `м` `д` `.`, typed on their own, hinted and then blind | м д . | Water Extractor; price 8 Modular Frame + 11 Encased Industrial Beam + 54 Solid Steel Ingot + 129 Steel Ingot + 135 Coal; engine 103 Caterium Ingot + 9 Spare Wire | index bottom, ring home, and the period on the Slash key: sentences are within reach |
| 21 | Iron Slurry (fluid) `S5` | E-12 (syllables) | C7 |  | syllables typed with `м` `д` `о` `а`, mostly `м` `д` `.` | до · да · мо | Refinery: 2 Water + 1 Iron Ore → 1 Iron Slurry; engine 18 Quickwire + 9 Motor + 1 Iron Scrap | ма мо да до; lead ore + coal → lead |
| 22 | Iron Rebar `W6` | E-13 (words) | C7 |  | words about home, people and time, typed with 14 letters, mostly `м` `д` `.` | мама · солдат · доктор | Refinery: 4 Iron Slurry + 1 Encased Industrial Beam → 1 Iron Rebar; engine 27 Quickwire + 102 Caterium Ingot | home and family words leaning on м д: дом, мама, дети |
| 23 | Rotor `T1` | E-14 (sentences) | C7 |  | plain sentences ending in a period, typed with 14 letters and the marks `.`, mostly `м` `д` `.` | они дома. · все не так. · он сидел и ел. | Foundry: 1 Modular Frame + 1 Iron Rebar → 2 Rotor; engine 35 Quickwire + 13 Motor + 1 Spare Wire | the first sentences, period only |
| 24 | Iron Casting `K3` | I-08 (keys) | C8 | Shift | the Shift key: capitals of every letter opened so far, and the pronoun I | Анна · Иван · Нина | Crusher: 1 Rotor → 4 Iron Casting + 1 Slag; engine 8 Heavy Modular Frame + 56 Caterium Filament + 1 Spare Wire + 1 Motor | capitals of every unlocked letter; a sentence gets its capital |
| 25 | Slag `B3` | byproduct of I-08 | C8 | | no lesson of its own: falls out of I-08 beside Iron Casting, 1 a run | | Crusher: 1 Rotor → 4 Iron Casting + 1 Slag; engine 8 Heavy Modular Frame + 56 Caterium Filament + 1 Spare Wire + 1 Motor | |
| 26 | Stator `T2` | E-15 (sentences) | C8 |  | sentences with capitals and names, typed with 14 letters and the marks `.` | Иван дома. · Анна и Вера в Омске. · Анна (+9 authored lines) | Manufacturer: 1 Rotor + 1 Iron Casting + 1 Reinforced Iron Plate → 1 Stator; engine 8 Heavy Modular Frame + 57 Caterium Filament + 1 Spare Wire + 1 Motor | capitalised sentences and proper names: Анна, Иван, Москва; the first phrases come back as the flux |
| 27 | Caterium Ore `R6` | I-09 (mine) | C9 | `у` `ь` | the new keys `у` `ь`, typed on their own, hinted and then blind | у ь | Caterium Ore Mine; price 22 Stator + 300 Solid Steel Ingot + 135 Coal; engine 103 Quartz Crystal + 11 Radio Control Unit | middle top and index bottom, inner; the soft sign |
| 28 | Caterium Ingot `S6` | E-16 (syllables) | C9 |  | syllables typed with `у` `ь` `о` `а` `е` `н`, mostly `у` `ь` | ну · ун · нь | Manufacturer: 1 Caterium Ore + 1 Iron Ore + 1 Copper Ore → 1 Caterium Ingot; engine 22 Crystal Oscillator + 102 Quartz Crystal | ну ту; нь ть: the soft sign; manganese + coal + iron ore → steel |
| 29 | Quickwire `W7` | E-17 (words) | C9 |  | verbs, typed with 16 letters, mostly `у` `ь` | стать · видеть · есть | Foundry: 2 Caterium Ingot + 1 Iron Rebar → 1 Quickwire; engine 14 Radio Control Unit + 26 Crystal Oscillator + 1 Caterium Filament + 1 Heavy Modular Frame | infinitives and verbs leaning on у ь: делать, думать, спать |
| 30 | Motor `T3` | E-18 (sentences, gather) | C9 |  | plain sentences ending in a period, typed with 16 letters and the marks `.`, mostly `у` `ь` | Мне пора спать. · День идет. · Они пили воду. | Fractionator: 1 Stator + 2 Quickwire → 2 Motor + 3 Spare Wire + 4 Iron Scrap; engine 16 Radio Control Unit + 169 Caterium Filament + 1 Crystal Oscillator | GATHER 2: sentences typed with sixteen letters |
| 31 | Spare Wire `B4` | byproduct of E-18 | C9 | | no lesson of its own: falls out of E-18 beside Motor, 3 a run | | Fractionator: 1 Stator + 2 Quickwire → 2 Motor + 3 Spare Wire + 4 Iron Scrap; engine 16 Radio Control Unit + 169 Caterium Filament + 1 Crystal Oscillator | |
| 32 | Iron Scrap `B5` | byproduct of E-18 | C9 | | no lesson of its own: falls out of E-18 beside Motor, 4 a run | | Fractionator: 1 Stator + 2 Quickwire → 2 Motor + 3 Spare Wire + 4 Iron Scrap; engine 16 Radio Control Unit + 169 Caterium Filament + 1 Crystal Oscillator | |
| 33 | Caterium Filament `K4` | I-10 (keys, hurdle) | C10 | `,` | the new key `,`, typed on its own, hinted and then blind | , | Constructor: 1 Motor → 4 Caterium Filament; engine 10 Control Panel + 70 Silica | the signature hurdle: the period key, shifted |
| 34 | Heavy Modular Frame `T4` | E-19 (sentences) | C10 |  | sentences joined with commas, typed with 16 letters and the marks `.` `,`, mostly `,` | он ел, а она пела. · мама дома, и нам тепло. · кот спит, пес не спит. (+12 authored lines) | Manufacturer: 1 Motor + 1 Caterium Filament + 1 Modular Frame → 1 Heavy Modular Frame; engine 18 Quartz Dust + 10 Control Panel | clauses: он ел, а она пела; two phrases joined by a comma, so the phrase gather is the flux |
| 35 | Raw Quartz `R7` | I-11 (mine) | C11 | `ы` `г` | the new keys `ы` `г`, typed on their own, hinted and then blind | ы г | Raw Quartz Mine; price 24 Heavy Modular Frame + 129 Caterium Ingot + 135 Caterium Ore; engine 103 Black Powder + 12 Nobelisk Detonator | ring home and index top, inner |
| 36 | Quartz Crystal `S7` | E-20 (syllables) | C11 |  | syllables typed with `ы` `г` `о` `а` `и` `т`, mostly `ы` `г` | ты · го · га | Manufacturer: 1 Raw Quartz + 1 Iron Ore + 1 Limestone → 1 Quartz Crystal; engine 22 Nobelisk + 6 Sulfuric Residue + 8 Black Powder | га го ги; ты; limestone + coal + sand → mortar |
| 37 | Crystal Oscillator `W8` | E-21 (words) | C11 |  | words about things, places and nature, typed with 18 letters, mostly `ы` `г` | гора · крыса · снег | Foundry: 2 Quartz Crystal + 1 Quickwire → 1 Crystal Oscillator; engine 27 Nobelisk + 102 Black Powder | plurals in -ы and words leaning on г: горы, ноги, город |
| 38 | Radio Control Unit `T5` | E-22 (sentences) | C11 |  | sentences joined with commas, typed with 18 letters and the marks `.` `,`, mostly `ы` `г` | горы далеко, а мы дома. · книги на столе, тетради в сумке. · мы уснули, они остались. (+8 authored lines) | Foundry: 1 Heavy Modular Frame + 1 Crystal Oscillator → 2 Radio Control Unit; engine 35 Nobelisk + 16 Nobelisk Detonator + 1 Sulfuric Residue | sentences with plurals and clauses |
| 39 | Silica `K5` | I-12 (keys, hurdle) | C12 | `-` `—` | the new keys `-` `—`, typed on their own, hinted and then blind | - — | Crusher: 1 Radio Control Unit → 4 Silica + 1 Quartz Dust; engine 6 Turbine Housing + 55 Pig Iron + 1 Iron Casing | the hyphen on its key and the em dash by the typographic stroke; the glyph is checked, not the stroke |
| 40 | Quartz Dust `B6` | byproduct of I-12 | C12 | | no lesson of its own: falls out of I-12 beside Silica, 1 a run | | Crusher: 1 Radio Control Unit → 4 Silica + 1 Quartz Dust; engine 6 Turbine Housing + 55 Pig Iron + 1 Iron Casing | |
| 41 | Control Panel `T6` | E-23 (sentences) | C12 |  | sentences with dashes, typed with 18 letters and the marks `.` `,` `-` `—`, mostly `-` `—` | Дон — река. · Труд — основа всего. · Мы — дома, они — в пути. (+26 authored lines) | Manufacturer: 1 Radio Control Unit + 1 Silica + 1 Iron Rebar → 1 Control Panel; engine 72 Compacted Coal + 6 Turbine Housing + 2 Pig Iron | тире between the halves, дефис inside words: мама — доктор; кто-то; the home and family nouns are the flux |
| 42 | Sulfur `R8` | I-13 (mine) | C13 | `б` `я` | the new keys `б` `я`, typed on their own, hinted and then blind | б я | Sulfur Mine; price 29 Control Panel + 129 Quartz Crystal + 135 Raw Quartz; engine 11 Fuel Generator + 73 Pig Iron + 1 Turbine Housing | middle bottom and pinky bottom |
| 43 | Black Powder `S8` | E-24 (syllables) | C13 |  | syllables typed with `б` `я` `в` `р` `о` `а`, mostly `б` `я` | ря · вя · бо | Manufacturer: 1 Sulfur + 1 Coal + 1 Iron Ore → 1 Black Powder; engine 12 Fuel Generator + 9 Turbine Housing + 1 Iron Casing | ба бо бя; вя ря; zinc + copper ore + coal → brass |
| 44 | Nobelisk `W9` | E-25 (words) | C13 |  | verbs and words about people and life, typed with 20 letters, mostly `б` `я` | быть · стоять · работать | Assembler: 2 Black Powder + 1 Crystal Oscillator → 1 Nobelisk; engine 14 Fuel Generator + 24 Iron Casing + 1 Turbine Housing | people and the past leaning on б я: я, был, была, брат, ребята |
| 45 | Nobelisk Detonator `T7` | E-26 (sentences, gather) | C13 |  | sentences in the past tense, typed with 20 letters and the marks `.` `,` `-` `—`, mostly `б` `я` | Я был дома. · Она была одна. · Мы были в лесу. (+9 authored lines) | Packager: 1 Control Panel + 1 Nobelisk → 2 Nobelisk Detonator + 1 Sulfuric Residue; engine 15 Fuel Generator + 34 Iron Casing + 1 Turbine Housing | GATHER 3: the past tense: я был дома. она была одна. |
| 46 | Sulfuric Residue `B7` | byproduct of E-26 | C13 | | no lesson of its own: falls out of E-26 beside Nobelisk Detonator, 1 a run | | Packager: 1 Control Panel + 1 Nobelisk → 2 Nobelisk Detonator + 1 Sulfuric Residue; engine 15 Fuel Generator + 34 Iron Casing + 1 Turbine Housing | |
| 47 | Compacted Coal `K6` | I-14 (keys) | C14 | `з` `й` | the new keys `з` `й`, typed on their own, hinted and then blind | з й | Constructor: 1 Nobelisk Detonator → 4 Compacted Coal; engine 5 Computer + 12 Polymer Resin + 1 Petroleum Coke | both pinky top |
| 48 | Pig Iron `S9` | E-27 (syllables) | C14 |  | syllables typed with `з` `й` `о` `а` `и` `т`, mostly `з` `й` | зо · за · зи | Manufacturer: 1 Compacted Coal + 1 Iron Ore + 1 Limestone → 1 Pig Iron; engine 55 Polymer Composite + 16 Circuit Board | за зо зи; ай ой ий |
| 49 | Iron Casing `W10` | E-28 (words) | C14 |  | adjectives and words about things and places, typed with 22 letters, mostly `з` `й` | завод · зал · красивый | Assembler: 2 Pig Iron + 1 Nobelisk → 1 Iron Casing; engine 77 Plastic + 19 Heavy Oil Residue + 1 Polymer Resin | adjectives and possessives leaning on з й: мой, твой, злой, зима |
| 50 | Turbine Housing `T8` | E-29 (sentences) | C14 |  | plain sentences ending in a period, typed with 22 letters and the marks `.` `,` `-` `—`, mostly `з` `й` | Твой брат знает. · Зима была долгой. · Злой пес не спит. | Assembler: 1 Nobelisk Detonator + 1 Iron Casing → 1 Turbine Housing; engine 24 Circuit Board + 19 Polymer Resin + 1 Computer | sentences with adjectives |
| 51 | Crude Oil (fluid) `R9` | I-15 (mine) | C15 | `?` `!` | the new keys `?` `!`, typed on their own, hinted and then blind | ? ! | Crude Oil Extractor; price 55 Pig Iron + 6 Turbine Housing + 11 Iron Casing + 129 Black Powder + 135 Sulfur; engine 12 Supercomputer + 31 Circuit Board + 1 Polymer Resin | the number row, shifted: questions and exclamations |
| 52 | Fuel Generator `T9` | E-30 (sentences) | C15 |  | questions and exclamations, typed with 22 letters and the marks `.` `,` `-` `—` `?` `!`, mostly `?` `!` | Кто там? · Ты готов? · Где мы? (+15 authored lines) | Blender: 1 Turbine Housing + 2 Crude Oil + 1 Wire → 2 Fuel Generator; engine 13 Supercomputer + 27 Polymer Resin | кто там? ты готов? вот беда! The question words are little words, so E-05 is the flux |
| 53 | Plastic `K7` | I-16 (keys) | C16 | `ч` `ш` | the new keys `ч` `ш`, typed on their own, hinted and then blind | ч ш | Crusher: 1 Fuel Generator → 4 Plastic + 1 Heavy Oil Residue; engine 6 Heat Sink + 49 Aluminum Ingot + 1 Alclad Aluminum Sheet | ring bottom and middle top |
| 54 | Heavy Oil Residue `B8` | byproduct of I-16 | C16 | | no lesson of its own: falls out of I-16 beside Plastic, 1 a run | | Crusher: 1 Fuel Generator → 4 Plastic + 1 Heavy Oil Residue; engine 6 Heat Sink + 49 Aluminum Ingot + 1 Alclad Aluminum Sheet | |
| 55 | Polymer Composite `S10` | E-31 (syllables) | C16 |  | syllables typed with `ч` `ш` `о` `а` `и` `т`, mostly `ч` `ш` | ча · чи · ша | Manufacturer: 1 Plastic + 1 Iron Ore + 1 Limestone → 1 Polymer Composite; engine 65 Aluminum Scrap + 6 Heat Sink + 2 Aluminum Ingot + 1 Alclad Aluminum Sheet | ча чи ша ши; что |
| 56 | Circuit Board `W11` | E-32 (words) | C16 |  | verbs and words about time and life, typed with 24 letters, mostly `ч` `ш` | мочь · слушать · читать | Assembler: 2 Polymer Composite + 1 Iron Casing → 1 Circuit Board; engine 7 Heat Sink + 19 Alclad Aluminum Sheet + 2 Aluminum Ingot | time and doing words leaning on ч ш: час, ночь, читать, шесть |
| 57 | Computer `T10` | E-33 (sentences, gather) | C16 |  | questions and exclamations, typed with 24 letters and the marks `.` `,` `-` `—` `?` `!`, mostly `ч` `ш` | Что ты делаешь? · Почему ты молчишь? · Что ты читаешь? (+14 authored lines) | Fractionator: 1 Fuel Generator + 2 Circuit Board → 1 Computer + 3 Polymer Resin + 4 Petroleum Coke; engine 25 Alclad Aluminum Sheet + 9 Heat Sink | GATHER 4: questions with что, почему, куда |
| 58 | Polymer Resin `B9` | byproduct of E-33 | C16 | | no lesson of its own: falls out of E-33 beside Computer, 3 a run | | Fractionator: 1 Fuel Generator + 2 Circuit Board → 1 Computer + 3 Polymer Resin + 4 Petroleum Coke; engine 25 Alclad Aluminum Sheet + 9 Heat Sink | |
| 59 | Petroleum Coke `B10` | byproduct of E-33 | C16 | | no lesson of its own: falls out of E-33 beside Computer, 4 a run | | Fractionator: 1 Fuel Generator + 2 Circuit Board → 1 Computer + 3 Polymer Resin + 4 Petroleum Coke; engine 25 Alclad Aluminum Sheet + 9 Heat Sink | |
| 60 | Bauxite `R10` | I-17 (mine, hurdle) | C17 | `"` `«` `»` | the new keys `"` `«` `»`, typed on their own, hinted and then blind | " « » | Bauxite Mine; price 6 Computer + 23 Circuit Board + 65 Polymer Composite + 300 Pig Iron + 135 Sulfur; engine 103 Encased Uranium Cell + 17 Electromagnetic Control Rod | straight quotes on the number row; guillemets by the typographic stroke |
| 61 | Supercomputer `T11` | E-34 (sentences) | C17 |  | dialogue in quotation marks, typed with 24 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»`, mostly `"` `«` `»` | «Иди домой!» — сказал он. · «Кто там?» — спросила она. · «Я готов», — ответил брат. (+22 authored lines) | Fabricator: 1 Computer + 1 Bauxite + 1 Nobelisk → 2 Supercomputer; engine 11 Cooling System + 6 Concrete | dialogue: «Иди домой!» — сказал он. The people and past-tense words are the flux |
| 62 | Aluminum Scrap `K8` | I-18 (keys) | C18 | `ж` `х` | the new keys `ж` `х`, typed on their own, hinted and then blind | ж х | Constructor: 1 Supercomputer → 4 Aluminum Scrap; engine 8 Reactor Assembly + 52 Uranium Fuel Rod + 1 Uranium Waste | both pinky: home and top |
| 63 | Aluminum Ingot `S11` | E-35 (syllables) | C18 |  | syllables typed with `ж` `х` `о` `а` `е` `н`, mostly `ж` `х` | жа · же · ха | Fabricator: 1 Aluminum Scrap + 1 Iron Ore + 1 Copper Ore → 1 Aluminum Ingot; engine 8 Reactor Assembly + 22 Electromagnetic Control Rod + 1 Uranium Fuel Rod | жа же жо; ха хо хе |
| 64 | Alclad Aluminum Sheet `W12` | E-36 (words) | C18 |  | adjectives and words about life and home, typed with 26 letters, mostly `ж` `х` | хлеб · ложка · нож | Assembler: 2 Aluminum Ingot + 1 Circuit Board → 1 Alclad Aluminum Sheet; engine 9 Reactor Assembly + 61 Uranium Fuel Rod + 1 Uranium Waste | life words leaning on ж х: жизнь, уже, можно, хорошо, хлеб |
| 65 | Heat Sink `T12` | E-37 (sentences) | C18 |  | sentences joined with commas, typed with 26 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»`, mostly `ж` `х` | Уже поздно, иди спать. · Мужчина вошел, а дети вышли. · Нужно много угля, а дров мало. (+12 authored lines) | Assembler: 1 Supercomputer + 1 Alclad Aluminum Sheet → 1 Heat Sink; engine 10 Reactor Assembly + 35 Electromagnetic Control Rod | sentences with ж х: хорошо, что ты здесь. |
| 66 | Uranium `R11` | I-19 (mine) | C19 | `ц` `э` | the new keys `ц` `э`, typed on their own, hinted and then blind | ц э | Uranium Mine; price 25 Alclad Aluminum Sheet + 9 Heat Sink + 65 Aluminum Ingot + 300 Polymer Composite + 135 Bauxite; engine 10 Fused Modular Frame + 9 Turbo Motor + 1 Reactor Assembly | ring top and pinky home |
| 67 | Encased Uranium Cell `S12` | E-38 (syllables) | C19 |  | syllables typed with `ц` `э` `о` `а` `и` `т`, mostly `ц` `э` | ца · ци · то | Fabricator: 1 Uranium + 1 Iron Ore + 1 Limestone → 1 Encased Uranium Cell; engine 11 Fused Modular Frame + 10 Turbo Motor + 8 Uranium Fuel Rod + 1 Uranium Waste | ца цо ци; эт; clay + coal + sand → stoneware |
| 68 | Electromagnetic Control Rod `W13` | E-39 (words) | C19 |  | words about things, people and places, typed with 28 letters, mostly `ц` `э` | отец · лицо · поэт | Assembler: 2 Encased Uranium Cell + 1 Alclad Aluminum Sheet → 1 Electromagnetic Control Rod; engine 11 Turbo Motor + 13 Fused Modular Frame | things leaning on ц э: это, цвет, улица, отец, центр |
| 69 | Cooling System `T13` | E-40 (sentences, gather) | C19 |  | sentences with every mark so far, typed with 28 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»`, mostly `ц` `э` | Это мой дом, а это — твой. · В центре города — музей. · Отец читает, мать шьет. (+12 authored lines) | Packager: 1 Heat Sink + 1 Electromagnetic Control Rod → 2 Cooling System + 1 Concrete; engine 169 Uranium Fuel Rod + 42 Uranium Waste + 1 Turbo Motor | GATHER 5: every mark so far in one pool: comma, question, capitals, dash, quotes |
| 70 | Concrete `B11` | byproduct of E-40 | C19 | | no lesson of its own: falls out of E-40 beside Cooling System, 1 a run | | Packager: 1 Heat Sink + 1 Electromagnetic Control Rod → 2 Cooling System + 1 Concrete; engine 169 Uranium Fuel Rod + 42 Uranium Waste + 1 Turbo Motor | |
| 71 | Uranium Fuel Rod `K9` | I-20 (keys) | C20 | `:` `;` `(` `)` | the new keys `:` `;` `(` `)`, typed on their own, hinted and then blind | : ; ( ) | Crusher: 1 Cooling System → 4 Uranium Fuel Rod + 1 Uranium Waste; engine 43 Magnetic Core + 3 Assembly Director System | the rest of the number row: lists and asides |
| 72 | Uranium Waste `B12` | byproduct of I-20 | C20 | | no lesson of its own: falls out of I-20 beside Uranium Fuel Rod, 1 a run | | Crusher: 1 Cooling System → 4 Uranium Fuel Rod + 1 Uranium Waste; engine 43 Magnetic Core + 3 Assembly Director System | |
| 73 | Reactor Assembly `T14` | E-41 (sentences) | C20 |  | lists and asides with colons, semicolons and brackets, typed with 28 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»` `:` `;` `(` `)`, mostly `:` `;` `(` `)` | Вот что нужно: хлеб, соль, вода. · День прошел; настала ночь. · Система проста (почти). (+21 authored lines) | Fabricator: 1 Cooling System + 1 Uranium Fuel Rod + 1 Crystal Oscillator → 1 Reactor Assembly; engine 11 Iron Filings + 8 Copper Powder + 3 Battery | вот что нужно: хлеб, соль, вода. система проста (почти). Lists are of things, so the things words are the flux |
| 74 | Nitrogen Gas (fluid) `R12` | I-21 (mine) | C21 | `ю` `ф` | the new keys `ю` `ф`, typed on their own, hinted and then blind | ю ф | Nitrogen Gas Extractor; price 29 Reactor Assembly + 129 Encased Uranium Cell + 135 Uranium; engine 6 SAM Fluctuator + 49 Magnetic Core | ring bottom and pinky home |
| 75 | Nitric Acid (fluid) `S13` | E-42 (syllables) | C21 |  | syllables typed with `ю` `ф` `в` `р` `о` `а`, mostly `ю` `ф` | рю · фа · фо | Blender: 2 Nitrogen Gas + 1 Coal + 1 Iron Ore → 1 Nitric Acid; engine 9 SAM Fluctuator + 15 Copper Powder + 1 Assembly Director System | ю after consonants: вю рю; фа фо; nickel + copper ore + coal → cupronickel |
| 76 | Fused Modular Frame `W14` | E-43 (words) | C21 |  | words about work, things and life, typed with 30 letters, mostly `ю` `ф` | ключ · юла · плюс | Refinery: 4 Nitric Acid + 1 Electromagnetic Control Rod → 1 Fused Modular Frame; engine 11 SAM Fluctuator + 25 Magnetic Field Generator + 1 Copper Powder | work words leaning on ю ф: люди, фильм, кофе, фабрика |
| 77 | Turbo Motor `T15` | E-44 (sentences) | C21 |  | sentences with every mark so far, typed with 30 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»` `:` `;` `(` `)`, mostly `ю` `ф` | Я люблю кофе. · В июле жара. · Люди ждут поезда. (+12 authored lines) | Assembler: 1 Reactor Assembly + 1 Fused Modular Frame → 2 Turbo Motor; engine 13 SAM Fluctuator + 34 Magnetic Field Generator + 1 Copper Powder | sentences with ю ф: я люблю кофе. |
| 78 | Battery `K10` | I-22 (keys) | C22 | `щ` `ё` `ъ` | the new keys `щ` `ё` `ъ`, typed on their own, hinted and then blind | щ ё ъ | Constructor: 1 Turbo Motor → 4 Battery; engine 5 Ballistic Warp Drive + 8 Alien Power Matrix | the rare tail: ring top, the corner key, pinky top |
| 79 | Magnetic Core `S14` | E-45 (syllables) | C22 |  | syllables typed with `щ` `ё` `ъ` `в` `р` `о` `а`, mostly `щ` `ё` `ъ` | ща · ща · ро (+12 authored lines) | Fabricator: 1 Battery + 1 Coal + 1 Iron Ore → 1 Magnetic Core; engine 66 Reanimated SAM + 5 Ballistic Warp Drive + 1 Alien Power Matrix | ща щу; вё рё; gold + copper ore + coal → red gold |
| 80 | Magnetic Field Generator `W15` | E-46 (words) | C22 |  | words about life, things and nature, typed with 33 letters, mostly `щ` `ё` `ъ` | ёлка · роща · чаща (+25 authored lines) | Assembler: 2 Magnetic Core + 1 Fused Modular Frame → 1 Magnetic Field Generator; engine 6 Ballistic Warp Drive + 9 Alien Power Matrix | the tail in words: ещё, вещь, объект, ёлка, всё |
| 81 | Assembly Director System `T16` | E-47 (sentences, gather) | C22 |  | sentences with every mark so far, typed with 33 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»` `:` `;` `(` `)`, mostly `щ` `ё` `ъ` | Всё своё ношу с собой. · Ещё чуть-чуть, и мы дома. · Щи да каша — пища наша. (+12 authored lines) | Fractionator: 1 Turbo Motor + 2 Magnetic Field Generator → 1 Assembly Director System + 3 Copper Powder + 4 Iron Filings; engine 7 Ballistic Warp Drive + 86 Reanimated SAM | GATHER 6: every letter of the alphabet |
| 82 | Copper Powder `B13` | byproduct of E-47 | C22 | | no lesson of its own: falls out of E-47 beside Assembly Director System, 3 a run | | Fractionator: 1 Turbo Motor + 2 Magnetic Field Generator → 1 Assembly Director System + 3 Copper Powder + 4 Iron Filings; engine 7 Ballistic Warp Drive + 86 Reanimated SAM | |
| 83 | Iron Filings `B14` | byproduct of E-47 | C22 | | no lesson of its own: falls out of E-47 beside Assembly Director System, 4 a run | | Fractionator: 1 Turbo Motor + 2 Magnetic Field Generator → 1 Assembly Director System + 3 Copper Powder + 4 Iron Filings; engine 7 Ballistic Warp Drive + 86 Reanimated SAM | |
| 84 | Gazette I `G1` | P-lore-1 (page) | C22 |  | a page of lore (the machines talking), grade 1 | Плавильня не спит. Она ест руду и отдаёт бронзу, и так весь день. | Assembler: 1 Control Panel + 1 Copper Powder → 1 Gazette I; no engine priced | plain sentences; the machines talk |
| 85 | Letter I `G2` | P-let-1 (page) | C22 |  | a page of letters and correspondence, grade 1 | Дорогая Анна! Пишу тебе из Омска. Здесь холодно, но работа идёт. Целую, Иван. | Assembler: 1 Fuel Generator + 1 Iron Filings → 1 Letter I; no engine priced | a short letter: greeting, plain sentences, a name |
| 86 | SAM Ore `R13` | I-23 (mine) | C23 | `1` `2` `3` `4` `5` | the new keys `1` `2` `3` `4` `5`, typed on their own, hinted and then blind | 1 2 3 4 5 | SAM Ore Mine; price 1 Letter I + 1 Gazette I + 4 Magnetic Field Generator + 24 Magnetic Core + 1 Assembly Director System + 300 Encased Uranium Cell + 135 Uranium; engine 3 Gazette III + 2 Almanac II + 1 Script II | the left half of the number row |
| 87 | SAM Fluctuator `T17` | E-48 (sentences) | C23 |  | sentences with numbers, typed with 33 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»` `:` `;` `(` `)` and the digits 12345, mostly `1` `2` `3` `4` `5` | В классе 25 человек. · Поезд в 5 часов 15 минут. · Нам нужно 3 тонны угля и 2 тонны кварца. (+21 authored lines) | Fabricator: 1 Assembly Director System + 1 SAM Ore + 1 Circuit Board → 2 SAM Fluctuator; engine 2 Script II + 2 Almanac II + 1 Gazette III + 1 Ballistic Warp Drive | counts and times: в классе 25 человек. поезд в 5 часов. The time words are the flux |
| 88 | Book I `G3` | P-lit-1 (page) | C23 |  | a page of famous literature, grade 1 | Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему. (Толстой) | Workshop: 1 Cooling System + 1 Uranium Waste → 1 Book I; no engine priced | plain classic prose |
| 89 | Almanac I `G4` | P-triv-1 (page) | C23 |  | a page of fun trivia, grade 1 | У осьминога три сердца, а кровь у него голубая. | Workshop: 1 Turbo Motor + 1 Concrete → 1 Almanac I; no engine priced | facts in plain sentences, numbers spelled out |
| 90 | Gazette II `G5` | P-lore-2 (page) | C23 |  | a page of lore (the machines talking), grade 2 | Говорят, что кран однажды поднял сам себя. Это, конечно, шутка; но с тех пор его табличка гласит: «Не проверять!» | Workshop: 1 SAM Fluctuator + 1 Heavy Oil Residue → 1 Gazette II; no engine priced | longer, a joke, a colon |
| 91 | Reanimated SAM `K11` | I-24 (keys) | C24 | `6` `7` `8` `9` `0` `№` | the new keys `6` `7` `8` `9` `0` `№`, typed on their own, hinted and then blind | 6 7 8 9 0 № | Constructor: 1 SAM Fluctuator → 4 Reanimated SAM; engine 3 Blueprint I + 2 Book III + 1 Letter III | the right half, and the numero sign |
| 92 | Alien Power Matrix `T18` | E-49 (full) | C24 |  | full sentences with dates, prices and numbers, typed with 33 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»` `:` `;` `(` `)` `№` and the digits 1234567890, mostly `6` `7` `8` `9` `0` `№` | В 1867 году здесь построили завод. · Цена — 90 рублей. · Дом № 7, квартира 108. (+21 authored lines) | Workshop: 1 SAM Fluctuator + 1 Reanimated SAM → 1 Alien Power Matrix; engine 3 Letter III + 2 Book III + 1 Blueprint I | full sentences at last: dates, prices, numbers of things: в 1867 году. дом № 7. |
| 93 | Ballistic Warp Drive `T19` | E-50 (full, gather) | C24 |  | full sentences using the whole keyboard, typed with 33 letters and the marks `.` `,` `-` `—` `?` `!` `"` `«` `»` `:` `;` `(` `)` `№` and the digits 1234567890, mostly `6` `7` `8` `9` `0` `№` | В 1799 году родился Пушкин — и русский язык изменился. · Дом № 7 (у реки) продан за 1 250 000 рублей; хозяин доволен. · Инженер пишет: «Система проста (почти)». Вход: руда; выход: страницы. (+4 authored lines) | Fabricator: 1 Alien Power Matrix + 1 Magnetic Field Generator + 1 Reactor Assembly → 1 Ballistic Warp Drive; engine 3 Blueprint I + 3 Book III + 1 Letter III | GATHER 7: the keyboard is complete; every core key in one pool |
| 94 | Book II `G6` | P-lit-2 (page) | C24 |  | a page of famous literature, grade 2 | Я помню чудное мгновенье: передо мной явилась ты, как мимолётное виденье, как гений чистой красоты. (Пушкин) | Workshop: 1 Ballistic Warp Drive + 1 Polymer Resin → 1 Book II; no engine priced | verse: commas, capitals at line starts |
| 95 | Letter II `G7` | P-let-2 (page) | C24 |  | a page of letters and correspondence, grade 2 | Уважаемый Пётр Ильич! Благодарю за письмо от 12 мая. Отвечаю по пунктам: 1) да; 2) нет; 3) обсудим при встрече. | Workshop: 1 SAM Fluctuator + 1 Petroleum Coke → 1 Letter II; no engine priced | a formal letter with numbered points (digits 1-5) |
| 96 | Script I `G8` | P-dia-1 (page) | C24 |  | a page of dialogue and theatre, grade 1 | — Кто там? — Это я, почтальон Печкин. — Что принесли? — Журнал «Мурзилка». | Workshop: 1 Supercomputer + 1 Sulfuric Residue → 1 Script I; no engine priced | dialogue: dashes and guillemets |
| 97 | Almanac II `G9` | P-triv-2 (page) | C25 |  | a page of fun trivia, grade 2 | Байкал — самое глубокое озеро на Земле: 1642 метра. В нём пятая часть пресной воды планеты. | Workshop: 1 Ballistic Warp Drive + 1 Quartz Dust → 1 Almanac II; no engine priced | digit-dense facts: the charter, the digits gather, is the flux |
| 98 | Script II `G10` | P-dia-2 (page) | C25 |  | a page of dialogue and theatre, grade 2 | Городничий. Я пригласил вас, господа, с тем, чтобы сообщить вам пренеприятное известие: к нам едет ревизор. (Гоголь) | Workshop: 1 Ballistic Warp Drive + 1 Spare Wire → 1 Script II; no engine priced | a scene from a play |
| 99 | Gazette III `G11` | P-lore-3 (page) | C25 |  | a page of lore (the machines talking), grade 3 | Экзамен на фронтире один: собери машину, запусти её (в 6:00) и уйди спать. Если утром она работает — ты мастер. | Workshop: 1 Alien Power Matrix + 1 Iron Scrap → 1 Gazette III; no engine priced | the frontier exam: brackets, a time |
| 100 | Blueprint I `G12` | P-tech-1 (page) | C26 |  | a page of mathematical and technical writing, grade 1 | Скорость — это путь, делённый на время. Если путь 120 км, а время 2 часа, скорость равна 60 км в час. | Workshop: 1 Ballistic Warp Drive + 1 Slag → 1 Blueprint I; no engine priced | a worked speed problem in words and digits |
| 101 | Book III `G13` | P-lit-3 (page) | C26 |  | a page of famous literature, grade 3 | Мороз и солнце; день чудесный! Ещё ты дремлешь, друг прелестный — пора, красавица, проснись. (Пушкин) | Fitting Shop: 1 Ballistic Warp Drive + 1 Steel Offcuts → 1 Book III; no engine priced | verse with semicolons and exclamations |
| 102 | Letter III `G14` | P-let-3 (page) | C26 |  | a page of letters and correspondence, grade 3 | Здравствуйте! Заказ № 4085 (3 позиции; 12 700 руб.) отправлен 8 июня; трек-номер — в приложении. С уважением, склад. | Fitting Shop: 1 Ballistic Warp Drive + 1 Screw → 1 Letter III; no engine priced | an order: №, prices, dates |
| 103 | Script III `G15` | P-dia-3 (page) | C27 |  | a page of dialogue and theatre, grade 3 | — Отчего люди не летают? — сказала Катерина. — Я говорю: отчего люди не летают так, как птицы? (Островский) | Fitting Shop: 1 Ballistic Warp Drive + 1 Copper Powder → 1 Script III; no engine priced | nested quotation inside speech |
| 104 | Blueprint II `G16` | P-tech-2 (page) | C27 |  | a page of mathematical and technical writing, grade 2 | Площадь круга: пи умножить на квадрат радиуса. При радиусе 3 (см) площадь около 28,3 (кв. см). | Fitting Shop: 1 Ballistic Warp Drive + 1 Iron Filings → 1 Blueprint II; no engine priced | geometry with brackets and decimals |
| 105 | Almanac III `G17` | P-triv-3 (page) | C27 |  | a page of fun trivia, grade 3 | Транссибирская магистраль — 9289 км, 87 городов, 8 часовых поясов; поезд № 1 идёт 6 дней. | Fitting Shop: 1 Ballistic Warp Drive + 1 Uranium Waste → 1 Almanac III; no engine priced | the railway in numbers |
| 106 | Blueprint III `G18` | P-tech-3 (page) | C28 |  | a page of mathematical and technical writing, grade 3 | Алгоритм: 1) прочитать число; 2) если оно чётное — разделить на 2, иначе умножить на 3 и прибавить 1; 3) повторять, пока не получится 1. | Fitting Shop: 1 Ballistic Warp Drive + 1 Concrete → 1 Blueprint III; no engine priced | an algorithm: numbered steps, conditions |
| 107 | Power Shard `K12` | X-01 (keys, extended) | C28 | `%` `*` `+` `=` | the new keys `%` `*` `+` `=`, typed on their own, hinted and then blind | % * + = | Constructor: 1 SAM Ore → 4 Power Shard; engine 300 Excited Photonic Matter + 300 Superposition Oscillator | arithmetic marks; opens after tech 2 |
| 108 | Superposition Oscillator `K13` | X-02 (keys, extended) | C29 | `/` `\` `[` `]` `{` `}` `<` `>` | the new keys `/` `\` `[` `]` `{` `}` `<` `>`, typed on their own, hinted and then blind | / \ [ ] { } < > | Constructor: 1 SAM Ore → 4 Superposition Oscillator; engine 4 Program Listing + 300 Excited Photonic Matter | brackets and slashes (the / and [ ] caps carry letters in ЙЦУКЕН; these are the Latin-layer strokes) |
| 109 | Formula Sheet `G19` | PX-math (page) | C29 |  | a page of mathematical and technical writing, grade 4 | Формула: (х + у) * (х - у) = х^2 - у^2; при х = 7, у = 3 получаем 40 (100% верно). | Fabricator: 1 Ballistic Warp Drive + 1 Power Shard + 1 Heavy Oil Residue → 1 Formula Sheet; no engine priced | extended: formulas |
| 110 | Excited Photonic Matter `K14` | X-03 (keys, extended) | C30 | `@` `#` `$` `&` `^` `~` `\|` `_` `` ` `` | the new keys `@` `#` `$` `&` `^` `~` `\|` `_` `` ` ``, typed on their own, hinted and then blind | @ # $ & ^ ~ \| _ \` | Constructor: 1 SAM Ore → 4 Excited Photonic Matter; no engine priced | the code symbols |
| 111 | Program Listing `G20` | PX-code (page) | C31 |  | a page of mathematical and technical writing, grade 4 | если (число % 2 === 0) { печать(\`${число} чётное\`); } иначе { печать(\`нечётное\`); } // числа: 0..10 | Fabricator: 1 Ballistic Warp Drive + 1 Superposition Oscillator + 1 Excited Photonic Matter → 1 Program Listing; no engine priced | extended: a page of code |

## Time at every lesson

Design columns are the game-charged replay at a flat 30 WPM unless named otherwise: items typed by hand over the whole game, keystrokes, minutes, the minutes of the single purchase that asks most of it (and which), how many purchases reach it, the columns it is typed in, and the column its engine is bought. Flags are the plan's caps (rule A12 and the builder's checks): an introduction five to ten minutes, a lesson at least three and at most sixty, no purchase over fifteen at one lesson.

| lesson | makes | col | kind | items | keystrokes | min, game flat | min, ramp | min, as priced | biggest purchase | purchases | typed in | engine | bot 20 h | flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| I-01 | Iron Ore | C1 | mine | 572 | 572 | 3.8 | 9.5 | 23.3 | 1.2 (build M1, C2) | 4 | C2 C3 | C3 | 0.12 |  |
| I-02 | Copper Ore | C2 | mine | 536 | 536 | 3.6 | 8.2 | 14.3 | 1.9 (mine I-03, C3) | 4 | C3 C4 | C4 | 0.13 |  |
| E-01 | Copper Ingot | C2 | syllables | 457 | 1372 | 9.1 | 20.2 | 9.1 | 2.9 (mine I-03, C3) | 5 | C3 C4 | C4 | 0.26 |  |
| I-03 | Limestone | C3 | mine | 1237 | 1237 | 8.2 | 16.8 | 33.0 | 2.6 (build M2, C4) | 7 | C3 C4 C5 | C5 | 0.23 |  |
| E-02 | Iron Ingot | C3 | syllables | 574 | 1722 | 11.5 | 23.6 | 11.5 | 4.1 (build M2, C4) | 5 | C3 C4 C5 | C5 | 0.34 |  |
| E-03 | Copper Sheet | C3 | words | 243 | 1457 | 9.7 | 19.9 | 10.5 | 2.4 (build M3, C4) | 8 | C3 C4 C5 | C5 | 0.38 |  |
| I-04 | Iron Rod + Screw | C4 | keys | 393 | 1572 | 10.5 | 21.0 | 10.5 | 2.8 (build M4, C6) | 9 | C4 C5 C6 | C6 | 0.43 | intro 10.5 min (five to ten) |
| E-04 | Iron Plate | C4 | words | 281 | 1686 | 11.2 | 22.5 | 12.2 | 4.5 (auto E-03, C5) | 7 | C4 C5 C6 | C6 | 1.29 |  |
| E-05 | Wire | C4 | words | 282 | 1694 | 11.3 | 22.6 | 12.2 | 2.5 (build M4, C6) | 10 | C4 C5 C6 | C6 | 0.65 |  |
| I-05 | Coal | C5 | mine | 1478 | 1478 | 9.9 | 19.7 | 39.4 | 2.7 (mine I-07, C7) | 11 | C5 C6 C7 | C7 | 0.38 |  |
| E-06 | Steel Ingot | C5 | syllables | 636 | 1908 | 12.7 | 25.4 | 12.7 | 3.3 (mine I-07, C7) | 11 | C5 C6 C7 | C7 | 0.40 |  |
| E-07 | Steel Beam | C5 | words | 221 | 1326 | 8.8 | 17.7 | 9.6 | 2.0 (build M5, C6) | 11 | C5 C6 C7 | C7 | 1.31 |  |
| E-08 | Reinforced Iron Plate | C5 | phrases | 280 | 3357 | 22.4 | 44.8 | 22.4 | 4.9 (build M4, C6) | 13 | C5 C6 C7 | C7 | 1.53 |  |
| I-06 | Steel Pipe | C6 | keys | 281 | 1125 | 7.5 | 14.9 | 7.5 | 2.1 (build M6, C7) | 10 | C6 C7 C8 | C8 | 0.45 |  |
| E-09 | Solid Steel Ingot | C6 | syllables | 496 | 1487 | 9.9 | 19.3 | 9.9 | 2.1 (auto E-08, C7) | 11 | C6 C7 C8 | C8 | 0.90 |  |
| E-10 | Encased Industrial Beam | C6 | words | 244 | 1463 | 9.8 | 18.6 | 10.6 | 2.1 (auto E-08, C7) | 12 | C6 C7 C8 | C8 | 1.22 |  |
| E-11 (gather) | Modular Frame + Steel Offcuts | C6 | phrases | 112 | 1347 | 9.0 | 16.7 | 9.0 | 1.0 (auto E-11, C8) | 13 | C6 C7 C8 | C8 | 0.41 |  |
| I-07 | Water | C7 | mine | 1000 | 1000 | 6.7 | 11.9 | 26.7 | 0.8 (auto E-07, C7) | 11 | C7 C8 C9 | C9 | 0.17 |  |
| E-12 | Iron Slurry | C7 | syllables | 622 | 1866 | 12.4 | 21.9 | 12.4 | 2.4 (auto E-12, C9) | 12 | C7 C8 C9 | C9 | 0.25 |  |
| E-13 | Iron Rebar | C7 | words | 182 | 1095 | 7.3 | 12.8 | 7.9 | 1.2 (auto E-12, C9) | 13 | C7 C8 C9 | C9 | 0.79 |  |
| E-14 | Rotor | C7 | sentences | 100 | 2606 | 17.4 | 30.1 | 17.4 | 2.4 (mine I-09, C9) | 13 | C7 C8 C9 | C9 | 0.50 |  |
| I-08 | Iron Casting + Slag | C8 | keys | 79 | 316 | 2.1 | 3.5 | 2.1 | 0.4 (auto E-11, C8) | 10 | C8 C9 C10 | C10 | 0.04 |  |
| E-15 | Stator | C8 | sentences | 112 | 2922 | 19.5 | 32.5 | 19.5 | 3.8 (mine I-09, C9) | 11 | C8 C9 C10 | C10 | 0.45 |  |
| I-09 | Caterium Ore | C9 | mine | 875 | 875 | 5.8 | 9.7 | 23.3 | 2.2 (mine I-11, C11) | 8 | C9 C10 C11 | C11 | 0.19 |  |
| E-16 | Caterium Ingot | C9 | syllables | 784 | 2353 | 15.7 | 26.1 | 15.7 | 3.8 (mine I-11, C11) | 9 | C9 C10 C11 | C11 | 0.51 |  |
| E-17 | Quickwire | C9 | words | 268 | 1610 | 10.7 | 17.9 | 11.6 | 1.9 (auto E-14, C9) | 10 | C9 C10 C11 | C11 | 0.36 |  |
| E-18 (gather) | Motor + Spare Wire + Iron Scrap | C9 | sentences | 90 | 2342 | 15.6 | 26.0 | 15.6 | 4.5 (auto E-18, C11) | 9 | C9 C10 C11 | C11 | 0.42 |  |
| I-10 | Caterium Filament | C10 | keys | 90 | 360 | 2.4 | 4.0 | 2.4 | 1.2 (auto E-18, C11) | 7 | C10 C11 C12 | C12 | 0.05 |  |
| E-19 | Heavy Modular Frame | C10 | sentences | 92 | 2386 | 15.9 | 25.3 | 15.9 | 4.2 (mine I-11, C11) | 8 | C10 C11 C12 | C12 | 0.41 |  |
| I-11 | Raw Quartz | C11 | mine | 847 | 847 | 5.6 | 8.6 | 22.6 | 2.0 (mine I-13, C13) | 9 | C11 C12 C13 | C13 | 0.19 |  |
| E-20 | Quartz Crystal | C11 | syllables | 685 | 2056 | 13.7 | 21.2 | 13.7 | 3.3 (mine I-13, C13) | 10 | C11 C12 C13 | C13 | 0.36 |  |
| E-21 | Crystal Oscillator | C11 | words | 203 | 1216 | 8.1 | 12.2 | 8.8 | 1.3 (auto E-17, C11) | 11 | C11 C12 C13 | C13 | 0.11 |  |
| E-22 | Radio Control Unit | C11 | sentences | 98 | 2555 | 17.0 | 25.2 | 17.0 | 3.1 (mine I-13, C13) | 10 | C11 C12 C13 | C13 | 0.28 |  |
| I-12 | Silica + Quartz Dust | C12 | keys | 62 | 250 | 1.7 | 2.4 | 1.7 | 0.5 (auto E-19, C12) | 8 | C12 C13 C14 | C14 | 0.02 |  |
| E-23 | Control Panel | C12 | sentences | 121 | 3156 | 21.0 | 30.1 | 21.0 | 5.0 (mine I-13, C13) | 9 | C12 C13 C14 | C14 | 0.28 |  |
| I-13 | Sulfur | C13 | mine | 994 | 994 | 6.6 | 9.5 | 26.5 | 2.2 (mine I-15, C15) | 9 | C13 C14 C15 | C15 | 0.10 |  |
| E-24 | Black Powder | C13 | syllables | 824 | 2471 | 16.5 | 23.5 | 16.5 | 3.8 (mine I-15, C15) | 10 | C13 C14 C15 | C15 | 0.22 |  |
| E-25 | Nobelisk | C13 | words | 285 | 1709 | 11.4 | 16.3 | 12.3 | 1.8 (auto E-22, C13) | 11 | C13 C14 C15 | C15 | 0.10 |  |
| E-26 (gather) | Nobelisk Detonator + Sulfuric Residue | C13 | sentences | 131 | 3413 | 22.8 | 32.5 | 22.8 | 3.2 (build M9, C15) | 11 | C13 C14 C15 | C15 | 0.12 |  |
| I-14 | Compacted Coal | C14 | keys | 178 | 714 | 4.8 | 6.7 | 4.8 | 1.0 (build M9, C15) | 9 | C14 C15 C16 | C16 | 0.02 |  |
| E-27 | Pig Iron | C14 | syllables | 695 | 2086 | 13.9 | 19.5 | 13.9 | 2.9 (build M9, C15) | 10 | C14 C15 C16 | C16 | 0.03 |  |
| E-28 | Iron Casing | C14 | words | 202 | 1211 | 8.1 | 11.0 | 8.7 | 1.7 (auto E-26, C15) | 10 | C14 C15 C16 | C16 | 0.01 |  |
| E-29 | Turbine Housing | C14 | sentences | 109 | 2832 | 18.9 | 25.3 | 18.9 | 3.4 (auto E-28, C16) | 11 | C14 C15 C16 | C16 | 0.02 |  |
| I-15 | Crude Oil | C15 | mine | 258 | 258 | 1.7 | 2.2 | 6.9 | 0.3 (mine I-17, C17) | 11 | C15 C16 C17 | C17 | 0.00 |  |
| E-30 | Fuel Generator | C15 | sentences | 145 | 3762 | 25.1 | 32.2 | 25.1 | 3.4 (mine I-17, C17) | 12 | C15 C16 C17 | C17 | 0.00 |  |
| I-16 | Plastic + Heavy Oil Residue | C16 | keys | 191 | 763 | 5.1 | 6.4 | 5.1 | 1.0 (auto E-28, C16) | 9 | C16 C17 C18 | C18 | 0.00 |  |
| E-31 | Polymer Composite | C16 | syllables | 676 | 2029 | 13.5 | 16.9 | 13.5 | 2.7 (mine I-17, C17) | 10 | C16 C17 C18 | C18 | 0.00 |  |
| E-32 | Circuit Board | C16 | words | 325 | 1948 | 13.0 | 16.2 | 14.1 | 1.9 (auto E-32, C18) | 11 | C16 C17 C18 | C18 | 0.00 |  |
| E-33 (gather) | Computer + Polymer Resin + Petroleum Coke | C16 | sentences | 108 | 2817 | 18.8 | 23.5 | 18.8 | 2.8 (build M10, C17) | 11 | C16 C17 C18 | C18 | 0.00 |  |
| I-17 | Bauxite | C17 | mine | 220 | 220 | 1.5 | 1.8 | 5.9 | 1.0 (mine I-19, C19) | 8 | C17 C18 C19 | C19 | 0.00 |  |
| E-34 | Supercomputer | C17 | sentences | 97 | 2512 | 16.7 | 20.9 | 16.7 | 3.7 (mine I-19, C19) | 9 | C17 C18 C19 | C19 | 0.00 |  |
| I-18 | Aluminum Scrap | C18 | keys | 132 | 527 | 3.5 | 4.3 | 3.5 | 0.9 (mine I-19, C19) | 8 | C18 C19 C20 | C20 | 0.00 |  |
| E-35 | Aluminum Ingot | C18 | syllables | 527 | 1580 | 10.5 | 12.8 | 10.5 | 2.7 (mine I-19, C19) | 9 | C18 C19 C20 | C20 | 0.00 |  |
| E-36 | Alclad Aluminum Sheet | C18 | words | 232 | 1391 | 9.3 | 11.0 | 10.0 | 1.4 (auto E-33, C18) | 10 | C18 C19 C20 | C20 | 0.00 |  |
| E-37 | Heat Sink | C18 | sentences | 86 | 2226 | 14.8 | 17.4 | 14.8 | 2.4 (auto E-36, C20) | 10 | C18 C19 C20 | C20 | 0.00 |  |
| I-19 | Uranium | C19 | mine | 684 | 684 | 4.6 | 5.1 | 18.3 | 2.0 (mine I-21, C21) | 8 | C19 C20 C21 | C21 | 0.00 |  |
| E-38 | Encased Uranium Cell | C19 | syllables | 591 | 1772 | 11.8 | 13.2 | 11.8 | 3.3 (mine I-21, C21) | 9 | C19 C20 C21 | C21 | 0.00 |  |
| E-39 | Electromagnetic Control Rod | C19 | words | 201 | 1208 | 8.0 | 8.8 | 8.7 | 1.7 (auto E-37, C20) | 10 | C19 C20 C21 | C21 | 0.00 |  |
| E-40 (gather) | Cooling System + Concrete | C19 | sentences | 121 | 3138 | 20.9 | 22.8 | 20.9 | 7.4 (auto E-40, C21) | 10 | C19 C20 C21 | C21 | 0.00 |  |
| I-20 | Uranium Fuel Rod + Uranium Waste | C20 | keys | 140 | 560 | 3.7 | 4.0 | 3.7 | 2.3 (auto E-40, C21) | 10 | C20 C21 C22 | C22 | 0.00 |  |
| E-41 | Reactor Assembly | C20 | sentences | 95 | 2461 | 16.4 | 17.6 | 16.4 | 5.0 (mine I-21, C21) | 11 | C20 C21 C22 | C22 | 0.00 |  |
| I-21 | Nitrogen Gas | C21 | mine | 901 | 901 | 6.0 | 6.4 | 26.3 | 1.0 (auto E-39, C21) | 9 | C21 C22 C23 | C23 | 0.00 |  |
| E-42 | Nitric Acid | C21 | syllables | 577 | 1730 | 11.5 | 12.4 | 12.4 | 2.5 (auto E-42, C23) | 10 | C21 C22 C23 | C23 | 0.00 |  |
| E-43 | Fused Modular Frame | C21 | words | 193 | 1157 | 7.7 | 8.3 | 8.8 | 1.9 (auto E-43, C23) | 11 | C21 C22 C23 | C23 | 0.00 |  |
| E-44 | Turbo Motor | C21 | sentences | 84 | 2176 | 14.5 | 15.5 | 15.1 | 2.7 (auto E-44, C23) | 12 | C21 C22 C23 | C23 | 0.00 |  |
| I-22 | Battery | C22 | keys | 109 | 438 | 2.9 | 3.1 | 3.1 | 0.6 (auto E-44, C23) | 9 | C22 C23 C24 | C24 | 0.00 |  |
| E-45 | Magnetic Core | C22 | syllables | 493 | 1479 | 9.9 | 10.1 | 10.5 | 1.9 (auto E-44, C23) | 10 | C22 C23 C24 | C24 | 0.00 |  |
| E-46 | Magnetic Field Generator | C22 | words | 213 | 1279 | 8.5 | 8.5 | 10.0 | 1.9 (auto E-44, C23) | 11 | C22 C23 C24 | C24 | 0.00 |  |
| E-47 (gather) | Assembly Director System + Copper Powder + Iron Filings | C22 | sentences | 82 | 2137 | 14.2 | 13.6 | 15.7 | 2.6 (auto E-47, C24) | 12 | C22 C23 C24 | C24 | 0.00 |  |
| P-lore-1 | Gazette I | C22 | page | 6 | 720 | 4.8 | 4.6 | 20.0 | 2.4 (completion completion, C26) | 3 | C23 C26 |  | 0.00 |  |
| P-let-1 | Letter I | C22 | page | 7 | 840 | 5.6 | 5.5 | 21.3 | 2.4 (build M11, C23) | 3 | C23 C26 |  | 0.00 |  |
| I-23 | SAM Ore | C23 | mine | 68 | 68 | 0.5 | 0.4 | 2.1 | 0.1 (auto E-47, C24) | 9 | C23 C24 C25 | C25 | 0.00 |  |
| E-48 | SAM Fluctuator | C23 | sentences | 72 | 1862 | 12.4 | 11.4 | 14.4 | 2.6 (auto E-47, C24) | 10 | C23 C24 C25 | C25 | 0.00 |  |
| P-lit-1 | Book I | C23 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | only 2.4 min: nothing asks for it |
| P-triv-1 | Almanac I | C23 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | only 2.4 min: nothing asks for it |
| P-lore-2 | Gazette II | C23 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | only 2.4 min: nothing asks for it |
| I-24 | Reanimated SAM | C24 | keys | 54 | 216 | 1.4 | 1.2 | 1.6 | 0.6 (auto E-47, C24) | 8 | C24 C25 C26 | C26 | 0.00 |  |
| E-49 | Alien Power Matrix | C24 | full | 70 | 2660 | 17.7 | 15.2 | 24.6 | 3.8 (auto E-46, C24) | 9 | C24 C25 C26 | C26 | 0.00 |  |
| E-50 (gather) | Ballistic Warp Drive | C24 | full | 53 | 2014 | 13.4 | 11.5 | 18.7 | 1.8 (auto E-47, C24) | 10 | C24 C25 C26 | C26 | 0.00 |  |
| P-lit-2 | Book II | C24 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | only 2.4 min: nothing asks for it |
| P-let-2 | Letter II | C24 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | only 2.4 min: nothing asks for it |
| P-dia-1 | Script I | C24 | page | 3 | 360 | 2.4 | 2.1 | 16.0 | 2.4 (completion completion, C26) | 1 | C26 |  | 0.00 | only 2.4 min: nothing asks for it |
| P-triv-2 | Almanac II | C25 | page | 5 | 600 | 4.0 | 3.4 | 18.7 | 1.6 (auto I-23, C25) | 3 | C25 C26 |  | 0.00 |  |
| P-dia-2 | Script II | C25 | page | 5 | 600 | 4.0 | 3.4 | 18.7 | 1.6 (auto E-48, C25) | 3 | C25 C26 |  | 0.00 |  |
| P-lore-3 | Gazette III | C25 | page | 6 | 720 | 4.8 | 4.1 | 20.0 | 2.4 (auto I-23, C25) | 3 | C25 C26 |  | 0.00 |  |
| P-tech-1 | Blueprint I | C26 | page | 10 | 1200 | 8.0 | 6.9 | 25.3 | 2.4 (auto I-24, C26) | 4 | C26 |  | 0.00 |  |
| P-lit-3 | Book III | C26 | page | 7 | 840 | 5.6 | 4.8 | 21.3 | 2.4 (auto E-50, C26) | 3 | C26 |  | 0.00 |  |
| P-let-3 | Letter III | C26 | page | 5 | 600 | 4.0 | 3.4 | 18.7 | 2.4 (auto E-49, C26) | 3 | C26 |  | 0.00 |  |
| P-dia-3 | Script III | C27 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | only 0.0 min: nothing asks for it |
| P-tech-2 | Blueprint II | C27 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | only 0.0 min: nothing asks for it |
| P-triv-3 | Almanac III | C27 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | only 0.0 min: nothing asks for it |
| P-tech-3 | Blueprint III | C28 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | only 0.0 min: nothing asks for it |
| X-01 (ext) | Power Shard | C28 | keys | 0 | 0 | 0.0 | 0.0 | 0.0 |  | 0 |  | C30 | 0.00 |  |
| X-02 (ext) | Superposition Oscillator | C29 | keys | 76 | 304 | 2.0 | 1.7 | 2.0 | 2.0 (auto X-01, C30) | 2 | C30 C31 | C31 | 0.00 |  |
| PX-math | Formula Sheet | C29 | page | 0 | 0 | 0.0 | 0.0 | 12.0 |  | 0 |  |  | 0.00 | only 0.0 min: nothing asks for it |
| X-03 (ext) | Excited Photonic Matter | C30 | keys | 151 | 604 | 4.0 | 3.5 | 4.1 | 2.0 (auto X-02, C31) | 2 | C30 C31 |  | 0.00 |  |
| PX-code | Program Listing | C31 | page | 4 | 480 | 3.2 | 2.7 | 13.3 | 3.2 (auto X-02, C31) | 1 | C31 |  | 0.00 |  |

### By kind of lesson

| kind | lessons | min, game flat | min, ramp | min, as priced | bot 20 h (h) |
|---|---|---|---|---|---|
| mine | 13 | 64.5 | 109.9 | 268.4 | 1.5 |
| keys | 14 | 51.6 | 76.6 | 52.1 | 1.0 |
| syllables | 14 | 172.7 | 266.2 | 174.2 | 3.3 |
| words | 15 | 143.0 | 224.2 | 156.1 | 6.2 |
| phrases | 2 | 31.4 | 61.5 | 31.4 | 1.9 |
| sentences | 17 | 302.0 | 401.7 | 306.0 | 2.5 |
| full | 2 | 31.2 | 26.7 | 43.3 | 0.0 |
| pages | 20 | 58.4 | 51.3 | 333.3 | 0.0 |

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

- mine I-02 (R2 mine (е н) makes R2): the builder priced 435 Iron Ore, the game carries 135 Iron Ore (a repeated id in the price collapsed to its last entry)
- 9 print-run purchases (4.3 h as priced) exist only in the builder's replay: nothing in play buys a print run, so a page lesson is typed only for the completion, a machine price and an engine price
- a words item is priced at 6.5 characters but the game emits a unit every 6 keystrokes (chain.js PER_UNIT)
- a pages item is priced at 200 characters but the game emits a unit every 120 keystrokes (chain.js PER_UNIT)
- a mine is priced at 4 characters an ore but the game yields an ore a keystroke (app.js workKeystroke): every ore price is four times cheaper in play than on paper
- the completion price (3 Gazette I + 3 Letter I + 3 Book I + 3 Almanac I + 3 Script I + 3 Blueprint I + 3 Gazette II + 3 Letter II + 3 Book II) expands through the recipe quantities to 24,048 raw units (9,087 Iron Ore, 4,064 Water, 3,253 Coal, ...). Automation does not shrink that: an engine consumes at the same ratio, so even with every engine bought the belts carry it all, at 2 s an ore per mine, or about 13 mine-hours. That is a volume a few engines carry in a session, so the bot's per-lesson hours past the first columns now measure its own habits (batches of 300, extra mines, typing rather than waiting) more than the tree

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

