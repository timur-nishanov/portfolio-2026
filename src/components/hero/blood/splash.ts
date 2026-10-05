/**
 * One splash: the physics and bookkeeping of a single bloody knock, ported
 * from the approved offline render. The spray leaves the actual contact
 * point; its cone is the wall's inward normal leaning toward the head's
 * slide along the wall; size and speed follow the impact. Drops fly with
 * gravity and air drag (more for the small ones) and become stains where
 * they reach the back wall, behind the head. A few seconds in, the biggest
 * stains feed drips; then everything goes matte and darker, and erodes away.
 *
 * Everything is computed in "offline pixels" around the contact (the scale
 * the look was approved at) and mapped to the stage by k.
 */
import { makeRng, type Rng } from './rng';
import { KS, makeHero, makeHeroDrop, makeStain, warpRows, crownRows, peakOf, bodyBottom } from './stains';
import { Bead, Pinning, stepBeads, bodyD, V_MAX, type DripStain, type DripSource } from './drips';

export type Wall = 'l' | 'r' | 't' | 'b';

const FPS = 60;
const SHUTTER = 0.5 / FPS; // 180° shutter for the flight streaks
const GRAV = 2200; // px/s² in flight
const DEPTH = 130; // contact → back wall distance (sets the impact angle on the wall)
const TILT_GAIN = 0.7; // share of the incidence angle the cone leans along the wall
const CONE_HALF = (40 * Math.PI) / 180;
const MAXDIST = 325; // landings within this radius of the contact
const BURST_EXP = 2.64; // ejected volume ~ impact^2.64
const IMPACT_REF = 4.66;
// JS time a splash may spend per frame on work that can wait a frame
// (shapes of drops still in the air, the drip selection)
const BUDGET_MS = 1;

export type Timing = { life: number; kd: number; dry: [number, number]; shrink: number; diss: number };
// matte by `dry`, shrinking from `shrink`, gone at `life` (s after the hit)
const WALL: Timing = { life: 6.8, kd: 1, dry: [3.4, 4.4], shrink: 4.3, diss: 0.85 };
// the floor splash is smaller and drier, and leaves sooner
const FLOOR: Timing = { life: 4.35, kd: 0.45, dry: [1.4, 1.9], shrink: 1.85, diss: 0.6 };

const NORMAL: Record<Wall, [number, number]> = { l: [1, 0], r: [-1, 0], t: [0, 1], b: [0, -1] };

/** Stride of one stain kernel / plain kernel / flyer in the GPU buffers. */
export const K_STRIDE = 20;
export const P_STRIDE = 16;
export const F_STRIDE = 12;

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const clip = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

function ballistic(x0: number, y0: number, vx: number, vy: number, c: number, t: number, out = [0, 0, 0, 0]) {
  const E = Math.exp(-c * t);
  const k = (1 - E) / c;
  out[0] = x0 + vx * k;
  out[1] = y0 + vy * k + (GRAV / c) * (t - k);
  out[2] = vx * E;
  out[3] = vy * E + (GRAV / c) * (1 - E);
  return out;
}
const FA = [0, 0, 0, 0];
const FB = [0, 0, 0, 0];

type DropKind = 'hero' | 'comp' | 'big' | 'med' | 'small' | 'mist';
type Shape = { rows: number[]; c0: number[]; c1: number[]; glp: number; rot: number; d0: number; lnPk: number; pace: number };
type Drop = {
  kind: DropKind;
  R: number;
  r: number;
  ang: number;
  spd: number;
  T: number;
  dt0: number;
  off: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  c: number;
  tl0: number;
  tl: number;
  lx: number;
  ly: number;
  theta: number;
  e: number;
  nofly: boolean;
  rv: number;
  ramp: [number, number, number];
  done: boolean;
  shape?: Shape;
  /** Lands where the head is: flies behind it all the way. */
  behind: boolean;
};

export type Stain = DripStain & {
  rows: number[];
  d0: number;
  kStart: number;
  kCount: number;
  /** Stage-px box of everything this stain draws. */
  box: [number, number, number, number];
};

export type SplashInput = {
  wall: Wall;
  /** Contact on the wall, CSS px. */
  x: number;
  y: number;
  /** Head velocity into the wall, CSS px/s (y down). */
  vx: number;
  vy: number;
  /** 0..1: how hard the knock was, within the bleeding range. */
  strength: number;
};

/** Is the head over (x, y) (CSS px, radius r) now, or `ahead` seconds from now? */
export type HeadCovers = (x: number, y: number, r: number, ahead: number) => boolean;

/** Stage box (CSS px: x0, y0, x1, y1) no blood may land on: the page copy. */
export type KeepOut = [number, number, number, number];
// clearance (CSS px) kept between a stain or a drip and the copy
const KEEP_MARGIN = 6;

export class Splash {
  readonly timing: Timing;
  readonly floor: boolean;
  private k: number;
  private cx: number;
  private cy: number;
  private W: number;
  private H: number;
  private nx: number;
  private ny: number;
  private tx: number;
  private ty: number;
  private axis: number;
  private burst: number;
  private V: number;
  private rng: Rng;
  private aux: Rng;
  private seed: number;
  private drops: Drop[] = [];
  readonly stains: Stain[] = [];
  readonly beads: Bead[] = [];
  private pin: Pinning;
  private tSelect = Infinity; // set once all the drops exist
  private rRef = 1;
  private picker: Generator<void, void, void> | null = null;
  private covers: HeadCovers;
  // bound once: stepBeads calls them from its inner loop
  private onAbsorb = (st: DripStain, t: number) => this.absorb(st, t);
  private hidden = (b: Bead) => this.covers(this.cx + this.k * b.x, this.cy + this.k * b.y, (b.rb + 4) * this.k, 0);
  private order: number[] = [];
  private dripsChosen = false;
  private dripStains: DripStain[] = [];
  private keepOut: KeepOut[];
  // The drops are made over the first frames (see makeDrops): null once all
  // exist. `fresh`: the first update comes in the knock's own frame, which
  // already made the first batch.
  private builder: Generator<void, void, void> | null;
  private fresh = true;

  // GPU-facing data (the layer uploads it)
  kData: Float32Array;
  kCount = 0;
  kUploaded = 0;
  kPatches: [number, number][] = []; // ranges rewritten after upload (absorbed stains)
  pData: Float32Array;
  pCount = 0;
  fData: Float32Array;
  fCount = 0;
  /** CSS px box of all that is drawn this frame: x0, y0, x1, y1 (empty → x0 > x1). */
  box: [number, number, number, number] = [1, 1, 0, 0];

  constructor(
    inp: SplashInput,
    opts: { k: number; W: number; H: number; seed: number; density: number; covers: HeadCovers; keepOut?: KeepOut[] },
  ) {
    this.k = opts.k;
    this.keepOut = opts.keepOut ?? [];
    this.cx = inp.x;
    this.cy = inp.y;
    this.W = opts.W;
    this.H = opts.H;
    this.seed = opts.seed;
    this.floor = inp.wall === 'b';
    this.timing = this.floor ? FLOOR : WALL;
    this.rng = makeRng(opts.seed);
    this.aux = makeRng(opts.seed + 991);
    this.pin = new Pinning(opts.seed + 17);
    this.covers = opts.covers;
    [this.nx, this.ny] = NORMAL[inp.wall];
    this.tx = -this.ny;
    this.ty = this.nx;
    // the cone: inward normal, leaning with the head's slide along the wall
    const vix = inp.vx / this.k;
    const viy = inp.vy / this.k;
    const vn = -(vix * this.nx + viy * this.ny);
    const vt = vix * this.tx + viy * this.ty;
    const tilt = Math.min(TILT_GAIN * Math.atan2(Math.abs(vt), Math.max(vn, 1)), (35 * Math.PI) / 180);
    this.axis = Math.atan2(this.ny, this.nx) + (vt >= 0 ? 1 : -1) * tilt;
    // The site's knocks top out near 2.6 world units/s; the approved splashes
    // came from ~3.9-4.7 in the recording's units. Map the bleeding range onto
    // those, then use the offline laws: volume ~ impact^2.64, speed ~ impact^¼.
    const impEq = 3.9 + 0.76 * clip(inp.strength, 0, 1);
    const kImp = impEq / IMPACT_REF;
    this.burst = (this.floor ? 0.652 : 1) * kImp ** BURST_EXP;
    this.V = 2050 * Math.sqrt(impEq / 4.3) * kImp ** 0.25;
    this.pData = new Float32Array(512 * P_STRIDE);
    this.fData = new Float32Array(256 * F_STRIDE);
    // Room for the hero's stain; sized for real once every drop exists.
    this.kData = new Float32Array(1600 * K_STRIDE);
    // The heavy drops now (the hero is in the air from the first frame), the
    // rest over the next three frames: made all at once they were ~10 ms of
    // JS on the very frame of the knock, the one everyone is watching. Nothing
    // shows for it: every drop spends its first frame or so squeezed out
    // behind the head, which is still at the wall, and the fine mist, made
    // last, lands no sooner than ~2.6 frames out.
    this.builder = this.makeDrops(opts.density, opts.covers);
    this.build();
  }

  /** One step of the drop making; the last one sizes the stain buffer. */
  private build() {
    if (!this.builder) return;
    const done = this.builder.next().done;
    // landing order of what exists so far, so the shapes of the first drops
    // to land (the hero's is the costly one) are worked out in the frames
    // before they land, within the per-frame budget
    this.order = this.drops.map((_, i) => i).sort((p, q) => this.drops[p].tl - this.drops[q].tl);
    if (!done) return;
    this.builder = null;
    // sized up front from the drops (growing it mid-splash costs a copy and a
    // fresh GPU buffer right when the frame is busiest)
    let est = 1200;
    for (const d of this.drops) est += d.kind === 'big' ? 110 : d.kind === 'comp' ? 80 : d.kind === 'med' ? 20 + 8 * d.R : d.kind === 'small' ? 18 : 2;
    const size = Math.ceil(est * 1.25) * K_STRIDE;
    if (size > this.kData.length) {
      const next = new Float32Array(size);
      next.set(this.kData.subarray(0, this.kCount * K_STRIDE));
      this.kData = next;
      this.kUploaded = 0; // new buffer: everything goes up again
    }
  }

  /** Is a stage box clear of the copy (with the margin)? */
  private clearOfCopy(x0: number, y0: number, x1: number, y1: number) {
    for (const r of this.keepOut) {
      if (x1 > r[0] - KEEP_MARGIN && x0 < r[2] + KEEP_MARGIN && y1 > r[1] - KEEP_MARGIN && y0 < r[3] + KEEP_MARGIN) return false;
    }
    return true;
  }

  // ------------------------------------------------------------- drops ----
  private launch(d: Drop) {
    const x0 = this.tx * d.off + this.nx * 2;
    const y0 = this.ty * d.off + this.ny * 2;
    let vx = d.spd * Math.cos(d.ang);
    let vy = d.spd * Math.sin(d.ang);
    const c = 0.25 + 0.8 / Math.max(d.r, 0.3);
    let [lx, ly, lvx, lvy] = ballistic(x0, y0, vx, vy, c, d.T);
    let dist = Math.hypot(lx, ly);
    if (dist > MAXDIST) {
      // past the burst radius: land at a heavy-tailed radius inside it
      // (density falling off outward) instead of piling up on one arc
      const target = MAXDIST * (0.5 + 0.47 * (1 - Math.sqrt(this.aux.next())));
      for (let i = 0; i < 5; i++) {
        const s = target / Math.max(dist, 1e-6);
        vx *= s;
        vy *= s;
        [lx, ly, lvx, lvy] = ballistic(x0, y0, vx, vy, c, d.T);
        dist = Math.hypot(lx, ly);
        if (Math.abs(dist - target) < 1) break;
      }
    }
    d.x0 = x0;
    d.y0 = y0;
    d.vx = vx;
    d.vy = vy;
    d.c = c;
    d.lx = lx;
    d.ly = ly;
    d.tl0 = d.dt0;
    d.tl = d.dt0 + d.T;
    d.theta = Math.atan2(lvy, lvx);
    d.e = clip(Math.sin(Math.atan2(DEPTH / d.T, Math.hypot(lvx, lvy))), 0.3, 1);
  }

  private onStage(lx: number, ly: number, pad: number) {
    const X = this.cx + this.k * lx;
    const Y = this.cy + this.k * ly;
    return X > -pad && X < this.W + pad && Y > -pad && Y < this.H + pad;
  }

  /** Samples every drop; yields between batches (see the constructor). */
  private *makeDrops(density: number, covers: HeadCovers): Generator<void, void, void> {
    const rng = this.rng;
    const U = (a: number, b: number) => rng.u(a, b);
    const b = this.burst;
    const V = this.V;
    const ax = this.axis;
    const clipang = (a: number, lim = CONE_HALF) => ax + clip(a, -lim, lim);
    const blank = (kind: DropKind, R: number): Drop => ({
      kind, R, r: Math.max(R / 2.6, 0.3), ang: 0, spd: 0, T: 0, dt0: 0, off: 0, x0: 0, y0: 0, vx: 0, vy: 0,
      c: 1, tl0: 0, tl: 0, lx: 0, ly: 0, theta: 0, e: 1, nofly: false, rv: 0, ramp: [0.3, 1.4, 1], done: false, behind: false,
    });
    // The head is still next to the wall while the spray flies — the site's
    // head retreats slower than the recording's, so most of the spray lands
    // where the head will be. Those drops are squeezed out between head and
    // wall: their whole flight is drawn behind the head, and they land
    // behind it (landed blood always is), showing as the head moves off.
    // Only the rest flies in front, at the camera.
    const spawn = (kind: DropKind, R: number, sample: () => Partial<Drop>): Drop => {
      const d = { ...blank(kind, R), ...sample() } as Drop;
      this.launch(d);
      const X = this.cx + this.k * d.lx;
      const Y = this.cy + this.k * d.ly;
      d.behind = this.onStage(d.lx, d.ly, 30) && covers(X, Y, 0.5 * d.R * this.k, d.tl);
      // A drop that would land on the copy is never thrown: no stain is left
      // on the text (the canvas is drawn over it), and the splash just looks
      // as if it went behind the words. The reach is a stain's full drawn
      // extent (its long radius, splash rim and soft edge: up to ~2.4x the
      // body ellipse measured), so not even a fringe touches a letter.
      const reach = ((2.5 * d.R) / Math.max(d.e, 0.35) + 6) * this.k;
      if (!this.clearOfCopy(X - reach, Y - reach, X + reach, Y + reach)) d.done = d.nofly = true;
      // fine drops get a comet-like shutter ramp (dense at the drop), so they
      // read as a drop with a faint tail, never as a headless dash
      const fine = kind === 'small' || (kind === 'med' && R < 5);
      d.ramp = fine ? [0.15, 4.25, 4] : [0.3, 1.4, 1];
      this.drops.push(d);
      return d;
    };

    // hero: the main mass, slow and short flight → lands near the contact
    const Rh = 23 * b ** 0.5;
    spawn('hero', Rh, () => ({ ang: clipang(rng.n(0, 0.07)), spd: V * U(0.5, 0.56), T: U(3.4, 4.2) / FPS, dt0: U(-0.45, -0.2) / FPS, off: rng.n(0, 2.5) }));
    this.rRef = Math.max(1, Rh); // the biggest drop there will be (final value below)
    const side0 = rng.next() < 0.5 ? 1 : -1;
    for (let i = 0; i < (b > 0.7 ? 2 : 1); i++) {
      const sd = i === 0 ? side0 : -side0;
      spawn('comp', U(6.5, 9) * b ** 0.5, () => ({ ang: clipang(sd * U(0.24, 0.42)), spd: V * U(0.5, 0.6), T: U(3.6, 5) / FPS, dt0: U(-0.3, 0.7) / FPS, off: rng.n(0, 4) }));
    }
    const nbig = b > 0.85 ? 4 : b > 0.6 ? 3 : 2;
    const bigAng = Array.from({ length: nbig }, (_, i) => (nbig > 1 ? -0.62 + (1.24 * i) / (nbig - 1) : 0) * (CONE_HALF / 0.75) + rng.n(0, 0.1));
    for (let i = bigAng.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [bigAng[i], bigAng[j]] = [bigAng[j], bigAng[i]];
    }
    const parents: Drop[] = [];
    for (const a0 of bigAng) {
      parents.push(spawn('big', U(10.5, 15) * b ** 0.5, () => ({ ang: clipang(a0 + rng.n(0, 0.05)), spd: V * U(0.55, 0.78), T: U(4.5, 8) / FPS, dt0: U(-0.4, 0.9) / FPS, off: rng.n(0, 4) })));
    }
    yield;
    const meds: Drop[] = [];
    for (let i = 0, n = Math.round(26 * b * density); i < n; i++) {
      const R = Math.min(2.2 * (1 - rng.next()) ** (-1 / 1.7), 9) * b ** 0.2;
      meds.push(spawn('med', R, () => ({ ang: clipang(rng.n(0, 0.38)), spd: V * (0.38 + 0.72 * rng.next() ** 1.8), T: U(3, 10.5) / FPS, dt0: U(-0.25, 1.5) / FPS, off: rng.n(0, 4) })));
    }
    for (let i = 0, n = Math.round(42 * b * density); i < n; i++) {
      spawn('small', 1.2 + 2.2 * rng.next() ** 1.7, () => ({ ang: clipang(rng.n(0, 0.42)), spd: V * (0.38 + 0.72 * rng.next() ** 1.8), T: U(3, 10) / FPS, dt0: U(-0.1, 1.9) / FPS, off: rng.n(0, 4) }));
    }
    const mr = meds.map((d) => d.R).sort((p, q) => q - p);
    const rcut = mr.length ? mr[Math.max(0, Math.floor(mr.length / 3) - 1)] : 99;
    for (const d of meds) if (d.R >= Math.max(rcut, 3)) parents.push(d);
    const pw = parents.map((d) => d.R * d.R);
    const pwSum = pw.reduce((p, q) => p + q, 0);
    yield;
    for (let i = 0, n = Math.round(100 * b * density); i < n; i++) {
      if (i === Math.ceil(n / 2)) yield;
      // mist: most of it clustered along the streams of the bigger drops
      let d: Drop;
      if (parents.length && rng.next() < 0.7) {
        let r = rng.next() * pwSum;
        let p = parents[0];
        for (let j = 0; j < parents.length; j++) {
          r -= pw[j];
          if (r <= 0) {
            p = parents[j];
            break;
          }
        }
        d = spawn('mist', U(0.45, 1.3), () => ({ ang: p.ang + rng.n(0, 0.045), spd: p.spd * U(0.85, 1.2), T: U(2.5, Math.max(3, Math.min(p.T * FPS + 1, 8.5))) / FPS, dt0: U(0.1, 2) / FPS, off: p.off + rng.n(0, 2) }));
      } else {
        d = spawn('mist', U(0.45, 1.3), () => ({ ang: clipang(rng.n(0, 0.45), CONE_HALF + 0.1), spd: V * (0.38 + 0.72 * rng.next() ** 1.8), T: U(2.5, 8) / FPS, dt0: U(0.1, 2) / FPS, off: rng.n(0, 4) }));
      }
      // too fine to read in flight: it only appears on the wall
      d.nofly = true;
    }
    this.rRef = this.drops.reduce((m, d) => Math.max(m, d.R), 1);
    this.order = this.drops.map((_, i) => i).sort((p, q) => this.drops[p].tl - this.drops[q].tl);
    // drips are chosen once the heavy drops are down
    this.tSelect = this.drops.reduce((m, d) => (d.kind === 'hero' || d.kind === 'comp' || d.kind === 'big' ? Math.max(m, d.tl) : m), 0) + 0.02;
  }

  // ------------------------------------------------------------ stains ----
  private ensureK(n: number) {
    if ((this.kCount + n) * K_STRIDE <= this.kData.length) return;
    let cap = this.kData.length;
    while ((this.kCount + n) * K_STRIDE > cap) cap *= 2;
    const next = new Float32Array(cap);
    next.set(this.kData.subarray(0, this.kCount * K_STRIDE));
    this.kData = next;
    this.kUploaded = 0; // new buffer: everything goes up again
  }

  /**
   * A drop's stain, ready to stamp. Pure (no head, no buffers), so it is
   * worked out a few frames ahead of the landing, within a per-frame budget —
   * the hero alone is a few hundred kernels.
   */
  private prepare(d: Drop, idx: number): Shape {
    if (d.shape) return d.shape;
    const rng = makeRng(this.seed * 977 + idx * 7919 + 13);
    let rows: number[];
    let crown: ReturnType<typeof makeHero>['crown'] = [];
    if (d.kind === 'hero') {
      const h = (this.floor ? makeHeroDrop : makeHero)(rng, d.R, d.theta, d.e);
      rows = h.rows;
      crown = h.crown;
    } else {
      rows = makeStain(rng, d.R, d.theta, d.e);
    }
    if (d.R >= 1.4) {
      const sa = d.kind === 'hero' ? (this.floor ? 0.05 : 0.025) : 0.036;
      warpRows(rows, d.theta, [2, 3, 4, 5].map((kk) => [kk, rng.n(0, sa), rng.u(0, 2 * Math.PI)] as [number, number, number]));
    }
    const small = d.R < 6.5;
    d.shape = {
      rows,
      c0: crown.length ? crownRows(crown, d.theta, 0, 0.55) : [],
      c1: crown.length ? crownRows(crown, d.theta, 1, 0.85) : [],
      glp: rng.next() < (small ? 0.35 : 0.12) ? 0 : rng.u(0.45, 1.25),
      rot: clip(rng.n(0, 0.22), -0.4, 0.4),
      d0: (2 + 0.9 * Math.min(d.R / 14, 1) + rng.u(-0.15, 0.15)) * this.timing.kd,
      lnPk: Math.log(peakOf(rows)),
      // size-weighted drying: a speck is gone well before the pools, which go last
      pace: clip((this.rRef / Math.max(d.R, 0.5)) ** 0.8, 1, 6),
    };
    return d.shape;
  }

  private land(d: Drop, idx: number) {
    d.done = true;
    if (!this.onStage(d.lx, d.ly, 25 * this.k)) return;
    const k = this.k;
    const X = this.cx + k * d.lx;
    const Y = this.cy + k * d.ly;
    const { rows, c0, c1, glp, rot, d0, lnPk, pace } = this.prepare(d, idx);
    const n = (rows.length + c0.length + c1.length) / KS;
    this.ensureK(n);
    const kStart = this.kCount;
    let ext = 0;
    const put = (src: number[], from: number, to: number) => {
      for (let i = 0; i < src.length; i += KS) {
        const o = this.kCount * K_STRIDE;
        const a = this.kData;
        a[o] = src[i] * k;
        a[o + 1] = src[i + 1] * k;
        a[o + 2] = X;
        a[o + 3] = Y;
        a[o + 4] = src[i + 2] * k;
        a[o + 5] = src[i + 3] * k;
        a[o + 6] = src[i + 4];
        a[o + 7] = src[i + 5];
        a[o + 8] = src[i + 6] * k;
        a[o + 9] = src[i + 7];
        a[o + 10] = d.tl;
        a[o + 11] = from;
        a[o + 12] = to;
        a[o + 13] = d0;
        a[o + 14] = lnPk;
        a[o + 15] = glp;
        a[o + 16] = rot;
        a[o + 17] = 1e6; // never absorbed (yet)
        a[o + 18] = pace;
        a[o + 19] = 0;
        ext = Math.max(ext, Math.hypot(src[i], src[i + 1]) + 3.5 * Math.max(src[i + 2], src[i + 3]));
        this.kCount++;
      }
    };
    put(rows, -1e6, 1e6);
    put(c0, d.tl, d.tl + 1 / FPS);
    put(c1, d.tl + 1 / FPS, d.tl + 2 / FPS);
    ext *= k;
    const st: Stain = {
      id: this.stains.length,
      x: d.lx,
      y: d.ly,
      R: d.R,
      e: d.e,
      theta: d.theta,
      mass: (0.55 * d.R) ** 2,
      tl: d.tl,
      kind: d.kind,
      absorbed: Infinity,
      ct: Math.cos(d.theta),
      st: Math.sin(d.theta),
      rows,
      d0,
      kStart,
      kCount: this.kCount - kStart,
      box: [X - ext, Y - ext, X + ext, Y + ext],
    };
    this.stains.push(st);
    this.dripStains.push(st);
  }

  /** A drip swallowed this stain: it drains away into the bead. */
  private absorb(st: DripStain, t: number) {
    const s = st as Stain;
    for (let i = s.kStart; i < s.kStart + s.kCount; i++) this.kData[i * K_STRIDE + 17] = t;
    this.kPatches.push([s.kStart, s.kCount]);
  }

  // ------------------------------------------------------------- drips ----
  /** A drip run from (x, y0) down L (event-local offline px) stays off the copy. */
  private runClearOfCopy(x: number, y0: number, L: number, rb: number) {
    if (!this.keepOut.length) return true;
    const k = this.k;
    const X = this.cx + k * x;
    const half = k * (1.3 * rb + 3);
    return this.clearOfCopy(X - half, this.cy + k * y0, X + half, this.cy + k * (y0 + L + rb));
  }

  private pathClear(x: number, y0: number, L: number, rb: number, exclude: number, strict: boolean) {
    const frac = strict ? 1 : 0.7;
    for (const c of this.stains) {
      if (c.id === exclude || c.R < (strict ? 2.2 : 1.6) || (!strict && c.mass <= 0.4 * rb * rb)) continue;
      // the (padded) body ellipse lies within its long radius of the centre
      const reach = (1.25 * c.R) / c.e + 3;
      if (Math.abs(c.x - x) > reach + 1.3 * rb + 3 || c.y + reach < y0 + 4 || c.y - reach > y0 + frac * L) continue;
      const off = 1.3 * rb + 3;
      for (let yy = y0 + 4; yy < y0 + frac * L; yy += 3) {
        if (bodyD(c, x - off, yy, 3) <= 1 || bodyD(c, x, yy, 3) <= 1 || bodyD(c, x + off, yy, 3) <= 1) return false;
      }
    }
    return true;
  }

  private pathHits(x: number, y0: number, L: number, rb: number, exclude: number) {
    let n = 0;
    for (const c of this.stains) {
      if (c.id === exclude || c.R < 1.6) continue;
      const reach = (1.25 * c.R) / c.e + 2;
      if (Math.abs(c.x - x) > reach + 1.1 * rb || c.y + reach < y0 + 4 || c.y - reach > y0 + L) continue;
      const off = 1.1 * rb;
      for (let yy = y0 + 4; yy < y0 + L; yy += 3) {
        if (bodyD(c, x - off, yy, 2) <= 1 || bodyD(c, x, yy, 2) <= 1 || bodyD(c, x + off, yy, 2) <= 1) {
          n++;
          break;
        }
      }
    }
    return n;
  }

  /**
   * Choose the drips: 1-2 long runs from the hero and the biggest stains,
   * 1-2 short stalls. A generator, so the path tests (a few ms in all) are
   * spread over frames instead of landing in one.
   */
  private *pickDrips(): Generator<void, void, void> {
    const rng = makeRng(this.seed * 31 + 5);
    const U = (a: number, b: number) => rng.u(a, b);
    const k = this.k;
    const [lo, hi] = this.floor ? [30, 60] : [140, 220];
    const [slo, shi] = this.floor ? [12, 22] : [16, 40];
    const nLong = this.floor ? 1 : 2;
    const nStall = this.floor ? 1 : 2;
    // stage bounds in event-local offline px
    const xMin = -this.cx / k;
    const xMax = (this.W - this.cx) / k;
    const yMax = (this.H - this.cy) / k;
    const yMin = -this.cy / k;
    const hero = this.stains.find((s) => s.kind === 'hero');
    const pool = this.stains
      .filter((s) => (s.kind === 'big' || s.kind === 'comp' || (s.kind === 'med' && s.R >= 5)) && s.x > xMin + 30 && s.x < xMax - 30 && s.y > yMin + 10 && s.y < yMax - lo - 10)
      .sort((p, q) => q.R + (q.kind !== 'med' ? 6 : 0) - (p.R + (p.kind !== 'med' ? 6 : 0)));
    const bscale = this.burst ** 0.15;
    type Pick = { st: Stain; x: number; yb: number; L: number; rb0: number; ts: number; kind: 'long' | 'stall'; rbStop: number };
    const chosen: Pick[] = [];
    const tA = U(0.1, 0.22);
    const starts = [tA, tA + U(0.44, 0.56)];
    const runs = [U(0.88, 1) * hi, lo + U(0, 0.35) * (hi - lo)];
    const rbs = [U(6.5, 7.4) * bscale, U(5.3, 6.0) * bscale];
    const stops = [U(3.75, 4.4), U(3.05, 3.45)];
    const cl: [Stain, number][] = [];
    if (hero) {
      const side = hero.x * k + this.cx > this.W / 2 ? -1 : 1;
      const xo0 = side * U(0.3, 0.45) * hero.R;
      for (const xo of [xo0, -xo0, 0.6 * xo0, 0]) cl.push([hero, xo]);
    }
    for (const s of pool) cl.push([s, rng.n(0, 0.12) * s.R]);
    for (let i = 0; i < nLong; i++) {
      let best: [number, Pick] | null = null;
      for (const [st, xo] of cl) {
        if (chosen.some((c) => c.st.id === st.id)) continue;
        const x = st.x + xo;
        if (x < xMin + 14 || x > xMax - 14 || chosen.some((c) => Math.abs(x - c.x) < 46)) continue;
        const yb = st.y + bodyBottom(st.rows, xo, st.R);
        const Lopts = [runs[i], ...(i > 0 ? [lo, lo + 0.5 * (hi - lo), 0.95 * hi] : [])];
        let L: number | null = null;
        for (let Lc of Lopts) {
          Lc = Math.min(Lc, yMax - 14 - yb);
          if (Lc < lo * (hi < 100 ? 0.6 : 1)) continue;
          // never two beads hanging at the same height (no comb)
          if (chosen.every((c) => c.kind !== 'long' || Math.abs(yb + Lc - (c.yb + c.L)) >= 45)) {
            L = Lc;
            break;
          }
        }
        if (L === null) continue;
        const rb0 = rbs[i];
        if (!this.runClearOfCopy(x, yb, L, rb0)) continue;
        if (!this.pathClear(x, yb + 3, L, rb0, st.id, false)) continue;
        const hits = this.pathHits(x, yb + 3, L, rb0, st.id);
        if (hits > 2) continue;
        const pen = (st.kind === 'hero' ? 0 : 0.04) + 0.05 * hits;
        if (!best || pen < best[0]) best = [pen, { st, x, yb, L, rb0, ts: st.tl + starts[i], kind: 'long', rbStop: Math.min(stops[i], rb0 - 1.2) }];
        if (pen <= 0.08 && (st.kind === 'hero' || i > 0 || !hero)) break;
        yield;
      }
      if (best) chosen.push(best[1]);
    }
    const sc = this.stains
      .filter((s) => (s.kind === 'med' || s.kind === 'comp' || s.kind === 'big') && s.R >= 3.4 && s.R <= 10 && s.x > xMin + 20 && s.x < xMax - 20 && s.y > yMin + 10 && s.y < yMax - shi - 10)
      .sort((p, q) => q.R - p.R);
    for (let i = 0; i < nStall; i++) {
      for (const st of sc) {
        if (chosen.some((c) => c.st.id === st.id)) continue;
        const xo = rng.n(0, 0.15) * st.R;
        const x = st.x + xo;
        if (chosen.some((c) => Math.abs(x - c.x) < (c.kind === 'long' ? 44 : 30))) continue;
        const yb = st.y + bodyBottom(st.rows, xo, st.R);
        const L = U(slo, shi);
        if (yb + L > yMax - 6) continue;
        const rstop = U(3.1, 3.8);
        const rb0 = rstop + U(0.75, 1.2);
        yield;
        if (!this.runClearOfCopy(x, yb, L + 6, rb0)) continue;
        if (!this.pathClear(x, yb + 3, L + 6, rb0, st.id, true)) continue;
        chosen.push({ st, x, yb, L, rb0, ts: st.tl + U(0.14, 0.7), kind: 'stall', rbStop: rstop });
        break;
      }
    }
    const tm = this.timing;
    for (const c of chosen) {
      const src: DripSource = {
        x: c.x,
        y: c.yb - 0.35 * c.rb0,
        rb0: c.rb0,
        parent: c.st.id,
        tStart: c.ts,
        cdep: (2 * (c.rb0 - c.rbStop)) / c.L,
        run: c.L,
        kind: c.kind,
        rbStop: c.rbStop,
        wander: c.kind === 'long' ? U(1, 1.35) : 0.6,
      };
      // the parent's group: stains merged into it — a drip never "absorbs" a
      // part of the splat it came from
      const group = new Set<number>([c.st.id]);
      for (const s of this.stains) {
        const dc = Math.hypot(s.x - c.st.x, s.y - c.st.y);
        if (dc < (1.25 * c.st.R) / c.st.e + (1.25 * s.R) / s.e + 2 || (c.st.kind === 'hero' && s.kind === 'comp')) group.add(s.id);
      }
      const bd = new Bead(src, rng, group);
      bd.rot = clip(rng.n(0, 0.15), -0.27, 0.27);
      bd.glp = U(0.6, 1.15);
      bd.shape = { nd: -U(0.62, 0.95), ns: U(0.5, 0.72), na: U(1.3, 1.9), ax: U(0.86, 1.14), skew: rng.n(0, 0.1) };
      bd.d0p = c.st.d0;
      // one film: the drip dries with its parent, then thins in place just as
      // the stains start to shrink
      const dur = tm.diss * U(0.85, 1.05);
      bd.td1 = tm.shrink + (0.3 + 0.5 * U(0, 0.2)) * tm.kd;
      bd.td0 = bd.td1 - dur;
      bd.tMatte0 = bd.td0 - 0.7 * Math.max(tm.kd, 0.6);
      if (c.kind === 'long') {
        // every long run shows at least one clear stick-slip pause
        this.pin.extra.push(c.x + rng.n(0, 1), c.yb + U(0.35, 0.6) * c.L + c.rb0 * 0.6, U(9, 11));
      }
      this.beads.push(bd);
    }
  }

  private dryOf(d0: number, t: number) {
    return Math.max(sstep(d0, d0 + 1.4 * this.timing.kd, t), sstep(this.timing.dry[0], this.timing.dry[1], t));
  }

  // ------------------------------------------------------------ update ----
  /** Advance to event clock t (s since the hit) and rebuild the per-frame buffers. */
  update(t: number, dt: number, covers: HeadCovers) {
    const k = this.k;
    // The knock's own frame (it already made the first drops) does nothing
    // that can wait: no more drops, no shapes.
    const fresh = this.fresh;
    this.fresh = false;
    const t0 = performance.now();
    if (!fresh) this.build();
    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];
      if (!d.done && d.tl <= t) this.land(d, i);
    }
    // shapes of the next drops to land, while this frame has time to spare
    for (const i of fresh ? [] : this.order) {
      const d = this.drops[i];
      if (d.done || d.shape) continue;
      if (d.tl > t + 0.3 || performance.now() - t0 > BUDGET_MS) break;
      this.prepare(d, i);
    }
    if (!this.dripsChosen && t >= this.tSelect) {
      this.picker ??= this.pickDrips();
      while (performance.now() - t0 < BUDGET_MS) {
        if (this.picker.next().done) {
          this.dripsChosen = true;
          break;
        }
      }
    }
    if (this.beads.length) {
      this.covers = covers;
      stepBeads(this.beads, this.dripStains, this.pin, t - dt, dt, this.onAbsorb, this.hidden);
      const yMax = (this.H - this.cy) / k;
      for (let bi = 0; bi < this.beads.length; bi++) {
        const b = this.beads[bi];
        // a bead still running into the drying window stops where it is
        if ((b.state === 2 || b.state === 3) && t > b.td0 - 0.45 * Math.max(this.timing.kd, 0.6)) {
          b.state = 4;
          b.tStop = t;
        }
        if (b.alive && b.y > yMax + 40) b.alive = false;
      }
    }
    const bx = this.box;
    bx[0] = bx[1] = Infinity;
    bx[2] = bx[3] = -Infinity;
    for (let i = 0; i < this.stains.length; i++) {
      const sb = this.stains[i].box;
      this.grow(sb[0], sb[1], sb[2], sb[3]);
    }
    this.emitDrips(t);
    this.emitFlyers(t);
  }

  private grow(x0: number, y0: number, x1: number, y1: number) {
    const b = this.box;
    if (x0 < b[0]) b[0] = x0;
    if (y0 < b[1]) b[1] = y0;
    if (x1 > b[2]) b[2] = x1;
    if (y1 > b[3]) b[3] = y1;
  }

  private ensureP(n: number) {
    if (n * P_STRIDE <= this.pData.length) return;
    let cap = this.pData.length;
    while (n * P_STRIDE > cap) cap *= 2;
    this.pData = new Float32Array(cap);
  }

  /** One plain kernel (trail row or bead part), event-local offline px in. */
  private putP(n: number, x: number, y: number, sx: number, sy: number, amp: number, size: number, dry: number, hm: number, glp: number, rot: number) {
    const k = this.k;
    const a = this.pData;
    const o = n * P_STRIDE;
    const X = this.cx + k * x;
    const Y = this.cy + k * y;
    a[o] = X;
    a[o + 1] = Y;
    a[o + 2] = sx * k;
    a[o + 3] = sy * k;
    a[o + 4] = 0;
    const sz = (size * k) / 16;
    a[o + 5] = amp;
    a[o + 6] = sz * sz * sz * sz;
    a[o + 7] = dry;
    a[o + 8] = 0;
    a[o + 9] = hm;
    a[o + 10] = glp;
    a[o + 11] = 1;
    a[o + 12] = rot;
    const ex = 3.5 * (sx > sy ? sx : sy) * k;
    this.grow(X - ex, Y - ex, X + ex, Y + ex);
  }

  private emitDrips(t: number) {
    let total = 0;
    for (let bi = 0; bi < this.beads.length; bi++) total += this.beads[bi].rowsY.length + 2;
    this.ensureP(total);
    let n = 0;
    const kd = this.timing.kd;
    for (let bi = 0; bi < this.beads.length; bi++) {
      const b = this.beads[bi];
      if (b.state === 0 || t >= b.td1) continue;
      const tau = clip((t - b.td0) / (b.td1 - b.td0), 0, 1);
      const thin = 0.72 * sstep(0, 0.75, tau); // every section thins at the same rate
      const fin = sstep(0.75, 0.88, tau); // then the remnant goes at once
      const ffade = 1 - sstep(0.85, 1, tau);
      const neck = 0.3 * (1 - 0.75 * (b.tStop !== null ? sstep(b.tStop, b.tStop + 0.8, t) : 0));
      const dryp = Math.max(this.dryOf(b.d0p, t), sstep(b.tMatte0, b.td0, t));
      const tMo = b.tStop !== null ? b.tStop : t;
      const tFreeze = Math.min(b.td0, Math.max(b.d0p + 0.7 * kd, tMo + 0.2)); // geometry frozen once matte
      const tfz = Math.min(t, tFreeze);
      const rbNow = b.rbVisible;
      const alive = b.alive;
      const yCut = b.y - 0.25 * rbNow;
      const pm = b.pauseMarks;
      const wn = b.wn;
      const wnLast = wn.length - 1;
      const sizeT = 0.75 * b.rb0;
      for (let j = 0; j < b.rowsY.length; j++) {
        const rt = b.rowsT[j];
        if (rt > t) break;
        const yy = b.rowsY[j];
        if (alive && yy >= yCut) continue;
        const age = tfz - rt > 0 ? tfz - rt : 0;
        const wet = Math.exp(-age / 1.25);
        // the wet film drains: thick behind the bead, thinner with age
        const amp = 1.55 + 0.4 * Math.exp(-age / 2.5) + 0.95 * wet;
        let wi = Math.round(yy - b.y0 + 200);
        wi = wi < 0 ? 0 : wi > wnLast ? wnLast : wi;
        let sig = (0.8 + 0.2 * b.rowsRb[j]) * (1 + 0.16 * wn[wi]);
        for (let q = 0; q < pm.length; q += 2) {
          const z = (yy - pm[q]) / (0.9 * pm[q + 1]);
          sig *= 1 + 0.3 * Math.exp(-z * z);
        }
        if (alive) {
          const u = (b.y - yy) / (rbNow > 1 ? rbNow : 1) - 1.7;
          sig *= 1 - neck * Math.exp(-(u * u) / 0.64); // the neck above the bead
        }
        const ampEff = ffade * (amp - (amp - 0.7) * fin) * 0.4987; // rows 1 px apart, σ 0.8
        this.putP(n++, b.rowsX[j], yy, sig * (1 - thin), 0.8, ampEff, sizeT, dryp, 0.85 + 0.45 * wet, b.glp, b.rot);
      }
      if (!alive) continue;
      // the bead: bulbous head + neck (a teardrop), stretched while it slides
      const sp = b.state === 3 ? Math.hypot(b.vx, b.vy) : 0;
      const stretch = 1 + 0.3 * Math.min(sp / V_MAX, 1);
      const bdry = Math.max(this.dryOf(b.d0p + 0.12 * kd, t), sstep(b.tMatte0 + 0.05, b.td0 + 0.05, t));
      const wob = 0.04 * Math.sin(t * 9 + b.nofs) * (1 - bdry) * (b.state === 3 ? 1 : 0.35);
      const g = b.grow;
      const keep = (1 - 0.75 * fin) * ffade;
      const hmB = 1 + 0.25 * (1 - bdry);
      const sh = b.shape;
      const r1 = rbNow / 1.41;
      this.putP(n++, b.x, b.y, r1 * (1 + wob) * sh.ax * (1 - thin), r1 * stretch * (1 - thin), 2.7 * g * keep, rbNow, bdry, hmB, b.glp, b.rot);
      const r2 = r1 * sh.ns;
      this.putP(n++, b.x + sh.skew * rbNow, b.y + sh.nd * rbNow, r2 * (1 + wob) * (1 - thin), r2 * stretch * (1 - thin), sh.na * g * keep, rbNow, bdry, hmB, b.glp, b.rot);
    }
    this.pCount = n;
  }

  private emitFlyers(t: number) {
    const k = this.k;
    if (this.fData.length < this.drops.length * F_STRIDE) this.fData = new Float32Array(this.drops.length * F_STRIDE);
    const a = this.fData;
    let n = 0;
    const ta = t - SHUTTER;
    for (let di = 0; di < this.drops.length; di++) {
      const d = this.drops[di];
      if (d.nofly || d.tl0 >= t || d.tl <= ta) continue;
      const la = Math.max(ta, d.tl0) - d.tl0;
      const lb = Math.min(t, d.tl) - d.tl0;
      if (lb <= la) continue;
      const T = d.tl - d.tl0;
      const A = ballistic(d.x0, d.y0, d.vx, d.vy, d.c, la, FA);
      const B = ballistic(d.x0, d.y0, d.vx, d.vy, d.c, lb, FB);
      const r = d.r * (0.6 + 0.4 * (lb / T));
      const rv = Math.max(r, d.rv);
      const ink = (r / rv) * Math.min(1, (r / 0.7) ** 2); // mass-weighted: tiny ones fade out
      const o = n * F_STRIDE;
      const ax = this.cx + k * A[0];
      const ay = this.cy + k * A[1];
      const bx = this.cx + k * B[0];
      const by = this.cy + k * B[1];
      a[o] = ax;
      a[o + 1] = ay;
      a[o + 2] = bx;
      a[o + 3] = by;
      a[o + 4] = rv * k;
      a[o + 5] = (lb - la) / SHUTTER;
      a[o + 6] = (la + d.tl0 - ta) / SHUTTER;
      a[o + 7] = ink;
      a[o + 8] = d.ramp[0];
      a[o + 9] = d.ramp[1];
      a[o + 10] = d.ramp[2];
      // during its first ~frame a drop is still squeezing out between head and wall
      a[o + 11] = d.behind ? 1 : 1 - sstep(0.6 / FPS, 1.7 / FPS, 0.5 * (la + lb));
      const ex = rv * k + 2;
      this.grow(Math.min(ax, bx) - ex, Math.min(ay, by) - ex, Math.max(ax, bx) + ex, Math.max(ay, by) + ex);
      n++;
    }
    this.fCount = n;
  }
}
