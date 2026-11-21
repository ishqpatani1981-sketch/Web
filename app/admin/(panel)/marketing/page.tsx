import { asc, desc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { discountCodes, promotions } from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/session';
import { deleteDiscountCode, deletePromotion } from '@/actions/admin/operations';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { nowMs } from '@/lib/time';
import { Card, ConfirmButton, PageTitle, StatusPill, Table } from '@/components/admin/ui';
import { DiscountForm, PromotionForm } from '@/components/admin/MarketingForms';

export const metadata = { title: 'Promotions & codes' };

export default async function MarketingPage() {
  await requirePermission('marketing:manage');
  const db = await getDb();
  const [promos, codes] = await Promise.all([db.select().from(promotions).orderBy(asc(promotions.sortOrder)), db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt))]);
  const now = nowMs();
  return (
    <>
      <PageTitle title="Promotions & discount codes" description="Run sale banners, seasonal campaigns and discount codes. Countdowns only appear for promotions with a real end date." />

      <Card title="Promotions & banners">
        <div className="space-y-4">
          {promos.map((p) => {
            const live = p.active && (!p.startsAt || p.startsAt.getTime() <= now) && (!p.endsAt || p.endsAt.getTime() > now);
            return (
              <details key={p.id} className="rounded-2xl border border-white/[0.07] p-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <span>
                    <span className="text-paper">{p.title}</span>
                    <span className="block text-xs text-titanium">
                      {p.placement.replace('_', ' ')} · {p.endsAt ? `ends ${formatDateTime(p.endsAt)}` : 'no end date'}
                      {p.countdownEnabled && ' · countdown'}
                      {p.isPlaceholder && ' · placeholder'}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusPill status={live ? 'active' : 'draft'} />
                    <ConfirmButton action={deletePromotion} fields={{ id: p.id }} label="Delete" variant="danger" confirm={`Delete “${p.title}”?`} />
                  </span>
                </summary>
                <div className="mt-4">
                  <PromotionForm promo={p} />
                </div>
              </details>
            );
          })}
          <details className="rounded-2xl border border-dashed border-white/15 p-4">
            <summary className="cursor-pointer list-none text-sm text-champagne">+ New promotion</summary>
            <div className="mt-4">
              <PromotionForm />
            </div>
          </details>
        </div>
      </Card>

      <Card title="Discount codes" className="mt-6">
        <Table head={['Code', 'Offer', 'Used', 'Window', 'Status', '']}>
          {codes.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-mono text-paper">
                {c.code}
                {c.isPlaceholder && <span className="ml-2 font-sans text-[10px] uppercase text-warning">demo</span>}
              </td>
              <td className="px-4 py-3 text-silver">
                {c.type === 'percent' ? `${c.value}% off` : c.type === 'fixed' ? `${formatPrice(c.value)} off` : 'Free delivery'}
                {c.minOrderPence > 0 && <span className="block text-xs text-titanium">min {formatPrice(c.minOrderPence)}</span>}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {c.usedCount}
                {c.maxUses ? ` / ${c.maxUses}` : ''}
              </td>
              <td className="px-4 py-3 text-xs text-titanium">
                {c.startsAt ? formatDateTime(c.startsAt) : 'Now'} → {c.endsAt ? formatDateTime(c.endsAt) : 'no end'}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={c.active ? 'active' : 'draft'} />
              </td>
              <td className="px-4 py-3 text-right">
                <ConfirmButton action={deleteDiscountCode} fields={{ id: c.id }} label="Delete" variant="danger" confirm={`Delete code ${c.code}?`} />
              </td>
            </tr>
          ))}
        </Table>
        <div className="mt-6 rounded-2xl border border-white/[0.07] p-4">
          <p className="label mb-3">New discount code</p>
          <DiscountForm />
        </div>
      </Card>
    </>
  );
}
