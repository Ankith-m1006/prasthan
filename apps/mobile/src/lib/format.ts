// Pure formatters (tested): date labels in English + local scripts, trip summary, reply text for mock mode.
import type { Lang, TripIntent } from '@contract';

const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD_LOCAL: Partial<Record<Lang, string[]>> = {
  'kn-IN': ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'],
  'ta-IN': ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
  'hi-IN': ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
};
const MON_LOCAL: Partial<Record<Lang, string>> = { 'kn-IN': 'ಜನವರಿ', 'ta-IN': 'ஜனவரி', 'hi-IN': 'जनवरी' };

function parts(date: string): { wd: number; day: number; mon: number } {
  const d = new Date(`${date}T00:00:00Z`);
  return { wd: d.getUTCDay(), day: d.getUTCDate(), mon: d.getUTCMonth() };
}

/** "Thu 14 Jan" (en) or "ಗುರು 14 ಜನವರಿ" (kn). Unknown languages fall back to English. */
export function dateLabel(date: string, lang: Lang = 'en-IN'): string {
  const { wd, day, mon } = parts(date);
  const w = WD_LOCAL[lang];
  if (w && mon === 0) return `${w[wd]} ${day} ${MON_LOCAL[lang]}`;
  return `${WD_EN[wd]} ${day} ${MON_EN[mon]}`;
}

export const WINDOW_LABEL: Record<string, string> = { night: 'Night', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', any: 'Any time' };

export function peopleLabel(n: number): string {
  return n === 1 ? '1 person' : `${n} people`;
}

const KN_DAYS = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'];

/** Mock-mode spoken reply (the api has the full 7-language templates). */
export function mockReply(i: TripIntent, toLocal: string | null): string {
  const kn = i.language === 'kn-IN';
  if (i.needsFollowUp.includes('to')) return kn ? 'ಯಾವ ಊರಿಗೆ ಹೋಗಬೇಕು? ಯಾವ ದಿನ?' : 'Which town are you going to? Which day?';
  if (i.needsFollowUp.includes('date')) return kn ? 'ಯಾವ ದಿನ?' : 'Which day?';
  const day = i.dateFrom ? parts(i.dateFrom).wd : 0;
  if (kn) {
    const who = i.people === 1 ? 'ಒಬ್ಬರಿಗೆ' : i.people === 2 ? 'ಇಬ್ಬರಿಗೆ' : `${i.people} ಜನರಿಗೆ`;
    const mode = i.mode === 'train' ? 'ರೈಲು' : i.mode === 'bus' ? 'ಬಸ್' : '';
    const when = `${KN_DAYS[day]}${i.timeWindow === 'night' ? ' ರಾತ್ರಿ' : ''}`;
    return `ಸರಿ, ${when} ${toLocal ?? i.to}ಗೆ ${who} ${mode}. ಇಲ್ಲಿವೆ ಆಯ್ಕೆಗಳು.`.replace(/\s+/g, ' ').replace(' .', '.');
  }
  const when = `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}${i.timeWindow === 'night' ? ' night' : ''}`;
  return `Okay, ${i.to} on ${when}, ${i.people === 1 ? 'for one person' : `for ${i.people} people`}${i.mode ? ` by ${i.mode}` : ''}. Here are your options.`;
}
