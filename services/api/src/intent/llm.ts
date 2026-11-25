// LLM intent parsing with Sarvam's chat model (sarvam-105b, reasoning off): strict JSON prompt, ajv validation,
// one corrective retry on invalid output, an overall deadline, then the rule parser. Never throws.
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { TravellingWith, TripIntent } from '../../../../shared/contract/src/index.js';
import type { ChatMessage } from '../sarvam/client.js';
import { findKey, LEXICON, parseRules, type ParseInput, type ParseWorld } from './rules.js';

/** What the LLM fills. gift.item may be a known itemId or a free-form sweet name (mapped to an itemId). */
export interface LlmFields {
  from: string | null; to: string | null; routeId: string | null; dateFrom: string | null; dateTo: string | null;
  timeWindow: TripIntent['timeWindow']; mode: TripIntent['mode']; people: number; travellingWith: TravellingWith | null;
  boardingPoint: string | null; festivalId: string | null; gift: { item: string; qty: number; unit: string | null } | null;
}

const nullable = (t: object) => ({ anyOf: [t, { type: 'null' }] });
const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
export const LLM_SCHEMA = {
  type: 'object',
  required: ['to', 'routeId', 'dateFrom', 'timeWindow', 'mode', 'people'],
  properties: {
    from: nullable({ type: 'string' }), to: nullable({ type: 'string' }), routeId: nullable({ type: 'string' }),
    dateFrom: nullable(DATE), dateTo: nullable(DATE),
    timeWindow: { enum: ['morning', 'afternoon', 'evening', 'night', 'any'] }, mode: nullable({ enum: ['bus', 'train', 'air'] }),
    people: { type: 'integer', minimum: 1, maximum: 20 },
    travellingWith: nullable({ enum: ['alone', 'family', 'elders', 'kids', 'friends', 'partner'] }),
    boardingPoint: nullable({ type: 'string' }), festivalId: nullable({ type: 'string' }),
    gift: nullable({ type: 'object', required: ['item', 'qty'], properties: { item: { type: 'string' }, qty: { type: 'number', exclusiveMinimum: 0 }, unit: nullable({ type: 'string' }) } }),
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile<LlmFields>(LLM_SCHEMA);
const GIFT_IDS = Object.keys(LEXICON.items);
const BOARDING_IDS = Object.keys(LEXICON.boardingPoints);
export const LLM_DEADLINE_MS = 15000;

export function systemPrompt(world: ParseWorld, refDate: string): string {
  const routes = world.routes.map((r) => `${r.id}=${r.to}`).join(', ');
  const fests = world.festivals.map((f) => `${f.id} (${f.name}, ${f.date}${f.travelWindow ? `, travel ${f.travelWindow.from}..${f.travelWindow.to}` : ''})`).join('; ');
  return [
    'Extract a festival trip home from one sentence (Kannada, Hindi, Tamil, Telugu, English or code-mixed, any script). Trips start in Bengaluru.',
    `Calendar (today first): ${calendar(refDate)}.`,
    `Today is ${refDate}. A weekday means the next such day; with a festival, the weekday inside its travel window. A range ("Friday or Saturday") -> dateFrom..dateTo.`,
    `routeId must be one of: ${routes}; null if none. "to" = that route's town.`,
    `festivalId one of: ${fests}; else null.`,
    `boardingPoint one of ${BOARDING_IDS.join(', ')} or null. timeWindow: raatri/raat/night->night, beligge/subah->morning, sanje/shaam->evening.`,
    `travellingWith: ajji/ajja/amma/appa/dadi/nani/parents->elders, family/maneyavaru->family, makkalu/bacche/kids->kids, friends->friends, wife/husband->partner, alone->alone, else null.`,
    `gift: a sweet or gift to pre-order; item = one of ${GIFT_IDS.join(', ')} if it matches, qty number, unit (kg, box, piece) or null. No gift -> null.`,
    'people: count of travellers incl. the speaker (default 1; "with ajji" = 2).',
    `Reply with ONLY one minified JSON object matching this JSON Schema, no prose, no markdown: ${JSON.stringify(LLM_SCHEMA)}`,
  ].join('\n');
}

export function extractJson(text: string): unknown {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object');
  return JSON.parse(clean.slice(start, end + 1));
}

/** Maps the LLM's gift item (id or free name) to a known itemId, or null. */
export function giftItemId(item: string): string | null {
  const s = item.toLowerCase().trim();
  if (GIFT_IDS.includes(s)) return s;
  return findKey(s, LEXICON.items)?.key ?? findKey(s.replace(/-/g, ' '), LEXICON.items)?.key ?? null;
}

function toIntent(f: LlmFields, input: ParseInput, world: ParseWorld): TripIntent {
  const route = world.routes.find((r) => r.id === f.routeId) ?? null;
  const base = parseRules({ ...input, text: '' }, world);
  const itemId = f.gift ? giftItemId(f.gift.item) : null;
  const gift = f.gift && itemId ? { itemId, qty: f.gift.qty, ...(f.gift.unit ? { unit: f.gift.unit } : {}) } : null;
  const intent: TripIntent = {
    ...base, from: f.from && f.from.trim() ? f.from : base.from, to: route?.to ?? null, routeId: route?.id ?? null,
    ...pickDates(f, parseRules({ ...input, context: null }, world).dateFrom), timeWindow: f.timeWindow, mode: f.mode, people: f.people,
    boardingPoint: f.boardingPoint && BOARDING_IDS.includes(f.boardingPoint) ? f.boardingPoint : null,
    festivalId: world.festivals.some((x) => x.id === f.festivalId) ? f.festivalId : null,
    gift, travellingWith: f.travellingWith ?? null, transcript: input.text, confidence: 0.86, parser: 'sarvam-llm',
  };
  intent.needsFollowUp = [...(intent.to ? [] : ['to' as const]), ...(intent.dateFrom ? [] : ['date' as const])];
  return intent;
}

const DAY = 86_400_000;
/** LLMs slip on weekday arithmetic: the rules' date (deterministic weekday/festival-window logic) wins when it found one.
 *  An LLM range of up to 3 days that starts on that date is kept ("Friday or Saturday"). */
export function pickDates(f: Pick<LlmFields, 'dateFrom' | 'dateTo'>, rulesDate: string | null): { dateFrom: string | null; dateTo: string | null } {
  const to = f.dateTo ?? f.dateFrom;
  if (!rulesDate) return { dateFrom: f.dateFrom, dateTo: to };
  const span = f.dateFrom && to ? (Date.parse(to) - Date.parse(f.dateFrom)) / DAY : 0;
  return f.dateFrom === rulesDate && span > 0 && span <= 3 ? { dateFrom: rulesDate, dateTo: to } : { dateFrom: rulesDate, dateTo: rulesDate };
}

/** Next 14 days with weekday names, so the model does not compute weekdays itself. */
export function calendar(refDate: string): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.parse(`${refDate}T00:00:00Z`) + i * DAY);
    return `${names[d.getUTCDay()]} ${d.toISOString().slice(0, 10)}`;
  }).join(', ');
}

function withDeadline<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('llm deadline')), ms); });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function tryLlm(chat: (m: ChatMessage[]) => Promise<string>, input: ParseInput, world: ParseWorld): Promise<TripIntent | null> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt(world, input.refDate) },
    { role: 'user', content: input.text },
  ];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await chat(messages); // network errors/timeouts are retried inside the client; they end the LLM path here
    let data: unknown;
    try { data = extractJson(raw); } catch {
      messages.push({ role: 'assistant', content: raw.slice(0, 400) }, { role: 'user', content: 'Reply with one JSON object only.' });
      continue;
    }
    if (validate(data)) return toIntent(data, input, world);
    messages.push({ role: 'assistant', content: raw.slice(0, 400) }, { role: 'user', content: `Invalid: ${ajv.errorsText(validate.errors)}. Reply with corrected JSON only.` });
  }
  return null;
}

/** chat() is the Sarvam chat call (live or mock). Never throws: falls back to the rule parser. Follow-up context is merged. */
export async function parseWithLlm(
  chat: (m: ChatMessage[]) => Promise<string>, input: ParseInput, world: ParseWorld, deadlineMs = LLM_DEADLINE_MS,
): Promise<{ intent: TripIntent; usedLlm: boolean }> {
  try {
    const intent = await withDeadline(tryLlm(chat, input, world), deadlineMs);
    if (intent) return { intent: mergeContext(input.context, intent), usedLlm: true };
  } catch { /* timeout / network / bad response: rules below */ }
  return { intent: parseRules(input, world), usedLlm: false };
}

/** Follow-up answers ("Saturday") only fill what the LLM left empty from the previous turn. */
function mergeContext(prev: TripIntent | null | undefined, next: TripIntent): TripIntent {
  if (!prev) return next;
  const keep = <K extends keyof TripIntent>(k: K): TripIntent[K] => (next[k] === null || next[k] === undefined ? prev[k] : next[k]);
  const merged: TripIntent = {
    ...next, to: keep('to'), routeId: keep('routeId'), dateFrom: keep('dateFrom'), dateTo: keep('dateTo'), mode: keep('mode'),
    boardingPoint: keep('boardingPoint'), festivalId: keep('festivalId'), gift: keep('gift'), travellingWith: keep('travellingWith'),
    timeWindow: next.timeWindow === 'any' ? prev.timeWindow : next.timeWindow, people: next.people === 1 ? prev.people : next.people,
  };
  merged.needsFollowUp = [...(merged.to ? [] : ['to' as const]), ...(merged.dateFrom ? [] : ['date' as const])];
  return merged;
}

/** Mock chat: answers like the LLM would, using the rule parser on the last user line. */
export function mockChat(world: ParseWorld, refDate: string): (m: ChatMessage[]) => string {
  return (messages) => {
    const text = [...messages].reverse().find((m) => m.role === 'user' && !m.content.startsWith('Invalid') && !m.content.startsWith('Reply'))?.content ?? '';
    const i = parseRules({ text, language: 'en-IN', refDate, travellerId: 'mock', id: 'mock' }, world);
    const fields: LlmFields = {
      from: i.from, to: i.to, routeId: i.routeId, dateFrom: i.dateFrom, dateTo: i.dateTo, timeWindow: i.timeWindow, mode: i.mode,
      people: i.people, travellingWith: null, boardingPoint: i.boardingPoint, festivalId: i.festivalId,
      gift: i.gift ? { item: i.gift.itemId, qty: i.gift.qty, unit: null } : null,
    };
    return JSON.stringify(fields);
  };
}
