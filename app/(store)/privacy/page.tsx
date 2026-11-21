import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { PolicyPage } from '@/components/content/PolicyPage';

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy"
      accent="policy."
      content={s.policies.privacy}
      outline={[
        'Who the data controller is (registered business name, address, contact, ICO registration if applicable)',
        'What personal data is collected (orders, accounts, newsletter, contact form, analytics with consent)',
        'Purposes and lawful bases for each use (contract, legal obligation, consent, legitimate interests)',
        'Processors used: Stripe (payments), hosting provider, Supabase (database), email provider, analytics (only with consent)',
        'International transfers and safeguards',
        'Retention periods',
        'Individuals’ rights under UK GDPR and how to exercise them',
        'How to complain to the Information Commissioner’s Office (ICO)',
      ]}
    />
  );
}
