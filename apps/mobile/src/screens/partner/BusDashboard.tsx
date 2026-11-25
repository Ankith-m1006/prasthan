// Bus operator dashboard: demand vs seats per date for each route (gap in red), "Add buses" -> waiting travellers notified.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { AddServicesRequest, DemandCell, Partner } from '@contract';
import routesJson from '../../../../../seed/routes.json';
import { api } from '../../api';
import { dateLabel } from '../../lib/format';
import { pollAlerts, rememberAlert } from '../../state/alerts';
import { Banner, Body, Button, Chip, H2, Screen, Small } from '../../ui/kit';
import { partnerName } from '../../ui/logos';
import { AddBuses } from '../partners/AddBuses';
import { Bars } from './Bars';
import { demandBars, routesIn } from './logic';

const toName = (id: string) => routesJson.routes.find((r) => r.id === id)?.to ?? id;

export function BusDashboard({ partner }: { partner: Partner }) {
  const [cells, setCells] = useState<DemandCell[] | null>(null);
  const [route, setRoute] = useState<string | null>(null);
  const [adding, setAdding] = useState<DemandCell | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setCells((await api.demand(partner.id)).cells); } catch { setCells([]); setToast('Could not reach the demand board just now. Please try again in a moment.'); }
  }, [partner.id]);
  useEffect(() => { void load(); }, [load]);
  const routes = routesIn(cells ?? []);
  const current = route ?? routes[0] ?? null;
  const gaps = (cells ?? []).filter((c) => c.routeId === current && c.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 4);

  const add = async (r: AddServicesRequest) => {
    try {
      const res = await api.addServices(partner.id, r);
      rememberAlert(res.alert);
      setToast(`${r.count} buses added. ${res.notified} waiting travellers notified.`);
      setAdding(null);
      await load();
      void pollAlerts();
    } catch {
      setToast('Could not add buses just now. Please tap Add buses again in a moment.');
    }
  };

  return (
    <Screen demoTag title={partnerName(partner.name)} subtitle="Travellers who want to go home vs the seats you run.">
      {toast ? <Banner text={toast} tone={toast.startsWith('Could not') ? 'danger' : 'ok'} /> : null}
      {cells === null ? <Body>Loading demand...</Body> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {routes.map((r) => <Chip key={r} label={`BLR -> ${toName(r)}`} selected={r === current} onPress={() => { setRoute(r); setAdding(null); }} />)}
      </View>
      {current ? (
        <>
          <H2>Demand vs seats, BLR -&gt; {toName(current)}</H2>
          <Bars testID="bus-chart" bars={demandBars(cells ?? [], current, (d) => dateLabel(d))} unit="want" compareUnit="seats" />
          <H2>Biggest gaps</H2>
          {gaps.length === 0 ? <Small>No gap on this route: every traveller has a seat.</Small> : null}
          {gaps.map((c) => adding?.key === c.key ? <AddBuses key={c.key} cell={c} onSubmit={(r) => void add(r)} onCancel={() => setAdding(null)} /> : (
            <View key={c.key} style={{ marginVertical: 6 }}>
              <Body>{c.label}: {c.gap.toLocaleString('en-IN')} travellers without a seat</Body>
              <Button tone="leaf" label="Add buses" hint={c.suggestion ?? undefined} onPress={() => setAdding(c)} />
            </View>
          ))}
        </>
      ) : cells !== null ? <Small>No routes with demand yet.</Small> : null}
    </Screen>
  );
}
