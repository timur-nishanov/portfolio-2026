/**
 * Blood splatter for the floating head — a gag that lives on /blank only (see
 * the `blood` prop on Head3D), where the head is filmed for clips. When the
 * head hits a wall hard enough, droplets spray off the contact point, arc
 * under gravity and fade; a few of them fly "at the camera" and land on the
 * glass as splats that cling, run a little, and dissolve.
 *
 * Plain 2D canvas, and it only draws while something is alive, so an idle
 * page costs nothing. Nothing here is a plain circle on purpose: every drop
 * is a teardrop with its tail behind its motion and its own slightly-off
 * proportions, and every splat is a lumpy blob with satellites and spikes —
 * the round-dot version read as a diagram of blood, not blood.
 */

type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  shade: number;
  /** Aspect of the blob, fixed per drop, so no two are the same shape. */
  squash: number;
  /** Resting rotation for a drop too slow to be oriented by its motion. */
  spin: number;
  kind: 'fly' | 'mist' | 'drip';
  gScale: number;
  drag: number;
  /** Seconds until this one hits the glass and becomes a splat; 0 = never. */
  toGlass: number;
};

type Splat = {
  x: number;
  y: number;
  r: number;
  shade: number;
  life: number;
  maxLife: number;
  /** Radius modulation around the main blob, so its outline is lumpy. */
  rim: number[];
  /** Satellite droplets: angle, distance (× r) and radius (× r). */
  lobes: { a: number; d: number; r: number }[];
  /** Thin spikes off the rim: angle and length (× r). */
  spikes: { a: number; len: number }[];
  /** How far the run-off crawls down the glass, px; 0 for none. */
  drip: number;
  dripW: number;
};

const GRAVITY = 1500; // px/s²
const SHADES = ['#a80e1c', '#8a0b16', '#c0142a', '#6e0a13', '#b81a2b'];
const MAX_DROPS = 420;
const MAX_SPLATS = 22;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;

export function createBloodField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  let drops: Drop[] = [];
  let splats: Splat[] = [];
  let w = 0;
  let h = 0;
  let dpr = 1;

  const resize = (width: number, height: number, pixelRatio: number) => {
    w = width;
    h = height;
    dpr = pixelRatio;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /** A drop that reached the glass: it stops, spreads and sticks. */
  const land = (d: Drop, strength: number) => {
    const r = rnd(5, 17) * (0.8 + strength * 0.25);
    const rim: number[] = [];
    for (let i = 0; i < 16; i++) rim.push(1 + (Math.random() - 0.5) * 0.36);
    const lobes: Splat['lobes'] = [];
    const n = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      lobes.push({ a: Math.random() * Math.PI * 2, d: rnd(0.9, 1.9), r: rnd(0.12, 0.42) });
    }
    const spikes: Splat['spikes'] = [];
    const m = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < m; i++) spikes.push({ a: Math.random() * Math.PI * 2, len: rnd(0.5, 1.6) });
    const drip = r > 8 && Math.random() < 0.7 ? rnd(28, 96) : 0;
    splats.push({
      x: Math.min(Math.max(d.x, r), w - r),
      y: Math.min(Math.max(d.y, r), h - r),
      r,
      shade: d.shade,
      life: 0,
      maxLife: rnd(2.6, 4.8),
      rim,
      lobes,
      spikes,
      drip,
      dripW: r * 0.26,
    });
    if (splats.length > MAX_SPLATS) splats = splats.slice(-MAX_SPLATS);
  };

  /**
   * Spray from a contact point. (nx, ny) is the inward wall normal in screen
   * space, `power` the impact speed in world units — it scales count, spread
   * and how many drops make it to the glass.
   *
   * Real splatter isn't a single cone: a fast main spray off the normal, plus
   * a handful of stray back-spatter droplets flung wide, a cloud of mist too
   * small to arc, and a few heavy drops that cling to the wall and crawl.
   */
  const splash = (x: number, y: number, nx: number, ny: number, power: number) => {
    const strength = Math.min(power, 3);
    const center = Math.atan2(ny, nx);
    const count = Math.round(9 + strength * 9);
    for (let i = 0; i < count; i++) {
      const wild = Math.random() < 0.22;
      const spread = wild ? (Math.random() - 0.5) * Math.PI * 1.9 : (Math.random() - 0.5) * Math.PI * 0.95;
      const angle = center + spread;
      const speed = rnd(40, 150) * (0.55 + strength * 0.3) * (wild ? 0.6 : 1);
      const drip = Math.random() < 0.18;
      // Only a hard knock throws blood at the camera, and only some of it.
      const toGlass = !drip && strength > 0.9 && Math.random() < 0.2 ? rnd(0.06, 0.26) : 0;
      drops.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 22,
        vx: Math.cos(angle) * speed * (drip ? 0.15 : 1),
        vy: Math.sin(angle) * speed * (drip ? 0.15 : 1),
        r: (drip ? 2.4 : 1.5) + Math.random() * (drip ? 3.6 : 3.4) + (toGlass ? 1.2 : 0),
        life: 0,
        maxLife: drip ? rnd(1.5, 2.7) : rnd(0.5, 1.05),
        shade: Math.floor(Math.random() * SHADES.length),
        squash: rnd(0.8, 1.2),
        spin: Math.random() * Math.PI * 2,
        kind: drip ? 'drip' : 'fly',
        gScale: rnd(0.95, 1.65),
        drag: drip ? 0.9 : rnd(0.55, 1.1),
        toGlass,
      });
    }
    // Mist: a puff of specks that hangs a moment and is gone.
    const mist = Math.round(10 + strength * 10);
    for (let i = 0; i < mist; i++) {
      const angle = center + (Math.random() - 0.5) * Math.PI * 1.3;
      const speed = rnd(20, 120) * (0.5 + strength * 0.25);
      drops.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: rnd(0.5, 1.3),
        life: 0,
        maxLife: rnd(0.25, 0.6),
        shade: Math.floor(Math.random() * SHADES.length),
        squash: 1,
        spin: 0,
        kind: 'mist',
        gScale: rnd(0.4, 1),
        drag: rnd(1.5, 3),
        toGlass: 0,
      });
    }
    if (drops.length > MAX_DROPS) drops = drops.slice(-MAX_DROPS);
    // Remember the strength for the drops that will land on the glass.
    lastStrength = strength;
  };
  let lastStrength = 1;

  /** Teardrop with the tail behind the motion; a slow drop keeps its own tilt. */
  const drawDrop = (d: Drop) => {
    if (!ctx) return;
    const speed = Math.hypot(d.vx, d.vy);
    const stretch = Math.min(1 + speed / 380, 2.8);
    const r = d.r;
    const s = d.squash;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(speed > 30 ? Math.atan2(d.vy, d.vx) : d.spin);
    const tail = r * (0.6 + stretch);
    ctx.beginPath();
    ctx.moveTo(-tail, 0);
    ctx.quadraticCurveTo(-r * 0.3, -r * s * 1.05, r * 0.9, -r * s * 0.35);
    ctx.quadraticCurveTo(r * 1.25, 0, r * 0.9, r * s * 0.35);
    ctx.quadraticCurveTo(-r * 0.3, r * s * 1.05, -tail, 0);
    ctx.fill();
    ctx.restore();
  };

  const drawSplat = (sp: Splat, alpha: number) => {
    if (!ctx) return;
    // Lands with a quick spread — not a pop into place.
    const born = Math.min(1, sp.life / 0.1);
    const scale = 0.55 + 0.45 * easeOut(born);
    const r = sp.r * scale;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = SHADES[sp.shade];
    // Main blob with a lumpy rim.
    ctx.beginPath();
    for (let i = 0; i < sp.rim.length; i++) {
      const a = (i / sp.rim.length) * Math.PI * 2;
      const rr = r * sp.rim[i];
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    for (const l of sp.lobes) {
      ctx.beginPath();
      ctx.arc(Math.cos(l.a) * r * l.d, Math.sin(l.a) * r * l.d, r * l.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const k of sp.spikes) {
      const bx = Math.cos(k.a) * r * 0.85;
      const by = Math.sin(k.a) * r * 0.85;
      const tx = Math.cos(k.a) * r * (0.85 + k.len);
      const ty = Math.sin(k.a) * r * (0.85 + k.len);
      const nx = -Math.sin(k.a) * r * 0.16;
      const ny = Math.cos(k.a) * r * 0.16;
      ctx.beginPath();
      ctx.moveTo(bx + nx, by + ny);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - nx, by - ny);
      ctx.closePath();
      ctx.fill();
    }
    // The run-off: a tapering trail that grows down the glass and ends in
    // a bead, gathering speed as it goes the way a drip does.
    if (sp.drip > 0 && born >= 1) {
      const p = Math.min(1, (sp.life - 0.1) / (sp.maxLife * 0.7));
      const len = sp.drip * easeIn(p);
      if (len > 1) {
        const top = r * 0.5;
        const wTop = sp.dripW;
        const wEnd = sp.dripW * 0.55;
        ctx.beginPath();
        ctx.moveTo(-wTop, top);
        ctx.lineTo(wTop, top);
        ctx.lineTo(wEnd, top + len);
        ctx.lineTo(-wEnd, top + len);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, top + len, wEnd * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const step = (dt: number) => {
    if (!ctx) return;
    if (drops.length === 0 && splats.length === 0) return;
    ctx.clearRect(0, 0, w, h);

    const landed: Drop[] = [];
    for (const d of drops) {
      d.life += dt;
      if (d.toGlass > 0 && d.life >= d.toGlass) {
        landed.push(d);
        continue;
      }
      d.vy += GRAVITY * (d.kind === 'drip' ? 0.22 : 1) * d.gScale * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.kind !== 'drip') d.vx *= Math.exp(-d.drag * dt);

      const k = d.life / d.maxLife;
      const alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      if (alpha <= 0) continue;
      ctx.globalAlpha = Math.max(0, alpha) * (d.kind === 'mist' ? 0.7 : 0.92);
      ctx.fillStyle = SHADES[d.shade];
      if (d.kind === 'mist') {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawDrop(d);
      }
    }
    for (const d of landed) land(d, lastStrength);
    if (landed.length) drops = drops.filter((d) => !landed.includes(d));

    for (const sp of splats) {
      sp.life += dt;
      const k = sp.life / sp.maxLife;
      const alpha = k < 0.72 ? 1 : 1 - (k - 0.72) / 0.28;
      if (alpha <= 0) continue;
      drawSplat(sp, Math.max(0, alpha));
    }
    ctx.globalAlpha = 1;

    drops = drops.filter((d) => d.life < d.maxLife && d.y < h + 60);
    splats = splats.filter((sp) => sp.life < sp.maxLife);
    if (drops.length === 0 && splats.length === 0) ctx.clearRect(0, 0, w, h);
  };

  return { splash, step, resize };
}
