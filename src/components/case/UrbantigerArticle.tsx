'use client';

import { useRef } from 'react';
import { urbantigerMedia as media } from '@/data/urbantigerCase';
import { Facts, Figure, Heading, Mark, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Turn the brief into a plan' },
  { id: 'cp-02', label: 'Make buying shorter' },
  { id: 'cp-03', label: 'Answer the developers’ questions in advance' },
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
          Urbantiger is a Russian premium clothing brand that makes most of its collections from sustainable materials.
          I was the senior designer on the full redesign of its online store,{' '}
          <a className="cp-a" href="https://urbantiger.ru" target="_blank" rel="noopener noreferrer">
            urbantiger.ru
          </a>
          . (The live store is in Russian. The screens here are translated.)
        </p>
        <p className="cp-reveal">
          The old store went up in a rush in 2021. A round of UX fixes in 2022 lifted conversion, and after 2023 nobody
          touched it again. The site no longer matched the brand, and people had few reasons to come back.
        </p>
        <p className="cp-reveal">
          The brief was big: 28 pages, four breakpoints, a design system, loyalty and gift cards.{' '}
          <Mark>We had three months.</Mark> The goal was a store that’s easy to buy from and still looks premium.
        </p>
        <Facts
          items={[
            ['Role', 'Senior designer'],
            [
              'Team',
              'Client’s product strategist and head of the online store · studio’s design lead, two junior designers and an illustrator',
            ],
            ['Timeline', 'Three months of design, handed over in July 2025'],
            ['Outcome', 'MVP live · conversion at about twice the old site’s rate, as the client reported'],
          ]}
        />
        <p className="cp-reveal">
          Urbantiger was a client of Cedro Agency, the studio I worked at. We won the tender for the design, and another
          team built it.
        </p>
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Turn the brief into a plan</Heading>
        <p className="cp-reveal">
          The client’s product strategist wrote the brief himself: every page, every block, with references. He used to
          work at Only&nbsp;Me, a store I’d designed before, and almost half of his references were my old screens. The
          brief also said we could change anything, as long as we could argue for it.
        </p>
        <p className="cp-reveal">
          Before any visuals we went through stores like Urbantiger, from 12&nbsp;Storeez and Monochrome to Moncler and
          Stone&nbsp;Island. We stole the wishlist idea from Zara, then checked how marketplaces run theirs. The gift
          card flow came from Zolotoe&nbsp;Yabloko, a Russian beauty chain. Then I mapped the whole store as one flow
          and built clickable prototypes, so we could argue about structure while it was still cheap to change.
        </p>
        <Figure slot={media.flow} frame="wide" />
        <p className="cp-reveal">
          With the design lead I made three directions for the home page: eco, tech and fashion. A&nbsp;fourth grew out
          of those three and became the final design.
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
            Catalog. Pick a size and add to cart right from the product card, so you don’t lose your place in the
            catalog. If your size is sold out, ask for a restock alert. Filter by fabric, from linen to recycled
            polyester.
          </li>
          <li>
            Product page. A gallery with zoom, stock hints like “only a few left”, and details tucked into side sheets,
            so the page stays short.
          </li>
          <li>
            Cart. Related products, promo codes and gift wrapping in one place. A quick cart opens from any page.
          </li>
          <li>
            Checkout. Three delivery options, and each says plainly what you get. Store pickup comes with a fitting
            room. Pay by card, on delivery or in installments.
          </li>
        </ul>
        <Figure slot={media.catalog} frame="stage" />
        <Figure slot={media.product} frame="stage" />
        <Figure slot={media.checkout} frame="stage" />
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Answer the developers’ questions in advance</Heading>
        <p className="cp-reveal">
          Another team was going to build the store, and we wouldn’t be in the room when they had questions. So the
          mockups had to answer them in advance, including what happens when things go wrong:
        </p>
        <ul className="cp-list cp-list--short cp-reveal">
          <li>Signing in by phone, confirmed through Telegram, VK or a call.</li>
          <li>Promo code and bonus errors, each with its own message.</li>
          <li>Restock alerts for sizes that sold out.</li>
          <li>Empty cart, wishlist and alerts. The empty cart suggests products instead of just saying it’s empty.</li>
          <li>Changing an email or phone number.</li>
          <li>
            Returns in six steps. The old returns were hard to start, couldn’t be tracked, and you printed the forms
            yourself. Pick an exchange instead of a refund and you get an extra 10% off: the customer gets a deal, and
            the money stays in the store.
          </li>
        </ul>
        <Figure slot={media.signIn} frame="stage" />
        <Figure slot={media.promoBonus} frame="stage" />
        <Figure slot={media.emptyCart} frame="stage" />
        <Figure slot={media.returns} frame="stage" />
        <p className="cp-reveal">
          Everything sits on one UI kit, so 28 pages at four breakpoints stay consistent. I worked on it with two junior
          designers and an illustrator.
        </p>
        <Figure slot={media.breakpoints} frame="stage" />
        <Figure slot={media.devices} frame="stage" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Give people a reason to come back</Heading>
        <p className="cp-reveal">The brief asked for a loyalty program. We designed three parts of it:</p>
        <ul className="cp-list cp-reveal">
          <li>
            Achievements. Badges for purchases, eco choices and activity, in silver, gold and platinum. Night&nbsp;Owl
            is for shopping at night, Trendsetter for buying from a new collection in its first week. Each badge gives
            bonus points or a gift. The illustrator drew them, and I set the direction.
          </li>
          <li>
            Gift cards. Pick a design, set the amount, add a greeting. The recipient opens it like an envelope, because
            a gift should feel like one.
          </li>
          <li>
            Wishlist collections. Group saved items and share a collection by link, for the friend who always asks what
            you want for your birthday.
          </li>
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
                Live: catalog, product page, cart, checkout and account. The client reported{' '}
                <Mark>conversion at about twice the old site’s rate</Mark>, while traffic fell 30 to 40% over the same
                period.
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
