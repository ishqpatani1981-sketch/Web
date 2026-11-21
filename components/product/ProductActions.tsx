'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Heart, Loader2, ShoppingBag } from 'lucide-react';
import { useBasket, useHydrated, useUi, useWishlist } from '@/store/shop';
import { snapshot } from '@/lib/snapshot';
import { cn } from '@/lib/utils';
import type { ProductView } from '@/lib/catalog';

export { snapshot };

type AddProps = {
  product: ProductView;
  quantity?: number;
  variant?: 'pill' | 'full' | 'icon';
  className?: string;
  openDrawer?: boolean;
};

export function AddToBasketButton({ product, quantity = 1, variant = 'pill', className, openDrawer = true }: AddProps) {
  const add = useBasket((s) => s.add);
  const { setBasketOpen, showToast } = useUi();
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle');

  if (!product.purchasable) {
    const label = product.pricePence === null ? 'Price on request' : product.availability === 'coming_soon' ? 'Coming soon' : 'Sold out';
    return (
      <button type="button" disabled className={cn(variant === 'full' ? 'h-14 w-full text-[12px]' : variant === 'icon' ? 'h-10 w-10' : 'h-10 px-4 text-[10.5px]', 'cursor-not-allowed rounded-full border border-white/10 uppercase tracking-[0.16em] text-titanium', className)} aria-label={`${product.name}: ${label}`}>
        {variant === 'icon' ? <ShoppingBag className="mx-auto h-4 w-4 opacity-40" /> : label}
      </button>
    );
  }

  const onClick = () => {
    setState('adding');
    add(snapshot(product), quantity);
    setTimeout(() => {
      setState('added');
      if (openDrawer) setBasketOpen(true);
      else showToast(`${product.name} added to your basket`);
      setTimeout(() => setState('idle'), 1400);
    }, 260);
  };

  const icon = state === 'adding' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'added' ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />;

  if (variant === 'icon') {
    return (
      <button type="button" onClick={onClick} className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink transition-transform hover:scale-105 active:scale-95', className)} aria-label={`Add ${product.name} to basket`} data-testid="add-to-basket">
        {icon}
      </button>
    );
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-paper font-medium uppercase tracking-[0.16em] text-ink shadow-[0_10px_40px_-12px_rgba(220,199,161,0.6)] transition-colors hover:bg-white',
        variant === 'full' ? 'h-14 w-full text-[12px]' : 'h-10 px-4 text-[10.5px]',
        className,
      )}
      aria-label={`Add ${product.name} to basket`}
      data-testid="add-to-basket"
    >
      {icon}
      {state === 'added' ? 'Added' : 'Add to basket'}
    </motion.button>
  );
}

export function WishlistButton({ product, className, withLabel = false }: { product: ProductView; className?: string; withLabel?: boolean }) {
  const hydrated = useHydrated();
  const toggle = useWishlist((s) => s.toggle);
  const active = useWishlist((s) => s.items.some((i) => i.productId === product.id)) && hydrated;
  const showToast = useUi((s) => s.showToast);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(snapshot(product));
        showToast(added ? 'Saved to your wishlist' : 'Removed from your wishlist');
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full transition-colors',
        withLabel ? 'h-14 border border-white/12 px-6 text-[12px] uppercase tracking-[0.16em] text-paper hover:border-champagne/50' : 'h-10 w-10 bg-black/35 text-paper backdrop-blur-md hover:bg-black/55',
        className,
      )}
    >
      <motion.span animate={{ scale: active ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.35 }}>
        <Heart className={cn('h-4 w-4', active && 'fill-champagne text-champagne')} />
      </motion.span>
      {withLabel && (active ? 'Saved' : 'Wishlist')}
    </button>
  );
}
