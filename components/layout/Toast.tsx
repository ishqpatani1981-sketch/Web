'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useUi } from '@/store/shop';

export function Toast() {
  const toast = useUi((s) => s.toast);
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  const visible = toast && toast.id !== hiddenId ? toast : null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setHiddenId(toast.id), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex justify-center px-4" aria-live="polite" role="status">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.id}
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass-strong glass-edge flex items-center gap-3 rounded-full px-5 py-3 text-sm text-paper"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne text-ink">
              <Check className="h-3.5 w-3.5" />
            </span>
            {visible.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
