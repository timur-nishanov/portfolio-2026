'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { PhoneScreen } from '@/data/cases';
import { assets } from '@/data/assets';

// Screen cutout inside the frame PNG, measured from iphone-frame.png (a
// 1310×2710 canvas with a fully transparent screen — the frame sits ON TOP of
// the content, so its cutout just shows whatever is layered underneath,
// dynamic island included since that's baked into the frame's opaque area).
const SCREEN = { top: 1.62, left: 3.97, right: 4.05, bottom: 1.66 };
// Matches the transparent cutout's rounded corner: ~9.9% of the screen's
// width horizontally, ~4.55% of its height vertically — expressed as two
// radii so it stays circular at any box size.
const SCREEN_RADIUS = '9.9% / 4.55%';
const PHONE_AR = '1310 / 2710';

/** One phone in the media strip — either a live frame with content, or a
 *  pre-composited render drawn as-is. */
export function PhoneMockup({ phone }: { phone: PhoneScreen }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play the framed video only while it's on screen (battery).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { threshold: 0.1 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // Already-composited phone render: just the image, no frame layering needed.
  if (!phone.framed) {
    return (
      <div className="relative h-full" style={{ aspectRatio: PHONE_AR }}>
        <Image
          src={phone.src}
          alt={phone.alt}
          fill
          sizes="(max-width: 767px) 45vw, 340px"
          className="object-contain"
        />
      </div>
    );
  }

  const screenStyle: React.CSSProperties = {
    top: `${SCREEN.top}%`,
    left: `${SCREEN.left}%`,
    width: `${100 - SCREEN.left - SCREEN.right}%`,
    height: `${100 - SCREEN.top - SCREEN.bottom}%`,
    borderRadius: SCREEN_RADIUS,
  };

  return (
    <div className="relative h-full" style={{ aspectRatio: PHONE_AR }}>
      {/* Content sits UNDER the frame, clipped to the screen rect with a
          matching corner radius so nothing bleeds past the bezel edge. */}
      {phone.type === 'video' ? (
        <video
          ref={videoRef}
          className="absolute object-cover"
          style={screenStyle}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={phone.poster}
          aria-label={phone.alt}
        >
          <source src={phone.src} type={phone.src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        </video>
      ) : (
        <div className="absolute overflow-hidden" style={screenStyle}>
          <Image src={phone.src} alt={phone.alt} fill sizes="340px" className="object-cover" />
        </div>
      )}

      {/* Bezel on top — its screen cutout is fully transparent, so the
          content underneath (and the dynamic island baked into the frame)
          shows through with nothing extra to draw. */}
      <Image
        src={assets.phoneFrame}
        alt=""
        aria-hidden="true"
        fill
        sizes="(max-width: 767px) 45vw, 340px"
        className="pointer-events-none object-contain"
      />
    </div>
  );
}

/** Two phones side by side, centred, filling the media slot. */
export function PhoneStrip({ phones }: { phones: PhoneScreen[] }) {
  return (
    <div className="flex h-full w-full items-center justify-center gap-[3%]">
      {phones.map((p, i) => (
        <PhoneMockup key={i} phone={p} />
      ))}
    </div>
  );
}
