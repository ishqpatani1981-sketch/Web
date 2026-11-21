'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useBasketCount, useHydrated, useUi, useWishlist } from '@/store/shop';
import { cn } from '@/lib/utils';
import { MobileMenu } from './MobileMenu';

export type NavCollection = { slug: string; name: string; description: string | null };

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop All' },
  { href: '/collections', label: 'Collections', menu: 'collections' as const },
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/offers', label: 'Special Offers' },
  { href: '/about', label: 'About Us', menu: 'about' as const },
  { href: '/contact', label: 'Contact' },
];

export function Navbar({ collections, originalStoreUrl, originalStoreName }: { collections: NavCollection[]; originalStoreUrl: string; originalStoreName: string }) {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | 'collections' | 'about'>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = useBasketCount();
  const hydrated = useHydrated();
  const wishCount = useWishlist((s) => s.items.length);
  const { setBasketOpen, setSearchOpen, setMenuOpen, menuOpen } = useUi();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 500);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpenMenu(null);
  }

  const open = (m: 'collections' | 'about') => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(m);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3 pt-3 transition-[top] duration-500 sm:px-5 sm:pt-4"
        style={{ top: compact ? 0 : 'var(--ann-h, 0px)' }}
      >
        <motion.nav
          aria-label="Main"
          initial={false}
          animate={{ maxWidth: compact ? 1120 : 1320 }}
          transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          className={cn(
            'glass glass-edge pointer-events-auto flex w-full items-center justify-between rounded-full transition-[padding,background-color,box-shadow] duration-500',
            compact ? 'bg-black/45 py-2 pl-4 pr-2 sm:pl-5' : 'bg-white/[0.03] py-3 pl-5 pr-3 sm:pl-6',
          )}
        >
          <Link href="/" className="flex items-center rounded-full" aria-label="Pens Outlet — home" data-cursor="hover">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {LINKS.map((l) =>
              l.menu ? (
                <li key={l.href} className="relative" onMouseEnter={() => open(l.menu!)} onMouseLeave={scheduleClose}>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-1 rounded-full px-3.5 py-2 text-[12.5px] tracking-wide transition-colors',
                      isActive(l.href) || openMenu === l.menu ? 'text-paper' : 'text-silver/80 hover:text-paper',
                    )}
                    aria-expanded={openMenu === l.menu}
                    aria-haspopup="true"
                    onClick={() => setOpenMenu(openMenu === l.menu ? null : l.menu!)}
                    onFocus={() => open(l.menu!)}
                  >
                    {l.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openMenu === l.menu && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {openMenu === l.menu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 6, scale: 0.98, filter: 'blur(6px)' }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="glass-strong glass-edge absolute left-1/2 top-full mt-3 w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-3xl p-3"
                        onMouseEnter={() => open(l.menu!)}
                        onMouseLeave={scheduleClose}
                      >
                        {l.menu === 'collections' ? (
                          <div className="grid gap-1 sm:grid-cols-2">
                            {collections.map((c) => (
                              <Link key={c.slug} href={`/collections/${c.slug}`} className="group rounded-2xl p-3.5 transition-colors hover:bg-white/[0.06]">
                                <span className="block text-sm text-paper">{c.name}</span>
                                {c.description && <span className="mt-0.5 line-clamp-1 block text-xs text-titanium">{c.description}</span>}
                              </Link>
                            ))}
                            <Link href="/collections" className="flex items-center justify-between rounded-2xl p-3.5 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-white/[0.06] sm:col-span-2">
                              View all collections <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </div>
                        ) : (
                          <div className="grid gap-1">
                            <Link href="/about" className="rounded-2xl p-3.5 hover:bg-white/[0.06]">
                              <span className="block text-sm text-paper">About Pens Outlet</span>
                              <span className="block text-xs text-titanium">Who we are and what we offer</span>
                            </Link>
                            <Link href="/our-story" className="rounded-2xl p-3.5 hover:bg-white/[0.06]">
                              <span className="block text-sm text-paper">Our Story</span>
                              <span className="block text-xs text-titanium">How Pens Outlet came to be</span>
                            </Link>
                            <a href={originalStoreUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl p-3.5 hover:bg-white/[0.06]">
                              <span>
                                <span className="block text-sm text-paper">Our Original Store</span>
                                <span className="block text-xs text-titanium">Visit {originalStoreName}</span>
                              </span>
                              <ArrowUpRight className="h-4 w-4 text-champagne" />
                            </a>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ) : (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      'relative rounded-full px-3.5 py-2 text-[12.5px] tracking-wide transition-colors',
                      isActive(l.href) ? 'text-paper' : 'text-silver/80 hover:text-paper',
                    )}
                    aria-current={isActive(l.href) ? 'page' : undefined}
                  >
                    {isActive(l.href) && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]" transition={{ type: 'spring', stiffness: 300, damping: 32 }} />}
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <IconButton label="Search (Ctrl/⌘ K)" onClick={() => setSearchOpen(true)}>
              <Search className="h-[18px] w-[18px]" />
            </IconButton>
            <IconLink href="/account" label="Account" className="hidden sm:flex">
              <User className="h-[18px] w-[18px]" />
            </IconLink>
            <IconLink href="/wishlist" label={`Wishlist${hydrated && wishCount ? `, ${wishCount} items` : ''}`} className="hidden sm:flex">
              <Heart className="h-[18px] w-[18px]" />
              {hydrated && wishCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-champagne" />}
            </IconLink>
            <IconButton label={`Basket, ${count} item${count === 1 ? '' : 's'}`} onClick={() => setBasketOpen(true)} data-testid="basket-button">
              <ShoppingBag className="h-[18px] w-[18px]" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="count"
                    initial={{ scale: 0 }}
                    animate={{ scale: bump ? 1.35 : 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-champagne px-1 text-[10px] font-semibold text-ink"
                    data-testid="basket-count"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </IconButton>
            <IconButton label="Open menu" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
              <Menu className="h-[19px] w-[19px]" />
            </IconButton>
          </div>
        </motion.nav>
      </header>
      <MobileMenu links={LINKS} collections={collections} originalStoreUrl={originalStoreUrl} originalStoreName={originalStoreName} />
    </>
  );
}

function IconButton({ label, children, className, ...rest }: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('relative flex h-10 w-10 items-center justify-center rounded-full text-silver transition-colors hover:bg-white/[0.07] hover:text-paper', className)} {...rest}>
      {children}
    </button>
  );
}

function IconLink({ href, label, children, className }: { href: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className={cn('relative flex h-10 w-10 items-center justify-center rounded-full text-silver transition-colors hover:bg-white/[0.07] hover:text-paper', className)}>
      {children}
    </Link>
  );
}
