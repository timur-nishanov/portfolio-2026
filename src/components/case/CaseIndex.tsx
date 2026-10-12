'use client';

import { useContext, useEffect, useRef, useState } from 'react';
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

/**
 * The way back and the chapters, down the left and kept in view as the case
 * scrolls (as on benji.org), the chapter being read in ink. Only where there
 * is room beside the column (case.css); a line chosen glides the case to
 * its chapter.
 */
export function CaseIndex({ items, onBack, backHref }: { items: IndexItem[] } & ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState('');
  const caseScroll = useContext(CaseScroll);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const scroller = nav.closest<HTMLElement>('.cp__scroll');
    const target: HTMLElement | Window = scroller ?? window;
    const heads = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    // The pictures run as wide as the page and would pass under the index:
    // it steps aside while one is there, and is back with the text.
    const wides = Array.from(nav.closest('.cp-article')?.querySelectorAll<HTMLElement>('.cp-wide') ?? []);
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = (scroller ? scroller.clientHeight : window.innerHeight) * LINE;
      let id = '';
      for (const head of heads) if (head.getBoundingClientRect().top <= line) id = head.id;
      setCurrent(id);
      const mine = nav.getBoundingClientRect();
      const under = wides.some((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > mine.top + 4 && r.top < mine.bottom - 4 && r.left < mine.right;
      });
      // Written on the nav at once rather than through a render: a picture
      // arriving under it is a matter of frames.
      nav.toggleAttribute('data-aside', under);
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
  };

  return (
    <div className="cp-index-host">
      {/* Comes in with the first screen (useReveal), not before it. */}
      <nav ref={ref} className="cp-index cp-reveal" aria-label="Chapters">
        <BackLink onBack={onBack} backHref={backHref} className="cp-index__back">
          <ButtonChevron className="cp-chevron-left" />
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
