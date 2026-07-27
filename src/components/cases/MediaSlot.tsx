'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { CaseMedia } from '@/data/cases';

/**
 * Fixed-proportion media slot (TZ §12). The aspect-ratio is set from data and
 * never depends on whether a file exists, so dropping mockups in later can't
 * shift the layout. Empty slot → shimmering skeleton with a MOCKUP label.
 */
export function MediaSlot({ media }: { media: CaseMedia }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play videos only while in view — five autoplaying clips would drain battery.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-card"
      style={{ aspectRatio: media.aspect.replace('/', ' / ') }}
    >
      {media.src === null ? (
        <div className="absolute inset-0 grid place-items-center rounded-card bg-[#e7e7e7]">
          <div
            className="slot-shimmer-el absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)',
              backgroundSize: '200% 100%',
              animation: 'slot-shimmer 3s ease-in-out infinite',
            }}
          />
          <span className="pixel relative text-[13px] text-ink-muted">MOCKUP</span>
        </div>
      ) : media.type === 'image' ? (
        <Image src={media.src} alt={media.alt} fill sizes="(max-width: 767px) 90vw, 620px" className="object-contain" />
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={media.poster}
          aria-label={media.alt}
        >
          {media.src ? <source src={media.src} /> : null}
        </video>
      )}
    </div>
  );
}
