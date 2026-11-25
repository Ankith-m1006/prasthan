// Demand cells for every partner type (one dashboard shape). All numbers are SEEDED demo data + live additions.
import type { DemandCell, GiftOrder, Partner, ShopItem } from '../../../shared/contract/src/index.js';
import type { Seed } from './seed.js';
import type { Store } from './store.js';
import { dateLabel } from './i18n/templates.js';

export const SEATS_PER_BUS = 40;

export function liveSeats(store: Store, routeId: string, date: string): number {
  return store.services.filter((s) => s.routeId === routeId && s.date === date).reduce((a, s) => a + s.seats, 0);
}

export function routeDemand(seed: Seed, store: Store, routeId: string, date: string): { want: number; have: number; gap: number } | null {
  const cell = seed.forecast.find((c) => c.routeId === routeId && c.date === date);
  if (!cell) return null;
  const have = cell.seatsExist + liveSeats(store, routeId, date);
  return { want: cell.wantSeats, have, gap: Math.max(0, cell.wantSeats - have) };
}

function busSuggestion(gap: number): string | null {
  if (gap <= 0) return null;
  const n = Math.ceil(gap / SEATS_PER_BUS);
  return `Add ${n} bus${n === 1 ? '' : 'es'}`;
}

export function busCells(seed: Seed, store: Store, partner: Partner, date?: string): DemandCell[] {
  const routes = new Set(partner.routes ?? []);
  return seed.forecast
    .filter((c) => routes.has(c.routeId) && (!date || c.date === date))
    .map((c) => {
      const d = routeDemand(seed, store, c.routeId, c.date)!;
      const to = seed.routes.find((r) => r.id === c.routeId)?.to ?? c.routeId;
      return {
        key: `${c.routeId}|${c.date}|${c.timeWindow}`, label: `BLR -> ${to}, ${dateLabel(c.date)}, ${c.timeWindow}`,
        date: c.date, window: c.timeWindow, want: d.want, have: d.have, gap: d.gap, suggestion: busSuggestion(d.gap), routeId: c.routeId,
      };
    });
}

function shopCell(partner: Partner, item: ShopItem | undefined, itemId: string, date: string, orders: GiftOrder[]): DemandCell {
  const qty = orders.reduce((a, o) => a + o.qty, 0);
  const readyBy = orders.map((o) => o.readyBy).sort()[0] ?? '20:00';
  const name = item?.name ?? itemId;
  const unit = item?.unit ?? 'kg';
  const have = item?.dailyCapacity ?? 0;
  return {
    key: `${partner.id}|${date}|${itemId}`, label: `${name}, ${dateLabel(date)}`, date, window: readyBy,
    want: qty, have, gap: Math.max(0, qty - have),
    suggestion: qty > 0 ? `Prepare ${qty} ${unit} ${name} by ${readyBy}, ${dateLabel(date)}` : null,
    zone: partner.boardingPoint,
  };
}

/** All lines of an order (v1 orders have only itemId + qty). */
export function orderLines(o: GiftOrder): Array<{ itemId: string; qty: number }> {
  return o.items?.length ? o.items : [{ itemId: o.itemId, qty: o.qty }];
}

export function shopOrders(seed: Seed, store: Store, partnerId: string): GiftOrder[] {
  return [...seed.orders, ...store.orders].filter((o) => o.partnerId === partnerId && o.status !== 'cancelled');
}

export function shopCells(seed: Seed, store: Store, partner: Partner, date?: string): DemandCell[] {
  const groups = new Map<string, GiftOrder[]>();
  for (const o of shopOrders(seed, store, partner.id)) {
    if (date && o.pickupDate !== date) continue;
    for (const l of orderLines(o)) {
      const k = `${o.pickupDate}|${l.itemId}`;
      groups.set(k, [...(groups.get(k) ?? []), { ...o, itemId: l.itemId, qty: l.qty }]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, orders]) => {
      const [d, itemId] = k.split('|');
      return shopCell(partner, partner.items?.find((i) => i.id === itemId), itemId, d, orders);
    });
}

export function qcCells(seed: Seed, partner: Partner, date?: string): DemandCell[] {
  const serves = new Set(partner.serves ?? []);
  const byDate = seed.qc.filter((c) => !date || c.date === date);
  const mine = byDate.filter((c) => serves.has(c.fulfilment));
  return (mine.length > 0 ? mine : byDate)
    .map((c) => {
      const want = c.travellersLeaving ?? c.travellersArriving ?? 0;
      const verb = c.travellersArriving !== undefined ? 'arriving in' : 'near';
      return {
        key: `${c.zone}|${c.date}|${c.window}`, label: `${c.zone}, ${dateLabel(c.date)}, ${c.window}`,
        date: c.date, window: c.window, want, have: 0, gap: want,
        suggestion: `Stock ${c.topAsks[0] ?? 'gift boxes'} ${verb} ${c.zone} ${c.window}`, zone: c.zone,
      };
    });
}

export function demandFor(seed: Seed, store: Store, partner: Partner, date?: string): DemandCell[] {
  if (partner.type === 'bus_operator') return busCells(seed, store, partner, date);
  if (partner.type === 'sweet_shop') return shopCells(seed, store, partner, date);
  return qcCells(seed, partner, date);
}
