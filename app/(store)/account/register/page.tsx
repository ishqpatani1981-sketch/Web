import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getSettings } from '@/lib/settings';
import { RegisterForm } from '@/components/auth/AuthForms';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/account');
  const settings = await getSettings();
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 pt-32">
      <p className="eyebrow mb-4">My account</p>
      <h1 className="display mb-8 text-[clamp(2.2rem,5vw,3.4rem)] text-paper">
        Create your <span className="font-serif normal-case italic text-champagne">account.</span>
      </h1>
      <div className="glass glass-edge rounded-[28px] p-7">
        <RegisterForm consentText={settings.newsletter.consentText} />
      </div>
      <p className="mt-6 text-center text-sm text-titanium">
        Already have an account?{' '}
        <Link href="/account/login" className="text-champagne underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
