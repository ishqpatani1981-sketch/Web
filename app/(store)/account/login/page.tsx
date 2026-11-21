import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/account');
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 pt-32">
      <p className="eyebrow mb-4">My account</p>
      <h1 className="display mb-8 text-[clamp(2.2rem,5vw,3.4rem)] text-paper">
        Welcome <span className="font-serif normal-case italic text-champagne">back.</span>
      </h1>
      <div className="glass glass-edge rounded-[28px] p-7">
        <LoginForm />
      </div>
    </div>
  );
}
