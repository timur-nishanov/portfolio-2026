'use client';

import { useRef } from 'react';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMagnetic } from '@/hooks/useMagnetic';

// Halved from the first pass — the pull was chaotic. Still clearly readable,
// with the label trailing the surface at half its coefficient for depth.
const SURFACE_PULL = 0.14;
const SURFACE_MAX = 8; // px
const LABEL_PULL = 0.07;
const LABEL_MAX = 4; // px

type BaseProps = {
  children: React.ReactNode;
  className?: string; // classes for the visible surface
  labelClassName?: string;
  disabled?: boolean;
  magnetic?: boolean;
  /** Applied to the root box — use it to set the Figma width/height. */
  style?: React.CSSProperties;
};

type AsButton = BaseProps & { as?: 'button'; onClick?: () => void; type?: 'button' | 'submit' };
type AsLink = BaseProps & { as: 'a'; href: string | null; target?: string; rel?: string };

type Props = AsButton | AsLink;

/**
 * Magnetic, layered button (TZ §5.5). Surface and label are separate elements
 * moving at different coefficients. Disabled → inert, default cursor.
 * Auto-disables on touch and under prefers-reduced-motion.
 */
export function MagneticButton(props: Props) {
  const {
    children,
    className = '',
    labelClassName = '',
    disabled = false,
    magnetic = true,
    style,
  } = props;
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useMagnetic(
    rootRef,
    [
      { ref: surfaceRef, factor: SURFACE_PULL, max: SURFACE_MAX },
      { ref: labelRef, factor: LABEL_PULL, max: LABEL_MAX },
    ],
    magnetic && !disabled && canHover && !reduced,
  );

  const inner = (
    <>
      <span
        ref={surfaceRef}
        className={`absolute inset-0 will-change-transform ${className}`}
        aria-hidden="true"
      />
      <span ref={labelRef} className={`relative z-10 will-change-transform ${labelClassName}`}>
        {children}
      </span>
    </>
  );

  const inert = disabled || (props.as === 'a' && props.href === null);
  const base = `relative inline-flex items-center justify-center ${
    inert ? 'cursor-default' : 'cursor-pointer'
  }`;

  if (props.as === 'a') {
    const { href, target, rel } = props;
    return (
      <a
        ref={rootRef as React.Ref<HTMLAnchorElement>}
        href={href ?? undefined}
        target={target}
        rel={rel}
        aria-disabled={inert || undefined}
        className={base}
        style={style}
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
      className={base}
      style={style}
    >
      {inner}
    </button>
  );
}
