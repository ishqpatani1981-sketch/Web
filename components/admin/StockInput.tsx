'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { quickUpdateProduct } from '@/actions/admin/products';

/** Inline stock editor for the product list (blank = not tracked). */
export function StockInput({ id, value }: { id: string; value: number | null }) {
  const [v, setV] = useState(value === null ? '' : String(value));
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const dirty = v !== (value === null ? '' : String(value));
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set('id', id);
        fd.set('op', 'stock');
        fd.set('value', v);
        start(async () => {
          await quickUpdateProduct(fd);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        });
      }}
    >
      <input value={v} onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="—" aria-label="Stock quantity" className="h-8 w-16 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-sm text-paper tabular-nums outline-none focus:border-champagne/60" />
      {(dirty || pending || saved) && (
        <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-paper" aria-label="Save stock">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
      )}
    </form>
  );
}
