// Pure helpers for "Take sweets home" (tested): shops near the boarding point, basket totals, pickup times that are
// ready before the bus leaves, the shop-side grouping by pickup point + day, and the "understood by" label.
import type { GiftOrder, Partner, ShopItem, TimeWindow } from '@contract';

/** Typical departure per time window (bus/train night services leave ~22:00). */
const DEPART: Record<TimeWindow, string> = { morning: '07:00', afternoon: '14:00', evening: '19:00', night: '22:00', any: '21:00' };
export const departureFor = (w: TimeWindow): string => DEPART[w] ?? '21:00';

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Pickup times every 30 min, from 2.5 h to 30 min before departure, never before the shop opens (08:00). */
export function pickupSlots(depart: string, opensAt = '08:00'): string[] {
  const d = toMin(depart);
  const out: string[] = [];
  for (let m = d - 150; m <= d - 30; m += 30) if (m >= toMin(opensAt)) out.push(toHhmm(m));
  return out.length ? out : [toHhmm(Math.max(toMin(opensAt), d - 30))];
}

/** Shops at the boarding point first; if none there, every shop (the app says "nearest demo shops"). */
export function shopsNear(shops: Partner[], boardingPoint: string | null): { shops: Partner[]; exact: boolean } {
  const sweet = shops.filter((s) => s.type === 'sweet_shop');
  const here = sweet.filter((s) => s.boardingPoint === boardingPoint);
  return here.length ? { shops: here, exact: true } : { shops: sweet, exact: false };
}

export type Basket = Record<string, number>; // itemId -> qty

export interface BasketLine { item: ShopItem; qty: number; subtotal: number }

export function basketLines(items: ShopItem[], basket: Basket): BasketLine[] {
  return items.filter((i) => (basket[i.id] ?? 0) > 0).map((i) => ({ item: i, qty: basket[i.id], subtotal: i.priceInr * basket[i.id] }));
}

export const basketTotal = (lines: BasketLine[]) => lines.reduce((a, l) => a + l.subtotal, 0);

export function stepQty(basket: Basket, itemId: string, delta: number, max = 10): Basket {
  const q = Math.min(max, Math.max(0, (basket[itemId] ?? 0) + delta));
  const next = { ...basket, [itemId]: q };
  if (q === 0) delete next[itemId];
  return next;
}

/** Start the basket from what the traveller said ("2 kg Mysore pak"), if the shop sells it. */
export function basketFromAsk(items: ShopItem[], ask: { itemId: string; qty: number } | null): Basket {
  if (!ask || !items.some((i) => i.id === ask.itemId)) return {};
  return { [ask.itemId]: Math.max(1, Math.min(10, Math.round(ask.qty))) };
}

export const rupees = (n: number) => `Rs ${n.toLocaleString('en-IN')}`;

/** Shop side: orders grouped per pickup point + day, earliest first, with totals per item. */
export interface OrderGroup { key: string; pickupPoint: string; pickupDate: string; orders: GiftOrder[]; perItem: Array<{ itemId: string; qty: number }>; firstReady: string }
export function groupOrders(orders: GiftOrder[]): OrderGroup[] {
  const map = new Map<string, GiftOrder[]>();
  for (const o of orders) map.set(`${o.pickupDate}|${o.pickupPoint}`, [...(map.get(`${o.pickupDate}|${o.pickupPoint}`) ?? []), o]);
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, os]) => {
    const per = new Map<string, number>();
    for (const o of os) per.set(o.itemId, (per.get(o.itemId) ?? 0) + o.qty);
    return { key, pickupPoint: os[0].pickupPoint, pickupDate: os[0].pickupDate, orders: [...os].sort((a, b) => a.readyBy.localeCompare(b.readyBy)), perItem: [...per.entries()].map(([itemId, qty]) => ({ itemId, qty })), firstReady: os.map((o) => o.readyBy).sort()[0] };
  });
}

/** Orders the api has plus ones this phone placed that the api (in-memory, serverless) may have lost. */
export function mergeOrders(server: GiftOrder[], local: GiftOrder[]): GiftOrder[] {
  const ids = new Set(server.map((o) => o.id));
  return [...server, ...local.filter((o) => !ids.has(o.id))];
}

/** "understood by Sarvam AI" when the LLM parsed it (parser 'llm' or 'sarvam-llm'), else "understood by rules". */
export function parserLabel(parser: string | undefined): { text: string; ai: boolean } {
  const ai = Boolean(parser && parser.includes('llm'));
  return { text: ai ? 'understood by Sarvam AI' : 'understood by rules', ai };
}
