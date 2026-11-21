import { defineConfig } from 'drizzle-kit';

// Generates SQL migrations from lib/db/schema.ts into ./drizzle.
// The same SQL runs on Supabase Postgres (production) and PGlite (local demo).
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
});
