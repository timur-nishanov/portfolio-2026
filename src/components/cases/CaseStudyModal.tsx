'use client';

import Lenis from 'lenis';
import { useCallback, useEffect, useRef } from 'react';
import type { Case } from '@/data/cases';
import { chumsShots as shot } from '@/data/chumsShots';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Props = { data: Case; open: boolean; onClose: () => void };
type ShotProps = {
  shot: { src: string; w: number; h: number; alt: string };
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Corner radius at the 1440 reference, in Figma pixels. */
  radius?: number;
  /** Hold the plate to this ratio and fill it, so a row of screens lines up. */
  box?: string;
};

// Corner radii, at the 1440 reference: the concept phones are drawn at 48, the
// reward and What-shipped mobiles at 32, every desktop window at 8.
const CONCEPT_RADIUS = 48;
const MOBILE_RADIUS = 32;
const DESKTOP_RADIUS = 8;

// The reward screens were captured on two different device widths — 1080 and
// 1125 across the same height — so scaling them to a shared column width left
// the row a few dozen pixels ragged. They are held to one box instead and fill
// it; the odd one out loses about 4% of its width, which is margin.
const REWARD_BOX = '1080 / 2436';

/** Marks a block for the blur-in reveal. `i` staggers siblings within a row. */
const reveal = (classes = '', i = 0, media = false) => ({
  className: `case-reveal${media ? ' case-reveal-media' : ''}${classes ? ` ${classes}` : ''}`,
  style: { '--reveal-delay': `${i * 90}ms` } as React.CSSProperties,
});

/**
 * One screen on its plate. The plate is what gives a screenshot an edge against
 * the sheet — without it the shots read as floating in mid-air — and it also
 * fills the slot while the file is still on the wire.
 *
 * width/height are the file's own, so the slot is reserved before the bytes
 * arrive; `loading="lazy"` keeps everything below the fold off the critical
 * path, which matters when the sheet carries thirty-one of these.
 */
function Shot({ shot, caption, className = '', style, radius = DESKTOP_RADIUS, box }: ShotProps) {
  return (
    <figure className={className} style={style}>
      <div
        className="case-plate"
        data-box={box ? '' : undefined}
        style={{ '--shot-radius': `calc(${radius} * var(--cu))`, '--shot-box': box } as React.CSSProperties}
      >
        <img
          src={shot.src}
          alt={shot.alt}
          width={shot.w}
          height={shot.h}
          loading="lazy"
          decoding="async"
          className="case-shot"
        />
      </div>
      {caption ? <figcaption className="case-caption">{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * A desktop before/after row. Each half is a card of its own — 694.5×624 in the
 * frame, with the screenshot centred inside it — so the two sit level however
 * differently the two windows are shaped. The 8px gutter is the grid's.
 */
function ShotPair({ before, after, caption }: { before: ShotProps['shot']; after: ShotProps['shot']; caption: string }) {
  return (
    <figure {...reveal('', 0, true)}>
      <div className="case-pair">
        {[before, after].map((s) => (
          <div key={s.src} className="case-card">
            <Shot shot={s} />
          </div>
        ))}
      </div>
      <figcaption className="case-caption">{caption}</figcaption>
    </figure>
  );
}

/**
 * Same glass and the same pull as the header's round button, but as one layer:
 * plate and glyph travel together, so the cross never drifts off the centre of
 * its own circle. Sits outside the sheet — a transformed or filtered ancestor
 * would capture its `position: fixed`.
 */
function CloseButton({ onClose }: { onClose: () => void }) {
  // The anchor holds the fixed position and is never transformed, so the magnet
  // keeps measuring the button's resting box instead of chasing its own offset.
  const anchorRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  useMagnetic(anchorRef, [{ ref: buttonRef, factor: 0.09, max: 6 }], canHover && !reduced);

  return (
    <div ref={anchorRef} className="case-close-anchor">
      <button ref={buttonRef} type="button" onClick={onClose} className="case-close glass will-change-transform">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 5 19 19M19 5 5 19" />
        </svg>
        <span className="sr-only">Close case study</span>
      </button>
    </div>
  );
}

function MagneticPoint({ title, children, className = '', index }: { title: string; children: React.ReactNode; className?: string; index: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  // Deliberately faint pull — the balls should lean toward the cursor, not chase it.
  useMagnetic(rootRef, [{ ref: ballRef, factor: 0.045, max: 12 }], canHover && !reduced);

  // Three nested boxes, one job each: the anchor positions and is measured, the
  // middle one plays the reveal, the inner one carries the magnet. They used to
  // be two, and the magnet wrote its transform onto the element the reveal was
  // transitioning — so every nudge was eased over the reveal's 760ms and the
  // pull simply never showed.
  return (
    <div ref={rootRef} className={`case-point-anchor ${className}`}>
      <div {...reveal('size-full', index)}>
        <div ref={ballRef} className="size-full will-change-transform">
          <div className="case-point glass">
            <p className="case-point-title">{title}</p>
            <p className="case-point-copy">{children}</p>
          </div>
        </div>
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
  const sheetRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const reduced = useReducedMotion();
  const { setPaused } = useSmoothScroll();

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    closeTimer.current = window.setTimeout(() => {
      dialog.close();
      dialog.classList.remove('is-closing');
      onClose();
    }, 420);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    dialog.showModal();
    dialog.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    // Read by useMagnetic: every magnetic surface outside the dialog stands
    // down while the case is open.
    document.documentElement.setAttribute('data-modal-open', '');
    setPaused(true);
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.removeAttribute('data-modal-open');
      setPaused(false);
      window.clearTimeout(closeTimer.current);
      if (dialog.open) dialog.close();
    };
  }, [open, setPaused]);

  // Scrolling and the reveal share one rAF loop.
  //
  // The case scrolls with the same easing as the page — the page's Lenis is
  // bound to the window and cannot drive a dialog, so the dialog gets its own
  // instance for as long as it is open.
  //
  // The reveal is a sweep over the blocks that have not played yet, not an
  // IntersectionObserver: an observer never fires for elements a jump scrolls
  // straight past (a drag of the scrollbar, a Home/End key), and those blocks
  // then sit at opacity 0 forever. A sweep reveals anything whose top has come
  // above the trigger line, including everything already behind the reader.
  // The list only shrinks, and reads are batched ahead of the writes.
  useEffect(() => {
    const dialog = dialogRef.current;
    const sheet = sheetRef.current;
    if (!open || !dialog || !sheet) return;

    let pending = Array.from(sheet.querySelectorAll<HTMLElement>('.case-reveal'));
    if (reduced) {
      pending.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const sweep = () => {
      if (!pending.length) return;
      const line = dialog.clientHeight * 0.88;
      const hit: HTMLElement[] = [];
      const rest: HTMLElement[] = [];
      for (const el of pending) (el.getBoundingClientRect().top < line ? hit : rest).push(el);
      pending = rest;
      for (const el of hit) el.classList.add('is-in');
    };

    const lenis = new Lenis({ wrapper: dialog, content: sheet, lerp: 0.09, smoothWheel: true, syncTouch: false });
    let raf = 0;
    let lastY = -1;
    const loop = (time: number) => {
      lenis.raf(time);
      // Measure only when the sheet actually moved, so a still page costs a
      // single comparison per frame.
      if (dialog.scrollTop !== lastY) {
        lastY = dialog.scrollTop;
        sweep();
      }
      raf = requestAnimationFrame(loop);
    };
    // Two frames of grace before the first sweep. The dialog is display:none
    // until showModal, so its blurred pre-transition state has never been
    // painted; revealing on the same frame it appears gives the browser no
    // start value to interpolate from and the first screen snaps in sharp
    // instead of dissolving. One frame to paint the blur, the next to release
    // it — and the run loop only starts after that.
    let warmup = 0;
    const start = requestAnimationFrame(() => {
      warmup = requestAnimationFrame(() => {
        sweep();
        raf = requestAnimationFrame(loop);
      });
    });

    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(warmup);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [open, reduced]);

  return (
    <dialog
      ref={dialogRef}
      // data-lenis-prevent: the page's Lenis grabs wheel events at the window
      // and feeds them to the (locked) page scroll — this hands them back, and
      // the dialog's own Lenis instance above does the smoothing.
      data-lenis-prevent
      className="case-study-modal m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain bg-transparent p-0 text-white"
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      aria-labelledby={`${data.id}-case-title`}
    >
      {/* Outside the sheet on purpose: the sheet is transformed while it opens,
          and a transformed ancestor makes `position: fixed` resolve against it
          instead of the viewport — which sent the button scrolling away with
          the page. As a direct child of the dialog it stays put. */}
      <CloseButton onClose={requestClose} />

      <article ref={sheetRef} className="case-study-sheet min-h-dvh">
        <div className="case-wrap">
          <header>
            <h2 id={`${data.id}-case-title`} {...reveal('case-title', 0)}>Chums Messenger</h2>
            <p {...reveal('case-lead mt-[calc(32*var(--cu))] max-w-[77.5%] max-md:max-w-none', 1)}>
              I led the redesign of the desktop client and the Web3 reward experience for Chums — a Matrix-based messenger with tokens, NFTs, domains and dApps built directly into chat. The product already had 32k+ wallets and more than $200k held in user balances. My job was not to add more capability, but to make the existing product easier to reach, understand and use.
            </p>
          </header>

          <div className="case-details">
            {details.map(([label, copy], i) => (
              <div key={label} {...reveal('case-detail-row', i)}>
                <p className="case-kicker">{label}</p>
                <p className="case-copy">{copy}</p>
              </div>
            ))}
          </div>

          <section className="case-section">
            <h3 {...reveal('case-heading', 0)}>Define a new visual direction</h3>
            <p {...reveal('case-lead mt-[calc(32*var(--cu))]', 1)}>I developed a new visual concept for Chums across its key mobile screens and Web3 entry points. Led the concept end to end, and the final direction shown in this case was approved by the CEO.</p>
            <div className="case-phones mt-[calc(96*var(--cu))]">
              {[shot.onboarding, shot.messenger, shot.profile, shot.voiceMessage, shot.serverPicker, shot.attachments].map((s, i) => (
                <Shot key={s.src} shot={s} radius={CONCEPT_RADIUS} {...reveal('', i % 3, true)} />
              ))}
            </div>
          </section>

          <section className="case-section">
            <h3 {...reveal('case-heading max-w-[64%] max-md:max-w-none', 0)}>Treat the desktop client as one product problem</h3>
            <p {...reveal('case-lead mt-[calc(32*var(--cu))] max-w-[96.5%]', 1)}>By May 2025, the desktop client still behaved like a mobile app stretched across a larger window. Layouts broke when resized, pointer states were missing, and simple actions often replaced the entire conversation. Take a look at some of them:</p>
            <div className="mt-[calc(64*var(--cu))] flex flex-col gap-[calc(40*var(--cu))]">
              <ShotPair before={shot.beforeContacts} after={shot.afterContacts} caption="Replaced a full-screen contact picker with a compact modal that keeps the chat in context." />
              <ShotPair before={shot.beforeRecoveryKey} after={shot.afterRecoveryKey} caption="Turned an unexplained recovery-key form into a guided onboarding step with clear context and action." />
              <ShotPair before={shot.beforeMessages} after={shot.afterMessages} caption="Softened outgoing message bubbles to improve readability and reduce visual noise." />
              <ShotPair before={shot.beforeEmoji} after={shot.afterEmoji} caption="Replaced the full-width emoji panel with a compact popover that keeps the conversation visible." />
              {/* Three window widths share one card here, not three — that is
                  how the frame draws it. They also share a source height, so
                  weighting each column by its own width keeps them level. */}
              <figure {...reveal('', 0, true)}>
                <div className="case-card case-card-wide">
                  <div className="case-widths">
                    {[shot.responsiveDesktop1, shot.responsiveDesktop2, shot.responsiveDesktop3].map((s) => (
                      <Shot key={s.src} shot={s} style={{ flex: `${s.w} 1 0` }} />
                    ))}
                  </div>
                </div>
                <figcaption className="case-caption">Defined responsive rules for how panels resize, collapse and adapt across different window sizes.</figcaption>
              </figure>
            </div>
            <p {...reveal('case-lead mt-[calc(64*var(--cu))] max-w-[96.5%]', 0)}>I packaged the findings into a single proposal, which the founders and Product Manager approved within a week. Over the following months, we rebuilt the client around responsive rules, desktop-native interactions and reusable patterns added back to the design system. The first beta shipped three months after approval, followed by several rounds of iteration.</p>
          </section>

          <section className="case-section">
            <h3 {...reveal('case-heading max-w-[72.5%] max-md:max-w-none', 0)}>Make Web3 rewards easier to find and understand</h3>
            <p {...reveal('case-lead mt-[calc(32*var(--cu))] max-w-[96.5%]', 1)}>Chums already had quests and wallet rewards, but users struggled to find the feature, understand the tasks and see the payout before starting. I led the benchmark study, defined the product direction and guided a junior designer through the execution.</p>
            {/* The study leads, the solution follows: the three moments and the
                constraint they produced come first, then the screens that
                answer it. */}
            <p {...reveal('case-lead mt-[calc(40*var(--cu))] max-w-[96.5%]', 0)}>Instead of comparing feature lists, we mapped how each product handled the three moments where the experience either worked or fell apart:</p>
            <div className="case-points mt-[calc(64*var(--cu))]">
              <MagneticPoint index={0} title="DISCOVERY" className="case-point-a">can users find the feature without being taught where it is?</MagneticPoint>
              <MagneticPoint index={1} title="COMPREHENSION" className="case-point-b">can they understand the rules inside the flow?</MagneticPoint>
              <MagneticPoint index={2} title="PAYOUT VISIBILITY" className="case-point-c">do they know what they will receive before committing?</MagneticPoint>
            </div>
            <p {...reveal('case-lead mt-[calc(64*var(--cu))] max-w-[96.5%]', 0)}>The third moment became our main design constraint.</p>
            <p {...reveal('case-lead mt-[calc(40*var(--cu))] max-w-[96.5%]', 0)}>A task could be simple and the reward could be valuable, but neither mattered if users had to begin before understanding the payoff.</p>
            <div className="case-phones mt-[calc(96*var(--cu))]" style={{ '--phone-gap': 140 } as React.CSSProperties}>
              {[shot.chatList, shot.quests, shot.stats, shot.errorState, shot.walletOnboarding, shot.questsComplete].map((s, i) => (
                <Shot key={s.src} shot={s} radius={MOBILE_RADIUS} box={REWARD_BOX} {...reveal('', i % 3, true)} />
              ))}
            </div>
            <p {...reveal('case-lead mt-[calc(52*var(--cu))] max-w-[96.5%]', 0)}>We built the experience around a clear entry point, upfront reward amounts, visible progress and rules explained directly inside the flow. I reviewed the scenarios and key design decisions throughout the process. The final concept was approved and moved into development.</p>
          </section>

          <section className="case-section">
            <h3 {...reveal('case-heading', 0)}>What shipped</h3>
            <p {...reveal('case-lead mt-[calc(32*var(--cu))] max-w-[96.5%]', 1)}>The new visual direction was approved by the CEO. The desktop redesign was scoped and approved in one week, then shipped to beta three months later. Common actions became noticeably shorter — attaching a file went from 6 steps to 1. We added responsive layouts, clearer desktop interactions and reusable patterns to the design system. The new reward experience was approved and moved into development.</p>
            <div className="case-phones mt-[calc(64*var(--cu))]" style={{ '--phone-gap': 136 } as React.CSSProperties}>
              {[shot.groupChat, shot.messages, shot.markdown].map((s, i) => (
                <Shot key={s.src} shot={s} radius={MOBILE_RADIUS} {...reveal('', i, true)} />
              ))}
            </div>
            <Shot shot={shot.groupCall} {...reveal('mx-auto mt-[calc(136*var(--cu))] w-[64.3%] max-md:w-full', 0, true)} />
            <div className="case-phones mt-[calc(136*var(--cu))]" style={{ '--phone-gap': 136 } as React.CSSProperties}>
              {[shot.chatInfo, shot.reactions, shot.donations].map((s, i) => (
                <Shot key={s.src} shot={s} radius={MOBILE_RADIUS} {...reveal('', i, true)} />
              ))}
            </div>
            <Shot shot={shot.browser} {...reveal('mx-auto mt-[calc(136*var(--cu))] w-[64.3%] max-md:w-full', 0, true)} />
          </section>
        </div>
      </article>
    </dialog>
  );
}
