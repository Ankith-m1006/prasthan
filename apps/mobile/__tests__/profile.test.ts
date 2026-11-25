import { createProfileStore, newGuestId, parseProfile, PROFILE_KEY, type Profile } from '../src/state/profile';
import { memoryKV } from '../src/lib/storage';
import { fillFromProfile, profileTraits, travelHints, tripFromProfile } from '../src/lib/profileUse';
import { hasRoutePage, routeLink } from '../src/lib/deepLinks';
import type { TripIntent } from '@contract';

const tamil: Profile = {
  id: 'guest-abc123', name: 'Meena', language: 'ta-IN', homeState: 'Tamil Nadu', homeRouteId: 'BLR-MDU', workCity: 'Bengaluru',
  boardingPoint: 'SATELLITE', mode: 'bus', travellingWith: 'family', ageGroup: null, gender: null,
};

describe('profile store', () => {
  it('saves, reloads from the device store and resets', () => {
    const kv = memoryKV();
    const a = createProfileStore(kv);
    expect(a.get()).toBeNull();
    const seen: number[] = [];
    a.subscribe(() => seen.push(1));
    a.save(tamil);
    expect(createProfileStore(kv).get()).toEqual(tamil); // a fresh app start reads it back
    a.reset();
    expect(kv.get(PROFILE_KEY)).toBeNull();
    expect(a.get()).toBeNull();
    expect(seen).toHaveLength(2);
  });

  it('rejects broken or incomplete saved data and drops bad optional values', () => {
    expect(parseProfile('not json')).toBeNull();
    expect(parseProfile(JSON.stringify({ ...tamil, language: 'xx' }))).toBeNull();
    expect(parseProfile(JSON.stringify({ ...tamil, homeRouteId: '' }))).toBeNull();
    expect(parseProfile(JSON.stringify({ ...tamil, ageGroup: 'old', gender: 42 }))).toEqual(tamil);
  });

  it('makes guest ids', () => {
    expect(newGuestId(() => 0)).toBe('guest-000000');
    expect(newGuestId()).toMatch(/^guest-[0-9a-z]{6}$/);
  });
});

describe('profile use', () => {
  it('sends segment traits but never age or gender', () => {
    const t = profileTraits({ ...tamil, ageGroup: '60plus', gender: 'woman' });
    expect(t).toEqual({ role: 'traveller', language: 'ta-IN', home_state: 'Tamil Nadu', home_town: 'Madurai', travel_mode: 'bus', travelling_with: 'family' });
  });

  it('pre-fills a trip and fills only empty fields of a parsed one', () => {
    const trip = tripFromProfile(tamil, 'guest-abc123');
    expect(trip).toMatchObject({ routeId: 'BLR-MDU', to: 'Madurai', mode: 'bus', people: 3, boardingPoint: 'SATELLITE', needsFollowUp: ['date'] });
    const parsed: TripIntent = { ...trip, routeId: 'BLR-HBL', to: 'Hubballi', mode: null, people: 1, boardingPoint: null, dateFrom: '2027-01-15', dateTo: '2027-01-15' };
    expect(fillFromProfile(parsed, tamil)).toMatchObject({ routeId: 'BLR-HBL', mode: 'bus', people: 3, boardingPoint: 'SATELLITE', needsFollowUp: [] });
    expect(fillFromProfile(parsed, null)).toBe(parsed);
  });

  it('gives soft hints only from the optional fields, only for bus and train', () => {
    expect(travelHints(tamil, 'train')).toEqual([]);
    expect(travelHints({ ...tamil, ageGroup: '60plus' }, 'train')[0]).toMatch(/lower berth/);
    expect(travelHints({ ...tamil, travellingWith: 'elders' }, 'bus')[0]).toMatch(/Ask at booking/);
    expect(travelHints({ ...tamil, gender: 'woman' }, 'bus')[0]).toMatch(/seats for women/);
    expect(travelHints({ ...tamil, gender: 'woman', ageGroup: '60plus' }, 'air')).toEqual([]);
  });
});

describe('deep links', () => {
  it('opens checked redBus route pages and keeps the homepage otherwise', () => {
    expect(routeLink('redbus', 'https://www.redbus.in/', 'BLR-HBL')).toBe('https://www.redbus.in/bus-tickets/bangalore-to-hubli');
    expect(routeLink('redbus', 'https://www.redbus.in/', 'BLR-BGM')).toBe('https://www.redbus.in/bus-tickets/bangalore-to-belagavi');
    expect(routeLink('redbus', 'https://www.redbus.in/', 'BLR-CCU')).toBe('https://www.redbus.in/');
    expect(routeLink('abhibus', 'https://www.abhibus.com/', 'BLR-HBL')).toBe('https://www.abhibus.com/');
    expect(routeLink('redbus', 'https://www.redbus.in/', null)).toBe('https://www.redbus.in/');
    expect(hasRoutePage('redbus', 'BLR-MDU')).toBe(true);
    expect(hasRoutePage('irctc', 'BLR-MDU')).toBe(false);
  });
});
