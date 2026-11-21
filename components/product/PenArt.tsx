import { useId } from 'react';
import { penPalette, type Tone } from './pen-palette';

type Props = {
  colour?: string | null;
  name?: string | null;
  penType?: string | null;
  className?: string;
  /** Rotation of the pen in degrees. */
  angle?: number;
  /** Show the soft studio stage (glow + floor shadow). */
  stage?: boolean;
  title?: string;
};

/**
 * Studio-style vector render of a pen, used as the placeholder product image until the
 * owner supplies real photography. Cylindrical shading is built from gradients in the
 * pen's local space so it stays correct at any rotation.
 */
export function PenArt({ colour, name, penType, className, angle = -38, stage = true, title }: Props) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (s: string) => `pa${raw}${s}`;
  const { body, trim } = penPalette(colour, name);
  const type = penType === 'fountain' ? 'fountain' : penType === 'ballpoint' ? 'ballpoint' : 'rollerball';
  // Gold nib on every fountain pen.
  const nib: Tone = { dark: '#634820', base: '#c9a86a', light: '#fcedc9', rim: '#e0c591' };

  const grad = (key: string, t: Tone, matte = false) => (
    <linearGradient id={id(key)} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={t.rim} />
      <stop offset="0.08" stopColor={t.dark} />
      <stop offset="0.26" stopColor={t.base} />
      <stop offset="0.36" stopColor={t.light} stopOpacity={matte ? 0.55 : 1} />
      <stop offset="0.46" stopColor={t.base} />
      <stop offset="0.78" stopColor={t.dark} />
      <stop offset="0.93" stopColor={t.dark} />
      <stop offset="1" stopColor={t.rim} stopOpacity="0.8" />
    </linearGradient>
  );

  const B = `url(#${id('body')})`;
  const T = `url(#${id('trim')})`;

  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      {...(title === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title ?? `${name ?? 'Pen'} — placeholder illustration` })}
    >
      <defs>
        {grad('body', body, /carbon|graphite|matte/i.test(`${colour} ${name}`))}
        {grad('trim', trim)}
        {grad('nib', nib)}
        {grad('section', { dark: '#000', base: '#0d0e10', light: '#5a5d66', rim: '#1d1f24' })}
        <radialGradient id={id('glow')} cx="50%" cy="46%" r="55%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.11" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.025" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('shadow')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#000" stopOpacity="0.75" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={id('blur')} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {stage && (
        <>
          <rect width="400" height="500" fill={`url(#${id('glow')})`} />
          <ellipse cx="200" cy="418" rx="150" ry="16" fill={`url(#${id('shadow')})`} />
        </>
      )}

      <g transform={`translate(200 238) rotate(${angle})`}>
        {type === 'fountain' && (
          <>
            {/* end cap */}
            <path d="M-182 -12 Q-186 0 -182 12 L-166 15 L-166 -15 Z" fill={T} />
            {/* barrel */}
            <path d="M-166 -15.5 L58 -16.5 L58 16.5 L-166 15.5 Z" fill={B} />
            {/* band */}
            <rect x="58" y="-17.5" width="9" height="35" rx="1.5" fill={T} />
            {/* grip section */}
            <path d="M67 -14 L110 -11 L110 11 L67 14 Z" fill={`url(#${id('section')})`} />
            {/* nib */}
            <path d="M108 -11.5 C130 -11.5 150 -7 182 0 C150 7 130 11.5 108 11.5 Z" fill={`url(#${id('nib')})`} />
            <line x1="146" y1="0" x2="182" y2="0" stroke={nib.dark} strokeWidth="0.9" />
            <circle cx="144" cy="0" r="2.3" fill={nib.dark} />
            <path d="M118 -6 Q128 0 118 6" stroke={nib.dark} strokeWidth="0.7" fill="none" opacity="0.7" />
          </>
        )}

        {type === 'rollerball' && (
          <>
            {/* finial */}
            <path d="M-184 -10 Q-189 0 -184 10 L-170 14.5 L-170 -14.5 Z" fill={T} />
            {/* cap */}
            <path d="M-170 -15.5 L-32 -17 L-32 17 L-170 15.5 Z" fill={B} />
            {/* cap band */}
            <rect x="-34" y="-18" width="10" height="36" rx="1.5" fill={T} />
            {/* barrel */}
            <path d="M-24 -16.5 L158 -13.5 L158 13.5 L-24 16.5 Z" fill={B} />
            {/* end cap */}
            <path d="M158 -13.5 L176 -11 Q184 0 176 11 L158 13.5 Z" fill={T} />
            {/* clip */}
            <path d="M-168 -16 L-160 -24 L-58 -24.5 Q-52 -24.5 -52 -20 L-52 -18 L-60 -18.5 L-160 -18 Z" fill={T} />
            <circle cx="-56" cy="-21" r="4.2" fill={T} />
          </>
        )}

        {type === 'ballpoint' && (
          <>
            <path d="M-184 -10 Q-189 0 -184 10 L-170 14.5 L-170 -14.5 Z" fill={T} />
            <path d="M-170 -15.5 L-12 -16.5 L-12 16.5 L-170 15.5 Z" fill={B} />
            <rect x="-12" y="-17.5" width="9" height="35" rx="1.5" fill={T} />
            <path d="M-3 -16.5 L138 -12.5 L138 12.5 L-3 16.5 Z" fill={B} />
            <path d="M138 -12.5 L176 -3 L180 0 L176 3 L138 12.5 Z" fill={T} />
            <circle cx="181.5" cy="0" r="1.6" fill={trim.dark} />
            <path d="M-168 -16 L-160 -24 L-60 -24.5 Q-54 -24.5 -54 -20 L-54 -18 L-62 -18.5 L-160 -18 Z" fill={T} />
            <circle cx="-58" cy="-21" r="4.2" fill={T} />
          </>
        )}

        {/* specular glint along the barrel */}
        <line x1="-150" y1="-6.5" x2="140" y2="-5" stroke="#fff" strokeOpacity="0.38" strokeWidth="1.6" strokeLinecap="round" filter={`url(#${id('blur')})`} />
      </g>
    </svg>
  );
}
