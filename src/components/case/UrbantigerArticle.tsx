'use client';

import { useRef } from 'react';
import { urbantigerMedia as media } from '@/data/urbantigerCase';
import { Facts, Figure, Heading, Mark, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Turn the brief into a plan' },
  { id: 'cp-02', label: 'Make buying shorter' },
  { id: 'cp-03', label: 'Design every state, not just the happy path' },
  { id: 'cp-04', label: 'Give people a reason to come back' },
  { id: 'cp-landed', label: 'Where it landed' },
];

/**
 * The Urbantiger case study, set as the Chums one is (ChumsArticle): one
 * narrow column, the pictures between the words in the same column, before
 * over after, the way back and the chapters down the left where there is
 * room.
 */
export function UrbantigerArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Urbantiger</h1>
        <p className="cp-subtitle cp-reveal">Redesigning an online clothing store</p>
        <p className="cp-reveal">
          I was the senior designer on the full redesign of{' '}
          <a className="cp-a" href="https://urbantiger.ru" target="_blank" rel="noopener noreferrer">
            urbantiger.ru
          </a>
          , the online store of a Russian premium
          clothing brand that makes most of its collections from sustainable materials.
        </p>
        <p className="cp-reveal">
          The old store was built in 2021 and designed in a hurry by an in-&#8288;house graphic designer. In 2022 the
          team fixed the most obvious UX issues and conversion went up. After 2023 nobody touched the UX. The site no
          longer matched the brand, and people had few reasons to come back.
        </p>
        <p className="cp-reveal">
          The client came with a detailed brief: 28 pages, four breakpoints, a design system, a loyalty program and
          gift cards. The goal was a store that’s easy to buy from and still looks premium.{' '}
          <Mark>We designed it in three months.</Mark>
        </p>
        <Facts
          items={[
            ['Role', 'Senior Designer, leading two junior designers and an illustrator'],
            ['Team', 'Client’s product strategist and head of the online store · Studio’s design lead'],
            ['Timeline', 'Three months of design, handed over in July 2025'],
          ]}
        />
        <p className="cp-reveal">
          Urbantiger was a client of the studio I worked at. We won the tender for the design. Another team did the
          development.
        </p>
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Turn the brief into a plan</Heading>
        <p className="cp-reveal">
          The client’s product strategist wrote the brief: every page, every block, with references. He used to work
          at Only&nbsp;Me, a store I designed earlier, and almost half of his references were Only&nbsp;Me screens.
          The brief also said we could change anything if we could argue for it.
        </p>
        <p className="cp-reveal">
          I was on the calls with the client from the start. Before any visuals we looked at the audience, the
          competitors and how other stores solve the same things. Then I mapped the whole store as a flow diagram and
          built prototypes, so we could argue about structure while it was cheap to change.
        </p>
        <Figure slot={media.flow} frame="wide" />
        <p className="cp-reveal">
          With the design lead I made three concept directions for the home page. A&nbsp;fourth grew out of the three, and
          it became the final design.
        </p>
        <Figure slot={media.concepts} frame="stage" />
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Make buying shorter</Heading>
        <p className="cp-reveal">
          Most of the money goes through four screens: catalog, product page, cart and checkout.
        </p>
        <Figure slot={media.home} frame="stage" />
        <ul className="cp-list cp-reveal">
          <li>
            Catalog. Pick a size and add to cart right from the product card. If a size is sold out, you can ask for a
            restock alert. You can filter by fabric, from linen to recycled polyester.
          </li>
          <li>
            Product page. A gallery with zoom, stock hints like “only a few left”, and details in side sheets, so the
            page stays short.
          </li>
          <li>
            Cart. Related products, promo codes and gift wrapping in one place. A quick cart opens from any page.
          </li>
          <li>
            Checkout. Three delivery options, and each one says what you get. Store pickup, for example, comes with
            fitting. You can pay by card, on delivery or in installments.
          </li>
        </ul>
        <Figure slot={media.catalog} frame="stage" />
        <Figure slot={media.product} frame="stage" />
        <Figure slot={media.checkout} frame="stage" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Design every state, not just the happy path</Heading>
        <p className="cp-reveal">
          Another team was building the store, so the mockups had to answer their questions. We designed the less
          obvious flows too, and what happens when something goes wrong:
        </p>
        <ul className="cp-list cp-list--short cp-reveal">
          <li>Sign-&#8288;in by phone, confirmed through Telegram, VK or a call.</li>
          <li>Promo code and bonus errors.</li>
          <li>Restock alerts for sold-&#8288;out sizes.</li>
          <li>Empty cart, wishlist and alerts.</li>
          <li>Changing an email or phone number.</li>
          <li>Returns in six steps. If you pick an exchange instead of a return, you get an extra 10% off.</li>
        </ul>
        <Figure slot={media.signIn} frame="stage" />
        <Figure slot={media.promoBonus} frame="stage" />
        <Figure slot={media.emptyCart} frame="stage" />
        <Figure slot={media.returns} frame="stage" />
        <p className="cp-reveal">
          Everything is built on one UI kit, so 28 pages at four breakpoints stay consistent. I led two junior
          designers and an illustrator and reviewed their work.
        </p>
        <Figure slot={media.breakpoints} frame="stage" />
        <Figure slot={media.devices} frame="stage" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Give people a reason to come back</Heading>
        <p className="cp-reveal">The brief asked for a loyalty section. We designed three things:</p>
        <ul className="cp-list cp-reveal">
          <li>
            Achievements. Badges for purchases, eco choices and activity, in silver, gold and platinum. Night&nbsp;Owl
            is for shopping at night, Trendsetter for buying from a new collection in its first week. Each badge gives
            bonus points or a gift. The illustrator drew the badges, I set the direction.
          </li>
          <li>
            Gift cards. Pick a design, set the amount, add a greeting. The recipient opens the card like an envelope.
          </li>
          <li>Wishlist collections. Group saved items and share a collection by link.</li>
        </ul>
        <Figure slot={media.achievements} frame="stage" />
        <Figure slot={media.giftCard} frame="stage" />
        <Figure slot={media.wishlist} frame="stage" />
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        <Results
          items={[
            [
              'MVP',
              <>
                Live. It covers catalog, product page, cart, checkout and account. The client reported{' '}
                <Mark>conversion at about twice the old site’s rate</Mark>. Traffic was down 30&#8288;–&#8288;40% over
                the same period.
              </>,
            ],
            [
              'Loyalty',
              <>
                Achievements, gift cards and wishlist collections were designed and handed to development. They hadn’t
                launched when I left the studio in January&nbsp;2026.
              </>,
            ],
          ]}
        />
      </section>
    </article>
  );
}
