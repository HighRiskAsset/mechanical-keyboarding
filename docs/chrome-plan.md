# Chrome: the menu and HUD art plan (drafted 2026-09-16)

"Chrome" is everything on the page that is not the world canvas, the drill
line or the keyboard: the title / world picker, the top bar with its stats and
switches, and the overlay cards that share their skin (welcome, how to play,
settings, keyboard, rest, finish). The brief: make it feel like a game and not
a website, without turning into a Minecraft ripoff. Every artistic decision is
open, the palette included. The world's sprites stay pixel art and get their
own pass later; this plan does not touch them.

## The correction that matters

Three skins were tried on 2026-09-16 and all three were rejected: iron and
brass pixel plates ("an improvement", then "too much like a Minecraft ripoff",
HUD icons unreadable without words), FF6 blue windows with smooth type ("like
a website again", "a weird mix", "a scroll box"), and the same windows on a
full pixel grid ("none of this is acceptable").

All three changed the skin and none changed the skeleton. Every pass kept a
website's bones: a header bar with a wordmark on the left and controls on the
right, a page dimmed to black, and a centred modal card holding a heading, a
paragraph and a button. A skin on that skeleton is a themed website. What
reads as "game" in a game menu is mostly structure, not texture:

| Website tell (what we have)                       | Game pattern                                                |
|---------------------------------------------------|-------------------------------------------------------------|
| Wordmark in a header bar, always on screen         | Title art that owns the screen once, then gets out of the way |
| Modal card over a page dimmed 82% to black         | The world alive behind the menu; the menu sits in the world |
| Heading, paragraph, button                         | A short list of choices and a cursor; help is one line, on demand |
| Hover states                                        | A cursor that moves with the arrows; Enter picks, Escape backs out |
| Rounded cards, 1px borders, soft drop shadows      | Windows on the pixel grid: hard edges, no blur, no gradients |
| Georgia at eight sizes                              | One face, two sizes                                          |
| Stats as tiny caps labels in the header            | Readouts in the game's own font, in the game's frame, words attached |
| Emoji switches (speaker, note, gear)                | Drawn icons, each with its word                              |
| A container that scrolls                            | Everything fits, or it pages                                 |
| A bright meadow inside a dark blue page             | The frame takes its palette from the world                   |

So this plan changes the skeleton first, and treats the skin as one decision
made on a single mocked screen before anything is built.

## Rules that hold whatever skin is picked

1. **Structure before skin.** The title screen owns the whole viewport and
   has no header bar. In play there is no header bar either; the readouts
   live in the game's frame.
2. **Words on everything.** Every icon carries its word (beside it, or under
   the cursor). No wordless HUD.
3. **One grid, or none.** Chrome pixels are drawn at the same integer scale
   as the world, or the chrome is deliberately not pixel at all (direction A
   below). Never a smooth face next to pixel icons, never pixel windows with
   anti-aliased corners.
4. **Nothing scrolls inside a menu.** A card that does not fit pages, like
   the guide already does. One exception, asked for by the user on
   2026-09-17: the bag's panel, unrolled beside the pause menu, scrolls
   (docs/bag-view-plan.md). It scrolls whole rows and shows no scrollbar.
5. **No grey, no bevel, no blocky caps.** Those three are the Minecraft
   tell: grey stone buttons with a light top edge and a dark bottom edge,
   and a square 5x7 capitals font. Wood, iron, brass, enamel, paper and ink
   are all fine; grey slabs are not.
6. **The frame takes its palette from the world.** The world is a daylight
   meadow with warm dirt and dark iron machines. The night-train blue-green
   page is the single biggest reason the canvas reads as a picture embedded
   in a site. Whether the frame goes warm-dark or stays blue-green is a
   question below, but either way the frame and the canvas must read as one
   object.
7. **Keyboard and drill line inherit and do not change.** They were never
   criticised. They take the frame's colours and nothing else.
8. **Chrome stays DOM.** Localised text (EN and RU), focus, screen readers
   and the bot's hooks all depend on it. Pixel skins are done with 9-slice
   PNG border images at integer scale and a bitmap face served as a webfont,
   not by moving menus into the canvas.
9. **Acceptance test.** A screenshot with the browser cropped off should
   pass as a screenshot of a game. If it still needs a caption to say which,
   the pass is not done.

## Screen by screen (the skeleton, skin independent)

### The title (replaces the world picker card)

```
+---------------------------------------------------------------------+
|   the last-played world, live, panning slowly; the day clock runs    |
|                                                                     |
|              M E C H A N I C A L   K E Y B O A R D I N G            |  title art
|                                                                     |
|     +--------------------------+  +--------------------------+      |
|   > | [thumb]  THE FRONTIER    |  | [thumb]  OPEN RANGE      |      |  save slots
|     |  14 letters, 6 machines  |  |  untouched               |      |
|     +--------------------------+  +--------------------------+      |
|       one wide meadow, six lands around its rim                     |  the focused slot's line
|                                                                     |
|                          How to play                                |
|                          Settings                                   |  list rows, same cursor
|                                                                     |
|   [EN] [RU]   [QWERTY] [ЙЦУКЕН]                    (c) 2026 Fox Forger |
+---------------------------------------------------------------------+
```

- **Title art, not a wordmark.** The name is drawn once, by hand, as a PNG:
  pixel lettering at 3x or 4x with a brass highlight, or a painted sign,
  depending on direction. This is the single most "game" thing on the page
  and the one asset that is worth a real drawing.
- **Worlds as save slots.** One row per world: thumbnail, name, one progress
  line. The cursor sits on the last-played slot; Enter or Space begins. The
  "Begin" button goes. The tagline becomes one line under the row, shown
  for the focused slot only.
- **How to play and Settings are rows under the slots**, driven by the same
  cursor. Settings moves here from the gear button.
- **The language and layout switches stay** as the flag chips they are, in
  the bottom-left corner, out of the cursor's list (they change the page,
  not the game).
- **The explanatory paragraph goes.** "Each world keeps its own save" is one
  help line at the bottom edge, or nothing.
- **Behind the title: the live world**, dimmed a little at most. Not a black
  page. If a live world is not wanted, the welcome card's bench scene
  (mechanic, tree, machine) already exists and can be the backdrop.

### In play (the HUD)

```
+---------------------------------------------------------------------+
|  ACC 97%  32 WPM  STREAK 14  0:12          IRON ORE  38   COAL   12 |  one plate, two ends
|                                                                     |
|                       [ the world canvas ]                          |
|                                                                     |
|                     caption for what is in front of you             |
|                                                                     |
|              the drill line                                         |
|              the keyboard                                           |
|                                                       (c) 2026 ...  |
+---------------------------------------------------------------------+
```

- **The header bar goes.** The four readouts (accuracy, WPM, streak, at the
  keys) move into a plate on the canvas' top edge, drawn in the same font
  and on the same plate as the inventory panel that already lives top-right.
  Two ends of one strip. This is the change that makes the HUD look like
  the game's rather than the page's.
- **Words on the readouts**: ACC, WPM, STREAK, and the clock. Never bare
  numbers with icons.
- **Escape opens a pause menu**: Resume, Sound on/off, Music on/off,
  Settings, How to play, Change world. One list, one cursor, the world
  paused behind it. The three header switches become rows here. A mouse
  user gets the same list from a small drawn menu icon in the corner.
- **The frame around the canvas** (the letterbox margins, the space around
  the keyboard) is where the skin lives. Today it is flat night-train blue.
- Drill line and keyboard: unchanged, recoloured to the frame.

### The cards (welcome, guide, settings, keyboard, rest, finish)

- All use the one window component the title uses: hard edges, a drawn
  border, no shadow, no scrollbar. Settings is the longest and pages if it
  must.
- The welcome card keeps its four rules; that is the one list of prose in
  the game and it stays four lines.
- The finish and rest cards keep their scene art.

## The skin: three directions, none of them the three that failed

### A. The field notebook

References: Curious Expedition (pixel world, paper-and-ink chrome),
80 Days, Sunless Sea, Return of the Obra Dinn's logbook, Pentiment's margins.

Cream paper, ink, a brass corner or two, a rubber stamp for the title, ruled
lines for the readouts. The world is a map pinned to the desk. The chrome is
**deliberately not pixel**: ink drawings for icons, a period serif for text,
a typewriter face for the numbers. Ties straight into the story lore drip
(someone was here before you; the pages you print). Farthest from Minecraft
and farthest from anything tried today.

Risk: paper may read as "not a game" to the user either, and it contrasts
with the world instead of joining it. Rule 3 makes it work: nothing pixel in
the chrome at all.

### B. The mechanic's bench

References: SteamWorld Dig 2 and SteamWorld Heist menus, FF6's airship
interior and machine rooms, Machinarium.

Dark oiled wood, oxblood enamel, and brass fittings as trim, drawn as
pixel 9-slice windows from the machine kit's own palette. Readouts on a
brass plate with the words engraved. The title is a painted hanging sign or
a riveted brass nameplate on wood. The world's machines brought to the
frame.

This is the family pass 1 came from, which was called an improvement before
it was called Minecraft. The differences are the rule 5 list: no grey, no
stone, no bevel, no blocky caps; wood and oxblood surfaces with brass as a
one-pixel line; a proportional bitmap face with lowercase; a word on every
icon. Risk: the closest to a rejected pass.

### C. Modern pixel RPG chrome

References: Sea of Stars, Eastward, Chained Echoes, Owlboy, Celeste's
menus, CrossCode (the operator already borrows its idiom).

Flat, dark, warm windows with a two-pixel outline and one small corner
ornament, one accent colour, a clean proportional pixel face at 2x, a hand
or arrow cursor, and a lot of air. Ornament is minimal; the "game" comes
from the cursor, the list layout, the type and the live world behind.
Palette moves from night-train blue-green to a warm charcoal-brown with
cream ink and the existing brass, so the meadow reads as daylight in front
of it rather than a picture in a dark page.

Risk: it can read as generic pixel indie if the title art is weak. The title
art carries it.

### Recommendation

**C for the skeleton and the windows, with one piece of B for the title
art** (a drawn sign or nameplate), and the warm palette. C is the direction
that puts the most distance from Minecraft (no material rendering at all on
the buttons) while staying on the world's pixel grid, and it is the one
where structure does the work, which is where the three passes went wrong.
A is the bold alternative if the user's taste turns out to be "not pixel
chrome at all".

## The type question

The game's bitmap font (dev/gen/pixels.js, baked by dev/font.html) has
digits, marks and capitals in both scripts, and 5px capitals read as blocky
at any size the chrome needs. Options, in order of preference:

1. **Pixel Operator** (CC0, proportional, lowercase, Latin and Cyrillic,
   8px and 16px cuts). Served as a webfont at 2x. The safe pick for B or C.
2. Extend the game's own face with lowercase in both scripts and serve it as
   a webfont. More work and the result is ours; only worth it if Pixel
   Operator is judged wrong on the mock.
3. Direction A: a period serif and a typewriter face, no pixel type.

Never Press Start 2P or any square-capitals face (rule 5).

## Questions to settle before the mock

1. **References.** Which menus do you actually like? Screenshots of any game
   whose title screen or HUD feels right, pixel or not, and which part of
   them (the type, the windows, the layout, the palette). The three passes
   were guesses; the mock should not be.
2. **Direction:** A, B or C, or a fourth thing the references point at.
3. **Palette:** keep the night-train blue-green frame, or warm it to the
   world's dusk (charcoal-brown, cream, brass)?
4. **Title art:** drawn lettering (pixel), a painted sign, or plain type?
5. **Behind the title:** the live world, the bench scene, or plain?
6. **HUD readouts:** on the canvas' top edge as one strip with the inventory
   panel (the plan's default), or kept as DOM above the canvas in the frame's
   skin?
7. **Pause menu on Escape** replacing the header switches: yes or no?

## Decisions so far (2026-09-16, after the questions)

- **Reference register: modern pixel art in the Terraria and Stardew Valley
  vein**, not strict SNES pixels: classic pixels with modern rendering on
  top (soft light, vignettes, a live scene behind the title). The keyboard
  is vector-like and may stay so; the chrome may be pixel or not, as long
  as it does not mix the two in one element.
- **Direction: C with B's materials.** Dark walnut frames with brass rivets
  (the machine kit's palette brought to the frame), flat dark interiors,
  cursor-driven lists, words on every readout. Palette and title art were
  left to the implementer's discretion: warm umber page, cream ink, brass
  accent; the night-train blue-green is retired for the chrome.
- **Readouts stay at the top** (accuracy, WPM, streak, at the keys), on a
  plate that runs across the canvas' top edge; the inventory column hangs
  under its right end on the same wood.
- **The switches leave the screen.** Sound, music, sky, settings, the guide
  and change-world live in one menu, opened by Escape or a small drawn
  MENU icon at the right end of the strip. Nothing that is not needed every
  minute stays on screen.
- **The end state is a standalone app** (Electron or similar): the window is
  the game, so the layout owns the whole viewport and nothing reads as a
  page.
- **The mock is dev/chrome-mock.html**: title, play and pause screens, with
  toggles for panel skin (oiled / parchment), type (pixel: Pixelify Sans
  title + Tiny5 body, Latin and Cyrillic; smooth: Balsamiq Sans, Terraria's
  hand-drawn register) and language. The frames, cursor and gear are drawn
  at load by small pixel generators in the page, so a change of tone is a
  change of one table. The world behind it is a capture of the live canvas
  in assets/inbox (gitignored).

### Round 2 verdicts on the mock (2026-09-16)

- **Too much all-brown.** The page and the panel interiors went back to the
  night-train teal (the palette that was never criticised); walnut and
  brass are trim only, on the frames, the rivets and the cursor.
- **The pixel face is for the canvas, not the menus.** Blocky type in the
  menus read as Minecraft and was hard to read small. Every menu word is
  now a smooth face (Balsamiq Sans by default, Nunito as the alternative);
  the pixel face stays only in the in-canvas inventory column, where it was
  liked.
- **The title's pixel lettering was ambiguous** (C read as O, H as W, L as a
  backward J). The logo is a display face now: Alfa Slab One by default,
  Rye (wood-type, frontier signage) as the alternative.
- **No header in play at all.** The readouts moved into the pause menu as a
  stats row. One hovering menu icon (a drawn gear, top-left of the world,
  its word on hover) opens the same menu Escape does; the developer
  switches (settings, bot) appear beside it only when developer mode is
  on.
- **The keyboard and drill line stay as the game draws them today**: vector
  keycaps with Arial legends, Georgia for the line. They sit outside the
  fourth wall on purpose, and the user does not mind that they do not match
  the pixel look.

### Round 3 (2026-09-16): "much better"

- **Faces settled.** Nunito for every chrome word; the typed line stays in
  Georgia (Nunito runs too wide for text the player has to read letter by
  letter). Balsamiq Sans was liked too and stays as the fallback toggle.
  Alfa Slab One for the title, not Rye.
- **The warm and cool mix is liked; the exact pair is open.** The user is
  unsure yellow brass on teal is the ideal mix. The mock gained two
  toggles to settle it by eye: the metal (brass, aged brass, copper) and
  the cool side (teal, slate, forest). The recommendation is aged brass on
  teal: same pairing, the yellow taken down toward amber so it reads as
  old metal rather than gold on navy.

### Round 4 (2026-09-16): the yellow comes out of the text

- Of the metal and cool-side pairs, **brass on slate** was "okay"; brass is
  the title's colour; **Balsamiq Sans** won for the menus after all. The
  user's remark "you really seem to like yellow on dark" is the ruling
  that matters: yellow is not to be the colour of words.
- So the brass is now **only where it is metal**: the title lettering, the
  rivets, the cursor. Menu words got a **highlight colour of their own**,
  separate from the metal, with a toggle to compare: cream (the default:
  the current row simply goes brighter, and the only yellow on screen is an
  object), verdigris, oxblood, and brass for reference.
- Defaults now: slate page, brass metal, cream highlight, Balsamiq Sans,
  Alfa Slab One title.

## Build order (after the mock is approved)

0. **Mock first, one screen.** A static page in dev/ (dev/chrome-mock.html)
   with the title screen in the chosen direction, using the real thumbnails
   and the real strings in both languages, touching no game file. Iterate
   there until it is approved. Then a second mock of the play screen with
   the HUD strip. Nothing in the game changes before both are approved.
1. **Assets** in assets/ui/ (artist-owned, like assets/sprites): the window
   9-slice sheet, the cursor, the icons (sound, music, settings, guide,
   world, menu), the title art, the webfont.
2. **Skeleton**: the title screen replaces the picker; the header comes out
   of play; the readout strip joins the inventory panel on the canvas; the
   pause menu on Escape; the switches move to it. While the pause menu is
   up, the bag's panel unrolls beside it (docs/bag-view-plan.md).
3. **Cards** onto the window component, paged where needed.
4. **Verification**, silent (both audio switches and weather off): EN and
   RU; 1366x800, 1920x1080 and the 760px breakpoint; no scrollbar anywhere
   in a menu; the whole game playable from the keyboard (arrows, Enter,
   Space, Escape); the bot still runs; a cropped screenshot passes rule 9.

## Built (2026-09-17)

Steps 1 to 3 are in the game, as the round 4 mock showed them: the fonts in
assets/fonts, the frames, cursor and corner icons generated at load by
js/chrome.js (an artist's PNGs in assets/ui can replace them by pointing
the four CSS properties at files), the title screen over the live world
(boot loads the last world first), no header in play, the gear and the
developer icons in the world's corner, the pause menu on Escape with the
readouts and every former header switch, and every card on the window
frame. Cards opened from a menu close back to it. The typed line and the
keyboard are untouched apart from the palette. Not done: a drawn title PNG
(the slab face stands in), and the settings card still scrolls on a short
window rather than paging.

## Out of scope

The world canvas and every sprite in it, the in-canvas place and build
menus, the inventory panel's rows (they only get the shared plate and font),
the keyboard visualizer and the drill line beyond colour. The footer went
today: the passport and summary cards and their links are removed and the
colophon sits on the space bar's row at the bottom-right corner, taking no
height from the playfield.
