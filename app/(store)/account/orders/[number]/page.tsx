import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { requireCustomer } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getOrderById, ORDER_STATUS_LABEL } from '@/lib/orders';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Order details', robots: { index: false } };

export default async function CustomerOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const user = await requireCustomer();
  const { number } = await params;
  const db = await getDb();
  const [row] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.orderNumber, number), eq(orders.userId, user.id))).limit(1);
  if (!row) notFound();
  const data = await getOrderById(row.id);
  if (!data) notFound();
  const { order, items, events } = data;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-36 sm:px-8">
      <Link href="/account" className="text-xs uppercase tracking-[0.18em] text-titanium hover:text-paper">
        ← My account
      </Link>
      <h1 className="mt-4 text-3xl font-light text-paper">{order.orderNumber}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{ORDER_STATUS_LABEL[order.status] ?? order.status}</Badge>
        {order.isDemo && <Badge tone="demo">Demo order</Badge>}
        <span className="text-sm text-titanium">Placed {formatDate(order.createdAt)}</span>
      </div>
      <div className="glass mt-8 rounded-[24px] p-6">
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span className="text-paper">
                {i.productName} <span className="text-titanium">× {i.quantity}</span>
              </span>
              <span>{formatPrice(i.lineTotalPence)}</span>
            </li>
          ))}
        </ul>
        <div className="hairline my-4" />
        <p className="flex justify-between text-paper">
          <span>Total</span>
          <span>{formatPrice(order.totalPence)}</span>
        </p>
        {order.trackingNumber && (
          <p className="mt-4 text-sm text-silver">
            Tracking: {order.trackingUrl ? <a href={order.trackingUrl} className="text-champagne underline" target="_blank" rel="noopener noreferrer">{order.trackingNumber}</a> : order.trackingNumber}
          </p>
        )}
      </div>
      <h2 className="mt-10 text-sm uppercase tracking-[0.22em] text-paper">Timeline</h2>
      <ol className="mt-4 space-y-3 border-l border-white/10 pl-5">
        {events
          .filter((e) => e.visibleToCustomer)
          .map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-paper">{e.message}</span>
              <span className="block text-xs text-titanium">{formatDateTime(e.createdAt)}</span>
            </li>
          ))}
      </ol>
    </div>
  );
}
