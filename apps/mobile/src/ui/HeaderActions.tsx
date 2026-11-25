// Top-right header actions on every tab: optional extra (Speak: language pill), mute, About (i), profile avatar.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { haptic } from '../lib/haptics';
import { setMuted, useMuted } from '../state/mute';
import { useProfile } from '../state/profile';
import { colors, fonts } from '../theme/tokens';
import { frost } from './glass';
import { Icon } from './icons';

function Round({ label, onPress, children, testID }: { label: string; onPress: () => void; children: ReactNode; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      onPress={() => { haptic('tick'); onPress(); }} style={({ pressed }) => [s.round, frost(0.75, 12), pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

export function HeaderActions({ extra }: { extra?: ReactNode }) {
  const profile = useProfile();
  const muted = useMuted();
  const initial = (profile?.name?.trim()?.[0] ?? 'G').toUpperCase();
  return (
    <View style={s.row}>
      {extra}
      <Round testID="mute-toggle" label={muted ? 'Voice replies off, tap to turn on' : 'Voice replies on, tap to mute'} onPress={() => setMuted(!muted)}>
        <View style={{ opacity: muted ? 0.45 : 1 }}><Icon name="speaker" size={18} /></View>
        {muted ? <View style={s.slash} /> : null}
      </Round>
      <Round testID="about-button" label="About Prasthan" onPress={() => router.push('/about')}><Icon name="info" size={18} /></Round>
      <Round testID="avatar-button" label="Your profile" onPress={() => router.push('/profile')}>
        <Text style={s.initial}>{initial}</Text>
      </Round>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, alignSelf: 'stretch', marginBottom: 4, zIndex: 2 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  slash: { position: 'absolute', width: 24, height: 2.5, borderRadius: 2, backgroundColor: colors.kumkum, transform: [{ rotate: '-45deg' }] },
});
