'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { assets } from '@/data/assets';
import { q } from '@/lib/lerp';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';

// Absolute collage transcribed from the Figma (frame 1:277). The four desktop
// mockups span the full content band (≈30px side margins at the 1440 reference);
// the smaller items overlap them. Positions are % of a 1380×6736 band. `z` is
// the stacking order (small items above the big ones); `p` = per-item scroll
// parallax amplitude (px, varied sign) so they drift independently.
// TODO(record): the artem / stepicon iMacs want live recordings of
// artemartemartem.com and stepicon2026.vercel.app — both blocked by the egress
// policy (403), so they render as empty labelled iMac frames for now.
const CANVAS_AR = '1380 / 6736';

type Tile = {
  src: string | null; // null → iMac placeholder frame
  alt: string;
  w: number; // intrinsic px (for aspect)
  h: number;
  l: number; // left %
  t: number; // top %
  wpct: number; // width %
  z: number;
  p: number; // parallax amplitude px
};

const IMAC = { w: 2760, h: 2221 };

const tiles: Tile[] = [
  { src: assets.randomAppleWatch, alt: 'Apple Watch concept', w: 353, h: 398, l: 79.35, t: 0.0, wpct: 17.03, z: 40, p: 30 },
  { src: null, alt: 'artemartemartem.com — recording pending', w: IMAC.w, h: IMAC.h, l: 0, t: 1.07, wpct: 100, z: 10, p: -8 },
  { src: assets.randomWallet, alt: 'Ever Wallet screen', w: 500, h: 1028, l: 4.93, t: 11.21, wpct: 24.06, z: 30, p: 40 },
  { src: assets.randomSoyun, alt: 'Soyun — Verbal musica poster', w: 939, h: 1329, l: 27.32, t: 19.15, wpct: 45.36, z: 20, p: -26 },
  { src: assets.randomBergman, alt: 'Bergman poster', w: 702, h: 993, l: 66.09, t: 25.48, wpct: 33.91, z: 20, p: 24 },
  { src: assets.randomSmartbot, alt: 'Chatbot constructor — landing', w: 2070, h: 1220, l: 0, t: 33.92, wpct: 100, z: 10, p: -8 },
  { src: assets.randomPoorThings, alt: 'Poor Things screen', w: 513, h: 1041, l: 21.38, t: 43.41, wpct: 24.78, z: 30, p: 36 },
  { src: null, alt: 'stepicon2026 — recording pending', w: IMAC.w, h: IMAC.h, l: 0, t: 50.05, wpct: 100, z: 10, p: -8 },
  { src: assets.randomRides, alt: 'Rides app screen', w: 576, h: 1185, l: 4.42, t: 63.1, wpct: 27.75, z: 30, p: 42 },
  { src: assets.randomAlice, alt: 'Alice in Wonderland poster', w: 843, h: 1341, l: 29.64, t: 68.19, wpct: 40.72, z: 20, p: -24 },
  { src: assets.randomBoot, alt: 'Boot product shot', w: 629, h: 705, l: 66.96, t: 77.71, wpct: 30.36, z: 20, p: 46 },
  { src: assets.randomMoneta, alt: 'Moneta — online payments platform, on an iMac', w: 2070, h: 1666, l: 0, t: 83.51, wpct: 100, z: 10, p: -8 },
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
        sizes="(max-width: 767px) 92vw, 1380px"
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
      style={{ left: `${tile.l}%`, top: `${tile.t}%`, width: `${tile.wpct}%`, zIndex: tile.z }}
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
      {/* ~30px side margins at the 1440 reference (2.083vw), scaling down. */}
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,2.083vw,30px)]">
        <div className="relative w-full" style={{ aspectRatio: CANVAS_AR }}>
          {tiles.map((t, i) => (
            <RandomTile key={i} tile={t} sectionRef={sectionRef} />
          ))}
        </div>
      </div>
    </section>
  );
}
