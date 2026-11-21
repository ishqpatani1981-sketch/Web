'use client';

import { useState } from 'react';
import type { ProductView } from '@/lib/catalog';
import { QuantityStepper } from './QuantityStepper';
import { AddToBasketButton, WishlistButton } from './ProductActions';

export function ProductPurchase({ product }: { product: ProductView }) {
  const [qty, setQty] = useState(1);
  const max = Math.min(10, product.availability === 'preorder' ? 10 : (product.maxQuantity ?? 10));
  return (
    <div className="space-y-3">
      {product.purchasable && (
        <div className="flex items-center gap-4">
          <span className="label mb-0">Quantity</span>
          <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, max)} />
        </div>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <AddToBasketButton product={product} quantity={qty} variant="full" />
        </div>
        <WishlistButton product={product} withLabel />
      </div>
    </div>
  );
}
