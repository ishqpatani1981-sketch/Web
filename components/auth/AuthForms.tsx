'use client';

import Link from 'next/link';
import { startTransition, useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { login, register, changePassword, type AuthState } from '@/actions/auth';

function submitWithoutReset(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}

export function LoginForm({ area = 'customer', next }: { area?: 'customer' | 'admin'; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, { status: 'idle', message: '' });
  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4" noValidate>
      <input type="hidden" name="area" value={area} />
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <p className="min-h-5 text-sm text-danger" role="alert">
        {state.status === 'error' ? state.message : ''}
      </p>
      <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-paper text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white disabled:opacity-60" data-testid="login-submit">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
      </button>
      {area === 'customer' && (
        <p className="text-center text-sm text-titanium">
          New to Pens Outlet?{' '}
          <Link href="/account/register" className="text-champagne underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}

export function RegisterForm({ consentText }: { consentText: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, { status: 'idle', message: '' });
  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input id="name" name="name" autoComplete="name" required className="field" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} className="field" aria-describedby="pw-hint" />
        <p id="pw-hint" className="mt-1.5 text-xs text-titanium">
          At least 10 characters, with letters and numbers.
        </p>
      </div>
      <label className="flex items-start gap-3 text-xs text-silver/80">
        <input type="checkbox" name="marketing" className="mt-0.5 h-4 w-4 shrink-0 accent-[#dcc7a1]" />
        <span>{consentText} (Optional.)</span>
      </label>
      <p className="min-h-5 text-sm text-danger" role="alert">
        {state.status === 'error' ? state.message : ''}
      </p>
      <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-paper text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create account
      </button>
      <p className="text-center text-xs text-titanium">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="underline">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePassword, { status: 'idle', message: '' });
  return (
    <form onSubmit={submitWithoutReset(action)} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
      <div>
        <label htmlFor="current" className="label">
          Current password
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" className="field" />
      </div>
      <div>
        <label htmlFor="next" className="label">
          New password
        </label>
        <input id="next" name="next" type="password" autoComplete="new-password" className="field" />
      </div>
      <button type="submit" disabled={pending} className="h-[50px] rounded-full border border-white/15 px-5 text-[11px] uppercase tracking-[0.16em] text-paper hover:border-champagne/50">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
      </button>
      {state.message && (
        <p className={`text-sm sm:col-span-3 ${state.status === 'error' ? 'text-danger' : 'text-success'}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
