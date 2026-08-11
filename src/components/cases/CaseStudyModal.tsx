'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Case } from '@/data/cases';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Props = { data: Case; open: boolean; onClose: () => void };
type PlaceholderProps = { label: string; caption?: string; ratio?: string; className?: string };

function MediaPlaceholder({ label, caption, ratio = '4/3', className = '' }: PlaceholderProps) {
  return (
    <figure className={className}>
      <div className="case-media-placeholder" style={{ aspectRatio: ratio }}>
        <div className="flex flex-col items-center gap-3 text-white/40">
          <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className="size-8 md:size-10" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="7" width="38" height="34" rx="4" />
            <circle cx="17" cy="18" r="4" />
            <path d="m8 36 10-10 7 7 5-5 10 8" />
          </svg>
          <span className="case-kicker text-white/40">{label}</span>
        </div>
      </div>
      {caption ? <figcaption className="case-caption">{caption}</figcaption> : null}
    </figure>
  );
}

/** A desktop before/after row: two halves on the 8px gutter, one caption. */
function MediaPair({ caption, labels }: { caption: string; labels: [string, string] }) {
  return (
    <figure>
      <div className="case-pair">
        <MediaPlaceholder label={labels[0]} ratio="695/624" />
        <MediaPlaceholder label={labels[1]} ratio="695/624" />
      </div>
      <figcaption className="case-caption">{caption}</figcaption>
    </figure>
  );
}

function MagneticPoint({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  // Deliberately faint pull — the balls should lean toward the cursor, not chase it.
  useMagnetic(rootRef, [{ ref: ballRef, factor: 0.045, max: 12 }], canHover && !reduced);

  return (
    <div ref={rootRef} className={`case-point-anchor ${className}`}>
      <div ref={ballRef} className="case-point glass-ball will-change-transform">
        <p className="case-point-title">{title}</p>
        <p className="case-point-copy">{children}</p>
      </div>
    </div>
  );
}

const details = [
  ['PROBLEMS', 'Chums combines private messaging with a built-in crypto wallet. Users can chat, send assets and interact with Web3 services without switching to a separate wallet app. The technology was there, but two important parts of the experience were getting in its way. The desktop client reused mobile patterns that did not adapt to a larger, resizable window. At the same time, the reward system designed to encourage wallet activity was difficult to find and did not communicate its value clearly.'],
  ['PRODUCT', 'Messenger + Web3 wallet + desktop and mobile clients / 10k downloads across platforms · 32k+ wallets · $200k+ held in user balances'],
  ['GOAL 2025', 'Create a stronger visual direction, rebuild the desktop experience and make the Web3 reward layer easier to discover and understand.'],
  ['TEAM', 'Founders · Product Manager · Art Director · Me — Senior Product Designer, with a junior designer I mentored day to day · 2 Devs'],
];

export function CaseStudyModal({ data, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    closeTimer.current = window.setTimeout(() => {
      dialog.close();
      dialog.classList.remove('is-closing');
      onClose();
    }, 360);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      window.clearTimeout(closeTimer.current);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      // data-lenis-prevent: Lenis grabs wheel events at the window and feeds
      // them to the (locked) page scroll — this hands them back to the dialog,
      // which is the actual scroller while the case is open.
      data-lenis-prevent
      className="case-study-modal m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-white"
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      aria-labelledby={`${data.id}-case-title`}
    >
      <article className="case-study-sheet min-h-dvh">
        <button type="button" className="case-close glass-ball outline-none focus-visible:ring-1 focus-visible:ring-white/60" onClick={requestClose} aria-label="Close case study">×</button>

        <div className="case-wrap">
          <header>
            <h2 id={`${data.id}-case-title`} className="case-title">Chums Messenger</h2>
            <p className="case-lead mt-[calc(32*var(--cu))] max-w-[77.5%] max-md:max-w-none">
              I led the redesign of the desktop client and the Web3 reward experience for Chums — a Matrix-based messenger with tokens, NFTs, domains and dApps built directly into chat. The product already had 32k+ wallets and more than $200k held in user balances. My job was not to add more capability, but to make the existing product easier to reach, understand and use.
            </p>
          </header>

          <div className="case-details">
            {details.map(([label, copy]) => (
              <div key={label} className="case-detail-row">
                <p className="case-kicker">{label}</p>
                <p className="case-copy">{copy}</p>
              </div>
            ))}
          </div>

          <section className="case-section">
            <h3 className="case-heading">Define a new visual direction</h3>
            <p className="case-lead mt-[calc(32*var(--cu))]">I developed a new visual concept for Chums across its key mobile screens and Web3 entry points. Led the concept end to end, and the final direction shown in this case was approved by the CEO.</p>
            <div className="case-phones mt-[calc(96*var(--cu))]">
              {['ONBOARDING', 'MESSENGER', 'PROFILE', 'VOICE MESSAGE', 'SERVER PICKER', 'ATTACHMENTS'].map((x) => (
                <MediaPlaceholder key={x} label={x} ratio="390/844" />
              ))}
            </div>
          </section>

          <section className="case-section">
            <h3 className="case-heading max-w-[64%] max-md:max-w-none">Treat the desktop client as one product problem</h3>
            <p className="case-lead mt-[calc(32*var(--cu))] max-w-[96.5%]">By May 2025, the desktop client still behaved like a mobile app stretched across a larger window. Layouts broke when resized, pointer states were missing, and simple actions often replaced the entire conversation. Take a look on some of them:</p>
            <div className="mt-[calc(64*var(--cu))] flex flex-col gap-[calc(40*var(--cu))]">
              <MediaPair labels={['BEFORE · CONTACTS', 'AFTER · CONTACTS']} caption="Replaced a full-screen contact picker with a compact modal that keeps the chat in context." />
              <MediaPair labels={['BEFORE · RECOVERY KEY', 'AFTER · RECOVERY KEY']} caption="Turned an unexplained recovery-key form into a guided onboarding step with clear context and action." />
              <MediaPair labels={['BEFORE · MESSAGES', 'AFTER · MESSAGES']} caption="Softened outgoing message bubbles to improve readability and reduce visual noise." />
              <MediaPair labels={['BEFORE · EMOJI', 'AFTER · EMOJI']} caption="Replaced the full-width emoji panel with a compact popover that keeps the conversation visible." />
              <MediaPlaceholder label="RESPONSIVE DESKTOP" ratio="1397/624" caption="Defined responsive rules for how panels resize, collapse and adapt across different window sizes." />
            </div>
            <p className="case-lead mt-[calc(64*var(--cu))] max-w-[96.5%]">I packaged the findings into a single proposal, which the founders and Product Manager approved within a week. Over the six months, we rebuilt the client around responsive rules, desktop-native interactions and reusable patterns added back to the design system. The new version shipped to beta and went through several rounds of iteration.</p>
          </section>

          <section className="case-section">
            <h3 className="case-heading max-w-[72.5%] max-md:max-w-none">Make Web3 rewards easier to find and understand</h3>
            <p className="case-lead mt-[calc(32*var(--cu))] max-w-[96.5%]">Chums already had quests and wallet rewards, but users struggled to find the feature, understand the tasks and see the payout before starting. I led the benchmark study, defined the product direction and guided a junior designer through the execution.</p>
            <div className="case-phones mt-[calc(96*var(--cu))]" style={{ '--phone-gap': 140 } as React.CSSProperties}>
              {['CHAT LIST', 'QUESTS', 'STATS', 'ERROR STATE', 'WALLET ONBOARDING', 'QUESTS COMPLETE'].map((x) => (
                <MediaPlaceholder key={x} label={x} ratio="360/812" />
              ))}
            </div>
            <p className="case-lead mt-[calc(52*var(--cu))] max-w-[96.5%]">We built the experience around a clear entry point, upfront reward amounts, visible progress and rules explained directly inside the flow. I reviewed the scenarios and key design decisions throughout the process. The final concept was approved and moved into development.</p>
            <p className="case-lead mt-[calc(40*var(--cu))] max-w-[96.5%]">Instead of comparing feature lists, we mapped how each product handled the three moments where the experience either worked or fell apart:</p>
            <div className="case-points mt-[calc(64*var(--cu))]">
              <MagneticPoint title="DISCOVERY" className="case-point-a">can users find the feature without being taught where it is?</MagneticPoint>
              <MagneticPoint title="COMPREHENSION" className="case-point-b">can they understand the rules inside the flow?</MagneticPoint>
              <MagneticPoint title="PAYOUT VISIBILITY" className="case-point-c">do they know what they will receive before committing?</MagneticPoint>
            </div>
            <p className="case-lead mt-[calc(64*var(--cu))] max-w-[96.5%]">The third moment became our main design constraint.</p>
            <p className="case-lead mt-[calc(40*var(--cu))] max-w-[96.5%]">A task could be simple and the reward could be valuable, but neither mattered if users had to begin before understanding the payoff.</p>
          </section>

          <section className="case-section">
            <h3 className="case-heading">What shipped</h3>
            <p className="case-lead mt-[calc(32*var(--cu))] max-w-[96.5%]">The new visual direction was approved by the CEO. The desktop redesign was scoped and approved in one week, then shipped to beta three months later. We added responsive layouts, clearer desktop interactions and reusable patterns to the design system. The new reward experience was approved and moved into development. For context, Chums had 32k+ wallets, ~10k downloads and more than $200k in user balances at the time.</p>
            <div className="case-phones mt-[calc(64*var(--cu))]" style={{ '--phone-gap': 136 } as React.CSSProperties}>
              {['GROUP CHAT', 'MESSAGES', 'MARKDOWN'].map((x) => (
                <MediaPlaceholder key={x} label={x} ratio="375/812" />
              ))}
            </div>
            <MediaPlaceholder label="GROUP CALL" ratio="900/700" className="mx-auto mt-[calc(136*var(--cu))] w-[64.3%] max-md:w-full" />
            <div className="case-phones mt-[calc(136*var(--cu))]" style={{ '--phone-gap': 136 } as React.CSSProperties}>
              {['CHAT INFO', 'REACTIONS', 'DONATIONS'].map((x) => (
                <MediaPlaceholder key={x} label={x} ratio="375/812" />
              ))}
            </div>
            <MediaPlaceholder label="BROWSER" ratio="900/716" className="mx-auto mt-[calc(136*var(--cu))] w-[64.3%] max-md:w-full" />
          </section>
        </div>
      </article>
    </dialog>
  );
}
