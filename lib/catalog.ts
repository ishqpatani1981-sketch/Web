import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories, products, type Category, type Product } from '@/lib/db/schema';
import { discountPercent } from '@/lib/utils';

export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'coming_soon';

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Sold out',
  preorder: 'Pre-order',
  coming_soon: 'Coming soon',
};

export function computeAvailability(p: Pick<Product, 'availability' | 'stockQuantity' | 'lowStockThreshold'>): Availability {
  switch (p.availability) {
    case 'in_stock':
      return 'in_stock';
    case 'out_of_stock':
    case 'sold_out':
      return 'out_of_stock';
    case 'preorder':
      return 'preorder';
    case 'coming_soon':
      return 'coming_soon';
  }
  if (p.stockQuantity === null || p.stockQuantity === undefined) return 'in_stock';
  if (p.stockQuantity <= 0) return 'out_of_stock';
  if (p.stockQuantity <= p.lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function isPurchasable(p: Product) {
  const a = computeAvailability(p);
  return p.status === 'active' && p.pricePence !== null && (a === 'in_stock' || a === 'low_stock' || a === 'preorder');
}

/** Serializable storefront view of a product (safe to pass to client components). */
export type ProductView = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  pricePence: number | null;
  originalPricePence: number | null;
  discountPercent: number;
  discountLabel: string | null;
  images: { url: string; alt: string }[];
  availability: Availability;
  availabilityLabel: string;
  /** Max quantity a customer can add (null = not tracked). */
  maxQuantity: number | null;
  purchasable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  isPlaceholder: boolean;
  penType: string | null;
  colour: string | null;
  material: string | null;
  brand: string | null;
  penModel: string | null;
  condition: string | null;
  dimensions: string | null;
  packaging: string | null;
  specifications: { label: string; value: string }[];
  categoryName: string | null;
  categorySlug: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export function toView(p: Product, category?: Pick<Category, 'name' | 'slug'> | null): ProductView {
  const availability = computeAvailability(p);
  const pct = discountPercent(p.pricePence, p.originalPricePence);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    shortDescription: p.shortDescription,
    description: p.description,
    pricePence: p.pricePence,
    originalPricePence: p.originalPricePence && p.pricePence && p.originalPricePence > p.pricePence ? p.originalPricePence : null,
    discountPercent: pct,
    discountLabel: p.discountLabel || (pct > 0 ? `-${pct}%` : null),
    images: p.images ?? [],
    availability,
    availabilityLabel: AVAILABILITY_LABEL[availability],
    maxQuantity: p.stockQuantity === null ? null : Math.max(0, p.stockQuantity),
    purchasable: isPurchasable(p),
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
    isNewArrival: p.isNewArrival,
    isOnSale: p.isOnSale || pct > 0,
    isPlaceholder: p.isPlaceholder,
    penType: p.penType,
    colour: p.colour,
    material: p.material,
    brand: p.brand,
    penModel: p.penModel,
    condition: p.condition,
    dimensions: p.dimensions,
    packaging: p.packaging,
    specifications: p.specifications ?? [],
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export type ProductQuery = {
  categorySlug?: string;
  rule?: 'on_sale' | 'new_arrival' | 'bestseller' | 'featured';
  q?: string;
  penType?: string;
  inStockOnly?: boolean;
  minPricePence?: number;
  maxPricePence?: number;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name' | 'discount';
  limit?: number;
  excludeId?: string;
};

function ruleCondition(rule: ProductQuery['rule']): SQL | undefined {
  switch (rule) {
    case 'on_sale':
      return or(eq(products.isOnSale, true), sql`${products.originalPricePence} > ${products.pricePence}`);
    case 'new_arrival':
      return eq(products.isNewArrival, true);
    case 'bestseller':
      return eq(products.isBestseller, true);
    case 'featured':
      return eq(products.isFeatured, true);
  }
}

export async function listProducts(query: ProductQuery = {}): Promise<ProductView[]> {
  const db = await getDb();
  const where: (SQL | undefined)[] = [eq(products.status, 'active')];

  if (query.categorySlug) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, query.categorySlug)).limit(1);
    if (!cat) return [];
    if (cat.rule !== 'manual') where.push(ruleCondition(cat.rule as ProductQuery['rule']));
    else where.push(eq(products.categoryId, cat.id));
  }
  if (query.rule) where.push(ruleCondition(query.rule));
  if (query.penType) where.push(eq(products.penType, query.penType));
  if (query.excludeId) where.push(ne(products.id, query.excludeId));
  if (query.minPricePence !== undefined) where.push(gte(products.pricePence, query.minPricePence));
  if (query.maxPricePence !== undefined) where.push(lte(products.pricePence, query.maxPricePence));
  if (query.q) {
    const term = `%${query.q.replace(/[%_\\]/g, (m) => `\\${m}`).slice(0, 80)}%`;
    where.push(
      or(
        ilike(products.name, term),
        ilike(products.shortDescription, term),
        ilike(products.colour, term),
        ilike(products.penType, term),
        ilike(products.brand, term),
        ilike(products.sku, term),
        ilike(products.material, term),
        ilike(categories.name, term),
      ),
    );
  }

  const order = (() => {
    switch (query.sort) {
      case 'newest':
        return [desc(products.createdAt)];
      case 'price-asc':
        return [sql`${products.pricePence} asc nulls last`];
      case 'price-desc':
        return [sql`${products.pricePence} desc nulls last`];
      case 'name':
        return [asc(products.name)];
      case 'discount':
        return [sql`coalesce(${products.originalPricePence} - ${products.pricePence}, 0) desc`];
      default:
        return [desc(products.isFeatured), asc(products.sortOrder), desc(products.createdAt)];
    }
  })();

  const rows = await db
    .select({ product: products, category: { name: categories.name, slug: categories.slug } })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...where))
    .orderBy(...order)
    .limit(query.limit ?? 200);

  let views = rows.map((r) => toView(r.product, r.category?.slug ? r.category : null));
  if (query.inStockOnly) views = views.filter((v) => v.purchasable);
  return views;
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductView | null> => {
  const db = await getDb();
  const [row] = await db
    .select({ product: products, category: { name: categories.name, slug: categories.slug } })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, 'active')))
    .limit(1);
  return row ? toView(row.product, row.category?.slug ? row.category : null) : null;
});

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const db = await getDb();
  return db.select().from(products).where(inArray(products.id, ids.slice(0, 100)));
}

export async function getRelatedProducts(p: ProductView, limit = 4) {
  const sameCategory = p.categorySlug ? await listProducts({ categorySlug: p.categorySlug, excludeId: p.id, limit }) : [];
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
  const more = await listProducts({ excludeId: p.id, limit: limit * 2 });
  const seen = new Set(sameCategory.map((x) => x.id));
  return [...sameCategory, ...more.filter((x) => !seen.has(x.id))].slice(0, limit);
}

export type CollectionView = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  rule: string;
  isPlaceholder: boolean;
  productCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

export const getCollections = cache(async (opts: { homepageOnly?: boolean } = {}): Promise<CollectionView[]> => {
  const db = await getDb();
  const cats = await db
    .select()
    .from(categories)
    .where(opts.homepageOnly ? eq(categories.showOnHomepage, true) : undefined)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const counts = await db
    .select({ categoryId: products.categoryId, n: sql<number>`count(*)::int` })
    .from(products)
    .where(eq(products.status, 'active'))
    .groupBy(products.categoryId);
  const countMap = new Map(counts.map((c) => [c.categoryId, c.n]));
  const [flagCounts] = await db
    .select({
      onSale: sql<number>`count(*) filter (where ${products.isOnSale} or ${products.originalPricePence} > ${products.pricePence})::int`,
      newArrival: sql<number>`count(*) filter (where ${products.isNewArrival})::int`,
      bestseller: sql<number>`count(*) filter (where ${products.isBestseller})::int`,
      featured: sql<number>`count(*) filter (where ${products.isFeatured})::int`,
    })
    .from(products)
    .where(eq(products.status, 'active'));
  const ruleCount: Record<string, number> = {
    on_sale: flagCounts?.onSale ?? 0,
    new_arrival: flagCounts?.newArrival ?? 0,
    bestseller: flagCounts?.bestseller ?? 0,
    featured: flagCounts?.featured ?? 0,
  };
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt,
    rule: c.rule,
    isPlaceholder: c.isPlaceholder,
    productCount: c.rule === 'manual' ? (countMap.get(c.id) ?? 0) : (ruleCount[c.rule] ?? 0),
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
  }));
});

export async function getCollectionBySlug(slug: string) {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function hasPlaceholderContent() {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(eq(products.isPlaceholder, true), eq(products.status, 'active')));
  return (row?.n ?? 0) > 0;
}

export const PEN_TYPES = [
  { value: 'fountain', label: 'Fountain pens' },
  { value: 'rollerball', label: 'Rollerball pens' },
  { value: 'ballpoint', label: 'Ballpoint pens' },
  { value: 'set', label: 'Pen sets' },
  { value: 'other', label: 'Other' },
];
