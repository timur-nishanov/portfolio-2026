'use client';

import { useRef } from 'react';
import { kritikaMedia as media } from '@/data/kritikaCase';
import { Facts, Figure, Heading, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Rate films with character' },
  { id: 'cp-02', label: 'A poster that becomes a stamp' },
  { id: 'cp-03', label: 'Build it, not just draw it' },
  { id: 'cp-04', label: 'Work in progress' },
];

/**
 * The Kritika case study, set as the others are (ChumsArticle): one column,
 * the media between the words at one width from the text's edge, the way
 * back and the chapters down the left where there is room.
 */
export function KritikaArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Kritika</h1>
        <p className="cp-subtitle cp-reveal">A film review app, designed and built solo</p>
        <p className="cp-reveal">
          Kritika is a side project: an iOS app for people who have opinions about films. You add a film, rate it,
          write a review, and the poster becomes a stamp in your collection.
        </p>
        <p className="cp-reveal">
          I designed it and built it in SwiftUI with Claude Code. It’s still in progress, and I like it anyway.
        </p>
        <Facts
          items={[
            ['Role', 'Everything: concept, design, code'],
            ['Timeline', '2026, ongoing'],
          ]}
        />
        <Figure slot={media.inHand} frame="stage" />
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Rate films with character</Heading>
        <p className="cp-reveal">
          Stars say nothing about a film. So the scale in Kritika goes from Shit to Oscar, with a tomato for a flop
          and popcorn for “fine”. Three of them, for plot, action and acting, because a film can have a great story
          and terrible acting.
        </p>
        <Figure slot={media.ratings} frame="phone" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">A poster that becomes a stamp</Heading>
        <p className="cp-reveal">
          Adding a review is one screen: pick a film, drop in a photo, rate it, write. The photo turns into a stamp
          with a perforated edge. That stamp is the film’s face everywhere in the app, and you can peel it off into
          your collection.
        </p>
        <Figure slot={media.addReview} frame="phone" />
        <Figure slot={media.peel} frame="phone" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Build it, not just draw it</Heading>
        <p className="cp-reveal">
          The mockups are in Figma. Claude Code reads them through Figma MCP and builds the screens in SwiftUI. I
          review every screen on the phone and tune the motion until it feels right.
        </p>
        <p className="cp-reveal">
          Building it myself changed the design. Every screen gets its empty state first. And the stamp only exists
          because I could build it: in a handoff it would have been “nice to have”.
        </p>
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Work in progress</Heading>
        <p className="cp-reveal">
          Kritika isn’t in the App Store yet. The feed, the review screen, the ratings and the collection work on my
          phone. Accounts and search are next.
        </p>
        <p className="cp-reveal">The feed already works, with other people’s reviews to like.</p>
        <Figure slot={media.feed} frame="phone" />
      </section>
    </article>
  );
}
