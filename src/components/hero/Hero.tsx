'use client';

import dynamic from 'next/dynamic';
import { site } from '@/data/site';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StaticHead } from './StaticHead';

// three.js head — lazy chunk, client-only, loaded after first paint so it never
// blocks LCP (TZ §7.2 / §14). Static head shown until (and instead of) it.
const Head3D = dynamic(() => import('./Head3D').then((m) => m.Head3D), {
  ssr: false,
  loading: () => <StaticHead />,
});

export function Hero() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const use3D = !isMobile && !reduced;

  return (
    <section
      id="main"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      <div className="container-x relative w-full">
        <div className="relative mx-auto max-w-[1184px]">
          {/* Head layer — sits BEHIND the text in paint order. The text's
              mix-blend-difference blends against it, which is what turns the
              overlapping words blue and the rest black (Figma node 1:281). */}
          <div
            className="absolute right-[-4%] top-1/2 z-0 aspect-square w-[58%] max-w-[640px] -translate-y-1/2 sm:right-[2%]"
            aria-hidden="true"
          >
            {use3D ? <Head3D /> : <StaticHead />}
          </div>

          <h1
            id="hero-heading"
            className="relative z-10 text-center font-hoves text-[clamp(34px,6.2vw,72px)] font-normal leading-[1.32] text-white [mix-blend-mode:difference]"
          >
            {site.hero.text}
          </h1>
        </div>
      </div>
    </section>
  );
}
