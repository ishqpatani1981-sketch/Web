/**
 * DEMONSTRATION CONTENT ONLY.
 *
 * These collections and products exist so every part of the shop can be explored and
 * tested before the owner supplies the real catalogue. Every record is flagged
 * `isPlaceholder: true`, carries a DEMO- SKU and is labelled "Demo" on the storefront.
 * Names, prices and stock levels are illustrative and are NOT real products or offers.
 * Delete them from /admin/products once the real catalogue is loaded.
 */

const DEMO_NOTE =
  'This is placeholder demonstration content. The final name, description, price, photography and specifications will be confirmed by the owner.';

export const DEMO_COLLECTIONS = [
  {
    slug: 'autograph-pens',
    name: 'Autograph Pens',
    description: 'Signature-ready pens for autographs, events and everyday signing. (Placeholder description.)',
    rule: 'manual',
    sortOrder: 1,
    imageUrl: '/images/collections/autograph-pens.webp',
    imageAlt: 'A black lacquer pen with silver trim floating in a dark studio (placeholder render)',
  },
  {
    slug: 'collectable-pens',
    name: 'Collectable Pens',
    description: 'Distinctive finishes and designs worth keeping. (Placeholder description.)',
    rule: 'manual',
    sortOrder: 2,
    imageUrl: '/images/collections/collectable-pens.webp',
    imageAlt: 'A burgundy lacquer fountain pen with gold trim (placeholder render)',
  },
  {
    slug: 'luxury-writing-pens',
    name: 'Luxury Writing Pens',
    description: 'Refined instruments for the pleasure of writing. (Placeholder description.)',
    rule: 'manual',
    sortOrder: 3,
    imageUrl: '/images/collections/luxury-writing-pens.webp',
    imageAlt: 'A titanium pen with a champagne gold nib (placeholder render)',
  },
  {
    slug: 'limited-edition-pens',
    name: 'Limited Edition Pens',
    description: 'Small runs and special editions, while they last. (Placeholder description.)',
    rule: 'manual',
    sortOrder: 4,
    imageUrl: '/images/collections/limited-edition-pens.webp',
    imageAlt: 'An obsidian black pen with rose gold details (placeholder render)',
  },
  {
    slug: 'special-offers',
    name: 'Special Offers',
    description: 'Selected pens with reduced prices. (Placeholder description.)',
    rule: 'on_sale',
    sortOrder: 5,
    imageUrl: '/images/collections/special-offers.webp',
    imageAlt: 'A champagne gold pen under a warm spotlight (placeholder render)',
  },
  {
    slug: 'new-arrivals',
    name: 'New Arrivals',
    description: 'The latest additions to the collection. (Placeholder description.)',
    rule: 'new_arrival',
    sortOrder: 6,
    imageUrl: '/images/collections/new-arrivals.webp',
    imageAlt: 'A pearl white pen with silver trim (placeholder render)',
  },
  {
    slug: 'bestsellers',
    name: 'Bestsellers',
    description: 'Our most popular pens. (Placeholder description.)',
    rule: 'bestseller',
    sortOrder: 7,
    showOnHomepage: false,
    imageUrl: '/images/collections/autograph-pens.webp',
    imageAlt: 'A black lacquer pen (placeholder render)',
  },
] as const;

type DemoProduct = {
  name: string;
  category: (typeof DEMO_COLLECTIONS)[number]['slug'];
  penType: 'fountain' | 'rollerball' | 'ballpoint';
  colour: string;
  material: string;
  price: number | null;
  was?: number;
  stock: number | null;
  availability?: string;
  short: string;
  flags?: Partial<Record<'featured' | 'bestseller' | 'newArrival' | 'sale', boolean>>;
};

const DEMO_PRODUCTS: DemoProduct[] = [
  { name: 'Midnight Lacquer Rollerball', category: 'autograph-pens', penType: 'rollerball', colour: 'Midnight Black', material: 'Lacquer with silver-tone trim (placeholder)', price: 4500, stock: 18, short: 'A deep black lacquer rollerball with a clean silver profile.', flags: { featured: true, bestseller: true } },
  { name: 'Titanium Signature Fountain Pen', category: 'luxury-writing-pens', penType: 'fountain', colour: 'Titanium Grey', material: 'Metal body, gold-tone nib (placeholder)', price: 8900, stock: 9, short: 'Brushed titanium tones with a champagne gold nib.', flags: { bestseller: true, featured: true } },
  { name: 'Champagne Gold Ballpoint', category: 'autograph-pens', penType: 'ballpoint', colour: 'Champagne Gold', material: 'Metal with gold-tone finish (placeholder)', price: 4400, was: 5900, stock: 14, short: 'Warm champagne gold, made for signing in style.', flags: { bestseller: true, sale: true } },
  { name: 'Gunmetal Twin Pen Set', category: 'luxury-writing-pens', penType: 'rollerball', colour: 'Gunmetal', material: 'Metal with gunmetal finish (placeholder)', price: 5900, was: 7900, stock: 6, short: 'A matched pair in dark gunmetal, presented together.', flags: { bestseller: true, sale: true } },
  { name: 'Burgundy Lacquer Fountain Pen', category: 'collectable-pens', penType: 'fountain', colour: 'Burgundy', material: 'Lacquer with gold-tone trim (placeholder)', price: 12000, stock: 5, short: 'Rich burgundy lacquer with warm gold accents.', flags: { newArrival: true } },
  { name: 'Racing Green Rollerball', category: 'collectable-pens', penType: 'rollerball', colour: 'Racing Green', material: 'Lacquer with silver-tone trim (placeholder)', price: 6500, stock: 11, short: 'Heritage green with polished silver details.', flags: { newArrival: true } },
  { name: 'Sapphire Blue Ballpoint', category: 'autograph-pens', penType: 'ballpoint', colour: 'Sapphire Blue', material: 'Lacquer with silver-tone trim (placeholder)', price: 2900, was: 3900, stock: 22, short: 'Deep sapphire blue for confident signatures.', flags: { sale: true } },
  { name: 'Pearl White Rollerball', category: 'luxury-writing-pens', penType: 'rollerball', colour: 'Pearl White', material: 'Resin with silver-tone trim (placeholder)', price: 5500, stock: 8, short: 'Luminous pearl white with a crisp silver clip.', flags: { newArrival: true } },
  { name: 'Obsidian Limited Edition Fountain Pen', category: 'limited-edition-pens', penType: 'fountain', colour: 'Obsidian Black', material: 'Resin with rose-gold-tone trim (placeholder)', price: 24000, stock: 3, short: 'A dramatic obsidian finish in a small edition.', flags: { featured: true } },
  { name: 'Rose Gold Limited Edition Rollerball', category: 'limited-edition-pens', penType: 'rollerball', colour: 'Rose Gold', material: 'Metal with rose-gold-tone finish (placeholder)', price: 18000, stock: 0, short: 'Soft rose gold, numbered edition. Currently sold out.', flags: { newArrival: true } },
  { name: 'Carbon Black Ballpoint', category: 'autograph-pens', penType: 'ballpoint', colour: 'Carbon Black', material: 'Matte finish with gunmetal trim (placeholder)', price: 2400, stock: 30, short: 'Matte carbon black — understated and dependable.', flags: { bestseller: true } },
  { name: 'Silver Barley Fountain Pen', category: 'collectable-pens', penType: 'fountain', colour: 'Sterling Silver', material: 'Silver-tone engraved finish (placeholder)', price: 11000, was: 14000, stock: 4, short: 'Classic barley-pattern silver tones.', flags: { bestseller: true, sale: true } },
  { name: 'Graphite Matte Rollerball', category: 'luxury-writing-pens', penType: 'rollerball', colour: 'Graphite', material: 'Matte finish with gunmetal trim (placeholder)', price: 4900, stock: 12, short: 'Soft-touch graphite with a modern edge.' },
  { name: 'Amber Tortoise Fountain Pen', category: 'collectable-pens', penType: 'fountain', colour: 'Amber Tortoise', material: 'Resin with gold-tone trim (placeholder)', price: 9500, stock: 7, short: 'Warm amber tortoiseshell tones with gold trim.', flags: { newArrival: true } },
  { name: 'Ivory & Gold Ballpoint', category: 'autograph-pens', penType: 'ballpoint', colour: 'Ivory', material: 'Resin with gold-tone trim (placeholder)', price: 2500, was: 3500, stock: 2, short: 'Ivory body with gold accents — a timeless gift.', flags: { sale: true } },
  { name: "Midnight Collector's Edition Set", category: 'limited-edition-pens', penType: 'fountain', colour: 'Midnight Blue', material: 'To be confirmed', price: null, stock: null, availability: 'coming_soon', short: 'A collector’s presentation set. Price and release to be confirmed.' },
];

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function buildDemoProducts() {
  return DEMO_PRODUCTS.map((p, i) => ({
    slug: slugify(p.name),
    name: p.name,
    sku: `DEMO-${String(i + 1).padStart(3, '0')}`,
    category: p.category,
    shortDescription: p.short,
    description: `${p.short}\n\n${DEMO_NOTE}`,
    pricePence: p.price,
    originalPricePence: p.was ?? null,
    stockQuantity: p.stock,
    availability: p.availability ?? 'auto',
    condition: 'New (placeholder)',
    brand: 'Owner to confirm',
    penModel: 'Owner to confirm',
    penType: p.penType,
    colour: p.colour,
    material: p.material,
    dimensions: 'To be confirmed',
    packaging: 'To be confirmed',
    specifications: [
      { label: 'Writing system', value: p.penType === 'fountain' ? 'Fountain pen (placeholder)' : p.penType === 'rollerball' ? 'Rollerball (placeholder)' : 'Ballpoint (placeholder)' },
      { label: 'Refill / ink', value: 'To be confirmed' },
      { label: 'Weight', value: 'To be confirmed' },
      { label: 'Warranty', value: 'To be confirmed' },
    ],
    isFeatured: !!p.flags?.featured,
    isBestseller: !!p.flags?.bestseller,
    isNewArrival: !!p.flags?.newArrival,
    isOnSale: !!p.flags?.sale,
    isPlaceholder: true,
    status: 'active',
    sortOrder: i,
  }));
}
