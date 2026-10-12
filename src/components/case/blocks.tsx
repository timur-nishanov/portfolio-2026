'use client';

import { createContext, useLayoutEffect } from 'react';
import type { CaseSlot } from '@/data/chumsCase';
import { useLazyVideo } from '@/hooks/useLazyVideo';

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

/**
 * A figure as benji.org has them: a light box in the column with a hairline
 * round it, one screen centred inside, and what it shows named in its corner
 * when it is one side of a comparison.
 */
export function Figure({ slot, frame, label }: { slot: CaseSlot; frame: Frame; label?: 'Before' | 'After' }) {
  return (
    <figure className={`cp-figure cp-figure--${frame} cp-reveal`}>
      {label && <figcaption className="cp-figure__label">{label}</figcaption>}
      <Shot slot={slot} frame={frame} />
    </figure>
  );
}

/** The same thing before and after, one figure over the other. */
export function BeforeAfter({ before, after, frame }: Pair & { frame: Frame }) {
  return (
    <>
      <Figure label="Before" slot={before} frame={frame} />
      <Figure label="After" slot={after} frame={frame} />
    </>
  );
}

/* --- the layer's scroll --------------------------------------------------- */

/** Where the case is scrolled to, read, set and glided to: the layer's own
    scroll (CaseLayer provides it). Without it, the case is its own page and
    the page's scroll is used. */
export const CaseScroll = createContext<{ get(): number; set(y: number): void; glide(y: number): void } | null>(null);

/* --- coming in ------------------------------------------------------------ */

/**
 * Brings blocks in as they come up (.cp-reveal). A sweep over the ones still
 * waiting rather than an observer, so a jump straight past a block (the
 * scrollbar, End) still shows it. Armed from script, so without it
 * everything is simply there; reduced motion leaves it all in place.
 *
 * The first screen is there from the start, as it is (the case opens at
 * once, and on its own page the text is already on screen from the server):
 * down to the screen's very bottom, or what was just seen would vanish.
 * Further down, blocks come out of a light blur as they are reached, a touch
 * after one another.
 */
export function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion()) return;
    const scroller = root.closest<HTMLElement>('.cp__scroll');
    const target: HTMLElement | Window = scroller ?? window;
    const height = () => (scroller ? scroller.clientHeight : window.innerHeight);
    let pending = Array.from(root.querySelectorAll<HTMLElement>('.cp-reveal'));
    let raf = 0;
    const sweep = () => {
      raf = 0;
      const line = height() * 0.92;
      let n = 0;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        el.style.setProperty('--stagger', String(Math.min(n++, 2)));
        el.classList.add('is-in');
        return false;
      });
    };
    const schedule = () => {
      if (!raf && pending.length) raf = requestAnimationFrame(sweep);
    };
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top >= height()) return true;
      el.classList.add('is-in');
      return false;
    });
    // The ones further down go into hiding at once, not through their fade:
    // the style is taken with transitions off, then they are put back.
    root.classList.add('cp-arming', 'cp-armed');
    void root.offsetHeight;
    root.classList.remove('cp-arming');
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // The page changing height under the screen (the window narrowing)
    // brings blocks up without a scroll.
    const grow = new ResizeObserver(schedule);
    grow.observe(root);
    return () => {
      grow.disconnect();
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.classList.remove('cp-armed');
    };
  }, [ref]);
}
