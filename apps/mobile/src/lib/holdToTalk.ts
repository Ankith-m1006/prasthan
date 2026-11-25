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
