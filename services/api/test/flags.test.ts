import { describe, it, expect, vi } from 'vitest';
import { buildApp, mockDeps } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { FlagsmithAdmin, flagsmithOps } from '../src/flags/admin.js';
import { loadFlagDefs } from '../src/flags/defaults.js';
import { FlagsmithFlagsProvider, coerce, type FlagSource } from '../src/flags/flagsmith.js';
import { MockFlagsProvider, bucket } from '../src/flags/mock.js';
import { makeAjv, assertValid } from './helpers/ajv.js';

const ajv = makeAjv();
const defs = loadFlagDefs();

function fakeSource(values: Record<string, { enabled: boolean; value: unknown }>): FlagSource {
  const flags = { getFlag: (n: string) => values[n] ?? { enabled: false, value: null } };
  return { getIdentityFlags: async () => flags, getEnvironmentFlags: async () => flags };
}

describe('Flagsmith provider mapping', () => {
  it('parses JSON strings, numbers and booleans into FlagsView', async () => {
    const src = fakeSource({
      festival_mode: { enabled: true, value: JSON.stringify({ festivalId: 'republic-day-2027', title: 'Republic Day weekend', theme: 'republic', greeting: { 'en-IN': 'Happy Republic Day' } }) },
      alert_poll_seconds: { enabled: true, value: '10' },
      voice_fallback_offline: { enabled: true, value: null },
      tts_model: { enabled: true, value: 'bulbul:v4-flash' },
    });
    const view = await new FlagsmithFlagsProvider(src, defs, () => {}).getFlags('trav-1', { role: 'traveller' });
    assertValid(ajv, 'flags-view.json', view);
    expect(view.festival_mode.title).toBe('Republic Day weekend');
    expect(view.alert_poll_seconds).toBe(10);
    expect(view.voice_fallback_offline).toBe(true);
    expect(view.tts_model).toBe('bulbul:v4-flash');
  });
  it('bad JSON -> coded default and a parse-error count', async () => {
    const onErr = vi.fn();
    const src = fakeSource({ festival_mode: { enabled: true, value: '{not json' }, route_config: { enabled: true, value: '[1,2' } });
    const view = await new FlagsmithFlagsProvider(src, defs, onErr).getFlags('trav-1', {});
    expect(view.festival_mode.title).toBe('Sankranti mode');
    expect(view.route_config.featured).toEqual(['BLR-HBL', 'BLR-MDU']);
    expect(onErr).toHaveBeenCalledWith('festival_mode');
  });
  it('Flagsmith down -> defaults, never throws', async () => {
    const src: FlagSource = { getIdentityFlags: async () => { throw new Error('down'); }, getEnvironmentFlags: async () => { throw new Error('down'); } };
    const p = new FlagsmithFlagsProvider(src, defs, () => {});
    expect((await p.getFlags('x', {})).voice_enabled).toBe(true);
    expect((await p.getEnvFlags()).voice_fallback_offline).toBe(false);
  });
  it('coerce keeps types honest', () => {
    expect(coerce('5', 3)).toBe(5);
    expect(() => coerce('abc', 3)).toThrow();
    expect(coerce('', 'x')).toBeUndefined();
  });
});

describe('mock segments', () => {
  const p = new MockFlagsProvider(defs);
  it('tamil traveller -> Pongal mode', async () => {
    expect((await p.getFlags('t', { role: 'traveller', home_state: 'Tamil Nadu', language: 'ta-IN' })).festival_mode.title).toBe('Pongal mode');
    expect((await p.getFlags('k', { role: 'traveller', home_state: 'Karnataka' })).festival_mode.title).toBe('Sankranti mode');
  });
  it('odia -> bulbul:v3; partner types get their own tools', async () => {
    expect((await p.getFlags('o', { language: 'od-IN' })).tts_model).toBe('bulbul:v3');
    const op = await p.getFlags('op', { partner_type: 'bus_operator' });
    expect([op.operator_add_service, op.shop_orders_view, op.quick_commerce_view]).toEqual([true, false, false]);
    const shop = await p.getFlags('s', { partner_type: 'sweet_shop' });
    expect([shop.operator_add_service, shop.shop_orders_view]).toEqual([false, true]);
  });
  it('gifting pilot is a stable ~20% split of travellers', async () => {
    let on = 0;
    for (let i = 0; i < 500; i += 1) if ((await p.getFlags(`trav-${i}`, { role: 'traveller' })).gifting_enabled) on += 1;
    expect(on).toBeGreaterThan(60);
    expect(on).toBeLessThan(140);
    expect(bucket('trav-1', 'gifting_pilot_20pct')).toBe(bucket('trav-1', 'gifting_pilot_20pct'));
  });
});

describe('ops flip', () => {
  it('mock: /v1/ops/fallback flips what /v1/config shows, then back', async () => {
    const app = await buildApp(mockDeps(loadConfig({ MOCK_ALL: '1', OPS_TOKEN: 'x' })));
    const flip = (on: boolean) => app.inject({ method: 'POST', url: '/v1/ops/fallback', headers: { 'x-ops-token': 'x' }, payload: { on } });
    await flip(true);
    expect((await app.inject({ url: '/v1/config' })).json().flags.voice_fallback_offline).toBe(true);
    await flip(false);
    expect((await app.inject({ url: '/v1/config' })).json().flags.voice_fallback_offline).toBe(false);
  });
  it('identify stores traits; config uses them', async () => {
    const app = await buildApp(mockDeps());
    const res = await app.inject({ method: 'POST', url: '/v1/identify', payload: { identity: 'trav-demo-ta', traits: { role: 'traveller', language: 'ta-IN', home_state: 'Tamil Nadu' } } });
    expect(res.json().flags.festival_mode.title).toBe('Pongal mode');
    const cfg = await app.inject({ url: '/v1/config', headers: { 'x-prasthan-identity': 'trav-demo-ta' } });
    expect(cfg.json().festival.id).toBe('pongal-2027');
  });
  it('admin API: finds feature, finds env state, PATCHes; key only in the header', async () => {
    const calls: Array<[string, RequestInit]> = [];
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      calls.push([url, init]);
      if (url.includes('/features/?search=')) return Response.json({ results: [{ id: 7, name: 'voice_fallback_offline' }] });
      if (url.includes('/featurestates/?feature=7')) return Response.json({ results: [{ id: 99, enabled: false, feature_segment: 3, identity: null }, { id: 42, enabled: false, feature_segment: null, identity: null }] });
      return Response.json({ id: 42, enabled: true });
    });
    const admin = new FlagsmithAdmin({ adminKey: 'secret-admin', projectId: '1', environmentKey: 'envkey', baseUrl: 'https://x/api/v1', fetchImpl });
    const memory = { setFallback: vi.fn(async () => 'memory' as const) };
    const ops = flagsmithOps(admin, memory, () => {}, () => {});
    expect(await ops.setFallback(true)).toBe('flagsmith');
    expect(calls[2][0]).toBe('https://x/api/v1/environments/envkey/featurestates/42/');
    expect(calls[2][1].method).toBe('PATCH');
    expect(calls.every(([u]) => !u.includes('secret-admin'))).toBe(true);
    expect(memory.setFallback).not.toHaveBeenCalled();
  });
  it('admin API failing -> memory switch still works', async () => {
    const admin = new FlagsmithAdmin({ adminKey: 'k', projectId: '1', environmentKey: 'e', fetchImpl: vi.fn(async () => new Response('no', { status: 500 })) });
    const memory = { setFallback: vi.fn(async () => 'memory' as const) };
    const log = vi.fn();
    expect(await flagsmithOps(admin, memory, () => {}, log).setFallback(true)).toBe('memory');
    expect(log.mock.calls[0][0]).not.toContain('k ');
  });
});
