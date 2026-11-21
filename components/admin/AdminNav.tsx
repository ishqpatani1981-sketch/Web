'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Package, FolderTree, ShoppingCart, Users, MessageSquare, Megaphone, Mail, LayoutTemplate, Settings, Inbox, Menu, X, ExternalLink, type LucideIcon } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export type NavItem = { href: string; label: string; icon: string; badge?: number };

const ICONS: Record<string, LucideIcon> = { BarChart3, Package, FolderTree, ShoppingCart, Users, MessageSquare, Megaphone, Mail, LayoutTemplate, Settings, Inbox };

export function AdminNav({ items, user, logout }: { items: NavItem[]; user: { name: string | null; email: string; role: string }; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <Link href="/admin" className="px-3 py-2" onClick={() => setOpen(false)}>
        <Logo />
      </Link>
      <p className="mt-2 px-3 text-[10px] uppercase tracking-[0.3em] text-titanium">Admin</p>
      <ul className="mt-6 flex-1 space-y-0.5">
        {items.map((i) => {
          const Icon = ICONS[i.icon] ?? BarChart3;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                onClick={() => setOpen(false)}
                aria-current={active(i.href) ? 'page' : undefined}
                className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors', active(i.href) ? 'bg-white/[0.08] text-paper' : 'text-silver/80 hover:bg-white/[0.04] hover:text-paper')}
              >
                <Icon className={cn('h-4 w-4', active(i.href) ? 'text-champagne' : 'text-titanium')} />
                {i.label}
                {!!i.badge && <span className="ml-auto rounded-full bg-champagne px-1.5 text-[10px] font-semibold text-ink">{i.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-2 border-t border-white/[0.07] pt-4">
        <a href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-silver hover:text-paper">
          <ExternalLink className="h-3.5 w-3.5" /> View website
        </a>
        <div className="px-3 text-xs">
          <p className="truncate text-paper">{user.name ?? user.email}</p>
          <p className="truncate text-titanium">
            {user.email} · {user.role}
          </p>
        </div>
        <form action={logout} className="px-3">
          <button className="text-xs text-champagne hover:underline">Sign out</button>
        </form>
      </div>
    </nav>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.06] bg-midnight/80 p-4 backdrop-blur-xl lg:block">{nav}</aside>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-midnight/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="rounded-full p-2 text-silver">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-midnight p-4">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full p-2 text-silver" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
