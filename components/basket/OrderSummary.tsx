'use client';

import { useState } from 'react';
import { Loader2, Tag, X } from 'lucide-react';
import { useBasket } from '@/store/shop';
import type { Quote } from '@/lib/pricing';
import { formatPrice } from '@/lib/utils';
import { ProductImage } from '@/components/product/ProductImage';

export function DiscountField({ quote, error }: { quote: Quote | null; error?: string }) {
  const code = useBasket((s) => s.discountCode);
  const setCode = useBasket((s) => s.setDiscountCode);
  const [draft, setDraft] = useState('');
  const [applying, setApplying] = useState(false);
  const applied = quote?.discount;
  const message = error || (code && quote?.discountError);

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-champagne/30 bg-champagne/[0.06] px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-champagne">
          <Tag className="h-4 w-4" /> {applied.code} applied
        </span>
        <button type="button" onClick={() => setCode('')} className="text-titanium hover:text-paper" aria-label="Remove discount code">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <div>
      <label htmlFor="discount" className="label">
        Discount code
      </label>
      <div className="flex gap-2">
        <input
          id="discount"
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (draft.trim()) {
                setApplying(true);
                setCode(draft);
                setTimeout(() => setApplying(false), 600);
              }
            }
          }}
          placeholder="Enter code"
          className="field h-11 uppercase"
          aria-invalid={!!message}
          aria-describedby="discount-msg"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            if (!draft.trim()) return;
            setApplying(true);
            setCode(draft);
            setTimeout(() => setApplying(false), 600);
          }}
          className="h-11 shrink-0 rounded-xl border border-white/15 px-4 text-[11px] uppercase tracking-[0.16em] text-paper hover:border-champagne/50"
        >
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      <p id="discount-msg" className="mt-1.5 min-h-4 text-xs text-danger" role="alert">
        {message || ''}
      </p>
    </div>
  );
}

export function Totals({ quote, loading }: { quote: Quote | null; loading: boolean }) {
  if (!quote) return <div className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />;
  return (
    <dl className="space-y-2.5 text-sm" aria-busy={loading}>
      <Row label="Subtotal" value={formatPrice(quote.subtotalPence)} />
      {quote.discount && quote.discount.amountPence > 0 && <Row label={`Discount (${quote.discount.code})`} value={`−${formatPrice(quote.discount.amountPence)}`} accent />}
      {quote.discount?.freeDelivery && <Row label={`Discount (${quote.discount.code})`} value="Free delivery" accent />}
      <Row
        label={quote.delivery ? `Delivery — ${quote.delivery.name}${quote.delivery.placeholder ? ' (placeholder rate)' : ''}` : 'Delivery'}
        value={quote.delivery ? (quote.delivery.pricePence === 0 ? 'Free' : formatPrice(quote.delivery.pricePence)) : '—'}
      />
      <div className="hairline !my-4" />
      <div className="flex items-baseline justify-between">
        <dt className="text-paper">Total</dt>
        <dd className="text-2xl font-light text-paper" data-testid="order-total">
          {loading ? <Loader2 className="inline h-4 w-4 animate-spin text-titanium" /> : formatPrice(quote.totalPence)}
        </dd>
      </div>
      <p className="text-[11px] text-titanium">All prices in GBP. VAT treatment to be confirmed by the owner.</p>
    </dl>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-titanium">{label}</dt>
      <dd className={accent ? 'text-champagne' : 'text-silver'}>{value}</dd>
    </div>
  );
}

export function SummaryLines({ quote }: { quote: Quote | null }) {
  const items = useBasket((s) => s.items);
  return (
    <ul className="space-y-3">
      {items.map((i) => {
        const line = quote?.lines.find((l) => l.productId === i.productId);
        return (
          <li key={i.productId} className="flex items-center gap-3">
            <span className="relative">
              <ProductImage src={i.imageUrl} alt={i.name} colour={i.colour} name={i.name} penType={i.penType} className="h-16 w-14 overflow-hidden rounded-xl bg-white/[0.03]" sizes="56px" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-steel px-1 text-[10px] text-paper">{i.quantity}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-paper">{i.name}</span>
              {line?.issue && <span className="block text-xs text-warning">{line.issue}</span>}
            </span>
            <span className="text-sm text-silver">{formatPrice(line?.lineTotalPence ?? (i.pricePence ?? 0) * i.quantity)}</span>
          </li>
        );
      })}
    </ul>
  );
}
