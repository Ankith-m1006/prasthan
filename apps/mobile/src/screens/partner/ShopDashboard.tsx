// Sweet shop dashboard: pre-orders per day and per pickup point, top items, customers, and the order list.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { GiftOrder, Partner, PickupCell } from '@contract';
import bpJson from '../../../../../seed/boarding-points.json';
import { api } from '../../api';
import { dateLabel } from '../../lib/format';
import { Banner, Body, H2, Screen, Small } from '../../ui/kit';
import { partnerName } from '../../ui/logos';
import { Bars } from './Bars';
import { customerCount, shopBars } from './logic';
import { OrderList } from './OrderList';

export const pointName = (id: string) => bpJson.boardingPoints.find((b) => b.id === id)?.name.split(' (')[0] ?? id;

/** Loads a shop's pickup cells + orders; shared by the dashboard and the Orders tab. */
export function useShopData(partnerId: string) {
  const [cells, setCells] = useState<PickupCell[] | null>(null);
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const [p, o] = await Promise.all([api.pickups(partnerId), api.orders(partnerId)]);
      setCells(p.cells); setOrders(o.orders); setError(null);
    } catch {
      setCells([]); setError('Could not load orders just now. Pull again in a moment.');
    }
  }, [partnerId]);
  useEffect(() => { void load(); }, [load]);
  return { cells, orders, setOrders, error, reload: load };
}

export function ShopDashboard({ partner }: { partner: Partner }) {
  const { cells, orders, setOrders, error, reload } = useShopData(partner.id);
  const bars = shopBars(cells ?? [], (d) => dateLabel(d), pointName);
  const open = orders.filter((o) => o.status === 'placed' || o.status === 'ready').length;
  return (
    <Screen demoTag title={partnerName(partner.name)} subtitle="Pre-orders from travellers leaving from your boarding point. Pay at pickup.">
      {error ? <Banner text={error} /> : null}
      {cells === null ? <Body>Loading orders...</Body> : null}
      <View style={{ flexDirection: 'row', gap: 28, marginTop: 8, flexWrap: 'wrap' }}>
        <Stat n={orders.length} label="pre-orders" />
        <Stat n={customerCount(orders)} label="customers" />
        <Stat n={open} label="to get ready" />
      </View>
      <H2>Pre-orders per day</H2>
      <Bars testID="shop-chart-day" bars={bars.perDay} unit="orders" />
      <H2>Per pickup point</H2>
      <Bars bars={bars.perPoint} unit="orders" />
      <H2>Top items</H2>
      <Bars bars={bars.top} unit="" />
      <H2>Orders</H2>
      <OrderList partner={partner} orders={orders} onChange={(next) => { setOrders(next); void reload(); }} />
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View>
      <Body style={{ fontSize: 30, lineHeight: 38, fontWeight: '700' }}>{n.toLocaleString('en-IN')}</Body>
      <Small>{label}</Small>
    </View>
  );
}
