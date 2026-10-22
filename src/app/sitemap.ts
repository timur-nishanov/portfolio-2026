import type { MetadataRoute } from 'next';
import { showcase } from '@/data/showcase';
import { site } from '@/data/site';

// A static export writes the file once at build time.
export const dynamic = 'force-static';

// Written out as /sitemap.xml at build time: the home page and every case
// that has a study (the cards' hrefs).
export default function sitemap(): MetadataRoute.Sitemap {
  const cases = showcase.flatMap((s) => (s.href ? [{ url: `${site.url}${s.href}`, priority: 0.8 }] : []));
  return [{ url: `${site.url}/`, priority: 1 }, ...cases];
}
