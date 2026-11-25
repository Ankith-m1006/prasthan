// Natural Sarvam voices per language (docs.sarvam.ai/api-reference-docs/text-to-speech/convert, read 25 Nov 15:05):
// bulbul:v4-flash is the newest model ("recommended for new integrations") with per-language persona speakers
// named <name>_<lang>_<style>; conversation styles sound most natural for a short spoken reply.
// Odia has no v4-flash persona listed -> bulbul:v3. v3 is also the fallback if a v4 call is rejected (400/422).
import type { Lang } from '../../../../shared/contract/src/index.js';

export const V4 = 'bulbul:v4-flash';
export const V3 = 'bulbul:v3';

const V4_SPEAKER: Partial<Record<Lang, string>> = {
  'kn-IN': 'chaitra_kn_conversation',
  'ta-IN': 'gokul_ta_narration',
  'te-IN': 'kavitha_te_conversation',
  'hi-IN': 'kavya_hi_conversational',
  'bn-IN': 'roopa_bn_conversational',
  'en-IN': 'simran_en_conversation',
};

/** Same request settings for every call: native 24 kHz WAV, normal pace, numbers/dates/English words normalised. */
export const TTS_SETTINGS = { pace: 1.0, speech_sample_rate: 24000, enable_preprocessing: true, temperature: 0.6 } as const;

export interface Voice { model: string; speaker: string }

/** First choice + fallback. The flag model/speaker (Flagsmith) is the v3 fallback so ops can still steer it. */
export function voicesFor(lang: Lang, flagModel: string, flagSpeaker: string): Voice[] {
  const v4 = V4_SPEAKER[lang];
  const fallback: Voice = { model: flagModel === V4 ? V3 : flagModel, speaker: flagModel === V4 ? 'priya' : flagSpeaker };
  return v4 ? [{ model: V4, speaker: v4 }, fallback] : [fallback];
}
