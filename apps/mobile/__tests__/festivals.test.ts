// Festival calendar in the app: bundled list, region-first ordering, next festival, plan-my-trip pre-fill, month grid, region trait.
import { BUNDLED, filterFestivals, monthGrid, nextFestival, offlineWeeks, planTrip, shiftMonth, splitByMatch, subRegionsFor, todayIST } from '../src/lib/festivals';
import { profileTraits } from '../src/lib/profileUse';
import { parseProfile, type Profile } from '../src/state/profile';

const P: Profile = {
  id: 'guest-abc123', name: 'Ravi', language: 'kn-IN', homeState: 'Karnataka', region: 'North Karnataka', homeRouteId: 'BLR-HBL', workCity: 'Bengaluru',
  boardingPoint: 'MAJESTIC', mode: 'bus', travellingWith: 'family', ageGroup: null, gender: null,
};

describe('festival calendar', () => {
  it('bundles seed festivals plus the Dec-Apr list without duplicates', () => {
    const ids = BUNDLED.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(['sankranti-2027', 'pongal-2027', 'yugadi-2027', 'holi-2027'])); // seed/festival-calendar.json
  });

  it('lists the traveller\'s festivals before national ones', () => {
    const list = filterFestivals(BUNDLED, { state: 'Karnataka', region: 'North Karnataka', from: '2026-12-01', to: '2027-04-30' });
    const { mine, national } = splitByMatch(list);
    expect(mine.map((f) => f.id)).toEqual(expect.arrayContaining(['sankranti-2027', 'yugadi-2027']));
    expect(mine[0].match).toBe('region'); // North Karnataka festivals first
    expect(mine.some((f) => f.id === 'ugadi-2027')).toBe(false); // AP / Telangana entry
    expect(mine.some((f) => f.id === 'pongal-2027')).toBe(false);
    expect(national[0].id).toBe('christmas-2026');
    expect(list.indexOf(mine[0])).toBeLessThan(list.indexOf(national[0]));
  });

  it('next festival for Tamil Nadu in January is Bhogi/Pongal, not Karnataka-only ones', () => {
    expect(nextFestival(BUNDLED, '2027-01-10', 'Tamil Nadu')?.id).toBe('bhogi-2027');
    expect(nextFestival(BUNDLED, '2027-01-10', 'Karnataka')?.id).toBe('sankranti-2027');
  });

  it('"Plan my trip home" pre-fills home town and the day before the festival', () => {
    const f = BUNDLED.find((x) => x.id === 'sankranti-2027')!;
    const trip = planTrip(P, f, 'guest-abc123', '2027-01-05');
    expect(trip).toMatchObject({ routeId: 'BLR-HBL', to: 'Hubballi', dateFrom: '2027-01-14', festivalId: 'sankranti-2027', people: 3, needsFollowUp: [] });
  });

  it('month grid and month shift', () => {
    const jan = monthGrid('2027-01');
    expect(jan[0].slice(0, 5)).toEqual([null, null, null, null, null]); // 1 Jan 2027 is a Friday
    expect(jan[0][5]).toBe('2027-01-01');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(todayIST(Date.parse('2026-11-25T20:00:00Z'))).toBe('2026-11-26');
  });

  it('region is saved, optional, and sent as a Flagsmith trait', () => {
    expect(subRegionsFor('Karnataka')).toContain('North Karnataka');
    expect(parseProfile(JSON.stringify(P))?.region).toBe('North Karnataka');
    expect(parseProfile(JSON.stringify({ ...P, region: undefined }))?.region).toBeUndefined();
    expect(profileTraits(P).region).toBe('North Karnataka');
  });

  it('offline festival weeks show a gap for Sankranti on Namma State Travels routes', () => {
    const w = offlineWeeks({ id: 'op-staterte', name: 'x', type: 'bus_operator', routes: ['BLR-HBL', 'BLR-BGM'] } as never, '2027-01-01');
    const s = w.find((x) => x.festivalId === 'sankranti-2027')!;
    expect(s.days).toBeGreaterThan(0);
    expect(s.gap).toBeGreaterThan(0);
  });
});
