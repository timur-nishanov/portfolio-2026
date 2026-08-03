'use client';

import { useEffect, useRef } from 'react';
import { site } from '@/data/site';
import { clamp, lerp, q } from '@/lib/lerp';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Ball = { label: string; href: string };

const BALLS: Ball[] = [
  { label: 'X.COM', href: 'https://x.com/nem_etis' },
  { label: 'INST', href: 'https://instagram.com/nishanovtim' },
  { label: 'TG', href: site.telegram },
];

// --- physics ---------------------------------------------------------------
// Same model as the hero head — no gravity. A ball sits still until it's
// grabbed, follows the pointer only while the button is held, then keeps the
// momentum of the flick: it flies off, bounces off the viewport edges and eases
// back to a stop. It never falls or drifts on its own.
const WALL_BOUNCE = 0.72; // keeps most of its energy on a bounce
const BALL_BOUNCE = 0.4; // between balls: a knock, not a ricochet
const DAMP = 0.85; // velocity retained per second after release (eases to rest)
const REST_SPEED = 22; // below this a free ball stops
const MAX_THROW = 2600;

type Body = { x: number; y: number; vx: number; vy: number; r: number };

export function Footer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    const els = elsRef.current.filter(Boolean) as HTMLAnchorElement[];
    if (els.length !== BALLS.length) return;

    let W = stage.clientWidth;
    let H = stage.clientHeight;
    const bodies: Body[] = [];

    const layout = (initial: boolean) => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      els.forEach((el, i) => {
        const r = el.offsetWidth / 2;
        if (initial) {
          // Spread across the full width so the outer two rest right against
          // the left and right edges, still until grabbed.
          const slots = [r, W / 2, W - r];
          bodies[i] = { x: slots[i] ?? W / 2, y: H * 0.5, vx: 0, vy: 0, r };
        } else if (bodies[i]) {
          bodies[i].r = r;
          bodies[i].x = clamp(bodies[i].x, r, Math.max(r, W - r));
          bodies[i].y = clamp(bodies[i].y, r, Math.max(r, H - r));
        }
      });
    };
    layout(true);

    const ro = new ResizeObserver(() => layout(false));
    ro.observe(stage);

    // --- grab / throw (only while the pointer is held down on a ball) --------
    let dragging = -1;
    let lastPX = 0;
    let lastPY = 0;
    let lastT = 0;
    let moved = false;

    const local = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      const p = local(e);
      // Topmost ball under the cursor wins; a miss is left alone.
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r) {
          dragging = i;
          moved = false;
          lastPX = p.x;
          lastPY = p.y;
          lastT = performance.now();
          b.vx = b.vy = 0;
          // Capture the pointer so the matching up/cancel is guaranteed to land
          // here even if the gesture ends over another element.
          try {
            stage.setPointerCapture(e.pointerId);
          } catch {
            /* capture is best-effort */
          }
          break;
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      if (dragging < 0) return;
      const p = local(e);
      const now = performance.now();
      const dt = Math.min(Math.max((now - lastT) / 1000, 1 / 240), 1 / 30);
      const b = bodies[dragging];
      const dx = p.x - lastPX;
      const dy = p.y - lastPY;
      if (Math.hypot(dx, dy) > 3) moved = true;
      // Follow the pointer exactly while held, clamped inside the stage.
      b.x = clamp(p.x, b.r, Math.max(b.r, W - b.r));
      b.y = clamp(p.y, b.r, Math.max(b.r, H - b.r));
      // Smoothed velocity, but responsive to a flick so the release has real
      // momentum for the bounce.
      b.vx = lerp(b.vx, dx / dt, 0.6);
      b.vy = lerp(b.vy, dy / dt, 0.6);
      lastPX = p.x;
      lastPY = p.y;
      lastT = now;
      e.preventDefault();
    };

    const onUp = () => {
      if (dragging < 0) return;
      const b = bodies[dragging];
      // Cap the flick so it can't be launched like a bullet — direction kept.
      const s = Math.hypot(b.vx, b.vy);
      if (s > MAX_THROW) {
        b.vx = (b.vx / s) * MAX_THROW;
        b.vy = (b.vy / s) * MAX_THROW;
      }
      dragging = -1; // released — it flies off and bounces on its own from here
    };

    // Clicking a ball opens its link in a new tab, and the page can lose the
    // pointer before `pointerup` ever arrives — which left the ball glued to
    // the cursor. Any of these means the gesture is over: drop the grab and
    // kill the stale velocity so it doesn't fling itself on the way out.
    const release = () => {
      if (dragging < 0) return;
      const b = bodies[dragging];
      b.vx = 0;
      b.vy = 0;
      dragging = -1;
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') release();
    };

    // A drag must not also open the link.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        moved = false;
      }
    };

    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onVisibility);
    els.forEach((el) => el.addEventListener('click', onClick));

    // --- loop ---------------------------------------------------------------
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const decay = Math.pow(DAMP, dt);

      for (let i = 0; i < bodies.length; i++) {
        if (i === dragging) continue;
        const b = bodies[i];
        b.vx *= decay;
        b.vy *= decay;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Bounce off all four edges — no floor, no gravity.
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * WALL_BOUNCE;
        } else if (b.x > W - b.r) {
          b.x = W - b.r;
          b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
        }
        if (b.y < b.r) {
          b.y = b.r;
          b.vy = Math.abs(b.vy) * WALL_BOUNCE;
        } else if (b.y > H - b.r) {
          b.y = H - b.r;
          b.vy = -Math.abs(b.vy) * WALL_BOUNCE;
        }

        // Once it has bled its momentum, let it rest where it stopped.
        if (Math.hypot(b.vx, b.vy) < REST_SPEED) {
          b.vx = 0;
          b.vy = 0;
        }
      }

      // Ball vs ball: separate the overlap, then swap the normal component.
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d === 0 || d >= min) continue;
          const nx = dx / d;
          const ny = dy / d;
          const overlap = min - d;
          const aFixed = i === dragging;
          const bFixed = j === dragging;
          if (!aFixed && !bFixed) {
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;
          } else if (aFixed) {
            b.x += nx * overlap;
            b.y += ny * overlap;
          } else {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
          }
          const sep = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (sep > 0) continue; // already parting
          const imp = -(1 + BALL_BOUNCE) * sep * 0.5;
          if (!aFixed) {
            a.vx -= imp * nx;
            a.vy -= imp * ny;
          }
          if (!bFixed) {
            b.vx += imp * nx;
            b.vy += imp * ny;
          }
        }
      }

      // Separating an overlap can shove a ball back through a wall, so the
      // stage bounds are enforced once more after the collision pass —
      // otherwise a resting cluster slowly squeezes itself off both edges.
      for (let i = 0; i < bodies.length; i++) {
        if (i === dragging) continue;
        const b = bodies[i];
        b.x = clamp(b.x, b.r, Math.max(b.r, W - b.r));
        b.y = clamp(b.y, b.r, Math.max(b.r, H - b.r));
      }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        els[i].style.transform = `translate3d(${q(b.x - b.r)}px, ${q(b.y - b.r)}px, 0)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onVisibility);
      els.forEach((el) => el.removeEventListener('click', onClick));
    };
  }, [reduced]);

  return (
    <footer className="pb-[clamp(24px,3vw,48px)] pt-[clamp(40px,6vw,90px)]">
      {/* Full-viewport stage — the balls rest spread across the whole width and
          can be flung right up to either edge. Reduced motion → static row. */}
      <div
        ref={stageRef}
        className={`relative h-[min(88vh,52vw)] min-h-[340px] w-full touch-none overflow-hidden ${
          reduced ? 'flex items-center justify-center gap-2' : ''
        }`}
      >
        {/* Pure vw with no max cap: three balls of 32vw span ~96vw, so they
            reach both screen edges at every breakpoint instead of shrinking
            into the middle on a wide monitor. The label is sized in vw too, so
            its ratio to the ball stays constant as the viewport grows. */}
        {BALLS.map((b, i) => (
          <a
            key={b.label}
            ref={(n) => {
              elsRef.current[i] = n;
            }}
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`glass-ball grid size-[36vw] min-h-[118px] min-w-[118px] cursor-grab select-none place-items-center rounded-full active:cursor-grabbing ${
              reduced ? 'relative' : 'absolute left-0 top-0 will-change-transform'
            }`}
          >
            <span className="pixel relative z-10 text-[max(16px,6.6vw)] leading-none text-ink">
              {b.label}
            </span>
          </a>
        ))}
      </div>
    </footer>
  );
}
