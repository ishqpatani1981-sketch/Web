'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown to a real, owner-configured end date. It renders nothing unless the date is
 * in the future, and disappears when the offer ends — it never resets or loops.
 */
export function Countdown({ endsAt, label = 'Offer ends in' }: { endsAt: string; label?: string }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  if (now === null || !Number.isFinite(end) || end <= now) return null;
  const diff = Math.floor((end - now) / 1000);
  const parts = [
    { v: Math.floor(diff / 86400), l: 'Days' },
    { v: Math.floor((diff % 86400) / 3600), l: 'Hrs' },
    { v: Math.floor((diff % 3600) / 60), l: 'Min' },
    { v: diff % 60, l: 'Sec' },
  ];
  return (
    <div className="mt-5" role="timer" aria-label={`${label} ${parts.map((p) => `${p.v} ${p.l}`).join(' ')}`}>
      <p className="eyebrow mb-2">{label}</p>
      <div className="flex gap-2" aria-hidden="true">
        {parts.map((p) => (
          <div key={p.l} className="glass min-w-14 rounded-2xl px-3 py-2 text-center">
            <span className="block font-mono text-xl tabular-nums text-paper">{String(p.v).padStart(2, '0')}</span>
            <span className="block text-[9px] uppercase tracking-[0.2em] text-titanium">{p.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
