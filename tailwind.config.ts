import type { Config } from 'tailwindcss';

/**
 * Tokens are the single source of truth in CSS variables (globals.css),
 * mirrored here so Tailwind utilities (bg-surface, text-ink, ...) resolve.
 * Approximate values snapped from the Figma per TZ §3 — swap exact hexes
 * from the mockup if they drift.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        accent: 'var(--accent)',
        'laurel-gold': 'var(--laurel-gold)',
        'laurel-teal': 'var(--laurel-teal)',
        'ink-strong': 'var(--ink-strong)',
        'ink-menu': 'var(--ink-menu)',
        chip: 'var(--chip)',
      },
      fontFamily: {
        hoves: 'var(--font-hoves)',
        pixel: 'var(--font-pixel)',
        // SF Pro system stack (see --font-sf) — the face of the new first screen.
        sf: 'var(--font-sf)',
      },
      fontSize: {
        // Mirrors .t-title / .t-menu for inline use.
        title: ['20px', { lineHeight: '1.32', letterSpacing: '0' }],
        menu: ['15px', { lineHeight: '18px', letterSpacing: '0.2px' }],
      },
      maxWidth: {
        container: '1140px',
      },
      borderRadius: {
        card: '28px',
      },
      letterSpacing: {
        pixel: '0.06em',
      },
    },
  },
  plugins: [],
};

export default config;
