import { escapeHtml, formatPrice } from '@/lib/utils';
import type { Order, OrderItem } from '@/lib/db/schema';
import type { Settings } from '@/lib/settings/defaults';
import { isPlaceholderValue } from '@/lib/settings/defaults';

/**
 * Branded, email-client-safe HTML templates (table layout, inline styles).
 * Copy avoids any delivery/returns promises — those come from owner-confirmed settings.
 */

const C = { ink: '#0b0b0d', charcoal: '#16171b', silver: '#c9cbd0', champagne: '#d6bf96', paper: '#ffffff', text: '#1d1d1f', muted: '#6e6e73', line: '#e8e8ed' };

type LayoutOpts = {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  footerNote?: string;
  unsubscribeUrl?: string;
  settings: Settings;
  siteUrl: string;
};

export function layout(o: LayoutOpts) {
  const b = o.settings.business;
  const contact = [b.email, b.phone].filter((v) => !isPlaceholderValue(v)).map(escapeHtml).join(' · ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(o.heading)}</title></head>
<body style="margin:0;padding:0;background:#f2f2f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.text};">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(o.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f4;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.paper};border-radius:18px;overflow:hidden;">
<tr><td style="background:${C.ink};padding:34px 40px;text-align:center;">
<div style="font-size:13px;letter-spacing:6px;color:${C.champagne};font-weight:600;">PENS OUTLET</div>
<div style="font-size:11px;letter-spacing:3px;color:${C.silver};margin-top:8px;opacity:.7;">THE ART OF THE SIGNATURE</div>
</td></tr>
<tr><td style="padding:40px 40px 8px 40px;">
<h1 style="margin:0 0 18px 0;font-size:24px;line-height:1.25;font-weight:600;letter-spacing:-.2px;color:${C.text};">${escapeHtml(o.heading)}</h1>
<div style="font-size:15px;line-height:1.65;color:${C.text};">${o.bodyHtml}</div>
${o.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px 0;"><tr><td style="background:${C.ink};border-radius:999px;"><a href="${escapeHtml(o.cta.href)}" style="display:inline-block;padding:14px 28px;font-size:13px;letter-spacing:2px;color:#fff;text-decoration:none;font-weight:600;">${escapeHtml(o.cta.label.toUpperCase())}</a></td></tr></table>` : ''}
</td></tr>
<tr><td style="padding:24px 40px 36px 40px;">
${o.footerNote ? `<p style="font-size:12px;line-height:1.6;color:${C.muted};margin:0 0 12px 0;">${o.footerNote}</p>` : ''}
<p style="font-size:12px;line-height:1.6;color:${C.muted};margin:0;border-top:1px solid ${C.line};padding-top:18px;">
${escapeHtml(b.tradingName)}${contact ? ` · ${contact}` : ''}<br>
<a href="${o.siteUrl}" style="color:${C.muted};">${o.siteUrl.replace(/^https?:\/\//, '')}</a>
${o.unsubscribeUrl ? `<br><br>You are receiving this because you subscribed to Pens Outlet updates. <a href="${escapeHtml(o.unsubscribeUrl)}" style="color:${C.muted};">Unsubscribe</a>.` : ''}
</p></td></tr>
</table></td></tr></table></body></html>`;
}

export function itemsTable(items: Pick<OrderItem, 'productName' | 'quantity' | 'unitPricePence' | 'lineTotalPence'>[], order: Pick<Order, 'subtotalPence' | 'discountPence' | 'deliveryPence' | 'totalPence' | 'discountCode' | 'deliveryMethodName'>) {
  const rows = items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;">${escapeHtml(i.productName)} <span style="color:${C.muted};">× ${i.quantity}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;">${formatPrice(i.lineTotalPence)}</td></tr>`,
    )
    .join('');
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;color:${strong ? C.text : C.muted};${strong ? 'font-weight:600;' : ''}">${label}</td><td align="right" style="padding:6px 0;font-size:14px;${strong ? 'font-weight:600;' : ''}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">${rows}
${line('Subtotal', formatPrice(order.subtotalPence))}
${order.discountPence ? line(`Discount${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ''}`, `−${formatPrice(order.discountPence)}`) : ''}
${line(`Delivery${order.deliveryMethodName ? ` — ${escapeHtml(order.deliveryMethodName)}` : ''}`, order.deliveryPence ? formatPrice(order.deliveryPence) : 'Free')}
${line('Total', formatPrice(order.totalPence), true)}</table>`;
}

export function addressHtml(a: { line1: string; line2?: string; city: string; county?: string; postcode: string; country: string }) {
  return [a.line1, a.line2, a.city, a.county, a.postcode, a.country].filter(Boolean).map((x) => escapeHtml(String(x))).join('<br>');
}

export function paragraph(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
