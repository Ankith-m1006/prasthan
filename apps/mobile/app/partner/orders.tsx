// Orders (sweet shops) / Customers (operators, quick commerce).
import { useEffect, useState } from 'react';
import type { DemandCell, Partner } from '@contract';
import { api } from '../../src/api';
import { useRole } from '../../src/state/role';
import { Banner, Body, H2, Screen, Small } from '../../src/ui/kit';
import { OrderList } from '../../src/screens/partner/OrderList';
import { useShopData } from '../../src/screens/partner/ShopDashboard';
import { customerCount } from '../../src/screens/partner/logic';

export default function PartnerOrders() {
  const { partner } = useRole();
  if (!partner) return null;
  return partner.type === 'sweet_shop' ? <ShopOrders partner={partner} /> : <Waiting partner={partner} />;
}

function ShopOrders({ partner }: { partner: Partner }) {
  const { orders, setOrders, error, reload } = useShopData(partner.id);
  return (
    <Screen demoTag title="Orders" subtitle={`${orders.length} pre-orders from ${customerCount(orders)} customers. Pay at pickup.`}>
      {error ? <Banner text={error} /> : null}
      <OrderList partner={partner} orders={orders} limit={50} onChange={(next) => { setOrders(next); void reload(); }} />
    </Screen>
  );
}

function Waiting({ partner }: { partner: Partner }) {
  const [cells, setCells] = useState<DemandCell[] | null>(null);
  useEffect(() => { void api.demand(partner.id).then((r) => setCells(r.cells)).catch(() => setCells([])); }, [partner.id]);
  const gaps = (cells ?? []).filter((c) => c.gap > 0).sort((a, b) => b.gap - a.gap);
  const total = gaps.reduce((a, c) => a + c.gap, 0);
  return (
    <Screen demoTag title="Customers" subtitle="Travellers who want to go and have no seat or order yet. Only totals, never names.">
      {cells === null ? <Body>Loading...</Body> : null}
      <H2>{total.toLocaleString('en-IN')} waiting</H2>
      {gaps.map((c) => <Small key={c.key}>{c.label}: {c.gap.toLocaleString('en-IN')} waiting{c.suggestion ? ` - ${c.suggestion}` : ''}</Small>)}
      {cells !== null && !gaps.length ? <Small>Nobody waiting right now.</Small> : null}
    </Screen>
  );
}
