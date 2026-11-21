import { getSettings } from '@/lib/settings';
import { getCollections } from '@/lib/catalog';
import { siteUrl } from '@/lib/config';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BasketDrawer } from '@/components/layout/BasketDrawer';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { Cursor } from '@/components/layout/Cursor';
import { Loader } from '@/components/layout/Loader';
import { Toast } from '@/components/layout/Toast';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { ConsentAndAnalytics } from '@/components/layout/Consent';
import { JsonLd } from '@/components/seo/JsonLd';
import { isPlaceholderValue } from '@/lib/settings/defaults';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, collections] = await Promise.all([getSettings(), getCollections()]);
  const navCollections = collections.filter((c) => c.slug !== 'bestsellers' || c.productCount > 0).map((c) => ({ slug: c.slug, name: c.name, description: c.description }));
  const b = settings.business;
  const ga4 = settings.analytics.ga4MeasurementId || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
  const pixel = settings.analytics.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: b.tradingName,
    url: siteUrl(),
    ...(isPlaceholderValue(b.email) ? {} : { email: b.email }),
    ...(isPlaceholderValue(b.phone) ? {} : { telephone: b.phone }),
    sameAs: [b.originalStoreUrl, ...Object.values(settings.social).filter((u) => /^https?:\/\//.test(u))],
  };

  return (
    <>
      <a href="#main" className="sr-only z-[300] rounded-full bg-paper px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <JsonLd data={organization} />
      {settings.announcement.enabled && settings.announcement.text && (
        <AnnouncementBar text={settings.announcement.text} href={settings.announcement.href} linkLabel={settings.announcement.linkLabel} />
      )}
      <Navbar collections={navCollections} originalStoreUrl={b.originalStoreUrl} originalStoreName={b.originalStoreName} />
      <main id="main" className="relative">
        {children}
      </main>
      <Footer settings={settings} />
      <BasketDrawer />
      <SearchOverlay collections={navCollections} />
      <Toast />
      <SmoothScroll />
      <Cursor />
      <Loader />
      <ConsentAndAnalytics ga4Id={ga4 || undefined} metaPixelId={pixel || undefined} />
    </>
  );
}
