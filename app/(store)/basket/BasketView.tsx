'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Lock, Trash2 } from 'lucide-react';
import { useBasket } from '@/store/shop';
import { useQuote } from '@/components/basket/useQuote';
import { EmptyBasket } from '@/components/basket/EmptyBasket';
import { DiscountField, Totals } from '@/components/basket/OrderSummary';
import { ProductImage } from '@/components/product/ProductImage';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { LinkButton } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export function BasketView() {
  const { quote, loading, hydrated } = useQuote();
  const items = useBasket((s) => s.items);
  const setQuantity = useBasket((s) => s.setQuantity);
  const remove = useBasket((s) => s.remove);
  const deliveryOptionId = useBasket((s) => s.deliveryOptionId);
  const setDelivery = useBasket((s) => s.setDeliveryOption);

  if (!hydrated) return <div className="min-h-[70vh]" />;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-36 sm:px-8">
      <h1 className="display mb-12 text-[clamp(2.4rem,5vw,4.4rem)] text-paper">
        Your <span className="font-serif normal-case italic text-champagne">basket</span>
      </h1>
      {items.length === 0 ? (
        <div className="glass glass-edge rounded-[32px] py-10">
          <EmptyBasket />
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const line = quote?.lines.find((l) => l.productId === item.productId);
                  return (
                    <motion.li key={item.productId} layout exit={{ opacity: 0, x: -30 }} className="flex gap-5 py-6">
                      <Link href={`/products/${item.slug}`} className="h-32 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-graphite to-charcoal">
                        <ProductImage src={item.imageUrl} alt={item.name} colour={item.colour} name={item.name} penType={item.penType} className="h-full w-full" sizes="112px" />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link href={`/products/${item.slug}`} className="text-paper hover:text-champagne">
                              {item.name}
                            </Link>
                            <p className="mt-1 text-sm text-titanium">{formatPrice(line?.unitPricePence ?? item.pricePence)} each</p>
                            {line?.issue && <p className="mt-1 text-sm text-warning">{line.issue}</p>}
                            {line?.isPlaceholder && <p className="mt-1 text-xs text-warning/70">Demo product</p>}
                          </div>
                          <p className="text-paper">{formatPrice(line?.lineTotalPence ?? (item.pricePence ?? 0) * item.quantity)}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-4">
                          <QuantityStepper value={item.quantity} max={line?.maxQuantity ?? item.maxQuantity ?? 10} onChange={(v) => setQuantity(item.productId, v)} label={`Quantity of ${item.name}`} />
                          <button onClick={() => remove(item.productId)} className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-titanium hover:text-danger">
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            <Link href="/shop" className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-silver hover:text-paper">
              <ArrowLeft className="h-4 w-4" /> Continue shopping
            </Link>
          </div>

          <aside className="glass-strong glass-edge h-fit space-y-6 rounded-[28px] p-6 lg:sticky lg:top-28" aria-label="Order summary">
            <h2 className="text-sm uppercase tracking-[0.22em] text-paper">Order summary</h2>
            {quote && quote.deliveryOptions.length > 0 && (
              <div>
                <label htmlFor="delivery-estimate" className="label">
                  Delivery
                </label>
                <select id="delivery-estimate" className="field" value={deliveryOptionId ?? quote.delivery?.id ?? ''} onChange={(e) => setDelivery(e.target.value)}>
                  {quote.deliveryOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} — {o.effectivePricePence === 0 ? 'Free' : formatPrice(o.effectivePricePence)}
                      {o.placeholder ? ' (placeholder)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <DiscountField quote={quote} />
            <Totals quote={quote} loading={loading} />
            <LinkButton href="/checkout" size="lg" className="w-full" data-testid="basket-checkout">
              <Lock className="h-4 w-4" /> Secure checkout
            </LinkButton>
          </aside>
        </div>
      )}
      <RecentlyViewed />
    </div>
  );
}
