import { NextResponse } from 'next/server';
import { getCollections, listProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim().slice(0, 80);
  const category = searchParams.get('category') ?? undefined;
  const [products, collections] = await Promise.all([
    q || category ? listProducts({ q: q || undefined, categorySlug: category || undefined, limit: 8 }) : listProducts({ rule: 'bestseller', limit: 4 }),
    getCollections(),
  ]);
  const term = q.toLowerCase();
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      pricePence: p.pricePence,
      originalPricePence: p.originalPricePence,
      imageUrl: p.images[0]?.url ?? null,
      colour: p.colour,
      penType: p.penType,
      categoryName: p.categoryName,
      availabilityLabel: p.availabilityLabel,
      isPlaceholder: p.isPlaceholder,
    })),
    collections: collections
      .filter((c) => !term || c.name.toLowerCase().includes(term))
      .map((c) => ({ slug: c.slug, name: c.name, productCount: c.productCount })),
  });
}
