'use client';

import { useEffect, useRef, useState } from 'react';
import type { ShowcaseCase } from '@/data/showcase';
import { PhoneMockup } from '@/components/cases/PhoneMockup';
import { CASE_RETURN_EVENT, openCase, type CaseReturn } from '@/components/case/caseStore';
import { MonitorMockup } from './MonitorMockup';
import { RotatingNotes } from './RotatingNotes';
import { CursorChip } from './CursorChip';
import './showcase.css';

type Props = {
  item: ShowcaseCase;
  /** The title's id is `${idPrefix}-${id}`: the case's copy of a card needs its own. */
  idPrefix?: string;
  /** The card on the page; the copy at the top of a case is neither a link
      nor shows the chip. */
  home?: boolean;
  titleAs?: 'h1' | 'h2';
  /** Which note the copy opens on: the one the card was showing. */
  noteStart?: number;
};

/**
 * One case after the hero. On the page, a card with a case study opens it
 * (the layer glides it up into the case); the chip by the cursor says so.
 * The case starts with a copy of the same card.
 */
export function CaseCard({ item, idPrefix = 'cs', home = true, titleAs: Title = 'h2', noteStart = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const titleId = `${idPrefix}-${item.id}`;
  const href = home ? item.href : undefined;

  // Back from the case, the notes carry on from where its copy left them.
  const [notes, setNotes] = useState({ at: noteStart, key: 0 });
  useEffect(() => {
    if (!href) return;
    const onReturn = (e: Event) => {
      const { id, note } = (e as CustomEvent<CaseReturn>).detail;
      if (id === item.id) setNotes((n) => ({ at: note, key: n.key + 1 }));
    };
    window.addEventListener(CASE_RETURN_EVENT, onReturn);
    return () => window.removeEventListener(CASE_RETURN_EVENT, onReturn);
  }, [href, item.id]);

  return (
    // data-scroll-frame: the menu's "Works" lands with the first card centred.
    <article
      ref={ref}
      className="cs-card"
      data-device={item.device}
      data-case={item.id}
      aria-labelledby={titleId}
      data-scroll-frame={home ? '' : undefined}
    >
      <div className="cs-card__head">
        <Title id={titleId} className="cs-card__title">
          {item.title}
        </Title>
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
      <RotatingNotes key={notes.key} notes={item.notes} startAt={notes.at} className="cs-card__notes" />
      {home && <CursorChip zoneRef={ref} />}
    </article>
  );
}
