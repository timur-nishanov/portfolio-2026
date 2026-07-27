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
   */
  const splash = (x: number, y: number, nx: number, ny: number, power: number) => {
    const strength = Math.min(power, 3);
    const count = Math.round(8 + strength * 9);
    const center = Math.atan2(ny, nx);
    for (let i = 0; i < count; i++) {
      // A fairly directed fan around the given direction (mostly downward),
      // so the drops fall off the head instead of spraying everywhere.
      const spread = (Math.random() - 0.5) * Math.PI * 0.7;
      const baseAngle = center + spread;
      // Slower launch — the drops should stay near the head and drip, not shoot.
      const speed = (55 + Math.random() * 190) * (0.4 + strength * 0.3);
      const drip = Math.random() < 0.24;
      drops.push({
        x: x + (Math.random() - 0.5) * 26,
        y: y + (Math.random() - 0.5) * 26,
        vx: Math.cos(baseAngle) * speed * (drip ? 0.15 : 1),
        vy: Math.sin(baseAngle) * speed * (drip ? 0.15 : 1),
        r: (drip ? 2.4 : 1.6) + Math.random() * (drip ? 4 : 4.6),
        life: 0,
        maxLife: drip ? 1.8 + Math.random() * 1.4 : 0.9 + Math.random() * 0.9,
        drip,
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
      d.vy += GRAVITY * (d.drip ? 0.22 : 1) * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (!d.drip) d.vx *= Math.exp(-0.9 * dt);

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
