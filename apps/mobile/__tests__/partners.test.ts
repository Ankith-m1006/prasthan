jest.mock('expo-audio', () => ({ createAudioPlayer: () => ({ play: () => undefined }) }));
import type { Alert, DemandCell } from '@contract';
import { buildAddRequest } from '../src/screens/partners/AddBuses';
import { fill } from '../src/screens/partners/DemandBoard';
import { mergeAlerts } from '../src/state/alerts';
import { createMockClient } from '../src/api/mock';

const cell: DemandCell = { key: 'BLR-HBL|2027-01-14|night', label: 'BLR -> Hubballi, Thu 14 Jan, night', date: '2027-01-14', window: 'night', want: 2400, have: 880, gap: 1520, suggestion: 'Add 38 buses', routeId: 'BLR-HBL' };

describe('partner board', () => {
  it('bar shows have and gap as shares of want', () => {
    const f = fill(cell);
    expect(f.have).toBeCloseTo(880 / 2400);
    expect(f.gap).toBeCloseTo(1520 / 2400);
    expect(fill({ want: 0, have: 880 }).gap).toBe(0);
  });
  it('add-buses sheet builds the contract request', () => {
    expect(buildAddRequest(cell, 6, '22:30', 'MAJESTIC')).toEqual({ routeId: 'BLR-HBL', date: '2027-01-14', departTime: '22:30', boardingPoint: 'MAJESTIC', seats: 40, count: 6, mode: 'bus' });
  });
  it('operator board has the hero row with gap + suggestion; sweet shop says what to prepare', async () => {
    const api = createMockClient();
    const bus = await api.demand('op-staterte', '2027-01-14');
    expect(bus.cells.find((c) => c.routeId === 'BLR-HBL')).toMatchObject({ want: 2400, suggestion: 'Add 38 buses' });
    const shop = await api.demand('shop-majestic', '2027-01-14');
    expect(shop.cells.find((c) => c.key.endsWith('mysore-pak'))?.suggestion).toMatch(/^Prepare 7 kg Mysore pak by 20:00/);
  });
});

describe('alerts list', () => {
  const a = (id: string, createdAt: string): Alert => ({ id, kind: 'info', routeId: null, date: null, text: id, source: 'seeded', createdAt });
  it('sorts newest first and marks unseen ones', () => {
    const first = mergeAlerts(null, [a('x', '2027-01-04T10:00:00+05:30'), a('y', '2027-01-05T10:00:00+05:30')]);
    expect(first.sorted.map((x) => x.id)).toEqual(['y', 'x']);
    expect(first.fresh).toEqual([]);
    const next = mergeAlerts(new Set(['x', 'y']), [a('z', '2027-01-05T12:00:00+05:30'), a('x', '2027-01-04T10:00:00+05:30'), a('y', '2027-01-05T10:00:00+05:30')]);
    expect(next.sorted[0].id).toBe('z');
    expect(next.fresh).toEqual(['z']);
  });
});
