// Festivals ahead and how many travellers already plan to travel in each festival window (seeded forecast).
// Uses GET /v1/festivals when the api has it; else the bundled festival calendar.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import festivalsJson from '../../../../seed/festivals.json';
import forecastJson from '../../../../seed/demand-forecast.json';
import { dateLabel } from '../../src/lib/format';
import { Body, H2, Screen, Small } from '../../src/ui/kit';
import { Bars } from '../../src/screens/partner/Bars';
import { festivalBars, type FestivalLite } from '../../src/screens/partner/logic';

const LOCAL = festivalsJson.festivals as FestivalLite[];
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const TODAY = '2027-01-05'; // the demo "today" the api uses

export default function PartnerFestivals() {
  const [list, setList] = useState<FestivalLite[]>(LOCAL);
  useEffect(() => {
    if (!BASE || process.env.EXPO_PUBLIC_APP_MOCK === '1') return;
    void fetch(`${BASE}/v1/festivals`).then((r) => (r.ok ? r.json() : null))
      .then((j: { festivals?: FestivalLite[] } | null) => { if (j?.festivals?.length) setList(j.festivals); }).catch(() => undefined);
  }, []);
  const ahead = list.filter((f) => (f.travelWindow?.to ?? f.date) >= TODAY);
  const bars = festivalBars(ahead, forecastJson.cells);
  return (
    <Screen demoTag title="Festivals" subtitle="Plan buses and stock before the rush.">
      <H2>Already planning to travel</H2>
      <Small>Seats wanted inside each festival's travel window (seeded forecast for Sankranti / Pongal week).</Small>
      <Bars testID="festival-chart" bars={bars} unit="want" />
      <H2>Coming up</H2>
      {ahead.map((f) => (
        <View key={f.id} style={{ marginTop: 8 }}>
          <Body style={{ fontWeight: '700' }}>{f.name} - {dateLabel(f.date)}</Body>
          {f.travelWindow ? <Small>Travel window {dateLabel(f.travelWindow.from)} to {dateLabel(f.travelWindow.to)}</Small> : null}
        </View>
      ))}
    </Screen>
  );
}
