import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductListing, parseListingParams, type ListingSearchParams } from '@/components/product/ProductListing';
import { getSettings } from '@/lib/settings';
import { getLivePromotions } from '@/lib/promotions';
import { Countdown } from '@/components/home/Countdown';
import { Badge } from '@/components/ui/Button';
import { isFuture } from '@/lib/time';

export const metadata: Metadata = { title: 'Special offers', description: 'Exceptional pens at exceptional prices.', alternates: { canonical: '/offers' } };

export default async function OffersPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  const [query, settings, promotions] = await Promise.all([searchParams.then(parseListingParams), getSettings(), getLivePromotions()]);
  const banners = promotions.filter((p) => p.placement === 'homepage_banner' || p.placement === 'offers_feature');
  return (
    <>
      <PageHeader eyebrow={settings.offers.eyebrow} title="Exceptional" accent="offers." description={settings.offers.body}>
        {banners.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {banners.map((p) => (
              <div key={p.id} className="glass glass-edge rounded-[26px] p-6">
                <div className="flex flex-wrap gap-2">
                  {p.badge && <Badge tone="gold">{p.badge}</Badge>}
                  {p.isPlaceholder && <Badge tone="demo">Placeholder</Badge>}
                </div>
                <p className="mt-3 text-xl font-light uppercase text-paper">{p.title}</p>
                {p.subtitle && <p className="mt-1 text-sm text-silver/80">{p.subtitle}</p>}
                {p.countdownEnabled && p.endsAt && isFuture(p.endsAt) && <Countdown endsAt={p.endsAt.toISOString()} />}
              </div>
            ))}
          </div>
        )}
      </PageHeader>
      <ProductListing query={{ ...query, rule: 'on_sale', sort: query.sort ?? 'discount' }} emptyTitle="No offers right now" />
    </>
  );
}
