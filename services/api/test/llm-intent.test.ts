// Sarvam LLM intent path with a mocked chat client: 6 code-mixed sentences, validation, fallback, live client body.
import { describe, it, expect, vi } from 'vitest';
import { mockDeps } from '../src/app.js';
import { giftItemId, parseWithLlm } from '../src/intent/llm.js';
import { LiveSarvamClient } from '../src/sarvam/live.js';
import { makeAjv, assertValid } from './helpers/ajv.js';

const base = mockDeps();
const world = { routes: base.seed.routes, festivals: base.seed.festivals };
const ajv = makeAjv();
const input = (text: string) => ({ text, language: 'kn-IN' as const, refDate: '2027-01-05', travellerId: 't1', id: 'int-1' });
const reply = (o: Record<string, unknown>) => JSON.stringify({
  from: 'Bengaluru', to: null, routeId: null, dateFrom: null, dateTo: null, timeWindow: 'any', mode: null, people: 1,
  travellingWith: null, boardingPoint: null, festivalId: null, gift: null, ...o,
});

const CASES: Array<{ lang: string; text: string; llm: Record<string, unknown>; expect: Record<string, unknown> }> = [
  { lang: 'Kanglish', text: 'Ajji jothe Friday raatri Hubli ge hogbeku, 2 kg Mysore pak beku',
    llm: { to: 'Hubballi', routeId: 'BLR-HBL', dateFrom: '2027-01-08', timeWindow: 'night', people: 2, travellingWith: 'elders', gift: { item: 'Mysore pak', qty: 2, unit: 'kg' } },
    expect: { routeId: 'BLR-HBL', dateFrom: '2027-01-08', timeWindow: 'night', people: 2, travellingWith: 'elders', gift: { itemId: 'mysore-pak', qty: 2, unit: 'kg' } } },
  { lang: 'Kannada', text: 'ಸಂಕ್ರಾಂತಿಗೆ ಅಮ್ಮ ಅಪ್ಪನ ಜೊತೆ ಬೆಳಗಾವಿಗೆ ಬಸ್ಸಲ್ಲಿ ಹೋಗ್ಬೇಕು, ಶುಕ್ರವಾರ ಅಥವಾ ಶನಿವಾರ',
    llm: { to: 'Belagavi', routeId: 'BLR-BGM', dateFrom: '2027-01-08', dateTo: '2027-01-09', mode: 'bus', people: 3, travellingWith: 'elders', festivalId: 'sankranti-2027' },
    expect: { routeId: 'BLR-BGM', dateFrom: '2027-01-08', dateTo: '2027-01-09', mode: 'bus', people: 3 } },
  { lang: 'Hindi', text: 'Bhaiya Chhath ke liye Patna jaana hai, train se, family ke saath 4 log, Thursday shaam',
    llm: { to: 'Patna', routeId: 'BLR-PNBE', dateFrom: '2027-01-07', timeWindow: 'evening', mode: 'train', people: 4, travellingWith: 'family' },
    expect: { routeId: 'BLR-PNBE', mode: 'train', people: 4, travellingWith: 'family', timeWindow: 'evening' } },
  { lang: 'Tamil', text: 'Pongal-ku Madurai poganum, Wednesday night bus, rendu peru, 1 box sweets venum',
    llm: { to: 'Madurai', routeId: 'BLR-MDU', dateFrom: '2027-01-06', timeWindow: 'night', mode: 'bus', people: 2, gift: { item: 'gift-box-s', qty: 1, unit: 'box' } },
    expect: { routeId: 'BLR-MDU', people: 2, gift: { itemId: 'gift-box-s', qty: 1, unit: 'box' } } },
  { lang: 'Telugu', text: 'Sankranti ki Vijayawada vellali, friends tho, Saturday morning',
    llm: { to: 'Vijayawada', routeId: 'BLR-BZA', dateFrom: '2027-01-09', timeWindow: 'morning', people: 3, travellingWith: 'friends' },
    expect: { routeId: 'BLR-BZA', timeWindow: 'morning', travellingWith: 'friends' } },
  { lang: 'English', text: 'Need to get to Mangaluru on the 12th with my wife and kid, boarding at Majestic',
    llm: { to: 'Mangaluru', routeId: 'BLR-MLR', dateFrom: '2027-01-12', people: 3, travellingWith: 'family', boardingPoint: 'MAJESTIC' },
    expect: { routeId: 'BLR-MLR', dateFrom: '2027-01-12', boardingPoint: 'MAJESTIC', people: 3 } },
];

describe('Sarvam LLM intent (mocked client)', () => {
  for (const c of CASES) {
    it(`${c.lang}: ${c.text.slice(0, 40)}`, async () => {
      const chat = vi.fn(async () => reply(c.llm));
      const out = await parseWithLlm(chat, input(c.text), world);
      expect(out.usedLlm).toBe(true);
      expect(out.intent).toMatchObject({ ...c.expect, parser: 'sarvam-llm', transcript: c.text });
      assertValid(ajv, 'trip-intent.json', out.intent);
    });
  }

  it('unknown routeId / festival / boarding point are dropped, not trusted', async () => {
    const chat = vi.fn(async () => reply({ routeId: 'BLR-XXX', to: 'Atlantis', festivalId: 'nope', boardingPoint: 'MOON' }));
    const out = await parseWithLlm(chat, input('somewhere'), world);
    expect(out.intent).toMatchObject({ routeId: null, to: null, festivalId: null, boardingPoint: null, needsFollowUp: ['to', 'date'] });
  });

  it('timeout (deadline) -> rules', async () => {
    const chat = vi.fn(() => new Promise<string>(() => {}));
    const out = await parseWithLlm(chat, input('Hubli ge Friday raatri'), world, 50);
    expect(out.usedLlm).toBe(false);
    expect(out.intent).toMatchObject({ parser: 'rules', routeId: 'BLR-HBL' });
  });

  it('network error -> rules, no second chat call', async () => {
    const chat = vi.fn(async () => { throw new Error('down'); });
    const out = await parseWithLlm(chat, input('Hubli ge Friday raatri'), world);
    expect(chat).toHaveBeenCalledTimes(1);
    expect(out.intent.parser).toBe('rules');
  });

  it('maps free-form sweet names to item ids', () => {
    expect(giftItemId('Mysore Pak')).toBe('mysore-pak');
    expect(giftItemId('dharwad-peda')).toBe('dharwad-peda');
    expect(giftItemId('pizza')).toBeNull();
  });

  it('live client sends sarvam-105b, reasoning off, small max_tokens, JSON mode; retries without JSON mode on 400', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const fetchImpl = vi.fn(async (_u: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      if (bodies.length === 1) return new Response('{}', { status: 400 });
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"a":1}' } }] }), { status: 200 });
    });
    const c = new LiveSarvamClient({ apiKey: 'k', fetchImpl: fetchImpl as never });
    expect(await c.chat([{ role: 'user', content: 'hi' }])).toBe('{"a":1}');
    expect(bodies[0]).toMatchObject({ model: 'sarvam-105b', reasoning_effort: null, max_tokens: 350, response_format: { type: 'json_object' } });
    expect(bodies[1]).not.toHaveProperty('response_format');
  });
});
