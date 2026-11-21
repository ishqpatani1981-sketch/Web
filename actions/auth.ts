'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { audit, createSession, destroySession, getCurrentUser } from '@/lib/auth/session';
import { clientIp, rateLimit, rateLimitCount } from '@/lib/rate-limit';

export type AuthState = { status: 'idle' | 'error'; message: string };

const Email = z.string().trim().toLowerCase().email('Please enter a valid email address').max(200);
const Password = z
  .string()
  .min(10, 'Passwords must be at least 10 characters')
  .max(200)
  .refine((p) => /[a-zA-Z]/.test(p) && /\d/.test(p), 'Use a mix of letters and numbers');

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === 'string' ? next : '';
  return n.startsWith('/') && !n.startsWith('//') ? n : fallback;
}

// A real hash so failed logins for unknown emails take the same time as wrong passwords.
let dummyHash: Promise<string> | null = null;

export async function login(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = z.object({ email: Email, password: z.string().min(1).max(200) }).safeParse({ email: fd.get('email'), password: fd.get('password') });
  if (!parsed.success) return { status: 'error', message: 'Please enter your email address and password.' };
  const ip = await clientIp();
  const area = fd.get('area') === 'admin' ? 'admin' : 'customer';
  // Only failed attempts count towards the lockout (10 per IP, 8 per account, per 15 minutes).
  if ((await rateLimitCount(`login-fail:${area}`, ip)) >= 10 || (await rateLimitCount('login-fail:email', parsed.data.email)) >= 8) {
    return { status: 'error', message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' };
  }
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  dummyHash ??= hashPassword('not-a-real-password-0');
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) {
    await rateLimit(`login-fail:${area}`, ip, 10, 900);
    await rateLimit('login-fail:email', parsed.data.email, 8, 900);
    return { status: 'error', message: 'That email and password combination is not recognised.' };
  }
  if (area === 'admin' && user.role !== 'admin' && user.role !== 'staff') {
    return { status: 'error', message: 'That account does not have access to the admin area.' };
  }
  await createSession(user);
  if (area === 'admin') await audit(user.id, 'admin.login');
  redirect(safeNext(fd.get('next'), area === 'admin' ? '/admin' : '/account'));
}

export async function register(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = z
    .object({ name: z.string().trim().min(2, 'Please enter your name').max(120), email: Email, password: Password, marketing: z.boolean() })
    .safeParse({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password'), marketing: fd.get('marketing') === 'on' });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check your details.' };
  const ip = await clientIp();
  if (!(await rateLimit('register', ip, 5, 3600))) return { status: 'error', message: 'Too many accounts created from this connection. Please try later.' };
  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) return { status: 'error', message: 'An account with that email already exists. Please sign in instead.' };
  const [user] = await db
    .insert(users)
    .values({ email: parsed.data.email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password), role: 'customer', marketingOptIn: false })
    .returning();
  await createSession(user);
  if (parsed.data.marketing) {
    const { subscribe } = await import('@/lib/marketing');
    const { getSettings } = await import('@/lib/settings');
    const s = await getSettings();
    await subscribe({ email: user.email, name: user.name, source: 'account', consentText: s.newsletter.consentText, ip }).catch(() => undefined);
  }
  redirect('/account?welcome=1');
}

export async function logout() {
  await destroySession();
  redirect('/');
}

export async function changePassword(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { status: 'error', message: 'Please sign in again.' };
  const parsed = z.object({ current: z.string().min(1), next: Password }).safeParse({ current: fd.get('current'), next: fd.get('next') });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  const db = await getDb();
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.current, row.passwordHash))) return { status: 'error', message: 'Your current password is incorrect.' };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.next), updatedAt: new Date() }).where(eq(users.id, user.id));
  await audit(user.id, 'password.changed');
  return { status: 'idle', message: 'Password updated.' };
}
