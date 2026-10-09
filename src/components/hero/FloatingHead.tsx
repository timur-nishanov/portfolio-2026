'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StaticHead } from './StaticHead';

// three.js head — lazy chunk, client-only, loaded after first paint so it never
// blocks LCP (TZ §7.2 / §14).
const Head3D = dynamic(() => import('./Head3D').then((m) => m.Head3D), { ssr: false });

// How long the live head takes to fade in over the still one.
const FADE_MS = 500;

/**
 * Whether this browser draws WebGL on a GPU. Without one (no GPU, a
 * blocklisted driver, or a headless test browser such as PageSpeed's) WebGL
 * falls back to a software renderer that draws every frame on the main
 * thread: the live head then blocks the page for seconds on end. The browser
 * itself reports that case as a "major performance caveat"; the renderer's
 * name is checked as well, for the ones that don't.
 */
function hasFastWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const opts = { failIfMajorPerformanceCaveat: true };
    const gl = (canvas.getContext('webgl2', opts) ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * Mounts the head inside the hero. It drifts around the hero box on its own,
 * takes a throw on click/drag and bounces off the edges — on mobile too, via
 * pointer events, which already cover touch.
 *
 * The still head is drawn as soon as the page is up (centred, where the live
 * head starts), so the hero isn't left empty while three.js loads; the live
 * head takes over once it has drawn its first frame. Reduced motion, or a
 * browser without GPU-drawn WebGL, keeps the still head (no blood either) —
 * and three.js is never even downloaded.
 */
export function FloatingHead() {
  const reduced = useReducedMotion();
  // Decided after mount (the server can't know).
  const [live, setLive] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    setLive(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && hasFastWebGL());
  }, []);
  const onReady = useCallback(() => setDrawn(true), []);
  // The live head is lit by its shader, a touch darker and warmer than the
  // still picture: it fades in over it rather than replacing it outright,
  // and the still one goes once it is covered.
  useEffect(() => {
    if (!drawn) return;
    const t = window.setTimeout(() => setSettled(true), FADE_MS);
    return () => window.clearTimeout(t);
  }, [drawn]);
  const running = live && !reduced;

  return (
    <>
      {!(running && settled) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 'var(--head-size)', height: 'var(--head-size)' }}
        >
          <StaticHead />
        </div>
      )}
      {running && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 transition-opacity ease-out"
          style={{ opacity: drawn ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
        >
          <Head3D onReady={onReady} />
        </div>
      )}
    </>
  );
}
