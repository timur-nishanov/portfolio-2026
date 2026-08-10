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

function MagneticPoint({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();
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
  ['PROBLEMS', 'Chums combines private messaging with a built-in crypto wallet. Users can chat, send assets and interact with Web3 services without switching to a separate wallet app.\n\nThe technology was there, but two important parts of the experience were getting in its way. The desktop client reused mobile patterns that did not adapt to a larger, resizable window. At the same time, the reward system was difficult to find and did not communicate its value clearly.'],
  ['PRODUCT', 'Messenger + Web3 wallet · desktop and mobile clients / 10k downloads across platforms · 32k+ wallets · $200k+ held in user balances'],
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
      className="case-study-modal m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-transparent p-0 text-white"
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      aria-labelledby={`${data.id}-case-title`}
    >
      <article className="case-study-sheet min-h-dvh">
        <button type="button" className="case-close glass-ball outline-none focus-visible:ring-1 focus-visible:ring-white/60" onClick={requestClose} aria-label="Close case study">×</button>

        <div className="case-grid pt-[clamp(28px,2.5vw,36px)]">
          <header className="col-span-12">
            <h2 id={`${data.id}-case-title`} className="case-title">Chums Messenger</h2>
            <p className="case-lead mt-[clamp(28px,3.2vw,46px)] max-w-[1030px]">
              I led the redesign of the desktop client and the Web3 reward experience for Chums — a Matrix-based messenger with tokens, NFTs, domains and dApps built directly into chat.<br />
              The product already had 32k+ wallets and more than $200k held in user balances. My job was not to add more capability, but to make the existing product easier to reach, understand and use.
            </p>
          </header>

          <div className="col-span-12 mt-[clamp(96px,13vw,188px)] md:col-start-4 md:col-end-10">
            {details.map(([label, copy]) => (
              <div key={label} className="case-detail-row">
                <p className="case-kicker">{label}</p>
                <p className="case-copy whitespace-pre-line">{copy}</p>
              </div>
            ))}
          </div>

          <section className="case-section col-span-12">
            <h3 className="case-subtitle">Define a new visual direction</h3>
            <p className="case-copy mt-4 max-w-[1220px]">I developed a new visual concept for Chums across its key mobile screens and Web3 entry points. I led the concept end to end, and the final direction shown in this case was approved by the CEO.</p>
            <div className="mt-[clamp(44px,6vw,86px)] grid grid-cols-1 gap-5 sm:grid-cols-3">
              {['ONBOARDING', 'MESSENGER', 'PROFILE'].map((x) => <MediaPlaceholder key={x} label={x} ratio="9/16" />)}
            </div>
          </section>

          <section className="case-section col-span-12">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {['VOICE MESSAGE', 'SERVER PICKER', 'ATTACHMENTS'].map((x) => <MediaPlaceholder key={x} label={x} ratio="9/16" />)}
            </div>
            <h3 className="case-subtitle mt-[clamp(64px,9vw,128px)] max-w-[760px]">Treat the desktop client as one product problem</h3>
            <p className="case-copy mt-5 max-w-[1220px]">By May 2025, the desktop client still behaved like a mobile app stretched across a larger window. Layouts broke when resized, pointer states were missing, and simple actions often replaced the entire conversation.</p>
          </section>

          <section className="col-span-12 mt-[clamp(56px,8vw,112px)] grid grid-cols-1 gap-x-2 gap-y-[clamp(40px,5vw,72px)] sm:grid-cols-2">
            <MediaPlaceholder label="BEFORE / AFTER · CONTACT PICKER" caption="Replaced a full-screen contact picker with a compact modal that keeps the chat in context." ratio="16/10" />
            <MediaPlaceholder label="BEFORE / AFTER · RECOVERY KEY" caption="Turned an unexplained recovery-key form into a guided onboarding step." ratio="16/10" />
            <MediaPlaceholder label="BEFORE / AFTER · MESSAGES" caption="Softened outgoing message bubbles to improve readability and reduce visual noise." ratio="16/10" />
            <MediaPlaceholder label="BEFORE / AFTER · EMOJI" caption="Replaced the full-width emoji panel with a compact popover." ratio="16/10" />
            <MediaPlaceholder label="RESPONSIVE DESKTOP" caption="Defined responsive rules for how panels resize, collapse and adapt." ratio="16/9" className="sm:col-span-2" />
          </section>

          <p className="case-lead col-span-12 mt-[clamp(72px,10vw,144px)] max-w-[1260px]">I packaged the findings into a single proposal, which the founders and Product Manager approved within a week. Over six months, we rebuilt the client around responsive rules, desktop-native interactions and reusable patterns added back to the design system.</p>

          <section className="case-section col-span-12">
            <h3 className="case-subtitle max-w-[900px]">Make Web3 rewards easier to find and understand</h3>
            <p className="case-copy mt-5 max-w-[1220px]">Chums already had quests and wallet rewards, but users struggled to find the feature, understand the tasks and see the payout before starting. I led the benchmark study, defined the product direction and guided a junior designer through the execution.</p>
            <div className="mt-[clamp(48px,7vw,100px)] grid grid-cols-1 gap-5 sm:grid-cols-3">
              {['QUEST DISCOVERY', 'QUEST DETAILS', 'REWARD HISTORY'].map((x) => <MediaPlaceholder key={x} label={x} ratio="9/16" />)}
            </div>
          </section>

          <section className="col-span-12 mt-[clamp(88px,12vw,172px)]">
            <div className="case-points">
              <MagneticPoint title="DISCOVERY" className="case-point-a">can users find the feature without being taught where it is?</MagneticPoint>
              <MagneticPoint title="COMPREHENSION" className="case-point-b">can they understand the rules inside the flow?</MagneticPoint>
              <MagneticPoint title="PAYOUT VISIBILITY" className="case-point-c">do they know what they will receive before committing?</MagneticPoint>
            </div>
            <p className="case-copy mt-10">The third moment became our main design constraint.</p>
          </section>

          <section className="case-section col-span-12">
            <h3 className="case-subtitle">What shipped</h3>
            <p className="case-copy mt-5 max-w-[1260px]">The new visual direction was approved by the CEO. The desktop redesign was scoped and approved in one week, then shipped to beta three months later. We added responsive layouts, clearer desktop interactions and reusable patterns to the design system. The new reward experience was approved and moved into development.</p>
            <div className="mt-[clamp(48px,7vw,100px)] grid grid-cols-1 gap-5 sm:grid-cols-3">
              {['FINAL MOBILE 01', 'FINAL MOBILE 02', 'FINAL MOBILE 03'].map((x) => <MediaPlaceholder key={x} label={x} ratio="9/16" />)}
            </div>
            <MediaPlaceholder label="FINAL DESKTOP EXPERIENCE" ratio="16/9" className="mx-auto mt-[clamp(48px,7vw,100px)] max-w-[900px]" />
          </section>
        </div>
      </article>
    </dialog>
  );
}
