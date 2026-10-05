import type { Metadata } from 'next';
import { hoves, pixel, sfpro } from './fonts';
import { site } from '@/data/site';
import { LiquidGlassFilter } from '@/components/ui/LiquidGlassFilter';
import './globals.css';

export const metadata: Metadata = {
  title: site.meta.title,
  description: site.meta.description,
  // No favicon yet: an empty one stops browsers asking for /favicon.ico, a
  // 404 in the console on every first load. Swap in the real icon here.
  icons: { icon: 'data:,' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `one-screen`: no scrolling while only the hero is live (globals.css).
    <html lang="en" className={`${hoves.variable} ${pixel.variable} ${sfpro.variable} one-screen`}>
      <body>
        <LiquidGlassFilter />
        {children}
      </body>
    </html>
  );
}
