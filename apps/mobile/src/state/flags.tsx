// useFlags(): the FlagsView the app runs on, and where it came from.
// With EXPO_PUBLIC_FLAGSMITH_ENV_KEY set: real Flagsmith flags for the current identity + traits, polled every 10 s
// and on focus, so a dashboard flip shows within seconds. Flagsmith unreachable => GET /v1/config or bundled defaults.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import type { FlagsView } from '@contract';
import { api, isOfflineData, onModeChange } from '../api';
import { liveFlags } from '../api/liveFlags';
import { mockState, traitsOf } from '../api/mock';
import { DEFAULT_FLAGS } from '../api/mockFlags';
import { accentFor } from '../theme/tokens';
import { currentIdentity, getIdentity, subscribeIdentity, travellerTraits } from './identity';

/** live = read from Flagsmith in the app; api = Flagsmith via our api server; offline = coded defaults / demo switches. */
export type FlagSourceKind = 'live' | 'offline' | 'api';

interface FlagsCtx { flags: FlagsView; accent: ReturnType<typeof accentFor>; offlineData: boolean; source: FlagSourceKind; refresh: () => Promise<void> }

const Ctx = createContext<FlagsCtx>({ flags: DEFAULT_FLAGS, accent: accentFor('sankranti'), offlineData: false, source: 'offline', refresh: async () => undefined });

const LIVE_POLL_MS = 10_000;

function onFocus(cb: () => void): () => void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const h = () => { if (document.visibilityState === 'visible') cb(); };
    document.addEventListener('visibilitychange', h);
    window.addEventListener('focus', cb);
    return () => { document.removeEventListener('visibilitychange', h); window.removeEventListener('focus', cb); };
  }
  const sub = AppState.addEventListener('change', (s) => { if (s === 'active') cb(); });
  return () => sub.remove();
}

async function readLive(): Promise<FlagsView | null> {
  if (!liveFlags) return null;
  const id = currentIdentity();
  const me = getIdentity();
  const traits = me.mode === 'traveller' ? travellerTraits(me.language) : traitsOf(id);
  try {
    return await liveFlags.fetch(id, traits);
  } catch {
    return null;
  }
}

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FlagsView>(DEFAULT_FLAGS);
  const [offlineData, setOffline] = useState(isOfflineData());
  const [source, setSource] = useState<FlagSourceKind>('offline');

  const refresh = useCallback(async () => {
    const live = await readLive();
    mockState.live = live; // the offline data layer (voice fallback, deep links) follows the live flags too
    if (live) {
      setFlags(live);
      setSource('live');
    } else {
      try {
        const res = await api.config();
        setFlags(res.flags);
        setSource(res.source === 'live' ? 'api' : 'offline');
      } catch {
        // keep the last flags; the client falls back to bundled data by itself
      }
    }
    setOffline(isOfflineData());
  }, []);

  useEffect(() => {
    void refresh();
    const unsubs = [subscribeIdentity(() => void refresh()), onModeChange(() => setOffline(true)), onFocus(() => void refresh())];
    return () => unsubs.forEach((u) => u());
  }, [refresh]);

  useEffect(() => {
    const ms = liveFlags ? LIVE_POLL_MS : Math.max(2, flags.alert_poll_seconds) * 1000;
    const t = setInterval(() => void refresh(), ms);
    return () => clearInterval(t);
  }, [flags.alert_poll_seconds, refresh]);

  return <Ctx.Provider value={{ flags, accent: accentFor(flags.festival_mode.theme), offlineData, source, refresh }}>{children}</Ctx.Provider>;
}

export const useFlags = () => useContext(Ctx);
