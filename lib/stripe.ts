import 'server-only';
import Stripe from 'stripe';
import { stripeConfig } from '@/lib/config';

let client: Stripe | null = null;

/** Returns a Stripe client, or null while payments are awaiting configuration. */
export function getStripe(): Stripe | null {
  const cfg = stripeConfig();
  if (!cfg.secretKey) return null;
  if (!client) client = new Stripe(cfg.secretKey, { appInfo: { name: 'Pens Outlet' }, maxNetworkRetries: 2 });
  return client;
}
