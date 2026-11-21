import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, lt } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { auditLog, sessions, users, type User } from '@/lib/db/schema';
import { randomToken, sha256 } from './password';

export const SESSION_COOKIE = 'po_session';
const CUSTOMER_TTL_DAYS = 30;
const STAFF_TTL_HOURS = 12;

export type Role = 'customer' | 'staff' | 'admin';
export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'marketingOptIn'>;

/** Permissions by role. Admin has everything; staff manages catalogue and orders only. */
const PERMISSIONS = {
  'dashboard:view': ['staff', 'admin'],
  'products:manage': ['staff', 'admin'],
  'orders:manage': ['staff', 'admin'],
  'messages:manage': ['staff', 'admin'],
  'marketing:manage': ['admin'],
  'content:manage': ['admin'],
  'settings:manage': ['admin'],
  'users:manage': ['admin'],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string | undefined, permission: Permission) {
  return !!role && (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export async function createSession(user: Pick<User, 'id' | 'role'>) {
  const token = randomToken(32);
  const isStaff = user.role === 'admin' || user.role === 'staff';
  const expiresAt = new Date(Date.now() + (isStaff ? STAFF_TTL_HOURS * 3600e3 : CUSTOMER_TTL_DAYS * 86400e3));
  const db = await getDb();
  const ua = (await headers()).get('user-agent')?.slice(0, 300) ?? null;
  await db.insert(sessions).values({ id: sha256(token), userId: user.id, expiresAt, userAgent: ua });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  // Opportunistic cleanup of expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, marketingOptIn: users.marketingOptIn })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
});

/** For pages/layouts: redirects to the admin login when the user lacks the permission. */
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  // Customers never reach the admin shell; staff without a specific permission go to the dashboard.
  if (!can(user.role, 'dashboard:view')) redirect('/admin/login?denied=1');
  if (!can(user.role, permission)) redirect('/admin?denied=1');
  return user;
}

/** For server actions: throws instead of redirecting. */
export async function assertPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, permission)) throw new Error('You do not have permission to do that.');
  return user;
}

export async function requireCustomer() {
  const user = await getCurrentUser();
  if (!user) redirect('/account/login');
  return user;
}

export async function audit(userId: string | null, action: string, entity?: string, entityId?: string, detail?: string) {
  try {
    const db = await getDb();
    await db.insert(auditLog).values({ userId, action, entity, entityId, detail: detail?.slice(0, 2000) });
  } catch (err) {
    console.error('[audit] failed', err);
  }
}
