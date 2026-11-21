'use client';

import { sendTestEmail } from '@/actions/admin/operations';
import { AdminForm, SubmitButton } from './ui';

export function TestEmailForm() {
  return (
    <AdminForm action={sendTestEmail} className="max-w-lg">
      {(pending) => (
        <div className="flex gap-2">
          <input name="to" type="email" required placeholder="you@example.com" className="field h-10 py-0" aria-label="Send test to" />
          <SubmitButton pending={pending}>Send test</SubmitButton>
        </div>
      )}
    </AdminForm>
  );
}
