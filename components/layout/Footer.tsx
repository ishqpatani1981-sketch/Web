import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { Logo, Flourish } from '@/components/brand/Logo';
import { CookieSettingsLink } from '@/components/layout/Consent';
import type { Settings } from '@/lib/settings/defaults';
import { isPlaceholderValue } from '@/lib/settings/defaults';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All Pens' },
      { href: '/new-arrivals', label: 'New Arrivals' },
      { href: '/bestsellers', label: 'Bestsellers' },
      { href: '/offers', label: 'Special Offers' },
      { href: '/collections', label: 'Collections' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { href: '/contact', label: 'Contact Us' },
      { href: '/delivery', label: 'Delivery Information' },
      { href: '/returns', label: 'Returns Policy' },
      { href: '/faq', label: 'FAQs' },
      { href: '/track-order', label: 'Track My Order' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/about', label: 'About Pens Outlet' },
      { href: '/our-story', label: 'Our Story' },
      { href: '/account', label: 'My Account' },
      { href: '/wishlist', label: 'Wishlist' },
    ],
  },
];

const LEGAL = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/returns', label: 'Returns Policy' },
];

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
};

const PAYMENT_LABELS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', 'apple-pay': 'Apple Pay', 'google-pay': 'Google Pay', paypal: 'PayPal', klarna: 'Klarna' };

export function Footer({ settings }: { settings: Settings }) {
  const b = settings.business;
  const socials = Object.entries(settings.social).filter(([, url]) => /^https?:\/\//.test(url));
  const contact = [
    { icon: Mail, label: 'Email', value: b.email, href: isPlaceholderValue(b.email) ? undefined : `mailto:${b.email}` },
    { icon: Phone, label: 'Telephone', value: b.phone, href: isPlaceholderValue(b.phone) ? undefined : `tel:${b.phone.replace(/\s/g, '')}` },
    { icon: MapPin, label: 'Address', value: b.address },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/[0.06] bg-gradient-to-b from-ink to-midnight">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 spotlight opacity-60" />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-titanium">
              Autograph pens, collectable pens and luxury writing instruments. <span className="font-serif text-base italic text-silver">The art of the signature.</span>
            </p>
            <Flourish className="mt-4 w-48 opacity-60" gradientId="footer-flourish" />

            <a href={b.originalStoreUrl} target="_blank" rel="noopener noreferrer" className="glass glass-edge group mt-8 flex max-w-sm items-center justify-between rounded-3xl p-5 transition-transform hover:-translate-y-0.5" data-cursor="hover">
              <span>
                <span className="eyebrow block">Our Original Store</span>
                <span className="mt-1 block text-paper">{b.originalStoreName}</span>
                <span className="mt-0.5 block text-xs text-titanium">{b.originalStoreUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne/30 text-champagne transition-transform group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-sm text-silver/85 transition-colors hover:text-paper">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col.title === 'About' && (
                    <li>
                      <a href={b.originalStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-champagne/90 hover:text-champagne">
                        Our Original Store <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="eyebrow mb-4">Get in touch</h3>
              <ul className="space-y-3">
                {contact.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-2.5 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-titanium" aria-hidden="true" />
                    <span className="sr-only">{label}: </span>
                    {isPlaceholderValue(value) ? (
                      <span className="flex flex-col text-titanium/80">
                        {label}
                        <span className="whitespace-nowrap text-[10px] uppercase tracking-wider text-warning/75">To be confirmed</span>
                      </span>
                    ) : href ? (
                      <a href={href} className="text-silver hover:text-paper">
                        {value}
                      </a>
                    ) : (
                      <span className="whitespace-pre-line text-silver">{value}</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                {socials.length ? (
                  socials.map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-silver hover:border-champagne/40 hover:text-paper">
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  ))
                ) : (
                  <span className="text-xs text-titanium/70">Social links to be confirmed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-col gap-6 text-xs text-titanium lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <Link key={l.label} href={l.href} className="hover:text-paper">
                {l.label}
              </Link>
            ))}
            <CookieSettingsLink className="hover:text-paper" />
          </nav>
          {settings.payments.showIcons && settings.payments.methods.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Accepted payment methods">
              {settings.payments.methods.map((m) => (
                <li key={m} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-wider text-silver">
                  {PAYMENT_LABELS[m] ?? m}
                </li>
              ))}
            </ul>
          )}
          <p>
            © {new Date().getFullYear()} {b.tradingName}.{' '}
            {!isPlaceholderValue(b.registeredName) && `${b.registeredName}. `}
            {!isPlaceholderValue(b.companyNumber) && `Company no. ${b.companyNumber}. `}
            {!isPlaceholderValue(b.vatNumber) && `VAT no. ${b.vatNumber}.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
