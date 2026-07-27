/**
 * Blood splatter for the floating head (a deliberate gag): when the head hits a
 * viewport edge hard enough, droplets spray off the contact point, arc under
 * gravity and fade. Plain 2D canvas — cheap, and it only draws while droplets
 * are alive, so an idle page costs nothing.
 */

type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  /** Sticky drips cling to the wall and crawl instead of flying. */
  drip: boolean;
  /** Per-drop gravity multiplier — varies how quickly each one arcs down. */
  gScale: number;
  /** Per-drop horizontal drag — low values let sideways spatter carry further. */
  drag: number;
};

const GRAVITY = 1500; // px/s²
const SHADES = ['#b1121f', '#8b0000', '#c4162a', '#7a0b16'];

export function createBloodField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  let drops: Drop[] = [];
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

  /**
   * Spray from a contact point. (nx, ny) is the inward wall normal in *screen*
   * space, `power` the impact speed in world units — it scales count and spread.
   *
   * Real splatter isn't a single cone: a fast main spray off the normal, plus
   * a handful of stray back-spatter droplets that fling off at wide or even
   * reversed angles. Mixing the two, and letting the main spray keep more of
   * its sideways momentum (less drag below), is what stops everything reading
   * as "it just falls down" once gravity takes over.
   */
  const splash = (x: number, y: number, nx: number, ny: number, power: number) => {
    const strength = Math.min(power, 3);
    const count = Math.round(8 + strength * 9);
    const center = Math.atan2(ny, nx);
    for (let i = 0; i < count; i++) {
      // Most droplets fan out around the impact normal; a minority fly wide —
      // anywhere from perpendicular to nearly backward — like stray spatter.
      const wild = Math.random() < 0.22;
      const spread = wild
        ? (Math.random() - 0.5) * Math.PI * 1.9
        : (Math.random() - 0.5) * Math.PI * 0.95;
      const baseAngle = center + spread;
      const speed = (90 + Math.random() * 320) * (0.45 + strength * 0.35) * (wild ? 0.55 : 1);
      const drip = Math.random() < 0.22;
      drops.push({
        x: x + (Math.random() - 0.5) * 26,
        y: y + (Math.random() - 0.5) * 26,
        vx: Math.cos(baseAngle) * speed * (drip ? 0.15 : 1),
        vy: Math.sin(baseAngle) * speed * (drip ? 0.15 : 1),
        r: (drip ? 2.4 : 1.6) + Math.random() * (drip ? 4 : 4.6),
        life: 0,
        maxLife: drip ? 1.8 + Math.random() * 1.4 : 0.9 + Math.random() * 0.9,
        drip,
        // Per-drop gravity and drag variance so trajectories fan out into
        // different arcs instead of every drop converging on the same curve.
        gScale: 0.75 + Math.random() * 0.6,
        drag: drip ? 0.9 : 0.25 + Math.random() * 0.45,
      });
    }
    // Keep the field bounded if someone spams the head into a corner.
    if (drops.length > 420) drops = drops.slice(-420);
  };

  const step = (dt: number) => {
    if (!ctx) return;
    if (drops.length === 0) {
      // Nothing alive — leave the canvas clear and skip the work entirely.
      return;
    }
    ctx.clearRect(0, 0, w, h);

    for (const d of drops) {
      d.life += dt;
      d.vy += GRAVITY * (d.drip ? 0.22 : 1) * d.gScale * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (!d.drip) d.vx *= Math.exp(-d.drag * dt);

      const k = d.life / d.maxLife;
      const alpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
      if (alpha <= 0) continue;

      ctx.globalAlpha = Math.max(0, alpha) * 0.92;
      ctx.fillStyle = SHADES[(d.r * 10) % SHADES.length | 0] ?? SHADES[0];

      // Stretch the droplet along its motion so fast ones read as streaks.
      const speed = Math.hypot(d.vx, d.vy);
      const stretch = Math.min(1 + speed / 420, 2.6);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(Math.atan2(d.vy, d.vx));
      ctx.scale(stretch, 1);
      ctx.beginPath();
      ctx.arc(0, 0, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    drops = drops.filter((d) => d.life < d.maxLife && d.y < h + 60);
    if (drops.length === 0) ctx.clearRect(0, 0, w, h);
  };

  return { splash, step, resize };
}
