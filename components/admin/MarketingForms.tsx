'use client';

import { saveDiscountCode, savePromotion, saveCampaign, campaignAction } from '@/actions/admin/operations';
import type { Campaign, DiscountCode, Promotion } from '@/lib/db/schema';
import { penceToPounds } from '@/lib/utils';
import { AdminForm, Field, SubmitButton, Toggle } from './ui';

const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

/** Converts datetime-local inputs to ISO (with the browser's timezone) before submitting. */
function isoDates(form: HTMLFormElement) {
  form.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]').forEach((el) => {
    const hidden = form.querySelector<HTMLInputElement>(`input[type="hidden"][name="${el.dataset.target}"]`);
    if (hidden) hidden.value = el.value ? new Date(el.value).toISOString() : '';
  });
}

function DateField({ label, name, value, hint }: { label: string; name: string; value?: Date | null; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={`dt-${name}`}>
        {label}
      </label>
      <input id={`dt-${name}`} type="datetime-local" data-target={name} defaultValue={local(value)} className="field" onChange={(e) => isoDates(e.currentTarget.form!)} />
      <input type="hidden" name={name} defaultValue={value ? value.toISOString() : ''} />
      {hint && <p className="mt-1 text-xs text-titanium">{hint}</p>}
    </div>
  );
}

export function DiscountForm({ code }: { code?: DiscountCode }) {
  const c = code;
  return (
    <AdminForm action={saveDiscountCode} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {(pending) => (
        <>
          <input type="hidden" name="id" value={c?.id ?? ''} />
          <Field label="Code" name="code" defaultValue={c?.code} className="uppercase" />
          <Field as="select" label="Type" name="type" defaultValue={c?.type ?? 'percent'}>
            <option value="percent">Percentage off</option>
            <option value="fixed">Fixed amount off (£)</option>
            <option value="free_delivery">Free delivery</option>
          </Field>
          <Field label="Value (% or £)" name="value" defaultValue={c ? (c.type === 'fixed' ? penceToPounds(c.value) : String(c.value)) : ''} />
          <Field label="Minimum order (£)" name="minOrder" defaultValue={c ? penceToPounds(c.minOrderPence) : ''} />
          <Field label="Maximum uses" name="maxUses" defaultValue={c?.maxUses ?? ''} hint="Blank = unlimited" />
          <DateField label="Starts" name="startsAt" value={c?.startsAt} />
          <DateField label="Ends" name="endsAt" value={c?.endsAt} />
          <Field label="Description" name="description" defaultValue={c?.description ?? ''} />
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
            <Toggle label="Active" name="active" defaultChecked={c?.active ?? true} />
            <SubmitButton pending={pending}>{c ? 'Save' : 'Create code'}</SubmitButton>
          </div>
        </>
      )}
    </AdminForm>
  );
}

export function PromotionForm({ promo }: { promo?: Promotion }) {
  const p = promo;
  return (
    <AdminForm action={savePromotion} className="grid gap-3 sm:grid-cols-2">
      {(pending) => (
        <>
          <input type="hidden" name="id" value={p?.id ?? ''} />
          <Field label="Title" name="title" defaultValue={p?.title} />
          <Field label="Badge" name="badge" defaultValue={p?.badge ?? ''} hint="e.g. “Up to 30% off” — only genuine offers" />
          <Field className="sm:col-span-2" as="textarea" rows={2} label="Subtitle" name="subtitle" defaultValue={p?.subtitle ?? ''} />
          <Field label="Button label" name="ctaLabel" defaultValue={p?.ctaLabel ?? ''} />
          <Field label="Button link" name="ctaHref" defaultValue={p?.ctaHref ?? ''} placeholder="/offers" />
          <Field as="select" label="Placement" name="placement" defaultValue={p?.placement ?? 'offers_feature'}>
            <option value="offers_feature">Special offers section (homepage + offers page)</option>
            <option value="homepage_banner">Offers page banner</option>
          </Field>
          <Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={p?.sortOrder ?? 0} />
          <DateField label="Starts at (optional)" name="startsAt" value={p?.startsAt} />
          <DateField label="Ends at" name="endsAt" value={p?.endsAt} hint="Required for a countdown" />
          <Toggle label="Active" name="active" defaultChecked={p?.active ?? true} />
          <Toggle label="Show countdown to the end date" name="countdownEnabled" defaultChecked={p?.countdownEnabled ?? false} hint="Only for a genuine deadline. Hidden automatically once it passes." />
          <div className="sm:col-span-2">
            <SubmitButton pending={pending}>{p ? 'Save promotion' : 'Create promotion'}</SubmitButton>
          </div>
        </>
      )}
    </AdminForm>
  );
}

export function CampaignForm({ campaign, types }: { campaign?: Campaign; types: { value: string; label: string }[] }) {
  const c = campaign;
  const locked = !!c?.sentAt;
  return (
    <AdminForm action={saveCampaign} className="grid gap-4 sm:grid-cols-2">
      {(pending) => (
        <fieldset disabled={locked} className="contents">
          <input type="hidden" name="id" value={c?.id ?? ''} />
          <Field label="Internal name" name="name" defaultValue={c?.name} />
          <Field as="select" label="Campaign type" name="type" defaultValue={c?.type ?? 'new_arrivals'}>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Field>
          <Field label="Email subject" name="subject" defaultValue={c?.subject} />
          <Field label="Preview text" name="preheader" defaultValue={c?.preheader ?? ''} />
          <Field className="sm:col-span-2" label="Heading" name="heading" defaultValue={c?.heading ?? ''} />
          <Field className="sm:col-span-2" as="textarea" rows={8} label="Message" name="body" defaultValue={c?.body ?? ''} hint="Plain text. Leave a blank line between paragraphs. New arrival / offer campaigns automatically include matching products." />
          <Field label="Button label" name="ctaLabel" defaultValue={c?.ctaLabel ?? ''} />
          <Field label="Button link" name="ctaHref" defaultValue={c?.ctaHref ?? ''} placeholder="/new-arrivals" />
          {!locked && (
            <div className="sm:col-span-2">
              <SubmitButton pending={pending}>{c ? 'Save campaign' : 'Create campaign'}</SubmitButton>
            </div>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}

export function CampaignActions({ campaign, subscribed }: { campaign: Campaign; subscribed: number }) {
  const sent = !!campaign.sentAt;
  return (
    <div className="space-y-6">
      <AdminForm action={campaignAction} className="space-y-2">
        {(pending) => (
          <>
            <input type="hidden" name="id" value={campaign.id} />
            <input type="hidden" name="op" value="test" />
            <label className="label" htmlFor="testEmail">
              Send a test
            </label>
            <div className="flex gap-2">
              <input id="testEmail" name="testEmail" type="email" placeholder="you@example.com" className="field h-10 py-0" />
              <SubmitButton pending={pending} variant="ghost">
                Send test
              </SubmitButton>
            </div>
          </>
        )}
      </AdminForm>
      {!sent && (
        <AdminForm action={campaignAction} className="space-y-2">
          {(pending) => (
            <>
              <input type="hidden" name="id" value={campaign.id} />
              <DateField label="Schedule for" name="scheduledAt" value={campaign.scheduledAt} />
              <div className="flex gap-2">
                <SubmitButton pending={pending} variant="ghost" name="op" value="schedule">
                  Schedule
                </SubmitButton>
                {campaign.status === 'scheduled' && (
                  <SubmitButton pending={pending} variant="ghost" name="op" value="unschedule">
                    Cancel schedule
                  </SubmitButton>
                )}
              </div>
            </>
          )}
        </AdminForm>
      )}
      {!sent && (
        <AdminForm action={campaignAction} className="space-y-2 rounded-2xl border border-champagne/20 p-4">
          {(pending) => (
            <>
              <input type="hidden" name="id" value={campaign.id} />
              <input type="hidden" name="op" value="send" />
              <p className="text-sm text-paper">Send now to {subscribed} confirmed subscriber{subscribed === 1 ? '' : 's'}</p>
              <p className="text-xs text-titanium">Every email includes an unsubscribe link. Type SEND to confirm.</p>
              <div className="flex gap-2">
                <input name="confirm" placeholder="SEND" className="field h-10 py-0 uppercase" aria-label="Type SEND to confirm" />
                <SubmitButton pending={pending}>Send campaign</SubmitButton>
              </div>
            </>
          )}
        </AdminForm>
      )}
    </div>
  );
}
