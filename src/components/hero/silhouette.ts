/**
 * CPU copy of the head shader's outline, so the walls stop the head where it
 * is drawn. head.frag bends the silhouette — depth parallax (up to ~8% of the
 * plane), the squeeze, the swelling of fresh bruises — and colliding with the
 * texture's static box left a visible gap at every bounce (or let a swollen
 * cheek sink into the wall). This runs the shader's mapping, step for step,
 * on downsampled copies of the colour alpha and the depth, and finds the
 * outermost point at alpha 0.5 on the side that faces a wall.
 *
 * Cost control: Head3D only asks while the plane overlaps a wall; answers
 * are cached per side by the quantised uniform state; each scan line runs
 * only from the plane edge to the best edge found so far, then bisects; and
 * a query stops refining once it has spent its time budget.
 */

export type Side = 'l' | 'r' | 'b' | 't';
/** Outermost drawn point on one side, in plane UV (v up): `pos` along the side's normal, `at` across it. */
export type EdgeHit = { pos: number; at: number };
type Mark = { x: number; y: number; z: number };
type Map = { d: Uint8Array; n: number };

// Mirrors of head.frag's swelling — change them together or the contact
// drifts. (The parallax pivot and strength come from Head3D's own uniforms.)
const SWELL = 0.36;
const SWELL_RADIUS = 0.18;

const EDGE = 0.5 * 255; // the drawn edge
const ALPHA_RES = 1024; // a texel ≈ 0.5 px of a 550 px plane
const DEPTH_RES = 512; // depth is smooth
const ROWS = 40; // coarse scan lines across the head
const STEP = 1 / 160; // march step along a line (~3.5 px), then bisected
const BISECT = 7;
const BUDGET_MS = 1;
const PROBES = [-0.5, 0.5, -0.25, 0.25, -0.75, 0.75];
// Rows outside this band (plane UV) never hold head pixels: the texture's
// head spans v 0.21-0.78, widened for the squeeze (×1.39) and the parallax.
const BAND: Record<Side, [number, number]> = { l: [0.08, 0.92], r: [0.08, 0.92], b: [0.03, 0.97], t: [0.03, 0.97] };

const ss = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

function readMap(img: CanvasImageSource, n: number, channel: number): Map | null {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, n, n);
  const src = ctx.getImageData(0, 0, n, n).data;
  const d = new Uint8Array(n * n);
  for (let i = 0; i < d.length; i++) d[i] = src[i * 4 + channel];
  return { d, n };
}

/** Bilinear, 0..255, uv with v up (flipY texture), clamped like the GPU. */
function sample(m: Map, u: number, v: number) {
  const N = m.n;
  const fx = (u < 0 ? 0 : u > 1 ? 1 : u) * N - 0.5;
  const fy = (1 - (v < 0 ? 0 : v > 1 ? 1 : v)) * N - 0.5;
  let x0 = Math.floor(fx);
  let y0 = Math.floor(fy);
  const ax = fx - x0;
  const ay = fy - y0;
  if (x0 < 0) x0 = 0;
  if (y0 < 0) y0 = 0;
  const x1 = x0 + 1 < N ? x0 + 1 : N - 1;
  const y1 = y0 + 1 < N ? y0 + 1 : N - 1;
  const d = m.d;
  const r0 = y0 * N;
  const r1 = y1 * N;
  const a = d[r0 + x0] + (d[r0 + x1] - d[r0 + x0]) * ax;
  const b = d[r1 + x0] + (d[r1 + x1] - d[r1 + x0]) * ax;
  return a + (b - a) * ay;
}

export function createSilhouette({ depthPivot, tiltStrength }: { depthPivot: number; tiltStrength: number }) {
  let alpha: Map | null = null;
  let depth: Map | null = null;
  let px = 0;
  let py = 0;
  let sq = 0;
  let marks: Mark[] = [];
  const key = new Float64Array(3 + 6 * 3);
  const cache = {
    l: { key: new Float64Array(key.length).fill(NaN), hit: null as EdgeHit | null, row: -1 },
    r: { key: new Float64Array(key.length).fill(NaN), hit: null as EdgeHit | null, row: -1 },
    b: { key: new Float64Array(key.length).fill(NaN), hit: null as EdgeHit | null, row: -1 },
    t: { key: new Float64Array(key.length).fill(NaN), hit: null as EdgeHit | null, row: -1 },
  };

  /** Alpha (0..255) the shader draws at plane uv. */
  const shown = (pu: number, pv: number) => {
    let u = pu;
    let v = pv;
    if (Math.abs(sq) > 0.001) {
      u = (u - 0.5) * (1 + sq * 0.5) + 0.5;
      v = (v - 0.5) * (1 - sq * 0.28) + 0.5;
    }
    const k = (sample(depth!, u, v) / 255 - depthPivot) * tiltStrength;
    let du = u - px * k;
    let dv = v - py * k;
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i];
      if (m.z <= 0) continue;
      const rx = du - m.x;
      const ry = dv - m.y;
      const f = 1 - ss(0, SWELL_RADIUS, Math.sqrt(rx * rx + ry * ry));
      sx += rx * f * m.z * SWELL;
      sy += ry * f * m.z * SWELL;
    }
    du -= sx;
    dv -= sy;
    // clamp-to-edge reads the texture's transparent margin outside 0..1
    const direct = du >= 0 && du <= 1 && dv >= 0 && dv <= 1 ? sample(alpha!, du, dv) : 0;
    if (direct >= 0.6 * 255) return direct;
    const mu = 1 - du;
    const mirror = mu >= 0 && mu <= 1 && dv >= 0 && dv <= 1 ? sample(alpha!, mu, dv) : 0;
    const exposure = 1 - ss(0.35 * 255, 0.6 * 255, direct);
    return direct + (mirror - direct) * exposure;
  };

  /**
   * Outermost crossing on one line, searched only between the plane edge and
   * `limit` (the best edge so far — a line whose edge lies further in cannot
   * win). NaN when the line has nothing out there.
   */
  const scan = (side: Side, w: number, limit: number) => {
    const out = side === 'r' || side === 't' ? 1 : -1;
    const horiz = side === 'l' || side === 'r';
    const at = (s: number) => (horiz ? shown(s, w) : shown(w, s));
    let prev = out > 0 ? 1 : 0;
    let s = prev;
    while (out > 0 ? s > limit : s < limit) {
      if (at(s) >= EDGE) {
        let a = s; // inside
        let b = prev; // outside
        for (let i = 0; i < BISECT; i++) {
          const m = (a + b) * 0.5;
          if (at(m) >= EDGE) a = m;
          else b = m;
        }
        return (a + b) * 0.5;
      }
      prev = s;
      s -= out * STEP;
    }
    return NaN;
  };

  return {
    /** The decoded textures (the TextureLoader's own images, no second fetch). */
    setImages(colour: CanvasImageSource, depthImg: CanvasImageSource) {
      alpha = readMap(colour, ALPHA_RES, 3);
      depth = readMap(depthImg, DEPTH_RES, 0);
    },
    get ready() {
      return !!alpha && !!depth;
    },
    /** This frame's uniforms. */
    setState(pointerX: number, pointerY: number, squash: number, m: Mark[]) {
      px = pointerX;
      py = pointerY;
      sq = squash;
      marks = m;
      key[0] = Math.round(px * 512);
      key[1] = Math.round(py * 512);
      key[2] = Math.round(sq * 512);
      for (let i = 0; i < 6; i++) {
        const mk = m[i];
        key[3 + i * 3] = mk ? mk.x : 0;
        key[4 + i * 3] = mk ? mk.y : 0;
        key[5 + i * 3] = mk ? Math.round(mk.z * 128) : 0;
      }
    },
    /** Outermost drawn point facing `side`, or null before the maps are in. */
    edge(side: Side): EdgeHit | null {
      if (!alpha || !depth) return null;
      const c = cache[side];
      let same = true;
      for (let i = 0; i < key.length; i++) {
        if (c.key[i] !== key[i]) {
          same = false;
          break;
        }
      }
      if (same) return c.hit;
      c.key.set(key);
      const t0 = performance.now();
      const out = side === 'r' || side === 't' ? 1 : -1;
      const [lo, hi] = BAND[side];
      const rowW = (j: number) => lo + ((j + 0.5) / ROWS) * (hi - lo);
      let best = 0.5; // anything outward of the centre beats this
      let bestW = 0.5;
      let bestRow = -1;
      // last frame's winning line first: it usually still wins, and then every
      // other line only has to look at the sliver outside it
      const first = c.row >= 0 ? c.row : ROWS >> 1;
      for (let n = 0; n < ROWS; n++) {
        const j = (first + n) % ROWS;
        const w = rowW(j);
        const s = scan(side, w, best);
        if (Number.isFinite(s) && (s - best) * out > 0) {
          best = s;
          bestW = w;
          bestRow = j;
        }
        if (performance.now() - t0 > BUDGET_MS) break;
      }
      if (bestRow < 0) {
        c.hit = null;
        return null;
      }
      // peaks narrower than a line spacing (an ear, a tuft): probe between lines
      const dw = (hi - lo) / ROWS;
      for (const f of PROBES) {
        if (performance.now() - t0 > BUDGET_MS) break;
        const w = bestW + f * dw;
        const s = scan(side, w, best);
        if (Number.isFinite(s) && (s - best) * out > 0) {
          best = s;
          bestW = w;
        }
      }
      c.row = bestRow;
      c.hit = { pos: best, at: bestW };
      return c.hit;
    },
  };
}

export type Silhouette = ReturnType<typeof createSilhouette>;
