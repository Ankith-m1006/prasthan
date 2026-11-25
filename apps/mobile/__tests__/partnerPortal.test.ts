// Partner portal: role state on the device, registration checks, chart data shaping.
import type { DemandCell, Partner, PickupCell } from '@contract';
import { memoryKV } from '../src/lib/storage';
import { createRoleStore, mergePartners, parseRole, ROLE_KEY } from '../src/state/role';
import { checkRegistration, customerCount, demandBars, festivalBars, routesIn, shopBars, type RegisterDraft } from '../src/screens/partner/logic';

const SHOP: Partner = { id: 'shop-majestic', type: 'sweet_shop', name: 'Sihi Mane Sweets' };

describe('role state', () => {
  it('defaults to traveller and survives junk', () => {
    expect(parseRole(null).role).toBe('traveller');
    expect(parseRole('{bad').role).toBe('traveller');
    expect(parseRole(JSON.stringify({ role: 'partner', partner: null })).role).toBe('traveller');
    expect(parseRole(JSON.stringify({ role: 'partner', partner: { id: 'x', type: 'temple', name: 'X' } })).partner).toBeNull();
  });
  it('switches views and remembers the business on the device', () => {
    const kv = memoryKV();
    const store = createRoleStore(kv);
    store.becomePartner(SHOP);
    expect(createRoleStore(kv).get()).toMatchObject({ role: 'partner', partner: { id: 'shop-majestic' } });
    store.becomeTraveller();
    const back = parseRole(kv.get(ROLE_KEY));
    expect(back.role).toBe('traveller');
    expect(back.partner?.id).toBe('shop-majestic'); // kept, so "Partner" switches straight back
  });
  it('lists device-registered partners the api does not know yet, once', () => {
    const reg: Partner = { id: 'shop-reg-1', type: 'sweet_shop', name: 'Amma', registered: true };
    expect(mergePartners([SHOP, reg], [reg]).length).toBe(2);
    expect(mergePartners([SHOP], [reg]).map((p) => p.id)).toEqual(['shop-majestic', 'shop-reg-1']);
  });
});

describe('registration checks', () => {
  const shop: RegisterDraft = { type: 'sweet_shop', name: ' Amma Sweets ', boardingPoint: 'MAJESTIC', items: [{ name: 'Mysore pak', price: '640', unit: '' }, { name: '', price: '', unit: 'kg' }], routes: [], seatsPerNight: '' };
  it('builds a clean sweet shop request (blank rows dropped, unit defaults to kg)', () => {
    const r = checkRegistration(shop);
    expect(r.ok && r.req).toEqual({ type: 'sweet_shop', name: 'Amma Sweets', city: 'Bengaluru', boardingPoint: 'MAJESTIC', items: [{ name: 'Mysore pak', priceInr: 640, unit: 'kg' }] });
  });
  it('explains what is missing', () => {
    expect(checkRegistration({ ...shop, name: 'A' }).ok).toBe(false);
    expect(checkRegistration({ ...shop, boardingPoint: null }).ok).toBe(false);
    expect(checkRegistration({ ...shop, items: [{ name: 'Peda', price: '0', unit: 'kg' }] }).ok).toBe(false);
    expect(checkRegistration({ ...shop, items: [{ name: '', price: '90', unit: 'kg' }] }).ok).toBe(false);
    const bus: RegisterDraft = { ...shop, type: 'bus_operator', routes: [], seatsPerNight: '400' };
    expect(checkRegistration(bus).ok).toBe(false);
    expect(checkRegistration({ ...bus, routes: ['BLR-HBL'], seatsPerNight: '' }).ok).toBe(false);
    const ok = checkRegistration({ ...bus, routes: ['BLR-HBL'] });
    expect(ok.ok && ok.req.seatsPerNight).toBe(400);
  });
});

describe('chart shaping', () => {
  const cell = (routeId: string, date: string, want: number, have: number): DemandCell => ({ key: `${routeId}|${date}|${want}`, label: '', date, window: 'night', want, have, gap: Math.max(0, want - have), suggestion: null, routeId });
  it('sums demand vs seats per date for one route and flags gaps', () => {
    const cells = [cell('BLR-HBL', '2027-01-14', 2400, 900), cell('BLR-HBL', '2027-01-14', 100, 100), cell('BLR-HBL', '2027-01-12', 300, 400), cell('BLR-MDU', '2027-01-14', 9, 1)];
    const bars = demandBars(cells, 'BLR-HBL', (d) => d.slice(8));
    expect(bars).toEqual([
      { key: '2027-01-12', label: '12', value: 300, compare: 400, highlight: false },
      { key: '2027-01-14', label: '14', value: 2500, compare: 1000, highlight: true },
    ]);
    expect(routesIn(cells)).toEqual(['BLR-HBL', 'BLR-MDU']);
  });
  it('shapes shop pickups per day, per point and top items', () => {
    const p = (pickupPoint: string, pickupDate: string, orders: number, qty: number): PickupCell => ({ pickupPoint, pickupDate, orders, firstReadyBy: '19:00', totalInr: 0, items: [{ itemId: 'mp', name: 'Mysore pak', unit: 'kg', qty }, { itemId: 'pd', name: 'Peda', unit: 'box', qty: 1 }] });
    const b = shopBars([p('MAJESTIC', '2027-01-14', 3, 4), p('SATELLITE', '2027-01-14', 1, 1), p('MAJESTIC', '2027-01-13', 2, 2)], (d) => d, (x) => x);
    expect(b.perDay).toEqual([{ key: '2027-01-13', label: '2027-01-13', value: 2 }, { key: '2027-01-14', label: '2027-01-14', value: 4 }]);
    expect(b.perPoint.find((x) => x.key === 'MAJESTIC')?.value).toBe(5);
    expect(b.top[0]).toEqual({ key: 'mp', label: 'Mysore pak (kg)', value: 7 });
  });
  it('counts distinct customers and festival-window demand', () => {
    expect(customerCount([{ travellerId: 'a' }, { travellerId: 'a' }, { travellerId: 'b' }] as never)).toBe(2);
    const bars = festivalBars([{ id: 's', name: 'Sankranti', date: '2027-01-15', travelWindow: { from: '2027-01-12', to: '2027-01-17' } }, { id: 'x', name: 'Bhogi', date: '2027-01-14' }],
      [{ date: '2027-01-12', wantSeats: 10 }, { date: '2027-01-20', wantSeats: 99 }, { date: '2027-01-17', wantSeats: 5 }], () => 1);
    expect(bars).toEqual([{ key: 's', label: 'Sankranti', value: 16 }]);
  });
});
