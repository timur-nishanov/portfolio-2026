import { assets } from '@/data/assets';
import { site } from '@/data/site';
import { FloatingHead } from './FloatingHead';

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
      {/* The head's picture goes on the wire with the page, not after it:
          the head is drawn from script, so without this the browser only
          learned of its texture after the scripts had arrived, run and asked
          for it, and on a phone the first screen stood empty for seconds.
          Either head draws it (the still one too), and as three.js asks for
          it (crossOrigin anonymous), so the preload is the same cache entry.
          The depth map is small and the live head's alone: it comes with
          the head's own script. A link in the tree, hoisted into the head,
          rather than react-dom's preload(): that one rode along as a hint
          in the page's payload, which a case page prefetches for its way
          back, and fetched the 200 KB there for a visitor who may never
          come home. */}
      <link rel="preload" as="image" href={assets.headColor} fetchPriority="high" crossOrigin="anonymous" />
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
