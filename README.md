# PENS OUTLET — *The art of the signature.*

A cinematic, premium e-commerce website for autograph pens, collectable pens and luxury
writing instruments. Original store: [autographpens.co.uk](https://www.autographpens.co.uk/).

**Status:** built and verified. The full end-to-end suite passes in development, in
production mode, and against a real Postgres database with Supabase-style row-level
security; an axe audit finds no WCAG 2.1 AA violations on 25 pages. Real payments, email
delivery and real products need the owner's information and credentials — see
[`docs/OWNER_INFORMATION_REQUIRED.md`](docs/OWNER_INFORMATION_REQUIRED.md). Deployment:
the Vercel project `pens-outlet` is created and configured; it needs GitHub connected to
Vercel once (see [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md#0-deploying-on-vercel)).

## What's inside

- **Cinematic storefront** — procedural 3D fountain pen hero (Three.js), scroll-driven
  exploded "anatomy" showcase, pinned horizontal bestsellers, Liquid Glass navigation,
  signature-drawing loader, custom cursor, magnetic buttons, page transitions, noise and
  studio lighting. Reduced-motion and mobile fallbacks throughout.
- **Shop** — collections, search overlay (⌘/Ctrl K), filters & sorting, product pages with
  gallery zoom, specifications, related and recently viewed products, wishlist.
- **Checkout** — server-priced basket, discount codes, delivery options, Stripe Checkout
  (test → live) with webhooks, clearly-flagged demo payments, confirmation animation,
  order tracking, customer accounts and order history.
- **Admin (`/admin`)** — dashboard (sales, AOV, low stock, customers, subscribers, chart),
  products (CRUD, photo uploads, stock, flags, duplicate, sold out), collections, orders
  (status, tracking, customer notifications), customers & roles, messages, promotions with
  genuine-only countdowns, discount codes, newsletter campaigns (preview, test, schedule,
  send), website content editor, notification settings, email outbox.
- **Email & marketing** — Resend/Brevo transactional email, owner alerts, double opt-in
  newsletter with one-click unsubscribe, Brevo/Mailchimp sync (UK GDPR / PECR).
- **SEO & analytics** — metadata, Product/Breadcrumb/FAQ/Store JSON-LD, sitemap, robots,
  Open Graph image, consent-gated GA4 and Meta Pixel, Search Console verification.

## Quick start (no credentials needed)

```bash
npm install
cp .env.example .env.local      # DEMO_MODE=true is already set
npm run dev                     # http://localhost:3000
```

The embedded database migrates and seeds itself. Admin: <http://localhost:3000/admin> —
local development login `admin@pensoutlet.local` / `PensOutlet-admin-2026` (created only
outside production; set `ADMIN_EMAIL` / `ADMIN_PASSWORD` for real deployments).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop / build / serve |
| `npm run typecheck`, `npm run lint` | Static checks |
| `npm run test:e2e` | Playwright journey tests against a running server (needs Playwright's Chromium) |
| `npm run test:a11y` | axe-core WCAG 2.1 AA audit of 25 storefront and admin pages |
| `npm run db:generate` | Create a migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (+ Supabase RLS policies) |
| `npm run db:seed` / `db:seed:demo` | Create the admin / also load demo catalogue |
| `npm run db:reset-local` | Delete the local demo database |
| `npm run render:imagery` | Re-render placeholder collection images + OG image from the 3D pen |

## Documentation

- [`docs/OWNER_INFORMATION_REQUIRED.md`](docs/OWNER_INFORMATION_REQUIRED.md) — everything to collect from the owner
- [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) — Supabase, Stripe, email, marketing, analytics, launch switches
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack decisions, security, data model

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · GSAP ScrollTrigger · Lenis ·
Three.js / React Three Fiber · Drizzle ORM · Supabase Postgres & Storage (PGlite for demo) ·
Stripe · Resend / Brevo · Mailchimp · zod · zustand.
