/**
 * Accessibility audit with axe-core (WCAG 2.1 A/AA rules) on key pages.
 *   npm run test:a11y [baseUrl]     (server running)
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.argv[2] || 'http://localhost:3000';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@pensoutlet.local', password: process.env.E2E_ADMIN_PASSWORD || 'PensOutlet-admin-2026' };
const axeSource = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const PUBLIC = ['/', '/shop', '/collections', '/collections/autograph-pens', '/products/titanium-signature-fountain-pen', '/basket', '/checkout', '/wishlist', '/track-order', '/contact', '/faq', '/about', '/privacy', '/account/login', '/account/register', '/nope'];
const ADMIN_PAGES = ['/admin', '/admin/products', '/admin/products/new', '/admin/orders', '/admin/content', '/admin/settings', '/admin/marketing', '/admin/newsletter'];

async function audit(page, url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) }));
  });
}

(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('po-intro', '1');
    } catch {}
  });
  const page = await ctx.newPage();
  let total = 0;
  const report = async (url) => {
    const v = await audit(page, url);
    total += v.length;
    console.log(`${v.length ? '✗' : '✓'} ${url}${v.length ? '' : ' — no violations'}`);
    for (const x of v) console.log(`    [${x.impact}] ${x.id}: ${x.help} (${x.nodes}) e.g. ${x.sample.join(' | ')}`);
  };
  for (const url of PUBLIC) await report(url);
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await report('/admin/login');
  await page.fill('#email', ADMIN.email);
  await page.fill('#password', ADMIN.password);
  await Promise.all([page.waitForURL(/\/admin(\?|$)/), page.click('[data-testid="login-submit"]')]);
  for (const url of ADMIN_PAGES) await report(url);
  await browser.close();
  console.log(`\n${total} violation type(s) found`);
  process.exit(total ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
