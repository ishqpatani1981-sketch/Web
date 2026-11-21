-- ═══════════════════════════════════════════════════════════════════════════
-- PENS OUTLET — Supabase Row Level Security policies
--
-- The Next.js server talks to Postgres through DATABASE_URL using a privileged
-- role (it is the trusted backend and validates every write with zod + role
-- checks). These policies lock down Supabase's auto-generated REST/GraphQL
-- APIs so that the public `anon` key, and the `authenticated` role, can never
-- read customer data or write anything.
--
-- `npm run db:migrate` applies this file automatically when it detects the
-- Supabase `anon` role. You can also paste it into the Supabase SQL editor.
-- It is idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'categories','products','users','sessions','orders','order_items','order_events',
    'discount_codes','promotions','subscribers','campaigns','email_log',
    'contact_messages','site_settings','rate_limits','audit_log','__app_migrations'
  ] loop
    execute format('alter table if exists public.%I enable row level security', t);
    execute format('alter table if exists public.%I force row level security', t);
  end loop;
end $$;

-- Public catalogue: read-only, active products and categories only.
drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select to anon, authenticated using (status = 'active');

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "public read live promotions" on public.promotions;
create policy "public read live promotions" on public.promotions
  for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

-- Only non-sensitive presentation settings are publicly readable.
drop policy if exists "public read presentation settings" on public.site_settings;
create policy "public read presentation settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('hero','announcement','offers','showcase','why','newsletter','finalCta','business','social','seo','analytics','delivery','checkout','payments','reviews','policies','faq'));

-- Every other table (users, sessions, orders, subscribers, discount codes, email log,
-- contact messages, campaigns, rate limits, audit log) has RLS enabled with NO policies
-- for anon/authenticated, which means: no access through the public API at all.

-- Storage: product images bucket (public read, writes only via the service role).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
