// Partners (bus operators): "Festival weeks" strip = demand vs seats over each upcoming festival's rush window on this
// operator's routes, with the gap in red. GET /v1/partners/:id/festival-weeks; offline = same sums from the bundled forecast.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Lang, Partner } from '@contract';
import { dayLabel, offlineWeeks, todayIST, type WindowDemand } from '../../lib/festivals';
import { festivalApi } from '../../state/festivals';
import { colors, fontForText, fonts } from '../../theme/tokens';
import { alpha, frost } from '../../ui/glass';
import { Small } from '../../ui/kit';

const n = (x: number) => x.toLocaleString('en-IN');

export function FestivalWeeks({ partner, version }: { partner: Partner; version: number }) {
  const [weeks, setWeeks] = useState<WindowDemand[]>(() => offlineWeeks(partner, todayIST()));
  useEffect(() => {
    setWeeks(offlineWeeks(partner, todayIST()));
    if (!festivalApi.enabled()) return;
    void festivalApi.get<{ weeks: WindowDemand[] }>(`/v1/partners/${partner.id}/festival-weeks?from=${todayIST()}`)
      .then((r) => { if (Array.isArray(r.weeks)) setWeeks(r.weeks); }).catch(() => undefined);
  }, [partner, version]);
  const withData = weeks.filter((w) => w.days > 0);
  const rest = weeks.filter((w) => w.days === 0);
  return (
    <View style={{ marginTop: 14 }} testID="festival-weeks">
      <Small style={s.head}>Festival weeks: demand vs seats on your routes</Small>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
        {withData.map((w) => {
          const fill = w.want ? 1 - Math.min(1, w.gap / w.want) : 1; // red share = seats still missing on the packed nights
          return (
            <View key={w.festivalId} style={[s.tile, frost(0.6, 14)]}>
              <Text style={s.name}>{w.name}</Text>
              <Small>{dayLabel(w.from)} - {dayLabel(w.to)}</Small>
              <View style={s.bar}><View style={[s.barFill, { width: `${Math.round(fill * 100)}%` }]} /></View>
              <Text style={s.nums}>{n(w.want)} want - {n(w.have)} seats</Text>
              <Text style={[s.gap, w.gap === 0 && { color: colors.mangoLeaf }]}>{w.gap > 0 ? `${n(w.gap)} seats short` : 'Covered'}</Text>
            </View>
          );
        })}
        {rest.length ? (
          <View style={[s.tile, frost(0.45, 14)]}>
            <Text style={s.name}>Later</Text>
            <Small>{rest.slice(0, 4).map((w) => w.name).join(', ')}{rest.length > 4 ? '...' : ''}</Small>
            <Small>Demand forecast opens about 6 weeks before.</Small>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** The new-bus alert as a waiting traveller sees it: Sarvam translation in their language (template if Sarvam is off). */
export function TranslatedAlert({ alertId, fallback, lang }: { alertId: string; fallback: string; lang: Lang }) {
  const [out, setOut] = useState<{ text: string; source: string }>({ text: fallback, source: 'template' });
  useEffect(() => {
    setOut({ text: fallback, source: 'template' });
    if (!festivalApi.enabled() || lang === 'en-IN') return;
    void festivalApi.get<{ text: string; source: string }>(`/v1/alerts/${alertId}/text?lang=${lang}`, 15_000)
      .then((r) => { if (r.text) setOut(r); }).catch(() => undefined);
  }, [alertId, fallback, lang]);
  return (
    <View style={[s.alert, { backgroundColor: alpha(colors.mangoLeaf, 0.1) }]} testID="translated-alert">
      <Small style={s.head}>What waiting travellers see</Small>
      <Text style={[s.alertText, { fontFamily: fontForText(out.text) }]}>{out.text}</Text>
      <Small>{out.source === 'template' ? 'template text' : 'translated by Sarvam AI'}</Small>
    </View>
  );
}

const s = StyleSheet.create({
  head: { letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
  tile: { width: 190, borderRadius: 24, padding: 14 },
  name: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.ink },
  bar: { height: 8, borderRadius: 4, backgroundColor: alpha(colors.kumkum, 0.25), marginTop: 10, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.mangoLeaf },
  nums: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 6 },
  gap: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.kumkum, marginTop: 2 },
  alert: { borderRadius: 22, padding: 14, marginTop: 12 },
  alertText: { fontSize: 18, color: colors.ink, marginVertical: 4 },
});
