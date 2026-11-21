import type { ReactNode } from 'react';
import { SplitReveal, Reveal } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';

export function PageHeader({ eyebrow, title, accent, description, children, className }: { eyebrow?: string; title: string; accent?: string; description?: string | null; children?: ReactNode; className?: string }) {
  return (
    <header className={cn('relative overflow-hidden px-5 pb-12 pt-40 sm:px-8 md:pb-16 md:pt-48', className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_70%_0%,rgba(255,255,255,0.07),transparent_70%),radial-gradient(40%_60%_at_10%_20%,rgba(220,199,161,0.06),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl">
        {eyebrow && (
          <Reveal>
            <p className="eyebrow mb-5">{eyebrow}</p>
          </Reveal>
        )}
        <h1 className="display text-[clamp(2.6rem,6.6vw,6rem)] text-paper">
          <SplitReveal text={title} immediate className="text-metal" wordClassName="text-metal" />
          {accent && (
            <>
              {' '}
              <SplitReveal text={accent} immediate delay={0.2} wordClassName="font-serif normal-case italic tracking-[-0.01em] text-champagne" />
            </>
          )}
        </h1>
        {description && (
          <Reveal delay={0.25}>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-silver/85">{description}</p>
          </Reveal>
        )}
        {children}
      </div>
    </header>
  );
}

export function PlaceholderNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/[0.06] px-4 py-3 text-sm text-warning/90', className)} role="note">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
