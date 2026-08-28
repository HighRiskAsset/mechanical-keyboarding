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

Pick a **world** first — *The Frontier* (one wide meadow to build in, six
lands around its rim, machines on surveyed sites) or *Open Range* (one flat
plain, every node in reach, no sites at all: build wherever the ground
allows) —
each keeps its own save, so nothing mined, built or unlocked carries over.
Then walk with the **arrow keys**, stand at a machine and **type** to run
it, **hold Space** to open the menu of the place you stand at — raise a
machine where you stand, open an ore vein, give a mine new keys, give a machine a
different recipe, automate it, feed or empty it, take it down again (arrows
choose, a tap of Space confirms, Escape closes; a caption under the map says
what the chosen row does). **Belts**: take a
machine's spool from its menu (the → row), walk to a machine that uses what
it makes — a green bar under a machine means it can take the belt, red
means it can't — and hold Space there to lay it (a green chevron bounces
over the machine when you're in the right spot); the route finds itself.
Hold Space anywhere else while carrying to drop the spool.
Everything is paid from what you have mined and made. Progress is saved in
your browser (localStorage), one slot per world; switch worlds from ⚙.

The map keeps its own weather and its own clock: about twelve minutes takes it
from dawn through dark and back, lamps and machine fireboxes light the ground
once the sun is off, and the sky works its way through clear, cloudy, rain,
storm, fog and snow on its own. None of it changes what the machines do, and
all of it can be turned down to Calm or off entirely from ⚙.

No installation, no build step: plain HTML/CSS/JS with a vendored copy of
[PixiJS](https://pixijs.com/) (MIT) in `libs/`. All art lives as PNG sprite
sheets in `assets/sprites/` (see the README there), originally baked from a
code generator kept in `dev/gen/` and editable by hand ever since: repaint a
sheet, reload the game.

Interface language and course language are independent axes: the interface is
available in English or Russian, and two courses are playable — Russian
ЙЦУКЕН and English QWERTY (each with its own frequency-built ladder over
the same tech tree, its own saves; switch from ⚙). The trainer maps your physical keys
itself, so you can drill a foreign alphabet without switching your OS layout.

## Deploying

Every push to `main` publishes the game to
https://mechanical-keyboarding.foxforger.com via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml). Only what the game
loads is uploaded: `dev/`, `docs/`, DESIGN.md and `serve.ps1` stay out of the
published site.

The transport is SFTP with the server's host key pinned in the workflow, not
FTP — the host serves a certificate valid for `*.hstgr.io` only, which can never
verify against this domain. Credentials live in the repository's Actions
secrets (`SSH_USER`, `SSH_PRIVATE_KEY`) and the workflow header documents
them; the upload path is written into the workflow itself, so moving the site
to another domain is a commit rather than a settings page nobody remembers to
change.

## Development

[DESIGN.md](DESIGN.md) is the design document and single source of truth.
The game is in active development; the current build covers the first
production tiers of a planned seven-tier curriculum.

Adding a language or layout is meant to be purely additive — a
`js/language-<code>.js` (frequencies, unlock order, words, glosses) plus a
`js/layout-<code>.js` (key geometry, shift rules, intrusion mapping). The
engine is layout-pluggable and should need no changes; if it does, that's a
bug against invariant 5 in DESIGN.md.

Adding a **world** is additive the same way: a `js/maps/<id>.js` that ends in
`MAPKIT.register({...})`, a script tag before `js/chain.js`, and a name and
tagline in `js/i18n.js`. The shared kit (`js/maps/kit.js`) gives a world
deterministic noise, blobs, wandering paths and the tile-field helper, so
biomes and coastlines can be shaped rather than drawn as rectangles.
`dev/map.html` renders any world to a PNG for review.

**Art is edited in `assets/sprites/`, not in code.** The game renders from
those PNG sheets and their JSON manifests (`js/sprites.js` loads them,
`js/tiles.js` composes terrain out of them); the folder's README explains the
format and the rules. The original code-drawn art survives as a generator in
`dev/gen/`: prototype new sprites or animation timing there and bake a
scaffold with `dev/bake.html` (writes to `assets/inbox/` for review; only
`?to=sprites` overwrites the live sheets, which are the artists' files).

**Every map edit ends with a thumbnail bake.** The picker's world thumbnails
are static files in `assets/maps/`, never drawn at run time — drawing them
live cost eighteen seconds of frozen main thread on every cold start. After
creating or editing a map, start the dev server and open
`dev/map-thumbs.html?save=1`; it writes `assets/maps/<id>.png` for every
registered world. Commit those PNGs with the map change. A new world also
needs its script tag added to that page.

## License

All rights reserved. © 2026 Fox Forger, Digitalis LLC.

The repository is public to read, but nothing in it is licensed for reuse:
how this gets distributed is a decision still to be made rather than one
already taken. The vendored copy of PixiJS in `libs/` is not ours to withhold
and keeps its own MIT license, which travels with the file.
