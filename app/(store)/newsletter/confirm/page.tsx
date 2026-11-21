import type { Metadata } from 'next';
import { confirmSubscription } from '@/lib/marketing';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Confirm subscription', robots: { index: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token && token.length < 200 ? await confirmSubscription(token) : { ok: false as const };
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 pt-32 text-center">
      <p className="eyebrow">Newsletter</p>
      <h1 className="display mt-4 text-[clamp(2rem,5vw,3.4rem)] text-paper">
        {result.ok ? (
          <>
            You’re <span className="font-serif normal-case italic text-champagne">in the loop.</span>
          </>
        ) : (
          'Link expired'
        )}
      </h1>
      <p className="mt-4 text-silver/85">
        {result.ok ? 'Thank you for confirming. Look out for new arrivals, exclusive offers and special promotions.' : 'This confirmation link is invalid or has already been used. You can subscribe again from the homepage.'}
      </p>
      <LinkButton href="/" className="mt-8">
        Back to Pens Outlet
      </LinkButton>
    </div>
  );
}
