'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuantityStepper({ value, onChange, max = 10, min = 1, size = 'md', label = 'Quantity' }: { value: number; onChange: (v: number) => void; max?: number; min?: number; size?: 'sm' | 'md'; label?: string }) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  const w = size === 'sm' ? 'w-8' : 'w-10';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-white/12 bg-white/[0.03]', h)} role="group" aria-label={label}>
      <button type="button" className={cn('flex items-center justify-center rounded-full text-silver hover:text-paper disabled:opacity-30', h, w)} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={cn('w-8 bg-transparent text-center text-sm text-paper outline-none', size === 'sm' && 'w-6 text-xs')}
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.floor(n))));
        }}
      />
      <button type="button" className={cn('flex items-center justify-center rounded-full text-silver hover:text-paper disabled:opacity-30', h, w)} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
