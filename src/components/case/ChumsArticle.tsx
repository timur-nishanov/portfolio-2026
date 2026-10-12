'use client';

import { useRef } from 'react';
import { chumsLinks, chumsMedia as media } from '@/data/chumsCase';
import { RowChevron } from '@/components/header/menu/icons';
import { BeforeAfter, Figure, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import { GlassOrbs } from './GlassOrbs';
import { QuestBoard } from './QuestBoard';
import type { ArticleProps } from './registry';

/** A part's heading: the text's size in semibold ink, with a faint rule
    running out to the column's edge (as benji.org heads a section). */
function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="cp-h cp-reveal">
      <span className="cp-h__name">{children}</span>
    </h2>
  );
}

/** A phrase the case turns on, marked as with a highlighter. */
function Mark({ children }: { children: React.ReactNode }) {
  return <mark className="cp-mark">{children}</mark>;
}

const INDEX = [
  { id: 'cp-01', label: 'Give Chums its own flow' },
  { id: 'cp-02', label: 'Make desktop work like desktop' },
  { id: 'cp-03', label: 'Give every AI request its own thread' },
  { id: 'cp-04', label: 'Turn a vague brief into a rewards system' },
  { id: 'cp-landed', label: 'Where it landed' },
  { id: 'cp-differently', label: 'What I’d do differently' },
  { id: 'cp-links', label: 'Links' },
];

/**
 * The Chums case study, laid out as benji.org lays out a case: one narrow
 * column, a few lines at a time, with the pictures between them in the same
 * column, before over after; the way back and the chapters down the left
 * where there is room. Nothing rules the parts apart: the room between them
 * does.
 */
export function ChumsArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Chums Messenger</h1>
        <p className="cp-subtitle cp-reveal">Making a Web3 messenger easier to use</p>
        <p className="cp-reveal">
          I led design at Chums, a messenger on the open Matrix protocol with crypto wallets, NFTs, domains and dApps
          built into the chat. It had <Mark>32k+ wallets and $200k+ in user balances</Mark>. Most of the work wasn’t
          new features. It was making the existing ones easier to use.
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
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Give Chums its own flow</Heading>
        <p className="cp-reveal">
          On Matrix, every community can have its own server. In Chums you could pick a server only when signing in, so
          switching was slow.
        </p>
        <p className="cp-reveal">In early 2024 I designed a concept for the main mobile screens:</p>
        <ul className="cp-list cp-reveal">
          <li>Servers at the top. Switch in one tap.</li>
          <li>Sign&#8209;in in a sheet. Join a server without leaving the chat list.</li>
          <li>Direct messages apart from server spaces. You see where a chat lives.</li>
          <li>Coins in the attachment menu, next to photos and files.</li>
        </ul>
        <BeforeAfter {...media.concept} frame="phone" />
        <p className="cp-reveal">
          The founders approved it. When the product’s designer left, I took over design and got a junior designer to
          mentor.
        </p>
        <p className="cp-reveal">
          The server flow stayed the same: you still pick a server at the start. Only the look reached the product, in
          small steps.
        </p>
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Make desktop work like desktop</Heading>
        <p className="cp-reveal">
          The PM and I each audited the desktop app. We found the same thing: it was the mobile app stretched across a
          big window.
        </p>
        <h3 className="cp-sub cp-reveal">Keep the chat in view</h3>
        <p className="cp-reveal">Contacts used to open in a full window. Now it’s a small window over the chat.</p>
        <BeforeAfter {...media.contacts} frame="desktop" />
        <p className="cp-reveal">
          Emoji used to open as a panel across the whole window. Now it’s a small window above the message field.
        </p>
        <BeforeAfter {...media.emoji} frame="desktop" />
        <h3 className="cp-sub cp-reveal">Mouse and window size</h3>
        <p className="cp-reveal">
          Attaching a file took six steps. <Mark>Now you drag it into the chat.</Mark>
        </p>
        <Figure slot={media.drag} frame="desktop" />
        <p className="cp-reveal">
          We set rules for window sizes from 1300 to 375px: the chat list keeps its width, the chat stretches, and a
          narrow window shows one column.
        </p>
        <Figure slot={media.resize} frame="desktop" />
        <p className="cp-reveal">
          The wallet was designed before us. We fitted it to desktop: a popup in a wide window, a full screen in a
          narrow one.
        </p>
        <Figure slot={media.wallet} frame="desktop" />
        <p className="cp-reveal">
          The founders and the PM approved the plan within a week. We had one developer, so some details had to wait.{' '}
          <Mark>The first beta shipped three months later.</Mark> The new patterns went into the design system.
        </p>
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Give every AI request its own thread</Heading>
        <p className="cp-reveal">
          Chums was trying out an AI assistant in group chats. You mention it and give it a task. That gets noisy: one
          person’s chat with a bot fills everyone’s feed.
        </p>
        <p className="cp-reveal">So every request opens its own thread. Chums calls it a discussion.</p>
        <ul className="cp-list cp-reveal">
          <li>You call the assistant with @, like any member.</li>
          <li>The answer stays in the thread. The chat shows one line and a counter.</li>
          <li>All threads of a room are in one list.</li>
        </ul>
        <Figure slot={media.assistant} frame="phone" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Turn a vague brief into a rewards system</Heading>
        <p className="cp-reveal">
          The PM wanted XP for activity in the messenger, plus time&#8209;limited quests from Venom, a blockchain
          network Chums worked with.
        </p>
        <p className="cp-reveal">
          The old quests were rooms in the chat list, set up by hand. Nothing said what they were for or what you’d
          get. First we went through the open questions with the PM and mapped how the system should work.
        </p>
        <QuestBoard />
        <p className="cp-reveal">
          We also looked at how Matrix clients, Telegram, Discord and Family do it. Then we built the screens around
          three questions.
        </p>
        <GlassOrbs
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
        <p className="cp-reveal">
          The junior designer made the screens, I directed the work. The system was{' '}
          <Mark>approved and handed to development</Mark> before I left the studio in January&nbsp;2026.
        </p>
        <Figure slot={media.rewards} frame="phone" />
      </section>

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
          <li>For desktop: steps and time for common actions.</li>
          <li>For rewards: how many people start a quest and how many finish.</li>
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
                <img className="cp-link__icon" src={link.icon} alt="" width={24} height={24} />
                <span>{link.label}</span>
                <RowChevron className="cp-link__chevron" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
