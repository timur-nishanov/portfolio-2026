'use client';

import Image from 'next/image';
import { Fragment, useEffect, useRef } from 'react';
import { aboutText, awardPosters, type AboutLine } from '@/data/about';
import { cancelFrame, scheduleFrame, type FrameJob } from '@/lib/frame';
import './about.css';

// Scroll lengths, in screen heights (also feed the section's height in CSS).
const LEAD = 0.08; // the text alone before the first diploma comes up
const PER = 0.5; // scroll between one diploma and the next
const DWELL = 0.95; // after the last one comes up, before the block lets go
// Each diploma comes up from below the screen and keeps gliding towards the
// line TOP, slower and slower, never stopping and starting again: after each
// new arrival it is left R of its distance to TOP. So the earlier ones gather
// above the newest in a fan of ever thinner slivers, as on the reference.
const TOP = 0.11; // of the screen height
const R = 0.42;

// Once the stage holds, the text slows from scroll speed to TEXT_SPEED of it
// over the first TEXT_EASE screen heights, so the diplomas catch it up.
const TEXT_SPEED = 0.2;
const TEXT_EASE = 0.12;
// Keyframes per scroll-driven animation: the curves between them are short
// enough to be straight to within a pixel.
const SAMPLES = 96;

// Scroll-driven animation timelines (Chrome 115+, Safari 26+); not in the DOM
// typings yet.
type ViewTimelineCtor = new (options: { subject: Element; axis?: 'block' | 'inline' }) => AnimationTimeline;

/**
 * About me, with the award diplomas coming up over it (#awards, the menu's
 * "Awards"), after the "Hi! I am Per!" block on perappelgren.de. A sticky
 * stage holds the text and the diplomas while the section scrolls past: the
 * text keeps moving up, slower than the page, and fades under the top edge,
 * and the diplomas come up from below one by one, each gliding on towards
 * the top and covering the earlier ones but their top slivers. After the
 * last, the stage lets go and the stack scrolls away with the page.
 */
const lineText = (line: AboutLine) => (typeof line === 'string' ? line : line.text);

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

    // The stage's height and the screen's width change only with the window.
    let vh = 0;
    let phone = false;
    const measure = () => {
      vh = stage.clientHeight;
      phone = window.innerWidth < 900;
    };
    // Scroll from the stage taking hold to it letting go.
    const span = () => (LEAD + (posters.length - 1) * PER + DWELL) * vh;
    // Where everything is, a given distance into the hold.
    const at = (held: number) => {
      // Distance the text has risen: speed 1 at the hand-over from the page
      // (no kink), easing down to TEXT_SPEED.
      const S = TEXT_EASE * vh;
      const rise = TEXT_SPEED * held + (1 - TEXT_SPEED) * S * (1 - Math.exp(-held / S));
      // The diplomas glide from just below the screen towards TOP; the glide's
      // length leaves each one R of its way when the next comes up.
      const glide = (PER * vh) / Math.log(1 / R);
      const top = TOP * vh;
      const below = vh + 24;
      return {
        text: `translate3d(0, ${(-rise).toFixed(1)}px, 0)`,
        posters: posters.map((_, i) => {
          const t = held - (LEAD + i * PER) * vh;
          const y = t <= 0 ? below : top + (below - top) * Math.exp(-t / glide);
          const pose = awardPosters[i];
          // Half the sideways nudge on a phone.
          const nudge = pose.nudge * (phone ? 0.5 : 1);
          return `translate3d(${nudge}px, ${y.toFixed(1)}px, 0) rotate(${pose.tilt}deg)`;
        }),
      };
    };

    // Where the browser can run an animation off the scroll itself, the text
    // and the diplomas are such animations, their keyframes sampled from the
    // curves above: they then move with the scroll on the compositor, in step
    // with a phone's native scroll. Driven from the scroll event they arrived
    // a frame or two behind it there, and the incoming diploma, at its
    // fastest, jumped by tens of pixels.
    const Timeline = (globalThis as { ViewTimeline?: ViewTimelineCtor }).ViewTimeline;
    if (Timeline && typeof CSS !== 'undefined' && typeof CSS.px === 'function') {
      let anims: Animation[] = [];
      const build = () => {
        anims.forEach((a) => a.cancel());
        measure();
        const max = span();
        const frames = Array.from({ length: SAMPLES + 1 }, (_, k) => at((max * k) / SAMPLES));
        const opts = {
          timeline: new Timeline({ subject: sec, axis: 'block' }),
          // From the section's top reaching the screen's top, for the length
          // of the hold; before and after, the ends hold.
          rangeStart: { rangeName: 'contain', offset: CSS.px(0) },
          rangeEnd: { rangeName: 'contain', offset: CSS.px(max) },
          fill: 'both',
          easing: 'linear',
        } as KeyframeAnimationOptions;
        anims = [
          text.animate(
            frames.map((f) => ({ transform: f.text })),
            opts,
          ),
          ...posters.map((el, i) =>
            el.animate(
              frames.map((f) => ({ transform: f.posters[i] })),
              opts,
            ),
          ),
        ];
      };
      build();
      window.addEventListener('resize', build);
      return () => {
        window.removeEventListener('resize', build);
        anims.forEach((a) => a.cancel());
      };
    }

    let secTop = 0;
    let shown = NaN; // the held distance last drawn
    const job: FrameJob = {
      read: () => {
        secTop = sec.getBoundingClientRect().top;
      },
      write: () => {
        // Scroll since the stage took hold, up to where it lets go: past that
        // everything stays put on the stage and leaves with the page.
        const held = Math.min(Math.max(0, -secTop), span());
        // Before it takes hold and after it lets go nothing moves: nothing to
        // write either.
        if (held === shown) return;
        shown = held;
        const f = at(held);
        text.style.transform = f.text;
        posters.forEach((el, i) => {
          el.style.transform = f.posters[i];
        });
      },
    };
    // Only while the section is anywhere near the screen.
    let near = false;
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) scheduleFrame(job);
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(sec);
    const schedule = () => {
      if (near) scheduleFrame(job);
    };
    const onResize = () => {
      measure();
      shown = NaN;
      scheduleFrame(job);
    };
    measure();
    job.read?.();
    job.write();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelFrame(job);
      io.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
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
        {/* Only the text fades under the top edge; the diplomas stay crisp. */}
        <div className="aw__copy">
          <div className="aw__text">
            <h2 id="about-heading" className="sr-only">
              About me and awards
            </h2>
            {aboutText.map((lines) => (
              <p key={lineText(lines[0])}>
                {lines.map((line, i) => (
                  <Fragment key={lineText(line)}>
                    {i > 0 && ' '}
                    <span>
                      {typeof line === 'string' ? (
                        line
                      ) : (
                        <a className="aw__link" href={line.href} target="_blank" rel="noopener noreferrer">
                          {line.text}
                        </a>
                      )}
                    </span>
                  </Fragment>
                ))}
              </p>
            ))}
          </div>
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
