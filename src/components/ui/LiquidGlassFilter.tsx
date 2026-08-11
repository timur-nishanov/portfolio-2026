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

/**
 * Edge-ramp gradients for the pill filter below. The circular lens map reads
 * right on spheres, but stretched over the 716×80 nav pill its radial ring
 * turned into a wide diagonal smear — that was the "weird refraction" on the
 * header. A pill wants separable ramps instead: X displacement confined to the
 * rounded end caps, Y displacement to a thin band along the top and bottom.
 *
 * Channel convention matches lens-map.png: 128 is zero, the ramp dips/peaks a
 * little in from the edge and falls back to neutral at the very rim so the
 * displacement never samples past the end of the backdrop. The two ramps are
 * summed inside the filter (X carries red, Y carries green).
 */
const svgRamp = (horizontal: boolean, stops: [number, number][]) => {
  const g = stops
    .map(([o, v]) => {
      const rgb = horizontal ? `${v},0,0` : `0,${v},0`;
      return `<stop offset='${o}' stop-color='rgb(${rgb})'/>`;
    })
    .join('');
  const dir = horizontal ? '' : ` x2='0' y2='1'`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><defs><linearGradient id='g'${dir}>${g}</linearGradient></defs><rect width='64' height='64' fill='url(%23g)'/></svg>`;
  return `data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}`;
};

// End caps: the ramp lives in the outer ~14% of the width — about the radius
// of the rounded end on the nav pill, so the "lens" hugs the caps only.
const PILL_RAMP_X = svgRamp(true, [
  [0, 128],
  [0.05, 16],
  [0.14, 128],
  [0.86, 128],
  [0.95, 240],
  [1, 128],
]);
// Top/bottom: a thin band — ~30% of the 80px height, mirroring the sphere map.
const PILL_RAMP_Y = svgRamp(false, [
  [0, 128],
  [0.1, 16],
  [0.3, 128],
  [0.7, 128],
  [0.9, 240],
  [1, 128],
]);
const PILL_SCALE = 40;
const PILL_BLUR = 5;

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
            {/* One displacement pass, deliberately. Chromatic aberration — the
                signature move in the WebGL glass libraries — was tried here as
                three passes recombined per channel: it cost three times the
                frame budget and, against a pixel font, read as red/blue ghosting
                rather than dispersion. Not worth either price. */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
        {/* Pill surfaces (the header). Separable edge ramps summed into one
            map, plus a soft frost pass — the header area is small enough that
            the blur costs little, and displaced-but-crisp text underneath was
            half of what looked wrong. */}
        <filter
          id="lg-pill"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feImage href={PILL_RAMP_X} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="rampX" />
          <feImage href={PILL_RAMP_Y} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="rampY" />
          <feComposite in="rampX" in2="rampY" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="map" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={PILL_BLUR} result="frost" />
          <feDisplacementMap in="frost" in2="map" scale={PILL_SCALE} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
