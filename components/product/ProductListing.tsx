import { Suspense } from 'react';
import Link from 'next/link';
import { getCollections, listProducts, PEN_TYPES, type ProductQuery } from '@/lib/catalog';
import { ProductCard } from './ProductCard';
import { ShopFilters } from './ShopFilters';
import { Reveal } from '@/components/motion/Motion';
import { PenArt } from './PenArt';
import { buttonClasses } from '@/components/ui/Button';
import { poundsToPence } from '@/lib/utils';

export type ListingSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const SORTS = ['featured', 'newest', 'price-asc', 'price-desc', 'name', 'discount'] as const;

export function parseListingParams(sp: ListingSearchParams): ProductQuery {
  const sort = one(sp.sort);
  return {
    q: one(sp.q)?.slice(0, 80) || undefined,
    categorySlug: one(sp.category) || undefined,
    penType: one(sp.type) || undefined,
    inStockOnly: one(sp.instock) === '1',
    minPricePence: poundsToPence(one(sp.min)) ?? undefined,
    maxPricePence: poundsToPence(one(sp.max)) ?? undefined,
    sort: (SORTS as readonly string[]).includes(sort ?? '') ? (sort as ProductQuery['sort']) : undefined,
  };
}

export async function ProductListing({ query, showCollectionFilter = true, emptyTitle = 'No pens found' }: { query: ProductQuery; showCollectionFilter?: boolean; emptyTitle?: string }) {
  const [products, collections] = await Promise.all([listProducts(query), getCollections()]);
  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
      <Suspense>
        <ShopFilters
          collections={collections.map((c) => ({ value: c.slug, label: c.name }))}
          penTypes={PEN_TYPES.filter((t) => t.value !== 'other')}
          showCollections={showCollectionFilter}
          total={products.length}
        />
      </Suspense>
      {products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="h-48 w-40 opacity-70">
            <PenArt colour="Titanium" penType="rollerball" angle={-50} className="h-full w-full" title="" />
          </div>
          <h2 className="mt-4 text-2xl font-light text-paper">{emptyTitle}</h2>
          <p className="mt-2 max-w-sm text-sm text-titanium">Try removing a filter or searching for a colour, pen type or collection.</p>
          <Link href="/shop" className={buttonClasses('glass', 'md', 'mt-6')}>
            View all pens
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 4) * 0.06}>
              <ProductCard product={p} priority={i < 4} />
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
