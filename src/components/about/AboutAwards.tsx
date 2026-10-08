'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { aboutText, awardPosters } from '@/data/about';
import './about.css';

// Scroll lengths, in screen heights (also feed the section's height in CSS).
const LEAD = 0.05; // the text alone before the first diploma comes up
const PER = 0.85; // scroll per diploma
const DWELL = 0.45; // the finished stack holds before the block lets go
// Where each new diploma settles (its top), and how much of the one before
// stays showing above it. Every arrival pushes the earlier ones up by a
// shrinking share (STRIP, STRIP·R, STRIP·R², …), so they gather in ever
// thinner slivers at the top and fade out under the top edge.
const LINE = 0.32; // of the screen height
const STRIP = 0.17; // of a diploma's height
const R = 0.55;

// Once the stage holds, the text slows from scroll speed to TEXT_SPEED of it
// over the first TEXT_EASE screen heights, so the diplomas catch it up.
const TEXT_SPEED = 0.18;
const TEXT_EASE = 0.2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * About me, with the award diplomas coming up over it (#awards, the menu's
 * "Awards"), after the "Hi! I am Per!" block on perappelgren.de. A sticky
 * stage holds the text and the diplomas while the section scrolls past: the
 * text keeps moving up, slower than the page, and fades under the top edge, and the
 * diplomas rise from below one by one, each settling on the same line and
 * lifting the earlier ones into a fan of slivers above it. After the last,
 * the stage lets go and the stack scrolls away with the page.
 */
export function AboutAwards() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stage = sec.querySelector<HTMLElement>('.aw__stage');
    const text = sec.querySelector<HTMLElement>('.aw__text');
    const posters = [...sec.querySelectorAll<HTMLElement>('.aw__poster')];
    if (!stage || !text || posters.length === 0) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = stage.clientHeight;
      const scrolled = Math.max(0, -sec.getBoundingClientRect().top);
      // Distance the text has risen: speed 1 at the hand-over from the page
      // (no kink), easing down to TEXT_SPEED.
      const S = TEXT_EASE * vh;
      const rise = TEXT_SPEED * scrolled + (1 - TEXT_SPEED) * S * (1 - Math.exp(-scrolled / S));
      text.style.transform = `translate3d(0, ${(-rise).toFixed(1)}px, 0)`;
      // How many diplomas have come up, continuously (2.5 = the third is half
      // way); it stops at the last, so the finished stack holds still.
      const c = Math.min(posters.length, (scrolled - LEAD * vh) / (PER * vh));
      const line = Math.max(140, LINE * vh);
      posters.forEach((el, i) => {
        const s = el.offsetHeight * STRIP;
        const a = clamp01(c - i);
        let y: number;
        if (a < 1) {
          // Up from below the screen, slowing into its line.
          const e = 1 - (1 - a) * (1 - a);
          y = vh + 40 + (line - vh - 40) * e;
        } else {
          // Settled; lifted by every diploma that has come after it.
          const k = c - i - 1;
          y = line - (s * (1 - Math.pow(R, k))) / (1 - R);
        }
        const pose = awardPosters[i];
        // Half the sideways nudge on a phone.
        const nudge = pose.nudge * (window.innerWidth < 900 ? 0.5 : 1);
        el.style.transform = `translate3d(${nudge}px, ${y.toFixed(1)}px, 0) rotate(${pose.tilt}deg)`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section
      ref={ref}
      id="awards"
      aria-labelledby="about-heading"
      className="aw"
      style={{ '--n': awardPosters.length, '--lead': LEAD, '--per': PER, '--dwell': DWELL } as React.CSSProperties}
    >
      <div className="aw__stage">
        <div className="aw__text">
          <h2 id="about-heading" className="sr-only">
            About me and awards
          </h2>
          {aboutText.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <ol className="aw__stack" aria-label="Awards">
          {awardPosters.map((poster) => (
            <li
              key={poster.id}
              className="aw__poster"
              style={{ '--tilt': `${poster.tilt}deg`, '--nudge': poster.nudge } as React.CSSProperties}
            >
              <Image
                src={poster.src}
                width={poster.width}
                height={poster.height}
                sizes="(max-width: 899px) 72vw, 440px"
                alt={poster.alt}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
