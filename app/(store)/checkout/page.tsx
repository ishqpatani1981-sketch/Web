import type { Metadata } from 'next';
import { CheckoutForm } from './CheckoutForm';
import { demoPaymentsEnabled, stripeConfig } from '@/lib/config';
import { getCurrentUser } from '@/lib/auth/session';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Secure checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const stripe = stripeConfig();
  const mode: 'stripe-live' | 'stripe-test' | 'demo' | 'unavailable' = stripe.configured ? (stripe.mode === 'live' ? 'stripe-live' : 'stripe-test') : demoPaymentsEnabled() ? 'demo' : 'unavailable';
  return (
    <CheckoutForm
      paymentMode={mode}
      defaultEmail={user?.email ?? ''}
      defaultName={user?.name ?? ''}
      consentText={settings.newsletter.consentText}
      shipsTo={settings.delivery.shipsTo}
    />
  );
}
