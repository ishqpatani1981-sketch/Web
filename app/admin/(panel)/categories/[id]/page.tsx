import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { Card, ConfirmButton, PageTitle } from '@/components/admin/ui';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { deleteCategory } from '@/actions/admin/products';

export const metadata = { title: 'Edit collection' };

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('products:manage');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [c] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!c) notFound();
  return (
    <>
      <Link href="/admin/categories" className="text-xs uppercase tracking-[0.16em] text-titanium hover:text-paper">
        ← Collections
      </Link>
      <PageTitle title={c.name} action={<ConfirmButton action={deleteCategory} fields={{ id }} label="Delete" variant="danger" confirm={`Delete the “${c.name}” collection? Its products are kept but unassigned.`} />} />
      <Card>
        <CategoryForm key={c.updatedAt.toISOString()} category={c} />
      </Card>
    </>
  );
}
