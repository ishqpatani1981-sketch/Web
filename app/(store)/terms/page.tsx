import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { PolicyPage } from '@/components/content/PolicyPage';

export const metadata: Metadata = { title: 'Terms and conditions', alternates: { canonical: '/terms' } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms &"
      accent="conditions."
      content={s.policies.terms}
      outline={['Seller identity and contact details', 'How contracts are formed and order acceptance', 'Pricing, VAT and payment', 'Delivery, risk and ownership', 'Cancellation, returns and refunds', 'Liability and consumer statutory rights', 'Governing law (England & Wales)']}
    />
  );
}
