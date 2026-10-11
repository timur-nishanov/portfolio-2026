'use client';

import { useRef } from 'react';
import { chumsMedia as media } from '@/data/chumsCase';
import { ButtonChevron } from '@/components/header/menu/icons';
import { BackLink } from './BackLink';
import { BeforeAfter, BeforeGalleryAfter, Chapter, Fold, PhoneGallery, ReadMore, useReveal } from './blocks';
import type { ArticleProps } from './registry';

// "6 steps to 1" never breaks across lines (as in the card's notes). The
// compound words below are tied with non-breaking hyphens (&#8209;) for the
// same reason: on a phone "top-up" broke as "top-/up".
const SIX_TO_ONE = '6 steps to 1';

/**
 * The Chums case study. One narrow column of text with a single left edge,
 * in four sizes, and the media running wider than it on the same centre line.
 * Every chapter shows its problem and what was done; how it was done waits
 * behind one "Read more".
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
          I led design at Chums, a messenger built on the open Matrix protocol, with tokens, NFTs, domains and dApps
          inside the chat. It already had 32k+ wallets and more than $200k in user balances. My job was not to add
          features. It was to make what already existed easy to find and use.
        </p>

        {/* The facts, two by two under a hairline, in the notes' type. One
            block, so the hairline comes in with them. */}
        <dl className="cp-meta cp-reveal">
          <div>
            <dt>Product</dt>
            <dd>
              <ul>
                <li>Messenger + Web3 wallet, desktop and mobile</li>
                <li>10k downloads</li>
                <li>32k+ wallets (one user can hold several)</li>
                <li>$200k+ in user balances</li>
              </ul>
            </dd>
          </div>
          <div>
            <dt>Goal</dt>
            <dd>Get more people to use the wallet inside the chat and top it up.</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>
              <ul>
                <li>Concept in 2024</li>
                <li>Design lead in 2025</li>
              </ul>
            </dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>
              <ul>
                <li>Founders</li>
                <li>Product Manager</li>
                <li>Art Director</li>
                <li>1 developer</li>
                <li>Me, Senior Product Designer and design lead, with a junior designer I mentored day to day</li>
              </ul>
            </dd>
          </div>
        </dl>
        <p className="cp-note cp-reveal">
          Chums was a client of the studio I worked at. I led its design alongside other studio projects.
        </p>
      </div>

      {/* --- the concept --------------------------------------------------- */}
      <Chapter aria-labelledby="cp-concept">
        <div className="cp-col">
          <p className="cp-label cp-reveal">Concept</p>
          <h2 id="cp-concept" className="cp-h cp-reveal">
            Give Chums its own look and flow
          </h2>
          <p className="cp-reveal">
            The app looked like any other messenger. You picked a server once at sign&#8209;in, so moving between
            communities was slow. In early 2024 I designed a new concept for Chums: the key mobile screens and the Web3
            entry points.
          </p>
          <Fold>
            <p>
              I explored a few directions, we picked one together, and I refined it. The art director reviewed the work
              a couple of times.
            </p>
            <p>
              On Matrix every community can have its own server, so switching servers is a core action. And the wallet
              is the reason Chums exists. The concept changed four things:
            </p>
            <ul className="cp-list">
              <li>Servers sit in a row at the top, like stories. Switching takes one tap.</li>
              <li>
                Signing in to a new server happens in a sheet over the chat list, with your accounts ready to pick.
              </li>
              <li>
                Direct messages and server spaces are clearly separated. You always know where a conversation lives.
              </li>
              <li>
                Sending coins sits in the attachment menu, next to photos and files. Money is part of the conversation,
                not a separate app.
              </li>
            </ul>
            <p>
              The founders liked the concept. When the product’s designer left, they asked me to lead design, with a
              junior designer to mentor.
            </p>
          </Fold>
          <ReadMore className="cp-reveal" />
        </div>

        <div className="cp-wide">
          <BeforeAfter before={media.concept.before} after={media.concept.after} />
        </div>
      </Chapter>

      {/* --- desktop ------------------------------------------------------- */}
      <Chapter aria-labelledby="cp-desktop">
        <div className="cp-col">
          <p className="cp-label cp-reveal">Desktop</p>
          <h2 id="cp-desktop" className="cp-h cp-reveal">
            Treat the desktop client as one product problem
          </h2>
          <p className="cp-reveal">
            The desktop client was a mobile layout stretched across a big window. It broke on resize, and simple actions
            covered the whole conversation. We treated the client as one problem and turned the fixes into three rules.
          </p>

          {/* The rules are the idea itself, so their names stay; what each
              one changed opens under it. */}
          <ol className="cp-rules">
            <li className="cp-rule cp-reveal">
              <span className="cp-rule__no">1</span>
              <div>
                <h3 className="cp-rule__title">Keep the conversation in view</h3>
                <Fold>
                  <ul className="cp-list">
                    <li>
                      Replaced the full&#8209;screen contact picker with a compact modal. The chat stays in context.
                    </li>
                    <li>Replaced the full&#8209;width emoji panel with a compact popover.</li>
                  </ul>
                </Fold>
              </div>
            </li>
            <li className="cp-rule cp-reveal">
              <span className="cp-rule__no">2</span>
              <div>
                <h3 className="cp-rule__title">Design for a pointer and a resizable window</h3>
                <Fold>
                  <ul className="cp-list">
                    <li>Defined how panels resize, collapse and adapt to window size.</li>
                    <li>
                      Added drag&#8209;and&#8209;drop and native context menus. Attaching a file went from {SIX_TO_ONE}.
                    </li>
                    <li>Softened outgoing message bubbles. On a wide screen they were too loud.</li>
                    <li>Rebuilt the wallet screens for desktop. They had been stretched straight from mobile.</li>
                  </ul>
                </Fold>
              </div>
            </li>
            <li className="cp-rule cp-reveal">
              <span className="cp-rule__no">3</span>
              <div>
                <h3 className="cp-rule__title">Explain anything that can cost people their money</h3>
                <Fold>
                  <ul className="cp-list">
                    <li>
                      Turned an unexplained recovery&#8209;key form into a guided onboarding step. The key is how you
                      get back into your account and your wallet after losing a device. The old form never said so.
                    </li>
                  </ul>
                </Fold>
              </div>
            </li>
          </ol>
          <Fold>
            <p>
              Desktop problems came from two audits, the PM’s and mine. By May 2025, desktop was the most obvious
              problem in both audits. We didn’t file fifty tickets.
            </p>
            <p>
              I packaged the audit into one proposal. The founders and the PM approved it within a week. With one
              developer, we had to cut. A full wallet redesign was the first to go: the wallet worked, the problem was
              getting to it. Some interaction details went too. We rebuilt the client around the three rules and put the
              new patterns into the design system instead of patching screens one by one. The first beta shipped three
              months after approval, then went through several rounds of iteration.
            </p>
          </Fold>
          <ReadMore className="cp-reveal" />
        </div>

        <div className="cp-wide">
          <BeforeGalleryAfter before={media.desktop.before} after={media.desktop.after} />
        </div>
      </Chapter>

      {/* --- rewards ------------------------------------------------------- */}
      <Chapter aria-labelledby="cp-rewards">
        <div className="cp-col">
          <p className="cp-label cp-reveal">Rewards</p>
          <h2 id="cp-rewards" className="cp-h cp-reveal">
            Make Web3 rewards easier to find and understand
          </h2>
          <p className="cp-reveal">
            Quests and wallet rewards were rough and hard to find. Nobody could see the payout before starting. We built
            the flow around a clear entry point, reward amounts shown up front, visible progress and rules explained
            inside the flow.
          </p>
          {/* Last in it, the passage whose colon points at the moments. */}
          <Fold>
            <p>
              The PM came with an idea: XP for messenger actions, like creating a room, plus time&#8209;limited quests
              from Venom, a blockchain network Chums worked with, all in one achievement system. The existing quests
              were just another room in the chat list, set up by hand. It wasn’t clear how they related to Venom or why
              anyone should do them.
            </p>
            <p>
              The junior designer got the brief. Before drawing anything, we took it apart: wrote down how we understood
              it, listed the open questions and synced with the PM.
            </p>
            <ul className="cp-list">
              <li>What problem are we solving?</li>
              <li>What does the user get at the end?</li>
              <li>Do points live in Chums or on Venom’s side?</li>
              <li>Is there an agreement with Venom to host their quests?</li>
              <li>Which metric should move: retention, top&#8209;ups or something else?</li>
              <li>Where do rooms come from, and who creates them?</li>
            </ul>
            <p>
              The PM had the idea but not the answers, so we worked them out together. The way the system works is what
              we came up with. Only then did we look at benchmarks.
            </p>
            <p>
              Rewards exist to get people to top up their wallets. If you can’t see what a top&#8209;up gets you, you
              don’t make one. A task can be simple and the reward valuable, but it doesn’t matter if people have to
              start before they know the payoff.
            </p>
            <p>
              We studied Matrix clients, Telegram (especially on desktop), Discord and Family. Instead of comparing
              feature lists, we looked at three moments where quests and rewards either work or fall apart:
            </p>
          </Fold>
          <ReadMore className="cp-reveal" />
        </div>

        {/* Three equal tiles in a row, in the order they happen: outlines
            for the first two, ink for the one that became the constraint. */}
        <figure className="cp-wide">
          <ol className="cp-moments">
            <li className="cp-moment cp-reveal">
              <span className="cp-moment__label">Discovery</span>
              <span className="sr-only"> — </span>
              <p className="cp-moment__q">can users find the feature without being told where it is?</p>
            </li>
            <li className="cp-moment cp-reveal">
              <span className="cp-moment__label">Comprehension</span>
              <span className="sr-only"> — </span>
              <p className="cp-moment__q">can they understand the rules inside the flow?</p>
            </li>
            <li className="cp-moment cp-moment--key cp-reveal">
              <span className="cp-moment__label">Payout visibility</span>
              <span className="sr-only"> — </span>
              <p className="cp-moment__q">do they know what they’ll get before committing?</p>
            </li>
          </ol>
          <figcaption className="cp-cap cp-reveal">The third one became our main constraint.</figcaption>
        </figure>

        <figure className="cp-wide">
          <PhoneGallery slots={media.rewards} />
          <figcaption className="cp-cap cp-reveal">
            The junior designer produced the screens. I directed the work and pointed out where things could be clearer
            and cleaner.
          </figcaption>
        </figure>
      </Chapter>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <h2 id="cp-landed" className="cp-h cp-reveal">
          Where it landed
        </h2>
        <ul className="cp-outcomes">
          <li className="cp-reveal">
            <span className="cp-runin">Concept:</span> not shipped as one release. We moved the product toward it piece
            by piece, like smaller avatars in the chat list and the rebuilt desktop.
          </li>
          <li className="cp-reveal">
            <span className="cp-runin">Desktop:</span> approved in a week, in beta three months later. Attaching a file
            went from {SIX_TO_ONE}. The responsive rules and desktop patterns live in the design system now.
          </li>
          <li className="cp-reveal">
            <span className="cp-runin">Rewards:</span> approved and handed to development before I left the studio in
            January 2026.
          </li>
        </ul>
      </section>

      {/* Short enough to read whole: its leads mirror the outcomes above. */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-differently">
        <h2 id="cp-differently" className="cp-h cp-reveal">
          What I’d do differently
        </h2>
        <p className="cp-reveal">I’d agree on success metrics with the PM before starting.</p>
        <p className="cp-reveal">
          <span className="cp-runin">For desktop:</span> steps and time for the most common actions, weekly active
          desktop users, and how many come back the next week.
        </p>
        <p className="cp-reveal">
          <span className="cp-runin">For rewards:</span> the share of wallet holders who open quests, how many start a
          quest after seeing the payout, how many finish, and how many make their first top&#8209;up after one.
        </p>
        <p className="cp-reveal">
          <span className="cp-runin">Plus one guardrail:</span> rewards farmed by bots and duplicate accounts.
        </p>
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
