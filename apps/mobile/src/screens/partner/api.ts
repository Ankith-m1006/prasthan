// Partner-only api calls the shared client does not have: register a business (v3) and set an order's status.
// Offline / mock: registration is kept on this device only and the status change is shown locally.
import type { GiftOrder, OrderStatusRequest, Partner, RegisterPartnerRequest, RegisterPartnerResponse } from '@contract';
import { isForcedMock } from '../../api';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

async function post<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/** Registers on the api (shared with every device); offline -> a device-only partner. 4xx messages are passed through. */
export async function registerPartner(req: RegisterPartnerRequest): Promise<{ partner: Partner; local: boolean }> {
  if (!isForcedMock() && BASE) {
    const r = await post<RegisterPartnerResponse>('/v1/partners/register', req);
    return { partner: r.partner, local: false };
  }
  const id = `local-${Date.now().toString(36)}`;
  const items = req.items?.map((i, n) => ({ id: `item-${n + 1}`, name: i.name, nameLocal: i.name, unit: i.unit, priceInr: i.priceInr, readyInMinutes: 30, dailyCapacity: 100 }));
  return { partner: { id, type: req.type, name: req.name, registered: true, boardingPoint: req.boardingPoint, routes: req.routes, seatsPerNight: req.seatsPerNight, items }, local: true };
}

export async function setOrderStatus(id: string, status: GiftOrder['status']): Promise<void> {
  if (isForcedMock() || !BASE) return;
  const body: OrderStatusRequest = { status };
  await post(`/v1/gifts/orders/${encodeURIComponent(id)}/status`, body);
}
