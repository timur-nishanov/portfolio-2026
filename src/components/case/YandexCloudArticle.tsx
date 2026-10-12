'use client';

import { useRef } from 'react';
import { yandexCloudMedia as media } from '@/data/yandexCloudCase';
import { Facts, Figure, Heading, Mark, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Make it work for someone passing by' },
  { id: 'cp-02', label: 'Make the wheel feel right' },
  { id: 'cp-03', label: 'Turn every result into a lead' },
  { id: 'cp-04', label: 'Hand over code, not mockups' },
  { id: 'cp-landed', label: 'Where it landed' },
];

/**
 * The Yandex Cloud case study, set as the Chums one is (ChumsArticle): one
 * narrow column, the pictures between the words in the same column, the way
 * back and the chapters down the left where there is room.
 */
export function YandexCloudArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Yandex Cloud at Scale 2026</h1>
        <p className="cp-subtitle cp-reveal">A touchscreen game for a conference booth</p>
        <p className="cp-reveal">
          For the Yandex Cloud booth at Yandex Scale 2026, I designed a touchscreen game about its data platform and
          built the front end in code. A visitor picks a business task on a 55&#8209;inch screen and puts together the
          services that solve it.
        </p>
        <p className="cp-reveal">
          Yandex Cloud wanted the game to show what its 20+ data services are for, pull visitors into the merch contest
          and bring in leads.
        </p>
        <p className="cp-reveal">
          <Mark>Design and front end took a week and a half.</Mark> The production version was built on my code.
        </p>
        <Facts
          items={[
            ['Role', 'Senior Designer, design and front end'],
            ['Team', 'Art director · Yandex Cloud’s product lead and designer · Contractor’s engineers'],
            ['Timeline', 'August–September 2026'],
          ]}
        />
        <p className="cp-reveal">
          The front end is mine, written with Claude Code. The backend and the production build were on the client’s
          side.
        </p>
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Make it work for someone passing by</Heading>
        <p className="cp-reveal">
          People at a booth stop for a minute or two. Nobody reads instructions, and the next person is already
          waiting. So every screen has to explain itself.
        </p>
        <Figure slot={media.booth} frame="wide" />
        <p className="cp-reveal">
          There are two modes: build the chain yourself, or pick one of three ready bundles. The second is shorter and
          earns points for the merch contest.
        </p>
        <Figure slot={media.buildYourself} frame="desktop" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Make the wheel feel right</Heading>
        <p className="cp-reveal">
          Tasks sit on a wheel of cards. The idea came from Yandex Cloud’s designer and our art director, and I tuned it
          until it felt right under a finger. It sweeps through all the cards once, so you see how many there are, and a
          throw snaps to the nearest card.
        </p>
        <Figure slot={media.wheel} frame="imac" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Turn every result into a lead</Heading>
        <p className="cp-reveal">
          Points are the reason to finish. In the short mode a right bundle earns them, and the screen sends you to the
          booth staff to exchange them. Build it yourself gives no points, so its result offers the short mode with one
          button.
        </p>
        <p className="cp-reveal">
          Every result also has a QR code. It leads to a request form for materials or a consultation.
        </p>
        <Figure slot={media.readyBundle} frame="desktop" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Hand over code, not mockups</Heading>
        <p className="cp-reveal">
          The plan was the usual one: I design, developers build. The art director suggested I build it myself. So
          Yandex Cloud reviewed a live game, not pictures, and approved the design, the flow and the motion right in it.
        </p>
        <p className="cp-reveal">
          The contractor’s engineers took my code as the base for the production version, so design review on a tight
          deadline took almost no time.
        </p>
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        {/* The players and the requests through the QR code join this line
            once there are numbers. */}
        <Results items={[['Booth', 'The game ran at the Yandex Cloud booth at Yandex Scale 2026.']]} />
        <Figure slot={media.team} frame="wide" />
      </section>
    </article>
  );
}
