'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Heart, User, X } from 'lucide-react';
import { useUi } from '@/store/shop';
import type { NavCollection } from './Navbar';

export function MobileMenu({
  links,
  collections,
  originalStoreUrl,
  originalStoreName,
}: {
  links: { href: string; label: string }[];
  collections: NavCollection[];
  originalStoreUrl: string;
  originalStoreName: string;
}) {
  const { menuOpen, setMenuOpen } = useUi();
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname, setMenuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-[70] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 40px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 44px) 40px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 40px)' }}
            transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
          />
          <div className="relative flex h-full flex-col overflow-y-auto px-6 pb-10 pt-6">
            <div className="flex justify-end">
              <button onClick={() => setMenuOpen(false)} className="glass flex h-11 w-11 items-center justify-center rounded-full" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6" aria-label="Mobile">
              <ul className="space-y-1">
                {links.map((l, i) => (
                  <motion.li key={l.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                    <Link href={l.href} className="block py-2 text-[2rem] font-light uppercase tracking-tight text-paper" onClick={() => setMenuOpen(false)}>
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 space-y-6">
              <div>
                <p className="eyebrow mb-3">Collections</p>
                <div className="flex flex-wrap gap-2">
                  {collections.map((c) => (
                    <Link key={c.slug} href={`/collections/${c.slug}`} className="glass rounded-full px-4 py-2 text-sm" onClick={() => setMenuOpen(false)}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account" className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" onClick={() => setMenuOpen(false)}>
                  <User className="h-4 w-4" /> Account
                </Link>
                <Link href="/wishlist" className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" onClick={() => setMenuOpen(false)}>
                  <Heart className="h-4 w-4" /> Wishlist
                </Link>
              </div>
              <a href={originalStoreUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl border border-champagne/25 px-4 py-3 text-sm text-champagne">
                Our Original Store — {originalStoreName} <ArrowUpRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
