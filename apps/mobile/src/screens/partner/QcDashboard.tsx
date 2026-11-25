// Quick commerce dashboard (roadmap): departing travellers per boarding point and day, and what they ask for. Seeded.
import { useState } from 'react';
import { View } from 'react-native';
import type { Partner } from '@contract';
import qcJson from '../../../../../seed/qc-demand.json';
import { dateLabel } from '../../lib/format';
import { colors } from '../../theme/tokens';
import { Body, Chip, Glass, H2, Screen, Small } from '../../ui/kit';
import { partnerName } from '../../ui/logos';
import { Bars } from './Bars';
import { pointName } from './ShopDashboard';

interface QcCell { zone: string; date: string; window: string; travellersLeaving: number; topAsks: string[] }
const CELLS = (qcJson.cells as QcCell[]).filter((c) => typeof c.travellersLeaving === 'number');
const DATES = [...new Set(CELLS.map((c) => c.date))].sort();

export function QcDashboard({ partner }: { partner: Partner }) {
  const [date, setDate] = useState(DATES[DATES.length - 1] ?? '');
  const day = CELLS.filter((c) => c.date === date);
  const asks = new Map<string, number>();
  for (const c of day) for (const a of c.topAsks) asks.set(a, (asks.get(a) ?? 0) + c.travellersLeaving);
  return (
    <Screen demoTag title={partnerName(partner.name)} subtitle="Where festive travellers leave from, and what they want before the bus.">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{DATES.map((d) => <Chip key={d} label={dateLabel(d)} selected={d === date} onPress={() => setDate(d)} />)}</View>
      <H2>Travellers leaving, per boarding point</H2>
      <Bars testID="qc-chart" bars={day.map((c) => ({ key: c.zone, label: `${pointName(c.zone)} (${c.window})`, value: c.travellersLeaving }))} unit="people" />
      <H2>What they ask for</H2>
      <Bars bars={[...asks.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: k, value: v }))} unit="asks" />
      <Glass tintColor={colors.marigold}>
        <Body>Roadmap: doorstep delivery before departure, pickup near the boarding point, and the shift of demand to the hometown on festival morning.</Body>
        <Small>Seeded demo numbers. No partner APIs, no scraping.</Small>
      </Glass>
    </Screen>
  );
}
