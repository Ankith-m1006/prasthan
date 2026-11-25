import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, mockDeps } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import type { Deps } from '../src/deps.js';
import { makeAjv, assertValid } from './helpers/ajv.js';

const ajv = makeAjv();
const ADD = { routeId: 'BLR-HBL', date: '2027-01-14', departTime: '22:30', boardingPoint: 'MAJESTIC', seats: 40, count: 6, mode: 'bus' };
const HERO_INTENT = {
  id: 'int-x', travellerId: 'trav-demo', from: 'Bengaluru', to: 'Hubballi', routeId: 'BLR-HBL', dateFrom: '2027-01-14', dateTo: '2027-01-14',
  timeWindow: 'night', mode: 'bus', people: 2, boardingPoint: null, festivalId: 'sankranti-2027', gift: null, needsFollowUp: [],
  language: 'kn-IN', transcript: 't', confidence: 0.9, parser: 'rules',
};

function hasKeyDeep(x: unknown, key: string): boolean {
  if (Array.isArray(x)) return x.some((v) => hasKeyDeep(v, key));
  if (x && typeof x === 'object') return Object.entries(x).some(([k, v]) => k.toLowerCase().includes(key) || hasKeyDeep(v, key));
  return false;
}

let app: FastifyInstance;
let deps: Deps;
beforeEach(async () => {
  deps = mockDeps(loadConfig({ MOCK_ALL: '1', OPS_TOKEN: 'test-token' }));
  app = await buildApp(deps);
});

describe('options', () => {
  it('returns links in flag order, warnings, demand, and no price anywhere', async () => {
    const res = await app.inject({ url: '/v1/options?routeId=BLR-HBL&date=2027-01-14&mode=bus&people=2' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    assertValid(ajv, 'options-response.json', body);
    expect(body.links.map((l: { providerId: string }) => l.providerId)).toEqual(['ksrtc', 'redbus', 'abhibus', 'zingbus', 'flixbus']);
    expect(body.warnings.map((w: { kind: string }) => w.kind)).toEqual(['rush_night', 'tout_warning']);
    expect(body.demand).toEqual({ want: 2400, have: 880, label: 'Seeded demo data' });
    expect(hasKeyDeep(body, 'price')).toBe(false);
  });
  it('404s an unknown route with the error shape', async () => {
    const res = await app.inject({ url: '/v1/options?routeId=NOPE' });
    expect(res.statusCode).toBe(404);
    assertValid(ajv, 'api-error.json', res.json());
  });
});

describe('add buses + alerts', () => {
  it('notifies 15 seed travellers, then 16 after a saved trip', async () => {
    const first = await app.inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: ADD });
    expect(first.statusCode).toBe(200);
    assertValid(ajv, 'add-services-response.json', first.json());
    expect(first.json().notified).toBe(15);
    expect(first.json().demandAfter).toEqual({ want: 2400, have: 1120, gap: 1280 });
    const trip = await app.inject({ method: 'POST', url: '/v1/trips', payload: { intent: HERO_INTENT } });
    expect(trip.json().trip.subscribed).toBe(true);
    const second = await app.inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: ADD });
    expect(second.json().notified).toBe(16);
  });
  it('alerts include the new_service alert first, with Kannada text', async () => {
    await app.inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: ADD });
    const res = await app.inject({ url: '/v1/alerts?identity=trav-demo' });
    const alerts = res.json().alerts;
    for (const a of alerts) assertValid(ajv, 'alert.json', a);
    expect(alerts[0].kind).toBe('new_service');
    expect(alerts[0].textLocal['kn-IN']).toContain('ಹುಬ್ಬಳ್ಳಿ');
  });
  it('rejects add-buses from a sweet shop and for a foreign route', async () => {
    expect((await app.inject({ method: 'POST', url: '/v1/partners/shop-majestic/services', payload: ADD })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/v1/partners/op-tnstate/services', payload: ADD })).statusCode).toBe(400);
  });
});

describe('demand', () => {
  it('operator board has the hero cell', async () => {
    const res = await app.inject({ url: '/v1/partners/op-staterte/demand' });
    assertValid(ajv, 'demand-response.json', res.json());
    const cell = res.json().cells.find((c: { key: string }) => c.key === 'BLR-HBL|2027-01-14|night');
    expect(cell).toMatchObject({ want: 2400, have: 880, gap: 1520, suggestion: 'Add 38 buses' });
  });
  it('sweet shop groups orders by date + item and counts a live order', async () => {
    const order = await app.inject({ method: 'POST', url: '/v1/gifts/orders', payload: { travellerId: 'trav-demo', partnerId: 'shop-majestic', itemId: 'mysore-pak', qty: 2, pickupDate: '2027-01-14', readyBy: '20:00' } });
    assertValid(ajv, 'gift-order.json', order.json().order);
    const res = await app.inject({ url: '/v1/partners/shop-majestic/demand?date=2027-01-14' });
    assertValid(ajv, 'demand-response.json', res.json());
    const cell = res.json().cells.find((c: { key: string }) => c.key === 'shop-majestic|2027-01-14|mysore-pak');
    expect(cell.want).toBe(9);
    expect(cell.suggestion).toMatch(/^Prepare 9 kg Mysore pak by/);
    const keys = res.json().cells.map((c: { key: string }) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('quick commerce board answers from qc-demand', async () => {
    const res = await app.inject({ url: '/v1/partners/qc-quickcart/demand' });
    assertValid(ajv, 'demand-response.json', res.json());
    expect(res.json().cells.length).toBeGreaterThan(0);
  });
});

describe('config + ops', () => {
  it('config validates and partner traits flip partner flags', async () => {
    const res = await app.inject({ url: '/v1/config', headers: { 'x-prasthan-identity': 'op-staterte' } });
    assertValid(ajv, 'flags-view.json', res.json().flags);
    expect(res.json().flags.operator_add_service).toBe(true);
    const trav = await app.inject({ url: '/v1/config' });
    expect(trav.json().flags.operator_add_service).toBe(false);
  });
  it('ops endpoints reject a wrong token and accept the right one', async () => {
    const bad = await app.inject({ method: 'POST', url: '/v1/ops/fallback', headers: { 'x-ops-token': 'nope' }, payload: { on: true } });
    expect(bad.statusCode).toBe(401);
    assertValid(ajv, 'api-error.json', bad.json());
    expect((await app.inject({ method: 'POST', url: '/v1/ops/reset' })).statusCode).toBe(401);
    const ok = await app.inject({ method: 'POST', url: '/v1/ops/fallback', headers: { 'x-ops-token': 'test-token' }, payload: { on: true } });
    expect(ok.json()).toEqual({ fallbackActive: true, via: 'memory' });
    expect((await app.inject({ url: '/v1/config' })).json().flags.voice_fallback_offline).toBe(true);
    expect((await app.inject({ url: '/v1/ops/state' })).json().fallbackActive).toBe(true);
  });
  it('metrics expose the custom series', async () => {
    await app.inject({ url: '/health' });
    const text = (await app.inject({ url: '/metrics' })).body;
    for (const name of ['http_requests_total', 'http_request_duration_seconds', 'fallback_active']) expect(text).toContain(name);
  });
});
