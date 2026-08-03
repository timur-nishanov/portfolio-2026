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
      {/* Row gap has to beat the gap *within* a row, or the grid reads as
          columns instead of pairs. The columns are wide and the copy is
          centred, so side-by-side awards already sit ~350px apart at 1440 —
          the rows are spaced past that. */}
      <div className="container-awards grid grid-cols-1 gap-x-0 gap-y-[clamp(130px,26vw,375px)] sm:grid-cols-2">
        {awards.map((a) => (
          <AwardCard key={a.id} award={a} />
        ))}
      </div>
    </section>
  );
}
