import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { PolicyPage } from '@/components/content/PolicyPage';

export const metadata: Metadata = { title: 'Returns policy', alternates: { canonical: '/returns' } };

export default async function ReturnsPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      eyebrow="Customer service"
      title="Returns"
      accent="policy."
      content={s.policies.returns}
      outline={['How to start a return and who pays return postage', 'The cancellation period for online orders (Consumer Contracts Regulations 2013)', 'Condition requirements and any exclusions (e.g. engraved or personalised items)', 'Faulty items and rights under the Consumer Rights Act 2015', 'Refund method and timescales', 'Warranty information, if offered']}
    />
  );
}
