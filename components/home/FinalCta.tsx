import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Flourish } from '@/components/brand/Logo';
import { PenArt } from '@/components/product/PenArt';
import { Magnetic, Reveal, SplitReveal } from '@/components/motion/Motion';
import { buttonClasses } from '@/components/ui/Button';
import { safeHref } from '@/lib/utils';
import type { Settings } from '@/lib/settings/defaults';

export function FinalCta({ cta }: { cta: Settings['finalCta'] }) {
  return (
    <section className="relative overflow-hidden px-5 py-36 text-center sm:px-8 md:py-52" data-bg="#050506" aria-labelledby="final-heading">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_50%_50%,rgba(220,199,161,0.1),transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[90vh] w-[72vh] -translate-x-1/2 -translate-y-1/2 animate-float opacity-[0.16] blur-[1px]" aria-hidden="true">
        <PenArt colour="Champagne Gold" penType="fountain" angle={-60} stage={false} className="h-full w-full" title="" />
      </div>
      <div className="relative mx-auto max-w-5xl">
        <h2 id="final-heading" className="display text-[clamp(2.8rem,8.6vw,8.4rem)] text-paper">
          <SplitReveal text={cta.headline} className="text-metal" wordClassName="text-metal" />
        </h2>
        <Reveal delay={0.3}>
          <Flourish className="mx-auto mt-4 w-72 max-w-[70vw]" gradientId="final-flourish" />
        </Reveal>
        <Reveal delay={0.45} className="mt-10">
          <Magnetic>
            <Link href={safeHref(cta.cta.href, '/shop')} className={buttonClasses('primary', 'lg')}>
              {cta.cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
