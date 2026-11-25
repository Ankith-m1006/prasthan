// Pure hold-to-talk rules (tested): ignore taps under 400 ms, cap recordings at 20 s.
export const MIN_HOLD_MS = 400;
export const MAX_RECORD_MS = 20_000;

export type HoldDecision = 'ignore' | 'send' | 'send_capped';

export function decideHold(pressedAt: number, releasedAt: number): HoldDecision {
  const held = releasedAt - pressedAt;
  if (held < MIN_HOLD_MS) return 'ignore';
  return held >= MAX_RECORD_MS ? 'send_capped' : 'send';
}

export function timerLabel(ms: number): string {
  const s = Math.min(Math.floor(ms / 1000), MAX_RECORD_MS / 1000);
  return `0:${String(s).padStart(2, '0')} / 0:20`;
}

// Web recording formats. Chrome / Android Chrome / Firefox record webm+opus; Safari on iOS (before 18.4) only mp4+aac.
// The api accepts webm and m4a, so we pick the first the browser supports and name the upload by what it really is.
export const WEB_MIME_PREFERENCE = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/aac'];

export function pickWebMime(isSupported: (m: string) => boolean): string | undefined {
  return WEB_MIME_PREFERENCE.find((m) => { try { return isSupported(m); } catch { return false; } });
}

/** Pure: upload file name + clean mime for a recorded blob type ('' when the browser does not say: assume webm). */
export function clipFileFor(blobType: string): { name: string; mime: string } {
  const t = blobType.toLowerCase();
  if (t.includes('mp4') || t.includes('m4a') || t.includes('aac')) return { name: 'clip.m4a', mime: 'audio/mp4' };
  if (t.includes('ogg')) return { name: 'clip.ogg', mime: 'audio/ogg' };
  if (t.includes('wav')) return { name: 'clip.wav', mime: 'audio/wav' };
  return { name: 'clip.webm', mime: 'audio/webm' };
}

/** Pure: is this getUserMedia / recorder error a "mic permission denied"? */
export function isPermissionError(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name ?? '';
  const msg = String((err as { message?: string } | null)?.message ?? err ?? '');
  return name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError' || /permission|denied|not allowed/i.test(msg);
}
