'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { lerp } from '@/lib/lerp';
import { zoomOf } from '@/lib/zoom';
import { stepSpring, type SpringConfig, type SpringState } from '@/lib/spring';
import { clamp01, metaballPath, smoothstep, springOf } from './liquid';

export type MorphRefs = {
  /** Positioning context every rect below is measured in (the header). */
  root: RefObject<HTMLElement | null>;
  button: RefObject<HTMLElement | null>;
  blob: RefObject<HTMLDivElement | null>;
  tint: RefObject<HTMLDivElement | null>;
  /** The menu content, laid out at the panel's resting rect — its box IS the
      morph's destination, so the CSS stays the single source of the layout. */
  content: RefObject<HTMLDivElement | null>;
  neckSvg: RefObject<SVGSVGElement | null>;
  neck: RefObject<SVGPathElement | null>;
  neckFrom: RefObject<SVGStopElement | null>;
  neckTo: RefObject<SVGStopElement | null>;
  neckGrad: RefObject<SVGLinearGradientElement | null>;
  filter: RefObject<SVGFilterElement | null>;
  flood: RefObject<SVGFEFloodElement | null>;
  displace: RefObject<SVGFEDisplacementMapElement | null>;
};

type Edge = 'top' | 'right' | 'bottom' | 'left';
const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];
type EdgeMotion = { spring: SpringConfig; delay: number };
const edge = (response: number, dampingRatio: number, delay = 0): EdgeMotion => ({
  spring: springOf(response, dampingRatio),
  delay,
});

// Each edge of the shape runs its own spring. Opening, the far edges (bottom,
// left) are the bounciest, so the panel swells out of the button and settles
// with the small iOS overshoot away from it; the top edge, which only has to
// leave the button, is the calmest. The left edge sets off 40ms late (and a
// touch quicker, so the panel still lands on the same frame): the drop first
// clears the title row, then spreads — leading with its corner, it slid
// under the title's last glyphs for ~6 frames.
// Closing is quicker and the side edge goes first, so the panel narrows into
// a drop before it is drawn back up into the button. The closing springs are
// deliberately a little underdamped: an edge is stopped dead when it reaches
// the button (it never undershoots through it), so the would-be wobble never
// shows — what it buys is a brisk arrival instead of a near-critical tail,
// which left a grey nub sitting on the button for a tenth of a second before
// the gulp. The whole close waits ~45ms first: the rows fade out in 70ms
// (menu.css), so the shape never shrinks over live text — it cut words at
// its moving edge for two frames.
const OPEN: Record<Edge, EdgeMotion> = {
  top: edge(0.4, 0.85),
  right: edge(0.42, 0.8),
  bottom: edge(0.4, 0.74),
  left: edge(0.4, 0.74, 0.04),
};
const CLOSE: Record<Edge, EdgeMotion> = {
  top: edge(0.32, 0.78, 0.06),
  right: edge(0.28, 0.8, 0.045),
  bottom: edge(0.32, 0.75, 0.06),
  left: edge(0.28, 0.8, 0.045),
};
// The button gulps when the drop comes back into it.
const BUMP = springOf(0.3, 0.38);
const BUMP_IN = 1.4;
// How close (as edge progress) the returning shape must be to the button disc
// before it counts as swallowed: ~7px on the long edge, a snap the gulp hides.
const SWALLOW_AT = 0.02;

const PANEL_RADIUS = 28;
// Gap (px) between the button and the panel's nearest corner at which the
// liquid bridge lets go. The resting gap is ~17px, so the bridge always snaps
// before the panel settles and never lingers as a stalk.
const NECK_REACH = 13;
// Rim refraction strength (feDisplacementMap scale, see MenuGlassFilter) and
// the filter region pad: frost tail (3σ) plus the farthest the rim samples.
const REFRACT_SCALE = 110;
const FILTER_PAD = 48;

const BTN_RGB: [number, number, number] = [229, 229, 230];
// What the glass reads as over the page background — the bridge fades to it
// so the liquid looks continuous where it meets the panel.
const GLASS_RGB: [number, number, number] = [244, 244, 243];
const mixRgb = (t: number) =>
  `rgb(${BTN_RGB.map((c, i) => Math.round(c + (GLASS_RGB[i] - c) * t)).join(' ')})`;

type Circle = { cx: number; cy: number; r: number };
type Box = Record<Edge, number>;

function createEngine(refs: MorphRefs) {
  // Progress of each edge from the button (0) to the panel (1).
  const e: Record<Edge, SpringState> = {
    top: { value: 0, velocity: 0 },
    right: { value: 0, velocity: 0 },
    bottom: { value: 0, velocity: 0 },
    left: { value: 0, velocity: 0 },
  };
  const bump: SpringState = { value: 0, velocity: 0 };
  let target = 0;
  let previous = 0;
  let since = 0; // seconds since the last toggle (edge delays count from it)
  let raf = 0;
  let last = 0;
  let reduced = false;
  // Closed and absorbed into the button (nothing of the shape is drawn).
  let swallowed = true;
  let btnColor = 'rgb(229 229 230)';
  let B: Circle = { cx: 0, cy: 0, r: 10 };
  let T: Box = { top: 0, right: 0, bottom: 0, left: 0 };

  const measure = () => {
    const root = refs.root.current;
    const btn = refs.button.current;
    const content = refs.content.current;
    if (!root || !btn || !content) return;
    // Sub-pixel exact: the panel is centred with calc(50% − 103.5px) and the
    // button by flex, so both land on half pixels, which offsetLeft would
    // round — and the copy laid over the button must cover it exactly. Rects
    // are visual px, so the body zoom is divided back out (lib/zoom). The
    // button's centre is read from its rect (its bump scale is centred, so the
    // centre is unaffected) and its radius from layout.
    const z = zoomOf(root);
    const rr = root.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const r = btn.offsetWidth / 2;
    B = {
      cx: (br.left + br.width / 2 - rr.left) / z,
      cy: (br.top + br.height / 2 - rr.top) / z,
      r,
    };
    const cr = content.getBoundingClientRect();
    T = {
      left: (cr.left - rr.left) / z,
      top: (cr.top - rr.top) / z,
      right: (cr.right - rr.left) / z,
      bottom: (cr.bottom - rr.top) / z,
    };
    const filter = refs.filter.current;
    if (filter) {
      // Sized once per morph for the largest the shape gets (the panel plus
      // its overshoot), so the region is not rewritten every frame.
      filter.setAttribute('x', String(-FILTER_PAD));
      filter.setAttribute('y', String(-FILTER_PAD));
      filter.setAttribute('width', String(Math.ceil(T.right - T.left + FILTER_PAD * 2 + 40)));
      filter.setAttribute('height', String(Math.ceil(T.bottom - T.top + FILTER_PAD * 2 + 40)));
    }
  };

  const hide = () => {
    if (refs.blob.current) refs.blob.current.style.visibility = 'hidden';
    if (refs.neckSvg.current) refs.neckSvg.current.style.visibility = 'hidden';
    if (refs.content.current) refs.content.current.style.clipPath = '';
  };

  const bumpButton = () => {
    const btn = refs.button.current;
    if (btn) btn.style.transform = Math.abs(bump.value) > 5e-4 ? `scale(${(1 + bump.value).toFixed(4)})` : '';
  };

  // The chevron flips while the liquid covers the button (see menu.css).
  const setChevron = (up: boolean) => {
    const btn = refs.button.current;
    if (btn) btn.dataset.chevron = up ? 'up' : 'down';
  };

  // Reduced motion: the plate sits at the panel's resting rect and only
  // fades (CSS). Rewritten on every measure, so a resize or a rotation with
  // the menu open keeps the glass under the content it belongs to.
  const placeResting = () => {
    const blob = refs.blob.current;
    if (!blob) return;
    blob.style.transform = `translate(${T.left}px, ${T.top}px)`;
    blob.style.width = `${T.right - T.left}px`;
    blob.style.height = `${T.bottom - T.top}px`;
    blob.style.borderRadius = `${PANEL_RADIUS}px`;
    if (refs.root.current?.hasAttribute('data-refract')) {
      refs.flood.current?.setAttribute('width', String(T.right - T.left));
      refs.flood.current?.setAttribute('height', String(T.bottom - T.top));
      refs.displace.current?.setAttribute('scale', String(REFRACT_SCALE));
    }
  };

  const render = () => {
    const blob = refs.blob.current;
    const root = refs.root.current;
    if (!blob || !root) return;
    if (reduced) {
      placeResting();
      return;
    }
    const p = {
      top: Math.max(0, e.top.value),
      right: Math.max(0, e.right.value),
      bottom: Math.max(0, e.bottom.value),
      left: Math.max(0, e.left.value),
    };
    const grow = Math.min(p.top, p.right, p.bottom, p.left);
    bumpButton();
    if (target === 0 && swallowed) {
      hide();
      return;
    }

    // Edges interpolate from the button circle to the panel rect. Past 1 they
    // keep going, so an overshoot swells the panel away from the button — the
    // far edges most — like a spring anchored at its source.
    const left = lerp(B.cx - B.r, T.left, p.left);
    const right = lerp(B.cx + B.r, T.right, p.right);
    const top = lerp(B.cy - B.r, T.top, p.top);
    const bottom = lerp(B.cy + B.r, T.bottom, p.bottom);
    const w = Math.max(right - left, 1);
    const ht = Math.max(bottom - top, 1);
    // Circle → 28px corners, capped so a narrow drop stays a capsule.
    const radius = Math.min(lerp(B.r, PANEL_RADIUS, smoothstep(0, 0.55, grow)), w / 2, ht / 2);

    blob.style.visibility = 'visible';
    blob.style.transform = `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px)`;
    blob.style.width = `${w.toFixed(2)}px`;
    blob.style.height = `${ht.toFixed(2)}px`;
    blob.style.borderRadius = `${radius.toFixed(2)}px`;

    // The shape starts as an exact copy of the button laid over it, so the
    // button itself seems to stretch; it keeps the button's grey until it has
    // slid off the disc, then clears into glass as it opens up.
    const glass = smoothstep(0.12, 0.42, grow);
    if (refs.tint.current) refs.tint.current.style.opacity = (1 - glass).toFixed(3);
    blob.style.setProperty('--lgm-glass', glass.toFixed(3));
    // The hairline seam comes in within the first frames, so the edge stays
    // crisp while the grey clears (tied to the glass it went soft halfway);
    // the top light follows the glass; the drop shadow ramps a touch later —
    // a 40px shadow under a 30px drop is a smudge, not depth. Written whole
    // from here, not as var()-driven colour maths in the stylesheet, so every
    // engine gets a plain value.
    const seam = smoothstep(0.015, 0.12, grow);
    const depth = smoothstep(0.08, 0.45, grow);
    blob.style.boxShadow =
      `inset 0 1px 0 rgba(255,255,255,${(0.95 * glass).toFixed(3)}), ` +
      `0 0 0 0.5px rgba(0,0,0,${(0.16 * seam).toFixed(3)}), ` +
      `0 4px 40px rgba(0,0,0,${(0.18 * depth).toFixed(3)})`;

    if (root.hasAttribute('data-refract')) {
      // The displacement map is built from a flood the size of the shape, so
      // the refracting rim follows the morph pixel for pixel (percentage
      // subregions do not resolve against the element box in a backdrop
      // filter). It fades in with size: on a 20px drop a 6px rim is all lens.
      refs.flood.current?.setAttribute('width', w.toFixed(1));
      refs.flood.current?.setAttribute('height', ht.toFixed(1));
      refs.displace.current?.setAttribute('scale', (REFRACT_SCALE * smoothstep(40, 150, Math.min(w, ht))).toFixed(1));
    }

    const content = refs.content.current;
    if (content) {
      content.style.clipPath =
        `inset(${(top - T.top).toFixed(1)}px ${(T.right - right).toFixed(1)}px ` +
        `${(T.bottom - bottom).toFixed(1)}px ${(left - T.left).toFixed(1)}px round ${radius.toFixed(1)}px)`;
    }

    // Liquid bridge between the button and the nearest top corner of the
    // shape. Geometric, not timed: it exists while the two are within reach
    // and thins as they part, so opening pinches it off and closing grows it
    // back just before the panel is swallowed.
    const neckSvg = refs.neckSvg.current;
    const neck = refs.neck.current;
    if (neckSvg && neck) {
      const r1 = B.r * (1 + bump.value);
      const r2 = Math.max(radius, 4);
      const minX = left + r2;
      const maxX = right - r2;
      const c2x = minX <= maxX ? Math.min(Math.max(B.cx, minX), maxX) : (left + right) / 2;
      const c2 = { x: c2x, y: top + r2 };
      const gap = Math.hypot(c2.x - B.cx, c2.y - B.cy) - r1 - r2;
      const path =
        gap < NECK_REACH
          ? metaballPath(
              { x: B.cx, y: B.cy },
              r1,
              c2,
              r2,
              0.5 * Math.pow(clamp01(1 - Math.max(gap, 0) / NECK_REACH), 0.75),
            )
          : null;
      if (path) {
        neck.setAttribute('d', path);
        const g = refs.neckGrad.current;
        if (g) {
          g.setAttribute('x1', B.cx.toFixed(1));
          g.setAttribute('y1', (B.cy + r1 * 0.4).toFixed(1));
          g.setAttribute('x2', c2.x.toFixed(1));
          g.setAttribute('y2', (c2.y - r2 * 0.4).toFixed(1));
        }
        refs.neckFrom.current?.setAttribute('stop-color', btnColor);
        refs.neckTo.current?.setAttribute('stop-color', mixRgb(glass));
        neckSvg.style.visibility = 'visible';
      } else {
        neckSvg.style.visibility = 'hidden';
      }
    }
  };

  const tick = (now: number) => {
    // Real elapsed time (capped only against a backgrounded tab), split into
    // ≤4ms substeps: a slow device drops frames but the menu still opens in
    // the same 0.4s instead of playing in slow motion.
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 10);
    last = now;
    since += dt;
    const motion = target ? OPEN : CLOSE;
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    for (let i = 0; i < steps; i++) {
      for (const k of EDGES) {
        // Until its delay has passed an edge keeps chasing the old target, so
        // a reversal mid-flight never snaps.
        const goal = since >= motion[k].delay ? target : previous;
        Object.assign(e[k], stepSpring(e[k], goal, motion[k].spring, dt / steps));
      }
      Object.assign(bump, stepSpring(bump, 0, BUMP, dt / steps));
    }
    if (target === 0) {
      // Back on the button: the shape is dropped (it is the button's double
      // by now, so nothing pops), the chevron has turned underneath, and the
      // button takes the leftover momentum as a small gulp.
      for (const k of EDGES) if (e[k].value < 0) e[k].value = e[k].velocity = 0;
      if (!swallowed && EDGES.every((k) => e[k].value < SWALLOW_AT)) {
        swallowed = true;
        setChevron(false);
        bump.velocity += BUMP_IN;
      }
    }
    render();
    const rest =
      EDGES.every((k) => Math.abs(e[k].value - target) < 1e-3 && Math.abs(e[k].velocity) < 1e-2) &&
      Math.abs(bump.value) < 5e-4 &&
      Math.abs(bump.velocity) < 1e-2;
    if (rest) {
      for (const k of EDGES) {
        e[k].value = target;
        e[k].velocity = 0;
      }
      bump.value = bump.velocity = 0;
      render();
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const run = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const onResize = () => {
    measure();
    render();
  };
  window.addEventListener('resize', onResize);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
  if (refs.content.current) ro?.observe(refs.content.current);

  return {
    set(open: boolean, isReduced: boolean) {
      const next = open ? 1 : 0;
      measure();
      const blob = refs.blob.current;
      if (isReduced) {
        // Reduced motion: no shape change at all — the panel simply fades in
        // and out in place (CSS, data-mode="fade").
        reduced = true;
        cancelAnimationFrame(raf);
        raf = 0;
        target = previous = next;
        for (const k of EDGES) {
          e[k].value = next;
          e[k].velocity = 0;
        }
        bump.value = bump.velocity = 0;
        swallowed = !open;
        hide();
        bumpButton();
        setChevron(open);
        placeResting();
        if (blob) {
          blob.style.visibility = '';
          blob.style.setProperty('--lgm-glass', '1');
          blob.style.boxShadow = '';
          if (refs.tint.current) refs.tint.current.style.opacity = '0';
          blob.dataset.mode = 'fade';
          blob.toggleAttribute('data-open', open);
        }
        return;
      }
      if (reduced && blob) {
        delete blob.dataset.mode;
        blob.removeAttribute('data-open');
      }
      reduced = false;
      if (next === target && !raf) {
        render();
        return;
      }
      previous = target;
      target = next;
      since = 0;
      if (open) {
        // Match whatever state the button is drawn in (hover darkens it), so
        // the copy laid over it is indistinguishable on the first frame.
        const btn = refs.button.current;
        if (btn) btnColor = getComputedStyle(btn).backgroundColor;
        if (refs.tint.current) refs.tint.current.style.background = btnColor;
        swallowed = false;
        setChevron(true);
      }
      run();
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    },
  };
}

/**
 * Drives the button → panel morph imperatively (rAF + springs) so a toggle
 * mid-flight reverses from the current shape and velocity, and React never
 * re-renders per frame.
 */
export function useLiquidMorph(open: boolean, reduced: boolean, refs: MorphRefs) {
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);

  useEffect(() => {
    const eng = createEngine(refs);
    engine.current = eng;
    return () => {
      eng.destroy();
      engine.current = null;
    };
    // The refs object is created once by the caller and never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engine.current?.set(open, reduced);
  }, [open, reduced]);
}
