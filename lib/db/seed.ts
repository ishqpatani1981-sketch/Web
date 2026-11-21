import { count, eq } from 'drizzle-orm';
import type { DB } from './index';
import * as schema from './schema';
import { DEMO_COLLECTIONS, buildDemoProducts } from './seed-data';
import { hashPassword } from '../auth/password';

export const DEV_ADMIN_EMAIL = 'admin@pensoutlet.local';
export const DEV_ADMIN_PASSWORD = 'PensOutlet-admin-2026';

/**
 * Seeds an empty database. Demo catalogue content is only inserted when `demo` is true
 * (always for the embedded demo database; opt-in via `npm run db:seed:demo` for Postgres).
 */
export async function seedIfEmpty(db: DB, opts: { demo: boolean }) {
  await ensureAdmin(db);

  const [{ value: categoryCount }] = await db.select({ value: count() }).from(schema.categories);
  if (categoryCount > 0 || !opts.demo) return;

  const insertedCategories = await db
    .insert(schema.categories)
    .values(
      DEMO_COLLECTIONS.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        rule: c.rule,
        sortOrder: c.sortOrder,
        showOnHomepage: 'showOnHomepage' in c ? c.showOnHomepage : true,
        imageUrl: c.imageUrl,
        imageAlt: c.imageAlt,
        isPlaceholder: true,
      })),
    )
    .returning({ id: schema.categories.id, slug: schema.categories.slug });
  const categoryIdBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));

  await db
    .insert(schema.products)
    .values(buildDemoProducts().map(({ category, ...p }) => ({ ...p, categoryId: categoryIdBySlug.get(category) ?? null })));

  await db.insert(schema.discountCodes).values({
    code: 'DEMO10',
    description: 'Demonstration code — 10% off. Delete before launch.',
    type: 'percent',
    value: 10,
    minOrderPence: 0,
    active: true,
    isPlaceholder: true,
  });

  await db.insert(schema.promotions).values([
    {
      title: 'Seasonal offers',
      subtitle: 'PLACEHOLDER promotion — the owner will confirm genuine offers and dates.',
      ctaLabel: 'Shop the sale',
      ctaHref: '/offers',
      placement: 'offers_feature',
      badge: 'Demo offer',
      active: true,
      countdownEnabled: false,
      isPlaceholder: true,
      sortOrder: 0,
    },
    {
      title: 'Limited editions',
      subtitle: 'PLACEHOLDER — highlight a genuine limited release here.',
      ctaLabel: 'View limited editions',
      ctaHref: '/collections/limited-edition-pens',
      placement: 'offers_feature',
      badge: 'Demo feature',
      active: true,
      countdownEnabled: false,
      isPlaceholder: true,
      sortOrder: 1,
    },
  ]);
}

async function ensureAdmin(db: DB) {
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    // Never create a well-known default admin on a production deployment.
    if (process.env.NODE_ENV === 'production') return;
    email = DEV_ADMIN_EMAIL;
    password = DEV_ADMIN_PASSWORD;
  }
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing.length) return;
  await db
    .insert(schema.users)
    .values({
      email,
      name: 'Store administrator',
      passwordHash: await hashPassword(password),
      role: 'admin',
    })
    .onConflictDoNothing({ target: schema.users.email });
  if (email === DEV_ADMIN_EMAIL) {
    console.warn(
      `[pens-outlet] Created local development admin ${DEV_ADMIN_EMAIL} — set ADMIN_EMAIL and ADMIN_PASSWORD for real deployments.`,
    );
  }
}
