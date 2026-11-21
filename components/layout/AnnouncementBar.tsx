'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useIsClient } from '@/lib/client-env';
import { X } from 'lucide-react';

export function AnnouncementBar({ text, href, linkLabel }: { text: string; href?: string; linkLabel?: string }) {
  const isClient = useIsClient();
  const [dismissedNow, setDismissedNow] = useState(false);
  const key = `po-ann-${text.length}-${text.slice(0, 24)}`;
  let stored = false;
  if (isClient) {
    try {
      stored = localStorage.getItem(key) === '1';
    } catch {
      /* ignore */
    }
  }
  const hidden = dismissedNow || stored;

  useEffect(() => {
    document.documentElement.style.setProperty('--ann-h', hidden ? '0px' : '36px');
    return () => document.documentElement.style.setProperty('--ann-h', '0px');
  }, [hidden]);

  if (hidden) return null;
  return (
    <div className="relative z-40 flex h-9 items-center justify-center border-b border-white/5 bg-gradient-to-r from-midnight via-charcoal to-midnight px-10 text-center text-[11px] tracking-wide text-silver">
      <p className="truncate">
        {text}
        {href && (
          <Link href={href} className="ml-2 text-champagne underline-offset-4 hover:underline">
            {linkLabel || 'Learn more'}
          </Link>
        )}
      </p>
      <button
        onClick={() => {
          setDismissedNow(true);
          try {
            localStorage.setItem(key, '1');
          } catch {
            /* ignore */
          }
        }}
        className="absolute right-3 rounded-full p-1 text-titanium hover:text-paper"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
