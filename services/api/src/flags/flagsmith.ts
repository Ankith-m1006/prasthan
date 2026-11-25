// Real Flagsmith provider (server SDK @flagsmith/nodejs v9, local evaluation, refresh every 5 s).
// Checked against the installed SDK source (node_modules/@flagsmith/nodejs/sdk/index.ts + models.ts, v9.5.0) and
// https://docs.flagsmith.com/clients/server-side : new Flagsmith({environmentKey, enableLocalEvaluation,
// environmentRefreshIntervalSeconds, defaultFlagHandler: name => new DefaultFlag(value, enabled)});
// getIdentityFlags(identifier, traits) / getEnvironmentFlags() -> Flags with getFlag(name) {enabled, value}.
// Note: with local evaluation, identity overrides may not be in the environment document; we use segment overrides only.
import { DefaultFlag, Flagsmith } from '@flagsmith/nodejs';
import type { FlagsView, Traits } from '../../../../shared/contract/src/index.js';
import { defaultRaw, toView, type FlagDef, type FlagsProvider, type RawFlag, type RawFlags } from './defaults.js';

export interface FlagSource {
  getIdentityFlags(identity: string, traits: Record<string, string>): Promise<{ getFlag(name: string): { enabled: boolean; value: unknown } }>;
  getEnvironmentFlags(): Promise<{ getFlag(name: string): { enabled: boolean; value: unknown } }>;
}

/** Parses one Flagsmith value into the type our coded default has. Returns undefined when it can't. */
export function coerce(value: unknown, def: unknown): unknown {
  if (value === null || value === undefined || value === '') return undefined;
  const wantsJson = typeof def === 'object' && def !== null;
  if (wantsJson) return typeof value === 'string' ? JSON.parse(value) : value;
  if (typeof def === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) throw new Error('not a number');
    return n;
  }
  return value;
}

export function makeFlagsmith(serverKey: string, defs: FlagDef[]): FlagSource {
  const defaults = defaultRaw(defs);
  return new Flagsmith({
    environmentKey: serverKey,
    enableLocalEvaluation: true,
    environmentRefreshIntervalSeconds: 5,
    requestTimeoutSeconds: 6,
    defaultFlagHandler: (name: string) => new DefaultFlag((defaults[name]?.value ?? null) as never, defaults[name]?.enabled ?? false),
  }) as unknown as FlagSource;
}

export class FlagsmithFlagsProvider implements FlagsProvider {
  readonly mode = 'live' as const;
  private readonly defaults: RawFlags;

  constructor(private readonly source: FlagSource, private readonly defs: FlagDef[], private readonly onParseError: (name: string) => void,
    /** Ops overrides that win over Flagsmith (used only if the Admin API flip failed). */
    private readonly overrides: Map<string, RawFlag> = new Map()) {
    this.defaults = defaultRaw(defs);
  }

  private toRaw(flags: { getFlag(name: string): { enabled: boolean; value: unknown } }): RawFlags {
    const raw: RawFlags = {};
    for (const d of this.defs) {
      const def = this.defaults[d.name];
      try {
        const f = flags.getFlag(d.name);
        const v = coerce(f.value, def.value);
        raw[d.name] = { enabled: f.enabled, value: v === undefined ? def.value : v };
      } catch {
        this.onParseError(d.name);
        raw[d.name] = def;
      }
    }
    for (const [name, state] of this.overrides) raw[name] = state;
    return raw;
  }

  async getFlags(identity: string, traits: Traits): Promise<FlagsView> {
    const t: Record<string, string> = {};
    for (const [k, v] of Object.entries(traits)) if (typeof v === 'string') t[k] = v;
    try {
      return toView(this.toRaw(await this.source.getIdentityFlags(identity, t)), this.defaults);
    } catch {
      this.onParseError('identity_evaluation');
      return toView(this.defaults, this.defaults);
    }
  }

  async getEnvFlags(): Promise<FlagsView> {
    try {
      return toView(this.toRaw(await this.source.getEnvironmentFlags()), this.defaults);
    } catch {
      return toView(this.defaults, this.defaults);
    }
  }
}
