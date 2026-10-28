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

Shots joined with 0.7 s dissolves into 29.5 s (`assemble.sh`):

1. **main**, 13 s. The hero, where the cursor grabs the head: a squeeze, then
   release. Scroll down: Kritika parks with the chip on hover, then Urbantiger,
   then Chums.
2. **case**, 5 s. Kritika parked. A click opens its case out of the chip, and
   the page scrolls down to the app in hand.
3. **awards**, 3.8 s. Scroll 5653 → 6953; the diplomas come up.
4. **random**, 3.6 s. Scroll 8150 → 9600.
5. **outro**, 4.6 s. Scroll 12498 → 13418; the balls drop in.
6. **end**, 3 s. The page's off-white, with “timur.design” fading in at 56px,
   large enough to read in a phone's feed.

The first shot fades in from the off-white. The output is H.264 at
1920×1080, 60fps, CRF 14, with `+faststart` and no sound.

## Where it stands

Done: the reel is recorded and assembled, including the new Kritika
recordings. To make it again, run the steps above for each shot, then
`scripts/reel/assemble.sh <work> <out.mp4>`.

`GRAB` in `shots.mjs` is the head's position at 1.7 s, read off a test frame.
Read it again if the hero changes.
