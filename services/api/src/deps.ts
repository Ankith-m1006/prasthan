// Everything a route needs, injected (tests build their own).
import type { Config } from './config.js';
import type { FlagsProvider } from './flags/defaults.js';
import type { Metrics } from './metrics.js';
import type { Seed } from './seed.js';
import type { Clock, Store } from './store.js';
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
