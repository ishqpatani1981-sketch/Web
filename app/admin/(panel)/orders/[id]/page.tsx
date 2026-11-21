import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/session';
import { getOrderById } from '@/lib/orders';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { saveOrderNotes } from '@/actions/admin/operations';
import { Card, PageTitle, StatusPill } from '@/components/admin/ui';
import { OrderStatusForm } from '@/components/admin/OrderStatusForm';

export const metadata = { title: 'Order' };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('orders:manage');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getOrderById(id);
  if (!data) notFound();
  const { order: o, items, events } = data;
  const addr = (a: typeof o.shippingAddress) => [a.line1, a.line2, a.city, a.county, a.postcode, a.country].filter(Boolean);
  return (
    <>
      <Link href="/admin/orders" className="text-xs uppercase tracking-[0.16em] text-titanium hover:text-paper">
        ← Orders
      </Link>
      <PageTitle
        title={o.orderNumber}
        description={`Placed ${formatDateTime(o.createdAt)}${o.paidAt ? ` · paid ${formatDateTime(o.paidAt)}` : ''}`}
        action={
          <div className="flex gap-2">
            <StatusPill status={o.paymentStatus} />
            <StatusPill status={o.status} />
          </div>
        }
      />
      {o.isDemo && <p className="mb-6 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-warning">Demonstration order — no payment was taken. Do not dispatch.</p>}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-white/[0.06] text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <span>
                    <span className="text-paper">{i.productName}</span>
                    <span className="block text-xs text-titanium">
                      {i.sku ?? 'No SKU'} · {formatPrice(i.unitPricePence)} × {i.quantity}
                      {i.productId && (
                        <>
                          {' '}
                          · <Link href={`/admin/products/${i.productId}`} className="text-champagne">product</Link>
                        </>
                      )}
                    </span>
                  </span>
                  <span className="text-paper tabular-nums">{formatPrice(i.lineTotalPence)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-titanium">Subtotal</dt><dd>{formatPrice(o.subtotalPence)}</dd></div>
              {o.discountPence > 0 && <div className="flex justify-between"><dt className="text-titanium">Discount ({o.discountCode})</dt><dd>−{formatPrice(o.discountPence)}</dd></div>}
              <div className="flex justify-between"><dt className="text-titanium">Delivery ({o.deliveryMethodName})</dt><dd>{formatPrice(o.deliveryPence)}</dd></div>
              <div className="flex justify-between text-base text-paper"><dt>Total</dt><dd>{formatPrice(o.totalPence)}</dd></div>
            </dl>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Customer">
              <p className="text-paper">{o.customerName}</p>
              <a href={`mailto:${o.email}`} className="block text-sm text-champagne">{o.email}</a>
              {o.phone && <a href={`tel:${o.phone}`} className="block text-sm text-silver">{o.phone}</a>}
              <p className="mt-2 text-xs text-titanium">{o.userId ? 'Registered customer' : 'Guest checkout'} · Marketing opt-in: {o.marketingOptIn ? 'yes (pending confirmation)' : 'no'}</p>
            </Card>
            <Card title="Delivery address">
              <address className="not-italic text-sm leading-relaxed text-silver">{addr(o.shippingAddress).map((l, i) => <span key={i} className="block">{l}</span>)}</address>
            </Card>
            <Card title="Billing address">
              <address className="not-italic text-sm leading-relaxed text-silver">{addr(o.billingAddress).map((l, i) => <span key={i} className="block">{l}</span>)}</address>
            </Card>
            <Card title="Payment">
              <p className="text-sm text-silver">{o.isDemo ? 'Demo — no payment' : o.stripePaymentIntentId ? 'Stripe' : 'Awaiting payment'}</p>
              {o.stripePaymentIntentId && (
                <a href={`https://dashboard.stripe.com/payments/${o.stripePaymentIntentId}`} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-champagne">
                  View in Stripe ({o.stripePaymentIntentId})
                </a>
              )}
            </Card>
          </div>
          {o.customerNotes && (
            <Card title="Customer notes">
              <p className="whitespace-pre-line text-sm text-silver">{o.customerNotes}</p>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Update order">
            <OrderStatusForm id={o.id} status={o.status} trackingNumber={o.trackingNumber} trackingUrl={o.trackingUrl} />
          </Card>
          <Card title="Internal notes">
            <form action={saveOrderNotes} className="space-y-3">
              <input type="hidden" name="id" value={o.id} />
              <textarea name="adminNotes" rows={4} defaultValue={o.adminNotes ?? ''} className="field" aria-label="Internal notes" placeholder="Only visible to staff" />
              <button className="h-9 rounded-full border border-white/15 px-4 text-[10.5px] uppercase tracking-[0.14em] text-paper">Save notes</button>
            </form>
          </Card>
          <Card title="Timeline">
            <ol className="space-y-3 border-l border-white/10 pl-4 text-sm">
              {events.map((e) => (
                <li key={e.id}>
                  <span className="text-paper">{e.message}</span>
                  <span className="block text-xs text-titanium">
                    {formatDateTime(e.createdAt)} {e.visibleToCustomer ? '· visible to customer' : '· internal'}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
