// Tiny identity store: who the app is speaking as (traveller or partner) + traits for Flagsmith segments.
import type { Lang, PartnerType, Traits } from '@contract';

export const LANG_STATE: Record<Lang, string> = {
  'kn-IN': 'Karnataka', 'ta-IN': 'Tamil Nadu', 'te-IN': 'Andhra Pradesh', 'hi-IN': 'Bihar', 'od-IN': 'Odisha', 'bn-IN': 'West Bengal', 'en-IN': 'Karnataka',
};

export interface IdentityState { traveller: string; language: Lang; partner: { id: string; type: PartnerType } | null; mode: 'traveller' | 'partner' }

let state: IdentityState = { traveller: 'trav-demo', language: 'kn-IN', partner: null, mode: 'traveller' };
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

export function travellerTraits(lang: Lang): Traits {
  return { role: 'traveller', language: lang, home_state: LANG_STATE[lang] };
}

export function partnerTraits(id: string, type: PartnerType): Traits {
  return { role: 'partner', partner_type: type, partner_id: id };
}
