// Coded defaults for every flag, read from config/flagsmith/flags.json (owned by C) at start.
// Flagsmith down / mock mode => these values.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FlagsView, Traits } from '../../../../shared/contract/src/index.js';
import { REPO_ROOT } from '../seed.js';

export interface RawFlag { enabled: boolean; value: unknown }
export type RawFlags = Record<string, RawFlag>;

export interface FlagDef {
  name: string;
  type: 'boolean' | 'remote_config' | 'multivariate';
  enabled: boolean;
  default?: unknown;
  segmentOverrides?: Array<{ segment: string; value?: unknown; enabled?: boolean }>;
}

export interface FlagsProvider {
  readonly mode: 'live' | 'mock';
  getFlags(identity: string, traits: Traits): Promise<FlagsView>;
  /** Environment-level view (no identity), used by ops state. */
  getEnvFlags(): Promise<FlagsView>;
}

export function loadFlagDefs(path = join(REPO_ROOT, 'config', 'flagsmith', 'flags.json')): FlagDef[] {
  return (JSON.parse(readFileSync(path, 'utf8')) as { flags: FlagDef[] }).flags;
}

export function defaultRaw(defs: FlagDef[]): RawFlags {
  const out: RawFlags = {};
  for (const d of defs) out[d.name] = { enabled: d.enabled, value: d.default ?? null };
  return out;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Turns raw flag states into the typed FlagsView. Missing / wrong-typed values fall back to defaults. */
export function toView(raw: RawFlags, defaults: RawFlags): FlagsView {
  const val = <T>(name: string, check: (v: unknown) => boolean): T => {
    const v = raw[name]?.value;
    return (check(v) ? v : defaults[name]?.value) as T;
  };
  const on = (name: string): boolean => raw[name]?.enabled ?? defaults[name]?.enabled ?? false;
  const arr = (v: unknown) => Array.isArray(v);
  const str = (v: unknown) => typeof v === 'string' && v.length > 0;
  return {
    festival_mode: val('festival_mode', isObj),
    route_config: val('route_config', isObj),
    surge_warning: val('surge_warning', isObj),
    special_service_announcements: on('special_service_announcements') ? val('special_service_announcements', arr) : [],
    voice_enabled: on('voice_enabled'),
    voice_fallback_offline: on('voice_fallback_offline'),
    tts_model: val('tts_model', str),
    tts_speaker: val('tts_speaker', isObj),
    stt_mode: val('stt_mode', str),
    gifting_enabled: on('gifting_enabled'),
    operator_add_service: on('operator_add_service'),
    shop_orders_view: on('shop_orders_view'),
    quick_commerce_view: on('quick_commerce_view'),
    live_data_source: val('live_data_source', (v) => v === 'seeded' || v === 'context_dev'),
    deep_link_providers: val('deep_link_providers', isObj),
    alert_poll_seconds: val('alert_poll_seconds', (v) => typeof v === 'number' && v >= 1),
    reply_style: val('reply_style', (v) => v === 'warm' || v === 'short'),
  };
}
