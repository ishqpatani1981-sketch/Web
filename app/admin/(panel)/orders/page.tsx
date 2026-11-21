import Link from 'next/link';
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { ORDER_STATUSES, ORDER_STATUS_LABEL, PAYMENT_STATUSES } from '@/lib/orders';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { Card, PageTitle, StatusPill, Table } from '@/components/admin/ui';

export const metadata = { title: 'Orders' };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; payment?: string }> }) {
  await requirePermission('orders:manage');
  const sp = await searchParams;
  const db = await getDb();
  const where: (SQL | undefined)[] = [];
  if (sp.q) where.push(or(ilike(orders.orderNumber, `%${sp.q}%`), ilike(orders.email, `%${sp.q}%`), ilike(orders.customerName, `%${sp.q}%`)));
  if (sp.status) where.push(eq(orders.status, sp.status));
  if (sp.payment) where.push(eq(orders.paymentStatus, sp.payment));
  const rows = await db.select().from(orders).where(and(...where)).orderBy(desc(orders.createdAt)).limit(300);
  return (
    <>
      <PageTitle title="Orders" description="Every order placed on the website. Open an order to update its status, add tracking and notify the customer." />
      <Card>
        <form className="mb-5 flex flex-wrap gap-3" role="search">
          <input name="q" defaultValue={sp.q} placeholder="Order number, name or email" className="field h-10 max-w-xs py-0" aria-label="Search orders" />
          <select name="status" defaultValue={sp.status ?? ''} className="field h-10 w-auto py-0" aria-label="Order status">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select name="payment" defaultValue={sp.payment ?? ''} className="field h-10 w-auto py-0" aria-label="Payment status">
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="h-10 rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.14em] text-paper">Filter</button>
        </form>
        <Table head={['Order', 'Customer', 'Placed', 'Items', 'Payment', 'Status', 'Delivery', 'Total']} empty={rows.length === 0 ? <p className="p-6 text-sm text-titanium">No orders found.</p> : null}>
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${o.id}`} className="text-paper hover:text-champagne">
                  {o.orderNumber}
                </Link>
                {o.isDemo && <span className="ml-2 text-[10px] uppercase tracking-wider text-warning">Demo</span>}
              </td>
              <td className="px-4 py-3">
                <span className="text-silver">{o.customerName}</span>
                <span className="block text-xs text-titanium">{o.email}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-titanium">{formatDateTime(o.createdAt)}</td>
              <td className="px-4 py-3 text-xs text-titanium">{o.discountCode ? `Code ${o.discountCode}` : '—'}</td>
              <td className="px-4 py-3">
                <StatusPill status={o.paymentStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={o.status} />
              </td>
              <td className="px-4 py-3 text-xs text-titanium">{o.deliveryMethodName ?? '—'}</td>
              <td className="px-4 py-3 text-paper tabular-nums">{formatPrice(o.totalPence)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
