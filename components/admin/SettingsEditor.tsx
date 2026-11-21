'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { saveSettingsSection } from '@/actions/admin/operations';
import { AdminForm, SubmitButton } from './ui';
import { cn } from '@/lib/utils';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const LONG_KEYS = /body|text|subheadline|description|consentText|answer|note|address|delivery|returns|privacy|cookies|terms|about|story|subtitle|widgetNote/i;
const LABELS: Record<string, string> = {
  ga4MeasurementId: 'Google Analytics 4 measurement ID (G-XXXXXXX)',
  metaPixelId: 'Meta Pixel ID',
  searchConsoleVerification: 'Google Search Console verification code',
  ownerEmail: 'Owner notification email',
  freeOverPence: 'Free over (£, 0 = never)',
  pricePence: 'Price (£)',
  href: 'Link',
  ctaHref: 'Link',
  originalStoreUrl: 'Original store URL',
  x: 'X (Twitter)',
  shipsTo: 'Countries delivered to',
  termsRequired: 'Require terms acceptance',
  showIcons: 'Show payment icons in the footer',
  embedId: 'Review widget ID',
  titleTemplate: 'Page title template (%s = page name)',
};

function humanise(key: string) {
  return LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

function blankLike(v: Json): Json {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  return null;
}

function Editor({ path, value, onChange, template }: { path: string; value: Json; onChange: (v: Json) => void; template?: Json }) {
  const key = path.split('.').pop() ?? path;
  const id = `se-${path.replace(/[^a-z0-9]/gi, '-')}`;

  if (typeof value === 'boolean') {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-sm text-paper">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#dcc7a1]" />
        {humanise(key)}
      </label>
    );
  }
  if (typeof value === 'number') {
    const money = /Pence$/.test(key);
    return (
      <div>
        <label htmlFor={id} className="label">
          {humanise(key)}
        </label>
        <input id={id} type="number" step={money ? '0.01' : '1'} min={0} className="field" value={money ? value / 100 : value} onChange={(e) => onChange(money ? Math.round(Number(e.target.value) * 100) : Number(e.target.value))} />
      </div>
    );
  }
  if (typeof value === 'string') {
    const long = LONG_KEYS.test(key) || value.length > 90;
    const policy = /delivery|returns|privacy|cookies|terms|about|story/.test(key) && path.startsWith('policies');
    return (
      <div className={long ? 'sm:col-span-2' : ''}>
        <label htmlFor={id} className="label">
          {humanise(key)}
        </label>
        {long ? (
          <textarea id={id} className="field" rows={policy ? 12 : 3} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        {policy && <p className="mt-1 text-xs text-titanium">Leave empty to show the “owner to confirm” outline. Use “## Heading” lines and blank lines between paragraphs.</p>}
        {/PLACEHOLDER|OWNER TO CONFIRM/.test(value) && <p className="mt-1 text-xs text-warning">Contains placeholder text — replace before launch.</p>}
      </div>
    );
  }
  if (Array.isArray(value)) {
    const tpl = (template as Json[] | undefined)?.[0] ?? value[0] ?? '';
    if (typeof tpl === 'string') {
      return (
        <div className="sm:col-span-2">
          <label htmlFor={id} className="label">
            {humanise(key)} (one per line)
          </label>
          <textarea id={id} className="field" rows={3} value={(value as string[]).join('\n')} onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} />
        </div>
      );
    }
    return (
      <div className="space-y-3 sm:col-span-2">
        <p className="label">{humanise(key)}</p>
        {value.map((item, i) => (
          <div key={i} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-3 top-3 rounded-lg p-1.5 text-titanium hover:text-danger" aria-label="Remove item">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid gap-3 pr-8 sm:grid-cols-2">
              <Editor path={`${path}.${i}`} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, blankLike(tpl)])} className="flex items-center gap-1.5 text-xs text-champagne">
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </div>
    );
  }
  if (value && typeof value === 'object') {
    const isRoot = !path.includes('.');
    const entries = Object.entries(value);
    const inner = entries.map(([k, v]) => <Editor key={k} path={`${path}.${k}`} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} template={(template as Record<string, Json> | undefined)?.[k]} />);
    if (isRoot) return <>{inner}</>;
    return (
      <fieldset className="grid gap-3 rounded-2xl border border-white/[0.07] p-4 sm:col-span-2 sm:grid-cols-2">
        <legend className="px-1 text-[10.5px] uppercase tracking-[0.18em] text-titanium">{humanise(key)}</legend>
        {inner}
      </fieldset>
    );
  }
  return null;
}

export function SettingsEditor({ sectionKey, title, description, value, defaults, defaultOpen = false }: { sectionKey: string; title: string; description?: string; value: Json; defaults: Json; defaultOpen?: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Json>(value);
  const [open, setOpen] = useState(defaultOpen);
  // Re-sync with the server after a save or reset (router.refresh) without remounting,
  // so the success message stays visible.
  const serialized = JSON.stringify(value);
  const [prevSerialized, setPrevSerialized] = useState(serialized);
  if (prevSerialized !== serialized) {
    setPrevSerialized(serialized);
    setDraft(JSON.parse(serialized) as Json);
  }
  return (
    <section className="rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.015]" id={sectionKey}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6" aria-expanded={open}>
        <span>
          <span className="block text-paper">{title}</span>
          {description && <span className="mt-0.5 block text-xs text-titanium">{description}</span>}
        </span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-titanium transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-white/[0.06] p-5 sm:p-6">
          <AdminForm action={saveSettingsSection} onSuccess={() => router.refresh()}>
            {(pending) => (
              <>
                <input type="hidden" name="key" value={sectionKey} />
                <input type="hidden" name="value" value={JSON.stringify(draft)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Editor path={sectionKey} value={draft} onChange={setDraft} template={defaults} />
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <SubmitButton pending={pending}>Save {title.toLowerCase()}</SubmitButton>
                  <button
                    type="submit"
                    name="reset"
                    value="1"
                    onClick={(e) => {
                      if (!window.confirm(`Reset “${title}” to the default placeholder content?`)) e.preventDefault();
                    }}
                    className="flex items-center gap-1.5 text-xs text-titanium hover:text-paper"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
                  </button>
                </div>
              </>
            )}
          </AdminForm>
        </div>
      )}
    </section>
  );
}
