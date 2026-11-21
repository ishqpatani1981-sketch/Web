'use client';

import { startTransition, useActionState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { trackOrder, type TrackState } from '@/actions/checkout';
import { Badge } from '@/components/ui/Button';
import { cn, formatDateTime } from '@/lib/utils';

const STEPS = [
  { key: 'pending', label: 'Order placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
];

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, { status: 'idle' });
  const r = state.result;
  const stepIndex = r ? Math.max(0, STEPS.findIndex((s) => s.key === r.status)) : -1;
  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
        className="glass glass-edge grid gap-4 rounded-[28px] p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        noValidate
      >
        <div>
          <label htmlFor="orderNumber" className="label">
            Order number
          </label>
          <input id="orderNumber" name="orderNumber" placeholder="PO-100001" className="field uppercase" required />
        </div>
        <div>
          <label htmlFor="trackEmail" className="label">
            Email address
          </label>
          <input id="trackEmail" name="email" type="email" autoComplete="email" className="field" required />
        </div>
        <button type="submit" disabled={pending} className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-paper px-6 text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Track
        </button>
        {state.status === 'error' && (
          <p className="text-sm text-danger sm:col-span-3" role="alert">
            {state.message}
          </p>
        )}
      </form>

      {r && (
        <div className="glass glass-edge rounded-[28px] p-6 sm:p-8" data-testid="track-result">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl text-paper">{r.orderNumber}</h2>
            <div className="flex gap-2">
              {r.isDemo && <Badge tone="demo">Demo order</Badge>}
              <span className="text-sm text-titanium">Placed {r.placedOn}</span>
            </div>
          </div>
          {r.status === 'cancelled' || r.status === 'refunded' ? (
            <p className="mt-6 text-warning">This order has been {r.status}.</p>
          ) : (
            <ol className="mt-8 grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => (
                <li key={s.key} className="flex flex-col items-center text-center">
                  {i <= stepIndex ? <CheckCircle2 className="h-6 w-6 text-champagne" /> : <Circle className="h-6 w-6 text-steel" />}
                  <span className={cn('mt-2 text-[11px] uppercase tracking-[0.14em]', i <= stepIndex ? 'text-paper' : 'text-titanium')}>{s.label}</span>
                </li>
              ))}
            </ol>
          )}
          {r.trackingNumber && (
            <p className="mt-6 text-sm text-silver">
              Tracking number:{' '}
              {r.trackingUrl ? (
                <a href={r.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-champagne underline">
                  {r.trackingNumber}
                </a>
              ) : (
                r.trackingNumber
              )}
              {r.deliveryMethod && <span className="text-titanium"> · {r.deliveryMethod}</span>}
            </p>
          )}
          <ul className="mt-6 space-y-1 text-sm text-silver">
            {r.items.map((i, idx) => (
              <li key={idx}>
                {i.name} × {i.quantity}
              </li>
            ))}
          </ul>
          <ol className="mt-6 space-y-2 border-l border-white/10 pl-5 text-sm">
            {r.events.map((e, i) => (
              <li key={i}>
                <span className="text-paper">{e.message}</span>
                <span className="block text-xs text-titanium">{formatDateTime(e.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
