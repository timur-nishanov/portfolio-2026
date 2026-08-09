'use client';

import { useEffect, useRef } from 'react';
import type { Case } from '@/data/cases';

type Props = {
  data: Case;
  origin: { x: number; y: number } | null;
  onClose: () => void;
};

function ImagePlaceholder({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div
      className={`case-study-placeholder flex items-center justify-center rounded-card ${
        tall ? 'min-h-[clamp(360px,55vw,720px)]' : 'min-h-[clamp(240px,36vw,500px)]'
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-ink-muted">
        <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className="size-10" stroke="currentColor" strokeWidth="1.5">
          <rect x="5" y="7" width="38" height="34" rx="4" />
          <circle cx="17" cy="18" r="4" />
          <path d="m8 36 10-10 7 7 5-5 10 8" />
        </svg>
        <span className="pixel text-[12px]">{label}</span>
      </div>
    </div>
  );
}

export function CaseStudyModal({ data, origin, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !origin) return;
    dialog.style.setProperty('--case-origin-x', `${origin.x}px`);
    dialog.style.setProperty('--case-origin-y', `${origin.y}px`);
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      if (dialog.open) dialog.close();
    };
  }, [origin]);

  return (
    <dialog
      ref={dialogRef}
      className="case-study-modal m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-ink"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      aria-labelledby={`${data.id}-modal-title`}
    >
      <article className="case-study-sheet ml-auto min-h-dvh w-full max-w-[1380px] overflow-hidden bg-bg px-[clamp(20px,5vw,72px)] pb-[clamp(64px,10vw,144px)] pt-[clamp(20px,4vw,56px)] shadow-2xl">
        <header className="flex items-start justify-between gap-8">
          <p className="pixel text-ink-muted">CASE STUDY · CONCEPT</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="pixel rounded-full border border-black/15 px-5 py-3 transition-colors hover:bg-ink hover:text-white"
            aria-label="Close case study"
          >
            CLOSE ×
          </button>
        </header>

        <div className="mx-auto mt-[clamp(64px,10vw,140px)] max-w-[1120px]">
          <h2 id={`${data.id}-modal-title`} className="t-hero text-left leading-[1.05]">
            {data.titleLine1}<br />{data.titleLine2}
          </h2>
          <p className="t-body mt-8 max-w-[56ch] text-black/60">
            A closer look at the thinking, decisions, and details behind the project. This draft establishes the rhythm for a future full case study.
          </p>

          <div className="mt-[clamp(56px,9vw,128px)]">
            <ImagePlaceholder label="COVER IMAGE / VIDEO" tall />
          </div>

          <section className="grid gap-8 py-[clamp(72px,10vw,140px)] md:grid-cols-[1fr_2fr]">
            <p className="pixel text-ink-muted">01 · CONTEXT</p>
            <div>
              <h3 className="t-case-title">From a blurry problem to a clear direction.</h3>
              <p className="t-body mt-6 max-w-[62ch] text-black/60">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. The team mapped the current experience, identified the moments that mattered, and turned them into a focused product hypothesis.
              </p>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <ImagePlaceholder label="PRODUCT SCREEN 01" />
            <ImagePlaceholder label="PRODUCT SCREEN 02" />
          </div>

          <section className="grid gap-8 py-[clamp(72px,10vw,140px)] md:grid-cols-[1fr_2fr]">
            <p className="pixel text-ink-muted">02 · PROCESS</p>
            <div>
              <h3 className="t-case-title">Test early. Keep what works.</h3>
              <p className="t-body mt-6 max-w-[62ch] text-black/60">
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Prototypes made the key interactions tangible, while feedback shaped the final hierarchy and visual language.
              </p>
            </div>
          </section>

          <ImagePlaceholder label="FULL-WIDTH PROTOTYPE / MOTION" tall />
        </div>
      </article>
    </dialog>
  );
}
