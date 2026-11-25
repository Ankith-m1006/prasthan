// Giant marigold tap-to-talk button: tap to start, tap to stop. The mic area never scrolls the page, selects text
// or opens the long-press menu (touch-action none, user-select none, touch-callout none, touchmove/contextmenu blocked).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Icon } from '../../ui/icons';
import { alpha, glow, web } from '../../ui/glass';
import { timerLabel } from '../../lib/holdToTalk';
import type { RecState } from '../../lib/useRecorder';

const NO_TOUCH = web({ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' });

function useNoScroll() {
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const block = (e: Event) => { if (e.cancelable) e.preventDefault(); };
    node.addEventListener('touchmove', block, { passive: false });
    node.addEventListener('contextmenu', block);
    node.addEventListener('selectstart', block);
    return () => {
      node.removeEventListener('touchmove', block);
      node.removeEventListener('contextmenu', block);
      node.removeEventListener('selectstart', block);
    };
  }, []);
  return ref;
}

function usePulse(on: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on) { v.stopAnimation(); v.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [on, v]);
  return v;
}

export function MicButton({ state, elapsed, busy, accent, onPress, disabled }: {
  state: RecState; elapsed: number; busy: boolean; accent: string; onPress: () => void; disabled?: boolean;
}) {
  const listening = state === 'listening';
  const ref = useNoScroll();
  const pulse = usePulse(listening);
  const label = busy ? 'Understanding...' : listening ? 'Listening... tap to stop' : state === 'starting' ? 'Starting the mic...' : 'Tap to speak';
  const a11y = listening ? 'Stop recording and send' : 'Tap to speak your trip';
  return (
    <View ref={ref} style={[s.wrap, NO_TOUCH]} testID="mic-area">
      <View style={[s.halo, { backgroundColor: alpha(accent, 0.1) }, NO_TOUCH, web({ backgroundImage: `radial-gradient(circle, ${alpha(accent, 0.22)} 0%, ${alpha(accent, 0.08)} 55%, rgba(255,249,240,0) 72%)` })]}>
        {listening ? (
          <Animated.View pointerEvents="none" style={[s.pulse, { borderColor: colors.kumkum, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] }) }] }]} />
        ) : null}
        <View style={[s.ring, { backgroundColor: alpha(accent, 0.16) }, listening && { backgroundColor: alpha(colors.kumkum, 0.22) }]}>
          <Pressable
            testID="mic-button" accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ busy, disabled: !!disabled }}
            disabled={disabled || busy || state === 'starting'} onPress={onPress} delayLongPress={60_000}
            style={({ pressed }) => [s.mic, NO_TOUCH, { backgroundColor: listening ? colors.kumkum : accent, opacity: disabled ? 0.45 : 1 }, glow(colors.marigoldDeep, 0.55, 40), (pressed || listening) && s.micOn]}
          >
            <Icon name="mic" size={60} color={listening ? '#FFFFFF' : colors.ink} />
          </Pressable>
        </View>
      </View>
      <Text style={[s.label, NO_TOUCH]} accessibilityLiveRegion="polite">{label}</Text>
      {listening ? <Text style={[s.timer, NO_TOUCH]}>{timerLabel(elapsed)}</Text> : null}
      {state === 'denied' ? <Text style={s.warn} accessibilityRole="alert">Microphone is blocked. Allow the mic for this site (tap the lock or "aA" icon next to the address, then Microphone: Allow) and tap again, or use "or type" below.</Text> : null}
      {state === 'error' ? <Text style={s.warn}>Could not start the mic here. Use "or type" below.</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 8, marginBottom: 6, gap: 10 },
  halo: { width: 260, height: 260, borderRadius: 130, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 4 },
  ring: { width: 204, height: 204, borderRadius: 102, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 156, height: 156, borderRadius: 78, alignItems: 'center', justifyContent: 'center' },
  micOn: { transform: [{ scale: 1.06 }] },
  label: { fontFamily: fonts.bodyBold, fontSize: t.label, color: colors.ink, textAlign: 'center' },
  timer: { fontFamily: fonts.body, fontSize: t.body, color: colors.kumkum },
  warn: { fontFamily: fonts.body, fontSize: t.small + 1, color: colors.kumkum, textAlign: 'center' },
});
