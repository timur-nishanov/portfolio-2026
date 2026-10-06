'use client';

import { useRef } from 'react';
import { showcase, type ShowcaseCase } from '@/data/showcase';
import { PhoneMockup } from '@/components/cases/PhoneMockup';
import { RotatingNotes } from './RotatingNotes';
import { CursorChip } from './CursorChip';
import './showcase.css';

function CaseCard({ item }: { item: ShowcaseCase }) {
  const ref = useRef<HTMLElement>(null);
  return (
    // The whole card will open the case study; that design comes later, so a
    // click does nothing yet — the chip only previews the affordance.
    // data-scroll-frame: the menu's "Works" lands with the first card centred.
    <article ref={ref} className="cs-card" aria-labelledby={`cs-${item.id}`} data-scroll-frame>
      <div className="cs-card__head">
        <h2 id={`cs-${item.id}`} className="cs-card__title">
          {item.title}
        </h2>
        <p className="cs-card__sub">{item.subtitle}</p>
      </div>
      <div className="cs-card__phone">
        <PhoneMockup phone={item.phone} />
      </div>
      <RotatingNotes notes={item.notes} className="cs-card__notes" />
      <CursorChip zoneRef={ref} />
    </article>
  );
}

/** The cases after the hero (#works, the menu's "Works"). */
export function CaseShowcase() {
  return (
    <section id="works" aria-label="Works" className="cs">
      {showcase.map((item) => (
        <CaseCard key={item.id} item={item} />
      ))}
    </section>
  );
}
