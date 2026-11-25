// Gifting add-on (behind the Flagsmith flag gifting_enabled, staged rollout): pre-order sweets near the boarding point.
import { useState } from 'react';
import type { TripIntent } from '@contract';
import { api } from '../../api';
import { colors } from '../../theme/tokens';
import { Body, Button, Glass, H2, Small } from '../../ui/kit';

export function GiftCard({ intent }: { intent: TripIntent }) {
  const [done, setDone] = useState<string | null>(null);
  const qty = intent.gift?.qty ?? 2;
  const order = async () => {
    const res = await api.giftOrder({ travellerId: intent.travellerId, partnerId: 'shop-majestic', itemId: intent.gift?.itemId ?? 'mysore-pak', qty, pickupDate: intent.dateFrom ?? '2027-01-14', readyBy: '20:00', pickupPoint: 'MAJESTIC' });
    setDone(`Order ${res.order.id}: ready by ${res.order.readyBy}, pay at pickup (demo).`);
  };
  return (
    <Glass tintColor={colors.marigold}>
      <H2>Sweets for home?</H2>

      <Body>{qty} kg Mysore pak from Sihi Mane Sweets (demo shop), 4 min walk from Majestic. Ready before your bus.</Body>
      {done ? <Body style={{ color: colors.mangoLeaf }}>{done}</Body> : <Button label="Pre-order, pay at pickup" onPress={() => void order()} />}
      <Small>Shown to the gifting pilot group (Flagsmith staged rollout). No payment in the app.</Small>
    </Glass>
  );
}
