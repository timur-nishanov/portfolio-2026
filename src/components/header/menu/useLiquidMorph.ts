'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { lerp } from '@/lib/lerp';
import { zoomOf } from '@/lib/zoom';
import { stepSpring, type SpringConfig, type SpringState } from '@/lib/spring';
import { smoothstep, springOf } from './liquid';
import { MENU_FROST, MENU_SATURATE } from './MenuGlassFilter';
import { PILL_SATURATE, PILL_SOFTEN } from './PillGlassFilter';

export type MorphRefs = {
  /** Positioning context every rect below is measured in (the header). */
  root: RefObject<HTMLElement | null>;
  /** The blend layer beside the header (SiteHeader): it draws the title, and
      the chevron's second ink for when no glass is under it. */
  blend: RefObject<HTMLElement | null>;
  /** The bar's glass pill (shown over the cases, closed only): while enough
      of it is under the chevron, the chevron keeps its own ink. */
  pill: RefObject<HTMLElement | null>;
  /** The title beside the button: the glass must not slide under it. */
  title: RefObject<HTMLElement | null>;
  button: RefObject<HTMLElement | null>;
  /** The button's glass disc. The moving shape takes its place: the disc is
      hidden from the frame the shape appears until the frame it lands back. */
  disc: RefObject<HTMLElement | null>;
  blob: RefObject<HTMLDivElement | null>;
  tint: RefObject<HTMLDivElement | null>;
  /** The menu content, laid out at the panel's resting rect — its box IS the
      morph's destination, so the CSS stays the single source of the layout. */
  content: RefObject<HTMLDivElement | null>;
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
// top edge is quick: it is the edge that slides the plate out from under the
// chevron, which is bare by the second frame, and the drop is below the title
// within ~3 frames. The left edge sets off the moment it is: gated on where
// the top edge is, not on a timer, so the glass never slides under the
// title's last glyphs (with any font, zoom or row width) and never waits
// longer than it must. The far edges (bottom, left) are the bounciest, so the
// panel settles with the small iOS overshoot away from the button.
// Closing is quicker and the side edge goes first, so the panel narrows into
// a drop before it rises back under the chevron — the top edge is gated on
// the left edge being past the title, the mirror of the opening. The closing
// springs are deliberately a little underdamped: an edge is stopped dead on
// the disc's rect (it never undershoots through it), so the would-be wobble
// never shows — what it buys is a brisk arrival instead of a near-critical
// tail, and the top edge, which has the farthest to go, is the briskest (at
// 0.32s it crawled the last 2px over five frames). The whole close waits
// ~45ms first: the rows fade out in 70ms (menu.css), so the shape never
// shrinks over live text — it cut words at its moving edge for two frames.
const OPEN: Record<Edge, EdgeMotion> = {
  top: edge(0.18, 0.9),
  right: edge(0.42, 0.8),
  bottom: edge(0.48, 0.8),
  left: edge(0.3, 0.74), // + the title gate (see tick)
};
const CLOSE: Record<Edge, EdgeMotion> = {
  top: edge(0.24, 0.62, 0.06),
  right: edge(0.28, 0.8, 0.045),
  bottom: edge(0.32, 0.75, 0.06),
  left: edge(0.28, 0.8, 0.045),
};
// The disc swells a little (3–4%) as the drop lands back on it.
const BUMP = springOf(0.3, 0.38);
const BUMP_IN = 1.0;
// How close (px, on every side) the returning shape must be to the disc's
// rect before it docks: under a quarter pixel, so swapping the shape for the
// real disc in one frame cannot be seen.
const DOCK_AT = 0.25;

const PANEL_RADIUS = 28;
// The rows come in once the left edge has passed their text inset (px): with
// the content parked at its final place behind a moving clip, words showed
// cut at the edge ("andom", "areer") for a few frames.
const REVEAL_INSET = 15;
// Rim refraction strength (feDisplacementMap scale, see MenuGlassFilter) and
// the filter region pad: frost tail (3σ) plus the farthest the rim samples.
const REFRACT_SCALE = 110;
const FILTER_PAD = 48;
// The bar's pill fades out as the menu opens and back in as it closes (menu.css,
// 260ms), so for a moment the bare chevron sits on a part-faded pill. Over the
// black cards the chevron's own ink and the blend ink read about equally well
// at two thirds of the pill's opacity (both ~55/255 off it), and the blend ink
// all but vanished on the full pill (~40). So the chevron keeps its own ink
// while the pill is at least this opaque, and switches at once: a crossfade
// between the two inks dims both.
const PILL_INK_AT = 0.66;

type Rgba = [number, number, number, number];
// "rgb(…)" / "rgba(…)", as getComputedStyle hands colours back.
const parseRgba = (s: string, fallback: Rgba): Rgba => {
  const n = s.match(/-?[\d.]+/g)?.map(Number);
  return n && n.length >= 3 ? [n[0], n[1], n[2], n.length > 3 ? n[3] : 1] : fallback;
};
const fade = (c: Rgba, k: number): Rgba => [c[0], c[1], c[2], c[3] * k];
const css = (c: Rgba) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;

const f2 = (v: number) => v.toFixed(2);

/**
 * The shape's edge, from the button disc's (.glass-disc, globals.css) at
 * m = 0 to the panel's resting one (menu.css) at m = 1, as one list of
 * layers so it blends: the disc's two inner lights give way to the panel's
 * hairline, the outer hair and both drops carry over and grow. At m = 0 it is
 * the disc's five shadows exactly, so the shape that replaces the disc on the
 * first frame has the disc's own edge.
 */
const edgeShadow = (m: number) => {
  const a = (v: number) => v.toFixed(3);
  return (
    `inset 0 0.5px 0.5px rgba(255,255,255,${a(1 - m)}), ` +
    `inset 0 -0.5px 1px rgba(255,255,255,${a(0.6 * (1 - m))}), ` +
    `inset 0 0 0 0.5px rgba(255,255,255,${a(0.65 * m)}), ` +
    `0 0 0 0.5px rgba(0,0,0,${a(lerp(0.1, 0.07, m))}), ` +
    `0 ${f2(lerp(1, 2, m))}px ${f2(lerp(3, 6, m))}px rgba(0,0,0,${a(lerp(0.1, 0.04, m))}), ` +
    `0 ${f2(lerp(4, 10, m))}px ${f2(lerp(10, 36, m))}px rgba(0,0,0,${a(lerp(0.05, 0.1, m))})`
  );
};

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
  // The real disc is under the chevron and the shape is hidden. Off from the
  // toggle that opens the menu until the returning shape lands exactly on the
  // disc's rect; render() writes both visibilities from it in one pass, so
  // there is never a frame with both, or neither.
  let docked = true;
  // The rows have been let in for this opening (see REVEAL_INSET).
  let revealed = false;
  // How much of the chevron is drawn in its own ink (on glass) rather than in
  // the blend layer's (bare, over whatever the page shows); -1 = not yet set.
  let ink = -1;
  // The disc's tint and the panel's veil (both read off the CSS per toggle,
  // hover and reduced transparency included).
  let btnColor: Rgba = [255, 255, 255, 0.3];
  let veil: Rgba = [247, 247, 247, 0.7];
  let solidVeil = false;
  let B: Circle = { cx: 0, cy: 0, r: 10 };
  let T: Box = { top: 0, right: 0, bottom: 0, left: 0 };
  // How far (px) each edge travels between the disc and the panel, so edge
  // progress can be read as a distance from the disc.
  let SPAN: Box = { top: 0, right: 0, bottom: 0, left: 0 };
  // The title's ink bottom and right end. Opening, the left edge holds until
  // the top edge is below the title; closing, the top edge holds until the
  // left edge is past its end — either way the glass never slides under it.
  let gateY = -Infinity;
  let gateX = -Infinity;

  const setReveal = (on: boolean) => {
    revealed = on;
    refs.content.current?.toggleAttribute('data-reveal', on);
  };

  // The chevron has one glyph in each layer (menu.css): its own, drawn on the
  // glass, and the blend layer's, which stays visible over the head and the
  // dark cards when the glass has slid away from under it. 1 = all its own.
  const setInk = (v: number) => {
    if (Math.abs(v - ink) < 1e-3) return;
    ink = v;
    const s = v.toFixed(3);
    refs.root.current?.style.setProperty('--plate-ink', s);
    refs.blend.current?.style.setProperty('--plate-ink', s);
  };

  // The chevron flips (menu.css) the moment the menu is toggled, as the
  // button's state; both glyphs follow the same attribute.
  const setChevron = (up: boolean) => {
    const dir = up ? 'up' : 'down';
    if (refs.button.current) refs.button.current.dataset.chevron = dir;
    if (refs.blend.current) refs.blend.current.dataset.chevron = dir;
  };

  const measure = () => {
    const root = refs.root.current;
    const btn = refs.button.current;
    const content = refs.content.current;
    if (!root || !btn || !content) return;
    // Sub-pixel exact: the panel is centred with calc(50% − 103.5px) and the
    // button by flex, so both land on half pixels, which offsetLeft would
    // round — and the shape that replaces the disc must cover it exactly.
    // Rects are visual px, so the body zoom is divided back out (lib/zoom).
    // The button never scales (the bump is the disc's), so its rect is its
    // layout box; the radius is read from layout.
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
    SPAN = {
      top: T.top - (B.cy - B.r),
      bottom: T.bottom - (B.cy + B.r),
      left: B.cx - B.r - T.left,
      right: T.right - (B.cx + B.r),
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

  // Safari and Firefox get the CSS frost (no data-refract), which the shape
  // blends from the disc's to the panel's while it moves; '' leaves menu.css.
  const setFrost = (blob: HTMLElement, value: string) => {
    blob.style.setProperty('backdrop-filter', value);
    blob.style.setProperty('-webkit-backdrop-filter', value);
  };

  const hide = () => {
    const blob = refs.blob.current;
    if (blob) {
      blob.style.visibility = 'hidden';
      setFrost(blob, '');
    }
    if (refs.content.current) refs.content.current.style.clipPath = '';
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
    const disc = refs.disc.current;
    if (!blob || !root) return;
    if (reduced) {
      placeResting();
      return;
    }
    // Reads first, so neither forces a style pass of its own. On its way back
    // the glass takes on the disc's tint as it is right now, so a hover that
    // ends (or starts) mid-flight lands in the right glass; and how much of
    // the bar's pill is under the chevron (it fades with the menu).
    const returning = target === 0 && !docked && !!disc;
    if (returning) btnColor = parseRgba(getComputedStyle(disc).backgroundColor, btnColor);
    const pill = refs.pill.current;
    const onPill = !docked && !!pill && parseFloat(getComputedStyle(pill).opacity) >= PILL_INK_AT;
    if (returning && refs.tint.current) refs.tint.current.style.background = css(btnColor);
    // The swell is the disc's alone: the chevron and the hit area never move.
    if (disc) disc.style.transform = Math.abs(bump.value) > 5e-4 ? `scale(${(1 + bump.value).toFixed(4)})` : '';
    if (docked) {
      hide();
      if (disc) disc.style.visibility = '';
      setInk(1);
      return;
    }

    const p = {
      top: Math.max(0, e.top.value),
      right: Math.max(0, e.right.value),
      bottom: Math.max(0, e.bottom.value),
      left: Math.max(0, e.left.value),
    };
    const grow = Math.min(p.top, p.right, p.bottom, p.left);
    // Edges interpolate from the disc to the panel rect. Past 1 they keep
    // going, so an overshoot swells the panel away from the button — the far
    // edges most — like a spring anchored at its source. Reopened while the
    // disc is still swelling from the last landing, the shape starts from
    // the disc at the size it is drawn.
    const r0 = B.r * (1 + bump.value);
    const left = lerp(B.cx - r0, T.left, p.left);
    const right = lerp(B.cx + r0, T.right, p.right);
    const top = lerp(B.cy - r0, T.top, p.top);
    // Never flatter than it is wide (up to the disc's size): opening, the
    // plate leaves the chevron as a 20px capsule, not a sliver squeezed
    // between the quick top edge and the slower bottom; closing, it stays a
    // round drop until it lands as the disc.
    const bottom = Math.max(lerp(B.cy + r0, T.bottom, p.bottom), top + Math.min(right - left, 2 * r0));
    const w = Math.max(right - left, 1);
    const ht = Math.max(bottom - top, 1);
    // Circle → 28px corners, capped so a narrow drop stays a capsule.
    const radius = Math.min(lerp(r0, PANEL_RADIUS, smoothstep(0, 0.55, grow)), w / 2, ht / 2);

    blob.style.visibility = 'visible';
    if (disc) disc.style.visibility = 'hidden';
    blob.style.transform = `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px)`;
    blob.style.width = `${w.toFixed(2)}px`;
    blob.style.height = `${ht.toFixed(2)}px`;
    blob.style.borderRadius = `${radius.toFixed(2)}px`;

    // The shape is the disc itself on the move: it starts in the disc's tint,
    // edge, sheen and clear glass, and clears into the panel's frosted glass
    // as it opens up. Written whole from here, not as var()-driven colour
    // maths in the stylesheet, so every engine gets a plain value.
    const glass = smoothstep(0.12, 0.42, grow);
    if (refs.tint.current) refs.tint.current.style.opacity = (1 - glass).toFixed(3);
    blob.style.backgroundColor = css(solidVeil ? veil : fade(veil, glass));
    blob.style.setProperty('--lgm-glass', glass.toFixed(3));
    blob.style.boxShadow = edgeShadow(glass);

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
    } else if (!solidVeil) {
      // The disc's blur(6px) saturate(170%) to the panel's (menu.css).
      const frost = `blur(${f2(lerp(6, 8, glass))}px) saturate(${lerp(170, 120, glass).toFixed(0)}%)`;
      setFrost(blob, glass < 1 ? frost : '');
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

    // The chevron keeps its own ink while glass is under it and hands over to
    // the blend layer's as the shape's top edge slides down past it (and back
    // as the returning drop rises under it), or as the pill fades (see
    // PILL_INK_AT). Over the light page the two inks are the same colour, so
    // only over dark content is there anything to see.
    setInk(onPill ? 1 : 1 - smoothstep(B.cy - 3, B.cy + 4, top));
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
        // Closing, an edge stops dead on the disc's rect instead of
        // overshooting through it, so the drop lands exactly on the disc.
        if (target === 0 && e[k].value < 0) e[k].value = e[k].velocity = 0;
      }
      Object.assign(bump, stepSpring(bump, 0, BUMP, dt / steps));
    }
    // Landed: the shape is dropped and the real disc shown in the same render
    // (it is the disc's exact double by now, so nothing pops), and the disc
    // takes the leftover momentum as a small swell.
    if (target === 0 && !docked && EDGES.every((k) => Math.abs(e[k].value * SPAN[k]) < DOCK_AT)) {
      for (const k of EDGES) e[k].value = e[k].velocity = 0;
      docked = true;
      bump.velocity += BUMP_IN;
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
      const disc = refs.disc.current;
      if (isReduced) {
        // Reduced motion: no shape change at all — the panel simply fades in
        // and out in place (CSS, data-mode="fade"), the disc fades out from
        // under the chevron as it does, and the chevron's two inks crossfade
        // with it (data-menu-fade), so the open state is bare here too.
        reduced = true;
        cancelAnimationFrame(raf);
        raf = 0;
        target = previous = next;
        for (const k of EDGES) {
          e[k].value = next;
          e[k].velocity = 0;
        }
        bump.value = bump.velocity = 0;
        docked = !open;
        hide();
        refs.root.current?.toggleAttribute('data-menu-fade', true);
        if (disc) {
          disc.style.transform = '';
          disc.style.visibility = '';
          disc.style.opacity = open ? '0' : '';
        }
        setInk(open ? 0 : 1);
        setChevron(open);
        setReveal(open);
        placeResting();
        if (blob) {
          blob.style.visibility = '';
          blob.style.setProperty('--lgm-glass', '1');
          blob.style.boxShadow = '';
          blob.style.backgroundColor = '';
          if (refs.tint.current) refs.tint.current.style.opacity = '0';
          blob.dataset.mode = 'fade';
          blob.toggleAttribute('data-open', open);
        }
        return;
      }
      if (reduced) {
        if (blob) {
          delete blob.dataset.mode;
          blob.removeAttribute('data-open');
        }
        refs.root.current?.removeAttribute('data-menu-fade');
        if (disc) disc.style.opacity = '';
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
      // glass that takes its place is the same glass.
      if (disc) btnColor = parseRgba(getComputedStyle(disc).backgroundColor, btnColor);
      if (refs.tint.current) refs.tint.current.style.background = css(btnColor);
      if (blob) {
        blob.style.backgroundColor = '';
        veil = parseRgba(getComputedStyle(blob).backgroundColor, veil);
        solidVeil = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
      }
      if (open) docked = false;
      // Drawn now, not on the next animation frame: the first frame the
      // browser paints after the press is the shape lying exactly on the
      // disc, with the disc hidden under it, and nothing has moved yet.
      render();
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
 * Drives the disc → panel morph imperatively (rAF + springs) so a toggle
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
