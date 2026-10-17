'use client';

import { useEffect, useRef, useState } from 'react';
import { menuLinks } from '@/data/menu';
import { outroText } from '@/data/outro';
import { copyText } from '@/lib/clipboard';
import { startGlassSpheres, type Glass, type GlassPaint } from '@/lib/glassSpheres';
import './outro.css';

// How long "Copied" shows under the mail's sphere, as in the menu.
const COPIED_MS = 1400;

/** Each sphere's logo, where it is on the page, smaller by what the glass
    adds: the page's own picture, drawn at the size it has there. */
const paintLogos: GlassPaint = (ctx, spheres, shrink) => {
  for (const orb of spheres) {
    const logo = orb.el.querySelector<HTMLImageElement>('.outro__logo');
    if (!logo?.complete || !logo.naturalWidth) continue;
    const size = logo.getBoundingClientRect().width * shrink;
    ctx.drawImage(logo, orb.cx - size / 2, orb.cy - size / 2, size, size);
  }
};

/**
 * The menu's links once more (data/menu), each logo under a small sphere of
 * the glass the Chums case's questions are under (lib/glassSpheres). The
 * links and their logos are the page's own, for screen readers, the keyboard
 * and browsers without WebGL, where outro.css paints a lit disc behind each.
 */
function GlassLinks() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (window.matchMedia('(forced-colors: active)').matches) return;
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    let glass: Glass | undefined;
    let gone = false;
    import('three').then((THREE) => {
      if (gone) return;
      glass = startGlassSpheres(THREE, root, canvas, '.outro__orb', paintLogos);
      // The logos are drawn again once they are all in.
      const logos = [...root.querySelectorAll<HTMLImageElement>('.outro__logo')];
      Promise.all(logos.map((img) => img.decode().catch(() => {}))).then(() => !gone && glass?.repaint());
    });
    return () => {
      gone = true;
      glass?.stop();
    };
  }, []);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const copy = async (value: string) => {
    await copyText(value);
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div ref={rootRef} className="outro__links">
      <ul className="outro__list">
        {menuLinks.map((l) => {
          const logo = (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="outro__logo" src={l.icon} alt="" width={16} height={16} draggable={false} />
          );
          return (
            <li key={l.label}>
              {l.kind === 'external' ? (
                <a className="outro__orb" href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label}>
                  {logo}
                </a>
              ) : (
                <button
                  type="button"
                  className="outro__orb"
                  aria-label={`Copy ${l.label} address`}
                  onClick={() => copy(l.value)}
                >
                  {logo}
                  <span className="outro__note" data-on={copied ? '' : undefined} aria-hidden="true">
                    {l.copiedLabel}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <canvas ref={canvasRef} className="outro__canvas" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Email address copied to the clipboard' : ''}
      </span>
    </div>
  );
}

/**
 * The end of the home page: a last word in the middle of the screen, and the
 * links under it.
 */
export function Outro() {
  return (
    <section id="contact" aria-labelledby="outro-heading" className="outro">
      <h2 id="outro-heading" className="sr-only">
        Contact
      </h2>
      <p className="outro__text">
        {outroText.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <GlassLinks />
    </section>
  );
}
