'use client';

import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CaseSlot } from '@/data/chumsCase';
import { ButtonChevron } from '@/components/header/menu/icons';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useLazyVideo } from '@/hooks/useLazyVideo';
import { zoomOf } from '@/lib/zoom';

type Pair = { before: CaseSlot; after: CaseSlot };
type Frame = 'phone' | 'desktop';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A screen's shape, for the CSS that sizes it (--ar): the file's own once it
    is known, so its room is kept before it arrives; until then a phone's or a
    desktop window's. */
const shape = (slot: CaseSlot, frame: Frame) =>
  ({
    '--ar': slot.w && slot.h ? slot.w / slot.h : frame === 'phone' ? 9 / 19.5 : 16 / 10,
  }) as React.CSSProperties;

function Clip({ slot, className, style }: { slot: CaseSlot; className: string; style: React.CSSProperties }) {
  const ref = useLazyVideo(slot.src ?? '', slot.poster);
  return (
    <video
      ref={ref}
      className={className}
      style={style}
      width={slot.w}
      height={slot.h}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      aria-label={slot.alt}
    />
  );
}

/** One screen, as it is: no device around it, a phone's corners or a
    window's. Until its file is in, a lighter shape of the same size. */
function Shot({ slot, frame }: { slot: CaseSlot; frame: Frame }) {
  const className = `cp-shot cp-shot--${frame}`;
  const style = shape(slot, frame);
  if (!slot.src) return <div className={`${className} cp-ph`} style={style} role="img" aria-label={slot.alt} />;
  if (slot.kind === 'video') return <Clip slot={slot} className={className} style={style} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export: next/image adds nothing here
    <img
      className={className}
      style={style}
      src={slot.src}
      alt={slot.alt}
      width={slot.w}
      height={slot.h}
      loading="lazy"
      decoding="async"
    />
  );
}

/** A grey card like the ones on the page, with what it shows written in its
    corner when it is one side of a comparison. */
function Card({ label, className = '', children }: { label?: 'Before' | 'After'; className?: string; children: React.ReactNode }) {
  return (
    <div className={`cp-card ${className}`}>
      {label && <span className="cp-card__label">{label}</span>}
      {children}
    </div>
  );
}

/** Two cards side by side, the same thing before and after. */
export function BeforeAfter({ before, after, frame }: Pair & { frame: Frame }) {
  return (
    <div className={`cp-pair cp-pair--${frame} cp-reveal`}>
      <Card label="Before">
        <Shot slot={before} frame={frame} />
      </Card>
      <Card label="After">
        <Shot slot={after} frame={frame} />
      </Card>
    </div>
  );
}

/** One wide card: a desktop screen, or several phones in a row. */
export function Plate({ slots, frame }: { slots: CaseSlot[]; frame: Frame }) {
  return (
    <Card className={`cp-plate cp-plate--${frame} cp-reveal`}>
      <div className="cp-plate__row" style={{ '--n': slots.length } as React.CSSProperties}>
        {slots.map((slot, i) => (
          <Shot key={i} slot={slot} frame={frame} />
        ))}
      </div>
    </Card>
  );
}

/* --- Read more ------------------------------------------------------------ */

/** Where the case is scrolled to, read and set at once: the layer's own
    scroll (CaseLayer provides it). Without it, the case is its own page and
    the page's scroll is used. */
export const CaseScroll = createContext<{ get(): number; set(y: number): void; glide(y: number): void } | null>(null);

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

  // Focusable from script only: opened from the keyboard, the reader is
  // taken into it (ReadMore).
  return (
    <div ref={ref} id={id} className="cp-fold" tabIndex={-1} hidden>
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
  const { jumpTo } = useSmoothScroll();
  const ref = useRef<HTMLButtonElement>(null);
  if (!chapter) return null;
  const { open, toggle, ids } = chapter;
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = ref.current;
    const regions = ids
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    // Folding up a long passage from below would leave the button above the
    // screen, and the reader lost: it comes back down to just under the bar.
    // The scroll follows the regions' height as it is drawn, frame by frame,
    // so the button only ever moves one way, never swung past and back.
    if (open && button) {
      const folded = regions.reduce((sum, el) => sum + el.offsetHeight, 0);
      const top = button.getBoundingClientRect().top / zoomOf(button) - folded;
      if (top < 96 && folded > 0) {
        const by = top - 120;
        const from = caseScroll ? caseScroll.get() : window.scrollY;
        const scrollTo = caseScroll ? caseScroll.set : jumpTo;
        const follow = () => {
          // Opened again mid-way: the scroll is left where it has got to.
          if (button.getAttribute('aria-expanded') === 'true') return;
          const left = regions.reduce((sum, el) => sum + (el.hidden ? 0 : el.offsetHeight), 0);
          const gone = Math.min(1, Math.max(0, 1 - left / folded));
          scrollTo(from + by * gone);
          if (gone < 1) requestAnimationFrame(follow);
        };
        requestAnimationFrame(follow);
      }
    }
    // Opened from the keyboard or a screen reader (no pointer: detail 0),
    // the reader is taken on into the text that has just opened, the view
    // left where it is.
    if (!open && e.detail === 0) requestAnimationFrame(() => regions[0]?.focus({ preventScroll: true }));
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
    // all that is in view stays as it is (down to the screen's very bottom,
    // or what was just seen would vanish), only what is further down waits.
    if (!hold) {
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= window.innerHeight) return true;
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
    // A Read more folding up brings the blocks under it up the screen
    // without a scroll.
    const grow = new ResizeObserver(schedule);
    grow.observe(root);
    return () => {
      watch?.disconnect();
      grow.disconnect();
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.classList.remove('cp-armed');
    };
  }, [ref]);
}
