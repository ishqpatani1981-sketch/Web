import { notFound } from 'next/navigation';
import { StudioRender } from './StudioRender';

export const metadata = { robots: { index: false, follow: false } };

/**
 * Development-only "photo studio": renders the procedural 3D pen in a chosen finish and
 * pose so `scripts/render-imagery.cjs` can capture placeholder collection imagery.
 * Not available in production builds.
 */
export default async function StudioRenderPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const sp = await searchParams;
  return (
    <StudioRender
      finish={sp.finish ?? 'midnight'}
      tilt={Number(sp.tilt ?? -0.8)}
      spin={Number(sp.spin ?? 0.2)}
      cap={Number(sp.cap ?? 0.9)}
      scale={Number(sp.scale ?? 0.85)}
      x={Number(sp.x ?? 0)}
      y={Number(sp.y ?? 0)}
      warm={sp.warm === '1'}
      og={sp.og === '1'}
    />
  );
}
