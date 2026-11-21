import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getCollections } from '@/lib/catalog';
import { PageHeader } from '@/components/ui/PageHeader';
import { CollectionVisual } from '@/components/home/Collections';
import { Reveal } from '@/components/motion/Motion';
import { Badge } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Collections', description: 'Explore Pens Outlet collections: autograph pens, collectable pens, luxury writing pens, limited editions and more.', alternates: { canonical: '/collections' } };

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <>
      <PageHeader eyebrow="Collections" title="Curated for" accent="every signature." description="Each collection is a starting point. Find the pen that suits the moment — or the collector." />
      <div className="mx-auto grid max-w-7xl gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {collections.map((c, i) => (
          <Reveal key={c.id} delay={(i % 3) * 0.08}>
            <Link href={`/collections/${c.slug}`} className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[30px] ring-1 ring-white/[0.07]" data-cursor-label="Explore">
              <div className="absolute inset-0 bg-gradient-to-b from-graphite to-ink transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-105">
                <CollectionVisual c={c} index={i} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="relative p-7">
                <div className="mb-3 flex gap-2">
                  <Badge>{c.productCount} {c.productCount === 1 ? 'pen' : 'pens'}</Badge>
                  {c.isPlaceholder && <Badge tone="demo">Placeholder</Badge>}
                </div>
                <h2 className="text-2xl font-light uppercase tracking-tight text-paper">{c.name}</h2>
                {c.description && <p className="mt-2 text-sm text-silver/80">{c.description}</p>}
                <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-champagne">
                  Explore <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
