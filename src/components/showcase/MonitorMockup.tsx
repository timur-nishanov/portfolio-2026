'use client';

import Image from 'next/image';
import type { PhoneScreen } from '@/data/cases';
import { assets } from '@/data/assets';
import { useLazyVideo } from '@/hooks/useLazyVideo';

// The 16:9 screen inside imac-frame.webp (1600 x 1288), measured at the rim's
// half-alpha line: x 74..1525, y 71..887. The bezel around it is black.
const SCREEN = {
  top: (71 / 1288) * 100,
  left: (74 / 1600) * 100,
  width: (1451 / 1600) * 100,
  height: (816 / 1288) * 100,
};
const FRAME_AR = '1600 / 1288';
// Same as the phone: the recording runs a little under the bezel, so the
// seam only ever holds the screen's own pixels.
const BLEED = '1.5px';

/** An iMac with a screen recording playing in it; the frame sits on top. */
export function MonitorMockup({ screen }: { screen: PhoneScreen }) {
  // Source and poster are attached on approach, not in the markup — see useLazyVideo.
  const videoRef = useLazyVideo(screen.src, screen.poster);
  return (
    <div className="relative h-full" style={{ aspectRatio: FRAME_AR }}>
      <video
        ref={videoRef}
        className="absolute bg-white object-cover"
        style={{
          top: `calc(${SCREEN.top}% - ${BLEED})`,
          left: `calc(${SCREEN.left}% - ${BLEED})`,
          width: `calc(${SCREEN.width}% + 2 * ${BLEED})`,
          height: `calc(${SCREEN.height}% + 2 * ${BLEED})`,
        }}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        aria-label={screen.alt}
      />
      <Image
        src={assets.imacFrame}
        alt=""
        aria-hidden="true"
        fill
        sizes="800px"
        className="pointer-events-none object-contain"
      />
    </div>
  );
}
