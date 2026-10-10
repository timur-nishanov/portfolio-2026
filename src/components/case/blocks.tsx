'use client';

import { useLayoutEffect } from 'react';
import type { CaseSlot } from '@/data/chumsCase';
import { PhoneMockup } from '@/components/cases/PhoneMockup';
import { MonitorMockup } from '@/components/showcase/MonitorMockup';

type Frame = 'phone' | 'desktop';

/**
 * A slot's contents: the file in its device once there is one, until then a
 * quiet stand-in of the same shape, with what goes there written on it.
 */
export function Screen({ slot, frame }: { slot: CaseSlot; frame: Frame }) {
  if (!slot.src) {
    return (
      <div className={`cp-ph cp-ph--${frame}`} aria-hidden="true">
        {slot.kind === 'video' && <span className="cp-ph__play" />}
        <span className="cp-ph__hint">{slot.hint}</span>
      </div>
    );
  }
  const screen = { framed: true, type: slot.kind, src: slot.src, poster: slot.poster, alt: slot.alt };
  if (frame === 'phone') {
    return (
      <div className="cp-frame cp-frame--phone">
        <PhoneMockup phone={screen} />
      </div>
    );
  }
  if (slot.kind === 'video') {
    return (
      <div className="cp-frame cp-frame--imac">
        <MonitorMockup screen={screen} />
      </div>
    );
  }
  return (
    <div className="cp-frame cp-frame--shot">
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export: next/image adds nothing here */}
      <img src={slot.src} alt={slot.alt} loading="lazy" decoding="async" />
    </div>
  );
}

/** A grey card like the ones on the page, holding one screen. */
export function MediaCard({
  slot,
  frame,
  size,
  caption,
}: {
  slot: CaseSlot;
  frame: Frame;
  size: 'wide' | 'half' | 'small';
  caption?: string;
}) {
  return (
    <figure className={`cp-fig cp-fig--${size}`}>
      <div className="cp-card">
        <Screen slot={slot} frame={frame} />
      </div>
      {caption && <figcaption className="cp-cap">{caption}</figcaption>}
    </figure>
  );
}

/** Two screens side by side, the same action before and after. */
export function BeforeAfter({ before, after }: { before: CaseSlot; after: CaseSlot }) {
  return (
    <div className="cp-media cp-pair cp-reveal">
      <MediaCard slot={before} frame="phone" size="half" caption="Before" />
      <MediaCard slot={after} frame="phone" size="half" caption="After" />
    </div>
  );
}

/** Before as a strip of screenshots, after as one large recording: the two
    sides are different media, so they don't pretend to be a pair. */
export function BeforeGalleryAfter({ before, after }: { before: CaseSlot[]; after: CaseSlot }) {
  return (
    <div className="cp-media cp-desk">
      <figure className="cp-fig cp-reveal">
        <div className="cp-strip">
          {before.map((slot, i) => (
            <div key={i} className="cp-card cp-card--small">
              <Screen slot={slot} frame="desktop" />
            </div>
          ))}
        </div>
        <figcaption className="cp-cap">Before</figcaption>
      </figure>
      <div className="cp-reveal">
        <MediaCard slot={after} frame="desktop" size="wide" caption="After" />
      </div>
    </div>
  );
}

/** Several phone screens on one card. */
export function PhoneGallery({ slots }: { slots: CaseSlot[] }) {
  return (
    <figure className="cp-media cp-fig cp-reveal">
      <div className="cp-card cp-card--gallery">
        {slots.map((slot, i) => (
          <div key={i} className="cp-gallery__item">
            <Screen slot={slot} frame="phone" />
          </div>
        ))}
      </div>
    </figure>
  );
}

/**
 * Brings blocks in as they come up (.cp-reveal): a short rise out of
 * transparency. A sweep over the ones still waiting rather than an observer,
 * so a jump straight past a block (the scrollbar, End) still shows it. Armed
 * from script, so without it everything is simply there; reduced motion
 * leaves it all in place.
 */
export function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scroller = root.closest<HTMLElement>('.cp__scroll');
    const target: HTMLElement | Window = scroller ?? window;
    let pending = Array.from(root.querySelectorAll<HTMLElement>('.cp-reveal'));
    let raf = 0;
    const sweep = () => {
      raf = 0;
      const line = (scroller ? scroller.clientHeight : window.innerHeight) * 0.9;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        el.classList.add('is-in');
        return false;
      });
    };
    const schedule = () => {
      if (!raf && pending.length) raf = requestAnimationFrame(sweep);
    };
    root.classList.add('cp-armed');
    sweep();
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.classList.remove('cp-armed');
    };
  }, [ref]);
}
