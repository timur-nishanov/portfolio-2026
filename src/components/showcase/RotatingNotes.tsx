'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Word timings (ms). In: each word clears out of a blur, a touch after the one
// before it. Out: the same, faster, so the next note isn't kept waiting.
const IN_MS = 720;
const IN_STAGGER = 26;
const OUT_MS = 360;
const OUT_STAGGER = 10;
const FADE_MS = 260; // reduced motion: a plain cross-fade
// Pointing at the note holds it; once the pointer leaves, it stays at least
// this long before it goes.
const RESUME_MIN = 1200;

// What animates as one piece: split on ordinary spaces only, so words tied
// with a no-break space ("6 steps to 1.") stay one unbreakable unit.
const unitsOf = (text: string) => text.trim().split(/ +/);
// Reading time still counts every word, tied or not.
const wordCount = (text: string) => text.trim().split(/\s+/).length;

/** How long a note stays up once it is in: a calm ~210 wpm read plus a beat to
 *  settle, never shorter than 4.2 s or longer than 9 s. */
export const holdFor = (text: string) => Math.min(9000, Math.max(4200, 1600 + wordCount(text) * 290));

type Props = { notes: string[]; className?: string };

/**
 * Notes that take turns in one place. The block is anchored by its top edge
 * and never re-centres: a longer note only grows downward, and in the stacked
 * mobile layout an invisible copy of every note holds the tallest height, so
 * nothing below shifts. Runs only while on screen and the tab is visible, and
 * holds while a mouse points at it — someone reading shouldn't lose the line.
 */
export function RotatingNotes({ notes, className = '' }: Props) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [active, setActive] = useState(false);
  const [held, setHeld] = useState(false);
  // What was left of a note's time when it was held or scrolled away.
  const left = useRef<number | null>(null);
  // The first note is simply there on load; every note after it animates in.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  // A note on its way out always finishes leaving; only a shown one is held.
  const running = active && (phase === 'out' || !held);

  useEffect(() => {
    if (!running || notes.length < 2) return;
    const n = unitsOf(notes[index]).length;
    if (phase === 'in') {
      const entering = !animated ? 0 : reduced ? FADE_MS : IN_MS + (n - 1) * IN_STAGGER;
      const wait = left.current ?? entering + holdFor(notes[index]);
      const start = performance.now();
      let fired = false;
      const t = window.setTimeout(() => {
        fired = true;
        left.current = null;
        setPhase('out');
      }, wait);
      return () => {
        window.clearTimeout(t);
        if (!fired) left.current = Math.max(RESUME_MIN, wait - (performance.now() - start));
      };
    }
    const leaving = reduced ? FADE_MS : OUT_MS + (n - 1) * OUT_STAGGER;
    const t = window.setTimeout(() => {
      setAnimated(true);
      setIndex((i) => (i + 1) % notes.length);
      setPhase('in');
    }, leaving);
    return () => window.clearTimeout(t);
  }, [running, phase, index, notes, reduced, animated]);

  const hold = (e: React.PointerEvent, on: boolean) => {
    if (e.pointerType === 'mouse') setHeld(on);
  };

  const words = useMemo(() => unitsOf(notes[index]), [notes, index]);

  return (
    <div
      ref={rootRef}
      className={`rn ${className}`}
      onPointerEnter={(e) => hold(e, true)}
      onPointerLeave={(e) => hold(e, false)}
    >
      {/* Screen readers get every note once, not a live region that keeps
          interrupting. */}
      <ul className="sr-only">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <div className="rn__stack" aria-hidden="true">
        {notes.map((note) => (
          <p key={note} className="rn__sizer">
            {note}
          </p>
        ))}
        <p
          key={index}
          className="rn__live"
          data-phase={phase}
          data-animate={animated || phase === 'out' ? '' : undefined}
          data-reduced={reduced ? '' : undefined}
        >
          {words.map((w, i) => (
            <span key={i}>
              <span className="rn__w" style={{ '--i': i } as React.CSSProperties}>
                {w}
              </span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
