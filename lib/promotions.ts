import 'server-only';
import { and, asc, eq, gt, isNull, lte, or } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { promotions } from '@/lib/db/schema';

/** Active promotions whose schedule window includes now. */
export async function getLivePromotions(placement?: string) {
  const db = await getDb();
  const now = new Date();
  return db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.active, true),
        placement ? eq(promotions.placement, placement) : undefined,
        or(isNull(promotions.startsAt), lte(promotions.startsAt, now)),
        or(isNull(promotions.endsAt), gt(promotions.endsAt, now)),
      ),
    )
    .orderBy(asc(promotions.sortOrder));
}
