# Pens Outlet — notes for AI assistants

@AGENTS.md

- Next.js 16 App Router; read `node_modules/next/dist/docs/` before using unfamiliar APIs (middleware is `proxy.ts`, `params` are Promises).
- Database: Drizzle (`lib/db/schema.ts`). After schema changes run `npm run db:generate` (also bundles SQL into `lib/db/migrations.generated.ts`).
- Server actions must call `assertPermission(...)` for admin work and validate with zod; never trust client prices.
- Client forms with validation use the `onSubmit` + `startTransition(() => action(fd))` pattern so React does not reset inputs (see `components/admin/ui.tsx` `AdminForm`).
- Never invent business facts, prices, policies or claims — use PLACEHOLDER / OWNER TO CONFIRM (see docs/OWNER_INFORMATION_REQUIRED.md).
- Verify with `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e` (dev server running, DEMO_MODE=true).
