// Partners: pick a business (bus operator / sweet shop / quick commerce) -> one demand board; operators add buses.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { AddServicesRequest, DemandResponse, GiftOrder, Partner, PartnerType } from '@contract';
import linksJson from '../../../../seed/deep-links.json';
import { api } from '../../src/api';
import { AddBuses } from '../../src/screens/partners/AddBuses';
import { DemandRow } from '../../src/screens/partners/DemandBoard';
import { openLink } from '../../src/screens/speak/Options';
import { pollAlerts } from '../../src/state/alerts';
import { useFlags } from '../../src/state/flags';
import { getIdentity, partnerTraits, setIdentity } from '../../src/state/identity';
import { dateLabel } from '../../src/lib/format';
import { colors } from '../../src/theme/tokens';
import { Banner, Body, Button, Card, Chip, H2, Screen, Small } from '../../src/ui/kit';

const GROUPS: Array<[PartnerType, string]> = [['bus_operator', 'Bus operators'], ['sweet_shop', 'Sweet shops'], ['quick_commerce', 'Quick commerce (roadmap)']];
const DATES = ['2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15', '2027-01-16', '2027-01-17'];
const UNIT: Record<PartnerType, string> = { bus_operator: 'seats', sweet_shop: 'capacity', quick_commerce: 'served' };

export default function Partners() {
  const { flags, refresh } = useFlags();
  const wide = useWindowDimensions().width >= 900;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [current, setCurrent] = useState<Partner | null>(null);
  const [date, setDate] = useState<string | undefined>('2027-01-14');
  const [board, setBoard] = useState<DemandResponse | null>(null);
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { void api.partners().then((r) => setPartners(r.partners)); }, []);
  useFocusEffect(useCallback(() => {
    if (getIdentity().partner) setIdentity({ mode: 'partner' });
    return () => setIdentity({ mode: 'traveller' });
  }, []));

  const load = useCallback(async (p: Partner, d?: string) => {
    setBoard(await api.demand(p.id, d));
    if (p.type === 'sweet_shop') setOrders((await api.orders(p.id)).orders);
  }, []);

  const pick = async (p: Partner) => {
    setCurrent(p); setToast(null); setAdding(null);
    setIdentity({ partner: { id: p.id, type: p.type }, mode: 'partner' });
    await api.identify(p.id, partnerTraits(p.id, p.type));
    await refresh();
    const d = p.type === 'quick_commerce' ? undefined : date;
    await load(p, d);
  };
  useEffect(() => { if (current) void load(current, current.type === 'quick_commerce' ? undefined : date); }, [date, current, load]);

  const add = async (r: AddServicesRequest) => {
    if (!current) return;
    try {
      const res = await api.addServices(current.id, r);
      setToast(`${r.count} buses added. ${res.notified} waiting travellers notified.`);
      setAdding(null);
      await load(current, date);
      void pollAlerts();
    } catch {
      setToast('Could not add buses (is operator_add_service on for this operator?)');
    }
  };

  const showBoard = current && (current.type === 'bus_operator' || (current.type === 'sweet_shop' && flags.shop_orders_view) || (current.type === 'quick_commerce' && flags.quick_commerce_view));
  return (
    <Screen title="Partners" subtitle="One demand board for every business. Seeded demo data.">
      {GROUPS.map(([type, name]) => (
        <View key={type}>
          <Small style={{ marginTop: 8 }}>{name}</Small>
          <View style={s.chips}>{partners.filter((p) => p.type === type).map((p) => <Chip key={p.id} label={p.name} selected={p.id === current?.id} onPress={() => void pick(p)} />)}</View>
        </View>
      ))}
      {toast ? <View style={{ marginTop: 12 }}><Banner text={toast} /></View> : null}
      {current ? (
        <>
          <H2>{current.name}</H2>
          <Chip label="Seeded demo data" tone="soft" />
          {current.type !== 'quick_commerce' ? (
            <View style={[s.chips, { marginTop: 8 }]}>
              {DATES.map((d) => <Chip key={d} label={dateLabel(d)} selected={d === date} onPress={() => setDate(d)} />)}
              <Chip label="All days" selected={!date} onPress={() => setDate(undefined)} />
            </View>
          ) : null}
        </>
      ) : <Body style={{ marginTop: 12 }}>Pick a business above to see its demand.</Body>}
      {current && !showBoard ? <Card><Body>Coming soon for this business type.</Body></Card> : null}
      {showBoard && board ? (
        <View style={wide ? s.grid : undefined}>
          {board.cells.length === 0 ? <Small>No demand rows for this day.</Small> : null}
          {board.cells.map((c) => (
            <View key={c.key} style={wide ? s.col : undefined}>
              {adding === c.key ? <AddBuses cell={c} onSubmit={(r) => void add(r)} onCancel={() => setAdding(null)} /> : (
                <DemandRow cell={c} unit={UNIT[current.type]} action={current.type === 'bus_operator' && flags.operator_add_service && c.gap > 0
                  ? <Button tone="leaf" label="Add buses" onPress={() => setAdding(c.key)} /> : null} />
              )}
            </View>
          ))}
        </View>
      ) : null}
      {current?.type === 'sweet_shop' && flags.shop_orders_view ? <Orders orders={orders} partner={current} /> : null}
      {current?.type === 'quick_commerce' ? <QcRoadmap /> : null}
    </Screen>
  );
}

function Orders({ orders, partner }: { orders: GiftOrder[]; partner: Partner }) {
  return (
    <View>
      <H2>Pre-orders ({orders.length})</H2>
      {orders.slice(0, 12).map((o) => (
        <Card key={o.id}>
          <Body>{o.qty} {partner.items?.find((i) => i.id === o.itemId)?.unit ?? 'kg'} {partner.items?.find((i) => i.id === o.itemId)?.name ?? o.itemId}</Body>
          <Small>pickup {o.pickupPoint}, {dateLabel(o.pickupDate)} by {o.readyBy} - {o.status} - pay at pickup (demo)</Small>
        </Card>
      ))}
    </View>
  );
}

function QcRoadmap() {
  return (
    <Card edge={colors.marigold}>
      <H2>Roadmap: quick-commerce partners</H2>
      <Body>Where and when festive travellers leave, and what they want before departure: doorstep before leaving, pickup near the boarding point, and the shift of demand to the hometown on festival morning.</Body>
      <Small>The kind of partner we mean (text links only, no partnership implied):</Small>
      <View style={[s.chips, { marginTop: 6 }]}>{linksJson.quickCommerce.names.map((n) => <Chip key={n.name} label={n.name} onPress={() => openLink(n.homepage)} />)}</View>
    </Card>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { width: '48.5%' },
});
