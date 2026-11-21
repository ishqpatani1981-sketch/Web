'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useMediaQuery } from '@/lib/client-env';

/**
 * Premium desktop cursor: a precise dot plus a trailing ring that expands over
 * interactive elements and shows an optional label (data-cursor-label).
 * Only active on fine pointers without reduced-motion; native cursor elsewhere.
 */
export function Cursor() {
  const fine = useMediaQuery('(pointer: fine)');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const enabled = fine && !reduced;
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });
  const raf = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-custom-cursor');
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const el = (e.target as HTMLElement | null)?.closest?.('a, button, [role="button"], [data-cursor], input[type="checkbox"], input[type="radio"], label, summary, select') as HTMLElement | null;
        setHovering(!!el);
        const labelled = (e.target as HTMLElement | null)?.closest?.('[data-cursor-label]') as HTMLElement | null;
        setLabel(labelled?.dataset.cursorLabel ?? null);
      });
    };
    const leave = () => setVisible(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf.current);
    };
  }, [x, y, enabled]);

  if (!enabled) return null;
  const size = label ? 84 : hovering ? 46 : 30;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]" style={{ opacity: visible ? 1 : 0, transition: 'opacity .3s' }}>
      <motion.div className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper mix-blend-difference" style={{ x, y }} />
      <motion.div
        className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 text-[10px] uppercase tracking-[0.2em] text-ink"
        style={{ x: rx, y: ry }}
        animate={{ width: size, height: size, backgroundColor: label ? 'rgba(245,245,247,0.92)' : 'rgba(255,255,255,0)', borderColor: hovering ? 'rgba(220,199,161,0.8)' : 'rgba(255,255,255,0.35)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {label}
      </motion.div>
    </div>
  );
}
