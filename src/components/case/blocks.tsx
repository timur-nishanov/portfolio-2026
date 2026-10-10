'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CaseSlot } from '@/data/chumsCase';
import { ButtonChevron } from '@/components/header/menu/icons';
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

/** A grey card like the ones on the page, holding one screen, with what it
    shows written in its corner (After in ink, Before in grey). */
function MediaCard({
  slot,
  frame,
  className = '',
  label,
}: {
  slot: CaseSlot;
  frame: Frame;
  className?: string;
  label?: 'Before' | 'After';
}) {
  return (
    <div className={`cp-card ${className}`}>
      {label && (
        <span className="cp-card__label" data-after={label === 'After' ? '' : undefined}>
          {label}
        </span>
      )}
      <Screen slot={slot} frame={frame} />
    </div>
  );
}

/** Two screens side by side, the same action before and after. */
export function BeforeAfter({ before, after }: { before: CaseSlot; after: CaseSlot }) {
  return (
    <div className="cp-pair cp-reveal">
      <MediaCard slot={before} frame="phone" className="cp-card--half" label="Before" />
      <MediaCard slot={after} frame="phone" className="cp-card--half" label="After" />
    </div>
  );
}

/** Before as a strip of screenshots, after as one large recording: the two
    sides are different media, so they don't pretend to be a pair. */
export function BeforeGalleryAfter({ before, after }: { before: CaseSlot[]; after: CaseSlot }) {
  return (
    <div className="cp-desk">
      <div className="cp-strip cp-reveal">
        {before.map((slot, i) => (
          <MediaCard
            key={i}
            slot={slot}
            frame="desktop"
            className="cp-card--small"
            label={i === 0 ? 'Before' : undefined}
          />
        ))}
      </div>
      <div className="cp-reveal">
        <MediaCard slot={after} frame="desktop" className="cp-card--wide" label="After" />
      </div>
    </div>
  );
}

/** Several phone screens on one card. */
export function PhoneGallery({ slots }: { slots: CaseSlot[] }) {
  return (
    <figure className="cp-reveal">
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
 * Brings blocks in as they come up (.cp-reveal): out of a blur, as the
 * notes on the page's cards do. Blocks that arrive together follow one
 * another. A sweep over the ones still waiting rather than an observer, so a
 * jump straight past a block (the scrollbar, End) still shows it. Armed from
 * script, so without it everything is simply there; reduced motion leaves it
 * all in place. Inside the case layer it waits for the layer's go (the hold
 * comes off once the page has grown out of the card).
 */
/**
 * A long passage kept to its first three lines, fading out under a soft
 * veil, with "Read more" below it. It opens in place, the veil lifting as it
 * goes, and closes again.
 */
export function More({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const id = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Animation | null>(null);
  const [open, setOpen] = useState(false);
  const toggle = () => {
    const body = bodyRef.current;
    if (!body) return;
    // From wherever it is (a second click mid-way turns it round) to the
    // height the stylesheet gives the new state. max-height, so the
    // stylesheet's own clamp doesn't cut a closing passage short at once.
    const from = body.offsetHeight;
    motion.current?.cancel();
    flushSync(() => setOpen((o) => !o));
    const to = body.offsetHeight;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    motion.current = body.animate([{ maxHeight: `${from}px` }, { maxHeight: `${to}px` }], {
      duration: 460,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  };
  return (
    <div className={`cp-more ${className}`} data-open={open ? '' : undefined}>
      <div ref={bodyRef} id={id} className="cp-more__body">
        {children}
      </div>
      <button type="button" className="cp-more__toggle" aria-expanded={open} aria-controls={id} onClick={toggle}>
        {open ? 'Show less' : 'Read more'}
        <ButtonChevron className="cp-more__chevron" />
      </button>
    </div>
  );
}

export function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scroller = root.closest<HTMLElement>('.cp__scroll');
    const target: HTMLElement | Window = scroller ?? window;
    const hold = root.closest<HTMLElement>('[data-hold]');
    let pending = Array.from(root.querySelectorAll<HTMLElement>('.cp-reveal'));
    let raf = 0;
    let live = false;
    const sweep = () => {
      raf = 0;
      if (!live) return;
      const line = (scroller ? scroller.clientHeight : window.innerHeight) * 0.92;
      let n = 0;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        el.style.setProperty('--stagger', String(Math.min(n++, 4)));
        el.classList.add('is-in');
        return false;
      });
    };
    const schedule = () => {
      if (!raf && pending.length) raf = requestAnimationFrame(sweep);
    };
    // The hidden state gets a frame on screen first, so the first blocks
    // have something to come out of.
    const go = () => {
      live = true;
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(sweep);
      });
    };
    // On the case's own page the text is already on screen from the server:
    // what is in view stays as it is, only what is further down waits.
    if (!hold) {
      const line = window.innerHeight * 0.92;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        el.classList.add('is-in');
        return false;
      });
    }
    root.classList.add('cp-armed');
    let watch: MutationObserver | null = null;
    if (hold) {
      watch = new MutationObserver(() => {
        if (hold.hasAttribute('data-hold')) return;
        watch?.disconnect();
        go();
      });
      watch.observe(hold, { attributes: true, attributeFilter: ['data-hold'] });
    } else {
      go();
    }
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      watch?.disconnect();
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.classList.remove('cp-armed');
    };
  }, [ref]);
}
