'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/data/site';
import { MagneticButton } from './MagneticButton';

/** COPY MAIL → copies the address, label flips to COPIED for 1.6s (TZ §5). */
export function CopyMailButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
    } catch {
      // Fallback for clipboard-less contexts.
      const ta = document.createElement('textarea');
      ta.value = site.email;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <MagneticButton
      onClick={copy}
      className="glass rounded-full"
      labelClassName="pixel px-6 py-3.5 text-[12px] text-ink"
    >
      <span aria-live="polite">{copied ? 'COPIED' : 'COPY MAIL'}</span>
    </MagneticButton>
  );
}
