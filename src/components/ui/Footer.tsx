'use client';

import { useEffect, useRef } from 'react';
import { site } from '@/data/site';
import { clamp, q } from '@/lib/lerp';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Ball = { label: string; href: string };

const BALLS: Ball[] = [
  { label: 'X.COM', href: 'https://x.com/nem_etis' },
  { label: 'INST', href: 'https://instagram.com/nishanovtim' },
  { label: 'TG', href: site.telegram },
];

// --- physics (same spirit as the hero head: grab-while-held, throw, bounce) --
const GRAVITY = 2200; // px/s²
const WALL_BOUNCE = 0.6; // visible rebound off floor/walls
const BALL_BOUNCE = 0.4; // knock between balls
const AIR = 0.999;
const GROUND_FRICTION = 0.9;
const REST_SPEED = 24;
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
          // Spread across the whole width, dropped from above at staggered
          // heights so they arrive one after another and scatter.
          bodies[i] = { x: W * (0.2 + i * 0.3), y: -r - i * 260 - 120, vx: 0, vy: 0, r };
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

    let running = false;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) running = true; }, {
      threshold: 0.1,
    });
    io.observe(stage);

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
      dragging = -1; // released — it flies off on its own from here, not glued
    };

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
            if (sep > 0) continue;
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
    <footer className="pb-[clamp(24px,3vw,48px)] pt-[clamp(40px,6vw,90px)]">
      {/* Full-viewport stage — the balls drop and bounce across the whole width. */}
      <div
        ref={stageRef}
        className={`relative h-[clamp(360px,42vw,620px)] w-full touch-none overflow-hidden ${
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
            className={`glass grid size-[clamp(140px,17vw,300px)] cursor-grab select-none place-items-center rounded-full active:cursor-grabbing ${
              reduced ? 'relative' : 'absolute left-0 top-0 will-change-transform'
            }`}
          >
            <span className="pixel text-[clamp(20px,5.55vw,80px)] leading-none text-ink">
              {b.label}
            </span>
          </a>
        ))}
      </div>
    </footer>
  );
}
