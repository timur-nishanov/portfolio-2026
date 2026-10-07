'use client';

import { useEffect, useRef } from 'react';
import { showcase, type ShowcaseCase } from '@/data/showcase';
import { PhoneMockup } from '@/components/cases/PhoneMockup';
import { MonitorMockup } from './MonitorMockup';
import { RotatingNotes } from './RotatingNotes';
import { CursorChip } from './CursorChip';
import './showcase.css';

function CaseCard({ item }: { item: ShowcaseCase }) {
  const ref = useRef<HTMLElement>(null);
  return (
    // The whole card will open the case study; that design comes later, so a
    // click does nothing yet — the chip only previews the affordance.
    // data-scroll-frame: the menu's "Works" lands with the first card centred.
    <article
      ref={ref}
      className="cs-card"
      data-device={item.device}
      aria-labelledby={`cs-${item.id}`}
      data-scroll-frame
    >
      <div className="cs-card__head">
        <h2 id={`cs-${item.id}`} className="cs-card__title">
          {item.title}
        </h2>
        <p className="cs-card__sub">{item.subtitle}</p>
      </div>
      {item.device === 'imac' ? (
        <div className="cs-card__imac">
          <MonitorMockup screen={item.phone} />
        </div>
      ) : (
        <div className="cs-card__phone">
          <PhoneMockup phone={item.phone} />
        </div>
      )}
      <RotatingNotes notes={item.notes} className="cs-card__notes" />
      <CursorChip zoneRef={ref} />
    </article>
  );
}

// How the card beneath goes as the next one slides over it: it shrinks a
// little toward its top edge, blurs, and fades out completely by the time it
// is covered.
const COVERED_SCALE = 0.08;
const COVERED_BLUR = 10; // px
const GAP = 20; // between cards, as in showcase.css

/** The cases after the hero (#works, the menu's "Works"). */
export function CaseShowcase() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>('.cs-card')];
    if (cards.length < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      for (let i = 0; i < cards.length - 1; i++) {
        const card = cards[i];
        // Scaled from its top edge, so its rect's top is still its place.
        const top = card.getBoundingClientRect().top;
        const next = cards[i + 1].getBoundingClientRect().top;
        // 0 while the next card is a full card (and the gap) below, 1 once it
        // has slid all the way over and parked on the same line.
        const p = Math.min(1, Math.max(0, 1 - (next - top) / (card.offsetHeight + GAP)));
        // The incoming card lifts off the one beneath with a soft shadow on its
        // top edge: strongest mid-way, gone once it has parked (there is
        // nothing left under it to cast onto).
        cards[i + 1].style.setProperty('--lift', (4 * p * (1 - p)).toFixed(3));
        if (p === 0) {
          card.style.transform = '';
          card.style.filter = '';
          card.style.opacity = '';
          continue;
        }
        if (!reduced) {
          card.style.transform = `scale(${1 - COVERED_SCALE * p})`;
          card.style.filter = `blur(${(COVERED_BLUR * p).toFixed(2)}px)`;
        }
        card.style.opacity = String(1 - p * p);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section ref={ref} id="works" aria-label="Works" className="cs">
      {showcase.map((item) => (
        <CaseCard key={item.id} item={item} />
      ))}
    </section>
  );
}
