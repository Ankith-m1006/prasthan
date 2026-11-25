// GET /v1/festivals, GET /v1/partners/:id/festival-weeks, GET /v1/alerts/:id/text (Sarvam-translated alert).
import type { FastifyInstance } from 'fastify';
import type { Lang } from '../../../../shared/contract/src/index.js';
import { filterFestivals } from '../../../../shared/festivals/calendar.js';
import { HttpError, type Deps } from '../deps.js';
import { alertText, loadCalendar, operatorWindows, type TAlert } from '../festivals.js';
import { LANGS } from '../i18n/templates.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (v: unknown) => (typeof v === 'string' && DAY.test(v) ? v : null);
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 60) : null);
const today = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST calendar day

export default async function festivalRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.get('/v1/festivals', async (req) => {
    const q = req.query as Record<string, unknown>;
    const { source, festivals } = await loadCalendar(deps);
    const from = day(q.from) ?? today();
    const list = filterFestivals(festivals, { state: text(q.state), region: text(q.region), from, to: day(q.to) })
      .map((f) => ({ ...f, travelWindow: f.rush })); // travelWindow = the older seed shape (partner festivals screen)
    return { festivals: list, source, from, label: 'Dates checked 25 Nov 2026; unverified ones are marked' };
  });

  app.get('/v1/partners/:id/festival-weeks', async (req) => {
    const partner = deps.seed.partners.find((p) => p.id === (req.params as { id: string }).id);
    if (!partner) throw new HttpError(404, 'not_found', 'Unknown partner');
    if (partner.type !== 'bus_operator') throw new HttpError(400, 'bad_request', 'Festival weeks are for bus operators');
    const { festivals } = await loadCalendar(deps);
    const states = new Set(deps.seed.routes.filter((r) => (partner.routes ?? []).includes(r.id)).map((r) => r.state));
    const from = day((req.query as Record<string, unknown>).from) ?? today();
    const mine = festivals.filter((f) => f.rush.to >= from && (f.type === 'national' || f.states.some((s) => states.has(s))));
    const weeks = operatorWindows(deps, partner, mine).sort((a, b) => a.from.localeCompare(b.from));
    return { partner: { id: partner.id, name: partner.name }, weeks, label: 'Seeded demo data' };
  });

  app.get('/v1/alerts/:id/text', async (req) => {
    const id = (req.params as { id: string }).id;
    const lang = (req.query as { lang?: string }).lang as Lang | undefined;
    if (!lang || !LANGS.includes(lang)) throw new HttpError(400, 'bad_request', 'lang must be one of ' + LANGS.join(', '));
    const alert = ([...deps.store.alerts, ...deps.seed.alerts] as TAlert[]).find((a) => a.id === id);
    if (!alert) throw new HttpError(404, 'not_found', 'Unknown alert');
    const out = await alertText(deps, alert, lang);
    return { id, lang, ...out };
  });
}
