'use client';

import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CaseSlot } from '@/data/chumsCase';
import { ButtonChevron } from '@/components/header/menu/icons';
import { PhoneMockup } from '@/components/cases/PhoneMockup';
import { MonitorMockup } from '@/components/showcase/MonitorMockup';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { zoomOf } from '@/lib/zoom';

type Frame = 'phone' | 'desktop';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    <div className="cp-card cp-card--gallery cp-reveal">
      {slots.map((slot, i) => (
        <div key={i} className="cp-gallery__item">
          <Screen slot={slot} frame="phone" />
        </div>
      ))}
    </div>
  );
}

/* --- Read more ------------------------------------------------------------ */

/** How the case scrolls by a distance: the layer's own smooth scroll
    (CaseLayer provides it). Without it, the case is its own page and the
    page's smooth scroll does it. */
export const CaseScroll = createContext<((by: number) => void) | null>(null);

type ChapterState = { open: boolean; toggle: () => void; register: (id: string) => () => void; ids: string };
const ChapterContext = createContext<ChapterState | null>(null);

// The way a region opens: it unrolls fast and settles long, its text coming
// up a beat behind so it never shows cut through. Closing is brisker, the
// text gone before the region has started to fold.
const UNROLL = 'cubic-bezier(0.22, 1, 0.36, 1)';
const ROLL_UP = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * A chapter of the case: the part that is always there (its heading, a
 * short summary, the media) and what explains how, hidden in one or more
 * regions (Fold) that one "Read more" (ReadMore) opens together. Desktop has
 * a region under each of its rules plus one after them.
 */
export function Chapter({ className = '', ...props }: React.ComponentProps<'section'>) {
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const register = useCallback((id: string) => {
    setIds((all) => [...all, id]);
    return () => setIds((all) => all.filter((x) => x !== id));
  }, []);
  const state = useMemo(() => ({ open, toggle, register, ids: ids.join(' ') }), [open, toggle, register, ids]);
  return (
    <ChapterContext.Provider value={state}>
      <section className={`cp-chapter ${className}`} {...props} />
    </ChapterContext.Provider>
  );
}

/**
 * One hidden region of a chapter. Closed it takes no room and is hidden
 * outright, so its text is out of the way of screen readers and Find too.
 * It opens in place, from wherever it is: a second click mid-way turns it
 * round. Reduced motion just shows and hides it.
 */
export function Fold({ children }: { children: React.ReactNode }) {
  const chapter = useContext(ChapterContext);
  const open = !!chapter?.open;
  const register = chapter?.register;
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Animation[]>([]);
  const was = useRef(open);

  useLayoutEffect(() => register?.(id), [register, id]);

  useLayoutEffect(() => {
    const fold = ref.current;
    const inner = innerRef.current;
    if (was.current === open || !fold || !inner) return;
    was.current = open;
    const from = fold.hidden ? 0 : fold.offsetHeight;
    const shown = fold.hidden ? '0' : getComputedStyle(inner).opacity;
    motion.current.forEach((a) => a.cancel());
    motion.current = [];
    fold.hidden = false;
    if (reducedMotion()) {
      fold.hidden = !open;
      return;
    }
    if (open) {
      // To its full height, then back to auto, so it reflows with the page.
      const to = fold.scrollHeight;
      motion.current = [
        fold.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 380, easing: UNROLL }),
        inner.animate([{ opacity: shown }, { opacity: 1 }], {
          duration: 240,
          delay: from ? 0 : 80,
          easing: 'ease',
          fill: 'backwards',
        }),
      ];
    } else {
      const shrink = fold.animate([{ height: `${from}px` }, { height: '0px' }], {
        duration: 280,
        easing: ROLL_UP,
        fill: 'forwards',
      });
      motion.current = [
        shrink,
        inner.animate([{ opacity: shown }, { opacity: 0 }], { duration: 120, fill: 'forwards' }),
      ];
      shrink.finished.then(
        () => {
          fold.hidden = true;
          motion.current.forEach((a) => a.cancel());
          motion.current = [];
        },
        () => {},
      );
    }
  }, [open]);

  return (
    <div ref={ref} id={id} className="cp-fold" hidden>
      <div ref={innerRef} className="cp-fold__inner">
        {children}
      </div>
    </div>
  );
}

/**
 * The chapter's one "Read more", always in the same place: under its last
 * text, over its media. It opens every region of the chapter at once.
 */
export function ReadMore({ className = '' }: { className?: string }) {
  const chapter = useContext(ChapterContext);
  const caseScroll = useContext(CaseScroll);
  const { scrollTo } = useSmoothScroll();
  const ref = useRef<HTMLButtonElement>(null);
  if (!chapter) return null;
  const { open, toggle, ids } = chapter;
  const onClick = () => {
    const button = ref.current;
    // Folding up a long passage from below would leave the button above the
    // screen, and the reader lost: it comes back down to just under the bar,
    // scrolling as the regions fold.
    if (open && button) {
      const folded = ids.split(' ').reduce((sum, id) => sum + (document.getElementById(id)?.offsetHeight ?? 0), 0);
      const top = button.getBoundingClientRect().top / zoomOf(button) - folded;
      if (top < 96) {
        const by = top - 120;
        if (caseScroll) caseScroll(by);
        else scrollTo(window.scrollY + by, { offset: 0, duration: 0.45 });
      }
    }
    toggle();
  };
  return (
    <button
      ref={ref}
      type="button"
      className={`cp-toggle ${className}`}
      aria-expanded={open}
      aria-controls={ids || undefined}
      onClick={onClick}
    >
      {open ? 'Show less' : 'Read more'}
      <ButtonChevron className="cp-toggle__chevron" />
    </button>
  );
}

/* --- coming in ------------------------------------------------------------ */

/**
 * Brings blocks in as they come up (.cp-reveal). A sweep over the ones still
 * waiting rather than an observer, so a jump straight past a block (the
 * scrollbar, End) still shows it. Armed from script, so without it
 * everything is simply there; reduced motion leaves it all in place.
 *
 * Inside the case layer it waits for the layer's go (the hold comes off as
 * the page has all but grown out of the card): then the whole first screen
 * comes in at once, without a blur, with the page. Further down, blocks come
 * out of a light blur as they are reached, a touch after one another.
 */
export function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const scroller = root.closest<HTMLElement>('.cp__scroll');
    const target: HTMLElement | Window = scroller ?? window;
    const hold = root.closest<HTMLElement>('[data-hold]');
    let pending = Array.from(root.querySelectorAll<HTMLElement>('.cp-reveal'));
    let raf = 0;
    let live = false;
    const sweep = (first = false) => {
      raf = 0;
      if (!live) return;
      const line = (scroller ? scroller.clientHeight : window.innerHeight) * 0.92;
      let n = 0;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        if (first) el.classList.add('is-first');
        else el.style.setProperty('--stagger', String(Math.min(n++, 2)));
        el.classList.add('is-in');
        return false;
      });
    };
    const schedule = () => {
      if (!raf && pending.length) raf = requestAnimationFrame(() => sweep());
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
      // The hidden state has been on screen since the layer mounted, so the
      // first screen can go at once, in the very frame the hold comes off.
      watch = new MutationObserver(() => {
        if (hold.hasAttribute('data-hold')) return;
        watch?.disconnect();
        live = true;
        sweep(true);
      });
      watch.observe(hold, { attributes: true, attributeFilter: ['data-hold'] });
    } else {
      live = true;
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
