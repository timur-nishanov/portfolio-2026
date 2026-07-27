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
      },
      fontFamily: {
        hoves: 'var(--font-hoves)',
        pixel: 'var(--font-pixel)',
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
