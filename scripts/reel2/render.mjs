// Renders the composition (comp.html) a frame at a time into an MP4, with
// motion blur: each frame is the average of moments across part of its
// interval (SHUTTER, a film camera's shutter), as many as its fastest motion
// needs for the copies to merge into one smear, and only one where nothing
// moves. The footage in it holds the frame's own picture across those
// moments, so only the camera, and what it moves, blurs.
//
//   node scripts/reel2/render.mjs <out.mp4> [from=0] [to=end] [step=1] [blur=1]
//
// The page is served with the recording copy of the site (scripts/reel/serve.mjs)
// at localhost:4400, as /reel2/comp.html. `step` > 1 skips frames and blur 0
// leaves the blur out, for a quick look. The output is an x264 CRF 10
// intermediate in BT.709, for the final encode.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import zlib from 'node:zlib';

const [out, fromArg = '0', toArg, stepArg = '1', blurArg = '1'] = process.argv.slice(2);
const STEP = +stepArg;
const BLUR = blurArg !== '0';
const FPS = 60;
const W = 1920;
const H = 1080;
const SHUTTER = 0.4; // of a frame's interval
const GAP = 2; // px at most between two moments of a smear
const MOST = 24; // moments in a frame, at most

// Chrome's screenshots: 8-bit RGB or RGBA, not interlaced.
function decodePNG(buf) {
  let pos = 8;
  let w = 0;
  let h = 0;
  let bpp = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bpp = { 2: 3, 6: 4 }[data[9]];
      if (data[8] !== 8 || !bpp || data[12] !== 0) throw new Error('unexpected PNG');
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const s = y * (stride + 1) + 1;
    const o = y * stride;
    const u = o - stride;
    if (f === 0 || (f === 2 && y === 0)) px.set(raw.subarray(s, s + stride), o);
    else if (f === 1) {
      for (let i = 0; i < bpp; i++) px[o + i] = raw[s + i];
      for (let i = bpp; i < stride; i++) px[o + i] = raw[s + i] + px[o + i - bpp];
    } else if (f === 2) for (let i = 0; i < stride; i++) px[o + i] = raw[s + i] + px[u + i];
    else if (f === 3) {
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? px[o + i - bpp] : 0;
        const b = y ? px[u + i] : 0;
        px[o + i] = raw[s + i] + ((a + b) >> 1);
      }
    } else if (f === 4) {
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? px[o + i - bpp] : 0;
        const b = y ? px[u + i] : 0;
        const c = i >= bpp && y ? px[u + i - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        px[o + i] = raw[s + i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
    } else throw new Error('bad PNG filter ' + f);
  }
  return { w, h, bpp, px };
}

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
await page.goto('http://localhost:4400/reel2/comp.html', { waitUntil: 'load' });
await page.evaluate(() => window.ready);
const D = await page.evaluate(() => window.DURATION);
const from = +fromArg;
const to = toArg ? +toArg : D;
const cdp = await page.context().newCDPSession(page);

const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(FPS / STEP), '-i', '-',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });

// The grain field (comp.html's GRAIN) over white: multiplying a frame by it
// is the same as laying the field over the frame with a multiply blend.
const grain = await page.evaluate(() => ({ svg: window.GRAIN.svg, opacity: window.GRAIN.opacity }));
const gp = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1 });
await gp.setContent(`<body style="margin:0;background:#fff"><div style="opacity:${grain.opacity}">${grain.svg.replace('<svg ', '<svg style="display:block" ')}</div></body>`);
const g = decodePNG(Buffer.from((await (await gp.context().newCDPSession(gp)).send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
const field = new Float32Array(g.w * g.h);
for (let i = 0; i < field.length; i++) field[i] = g.px[i * g.bpp] / 255;
await gp.close();

const sum = new Uint16Array(W * H * 3);
const frame = Buffer.alloc(W * H * 3);
const add = ({ w, h, bpp, px }) => {
  if (w !== W || h !== H) throw new Error(`screenshot ${w}×${h}`);
  for (let i = 0, j = 0; j < sum.length; i += bpp, j += 3) {
    sum[j] += px[i];
    sum[j + 1] += px[i + 1];
    sum[j + 2] += px[i + 2];
  }
};
const shot = async () => decodePNG(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64'));

const first = Math.round(from * FPS);
const last = Math.round(to * FPS);
const t0 = Date.now();
let n = 0;
let moments = 0;
for (let f = first; f < last; f += STEP) {
  const ft = f / FPS;
  const half = SHUTTER / 2 / FPS;
  // As many moments as keep the copies of the fastest thing within GAP of
  // each other across the shutter.
  let S = 1;
  if (BLUR) {
    const m = await page.evaluate(([a, b]) => window.motion(a, b), [ft - half, ft + half]);
    if (m > 0.5) S = Math.min(MOST, Math.ceil(m / GAP) + 1);
  }
  sum.fill(0);
  for (let k = 0; k < S; k++) {
    const t = S > 1 ? ft - half + (2 * half * k) / (S - 1) : ft;
    await page.evaluate(([t, ft]) => window.renderAt(t, ft), [t, ft]);
    add(await shot());
  }
  // The average, with the grain on it.
  const [gx, gy] = await page.evaluate((t) => window.GRAIN.at(t), ft);
  for (let y = 0, j = 0; y < H; y++) {
    const row = (y + gy) * g.w + gx;
    for (let x = 0; x < W; x++, j += 3) {
      const k = field[row + x] / S;
      frame[j] = Math.round(sum[j] * k);
      frame[j + 1] = Math.round(sum[j + 1] * k);
      frame[j + 2] = Math.round(sum[j + 2] * k);
    }
  }
  if (!ff.stdin.write(frame)) await new Promise((r) => ff.stdin.once('drain', r));
  n++;
  moments += S;
  if (n % 60 === 0) console.log('frame', f, '/', last, ((Date.now() - t0) / n).toFixed(0), 'ms/frame', (moments / n).toFixed(1), 'moments/frame');
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('done', n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's,', (moments / n).toFixed(1), 'moments a frame');
await browser.close();
