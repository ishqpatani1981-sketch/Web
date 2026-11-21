import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { SETTINGS_DEFAULTS, type Settings, type SettingsKey } from './defaults';

export { SETTINGS_DEFAULTS, type Settings, type SettingsKey } from './defaults';

/**
 * Coerces untrusted input into the exact shape of the default value: unknown keys are
 * dropped, types are enforced, strings are length-limited. This is the validation layer
 * for every owner-editable content block.
 */
export function coerceToShape<T>(shape: T, input: unknown): T {
  if (typeof shape === 'string') {
    return (typeof input === 'string' ? input.slice(0, 20000) : input == null ? shape : String(input).slice(0, 20000)) as T;
  }
  if (typeof shape === 'number') {
    const n = typeof input === 'number' ? input : Number(input);
    return (Number.isFinite(n) ? n : shape) as T;
  }
  if (typeof shape === 'boolean') {
    if (typeof input === 'boolean') return input as T;
    if (input === 'true' || input === 'on' || input === '1') return true as T;
    if (input === 'false' || input === 'off' || input === '0' || input === '') return false as T;
    return shape;
  }
  if (Array.isArray(shape)) {
    if (!Array.isArray(input)) return shape;
    const template = shape[0];
    return input.slice(0, 100).map((item) => (template === undefined ? String(item) : coerceToShape(template, item))) as T;
  }
  if (shape && typeof shape === 'object') {
    const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(shape as Record<string, unknown>)) {
      out[k] = k in src ? coerceToShape(v, src[k]) : v;
    }
    return out as T;
  }
  return shape;
}

export const getSettings = cache(async (): Promise<Settings> => {
  const db = await getDb();
  const rows = await db.select().from(siteSettings);
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(SETTINGS_DEFAULTS) as SettingsKey[]) {
    out[key] = stored.has(key) ? coerceToShape(SETTINGS_DEFAULTS[key], stored.get(key)) : SETTINGS_DEFAULTS[key];
  }
  return out as Settings;
});

export async function saveSetting<K extends SettingsKey>(key: K, value: unknown) {
  const clean = coerceToShape(SETTINGS_DEFAULTS[key], value);
  const db = await getDb();
  await db
    .insert(siteSettings)
    .values({ key, value: clean as object, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: clean as object, updatedAt: new Date() } });
  return clean;
}

export async function resetSetting(key: SettingsKey) {
  const db = await getDb();
  await db.delete(siteSettings).where(eq(siteSettings.key, key));
}
