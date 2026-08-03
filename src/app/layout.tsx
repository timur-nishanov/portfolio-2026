import type { Metadata } from 'next';
import { hoves, pixel } from './fonts';
import { site } from '@/data/site';
import { LiquidGlassFilter } from '@/components/ui/LiquidGlassFilter';
import './globals.css';

export const metadata: Metadata = {
  title: site.meta.title,
  description: site.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hoves.variable} ${pixel.variable}`}>
      <body>
        <LiquidGlassFilter />
        {children}
      </body>
    </html>
  );
}
