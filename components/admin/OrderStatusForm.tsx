'use client';

import { updateOrder } from '@/actions/admin/operations';
import { ORDER_STATUS_LABEL } from '@/lib/order-labels';
import { AdminForm, Field, SubmitButton, Toggle } from './ui';

export function OrderStatusForm({ id, status, trackingNumber, trackingUrl }: { id: string; status: string; trackingNumber: string | null; trackingUrl: string | null }) {
  return (
    <AdminForm action={updateOrder} className="space-y-4">
      {(pending) => (
        <>
          <input type="hidden" name="id" value={id} />
          <Field as="select" label="Order status" name="status" defaultValue={status}>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Field>
          <Field label="Tracking number" name="trackingNumber" defaultValue={trackingNumber ?? ''} />
          <Field label="Tracking link" name="trackingUrl" defaultValue={trackingUrl ?? ''} placeholder="https://" />
          <Field as="textarea" rows={3} label="Message to customer (optional)" name="customerMessage" hint="Sent as a delivery update and shown on their tracking page." />
          <Toggle label="Email the customer" name="notifyCustomer" defaultChecked hint="Dispatch notifications are sent when the status changes to Dispatched." />
          <SubmitButton pending={pending}>Update order</SubmitButton>
        </>
      )}
    </AdminForm>
  );
}
