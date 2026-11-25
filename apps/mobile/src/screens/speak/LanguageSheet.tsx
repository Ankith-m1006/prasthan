// Language pill (header, Speak tab) + glassy bottom sheet with the 7 languages in their own script.
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Lang } from '@contract';
import { haptic } from '../../lib/haptics';
import { colors, fontFor, fonts } from '../../theme/tokens';
import { frost } from '../../ui/glass';

export const LANG_NAMES: Array<[Lang, string]> = [['kn-IN', 'ಕನ್ನಡ'], ['ta-IN', 'தமிழ்'], ['te-IN', 'తెలుగు'], ['hi-IN', 'हिन्दी'], ['od-IN', 'ଓଡ଼ିଆ'], ['bn-IN', 'বাংলা'], ['en-IN', 'English']];

export function LanguagePill({ lang, onPick }: { lang: Lang; onPick: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const name = LANG_NAMES.find(([l]) => l === lang)?.[1] ?? 'English';
  return (
    <>
      <Pressable testID="lang-pill" accessibilityRole="button" accessibilityLabel={`Language: ${name}. Change language`}
        onPress={() => { haptic('tick'); setOpen(true); }} style={({ pressed }) => [s.pill, frost(0.75, 12), pressed && { opacity: 0.7 }]}>
        <Text style={[s.pillText, { fontFamily: fontFor(lang, true) }]}>{name} ▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.scrim} accessibilityLabel="Close" onPress={() => setOpen(false)} />
        <View style={[s.sheet, frost(0.92, 22)]} testID="lang-sheet">
          <View style={s.grab} />
          <Text style={s.title}>Choose your language</Text>
          {LANG_NAMES.map(([l, n]) => (
            <Pressable key={l} testID={`lang-${l}`} accessibilityRole="button" accessibilityState={{ selected: l === lang }}
              onPress={() => { haptic('tick'); onPick(l); setOpen(false); }}
              style={({ pressed }) => [s.row, l === lang && s.rowOn, pressed && { opacity: 0.7 }]}>
              <Text style={[s.rowText, { fontFamily: fontFor(l, l === lang) }, l === lang && { color: colors.paper }]}>{n}</Text>
              {l === lang ? <Text style={[s.rowText, { color: colors.paper }]}>✓</Text> : null}
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  pill: { height: 38, paddingHorizontal: 14, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 15, color: colors.ink },
  scrim: { flex: 1, backgroundColor: 'rgba(30, 20, 10, 0.28)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, gap: 6, maxWidth: 560, alignSelf: 'center', width: '100%' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.18)', marginBottom: 8 },
  title: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink, marginBottom: 6, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.7)' },
  rowOn: { backgroundColor: colors.ink },
  rowText: { fontSize: 18, color: colors.ink },
});
