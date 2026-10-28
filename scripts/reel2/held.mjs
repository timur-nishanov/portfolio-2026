// Lists a clip's held slots: the 1/60 s slots that show the same picture as
// the one before in the middle of a motion (runs of up to four, between two
// real changes). They make comp.html's `skip` lists.
//
//   node scripts/reel2/held.mjs <clip> <from s> <to s>
//
// A slot is what a seek to its middle shows, so a slot the recording left
// empty (the phone's recordings run at 55–57 fps) counts as held too.
import { execFileSync } from 'node:child_process';

const [clip, fromArg, toArg] = process.argv.slice(2);
const [w0, h0] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', clip])
  .toString().trim().split(',').map(Number);
const W = 160;
const H = Math.round((h0 * W) / w0 / 2) * 2;
const px = W * H;
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', clip, '-vf', `fps=60:round=near,scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
const n = raw.length / px;
// d[i]: how much changes from slot i to slot i + 1.
const d = new Float64Array(n - 1);
for (let i = 0; i < n - 1; i++) {
  let s = 0;
  for (let j = i * px, k = j + px; k < (i + 2) * px; j++, k++) s += Math.abs(raw[j] - raw[k]);
  d[i] = s / px;
}
const STILL = 0.25;
const MOVING = 0.8;
const held = [];
const lo = Math.max(1, Math.floor(+fromArg * 60));
const hi = Math.min(Math.floor(+toArg * 60), d.length - 1);
for (let i = lo; i < hi; i++) {
  if (d[i] >= STILL || d[i - 1] <= MOVING) continue;
  let j = i;
  while (j < d.length && d[j] < STILL && j - i < 5) j++;
  if (j - i <= 4 && j < d.length && d[j] > MOVING) for (let k = i + 1; k <= j; k++) held.push(k);
  i = j;
}
console.log(held.join(', ') || 'none');
