import 'server-only';
import { headers } from 'next/headers';
import { and, eq, gt, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { rateLimits } from '@/lib/db/schema';
import { sha256 } from '@/lib/auth/password';

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

/**
 * Fixed-window rate limiter stored in the database so it works across serverless
 * instances. Returns true when the action is allowed.
 */
export async function rateLimit(bucket: string, identifier: string, limit: number, windowSeconds: number) {
  const key = `${bucket}:${sha256(identifier).slice(0, 32)}`;
  const db = await getDb();
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} < now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} < now() then ${resetAt.toISOString()}::timestamptz else ${rateLimits.resetAt} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return (row?.count ?? 0) <= limit;
}

/** Current count in an active window (0 if none) — lets callers count only failures. */
export async function rateLimitCount(bucket: string, identifier: string) {
  const key = `${bucket}:${sha256(identifier).slice(0, 32)}`;
  const db = await getDb();
  const [row] = await db
    .select({ count: rateLimits.count })
    .from(rateLimits)
    .where(and(eq(rateLimits.key, key), gt(rateLimits.resetAt, new Date())))
    .limit(1);
  return row?.count ?? 0;
}
