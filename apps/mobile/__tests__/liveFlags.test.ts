import { toFlagsView } from '../src/api/flagView';
import { createLiveFlags, type FlagsmithClient } from '../src/api/liveFlags';
import { DEFAULT_FLAGS } from '../src/api/mockFlags';

const pongal = { festivalId: 'pongal-2027', title: 'Pongal mode', theme: 'pongal', greeting: { 'en-IN': 'Happy Pongal' } };

describe('toFlagsView', () => {
  it('parses Flagsmith JSON strings and reads booleans from enabled', () => {
    const v = toFlagsView({
      festival_mode: { enabled: true, value: JSON.stringify(pongal) },
      voice_fallback_offline: { enabled: true, value: null },
      gifting_enabled: { enabled: false, value: null },
      alert_poll_seconds: { enabled: true, value: 7 },
      reply_style: { enabled: true, value: 'short' },
    });
    expect(v.festival_mode.theme).toBe('pongal');
    expect(v.voice_fallback_offline).toBe(true);
    expect(v.gifting_enabled).toBe(false);
    expect(v.alert_poll_seconds).toBe(7);
    expect(v.reply_style).toBe('short');
    expect(v.route_config).toEqual(DEFAULT_FLAGS.route_config);
  });

  it('falls back to defaults on bad values', () => {
    const v = toFlagsView({
      festival_mode: { enabled: true, value: '{not json' },
      live_data_source: { enabled: true, value: 'scraped' },
      alert_poll_seconds: { enabled: true, value: 'abc' },
      special_service_announcements: { enabled: false, value: '[{"x":1}]' },
    });
    expect(v.festival_mode).toEqual(DEFAULT_FLAGS.festival_mode);
    expect(v.live_data_source).toBe('seeded');
    expect(v.alert_poll_seconds).toBe(DEFAULT_FLAGS.alert_poll_seconds);
    expect(v.special_service_announcements).toEqual([]);
  });
});

describe('createLiveFlags', () => {
  function fake(fail = 0) {
    const calls = { init: 0, get: 0, traits: [] as unknown[] };
    let left = fail;
    const client: FlagsmithClient = {
      init: async (cfg) => { calls.init += 1; calls.traits.push(cfg.traits); if (left-- > 0) throw new Error('down'); },
      getFlags: async () => { calls.get += 1; },
      getAllFlags: () => ({ voice_fallback_offline: { enabled: true, value: null } }),
    };
    return { client, calls };
  }

  it('identifies once with string traits, then re-fetches on the same client', async () => {
    const { client, calls } = fake();
    const live = createLiveFlags('key', () => client, 1);
    const t = { role: 'traveller', home_state: 'Tamil Nadu', language: 'ta-IN' } as const;
    expect((await live.fetch('trav-1', t)).voice_fallback_offline).toBe(true);
    await live.fetch('trav-1', t);
    expect(calls).toMatchObject({ init: 1, get: 1 });
    expect(calls.traits[0]).toEqual(t);
  });

  it('retries once, then gives up so the app can use defaults', async () => {
    const ok = fake(1);
    await expect(createLiveFlags('key', () => ok.client, 1).fetch('a', { role: 'traveller' })).resolves.toBeTruthy();
    expect(ok.calls.init).toBe(2);
    const bad = fake(5);
    await expect(createLiveFlags('key', () => bad.client, 1).fetch('a', { role: 'traveller' })).rejects.toThrow('down');
  });
});
