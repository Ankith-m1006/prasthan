// Sweets pre-order: shops near a boarding point, multi-item orders, validation, status, pickup board.
import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, mockDeps } from '../src/app.js';
import { makeAjv, assertValid } from './helpers/ajv.js';

const ajv = makeAjv();
const ORDER = {
  travellerId: 'guest-abc123', partnerId: 'shop-majestic', pickupDate: '2027-01-14', readyBy: '21:30', departTime: '22:30',
  items: [{ itemId: 'mysore-pak', qty: 2 }, { itemId: 'dharwad-peda', qty: 1 }],
};
let app: FastifyInstance;
beforeEach(async () => { app = await buildApp(mockDeps()); });

describe('gift pre-orders', () => {
  it('lists sweet shops, the one at the boarding point first, with items and prices', async () => {
    const res = await app.inject({ url: '/v1/shops?boardingPoint=SATELLITE' });
    const shops = res.json().shops;
    expect(shops[0]).toMatchObject({ atBoardingPoint: true, boardingPoint: 'SATELLITE', distanceKm: 0 });
    expect(shops.every((s: { partner: { type: string } }) => s.partner.type === 'sweet_shop')).toBe(true);
    expect(shops[1].distanceKm).toBeGreaterThan(0);
    expect(shops[0].partner.items[0]).toHaveProperty('priceInr');
    expect(res.json().label).toBe('Seeded demo data');
  });

  it('creates a multi-item order with a total, pay at pickup, and reads it back', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/gifts/orders', payload: ORDER });
    expect(res.statusCode).toBe(200);
    const order = res.json().order;
    assertValid(ajv, 'gift-order.json', order);
    expect(order).toMatchObject({ status: 'placed', payment: 'pay_at_pickup_demo', pickupPoint: 'MAJESTIC', totalInr: 2 * 640 + 560, itemId: 'mysore-pak', qty: 2 });
    const back = await app.inject({ url: `/v1/gifts/orders/${order.id}` });
    expect(back.json().order.id).toBe(order.id);
    const mine = await app.inject({ url: '/v1/gifts/orders?travellerId=guest-abc123' });
    expect(mine.json().orders).toHaveLength(1);
  });

  it('rejects bad input', async () => {
    const bad = async (p: object) => (await app.inject({ method: 'POST', url: '/v1/gifts/orders', payload: { ...ORDER, ...p } })).statusCode;
    expect(await bad({ readyBy: '22:20' })).toBe(400); // less than 15 min before departure
    expect(await bad({ items: [{ itemId: 'pizza', qty: 1 }] })).toBe(400);
    expect(await bad({ items: [{ itemId: 'mysore-pak', qty: 0 }] })).toBe(400);
    expect(await bad({ partnerId: 'op-staterte' })).toBe(400);
    expect(await bad({ pickupDate: '14 Jan' })).toBe(400);
    expect(await bad({ pickupPoint: 'MOON' })).toBe(400);
    expect(await bad({ travellerId: '' })).toBe(400);
    expect((await app.inject({ url: '/v1/gifts/orders/ord-nope' })).statusCode).toBe(404);
  });

  it('shop moves the status; pickup board groups by point + day', async () => {
    const id = (await app.inject({ method: 'POST', url: '/v1/gifts/orders', payload: ORDER })).json().order.id;
    const st = await app.inject({ method: 'POST', url: `/v1/gifts/orders/${id}/status`, payload: { status: 'ready' } });
    expect(st.json().order.status).toBe('ready');
    expect((await app.inject({ method: 'POST', url: `/v1/gifts/orders/${id}/status`, payload: { status: 'eaten' } })).statusCode).toBe(400);
    const board = await app.inject({ url: '/v1/partners/shop-majestic/pickups?date=2027-01-14' });
    const cell = board.json().cells.find((c: { pickupPoint: string }) => c.pickupPoint === 'MAJESTIC');
    expect(cell.items.find((i: { itemId: string }) => i.itemId === 'mysore-pak').qty).toBeGreaterThanOrEqual(2);
    expect(cell.orders).toBeGreaterThanOrEqual(1);
    const demand = await app.inject({ url: '/v1/partners/shop-majestic/demand?date=2027-01-14' });
    const peda = demand.json().cells.find((c: { key: string }) => c.key === 'shop-majestic|2027-01-14|dharwad-peda');
    expect(peda.want).toBeGreaterThanOrEqual(1);
  });
});
