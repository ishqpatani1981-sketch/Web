import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { discountCodes, type DiscountCode } from '@/lib/db/schema';
import { getProductsByIds, isPurchasable, computeAvailability } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import type { DeliveryOption } from '@/lib/settings/defaults';

export type BasketLineInput = { productId: string; quantity: number };

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  colour: string | null;
  penType: string | null;
  unitPricePence: number;
  quantity: number;
  lineTotalPence: number;
  maxQuantity: number | null;
  isPlaceholder: boolean;
  issue: string | null;
};

export type Quote = {
  lines: QuoteLine[];
  subtotalPence: number;
  discount: { code: string; description: string | null; amountPence: number; freeDelivery: boolean } | null;
  discountError: string | null;
  deliveryOptions: (DeliveryOption & { effectivePricePence: number })[];
  delivery: { id: string; name: string; pricePence: number; placeholder: boolean } | null;
  totalPence: number;
  hasIssues: boolean;
  itemCount: number;
};

export const MAX_LINE_QUANTITY = 10;

export async function findDiscountCode(code: string): Promise<DiscountCode | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(discountCodes)
    .where(eq(sql`upper(${discountCodes.code})`, code.trim().toUpperCase()))
    .limit(1);
  return row ?? null;
}

export function validateDiscount(d: DiscountCode | null, subtotalPence: number): string | null {
  if (!d || !d.active) return 'That discount code is not valid.';
  const now = Date.now();
  if (d.startsAt && d.startsAt.getTime() > now) return 'That discount code is not active yet.';
  if (d.endsAt && d.endsAt.getTime() <= now) return 'That discount code has expired.';
  if (d.maxUses !== null && d.usedCount >= d.maxUses) return 'That discount code has reached its usage limit.';
  if (subtotalPence < d.minOrderPence) return `This code requires a minimum order of £${(d.minOrderPence / 100).toFixed(2)}.`;
  return null;
}

export async function quoteBasket(
  input: BasketLineInput[],
  opts: { discountCode?: string | null; deliveryOptionId?: string | null } = {},
): Promise<Quote> {
  // Merge duplicate lines and clamp quantities.
  const merged = new Map<string, number>();
  for (const l of input.slice(0, 50)) {
    if (typeof l?.productId !== 'string' || !/^[0-9a-f-]{36}$/i.test(l.productId)) continue;
    const q = Math.floor(Number(l.quantity));
    if (!Number.isFinite(q) || q < 1) continue;
    merged.set(l.productId, Math.min(MAX_LINE_QUANTITY, (merged.get(l.productId) ?? 0) + q));
  }

  const found = await getProductsByIds([...merged.keys()]);
  const byId = new Map(found.map((p) => [p.id, p]));

  const lines: QuoteLine[] = [];
  for (const [productId, requested] of merged) {
    const p = byId.get(productId);
    if (!p) continue; // product deleted — silently dropped
    let quantity = requested;
    let issue: string | null = null;
    const availability = computeAvailability(p);
    if (!isPurchasable(p)) {
      issue = p.pricePence === null ? 'Price to be confirmed — not yet available to buy.' : availability === 'coming_soon' ? 'Coming soon — not yet available.' : 'This item is sold out.';
      quantity = 0;
    } else if (p.stockQuantity !== null && availability !== 'preorder' && quantity > p.stockQuantity) {
      quantity = Math.max(0, p.stockQuantity);
      issue = `Only ${p.stockQuantity} available — quantity adjusted.`;
    }
    const unit = p.pricePence ?? 0;
    lines.push({
      productId,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      imageUrl: p.images?.[0]?.url ?? null,
      colour: p.colour,
      penType: p.penType,
      unitPricePence: unit,
      quantity,
      lineTotalPence: unit * quantity,
      maxQuantity: p.stockQuantity === null || availability === 'preorder' ? MAX_LINE_QUANTITY : Math.min(MAX_LINE_QUANTITY, p.stockQuantity),
      isPlaceholder: p.isPlaceholder,
      issue,
    });
  }

  const subtotalPence = lines.reduce((s, l) => s + l.lineTotalPence, 0);

  let discount: Quote['discount'] = null;
  let discountError: string | null = null;
  if (opts.discountCode && opts.discountCode.trim()) {
    const d = await findDiscountCode(opts.discountCode);
    discountError = validateDiscount(d, subtotalPence);
    if (!discountError && d) {
      const amount =
        d.type === 'percent'
          ? Math.round((subtotalPence * Math.min(100, Math.max(0, d.value))) / 100)
          : d.type === 'fixed'
            ? Math.min(subtotalPence, Math.max(0, d.value))
            : 0;
      discount = { code: d.code.toUpperCase(), description: d.description, amountPence: amount, freeDelivery: d.type === 'free_delivery' };
    }
  }

  const settings = await getSettings();
  const afterDiscount = subtotalPence - (discount?.amountPence ?? 0);
  const deliveryOptions = settings.delivery.options
    .filter((o) => o.enabled)
    .map((o) => ({
      ...o,
      effectivePricePence: discount?.freeDelivery || (o.freeOverPence > 0 && afterDiscount >= o.freeOverPence) ? 0 : o.pricePence,
    }));
  const chosen = deliveryOptions.find((o) => o.id === opts.deliveryOptionId) ?? deliveryOptions[0] ?? null;
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const delivery = chosen && itemCount > 0 ? { id: chosen.id, name: chosen.name, pricePence: chosen.effectivePricePence, placeholder: chosen.placeholder } : null;

  return {
    lines,
    subtotalPence,
    discount,
    discountError,
    deliveryOptions,
    delivery,
    totalPence: Math.max(0, afterDiscount + (delivery?.pricePence ?? 0)),
    hasIssues: lines.some((l) => l.issue !== null),
    itemCount,
  };
}
