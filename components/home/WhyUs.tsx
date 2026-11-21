'use client';

import { motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, BadgePoundSterling, Gem, MessagesSquare, ShieldCheck, Truck, Gift, Award, type LucideIcon } from 'lucide-react';
import type { Settings } from '@/lib/settings/defaults';
import { SplitReveal } from '@/components/motion/Motion';

const ICONS: Record<string, LucideIcon> = {
  'badge-pound-sterling': BadgePoundSterling,
  gem: Gem,
  'shield-check': ShieldCheck,
  'messages-square': MessagesSquare,
  truck: Truck,
  'badge-check': BadgeCheck,
  gift: Gift,
  award: Award,
};

export function WhyUs({ why }: { why: Settings['why'] }) {
  const reduce = useReducedMotion();
  const items = why.items.filter((i) => i.enabled);
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-40" data-bg="#060709" aria-labelledby="why-heading">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow mb-5">{why.eyebrow}</p>
          <h2 id="why-heading" className="display text-[clamp(2.2rem,4.4vw,4rem)] text-paper">
            <SplitReveal text={why.headline} className="text-metal" wordClassName="text-metal" />
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Gem;
            return (
              <motion.article
                key={item.title}
                className="glass glass-edge relative overflow-hidden rounded-[26px] p-7"
                initial={reduce ? false : { opacity: 0, x: i % 2 ? 60 : -60, rotateY: i % 2 ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ duration: 1.1, delay: (i % 2) * 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformPerspective: 1200 }}
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-champagne/[0.06] blur-2xl" />
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-champagne">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg text-paper">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-titanium">{item.body}</p>
                {item.placeholder && <span className="mt-4 inline-block rounded-full bg-warning/10 px-2.5 py-1 text-[9.5px] uppercase tracking-[0.16em] text-warning/80">Owner to confirm</span>}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
