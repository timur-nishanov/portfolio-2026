'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RandomItem, RandomMedia } from '@/data/random';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { clamp, q } from '@/lib/lerp';
import { zoomOf } from '@/lib/zoom';

// One number for both directions; the CSS transition reads the same value.
export const RANDOM_OPEN_MS = 560;

// The same magnet as the header buttons, scaled to a card: the box leads,
// the media inside it drifts a little further for depth, and the caption
// trails behind — three speeds is what keeps it from reading as a flat slide.
// Gentler than a button's numbers on purpose: a card is ten times the size,
// and the same pull that reads as a nudge on a pill read as a lurch here.
const BOX_PULL = 0.03;
const BOX_MAX = 7; // px
const MEDIA_PULL = 0.015;
const MEDIA_MAX = 3;
const CAPTION_PULL = 0.025;
const CAPTION_MAX = 3;

type Box = { left: number; top: number; width: number; height: number };

/** The clip or still inside a card, or the bare plate while there is none. */
function Media({ media, sizes }: { media: RandomMedia | null; sizes: string }) {
  if (!media) return <div className="absolute inset-0 bg-surface" />;
  if (media.type === 'image') {
    return <Image src={media.src} alt={media.alt} fill sizes={sizes} className="object-cover" />;
  }
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      src={media.src}
      poster={media.poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={media.alt}
    />
  );
}

/**
 * A grid card that opens seamlessly: on click the media box itself appears to
 * lift out of the grid and grow to half the screen, over a blurred page. It is
 * a fixed twin painted at the card's exact rect, transitioned to a centred box
 * of the same aspect while the card underneath goes invisible — so nothing
 * pops, the tile just travels. Closing runs the same path back.
 */
export function RandomCard({ item, drift = 0 }: { item: RandomItem; drift?: number }) {
  const driftRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLButtonElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const { register, setPaused } = useSmoothScroll();
  const canHover = useCanHover();
  const reduced = useReducedMotion();

  // Scroll drift: the card slides by `drift` px as it crosses the viewport,
  // centred at zero mid-screen. On its own wrapper, because the magnet owns
  // the transforms of everything inside; the wrapper's own offset is
  // subtracted back out of the measurement so the two never feed each other.
  useEffect(() => {
    const el = driftRef.current;
    if (!el || reduced || drift === 0) return;
    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), {
      rootMargin: '25% 0px 25% 0px',
    });
    io.observe(el);
    let lastY = 0;
    const off = register(() => {
      if (!inView) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const base = r.top - lastY;
      const p = clamp((vh / 2 - (base + r.height / 2)) / (vh / 2 + r.height / 2), -1, 1);
      const y = p * drift;
      el.style.transform = `translate3d(0, ${q(y)}px, 0)`;
      lastY = y;
    });
    return () => {
      io.disconnect();
      off();
    };
  }, [register, reduced, drift]);

  useMagnetic(
    rootRef,
    [
      { ref: boxRef, factor: BOX_PULL, max: BOX_MAX },
      { ref: mediaRef, factor: MEDIA_PULL, max: MEDIA_MAX },
      { ref: captionRef, factor: CAPTION_PULL, max: CAPTION_MAX },
    ],
    canHover && !reduced,
  );
  const [mounted, setMounted] = useState(false); // overlay in the DOM
  const [grown, setGrown] = useState(false); // at the centred box (vs. at the card)
  const [box, setBox] = useState<Box | null>(null);

  // Client and layout coordinates differ by the body zoom; the overlay is
  // positioned in the latter, everything measured comes in the former.
  const cardBox = useCallback((): Box | null => {
    const el = boxRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const z = zoomOf(document.body);
    return { left: r.left / z, top: r.top / z, width: r.width / z, height: r.height / z };
  }, []);

  const targetBox = useCallback((): Box => {
    const [rw, rh] = item.ratio.split('/').map((n) => parseFloat(n));
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Half the screen wide on desktop, nearly full on a phone; never taller
    // than four fifths of the viewport either way.
    const maxW = vw < 768 ? vw * 0.92 : vw * 0.5;
    const maxH = vh * 0.8;
    const s = Math.min(maxW / rw, maxH / rh);
    const w = rw * s;
    const h = rh * s;
    const z = zoomOf(document.body);
    return { left: (vw - w) / 2 / z, top: (vh - h) / 2 / z, width: w / z, height: h / z };
  }, [item.ratio]);

  const open = () => {
    const from = cardBox();
    if (!from || mounted) return;
    window.clearTimeout(timer.current);
    setBox(from);
    setMounted(true);
    setGrown(false);
    document.documentElement.style.overflow = 'hidden';
    // Read by useMagnetic and the curtain lift: the page stands down.
    document.documentElement.setAttribute('data-modal-open', '');
    setPaused(true);
  };

  const close = useCallback(() => {
    if (!mounted || !grown) return;
    const to = cardBox();
    if (to) setBox(to);
    setGrown(false);
    timer.current = window.setTimeout(() => {
      setMounted(false);
      document.documentElement.style.overflow = '';
      document.documentElement.removeAttribute('data-modal-open');
      setPaused(false);
    }, RANDOM_OPEN_MS);
  }, [mounted, grown, cardBox, setPaused]);

  // The twin is painted at the card first, then sent on its way a frame later
  // — a transition needs a committed start state to run from.
  useEffect(() => {
    if (!mounted || grown) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setBox(targetBox());
        setGrown(true);
        closeRef.current?.focus({ preventScroll: true });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // Runs once per opening; `grown` flips back only on close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onResize = () => {
      if (grown) setBox(targetBox());
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [mounted, grown, close, targetBox]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div ref={driftRef} className="will-change-transform">
    <article ref={rootRef} className="random-card">
      <button
        ref={boxRef}
        type="button"
        onClick={open}
        aria-label={`Open ${item.title}`}
        aria-expanded={mounted}
        className="random-box will-change-transform"
        style={{ aspectRatio: item.ratio, visibility: mounted ? 'hidden' : undefined }}
      >
        {/* Its own layer, so the magnet can move it inside the box; the hover
            scale on the media underneath keeps the box edges covered. */}
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          <Media media={item.media} sizes="(max-width: 767px) 92vw, 700px" />
        </div>
      </button>
      <div ref={captionRef} className="random-caption will-change-transform">
        <p className="random-title t-body">{item.title}</p>
        <p className="random-period t-case-label">{item.period}</p>
      </div>

      {mounted && box
        ? createPortal(
            <div className="random-overlay" data-grown={grown} role="dialog" aria-modal="true" aria-label={item.title}>
              <div className="random-backdrop" onClick={close} />
              <div
                className="random-panel"
                style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
              >
                <div className="random-panel-media">
                  <Media media={item.media} sizes="50vw" />
                </div>
                <div className="random-panel-caption">
                  <p className="random-title t-body">{item.title}</p>
                  <p className="random-period t-case-label">{item.period}</p>
                </div>
              </div>
              <button ref={closeRef} type="button" onClick={close} className="random-close glass" aria-label="Close">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
                  <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            </div>,
            document.body,
          )
        : null}
    </article>
    </div>
  );
}
