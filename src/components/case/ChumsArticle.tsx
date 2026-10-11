'use client';

import { useRef } from 'react';
import { chumsLinks, chumsMedia as media } from '@/data/chumsCase';
import { ButtonChevron, RowChevron } from '@/components/header/menu/icons';
import { BackLink } from './BackLink';
import { BeforeAfter, Chapter, Fold, Plate, ReadMore, useReveal } from './blocks';
import { Orbs } from './Orbs';
import { QuestMap } from './QuestMap';
import type { ArticleProps } from './registry';

/** A chapter's heading: its number in grey, then its name. */
function Heading({ id, no, children }: { id: string; no?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="cp-h cp-reveal">
      {no && <span className="cp-h__no">{no}</span>}
      {children}
    </h2>
  );
}

/**
 * The Chums case study. One narrow column of text with a single left edge,
 * and the media running wider than it on the same centre line. A hairline
 * between the big parts, unless one ends on a picture.
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
        <p className="cp-title cp-reveal">Chums Messenger</p>
        <p className="cp-subtitle cp-reveal">Making a Web3 messenger easier to use</p>
        <p className="cp-lead cp-reveal">
          I led design at Chums, a messenger on the open Matrix protocol with crypto wallets, NFTs, domains and dApps
          built into the chat. It had 32k+ wallets and $200k+ in user balances.
        </p>
        <p className="cp-lead cp-reveal">
          Most of the work wasn’t new features. It was making the existing ones easier to use.
        </p>
        <dl className="cp-facts cp-reveal">
          <div>
            <dt>Role</dt>
            <dd>Senior Product Designer & Design Lead</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>Founders, PM, Art Director, 1&nbsp;developer, junior designer</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>Concept in 2024 · Design lead in 2025</dd>
          </div>
        </dl>
        <p className="cp-note cp-reveal">
          Chums was a client of the studio I worked at. I led its design alongside other studio projects.
        </p>
      </div>

      <hr className="cp-divider" />

      {/* --- 01 ------------------------------------------------------------ */}
      <Chapter aria-labelledby="cp-01">
        <div className="cp-col">
          <Heading id="cp-01" no="01">
            Give Chums its own flow
          </Heading>
          <p className="cp-reveal">
            On Matrix, every community can have its own server. In Chums you could pick a server only when signing in,
            so switching was slow.
          </p>
          <p className="cp-reveal">In early 2024 I designed a concept for the main mobile screens:</p>
          <ul className="cp-list cp-reveal">
            <li>
              <span className="cp-runin">Servers at the top.</span> Switch in one tap.
            </li>
            <li>
              <span className="cp-runin">Sign&#8209;in in a sheet.</span> Join a server without leaving the chat list.
            </li>
            <li>
              <span className="cp-runin">Direct messages apart from server spaces.</span> You see where a chat lives.
            </li>
            <li>
              <span className="cp-runin">Coins in the attachment menu,</span> next to photos and files.
            </li>
          </ul>
        </div>
        <div className="cp-wide">
          <BeforeAfter {...media.concept} frame="phone" />
        </div>
        <div className="cp-col">
          <p className="cp-reveal">
            The founders approved it. When the product’s designer left, I took over design and got a junior designer to
            mentor.
          </p>
          <p className="cp-reveal">
            The server flow stayed the same: you still pick a server at the start. Only the look reached the product, in
            small steps.
          </p>
        </div>
      </Chapter>

      <hr className="cp-divider" />

      {/* --- 02 ------------------------------------------------------------ */}
      <Chapter aria-labelledby="cp-02">
        <div className="cp-col">
          <Heading id="cp-02" no="02">
            Make desktop work like desktop
          </Heading>
          <p className="cp-reveal">
            The PM and I each audited the desktop app. We found the same thing: it was the mobile app stretched across a
            big window.
          </p>
          <h3 className="cp-sub cp-reveal">Keep the chat in view</h3>
          <p className="cp-reveal">Contacts used to open in a full window. Now it’s a small window over the chat.</p>
        </div>
        <div className="cp-wide">
          <BeforeAfter {...media.contacts} frame="desktop" />
        </div>
        <div className="cp-col">
          <p className="cp-reveal">
            Emoji used to open as a panel across the whole window. Now it’s a small window above the message field.
          </p>
        </div>
        <div className="cp-wide">
          <BeforeAfter {...media.emoji} frame="desktop" />
        </div>
        <div className="cp-col">
          <h3 className="cp-sub cp-reveal">Mouse and window size</h3>
          <p className="cp-reveal">Attaching a file took six steps. Now you drag it into the chat.</p>
        </div>
        <div className="cp-wide">
          <Plate slots={[media.drag]} frame="desktop" />
        </div>
        <div className="cp-col">
          <p className="cp-reveal">
            We set rules for window sizes from 1300 to 375px: the chat list keeps its width, the chat stretches, and a
            narrow window shows one column.
          </p>
        </div>
        <div className="cp-wide">
          <Plate slots={[media.resize]} frame="desktop" />
        </div>
        {/* What came after, and the part that wasn't ours to design. */}
        <Fold>
          <div className="cp-col">
            <p>
              The wallet was designed before us. We fitted it to desktop: a popup in a wide window, a full screen in a
              narrow one.
            </p>
          </div>
          <div className="cp-wide">
            <Plate slots={[media.wallet]} frame="desktop" />
          </div>
          <div className="cp-col">
            <p>
              The founders and the PM approved the plan within a week. We had one developer, so some details had to
              wait. The first beta shipped three months later. The new patterns went into the design system.
            </p>
          </div>
        </Fold>
        <div className="cp-col">
          <ReadMore className="cp-reveal" />
        </div>
      </Chapter>

      <hr className="cp-divider" />

      {/* --- 03 ------------------------------------------------------------ */}
      <Chapter aria-labelledby="cp-03">
        <div className="cp-col">
          <Heading id="cp-03" no="03">
            Give every AI request its own thread
          </Heading>
          <p className="cp-reveal">
            Chums was trying out an AI assistant in group chats. You mention it and give it a task. In a group this gets
            noisy: one person’s chat with a bot fills everyone’s feed.
          </p>
          <p className="cp-reveal">So every request opens its own thread. Chums calls it a discussion.</p>
          <ul className="cp-list cp-reveal">
            <li>You call the assistant with @, like any member.</li>
            <li>The answer stays in the thread. The chat shows one line and a counter.</li>
            <li>All threads of a room are in one list.</li>
          </ul>
        </div>
        <div className="cp-wide">
          <Plate slots={media.assistant} frame="phone" />
        </div>
        <div className="cp-col">
          <p className="cp-reveal">The junior designer designed the flow, I reviewed it.</p>
        </div>
      </Chapter>

      <hr className="cp-divider" />

      {/* --- 04 ------------------------------------------------------------ */}
      <Chapter aria-labelledby="cp-04">
        <div className="cp-col">
          <Heading id="cp-04" no="04">
            Turn a vague brief into a rewards system
          </Heading>
          <p className="cp-reveal">
            The PM wanted XP for activity in the messenger, plus time&#8209;limited quests from Venom, a blockchain
            network Chums worked with. The old quests were rooms in the chat list, set up by hand. Nothing said what
            they were for or what you’d get.
          </p>
          <p className="cp-reveal">
            First we went through the open questions with the PM and mapped how the system should work.
          </p>
        </div>
        <div className="cp-wide">
          <QuestMap />
        </div>
        <div className="cp-col">
          <p className="cp-reveal">
            We also looked at how Matrix clients, Telegram, Discord and Family do it. Then we built the screens around
            three questions.
          </p>
        </div>
        <div className="cp-wide">
          <Orbs
            items={[
              { title: 'Can people find it?', text: 'Quests moved from the chat list to the Explore tab.' },
              {
                title: 'Do they get the rules?',
                text: 'Every screen starts with a short explanation, and a checklist walks you through the first steps.',
              },
              {
                title: 'Do they know what they’ll earn?',
                text: 'One screen shows your points, the time left in the season and what each room gives.',
              },
            ]}
          />
        </div>
        <div className="cp-wide">
          <Plate slots={media.rewards} frame="phone" />
        </div>
        <div className="cp-col">
          <p className="cp-reveal">
            The junior designer made the screens, I directed the work. The system was approved and handed to development
            before I left the studio in January 2026.
          </p>
        </div>
      </Chapter>

      <hr className="cp-divider" />

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        <ul className="cp-results">
          <li className="cp-reveal">
            <h3 className="cp-result__title">Concept</h3>
            <p>Approved. Only the look reached the product, the server flow stayed the same.</p>
          </li>
          <li className="cp-reveal">
            <h3 className="cp-result__title">Desktop</h3>
            <p>In beta three months after approval. Attaching a file went from six steps to one.</p>
          </li>
          <li className="cp-reveal">
            <h3 className="cp-result__title">Assistant</h3>
            <p>Designed for desktop and mobile.</p>
          </li>
          <li className="cp-reveal">
            <h3 className="cp-result__title">Rewards</h3>
            <p>Approved and handed to development.</p>
          </li>
        </ul>
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="cp-differently">
        <Heading id="cp-differently">What I’d do differently</Heading>
        <p className="cp-reveal">Agree on metrics with the PM before starting.</p>
        <ul className="cp-list cp-reveal">
          <li>
            <span className="cp-runin">For desktop:</span> steps and time for common actions.
          </li>
          <li>
            <span className="cp-runin">For rewards:</span> how many people start a quest and how many finish.
          </li>
        </ul>
      </section>

      {/* --- where to get it ----------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-links">
        <Heading id="cp-links">Links</Heading>
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

      {/* The way back, on the centre line like the bar's title up top. */}
      <footer className="cp-end cp-reveal">
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
