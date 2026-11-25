// HTTP client for the Prasthan api. Base URL = EXPO_PUBLIC_API_URL. 10 s timeout. No secrets in the app.
import { Platform } from 'react-native';
import type { Api, RecordedAudio } from './types';
import { currentIdentity, getIdentity } from '../state/identity';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

export function createHttpClient(baseUrl: string): Api {
  async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const headers: Record<string, string> = { 'x-prasthan-identity': currentIdentity(), ...(init.headers as Record<string, string> | undefined) };
      if (init.body && typeof init.body === 'string') headers['content-type'] = 'application/json';
      const res = await fetch(`${baseUrl}${path}`, { ...init, headers, signal: ctrl.signal });
      const body = (await res.json().catch(() => ({}))) as T & { error?: { code: string; message: string } };
      if (!res.ok) throw new ApiError(res.status, body.error?.code ?? 'http', body.error?.message ?? `HTTP ${res.status}`);
      return body;
    } finally {
      clearTimeout(timer);
    }
  }
  const post = <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) });

  async function audioForm(audio: RecordedAudio): Promise<FormData> {
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(audio.uri)).blob();
      form.append('audio', blob, audio.name);
    } else {
      form.append('audio', { uri: audio.uri, name: audio.name, type: audio.mime } as unknown as Blob);
    }
    return form;
  }

  return {
    kind: 'http',
    identify: (identity, traits) => post('/v1/identify', { identity, traits }),
    config: () => req('/v1/config'),
    voiceIntent: async (audio, language, context) => {
      const form = await audioForm(audio);
      form.append('language', language);
      if (context) form.append('context', JSON.stringify(context));
      return req('/v1/voice/intent', { method: 'POST', body: form });
    },
    parse: (text, language, context) => post('/v1/intent/parse', { text, language, context }),
    tts: (text, language) => post('/v1/tts', { text, language }),
    options: (routeId, date, mode, people) => req(`/v1/options?routeId=${encodeURIComponent(routeId)}&date=${date ?? ''}&mode=${mode ?? ''}&people=${people}`),
    saveTrip: (intent) => post('/v1/trips', { intent }),
    alerts: (since) => req(`/v1/alerts?identity=${encodeURIComponent(getIdentity().traveller)}${since ? `&since=${encodeURIComponent(since)}` : ''}`),
    partners: (type) => req(`/v1/partners${type ? `?type=${type}` : ''}`),
    demand: (id, date) => req(`/v1/partners/${id}/demand${date ? `?date=${date}` : ''}`),
    addServices: (id, body) => post(`/v1/partners/${id}/services`, body),
    giftOrder: (body) => post('/v1/gifts/orders', body),
    orders: (id) => req(`/v1/partners/${id}/orders`),
    opsState: () => req('/v1/ops/state'),
  };
}
