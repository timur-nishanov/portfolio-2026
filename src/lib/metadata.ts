import type { Metadata } from 'next';
import { site } from '@/data/site';

type Page = { path: string; title: string; description: string };

/**
 * A page's metadata: its title and description, its own address as the
 * canonical one, and the card a link to it unfurls into on LinkedIn, X,
 * Telegram and the rest (public/og.png: the first screen, drawn still).
 * The addresses are relative; metadataBase (app/layout) makes them whole.
 */
export function pageMetadata({ path, title, description }: Page): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: site.name,
      url: path,
      title,
      description,
      images: [{ url: site.og.image, width: site.og.width, height: site.og.height, alt: site.og.alt }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [site.og.image] },
  };
}
