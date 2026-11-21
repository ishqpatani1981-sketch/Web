import 'server-only';
import { getDb } from '@/lib/db';
import { emailLog } from '@/lib/db/schema';
import { emailConfig } from '@/lib/config';

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template: string;
  replyTo?: string;
  /** Adds RFC 8058 one-click unsubscribe headers for marketing mail. */
  unsubscribeUrl?: string;
};

export type SendResult = { status: 'sent' | 'logged' | 'failed'; provider: string; id?: string; error?: string };

function parseFrom(from: string) {
  const m = from.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  return m ? { name: m[1].replace(/^"|"$/g, ''), email: m[2] } : { name: undefined, email: from.trim() };
}

/**
 * Sends an email through the configured transactional provider. Every message is also
 * written to the email_log outbox (visible in /admin/emails) so nothing is lost while
 * the provider is awaiting configuration.
 */
export async function sendEmail(msg: OutgoingEmail): Promise<SendResult> {
  const cfg = emailConfig();
  let result: SendResult;
  try {
    if (cfg.provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: cfg.from,
          to: [msg.to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          reply_to: msg.replyTo ?? cfg.replyTo,
          headers: msg.unsubscribeUrl
            ? { 'List-Unsubscribe': `<${msg.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
            : undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      result = res.ok ? { status: 'sent', provider: 'resend', id: body.id } : { status: 'failed', provider: 'resend', error: body.message ?? `HTTP ${res.status}` };
    } else if (cfg.provider === 'brevo') {
      const from = parseFrom(cfg.from);
      const reply = msg.replyTo ?? cfg.replyTo;
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': cfg.brevoKey!, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { email: from.email, name: from.name },
          to: [{ email: msg.to }],
          subject: msg.subject,
          htmlContent: msg.html,
          textContent: msg.text,
          replyTo: reply ? { email: parseFrom(reply).email } : undefined,
          headers: msg.unsubscribeUrl ? { 'List-Unsubscribe': `<${msg.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
      result = res.ok ? { status: 'sent', provider: 'brevo', id: body.messageId } : { status: 'failed', provider: 'brevo', error: body.message ?? `HTTP ${res.status}` };
    } else {
      result = { status: 'logged', provider: 'log' };
      if (process.env.NODE_ENV !== 'production') console.info(`[email:log] → ${msg.to} · ${msg.subject}`);
    }
  } catch (err) {
    result = { status: 'failed', provider: cfg.provider, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const db = await getDb();
    await db.insert(emailLog).values({
      to: msg.to,
      subject: msg.subject,
      template: msg.template,
      status: result.status,
      provider: result.provider,
      providerMessageId: result.id,
      error: result.error,
      html: msg.html.slice(0, 200_000),
    });
  } catch (err) {
    console.error('[email] could not write outbox entry', err);
  }
  if (result.status === 'failed') console.error(`[email] ${msg.template} to ${msg.to} failed: ${result.error}`);
  return result;
}
