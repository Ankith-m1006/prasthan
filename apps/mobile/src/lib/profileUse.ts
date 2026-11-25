// What the profile is used for: Flagsmith traits, a pre-filled trip, and soft travel hints.
import type { Mode, Traits, TripIntent } from '@contract';
import routesJson from '../../../../seed/routes.json';
import type { Profile, TravellingWith } from '../state/profile';

const ROUTES = routesJson.routes;

/** Traits Flagsmith segments use (Tamil Nadu -> Pongal mode). Optional age/gender are NOT sent. */
export type ProfileTraits = Traits & { travel_mode?: string; travelling_with?: string; region?: string };
export function profileTraits(p: Profile): ProfileTraits {
  const town = ROUTES.find((r) => r.id === p.homeRouteId)?.to;
  return { role: 'traveller', language: p.language, home_state: p.homeState, home_town: town, travel_mode: p.mode, travelling_with: p.travellingWith, ...(p.region ? { region: p.region } : {}) };
}

const PEOPLE: Record<TravellingWith, number> = { alone: 1, family: 3, kids: 3, elders: 2 };

/** A trip from the profile alone: boarding point -> home town, usual mode and people. Day is still to pick. */
export function tripFromProfile(p: Profile, travellerId: string): TripIntent {
  const route = ROUTES.find((r) => r.id === p.homeRouteId);
  return {
    id: `local-${Date.now()}`, travellerId, from: 'Bengaluru', to: route?.to ?? null, routeId: route?.id ?? null,
    dateFrom: null, dateTo: null, timeWindow: 'any', mode: p.mode, people: PEOPLE[p.travellingWith], boardingPoint: p.boardingPoint,
    festivalId: null, gift: null, needsFollowUp: route ? ['date'] : ['to', 'date'], language: p.language, transcript: '', confidence: 1, parser: 'rules',
  };
}

/** Fill only what the sentence left empty with the profile's usual trip. */
export function fillFromProfile(i: TripIntent, p: Profile | null): TripIntent {
  if (!p) return i;
  const home = ROUTES.find((r) => r.id === p.homeRouteId);
  const next: TripIntent = { ...i, boardingPoint: i.boardingPoint ?? p.boardingPoint, mode: i.mode ?? p.mode };
  if (!next.routeId && home) { next.routeId = home.id; next.to = home.to; }
  if (i.people === 1 && p.travellingWith !== 'alone') next.people = PEOPLE[p.travellingWith];
  next.needsFollowUp = [...(next.routeId ? [] : ['to' as const]), ...(next.dateFrom ? [] : ['date' as const])];
  return next;
}

/** Soft, factual hints from the optional fields only. Shown on bus/train results. */
export function travelHints(p: Profile | null, mode: Mode | null): string[] {
  if (!p || (mode !== 'bus' && mode !== 'train')) return [];
  const out: string[] = [];
  if (p.ageGroup === '60plus' || p.travellingWith === 'elders') {
    out.push(mode === 'train'
      ? 'Travelling with a senior citizen? You can ask for a lower berth when you book, and ask whether a senior concession applies.'
      : 'Travelling with a senior citizen? Ask at booking whether a senior concession or a front seat is available.');
  }
  if (p.gender === 'woman') {
    out.push(mode === 'train'
      ? 'Many trains keep a ladies\' quota. Ask at booking or check the quota list on the booking site.'
      : 'Many buses keep seats for women. Look for the ladies\' seat mark when you pick a seat, or ask at booking.');
  }
  return out;
}
