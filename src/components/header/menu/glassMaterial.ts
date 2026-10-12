/**
 * The site's one glass: the material of the case's spheres (case/GlassOrbs),
 * worn by the flat surfaces too — the 20px disc, the header pill and the
 * menu that grows out of the disc. A sphere's bevel is its whole face; a
 * slab's is a band along its edge, scaled to its corner radius R, and its
 * middle stays flat and readable. Term for term, from the spheres' shader:
 *
 * - the bend: what lies just past the edge is pulled in and squeezed along
 *   it (the filters' displacement). One bend for all three colours: the
 *   spheres' split (DISPERSION 0.006) run per colour through an SVG filter
 *   and summed back left opaque streaks wherever a pass sampled past the
 *   backdrop, and at this size it could not be seen through the frost;
 * - the edge: a bright white line at the very rim, all the way round
 *   (mix to white, 0.85, in the outer 1.6% of the radius; a touch more here,
 *   as the slab's line is thinner);
 * - the thickness: a slightly darker band just inside that line (×0.86 at
 *   its deepest), which shows wherever the light does not cover it — the
 *   lower left and the upper right;
 * - the light: a broad crescent gathered along the upper-left rim, full
 *   white at the edge, as the spheres' rim reads (up³ · 0.45 in the outer
 *   tenth over a bright body), a fainter one opposite (down³ · 0.2), and the
 *   white sky the rim mirrors (Fresnel, 30% at grazing angles);
 * - the sheen across the top half stays each surface's own gradient.
 *
 * glassEdge() writes those as inset shadows, so every engine draws them —
 * Safari and Firefox, which keep a plain frost under them, included. The CSS
 * copies (the disc and the pill in globals.css and menu.css) are this
 * function's output for their radius; the menu's shape writes it every frame
 * for the radius it has (useLiquidMorph), so the drop that leaves the disc
 * wears the disc's edge and the panel the panel's, with no step between.
 */

const px = (v: number) => `${Number(v.toFixed(2))}px`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The edge of a glass surface whose corners (or ends) have radius R (CSS px):
 * inset layers only, the topmost first. The outer drop is each surface's own.
 */
export function glassEdge(R: number) {
  // The bright line, and the band of the glass's thickness inside it: a
  // pixel on a panel, under one on the 20px disc, the spheres' share of the
  // radius on a ball.
  const line = Math.max(Math.min(1, 0.25 + 0.03 * R), 0.01 * R);
  const thick = 0.6 + 0.06 * R;
  // The broad band the light gathers in, up and to the left, and the
  // narrower reach of the counter-light and of the sky.
  const band = Math.max(2.4, 0.43 * R);
  const lit = Math.max(2.4, 0.28 * R);
  return [
    `inset 0 0 0 ${px(line)} rgba(255,255,255,0.9)`,
    // Up and to the left: full white along the top and the top-left corner.
    `inset ${px(0.37 * band)} ${px(0.63 * band)} ${px(band)} ${px(-0.17 * band)} rgba(255,255,255,1)`,
    // Down and to the right, fainter.
    `inset ${px(-0.3 * lit)} ${px(-0.4 * lit)} ${px(0.75 * band)} ${px(-0.2 * lit)} rgba(255,255,255,0.6)`,
    // The sky in the rim.
    `inset 0 0 ${px(0.6 * lit)} rgba(255,255,255,0.45)`,
    // Thickness.
    `inset 0 0 ${px(0.8 * thick)} ${px(line + 0.5 * thick)} rgba(20,20,26,0.11)`,
  ].join(', ');
}

/** The disc's (R 10) and the panel's (R 24) outer drop, blended by m. */
export function glassDrop(m: number) {
  const a = (v: number) => v.toFixed(3);
  return (
    `0 0 0 0.5px rgba(0,0,0,${a(lerp(0.08, 0.06, m))}), ` +
    `0 ${px(lerp(1, 2, m))} ${px(lerp(3, 6, m))} rgba(0,0,0,${a(lerp(0.08, 0.04, m))}), ` +
    `0 ${px(lerp(4, 10, m))} ${px(lerp(10, 36, m))} rgba(0,0,0,${a(lerp(0.05, 0.09, m))})`
  );
}
