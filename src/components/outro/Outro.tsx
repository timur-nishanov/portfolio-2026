'use client';

import { useEffect, useRef, useState } from 'react';
import { outroLinks, outroPostscript, outroText } from '@/data/outro';
import { copyText } from '@/lib/clipboard';
import { createGlass, type GlassView } from '@/lib/glassSpheres';
import { clamp, lerp } from '@/lib/lerp';
import { zoomOf } from '@/lib/zoom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { playChime } from './chime';
import './outro.css';

// How long "Copied" shows over the mail's ball, as in the menu.
const COPIED_MS = 1400;

/**
 * Entry choreography, as the old footer's balls had it. They drop in when the
 * screen is first scrolled to, and must not arrive as one rehearsed row —
 * each gets its own delay, drop height, sideways drift and bounciness, so they
 * land out of step. `slot` is where it comes down across the width (0 = left
 * edge, 1 = right); `lift` is how far above the stage it waits, in radii.
 */
const DROPS = [
  { delay: 0.0, slot: 0.0, lift: 0.4, drift: 55, bounce: 0.56 },
  { delay: 0.46, slot: 0.25, lift: 3.4, drift: 40, bounce: 0.52 },
  { delay: 0.34, slot: 0.5, lift: 2.6, drift: -85, bounce: 0.46 },
  { delay: 0.62, slot: 0.75, lift: 1.9, drift: -50, bounce: 0.62 },
  { delay: 0.15, slot: 1.0, lift: 1.3, drift: 35, bounce: 0.6 },
];

// --- physics (the old footer's, as tuned there) -----------------------------
// The balls fall in and live on the floor, so gravity is always on. Holding
// one suspends it — it moves only while the button is down — and letting go
// hands its momentum back to the sim, which is where the bounce comes from.
const GRAVITY = 2000; // px/s²
const WALL_BOUNCE = 0.58; // sides and floor
const BALL_BOUNCE = 0.82; // balls spring off each other, they don't just knock
// Below this closing speed a contact stops instead of bouncing: gravity pumps
// a resting ball into its neighbour every frame and 0.82 of that came back
// out, so the crown of a pile vibrated for ever.
const BOUNCE_MIN_SPEED = 150;
// Friction where two balls touch: barely at all on an impact, in full once
// they are just leaning on each other, so a heap stops creeping without the
// collisions going dead.
const BALL_FRICTION = 0.55;
const BALL_FRICTION_HIT = 0.06;
const FRICTION_HIT_SPEED = 190; // px/s of closing speed that counts as an impact
const AIR = 0.995;
const GROUND_FRICTION = 0.9; // horizontal bleed while rolling along the floor
const REST_SPEED = 22; // below this, a supported ball is simply parked
// A ball already resting on something and moving slower than this is
// creeping, not rolling, and is bled toward a stop.
const CREEP_SPEED = REST_SPEED * 3;
const CREEP_DAMP = 0.9;
// Overlaps resolve in full past a 1.5px allowance, immediately.
const CONTACT_SLOP = 1.5;
// Contact is detected a hair before the surfaces meet, so an exact touch
// still counts as support on the next frame.
const CONTACT_SKIN = 2;
const MAX_THROW = 2600;
// The knock that rings: only real ones, not grazes or settling.
const CHIME_MIN = 320; // px/s

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** The visible ball is the collision body, edge to edge. */
  r: number;
  /** Seconds until it is released from above; <= 0 means it is falling. */
  wait: number;
  bounce: number;
  /** Touched the floor, a wall or another ball on this tick. */
  contact: boolean;
  /** Standing on the floor this tick: the root of the support chain. */
  onFloor: boolean;
  /** Asleep: integration skips it. Woken by a real hit or a grab. */
  sleep: boolean;
  /** Seconds it has stayed within a few px of (px, py). */
  quietT: number;
  px: number;
  py: number;
};

/** Lines set one under another, each wrapping within itself. */
function Lines({ lines, className }: { lines: string[]; className: string }) {
  return (
    <p className={className}>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </p>
  );
}

/** The words as the page set them, line by line, into the glass's sheet of
    the page: a ball passing over them shows them through the glass. */
function paintWords(ctx: CanvasRenderingContext2D, stage: HTMLElement) {
  const section = stage.parentElement;
  if (!section) return;
  const box = stage.getBoundingClientRect();
  const z = zoomOf(stage);
  const range = document.createRange();
  for (const span of section.querySelectorAll<HTMLElement>('.outro__text > span')) {
    const node = span.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) continue;
    const cs = getComputedStyle(span);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.fillStyle = cs.color;
    ctx.textBaseline = 'alphabetic';
    // Its words, gathered into the lines they were set on.
    const lines: { text: string; left: number; top: number }[] = [];
    let at = 0;
    for (const word of (node.textContent ?? '').split(' ')) {
      range.setStart(node, at);
      range.setEnd(node, at + word.length);
      const r = range.getBoundingClientRect();
      const last = lines[lines.length - 1];
      if (last && Math.abs(r.top - last.top) < 4) last.text += ` ${word}`;
      else lines.push({ text: word, left: r.left, top: r.top });
      at += word.length + 1;
    }
    for (const l of lines) {
      const ascent = ctx.measureText(l.text).fontBoundingBoxAscent;
      ctx.fillText(l.text, (l.left - box.left) / z, (l.top - box.top) / z + ascent);
    }
  }
}

/**
 * The links as big balls of glass (lib/glassSpheres), each with its logo in
 * it, that drop in from above when the screen is scrolled to, bounce, and
 * settle on its floor, as the old footer's did; they can be picked up and
 * thrown, and ring when they knock. A tap opens the link (the mail's copies
 * the address). Every return to the screen drops them in again. The balls
 * are the page's own links, moved by the sim; the glass is drawn over them,
 * and without WebGL a lit disc is painted behind each logo instead. With
 * reduced motion they simply rest on the floor.
 */
function Balls() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elsRef = useRef<(HTMLElement | null)[]>([]);
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const els = elsRef.current.filter(Boolean) as HTMLElement[];
    if (els.length !== outroLinks.length) return;

    let W = stage.clientWidth;
    let H = stage.clientHeight;
    // Local px per visual px: the sim's constants are tuned in visual px.
    let zi = 1;
    const bodies: Body[] = [];

    const layout = (initial: boolean) => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      zi = 1 / zoomOf(stage);
      els.forEach((el, i) => {
        const r = el.offsetWidth / 2;
        if (initial || !bodies[i]) {
          const d = DROPS[i % DROPS.length];
          bodies[i] = {
            x: r + (W - 2 * r) * d.slot - d.drift * 0.5,
            y: -r * (1 + d.lift),
            vx: d.drift * zi,
            vy: 0,
            r,
            wait: d.delay,
            bounce: d.bounce,
            contact: false,
            onFloor: false,
            sleep: false,
            quietT: 0,
            px: 0,
            py: 0,
          };
        } else {
          bodies[i].r = r;
          bodies[i].x = clamp(bodies[i].x, r, Math.max(r, W - r));
          bodies[i].y = Math.min(bodies[i].y, H - r);
        }
      });
    };
    // Reduced motion: no drop, the balls rest on the floor at once, in rows
    // from the bottom, centred.
    const rest = () => {
      const gap = 12;
      let i = 0;
      let floor = H;
      while (i < bodies.length) {
        const d = bodies[i].r * 2;
        const per = Math.max(1, Math.floor((W + gap) / (d + gap)));
        const row = bodies.slice(i, i + per);
        const width = row.length * d + (row.length - 1) * gap;
        row.forEach((b, k) => {
          b.x = (W - width) / 2 + b.r + k * (d + gap);
          b.y = floor - b.r;
          b.vx = b.vy = 0;
          b.wait = 0;
          b.sleep = true;
        });
        floor -= d + gap;
        i += per;
      }
    };
    layout(true);
    if (reduced) rest();

    const chime = (b: Body, speed: number) => {
      playChime(speed / zi / 520, clamp((b.x / W) * 2 - 1, -0.8, 0.8), {
        pitch: clamp(150 / (b.r / zi), 0.4, 0.85),
        level: 0.55,
      });
    };

    // --- the glass ---------------------------------------------------------
    // Each ball reads the page (the words) where it is, and carries its logo
    // from a sheet of its own, a cell a ball wide for each.
    let view: GlassView | undefined;
    let cell = 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sheets = () => {
      if (!view) return;
      view.size(W, H);
      // The words are only ever seen through a passing ball, bent and a
      // touch larger: a sheet the stage's size at 1.5x is plenty, and a
      // quarter of what the screen's density would cost.
      view.page(W, H, (ctx) => paintWords(ctx, stage), Math.min(dpr, 1.5));
      cell = Math.max(...bodies.map((b) => b.r * 2));
      view.carry(
        cell * els.length,
        cell,
        (ctx, shrink) => {
          els.forEach((el, i) => {
            const logo = el.querySelector<HTMLImageElement>('.outro__logo');
            if (!logo?.complete || !logo.naturalWidth) return;
            const size = logo.offsetWidth * shrink;
            ctx.drawImage(logo, i * cell + (cell - size) / 2, (cell - size) / 2, size, size);
          });
        },
        dpr,
      );
    };
    const glass = () => {
      if (!view) return;
      bodies.forEach((b, i) => view!.set(i, b.x, b.y, b.r, b.x, b.y, [i * cell + cell / 2, cell / 2]));
      view.render();
    };
    const paint = () => {
      bodies.forEach((b, i) => {
        const half = els[i].offsetWidth / 2;
        els[i].style.transform = `translate3d(${(b.x - half).toFixed(2)}px, ${(b.y - half).toFixed(2)}px, 0)`;
      });
      glass();
    };
    paint();

    let gone = false;
    const flat =
      window.matchMedia('(forced-colors: active)').matches ||
      window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    if (!flat) {
      // three.js comes in only here, and only once the balls are on the page.
      import('three').then((THREE) => {
        if (gone) return;
        view = createGlass(THREE, canvas, els.length, stage, 1);
        if (!view) return;
        stage.setAttribute('data-gl', '');
        sheets();
        glass();
        // The words and the logos drawn again once their face and pictures
        // are in.
        const logos = els.map((el) => el.querySelector<HTMLImageElement>('.outro__logo'));
        Promise.all([document.fonts?.ready, ...logos.map((img) => img?.decode().catch(() => {}))])
          .then(() => {
            if (gone) return;
            sheets();
            glass();
          })
          .catch(() => {});
      });
    }

    // --- grab / throw (only while the pointer is held down on a ball) -------
    let dragging = -1;
    let lastPX = 0;
    let lastPY = 0;
    let lastT = 0;
    let moved = false;
    const local = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const z = zoomOf(stage);
      return { x: (e.clientX - rect.left) / z, y: (e.clientY - rect.top) / z };
    };
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      const p = local(e);
      // No setPointerCapture: it retargets the follow-up events to the
      // stage, and the click never reached the link.
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r) {
          dragging = i;
          moved = false;
          lastPX = p.x;
          lastPY = p.y;
          lastT = performance.now();
          b.vx = b.vy = 0;
          for (const o of bodies) {
            o.sleep = false;
            o.quietT = 0;
          }
          wake();
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
      // Follows the pointer exactly while held, kept inside the stage.
      b.x = clamp(p.x, b.r, Math.max(b.r, W - b.r));
      b.y = clamp(p.y, b.r, Math.max(b.r, H - b.r));
      // Smoothed velocity, but quick to a flick, so the release has momentum.
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
      // The flick capped, so it can't be launched like a bullet.
      const s = Math.hypot(b.vx, b.vy);
      if (s > MAX_THROW * zi) {
        b.vx = (b.vx / s) * MAX_THROW * zi;
        b.vy = (b.vy / s) * MAX_THROW * zi;
      }
      dragging = -1;
    };
    // A link opening in a new tab can take the pointer before pointerup
    // arrives: any of these ends the grab, and its stale velocity with it.
    const release = () => {
      if (dragging < 0) return;
      bodies[dragging].vx = 0;
      bodies[dragging].vy = 0;
      dragging = -1;
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') release();
    };
    // A throw must not also open the link or copy the address: caught on the
    // way down, before the page's own handlers.
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onVisibility);
    els.forEach((el) => el.addEventListener('click', onClick, true));

    // --- loop ---------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    let running = false;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      for (let i = 0; i < bodies.length; i++) {
        if (i === dragging) continue;
        const b = bodies[i];
        // Held above the stage until the screen is in view and its own delay
        // has run out, so they arrive out of step.
        if (!running || b.wait > 0) {
          if (running) b.wait -= dt;
          continue;
        }
        if (b.sleep) continue;

        b.vy += GRAVITY * zi * dt;
        b.vx *= AIR;
        b.vy *= AIR;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Sides and floor. The top stays open: balls arrive through it, and a
        // good throw may leave that way and come back down.
        if (b.x < b.r) {
          if (Math.abs(b.vx) > CHIME_MIN * zi) chime(b, Math.abs(b.vx));
          b.x = b.r;
          b.vx = Math.abs(b.vx) * WALL_BOUNCE;
          b.contact = true;
        } else if (b.x > W - b.r) {
          if (Math.abs(b.vx) > CHIME_MIN * zi) chime(b, Math.abs(b.vx));
          b.x = W - b.r;
          b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
          b.contact = true;
        }
        if (b.y > H - b.r - CONTACT_SKIN) {
          b.contact = true;
          b.onFloor = true;
        }
        if (b.y > H - b.r) {
          if (Math.abs(b.vy) > CHIME_MIN * zi) chime(b, Math.abs(b.vy));
          b.y = H - b.r;
          // Each keeps its own restitution, so they stop tossing in sync.
          b.vy = -Math.abs(b.vy) * b.bounce;
          b.vx *= GROUND_FRICTION;
          if (Math.abs(b.vy) < REST_SPEED * zi) b.vy = 0;
        }
      }

      // Ball against ball: separate the overlap, then swap the normal part.
      const touching: [number, number][] = [];
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          if (a.wait > 0 || b.wait > 0) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d === 0 || d >= min + CONTACT_SKIN) continue;
          a.contact = true;
          b.contact = true;
          touching.push([i, j]);
          // Two sleepers lean on each other without renegotiating it. A ball
          // striking a sleeper at speed wakes it; a slow one is pushed back
          // out one-sidedly — the sleeper is a wall, never a door.
          if (a.sleep && b.sleep) continue;
          const nx = dx / d;
          const ny = dy / d;
          if (a.sleep || b.sleep) {
            const hit = Math.hypot(a.vx - b.vx, a.vy - b.vy);
            if (hit > REST_SPEED * 3 * zi) {
              a.sleep = b.sleep = false;
              a.quietT = b.quietT = 0;
            } else {
              const overlap1 = Math.max(0, min - d - CONTACT_SLOP);
              const mover = a.sleep ? b : a;
              const sign = a.sleep ? 1 : -1;
              mover.x += sign * nx * overlap1;
              mover.y += sign * ny * overlap1;
              const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (closing < 0) {
                mover.vx -= sign * closing * nx;
                mover.vy -= sign * closing * ny;
              }
              // Static friction against the sleeper: a slow slider is held.
              if (Math.hypot(mover.vx, mover.vy) < CREEP_SPEED * 2 * zi) {
                mover.vx = 0;
                mover.vy = 0;
              }
              continue;
            }
          }
          if (d >= min) continue; // touching, not overlapping
          const overlap = Math.max(0, min - d - CONTACT_SLOP);
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
          if (-sep > CHIME_MIN * zi) chime(a, -sep);
          const e = -sep > BOUNCE_MIN_SPEED * zi ? BALL_BOUNCE : 0;
          const imp = -(1 + e) * sep * 0.5;
          if (!aFixed) {
            a.vx -= imp * nx;
            a.vy -= imp * ny;
          }
          if (!bFixed) {
            b.vx += imp * nx;
            b.vy += imp * ny;
          }
          // Friction along the contact, or a ball resting on two others
          // slides down between them and never stops.
          const tx = -ny;
          const ty = nx;
          const grip = -sep > FRICTION_HIT_SPEED * zi ? BALL_FRICTION_HIT : BALL_FRICTION;
          const slide = ((b.vx - a.vx) * tx + (b.vy - a.vy) * ty) * grip * 0.5;
          if (!aFixed) {
            a.vx += slide * tx;
            a.vy += slide * ty;
          }
          if (!bFixed) {
            b.vx -= slide * tx;
            b.vy -= slide * ty;
          }
        }
      }

      // Separating an overlap can shove a ball back through a wall, so the
      // sides and the floor are enforced once more.
      for (let i = 0; i < bodies.length; i++) {
        if (i === dragging || bodies[i].wait > 0) continue;
        const b = bodies[i];
        b.x = clamp(b.x, b.r, Math.max(b.r, W - b.r));
        b.y = Math.min(b.y, H - b.r);
      }

      paint();

      // --- settling --------------------------------------------------------
      // Slow, supported balls are brought to a stop, and once nothing moves
      // the loop parks itself; a grab, a resize or a fresh drop wakes it.
      // Support starts at the floor (or the held pointer, or sleep) and
      // climbs the heap: only a ball leaning on a supported one below its
      // centre is held up, so a cluster colliding in mid-air keeps falling.
      const supported = bodies.map((b) => b.onFloor || b.sleep);
      if (dragging >= 0) supported[dragging] = true;
      for (let pass = 0; pass < 2; pass++) {
        for (const [i, j] of touching) {
          const lower = bodies[i].y > bodies[j].y ? i : j;
          const upper = lower === i ? j : i;
          if (supported[lower]) supported[upper] = true;
        }
      }

      let awake = dragging >= 0 || !running;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.wait > 0) {
          awake = true;
          continue;
        }
        // A ball that has stayed within a few px of one spot for most of a
        // second is at rest, whatever its velocity says.
        if (i !== dragging && !b.sleep) {
          if (Math.hypot(b.x - b.px, b.y - b.py) > 4 * zi) {
            b.px = b.x;
            b.py = b.y;
            b.quietT = 0;
          } else {
            b.quietT += dt;
          }
          if (b.quietT > 0.7 && supported[i]) {
            b.sleep = true;
            b.vx = 0;
            b.vy = 0;
          }
        }
        if (b.sleep) {
          b.contact = false;
          b.onFloor = false;
          continue;
        }
        const speed = Math.hypot(b.vx, b.vy);
        if (supported[i] && speed < REST_SPEED * zi) {
          b.vx = 0;
          b.vy = 0;
        } else if (supported[i] && speed < CREEP_SPEED * zi) {
          b.vx *= CREEP_DAMP;
          b.vy *= CREEP_DAMP;
        }
        awake = true;
        b.contact = false;
        b.onFloor = false;
      }
      // Off screen and parked, it waits for the next reveal.
      raf = awake && running ? requestAnimationFrame(step) : 0;
    };
    const wake = () => {
      if (raf || reduced) return;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };

    // The drop starts once most of the screen is in view; every return gets
    // the show again: once it is off screen, the heap is parked above the
    // stage with fresh delays, painted at once so the old pose can't flash.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduced) return;
        if (entry.intersectionRatio >= 0.75 && !running) {
          running = true;
          wake();
        } else if (!entry.isIntersecting && running && dragging < 0) {
          running = false;
          cancelAnimationFrame(raf);
          raf = 0;
          layout(true);
          paint();
        }
      },
      { threshold: [0, 0.75] },
    );
    io.observe(stage);

    const ro = new ResizeObserver(() => {
      layout(false);
      if (reduced) rest();
      for (const o of bodies) {
        o.sleep = reduced;
        o.quietT = 0;
      }
      sheets();
      paint();
      if (running) wake();
    });
    ro.observe(stage);

    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onVisibility);
      els.forEach((el) => el.removeEventListener('click', onClick, true));
      stage.removeAttribute('data-gl');
      view?.dispose();
    };
  }, [reduced]);

  const copy = async (value: string) => {
    await copyText(value);
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div ref={stageRef} className="outro__stage">
      <canvas ref={canvasRef} className="outro__canvas" aria-hidden="true" />
      <ul className="outro__balls">
        {outroLinks.map((l, i) => {
          const logo = (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="outro__logo" src={l.icon} alt="" width={16} height={16} draggable={false} />
          );
          const ref = (n: HTMLElement | null) => {
            elsRef.current[i] = n;
          };
          return (
            <li key={l.label}>
              {l.kind === 'external' ? (
                <a
                  ref={ref}
                  className="outro__ball"
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={l.label}
                  // Or the browser drags a ghost of the URL along with a throw.
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {logo}
                </a>
              ) : (
                <button
                  ref={ref}
                  type="button"
                  className="outro__ball"
                  aria-label={`Copy ${l.label} address`}
                  onClick={() => copy(l.value)}
                >
                  {logo}
                  <span className="outro__note" data-on={copied ? '' : undefined} aria-hidden="true">
                    {l.copiedLabel}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Email address copied to the clipboard' : ''}
      </span>
    </div>
  );
}

/**
 * The end of the home page: a last word in the middle of the screen, and the
 * links falling in round it as balls of glass.
 */
export function Outro() {
  return (
    <section id="contact" aria-labelledby="outro-heading" className="outro">
      <h2 id="outro-heading" className="sr-only">
        Contact
      </h2>
      <Lines lines={outroText} className="outro__text" />
      <Lines lines={outroPostscript} className="outro__text outro__ps" />
      <Balls />
    </section>
  );
}
