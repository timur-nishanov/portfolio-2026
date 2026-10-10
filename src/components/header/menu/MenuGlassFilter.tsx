import type { Ref } from 'react';

export const MENU_GLASS_FILTER_ID = 'lg-menu';

// Frost σ measured off the mockup: the hair behind the panel blurs over ~18px
// (10–90%), i.e. σ ≈ 7–8.
export const MENU_FROST = 8;
// Colour lift of what shows through the frost.
export const MENU_SATURATE = 1.2;
// The lip is clearer glass: a thin band along the edge shows the backdrop
// only lightly softened, bent by the rim, before the frost takes over.
const CLEAR = 2.5;
// Width of the refracting rim: the shape's edge is blurred by this σ and the
// slope of that ramp becomes the displacement, so the bend peaks at the edge
// and has died out ~2σ in — the middle of the menu stays optically flat.
const RIM = 6;
// Finite-difference step for the slope, in px.
const STEP = 4;
// Neutral-grey inverse used to turn "a − b" into the 0.5-centred map value
// without the alpha channel tagging along (see the composite below).
const INVERT = '-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  0 0 0 1 0';
// Lip mask from the same ramp: alpha = 0.9·(1 − ramp) — 0.45 at the edge
// (ramp 0.5), gone ~2σ in. Kept well under 1: at full strength busy content
// (hair) streaked the rim, and the mockup's edge is calm.
const LIP = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 0.9';

type Props = {
  filterRef: Ref<SVGFilterElement>;
  floodRef: Ref<SVGFEFloodElement>;
  displaceRef: Ref<SVGFEDisplacementMapElement>;
  /** The frost and the colour lift: the morph starts them at the button
      disc's clearer glass (#lg-disc) and ends them at the panel's. */
  frostRef: Ref<SVGFEGaussianBlurElement>;
  saturateRef: Ref<SVGFEColorMatrixElement>;
};

/**
 * The menu's own liquid-glass filter (Chromium; other engines keep the CSS
 * blur fallback in menu.css). A sibling of the site-wide #lg filters, not a
 * change to them: those stretch a fixed ramp image over the element, which is
 * fine for a pill that never changes size but would make the rim fatten and
 * thin as the menu morphs from a 20px drop into a 207px panel.
 *
 * Instead the displacement map is generated from the shape itself: a white
 * flood exactly the element's size (useLiquidMorph rewrites its width/height
 * every frame) on black, blurred into a ramp, differentiated in x and y. The
 * gradient points inward from every edge, which feDisplacementMap turns into
 * outward sampling — the rim shows a squeezed band of what lies just beyond
 * the glass. The same ramp masks in a nearly clear lip, so that band reads as
 * bent glass rather than more frost. Corners come out rounded for free from
 * the blur. Region and flood are in user space (= the element's own px), set
 * from JS; the values here are only the resting panel's.
 */
export function MenuGlassFilter({ filterRef, floodRef, displaceRef, frostRef, saturateRef }: Props) {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter
          ref={filterRef}
          id={MENU_GLASS_FILTER_ID}
          filterUnits="userSpaceOnUse"
          x="-48"
          y="-48"
          width="343"
          height="478"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodColor="#000" result="black" />
          <feFlood ref={floodRef} floodColor="#fff" x="0" y="0" width="207" height="342" result="white" />
          <feComposite in="white" in2="black" operator="over" result="shape" />
          <feGaussianBlur in="shape" stdDeviation={RIM} result="ramp" />
          {/* x slope: ramp(x−s) − ramp(x+s), packed as 0.5 + ½·slope. The
              second term goes in inverted (1 − v) so the arithmetic needs no
              constant: k4 would be added to alpha too and corrupt the map. */}
          <feOffset in="ramp" dx={STEP} result="xBack" />
          <feOffset in="ramp" dx={-STEP} result="xFwd" />
          <feColorMatrix in="xFwd" type="matrix" values={INVERT} result="xFwdInv" />
          <feComposite in="xBack" in2="xFwdInv" operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result="dx" />
          <feOffset in="ramp" dy={STEP} result="yBack" />
          <feOffset in="ramp" dy={-STEP} result="yFwd" />
          <feColorMatrix in="yFwd" type="matrix" values={INVERT} result="yFwdInv" />
          <feComposite in="yBack" in2="yFwdInv" operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result="dy" />
          <feColorMatrix in="dx" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapX" />
          <feColorMatrix in="dy" type="matrix" values="0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapY" />
          <feBlend in="mapX" in2="mapY" mode="lighten" result="map" />
          {/* Frost inside, a nearly clear lip at the edge. */}
          <feColorMatrix in="ramp" type="matrix" values={LIP} result="lipMask" />
          <feGaussianBlur ref={frostRef} in="SourceGraphic" stdDeviation={MENU_FROST} result="frost" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={CLEAR} result="clear" />
          <feComposite in="clear" in2="lipMask" operator="in" result="lip" />
          <feComposite in="lip" in2="frost" operator="over" result="glass" />
          <feColorMatrix
            ref={saturateRef}
            in="glass"
            type="saturate"
            values={String(MENU_SATURATE)}
            result="glassSat"
          />
          <feDisplacementMap
            ref={displaceRef}
            in="glassSat"
            in2="map"
            scale="110"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
