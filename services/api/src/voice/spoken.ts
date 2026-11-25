// Turns reply/alert text into something a person would say: no arrows, route ids, "Rs", slashes or symbols.
import type { Lang } from '../../../../shared/contract/src/index.js';

const RUPEES: Record<Lang, string> = { 'kn-IN': 'ರೂಪಾಯಿ', 'ta-IN': 'ரூபாய்', 'te-IN': 'రూపాయలు', 'hi-IN': 'रुपये', 'od-IN': 'ଟଙ୍କା', 'bn-IN': 'টাকা', 'en-IN': 'rupees' };

export function toSpoken(text: string, lang: Lang): string {
  const rs = RUPEES[lang] ?? 'rupees';
  return text
    .replace(/\b[A-Z]{3}-[A-Z]{3}\b/g, '') // route ids like BLR-HBL
    .replace(/(?:Rs\.?|INR|₹)\s?([\d,]+)/g, (_m, n: string) => `${n.replace(/,/g, '')} ${rs}`)
    .replace(/([\d,]+)\s?(?:Rs\.?|INR|₹)/g, (_m, n: string) => `${n.replace(/,/g, '')} ${rs}`)
    .replace(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g, lang === 'en-IN' ? '$1 to $2' : '$1, $2')
    .replace(/\s*(?:->|→|=>|»)\s*/g, ', ')
    .replace(/[|•*#_~^<>[\]{}]/g, ' ')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\s+([,.!?।])/g, '$1')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.:;]+/, '')
    .trim();
}
