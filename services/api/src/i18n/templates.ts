// Per-language templates. Kannada checked by Ankith on the day; other languages are best effort (label them).
import type { Lang } from '../../../../shared/contract/src/index.js';

export const LANGS: Lang[] = ['kn-IN', 'ta-IN', 'te-IN', 'hi-IN', 'od-IN', 'bn-IN', 'en-IN'];

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Thu 14 Jan" */
export function dateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS_EN[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_EN[d.getUTCMonth()]}`;
}

/** "14 Jan" */
export function shortDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS_EN[d.getUTCMonth()]}`;
}

export interface NewServiceVars { operator: string; count: number; to: string; toLocal: string; date: string; time: string; point: string; pointLocal: string }

const MONTH_LOCAL: Record<Lang, string> = {
  'kn-IN': 'ಜನವರಿ', 'ta-IN': 'ஜனவரி', 'te-IN': 'జనవరి', 'hi-IN': 'जनवरी', 'od-IN': 'ଜାନୁଆରୀ', 'bn-IN': 'জানুয়ারি', 'en-IN': 'Jan',
};

function dayNum(date: string): number {
  return Number(date.slice(8, 10));
}

export function newServiceText(lang: Lang, v: NewServiceVars): string {
  const day = `${MONTH_LOCAL[lang]} ${dayNum(v.date)}`;
  switch (lang) {
    case 'kn-IN': return `${v.operator}: ${v.toLocal}ಗೆ ${v.count} ಹೊಸ ಬಸ್ ಸೇರಿಸಿದೆ. ${day}, ರಾತ್ರಿ ${v.time}, ${v.pointLocal}ನಿಂದ.`;
    case 'ta-IN': return `${v.operator}: ${v.toLocal}க்கு ${v.count} புதிய பஸ்கள். ${day}, ${v.time}, ${v.point}.`;
    case 'te-IN': return `${v.operator}: ${v.toLocal}కి ${v.count} కొత్త బస్సులు. ${day}, ${v.time}, ${v.point}.`;
    case 'hi-IN': return `${v.operator}: ${v.toLocal} के लिए ${v.count} नई बसें। ${day}, ${v.time}, ${v.point} से।`;
    case 'od-IN': return `${v.operator}: ${v.toLocal} ପାଇଁ ${v.count}ଟି ନୂଆ ବସ୍। ${day}, ${v.time}, ${v.point}।`;
    case 'bn-IN': return `${v.operator}: ${v.toLocal} যাওয়ার ${v.count}টি নতুন বাস। ${day}, ${v.time}, ${v.point} থেকে।`;
    default: return `${v.operator} added ${v.count} buses BLR -> ${v.to}, ${shortDate(v.date)} ${v.time} from ${v.point}`;
  }
}

export function allNewServiceTexts(v: NewServiceVars): Partial<Record<Lang, string>> {
  const out: Partial<Record<Lang, string>> = {};
  for (const l of LANGS) out[l] = newServiceText(l, v);
  return out;
}

export function rushNightText(date: string): { text: string; textLocal: Partial<Record<Lang, string>> } {
  const d = dayNum(date);
  return {
    text: `${shortDate(date)} is a rush night. Book early; fares on private buses often go up a lot.`,
    textLocal: {
      'kn-IN': `${MONTH_LOCAL['kn-IN']} ${d} ಭಾರೀ ರಶ್ ರಾತ್ರಿ. ಬೇಗ ಬುಕ್ ಮಾಡಿ; ಖಾಸಗಿ ಬಸ್ ದರ ತುಂಬಾ ಏರಬಹುದು.`,
      'ta-IN': `${MONTH_LOCAL['ta-IN']} ${d} கூட்டம் அதிகமான இரவு. சீக்கிரம் பதிவு செய்யுங்கள்.`,
      'te-IN': `${MONTH_LOCAL['te-IN']} ${d} రద్దీ రాత్రి. ముందుగానే బుక్ చేయండి.`,
      'hi-IN': `${d} ${MONTH_LOCAL['hi-IN']} भीड़ वाली रात है। जल्दी बुक करें।`,
      'od-IN': `${MONTH_LOCAL['od-IN']} ${d} ଭିଡ଼ ରାତି। ଶୀଘ୍ର ବୁକ୍ କରନ୍ତୁ।`,
      'bn-IN': `${d} ${MONTH_LOCAL['bn-IN']} ভিড়ের রাত। তাড়াতাড়ি বুক করুন।`,
    },
  };
}
