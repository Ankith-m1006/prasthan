// Calendar: countdown to the next festival, month view, then the traveller's festivals (region first) and national ones.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dayLabel, localName, splitByMatch, todayIST, type Scored } from '../../src/lib/festivals';
import { FestivalRow } from '../../src/screens/calendar/FestivalRow';
import { MonthView } from '../../src/screens/calendar/MonthView';
import { useFestivals, useNextFestival } from '../../src/state/festivals';
import { useProfile } from '../../src/state/profile';
import { colors, fonts } from '../../src/theme/tokens';
import { Body, H2, Screen, Small } from '../../src/ui/kit';

const SOURCE: Record<string, string> = { flagsmith: 'calendar: live from Flagsmith', file: 'calendar: festival file', fallback: 'calendar: built-in list', bundled: 'calendar: saved on this phone' };

export default function Calendar() {
  const profile = useProfile();
  const { list, source } = useFestivals();
  const next = useNextFestival();
  const today = todayIST();
  const [month, setMonth] = useState<string | null>(null);
  const shown = month ?? (next?.festival.date ?? today).slice(0, 7);
  const { mine, national } = splitByMatch(list);
  const lang = profile?.language ?? 'en-IN';
  const plan = (f: Scored) => router.push({ pathname: '/plan', params: { festival: f.id } });
  const where = profile ? [profile.region, profile.homeState].filter(Boolean).join(', ') : 'your state';
  return (
    <Screen title="Festivals" subtitle={`Going home for the festivals - ${where}`}>
      {next ? (
        <View style={s.count} testID="countdown">
          <Text style={s.countNum}>{Math.max(0, next.daysLeft)}</Text>
          <View style={{ flexShrink: 1 }}>
            <Text style={s.countText}>{next.daysLeft <= 0 ? `${next.festival.name} is today` : `day${next.daysLeft === 1 ? '' : 's'} to ${next.festival.name}`}</Text>
            <Small>Rush days start {dayLabel(next.festival.rush.from)}. Book before then.</Small>
          </View>
        </View>
      ) : null}
      <MonthView month={shown} onMonth={setMonth} festivals={list} today={today} onPick={(f) => setMonth(f.date.slice(0, 7))} />
      <Small style={{ textAlign: 'center', marginTop: 6 }}>{SOURCE[source] ?? source}. Lunar dates can move by a day.</Small>
      <H2>Your festivals</H2>
      {mine.length === 0 ? <Body>No regional festivals for {where} in the next months.</Body> : null}
      {mine.map((f) => <FestivalRow key={f.id} f={f} local={localName(f, lang)} onPlan={() => plan(f)} />)}
      <H2>National</H2>
      {national.map((f) => <FestivalRow key={f.id} f={f} local={localName(f, lang)} onPlan={() => plan(f)} />)}
    </Screen>
  );
}

const s = StyleSheet.create({
  count: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  countNum: { fontFamily: fonts.bodyBold, fontSize: 54, color: colors.kumkum, lineHeight: 60 },
  countText: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.ink },
});
