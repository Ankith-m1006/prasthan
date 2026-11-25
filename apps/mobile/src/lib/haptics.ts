// Haptics: web uses navigator.vibrate (Android Chrome); iOS Safari has no vibrate -> silent no-op.
// Native: expo-haptics is not installed, so native is a no-op too (kept tiny on purpose).
export type HapticKind = 'tick' | 'medium' | 'success' | 'warning' | 'notify';

export const PATTERNS: Record<HapticKind, number | number[]> = {
  tick: 8,
  medium: 18,
  success: [12, 60, 24],
  warning: [30, 50, 30],
  notify: [20, 80, 20, 80, 40],
};

type Vibrate = (p: number | number[]) => boolean;

function defaultVibrate(): Vibrate | null {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { vibrate?: Vibrate }) : undefined;
  return nav && typeof nav.vibrate === 'function' ? nav.vibrate.bind(nav) : null;
}

/** Fire a haptic. Returns true when the device accepted it. Never throws. */
export function haptic(kind: HapticKind, vibrate: Vibrate | null = defaultVibrate()): boolean {
  if (!vibrate) return false;
  try { return vibrate(PATTERNS[kind]) !== false; } catch { return false; }
}
