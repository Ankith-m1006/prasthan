// Giant marigold hold-to-talk button.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Icon } from '../../ui/icons';
import { alpha, glow, web } from '../../ui/glass';
import { timerLabel } from '../../lib/holdToTalk';
import type { RecState } from '../../lib/useRecorder';

export function MicButton({ state, elapsed, busy, accent, onPressIn, onPressOut, disabled }: {
  state: RecState; elapsed: number; busy: boolean; accent: string; onPressIn: () => void; onPressOut: () => void; disabled?: boolean;
}) {
  const listening = state === 'listening';
  const label = busy ? 'Understanding...' : listening ? 'Listening... release to send' : 'Hold to speak your trip';
  return (
    <View style={s.wrap}>
      <View style={[s.halo, { backgroundColor: alpha(accent, 0.1) }, web({ backgroundImage: `radial-gradient(circle, ${alpha(accent, 0.22)} 0%, ${alpha(accent, 0.08)} 55%, rgba(255,249,240,0) 72%)` })]}>
      <View style={[s.ring, { backgroundColor: alpha(accent, 0.16) }, listening && { backgroundColor: alpha(accent, 0.3) }]}>
      <Pressable
        accessibilityRole="button" accessibilityLabel="Hold to speak your trip" accessibilityHint="Press and hold, speak, then release"
        disabled={disabled || busy} onPressIn={onPressIn} onPressOut={onPressOut}
        style={({ pressed }) => [s.mic, { backgroundColor: accent, opacity: disabled ? 0.45 : 1 }, glow(colors.marigoldDeep, 0.55, 40), (pressed || listening) && s.micOn]}
      >
        <Icon name="mic" size={60} color={colors.ink} />
      </Pressable>
      </View>
      </View>
      <Text style={s.label}>{label}</Text>
      {listening ? <Text style={s.timer}>{timerLabel(elapsed)}</Text> : null}
      {state === 'denied' ? <Text style={s.warn}>Microphone permission is off. Use "or type" below.</Text> : null}
      {state === 'error' ? <Text style={s.warn}>Could not start the mic here. Use "or type" below.</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 8, marginBottom: 6, gap: 10 },
  halo: { width: 260, height: 260, borderRadius: 130, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 204, height: 204, borderRadius: 102, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 156, height: 156, borderRadius: 78, alignItems: 'center', justifyContent: 'center' },
  micOn: { transform: [{ scale: 1.06 }] },
  label: { fontFamily: fonts.bodyBold, fontSize: t.label, color: colors.ink, textAlign: 'center' },
  timer: { fontFamily: fonts.body, fontSize: t.body, color: colors.kumkum },
  warn: { fontFamily: fonts.body, fontSize: t.small + 1, color: colors.kumkum, textAlign: 'center' },
});
