import { site } from '@/data/site';

export function Hero() {
  return (
    <section
      id="main"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-center"
    >
      <div className="container-hero relative w-full">
        {/* The head is no longer part of this box — it floats over the whole
            viewport (see FloatingHead), so the copy is plain dark text.
            1184px at 1440 is what breaks it to five lines, per the Figma. */}
        <h1 id="hero-heading" className="t-hero text-ink">
          {site.hero.text}
        </h1>
      </div>
    </section>
  );
}
