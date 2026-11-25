// GET /v1/config, POST /v1/identify
import type { FastifyInstance } from 'fastify';
import type { ConfigResponse, IdentifyRequest, IdentifyResponse, Traits } from '../../../../shared/contract/src/index.js';
import { HttpError, identityOf, traitsFor, type Deps } from '../deps.js';

const TRAIT_KEYS: Array<keyof Traits> = ['role', 'language', 'home_state', 'home_town', 'partner_type', 'partner_id'];

function cleanTraits(input: unknown): Traits {
  const out: Record<string, string> = {};
  if (typeof input !== 'object' || input === null) return out;
  for (const k of TRAIT_KEYS) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.length <= 60) out[k] = v;
  }
  return out as Traits;
}

export default async function configRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.post('/v1/identify', async (req): Promise<IdentifyResponse> => {
    const body = (req.body ?? {}) as Partial<IdentifyRequest>;
    const identity = typeof body.identity === 'string' && body.identity ? body.identity.slice(0, 80) : identityOf(req.headers['x-prasthan-identity'], '');
    if (!identity) throw new HttpError(400, 'bad_request', 'identity is required');
    const traits = { ...traitsFor(deps, identity), ...cleanTraits(body.traits) };
    deps.store.traits.set(identity, traits);
    return { identity, flags: await deps.flags.getFlags(identity, traits) };
  });

  app.get('/v1/config', async (req): Promise<ConfigResponse> => {
    const q = req.query as { identity?: string };
    const identity = q.identity ?? identityOf(req.headers['x-prasthan-identity']);
    const flags = await deps.flags.getFlags(identity, traitsFor(deps, identity));
    const festival = deps.seed.festivals.find((f) => f.id === flags.festival_mode.festivalId) ?? null;
    return { identity, flags, festival, source: deps.flags.mode === 'live' ? 'live' : 'mock' };
  });
}
