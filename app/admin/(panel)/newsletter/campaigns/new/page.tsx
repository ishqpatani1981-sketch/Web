import Link from 'next/link';
import { requirePermission } from '@/lib/auth/session';
import { CAMPAIGN_TYPES } from '@/lib/marketing';
import { Card, PageTitle } from '@/components/admin/ui';
import { CampaignForm } from '@/components/admin/MarketingForms';

export const metadata = { title: 'New campaign' };

export default async function NewCampaignPage() {
  await requirePermission('marketing:manage');
  return (
    <>
      <Link href="/admin/newsletter" className="text-xs uppercase tracking-[0.16em] text-titanium hover:text-paper">
        ← Newsletter
      </Link>
      <PageTitle title="New campaign" description="Create the email, preview it, send yourself a test, then schedule or send." />
      <Card>
        <CampaignForm types={CAMPAIGN_TYPES.map((t) => ({ ...t }))} />
      </Card>
    </>
  );
}
