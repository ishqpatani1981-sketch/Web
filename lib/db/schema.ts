import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * PENS OUTLET — database schema.
 *
 * Runs on Supabase Postgres in production (DATABASE_URL) and on PGlite (embedded Postgres)
 * for the zero-configuration local demo. Money is always stored as integer pence (GBP).
 * Status columns are text validated by zod in the application layer so the owner can
 * add new statuses without a migration.
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export type ProductImage = { url: string; alt: string };
export type ProductSpec = { label: string; value: string };
export type Address = {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
};

/* ───────────────────────── Catalogue ───────────────────────── */

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    imageAlt: text('image_alt'),
    /** manual = products assigned by category; on_sale/new_arrival/bestseller/featured = rule-based collection */
    rule: text('rule').notNull().default('manual'),
    sortOrder: integer('sort_order').notNull().default(0),
    showOnHomepage: boolean('show_on_homepage').notNull().default(true),
    isPlaceholder: boolean('is_placeholder').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    ...timestamps,
  },
  (t) => [uniqueIndex('categories_slug_idx').on(t.slug)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    sku: text('sku'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    description: text('description'),
    shortDescription: text('short_description'),
    /** Selling price in pence. Null = price to be confirmed (cannot be purchased). */
    pricePence: integer('price_pence'),
    /** "Was" price in pence, shown struck through when higher than price. */
    originalPricePence: integer('original_price_pence'),
    /** Optional manual discount label override (e.g. "Save 20%"). Otherwise computed. */
    discountLabel: text('discount_label'),
    images: jsonb('images').$type<ProductImage[]>().notNull().default([]),
    /** Null = stock not tracked. */
    stockQuantity: integer('stock_quantity'),
    lowStockThreshold: integer('low_stock_threshold').notNull().default(3),
    /** auto | in_stock | out_of_stock | preorder | coming_soon | sold_out */
    availability: text('availability').notNull().default('auto'),
    condition: text('condition'),
    brand: text('brand'),
    penModel: text('pen_model'),
    penType: text('pen_type'),
    colour: text('colour'),
    material: text('material'),
    dimensions: text('dimensions'),
    packaging: text('packaging'),
    specifications: jsonb('specifications').$type<ProductSpec[]>().notNull().default([]),
    isFeatured: boolean('is_featured').notNull().default(false),
    isBestseller: boolean('is_bestseller').notNull().default(false),
    isNewArrival: boolean('is_new_arrival').notNull().default(false),
    isOnSale: boolean('is_on_sale').notNull().default(false),
    /** Demonstration content flag — shown as a "Demo" chip and banner on the storefront. */
    isPlaceholder: boolean('is_placeholder').notNull().default(false),
    /** draft | active | archived */
    status: text('status').notNull().default('active'),
    sortOrder: integer('sort_order').notNull().default(0),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('products_slug_idx').on(t.slug),
    uniqueIndex('products_sku_idx').on(t.sku),
    index('products_category_idx').on(t.categoryId),
    index('products_status_idx').on(t.status),
  ],
);

/* ───────────────────────── Customers & auth ───────────────────────── */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name'),
    passwordHash: text('password_hash').notNull(),
    /** customer | staff | admin */
    role: text('role').notNull().default('customer'),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

export const sessions = pgTable(
  'sessions',
  {
    /** sha256 of the opaque cookie token — the raw token is never stored. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/* ───────────────────────── Orders ───────────────────────── */

export const orderNumberSeq = pgSequence('order_number_seq', { startWith: 100001 });

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    customerName: text('customer_name').notNull(),
    phone: text('phone'),
    shippingAddress: jsonb('shipping_address').$type<Address>().notNull(),
    billingAddress: jsonb('billing_address').$type<Address>().notNull(),
    deliveryMethodId: text('delivery_method_id'),
    deliveryMethodName: text('delivery_method_name'),
    subtotalPence: integer('subtotal_pence').notNull(),
    discountPence: integer('discount_pence').notNull().default(0),
    deliveryPence: integer('delivery_pence').notNull().default(0),
    totalPence: integer('total_pence').notNull(),
    currency: text('currency').notNull().default('GBP'),
    discountCode: text('discount_code'),
    /** pending | paid | failed | refunded | demo */
    paymentStatus: text('payment_status').notNull().default('pending'),
    /** pending | processing | dispatched | delivered | cancelled | refunded */
    status: text('status').notNull().default('pending'),
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    customerNotes: text('customer_notes'),
    adminNotes: text('admin_notes'),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(false),
    isDemo: boolean('is_demo').notNull().default(false),
    /** Random secret that lets a guest view their confirmation page. */
    accessToken: text('access_token').notNull(),
    stockCommitted: boolean('stock_committed').notNull().default(false),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('orders_number_idx').on(t.orderNumber),
    index('orders_email_idx').on(t.email),
    index('orders_user_idx').on(t.userId),
    index('orders_created_idx').on(t.createdAt),
    uniqueIndex('orders_stripe_session_idx').on(t.stripeCheckoutSessionId),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    productName: text('product_name').notNull(),
    sku: text('sku'),
    imageUrl: text('image_url'),
    unitPricePence: integer('unit_price_pence').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotalPence: integer('line_total_pence').notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
);

export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    message: text('message').notNull(),
    visibleToCustomer: boolean('visible_to_customer').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('order_events_order_idx').on(t.orderId)],
);

/* ───────────────────────── Marketing ───────────────────────── */

export const discountCodes = pgTable(
  'discount_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    description: text('description'),
    /** percent | fixed | free_delivery */
    type: text('type').notNull(),
    /** percent: 1–100; fixed: pence; free_delivery: ignored */
    value: integer('value').notNull().default(0),
    minOrderPence: integer('min_order_pence').notNull().default(0),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    active: boolean('active').notNull().default(true),
    isPlaceholder: boolean('is_placeholder').notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex('discount_codes_code_idx').on(t.code)],
);

export const promotions = pgTable('promotions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  ctaLabel: text('cta_label'),
  ctaHref: text('cta_href'),
  imageUrl: text('image_url'),
  /** homepage_banner | offers_feature | announcement */
  placement: text('placement').notNull().default('offers_feature'),
  badge: text('badge'),
  active: boolean('active').notNull().default(false),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  /** A countdown is only displayed when enabled AND a genuine end date is set in the future. */
  countdownEnabled: boolean('countdown_enabled').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  ...timestamps,
});

export const subscribers = pgTable(
  'subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name'),
    /** pending | subscribed | unsubscribed */
    status: text('status').notNull().default('pending'),
    source: text('source'),
    consentText: text('consent_text').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull().defaultNow(),
    consentIp: text('consent_ip'),
    confirmTokenHash: text('confirm_token_hash'),
    unsubscribeToken: text('unsubscribe_token').notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    providerSyncedAt: timestamp('provider_synced_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('subscribers_email_idx').on(t.email), uniqueIndex('subscribers_unsub_idx').on(t.unsubscribeToken)],
);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** new_arrivals | special_offer | seasonal_sale | discount | product_launch | exclusive | general */
  type: text('type').notNull().default('general'),
  subject: text('subject').notNull(),
  preheader: text('preheader'),
  heading: text('heading'),
  body: text('body').notNull().default(''),
  ctaLabel: text('cta_label'),
  ctaHref: text('cta_href'),
  /** draft | scheduled | sending | sent | failed */
  status: text('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  recipientCount: integer('recipient_count').notNull().default(0),
  lastError: text('last_error'),
  ...timestamps,
});

/* ───────────────────────── Communications ───────────────────────── */

export const emailLog = pgTable(
  'email_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    to: text('to').notNull(),
    subject: text('subject').notNull(),
    template: text('template').notNull(),
    /** sent | logged (provider not configured) | failed */
    status: text('status').notNull(),
    provider: text('provider').notNull(),
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    html: text('html'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('email_log_created_idx').on(t.createdAt)],
);

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject'),
  orderNumber: text('order_number'),
  message: text('message').notNull(),
  /** new | read | replied | archived */
  status: text('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────────────────── Site content & infrastructure ───────────────────────── */

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: text('entity_id'),
    detail: text('detail'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt)],
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type EmailLogEntry = typeof emailLog.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
