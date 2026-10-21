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
        <h1 className="cp-title cp-reveal">Yandex Cloud</h1>
        <p className="cp-subtitle cp-reveal">A touchscreen game for a conference booth</p>
        <p className="cp-reveal">
          Yandex Cloud wanted its booth at Yandex Scale 2026 to show what its 20+ data services are for, pull visitors
          into the merch contest and bring in leads.
        </p>
        <p className="cp-reveal">
          I designed a touchscreen game about its data platform. A visitor picks a business task on a 55-&#8288;inch
          screen and puts together the services that solve it.
        </p>
        <p className="cp-reveal">
          I also built the front end myself, with Claude Code. <Mark>Design and front end took a week and a half</Mark>,
          and the production version was built on my code.
        </p>
        <Facts
          items={[
            ['Role', 'Senior designer, design and front end'],
            ['Team', 'Art director · Yandex Cloud’s product lead and designer · contractor’s engineers'],
            ['Timeline', 'August to September 2026'],
            ['Outcome', 'Ran at the booth · production built on my code'],
          ]}
        />
        <p className="cp-reveal">The back end and the production build were on the contractor’s side.</p>
        <Figure slot={media.firstScreen} frame="stage" />
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Make it work for someone passing by</Heading>
        <p className="cp-reveal">
          People stop at a booth for a minute or two, and someone is already waiting behind them. Nobody reads
          instructions. So every screen had to explain itself.
        </p>
        <p className="cp-reveal">
          The tasks are real business problems and need a few sentences. Everything else had to work without any text.
        </p>
        <Figure slot={media.booth} frame="stage" />
        <p className="cp-reveal">
          There are two modes: “Build it yourself”, where you put the chain together, and “Choose from
          ready-&#8288;made”, where you pick one of three bundles. The second is shorter and earns points for the merch
          contest.
        </p>
        <Figure slot={media.buildYourself} frame="stage" />
        <p className="cp-reveal">
          Every task has two minutes. When time runs out, the game doesn’t tell you that you lost. It shows the right
          order, so even an unfinished task teaches something, and you don’t get embarrassed in front of the queue.
        </p>
        <Figure slot={media.timesUp} frame="stage" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Make the wheel feel right</Heading>
        <p className="cp-reveal">
          Tasks sit on a wheel of cards. The idea came from Yandex Cloud’s designer and our art director. My part was
          the feel. On a 55-&#8288;inch screen a wheel easily feels too light or too heavy, and I tuned it until it felt
          right. It sweeps through all the cards once, so you see how many there are, and a flick snaps to the nearest
          card.
        </p>
        <Figure slot={media.wheel} frame="stage" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Turn every result into a lead</Heading>
        <p className="cp-reveal">
          Points are the reason to finish. In the short mode the right bundle earns them, and the screen sends you to
          the booth staff to trade them for merch.
        </p>
        <Figure slot={media.readyBundle} frame="stage" />
        <p className="cp-reveal">
          “Build it yourself” gives no points, so its result offers the short mode with one button.
        </p>
        <Figure slot={media.goToReady} frame="stage" />
        <p className="cp-reveal">Every result also has a QR code: a request form for materials or a consultation.</p>
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Hand over code, not mockups</Heading>
        <p className="cp-reveal">
          The plan was the usual one: I design, developers build. Then our art director asked why I didn’t build it
          myself. I said yes right away, even with a week and a half for everything.
        </p>
        <p className="cp-reveal">
          So Yandex Cloud reviewed a live game instead of pictures, and approved the design, the flow and the motion
          right on the screen. The contractor’s engineers took my code as the base for production. On a tight
          deadline, checking the build against the design took almost no time: the design was already code.
        </p>
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        {/* The players and the requests through the QR code join these lines
            once there are numbers. */}
        <Results
          items={[
            ['Booth', 'The game ran at the Yandex Cloud booth at Yandex Scale 2026.'],
            ['Code', 'Production shipped on my code, with minor changes.'],
          ]}
        />
        <Figure slot={media.team} frame="stage" />
      </section>
    </article>
  );
}
