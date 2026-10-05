/**
 * Stain morphology, ported from the offline renderer the client approved
 * (blood_final/render.py). A stain is a sum of anisotropic gaussian kernels;
 * the GPU thresholds their field at 1, so the outline comes from where the
 * kernels sit: an egg body that is round where it touched first, a flattened
 * scalloped front, tails and spines that follow the impact angle, tapered
 * fingers with bead ends on the hero splat, satellites. Nothing is an ellipse
 * on its own — every shape is the union of a dozen or a few hundred lumps.
 *
 * Units are "offline pixels" (the 1080² recording the look was approved at);
 * the layer scales them to the stage by the head's size.
 */
import type { Rng } from './rng';

/** Kernel row: dx, dy, su, sv, theta, amp, size, kind. */
export const KS = 8;
/** 0 body · 1 finger / tail (attached) · 2 detached satellite · 3 crown (first frames only) */
type KernelKind = 0 | 1 | 2 | 3;

class KL {
  rows: number[] = [];
  add(dx: number, dy: number, a: number, b: number, th: number, amp: number, size: number, kind: KernelKind) {
    this.rows.push(dx, dy, Math.max(a, 0.35), Math.max(b, 0.35), th, amp, size, kind);
  }
  /** One sample of a line: amplitude normalised so the summed ridge ≈ ampLine. */
  line(x: number, y: number, sAlong: number, sAcross: number, th: number, ampLine: number, ds: number, size: number, kind: KernelKind) {
    const amp = Math.min(ampLine, (ampLine * ds) / (sAlong * 2.5066));
    this.add(x, y, sAlong, sAcross, th, amp, size, kind);
  }
}

const TAU = Math.PI * 2;
const DOWN = Math.PI / 2; // screen angle of straight down (y grows downward)
const TAIL_BEND = 0.33; // rad: max total bend of a tail (~19°) — no hooks

const angdiff = (a: number, b: number) => Math.abs((((a - b + Math.PI) % TAU) + TAU) % TAU - Math.PI);
const clip = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const ellipseRadius = (L: number, W: number, phi: number) =>
  1 / Math.sqrt((Math.cos(phi) / L) ** 2 + (Math.sin(phi) / W) ** 2);

/** Tapered, slightly curved finger from (x, y) along heading hd0. */
function finger(
  K: KL,
  rng: Rng,
  x: number,
  y: number,
  hd0: number,
  L: number,
  w0: number,
  bend: number,
  branch = false,
  bead = true,
  amp0 = 1.95,
  taper = 0.74,
) {
  const n = Math.max(4, Math.floor(L / Math.max(0.45 * w0, 0.7)));
  const ds = L / n;
  const brAt = branch ? Math.floor(n * rng.u(0.45, 0.7)) : -1;
  let hd = hd0;
  for (let j = 0; j <= n; j++) {
    const f = j / n;
    const w = Math.max(w0 * (1 - taper * f ** 0.8), 0.5);
    const s = w / 1.25;
    hd = hd0 + bend * f ** 1.5;
    K.line(x, y, s * 1.5, s, hd, amp0 - 0.3 * f, ds, Math.max(1.3 * w, 0.8), 1);
    if (j === brAt) {
      const side = rng.next() < 0.5 ? 1 : -1;
      finger(K, rng, x, y, hd + side * rng.u(0.4, 0.8), (L - j * ds) * rng.u(0.45, 0.85), w * 0.72, rng.n(0, 0.3), false, rng.next() < 0.75, amp0 - 0.1);
    }
    if (j < n) {
      x += ds * Math.cos(hd);
      y += ds * Math.sin(hd);
    }
  }
  if (bead) {
    const wt = Math.max(w0 * (1 - taper), 0.55);
    const rb = wt * rng.u(1.45, 2.2) + 0.35;
    const gap = rng.next() < 0.7 ? 0 : rng.u(1.0, 2.6);
    const bx = x + (rb * 0.5 + gap) * Math.cos(hd);
    const by = y + (rb * 0.5 + gap) * Math.sin(hd);
    const s = rb / 1.3;
    K.add(bx, by, s * 1.15, s, hd, 2.25, rb * 1.3, gap === 0 ? 1 : 2);
  }
}

/** Crown spine: angle, rim radius, length, width, has tip bead, tip size, heading jitter. */
export type CrownSpine = [number, number, number, number, boolean, number, number];

/**
 * The main mass of a side-wall hit: a lobed, irregular body plus a few
 * heavy-tailed, curved fingers that point roughly along the travel direction
 * (within ±60°, the long ones forward, none long pointing down).
 */
export function makeHero(rng: Rng, R: number, theta: number, e: number): { rows: number[]; crown: CrownSpine[] } {
  const K = new KL();
  const U = (a: number, b: number) => rng.u(a, b);
  const el = 1 / Math.max(e, 0.75) ** 0.7;
  const Lh = R * el;
  const Wh = R;
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const P = (u: number, v: number): [number, number] => [u * ct - v * st, u * st + v * ct];

  K.add(...P(0.06 * Lh, 0), Lh / 1.45, Wh / 1.42, theta, 2.6, R, 0);
  for (let i = 0, n = 7 + Math.floor(R / 5); i < n; i++) {
    // lumps → organic outline
    const u = U(-0.55, 0.6) * Lh;
    const v = U(-0.5, 0.5) * Wh * (1 - (Math.abs(u) / Lh) * 0.5);
    const s = (U(0.28, 0.5) * Wh) / 1.35;
    K.add(...P(u, v), s * U(1.0, 1.5), s, theta + rng.n(0, 0.5), U(1.4, 2.1), Wh * 0.9, 0);
  }
  const nl = rng.next() < 0.45 ? 2 : 3; // 2-3 lobes break the silhouette
  const lob: number[] = [];
  for (let guard = 0; lob.length < nl && guard < 200; guard++) {
    const a = U(-Math.PI, Math.PI);
    if (lob.every((b) => angdiff(a, b) > 1.05)) lob.push(a);
  }
  for (const a of lob) {
    const rr = U(0.74, 0.92) * ellipseRadius(Lh, Wh, a);
    const s = U(0.38, 0.54) * Wh;
    K.add(...P(rr * Math.cos(a), rr * Math.sin(a)), (s * U(1.0, 1.4)) / 1.35, s / 1.35, theta + a + rng.n(0, 0.3), U(2.2, 2.6), s * 1.1, 0);
  }
  for (let i = 0, n = rng.int(6, 11); i < n; i++) {
    // rim scallops
    const a = U(-Math.PI, Math.PI);
    const rr = U(0.86, 1.0) * ellipseRadius(Lh, Wh, a);
    const s = U(0.11, 0.2) * Wh;
    K.add(...P(rr * Math.cos(a), rr * Math.sin(a)), (s * U(1.0, 1.6)) / 1.3, s / 1.3, theta + a + Math.PI / 2 + rng.n(0, 0.4), U(1.6, 2.0), s * 1.2, 0);
  }
  // fingers: few, irregular spacing, heavy-tailed lengths, curved, tapered, bead ends
  const nf = clip(3 + rng.poisson(0.8), 3, 5);
  const fa: number[] = [];
  for (let tries = 0; fa.length < nf && tries < 600; tries++) {
    const a = rng.n(0, 0.55);
    if (Math.abs(a) > 1.05) continue;
    if (fa.every((b) => angdiff(a, b) > 0.38)) fa.push(a);
  }
  const lens = fa
    .map(() => R * clip(0.34 * (1 - rng.next()) ** (-1 / 1.2), 0.45, 1.9))
    .sort((p, q) => q - p);
  const order = fa
    .map((a, i) => [Math.abs(a) + rng.n(0, 0.12), i] as const)
    .sort((p, q) => p[0] - q[0])
    .map((x) => x[1]);
  const Ls = new Array<number>(fa.length);
  order.forEach((idx, rank) => (Ls[idx] = lens[rank]));
  if (order.length) Ls[order[0]] = Math.max(Ls[order[0]], U(1.3, 1.8) * R); // the most forward one is long
  for (let r = 2; r < order.length; r++) Ls[order[r]] = Math.min(Ls[order[r]], U(0.45, 0.9) * R);
  fa.forEach((a, i) => {
    let L = Ls[i];
    const hd = theta + a + rng.n(0, 0.1);
    const dn = angdiff(hd, DOWN);
    if (dn < (30 * Math.PI) / 180) L = Math.min(L, U(12, 20)); // never a long finger pointing down
    else if (dn < (48 * Math.PI) / 180) L = Math.min(L, 28);
    const r0 = ellipseRadius(Lh, Wh, a) * 0.8;
    const [sx, sy] = P(r0 * Math.cos(a), r0 * Math.sin(a));
    const w0 = U(0.12, 0.2) * Wh * (1 + 0.22 * Math.min(L / R, 1.5));
    let bend = rng.n(0, 0.34);
    if (angdiff(hd + bend, DOWN) < (25 * Math.PI) / 180 && L > 18) bend = -bend; // do not curl into a drip
    finger(K, rng, sx, sy, hd, L, w0, bend, L > 0.9 * R && rng.next() < 0.5);
  });
  for (let i = 0, n = rng.poisson(2.5); i < n; i++) {
    // few forward satellites
    const a = rng.vonmises(0, 1.2);
    const d = ellipseRadius(Lh, Wh, a) * U(1.35, 2.3);
    const s = U(0.8, 2.0);
    K.add(...P(d * Math.cos(a), d * Math.sin(a)), (s * U(1.0, 1.6)) / 1.3, s / 1.3, theta + a, U(1.8, 2.3), s, 2);
  }
  const crown: CrownSpine[] = [];
  for (let i = 0, n = rng.int(14, 21); i < n; i++) {
    const a = U(-Math.PI, Math.PI);
    crown.push([a, ellipseRadius(Lh, Wh, a), U(0.25, 0.5) * R * (1 + 0.35 * Math.cos(a)), U(0.75, 1.2), rng.next() < 0.6, U(1.1, 1.6), rng.n(0, 0.1)]);
  }
  return { rows: K.rows, crown };
}

/**
 * A kernel list compiled for repeated evaluation (outline marching, peak and
 * drip-root probes): trig and inverse variances computed once, not per probe.
 */
class KernelField {
  private n = 0;
  private d: Float64Array;
  constructor(rows: number[], keep: (kind: number) => boolean = (k) => k !== 3) {
    const m = rows.length / KS;
    this.d = new Float64Array(m * 7);
    for (let i = 0; i < rows.length; i += KS) {
      if (!keep(rows[i + 7])) continue;
      const o = this.n * 7;
      this.d[o] = rows[i];
      this.d[o + 1] = rows[i + 1];
      this.d[o + 2] = 1 / (2 * rows[i + 2] * rows[i + 2]);
      this.d[o + 3] = 1 / (2 * rows[i + 3] * rows[i + 3]);
      this.d[o + 4] = Math.cos(rows[i + 4]);
      this.d[o + 5] = Math.sin(rows[i + 4]);
      this.d[o + 6] = rows[i + 5];
      this.n++;
    }
  }
  at(x: number, y: number) {
    const d = this.d;
    let F = 0;
    for (let i = 0, o = 0; i < this.n; i++, o += 7) {
      const dx = x - d[o];
      const dy = y - d[o + 1];
      const u = dx * d[o + 4] + dy * d[o + 5];
      const v = -dx * d[o + 5] + dy * d[o + 4];
      const q = u * u * d[o + 2] + v * v * d[o + 3];
      if (q < 12) F += d[o + 6] * Math.exp(-q);
    }
    return F;
  }
}

/**
 * Hero of a floor hit (spray running up the wall from below): an egg /
 * teardrop of 2-4 offset lobes along the travel axis — round back where it
 * touched first, narrowing toward the leading edge — a scalloped front and a
 * short, uneven crown of spines at the leading edge. Rim features sit on the
 * actual outline of the body (marched, not assumed elliptic).
 */
export function makeHeroDrop(rng: Rng, R: number, theta: number, e: number): { rows: number[]; crown: CrownSpine[] } {
  const K = new KL();
  const U = (a: number, b: number) => rng.u(a, b);
  const el = 1 / Math.max(e, 0.75) ** 0.7;
  const Lh = R * el * U(1.24, 1.36);
  const Wh = R * U(0.98, 1.08);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const P = (u: number, v: number): [number, number] => [u * ct - v * st, u * st + v * ct];

  K.add(...P(-0.26 * Lh, rng.n(0, 0.05) * Wh), 0.52 * Wh * U(0.92, 1.08), 0.58 * Wh, theta + rng.n(0, 0.15), 2.6, R, 0);
  K.add(...P(0.12 * Lh, rng.n(0, 0.09) * Wh), 0.4 * Lh, 0.42 * Wh, theta + rng.n(0, 0.22), U(2.2, 2.45), R, 0);
  if (rng.next() < 0.8) K.add(...P(0.46 * Lh, rng.n(0, 0.12) * Wh), 0.25 * Lh, 0.25 * Wh, theta + rng.n(0, 0.3), U(1.95, 2.2), 0.8 * R, 0);
  const sides = [rng.next() < 0.5 ? 1 : -1];
  if (rng.next() < 0.55) sides.push(-sides[0]);
  sides.forEach((sd, k) => {
    const a = sd * U(1.15, 2.35);
    const rr = U(0.5, 0.66) * ellipseRadius(0.85 * Lh, Wh, a) * (k === 0 ? 1 : 0.85);
    const s = U(0.26, 0.38) * Wh * (k === 0 ? 1 : 0.8);
    K.add(...P(rr * Math.cos(a) - 0.08 * Lh, rr * Math.sin(a)), s * U(1.0, 1.35), s, theta + a + rng.n(0, 0.3), U(2.0, 2.35), 1.1 * s, 0);
  });
  for (let i = 0, n = 2 + Math.floor(R / 10); i < n; i++) {
    const a = U(-Math.PI, Math.PI);
    const rr = U(0.1, 0.45) * ellipseRadius(0.8 * Lh, 0.8 * Wh, a);
    const s = U(0.16, 0.26) * Wh;
    K.add(...P(rr * Math.cos(a), rr * Math.sin(a)), s * U(1.0, 1.4), s, theta + rng.n(0, 0.6), U(0.6, 1.0), Wh * 0.8, 0);
  }
  // outline of the body so far: centroid + rim radius per direction
  const body = K.rows.slice();
  const bodyField = new KernelField(body);
  let cx = 0;
  let cy = 0;
  let wsum = 0;
  for (let i = 0; i < body.length; i += KS) {
    const w = body[i + 5] * body[i + 2] * body[i + 3];
    cx += body[i] * w;
    cy += body[i + 1] * w;
    wsum += w;
  }
  cx /= wsum;
  cy /= wsum;
  const NR = 48;
  const prof = new Float32Array(NR);
  for (let i = 0; i < NR; i++) {
    const ph = theta - Math.PI + (i / NR) * TAU;
    const dx = Math.cos(ph);
    const dy = Math.sin(ph);
    let r = 0;
    let prev = bodyField.at(cx, cy);
    for (; r < 4 * Lh; r += 0.75) {
      const f = bodyField.at(cx + dx * (r + 0.75), cy + dy * (r + 0.75));
      if (f < 1) {
        r += 0.75 * clip((prev - 1) / Math.max(prev - f, 1e-6), 0, 1);
        break;
      }
      prev = f;
    }
    prof[i] = r;
  }
  const rim = (phi: number) => prof[((Math.round(((phi + Math.PI) / TAU) * NR) % NR) + NR) % NR];
  const Q = (phi: number, r: number): [number, number] => [cx + r * Math.cos(theta + phi), cy + r * Math.sin(theta + phi)];
  for (let i = 0, n = rng.int(5, 9); i < n; i++) {
    const phi = clip(rng.n(0, 1.0), -Math.PI, Math.PI);
    const sz = U(0.08, 0.15) * Wh;
    K.add(...Q(phi, rim(phi) * U(0.86, 0.97)), (sz * U(1.0, 1.5)) / 1.3, sz / 1.3, theta + phi + Math.PI / 2 + rng.n(0, 0.4), U(1.5, 1.9), sz * 1.2, 0);
  }
  const nsp = rng.int(2, 5);
  const angs: number[] = [];
  for (let tries = 0; angs.length < nsp && tries < 400; tries++) {
    const a = rng.n(0, 0.5);
    if (Math.abs(a) < 0.95 && angs.every((b) => angdiff(a, b) > 0.34)) angs.push(a);
  }
  for (const a of angs) {
    const L = R * clip(0.2 * (1 - rng.next()) ** (-1 / 1.4), 0.14, 0.8);
    const hd = theta + a + rng.n(0, 0.12);
    const [sx, sy] = Q(a, rim(a) * 0.86);
    finger(K, rng, sx, sy, hd, L, U(0.12, 0.19) * Wh, clip(rng.n(0, 0.25), -0.4, 0.4), L > 0.6 * R && rng.next() < 0.4, rng.next() < 0.75, 1.9);
  }
  for (let i = 0, n = rng.poisson(1.6); i < n; i++) {
    const a = rng.vonmises(0, 1.4);
    const s = U(0.8, 1.8);
    K.add(...Q(a, rim(a) * U(1.3, 2.0)), (s * U(1.0, 1.6)) / 1.3, s / 1.3, theta + a, U(1.8, 2.3), s, 2);
  }
  const crown: CrownSpine[] = [];
  for (let i = 0, n = rng.int(12, 18); i < n; i++) {
    const a = U(-Math.PI, Math.PI);
    crown.push([a, rim(a), U(0.22, 0.45) * R * (1 + 0.35 * Math.cos(a)), U(0.75, 1.15), rng.next() < 0.6, U(1.1, 1.6), rng.n(0, 0.1)]);
  }
  // re-centre on the body centroid (the crown radii are measured from it)
  const rows = K.rows;
  for (let i = 0; i < rows.length; i += KS) {
    rows[i] -= cx;
    rows[i + 1] -= cy;
  }
  return { rows, crown };
}

/**
 * Impact-driven spatter stain. R half width, theta travel direction on the
 * wall, e = sin(impact angle): an egg body (round where it touched first), a
 * flattened front of 2-3 lobes, scallops denser on the leading side, a tail
 * that depends on the angle (absent / curved / split), spines, a tadpole
 * satellite on oblique hits and a pepper of satellites.
 */
export function makeStain(rng: Rng, R: number, theta: number, e: number, pepper = 0.6): number[] {
  const K = new KL();
  const U = (a: number, b: number) => rng.u(a, b);
  const Lh = R / e;
  const Wh = R;
  const cu = Math.cos(theta);
  const su = Math.sin(theta);
  const P = (u: number, v: number): [number, number] => [u * cu - v * su, u * su + v * cu];

  if (R < 1.4) {
    // mist dot: anisotropic, stretched along travel
    const stretch = Math.max(1 / e, U(1.25, 1.8));
    K.add(0, 0, (R * stretch) / 1.3, R / 1.3, theta, U(1.6, 2.3), R * 0.9, 0);
    return K.rows;
  }
  const obl = 1 - e; // 0 perpendicular .. 0.7 grazing
  K.add(...P(-0.04 * Lh, 0), Lh / 1.55, Wh / 1.45, theta, 2.3, Wh, 0);
  K.add(...P(-0.4 * Lh, rng.n(0, 0.05) * Wh), Wh / 1.5, Wh / 1.5, theta, 1.55, Wh, 0);
  const nfr = rng.next() < 0.55 ? 2 : 3;
  const sc = U(0.85, 1.1);
  for (let i = 0; i < nfr; i++) {
    const v = (-0.4 + (0.8 * i) / (nfr - 1)) * Wh * sc + rng.n(0, 0.07 * Wh);
    const u = (0.4 + U(-0.06, 0.07)) * Lh * (1 - 0.3 * (v / Wh) ** 2);
    const s = U(0.3, 0.42) * Wh;
    K.add(...P(u, v), s * U(1.0, 1.35), s, theta + rng.n(0, 0.25), U(1.45, 1.95), Wh * 0.8, 0);
  }
  if (R >= 3.0) {
    // scalloped rim: small bumps, denser on the leading side
    for (let i = 0, n = Math.floor(2 + 0.45 * R + rng.int(0, 3)); i < n; i++) {
      const phi = clip(rng.n(0, 1.1 + 1.2 * e), -Math.PI, Math.PI);
      const rr = U(0.84, 0.98) * ellipseRadius(Lh, Wh, phi);
      const sz = U(0.1, 0.19) * Wh;
      K.add(...P(rr * Math.cos(phi), rr * Math.sin(phi)), (sz * U(1.0, 1.5)) / 1.3, sz / 1.3, theta + phi + Math.PI / 2 + rng.n(0, 0.4), U(1.55, 2.0), sz * 1.2, 0);
    }
  }
  for (let i = 0, n = 1 + Math.floor(R / 6); i < n; i++) {
    const u = U(-0.5, 0.5) * Lh;
    const v = U(-0.4, 0.4) * Wh * (1 - (Math.abs(u) / Lh) * 0.5);
    const s = (U(0.3, 0.5) * Wh) / 1.35;
    K.add(...P(u, v), s * U(1.0, 1.5), s, theta + rng.n(0, 0.35), U(1.3, 1.9), Wh * 0.9, 0);
  }
  // tail along the travel direction; longer for grazing hits; some absent, some split
  const pTail = 0.18 + 0.7 * Math.min(obl / 0.45, 1);
  if (R >= 1.8 && rng.next() < pTail) {
    const Lt = R * (0.35 + 2.4 * obl) * Math.min(0.5 * (1 - rng.next()) ** (-1 / 1.7), 2.4);
    const v0 = rng.n(0, 0.2) * Wh;
    const [x, y] = P(0.8 * Lh * (1 - 0.3 * (v0 / Wh) ** 2), v0);
    const bend = clip(rng.n(0, 0.45) * 0.5, -TAIL_BEND, TAIL_BEND);
    const w0 = U(0.2, 0.33) * Wh;
    if (rng.next() < 0.22 && Lt > 3) {
      const sp = U(0.2, 0.45);
      for (const sgn of [-1, 1]) {
        finger(K, rng, x, y, theta + sgn * sp + 0.25 * bend, Lt * U(0.5, 0.95), w0 * 0.72, clip(rng.n(0, 0.3), -TAIL_BEND, TAIL_BEND), false, rng.next() < 0.5, 1.85);
      }
    } else {
      finger(K, rng, x, y, theta + rng.n(0, 0.12), Math.max(Lt, 1), w0, bend, false, rng.next() < 0.6, 1.9);
    }
  }
  if (R >= 2.2) {
    // oblique hits: a few spines on the front; near-perpendicular: short spines all round
    const nsp = Math.min(rng.poisson(0.4 + 0.16 * R * (1.2 - e) + (e > 0.78 ? 0.12 * R : 0)), 6);
    const spread = 0.55 + 1.6 * Math.max(e - 0.6, 0) * 2.5;
    const used: number[] = [];
    for (let i = 0; i < nsp; i++) {
      const phi = clip(rng.n(0, spread), -Math.PI, Math.PI);
      if (used.some((b) => angdiff(phi, b) < 0.4)) continue;
      used.push(phi);
      const r0 = ellipseRadius(Lh, Wh, phi) * 0.82;
      const ln = R * Math.min(0.25 * (1 - rng.next()) ** (-1 / 1.5), 1.1) * (Math.abs(phi) < 1.2 ? 1 : 0.55);
      const [x, y] = P(r0 * Math.cos(phi), r0 * Math.sin(phi));
      finger(K, rng, x, y, theta + phi + rng.n(0, 0.15), Math.max(ln, 0.8), U(0.1, 0.18) * Wh, clip(rng.n(0, 0.25), -TAIL_BEND, TAIL_BEND), false, rng.next() < 0.5, 1.85);
    }
  }
  if (obl > 0.25 && R > 2.6 && rng.next() < 0.45) {
    // tadpole / exclamation satellite
    const d = Lh * U(1.45, 2.4);
    const ang = rng.n(0, 0.1);
    const s = R * U(0.2, 0.33);
    K.add(...P(d * Math.cos(ang), d * Math.sin(ang)), s / e ** 0.5 / 1.3, s / 1.3, theta + ang, 2.2, s, 2);
  }
  for (let i = 0, n = rng.poisson(pepper * 0.5 * R); i < n; i++) {
    const phi = rng.n(0, 0.55 + e);
    const dist = ellipseRadius(Lh, Wh, phi) * U(1.25, 3.0);
    const s = U(0.5, 1.3) * (R / 8) ** 0.35;
    const stc = U(1.2, 1.8);
    K.add(...P(dist * Math.cos(phi), dist * Math.sin(phi)), s * stc, s, theta + phi * 0.5, U(1.7, 2.3), s * 1.2, 2);
  }
  return K.rows;
}

/**
 * Low-frequency rim perturbation, baked into the kernels: each one is moved
 * and scaled radially by s(φ) = 1 + Σ a_k cos(kφ + p_k) about the centre, so
 * no two stains share the same smooth outline.
 */
export function warpRows(rows: number[], theta: number, coef: [number, number, number][]) {
  if (!coef.length) return;
  for (let i = 0; i < rows.length; i += KS) {
    const dx = rows[i];
    const dy = rows[i + 1];
    const r = Math.hypot(dx, dy);
    const phi = Math.atan2(dy, dx) - theta;
    let s = 1;
    for (const [k, a, p] of coef) s += a * Math.cos(k * phi + p);
    s = 1 + (s - 1) * clip(r / 3, 0, 1);
    rows[i] = dx * s;
    rows[i + 1] = dy * s;
    rows[i + 2] *= s;
    rows[i + 3] *= s;
  }
}

/**
 * Crown spines of the hero for one of its first two frames after touchdown
 * (k = 0, 1): thin ridges out of the rim with a bead at the tip, longer and
 * denser on the very first frame.
 */
export function crownRows(crown: CrownSpine[], theta: number, k: 0 | 1, spread: number): number[] {
  const K = new KL();
  const ct = Math.cos(theta);
  const sn = Math.sin(theta);
  const ridge = k === 0 ? 1.85 : 1.35;
  for (const [a, r0, ln, w, tip, tb, dh] of crown) {
    const hd = theta + a + dh;
    const ua = Math.cos(a);
    const va = Math.sin(a);
    const bx = spread * 0.96 * r0 * (ua * ct - va * sn);
    const by = spread * 0.96 * r0 * (ua * sn + va * ct);
    const L = ln * (k === 0 ? 1.25 : 1);
    const ww = w * (k === 0 ? 1 : 0.75);
    const m = Math.max(3, Math.floor(L / 1.1));
    const ds = L / m;
    for (let j = 0; j <= m; j++) {
      const f = j / m;
      const sa = (ww * 1.25) / 1.2;
      const sc = (ww * (1 - 0.45 * f)) / 1.2;
      const amp = Math.min(ridge, (ridge * ds) / (sa * 2.5066));
      K.add(bx + ds * j * Math.cos(hd), by + ds * j * Math.sin(hd), sa, sc, hd, amp, 1.5, 3);
    }
    if (tip) {
      const gap = k === 0 ? 0 : 1.5;
      const r = tb * ww;
      K.add(bx + (L + r + gap) * Math.cos(hd), by + (L + r + gap) * Math.sin(hd), r / 1.25, r / 1.25, hd, 2.0, 1.5, 3);
    }
  }
  return K.rows;
}

/**
 * Highest field value of a stain, probed at its body kernels: the drying
 * erosion raises the threshold toward it, so every stain — a speck or the
 * hero — is gone by the end of the same clock.
 */
export function peakOf(rows: number[]) {
  const f = new KernelField(rows);
  let pk = 1.05;
  for (let i = 0; i < rows.length; i += KS) {
    if (rows[i + 7] !== 0 && rows[i + 7] !== 2) continue;
    pk = Math.max(pk, f.at(rows[i], rows[i + 1]));
  }
  return pk;
}

/** Lowest row of a stain's BODY under column x (fingers and tails do not count). */
export function bodyBottom(rows: number[], x: number, R: number) {
  const body = new KernelField(rows, (k) => k === 0);
  let best = 0.6 * R;
  let found = false;
  for (let y = 0; y < 4 * R + 8; y += 1) {
    if (body.at(x, y) > 1.25) {
      best = y;
      found = true;
    } else if (found && y > best + 3) break;
  }
  if (found) {
    for (let y = best + 0.25; y < best + 1; y += 0.25) {
      if (body.at(x, y) > 1.25) best = y;
      else break;
    }
  }
  return best;
}
