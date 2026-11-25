// Guest profile, saved only on this device (no login, no OTP, never sent to operators).
// Pure parse/validate + a tiny store with subscribe, so screens re-render when it changes.
import { useSyncExternalStore } from 'react';
import type { Lang, Mode } from '@contract';
import { deviceKV, type KV } from '../lib/storage';

export type TravellingWith = 'alone' | 'family' | 'kids' | 'elders';
export type AgeGroup = 'under18' | '18-59' | '60plus';
export type Gender = 'woman' | 'man' | 'unsaid';

export interface Profile {
  id: string; // guest id, also the Flagsmith identity
  name: string;
  language: Lang;
  homeState: string;
  region?: string | null; // optional sub-region of the home state (e.g. North Karnataka); festival filter + Flagsmith trait
  homeRouteId: string; // seed route id, e.g. BLR-HBL (home town = its destination)
  workCity: 'Bengaluru';
  boardingPoint: string; // seed boarding point id, e.g. MAJESTIC
  mode: Mode;
  travellingWith: TravellingWith;
  ageGroup: AgeGroup | null; // optional
  gender: Gender | null; // optional
}

export const PROFILE_KEY = 'prasthan.profile.v1';
const LANGS: Lang[] = ['kn-IN', 'ta-IN', 'te-IN', 'hi-IN', 'od-IN', 'bn-IN', 'en-IN'];
const MODES: Mode[] = ['bus', 'train', 'air'];
const WITH: TravellingWith[] = ['alone', 'family', 'kids', 'elders'];
const AGES: AgeGroup[] = ['under18', '18-59', '60plus'];
const GENDERS: Gender[] = ['woman', 'man', 'unsaid'];

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Saved JSON -> Profile, or null when missing / broken / from an older shape. */
export function parseProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  let o: Record<string, unknown>;
  try { o = JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const id = text(o.id); const homeState = text(o.homeState); const homeRouteId = text(o.homeRouteId); const bp = text(o.boardingPoint);
  if (!id || !homeState || !homeRouteId || !bp) return null;
  if (!oneOf(LANGS, o.language) || !oneOf(MODES, o.mode) || !oneOf(WITH, o.travellingWith)) return null;
  return {
    id, name: text(o.name) ?? '', language: o.language, homeState, ...(text(o.region) ? { region: text(o.region) } : {}), homeRouteId, workCity: 'Bengaluru', boardingPoint: bp,
    mode: o.mode, travellingWith: o.travellingWith,
    ageGroup: oneOf(AGES, o.ageGroup) ? o.ageGroup : null,
    gender: oneOf(GENDERS, o.gender) ? o.gender : null,
  };
}

export function newGuestId(rand: () => number = Math.random): string {
  return `guest-${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`;
}

export interface ProfileStore {
  get(): Profile | null;
  save(p: Profile): void;
  reset(): void;
  subscribe(l: () => void): () => void;
}

export function createProfileStore(kv: KV): ProfileStore {
  let current = parseProfile(kv.get(PROFILE_KEY));
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => current,
    save: (p) => { current = p; kv.set(PROFILE_KEY, JSON.stringify(p)); emit(); },
    reset: () => { current = null; kv.remove(PROFILE_KEY); emit(); },
    subscribe: (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export const profileStore = createProfileStore(deviceKV());

export function useProfile(): Profile | null {
  return useSyncExternalStore(profileStore.subscribe, profileStore.get, profileStore.get);
}
