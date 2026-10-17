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
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        accent: 'var(--accent)',
        'ink-strong': 'var(--ink-strong)',
        'ink-menu': 'var(--ink-menu)',
      },
      fontFamily: {
        // SF Pro system stack (see --font-sf) — the face of the new first screen.
        sf: 'var(--font-sf)',
      },
      fontSize: {
        // Mirrors .t-title for inline use.
        title: ['20px', { lineHeight: '1.32', letterSpacing: '0' }],
      },
    },
  },
  plugins: [],
};

export default config;
