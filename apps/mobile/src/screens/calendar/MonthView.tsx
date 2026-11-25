// Month view: a 7-column grid; festival days get a dot (red = yours, gold = national), rush days a soft wash.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { monthGrid, monthTitle, shiftMonth, type Scored } from '../../lib/festivals';
import { colors, fonts } from '../../theme/tokens';
import { alpha, frost } from '../../ui/glass';
import { Chip } from '../../ui/kit';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MonthView({ month, onMonth, festivals, today, onPick }: { month: string; onMonth: (m: string) => void; festivals: Scored[]; today: string; onPick: (f: Scored) => void }) {
  const byDay = new Map<string, Scored>();
  for (const f of festivals) if (!byDay.has(f.date) || f.match !== 'national') byDay.set(f.date, f);
  const rush = (d: string) => festivals.some((f) => d >= f.rush.from && d <= f.rush.to);
  return (
    <View style={[s.wrap, frost(0.55, 16)]} testID="month-view">
      <View style={s.head}>
        <Chip label="<" onPress={() => onMonth(shiftMonth(month, -1))} />
        <Text style={s.title}>{monthTitle(month)}</Text>
        <Chip label=">" onPress={() => onMonth(shiftMonth(month, 1))} />
      </View>
      <View style={s.row}>{WD.map((w, i) => <Text key={i} style={s.wd}>{w}</Text>)}</View>
      {monthGrid(month).map((week, i) => (
        <View key={i} style={s.row}>
          {week.map((d, j) => {
            const f = d ? byDay.get(d) : undefined;
            return (
              <Pressable key={j} disabled={!f} onPress={() => f && onPick(f)} accessibilityLabel={f ? `${f.name}, ${d}` : d ?? undefined}
                style={[s.cell, d && rush(d) ? { backgroundColor: alpha(colors.marigold, 0.14) } : null, d === today ? s.today : null]}>
                <Text style={[s.day, !d && { opacity: 0 }, f && { fontFamily: fonts.bodyBold, color: f.match === 'national' ? colors.ink : colors.kumkum }]}>{d ? Number(d.slice(8)) : '.'}</Text>
                {f ? <View style={[s.dot, { backgroundColor: f.match === 'national' ? colors.marigold : colors.kumkum }]} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text style={s.key}>Red = your festival, gold = national, soft wash = rush days</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 28, padding: 14, marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink },
  row: { flexDirection: 'row' },
  wd: { flex: 1, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, paddingVertical: 4 },
  cell: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  today: { borderWidth: 1.5, borderColor: colors.ink },
  day: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  key: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, textAlign: 'center', marginTop: 8 },
});
