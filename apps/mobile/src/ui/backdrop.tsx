// Airy page backdrop (soft festival-colour glow behind the header) and gentle motif dividers. All drawn by us.
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/tokens';
import { alpha, web } from './glass';

/** Warm morning-light glow at the top of every screen; fades into the rice-flour paper. */
export function Backdrop({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  if (Platform.OS === 'web') {
    const bg = [
      `radial-gradient(60% 70% at 50% -8%, ${alpha(accent, 0.34)} 0%, ${alpha(accent, 0.12)} 45%, rgba(255,249,240,0) 75%)`,
      `radial-gradient(40% 50% at 92% 10%, ${alpha(accentSoft, 0.16)} 0%, rgba(255,249,240,0) 70%)`,
      `radial-gradient(45% 55% at 4% 22%, ${alpha(colors.turmeric, 0.22)} 0%, rgba(255,249,240,0) 70%)`,
    ].join(', ');
    return <View pointerEvents="none" style={[s.wrap, web({ backgroundImage: bg })]} />;
  }
  return (
    <View pointerEvents="none" style={s.wrap}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="bgA" cx="50%" cy="0%" rx="70%" ry="80%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.paper} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="bgB" cx="0%" cy="25%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={colors.turmeric} stopOpacity={0.2} />
            <Stop offset="1" stopColor={colors.paper} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#bgA)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#bgB)" />
      </Svg>
    </View>
  );
}

/** A dotted kolam rule that fades at both ends, with a small four-dot diamond in the middle. */
export function MotifRule({ color = colors.templeStone, width = 220 }: { color?: string; width?: number }) {
  const n = 13;
  const mid = width / 2;
  const gap = (mid - 18) / n;
  const dots = Array.from({ length: n }, (_, i) => ({ dx: 18 + i * gap, o: 0.55 * (1 - i / n) }));
  return (
    <View style={s.rule} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={14} viewBox={`0 0 ${width} 14`}>
        {dots.map((d) => <Circle key={`l${d.dx}`} cx={mid - d.dx} cy={7} r={1.6} fill={color} opacity={d.o} />)}
        {dots.map((d) => <Circle key={`r${d.dx}`} cx={mid + d.dx} cy={7} r={1.6} fill={color} opacity={d.o} />)}
        <Path d={`M ${mid} 1 Q ${mid + 3} 7 ${mid} 13 Q ${mid - 3} 7 ${mid} 1 Z`} fill={colors.marigold} opacity={0.85} />
        <Circle cx={mid - 8} cy={7} r={2} fill={colors.marigold} opacity={0.7} />
        <Circle cx={mid + 8} cy={7} r={2} fill={colors.marigold} opacity={0.7} />
      </Svg>
    </View>
  );
}

/** Hairline that fades out at the ends: separates rows without boxing them. */
export function SoftRule() {
  return <View style={[s.soft, web({ backgroundImage: `linear-gradient(90deg, rgba(140,129,115,0) 0%, ${alpha(colors.templeStone, 0.28)} 20%, ${alpha(colors.templeStone, 0.28)} 80%, rgba(140,129,115,0) 100%)` })]} />;
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 560 },
  rule: { alignItems: 'center', marginVertical: 18 },
  soft: { height: 1, backgroundColor: Platform.OS === 'web' ? 'transparent' : alpha(colors.templeStone, 0.2), marginVertical: 14 },
});
