'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string };

export function ShopFilters({ collections, penTypes, showCollections = true, total }: { collections: Option[]; penTypes: Option[]; showCollections?: boolean; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);

  const urlQ = params.get('q') ?? '';
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (prevUrlQ !== urlQ) {
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) update({ q: q || null });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = ['category', 'type', 'instock', 'min', 'max', 'q'].filter((k) => params.get(k)).length;

  return (
    <div className="sticky top-[86px] z-30 mb-10">
      <div className="glass-strong glass-edge flex flex-wrap items-center gap-3 rounded-[24px] p-3">
        <label className="relative flex min-w-[200px] flex-1 items-center">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-titanium" />
          <span className="sr-only">Search products</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pens…" className="field h-11 rounded-full pl-11" />
        </label>
        <select className="field h-11 w-auto rounded-full py-0" value={params.get('sort') ?? 'featured'} onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })} aria-label="Sort by">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="discount">Biggest saving</option>
          <option value="name">Name A–Z</option>
        </select>
        <button type="button" onClick={() => setOpen((o) => !o)} className={cn('flex h-11 items-center gap-2 rounded-full border px-4 text-xs uppercase tracking-[0.16em]', open || active ? 'border-champagne/40 text-champagne' : 'border-white/10 text-silver')} aria-expanded={open} aria-controls="filter-panel">
          <SlidersHorizontal className="h-4 w-4" /> Filters {active > 0 && `(${active})`}
        </button>
        <span className="ml-auto flex items-center gap-2 px-2 text-xs text-titanium" aria-live="polite">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {total} {total === 1 ? 'pen' : 'pens'}
        </span>
      </div>

      {open && (
        <div id="filter-panel" className="glass-strong glass-edge mt-2 grid gap-5 rounded-[24px] p-5 sm:grid-cols-2 lg:grid-cols-4">
          {showCollections && (
            <div>
              <p className="label">Collection</p>
              <select className="field" value={params.get('category') ?? ''} onChange={(e) => update({ category: e.target.value || null })}>
                <option value="">All collections</option>
                {collections.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <p className="label">Pen type</p>
            <select className="field" value={params.get('type') ?? ''} onChange={(e) => update({ type: e.target.value || null })}>
              <option value="">All types</option>
              {penTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="label">Price (£)</p>
            <div className="flex items-center gap-2">
              <input type="number" min={0} inputMode="decimal" placeholder="Min" defaultValue={params.get('min') ?? ''} onBlur={(e) => update({ min: e.target.value || null })} className="field" aria-label="Minimum price" />
              <span className="text-titanium">–</span>
              <input type="number" min={0} inputMode="decimal" placeholder="Max" defaultValue={params.get('max') ?? ''} onBlur={(e) => update({ max: e.target.value || null })} className="field" aria-label="Maximum price" />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3">
            <label className="flex items-center gap-3 text-sm text-silver">
              <input type="checkbox" className="h-4 w-4 accent-[#dcc7a1]" checked={params.get('instock') === '1'} onChange={(e) => update({ instock: e.target.checked ? '1' : null })} />
              Available to buy now
            </label>
            {active > 0 && (
              <button type="button" onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))} className="flex items-center gap-1 self-start text-xs uppercase tracking-[0.16em] text-champagne">
                <X className="h-3.5 w-3.5" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
