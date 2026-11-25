// Festival calendar: pure functions shared by the api and the app (no imports, no network, no clock).
// Source order: Flagsmith `festival_calendar` value (if valid) > seed/festival-calendar.json > seed/festivals.json + built-in list.

export interface CalFestival {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'national' | 'regional';
  states: string[]; // empty = national
  subRegions?: string[]; // optional: where in the states it is strongest (ranks it first for those travellers)
  rush: { from: string; to: string };
  line: string;
  tips: string[];
  nameLocal?: Record<string, string>; // by language, or { any: '...' } when the language is not given
  verified: boolean;
  source?: string;
}

export interface FestivalQuery { state?: string | null; region?: string | null; from?: string | null; to?: string | null }
export type Scored = CalFestival & { match: 'region' | 'state' | 'national' };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** One raw entry (our shape, seed/festivals.json shape, or the Codex calendar shape) -> CalFestival, or null. */
export function normalizeOne(v: unknown): CalFestival | null {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.name !== 'string' || typeof v.date !== 'string' || !DAY.test(v.date)) return null;
  // Two shapes: seed/festivals.json puts states in `regions`; seed/festival-calendar.json has `states` + sub-`regions`.
  const codex = Array.isArray(v.states);
  const regions = codex ? strs(v.states) : strs(v.regions);
  const national = v.type === 'national' || regions.includes('all') || regions.length === 0;
  const states = regions.filter((r) => r !== 'all'); // a national festival can still be 'state' (own) for these states
  const win = (isObj(v.rush) ? v.rush : isObj(v.rushWindow) ? v.rushWindow : isObj(v.travelWindow) ? v.travelWindow : null) as Record<string, unknown> | null;
  const okDay = (x: unknown): x is string => typeof x === 'string' && DAY.test(x);
  const from = okDay(win?.from) ? win.from : okDay(v.rushStart) ? v.rushStart : addDays(v.date, -2);
  const to = okDay(win?.to) ? win.to : okDay(v.rushEnd) ? v.rushEnd : v.date;
  const line = typeof v.line === 'string' ? v.line : typeof v.note === 'string' ? v.note.split('. ')[0] : '';
  const tips = [...strs(v.tips), ...strs(v.travelTips), ...(typeof v.tip === 'string' ? [v.tip] : [])];
  const out: CalFestival = {
    id: v.id, name: v.name, date: v.date, type: national ? 'national' : 'regional', states,
    rush: { from, to }, line, tips: tips.length ? tips : ['Book early: the nights before are the busiest.'],
    verified: v.verified === true || v.status === 'verified',
  };
  const subs = [...strs(v.subRegions), ...strs(v.sub_regions), ...(codex ? strs(v.regions) : [])];
  if (subs.length) out.subRegions = subs;
  if (isObj(v.nameLocal)) out.nameLocal = v.nameLocal as Record<string, string>;
  else if (typeof v.nameLocal === 'string' && v.nameLocal.trim()) out.nameLocal = { any: v.nameLocal };
  if (typeof v.source === 'string') out.source = v.source;
  return out;
}

/** Array or {festivals: [...]} (or a JSON string of either) -> list; null when nothing valid. */
export function normalizeCalendar(raw: unknown): CalFestival[] | null {
  let v = raw;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return null; } }
  const arr = Array.isArray(v) ? v : isObj(v) && Array.isArray(v.festivals) ? v.festivals : null;
  if (!arr) return null;
  const list = arr.map(normalizeOne).filter((f): f is CalFestival => f !== null);
  return list.length ? list : null;
}

/** Adds entries from `extra` whose id (or name + date) is not already present. */
export function mergeCalendars(base: CalFestival[], extra: CalFestival[]): CalFestival[] {
  const seen = new Set(base.flatMap((f) => [f.id, `${f.name}|${f.date}`]));
  return [...base, ...extra.filter((f) => !seen.has(f.id) && !seen.has(`${f.name}|${f.date}`))];
}

/** First valid source wins; the source name is returned for the UI / api ("flagsmith" | "file" | "fallback"). */
export function pickCalendar<K extends string>(sources: Array<[K, unknown]>): { source: K; festivals: CalFestival[] } | null {
  for (const [source, raw] of sources) {
    const festivals = normalizeCalendar(raw);
    if (festivals) return { source, festivals };
  }
  return null;
}

/** How a festival relates to the traveller: their sub-region / their state / national. null = not theirs. */
export function matchFor(f: CalFestival, state?: string | null, region?: string | null): Scored['match'] | null {
  const own = Boolean(state && f.states.includes(state));
  if (own) return region && f.subRegions?.includes(region) ? 'region' : 'state';
  return f.type === 'national' ? 'national' : null;
}

const RANK: Record<Scored['match'], number> = { region: 0, state: 1, national: 2 };

/** Festivals in [from, to] (by festival date) that are the traveller's: theirs first, then national, each by date. */
export function filterFestivals(list: CalFestival[], q: FestivalQuery): Scored[] {
  const out: Scored[] = [];
  for (const f of list) {
    if (q.from && f.date < q.from) continue;
    if (q.to && f.date > q.to) continue;
    const match = q.state ? matchFor(f, q.state, q.region) : f.type === 'national' ? 'national' : 'state';
    if (match) out.push({ ...f, match });
  }
  return out.sort((a, b) => RANK[a.match] - RANK[b.match] || a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/** The soonest festival from `today` that is the traveller's (own festivals win a tie with national ones). */
export function nextFestival(list: CalFestival[], today: string, state?: string | null, region?: string | null): Scored | null {
  const mine = filterFestivals(list, { state, region, from: today });
  return mine.sort((a, b) => a.date.localeCompare(b.date) || RANK[a.match] - RANK[b.match])[0] ?? null;
}

/** "Plan my trip home": travel the day before the festival, but never before today. */
export function tripDateFor(f: CalFestival, today: string): string {
  const d = addDays(f.date, -1);
  return d < today ? today : d;
}

export function countdownText(f: CalFestival, today: string): string {
  const n = daysBetween(today, f.date);
  if (n <= 0) return `${f.name} is today`;
  return n === 1 ? `${f.name} is tomorrow` : `${n} days to ${f.name}`;
}

export interface WindowDemand { festivalId: string; name: string; from: string; to: string; want: number; have: number; gap: number; days: number }
export interface DemandDay { routeId: string; date: string; want: number; have: number }

/** Demand vs seats over each festival's rush window for the given routes. days = days with forecast data (0 = none yet).
 * gap = seats still missing, summed per route-night (a quiet night does not cancel a packed one). */
export function festivalWindows(festivals: CalFestival[], cells: DemandDay[], routeIds: string[]): WindowDemand[] {
  const routes = new Set(routeIds);
  return festivals.map((f) => {
    const inWin = cells.filter((c) => routes.has(c.routeId) && c.date >= f.rush.from && c.date <= f.rush.to);
    const want = inWin.reduce((a, c) => a + c.want, 0);
    const have = inWin.reduce((a, c) => a + c.have, 0);
    const gap = inWin.reduce((a, c) => a + Math.max(0, c.want - c.have), 0); // unmet seats per route-night, not netted across nights
    return { festivalId: f.id, name: f.name, from: f.rush.from, to: f.rush.to, want, have, gap, days: new Set(inWin.map((c) => c.date)).size };
  });
}
