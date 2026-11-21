import 'server-only';
import { createHash } from 'node:crypto';
import { and, eq, isNull, lte, ne } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { campaigns, subscribers, type Campaign } from '@/lib/db/schema';
import { marketingConfig, siteUrl } from '@/lib/config';
import { randomToken, sha256 } from '@/lib/auth/password';
import { getSettings } from '@/lib/settings';
import { listProducts } from '@/lib/catalog';
import { sendEmail } from '@/lib/email/send';
import { layout, paragraph } from '@/lib/email/templates';
import { customerNewsletterConfirm, customerNewsletterWelcome, ownerNewSubscriber } from '@/lib/email/notifications';
import { escapeHtml, formatPrice, safeHref } from '@/lib/utils';

export const CAMPAIGN_TYPES = [
  { value: 'new_arrivals', label: 'New arrival announcement' },
  { value: 'special_offer', label: 'Special offer' },
  { value: 'seasonal_sale', label: 'Seasonal sale' },
  { value: 'discount', label: 'Discount campaign' },
  { value: 'product_launch', label: 'Product launch' },
  { value: 'exclusive', label: 'Exclusive promotion' },
  { value: 'general', label: 'General update' },
] as const;

export function unsubscribeUrl(token: string) {
  return `${siteUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/** RFC 8058 one-click endpoint used in the List-Unsubscribe header (mail clients POST to it). */
export function oneClickUnsubscribeUrl(token: string) {
  return `${siteUrl()}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/* ───────────── Provider sync (Brevo / Mailchimp) ───────────── */

async function syncToProvider(email: string, subscribed: boolean) {
  const cfg = marketingConfig();
  try {
    if (cfg.provider === 'brevo') {
      if (subscribed) {
        const res = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: { 'api-key': cfg.brevoKey!, 'Content-Type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ email, listIds: [Number(cfg.brevoListId)], updateEnabled: true, emailBlacklisted: false }),
        });
        return res.ok || res.status === 204;
      }
      const res = await fetch(`https://api.brevo.com/v3/contacts/lists/${cfg.brevoListId}/contacts/remove`, {
        method: 'POST',
        headers: { 'api-key': cfg.brevoKey!, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ emails: [email] }),
      });
      return res.ok;
    }
    if (cfg.provider === 'mailchimp') {
      const hash = createHash('md5').update(email.toLowerCase()).digest('hex');
      const res = await fetch(`https://${cfg.mailchimpServer}.api.mailchimp.com/3.0/lists/${cfg.mailchimpAudienceId}/members/${hash}`, {
        method: 'PUT',
        headers: { Authorization: `Basic ${Buffer.from(`pensoutlet:${cfg.mailchimpKey}`).toString('base64')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: email, status_if_new: subscribed ? 'subscribed' : 'unsubscribed', status: subscribed ? 'subscribed' : 'unsubscribed' }),
      });
      return res.ok;
    }
  } catch (err) {
    console.error('[marketing] provider sync failed', err);
  }
  return false;
}

/* ───────────── Subscription lifecycle ───────────── */

export type SubscribeOutcome = 'confirmation_sent' | 'already_subscribed';

export async function subscribe(input: { email: string; name?: string | null; source: string; consentText: string; ip?: string | null }): Promise<SubscribeOutcome> {
  const email = input.email.trim().toLowerCase();
  const db = await getDb();
  const [existing] = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  if (existing?.status === 'subscribed') return 'already_subscribed';

  const token = randomToken(24);
  const values = {
    email,
    name: input.name ?? existing?.name ?? null,
    status: 'pending',
    source: input.source,
    consentText: input.consentText,
    consentAt: new Date(),
    consentIp: input.ip ?? null,
    confirmTokenHash: sha256(token),
    unsubscribeToken: existing?.unsubscribeToken ?? randomToken(24),
    unsubscribedAt: null,
    updatedAt: new Date(),
  };
  if (existing) await db.update(subscribers).set(values).where(eq(subscribers.id, existing.id));
  else await db.insert(subscribers).values(values);

  await customerNewsletterConfirm(email, `${siteUrl()}/newsletter/confirm?token=${encodeURIComponent(token)}`);
  return 'confirmation_sent';
}

export async function confirmSubscription(token: string) {
  const db = await getDb();
  const [sub] = await db.select().from(subscribers).where(eq(subscribers.confirmTokenHash, sha256(token))).limit(1);
  if (!sub) return { ok: false as const };
  if (sub.status === 'subscribed') return { ok: true as const, email: sub.email, already: true };
  await db
    .update(subscribers)
    .set({ status: 'subscribed', confirmedAt: new Date(), confirmTokenHash: null, updatedAt: new Date() })
    .where(eq(subscribers.id, sub.id));
  const synced = await syncToProvider(sub.email, true);
  if (synced) await db.update(subscribers).set({ providerSyncedAt: new Date() }).where(eq(subscribers.id, sub.id));
  await Promise.allSettled([customerNewsletterWelcome(sub.email, unsubscribeUrl(sub.unsubscribeToken), oneClickUnsubscribeUrl(sub.unsubscribeToken)), ownerNewSubscriber(sub.email, sub.source)]);
  return { ok: true as const, email: sub.email, already: false };
}

export async function unsubscribeByToken(token: string) {
  const db = await getDb();
  const [sub] = await db.select().from(subscribers).where(eq(subscribers.unsubscribeToken, token)).limit(1);
  if (!sub) return { ok: false as const };
  if (sub.status !== 'unsubscribed') {
    await db.update(subscribers).set({ status: 'unsubscribed', unsubscribedAt: new Date(), updatedAt: new Date() }).where(eq(subscribers.id, sub.id));
    await syncToProvider(sub.email, false);
  }
  return { ok: true as const, email: sub.email };
}

export async function adminSetSubscriberStatus(id: string, status: 'subscribed' | 'unsubscribed') {
  const db = await getDb();
  const [sub] = await db
    .update(subscribers)
    .set({ status, unsubscribedAt: status === 'unsubscribed' ? new Date() : null, updatedAt: new Date() })
    .where(eq(subscribers.id, id))
    .returning();
  if (sub) await syncToProvider(sub.email, status === 'subscribed');
}

/* ───────────── Campaigns ───────────── */

async function renderCampaign(c: Campaign, unsubscribe: string) {
  const settings = await getSettings();
  const featured =
    c.type === 'new_arrivals' || c.type === 'product_launch'
      ? await listProducts({ rule: 'new_arrival', limit: 4 })
      : c.type === 'special_offer' || c.type === 'seasonal_sale' || c.type === 'discount'
        ? await listProducts({ rule: 'on_sale', limit: 4 })
        : [];
  const productsHtml = featured.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">${featured
        .map(
          (p) =>
            `<tr><td style="padding:12px 0;border-top:1px solid #e8e8ed;"><a href="${siteUrl()}/products/${p.slug}" style="color:#1d1d1f;text-decoration:none;font-weight:600;">${escapeHtml(p.name)}</a><br><span style="color:#6e6e73;font-size:13px;">${formatPrice(p.pricePence)}${p.originalPricePence ? ` <s>${formatPrice(p.originalPricePence)}</s>` : ''}</span></td></tr>`,
        )
        .join('')}</table>`
    : '';
  const href = c.ctaHref ? (safeHref(c.ctaHref).startsWith('/') ? `${siteUrl()}${safeHref(c.ctaHref)}` : safeHref(c.ctaHref)) : `${siteUrl()}/shop`;
  return layout({
    settings,
    siteUrl: siteUrl(),
    preheader: c.preheader ?? undefined,
    heading: c.heading || c.subject,
    bodyHtml: paragraph(c.body) + productsHtml,
    cta: { label: c.ctaLabel || 'Shop now', href },
    unsubscribeUrl: unsubscribe,
  });
}

export async function sendCampaignTest(campaignId: string, to: string) {
  const db = await getDb();
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!c) throw new Error('Campaign not found');
  const html = await renderCampaign(c, `${siteUrl()}/newsletter/unsubscribe?token=test`);
  return sendEmail({ to, subject: `[TEST] ${c.subject}`, html, template: 'campaign.test' });
}

export async function previewCampaignHtml(campaignId: string) {
  const db = await getDb();
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  return c ? renderCampaign(c, `${siteUrl()}/newsletter/unsubscribe?token=preview`) : null;
}

/** Sends a campaign to every confirmed subscriber. Claims the campaign first so it is never sent twice. */
export async function sendCampaign(campaignId: string) {
  const db = await getDb();
  const [c] = await db
    .update(campaigns)
    .set({ status: 'sending', updatedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), isNull(campaigns.sentAt), ne(campaigns.status, 'sending')))
    .returning();
  if (!c) throw new Error('This campaign has already been sent, is currently sending, or no longer exists.');

  const recipients = await db.select().from(subscribers).where(eq(subscribers.status, 'subscribed'));
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const unsub = unsubscribeUrl(r.unsubscribeToken);
    const result = await sendEmail({ to: r.email, subject: c.subject, html: await renderCampaign(c, unsub), template: `campaign.${c.type}`, unsubscribeUrl: oneClickUnsubscribeUrl(r.unsubscribeToken) });
    if (result.status === 'failed') failed++;
    else sent++;
  }
  await db
    .update(campaigns)
    .set({
      status: failed && !sent ? 'failed' : 'sent',
      sentAt: new Date(),
      recipientCount: sent,
      lastError: failed ? `${failed} message(s) failed — see Admin → Emails.` : null,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, c.id));
  return { sent, failed };
}

export async function runScheduledCampaigns() {
  const db = await getDb();
  const due = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.status, 'scheduled'), lte(campaigns.scheduledAt, new Date())));
  const results = [];
  for (const d of due) results.push({ id: d.id, ...(await sendCampaign(d.id)) });
  return results;
}
