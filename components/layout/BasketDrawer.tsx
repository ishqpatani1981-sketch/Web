'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, Trash2, X } from 'lucide-react';
import { useBasket, useHydrated, useUi } from '@/store/shop';
import { useQuote } from '@/components/basket/useQuote';
import { EmptyBasket } from '@/components/basket/EmptyBasket';
import { ProductImage } from '@/components/product/ProductImage';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { LinkButton } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

export function BasketDrawer() {
  const { basketOpen, setBasketOpen } = useUi();
  const hydrated = useHydrated();
  const items = useBasket((s) => s.items);
  const setQuantity = useBasket((s) => s.setQuantity);
  const remove = useBasket((s) => s.remove);
  const { quote } = useQuote(basketOpen);
  const close = () => setBasketOpen(false);

  useEffect(() => {
    if (!basketOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketOpen]);

  const subtotal = quote?.subtotalPence ?? items.reduce((s, i) => s + (i.pricePence ?? 0) * i.quantity, 0);
  const standard = quote?.deliveryOptions.find((o) => o.freeOverPence > 0);
  const remaining = standard ? standard.freeOverPence - subtotal : 0;

  return (
    <AnimatePresence>
      {basketOpen && (
        <motion.div className="fixed inset-0 z-[75]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Basket">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={close} />
          <motion.aside
            initial={{ x: '104%' }}
            animate={{ x: 0 }}
            exit={{ x: '104%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="glass-strong glass-edge absolute bottom-2 right-2 top-2 flex w-[calc(100%-16px)] max-w-md flex-col overflow-hidden rounded-[28px] sm:bottom-3 sm:right-3 sm:top-3"
            data-testid="basket-drawer"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="text-sm uppercase tracking-[0.24em] text-paper">
                Your basket {hydrated && items.length > 0 && <span className="text-titanium">({items.reduce((n, i) => n + i.quantity, 0)})</span>}
              </h2>
              <button onClick={close} className="rounded-full p-2 text-titanium hover:bg-white/10 hover:text-paper" aria-label="Close basket">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!hydrated || items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyBasket compact onNavigate={close} />
              </div>
            ) : (
              <>
                {standard && (
                  <div className="border-b border-white/10 px-6 py-3.5">
                    <p className="text-xs text-silver">
                      {remaining > 0 ? (
                        <>
                          Spend <span className="text-champagne">{formatPrice(remaining)}</span> more for free {standard.name.toLowerCase()}
                        </>
                      ) : (
                        <>You qualify for free {standard.name.toLowerCase()}</>
                      )}
                      {standard.placeholder && <span className="text-titanium"> (placeholder rate)</span>}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-gold-deep via-champagne to-paper" initial={false} animate={{ width: `${Math.min(100, (subtotal / standard.freeOverPence) * 100)}%` }} />
                    </div>
                  </div>
                )}
                <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const line = quote?.lines.find((l) => l.productId === item.productId);
                      return (
                        <motion.li key={item.productId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="flex gap-4 rounded-2xl p-3 hover:bg-white/[0.03]">
                          <Link href={`/products/${item.slug}`} onClick={close} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.03]">
                            <ProductImage src={item.imageUrl} alt={item.name} colour={item.colour} name={item.name} penType={item.penType} className="h-full w-full" sizes="80px" />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <Link href={`/products/${item.slug}`} onClick={close} className="text-sm leading-snug text-paper hover:text-champagne">
                                {item.name}
                              </Link>
                              <button onClick={() => remove(item.productId)} className="rounded-full p-1 text-titanium hover:text-danger" aria-label={`Remove ${item.name}`}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-sm text-silver">{formatPrice(line?.unitPricePence ?? item.pricePence)}</p>
                            {line?.issue && <p className="mt-1 text-xs text-warning">{line.issue}</p>}
                            <div className="mt-auto pt-2">
                              <QuantityStepper size="sm" value={item.quantity} max={line?.maxQuantity ?? item.maxQuantity ?? 10} onChange={(v) => setQuantity(item.productId, v)} label={`Quantity of ${item.name}`} />
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <div className="space-y-4 border-t border-white/10 px-6 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-silver">Subtotal</span>
                    <span className="text-lg text-paper">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-titanium">Delivery and discount codes are calculated at checkout.</p>
                  <div className="grid grid-cols-2 gap-2" onClick={close}>
                    <LinkButton href="/basket" variant="glass">
                      View basket
                    </LinkButton>
                    <LinkButton href="/checkout" data-testid="drawer-checkout">
                      <Lock className="h-3.5 w-3.5" /> Checkout
                    </LinkButton>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
