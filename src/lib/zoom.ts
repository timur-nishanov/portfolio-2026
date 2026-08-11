/**
 * Effective CSS zoom over an element. The desktop site runs the whole body at
 * a zoom (globals.css: --site-zoom), which splits measurements into two unit
 * systems: layout metrics — clientWidth, offsetWidth, style px — stay local,
 * while pointer events and getBoundingClientRect report visual pixels. Any
 * code that mixes the two must divide the visual side by this factor first.
 *
 * Returns 1 wherever no zoom applies (mobile, other engines), so callers can
 * divide unconditionally.
 */
export function zoomOf(el: HTMLElement): number {
  // Chromium 128+ exposes the effective zoom directly — no layout read.
  const z = (el as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom;
  if (typeof z === 'number' && z > 0) return z;
  const visual = el.getBoundingClientRect().width;
  const local = el.offsetWidth;
  return visual > 0 && local > 0 ? visual / local : 1;
}
