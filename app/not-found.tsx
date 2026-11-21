import Link from 'next/link';
import { PenArt } from '@/components/product/PenArt';
import { Logo, Flourish } from '@/components/brand/Logo';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_45%,rgba(255,255,255,0.07),transparent_70%)]" />
      <Link href="/" className="absolute left-6 top-6" aria-label="Pens Outlet home">
        <Logo />
      </Link>
      <div className="relative h-64 w-52 animate-float" aria-hidden="true">
        <PenArt colour="Midnight Black" penType="fountain" angle={-120} className="h-full w-full" title="" />
      </div>
      <p className="eyebrow mt-2">Error 404</p>
      <h1 className="display mt-4 text-[clamp(2.4rem,7vw,5.5rem)] text-metal">This page has</h1>
      <p className="font-serif text-[clamp(2.4rem,7vw,5.5rem)] italic leading-none text-champagne">run out of ink.</p>
      <Flourish className="mt-2 w-64" gradientId="nf-flourish" />
      <p className="mt-6 max-w-md text-silver/80">The page you were looking for may have moved or no longer exists. Let’s get you back to the pens.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses('primary', 'lg')}>
          Return home
        </Link>
        <Link href="/shop" className={buttonClasses('glass', 'lg')}>
          Shop all pens
        </Link>
      </div>
    </main>
  );
}
