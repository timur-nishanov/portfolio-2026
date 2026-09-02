'use client';

import Image from 'next/image';
import type { CaseMedia } from '@/data/cases';
import { PhoneStrip } from './PhoneMockup';
import { useLazyVideo } from '@/hooks/useLazyVideo';

/**
 * Fixed-proportion media slot (TZ §12). The aspect-ratio is set from data and
 * never depends on whether a file exists, so dropping mockups in later can't
 * shift the layout. Empty slot → shimmering skeleton with a MOCKUP label.
 * When `media.phones` is set, renders the twin-phone strip instead.
 */
export function MediaSlot({ media }: { media: CaseMedia }) {
  // Fetched and played on approach only. The Yandex Go clip alone is ~5MB and
  // used to download in full before the first screen had finished painting.
  const videoRef = useLazyVideo(media.src ?? '');

  // Twin phones don't need the card clip/skeleton bg — they fill the slot.
  if (media.phones && media.phones.length > 0) {
    return (
      <div className="relative w-full" style={{ aspectRatio: media.aspect.replace('/', ' / ') }}>
        <PhoneStrip phones={media.phones} />
      </div>
    );
  }

  // A bleeding mockup runs off the card's edge, and the slot's own corners
  // used to round it off there — a curved notch bitten out of the iMac's
  // bezel. The clip stays square on the side that bleeds.
  const radius =
    media.bleed === 'right'
      ? 'rounded-l-card'
      : media.bleed === 'left'
        ? 'rounded-r-card'
        : 'rounded-card';

  return (
    <div
      className={`relative w-full overflow-hidden ${radius}`}
      style={{
        aspectRatio: media.aspect.replace('/', ' / '),
        // Sits under the media, so a hairline rounding gap at the box edge (or
        // a not-yet-decoded video frame) shows this instead of black.
        backgroundColor: media.bg,
      }}
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
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes="(max-width: 767px) 90vw, 730px"
          className={media.fit === 'cover' ? 'object-cover' : 'object-contain'}
          style={{ objectPosition: media.objectPosition }}
        />
      ) : (
        <video
          ref={videoRef}
          className={`h-full w-full ${media.fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          style={{
            objectPosition: media.objectPosition,
            backgroundColor: media.bg,
            // Back to a hair over 100%, just enough that sub-pixel rounding
            // can't expose the box edge. The dark seam is handled by the ring
            // below instead, so the frame no longer has to be cropped for it.
            transform: media.fit === 'cover' ? 'scale(1.004)' : undefined,
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={media.poster}
          aria-label={media.alt}
        />
      )}

      {/* Last word on the dark seam. Overshooting the frame was not enough on
          its own, so the outer 3px are painted over in the clip's own backdrop
          colour — invisible against it, and it cannot leave a fringe whatever
          the decoder does at the texture edge. Only for clips that declare a
          backdrop; anything else would show a ring. */}
      {media.type === 'video' && media.src !== null && media.bg ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-card"
          style={{ boxShadow: `inset 0 0 0 3px ${media.bg}` }}
        />
      ) : null}
    </div>
  );
}
