'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { assets } from '@/data/assets';
import { site } from '@/data/site';
import { clamp, lerp, q } from '@/lib/lerp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { XGlyph, LinkedInGlyph, TelegramGlyph, GitHubGlyph, SpotifyGlyph } from './SocialGlyphs';

type Ball = {
  /** Still the accessible name — the glyph itself is decorative. */
  label: string;
  href: string;
  Glyph: (props: { className?: string }) => React.JSX.Element;
};

/**
 * Entry choreography. The balls drop in when the footer is first scrolled to,
 * and they must not arrive as one rehearsed row — each gets its own delay,
 * drop height, sideways drift and bounciness, so the three land out of step.
 * `slot` is where it comes to rest across the width (0 = left edge, 1 = right).
 */
// `lift` is how far above the top of the screen each one waits, in multiples of
// its own radius. The stage is the viewport now, so anything above 0 is simply
// off-screen and drops in cleanly.
const DROPS = [
  { delay: 0.0, slot: 0.0, lift: 0.4, drift: 55, bounce: 0.56 },
  { delay: 0.46, slot: 0.25, lift: 3.4, drift: 40, bounce: 0.52 },
  { delay: 0.34, slot: 0.5, lift: 2.6, drift: -85, bounce: 0.46 },
  { delay: 0.62, slot: 0.75, lift: 1.9, drift: -50, bounce: 0.62 },
  { delay: 0.15, slot: 1.0, lift: 1.3, drift: 35, bounce: 0.6 },
];

// No tint any more — over the photograph the glass has something real to
// refract, and a colour wash only muddied it.
const BALLS: Ball[] = [
  { label: 'X.COM', href: 'https://x.com/nem_etis', Glyph: XGlyph },
  { label: 'GitHub', href: 'https://github.com/timur-nishanov', Glyph: GitHubGlyph },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/timur-nishanov-3a7510428/',
    Glyph: LinkedInGlyph,
  },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/user/31lvoci4gojqvzj2jydxepb7raje?si=56510e97cfbf42d7',
    Glyph: SpotifyGlyph,
  },
  { label: 'Telegram', href: site.telegram, Glyph: TelegramGlyph },
];

// --- physics ---------------------------------------------------------------
// The balls fall in and live on the floor, so gravity is always on. Holding
// one still suspends it — it moves only while the button is down — and letting
// go hands its momentum back to the sim, which is where the bounce comes from.
const GRAVITY = 2000; // px/s²
const WALL_BOUNCE = 0.58; // sides and floor
const BALL_BOUNCE = 0.82; // balls spring off each other, they don't just knock
// Friction where two spheres touch. It exists to stop a resting heap creeping
// for ever, and a flat value did that at the cost of the liveliness — a real
// collision was being damped as hard as a slow slide. So it is applied by how
// fast the contact is: barely at all on an impact, in full once they are just
// leaning on each other.
const BALL_FRICTION = 0.6;
const BALL_FRICTION_HIT = 0.08;
const FRICTION_HIT_SPEED = 190; // px/s of closing speed that counts as an impact
const AIR = 0.995;
const GROUND_FRICTION = 0.9; // horizontal bleed while rolling along the floor
const REST_SPEED = 26; // below this on the floor, stop jittering
// A heap that is touching but barely moving is creep, not motion: bleed it hard
// so the pile converges. A real bounce arrives far above CREEP_SPEED and passes
// through untouched, which is what keeps the spheres lively.
const CREEP_SPEED = 300;
const CONTACT_DAMP = 0.86;
// Allowed overlap before the spheres are pushed apart. Separation moves them by
// position, not velocity, so a heap wedged against the walls kept being shoved
// out and clamped back every frame — motion no amount of velocity damping could
// see, let alone stop. A pixel of slop lets a settled pile simply stay put.
const CONTACT_SLOP = 1.2;
const SEPARATION = 0.8; // fraction of the remaining overlap resolved per tick
const MAX_THROW = 2600;

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Seconds until this one is released from above; <= 0 means it is falling. */
  wait: number;
  bounce: number;
  /** Touched the floor, a wall or another sphere on this tick — see settling. */
  contact: boolean;
};

export function Footer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const reduced = useReducedMotion();
  const [photo, setPhoto] = useState(false);

  // Start the download a section early — by the time the curtain lifts it has
  // arrived, and it costs nothing to anyone who never scrolls that far.
  useEffect(() => {
    const last = document.querySelector('#career');
    if (!last) {
      setPhoto(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPhoto(true);
        io.disconnect();
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    io.observe(last);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced || !photo) return;
    const els = elsRef.current.filter(Boolean) as HTMLElement[];
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
          const d = DROPS[i] ?? DROPS[0];
          // Parked just above the clip line — which is itself a screen higher
          // than the visible footer — so they enter from off the top of the
          // window, not from behind an invisible shelf partway down it.
          bodies[i] = {
            x: r + (W - 2 * r) * d.slot - d.drift * 0.5,
            y: -r * (1 + d.lift),
            vx: d.drift,
            vy: 0,
            r,
            wait: d.delay,
            bounce: d.bounce,
            contact: false,
          };
        } else if (bodies[i]) {
          bodies[i].r = r;
          bodies[i].x = clamp(bodies[i].x, r, Math.max(r, W - r));
          bodies[i].y = Math.min(bodies[i].y, H - r);
        }
      });
    };
    layout(true);

    const ro = new ResizeObserver(() => {
      layout(false);
      wake();
    });
    ro.observe(stage);

    // The footer is pinned behind the page, so it is technically on screen the
    // whole time — an IntersectionObserver on it would fire immediately and the
    // balls would land long before anyone saw them. What matters is how far the
    // curtain has lifted, so this measures the page's bottom edge instead and
    // starts the drop once a third of the photograph is uncovered.
    const curtain = document.querySelector('main');
    let running = false;
    const revealed = () => {
      if (!curtain) return true;
      const uncovered = window.innerHeight - curtain.getBoundingClientRect().bottom;
      return uncovered > window.innerHeight * 0.33;
    };

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
      // Spheres first, head last — the same order they are painted in, so a
      // grab where they overlap takes the one you can actually see.
      // Deliberately no setPointerCapture: capturing retargets the follow-up
      // mouse events to the stage, so the `click` never reached the <a> and
      // tapping a sphere stopped opening its link. The blur / pointercancel /
      // visibilitychange handlers below cover the lost-pointer case instead.
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r) {
          dragging = i;
          moved = false;
          lastPX = p.x;
          lastPY = p.y;
          lastT = performance.now();
          b.vx = b.vy = 0;
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

      if (!running && revealed()) running = true;

      for (let i = 0; i < bodies.length; i++) {
        if (i === dragging) continue;
        const b = bodies[i];
        // Held above the stage until the footer is in view and its own delay
        // has run out, so the three arrive out of step rather than together.
        if (!running || b.wait > 0) {
          if (running) b.wait -= dt;
          continue;
        }

        b.vy += GRAVITY * dt;
        b.vx *= AIR;
        b.vy *= AIR;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Sides and floor. The ceiling is deliberately open — a ball is still
        // falling in through it, and a throw is allowed to leave the top.
        if (b.x < b.r) {
          b.x = b.r;
          b.vx = Math.abs(b.vx) * WALL_BOUNCE;
          b.contact = true;
        } else if (b.x > W - b.r) {
          b.x = W - b.r;
          b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
          b.contact = true;
        }
        if (b.y > H - b.r) {
          b.y = H - b.r;
          b.contact = true;
          // Each ball keeps its own restitution, so they stop tossing in sync.
          b.vy = -Math.abs(b.vy) * b.bounce;
          b.vx *= GROUND_FRICTION;
          if (Math.abs(b.vy) < REST_SPEED) b.vy = 0;
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
          a.contact = true;
          b.contact = true;
          const nx = dx / d;
          const ny = dy / d;
          const overlap = Math.max(0, min - d - CONTACT_SLOP) * SEPARATION;
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
          // Friction along the contact. Without it a sphere resting on two
          // others slides down between them under gravity and never stops —
          // five of these are wider together than the floor, so the heap has
          // to stack, and a frictionless stack is a perpetual-motion machine.
          const tx = -ny;
          const ty = nx;
          const grip = -sep > FRICTION_HIT_SPEED ? BALL_FRICTION_HIT : BALL_FRICTION;
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
      // sides and the floor are enforced once more after the collision pass —
      // otherwise a resting cluster slowly squeezes itself off both edges. The
      // top is left open on purpose: balls arrive through it.
      for (let i = 0; i < bodies.length; i++) {
        if (i === dragging) continue;
        const b = bodies[i];
        b.x = clamp(b.x, b.r, Math.max(b.r, W - b.r));
        b.y = Math.min(b.y, H - b.r);
      }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        // Positioned from the element's own half-size, not the collision
        // radius — the head's circle is smaller than its box.
        const hw = els[i].offsetWidth / 2;
        const hh = els[i].offsetHeight / 2;
        els[i].style.transform = `translate3d(${q(b.x - hw)}px, ${q(b.y - hh)}px, 0)`;
      }

      // --- settling ---------------------------------------------------------
      // Five spheres are wider together than the floor they land on, so the
      // heap is permanently a little wedged and the separation impulses keep
      // nudging it about long after it looks still. Anything slow and in
      // contact with the floor or another sphere is brought to a stop, and once
      // nothing is moving the loop parks itself rather than burning a frame a
      // tick behind a page nobody is looking at. A grab, a resize or a fresh
      // reveal wakes it again.
      let awake = dragging >= 0 || !running;
      for (const b of bodies) {
        if (b.wait > 0) { awake = true; continue; }
        const speed = Math.hypot(b.vx, b.vy);
        if (b.contact && speed < REST_SPEED) {
          b.vx = 0;
          b.vy = 0;
        } else {
          if (b.contact && speed < CREEP_SPEED) {
            b.vx *= CONTACT_DAMP;
            b.vy *= CONTACT_DAMP;
          }
          if (speed > 1) awake = true;
        }
        b.contact = false;
      }
      raf = awake ? requestAnimationFrame(step) : 0;
    };

    // Restarts the loop after it has parked itself.
    const wake = () => {
      if (raf) return;
      last = performance.now();
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
  }, [reduced, photo]);

  return (
    // Pinned to the viewport and sitting *behind* the page (see globals.css:
    // main carries the background and a matching bottom margin). The last
    // section slides up over it like a curtain and this is what is underneath.
    <footer className="footer-reveal">
      {/* Fetched only once the reader reaches the last section. The footer is
          pinned, so it counts as on-screen from the start and native lazy
          loading would pull the full photograph during the first paint —
          nearly a megabyte nobody has scrolled to yet. */}
      {photo ? (
        <Image
          src={assets.lastPhoto}
          alt=""
          aria-hidden="true"
          fill
          priority={false}
          sizes="100vw"
          className="object-cover"
        />
      ) : null}

      {/* The stage is exactly the viewport now, so its top edge *is* the top of
          the screen — the balls drop in from off-screen with nothing to clip
          them, and the old grow-upward-and-pull-back trick is gone. */}
      <div
        ref={stageRef}
        className={`pointer-events-none absolute inset-0 overflow-hidden ${
          reduced ? 'flex flex-wrap items-end justify-center gap-2 pb-12' : ''
        }`}
      >
        {/* Pure vw with no max cap: five balls of 27vw span ~135vw, more than
            the floor is wide, so they settle into a heap two deep rather than
            a tidy row — which is the point. The glyph is sized in vw too, so
            its ratio to the ball stays constant as the viewport grows. */}
        {/* Mounted together with the photo, a section early. Each ball is a
            viewport-scale backdrop-filter surface — keeping three of them
            alive behind the whole page was pure GPU cost the reader never saw. */}
        {photo && BALLS.map((b, i) => (
          <a
            key={b.label}
            ref={(n) => {
              elsRef.current[i] = n;
            }}
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            // Without this the browser starts its own link-drag as soon as you
            // pull a ball, trailing a ghost of the URL across the page.
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className={`glass-ball pointer-events-auto z-10 grid size-[27vw] min-h-[104px] min-w-[104px] cursor-grab touch-none select-none place-items-center rounded-full active:cursor-grabbing ${
              reduced ? 'relative' : 'absolute left-0 top-0 will-change-transform'
            }`}
          >
            {/* The mark on its own, white — no plate, no shadow. */}
            <b.Glyph className="relative z-10 w-[8.5vw] min-w-[34px] text-white" />
            <span className="sr-only">{b.label}</span>
          </a>
        ))}
      </div>
    </footer>
  );
}
