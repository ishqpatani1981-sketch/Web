import { requirePermission } from '@/lib/auth/session';
import { getSettings, SETTINGS_DEFAULTS } from '@/lib/settings';
import { PageTitle } from '@/components/admin/ui';
import { SettingsEditor } from '@/components/admin/SettingsEditor';

export const metadata = { title: 'Website content' };

const SECTIONS = [
  { key: 'hero', title: 'Homepage hero', description: 'Headline, supporting copy and the two hero buttons.' },
  { key: 'announcement', title: 'Announcement bar', description: 'Thin message bar at the very top of every page.' },
  { key: 'offers', title: 'Special offers section', description: 'Headline and copy. Promotions and countdowns are managed in Promotions & codes.' },
  { key: 'showcase', title: 'Featured showcase', description: 'The cinematic 3D pen section. Optionally link a featured product by its URL slug.' },
  { key: 'why', title: 'Why Pens Outlet', description: 'Trust panels. Only enable claims the owner has confirmed.' },
  { key: 'newsletter', title: 'Newsletter section', description: 'Headline, copy and the marketing consent wording (stored with each subscriber).' },
  { key: 'finalCta', title: 'Closing call to action' },
  { key: 'business', title: 'Business & contact details', description: 'Used in the footer, contact page, emails and structured data.' },
  { key: 'social', title: 'Social media links', description: 'Full https:// links. Empty links are hidden.' },
  { key: 'delivery', title: 'Delivery options & prices', description: 'Options and charges offered at checkout.' },
  { key: 'policies', title: 'Policies & long-form pages', description: 'Delivery, returns, privacy, cookies, terms, about and story pages.' },
  { key: 'faq', title: 'FAQs' },
  { key: 'seo', title: 'Search engine defaults' },
  { key: 'analytics', title: 'Analytics & tracking IDs', description: 'Loaded only after visitors consent. Leave blank to disable.' },
  { key: 'payments', title: 'Payment icons', description: 'Only show once the owner confirms which methods Stripe accepts.' },
  { key: 'checkout', title: 'Checkout options' },
  { key: 'reviews', title: 'Customer reviews integration' },
] as const;

export default async function ContentPage() {
  await requirePermission('content:manage');
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Website content" description="Edit headlines, banners, contact details, delivery options and policy pages. Saved changes go live immediately." />
      <div className="space-y-3">
        {SECTIONS.map((s, i) => (
          <SettingsEditor
            key={s.key}
            sectionKey={s.key}
            title={s.title}
            description={'description' in s ? s.description : undefined}
            value={settings[s.key] as never}
            defaults={SETTINGS_DEFAULTS[s.key] as never}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </>
  );
}
