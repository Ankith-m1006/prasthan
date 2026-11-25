// UI primitives: Screen, Card, Button (48 px min), Chip, Banner, Title, Body.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fonts, minTap, radius, space, type as t } from '../theme/tokens';
import { useFlags } from '../state/flags';
import { KolamGrid, TempleLine } from './motifs';

export function Screen({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const { flags, offlineData } = useFlags();
  return (
    <View style={s.root}>
      {flags.voice_fallback_offline ? <Banner text="Offline voice mode: answers are text + saved audio" /> : null}
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.page}>
          {title ? (
            <View style={s.header}>
              <View style={s.kolam}><KolamGrid size={150} /></View>
              <Text style={s.title} accessibilityRole="header">{title}</Text>
              {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
              {offlineData ? <Chip label="Offline demo data" tone="soft" /> : null}
              <View style={{ marginTop: space.md }}><TempleLine /></View>
            </View>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function Card({ children, edge, style }: { children: ReactNode; edge?: string; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, edge ? { borderLeftWidth: 6, borderLeftColor: edge } : null, style]}>{children}</View>;
}

type Tone = 'primary' | 'leaf' | 'plain' | 'danger';
const toneBg: Record<Tone, string> = { primary: colors.marigold, leaf: colors.mangoLeaf, plain: colors.card, danger: colors.kumkum };
const toneFg: Record<Tone, string> = { primary: colors.ink, leaf: '#FFFFFF', plain: colors.ink, danger: '#FFFFFF' };

export function Button({ label, onPress, tone = 'primary', disabled, hint, icon }: { label: string; onPress: () => void; tone?: Tone; disabled?: boolean; hint?: string; icon?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: toneBg[tone], opacity: disabled ? 0.5 : 1 }, tone === 'plain' && s.btnPlain, pressed && s.pressed]}
    >
      {icon}
      <View style={{ flexShrink: 1 }}>
        <Text style={[s.btnText, { color: toneFg[tone] }]}>{label}</Text>
        {hint ? <Text style={[s.btnHint, { color: toneFg[tone] }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, tone = 'normal' }: { label: string; selected?: boolean; onPress?: () => void; tone?: 'normal' | 'soft' | 'warn' | 'ok' }) {
  const bg = selected ? colors.ink : tone === 'warn' ? '#F8E1DF' : tone === 'ok' ? '#E2EFE6' : tone === 'soft' ? colors.turmeric : colors.card;
  const fg = selected ? colors.paper : tone === 'warn' ? colors.kumkum : tone === 'ok' ? colors.mangoLeaf : colors.ink;
  const body = <Text style={[s.chipText, { color: fg }]}>{label}</Text>;
  if (!onPress) return <View style={[s.chip, { backgroundColor: bg, alignSelf: 'flex-start' }]}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[s.chip, s.chipTap, { backgroundColor: bg }]}>
      {body}
    </Pressable>
  );
}

export function Banner({ text }: { text: string }) {
  return <View style={s.banner} accessibilityRole="alert"><Text style={s.bannerText}>{text}</Text></View>;
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
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingBottom: 48 },
  page: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: space.lg },
  header: { paddingTop: space.xl, paddingBottom: space.md, gap: 4 },
  kolam: { position: 'absolute', right: -10, top: -6 },
  title: { fontFamily: fonts.display, fontSize: t.title, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: t.body, color: colors.inkSoft },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, marginVertical: space.sm, borderWidth: 1, borderColor: colors.line },
  btn: { minHeight: minTap, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: 4 },
  btnPlain: { borderWidth: 1, borderColor: colors.templeStone },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  btnText: { fontFamily: fonts.bodyBold, fontSize: t.body },
  btnHint: { fontFamily: fonts.body, fontSize: t.small, opacity: 0.8 },
  chip: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6, borderWidth: 1, borderColor: colors.line },
  chipTap: { minHeight: 40, justifyContent: 'center' },
  chipText: { fontFamily: fonts.body, fontSize: t.small + 1 },
  banner: { backgroundColor: colors.kumkum, paddingVertical: 8, paddingHorizontal: space.lg },
  bannerText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: t.small + 1, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: t.body, color: colors.ink, lineHeight: 26 },
  small: { fontFamily: fonts.body, fontSize: t.small, color: colors.inkSoft },
  h2: { fontFamily: fonts.bodyBold, fontSize: t.label + 2, color: colors.ink, marginTop: space.lg, marginBottom: space.xs },
});
