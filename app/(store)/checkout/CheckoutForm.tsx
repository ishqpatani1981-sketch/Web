'use client';

import Link from 'next/link';
import { startTransition, useActionState, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { placeOrder, type CheckoutState } from '@/actions/checkout';
import { useBasket } from '@/store/shop';
import { useQuote } from '@/components/basket/useQuote';
import { EmptyBasket } from '@/components/basket/EmptyBasket';
import { DiscountField, SummaryLines, Totals } from '@/components/basket/OrderSummary';
import { formatPrice, cn } from '@/lib/utils';

type Props = {
  paymentMode: 'stripe-live' | 'stripe-test' | 'demo' | 'unavailable';
  defaultEmail: string;
  defaultName: string;
  consentText: string;
  shipsTo: string[];
};

export function CheckoutForm({ paymentMode, defaultEmail, defaultName, consentText, shipsTo }: Props) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, { status: 'idle', message: '' });
  const { quote, loading, hydrated } = useQuote();
  const items = useBasket((s) => s.items);
  const discountCode = useBasket((s) => s.discountCode);
  const deliveryOptionId = useBasket((s) => s.deliveryOptionId);
  const setDelivery = useBasket((s) => s.setDeliveryOption);
  const [billingSame, setBillingSame] = useState(true);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === 'error') document.getElementById('checkout-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state]);

  if (!hydrated) return <div className="min-h-[80vh]" />;
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-36">
        <div className="glass glass-edge rounded-[32px] py-8">
          <EmptyBasket />
        </div>
      </div>
    );

  const chosenDelivery = deliveryOptionId ?? quote?.delivery?.id ?? '';

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-32 sm:px-8 md:pt-36">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[clamp(2.2rem,4.6vw,4rem)] text-paper">
          Secure <span className="font-serif normal-case italic text-champagne">checkout</span>
        </h1>
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-titanium">
          <Lock className="h-3.5 w-3.5" /> Encrypted &amp; processed by Stripe
        </p>
      </div>

      {paymentMode === 'demo' && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/[0.07] p-4 text-sm text-warning" role="note" data-testid="demo-notice">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Demo mode — no payment will be taken.</strong> Stripe is awaiting configuration, so orders placed here are clearly flagged as demonstration orders. Add Stripe keys to enable real payments.
          </p>
        </div>
      )}
      {paymentMode === 'stripe-test' && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-silver" role="note">
          Stripe <strong>test mode</strong>: use card 4242 4242 4242 4242, any future expiry date and any CVC. No real money is taken.
        </div>
      )}

      <form
        className="grid gap-10 lg:grid-cols-[1.5fr_1fr]"
        noValidate
        onSubmit={(e) => {
          // Dispatch manually so React does not reset the customer's details on a validation error.
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))} />
        <input type="hidden" name="discountCode" value={discountCode} />

        <div className="space-y-6">
          <Panel step="01" title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" autoComplete="name" defaultValue={defaultName} error={fe.name} required />
              <Field label="Email address" name="email" type="email" autoComplete="email" defaultValue={defaultEmail} error={fe.email} required />
              <Field label="Phone number (optional)" name="phone" type="tel" autoComplete="tel" error={fe.phone} hint="Only used if we need to contact you about delivery." />
            </div>
          </Panel>

          <Panel step="02" title="Delivery address">
            <AddressFields prefix="shipping" errors={fe} shipsTo={shipsTo} autoSection="shipping" />
          </Panel>

          <Panel step="03" title="Billing address">
            <label className="flex items-center gap-3 text-sm text-silver">
              <input type="checkbox" name="billingSame" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="h-4 w-4 accent-[#dcc7a1]" />
              Same as delivery address
            </label>
            <AnimatePresence initial={false}>
              {!billingSame && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-5">
                    <AddressFields prefix="billing" errors={fe} shipsTo={shipsTo} autoSection="billing" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          <Panel step="04" title="Delivery method">
            <fieldset className="space-y-2">
              <legend className="sr-only">Choose a delivery method</legend>
              {quote?.deliveryOptions.map((o) => (
                <label key={o.id} className={cn('flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-colors', chosenDelivery === o.id ? 'border-champagne/50 bg-champagne/[0.05]' : 'border-white/10 hover:border-white/20')}>
                  <span className="flex items-start gap-3">
                    <input type="radio" name="deliveryOptionId" value={o.id} checked={chosenDelivery === o.id} onChange={() => setDelivery(o.id)} className="mt-1 h-4 w-4 accent-[#dcc7a1]" />
                    <span>
                      <span className="block text-sm text-paper">{o.name}</span>
                      <span className="block text-xs text-titanium">{o.description}</span>
                    </span>
                  </span>
                  <span className="text-sm text-paper">{o.effectivePricePence === 0 ? 'Free' : formatPrice(o.effectivePricePence)}</span>
                </label>
              )) ?? <div className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />}
            </fieldset>
          </Panel>

          <Panel step="05" title="Payment">
            <div className="flex items-start gap-3 text-sm text-silver">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-champagne" />
              {paymentMode === 'demo' ? (
                <p>Demo mode: your order will be confirmed without payment so the full journey can be tested.</p>
              ) : paymentMode === 'unavailable' ? (
                <p className="text-warning">Online payments are awaiting configuration. Please contact us to order.</p>
              ) : (
                <p>After reviewing your order you will be taken to Stripe’s secure payment page. Pens Outlet never sees or stores your card details.</p>
              )}
            </div>
            <div className="mt-5">
              <label htmlFor="notes" className="label">
                Order notes (optional)
              </label>
              <textarea id="notes" name="notes" rows={3} maxLength={1000} className="field" placeholder="Anything we should know about your order?" />
            </div>
            <div className="mt-5 space-y-3">
              <label className="flex items-start gap-3 text-sm text-silver">
                <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 shrink-0 accent-[#dcc7a1]" aria-invalid={!!fe.acceptTerms} required />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="underline hover:text-paper">
                    terms &amp; conditions
                  </Link>{' '}
                  and have read the{' '}
                  <Link href="/privacy" target="_blank" className="underline hover:text-paper">
                    privacy policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/returns" target="_blank" className="underline hover:text-paper">
                    returns policy
                  </Link>
                  .
                </span>
              </label>
              {fe.acceptTerms && <p className="text-xs text-danger">{fe.acceptTerms}</p>}
              <label className="flex items-start gap-3 text-sm text-titanium">
                <input type="checkbox" name="marketingOptIn" className="mt-0.5 h-4 w-4 shrink-0 accent-[#dcc7a1]" />
                <span>{consentText} (Optional — we’ll email you to confirm.)</span>
              </label>
            </div>
          </Panel>
        </div>

        <aside className="glass-strong glass-edge h-fit space-y-6 rounded-[28px] p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="text-sm uppercase tracking-[0.22em] text-paper">Order summary</h2>
          <SummaryLines quote={quote} />
          <DiscountField quote={quote} error={fe.discountCode} />
          <Totals quote={quote} loading={loading} />
          <div id="checkout-error" aria-live="assertive">
            {state.status === 'error' && <p className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{state.message}</p>}
          </div>
          <button
            type="submit"
            disabled={pending || paymentMode === 'unavailable' || !quote || quote.itemCount === 0}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-paper text-[12px] font-medium uppercase tracking-[0.18em] text-ink shadow-[0_14px_50px_-12px_rgba(220,199,161,0.7)] transition-colors hover:bg-white disabled:opacity-50"
            data-testid="place-order"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {paymentMode === 'demo' ? 'Place demo order' : `Pay ${quote ? formatPrice(quote.totalPence) : ''} securely`}
          </button>
          <p className="flex items-center justify-center gap-2 text-center text-[11px] text-titanium">
            <ShieldCheck className="h-3.5 w-3.5" /> Card details are handled by Stripe and never stored by Pens Outlet.
          </p>
        </aside>
      </form>

      <AnimatePresence>
        {pending && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-champagne" />
              <p className="text-sm uppercase tracking-[0.24em] text-paper">Securing your order…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Panel({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="glass glass-edge rounded-[28px] p-6 sm:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-paper">
        <span className="font-mono text-xs text-champagne">{step}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, name, error, hint, className, ...rest }: React.ComponentProps<'input'> & { label: string; name: string; error?: string; hint?: string }) {
  const id = `f-${name.replace('.', '-')}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} name={name} className="field" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...rest} />
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-titanium">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function AddressFields({ prefix, errors, shipsTo, autoSection }: { prefix: string; errors: Record<string, string>; shipsTo: string[]; autoSection: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2" label="Address line 1" name={`${prefix}.line1`} autoComplete={`section-${autoSection} address-line1`} error={errors[`${prefix}.line1`]} required />
      <Field className="sm:col-span-2" label="Address line 2 (optional)" name={`${prefix}.line2`} autoComplete={`section-${autoSection} address-line2`} />
      <Field label="Town / city" name={`${prefix}.city`} autoComplete={`section-${autoSection} address-level2`} error={errors[`${prefix}.city`]} required />
      <Field label="County (optional)" name={`${prefix}.county`} autoComplete={`section-${autoSection} address-level1`} />
      <Field label="Postcode" name={`${prefix}.postcode`} autoComplete={`section-${autoSection} postal-code`} error={errors[`${prefix}.postcode`]} required className="uppercase" />
      <div>
        <label htmlFor={`f-${prefix}-country`} className="label">
          Country
        </label>
        <select id={`f-${prefix}-country`} name={`${prefix}.country`} className="field" defaultValue="United Kingdom">
          {shipsTo.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
