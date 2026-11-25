// Flagsmith Admin API: flips an environment feature state (the ops / NudgeBee fallback switch).
// Header `Authorization: Api-Key <FLAGSMITH_ADMIN_API_KEY>` (key only from env, never logged).
// Paths from the Swagger at https://api.flagsmith.com/api/v1/docs/ as described in docs/SPONSORS.md. NOT tested live from the
// home laptop (no key): GET /projects/{id}/features/?search=name, GET /environments/{env_key}/featurestates/?feature={id},
// PATCH /environments/{env_key}/featurestates/{fs_id}/ {enabled, feature_state_value?}.
import type { OpsSwitch } from '../deps.js';
import { fetchRetry } from '../http.js';

export interface AdminConfig { adminKey: string; projectId: string; environmentKey: string; baseUrl?: string; fetchImpl?: typeof fetchRetry }

interface Page<T> { results: T[] }
interface FeatureRow { id: number; name: string }
interface StateRow { id: number; enabled: boolean; feature_segment: number | null; identity: number | null }

export class FlagsmithAdmin {
  private readonly base: string;
  private readonly doFetch: typeof fetchRetry;
  constructor(private readonly cfg: AdminConfig) {
    this.base = cfg.baseUrl ?? 'https://api.flagsmith.com/api/v1';
    this.doFetch = cfg.fetchImpl ?? fetchRetry;
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Authorization: `Api-Key ${this.cfg.adminKey}`, 'content-type': 'application/json' };
    const res = await this.doFetch(`${this.base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }, { timeoutMs: 6000 });
    if (!res.ok) throw new Error(`flagsmith admin ${method} ${path.split('?')[0]} returned ${res.status}`);
    return (await res.json()) as T;
  }

  async setFeatureState(featureName: string, enabled: boolean, value?: string | number | boolean): Promise<void> {
    const features = await this.req<Page<FeatureRow>>('GET', `/projects/${this.cfg.projectId}/features/?search=${encodeURIComponent(featureName)}`);
    const feature = features.results.find((f) => f.name === featureName);
    if (!feature) throw new Error(`feature ${featureName} not found`);
    const env = encodeURIComponent(this.cfg.environmentKey);
    const states = await this.req<Page<StateRow>>('GET', `/environments/${env}/featurestates/?feature=${feature.id}`);
    const state = states.results.find((s) => s.feature_segment === null && s.identity === null) ?? states.results[0];
    if (!state) throw new Error(`no environment state for ${featureName}`);
    const patch: Record<string, unknown> = { enabled };
    if (value !== undefined) patch.feature_state_value = value;
    await this.req('PATCH', `/environments/${env}/featurestates/${state.id}/`, patch);
  }
}

/** Ops switch: Admin API first; if it fails, the in-memory switch still protects travellers (and we say "memory"). */
export function flagsmithOps(admin: FlagsmithAdmin, memory: OpsSwitch, clearMemory: () => void, log: (msg: string) => void): OpsSwitch {
  return {
    async setFallback(on) {
      try {
        await admin.setFeatureState('voice_fallback_offline', on);
        clearMemory();
        return 'flagsmith';
      } catch (err) {
        log(`flagsmith admin flip failed, using memory: ${err instanceof Error ? err.message : 'error'}`);
        return memory.setFallback(on);
      }
    },
  };
}
