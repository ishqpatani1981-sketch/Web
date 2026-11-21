/**
 * Applies database migrations (and Supabase RLS policies when the Supabase roles exist).
 *   DATABASE_URL=postgres://... npm run db:migrate
 * Without DATABASE_URL this migrates the local embedded demo database in .data/pglite.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { runMigrations } from '../lib/db';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const { PGlite } = await import('@electric-sql/pglite');
    mkdirSync(join(process.cwd(), '.data'), { recursive: true });
    const client = new PGlite(join(process.cwd(), '.data', 'pglite'));
    await runMigrations((s) => client.exec(s).then(() => undefined), (s) => client.query(s).then((r) => r.rows));
    console.log('Embedded demo database migrated (.data/pglite).');
    await client.close();
    return;
  }
  const sql = postgres(url, { prepare: false, max: 1 });
  await runMigrations((s) => sql.unsafe(s).then(() => undefined), (s) => sql.unsafe(s) as Promise<unknown[]>);
  console.log('Migrations applied.');
  const [{ exists }] = await sql`select exists(select 1 from pg_roles where rolname = 'anon') as exists`;
  if (exists) {
    await sql.unsafe(readFileSync(join(process.cwd(), 'supabase', 'policies.sql'), 'utf8')).simple();
    console.log('Supabase row level security policies applied.');
  } else {
    console.log('Supabase roles not detected — skipped supabase/policies.sql.');
  }
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
