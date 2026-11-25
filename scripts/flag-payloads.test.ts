import { describe, expect, it } from 'vitest'
import { config, feature, segment, override } from './flag-payloads.js'

describe('catalog mappings', () => {
  it('serializes remote config without changing native-script text', () => {
    const flag = config.flags.find(f => f.name === 'festival_mode')!
    expect(JSON.parse(feature(flag).initial_value!)).toEqual(flag.default)
  })
  it('preserves boolean defaults and weights', () => {
    expect(feature(config.flags.find(f => f.name === 'gifting_enabled')!).default_enabled).toBe(false)
    expect(feature(config.flags.find(f => f.name === 'reply_style')!).multivariate_options)
      .toEqual(['warm', 'short'].map(string_value => ({ type: 'unicode', string_value, default_percentage_allocation: 50 })))
  })
  it('requires both traveller role and percentage split for the pilot', () => {
    const s = config.segments.find(s => s.name === 'gifting_pilot_20pct')!
    expect(segment(s).rules[0]).toEqual({ type: 'ALL', rules: [], conditions: [
      { operator: 'EQUAL', property: 'role', value: 'traveller' },
      { operator: 'PERCENTAGE_SPLIT', property: null, value: '20' }
    ] })
  })
  it('enables only the targeted segment for boolean overrides', () => {
    const flag = config.flags.find(f => f.name === 'gifting_enabled')!
    expect(override(flag, flag.segmentOverrides![0], 42)).toEqual({
      enabled: true, feature_segment: { segment: 42 }, feature_state_value: { type: 'unicode', string_value: null }
    })
  })
  it('maps all configured segments and resolves all override targets', () => {
    const names = config.segments.map(s => segment(s).name)
    for (const flag of config.flags) for (const item of flag.segmentOverrides ?? [])
      expect(names).toContain(item.segment)
  })
})
