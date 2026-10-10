'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { lerp } from '@/lib/lerp';
import { zoomOf } from '@/lib/zoom';
import { stepSpring, type SpringConfig, type SpringState } from '@/lib/spring';
import { clamp01, metaball, smoothstep, springOf } from './liquid';
import { MENU_FROST, MENU_SATURATE } from './MenuGlassFilter';
import { PILL_SATURATE, PILL_SOFTEN } from './PillGlassFilter';

export type MorphRefs = {
  /** Positioning context every rect below is measured in (the header). */
  root: RefObject<HTMLElement | null>;
  /** The title beside the button: the glass must not slide under it. */
  title: RefObject<HTMLElement | null>;
  button: RefObject<HTMLElement | null>;
  /** The button's glass disc (its tint, hover included, is what the morph
      starts from). */
  disc: RefObject<HTMLElement | null>;
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
  /** Clip paths that keep the bridge off the disc and off the shape. */
  neckClipDisc: RefObject<SVGPathElement | null>;
  neckClipBlob: RefObject<SVGPathElement | null>;
  filter: RefObject<SVGFilterElement | null>;
  flood: RefObject<SVGFEFloodElement | null>;
  displace: RefObject<SVGFEDisplacementMapElement | null>;
  frost: RefObject<SVGFEGaussianBlurElement | null>;
  saturate: RefObject<SVGFEColorMatrixElement | null>;
};

type Edge = 'top' | 'right' | 'bottom' | 'left';
const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];
type EdgeMotion = { spring: SpringConfig; delay: number };
const edge = (response: number, dampingRatio: number, delay = 0): EdgeMotion => ({
  spring: springOf(response, dampingRatio),
  delay,
});

// Each edge of the shape runs its own spring. Opening, the shape swells on
// both axes at once, as an iOS menu does: early on it is never more than
// about twice as tall as it is wide (a fixed 40ms hold on the left edge made
// it hang below the button as a 20px grey drip, 1:4, for five frames). The
// top edge is quick, so the drop is below the title within ~3 frames, and
// the left edge sets off the moment it is: gated on where the top edge is,
// not on a timer, so the glass never slides under the title's last glyphs
// (with any font, zoom or row width) and never waits longer than it must.
// The far edges (bottom, left) are the bounciest, so the panel settles with
// the small iOS overshoot away from the button.
// Closing is quicker and the side edge goes first, so the panel narrows into
// a drop before it is drawn back up into the button — the top edge is gated
// on the left edge being past the title, the mirror of the opening. The
// closing springs are
// deliberately a little underdamped: an edge is stopped dead when it reaches
// the button (it never undershoots through it), so the would-be wobble never
// shows — what it buys is a brisk arrival instead of a near-critical tail,
// which left a grey nub sitting on the button for a tenth of a second before
// the gulp. The whole close waits ~45ms first: the rows fade out in 70ms
// (menu.css), so the shape never shrinks over live text — it cut words at
// its moving edge for two frames.
const OPEN: Record<Edge, EdgeMotion> = {
  top: edge(0.18, 0.9),
  right: edge(0.42, 0.8),
  bottom: edge(0.48, 0.8),
  left: edge(0.3, 0.74), // + the title gate (see tick)
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
// ...and it snaps sooner if it has thinned to this waist (px): drawn down to
// nothing it read as a 1px diagonal scratch for 2–3 frames, not a liquid neck.
const NECK_MIN_WAIST = 3.5;
// The rows come in once the left edge has passed their text inset (px): with
// the content parked at its final place behind a moving clip, words showed
// cut at the edge ("andom", "areer") for a few frames.
const REVEAL_INSET = 15;
// Rim refraction strength (feDisplacementMap scale, see MenuGlassFilter) and
// the filter region pad: frost tail (3σ) plus the farthest the rim samples.
const REFRACT_SCALE = 110;
const FILTER_PAD = 48;

// How far past the disc (px) the shape reaches before it is fully drawn:
// nearer, it is all but the disc itself, and what showed of it round the
// disc was a sliver (a second rim under the button, a line, two ears).
const FADE_IN = 6;
// Room left round the shape by its clip (px): its drop shadow reaches 46.
const CLIP_PAD = 80;

type Rgba = [number, number, number, number];
// "rgb(…)" / "rgba(…)", as getComputedStyle hands colours back.
const parseRgba = (s: string, fallback: Rgba): Rgba => {
  const n = s.match(/-?[\d.]+/g)?.map(Number);
  return n && n.length >= 3 ? [n[0], n[1], n[2], n.length > 3 ? n[3] : 1] : fallback;
};
const fade = (c: Rgba, k: number): Rgba => [c[0], c[1], c[2], c[3] * k];
// Straight-alpha "a over b".
const over = (a: Rgba, b: Rgba): Rgba => {
  const al = a[3] + b[3] * (1 - a[3]);
  if (al < 1e-4) return [b[0], b[1], b[2], 0];
  const mix = (i: number) => (a[i] * a[3] + b[i] * b[3] * (1 - a[3])) / al;
  return [mix(0), mix(1), mix(2), al];
};
const css = (c: Rgba) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;

const f2 = (v: number) => v.toFixed(2);
const circlePath = (cx: number, cy: number, r: number) =>
  `M${f2(cx - r)} ${f2(cy)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0Z`;
const roundRectPath = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f2(x + r)} ${f2(y)}H${f2(x + w - r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x + w)} ${f2(y + r)}` +
  `V${f2(y + h - r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x + w - r)} ${f2(y + h)}` +
  `H${f2(x + r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x)} ${f2(y + h - r)}` +
  `V${f2(y + r)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(x + r)} ${f2(y)}Z`;
// Everything (as far as the header goes) but the shape after it, evenodd.
const EVERYWHERE = 'M-10000 -10000H10000V10000H-10000Z';

// The outer hairline's strength, the disc's to the panel's.
const hairOf = (m: number) => lerp(0.1, 0.07, m);

/**
 * The shape's edge, from the button disc's (.glass-disc, globals.css) at
 * m = 0 to the panel's resting one (menu.css) at m = 1, as one list of
 * layers so it blends: the disc's two inner lights give way to the panel's
 * hairline, the outer hair and both drops carry over and grow. While the
 * glass moves the outer hair is drawn with the disc's and the bridge's
 * instead, as one outline (the rim layer), so `hair` is off then.
 */
const edgeShadow = (m: number, hair: boolean) => {
  const a = (v: number) => v.toFixed(3);
  return (
    `inset 0 0.5px 0.5px rgba(255,255,255,${a(1 - m)}), ` +
    `inset 0 -0.5px 1px rgba(255,255,255,${a(0.6 * (1 - m))}), ` +
    `inset 0 0 0 0.5px rgba(255,255,255,${a(0.65 * m)}), ` +
    `0 0 0 0.5px rgba(0,0,0,${a(hair ? hairOf(m) : 0)}), ` +
    `0 ${f2(lerp(1, 2, m))}px ${f2(lerp(3, 6, m))}px rgba(0,0,0,${a(lerp(0.1, 0.04, m))}), ` +
    `0 ${f2(lerp(4, 10, m))}px ${f2(lerp(10, 36, m))}px rgba(0,0,0,${a(lerp(0.05, 0.1, m))})`
  );
};

type Circle = { cx: number; cy: number; r: number };
type Box = Record<Edge, number>;

type Rim = {
  g: SVGGElement;
  mask: SVGMaskElement;
  maskBack: SVGRectElement;
  maskDisc: SVGCircleElement;
  maskNeck: SVGPathElement;
  maskBlob: SVGPathElement;
  shadeNear: SVGCircleElement;
  shadeFar: SVGCircleElement;
  hairDisc: SVGCircleElement;
  hairNeck: SVGPathElement;
  hairBlob: SVGPathElement;
};

// The rim layer's parts, in the bridge's svg (SiteHeader).
function findRim(svg: SVGSVGElement | null): Rim | null {
  if (!svg) return null;
  const q = <T extends Element>(k: string) => svg.querySelector<T>(`[data-rim="${k}"]`);
  const mask = svg.querySelector<SVGMaskElement>('mask');
  const rim = {
    g: q<SVGGElement>('g'),
    mask,
    maskBack: mask?.querySelector<SVGRectElement>('rect') ?? null,
    maskDisc: q<SVGCircleElement>('m-disc'),
    maskNeck: q<SVGPathElement>('m-neck'),
    maskBlob: q<SVGPathElement>('m-blob'),
    shadeNear: q<SVGCircleElement>('shade-near'),
    shadeFar: q<SVGCircleElement>('shade-far'),
    hairDisc: q<SVGCircleElement>('r-disc'),
    hairNeck: q<SVGPathElement>('r-neck'),
    hairBlob: q<SVGPathElement>('r-blob'),
  };
  return Object.values(rim).every(Boolean) ? (rim as Rim) : null;
}

const setCircle = (el: SVGCircleElement, cx: number, cy: number, r: number) => {
  el.setAttribute('cx', f2(cx));
  el.setAttribute('cy', f2(cy));
  el.setAttribute('r', f2(r));
};

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
  // The rows have been let in for this opening (see REVEAL_INSET).
  let revealed = false;
  // The disc's tint and the panel's veil (both read off the CSS per toggle,
  // hover and reduced transparency included).
  let btnColor: Rgba = [255, 255, 255, 0.3];
  let veil: Rgba = [247, 247, 247, 0.7];
  let solidVeil = false;
  let rimCache: Rim | null = null;
  const rim = () => (rimCache ??= findRim(refs.neckSvg.current));

  // While the glass moves, the disc's hairline and shadow come off the disc
  // (menu.css, data-morph) and are drawn in the rim layer with the bridge's
  // and the shape's hairlines, outside all three: one outline round the
  // liquid, where the separate ones drew lines across its joins (and the
  // disc's shadow fell on the glass running out of it).
  const setRim = (on: boolean) => {
    const r = rim();
    if (r) r.g.style.visibility = on ? 'visible' : 'hidden';
    refs.root.current?.toggleAttribute('data-morph', on);
  };
  let B: Circle = { cx: 0, cy: 0, r: 10 };
  let T: Box = { top: 0, right: 0, bottom: 0, left: 0 };
  // The title's ink bottom and right end. Opening, the left edge holds until
  // the top edge is below the title; closing, the top edge holds until the
  // left edge is past its end — either way the glass never slides under it.
  let gateY = -Infinity;
  let gateX = -Infinity;

  const setReveal = (on: boolean) => {
    revealed = on;
    refs.content.current?.toggleAttribute('data-reveal', on);
  };

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
    // The content box is capped to the viewport in menu.css (a short landscape
    // phone), so the glass target is capped with it and the two stay one size.
    const cr = content.getBoundingClientRect();
    T = {
      left: (cr.left - rr.left) / z,
      top: (cr.top - rr.top) / z,
      right: (cr.right - rr.left) / z,
      bottom: (cr.bottom - rr.top) / z,
    };
    const title = refs.title.current;
    if (title) {
      // Line box minus the half-leading and a descent's worth: about the
      // baseline, where the digits beside the button end.
      const tr = title.getBoundingClientRect();
      const cs = getComputedStyle(title);
      const fs = parseFloat(cs.fontSize) || 20;
      const lh = parseFloat(cs.lineHeight) || fs * 1.32;
      gateY = Math.min((tr.bottom - rr.top) / z - (lh - fs) / 2 - 0.2 * fs, T.top);
      gateX = Math.min((tr.right - rr.left) / z, B.cx - B.r);
    } else {
      gateY = gateX = -Infinity;
    }
    // The rim layer's mask covers what the liquid can reach: the panel and
    // its overshoot, the button, and the shadows round them.
    const parts = rim();
    if (parts) {
      const x = Math.min(T.left, B.cx - B.r) - FILTER_PAD;
      const y = Math.min(T.top, B.cy - B.r) - FILTER_PAD;
      const w = Math.max(T.right, B.cx + B.r) + 40 + FILTER_PAD - x;
      const h = T.bottom + 40 + FILTER_PAD - y;
      for (const el of [parts.mask, parts.maskBack]) {
        el.setAttribute('x', f2(x));
        el.setAttribute('y', f2(y));
        el.setAttribute('width', f2(w));
        el.setAttribute('height', f2(h));
      }
    }
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
    // Its parts set their own visibility, which a hidden svg doesn't override.
    if (refs.neckSvg.current) refs.neckSvg.current.style.visibility = 'hidden';
    if (refs.neck.current) refs.neck.current.style.visibility = 'hidden';
    if (refs.content.current) refs.content.current.style.clipPath = '';
    setRim(false);
  };

  const bumpButton = () => {
    const btn = refs.button.current;
    if (btn) btn.style.transform = Math.abs(bump.value) > 5e-4 ? `scale(${(1 + bump.value).toFixed(4)})` : '';
  };

  // The chevron (drawn above the liquid, menu.css) crossfades to the new
  // direction the moment the menu is toggled, as the button's state.
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
      refs.frost.current?.setAttribute('stdDeviation', String(MENU_FROST));
      refs.saturate.current?.setAttribute('values', String(MENU_SATURATE));
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
    // Never flatter than it is wide (up to the disc's size): closing, the
    // bottom edge caught up with the held top edge and the drop was squashed
    // into a line under the button; now it stays a drop until it is drawn up.
    const bottom = Math.max(lerp(B.cy + B.r, T.bottom, p.bottom), top + Math.min(right - left, 2 * B.r));
    const w = Math.max(right - left, 1);
    const ht = Math.max(bottom - top, 1);
    // Circle → 28px corners, capped so a narrow drop stays a capsule.
    const radius = Math.min(lerp(B.r, PANEL_RADIUS, smoothstep(0, 0.55, grow)), w / 2, ht / 2);

    blob.style.visibility = 'visible';
    blob.style.transform = `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px)`;
    blob.style.width = `${w.toFixed(2)}px`;
    blob.style.height = `${ht.toFixed(2)}px`;
    blob.style.borderRadius = `${radius.toFixed(2)}px`;

    // The shape is the button's own glass drawn out of it: it starts on the
    // disc in the disc's tint, edge and clear glass, and clears into the
    // panel's frosted glass as it opens up. It is never drawn over the disc:
    // both are see-through, and two layers of glass read as a brighter patch
    // with a line across the button — so it is clipped round the disc, and
    // runs on from the disc's edge as the disc itself stretching.
    const glass = smoothstep(0.12, 0.42, grow);
    if (refs.tint.current) refs.tint.current.style.opacity = (1 - glass).toFixed(3);
    blob.style.backgroundColor = css(solidVeil ? veil : fade(veil, glass));
    blob.style.setProperty('--lgm-glass', glass.toFixed(3));
    const r1 = B.r * (1 + bump.value);
    const dx = B.cx - left;
    const dy = B.cy - top;
    const onDisc = dx + r1 > 0 && dx - r1 < w && dy + r1 > 0 && dy - r1 < ht;
    blob.style.clipPath = onDisc
      ? `path(evenodd, '${roundRectPath(-CLIP_PAD, -CLIP_PAD, w + CLIP_PAD * 2, ht + CLIP_PAD * 2, 0)} ${circlePath(dx, dy, r1)}')`
      : '';
    // Written whole from here, not as var()-driven colour maths in the
    // stylesheet, so every engine gets a plain value.
    const moving = raf !== 0;
    blob.style.boxShadow = edgeShadow(glass, !moving);
    const beyond = Math.max(0, bottom - (B.cy + B.r), right - (B.cx + B.r), B.cx - B.r - left);
    const shown = smoothstep(0, FADE_IN, beyond);
    blob.style.opacity = shown.toFixed(3);

    if (root.hasAttribute('data-refract')) {
      refs.frost.current?.setAttribute('stdDeviation', lerp(PILL_SOFTEN, MENU_FROST, glass).toFixed(2));
      refs.saturate.current?.setAttribute('values', lerp(PILL_SATURATE, MENU_SATURATE, glass).toFixed(3));
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
    // Opening: let the rows in (menu.css fades them top to bottom) once the
    // glass has passed their text inset, so no word is ever seen cut off.
    if (target === 1 && !revealed && left <= T.left + REVEAL_INSET) setReveal(true);

    // Liquid bridge between the button and the nearest top corner of the
    // shape. Geometric, not timed: it exists while the two are within reach
    // and thins as they part, so opening pinches it off and closing grows it
    // back just before the panel is swallowed.
    const neckSvg = refs.neckSvg.current;
    const neck = refs.neck.current;
    let neckD = '';
    if (neckSvg && neck) {
      const r2 = Math.max(radius, 4);
      const minX = left + r2;
      const maxX = right - r2;
      const c2x = minX <= maxX ? Math.min(Math.max(B.cx, minX), maxX) : (left + right) / 2;
      const c2 = { x: c2x, y: top + r2 };
      const gap = Math.hypot(c2.x - B.cx, c2.y - B.cy) - r1 - r2;
      const ball =
        gap < NECK_REACH
          ? metaball(
              { x: B.cx, y: B.cy },
              r1,
              c2,
              r2,
              0.5 * Math.pow(clamp01(1 - Math.max(gap, 0) / NECK_REACH), 0.75),
            )
          : null;
      if (ball && ball.waist >= NECK_MIN_WAIST) {
        neckD = ball.d;
        neck.setAttribute('d', ball.d);
        const g = refs.neckGrad.current;
        if (g) {
          g.setAttribute('x1', B.cx.toFixed(1));
          g.setAttribute('y1', (B.cy + r1 * 0.4).toFixed(1));
          g.setAttribute('x2', c2.x.toFixed(1));
          g.setAttribute('y2', (c2.y - r2 * 0.4).toFixed(1));
        }
        // From the disc's tint to what the shape is filled with right now;
        // drawn only between the two (both are see-through glass).
        refs.neckFrom.current?.setAttribute('stop-color', css(btnColor));
        refs.neckTo.current?.setAttribute(
          'stop-color',
          css(over(fade(btnColor, 1 - glass), solidVeil ? veil : fade(veil, glass))),
        );
        refs.neckClipDisc.current?.setAttribute('d', `${EVERYWHERE} ${circlePath(B.cx, B.cy, r1)}`);
        refs.neckClipBlob.current?.setAttribute('d', `${EVERYWHERE} ${roundRectPath(left, top, w, ht, radius)}`);
        neck.style.opacity = shown.toFixed(3);
        neck.style.visibility = 'visible';
      } else {
        neck.style.visibility = 'hidden';
      }
      neckSvg.style.visibility = 'visible';
    }

    // One outline round the disc, the bridge and the shape (see setRim). The
    // shape and the bridge count for as much as they are drawn (`shown`).
    const r = rim();
    if (r && moving) {
      const blobD = roundRectPath(left, top, w, ht, radius);
      const hair = (hairOf(glass) * shown).toFixed(3);
      setCircle(r.maskDisc, B.cx, B.cy, r1);
      r.maskNeck.setAttribute('d', neckD);
      r.maskNeck.setAttribute('fill-opacity', shown.toFixed(3));
      r.maskBlob.setAttribute('d', blobD);
      r.maskBlob.setAttribute('fill-opacity', shown.toFixed(3));
      setCircle(r.shadeNear, B.cx, B.cy + 1, r1);
      setCircle(r.shadeFar, B.cx, B.cy + 4, r1);
      setCircle(r.hairDisc, B.cx, B.cy, r1);
      r.hairNeck.setAttribute('d', neckD);
      r.hairNeck.setAttribute('stroke-opacity', hair);
      r.hairBlob.setAttribute('d', blobD);
      r.hairBlob.setAttribute('stroke-opacity', hair);
    }
    setRim(moving);
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
      // Opening, the left edge waits until the top edge is below the title
      // (or nearly home, should the title ever sit lower than the panel);
      // closing, the top edge waits until the left edge is past the title's
      // end (or nearly back on the button).
      const topY = lerp(B.cy - B.r, T.top, e.top.value);
      const leftX = lerp(B.cx - B.r, T.left, e.left.value);
      const belowTitle = topY >= gateY || e.top.value >= 0.9;
      const pastTitle = leftX >= gateX - 2 || e.left.value <= 0.05;
      for (const k of EDGES) {
        // Until its delay has passed an edge keeps chasing the old target, so
        // a reversal mid-flight never snaps.
        let go = since >= motion[k].delay;
        if (target === 1 && k === 'left' && !belowTitle) go = false;
        if (target === 0 && k === 'top' && !pastTitle) go = false;
        Object.assign(e[k], stepSpring(e[k], go ? target : previous, motion[k].spring, dt / steps));
      }
      Object.assign(bump, stepSpring(bump, 0, BUMP, dt / steps));
    }
    if (target === 0) {
      // Back on the button: the shape is dropped (it is the button's double
      // by now, so nothing pops), and the button takes the leftover momentum
      // as a small gulp.
      for (const k of EDGES) if (e[k].value < 0) e[k].value = e[k].velocity = 0;
      if (!swallowed && EDGES.every((k) => e[k].value < SWALLOW_AT)) {
        swallowed = true;
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
      raf = 0;
      render();
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
        setReveal(open);
        placeResting();
        if (blob) {
          blob.style.visibility = '';
          blob.style.setProperty('--lgm-glass', '1');
          blob.style.boxShadow = '';
          blob.style.backgroundColor = '';
          blob.style.clipPath = '';
          blob.style.opacity = '';
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
      setChevron(open);
      // Each opening reveals the rows afresh; closing drops them at once.
      setReveal(false);
      // Match whatever state the disc is drawn in (hover lightens it), so the
      // glass running out of it, or back into it, is the same glass.
      const disc = refs.disc.current ?? refs.button.current;
      if (disc) btnColor = parseRgba(getComputedStyle(disc).backgroundColor, btnColor);
      if (refs.tint.current) refs.tint.current.style.background = css(btnColor);
      if (blob) {
        blob.style.backgroundColor = '';
        veil = parseRgba(getComputedStyle(blob).backgroundColor, veil);
        solidVeil = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
      }
      if (open) swallowed = false;
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
