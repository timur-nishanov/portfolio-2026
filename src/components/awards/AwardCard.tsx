import type { Award } from '@/data/awards';
import { MagneticButton } from '@/components/header/MagneticButton';
import { Laurels } from './Laurels';

/** Award card — 684x520 at 1440, laurels and button centred (Figma). */
export function AwardCard({ award }: { award: Award }) {
  return (
    <article className="flex h-full flex-col items-center px-4 text-center">
      <Laurels tier={award.tier} />
      {/* Same type as the case cards: 40px title, 20px body, both regular. */}
      <h3 className="t-case-title mt-[clamp(20px,3.3vw,48px)] max-w-[22ch] text-ink">
        {award.title}
      </h3>
      <p className="t-body mt-[clamp(12px,1.7vw,24px)] max-w-[46ch] text-ink-muted">
        {award.description}
      </p>
      {/* mt-auto eats the leftover row height so the button lands on the same
          baseline across a row regardless of how many lines the title/description
          wrap to (grid already equal-heights the row via align-items: stretch). */}
      <div className="mt-auto pt-[clamp(20px,3vw,44px)]">
        <MagneticButton
          as="a"
          href={award.href}
          className="glass rounded-full"
          labelClassName="pixel text-ink"
          style={{ width: 'clamp(110px, 12.29vw, 177px)', height: 'var(--btn-h)' }}
        >
          MORE
        </MagneticButton>
      </div>
    </article>
  );
}
