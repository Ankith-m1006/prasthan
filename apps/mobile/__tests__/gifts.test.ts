import { basketFromAsk, basketLines, basketTotal, departureFor, groupOrders, mergeOrders, parserLabel, pickupSlots, shopsNear, stepQty } from '../src/lib/gifts';
import { basketOrders, parseBaskets } from '../src/state/orders';
import { clipFileFor, isPermissionError, pickWebMime } from '../src/lib/holdToTalk';
import { notificationFor, pollSeconds } from '../src/lib/notify';
import { fontFor, scriptLang } from '../src/theme/tokens';
import { initials, partnerName } from '../src/ui/logos';
import type { Alert, GiftOrder, Partner, ShopItem } from '@contract';

const items: ShopItem[] = [
  { id: 'mysore-pak', name: 'Mysore pak', nameLocal: '', unit: 'kg', priceInr: 640, readyInMinutes: 30, dailyCapacity: 40 },
  { id: 'gift-box-s', name: 'Box', nameLocal: '', unit: 'box', priceInr: 450, readyInMinutes: 15, dailyCapacity: 20 },
];
const shop = (id: string, bp: string): Partner => ({ id, type: 'sweet_shop', name: id, boardingPoint: bp, items });

describe('sweets pre-order', () => {
  it('pickup slots end 30 min before departure and start 2.5 h before', () => {
    expect(departureFor('night')).toBe('22:00');
    expect(pickupSlots('22:00')).toEqual(['19:30', '20:00', '20:30', '21:00', '21:30']);
    expect(pickupSlots('07:00')).toEqual(['08:00']);
  });
  it('shops at the boarding point first, else all shops', () => {
    const all = [shop('a', 'MAJESTIC'), shop('b', 'SATELLITE'), { ...shop('c', 'X'), type: 'bus_operator' as const }];
    expect(shopsNear(all, 'SATELLITE')).toEqual({ shops: [all[1]], exact: true });
    expect(shopsNear(all, 'KSR').shops.map((s) => s.id)).toEqual(['a', 'b']);
  });
  it('basket steps, lines and total', () => {
    let b = stepQty({}, 'mysore-pak', 1);
    b = stepQty(b, 'mysore-pak', 1);
    b = stepQty(b, 'gift-box-s', 1);
    expect(basketTotal(basketLines(items, b))).toBe(2 * 640 + 450);
    expect(stepQty(b, 'gift-box-s', -1)).toEqual({ 'mysore-pak': 2 });
    expect(stepQty({}, 'x', -1)).toEqual({});
    expect(basketFromAsk(items, { itemId: 'mysore-pak', qty: 2 })).toEqual({ 'mysore-pak': 2 });
    expect(basketFromAsk(items, { itemId: 'nope', qty: 2 })).toEqual({});
  });
  it('groups shop orders per pickup point and day', () => {
    const o = (id: string, date: string, bp: string, qty: number, by: string): GiftOrder => ({ id, partnerId: 's', travellerId: 't', itemId: 'mysore-pak', qty, pickupPoint: bp, pickupDate: date, readyBy: by, status: 'placed', payment: 'pay_at_pickup_demo' });
    const g = groupOrders([o('1', '2027-01-14', 'MAJESTIC', 2, '21:00'), o('2', '2027-01-14', 'MAJESTIC', 1, '20:00'), o('3', '2027-01-13', 'MAJESTIC', 1, '19:00')]);
    expect(g.map((x) => x.pickupDate)).toEqual(['2027-01-13', '2027-01-14']);
    expect(g[1].perItem).toEqual([{ itemId: 'mysore-pak', qty: 3 }]);
    expect(g[1].firstReady).toBe('20:00');
    expect(mergeOrders([o('1', 'd', 'p', 1, 'r')], [o('1', 'd', 'p', 1, 'r'), o('9', 'd', 'p', 1, 'r')]).map((x) => x.id)).toEqual(['1', '9']);
  });
  it('saved baskets parse safely and expand into orders', () => {
    expect(parseBaskets('nope')).toEqual([]);
    const b = { id: 'ord-1', shopId: 's', shopName: 'S', pickupPoint: 'MAJESTIC', pickupName: 'M', pickupDate: '2027-01-14', readyBy: '21:00', lines: [{ orderId: 'ord-1', itemId: 'mysore-pak', name: 'M', unit: 'kg', qty: 2, priceInr: 640 }], total: 1280, status: 'placed', createdAt: '' };
    expect(parseBaskets(JSON.stringify([b, { bad: 1 }]))).toHaveLength(1);
    expect(basketOrders([b as never], 't')[0]).toMatchObject({ id: 'ord-1', qty: 2, partnerId: 's' });
  });
  it('shows Sarvam AI only when the LLM parsed it', () => {
    expect(parserLabel('sarvam-llm')).toEqual({ text: 'understood by Sarvam AI', ai: true });
    expect(parserLabel('llm').ai).toBe(true);
    expect(parserLabel('rules').text).toBe('understood by rules');
  });
});

describe('mic, notifications, fonts, logos', () => {
  it('picks a recording format the browser supports', () => {
    expect(pickWebMime((m) => m.startsWith('audio/webm'))).toBe('audio/webm;codecs=opus');
    expect(pickWebMime((m) => m === 'audio/mp4')).toBe('audio/mp4');
    expect(pickWebMime(() => false)).toBeUndefined();
  });
  it('names uploads by the real recorded type', () => {
    expect(clipFileFor('audio/webm;codecs=opus')).toEqual({ name: 'clip.webm', mime: 'audio/webm' });
    expect(clipFileFor('audio/mp4')).toEqual({ name: 'clip.m4a', mime: 'audio/mp4' });
    expect(clipFileFor('')).toEqual({ name: 'clip.webm', mime: 'audio/webm' });
  });
  it('recognises a denied mic', () => {
    expect(isPermissionError({ name: 'NotAllowedError', message: '' })).toBe(true);
    expect(isPermissionError(new Error('Permission denied'))).toBe(true);
    expect(isPermissionError(new Error('No media devices available'))).toBe(false);
  });
  it('notification text in the traveller language', () => {
    const a: Alert = { id: 'a', kind: 'new_service', routeId: null, date: null, text: 'New bus', textLocal: { 'kn-IN': 'ಹೊಸ ಬಸ್' }, source: 'live', createdAt: '' };
    expect(notificationFor(a, 'kn-IN')).toEqual({ title: 'New bus home - Prasthan', body: 'ಹೊಸ ಬಸ್' });
    expect(notificationFor(a, 'ta-IN').body).toBe('New bus');
    expect(pollSeconds(5)).toBe(5);
    expect(pollSeconds(60)).toBe(15);
  });
  it('one Noto Sans per script', () => {
    expect(fontFor('ta-IN')).toBe('NotoSansTamil_400Regular');
    expect(fontFor('od-IN', true)).toBe('NotoSansOriya_700Bold');
    expect(fontFor('en-IN')).toBe('Mukta_400Regular');
    expect(['ಬೆಂಗಳೂರು', 'சென்னை', 'హైదరాబాద్', 'दिल्ली', 'ଭୁବନେଶ୍ୱର', 'কলকাতা', 'Hubli'].map(scriptLang)).toEqual(['kn-IN', 'ta-IN', 'te-IN', 'hi-IN', 'od-IN', 'bn-IN', undefined]);
  });
  it('monogram initials for fictional partners', () => {
    expect(initials('Sihi Mane Sweets (demo)')).toBe('SM');
    expect(initials('Zingo')).toBe('ZI');
    expect(partnerName('Sihi Mane Sweets (demo)')).toBe('Sihi Mane Sweets');
  });
});

describe('shop pickups (v2 multi-item orders)', () => {
  it('counts every line per pickup point and day', () => {
    const { pickupCells } = jest.requireActual('../src/lib/gifts') as typeof import('../src/lib/gifts');
    const s: Partner = { id: 's', type: 'sweet_shop', name: 'S', boardingPoint: 'MAJESTIC', items: [
      { id: 'a', name: 'A', nameLocal: '', unit: 'kg', priceInr: 100, readyInMinutes: 30, dailyCapacity: 9 },
      { id: 'b', name: 'B', nameLocal: '', unit: 'box', priceInr: 50, readyInMinutes: 30, dailyCapacity: 9 }] };
    const base = { partnerId: 's', travellerId: 't', pickupPoint: 'MAJESTIC', pickupDate: '2027-01-14', status: 'placed' as const, payment: 'pay_at_pickup_demo' as const };
    const cells = pickupCells([{ ...base, id: '1', itemId: 'a', qty: 2, readyBy: '21:00', items: [{ itemId: 'a', qty: 2 }, { itemId: 'b', qty: 1 }] }, { ...base, id: '2', itemId: 'a', qty: 1, readyBy: '20:30' }], s);
    expect(cells).toEqual([{ pickupPoint: 'MAJESTIC', pickupDate: '2027-01-14', orders: 2, firstReadyBy: '20:30', items: [{ itemId: 'a', name: 'A', unit: 'kg', qty: 3 }, { itemId: 'b', name: 'B', unit: 'box', qty: 1 }], totalInr: 350 }]);
  });
});
