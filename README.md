# Mechanical Keyboarding

A **language-agnostic touch-typing trainer** wearing a factory game: you land
among dormant machines in bright anime-flavored pixel art, and every one of
them runs on keystrokes.

Any alphabet and keyboard layout can be plugged in as data. **Russian
(ЙЦУКЕН) is the first course** and the only one playable today; **English
(QWERTY) is next and is committed scope**, with further languages and layouts
expected after. Nothing about the game, the economy, or the pedagogy is
specific to Russian.

- **Typing is your power source.** Nothing advances without your keystrokes.
  As you advance, you'll unlock the ability to automate earlier machines.
- **Machines are lessons.** Each machine drills a letter set that lights up
  on the keyboard when you dock. Walking is the menu.
- **Materials are the curriculum.** Ores are letter groups; smelting,
  constructing, and assembling them mirrors how letters chunk into syllables,
  words, and sentences.
- **Accuracy beats speed.** New letters unlock for precision, not haste.

## Playing

Open `index.html` in a browser, or serve the folder locally:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

then visit http://localhost:8123.

Pick a **world** first — *The Frontier* (six lands, cliffs, closed
crossings) or *Open Range* (one flat meadow, every node in reach, room to
build) —
each keeps its own save, so nothing mined, built or unlocked carries over.
Then walk with the **arrow keys**, stand at a machine and **type** to run
it, **hold Space** to open the menu of the place you stand at — build a
machine on a plot, open an ore vein, give a mine new keys, automate it,
feed or empty it (arrows choose, a second hold confirms, a tap closes; a
caption under the map says what the chosen row does). **Belts**: take a
machine's spool from its menu (the → row), walk to a machine that uses what
it makes — a green bar under a machine means it can take the belt, red
means it can't — and hold Space there to lay it (a green chevron bounces
over the machine when you're in the right spot); the route finds itself.
Hold Space anywhere else while carrying to drop the spool.
Everything is paid from what you have mined and made. Progress is saved in
your browser (localStorage), one slot per world; switch worlds from ⚙.

No installation, no build step: plain HTML/CSS/JS with a vendored copy of
[PixiJS](https://pixijs.com/) (MIT) in `libs/`. All art is drawn in code —
there are no image assets.

Interface language and course language are independent axes: the interface is
available in English or Russian, and the trainer maps your physical keys
itself, so you can drill a foreign alphabet without switching your OS layout.

## Development

[DESIGN.md](DESIGN.md) is the design document and single source of truth.
The game is in active development; the current build covers the first
production tiers of a planned seven-tier curriculum.

Adding a language or layout is meant to be purely additive — a
`js/language-<code>.js` (frequencies, unlock order, words, glosses) plus a
`js/layout-<code>.js` (key geometry, shift rules, intrusion mapping). The
engine is layout-pluggable and should need no changes; if it does, that's a
bug against invariant 5 in DESIGN.md.
