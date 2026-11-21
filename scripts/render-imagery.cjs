/**
 * Captures placeholder collection imagery + the Open Graph image from the procedural 3D pen.
 * Requires the dev server (`npm run dev`) and Playwright's Chromium.
 *   node scripts/render-imagery.cjs [baseUrl]
 * Output: public/images/collections/*.webp, app/opengraph-image.jpg
 */
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');

const base = process.argv[2] || 'http://localhost:3000';
const only = process.argv[3]; // optional substring filter, e.g. "opengraph"
const shots = [
  { file: 'public/images/collections/autograph-pens.webp', q: 'finish=midnight&tilt=-0.72&spin=0.15&cap=1.0&scale=0.8', w: 900, h: 1125 },
  { file: 'public/images/collections/collectable-pens.webp', q: 'finish=burgundy&tilt=0.7&spin=-0.3&cap=0&scale=0.98', w: 900, h: 1125 },
  { file: 'public/images/collections/luxury-writing-pens.webp', q: 'finish=titanium&tilt=-0.5&spin=0.25&cap=1.1&scale=0.74', w: 900, h: 1125 },
  { file: 'public/images/collections/limited-edition-pens.webp', q: 'finish=obsidian&tilt=-0.22&spin=0.4&cap=0.7&scale=0.76&warm=1', w: 900, h: 1125 },
  { file: 'public/images/collections/special-offers.webp', q: 'finish=champagne&tilt=-0.78&spin=0.1&cap=0.6&scale=0.82&warm=1', w: 900, h: 1125 },
  { file: 'public/images/collections/new-arrivals.webp', q: 'finish=pearl&tilt=0.72&spin=-0.2&cap=0.9&scale=0.8', w: 900, h: 1125 },
  { file: 'app/opengraph-image.jpg', q: 'finish=midnight&tilt=-0.95&spin=0.1&cap=1.0&scale=0.56&x=1.85&og=1', w: 1200, h: 630, scale: 1 },
];

(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  for (const s of shots.filter((x) => !only || x.file.includes(only))) {
    const page = await browser.newPage({ viewport: { width: Math.round(s.w / 2), height: Math.round(s.h / 2) }, deviceScaleFactor: 2 });
    await page.goto(`${base}/studio/render?${s.q}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#studio[data-ready="1"]', { timeout: 60000 });
    await page.waitForTimeout(800);
    const buf = await page.screenshot({ type: 'png' });
    fs.mkdirSync(path.dirname(s.file), { recursive: true });
    const img = sharp(buf).resize(s.w, s.h);
    if (s.file.endsWith('.webp')) await img.webp({ quality: 82 }).toFile(s.file);
    else await img.jpeg({ quality: 86, mozjpeg: true }).toFile(s.file);
    console.log('rendered', s.file);
    await page.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
