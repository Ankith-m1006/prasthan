// Plays a reply: Sarvam audio (base64 WAV) or a cached clip URL via expo-audio; otherwise, on web, the browser's
// own speech voice if it has one for the language; otherwise nothing (the screen shows the text big).
import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import type { Lang, VoiceReply } from '@contract';
import { api } from '../api';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

function playUri(uri: string): boolean {
  try {
    const p = createAudioPlayer({ uri });
    p.play();
    return true;
  } catch {
    return false;
  }
}

function browserSpeak(text: string, lang: Lang): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
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

/** Returns how the reply was voiced, for the honesty chip. */
export function playReply(reply: VoiceReply): 'sarvam' | 'clip' | 'browser' | 'none' {
  if (reply.audioBase64 && playUri(`data:${reply.mime ?? 'audio/wav'};base64,${reply.audioBase64}`)) return 'sarvam';
  if (reply.audioUrl && API_URL && playUri(`${API_URL}${reply.audioUrl}`)) return 'clip';
  if (browserSpeak(reply.text, reply.language)) return 'browser';
  return 'none';
}

export async function speakText(text: string, lang: Lang): Promise<'sarvam' | 'browser' | 'none'> {
  try {
    const res = await api.tts(text, lang);
    if (res.audioBase64 && playUri(`data:${res.mime ?? 'audio/wav'};base64,${res.audioBase64}`)) return 'sarvam';
  } catch {
    // fall through to the browser voice
  }
  return browserSpeak(text, lang) ? 'browser' : 'none';
}
