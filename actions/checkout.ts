'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { quoteBasket } from '@/lib/pricing';
import { createOrder, markOrderPaid, findOrderForTracking } from '@/lib/orders';
import { getStripe } from '@/lib/stripe';
import { demoPaymentsEnabled, siteUrl } from '@/lib/config';
import { getCurrentUser } from '@/lib/auth/session';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getSettings } from '@/lib/settings';
import { subscribe } from '@/lib/marketing';
import { getDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils';

export type CheckoutState = { status: 'idle' | 'error'; message: string; fieldErrors?: Record<string, string> };

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const address = (prefix: string) =>
  z
    .object({
      line1: z.string().trim().min(2, `${prefix}: address line 1 is required`).max(120),
      line2: z.string().trim().max(120).optional().or(z.literal('')),
      city: z.string().trim().min(2, `${prefix}: town or city is required`).max(80),
      county: z.string().trim().max(80).optional().or(z.literal('')),
      postcode: z.string().trim().toUpperCase().min(2, `${prefix}: postcode is required`).max(12),
      country: z.string().trim().min(2).max(60),
    })
    .superRefine((a, ctx) => {
      if (a.country === 'United Kingdom' && !UK_POSTCODE.test(a.postcode)) {
        ctx.addIssue({ code: 'custom', path: ['postcode'], message: `${prefix}: please enter a valid UK postcode` });
      }
    });

const CheckoutSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(200),
  phone: z.string().trim().max(30).regex(/^[+\d\s()-]*$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  shipping: address('Delivery address'),
  billingSame: z.boolean(),
  billing: z.any(),
  deliveryOptionId: z.string().max(40),
  discountCode: z.string().trim().max(40).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  marketingOptIn: z.boolean(),
  acceptTerms: z.literal(true, { message: 'Please accept the terms and conditions to continue' }),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(10) })).min(1, 'Your basket is empty').max(50),
});

function field(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === 'string' ? v : '';
}

function addr(fd: FormData, p: string) {
  return { line1: field(fd, `${p}.line1`), line2: field(fd, `${p}.line2`), city: field(fd, `${p}.city`), county: field(fd, `${p}.county`), postcode: field(fd, `${p}.postcode`), country: field(fd, `${p}.country`) || 'United Kingdom' };
}

export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  let items: unknown = [];
  try {
    items = JSON.parse(field(fd, 'items') || '[]');
  } catch {
    items = [];
  }
  const billingSame = fd.get('billingSame') === 'on';
  const parsed = CheckoutSchema.safeParse({
    name: field(fd, 'name'),
    email: field(fd, 'email'),
    phone: field(fd, 'phone'),
    shipping: addr(fd, 'shipping'),
    billingSame,
    billing: billingSame ? null : addr(fd, 'billing'),
    deliveryOptionId: field(fd, 'deliveryOptionId'),
    discountCode: field(fd, 'discountCode'),
    notes: field(fd, 'notes'),
    marketingOptIn: fd.get('marketingOptIn') === 'on',
    acceptTerms: fd.get('acceptTerms') === 'on',
    items,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join('.')] ??= issue.message;
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check your details.', fieldErrors };
  }
  const data = parsed.data;
  let billingAddress = data.shipping;
  if (!data.billingSame) {
    const b = address('Billing address').safeParse(data.billing);
    if (!b.success) return { status: 'error', message: b.error.issues[0]?.message ?? 'Please check your billing address.', fieldErrors: { [`billing.${String(b.error.issues[0]?.path[0])}`]: b.error.issues[0]?.message ?? '' } };
    billingAddress = b.data;
  }

  const ip = await clientIp();
  if (!(await rateLimit('checkout', ip, 20, 600))) return { status: 'error', message: 'Too many checkout attempts. Please wait a few minutes and try again.' };

  const settings = await getSettings();
  if (!settings.delivery.shipsTo.includes(data.shipping.country)) {
    return { status: 'error', message: `Sorry, we do not currently deliver to ${data.shipping.country}.` };
  }
  if (!settings.delivery.options.some((o) => o.enabled && o.id === data.deliveryOptionId)) {
    return { status: 'error', message: 'Please choose a delivery option.' };
  }

  // Server-side source of truth for every price, discount and delivery charge.
  const quote = await quoteBasket(data.items, { discountCode: data.discountCode || null, deliveryOptionId: data.deliveryOptionId });
  if (quote.itemCount === 0) return { status: 'error', message: 'None of the items in your basket are currently available.' };
  if (quote.hasIssues) {
    return { status: 'error', message: `Some items have changed: ${quote.lines.filter((l) => l.issue).map((l) => `${l.name} — ${l.issue}`).join(' ')} Please review your basket.` };
  }
  if (data.discountCode && quote.discountError) return { status: 'error', message: quote.discountError, fieldErrors: { discountCode: quote.discountError } };

  const stripe = getStripe();
  const demo = !stripe && demoPaymentsEnabled();
  if (!stripe && !demo) {
    return { status: 'error', message: 'Online payments are awaiting configuration. Please contact us to place your order.' };
  }

  const user = await getCurrentUser();
  const order = await createOrder({
    quote,
    customerName: data.name,
    email: data.email,
    phone: data.phone || null,
    shippingAddress: { ...data.shipping, line2: data.shipping.line2 || undefined, county: data.shipping.county || undefined },
    billingAddress: { ...billingAddress, line2: billingAddress.line2 || undefined, county: billingAddress.county || undefined },
    customerNotes: data.notes || null,
    marketingOptIn: data.marketingOptIn,
    userId: user?.id ?? null,
    isDemo: demo,
  });

  if (data.marketingOptIn) {
    // Double opt-in: a confirmation email is sent; nothing is sent until confirmed.
    await subscribe({ email: data.email, name: data.name, source: 'checkout', consentText: settings.newsletter.consentText, ip }).catch((e) => console.error('[checkout] subscribe failed', e));
  }

  const successUrl = `${siteUrl()}/checkout/success?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`;

  if (demo) {
    await markOrderPaid(order.id, { demo: true });
    redirect(successUrl);
  }

  let sessionUrl: string | null = null;
  try {
    const coupon = quote.discount && quote.discount.amountPence > 0
      ? await stripe!.coupons.create({ amount_off: quote.discount.amountPence, currency: 'gbp', duration: 'once', max_redemptions: 1, name: `Discount ${quote.discount.code}`.slice(0, 40) })
      : null;
    const absolute = (u: string | null) => (u ? (u.startsWith('http') ? u : `${siteUrl()}${u}`) : null);
    const session = await stripe!.checkout.sessions.create({
      mode: 'payment',
      locale: 'en-GB',
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber }, description: `Pens Outlet order ${order.orderNumber}` },
      line_items: quote.lines
        .filter((l) => l.quantity > 0)
        .map((l) => {
          const img = absolute(l.imageUrl);
          return {
            quantity: l.quantity,
            price_data: {
              currency: 'gbp',
              unit_amount: l.unitPricePence,
              product_data: { name: l.name, ...(img && img.startsWith('https://') ? { images: [img] } : {}), metadata: { productId: l.productId } },
            },
          };
        }),
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      ...(quote.delivery
        ? { shipping_options: [{ shipping_rate_data: { display_name: quote.delivery.name, type: 'fixed_amount' as const, fixed_amount: { amount: quote.delivery.pricePence, currency: 'gbp' } } }] }
        : {}),
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout/cancelled?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`,
    });
    const db = await getDb();
    await db.update(orders).set({ stripeCheckoutSessionId: session.id, updatedAt: new Date() }).where(eq(orders.id, order.id));
    sessionUrl = session.url;
  } catch (err) {
    console.error('[checkout] stripe session failed', err);
    return { status: 'error', message: 'We could not start the secure payment. No payment has been taken — please try again.' };
  }
  if (!sessionUrl) return { status: 'error', message: 'We could not start the secure payment. Please try again.' };
  redirect(sessionUrl);
}

/* ───────────── Order tracking ───────────── */

export type TrackState = {
  status: 'idle' | 'error' | 'found';
  message?: string;
  result?: {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    placedOn: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    deliveryMethod: string | null;
    isDemo: boolean;
    items: { name: string; quantity: number }[];
    events: { message: string; at: string }[];
  };
};

const TrackSchema = z.object({
  orderNumber: z.string().trim().min(3).max(30),
  email: z.string().trim().toLowerCase().email().max(200),
});

export async function trackOrder(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const parsed = TrackSchema.safeParse({ orderNumber: fd.get('orderNumber'), email: fd.get('email') });
  if (!parsed.success) return { status: 'error', message: 'Please enter your order number and the email address used at checkout.' };
  const ip = await clientIp();
  if (!(await rateLimit('track', ip, 15, 600))) return { status: 'error', message: 'Too many attempts. Please try again in a few minutes.' };
  const found = await findOrderForTracking(parsed.data.orderNumber, parsed.data.email);
  if (!found) return { status: 'error', message: 'We could not find an order matching those details. Please check and try again.' };
  const o = found.order;
  return {
    status: 'found',
    result: {
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      placedOn: formatDate(o.createdAt),
      trackingNumber: o.trackingNumber,
      trackingUrl: o.trackingUrl,
      deliveryMethod: o.deliveryMethodName,
      isDemo: o.isDemo,
      items: found.items.map((i) => ({ name: i.productName, quantity: i.quantity })),
      events: found.events.map((e) => ({ message: e.message, at: e.createdAt.toISOString() })),
    },
  };
}
