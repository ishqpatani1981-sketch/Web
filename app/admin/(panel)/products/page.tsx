import Link from 'next/link';
import { and, asc, desc, eq, ilike, isNotNull, lte, or, type SQL } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { getDb } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { computeAvailability, AVAILABILITY_LABEL } from '@/lib/catalog';
import { formatPrice } from '@/lib/utils';
import { quickUpdateProduct } from '@/actions/admin/products';
import { Card, ConfirmButton, PageTitle, StatusPill, Table } from '@/components/admin/ui';
import { ProductImage } from '@/components/product/ProductImage';
import { StockInput } from '@/components/admin/StockInput';

export const metadata = { title: 'Products' };

type SP = Promise<{ q?: string; status?: string; category?: string; stock?: string; placeholder?: string; deleted?: string }>;

export default async function AdminProducts({ searchParams }: { searchParams: SP }) {
  await requirePermission('products:manage');
  const sp = await searchParams;
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  if (sp.q) where.push(or(ilike(products.name, `%${sp.q}%`), ilike(products.sku, `%${sp.q}%`)));
  if (sp.status) where.push(eq(products.status, sp.status));
  if (sp.category) where.push(eq(products.categoryId, sp.category));
  if (sp.stock === 'low') where.push(and(isNotNull(products.stockQuantity), lte(products.stockQuantity, products.lowStockThreshold)));
  if (sp.placeholder === '1') where.push(eq(products.isPlaceholder, true));
  const [rows, cats] = await Promise.all([
    db
      .select({ p: products, c: categories.name })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...where))
      .orderBy(asc(products.sortOrder), desc(products.createdAt))
      .limit(500),
    db.select({ id: categories.id, name: categories.name, rule: categories.rule }).from(categories).orderBy(asc(categories.sortOrder)),
  ]);

  return (
    <>
      <PageTitle
        title="Products"
        description="Add, edit and organise the catalogue. Changes appear on the website immediately."
        action={
          <Link href="/admin/products/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-paper px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />
      {sp.deleted && <p className="mb-4 rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success">Product deleted.</p>}
      <Card>
        <form className="mb-5 flex flex-wrap gap-3" role="search">
          <input name="q" defaultValue={sp.q} placeholder="Search name or SKU" className="field h-10 max-w-xs py-0" aria-label="Search products" />
          <select name="status" defaultValue={sp.status ?? ''} className="field h-10 w-auto py-0" aria-label="Status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select name="category" defaultValue={sp.category ?? ''} className="field h-10 w-auto py-0" aria-label="Collection">
            <option value="">All collections</option>
            {cats
              .filter((c) => c.rule === 'manual')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <select name="stock" defaultValue={sp.stock ?? ''} className="field h-10 w-auto py-0" aria-label="Stock">
            <option value="">Any stock</option>
            <option value="low">Low / sold out</option>
          </select>
          <button className="h-10 rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.14em] text-paper">Filter</button>
          {Object.keys(sp).length > 0 && (
            <Link href="/admin/products" className="flex items-center text-xs text-champagne">
              Clear
            </Link>
          )}
        </form>
        <Table head={['', 'Product', 'Collection', 'Price', 'Stock', 'Availability', 'Flags', '']} empty={rows.length === 0 ? <p className="p-6 text-sm text-titanium">No products match.</p> : null}>
          {rows.map(({ p, c }) => {
            const a = computeAvailability(p);
            const flag = (on: boolean, op: string, label: string) => (
              <ConfirmButton action={quickUpdateProduct} fields={{ id: p.id, op }} label={label} className={on ? '!border-champagne/40 !text-champagne' : 'opacity-60'} />
            );
            return (
              <tr key={p.id} className="align-middle hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <ProductImage src={p.images[0]?.url} alt={p.name} colour={p.colour} name={p.name} penType={p.penType} className="h-12 w-10 overflow-hidden rounded-lg bg-white/[0.03]" sizes="40px" />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="text-paper hover:text-champagne">
                    {p.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-titanium">
                    {p.sku ?? 'No SKU'} <StatusPill status={p.status} /> {p.isPlaceholder && <span className="text-warning">Demo</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-silver">{c ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">
                  <span className="text-paper">{p.pricePence === null ? 'TBC' : formatPrice(p.pricePence)}</span>
                  {p.originalPricePence && <span className="block text-xs text-titanium line-through">{formatPrice(p.originalPricePence)}</span>}
                </td>
                <td className="px-4 py-3">
                  <StockInput id={p.id} value={p.stockQuantity} />
                </td>
                <td className="px-4 py-3 text-xs text-silver">{AVAILABILITY_LABEL[a]}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {flag(p.isFeatured, 'featured', 'Featured')}
                    {flag(p.isBestseller, 'bestseller', 'Best')}
                    {flag(p.isNewArrival, 'new', 'New')}
                    {flag(p.isOnSale, 'sale', 'Sale')}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {a !== 'out_of_stock' && <ConfirmButton action={quickUpdateProduct} fields={{ id: p.id, op: 'soldout' }} label="Sold out" confirm={`Mark ${p.name} as sold out?`} />}
                    <Link href={`/admin/products/${p.id}`} className="rounded-full border border-white/12 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-silver hover:text-paper">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </>
  );
}
