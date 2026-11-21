'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProductView } from '@/lib/catalog';
import { ProductCard } from '@/components/product/ProductCard';
import { SplitReveal } from '@/components/motion/Motion';

export function NewArrivals({ products, title = 'New arrivals', eyebrow = 'Just landed', href = '/new-arrivals' }: { products: ProductView[]; title?: string; eyebrow?: string; href?: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 1);
      setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 20) * 2, behavior: 'smooth' });
  };

  if (!products.length) return null;
  return (
    <section className="relative py-28 md:py-36" data-bg="#08090b" aria-labelledby="arrivals-heading">
      <div className="mx-auto mb-12 flex max-w-7xl items-end justify-between gap-6 px-5 sm:px-8">
        <div>
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 id="arrivals-heading" className="display text-[clamp(2.2rem,4.6vw,4.2rem)] text-paper">
            <SplitReveal text={title} className="text-metal" wordClassName="text-metal" />
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} disabled={edges.start} className="glass flex h-12 w-12 items-center justify-center rounded-full disabled:opacity-30" aria-label="Previous products">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll(1)} disabled={edges.end} className="glass flex h-12 w-12 items-center justify-center rounded-full disabled:opacity-30" aria-label="Next products">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={rail} className="rail flex gap-5 overflow-x-auto scroll-smooth px-5 pb-4 sm:px-8 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]" tabIndex={0} aria-label={`${title} carousel`}>
        {products.map((p) => (
          <div key={p.id} data-card className="w-[72vw] shrink-0 sm:w-[19rem] lg:w-[20rem]">
            <ProductCard product={p} sizes="(min-width:1024px) 20rem, 72vw" />
          </div>
        ))}
        <div className="w-4 shrink-0" aria-hidden="true" />
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl items-center gap-6 px-5 sm:px-8">
        <div className="h-px flex-1 overflow-hidden bg-white/10">
          <div className="h-full bg-gradient-to-r from-gold-deep to-champagne transition-[width] duration-300" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <Link href={href} className="text-[11px] uppercase tracking-[0.22em] text-champagne hover:text-paper">
          View all
        </Link>
      </div>
    </section>
  );
}
