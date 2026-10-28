// Renders the composition (comp.html) a frame at a time into an MP4: for
// each frame, `sub` moments across half its interval (a 180° shutter),
// blended into one for motion blur.
//
//   node scripts/reel2/render.mjs <out.mp4> [sub=4] [from=0] [to=end] [step=1]
//
// The page is served with the recording copy of the site (scripts/reel/serve.mjs)
// at localhost:4400, as /reel2/comp.html. `step` > 1 skips frames, for a
// quick look.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';

const [out, subArg = '4', fromArg = '0', toArg, stepArg = '1'] = process.argv.slice(2);
const S = +subArg;
const STEP = +stepArg;
const FPS = 60;
const SHUTTER = 0.5;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
await page.goto('http://localhost:4400/reel2/comp.html', { waitUntil: 'load' });
await page.evaluate(() => window.ready);
const D = await page.evaluate(() => window.DURATION);
const from = +fromArg;
const to = toArg ? +toArg : D;
const cdp = await page.context().newCDPSession(page);

const vf = S > 1 ? [`tmix=frames=${S}`, `select='eq(mod(n\\,${S})\\,${S - 1})'`, `setpts=N/(${FPS / STEP}*TB)`].join(',') : 'null';
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String((FPS / STEP) * S), '-c:v', 'png', '-i', '-',
  '-vf', vf, '-r', String(FPS / STEP), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const first = Math.round(from * FPS);
const last = Math.round(to * FPS);
const t0 = Date.now();
let n = 0;
for (let f = first; f < last; f += STEP) {
  for (let k = 0; k < S; k++) {
    const off = S > 1 ? SHUTTER * (k / (S - 1) - 0.5) : 0;
    const t = (f + off) / FPS;
    await page.evaluate((t) => window.renderAt(t), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  n++;
  if (n % 60 === 0) console.log('frame', f, '/', last, ((Date.now() - t0) / n).toFixed(0), 'ms/frame');
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('done', n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
await browser.close();
