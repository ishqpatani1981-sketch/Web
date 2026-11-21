/**
 * Applies database migrations (and Supabase RLS policies when the Supabase roles exist).
 *   DATABASE_URL=postgres://... npm run db:migrate
 * Without DATABASE_URL this migrates the local embedded demo database in .data/pglite.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { bootstrapPostgres, runMigrations } from '../lib/db/migrate';
import { databaseUrl } from '../lib/config';

async function main() {
  const url = databaseUrl();
  if (!url) {
    const { PGlite } = await import('@electric-sql/pglite');
    mkdirSync(join(process.cwd(), '.data'), { recursive: true });
    const client = new PGlite(join(process.cwd(), '.data', 'pglite'));
    await runMigrations((s) => client.exec(s).then(() => undefined), (s) => client.query(s).then((r) => r.rows));
    console.log('Embedded demo database migrated (.data/pglite).');
    await client.close();
    return;
  }
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });
  await bootstrapPostgres(sql, { seedDemo: false });
  console.log('Migrations and Supabase row level security policies applied (the app also does this automatically on first start).');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
