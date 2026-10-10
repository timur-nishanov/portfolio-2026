'use client';

import Link from 'next/link';
import type { ArticleProps } from './registry';

type Props = ArticleProps & {
  className?: string;
  label?: string;
  children: React.ReactNode;
};

/** The case's way back: a button that closes the layer over the page, or,
    on the case's own page, a link home to the cases. */
export function BackLink({ onBack, backHref = '/#works', className, label, children }: Props) {
  if (onBack) {
    return (
      <button type="button" className={className} onClick={onBack} aria-label={label}>
        {children}
      </button>
    );
  }
  return (
    <Link href={backHref} className={className} aria-label={label}>
      {children}
    </Link>
  );
}
