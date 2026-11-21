import { NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/marketing';

/** RFC 8058 one-click unsubscribe (List-Unsubscribe-Post) endpoint used by mail clients. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token || token.length > 200) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await unsubscribeByToken(token);
  return NextResponse.json({ ok: result.ok }, { status: result.ok ? 200 : 404 });
}
