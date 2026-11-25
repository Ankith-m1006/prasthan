// v3: businesses register themselves from the app (demo: no password). POST /v1/partners/register -> {partner}.
// Registered partners live in the shared store (Upstash when connected) and join deps.seed.partners, so every
// existing partner endpoint (list, demand, add buses, pickups, orders, shops) works for them unchanged.
import type { FastifyInstance } from 'fastify';
import type { Partner, PartnerType, RegisterPartnerRequest, RegisterPartnerResponse, ShopItem } from '../../../../shared/contract/src/index.js';
import { HttpError, type Deps } from '../deps.js';
import { nextId, snapshot } from '../store.js';

const TYPES: PartnerType[] = ['bus_operator', 'sweet_shop', 'quick_commerce'];
const INSTALLED = Symbol.for('prasthan.registeredPartners');

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'item';

/** Makes deps.seed.partners = seeded partners + the ones registered in the store (once per seed object). */
export function joinRegistered(deps: Deps): void {
  const seed = deps.seed as unknown as Record<symbol, boolean>;
  if (seed[INSTALLED]) return;
  const base = deps.seed.partners;
  Object.defineProperty(deps.seed, 'partners', { get: () => [...base, ...deps.store.partners], configurable: true });
  seed[INSTALLED] = true;
}

function items(b: Partial<RegisterPartnerRequest>): ShopItem[] {
  const raw = Array.isArray(b.items) ? b.items : [];
  if (raw.length < 1 || raw.length > 8) throw new HttpError(400, 'bad_request', 'A sweet shop needs 1-8 items');
  return raw.map((i, n) => {
    const name = String(i?.name ?? '').trim().slice(0, 40);
    const priceInr = Math.round(Number(i?.priceInr));
    if (!name) throw new HttpError(400, 'bad_request', `Item ${n + 1} needs a name`);
    if (!(priceInr > 0) || priceInr > 10000) throw new HttpError(400, 'bad_request', `Item ${n + 1} needs a price between 1 and 10000`);
    const unit = String(i?.unit ?? 'kg').trim().slice(0, 12) || 'kg';
    return { id: `${slug(name)}-${n + 1}`, name, nameLocal: name, unit, priceInr, readyInMinutes: 30, dailyCapacity: 100 };
  });
}

export function buildPartner(deps: Deps, b: Partial<RegisterPartnerRequest>): Partner {
  if (!b.type || !TYPES.includes(b.type)) throw new HttpError(400, 'bad_request', 'type must be bus_operator, sweet_shop or quick_commerce');
  const name = String(b.name ?? '').trim().slice(0, 60);
  if (name.length < 2) throw new HttpError(400, 'bad_request', 'name is required');
  if (deps.seed.partners.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new HttpError(409, 'conflict', 'A business with this name exists');
  const bp = b.boardingPoint && deps.seed.boardingPoints.some((x) => x.id === b.boardingPoint) ? b.boardingPoint : undefined;
  const base: Partner = { id: '', type: b.type, name, registered: true, city: String(b.city ?? 'Bengaluru').slice(0, 40), ...(bp ? { boardingPoint: bp } : {}) };
  if (b.type === 'sweet_shop') {
    if (!bp) throw new HttpError(400, 'bad_request', 'A sweet shop needs a boardingPoint (nearest pickup point)');
    return { ...base, id: nextId(deps.store, 'shop-reg'), items: items(b), walkMinutes: 5 };
  }
  if (b.type === 'bus_operator') {
    const routes = (Array.isArray(b.routes) ? b.routes : []).filter((r) => deps.seed.routes.some((x) => x.id === r));
    if (!routes.length) throw new HttpError(400, 'bad_request', 'A bus operator needs at least one known route');
    const seatsPerNight = Math.round(Number(b.seatsPerNight ?? 0));
    if (!(seatsPerNight > 0) || seatsPerNight > 20000) throw new HttpError(400, 'bad_request', 'seatsPerNight must be between 1 and 20000');
    return { ...base, id: nextId(deps.store, 'op-reg'), routes: [...new Set(routes)], seatsPerNight };
  }
  return { ...base, id: nextId(deps.store, 'qc-reg'), serves: bp ? [bp] : [] };
}

export default async function partnerAccountRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  joinRegistered(deps);
  app.post('/v1/partners/register', async (req): Promise<RegisterPartnerResponse> => {
    const partner = buildPartner(deps, (req.body ?? {}) as Partial<RegisterPartnerRequest>);
    deps.store.partners.push(partner);
    snapshot(deps.store, deps.config.storeSnapshot);
    return { partner };
  });
}
