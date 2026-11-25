import { readFileSync } from 'node:fs'

export interface Override { segment: string; enabled?: boolean; value?: unknown }
interface Flag {
  name: string
  type: 'boolean' | 'remote_config' | 'multivariate'
  enabled: boolean
  default?: unknown
  why: string
  variants?: { value: string; weight: number }[]
  segmentOverrides?: Override[]
}
interface Segment { name: string; rules: string }
export const config: { flags: Flag[]; segments: Segment[] } = JSON.parse(
  readFileSync(new URL('../config/flagsmith/flags.json', import.meta.url), 'utf8')
)
const asText = (value: unknown) => typeof value === 'string' ? value : JSON.stringify(value)

export function feature(flag: Flag) {
  return {
    name: flag.name, description: flag.why, default_enabled: flag.enabled,
    type: flag.type === 'multivariate' ? 'MULTIVARIATE' : 'STANDARD',
    initial_value: asText(flag.default),
    multivariate_options: flag.variants?.map(v => ({
      type: 'unicode', string_value: v.value, default_percentage_allocation: v.weight
    }))
  }
}

function condition(rule: string) {
  const split = /^% split (\d+) \(Flagsmith 'percentage split' operator on identity\)$/.exec(rule)
  if (split) return { operator: 'PERCENTAGE_SPLIT', value: split[1] }
  const equal = /^(\w+) = (.+)$/.exec(rule)
  if (!equal) throw new Error('Unknown segment rule')
  return { operator: 'EQUAL', property: equal[1], value: equal[2] }
}

export function segment(item: Segment) {
  return { name: item.name, rules: [{
    type: 'ALL', conditions: item.rules.split(' AND ').map(condition), rules: []
  }] }
}

export function override(flag: Flag, item: Override, segmentId: number) {
  return {
    enabled: item.enabled ?? flag.enabled,
    feature_segment: { segment: segmentId },
    feature_state_value: { type: 'unicode', string_value: asText(item.value ?? flag.default) ?? null }
  }
}
