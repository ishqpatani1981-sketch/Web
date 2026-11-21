import 'server-only';
import { siteUrl, emailConfig } from '@/lib/config';
import { getSettings } from '@/lib/settings';
import type { Order, OrderItem, Product, ContactMessage } from '@/lib/db/schema';
import { escapeHtml, formatDateTime, formatPrice } from '@/lib/utils';
import { sendEmail } from './send';
import { addressHtml, itemsTable, layout, paragraph } from './templates';

type OwnerKind = 'newOrder' | 'newSubscriber' | 'lowStock' | 'outOfStock' | 'contactEnquiry' | 'failedPayment' | 'orderUpdates';

async function ownerRecipient() {
  const s = await getSettings();
  return s.notifications.ownerEmail?.trim() || emailConfig().ownerFallback || null;
}

async function notifyOwner(kind: OwnerKind, subject: string, heading: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const settings = await getSettings();
  if (!settings.notifications[kind]) return;
  const to = await ownerRecipient();
  const html = layout({ heading, bodyHtml, cta, settings, siteUrl: siteUrl(), footerNote: 'Owner notification · manage these alerts in Admin → Settings.' });
  // Without an owner address the message is still recorded in the admin outbox.
  await sendEmail({ to: to ?? 'owner-email-not-configured', subject: `[Pens Outlet] ${subject}`, html, template: `owner.${kind}` });
}

/* ───────────── Owner notifications ───────────── */

export async function ownerNewOrder(order: Order, items: OrderItem[]) {
  await notifyOwner(
    'newOrder',
    `New order ${order.orderNumber} — ${formatPrice(order.totalPence)}${order.isDemo ? ' (DEMO)' : ''}`,
    `New order ${order.orderNumber}`,
    `${order.isDemo ? '<p style="color:#b45309"><strong>Demo order — no payment was taken.</strong></p>' : ''}
     <p>${escapeHtml(order.customerName)} · ${escapeHtml(order.email)}${order.phone ? ` · ${escapeHtml(order.phone)}` : ''}</p>
     ${itemsTable(items, order)}
     <p><strong>Deliver to</strong><br>${addressHtml(order.shippingAddress)}</p>`,
    { label: 'Open order', href: `${siteUrl()}/admin/orders/${order.id}` },
  );
}

export async function ownerNewSubscriber(email: string, source: string | null) {
  await notifyOwner('newSubscriber', 'New newsletter subscriber', 'New newsletter subscriber', paragraph(`${email} confirmed their subscription${source ? ` (source: ${source})` : ''}.`), {
    label: 'View subscribers',
    href: `${siteUrl()}/admin/newsletter`,
  });
}

export async function ownerStockAlert(product: Pick<Product, 'id' | 'name' | 'sku' | 'stockQuantity'>) {
  const out = (product.stockQuantity ?? 0) <= 0;
  await notifyOwner(
    out ? 'outOfStock' : 'lowStock',
    `${out ? 'Out of stock' : 'Low stock'}: ${product.name}`,
    out ? 'A product has sold out' : 'A product is running low',
    paragraph(`${product.name}${product.sku ? ` (${product.sku})` : ''} now has ${product.stockQuantity ?? 0} in stock.`),
    { label: 'Update stock', href: `${siteUrl()}/admin/products/${product.id}` },
  );
}

export async function ownerContactEnquiry(m: ContactMessage) {
  await notifyOwner(
    'contactEnquiry',
    `New enquiry from ${m.name}`,
    'New contact enquiry',
    `<p><strong>${escapeHtml(m.name)}</strong> · ${escapeHtml(m.email)}${m.phone ? ` · ${escapeHtml(m.phone)}` : ''}</p>
     ${m.subject ? `<p><strong>Subject:</strong> ${escapeHtml(m.subject)}</p>` : ''}
     ${m.orderNumber ? `<p><strong>Order:</strong> ${escapeHtml(m.orderNumber)}</p>` : ''}
     ${paragraph(m.message)}`,
    { label: 'Open messages', href: `${siteUrl()}/admin/messages` },
  );
}

export async function ownerFailedPayment(order: Order, reason: string) {
  await notifyOwner(
    'failedPayment',
    `Payment failed for ${order.orderNumber}`,
    'A payment failed',
    paragraph(`The payment for order ${order.orderNumber} (${formatPrice(order.totalPence)}) by ${order.email} failed.\n\nReason: ${reason}`),
    { label: 'Open order', href: `${siteUrl()}/admin/orders/${order.id}` },
  );
}

export async function ownerOrderUpdate(order: Order, message: string) {
  await notifyOwner('orderUpdates', `Order ${order.orderNumber}: ${message}`, `Order ${order.orderNumber} updated`, paragraph(message), {
    label: 'Open order',
    href: `${siteUrl()}/admin/orders/${order.id}`,
  });
}

/* ───────────── Customer emails ───────────── */

function orderUrl(order: Order) {
  return `${siteUrl()}/checkout/success?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`;
}

export async function customerOrderConfirmation(order: Order, items: OrderItem[]) {
  const settings = await getSettings();
  if (!settings.notifications.customerOrderConfirmation) return;
  const first = order.customerName.split(' ')[0];
  await sendEmail({
    to: order.email,
    template: 'customer.orderConfirmation',
    subject: `Your Pens Outlet order ${order.orderNumber} is confirmed`,
    html: layout({
      settings,
      siteUrl: siteUrl(),
      preheader: `Thank you for your order, ${first}.`,
      heading: `Thank you, ${first}.`,
      bodyHtml: `${order.isDemo ? '<p style="color:#b45309"><strong>This is a demonstration order — no payment was taken and nothing will be dispatched.</strong></p>' : ''}
        <p>Your order <strong>${escapeHtml(order.orderNumber)}</strong> has been received. We will email you again when it is on its way.</p>
        ${itemsTable(items, order)}
        <table role="presentation" width="100%"><tr>
          <td valign="top" style="font-size:13px;line-height:1.6;padding-right:12px;"><strong>Delivery address</strong><br>${addressHtml(order.shippingAddress)}</td>
          <td valign="top" style="font-size:13px;line-height:1.6;"><strong>Billing address</strong><br>${addressHtml(order.billingAddress)}</td>
        </tr></table>`,
      cta: { label: 'View your order', href: orderUrl(order) },
    }),
  });
}

export async function customerPaymentReceipt(order: Order) {
  const settings = await getSettings();
  if (!settings.notifications.customerPaymentReceipt || order.isDemo) return;
  await sendEmail({
    to: order.email,
    template: 'customer.paymentReceipt',
    subject: `Payment received for order ${order.orderNumber}`,
    html: layout({
      settings,
      siteUrl: siteUrl(),
      heading: 'Payment received',
      bodyHtml: paragraph(
        `We have received your payment of ${formatPrice(order.totalPence)} for order ${order.orderNumber} on ${formatDateTime(order.paidAt ?? new Date())}.\n\nYour payment was processed securely by Stripe. Pens Outlet never sees or stores your card details.`,
      ),
      cta: { label: 'View your order', href: orderUrl(order) },
    }),
  });
}

export async function customerDispatched(order: Order) {
  const settings = await getSettings();
  if (!settings.notifications.customerDispatch) return;
  const tracking = order.trackingNumber
    ? `<p><strong>Tracking number:</strong> ${escapeHtml(order.trackingNumber)}</p>`
    : '';
  await sendEmail({
    to: order.email,
    template: 'customer.dispatched',
    subject: `Your order ${order.orderNumber} is on its way`,
    html: layout({
      settings,
      siteUrl: siteUrl(),
      heading: 'Your order is on its way',
      bodyHtml: `<p>Good news — order <strong>${escapeHtml(order.orderNumber)}</strong> has been dispatched${order.deliveryMethodName ? ` via ${escapeHtml(order.deliveryMethodName)}` : ''}.</p>${tracking}<p><strong>Delivering to</strong><br>${addressHtml(order.shippingAddress)}</p>`,
      cta: order.trackingUrl ? { label: 'Track delivery', href: order.trackingUrl } : { label: 'Track my order', href: `${siteUrl()}/track-order` },
    }),
  });
}

export async function customerDeliveryUpdate(order: Order, message: string) {
  const settings = await getSettings();
  if (!settings.notifications.customerDeliveryUpdate) return;
  await sendEmail({
    to: order.email,
    template: 'customer.deliveryUpdate',
    subject: `Update on your order ${order.orderNumber}`,
    html: layout({ settings, siteUrl: siteUrl(), heading: 'An update on your order', bodyHtml: paragraph(message), cta: { label: 'Track my order', href: `${siteUrl()}/track-order` } }),
  });
}

export async function customerNewsletterConfirm(email: string, confirmUrl: string) {
  const settings = await getSettings();
  await sendEmail({
    to: email,
    template: 'customer.newsletterConfirm',
    subject: 'Please confirm your Pens Outlet subscription',
    html: layout({
      settings,
      siteUrl: siteUrl(),
      heading: 'One more step',
      bodyHtml: paragraph('Please confirm that you would like to receive news about new arrivals, exclusive offers and special promotions from Pens Outlet.\n\nIf you did not request this, you can ignore this email and you will not be subscribed.'),
      cta: { label: 'Confirm subscription', href: confirmUrl },
    }),
  });
}

export async function customerNewsletterWelcome(email: string, unsubscribeUrl: string, oneClickUrl?: string) {
  const settings = await getSettings();
  await sendEmail({
    to: email,
    template: 'customer.newsletterWelcome',
    subject: 'Welcome to Pens Outlet',
    unsubscribeUrl: oneClickUrl ?? unsubscribeUrl,
    html: layout({
      settings,
      siteUrl: siteUrl(),
      unsubscribeUrl,
      heading: 'You’re in the loop.',
      bodyHtml: paragraph('Thank you for subscribing. You will be among the first to hear about new arrivals, exclusive offers and special promotions.'),
      cta: { label: 'Explore the collection', href: `${siteUrl()}/collections` },
    }),
  });
}
