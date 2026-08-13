# Mechanical Keyboarding

Learn to touch-type English (QWERTY) or Russian (ЙЦУКЕН) by running a machine frontier. A typing
trainer wearing a factory game: you land among dormant machines in bright
anime-flavored pixel art, and every one of them runs on keystrokes.

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

Walk with the **arrow keys**, stand at a machine and **type** to run it,
**hold Space** to build, upgrade, collect, or deliver. Progress is saved in
your browser (localStorage).

No installation, no build step: plain HTML/CSS/JS with a vendored copy of
[PixiJS](https://pixijs.com/) (MIT) in `libs/`. All art is drawn in code —
there are no image assets. Interface in English or Russian; you type Russian
via your physical keys (no OS layout switch needed).

## Development

[DESIGN.md](DESIGN.md) is the design document and single source of truth.
The game is in active development; the current build covers the first
production tiers of a planned seven-tier curriculum.
