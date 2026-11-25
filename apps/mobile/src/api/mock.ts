// MockClient: the whole api on bundled SYNTHETIC seed data, in memory, no network (EXPO_PUBLIC_APP_MOCK=1, or after
// 2 failed api calls). Same shapes as the real api (shared/contract), so screens don't care which one they talk to.
import type {
  AddServicesRequest, Alert, DeepLink, DemandCell, GiftOrder, GiftOrderRequest, Lang, Mode, Partner, Service, Traits, Trip, TripIntent,
  VoiceIntentResponse, Warning,
} from '@contract';
import alertsJson from '../../../../seed/alerts.json';
import bpJson from '../../../../seed/boarding-points.json';
import linksJson from '../../../../seed/deep-links.json';
import forecastJson from '../../../../seed/demand-forecast.json';
import festivalsJson from '../../../../seed/festivals.json';
import ordersJson from '../../../../seed/gift-orders.json';
import intentsJson from '../../../../seed/intents.json';
import partnersJson from '../../../../seed/partners.json';
import qcJson from '../../../../seed/qc-demand.json';
import routesJson from '../../../../seed/routes.json';
import { dateLabel, mockReply } from '../lib/format';
import { miniParse, UTTERANCES } from '../lib/miniParse';
import { currentIdentity } from '../state/identity';
import { mockFlags, type DemoSwitches } from './mockFlags';
import type { Api } from './types';

const ROUTES = routesJson.routes;
const PARTNERS = partnersJson.partners as unknown as Partner[];
const FORECAST = forecastJson.cells;
const LABEL = 'Seeded demo data';
const nowIso = () => `2027-01-05T${new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(11, 19)}+05:30`;

interface MockState { traits: Map<string, Traits>; trips: Trip[]; services: Service[]; alerts: Alert[]; orders: GiftOrder[]; n: number; switches: DemoSwitches }
export const mockState: MockState = { traits: new Map(), trips: [], services: [], alerts: [], orders: [], n: 9000, switches: {} };
const nextId = (p: string) => `${p}-${(mockState.n += 1)}`;

function traitsOf(id: string): Traits {
  const p = PARTNERS.find((x) => x.id === id);
  return mockState.traits.get(id) ?? (p ? { role: 'partner', partner_type: p.type, partner_id: p.id } : { role: 'traveller', language: 'kn-IN', home_state: 'Karnataka' });
}
export const flagsNow = (id = currentIdentity()) => mockFlags(id, traitsOf(id), mockState.switches);

function routeDemand(routeId: string, date: string) {
  const c = FORECAST.find((x) => x.routeId === routeId && x.date === date);
  if (!c) return null;
  const have = c.seatsExist + mockState.services.filter((s) => s.routeId === routeId && s.date === date).reduce((a, s) => a + s.seats, 0);
  return { want: c.wantSeats, have, gap: Math.max(0, c.wantSeats - have) };
}

function busCells(p: Partner, date?: string): DemandCell[] {
  return FORECAST.filter((c) => (p.routes ?? []).includes(c.routeId) && (!date || c.date === date)).map((c) => {
    const d = routeDemand(c.routeId, c.date)!;
    const to = ROUTES.find((r) => r.id === c.routeId)?.to ?? c.routeId;
    const n = Math.ceil(d.gap / 40);
    return { key: `${c.routeId}|${c.date}|${c.timeWindow}`, label: `BLR -> ${to}, ${dateLabel(c.date)}, ${c.timeWindow}`, date: c.date, window: c.timeWindow, want: d.want, have: d.have, gap: d.gap, suggestion: d.gap > 0 ? `Add ${n} bus${n === 1 ? '' : 'es'}` : null, routeId: c.routeId };
  });
}

function shopCells(p: Partner, date?: string): DemandCell[] {
  const groups = new Map<string, GiftOrder[]>();
  for (const o of [...(ordersJson.orders as GiftOrder[]), ...mockState.orders]) {
    if (o.partnerId !== p.id || (date && o.pickupDate !== date)) continue;
    const k = `${o.pickupDate}|${o.itemId}`;
    groups.set(k, [...(groups.get(k) ?? []), o]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, os]) => {
    const [d, itemId] = k.split('|');
    const item = p.items?.find((i) => i.id === itemId);
    const qty = os.reduce((a, o) => a + o.qty, 0);
    const by = os.map((o) => o.readyBy).sort()[0];
    return { key: `${p.id}|${k}`, label: `${item?.name ?? itemId}, ${dateLabel(d)}`, date: d, window: by, want: qty, have: item?.dailyCapacity ?? 0, gap: Math.max(0, qty - (item?.dailyCapacity ?? 0)), suggestion: `Prepare ${qty} ${item?.unit ?? 'kg'} ${item?.name ?? itemId} by ${by}, ${dateLabel(d)}`, zone: p.boardingPoint };
  });
}

function qcCells(p: Partner, date?: string): DemandCell[] {
  const cells = qcJson.cells.filter((c) => !date || c.date === date);
  const mine = cells.filter((c) => (p.serves ?? []).includes(c.fulfilment));
  return (mine.length ? mine : cells).map((c) => {
    const want = c.travellersLeaving ?? c.travellersArriving ?? 0;
    return { key: `${c.zone}|${c.date}|${c.window}`, label: `${c.zone}, ${dateLabel(c.date)}, ${c.window}`, date: c.date, window: c.window, want, have: 0, gap: want, suggestion: `Stock ${c.topAsks[0]} ${c.travellersArriving !== undefined ? 'arriving in' : 'near'} ${c.zone} ${c.window}`, zone: c.zone };
  });
}

function waiting(routeId: string, date: string): number {
  const ok = (m: string | null) => m === 'bus' || m === null;
  const seeds = intentsJson.intents.filter((i) => i.wantsAlerts && i.routeId === routeId && i.dateFrom === date && ok(i.mode));
  return seeds.length + mockState.trips.filter((t) => t.intent.routeId === routeId && t.intent.dateFrom === date && ok(t.intent.mode)).length;
}

function turn(text: string, language: Lang, context: TripIntent | null, stt: 'mock' | 'fallback'): VoiceIntentResponse {
  const intent = { ...miniParse(text, language, '2027-01-05', context, nextId('int')), travellerId: mockState.traits.has(currentIdentity()) ? currentIdentity() : 'trav-demo' };
  const toLocal = ROUTES.find((r) => r.id === intent.routeId)?.toLocal ?? null;
  return { transcript: text, language, intent, reply: { text: mockReply(intent, toLocal), language, audioBase64: null, mime: null, audioUrl: null }, source: { stt, llm: 'mock', tts: 'mock' } };
}

function links(mode: Mode): DeepLink[] {
  const order = flagsNow().deep_link_providers[mode] ?? [];
  return order.map((id) => linksJson.providers.find((p) => p.id === id && (p.modes as string[]).includes(mode))).filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ providerId: p.id, name: p.name, mode, url: p.homepage, kind: 'homepage' as const }));
}

function warnings(date: string | null): Warning[] {
  const f = flagsNow();
  const fest = festivalsJson.festivals.find((x) => x.id === f.festival_mode.festivalId) as { rushNights?: string[] } | undefined;
  const rush = new Set([...f.surge_warning.rushNights, ...(fest?.rushNights ?? [])]);
  const out: Warning[] = [];
  if (date && rush.has(date)) out.push({ kind: 'rush_night', text: `${dateLabel(date).slice(4)} is a rush night. Book early; fares on private buses often go up a lot.`, textLocal: { 'kn-IN': `ಜನವರಿ ${Number(date.slice(8))} ಭಾರೀ ರಶ್ ರಾತ್ರಿ. ಬೇಗ ಬುಕ್ ಮಾಡಿ; ಖಾಸಗಿ ಬಸ್ ದರ ತುಂಬಾ ಏರಬಹುದು.` } });
  if (f.surge_warning.showToutWarning) out.push({ kind: 'tout_warning', text: linksJson.safetyCopy['en-IN'], textLocal: { 'kn-IN': linksJson.safetyCopy['kn-IN'] } });
  return out;
}

export function createMockClient(): Api {
  const ok = <T>(v: T) => Promise.resolve(v);
  return {
    kind: 'mock',
    identify: (identity, traits) => { mockState.traits.set(identity, { ...traitsOf(identity), ...traits }); return ok({ identity, flags: flagsNow(identity) }); },
    config: () => { const flags = flagsNow(); return ok({ identity: currentIdentity(), flags, festival: (festivalsJson.festivals.find((x) => x.id === flags.festival_mode.festivalId) ?? null) as never, source: 'mock' as const }); },
    voiceIntent: async (audio, language, context) => {
      if (flagsNow().voice_fallback_offline) return { ...turn('', language, context, 'fallback'), reply: { text: 'Voice is resting right now. Please type, or pick a sample sentence.', language, audioBase64: null, mime: null, audioUrl: null }, source: { stt: 'fallback', llm: 'fallback', tts: 'fallback' } };
      const sample = UTTERANCES.find((u) => audio.name.includes(u.id)) ?? UTTERANCES.find((u) => u.language === language) ?? UTTERANCES[0];
      return turn(sample.text, language, context, 'mock');
    },
    parse: (text, language, context) => ok(turn(text, language, context, 'fallback')),
    tts: () => ok({ audioBase64: null, mime: null, source: 'mock' as const }),
    options: (routeId, date, mode) => {
      const m = mode ?? 'bus';
      const d = date && m === 'bus' ? routeDemand(routeId, date) : null;
      return ok({ routeId, date, mode: m, links: links(m), warnings: warnings(date), demand: d ? { want: d.want, have: d.have, label: LABEL } : null, source: 'seeded' as const });
    },
    saveTrip: (intent) => { const trip = { id: nextId('trip'), intent, subscribed: true, createdAt: nowIso() }; mockState.trips = [...mockState.trips.filter((t) => !(t.intent.routeId === intent.routeId && t.intent.dateFrom === intent.dateFrom)), trip]; return ok({ trip }); },
    alerts: () => ok({ alerts: [...[...mockState.alerts].reverse(), ...(alertsJson.alerts as Alert[])], source: 'seeded' as const }),
    partners: (type) => ok({ partners: PARTNERS.filter((p) => !type || p.type === type) }),
    demand: (id, date) => {
      const p = PARTNERS.find((x) => x.id === id)!;
      const cells = p.type === 'bus_operator' ? busCells(p, date) : p.type === 'sweet_shop' ? shopCells(p, date) : qcCells(p, date);
      return ok({ partner: p, cells, label: LABEL });
    },
    addServices: (id, r: AddServicesRequest) => {
      const p = PARTNERS.find((x) => x.id === id)!;
      const route = ROUTES.find((x) => x.id === r.routeId)!;
      const services: Service[] = Array.from({ length: r.count }, () => ({ id: nextId('svc'), routeId: r.routeId, partnerId: id, mode: 'bus', date: r.date, departTime: r.departTime, boardingPoint: r.boardingPoint, seats: r.seats, special: true }));
      mockState.services.push(...services);
      const bp = bpJson.boardingPoints.find((b) => b.id === r.boardingPoint);
      const point = bp?.name.split(' (')[0] ?? r.boardingPoint;
      const alert: Alert = { id: nextId('al'), kind: 'new_service', routeId: r.routeId, date: r.date, text: `${p.name} added ${r.count} buses BLR -> ${route.to}, ${dateLabel(r.date).slice(4)} ${r.departTime} from ${point}`, textLocal: { 'kn-IN': `${p.name}: ${route.toLocal}ಗೆ ${r.count} ಹೊಸ ಬಸ್ ಸೇರಿಸಿದೆ. ಜನವರಿ ${Number(r.date.slice(8))}, ರಾತ್ರಿ ${r.departTime}, ${bp?.nameKn ?? point}ನಿಂದ.` }, source: 'live', createdAt: nowIso() };
      mockState.alerts.push(alert);
      return ok({ services, alert, notified: waiting(r.routeId, r.date), demandAfter: routeDemand(r.routeId, r.date) ?? { want: 0, have: 0, gap: 0 } });
    },
    giftOrder: (b: GiftOrderRequest) => { const order: GiftOrder = { id: nextId('ord'), partnerId: b.partnerId, travellerId: b.travellerId, itemId: b.itemId, qty: b.qty, pickupPoint: b.pickupPoint ?? 'MAJESTIC', pickupDate: b.pickupDate, readyBy: b.readyBy, status: 'placed', payment: 'pay_at_pickup_demo' }; mockState.orders.push(order); return ok({ order }); },
    orders: (id) => ok({ orders: [...(ordersJson.orders as GiftOrder[]), ...mockState.orders].filter((o) => o.partnerId === id) }),
    opsState: () => ok({ fallbackActive: Boolean(mockState.switches.fallback), voiceHealthy: true }),
  };
}
