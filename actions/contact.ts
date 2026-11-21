'use server';

import { z } from 'zod';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/lib/db/schema';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { ownerContactEnquiry } from '@/lib/email/notifications';

export type ContactState = { status: 'idle' | 'success' | 'error'; message: string };

const Schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(200),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().max(150).optional().or(z.literal('')),
  orderNumber: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please write a little more so we can help').max(5000),
  company: z.string().max(0).optional(),
});

export async function sendContactMessage(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const parsed = Schema.safeParse(Object.fromEntries(['name', 'email', 'phone', 'subject', 'orderNumber', 'message', 'company'].map((k) => [k, fd.get(k) ?? ''])));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  if (!(await rateLimit('contact', await clientIp(), 5, 3600))) return { status: 'error', message: 'Too many messages sent. Please try again later.' };
  const db = await getDb();
  const { company: _honeypot, ...data } = parsed.data;
  const [msg] = await db
    .insert(contactMessages)
    .values({ ...data, phone: data.phone || null, subject: data.subject || null, orderNumber: data.orderNumber || null })
    .returning();
  await ownerContactEnquiry(msg).catch((e) => console.error('[contact] notify failed', e));
  return { status: 'success', message: 'Thank you — your message has been sent. We will reply as soon as we can.' };
}
