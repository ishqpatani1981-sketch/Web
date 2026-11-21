export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatPrice(pence: number | null | undefined) {
  if (pence === null || pence === undefined) return 'Price to be confirmed';
  return gbp.format(pence / 100);
}

export function poundsToPence(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[£,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function penceToPounds(pence: number | null | undefined) {
  if (pence === null || pence === undefined) return '';
  return (pence / 100).toFixed(2);
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
});

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return '—';
  return dateTimeFmt.format(new Date(d));
}

export function discountPercent(price: number | null, original: number | null) {
  if (!price || !original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Only allow same-site relative links or http(s) URLs in owner-editable CTAs. */
export function safeHref(href: string | null | undefined, fallback = '/') {
  if (!href) return fallback;
  const h = href.trim();
  if (h.startsWith('/') && !h.startsWith('//')) return h;
  if (/^https?:\/\//i.test(h)) return h;
  if (/^mailto:|^tel:/i.test(h)) return h;
  return fallback;
}

export function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}
