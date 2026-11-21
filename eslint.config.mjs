import next from 'eslint-config-next';

const config = [
  ...next,
  {
    // React Three Fiber scenes mutate Three.js objects (cameras, groups, DOM label
    // transforms) inside the useFrame render loop. That imperative loop runs outside
    // React rendering by design, so the compiler's immutability rule does not apply.
    files: ['components/three/**/*.tsx'],
    rules: { 'react-hooks/immutability': 'off' },
  },
  { ignores: ['.next/**', 'node_modules/**', '.data/**', 'drizzle/**', 'next-env.d.ts'] },
];

export default config;
