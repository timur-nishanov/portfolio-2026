# Reel

A short showreel of the site for X: calm, no hard cuts, about 27 s, ending on
the page's off-white with “timur.design”.

It is the site itself, recorded frame by frame. The page runs on a clock that
the recorder steps one frame at a time (`clock.js`), so the 60fps output is
exact however slowly the headless browser draws; the live head and the glass
draw in SwiftShader.

## Running it

1. Build the site and copy it to a working folder:
   `npm run build && cp -r out <work>/site`
2. Re-encode the clips as VP9 under their own names (the recording Chromium
   has no H.264):
   `cd <work>/site && ls mockups/*.mp4 random/*.mp4 cases/*/*.mp4 | xargs -P 4 -I{} <repo>/scripts/reel/transcode.sh {}`
3. Serve it with byte ranges: `node scripts/reel/serve.mjs <work>/site 4400`
4. Record a shot: `node scripts/reel/rec.mjs main <work>/main.mp4 [frames]`
   (about 0.15–0.5 s a frame).

The scroll positions in `shots.mjs` are for the layout at 1440×810. Re-measure
them if the layout changes.

## The plan

Shots joined with 0.7 s dissolves:

1. **main**, 16.5 s. The hero, where the cursor grabs the head: a squeeze, then
   release. Scroll down: Kritika parks with the chip on hover, then Urbantiger,
   then Chums. A click opens Chums out of the chip, and its page scrolls a little.
2. **awards**, about 3.6 s. Scroll 5653 → 6950; the diplomas come up.
3. **random**, about 3.4 s. Scroll 8100 → 9700.
4. **outro**, about 3.8 s. Scroll 12918 → 13418; the balls drop in.
5. **end card**, about 2.8 s. The page's off-white, with “timur.design” fading in.

Assembly: ffmpeg `xfade` (fade, 0.7 s), then H.264 at 1920×1080, 60fps,
`+faststart`.

## Where it stands

- **Done:** the clock, the recorder, the range server and the VP9 re-encode.
  The hero and the head grab record as planned.
- **Fixed:** frames came out blank after a scroll. The capture clip has to sit
  at the scroll offset.
- **Next:**
  - Check `main` through the cards and the case opening.
  - Write the other shots and the end card.
  - Assemble the reel.
- **First:** the new Kritika recordings go on the site, then the reel is
  recorded with them.
- **Note:** `GRAB` in `shots.mjs` is the head's position at 1.7 s, read off a
  test frame. Read it again if the hero changes.
