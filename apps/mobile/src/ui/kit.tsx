// UI primitives: Screen, Section (flowing, no box), Glass (frosted group), Button (pill, 52 px), Chip (pill, 44 px), Banner, text.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts, radius, space, type as t } from '../theme/tokens';
import { router } from 'expo-router';
import { useFlags } from '../state/flags';
import { dismissBanner, useAlerts } from '../state/alerts';
import { getIdentity } from '../state/identity';
import { fontForText } from '../theme/tokens';
import { Backdrop, MotifRule } from './backdrop';
import { alpha, frost, glow, tint } from './glass';
import { KolamGrid } from './motifs';

export function Screen({ children, title, subtitle, demoTag }: { children: ReactNode; title?: string; subtitle?: string; demoTag?: boolean }) {
  const { flags, offlineData, accent, source } = useFlags();
  const { banner } = useAlerts();
  const wide = useWindowDimensions().width >= 760;
  return (
    <View style={s.root}>
      <Backdrop accent={accent.accent} accentSoft={accent.accentSoft} />
      {flags.voice_fallback_offline ? <View style={s.bannerWrap}><Banner text="Offline voice mode: answers are text + saved audio" /></View> : null}
      {banner ? <AlertBanner text={banner.textLocal?.[getIdentity().language] ?? banner.text} /> : null}
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={[s.page, wide && s.pageWide]}>
          {title ? (
            <View style={[s.header, wide && s.headerWide]}>
              <View style={s.kolam}><KolamGrid size={wide ? 260 : 190} opacity={0.06} /></View>
              <View style={[s.titleRow, wide && { justifyContent: 'center' }]}>
                <Text style={[s.title, wide && s.titleWide]} accessibilityRole="header">{title}</Text>
                {demoTag ? <Text style={s.demoTag} testID="demo-tag">Demo data</Text> : null}
              </View>
              {subtitle ? <Text style={[s.subtitle, wide && { textAlign: 'center' }]}>{subtitle}</Text> : null}
              <Text style={[s.flagNote, wide && { textAlign: 'center' }]} testID="flag-source">{source === 'offline' ? 'flags: offline defaults' : 'flags: live from Flagsmith'}{offlineData ? ' - api asleep, using saved data' : ''}</Text>
              <MotifRule />
            </View>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

/** In-app alert banner (every platform): the newest alert, tap to open Alerts. */
function AlertBanner({ text }: { text: string }) {
  return (
    <View style={s.bannerWrap}>
      <Pressable accessibilityRole="alert" accessibilityHint="opens Alerts" onPress={() => { dismissBanner(); router.push('/alerts'); }}
        style={[s.banner, { backgroundColor: colors.mangoLeaf, flexDirection: 'row', gap: 10, alignItems: 'center' }, glow(colors.mangoLeaf, 0.4)]}>
        <Text style={[s.bannerText, { fontFamily: fontForText(text, true), flexShrink: 1 }]} numberOfLines={2}>New: {text}</Text>
        <Text style={s.bannerText} onPress={dismissBanner} accessibilityLabel="Dismiss">  x</Text>
      </Pressable>
    </View>
  );
}

/** Flowing block: generous space, no background, no border. */
export function Section({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.section, style]}>{children}</View>;
}

/** Frosted panel, only where grouping is truly needed. `tint` washes it with a soft colour glow instead. */
export function Glass({ children, tintColor, style }: { children: ReactNode; tintColor?: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.glass, tintColor ? tint(tintColor, 0.12) : frost(), style]}>{children}</View>;
}

type Tone = 'primary' | 'leaf' | 'plain' | 'danger';
const toneBg: Record<Tone, string> = { primary: colors.marigold, leaf: colors.mangoLeaf, plain: 'transparent', danger: colors.kumkum };
const toneFg: Record<Tone, string> = { primary: colors.ink, leaf: '#FFFFFF', plain: colors.ink, danger: '#FFFFFF' };

export function Button({ label, onPress, tone = 'primary', disabled, hint, icon }: { label: string; onPress: () => void; tone?: Tone; disabled?: boolean; hint?: string; icon?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, tone === 'plain' ? frost(0.7, 14) : [{ backgroundColor: toneBg[tone] }, glow(toneBg[tone], 0.5)],
        { opacity: disabled ? 0.5 : 1 }, pressed && s.pressed]}
    >
      {icon ? <View style={s.btnIcon}>{icon}</View> : null}
      <View style={{ flexShrink: 1 }}>
        <Text style={[s.btnText, { color: toneFg[tone] }]}>{label}</Text>
        {hint ? <Text style={[s.btnHint, { color: toneFg[tone] }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone = 'normal', font }: { label: string; selected?: boolean; onPress?: () => void; tone?: 'normal' | 'soft' | 'warn' | 'ok'; font?: string }) {
  const bg = selected ? colors.ink : tone === 'warn' ? alpha(colors.kumkum, 0.1) : tone === 'ok' ? alpha(colors.mangoLeaf, 0.12) : tone === 'soft' ? alpha(colors.turmeric, 0.55) : undefined;
  const fg = selected ? colors.paper : tone === 'warn' ? colors.kumkum : tone === 'ok' ? colors.mangoLeaf : colors.ink;
  const body = <Text style={[s.chipText, { color: fg }, selected && { fontFamily: fonts.bodyBold }, font ? { fontFamily: font } : null]}>{label}</Text>;
  const fill: StyleProp<ViewStyle> = bg ? { backgroundColor: bg } : frost(0.66, 12);
  if (!onPress) return <View style={[s.chip, fill, { alignSelf: 'flex-start' }]}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => [s.chip, s.chipTap, fill, selected && glow(colors.ink, 0.3, 18), pressed && s.pressed]}>
      {body}
    </Pressable>
  );
}

export function Banner({ text, tone = 'danger' }: { text: string; tone?: 'danger' | 'ok' }) {
  const bg = tone === 'ok' ? colors.mangoLeaf : colors.kumkum;
  return <View style={[s.banner, { backgroundColor: bg }, glow(bg, 0.4)]} accessibilityRole="alert"><Text style={s.bannerText}>{text}</Text></View>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.body, style]}>{children}</Text>;
}

export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.small, style]}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  return <Text style={s.h2} accessibilityRole="header">{children}</Text>;
}

export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, overflow: 'hidden' },
  scroll: { paddingBottom: 120 },
  page: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20 },
  pageWide: { paddingHorizontal: 40 },
  header: { paddingTop: 36, paddingBottom: space.sm, gap: 6 },
  headerWide: { paddingTop: 64, alignItems: 'center' },
  kolam: { position: 'absolute', right: -24, top: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  demoTag: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.inkSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(91,86,112,0.25)', overflow: 'hidden' },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 46, color: colors.ink, letterSpacing: -0.3 },
  titleWide: { fontSize: 48, lineHeight: 62, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: t.body, lineHeight: 26, color: colors.inkSoft, maxWidth: 620 },
  flagNote: { fontFamily: fonts.body, fontSize: t.small, color: colors.inkSoft, marginTop: 6, opacity: 0.85 },
  section: { paddingVertical: space.lg },
  glass: { borderRadius: 32, padding: 22, marginVertical: space.md },
  btn: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: 26, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: 6 },
  btnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.marigold, 0.14) },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnText: { fontFamily: fonts.bodyBold, fontSize: t.body },
  btnHint: { fontFamily: fonts.body, fontSize: t.small, opacity: 0.8 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 6, maxWidth: '100%' },
  chipTap: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  chipText: { fontFamily: fonts.body, fontSize: t.small + 1, flexShrink: 1 },
  bannerWrap: { paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },
  banner: { backgroundColor: colors.kumkum, paddingVertical: 10, paddingHorizontal: 22, borderRadius: radius.pill, alignSelf: 'center', maxWidth: 1100 },
  bannerText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: t.small + 1, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: t.body, color: colors.ink, lineHeight: 28 },
  small: { fontFamily: fonts.body, fontSize: t.small, color: colors.inkSoft, lineHeight: 20 },
  h2: { fontFamily: fonts.display, fontSize: 26, lineHeight: 36, color: colors.ink, marginTop: space.xl, marginBottom: space.xs },
});
