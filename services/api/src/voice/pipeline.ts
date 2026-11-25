// The traveller voice flow: audio/text -> TripIntent -> reply text -> reply audio. Never throws for bad input.
// Fallback path (flag voice_fallback_offline on, voice_enabled off, or the voice service failing):
// rule parser + cached offline clip (if recorded) + big text.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FlagsView, Lang, Source, TripIntent, VoiceIntentResponse } from '../../../../shared/contract/src/index.js';
import type { Deps } from '../deps.js';
import { parseRules, type ParseInput } from '../intent/rules.js';
import { REPO_ROOT } from '../seed.js';
import { nextId } from '../store.js';
import type { VoiceGateway } from './gateway.js';
import { offlineNotice, replyFor } from './reply.js';

export const AUDIO_DIR = join(REPO_ROOT, 'apps', 'mobile', 'assets', 'audio');

export interface VoiceDeps extends Deps { voice: VoiceGateway }
export interface TurnInput { identity: string; language: Lang; refDate: string; context: TripIntent | null; loadTest: boolean }

export function cachedClip(key: string): string | null {
  for (const ext of ['mp3', 'wav']) if (existsSync(join(AUDIO_DIR, `${key}.${ext}`))) return `/v1/audio/${key}.${ext}`;
  return null;
}

export function useFallback(flags: FlagsView): boolean {
  return flags.voice_fallback_offline || !flags.voice_enabled;
}

function noteError(deps: VoiceDeps, kind: string, err: unknown): void {
  deps.metrics.voiceErrors.inc({ kind });
  deps.store.voiceHealthy = false;
  deps.store.lastVoiceError = `${kind}: ${err instanceof Error ? err.message.slice(0, 120) : 'error'}`;
}

async function speak(deps: VoiceDeps, flags: FlagsView, intent: TripIntent, offline: boolean, loadTest: boolean) {
  const route = deps.seed.routes.find((r) => r.id === intent.routeId) ?? null;
  const { text, key } = replyFor(intent, route, flags.reply_style);
  const clip = cachedClip(key);
  const base = { text, language: intent.language, key, audioUrl: clip };
  if (offline) return { reply: { ...base, audioBase64: null, mime: clip ? 'audio/mpeg' : null }, tts: 'fallback' as Source };
  try {
    const speaker = flags.tts_speaker[flags.tts_model] ?? 'priya';
    const out = await deps.voice.tts(text, intent.language, flags.tts_model, speaker, loadTest);
    return { reply: { ...base, audioBase64: out.audioBase64, mime: out.audioBase64 ? 'audio/wav' : null }, tts: out.source as Source };
  } catch (err) {
    noteError(deps, 'tts', err);
    return { reply: { ...base, audioBase64: null, mime: null }, tts: 'fallback' as Source };
  }
}

export async function textTurn(deps: VoiceDeps, flags: FlagsView, text: string, t: TurnInput, stt: Source): Promise<VoiceIntentResponse> {
  const input: ParseInput = { text, language: t.language, refDate: t.refDate, travellerId: t.identity, id: nextId(deps.store, 'int'), context: t.context };
  const offline = useFallback(flags);
  let intent: TripIntent;
  let llm: Source = 'fallback';
  if (offline) {
    intent = parseRules(input, deps.seed);
  } else {
    try {
      const out = await deps.voice.parse(input, t.loadTest);
      intent = out.intent;
      llm = out.source;
      deps.store.voiceHealthy = true;
    } catch (err) {
      noteError(deps, 'llm', err);
      intent = parseRules(input, deps.seed);
    }
  }
  const spoken = await speak(deps, flags, intent, offline || (llm === 'fallback' && !deps.store.voiceHealthy), t.loadTest);
  deps.metrics.fallbackActive.set(offline ? 1 : 0);
  return { transcript: text, language: t.language, intent, reply: spoken.reply, source: { stt, llm, tts: spoken.tts } };
}

/** Audio turn. If STT fails or fallback is on, we cannot understand audio: ask the traveller to type instead (200, not 500). */
export async function audioTurn(deps: VoiceDeps, flags: FlagsView, audio: Buffer, mime: string, nameHint: string | undefined, t: TurnInput): Promise<VoiceIntentResponse> {
  if (!useFallback(flags) && audio.length > 0) {
    try {
      const out = await deps.voice.stt(audio, mime, flags.stt_mode, t.language, nameHint, t.loadTest);
      if (out.transcript.trim()) return textTurn(deps, flags, out.transcript, { ...t, language: out.language ?? t.language }, out.source);
    } catch (err) {
      noteError(deps, 'stt', err);
    }
  }
  const intent = parseRules({ text: '', language: t.language, refDate: t.refDate, travellerId: t.identity, id: nextId(deps.store, 'int'), context: t.context }, deps.seed);
  const clip = cachedClip(`${t.language.slice(0, 2)}-offline`);
  return {
    transcript: '', language: t.language, intent,
    reply: { text: offlineNotice(t.language), language: t.language, audioBase64: null, mime: clip ? 'audio/mpeg' : null, audioUrl: clip, key: 'offline' },
    source: { stt: 'fallback', llm: 'fallback', tts: 'fallback' },
  };
}
