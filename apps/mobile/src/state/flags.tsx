// useFlags(): FlagsView from GET /v1/config, polled every flags.alert_poll_seconds (Flagsmith changes show in ~5 s).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { FlagsView } from '@contract';
import { api, isOfflineData, onModeChange } from '../api';
import { DEFAULT_FLAGS } from '../api/mockFlags';
import { accentFor } from '../theme/tokens';
import { subscribeIdentity } from './identity';

interface FlagsCtx { flags: FlagsView; accent: ReturnType<typeof accentFor>; offlineData: boolean; refresh: () => Promise<void> }

const Ctx = createContext<FlagsCtx>({ flags: DEFAULT_FLAGS, accent: accentFor('sankranti'), offlineData: false, refresh: async () => undefined });

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FlagsView>(DEFAULT_FLAGS);
  const [offlineData, setOffline] = useState(isOfflineData());

  const refresh = useCallback(async () => {
    try {
      const res = await api.config();
      setFlags(res.flags);
    } catch {
      // keep the last flags; the client falls back to bundled data by itself
    }
    setOffline(isOfflineData());
  }, []);

  useEffect(() => {
    void refresh();
    const unsubs = [subscribeIdentity(() => void refresh()), onModeChange(() => setOffline(true))];
    return () => unsubs.forEach((u) => u());
  }, [refresh]);

  useEffect(() => {
    const ms = Math.max(2, flags.alert_poll_seconds) * 1000;
    const t = setInterval(() => void refresh(), ms);
    return () => clearInterval(t);
  }, [flags.alert_poll_seconds, refresh]);

  return <Ctx.Provider value={{ flags, accent: accentFor(flags.festival_mode.theme), offlineData, refresh }}>{children}</Ctx.Provider>;
}

export const useFlags = () => useContext(Ctx);
