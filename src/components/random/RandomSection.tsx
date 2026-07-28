'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { assets } from '@/data/assets';
import { q } from '@/lib/lerp';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';

// Absolute collage transcribed from the Figma (frame 1:277, 1440-wide canvas).
// Items deliberately overlap. Positions are % of a 1440×5705 canvas; heights
// come from each asset's own aspect, which matches the Figma frames.
// `p` = per-item scroll-parallax amplitude in px (varied sign so they drift
// independently, not as one sheet). TODO(record): the two iMac tiles want live
// recordings of artemartemartem.com and stepicon2026.vercel.app — both hosts
// are blocked by the egress policy (403), so they render as empty frames until
// the clips can be captured.
const CANVAS_AR = '1440 / 5705';

type Tile = {
  src: string | null; // null → iMac placeholder frame
  alt: string;
  w: number; // px, intrinsic
  h: number;
  l: number; // left %
  t: number; // top %
  wpct: number; // width %
  p: number; // parallax amplitude px
};

const tiles: Tile[] = [
  { src: assets.randomAppleWatch, alt: 'Apple Watch concept', w: 353, h: 398, l: 78.12, t: 0.0, wpct: 16.32, p: 34 },
  { src: null, alt: 'artemartemartem.com — recording pending', w: 2760, h: 2221, l: 6.53, t: 2.33, wpct: 86.94, p: -10 },
  { src: assets.randomWallet, alt: 'Ever Wallet screen', w: 500, h: 1028, l: 6.81, t: 13.25, wpct: 23.11, p: 46 },
  { src: assets.randomSoyun, alt: 'Soyun — Verbal musica poster', w: 939, h: 1329, l: 28.26, t: 22.63, wpct: 43.47, p: -30 },
  { src: assets.randomBergman, alt: 'Bergman poster', w: 702, h: 993, l: 65.42, t: 30.09, wpct: 32.5, p: 26 },
  { src: assets.randomSmartbot, alt: 'Chatbot constructor — landing', w: 2070, h: 1220, l: 2.08, t: 40.07, wpct: 95.85, p: -14 },
  { src: assets.randomRides, alt: 'Rides app screen', w: 576, h: 1185, l: 22.57, t: 51.27, wpct: 23.75, p: 42 },
  { src: null, alt: 'stepicon2026 — recording pending', w: 2760, h: 2221, l: 6.53, t: 60.17, wpct: 86.94, p: -10 },
  { src: assets.randomPoorThings, alt: 'Poor Things screen', w: 513, h: 1041, l: 6.32, t: 74.51, wpct: 26.66, p: 40 },
  { src: assets.randomAlice, alt: 'Alice in Wonderland poster', w: 843, h: 1341, l: 30.49, t: 80.53, wpct: 39.03, p: -28 },
  { src: assets.randomBoot, alt: 'Boot product shot', w: 629, h: 705, l: 66.25, t: 91.76, wpct: 29.1, p: 50 },
];

// iMac screen cutout, measured from imac-frame.png (2760×2221).
const IMAC_SCREEN = { left: 4.64, top: 5.49, width: 90.69, height: 63.39 };

function ImacPlaceholder({ alt }: { alt: string }) {
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute grid place-items-center bg-[#e7e7e7]"
        style={{
          left: `${IMAC_SCREEN.left}%`,
          top: `${IMAC_SCREEN.top}%`,
          width: `${IMAC_SCREEN.width}%`,
          height: `${IMAC_SCREEN.height}%`,
        }}
      >
        <span className="pixel text-[clamp(9px,0.9vw,13px)] text-ink-muted">MOCKUP</span>
      </div>
      <Image
        src={assets.imacFrame}
        alt={alt}
        fill
        sizes="(max-width: 767px) 90vw, 1250px"
        className="pointer-events-none object-contain"
      />
    </div>
  );
}

function RandomTile({ tile, sectionRef }: { tile: Tile; sectionRef: React.RefObject<HTMLElement | null> }) {
  const { register } = useSmoothScroll();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const section = sectionRef.current;
    if (!el || !section) return;
    let inView = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), {
      rootMargin: '20% 0px 20% 0px',
    });
    io.observe(el);

    const onFrame = () => {
      if (!inView) return;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 (section below fold) → +1 (above), 0 when centred.
      const progress = (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2);
      el.style.transform = `translate3d(0, ${q(progress * tile.p)}px, 0)`;
    };
    const off = register(onFrame);
    return () => {
      io.disconnect();
      off();
    };
  }, [register, sectionRef, tile.p]);

  return (
    <div
      ref={ref}
      className="absolute will-change-transform"
      style={{ left: `${tile.l}%`, top: `${tile.t}%`, width: `${tile.wpct}%` }}
    >
      {tile.src === null ? (
        <div className="relative" style={{ aspectRatio: `${tile.w} / ${tile.h}` }}>
          <ImacPlaceholder alt={tile.alt} />
        </div>
      ) : (
        <Image
          src={tile.src}
          alt={tile.alt}
          width={tile.w}
          height={tile.h}
          sizes="(max-width: 767px) 50vw, 40vw"
          className="h-auto w-full select-none"
        />
      )}
    </div>
  );
}

export function RandomSection() {
  const sectionRef = useRef<HTMLElement>(null);
  return (
    <section
      ref={sectionRef}
      id="random"
      aria-labelledby="random-heading"
      className="py-[clamp(48px,7vw,110px)]"
    >
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <div className="container-cases">
        <div className="relative w-full" style={{ aspectRatio: CANVAS_AR }}>
          {tiles.map((t, i) => (
            <RandomTile key={i} tile={t} sectionRef={sectionRef} />
          ))}
        </div>
      </div>
    </section>
  );
}
