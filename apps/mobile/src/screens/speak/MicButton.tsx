// Giant marigold hold-to-talk button.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Icon } from '../../ui/icons';
import { timerLabel } from '../../lib/holdToTalk';
import type { RecState } from '../../lib/useRecorder';

export function MicButton({ state, elapsed, busy, accent, onPressIn, onPressOut, disabled }: {
  state: RecState; elapsed: number; busy: boolean; accent: string; onPressIn: () => void; onPressOut: () => void; disabled?: boolean;
}) {
  const listening = state === 'listening';
  const label = busy ? 'Understanding...' : listening ? 'Listening... release to send' : 'Hold to speak your trip';
  return (
    <View style={s.wrap}>
      <Pressable
        accessibilityRole="button" accessibilityLabel="Hold to speak your trip" accessibilityHint="Press and hold, speak, then release"
        disabled={disabled || busy} onPressIn={onPressIn} onPressOut={onPressOut}
        style={({ pressed }) => [s.mic, { backgroundColor: accent, opacity: disabled ? 0.45 : 1 }, (pressed || listening) && s.micOn]}
      >
        <Icon name="mic" size={64} color={colors.ink} />
      </Pressable>
      <Text style={s.label}>{label}</Text>
      {listening ? <Text style={s.timer}>{timerLabel(elapsed)}</Text> : null}
      {state === 'denied' ? <Text style={s.warn}>Microphone permission is off. Use "or type" below.</Text> : null}
      {state === 'error' ? <Text style={s.warn}>Could not start the mic here. Use "or type" below.</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 18, gap: 8 },
  mic: { width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: colors.card, shadowColor: colors.marigoldDeep, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  micOn: { transform: [{ scale: 1.06 }], borderColor: colors.marigoldDeep },
  label: { fontFamily: fonts.bodyBold, fontSize: t.label, color: colors.ink, textAlign: 'center' },
  timer: { fontFamily: fonts.body, fontSize: t.body, color: colors.kumkum },
  warn: { fontFamily: fonts.body, fontSize: t.small + 1, color: colors.kumkum, textAlign: 'center' },
});
