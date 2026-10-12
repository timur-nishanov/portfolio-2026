'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { CaseScroll } from './blocks';

export type IndexItem = { id: string; label: string };

// Where a heading counts as the one being read: this far down the screen.
const LINE = 0.4;
// Where a heading lands when its line in the index is chosen: under the bar.
const TOP = 112;

/**
 * The chapters down the left, kept in view as the case scrolls (as on
 * benji.org), the one being read in ink. Only where there is room beside
 * the column (case.css); a line chosen glides the case to its chapter.
 */
export function CaseIndex({ items }: { items: IndexItem[] }) {
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
  };

  return (
    <div className="cp-index-host">
      <nav ref={ref} className="cp-index" aria-label="Chapters">
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
