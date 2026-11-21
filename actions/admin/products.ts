'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { categories, products, type ProductImage } from '@/lib/db/schema';
import { assertPermission, audit } from '@/lib/auth/session';
import { storeImage } from '@/lib/storage';
import { slugify } from '@/lib/db/seed-data';
import { poundsToPence } from '@/lib/utils';
import { touchProductStockAlert } from '@/lib/orders';

export type FormState = { status: 'idle' | 'error' | 'success'; message: string; fieldErrors?: Record<string, string> };

const opt = (max = 500) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const ProductSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
  slug: z.string().trim().max(90).optional(),
  sku: opt(60),
  categoryId: z.string().uuid().optional().or(z.literal('')).transform((v) => v || null),
  status: z.enum(['active', 'draft', 'archived']),
  shortDescription: opt(400),
  description: opt(10000),
  price: z.string().trim().optional(),
  originalPrice: z.string().trim().optional(),
  discountLabel: opt(40),
  stockQuantity: z.string().trim().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000).default(3),
  availability: z.enum(['auto', 'in_stock', 'out_of_stock', 'sold_out', 'preorder', 'coming_soon']),
  condition: opt(80),
  brand: opt(80),
  penModel: opt(120),
  penType: opt(40),
  colour: opt(80),
  material: opt(200),
  dimensions: opt(200),
  packaging: opt(300),
  specifications: z.array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(300) })).max(40),
  images: z.array(z.object({ url: z.string().min(1).max(1000), alt: z.string().max(200) })).max(20),
  isFeatured: z.boolean(),
  isBestseller: z.boolean(),
  isNewArrival: z.boolean(),
  isOnSale: z.boolean(),
  isPlaceholder: z.boolean(),
  seoTitle: opt(120),
  seoDescription: opt(320),
});

function json<T>(v: FormDataEntryValue | null, fallback: T): T {
  try {
    return typeof v === 'string' && v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('products:manage');
  const id = (fd.get('id') as string) || null;
  const parsed = ProductSchema.safeParse({
    ...Object.fromEntries(
      ['name', 'slug', 'sku', 'categoryId', 'status', 'shortDescription', 'description', 'price', 'originalPrice', 'discountLabel', 'stockQuantity', 'lowStockThreshold', 'availability', 'condition', 'brand', 'penModel', 'penType', 'colour', 'material', 'dimensions', 'packaging', 'seoTitle', 'seoDescription'].map((k) => [k, fd.get(k) ?? undefined]),
    ),
    specifications: json(fd.get('specifications'), []),
    images: json(fd.get('images'), []),
    isFeatured: fd.get('isFeatured') === 'on',
    isBestseller: fd.get('isBestseller') === 'on',
    isNewArrival: fd.get('isNewArrival') === 'on',
    isOnSale: fd.get('isOnSale') === 'on',
    isPlaceholder: fd.get('isPlaceholder') === 'on',
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors };
  }
  const d = parsed.data;

  const pricePence = d.price ? poundsToPence(d.price) : null;
  if (d.price && pricePence === null) return { status: 'error', message: 'Price must be a number, e.g. 49.99', fieldErrors: { price: 'Invalid price' } };
  const originalPricePence = d.originalPrice ? poundsToPence(d.originalPrice) : null;
  if (d.originalPrice && originalPricePence === null) return { status: 'error', message: 'Original price must be a number', fieldErrors: { originalPrice: 'Invalid price' } };
  let stockQuantity: number | null = null;
  if (d.stockQuantity) {
    const n = Number(d.stockQuantity);
    if (!Number.isInteger(n) || n < 0) return { status: 'error', message: 'Stock must be a whole number (leave blank if not tracked)', fieldErrors: { stockQuantity: 'Invalid stock' } };
    stockQuantity = n;
  }

  // Upload any new photographs.
  const images: ProductImage[] = [...d.images];
  const files = fd.getAll('newImages').filter((f): f is File => f instanceof File && f.size > 0);
  try {
    for (const file of files.slice(0, 10)) images.push({ url: await storeImage(file, 'products'), alt: d.name });
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Image upload failed.' };
  }

  const db = await getDb();
  let slug = slugify(d.slug || d.name) || `product-${Date.now()}`;
  const clash = await db.select({ id: products.id }).from(products).where(and(eq(products.slug, slug), id ? ne(products.id, id) : undefined)).limit(1);
  if (clash.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  if (d.sku) {
    const skuClash = await db.select({ id: products.id }).from(products).where(and(eq(products.sku, d.sku), id ? ne(products.id, id) : undefined)).limit(1);
    if (skuClash.length) return { status: 'error', message: 'That SKU is already used by another product.', fieldErrors: { sku: 'SKU must be unique' } };
  }

  const values = {
    name: d.name,
    slug,
    sku: d.sku,
    categoryId: d.categoryId,
    status: d.status,
    shortDescription: d.shortDescription,
    description: d.description,
    pricePence,
    originalPricePence,
    discountLabel: d.discountLabel,
    images,
    stockQuantity,
    lowStockThreshold: d.lowStockThreshold,
    availability: d.availability,
    condition: d.condition,
    brand: d.brand,
    penModel: d.penModel,
    penType: d.penType,
    colour: d.colour,
    material: d.material,
    dimensions: d.dimensions,
    packaging: d.packaging,
    specifications: d.specifications,
    isFeatured: d.isFeatured,
    isBestseller: d.isBestseller,
    isNewArrival: d.isNewArrival,
    isOnSale: d.isOnSale,
    isPlaceholder: d.isPlaceholder,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
    updatedAt: new Date(),
  };

  let savedId = id;
  if (id) {
    await db.update(products).set(values).where(eq(products.id, id));
    await audit(user.id, 'product.update', 'product', id, d.name);
  } else {
    const [row] = await db.insert(products).values(values).returning({ id: products.id });
    savedId = row.id;
    await audit(user.id, 'product.create', 'product', row.id, d.name);
  }
  revalidatePath('/', 'layout');
  if (!id) redirect(`/admin/products/${savedId}?created=1`);
  return { status: 'success', message: 'Product saved.' };
}

export async function deleteProduct(fd: FormData) {
  const user = await assertPermission('products:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const db = await getDb();
  const [row] = await db.delete(products).where(eq(products.id, id)).returning({ name: products.name });
  await audit(user.id, 'product.delete', 'product', id, row?.name);
  revalidatePath('/', 'layout');
  redirect('/admin/products?deleted=1');
}

export async function duplicateProduct(fd: FormData) {
  const user = await assertPermission('products:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const db = await getDb();
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) return;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
  const [copy] = await db
    .insert(products)
    .values({ ...rest, name: `${p.name} (copy)`, slug: `${p.slug}-copy-${Math.random().toString(36).slice(2, 6)}`, sku: p.sku ? `${p.sku}-COPY` : null, status: 'draft' })
    .returning({ id: products.id });
  await audit(user.id, 'product.duplicate', 'product', copy.id, p.name);
  revalidatePath('/', 'layout');
  redirect(`/admin/products/${copy.id}`);
}

/** Quick actions from the product list: adjust stock, mark sold out, toggle flags. */
export async function quickUpdateProduct(fd: FormData) {
  const user = await assertPermission('products:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const op = z.enum(['stock', 'soldout', 'featured', 'bestseller', 'new', 'sale', 'activate', 'archive']).parse(fd.get('op'));
  const db = await getDb();
  switch (op) {
    case 'stock': {
      const value = fd.get('value');
      const n = value === '' || value === null ? null : Number(value);
      if (n !== null && (!Number.isInteger(n) || n < 0)) return;
      await db.update(products).set({ stockQuantity: n, updatedAt: new Date() }).where(eq(products.id, id));
      if (n !== null) await touchProductStockAlert(id);
      break;
    }
    case 'soldout':
      await db.update(products).set({ availability: 'sold_out', stockQuantity: sql`case when ${products.stockQuantity} is null then null else 0 end`, updatedAt: new Date() }).where(eq(products.id, id));
      break;
    case 'featured':
      await db.update(products).set({ isFeatured: sql`not ${products.isFeatured}` }).where(eq(products.id, id));
      break;
    case 'bestseller':
      await db.update(products).set({ isBestseller: sql`not ${products.isBestseller}` }).where(eq(products.id, id));
      break;
    case 'new':
      await db.update(products).set({ isNewArrival: sql`not ${products.isNewArrival}` }).where(eq(products.id, id));
      break;
    case 'sale':
      await db.update(products).set({ isOnSale: sql`not ${products.isOnSale}` }).where(eq(products.id, id));
      break;
    case 'activate':
      await db.update(products).set({ status: 'active' }).where(eq(products.id, id));
      break;
    case 'archive':
      await db.update(products).set({ status: 'archived' }).where(eq(products.id, id));
      break;
  }
  await audit(user.id, `product.${op}`, 'product', id);
  revalidatePath('/', 'layout');
}

/* ───────────── Categories / collections ───────────── */

const CategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  description: opt(400),
  rule: z.enum(['manual', 'on_sale', 'new_arrival', 'bestseller', 'featured']),
  sortOrder: z.coerce.number().int().min(0).max(999),
  showOnHomepage: z.boolean(),
  isPlaceholder: z.boolean(),
  imageUrl: opt(1000),
  imageAlt: opt(200),
  seoTitle: opt(120),
  seoDescription: opt(320),
});

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('products:manage');
  const id = (fd.get('id') as string) || null;
  const parsed = CategorySchema.safeParse({
    ...Object.fromEntries(['name', 'slug', 'description', 'rule', 'sortOrder', 'imageUrl', 'imageAlt', 'seoTitle', 'seoDescription'].map((k) => [k, fd.get(k) ?? undefined])),
    showOnHomepage: fd.get('showOnHomepage') === 'on',
    isPlaceholder: fd.get('isPlaceholder') === 'on',
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  const d = parsed.data;
  let imageUrl = d.imageUrl;
  const file = fd.get('image');
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await storeImage(file, 'collections');
    } catch (err) {
      return { status: 'error', message: err instanceof Error ? err.message : 'Upload failed' };
    }
  }
  const db = await getDb();
  const slug = slugify(d.slug || d.name);
  const clash = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug), id ? ne(categories.id, id) : undefined)).limit(1);
  if (clash.length) return { status: 'error', message: 'Another collection already uses that URL slug.' };
  const values = { ...d, slug, imageUrl, updatedAt: new Date() };
  if (id) await db.update(categories).set(values).where(eq(categories.id, id));
  else await db.insert(categories).values(values);
  await audit(user.id, id ? 'category.update' : 'category.create', 'category', id ?? slug, d.name);
  revalidatePath('/', 'layout');
  return { status: 'success', message: 'Collection saved.' };
}

export async function deleteCategory(fd: FormData) {
  const user = await assertPermission('products:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const db = await getDb();
  await db.delete(categories).where(eq(categories.id, id));
  await audit(user.id, 'category.delete', 'category', id);
  revalidatePath('/', 'layout');
  redirect('/admin/categories');
}
