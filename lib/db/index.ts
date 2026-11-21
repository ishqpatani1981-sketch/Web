import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { MIGRATIONS } from './migrations.generated';

export type DB = ReturnType<typeof drizzlePostgres<typeof schema>>;

type GlobalDb = { __pensOutletDb?: Promise<DB> };
const g = globalThis as unknown as GlobalDb;

/** True when running against the embedded demo database instead of Supabase/Postgres. */
export const usingEmbeddedDatabase = !process.env.DATABASE_URL;

/**
 * Returns the shared Drizzle client.
 *
 * - DATABASE_URL set  → Postgres (Supabase in production). Run `npm run db:migrate` to migrate.
 * - DATABASE_URL unset → PGlite, an embedded Postgres persisted to .data/pglite. It migrates
 *   and seeds itself with clearly-labelled demonstration content on first start.
 */
export function getDb(): Promise<DB> {
  if (!g.__pensOutletDb) {
    g.__pensOutletDb = init().catch((err) => {
      g.__pensOutletDb = undefined;
      throw err;
    });
  }
  return g.__pensOutletDb;
}

async function init(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, {
      // Supabase's transaction pooler (port 6543) does not support prepared statements.
      prepare: false,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idle_timeout: 20,
      onnotice: () => {},
    });
    const db = drizzlePostgres(client, { schema });
    if (process.env.AUTO_MIGRATE === 'true') {
      await runMigrations((sql) => client.unsafe(sql).then(() => undefined), (sql) => client.unsafe(sql) as Promise<unknown[]>);
    }
    return db;
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  const dataDir =
    process.env.PGLITE_DIR ??
    (process.env.VERCEL ? '/tmp/pens-outlet-pglite' : path.join(process.cwd(), '.data', 'pglite'));
  mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  await client.waitReady;
  await runMigrations(
    (sql) => client.exec(sql).then(() => undefined),
    (sql) => client.query(sql).then((r) => r.rows),
  );
  const db = drizzlePglite(client, { schema }) as unknown as DB;
  const { seedIfEmpty } = await import('./seed');
  await seedIfEmpty(db, { demo: true });
  return db;
}

/** Minimal, idempotent migration runner shared by PGlite and Postgres. */
export async function runMigrations(
  exec: (sql: string) => Promise<void>,
  query: (sql: string) => Promise<unknown[]>,
) {
  await exec(
    `create table if not exists __app_migrations (name text primary key, applied_at timestamptz not null default now())`,
  );
  const applied = new Set(((await query(`select name from __app_migrations`)) as { name: string }[]).map((r) => r.name));
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    for (const statement of migration.statements) await exec(statement);
    await exec(`insert into __app_migrations (name) values ('${migration.name.replace(/'/g, "''")}')`);
  }
}
