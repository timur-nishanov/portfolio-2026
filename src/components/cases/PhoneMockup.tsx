'use client';

import Image from 'next/image';
import type { PhoneScreen } from '@/data/cases';
import { assets } from '@/data/assets';
import { useLazyVideo } from '@/hooks/useLazyVideo';

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
// The content runs this far under the bezel on every side (the black rim is
// ~10px wide at these sizes). Edge to edge with the cutout, the clip and the
// rim landed on the same fractional pixel and the card behind showed through
// it: a light hairline across the top of a dark screen. Under the bezel the
// seam only ever holds the screen's own pixels, whatever their colour.
const BLEED = '1.5px';

/** One phone in the media strip — either a live frame with content, or a
 *  pre-composited render drawn as-is. */
export function PhoneMockup({ phone }: { phone: PhoneScreen }) {
  // Source is attached on approach, not in the markup — see useLazyVideo.
  const videoRef = useLazyVideo(phone.src);

  // Already-a-mockup render: draw as-is, no iPhone frame layered on top.
  if (!phone.framed) {
    return (
      <div className="relative h-full overflow-hidden" style={{ aspectRatio: PHONE_AR }}>
        {phone.type === 'video' ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            style={phone.scale ? { transform: `scale(${phone.scale})` } : undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={phone.poster}
            aria-label={phone.alt}
          />
        ) : (
          <Image
            src={phone.src}
            alt={phone.alt}
            fill
            sizes="(max-width: 767px) 45vw, 340px"
            className="object-contain"
          />
        )}
      </div>
    );
  }

  const screenStyle: React.CSSProperties = {
    top: `calc(${SCREEN.top}% - ${BLEED})`,
    left: `calc(${SCREEN.left}% - ${BLEED})`,
    width: `calc(${100 - SCREEN.left - SCREEN.right}% + 2 * ${BLEED})`,
    height: `calc(${100 - SCREEN.top - SCREEN.bottom}% + 2 * ${BLEED})`,
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
          preload="none"
          poster={phone.poster}
          aria-label={phone.alt}
        />
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
