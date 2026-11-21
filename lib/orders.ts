import 'server-only';
import { ORDER_STATUS_LABEL as LABELS } from './order-labels';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { discountCodes, orderEvents, orderItems, orders, products, type Address, type Order } from '@/lib/db/schema';
import { randomToken } from '@/lib/auth/password';
import type { Quote } from '@/lib/pricing';
import {
  customerDeliveryUpdate,
  customerDispatched,
  customerOrderConfirmation,
  customerPaymentReceipt,
  ownerFailedPayment,
  ownerNewOrder,
  ownerOrderUpdate,
  ownerStockAlert,
} from '@/lib/email/notifications';

export const ORDER_STATUSES = ['pending', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'demo', 'expired'] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = LABELS;

export type NewOrderInput = {
  quote: Quote;
  customerName: string;
  email: string;
  phone?: string | null;
  shippingAddress: Address;
  billingAddress: Address;
  customerNotes?: string | null;
  marketingOptIn: boolean;
  userId?: string | null;
  isDemo: boolean;
};

export async function createOrder(input: NewOrderInput) {
  const db = await getDb();
  const q = input.quote;
  return db.transaction(async (tx) => {
    const [{ n }] = rowsOf<{ n: string }>(await tx.execute(sql`select nextval('order_number_seq')::text as n`));
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: `PO-${n}`,
        userId: input.userId ?? null,
        email: input.email.toLowerCase(),
        customerName: input.customerName,
        phone: input.phone || null,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        deliveryMethodId: q.delivery?.id ?? null,
        deliveryMethodName: q.delivery?.name ?? null,
        subtotalPence: q.subtotalPence,
        discountPence: q.discount?.amountPence ?? 0,
        deliveryPence: q.delivery?.pricePence ?? 0,
        totalPence: q.totalPence,
        discountCode: q.discount?.code ?? null,
        customerNotes: input.customerNotes || null,
        marketingOptIn: input.marketingOptIn,
        isDemo: input.isDemo,
        accessToken: randomToken(24),
      })
      .returning();
    await tx.insert(orderItems).values(
      q.lines
        .filter((l) => l.quantity > 0)
        .map((l) => ({
          orderId: order.id,
          productId: l.productId,
          productName: l.name,
          sku: l.sku,
          imageUrl: l.imageUrl,
          unitPricePence: l.unitPricePence,
          quantity: l.quantity,
          lineTotalPence: l.lineTotalPence,
        })),
    );
    await tx.insert(orderEvents).values({ orderId: order.id, type: 'created', message: 'Order placed', visibleToCustomer: true });
    return order;
  });
}

/** Handles rows returned by tx.execute on both postgres-js (array) and PGlite ({ rows }). */
function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] })?.rows ?? []) as T[];
}

export async function getOrderById(id: string) {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(desc(orderEvents.createdAt));
  return { order, items, events };
}

export async function getOrderByNumberAndToken(orderNumber: string, token: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.accessToken, token)))
    .limit(1);
  return order ? getOrderById(order.id) : null;
}

/**
 * Marks an order as paid (or demo-paid) exactly once: commits stock, records discount
 * usage and sends confirmation emails + owner/stock notifications. Safe to call
 * repeatedly from the webhook and the success page.
 */
export async function markOrderPaid(orderId: string, opts: { paymentIntentId?: string | null; demo?: boolean } = {}) {
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(orders)
      .set({
        paymentStatus: opts.demo ? 'demo' : 'paid',
        status: 'processing',
        paidAt: new Date(),
        stripePaymentIntentId: opts.paymentIntentId ?? undefined,
        stockCommitted: true,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.stockCommitted, false)))
      .returning();
    if (!claimed) return null; // already processed

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const stockAlerts: { id: string; name: string; sku: string | null; stockQuantity: number | null }[] = [];
    for (const item of items) {
      if (!item.productId) continue;
      const updated = rowsOf<{ id: string; name: string; sku: string | null; stock_quantity: number; low_stock_threshold: number; previous: number }>(
        await tx.execute(sql`
          update products p set stock_quantity = greatest(p.stock_quantity - ${item.quantity}, 0), updated_at = now()
          from (select id, stock_quantity as previous from products where id = ${item.productId} for update) old
          where p.id = old.id and p.stock_quantity is not null
          returning p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold, old.previous`),
      );
      for (const u of updated) {
        const crossedLow = u.previous > u.low_stock_threshold && u.stock_quantity <= u.low_stock_threshold;
        const soldOut = u.previous > 0 && u.stock_quantity <= 0;
        if (crossedLow || soldOut) stockAlerts.push({ id: u.id, name: u.name, sku: u.sku, stockQuantity: u.stock_quantity });
      }
    }
    if (claimed.discountCode) {
      await tx
        .update(discountCodes)
        .set({ usedCount: sql`${discountCodes.usedCount} + 1` })
        .where(eq(sql`upper(${discountCodes.code})`, claimed.discountCode.toUpperCase()));
    }
    await tx.insert(orderEvents).values({
      orderId,
      type: 'paid',
      message: opts.demo ? 'Demo order confirmed — no payment taken' : 'Payment received',
      visibleToCustomer: true,
    });
    return { order: claimed, items, stockAlerts };
  });

  if (!result) return false;
  // Side effects outside the transaction; failures are logged in the outbox, never block payment.
  await Promise.allSettled([
    customerOrderConfirmation(result.order, result.items),
    customerPaymentReceipt(result.order),
    ownerNewOrder(result.order, result.items),
    ...result.stockAlerts.map((p) => ownerStockAlert(p)),
  ]);
  return true;
}

export async function markPaymentFailed(orderId: string, reason: string, opts: { notifyOwner?: boolean; expired?: boolean } = {}) {
  const db = await getDb();
  const [order] = await db
    .update(orders)
    .set({ paymentStatus: opts.expired ? 'expired' : 'failed', updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.stockCommitted, false)))
    .returning();
  if (!order) return;
  await db.insert(orderEvents).values({ orderId, type: opts.expired ? 'expired' : 'payment_failed', message: reason });
  if (opts.notifyOwner !== false && !opts.expired) await ownerFailedPayment(order, reason);
}

export async function markRefunded(paymentIntentId: string, amountPence: number, full: boolean) {
  const db = await getDb();
  const [order] = await db
    .update(orders)
    .set({ paymentStatus: full ? 'refunded' : 'paid', status: full ? 'refunded' : sql`${orders.status}`, updatedAt: new Date() })
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .returning();
  if (!order) return;
  const message = `${full ? 'Refunded in full' : 'Partially refunded'} (£${(amountPence / 100).toFixed(2)})`;
  await db.insert(orderEvents).values({ orderId: order.id, type: 'refund', message, visibleToCustomer: true });
  await ownerOrderUpdate(order, message);
}

export async function recordOrderAlert(paymentIntentId: string, message: string) {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId)).limit(1);
  if (!order) return;
  await db.insert(orderEvents).values({ orderId: order.id, type: 'alert', message });
  await ownerOrderUpdate(order, message);
}

export async function updateOrderStatus(
  orderId: string,
  input: { status: OrderStatus; trackingNumber?: string | null; trackingUrl?: string | null; customerMessage?: string | null; notifyCustomer: boolean },
) {
  const db = await getDb();
  const [before] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!before) throw new Error('Order not found');
  const [order] = await db
    .update(orders)
    .set({
      status: input.status,
      trackingNumber: input.trackingNumber ?? before.trackingNumber,
      trackingUrl: input.trackingUrl ?? before.trackingUrl,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();
  const changed = before.status !== input.status;
  if (changed) {
    await db.insert(orderEvents).values({
      orderId,
      type: `status_${input.status}`,
      message: `Status changed to ${ORDER_STATUS_LABEL[input.status] ?? input.status}`,
      visibleToCustomer: true,
    });
  }
  if (input.customerMessage) {
    await db.insert(orderEvents).values({ orderId, type: 'customer_message', message: input.customerMessage, visibleToCustomer: true });
  }
  if (input.notifyCustomer) {
    if (changed && input.status === 'dispatched') await customerDispatched(order);
    else if (input.customerMessage) await customerDeliveryUpdate(order, input.customerMessage);
    else if (changed && input.status === 'delivered')
      await customerDeliveryUpdate(order, `Your order ${order.orderNumber} has been marked as delivered. Thank you for shopping with Pens Outlet.`);
    else if (changed && input.status === 'cancelled')
      await customerDeliveryUpdate(order, `Your order ${order.orderNumber} has been cancelled. If you have any questions, please contact us.`);
  }
  if (changed && (input.status === 'cancelled' || input.status === 'refunded')) {
    await ownerOrderUpdate(order, `Status changed to ${ORDER_STATUS_LABEL[input.status]}`);
  }
  return order;
}

export async function findOrderForTracking(orderNumber: string, email: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(sql`upper(${orders.orderNumber})`, orderNumber.trim().toUpperCase()), eq(orders.email, email.trim().toLowerCase())))
    .limit(1);
  if (!order) return null;
  const events = await db
    .select()
    .from(orderEvents)
    .where(and(eq(orderEvents.orderId, order.id), eq(orderEvents.visibleToCustomer, true)))
    .orderBy(desc(orderEvents.createdAt));
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, events, items };
}

export async function listCustomerOrders(userId: string) {
  const db = await getDb();
  return db.select().from(orders).where(and(eq(orders.userId, userId), isNotNull(orders.orderNumber))).orderBy(desc(orders.createdAt));
}

export function isOrderPaid(o: Pick<Order, 'paymentStatus'>) {
  return o.paymentStatus === 'paid' || o.paymentStatus === 'demo';
}

export async function touchProductStockAlert(productId: string) {
  const db = await getDb();
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (p && p.stockQuantity !== null && p.stockQuantity <= p.lowStockThreshold) await ownerStockAlert(p);
}
