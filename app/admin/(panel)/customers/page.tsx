import { desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { orders, users } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { setUserRole } from '@/actions/admin/operations';
import { formatDate, formatPrice } from '@/lib/utils';
import { Card, PageTitle, Table } from '@/components/admin/ui';

export const metadata = { title: 'Customers' };

export default async function CustomersPage() {
  const me = await requirePermission('users:manage');
  const db = await getDb();
  const rows = await db
    .select({
      u: users,
      orders: sql<number>`count(${orders.id})::int`,
      spent: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'paid' then ${orders.totalPence} else 0 end),0)::int`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(500);
  return (
    <>
      <PageTitle title="Customers & team" description="Registered customer accounts and staff. Admins manage everything; staff manage products, orders and messages only." />
      <Card>
        <Table head={['Name', 'Email', 'Joined', 'Orders', 'Spent', 'Role']}>
          {rows.map(({ u, orders: n, spent }) => (
            <tr key={u.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-paper">{u.name ?? '—'}</td>
              <td className="px-4 py-3 text-silver">{u.email}</td>
              <td className="px-4 py-3 text-xs text-titanium">{formatDate(u.createdAt)}</td>
              <td className="px-4 py-3 tabular-nums">{n}</td>
              <td className="px-4 py-3 tabular-nums">{formatPrice(spent)}</td>
              <td className="px-4 py-3">
                {u.id === me.id ? (
                  <span className="text-xs text-titanium">{u.role} (you)</span>
                ) : (
                  <form action={setUserRole} className="flex gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} className="field h-8 w-auto py-0 text-xs" aria-label={`Role for ${u.email}`}>
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="rounded-full border border-white/12 px-3 text-[10px] uppercase tracking-[0.12em] text-silver hover:text-paper">Save</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
