'use client';

import { useRef } from 'react';
import { chumsLinks, chumsMedia as media } from '@/data/chumsCase';
import { ButtonChevron, RowChevron } from '@/components/header/menu/icons';
import { BackLink } from './BackLink';
import { BeforeAfter, Chapter, DesktopCompare, Fold, Orb, PhoneRow, ReadMore, useReveal } from './blocks';
import type { ArticleProps } from './registry';

// "6 steps to 1" never breaks across lines (as in the card's notes). The
// compound words below are tied with non-breaking hyphens (&#8209;) for the
// same reason: on a phone "top-up" broke as "top-/up".
const SIX_TO_ONE = '6 steps to 1';

/**
 * The Chums case study. One narrow column of text with a single left edge,
 * in four sizes, and the media running wider than it on the same centre line.
 * Every chapter shows its problem and what was done; how it was done waits
 * behind one "Read more". A hairline only between the big parts.
 */
export function ChumsArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        {/* The page's opening line. Not a heading: the case's title in the
            bar is the page's h1. */}
        <p className="cp-hero cp-reveal">The tech worked. Getting to it didn’t.</p>
        <p className="cp-lead cp-reveal">
          I led design at Chums, a messenger with a crypto wallet built into the chat. My job wasn’t to add features.
          It was to make the ones already there easy to find and use.
        </p>

        {/* The product's scale in three numbers, then the facts, a line each. */}
        <dl className="cp-stats cp-reveal">
          <div>
            <dt>Downloads</dt>
            <dd>10k</dd>
          </div>
          <div>
            <dt>Wallets</dt>
            <dd>32k+</dd>
          </div>
          <div>
            <dt>User balances</dt>
            <dd>$200k+</dd>
          </div>
        </dl>
        <dl className="cp-facts cp-reveal">
          <div>
            <dt>Goal</dt>
            <dd>Grow wallet use and top&#8209;ups</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>Design lead, mentoring a junior designer</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>Founders, PM, art director, 1&nbsp;developer</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>2024–2025</dd>
          </div>
        </dl>
      </div>

      <hr className="cp-divider cp-reveal" />

      {/* --- the concept --------------------------------------------------- */}
      <Chapter aria-labelledby="cp-concept">
        <div className="cp-col">
          <h2 id="cp-concept" className="cp-h cp-reveal">
            Give Chums its own look and flow
          </h2>
          <p className="cp-reveal">
            Chums looked like any other messenger, and moving between communities was slow: you picked a server once,
            at sign&#8209;in. In early 2024 I designed a new concept for the key screens.
          </p>
          <Fold>
            <p>
              Chums runs on Matrix, where every community can have its own server, so switching servers is a core
              action. The concept changed four things:
            </p>
            <ul className="cp-list">
              <li>Servers sit in a row at the top, like stories. One tap to switch.</li>
              <li>Signing in to a new server is a sheet over the chat list.</li>
              <li>Direct messages and server spaces are clearly apart.</li>
              <li>Sending coins sits in the attachment menu, next to photos and files.</li>
            </ul>
            <p>
              The founders liked it. When the product’s designer left, they asked me to lead design, with a junior
              designer to mentor.
            </p>
          </Fold>
          <ReadMore className="cp-reveal" />
        </div>

        <div className="cp-wide">
          <BeforeAfter before={media.concept.before} after={media.concept.after} />
        </div>
      </Chapter>

      <hr className="cp-divider cp-reveal" />

      {/* --- desktop ------------------------------------------------------- */}
      <Chapter aria-labelledby="cp-desktop">
        <div className="cp-col">
          <h2 id="cp-desktop" className="cp-h cp-reveal">
            Make desktop feel like desktop
          </h2>
          <p className="cp-reveal">
            The desktop app was the mobile layout stretched across a big window. It broke on resize, and simple actions
            covered the whole chat. Instead of fifty tickets, we treated it as one problem with three rules:
          </p>

          {/* The rules are the idea itself, so their names stay; what each
              one changed opens under it. */}
          <ol className="cp-rules">
            <li className="cp-rule cp-reveal">
              <span className="cp-rule__no">1</span>
              <div>
                <h3 className="cp-rule__title">Keep the chat in view</h3>
                <Fold>
                  <p>The contact picker and the emoji panel became small popovers instead of full&#8209;screen panels.</p>
                </Fold>
              </div>
            </li>
            <li className="cp-rule cp-reveal">
              <span className="cp-rule__no">2</span>
              <div>
                <h3 className="cp-rule__title">Build for a mouse and a resizable window</h3>
                <Fold>
                  <p>
                    Panels resize and collapse with the window. Drag&#8209;and&#8209;drop and right&#8209;click menus
                    cut attaching a file from {SIX_TO_ONE}. Message bubbles got calmer, and the wallet screens were
                    rebuilt for desktop.
                  </p>
                </Fold>
              </div>
            </li>
            <li className="cp-rule cp-reveal">
              <span className="cp-rule__no">3</span>
              <div>
                <h3 className="cp-rule__title">Explain anything that can cost money</h3>
                <Fold>
                  <p>
                    The recovery key is the only way back into your account and wallet after losing a device. The old
                    form never said so. Now it’s a guided step.
                  </p>
                </Fold>
              </div>
            </li>
          </ol>
          <Fold>
            <p>
              The founders and the PM approved the plan within a week. With one developer we had to cut, and a full
              wallet redesign went first: the wallet worked, getting to it didn’t. The first beta shipped three months
              later.
            </p>
          </Fold>
          <ReadMore className="cp-reveal" />
        </div>

        <div className="cp-wide">
          <DesktopCompare main={media.desktop.main} rows={media.desktop.rows} />
        </div>
      </Chapter>

      <hr className="cp-divider cp-reveal" />

      {/* --- rewards ------------------------------------------------------- */}
      <Chapter aria-labelledby="cp-rewards">
        <div className="cp-col">
          <h2 id="cp-rewards" className="cp-h cp-reveal">
            Make rewards easy to find and understand
          </h2>
          <p className="cp-reveal">
            Quests and wallet rewards were buried in the chat list, and nobody could see the payout before starting.
          </p>
          <Fold>
            <p>
              The PM came with XP for messenger actions plus time&#8209;limited quests from Venom, a blockchain network
              Chums worked with. The old quests were just a room in the chat list, set up by hand.
            </p>
            <p>
              Before drawing anything, the junior designer and I took the brief apart with the PM: what problem we
              solve, what people get at the end, where the points live and which metric should move.
            </p>
          </Fold>
          <p className="cp-reveal">
            We looked at how Telegram, Discord and Family handle three moments where rewards work or fall apart.
          </p>
          <ReadMore className="cp-reveal" />
        </div>

        {/* The three moments, in the order they happen. */}
        <div className="cp-wide">
          <ol className="cp-orbs">
            <Orb label="Discovery">Can people find it without being told where?</Orb>
            <Orb label="Comprehension">Do they get the rules inside the flow?</Orb>
            <Orb label="Payout visibility">Do they know what they’ll get before they start?</Orb>
          </ol>
        </div>

        <div className="cp-col">
          <p className="cp-reveal">
            Payout visibility mattered most, so the flow shows the reward up front, keeps progress in view and explains
            the rules in place. The junior designer drew the screens; I directed the work.
          </p>
        </div>

        <div className="cp-wide">
          <PhoneRow slots={media.rewards} />
        </div>
      </Chapter>

      <hr className="cp-divider cp-reveal" />

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <h2 id="cp-landed" className="cp-h cp-reveal">
          Where it landed
        </h2>
        <ul className="cp-results">
          <li className="cp-reveal">
            <h3 className="cp-result__title">Concept</h3>
            <p>Not shipped as one release. The product moved toward it piece by piece.</p>
          </li>
          <li className="cp-reveal">
            <h3 className="cp-result__title">Desktop</h3>
            <p>Approved in a week, in beta three months later. Attaching a file went from {SIX_TO_ONE}.</p>
          </li>
          <li className="cp-reveal">
            <h3 className="cp-result__title">Rewards</h3>
            <p>Approved and handed to development before I left in January 2026.</p>
          </li>
        </ul>
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="cp-differently">
        <h2 id="cp-differently" className="cp-h cp-reveal">
          What I’d do differently
        </h2>
        <p className="cp-reveal">Agree on success metrics with the PM before starting:</p>
        <ul className="cp-list cp-reveal">
          <li>
            <span className="cp-runin">Desktop:</span> steps and time for common actions, and weekly active users.
          </li>
          <li>
            <span className="cp-runin">Rewards:</span> how many people open quests, start one, finish it and
            top&nbsp;up.
          </li>
          <li>
            <span className="cp-runin">Guardrail:</span> rewards farmed by bots and duplicate accounts.
          </li>
        </ul>
      </section>

      {/* --- where to get it ----------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-links">
        <h2 id="cp-links" className="cp-h cp-reveal">
          Links
        </h2>
        <ul className="cp-links">
          {chumsLinks.map((link) => (
            <li key={link.href} className="cp-reveal">
              <a className="cp-link" href={link.href} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export: next/image adds nothing here */}
                <img className="cp-link__icon" src={link.icon} alt="" width={28} height={28} />
                <span>{link.label}</span>
                <RowChevron className="cp-link__chevron" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="cp-end cp-col cp-reveal">
        <BackLink onBack={onBack} backHref={backHref} className="cp-end__link">
          <span className="cp-end__disc glass-disc" aria-hidden="true">
            <ButtonChevron className="cp-chevron-left" />
          </span>
          <span>Back to all work</span>
        </BackLink>
      </footer>
    </article>
  );
}
