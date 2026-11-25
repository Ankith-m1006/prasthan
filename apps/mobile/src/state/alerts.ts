// Alerts poller (one for the whole app): GET /v1/alerts every alert_poll_seconds. New alerts glow once and are
// spoken aloud in the traveller's language (see src/lib/speak.ts). The tab badge counts unseen ones.
import { useEffect, useState } from 'react';
import type { Alert } from '@contract';
import { api } from '../api';
import { speakText } from '../lib/speak';
import { getIdentity } from './identity';

export interface AlertsState { alerts: Alert[]; fresh: Set<string>; unseen: number }

let state: AlertsState = { alerts: [], fresh: new Set(), unseen: 0 };
let known: Set<string> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let pollMs = 5000;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Pure: live alerts (just added) first, then newest first by createdAt; and which ids are new compared with what we knew. */
export function mergeAlerts(prevKnown: Set<string> | null, incoming: Alert[]): { sorted: Alert[]; fresh: string[] } {
  const live = (a: Alert) => (a.source === 'live' ? 1 : 0);
  const sorted = [...incoming].sort((a, b) => live(b) - live(a) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const fresh = prevKnown ? sorted.filter((a) => !prevKnown.has(a.id)).map((a) => a.id) : [];
  return { sorted, fresh };
}

export async function pollAlerts(): Promise<void> {
  try {
    const res = await api.alerts();
    const { sorted, fresh } = mergeAlerts(known, res.alerts);
    known = new Set(sorted.map((a) => a.id));
    state = { alerts: sorted, fresh: new Set([...state.fresh, ...fresh]), unseen: state.unseen + fresh.length };
    emit();
    const lang = getIdentity().language;
    for (const id of fresh) {
      const a = sorted.find((x) => x.id === id);
      if (a) void speakText(a.textLocal?.[lang] ?? a.text, lang);
    }
  } catch {
    // offline: keep what we have
  }
}

export function startAlerts(seconds: number): void {
  pollMs = Math.max(2, seconds) * 1000;
  if (timer) clearInterval(timer);
  timer = setInterval(() => void pollAlerts(), pollMs);
  void pollAlerts();
}

export function markSeen(): void {
  state = { ...state, unseen: 0 };
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
