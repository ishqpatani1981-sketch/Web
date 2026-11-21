'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades and lifts children into view once. */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'section' | 'p' }) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

const wordVariants: Variants = {
  hidden: { y: '110%' },
  show: ({ i, d }: { i: number; d: number }) => ({ y: '0%', transition: { duration: 1.05, delay: d + i * 0.06, ease: EASE } }),
};

/** Headline that reveals word by word from behind a mask. */
export function SplitReveal({ text, className, wordClassName, delay = 0, immediate = false }: { text: string; className?: string; wordClassName?: string; delay?: number; immediate?: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <motion.span
      className={cn('inline', className)}
      initial={reduce ? false : 'hidden'}
      {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } })}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span className={cn('inline-block', wordClassName)} variants={wordVariants} custom={{ i, d: delay }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Subtle magnetic pull towards the pointer for premium CTAs (fine pointers only). */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Smoothly transitions the page background colour as sections marked with
 * `data-bg="#hex"` scroll into view.
 */
export function BackgroundTransitions({ fallback = '#050506' }: { fallback?: string }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-bg]'));
    const triggers = sections.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) gsap.to(document.body, { backgroundColor: el.dataset.bg, duration: reduce ? 0 : 1.1, ease: 'power2.out', overwrite: true });
        },
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      gsap.to(document.body, { backgroundColor: fallback, duration: 0 });
    };
  }, [fallback]);
  return null;
}

/** Scrubbed scale/zoom of imagery as it passes through the viewport. */
export function ScrollZoom({ children, className, from = 1.18, to = 1 }: { children: ReactNode; className?: string; from?: number; to?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(ref.current, { scale: from }, { scale: to, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [from, to]);
  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
