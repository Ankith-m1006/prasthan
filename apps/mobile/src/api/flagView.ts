// Raw Flagsmith flags ({name: {enabled, value}}) -> typed FlagsView. Same rules as services/api/src/flags/defaults.ts:
// booleans come from `enabled`, JSON values are parsed, wrong or missing values fall back to the coded default.
import type { FlagsView } from '@contract';
import { DEFAULT_FLAGS } from './mockFlags';

export interface RawFlag { enabled: boolean; value: unknown }
export type RawFlags = Record<string, RawFlag | undefined>;

const ENUMS: Partial<Record<keyof FlagsView, readonly string[]>> = {
  live_data_source: ['seeded', 'context_dev'],
  reply_style: ['warm', 'short'],
};

function parse(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function sameShape(v: unknown, def: unknown): boolean {
  if (Array.isArray(def)) return Array.isArray(v);
  if (typeof def === 'object' && def !== null) return typeof v === 'object' && v !== null && !Array.isArray(v);
  return typeof v === typeof def;
}

function pick(key: keyof FlagsView, raw: RawFlag | undefined, def: unknown): unknown {
  if (typeof def === 'boolean') return raw ? raw.enabled : def;
  if (!raw || raw.value === null || raw.value === undefined || raw.value === '') return def;
  let v: unknown = raw.value;
  if (typeof def === 'object' && def !== null) v = parse(v);
  if (typeof def === 'number' && typeof v === 'string') v = Number(v);
  if (typeof v === 'number' && Number.isNaN(v)) return def;
  if (!sameShape(v, def)) return def;
  const allowed = ENUMS[key];
  if (allowed && !allowed.includes(v as string)) return def;
  if (key === 'alert_poll_seconds' && (v as number) < 1) return def;
  return v;
}

export function toFlagsView(raw: RawFlags, defaults: FlagsView = DEFAULT_FLAGS): FlagsView {
  const out = {} as Record<keyof FlagsView, unknown>;
  for (const key of Object.keys(defaults) as Array<keyof FlagsView>) out[key] = pick(key, raw[key], defaults[key]);
  const ann = raw.special_service_announcements;
  if (ann && !ann.enabled) out.special_service_announcements = [];
  return out as unknown as FlagsView;
}
