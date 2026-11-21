import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductListing, parseListingParams, type ListingSearchParams } from '@/components/product/ProductListing';

export const metadata: Metadata = { title: 'New arrivals', description: 'The latest pens to arrive at Pens Outlet.', alternates: { canonical: '/new-arrivals' } };

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  const query = parseListingParams(await searchParams);
  return (
    <>
      <PageHeader eyebrow="Just landed" title="New" accent="arrivals." description="The latest additions to the Pens Outlet collection." />
      <ProductListing query={{ ...query, rule: 'new_arrival', sort: query.sort ?? 'newest' }} emptyTitle="No new arrivals right now" />
    </>
  );
}
