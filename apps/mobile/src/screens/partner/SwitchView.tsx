// Judge-friendly "Switch view: Traveller / Partner" control (no passwords in the demo).
import { router } from 'expo-router';
import { View } from 'react-native';
import { Chip, H2, Small } from '../../ui/kit';
import { partnerName } from '../../ui/logos';
import { useRole } from '../../state/role';
import { enterPartner, enterTraveller } from './session';

export function SwitchView() {
  const { role, partner } = useRole();
  return (
    <View testID="switch-view">
      <H2>Switch view</H2>
      <Small>Try both sides of Prasthan. Demo: no passwords.</Small>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <Chip label="Traveller" selected={role === 'traveller'} onPress={() => { if (role !== 'traveller') enterTraveller(); }} />
        <Chip label={partner ? `Partner: ${partnerName(partner.name)}` : 'Partner'} selected={role === 'partner'}
          onPress={() => { if (role === 'partner') return; if (partner) enterPartner(partner); else router.push('/welcome?partner=1'); }} />
      </View>
    </View>
  );
}
