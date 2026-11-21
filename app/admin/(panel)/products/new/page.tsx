import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { PageTitle } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = { title: 'Add product' };

export default async function NewProductPage() {
  await requirePermission('products:manage');
  const db = await getDb();
  const cats = await db.select({ id: categories.id, name: categories.name, rule: categories.rule }).from(categories).orderBy(asc(categories.sortOrder));
  return (
    <>
      <Link href="/admin/products" className="text-xs uppercase tracking-[0.16em] text-titanium hover:text-paper">
        ← Products
      </Link>
      <PageTitle title="Add product" description="Only the name is required — everything else can be completed later." />
      <ProductForm categories={cats} />
    </>
  );
}
