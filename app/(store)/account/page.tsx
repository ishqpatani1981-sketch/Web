import type { Metadata } from 'next';
import Link from 'next/link';
import { LogOut, Package, Heart, MapPin } from 'lucide-react';
import { requireCustomer } from '@/lib/auth/session';
import { listCustomerOrders, ORDER_STATUS_LABEL } from '@/lib/orders';
import { logout } from '@/actions/auth';
import { ChangePasswordForm } from '@/components/auth/AuthForms';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge, LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'My account', robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireCustomer();
  const [orders, sp] = await Promise.all([listCustomerOrders(user.id), searchParams]);
  return (
    <div className="mx-auto max-w-5xl px-5 pb-10 pt-36 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4">My account</p>
          <h1 className="display text-[clamp(2.2rem,5vw,3.8rem)] text-paper">
            {sp.welcome ? 'Welcome,' : 'Hello,'} <span className="font-serif normal-case italic text-champagne">{user.name?.split(' ')[0] ?? 'there'}.</span>
          </h1>
          <p className="mt-2 text-sm text-titanium">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {(user.role === 'admin' || user.role === 'staff') && (
            <LinkButton href="/admin" variant="outline" size="sm">
              Admin dashboard
            </LinkButton>
          )}
          <form action={logout}>
            <button className="flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-[10.5px] uppercase tracking-[0.16em] text-silver hover:text-paper">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href="/wishlist" className="glass flex items-center gap-3 rounded-2xl p-5 hover:bg-white/[0.06]">
          <Heart className="h-5 w-5 text-champagne" /> <span className="text-sm text-paper">My wishlist</span>
        </Link>
        <Link href="/track-order" className="glass flex items-center gap-3 rounded-2xl p-5 hover:bg-white/[0.06]">
          <MapPin className="h-5 w-5 text-champagne" /> <span className="text-sm text-paper">Track an order</span>
        </Link>
        <Link href="/shop" className="glass flex items-center gap-3 rounded-2xl p-5 hover:bg-white/[0.06]">
          <Package className="h-5 w-5 text-champagne" /> <span className="text-sm text-paper">Continue shopping</span>
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="mb-5 text-sm uppercase tracking-[0.22em] text-paper">
          Order history
        </h2>
        {orders.length === 0 ? (
          <p className="glass rounded-2xl p-6 text-sm text-titanium">You haven’t placed any orders while signed in yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-white/[0.03]">
                  <span>
                    <span className="block text-paper">{o.orderNumber}</span>
                    <span className="text-xs text-titanium">{formatDate(o.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {o.isDemo && <Badge tone="demo">Demo</Badge>}
                    <Badge>{ORDER_STATUS_LABEL[o.status] ?? o.status}</Badge>
                    <span className="text-paper">{formatPrice(o.totalPence)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="security-heading">
        <h2 id="security-heading" className="mb-5 text-sm uppercase tracking-[0.22em] text-paper">
          Change password
        </h2>
        <div className="glass rounded-2xl p-6">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
