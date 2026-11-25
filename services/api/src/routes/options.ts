// GET /v1/options: official booking deep links (no prices, no ranking) + rush/tout warnings + seeded demand.
import type { FastifyInstance } from 'fastify';
import type { DeepLink, FlagsView, Mode, OptionsResponse, Warning } from '../../../../shared/contract/src/index.js';
import { HttpError, identityOf, traitsFor, type Deps } from '../deps.js';
import { routeDemand } from '../demand.js';
import { rushNightText } from '../i18n/templates.js';

const MODES: Mode[] = ['bus', 'train', 'air'];

export function buildLinks(deps: Deps, flags: FlagsView, mode: Mode, useTemplate: boolean): DeepLink[] {
  const order = flags.deep_link_providers[mode] ?? [];
  return order
    .map((id) => deps.seed.providers.find((p) => p.id === id && p.modes.includes(mode)))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => {
      const search = useTemplate && p.useTemplate && p.searchTemplate;
      return { providerId: p.id, name: p.name, mode, url: search ? p.searchTemplate! : p.homepage, kind: search ? 'search' : 'homepage' };
    });
}

export function buildWarnings(deps: Deps, flags: FlagsView, date: string | null): Warning[] {
  const out: Warning[] = [];
  const festival = deps.seed.festivals.find((f) => f.id === flags.festival_mode.festivalId);
  const rush = new Set([...flags.surge_warning.rushNights, ...(festival?.rushNights ?? [])]);
  if (date && rush.has(date)) out.push({ kind: 'rush_night', ...rushNightText(date) });
  if (flags.surge_warning.showToutWarning) {
    const { 'en-IN': en, ...local } = deps.seed.safetyCopy;
    out.push({ kind: 'tout_warning', text: en ?? 'Book only on official apps or counters.', textLocal: local });
  }
  return out;
}

export default async function optionsRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.get('/v1/options', async (req): Promise<OptionsResponse> => {
    const q = req.query as Record<string, string | undefined>;
    const route = deps.seed.routes.find((r) => r.id === q.routeId);
    if (!route) throw new HttpError(404, 'not_found', 'Unknown routeId');
    const mode: Mode = MODES.includes(q.mode as Mode) ? (q.mode as Mode) : (route.modes[0] ?? 'bus');
    const date = q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) ? q.date : null;
    const identity = identityOf(req.headers['x-prasthan-identity']);
    const flags = await deps.flags.getFlags(identity, traitsFor(deps, identity));
    const d = date && mode === 'bus' ? routeDemand(deps.seed, deps.store, route.id, date) : null;
    return {
      routeId: route.id, date, mode,
      links: buildLinks(deps, flags, mode, q.useTemplate === 'true'),
      warnings: buildWarnings(deps, flags, date),
      demand: d ? { want: d.want, have: d.have, label: 'Seeded demo data' } : null,
      source: 'seeded',
    };
  });
}
