import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrderByNumberAndToken, isOrderPaid, markOrderPaid, ORDER_STATUS_LABEL } from '@/lib/orders';
import { getStripe } from '@/lib/stripe';
import { formatDate, formatPrice } from '@/lib/utils';
import { ConfirmationMark, ClearBasket } from './Confirmation';
import { LinkButton } from '@/components/ui/Button';
import { PlaceholderNotice } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } };

type SP = Promise<{ order?: string; token?: string; session_id?: string }>;

export default async function SuccessPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (!sp.order || !sp.token) return <NotFound />;
  let data = await getOrderByNumberAndToken(sp.order, sp.token);
  if (!data) return <NotFound />;

  // If the webhook has not arrived yet, confirm the payment directly with Stripe.
  if (!isOrderPaid(data.order) && sp.session_id && data.order.stripeCheckoutSessionId === sp.session_id) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sp.session_id);
        if (session.payment_status === 'paid' && session.client_reference_id === data.order.id) {
          await markOrderPaid(data.order.id, { paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id });
          data = (await getOrderByNumberAndToken(sp.order, sp.token)) ?? data;
        }
      } catch (err) {
        console.error('[success] could not verify session', err);
      }
    }
  }

  const { order, items } = data;
  const paid = isOrderPaid(order);
  const first = order.customerName.split(' ')[0];

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-36 sm:px-8">
      {paid && <ClearBasket />}
      <div className="flex flex-col items-center text-center">
        <ConfirmationMark pending={!paid} />
        <p className="eyebrow mt-8">{paid ? 'Order confirmed' : 'Payment processing'}</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.8rem)] text-paper">
          {paid ? (
            <>
              Thank you, <span className="font-serif normal-case italic text-champagne">{first}.</span>
            </>
          ) : (
            'Almost there.'
          )}
        </h1>
        <p className="mt-4 max-w-md text-[15px] text-silver/85">
          {paid
            ? `Your order ${order.orderNumber} has been received. A confirmation has been sent to ${order.email}.`
            : `We are waiting for confirmation of your payment for order ${order.orderNumber}. This page will update once it is complete — you will also receive an email.`}
        </p>
      </div>

      {order.isDemo && (
        <PlaceholderNotice className="mt-8">This is a demonstration order — no payment was taken and nothing will be dispatched.</PlaceholderNotice>
      )}

      <div className="glass glass-edge mt-10 rounded-[28px] p-6 sm:p-8" data-testid="order-confirmation">
        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <Info label="Order number" value={order.orderNumber} />
          <Info label="Placed on" value={formatDate(order.createdAt)} />
          <Info label="Status" value={ORDER_STATUS_LABEL[order.status] ?? order.status} />
        </div>
        <div className="hairline my-6" />
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 text-sm">
              <span className="text-paper">
                {i.productName} <span className="text-titanium">× {i.quantity}</span>
              </span>
              <span className="text-silver">{formatPrice(i.lineTotalPence)}</span>
            </li>
          ))}
        </ul>
        <div className="hairline my-6" />
        <dl className="space-y-2 text-sm">
          <Line label="Subtotal" value={formatPrice(order.subtotalPence)} />
          {order.discountPence > 0 && <Line label={`Discount (${order.discountCode})`} value={`−${formatPrice(order.discountPence)}`} />}
          <Line label={`Delivery — ${order.deliveryMethodName ?? ''}`} value={order.deliveryPence ? formatPrice(order.deliveryPence) : 'Free'} />
          <div className="flex justify-between pt-2 text-base">
            <dt className="text-paper">Total</dt>
            <dd className="text-paper">{formatPrice(order.totalPence)}</dd>
          </div>
        </dl>
        <div className="hairline my-6" />
        <div className="grid gap-6 text-sm sm:grid-cols-2">
          <Address label="Delivering to" a={order.shippingAddress} name={order.customerName} />
          <Address label="Billing address" a={order.billingAddress} name={order.customerName} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <LinkButton href="/shop">Continue shopping</LinkButton>
        <LinkButton href="/track-order" variant="glass">
          Track my order
        </LinkButton>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-10 pt-40 text-center">
      <h1 className="text-3xl font-light text-paper">We couldn’t find that order</h1>
      <p className="mt-3 text-silver">Please use the link in your confirmation email, or track your order with your order number and email address.</p>
      <Link href="/track-order" className="mt-6 inline-block text-champagne underline">
        Track my order
      </Link>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-paper">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-titanium">{label}</dt>
      <dd className="text-silver">{value}</dd>
    </div>
  );
}

function Address({ label, a, name }: { label: string; a: { line1: string; line2?: string; city: string; county?: string; postcode: string; country: string }; name: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <address className="not-italic leading-relaxed text-silver">
        {name}
        <br />
        {[a.line1, a.line2, a.city, a.county, a.postcode, a.country].filter(Boolean).map((l, i) => (
          <span key={i} className="block">
            {l}
          </span>
        ))}
      </address>
    </div>
  );
}
