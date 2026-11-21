import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pens Outlet',
    short_name: 'Pens Outlet',
    description: 'Autograph pens, collectable pens and luxury writing instruments.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050506',
    theme_color: '#050506',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
