// Offline parser for the app's mock mode (no api). Sample sentences from seed/utterances.json return their known
// answer; other text gets a small rule match (town aliases, weekday, festival, night, bus/train, people).
// The real parser lives in services/api/src/intent/rules.ts.
import type { Lang, Mode, TimeWindow, TripIntent } from '@contract';
import routesJson from '../../../../seed/routes.json';
import festivalsJson from '../../../../seed/festivals.json';
import utterJson from '../../../../seed/utterances.json';

interface U { id: string; language: Lang; text: string; roman?: string; english?: string; expect: Partial<TripIntent> }
export const UTTERANCES = (utterJson as unknown as { utterances: U[] }).utterances;
const ROUTES = routesJson.routes;
const FESTIVALS = festivalsJson.festivals as Array<{ id: string; travelWindow?: { from: string; to: string } }>;

const WEEKDAYS: Array<[number, string[]]> = [
  [0, ['sunday', 'ಭಾನುವಾರ']], [1, ['monday', 'ಸೋಮವಾರ']], [2, ['tuesday', 'ಮಂಗಳವಾರ']], [3, ['wednesday', 'ಬುಧವಾರ', 'புதன்', 'बुधवार']],
  [4, ['thursday', 'guruvaara', 'ಗುರುವಾರ', 'வியாழன்', 'గురువార', 'गुरुवार']], [5, ['friday', 'shukravaara', 'ಶುಕ್ರವಾರ', 'வெள்ளி', 'శుక్రవార', 'शुक्रवार']], [6, ['saturday', 'ಶನಿವಾರ']],
];
const PEOPLE: Array<[number, string[]]> = [
  [1, ['alone', 'just me', 'ಒಬ್ಬ', 'obbane', 'एक']], [2, ['two', 'ibru', 'ಇಬ್ರು', 'ಇಬ್ಬರು', 'ரெண்டு', 'दो']], [3, ['three', 'ಮೂವರು', 'तीन']],
  [4, ['four', 'naalku', 'ನಾಲ್ಕು', 'నలుగుర', 'चार']], [5, ['five']], [6, ['six']],
];

function addDays(d: string, n: number): string {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
const wd = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();

function findDate(text: string, refDate: string, festivalId: string | null): string | null {
  if (/\b(tonight|today)\b/.test(text)) return refDate;
  if (/\btomorrow\b|naale|ನಾಳೆ/.test(text)) return addDays(refDate, 1);
  const day = WEEKDAYS.find(([, ws]) => ws.some((w) => text.includes(w)))?.[0];
  if (day === undefined) return null;
  const win = FESTIVALS.find((f) => f.id === festivalId)?.travelWindow;
  if (win) for (let d = win.from; d <= win.to; d = addDays(d, 1)) if (wd(d) === day) return d;
  const diff = (day - wd(refDate) + 7) % 7 || 7;
  return addDays(refDate, diff);
}

function base(text: string, language: Lang, id: string): TripIntent {
  return {
    id, travellerId: 'trav-demo', from: 'Bengaluru', to: null, routeId: null, dateFrom: null, dateTo: null, timeWindow: 'any', mode: null,
    people: 1, boardingPoint: null, festivalId: null, gift: null, needsFollowUp: [], language, transcript: text, confidence: 0.6, parser: 'rules',
  };
}

export function miniParse(text: string, language: Lang, refDate = '2027-01-05', context: TripIntent | null = null, id = `int-${Date.now()}`): TripIntent {
  const sample = UTTERANCES.find((u) => u.text === text.trim() || u.roman === text.trim());
  let out = base(text, language, id);
  if (sample) {
    out = { ...out, ...sample.expect, dateTo: (sample.expect.dateFrom as string | undefined) ?? null, confidence: 0.9 } as TripIntent;
    if (!sample.expect.timeWindow) out.timeWindow = 'any';
  } else {
    const t = text.toLowerCase();
    const route = ROUTES.find((r) => [r.to, r.toLocal, ...r.aliases].some((a) => t.includes(a.toLowerCase().replace(/\p{M}$/u, ''))));
    const festivalId = /pongal|பொங்கல/.test(t) ? 'pongal-2027' : /sankrant|ಸಂಕ್ರಾಂತಿ|संक्रांति/.test(t) ? 'sankranti-2027' : null;
    const date = findDate(t, refDate, festivalId);
    const mode: Mode | null = /train|rail|ಟ್ರೈನ್|ರೈಲು|ट्रेन/.test(t) ? 'train' : /bus|bass|ಬಸ್|பஸ்|बस/.test(t) ? 'bus' : /flight|plane/.test(t) ? 'air' : null;
    const window: TimeWindow = /night|raatri|ರಾತ್ರಿ|ராத்திரி|रात/.test(t) ? 'night' : /morning|ಬೆಳಿಗ್ಗೆ/.test(t) ? 'morning' : /evening|ಸಂಜೆ/.test(t) ? 'evening' : 'any';
    const people = PEOPLE.find(([, ws]) => ws.some((w) => t.includes(w)))?.[0] ?? Number(t.match(/\b([1-9])\s*(people|of us|jana)\b/)?.[1] ?? 1);
    out = { ...out, to: route?.to ?? null, routeId: route?.id ?? null, dateFrom: date, dateTo: date, mode, timeWindow: window, people, festivalId };
  }
  if (context) {
    out = {
      ...out, to: out.to ?? context.to, routeId: out.routeId ?? context.routeId, dateFrom: out.dateFrom ?? context.dateFrom,
      dateTo: out.dateTo ?? context.dateTo, mode: out.mode ?? context.mode, festivalId: out.festivalId ?? context.festivalId,
      timeWindow: out.timeWindow !== 'any' ? out.timeWindow : context.timeWindow, people: out.people !== 1 ? out.people : context.people,
    };
  }
  out.needsFollowUp = [...(out.to ? [] : ['to' as const]), ...(out.dateFrom ? [] : ['date' as const])];
  return out;
}
