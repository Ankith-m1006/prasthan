// Tiny identity store: who the app is speaking as (traveller or partner) + traits for Flagsmith segments.
import type { Lang, PartnerType, Traits } from '@contract';
import { profileTraits } from '../lib/profileUse';
import { profileStore } from './profile';

export const LANG_STATE: Record<Lang, string> = {
  'kn-IN': 'Karnataka', 'ta-IN': 'Tamil Nadu', 'te-IN': 'Andhra Pradesh', 'hi-IN': 'Bihar', 'od-IN': 'Odisha', 'bn-IN': 'West Bengal', 'en-IN': 'Karnataka',
};

export interface IdentityState { traveller: string; language: Lang; partner: { id: string; type: PartnerType } | null; mode: 'traveller' | 'partner' }

// A saved guest profile decides who we are; without one we speak as the demo traveller.
const saved = profileStore.get();
let state: IdentityState = { traveller: saved?.id ?? 'trav-demo', language: saved?.language ?? 'kn-IN', partner: null, mode: 'traveller' };
const listeners = new Set<() => void>();

export function getIdentity(): IdentityState {
  return state;
}

export function setIdentity(patch: Partial<IdentityState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeIdentity(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** The identity header value for the current mode. */
export function currentIdentity(s: IdentityState = state): string {
  return s.mode === 'partner' && s.partner ? s.partner.id : s.traveller;
}

/** Traveller traits: from the guest profile when there is one (the language chip still wins), else from the language. */
export function travellerTraits(lang: Lang): Traits {
  const p = profileStore.get();
  if (p) return { ...profileTraits(p), language: lang };
  return { role: 'traveller', language: lang, home_state: LANG_STATE[lang] };
}

/** Called after the profile is saved or reset, so api calls and Flagsmith use the new identity. */
export function syncIdentityWithProfile(): void {
  const p = profileStore.get();
  setIdentity(p ? { traveller: p.id, language: p.language, mode: 'traveller' } : { traveller: 'trav-demo', mode: 'traveller' });
}

export function partnerTraits(id: string, type: PartnerType): Traits {
  return { role: 'partner', partner_type: type, partner_id: id };
}
