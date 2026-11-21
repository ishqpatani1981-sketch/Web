import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  // Keep preview / demo deployments out of search engines until launch.
  const allowIndexing = process.env.ALLOW_INDEXING === 'true';
  return {
    rules: allowIndexing
      ? [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/account', '/basket', '/checkout', '/studio'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
