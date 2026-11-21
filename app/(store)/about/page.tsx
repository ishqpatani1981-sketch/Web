import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import { PageHeader, PlaceholderNotice } from '@/components/ui/PageHeader';
import { RichText } from '@/components/content/PolicyPage';
import { LinkButton } from '@/components/ui/Button';
import { Reveal } from '@/components/motion/Motion';

export const metadata: Metadata = { title: 'About Pens Outlet', description: 'Pens Outlet — autograph pens, collectable pens and luxury writing instruments.', alternates: { canonical: '/about' } };

export default async function AboutPage() {
  const s = await getSettings();
  const b = s.business;
  return (
    <>
      <PageHeader eyebrow="About us" title="About" accent="Pens Outlet." description="The online home for autograph pens, collectable pens and luxury writing instruments." />
      <div className="mx-auto max-w-3xl space-y-10 px-5 sm:px-8">
        {s.policies.about.trim() ? (
          <RichText text={s.policies.about} />
        ) : (
          <PlaceholderNotice>
            <strong>OWNER TO CONFIRM.</strong> The About Us story will be written with the owner — who runs Pens Outlet, what makes the range special, and the relationship with {b.originalStoreName}. Edit in Admin → Content.
          </PlaceholderNotice>
        )}
        <Reveal>
          <div className="glass glass-edge flex flex-col items-start gap-5 rounded-[28px] p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Our original store</p>
              <p className="mt-2 text-xl text-paper">{b.originalStoreName}</p>
              <p className="mt-1 text-sm text-titanium">Explore our original online shop.</p>
            </div>
            <LinkButton href={b.originalStoreUrl} variant="outline">
              Visit {b.originalStoreUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} <ArrowUpRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </Reveal>
      </div>
    </>
  );
}
