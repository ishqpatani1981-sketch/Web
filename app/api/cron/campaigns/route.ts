import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cronSecret } from '@/lib/config';
import { runScheduledCampaigns } from '@/lib/marketing';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Sends scheduled campaigns that are due. Call with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron does this automatically). */
export async function GET(req: Request) {
  const secret = cronSecret();
  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const results = await runScheduledCampaigns();
  return NextResponse.json({ sent: results });
}
