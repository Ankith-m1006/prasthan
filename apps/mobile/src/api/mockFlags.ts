// Mock-mode flags: the coded defaults (same as config/flagsmith/flags.json) + the same segment rules, plus
// in-app "demo switches" so the offline web demo can show festival modes and the fallback switch.
import type { FlagsView, Traits } from '@contract';
import defaults from '../../../../shared/contract/examples/flags-view.json';

export const DEFAULT_FLAGS = defaults as unknown as FlagsView;

const PONGAL: FlagsView['festival_mode'] = { festivalId: 'pongal-2027', title: 'Pongal mode', theme: 'pongal', greeting: { 'ta-IN': 'இனிய பொங்கல் நல்வாழ்த்துகள்', 'en-IN': 'Happy Pongal' } };
export const REPUBLIC: FlagsView['festival_mode'] = { festivalId: 'republic-day-2027', title: 'Republic Day weekend', theme: 'republic', greeting: { 'en-IN': 'Happy Republic Day', 'kn-IN': 'ಗಣರಾಜ್ಯೋತ್ಸವದ ಶುಭಾಶಯಗಳು' } };

/** Stable 0..99 bucket (FNV-1a), like a Flagsmith percentage split. */
export function bucket(id: string): number {
  let h = 2166136261;
  for (const ch of `gifting_pilot_20pct,${id}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100;
}

export interface DemoSwitches { festival?: 'default' | 'pongal' | 'republic'; fallback?: boolean; giftingAll?: boolean }

export function mockFlags(identity: string, t: Traits, sw: DemoSwitches): FlagsView {
  const f: FlagsView = JSON.parse(JSON.stringify(DEFAULT_FLAGS)) as FlagsView;
  if (t.role === 'traveller' && t.home_state === 'Tamil Nadu') f.festival_mode = PONGAL;
  if (t.language === 'od-IN') f.tts_model = 'bulbul:v3';
  f.operator_add_service = t.partner_type === 'bus_operator';
  f.shop_orders_view = t.partner_type === 'sweet_shop';
  f.quick_commerce_view = t.partner_type === 'quick_commerce';
  f.gifting_enabled = Boolean(sw.giftingAll) || (t.role === 'traveller' && bucket(identity) < 20);
  if (sw.festival === 'pongal') f.festival_mode = PONGAL;
  if (sw.festival === 'republic') f.festival_mode = REPUBLIC;
  if (sw.fallback) f.voice_fallback_offline = true;
  return f;
}
