import { site } from '@/data/site';
import { FloatingHead } from './FloatingHead';
import { HeroStatus } from './HeroStatus';

export function Hero() {
  return (
    <section
      id="main"
      aria-labelledby="hero-heading"
      // The head's stage is this box: it plays inside the hero and scrolls away
      // with it, rather than trailing the reader down the page.
      className="relative flex min-h-[100svh] items-center pt-[clamp(60px,8.3vw,120px)]"
    >
      <FloatingHead />
      <div className="container-hero relative w-full">
        {/* Plain dark text — the head floats over it, so no blend mode. */}
        {/* Non-selectable — dragging/clicking the head over it kept grabbing a
            text selection, which was distracting. */}
        <h1 id="hero-heading" className="t-hero whitespace-pre-line select-none text-ink">
          {site.hero.text}
        </h1>
      </div>
      <HeroStatus />
    </section>
  );
}
