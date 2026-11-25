// v3: partner registration (demo, no password): validation, listing, and the existing endpoints working for it.
import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, mockDeps } from '../src/app.js';
import { merge, toData } from '../src/persist.js';
import { createStore } from '../src/store.js';

let app: FastifyInstance;
beforeEach(async () => { app = await buildApp(mockDeps()); });
const SHOP = { type: 'sweet_shop', name: 'Amma Sweets', boardingPoint: 'MAJESTIC', items: [{ name: 'Mysore pak', priceInr: 640, unit: 'kg' }] };

describe('partner registration', () => {
  it('registers a sweet shop that then lists, shows near its point and takes orders', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/partners/register', payload: SHOP });
    expect(res.statusCode).toBe(200);
    const p = res.json().partner;
    expect(p).toMatchObject({ type: 'sweet_shop', name: 'Amma Sweets', registered: true, boardingPoint: 'MAJESTIC' });
    const list = (await app.inject({ url: '/v1/partners?type=sweet_shop' })).json().partners;
    expect(list.some((x: { id: string }) => x.id === p.id)).toBe(true);
    const order = await app.inject({ method: 'POST', url: '/v1/gifts/orders', payload: { travellerId: 'g-1', partnerId: p.id, pickupDate: '2027-01-14', readyBy: '20:00', items: [{ itemId: p.items[0].id, qty: 2 }] } });
    expect(order.statusCode).toBe(200);
    const cells = (await app.inject({ url: `/v1/partners/${p.id}/pickups` })).json().cells;
    expect(cells[0].orders).toBe(1);
  });

  it('registers a bus operator whose demand board and add buses work', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/partners/register', payload: { type: 'bus_operator', name: 'Hubli Night Coaches', routes: ['BLR-HBL', 'NOPE'], seatsPerNight: 400 } });
    const p = res.json().partner;
    expect(p.routes).toEqual(['BLR-HBL']);
    const demand = (await app.inject({ url: `/v1/partners/${p.id}/demand?date=2027-01-14` })).json();
    expect(demand.cells.length).toBeGreaterThan(0);
    const add = await app.inject({ method: 'POST', url: `/v1/partners/${p.id}/services`, payload: { routeId: 'BLR-HBL', date: '2027-01-14', departTime: '22:30', boardingPoint: 'MAJESTIC', seats: 40, count: 2, mode: 'bus' } });
    expect(add.statusCode).toBe(200);
  });

  it('rejects bad registrations', async () => {
    const bad = [
      { ...SHOP, type: 'temple' }, { ...SHOP, name: ' ' }, { ...SHOP, items: [] }, { ...SHOP, boardingPoint: 'MOON' },
      { ...SHOP, items: [{ name: 'Peda', priceInr: 0, unit: 'kg' }] }, { type: 'bus_operator', name: 'X Travels', routes: [], seatsPerNight: 40 },
      { type: 'bus_operator', name: 'Y Travels', routes: ['BLR-HBL'], seatsPerNight: 0 }, { ...SHOP, name: 'Sihi Mane Sweets' },
    ];
    for (const payload of bad) expect((await app.inject({ method: 'POST', url: '/v1/partners/register', payload })).statusCode).toBeGreaterThanOrEqual(400);
  });

  it('keeps registered partners when merging the shared store', () => {
    const a = createStore(); a.partners.push({ id: 'shop-reg-1', type: 'sweet_shop', name: 'A' });
    const b = createStore(); b.partners.push({ id: 'shop-reg-2', type: 'sweet_shop', name: 'B' });
    expect(merge(toData(a), toData(b)).partners?.map((p) => p.id).sort()).toEqual(['shop-reg-1', 'shop-reg-2']);
  });
});
