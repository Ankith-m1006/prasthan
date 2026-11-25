import { createMockClient, mockState } from '../src/api/mock';
import { miniParse } from '../src/lib/miniParse';
import { mockReply } from '../src/lib/format';

function hasKeyDeep(x: unknown, key: string): boolean {
  if (Array.isArray(x)) return x.some((v) => hasKeyDeep(v, key));
  if (x && typeof x === 'object') return Object.entries(x).some(([k, v]) => k.toLowerCase().includes(key) || hasKeyDeep(v, key));
  return typeof x === 'string' && /price|₹|rs\.?\s?\d/i.test(x);
}

describe('mock traveller flow', () => {
  it('parses the brief example and the Kannada hero line', () => {
    expect(miniParse('Going home to Hubli for Sankranti, Friday night', 'en-IN')).toMatchObject({ routeId: 'BLR-HBL', dateFrom: '2027-01-15', timeWindow: 'night' });
    const hero = miniParse('ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು', 'kn-IN');
    expect(hero).toMatchObject({ routeId: 'BLR-HBL', dateFrom: '2027-01-14', people: 2, mode: 'bus', needsFollowUp: [] });
    expect(mockReply(hero, 'ಹುಬ್ಬಳ್ಳಿ')).toBe('ಸರಿ, ಗುರುವಾರ ರಾತ್ರಿ ಹುಬ್ಬಳ್ಳಿಗೆ ಇಬ್ಬರಿಗೆ ಬಸ್. ಇಲ್ಲಿವೆ ಆಯ್ಕೆಗಳು.');
    expect(miniParse('ಊರಿಗೆ ಹೋಗ್ಬೇಕು', 'kn-IN').needsFollowUp).toEqual(['to', 'date']);
  });
  it('options have links in flag order, warnings, and no price anywhere', async () => {
    const api = createMockClient();
    const o = await api.options('BLR-HBL', '2027-01-14', 'bus', 2);
    expect(o.links.map((l) => l.providerId)).toEqual(['ksrtc', 'redbus', 'abhibus', 'zingbus', 'flixbus']);
    expect(o.warnings.map((w) => w.kind)).toEqual(['rush_night', 'tout_warning']);
    expect(o.demand).toEqual({ want: 2400, have: 880, label: 'Seeded demo data' });
    expect(hasKeyDeep(o, 'price')).toBe(false);
  });
  it('add buses notifies 15, then 16 after Alert me', async () => {
    const api = createMockClient();
    mockState.services = []; mockState.trips = []; mockState.alerts = [];
    const req = { routeId: 'BLR-HBL', date: '2027-01-14', departTime: '22:30', boardingPoint: 'MAJESTIC', seats: 40, count: 6, mode: 'bus' as const };
    expect((await api.addServices('op-staterte', req)).notified).toBe(15);
    await api.saveTrip(miniParse('ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಊರಿಗೆ ಹೋಗ್ತಾ ಇದ್ದೀನಿ, ಗುರುವಾರ ರಾತ್ರಿ, ಬಸ್ಸಲ್ಲಿ, ಇಬ್ರು', 'kn-IN'));
    const second = await api.addServices('op-staterte', req);
    expect(second.notified).toBe(16);
    expect(second.demandAfter).toEqual({ want: 2400, have: 1360, gap: 1040 });
    expect((await api.alerts()).alerts[0].kind).toBe('new_service');
  });
});
