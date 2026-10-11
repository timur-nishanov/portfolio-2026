'use client';

import { memo, useEffect, useId, useRef, useState } from 'react';
import { greyImage } from '@/components/header/menu/glassMap';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { canRefract } from '@/lib/refract';
import './orbs.css';

type Item = { title: string; text: string };

/* --- the lens -------------------------------------------------------------- */
/*
 * Each question lies on the page and a sphere of clear glass sits over it.
 * On a flat page there is nothing else for glass to bend, so the text is
 * what shows it: through the middle it reads as it is, and toward the rim
 * the lines bow and draw in, as through a real lens. The rim itself looks a
 * little beyond the glass (as the header's pill does), so it gathers the
 * faint halo and the shadow the sphere casts on the page and brings them
 * back bent along its edge, red a touch apart from the rest.
 *
 * Chromium draws it as backdrop-filter: url(), with the displacement worked
 * out once here (as glassMap does for the pill) rather than by a chain of
 * primitives on every frame; Safari and Firefox keep the painted glass in
 * orbs.css. The filter is only referenced while the spheres are near the
 * screen, and nothing about it changes from frame to frame.
 */

// Where the bend starts, as a fraction of the radius: the middle of the
// text inside it is the page itself, untouched.
const FLAT = 0.32;
// How far past its own edge the rim looks, as a fraction of the radius, at
// full size; a smaller sphere bends less (in proportion to its size), as
// the same text fills more of it. orbs.css gives the lens that much room
// outside the sphere (.orb__lens), and the layout keeps it on screen:
// past the screen's side there is no page to bring in.
const REACH = 0.2;
const FULL_SIZE = 376;
// How the bend grows from FLAT to the rim: slowly at first, so the text
// bows rather than breaks, steeply at the edge.
const CURVE = 2.2;
// Red bent less than green and blue, by up to this share of the bend, and
// only past this share of it: at the rim, never across the text (where one
// channel landing a pixel off another reads as noise, not glass). Red
// against the rest, not a bend per channel: a third would cost another
// pass over the whole lens for a split no one could tell from this one.
const SPREAD = 0.16;
const SPREAD_FROM = 0.4;
// The map's pixels per CSS pixel. The bend is smooth, so a half-size map
// stretched by the filter looks the same and costs a quarter to ship.
const MAP_RES = 0.5;
// The bent part of the page is softened: feDisplacementMap picks the
// nearest pixel, and where the lens draws the page in it skips some, so a
// sharp letter there loses bits of its strokes. The softening is the
// lightest there is, a 3×3 average of device pixels (Chromium's own blur
// does nothing below 0.8px and too much from there), faded in between a
// third of a pixel's move and two pixels', before any stroke is skipped.
const SOFT_FROM = 0.3;
const SOFT_FULL = 2;

type Lens = {
  key: string;
  /** The lens box (the sphere and its margin), in CSS px. */
  box: number;
  scale: number;
  dx: string;
  dy: string;
  red: string;
  weight: string;
};

/** A component-transfer table over the map's 256 levels: `f` gets each
    level's displacement (px) and returns the value to put out (0–1). Skia
    reads these tables a hair low, so every value is aimed at the middle of
    its step, or an identity would come back one level short in places. */
function table(scale: number, f: (px: number) => number) {
  const out: string[] = [];
  for (let k = 0; k < 256; k++) {
    const level = Math.min(255, Math.max(0, Math.round(f((k / 255 - 0.5) * scale) * 255)));
    out.push((Math.min(255, level + 0.4) / 255).toFixed(5));
  }
  return out.join(' ');
}

async function makeLens(d: number, pad: number, key: string): Promise<Lens | null> {
  const r = d / 2;
  const box = d + pad * 2;
  // Never reach past the room the lens has: beyond it Chromium has no page
  // to give the filter.
  const reach = Math.min(REACH * r * Math.min(1, d / FULL_SIZE), pad - 2);
  if (reach <= 1) return null;
  const spread = SPREAD * reach;
  const scale = Math.ceil(reach * 2 + 4);
  const n = Math.max(8, Math.round(box * MAP_RES));
  const dx = new Uint8ClampedArray(n * n);
  const dy = new Uint8ClampedArray(n * n);
  for (let j = 0; j < n; j++) {
    const y = ((j + 0.5) / n) * box - pad - r;
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * box - pad - r;
      const dist = Math.hypot(x, y);
      const rho = dist / r;
      // Outward, so the glass shows what lies a little further from its
      // centre; nothing outside the sphere, where the lens box shows the
      // page as it is.
      const k = rho > FLAT && rho <= 1 ? (reach * ((rho - FLAT) / (1 - FLAT)) ** CURVE) / dist : 0;
      dx[j * n + i] = Math.round((0.5 + (k * x) / scale) * 255);
      dy[j * n + i] = Math.round((0.5 + (k * y) / scale) * 255);
    }
  }
  const urls = [greyImage(dx, n, n), greyImage(dy, n, n)];
  if (!urls[0] || !urls[1]) return null;
  // Decoded before the filter switches over, so it never draws a frame
  // with a map still loading.
  await Promise.all(
    urls.map((u) => {
      const img = new Image();
      img.src = u as string;
      return img.decode();
    }),
  );
  // Red: the same bend, less of it toward the rim (each axis on its own,
  // which is near enough on a circle).
  const from = SPREAD_FROM * reach;
  const red = table(scale, (px) => {
    const a = Math.max(0, Math.abs(px) - from) / (reach - from);
    return 0.5 + (px - Math.sign(px) * spread * a * a) / scale;
  });
  return {
    key,
    box,
    scale,
    dx: urls[0],
    dy: urls[1],
    red,
    weight: table(scale, (px) => (Math.abs(px) - SOFT_FROM) / (SOFT_FULL - SOFT_FROM)),
  };
}

/**
 * The lens for the spheres as they are now laid out, or null while there is
 * none (another engine, reduced transparency, not worked out yet, or the
 * spheres have just changed size and the new one is on its way: never a
 * lens for the wrong size).
 */
function useLens(listRef: React.RefObject<HTMLOListElement | null>) {
  const [size, setSize] = useState<{ d: number; pad: number } | null>(null);
  const [lens, setLens] = useState<Lens | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const glass = list?.querySelector<HTMLElement>('.orb__glass');
    const box = list?.querySelector<HTMLElement>('.orb__lens');
    if (!glass || !box || !canRefract()) return;
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    // Layout sizes (the filter's units are the element's own px, inside any
    // zoom), to the half pixel so a resize does not redo it for nothing.
    const half = (v: number) => Math.round(v * 2) / 2;
    const measure = () => {
      const d = half(glass.offsetWidth);
      const pad = half((box.offsetWidth - glass.offsetWidth) / 2);
      setSize((s) => (s && s.d === d && s.pad === pad ? s : { d, pad }));
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(glass);
    return () => watch.disconnect();
  }, [listRef]);

  const key = size ? `${size.d}/${size.pad}` : '';
  useEffect(() => {
    // Nothing to fit a lens to (the glass is hidden in forced colours).
    if (!size || size.d < 40) return;
    let live = true;
    // Off the critical path: the painted glass serves until this lands.
    const run = () => {
      makeLens(size.d, size.pad, key)
        .then((l) => {
          if (live && l) setLens(l);
        })
        .catch(() => {
          // Nothing lost: the painted glass stays.
        });
    };
    const idle = 'requestIdleCallback' in window;
    const job = idle ? window.requestIdleCallback(run, { timeout: 2000 }) : window.setTimeout(run, 200);
    return () => {
      live = false;
      if (idle) window.cancelIdleCallback(job);
      else window.clearTimeout(job);
    };
  }, [size, key]);

  return lens && lens.key === key ? lens : null;
}

/** Whether the spheres are on screen or about to be: the filter is only
    referenced then, so nowhere else on the page pays for it. */
function useNearScreen(ref: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '40% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

const ONLY = {
  r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  gb: '0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0',
};

/** The lens as an SVG filter, its user space the lens box (.orb__lens). */
const LensFilter = memo(function LensFilter({ id, lens }: { id: string; lens: Lens }) {
  const { box, scale } = lens;
  const bend = (input: string, map: string, result: string) => (
    <feDisplacementMap in={input} in2={map} scale={scale} xChannelSelector="R" yChannelSelector="G" result={result} />
  );
  return (
    <svg className="orbs__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id={id}
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={box}
          height={box}
          colorInterpolationFilters="sRGB"
        >
          {/* The slopes, x and y as greys (glassMap says why), over the
              whole box: an feImage placed inside the box gets its region
              cut from the box's corner in Chromium's backdrop filters. */}
          <feImage href={lens.dx} x="0" y="0" width={box} height={box} preserveAspectRatio="none" result="dx" />
          <feImage href={lens.dy} x="0" y="0" width={box} height={box} preserveAspectRatio="none" result="dy" />
          <feColorMatrix in="dx" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapX" />
          <feColorMatrix in="dy" type="matrix" values="0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapY" />
          <feBlend in="mapX" in2="mapY" mode="lighten" result="map" />
          {/* The page bent, sharp: all there is through the middle. */}
          {bend('SourceGraphic', 'map', 'sharp')}
          {/* The page bent, softened, and split a little by colour. */}
          <feConvolveMatrix
            in="SourceGraphic"
            order="3"
            kernelMatrix="1 2 1  2 4 2  1 2 1"
            edgeMode="duplicate"
            preserveAlpha="true"
            result="soft"
          />
          <feComponentTransfer in="map" result="mapR">
            <feFuncR type="table" tableValues={lens.red} />
            <feFuncG type="table" tableValues={lens.red} />
          </feComponentTransfer>
          {bend('soft', 'mapR', 'bentR')}
          {bend('soft', 'map', 'bentGB')}
          <feColorMatrix in="bentR" type="matrix" values={ONLY.r} result="r" />
          <feColorMatrix in="bentGB" type="matrix" values={ONLY.gb} result="gb" />
          <feComposite in="r" in2="gb" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rim" />
          {/* How much of the softened version, by how far the page has
              moved there (either axis), laid over the sharp one. */}
          <feComponentTransfer in="map" result="moved">
            <feFuncR type="table" tableValues={lens.weight} />
            <feFuncG type="table" tableValues={lens.weight} />
          </feComponentTransfer>
          <feColorMatrix
            in="moved"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 1 0 0 0"
            result="weight"
          />
          <feComposite in="rim" in2="weight" operator="in" result="rimPart" />
          <feComposite in="rimPart" in2="sharp" operator="over" />
        </filter>
      </defs>
    </svg>
  );
});

/* --- the spheres ----------------------------------------------------------- */

/**
 * One question under its sphere. As the old ones did, it leans a touch
 * toward the cursor, and the boxes keep to one job each: the slot stays put
 * and is measured, the middle one comes in (the article's reveal), the glass
 * carries the pull. The text stays where it is on the page, so the lens
 * slides over it and the lines move in the glass; the shadow follows the
 * glass at half its pace, as a shadow on the page under something floating
 * would.
 */
function Orb({ title, text }: Item) {
  const slotRef = useRef<HTMLLIElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  // Faint on purpose: the spheres lean, they don't chase.
  useMagnetic(
    slotRef,
    [
      { ref: glassRef, factor: 0.045, max: 12 },
      { ref: shadowRef, factor: 0.022, max: 6 },
    ],
    canHover && !reduced,
  );
  return (
    <li ref={slotRef} className="orb">
      <div className="orb__body cp-reveal">
        <div ref={shadowRef} className="orb__shadow" aria-hidden="true" />
        <div className="orb__text">
          <h3 className="orb__title">{title}</h3>
          <p className="orb__copy">{text}</p>
        </div>
        <div ref={glassRef} className="orb__glass" aria-hidden="true">
          <div className="orb__lens" />
          <div className="orb__light" />
        </div>
      </div>
    </li>
  );
}

/** Three questions, each under a sphere of liquid glass: a row on a wide
    screen, a zig-zag down a narrow one. */
export function Orbs({ items }: { items: Item[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const id = `orb-lens-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lens = useLens(listRef);
  const near = useNearScreen(listRef);
  const on = !!lens && near;
  return (
    <>
      <ol
        ref={listRef}
        className="orbs"
        data-lens={on ? '' : undefined}
        style={on ? ({ '--orb-lens': `url(#${id})` } as React.CSSProperties) : undefined}
      >
        {items.map((item) => (
          <Orb key={item.title} title={item.title} text={item.text} />
        ))}
      </ol>
      {lens && <LensFilter id={id} lens={lens} />}
    </>
  );
}
