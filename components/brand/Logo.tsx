import { cn } from '@/lib/utils';

/** Nib monogram — a stylised fountain-pen nib. */
export function NibMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nibmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e7c8" />
          <stop offset="0.5" stopColor="#c8a76d" />
          <stop offset="1" stopColor="#8d6c38" />
        </linearGradient>
      </defs>
      <path d="M16 2.5 C21.5 7 25 12 25 17.2 C25 21 22.4 24.6 16 29.5 C9.6 24.6 7 21 7 17.2 C7 12 10.5 7 16 2.5 Z" fill="none" stroke="url(#nibmark)" strokeWidth="1.6" />
      <path d="M16 13.5 L16 29" stroke="url(#nibmark)" strokeWidth="1.3" />
      <circle cx="16" cy="12.2" r="1.9" fill="url(#nibmark)" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-paper', className)}>
      <NibMark className="h-7 w-7 shrink-0" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-medium tracking-[0.42em]">PENS OUTLET</span>
        </span>
      )}
    </span>
  );
}

/** Hand-drawn signature flourish used under headlines and in the loader. */
export const FLOURISH_PATH =
  'M6 64 C 26 30, 48 14, 62 30 C 74 44, 58 70, 48 62 C 38 54, 70 22, 96 26 C 116 29, 104 62, 122 58 C 138 54, 140 28, 160 30 C 178 32, 168 60, 186 58 C 206 56, 214 30, 236 34 C 252 37, 244 58, 262 56 C 290 52, 330 44, 394 40';

export function Flourish({ className, strokeWidth = 2.2, gradientId = 'flourish-grad' }: { className?: string; strokeWidth?: number; gradientId?: string }) {
  return (
    <svg viewBox="0 0 400 80" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c8a76d" stopOpacity="0" />
          <stop offset="0.15" stopColor="#dcc7a1" />
          <stop offset="0.85" stopColor="#f3e3c3" />
          <stop offset="1" stopColor="#c8a76d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={FLOURISH_PATH} stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}
