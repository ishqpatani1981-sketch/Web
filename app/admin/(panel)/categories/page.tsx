import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { getCollections } from '@/lib/catalog';
import { Card, PageTitle, Table } from '@/components/admin/ui';
import { CategoryForm } from '@/components/admin/CategoryForm';

export const metadata = { title: 'Collections' };

const RULES: Record<string, string> = { manual: 'Assigned products', on_sale: 'Auto: on sale', new_arrival: 'Auto: new arrivals', bestseller: 'Auto: bestsellers', featured: 'Auto: featured' };

export default async function CategoriesPage() {
  await requirePermission('products:manage');
  const cols = await getCollections();
  return (
    <>
      <PageTitle title="Collections" description="Organise products into collections. Names, images and descriptions appear on the homepage and collection pages." />
      <Card>
        <Table head={['Collection', 'Type', 'Products', '']}>
          {cols.map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/admin/categories/${c.id}`} className="text-paper hover:text-champagne">
                  {c.name}
                </Link>
                <span className="block text-xs text-titanium">/collections/{c.slug}{c.isPlaceholder ? ' · placeholder' : ''}</span>
              </td>
              <td className="px-4 py-3 text-xs text-silver">{RULES[c.rule] ?? c.rule}</td>
              <td className="px-4 py-3 tabular-nums">{c.productCount}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/categories/${c.id}`} className="rounded-full border border-white/12 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-silver hover:text-paper">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Add a collection" className="mt-6">
        <CategoryForm />
      </Card>
    </>
  );
}
