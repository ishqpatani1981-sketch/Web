'use server';

import { z } from 'zod';
import { subscribe } from '@/lib/marketing';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { getSettings } from '@/lib/settings';

export type NewsletterState = { status: 'idle' | 'success' | 'error'; message: string };

const Schema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(200),
  consent: z.literal('on', { message: 'Please tick the box to confirm you would like to receive marketing emails.' }),
  source: z.string().max(40).optional(),
  // Honeypot: real visitors never fill this in.
  company: z.string().max(0).optional(),
});

export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = Schema.safeParse({
    email: formData.get('email'),
    consent: formData.get('consent') ?? undefined,
    source: formData.get('source') ?? undefined,
    company: formData.get('company') ?? '',
  });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check your details.' };

  const ip = await clientIp();
  if (!(await rateLimit('newsletter', ip, 5, 3600))) {
    return { status: 'error', message: 'Too many attempts. Please try again later.' };
  }

  try {
    const settings = await getSettings();
    const outcome = await subscribe({
      email: parsed.data.email,
      source: parsed.data.source ?? 'website',
      consentText: settings.newsletter.consentText,
      ip,
    });
    return outcome === 'already_subscribed'
      ? { status: 'success', message: 'You are already subscribed — thank you for being part of Pens Outlet.' }
      : { status: 'success', message: 'Almost there! Please check your inbox and confirm your subscription.' };
  } catch (err) {
    console.error('[newsletter]', err);
    return { status: 'error', message: 'Something went wrong. Please try again in a moment.' };
  }
}
