// Partners: list, demand board, add buses (bus operators), a shop's orders. Gift ordering lives in gifts.ts.
import type { FastifyInstance } from 'fastify';
import type {
  AddServicesRequest, AddServicesResponse, Alert, DemandResponse,
  OrdersResponse, Partner, PartnersResponse, Service,
} from '../../../../shared/contract/src/index.js';
import { HttpError, traitsFor, type Deps } from '../deps.js';
import { demandFor, routeDemand, shopOrders } from '../demand.js';
import { allNewServiceTexts } from '../i18n/templates.js';
import { nextId, snapshot } from '../store.js';
import { waitingCount } from './trips.js';

function partnerOr404(deps: Deps, id: string): Partner {
  const p = deps.seed.partners.find((x) => x.id === id);
  if (!p) throw new HttpError(404, 'not_found', 'Unknown partner');
  return p;
}

function checkAddRequest(deps: Deps, partner: Partner, b: Partial<AddServicesRequest>): AddServicesRequest {
  if (partner.type !== 'bus_operator') throw new HttpError(403, 'forbidden', 'Only bus operators can add services');
  if (!b.routeId || !(partner.routes ?? []).includes(b.routeId)) throw new HttpError(400, 'bad_request', 'routeId is not one of this operator\'s routes');
  if (!b.date || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) throw new HttpError(400, 'bad_request', 'date must be YYYY-MM-DD');
  const route = deps.seed.routes.find((r) => r.id === b.routeId)!;
  return {
    routeId: b.routeId, date: b.date,
    departTime: /^\d{2}:\d{2}$/.test(b.departTime ?? '') ? b.departTime! : '22:30',
    boardingPoint: b.boardingPoint && route.boardingPoints.includes(b.boardingPoint) ? b.boardingPoint : route.boardingPoints[0],
    seats: Math.min(80, Math.max(1, Math.round(b.seats ?? 40))),
    count: Math.min(50, Math.max(1, Math.round(b.count ?? 6))),
    mode: 'bus',
  };
}

function newServiceAlert(deps: Deps, partner: Partner, r: AddServicesRequest): Alert {
  const route = deps.seed.routes.find((x) => x.id === r.routeId)!;
  const bp = deps.seed.boardingPoints.find((x) => x.id === r.boardingPoint);
  const pointName = bp?.name.split(' (')[0] ?? r.boardingPoint;
  const vars = { operator: partner.name, count: r.count, to: route.to, toLocal: route.toLocal, date: r.date, time: r.departTime, point: pointName, pointLocal: bp?.nameKn ?? pointName };
  const textLocal = allNewServiceTexts(vars);
  return { id: nextId(deps.store, 'al'), kind: 'new_service', routeId: r.routeId, date: r.date, text: textLocal['en-IN']!, textLocal, source: 'live', createdAt: deps.clock() };
}

export default async function partnerRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.get('/v1/partners', async (req): Promise<PartnersResponse> => {
    const type = (req.query as { type?: string }).type;
    return { partners: deps.seed.partners.filter((p) => !type || p.type === type) };
  });

  app.get('/v1/partners/:id/demand', async (req): Promise<DemandResponse> => {
    const partner = partnerOr404(deps, (req.params as { id: string }).id);
    const date = (req.query as { date?: string }).date;
    return { partner, cells: demandFor(deps.seed, deps.store, partner, date), label: 'Seeded demo data' };
  });

  app.post('/v1/partners/:id/services', async (req): Promise<AddServicesResponse> => {
    const partner = partnerOr404(deps, (req.params as { id: string }).id);
    const r = checkAddRequest(deps, partner, (req.body ?? {}) as Partial<AddServicesRequest>);
    const flags = await deps.flags.getFlags(partner.id, traitsFor(deps, partner.id));
    if (!flags.operator_add_service) throw new HttpError(403, 'flag_off', 'operator_add_service is off for this partner');
    const services: Service[] = Array.from({ length: r.count }, () => ({
      id: nextId(deps.store, 'svc'), routeId: r.routeId, partnerId: partner.id, mode: 'bus', date: r.date,
      departTime: r.departTime, boardingPoint: r.boardingPoint, seats: r.seats, special: true,
    }));
    deps.store.services.push(...services);
    const alert = newServiceAlert(deps, partner, r);
    deps.store.alerts.push(alert);
    snapshot(deps.store, deps.config.storeSnapshot);
    const after = routeDemand(deps.seed, deps.store, r.routeId, r.date) ?? { want: 0, have: r.count * r.seats, gap: 0 };
    return { services, alert, notified: waitingCount(deps, r.routeId, r.date), demandAfter: after };
  });

  app.get('/v1/partners/:id/orders', async (req): Promise<OrdersResponse> => {
    const partner = partnerOr404(deps, (req.params as { id: string }).id);
    return { orders: shopOrders(deps.seed, deps.store, partner.id) };
  });
}
