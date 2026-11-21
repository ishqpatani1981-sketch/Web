'use client';

import Link from 'next/link';
import { startTransition, useActionState, useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormState } from '@/actions/admin/products';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/**
 * Admin form wrapper: dispatches the server action without React's automatic form reset
 * (so a validation error never wipes the owner's input) and shows the result.
 */
export function AdminForm({ action, children, className, onSuccess, encType }: { action: Action; children: (pending: boolean) => ReactNode; className?: string; onSuccess?: () => void; encType?: string }) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, { status: 'idle', message: '' });
  const last = useRef(state);
  useEffect(() => {
    if (state !== last.current && state.status === 'success') onSuccess?.();
    last.current = state;
  }, [state, onSuccess]);
  return (
    <form
      className={className}
      encType={encType}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name) fd.set(submitter.name, submitter.value);
        startTransition(() => dispatch(fd));
      }}
    >
      {children(pending)}
      <FormMessage state={state} />
    </form>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return null;
  const ok = state.status === 'success';
  return (
    <p role={ok ? 'status' : 'alert'} className={cn('mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm', ok ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger')}>
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      {state.message}
    </p>
  );
}

export function SubmitButton({ pending, children, variant = 'primary', name, value, className }: { pending?: boolean; children: ReactNode; variant?: 'primary' | 'ghost' | 'danger'; name?: string; value?: string; className?: string }) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors disabled:opacity-60',
        variant === 'primary' && 'bg-paper text-ink hover:bg-white',
        variant === 'ghost' && 'border border-white/15 text-paper hover:border-champagne/50',
        variant === 'danger' && 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20',
        className,
      )}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/** A small form that posts to a void server action, asking for confirmation first. */
export function ConfirmButton({ action, fields, label, confirm, variant = 'ghost', className }: { action: (fd: FormData) => Promise<void>; fields: Record<string, string>; label: ReactNode; confirm?: string; variant?: 'ghost' | 'danger' | 'link'; className?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        className={cn(
          'whitespace-nowrap',
          variant === 'link' && 'text-xs text-champagne hover:underline',
          variant === 'ghost' && 'rounded-full border border-white/12 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-silver hover:border-champagne/50 hover:text-paper',
          variant === 'danger' && 'rounded-full border border-danger/30 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em] text-danger hover:bg-danger/10',
          className,
        )}
      >
        {label}
      </button>
    </form>
  );
}

export function Card({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title && <h2 className="text-[11px] uppercase tracking-[0.22em] text-silver">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint, href, tone }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; tone?: 'warning' | 'default' }) {
  const body = (
    <div className={cn('h-full rounded-[22px] border p-5 transition-colors', tone === 'warning' ? 'border-warning/25 bg-warning/[0.05]' : 'border-white/[0.07] bg-white/[0.03]', href && 'hover:border-champagne/30')}>
      <p className="text-[10.5px] uppercase tracking-[0.2em] text-titanium">{label}</p>
      <p className="mt-3 text-3xl font-light text-paper tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-titanium">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function PageTitle({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-paper">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-titanium">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, name, error, hint, className, as = 'input', children, ...rest }: { label: string; name: string; error?: string; hint?: ReactNode; className?: string; as?: 'input' | 'textarea' | 'select'; children?: ReactNode } & Record<string, unknown>) {
  const id = `af-${name}`;
  const common = { id, name, className: 'field', 'aria-invalid': !!error, ...rest };
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {as === 'textarea' ? <textarea {...(common as React.ComponentProps<'textarea'>)} /> : as === 'select' ? <select {...(common as React.ComponentProps<'select'>)}>{children}</select> : <input {...(common as React.ComponentProps<'input'>)} />}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-titanium">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-sm text-silver">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[#dcc7a1]" />
      <span>
        <span className="text-paper">{label}</span>
        {hint && <span className="block text-xs text-titanium">{hint}</span>}
      </span>
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-success/12 text-success border-success/25',
    demo: 'bg-warning/12 text-warning border-warning/25',
    pending: 'bg-white/8 text-silver border-white/10',
    processing: 'bg-champagne/12 text-champagne border-champagne/25',
    dispatched: 'bg-sky-400/10 text-sky-300 border-sky-300/25',
    delivered: 'bg-success/12 text-success border-success/25',
    failed: 'bg-danger/12 text-danger border-danger/25',
    expired: 'bg-white/5 text-titanium border-white/10',
    cancelled: 'bg-danger/10 text-danger border-danger/20',
    refunded: 'bg-white/8 text-silver border-white/15',
    active: 'bg-success/12 text-success border-success/25',
    draft: 'bg-white/8 text-silver border-white/10',
    archived: 'bg-white/5 text-titanium border-white/10',
    subscribed: 'bg-success/12 text-success border-success/25',
    unsubscribed: 'bg-white/5 text-titanium border-white/10',
    sent: 'bg-success/12 text-success border-success/25',
    logged: 'bg-warning/12 text-warning border-warning/25',
    scheduled: 'bg-champagne/12 text-champagne border-champagne/25',
    sending: 'bg-champagne/12 text-champagne border-champagne/25',
    new: 'bg-champagne/12 text-champagne border-champagne/25',
    read: 'bg-white/8 text-silver border-white/10',
    replied: 'bg-success/12 text-success border-success/25',
  };
  return <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]', map[status] ?? 'border-white/10 bg-white/5 text-silver')}>{status.replace('_', ' ')}</span>;
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-white/[0.07]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-white/[0.03] text-[10.5px] uppercase tracking-[0.16em] text-titanium">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
