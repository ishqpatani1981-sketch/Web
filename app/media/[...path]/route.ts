import { readLocalUpload } from '@/lib/storage';

/** Serves images uploaded while Supabase Storage is not configured (local/dev only). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const file = await readLocalUpload(path.join('/'));
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
}
