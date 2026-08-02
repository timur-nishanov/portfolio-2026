'use client';

import { useEffect, useRef } from 'react';
import { site } from '@/data/site';
import { clamp, q } from '@/lib/lerp';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Ball = {
  label: string;
  href: string;
  /** Flat platform tint laid over the frosted glass — no gradient, just a
   *  colour so each ball reads as its own brand while staying liquid glass. */
  tint: string;
  ink: string;
};

const BALLS: Ball[] = [
  {
    label: 'X.COM',
    href: 'https://x.com/nem_etis',
    tint: 'rgba(17,17,20,0.72)',
    ink: '#ffffff',
  },
  {
    label: 'INST',
    href: 'https://instagram.com/nishanovtim',
    tint: 'rgba(221,64,138,0.42)',
    ink: '#ffffff',
  },
  {
    label: 'TG',
    href: site.telegram,
    tint: 'rgba(42,158,224,0.44)',
    ink: '#ffffff',
  },
];

// --- physics ---------------------------------------------------------------
const GRAVITY = 2100; // px/s²
const WALL_BOUNCE = 0.42; // floor/side restitution — soft, not rubbery
const BALL_BOUNCE = 0.3; // between balls: they knock, they don't ping apart
const AIR = 0.999;
const GROUND_FRICTION = 0.86; // horizontal bleed once resting
const REST_SPEED = 26; // below this on the floor, stop jittering
const MAX_THROW = 2200;

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
          // Spread across the stage and dropped from above the top edge at
          // staggered heights, so they arrive one after another.
          bodies[i] = { x: W * (0.26 + i * 0.24), y: -r - i * 240 - 140, vx: 0, vy: 0, r };
        } else if (bodies[i]) {
          bodies[i].r = r;
          bodies[i].x = clamp(bodies[i].x, r, Math.max(r, W - r));
          bodies[i].y = Math.min(bodies[i].y, H - r);
        }
      });
    };
    layout(true);

    const ro = new ResizeObserver(() => layout(false));
    ro.observe(stage);

    // Hold the drop until the footer is actually on screen.
    let running = false;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) running = true; }, {
      threshold: 0.15,
    });
    io.observe(stage);

    // --- drag / throw -------------------------------------------------------
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
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r) {
          dragging = i;
          moved = false;
          lastPX = p.x;
          lastPY = p.y;
          lastT = performance.now();
          b.vx = b.vy = 0;
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
      b.x = p.x;
      b.y = p.y;
      b.vx = dx / dt;
      b.vy = dy / dt;
      lastPX = p.x;
      lastPY = p.y;
      lastT = now;
      e.preventDefault();
    };

    const onUp = () => {
      if (dragging < 0) return;
      const b = bodies[dragging];
      const s = Math.hypot(b.vx, b.vy);
      if (s > MAX_THROW) {
        b.vx = (b.vx / s) * MAX_THROW;
        b.vy = (b.vy / s) * MAX_THROW;
      }
      dragging = -1;
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
    els.forEach((el) => el.addEventListener('click', onClick));

    // --- loop ---------------------------------------------------------------
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (running) {
        for (let i = 0; i < bodies.length; i++) {
          if (i === dragging) continue;
          const b = bodies[i];
          b.vy += GRAVITY * dt;
          b.vx *= AIR;
          b.vy *= AIR;
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.x < b.r) {
            b.x = b.r;
            b.vx = Math.abs(b.vx) * WALL_BOUNCE;
          } else if (b.x > W - b.r) {
            b.x = W - b.r;
            b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
          }
          if (b.y > H - b.r) {
            b.y = H - b.r;
            b.vy = -Math.abs(b.vy) * WALL_BOUNCE;
            b.vx *= GROUND_FRICTION;
            if (Math.abs(b.vy) < REST_SPEED) b.vy = 0;
          }
        }

        // Ball vs ball: separate, then swap the normal component. Equal mass,
        // low restitution — a knock rather than a ricochet.
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
      io.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      els.forEach((el) => el.removeEventListener('click', onClick));
    };
  }, [reduced]);

  return (
    <footer className="pb-10 pt-[clamp(40px,6vw,90px)]">
      <div className="container-cases">
        {/* Stage: the balls drop in here and settle on its floor. Under reduced
            motion they're laid out as a static row instead. */}
        {/* Narrower than the content band on purpose: three balls this size
            can't sit side by side in it, so they pile into a cluster the way
            the mockup shows instead of lining up along the floor. */}
        <div
          ref={stageRef}
          className={`relative mx-auto h-[clamp(380px,45vw,650px)] w-full max-w-[clamp(320px,52vw,760px)] touch-none overflow-hidden ${
            reduced ? 'flex items-end justify-center gap-6' : ''
          }`}
        >
          {BALLS.map((b, i) => (
            <a
              key={b.label}
              ref={(n) => {
                elsRef.current[i] = n;
              }}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`glass grid size-[clamp(150px,24vw,350px)] cursor-grab select-none place-items-center rounded-full active:cursor-grabbing ${
                reduced ? 'relative' : 'absolute left-0 top-0 will-change-transform'
              }`}
              // Flat tint over the frosted glass — inline backgroundColor
              // overrides .glass's white so the liquid effect keeps its blur
              // and highlights but takes on the brand colour.
              style={{ backgroundColor: b.tint }}
            >
              <span
                className="pixel text-[clamp(18px,5.55vw,80px)] leading-none"
                style={{ color: b.ink }}
              >
                {b.label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 sm:flex-row">
          <span className="pixel text-[11px] text-ink-muted">TIMUR © 2026</span>
          <a
            href={`mailto:${site.email}`}
            className="pixel text-[11px] text-ink-muted transition-colors hover:text-ink"
          >
            {site.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
