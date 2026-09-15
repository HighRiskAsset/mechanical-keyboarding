# Lesson plan v4: the rules (draft, 2026-09-10)

Status: rules under discussion. For this plan nothing in tree v3 is assumed:
not ore = finger, not the six ores, not Mk3, not the tier table. What is kept
is only what the game is: progress is bought with what you type, there are no
skill gates, and a lesson is a place on the map.

## 0. What we are making

One lesson plan per course. RU (ЙЦУКЕН) first, EN (QWERTY) second. The
principles below are shared; every number and every key order is per course.

A plan is a branching, ranked list of lessons. Every lesson is one of three
kinds:

- **Introduction.** New keys enter the game here (a mine, a well, a seam).
- **Expansion.** A recipe whose inputs are earlier products. The lesson is
  the inputs' lessons, widened.
- **Page.** A recipe over the finished keyboard with a content category.

Materials and machines are not part of the plan. Lessons carry ids (I-03,
E-14, P-02) until the naming pass. Naming is aesthetic and mechanical and
happens after the structure freezes. **A material name is at most 12 glyphs
in each script, measured on the game's 5px font (`dev/font.html` shows it):**
the bag panel prints every name whole beside its count (2026-09-15), and a
name that has to be cut there is a name that failed.

## Part A. Rules of determination

Each rule is one sentence, then why, then how we check it in the result.

### A1. Scope is declared first

Every course lists, before any lesson is planned, every key it will teach:
all letters, the ten digits, every mark a normal adult text uses, and Shift
for capitals. Nothing outside scope is ever asked; everything in scope is
taught before the first page.

Why: "full keyboard" has to mean something we can finish.
Check: the scope list exists; the last introduction closes it.

Scope has two halves (ruling 2026-09-10):

- **Core scope** is what completion requires: letters, digits, capitals,
  and the marks prose uses. RU: 33 letters, 0-9, `. , - ? ! : ; " ( ) №`.
  EN: 26 letters, 0-9, `. , ' - ? ! : ; " ( )`.
- **Extended scope** is everything else on the board: `% * + = _ / \ [ ]
  { } < > @ # $ & ^ ~ | `` ` ``, and the typographic marks below. Extended
  lessons exist, are cheap, and make material nothing in the core needs. A
  player learning to type is never made to write code to finish the game.

**Completion** is a fixed amount of practice after the last core key is in
use. Practice past completion is open-ended: more pages, extended lessons,
and later whatever those materials turn out to be for.

**Nothing is taught that does not work in real life (hard rule).** The em
dash and the guillemets « » have no key on any standard Russian layout.
Real typists use Alt+0151 / Alt+0171 / Alt+0187 on a Windows numpad,
Option+Shift+Minus and Option+= / Option+Shift+= on macOS ("Russian";
"Russian PC" differs), a third-party typographic layout (Birman: right
Alt+Minus, right Alt+< >), a Compose key on Linux, or a hyphen and straight
quotes fixed by autocorrect.

**Ruling 2026-09-10: the dash and « » are core scope for RU, taught per
environment.** Russian cannot be typed without тире, so they are seated
normally, where clauses and dialogue arrive, and each player is taught the
stroke that works on their machine:

- **LOCKED 2026-09-10.** The hint shown in the game is the Birman
  typographic stroke, on keys every board has: right Alt+Minus for the
  dash, right Alt with the б and ю keys (Comma, Period) for « ». The
  numpad is never shown; the game does not assume one exists.
- The game checks the glyph, never the stroke. Numpad Alt codes, the
  stock macOS Option combinations and Birman all pass. The player picks
  the habit; the game never sees which.
- Detection: the OS at load (userAgentData or navigator.platform); whether
  the typographic layout is installed, live, from what the shown stroke
  produces (a hyphen means it is not).
- The settings menu shows what was detected, with the install link for the
  typographic layout when it is missing. A Windows player with no numpad
  and no Birman cannot produce the dash; settings say so plainly.
- Browser and Electron: Birman and macOS combinations arrive as the
  composed character on keydown. Windows Alt codes arrive as a character
  event after Alt is released, so the listener reads characters as well as
  key codes. To be verified in the in-app browser before the lesson is
  built.

### A2. Introductions are short and letters-only; expansions carry the volume

An introduction lesson drills only its own keys (hinted, then blind) and
asks for little; every expansion that follows it does the real repetition.

Why: a key is cheap to meet and expensive to master, and that is the right
way round. It also settles the Q-and-Z case: a group with no vowel is
streams until an expansion gives it company.
Check: introductions ask for a fraction of an expansion's typing.

### A3. Alphabet is inherited on the early rungs, focused on the late ones

Through phrases (rungs 1 to 4) an expansion's alphabet is the union of its
inputs' alphabets, and an introduction's alphabet is its own keys. From
sentences on (rung 5 and up) the alphabet is everything unlocked, and the
inputs set the focus: which letters are weighted, which content family the
pool comes from.

The shape every new group follows (agreed 2026-09-10): its introduction
(streams over the new keys), then syllables with one or two old products,
then words that lean on the new keys over everything unlocked, then a
gather back into the whole. Never introduction straight to pages.

The syllable partners are always the first ores (RU: о а, е н, и т), chosen
per pair by counting: the smallest set that writes 8 syllables while
staying under the words threshold, so the drill stays on the new keys. The
first lessons of the game are therefore useful all game long.

Why: on the early rungs different alphabets are the lesson, and the graph
stays readable. Past that, strict inheritance costs a new base material for
every widening and bloats the material list (the v3 lesson). Material count
equals lesson count regardless, so the real lever is the cap in Part B.
Check: early alphabets are computed from the graph, never written by hand;
late lessons name their focus instead.

### A4. Grammar is earned by the corpus, not by a letter count

The rungs: 1 streams, 2 syllables, 3 words, 4 phrases, 5 sentences,
6 full sentences (every mark, capitals, digits), 7 pages. A lesson sits on
the highest rung whose pool over its alphabet clears a threshold measured
against the course's real word and sentence lists.

Proposed thresholds (per course, tune against the corpus):

| rung | needs |
|---|---|
| syllables | at least one vowel and one consonant; 8 or more real syllables |
| words | 25 or more real words from the top 2000 |
| phrases | 40 or more words, including 3 or more function words |
| sentences | the period in the alphabet; 20 or more writable sentences |
| full sentences | comma, question mark, capitals in |
| pages | scope complete |

Rung 6, full sentences, means the whole core scope: every mark, every
digit, capitals. Before that a sentence lesson simply uses the marks
unlocked so far.

Exception (2026-09-10): a focus lesson for a new group (its syllables, its
words) may sit below the rung its pool would allow, on purpose. The review
page lists these as "could rise" so the choice is visible, never silent.

Why: "enough letters for words" is a fact about the language, not a number.
Check: every lesson's rung is justified by a counted pool.

### A5. Never regress, always widen

An expansion's rung is at least the highest rung among its inputs, and it
differs from each input in alphabet or in rung. A recipe that is one of its
inputs again is not a lesson.

Check: for each expansion, alphabet strictly grows or rung strictly rises,
against every input.

### A6. Introduction order is computed per layout, then tuned by hand

For each candidate group of keys, score:

- coverage gained (share of running text),
- words unlocked (new real words in the top list over the resulting alphabet),
- comfort (home before top before bottom; index and middle before ring
  before pinky; both hands in a group where possible),
- vowel balance (the first group holds a vowel; a vowel joins at least every
  other group until all vowels are in).

Take the best, repeat, then tune for the goals a plan names ("the arrives at
rank 6", "the comma comes with clauses"). Groups are two keys as the norm,
three or four only for a rare tail (a pinky sweep) or when a mark rides a
letter. Fingers are not a constraint; a group may cross fingers.

Why: this is the whole "optimized per layout" promise made concrete. RU
scores well by frequency alone; EN needs the word term because its vowels
are scattered.
Check: the order and its scores are shown, and every hand tune is annotated.

### A7. Marks, capitals and digits are seated where they become useful

The period arrives when sentences are within reach (about half the letters);
the comma when clauses appear; question and exclamation with dialogue;
capitals as soon as sentences exist; digits after the letters, in two or
three groups, each straight into sentences with numbers.

Each layout names its signature hurdles and gives each one its own
introduction and its own expansion. RU: the shifted comma. EN: the
apostrophe and the contractions that wait on it.

Why: a sentence without a capital is a lie we can tell for a lesson, not for
hours; a digit drilled as a stream teaches nothing about dates and prices.
Check: each mark's seat is justified by the rung it enables.

### A8. Braid, then gather

Between two introductions several expansions run side by side over different
subsets of the live products, so they differ in alphabet, rung or content.
Every three or four introductions one gather recipe takes every live branch
as input and re-unifies the alphabet. The frontier (lessons workable right
now) stays three to six wide.

Why: non-linearity that still funnels. Branches give variety; the gather
makes sure nothing is left behind.
Check: frontier width at every rank; gather recipes marked.

### A9. Distinctness

No two lessons in the same window share alphabet, rung and content family.
Content family is what the pool is made of: nouns, verbs, endings, questions,
dialogue, numbers, names of places, and so on.

Why: "the same lesson with two more keys" is exactly the thing to refuse.
Check: zero collisions on the triple.

### A10. The window is the live set, and prices are the funnel

(Mechanics note, 2026-09-10: automation of an old machine or recipe, bought
with later materials, is what ends the backtracking; it does not change the
lesson tree. Distinctness means no repeat lessons, not no return visits:
going back to an old lesson for more of its material is wanted.)

A lesson is live from the moment it can be bought until its automation is
bought; the window is the live set. An expansion draws its hand-made inputs
only from the window; anything older arrives automated. Every expansion has
an input from its own or the previous column (the expansion) and an input
from an earlier column; and every column past the second holds at least one
lesson that reaches two or more columns back (the review). Mark lessons
reach back by taking an older product as their flux: the comma lesson is
built from the phrase product, the question lesson from the little words,
the list lesson from the things. New keys are mixed into every older
content family within two columns.

The only thing that orders lessons is what they cost, and prices are made of
earlier products. A price names a rank; nothing else does.

**The prices, and there are only these (agreed 2026-09-11):**

- A recipe's price is its input material. Running the lesson consumes the
  ratio; that is the whole price. There is no separate purchase to unlock a
  recipe.
- A place is built for a price made of earlier products. That is the gate.
- Automation is bought for a price made of later products. That is what
  ends backtracking, and the only thing that does.

Nothing is hidden. Every recipe a machine can run is listed from the start,
greyed while unaffordable, and the greyed row names what it needs, so a
player reads a requirement and goes to earn it. Every plot lists every
machine it could hold with the full price. No discovery mechanic: a
requirement the player cannot see cannot send them anywhere.

Why: this is backtracking as a property of the graph. Review happens because
the recipe asks for it, and it stops when automation takes the old lesson
off your hands.
Check: window depth at every rank; expansion and review inputs listed for
every recipe.

### A11. Exposure follows frequency

Total keystrokes the plan demands on a key are roughly proportional to that
key's share of running text, with a floor so a rare key still gets a real
workout.

Check: simulate the plan; per-key totals within half of target, floor met.

### A12. Session shape

No purchase asks for more than about fifteen minutes at one lesson; a
purchase spreads across two or three lessons. A lesson lives thirty to sixty
minutes in total across several visits (an introduction: five to ten). The
keyboard phase runs fifteen to twenty hours; pages are open-ended. All of it
is prices, all of it tunable.

Why: "not an hour of one lesson and then done with it."
Check: per-lesson minutes and per-purchase spread in the simulation.

The weaving pass (after the lesson list exists): a lesson's output is split
across several purchases and several recipes. Some feeds the next lesson,
some buys an automation, some is an input to two recipes at once. Splitting
and weaving the tree while keeping lessons balanced, ordered and non-linear
is its own step, done once per course.

### A13. Pages

Pages begin the column the last letters arrive (RU: C22) and run beside the
digit columns (ruling 2026-09-11). The digit-free categories go first, and
a page that needs digits or the list marks waits for the lesson that
teaches them. Categories: famous literature, fun trivia, mathematical and
technical writing, and the others: dialogue and theatre, letters and
correspondence, instructions and recipes, verse, news, and lore (the
machines talking). Each category is a branch of three or more lessons
graded by length and by density of marks, digits and capitals, opening in
difficulty order so plain sentences come first and mathematics last. The
order is only when a page opens; there are no tiers and nothing is gated
by one. Completion (ruling 2026-09-12) is a named list, the easier half of
the pages: every kind of page once, so every key is practised in every
kind, and a second of the plain kinds; nothing advanced, no mathematics
past the first page. The advanced half, and the extended lessons, are
priced like everything else and are there to play; the win does not need
them. The texts are course data; the engine sees only a grade.

Check: four or more categories, three or more lessons each, grades rising
along every branch.

### A14. Same principles, different plans

The rules are shared. Scope, thresholds, order, group sizes, hurdles and
corpora are per course. Nothing in one course's plan is copied from another.

### A15. Names last

The structure freezes before naming. Naming assigns a machine kind and a
material look for interest, and may not change a lesson's alphabet, rung,
inputs or rank.

### A16. The RU seating (drafted 2026-09-10)

The A6 scorer's order with two hand tunes (ж х before ц э, because х is
the more frequent and хорошо, плохо, хлеб are everyday words; the tail
щ ё ъ as one three-key column) and the marks seated by A7. Twenty-four
columns; the plan itself is `docs/lessons-v4-ru.plan.js` and its review
page `docs/lessons-v4-ru.html`.

| col | keys | why here |
|---|---|---|
| C1 | о а | the bumps; 18% of text |
| C2 | е н | syllables open |
| C3 | и т | words open |
| C4 | с л | little words |
| C5 | в р | phrases open |
| C6 | к п | gather 1 |
| C7 | м д . | the period rides the pair; sentences open |
| C8 | Shift | capitals as soon as sentences exist |
| C9 | у ь | the soft sign; infinitives; gather 2 |
| C10 | , | the signature hurdle, alone; clauses |
| C11 | ы г | plurals |
| C12 | - — | hyphen and the typographic dash, alone |
| C13 | б я | the past tense; gather 3 |
| C14 | з й | adjectives and possessives |
| C15 | ? ! | questions |
| C16 | ч ш | что, почему; gather 4 |
| C17 | " « » | dialogue |
| C18 | ж х | хорошо, можно |
| C19 | ц э | это; gather 5 |
| C20 | : ; ( ) | lists and asides |
| C21 | ю ф | |
| C22 | щ ё ъ | the tail; gather 6, all letters |
| C23 | 1 2 3 4 5 | counts and times |
| C24 | 6 7 8 9 0 № | dates and prices; gather 7, the keyboard complete |

### A17. The EN seating (built 2026-09-15)

The RU skeleton column for column and lesson for lesson (user ruling
2026-09-15: the two courses should be obviously parallel), with the keys
reseated for QWERTY. The A6 scorer (coverage, words unlocked, comfort, a
vowel at least every other group) puts e t first and pulls u, the last
vowel, up to C5; from C9 on the candidate pairs score within a point of each
other, so those columns were tuned by hand to the RU column roles (verbs at
C9, things and places at C11, people at C13, adjectives at C14). Same 24
columns, same 97 lessons, same ids, so the mech layer and the names are
shared and the material ids mean the same thing in both courses. The plan is
`docs/lessons-v4-en.plan.js`, its review page `docs/lessons-v4-en.html`.

| col | keys | why here | differs from RU |
|---|---|---|---|
| C1 | e t | the two most frequent letters, 22% of text | |
| C2 | a o | syllables open | |
| C3 | i n | words open: in, it, on, an, no, not, one, into | |
| C4 | h s | little words: the, this, she, he, is, his, has | |
| C5 | r u | the last vowel; phrases open | u this early: a vowel every other group |
| C6 | l d | gather 1 over twelve letters (78%) | |
| C7 | c m . | the period on its own key; sentences open; home and family | the Period key, not Slash |
| C8 | Shift | capitals, and the pronoun I | |
| C9 | g y | -ing and -ly; you, they, my; verbs; gather 2 over sixteen letters | |
| C10 | , | clauses | on its own key, unshifted: not a hurdle here |
| C11 | f w | of, for, from, if; we, was, with, what, when, where, who, how, now; things and places | |
| C12 | ' - | the apostrophe (the EN hurdle) with the hyphen: the two marks that live inside a word; contractions | takes the dash column; no em dash in EN scope |
| C13 | b p | people; gather 3, the past tense (was, were, -ed) | |
| C14 | v | very, have, over, every, seven; adjectives | one letter |
| C15 | ? ! | questions | |
| C16 | k | know, think, like, look, make, take, work; gather 4 questions | one letter |
| C17 | " | dialogue | straight double quotes only; no guillemets |
| C18 | j | just, job, join, jump | one letter |
| C19 | x | next, six, box, fix, exit; gather 5 | one letter |
| C20 | : ; ( ) | lists and asides | the semicolon is unshifted |
| C21 | q | quarry, quality, quiet, question; syllables borrow r u for the u | one letter |
| C22 | z | the last letter; gather 6, all letters | one letter |
| C23 | 1 2 3 4 5 | counts and times | |
| C24 | 6 7 8 9 0 | dates and prices; gather 7 | no numero sign; English writes No. |

The one structural difference: English has 26 letters to Russian's 33, and
the skeleton has sixteen letter columns, so ten columns carry pairs and the
rare tail (v k j x q z, 2.3% of text together, about what RU's last five
letter columns carry) stands one letter to a column from C14. The
alternative, a 21-column EN tree of thirteen pairs, would break the shared
ids, names and mech layer; it is the user's call if the singles play badly.

Families that moved with the language: E-21 is "things and places leaning
on f w" (the English plural is -s and has been there since C4, so RU's
plurals column has no counterpart); E-23 is the new `contractions` family
(an apostrophe, or a hyphen inside a word), tested in the builder and in
`js/engine.js`; the `past` test covers both languages (был and -л, or was,
were, had, did, been and a consonant + ed). The syllable partners for the
singles are the vowel banks as in RU (I-01 e t with I-03 i n or I-02 a o);
q takes I-05 r u because it needs its u. Coverage: 50% by C3, 78% by C6,
84% by C7, 93% by C11, all letters at C22.

## Part B. What the finished plan must look like

One table per course, one row per lesson:

| id | kind | rank | keys added or inputs | alphabet | rung | content family | expands | reviews | notes |

Alphabet is computed. "Expands" names the previous-rank input; "reviews"
names the older one.

And the checks, all of which must pass before naming begins:

1. **Coverage curve.** Cumulative share of running text after each
   introduction. Targets: 50% by the fourth introduction, 80% by the eighth,
   95% by the twelfth, all letters by about the sixteenth, full scope at the
   last. (Written before marks had columns of their own; the review page
   reports both by column and by letter pair.)
2. **Rung curve.** Words by the third or fourth introduction, sentences by
   about the eighth, full sentences in the last quarter, pages only after
   scope.
3. **Width and window.** Frontier three to six wide at every rank after the
   second; every expansion has an expansion input and a review input; no
   hand-made input from outside the window.
4. **Exposure.** Per-key keystroke totals within half of the frequency
   target, floor met.
5. **Distinctness.** Zero collisions on alphabet, rung, family.
6. **Hurdles.** Named per course, each with its own introduction and
   expansion.
7. **Pages.** Four or more categories, three or more lessons each, graded.
8. **Ids only.** No material or machine name appears anywhere in the plan.
9. **Size.** RU planned at fifty to sixty lessons before pages; judged on
   paper for bloat before EN is planned.
10. **Core before extended.** Completion depends on core scope only; every
    extended lesson is optional and cheap.

Presentation: a flowchart first, because this is a tech tree and a person
reads it as one. Ranks as columns, each lesson a node showing its keys
(new ones bold) and what you type, arrows for inputs, gathers visible where
branches rejoin. Beside it the row per lesson (id, keys, what you type,
three real samples, inputs, feeds) and a coverage curve. Built as a review
page in docs, as v3 was.

## Part C. From lessons to mechanics (2026-09-11, fourth cut)

The model, in full: there are materials and machines. Some materials are
raw. A recipe, at a machine, turns one or more input materials into one
output material, and every recipe has its own. A lesson is one recipe or
one raw. Prices are made of materials. Automation is the only thing that
retires a lesson. Nothing else. The RU layer is `docs/lessons-v4-ru.mech.js`,
built by `dev/tech-tree-v4-build.js` into three files: the tech tree
`docs/tech-tree-v4-ru.html`, the overlay `docs/lesson-tech-tree-v4-ru.html`
(the lesson tree with its recipe on every node), and `docs/tree-v4-ru.json`,
the same data for the game to read. Ids only; naming comes after the
structure is agreed. The EN layer (`docs/lessons-v4-en.mech.js`, 2026-09-15)
started as a copy of the RU cut, since the EN plan has the same skeleton,
and builds the same three files with `en` in the name; its names file
re-exports the RU names, one naming for both courses. Both courses are
built with `node dev/tech-tree-v4-build.js ru` and `... en`, which also
write `js/tree-ru.js` and `js/tree-en.js`, the modules the game loads.

### C1. The shape: Satisfactory's

| | raws | machines | made materials | recipes | lessons |
|---|---|---|---|---|---|
| Satisfactory | 13 | 11 | about 80 | about 200 | |
| ours | 13 | 11 | 79 | 79 | 92 core (+5 extended, unpriced) |

- **Thirteen raws.** A mine every other column from C3 on, letters and
  marks alike, so a new raw keeps arriving all game (the last at C23).
  Every other introduction is a recipe on the newest raw and the previous
  column's newest material, so new keys need the lesson before them; its
  lesson is still the streams over its new keys. Which groups are mines is
  a free choice; what a raw is comes with naming.
- **One recipe per lesson, one material per recipe,** plus byproducts:
  one from three of the gathers and from five key-group recipes, two from
  the other three gathers. Pages are printed on byproducts and machines
  are built with them, each going to the byproduct with the fewest takers,
  so every one has takers.
- **Fluids** (ruling 2026-09-12) are strictly mechanical and unrelated to
  lessons: which raws are fluids is a free choice. A fluid cannot be
  carried by the player, so it needs a pipe to the next machine and can
  only ever be a recipe input, never part of a price. Three raws are
  fluids, and a syllable recipe fed by a fluid makes a fluid.
- **Every lesson is priced,** the extended ones too. Completion does not
  need them; that is the only difference.
- **Machines have shapes** (ruling 2026-09-12, Satisfactory's roster plus
  1:2 and 2:3): 1 belt in and 1 out; 1 in, 2 out; 2 in, 1 out; 3 in, 1
  out; 2 in, 2 out; 2 in, 3 out; 3 in, 2 out; a belt and a pipe in, a belt
  and a pipe out; 2 belts and a pipe in, a belt and a pipe out. A recipe
  goes to the smallest shape that fits it (a slot may go unused), rotating
  among the open machines of that shape with room, up to eleven each; when
  none has room a machine of that shape opens at that column. Machines do
  not gate lessons.
- **Quantities are part of a recipe** (ruling 2026-09-12). A run consumes
  so many of each input and yields so many of each output, by a default
  pattern per shape (the 2:3 shape takes 3 and 2 and gives 1, 3 and 4)
  with overrides per lesson; a syllable material going into a words lesson
  counts double. The simulation costs a material by runs of its recipe.
- **The gate is the inputs** (ruling 2026-09-12). A machine is a purchase,
  so it gates its first recipe once; after that each of its recipes is
  gated by its own inputs, and with many recipes per machine that is where
  nearly all the gating is. Machines do not otherwise order lessons.
- **Inputs are the plan's inputs,** as materials. A page takes the
  sentences its plan names and the newest raw; it is not made of pages.

### C2. The prices, as rules

Budgets are minutes of hand typing per purchase, counted through every
un-automated input; quantities are derived from them.

- **A mine**: the previous column's materials and an older one. About 14
  minutes.
- **A machine**: the newest material and the newest raw. About 12
  minutes. A machine whose first recipe is a page asks for the previous
  tier's pages instead of the one newest material.
- **Automation** of a recipe or a mine, two columns after it: two of that
  column's materials in turn, so every new material is asked for. About 8
  minutes. This is what paces a column.
- **A print run** per page column: six of each page material made there
  and three of each from the column before. Completion is one more
  purchase, at the column where the last of its pages opens: three of each
  completion page.
- **Speed.** The hours assume a flat 30 words a minute. That is a scale
  for the workloads, not a prediction: a real player starts slower and
  speeds up, and only a playtest says by how much.

### C3. Hours (RU, this cut)

Keyboard complete in about 19 and a half hours (including the page tiers
that open at C22 beside the digits), completion at about 23, everything on
the page at about 25, over 119 purchases. Twelve machines: four of 2:1, two
of 3:1, one each of 1:1, 1:2, 2:2, 2:3, belt-and-pipe, and
two-belts-and-pipe. 106 materials: 13 raws, 79 recipe outputs, 14
byproducts, 5 of them fluids. Every check passes: per-lesson
caps, two or more consumers per material, every key within its exposure
band and above its keystroke floor.

## Open calls

1. Capitals early (with the first sentences) rather than late. Proposed: early.
2. Groups need not share a finger. Proposed: dropped as a constraint.
3. Keyboard phase at fifteen to twenty hours.
4. The rung where inheritance stops (A3 says sentences).
