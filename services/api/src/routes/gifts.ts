// Sweets / gift pre-order (sweet shops near boarding points). No payments: pay at pickup.
// GET /v1/shops?boardingPoint=  POST /v1/gifts/orders  GET /v1/gifts/orders/:id  GET /v1/gifts/orders?travellerId=
// POST /v1/gifts/orders/:id/status  GET /v1/partners/:id/pickups?date=
import type { FastifyInstance } from 'fastify';
import type {
  GiftOrder, GiftOrderRequest, GiftOrderResponse, OrderLine, OrderStatusRequest, OrdersResponse, Partner, PickupCell,
  PickupsResponse, ShopNear, ShopsResponse,
} from '../../../../shared/contract/src/index.js';
import { orderLines, shopOrders } from '../demand.js';
import { HttpError, type Deps } from '../deps.js';
import { nextId, snapshot } from '../store.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const STATUSES: GiftOrder['status'][] = ['placed', 'ready', 'picked_up', 'cancelled'];
const LABEL = 'Seeded demo data';

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function shopsNear(deps: Deps, boardingPoint: string | null): ShopNear[] {
  const bps = deps.seed.boardingPoints;
  const here = bps.find((b) => b.id === boardingPoint);
  return deps.seed.partners.filter((p) => p.type === 'sweet_shop').map((p) => {
    const at = bps.find((b) => b.id === p.boardingPoint);
    const same = p.boardingPoint === boardingPoint;
    return {
      partner: p, boardingPoint: p.boardingPoint ?? 'MAJESTIC', atBoardingPoint: same,
      distanceKm: same || !here || !at ? 0 : km(here, at), walkMinutes: same ? p.walkMinutes ?? null : null,
    };
  }).sort((a, b) => Number(b.atBoardingPoint) - Number(a.atBoardingPoint) || a.distanceKm - b.distanceKm);
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function lines(shop: Partner, b: Partial<GiftOrderRequest>): OrderLine[] {
  const raw = Array.isArray(b.items) && b.items.length ? b.items : b.itemId ? [{ itemId: b.itemId, qty: Number(b.qty) }] : [];
  if (!raw.length || raw.length > 10) throw new HttpError(400, 'bad_request', 'items (1-10) or itemId + qty are required');
  return raw.map((l) => {
    const item = shop.items?.find((i) => i.id === l?.itemId);
    if (!item) throw new HttpError(400, 'bad_request', `Unknown item at this shop: ${String(l?.itemId)}`);
    const qty = Number(l.qty);
    if (!(qty > 0) || qty > 50) throw new HttpError(400, 'bad_request', 'qty must be between 0 and 50');
    return { itemId: item.id, qty, unit: item.unit, priceInr: item.priceInr };
  });
}

export function buildOrder(deps: Deps, b: Partial<GiftOrderRequest>): GiftOrder {
  const shop = deps.seed.partners.find((p) => p.id === b.partnerId);
  if (!shop || shop.type !== 'sweet_shop') throw new HttpError(400, 'bad_request', 'partnerId must be a sweet shop');
  if (typeof b.travellerId !== 'string' || !b.travellerId.trim()) throw new HttpError(400, 'bad_request', 'travellerId is required');
  if (!b.pickupDate || !DATE.test(b.pickupDate)) throw new HttpError(400, 'bad_request', 'pickupDate must be YYYY-MM-DD');
  const readyBy = b.readyBy ?? '20:00';
  if (!TIME.test(readyBy)) throw new HttpError(400, 'bad_request', 'readyBy must be HH:MM');
  if (b.departTime !== undefined && (!TIME.test(b.departTime) || minutes(readyBy) > minutes(b.departTime) - 15)) {
    throw new HttpError(400, 'bad_request', 'readyBy must be at least 15 minutes before departTime');
  }
  const pickupPoint = b.pickupPoint ?? shop.boardingPoint ?? 'MAJESTIC';
  if (!deps.seed.boardingPoints.some((p) => p.id === pickupPoint)) throw new HttpError(400, 'bad_request', 'Unknown pickupPoint');
  const items = lines(shop, b);
  const now = deps.clock();
  return {
    id: nextId(deps.store, 'ord'), partnerId: shop.id, travellerId: b.travellerId.trim().slice(0, 80), itemId: items[0].itemId, qty: items[0].qty,
    pickupPoint, pickupDate: b.pickupDate, readyBy, status: 'placed', payment: 'pay_at_pickup_demo', items,
    totalInr: items.reduce((a, l) => a + l.qty * (l.priceInr ?? 0), 0), createdAt: now, updatedAt: now,
    ...(b.departTime ? { departTime: b.departTime } : {}), ...(b.intentId ? { intentId: String(b.intentId).slice(0, 80) } : {}),
  };
}

function allOrders(deps: Deps): GiftOrder[] {
  return [...deps.store.orders, ...deps.seed.orders];
}

export function pickupCells(deps: Deps, shop: Partner, date?: string): PickupCell[] {
  const groups = new Map<string, GiftOrder[]>();
  for (const o of shopOrders(deps.seed, deps.store, shop.id)) {
    if (date && o.pickupDate !== date) continue;
    const k = `${o.pickupDate}|${o.pickupPoint}`;
    groups.set(k, [...(groups.get(k) ?? []), o]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, orders]) => {
    const [pickupDate, pickupPoint] = k.split('|');
    const qty = new Map<string, number>();
    for (const l of orders.flatMap(orderLines)) qty.set(l.itemId, (qty.get(l.itemId) ?? 0) + l.qty);
    const items = [...qty.entries()].map(([itemId, q]) => {
      const it = shop.items?.find((i) => i.id === itemId);
      return { itemId, name: it?.name ?? itemId, unit: it?.unit ?? 'kg', qty: q };
    });
    const totalInr = items.reduce((a, l) => a + l.qty * (shop.items?.find((i) => i.id === l.itemId)?.priceInr ?? 0), 0);
    return { pickupPoint, pickupDate, orders: orders.length, firstReadyBy: orders.map((o) => o.readyBy).sort()[0] ?? '20:00', items, totalInr };
  });
}

export default async function giftRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.get('/v1/shops', async (req): Promise<ShopsResponse> => {
    const bp = (req.query as { boardingPoint?: string }).boardingPoint ?? null;
    return { shops: shopsNear(deps, bp), boardingPoint: bp, label: LABEL };
  });

  app.post('/v1/gifts/orders', async (req): Promise<GiftOrderResponse> => {
    const order = buildOrder(deps, (req.body ?? {}) as Partial<GiftOrderRequest>);
    deps.store.orders.push(order);
    snapshot(deps.store, deps.config.storeSnapshot);
    return { order };
  });

  app.get('/v1/gifts/orders', async (req): Promise<OrdersResponse> => {
    const t = (req.query as { travellerId?: string }).travellerId;
    if (!t) throw new HttpError(400, 'bad_request', 'travellerId is required');
    return { orders: allOrders(deps).filter((o) => o.travellerId === t) };
  });

  app.get('/v1/gifts/orders/:id', async (req): Promise<GiftOrderResponse> => {
    const order = allOrders(deps).find((o) => o.id === (req.params as { id: string }).id);
    if (!order) throw new HttpError(404, 'not_found', 'No such order');
    return { order };
  });

  app.post('/v1/gifts/orders/:id/status', async (req): Promise<GiftOrderResponse> => {
    const status = ((req.body ?? {}) as Partial<OrderStatusRequest>).status;
    if (!status || !STATUSES.includes(status)) throw new HttpError(400, 'bad_request', `status must be one of ${STATUSES.join(', ')}`);
    const order = deps.store.orders.find((o) => o.id === (req.params as { id: string }).id);
    if (!order) throw new HttpError(404, 'not_found', 'No such live order (seeded orders are read-only)');
    order.status = status;
    order.updatedAt = deps.clock();
    snapshot(deps.store, deps.config.storeSnapshot);
    return { order };
  });

  app.get('/v1/partners/:id/pickups', async (req): Promise<PickupsResponse> => {
    const shop = deps.seed.partners.find((p) => p.id === (req.params as { id: string }).id);
    if (!shop || shop.type !== 'sweet_shop') throw new HttpError(404, 'not_found', 'Unknown sweet shop');
    return { partner: shop, cells: pickupCells(deps, shop, (req.query as { date?: string }).date), label: LABEL };
  });
}
