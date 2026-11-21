'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Logo } from '@/components/brand/Logo';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <h1 className="mt-10 text-4xl font-light text-paper">Something went wrong.</h1>
      <p className="mt-3 max-w-md text-silver/80">Please try again. If the problem continues, contact us and quote reference {error.digest ?? 'N/A'}.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="h-11 rounded-full bg-paper px-6 text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
          Try again
        </button>
        <Link href="/" className="flex h-11 items-center rounded-full border border-white/15 px-6 text-[11px] uppercase tracking-[0.16em] text-paper">
          Home
        </Link>
      </div>
    </main>
  );
}
