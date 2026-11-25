// Partner profile: business details + "Switch to traveller view" + switch business.
import { router } from 'expo-router';
import { View } from 'react-native';
import bpJson from '../../../../seed/boarding-points.json';
import routesJson from '../../../../seed/routes.json';
import { useRole, roleStore } from '../../src/state/role';
import { Body, Button, H2, Screen, Section, Small } from '../../src/ui/kit';
import { partnerName } from '../../src/ui/logos';
import { TYPE_NAME } from '../../src/screens/partner/Onboard';
import { SwitchView } from '../../src/screens/partner/SwitchView';
import { enterTraveller } from '../../src/screens/partner/session';

const point = (id?: string) => bpJson.boardingPoints.find((b) => b.id === id)?.name.split(' (')[0];
const to = (id: string) => routesJson.routes.find((r) => r.id === id)?.to ?? id;

export default function PartnerProfile() {
  const { partner } = useRole();
  if (!partner) return null;
  return (
    <Screen demoTag title="Profile" subtitle={`${TYPE_NAME[partner.type]}${partner.registered ? ', registered from the app' : ', seeded demo business'}`}>
      <Section>
        <Body style={{ fontWeight: '700' }}>{partnerName(partner.name)}</Body>
        <Small>{partner.city ?? 'Bengaluru'}{point(partner.boardingPoint) ? ` - near ${point(partner.boardingPoint)}` : ''}</Small>
        {partner.routes?.length ? <Body>Routes: {partner.routes.map((r) => `BLR -> ${to(r)}`).join(', ')}</Body> : null}
        {partner.seatsPerNight ? <Body>Seats per night: {partner.seatsPerNight.toLocaleString('en-IN')}</Body> : null}
        {partner.items?.length ? (
          <>
            <H2>Menu</H2>
            {partner.items.map((i) => <Body key={i.id}>{i.name} - Rs {i.priceInr.toLocaleString('en-IN')} / {i.unit}</Body>)}
          </>
        ) : null}
      </Section>
      <View style={{ alignItems: 'center' }}>
        <Button tone="leaf" label="Switch to traveller view" hint="the guest traveller side, same device" onPress={enterTraveller} />
        <Button tone="plain" label="Choose another business" onPress={() => { roleStore.becomeTraveller(); router.replace('/welcome?partner=1'); }} />
      </View>
      <SwitchView />
      <Small style={{ marginTop: 16 }}>Demo: no passwords. Only totals of travellers are shown to businesses, never names or numbers.</Small>
    </Screen>
  );
}
