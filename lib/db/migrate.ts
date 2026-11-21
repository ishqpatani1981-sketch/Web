import type postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { MIGRATIONS } from './migrations.generated';
import { POLICIES_SQL } from './policies.generated';
import { seedIfEmpty } from './seed';
import type { DB } from './index';

/** Minimal, idempotent migration runner shared by PGlite and Postgres. */
export async function runMigrations(exec: (sql: string) => Promise<void>, query: (sql: string) => Promise<unknown[]>) {
  await exec(`create table if not exists __app_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const applied = new Set(((await query(`select name from __app_migrations`)) as { name: string }[]).map((r) => r.name));
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    for (const statement of migration.statements) await exec(statement);
    await exec(`insert into __app_migrations (name) values ('${migration.name.replace(/'/g, "''")}')`);
  }
}

const LOCK_KEY = 727_274_1; // arbitrary application-wide advisory lock id
const MARKER_KEY = '_bootstrap';

export type BootstrapOptions = {
  /** Insert the clearly-labelled demonstration catalogue — only ever on the very first bootstrap. */
  seedDemo: boolean;
};

/** Cheap check so a warm database costs two tiny queries per cold start. */
async function isBootstrapped(sql: postgres.Sql): Promise<boolean> {
  try {
    const applied = new Set((await sql`select name from __app_migrations`).map((r) => r.name as string));
    if (!MIGRATIONS.every((m) => applied.has(m.name))) return false;
    const [marker] = await sql`select 1 as ok from site_settings where key = ${MARKER_KEY}`;
    if (!marker) return false;
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (adminEmail) {
      const [admin] = await sql`select 1 as ok from users where email = ${adminEmail}`;
      if (!admin) return false;
    }
    return true;
  } catch {
    return false; // tables do not exist yet
  }
}

/**
 * Prepares a Postgres database (Supabase, Neon, or any Postgres) so the site works the first
 * time it connects: migrations, Supabase row-level-security policies (when the Supabase roles
 * exist), the administrator account, and — only on the very first run and only in demo mode —
 * the demonstration catalogue. Safe to run on every cold start and from several instances at
 * once: a transaction-scoped advisory lock serialises schema changes (works through transaction
 * poolers) and a single instance claims the one-off seeding step.
 */
export async function bootstrapPostgres(sql: postgres.Sql, opts: BootstrapOptions) {
  if (await isBootstrapped(sql)) return;

  const claimedSeed = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${LOCK_KEY})`;
    await runMigrations(
      (s) => tx.unsafe(s).then(() => undefined),
      (s) => tx.unsafe(s) as unknown as Promise<unknown[]>,
    );
    const [{ has_anon }] = await tx`select exists(select 1 from pg_roles where rolname = 'anon') as has_anon`;
    if (has_anon) await tx.unsafe(POLICIES_SQL).simple();
    // Whoever inserts the marker first owns the one-off seeding.
    const inserted = await tx`
      insert into site_settings (key, value, updated_at)
      values (${MARKER_KEY}, jsonb_build_object('at', now()::text, 'demo', ${opts.seedDemo}::boolean), now())
      on conflict (key) do nothing
      returning key`;
    return inserted.length > 0;
  });

  const db = drizzle(sql, { schema }) as unknown as DB;
  if (claimedSeed) {
    try {
      await db.transaction(async (t) => {
        await seedIfEmpty(t as unknown as DB, { demo: opts.seedDemo });
      });
    } catch (err) {
      // Release the claim so the next start retries from scratch.
      await sql`delete from site_settings where key = ${MARKER_KEY}`.catch(() => undefined);
      throw err;
    }
  } else {
    // Another instance owns seeding; make sure the administrator exists (idempotent).
    await seedIfEmpty(db, { demo: false });
  }
}
