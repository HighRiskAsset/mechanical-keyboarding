# The whole bag while paused (planned 2026-09-17)

The side panel shows only the residents: the newest materials discovered, plus
whatever the thing in front of you names (DESIGN.md, "The panel is not the
bag"). That is right for play, where a player holds about 20 things in mind.
But a player who wants to know how much of something old they have has to
walk to something that names it. This plan lets the player read every
discovered material while the pause menu is up.

## The user's direction (2026-09-17)

- **The side panel itself does it.** While the pause menu is up the panel
  stays live, and it grows to the full height of the screen, top to bottom,
  over the keyboard, and scrolls as far down as the bag goes. No second
  window, no Bag row. The user called the side panel the natural place for
  this.
- **No name cut off.** The paused panel stretches wider, to the left, as far
  as the longest name needs.
- **The main inventory's order.** Newest discovered at the top, oldest (the
  first materials in the tree) at the bottom, discovered materials only.
- **An info line says where a material comes from**, never what uses it.

Superseded the same day: a separate bag window beside the pause menu, with
its own grid, cell layouts and paging. None of that is built.

## What this changes in earlier rulings, and what it keeps

The 2026-09-15 ruling listed scrolling and an inventory screen among the
things not taken, and chrome rule 4 says nothing scrolls inside a menu. The
user has now asked for the panel to scroll while paused. The exception is the
paused panel only, and it stays a view:

- **Nothing to manage.** No filters, search, tabs, dragging, dropping,
  discarding, pinning, or choosing what the panel shows in play. A row has
  nothing to press. The one control is the sort switch the user asked for
  later the same day (see "Sort switch and lesson line" below).
- **Play is unchanged.** Unpaused, the panel is exactly what it is today:
  residents, focus rows, `FACTORY.hudCapacity`, inside the canvas.
- **The pause list is unchanged** and still does not scroll.
- **Nothing is saved.** The panel follows `profile.seen` and `profile.bag`.

## Facts that size it

- **106 rows at most.** Both trees have 111 materials, and the 5 fluids never
  enter the bag (`hudKeys` already leaves them out).
- **Counts are at most three digits** (`CHAIN.TUNING.BAG_CAP` is 300).
- **The panel is canvas pixels.** `buildHud` in js/factory.js draws it with
  PIXI at the world's scale `S`: 68 world px wide (`HUD_W`), 14 per row
  (`HUD_ROW`), icon, name cut to fit (`fitName`, so "SUPERPOSITIO"), count,
  on a translucent plum plate, at the top-right of the world view.
- **The world canvas ends above the keyboard.** At 1366x800 it is about 475
  px tall and the panel shows 16 rows; the keyboard is DOM below it. A panel
  that runs to the bottom of the screen has to leave the canvas.
- **At full height** the panel has room for about 28 rows at 1366x800 (28 px
  a row at scale 2), so a full bag of 106 is about four screens of scrolling.
- **The factory does not stop while paused** (SIM keeps its own clock), so
  counts change and materials can be discovered while the panel is open.
- **The pause window** is `#overlay-card.pause`, 460 px wide, centred over a
  dimmed world. At 1366x800 it spans x 453 to 913; the panel sits at about x
  1110 to 1250, clear of it.

## How it looks and behaves

```
+----------------------------------------------------------------+-------+
|  the world, dimmed                                              |PROGRAM|  newest
|                                                                 |  300  |
|              +--------------------------+                       |EXCITED|
|              |          Paused          |                       |   12  |
|              |   97%   32   14   4:12   |                       |LETTER |
|              | > Resume                 |                     > |    4  |  cursor
|              |   Sound            off   |                       |  ...  |
|              |   ...                    |                       |  ...  |
|              |   Change world           |                       |  ...  |
|              |--------------------------|                       |  ...  |
|              | Letter I                 |                       |  ...  |
|              | Made at the Assembler    |                       |  ...  |  scrolls
|              | from Fuel Generator and  |                       |  ...  |
|              | Iron Filings.            |                       |  ...  |
|              +--------------------------+                       |  ...  |
|   the keyboard, dimmed                                          |  ...  |
|                                                                 |  v    |
+----------------------------------------------------------------+-------+
```

- **The same panel, unrolled.** On pause the panel keeps its right edge,
  plate, font, icons and first row where they were in play, and runs on down
  to the bottom edge of the screen, above the dim and above the keyboard.
  The rows are every discovered material, newest first. On resume it rolls
  back into the canvas and shows its residents again, scrolled to the top.
- **Scrolling.** It opens at the top, on the newest. The mouse wheel over the
  panel scrolls it, and the cursor scrolls it to stay in view. It moves a
  whole row at a time so no row is ever cut in half at an edge. The browser's
  scrollbar is hidden (a scrollbar inside a menu is a known dislike); a small
  pixel arrow at the panel's bottom edge, or its top, says there is more that
  way.
- **Live.** Counts change in place, a row still flashes when goods land in it
  or leave it, and a material discovered while paused comes in at the top.
  The lit marks for what the player was standing at stay lit, the same as in
  play.
- **Whole names.** The panel widens to the left until the longest name
  among its rows fits (today "ELECTROMAGNETIC CONTROL ROD", 128 world px
  against the 68 of play). Counts stay right-aligned under the names.
- **Narrow screens.** Wherever the pause window would reach the panel, the
  pause window moves left to clear it (16 px apart). Only when the window
  cannot move further left does the panel stop widening, and only then are
  the longest names cut, the way play cuts them. At 760 px wide that is a
  few of today's placeholder names; the naming pass (12 glyphs) ends it.

## The cursor and the info line

The pause list's cursor is DOM focus on its row buttons, moved by
`overlayCard.onkeydown`. The panel takes the same cursor:

- **→** from the pause list puts the cursor on the panel's top visible row.
  **←** or **Escape** takes it back to the list. Escape from the list resumes,
  as now.
- **↑ ↓** move row by row and scroll the panel to keep the row in view.
- **The mouse**: hovering a row puts the cursor there.
- **The cursor is the menus' brass hand**, just left of the row, pointing at
  it, as it points at a row of the pause list.

While the cursor is on the panel, the pause window's help line becomes the
info line: the material's full name, then where it comes from, read from the
tree (`madeBy` on each material and the recipe or mine it names). The line's
height is reserved, so the pause window does not change size when it swaps.
From today's English tree (placeholder names):

- An ore: "Iron Ore. Dug at the Iron Ore Mine."
- A good: "Copper Ingot. Made at the Foundry from Iron Ore and Copper Ore."
- A byproduct: "Screw. Comes off the Crusher making Iron Rod."
- A page: "Letter I. Made at the Assembler from Fuel Generator and Iron
  Filings."

Nothing about what uses it. With the cursor back on the list, the line is the
key help again.

The help line is recommended over a label beside the row because a label
there would need about 360 px to the panel's left, which at 1366x800 lands on
the pause window.

## As built (2026-09-17)

- **js/factory.js, `showLongHud` and its neighbours** (after `tickHud`): the
  unrolled panel is a `<canvas id="hud-long">` over the page, above
  `#overlay`, its right edge and first row on the in-canvas panel's pixel
  grid, as tall as the screen. Each frame it is redrawn from the same pieces
  the canvas panel uses: the plum plate (a touch more solid, since it lies
  over the dimmed keyboard), the marks, the flashes (`pulseInv` feeds both),
  the twinkling icons (`PIXELS.matCanvas`), and the 5 px font through
  `PIXELS.textCanvas` (now exported from js/sprites.js). `fitName` takes a
  width, for the narrow-screen cut. The world's panel is hidden while it is
  up and comes back on resume. It keeps no bag: the caller hands it the
  rows, their names and a count reader, and moves its scroll and cursor
  (`setLongHudKeys`, `fitLongHud`, `scrollLongHud`, `setLongHudCursor`,
  `longHudRowAt`, `hideLongHud`). An empty bag shows no panel, as in play.
- **js/app.js, "the bag unrolled beside the pause menu"** (after
  `refreshCorner`): `bagKeys()` is the one list, and `hudKeys` starts from
  it. `showPause` opens the panel (`placeBag`), which also pushes the pause
  window left when the names need the room. `showOverlay` for any other
  card and `hideOverlay` close it. The frame loop's `refreshBag` brings in a
  material seen while paused. The cursor is kept by material, so a new row
  at the top does not move it. Keys: → from the list, ↑ ↓ on the panel, ←
  or Escape back to the row the list left. The mouse: hover takes a row,
  the wheel scrolls whole rows (a notch or a trackpad's worth) and the row
  under the pointer follows. The menu's brass hand (`.bag-hand`) points at
  the cursor's row; the row is lit a shade.
- **The info line** is the pause window's help line (`#pause-help`), a box of
  fixed height (a name and two lines of source), so the window never changes
  size: the key help while the cursor is on the list, the name and
  `bagSource(mat)` while it is on the panel.
- **Strings** (js/i18n.js, EN and RU): `bagFromMine`, `bagFromMade`,
  `bagFromBy`, `bagAnd`; `pauseHelp` gained → bag / → сумка.
- **css/style.css**, after the pause menu's rules: `#hud-long`, `.bag-hand`,
  and the fixed-height help box.

## Sort switch and lesson line (user, 2026-09-17, after the first build)

- **The switch** is the panel's top line, where the first row stood in play;
  the rows start under it with a rule between, and it stays put while they
  scroll. It reads SORT NEWEST or SORT A-Z (ПОРЯДОК НОВЫЕ / ПОРЯДОК А-Я; the
  5 px font has no colon), label dim, setting bright, on a faint plate of its
  own. NEWEST is the tree's order, newest first, as before; A-Z sorts the
  names shown, in the interface language (`Intl.Collator`, numbers in names
  compared as numbers). ↑ from the first row puts the hand on it; Enter,
  Space or a click turns it and the list starts again from its top. Its info
  line says what the setting is and what turning it does. The choice is kept
  in `localStorage` as `mk.bagSort`, a matter of taste, never in the save.
- **The lesson line** is a third line in the info box, under where the
  material comes from, for information only. The first version printed the
  tree's bare tag ("Lesson E-02: syllables"); the user asked for the human
  version: the keys and what is typed, and then rejected the tree's word "over"
  ("syllables over S L A H") as not English; the keys are "typed with". It now
  reads, for example:
  - "Lesson I-01: the new keys S L, typed on their own"
  - "Lesson E-01: syllables typed with S L A H, mostly A H · al, ha, as"
  - "Lesson E-04: words about things, nature and home typed with S L E I T N,
    mostly T N · nine, line, lens"
  - "Lesson E-14: plain sentences ending in a period, mostly C M . ·
    “the sun is hot.”"
  - "Lesson P-let-1: a page of letters, grade 1 · “Dear Ann, I am writing
    from…”"

  js/app.js `bagLesson` reads the material's `madeBy` lesson and hands over
  its structured fields: the keys it opens, its letters (listed when eight
  or fewer, else counted), the keys it leans on (`focus`, "mostly"), its
  rung, the tag after "words:" or "sentences:", a page's genre and grade,
  and examples (up to three syllables or words, two phrases, the shortest
  sentence of more than one word if it is under 40 characters, a page's
  opening words). js/i18n.js `bagLesson` words it per interface language
  (English, and Russian with its plural of «буква»). Each key is marked so
  the line draws it as a small keycap (`keycapText`), so a comma or a quote
  key cannot be read as the sentence's punctuation. A sample that carries
  its own quotation marks is not wrapped in another pair. The Russian course
  gets its own keys and samples from its own tree. The info box's fixed
  height is 112 px, measured on the longest line (Ballistic Warp Drive,
  E-50) in both languages, so the pause window stays one height.

## Checked (2026-09-17)

The sort switch and lesson line, on a spare port's throwaway save (8177,
not the usual 8123 whose saves are the user's): the switch's label and
setting render in both scripts; ↑ from the first row reaches it and ↓ leaves
it; Enter, Space and a click each turn it; A-Z runs Alclad Aluminum Sheet to
Wire; the setting survives a reload; the pause window held one height (533
px) over the switch and all 106 rows in both orders, in English and Russian.

The first build:

Silent throughout (`mk.sound`, `mk.music`, `mk.weather` off on the test
port), on that port's own throwaway saves, developer mode's full bag
(Ctrl+Alt+M) and a hand-made six-material bag:

- 1366x800: the panel runs from the top of the screen to the bottom over the
  keyboard, 27 rows at a time, first row where it is in play; widest name
  whole at 128 world px; no overlap with the pause window.
- Full bag of 106: newest ("Program Listing") on top, Iron Ore on the bottom
  row after scrolling (top row index 79); the arrows at the edges show and
  hide with the scroll.
- Keys: → enters on the top visible row, ↑ ↓ walk and scroll, ← and Escape
  return to the row the list left (Music, when it left from Music); Escape
  from the list resumes and the world's panel is back with its residents.
- Wheel: 40 notches up reach the top; one notch moves 3 rows; small
  trackpad deltas add up to whole rows; the cursor follows the row under
  the pointer.
- A switch flipped from the list redraws the menu with the panel still up;
  How to play from the menu hides the panel and Escape brings both back.
- 1024x700: the pause window moves 18 px left, names whole. 760x600: it moves
  to the left edge and the panel stops at 120 world px, so the few longest
  placeholder names are cut. 1920x1080: scale 3, 24 rows, the window moves
  71 px left.
- Russian: the key help and every source line; the pause window's height
  held at 513 px across all 106 rows in both states.
- Six materials: six rows, full-height plate, the panel at play's own width.
- Not exercised: a material discovered while the menu is open (nothing in a
  test can land one without typing); the bot (it never opens the pause menu
  and the panel code is not on its path).
