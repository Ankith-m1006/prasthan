import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp, mockDeps } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { parseWithLlm } from '../src/intent/llm.js';
import { applyFault, faultState } from '../src/routes/internal-voice.js';
import type { SarvamClient } from '../src/sarvam/client.js';
import { LiveSarvamClient } from '../src/sarvam/live.js';
import { sarvamClients, wireVoice } from '../src/wire.js';
import { makeAjv, assertValid } from './helpers/ajv.js';

const ajv = makeAjv();
const PARSE = { text: 'Going home to Hubli for Sankranti, Friday night', language: 'en-IN', refDate: '2027-01-05' };

function spyClient(base: SarvamClient, fail = false): SarvamClient & { calls: number } {
  const c = {
    mode: 'live' as const, calls: 0,
    async stt() { c.calls += 1; if (fail) throw new Error('down'); return { transcript: 'ಸಂಕ್ರಾಂತಿಗೆ ಹುಬ್ಬಳ್ಳಿಗೆ ಗುರುವಾರ ರಾತ್ರಿ ಬಸ್ಸಲ್ಲಿ ಇಬ್ರು', language: 'kn-IN' as const }; },
    async chat(m: Parameters<SarvamClient['chat']>[0]) { c.calls += 1; if (fail) throw new Error('down'); return base.chat(m); },
    async tts() { c.calls += 1; if (fail) throw new Error('down'); return 'UklGRg=='; },
    async translate(t: string) { c.calls += 1; return t; },
  };
  return c;
}

async function appWith(live?: (mock: SarvamClient) => SarvamClient) {
  const base = mockDeps(loadConfig({ MOCK_ALL: '1', OPS_TOKEN: 't' }));
  const { mock } = sarvamClients(base.config, base.seed);
  const client = live ? live(mock) : mock;
  const { deps, extras } = wireVoice(base, client, mock);
  return { app: await buildApp(deps, extras), client };
}

function multipart(lang = 'kn-IN', body = Buffer.from('fake-audio')) {
  const b = '----prasthan';
  const payload = Buffer.concat([
    Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="audio"; filename="u-kn-01.webm"\r\nContent-Type: audio/webm\r\n\r\n`), body,
    Buffer.from(`\r\n--${b}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${lang}\r\n--${b}--\r\n`),
  ]);
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${b}` } };
}

describe('voice routes (mock)', () => {
  let app: FastifyInstance;
  beforeEach(async () => { app = (await appWith()).app; });

  it('typed parse -> BLR-HBL 15 Jan via rules', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/intent/parse', payload: PARSE });
    assertValid(ajv, 'voice-intent-response.json', res.json());
    expect(res.json().intent).toMatchObject({ routeId: 'BLR-HBL', dateFrom: '2027-01-15', parser: 'rules' });
    expect(res.json().reply.text).toContain('Hubballi');
  });
  it('audio in mock mode returns the hero utterance, Kannada reply', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/voice/intent', ...multipart() });
    expect(res.statusCode).toBe(200);
    assertValid(ajv, 'voice-intent-response.json', res.json());
    expect(res.json().intent).toMatchObject({ routeId: 'BLR-HBL', dateFrom: '2027-01-14', people: 2 });
    expect(res.json().reply.text).toBe('ಸರಿ, ಗುರುವಾರ ರಾತ್ರಿ ಹುಬ್ಬಳ್ಳಿಗೆ ಇಬ್ಬರಿಗೆ ಬಸ್. ಇಲ್ಲಿವೆ ಆಯ್ಕೆಗಳು.');
  });
  it('vague sentence asks in Kannada', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/intent/parse', payload: { text: 'ಊರಿಗೆ ಹೋಗ್ಬೇಕು', language: 'kn-IN' } });
    expect(res.json().intent.needsFollowUp).toEqual(['to', 'date']);
    expect(res.json().reply.text).toContain('ಯಾವ');
  });
});

describe('voice fallback', () => {
  it('gateway throwing -> 200 with rule parser and fallback sources', async () => {
    const { app } = await appWith((m) => spyClient(m, true));
    const res = await app.inject({ method: 'POST', url: '/v1/intent/parse', payload: PARSE });
    expect(res.statusCode).toBe(200);
    expect(res.json().intent.parser).toBe('rules');
    expect(res.json().source.llm).toBe('fallback');
    const audio = await app.inject({ method: 'POST', url: '/v1/voice/intent', ...multipart() });
    expect(audio.statusCode).toBe(200);
    expect(audio.json().source.stt).toBe('fallback');
    expect((await app.inject({ url: '/v1/ops/state' })).json().voiceHealthy).toBe(false);
  });
  it('fallback flag on -> no Sarvam call at all', async () => {
    const { app, client } = await appWith((m) => spyClient(m));
    await app.inject({ method: 'POST', url: '/v1/ops/fallback', headers: { 'x-ops-token': 't' }, payload: { on: true } });
    const res = await app.inject({ method: 'POST', url: '/v1/intent/parse', payload: PARSE });
    expect(res.json().source).toEqual({ stt: 'fallback', llm: 'fallback', tts: 'fallback' });
    await app.inject({ method: 'POST', url: '/v1/voice/intent', ...multipart() });
    expect((client as unknown as { calls: number }).calls).toBe(0);
  });
  it('live client path: llm + tts used when healthy', async () => {
    const { app, client } = await appWith((m) => spyClient(m));
    const res = await app.inject({ method: 'POST', url: '/v1/voice/intent', ...multipart() });
    expect(res.json().source).toEqual({ stt: 'live', llm: 'live', tts: 'live' });
    expect(res.json().intent.parser).toBe('llm');
    expect(res.json().reply.audioBase64).toBe('UklGRg==');
    expect((client as unknown as { calls: number }).calls).toBe(3);
  });
  it('x-load-test requests never touch the live client', async () => {
    const { app, client } = await appWith((m) => spyClient(m));
    await app.inject({ method: 'POST', url: '/v1/intent/parse', headers: { 'x-load-test': '1' }, payload: PARSE });
    expect((client as unknown as { calls: number }).calls).toBe(0);
  });
});

describe('llm parsing', () => {
  const base = mockDeps();
  const world = { routes: base.seed.routes, festivals: base.seed.festivals };
  const input = { text: PARSE.text, language: 'en-IN' as const, refDate: '2027-01-05', travellerId: 't', id: 'i' };
  it('invalid JSON twice -> rules', async () => {
    const chat = vi.fn(async () => 'not json at all');
    const out = await parseWithLlm(chat, input, world);
    expect(chat).toHaveBeenCalledTimes(2);
    expect(out.usedLlm).toBe(false);
    expect(out.intent.parser).toBe('rules');
  });
  it('invalid then valid -> llm', async () => {
    const good = JSON.stringify({ to: 'Hubballi', routeId: 'BLR-HBL', dateFrom: '2027-01-15', dateTo: '2027-01-15', timeWindow: 'night', mode: null, people: 1, boardingPoint: null, festivalId: 'sankranti-2027', gift: null });
    const chat = vi.fn().mockResolvedValueOnce('{"people": "two"}').mockResolvedValueOnce(`Sure: ${good}`);
    const out = await parseWithLlm(chat, input, world);
    expect(out.intent).toMatchObject({ parser: 'llm', routeId: 'BLR-HBL', dateFrom: '2027-01-15' });
  });
});

describe('live client never leaks the key', () => {
  it('error messages and logs do not contain the key', async () => {
    const key = 'sk-dummy-should-never-appear-123';
    const lines: string[] = [];
    const orig = console.log;
    console.log = (...a: unknown[]) => { lines.push(a.join(' ')); };
    const fetchImpl = vi.fn(async () => new Response('{"detail":"bad"}', { status: 500 }));
    const c = new LiveSarvamClient({ apiKey: key, fetchImpl });
    const err = await c.tts('hi', 'kn-IN', 'bulbul:v3', 'priya').catch((e: Error) => e);
    console.log = orig;
    expect(String((err as Error).message)).not.toContain(key);
    expect(lines.join('\n')).not.toContain(key);
    const init = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.stringify(init[1].body)).not.toContain(key);
  });
});

describe('fault injection', () => {
  it('crash_on_voice exits on the 3rd voice request', async () => {
    const f = faultState('crash_on_voice');
    const exit = vi.fn();
    f.exit = exit;
    await applyFault(f); await applyFault(f);
    expect(exit).not.toHaveBeenCalled();
    await applyFault(f);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
