// Live Sarvam client. Key only from process.env.SARVAM_API_KEY, sent as header `api-subscription-key`; never logged.
//
// Verified on docs.sarvam.ai (25 Nov 2026, via the .md versions of these pages):
// - TTS  https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/overview : POST /text-to-speech,
//        JSON {text, language_code, model, speaker, pace, speech_sample_rate, enable_preprocessing, temperature};
//        response {audios: [base64 WAV]}. Re-checked 25 Nov 15:05: bulbul:v4-flash is newest; voices in voices.ts.
// - STT  https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview : POST /speech-to-text, model saaras:v4,
//        mode transcribe|translate|verbatim|translit|codemix, max 30 s audio; accepts webm, ogg/opus, mp4/m4a, wav, mp3, aac.
//        So no ffmpeg conversion is needed. Multipart field `file` + `language_code` and response `transcript` /
//        `language_code` are from earlier Sarvam API versions: UNVERIFIED on today's page.
// - Chat https://docs.sarvam.ai/api/token-factory/chat-completions : OpenAI-compatible /v1/chat/completions, model sarvam-105b (sarvam-m is deprecated).
//        Re-checked 25 Nov 14:30 (api-reference/chat/chat-completions-v1): reasoning_effort null = reasoning off,
//        max_tokens includes reasoning tokens (the earlier 600-token call ran out), response_format json_object supported.
// - Translate: POST /translate {input, source_language_code, target_language_code, model} -> {translated_text}: UNVERIFIED.
import type { Lang } from '../../../../shared/contract/src/index.js';
import { fetchRetry, TimeoutError } from '../http.js';
import { SARVAM_BASE, SarvamError, type ChatMessage, type SarvamClient } from './client.js';
import { TTS_SETTINGS, lastTts, voicesFor } from './voices.js';
import { toSpoken } from '../voice/spoken.js';

const TIMEOUT_MS = 8000;
const CHAT_TIMEOUT_MS = 7000;

export interface LiveOptions { apiKey: string; badModel?: boolean; baseUrl?: string; fetchImpl?: typeof fetchRetry }

export class LiveSarvamClient implements SarvamClient {
  readonly mode = 'live' as const;
  private readonly base: string;
  private readonly doFetch: typeof fetchRetry;

  constructor(private readonly opts: LiveOptions) {
    this.base = opts.baseUrl ?? SARVAM_BASE;
    this.doFetch = opts.fetchImpl ?? fetchRetry;
  }

  private async call(path: string, body: BodyInit, json: boolean, timeoutMs = TIMEOUT_MS): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = { 'api-subscription-key': this.opts.apiKey };
    if (json) headers['content-type'] = 'application/json';
    let res: Response;
    try {
      res = await this.doFetch(`${this.base}${path}`, { method: 'POST', headers, body }, { timeoutMs });
    } catch (err) {
      throw new SarvamError(err instanceof TimeoutError ? 'timeout' : 'http', `sarvam ${path} failed`);
    }
    if (res.status === 402) throw new SarvamError('credits', 'Sarvam credits used up', 402);
    if (res.status === 429) throw new SarvamError('rate_limit', 'Sarvam rate limit', 429);
    if (!res.ok) throw new SarvamError('http', `sarvam ${path} returned ${res.status}`, res.status);
    return (await res.json()) as Record<string, unknown>;
  }

  async stt(audio: Buffer, mime: string, sttMode: string, lang?: Lang): Promise<{ transcript: string; language: Lang | null }> {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(audio)], { type: mime }), `clip.${mime.split('/')[1] ?? 'wav'}`);
    form.append('model', this.opts.badModel ? 'saaras:v0-broken' : 'saaras:v4');
    form.append('mode', sttMode);
    if (lang) form.append('language_code', lang);
    const out = await this.call('/speech-to-text', form, false);
    if (typeof out.transcript !== 'string') throw new SarvamError('bad_response', 'no transcript');
    return { transcript: out.transcript, language: typeof out.language_code === 'string' ? (out.language_code as Lang) : null };
  }

  /** sarvam-105b with reasoning off (reasoning tokens count toward max_tokens), small output, JSON mode.
   *  If the json_object response_format is rejected (400/422), retry once without it. */
  async chat(messages: ChatMessage[]): Promise<string> {
    const base = { model: 'sarvam-105b', messages, temperature: 0.1, max_tokens: 350, reasoning_effort: null };
    let out: Record<string, unknown>;
    try {
      out = await this.call('/v1/chat/completions', JSON.stringify({ ...base, response_format: { type: 'json_object' } }), true, CHAT_TIMEOUT_MS);
    } catch (err) {
      if (!(err instanceof SarvamError && (err.status === 400 || err.status === 422))) throw err;
      out = await this.call('/v1/chat/completions', JSON.stringify(base), true, CHAT_TIMEOUT_MS);
    }
    const choices = out.choices as Array<{ message?: { content?: string | null } }> | undefined;
    const content = choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new SarvamError('bad_response', 'no chat content');
    return content;
  }

  /** Natural voice: bulbul:v4-flash persona for the language (fallback bulbul:v3 + the flag speaker), 24 kHz WAV,
   *  pace 1.0, enable_preprocessing on, and the text rewritten for speech first (no ids, arrows, "Rs"). One call per reply. */
  async tts(text: string, lang: Lang, model: string, speaker: string): Promise<string | null> {
    const spoken = toSpoken(text, lang).slice(0, 2500) || text.slice(0, 2500);
    let lastErr: unknown = null;
    lastTts.ms = [];
    for (const v of voicesFor(lang, model, speaker)) {
      const t0 = Date.now();
      try {
        const body = { text: spoken, language_code: lang, model: v.model, speaker: v.speaker, ...TTS_SETTINGS };
        const out = await this.call('/text-to-speech', JSON.stringify(body), true);
        const audios = out.audios as string[] | undefined;
        lastTts.ms.push(Date.now() - t0);
        if (audios?.[0]) { lastTts.voice = `${v.model}/${v.speaker}`; return audios[0]; }
      } catch (err) {
        lastTts.ms.push(Date.now() - t0);
        lastErr = err;
        if (!(err instanceof SarvamError && (err.status === 400 || err.status === 422))) throw err;
      }
    }
    if (lastErr) throw lastErr;
    return null;
  }

  async translate(text: string, from: Lang, to: Lang): Promise<string> {
    const body = JSON.stringify({ input: text, source_language_code: from, target_language_code: to, model: 'mayura:v1' });
    const out = await this.call('/translate', body, true);
    if (typeof out.translated_text !== 'string') throw new SarvamError('bad_response', 'no translation');
    return out.translated_text;
  }
}
