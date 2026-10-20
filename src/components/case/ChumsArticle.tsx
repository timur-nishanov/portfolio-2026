'use client';

import { useRef } from 'react';
import { chumsLinks, chumsMedia as media } from '@/data/chumsCase';
import { RowChevron } from '@/components/header/menu/icons';
import { BeforeAfter, Facts, Figure, Heading, Mark, Results, useReveal } from './blocks';
import { CaseIndex } from './CaseIndex';
import { GlassOrbs } from './GlassOrbs';
import { QuestBoard } from './QuestBoard';
import type { ArticleProps } from './registry';

const INDEX = [
  { id: 'cp-01', label: 'Make switching servers easy' },
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
 * where there is room.
 */
export function ChumsArticle({ onBack, backHref }: ArticleProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <article ref={ref} className="cp-article">
      <CaseIndex items={INDEX} onBack={onBack} backHref={backHref} />

      {/* --- overview ---------------------------------------------------- */}
      <div className="cp-col cp-intro">
        <h1 className="cp-title cp-reveal">Chums</h1>
        <p className="cp-subtitle cp-reveal">Making a Web3 messenger easier to use</p>
        <p className="cp-reveal">
          For a year I led design at Chums, a messenger on the open Matrix protocol with crypto wallets, NFTs, domains
          and dApps built into the chat. <Mark>32k+ wallets, $200k+ in user balances.</Mark>
        </p>
        <p className="cp-reveal">
          Chums already had plenty of features. Most of my job was making them easy to find and easy to use.
        </p>
        <Facts
          items={[
            ['Role', 'Product Design Lead'],
            ['Team', 'Founders, PM, art director, one developer, junior designer'],
            ['Timeline', 'Concept in 2024 · Design lead in 2025'],
            ['Outcome', 'Desktop beta in three months · attaching a file went from six steps to one'],
          ]}
        />
        <p className="cp-reveal">Chums was a client of the studio I worked at.</p>
      </div>

      {/* --- 01 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-01">
        <Heading id="cp-01">Make switching servers easy</Heading>
        <p className="cp-reveal">
          On Matrix, every community can run its own server. In Chums you picked a server once, when you signed in, and
          switching later was slow.
        </p>
        <p className="cp-reveal">In early 2024 I designed a concept for the main mobile screens:</p>
        <ul className="cp-list cp-list--short cp-reveal">
          <li>Servers at the top, one tap to switch.</li>
          <li>Signing in happens in a sheet, so you join a server without leaving the chat list.</li>
          <li>Direct messages kept apart from server spaces, so you always know where a chat lives.</li>
          <li>Coins in the attachment menu, right next to photos and files.</li>
        </ul>
        <BeforeAfter {...media.concept} frame="stage" />
        <p className="cp-reveal">
          The founders approved it. Then the product’s designer left, and I took over design, with a junior designer to
          mentor.
        </p>
        <p className="cp-reveal">
          The concept itself didn’t ship as designed. The server flow stayed the same, and only the look reached the
          product, piece by piece. That one stung.
        </p>
      </section>

      {/* --- 02 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-02">
        <Heading id="cp-02">Make desktop work like desktop</Heading>
        <p className="cp-reveal">
          The PM and I audited the desktop app separately and came back with the same verdict: it was the phone app,
          stretched across a big window.
        </p>
        <p className="cp-reveal">
          Contacts used to open in a full window. Now they open in a small one over the chat, so you don’t lose the
          conversation.
        </p>
        <BeforeAfter {...media.contacts} frame="stage" />
        <p className="cp-reveal">
          The emoji panel used to cover the whole window. Now it’s a small window above the message field.
        </p>
        <BeforeAfter {...media.emoji} frame="stage" />
        <p className="cp-reveal">
          Attaching a file took six steps. <Mark>Now you drag it into the chat.</Mark>
        </p>
        <Figure slot={media.drag} frame="stage" />
        <p className="cp-reveal">
          The attach button stayed too, for people who don’t drag. It opens a small window with your pictures and
          recent files.
        </p>
        <Figure slot={media.attach} frame="stage" />
        <p className="cp-reveal">
          For window sizes from 1300 to 375px we set rules: the chat list keeps its width, the chat stretches, and a
          narrow window becomes one column.
        </p>
        <Figure slot={media.resize} frame="stage" />
        <p className="cp-reveal">
          The wallet was designed before us, so we didn’t redesign it. We taught it to behave on desktop: a popup in a
          wide window, a full screen in a narrow one.
        </p>
        <Figure slot={media.wallet} frame="stage" />
        <p className="cp-reveal">
          The founders and the PM approved the plan within a week. With one developer on the whole app, some details
          had to wait. <Mark>The first beta shipped three months later</Mark>, and the new patterns went into the design
          system.
        </p>
      </section>

      {/* --- 03 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-03">
        <Heading id="cp-03">Give every AI request its own thread</Heading>
        <p className="cp-reveal">
          Chums was testing an AI assistant in group chats: you mention it and give it a task. Now picture a group of
          twelve where one person is planning a meeting with a bot, and everyone else gets every message.
        </p>
        <p className="cp-reveal">So every request opens its own thread, which Chums calls a discussion:</p>
        <ul className="cp-list cp-list--short cp-reveal">
          <li>You call the assistant with @, like any other member.</li>
          <li>The answer stays in the thread. The chat shows one line and a counter.</li>
          <li>All threads of a room live in one list.</li>
        </ul>
        <Figure slot={media.assistant} frame="stage" />
      </section>

      {/* --- 04 ------------------------------------------------------------ */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-04">
        <Heading id="cp-04">Turn a vague brief into a rewards system</Heading>
        <p className="cp-reveal">
          The brief fit in one line: XP for activity in the messenger, plus quests with a deadline from Venom, a
          blockchain network Chums worked with.
        </p>
        <p className="cp-reveal">
          The old quests were rooms in the chat list, set up by hand. Nothing said what they were for or what you’d
          get. So before drawing anything, we sat down with the PM and asked the awkward questions, like “Why do quests
          at all?”
        </p>
        <QuestBoard />
        <p className="cp-reveal">
          Then we looked at how Matrix clients, Telegram, Discord and the Family wallet handle this, and built the
          screens around three questions.
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
          The junior designer drew the screens, and I directed the work. The system was{' '}
          <Mark>approved and handed to development</Mark> before I left the studio in January&nbsp;2026.
        </p>
        <Figure slot={media.rewards} frame="stage" />
      </section>

      {/* --- outcome ------------------------------------------------------- */}
      <section className="cp-chapter cp-col" aria-labelledby="cp-landed">
        <Heading id="cp-landed">Where it landed</Heading>
        <Results
          items={[
            ['Concept', 'Approved. Only the look reached the product; the server flow stayed.'],
            ['Desktop', 'In beta three months after approval.'],
            ['Assistant', 'Designed for desktop and mobile.'],
            ['Rewards', 'Approved and handed to development.'],
          ]}
        />
      </section>

      <section className="cp-chapter cp-col" aria-labelledby="cp-differently">
        <Heading id="cp-differently">What I’d do differently</Heading>
        <p className="cp-reveal">
          Agree on metrics with the PM before the first mockup. I can tell you attaching a file went from six steps to
          one, but not how many people noticed. For desktop I’d track steps and time for common actions. For rewards,
          how many people start a quest and how many finish.
        </p>
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
