import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ExternalLink } from 'lucide-react';
import { getDb } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { ConfirmButton, PageTitle } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/ProductForm';
import { deleteProduct, duplicateProduct } from '@/actions/admin/products';

export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requirePermission('products:manage');
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();
  const cats = await db.select({ id: categories.id, name: categories.name, rule: categories.rule }).from(categories).orderBy(asc(categories.sortOrder));
  return (
    <>
      <Link href="/admin/products" className="text-xs uppercase tracking-[0.16em] text-titanium hover:text-paper">
        ← Products
      </Link>
      <PageTitle
        title={product.name}
        description={product.sku ?? undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {product.status === 'active' && (
              <a href={`/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-silver hover:text-paper">
                <ExternalLink className="h-3.5 w-3.5" /> View on site
              </a>
            )}
            <ConfirmButton action={duplicateProduct} fields={{ id }} label="Duplicate" />
            <ConfirmButton action={deleteProduct} fields={{ id }} label="Delete" variant="danger" confirm={`Delete “${product.name}” permanently? Past orders keep their records. Consider archiving instead.`} />
          </div>
        }
      />
      {sp.created && <p className="mb-6 rounded-xl border border-success/25 bg-success/10 p-3 text-sm text-success">Product created.</p>}
      <ProductForm product={product} categories={cats} />
    </>
  );
}
