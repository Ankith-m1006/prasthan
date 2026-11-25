import { PATTERNS, haptic } from '../src/lib/haptics';

describe('haptics', () => {
  it('sends the pattern for each kind', () => {
    const calls: Array<number | number[]> = [];
    const v = (p: number | number[]) => { calls.push(p); return true; };
    expect(haptic('tick', v)).toBe(true);
    expect(haptic('success', v)).toBe(true);
    expect(calls).toEqual([PATTERNS.tick, PATTERNS.success]);
  });
  it('is a silent no-op without vibrate (iOS Safari) or when it throws', () => {
    expect(haptic('notify', null)).toBe(false);
    expect(haptic('warning', () => { throw new Error('blocked'); })).toBe(false);
  });
});

import { tripSummary, whatsappUrl } from '../src/lib/share';

describe('whatsapp share', () => {
  it('builds an encoded wa.me link with the trip and the app link', () => {
    const intent = { to: 'Hubballi', dateFrom: '2027-01-15', timeWindow: 'night', mode: 'bus' } as never;
    const text = tripSummary(intent, 'ಸರಿ, ಶುಕ್ರವಾರ ರಾತ್ರಿ', 'kn-IN');
    expect(text).toContain('Hubballi');
    expect(text).toContain('https://prasthan-ten.vercel.app');
    expect(whatsappUrl(text).startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(whatsappUrl(text).split('=')[1])).toBe(text);
  });
});
