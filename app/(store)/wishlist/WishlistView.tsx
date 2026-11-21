'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useBasket, useHydrated, useUi, useWishlist } from '@/store/shop';
import { ProductImage } from '@/components/product/ProductImage';
import { LinkButton } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export function WishlistView() {
  const hydrated = useHydrated();
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const add = useBasket((s) => s.add);
  const { setBasketOpen } = useUi();
  if (!hydrated) return <div className="min-h-[70vh]" />;
  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-36 sm:px-8">
      <p className="eyebrow mb-4">Saved for later</p>
      <h1 className="display mb-12 text-[clamp(2.4rem,5vw,4.4rem)] text-paper">
        Your <span className="font-serif normal-case italic text-champagne">wishlist</span>
      </h1>
      {items.length === 0 ? (
        <div className="glass glass-edge flex flex-col items-center rounded-[32px] px-6 py-16 text-center">
          <Heart className="h-10 w-10 text-champagne" />
          <h2 className="mt-5 text-2xl font-light text-paper">Nothing saved yet</h2>
          <p className="mt-2 max-w-sm text-sm text-titanium">Tap the heart on any pen to keep it here. Your wishlist is saved on this device.</p>
          <LinkButton href="/shop" className="mt-7">
            Discover pens
          </LinkButton>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.productId} className="glass glass-edge flex gap-4 rounded-[24px] p-4">
              <Link href={`/products/${p.slug}`} className="h-32 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-graphite to-charcoal">
                <ProductImage src={p.imageUrl} alt={p.name} colour={p.colour} name={p.name} penType={p.penType} className="h-full w-full" sizes="112px" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link href={`/products/${p.slug}`} className="text-paper hover:text-champagne">
                  {p.name}
                </Link>
                <span className="mt-1 text-sm text-silver">{formatPrice(p.pricePence)}</span>
                <div className="mt-auto flex gap-2 pt-3">
                  <button
                    onClick={() => {
                      if (p.pricePence === null) return;
                      add(p, 1);
                      setBasketOpen(true);
                    }}
                    disabled={p.pricePence === null}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-paper text-[10px] font-medium uppercase tracking-[0.14em] text-ink disabled:opacity-40"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to basket
                  </button>
                  <button onClick={() => remove(p.productId)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-titanium hover:text-danger" aria-label={`Remove ${p.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
