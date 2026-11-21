'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Loader2, Search, X } from 'lucide-react';
import { useUi } from '@/store/shop';
import { ProductImage } from '@/components/product/ProductImage';
import { cn, formatPrice } from '@/lib/utils';
import type { NavCollection } from './Navbar';

type Result = {
  products: { id: string; slug: string; name: string; pricePence: number | null; originalPricePence: number | null; imageUrl: string | null; colour: string | null; penType: string | null; categoryName: string | null; availabilityLabel: string; isPlaceholder: boolean }[];
  collections: { slug: string; name: string; productCount: number }[];
};

export function SearchOverlay({ collections }: { collections: NavCollection[] }) {
  const { searchOpen, setSearchOpen } = useUi();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category) params.set('category', category);
        const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal });
        if (res.ok) {
          setData(await res.json());
          setActive(0);
        }
      } catch {
        /* aborted */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 140);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, category, searchOpen]);

  const results = useMemo(() => data?.products ?? [], [data]);
  const close = () => setSearchOpen(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length, a + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[active];
      close();
      if (target && active < results.length) router.push(`/products/${target.slug}`);
      else router.push(`/shop?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}) })}`);
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[9vh] sm:px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Search products">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={close} />
          <motion.div
            initial={{ y: -16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong glass-edge relative w-full max-w-2xl overflow-hidden rounded-[28px]"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Search className="h-5 w-5 text-titanium" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search pens, colours, collections…"
                className="flex-1 bg-transparent text-lg text-paper outline-none placeholder:text-titanium/70"
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-titanium" />}
              <button onClick={close} className="rounded-full p-1.5 text-titanium hover:bg-white/10 hover:text-paper" aria-label="Close search">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto px-5 py-3 rail" role="group" aria-label="Filter by collection">
              <Chip active={!category} onClick={() => setCategory('')}>
                All
              </Chip>
              {collections.map((c) => (
                <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
                  {c.name}
                </Chip>
              ))}
            </div>
            <div id="search-results" role="listbox" className="max-h-[56vh] overflow-y-auto px-3 pb-3">
              {!q && !category && <p className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.2em] text-titanium">Popular right now</p>}
              {results.length === 0 && !loading && (
                <p className="px-3 py-10 text-center text-sm text-titanium">No pens match “{q}”. Try a colour, pen type or collection.</p>
              )}
              {results.map((p, i) => (
                <Link
                  key={p.id}
                  id={`sr-${p.id}`}
                  role="option"
                  aria-selected={active === i}
                  href={`/products/${p.slug}`}
                  onClick={close}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex items-center gap-4 rounded-2xl p-2.5 transition-colors', active === i ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]')}
                >
                  <ProductImage src={p.imageUrl} alt={p.name} colour={p.colour} name={p.name} penType={p.penType} className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.03]" sizes="64px" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-paper">{p.name}</p>
                    <p className="truncate text-xs text-titanium">
                      {p.categoryName ?? 'Pens'} · {p.availabilityLabel}
                      {p.isPlaceholder && ' · Demo'}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-paper">{formatPrice(p.pricePence)}</span>
                    {p.originalPricePence && <span className="ml-2 text-xs text-titanium line-through">{formatPrice(p.originalPricePence)}</span>}
                  </div>
                </Link>
              ))}
              {(q || category) && (
                <Link
                  href={`/shop?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}) })}`}
                  onClick={close}
                  className={cn('mt-1 flex items-center justify-between rounded-2xl px-4 py-3 text-xs uppercase tracking-[0.2em] text-champagne', active === results.length ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]')}
                >
                  See all results <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="hidden items-center justify-between border-t border-white/10 px-5 py-2.5 text-[11px] text-titanium sm:flex">
              <span>↑ ↓ to navigate · Enter to open</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors', active ? 'border-champagne/50 bg-champagne/10 text-champagne' : 'border-white/10 text-silver hover:border-white/25')}
    >
      {children}
    </button>
  );
}
