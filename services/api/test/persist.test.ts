// Storage adapter: two app instances sharing one fake Upstash document; Redis failures fall back to memory.
import { describe, it, expect, vi } from 'vitest';
import { buildApp, mockDeps } from '../src/app.js';
import { adapterFromEnv, merge, toData, UpstashAdapter } from '../src/persist.js';
import { createStore } from '../src/store.js';

function fakeUpstash() {
  const db = new Map<string, string>();
  const calls: string[][] = [];
  const doFetch = vi.fn(async (_url: string, init: RequestInit) => {
    const cmd = JSON.parse(String(init.body)) as string[];
    calls.push(cmd);
    if (cmd[0] === 'SET') { db.set(cmd[1], cmd[2]); return new Response('{"result":"OK"}'); }
    return new Response(JSON.stringify({ result: db.get(cmd[1]) ?? null }));
  });
  return { db, calls, adapter: new UpstashAdapter('https://example.upstash.io', 'tok', doFetch as never) };
}

const TRIP = { intent: { id: 'i', travellerId: 'trav-x', from: 'Bengaluru', to: 'Hubballi', routeId: 'BLR-HBL', dateFrom: '2027-01-14', dateTo: '2027-01-14', timeWindow: 'night', mode: 'bus', people: 1, boardingPoint: null, festivalId: null, gift: null, needsFollowUp: [], language: 'kn-IN', transcript: 't', confidence: 1, parser: 'rules' } };
const ADD = { routeId: 'BLR-HBL', date: '2027-01-14', departTime: '22:30', boardingPoint: 'MAJESTIC', seats: 40, count: 6, mode: 'bus' };

describe('storage adapter', () => {
  it('picks upstash only when both env vars exist (Vercel KV names too)', () => {
    expect(adapterFromEnv({}).kind).toBe('memory');
    expect(adapterFromEnv({ UPSTASH_REDIS_REST_URL: 'https://x' }).kind).toBe('memory');
    expect(adapterFromEnv({ UPSTASH_REDIS_REST_URL: 'https://x', UPSTASH_REDIS_REST_TOKEN: 't' }).kind).toBe('upstash');
    expect(adapterFromEnv({ KV_REST_API_URL: 'https://x', KV_REST_API_TOKEN: 't' }).kind).toBe('upstash');
  });

  it('a trip saved on instance A is counted when an operator adds buses on instance B; alerts show on A', async () => {
    const { adapter } = fakeUpstash();
    const a = await buildApp({ ...mockDeps(), persist: adapter });
    const b = await buildApp({ ...mockDeps(), persist: adapter });
    const baseline = (await (await buildApp(mockDeps())).inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: ADD })).json().notified;
    expect((await a.inject({ method: 'POST', url: '/v1/trips', payload: TRIP })).statusCode).toBe(200);
    const add = await b.inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: ADD });
    expect(add.json().notified).toBe(baseline + 1);
    const alerts = await a.inject({ url: '/v1/alerts?identity=trav-x' });
    expect(alerts.json().alerts[0].id).toBe(add.json().alert.id);
    const order = await a.inject({ method: 'POST', url: '/v1/gifts/orders', payload: { travellerId: 'trav-x', partnerId: 'shop-majestic', itemId: 'mysore-pak', qty: 1, pickupDate: '2027-01-14', readyBy: '20:00' } });
    expect((await b.inject({ url: `/v1/gifts/orders/${order.json().order.id}` })).statusCode).toBe(200);
    expect((await b.inject({ url: '/health' })).json().store).toBe('upstash');
  });

  it('redis down -> requests still work from memory', async () => {
    const down = new UpstashAdapter('https://x', 't', (async () => { throw new Error('down'); }) as never);
    const app = await buildApp({ ...mockDeps(), persist: down });
    expect((await app.inject({ method: 'POST', url: '/v1/trips', payload: TRIP })).statusCode).toBe(200);
    expect((await app.inject({ url: '/v1/alerts' })).statusCode).toBe(200);
  });

  it('merge keeps records from both sides, local wins on the same id, one trip per traveller+route+date', () => {
    const s = createStore();
    s.alerts.push({ id: 'al-1', kind: 'info', routeId: null, date: null, text: 'local', source: 'live', createdAt: '2027-01-05T10:00:00+05:30' });
    const remote = { ...toData(createStore()), alerts: [{ id: 'al-1', kind: 'info' as const, routeId: null, date: null, text: 'old', source: 'live' as const, createdAt: 'x' }, { id: 'al-2', kind: 'info' as const, routeId: null, date: null, text: 'other', source: 'live' as const, createdAt: 'x' }], counter: 9100 };
    const m = merge(remote, toData(s));
    expect(m.alerts.map((a) => a.text).sort()).toEqual(['local', 'other']);
    expect(m.counter).toBe(9100);
  });
});

describe('alerts polling for notifications', () => {
  it('since=serverTime returns only newer alerts; onlyMine filters by saved routes', async () => {
    const app = await buildApp(mockDeps());
    await app.inject({ method: 'POST', url: '/v1/trips', payload: TRIP });
    const first = await app.inject({ url: '/v1/alerts?identity=trav-x' });
    expect(first.headers['cache-control']).toBe('no-store');
    const since = first.json().serverTime as string;
    expect(since).toMatch(/^2027-/);
    const none = await app.inject({ url: `/v1/alerts?identity=trav-x&since=${encodeURIComponent(since)}` });
    expect(none.json().alerts).toHaveLength(0);
    await new Promise((r) => setTimeout(r, 1100));
    await app.inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: ADD });
    await app.inject({ method: 'POST', url: '/v1/partners/op-tnstate/services', payload: { ...ADD, routeId: 'BLR-MDU' } });
    const fresh = await app.inject({ url: `/v1/alerts?identity=trav-x&since=${encodeURIComponent(since)}&onlyMine=1` });
    expect(fresh.json().alerts.map((a: { routeId: string }) => a.routeId)).toEqual(['BLR-HBL']);
  });
});
