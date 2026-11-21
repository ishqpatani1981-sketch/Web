'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PenArt } from './PenArt';
import { cn } from '@/lib/utils';

type Img = { url: string; alt: string };

export function ProductGallery({ images, name, colour, penType }: { images: Img[]; name: string; colour: string | null; penType: string | null }) {
  const placeholderViews = [-38, -64, -12];
  const slides = images.length ? images.map((img) => ({ kind: 'image' as const, img })) : placeholderViews.map((angle) => ({ kind: 'art' as const, angle }));
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = slides[index];

  return (
    <div className="lg:sticky lg:top-28">
      <div
        className="sheen relative aspect-[4/5] overflow-hidden rounded-[32px] bg-gradient-to-b from-graphite to-ink ring-1 ring-white/[0.07]"
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
        data-cursor-label={zoom ? undefined : 'Zoom'}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(255,255,255,0.08),transparent_70%)]" />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%`, transition: 'transform-origin .1s' } : undefined}
          >
            {current.kind === 'image' ? (
              <Image src={current.img.url} alt={current.img.alt || name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" unoptimized={!current.img.url.startsWith('/') && !current.img.url.includes('.supabase.co/')} />
            ) : (
              <PenArt colour={colour} name={name} penType={penType} angle={current.angle} className="h-full w-full" title={`${name} — placeholder illustration, view ${index + 1}`} />
            )}
          </motion.div>
        </AnimatePresence>
        {!images.length && (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-silver/70 backdrop-blur">
            Placeholder illustration — product photography to follow
          </span>
        )}
      </div>
      {slides.length > 1 && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
          {slides.map((s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn('relative aspect-square w-20 overflow-hidden rounded-2xl bg-graphite ring-1 transition-all', i === index ? 'ring-champagne/70' : 'opacity-60 ring-white/10 hover:opacity-100')}
            >
              {s.kind === 'image' ? (
                <Image src={s.img.url} alt="" fill sizes="80px" className="object-cover" unoptimized={!s.img.url.startsWith('/') && !s.img.url.includes('.supabase.co/')} />
              ) : (
                <PenArt colour={colour} name={name} penType={penType} angle={s.angle} stage={false} className="h-full w-full" title="" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
