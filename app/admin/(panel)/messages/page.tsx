import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { setMessageStatus } from '@/actions/admin/operations';
import { formatDateTime } from '@/lib/utils';
import { Card, ConfirmButton, PageTitle, StatusPill } from '@/components/admin/ui';

export const metadata = { title: 'Messages' };

export default async function MessagesPage() {
  await requirePermission('messages:manage');
  const db = await getDb();
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
  return (
    <>
      <PageTitle title="Messages" description="Enquiries sent through the contact form. Reply by email, then mark them as replied." />
      {rows.length === 0 && <Card><p className="text-sm text-titanium">No messages yet.</p></Card>}
      <div className="space-y-3">
        {rows.map((m) => (
          <Card key={m.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-paper">
                  {m.name} <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? 'Your enquiry'}`)}`} className="text-sm text-champagne">{m.email}</a>
                </p>
                <p className="text-xs text-titanium">
                  {formatDateTime(m.createdAt)}
                  {m.phone && ` · ${m.phone}`}
                  {m.orderNumber && ` · Order ${m.orderNumber}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={m.status} />
                {m.status !== 'read' && <ConfirmButton action={setMessageStatus} fields={{ id: m.id, status: 'read' }} label="Mark read" />}
                {m.status !== 'replied' && <ConfirmButton action={setMessageStatus} fields={{ id: m.id, status: 'replied' }} label="Replied" />}
                {m.status !== 'archived' && <ConfirmButton action={setMessageStatus} fields={{ id: m.id, status: 'archived' }} label="Archive" />}
              </div>
            </div>
            {m.subject && <p className="mt-3 text-sm text-paper">{m.subject}</p>}
            <p className="mt-2 whitespace-pre-line text-sm text-silver">{m.message}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
