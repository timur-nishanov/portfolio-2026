'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RandomItem, RandomMedia } from '@/data/random';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { CloseButton } from '@/components/ui/CloseButton';
import { zoomOf } from '@/lib/zoom';

// One number for both directions; the CSS transition reads the same value.
export const RANDOM_OPEN_MS = 560;

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
 * pops, the tile just travels. Closing runs the same path back. No hover
 * magnet and no scroll drift on these — both were tried and both annoyed;
 * the cards sit still and the media eases up a touch on hover, that is all.
 */
export function RandomCard({ item }: { item: RandomItem }) {
  const boxRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const { setPaused } = useSmoothScroll();

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
    // Most of the screen: just under four fifths of the width on desktop
    // (half read as small), nearly all of it on a phone; never taller than
    // 86% of the viewport either way, so the caption keeps its room below.
    const maxW = vw < 768 ? vw * 0.92 : vw * 0.78;
    const maxH = vh * 0.86;
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
    <article className="random-card">
      <button
        ref={boxRef}
        type="button"
        onClick={open}
        aria-label={`Open ${item.title}`}
        aria-expanded={mounted}
        className="random-box"
        style={{ aspectRatio: item.ratio, visibility: mounted ? 'hidden' : undefined }}
      >
        <Media media={item.media} sizes="(max-width: 767px) 92vw, 700px" />
      </button>
      <div className="random-caption">
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
                  <Media media={item.media} sizes="80vw" />
                </div>
                <div className="random-panel-caption">
                  <p className="random-title t-body">{item.title}</p>
                  <p className="random-period t-case-label">{item.period}</p>
                </div>
              </div>
              <CloseButton onClose={close} label={`Close ${item.title}`} buttonRef={closeRef} />
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}
