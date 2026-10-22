'use client';

import { useRef } from 'react';
import type { ShowcaseCase } from '@/data/showcase';
import { openCase } from '@/components/case/caseStore';
import { loadCase } from '@/components/case/registry';
import type { VideoWatch } from '@/hooks/useLazyVideo';
import { MonitorMockup } from './MonitorMockup';
import { PhoneMockup } from './PhoneMockup';
import { RotatingNotes } from './RotatingNotes';
import { CursorChip } from './CursorChip';
import './showcase.css';

/** A card's recording plays once the card is nearly all on screen, a moment
    after, so it starts as the card comes to rest rather than while it is
    still sliding in, whichever device it holds; and from its first frame
    whenever it comes back (a card uncovered in the stack starts over too,
    see CaseShowcase). */
const CARD_WATCH: VideoWatch = { share: 0.85, hold: 200, restart: true, within: '.cs-card' };

/**
 * One case after the hero. A card with a case study opens it: the card
 * itself grows into the case's page (CaseLayer); the chip by the cursor
 * says so. A card without one (no href yet) has no chip either.
 */
export function CaseCard({ item }: { item: ShowcaseCase }) {
  const ref = useRef<HTMLElement>(null);
  const { href } = item;
  return (
    // data-scroll-frame: the menu's "Work" lands with the first card centred.
    <article
      ref={ref}
      className="cs-card"
      data-device={item.device}
      data-case={item.id}
      aria-labelledby={`cs-${item.id}`}
      data-scroll-frame
      // The pointer, or the keyboard, on the card: its article comes in now,
      // so a click opens the case at once (registry).
      onPointerEnter={href ? () => loadCase(item.id) : undefined}
      onFocus={href ? () => loadCase(item.id) : undefined}
    >
      <div className="cs-card__head">
        <h2 id={`cs-${item.id}`} className="cs-card__title">
          {item.title}
        </h2>
        <p className="cs-card__sub">{item.subtitle}</p>
      </div>
      {item.device === 'monitor' ? (
        <div className="cs-card__monitor">
          <MonitorMockup screen={item.phone} watch={CARD_WATCH} />
        </div>
      ) : (
        <div className="cs-card__phone">
          <PhoneMockup phone={item.phone} watch={CARD_WATCH} />
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
      {href && <CursorChip zoneRef={ref} />}
    </article>
  );
}
