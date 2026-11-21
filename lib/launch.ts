import 'server-only';
import { and, count, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { categories, discountCodes, products, promotions } from '@/lib/db/schema';
import { databaseConfig, emailConfig, isDemoMode, marketingConfig, siteUrl, stripeConfig, storageConfig, cronSecret } from '@/lib/config';
import { getSettings } from '@/lib/settings';
import { isPlaceholderValue } from '@/lib/settings/defaults';

export type LaunchGroup = 'Content' | 'Services & accounts' | 'Launch switches';

export type LaunchItem = {
  id: string;
  group: LaunchGroup;
  label: string;
  done: boolean;
  optional?: boolean;
  /** What is currently true. */
  detail: string;
  /** What to do about it. */
  how: string;
  href?: string;
};

const list = (items: string[]) => (items.length ? items.join(', ') : 'none');

/**
 * Live readiness checks for going from preview to a real shop. Every item is computed from the
 * current database, settings and environment, so the checklist can never drift out of date.
 */
export async function computeLaunchChecks(): Promise<LaunchItem[]> {
  const db = await getDb();
  const s = await getSettings();
  const [[demoProducts], [demoCollections], [demoPromos], [demoCodes]] = await Promise.all([
    db.select({ n: count() }).from(products).where(and(eq(products.isPlaceholder, true), eq(products.status, 'active'))),
    db.select({ n: count() }).from(categories).where(eq(categories.isPlaceholder, true)),
    db.select({ n: count() }).from(promotions).where(eq(promotions.isPlaceholder, true)),
    db.select({ n: count() }).from(discountCodes).where(eq(discountCodes.isPlaceholder, true)),
  ]);

  const b = s.business;
  const missingBusiness = (
    [
      ['business email', b.email],
      ['telephone', b.phone],
      ['business address', b.address],
      ['registered business name', b.registeredName],
    ] as const
  )
    .filter(([, v]) => isPlaceholderValue(v))
    .map(([l]) => l);
  const missingPolicies = (
    [
      ['delivery', s.policies.delivery],
      ['returns', s.policies.returns],
      ['privacy', s.policies.privacy],
      ['cookies', s.policies.cookies],
      ['terms', s.policies.terms],
    ] as const
  )
    .filter(([, v]) => !v.trim())
    .map(([l]) => l);
  const placeholderDelivery = s.delivery.options.filter((o) => o.enabled && o.placeholder).map((o) => o.name);
  const placeholderFaq = s.faq.items.filter((i) => i.placeholder).length;
  const placeholderWhy = s.why.items.filter((i) => i.enabled && i.placeholder).map((i) => i.title);
  const socials = Object.values(s.social).filter((u) => /^https?:\/\//.test(u)).length;
  const announcementDemo = s.announcement.enabled && /demonstration|demo|placeholder/i.test(s.announcement.text);

  const db_ = databaseConfig();
  const stripe = stripeConfig();
  const email = emailConfig();
  const marketing = marketingConfig();
  const storage = storageConfig();
  const url = siteUrl();
  const adminEmail = process.env.ADMIN_EMAIL?.trim() ?? '';
  const ownerAlerts = !!(s.notifications.ownerEmail?.trim() || email.ownerFallback);

  return [
    // ── Content ────────────────────────────────────────────────
    {
      id: 'demo-products',
      group: 'Content',
      label: 'Replace the demonstration products',
      done: demoProducts.n === 0,
      detail: demoProducts.n ? `${demoProducts.n} demo products are still on sale pages (SKUs DEMO-…).` : 'No demonstration products are listed.',
      how: 'Add the real pens in Products (edit, or delete the demo ones). Photos upload straight from the product form.',
      href: '/admin/products?placeholder=1',
    },
    {
      id: 'demo-collections',
      group: 'Content',
      label: 'Finalise the collections',
      done: demoCollections.n === 0,
      detail: demoCollections.n ? `${demoCollections.n} collections still carry placeholder names, images or descriptions.` : 'Collections are confirmed.',
      how: 'Edit each collection’s name, description and image (untick “Placeholder content” when done).',
      href: '/admin/categories',
    },
    {
      id: 'demo-offers',
      group: 'Content',
      label: 'Remove demo offers and codes',
      done: demoPromos.n + demoCodes.n === 0,
      detail: demoPromos.n + demoCodes.n ? `${demoPromos.n} placeholder promotions and ${demoCodes.n} test discount codes exist (including DEMO10).` : 'No placeholder promotions or codes.',
      how: 'Delete or replace them with real, dated offers. Only genuine offers should carry a countdown.',
      href: '/admin/marketing',
    },
    {
      id: 'business',
      group: 'Content',
      label: 'Business and contact details',
      done: missingBusiness.length === 0,
      detail: missingBusiness.length ? `Still to confirm: ${list(missingBusiness)}.` : 'Business details are filled in.',
      how: 'Website content → Business & contact details. These appear in the footer, contact page and every email.',
      href: '/admin/content#business',
    },
    {
      id: 'delivery',
      group: 'Content',
      label: 'Real delivery options and prices',
      done: placeholderDelivery.length === 0,
      detail: placeholderDelivery.length ? `Placeholder rates: ${list(placeholderDelivery)}.` : 'Delivery options are confirmed.',
      how: 'Website content → Delivery options. Set real prices, descriptions and the free-delivery threshold, then untick “placeholder”.',
      href: '/admin/content#delivery',
    },
    {
      id: 'policies',
      group: 'Content',
      label: 'Legal and policy pages',
      done: missingPolicies.length === 0,
      detail: missingPolicies.length ? `Not written yet: ${list(missingPolicies)}.` : 'All policy pages are published.',
      how: 'Website content → Policies & long-form pages. Paste the owner’s (or their adviser’s) wording; nothing is invented for you.',
      href: '/admin/content#policies',
    },
    {
      id: 'about',
      group: 'Content',
      label: 'About Us and Our Story',
      done: !!s.policies.about.trim() && !!s.policies.story.trim(),
      detail: s.policies.about.trim() && s.policies.story.trim() ? 'Both pages are written.' : 'About Us and/or Our Story are still empty.',
      how: 'Website content → Policies & long-form pages.',
      href: '/admin/content#policies',
    },
    {
      id: 'faq-why',
      group: 'Content',
      label: 'FAQs and trust panels confirmed',
      done: placeholderFaq === 0 && placeholderWhy.length === 0,
      detail: `${placeholderFaq} placeholder FAQ answers; placeholder trust panels: ${list(placeholderWhy)}.`,
      how: 'Website content → FAQs and Why Pens Outlet. Only keep claims the owner can stand behind (e.g. authenticity).',
      href: '/admin/content#faq',
    },
    {
      id: 'announcement',
      group: 'Content',
      label: 'Announcement bar',
      done: !announcementDemo,
      detail: announcementDemo ? 'The bar still says this is a demonstration preview.' : 'The bar is off or has a real message.',
      how: 'Website content → Announcement bar: write a real message or switch it off.',
      href: '/admin/content#announcement',
    },
    {
      id: 'social',
      group: 'Content',
      label: 'Social media links',
      optional: true,
      done: socials > 0,
      detail: socials ? `${socials} linked.` : 'None added (they are hidden until added).',
      how: 'Website content → Social media links.',
      href: '/admin/content#social',
    },

    // ── Services ───────────────────────────────────────────────
    {
      id: 'database',
      group: 'Services & accounts',
      label: 'Permanent database',
      done: db_.configured,
      detail: db_.configured ? `Connected to ${db_.kind} (${db_.host}).` : 'Using the temporary demo database, wiped whenever the server restarts.',
      how: 'Vercel → your project → Storage → Create → Neon or Supabase → Connect. Then redeploy. The site builds its own tables on first start.',
    },
    {
      id: 'stripe',
      group: 'Services & accounts',
      label: 'Stripe payments connected',
      done: stripe.configured && !!stripe.webhookSecret,
      detail: stripe.configured ? `Stripe ${stripe.mode} keys set${stripe.webhookSecret ? ' with webhook' : ' — webhook secret missing'}.` : 'Not connected: checkout takes demo orders only.',
      how: 'Add STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_WEBHOOK_SECRET (see docs/CONFIGURATION.md §2). Start with test keys.',
    },
    {
      id: 'stripe-live',
      group: 'Services & accounts',
      label: 'Stripe is in live mode',
      done: stripe.mode === 'live',
      detail: stripe.mode === 'live' ? 'Live keys are in use.' : `Currently ${stripe.mode}.`,
      how: 'Swap to sk_live_ / pk_live_ keys and a live-mode webhook secret, then place and refund a real £1 test order.',
    },
    {
      id: 'email',
      group: 'Services & accounts',
      label: 'Order emails are delivered',
      done: email.configured,
      detail: email.configured ? `Sending via ${email.provider} from ${email.from}.` : 'Emails are only recorded in the Email outbox, not sent.',
      how: 'Set EMAIL_PROVIDER plus RESEND_API_KEY (or BREVO_API_KEY) and EMAIL_FROM on a verified domain.',
      href: '/admin/emails',
    },
    {
      id: 'owner-alerts',
      group: 'Services & accounts',
      label: 'Owner notification address',
      done: ownerAlerts,
      detail: ownerAlerts ? 'New-order and low-stock alerts have somewhere to go.' : 'No address set, so owner alerts are only recorded in the outbox.',
      how: 'Settings → Email notifications → owner email.',
      href: '/admin/settings',
    },
    {
      id: 'storage',
      group: 'Services & accounts',
      label: 'Permanent photo storage',
      done: storage.provider === 'supabase',
      detail: storage.provider === 'supabase' ? `Supabase bucket “${storage.bucket}”.` : 'Photos are saved to temporary local disk.',
      how: 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API).',
    },
    {
      id: 'marketing-sync',
      group: 'Services & accounts',
      label: 'Newsletter provider sync',
      optional: true,
      done: marketing.configured,
      detail: marketing.configured ? `Syncing to ${marketing.provider}.` : 'Subscribers are stored on this site only.',
      how: 'Set EMAIL_MARKETING_PROVIDER and the Brevo or Mailchimp variables.',
    },
    {
      id: 'cron',
      group: 'Services & accounts',
      label: 'Scheduled campaigns',
      optional: true,
      done: !!cronSecret(),
      detail: cronSecret() ? 'CRON_SECRET is set.' : 'Scheduling needs CRON_SECRET (you can still send campaigns manually).',
      how: 'Set CRON_SECRET; Vercel Cron then calls /api/cron/campaigns.',
    },
    {
      id: 'analytics',
      group: 'Services & accounts',
      label: 'Analytics',
      optional: true,
      done: !!(s.analytics.ga4MeasurementId || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID),
      detail: s.analytics.ga4MeasurementId ? 'GA4 configured (loads only after consent).' : 'Not configured.',
      how: 'Website content → Analytics & tracking IDs.',
      href: '/admin/content#analytics',
    },

    // ── Launch switches ────────────────────────────────────────
    {
      id: 'demo-mode',
      group: 'Launch switches',
      label: 'Demo mode is off',
      done: !isDemoMode(),
      detail: isDemoMode() ? 'DEMO_MODE=true: checkout can create demo orders and the demo catalogue may be seeded.' : 'DEMO_MODE is off.',
      how: 'Set DEMO_MODE=false (after Stripe is connected).',
    },
    {
      id: 'indexing',
      group: 'Launch switches',
      label: 'Search engines allowed',
      done: process.env.ALLOW_INDEXING === 'true',
      detail: process.env.ALLOW_INDEXING === 'true' ? 'robots.txt allows crawling.' : 'robots.txt currently blocks all crawlers.',
      how: 'Set ALLOW_INDEXING=true on launch day, then submit the sitemap in Google Search Console.',
    },
    {
      id: 'site-url',
      group: 'Launch switches',
      label: 'Real domain name',
      done: !/localhost|\.vercel\.app/.test(url),
      detail: `Site URL is ${url}.`,
      how: 'Add the domain in Vercel → Settings → Domains, then set NEXT_PUBLIC_SITE_URL to it (used in emails, sitemap and Stripe).',
    },
    {
      id: 'admin-account',
      group: 'Launch switches',
      label: 'Real administrator account',
      done: !!adminEmail && !/\.(local|preview|test|example)$/i.test(adminEmail),
      detail: adminEmail ? `ADMIN_EMAIL is ${adminEmail}.` : 'ADMIN_EMAIL is not set (a development login is in use).',
      how: 'Set ADMIN_EMAIL and a long, unique ADMIN_PASSWORD, or promote the owner in Customers & team and remove the demo admin.',
    },
  ];
}
