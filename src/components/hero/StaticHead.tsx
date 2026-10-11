'use client';

import { useEffect, useRef } from 'react';
import { assets } from '@/data/assets';

// The live head is lit by its shader: darker, warmer and richer than the bare
// texture. Matched by eye-and-numbers, so the still head reads as the same one.
const LIGHT = 'brightness(0.8) contrast(0.9) saturate(1.35)';

/**
 * Non-interactive head — reduced motion and browsers without GPU-drawn WebGL
 * (FloatingHead). Same box the 3D stage occupies so the layout doesn't shift
 * when three.js is skipped.
 * pointer-events-none: it sits behind the hero text and never blocks
 * selection.
 *
 * Drawn on a canvas once the page is up, like the live head, rather than an
 * img in the markup: the first screen then paints its text at once, and the
 * picture — the largest thing on it — doesn't hold back the page's first
 * paint on a slow phone. Half-size file on a 1x screen, the full one beyond.
 */
export function StaticHead() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const baked = 'filter' in ctx;
    if (baked) canvas.style.filter = 'none';
    const img = new Image();
    let src = '';
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      const want = w > 700 ? assets.headColor : assets.headStill;
      if (want !== src) {
        src = want;
        img.src = want;
        return; // drawn on load
      }
      if (!img.complete || !img.naturalWidth) return;
      canvas.width = w;
      canvas.height = h;
      // object-fit: contain, centred.
      const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      // Baked into the pixels once, where the canvas can: as a CSS filter the
      // compositor ran it again on every frame the page scrolled.
      if (baked) ctx.filter = LIGHT;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    img.onload = draw;
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      img.onload = null;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* The light as a CSS filter only where the canvas can't bake it in. */}
      <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ filter: LIGHT }} />
    </div>
  );
}
