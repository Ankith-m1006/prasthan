// Sarvam AI client interface + errors. Live and mock implementations live next to this file.
import type { Lang } from '../../../../shared/contract/src/index.js';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export interface SarvamClient {
  readonly mode: 'live' | 'mock';
  stt(audio: Buffer, mime: string, sttMode: string, lang?: Lang, nameHint?: string): Promise<{ transcript: string; language: Lang | null }>;
  /** Returns the raw assistant text (expected to be JSON); the caller validates it. */
  chat(messages: ChatMessage[]): Promise<string>;
  tts(text: string, lang: Lang, model: string, speaker: string): Promise<string | null>;
  translate(text: string, from: Lang, to: Lang): Promise<string>;
}

export class SarvamError extends Error {
  constructor(readonly kind: 'timeout' | 'rate_limit' | 'credits' | 'http' | 'bad_response', message: string, readonly status?: number) {
    super(message);
  }
}

export const SARVAM_BASE = 'https://api.sarvam.ai';
