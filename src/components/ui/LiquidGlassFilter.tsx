/**
 * The one displacement filter every glass surface points at.
 *
 * Rendered once, hidden, at the top of the document. `backdrop-filter:
 * url(#lg-*)` is Chromium-only, so this is strictly an enhancement — the base
 * `.glass` rule keeps a plain blur and every other engine simply stays on it
 * (see globals.css).
 *
 * The map is a real lens normal map (public/glass/lens-map.png): red carries X
 * displacement, green carries Y, #808080 is zero. It is flat through the middle
 * and ramps hard over the outer third, so the surface refracts at its rim and
 * leaves the centre — where the label sits — undistorted.
 *
 * Three strengths are published so the look can be dialled without touching the
 * markup: point `--lg-filter` at whichever one reads best.
 */
const MAP = '/glass/lens-map.png';

// The map now falls back to zero displacement at the very rim, so these can run
// much harder than before without the edge sampling past the element.
//
// No blur pass: profiling the drop showed the displacement alone at this
// strength costs about a third of the frame budget, and the brief's remedy —
// drop the blur, ease the scale — bought most of it back. The frost is no loss
// either; the refraction is doing the work now.
const STRENGTHS = [
  { id: 'lg-soft', scale: 34 },
  { id: 'lg', scale: 62 },
  { id: 'lg-strong', scale: 96 },
];

export function LiquidGlassFilter() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {STRENGTHS.map(({ id, scale }) => (
          <filter
            key={id}
            id={id}
            // Region stays on the element box: the map's neutral centre has to
            // line up with the surface, and growing the region shifts the map
            // off it, which killed the refraction entirely. The displacement
            // scale is kept modest instead, so the rim samples only just past
            // the edge rather than off the end of the backdrop.
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            {/* preserveAspectRatio="none" so the circular map stretches to fit
                a pill as well as it fits a sphere. */}
            <feImage
              href={MAP}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
