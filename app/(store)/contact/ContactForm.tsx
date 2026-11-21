'use client';

import Link from 'next/link';
import { startTransition, useActionState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { sendContactMessage, type ContactState } from '@/actions/contact';

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, { status: 'idle', message: '' });
  if (state.status === 'success')
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status" data-testid="contact-success">
        <CheckCircle2 className="h-10 w-10 text-champagne" />
        <p className="mt-4 text-lg text-paper">{state.message}</p>
      </div>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-4 sm:grid-cols-2"
      noValidate
    >
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <Input label="Name" name="name" autoComplete="name" required />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
      <Input label="Order number (optional)" name="orderNumber" placeholder="PO-100001" />
      <Input label="Subject" name="subject" className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <label htmlFor="c-message" className="label">
          Message
        </label>
        <textarea id="c-message" name="message" rows={6} required className="field" />
      </div>
      <p className="text-xs text-titanium sm:col-span-2">
        We use your details only to reply to your enquiry. See our <Link href="/privacy" className="underline">privacy policy</Link>.
      </p>
      {state.status === 'error' && (
        <p className="text-sm text-danger sm:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="flex h-12 items-center justify-center gap-2 rounded-full bg-paper text-[11px] font-medium uppercase tracking-[0.18em] text-ink sm:col-span-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send message
      </button>
    </form>
  );
}

function Input({ label, name, className, ...rest }: React.ComponentProps<'input'> & { label: string; name: string }) {
  return (
    <div className={className}>
      <label htmlFor={`c-${name}`} className="label">
        {label}
      </label>
      <input id={`c-${name}`} name={name} className="field" {...rest} />
    </div>
  );
}
