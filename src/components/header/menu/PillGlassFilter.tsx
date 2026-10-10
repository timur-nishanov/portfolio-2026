export const PILL_GLASS_FILTER_ID = 'lg-pill';

// The header pill's liquid glass (Chromium, as backdrop-filter: url()). The
// same construction as the menu's filter — a ramp blurred off the shape and
// differentiated into a displacement map, so the rim bends what lies just
// beyond the glass — tuned the way iOS 26/27 glass looks rather than the
// menu's frost: clear glass (barely any blur, more colour), a stronger lens
// at the edge, and a touch of chromatic dispersion there, red bent a little
// less than blue. The shape is a real pill (an SVG rounded rect fed in via
// feImage), not a blurred rectangle, so the lens follows the round ends.

// Width of the refracting rim (σ of the ramp), and the slope step.
const RIM = 5;
const STEP = 3;
// How far the rim reaches out, per channel: dispersion.
const BEND = { r: 54, g: 62, b: 70 };
// Clear glass: the backdrop is only softened, and its colour lifted.
const SOFTEN = 2.2;
const SATURATE = 1.6;
const INVERT = '-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  0 0 0 1 0';
const PAD = 32;

function pillImage(w: number, h: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${h / 2}" fill="#fff"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Props = {
  width: number;
  height: number;
  /** Another id, for a second shape on the page (the round buttons). */
  id?: string;
  /** Scales the rim and the bend, for shapes far smaller than the pill. */
  scale?: number;
};

/** Sized to the pill (its CSS box), so the lens hugs its edge exactly. */
export function PillGlassFilter({ width, height, id = PILL_GLASS_FILTER_ID, scale = 1 }: Props) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const channel = (c: 'r' | 'g' | 'b') => {
    const row = {
      r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
      g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
      b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
    }[c];
    return (
      <>
        <feDisplacementMap
          in="glass"
          in2="map"
          scale={BEND[c] * scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result={`bent-${c}`}
        />
        <feColorMatrix in={`bent-${c}`} type="matrix" values={row} result={`only-${c}`} />
      </>
    );
  };
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
          id={id}
          filterUnits="userSpaceOnUse"
          x={-PAD}
          y={-PAD}
          width={w + PAD * 2}
          height={h + PAD * 2}
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodColor="#000" result="black" />
          <feImage href={pillImage(w, h)} x="0" y="0" width={w} height={h} result="pill" />
          <feComposite in="pill" in2="black" operator="over" result="shape" />
          <feGaussianBlur in="shape" stdDeviation={RIM * scale} result="ramp" />
          <feOffset in="ramp" dx={STEP * scale} result="xBack" />
          <feOffset in="ramp" dx={-STEP * scale} result="xFwd" />
          <feColorMatrix in="xFwd" type="matrix" values={INVERT} result="xFwdInv" />
          <feComposite in="xBack" in2="xFwdInv" operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result="dx" />
          <feOffset in="ramp" dy={STEP * scale} result="yBack" />
          <feOffset in="ramp" dy={-STEP * scale} result="yFwd" />
          <feColorMatrix in="yFwd" type="matrix" values={INVERT} result="yFwdInv" />
          <feComposite in="yBack" in2="yFwdInv" operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result="dy" />
          <feColorMatrix in="dx" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapX" />
          <feColorMatrix in="dy" type="matrix" values="0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapY" />
          <feBlend in="mapX" in2="mapY" mode="lighten" result="map" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={SOFTEN} result="soft" />
          <feColorMatrix in="soft" type="saturate" values={String(SATURATE)} result="glass" />
          {channel('r')}
          {channel('g')}
          {channel('b')}
          <feComposite in="only-r" in2="only-g" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="rg" />
          <feComposite in="rg" in2="only-b" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
      </defs>
    </svg>
  );
}
