# Architecture

```
Browser ──► Next.js 16 (App Router, React 19, server components + server actions)
              │
              ├── Storefront  app/(store)/*      cinematic UI, catalogue, basket, checkout
              ├── Admin       app/admin/*        role-based back office
              ├── API         app/api/*          search, Stripe webhook, cron, one-click unsubscribe
              │
              ├── lib/db        Drizzle ORM ──► Supabase Postgres (DATABASE_URL)
              │                              └► PGlite embedded Postgres (demo / local)
              ├── lib/storage   Supabase Storage (product images) │ local disk (dev)
              ├── lib/stripe    Stripe Checkout (hosted) + webhooks
              ├── lib/email     Resend │ Brevo │ outbox log  (+ email_log table)
              └── lib/marketing Brevo │ Mailchimp contact sync, campaigns
```

## Key decisions

| Decision | Reason |
|---|---|
| **Drizzle + direct Postgres** to Supabase instead of the Supabase JS client | One typed query layer that runs identically on Supabase and on PGlite, so the whole shop works (and is tested) with zero credentials. Supabase still hosts the database and storage; RLS locks down its public API. |
| **App-level authentication** (scrypt hashes, hashed session tokens, httpOnly cookies, roles) instead of Supabase Auth | Admin and customer accounts work before any external service is configured; role checks (`admin`, `staff`, `customer`) live next to the code they protect. Supabase Auth can be adopted later if social login is wanted. |
| **Stripe Checkout (hosted)** | Strong Customer Authentication, Apple Pay / Google Pay and PCI scope handled by Stripe; card data never touches the site. Prices are recalculated server-side before the session is created. |
| **Procedural Three.js pen** (React Three Fiber) | No 3D assets existed; a lathe-modelled pen with physically based lacquer and metal materials gives a premium hero without large downloads. Placeholder product art is an SVG pen in the product's colourway. |
| **GSAP ScrollTrigger + Lenis** for scroll choreography, **Motion** for UI transitions | GSAP handles pinning and scrubbed timelines; Motion handles component enter/exit. Both respect `prefers-reduced-motion`. |
| **Settings as typed JSON** (`site_settings`) | Every headline, banner, contact detail, delivery option and policy is editable in the admin. Input is coerced to the default's exact shape, so bad data cannot break pages. |

## Security

- All mutations are **server actions** that re-check the user's role (`assertPermission`) and validate input with **zod**; prices, discounts, stock and delivery are always recomputed on the server.
- Sessions: 32-byte random tokens; only their SHA-256 hash is stored; `httpOnly`, `SameSite=Lax`, `Secure` in production; staff sessions last 12 h.
- Rate limiting (database-backed, works across serverless instances) on sign-in (failed attempts only), registration, checkout, contact, newsletter and order tracking.
- `proxy.ts` gates `/admin`; every admin page, layout and action independently verifies the session and role.
- Supabase **row-level security** on every table; the public API can only read active products, categories, live promotions and presentation settings.
- Uploads: size-limited, file type verified by magic bytes, random file names.
- Security headers (HSTS, nosniff, frame options, referrer and permissions policies); admin pages are `noindex`.
- CSV export neutralises spreadsheet formula injection; JSON-LD is escaped.
- Demo content and preview deployments are kept out of search engines.

## Data model (lib/db/schema.ts)

`categories`, `products`, `users`, `sessions`, `orders`, `order_items`, `order_events`,
`discount_codes`, `promotions`, `subscribers`, `campaigns`, `email_log`,
`contact_messages`, `site_settings`, `rate_limits`, `audit_log`. Money is integer pence.

## Performance & accessibility

- 3D canvases mount lazily, pause off-screen, reduce resolution under load, and fall back to SVG art without WebGL; mobile uses fewer particles and a simpler composition.
- Smooth scrolling is disabled on touch devices and for reduced motion; reduced motion also removes the loader, cursor and scroll animations.
- Skip link, landmarks, labelled controls, keyboard-navigable search, menus, carousels and chart, visible focus rings, and a data-table view for the admin chart.
