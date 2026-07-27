'use client';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StaticHead } from './StaticHead';

// three.js head — lazy chunk, client-only, loaded after first paint so it never
// blocks LCP (TZ §7.2 / §14).
const Head3D = dynamic(() => import('./Head3D').then((m) => m.Head3D), { ssr: false });

/**
 * Mounts the head inside the hero. On desktop it drifts around the hero box on
 * its own, takes a throw on click/drag and bounces off the edges. On mobile and
 * under reduced motion three.js never loads and it is a still image instead.
 */
export function FloatingHead() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  if (isMobile || reduced) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[78%] z-40 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'var(--head-size)', height: 'var(--head-size)' }}
      >
        <StaticHead />
      </div>
    );
  }

  return <Head3D />;
}
