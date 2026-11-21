# OWNER INFORMATION REQUIRED — Pens Outlet

Everything below is currently a **PLACEHOLDER** or **OWNER TO CONFIRM** on the website.
Nothing has been invented: where information was missing, the site shows a clearly
labelled placeholder instead. Bring this checklist to the owner meeting.

Where to enter each item once collected:

- **Admin → Website content** — editable text, contact details, delivery, policies, FAQs
- **Admin → Products / Collections** — the catalogue
- **Admin → Promotions & codes** — offers, banners, countdowns, discount codes
- **Admin → Settings** — notification email and alerts
- **Hosting environment variables** — credentials (see `docs/CONFIGURATION.md`)

> Public information found on the original store (autographpens.co.uk) — **owner to
> confirm whether it also applies to Pens Outlet**: trading as "Autograph Pens & Luxury
> Gifts" (© Suchak & Suchak), office in Pinner HA5, phone, WhatsApp and info@ email
> listed on the site; ranges include fountain, rollerball and ballpoint pens, pen sets,
> refills, cufflinks and gifts; trade ordering is offered.

---

## 1. Business information

| Item | Status | Where it appears |
|---|---|---|
| Registered / legal business name | OWNER TO CONFIRM | Footer, terms, privacy, emails |
| Trading name (currently "Pens Outlet") | Confirm | Everywhere |
| Company number (if a limited company) | OWNER TO CONFIRM | Footer, terms |
| VAT number and VAT status (prices incl. VAT?) | OWNER TO CONFIRM | Footer, product pages, checkout |
| Business / returns address | PLACEHOLDER | Footer, contact page, emails |
| Customer contact email | PLACEHOLDER | Footer, contact page, emails |
| Telephone (and WhatsApp?) | PLACEHOLDER | Footer, contact page |
| Opening / support hours | OWNER TO CONFIRM | Contact page |
| Logo files (SVG + PNG) and brand guidelines | Not supplied — a nib monogram + wordmark is in use | Header, emails, favicon |
| Relationship to Autograph Pens (same business? sister brand?) | OWNER TO CONFIRM | About, Our Story, footer link |
| About Us and Our Story copy | OWNER TO CONFIRM | /about, /our-story |

## 2. Products

The shop has **16 demonstration products** (SKUs `DEMO-001` … `DEMO-016`) in **6
placeholder collections**. All are labelled "Demo" and kept out of search engines.
For each real product, collect:

- [ ] Product name
- [ ] SKU / product code
- [ ] Collection(s) — confirm the collection list (Autograph, Collectable, Luxury Writing, Limited Edition — plus e.g. Pen Sets, Refills, Cufflinks & Gifts?)
- [ ] Short description (1–2 sentences) and full description
- [ ] Price, and any "was" price (only genuine reductions)
- [ ] Photographs (main + gallery; ideally 2000px+, consistent background) and alt text
- [ ] Stock quantity, or "not tracked"
- [ ] Availability (in stock / pre-order / coming soon)
- [ ] Condition (new / boxed / vintage …)
- [ ] Brand and pen model
- [ ] Pen type (fountain / rollerball / ballpoint / set)
- [ ] Colour, material, dimensions, weight
- [ ] Packaging / presentation box details
- [ ] Specifications (nib size, ink/refill type, filling system …)
- [ ] Flags: featured, bestseller, new arrival, on sale

**Tip:** a spreadsheet with one row per product is the quickest way to collect this.

## 3. Operations

| Item | Status | Notes |
|---|---|---|
| Couriers / delivery services | PLACEHOLDER | Currently "Standard" and "Express" UK delivery |
| Delivery prices | PLACEHOLDER (£3.95 / £7.95 demo) | Admin → Website content → Delivery options |
| Free-delivery threshold | PLACEHOLDER (£50 demo) | |
| Dispatch and delivery timescales | OWNER TO CONFIRM | Never promised on the site until confirmed |
| Countries delivered to | Currently United Kingdom only | |
| Click & collect? | OWNER TO CONFIRM (switched off) | |
| Returns policy (period, condition, who pays postage) | OWNER TO CONFIRM | /returns shows an outline only |
| Warranty / guarantee information | OWNER TO CONFIRM | |
| Authenticity guarantee | OWNER TO CONFIRM — hidden until verified | Why Pens Outlet section |
| Payment methods to accept (cards, Apple Pay, Google Pay, Klarna, PayPal?) | OWNER TO CONFIRM | Footer icons are hidden until confirmed |
| Gift wrapping / engraving services? | OWNER TO CONFIRM | FAQ |
| Trade / wholesale ordering on this site? | OWNER TO CONFIRM | The original store offers it |

## 4. Legal pages (must come from the owner or their adviser)

- [ ] Privacy policy (UK GDPR) — data controller, purposes, lawful bases, processors (Stripe, Supabase, email provider, hosting), retention, rights, ICO complaints
- [ ] Cookie policy — the site already only loads analytics/marketing after consent
- [ ] Terms & conditions of sale
- [ ] Returns & refunds policy (Consumer Contracts Regulations 2013 / Consumer Rights Act 2015)
- [ ] ICO registration (data protection fee) if applicable

## 5. Marketing

| Item | Status |
|---|---|
| Launch offers / genuine promotions and end dates | 2 placeholder promotions (labelled) |
| Discount codes to create | `DEMO10` exists for testing — delete before launch |
| Social media accounts (Instagram, Facebook, TikTok, X, YouTube, Pinterest, LinkedIn) | Not supplied (hidden) |
| Newsletter platform: Brevo or Mailchimp (or website-only) | OWNER TO CONFIRM |
| Marketing sender email (e.g. news@…) | OWNER TO CONFIRM |
| Marketing consent wording | Default wording supplied — owner to approve |
| Homepage headlines, hero copy, "Why Pens Outlet" claims | Defaults from the brief — approve or edit |
| Customer reviews platform (Trustpilot, Reviews.io, Feefo …) | OWNER TO CONFIRM |

## 6. Technical & accounts

| Item | Needed for | Variable(s) |
|---|---|---|
| Domain name (e.g. pensoutlet.co.uk) and DNS access | Live site, email sending | `NEXT_PUBLIC_SITE_URL` |
| Hosting account (Vercel recommended) | Deployment | — |
| Supabase project (database + image storage) | Durable data, uploads | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe account (UK), test then live keys, webhook secret | Payments | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Transactional email: Resend or Brevo API key + verified sending domain | Order & notification emails | `EMAIL_PROVIDER`, `RESEND_API_KEY` / `BREVO_API_KEY`, `EMAIL_FROM` |
| Marketing: Brevo list ID or Mailchimp audience ID | Newsletter sync | `EMAIL_MARKETING_PROVIDER`, `BREVO_LIST_ID` / `MAILCHIMP_*` |
| Owner notification email address | New orders, low stock, enquiries | Admin → Settings or `OWNER_NOTIFICATION_EMAIL` |
| Google Analytics 4 measurement ID | Analytics (after consent) | Admin → Website content → Analytics |
| Google Search Console verification | SEO | Admin → Website content → Analytics |
| Meta Pixel ID | Ads measurement (after consent) | Admin → Website content → Analytics |
| Admin users (names + emails; who is admin vs staff) | Back office | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, then Admin → Customers |

## 7. Before launch checklist

- [ ] Replace or delete all 16 demo products and the placeholder collection descriptions
- [ ] Delete the `DEMO10` code and the two placeholder promotions
- [ ] Fill every "PLACEHOLDER / OWNER TO CONFIRM" field in Admin → Website content
- [ ] Publish privacy, cookies, terms, returns and delivery pages
- [ ] Configure Supabase, Stripe (live), email provider; run a real £1 test order and refund it
- [ ] Set `DEMO_MODE=false`, `ALLOW_INDEXING=true`, and the real `NEXT_PUBLIC_SITE_URL`
- [ ] Turn the announcement bar text into a real message (or switch it off)
- [ ] Connect the domain and submit the sitemap in Search Console
