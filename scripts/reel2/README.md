# Reel 2

The showreel for X, about 29 s: the site's own footage and the cases'
recordings in the site's device frames, set in 3D and moved by a camera.
No words but “Hey! I’m Timur” at the start and “timur.design” at the end.

`comp.html` is the composition. Nothing in it plays on its own:
`renderAt(t, ft)` draws the moment t with every clip on the frame ft's own
picture, and `render.mjs` steps it a frame at a time.

## Running it

1. Make the recording copy of the site and serve it, as for the first reel
   (`scripts/reel/README.md`, steps 1–3). For the reel the head bruises but
   doesn't bleed: build with `MIN_IMPACT = 99` in
   `src/components/hero/blood/index.ts`, then put the source back.
2. Record the plates with `scripts/reel/rec.mjs` (`hero`, and `outro` from
   the first reel's shots) and re-encode them as VP9 WebM (`-g 15`) into
   `<work>/site/reel2/` as `p-hero.webm` and `p-outro.webm`. The Kritika
   clips go there too, as `k-*.webm`, their drawn island painted out
   (`delogo=x=201:y=14:w=198:h=63`): the frame draws its own.
3. Put the composition next to them:
   `ln -s <repo>/scripts/reel2/comp.html <work>/site/reel2/comp.html`
4. Render: `node scripts/reel2/render.mjs <work>/reel.mp4`
   (about 25 min). `node scripts/reel2/render.mjs <out> 10 14 3 0` renders
   10–14 s at every third frame without blur, for a quick look.
5. Encode for X:
   `ffmpeg -i <work>/reel.mp4 -c:v libx264 -preset slow -crf 14 -profile:v high -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -an <out.mp4>`

## How it renders

- **Motion blur.** Each frame averages moments across 0.4 of its interval.
  How many depends on how far anything on screen moves in that time
  (`motion(a, b)` in the page): enough that no two copies are more than 2 px
  apart, up to 24. Where nothing moves, a frame is a single moment.
- **The footage stays sharp.** Within a frame every clip holds that frame's
  picture, and only the camera and what it moves blur. Clips seek to the
  middle of a frame: their frames are stamped to the millisecond, and a seek
  to exactly n/60 lands on the frame before every third time.
- **Grain.** The renderer multiplies it into each finished frame (`GRAIN` in
  the page). In the page it doubled the time of every screenshot.
