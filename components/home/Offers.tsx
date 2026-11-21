import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ProductView } from '@/lib/catalog';
import type { Promotion } from '@/lib/db/schema';
import type { Settings } from '@/lib/settings/defaults';
import { ProductCard } from '@/components/product/ProductCard';
import { PenArt } from '@/components/product/PenArt';
import { Reveal, SplitReveal, Magnetic } from '@/components/motion/Motion';
import { Badge, buttonClasses } from '@/components/ui/Button';
import { safeHref } from '@/lib/utils';
import { Countdown } from './Countdown';
import { isFuture } from '@/lib/time';

export function Offers({ settings, promotions, products }: { settings: Settings['offers']; promotions: Promotion[]; products: ProductView[] }) {
  const [first, ...rest] = settings.headline.split('.').map((s) => s.trim()).filter(Boolean);
  return (
    <section id="offers" className="relative overflow-hidden py-28 md:py-40" data-bg="#0c0a07" aria-labelledby="offers-heading">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_20%_10%,rgba(220,199,161,0.12),transparent_70%),radial-gradient(40%_40%_at_90%_80%,rgba(220,199,161,0.07),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <p className="eyebrow mb-5 flex items-center gap-2 text-champagne/80">
            <Sparkles className="h-3.5 w-3.5" /> {settings.eyebrow}
          </p>
        </Reveal>
        <h2 id="offers-heading" className="display text-[clamp(2.6rem,7.4vw,7rem)] text-paper">
          <SplitReveal text={`${first ?? ''}.`} className="text-metal" wordClassName="text-metal" />
          <br />
          <SplitReveal text={rest.length ? `${rest.join('. ')}.` : ''} wordClassName="text-champagne" delay={0.2} />
        </h2>
        <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal delay={0.1}>
            <p className="max-w-md text-[15px] leading-relaxed text-silver/85">{settings.body}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <Magnetic>
              <Link href={safeHref(settings.cta.href, '/offers')} className={buttonClasses('primary', 'lg')}>
                {settings.cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </Reveal>
        </div>

        {promotions.length > 0 && (
          <div className="mt-16 grid gap-5 md:grid-cols-2">
            {promotions.map((p, i) => {
              const countdownLive = p.countdownEnabled && isFuture(p.endsAt);
              return (
                <Reveal key={p.id} delay={i * 0.1}>
                  <article className="glass glass-edge group relative flex min-h-[280px] overflow-hidden rounded-[30px] p-7 sm:p-9">
                    <div className="pointer-events-none absolute -right-10 -top-6 h-[120%] w-1/2 opacity-80 transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:-translate-x-3 group-hover:rotate-2">
                      <PenArt colour={i % 2 ? 'Obsidian rose' : 'Champagne Gold'} penType={i % 2 ? 'rollerball' : 'fountain'} angle={-62} stage={false} className="h-full w-full" title="" />
                    </div>
                    <div className="relative flex max-w-[62%] flex-col">
                      <div className="flex flex-wrap gap-2">
                        {p.badge && <Badge tone="gold">{p.badge}</Badge>}
                        {p.isPlaceholder && <Badge tone="demo">Placeholder</Badge>}
                      </div>
                      <h3 className="mt-5 text-3xl font-light uppercase tracking-tight text-paper">{p.title}</h3>
                      {p.subtitle && <p className="mt-3 text-sm leading-relaxed text-silver/80">{p.subtitle}</p>}
                      {countdownLive && <Countdown endsAt={p.endsAt!.toISOString()} />}
                      {p.ctaLabel && (
                        <Link href={safeHref(p.ctaHref, '/offers')} className="mt-auto inline-flex items-center gap-2 pt-6 text-[11px] uppercase tracking-[0.22em] text-champagne">
                          {p.ctaLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      )}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-16 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
