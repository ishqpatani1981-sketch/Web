import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';
import { PolicyPage } from '@/components/content/PolicyPage';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Delivery information', alternates: { canonical: '/delivery' } };

export default async function DeliveryPage() {
  const s = await getSettings();
  return (
    <PolicyPage
      eyebrow="Customer service"
      title="Delivery"
      accent="information."
      content={s.policies.delivery}
      outline={['Couriers and services used', 'Delivery areas (UK / international)', 'Delivery costs and any free-delivery threshold', 'Dispatch and delivery timescales, cut-off times and bank holidays', 'Tracking, signature and what happens if a parcel is lost or damaged']}
    >
      <div className="mt-10">
        <p className="label">Delivery options currently configured at checkout</p>
        <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
          {s.delivery.options
            .filter((o) => o.enabled)
            .map((o) => (
              <li key={o.id} className="flex justify-between gap-4 p-4 text-sm">
                <span>
                  <span className="block text-paper">{o.name}</span>
                  <span className="text-xs text-titanium">{o.description}</span>
                </span>
                <span className="text-right text-paper">
                  {formatPrice(o.pricePence)}
                  {o.freeOverPence > 0 && <span className="block text-xs text-titanium">Free over {formatPrice(o.freeOverPence)}</span>}
                  {o.placeholder && <span className="block text-xs text-warning/80">Placeholder rate</span>}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </PolicyPage>
  );
}
