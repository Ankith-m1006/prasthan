// "Take sweets home": shops near the boarding point -> items with prices + steppers -> pickup time before the bus
// -> confirm -> order id, pickup point, pay at pickup. Saved in "My orders" on this phone.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Partner, TripIntent } from '@contract';
import bpJson from '../../../../../seed/boarding-points.json';
import { api } from '../../api';
import { basketFromAsk, basketLines, basketTotal, departureFor, pickupSlots, rupees, shopsNear, stepQty, type Basket } from '../../lib/gifts';
import { dateLabel } from '../../lib/format';
import { ordersStore, type SavedBasket } from '../../state/orders';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Body, Button, Chip, Glass, H2, Small } from '../../ui/kit';
import { Icon } from '../../ui/icons';
import { Monogram, partnerName } from '../../ui/logos';

const pointName = (id: string) => bpJson.boardingPoints.find((b) => b.id === id)?.name ?? id;

export function GiftFlow({ intent }: { intent: TripIntent }) {
  const [open, setOpen] = useState(Boolean(intent.gift));
  const [near, setNear] = useState<{ shops: Partner[]; exact: boolean; walk: Record<string, number | null> }>({ shops: [], exact: false, walk: {} });
  const [shopId, setShopId] = useState<string | null>(null);
  const [basket, setBasket] = useState<Basket>({});
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<SavedBasket | null>(null);

  useEffect(() => { if (intent.gift) setOpen(true); }, [intent.gift]);
  useEffect(() => {
    if (!open) return;
    const bp = intent.boardingPoint;
    void api.shops(bp)
      .then((r) => setNear({ shops: r.shops.map((x) => x.partner), exact: Boolean(r.shops[0]?.atBoardingPoint), walk: Object.fromEntries(r.shops.map((x) => [x.partner.id, x.walkMinutes])) }))
      .catch(() => api.partners('sweet_shop').then((r) => setNear({ ...shopsNear(r.partners, bp), walk: {} }))) // older api: filter here
      .catch(() => setError('Could not load the shops just now.'));
  }, [open, intent.boardingPoint]);
  const shop = near.shops.find((s) => s.id === shopId) ?? near.shops[0] ?? null;
  useEffect(() => { if (shop) setBasket(basketFromAsk(shop.items ?? [], intent.gift)); }, [shop?.id, intent.gift]); // eslint-disable-line react-hooks/exhaustive-deps
  const depart = departureFor(intent.timeWindow);
  const slots = pickupSlots(depart);
  const lines = basketLines(shop?.items ?? [], basket);
  const total = basketTotal(lines);
  const date = intent.dateFrom ?? '2027-01-14';

  const confirm = async () => {
    if (!shop || !lines.length) return;
    const readyBy = slot ?? slots[slots.length - 1];
    const pickupPoint = shop.boardingPoint ?? intent.boardingPoint ?? 'MAJESTIC';
    setBusy(true); setError(null);
    try {
      // one order, every line (contract v2 items[]); the first line also goes as itemId/qty for older apis
      const r = await api.giftOrder({ travellerId: intent.travellerId, partnerId: shop.id, itemId: lines[0].item.id, qty: lines[0].qty, items: lines.map((l) => ({ itemId: l.item.id, qty: l.qty })), pickupDate: date, readyBy, departTime: depart, pickupPoint, intentId: intent.id });
      const saved = lines.map((l) => ({ orderId: r.order.id, itemId: l.item.id, name: l.item.name, unit: l.item.unit, qty: l.qty, priceInr: l.item.priceInr }));
      const b: SavedBasket = { id: saved[0].orderId, shopId: shop.id, shopName: partnerName(shop.name), pickupPoint, pickupName: pointName(pickupPoint), pickupDate: date, readyBy, lines: saved, total: r.order.totalInr ?? total, status: 'placed', createdAt: new Date().toISOString() };
      ordersStore.add(b);
      setDone(b);
    } catch {
      setError('Could not place the order just now. Please tap Confirm again in a moment.');
    }
    setBusy(false);
  };

  if (!open) {
    return <Button tone="plain" icon={<Icon name="gift" />} label="Take sweets home" hint="pre-order near your boarding point, pay at pickup" onPress={() => setOpen(true)} />;
  }
  if (done) return <Confirmation b={done} onAgain={() => { setDone(null); setBasket({}); }} />;
  return (
    <Glass tintColor={colors.marigold}>
      <View style={s.head}><Icon name="gift" size={28} /><H2>Take sweets home</H2></View>
      <Small>{near.exact ? `Shops at ${pointName(intent.boardingPoint ?? '')}` : 'Nearest shops on your way'} - ready before your {depart} departure</Small>
      <View style={s.chips}>
        {near.shops.map((p) => (
          <View key={p.id} style={s.shopChip}><Monogram name={p.name} id={p.id} size={30} /><Chip label={`${partnerName(p.name)}${near.walk[p.id] ? `, ${near.walk[p.id]} min walk` : ''}`} selected={p.id === shop?.id} onPress={() => { setShopId(p.id); setSlot(null); }} /></View>
        ))}
      </View>
      {(shop?.items ?? []).map((i) => (
        <View key={i.id} style={s.item}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemName}>{i.name}</Text>
            <Small>{rupees(i.priceInr)} / {i.unit}</Small>
          </View>
          <Chip label="-" onPress={() => setBasket(stepQty(basket, i.id, -1))} />
          <Text style={s.qty} accessibilityLabel={`${i.name} quantity`}>{basket[i.id] ?? 0}</Text>
          <Chip label="+" onPress={() => setBasket(stepQty(basket, i.id, 1))} />
        </View>
      ))}
      <Small style={{ marginTop: 10 }}>Pickup time, {dateLabel(date)}</Small>
      <View style={s.chips}>{slots.map((x) => <Chip key={x} label={x} selected={(slot ?? slots[slots.length - 1]) === x} onPress={() => setSlot(x)} />)}</View>
      <Text style={s.total}>{lines.length ? `Total ${rupees(total)} - pay at pickup` : 'Pick at least one item'}</Text>
      {error ? <Body style={{ color: colors.kumkum }}>{error}</Body> : null}
      <Button label={busy ? 'Placing order...' : 'Confirm pre-order'} disabled={busy || !lines.length} onPress={() => void confirm()} />
      <Button tone="plain" label="Not now" onPress={() => setOpen(false)} />
    </Glass>
  );
}

function Confirmation({ b, onAgain }: { b: SavedBasket; onAgain: () => void }) {
  return (
    <Glass tintColor={colors.mangoLeaf}>
      <View style={s.head}><Icon name="gift" size={28} color={colors.mangoLeaf} /><H2>Order placed</H2></View>
      <Text style={s.total} testID="order-id">Order {b.id}</Text>
      <Body>{b.lines.map((l) => `${l.qty} ${l.unit} ${l.name}`).join(', ')} from {b.shopName}.</Body>
      <Body>Pick up at {b.pickupName}, {dateLabel(b.pickupDate)} from {b.readyBy}.</Body>
      <Body style={{ color: colors.mangoLeaf }}>{rupees(b.total)} - pay at pickup. No payment in the app.</Body>
      <View style={s.chips}>
        <Chip label="My orders" onPress={() => router.push('/orders')} />
        <Chip label="Order more" tone="soft" onPress={onAgain} />
      </View>
    </Glass>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  shopChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  itemName: { fontFamily: fonts.bodyBold, fontSize: t.body, color: colors.ink },
  qty: { fontFamily: fonts.bodyBold, fontSize: t.label, color: colors.ink, minWidth: 28, textAlign: 'center' },
  total: { fontFamily: fonts.bodyBold, fontSize: t.label, color: colors.ink, marginVertical: 8 },
});
