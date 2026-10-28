// Records one shot of the reel: steps the page's clock a frame at a time
// (clock.js), drives the scroll and the pointer from the shot's script
// (shots.mjs), and pipes each frame into ffmpeg. See README.md.
//
//   node scripts/reel/rec.mjs <shot> <out.mp4> [frames]
//
// The site is served at localhost:4400 (serve.mjs). 1440×810 at a 4/3 pixel
// ratio: 1920×1080, 60fps; an x264 CRF 8 intermediate, for the assembly.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const [name, out, limit] = process.argv.slice(2);
const { shots, plates } = await import(path.join(here, 'shots.mjs'));
const shot = shots[name] ?? plates?.[name];
if (!shot) throw new Error('no shot ' + name);
const FPS = 60;
const DT = 1000 / FPS;
// 1440×810 at a 4/3 pixel ratio (1920×1080), or a shot's own ratio (a plate
// for the composition at 2: 2880×1620, room to zoom in).
const W = 1440, H = 810, SCALE = shot.scale ?? 4 / 3;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, reducedMotion: 'no-preference' });
await ctx.addInitScript({ path: path.join(here, 'clock.js') });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
await page.goto('http://localhost:4400' + (shot.path || '/'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const cdp = await ctx.newCDPSession(page);

const step = async () => {
  await page.evaluate((dt) => { window.__advance(dt); window.__syncAnimations(); return window.__syncVideos(); }, DT);
};
// The pointer: the page's own events, and the drawn cursor where it is.
let mouse = { x: -50, y: -50, down: false, shown: false };
const api = {
  page,
  async scroll(y) { await page.evaluate((y) => window.scrollTo(0, y), y); },
  async pointer(x, y, shown = true) {
    if (x !== mouse.x || y !== mouse.y) await page.mouse.move(x, y);
    mouse = { ...mouse, x, y, shown };
    await page.evaluate(([x, y, s]) => window.__cursor(x, y, s), [x, y, shown]);
  },
  async down() { if (!mouse.down) { await page.mouse.down(); mouse.down = true; } },
  async up() { if (mouse.down) { await page.mouse.up(); mouse.down = false; } },
  step,
};
// Settle: the page loads and hydrates (in real time, so the clock starts
// from the same state each run), then its intro plays out, unrecorded.
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
if (shot.setup) await shot.setup(api);
for (let i = 0; i < (shot.warm ?? 90); i++) await step();

const frames = Math.min(Math.round(shot.duration * FPS), limit ? +limit : Infinity);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '8', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  await shot.frame(f / FPS, api);
  await step();
  // The clip is in the document's coordinates: the screen is where the page
  // is scrolled to (at 0, 0 a scrolled page came out blank).
  const [sx, sy] = await page.evaluate(() => [scrollX, scrollY]);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: sx, y: sy, width: W, height: H, scale: SCALE } });
  if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 60 === 0) console.log(name, 'frame', f, '/', frames, ((Date.now() - t0) / (f + 1)).toFixed(0), 'ms/frame');
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log(name, 'done', frames, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
await browser.close();
