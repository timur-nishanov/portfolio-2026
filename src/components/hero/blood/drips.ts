/**
 * Drips — the rivulet model of the approved offline render, stepped in real
 * time. A bead forms under its parent stain, sits pinned by the wall's
 * roughness until its weight (plus creep) beats the pinning, slips, slows on
 * the next rough spot, stops, slips again: stick-slip, not a constant crawl.
 * It loses volume into the trail it leaves (so it thins and finally stalls),
 * swallows small stains it runs into, and meanders a few pixels about its
 * column the way a real run does. The trail is recorded row by row and drawn
 * by the layer as a film that drains thinner with age.
 *
 * Units: offline pixels and seconds, event-local (origin at the contact).
 */
import type { Rng } from './rng';

const V_DRIP = 230; // px/s for a bead of RB_REF on clean glass
const RB_REF = 6.0;
export const V_MAX = 170;
const CREEP = 14; // static pinning relaxes with time (contact-angle hysteresis)
const SLIP_T = 0.18; // kinetic slip window after a release (lower pinning)
const TAN_WANDER = Math.tan((5 * Math.PI) / 180); // max drift off vertical once running
const HOLD_MAX = 0.75; // s: longest a pinned bead is held while the head hides it
const SUB = 1 / 240; // integration step

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** What a drip needs to know about the stains of its splash. */
export type DripStain = {
  id: number;
  x: number; // event-local offline px
  y: number;
  R: number;
  e: number;
  theta: number;
  mass: number;
  tl: number; // landing time (event clock)
  kind: string;
  absorbed: number; // event time it was swallowed (Infinity = never)
  /** cos / sin of theta, cached: the path tests probe bodies thousands of times */
  ct: number;
  st: number;
};

export type DripSource = {
  x: number;
  y: number;
  rb0: number;
  parent: number;
  tStart: number;
  cdep: number;
  run: number;
  kind: 'long' | 'stall';
  rbStop: number;
  wander: number;
};

type State = 0 | 1 | 2 | 3 | 4; // wait, form, stuck, move, stopped

export class Bead {
  x: number;
  y: number;
  y0: number;
  m: number;
  rb0: number;
  tStart: number;
  form: number;
  state: State = 0;
  tf = 0;
  stuck = 0;
  slip = 0;
  v = 0;
  vx = 0;
  vy = 0;
  alive = true;
  nofs: number;
  cdep: number;
  pend = 0;
  prate = 0;
  parent: number;
  tStop: number | null = null;
  tMove0: number | null = null;
  dist = 0;
  run: number;
  kind: 'long' | 'stall';
  wander: number;
  rbs: number;
  hold = 0;
  ymv: number | null = null;
  xmv = 0;
  wAmp: number;
  wLam: number;
  wPh: number;
  group: Set<number>;
  /** Trail: one entry per pixel row crossed (x, bead radius, time), in order. */
  rowsY: number[] = [];
  rowsX: number[] = [];
  rowsRb: number[] = [];
  rowsT: number[] = [];
  private lastRow: number;
  /** Where it sat a while, flat (y, rb, y, rb, …): the trail is a little wider there. */
  pauseMarks: number[] = [];
  // look and drying schedule (set by the layer)
  rot = 0;
  glp = 1;
  shape = { nd: -0.8, ns: 0.6, na: 1.6, ax: 1, skew: 0 };
  td0 = 1e9;
  td1 = 1e9;
  tMatte0 = 1e9;
  d0p = 2;
  wn: Float32Array;

  constructor(s: DripSource, rng: Rng, group: Set<number>) {
    this.x = s.x;
    this.y = s.y;
    this.y0 = s.y;
    this.rb0 = s.rb0;
    this.m = s.rb0 * s.rb0;
    this.tStart = s.tStart;
    this.form = rng.u(0.2, 0.3);
    this.nofs = rng.u(0, 200);
    this.cdep = s.cdep;
    this.parent = s.parent;
    this.run = s.run;
    this.kind = s.kind;
    this.wander = s.wander;
    this.rbs = s.rbStop;
    this.group = group;
    this.lastRow = Math.floor(s.y);
    // zero-mean meander about the start column: 1.7-2.5 px, λ 150-200 px
    const fr = (k: number) => (this.nofs * k) % 1;
    this.wAmp = (1.7 + 0.8 * fr(0.37)) * Math.min(this.wander, 1);
    this.wLam = 150 + 50 * fr(0.71);
    this.wPh = 2 * Math.PI * fr(0.13);
    // low-frequency width noise along the run (smoothed white noise, unit std)
    const n = 420;
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) raw[i] = rng.n();
    const out = new Float32Array(n);
    const R = 18;
    let ss = 0;
    for (let i = 0; i < n; i++) {
      let acc = 0;
      let w = 0;
      for (let j = -R; j <= R; j++) {
        const k = Math.min(Math.max(i + j, 0), n - 1);
        const g = Math.exp(-(j * j) / (2 * 81));
        acc += raw[k] * g;
        w += g;
      }
      out[i] = acc / w;
      ss += out[i] * out[i];
    }
    const sd = Math.sqrt(ss / n) || 1;
    for (let i = 0; i < n; i++) out[i] /= sd;
    this.wn = out;
  }

  get rb() {
    return Math.sqrt(Math.max(this.m, 0.01));
  }

  /** Visible bead radius (it swells in while forming). */
  get rbVisible() {
    if (this.state === 1) return this.rb0 * (0.35 + 0.65 * sstep(0, 1, this.tf / this.form));
    return this.rb;
  }

  get grow() {
    if (this.state === 1) return sstep(0, 1, this.tf / this.form);
    return this.state === 0 ? 0 : 1;
  }

  putRows(ya: number, yb: number, xa: number, xb: number, rb: number, ts: number) {
    const r1 = Math.floor(yb);
    for (let r = this.lastRow + 1; r <= r1; r++) {
      const f = (r - ya) / Math.max(yb - ya, 1e-6);
      this.rowsY.push(r);
      this.rowsX.push(xa + (xb - xa) * Math.min(Math.max(f, 0), 1));
      this.rowsRb.push(rb);
      this.rowsT.push(ts);
    }
    if (r1 > this.lastRow) this.lastRow = r1;
  }
}

/** Wall roughness: smooth noise plus sparse strong pinning sites (dried specks). */
export class Pinning {
  private seed: number;
  /** Extra sites placed on purpose (a pause on every long run), flat (x, y, amp, …). */
  extra: number[] = [];
  constructor(seed: number) {
    this.seed = seed >>> 0;
  }
  private hash(ix: number, iy: number, k: number) {
    // int32 all the way: no doubles to box on the hot path
    let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(this.seed, 1274126177) + Math.imul(k, 1103515245)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  private value(x: number, y: number) {
    // value noise on an 8 px lattice ≈ the offline's σ=5 gaussian-filtered noise
    const gx = x / 8;
    const gy = y / 8;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    let fx = gx - ix;
    let fy = gy - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = this.hash(ix, iy, 1);
    const b = this.hash(ix + 1, iy, 1);
    const c = this.hash(ix, iy + 1, 1);
    const d = this.hash(ix + 1, iy + 1, 1);
    const v = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    return (v - 0.5) * 3.4; // ≈ unit std
  }
  at(x: number, y: number) {
    let P = 2 + 0.6 * this.value(x, y);
    // one strong site per ~23 px cell (≈ the offline's 1 per 520 px²)
    const C = 22.8;
    const cx = Math.floor(x / C);
    const cy = Math.floor(y / C);
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const hx = cx + i;
        const hy = cy + j;
        const sx = (hx + this.hash(hx, hy, 2)) * C;
        const sy = (hy + this.hash(hx, hy, 3)) * C;
        const amp = 2 + 9 * this.hash(hx, hy, 4);
        const d2 = (x - sx) ** 2 + (y - sy) ** 2;
        if (d2 < 100) P += amp * Math.exp(-d2 / (2 * 2.5 * 2.5));
      }
    }
    const ex = this.extra;
    for (let i = 0; i < ex.length; i += 3) {
      const d2 = (x - ex[i]) ** 2 + (y - ex[i + 1]) ** 2;
      if (d2 < 120) P += ex[i + 2] * Math.exp(-d2 / (2 * 2.6 * 2.6));
    }
    return P;
  }
}

/** Normalised distance of (x, y) from a stain's body ellipse (1 = just past its rim). */
export function bodyD(c: DripStain, x: number, y: number, pad = 1.5) {
  const dx = x - c.x;
  const dy = y - c.y;
  const u = (dx * c.ct + dy * c.st) / ((1.25 * c.R) / c.e + pad);
  const v = (-dx * c.st + dy * c.ct) / (1.25 * c.R + pad);
  return Math.sqrt(u * u + v * v);
}

const touches = (c: DripStain, x: number, y: number, rb: number) =>
  Math.min(
    bodyD(c, x, y + 0.95 * rb),
    bodyD(c, x - 0.85 * rb, y + 0.5 * rb),
    bodyD(c, x + 0.85 * rb, y + 0.5 * rb),
    bodyD(c, x - rb, y),
    bodyD(c, x + rb, y),
  ) <= 1;

/**
 * Advance every bead of one splash by dt (event clock t → t + dt). `hidden`
 * tells whether the head currently covers a bead: a pinned bead is then held
 * (up to HOLD_MAX) so its release is seen rather than skipped behind the head.
 */
export function stepBeads(
  beads: Bead[],
  stains: DripStain[],
  P: Pinning,
  t: number,
  dt: number,
  onAbsorb: (stain: DripStain, t: number) => void,
  hidden?: (b: Bead) => boolean,
) {
  const n = Math.max(1, Math.ceil(dt / SUB));
  const h = dt / n;
  for (let s = 0; s < n; s++) {
    const ts = t + (s + 1) * h;
    for (let bi = 0; bi < beads.length; bi++) {
      const bd = beads[bi];
      if (!bd.alive) continue;
      if (bd.state === 0) {
        if (ts >= bd.tStart) {
          bd.state = 1;
          bd.tf = 0;
        }
        continue;
      }
      if (bd.pend > 0) {
        const dm = Math.min(bd.pend, bd.prate * h);
        bd.m += dm;
        bd.pend -= dm;
      }
      const rb = bd.rb;
      if (bd.state === 1) {
        bd.tf += h;
        const g = sstep(0, 1, bd.tf / bd.form);
        const yn = bd.y0 + 0.8 * bd.rb0 * g;
        bd.putRows(bd.y, yn, bd.x, bd.x, bd.rb0, ts);
        bd.y = yn;
        if (bd.tf >= bd.form) {
          bd.state = 2;
          bd.stuck = 0;
        }
        continue;
      }
      if (bd.state === 4) continue;
      const drive = rb;
      const yf = bd.y + rb * 0.85;
      const Pv = Math.max(P.at(bd.x - rb * 0.55, yf), P.at(bd.x, yf + rb * 0.15), P.at(bd.x + rb * 0.55, yf));
      if (bd.state === 2) {
        bd.stuck += h;
        if (rb < bd.rbs && bd.pend <= 0) {
          bd.state = 4;
          bd.tStop = ts;
          continue;
        }
        if (Pv - CREEP * bd.stuck < 0.85 * drive) {
          if (hidden && bd.hold < HOLD_MAX && hidden(bd)) {
            bd.hold += h;
            continue;
          }
          bd.hold = 0;
          if (bd.tMove0 !== null && bd.stuck > 0.12) bd.pauseMarks.push(bd.y, rb); // it sat there
          bd.state = 3;
          bd.v = 0.25 * V_DRIP * (rb / RB_REF);
          bd.slip = SLIP_T;
          if (bd.tMove0 === null) bd.tMove0 = ts;
        }
        continue;
      }
      // moving
      bd.slip -= h;
      const Peff = bd.slip > 0 ? Math.min(0.5 * Pv, 0.8 * drive) : Pv;
      const vt = Math.min(V_DRIP * (rb / RB_REF) * Math.max(0, 1 - (0.6 * Peff) / drive), V_MAX);
      if (rb < bd.rbs && bd.pend <= 0) {
        bd.state = 4;
        bd.tStop = ts;
        bd.v = 0;
        continue;
      }
      if (vt < 5) {
        bd.state = 2;
        bd.stuck = 0;
        bd.v = 0;
        continue;
      }
      bd.v += (vt - bd.v) * Math.min(1, h * 12);
      const dPdx = (P.at(bd.x + 3, bd.y + rb) - P.at(bd.x - 3, bd.y + rb)) / 6;
      if (bd.ymv === null) {
        bd.ymv = bd.y;
        bd.xmv = bd.x;
      }
      const runY = bd.y - bd.ymv;
      const ph = (2 * Math.PI * runY) / bd.wLam + bd.wPh;
      const xt = bd.xmv + bd.wAmp * (Math.sin(ph) - Math.sin(bd.wPh));
      const slope = ((bd.wAmp * 2 * Math.PI) / bd.wLam) * Math.cos(ph);
      const lim = runY > 18 ? TAN_WANDER : 0.16;
      let vxr = Math.min(Math.max(slope + (0.35 * (xt - bd.x)) / Math.max(rb, 3) - 0.03 * dPdx, -lim), lim);
      // capillary attraction: a wet stain just ahead pulls the bead into its body
      let bestDy = Infinity;
      let bestDx = 0;
      let bestReach = 1;
      for (let ci = 0; ci < stains.length; ci++) {
        const c = stains[ci];
        if (c.absorbed <= ts || c.tl > ts || c.R < 1.6 || bd.group.has(c.id)) continue;
        const dyc = c.y - bd.y;
        const reach = rb + (1.3 * c.R) / c.e + 6;
        if (dyc > -0.5 * c.R && dyc < 3 * rb + 1.4 * c.R && Math.abs(c.x - bd.x) < reach && dyc < bestDy) {
          bestDy = dyc;
          bestDx = c.x - bd.x;
          bestReach = reach;
        }
      }
      if (bestDy < Infinity) vxr = Math.min(Math.max(vxr + (0.25 * bestDx) / bestReach, -0.22), 0.22);
      const vx = bd.v * vxr;
      const vy = bd.v * Math.sqrt(1 - vxr * vxr);
      const xn = bd.x + vx * h;
      const yn = bd.y + vy * h;
      bd.putRows(bd.y, yn, bd.x, xn, rb, ts);
      const ds = bd.v * h;
      bd.x = xn;
      bd.y = yn;
      bd.vx = vx;
      bd.vy = vy;
      bd.dist += ds;
      bd.m -= bd.cdep * rb * ds;
      // swallow a lower stain it runs into (drained over ~5 frames, the bead speeds up)
      for (let ci = 0; ci < stains.length; ci++) {
        const c = stains[ci];
        if (c.absorbed <= ts || c.tl > ts || c.R < 1.6 || bd.group.has(c.id)) continue;
        if (Math.abs(c.x - bd.x) > rb + 3.2 * c.R + 4 || c.y < bd.y - 3.2 * c.R - 4) continue;
        if (!touches(c, bd.x, bd.y, rb)) continue;
        if (c.mass > 0.65 * bd.m) {
          // a comparable or bigger drop: flow into it and end there
          bd.state = 4;
          bd.tStop = ts;
          break;
        }
        c.absorbed = ts;
        onAbsorb(c, ts);
        if (bd.ymv !== null) {
          const php = (2 * Math.PI * (bd.y - bd.ymv)) / bd.wLam + bd.wPh;
          bd.xmv = bd.x - bd.wAmp * (Math.sin(php) - Math.sin(bd.wPh));
        }
        bd.pend += c.mass;
        bd.prate = c.mass / 0.085;
        const rbn = Math.sqrt(bd.m + bd.pend);
        bd.cdep = Math.max(bd.cdep, (2 * (rbn - bd.rbs)) / Math.max(bd.run - bd.dist, 25));
        bd.slip = SLIP_T;
      }
    }
    // bead-bead merging: the lower bead takes the mass
    for (let i = 0; i < beads.length; i++) {
      for (let k = i + 1; k < beads.length; k++) {
        const A = beads[i];
        const B = beads[k];
        if (!A.alive || !B.alive || A.state < 2 || B.state < 2) continue;
        if (Math.hypot(A.x - B.x, A.y - B.y) < 0.9 * (A.rb + B.rb)) {
          const lo = A.y > B.y ? A : B;
          const hi = A.y > B.y ? B : A;
          lo.pend += hi.m + hi.pend;
          lo.prate = (hi.m + hi.pend) / 0.085;
          if (lo.state === 4) {
            lo.state = 2;
            lo.stuck = 0;
          }
          hi.alive = false;
        }
      }
    }
  }
}
