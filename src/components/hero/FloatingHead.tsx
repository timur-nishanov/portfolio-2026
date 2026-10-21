'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StaticHead } from './StaticHead';

// three.js head — lazy chunk, client-only, loaded after first paint so it never
// blocks LCP (TZ §7.2 / §14). Asked for as soon as this module runs, with the
// page's own scripts, where it will be wanted (below): asked for from the
// first effect instead, it waited for the whole page to hydrate first, a
// step of the chain that kept the head off a phone's screen for seconds.
const Head3D = dynamic(() => (early ?? import('./Head3D')).then((m) => m.Head3D), { ssr: false });

/**
 * Whether this browser draws WebGL 2 on a GPU. Without one (no GPU, a
 * blocklisted driver, or a headless test browser such as PageSpeed's) WebGL
 * falls back to a software renderer that draws every frame on the main
 * thread: the live head then blocks the page for seconds on end. The browser
 * itself reports that case as a "major performance caveat"; the renderer's
 * name is checked as well, for the ones that don't. WebGL 2 only: three.js
 * (r163 and up) draws with nothing less, and on a browser with only the
 * first WebGL (iOS 14 and older) its renderer throws instead of drawing.
 */
let fast: boolean | null = null;
function hasFastWebGL() {
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

/** The live head, unless motion is to be reduced or there is no GPU for it. */
function wantsLiveHead() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && hasFastWebGL();
}
// The head's chunk, asked for as this module runs (see Head3D above). After
// the functions it calls and what they keep, which must exist by now.
const early = typeof window !== 'undefined' && wantsLiveHead() ? import('./Head3D') : null;

/**
 * Mounts the head inside the hero. It drifts around the hero box on its own,
 * takes a throw on click/drag and bounces off the edges — on mobile too, via
 * pointer events, which already cover touch.
 *
 * The live head comes in on its own, with no still picture standing in for it
 * first: the two never quite match (pose, light), so a hand-over reads as the
 * head freezing and then changing. Reduced motion, or a browser without
 * GPU-drawn WebGL, gets the still head instead (centred, where the live head
 * starts; no blood either) — and three.js is never even downloaded.
 */
export function FloatingHead() {
  const reduced = useReducedMotion();
  // Decided after mount (the server can't know).
  const [mode, setMode] = useState<'pending' | 'live' | 'still'>('pending');
  useEffect(() => {
    setMode(wantsLiveHead() ? 'live' : 'still');
  }, []);

  if (mode === 'pending') return null;
  // The renderer can still refuse a context the check allowed (too many on
  // the page, a GPU that just went away): the still head then, not a blank.
  if (mode === 'live' && !reduced) return <Head3D onFail={() => setMode('still')} />;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ width: 'var(--head-size)', height: 'var(--head-size)' }}
    >
      <StaticHead />
    </div>
  );
}
