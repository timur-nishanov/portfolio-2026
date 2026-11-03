'use client';

import { useRef } from 'react';
import { beriZaryadMedia as media } from '@/data/beriZaryadCase';
import { Facts, Figure, FigurePair, Heading, Table, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import { GlassOrbs } from './GlassOrbs';
import { NoteBoard, type NoteColumn } from './NoteBoard';
import type { ArticleProps } from './registry';

// What came up again and again in the competitors' apps and their reviews,
// both on blue notes.
const FOUND: NoteColumn[] = [
  {
    label: 'Competitors',
    blue: true,
    notes: [
      { text: 'Everyone sells taking, nobody sells returning' },
      { text: 'No marks for where it pays to return' },
      { text: 'No route to the station' },
    ],
  },
  {
    label: 'Reviews',
    blue: true,
    notes: [
      { text: 'The return often doesn’t count' },
      { text: '“No free slots”, you came for nothing' },
      { text: 'No confirmation that it worked' },
    ],
  },
];

const QUESTIONS = [
  { title: 'Where do I return it?', text: 'Bonus stations get their own color and a route' },
  { title: 'Will the station take it?', text: 'Free slots are shown on the pin' },
  { title: 'Will I get the discount?', text: 'You see it before the rent and get a confirmation after' },
];

// RICE: Reach × Impact × Confidence ÷ Effort, the top of the list.
const RICE_HEAD = [
  { name: 'Feature' },
  { name: 'Reach', short: 'R' },
  { name: 'Impact', short: 'I' },
  { name: 'Confidence', short: 'C' },
  { name: 'Effort', short: 'E' },
  { name: 'Score' },
];
const RICE: (string | number)[][] = [
  ['Route to the return station', 9, 3, '0.9', 1, '24.3'],
  ['Banners about the bonus', 9, 3, '0.9', 1, '24.3'],
  ['Bonus station highlighted on the map', 9, 2, '1.0', 1, '18.0'],
  ['“Discount applied” confirmation', 9, 2, '0.9', 1, '16.2'],
  ['Lock screen Live Activity', 8, 3, '0.75', 2, '9.0'],
];

const RELEASE: NoteColumn[] = [
  {
    label: 'MVP',
    notes: [
      { text: 'Bonus stations on the map' },
      { text: 'Route to the station' },
      { text: 'Bonus stations only during a rent' },
      { text: 'Push when the phone is charged' },
    ],
  },
  {
    label: 'Later',
    blue: true,
    notes: [{ text: 'Dynamic discounts' }, { text: 'Booking a station' }, { text: 'Lock screen Live Activity' }],
  },
];

/**
 * Beri Zaryad, a short case shared by link alone (UnlistedCasePage): set as
 * the others are, but with no chapters down the left, only the way home.
 */
export function BeriZaryadArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={[]} onBack={onBack} backHref={backHref} backLabel="Home" />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Beri Zaryad</h1>
        <p className="cp-subtitle cp-reveal">Getting powerbanks back to the stations that need them</p>
        <p className="cp-reveal">
          This was a take-home test for a powerbank rental service. I sent it on time and never heard back, so I
          finished it for myself.
        </p>
        <Facts
          items={[
            ['Role', 'Product designer, solo'],
            ['Format', 'Take-home test'],
            ['Done', 'Research, prioritization, flows, UI, motion'],
          ]}
        />
      </div>

      <section className="cp-chapter cp-col" aria-labelledby="bz-problem">
        <Heading id="bz-problem">The problem</Heading>
        <p className="cp-reveal">
          You can return a powerbank to any station, but people bring it back to the one they took it from. Busy
          stations run empty at peak hours, and couriers rebalance them by hand.
        </p>
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-found">
        <Heading id="bz-found">What I found</Heading>
        <p className="cp-reveal">I looked at 13 rental apps and read the reviews.</p>
        <NoteBoard columns={FOUND} caption="What came up again and again" />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-field">
        <Heading id="bz-field">Field test</Heading>
        <p className="cp-reveal">
          Then I asked friends in Kirov and Krasnoyarsk to rent and return a powerbank for real, in Beri Zaryad and in
          its competitor EnerGO. They shared their screens on a call, and I watched where they got stuck.
        </p>
        <FigurePair slots={[media.field, media.energo]} frame="phone" />
        <ul className="cp-list cp-reveal">
          <li>The “Finish” button felt scary: one wrong tap and the rent ends</li>
          <li>There was a route to take a powerbank, but not to return it, so they opened Yandex Maps</li>
          <li>EnerGO showed a photo of the station, Beri Zaryad didn’t</li>
          <li>In Krasnoyarsk, Beri Zaryad wouldn’t rent at all and showed a generic error</li>
        </ul>
        <blockquote className="cp-quote cp-reveal">
          <p>
            People don’t mind returning it elsewhere. They just aren’t sure where to go and whether the discount will
            count.
          </p>
        </blockquote>
        <GlassOrbs items={QUESTIONS} caption="Three questions behind every screen" />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-first">
        <Heading id="bz-first">What goes first</Heading>
        <p className="cp-reveal">
          I scored the ideas with RICE and put the simplest ones with the most reach into the first release.
        </p>
        <Table head={RICE_HEAD} rows={RICE} caption="RICE scoring, top of the list" />
        <NoteBoard columns={RELEASE} caption="First release and what comes next" />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-take">
        <Heading id="bz-take">Take</Heading>
        <p className="cp-reveal">The bonus station stands out on the map, and the discount is shown before you rent.</p>
        <Figure slot={media.take} frame="stage" />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-rent">
        <Heading id="bz-rent">Rent</Heading>
        <p className="cp-reveal">
          During a rent the map shows only bonus stations. A push comes when your phone is fully charged, right when
          you’re ready to give the powerbank back.
        </p>
        <Figure slot={media.rent} frame="stage" />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-return">
        <Heading id="bz-return">Return</Heading>
        <p className="cp-reveal">The discount is confirmed right away, so you know it worked.</p>
        <Figure slot={media.ret} frame="stage" />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="bz-measure">
        <Heading id="bz-measure">What I’d measure</Heading>
        <ul className="cp-list cp-list--short cp-reveal">
          <li>Returns to bonus stations</li>
          <li>Free powerbanks at peak hours</li>
          <li>How many people used the discount</li>
        </ul>
      </section>
    </article>
  );
}
