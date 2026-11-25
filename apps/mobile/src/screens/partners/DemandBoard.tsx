// One demand board for every partner type: rows of DemandCell with a want-vs-have bar, the gap in kumkum, a suggestion.
import { StyleSheet, Text, View } from 'react-native';
import type { DemandCell } from '@contract';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Chip, Section, Small } from '../../ui/kit';
import { SoftRule } from '../../ui/backdrop';
import { alpha } from '../../ui/glass';

export function fill(cell: Pick<DemandCell, 'want' | 'have'>): { have: number; gap: number } {
  const max = Math.max(cell.want, cell.have, 1);
  const have = Math.min(cell.have, cell.want || cell.have) / max;
  return { have, gap: Math.max(0, cell.want - cell.have) / max };
}

export function DemandRow({ cell, unit, action }: { cell: DemandCell; unit: string; action?: React.ReactNode }) {
  const f = fill(cell);
  return (
    <Section style={{ paddingVertical: 4 }}>
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
      {action ? <View style={{ alignSelf: 'flex-start' }}>{action}</View> : null}
      <SoftRule />
    </Section>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: t.body, color: colors.ink },
  bar: { flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', backgroundColor: alpha(colors.templeStone, 0.14), marginVertical: 10 },
  seg: { height: 12, borderRadius: 999 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center', flexWrap: 'wrap' },
  gap: { fontFamily: fonts.bodyBold, fontSize: t.small + 1, color: colors.kumkum },
  suggest: { fontFamily: fonts.body, fontSize: t.body, color: colors.ink, marginTop: 6 },
});
