'use client';

import { useRef } from 'react';
import type { ShowcaseCase } from '@/data/showcase';
import { PhoneMockup } from '@/components/cases/PhoneMockup';
import { openCase } from '@/components/case/caseStore';
import { MonitorMockup } from './MonitorMockup';
import { RotatingNotes } from './RotatingNotes';
import { CursorChip } from './CursorChip';
import './showcase.css';

/**
 * One case after the hero. A card with a case study opens it: the card
 * itself grows into the case's page (CaseLayer); the chip by the cursor
 * says so.
 */
export function CaseCard({ item }: { item: ShowcaseCase }) {
  const ref = useRef<HTMLElement>(null);
  const { href } = item;
  return (
    // data-scroll-frame: the menu's "Works" lands with the first card centred.
    <article
      ref={ref}
      className="cs-card"
      data-device={item.device}
      data-case={item.id}
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
      {href && (
        // The whole card is the link; the notes sit above it (they skip on a
        // click). A modified click (new tab) goes to the case's own page.
        <a
          className="cs-card__link"
          href={href}
          onClick={(e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            openCase({ id: item.id, href, card: ref.current });
          }}
        >
          <span className="sr-only">{item.title}: case study</span>
        </a>
      )}
      <RotatingNotes notes={item.notes} className="cs-card__notes" />
      <CursorChip zoneRef={ref} />
    </article>
  );
}
