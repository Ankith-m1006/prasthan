// Picks the api client. EXPO_PUBLIC_APP_MOCK=1 (or no EXPO_PUBLIC_API_URL) = bundled seed data only.
// Otherwise HTTP, switching to the mock for good after 2 failed calls (the UI then shows "Offline demo data").
import { createHttpClient, ApiError } from './http';
import { createMockClient } from './mock';
import type { Api } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const FORCE_MOCK = process.env.EXPO_PUBLIC_APP_MOCK === '1' || !API_URL;

const mock = createMockClient();
let failures = 0;
let usingMock = FORCE_MOCK;
const listeners = new Set<() => void>();

export const isOfflineData = () => usingMock;
export const isForcedMock = () => FORCE_MOCK;
export function onModeChange(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function withFallback(http: Api): Api {
  const wrapped = {} as Record<string, unknown>;
  for (const key of Object.keys(mock) as Array<keyof Api>) {
    if (key === 'kind') continue;
    wrapped[key] = async (...args: unknown[]) => {
      if (usingMock) return (mock[key] as (...a: unknown[]) => Promise<unknown>)(...args);
      try {
        const out = await (http[key] as (...a: unknown[]) => Promise<unknown>)(...args);
        failures = 0;
        return out;
      } catch (err) {
        if (err instanceof ApiError && err.status < 500) throw err; // a real answer (e.g. 403), not an outage
        if (key === 'tts') throw err; // a slow voice is not an outage: the caller falls back to the browser voice
        failures += 1;
        if (failures >= 2) { usingMock = true; listeners.forEach((l) => l()); }
        return (mock[key] as (...a: unknown[]) => Promise<unknown>)(...args);
      }
    };
  }
  return { ...(wrapped as unknown as Api), kind: 'http' };
}

export const api: Api = FORCE_MOCK ? mock : withFallback(createHttpClient(API_URL.replace(/\/$/, '')));
export type { Api } from './types';
