# Going live — Pens Outlet

The preview is the real site. Publishing is a handful of switches, not a rebuild. Do them in
this order; the **Admin → Launch checklist** page shows live which ones are still open.

## 1. Put the code on Vercel (once)

1. In Vercel: **Account Settings → Authentication → Connect GitHub**, allow access to `ishqpatani1981-sketch/Web`.
2. Open project **pens-outlet → Settings → Git → Connect Git Repository** → pick the repo.
3. **Settings → Git → Production Branch** → `claude/laughing-knuth-h0p3o1` (or merge it into `main` and use `main`).
4. **Settings → Functions → Function Region** → London (`lhr1`).
5. **Deployments → Redeploy.** Every later push deploys automatically.

> Vercel's free *Hobby* plan is for non-commercial use. A live shop needs the *Pro* plan
> (it also allows hourly scheduled campaigns instead of daily).

## 2. Make the data permanent (2 minutes, no code)

In the Vercel project: **Storage → Create → Neon** (or **Supabase**) → **Connect to project**.
Vercel adds the connection string itself (`DATABASE_URL` / `POSTGRES_URL`). **Redeploy.**

On its first start the site creates all its tables, applies the security rules, creates the
administrator from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and (while `DEMO_MODE=true`) loads the
demo catalogue once. Nothing to run by hand. Deleting the demo products later never brings
them back.

## 3. Add the real information

Everything is edited in the admin — no code:

- **Products** (with photos), **Collections**, **Promotions & codes**
- **Website content**: business details, delivery options and prices, policies, About, FAQs
- Anything still unfinished is listed in **Launch checklist** with an *Open* button

## 4. Connect the services (environment variables)

Vercel → Settings → Environment Variables. Details and screenshots-of-where in
[`CONFIGURATION.md`](./CONFIGURATION.md).

| For | Add |
|---|---|
| Payments | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (test keys first) |
| Order emails | `EMAIL_PROVIDER` + `RESEND_API_KEY` (or Brevo), `EMAIL_FROM` |
| Product photos | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API) |
| Newsletter sync (optional) | `EMAIL_MARKETING_PROVIDER` + Brevo/Mailchimp variables |

Place a **real £1 order** with test keys, then with live keys, and refund it.

## 5. Domain and launch day

1. **Settings → Domains** → add `www.<domain>`; set the DNS records Vercel shows.
2. Set `NEXT_PUBLIC_SITE_URL` to `https://www.<domain>`.
3. Set `DEMO_MODE=false`.
4. Set `ALLOW_INDEXING=true` (until then, search engines are told to stay away).
5. Change `ADMIN_PASSWORD` to a long, unique one (and `ADMIN_EMAIL` to the owner’s address).
6. **Redeploy.** Then submit `https://www.<domain>/sitemap.xml` in Google Search Console.

The **Launch checklist** should now read *Ready to launch*.

## Moving the preview link

The preview address (`pens-outlet-ishq1.vercel.app`) keeps working after launch; add the real
domain as the primary one and Vercel redirects everything else to it.
