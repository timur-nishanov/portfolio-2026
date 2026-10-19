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
  { delay: 0.0, slot: 0.0, lift: 0.4, drift: 55, bounce: 0.77 },
  { delay: 0.46, slot: 0.25, lift: 3.4, drift: 40, bounce: 0.73 },
  { delay: 0.34, slot: 0.5, lift: 2.6, drift: -85, bounce: 0.68 },
  { delay: 0.62, slot: 0.75, lift: 1.9, drift: -50, bounce: 0.82 },
  { delay: 0.15, slot: 1.0, lift: 1.3, drift: 35, bounce: 0.79 },
];

// --- size --------------------------------------------------------------------
// Clear air between the last line of the words and the balls under them.
const CLEARANCE = 28; // px
// The least a ball comes down to; past it, it may touch the words.
const MIN_BALL = 64; // px
// The gap between balls laid out at rest (reduced motion).
const REST_GAP = 12; // px

// --- physics ------------------------------------------------------------------
// Balls of glass: they knock and spring apart, slide off one another and roll
// on along the floor; nothing holds them but the floor, the sides and each
// other. Holding one suspends it — it moves only while the button is down —
// and letting go hands its momentum back to the sim.
const GRAVITY = 2000; // px/s²
// How much of a knock comes back, off the sides and off another ball (off the
// floor it is each ball's own, in DROPS).
const WALL_BOUNCE = 0.8;
const BALL_BOUNCE = 0.86;
// Slower than this, a contact is a ball resting on something rather than a
// knock, and gives nothing back: a heap would never stop trembling otherwise.
const BOUNCE_MIN = 40; // px/s
// Friction across a knock between two balls, as a share of the knock: enough
// to send them off at a slant, too little to hold one on another, so a ball
// that lands on another's shoulder rolls off it into a hollow.
const BALL_FRICTION = 0.1;
// The floor: a knock on it keeps this much of a ball's roll, and resting on
// it, a ball is held back by up to this share of what presses it there, as
// much as a rolling ball is. A roll dies away in a second or two; a ball
// with another leaning on it rolls aside and lets it down, if there is room.
const FLOOR_GRIP = 0.94;
const FLOOR_FRICTION = 0.07;
// What is left of a ball's speed in the air after a second.
const AIR = 0.95;
// Steps a frame: even a hard throw moves a ball well under its radius a step.
const SUBSTEPS = 4;
const MAX_THROW = 2600;
// The knock that rings: only real ones, not grazes or settling.
const CHIME_MIN = 320; // px/s
// At rest: every ball within a pixel of one spot for this long. The loop then
// parks itself until a grab, a resize or a fresh drop.
const QUIET_S = 0.6;

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
  /** Seconds it has stayed within a pixel of (px, py). */
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

    // How big the balls are. On a wide screen, as big as the stylesheet has
    // them: the words leave room beside them, and the balls that heap on top
    // of the others may as well come to rest partly on them, glass that they
    // show through. Where the words take the whole width (a phone) a ball on them
    // would hide them, so there, and when the balls only rest (reduced
    // motion), the size comes down a pixel at a time until the heap they
    // would make stands clear of the last line: rows of as many as fit, each
    // nested into the one below (laid flat, with gaps, as rest() lays them).
    const fit = () => {
      const section = stage.parentElement;
      if (!section) return;
      stage.style.removeProperty('--ball');
      const w = stage.clientWidth;
      let words = 0;
      let wide = 0;
      section.querySelectorAll<HTMLElement>('.outro__text').forEach((p) => {
        words = Math.max(words, p.offsetTop + p.offsetHeight);
        wide = Math.max(wide, p.offsetWidth);
      });
      if (!reduced && (w - wide) / 2 >= els[0].offsetWidth) return;
      const room = stage.clientHeight - words - CLEARANCE;
      const tall = (d: number) => {
        const gap = reduced ? REST_GAP : 0;
        const rows = Math.ceil(els.length / Math.max(1, Math.floor((w + gap) / (d + gap))));
        return reduced ? rows * d + (rows - 1) * gap : d * (1 + ((rows - 1) * Math.sqrt(3)) / 2);
      };
      let d = Math.floor(els[0].offsetWidth);
      while (d > MIN_BALL && tall(d) > room) d--;
      stage.style.setProperty('--ball', `${d}px`);
    };
    fit();

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
      const gap = REST_GAP;
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
          for (const o of bodies) o.quietT = 0;
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

    // One step of the sim, dt seconds long.
    const tick = (dt: number) => {
      const air = AIR ** dt;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (i === dragging || b.wait > 0) continue;
        b.vy += GRAVITY * zi * dt;
        b.vx *= air;
        b.vy *= air;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // Ball against ball: pushed apart, then the knock along the line between
      // their centres, as much of it given back as glass gives. Only a knock
      // has friction across it; a ball merely resting on another slides, as
      // it would roll, off its shoulder and into a hollow. The held ball is
      // the pointer's, and gives way to nothing.
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          if (a.wait > 0 || b.wait > 0) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = a.r + b.r;
          if (d === 0 || d >= min) continue;
          const ia = i === dragging ? 0 : 1;
          const ib = j === dragging ? 0 : 1;
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) / (ia + ib);
          a.x -= nx * push * ia;
          a.y -= ny * push * ia;
          b.x += nx * push * ib;
          b.y += ny * push * ib;
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn >= 0) continue; // already parting
          if (-vn > CHIME_MIN * zi) chime(a, -vn);
          const knock = -vn > BOUNCE_MIN * zi;
          const jn = (-(1 + (knock ? BALL_BOUNCE : 0)) * vn) / (ia + ib);
          let jt = 0;
          if (knock) {
            const vt = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
            jt = clamp(-vt / (ia + ib), -BALL_FRICTION * jn, BALL_FRICTION * jn);
          }
          const jx = jn * nx - jt * ny;
          const jy = jn * ny + jt * nx;
          a.vx -= jx * ia;
          a.vy -= jy * ia;
          b.vx += jx * ib;
          b.vy += jy * ib;
        }
      }

      // The sides and the floor, after the push apart, which may have shoved
      // a ball into them. The top stays open: balls arrive through it, and a
      // good throw may leave that way and come back down.
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (i === dragging || b.wait > 0) continue;
        if (b.x < b.r || b.x > W - b.r) {
          const out = b.x < b.r ? -1 : 1;
          const into = b.vx * out;
          b.x = out < 0 ? b.r : W - b.r;
          if (into > CHIME_MIN * zi) chime(b, into);
          if (into > 0) b.vx = into > BOUNCE_MIN * zi ? -b.vx * WALL_BOUNCE : 0;
        }
        if (b.y >= H - b.r) {
          b.y = H - b.r;
          if (b.vy <= 0) continue;
          if (b.vy > CHIME_MIN * zi) chime(b, b.vy);
          if (b.vy > BOUNCE_MIN * zi) {
            // Each keeps its own give, so they stop tossing in step; a knock
            // on the floor takes a little of the roll.
            b.vy = -b.vy * b.bounce;
            b.vx *= FLOOR_GRIP;
          } else {
            // Resting on the floor: friction up to a share of what presses it
            // there, so a roll dies away and a ball under a load stands firm.
            const press = b.vy;
            b.vy = 0;
            b.vx -= clamp(b.vx, -FLOOR_FRICTION * press, FLOOR_FRICTION * press);
          }
        }
      }
    };

    const step = (now: number) => {
      const frame = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // Held above the stage until the screen is in view and their own delays
      // have run out, so they arrive out of step.
      if (running) {
        for (const b of bodies) if (b.wait > 0) b.wait -= frame;
        for (let s = 0; s < SUBSTEPS; s++) tick(frame / SUBSTEPS);
      }
      paint();

      // At rest once every ball has kept within a pixel of one spot for a
      // while: the loop then parks itself.
      let moving = dragging >= 0;
      bodies.forEach((b, i) => {
        if (b.wait > 0 || i === dragging || Math.hypot(b.x - b.px, b.y - b.py) > zi) {
          b.px = b.x;
          b.py = b.y;
          b.quietT = 0;
        } else {
          b.quietT += frame;
        }
        if (b.quietT < QUIET_S) moving = true;
      });
      if (!moving) for (const b of bodies) b.vx = b.vy = 0;
      // Off screen, it waits for the next reveal.
      raf = moving && running ? requestAnimationFrame(step) : 0;
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

    // A new size of screen, or the words set again in their own face, may
    // leave other room under them.
    const refit = () => {
      fit();
      layout(false);
      if (reduced) rest();
      for (const o of bodies) o.quietT = 0;
      sheets();
      paint();
      if (running) wake();
    };
    const ro = new ResizeObserver(refit);
    ro.observe(stage);
    document.fonts?.ready
      .then(() => {
        if (!gone) refit();
      })
      .catch(() => {});

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
