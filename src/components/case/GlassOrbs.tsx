'use client';

import { useEffect, useRef } from 'react';
import { startGlassSpheres, type Glass, type GlassPaint } from '@/lib/glassSpheres';
import { hasFastWebGL } from '@/lib/webgl';
import './glass-orbs.css';

type Item = { title: string; text: string };

/*
 * Three questions, each under a sphere of glass (lib/glassSpheres). The text
 * under each sphere is the page's own (the <li>, for screen readers and for
 * browsers without WebGL, where glass-orbs.css paints a lit disc behind it);
 * the glass shows the same words, drawn into its texture in the page's own
 * type.
 */

// The text block no wider than this share of the diameter: within the flat
// middle, clear of the rim, where the glass pulls the page out. A sphere
// larger than TEXT_REF keeps the measure it has at that size, so its words
// stay as they are, in its middle.
const TEXT_WIDTH = 0.54;
const TEXT_REF = 320;

/** Lines no wider than maxW, and as even as they can be: the greedy wrap's
    count, at the narrowest width that still gives it (text-wrap: balance). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines = (w: number) => {
    const out: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > w) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };
  const n = lines(maxW).length;
  let lo = maxW * 0.3;
  let hi = maxW;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (lines(mid).length > n) lo = mid;
    else hi = mid;
  }
  return lines(hi);
}

/** The words of each sphere, where they are on the page, in the page's own
    type, smaller by what the glass adds. */
const paintWords: GlassPaint = (ctx, spheres, s) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const orb of spheres) {
    const title = orb.el.querySelector<HTMLElement>('.go__title');
    const text = orb.el.querySelector<HTMLElement>('.go__p');
    if (!title || !text) continue;
    const maxW = Math.min(orb.r * 2, TEXT_REF) * TEXT_WIDTH * s;
    const font = (el: HTMLElement) => {
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) * s;
      ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${parseFloat(cs.letterSpacing) * s || 0}px`;
      return { lh: parseFloat(cs.lineHeight) * s, color: cs.color, gap: parseFloat(cs.marginTop) * s || 0 };
    };
    const t = font(title);
    const titleLines = wrap(ctx, title.textContent ?? '', maxW);
    const p = font(text);
    const textLines = wrap(ctx, text.textContent ?? '', maxW);
    const total = titleLines.length * t.lh + p.gap + textLines.length * p.lh;
    // A touch below the middle, where the eye puts the middle of a circle.
    let y = orb.cy - total / 2 + orb.r * 0.03;
    font(title);
    ctx.fillStyle = t.color;
    for (const line of titleLines) {
      ctx.fillText(line, orb.cx, y + t.lh * 0.72);
      y += t.lh;
    }
    y += p.gap;
    font(text);
    ctx.fillStyle = p.color;
    for (const line of textLines) {
      ctx.fillText(line, orb.cx, y + p.lh * 0.72);
      y += p.lh;
    }
  }
};

export function GlassOrbs({ items }: { items: Item[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // Where colours or transparency are turned off, the painted disc is the
    // one that follows the setting.
    if (window.matchMedia('(forced-colors: active)').matches) return;
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    // No GPU (lib/webgl): the plain orbs stay, and three.js is not fetched.
    if (!hasFastWebGL()) return;
    let glass: Glass | undefined;
    let gone = false;
    // three.js (lib/three) comes in only here, and only once the spheres are a screen
    // and a half off: the case opens on its words, and the chapters before
    // this one are read before the glass is wanted.
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearby.disconnect();
        import('@/lib/three').then((THREE) => {
          if (gone) return;
          glass = startGlassSpheres(THREE, root, canvas, '.go__orb', paintWords);
          // The words are drawn again once the face is in: before, the texture
          // held the fallback face. Shown at once, not on the next move.
          document.fonts?.ready.then(() => !gone && glass?.repaint()).catch(() => {});
        });
      },
      // The case layer's own scroll box as the root, else its margin is
      // clipped off by that box (useLazyVideo).
      { root: root.closest<HTMLElement>('.cp__scroll'), rootMargin: '150% 0px' },
    );
    nearby.observe(root);
    return () => {
      gone = true;
      nearby.disconnect();
      glass?.stop();
    };
  }, []);

  return (
    <div ref={rootRef} className="go cp-reveal">
      <ol className="go__list">
        {items.map((item) => (
          <li key={item.title} className="go__orb">
            <div className="go__text">
              <h3 className="go__title">{item.title}</h3>
              <p className="go__p">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <canvas ref={canvasRef} className="go__canvas" aria-hidden="true" />
    </div>
  );
}
