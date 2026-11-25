// Pure: WhatsApp share link for a trip (summary in the traveller's language + app link).
import type { Lang, TripIntent } from '@contract';
import { dateLabel } from './format';

export const APP_URL = 'https://prasthan-ten.vercel.app';

const LEAD: Partial<Record<Lang, string>> = {
  'kn-IN': 'ನನ್ನ ಹಬ್ಬದ ಊರ ಪ್ರಯಾಣ', 'ta-IN': 'என் பண்டிகை ஊர் பயணம்', 'te-IN': 'నా పండుగ ఊరి ప్రయాణం',
  'hi-IN': 'मेरी त्योहार की घर यात्रा', 'od-IN': 'ମୋ ପର୍ବ ଘର ଯାତ୍ରା', 'bn-IN': 'আমার উৎসবের বাড়ি ফেরা',
};
const VIA: Partial<Record<Lang, string>> = { 'kn-IN': 'ಪ್ರಸ್ಥಾನ ಆ್ಯಪ್', 'hi-IN': 'प्रस्थान ऐप' };

export function tripSummary(intent: TripIntent, reply: string | null, lang: Lang): string {
  const lead = LEAD[lang] ?? 'My festival trip home';
  const when = intent.dateFrom ? dateLabel(intent.dateFrom, lang) : '';
  const line = [intent.to, when, intent.timeWindow === 'night' ? (lang === 'kn-IN' ? 'ರಾತ್ರಿ' : 'night') : '', intent.mode ?? ''].filter(Boolean).join(', ');
  return [`${lead}: ${line}`, reply ?? '', `${VIA[lang] ?? 'Prasthan'}: ${APP_URL}`].filter(Boolean).join('\n');
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
