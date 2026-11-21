import Link from 'next/link';
import { notFound } from 'next/navigation';
import { count, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { campaigns, subscribers } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { CAMPAIGN_TYPES, previewCampaignHtml } from '@/lib/marketing';
import { cronSecret } from '@/lib/config';
import { Card, PageTitle, StatusPill } from '@/components/admin/ui';
import { CampaignActions, CampaignForm } from '@/components/admin/MarketingForms';

export const metadata = { title: 'Campaign' };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('marketing:manage');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!c) notFound();
  const [[{ value: subscribed }], html] = await Promise.all([db.select({ value: count() }).from(subscribers).where(eq(subscribers.status, 'subscribed')), previewCampaignHtml(id)]);
  return (
    <>
      <Link href="/admin/newsletter" className="text-xs uppercase tracking-[0.16em] text-titanium hover:text-paper">
        ← Newsletter
      </Link>
      <PageTitle title={c.name} action={<StatusPill status={c.status} />} description={c.lastError ?? undefined} />
      {c.status === 'scheduled' && !cronSecret() && (
        <p className="mb-6 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-warning">Scheduled sending needs CRON_SECRET and the /api/cron/campaigns job (see docs/CONFIGURATION.md). Until then, use “Send campaign”.</p>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        <div className="space-y-6">
          <Card title="Content">
            <CampaignForm campaign={c} types={CAMPAIGN_TYPES.map((t) => ({ ...t }))} />
          </Card>
          <Card title="Send">
            <CampaignActions campaign={c} subscribed={subscribed} />
          </Card>
        </div>
        <Card title="Preview">
          {html && <iframe title="Campaign preview" sandbox="" srcDoc={html} className="h-[760px] w-full rounded-xl bg-white" />}
        </Card>
      </div>
    </>
  );
}
