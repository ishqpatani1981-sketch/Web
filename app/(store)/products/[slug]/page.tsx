import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ShieldCheck, Star, Truck, Undo2 } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '@/lib/catalog';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/config';
import { formatPrice, cn } from '@/lib/utils';
import { isPlaceholderValue } from '@/lib/settings/defaults';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductCard } from '@/components/product/ProductCard';
import { RecentlyViewed, TrackRecentlyViewed } from '@/components/product/RecentlyViewed';
import { snapshot } from '@/lib/snapshot';
import { Badge } from '@/components/ui/Button';
import { PlaceholderNotice } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/motion/Motion';
import { JsonLd } from '@/components/seo/JsonLd';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: 'Product not found' };
  const description = p.seoDescription || p.shortDescription || `${p.name} at Pens Outlet.`;
  return {
    title: p.seoTitle || p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    // Demonstration products must never be indexed as real listings.
    robots: p.isPlaceholder ? { index: false, follow: true } : undefined,
    openGraph: { title: p.name, description, images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt || p.name }] : undefined },
  };
}

const AVAIL_TONE = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger', preorder: 'gold', coming_soon: 'neutral' } as const;

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const [related, settings] = await Promise.all([getRelatedProducts(p, 4), getSettings()]);

  const specs = [
    { label: 'Brand', value: p.brand },
    { label: 'Model', value: p.penModel },
    { label: 'Pen type', value: p.penType ? p.penType[0].toUpperCase() + p.penType.slice(1) : null },
    { label: 'Colour', value: p.colour },
    { label: 'Material', value: p.material },
    { label: 'Dimensions', value: p.dimensions },
    { label: 'Condition', value: p.condition },
    { label: 'Packaging', value: p.packaging },
    ...p.specifications,
    { label: 'SKU', value: p.sku },
  ].filter((s): s is { label: string; value: string } => !!s.value);

  const url = `${siteUrl()}/products/${p.slug}`;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku ?? undefined,
    description: p.shortDescription ?? undefined,
    image: p.images.map((i) => (i.url.startsWith('/') ? `${siteUrl()}${i.url}` : i.url)),
    url,
    ...(p.brand && !/owner to confirm/i.test(p.brand) ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    ...(p.colour ? { color: p.colour } : {}),
    ...(p.pricePence !== null
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: 'GBP',
            price: (p.pricePence / 100).toFixed(2),
            itemCondition: 'https://schema.org/NewCondition',
            availability:
              p.availability === 'out_of_stock'
                ? 'https://schema.org/OutOfStock'
                : p.availability === 'preorder'
                  ? 'https://schema.org/PreOrder'
                  : p.availability === 'coming_soon'
                    ? 'https://schema.org/PreSale'
                    : 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl() },
            { '@type': 'ListItem', position: 2, name: p.categoryName ?? 'Shop', item: p.categorySlug ? `${siteUrl()}/collections/${p.categorySlug}` : `${siteUrl()}/shop` },
            { '@type': 'ListItem', position: 3, name: p.name, item: url },
          ],
        }}
      />
      <TrackRecentlyViewed product={snapshot(p)} />

      <div className="mx-auto max-w-7xl px-5 pt-32 sm:px-8 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-titanium">
          <Link href="/" className="hover:text-paper">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          {p.categorySlug ? (
            <Link href={`/collections/${p.categorySlug}`} className="hover:text-paper">
              {p.categoryName}
            </Link>
          ) : (
            <Link href="/shop" className="hover:text-paper">
              Shop
            </Link>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-silver" aria-current="page">
            {p.name}
          </span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <ProductGallery images={p.images} name={p.name} colour={p.colour} penType={p.penType} />

          <div>
            <div className="flex flex-wrap gap-2">
              {p.discountLabel && p.originalPricePence && <Badge tone="sale">{p.discountLabel}</Badge>}
              {p.isNewArrival && <Badge tone="gold">New arrival</Badge>}
              {p.isBestseller && <Badge>Bestseller</Badge>}
              {p.isPlaceholder && <Badge tone="demo">Demo product</Badge>}
            </div>
            <h1 className="mt-5 text-[clamp(2rem,4vw,3.4rem)] font-light uppercase leading-[1.02] tracking-tight text-paper">{p.name}</h1>
            {p.shortDescription && <p className="mt-4 text-[15px] leading-relaxed text-silver/85">{p.shortDescription}</p>}

            <div className="mt-7 flex items-end gap-4">
              <span className="text-3xl font-light text-paper" data-testid="pdp-price">
                {formatPrice(p.pricePence)}
              </span>
              {p.originalPricePence && (
                <span className="pb-1 text-lg text-titanium line-through" aria-label={`Was ${formatPrice(p.originalPricePence)}`}>
                  {formatPrice(p.originalPricePence)}
                </span>
              )}
              {p.discountPercent > 0 && <span className="pb-1.5 text-sm text-champagne">Save {formatPrice((p.originalPricePence ?? 0) - (p.pricePence ?? 0))}</span>}
            </div>
            <p className="mt-1 text-xs text-titanium">Price includes VAT where applicable (owner to confirm VAT status).</p>

            <div className="mt-6 flex items-center gap-3">
              <Badge tone={AVAIL_TONE[p.availability]}>{p.availabilityLabel}</Badge>
              {p.availability === 'low_stock' && p.maxQuantity !== null && <span className="text-sm text-warning">Only {p.maxQuantity} left</span>}
            </div>

            {p.isPlaceholder && (
              <PlaceholderNotice className="mt-6">
                Demonstration product. The name, price, stock, photography and specifications are placeholders and will be replaced with the owner’s real product information.
              </PlaceholderNotice>
            )}

            <div className="mt-8">
              <ProductPurchase product={p} />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-silver">
              <div className="glass rounded-2xl px-2 py-3">
                <ShieldCheck className="mx-auto mb-1.5 h-4 w-4 text-champagne" /> Secure checkout by Stripe
              </div>
              <Link href="/delivery" className="glass rounded-2xl px-2 py-3 hover:text-paper">
                <Truck className="mx-auto mb-1.5 h-4 w-4 text-champagne" /> Delivery information
              </Link>
              <Link href="/returns" className="glass rounded-2xl px-2 py-3 hover:text-paper">
                <Undo2 className="mx-auto mb-1.5 h-4 w-4 text-champagne" /> Returns policy
              </Link>
            </div>

            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              <Details title="Description" open>
                <div className="prose-po whitespace-pre-line text-sm">{p.description || p.shortDescription || 'Description to be confirmed.'}</div>
              </Details>
              <Details title="Specifications" open>
                <dl className="grid grid-cols-[minmax(120px,0.8fr)_1.2fr] gap-x-6 gap-y-2.5 text-sm">
                  {specs.map((s, i) => (
                    <div key={`${s.label}-${i}`} className="contents">
                      <dt className="text-titanium">{s.label}</dt>
                      <dd className={cn('text-silver', /to be confirmed|owner to confirm/i.test(s.value) && 'text-warning/80')}>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </Details>
              <Details title="Delivery & returns">
                <div className="space-y-3 text-sm text-silver/85">
                  <p>{settings.delivery.productPageNote}</p>
                  <ul className="space-y-1.5">
                    {settings.delivery.options
                      .filter((o) => o.enabled)
                      .map((o) => (
                        <li key={o.id} className="flex justify-between gap-4">
                          <span>
                            {o.name}
                            {o.placeholder && <span className="text-warning/80"> (placeholder)</span>}
                          </span>
                          <span className="text-paper">
                            {formatPrice(o.pricePence)}
                            {o.freeOverPence > 0 && <span className="text-titanium"> · free over {formatPrice(o.freeOverPence)}</span>}
                          </span>
                        </li>
                      ))}
                  </ul>
                  <p>
                    See <Link href="/delivery" className="underline">delivery information</Link> and our <Link href="/returns" className="underline">returns policy</Link>.
                  </p>
                </div>
              </Details>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto mt-24 max-w-7xl px-5 sm:px-8" aria-labelledby="reviews-heading">
        <div className="glass glass-edge flex flex-col items-start justify-between gap-4 rounded-[28px] p-7 md:flex-row md:items-center">
          <div>
            <h2 id="reviews-heading" className="flex items-center gap-2 text-lg text-paper">
              <Star className="h-4 w-4 text-champagne" /> Customer reviews
            </h2>
            <p className="mt-1 text-sm text-titanium">{settings.reviews.widgetNote}</p>
          </div>
          {settings.reviews.provider === 'none' && <Badge tone="demo">Awaiting configuration</Badge>}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-5 sm:px-8" aria-labelledby="related-heading">
          <h2 id="related-heading" className="display mb-10 text-[clamp(1.8rem,3.4vw,2.8rem)] text-paper">
            You may <span className="font-serif normal-case italic text-champagne">also like</span>
          </h2>
          <ul className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r, i) => (
              <Reveal as="li" key={r.id} delay={i * 0.06}>
                <ProductCard product={r} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
      <RecentlyViewed excludeId={p.id} />
      {!isPlaceholderValue(settings.business.phone) && <span className="sr-only">Questions? Call {settings.business.phone}</span>}
    </>
  );
}

function Details({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group py-5" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs uppercase tracking-[0.2em] text-paper">
        {title}
        <span className="text-lg leading-none text-titanium transition-transform group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}
