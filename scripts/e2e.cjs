/**
 * End-to-end journey tests (Playwright). Requires a running server in DEMO_MODE with the
 * embedded demo database:   npm run dev   then   npm run test:e2e [baseUrl]
 */
const { chromium, devices } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:3000';
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || 'admin@pensoutlet.local', password: process.env.E2E_ADMIN_PASSWORD || 'PensOutlet-admin-2026' };
const results = [];
let failures = 0;

async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (err) {
    failures++;
    results.push(`  ✗ ${name}\n      ${String(err && err.message ? err.message : err).split('\n')[0]}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('po-intro', '1');
    } catch {}
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && consoleErrors.push(m.text()));
  const email = `e2e+${Date.now()}@example.com`;
  let orderNumber = '';

  await step('Homepage renders hero, sections and CTAs', async () => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    assert(await page.getByRole('heading', { level: 1 }).count(), 'missing h1');
    assert(await page.locator('[data-testid="hero-primary-cta"]').isVisible(), 'hero CTA not visible');
    for (const id of ['collections-heading', 'bestsellers-heading', 'offers-heading', 'why-heading', 'showcase-heading', 'arrivals-heading', 'newsletter-heading', 'final-heading']) {
      assert(await page.locator(`#${id}`).count(), `missing section ${id}`);
    }
    assert((await page.locator('a[href="https://www.autographpens.co.uk/"]').count()) > 0, 'original store link missing');
  });

  await step('Search overlay returns product suggestions', async () => {
    await page.getByRole('button', { name: /Search/ }).first().click();
    await page.getByRole('combobox', { name: 'Search' }).fill('gold');
    await page.waitForSelector('#search-results [role="option"]', { timeout: 10000 });
    const n = await page.locator('#search-results [role="option"]').count();
    assert(n > 0, 'no search results');
    await page.keyboard.press('Escape');
  });

  await step('Shop filtering by query and collection', async () => {
    await page.goto(BASE + '/shop?q=fountain', { waitUntil: 'networkidle' });
    const cards = await page.locator('[data-testid="product-card"]').count();
    assert(cards > 0 && cards < 16, `expected filtered results, got ${cards}`);
    await page.goto(BASE + '/collections/limited-edition-pens', { waitUntil: 'networkidle' });
    assert((await page.locator('[data-testid="product-card"]').count()) === 3, 'limited editions should have 3 demo products');
  });

  await step('Sold-out and price-TBC products cannot be bought', async () => {
    await page.goto(BASE + '/products/rose-gold-limited-edition-rollerball', { waitUntil: 'networkidle' });
    assert(await page.getByRole('button', { name: /Sold out/ }).first().isDisabled(), 'sold out button should be disabled');
    await page.goto(BASE + '/products/midnight-collectors-edition-set', { waitUntil: 'networkidle' });
    assert(await page.getByRole('button', { name: /Price on request/ }).first().isDisabled(), 'price TBC button should be disabled');
  });

  await step('Add to basket opens drawer and updates count', async () => {
    await page.goto(BASE + '/products/titanium-signature-fountain-pen', { waitUntil: 'networkidle' });
    await page.locator('main [data-testid="add-to-basket"]').first().click();
    await page.waitForSelector('[data-testid="basket-drawer"]');
    await page.waitForFunction(() => document.querySelector('[data-testid="basket-count"]')?.textContent === '1');
    await page.getByRole('button', { name: 'Close basket' }).click();
  });

  await step('Basket: change quantity and apply discount code', async () => {
    await page.goto(BASE + '/basket', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Increase quantity' }).first().click();
    await page.waitForFunction(() => /£178\.00/.test(document.body.innerText));
    await page.fill('#discount', 'DEMO10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.waitForFunction(() => /DEMO10 applied/.test(document.body.innerText), null, { timeout: 10000 });
    const total = await page.locator('[data-testid="order-total"]').innerText();
    // £178 − 10% = £160.20, free standard delivery over £50 (placeholder rate)
    assert(total.includes('£160.20'), `unexpected total ${total}`);
  });

  await step('Checkout validation keeps entered details', async () => {
    await page.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
    assert(await page.locator('[data-testid="demo-notice"]').isVisible(), 'demo notice missing');
    await page.fill('#f-name', 'Test Customer');
    await page.fill('#f-email', email);
    await page.locator('[data-testid="place-order"]').click();
    await page.waitForSelector('#checkout-error p', { timeout: 15000 });
    assert((await page.inputValue('#f-name')) === 'Test Customer', 'name was reset after validation error');
  });

  await step('Checkout places a demo order and shows confirmation', async () => {
    await page.fill('#f-shipping-line1', '1 Test Street');
    await page.fill('#f-shipping-city', 'London');
    await page.fill('#f-shipping-postcode', 'SW1A 1AA');
    await page.check('input[name="acceptTerms"]');
    await page.check('input[name="marketingOptIn"]');
    await Promise.all([page.waitForURL(/\/checkout\/success/, { timeout: 30000 }), page.locator('[data-testid="place-order"]').click()]);
    await page.waitForSelector('[data-testid="order-confirmation"]');
    const text = await page.locator('main').innerText();
    const m = text.match(/PO-\d+/);
    assert(m, 'order number not shown');
    orderNumber = m[0];
    assert(/demonstration order/i.test(text), 'demo notice missing on confirmation');
    assert(text.includes('£160.20'), 'confirmation total mismatch');
    await page.waitForFunction(() => !document.querySelector('[data-testid="basket-count"]'));
  });

  await step('Track order by number + email', async () => {
    await page.goto(BASE + '/track-order', { waitUntil: 'networkidle' });
    await page.fill('#orderNumber', orderNumber);
    await page.fill('#trackEmail', email);
    await page.getByRole('button', { name: 'Track' }).click();
    await page.waitForSelector('[data-testid="track-result"]');
    await page.fill('#trackEmail', 'wrong@example.com');
    await page.getByRole('button', { name: 'Track' }).click();
    await page.waitForSelector('text=could not find an order');
  });

  await step('Newsletter signup requires consent, then succeeds', async () => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('#newsletter-heading').scrollIntoViewIfNeeded();
    await page.fill('#newsletter-email', `news+${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await page.waitForSelector('#newsletter-msg:has-text("tick the box")', { timeout: 10000 });
    await page.check('input[name="consent"]');
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await page.waitForSelector('[data-testid="newsletter-success"]', { timeout: 15000 });
  });

  await step('Contact form sends an enquiry', async () => {
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
    await page.fill('#c-name', 'E2E Tester');
    await page.fill('#c-email', email);
    await page.fill('#c-message', 'Hello — this is an automated test enquiry about a pen.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.waitForSelector('[data-testid="contact-success"]', { timeout: 15000 });
  });

  await step('Customer registration, account page and admin denial', async () => {
    await page.goto(BASE + '/account/register', { waitUntil: 'networkidle' });
    await page.fill('#name', 'E2E Customer');
    await page.fill('#email', `cust+${Date.now()}@example.com`);
    await page.fill('#password', 'Sup3rSecretPass');
    await Promise.all([page.waitForURL(/\/account/), page.getByRole('button', { name: 'Create account' }).click()]);
    await page.waitForSelector('text=Order history');
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
    assert(page.url().includes('/admin/login') || page.url().includes('denied'), `customer reached admin: ${page.url()}`);
    await page.goto(BASE + '/account', { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(BASE + '/'), page.getByRole('button', { name: 'Sign out' }).click()]);
  });

  await step('Admin login rejects a wrong password', async () => {
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await page.fill('#email', ADMIN.email);
    await page.fill('#password', 'wrong-password-123');
    await page.click('[data-testid="login-submit"]');
    await page.waitForSelector('text=not recognised');
  });

  await step('Admin: dashboard, order status update + customer notification', async () => {
    await page.fill('#password', ADMIN.password);
    await Promise.all([page.waitForURL(/\/admin(\?|$)/), page.click('[data-testid="login-submit"]')]);
    await page.goto(BASE + `/admin/orders?q=${orderNumber}`, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: orderNumber }).click();
    await page.waitForURL(/\/admin\/orders\/[0-9a-f-]+/);
    await page.selectOption('#af-status', 'dispatched');
    await page.fill('#af-trackingNumber', 'TEST123456GB');
    await page.getByRole('button', { name: 'Update order' }).click();
    await page.waitForSelector('text=customer notified');
  });

  await step('Admin: email outbox recorded every notification', async () => {
    await page.goto(BASE + '/admin/emails', { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText();
    for (const t of ['customer.orderConfirmation', 'owner.newOrder', 'customer.dispatched', 'customer.newsletterConfirm', 'owner.contactEnquiry']) {
      assert(text.includes(t), `outbox missing ${t}`);
    }
  });

  await step('Admin: create a product, upload a photo, then delete it', async () => {
    await page.goto(BASE + '/admin/products/new', { waitUntil: 'networkidle' });
    const name = `E2E Test Pen ${Date.now()}`;
    await page.fill('#af-name', name);
    await page.fill('#af-price', '12.50');
    await page.fill('#af-stockQuantity', '4');
    await Promise.all([page.waitForURL(/created=1/, { timeout: 20000 }), page.getByRole('button', { name: 'Create product' }).click()]);
    // Upload a real PNG photograph (1×1 pixel) and save.
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('input[name="newImages"]', { name: 'pen-photo.png', mimeType: 'image/png', buffer: png });
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForSelector('text=Product saved.', { timeout: 20000 });
    await page.waitForSelector('input[aria-label="Alt text for image 1"]', { timeout: 20000 });
    const slugUrl = await page.getByRole('link', { name: /View on site/ }).getAttribute('href');
    await page.goto(BASE + slugUrl, { waitUntil: 'networkidle' });
    assert((await page.locator('[data-testid="pdp-price"]').innerText()).includes('£12.50'), 'new product price not shown');
    const photo = await page.locator('main img').first().getAttribute('src');
    assert(photo && /media|supabase/.test(decodeURIComponent(photo)), `uploaded photo not shown on product page (src=${photo})`);
    await page.goBack({ waitUntil: 'networkidle' });
    page.once('dialog', (d) => d.accept());
    await Promise.all([page.waitForURL(/deleted=1/), page.getByRole('button', { name: 'Delete' }).click()]);
  });

  await step('Admin: edit homepage content and see it live', async () => {
    await page.goto(BASE + '/admin/content', { waitUntil: 'networkidle' });
    await page.fill('#se-hero-subheadline', 'E2E subheadline check.');
    await page.getByRole('button', { name: 'Save homepage hero' }).click();
    await page.waitForSelector('text=Saved. Changes are live');
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    assert((await page.locator('main').innerText()).includes('E2E subheadline check.'), 'content change not live');
    await page.goto(BASE + '/admin/content', { waitUntil: 'networkidle' });
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Reset to defaults' }).first().click();
    await page.waitForSelector('text=reset to defaults');
  });

  await step('No uncaught errors on the desktop journey', async () => {
    assert(consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  });

  // Mobile + reduced motion
  const mobile = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  const m = await mobile.newPage();
  await step('Mobile (reduced motion): home renders and menu opens', async () => {
    await m.goto(BASE + '/', { waitUntil: 'networkidle' });
    await m.getByRole('button', { name: 'Open menu' }).click();
    await m.waitForSelector('[role="dialog"][aria-label="Menu"]');
    await m.getByRole('link', { name: 'Shop All' }).last().click();
    await m.waitForURL(/\/shop/);
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!overflow, 'horizontal overflow on mobile');
  });

  await browser.close();
  console.log(`\nPens Outlet E2E — ${results.length} checks, ${failures} failed\n`);
  console.log(results.join('\n'));
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
