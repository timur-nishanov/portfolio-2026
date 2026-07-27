import Image from 'next/image';
import { assets } from '@/data/assets';

/**
 * Non-interactive head — mobile (< 768px) and reduced-motion (TZ §14). Same
 * box the 3D stage occupies so the layout doesn't shift when three.js is skipped.
 * pointer-events-none: it sits behind the hero text and never blocks selection.
 */
export function StaticHead() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Image
        src={assets.headColor}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="(max-width: 767px) 70vw, 620px"
        className="object-contain object-center"
      />
    </div>
  );
}
