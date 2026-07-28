import { site } from '@/data/site';

/**
 * Statement block — its own section after Random (the Moneta iMac now lives in
 * the Random collage). Just the positioning line, centred (Figma text 1:282).
 */
export function AboutBlock() {
  return (
    <section aria-label="About" className="py-[clamp(48px,7vw,110px)]">
      {/* Wider than container-hero (which caps at 1184 content px, shared with
          the Hero paragraph) — this block needs ~1250px to hold the line to 4
          rows at the 1440 reference, confirmed via measurement (1220px→5
          lines, 1225px→4). It wraps to more on narrower desktops/tablets,
          which is fine. */}
      <div className="mx-auto flex w-full max-w-[1298px] flex-col items-center px-6">
        <p className="t-hero max-w-[1250px] text-ink">{site.about}</p>
      </div>
    </section>
  );
}
