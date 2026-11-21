import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'glass' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-[0.16em] transition-[transform,background-color,color,box-shadow,border-color] duration-300 ease-[var(--ease-out-quart)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary:
    'bg-paper text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_40px_-10px_rgba(220,199,161,0.55)] hover:bg-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_14px_50px_-8px_rgba(220,199,161,0.75)]',
  glass:
    'glass text-paper hover:bg-white/10 hover:border-white/20',
  ghost: 'text-silver hover:text-paper',
  outline: 'border border-white/15 text-paper hover:border-champagne/60 hover:text-champagne',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[10.5px]',
  md: 'h-11 px-6 text-[11px]',
  lg: 'h-14 px-8 text-[12px]',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size; children: ReactNode };

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = Omit<ComponentProps<typeof Link>, 'className'> & { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function LinkButton({ variant = 'primary', size = 'md', className, children, ...rest }: LinkButtonProps) {
  const href = String(rest.href);
  const external = /^https?:\/\//.test(href);
  return (
    <Link
      className={buttonClasses(variant, size, className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'sale' | 'success' | 'warning' | 'danger' | 'demo'; className?: string }) {
  const tones = {
    neutral: 'bg-white/8 text-silver border-white/10',
    gold: 'bg-champagne/12 text-champagne border-champagne/25',
    sale: 'bg-paper text-ink border-transparent',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
    danger: 'bg-danger/10 text-danger border-danger/25',
    demo: 'bg-warning/10 text-warning/90 border-warning/20',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-md', tones[tone], className)}>
      {children}
    </span>
  );
}
