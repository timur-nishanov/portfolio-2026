'use client';

import { createContext, useLayoutEffect } from 'react';
import type { CasePair, CaseSlot } from '@/data/caseSlot';
import { useLazyVideo } from '@/hooks/useLazyVideo';
import { MonitorMockup } from '@/components/showcase/MonitorMockup';

/** A phone's screen, a desktop window, a wide picture of several things at
    once (a diagram, concepts side by side) that sits on the box as it is, a
    recording playing in the iMac the home page's cards show, or a recording
    composed on its own white stage (a window or a phone on white, the camera
    moving in it), drawn whole. */
type Frame = 'phone' | 'desktop' | 'wide' | 'imac' | 'stage';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A screen's shape, for the CSS that sizes it (--ar): the file's own once it
    is known, so its room is kept before it arrives; until then a phone's, or
    a desktop window's for the rest. */
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
  // The iMac is the home page's (MonitorMockup), the recording in its screen.
  if (frame === 'imac' && slot.src) {
    return (
      <div className="cp-shot cp-shot--imac">
        <MonitorMockup screen={{ framed: true, type: 'video', src: slot.src, poster: slot.poster, alt: slot.alt }} />
      </div>
    );
  }
  const className = `cp-shot cp-shot--${frame === 'imac' ? 'desktop' : frame}`;
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
    <figure
      className={`cp-figure cp-figure--${frame}${label === 'After' ? ' cp-figure--after' : ''} cp-reveal`}
      // A stage is the figure itself, so the figure takes the recording's shape.
      style={frame === 'stage' ? shape(slot, frame) : undefined}
    >
      {label && <figcaption className="cp-figure__label">{label}</figcaption>}
      <Shot slot={slot} frame={frame} />
    </figure>
  );
}

/** The same thing before and after, one figure over the other. */
export function BeforeAfter({ before, after, frame }: CasePair & { frame: Frame }) {
  return (
    <>
      <Figure label="Before" slot={before} frame={frame} />
      <Figure label="After" slot={after} frame={frame} />
    </>
  );
}

/* --- the text ------------------------------------------------------------- */

/** A part's heading: the text's size in semibold ink, with a faint rule
    running out to the column's edge (as benji.org heads a section). */
export function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="cp-h cp-reveal">
      <span className="cp-h__name">{children}</span>
    </h2>
  );
}

/** A phrase the case turns on, marked as with a highlighter. */
export function Mark({ children }: { children: React.ReactNode }) {
  return <mark className="cp-mark">{children}</mark>;
}

/** The facts under a case's opening: a line each, the label in a column of
    its own. */
export function Facts({ items }: { items: [label: string, value: React.ReactNode][] }) {
  return (
    <dl className="cp-facts cp-reveal">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Where a case landed: each part's name over what became of it. */
export function Results({ items }: { items: [title: string, text: React.ReactNode][] }) {
  return (
    <ul className="cp-results">
      {items.map(([title, text]) => (
        <li key={title} className="cp-reveal">
          <h3 className="cp-result__title">{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ul>
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
    // The blocks above the line come out of pending, those below stay. Every
    // block's place is read before any is shown: a class set between two
    // reads had the browser work the page out again for the next read, once
    // for every block that came in on the same frame (a quick scroll, a
    // jump), the whole frame's time and more.
    const above = (line: number) => {
      const tops = pending.map((el) => el.getBoundingClientRect().top);
      const up = pending.filter((_, i) => tops[i] < line);
      if (up.length) pending = pending.filter((_, i) => tops[i] >= line);
      return up;
    };
    const sweep = () => {
      raf = 0;
      above(height() * 0.92).forEach((el, n) => {
        el.style.setProperty('--stagger', String(Math.min(n, 2)));
        el.classList.add('is-in');
      });
    };
    const schedule = () => {
      if (!raf && pending.length) raf = requestAnimationFrame(sweep);
    };
    above(height()).forEach((el) => el.classList.add('is-in'));
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
