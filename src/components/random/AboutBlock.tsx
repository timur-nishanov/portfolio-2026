import { site } from '@/data/site';

/**
 * Statement block — its own section after Random (the Moneta iMac now lives in
 * the Random collage). Just the positioning line, centred (Figma text 1:282).
 */
export function AboutBlock() {
  return (
    <section aria-label="About" className="py-[clamp(48px,7vw,110px)]">
      <div className="container-hero flex flex-col items-center">
        {/* ~960px holds the line to 5 rows at the 1440 reference; it wraps to
            more on narrower desktops/tablets, which is fine. */}
        <p className="t-hero max-w-[960px] text-ink">{site.about}</p>
      </div>
    </section>
  );
}
