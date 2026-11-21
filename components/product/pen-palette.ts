export type Tone = { dark: string; base: string; light: string; rim: string };

const BODY: Record<string, Tone> = {
  black: { dark: '#030304', base: '#16171b', light: '#727786', rim: '#2b2e37' },
  obsidian: { dark: '#000000', base: '#0c0c0f', light: '#4e4f5c', rim: '#24242c' },
  carbon: { dark: '#08090a', base: '#1d1e22', light: '#4c4f57', rim: '#2a2c31' },
  graphite: { dark: '#0e0f11', base: '#2c2e34', light: '#71757e', rim: '#3a3d44' },
  gunmetal: { dark: '#121417', base: '#3c3f47', light: '#a3a8b2', rim: '#50545d' },
  titanium: { dark: '#2a2d33', base: '#70747d', light: '#e6e8ec', rim: '#8e929b' },
  silver: { dark: '#41454c', base: '#a8acb4', light: '#ffffff', rim: '#c4c7cd' },
  champagne: { dark: '#4f3a1a', base: '#b8975f', light: '#f7e8c6', rim: '#cfb383' },
  rose: { dark: '#55291d', base: '#b97b68', light: '#f6d2c4', rim: '#cf9988' },
  burgundy: { dark: '#1c0409', base: '#5b1121', light: '#c45d70', rim: '#7a2134' },
  green: { dark: '#03120b', base: '#13402e', light: '#56a582', rim: '#1f5640' },
  sapphire: { dark: '#040b1f', base: '#142a63', light: '#6488dd', rim: '#223d85' },
  navy: { dark: '#02050d', base: '#0e1834', light: '#4b62a3', rim: '#1a2a55' },
  pearl: { dark: '#86857f', base: '#dad9d4', light: '#ffffff', rim: '#eeede9' },
  ivory: { dark: '#958a74', base: '#e7dcc6', light: '#fffaf0', rim: '#f2eadb' },
  amber: { dark: '#2a1204', base: '#7b3f12', light: '#e3a65c', rim: '#9a5420' },
};

const TRIM: Record<string, Tone> = {
  silver: { dark: '#4f535b', base: '#babdc4', light: '#ffffff', rim: '#d9dbe0' },
  gold: { dark: '#634820', base: '#c9a86a', light: '#fcedc9', rim: '#e0c591' },
  rose: { dark: '#663628', base: '#c58b77', light: '#fadacd', rim: '#dca796' },
  gunmetal: { dark: '#1b1d21', base: '#585b63', light: '#bcc0c8', rim: '#787c85' },
};

/** Picks a body + trim palette from a product's colour/name keywords. */
export function penPalette(colour?: string | null, name?: string | null) {
  const s = `${colour ?? ''} ${name ?? ''}`.toLowerCase();
  const pick = (): string => {
    if (/obsidian/.test(s)) return 'obsidian';
    if (/carbon/.test(s)) return 'carbon';
    if (/graphite/.test(s)) return 'graphite';
    if (/gunmetal|gun-metal/.test(s)) return 'gunmetal';
    if (/titanium/.test(s)) return 'titanium';
    if (/silver|sterling|chrome|steel/.test(s)) return 'silver';
    if (/rose/.test(s)) return 'rose';
    if (/champagne|gold/.test(s) && !/ivory/.test(s)) return 'champagne';
    if (/burgundy|red|ruby|wine/.test(s)) return 'burgundy';
    if (/green|emerald/.test(s)) return 'green';
    if (/sapphire|blue/.test(s) && !/midnight blue|navy/.test(s)) return 'sapphire';
    if (/navy|midnight blue/.test(s)) return 'navy';
    if (/pearl|white/.test(s)) return 'pearl';
    if (/ivory|cream/.test(s)) return 'ivory';
    if (/amber|tortoise|brown|bronze/.test(s)) return 'amber';
    return 'black';
  };
  const bodyKey = pick();
  const trimKey = /rose/.test(s)
    ? 'rose'
    : /gold|champagne|ivory|amber|tortoise|burgundy|obsidian|navy|midnight blue/.test(s)
      ? bodyKey === 'champagne'
        ? 'silver'
        : 'gold'
      : /gunmetal|graphite|carbon/.test(s)
        ? 'gunmetal'
        : 'silver';
  return { body: BODY[bodyKey], trim: TRIM[trimKey], bodyKey, trimKey };
}
