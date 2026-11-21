import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductListing, parseListingParams, type ListingSearchParams } from '@/components/product/ProductListing';

export const metadata: Metadata = {
  title: 'Shop all pens',
  description: 'Browse every autograph pen, collectable pen and luxury writing instrument at Pens Outlet.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  const query = parseListingParams(await searchParams);
  return (
    <>
      <PageHeader eyebrow="Shop all" title="Every pen," accent="one place." description="Autograph pens, collectable pens and luxury writing instruments — filter by collection, pen type, price and availability." />
      <ProductListing query={query} />
    </>
  );
}
