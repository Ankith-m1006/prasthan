// POST /v1/trips (save + subscribe), GET /v1/alerts (seed + live + Flagsmith announcements)
import type { FastifyInstance } from 'fastify';
import type { Alert, AlertsResponse, FlagsView, TripIntent, TripRequest, TripResponse } from '../../../../shared/contract/src/index.js';
import { HttpError, identityOf, traitsFor, type Deps } from '../deps.js';
import { nextId, snapshot } from '../store.js';

/** Travellers waiting for a bus on routeId+date: saved trips + seed intents with wantsAlerts. */
export function waitingCount(deps: Deps, routeId: string, date: string): number {
  const busOk = (m: string | null) => m === 'bus' || m === null;
  const trips = deps.store.trips.filter((t) => t.subscribed && t.intent.routeId === routeId && t.intent.dateFrom === date && busOk(t.intent.mode));
  const seeds = deps.seed.intents.filter((i) => i.wantsAlerts && i.routeId === routeId && i.dateFrom === date && busOk(i.mode));
  return trips.length + seeds.length;
}

function announcementAlerts(flags: FlagsView, source: Alert['source']): Alert[] {
  return flags.special_service_announcements.map((a, i) => ({
    id: `ann-${i + 1}`, kind: 'info', routeId: a.routeId ?? null, date: a.date ?? null, text: a.text, source,
    createdAt: '2027-01-05T00:00:00+05:30',
  }));
}

export function alertsFor(deps: Deps, identity: string, flags: FlagsView, since?: string): Alert[] {
  const myRoutes = new Set(deps.store.trips.filter((t) => t.intent.travellerId === identity).map((t) => t.intent.routeId));
  const newestFirst = (a: Alert, b: Alert) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const live = [...deps.store.alerts].sort(newestFirst);
  const rest = [...announcementAlerts(flags, deps.flags.mode === 'live' ? 'live' : 'mock'), ...deps.seed.alerts]
    .sort((a, b) => Number(myRoutes.has(b.routeId)) - Number(myRoutes.has(a.routeId)) || newestFirst(a, b));
  const all = [...live, ...rest];
  const t = since ? Date.parse(since) : NaN;
  return Number.isNaN(t) ? all : all.filter((a) => Date.parse(a.createdAt) > t);
}

function validIntent(x: unknown): x is TripIntent {
  const i = x as Partial<TripIntent> | null;
  return Boolean(i && typeof i === 'object' && typeof i.travellerId === 'string' && 'routeId' in i && typeof i.people === 'number');
}

export default async function tripRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.post('/v1/trips', async (req): Promise<TripResponse> => {
    const body = (req.body ?? {}) as Partial<TripRequest>;
    if (!validIntent(body.intent)) throw new HttpError(400, 'bad_request', 'intent with travellerId, routeId and people is required');
    const trip = { id: nextId(deps.store, 'trip'), intent: body.intent, subscribed: true, createdAt: deps.clock() };
    deps.store.trips = deps.store.trips.filter((t) => !(t.intent.travellerId === trip.intent.travellerId && t.intent.routeId === trip.intent.routeId && t.intent.dateFrom === trip.intent.dateFrom));
    deps.store.trips.push(trip);
    snapshot(deps.store, deps.config.storeSnapshot);
    return { trip };
  });

  app.get('/v1/alerts', async (req): Promise<AlertsResponse> => {
    const q = req.query as { identity?: string; since?: string };
    const identity = q.identity ?? identityOf(req.headers['x-prasthan-identity']);
    const flags = await deps.flags.getFlags(identity, traitsFor(deps, identity));
    return { alerts: alertsFor(deps, identity, flags, q.since), source: 'seeded' };
  });
}
