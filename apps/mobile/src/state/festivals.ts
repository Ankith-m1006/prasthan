// Festivals for this traveller: GET /v1/festivals (Flagsmith calendar > seed file > built-in on the api), bundled list offline.
// useNextFestival() is the small hook other screens (Speak header countdown) can use.
import { useEffect, useSyncExternalStore } from 'react';
import { isOfflineData } from '../api';
import { BUNDLED, countdownText, daysBetween, filterFestivals, nextFestival, todayIST, type Scored } from '../lib/festivals';
import { useProfile } from './profile';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const MOCK = process.env.EXPO_PUBLIC_APP_MOCK === '1' || !API_URL;

export interface FestivalState { list: Scored[]; source: 'flagsmith' | 'file' | 'fallback' | 'bundled'; key: string }
let state: FestivalState = { list: [], source: 'bundled', key: '' };
const listeners = new Set<() => void>();
const set = (s: FestivalState) => { state = s; listeners.forEach((l) => l()); };

async function fetchJson<T>(path: string, ms = 12_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally { clearTimeout(timer); }
}
export const festivalApi = { enabled: () => !MOCK && !isOfflineData(), get: fetchJson };

export async function loadFestivals(homeState: string | null, region: string | null, today = todayIST()): Promise<void> {
  const key = `${homeState}|${region}|${today}`;
  const local = filterFestivals(BUNDLED, { state: homeState, region, from: today });
  if (state.key !== key) set({ list: local, source: 'bundled', key });
  if (!festivalApi.enabled()) return;
  const q = new URLSearchParams({ from: today, ...(homeState ? { state: homeState } : {}), ...(region ? { region } : {}) });
  try {
    const r = await fetchJson<{ festivals: Scored[]; source: FestivalState['source'] }>(`/v1/festivals?${q.toString()}`);
    if (Array.isArray(r.festivals) && r.festivals.length) set({ list: r.festivals, source: r.source, key });
  } catch { /* keep the bundled list */ }
}

const get = () => state;
export function useFestivals(): FestivalState {
  const profile = useProfile();
  useEffect(() => { void loadFestivals(profile?.homeState ?? null, profile?.region ?? null); }, [profile?.homeState, profile?.region]);
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, get, get);
}

/** The traveller's next festival + days left + a ready line ("12 days to Makara Sankranti"). null when none ahead. */
export function useNextFestival(): { festival: Scored; daysLeft: number; text: string } | null {
  const { list } = useFestivals();
  const profile = useProfile();
  const today = todayIST();
  const f = nextFestival(list, today, profile?.homeState ?? null, profile?.region ?? null) ?? list.find((x) => x.date >= today) ?? null;
  return f ? { festival: f, daysLeft: daysBetween(today, f.date), text: countdownText(f, today) } : null;
}
