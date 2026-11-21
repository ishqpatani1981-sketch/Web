import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/settings';
import { PageHeader } from '@/components/ui/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = { title: 'FAQs', description: 'Frequently asked questions about ordering from Pens Outlet.', alternates: { canonical: '/faq' } };

export default async function FaqPage() {
  const s = await getSettings();
  const confirmed = s.faq.items.filter((i) => !i.placeholder);
  return (
    <>
      {confirmed.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: confirmed.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
          }}
        />
      )}
      <PageHeader eyebrow="Help" title="Frequently asked" accent="questions." />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="divide-y divide-white/10 border-y border-white/10">
          {s.faq.items.map((item, i) => (
            <details key={i} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-paper">
                <span className="text-lg font-light">{item.question}</span>
                <span className="text-2xl text-titanium transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className={`mt-4 text-[15px] leading-relaxed ${item.placeholder ? 'text-warning/80' : 'text-silver/85'}`}>{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 text-sm text-titanium">
          Still need help? <Link href="/contact" className="text-champagne underline">Contact us</Link>.
        </p>
      </div>
    </>
  );
}
