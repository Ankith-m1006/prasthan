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
import { pollAlerts, rememberAlert } from '../../src/state/alerts';
import { useFlags } from '../../src/state/flags';
import { getIdentity, partnerTraits, setIdentity } from '../../src/state/identity';
import { dateLabel } from '../../src/lib/format';
import { colors } from '../../src/theme/tokens';
import { Banner, Body, Button, Chip, Glass, H2, Screen, Section, Small } from '../../src/ui/kit';
import { SoftRule } from '../../src/ui/backdrop';
import { Icon } from '../../src/ui/icons';
import { Monogram, partnerName, SiteLogo } from '../../src/ui/logos';
import { mergeOrders, pickupCells } from '../../src/lib/gifts';
import { basketOrders, ordersStore } from '../../src/state/orders';
import bpJson from '../../../../seed/boarding-points.json';

const pointName = (id: string) => bpJson.boardingPoints.find((b) => b.id === id)?.name.split(' (')[0] ?? id;

const GROUPS: Array<[PartnerType, string]> = [['bus_operator', 'Bus operators'], ['sweet_shop', 'Sweet shops'], ['quick_commerce', 'Quick commerce (roadmap)']];
const DATES = ['2027-01-12', '2027-01-13', '2027-01-14', '2027-01-15', '2027-01-16', '2027-01-17'];
const UNIT: Record<PartnerType, string> = { bus_operator: 'seats', sweet_shop: 'capacity', quick_commerce: 'served' };
const SOFT_FAIL = 'Could not reach the demand board just now. Please try again in a moment.';

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

  useEffect(() => { void api.partners().then((r) => setPartners(r.partners)).catch(() => setToast(SOFT_FAIL)); }, []);
  useFocusEffect(useCallback(() => {
    if (getIdentity().partner) setIdentity({ mode: 'partner' });
    return () => setIdentity({ mode: 'traveller' });
  }, []));

  const load = useCallback(async (p: Partner, d?: string) => {
    try {
      setBoard(await api.demand(p.id, d));
      if (p.type === 'sweet_shop') setOrders(mergeOrders((await api.orders(p.id)).orders, basketOrders(ordersStore.all(), getIdentity().traveller).filter((o) => o.partnerId === p.id)));
    } catch {
      setToast(SOFT_FAIL);
    }
  }, []);

  const pick = async (p: Partner) => {
    setCurrent(p); setToast(null); setAdding(null);
    setIdentity({ partner: { id: p.id, type: p.type }, mode: 'partner' });
    await api.identify(p.id, partnerTraits(p.id, p.type)).catch(() => undefined);
    await refresh().catch(() => undefined);
    const d = p.type === 'quick_commerce' ? undefined : date;
    await load(p, d);
  };
  useEffect(() => { if (current) void load(current, current.type === 'quick_commerce' ? undefined : date); }, [date, current, load]);

  const add = async (r: AddServicesRequest) => {
    if (!current) return;
    try {
      const res = await api.addServices(current.id, r);
      rememberAlert(res.alert);
      setToast(`${r.count} buses added. ${res.notified} waiting travellers notified.`);
      setAdding(null);
      await load(current, date);
      void pollAlerts();
    } catch {
      setToast('Could not add buses just now. Please tap Add buses again in a moment.');
    }
  };

  const showBoard = current && (current.type === 'bus_operator' || (current.type === 'sweet_shop' && flags.shop_orders_view) || (current.type === 'quick_commerce' && flags.quick_commerce_view));
  return (
    <Screen demoTag title="Partners" subtitle="One demand board for every business.">
      {GROUPS.map(([type, name]) => (
        <View key={type}>
          <Small style={s.group}>{name}</Small>
          <View style={s.chips}>{partners.filter((p) => p.type === type).map((p) => <View key={p.id} style={s.partner}><Monogram name={p.name} id={p.id} size={34} /><Chip label={partnerName(p.name)} selected={p.id === current?.id} onPress={() => void pick(p)} /></View>)}</View>
        </View>
      ))}
      {toast ? <View style={{ marginTop: 16 }}><Banner text={toast} tone={toast.startsWith('Could not') ? 'danger' : 'ok'} /></View> : null}
      {current ? (
        <>
          <View style={s.groupHead}><Monogram name={current.name} id={current.id} size={44} /><H2>{partnerName(current.name)}</H2></View>
          {current.type !== 'quick_commerce' ? (
            <View style={[s.chips, { marginTop: 8 }]}>
              {DATES.map((d) => <Chip key={d} label={dateLabel(d)} selected={d === date} onPress={() => setDate(d)} />)}
              <Chip label="All days" selected={!date} onPress={() => setDate(undefined)} />
            </View>
          ) : null}
        </>
      ) : <Body style={{ marginTop: 12 }}>Pick a business above to see its demand.</Body>}
      {current && !showBoard ? <Section><Body>Coming soon for this business type.</Body></Section> : null}
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
  const cells = pickupCells(orders, partner);
  return (
    <View>
      <H2>Incoming pre-orders ({orders.length})</H2>
      <Small>What to have ready, per pickup point and day. Travellers pay at pickup.</Small>
      {cells.map((c) => (
        <View key={`${c.pickupDate}|${c.pickupPoint}`} style={{ marginTop: 14 }}>
          <View style={s.groupHead}><Icon name="pin" size={20} /><Body style={{ fontWeight: '700' }}>{pointName(c.pickupPoint)} - {dateLabel(c.pickupDate)}</Body></View>
          <Body>{c.items.map((x) => `${x.qty} ${x.unit} ${x.name}`).join(', ')}</Body>
          <Small>{c.orders} order{c.orders === 1 ? '' : 's'}, first pickup {c.firstReadyBy}, Rs {c.totalInr.toLocaleString('en-IN')} to collect</Small>
          <SoftRule />
        </View>
      ))}
    </View>
  );
}

function QcRoadmap() {
  return (
    <Glass tintColor={colors.marigold}>
      <H2>Roadmap: quick-commerce partners</H2>
      <Body>Where and when festive travellers leave, and what they want before departure: doorstep before leaving, pickup near the boarding point, and the shift of demand to the hometown on festival morning.</Body>
      <Small>The kind of partner we mean (text links only, no partnership implied):</Small>
      <View style={[s.chips, { marginTop: 6 }]}>{linksJson.quickCommerce.names.map((n) => <View key={n.name} style={s.partner}><SiteLogo id={n.name} size={26} /><Chip label={n.name} onPress={() => openLink(n.homepage)} /></View>)}</View>
    </Glass>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 40, marginTop: 8 },
  col: { width: '47%' },
  partner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  group: { marginTop: 14, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
});
