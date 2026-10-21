import type { Metadata } from 'next';
import { inter, interItalic } from './fonts';
import { site } from '@/data/site';
import { menuLinks } from '@/data/menu';
import { pageMetadata } from '@/lib/metadata';
import { PillGlassFilter } from '@/components/header/menu/PillGlassFilter';
import './globals.css';

export const metadata: Metadata = {
  // Relative addresses in any page's metadata (canonical, the share card)
  // are made whole against this.
  metadataBase: new URL(site.url),
  ...pageMetadata({ path: '/', title: site.meta.title, description: site.meta.description }),
  // The icons are the files beside this one (favicon.ico, icon.png,
  // apple-icon.png): the still head, lit as the page lights it.
};

// Who the site is about, for search engines: the name, the role, the city,
// and the same profiles the menu links to.
const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  jobTitle: 'Senior Product Designer',
  url: site.url,
  address: { '@type': 'PostalAddress', addressLocality: 'Bangkok', addressCountry: 'TH' },
  sameAs: menuLinks.flatMap((l) => (l.kind === 'external' ? [l.href] : [])),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interItalic.variable}`}>
      <body>
        {/* The 20px round chevron buttons' glass (.glass-disc): the header's,
            the chip over a case card, the case page's back button. */}
        <PillGlassFilter id="lg-disc" width={20} height={20} scale={0.42} />
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      </body>
    </html>
  );
}
