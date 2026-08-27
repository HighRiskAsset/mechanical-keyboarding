# assets/sprites: the game's art, in PNG

Every pixel the game shows lives in these sheets. Edit a PNG, reload the
game, and the change is live: no code, no build step. The game is served by
`serve.ps1` at the repo root (`powershell -File serve.ps1`, then
http://localhost:8123/).

## How a sheet works

Each `name.png` has a `name.json` beside it. The JSON maps sprite names to
rectangles:

```json
"3.s.work": { "x": 120, "y": 44, "w": 26, "h": 22, "n": 4, "clock": "work" }
```

That is: at (120, 44) there are `n` = 4 frames laid left to right, each
26 wide and 22 tall. `n` missing means a single frame. Extra fields:
`clock` says which beat plays it (informational), `adv` is a glyph's fill
width (font.png), `dx`/`dy` are a crossing's draw offsets.

## Ground rules

- **Repainting in place is always safe.** Keep the cell size and position
  and you never need to touch the JSON.
- **Transparent stays transparent.** The engine composes edges, shadows and
  overlaps; a sprite's empty pixels are part of its shape.
- **Ground tiles must tile.** `ground.png` holds 4 variants per terrain
  kind: the same tile looking different, scattered by position. The engine
  cuts their edge transitions ("spills") out of these fills automatically,
  so paint the full 16x16 and the cliff tops, coastlines and path edges
  follow along.
- **The font's fill is a marker.** In `font.png`, pure `#ffffff` pixels
  take the text's colour at run time; every other pixel (the dark outline,
  any accent you add) stays exactly as painted.
- **No mirroring tricks.** West-facing machines, the operator walking left:
  each is its own row. Today they are mirrored copies; you are free to
  redraw them asymmetrically.

## Changing an animation

- **More frames:** widen the row in the PNG and raise `n` in the JSON.
  Frame counts are per animation; one machine can run a 6-frame work loop
  while the rest keep 4.
- **A new row or facing:** add the cells to the PNG and one entry to the
  JSON. Names follow the pattern of their neighbours.
- **A redo from scratch:** ask a developer to prototype it in the code
  generator (`dev/gen/`) and bake a scaffold into `assets/inbox/` for you
  to paint over. Nothing in this folder is overwritten by that.

## What not to do

- Do not rename or move files; `index.json` and the game load them by name.
- Do not run `dev/bake.html?to=sprites` once hand-edited art lives here:
  it regenerates sheets from the code scaffold and would overwrite your
  work. Plain `dev/bake.html` (no `?to=`) is safe; it writes to
  `assets/inbox/` for review.
- `index.json`'s `meta` block carries shared numbers (tile size, beat
  frame counts). Change them only together with a developer.
