# Configuration guide

All credentials are **environment variables** on the hosting platform (Vercel → Project →
Settings → Environment Variables) or in `.env.local` for development. They are never
stored in the database or shown in the admin. `NEXT_PUBLIC_*` values are visible in the
browser, so they must never contain secrets. A template lives in `.env.example`.

The admin's **Settings → Integration status** panel shows what is configured and what is
still awaiting configuration.

## 0. Deploying on Vercel

A Vercel project called **`pens-outlet`** (team *ishq*, region London `lhr1` recommended) has
already been created, with these variables set for Production and Preview:
`DEMO_MODE=true`, `ALLOW_INDEXING=false`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (sensitive),
`CRON_SECRET` (sensitive) and `NEXT_PUBLIC_SITE_URL`.

Vercel cannot fetch the code yet because no GitHub account is connected to Vercel. One-time fix:

1. Vercel → Account Settings → Authentication → **Connect GitHub**, and allow the Vercel
   GitHub app access to `ishqpatani1981-sketch/Web`.
2. Project `pens-outlet` → Settings → Git → **Connect Git Repository** → `ishqpatani1981-sketch/Web`.
3. Settings → Git → Production Branch: `claude/laughing-knuth-h0p3o1` (or merge it into `main`).
4. Settings → Functions → Function Region: **London (lhr1)**.
5. Deployments → **Redeploy**. Every later push deploys automatically.

Preview deployments are protected by Vercel Authentication by default (only your team can
view them). Until `DATABASE_URL` is set, each server instance uses its own temporary demo
database, so admin changes on the preview may not persist.

## Zero-configuration demo mode

With no variables set, the site runs end-to-end on an embedded Postgres (PGlite) database
in `.data/pglite`, seeded with labelled demo content. With `DEMO_MODE=true` and no Stripe
keys, checkout creates **demo orders** (flagged everywhere, no money taken). Emails are
recorded in **Admin → Email outbox** instead of being delivered.

> On serverless hosting (Vercel) the embedded database lives in `/tmp` and is **not
> durable** — each server instance starts fresh. Use it for previews only.

## 1. Supabase — database & image storage

1. Create a project at supabase.com (region: London `eu-west-2`).
2. **Database URL**: Project Settings → Database → Connection string → *Transaction pooler*
   (port 6543). Set `DATABASE_URL` (include the password).
3. Run migrations + security policies: `DATABASE_URL=… npm run db:migrate`.
   This also applies `supabase/policies.sql`: row-level security is **enabled (not forced)**
   on every table, so the server's owner role keeps access while Supabase's public
   `anon`/`authenticated` API can only read active products, collections, live promotions
   and presentation settings. It also creates the public `product-images` storage bucket
   (if the role lacks storage rights, create that bucket in the dashboard).
4. Create the first admin: `ADMIN_EMAIL=… ADMIN_PASSWORD=… DATABASE_URL=… npm run db:seed`.
   (Optionally `npm run db:seed:demo` to load the demonstration catalogue.)
5. **Storage**: Project Settings → API → set `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` (secret — server only). Bucket name:
   `SUPABASE_STORAGE_BUCKET` (default `product-images`, created by the policies script).

Why the server talks to Postgres directly: every write is validated server-side (zod +
role checks) and the Supabase public API is locked down by RLS, so the anon key cannot
read customer data or write anything.

## 2. Stripe — payments

1. Create a Stripe account (UK). Start in **test mode**.
2. Developers → API keys → set `STRIPE_SECRET_KEY` (`sk_test_…`) and
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`).
3. Developers → Webhooks → *Add endpoint* `https://<domain>/api/stripe/webhook` with events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Test with card `4242 4242 4242 4242`, any future date, any CVC.
5. Choose payment methods in Stripe → Settings → Payment methods (Apple Pay / Google Pay
   need domain verification). Then enable the footer icons in Admin → Website content →
   Payment icons.
6. **Go live**: swap to `sk_live_` / `pk_live_` keys and a live-mode webhook secret, then
   set `DEMO_MODE=false`.

Card details are entered on Stripe's hosted, PCI-compliant checkout and are never seen or
stored by this website.

## 3. Transactional email — order confirmations & alerts

Choose one provider:

| Provider | Variables |
|---|---|
| **Resend** (recommended) | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` |
| **Brevo** | `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY` |

Also set `EMAIL_FROM` (e.g. `Pens Outlet <orders@pensoutlet.co.uk>`) on a domain you have
verified with the provider (SPF/DKIM records), `EMAIL_REPLY_TO`, and the owner's alert
address in Admin → Settings (or `OWNER_NOTIFICATION_EMAIL`).

Emails sent: order confirmation, payment receipt, dispatch notification (with tracking),
delivery updates, newsletter confirmation (double opt-in) and welcome. Owner alerts: new
order, new subscriber, low stock, out of stock, contact enquiry, failed payment, refunds /
disputes / cancellations. Each can be switched on or off in Admin → Settings.

## 4. Email marketing — newsletter sync

| Provider | Variables |
|---|---|
| **Brevo** | `EMAIL_MARKETING_PROVIDER=brevo`, `BREVO_API_KEY`, `BREVO_LIST_ID` |
| **Mailchimp** | `EMAIL_MARKETING_PROVIDER=mailchimp`, `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`, `MAILCHIMP_SERVER_PREFIX` (e.g. `us21`) |

Subscribers confirm by email before they are added (double opt-in). Unsubscribes (link
in every email, plus RFC 8058 one-click) are synced back. Campaigns can be written and
sent from Admin → Newsletter through the transactional provider; for large lists you can
instead send from Brevo/Mailchimp using the synced list.

## 5. Scheduled campaigns

Set `CRON_SECRET` (e.g. `openssl rand -hex 32`). `vercel.json` schedules
`/api/cron/campaigns` daily at 08:15 UTC (the Vercel Hobby plan allows daily jobs; on Pro
change the schedule to hourly, `0 * * * *`). Any other scheduler can call the endpoint
with `Authorization: Bearer <CRON_SECRET>`.

## 6. Analytics & Search Console

Enter IDs in Admin → Website content → Analytics (or `NEXT_PUBLIC_GA4_MEASUREMENT_ID`,
`NEXT_PUBLIC_META_PIXEL_ID`). Scripts load **only after the visitor consents** in the
cookie banner (which only appears once a tracker is configured). Add the Search Console
HTML-tag verification code in the same section, then submit `https://<domain>/sitemap.xml`.

## 7. Launch switches

| Variable | Preview | Launch |
|---|---|---|
| `DEMO_MODE` | `true` | `false` |
| `ALLOW_INDEXING` | `false` (robots.txt blocks crawlers) | `true` |
| `NEXT_PUBLIC_SITE_URL` | preview URL | `https://www.<domain>` |
