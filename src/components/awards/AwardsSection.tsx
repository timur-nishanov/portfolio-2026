import { awards } from '@/data/awards';
import { AwardCard } from './AwardCard';

export function AwardsSection() {
  return (
    <section
      id="awards"
      aria-labelledby="awards-heading"
      className="pt-[clamp(64px,8vw,120px)] pb-[clamp(110px,15vw,220px)]"
    >
      <h2 id="awards-heading" className="sr-only">
        Awards
      </h2>
      {/* 2 columns of 684 at 1440. Row gap pulled in from the old 178 now the
          cards are just laurel + title + source (no blurb or MORE button). */}
      {/* Rows sit the same distance apart as two awards within a row (~250px
          of clear space at 1440), so the grid reads as an even field. */}
      <div className="container-awards grid grid-cols-1 gap-x-0 gap-y-[clamp(60px,12vw,173px)] sm:grid-cols-2">
        {awards.map((a) => (
          <AwardCard key={a.id} award={a} />
        ))}
      </div>
    </section>
  );
}
