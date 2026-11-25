// Plays a reply. Order: Sarvam audio in the reply (WAV, played as-is at its own sample rate) -> cached clip ->
// a fresh Sarvam /v1/tts call -> the browser's speech voice (robotic; LAST resort only) -> nothing (text is shown big).
// Web: one shared <audio> element, unlocked inside a tap (unlockAudio), so replies that arrive later still play on iOS.
import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import type { Lang, VoiceReply } from '@contract';
import { api } from '../api';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
// 0.05 s of silence (8 kHz mono WAV) to unlock the element in a gesture
const SILENT_WAV = 'data:audio/wav;base64,UklGRkgDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSQDAAAAAAAA' + 'A'.repeat(1067) + '=';

let el: HTMLAudioElement | null = null;
function audioEl(): HTMLAudioElement {
  if (!el) { el = new Audio(); el.preload = 'auto'; el.setAttribute('playsinline', ''); }
  return el;
}

/** Call inside a tap handler (mic, Send, Alert me, play). Safe to call often. */
export function unlockAudio(): void {
  if (!isWeb) return;
  const a = audioEl();
  if (a.dataset.unlocked === '1' || !a.paused) return;
  a.src = SILENT_WAV;
  a.play().then(() => { a.dataset.unlocked = '1'; }).catch(() => undefined);
}

async function playUri(uri: string): Promise<boolean> {
  if (isWeb) {
    const a = audioEl();
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    a.pause();
    a.src = uri;
    try { await a.play(); return true; } catch { return false; }
  }
  try { createAudioPlayer({ uri }).play(); return true; } catch { return false; }
}

function browserSpeak(text: string, lang: Lang): boolean {
  if (!isWeb || !('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (!voice) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}

async function sarvam(text: string, lang: Lang): Promise<boolean | null> {
  try {
    const res = await api.tts(text, lang);
    if (!res.audioBase64) return null;
    return playUri(`data:${res.mime ?? 'audio/wav'};base64,${res.audioBase64}`);
  } catch {
    return null;
  }
}

export type Voiced = 'sarvam' | 'clip' | 'browser' | 'none';

/** Returns how the reply was voiced, for the honesty chip. A blocked play of real audio never falls back to the robot voice. */
export async function playReply(reply: VoiceReply): Promise<Voiced> {
  if (reply.audioBase64) return (await playUri(`data:${reply.mime ?? 'audio/wav'};base64,${reply.audioBase64}`)) ? 'sarvam' : 'none';
  if (reply.audioUrl && API_URL && (await playUri(`${API_URL}${reply.audioUrl}`))) return 'clip';
  return speakText(reply.text, reply.language);
}

export async function speakText(text: string, lang: Lang): Promise<'sarvam' | 'browser' | 'none'> {
  const live = await sarvam(text, lang);
  if (live !== null) return live ? 'sarvam' : 'none';
  return browserSpeak(text, lang) ? 'browser' : 'none';
}
