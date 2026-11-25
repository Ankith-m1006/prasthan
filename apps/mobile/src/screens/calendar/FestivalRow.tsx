// One festival in the list: date, name, a short line, rush days, a travel tip, "Plan my trip home". No card: a soft rule between rows.
import { StyleSheet, Text, View } from 'react-native';
import { dayLabel, rushLabel, type Scored } from '../../lib/festivals';
import { colors, fontForText, fonts } from '../../theme/tokens';
import { SoftRule } from '../../ui/backdrop';
import { Button, Small } from '../../ui/kit';

export function FestivalRow({ f, local, onPlan }: { f: Scored; local?: string; onPlan: () => void }) {
  return (
    <View style={s.row} testID={`festival-${f.id}`}>
      <View style={s.top}>
        <Text style={s.date}>{dayLabel(f.date)}</Text>
        {!f.verified ? <Text style={s.unverified}>date to confirm</Text> : null}
      </View>
      <Text style={s.name}>{f.name}{local ? <Text style={[s.local, { fontFamily: fontForText(local) }]}>{`  ${local}`}</Text> : null}</Text>
      {f.line ? <Small>{f.line}</Small> : null}
      <Text style={s.rush}>{rushLabel(f)}</Text>
      {f.tips[0] ? <Small style={{ marginBottom: 8 }}>Tip: {f.tips[0]}</Small> : null}
      <Button tone="leaf" label="Plan my trip home" onPress={onPlan} />
      <SoftRule />
    </View>
  );
}

const s = StyleSheet.create({
  row: { marginTop: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  date: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', color: colors.marigoldDeep },
  unverified: { fontFamily: fonts.body, fontSize: 12, color: colors.kumkum },
  name: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.ink, marginVertical: 2 },
  local: { fontSize: 18, color: colors.inkSoft },
  rush: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.kumkum, marginVertical: 4 },
});
