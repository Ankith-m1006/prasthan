// Mock Flagsmith: coded defaults + the same segment rules as config/flagsmith/flags.json + ops overrides.
import { createHash } from 'node:crypto';
import type { FlagsView, Traits } from '../../../../shared/contract/src/index.js';
import { defaultRaw, toView, type FlagDef, type FlagsProvider, type RawFlag, type RawFlags } from './defaults.js';

/** Flagsmith-like percentage split: stable 0..99 bucket per identity. */
export function bucket(identity: string, segment: string): number {
  const h = createHash('md5').update(`${segment},${identity}`).digest();
  return h.readUInt32BE(0) % 100;
}

export const SEGMENTS: Record<string, (t: Traits, identity: string) => boolean> = {
  karnataka_travellers: (t) => t.role === 'traveller' && t.home_state === 'Karnataka',
  tamil_travellers: (t) => t.role === 'traveller' && t.home_state === 'Tamil Nadu',
  odia_speakers: (t) => t.language === 'od-IN',
  bus_operators: (t) => t.partner_type === 'bus_operator',
  sweet_shops: (t) => t.partner_type === 'sweet_shop',
  quick_commerce: (t) => t.partner_type === 'quick_commerce',
  gifting_pilot_20pct: (t, id) => t.role === 'traveller' && bucket(id, 'gifting_pilot_20pct') < 20,
};

export function segmentsFor(traits: Traits, identity: string): string[] {
  return Object.entries(SEGMENTS).filter(([, rule]) => rule(traits, identity)).map(([name]) => name);
}

export class MockFlagsProvider implements FlagsProvider {
  readonly mode = 'mock' as const;
  private readonly defaults: RawFlags;
  /** Ops overrides (e.g. voice_fallback_offline); apply to every identity. */
  readonly overrides = new Map<string, RawFlag>();

  constructor(private readonly defs: FlagDef[]) {
    this.defaults = defaultRaw(defs);
  }

  setOverride(name: string, state: Partial<RawFlag>): void {
    const base = this.overrides.get(name) ?? this.defaults[name] ?? { enabled: false, value: null };
    this.overrides.set(name, { ...base, ...state });
  }

  clearOverrides(): void {
    this.overrides.clear();
  }

  async getFlags(identity: string, traits: Traits): Promise<FlagsView> {
    const raw: RawFlags = { ...this.defaults };
    const segs = new Set(segmentsFor(traits, identity));
    for (const def of this.defs) {
      for (const o of def.segmentOverrides ?? []) {
        if (!segs.has(o.segment)) continue;
        raw[def.name] = { enabled: o.enabled ?? raw[def.name].enabled, value: o.value ?? raw[def.name].value };
        break;
      }
    }
    for (const [name, state] of this.overrides) raw[name] = state;
    return toView(raw, this.defaults);
  }

  async getEnvFlags(): Promise<FlagsView> {
    return this.getFlags('__env__', {});
  }
}
