'use client';

import { useEffect, useRef } from 'react';
import { clamp, lerp, q } from '@/lib/lerp';
import { settled, stepSpring, type SpringState } from '@/lib/spring';
import { useCanHover } from '@/hooks/useMediaQuery';

const RADIUS = 90; // px beyond the border where the magnet engages
const PULL = 0.28; // surface follows 0.28 of the centre→cursor vector
const PULL_MAX = 14; // px cap on the surface offset
const LABEL_PULL = 0.14; // label follows less → layered depth (TZ §5.5)
const ENGAGE_LERP = 0.15;
const RETURN_SPRING = { stiffness: 220, damping: 20 };

type BaseProps = {
  children: React.ReactNode;
  className?: string; // classes for the visible surface
  labelClassName?: string;
  disabled?: boolean;
  magnetic?: boolean; // allow opt-out; kept true by default
};

type AsButton = BaseProps & { as?: 'button'; onClick?: () => void; type?: 'button' | 'submit' };
type AsLink = BaseProps & { as: 'a'; href: string | null; target?: string; rel?: string };

type Props = AsButton | AsLink;

/**
 * Magnetic, layered button (TZ §5.5). The surface and the label are separate
 * elements moving at different coefficients (0.28 vs 0.14) so the label lags —
 * that lag is what stops it looking cheap. Transform-only; engage smooths with
 * a lerp, release settles with a spring. Disabled → inert, default cursor.
 * Auto-disables on touch (no hover).
 */
export function MagneticButton(props: Props) {
  const { children, className = '', labelClassName = '', disabled = false, magnetic = true } = props;
  const canHover = useCanHover();
  const rootRef = useRef<HTMLElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const enabled = magnetic && !disabled && canHover;

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    const surface = surfaceRef.current;
    const label = labelRef.current;
    if (!root || !surface || !label) return;

    // Smoothed centre→cursor vector in px.
    let curX = 0;
    let curY = 0;
    let targetX = 0;
    let targetY = 0;
    let engaged = false;
    let sx: SpringState = { value: 0, velocity: 0 };
    let sy: SpringState = { value: 0, velocity: 0 };
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      // distance from the border box, not the centre
      const outX = Math.max(0, Math.abs(dx) - r.width / 2);
      const outY = Math.max(0, Math.abs(dy) - r.height / 2);
      const dist = Math.hypot(outX, outY);
      if (dist <= RADIUS) {
        engaged = true;
        targetX = dx;
        targetY = dy;
      } else {
        engaged = false;
        targetX = 0;
        targetY = 0;
      }
    };

    const apply = () => {
      surface.style.transform = `translate3d(${q(clamp(curX * PULL, -PULL_MAX, PULL_MAX))}px, ${q(
        clamp(curY * PULL, -PULL_MAX, PULL_MAX),
      )}px, 0)`;
      label.style.transform = `translate3d(${q(curX * LABEL_PULL)}px, ${q(curY * LABEL_PULL)}px, 0)`;
    };

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (engaged) {
        curX = lerp(curX, targetX, ENGAGE_LERP);
        curY = lerp(curY, targetY, ENGAGE_LERP);
        sx = { value: curX, velocity: 0 };
        sy = { value: curY, velocity: 0 };
      } else {
        sx = stepSpring(sx, 0, RETURN_SPRING, dt);
        sy = stepSpring(sy, 0, RETURN_SPRING, dt);
        curX = sx.value;
        curY = sy.value;
      }
      apply();
      // Keep ticking while engaged or still settling.
      if (engaged || !settled(sx, 0) || !settled(sy, 0)) {
        raf = requestAnimationFrame(loop);
      } else {
        curX = curY = 0;
        apply();
        raf = 0;
      }
    };

    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    // window-level move so the magnet can reach out to RADIUS beyond the button
    const onWindowMove = (e: PointerEvent) => {
      onMove(e);
      start();
    };
    window.addEventListener('pointermove', onWindowMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onWindowMove);
    };
  }, [enabled]);

  const surface = (
    <span
      ref={surfaceRef}
      className={`absolute inset-0 will-change-transform ${className}`}
      aria-hidden="true"
    />
  );
  const label = (
    <span ref={labelRef} className={`relative z-10 will-change-transform ${labelClassName}`}>
      {children}
    </span>
  );

  const inner = (
    <>
      {surface}
      {label}
    </>
  );

  if (props.as === 'a') {
    const { href, target, rel } = props;
    return (
      <a
        ref={rootRef as React.Ref<HTMLAnchorElement>}
        href={href ?? undefined}
        target={target}
        rel={rel}
        aria-disabled={disabled || href === null || undefined}
        className={`relative inline-flex items-center justify-center ${
          disabled || href === null ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        {inner}
      </a>
    );
  }

  const { onClick, type = 'button' } = props;
  return (
    <button
      ref={rootRef as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      }`}
    >
      {inner}
    </button>
  );
}
