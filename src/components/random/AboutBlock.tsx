import { site } from '@/data/site';

/**
 * Statement block — its own section after Random (the Moneta iMac now lives in
 * the Random collage). Just the positioning line, centred (Figma text 1:282).
 */
export function AboutBlock() {
  return (
    <section aria-label="About" className="py-[clamp(48px,7vw,110px)]">
      <div className="container-hero flex flex-col items-center">
        <p className="t-hero max-w-[1000px] text-ink">{site.about}</p>
      </div>
    </section>
  );
}
