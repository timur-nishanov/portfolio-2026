'use client';

import { useRef } from 'react';
import { lendlyMedia as media } from '@/data/lendlyCase';
import { Facts, Figure, Heading, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Put the investor’s questions on the card' },
  { id: 'cp-02', label: 'Two ways to buy' },
  { id: 'cp-03', label: 'Take the paperwork out of email' },
  { id: 'cp-04', label: 'Show investors their own money' },
  { id: 'cp-landed', label: 'Where it landed' },
];

/**
 * The Lendly case study, set as the Urbantiger one is (UrbantigerArticle): one
 * narrow column, the recordings between the words in the same column, the way
 * back and the chapters down the left where there is room.
 */
export function LendlyArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Lendly</h1>
        <p className="cp-subtitle cp-reveal">An investor platform for real estate crowdlending</p>
        <p className="cp-reveal">
          On Lendly, people invest in business loans, mostly backed by real estate, and can sell their stakes to other
          investors.
        </p>
        <p className="cp-reveal">
          In 2023 we redesigned Lendly’s public site and investor platform. I designed the marketplace, analytics and
          the flows where money and documents change hands.
        </p>
        <Facts
          items={[
            ['Role', 'Designer: marketplace, analytics and money flows'],
            ['Team', 'Lead designer, analyst, two PMs, copywriter · Lendly’s team and developers'],
            ['Timeline', 'May to December 2023'],
            ['Outcome', 'Platform designed and handed to Lendly’s developers'],
          ]}
        />
        <p className="cp-reveal">Lendly was a client of the studio I worked at.</p>
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Put the investor’s questions on the card</Heading>
        <p className="cp-reveal">
          Before buying, an investor checks what the deal is and how risky it is. Lendly and our analyst decided what
          the card shows, and I designed it:
        </p>
        <ul className="cp-list cp-list--short cp-reveal">
          <li>A badge for a loan or a project.</li>
          <li>The yield, with a tooltip on how it’s counted.</li>
          <li>A traffic light for late payments.</li>
          <li>Badges when the seller guarantees a buyback or is linked to Lendly.</li>
        </ul>
        <Figure slot={media.marketCard} frame="stage" />
        <p className="cp-reveal">
          Lendly’s review took the traffic light off new loans, since they can’t be late yet. Their cards show how much
          has been raised instead.
        </p>
        <p className="cp-reveal">
          In the first version the filters took half the screen. After a call with the developer, I made them fold away.
        </p>
        <Figure slot={media.filters} frame="stage" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Two ways to buy</Heading>
        <p className="cp-reveal">Buying a stake from another investor fits in one window.</p>
        <Figure slot={media.secondary} frame="stage" />
        <p className="cp-reveal">
          A new loan is different. Every document needs its own electronic signature, and none can be skipped. Our PM
          split the purchase into numbered steps, and I designed them with a stepper that shows how many signatures are
          left.
        </p>
        <Figure slot={media.primary} frame="stage" />
        <p className="cp-reveal">I also designed deposits, withdrawals and selling a stake.</p>
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Take the paperwork out of email</Heading>
        <p className="cp-reveal">
          Two things used to go to support by email: the application for qualified investor status, which lifts the
          yearly limit, and a notarized power of attorney, needed to invest in new loans. Now both live in the account.
        </p>
        <p className="cp-reveal">
          Try to invest over the limit, and the platform offers the application right there. Once it’s approved, a crown
          appears on your profile.
        </p>
        <Figure slot={media.qualified} frame="stage" />
        <p className="cp-reveal">
          The rules changed four times in seven weeks, and I redrew the flow each time. My questions along the way made
          the team pin down who can invest where.
        </p>
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Show investors their own money</Heading>
        <p className="cp-reveal">
          The dashboard shows your portfolio, your balance and a payout calendar with just the date, the borrower and
          the amount.
        </p>
        <Figure slot={media.dashboard} frame="stage" />
        <p className="cp-reveal">
          Analytics opens on your own portfolio, with the platform’s numbers one tab over. Lendly chose the charts, our
          analyst sketched them from references, and I designed them, along with what a new investor sees before there’s
          any data.
        </p>
        <Figure slot={media.analytics} frame="stage" />
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        <Results
          items={[
            ['Public site', 'Built over the summer of 2023.'],
            [
              'Platform',
              'Handed to Lendly’s developers. In December I drew the mobile screens that were still missing.',
            ],
          ]}
        />
        <Figure slot={media.mobile} frame="stage" />
        <p className="cp-reveal">
          We’d agreed to skip mobile versions of similar screens but never wrote down which. Five months later nobody
          remembered. Next time I’d write it down.
        </p>
      </section>
    </article>
  );
}
