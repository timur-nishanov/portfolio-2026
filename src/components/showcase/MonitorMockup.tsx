'use client';

import Image from 'next/image';
import type { PhoneScreen } from '@/data/showcase';
import { assets } from '@/data/assets';
import { useLazyVideo, type VideoWatch } from '@/hooks/useLazyVideo';

// The 16:9 screen inside monitor-frame.webp (1600 x 1232), as drawn
// (scripts/render-monitor.py): x 33..1567, y 33..896. The bezel round it is
// black glass.
const SCREEN = {
  top: (33 / 1232) * 100,
  left: (33 / 1600) * 100,
  width: (1534 / 1600) * 100,
  height: (863 / 1232) * 100,
};
const FRAME_AR = '1600 / 1232';
// Same as the phone: the recording runs a little under the bezel, so the
// seam only ever holds the screen's own pixels.
const BLEED = '1.5px';

/** A desktop display with a screen recording playing in it; the frame sits on
    top. In a case, the recording waits to be well in view (watch, see
    VideoWatch). */
export function MonitorMockup({ screen, watch }: { screen: PhoneScreen; watch?: VideoWatch }) {
  // Source and poster are attached on approach, not in the markup — see useLazyVideo.
  const videoRef = useLazyVideo(screen.src, screen.poster, watch);
  const screenStyle: React.CSSProperties = {
    top: `calc(${SCREEN.top}% - ${BLEED})`,
    left: `calc(${SCREEN.left}% - ${BLEED})`,
    width: `calc(${SCREEN.width}% + 2 * ${BLEED})`,
    height: `calc(${SCREEN.height}% + 2 * ${BLEED})`,
  };
  return (
    <div className="relative h-full" style={{ aspectRatio: FRAME_AR }}>
      {/* With no recording yet, the screen stands blank, in the cases'
          stand-in grey, as the phone's does (PhoneMockup). */}
      {!screen.src ? (
        <div className="absolute" style={{ ...screenStyle, background: 'linear-gradient(180deg, #f1f1f1, #e9e9ea)' }} />
      ) : (
        <video
          ref={videoRef}
          className="absolute bg-white object-cover"
          style={screenStyle}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-label={screen.alt}
        />
      )}
      <Image
        src={assets.monitorFrame}
        alt=""
        aria-hidden="true"
        fill
        sizes="800px"
        className="pointer-events-none object-contain"
      />
    </div>
  );
}
