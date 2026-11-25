import { describe, expect, it } from 'vitest';
import { toSpoken } from '../src/voice/spoken.js';
import { voicesFor, V3, V4, TTS_SETTINGS } from '../src/sarvam/voices.js';
import { cleanMime } from '../src/routes/voice.js';
import { LiveSarvamClient } from '../src/sarvam/live.js';

describe('spoken text', () => {
  it('drops route ids, arrows and Rs', () => {
    expect(toSpoken('BLR-HBL: Majestic -> Hubballi, Rs 1,840', 'kn-IN')).toBe('Majestic, Hubballi, 1840 ರೂಪಾಯಿ');
    expect(toSpoken('Pickup 19:30-21:30', 'en-IN')).toBe('Pickup 19:30 to 21:30');
  });
});

describe('voices', () => {
  it('uses a v4-flash persona per language with a v3 fallback, Odia on v3', () => {
    expect(voicesFor('kn-IN', V3, 'priya')).toEqual([{ model: V4, speaker: 'chaitra_kn_conversation' }, { model: V3, speaker: 'priya' }]);
    expect(voicesFor('od-IN', V4, 'shubh_enhi_ads')).toEqual([{ model: V3, speaker: 'priya' }]);
    expect(TTS_SETTINGS.speech_sample_rate).toBe(24000);
  });
  it('sends natural settings and falls back to v3 on a 400', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const fetchImpl = (async (_u: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body)) as Record<string, unknown>;
      bodies.push(b);
      if (b.model === V4) return new Response('{}', { status: 400 });
      return new Response(JSON.stringify({ audios: ['UklGRg=='] }), { status: 200 });
    }) as never;
    const c = new LiveSarvamClient({ apiKey: 'k', fetchImpl });
    expect(await c.tts('ಸರಿ -> BLR-HBL', 'kn-IN', V3, 'priya')).toBe('UklGRg==');
    expect(bodies[0]).toMatchObject({ model: V4, language_code: 'kn-IN', pace: 1, speech_sample_rate: 24000, enable_preprocessing: true, text: 'ಸರಿ,' });
    expect(bodies[1]).toMatchObject({ model: V3, speaker: 'priya' });
  });
});

describe('upload mime', () => {
  it('strips codec parameters', () => {
    expect(cleanMime('audio/webm;codecs=opus')).toBe('audio/webm');
    expect(cleanMime('Audio/MP4; codecs=mp4a.40.2')).toBe('audio/mp4');
  });
});
