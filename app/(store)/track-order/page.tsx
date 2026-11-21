import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { TrackForm } from './TrackForm';

export const metadata: Metadata = { title: 'Track my order', description: 'Check the status of your Pens Outlet order.', alternates: { canonical: '/track-order' } };

export default function TrackOrderPage() {
  return (
    <>
      <PageHeader eyebrow="Customer service" title="Track my" accent="order." description="Enter your order number (for example PO-100001) and the email address you used at checkout." />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <TrackForm />
      </div>
    </>
  );
}
