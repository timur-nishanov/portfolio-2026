/** backdrop-filter: url() only renders in Chromium. Safari parses it and
    paints nothing (the bare-patch failure globals.css also guards against),
    so the refracting filter is opted into per engine, not via @supports. */
export function canRefract() {
  if (typeof CSS === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /(Chrome|Chromium)\//.test(ua) && !/Firefox\//.test(ua) && CSS.supports('backdrop-filter', 'url(#a)');
}
