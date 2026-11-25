// Pure partner-side helpers: registration checks and chart data shaping (tested in __tests__/partnerPortal.test.ts).
import type { DemandCell, GiftOrder, PartnerType, PickupCell, RegisterPartnerRequest } from '@contract';

export interface Bar { key: string; label: string; value: number; compare?: number; highlight?: boolean }
export interface ItemDraft { name: string; price: string; unit: string }
export interface RegisterDraft { type: PartnerType; name: string; boardingPoint: string | null; items: ItemDraft[]; routes: string[]; seatsPerNight: string }
export type Checked = { ok: true; req: RegisterPartnerRequest } | { ok: false; error: string };

function checkItems(d: RegisterDraft, base: RegisterPartnerRequest): Checked {
  if (!d.boardingPoint) return { ok: false, error: 'Pick the boarding point nearest your shop.' };
  const items = d.items.filter((i) => i.name.trim() || i.price.trim());
  if (!items.length) return { ok: false, error: 'Add at least one sweet with a price.' };
  for (const i of items) {
    const price = Number(i.price);
    if (!i.name.trim()) return { ok: false, error: 'Every item needs a name.' };
    if (!(price > 0) || price > 10000) return { ok: false, error: `Price for ${i.name.trim()} should be between Rs 1 and Rs 10,000.` };
  }
  return { ok: true, req: { ...base, items: items.map((i) => ({ name: i.name.trim(), priceInr: Math.round(Number(i.price)), unit: i.unit.trim() || 'kg' })) } };
}

/** Returns the request to send, or the first problem in plain words. */
export function checkRegistration(d: RegisterDraft): Checked {
  const name = d.name.trim();
  if (name.length < 2) return { ok: false, error: 'Please type your business name.' };
  const base: RegisterPartnerRequest = { type: d.type, name, city: 'Bengaluru', ...(d.boardingPoint ? { boardingPoint: d.boardingPoint } : {}) };
  if (d.type === 'sweet_shop') return checkItems(d, base);
  if (d.type === 'bus_operator') {
    if (!d.routes.length) return { ok: false, error: 'Pick at least one route you run.' };
    const seats = Number(d.seatsPerNight);
    if (!(seats > 0) || seats > 20000) return { ok: false, error: 'Seats per night should be a number, for example 400.' };
    return { ok: true, req: { ...base, routes: d.routes, seatsPerNight: Math.round(seats) } };
  }
  return { ok: true, req: base };
}

/** Bus operator: one bar per date for a route, want (value) vs seats (compare); a gap is highlighted. */
export function demandBars(cells: DemandCell[], routeId: string, label: (d: string) => string): Bar[] {
  const by = new Map<string, { want: number; have: number }>();
  for (const c of cells) {
    if (c.routeId !== routeId) continue;
    const v = by.get(c.date) ?? { want: 0, have: 0 };
    by.set(c.date, { want: v.want + c.want, have: v.have + c.have });
  }
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ key: date, label: label(date), value: v.want, compare: v.have, highlight: v.want > v.have }));
}

export const routesIn = (cells: DemandCell[]): string[] => [...new Set(cells.map((c) => c.routeId).filter((r): r is string => !!r))];

function sumBy(cells: PickupCell[], key: (c: PickupCell) => string, lab: (k: string) => string): Bar[] {
  const m = new Map<string, number>();
  for (const c of cells) m.set(key(c), (m.get(key(c)) ?? 0) + c.orders);
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ key: k, label: lab(k), value: v }));
}

/** Sweet shop: orders per day, per pickup point, and the top items by quantity. */
export function shopBars(cells: PickupCell[], dayLabel: (d: string) => string, pointLabel: (p: string) => string) {
  const items = new Map<string, { label: string; value: number }>();
  for (const c of cells) for (const i of c.items) {
    const prev = items.get(i.itemId);
    items.set(i.itemId, { label: `${i.name} (${i.unit})`, value: (prev?.value ?? 0) + i.qty });
  }
  const top: Bar[] = [...items.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.value - a.value).slice(0, 5);
  return { perDay: sumBy(cells, (c) => c.pickupDate, dayLabel), perPoint: sumBy(cells, (c) => c.pickupPoint, pointLabel), top };
}

export const customerCount = (orders: GiftOrder[]): number => new Set(orders.map((o) => o.travellerId)).size;

export interface FestivalLite { id: string; name: string; date: string; travelWindow?: { from: string; to: string } }
export interface ForecastLite { date: string; wantSeats: number }

/** Festivals: travellers already planning to travel inside each festival's travel window (seeded forecast + extra). */
export function festivalBars(festivals: FestivalLite[], forecast: ForecastLite[], extra: (from: string, to: string) => number = () => 0): Bar[] {
  return festivals.filter((f) => f.travelWindow).map((f) => {
    const { from, to } = f.travelWindow!;
    const seeded = forecast.filter((c) => c.date >= from && c.date <= to).reduce((a, c) => a + c.wantSeats, 0);
    return { key: f.id, label: f.name, value: seeded + extra(from, to) };
  });
}
