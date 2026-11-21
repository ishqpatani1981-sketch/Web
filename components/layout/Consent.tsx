'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie } from 'lucide-react';

type Consent = { analytics: boolean; marketing: boolean; ts: number };
const KEY = 'po-consent-v1';

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

// Tiny external store so every component sees the same consent value.
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: Consent | null = null;
function snapshot(): Consent | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = readConsent();
  }
  return cachedValue;
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}
function writeConsent(value: Consent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    cachedRaw = JSON.stringify(value);
    cachedValue = value;
  }
  listeners.forEach((l) => l());
}

/** Opens the cookie preferences panel from anywhere (e.g. the footer link). */
export function openCookieSettings() {
  window.dispatchEvent(new Event('po:cookie-settings'));
}

/**
 * UK GDPR / PECR consent manager. Analytics (GA4) and marketing (Meta Pixel) scripts are
 * only loaded after explicit opt-in. Nothing non-essential runs by default, and the
 * banner only appears when at least one tracking integration is configured.
 */
export function ConsentAndAnalytics({ ga4Id, metaPixelId }: { ga4Id?: string; metaPixelId?: string }) {
  const consent = useSyncExternalStore(subscribe, snapshot, () => null);
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const [reopened, setReopened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [detail, setDetail] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });
  const trackingConfigured = !!(ga4Id || metaPixelId);
  // The banner shows when tracking is configured and no choice has been recorded yet,
  // or when the visitor reopens it from "Cookie settings".
  const open = !dismissed && (reopened || (isClient && !consent && trackingConfigured));
  const setOpen = (v: boolean) => {
    setReopened(v);
    setDismissed(!v);
  };

  useEffect(() => {
    const reopen = () => {
      const cur = readConsent();
      setDraft({ analytics: !!cur?.analytics, marketing: !!cur?.marketing });
      setDetail(true);
      setOpen(true);
    };
    window.addEventListener('po:cookie-settings', reopen);
    return () => window.removeEventListener('po:cookie-settings', reopen);
  }, []);

  const save = (c: Omit<Consent, 'ts'>) => {
    const value = { ...c, ts: Date.now() };
    const hadTracking = consent?.analytics || consent?.marketing;
    writeConsent(value);
    setOpen(false);
    // Withdrawing consent requires a reload to unload already-running scripts.
    if (hadTracking && (!c.analytics || !c.marketing)) window.location.reload();
  };

  return (
    <>
      {ga4Id && consent?.analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('js',new Date());gtag('config',${JSON.stringify(ga4Id)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {metaPixelId && consent?.marketing && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init',${JSON.stringify(metaPixelId)});fbq('track','PageView');`}
        </Script>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed bottom-3 left-3 right-3 z-[85] sm:left-5 sm:right-auto sm:max-w-md"
            role="dialog"
            aria-label="Cookie preferences"
          >
            <div className="glass-strong glass-edge rounded-[26px] p-5">
              <div className="flex items-start gap-3">
                <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-champagne" />
                <div className="text-sm text-silver">
                  <p className="text-paper">Your privacy, your choice.</p>
                  <p className="mt-1 text-xs leading-relaxed text-titanium">
                    We use essential storage to run the shop (your basket and preferences). With your permission we would also like to use analytics and marketing cookies.{' '}
                    <Link href="/cookies" className="underline hover:text-paper">
                      Cookie policy
                    </Link>
                  </p>
                </div>
              </div>
              {detail && (
                <div className="mt-4 space-y-2">
                  <Toggle label="Essential" description="Required for the basket, checkout and security." checked disabled />
                  {ga4Id && <Toggle label="Analytics" description="Google Analytics 4 — helps us understand how the site is used." checked={draft.analytics} onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))} />}
                  {metaPixelId && <Toggle label="Marketing" description="Meta Pixel — measures advertising effectiveness." checked={draft.marketing} onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))} />}
                  {!trackingConfigured && <p className="text-xs text-titanium">No analytics or marketing cookies are currently in use.</p>}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {detail ? (
                  <button onClick={() => save(draft)} className="h-10 flex-1 rounded-full bg-paper px-4 text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
                    Save preferences
                  </button>
                ) : (
                  <>
                    <button onClick={() => save({ analytics: true, marketing: true })} className="h-10 flex-1 rounded-full bg-paper px-4 text-[11px] font-medium uppercase tracking-[0.16em] text-ink">
                      Accept all
                    </button>
                    <button onClick={() => save({ analytics: false, marketing: false })} className="h-10 flex-1 rounded-full border border-white/15 px-4 text-[11px] font-medium uppercase tracking-[0.16em] text-paper">
                      Reject all
                    </button>
                    <button onClick={() => setDetail(true)} className="h-10 w-full rounded-full px-4 text-[11px] uppercase tracking-[0.16em] text-silver hover:text-paper">
                      Manage preferences
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Toggle({ label, description, checked, onChange, disabled }: { label: string; description: string; checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] px-4 py-3">
      <span>
        <span className="block text-sm text-paper">{label}</span>
        <span className="block text-xs text-titanium">{description}</span>
      </span>
      <input type="checkbox" className="h-5 w-5 accent-[#dcc7a1]" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
    </label>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
