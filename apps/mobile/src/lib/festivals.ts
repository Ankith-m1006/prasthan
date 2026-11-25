// Festival calendar helpers for the app (pure; tested). Logic lives in shared/festivals so the api and app agree.
import type { Partner, TripIntent } from '@contract';
import forecastJson from '../../../../seed/demand-forecast.json';
import calendarJson from '../../../../seed/festival-calendar.json';
import festivalsJson from '../../../../seed/festivals.json';
import {
  addDays, countdownText, daysBetween, festivalWindows, filterFestivals, mergeCalendars, nextFestival, normalizeCalendar, tripDateFor,
  type CalFestival, type Scored, type WindowDemand,
} from '../../../../shared/festivals/calendar';
import { FALLBACK_FESTIVALS, SUB_REGIONS } from '../../../../shared/festivals/fallback';
import type { Profile } from '../state/profile';
import { tripFromProfile } from './profileUse';

export type { CalFestival, Scored, WindowDemand };
export { addDays, countdownText, daysBetween, filterFestivals, nextFestival, SUB_REGIONS, tripDateFor };

/** Bundled calendar (offline): seed/festival-calendar.json; if it is missing or broken, seed/festivals.json + the built-in list. */
export const BUNDLED: CalFestival[] = normalizeCalendar(calendarJson) ?? mergeCalendars(normalizeCalendar(festivalsJson) ?? [], FALLBACK_FESTIVALS);

/** Local-script name for the reply language (or the one the calendar gives without a language). */
export const localName = (f: CalFestival, lang: string): string | undefined => f.nameLocal?.[lang] ?? f.nameLocal?.any;

/** Today's calendar day in India (YYYY-MM-DD). */
export function todayIST(now: number = Date.now()): string {
  return new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10);
}

export function subRegionsFor(state: string): string[] {
  return SUB_REGIONS[state] ?? [];
}

/** "Plan my trip home": the usual trip from the profile, on the day before the festival. */
export function planTrip(p: Profile, f: CalFestival, travellerId: string, today: string): TripIntent {
  const base = tripFromProfile(p, travellerId);
  const date = tripDateFor(f, today);
  return { ...base, dateFrom: date, dateTo: date, timeWindow: 'night', festivalId: f.id, needsFollowUp: base.routeId ? [] : ['to'] };
}

/** Split for the screen: the traveller's own festivals, then national ones. */
export function splitByMatch(list: Scored[]): { mine: Scored[]; national: Scored[] } {
  return { mine: list.filter((f) => f.match !== 'national'), national: list.filter((f) => f.match === 'national') };
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
}
export const rushLabel = (f: CalFestival) => `Rush days ${dayLabel(f.rush.from)} - ${dayLabel(f.rush.to)}`;

/** Month grid: weeks of 7 cells (null = padding), Sunday first. month = 'YYYY-MM'. */
export function monthGrid(month: string): Array<Array<string | null>> {
  const first = `${month}-01`;
  const pad = new Date(`${first}T00:00:00Z`).getUTCDay();
  const cells: Array<string | null> = Array.from({ length: pad }, () => null);
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export function monthTitle(month: string): string {
  return `${MON[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

export function shiftMonth(month: string, n: number): string {
  const y = Number(month.slice(0, 4)); const m = Number(month.slice(5, 7)) - 1 + n;
  const d = new Date(Date.UTC(y, m, 1));
  return d.toISOString().slice(0, 7);
}

/** Offline festival weeks for an operator: the same sums as the api, from the bundled (seeded) forecast. */
export function offlineWeeks(partner: Partner, today: string): WindowDemand[] {
  const cells = forecastJson.cells.map((c) => ({ routeId: c.routeId, date: c.date, want: c.wantSeats, have: c.seatsExist }));
  return festivalWindows(BUNDLED.filter((f) => f.rush.to >= today), cells, partner.routes ?? []);
}
