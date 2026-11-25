// Which side of the app this device is on: traveller (default) or partner (a chosen business). Saved on the device only.
// Demo: no passwords. Judges flip with "Switch view" in About (traveller) or the partner Profile tab.
import { useSyncExternalStore } from 'react';
import type { Partner, PartnerType } from '@contract';
import { deviceKV, type KV } from '../lib/storage';

export type Role = 'traveller' | 'partner';
export interface RoleState { role: Role; partner: Partner | null; registered: Partner[] }
export const ROLE_KEY = 'prasthan.role.v1';
const TYPES: PartnerType[] = ['bus_operator', 'sweet_shop', 'quick_commerce'];
export const EMPTY_ROLE: RoleState = { role: 'traveller', partner: null, registered: [] };

const isPartner = (p: unknown): p is Partner => {
  const x = p as Partner | null;
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && TYPES.includes(x.type);
};

/** Parses what was saved; anything broken -> traveller with nothing chosen. Partner role without a partner -> traveller. */
export function parseRole(raw: string | null): RoleState {
  if (!raw) return EMPTY_ROLE;
  try {
    const v = JSON.parse(raw) as Partial<RoleState>;
    const partner = isPartner(v.partner) ? v.partner : null;
    const registered = Array.isArray(v.registered) ? v.registered.filter(isPartner).slice(0, 20) : [];
    return { role: v.role === 'partner' && partner ? 'partner' : 'traveller', partner, registered };
  } catch {
    return EMPTY_ROLE;
  }
}

/** Seeded + api partners first, then the ones registered on this device that the api does not list (yet). */
export function mergePartners(fromApi: Partner[], registered: Partner[]): Partner[] {
  const ids = new Set(fromApi.map((p) => p.id));
  return [...fromApi, ...registered.filter((p) => !ids.has(p.id))];
}

export function createRoleStore(kv: KV) {
  let state = parseRole(kv.get(ROLE_KEY));
  const listeners = new Set<() => void>();
  const save = (next: RoleState) => {
    state = next;
    kv.set(ROLE_KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  };
  return {
    get: () => state,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    becomePartner: (p: Partner) => save({ ...state, role: 'partner', partner: p }),
    becomeTraveller: () => save({ ...state, role: 'traveller' }),
    addRegistered: (p: Partner) => save({ ...state, registered: [...state.registered.filter((x) => x.id !== p.id), p] }),
  };
}

export const roleStore = createRoleStore(deviceKV());
export const useRole = (): RoleState => useSyncExternalStore(roleStore.subscribe, roleStore.get, roleStore.get);
