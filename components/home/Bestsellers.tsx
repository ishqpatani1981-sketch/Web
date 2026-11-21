'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import type { ProductView } from '@/lib/catalog';
import { ProductCard } from '@/components/product/ProductCard';
import { buttonClasses } from '@/components/ui/Button';
import { SplitReveal } from '@/components/motion/Motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Bestsellers: on desktop the section pins and the product rail travels horizontally as
 * the visitor scrolls vertically. On touch devices / reduced motion it is a native,
 * swipeable scroll-snap rail.
 */
export function Bestsellers({ products }: { products: ProductView[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const el = track.current;
      if (!el || !section.current) return;
      const distance = () => Math.max(0, el.scrollWidth - window.innerWidth + 64);
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      // Cards gently counter-rotate while travelling, like objects on a turntable.
      const cards = gsap.utils.toArray<HTMLElement>('[data-rail-card]', el);
      cards.forEach((card) => {
        gsap.fromTo(card, { rotateY: -8, opacity: 0.55 }, { rotateY: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 55%', scrub: true } });
      });
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, [products.length]);

  if (!products.length) return null;

  return (
    <section ref={section} className="relative overflow-hidden lg:flex lg:h-screen lg:items-center" data-bg="#0a0b0e" aria-labelledby="bestsellers-heading">
      <div ref={track} className="rail flex gap-5 overflow-x-auto px-5 py-24 sm:px-8 lg:gap-7 lg:overflow-visible lg:py-0 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]" style={{ perspective: 1400 }}>
        <div className="flex w-[78vw] shrink-0 flex-col justify-center pr-6 sm:w-[24rem] lg:w-[26rem]">
          <p className="eyebrow mb-4">Bestselling pens</p>
          <h2 id="bestsellers-heading" className="display text-[clamp(2.4rem,4.6vw,4.2rem)] text-paper">
            <SplitReveal text="Most" />
            <br />
            <SplitReveal text="signed for." wordClassName="font-serif normal-case italic text-champagne" delay={0.1} />
          </h2>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-titanium">The pens our customers reach for again and again. Scroll to browse the line-up.</p>
          <Link href="/bestsellers" className={buttonClasses('outline', 'md', 'mt-8 self-start')}>
            Shop bestsellers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {products.map((p, i) => (
          <div key={p.id} data-rail-card className="w-[72vw] shrink-0 sm:w-[19rem] lg:w-[21rem]" style={{ transformStyle: 'preserve-3d' }}>
            <ProductCard product={p} priority={i < 2} sizes="(min-width:1024px) 21rem, 72vw" />
          </div>
        ))}
        <Link
          href="/bestsellers"
          className="glass glass-edge group flex w-[72vw] shrink-0 flex-col items-center justify-center rounded-[26px] p-8 text-center sm:w-[19rem] lg:w-[21rem]"
          data-cursor-label="All"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-champagne/40 text-champagne transition-transform duration-500 group-hover:translate-x-1">
            <ArrowRight className="h-6 w-6" />
          </span>
          <span className="mt-6 text-xl font-light uppercase tracking-tight text-paper">View all bestsellers</span>
        </Link>
        <div className="w-4 shrink-0 lg:w-24" aria-hidden="true" />
      </div>
    </section>
  );
}
