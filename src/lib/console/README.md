# The console

A tiny 2D drawing contract for the project games. A game is a `GameProgram`
(see `types.ts`): `update(dt, input, time)` advances state, `draw(painter)`
paints the frame. Games never touch the DOM, timers, `Date`, or `Math.random`
(use `seededRandom` from `random.ts`). The stage calls `update` then `draw`
once per animation frame and renders the result at an era-dependent
resolution with GPU post-processing (pixelation, palette, CRT, bloom,
lighting, parallax, tilt). Games do not implement any of those effects. Without WebGL2 the stage falls
back to a Canvas 2D pipeline (`post/Canvas2DPostProcessor.ts`) that keeps
pixelation, palette and dither at console resolutions, scanlines, grille,
vignette, a cheap bloom and grain, and drops the tilt, parallax lighting and
aberration; games are unaffected.

## Coordinates and layout

- Logical space, y down, origin top-left. `painter.height` is always
  `LOGICAL_HEIGHT` (540). `painter.width` follows the viewport's aspect ratio
  and is typically 700–1300; design for ~960 and anchor HUD elements to the
  edges (`p.width - margin`, `p.height - margin`), like the DOM games did with
  absolute positioning.
- Text sizes, sprite scales and line widths are logical pixels. At the 8-bit
  stage the frame is rendered at 216 lines (0.4×), so text below ~14 logical
  px becomes unreadable there; use ≥ 16 for anything that must be read early.
- Layers: `p.layer(0)` background (sky, far scenery), `p.layer(1)` midground
  (default each frame), `p.layer(2)` foreground (HUD, dialogue). The stage
  applies parallax between layers in the modern era, so put depth where it
  makes sense. Call `p.clear(color, 0)` (or draw a full-frame gradient on
  layer 0) first; layers 1 and 2 start transparent every frame.

## Drawing

`rect`, `box` (fill/stroke/radius), `circle`, `ellipse`, `polygon`, `line`,
`gradient` (down/right/radial), `glow` (soft radial light), `sprite`
(pixel art: one char per art pixel, `.` transparent, `scale` logical px per
art pixel, default 4), `path` (an SVG `d` string with origin and scale, for
vector illustrations), `text` (one line; default align left, baseline top;
returns width), `textBlock` (word-wrap inside `maxWidth`; returns height),
`measureText`, and `push`/`pop`/`alpha`/`clip` for nested state.

Fonts: `'mono'` (default; the games' terminal look), `'serif'`, `'sans'`.
Emoji work in `text`. Use `shadow` for glow text instead of layering.

## Input

`input.pointer` is in logical coordinates with `justPressed` true for exactly
one frame; do hit-tests in `update`. `input.frame` carries the logical width
and height, so edge-anchored hit rects can be computed in `update` without
waiting for a `draw`. `keysJustPressed` carries `KeyboardEvent.key`
values; leave the arrow keys alone (the dialog uses them). Open links through
`host.openUrl(url)` from the factory's `host` argument, never `window`.

## Testing

`runProgram(factory, { seconds, fps, width, clicks, keys })` from
`runProgram.ts` drives a game headlessly with a `RecordingPainter` and returns
`errors`, every string drawn (`textsSeen`), the last frame's text positions,
and the URLs opened. Use it to assert the narrative plays through without
exceptions, that every line of the original script is drawn, that clicks and
links work, and that text stays inside the frame at widths 700 and 1300.
