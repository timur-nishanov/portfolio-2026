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
