// Our own motifs, drawn in code with react-native-svg (no third-party art): kolam, temple line, toran, diya, route line.
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { colors } from '../theme/tokens';

/** 5x5 dot grid with one looping line weaving around the dots (generated), very faint, for headers. */
export function KolamGrid({ size = 160, color = colors.ink, opacity = 0.07 }: { size?: number; color?: string; opacity?: number }) {
  const n = 5;
  const step = size / (n + 1);
  const dots: Array<[number, number]> = [];
  for (let i = 1; i <= n; i += 1) for (let j = 1; j <= n; j += 1) dots.push([i * step, j * step]);
  const r = step / 2;
  let d = '';
  for (let i = 1; i <= n; i += 1) {
    const y = i * step;
    d += `M ${step - r} ${y} `;
    for (let j = 1; j <= n; j += 1) d += `a ${r} ${r} 0 0 ${(i + j) % 2} ${2 * r} 0 `;
  }
  for (let j = 1; j <= n; j += 1) {
    const x = j * step;
    d += `M ${x} ${step - r} `;
    for (let i = 1; i <= n; i += 1) d += `a ${r} ${r} 0 0 ${(i + j) % 2} 0 ${2 * r} `;
  }
  return (
    <Svg width={size} height={size} opacity={opacity} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {dots.map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} fill={color} />)}
      <Path d={d} stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

/** Stepped "gopuram" divider. */
export function TempleLine({ width = 320, color = colors.templeStone }: { width?: number; color?: string }) {
  const step = 12;
  let d = `M 0 8 `;
  for (let x = 0; x < width; x += step * 2) d += `L ${x + step} 8 L ${x + step} 3 L ${x + step * 1.5} 3 L ${x + step * 1.5} 0 L ${x + step * 2} 0 L ${x + step * 2} 8 `;
  return (
    <Svg width="100%" height={10} viewBox={`0 0 ${width} 10`} preserveAspectRatio="none">
      <Path d={d} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

/** Row of mango leaves hanging from a line, with marigold dots. */
export function Toran({ leaves = 7, color = colors.mangoLeaf }: { leaves?: number; color?: string }) {
  const w = leaves * 40;
  return (
    <Svg width="100%" height={44} viewBox={`0 0 ${w} 44`} preserveAspectRatio="xMidYMin meet">
      <Line x1={0} y1={4} x2={w} y2={4} stroke={colors.templeStone} strokeWidth={1.5} />
      {Array.from({ length: leaves }, (_, i) => {
        const cx = 20 + i * 40;
        return (
          <Path key={i} d={`M ${cx} 4 Q ${cx - 10} 22 ${cx} 38 Q ${cx + 10} 22 ${cx} 4 Z`} fill={color} opacity={0.85} />
        );
      })}
      {Array.from({ length: leaves - 1 }, (_, i) => <Circle key={`d${i}`} cx={40 + i * 40} cy={8} r={4} fill={colors.marigold} />)}
    </Svg>
  );
}

/** Small lamp; the flame flickers slowly unless reduced motion is on. */
export function Diya({ size = 28, lit = true }: { size?: number; lit?: boolean }) {
  const flicker = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!lit) return undefined;
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(flicker, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ]));
      loop.start();
    }).catch(() => undefined);
    return () => loop?.stop();
  }, [lit, flicker]);
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ position: 'absolute', opacity: lit ? flicker : 0.25 }}>
        <Svg width={size} height={size} viewBox="0 0 28 28">
          <Path d="M14 2 C 18 8 17 12 14 14 C 11 12 10 8 14 2 Z" fill={lit ? colors.marigold : colors.templeStone} />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 28 28" style={{ position: 'absolute' }}>
        <Path d="M3 16 Q 14 30 25 16 Z" fill={colors.marigoldDeep} />
        <Line x1={2} y1={16} x2={26} y2={16} stroke={colors.ink} strokeWidth={1.2} />
      </Svg>
    </View>
  );
}

/** Bengaluru -> hometown as a dotted kolam-style line between two dots. */
export function RouteLine({ color = colors.ink }: { color?: string }) {
  return (
    <Svg width="100%" height={18} viewBox="0 0 200 18" preserveAspectRatio="none">
      <Circle cx={8} cy={9} r={6} fill={colors.marigold} />
      <Path d="M 18 9 Q 60 -2 100 9 T 182 9" stroke={color} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" fill="none" />
      <Circle cx={192} cy={9} r={6} fill={colors.mangoLeaf} />
    </Svg>
  );
}
