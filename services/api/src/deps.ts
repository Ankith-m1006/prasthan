// Everything a route needs, injected (tests build their own).
import type { Config } from './config.js';
import type { FlagsProvider } from './flags/defaults.js';
import type { Metrics } from './metrics.js';
import type { Seed } from './seed.js';
import type { Clock, Store } from './store.js';
import type { StorageAdapter } from './persist.js';
import type { SarvamClient } from './sarvam/client.js';
import type { Traits } from '../../../shared/contract/src/index.js';

/** Turns the ops fallback switch on/off (Flagsmith Admin API in live mode, memory in mock). */
export interface OpsSwitch {
  setFallback(on: boolean): Promise<'flagsmith' | 'memory'>;
}

export interface Deps {
  config: Config;
  seed: Seed;
  store: Store;
  flags: FlagsProvider;
  ops: OpsSwitch;
  metrics: Metrics;
  clock: Clock;
  /** Shared storage across instances (Upstash Redis); omitted or memory = in-process store only. */
  persist?: StorageAdapter;
  /** Live Sarvam client for alert translation; omitted = template texts only. */
  sarvam?: SarvamClient;
  /** Raw Flagsmith `festival_calendar` value (remote config); omitted or null = file / built-in calendar. */
  remoteCalendar?: () => Promise<unknown>;
}

export function traitsFor(deps: Deps, identity: string): Traits {
  const saved = deps.store.traits.get(identity);
  if (saved) return saved;
  const partner = deps.seed.partners.find((p) => p.id === identity);
  if (partner) return { role: 'partner', partner_type: partner.type, partner_id: partner.id };
  return { role: 'traveller', language: 'kn-IN', home_state: 'Karnataka' };
}

export function identityOf(header: string | string[] | undefined, fallback = 'trav-demo'): string {
  const v = Array.isArray(header) ? header[0] : header;
  return v && v.trim() ? v.trim().slice(0, 80) : fallback;
}

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}
