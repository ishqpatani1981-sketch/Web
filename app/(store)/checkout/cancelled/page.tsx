import type { Metadata } from 'next';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Payment cancelled', robots: { index: false } };

export default function CancelledPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 pt-32 text-center">
      <p className="eyebrow">Payment cancelled</p>
      <h1 className="display mt-4 text-[clamp(2rem,5vw,3.4rem)] text-paper">
        No payment <span className="font-serif normal-case italic text-champagne">was taken.</span>
      </h1>
      <p className="mt-4 text-silver/85">Your basket has been saved. You can return to checkout whenever you are ready.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/checkout">Return to checkout</LinkButton>
        <LinkButton href="/basket" variant="glass">
          View basket
        </LinkButton>
      </div>
    </div>
  );
}
