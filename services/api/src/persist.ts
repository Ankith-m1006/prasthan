// Storage adapter: keeps trips / alerts / services / orders / traits shared across serverless instances.
// memory (default, tests): the in-process Store is the truth. upstash: one JSON document in Upstash Redis over its
// REST API (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, plain HTTPS, no SDK). Each request loads the document
// first; each successful write request merges its changes into the latest document before the response is sent.
// Any Redis failure is logged (no secrets) and the request carries on with the in-memory store.
import { fetchRetry } from './http.js';
import type { Store } from './store.js';
import type { Traits } from '../../../shared/contract/src/index.js';

export interface StoreData {
  trips: Store['trips']; alerts: Store['alerts']; services: Store['services']; orders: Store['orders']; partners?: Store['partners'];
  traits: Array<[string, Traits]>; counter: number;
}

export interface StorageAdapter {
  readonly kind: 'memory' | 'upstash';
  load(): Promise<StoreData | null>;
  save(data: StoreData): Promise<void>;
}

export const memoryAdapter: StorageAdapter = { kind: 'memory', load: async () => null, save: async () => {} };

const KEY = 'prasthan:store:v1';

export class UpstashAdapter implements StorageAdapter {
  readonly kind = 'upstash' as const;
  constructor(private readonly url: string, private readonly token: string, private readonly doFetch: typeof fetchRetry = fetchRetry) {}

  private async command(cmd: string[]): Promise<unknown> {
    const res = await this.doFetch(this.url.replace(/\/$/, ''), {
      method: 'POST', headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd),
    }, { timeoutMs: 2500 });
    if (!res.ok) throw new Error(`upstash returned ${res.status}`);
    return ((await res.json()) as { result?: unknown }).result ?? null;
  }

  async load(): Promise<StoreData | null> {
    const raw = await this.command(['GET', KEY]);
    return typeof raw === 'string' ? (JSON.parse(raw) as StoreData) : null;
  }

  async save(data: StoreData): Promise<void> {
    await this.command(['SET', KEY, JSON.stringify(data)]);
  }
}

export function adapterFromEnv(env = process.env): StorageAdapter {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  return url && token ? new UpstashAdapter(url, token) : memoryAdapter;
}

export function toData(s: Store): StoreData {
  return { trips: s.trips, alerts: s.alerts, services: s.services, orders: s.orders, partners: s.partners, traits: [...s.traits.entries()], counter: s.counter };
}

/** Replaces the store's shared state with the stored document (instance-only fields like voiceHealthy are kept). */
export function hydrate(s: Store, d: StoreData): void {
  s.trips = d.trips ?? []; s.alerts = d.alerts ?? []; s.services = d.services ?? []; s.orders = d.orders ?? []; s.partners = d.partners ?? [];
  s.traits = new Map(d.traits ?? []); s.counter = Math.max(s.counter, d.counter ?? 0);
}

function unionById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const out = new Map(remote.map((x) => [x.id, x]));
  for (const x of local) out.set(x.id, x);
  return [...out.values()];
}

/** Local (this request's) records win; records another instance wrote meanwhile are kept. One trip per traveller+route+date. */
export function merge(remote: StoreData | null, local: StoreData): StoreData {
  if (!remote) return local;
  const tripKey = (t: Store['trips'][number]) => `${t.intent.travellerId}|${t.intent.routeId}|${t.intent.dateFrom}`;
  const trips = new Map<string, Store['trips'][number]>();
  for (const t of unionById(remote.trips ?? [], local.trips)) {
    const prev = trips.get(tripKey(t));
    if (!prev || prev.createdAt <= t.createdAt) trips.set(tripKey(t), t);
  }
  return {
    trips: [...trips.values()], alerts: unionById(remote.alerts ?? [], local.alerts), services: unionById(remote.services ?? [], local.services),
    orders: unionById(remote.orders ?? [], local.orders), partners: unionById(remote.partners ?? [], local.partners ?? []), traits: [...new Map([...(remote.traits ?? []), ...local.traits]).entries()],
    counter: Math.max(remote.counter ?? 0, local.counter),
  };
}
