// LLM intent parsing with sarvam-105b: JSON-only prompt, ajv validation, one retry with the error, then rules.
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { TripIntent } from '../../../../shared/contract/src/index.js';
import type { ChatMessage } from '../sarvam/client.js';
import { parseRules, type ParseInput, type ParseWorld } from './rules.js';

/** The part of the intent the LLM fills. */
export interface LlmFields {
  to: string | null; routeId: string | null; dateFrom: string | null; dateTo: string | null;
  timeWindow: TripIntent['timeWindow']; mode: TripIntent['mode']; people: number;
  boardingPoint: string | null; festivalId: string | null; gift: TripIntent['gift'];
}

const nullable = (t: object) => ({ anyOf: [t, { type: 'null' }] });
export const LLM_SCHEMA = {
  type: 'object',
  required: ['to', 'routeId', 'dateFrom', 'timeWindow', 'mode', 'people'],
  properties: {
    to: nullable({ type: 'string' }), routeId: nullable({ type: 'string' }),
    dateFrom: nullable({ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), dateTo: nullable({ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
    timeWindow: { enum: ['morning', 'afternoon', 'evening', 'night', 'any'] }, mode: nullable({ enum: ['bus', 'train', 'air'] }),
    people: { type: 'integer', minimum: 1, maximum: 20 }, boardingPoint: nullable({ type: 'string' }), festivalId: nullable({ type: 'string' }),
    gift: nullable({ type: 'object', required: ['itemId', 'qty'], properties: { itemId: { type: 'string' }, qty: { type: 'number' } } }),
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile<LlmFields>(LLM_SCHEMA);

export function systemPrompt(world: ParseWorld, refDate: string): string {
  const routes = world.routes.map((r) => ({ id: r.id, to: r.to, aliases: r.aliases }));
  const fests = world.festivals.map((f) => ({ id: f.id, name: f.name, date: f.date, travelWindow: f.travelWindow }));
  return [
    'You turn a traveller\'s sentence (any Indian language, code-mixed allowed) into JSON for a trip FROM Bengaluru.',
    `Today is ${refDate}. Weekdays mean the next such day; with a festival word, the weekday inside that festival's travelWindow.`,
    `Routes (use routeId and the canonical "to"; null if none matches): ${JSON.stringify(routes)}`,
    `Festivals: ${JSON.stringify(fests)}`,
    'Boarding point ids: MAJESTIC, SATELLITE, SHANTINAGAR, KR_PURAM, ELECTRONIC_CITY, KSR, SMVT, KIA. Gift itemIds: mysore-pak, dharwad-peda, ellu-bella, sakkare-acchu, gift-box-s.',
    `Reply with ONLY one JSON object matching this JSON Schema, no prose: ${JSON.stringify(LLM_SCHEMA)}`,
    'Unknown fields are null; people defaults to 1; timeWindow defaults to "any".',
  ].join('\n');
}

export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object');
  return JSON.parse(text.slice(start, end + 1));
}

function toIntent(f: LlmFields, input: ParseInput, world: ParseWorld): TripIntent {
  const route = world.routes.find((r) => r.id === f.routeId) ?? null;
  const base = parseRules({ ...input, text: '' }, world);
  const intent: TripIntent = {
    ...base, to: route?.to ?? null, routeId: route?.id ?? null, dateFrom: f.dateFrom, dateTo: f.dateTo ?? f.dateFrom,
    timeWindow: f.timeWindow, mode: f.mode, people: f.people, boardingPoint: f.boardingPoint ?? null,
    festivalId: f.festivalId ?? null, gift: f.gift ?? null, transcript: input.text, confidence: 0.86, parser: 'llm',
  };
  intent.needsFollowUp = [...(intent.to ? [] : ['to' as const]), ...(intent.dateFrom ? [] : ['date' as const])];
  return intent;
}

/** chat() is the Sarvam chat call (live or mock). Never throws: falls back to the rule parser. */
export async function parseWithLlm(
  chat: (m: ChatMessage[]) => Promise<string>, input: ParseInput, world: ParseWorld,
): Promise<{ intent: TripIntent; usedLlm: boolean }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt(world, input.refDate) },
    { role: 'user', content: input.text },
  ];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await chat(messages);
      const data = extractJson(raw);
      if (validate(data)) return { intent: toIntent(data, input, world), usedLlm: true };
      messages.push({ role: 'assistant', content: raw }, { role: 'user', content: `Invalid: ${ajv.errorsText(validate.errors)}. Reply with corrected JSON only.` });
    } catch {
      if (attempt === 1) break;
      messages.push({ role: 'user', content: 'Reply with one JSON object only.' });
    }
  }
  return { intent: parseRules(input, world), usedLlm: false };
}

/** Mock chat: answers like the LLM would, using the rule parser on the last user line. */
export function mockChat(world: ParseWorld, refDate: string): (m: ChatMessage[]) => string {
  return (messages) => {
    const text = [...messages].reverse().find((m) => m.role === 'user' && !m.content.startsWith('Invalid') && !m.content.startsWith('Reply'))?.content ?? '';
    const i = parseRules({ text, language: 'en-IN', refDate, travellerId: 'mock', id: 'mock' }, world);
    const fields: LlmFields = { to: i.to, routeId: i.routeId, dateFrom: i.dateFrom, dateTo: i.dateTo, timeWindow: i.timeWindow, mode: i.mode, people: i.people, boardingPoint: i.boardingPoint, festivalId: i.festivalId, gift: i.gift };
    return JSON.stringify(fields);
  };
}
