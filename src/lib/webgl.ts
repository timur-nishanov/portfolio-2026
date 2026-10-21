/**
 * Whether this browser draws WebGL 2 on a GPU. Without one (no GPU, a
 * blocklisted driver, or a headless test browser such as PageSpeed's) WebGL
 * falls back to a software renderer that draws every frame on the main
 * thread: the live head then blocks the page for seconds on end, and the
 * glass (twelve rays a pixel over five balls) stalls the last screen. The
 * browser itself reports that case as a "major performance caveat"; the
 * renderer's name is checked as well, for the ones that don't (Chrome's
 * headless SwiftShader passes the flag). WebGL 2 only: three.js (r163 and
 * up) draws with nothing less, and on a browser with only the first WebGL
 * (iOS 14 and older) its renderer throws instead of drawing.
 *
 * Asked by the head (hero/FloatingHead), the balls (outro/Outro) and the
 * orbs (case/GlassOrbs), before any of them fetches three.js; probed once.
 */
let fast: boolean | null = null;
export function hasFastWebGL() {
  if (fast !== null) return fast;
  return (fast = probeWebGL());
}
function probeWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}
