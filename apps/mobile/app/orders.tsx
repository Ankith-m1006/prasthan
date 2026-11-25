// My orders: sweets pre-orders placed from this phone (saved on this device). Pay at pickup; no payment in the app.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { dateLabel } from '../src/lib/format';
import { rupees } from '../src/lib/gifts';
import { useOrders } from '../src/state/orders';
import { colors, fonts, type as t } from '../src/theme/tokens';
import { Body, Button, Chip, Screen, Small } from '../src/ui/kit';
import { SoftRule } from '../src/ui/backdrop';
import { Monogram } from '../src/ui/logos';

const STATUS: Record<string, string> = { placed: 'Placed', ready: 'Ready for pickup', picked_up: 'Picked up', cancelled: 'Cancelled' };

export default function MyOrders() {
  const orders = useOrders();
  return (
    <Screen title="My orders" subtitle="Sweets to take home. Pay at pickup.">
      {orders.length === 0 ? <Body>No orders yet. Say your trip home, then tap "Take sweets home".</Body> : null}
      {orders.map((b) => (
        <View key={b.id} style={s.item}>
          <View style={s.row}>
            <Monogram name={b.shopName} id={b.shopId} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{b.shopName}</Text>
              <Small>Order {b.id}</Small>
            </View>
            <Chip label={STATUS[b.status] ?? b.status} tone={b.status === 'cancelled' ? 'warn' : 'ok'} />
          </View>
          <Body>{b.lines.map((l) => `${l.qty} ${l.unit} ${l.name}`).join(', ')}</Body>
          <Small>Pick up at {b.pickupName}, {dateLabel(b.pickupDate)} from {b.readyBy} - {rupees(b.total)}, pay at pickup</Small>
          <SoftRule />
        </View>
      ))}
      <Button tone="plain" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Screen>
  );
}

const s = StyleSheet.create({
  item: { paddingVertical: 8, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.bodyBold, fontSize: t.body, color: colors.ink },
});
