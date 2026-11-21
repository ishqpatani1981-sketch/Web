/**
 * Central runtime configuration + integration status.
 * Secrets are only ever read on the server. Nothing in here is sent to the browser
 * except the explicit booleans exposed through `publicConfig()`.
 */

const env = (key: string) => {
  const v = process.env[key];
  return v && v.trim() !== '' ? v.trim() : undefined;
};

export function siteUrl() {
  const explicit = env('NEXT_PUBLIC_SITE_URL');
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = env('VERCEL_PROJECT_PRODUCTION_URL') ?? env('VERCEL_URL');
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

export function stripeConfig() {
  const secretKey = env('STRIPE_SECRET_KEY');
  const publishableKey = env('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  const webhookSecret = env('STRIPE_WEBHOOK_SECRET');
  const mode = secretKey?.startsWith('sk_live_') || secretKey?.startsWith('rk_live_') ? 'live' : secretKey ? 'test' : 'unconfigured';
  return { secretKey, publishableKey, webhookSecret, mode: mode as 'live' | 'test' | 'unconfigured', configured: !!secretKey };
}

/**
 * Demo payments let the full order journey be tested without Stripe. They are only
 * available when DEMO_MODE=true AND Stripe is not configured, and every demo order is
 * clearly flagged. Adding Stripe keys switches demo payments off automatically.
 */
export function demoPaymentsEnabled() {
  return env('DEMO_MODE') === 'true' && !stripeConfig().configured;
}

export function isDemoMode() {
  return env('DEMO_MODE') === 'true';
}

export type TransactionalProvider = 'resend' | 'brevo' | 'log';
export type MarketingProvider = 'brevo' | 'mailchimp' | 'none';

export function emailConfig() {
  const requested = (env('EMAIL_PROVIDER') ?? 'log') as TransactionalProvider;
  const resendKey = env('RESEND_API_KEY');
  const brevoKey = env('BREVO_API_KEY');
  const provider: TransactionalProvider =
    requested === 'resend' && resendKey ? 'resend' : requested === 'brevo' && brevoKey ? 'brevo' : 'log';
  return {
    requested,
    provider,
    configured: provider !== 'log',
    from: env('EMAIL_FROM') ?? 'Pens Outlet <orders@example.com>',
    replyTo: env('EMAIL_REPLY_TO'),
    ownerFallback: env('OWNER_NOTIFICATION_EMAIL'),
    resendKey,
    brevoKey,
  };
}

export function marketingConfig() {
  const requested = (env('EMAIL_MARKETING_PROVIDER') ?? 'none') as MarketingProvider;
  const brevoKey = env('BREVO_API_KEY');
  const brevoListId = env('BREVO_LIST_ID');
  const mailchimpKey = env('MAILCHIMP_API_KEY');
  const mailchimpAudienceId = env('MAILCHIMP_AUDIENCE_ID');
  const mailchimpServer = env('MAILCHIMP_SERVER_PREFIX') ?? mailchimpKey?.split('-')[1];
  const provider: MarketingProvider =
    requested === 'brevo' && brevoKey && brevoListId
      ? 'brevo'
      : requested === 'mailchimp' && mailchimpKey && mailchimpAudienceId && mailchimpServer
        ? 'mailchimp'
        : 'none';
  return { requested, provider, configured: provider !== 'none', brevoKey, brevoListId, mailchimpKey, mailchimpAudienceId, mailchimpServer };
}

export function storageConfig() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const bucket = env('SUPABASE_STORAGE_BUCKET') ?? 'product-images';
  return { url, serviceRoleKey, bucket, provider: (url && serviceRoleKey ? 'supabase' : 'local') as 'supabase' | 'local' };
}

export function databaseConfig() {
  const url = env('DATABASE_URL');
  let host: string | undefined;
  try {
    host = url ? new URL(url).hostname : undefined;
  } catch {
    host = undefined;
  }
  return { configured: !!url, host, kind: url ? (host?.includes('supabase') ? 'supabase' : 'postgres') : 'embedded-demo' };
}

export function cronSecret() {
  return env('CRON_SECRET');
}

export function integrationStatus() {
  const stripe = stripeConfig();
  const email = emailConfig();
  const marketing = marketingConfig();
  const storage = storageConfig();
  const database = databaseConfig();
  return [
    {
      id: 'database',
      name: 'Database',
      ok: database.configured,
      detail: database.configured
        ? `Connected to ${database.kind === 'supabase' ? 'Supabase Postgres' : 'Postgres'} (${database.host ?? 'host hidden'})`
        : 'Using the embedded demo database. Set DATABASE_URL (Supabase) before launch — demo data is not durable on serverless hosting.',
    },
    {
      id: 'payments',
      name: 'Stripe payments',
      ok: stripe.configured && !!stripe.webhookSecret,
      detail: stripe.configured
        ? `${stripe.mode === 'live' ? 'LIVE' : 'Test'} mode${stripe.webhookSecret ? '' : ' — STRIPE_WEBHOOK_SECRET missing, orders will not be marked paid automatically'}`
        : demoPaymentsEnabled()
          ? 'Awaiting configuration — demo payments enabled (no money is taken).'
          : 'Awaiting configuration — checkout cannot take payments until STRIPE_SECRET_KEY is set.',
    },
    {
      id: 'email',
      name: 'Transactional email',
      ok: email.configured,
      detail: email.configured
        ? `Sending via ${email.provider === 'resend' ? 'Resend' : 'Brevo'} from ${email.from}`
        : 'Awaiting configuration — emails are recorded in the admin outbox but NOT delivered.',
    },
    {
      id: 'marketing',
      name: 'Email marketing sync',
      ok: marketing.configured,
      detail: marketing.configured
        ? `Subscribers sync to ${marketing.provider === 'brevo' ? 'Brevo' : 'Mailchimp'}`
        : 'Awaiting configuration — subscribers are stored on this site only.',
    },
    {
      id: 'storage',
      name: 'Image storage',
      ok: storage.provider === 'supabase',
      detail:
        storage.provider === 'supabase'
          ? `Supabase Storage bucket "${storage.bucket}"`
          : 'Local disk (.data/uploads) — fine for development, not durable on serverless hosting.',
    },
    {
      id: 'cron',
      name: 'Scheduled campaigns',
      ok: !!cronSecret(),
      detail: cronSecret() ? 'CRON_SECRET set — /api/cron/campaigns can be scheduled.' : 'Awaiting configuration — set CRON_SECRET and schedule /api/cron/campaigns.',
    },
  ];
}
