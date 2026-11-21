import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/config';
import './globals.css';

const instrument = localFont({
  src: [
    { path: './fonts/instrument-serif-latin-400-normal.woff2', style: 'normal', weight: '400' },
    { path: './fonts/instrument-serif-latin-400-italic.woff2', style: 'italic', weight: '400' },
  ],
  variable: '--font-instrument',
  display: 'swap',
});

// Every page reads live catalogue/content data from the database.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.seo.defaultTitle, template: s.seo.titleTemplate },
    description: s.seo.description,
    applicationName: 'Pens Outlet',
    openGraph: {
      type: 'website',
      siteName: 'Pens Outlet',
      locale: 'en_GB',
      title: s.seo.defaultTitle,
      description: s.seo.description,
    },
    twitter: { card: 'summary_large_image', title: s.seo.defaultTitle, description: s.seo.description },
    verification: s.analytics.searchConsoleVerification ? { google: s.analytics.searchConsoleVerification } : undefined,
    alternates: { canonical: '/' },
  };
}

export const viewport: Viewport = {
  themeColor: '#050506',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${GeistSans.variable} ${GeistMono.variable} ${instrument.variable}`} suppressHydrationWarning>
      <body className="noise min-h-dvh antialiased">{children}</body>
    </html>
  );
}
