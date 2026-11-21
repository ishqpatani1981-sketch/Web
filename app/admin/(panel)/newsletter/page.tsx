import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import { Download, Plus } from 'lucide-react';
import { getDb } from '@/lib/db';
import { campaigns, subscribers } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { marketingConfig } from '@/lib/config';
import { setSubscriberStatus } from '@/actions/admin/operations';
import { formatDateTime } from '@/lib/utils';
import { Card, ConfirmButton, PageTitle, StatTile, StatusPill, Table } from '@/components/admin/ui';

export const metadata = { title: 'Newsletter' };

export default async function NewsletterPage() {
  await requirePermission('marketing:manage');
  const db = await getDb();
  const [subs, camps, counts] = await Promise.all([
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(500),
    db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(50),
    db.select({ status: subscribers.status, n: sql<number>`count(*)::int` }).from(subscribers).groupBy(subscribers.status),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const mk = marketingConfig();
  return (
    <>
      <PageTitle
        title="Newsletter"
        description="Double opt-in subscribers (UK GDPR / PECR): people are only emailed after confirming. Every message carries an unsubscribe link."
        action={
          <Link href="/admin/newsletter/campaigns/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-paper px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Subscribed" value={n('subscribed')} />
        <StatTile label="Awaiting confirmation" value={n('pending')} />
        <StatTile label="Unsubscribed" value={n('unsubscribed')} />
        <StatTile label="Provider sync" value={mk.configured ? (mk.provider === 'brevo' ? 'Brevo' : 'Mailchimp') : 'Off'} hint={mk.configured ? 'Contacts sync on confirm/unsubscribe' : 'Awaiting configuration'} tone={mk.configured ? 'default' : 'warning'} />
      </div>

      <Card title="Campaigns" className="mt-6">
        <Table head={['Campaign', 'Type', 'Status', 'Scheduled / sent', 'Recipients']} empty={camps.length === 0 ? <p className="p-6 text-sm text-titanium">No campaigns yet — create one to announce new arrivals or offers.</p> : null}>
          {camps.map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/admin/newsletter/campaigns/${c.id}`} className="text-paper hover:text-champagne">
                  {c.name}
                </Link>
                <span className="block text-xs text-titanium">{c.subject}</span>
              </td>
              <td className="px-4 py-3 text-xs text-silver">{c.type.replace('_', ' ')}</td>
              <td className="px-4 py-3">
                <StatusPill status={c.status} />
              </td>
              <td className="px-4 py-3 text-xs text-titanium">{c.sentAt ? formatDateTime(c.sentAt) : c.scheduledAt ? formatDateTime(c.scheduledAt) : '—'}</td>
              <td className="px-4 py-3 tabular-nums">{c.recipientCount || '—'}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Subscribers" className="mt-6" action={<a href="/admin/export/subscribers" className="flex items-center gap-1.5 text-xs text-champagne"><Download className="h-3.5 w-3.5" /> Export CSV</a>}>
        <Table head={['Email', 'Status', 'Source', 'Consent', '']} empty={subs.length === 0 ? <p className="p-6 text-sm text-titanium">No subscribers yet.</p> : null}>
          {subs.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 text-paper">{s.email}</td>
              <td className="px-4 py-3">
                <StatusPill status={s.status} />
              </td>
              <td className="px-4 py-3 text-xs text-titanium">{s.source ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-titanium">
                {formatDateTime(s.consentAt)}
                {s.confirmedAt && <span className="block">Confirmed {formatDateTime(s.confirmedAt)}</span>}
              </td>
              <td className="px-4 py-3 text-right">
                {s.status !== 'unsubscribed' && <ConfirmButton action={setSubscriberStatus} fields={{ id: s.id, status: 'unsubscribed' }} label="Unsubscribe" confirm={`Unsubscribe ${s.email}?`} />}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
