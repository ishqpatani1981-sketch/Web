import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductListing, parseListingParams, type ListingSearchParams } from '@/components/product/ProductListing';

export const metadata: Metadata = { title: 'Bestsellers', description: 'Our most popular pens.', alternates: { canonical: '/bestsellers' } };

export default async function BestsellersPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  const query = parseListingParams(await searchParams);
  return (
    <>
      <PageHeader eyebrow="Customer favourites" title="Most" accent="signed for." description="The pens our customers reach for again and again." />
      <ProductListing query={{ ...query, rule: 'bestseller' }} emptyTitle="No bestsellers yet" />
    </>
  );
}
