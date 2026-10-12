'use client';

import { useRef } from 'react';
import { aliceMedia as media } from '@/data/aliceCase';
import { Facts, Figure, Heading, Mark, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Turn several concepts into one' },
  { id: 'cp-02', label: 'Take Alice out of the chat' },
  { id: 'cp-03', label: 'Stay with you all day' },
  { id: 'cp-04', label: 'Set Alice up once' },
  { id: 'cp-05', label: 'Show it in motion' },
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
          conference. The question was: what could an AI assistant be with no technical limits? It had to be built
          around the phone.
        </p>
        <p className="cp-reveal">
          Our studio team took <Mark>2nd place, one point behind the winner</Mark>.
        </p>
        <Facts
          items={[
            ['Role', 'Senior Designer'],
            ['Team', 'Studio team of five, with an art director'],
            ['Timeline', '2025'],
          ]}
        />
        <p className="cp-reveal">
          I worked on the idea, the scenario and the screens. The team presented it live at the conference, and I
          worked remotely.
        </p>
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Turn several concepts into one</Heading>
        <p className="cp-reveal">
          We read the brief together and brainstormed. Then we made several concepts and merged them into one.
        </p>
        <Figure slot={media.concepts} frame="wide" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Take Alice out of the chat</Heading>
        <p className="cp-reveal">
          A chat works like a queue of requests. You have to know what to ask and remember to open the app.
        </p>
        <p className="cp-reveal">
          Most moments when help is useful don’t look like that. You slept badly. A call starts in six minutes. You
          can’t decide what to do tonight. Nobody opens a chat&nbsp;then.
        </p>
        <p className="cp-reveal">
          <Mark>So we moved Alice to the lock screen.</Mark> She shows a card when something is about to happen. The
          usual on&#8209;demand tools stayed in a second tab called&nbsp;Studio.
        </p>
        <Figure slot={media.lockScreen} frame="phone" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Stay with you all day</Heading>
        <p className="cp-reveal">
          Alice is with you all day. She suggests a warm-up after a short night, orders breakfast, prepares you for a
          call and sums it up after, plans a weekend trip and asks how you feel before bed.
        </p>
        <p className="cp-reveal">She doesn’t only suggest. She orders, books and writes drafts. You confirm with one&nbsp;tap.</p>
        <Figure slot={media.day} frame="wide" />
        <p className="cp-reveal">On a Mac she sits in the notch, so she’s there at the desk too.</p>
        <Figure slot={media.notch} frame="desktop" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Set Alice up once</Heading>
        <p className="cp-reveal">
          At the start you sign in with Yandex&nbsp;ID and pick an avatar and a character for Alice. Then you connect
          services: Yandex apps, work tools, messengers, food delivery. The more she can see, the more useful her
          cards are.
        </p>
        <Figure slot={media.onboarding} frame="wide" />
      </section>

      {/* --- 05 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-05">
        <Heading id="cp-05">Show it in motion</Heading>
        <p className="cp-reveal">
          Visuals and storytelling were two of the five things the jury scored. So we presented the concept in
          motion, not as static screens.
        </p>
        <Figure slot={media.presentation} frame="desktop" />
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        <Results
          items={[
            [
              '2nd place',
              'The jury scored five things: idea, visuals, storytelling, interaction and impact on the future. The maximum was 75 points. We finished one point behind the winner, an in-house product team, and ahead of the other product teams.',
            ],
          ]}
        />
      </section>
    </article>
  );
}
