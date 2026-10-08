import { site } from '@/data/site';
import { FloatingHead } from './FloatingHead';
// HeroStatus (Bangkok time line) is off the new first screen — kept for later.

export function Hero() {
  return (
    <section
      id="main"
      aria-labelledby="hero-heading"
      // Exactly one screen: this box is the head's stage, so it spans the
      // viewport up to the scrollbar and the head can reach every edge; the
      // cases follow below it. Divided by the zoom like every full-viewport
      // length.
      className="relative h-[calc(100svh/var(--site-zoom))] w-full overflow-hidden"
    >
      <FloatingHead />
      {/* The tagline doubles as the page heading; the name is in the header's
          title, so screen readers get it here too. Non-selectable — throwing
          the head across it kept grabbing a text selection. Sits under the head
          (z-40), which floats over it; the blood keeps off it (Head3D). */}
      <h1
        id="hero-heading"
        data-blood-keepout=""
        className="t-title absolute inset-x-4 bottom-[21px] select-none text-center text-ink-strong"
      >
        <span className="sr-only">Timur, </span>
        {site.hero.tagline.map((line) => (
          // Balanced: on a phone the long first line splits in two even
          // halves instead of leaving one word on a line of its own.
          <span key={line} className="block text-balance">
            {line}
          </span>
        ))}
      </h1>
    </section>
  );
}
