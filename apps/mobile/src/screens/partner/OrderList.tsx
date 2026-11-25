// A shop's orders with pill status buttons: Mark ready -> Picked up (POST /v1/gifts/orders/:id/status).
import { useState } from 'react';
import { View } from 'react-native';
import type { GiftOrder, Partner } from '@contract';
import { dateLabel } from '../../lib/format';
import { Button, Chip, Small, Body } from '../../ui/kit';
import { SoftRule } from '../../ui/backdrop';
import { setOrderStatus } from './api';

const STATUS_LABEL: Record<GiftOrder['status'], string> = { placed: 'New', ready: 'Ready', picked_up: 'Picked up', cancelled: 'Cancelled' };
const ORDER: Record<GiftOrder['status'], number> = { ready: 0, placed: 1, picked_up: 2, cancelled: 3 }; // ready first: what to hand over now

export function OrderList({ partner, orders, onChange, limit = 12 }: { partner: Partner; orders: GiftOrder[]; onChange: (o: GiftOrder[]) => void; limit?: number }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemName = (id: string) => partner.items?.find((i) => i.id === id)?.name ?? id;
  // ready first, then live orders newest first, then seeded ones by pickup day
  const sorted = [...orders].sort((a, b) => ORDER[a.status] - ORDER[b.status] || (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || a.pickupDate.localeCompare(b.pickupDate) || a.readyBy.localeCompare(b.readyBy)).slice(0, limit);

  const move = async (o: GiftOrder, status: GiftOrder['status']) => {
    setBusy(o.id); setError(null);
    try {
      await setOrderStatus(o.id, status);
      onChange(orders.map((x) => (x.id === o.id ? { ...x, status } : x)));
    } catch (e) {
      if (/seeded/i.test((e as Error).message)) { // seeded demo orders are read-only on the api: show the change on this device
        onChange(orders.map((x) => (x.id === o.id ? { ...x, status } : x)));
        setError('Seeded demo order: status changed on this device only. Live orders update for the traveller too.');
      } else setError('Could not update that order just now. Please tap again.');
    } finally {
      setBusy(null);
    }
  };

  if (!orders.length) return <Small>No pre-orders yet. They appear here as travellers order.</Small>;
  return (
    <View testID="order-list">
      {error ? <Small style={{ color: '#B3302B' }}>{error}</Small> : null}
      {sorted.map((o) => {
        const lines = (o.items?.length ? o.items : [{ itemId: o.itemId, qty: o.qty, unit: '' }]).map((l) => `${l.qty} ${l.unit ?? ''} ${itemName(l.itemId)}`.replace(/\s+/g, ' ')).join(', ');
        return (
          <View key={o.id} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Body style={{ fontWeight: '700' }}>{o.id}</Body>
              <Chip label={STATUS_LABEL[o.status]} tone={o.status === 'ready' ? 'ok' : o.status === 'placed' ? 'soft' : 'normal'} />
            </View>
            <Body>{lines}</Body>
            <Small>{dateLabel(o.pickupDate)}, ready by {o.readyBy}{o.totalInr ? `, Rs ${o.totalInr.toLocaleString('en-IN')} at pickup` : ''}</Small>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {o.status === 'placed' ? <Button tone="leaf" label={busy === o.id ? 'Saving...' : 'Mark ready'} disabled={busy === o.id} onPress={() => void move(o, 'ready')} /> : null}
              {o.status === 'ready' ? <Button label={busy === o.id ? 'Saving...' : 'Picked up'} disabled={busy === o.id} onPress={() => void move(o, 'picked_up')} /> : null}
            </View>
            <SoftRule />
          </View>
        );
      })}
    </View>
  );
}
