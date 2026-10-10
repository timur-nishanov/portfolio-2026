import type { Metadata } from 'next';
import { hoves, pixel } from './fonts';
import { site } from '@/data/site';
import { LiquidGlassFilter } from '@/components/ui/LiquidGlassFilter';
import { PillGlassFilter } from '@/components/header/menu/PillGlassFilter';
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
    <html lang="en" className={`${hoves.variable} ${pixel.variable}`}>
      <body>
        <LiquidGlassFilter />
        {/* The 20px round chevron buttons' glass (.glass-disc): the header's,
            the chip over a case card, the case page's back button. */}
        <PillGlassFilter id="lg-disc" width={20} height={20} scale={0.42} />
        {children}
      </body>
    </html>
  );
}
