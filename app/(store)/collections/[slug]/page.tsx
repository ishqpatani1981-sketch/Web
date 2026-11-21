import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollectionBySlug } from '@/lib/catalog';
import { PageHeader, PlaceholderNotice } from '@/components/ui/PageHeader';
import { ProductListing, parseListingParams, type ListingSearchParams } from '@/components/product/ProductListing';
import { CollectionVisual } from '@/components/home/Collections';
import { JsonLd } from '@/components/seo/JsonLd';
import { siteUrl } from '@/lib/config';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCollectionBySlug((await params).slug);
  if (!c) return { title: 'Collection not found' };
  return {
    title: c.seoTitle || c.name,
    description: c.seoDescription || c.description || `Shop ${c.name} at Pens Outlet.`,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: c.imageUrl ? { images: [{ url: c.imageUrl, alt: c.imageAlt ?? c.name }] } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const c = await getCollectionBySlug(slug);
  if (!c) notFound();
  const query = parseListingParams(sp);
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
            { '@type': 'ListItem', position: 2, name: 'Collections', item: `${siteUrl()}/collections` },
            { '@type': 'ListItem', position: 3, name: c.name, item: `${siteUrl()}/collections/${c.slug}` },
          ],
        }}
      />
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-60 [mask-image:linear-gradient(to_left,black,transparent)] md:block">
          <CollectionVisual c={c} index={0} sizes="42vw" />
        </div>
        <PageHeader eyebrow="Collection" title={c.name} description={c.description}>
          {c.isPlaceholder && <PlaceholderNotice className="mt-6 max-w-xl">This collection and its description are placeholders — the owner will confirm the final range.</PlaceholderNotice>}
        </PageHeader>
      </div>
      <ProductListing query={{ ...query, categorySlug: c.slug }} showCollectionFilter={false} emptyTitle={`No pens in ${c.name} yet`} />
    </>
  );
}
