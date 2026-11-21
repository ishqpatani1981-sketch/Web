import type { MetadataRoute } from 'next';
import { getCollections, listProducts } from '@/lib/catalog';
import { siteUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, collections] = await Promise.all([listProducts({ limit: 5000 }), getCollections()]);
  const staticPages = ['', '/shop', '/collections', '/new-arrivals', '/offers', '/bestsellers', '/about', '/our-story', '/contact', '/faq', '/delivery', '/returns', '/privacy', '/cookies', '/terms', '/track-order'];
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.6 })),
    ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    // Demonstration products are excluded so placeholders are never indexed as real listings.
    ...products.filter((p) => !p.isPlaceholder).map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
