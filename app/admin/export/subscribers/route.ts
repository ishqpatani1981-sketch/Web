import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { getCurrentUser, can } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const csv = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
  // Neutralise spreadsheet formula injection and escape quotes.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'marketing:manage')) return new Response('Forbidden', { status: 403 });
  const db = await getDb();
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  const header = ['email', 'status', 'source', 'consent_text', 'consent_at', 'confirmed_at', 'unsubscribed_at'];
  const body = rows.map((r) => [r.email, r.status, r.source, r.consentText, r.consentAt, r.confirmedAt, r.unsubscribedAt].map(csv).join(','));
  return new Response([header.join(','), ...body].join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="pens-outlet-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
  });
}
