// First launch: "I'm travelling home" (guest traveller, no login) or "I'm a partner" (pick or register a business).
// A device that chose partner before goes straight to the partner portal.
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Screen, Section, Small } from '../src/ui/kit';
import { Icon } from '../src/ui/icons';
import { PRIVACY_LINE } from '../src/screens/profile/ProfileForm';
import { PartnerOnboard } from '../src/screens/partner/Onboard';
import { useRole } from '../src/state/role';

export default function Welcome() {
  const role = useRole();
  const params = useLocalSearchParams<{ partner?: string }>();
  const [partner, setPartner] = useState(params.partner === '1');
  if (role.role === 'partner' && role.partner) return <Redirect href="/partner" />;
  if (partner) return <PartnerOnboard onBack={() => setPartner(false)} />;
  return (
    <Screen title="ಪ್ರಸ್ಥಾನ Prasthan" subtitle="Your festival trip home, in your own language.">
      <Section>
        <Body>Tell us your home town once. Then just say "Friday night" and we fill in the rest, link you to the official booking sites, and tell you when a new bus opens.</Body>
      </Section>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Button label="I'm travelling home" hint="continue as guest, no sign-up, no OTP" icon={<Icon name="bus" />} onPress={() => router.push('/profile')} />
        <Button tone="plain" label="I'm a partner" hint="bus operator, sweet shop or quick commerce" icon={<Icon name="shop" />} onPress={() => setPartner(true)} />
        <Small style={{ textAlign: 'center', marginTop: 8 }}>{PRIVACY_LINE}</Small>
        <Small style={{ textAlign: 'center' }}>Demo: no passwords. Switch between the two views any time from About or Profile.</Small>
      </View>
    </Screen>
  );
}
