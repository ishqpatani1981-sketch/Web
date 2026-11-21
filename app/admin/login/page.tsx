import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, can } from '@/lib/auth/session';
import { LoginForm } from '@/components/auth/AuthForms';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const user = await getCurrentUser();
  if (user && can(user.role, 'dashboard:view')) redirect('/admin');
  const { next, denied } = await searchParams;
  const configured = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) || process.env.NODE_ENV !== 'production';
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_30%,rgba(220,199,161,0.1),transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo />
          <p className="eyebrow mt-6">Administration</p>
        </div>
        <div className="glass-strong glass-edge rounded-[28px] p-7">
          {denied && user && (
            <p className="mb-5 rounded-xl border border-warning/25 bg-warning/10 p-3 text-xs text-warning">
              You are signed in as {user.email}, which does not have access to the admin area. Sign in with an administrator account.
            </p>
          )}
          {!configured && (
            <p className="mb-5 rounded-xl border border-warning/25 bg-warning/10 p-3 text-xs text-warning">
              No administrator has been configured. Set ADMIN_EMAIL and ADMIN_PASSWORD and run <code>npm run db:seed</code>.
            </p>
          )}
          <LoginForm area="admin" next={next?.startsWith('/admin') ? next : undefined} />
        </div>
        <p className="mt-6 text-center text-xs text-titanium">Protected area. Sign-in attempts are rate limited and logged.</p>
      </div>
    </main>
  );
}
