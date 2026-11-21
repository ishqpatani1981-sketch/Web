import type { Metadata } from 'next';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import { isPlaceholderValue } from '@/lib/settings/defaults';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = { title: 'Contact us', description: 'Get in touch with Pens Outlet.', alternates: { canonical: '/contact' } };

export default async function ContactPage() {
  const s = await getSettings();
  const b = s.business;
  const rows = [
    { icon: Mail, label: 'Email', value: b.email, href: `mailto:${b.email}` },
    { icon: Phone, label: 'Telephone', value: b.phone, href: `tel:${b.phone.replace(/\s/g, '')}` },
    { icon: MapPin, label: 'Address', value: b.address },
    { icon: Clock, label: 'Opening hours', value: b.openingHours },
  ];
  return (
    <>
      <PageHeader eyebrow="Customer service" title="Get in" accent="touch." description="Questions about a pen, an order or a gift? Send us a message and we will get back to you." />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <ul className="space-y-3">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="glass flex items-start gap-4 rounded-2xl p-5">
              <Icon className="mt-0.5 h-5 w-5 text-champagne" aria-hidden="true" />
              <div>
                <p className="label mb-1">{label}</p>
                {isPlaceholderValue(value) ? (
                  <p className="text-sm text-warning/80">To be confirmed by the owner</p>
                ) : href ? (
                  <a href={href} className="text-paper hover:text-champagne">
                    {value}
                  </a>
                ) : (
                  <p className="whitespace-pre-line text-paper">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="glass glass-edge rounded-[28px] p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
