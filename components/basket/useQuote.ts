'use client';

import { useEffect, useState } from 'react';
import { getBasketQuote } from '@/actions/basket';
import { useBasket, useHydrated } from '@/store/shop';
import type { Quote } from '@/lib/pricing';

/** Keeps a server-calculated quote in sync with the client basket. */
export function useQuote(enabled = true) {
  const hydrated = useHydrated();
  const items = useBasket((s) => s.items);
  const discountCode = useBasket((s) => s.discountCode);
  const deliveryOptionId = useBasket((s) => s.deliveryOptionId);
  const [result, setResult] = useState<{ key: string; quote: Quote | null } | null>(null);
  const key = JSON.stringify([items.map((i) => [i.productId, i.quantity]), discountCode, deliveryOptionId]);

  useEffect(() => {
    if (!hydrated || !enabled) return;
    let cancelled = false;
    getBasketQuote(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      discountCode || null,
      deliveryOptionId,
    )
      .then((q) => !cancelled && setResult({ key, quote: q }))
      .catch(() => !cancelled && setResult({ key, quote: null }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated, enabled]);

  // Keep showing the previous quote while a new one loads.
  return { quote: result?.quote ?? null, loading: hydrated && enabled && result?.key !== key, hydrated };
}
