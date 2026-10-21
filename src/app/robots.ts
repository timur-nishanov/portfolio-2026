import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

// A static export writes the file once at build time.
export const dynamic = 'force-static';

// Written out as /robots.txt at build time. Everything is open but the
// recording stage (/blank, which is also marked noindex itself).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/blank' },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
