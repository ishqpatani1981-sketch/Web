'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useHydrated, useRecentlyViewed, type ProductSnapshot } from '@/store/shop';
import { ProductImage } from './ProductImage';
import { formatPrice } from '@/lib/utils';

/** Records a product view (rendered invisibly on product pages). */
export function TrackRecentlyViewed({ product }: { product: ProductSnapshot }) {
  const push = useRecentlyViewed((s) => s.push);
  useEffect(() => {
    push(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.productId]);
  return null;
}

export function RecentlyViewed({ excludeId, title = 'Recently viewed' }: { excludeId?: string; title?: string }) {
  const hydrated = useHydrated();
  const items = useRecentlyViewed((s) => s.items).filter((i) => i.productId !== excludeId);
  if (!hydrated || items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="eyebrow mb-6">
        {title}
      </h2>
      <div className="rail flex gap-4 overflow-x-auto pb-2">
        {items.slice(0, 8).map((p) => (
          <Link key={p.productId} href={`/products/${p.slug}`} className="glass group flex w-64 shrink-0 items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-white/[0.06]">
            <ProductImage src={p.imageUrl} alt={p.name} colour={p.colour} name={p.name} penType={p.penType} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl" sizes="64px" />
            <span className="min-w-0">
              <span className="block truncate text-sm text-paper group-hover:text-champagne">{p.name}</span>
              <span className="text-xs text-titanium">{formatPrice(p.pricePence)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
