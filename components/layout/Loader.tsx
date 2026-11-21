'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FLOURISH_PATH, NibMark } from '@/components/brand/Logo';

/**
 * Brand intro shown once per browser session: a signature flourish draws itself and the
 * wordmark resolves before the curtain lifts. Skipped for reduced-motion users and
 * capped at ~1.6s so it never meaningfully delays the shop.
 */
export function Loader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('po-intro') === '1';
      sessionStorage.setItem('po-intro', '1');
    } catch {
      seen = true;
    }
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver) return;
    const start = requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => setShow(false), 1650);
    return () => {
      cancelAnimationFrame(start);
      clearTimeout(t);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink"
          initial={{ clipPath: 'inset(0 0 0 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
          aria-hidden="true"
          onClick={() => setShow(false)}
        >
          <div className="flex flex-col items-center">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <NibMark className="h-12 w-12" />
            </motion.div>
            <motion.p
              className="mt-6 text-sm font-medium text-paper"
              initial={{ opacity: 0, letterSpacing: '0.9em' }}
              animate={{ opacity: 1, letterSpacing: '0.5em' }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              PENS OUTLET
            </motion.p>
            <svg viewBox="0 0 400 80" className="mt-2 w-64" fill="none">
              <motion.path
                d={FLOURISH_PATH}
                stroke="#dcc7a1"
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.2 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
              />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
