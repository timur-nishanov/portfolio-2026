'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref, type RefObject } from 'react';
import { menuLinks, menuSections } from '@/data/menu';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CheckGlyph, CopyGlyph, RowChevron } from './icons';

export type MenuContentHandle = {
  /** `ring`: the menu was opened from the keyboard, so the row shows the
      focus ring and pill; a click-open focuses it quietly. */
  focusItem: (which: 'first' | 'last', opts?: { ring?: boolean }) => void;
};

type Props = {
  id: string;
  labelledBy: string;
  open: boolean;
  /** The menu box itself — useLiquidMorph measures it as the morph target. */
  contentRef: RefObject<HTMLDivElement | null>;
  handleRef: Ref<MenuContentHandle>;
  onClose: (returnFocus: boolean) => void;
};

// How long the copy confirmation shows, and when the menu tucks itself away
// after a copy (long enough to see the tick land, short of feeling stuck).
const COPIED_MS = 1400;
const CLOSE_AFTER_COPY_MS = 1000;
const SCROLL_OFFSET = -72;

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard API refused (insecure context, old engine): legacy path.
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* nothing else to try */
    }
    document.body.removeChild(ta);
  }
}

export function MenuContent({ id, labelledBy, open, contentRef, handleRef, onClose }: Props) {
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();
  const itemsRef = useRef<HTMLElement[]>([]);
  const highlightRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Whether the focused row got there by keyboard (and so wears the ring).
  // Tracked by hand rather than read from :focus-visible, which Chromium
  // carries over into programmatic focus from an earlier keyboard focus.
  const keyboardFocus = useRef(false);

  const items = () => itemsRef.current.filter(Boolean);

  useImperativeHandle(
    handleRef,
    () => ({
      focusItem(which, opts) {
        const list = items();
        keyboardFocus.current = !!opts?.ring;
        (which === 'last' ? list[list.length - 1] : list[0])?.focus({ preventScroll: true });
      },
    }),
    [],
  );

  // --- the gliding highlight pill -----------------------------------------
  const highlight = useCallback((el: HTMLElement | null, ring = false) => {
    const hl = highlightRef.current;
    if (!hl) return;
    if (!el) {
      hl.removeAttribute('data-on');
      hl.removeAttribute('data-focus-ring');
      hl.removeAttribute('data-pressed');
      return;
    }
    const appearing = !hl.hasAttribute('data-on');
    hl.removeAttribute('data-pressed');
    // Appearing: jump straight to the row; only moves between rows glide.
    if (appearing) hl.setAttribute('data-instant', '');
    hl.style.setProperty('--y', `${el.offsetTop + 1}px`);
    if (appearing) {
      void hl.offsetWidth;
      hl.removeAttribute('data-instant');
    }
    hl.setAttribute('data-on', '');
    hl.toggleAttribute('data-focus-ring', ring);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(copiedTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  // A pending auto-close must not fire into a menu the visitor has already
  // closed (it would yank focus back to the button out of nowhere).
  useEffect(() => {
    if (!open) {
      clearTimeout(closeTimer.current);
      hoverRef.current = null;
      highlight(null);
    }
  }, [open, highlight]);

  const focusedItem = () => {
    const a = document.activeElement as HTMLElement | null;
    return a && items().includes(a) ? a : null;
  };

  const itemProps = (index: number) => ({
    ref: (el: HTMLElement | null) => {
      if (el) itemsRef.current[index] = el;
    },
    role: 'menuitem',
    tabIndex: -1,
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      hoverRef.current = e.currentTarget;
      highlight(e.currentTarget);
    },
    onPointerDown: () => {
      keyboardFocus.current = false;
      highlightRef.current?.setAttribute('data-pressed', '');
    },
    onPointerUp: () => highlightRef.current?.removeAttribute('data-pressed'),
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      // Only keyboard focus draws the pill; the programmatic focus that lands
      // on the first row when a click opens the menu should not look hovered.
      if (keyboardFocus.current) highlight(e.currentTarget, true);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      // Focus moving to another row keeps the pill, so arrow keys glide it.
      const next = e.relatedTarget as HTMLElement | null;
      if (!hoverRef.current && !(next && items().includes(next))) highlight(null);
    },
  });

  // --- actions --------------------------------------------------------------
  const goTo = (sectionId: string) => {
    onClose(true);
    const el = document.getElementById(sectionId);
    if (!el) return; // section not on the page yet — just close
    // A section can name the block that frames it (Works: the first case
    // card). When that block fits the screen it lands in the middle of it;
    // otherwise the section starts just under the header.
    const frame = el.querySelector<HTMLElement>('[data-scroll-frame]');
    const fh = frame ? frame.getBoundingClientRect().height : 0;
    const top =
      frame && fh < window.innerHeight
        ? frame.getBoundingClientRect().top + window.scrollY - (window.innerHeight - fh) / 2
        : el.getBoundingClientRect().top + window.scrollY + SCROLL_OFFSET;
    if (document.documentElement.classList.contains('lenis')) {
      scrollTo(top, { offset: 0, duration: 1.1 });
    } else {
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  const copy = async (value: string) => {
    await copyText(value);
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onClose(true), CLOSE_AFTER_COPY_MS);
  };

  // --- keyboard (WAI-ARIA menu button pattern) ------------------------------
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const n = list.length;
    const i = list.indexOf(document.activeElement as HTMLElement);
    const focusAt = (k: number) => {
      keyboardFocus.current = true;
      list[(k + n) % n]?.focus({ preventScroll: true });
    };
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusAt(i + 1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        focusAt(i < 0 ? n - 1 : i - 1);
        return;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        return;
      case 'End':
        e.preventDefault();
        focusAt(n - 1);
        return;
      case 'Tab':
        // Tab leaves a menu: close it and hand focus back to its button.
        e.preventDefault();
        onClose(true);
        return;
      case ' ':
        // Space activates links too (buttons already do it natively).
        if (document.activeElement instanceof HTMLAnchorElement) {
          e.preventDefault();
          document.activeElement.click();
        }
        return;
      default:
        // Type-ahead: jump to the next row starting with the typed letter.
        if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const ch = e.key.toLowerCase();
          for (let k = 1; k <= n; k++) {
            const el = list[(i + k + n) % n];
            if (el?.textContent?.trim().toLowerCase().startsWith(ch)) {
              e.preventDefault();
              keyboardFocus.current = true;
              el.focus({ preventScroll: true });
              return;
            }
          }
        }
    }
  };

  let index = 0;
  let row = 0;

  return (
    <>
      <div
        ref={contentRef}
        id={id}
        role="menu"
        aria-labelledby={labelledBy}
        aria-orientation="vertical"
        className="lgm-menu"
        data-state={open ? 'open' : 'closed'}
        inert={!open}
        onKeyDown={onKeyDown}
        onPointerLeave={() => {
          hoverRef.current = null;
          const f = focusedItem();
          if (f && keyboardFocus.current) highlight(f, true);
          else highlight(null);
        }}
        // The head listens for grabs on window; a press on the menu must
        // never also pick up the head floating underneath it.
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div ref={highlightRef} className="lgm-highlight" aria-hidden="true" />

        {menuSections.map((s) => {
          const k = index++;
          return (
            <button
              key={s.id}
              type="button"
              className="lgm-item lgm-row"
              style={{ '--i': row++ } as React.CSSProperties}
              onClick={() => goTo(s.id)}
              {...itemProps(k)}
            >
              <span className="lgm-item__label">{s.label}</span>
              <span className="lgm-item__trail">
                <RowChevron />
              </span>
            </button>
          );
        })}

        <div role="separator" className="lgm-sep lgm-row" style={{ '--i': row++ } as React.CSSProperties} />

        {menuLinks.map((l) => {
          const k = index++;
          const icon = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="lgm-item__icon"
              src={l.icon}
              alt=""
              width={16}
              height={16}
              draggable={false}
              style={
                l.optical && (l.optical.scale || l.optical.dy)
                  ? { transform: `translateY(${l.optical.dy ?? 0}px) scale(${l.optical.scale ?? 1})` }
                  : undefined
              }
            />
          );
          if (l.kind === 'external') {
            return (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="lgm-item lgm-item--icon lgm-row"
                style={{ '--i': row++ } as React.CSSProperties}
                onClick={() => onClose(true)}
                {...itemProps(k)}
              >
                {icon}
                <span className="lgm-item__label" style={l.optical?.labelDx ? { transform: `translateX(${l.optical.labelDx}px)` } : undefined}>
                  {l.label}
                </span>
                <span className="lgm-item__trail">
                  <RowChevron />
                </span>
              </a>
            );
          }
          return (
            <button
              key={l.label}
              type="button"
              className="lgm-item lgm-item--icon lgm-row"
              style={{ '--i': row++ } as React.CSSProperties}
              data-copied={copied ? '' : undefined}
              aria-label={copied ? `${l.label}: ${l.copiedLabel.toLowerCase()}` : `Copy ${l.label} address`}
              onClick={() => copy(l.value)}
              {...itemProps(k)}
            >
              {icon}
              <span className="lgm-item__label" style={l.optical?.labelDx ? { transform: `translateX(${l.optical.labelDx}px)` } : undefined}>
                {copied ? l.copiedLabel : l.label}
              </span>
              <span className="lgm-item__trail">
                <CopyGlyph className="lgm-copy" />
                <CheckGlyph className="lgm-check" />
              </span>
            </button>
          );
        })}
      </div>
      {/* Outside the menu so it is still announced while the menu is inert. */}
      <span className="lgm-sr" role="status" aria-live="polite">
        {copied ? 'Email address copied to the clipboard' : ''}
      </span>
    </>
  );
}
