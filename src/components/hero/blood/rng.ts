/**
 * Seeded randomness for the blood. Every splash draws from its own stream, so
 * a stain's shape, its drips and its satellites stay consistent with each
 * other (and a given seed replays the same splash, which is what the
 * side-by-side checks against the approved frames rely on).
 */
export type Rng = {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [a, b). */
  u(a?: number, b?: number): number;
  /** Normal(mu, sigma). */
  n(mu?: number, sigma?: number): number;
  /** Integer in [a, b). */
  int(a: number, b: number): number;
  poisson(lambda: number): number;
  /** von Mises around mu with concentration kappa (angles). */
  vonmises(mu: number, kappa: number): number;
};

export function makeRng(seed: number): Rng {
  // mulberry32: tiny, fast, and plenty for shapes nobody can audit by eye.
  let a = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare: number | null = null;
  const gauss = () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    while (u <= 1e-12) u = next();
    const v = next();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  return {
    next,
    u: (lo = 0, hi = 1) => lo + (hi - lo) * next(),
    n: (mu = 0, sigma = 1) => mu + sigma * gauss(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo)),
    poisson(lambda) {
      if (lambda <= 0) return 0;
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= next();
      } while (p > L && k < 200);
      return k - 1;
    },
    vonmises(mu, kappa) {
      // Best & Fisher (1979).
      if (kappa < 1e-6) return mu + Math.PI * (2 * next() - 1);
      const r0 = 1 + Math.sqrt(1 + 4 * kappa * kappa);
      const rho = (r0 - Math.sqrt(2 * r0)) / (2 * kappa);
      const r = (1 + rho * rho) / (2 * rho);
      for (let i = 0; i < 64; i++) {
        const z = Math.cos(Math.PI * next());
        const f = (1 + r * z) / (r + z);
        const c = kappa * (r - f);
        const u2 = next();
        if (c * (2 - c) - u2 > 0 || Math.log(c / u2) + 1 - c >= 0) {
          return mu + (next() < 0.5 ? -1 : 1) * Math.acos(Math.max(-1, Math.min(1, f)));
        }
      }
      return mu;
    },
  };
}
