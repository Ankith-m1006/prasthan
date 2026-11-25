// VoiceGateway: how the api reaches the voice service. ROLE=all -> in-process; ROLE=api -> HTTP to VOICE_URL (8 s timeout).
// Load-test requests (header x-load-test: 1) always use the mock Sarvam client, but still go through the voice service.
import type { Lang, TripIntent } from '../../../../shared/contract/src/index.js';
import { fetchRetry } from '../http.js';
import { parseWithLlm } from '../intent/llm.js';
import { parseRules, type ParseInput, type ParseWorld } from '../intent/rules.js';
import type { SarvamClient } from '../sarvam/client.js';

export interface SttResult { transcript: string; language: Lang | null; source: 'live' | 'mock' }
export interface LlmResult { intent: TripIntent; source: 'live' | 'mock' | 'fallback' }

export interface VoiceGateway {
  stt(audio: Buffer, mime: string, sttMode: string, lang: Lang | undefined, nameHint: string | undefined, loadTest: boolean): Promise<SttResult>;
  parse(input: ParseInput, loadTest: boolean): Promise<LlmResult>;
  tts(text: string, lang: Lang, model: string, speaker: string, loadTest: boolean): Promise<{ audioBase64: string | null; source: 'live' | 'mock' }>;
  translate(text: string, from: Lang, to: Lang, loadTest: boolean): Promise<string>;
}

export class InProcessGateway implements VoiceGateway {
  constructor(private readonly live: SarvamClient, private readonly mock: SarvamClient, private readonly world: ParseWorld) {}

  private pick(loadTest: boolean): SarvamClient {
    return loadTest ? this.mock : this.live;
  }

  async stt(audio: Buffer, mime: string, sttMode: string, lang: Lang | undefined, nameHint: string | undefined, loadTest: boolean): Promise<SttResult> {
    const c = this.pick(loadTest);
    const out = await c.stt(audio, mime, sttMode, lang, nameHint);
    return { ...out, source: c.mode };
  }

  async parse(input: ParseInput, loadTest: boolean): Promise<LlmResult> {
    const c = this.pick(loadTest);
    if (c.mode === 'mock') return { intent: parseRules(input, this.world), source: 'mock' };
    const { intent, usedLlm } = await parseWithLlm((m) => c.chat(m), input, this.world);
    return { intent, source: usedLlm ? 'live' : 'fallback' };
  }

  async tts(text: string, lang: Lang, model: string, speaker: string, loadTest: boolean): Promise<{ audioBase64: string | null; source: 'live' | 'mock' }> {
    const c = this.pick(loadTest);
    return { audioBase64: await c.tts(text, lang, model, speaker), source: c.mode };
  }

  async translate(text: string, from: Lang, to: Lang, loadTest: boolean): Promise<string> {
    return this.pick(loadTest).translate(text, from, to);
  }
}

export class HttpGateway implements VoiceGateway {
  constructor(private readonly baseUrl: string) {}

  private async post<T>(path: string, body: unknown, loadTest: boolean): Promise<T> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (loadTest) headers['x-load-test'] = '1';
    const res = await fetchRetry(`${this.baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) }, { timeoutMs: 8000 });
    if (!res.ok) throw new Error(`voice ${path} returned ${res.status}`);
    return (await res.json()) as T;
  }

  stt(audio: Buffer, mime: string, sttMode: string, lang: Lang | undefined, nameHint: string | undefined, loadTest: boolean): Promise<SttResult> {
    return this.post('/voice/stt', { audioBase64: audio.toString('base64'), mime, sttMode, lang, nameHint }, loadTest);
  }

  parse(input: ParseInput, loadTest: boolean): Promise<LlmResult> {
    return this.post('/voice/llm', input, loadTest);
  }

  tts(text: string, lang: Lang, model: string, speaker: string, loadTest: boolean): Promise<{ audioBase64: string | null; source: 'live' | 'mock' }> {
    return this.post('/voice/tts', { text, lang, model, speaker }, loadTest);
  }

  async translate(text: string, from: Lang, to: Lang, loadTest: boolean): Promise<string> {
    return (await this.post<{ text: string }>('/voice/translate', { text, from, to }, loadTest)).text;
  }
}
