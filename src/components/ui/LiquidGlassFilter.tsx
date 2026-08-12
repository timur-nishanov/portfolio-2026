/**
 * The one displacement filter every glass surface points at — header pills,
 * buttons, footer spheres, the case-study balls and the close button all run
 * this exact filter, so the glass reads the same everywhere.
 *
 * Rendered once, hidden, at the top of the document. `backdrop-filter: url()`
 * is Chromium-only, so this is strictly an enhancement — the base `.glass` rule
 * keeps a plain blur and every other engine simply stays on it (globals.css).
 *
 * The map is built from two separable edge ramps rather than a circular lens
 * image: red carries X displacement, green carries Y, 128 is zero. A radial map
 * is only correct on a sphere — stretched across the 716×80 nav pill its ring
 * turned into a diagonal smear that doubled the text behind the header. Ramps
 * refract along whichever edge is near, so one map fits a pill and a sphere
 * alike. Both fall back to neutral at the very rim, so the displacement never
 * samples past the end of the backdrop.
 */

const svgRamp = (horizontal: boolean, stops: [number, number][]) => {
  const g = stops
    .map(([o, v]) => `<stop offset='${o}' stop-color='rgb(${horizontal ? `${v},0,0` : `0,${v},0`})'/>`)
    .join('');
  const dir = horizontal ? '' : ` x2='0' y2='1'`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><defs><linearGradient id='g'${dir}>${g}</linearGradient></defs><rect width='64' height='64' fill='url(%23g)'/></svg>`;
  return `data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}`;
};

// The lens lives in the outer ~20% horizontally and ~42% vertically, peaks a
// touch harder, and still leaves the middle flat so whatever sits on the glass
// is never distorted. Wider than the first cut (14%/30%) — the effect wanted
// more presence, and widening the band bends more of the backdrop without the
// edge artefacts that only raising the scale brings.
const RAMP_X = svgRamp(true, [
  [0, 128],
  [0.06, 12],
  [0.2, 128],
  [0.8, 128],
  [0.94, 244],
  [1, 128],
]);
const RAMP_Y = svgRamp(false, [
  [0, 128],
  [0.12, 12],
  [0.42, 128],
  [0.58, 128],
  [0.88, 244],
  [1, 128],
]);

// Displacement in pixels. A lens bends by a fraction of its own size, so one
// absolute value cannot serve an 80px pill and a 616px sphere: 36px across a
// 64px button is more than its radius, and a hard-edged graphic behind it comes
// back around the rim as a recognisable ghost. Small surfaces get `#lg-sm`;
// everything else keeps `#lg`. Same map, same frost, same rim — only the depth
// of the refraction scales with the thing doing the refracting.
// Only the displacement differs between the two. A denser frost was tried for
// the small one and backfired: the pad has to grow with the blur radius, the
// pad is a percentage of the element, and on a 1053x64 header pill that meant
// half a screen of empty region either side — which the blur then averaged into
// the middle, leaving the bar less frosted than before, not more. Legibility on
// a small surface is the plate's job (see .case-close), not the frost's.
// Each family carries its own region padding, sized for its geometry. The pad
// exists in *pixels* — the filter has to reach past the box by the displacement
// (scale × ~0.46) plus the blur tail (~3σ ≈ 21px), about 45px for the deep
// lenses — but SVG regions are percentages of the element. One shared
// percentage broke as soon as the lens deepened: 25% of a 64px-tall pill is
// 16px, the blur ran out of real pixels and averaged transparent black into
// the rim, which is what read as the frost "not filling" the header.
//   lg      pills and buttons — short vertical axis, so the Y pad dominates
//   lg-deep spheres, hundreds of px across — modest percentages suffice
//   lg-sm   small round buttons — tiny both ways, so both pads run large
const SCALES = [
  { id: 'lg', scale: 52, padX: 30, padY: 80 },
  { id: 'lg-deep', scale: 68, padX: 25, padY: 25 },
  { id: 'lg-sm', scale: 14, padX: 50, padY: 50 },
];
const BLUR = 7;
// The frost is part of this chain, not a separate CSS blur: backdrop-filter
// takes one value, so a url() filter replaces the blur rather than joining it.
// A blur inside a filter samples transparent black outside the filter region,
// which is what left the header frosted in the middle and sharp at the ends —
// the region is padded by more than the blur radius so the edges have real
// pixels to average. Result is still clipped to the element's border box.


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
        {SCALES.map(({ id, scale, padX, padY }) => (
        <filter
          key={id}
          id={id}
          x={`-${padX}%`}
          y={`-${padY}%`}
          width={`${100 + 2 * padX}%`}
          height={`${100 + 2 * padY}%`}
          colorInterpolationFilters="sRGB"
        >
          {/* preserveAspectRatio="none" so one ramp fits a pill as well as a
              sphere. Primitive subregions are relative to the element box, so
              padding the filter region above does not shift the map off it. */}
          <feImage href={RAMP_X} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="rampX" />
          <feImage href={RAMP_Y} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="rampY" />
          <feComposite in="rampX" in2="rampY" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="map" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={BLUR} result="frost" />
          {/* One displacement pass, deliberately. Chromatic aberration — the
              signature move in the WebGL glass libraries — was tried here as
              three passes recombined per channel: it cost three times the
              frame budget and, against a pixel font, read as red/blue ghosting
              rather than dispersion. Not worth either price. */}
          <feDisplacementMap in="frost" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        ))}
      </defs>
    </svg>
  );
}
