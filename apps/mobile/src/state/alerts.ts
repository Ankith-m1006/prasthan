// Alerts poller (one for the whole app): GET /v1/alerts every alert_poll_seconds. New alerts glow once and are
// spoken aloud in the traveller's language (see src/lib/speak.ts). The tab badge counts unseen ones.
import { useEffect, useState } from 'react';
import type { Alert } from '@contract';
import { api } from '../api';
import { speakText } from '../lib/speak';
import { pollSeconds, raiseNotification } from '../lib/notify';
import { getIdentity } from './identity';

export interface AlertsState { alerts: Alert[]; fresh: Set<string>; unseen: number; banner: Alert | null }

let state: AlertsState = { alerts: [], fresh: new Set(), unseen: 0, banner: null };
let known: Set<string> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let pollMs = 5000;
const listeners = new Set<() => void>();
// Alerts this app created (add-buses response). Kept locally so a poll that lands on a fresh api instance
// (in-memory store, serverless) never drops the alert the operator just sent.
const local = new Map<string, Alert>();
const emit = () => listeners.forEach((l) => l());

/** Pure: live alerts (just added) first, then newest first by createdAt; and which ids are new compared with what we knew. */
export function mergeAlerts(prevKnown: Set<string> | null, incoming: Alert[]): { sorted: Alert[]; fresh: string[] } {
  const live = (a: Alert) => (a.source === 'live' ? 1 : 0);
  const sorted = [...incoming].sort((a, b) => live(b) - live(a) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const fresh = prevKnown ? sorted.filter((a) => !prevKnown.has(a.id)).map((a) => a.id) : [];
  return { sorted, fresh };
}

/** Pure: server alerts plus locally remembered ones the server no longer has (tested). */
export function withLocal(incoming: Alert[], mine: Map<string, Alert>): Alert[] {
  const ids = new Set(incoming.map((a) => a.id));
  return [...incoming, ...[...mine.values()].filter((a) => !ids.has(a.id))];
}

export function rememberAlert(a: Alert | undefined): void {
  if (a?.id) local.set(a.id, a);
}

export async function pollAlerts(): Promise<void> {
  try {
    const res = await api.alerts();
    const { sorted, fresh } = mergeAlerts(known, withLocal(res.alerts, local));
    known = new Set(sorted.map((a) => a.id));
    const newest = fresh.length ? sorted.find((a) => a.id === fresh[0]) ?? null : null;
    state = { alerts: sorted, fresh: new Set([...state.fresh, ...fresh]), unseen: state.unseen + fresh.length, banner: newest ?? state.banner };
    emit();
    const lang = getIdentity().language;
    for (const id of fresh) {
      const a = sorted.find((x) => x.id === id);
      if (a) { raiseNotification(a, lang); void speakText(a.textLocal?.[lang] ?? a.text, lang); }
    }
  } catch {
    // offline: keep what we have
  }
}

export function startAlerts(seconds: number): void {
  pollMs = pollSeconds(seconds) * 1000;
  if (timer) clearInterval(timer);
  timer = setInterval(() => void pollAlerts(), pollMs);
  void pollAlerts();
}

export function dismissBanner(): void {
  state = { ...state, banner: null };
  emit();
}

export function markSeen(): void {
  state = { ...state, unseen: 0, banner: null };
  emit();
}

export function useAlerts(): AlertsState {
  const [s, set] = useState(state);
  useEffect(() => {
    const l = () => set(state);
    listeners.add(l);
    l();
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

export const useAlertsBadge = () => useAlerts().unseen;
