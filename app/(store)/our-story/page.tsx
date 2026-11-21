import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { PageHeader, PlaceholderNotice } from '@/components/ui/PageHeader';
import { RichText } from '@/components/content/PolicyPage';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Our story', alternates: { canonical: '/our-story' } };

export default async function StoryPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Our story" title="Every signature" accent="tells a story." />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {s.policies.story.trim() ? (
          <RichText text={s.policies.story} />
        ) : (
          <PlaceholderNotice>
            <strong>OWNER TO CONFIRM.</strong> Our Story has not been written yet. It will be added after the owner meeting — how the business started, its history with {s.business.originalStoreName}, and what customers can expect.
          </PlaceholderNotice>
        )}
        <div className="mt-10 flex gap-3">
          <LinkButton href="/collections">Explore the collection</LinkButton>
          <LinkButton href={s.business.originalStoreUrl} variant="glass">
            Our original store
          </LinkButton>
        </div>
      </div>
    </>
  );
}
