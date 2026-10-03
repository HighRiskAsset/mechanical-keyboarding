# Story concepts: the lore drip (second pass, 2026-10-03)

Status: concepts and a recommendation, for the user's rulings. Supersedes
the first pass of 2026-09-16. What that pass got right is folded in here
(its five concepts stand in short form as 4.1 to 4.5; its rules, channels
and drip survive, corrected against the v4 tree as it stands today). What
it lacked is the pillar in section 2 and a plot with a spine strong enough
to carry twenty hours.

The ask (user, 2026-09-16 and 2026-10-03): once the player is typing whole
sentences, what they type can carry a story. Someone is sending messages
through the machines: the author, the game, a ghost. The player unravels it
by paying attention, follows small quests around the map, finds things
disguised as scenery, each unlocking the next, and learns that there was
someone here before them. Cryptic word sets foreshadow it early, so a player
notices the same words coming back and starts reading what they type. It
must read like Outer Wilds (the environment tells it; there is a true
ending past the stated one, a way out) and Iconoclasts (lore that is never
explained, assembled from observation, better on the second run), with a
turn in it like Motherload's (the voice that feeds you missions turns). It
must never cost the game anything as a typing tutor; it is authored per
course, not translated; and it waits for the lesson order and durations to
freeze, which is near. The target is a story people make videos about.

**The late addition (user, 2026-10-03), which changes the shape of
everything:** the typing mechanic is the controls. A boulder in the hills
says `move move move move`; type it and the boulder moves. No extra buttons.
The practice is inside the world, not outside the fourth wall. And the
things the world asks you to type can be ominous: imagine the line is
`destroy`.

Rejected before we start (user, both passes): the archaeology of the three
pre-built mines (unobservable, and it only works in one language). The
author as the voice: see 4.8.

What changed since the first pass, and matters here:

- **The v4 tree is named**, and the names are a gift. The pages the player
  prints at the end are a *Gazette* (the lore category, the machines
  talking), a *Letter* (correspondence), a *Script* (dialogue and theatre),
  an *Almanac* (trivia), a *Book* (literature) and a *Blueprint* (technical
  writing), three grades of each. The player manufactures the letters the
  story's office "sends". The deep raws at the rim's far corners are
  uranium (the badland butte) and a strange ore (the last mine, C23). The
  tree's last extended product is a warp drive, and the finish music is
  called *launch*. None of this was planned as story and all of it reads
  as story the moment a line points at it.
- **The columns are real now.** Twenty-four keyboard columns, words from
  C3, sentences from C7, Shift at C8, pages from C22, completion at C26;
  the bot's hour marks per column are in `docs/lesson-time-en.md`. The
  drip in section 6 sits on those columns, not on guesses.
- **The naming hazard.** The v4 names are Satisfactory's, down to Caterium,
  Nobelisk and SAM. Names come last (A15) and the story cannot say
  "strange alien matter" without becoming another game's fan fiction, so
  the naming pass needs to know the story's nouns before it finishes. This
  document names nothing; it says what each thing has to *be*.

## 1. What the story has to obey

The game's own rules, and every concept below was checked against them.

- **No dialogues after play starts.** No cards in play, no NPCs, no text
  boxes. The how-to-play cards come before; the rest card and the finish
  card are the only ones after. Icons carry information; the caption under
  the map names the place and what its one row does.
- **The drill line is the only text channel during play.** Whatever the
  story says, the player says it first, with their fingers. This is the
  whole opportunity: the game already asks the player to type what a
  machine shows them, and nobody has asked where the line comes from.
- **Typing is the only action** (section 2 makes this a pillar). Hold Space
  opens a place's menu, arrows choose, a tap confirms; the rest is typing.
  A story act is a line typed at a place, never a new key.
- **Progress is materials only.** Nothing in the story may lock a key, a
  machine, a recipe or the finish. A story place sells a row for a price
  like any place; a story token is a material like any other; the chain of
  posts orders itself by prices the way the whole tree does. No skill
  gates, no flags that gate progress, no timers, no pressure.
- **Nothing is lost.** The economy already refuses to lose the player
  anything (a hidden bag row returns, a removed machine is a price paid
  again). A story verb that changes the world is reversible by another
  verb, or changes something the player never needed.
- **Language is data.** Every typed beat is authored per course, graded to
  the column it lands on and constrained to that column's keys. The
  environment tells (a dark lamp, a lamp that breathes, a sign facing the
  wrong way, a route of lamps lighting one by one) are shared and need no
  words. The story ships as a bible of beats with constraints, not a text
  with translations (6.9).
- **Dread without urgency** (the music plan, 2026-08-27): danger is implied
  and never arrives. One three-note motif recurs in every track and is
  never resolved. "Someone built them. Someone left. The dormant machines
  are the mystery, and the player should feel that before anything tells
  them." The story is what that ruling was waiting for.
- **The outskirts earn the walk.** The rim landmarks exist for exactly
  this: the Summit, the flooded pit on the mesa, the two crystal benches,
  the dry wash, the badland butte, the crevasses, the tar seeps, the reed
  lagoon, the island in the bog lake. Four of the five outer edges are a
  climb, and "the belt home from it is a long one. That is the trade the
  edges are for."
- **The finish is already a line of lore.** The finish card says *Every
  machine hums without you*, and its button says *Keep the shift going*.
  Those two lines are the whole story, said by two different voices, and
  nobody has noticed yet. The goal of the game is to make the player
  unnecessary. That is also, exactly, what a typing tutor does.
- **The bot must not care.** `dev/bot-sim.js` plans from the tree. Story
  rows are outside it (no consumer in the tree asks for a story token), so
  the bot never buys one and the hour marks never move.
- **The two starts are both canon.** *From the Beginning* builds the
  frontier; *Typing Practice* opens a found works that "stand where a
  player would have stood them". The second is the first one's frontier,
  built by someone who is not there. The story costs that start nothing
  and gives it a reason.

## 2. The pillar: typing is the controls

The first pass treated the world as something to read. The late addition
makes it something to *work*, and that is the better game: the player is
already an operator, and an operator acts on the world by typing at it.

**A post is a place whose price is a line.** The game already has the
mechanic: a closed crossing is a place with one priced row, and paying it
changes the map (the bridge stands, walkability changes). A post is a
crossing whose price is typed instead of spent. Walk up: the caption's
brass line names it (*Boulder*), the second line says what the row does
once there is one. Hold Space: one row. Confirm: a drill line appears under
the map, the way one does at any machine, and it is a verb, repeated: `roll
roll roll roll`. Type it and the boulder rolls. The post's lamp lights and
stays lit. The row is gone, or a different row stands in its place (`light`
where `destroy` was).

**The line is a lesson.** A verb repeated four times over a keyboard the
player has is a `words` drill with a one-word pool; a longer post line is a
sentence or a page graded like any other. The engine sees a grammar and an
alphabet, as it does for everything (invariant 5), so a post costs no
engine knowledge of any language.

**The verb has to fit the keys.** Nothing on the map is gated, so a player
can stand at the Summit in the first hour. A post's row appears the way a
recipe does: when its alphabet is open. Before that it is scenery with a
tell. This is the constraint that makes the beat bible necessary: the same
beat ("the boulder is moved") takes a different verb in each course, and
each verb opens at a different column (EN `roll` at C6, RU `кати` at C6;
EN `listen` at C4, RU `слушай` at C16). The bible says the beat and the
earliest column it may use; each course finds its word.

**What a verb may do:** move a thing one tile (a boulder off a cut), open a
thing (a crate, a door in a cliff), light a thing (a lamp, a cairn), break
a thing (ice on the tarn), cross a thing (a boat across the lagoon), sound
a thing (a crystal that rings the three notes), and, at the end, the two
words that are the whole plot in one row each: `listen` and `destroy`.

**What a verb may never do:** gate a key, a machine or the finish; cost the
player anything they typed for; be the only way to a thing the course
needs. A destroyed lamp is relit by another verb. A moved boulder opened a
short cut the long way round already reached.

**Why this is the right pillar.** It keeps the typing inside the world.
It makes a quest a place and a line, which is what every lesson already
is. It gives the Motherload turn a form this game can afford: no boss, no
dialogue, just a word the voice asks you to type and a world that does
what you typed. And it is what a ten-year-old tells a friend about: "you
type *move* and the rock moves".

## 3. The channels: how a story can reach the player at all

| Channel | Language-free? | When (EN cols) | What it can carry |
|---|---|---|---|
| Word sets (15 word lessons, C3 to C22) | no | early to mid | recurring cryptic sets; the first "wait, again?" |
| Sentences (19 lessons, C7 to C24) | no | mid | a voice; the moment the person appears; the address to "you" |
| Pages (20, C22 on; 9 make completion) | no | late | Gazette (the machines), Letter (the office), Script (the replies), Almanac and Book (chosen to rhyme), Blueprint (the mechanism) |
| Posts: verbs at landmarks | the tell is; the verb is not | any | the quests, the route, the two words at the end |
| Props and landmarks (lamppost, sign, drum, crate, boulder, cairn) | yes | any | the tells, disguised as scenery |
| Machine states (lamp dark, breathing, lit; fire banked, working, starved) | yes | any | a machine that behaves as if worked by someone else |
| Sky: night, weather, the lantern, the night run | yes | any | tells that show only at night |
| The motif (three notes, unresolved) | yes | always | the signal; the one resolution at the true ending |
| The cards at the edges, the world taglines, the title's subtitle | no | edges | one planted line; a finish line that differs on the true route |
| Live stats in a template slot (hours, keystrokes, letters open) | shared | late | a letter that knows exactly how long you have been here |
| The second world (Open Range) | no | replay | the same story from the other end |
| The found works (*Typing Practice*) | yes | a start | a frontier somebody already built |

The strongest channels cost nothing: the drill line already *is* a message
from the machine, and the Letter is already a thing the player makes.

## 4. Concepts

Each gives the premise, the question the player chases, the voice, the
turn, the true ending, how the typed verbs fit, the first breadcrumb, and
where it breaks. Seven concepts, then the variations that are not spines.

### 4.1 The Relief (the one before)

**Premise.** The machines keep what is typed into them; the lines they show
are what they hold, and what they hold was typed by whoever sat here before
you. Early on it is worn to single words. As the frontier is rebuilt the
machines give back more, and it is a person: landed as you did, found the
machines dormant and older words in them, built everything up until every
machine hummed without them, and then had to decide what an operator does
when nothing needs them. (The word for the one who takes over your shift is
the *relief*. In Russian, *смена* is the shift, the change, and the one who
replaces you, in one word.)

**The question.** Who was here, what did they choose, and is it what I am
about to choose?

**The voice.** One person, unnamed (a name is a localization problem and a
community will name them anyway). First person, present tense, describing
the work you are doing as if doing it. Then the tense slips.

**The turn.** Companionable, then instructing, then asking. The late lines
send you to the rim; the last asks for something not obviously in your
interest.

**The true ending.** The route they marked, post by post, to the far edge,
and their unfinished letter, which you finish at the page machine.

**Verbs.** Theirs: the route is a chain of things they did (rolled a
boulder across a cut, stacked a cairn, left a boat in the reeds) and left a
word on, so the relief could do them again.

**First breadcrumb.** `listen` and `silent`, both typeable at C4, in the
same word lesson.

**Breaks.** One voice carries the game; if the writing is merely fine it is
a diary. Needs the environment layer and a second voice to breathe.

### 4.2 The Dispatch (the office that is made here)

**Premise.** You were sent. Letters from the office: cheerful, with quotas
and thanks; then pressing; then wrong. They address the previous operator.
They ask for what was already sent. They promise collection at the finish.
And the letters are a material the player manufactures (*Letter I, II,
III*). The office is the page machine. The office is what the machines say
when they want a hand on the keys.

**The question.** Who sent me, are they still there, and what is collected?

**The voice.** Formal, capitalised, numbered, never a question. Warm, then
hollow.

**The turn.** Letter II's numbered points are the player's own numbers
(hours typed, keystrokes, letters open: the template slot the finish card
already uses). Letter III calls the one before's marks on the rim *debris*
and asks you to clear them. That is Motherload's turn without a boss: the
guide sends you to erase the only other person who was ever here.

**The true ending.** Stop answering. The last page you type is the first
letter not written to you.

**Verbs.** The office's: `clear`, `dig`, `destroy`. Its quests are the
ominous ones, and they are all typeable.

**First breadcrumb.** The word *quota* cannot be typed until C21 (`q`), and
the office's register cannot exist before capitals (C8) and digits (C23).
So the office arrives late by construction, which is right: the first
voice the player hears must be the person, not the company.

**Breaks.** The company that turns is a worn trope (Motherload, FICSIT,
Aperture) and it slides into satire. The office must never be funny and
never be evil; it must simply not be there. Alone it is a spine with no
heart.

### 4.3 The Instruction (everything you type is an order)

**Premise.** Look at the sentence corpus as it stands: `start the engine.`
`read it again.` `learn it by heart.` `hold the door.` `don't stop now.`
`down tools; the day is done.` The frontier already speaks in the
imperative, and nobody asked who is giving the orders. In this concept the
lines are instructions, left by one operator for the next, and the player
has been following them since the first key. Later the instructions are
about the player. Later still they ask for things the player should
question.

**The question.** Who writes the orders, and what happens if I stop
following them?

**The voice.** Imperative, plain, second person. It never says *I*.

**The turn.** The one act of will in a game whose only action is typing
what you are shown is to not type it. The game cannot see a refusal, so the
turn is made visible another way: two rows at one place, two verbs, and the
player types one.

**The true ending.** The last instruction is `leave`.

**Verbs.** This concept *is* the verb mechanic: the world obeys orders, and
so do you. Every post is an order carried out.

**First breadcrumb.** The first imperative that is not about a machine:
`read it again.` (already in the corpus, typeable at C9).

**Breaks.** Pure instruction has no person in it, and a story with no one
in it is a manual. Its register is the right register for the one before's
early lines and for the office's quests; it is not a plot.

### 4.4 The Signal (what the machines are for)

**Premise.** Nobody has said what the pages are for. The frontier is not a
factory; it is a transmitter assembled one page at a time. The three
unresolved notes in every track are the signal it was built to send, and
the rim landmarks hold receivers that have been listening for an answer.
Every post faces the same way.

**The question.** What is being sent, to whom, and should it be?

**The voice.** Almost none. The environment tells it: alignments, a lamp
that breathes in the motif's rhythm, the Summit. The pages carry only what
a receiver caught.

**The turn.** The answer came long ago and was not for us; or the answer is
the word sets you typed at the start, played back.

**The true ending.** Learn the message and change it, which in this game
means which last page you type.

**Verbs.** `listen` at every receiver; `ring` at the crystal; the motif
played by typing.

**First breadcrumb.** The sign by the landing faces the rim, not the track.

**Breaks.** Sending a message into the dark goes grand and preachy fast,
and a signal has no one in it. Best as the language-free layer under
another spine, which is where the first pass put it and where it stays.

### 4.5 The Ore Below (what wants digging)

**Premise.** The deep raws at the rim's corners are not ore. The uranium on
the butte and the strange seam at the last mine are something the frontier
was built to reach, and the one before stopped at the last seam on purpose.
The voice feeding you quests comes from below and wants the last seam open.

**The question.** What is under the frontier, and why did they stop?

**The turn.** The quests were never about pages.

**The true ending.** Leave the last seam shut (which the game cannot
enforce, so it is a reading, not a mechanic).

**Verbs.** `dig dig dig`, `wake`, `feed`.

**Breaks.** This is Motherload's actual plot, and it is horror. The music
ruling forbids danger that arrives, and a thing below that wants out is a
thing that arrives. It survives only as the **cold reading** of a spine
that also has a warm one, never confirmed, and that is its right size: the
scariest thing in Iconoclasts is never on screen either.

### 4.6 The Loop (the one before is you)

**Premise.** Open Range is "one wide plain, every vein in a row". In this
concept it is canonically the earlier frontier, and the one before is the
player's own earlier self: the word sets the Frontier's machines hold are
what was typed at the Range's posts; the Frontier's first sentence is the
Range's last line. Nothing crosses in code (one save per world) and
everything crosses in the reader's head, which is the Iconoclasts effect.

**The variation that does cross.** Both saves live in the same browser
origin. One read-only flag (did the other world reach its true route?) is a
dozen lines of code, and it would let a second world *know*: its first
word set, or its last page, differs. This is Outer Wilds' trick exactly:
the only thing that carries over is what you know.

**The question.** Have I been here before?

**Breaks.** Half the players never open the second world, so the loop can
only ever be a layer, never the spine. The crossing flag breaks "nothing
crosses" (a design choice, not a law) and needs a ruling.

### 4.7 The Almanac (the record that includes you)

**Premise.** The frontier prints its own record: a Gazette of its news, an
Almanac of its days, Letters, Scripts, Blueprints of its machines. The
pages the player types late are entries about this place: its weather, its
seams, its operators. Then entries about the current operator, with the
player's real hours. Then an entry for the current operator's departure,
dated.

**The question.** Who is writing the record, and how does it know the
future?

**The turn.** The record is written by the page machine from what was typed
into it; it knows the future because the future is a page you have not
typed yet.

**The true ending.** You write the last entry.

**Breaks.** On the nose; a record that includes you is a trick that plays
once. Its good idea is that the page categories each have a voice, and the
Almanac and the Gazette are two of them. It folds into the spine as the
rule in 5.4.

### 4.8 Variations that are not spines

- **The Maker's voice** (the messages are from the author). It breaks the
  fourth wall the late addition wants intact ("inside the game world, not
  outside"), and a developer in the text is a joke on the second read.
  Allowed as one wink: an Almanac entry about the QWERTY story or the first
  typing tutor, true, with no name on it.
- **The ghost** is not a separate concept; it is 4.1's cold reading (5.1,
  fact 8).
- **The print works** (the pages are a book the one before was writing).
  Loses the power of "every machine hums without you". Its one gift stands:
  the finish has objects, the pages, and in v4 they are named.
- **The transmitter as the ending** (the launch sends the pages, never the
  operator). Depends on naming keeping a drive at the end of the tree. The
  spine below works with or without it; 6.7 says how.

## 5. Comparison, and the recommendation

| | 4.1 Relief | 4.2 Dispatch | 4.3 Instruction | 4.4 Signal | 4.5 Ore | 4.6 Loop | 4.7 Almanac |
|---|---|---|---|---|---|---|---|
| Uses the drill line as fiction | natively | yes | natively | weakly | yes | yes | yes |
| Typed verbs fit it | yes | yes, the ominous ones | it *is* the verbs | listen only | dig only | some | no |
| Language-free layer | some | little | little | most | some | some | none |
| Motherload turn | soft | strongest | the form of it | no | yes, too hard | no | weak |
| Outer Wilds environment | with 4.4 | no | no | yes | some | the replay | no |
| Rhymes with what happens to the player's hands | yes, exactly | partly | partly | no | no | yes | no |
| Second-run payoff | strong | medium | weak | strong | weak | strongest | weak |
| Risk | one voice must be good | satire | a manual | preachy | horror | half never see it | a one-time trick |

**Recommendation: a fusion with one spine, working title *The Shift*
(RU *Смена*).** 4.1 is the spine: one person, before you, in the machines'
memory, and the plot rhymes with the player's own hands learning to run
without them. 4.3 is its register: the one before speaks in instructions
until the person shows through. 4.2 is the second voice and the turn: the
office that is manufactured here. 4.4 is the language-free layer: the
posts, the motif, the lamps. 4.5 is the cold reading, never confirmed. 4.7
contributes the rule that each page category is a voice. 4.6 is the
second world, with the crossing flag as an open ruling.

The title works three ways and none is explained: the work shift, the
Shift key, and the shift of the voice from I to you. In Russian it works a
fourth: *смена* is also the relief, the one who takes over. In English the
pronoun *I* cannot be typed until Shift is bought (C8); **the person
appears with the capital.** In Russian я is a plain letter and arrives at
C13 with the past tense, so **the person appears with the past tense.**
Same beat, each course's own key; that is the model for every beat (6.9).

**The thesis, in one paragraph, for the writer.** The player spends twenty
hours making themselves unnecessary. Every engine bought is a lesson the
hands no longer need; that is what automation is here, and it is what
learning to type is. The one before did the same, finished, and found that
*every machine hums without you* is both the win and the loss. Two voices
wait for the relief at the end: the machines, which want a hand on the keys
(*keep the shift going*), and the one before, who left a route out and a
letter that says the other thing. The game does not choose. Free play
continues either way, and the finish card changes one line.

### 5.1 The plot in full (never told in this order)

Each fact with the channel that carries it, so the writer and the builder
read the same list.

1. **The machines run on language typed into them, and keep it.** The
   how-to-play card already says every machine runs on typing. The lines
   are what the machines hold. *Channel: the premise; the Blueprint pages
   late, as a mechanism described technically.*
2. **There have been several operators.** The oldest layer is worn to
   single words (the word sets), the next is sentences (the one before),
   and you will leave pages. Nobody says this; the register of each rung
   says it. *Channel: rungs.*
3. **The one before arrived by the same landing**, found three mines
   running (left for them as they were left for you) and a sign facing the
   rim instead of the track. *Channel: the sign prop by the landing; the
   three starting mines; a Script line.*
4. **The office wrote to them**: quotas, thanks, the promise of collection
   at the finish. They wrote back. The office never answered a reply.
   *Channel: Letter I; Script I.*
5. **The letters were always made here.** The office is the page machine,
   and the player makes Letter I, II and III with their own hands. Letter
   II's numbered points are the player's own hours and keystrokes. The
   office is what the machines say when they want a hand to stay. *Channel:
   the material list; Letter II's template slot; a Gazette line.*
6. **They finished. Every machine hummed without them. Nothing came.**
   *Channel: Script II; the finish card's title, reread.*
7. **They understood, and typed a route out onto the rim for whoever came
   next**: a boulder rolled off a cut, a boat left in the reeds, a cairn, a
   plate under the ice, each with a word on it, each lighting a lamp, the
   last at the Summit. *Channel: the posts.*
8. **Where they went is never settled.** The warm reading: they walked the
   route past the Summit and out. The cold reading: engines run on stored
   typing and it runs down; they stayed to keep the hum, and the lamp that
   breathes at the Summit relic at night, in the motif's rhythm, is them,
   still at it. Both maps hold evidence for both. *Channel: the relic; the
   Range's first line; Script III.*
9. **The office wants the marks cleared.** Letter III calls the route
   debris. At the cairn and at the Summit the office's verb stands in a row
   of its own: `destroy`. Typing it puts the lamp out. Another verb relights
   it. *Channel: Letter III; the posts' second rows.*
10. **The deep seams are the thing the office asks for most and the one
    before never dug.** Uranium on the butte, the strange ore at the last
    mine. The tree needs them for the extended lessons only, so the
    completion never asks. *Channel: Letter III; the seams' placement; a
    Blueprint.* Never confirmed.
11. **You are the relief.** On the true route the last post sells their
    unfinished letter, and the last page you type at the page machine is
    it, finished. The finish card's one line differs. The motif resolves
    for the first and only time. *Channel: the Summit's `listen` row; the
    completion; the music.*
12. **What you typed at the posts is what the machines will give the next
    operator.** In code nothing crosses worlds (or one flag does, 6.8); in
    the reader's head everything does.

### 5.2 The question chain (what the player is chasing, by hour)

The Outer Wilds shape: a question leads to a place, the place answers it
and asks the next one.

| Roughly when (EN) | The question | What answers it |
|---|---|---|
| the first night | why is that one lamp dark, and why does the sign face the hills? | nothing yet; the hook |
| C4, hour 1 | why do `listen` and `silent` keep coming back? | the word sets, by recurrence |
| C6, hour 2 | what does the sign say? | the first post: `read` |
| C8 to C11, hours 4 to 10 | who is "I"? who was here? | the sentences; the person appears |
| C9 to C14, hours 7 to 17 | where does the route go? | the posts, one land at a time, lamps lighting |
| C22 to C24, hours 19 to 21 | who is the office, and how does it know my hours? | Letter I and II; the material list |
| C25 to C26 | which voice do I answer? | the Summit: `listen` or `destroy` |
| the finish | what does "every machine hums without you" mean now? | the one line that changed |
| never | what runs the engines when nobody is here? | nothing, on purpose |

### 5.3 Never explained (the wiki list)

One rule from the music plan applies to the whole story: **one thing is
never accounted for.** The rest is answerable by a careful second run.

Answerable: who typed the oldest words (an earlier operator, by register);
why the three starting mines run (left running, as yours will be); what the
office is (the page machine, by the material list and the numbers it
knows); whether the one before left or stayed (both, by design, from the
two maps and the relic); what the pages are for (the Range answers it).

**Never: what runs the engines when nobody types.** This is the game's
real mystery, because it is the one the player is living (their hands run
without them now, and nobody can say where that went). Both readings in
fact 8 rest on it, so it must stay open for both to stay open. (The first
pass proposed "where the frontier is and why the iron is steampunk" as the
never; keep that unexplained too, but it is a setting, not a question.)

### 5.4 The voices, told apart without names

Three voices, and a reader can tell them apart by craft alone, in any
language:

- **The machines** (the Gazette, the word sets, the drill's own register):
  third person, present tense, never *I*, never a question. The current EN
  page rule ("the frontier speaks in the third person; never the pronoun
  I") is this voice's rule and stays for the Gazette.
- **The one before** (the sentences, the Scripts, the posts' lines, the
  last page): lowercase until capitals exist, first person once it can
  be, past tense creeping in, and it asks questions. The only voice that
  ever says *you*.
- **The office** (the Letters): capitalised, numbered, formal, never a
  question, never *I*. It arrives only when the keys for its register
  exist (capitals C8, digits C23), which is why it is a late voice by
  construction.

The categories carry the voices: Gazette for the machines, Letter for the
office, Script for the one before's replies (a dialogue page is a script:
OFFICE / OPERATOR, the office's lines being the letters' lines and the
operator's the replies never sent), Blueprint for the mechanism, and
Almanac and Book for real texts chosen to rhyme (6.5).

## 6. The drip: how The Shift reaches the player

A sketch to argue with, on the EN columns as they stand. RU is parallel
column for column (the two plans share ids), so a beat placed at an EN
column lands at the same RU column with a different word.

### 6.1 The timeline by column

| Columns | What the player types | What the story does |
|---|---|---|
| C1 to C2 | streams, syllables | nothing. Not one wink. A beat here costs the lesson. The environment speaks instead (6.3). |
| C3 to C7 (words from C3; hours 0 to 4) | word lists | three or four sets recur across lessons (6.2). Rule: every story set must also be the best pedagogical set for its keys, or it does not go in. The sign's `read` row opens at C6. |
| C7 to C14 (sentences from C7; hours 4 to 17) | short sentences, then clauses | the voice, impersonal and imperative at first (`the wheel slows when the hands stop.`), then *I* with Shift at C8, then the tense slips (`i was here` needs `w`, C11), then the address (`you will find my words too.`). The middle posts open as their verbs do. |
| C15 to C22 (questions, dialogue, mixed) | longer, punctuated | the one before asks questions now. The first oblique naming of a post: `the lamp that will not light.` The Summit's `listen` row has been open since C4; its lamp has been breathing since the first night. |
| C22 to C26 (pages; completion at C26) | Gazette, Letter, Book, Almanac, Script, Blueprint | the three letters, escalating; the scripts are the replies; the Gazette is the machines; the Blueprint describes the engine; the Book and Almanac rhyme. Letter III sends the player to the rim with `destroy`. The last page differs on the true route. |
| C27 to C31 (the advanced half, extended keys) | more of everything | free play's pages; the story is done and keeps echoing. |

### 6.2 The recurring word sets (candidates, key-checked)

Every word below is typeable at the column named, from that column's
alphabet in `docs/tree-v4-en.json`. The final sets must still pass the
lesson's own pool rules; these are the ones to try first.

| Opens | EN candidates | RU candidates (same column's keys) |
|---|---|---|
| C4 (`s l a h e i t n`) | `listen` · `silent` · `shine` · `hints` (two anagrams in one set: the best sequencing drill there is, and the first breadcrumb) | `нас нет` · `нет сил` · `тени` (C3) |
| C5 (`+ d o`) | `not alone` · `hold on` · `old hands` · `done` · `idle` | `он не один` (needs д, C7 in RU; use `нас нет` again) |
| C6 (`+ r u`) | `rust` · `ruin` · `return` · `hours` · `unseen` | `верни` · `не спи` |
| C7 (`+ c m .`) | `the same hands.` · `once more.` · `machine` · `silence` | `смотри.` · `помни.` |
| C9 (`+ g y`) | `stay` · `gone` · `again` · `long ago` · `dig` | `руки` · `кто тут` |
| C11 (`+ f w`) | `who was here` · `wait` · `follow` · `wrong way` · `left` | `кто тут был` (C13) |
| C13 (`+ b p`) | `deep` · `below` · `breathe` · `page` · `people` | `я тут был` (gender: see 6.9) |
| C14 (`+ k`) | `keep` · `dark` · `awake` · `keys` · `look back` · `knock` | `стой` · `ломай` · `открой` · `я был здесь` |

By the third recurrence a player who reads what they type has a question,
and the sign (C6) is the first place that answers one.

### 6.3 The first night (language-free, before any word)

The environment starts the story in the first hour, long before the words
do, and costs the tutor nothing:

- **A seventh lamppost by the landing that never lights.** Six glow; the
  one before's does not. (Today all six lampposts carry `glow: true`; this
  is one prop with `glow: false`, and at night it is the only dark thing
  in a lit cluster.)
- **The sign faces the rim.** It stands at the landing today; turn it to
  face the peaks and the Summit, away from the track.
- **The relic at the Summit breathes at night.** A machine kind that
  cannot be built, standing on the far north-west high ground, its signal
  lamp breathing in the motif's rhythm (not the work beat, not the full
  beat; a third rhythm the sky layer does not otherwise use). Nobody can
  reach it early by accident; the player who walks the rim to look sees it
  from the shelf.
- **The first mine's lamp.** The first pass proposed a starting mine whose
  lamp breathes with nobody at it. Caution: `breathe` is already what a
  full machine's fire does, so a breathing unautomated mine reads as a bug
  to a player who has learned the lamp language. The relic carries the
  tell instead, where nothing else explains it.

### 6.4 The posts

A post in each ring land, the Summit last, and the sign in the basin
first. Each is an existing prop or landmark with a tell, a verb, an
effect, and a token. The next post's row is priced in the previous post's
token, so the chain orders itself without a flag. Verbs are placeholders
with their column checked; the bible fixes the beat, the course picks the
word.

| # | Land, place | The tell | Verb EN (col) | Verb RU (col) | What happens | Yields |
|---|---|---|---|---|---|---|
| 1 | basin, the sign by the landing | faces the rim; by the dark lamp | `read` (C6) | `смотри` (C7) | the line is the first set, read back: `listen. silent. not alone.` The sign's lamp lights. | token 1 |
| 2 | quarry, a boulder on the mesa's cut, above the flooded pit | a boulder where a path should be | `roll roll roll roll` (C6) | `кати кати кати` (C6) | the boulder rolls into the pit. A plate it covered carries the next line. | token 2 |
| 3 | canyon, the east crystal bench | a crystal that is the wrong colour | `ring ring ring` (C9) | `звони` (C14) | the three notes, played by the player for the first time. A lamp lights on the bench. | token 3 |
| 4 | bog, the reed lagoon | a boat in the reeds | `row row row` (C11) | `плыви плыви` (C11) | the boat crosses to the far bank: the one before's camp (a crate: `open`, C13 / `открой`, C14). | token 4 |
| 5 | flats, the badland butte | a scattered cairn beside the uranium | `stack stack stack` (C14) | `клади клади` (C7) | the cairn stands and its lamp lights. Later, a second row: `destroy` (C9) / `ломай` (C14), which the office asked for. | token 5 |
| 6 | peaks, the frozen tarn | a plate under the ice, seen only at night by the lantern | `break break break` (C14) | `ломи ломи` (C7) | the ice breaks; the plate's line is the first page the one before wrote. | token 6 |
| 7 | the Summit, the relic | its lamp breathes in the motif's rhythm | `listen` (C4) and, after Letter III, `destroy` (C9) | `слушай` (C16) and `сломай` (C14) | `listen` yields the unfinished letter. `destroy` puts the lamp out and yields the office's receipt; `light` (C9) / `свети` (C5) relights it. | the last page; or the receipt |

Rules the table obeys: nothing here is required (the finish needs no
post); every effect is reversible or opens nothing the course needs; a
post's row appears only when its verb's keys are open, and before that the
post is scenery with its tell; after a post is done its lamp stays lit, so
the rim brightens as the story is found and a returning player sees at a
glance what they have and have not read. At night the lit posts are the
route, drawn on the ground.

Six lands around the meadow and the Summit last: the ground the outskirts
ruling built "for a reason" is where the story's reasons go.

### 6.5 The pages

- **Letter I (C22, P-let-1).** Warm. A greeting, a quota, thanks, the
  promise of collection at the finish. Addressed to "the operator".
- **Letter II (C24, P-let-2, "a formal letter with numbered points, digits
  1 to 5").** The numbered points are the player's own: hours typed,
  keystrokes, letters open, machines standing. The letter knows.
- **Letter III (C26, P-let-3).** Addressed to the relief. Asks for what was
  already sent. Names the marks on the rim as debris to be cleared, and
  the deep seams as overdue.
- **Scripts I to III (C24, C25, C27).** OFFICE / OPERATOR. The office's lines
  are the letters' lines; the operator's are the replies that were never
  answered. Script III is the last reply, and it is addressed to you.
- **Gazette I to III (C22, C23, C25).** The machines talking, third person,
  present. The existing page corpus is already this voice (`The smelter
  never sleeps.`); it gains three lines that mean more the second time
  (`Every engine here runs on what was said to it.`).
- **Blueprint I to III (C26, C27, C28).** The engine, described as a
  mechanism: what it takes in, what it keeps, what it gives back when
  nobody is there. The cold reading's evidence, in the one voice that
  cannot be accused of meaning it.
- **Book and Almanac.** Real texts, public domain, chosen per course to
  rhyme and never to explain. EN: Melville's scrivener who would prefer
  not to copy. RU: Gogol's Akaky Akakievich, who copies for the joy of it.
  Two clerks, one who stops and one who cannot; each course gets the one
  its readers know by heart. Almanac entries on the telegraph, the
  lighthouse keeper, letters that were never delivered, the QWERTY story
  (the wink of 4.8, unsigned).

### 6.6 The Summit, and the choice

A fixed page is not a choice. The true route makes it one with no
dialogue: the Summit's `listen` row is priced in every earlier post's
token, and what it sells is the last page. Hold it when you buy the
completion and the page machine's final page is the one before's letter,
finished by you, instead of the office's. Both finish the game. The finish
card changes one line and nothing else. No branch, no flag, no gate: a
price, paid or not.

The office's `destroy` is the other row at the same place, and it is the
turn made of one word: the voice that fed you quests for twenty hours asks
you to put out the last lamp, and the game will let you. The lamp can be
relit. What cannot be undone is that you now know which voice asked.

### 6.7 The finish lines

As it stands: *Every machine hums without you* / *Keep the shift going*.

On the true route the title stays (it is true either way) and the second
line is the one before's, not the machines': a line that says the relief
has come, in the voice that says *you*. The exact words are the writer's;
the constraint is that both lines must be true of the same screen. If the
naming pass keeps a launch at the end of the tree, the launch sends the
pages and never the operator, and the true route's last page is the one in
the drive; if it does not, nothing is launched and the pages are the
record. The story needs neither.

And the music: the three-note motif, unresolved for twenty hours, resolves
once, on the true route's finish, and never again. Not a sting (the music
rules forbid one); a cadence. A player who has heard the question in every
track hears it answered exactly once.

### 6.8 The second world

Open Range tells the story from the other end. Two options from the first
pass, and a third:

- **The Range is where the one before came from.** Its word sets are their
  earliest words; its letters are the office's drafts.
- **The Range is where they went.** The route past the Summit leads here;
  its first sentence is the last line of the Frontier's true-route letter.
- **One flag crosses.** Both saves share the origin. A read-only flag (the
  other world's true route reached) changes one line in this one: the
  first word set, or the last page. Everything else stays per world. This
  is the Loop (4.6) at the smallest size it can have, and it is the
  strongest second-run payoff on the table. Needs a ruling because it
  touches "each world keeps its own save".

### 6.9 Localization is authoring, not translation

The story ships as a bible of beats. Each beat has: its purpose; the
column it lands on (the plans share columns, so this is shared); the keys
it may use (per course, from that column's alphabet); its language-free
tell if it has one; the voice (5.4); and a reference rendering in English
that is a target, not a text. Every course writes its own words to the
beat. The environment, the posts, the lamps, the motif and the live-stat
slots are shared and cost nothing per language.

Where the courses must differ, by construction:

| Beat | EN | RU |
|---|---|---|
| the person appears | the capital *I* with Shift (C8) | я with the past tense (C13) |
| the first "I was here" | `i was here` needs `w` (C11) | `я был здесь` / `я была здесь` (C14, with з): Russian cannot say it without a gender. Ruling needed: the one before is never gendered, and RU uses the forms that do not (present tense, imperatives, `мне`, `меня`, `здесь было тихо`). |
| the first verb | `read` (C6) | `смотри` (C7) |
| the office's register | capitals C8, digits C23 | capitals C8, digits C23, and the numero sign (C24) the office would love |
| the dialogue mark | the straight quote (C17) | the dash (C12) and the guillemets (C17): RU dialogue arrives five columns earlier, so the Scripts can start earlier in RU if the plan wants |
| the Book that rhymes | Melville's scrivener | Gogol's copyist |

Names: none, in any language. The one before is unnamed; the office is
*the office* / *контора*; the next operator is *the relief* / *смена*.

### 6.10 Build notes (what the engine needs, in order of cost)

Nothing here is for now; it is so the plan is honest about size.

1. **Posts are crossings whose price is a line.** The crossing mechanic
   (one priced row at a place; paying changes the map) is the model. New:
   a price kind that is a typed line; a `verb` drill (the `words` grammar
   over a one-word pool with a repeat count); post state in the profile
   (`profile.posts`, done or not, per post id); props with two states
   (lamp dark / lit; boulder here / there; ice / water), which is a second
   frame per prop and a walkability update, the way a repaired crossing
   already does it.
2. **Story lines live in the plans.** `docs/lessons-v4-<course>.plan.js`
   already carries authored sentences per lesson and the page texts. A
   beat is an authored line tagged with its beat id; the build
   (`dev/lessons-v4-build.js`) checks every beat is placed, typeable at
   its column, and placed once. The bible is a file beside the plans.
3. **Template slots in a page.** The finish card already formats hours;
   Letter II needs the same for hours, keystrokes and letters open, at page
   time.
4. **Tells.** One `glow: false` lamppost; the sign's facing; the relic as a
   non-buildable machine kind with a third lamp rhythm in `js/sky.js`.
5. **The completion's last page.** When the completion is bought with the
   Summit's token in the bag, the final page's text and the finish card's
   second line differ. One check, two strings.
6. **The cadence.** One resolved variant of the motif, played once, on the
   true route's finish; `js/music.js` plays it as a tail, not a sting.
7. **The bot** plans from the tree and never sees a post; nothing to do.
8. **Thumbnails** are baked and show the map, never the story.
9. **The found works** (*Typing Practice*) start past every word and
   sentence beat; the posts, the tells and the pages carry the story on
   their own there. The found works are, diegetically, the one before's;
   a Gazette line can say so without saying so.

## 7. What to decide next

1. **The spine.** The fusion as sketched in section 5, or one of the seven
   alone.
2. **The never.** Proposed: what runs the engines when nobody types. (The
   setting stays unexplained as well.)
3. **Both readings kept.** Warm and cold, both evidenced, neither
   confirmed. Proposed: keep both; the relic carries the cold one.
4. **The office's `destroy`.** Keep it as the turn, with the relight verb
   making it safe; or drop the office's verbs and let the office only
   write.
5. **The second world**: which of the three in 6.8, and whether one flag
   may cross.
6. **The gender of the one before** (RU forces the question): proposed,
   none, in every course.
7. **Naming.** The story's nouns go to the naming pass before it finishes:
   the deep raws, the relic, the tokens, the pages' names if Gazette,
   Letter, Script, Almanac, Book and Blueprint are not final.
8. Then, after the lesson order and durations freeze: the beat bible, one
   row per beat with its column, keys, voice and tell, before any sentence
   is written. The word sets in 6.2 can be tried in the EN pools now; they
   cost nothing if they fail the pool rules.
