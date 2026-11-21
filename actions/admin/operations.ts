'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { campaigns, contactMessages, discountCodes, orders, promotions, users } from '@/lib/db/schema';
import { assertPermission, audit } from '@/lib/auth/session';
import { updateOrderStatus, ORDER_STATUSES } from '@/lib/orders';
import { saveSetting, resetSetting, type SettingsKey } from '@/lib/settings';
import { adminSetSubscriberStatus, sendCampaign, sendCampaignTest } from '@/lib/marketing';
import { sendEmail } from '@/lib/email/send';
import { layout, paragraph } from '@/lib/email/templates';
import { getSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/config';
import { poundsToPence } from '@/lib/utils';
import type { FormState } from './products';

const ok = (message: string): FormState => ({ status: 'success', message });
const fail = (message: string): FormState => ({ status: 'error', message });
const opt = (max = 500) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), 'Invalid date');

/* ───────────── Orders ───────────── */

export async function updateOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('orders:manage');
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(ORDER_STATUSES),
      trackingNumber: opt(80),
      trackingUrl: z.string().trim().max(500).optional().refine((v) => !v || /^https?:\/\//.test(v), 'Tracking URL must start with https://').transform((v) => v || null),
      customerMessage: opt(2000),
      notifyCustomer: z.boolean(),
    })
    .safeParse({ ...Object.fromEntries(['id', 'status', 'trackingNumber', 'trackingUrl', 'customerMessage'].map((k) => [k, fd.get(k) ?? undefined])), notifyCustomer: fd.get('notifyCustomer') === 'on' });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.');
  await updateOrderStatus(parsed.data.id, parsed.data);
  await audit(user.id, 'order.update', 'order', parsed.data.id, `status=${parsed.data.status}`);
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  return ok(parsed.data.notifyCustomer ? 'Order updated and customer notified.' : 'Order updated.');
}

export async function saveOrderNotes(fd: FormData) {
  const user = await assertPermission('orders:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const notes = String(fd.get('adminNotes') ?? '').slice(0, 5000);
  const db = await getDb();
  await db.update(orders).set({ adminNotes: notes || null, updatedAt: new Date() }).where(eq(orders.id, id));
  await audit(user.id, 'order.notes', 'order', id);
  revalidatePath(`/admin/orders/${id}`);
}

/* ───────────── Discount codes ───────────── */

export async function saveDiscountCode(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('marketing:manage');
  const id = (fd.get('id') as string) || null;
  const parsed = z
    .object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'Codes use 3–30 letters, numbers, - or _'),
      description: opt(200),
      type: z.enum(['percent', 'fixed', 'free_delivery']),
      value: z.string().optional(),
      minOrder: z.string().optional(),
      maxUses: z.string().optional(),
      startsAt: optDate,
      endsAt: optDate,
      active: z.boolean(),
    })
    .safeParse({ ...Object.fromEntries(['code', 'description', 'type', 'value', 'minOrder', 'maxUses', 'startsAt', 'endsAt'].map((k) => [k, fd.get(k) ?? undefined])), active: fd.get('active') === 'on' });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const d = parsed.data;
  let value = 0;
  if (d.type === 'percent') {
    value = Number(d.value);
    if (!Number.isInteger(value) || value < 1 || value > 100) return fail('Percentage must be a whole number between 1 and 100.');
  } else if (d.type === 'fixed') {
    const p = poundsToPence(d.value ?? '');
    if (!p) return fail('Enter the amount off in pounds, e.g. 5.00');
    value = p;
  }
  const maxUses = d.maxUses ? Number(d.maxUses) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return fail('Maximum uses must be a positive whole number.');
  const db = await getDb();
  const clash = await db.select({ id: discountCodes.id }).from(discountCodes).where(and(eq(discountCodes.code, d.code), id ? ne(discountCodes.id, id) : undefined)).limit(1);
  if (clash.length) return fail('That code already exists.');
  const values = { code: d.code, description: d.description, type: d.type, value, minOrderPence: poundsToPence(d.minOrder ?? '') ?? 0, maxUses, startsAt: d.startsAt, endsAt: d.endsAt, active: d.active, isPlaceholder: false, updatedAt: new Date() };
  if (id) await db.update(discountCodes).set(values).where(eq(discountCodes.id, id));
  else await db.insert(discountCodes).values(values);
  await audit(user.id, 'discount.save', 'discount', id ?? d.code);
  revalidatePath('/admin/marketing');
  return ok('Discount code saved.');
}

export async function deleteDiscountCode(fd: FormData) {
  const user = await assertPermission('marketing:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const db = await getDb();
  await db.delete(discountCodes).where(eq(discountCodes.id, id));
  await audit(user.id, 'discount.delete', 'discount', id);
  revalidatePath('/admin/marketing');
}

/* ───────────── Promotions & banners ───────────── */

export async function savePromotion(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('marketing:manage');
  const id = (fd.get('id') as string) || null;
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(120),
      subtitle: opt(300),
      badge: opt(40),
      ctaLabel: opt(40),
      ctaHref: z.string().trim().max(300).optional().refine((v) => !v || v.startsWith('/') || /^https?:\/\//.test(v), 'Links must start with / or https://').transform((v) => v || null),
      placement: z.enum(['offers_feature', 'homepage_banner', 'announcement']),
      startsAt: optDate,
      endsAt: optDate,
      sortOrder: z.coerce.number().int().min(0).max(999),
      active: z.boolean(),
      countdownEnabled: z.boolean(),
    })
    .safeParse({
      ...Object.fromEntries(['title', 'subtitle', 'badge', 'ctaLabel', 'ctaHref', 'placement', 'startsAt', 'endsAt', 'sortOrder'].map((k) => [k, fd.get(k) ?? undefined])),
      active: fd.get('active') === 'on',
      countdownEnabled: fd.get('countdownEnabled') === 'on',
    });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const d = parsed.data;
  if (d.countdownEnabled && (!d.endsAt || d.endsAt.getTime() <= Date.now())) {
    return fail('A countdown needs a genuine end date in the future. Set "Ends at" or switch the countdown off.');
  }
  const db = await getDb();
  const values = { ...d, isPlaceholder: false, updatedAt: new Date() };
  if (id) await db.update(promotions).set(values).where(eq(promotions.id, id));
  else await db.insert(promotions).values(values);
  await audit(user.id, 'promotion.save', 'promotion', id ?? d.title);
  revalidatePath('/', 'layout');
  return ok('Promotion saved.');
}

export async function deletePromotion(fd: FormData) {
  const user = await assertPermission('marketing:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const db = await getDb();
  await db.delete(promotions).where(eq(promotions.id, id));
  await audit(user.id, 'promotion.delete', 'promotion', id);
  revalidatePath('/', 'layout');
}

/* ───────────── Newsletter & campaigns ───────────── */

export async function saveCampaign(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('marketing:manage');
  const id = (fd.get('id') as string) || null;
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      type: z.enum(['new_arrivals', 'special_offer', 'seasonal_sale', 'discount', 'product_launch', 'exclusive', 'general']),
      subject: z.string().trim().min(3).max(150),
      preheader: opt(150),
      heading: opt(150),
      body: z.string().trim().min(10, 'Write at least a sentence of body copy').max(20000),
      ctaLabel: opt(40),
      ctaHref: opt(300),
    })
    .safeParse(Object.fromEntries(['name', 'type', 'subject', 'preheader', 'heading', 'body', 'ctaLabel', 'ctaHref'].map((k) => [k, fd.get(k) ?? undefined])));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const db = await getDb();
  if (id) {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (c?.sentAt) return fail('This campaign has already been sent and can no longer be edited.');
    await db.update(campaigns).set({ ...parsed.data, updatedAt: new Date() }).where(eq(campaigns.id, id));
  } else {
    const [row] = await db.insert(campaigns).values(parsed.data).returning({ id: campaigns.id });
    await audit(user.id, 'campaign.create', 'campaign', row.id);
    redirect(`/admin/newsletter/campaigns/${row.id}`);
  }
  await audit(user.id, 'campaign.update', 'campaign', id);
  revalidatePath(`/admin/newsletter/campaigns/${id}`);
  return ok('Campaign saved.');
}

export async function campaignAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await assertPermission('marketing:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const op = z.enum(['test', 'schedule', 'unschedule', 'send']).parse(fd.get('op'));
  const db = await getDb();
  try {
    if (op === 'test') {
      const to = z.string().trim().email().safeParse(fd.get('testEmail'));
      if (!to.success) return fail('Enter a valid email address for the test.');
      const r = await sendCampaignTest(id, to.data);
      return r.status === 'sent' ? ok(`Test sent to ${to.data}.`) : ok(`Test recorded in the email outbox (${r.status === 'logged' ? 'email provider not configured yet' : r.error}).`);
    }
    if (op === 'schedule') {
      const when = new Date(String(fd.get('scheduledAt') ?? ''));
      if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() + 60_000) return fail('Choose a date and time in the future.');
      await db.update(campaigns).set({ status: 'scheduled', scheduledAt: when, updatedAt: new Date() }).where(eq(campaigns.id, id));
      await audit(user.id, 'campaign.schedule', 'campaign', id, when.toISOString());
      revalidatePath(`/admin/newsletter/campaigns/${id}`);
      return ok(`Scheduled for ${when.toLocaleString('en-GB', { timeZone: 'Europe/London' })}. Requires the scheduled-campaign job (see Settings).`);
    }
    if (op === 'unschedule') {
      await db.update(campaigns).set({ status: 'draft', scheduledAt: null, updatedAt: new Date() }).where(eq(campaigns.id, id));
      revalidatePath(`/admin/newsletter/campaigns/${id}`);
      return ok('Schedule cancelled — campaign returned to draft.');
    }
    if (fd.get('confirm') !== 'SEND') return fail('Type SEND to confirm sending to all confirmed subscribers.');
    const r = await sendCampaign(id);
    await audit(user.id, 'campaign.send', 'campaign', id, `sent=${r.sent} failed=${r.failed}`);
    revalidatePath(`/admin/newsletter/campaigns/${id}`);
    return ok(`Campaign processed for ${r.sent} subscriber(s)${r.failed ? `, ${r.failed} failed` : ''}. Check Admin → Emails for delivery status.`);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Something went wrong.');
  }
}

export async function setSubscriberStatus(fd: FormData) {
  const user = await assertPermission('marketing:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const status = z.enum(['subscribed', 'unsubscribed']).parse(fd.get('status'));
  await adminSetSubscriberStatus(id, status);
  await audit(user.id, `subscriber.${status}`, 'subscriber', id);
  revalidatePath('/admin/newsletter');
}

/* ───────────── Site content & settings ───────────── */

const CONTENT_KEYS = ['hero', 'announcement', 'offers', 'showcase', 'why', 'newsletter', 'finalCta', 'business', 'social', 'seo', 'analytics', 'delivery', 'checkout', 'payments', 'reviews', 'policies', 'faq'] as const;
const SETTINGS_KEYS = ['notifications'] as const;

export async function saveSettingsSection(_prev: FormState, fd: FormData): Promise<FormState> {
  const key = String(fd.get('key')) as SettingsKey;
  const isContent = (CONTENT_KEYS as readonly string[]).includes(key);
  const isSettings = (SETTINGS_KEYS as readonly string[]).includes(key);
  if (!isContent && !isSettings) return fail('Unknown section.');
  const user = await assertPermission(isContent ? 'content:manage' : 'settings:manage');
  let value: unknown;
  try {
    value = JSON.parse(String(fd.get('value') ?? '{}'));
  } catch {
    return fail('Could not read the form.');
  }
  if (fd.get('reset') === '1') {
    await resetSetting(key);
    await audit(user.id, 'settings.reset', 'settings', key);
    revalidatePath('/', 'layout');
    return ok('Section reset to defaults.');
  }
  await saveSetting(key, value);
  await audit(user.id, 'settings.save', 'settings', key);
  revalidatePath('/', 'layout');
  return ok('Saved. Changes are live on the website.');
}

export async function sendTestEmail(_prev: FormState, fd: FormData): Promise<FormState> {
  await assertPermission('settings:manage');
  const to = z.string().trim().email().safeParse(fd.get('to'));
  if (!to.success) return fail('Enter a valid email address.');
  const settings = await getSettings();
  const r = await sendEmail({
    to: to.data,
    subject: 'Pens Outlet — test email',
    template: 'admin.test',
    html: layout({ settings, siteUrl: siteUrl(), heading: 'Your email settings work.', bodyHtml: paragraph('This is a test message from the Pens Outlet admin dashboard.') }),
  });
  if (r.status === 'sent') return ok(`Test email sent to ${to.data}.`);
  if (r.status === 'logged') return ok('No email provider is configured yet, so the message was recorded in the outbox (Admin → Emails) but not delivered.');
  return fail(`Sending failed: ${r.error}`);
}

/* ───────────── Users & roles ───────────── */

export async function setUserRole(fd: FormData) {
  const actor = await assertPermission('users:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const role = z.enum(['customer', 'staff', 'admin']).parse(fd.get('role'));
  if (id === actor.id) return; // never demote yourself
  const db = await getDb();
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  await audit(actor.id, 'user.role', 'user', id, role);
  revalidatePath('/admin/customers');
}

/* ───────────── Contact messages ───────────── */

export async function setMessageStatus(fd: FormData) {
  const user = await assertPermission('messages:manage');
  const id = z.string().uuid().parse(fd.get('id'));
  const status = z.enum(['new', 'read', 'replied', 'archived']).parse(fd.get('status'));
  const db = await getDb();
  await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
  await audit(user.id, 'message.status', 'message', id, status);
  revalidatePath('/admin/messages');
}
