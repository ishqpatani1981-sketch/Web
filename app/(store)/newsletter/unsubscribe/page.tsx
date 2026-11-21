import type { Metadata } from 'next';
import { unsubscribeByToken } from '@/lib/marketing';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token && token.length < 200 ? await unsubscribeByToken(token) : { ok: false as const };
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 pt-32 text-center">
      <p className="eyebrow">Newsletter</p>
      <h1 className="display mt-4 text-[clamp(2rem,5vw,3.4rem)] text-paper">{result.ok ? 'You have been unsubscribed.' : 'Link not recognised'}</h1>
      <p className="mt-4 text-silver/85">
        {result.ok ? 'You will no longer receive marketing emails from Pens Outlet. Order emails will still be sent for purchases you make.' : 'We could not find a subscription for this link. If you continue to receive emails, please contact us.'}
      </p>
      <LinkButton href="/" className="mt-8">
        Back to Pens Outlet
      </LinkButton>
    </div>
  );
}
