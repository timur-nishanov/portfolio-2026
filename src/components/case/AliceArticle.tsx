'use client';

import { useRef } from 'react';
import { aliceMedia as media } from '@/data/aliceCase';
import { AliceDay, AliceJobs } from './AliceBoards';
import { Facts, Figure, Heading, Mark, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Pick one idea out of many' },
  { id: 'cp-02', label: 'Turn several concepts into one' },
  { id: 'cp-03', label: 'Take Alice out of the chat' },
  { id: 'cp-04', label: 'Stay with you all day' },
  { id: 'cp-05', label: 'Be there at the desk too' },
  { id: 'cp-06', label: 'Set Alice up once' },
  { id: 'cp-landed', label: 'Where it landed' },
];

/**
 * The Yandex Alice case study, set as the Chums one is (ChumsArticle): one
 * narrow column, the pictures between the words in the same column, the way
 * back and the chapters down the left where there is room.
 */
export function AliceArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Yandex Alice</h1>
        <p className="cp-subtitle cp-reveal">An AI assistant that lives on the lock screen, not in a chat</p>
        <p className="cp-reveal">
          This is a concept for a design battle run by the{' '}
          <a className="cp-a" href="https://alice.yandex.ru" target="_blank" rel="noopener noreferrer">
            Yandex Alice
          </a>{' '}
          team at the{' '}
          <a className="cp-a" href="https://www.kaifconf.ru/kaiferenciya-2025" target="_blank" rel="noopener noreferrer">
            Kaiference
          </a>{' '}
          conference. The brief: imagine an AI product with no technical limits, built around the phone.
        </p>
        <p className="cp-reveal">
          Our studio team took <Mark>2nd place, one point behind the winner</Mark>.
        </p>
        <Facts
          items={[
            ['Role', 'Senior Designer'],
            ['Team', 'Studio team of five, with an art director'],
            ['Timeline', 'July 2025'],
          ]}
        />
        <p className="cp-reveal">
          I worked on the idea, the scenario and the screens. The team presented it live at the conference, and I
          worked remotely.
        </p>
        <Figure slot={media.morning} frame="phone" />
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Pick one idea out of many</Heading>
        <p className="cp-reveal">
          We started with a brainstorm. Ideas on the board: a tutor for anything, dreams turned into a series, a guard
          against phone scams, worlds built from a prompt.
        </p>
        <p className="cp-reveal">
          We chose the broadest one: <Mark>an assistant across all your apps</Mark> that does things for you, not only
          answers. A real Jarvis, an AI butler.
        </p>
        <Figure slot={media.ideas} frame="stage" />
        <p className="cp-reveal">
          Then we wrote down the jobs people would hire it for, from a social media detox to a summary after every
          call. Each job became a card Alice shows at the right moment.
        </p>
        <AliceJobs />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Turn several concepts into one</Heading>
        <p className="cp-reveal">
          Each of us made a concept, and we kept the strongest parts: cards instead of a chat, a greeting that knows
          your day, and Alice’s purple.
        </p>
        <Figure slot={media.concepts} frame="stage" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Take Alice out of the chat</Heading>
        <p className="cp-reveal">
          A chat works like a queue of requests. You have to know what to ask and remember to open the app.
        </p>
        <p className="cp-reveal">
          Most moments when help is useful don’t look like that. You slept badly. A call starts in six minutes. You
          can’t decide what to do tonight. Nobody opens a chat&nbsp;then.
        </p>
        <p className="cp-reveal">
          <Mark>So we moved Alice to the lock screen.</Mark> She shows a card when something is about to happen. The
          usual on-&#8288;demand tools stayed in a second tab called&nbsp;Studio.
        </p>
        <Figure slot={media.lockScreen} frame="phone" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Stay with you all day</Heading>
        <p className="cp-reveal">
          We planned the day hour by hour: what Alice can notice at each point, from sleep, the calendar, steps and
          screen time, and what she brings.
        </p>
        <AliceDay />
        <p className="cp-reveal">
          She doesn’t only suggest. She orders, books and writes drafts. You confirm with one&nbsp;tap.
        </p>
        <p className="cp-reveal">
          Before a call she gathers what you need for it. After the call she sums it up: the key points, the next steps
          and materials to go with them.
        </p>
        <Figure slot={media.meeting} frame="phone" />
        <p className="cp-reveal">
          Before bed she asks how the day went, and the little face on the card takes on your mood.
        </p>
        <Figure slot={media.evening} frame="phone" />
      </section>

      {/* --- 05 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-05">
        <Heading id="cp-05">Be there at the desk too</Heading>
        <p className="cp-reveal">
          On a Mac, Alice sits in the notch. Paste a link to a Figma frame, say what you need, and she writes the
          feedback while the orb thinks.
        </p>
        <Figure slot={media.macFeedback} frame="desktop" />
        <p className="cp-reveal">When a call ends, Alice writes it up right in the notch.</p>
        <Figure slot={media.macSummary} frame="desktop" />
      </section>

      {/* --- 06 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-06">
        <Heading id="cp-06">Set Alice up once</Heading>
        <p className="cp-reveal">
          At the start you sign in with Yandex&nbsp;ID and pick an avatar and a character for Alice. Then you connect
          services: Yandex apps, work tools, messengers, food delivery. The more she can see, the more useful her
          cards are.
        </p>
        <Figure slot={media.onboarding} frame="phone" />
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        <Results
          items={[
            [
              '2nd place',
              'The jury scored five things: idea, visuals, storytelling, interaction and impact on the future. The maximum was 75 points. We finished one point behind the winner, an in-house product team, and ahead of the other in-house teams.',
            ],
          ]}
        />
      </section>
    </article>
  );
}
