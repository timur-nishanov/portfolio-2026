import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

// A static export writes the file once at build time.
export const dynamic = 'force-static';

// Written out as /robots.txt at build time. Everything is open: the recording
// stage (/blank) is kept out of search by its own noindex, which a crawler
// has to be allowed to fetch to read (a Disallow would hide it, and leave the
// address indexable from a link).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
