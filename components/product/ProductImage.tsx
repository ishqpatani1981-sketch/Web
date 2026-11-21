import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PenArt } from './PenArt';

const OPTIMISABLE = /^\/(?!\/)|^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;

type Props = {
  src?: string | null;
  alt: string;
  colour?: string | null;
  name?: string | null;
  penType?: string | null;
  className?: string;
  sizes?: string;
  priority?: boolean;
  angle?: number;
  /** Small "image placeholder" caption shown when no photo exists. */
  showPlaceholderLabel?: boolean;
};

export function ProductImage({ src, alt, colour, name, penType, className, sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw', priority, angle, showPlaceholderLabel = false }: Props) {
  if (src) {
    return (
      <div className={cn('relative', className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={!OPTIMISABLE.test(src)} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={cn('relative', className)}>
      <PenArt colour={colour} name={name} penType={penType} angle={angle} className="absolute inset-0 h-full w-full" title={`${alt} — placeholder illustration`} />
      {showPlaceholderLabel && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-silver/60 backdrop-blur">
          Photo to follow
        </span>
      )}
    </div>
  );
}
