import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { PolicyPage } from '@/components/content/PolicyPage';
import { CookieSettingsLink } from '@/components/layout/Consent';

export const metadata: Metadata = { title: 'Cookie policy', alternates: { canonical: '/cookies' } };

export default async function CookiesPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Cookie"
      accent="policy."
      content={s.policies.cookies}
      outline={['Strictly necessary storage used by the shop (basket, wishlist, sign-in session, consent choice)', 'Analytics cookies (Google Analytics 4) — only set after consent', 'Marketing cookies (Meta Pixel) — only set after consent', 'How long each lasts and how to change your choice']}
    >
      <div className="glass mt-10 rounded-[24px] p-6 text-sm text-silver">
        <p className="label">What this website does today</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Essential: a secure sign-in cookie (po_session) when you log in, and browser storage for your basket, wishlist, recently viewed items and cookie choice.</li>
          <li>Analytics and marketing scripts are not loaded unless they are configured and you opt in.</li>
        </ul>
        <CookieSettingsLink className="mt-4 rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-paper hover:border-champagne/50" />
      </div>
    </PolicyPage>
  );
}
