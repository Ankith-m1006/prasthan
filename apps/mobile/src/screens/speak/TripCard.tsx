// Trip card: Bengaluru -> town (local script + English), date, time window, mode, people. Every field is tappable.
import { StyleSheet, Text, View } from 'react-native';
import type { Mode, TimeWindow, TripIntent } from '@contract';
import routesJson from '../../../../../seed/routes.json';
import { dateLabel, peopleLabel, WINDOW_LABEL } from '../../lib/format';
import { colors, fontForText, fonts, type as t } from '../../theme/tokens';
import { Chip, Glass, Small } from '../../ui/kit';
import { Icon } from '../../ui/icons';
import { RouteLine } from '../../ui/motifs';

const DATES = ['2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15', '2027-01-16', '2027-01-17'];
const WINDOWS: TimeWindow[] = ['morning', 'evening', 'night', 'any'];
const MODES: Array<Mode | null> = ['bus', 'train', 'air', null];
export const ROUTES = routesJson.routes;

export function TripCard({ intent, onChange }: { intent: TripIntent; onChange: (i: TripIntent) => void }) {
  const route = ROUTES.find((r) => r.id === intent.routeId);
  const set = (patch: Partial<TripIntent>) => {
    const next = { ...intent, ...patch };
    next.needsFollowUp = [...(next.routeId ? [] : ['to' as const]), ...(next.dateFrom ? [] : ['date' as const])];
    onChange(next);
  };
  return (
    <Glass style={{ gap: 10 }}>
      <View style={s.row}>
        <View>
          <Text style={s.city}>ಬೆಂಗಳೂರು</Text>
          <Small>Bengaluru</Small>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 10 }}><RouteLine /></View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.city, { fontFamily: fontForText(route?.toLocal ?? '') }]}>{route?.toLocal ?? '?'}</Text>
          <Small>{route?.to ?? 'Which town?'}</Small>
        </View>
      </View>
      <Small>Town</Small>
      <View style={s.chips}>
        {ROUTES.map((r) => <Chip key={r.id} label={r.to} selected={r.id === intent.routeId} onPress={() => set({ routeId: r.id, to: r.to })} />)}
      </View>
      <Small>Day{intent.dateFrom ? ` - ${dateLabel(intent.dateFrom, intent.language)}` : ''}</Small>
      <View style={s.chips}>
        {DATES.map((d) => <Chip key={d} label={dateLabel(d)} selected={d === intent.dateFrom} onPress={() => set({ dateFrom: d, dateTo: d })} />)}
      </View>
      <Small>Time</Small>
      <View style={s.chips}>
        {WINDOWS.map((w) => <Chip key={w} label={WINDOW_LABEL[w]} selected={w === intent.timeWindow} onPress={() => set({ timeWindow: w })} />)}
      </View>
      <Small>How</Small>
      <View style={s.chips}>
        {MODES.map((m) => <Chip key={m ?? 'any'} label={m ? m[0].toUpperCase() + m.slice(1) : 'Any'} selected={m === intent.mode} onPress={() => set({ mode: m })} />)}
      </View>
      <View style={[s.row, { justifyContent: 'flex-start', gap: 12 }]}>
        <Icon name={intent.mode === 'train' ? 'train' : intent.mode === 'air' ? 'plane' : 'bus'} />
        <Chip label="-" onPress={() => set({ people: Math.max(1, intent.people - 1) })} />
        <Text style={s.people} accessibilityLiveRegion="polite">{peopleLabel(intent.people)}</Text>
        <Chip label="+" onPress={() => set({ people: Math.min(10, intent.people + 1) })} />
      </View>
    </Glass>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  city: { fontFamily: fonts.kannada, fontSize: t.card, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  people: { fontFamily: fonts.bodyBold, fontSize: t.label, color: colors.ink, minWidth: 100, textAlign: 'center' },
});
