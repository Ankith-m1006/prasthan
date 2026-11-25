// Web notifications for new alerts. Permission is asked politely, only after the traveller taps "Alert me".
// Native (and browsers without Notification, or a "no"): the in-app banner is the only signal (no new native deps).
import { Platform } from 'react-native';
import type { Alert, Lang } from '@contract';

type Perm = 'default' | 'granted' | 'denied' | 'unsupported';
interface NotificationLike { permission: Perm; requestPermission(): Promise<Perm> }

const N = (): NotificationLike | null => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return (window as unknown as { Notification?: NotificationLike }).Notification ?? null;
};

/** Poll interval: the Flagsmith value, at most ~15 s while the app is open. */
export const pollSeconds = (flag: number) => Math.min(15, Math.max(2, flag || 15));

export const notifyPermission = (): Perm => N()?.permission ?? 'unsupported';

/** Ask once, after "Alert me". Never asks again after a "no". Returns the final permission. */
export async function askNotifyPermission(): Promise<Perm> {
  const n = N();
  if (!n) return 'unsupported';
  if (n.permission !== 'default') return n.permission;
  try { return await n.requestPermission(); } catch { return 'denied'; }
}

/** Pure: the notification text for an alert, in the traveller's language when we have it (tested). */
export function notificationFor(a: Alert, lang: Lang): { title: string; body: string } {
  const title = a.kind === 'new_service' || a.kind === 'special_bus' ? 'New bus home - Prasthan' : a.kind === 'special_train' ? 'Special train - Prasthan' : 'Prasthan alert';
  return { title, body: a.textLocal?.[lang] ?? a.text };
}

/** Raise a browser notification (web, permission granted). Returns false when only the in-app banner can show it. */
export function raiseNotification(a: Alert, lang: Lang): boolean {
  const n = N();
  if (!n || n.permission !== 'granted') return false;
  try {
    const { title, body } = notificationFor(a, lang);
    const Ctor = n as unknown as new (t: string, o: { body: string; tag: string; icon?: string }) => unknown;
    new Ctor(title, { body, tag: a.id, icon: '/favicon.ico' });
    return true;
  } catch {
    return false; // e.g. Chrome Android needs a service worker: the in-app banner still shows it
  }
}
