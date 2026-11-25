// Spoken reply text per language (templates, no LLM: faster and safer). Kannada checked by Ankith; others best effort.
import type { Lang, Route, TripIntent } from '../../../../shared/contract/src/index.js';
import { weekdayOf } from '../intent/dates.js';

interface Words { ok: string; here: string; askTo: string; askDate: string; days: string[]; night: string; people: (n: number) => string; mode: Record<string, string> }

const W: Record<Lang, Words> = {
  'kn-IN': { ok: 'ಸರಿ', here: 'ಇಲ್ಲಿವೆ ಆಯ್ಕೆಗಳು.', askTo: 'ಯಾವ ಊರಿಗೆ ಹೋಗಬೇಕು?', askDate: 'ಯಾವ ದಿನ?', days: ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'], night: 'ರಾತ್ರಿ', people: (n) => (n === 1 ? 'ಒಬ್ಬರಿಗೆ' : n === 2 ? 'ಇಬ್ಬರಿಗೆ' : `${n} ಜನರಿಗೆ`), mode: { bus: 'ಬಸ್', train: 'ರೈಲು', air: 'ವಿಮಾನ' } },
  'ta-IN': { ok: 'சரி', here: 'இதோ வழிகள்.', askTo: 'எந்த ஊருக்கு?', askDate: 'எந்த நாள்?', days: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'], night: 'இரவு', people: (n) => `${n} பேருக்கு`, mode: { bus: 'பஸ்', train: 'ரயில்', air: 'விமானம்' } },
  'te-IN': { ok: 'సరే', here: 'ఇవిగో ఎంపికలు.', askTo: 'ఏ ఊరికి?', askDate: 'ఏ రోజు?', days: ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'], night: 'రాత్రి', people: (n) => `${n} మందికి`, mode: { bus: 'బస్సు', train: 'రైలు', air: 'విమానం' } },
  'hi-IN': { ok: 'ठीक है', here: 'ये रहे विकल्प।', askTo: 'कहाँ जाना है?', askDate: 'किस दिन?', days: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'], night: 'रात', people: (n) => `${n} लोगों के लिए`, mode: { bus: 'बस', train: 'ट्रेन', air: 'फ्लाइट' } },
  'od-IN': { ok: 'ଠିକ ଅଛି', here: 'ଏହି ବିକଳ୍ପ।', askTo: 'କେଉଁ ସହରକୁ?', askDate: 'କେଉଁ ଦିନ?', days: ['ରବିବାର', 'ସୋମବାର', 'ମଙ୍ଗଳବାର', 'ବୁଧବାର', 'ଗୁରୁବାର', 'ଶୁକ୍ରବାର', 'ଶନିବାର'], night: 'ରାତି', people: (n) => `${n} ଜଣଙ୍କ ପାଇଁ`, mode: { bus: 'ବସ୍', train: 'ଟ୍ରେନ', air: 'ବିମାନ' } },
  'bn-IN': { ok: 'ঠিক আছে', here: 'এই বিকল্পগুলো।', askTo: 'কোন শহরে?', askDate: 'কোন দিন?', days: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'], night: 'রাতে', people: (n) => `${n} জনের জন্য`, mode: { bus: 'বাস', train: 'ট্রেন', air: 'বিমান' } },
  'en-IN': { ok: 'Okay', here: 'Here are your options.', askTo: 'Which town are you going to?', askDate: 'Which day?', days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], night: 'night', people: (n) => `for ${n}`, mode: { bus: 'bus', train: 'train', air: 'flight' } },
};

export interface ReplyText { text: string; key: string }

/** Offline-clip keys: apps/mobile/assets/audio/<key>.mp3 (or .wav) if Ankith recorded one. */
export function replyFor(intent: TripIntent, route: Route | null, style: 'warm' | 'short'): ReplyText {
  const lang = intent.language;
  const w = W[lang] ?? W['en-IN'];
  const short = lang.slice(0, 2);
  if (intent.needsFollowUp.includes('to')) return { text: intent.needsFollowUp.includes('date') ? `${w.askTo} ${w.askDate}` : w.askTo, key: `${short}-ask-to` };
  if (intent.needsFollowUp.includes('date')) return { text: w.askDate, key: `${short}-ask-date` };
  const town = lang === 'en-IN' ? intent.to ?? '' : route?.toLocal ?? intent.to ?? '';
  const day = intent.dateFrom ? w.days[weekdayOf(intent.dateFrom)] : '';
  const when = intent.timeWindow === 'night' ? `${day} ${w.night}` : day;
  const mode = intent.mode ? w.mode[intent.mode] : '';
  const key = `${short}-confirm${intent.routeId === 'BLR-HBL' ? '-hero' : ''}`;
  if (style === 'short') return { text: `${town}, ${when}. ${mode}`.trim(), key };
  if (lang === 'kn-IN') return { text: `${w.ok}, ${when} ${town}ಗೆ ${w.people(intent.people)} ${mode}. ${w.here}`.replace(/\s+/g, ' '), key };
  if (lang === 'en-IN') return { text: `${w.ok}, ${town} on ${when}, ${w.people(intent.people)}${mode ? ` by ${mode}` : ''}. ${w.here}`, key };
  return { text: `${w.ok}, ${town}, ${when}, ${w.people(intent.people)} ${mode}. ${w.here}`.replace(/\s+/g, ' '), key };
}

export function offlineNotice(lang: Lang): string {
  const m: Partial<Record<Lang, string>> = {
    'kn-IN': 'ಈಗ ಧ್ವನಿ ಸೇವೆ ವಿಶ್ರಾಂತಿಯಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಒಂದು ವಾಕ್ಯ ಆರಿಸಿ.',
    'ta-IN': 'குரல் சேவை இப்போது ஓய்வில் உள்ளது. தட்டச்சு செய்யுங்கள் அல்லது ஒரு வாக்கியத்தைத் தேர்ந்தெடுங்கள்.',
    'hi-IN': 'आवाज़ सेवा अभी आराम पर है। कृपया टाइप करें या एक वाक्य चुनें।',
  };
  return m[lang] ?? 'Voice is resting right now. Please type, or pick a sample sentence.';
}
