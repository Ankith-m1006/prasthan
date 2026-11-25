// Loads the SYNTHETIC demo data from seed/*.json once at start.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Alert, BoardingPoint, Festival, GiftOrder, Lang, Mode, Partner, Route, Service, TimeWindow,
} from '../../../shared/contract/src/index.js';

export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

export interface SeedIntent {
  id: string; travellerId: string; displayName?: string; language: Lang; homeState?: string;
  routeId: string; from: string; to: string; dateFrom: string; dateTo: string; timeWindow: TimeWindow;
  mode: Mode | null; people: number; boardingPoint: string | null; festivalId: string | null;
  gift: { itemId: string; qty: number } | null; wantsAlerts: boolean; createdAt: string;
}
export interface ForecastCell { routeId: string; date: string; timeWindow: string; wantSeats: number; seatsExist: number; gap: number; busesToClose: number }
export interface QcCell { zone: string; date: string; window: string; travellersLeaving?: number; travellersArriving?: number; topAsks: string[]; fulfilment: string }
export interface Provider { id: string; name: string; modes: Mode[]; homepage: string; searchTemplate: string | null; useTemplate: boolean }
export interface Utterance { id: string; language: Lang; text: string; roman?: string; english?: string; expect: Record<string, unknown>; demoHero?: boolean }

export interface Seed {
  routes: Route[];
  boardingPoints: BoardingPoint[];
  festivals: Festival[];
  partners: Partner[];
  services: Service[];
  intents: SeedIntent[];
  forecast: ForecastCell[];
  orders: GiftOrder[];
  qc: QcCell[];
  alerts: Alert[];
  providers: Provider[];
  safetyCopy: Partial<Record<Lang, string>>;
  utterances: Utterance[];
}

function readJson<T>(dir: string, file: string): T {
  const path = join(dir, file);
  if (!existsSync(path)) throw new Error(`Seed file missing: ${path} (set SEED_DIR if running from another folder)`);
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function seedDir(override?: string): string {
  return override ?? join(REPO_ROOT, 'seed');
}

export function loadSeed(dirOverride?: string): Seed {
  const dir = seedDir(dirOverride);
  const links = readJson<{ providers: Provider[]; safetyCopy: Partial<Record<Lang, string>> }>(dir, 'deep-links.json');
  return {
    routes: readJson<{ routes: Route[] }>(dir, 'routes.json').routes,
    boardingPoints: readJson<{ boardingPoints: BoardingPoint[] }>(dir, 'boarding-points.json').boardingPoints,
    festivals: readJson<{ festivals: Festival[] }>(dir, 'festivals.json').festivals,
    partners: readJson<{ partners: Partner[] }>(dir, 'partners.json').partners,
    services: readJson<{ services: Service[] }>(dir, 'services.json').services,
    intents: readJson<{ intents: SeedIntent[] }>(dir, 'intents.json').intents,
    forecast: readJson<{ cells: ForecastCell[] }>(dir, 'demand-forecast.json').cells,
    orders: readJson<{ orders: GiftOrder[] }>(dir, 'gift-orders.json').orders,
    qc: readJson<{ cells: QcCell[] }>(dir, 'qc-demand.json').cells,
    alerts: readJson<{ alerts: Alert[] }>(dir, 'alerts.json').alerts,
    providers: links.providers,
    safetyCopy: links.safetyCopy,
    utterances: readJson<{ utterances: Utterance[] }>(dir, 'utterances.json').utterances,
  };
}
