'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { PenArt } from '@/components/product/PenArt';
import { FLOURISH_PATH } from '@/components/brand/Logo';
import { Magnetic, SplitReveal } from '@/components/motion/Motion';
import { buttonClasses } from '@/components/ui/Button';
import { safeHref } from '@/lib/utils';
import { useMediaQuery, useWebgl } from '@/lib/client-env';
import type { Settings } from '@/lib/settings/defaults';

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false });

export function Hero({ hero }: { hero: Settings['hero'] }) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const reduce = useReducedMotion() ?? false;
  const webgl = useWebgl();
  const mobile = useMediaQuery('(max-width: 767px)');
  const env = webgl ? { webgl, mobile } : null;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!section.current) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
      if (!reduce && copy.current) {
        gsap.to(copy.current, { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top top', end: '70% top', scrub: true } });
      }
    }, section);
    return () => ctx.revert();
  }, [reduce]);

  const showCanvas = env?.webgl;

  return (
    <section ref={section} className="relative h-[100svh] min-h-[640px] overflow-hidden" data-bg="#050506" aria-label="Introduction">
      {/* Cinematic studio backdrop */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_68%_42%,rgba(255,255,255,0.09),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_70%_70%,rgba(220,199,161,0.08),transparent_70%)]" />
        <div className="absolute -top-1/3 left-1/2 h-[140%] w-[38rem] -translate-x-1/4 rotate-[24deg] bg-gradient-to-b from-white/[0.06] via-white/[0.015] to-transparent blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
      </div>

      {/* Poster fallback (also shown while WebGL initialises) */}
      <motion.div
        className="absolute inset-0 flex items-start justify-center pt-[9vh] md:items-center md:justify-end md:pr-[6vw] md:pt-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: showCanvas && ready ? 0 : 1 }}
        transition={{ duration: 1.2 }}
        aria-hidden="true"
      >
        <div className="h-[56vh] w-[46vh] max-w-[90vw] md:h-[78vh] md:w-[62vh]">
          <PenArt colour="Midnight Black" penType="fountain" angle={-50} className="h-full w-full" title="Pens Outlet" />
        </div>
      </motion.div>

      {showCanvas && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 1.6, ease: 'easeOut' }}>
          <HeroScene progress={progress} reducedMotion={reduce} mobile={!!env?.mobile} onReady={() => setReady(true)} />
        </motion.div>
      )}

      {/* Copy */}
      <div ref={copy} className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-24 sm:px-8 md:pb-28">
        <motion.p className="eyebrow mb-5" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9 }}>
          {hero.eyebrow}
        </motion.p>
        <h1 className="display max-w-[46rem] text-[clamp(2.8rem,7.2vw,6.4rem)] text-paper">
          <SplitReveal text={hero.headlineLead} immediate delay={0.5} className="text-metal" wordClassName="text-metal" />
          <br />
          <span className="relative inline-block">
            <SplitReveal text={hero.headlineAccent} immediate delay={0.75} wordClassName="font-serif normal-case italic tracking-[-0.01em] text-champagne" />
            <svg viewBox="0 0 400 80" className="pointer-events-none absolute -bottom-[0.32em] left-0 w-[105%]" fill="none" aria-hidden="true">
              <motion.path
                d={FLOURISH_PATH}
                stroke="#dcc7a1"
                strokeOpacity={0.75}
                strokeWidth={2}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.35, duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
              />
            </svg>
          </span>
        </h1>
        <motion.p
          className="mt-9 max-w-md text-[15px] leading-relaxed text-silver/90 sm:text-base"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 1 }}
        >
          {hero.subheadline}
        </motion.p>
        <motion.div className="mt-9 flex flex-wrap items-center gap-3" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 1 }}>
          <Magnetic>
            <Link href={safeHref(hero.primaryCta.href, '/collections')} className={buttonClasses('primary', 'lg')} data-testid="hero-primary-cta">
              {hero.primaryCta.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href={safeHref(hero.secondaryCta.href, '/bestsellers')} className={buttonClasses('glass', 'lg')}>
              {hero.secondaryCta.label}
            </Link>
          </Magnetic>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div className="absolute bottom-7 right-6 z-10 hidden flex-col items-center gap-3 sm:flex md:right-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} aria-hidden="true">
        <span className="text-[10px] uppercase tracking-[0.3em] text-titanium [writing-mode:vertical-rl]">Scroll</span>
        <span className="relative flex h-10 w-6 justify-center rounded-full border border-white/20">
          <span className="mt-2 h-2 w-1 animate-scroll-dot rounded-full bg-champagne" />
        </span>
      </motion.div>
    </section>
  );
}
