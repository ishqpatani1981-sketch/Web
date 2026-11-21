'use server';

import { z } from 'zod';
import { quoteBasket, type Quote } from '@/lib/pricing';

const LinesSchema = z
  .array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(0).max(100) }))
  .max(50);

/** Returns a server-calculated quote for the client basket (prices, stock, discounts, delivery). */
export async function getBasketQuote(
  lines: { productId: string; quantity: number }[],
  discountCode?: string | null,
  deliveryOptionId?: string | null,
): Promise<Quote> {
  const parsed = LinesSchema.safeParse(lines);
  const code = typeof discountCode === 'string' ? discountCode.slice(0, 40) : null;
  const delivery = typeof deliveryOptionId === 'string' ? deliveryOptionId.slice(0, 40) : null;
  return quoteBasket(parsed.success ? parsed.data : [], { discountCode: code, deliveryOptionId: delivery });
}
