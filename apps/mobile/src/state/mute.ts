// Voice reply mute toggle (header). Kept on the device.
import { useSyncExternalStore } from 'react';
import { deviceKV } from '../lib/storage';

const KEY = 'prasthan.mute.v1';
const kv = deviceKV();
let muted = kv.get(KEY) === '1';
const listeners = new Set<() => void>();

export function isMuted(): boolean { return muted; }
export function setMuted(v: boolean): void { muted = v; kv.set(KEY, v ? '1' : '0'); listeners.forEach((l) => l()); }
export function useMuted(): boolean {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => muted, () => muted);
}
