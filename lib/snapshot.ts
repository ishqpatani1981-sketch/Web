import type { ProductView } from '@/lib/catalog';

/** Minimal, serialisable product snapshot used by the client basket/wishlist/recently viewed. */
export function snapshot(p: Pick<ProductView, 'id' | 'slug' | 'name' | 'pricePence' | 'images' | 'colour' | 'penType' | 'maxQuantity'>) {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    pricePence: p.pricePence,
    imageUrl: p.images[0]?.url ?? null,
    colour: p.colour,
    penType: p.penType,
    maxQuantity: p.maxQuantity,
  };
}
