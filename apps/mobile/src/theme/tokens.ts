// Design tokens (docs/DESIGN.md). Original palette: rice-flour paper, indigo ink, marigold, kumkum, mango leaf.
export const colors = {
  paper: '#FFF9F0',
  ink: '#1E1A33',
  inkSoft: '#5B5670',
  marigold: '#F29E1F',
  marigoldDeep: '#C9740A',
  kumkum: '#B3302B',
  mangoLeaf: '#2F6B45',
  turmeric: '#F4D35E',
  templeStone: '#8C8173',
  card: '#FFFFFF',
  line: '#EADFCB',
} as const;

export type ThemeName = 'sankranti' | 'pongal' | 'republic';

/** Only the accent changes per festival; layout stays. */
export const festivalAccent: Record<ThemeName, { accent: string; accentSoft: string; label: string }> = {
  sankranti: { accent: colors.marigold, accentSoft: '#7FA650', label: 'Sankranti' },
  pongal: { accent: colors.turmeric, accentSoft: colors.kumkum, label: 'Pongal' },
  republic: { accent: '#C9B8A0', accentSoft: colors.templeStone, label: 'Republic Day' },
};

export function accentFor(theme: string | undefined) {
  return festivalAccent[(theme as ThemeName) in festivalAccent ? (theme as ThemeName) : 'sankranti'];
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const type = { small: 14, body: 18, label: 20, card: 24, title: 30, hero: 40 } as const;
export const minTap = 48;

// WCAG contrast helpers (used in tests to keep text readable).
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const fonts = {
  body: 'Mukta_400Regular',
  bodyBold: 'Mukta_700Bold',
  display: 'TiroKannada_400Regular',
  kannada: 'NotoSansKannada_400Regular',
};

/** Noto Sans per script (regular + bold only, bundled in app/_layout.tsx) so all 7 languages render well. */
const SCRIPT: Record<string, string> = {
  'kn-IN': 'NotoSansKannada', 'ta-IN': 'NotoSansTamil', 'te-IN': 'NotoSansTelugu', 'hi-IN': 'NotoSansDevanagari', 'od-IN': 'NotoSansOriya', 'bn-IN': 'NotoSansBengali',
};
/** Pure: font family for text in a language (English / unknown -> Mukta, which also covers Devanagari). */
export function fontFor(lang: string | undefined, bold = false): string {
  const fam = lang ? SCRIPT[lang] : undefined;
  if (!fam) return bold ? fonts.bodyBold : fonts.body;
  return `${fam}_${bold ? '700Bold' : '400Regular'}`;
}

/** Pure: guess the language of a piece of text from its script (for text without a language tag). */
export function scriptLang(text: string): string | undefined {
  const ranges: Array<[RegExp, string]> = [[/[ಀ-೿]/, 'kn-IN'], [/[஀-௿]/, 'ta-IN'], [/[ఀ-౿]/, 'te-IN'], [/[ऀ-ॿ]/, 'hi-IN'], [/[଀-୿]/, 'od-IN'], [/[ঀ-৿]/, 'bn-IN']];
  return ranges.find(([r]) => r.test(text))?.[1];
}
export const fontForText = (text: string, bold = false) => fontFor(scriptLang(text), bold);
