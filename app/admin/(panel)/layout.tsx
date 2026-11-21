import type { Metadata } from 'next';
import { count, eq } from 'drizzle-orm';
import { requirePermission, can } from '@/lib/auth/session';
import { logout } from '@/actions/auth';
import { getDb } from '@/lib/db';
import { contactMessages } from '@/lib/db/schema';
import { AdminNav, type NavItem } from '@/components/admin/AdminNav';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Pens Outlet Admin' }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission('dashboard:view');
  const db = await getDb();
  const [{ value: newMessages }] = await db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, 'new'));
  const all: (NavItem & { perm: Parameters<typeof can>[1] })[] = [
    { href: '/admin', label: 'Dashboard', icon: 'BarChart3', perm: 'dashboard:view' },
    { href: '/admin/orders', label: 'Orders', icon: 'ShoppingCart', perm: 'orders:manage' },
    { href: '/admin/products', label: 'Products', icon: 'Package', perm: 'products:manage' },
    { href: '/admin/categories', label: 'Collections', icon: 'FolderTree', perm: 'products:manage' },
    { href: '/admin/customers', label: 'Customers', icon: 'Users', perm: 'users:manage' },
    { href: '/admin/messages', label: 'Messages', icon: 'MessageSquare', perm: 'messages:manage', badge: newMessages },
    { href: '/admin/marketing', label: 'Promotions & codes', icon: 'Megaphone', perm: 'marketing:manage' },
    { href: '/admin/newsletter', label: 'Newsletter', icon: 'Mail', perm: 'marketing:manage' },
    { href: '/admin/content', label: 'Website content', icon: 'LayoutTemplate', perm: 'content:manage' },
    { href: '/admin/emails', label: 'Email outbox', icon: 'Inbox', perm: 'settings:manage' },
    { href: '/admin/launch', label: 'Launch checklist', icon: 'Rocket', perm: 'settings:manage' },
    { href: '/admin/settings', label: 'Settings', icon: 'Settings', perm: 'settings:manage' },
  ];
  const items = all.filter((i) => can(user.role, i.perm)).map(({ perm: _p, ...rest }) => rest);
  return (
    <div className="min-h-dvh bg-[#08090b]">
      <AdminNav items={items} user={{ name: user.name, email: user.email, role: user.role }} logout={logout} />
      <main className="px-4 py-8 sm:px-8 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
