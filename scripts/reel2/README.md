# Reel 2

The showreel for X, about 30 s: the site's own footage and the cases'
recordings in the site's device frames, set in 3D and moved by a camera.
No words but “Hey! I’m Timur” at the start and “timur.design” at the end.

`comp.html` is the composition. Nothing in it plays on its own:
`renderAt(t, ft)` draws the moment t with every clip on the frame ft's own
picture, and `render.mjs` steps it a frame at a time. `sound.py` writes its
sound.

## Running it

1. Make the recording copy of the site and serve it, as for the first reel
   (`scripts/reel/README.md`, steps 1–3). Build it with two changes, then
   put the source back:
   - the head bruises but doesn't bleed: `MIN_IMPACT = 99` in
     `src/components/hero/blood/index.ts`;
   - it logs its sounds: first thing in `playImpact` (impactSound.ts) and in
     `playChime` (chime.ts), push the call into `window.__sfx`:
     `window.__sfx?.push({ k: 'head', t: performance.now(), f: window.__frame, impact, pan, blood: !!opts?.blood })`
     (for the glass `k: 'glass'`, with `pitch` and `level` from `opts`).
2. Record the plates with `scripts/reel/rec.mjs` (`hero`, and `outro` from
   the first reel's shots) and re-encode them as VP9 WebM (`-g 15`) into
   `<work>/site/reel2/` as `p-hero.webm` and `p-outro.webm`. The Kritika
   clips go there too, as `k-*.webm`, their drawn island painted out
   (`delogo=x=201:y=14:w=198:h=63`): the frame draws its own.
3. Log the plates' sounds: `node scripts/reel/rec.mjs hero <work>/hero.json`,
   and the same for `outro`. The shot runs as it was recorded, without the
   recording, and each knock and ring comes with the frame it lands on.
4. Put the composition next to the clips:
   `ln -s <repo>/scripts/reel2/comp.html <work>/site/reel2/comp.html`
5. Render: `node scripts/reel2/render.mjs <work>/reel.mp4`
   (about 25 min). `node scripts/reel2/render.mjs <out> 10 14 3 0` renders
   10–14 s at every third frame without blur, for a quick look.
6. The sound, with numpy, scipy, pedalboard, pyloudnorm and soundfile:
   `python scripts/reel2/sound.py <work>/hero.json <work>/outro.json <work>/sound.wav`
   (it prints each part's loudness where it plays).
7. Encode for X:
   `ffmpeg -i <work>/reel.mp4 -i <work>/sound.wav -c:v libx264 -preset slow -crf 14 -profile:v high -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 256k -movflags +faststart <out.mp4>`

## How it renders

- **Motion blur.** Each frame averages moments across 0.4 of its interval.
  How many depends on how far anything on screen moves in that time
  (`motion(a, b)` in the page): enough that no two copies are more than 2 px
  apart, up to 24. Where nothing moves, a frame is a single moment.
- **The footage stays sharp.** Within a frame every clip holds that frame's
  picture, and only the camera and what it moves blur. Clips seek to the
  middle of a frame: their frames are stamped to the millisecond, and a seek
  to exactly n/60 lands on the frame before every third time.
- **Held frames.** The phone recordings run at 55–57 fps with an empty
  1/60 s slot every so often, and some hold a frame or a few in the middle
  of a motion: there, the motion jerks. Each clip lists those slots (`skip`)
  and they are left out, so the motion runs evenly (across them the
  recordings move on by one ordinary step: the animation waited). List them
  with `node scripts/reel2/held.mjs <clip> <from> <to>` for the part of a
  clip the reel uses, again whenever an in-point changes.
- **Grain.** The renderer multiplies it into each finished frame (`GRAIN` in
  the page). In the page it doubled the time of every screenshot.

## The sound

An original track, 88.9 bpm, so that a bar (2.7 s) is a station and the
camera sets off on each downbeat; move one and move the other. It is soft
under the words and holds back while the head is thrown, builds as the page
pulls back, comes in as the camera sets off, drops out for the last screen
and comes home with the address. Over it, the site's own sounds where the
picture makes them: the head's knocks (its CC0 takes, `public/sounds`,
planned as `impactSound.ts` plans them, without the crunch, which goes with
blood) and the outro's glass (`chime.ts`'s synthesis, on the notes of the
chord). Air for each move of the camera, a riser and a drop, the diplomas
landing. Mastered to −14 LUFS, peaks under −1 dBTP.
