'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { PEN_LABELS, type PenState } from '@/components/three/PenModel';
import { buttonClasses } from '@/components/ui/Button';
import { Magnetic } from '@/components/motion/Motion';
import { PenArt } from '@/components/product/PenArt';
import { safeHref } from '@/lib/utils';
import { useMediaQuery, useWebgl } from '@/lib/client-env';
import type { Settings } from '@/lib/settings/defaults';

gsap.registerPlugin(ScrollTrigger);

const ShowcaseScene = dynamic(() => import('@/components/three/ShowcaseScene'), { ssr: false });

/**
 * "Luxury watch advert" moment: the section pins while a single pen rotates, separates
 * into its components (with anatomy labels) and reassembles as the headline plays out.
 */
export function Showcase({ showcase }: { showcase: Settings['showcase'] }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const state = useRef<PenState>({ capOff: 0, explode: 0 });
  const spin = useRef(0);
  const labelEls = useRef<Record<string, HTMLElement | null>>({});
  const reduce = useReducedMotion() ?? false;
  const webgl = useWebgl();
  const mobile = useMediaQuery('(max-width: 767px)');
  const env = { webgl, mobile };
  const [mount, setMount] = useState(false);

  useEffect(() => {
    // Mount the 3D scene only when the visitor approaches this section.
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMount(true), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!section.current) return;
    if (reduce) {
      state.current.explode = 1;
      stage.current?.setAttribute('data-labels', 'on');
      return;
    }
    const ctx = gsap.context(() => {
      const proxy = { explode: 0, spin: 0 };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        onUpdate: () => {
          state.current.explode = proxy.explode;
          spin.current = proxy.spin;
          stage.current?.setAttribute('data-labels', proxy.explode > 0.82 ? 'on' : 'off');
        },
      });
      tl.fromTo('[data-sc="one"]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.12 }, 0)
        .to(proxy, { spin: 0.25, duration: 1, ease: 'none' }, 0)
        .to(proxy, { explode: 1, duration: 0.3, ease: 'power2.inOut' }, 0.12)
        .to('[data-sc="one"]', { opacity: 0.25, duration: 0.1 }, 0.32)
        .fromTo('[data-sc="two"]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.12 }, 0.4)
        .to(proxy, { explode: 0, duration: 0.28, ease: 'power2.inOut' }, 0.62)
        .to('[data-sc="one"]', { opacity: 1, duration: 0.1 }, 0.8)
        .fromTo('[data-sc="cta"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12 }, 0.82);
    }, section);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={section} className={reduce ? 'relative' : 'relative h-[320vh] md:h-[360vh]'} data-bg="#030304" aria-labelledby="showcase-heading">
      <div ref={stage} className={reduce ? 'relative min-h-screen overflow-hidden' : 'sticky top-0 h-[100svh] overflow-hidden'} data-labels="off">
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_55%_55%,rgba(255,255,255,0.08),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
        <div className="absolute left-1/2 top-[58%] h-px w-[70vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-champagne/25 to-transparent" />

        {env?.webgl && mount ? (
          <>
            <ShowcaseScene state={state} spin={spin} mobile={env.mobile} reducedMotion={reduce} labelEls={labelEls} />
            <div className="pointer-events-none absolute inset-0 z-[5]" data-orient={env.mobile ? 'vertical' : 'horizontal'} aria-hidden="true">
              {PEN_LABELS.map((l) => (
                <span
                  key={l.key}
                  ref={(el) => {
                    labelEls.current[l.key] = el;
                  }}
                  className="pen-anchor"
                >
                  <span className={`pen-label ${l.below ? 'pen-label-below' : 'pen-label-above'}`}>{l.text}</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <PenArt colour="Burgundy" penType="fountain" angle={-90} className="h-[70vh] w-[56vh]" title="" />
          </div>
        )}

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-5 pb-16 pt-32 sm:px-8">
          <div>
            <p className="eyebrow mb-5">{showcase.eyebrow}</p>
            <h2 id="showcase-heading" className="display text-[clamp(2.3rem,6.2vw,6rem)]">
              <span data-sc="one" className="text-metal block">
                {showcase.headlineOne}
              </span>
              <span data-sc="two" className="mt-1 block font-serif normal-case italic tracking-[-0.01em] text-champagne">
                {showcase.headlineTwo}
              </span>
            </h2>
          </div>
          <div data-sc="cta" className="pointer-events-auto flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-sm text-sm leading-relaxed text-silver/85">{showcase.body}</p>
            <Magnetic>
              <Link href={safeHref(showcase.featuredProductSlug ? `/products/${showcase.featuredProductSlug}` : showcase.cta.href, '/shop')} className={buttonClasses('primary', 'lg')}>
                {showcase.cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
