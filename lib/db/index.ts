import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { databaseUrl } from '../config';
import { bootstrapPostgres, runMigrations } from './migrate';

export type DB = ReturnType<typeof drizzlePostgres<typeof schema>>;

type GlobalDb = { __pensOutletDb?: Promise<DB> };
const g = globalThis as unknown as GlobalDb;

/** True when running against the embedded demo database instead of Supabase/Neon/Postgres. */
export const usingEmbeddedDatabase = !databaseUrl();

/**
 * Returns the shared Drizzle client.
 *
 * - A Postgres URL (DATABASE_URL, or POSTGRES_URL from Vercel's Neon/Supabase integration):
 *   connects and, unless AUTO_MIGRATE=false, prepares the database on first use.
 * - No URL: PGlite, an embedded Postgres persisted to .data/pglite (/tmp on Vercel). It migrates
 *   and seeds itself with clearly-labelled demonstration content. Wiped when the server restarts
 *   on serverless hosting, so it is for previews only.
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
  const url = databaseUrl();
  if (url) {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    const client = postgres(url, {
      // Transaction poolers (Supabase :6543, Neon -pooler) do not support prepared statements.
      prepare: false,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idle_timeout: 20,
      onnotice: () => {},
      ssl: local || parsed.searchParams.get('sslmode') === 'disable' ? false : 'require',
    });
    if (process.env.AUTO_MIGRATE !== 'false') {
      await bootstrapPostgres(client, { seedDemo: process.env.DEMO_MODE === 'true' });
    }
    return drizzlePostgres(client, { schema });
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

export { runMigrations };
