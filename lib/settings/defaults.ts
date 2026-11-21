/**
 * Editable site content & configuration.
 *
 * Every value here can be changed by the owner in /admin/content and /admin/settings.
 * Defaults deliberately use "PLACEHOLDER" / "OWNER TO CONFIRM" wherever the information
 * has to come from the business owner. Nothing here is a real business claim.
 */

export const PLACEHOLDER = 'PLACEHOLDER';
export const OWNER_TO_CONFIRM = 'OWNER TO CONFIRM';

export type Cta = { label: string; href: string };

export type DeliveryOption = {
  id: string;
  name: string;
  description: string;
  pricePence: number;
  /** Order subtotal (pence) at or above which this option is free. 0 = never free. */
  freeOverPence: number;
  enabled: boolean;
  placeholder: boolean;
};

export type FaqItem = { question: string; answer: string; placeholder?: boolean };
export type WhyItem = { title: string; body: string; icon: string; placeholder?: boolean; enabled: boolean };

export const SETTINGS_DEFAULTS = {
  hero: {
    eyebrow: 'Autograph · Collectable · Luxury writing instruments',
    headlineLead: 'The art of the',
    headlineAccent: 'signature.',
    subheadline:
      'Discover exceptional writing instruments. Find the perfect pen. Make every signature unforgettable.',
    primaryCta: { label: 'Explore the collection', href: '/collections' } as Cta,
    secondaryCta: { label: 'Shop bestsellers', href: '/bestsellers' } as Cta,
  },
  announcement: {
    enabled: true,
    text: 'Welcome to the new Pens Outlet — demonstration preview. Product details, prices and policies are placeholders.',
    href: '/about',
    linkLabel: 'Learn more',
  },
  offers: {
    eyebrow: 'Special offers',
    headline: 'Exceptional pens. Exceptional offers.',
    body: 'Hand-picked reductions across our collection. Offers are subject to availability.',
    cta: { label: 'Shop the sale', href: '/offers' } as Cta,
  },
  showcase: {
    eyebrow: 'Featured instrument',
    headlineOne: 'More than a writing instrument.',
    headlineTwo: 'It’s a statement.',
    body: 'Every component considered. Every detail intentional. Scroll to see how a fine pen comes together.',
    cta: { label: 'Discover the details', href: '/shop' } as Cta,
    featuredProductSlug: '',
  },
  why: {
    eyebrow: 'Why Pens Outlet',
    headline: 'Chosen with care. Delivered with confidence.',
    items: [
      { title: 'Competitive prices', body: 'PLACEHOLDER — owner to confirm pricing promise wording.', icon: 'badge-pound-sterling', placeholder: true, enabled: true },
      { title: 'Quality products', body: 'PLACEHOLDER — owner to describe how products are selected and checked.', icon: 'gem', placeholder: true, enabled: true },
      { title: 'Secure online ordering', body: 'Payments are processed by Stripe. Card details are never stored on this website.', icon: 'shield-check', placeholder: false, enabled: true },
      { title: 'Customer service', body: 'PLACEHOLDER — owner to confirm support hours and contact channels.', icon: 'messages-square', placeholder: true, enabled: true },
      { title: 'Delivery information', body: 'PLACEHOLDER — owner to confirm couriers, timescales and costs.', icon: 'truck', placeholder: true, enabled: true },
      { title: 'Authenticity', body: 'OWNER TO CONFIRM — only display an authenticity guarantee once the owner has verified it.', icon: 'badge-check', placeholder: true, enabled: false },
    ] as WhyItem[],
  },
  newsletter: {
    headline: 'Stay in the loop.',
    body: 'Be the first to discover new arrivals, exclusive offers and special promotions.',
    consentText:
      'I would like to receive marketing emails from Pens Outlet about new arrivals, offers and promotions. I can unsubscribe at any time.',
  },
  finalCta: {
    headline: 'Find your next favourite pen.',
    cta: { label: 'Shop Pens Outlet', href: '/shop' } as Cta,
  },
  business: {
    tradingName: 'Pens Outlet',
    registeredName: OWNER_TO_CONFIRM,
    companyNumber: OWNER_TO_CONFIRM,
    vatNumber: OWNER_TO_CONFIRM,
    email: PLACEHOLDER,
    phone: PLACEHOLDER,
    address: PLACEHOLDER,
    openingHours: OWNER_TO_CONFIRM,
    originalStoreUrl: 'https://www.autographpens.co.uk/',
    originalStoreName: 'Autograph Pens',
  },
  social: {
    instagram: '',
    facebook: '',
    x: '',
    tiktok: '',
    youtube: '',
    pinterest: '',
    linkedin: '',
  },
  seo: {
    defaultTitle: 'Pens Outlet — The Art of the Signature',
    titleTemplate: '%s · Pens Outlet',
    description:
      'Autograph pens, collectable pens and luxury writing instruments. Discover exceptional pens and make every signature unforgettable.',
  },
  analytics: {
    ga4MeasurementId: '',
    metaPixelId: '',
    searchConsoleVerification: '',
  },
  delivery: {
    currency: 'GBP',
    shipsTo: ['United Kingdom'],
    options: [
      { id: 'standard', name: 'Standard UK delivery', description: 'PLACEHOLDER — courier and timescale to be confirmed by owner.', pricePence: 395, freeOverPence: 5000, enabled: true, placeholder: true },
      { id: 'express', name: 'Express UK delivery', description: 'PLACEHOLDER — courier and timescale to be confirmed by owner.', pricePence: 795, freeOverPence: 0, enabled: true, placeholder: true },
      { id: 'collection', name: 'Click & collect', description: 'OWNER TO CONFIRM — only enable if collection is offered.', pricePence: 0, freeOverPence: 0, enabled: false, placeholder: true },
    ] as DeliveryOption[],
    productPageNote:
      'Delivery and returns information is a PLACEHOLDER until confirmed by the owner. Full details will appear on the Delivery Information and Returns pages.',
  },
  checkout: {
    termsRequired: true,
    allowGuestCheckout: true,
    orderNotes: true,
  },
  payments: {
    /** Only show payment-method icons once the owner confirms which methods Stripe is set up to accept. */
    showIcons: false,
    methods: ['visa', 'mastercard', 'amex', 'apple-pay', 'google-pay'] as string[],
  },
  notifications: {
    ownerEmail: '',
    newOrder: true,
    newSubscriber: true,
    lowStock: true,
    outOfStock: true,
    contactEnquiry: true,
    failedPayment: true,
    orderUpdates: true,
    customerOrderConfirmation: true,
    customerPaymentReceipt: true,
    customerDispatch: true,
    customerDeliveryUpdate: true,
  },
  reviews: {
    provider: 'none' as 'none' | 'trustpilot' | 'reviewsio' | 'feefo' | 'judgeme' | 'other',
    widgetNote: 'Customer reviews will appear here once a review platform is connected.',
    embedId: '',
  },
  policies: {
    delivery: '',
    returns: '',
    privacy: '',
    cookies: '',
    terms: '',
    about: '',
    story: '',
  },
  faq: {
    items: [
      { question: 'How long does delivery take?', answer: 'OWNER TO CONFIRM — delivery timescales have not been provided yet.', placeholder: true },
      { question: 'Can I return a pen?', answer: 'OWNER TO CONFIRM — the returns policy has not been provided yet.', placeholder: true },
      { question: 'Are your pens genuine?', answer: 'OWNER TO CONFIRM — authenticity information to be supplied by the owner.', placeholder: true },
      { question: 'Do you offer gift wrapping or presentation boxes?', answer: 'OWNER TO CONFIRM.', placeholder: true },
      { question: 'Which payment methods do you accept?', answer: 'Payments are processed securely by Stripe. The exact payment methods accepted will be confirmed by the owner.', placeholder: true },
      { question: 'How do I track my order?', answer: 'Use the Track My Order page with your order number and email address. You will also receive email updates when your order is dispatched.', placeholder: false },
    ] as FaqItem[],
  },
};

export type Settings = typeof SETTINGS_DEFAULTS;
export type SettingsKey = keyof Settings;

/** Keys that may be exposed to any visitor. Everything else is admin-only. */
export const PUBLIC_SETTING_KEYS: SettingsKey[] = [
  'hero',
  'announcement',
  'offers',
  'showcase',
  'why',
  'newsletter',
  'finalCta',
  'business',
  'social',
  'seo',
  'analytics',
  'delivery',
  'checkout',
  'payments',
  'reviews',
  'policies',
  'faq',
];

export function isPlaceholderValue(value: string | null | undefined) {
  if (!value) return true;
  const v = value.trim().toUpperCase();
  return v === PLACEHOLDER || v === OWNER_TO_CONFIRM || v.startsWith('PLACEHOLDER') || v.startsWith('OWNER TO CONFIRM');
}
