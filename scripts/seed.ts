/**
 * Seeds the database.
 *   npm run db:seed        → creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD
 *   npm run db:seed:demo   → also inserts the clearly-labelled demonstration catalogue
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import { seedIfEmpty } from '../lib/db/seed';
import { runMigrations } from '../lib/db/migrate';
import type { DB } from '../lib/db';
import { databaseUrl } from '../lib/config';

async function main() {
  const demo = process.argv.includes('--demo');
  const url = databaseUrl();
  if (!url) {
    const { PGlite } = await import('@electric-sql/pglite');
    const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
    mkdirSync(join(process.cwd(), '.data'), { recursive: true });
    const client = new PGlite(join(process.cwd(), '.data', 'pglite'));
    await runMigrations((s) => client.exec(s).then(() => undefined), (s) => client.query(s).then((r) => r.rows));
    await seedIfEmpty(drizzlePglite(client, { schema }) as unknown as DB, { demo: true });
    console.log('Embedded demo database seeded.');
    await client.close();
    return;
  }
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
  await seedIfEmpty(drizzle(sql, { schema }), { demo });
  console.log(demo ? 'Seeded admin + demonstration catalogue.' : 'Seeded admin user.');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
