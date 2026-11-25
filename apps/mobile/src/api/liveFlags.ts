// Live flags straight from Flagsmith with the JS client SDK, used by the web build (no api server there).
// EXPO_PUBLIC_FLAGSMITH_ENV_KEY is the CLIENT-SIDE environment key: public by design, made for browsers.
// The server-side key ("ser." prefix) never goes here. Identity + traits make the Flagsmith segments apply.
import { createFlagsmithInstance, type IFlagsmith } from 'flagsmith';
import type { FlagsView, Traits } from '@contract';
import { toFlagsView, type RawFlags } from './flagView';

export const LIVE_FLAGS_KEY = process.env.EXPO_PUBLIC_FLAGSMITH_ENV_KEY ?? '';
const TIMEOUT_MS = 6000;

/** The slice of the SDK we use (injectable for tests). */
export type FlagsmithClient = Pick<IFlagsmith, 'init' | 'getFlags' | 'getAllFlags'>;

export interface LiveFlags {
  fetch(identity: string, traits: Traits): Promise<FlagsView>;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('flagsmith timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e: unknown) => { clearTimeout(t); reject(e); });
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function once<T>(fn: () => Promise<T>, retryBaseMs: number): Promise<T> {
  try {
    return await withTimeout(fn(), TIMEOUT_MS);
  } catch {
    await sleep(retryBaseMs + Math.random() * retryBaseMs);
    return withTimeout(fn(), TIMEOUT_MS);
  }
}

function stringTraits(t: Traits): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(t)) if (typeof v === 'string' && v) out[k] = v;
  return out;
}

/** One SDK instance per identity + traits; later calls re-fetch flags on it (picks up dashboard changes). */
export function createLiveFlags(key: string, make: () => FlagsmithClient = createFlagsmithInstance, retryBaseMs = 400): LiveFlags {
  const clients = new Map<string, FlagsmithClient>();
  return {
    async fetch(identity, traits) {
      const t = stringTraits(traits);
      const id = `${identity}|${JSON.stringify(t)}`;
      let client = clients.get(id);
      if (client) {
        const c = client;
        await once(() => c.getFlags(), retryBaseMs);
      } else {
        const c = make();
        await once(() => c.init({ environmentID: key, identity, traits: t, cacheFlags: false, enableAnalytics: false }), retryBaseMs);
        clients.set(id, c);
        client = c;
      }
      const raw = client.getAllFlags() as RawFlags;
      if (Object.keys(raw).length === 0) throw new Error('flagsmith returned no flags');
      return toFlagsView(raw);
    },
  };
}

export const liveFlags: LiveFlags | null = LIVE_FLAGS_KEY ? createLiveFlags(LIVE_FLAGS_KEY) : null;
