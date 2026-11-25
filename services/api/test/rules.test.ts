import { describe, it, expect } from 'vitest';
import { loadSeed } from '../src/seed.js';
import { parseRules } from '../src/intent/rules.js';

const seed = loadSeed();
const world = { routes: seed.routes, festivals: seed.festivals };

describe('rule parser vs seed/utterances.json', () => {
  for (const u of seed.utterances) {
    it(`${u.id}: ${u.english ?? u.text}`, () => {
      const intent = parseRules({ text: u.text, language: u.language, refDate: '2027-01-05', travellerId: 't', id: 'i' }, world);
      for (const [k, v] of Object.entries(u.expect)) {
        expect((intent as unknown as Record<string, unknown>)[k], k).toEqual(v);
      }
      expect(intent.parser).toBe('rules');
    });
  }

  it('Roman lines parse too', () => {
    const hero = seed.utterances.find((u) => u.id === 'u-kn-01')!;
    const intent = parseRules({ text: hero.roman!, language: 'kn-IN', refDate: '2027-01-05', travellerId: 't', id: 'i' }, world);
    expect(intent).toMatchObject({ routeId: 'BLR-HBL', dateFrom: '2027-01-14', timeWindow: 'night', mode: 'bus', people: 2 });
  });

  it('a follow-up answer fills only the missing fields', () => {
    const first = parseRules({ text: 'ಊರಿಗೆ ಹೋಗ್ಬೇಕು', language: 'kn-IN', refDate: '2027-01-05', travellerId: 't', id: 'i' }, world);
    expect(first.needsFollowUp).toEqual(['to', 'date']);
    const second = parseRules({ text: 'Hubli, guruvaara raatri, ibru', language: 'kn-IN', refDate: '2027-01-05', travellerId: 't', id: 'i2', context: first }, world);
    expect(second).toMatchObject({ routeId: 'BLR-HBL', dateFrom: '2027-01-07', people: 2, needsFollowUp: [] });
  });
});
