import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { emailLog } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { emailConfig } from '@/lib/config';
import { formatDateTime } from '@/lib/utils';
import { Card, PageTitle, StatusPill, Table } from '@/components/admin/ui';

export const metadata = { title: 'Email outbox' };

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requirePermission('settings:manage');
  const sp = await searchParams;
  const db = await getDb();
  const rows = await db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(200);
  const selected = rows.find((r) => r.id === sp.id) ?? null;
  const cfg = emailConfig();
  return (
    <>
      <PageTitle title="Email outbox" description="Every email the website sends or would send. While no email provider is configured, messages are recorded here (status “logged”) but not delivered." />
      {!cfg.configured && <p className="mb-6 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-warning">Email delivery is awaiting configuration. Set EMAIL_PROVIDER plus RESEND_API_KEY or BREVO_API_KEY to start delivering.</p>}
      <div className="grid gap-6 2xl:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <Card>
          <Table head={['When', 'To', 'Subject', 'Type', 'Status']} empty={rows.length === 0 ? <p className="p-6 text-sm text-titanium">No emails yet.</p> : null}>
            {rows.map((r) => (
              <tr key={r.id} className={r.id === sp.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-titanium">{formatDateTime(r.createdAt)}</td>
                <td className="px-4 py-3 text-silver">{r.to}</td>
                <td className="px-4 py-3">
                  <a href={`?id=${r.id}`} className="text-paper hover:text-champagne">
                    {r.subject}
                  </a>
                  {r.error && <span className="block text-xs text-danger">{r.error}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-titanium">{r.template}</td>
                <td className="px-4 py-3">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title={selected ? `Preview — ${selected.subject}` : 'Preview'}>
          {selected?.html ? (
            <iframe title="Email preview" sandbox="" srcDoc={selected.html} className="h-[640px] w-full rounded-xl bg-white" />
          ) : (
            <p className="text-sm text-titanium">Select an email to preview it.</p>
          )}
        </Card>
      </div>
    </>
  );
}
