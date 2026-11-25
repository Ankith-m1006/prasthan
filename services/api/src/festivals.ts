// Festival calendar for the api: Flagsmith `festival_calendar` value > seed/festival-calendar.json > festivals.json + built-in list.
// Also: festival-week demand per operator, and Sarvam-translated alert text (cached per alert + language, templates as fallback).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Alert, Lang, Partner } from '../../../shared/contract/src/index.js';
import { festivalWindows, mergeCalendars, normalizeCalendar, pickCalendar, type CalFestival, type WindowDemand } from '../../../shared/festivals/calendar.js';
import { FALLBACK_FESTIVALS } from '../../../shared/festivals/fallback.js';
import type { Deps } from './deps.js';
import { routeDemand } from './demand.js';
import { seedDir } from './seed.js';

export type CalendarSource = 'flagsmith' | 'file' | 'fallback';

function readFileCalendar(dir: string): unknown {
  const path = join(dir, 'festival-calendar.json');
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

/** The calendar and where it came from. A bad or missing Flagsmith value never breaks the endpoint. */
export async function loadCalendar(deps: Deps): Promise<{ source: CalendarSource; festivals: CalFestival[] }> {
  const remote = deps.remoteCalendar ? await withTimeout(deps.remoteCalendar(), 4000) : null;
  const seedList = normalizeCalendar({ festivals: deps.seed.festivals }) ?? [];
  const picked = pickCalendar<CalendarSource>([
    ['flagsmith', remote],
    ['file', readFileCalendar(seedDir(deps.config.seedDir))],
  ]);
  return picked ?? { source: 'fallback', festivals: mergeCalendars(seedList, FALLBACK_FESTIVALS) };
}

/** Demand vs seats over each festival's rush window, for one operator's routes (seeded forecast + live buses). */
export function operatorWindows(deps: Deps, partner: Partner, festivals: CalFestival[]): WindowDemand[] {
  const routes = partner.routes ?? [];
  const dates = new Set(deps.seed.forecast.map((c) => c.date));
  const cells = routes.flatMap((routeId) => [...dates].map((date) => {
    const d = routeDemand(deps.seed, deps.store, routeId, date);
    return d ? { routeId, date, want: d.want, have: d.have } : null;
  })).filter((c): c is NonNullable<typeof c> => c !== null);
  return festivalWindows(festivals, cells, routes);
}

export type TextSource = 'sarvam' | 'cache' | 'template';
export type TAlert = Alert & { textSource?: Partial<Record<Lang, 'sarvam' | 'template'>> };

const cache = new Map<string, string>();
export const clearTranslationCache = () => cache.clear();

/** One alert in one language: cache > Sarvam translate (6 s) > the alert's template text > English. */
export async function alertText(deps: Deps, alert: TAlert, lang: Lang): Promise<{ text: string; source: TextSource }> {
  const key = `${alert.id}|${lang}`;
  const hit = cache.get(key);
  if (hit) return { text: hit, source: 'cache' };
  if (alert.textSource?.[lang] === 'sarvam' && alert.textLocal?.[lang]) return { text: alert.textLocal[lang]!, source: 'cache' };
  if (lang !== 'en-IN' && deps.sarvam) {
    const out = await withTimeout(deps.sarvam.translate(alert.text, 'en-IN', lang), 6000);
    if (typeof out === 'string' && out.trim()) {
      cache.set(key, out.trim());
      alert.textLocal = { ...alert.textLocal, [lang]: out.trim() };
      alert.textSource = { ...alert.textSource, [lang]: 'sarvam' };
      return { text: out.trim(), source: 'sarvam' };
    }
  }
  return { text: alert.textLocal?.[lang] ?? alert.text, source: 'template' };
}

/** Languages of travellers waiting on this route + day (saved trips), excluding English. */
export function waitingLanguages(deps: Deps, routeId: string, date: string): Lang[] {
  const langs = deps.store.trips.filter((t) => t.subscribed && t.intent.routeId === routeId && t.intent.dateFrom === date).map((t) => t.intent.language);
  const seeds = deps.seed.intents.filter((i) => i.wantsAlerts && i.routeId === routeId && i.dateFrom === date).map((i) => i.language);
  return [...new Set([...langs, ...seeds])].filter((l) => l !== 'en-IN');
}

/** After an operator adds buses: translate the alert once per waiting traveller's language (bounded to 5 s in total). */
export async function translateForWaiting(deps: Deps, alert: TAlert): Promise<void> {
  if (!deps.sarvam || !alert.routeId || !alert.date) return;
  const langs = waitingLanguages(deps, alert.routeId, alert.date);
  await withTimeout(Promise.all(langs.map((l) => alertText(deps, alert, l))), 5000);
}
