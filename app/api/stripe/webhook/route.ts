import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { stripeConfig } from '@/lib/config';
import { markOrderPaid, markPaymentFailed, markRefunded, recordOrderAlert } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * Stripe webhook. Configure in the Stripe dashboard → Developers → Webhooks with endpoint
 *   https://<your-domain>/api/stripe/webhook
 * and events: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired,
 * payment_intent.payment_failed, charge.refunded, charge.dispute.created.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const { webhookSecret } = stripeConfig();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (err) {
    console.error('[stripe] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const s = event.data.object;
        const orderId = s.client_reference_id ?? s.metadata?.orderId;
        if (orderId && s.payment_status === 'paid') {
          await markOrderPaid(orderId, { paymentIntentId: typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id });
        }
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const s = event.data.object;
        const orderId = s.client_reference_id ?? s.metadata?.orderId;
        if (orderId) await markPaymentFailed(orderId, 'The payment could not be completed (asynchronous payment failed).');
        break;
      }
      case 'checkout.session.expired': {
        const s = event.data.object;
        const orderId = s.client_reference_id ?? s.metadata?.orderId;
        if (orderId) await markPaymentFailed(orderId, 'Checkout session expired without payment.', { expired: true });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (orderId) await markPaymentFailed(orderId, pi.last_payment_error?.message ?? 'Payment failed.');
        break;
      }
      case 'charge.refunded': {
        const ch = event.data.object;
        const pi = typeof ch.payment_intent === 'string' ? ch.payment_intent : ch.payment_intent?.id;
        if (pi) await markRefunded(pi, ch.amount_refunded, ch.refunded);
        break;
      }
      case 'charge.dispute.created': {
        const d = event.data.object;
        const pi = typeof d.payment_intent === 'string' ? d.payment_intent : d.payment_intent?.id;
        if (pi) await recordOrderAlert(pi, `A payment dispute was opened (${d.reason}). Respond in the Stripe dashboard.`);
        break;
      }
    }
  } catch (err) {
    console.error('[stripe] webhook handling failed', event.type, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
