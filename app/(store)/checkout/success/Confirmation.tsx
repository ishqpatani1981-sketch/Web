'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useBasket } from '@/store/shop';

/** Premium confirmation: a glass seal forms, a tick is drawn, and a signature flourish follows. */
export function ConfirmationMark({ pending }: { pending: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-36 w-36" aria-hidden="true">
      <motion.div
        className="glass glass-edge absolute inset-0 rounded-full"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(220,199,161,0.35),transparent_65%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5] }}
        transition={{ duration: 2.4, delay: 0.4 }}
      />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="#dcc7a1"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0, rotate: -90 }}
          animate={pending ? { pathLength: [0.1, 0.9, 0.1], rotate: [0, 360] } : { pathLength: 1 }}
          transition={pending ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 1.2, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
          style={{ originX: '50%', originY: '50%' }}
        />
        {!pending && (
          <motion.path
            d="M32 52 L45 64 L70 37"
            fill="none"
            stroke="#f5f5f7"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 1.1, ease: [0.65, 0, 0.35, 1] }}
          />
        )}
      </svg>
    </div>
  );
}

export function ClearBasket() {
  const clear = useBasket((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
