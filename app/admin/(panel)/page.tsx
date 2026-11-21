import Link from 'next/link';
import { and, count, desc, eq, gte, inArray, isNotNull, lte, sql } from 'drizzle-orm';
import { AlertTriangle } from 'lucide-react';
import { getDb } from '@/lib/db';
import { orders, products, subscribers, users } from '@/lib/db/schema';
import { can, requirePermission } from '@/lib/auth/session';
import { integrationStatus } from '@/lib/config';
import { formatDate, formatPrice } from '@/lib/utils';
import { nowMs } from '@/lib/time';
import { Card, PageTitle, StatTile, StatusPill, Table } from '@/components/admin/ui';
import { SalesChart, type DayPoint } from '@/components/admin/SalesChart';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requirePermission('dashboard:view');
  const sp = await searchParams;
  const db = await getDb();
  const now = nowMs();
  const since30 = new Date(now - 30 * 86400e3);

  const [[sales], [demo], [productCount], [placeholderCount], lowStock, [newCustomers], subs, recent, daily] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${orders.totalPence}),0)::int`, n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.paymentStatus, 'paid')),
    db.select({ total: sql<number>`coalesce(sum(${orders.totalPence}),0)::int`, n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.paymentStatus, 'demo')),
    db.select({ n: count() }).from(products).where(eq(products.status, 'active')),
    db.select({ n: count() }).from(products).where(eq(products.isPlaceholder, true)),
    db
      .select({ id: products.id, name: products.name, sku: products.sku, stock: products.stockQuantity, threshold: products.lowStockThreshold })
      .from(products)
      .where(and(eq(products.status, 'active'), isNotNull(products.stockQuantity), lte(products.stockQuantity, products.lowStockThreshold)))
      .orderBy(products.stockQuantity)
      .limit(8),
    db.select({ n: count() }).from(users).where(and(eq(users.role, 'customer'), gte(users.createdAt, since30))),
    db.select({ status: subscribers.status, n: sql<number>`count(*)::int` }).from(subscribers).groupBy(subscribers.status),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${orders.paidAt} at time zone 'Europe/London'), 'YYYY-MM-DD')`,
        status: orders.paymentStatus,
        total: sql<number>`sum(${orders.totalPence})::int`,
        n: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(inArray(orders.paymentStatus, ['paid', 'demo']), gte(orders.paidAt, since30)))
      .groupBy(sql`1`, orders.paymentStatus),
  ]);

  // Plot real sales; fall back to demo orders (clearly titled) when nothing real exists yet.
  const plotDemo = sales.n === 0 && demo.n > 0;
  const days: DayPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400e3);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
    const row = daily.find((r) => r.day === key && r.status === (plotDemo ? 'demo' : 'paid'));
    days.push({ date: key, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' }), pence: row?.total ?? 0, orders: row?.n ?? 0 });
  }
  const subscribed = subs.find((s) => s.status === 'subscribed')?.n ?? 0;
  const pending = subs.find((s) => s.status === 'pending')?.n ?? 0;
  const issues = integrationStatus().filter((i) => !i.ok);

  return (
    <>
      <PageTitle title={`Good to see you${user.name && user.name !== 'Store administrator' ? `, ${user.name.split(' ')[0]}` : ''}.`} description="An overview of sales, stock and customers." />
      {sp.denied && <p className="mb-6 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-warning">Your role does not have access to that area.</p>}

      {(placeholderCount.n > 0 || issues.length > 0) && (
        <div className="mb-8 rounded-[22px] border border-warning/20 bg-warning/[0.05] p-5">
          <p className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" /> Before launch
            {can(user.role, 'settings:manage') && (
              <Link href="/admin/launch" className="ml-auto text-xs text-champagne underline">
                Open the launch checklist
              </Link>
            )}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-silver">
            {placeholderCount.n > 0 && (
              <li>
                {placeholderCount.n} demonstration product{placeholderCount.n === 1 ? '' : 's'} still listed —{' '}
                <Link href="/admin/products?placeholder=1" className="text-champagne underline">
                  replace or delete
                </Link>
                .
              </li>
            )}
            {issues.map((i) => (
              <li key={i.id}>
                <span className="text-paper">{i.name}:</span> {i.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total sales" value={formatPrice(sales.total)} hint={`${sales.n} paid order${sales.n === 1 ? '' : 's'}`} href="/admin/orders?payment=paid" />
        <StatTile label="Orders" value={sales.n + demo.n} hint={demo.n ? `${demo.n} demo (no payment)` : 'Paid orders'} href="/admin/orders" />
        <StatTile label="Average order value" value={sales.n ? formatPrice(Math.round(sales.total / sales.n)) : '—'} hint="Paid orders only" />
        <StatTile label="Products" value={productCount.n} hint={placeholderCount.n ? `${placeholderCount.n} demo` : 'Active listings'} href="/admin/products" />
        <StatTile label="Low stock" value={lowStock.length} hint="At or below threshold" href="/admin/products?stock=low" tone={lowStock.length ? 'warning' : 'default'} />
        <StatTile label="New customers" value={newCustomers.n} hint="Accounts, last 30 days" href="/admin/customers" />
        <StatTile label="Subscribers" value={subscribed} hint={`${pending} awaiting confirmation`} href="/admin/newsletter" />
        <StatTile label="Demo revenue" value={formatPrice(demo.total)} hint="Not real sales" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <SalesChart
            data={days}
            title={plotDemo ? 'Demo order value per day — no real sales yet' : 'Sales per day'}
            subtitle={plotDemo ? 'Showing demonstration orders so the chart can be previewed. Real paid orders replace this automatically.' : 'Paid orders, last 30 days (UK time)'}
          />
        </Card>
        <Card title="Low stock" action={<Link href="/admin/products?stock=low" className="text-xs text-champagne">View all</Link>}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-titanium">All tracked products are above their low-stock threshold.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="truncate text-paper hover:text-champagne">
                    {p.name}
                  </Link>
                  <span className={`whitespace-nowrap ${p.stock === 0 ? 'text-danger' : 'text-warning'}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent orders" className="mt-6" action={<Link href="/admin/orders" className="text-xs text-champagne">All orders</Link>}>
        <Table head={['Order', 'Customer', 'Date', 'Payment', 'Status', 'Total']} empty={recent.length === 0 ? <p className="p-6 text-sm text-titanium">No orders yet.</p> : null}>
          {recent.map((o) => (
            <tr key={o.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${o.id}`} className="text-paper hover:text-champagne">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-silver">{o.customerName}</td>
              <td className="px-4 py-3 text-titanium">{formatDate(o.createdAt)}</td>
              <td className="px-4 py-3">
                <StatusPill status={o.paymentStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={o.status} />
              </td>
              <td className="px-4 py-3 text-paper tabular-nums">{formatPrice(o.totalPence)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
