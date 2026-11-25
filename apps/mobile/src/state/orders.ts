// "My orders": sweets pre-orders this phone placed, saved on this device (localStorage on web, memory on native).
// One basket = one shop + one pickup; the api stores one GiftOrder per item line.
import { useSyncExternalStore } from 'react';
import type { GiftOrder } from '@contract';
import { deviceKV, type KV } from '../lib/storage';

export interface SavedLine { orderId: string; itemId: string; name: string; unit: string; qty: number; priceInr: number }
export interface SavedBasket {
  id: string; shopId: string; shopName: string; pickupPoint: string; pickupName: string; pickupDate: string; readyBy: string;
  lines: SavedLine[]; total: number; status: GiftOrder['status']; createdAt: string;
}

export const ORDERS_KEY = 'prasthan.orders.v1';

/** Saved JSON -> baskets; anything broken is dropped (tested). */
export function parseBaskets(raw: string | null): SavedBasket[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((b): b is SavedBasket => Boolean(b) && typeof b === 'object' && typeof (b as SavedBasket).id === 'string' && Array.isArray((b as SavedBasket).lines));
  } catch {
    return [];
  }
}

/** The GiftOrders inside the saved baskets (so the shop side can show them even if the api instance forgot). */
export function basketOrders(baskets: SavedBasket[], travellerId: string): GiftOrder[] {
  return baskets.flatMap((b) => b.lines.map((l) => ({ id: l.orderId, partnerId: b.shopId, travellerId, itemId: l.itemId, qty: l.qty, pickupPoint: b.pickupPoint, pickupDate: b.pickupDate, readyBy: b.readyBy, status: b.status, payment: 'pay_at_pickup_demo' as const })));
}

function createStore(kv: KV) {
  let list = parseBaskets(kv.get(ORDERS_KEY));
  const listeners = new Set<() => void>();
  const write = (next: SavedBasket[]) => { list = next; kv.set(ORDERS_KEY, JSON.stringify(next)); listeners.forEach((l) => l()); };
  return {
    all: () => list,
    add: (b: SavedBasket) => write([b, ...list.filter((x) => x.id !== b.id)]),
    setStatus: (id: string, status: GiftOrder['status']) => write(list.map((b) => (b.id === id ? { ...b, status } : b))),
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export const ordersStore = createStore(deviceKV());
export const useOrders = () => useSyncExternalStore(ordersStore.subscribe, ordersStore.all, ordersStore.all);
