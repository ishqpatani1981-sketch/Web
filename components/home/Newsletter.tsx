'use client';

import Link from 'next/link';
import { startTransition, useActionState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { subscribeToNewsletter, type NewsletterState } from '@/actions/newsletter';
import { SplitReveal } from '@/components/motion/Motion';
import type { Settings } from '@/lib/settings/defaults';

export function Newsletter({ newsletter, source = 'homepage' }: { newsletter: Settings['newsletter']; source?: string }) {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, { status: 'idle', message: '' });

  return (
    <section className="relative px-5 py-24 sm:px-8 md:py-32" data-bg="#07070a" aria-labelledby="newsletter-heading">
      <div className="glass glass-edge relative mx-auto max-w-5xl overflow-hidden rounded-[36px] px-6 py-14 sm:px-14 md:py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-champagne/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="eyebrow mb-4 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> Newsletter
            </p>
            <h2 id="newsletter-heading" className="display text-[clamp(2.2rem,4.6vw,3.8rem)] text-paper">
              <SplitReveal text={newsletter.headline} className="text-metal" wordClassName="text-metal" />
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-silver/85">{newsletter.body}</p>
          </div>
          <AnimatePresence mode="wait">
            {state.status === 'success' ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-start gap-4 rounded-3xl bg-white/[0.04] p-7" role="status" data-testid="newsletter-success">
                <CheckCircle2 className="h-8 w-8 text-champagne" />
                <p className="text-lg text-paper">{state.message}</p>
                <p className="text-xs text-titanium">You can unsubscribe at any time using the link in every email.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="space-y-4"
                noValidate
                onSubmit={(e) => {
                  // Manual dispatch keeps the email field filled if validation fails.
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  startTransition(() => action(fd));
                }}
              >
                <input type="hidden" name="source" value={source} />
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <label>
                    Company <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <label htmlFor="newsletter-email" className="label">
                  Email address
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field h-14 flex-1 rounded-full px-6" aria-invalid={state.status === 'error'} aria-describedby="newsletter-msg" />
                  <button type="submit" disabled={pending} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-paper px-7 text-[12px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-white disabled:opacity-60">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Subscribe
                  </button>
                </div>
                <label className="flex items-start gap-3 text-xs leading-relaxed text-silver/80">
                  <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 shrink-0 accent-[#dcc7a1]" required />
                  <span>
                    {newsletter.consentText} See our{' '}
                    <Link href="/privacy" className="underline hover:text-paper">
                      privacy policy
                    </Link>
                    .
                  </span>
                </label>
                <p id="newsletter-msg" className="min-h-5 text-sm text-danger" role="alert">
                  {state.status === 'error' ? state.message : ''}
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
