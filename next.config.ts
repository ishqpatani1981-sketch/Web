import type { NextConfig } from 'next';

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.stripe.com")' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // PGlite (embedded Postgres used for the zero-config demo database) ships WASM + data files
  // that must not be bundled.
  serverExternalPackages: ['@electric-sql/pglite'],
  // PGlite loads its WASM + data files at runtime; make sure serverless traces include them
  // (only matters for demo deployments without DATABASE_URL).
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@electric-sql/pglite/dist/*.{js,cjs,wasm,data}', './node_modules/@electric-sql/pglite/dist/fs/**/*.{js,cjs}', './node_modules/@electric-sql/pglite/package.json'],
  },
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    // Product photo uploads go through Server Actions. Vercel functions accept bodies up to 4.5 MB.
    serverActions: { bodySizeLimit: '4mb' },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : []),
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
