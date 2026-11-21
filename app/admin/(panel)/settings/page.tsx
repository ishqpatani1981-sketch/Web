import { requirePermission } from '@/lib/auth/session';
import { getSettings, SETTINGS_DEFAULTS } from '@/lib/settings';
import { integrationStatus, emailConfig, marketingConfig, stripeConfig } from '@/lib/config';
import { Card, PageTitle } from '@/components/admin/ui';
import { SettingsEditor } from '@/components/admin/SettingsEditor';
import { TestEmailForm } from '@/components/admin/TestEmailForm';
import { CheckCircle2, CircleDashed } from 'lucide-react';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requirePermission('settings:manage');
  const settings = await getSettings();
  const status = integrationStatus();
  const email = emailConfig();
  const marketing = marketingConfig();
  const stripe = stripeConfig();
  return (
    <>
      <PageTitle title="Settings" description="Integrations, email notifications and marketing connections. API keys are set as environment variables on the hosting platform — never here." />
      <Card title="Integration status">
        <ul className="divide-y divide-white/[0.06]">
          {status.map((s) => (
            <li key={s.id} className="flex items-start gap-3 py-3 text-sm">
              {s.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}
              <span>
                <span className="text-paper">{s.name}</span>
                <span className="block text-xs text-titanium">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-titanium">
          Transactional provider requested: <code>{email.requested}</code> · Marketing provider requested: <code>{marketing.requested}</code> · Stripe: <code>{stripe.mode}</code>. See <code>.env.example</code> and docs/CONFIGURATION.md for each variable.
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        <SettingsEditor
          sectionKey="notifications"
          title="Email notifications"
          description="Who receives owner alerts, and which customer emails are sent."
          value={settings.notifications as never}
          defaults={SETTINGS_DEFAULTS.notifications as never}
          defaultOpen
        />
      </div>

      <Card title="Send a test email" className="mt-6">
        <TestEmailForm />
      </Card>
    </>
  );
}
