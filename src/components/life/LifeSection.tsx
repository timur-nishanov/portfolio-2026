'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { life, type LifeEntry } from '@/data/life';
import { clamp, q } from '@/lib/lerp';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// How far a covered card is pushed back as the next one slides over it. Kept
// small — the effect should read as depth, not as the card running away.
const SCALE_DROP = 0.06;
const FADE_DROP = 0.34;

/** Media block: sized by height, width follows the asset's own ratio. */
function LifeMedia({ media }: { media: LifeEntry['media'] }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Start decoding a bit before it scrolls in, so the first frames don't
    // stutter on arrival.
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { rootMargin: '200% 0px 200% 0px', threshold: 0 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className="relative h-full shrink-0 overflow-hidden rounded-card bg-white"
      style={{ aspectRatio: media.aspect.replace('/', ' / ') }}
    >
      {media.type === 'video' ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          // A hair over 100% so the scaled frame always overshoots its box —
          // otherwise sub-pixel rounding can leave a dark seam down an edge.
          style={{ transform: 'scale(1.012)' }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={media.poster}
          aria-label={media.alt}
        >
          <source src={media.src} type="video/webm" />
        </video>
      ) : (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes="(max-width: 767px) 90vw, 30vw"
          className="object-cover"
        />
      )}
    </div>
  );
}

function LifeCard({
  entry,
  index,
  isLast,
  cardsRef,
}: {
  entry: LifeEntry;
  index: number;
  isLast: boolean;
  cardsRef: React.MutableRefObject<(HTMLElement | null)[]>;
}) {
  const { register } = useSmoothScroll();
  const innerRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLSpanElement>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = innerRef.current;
    const veil = veilRef.current;
    // The last card is never covered, and on mobile / reduced motion the cards
    // just run as a plain list.
    if (!el || !veil || isLast || isMobile || reduced) return;

    const onFrame = () => {
      const self = cardsRef.current[index];
      const next = cardsRef.current[index + 1];
      if (!self || !next) return;
      const r = self.getBoundingClientRect();
      const n = next.getBoundingClientRect();
      // 0 while the next card is still a full card-height below this one's
      // pinned top; 1 once it has risen flush over it.
      const covered = clamp((r.bottom - n.top) / Math.max(r.height, 1), 0, 1);
      el.style.transform = `scale(${q(1 - SCALE_DROP * covered)})`;
      // Dim with an opaque veil rather than the card's own opacity — fading the
      // card itself makes it translucent, and the card beneath reads straight
      // through it.
      veil.style.opacity = String(q(FADE_DROP * covered));
    };
    const off = register(onFrame);
    return () => {
      off();
      el.style.transform = '';
      veil.style.opacity = '0';
    };
  }, [register, index, isLast, isMobile, reduced, cardsRef]);

  // Media left on even rows, right on odd — matching the reference.
  const mediaFirst = index % 2 === 0;
  const surface = index % 2 === 0 ? 'bg-white' : 'bg-surface';

  return (
    <article
      ref={(n) => {
        cardsRef.current[index] = n;
      }}
      className="sticky top-[max(12px,calc(var(--header-top)+var(--nav-item-h)+24px))] md:h-[var(--life-card-h)]"
    >
      <div
        ref={innerRef}
        className={`relative flex h-full origin-top flex-col gap-[clamp(24px,6.944vw,100px)] overflow-hidden rounded-card px-[var(--life-pad-x)] py-[var(--life-pad-y)] shadow-[0_18px_60px_-24px_rgba(0,0,0,0.28)] will-change-transform md:flex-row md:items-center md:py-0 ${surface} ${
          mediaFirst ? '' : 'md:flex-row-reverse'
        }`}
      >
        {/* Media sits 72px off the card's top and bottom (the card's own 100px
            side padding puts it 100 from the edge). Sized by height, so each
            asset keeps its own ratio; radius matches the card. */}
        <div className="flex shrink-0 justify-center md:h-[calc(100%-2*var(--life-pad-y))]">
          <div className="h-[46vw] max-h-[260px] md:h-full md:max-h-none">
            <LifeMedia media={entry.media} />
          </div>
        </div>

        {/* Text: 153px from the card's top and bottom, with the gap between the
            title block and the date left to auto. */}
        <div className="flex min-w-0 flex-1 flex-col md:h-full md:py-[var(--life-text-y)]">
          <div>
            <h3 className="t-case-title max-w-[18ch] text-ink">{entry.title}</h3>
            <p className="t-body mt-[16px] max-w-[46ch] text-ink-muted">{entry.description}</p>
          </div>
          <span className="pixel mt-5 block text-left text-[clamp(10px,0.9vw,13px)] tracking-pixel text-laurel-teal md:mt-auto">
            {entry.date}
          </span>
        </div>

        {/* Opaque recede-veil: dims the card as the next one slides over it,
            without making the card itself translucent. */}
        <span
          ref={veilRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-card bg-[var(--bg)] opacity-0"
        />
      </div>
    </article>
  );
}

export function LifeSection() {
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  return (
    <section id="life" aria-labelledby="life-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="life-heading" className="sr-only">
        Life
      </h2>
      <div className="container-cases flex flex-col gap-[clamp(20px,2.8vw,40px)]">
        {life.map((entry, i) => (
          <LifeCard
            key={entry.id}
            entry={entry}
            index={i}
            isLast={i === life.length - 1}
            cardsRef={cardsRef}
          />
        ))}
      </div>
    </section>
  );
}
