// In-memory demo store. Restarting the api (or POST /v1/ops/reset) resets the demo.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Alert, GiftOrder, Partner, Service, Traits, Trip } from '../../../shared/contract/src/index.js';
import { REPO_ROOT } from './seed.js';

export interface Store {
  trips: Trip[];
  alerts: Alert[];       // live alerts only (seed alerts stay in Seed)
  services: Service[];   // live services added today
  orders: GiftOrder[];   // live gift orders
  partners: Partner[];   // businesses registered from the app (v3)
  traits: Map<string, Traits>;
  counter: number;
  voiceHealthy: boolean;
  lastVoiceError?: string;
}

export function createStore(): Store {
  return { trips: [], alerts: [], services: [], orders: [], partners: [], traits: new Map(), counter: 9000, voiceHealthy: true };
}

export function resetStore(s: Store): void {
  const fresh = createStore();
  Object.assign(s, fresh);
}

export function nextId(s: Store, prefix: string): string {
  s.counter += 1;
  return `${prefix}-${s.counter}`;
}

export function snapshot(s: Store, enabled: boolean): void {
  if (!enabled) return;
  const dir = join(REPO_ROOT, 'data');
  mkdirSync(dir, { recursive: true });
  const body = { trips: s.trips, alerts: s.alerts, services: s.services, orders: s.orders };
  writeFileSync(join(dir, 'store.json'), JSON.stringify(body, null, 2));
}

/** Demo clock: the demo "today" (DEMO_TODAY) at the real IST time of day. Injectable for tests. */
export type Clock = () => string;

export function demoClock(demoToday: string): Clock {
  return () => {
    const ist = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(11, 19);
    return `${demoToday}T${ist}+05:30`;
  };
}
