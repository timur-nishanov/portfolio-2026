'use client';

import { useRef } from 'react';
import { kritikaMedia as media } from '@/data/kritikaCase';
import { Facts, Figure, Heading, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Rate films with character' },
  { id: 'cp-02', label: 'A poster that becomes a stamp' },
  { id: 'cp-03', label: 'Build it myself' },
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
          Kritika is my side project, a film review app for iOS. You add a film, rate it, write what you think, and its
          poster turns into a stamp for your collection.
        </p>
        <p className="cp-reveal">
          I design it and build it in SwiftUI with Claude Code. It’s not finished yet, but I already show it to
          everyone.
        </p>
        <Facts
          items={[
            ['Role', 'Everything: concept, design, code'],
            ['Timeline', '2026, ongoing'],
            ['Status', 'Works on my phone, not in the App Store yet'],
          ]}
        />
        <Figure slot={media.inHand} frame="stage" />
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Rate films with character</Heading>
        <p className="cp-reveal">
          Three and a half stars doesn’t tell you why. Was it the story? The acting? So Kritika has its own scale, from
          Shit to Oscar, with a tomato for Flop, popcorn for OK and a heart for Love it. You rate plot, action and
          acting separately, because a film can have a great story and terrible acting, and now your review can say so.
        </p>
        <p className="cp-reveal">
          The scale is the first thing the app shows you, before you even sign in. Then it asks your name and a photo,
          and welcomes you under the same laurels as the top review in the feed.
        </p>
        <Figure slot={media.onboarding} frame="phone" />
        <p className="cp-reveal">In a review, each rating keeps its icon. Tap one and it bursts across the screen.</p>
        <Figure slot={media.ratings} frame="phone" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">A poster that becomes a stamp</Heading>
        <p className="cp-reveal">
          Adding a review takes one screen: a poster, a title, three ratings, a few words. The poster turns into a stamp
          with a perforated edge as soon as you pick it, and the finished review lands at the top of the feed.
        </p>
        <Figure slot={media.addReview} frame="phone" />
        <p className="cp-reveal">
          You see that stamp everywhere in the app, and you can peel it off into your collection.
        </p>
        <Figure slot={media.peel} frame="phone" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Build it myself</Heading>
        <p className="cp-reveal">
          I design in Figma and build in SwiftUI with Claude Code, which reads my mockups through Figma MCP. I tune the
          animations myself, right on the phone, until the peel feels like paper.
        </p>
        <p className="cp-reveal">
          Building it myself changed how I design. Every screen starts with its empty state now, because I’m the first
          person to see it broken. And the stamp exists only because I could build it. In a handoff, it would have been
          the first “nice to have” to go.
        </p>
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Work in progress</Heading>
        <p className="cp-reveal">
          Kritika isn’t in the App Store yet. The feed, the reviews, the ratings, the collection and the profile already
          work on my phone. Search is next.
        </p>
        <Figure slot={media.feed} frame="phone" />
        <p className="cp-reveal">
          The profile sums you up as a critic: a badge for how you rate, from Softie to Tomato thrower, and laurels for
          the reviews that made the top three.
        </p>
        <Figure slot={media.profile} frame="phone" />
        <p className="cp-reveal">
          What I don’t know yet is whether people want to rate films this way, or just like peeling the stamps.
        </p>
      </section>
    </article>
  );
}
