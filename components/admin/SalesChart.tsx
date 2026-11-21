'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice } from '@/lib/utils';

export type DayPoint = { date: string; label: string; pence: number; orders: number };

// Validated against the dark admin surface (#101115): L in 0.48–0.67, chroma ≥ 0.1, contrast ≥ 3:1.
const BAR = '#b08a3c';
const GRID = 'rgba(255,255,255,0.07)';

function niceMax(v: number) {
  if (v <= 0) return 1000; // £10
  const pounds = v / 100;
  const pow = Math.pow(10, Math.floor(Math.log10(pounds)));
  const n = pounds / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow * 100;
}

function tickLabel(pence: number) {
  const pounds = pence / 100;
  return pounds >= 10000 ? `£${Math.round(pounds / 1000)}K` : `£${pounds.toLocaleString('en-GB')}`;
}

/** Single-series column chart: order value per day. Hover/focus a day for its value. */
export function SalesChart({ data, title, subtitle }: { data: DayPoint[]; title: string; subtitle?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const height = 240;
  const pad = { top: 16, right: 8, bottom: 28, left: 52 };

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(320, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.pence))), [data]);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const band = innerW / Math.max(1, data.length);
  const barW = Math.min(24, Math.max(3, band - 2)); // ≤24px, ≥2px surface gap between neighbours
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 70)));
  const total = data.reduce((s, d) => s + d.pence, 0);
  const h = hover !== null ? data[hover] : null;

  return (
    <figure>
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span>
          <span className="block text-[11px] uppercase tracking-[0.22em] text-silver">{title}</span>
          {subtitle && <span className="mt-1 block text-xs text-titanium">{subtitle}</span>}
        </span>
        <span className="text-sm text-paper tabular-nums">{formatPrice(total)} total</span>
      </figcaption>
      <div ref={wrap} className="relative">
        <svg width={width} height={height} role="group" aria-label={`${title}. ${formatPrice(total)} across ${data.length} days. Data table below.`} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-titanium text-[10px] tabular-nums">
                {tickLabel(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pad.left + i * band + (band - barW) / 2;
            const top = y(d.pence);
            const hgt = Math.max(0, pad.top + innerH - top);
            const r = Math.min(4, barW / 2, hgt);
            // Rounded data end, square at the baseline.
            const path = hgt > 0 ? `M${x},${top + hgt} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + hgt} Z` : '';
            return (
              <g key={d.date}>
                {path && <path d={path} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.4} />}
                {i % labelEvery === 0 && (
                  <text x={pad.left + i * band + band / 2} y={height - 8} textAnchor="middle" className="fill-titanium text-[10px]">
                    {d.label}
                  </text>
                )}
                {/* Hit target: the whole day column, larger than the mark */}
                <rect
                  x={pad.left + i * band}
                  y={pad.top}
                  width={band}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: ${formatPrice(d.pence)}, ${d.orders} order${d.orders === 1 ? '' : 's'}`}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
          <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
          {hover !== null && <line x1={pad.left + hover * band + band / 2} x2={pad.left + hover * band + band / 2} y1={pad.top} y2={pad.top + innerH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} pointerEvents="none" />}
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute z-10 min-w-36 rounded-xl border border-white/10 bg-charcoal/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{ left: Math.min(width - 150, Math.max(0, pad.left + hover! * band + band / 2 - 70)), top: 0 }}
            role="tooltip"
          >
            <p className="text-titanium">{h.label}</p>
            <p className="mt-0.5 flex items-center gap-2 text-paper">
              <span className="h-2 w-2 rounded-sm" style={{ background: BAR }} aria-hidden="true" />
              {formatPrice(h.pence)}
            </p>
            <p className="text-titanium">
              {h.orders} order{h.orders === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
      <details className="mt-3 text-xs text-titanium">
        <summary className="cursor-pointer hover:text-paper">Show data table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Orders</th>
              <th className="py-1 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-t border-white/5">
                <td className="py-1">{d.label}</td>
                <td className="py-1">{d.orders}</td>
                <td className="py-1 text-right tabular-nums text-silver">{formatPrice(d.pence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
