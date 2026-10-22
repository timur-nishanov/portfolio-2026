'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ButtonChevron } from '@/components/header/menu/icons';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { BackLink } from './BackLink';
import { CaseScroll } from './blocks';
import type { ArticleProps } from './registry';

export type IndexItem = { id: string; label: string };

// Where a heading counts as the one being read: this far down the screen.
const LINE = 0.4;
// Where a heading lands when its line in the index is chosen: under the top.
const TOP = 112;

/** A line of the index: the way back, or a chapter. */
const rowOf = (t: EventTarget | null) =>
  t instanceof Element ? t.closest<HTMLElement>('.cp-index__back, .cp-index li > a') : null;

/**
 * The way back and the chapters, down the left and kept in view as the case
 * scrolls (as on benji.org), the chapter being read in ink. Only where there
 * is room beside the column (case.css); a line chosen glides the case to
 * its chapter.
 *
 * The chapter being read sits on a pill, the menu's (MenuContent), hugging
 * its name: it glides down the lines as the case scrolls, to the line under
 * the pointer (the way back included) or the keyboard's, and back again when
 * they leave. The way back's chevron shows only then, as the links' at the
 * end of a case do.
 */
export function CaseIndex({ items, onBack, backHref }: { items: IndexItem[] } & ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const hovered = useRef<HTMLElement | null>(null);
  const focused = useRef<HTMLElement | null>(null);
  const reading = useRef('');
  const [current, setCurrent] = useState('');
  const caseScroll = useContext(CaseScroll);
  const { scrollTo } = useSmoothScroll();

  // The pill onto the line under the pointer, else the keyboard's, else the
  // chapter being read; off when there is none (the case's opening). It
  // appears where it is wanted and only glides between lines.
  const place = useCallback(() => {
    const nav = ref.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;
    const row =
      hovered.current ??
      focused.current ??
      (reading.current ? nav.querySelector<HTMLElement>(`li > a[href="#${reading.current}"]`) : null);
    if (!row) {
      pill.removeAttribute('data-on');
      pill.removeAttribute('data-pressed');
      return;
    }
    const appearing = !pill.hasAttribute('data-on');
    if (appearing) pill.setAttribute('data-instant', '');
    // The line's own box: it hugs its name (the way back's, its chevron too).
    pill.style.setProperty('--x', `${row.offsetLeft}px`);
    pill.style.setProperty('--y', `${row.offsetTop}px`);
    pill.style.setProperty('--w', `${row.offsetWidth}px`);
    pill.style.height = `${row.offsetHeight}px`;
    if (appearing) {
      void pill.offsetWidth;
      pill.removeAttribute('data-instant');
    }
    pill.setAttribute('data-on', '');
  }, []);

  useEffect(() => {
    reading.current = current;
    place();
  }, [current, place]);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const scroller = nav.closest<HTMLElement>('.cp__scroll');
    const target: HTMLElement | Window = scroller ?? window;
    const heads = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = (scroller ? scroller.clientHeight : window.innerHeight) * LINE;
      let id = '';
      for (const head of heads) if (head.getBoundingClientRect().top <= line) id = head.id;
      setCurrent(id);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [items]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const head = document.getElementById(id);
    if (!head) return;
    e.preventDefault();
    const y = head.getBoundingClientRect().top - TOP;
    // The layer's own scroll, or the page's.
    if (caseScroll) caseScroll.glide(caseScroll.get() + y);
    else scrollTo(window.scrollY + y, { offset: 0 });
    // The keyboard goes with it: the next Tab lands in the chapter, not on
    // the next line of the index (the anchor jump that would have moved it
    // is the one cancelled above).
    head.focus({ preventScroll: true });
  };

  return (
    <div className="cp-index-host">
      {/* Comes in with the first screen (useReveal), not before it. */}
      <nav
        ref={ref}
        className="cp-index cp-reveal"
        aria-label="Chapters"
        onPointerOver={(e) => {
          const row = rowOf(e.target);
          if (!row || e.pointerType === 'touch' || row === hovered.current) return;
          hovered.current = row;
          place();
        }}
        onPointerLeave={() => {
          hovered.current = null;
          place();
        }}
        onPointerDown={(e) => {
          if (rowOf(e.target)) pillRef.current?.setAttribute('data-pressed', '');
        }}
        onPointerUp={() => pillRef.current?.removeAttribute('data-pressed')}
        onFocus={(e) => {
          const row = rowOf(e.target);
          if (!row?.matches(':focus-visible')) return;
          focused.current = row;
          place();
        }}
        onBlur={() => {
          focused.current = null;
          place();
        }}
      >
        <span ref={pillRef} className="cp-index__pill" aria-hidden="true" />
        <BackLink onBack={onBack} backHref={backHref} className="cp-index__back">
          <span className="cp-index__chev" aria-hidden="true">
            <ButtonChevron className="cp-chevron-left" />
          </span>
          <span>Back to all work</span>
        </BackLink>
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} aria-current={current === item.id ? 'true' : undefined} onClick={(e) => go(e, item.id)}>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
