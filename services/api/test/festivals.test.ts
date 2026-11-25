// Festival calendar: source order, date/region filtering, next festival, operator festival weeks, translated alerts.
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp, mockDeps } from '../src/app.js';
import { clearTranslationCache } from '../src/festivals.js';
import { resolveCalendarValue } from '../src/wire.js';
import { filterFestivals, nextFestival, normalizeCalendar, pickCalendar, tripDateFor, festivalWindows } from '../../../shared/festivals/calendar.js';
import { FALLBACK_FESTIVALS } from '../../../shared/festivals/fallback.js';
import type { SarvamClient } from '../src/sarvam/client.js';

beforeEach(() => clearTranslationCache());

describe('calendar logic', () => {
  it('keeps the traveller\'s own festivals first, then national, inside the date range', () => {
    const out = filterFestivals(FALLBACK_FESTIVALS, { state: 'Tamil Nadu', from: '2027-01-01', to: '2027-01-31' });
    expect(out.map((f) => f.id)).toEqual(['bhogi-2027', 'pongal-2027', 'newyear-2027', 'republic-day-2027']);
    expect(out.some((f) => f.id === 'sankranti-2027')).toBe(false); // Karnataka-style Sankranti is not Tamil Nadu's
  });

  it('ranks festivals of the traveller sub-region first; other sub-regions of the state still see them', () => {
    const list = normalizeCalendar([
      { id: 'x', name: 'Kambala', date: '2027-02-01', type: 'regional', states: ['Karnataka'], regions: ['Coastal Karnataka'], rushStart: '2027-01-30', rushEnd: '2027-02-02', tip: 'Book Mangaluru early.', nameLocal: 'KAMBALA' },
      { id: 'y', name: 'Earlier', date: '2027-01-20', type: 'regional', states: ['Karnataka'], regions: [] },
    ])!;
    const coastal = filterFestivals(list, { state: 'Karnataka', region: 'Coastal Karnataka' });
    expect(coastal.map((f) => [f.id, f.match])).toEqual([['x', 'region'], ['y', 'state']]);
    expect(coastal[0]).toMatchObject({ rush: { from: '2027-01-30', to: '2027-02-02' }, tips: ['Book Mangaluru early.'], nameLocal: { any: 'KAMBALA' } });
    expect(filterFestivals(list, { state: 'Karnataka', region: 'North Karnataka' }).map((f) => f.match)).toEqual(['state', 'state']);
    expect(filterFestivals(list, { state: 'Kerala' })).toHaveLength(0);
  });

  it('picks the soonest own festival and plans the trip the day before', () => {
    const f = nextFestival(FALLBACK_FESTIVALS, '2027-01-05', 'Karnataka')!;
    expect(f.id).toBe('sankranti-2027');
    expect(tripDateFor(f, '2027-01-05')).toBe('2027-01-14');
    expect(tripDateFor(f, '2027-01-15')).toBe('2027-01-15'); // never in the past
  });

  it('flag value {url} is fetched; a calendar value is used as is', async () => {
    const cal = { festivals: [{ id: 'a', name: 'A', date: '2027-01-01', type: 'national' }] };
    const fake = (async () => ({ ok: true, json: async () => cal })) as unknown as typeof fetch;
    expect(await resolveCalendarValue({ version: 'v1', url: 'https://example.test/c.json' }, fake)).toEqual(cal);
    expect(await resolveCalendarValue(JSON.stringify(cal), fake)).toEqual(cal);
  });

  it('first valid source wins; invalid Flagsmith values fall through', () => {
    const file = { festivals: [{ id: 'a', name: 'A', date: '2027-01-01', regions: ['all'] }] };
    expect(pickCalendar([['flagsmith', 'not json'], ['file', file]])?.source).toBe('file');
    expect(pickCalendar([['flagsmith', JSON.stringify(file)], ['file', null]])?.source).toBe('flagsmith');
    expect(pickCalendar([['flagsmith', { festivals: [{ id: 1 }] }]])).toBeNull();
  });

  it('sums demand vs seats over a rush window', () => {
    const w = festivalWindows(FALLBACK_FESTIVALS.filter((f) => f.id === 'sankranti-2027'),
      [{ routeId: 'R', date: '2027-01-13', want: 100, have: 40 }, { routeId: 'R', date: '2027-01-30', want: 9, have: 0 }], ['R']);
    expect(w[0]).toMatchObject({ want: 100, have: 40, gap: 60, days: 1 });
  });
});

describe('festival endpoints', () => {
  it('GET /v1/festivals filters by state and dates', async () => {
    const app = await buildApp(mockDeps());
    const res = await app.inject({ url: '/v1/festivals?state=Karnataka&from=2027-01-05&to=2027-01-31' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.source).toBe('file'); // seed/festival-calendar.json
    expect(body.festivals[0]).toMatchObject({ id: 'sankranti-2027', type: 'regional', match: 'state', rush: { from: '2027-01-13', to: '2027-01-16' } });
    expect(body.festivals[0].travelWindow).toEqual(body.festivals[0].rush); // older app screens read travelWindow
    expect(body.festivals.at(-1).id).toBe('republic-day-2027');
  });

  it('uses the Flagsmith festival_calendar value when it is valid', async () => {
    const deps = mockDeps();
    deps.remoteCalendar = async () => ({ festivals: [{ id: 'remote', name: 'Remote fest', date: '2027-02-02', type: 'national' }] });
    const res = await (await buildApp(deps)).inject({ url: '/v1/festivals?from=2027-01-01' });
    expect(res.json()).toMatchObject({ source: 'flagsmith', festivals: [{ id: 'remote' }] });
  });

  it('festival weeks for an operator show demand, seats and the gap for Sankranti', async () => {
    const res = await (await buildApp(mockDeps())).inject({ url: '/v1/partners/op-staterte/festival-weeks?from=2027-01-05' });
    expect(res.statusCode).toBe(200);
    const sank = res.json().weeks.find((w: { festivalId: string }) => w.festivalId === 'sankranti-2027');
    expect(sank.gap).toBeGreaterThan(0);
    expect(sank.days).toBeGreaterThan(0);
    expect(sank.want).toBeGreaterThan(0);
  });

  it('translates a new-bus alert with Sarvam once per language, template when Sarvam fails', async () => {
    let calls = 0;
    const deps = mockDeps();
    deps.sarvam = { translate: async (_t: string, _f: string, to: string) => { calls += 1; if (to === 'ta-IN') throw new Error('down'); return `KN:${_t}`; } } as unknown as SarvamClient;
    const app = await buildApp(deps);
    const add = await app.inject({ method: 'POST', url: '/v1/partners/op-staterte/services', payload: { routeId: 'BLR-HBL', date: '2027-01-14', count: 6 } });
    const id = add.json().alert.id;
    const kn = await app.inject({ url: `/v1/alerts/${id}/text?lang=kn-IN` });
    expect(kn.json()).toMatchObject({ source: 'cache' });
    expect(kn.json().text.startsWith('KN:')).toBe(true);
    const before = calls;
    await app.inject({ url: `/v1/alerts/${id}/text?lang=kn-IN` });
    expect(calls).toBe(before);
    const ta = await app.inject({ url: `/v1/alerts/${id}/text?lang=ta-IN` });
    expect(ta.json().source).toBe('template');
    expect((await app.inject({ url: `/v1/alerts/${id}/text?lang=xx` })).statusCode).toBe(400);
  });
});
