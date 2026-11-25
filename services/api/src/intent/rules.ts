// Rule-based trip parser: the offline fallback (and the mock "LLM"). Pure: no network, no clock.
import { readFileSync } from 'node:fs';
import type { Festival, FollowUpField, Lang, Mode, Route, TimeWindow, TripIntent } from '../../../../shared/contract/src/index.js';
import { addDays, dayOfMonth, nextWeekday, weekdayInWindow } from './dates.js';

type WordMap = Record<string, string[]>;
interface Lexicon {
  weekdays: WordMap; relativeDays: WordMap; festivals: WordMap; windows: WordMap; modes: WordMap;
  people: WordMap; quantities: WordMap; kg: string[]; dayOfMonth: WordMap; items: WordMap; boardingPoints: WordMap;
}
export const LEXICON = JSON.parse(readFileSync(new URL('./lexicon.json', import.meta.url), 'utf8')) as Lexicon;

export interface ParseInput { text: string; language: Lang; refDate: string; travellerId: string; id: string; context?: TripIntent | null }
export interface ParseWorld { routes: Route[]; festivals: Festival[] }

/** Word variants: the word, plus its stem when it ends in a combining vowel sign (ಮಂಗಳೂರು -> ಮಂಗಳೂರ, for ಮಂಗಳೂರಿಗೆ). */
function variants(word: string): string[] {
  const w = word.toLowerCase();
  return w.length >= 4 && /\p{M}$/u.test(w) ? [w, w.replace(/\p{M}$/u, '')] : [w];
}

/** Earliest position of any word of the map in the text: returns [key, pos, length] or null. Longer words win ties. */
export function findKey(text: string, map: WordMap): { key: string; pos: number; len: number } | null {
  let best: { key: string; pos: number; len: number } | null = null;
  for (const [key, words] of Object.entries(map)) {
    for (const word of words) {
      for (const v of variants(word)) {
        const pos = text.indexOf(v);
        if (pos < 0) continue;
        if (!best || pos < best.pos || (pos === best.pos && v.length > best.len)) best = { key, pos, len: v.length };
      }
    }
  }
  return best;
}

/** Longest matching word wins (used for people counts, where "ಒಬ್ಬ" and longer phrases can overlap). */
function findLongest(text: string, map: WordMap): string | null {
  let best: { key: string; len: number } | null = null;
  for (const [key, words] of Object.entries(map)) {
    for (const v of words.flatMap(variants)) if (text.includes(v) && (!best || v.length > best.len)) best = { key, len: v.length };
  }
  return best?.key ?? null;
}

function findRoute(text: string, routes: Route[]): Route | null {
  const map: WordMap = Object.fromEntries(routes.map((r) => [r.id, [r.to, r.toLocal, ...r.aliases]]));
  const hit = findKey(text, map);
  return hit ? routes.find((r) => r.id === hit.key) ?? null : null;
}

function findDate(text: string, refDate: string, festival: Festival | null): string | null {
  const rel = findKey(text, LEXICON.relativeDays);
  if (rel) return addDays(refDate, Number(rel.key));
  const dom = findKey(text, LEXICON.dayOfMonth) ?? digitDay(text);
  if (dom) return dayOfMonth(refDate, Number(dom.key));
  const wd = findKey(text, LEXICON.weekdays);
  if (!wd) return null;
  const n = Number(wd.key);
  const win = festival?.travelWindow;
  return (win && weekdayInWindow(win.from, win.to, n)) || nextWeekday(refDate, n);
}

function digitDay(text: string): { key: string } | null {
  const m = text.match(/\b([1-3]?\d)\s*(st|nd|rd|th)?\s*(jan|january)\b/) ?? text.match(/\b([1-3]?\d)(st|nd|rd|th)\b/);
  return m && Number(m[1]) >= 1 && Number(m[1]) <= 31 ? { key: m[1] } : null;
}

function findPeople(text: string): number | null {
  const word = findLongest(text, LEXICON.people);
  if (word) return Number(word);
  const m = text.match(/\b([1-9])\s*(people|persons|of us|jana|log|tickets|seats)\b/);
  return m ? Number(m[1]) : null;
}

function findGift(text: string): TripIntent['gift'] {
  const item = findKey(text, LEXICON.items);
  if (!item) return null;
  const kgWords = LEXICON.kg.map((k) => k.toLowerCase());
  let qty = 1;
  for (const k of kgWords) {
    const at = text.indexOf(k);
    if (at < 0) continue;
    const before = text.slice(Math.max(0, at - 14), at);
    const digit = before.match(/(\d+(?:\.\d+)?)\s*$/);
    const word = findLongest(before, LEXICON.quantities);
    qty = digit ? Number(digit[1]) : word ? Number(word) : 1;
    break;
  }
  return { itemId: item.key, qty };
}

function followUps(i: Pick<TripIntent, 'to' | 'dateFrom'>): FollowUpField[] {
  const out: FollowUpField[] = [];
  if (!i.to) out.push('to');
  if (!i.dateFrom) out.push('date');
  return out;
}

/** Merges a follow-up answer into the previous intent: new non-empty fields win. */
function merge(prev: TripIntent | null | undefined, next: TripIntent, found: Set<string>): TripIntent {
  if (!prev) return next;
  const pick = <K extends keyof TripIntent>(k: K): TripIntent[K] => (found.has(k) ? next[k] : prev[k]);
  const merged: TripIntent = {
    ...next, to: pick('to'), routeId: pick('routeId'), dateFrom: pick('dateFrom'), dateTo: pick('dateTo'),
    timeWindow: pick('timeWindow'), mode: pick('mode'), people: pick('people'), boardingPoint: pick('boardingPoint'),
    festivalId: pick('festivalId'), gift: pick('gift'),
  };
  return { ...merged, needsFollowUp: followUps(merged) };
}

export function parseRules(input: ParseInput, world: ParseWorld): TripIntent {
  const text = input.text.toLowerCase();
  const festHit = findKey(text, LEXICON.festivals);
  const festival = festHit ? world.festivals.find((f) => f.id === festHit.key) ?? null : null;
  const route = findRoute(text, world.routes);
  const date = findDate(text, input.refDate, festival);
  const people = findPeople(text);
  const mode = (findKey(text, LEXICON.modes)?.key ?? null) as Mode | null;
  const windowHit = findKey(text, LEXICON.windows);
  const bp = findKey(text, LEXICON.boardingPoints)?.key ?? null;
  const gift = findGift(text);
  const found = new Set<string>();
  const mark = (k: string, v: unknown) => { if (v !== null && v !== undefined) found.add(k); };
  mark('to', route); mark('routeId', route); mark('dateFrom', date); mark('dateTo', date); mark('people', people);
  mark('mode', mode); mark('timeWindow', windowHit); mark('boardingPoint', bp); mark('festivalId', festival); mark('gift', gift);
  const score = [route, date, mode, windowHit, people].filter(Boolean).length;
  const intent: TripIntent = {
    id: input.id, travellerId: input.travellerId, from: 'Bengaluru', to: route?.to ?? null, routeId: route?.id ?? null,
    dateFrom: date, dateTo: date, timeWindow: (windowHit?.key ?? 'any') as TimeWindow, mode, people: people ?? 1,
    boardingPoint: bp, festivalId: festival?.id ?? null, gift, needsFollowUp: [], language: input.language,
    transcript: input.text, confidence: Math.round((0.3 + score * 0.12) * 100) / 100, parser: 'rules',
  };
  intent.needsFollowUp = followUps(intent);
  return merge(input.context, intent, found);
}
