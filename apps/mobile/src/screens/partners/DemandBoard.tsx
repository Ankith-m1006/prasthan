// One demand board for every partner type: rows of DemandCell with a want-vs-have bar, the gap in kumkum, a suggestion.
import { StyleSheet, Text, View } from 'react-native';
import type { DemandCell } from '@contract';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Card, Chip, Small } from '../../ui/kit';

export function fill(cell: Pick<DemandCell, 'want' | 'have'>): { have: number; gap: number } {
  const max = Math.max(cell.want, cell.have, 1);
  const have = Math.min(cell.have, cell.want || cell.have) / max;
  return { have, gap: Math.max(0, cell.want - cell.have) / max };
}

export function DemandRow({ cell, unit, action }: { cell: DemandCell; unit: string; action?: React.ReactNode }) {
  const f = fill(cell);
  return (
    <Card>
      <Text style={s.label}>{cell.label}</Text>
      <View style={s.bar} accessibilityLabel={`${cell.want} want, ${cell.have} ${unit}`}>
        <View style={[s.seg, { flex: f.have, backgroundColor: colors.mangoLeaf }]} />
        <View style={[s.seg, { flex: f.gap, backgroundColor: colors.kumkum }]} />
        <View style={{ flex: Math.max(0, 1 - f.have - f.gap) }} />
      </View>
      <View style={s.row}>
        <Small>{cell.want.toLocaleString('en-IN')} want</Small>
        <Small>{cell.have.toLocaleString('en-IN')} {unit}</Small>
        {cell.gap > 0 ? <Text style={s.gap}>gap {cell.gap.toLocaleString('en-IN')}</Text> : <Chip label="covered" tone="ok" />}
      </View>
      {cell.suggestion ? <Text style={s.suggest}>{cell.suggestion}</Text> : null}
      {action}
    </Card>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: t.body, color: colors.ink },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.line, marginVertical: 8 },
  seg: { height: 14 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center', flexWrap: 'wrap' },
  gap: { fontFamily: fonts.bodyBold, fontSize: t.small + 1, color: colors.kumkum },
  suggest: { fontFamily: fonts.body, fontSize: t.body, color: colors.ink, marginTop: 6 },
});
