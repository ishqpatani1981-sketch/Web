import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { CollectionView } from '@/lib/catalog';
import { Reveal, ScrollZoom, SplitReveal } from '@/components/motion/Motion';
import { PenArt } from '@/components/product/PenArt';
import { Badge } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const FALLBACK_COLOURS = ['Midnight Black', 'Burgundy', 'Titanium', 'Obsidian rose', 'Champagne Gold', 'Pearl White'];

export function CollectionVisual({ c, index, className, sizes }: { c: CollectionView; index: number; className?: string; sizes?: string }) {
  return c.imageUrl ? (
    <Image src={c.imageUrl} alt={c.imageAlt || c.name} fill sizes={sizes ?? '(min-width:1024px) 33vw, 100vw'} className={cn('object-cover', className)} unoptimized={!c.imageUrl.startsWith('/')} />
  ) : (
    <PenArt colour={FALLBACK_COLOURS[index % FALLBACK_COLOURS.length]} penType={index % 3 === 0 ? 'fountain' : index % 3 === 1 ? 'rollerball' : 'ballpoint'} className={cn('absolute inset-0 h-full w-full', className)} title={c.name} />
  );
}

export function FeaturedCollections({ collections }: { collections: CollectionView[] }) {
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 md:py-40" data-bg="#07080a" aria-labelledby="collections-heading">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Reveal>
            <p className="eyebrow mb-4">Featured collections</p>
          </Reveal>
          <h2 id="collections-heading" className="display max-w-2xl text-[clamp(2.2rem,5vw,4.4rem)] text-paper">
            <SplitReveal text="Curated for" />
            <br />
            <SplitReveal text="every signature." wordClassName="font-serif normal-case italic text-champagne" delay={0.15} />
          </h2>
        </div>
        <Reveal delay={0.2}>
          <Link href="/collections" className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-silver hover:text-paper">
            All collections <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </Link>
        </Reveal>
      </div>

      <div className="grid auto-rows-[minmax(300px,auto)] gap-4 md:grid-cols-3 md:gap-5">
        {collections.map((c, i) => (
          <Reveal key={c.id} delay={(i % 3) * 0.08} className={cn(i === 0 && 'md:row-span-2', (i === 3 || (i === 5 && collections.length === 6)) && 'md:col-span-2')}>
            <Link
              href={`/collections/${c.slug}`}
              className="group glass-edge relative flex h-full min-h-[320px] flex-col justify-end overflow-hidden rounded-[30px] ring-1 ring-white/[0.07]"
              data-cursor-label="Explore"
            >
              <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-graphite to-ink">
                <ScrollZoom className="absolute inset-0">
                  <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]">
                    <CollectionVisual c={c} index={i} />
                  </div>
                </ScrollZoom>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="sheen absolute inset-0" data-sheen="off" />
              <div className="relative p-6 sm:p-7">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge>{c.productCount} {c.productCount === 1 ? 'pen' : 'pens'}</Badge>
                  {c.isPlaceholder && <Badge tone="demo">Placeholder</Badge>}
                </div>
                <h3 className="text-2xl font-light uppercase tracking-tight text-paper sm:text-[1.7rem]">{c.name}</h3>
                {c.description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-silver/80">{c.description}</p>}
                <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-champagne">
                  Explore <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
