import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { storageConfig } from '@/lib/config';
import { randomToken } from '@/lib/auth/password';

const MAX_BYTES = 4 * 1024 * 1024; // matches the 4 MB Server Action body limit
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

export function localUploadDir() {
  return process.env.VERCEL ? '/tmp/pens-outlet-uploads' : path.join(process.cwd(), '.data', 'uploads');
}

function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.subarray(4, 12).toString('ascii').startsWith('ftypavi')) return 'image/avif';
  return null;
}

/**
 * Stores an uploaded product/collection image. Uses Supabase Storage when configured,
 * otherwise the local disk (development only). Validates size and real file type.
 */
export async function storeImage(file: File, folder: 'products' | 'collections' | 'content') {
  if (!file || file.size === 0) throw new Error('No file received.');
  if (file.size > MAX_BYTES) throw new Error('Images must be 4 MB or smaller (upload one or two at a time).');
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new Error('Please upload a JPEG, PNG, WebP or AVIF image.');
  const name = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomToken(12)}.${TYPES[type]}`;

  const cfg = storageConfig();
  if (cfg.provider === 'supabase') {
    const res = await fetch(`${cfg.url}/storage/v1/object/${cfg.bucket}/${name}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.serviceRoleKey}`, 'Content-Type': type, 'x-upsert': 'false', 'cache-control': '31536000' },
      body: buf,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status}). Check the Supabase storage bucket "${cfg.bucket}" exists.`);
    return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${name}`;
  }

  const target = path.join(localUploadDir(), name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buf);
  return `/media/${name}`;
}

export async function readLocalUpload(relative: string) {
  const root = localUploadDir();
  const full = path.resolve(root, relative);
  if (!full.startsWith(root + path.sep)) return null;
  try {
    const data = await readFile(full);
    const ext = path.extname(full).slice(1);
    const type = Object.entries(TYPES).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
    return { data, type };
  } catch {
    return null;
  }
}
