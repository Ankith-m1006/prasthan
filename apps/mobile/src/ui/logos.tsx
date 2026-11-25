// Logos. Real booking / quick-commerce sites: their own favicon, fetched ONCE at build time (scripts/fetch-logos.mjs)
// and bundled, used only on links that open that site. Fictional partners: our own round festive monogram.
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { glow } from './glass';

/* eslint-disable @typescript-eslint/no-require-imports */
const SITE: Record<string, number> = {
  redbus: require('../../assets/logos/redbus.png'), abhibus: require('../../assets/logos/abhibus.png'), zingbus: require('../../assets/logos/zingbus.png'),
  flixbus: require('../../assets/logos/flixbus.png'), ixigo: require('../../assets/logos/ixigo.png'), makemytrip: require('../../assets/logos/makemytrip.png'),
  blinkit: require('../../assets/logos/blinkit.png'), zepto: require('../../assets/logos/zepto.png'), instamart: require('../../assets/logos/instamart.png'),
  flipkart: require('../../assets/logos/flipkart.png'), zomato: require('../../assets/logos/zomato.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

const BY_NAME: Record<string, string> = { 'Swiggy Instamart': 'instamart', 'Flipkart Minutes': 'flipkart', Blinkit: 'blinkit', Zepto: 'zepto', Zomato: 'zomato' };
export const siteLogoKey = (idOrName: string): string | null => (SITE[idOrName] ? idOrName : BY_NAME[idOrName] ?? null);

export function SiteLogo({ id, size = 24 }: { id: string; size?: number }) {
  const key = siteLogoKey(id);
  if (!key) return null;
  return <Image source={SITE[key]} style={{ width: size, height: size, borderRadius: size / 4 }} accessibilityIgnoresInvertColors />;
}

const PALETTE = [colors.marigold, colors.kumkum, colors.mangoLeaf, '#7A4FA0', '#2C6E8F', colors.marigoldDeep, '#A8466E'];

/** Display name of a fictional partner without a trailing "(demo)" (the header tag says it once). */
export const partnerName = (n: string) => n.replace(/\s*\(demo\)\s*/gi, ' ').trim();

/** Pure: initials (max 2) from a fictional partner's name, ignoring "(demo)" and small words. */
export function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, ' ').split(/[^A-Za-z0-9]+/).filter((w) => w && !['and', 'of', 'the', 'demo'].includes(w.toLowerCase()));
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}
export function monogramColor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Monogram({ name, id, size = 36 }: { name: string; id: string; size?: number }) {
  const bg = monogramColor(id);
  return (
    <View style={[s.mono, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, glow(bg, 0.35, 10)]} accessibilityElementsHidden>
      <View style={[s.ring, { borderRadius: size / 2 - 3 }]} />
      <Text style={[s.monoText, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  mono: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderWidth: 1, borderColor: 'rgba(255,249,240,0.55)' },
  monoText: { fontFamily: fonts.bodyBold, color: '#FFF9F0', letterSpacing: 0.5 },
});
