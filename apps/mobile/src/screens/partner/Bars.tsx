// Small horizontal bar chart drawn with react-native-svg (no chart library). Optional compare bar (e.g. seats vs want).
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { alpha } from '../../ui/glass';
import { colors, fonts } from '../../theme/tokens';
import type { Bar } from './logic';

const W = 300;
const H = 12;

export function Bars({ bars, unit, compareUnit, testID }: { bars: Bar[]; unit: string; compareUnit?: string; testID?: string }) {
  const max = Math.max(1, ...bars.map((b) => Math.max(b.value, b.compare ?? 0)));
  if (!bars.length) return <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, marginVertical: 8 }}>Nothing yet.</Text>;
  return (
    <View testID={testID} style={{ gap: 12, marginVertical: 10 }}>
      {bars.map((b) => {
        const gap = b.compare !== undefined ? b.value - b.compare : 0;
        return (
          <View key={b.key} accessibilityLabel={`${b.label}: ${b.value} ${unit}${b.compare !== undefined ? `, ${b.compare} ${compareUnit}` : ''}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 14, flexShrink: 1 }} numberOfLines={1}>{b.label}</Text>
              <Text style={{ fontFamily: fonts.body, color: b.highlight ? colors.kumkum : colors.inkSoft, fontSize: 13 }}>
                {b.value.toLocaleString('en-IN')} {unit}{b.compare !== undefined ? ` / ${b.compare.toLocaleString('en-IN')} ${compareUnit}` : ''}{b.highlight && gap > 0 ? `  gap ${gap.toLocaleString('en-IN')}` : ''}
              </Text>
            </View>
            <Svg width="100%" height={b.compare !== undefined ? H * 2 + 4 : H} viewBox={`0 0 ${W} ${b.compare !== undefined ? H * 2 + 4 : H}`} preserveAspectRatio="none">
              <Rect x={0} y={0} width={W} height={H} rx={H / 2} fill={alpha(colors.marigold, 0.12)} />
              <Rect x={0} y={0} width={Math.max(H, (b.value / max) * W)} height={H} rx={H / 2} fill={b.highlight ? colors.kumkum : colors.marigold} />
              {b.compare !== undefined ? <Rect x={0} y={H + 4} width={Math.max(b.compare ? H : 0, (b.compare / max) * W)} height={H} rx={H / 2} fill={colors.mangoLeaf} /> : null}
            </Svg>
          </View>
        );
      })}
      {bars.some((b) => b.compare !== undefined) ? (
        <Text style={{ fontFamily: fonts.body, color: colors.inkSoft, fontSize: 12 }}>
          <Text style={{ color: colors.kumkum }}>red</Text> = {unit} with a gap, <Text style={{ color: colors.mangoLeaf }}>green</Text> = {compareUnit}
        </Text>
      ) : null}
    </View>
  );
}
