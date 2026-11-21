import Link from 'next/link';
import type { ProductView } from '@/lib/catalog';
import { cn, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Button';
import { ProductImage } from './ProductImage';
import { AddToBasketButton, WishlistButton } from './ProductActions';

const AVAIL_DOT: Record<string, string> = {
  in_stock: 'bg-success',
  low_stock: 'bg-warning',
  out_of_stock: 'bg-danger',
  preorder: 'bg-champagne',
  coming_soon: 'bg-titanium',
};

export function ProductCard({ product, className, priority, sizes }: { product: ProductView; className?: string; priority?: boolean; sizes?: string }) {
  const p = product;
  return (
    <article className={cn('group/card relative flex flex-col', className)} data-testid="product-card">
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-b from-graphite/70 to-charcoal/60 ring-1 ring-white/[0.06] transition-[transform,box-shadow] duration-700 ease-[var(--ease-out-expo)] group-hover/card:-translate-y-1 group-hover/card:shadow-[0_40px_80px_-40px_rgba(220,199,161,0.28)]">
        <Link href={`/products/${p.slug}`} className="sheen block" aria-label={`View ${p.name}`} data-cursor-label="View">
          <ProductImage
            src={p.images[0]?.url}
            alt={p.images[0]?.alt || p.name}
            colour={p.colour}
            name={p.name}
            penType={p.penType}
            className="aspect-[4/5] w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.06]"
            priority={priority}
            sizes={sizes}
            showPlaceholderLabel={!p.images[0]}
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.discountLabel && p.originalPricePence && <Badge tone="sale">{p.discountLabel}</Badge>}
          {p.isNewArrival && <Badge tone="gold">New</Badge>}
          {p.isBestseller && <Badge>Bestseller</Badge>}
          {p.isPlaceholder && <Badge tone="demo">Demo</Badge>}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton product={p} />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex translate-y-0 gap-2 opacity-100 transition-all duration-500 sm:translate-y-3 sm:opacity-0 sm:group-hover/card:translate-y-0 sm:group-hover/card:opacity-100 sm:group-focus-within/card:translate-y-0 sm:group-focus-within/card:opacity-100">
          <AddToBasketButton product={p} className="flex-1" />
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col px-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] leading-snug text-paper">
            <Link href={`/products/${p.slug}`} className="hover:text-champagne">
              {p.name}
            </Link>
          </h3>
          <div className="shrink-0 text-right">
            <p className="text-[15px] text-paper">{formatPrice(p.pricePence)}</p>
            {p.originalPricePence && <p className="text-xs text-titanium line-through">{formatPrice(p.originalPricePence)}</p>}
          </div>
        </div>
        {p.shortDescription && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-titanium">{p.shortDescription}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-silver/80">
            <span className={cn('h-1.5 w-1.5 rounded-full', AVAIL_DOT[p.availability])} />
            {p.availabilityLabel}
          </span>
          <Link href={`/products/${p.slug}`} className="text-[11px] uppercase tracking-[0.16em] text-champagne/90 underline-offset-4 hover:underline">
            View product
          </Link>
        </div>
      </div>
    </article>
  );
}
